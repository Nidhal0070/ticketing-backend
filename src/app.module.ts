import { Module, OnModuleInit } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TicketsModule } from './tickets/tickets.module';
import { MessagesModule } from './message/message.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { UsersService } from './users/users.service';
import { AiModule } from './IA/ai.module';  


@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }), 
    MongooseModule.forRootAsync({
      useFactory: (configService: ConfigService) => ({
        uri: configService.get<string>('MONGO_URI'),
      }),
      inject: [ConfigService],
    }),
    TicketsModule,
    MessagesModule,
    AuthModule,
    UsersModule,
    AiModule,
  ],
})
export class AppModule implements OnModuleInit {
  constructor(private usersService: UsersService) {}

  async onModuleInit() {
    const adminEmail = "nidhal07@test.com";
    const adminPassword = "nidhal123";
    
    console.log('👤 [APP-MODULE] Initializing admin user...');
    
    try {
      // ✅ Supprimer l'utilisateur existant s'il y en a un
      await this.usersService.deleteByEmail(adminEmail);
      console.log('🔄 [APP-MODULE] Old admin user deleted (if existed)');

      // ✅ Créer un nouvel utilisateur admin avec un mot de passe hashé correct
      const bcrypt = require('bcrypt');
      const hashedPassword = await bcrypt.hash(adminPassword, 10);
      
      console.log('🔐 [APP-MODULE] Password hashed with bcrypt, creating new admin user...');
      
      await this.usersService.create({
        name: "Admin",
        email: adminEmail,
        password: hashedPassword,  
        role: "admin"
      });
      console.log("✅ [APP-MODULE] Admin user created successfully with fresh password");
    } catch (error) {
      console.error("❌ [APP-MODULE] Error during admin initialization:", error.message);
    }
  }
}