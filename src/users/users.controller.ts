import { 
  Controller, 
  Get, 
  Param, 
  Patch, 
  Delete, 
  UseGuards, 
  Req,
  Body,
  BadRequestException,
  NotFoundException 
} from '@nestjs/common';
import { UsersService } from './users.service';
import { AuthGuard } from '@nestjs/passport';
import { Roles } from '../auth/roles/decorator';
import { RolesGuard } from '../auth/roles/guard';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Ticket, TicketDocument } from '../tickets/schemas/ticket.schema';

@UseGuards(AuthGuard('jwt'), RolesGuard)
@Controller('users')
export class UsersController {
  constructor(
    private usersService: UsersService,
    @InjectModel(Ticket.name)
    private ticketModel: Model<TicketDocument>,
  ) {}

  // ✅ GET /users - Lister tous les utilisateurs (ADMIN ONLY)
  @Roles('admin')
  @Get()
  async getAllUsers() {
    console.log('📋 [USERS-CONTROLLER] GET /users - Fetching all users');
    const users = await this.usersService.findAll();
    
    // Compter les tickets par utilisateur
    const usersWithTickets = await Promise.all(
      users.map(async (user) => {
        const ticketCount = await this.ticketModel.countDocuments({ userId: user._id });
        return {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          isBlocked: user.isBlocked || false,
          lastLogin: user.lastLogin || null,
          ticketCount
        };
      })
    );
    
    return usersWithTickets;
  }

  // ✅ GET /users/:id - Détails d'un utilisateur + ses tickets (ADMIN ONLY)
  @Roles('admin')
  @Get(':id')
  async getUserById(@Param('id') id: string) {
    console.log('👤 [USERS-CONTROLLER] GET /users/:id - Fetching user:', id);
    
    const user = await this.usersService.findById(id);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Récupérer les tickets de l'utilisateur
    const tickets = await this.ticketModel.find({ userId: id }).select('-userId').exec();

    return {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      isBlocked: user.isBlocked || false,
      lastLogin: user.lastLogin || null,
      createdAt: user.createdAt,
      tickets: tickets.map(t => ({
        id: t._id,
        title: t.title,
        status: t.status,
        priority: t.priority,
        createdAt: t.createdAt
      }))
    };
  }

  // ✅ PATCH /users/:id/block - Bloquer un utilisateur (ADMIN ONLY)
  @Roles('admin')
  @Patch(':id/block')
  async blockUser(
    @Param('id') id: string,
    @Req() req: any
  ) {
    console.log('🚫 [USERS-CONTROLLER] PATCH /users/:id/block - Blocking user:', id);
    
    // Vérifier qu'un admin ne peut pas se bloquer soi-même
    if (req.user.userId === id) {
      throw new BadRequestException('You cannot block yourself');
    }

    return this.usersService.blockUser(id);
  }

  // ✅ PATCH /users/:id/unblock - Débloquer un utilisateur (ADMIN ONLY)
  @Roles('admin')
  @Patch(':id/unblock')
  async unblockUser(
    @Param('id') id: string,
    @Req() req: any
  ) {
    console.log('✅ [USERS-CONTROLLER] PATCH /users/:id/unblock - Unblocking user:', id);
    
    return this.usersService.unblockUser(id);
  }

  // ✅ PATCH /users/:id/role - Changer le rôle d'un utilisateur (ADMIN ONLY)
  @Roles('admin')
  @Patch(':id/role')
  async changeUserRole(
    @Param('id') id: string,
    @Body() body: { role: string },
    @Req() req: any
  ) {
    console.log('🔄 [USERS-CONTROLLER] PATCH /users/:id/role - Changing role for user:', id);
    
    // Vérifier qu'un admin ne peut pas changer son propre rôle
    if (req.user.userId === id) {
      throw new BadRequestException('You cannot change your own role');
    }

    const newRole = body?.role;
    if (!newRole) {
      throw new BadRequestException('Role is required');
    }

    return this.usersService.changeRole(id, newRole);
  }

  // ✅ DELETE /users/:id - Supprimer un utilisateur (ADMIN ONLY)
  @Roles('admin')
  @Delete(':id')
  async deleteUser(
    @Param('id') id: string,
    @Req() req: any
  ) {
    console.log('🗑️  [USERS-CONTROLLER] DELETE /users/:id - Deleting user:', id);
    
    // Vérifier qu'un admin ne peut pas se supprimer soi-même
    if (req.user.userId === id) {
      throw new BadRequestException('You cannot delete yourself');
    }

    // Supprimer tous les tickets de l'utilisateur
    await this.ticketModel.deleteMany({ userId: id });
    console.log('📋 [USERS-CONTROLLER] All tickets deleted for user:', id);

    return this.usersService.deleteUser(id);
  }
}
