import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from './schemas/user.schema';

@Injectable()
export class UsersService {

  constructor(
    @InjectModel(User.name)
    private userModel: Model<UserDocument>,
  ) {}

  async findByEmail(email: string) {
    console.log('🔍 [USERS-SERVICE] Searching for user by email:', email);
    try {
      const user = await this.userModel.findOne({ email });
      if (user) {
        console.log('✅ [USERS-SERVICE] User found:', { id: user._id, email: user.email, role: user.role });
      } else {
        console.warn('⚠️  [USERS-SERVICE] No user found for email:', email);
      }
      return user;
    } catch (error) {
      console.error('❌ [USERS-SERVICE] Error searching user by email:', error.message);
      throw error;
    }
  }

  async create(data: any) {
    console.log('➕ [USERS-SERVICE] Creating new user:', { email: data.email, name: data.name, role: data.role });
    try {
      const user = new this.userModel(data);
      const savedUser = await user.save();
      console.log('✅ [USERS-SERVICE] User created successfully:', { id: savedUser._id, email: savedUser.email });
      return savedUser;
    } catch (error) {
      console.error('❌ [USERS-SERVICE] Error creating user:', error.message);
      throw error;
    }
  }

  async findAll() {
    console.log('📋 [USERS-SERVICE] Fetching all users');
    return this.userModel.find().select('-password').exec();
  }

  async findById(id: string) {
    console.log('🔍 [USERS-SERVICE] Finding user by ID:', id);
    return this.userModel.findById(id).select('-password').exec();
  }

  async updatePassword(email: string, newHashedPassword: string) {
    console.log('🔄 [USERS-SERVICE] Updating password for email:', email);
    try {
      const result = await this.userModel.findOneAndUpdate(
        { email },
        { password: newHashedPassword },
        { new: true }
      );
      console.log('✅ [USERS-SERVICE] Password updated successfully for:', email);
      return result;
    } catch (error) {
      console.error('❌ [USERS-SERVICE] Error updating password:', error.message);
      throw error;
    }
  }

  async deleteByEmail(email: string) {
    console.log('🗑️  [USERS-SERVICE] Deleting user by email:', email);
    try {
      const result = await this.userModel.deleteOne({ email });
      console.log('✅ [USERS-SERVICE] User deleted:', { deletedCount: result.deletedCount });
      return result;
    } catch (error) {
      console.error('❌ [USERS-SERVICE] Error deleting user:', error.message);
      throw error;
    }
  }

  // ✅ NOUVEAU: Bloquer un utilisateur
  async blockUser(userId: string) {
    console.log('🚫 [USERS-SERVICE] Blocking user:', userId);
    try {
      const user = await this.userModel.findByIdAndUpdate(
        userId,
        { isBlocked: true },
        { new: true }
      );
      if (!user) throw new NotFoundException('User not found');
      if (user.role === 'admin') throw new BadRequestException('Cannot block an admin');
      
      console.log('✅ [USERS-SERVICE] User blocked:', userId);
      return user.toObject();
    } catch (error) {
      console.error('❌ [USERS-SERVICE] Error blocking user:', error.message);
      throw error;
    }
  }

  // ✅ NOUVEAU: Débloquer un utilisateur
  async unblockUser(userId: string) {
    console.log('✅ [USERS-SERVICE] Unblocking user:', userId);
    try {
      const user = await this.userModel.findByIdAndUpdate(
        userId,
        { isBlocked: false },
        { new: true }
      );
      if (!user) throw new NotFoundException('User not found');
      
      console.log('✅ [USERS-SERVICE] User unblocked:', userId);
      return user.toObject();
    } catch (error) {
      console.error('❌ [USERS-SERVICE] Error unblocking user:', error.message);
      throw error;
    }
  }

  // ✅ NOUVEAU: Changer le rôle d'un utilisateur
  async changeRole(userId: string, newRole: string) {
    console.log('🔄 [USERS-SERVICE] Changing role for user:', userId, 'to:', newRole);
    try {
      if (!['user', 'admin'].includes(newRole)) {
        throw new BadRequestException('Invalid role. Must be "user" or "admin"');
      }
      
      const user = await this.userModel.findByIdAndUpdate(
        userId,
        { role: newRole },
        { new: true }
      );
      if (!user) throw new NotFoundException('User not found');
      
      console.log('✅ [USERS-SERVICE] User role changed:', { userId, newRole });
      return user.toObject();
    } catch (error) {
      console.error('❌ [USERS-SERVICE] Error changing role:', error.message);
      throw error;
    }
  }

  // ✅ NOUVEAU: Supprimer un utilisateur et ses données
  async deleteUser(userId: string) {
    console.log('🗑️  [USERS-SERVICE] Deleting user and their data:', userId);
    try {
      const user = await this.userModel.findById(userId);
      if (!user) throw new NotFoundException('User not found');
      if (user.role === 'admin') throw new BadRequestException('Cannot delete an admin');
      
      // Les tickets seront supprimés côté controller avec cascade
      const result = await this.userModel.findByIdAndDelete(userId);
      if (!result) throw new NotFoundException('User not found during deletion');
      console.log('✅ [USERS-SERVICE] User deleted:', userId);
      return result.toObject();
    } catch (error) {
      console.error('❌ [USERS-SERVICE] Error deleting user:', error.message);
      throw error;
    }
  }

  // ✅ NOUVEAU: Mettre à jour lastLogin
  async updateLastLogin(userId: string) {
    try {
      await this.userModel.findByIdAndUpdate(
        userId,
        { lastLogin: new Date() },
        { new: true }
      );
    } catch (error) {
      console.error('❌ [USERS-SERVICE] Error updating lastLogin:', error.message);
    }
  }
}