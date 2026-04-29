import { Injectable, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {

  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
  ) {}

  async register(body: any) {
    //  1. verifier le user exist
    const existingUser = await this.usersService.findByEmail(body.email);
    if (existingUser) {
      throw new BadRequestException('Email already exists');
    }
  
    //2.verifier le password
    if (!body.password || body.password.length < 6) {
      throw new BadRequestException('Password must be at least 6 characters');
    }

    //  3.verifier le format de l'email 
    const emailRegex = /\S+@\S+\.\S+/;
    if (!emailRegex.test(body.email)) {
      throw new BadRequestException('Please enter a valid email address');
    }

    // 4. verifier le nom
    if (!body.name || body.name.trim().length < 2) {
      throw new BadRequestException('Name must be at least 2 characters');
    }

    //  5. Hash password
    const hashedPassword = await bcrypt.hash(body.password, 10);

    //  6. Prendre le rôle du body, sinon "user" par défaut
    const role = body.role || 'user';

    try {
      const user = await this.usersService.create({
        name: body.name.trim(),
        email: body.email.toLowerCase().trim(),
        password: hashedPassword,
        role: role,
      });

      return {
        message: "User created successfully",
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role
        }
      };
    } catch (error) {
      //  7. Gestion des erreurs de base de données
      if (error.code === 11000) {
        throw new BadRequestException('Email already exists');
      }
      throw new BadRequestException('Registration failed. Please try again.');
    }
  }

  async login(data: any) {
    console.log('🔑 [AUTH-SERVICE] Login started for email:', data.email);
    
    //  1. Vérifier si l'email est fourni
    if (!data.email || !data.password) {
      console.error('❌ [AUTH-SERVICE] Email or password missing');
      throw new UnauthorizedException('Email and password are required');
    }

    const normalizedEmail = data.email.toLowerCase().trim();
    console.log('📧 [AUTH-SERVICE] Searching for user with email:', normalizedEmail);

    //  2. Chercher l'utilisateur
    const user = await this.usersService.findByEmail(normalizedEmail);
    console.log('👤 [AUTH-SERVICE] User found:', user ? `${user.email} (role: ${user.role})` : 'NOT FOUND');
    
    if (!user) {
      console.error('❌ [AUTH-SERVICE] No user found with email:', normalizedEmail);
      throw new UnauthorizedException('Invalid email or password');
    }

    //  3. Vérifier le mot de passe
    console.log('🔒 [AUTH-SERVICE] Verifying password...');
    const isMatch = await bcrypt.compare(data.password, user.password);
    console.log('✓ [AUTH-SERVICE] Password match result:', isMatch);
    
    if (!isMatch) {
      console.error('❌ [AUTH-SERVICE] Password mismatch for user:', normalizedEmail);
      throw new UnauthorizedException('Invalid email or password');
    }

    //  4. Mettre à jour le lastLogin
    console.log('📅 [AUTH-SERVICE] Updating lastLogin for user:', normalizedEmail);
    try {
      await this.usersService.updateLastLogin(user._id.toString());
      console.log('✅ [AUTH-SERVICE] lastLogin updated successfully');
    } catch (error) {
      console.warn('⚠️  [AUTH-SERVICE] Failed to update lastLogin:', error.message);
      // Continue even if this fails - not critical
    }

    // 5. Générer le token
    console.log('🎫 [AUTH-SERVICE] Generating JWT token...');
    const payload = { sub: user._id, email: user.email, role: user.role };
    const token = this.jwtService.sign(payload);
    console.log('✅ [AUTH-SERVICE] Login successful for user:', normalizedEmail);

    return {
      access_token: token,
      role: user.role,
      userId: user._id,
      email: user.email,
      name: user.name
    };
  }
}