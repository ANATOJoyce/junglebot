import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { PriceList, PriceListStatus, PriceListType } from './entities/price-list.entity';
import { PriceListRule } from './entities/price-list-rule.entity';
import { PricePreference } from './entities/price-preference.entity';
import { PriceRule } from './entities/price-rule.entity';
import { PriceSet } from './entities/price-set.entity';
import { CreatePriceListRuleDto } from './dto/create-price-list-rule.dto' ;
import { UpdatePriceListRuleDto } from './dto/update-price-list-rule.dto';
import { UpdatePriceListDto } from './dto/update-price-list.dto';
import { CreatePriceListDto } from './dto/create-price-list.dto';
import { UpdatePricePreferenceDto } from './dto/update-price-preference.dto';
import { CreatePricePreferenceDto } from './dto/create-price-preference.dto';
import { CreatePriceRuleDto } from './dto/create-price-rule.dto';
import { UpdatePriceRuleDto } from './dto/update-price-rule.dto';
import { CreatePriceSetDto } from './dto/create-price-set.dto';
import { UpdatePriceSetDto } from './dto/update-price-set.dto';
import { CreatePriceDto } from './dto/create-price.dto';
import { Price } from './entities/price.entity';
import { CreateMoneyAmountDTO } from './dto/create-money-amount.dto';
import { MoneyAmount } from './entities/money-amount.entity';
import { Currency, CurrencyDocument } from 'src/currency/entities/currency.entity';
import { Variant } from 'src/product/entities/product-variant.entity';
import { Customer, CustomerDocument } from 'src/customer/entities/customer.entity';


@Injectable()
export class PricingService {
  constructor(
    @InjectModel(PriceList.name) private priceListModel: Model<PriceList>,
    @InjectModel(PriceListRule.name) private priceListRuleModel: Model<PriceListRule>,
    @InjectModel(PricePreference.name) private pricePreferenceModel: Model<PricePreference>,
    @InjectModel(PriceRule.name) private priceRuleModel: Model<PriceRule>,
    @InjectModel(PriceSet.name) private priceSetModel: Model<PriceSet>,
    @InjectModel(Customer.name) private customerModel: Model<CustomerDocument>,
    @InjectModel(Price.name) private priceModel: Model<Price>,
    @InjectModel(MoneyAmount.name) private moneyAmountModel: Model<Price>,
    @InjectModel(Variant.name) private variantModel: Model<Variant>,
    @InjectModel(Currency.name) private currencyModel: Model<CurrencyDocument>,
  ) {}



  

  async findAllPriceLists() {
    return this.priceListModel.find().exec();
  }

  async findPriceListById(id: string) {
    return this.priceListModel.findById(id).exec();
  }

 
  async removePriceList(id: string) {
    return this.priceListModel.findByIdAndDelete(id).exec();
  }

  // Idem pour les autres entités, tu peux créer des méthodes CRUD similaires
  /**
 * CREATION DES METHODE DE PRriceListRule
 * createPriceListRule()	Crée une nouvelle règle
 * getRulesByPriceList()	Liste toutes les règles liées à une PriceLis
 * getActiveRulesByAttribute()	Filtre les règles actives par attribut
 * updatePriceListRule()	Modifie une règle existante
 * softDeletePriceListRule()	Marque une règle comme supprimée
 * restorePriceListRule()	Restaure une règle soft-deleted
 */

  async createPriceListRule(dto: CreatePriceListRuleDto): Promise<PriceListRule> {
    const created = new this.priceListRuleModel({
      ...dto,
      price_list: new Types.ObjectId(dto.price_list), // cast nécessaire pour Mongoose
    });
    return created.save();
  }

  async getRulesByPriceList(priceListId: string): Promise<PriceListRule[]> {
    return this.priceListRuleModel.find({
      price_list: priceListId,
    }).exec();
  }

  async getActiveRulesByAttribute(attribute: string): Promise<PriceListRule[]> {
    return this.priceListRuleModel.find({
      attribute,
      deleted_at: null,
    }).exec();
  }

