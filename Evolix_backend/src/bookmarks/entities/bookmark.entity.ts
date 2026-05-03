import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, Index } from 'typeorm';

@Entity('bookmarks')
@Index(['userId', 'createdAt'])
@Index(['userId', 'tweetId'], { unique: true })
export class Bookmark {
  @PrimaryGeneratedColumn()
  id: number;

  @Index()
  @Column()
  userId: number;

  @Index()
  @Column()
  tweetId: number;

  @CreateDateColumn()
  createdAt: Date;
}