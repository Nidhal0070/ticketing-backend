import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import { AiService } from './ai.service';

@Controller('ai')
export class AiController {

  constructor(private readonly aiService: AiService) {}

  // test endpoint (خليه)
  @Get("test")
  test() {
    return this.aiService.analyzeTicket(
      "server down urgent",
      "app not working",
      []
    );
  }

  // 🔥 AI ANALYZE الحقيقي
  @Post('analyze')
  async analyze(@Body() body: any) {

    const { messages, ticketInfo } = body;

    const result = await this.aiService.analyzeTicket(
      ticketInfo.title,
      ticketInfo.description,
      messages
    );

    return {
      suggestion: result
    };
  }
}