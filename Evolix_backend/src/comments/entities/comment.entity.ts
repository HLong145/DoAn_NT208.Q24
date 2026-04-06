import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, Index } from 'typeorm';

@Entity('comments')
export class Comment {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  userId: number;

  // Index here to fetch all comments for a specific tweet under 500ms
  @Index()
  @Column()
  tweetId: number;

  @Column('text')
  content: string;

  @CreateDateColumn()
  createdAt: Date;
}