  async updatePriceListRule(id: string, dto: UpdatePriceListRuleDto): Promise<PriceListRule> {
    const updatePayload: any = { ...dto };

    // Cast manuel si `price_list` est présent
    if (dto.price_list) {
      updatePayload.price_list = new Types.ObjectId(dto.price_list);
    }

    const updated = await this.priceListRuleModel
      .findByIdAndUpdate(id, updatePayload, { new: true })
      .exec();

    if (!updated) {
      throw new NotFoundException(`PriceListRule with id ${id} not found`);
    }

    return updated;
  }

  async softDeletePriceListRule(id: string): Promise<PriceListRule> {
    const updated = await this.priceListRuleModel.findByIdAndUpdate(
      id,
      { deleted_at: new Date() },
      { new: true },
    ).exec();
    if (!updated) {
      throw new NotFoundException(`PriceListRule with id ${id} not found`);
    }
    return updated;
  }

  async restorePriceListRule(id: string): Promise<PriceListRule> {
    const restored = await this.priceListRuleModel.findByIdAndUpdate(
      id,
      { deleted_at: null },
      { new: true },
    ).exec();
    if (!restored) {
      throw new NotFoundException(`PriceListRule with id ${id} not found`);
    }
    return restored;
  }


    /**Une PriceList représente :

  une liste de prix promotionnels ou d’écrasement (type: SALE ou OVERRIDE)

  avec des dates de validité (starts_at, ends_at)

  un statut (DRAFT ou ACTIVE)

  des règles (PriceListRule) pour filtrer quand la liste s’applique

  des prix associés (prices)
  Méthode	Objectif
  createPriceList(dto)	Créer une nouvelle PriceList
  getAllPriceLists()	Lister toutes les PriceLists
  getActivePriceLists()	Lister uniquement les PriceLists actives
  getPriceListsByType(type)	Lister par type (SALE, OVERRIDE)
  getPriceListById(id)	Obtenir une PriceList complète
  updatePriceList(id, dto)	Modifier une PriceList
  activatePriceList(id)	Changer le statut en ACTIVE
  deactivatePriceList(id)	Changer le statut en DRAFT
  deletePriceList(id)	Supprimer la PriceList

  */

   async createPriceList(dto: CreatePriceListDto): Promise<PriceList> {
    const created = new this.priceListModel({
      ...dto,
      prices: dto.prices?.map(id => new Types.ObjectId(id)),
      price_list_rules: dto.price_list_rules?.map(id => new Types.ObjectId(id)),
    });
    return created.save();
  }

  async getAllPriceLists(): Promise<PriceList[]> {
    return this.priceListModel.find().populate(['prices', 'price_list_rules']).exec();
  }

  async getActivePriceLists(): Promise<PriceList[]> {
    return this.priceListModel.find({ status: PriceListStatus.ACTIVE }).exec();
  }

  async getPriceListsByType(type: PriceListType): Promise<PriceList[]> {
    return this.priceListModel.find({ type }).exec();
  }

  async getPriceListById(id: string): Promise<PriceList> {
    const list = await this.priceListModel.findById(id).populate(['prices', 'price_list_rules']).exec();
    if (!list) throw new NotFoundException(`PriceList ${id} not found`);
    return list;
  }

  async updatePriceList(id: string, dto: UpdatePriceListDto): Promise<PriceList> {
    const payload: any = {
      ...dto,
    };

    if (dto.prices) {
      payload.prices = dto.prices.map(id => new Types.ObjectId(id));
    }

    if (dto.price_list_rules) {
      payload.price_list_rules = dto.price_list_rules.map(id => new Types.ObjectId(id));
    }

    const updated = await this.priceListModel.findByIdAndUpdate(id, payload, { new: true }).exec();
    if (!updated) throw new NotFoundException(`PriceList ${id} not found`);
    return updated;
  }

  async activatePriceList(id: string): Promise<PriceList> {
    return this.updatePriceList(id, { status: PriceListStatus.ACTIVE } as UpdatePriceListDto);
  }

  async deactivatePriceList(id: string): Promise<PriceList> {
    return this.updatePriceList(id, { status: PriceListStatus.DRAFT } as UpdatePriceListDto);
  }

  async deletePriceList(id: string): Promise<void> {
    const result = await this.priceListModel.findByIdAndDelete(id).exec();
    if (!result) throw new NotFoundException(`PriceList ${id} not found`);
  }

