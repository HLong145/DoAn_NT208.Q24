import { Entity, PrimaryColumn, CreateDateColumn, Index } from 'typeorm';

@Entity('follows')
// Index to lightning-fast query "Who is following this user?"
@Index(['followingId'])
export class Follow {
  // Primary key automatically creates an index for 'followerId' 
  // Great for querying "Who is this user following?"
  @PrimaryColumn()
  followerId: number;

  @PrimaryColumn()
  followingId: number;

  @CreateDateColumn()
  createdAt: Date;
}