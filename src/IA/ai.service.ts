import { Injectable } from '@nestjs/common';
import OpenAI from 'openai';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class AiService {
  private openai: OpenAI;
  private backendUrl: string;

  constructor(private readonly httpService: HttpService) {
    this.openai = new OpenAI({
      apiKey: process.env.GROQ_API_KEY,
      baseURL: "https://api.groq.com/openai/v1"
    });
    
    // Pour Docker: utiliser le nom du service "backend"
    //  Pour local: utiliser "localhost"
    this.backendUrl = process.env.BACKEND_URL || 'http://backend:3000';
  }

  async analyzeConversation(messages: any[], ticketInfo?: any) {
    const conversation = messages.map(m => `${m.sender}: ${m.text}`).join('\n');
    const prompt = `Analyse cette conversation et donne un conseil utile pour l'admin (2-3 phrases):\n${conversation}`;
    
    try {
      const response = await this.openai.chat.completions.create({
        model: "llama-3.3-70b-versatile",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.7,
        max_tokens: 200
      });
      return response.choices[0]?.message?.content || "Aucune suggestion disponible.";
    } catch (error) {
      console.error('IA error:', error);
      return "Service IA temporairement indisponible. Veuillez réessayer plus tard.";
    }
  }

  async analyzeTicket(title: string, description: string, messages: any[] = [], ticketId?: string) {
    const text = `Titre: ${title}\nDescription: ${description}`;
    const prompt = `Analyse ce ticket de support. 
    Retourne UNIQUEMENT un JSON valide (sans texte avant ou après) avec:
    {
      "priority": "low" ou "medium" ou "high",
      "category": "bug" ou "auth" ou "performance" ou "other",
      "suggestedReply": "une réponse courte et professionnelle (2-3 phrases)",
      "needsAdmin": true ou false,
      "escalationReason": "si needsAdmin est true, explique pourquoi, sinon laisse vide"
    }
    
    Ticket: ${text}`;
    
    try {
      const response = await this.openai.chat.completions.create({
        model: "llama-3.3-70b-versatile",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.3,
        max_tokens: 400
      });
      
      const content = response.choices[0]?.message?.content;
      if (!content) {
        return this.getDefaultResponse();
      }
      
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        
        //  Si l'IA demande l'intervention d'un admin → appeler l'endpoint interne
        if (parsed.needsAdmin === true && ticketId) {
          await this.notifyAdmin(ticketId, title, parsed.escalationReason || "Intervention requise", "high");
        }
        
        return {
          priority: parsed.priority || "medium",
          category: parsed.category || "other",
          suggestedReply: parsed.suggestedReply || "Notre équipe va étudier votre demande.",
          needsAdmin: parsed.needsAdmin === true,
          escalationReason: parsed.escalationReason || ""
        };
      }
      
      return this.getDefaultResponse();
    } catch (error) {
      console.error('IA error:', error);
      return this.getDefaultResponse();
    }
  }

  // Appel HTTP interne pour notifier l'admin
  private async notifyAdmin(ticketId: string, title: string, reason: string, urgency: string) {
    try {
      console.log(`📧 [IA] Attempting to notify admin at: ${this.backendUrl}/auth/notify-admin`);
      console.log(`📧 [IA] Notification data:`, { ticketId, title, reason, urgency });
      
      await firstValueFrom(
        this.httpService.post(`${this.backendUrl}/auth/notify-admin`, {
          ticketId: ticketId,
          title: title,
          reason: reason,
          urgency: urgency
        })
      );
      console.log(`✅ [IA] Admin notifié avec succès pour le ticket: ${title}`);
    } catch (error) {
      console.error('❌ [IA] Erreur notification admin:');
      console.error('   - URL tentée:', `${this.backendUrl}/auth/notify-admin`);
      console.error('   - Erreur:', error.message);
      console.error('   - Stack:', error.stack);
    }
  }

  private getDefaultResponse() {
    return {
      priority: "medium",
      category: "other",
      suggestedReply: "Notre équipe va étudier votre demande et vous répondre dans les plus brefs délais.",
      needsAdmin: false,
      escalationReason: ""
    };
  }
}