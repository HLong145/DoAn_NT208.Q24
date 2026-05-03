import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { DirectMessageConversation } from './entities/direct-message-conversation.entity';
import { DirectMessageParticipant } from './entities/direct-message-participant.entity';
import { DirectMessage } from './entities/direct-message.entity';
import { UsersService } from '../users/users.service';
import { RealtimeGateway } from '../realtime/realtime.gateway';

type ConversationParticipant = {
  id: number;
  name: string;
  handle: string;
  avatar: string;
};

export type ConversationThread = {
  id: string;
  participant: ConversationParticipant;
  lastMessage: {
    id: string;
    content: string;
    timestamp: string;
    senderId: number;
    isMine: boolean;
  } | null;
  unreadCount: number;
  updatedAt: string;
};

export type ConversationMessageItem = {
  id: string;
  senderId: number;
  content: string;
  timestamp: string;
  isMine: boolean;
  isRead: boolean;
};

@Injectable()
export class MessagesService {
  constructor(
    @InjectRepository(DirectMessageConversation)
    private readonly conversationRepository: Repository<DirectMessageConversation>,
    @InjectRepository(DirectMessageParticipant)
    private readonly participantRepository: Repository<DirectMessageParticipant>,
    @InjectRepository(DirectMessage)
    private readonly messageRepository: Repository<DirectMessage>,
    private readonly usersService: UsersService,
    private readonly realtimeGateway: RealtimeGateway,
  ) {}

  async getThreads(userId: number): Promise<ConversationThread[]> {
    const participantRows = await this.participantRepository.find({ where: { userId } });
    const conversationIds = [...new Set(participantRows.map((row) => row.conversationId))];

    if (conversationIds.length === 0) {
      return [];
    }

    const conversations = await this.conversationRepository.find({
      where: { id: In(conversationIds) },
      order: { updatedAt: 'DESC' },
    });

    const participants = await this.participantRepository.find({
      where: { conversationId: In(conversationIds) },
    });

    const messages = await this.messageRepository.find({
      where: { conversationId: In(conversationIds) },
      order: { createdAt: 'DESC' },
    });

    const userIds = [...new Set(participants.map((participant) => participant.userId).filter((participantId) => participantId !== userId))];
    const users = await this.usersService.findManyByIds(userIds);
    const userMap = new Map<number, (typeof users)[number]>(users.map((user) => [user.id, user]));

    return conversations.flatMap<ConversationThread>((conversation) => {
      const threadParticipants = participants.filter((participant) => participant.conversationId === conversation.id);
      const partnerRow = threadParticipants.find((participant) => participant.userId !== userId);

      if (!partnerRow) {
        return [];
      }

      const partner = userMap.get(partnerRow.userId);
      if (!partner) {
        return [];
      }

      const lastMessage = messages.find((message) => message.conversationId === conversation.id) ?? null;
      const unreadCount = messages.filter((message) => message.conversationId === conversation.id && message.senderId !== userId && !message.isRead).length;
      const avatarSeed = encodeURIComponent(String(partner.username));

      return [{
        id: conversation.id.toString(),
        participant: {
          id: partner.id,
          name: partner.username,
          handle: partner.username,
          avatar: `https://i.pravatar.cc/150?u=${avatarSeed}`,
        },
        lastMessage: lastMessage ? {
          id: lastMessage.id.toString(),
          content: lastMessage.content,
          timestamp: this.formatRelativeTime(lastMessage.createdAt),
          senderId: lastMessage.senderId,
          isMine: lastMessage.senderId === userId,
        } : null,
        unreadCount,
        updatedAt: this.formatRelativeTime(conversation.updatedAt),
      }];
    });
  }

  async createOrGetConversation(userId: number, participantId: number) {
    if (!Number.isFinite(participantId) || participantId === userId) {
      throw new BadRequestException('Invalid participant');
    }

    const existing = await this.findExistingConversation(userId, participantId);
    if (existing) {
      return existing;
    }

    const participantUser = await this.usersService.findOne(participantId);
    const conversation = await this.conversationRepository.save(this.conversationRepository.create({}));

    await this.participantRepository.save([
      this.participantRepository.create({ conversationId: conversation.id, userId }),
      this.participantRepository.create({ conversationId: conversation.id, userId: participantId }),
    ]);

    return {
      id: conversation.id.toString(),
      participant: {
        id: participantUser.id,
        name: participantUser.username,
        handle: participantUser.username,
        avatar: `https://i.pravatar.cc/150?u=${encodeURIComponent(participantUser.username)}`,
      },
      lastMessage: null,
      unreadCount: 0,
      updatedAt: this.formatRelativeTime(conversation.updatedAt),
    } as ConversationThread;
  }