  /**
   * 
   * @param priceList 
   * @returns 
   * ChatGPT a dit :
  Parfait, ajoutons maintenant le support des dates starts_at / ends_at dans ton moteur getApplicablePriceListsForCustomerId. Cela permettra de ne renvoyer que les PriceLists actives au moment de la requête.
   */
  private isPriceListCurrentlyActive(priceList: any): boolean {
  const now = new Date();

  if (priceList.starts_at && now < new Date(priceList.starts_at)) {
    return false; // Trop tôt
  }

  if (priceList.ends_at && now > new Date(priceList.ends_at)) {
    return false; // Expiré
  }

  return true; // OK
 }
 /**Filtre par status

  Filtre par période de validité (starts_at, ends_at)

  Filtre selon les PriceListRules dynamiques 
  */


  async getApplicablePriceListsForCustomerId(customerId: string): Promise<PriceList[]> {
  const customer = await this.customerModel
    .findById(customerId)
    .populate('group') // nécessaire pour accéder à group.name
    .lean();

  if (!customer) throw new NotFoundException(`Customer with ID ${customerId} not found`);

  const priceLists = await this.priceListModel
    .find({ status: PriceListStatus.ACTIVE })
    .populate('price_list_rules')
    .lean();

  return priceLists.filter((priceList) => {
    const rules = priceList.price_list_rules || [];

    // 1. La période de validité doit être bonne
    const isActiveNow = this.isPriceListCurrentlyActive(priceList);
    if (!isActiveNow) return false;

    // 2. Toutes les règles doivent matcher
    return rules.every((rule) => this.doesRuleApplyToCustomer(rule, customer));
  });

 }

  async getAllPrices(): Promise<Price[]> {
    return this.priceModel.find({ deleted_at: { $exists: false } })  // Exclut les prix supprimés
      .populate('price_list')  // Récupère les informations de la liste de prix associée
      .populate('price_set')   // Récupère les informations de l'ensemble de prix associé
      .exec();
  }

  /**
   * Vérifie si une règle s'applique à un client
   */
  private doesRuleApplyToCustomer(rule: PriceListRule, customer: any): boolean {
    const attr = rule.attribute;
    const expectedValue = rule.value;

    const actualValue = this.getCustomerAttributeValue(attr, customer);

    if (expectedValue === null || expectedValue === undefined) return true;

    if (Array.isArray(expectedValue)) {
      return expectedValue.includes(actualValue);
    }

    return actualValue === expectedValue;
  }

  /**
   * Récupère dynamiquement la valeur d’un attribut sur le customer
   */
  private getCustomerAttributeValue(attribute: string, customer: any): any {
    switch (attribute) {
      case 'group':
      case 'customer_group':
        return customer.group?.name;
      case 'role':
        return customer.role;
      case 'country':
        return customer.address?.country || customer.country;
      default:
        return customer[attribute];
    }
  }
  /**
   * Cela permet de configurer dynamiquement comment afficher les prix (TTC/HT)
   *  selon des critères comme : pays, rôle, canal, etc.
   */

  async createPricePreference(dto: CreatePricePreferenceDto, userRole: string): Promise<PricePreference> {
    if (userRole !== 'ADMIN') {
      throw new ForbiddenException('Only admins can create price preferences');
    }
    const created = new this.pricePreferenceModel(dto);
    return created.save();
  }

  async getAllPricePreferences(): Promise<PricePreference[]> {
    return this.pricePreferenceModel.find({ deleted_at: null }).exec();
  }

  async getPricePreferencesByAttribute(attribute: string): Promise<PricePreference[]> {
    return this.pricePreferenceModel.find({ attribute, deleted_at: null }).exec();
  }

  async updatePricePreference(id: string, dto: UpdatePricePreferenceDto, userRole: string): Promise<PricePreference> {
    if (userRole !== 'ADMIN') {
      throw new ForbiddenException('Only admins can update price preferences');
    }
    const updated = await this.pricePreferenceModel.findOneAndUpdate(
      { _id: id, deleted_at: null },
      dto,
      { new: true }
    );
    if (!updated) throw new NotFoundException(`PricePreference with id ${id} not found`);
    return updated;
  }

