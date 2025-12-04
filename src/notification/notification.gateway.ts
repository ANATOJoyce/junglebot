import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
} from '@nestjs/websockets';
import { Server } from 'socket.io';
import { NotificationService } from './notification.service';

@WebSocketGateway({
  cors: { origin: '*' }, // adapter selon ton front
})
export class NotificationGateway {
  @WebSocketServer()
  server: Server;

  constructor(private notificationService: NotificationService) {}

  // Optionnel : réception depuis le client
  @SubscribeMessage('markAsRead')
  async handleMarkAsRead(@MessageBody() data: { id: string }) {
    const notif = await this.notificationService.markAsRead(data.id);
    return notif;
  }
/*
  // Fonction pour envoyer une notification à un utilisateur
  async sendNotification(userId: string, message: string, type: string = 'new_store') {
    const notif = await this.notificationService.create(userId, message, type);
    this.server.emit(`notification:${userId}`, notif); // événement ciblé
  }
    */
}
