import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  Patch,
  UseGuards,
  Req,
} from '@nestjs/common';
import { TicketsService } from './tickets.service';
import { CreateTicketDto } from './dto/create-ticket.dto';
import { UpdateTicketDto } from './dto/update-ticket.dto';
import { AuthGuard } from '@nestjs/passport';
import { Roles } from '../auth/roles/decorator';
import { RolesGuard } from '../auth/roles/guard';
import { AiService } from '../IA/ai.service';


interface AnalysisResult {
  id: any;
  title: string;
  suggestedReply: string;
  priority: string;
  category: string;
}

@UseGuards(AuthGuard('jwt'), RolesGuard)
@Controller('tickets')
export class TicketsController {
  constructor(
    private readonly ticketsService: TicketsService,
    private readonly aiService: AiService,   // ✅ inject AiService
  ) {}

  // user ينجم يعمل ticket
  @Roles('user','admin')
  @Post()
  create(@Body() dto: CreateTicketDto, @Req() req: any) {
    return this.ticketsService.create(dto, req.user.userId);
  }

  // admin يشوف كل tickets
  @Roles('admin')
  @Get()
  findAll() {
    return this.ticketsService.findAll();
  }

  // 
  @Roles('user','admin')
  @Get("my")
  getMyTickets(@Req() req: any) {
    return this.ticketsService.getUserTickets(req.user.userId);
  }

  // user or admin execute ticketdetails
  @Roles('user','admin')
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.ticketsService.findOne(id);
  }

  // admin update status
  @Roles('admin')
  @Patch(":id/status")
  updateStatus(@Param("id") id: string, @Body("status") status: string) {
    return this.ticketsService.updateStatus(id, status);
  }

  // admin  change ticket
  @Roles('admin')
  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateTicketDto) {
    return this.ticketsService.update(id, dto);
  }

  // admin supprime ticket
  @Roles('admin')
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.ticketsService.remove(id);
  }

  //  NEW: AI analysis for conversation (admin only)
  @Roles('admin')
  @Post(':id/analyze')
  async analyzeTicketFromDashboard(
    @Param('id') id: string,
    @Body() body: { messages: any[]; ticketInfo: any },
  ) {
   const ticket = await this.ticketsService.findOne(id);
    
    let suggestion = "";
    let priority = ticket.priority;
    let category = ticket.category;
    let suggestedReply = "";
    try {
      // If there are messages (from chat), analyze conversation
      if (body.messages && body.messages.length > 0) {
        const result = await this.aiService.analyzeConversation(
          body.messages,
          { ...ticket, ...body.ticketInfo }
        );
      } else {
        // Otherwise, analyze ticket directly (from Dashboard)
        //  IMPORTANT: Pass ticketId so notifyAdmin() is called if needed
        const analysis = await this.aiService.analyzeTicket(
          ticket.title,
          ticket.description || "",
          [],
          id  // Pass ticketId here!
        );
         console.log("📥 Analysis received:", JSON.stringify(analysis));

         if (typeof analysis === 'object' && analysis.suggestedReply) {
          suggestedReply = analysis.suggestedReply;
          priority = analysis.priority || ticket.priority;
          category = analysis.category || ticket.category;
          suggestion = analysis.suggestedReply;
        } else if (typeof analysis === 'string') {
          suggestion = analysis;
          suggestedReply = analysis;
        } else {
        suggestion = analysis.suggestedReply || "No suggestion available.";
        suggestedReply = analysis.suggestedReply || "";
        priority = analysis.priority || ticket.priority;
        category = analysis.category || ticket.category;
      }
    }
    } catch (error) {
      console.error('AI analysis error:', error);
      suggestion = "Unable to analyze at this time.";
      suggestedReply = "Unable to analyze at this time.";

    }
    console.log("💾 Updating ticket:", { id, suggestedReply, priority, category });
    
    // Update ticket with analysis results
    await this.ticketsService.update(id, {
      aiSummary: suggestion.substring(0, 200),
      priority: priority,
      category: category,
      suggestedReply: suggestedReply
    });
    
    return { suggestion, priority, category };
  }
  // داخل الـ class TicketsController
  @Roles('admin')
  @Post('analyze-all')
  async analyzeAllTickets() {
    const tickets = await this.ticketsService.findAll();
    const results: AnalysisResult[] = [];
    
    for (const ticket of tickets) {
      try {
        //  IMPORTANT: Pass ticketId so notifyAdmin() is called if needed
        const analysis = await this.aiService.analyzeTicket(
          ticket.title,
          ticket.description || "",
          [],
          ticket._id.toString()  // ✅ Pass ticketId here!
        );
        
        await this.ticketsService.update(ticket._id.toString(), {
          aiSummary: analysis.suggestedReply?.substring(0, 200) || "",
          priority: analysis.priority || ticket.priority,
          category: analysis.category || ticket.category,
          suggestedReply: analysis.suggestedReply || "",
          needsAdmin: analysis.needsAdmin || false,
          escalationReason: analysis.escalationReason || ""
        });
        
        results.push({
          id: ticket._id.toString(),
          title: ticket.title,
          suggestedReply: analysis.suggestedReply,
          priority: analysis.priority,
          category: analysis.category
        });
      } catch (error) {
        console.error(`Failed to analyze ticket ${ticket._id}:`, error);
      }
    }
    
    return { message: `Analyzed ${results.length} tickets`, results };
  }
}
