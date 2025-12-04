import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Tax, TaxDocument } from './entities/tax.entity';

@Injectable()
export class TaxService {
  constructor(@InjectModel(Tax.name) private taxModel: Model<TaxDocument>) {}

  async createTax(data: Partial<Tax>) {
    const tax = new this.taxModel(data);
    return tax.save();
  }

  async findAll() {
    return this.taxModel.find().populate('country', 'name iso2 currency_code').exec();
  }

  async findByCountry(countryId: string) {
    return this.taxModel.find({ country: new Types.ObjectId(countryId), automatic: true });
  }

  async update(id: string, data: Partial<Tax>) {
    return this.taxModel.findByIdAndUpdate(id, data, { new: true }).exec();
  }

  async remove(id: string) {
    return this.taxModel.findByIdAndDelete(id).exec();
  }
}
 