import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { TicketsService } from './tickets.service';
import { TicketsController } from './tickets.controller';
import { Ticket, TicketSchema } from './schemas/ticket.schema';
import { User, UserSchema } from '../users/schemas/user.schema';
import { AiModule} from '../IA/ai.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Ticket.name, schema: TicketSchema },
       { name: User.name, schema: UserSchema },
    ]),
    AiModule, 
  ],
  controllers: [TicketsController],
  providers: [TicketsService],
})
export class TicketsModule {}
