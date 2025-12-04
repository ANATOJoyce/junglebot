import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { RegionService } from './region.service';
import { Region, RegionSchema } from './entities/region.entity';
import { Country, CountrySchema } from './entities/country.entity';
import { RegionController } from './region.controller';


@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Region.name, schema: RegionSchema },
      { name: Country.name, schema: CountrySchema },
    ]),
  ],
    
  controllers: [RegionController],
  providers: [RegionService],
  exports: [RegionService, 
        MongooseModule.forFeature([
      { name: Country.name, schema: CountrySchema }, // <-- export du provider Mongoose
    ]),
  ],
})
export class RegionModule {}
