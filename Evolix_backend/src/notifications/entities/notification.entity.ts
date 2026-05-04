import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, Index } from 'typeorm';

export type NotificationType = 'like' | 'follow' | 'reply' | 'tweet' | 'message';

@Entity('notifications')
@Index(['recipientId', 'createdAt'])
@Index(['recipientId', 'isRead', 'createdAt'])
export class Notification {
  @PrimaryGeneratedColumn()
  id: number;

  @Index()
  @Column()
  recipientId: number;

  @Index()
  @Column()
  actorId: number;

  @Index()
  @Column({ type: 'varchar', length: 16 })
  type: NotificationType;

  @Column({ type: 'int', nullable: true })
  tweetId: number | null;

  @Column({ type: 'text', nullable: true })
  content: string | null;

  @Column({ default: false })
  isRead: boolean;

  @CreateDateColumn()
  createdAt: Date;
}