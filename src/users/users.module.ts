import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { User, UserSchema } from './schemas/user.schema';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';

import { Ticket, TicketSchema } from '../tickets/schemas/ticket.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
       { name: User.name, schema: UserSchema },
       { name: Ticket.name, schema: TicketSchema },
    ])
  ],
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}
