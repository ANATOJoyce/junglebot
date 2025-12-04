// src/region/region.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Country, CountryDocument } from './entities/country.entity';
import { Region, RegionDocument } from './entities/region.entity';
import { CreateCountryDto } from './dto/create-country.dto';
import { UpdateCountryDto } from './dto/update-country.dto';
import { CreateRegionDto } from './dto/create-region.dto';
import { UpdateRegionDto } from './dto/update-region.dto';

@Injectable()
export class RegionService {
  constructor(
    @InjectModel(Region.name) private regionModel: Model<RegionDocument>,
    @InjectModel(Country.name) private countryModel: Model<CountryDocument>,
  ) {}

  // ----- COUNTRY -----
  async createCountry(dto: CreateCountryDto) {
    const country = new this.countryModel(dto);
    return country.save();
  }

 
  async updateCountry(id: string, dto: UpdateCountryDto) {
    return this.countryModel.findByIdAndUpdate(id, dto, { new: true }).exec();
  }

  async removeCountry(id: string) {
    return this.countryModel.findByIdAndDelete(id).exec();
  }




  async findOneRegion(countryId: string, regionId: string): Promise<Region> {
    const country = await this.countryModel.findById(countryId).exec();
    if (!country) throw new NotFoundException('Country not found');

    const region = country.regions?.find(
      r => r['_id'].toString() === regionId,
    );
    if (!region) throw new NotFoundException('Region not found');

    return region;
  }

  async updateRegion(
    countryId: string,
    regionId: string,
    dto: UpdateRegionDto,
  ): Promise<Region> {
    const country = await this.countryModel.findById(countryId).exec();
    if (!country) throw new NotFoundException('Country not found');

    const region = country.regions?.find(r => r['_id'].toString() === regionId);
    if (!region) throw new NotFoundException('Region not found');

    Object.assign(region, dto);
    await country.save();
    return region;
  }

  async removeRegion(countryId: string, regionId: string) {
    const country = await this.countryModel.findById(countryId).exec();
    if (!country) throw new NotFoundException('Country not found');

    const regionIndex = country.regions?.findIndex(
      r => r['_id'].toString() === regionId,
    );
    if (regionIndex === undefined || regionIndex === -1)
      throw new NotFoundException('Region not found');

    country.regions.splice(regionIndex, 1);
    await country.save();
    return { message: 'Region deleted successfully' };
  }

async createRegion(countryId: string, dto: CreateRegionDto): Promise<Region> {
  const country = await this.countryModel.findById(countryId);
  if (!country) throw new NotFoundException('Country not found');

  // Nouvelle région
  const newRegion = {
    _id: new Types.ObjectId(), // Mongoose générera aussi un _id si tu utilises SchemaTypes.ObjectId
    name: dto.name,
  } as Region;

  if (!country.regions) country.regions = [];
  country.regions.push(newRegion as any); // cast pour Mongoose

  await country.save();
  return newRegion;
}


async findAllRegions(countryId: string) {
  const country = await this.countryModel
    .findById(countryId)
    .populate('regions')
    .exec();

  if (!country) throw new NotFoundException('Country not found');

  return country.regions; // retourne les objets région complets
}
 


   // Récupérer toutes les régions d’un pays
 // src/region/region.service.ts
  async findAll(countryId: string): Promise<Region[]> {
    const country = await this.countryModel
      .findById(countryId)
      .populate('regions') // 👈 charge les infos complètes
      .exec();

    if (!country) {
      throw new NotFoundException('Country not found');
    }

    // retourne un tableau vide si aucune région
    return country.regions ?? [];
  }
  // Récupérer une seule région d’un pays
// src/region/region.service.ts
async findAllByCountry(countryId: string) {
  const country = await this.countryModel.findById(countryId).exec();
  if (!country) {
    throw new NotFoundException('Country not found');
  }

  // Retourne simplement les régions du pays
  return country.regions || [];
}

 

    // Récupérer une région spécifique
  async findOne(countryId: string, regionId: string): Promise<Region> {
    const country = await this.countryModel.findById(countryId).exec();
    if (!country) throw new NotFoundException('Country not found');

    const region = country.regions?.find(r => r['_id'].toString() === regionId);
    if (!region) throw new NotFoundException('Region not found');

    return region;
  }

    // ✅ Mettre à jour une région
  async update(countryId: string, regionId: string, dto: UpdateRegionDto) {
    const country = await this.countryModel.findById(countryId);
    if (!country) throw new NotFoundException('Country not found');

    const region = await this.regionModel.findByIdAndUpdate(regionId, dto, { new: true }).exec();
    if (!region) throw new NotFoundException('Region not found');

    return region;
  }

  // ✅ Supprimer une région
  async remove(countryId: string, regionId: string) {
    const country = await this.countryModel.findById(countryId);
    if (!country) throw new NotFoundException('Country not found');

    await this.regionModel.findByIdAndDelete(regionId).exec();

    // Retirer la région supprimée du tableau
    country.regions = country.regions.filter(
      (r: any) => r.toString() !== regionId,
    );
    await country.save();

    return { message: 'Region deleted successfully' };
  }

  // src/region/region.service.ts
async findAllCountries() {
  return this.countryModel
    .find()
    .populate('regions') // ✅ ajoute ceci
    .exec();
}

async findOneCountry(id: string) {
  const country = await this.countryModel
    .findById(id)
    .populate('regions') // ✅ idem ici
    .exec();

  if (!country) throw new NotFoundException('Country not found');
  return country;
}

}
