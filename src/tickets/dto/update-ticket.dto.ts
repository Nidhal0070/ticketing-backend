import { IsString, IsOptional, IsBoolean } from 'class-validator';

export class UpdateTicketDto {
  @IsString()
  @IsOptional()
  title?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  status?: string;

  @IsString()
  @IsOptional()
  priority?: string;

  @IsString()
  @IsOptional()
  aiSummary?: string;

  @IsString()
  @IsOptional()
  category?: string;

  @IsString()
  @IsOptional()
  suggestedReply?: string;

  @IsBoolean()
  @IsOptional()
  needsAdmin?: boolean;

  @IsString()
  @IsOptional()
  escalationReason?: string;
}