  async softDeletePricePreference(id: string, userRole: string): Promise<PricePreference> {
    if (userRole !== 'ADMIN') {
      throw new ForbiddenException('Only admins can delete price preferences');
    }
    const deleted = await this.pricePreferenceModel.findOneAndUpdate(
      { _id: id, deleted_at: null },
      { deleted_at: new Date() },
      { new: true }
    );
    if (!deleted) throw new NotFoundException(`PricePreference with id ${id} not found`);
    return deleted;
  }

  async restorePricePreference(id: string, userRole: string): Promise<PricePreference> {
    if (userRole !== 'ADMIN') {
      throw new ForbiddenException('Only admins can restore price preferences');
    }
    const restored = await this.pricePreferenceModel.findOneAndUpdate(
      { _id: id, deleted_at: { $ne: null } },
      { deleted_at: null },
      { new: true }
    );
    if (!restored) throw new NotFoundException(`PricePreference with id ${id} not found or not deleted`);
    return restored;
  }

  /**
   * 
   * PRICE-RULE
   */

  // pricing.service.ts

  async createPriceRule(dto: CreatePriceRuleDto) {
    return this.priceRuleModel.create(dto);
  }

  async updatePriceRule(id: string, dto: UpdatePriceRuleDto) {
    const updated = await this.priceRuleModel.findByIdAndUpdate(id, dto, { new: true });
    if (!updated) throw new NotFoundException(`PriceRule ${id} not found`);
    return updated;
  }

  async deletePriceRule(id: string) {
    const rule = await this.priceRuleModel.findById(id);
    if (!rule) throw new NotFoundException(`PriceRule ${id} not found`);
    rule.deleted_at = new Date();
    await rule.save();
    return { success: true };
  }

  async restorePriceRule(id: string) {
    const rule = await this.priceRuleModel.findById(id);
    if (!rule) throw new NotFoundException(`PriceRule ${id} not found`);
    rule.deleted_at = null;
    await rule.save();
    return rule;
  }

  async getPriceRulesByPrice(priceId: string) {
    return this.priceRuleModel.find({ price: priceId, deleted_at: null });
  }

  async getAllActivePriceRules() {
    return this.priceRuleModel.find({ deleted_at: null });
  }

  /**
   * Un PriceSet est un regroupement de plusieurs prix (Price). Cela te permet de représenter plusieurs variations tarifaires associées ensemble — par exemple :

un produit a plusieurs variantes (taille, couleur)

ou un même produit a plusieurs prix selon le canal, le pays, etc.

C’est une entité simple mais puissante pour regrouper les objets
   */
// Créer un PriceSet


  async createPriceSet(dto: CreatePriceSetDto): Promise<PriceSet> {
    // Vérifier l'existence des Price référencés dans priceModel, pas priceSetModel
    const prices = await this.priceModel.find({ _id: { $in: dto.prices }, deleted_at: null });

    if (prices.length !== dto.prices.length) {
      throw new BadRequestException('Certains prix fournis sont invalides ou supprimés');
      
    }
    return this.priceSetModel.create(dto);
  }

 


  // Lire tous les PriceSet
  async getAllPriceSets(): Promise<PriceSet[]> {
    return await this.priceSetModel.find().populate('prices').exec();
  }

  // Lire un seul PriceSet par ID
  async getPriceSetById(id: string): Promise<PriceSet> {
    const priceSet = await this.priceSetModel.findById(id).populate('prices').exec();
    if (!priceSet) throw new NotFoundException(`PriceSet ${id} not found`);
    return priceSet;
  }

  // Mettre à jour un PriceSet
  async updatePriceSet(id: string, dto: UpdatePriceSetDto): Promise<PriceSet> {
    const updated = await this.priceSetModel.findByIdAndUpdate(id, dto, { new: true }).exec();
    if (!updated) throw new NotFoundException(`PriceSet ${id} not found`);
    return updated;
  }

  // Supprimer un PriceSet
  async deletePriceSet(id: string): Promise<void> {
    const result = await this.priceSetModel.findByIdAndDelete(id);
    if (!result) throw new NotFoundException(`PriceSet ${id} not found`);
  }
/**
 * creation des prix en fonction des vendeur
 */
/*
  async createPrice(dto: CreatePriceDto): Promise<Price> {
    const price = new this.priceModel({
      ...dto,
      region: dto.region,
      country: dto.country,
      product_variant: dto.product_variant,
    });
    return price.save();
  }*/

