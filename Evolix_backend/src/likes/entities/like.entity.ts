import { Entity, PrimaryColumn, CreateDateColumn } from 'typeorm';

@Entity('likes')
export class Like {
  @PrimaryColumn({ name: 'user_id' })
  userId: number;

  @PrimaryColumn({ name: 'tweet_id' })
  tweetId: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}