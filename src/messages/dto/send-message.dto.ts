import { IsString, MaxLength, MinLength } from 'class-validator';
import { Transform } from 'class-transformer';

export class SendMessageDto {
  @IsString()
  @Transform(({ value }) => value?.trim())
  @MinLength(1, { message: 'Content cannot be empty' })
  @MaxLength(1000, { message: 'Content exceeds 1000 characters limit' })
  content!: string;
}
