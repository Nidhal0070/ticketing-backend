import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Message } from './schema';
import { Model } from 'mongoose';

@Injectable()
export class MessagesService {

  constructor(
    @InjectModel(Message.name)
    private messageModel: Model<Message>,
  ) {}

 async create(data:any){
const msg = new this.messageModel(data)
return msg.save()
}

async getTicketMessages(ticketId:string){
return this.messageModel.find({ticketId})
}

}