import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';      //  import HttpModule
import { AiService } from './ai.service';
import { AiController } from './ai.controller';

@Module({
  imports: [HttpModule],      
  providers: [AiService],
  controllers: [AiController],
  exports: [AiService],
})
export class AiModule {}