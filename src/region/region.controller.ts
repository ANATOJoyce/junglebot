// src/region/region.controller.ts
import { Controller, Get, Post, Patch, Delete, Body, Param } from '@nestjs/common';
import { RegionService } from './region.service';
import { CreateCountryDto } from './dto/create-country.dto';
import { UpdateCountryDto } from './dto/update-country.dto';
import { CreateRegionDto } from './dto/create-region.dto';
import { UpdateRegionDto } from './dto/update-region.dto';



@Controller('regions')
export class RegionController {
  constructor(private readonly regionService: RegionService) {}

  // ----- COUNTRIES -----
  @Post('countries')
  createCountry(@Body() dto: CreateCountryDto) {
    return this.regionService.createCountry(dto);
  }

  @Get('countries')
  findAllCountries() {
    return this.regionService.findAllCountries();
  }

  @Get('countries/:id')
  findOneCountry(@Param('id') id: string) {
    return this.regionService.findOneCountry(id);
  }

  @Patch('countries/:id')
  updateCountry(@Param('id') id: string, @Body() dto: UpdateCountryDto) {
    return this.regionService.updateCountry(id, dto);
  }

  @Delete('countries/:id')
  removeCountry(@Param('id') id: string) {
    return this.regionService.removeCountry(id);
  }

  // ----- REGIONS -----
 
 @Post(':countryId')
  create(
    @Param('countryId') countryId: string,
    @Body() dto: CreateRegionDto,
  ) {
    return this.regionService.createRegion(countryId, dto);
  }

  // ✅ Récupérer toutes les régions d’un pays
  @Get(':countryId')
  findAll(@Param('countryId') countryId: string) {
    return this.regionService.findAll(countryId);
  }

  // ✅ Récupérer une région spécifique d’un pays
  @Get(':countryId/:regionId')
  findOne(
    @Param('countryId') countryId: string,
    @Param('regionId') regionId: string,
  ) {
    return this.regionService.findOne(countryId, regionId);
  }

  // ✅ Mettre à jour une région
  @Patch(':countryId/:regionId')
  update(
    @Param('countryId') countryId: string,
    @Param('regionId') regionId: string,
    @Body() dto: UpdateRegionDto,
  ) {
    return this.regionService.update(countryId, regionId, dto);
  }

  // ✅ Supprimer une région
  @Delete(':countryId/:regionId')
  remove(
    @Param('countryId') countryId: string,
    @Param('regionId') regionId: string,
  ) {
    return this.regionService.remove(countryId, regionId);
  }


   // ----- CREATE REGION -----
  @Post(':countryId')
  async createRegion(
    @Param('countryId') countryId: string,
    @Body() dto: CreateRegionDto,
  ) {
    return this.regionService.createRegion(countryId, dto);
  }

  // ----- GET ALL REGIONS OF A COUNTRY -----
  @Get(':countryId')
  async findAllRegions(@Param('countryId') countryId: string) {
    return this.regionService.findAllRegions(countryId);
  }

  // ----- GET A SINGLE REGION BY ID -----
  @Get(':countryId/:regionId')
  async findOneRegion(
    @Param('countryId') countryId: string,
    @Param('regionId') regionId: string,
  ) {
    return this.regionService.findOneRegion(countryId, regionId);
  }

  // ----- UPDATE REGION -----
  @Patch(':countryId/:regionId')
  async updateRegion(
    @Param('countryId') countryId: string,
    @Param('regionId') regionId: string,
    @Body() dto: UpdateRegionDto,
  ) {
    return this.regionService.updateRegion(countryId, regionId, dto);
  }

  // ----- DELETE REGION -----
  @Delete(':countryId/:regionId')
  async removeRegion(
    @Param('countryId') countryId: string,
    @Param('regionId') regionId: string,
  ) {
    return this.regionService.removeRegion(countryId, regionId);
  }
}
