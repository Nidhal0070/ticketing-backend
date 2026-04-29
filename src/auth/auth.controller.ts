import { Controller, Post, Body,Get,Patch,Param } from '@nestjs/common';
import { AuthService } from './auth.service';

export const notificationsStore: any[] = [];

@Controller('auth')
export class AuthController {

constructor(private authService: AuthService){}

@Post('register')
register(@Body() body:any){
return this.authService.register(body)
}

@Post('login')
login(@Body() body:any){
  console.log('🔐 [AUTH] Login attempt received:', { email: body.email, timestamp: new Date().toISOString() });
  console.log('📨 [AUTH] Request body:', JSON.stringify(body, null, 2));
  return this.authService.login(body);
}
 // Nouveau: L'IA appelle cet endpoint pour notifier l'admin
  @Post('notify-admin')
  notifyAdmin(@Body() body: { ticketId: string; reason: string; urgency: string; title?: string }) {
    const notification = {
      id: Date.now(),
      ticketId: body.ticketId,
      title: body.title || `Ticket #${body.ticketId.slice(-6)}`,
      message: `⚠️ L'IA demande votre intervention. Raison: ${body.reason}`,
      urgency: body.urgency || 'medium',
      read: false,
      createdAt: new Date()
    };
    
    notificationsStore.push(notification);
    console.log(`📧 Notification créée: ${notification.message}`);
    
    return { message: 'Admin notifié avec succès', notification };
  }

  // Nouveau: Récupérer toutes les notifications non lues
  @Get('notifications')
  getNotifications() {
    return notificationsStore.filter(n => !n.read);
  }

  //  Nouveau: Marquer une notification comme lue
  @Patch('notifications/:id/read')
  markNotificationAsRead(@Param('id') id: string) {
    const notification = notificationsStore.find(n => n.id.toString() === id);
    if (notification) {
      notification.read = true;
    }
    return { message: 'Notification marquée comme lue' };
  }

}  
