import { IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateTweetDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(280)
  content: string;

  @IsOptional()
  @IsString()
  mediaUrls?: string;
}