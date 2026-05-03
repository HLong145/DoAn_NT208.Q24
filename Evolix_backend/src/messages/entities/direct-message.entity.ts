import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';

@Entity('direct_messages')
@Index(['conversationId', 'createdAt'])
@Index(['conversationId', 'isRead', 'createdAt'])
export class DirectMessage {
  @PrimaryGeneratedColumn()
  id: number;

  @Index()
  @Column()
  conversationId: number;

  @Index()
  @Column()
  senderId: number;

  @Column('text')
  content: string;

  @Column({ default: false })
  isRead: boolean;

  @Column({ type: 'datetime', nullable: true })
  readAt: Date | null;

  @CreateDateColumn()
  createdAt: Date;
}