  async updatePrice(id: string, dto: Partial<CreatePriceDto>): Promise<Price> {
  const updateData: any = {
    ...dto,
  };

  // On s'assure que les relations sont bien prises en compte
  if (dto.region) updateData.region = dto.region;
  if (dto.country) updateData.country = dto.country;
  if (dto.product_variant) updateData.product_variant = dto.product_variant;

  const updated = await this.priceModel.findByIdAndUpdate(id, updateData, { new: true }).exec();

  if (!updated) {
    throw new NotFoundException(`Price with id ${id} not found`);
  }

  return updated;
  }

  async findAllPrices(): Promise<Price[]> {
  return this.priceModel.find().populate(['region', 'country', 'product_variant', 'price_set', 'price_rules', 'price_list']).exec();
}

  async findPriceById(id: string): Promise<Price> {
    const price = await this.priceModel.findById(id).populate(['region', 'country', 'product_variant', 'price_set', 'price_rules', 'price_list']).exec();
    if (!price) {
      throw new NotFoundException(`Price with id ${id} not found`);
    }
    return price;
  }

  async removePrice(id: string): Promise<void> {
    const result = await this.priceModel.findByIdAndDelete(id).exec();
    if (!result) {
      throw new NotFoundException(`Price with id ${id} not found`);
    }
  }

/** rechercher de prix par region country et product variant */

  async findPricesByRegionCountryProductVariant(
    regionId?: string,
    countryId?: string,
    productVariantId?: string,
  ): Promise<Price[]> {
    const filter: any = {};

    if (regionId) {
      filter.region = regionId;
    }
    if (countryId) {
      filter.country = countryId;
    }
    if (productVariantId) {
      filter.product_variant = productVariantId;
    }

    return this.priceModel
      .find(filter)
      .populate(['region', 'country', 'product_variant', 'price_set', 'price_rules', 'price_list'])
      .exec();
  }

  async findPricesByCurrency(currencyId: string): Promise<Price[]> {
    return this.priceModel
      .find({ currency: currencyId })
      .populate(['region', 'country', 'product_variant', 'price_set', 'price_rules', 'price_list', 'currency'])
      .exec();
  }
/**
 * 
 * @param dto 
 * @returns un amount
 * La création d’un prix (MoneyAmount) se fait via le service et associe une devise et un variant

  Le variant garde une liste de ses prix (MoneyAmount)

  On peut récupérer facilement la liste des prix d’un variant via le service
 */


   async createMoneyAmount(dto: CreateMoneyAmountDTO): Promise<MoneyAmount> {
    // Trouver la currency correspondante
    const currency = await this.currencyModel.findOne({ code: dto.currency_code });
    if (!currency) {
      throw new NotFoundException(`Currency with code ${dto.currency_code} not found`);
    }

    // Créer le money amount avec la référence currency
    const moneyAmount = new this.moneyAmountModel({
      amount: dto.amount,
      currency_code: dto.currency_code,
      currency: currency._id,
    });

    const savedMoneyAmount = await moneyAmount.save();

    // Si on a un variant à lier, on ajoute l'ID du moneyAmount dans variant.prices
    if (dto.variant_id) {
      const variant = await this.variantModel.findById(dto.variant_id);
      if (!variant) {
        throw new NotFoundException(`ProductVariant with id ${dto.variant_id} not found`);
      }
      // Ajouter l'ID dans variant.prices (évite les doublons)
      await this.variantModel.findByIdAndUpdate(
        dto.variant_id,
        { $addToSet: { prices: savedMoneyAmount._id } },
        { new: true },
      );
    }

    return savedMoneyAmount;
  }


/*
  async createPrice(phone: string, dto: CreatePriceDto): Promise<Price> {
    const vendor = await this.produc.findByPhone(phone);
    if (!vendor) {
      throw new NotFoundException(`Aucun vendeur trouvé avec le téléphone : ${phone}`);
    }

    const price = new this.priceModel({
      ...dto,
      vendor: vendor._id,
    });

    return price.save();
  }
  */

}









