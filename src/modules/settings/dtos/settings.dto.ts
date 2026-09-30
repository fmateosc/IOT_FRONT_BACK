import { IsInt, IsOptional, IsString, Length } from 'class-validator';

export class GeneralSettinsDto {
  @IsString()
  @Length(1, 100)
  timezone: string;

  @IsOptional()
  @IsString()
  @Length(0, 100)
  emqxApiKey?: string;

  @IsOptional()
  @IsString()
  @Length(0, 500)
  emqxApiSecretKey?: string;

  @IsOptional()
  @IsString()
  @Length(0, 100)
  emqxAppHost?: string;

  @IsOptional()
  @IsInt()
  emqxAppPort?: number;

  @IsOptional()
  @IsString()
  @Length(0, 100)
  mqttApiUser?: string;

  @IsOptional()
  @IsString()
  @Length(0, 100)
  mqttApiPassword?: string;

  @IsOptional()
  @IsInt()
  mqttApiPort?: number;

  @IsOptional()
  @IsString()
  @Length(0, 500)
  telegramBotToken?: string;
}
