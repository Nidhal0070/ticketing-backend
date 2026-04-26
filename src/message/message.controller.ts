import { Controller, Post, Get, Body, Param } from '@nestjs/common';
import { MessagesService } from './message.service';

@Controller('tickets/:ticketId/messages')
export class MessagesController {

  constructor(private readonly messagesService: MessagesService) {}
  @Post()
  create(
    @Param('ticketId') ticketId: string,
    @Body('sender') sender: string,
    @Body('text') text: string
  ){
    return this.messagesService.create({
      ticketId,
      sender,
      text
    })
  }

  @Get()
  getMessages(@Param("ticketId") ticketId:string){
    return this.messagesService.getTicketMessages(ticketId)
  }
}
