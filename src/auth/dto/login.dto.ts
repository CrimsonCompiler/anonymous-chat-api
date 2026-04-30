import { IsString, Matches, Length } from 'class-validator';

export class LoginDto {
  @IsString()
  @Matches(/^[a-zA-Z0-9_]+$/, {
    message:
      'username can only contain alphanumeric characters and underscores',
  })
  @Length(2, 24, { message: 'username must be between 2 and 24 characters' })
  username!: string;
}
