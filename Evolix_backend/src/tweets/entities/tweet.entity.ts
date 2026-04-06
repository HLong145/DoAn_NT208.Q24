import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, Index } from 'typeorm';

// Composite Index: Supercharges querying tweets by a specific user AND sorting them by time
// Essential for lightning-fast Fan-out timeline generation!
@Entity('tweets')
@Index(['userId', 'createdAt'])
export class Tweet {
  @PrimaryGeneratedColumn()
  id: number;

  // Single Index: Speeds up finding all tweets belonging to a specific user
  @Index()
  @Column()
  userId: number;

  @Column('text')
  content: string;

  // mediaUrls allows null as some tweets might only contain text
  @Column({ type: 'varchar', nullable: true })
  mediaUrls: string;

  // Flags if this entity is a retweet
  @Column({ default: false })
  isRetweet: boolean;

  // Stores the ID of the original tweet if this is a retweet
  @Column({ nullable: true })
  originalTweetId: number;

  // Cached counter to avoid expensive COUNT() queries
  @Column({ default: 0 })
  likeCount: number;

  // Cached counter for comments
  @Column({ default: 0 })
  commentCount: number;

  @CreateDateColumn()
  createdAt: Date;
}