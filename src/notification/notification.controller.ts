import { Controller, Get, Post, Param, Body, Patch } from '@nestjs/common';
import { NotificationService } from './notification.service';

@Controller('notifications')
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}

  // Récupérer les notifications non lues d'un utilisateur
  @Get('unread/:userId')
  async getUnreadNotifications(@Param('userId') userId: string) {
    return this.notificationService.getUnreadNotifications(userId);
  }

  // Récupérer toutes les notifications d'un utilisateur
  @Get(':userId')
  async getAllNotifications(@Param('userId') userId: string) {
    return this.notificationService.getAllNotifications(userId);
  }

  // Créer une notification
  @Post()
  async createNotification(@Body() body: { userId: string; message: string }) {
    const { userId, message } = body;
    return this.notificationService.createForUser(userId, message);
  }

  // Marquer une notification comme lue
  @Patch(':notificationId/read')
  async markAsRead(@Param('notificationId') notificationId: string) {
    return this.notificationService.markAsRead(notificationId);
  }
}
