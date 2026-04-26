import { IsString, IsNotEmpty, IsOptional,IsIn } from 'class-validator';

export class CreateTicketDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsOptional()
  description?: string;
  
  @IsString()
  @IsOptional()
  userId?: string;

  @IsString()
  @IsOptional()
   @IsIn(['low', 'medium', 'high'])
  priority?: string;

  @IsOptional()
  source?: string; // ✅ NOUVEAU
}