  async getMessages(userId: number, conversationId: number): Promise<ConversationMessageItem[]> {
    await this.assertParticipant(userId, conversationId);

    const messages = await this.messageRepository.find({
      where: { conversationId },
      order: { createdAt: 'ASC' },
    });

    const unreadMessages = messages.filter((message) => message.senderId !== userId && !message.isRead);
    if (unreadMessages.length > 0) {
      for (const message of unreadMessages) {
        message.isRead = true;
        message.readAt = new Date();
      }

      await this.messageRepository.save(unreadMessages);
    }

    return messages.map((message) => ({
      id: message.id.toString(),
      senderId: message.senderId,
      content: message.content,
      timestamp: this.formatRelativeTime(message.createdAt),
      isMine: message.senderId === userId,
      isRead: message.isRead,
    }));
  }

  async sendMessage(userId: number, conversationId: number, content: string) {
    if (!content.trim()) {
      throw new BadRequestException('Message cannot be empty');
    }

    await this.assertParticipant(userId, conversationId);

    const message = await this.messageRepository.save(this.messageRepository.create({
      conversationId,
      senderId: userId,
      content: content.trim(),
      isRead: false,
      readAt: null,
    }));

    await this.conversationRepository.update(conversationId, { updatedAt: new Date() });

    const partnerIds = await this.getParticipantIds(conversationId, userId);
    const payload = {
      conversationId: conversationId.toString(),
      message: {
        id: message.id.toString(),
        senderId: userId,
        content: message.content,
        timestamp: this.formatRelativeTime(message.createdAt),
        isMine: true,
      },
    };

    for (const partnerId of partnerIds) {
      this.realtimeGateway.emitToUser(partnerId.toString(), 'message.created', payload);
    }

    return payload;
  }

  private async findExistingConversation(userId: number, participantId: number) {
    const userConversations = await this.participantRepository.find({ where: { userId } });
    const participantConversations = await this.participantRepository.find({ where: { userId: participantId } });
    const participantConversationIds = new Set(participantConversations.map((row) => row.conversationId));
    const existingConversation = userConversations.find((row) => participantConversationIds.has(row.conversationId));

    if (!existingConversation) {
      return null;
    }

    const participantUser = await this.usersService.findOne(participantId);
    const conversation = await this.conversationRepository.findOne({ where: { id: existingConversation.conversationId } });

    if (!conversation) {
      return null;
    }

    return {
      id: conversation.id.toString(),
      participant: {
        id: participantUser.id,
        name: participantUser.username,
        handle: participantUser.username,
        avatar: `https://i.pravatar.cc/150?u=${encodeURIComponent(participantUser.username)}`,
      },
      lastMessage: null,
      unreadCount: 0,
      updatedAt: this.formatRelativeTime(conversation.updatedAt),
    } as ConversationThread;
  }

  private async assertParticipant(userId: number, conversationId: number) {
    const participant = await this.participantRepository.findOne({ where: { conversationId, userId } });

    if (!participant) {
      throw new NotFoundException('Conversation not found');
    }
  }

  private async getParticipantIds(conversationId: number, excludeUserId: number) {
    const participants = await this.participantRepository.find({ where: { conversationId } });
    return participants.map((participant) => participant.userId).filter((participantId) => participantId !== excludeUserId);
  }

  private formatRelativeTime(createdAt: Date) {
    const diffInSeconds = Math.max(0, Math.floor((Date.now() - new Date(createdAt).getTime()) / 1000));

    if (diffInSeconds < 60) {
      return `${diffInSeconds}s`;
    }

    const diffInMinutes = Math.floor(diffInSeconds / 60);
    if (diffInMinutes < 60) {
      return `${diffInMinutes}m`;
    }

    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) {
      return `${diffInHours}h`;
    }

    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays}d`;
  }
}