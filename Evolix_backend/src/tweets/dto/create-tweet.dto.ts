import { IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateTweetDto {
  @IsOptional()
  @IsString()
  @MaxLength(280)
  content?: string;

  @IsOptional()
  @IsString()
  mediaUrls?: string;
}