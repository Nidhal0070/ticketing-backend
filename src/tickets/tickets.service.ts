import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Ticket, TicketDocument } from './schemas/ticket.schema';
import { CreateTicketDto } from './dto/create-ticket.dto';
import { UpdateTicketDto } from './dto/update-ticket.dto';
import { AiService } from '../IA/ai.service';
import { InjectModel as InjectUserModel } from '@nestjs/mongoose';
import { User, UserDocument } from '../users/schemas/user.schema';

@Injectable()
export class TicketsService {
  constructor(
    @InjectModel(Ticket.name)
    private ticketModel: Model<TicketDocument>,
    @InjectUserModel(User.name)
    private userModel: Model<UserDocument>,
    private aiService: AiService,
  ) {}

  async create(dto: CreateTicketDto, userId: string) {
     // 1. إنشاء تذكرة مؤقتة أولاً للحصول على المعرف (ID)
    const tempTicket = {
      ...dto,
      userId,
      priority: dto.priority ?? 'medium',
      category: 'other',
      suggestedReply: '',
      aiSummary: '',
      needsAdmin: false,
      escalationReason: '',
      analyzed: false
    };
    
    const savedTicket = await this.ticketModel.create(tempTicket);
    // 1. نبعث ticket للـ IA (تحليل تلقائي)
    let aiAnalysis = { 
      priority: dto.priority ?? 'medium', 
      category: 'other', 
      suggestedReply: '',
      needsAdmin: false,
      escalationReason: ''
    };
    
    try {
      const ai = await this.aiService.analyzeTicket(
        dto.title,
        dto.description || '',
        [],
        savedTicket._id.toString()  // تمرير المعرف لتوليد الإشعارات إذا لزم الأمر 
      );
      
      aiAnalysis = {
        priority: ai.priority || dto.priority || 'medium',
        category: ai.category || 'other',
        suggestedReply: ai.suggestedReply || '',
        needsAdmin: ai.needsAdmin || false,
        escalationReason: ai.escalationReason || ''
      };
    } catch (error) {
      console.error('IA analysis failed:', error);
    }

    // 2. نضيف result للticket
   savedTicket.priority = aiAnalysis.priority;
    savedTicket.category = aiAnalysis.category;
    savedTicket.suggestedReply = aiAnalysis.suggestedReply;
    savedTicket.aiSummary = aiAnalysis.suggestedReply?.substring(0, 100) || '';
    savedTicket.needsAdmin = aiAnalysis.needsAdmin;
    savedTicket.escalationReason = aiAnalysis.escalationReason;
    savedTicket.analyzed = true;

    // 3. نخزن في database
     return savedTicket.save();
  }

  async findAll() {
    const tickets = await this.ticketModel.find().sort({ createdAt: -1 });
    
    // ✅ Trier: les tickets avec needsAdmin = true en premier
    const sortedTickets = tickets.sort((a, b) => {
      if (a.needsAdmin && !b.needsAdmin) return -1;
      if (!a.needsAdmin && b.needsAdmin) return 1;
      return 0;
    });
    
    // جلب أسماء المستخدمين لكل تذكرة
    const ticketsWithUser = await Promise.all(
      sortedTickets.map(async (ticket) => {
        const user = await this.userModel.findById(ticket.userId).select('name');
        return {
          ...ticket.toObject(),
          userName: user?.name || 'Unknown'
        };
      })
    );
    
    return ticketsWithUser;
  }
// جلب تذكرة واحدة حسب المعرف
  async findOne(id: string) {
    const ticket = await this.ticketModel.findById(id);
    if (!ticket) throw new NotFoundException('Ticket not found');
    
    const user = await this.userModel.findById(ticket.userId).select('name');
    
    return {
      ...ticket.toObject(),
      userName: user?.name || 'Unknown'
    };
  }
  // تحديث تذكرة
  async update(id: string, dto: UpdateTicketDto) {
    const ticket = await this.ticketModel.findByIdAndUpdate(id, dto, {
      new: true,
    });
    if (!ticket) throw new NotFoundException('Ticket not found');
    return ticket;
  }
//supprimer ticket
  async remove(id: string) {
    const ticket = await this.ticketModel.findByIdAndDelete(id);
    if (!ticket) throw new NotFoundException('Ticket not found');
    return { message: 'Ticket deleted successfully' };
  }
//update statue ticket
  async updateStatus(id: string, status: string) {
    return this.ticketModel.findByIdAndUpdate(
      id,
      { status },
      { new: true }
    );
  }
//ticket d'un user 
  async getUserTickets(userId: string) {
    return this.ticketModel.find({ userId });
  }
}