import { Module } from '@nestjs/common';
import { FulfillmentService } from './fulfillment.service';
import { FulfillmentController } from './fulfillment.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { FulfillmentAddress, FulfillmentAddressSchema } from './entities/fulfillment-address.entity';
import { FulfillmentItem, FulfillmentItemSchema } from './entities/fulfillment-item.entity';
import {  FulfillmentLabel, FulfillmentLabelSchema } from './entities/fulfillment-label.entity';
import { ShippingOption, ShippingOptionSchema } from './entities/shipping-option.entity';
import { ServiceZone, ServiceZoneSchema } from './entities/service-zone.entity';
import { Fulfillment, FulfillmentSchema } from './entities/fulfillment.entity';
import { GeoZone, GeoZoneSchema } from './entities/geo-zone.entity';
import { FulfillmentSet, FulfillmentSetSchema } from './entities/fulfillment-set.entity';
import { FulfillmentProvider, FulfillmentProviderSchema } from './entities/fulfillment-provider.entity';
import { Order, OrderSchema } from 'src/order/entities/CommandePrincipale/order.entity';

@Module({
    imports: [
    MongooseModule.forFeature([
      { name: FulfillmentAddress.name, schema: FulfillmentAddressSchema },
      { name: FulfillmentItem.name, schema: FulfillmentItemSchema },
      { name: FulfillmentLabel.name, schema: FulfillmentLabelSchema },
      { name: FulfillmentProvider.name, schema: FulfillmentProviderSchema },
      { name: FulfillmentSet.name, schema: FulfillmentSetSchema },
      { name: GeoZone.name, schema: GeoZoneSchema },
      { name: ServiceZone.name, schema: ServiceZoneSchema },
      { name: ShippingOption.name, schema: ShippingOptionSchema },
      { name: Fulfillment.name, schema: FulfillmentSchema },
      { name: Order.name, schema: OrderSchema },
    ]),
  ],
  controllers: [FulfillmentController],
  providers: [FulfillmentService],
})
export class FulfillmentModule {}
