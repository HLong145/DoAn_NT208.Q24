import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';

@Entity('direct_message_participants')
@Index(['conversationId', 'userId'], { unique: true })
export class DirectMessageParticipant {
  @PrimaryGeneratedColumn()
  id: number;

  @Index()
  @Column()
  conversationId: number;

  @Index()
  @Column()
  userId: number;

  @CreateDateColumn()
  createdAt: Date;
}