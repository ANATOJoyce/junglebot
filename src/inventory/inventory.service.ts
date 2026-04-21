import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Cron, CronExpression } from '@nestjs/schedule';
import { MailService } from '../mail/mail.service';
import { Inventory, InventoryDocument } from './entities/inventory.entity';

interface ProductPromotion {
  startDate?: Date;
  endDate?: Date;
  value?: number;
  type?: string;
}

interface ProductPopulated {
  _id: Types.ObjectId;
  title: string;
  price: number;
  totalStock: number;
  promotions?: ProductPromotion[];
}

interface StorePopulated {
  _id: Types.ObjectId;
  name?: string;
  owner: { email: string };
}

interface InventoryPopulated {
  _id: Types.ObjectId;
  productId: ProductPopulated;
  storeId: StorePopulated;
  quantity: number;
}

@Injectable()
export class InventoryService {
  constructor(
    @InjectModel(Inventory.name)
    private readonly inventoryModel: Model<InventoryDocument>,
    private readonly mailService: MailService,
  ) {}

async checkInventaire(storeId: string) {
    const inventaireRaw = await this.inventoryModel
      .find({ storeId })
      .populate({
        path: 'productId',
        select:
          'title price totalStock promotions status description imageUrl isPromotion',
      })
      .populate({
        path: 'storeId',
        select: 'name owner',
        populate: { path: 'owner', select: 'email' },
      });

    const inventaire: InventoryPopulated[] =
      inventaireRaw as unknown as InventoryPopulated[];

    if (!inventaire || inventaire.length === 0) {
      throw new NotFoundException('Inventaire vide pour cette boutique');
    }

    const now = new Date();
    const storeOwnerEmail = inventaire[0]?.storeId?.owner?.email;

    if (!storeOwnerEmail) {
      throw new NotFoundException('Email du propriétaire introuvable');
    }

    const outOfStock = inventaire.filter(item => item.quantity <= 0);

    const productsOnPromo = inventaire.filter(
      item =>
        item.productId.promotions?.length &&
        item.productId.promotions.some(promo => promo.endDate && promo.endDate > now),
    );

    const soonEndingPromos = productsOnPromo.filter(item =>
      item.productId.promotions?.some(promo => {
        if (!promo.endDate) return false;
        const diffDays = Math.ceil(
          (promo.endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
        );
        return diffDays <= 3;
      }),
    );

    //  Notifications promotions proches de la fin
    for (const item of soonEndingPromos) {
      await this.mailService.sendMail({
        to: storeOwnerEmail,
        subject: `Promo bientôt terminée : ${item.productId.title}`,
        html: `
          <p>La promotion sur <strong>${item.productId.title}</strong> se termine bientôt.</p>
          <p>Prix actuel : ${item.productId.price} FCFA</p>
        `,
      });
    }

    //  Notifications rupture de stock
    for (const item of outOfStock) {
      await this.mailService.sendMail({
        to: storeOwnerEmail,
        subject: `Produit en rupture de stock : ${item.productId.title}`,
        html: `<p>Le produit <strong>${item.productId.title}</strong> est en rupture de stock.</p>`,
      });
    }

    return { inventaire, outOfStock, productsOnPromo, soonEndingPromos };
  }

  @Cron(CronExpression.EVERY_HOUR)
  async checkAllStoresInventaire() {
    const stores = await this.inventoryModel.distinct('storeId');

    for (const storeId of stores) {
      try {
        await this.checkInventaire(storeId as string);
        console.log(`Inventaire vérifié pour store ${storeId}`);
      } catch (err) {
        console.error(
          `Erreur lors de la vérification du store ${storeId}:`,
          err.message,
        );
      }
    }
  }
}
