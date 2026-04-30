import { IsString, MaxLength, MinLength } from 'class-validator';
import { Transform } from 'class-transformer';

export class SendMessageDto {
  @IsString()
  @Transform(({ value }) => value?.trim())
  @MinLength(1, {
    message: 'Message content cannot be empty',
    context: { errorCode: 'CONTENT_EMPTY' },
  })
  @MaxLength(1000, {
    message: 'Message content must not exceed 1000 characters',
    context: { errorCode: 'MESSAGE_TOO_LONG' },
  })
  content!: string;
}
