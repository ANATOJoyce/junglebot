import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Notification, NotificationDocument } from './notification.entity';

@Injectable()
export class NotificationService {
  constructor(
    @InjectModel(Notification.name) private notificationModel: Model<NotificationDocument>,
  ) {}

  // Créer une nouvelle notification
  async create(userId: string, message: string) {
    const notification = new this.notificationModel({ userId, message });
    return notification.save();
  }

  // Récupérer toutes les notifications non lues pour un utilisateur
  async getUnreadNotifications(userId: string) {
    return this.notificationModel.find({ userId, read: false }).sort({ createdAt: -1 }).exec();
  }

  // Récupérer toutes les notifications d'un utilisateur
  async getAllNotifications(userId: string) {
    return this.notificationModel.find({ userId }).sort({ createdAt: -1 }).exec();
  }

  // Marquer une notification comme lue
  async markAsRead(notificationId: string) {
    return this.notificationModel.findByIdAndUpdate(notificationId, { read: true }, { new: true }).exec();
  }

  // Créer une notification pour un utilisateur avec un message spécifique
  async createForUser(userId: string, message: string) {
    const notification = new this.notificationModel({
      userId,
      message,
      read: false,
    });
    return notification.save();
  }
}
