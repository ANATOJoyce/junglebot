import { BadRequestException, Body, ConflictException, ForbiddenException, HttpException, Inject, Injectable, InternalServerErrorException, NotFoundException, Post } from '@nestjs/common';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { Product } from './entities/product.entity';
import { ProductCategory, Visibility } from './entities/product-category.entity';
import { InjectModel } from '@nestjs/mongoose';
import { isValidObjectId, Model, Types } from 'mongoose';
import { CreateProductCategoryDto } from './dto/category/create-product-category.dto';
import { UpdateProductCategoryDto } from './dto/category/update-product-category.dto';

import { CreateProductOptionDto } from './dto/option/create-product-option.dto';
import { UpdateProductOptionDto } from './dto/option/update-product-option.dto';
import { ProductOptionValue } from './entities/product-option-value.entity';
import { CreateProductOptionValueDto } from './dto/option-value/create-product-option-value.dto';
import { UpdateProductOptionValueDto } from './dto/option-value/update-product-option-value.dto';
import { UpdateProductVariantDto } from './dto/variant/update-product-variant.dto';
import { CreateProductTagDto } from './dto/tage/create-product-tag.dto';
import { UpdateProductTagDto } from './dto/tage/update-product-tag.dto';
import { ProductTag } from './entities/product-tag.entity';
import { ProductType } from './entities/product-type.entity';
import { CreateProductTypeDto } from './dto/type/create-product-type.dto';
import { UpdateProductTypeDto } from './dto/type/update-product-type.dto';
import { CreateProductImageDto } from './dto/image/create-product-image.dto';
import { Store } from 'src/store/entities/store.entity';
import { User } from 'src/user/entities/user.entity';
import { ProductStatus } from './product-enum';
import { Variant } from './entities/product-variant.entity';
import { CreateVariantDto } from './dto/variant/create-product-variant.dto';
import { UploadApiResponse } from 'cloudinary';
import { Readable } from 'stream';
import { StoreService } from 'src/store/store.service';
import { v2 as cloudinary } from 'cloudinary';
import { CloudinaryService } from './cloudinary.service';
import Fuse from 'fuse.js';
import { Promotion, PromotionDocument } from 'src/promotion/entities/promotion.entity';
import { CreateCollectionDto } from './dto/collection/create-product-collection.dto';
import { UpdateCollectionDto } from './dto/collection/update-product-collection.dto';
import { Collection } from './entities/product-collection.entity';
import { PromotionType } from 'src/promotion/entities/promotion-type.enum';
import { PromotionStatus } from 'src/promotion/enum-promotion';

@Injectable()
export class ProductService {

  constructor(
    @InjectModel(Product.name) private readonly productModel: Model<Product>,
    @InjectModel(Collection.name) private collectionModel: Model<Collection> ,
    @InjectModel(ProductCategory.name) private categoryModel: Model<ProductCategory>,
    @InjectModel(ProductOptionValue.name) private readonly optionValueModel: Model<ProductOptionValue>,
    @InjectModel(Variant.name) private readonly variantModel: Model<Variant>,
    @InjectModel(ProductTag.name) private readonly tagModel: Model<ProductTag>,
    @InjectModel(ProductType.name) private readonly typeModel: Model<ProductType>,
    @InjectModel(Store.name) private readonly storeModel: Model<Store>,
    @InjectModel(User.name) private readonly userModel: Model<User>,

    private readonly storeService: StoreService,
    private readonly CloudinaryService: CloudinaryService // Injection du service StoreService

    // Ajoute ici les autres modèles
  ) {}

  
  // product.service.ts (bloc Product)

    // Méthode pour uploader une image sur Cloudinary

   // Méthode pour créer un produit dans la base de données

   /*
  async createProduct(createProductDto: any, file: Express.Multer.File): Promise<Product> {
    // Télécharger l'image sur Cloudinary
    const uploadedImage = await this.CloudinaryService.uploadImage(file.path);

    // Vérifier si l'upload a réussi et que `secure_url` est présent
    const imageUrl = uploadedImage?.secure_url;  // `secure_url` est le lien public sécurisé de l'image

    // Créer un produit avec l'URL de l'image
    const newProduct = new this.productModel({
      ...createProductDto,
      images: imageUrl,  // Enregistrer l'URL de l'image téléchargée
    });

    return await newProduct.save();
  }
*/

 async createCollection(dto: CreateCollectionDto) {
    // Vérifier si une collection avec ce nom existe déjà
    const existing = await this.collectionModel.findOne({ name: dto.name }).lean();
    if (existing) {
      throw new BadRequestException(`La collection "${dto.name}" existe déjà.`);
    }

    const collection = new this.collectionModel(dto);
    const saved = await collection.save();

    const total = await this.collectionModel.countDocuments();

    return {
      data: saved.toObject(),
      meta: { total },
    };
  }


   async findAllCollections(page = 1, limit = 10) {
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      this.collectionModel.find().skip(skip).limit(limit).lean(),
      this.collectionModel.countDocuments(),
    ]);

    return {
      data,
      meta: {
        total,
        page,
        pageSize: limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }



async createProductInStore(dto: CreateProductDto, storeId: string) {
  const store = await this.storeModel.findById(storeId);
  if (!store) {
    throw new NotFoundException("Cette boutique n'existe pas.");
  }

  const existingProduct = await this.productModel.findOne({
    title: dto.title,
    storeId: store._id,
  });

  if (existingProduct) {
    return {
      message: "Ce produit existe déjà dans la boutique. Veuillez uniquement mettre à jour la quantité si nécessaire.",
      product: existingProduct,
    };
  }

  // Création du produit avec prix brut
  const product = new this.productModel({
    title: dto.title,
    description: dto.description,
    price: dto.price,
    finalPrice: dto.price, // provisoire
    status: ProductStatus.DRAFT,
    totalStock: dto.totalStock,
    imageUrl: dto.imageUrl,
    storeId: store._id,
    category: dto.category,
    collection: dto.collection,
    promotions: dto.promotions || [], // IDs
    isPromotion: (dto.promotions?.length ?? 0) > 0,
    variants: [],
  });

  try {
    // Sauvegarde + populate
    const savedProduct = await product.save();
    await savedProduct.populate("promotions");

    // ✅ Calcul du prix final après populate
    let finalPrice = dto.price;
    if (savedProduct.promotions && savedProduct.promotions.length > 0) {
      const promo = savedProduct.promotions[0] as PromotionDocument;
      const now = new Date();

      const isValidPromo =
        (!promo.startDate || promo.startDate <= now) &&
        (!promo.endDate || promo.endDate >= now);

      if (isValidPromo) {
        switch (promo.type) {
          case PromotionType.AMOUNT_OFF_PRODUCT:
            finalPrice = Math.max(0, dto.price - (dto.price * promo.value / 100));
            break;

          case PromotionType.AMOUNT_OFF_ORDER:
            finalPrice = Math.max(0, dto.price - promo.value);
            break;

          default:
            finalPrice = dto.price;
        }
      }
    }

    // Mise à jour du prix final
    savedProduct.finalPrice = finalPrice;
    await savedProduct.save();

    return savedProduct;
  } catch (error) {
    console.error("Erreur lors de la création :", error);
    throw new InternalServerErrorException("Erreur lors de la création du produit.");
  }
}

  async updateProduct(productId: string, dto: UpdateProductDto) {
    const updated = await this.productModel.findByIdAndUpdate(productId, dto, { new: true });
    if (!updated) throw new NotFoundException('Produit introuvable');
    return updated;
  }

  async getProductById(productId: string) {
    if (!Types.ObjectId.isValid(productId)) throw new NotFoundException('Produit introuvable');
    const product = await this.productModel
      .findById(productId)
      .populate('variants')
      .exec();
    if (!product) throw new NotFoundException('Produit introuvable');
    return product;
  }





async updateStatus(productId: string, status: ProductStatus) {
  const product = await this.productModel.findById(productId);

  if (!product) {
    throw new NotFoundException('Produit introuvable');
  }

  // 🔒 RÈGLE MÉTIER
  if (
    product.status === ProductStatus.PUBLISHED &&
    status === ProductStatus.DRAFT
  ) {
    throw new BadRequestException(
      'Un produit publié ne peut pas revenir en brouillon'
    );
  }

  product.status = status;
  await product.save();

  return product;
}



 // creation de variante de produit

 async addVariantsToProduct(
    productId: string,
    variantsDto: { size: string; color: string; price: number; stock: number }[],
  ) {
    if (!Types.ObjectId.isValid(productId)) {
      throw new NotFoundException(`Produit invalide : ${productId}`);
    }

    const product = await this.productModel.findById(productId);
    if (!product) {
      throw new NotFoundException("Produit non trouvé");
    }

    // Création des variantes et association avec le produit
    const variants = await Promise.all(
      variantsDto.map(async (v) => {
        const variant = new this.variantModel({
          ...v,
          productId: product._id,
        });
        return variant.save();
      }),
    );
    return variants;
  }

//get les produit avec leur variantes
async getProductsForStore({
  storeId,
  page = 1,
  limit = 10,
  search,
}: { storeId: string; page?: number; limit?: number; search?: string }) {
  // Validation de l'ID de la boutique
  if (!Types.ObjectId.isValid(storeId)) {
    throw new Error(`Invalid storeId: ${storeId}`);
  }
  const storeObjectId = new Types.ObjectId(storeId.trim());

  // Construction de la requête
  const query: any = { storeId: storeObjectId };
  if (search) {
    query.title = { $regex: search, $options: 'i' };
  }

  // Récupération des produits avec pagination
  const products = await this.productModel
    .find(query)
    .populate('storeId', 'name')      // Populate pour la boutique
    .populate('variants')
    .populate('promotions', 'value')
    .populate('category')        // Populate pour les variantes
    .skip((page - 1) * limit)
    .limit(limit)
    .sort({ createdAt: -1 })
    .exec();

  // Calcul du stock total (stock produit + stock de toutes ses variantes)
const productsWithTotalStock = products.map((product) => {
  const variants = product.variants as unknown as Variant[];

  const variantsStock = variants?.reduce(
    (sum, variant) => sum + (variant.stock ?? 0),
    0
  ) ?? 0;

  return {
    ...product.toObject(),
    totalStock: (product.totalStock ?? 0) + variantsStock,
    store: product.storeId,
  };
});


  // Comptage total pour pagination
  const total = await this.productModel.countDocuments(query);

  return {
    data: productsWithTotalStock,
    meta: {
      total,
      page,
      pageSize: limit,
      totalPages: Math.ceil(total / limit),
    },
  };
}


async createVariant(productId: string, variantData: Partial<Variant>) {
  // Vérifier que le produit existe
  const product = await this.productModel.findById(productId);
  if (!product) {
    throw new Error('Produit non trouvé');
  }

  // Créer la variante avec l'id du produit
  const variant = new this.variantModel({ ...variantData, productId });
  await variant.save();

  // Ajouter la variante au produit
  product.variants.push(variant._id);
  await product.save();

  return variant;
}


async getProductWithVariants(productId: string) {
  if (!Types.ObjectId.isValid(productId)) {
    throw new NotFoundException(`Invalid productId: ${productId}`);
  }

  const product = await this.productModel
    .findById(productId)
    .populate('variants')    // transforme ObjectId[] en Variant[]
    .populate('promotions')  // 👈 ajoute le populate des promotions
    .exec();

  if (!product) {
    throw new NotFoundException('Produit non trouvé');
  }

  // Cast type-safe pour TypeScript
  const variants = product.variants as unknown as Variant[];
  const promotions = product.promotions as unknown as Promotion[];

  // Calcul du stock total
  const variantsStock = variants?.reduce(
    (sum, variant) => sum + (variant.stock ?? 0),
    0
  ) ?? 0;

  const totalStock = (product.totalStock ?? 0) + variantsStock;

  // ✅ Calcul du prix réel après promotion
  let finalPrice = product.price;
  if (promotions && promotions.length > 0) {
    // Exemple : on prend la première promotion appliquée
    const promo = promotions[0];
    const promoValue = promo.value ?? 0; // si undefined → 0
    finalPrice = Math.max(0, product.price - promoValue); 
    // 👆 évite d’avoir un prix négatif
  }

  return {
    ...product.toObject(),
    totalStock,
    variants,       // variantes peuplées et typées
    promotions,     // promotions peuplées et typées
    finalPrice,     // 👈 prix calculé après promotion
  };
}


 async getProductsByStore(storeId: string, userId: string) {
    // Vérifie si la boutique appartient à l'utilisateur
    const store = await this.storeService.findStoreByIdAndUser(storeId, userId);
    if (!store) {
      throw new NotFoundException('Cette boutique ne vous appartient pas.');
    }

    // Récupère tous les produits de cette boutique
    const products = await this.productModel.find({ storeId }).lean();

    // Récupère les variantes associées à ces produits
    const productIds = products.map((p) => p._id);
    const variants = await this.variantModel.find({ productId: { $in: productIds } }).lean();

    // Associe les variantes aux produits
    const productsWithVariants = products.map((product) => ({
      ...product,
      variants: variants.filter(
        (v) => v.productId.toString() === product._id.toString(),
      ),
    }));

    return productsWithVariants;
  }


async getMyProduct(storeId: String){
  return this.productModel.find({store: storeId});
}






 /**LES FONCTION POUR CHANGERLE STATUS DES PRODUITS ? DRAF, PROPO */

 //Le vendeur va prposer un produit 

 

  //l'admini publie le produit 

 

 

 //l'adimin le regete LE PRODUIT


 



 //**SEULELEMENT LES PRODUITS QUI ON UN STATUT PUBLISHED QUI SERONT VUS DE TOUS */
 

 //**IMPORTANT  FILTRE ET PAGINATION DES PRODUIT PUNLIER*/

 



  async find(filter?: any) {
    return this.productModel.find(filter).exec();
  }

  async findByIdAndDelete(id: string) {
    return this.productModel.findByIdAndDelete(id).exec();
  }

  // (si tu ne l'as pas déjà)
 
  // product.service.ts//important

  

 async recommendProductsByBudget(budget: number): Promise<Product[] | { message: string }> {
  const products = await this.productModel.find({
    'variants.prices.amount': { $lte: budget * 100 }, // montant en centimes
  })
  .limit(20)
  .sort({ 'variants.prices.amount': 1 })
  .populate('variants')
  .exec();

  if (products.length === 0) {
    return {
      message: "Aucun produit ne correspond à votre budget. Revenez faire une tontine pour combler le manque.",
    };
  }
  
  return products;
}


 // Recherche par budget
async searchProductsByBudget(min?: number, max?: number, name?: string) {
  const filter: any = {
    status: ProductStatus.PUBLISHED,
  };

  // Filtrage par prix
  if (min !== undefined) {
    filter.price = { $gte: min };
  }

  if (max !== undefined) {
    filter.price = { ...(filter.price || {}), $lte: max };
  }

  // Filtrage par nom de produit (mot-clé)
  if (name) {
    filter.title = { $regex: name, $options: 'i' }; // 'i' pour insensible à la casse
  }

  const products = await this.productModel
    .find(filter)
    .select('title description imageUrl totalStock price variants category collection promotions')
    .lean()
    .exec();

  return products;
}



 // produit par collection
  async searchProductsByCollection(collection: string): Promise<Product[]> {
    if (!collection || collection.trim() === '') {
      throw new BadRequestException('La collection est requise.');
    }

    return this.productModel
      .find({ collection })
      .select('title description imageUrl price variants category collection')
      .lean()
      .exec();
  }


  async findAllAdmin(): Promise<Product[]> {
    return this.productModel.find().populate('user').exec();
  }

  async findAllByCtegorie(): Promise<Product[]> {
  return this.productModel.find().populate('category', 'title').exec();
 }








async softDeleteProduct(id: string): Promise<Product> {
  const product = await this.productModel.findById(id);

  if (!product) {
    throw new NotFoundException(`Produit avec l'id ${id} introuvable`);
  }

  return product;
}

 async restoreEntity<T extends Document>(model: Model<T>, id: string): Promise<T | null> {
  const entity = await model.findByIdAndUpdate(
    id, 
    { deleted_at: null }, 
    { new: true }
  );

  if (!entity) {
    throw new NotFoundException(`Entité avec l'id ${id} introuvable`);
  }

  return entity; // Pas besoin de casting, car TypeScript comprend le type maintenant
}
 
async getProductsWithFilters(
  filters: Record<string, any> = {},
  page: number = 1,
  limit: number = 10,
  sort: string = '-createdAt'
) {
  const skip = (page - 1) * limit;

  // base query : par statut + store
  const query: any = { status: 'published' };

  if (filters.storeId) {
    query.storeId = filters.storeId;
  }

  // Recherche textuelle
  if (filters.search) {
    query.$or = [
      { name: { $regex: filters.search, $options: 'i' } },
      { description: { $regex: filters.search, $options: 'i' } }
    ];
  }

  // Filtre par prix (sur le tableau `prices`)
  if (filters.minPrice !== undefined || filters.maxPrice !== undefined) {
    query.prices = {};
    if (filters.minPrice !== undefined) {
      query.prices.$gte = filters.minPrice;
    }
    if (filters.maxPrice !== undefined) {
      query.prices.$lte = filters.maxPrice;
    }
  }

  const products = await this.productModel
    .find(query)
    .sort(sort)
    .skip(skip)
    .limit(limit)
    .exec();

  const total = await this.productModel.countDocuments(query);

  return {
    data: products,
    meta: {
      total,
      page,
      pageSize: limit,
      totalPages: Math.ceil(total / limit),
    },
  };
}



async findOneCategory(categoryId: string) {
  const category = await this.categoryModel
    .findById(categoryId)
    .populate('products', 'name price')
    .lean();

  if (!category) {
    throw new Error(`Category with id ${categoryId} not found`);
  }

  return category;
}

//produit filter par prix et par variants

  async getProductsByVariantAndPrice(
    storeId: string,
    filters: { minPrice?: number; maxPrice?: number; size?: string; color?: string }
  ) {
    const query: any = { storeId };

    // Filtrer par prix (dans les variantes)
    if (filters.minPrice !== undefined || filters.maxPrice !== undefined) {
      query['variants.price'] = {};
      if (filters.minPrice !== undefined) {
        query['variants.price'].$gte = filters.minPrice;
      }
      if (filters.maxPrice !== undefined) {
        query['variants.price'].$lte = filters.maxPrice;
      }
    }

    // Filtrer par taille
    if (filters.size) {
      query['variants.size'] = filters.size;
    }

    // Filtrer par couleur
    if (filters.color) {
      query['variants.color'] = filters.color;
    }

    return this.productModel.find(query).exec();
  }



async searchProductsByTitleFuzzy(query: string) {
  if (!query || query.trim() === '') {
    throw new Error('Le mot-clé est requis.');
  }

  // Récupérer tous les produits publiés avec leurs promotions
  const products = await this.productModel
    .find({ status: ProductStatus.PUBLISHED })
    .populate({
      path: 'promotions',
      match: { status: PromotionStatus.ACTIVE }, // 🔹 On ne prend que les promotions actives
    })
    .select('title description totalStock imageUrl price variants promotions')
    .lean()
    .exec();

  const fuse = new Fuse(products, {
    keys: ['title'],
    threshold: 0.4,
    distance: 100,
    includeScore: true,
  });

  let results = fuse.search(query).map(r => r.item);

  // Appliquer les promotions
  results = results.map(product => {
    let finalPrice = product.price;

    if (product.promotions && product.promotions.length > 0) {
      // On peut choisir ici la promotion la plus avantageuse pour l'utilisateur
      const promo = product.promotions[0]; // par exemple la première promotion active

      // Vérifier le type de promotion pour appliquer la valeur
    if (promo.type === PromotionType.PERCENT_OFF_ORDER) {
  finalPrice = product.price - (product.price * promo.value) / 100;
} else if (promo.type === PromotionType.AMOUNT_OFF_ORDER) {
  finalPrice = product.price - promo.value;
}


      // Ne jamais retourner un prix négatif
      finalPrice = finalPrice < 0 ? 0 : finalPrice;
    }

    return {
      ...product,
      finalPrice,
    };
  });

  return results;
}


async searchProductsByCategoryNameFuzzy(query: string) {
  if (!query || query.trim() === '') {
    throw new Error('Le nom de la catégorie est requis.');
  }

  const products = await this.productModel
    .find({ status: ProductStatus.PUBLISHED })
    .populate('category', 'name') // on récupère le nom de la catégorie
    .select('title description totalStock imageUrl price variants promotions category')
    .lean()
    .exec();

  const fuse = new Fuse(products, {
    keys: ['category.name'],
    threshold: 0.4,
    distance: 100,
    includeScore: true,
  });

  const results = fuse.search(query);
  return results.map(r => r.item);
}


 

  async upsertProduct(title: string, dto: CreateProductDto) {
    return this.productModel.findOneAndUpdate(
      { title },
      dto,
      { upsert: true, new: true }
    );
  }



  async deleteProduct(id: string) {
    return this.productModel.findByIdAndDelete(id);
  }

  async restoreProduct(id: string) {
    return this.productModel.findByIdAndUpdate(id, { deleted_at: null });
  }

  async listProducts() {
    return this.productModel.find({ deleted_at: null });
  }
/**IMPORATNT
 * 
 */
  async listAndCountProducts() {
    const docs = await this.productModel.find({ deleted_at: null });
    const count = await this.productModel.countDocuments({ deleted_at: null });
    return { docs, count };
  }

  async retrieveProduct(id: string) {
    return this.productModel.findById(id);
  }


  //product category



  
  async getAllCategories() {
    return this.categoryModel.find().exec();
  }

  async getCategoryById(id: string) {
    return this.categoryModel.findById(id).exec();
  }

  async createProductCategory(dto: CreateProductCategoryDto) {
    return this.categoryModel.create(dto);
  }

  async updateProductCategory(id: string, dto: UpdateProductCategoryDto) {
    return this.categoryModel.findByIdAndUpdate(id, dto, { new: true });
  }

  async upsertProductCategory(handle: string, dto: CreateProductCategoryDto) {
    return this.categoryModel.findOneAndUpdate(
      { handle },
      dto,
      { upsert: true, new: true }
    );
  }

  async softDeleteProductCategory(id: string) {
    return this.categoryModel.findByIdAndUpdate(id, { deleted_at: new Date() });
  }

  async deleteProductCategory(id: string) {
    return this.categoryModel.findByIdAndDelete(id);
  }

  async restoreProductCategory(id: string) {
    return this.categoryModel.findByIdAndUpdate(id, { deleted_at: null });
  }

  async listProductCategories() {
    return this.categoryModel.find({ deleted_at: null });
  }

  async listAndCountProductCategories() {
    const docs = await this.categoryModel.find({ deleted_at: null });
    const count = await this.categoryModel.countDocuments({ deleted_at: null });
    return { docs, count };
  }

  async retrieveProductCategory(id: string) {
    return this.categoryModel.findById(id);
  }

  //collection

  // product.service.ts (bloc complet)

 

  //option-value // product.service.ts (bloc complet ProductOptionValue)

  async createProductOptionValue(dto: CreateProductOptionValueDto) {
    return this.optionValueModel.create(dto);
  }

  async updateProductOptionValue(id: string, dto: UpdateProductOptionValueDto) {
    return this.optionValueModel.findByIdAndUpdate(id, dto, { new: true });
  }

  async upsertProductOptionValue(value: string, dto: CreateProductOptionValueDto) {
    return this.optionValueModel.findOneAndUpdate(
      { value },
      dto,
      { upsert: true, new: true }
    );
  }

  async softDeleteProductOptionValue(id: string) {
    return this.optionValueModel.findByIdAndUpdate(id, { deleted_at: new Date() });
  }

  async deleteProductOptionValue(id: string) {
    return this.optionValueModel.findByIdAndDelete(id);
  }

  async restoreProductOptionValue(id: string) {
    return this.optionValueModel.findByIdAndUpdate(id, { deleted_at: null });
  }

  async listProductOptionValues() {
    return this.optionValueModel.find({ deleted_at: null });
  }

  async listAndCountProductOptionValues() {
    const docs = await this.optionValueModel.find({ deleted_at: null });
    const count = await this.optionValueModel.countDocuments({ deleted_at: null });
    return { docs, count };
  }

  async retrieveProductOptionValue(id: string) {
    return this.optionValueModel.findById(id);
  }
//ProductVriant

// product.service.ts (bloc complet ProductVariant)
 async findAllWithRelations() {
    return this.variantModel.find()
      .populate('product')
      .populate('prices')
      .exec();
  }



  async updateProductVariant(id: string, dto: UpdateProductVariantDto) {
    return this.variantModel.findByIdAndUpdate(id, dto, { new: true });
  }

  async upsertProductVariant(sku: string, dto: CreateVariantDto) {
    return this.variantModel.findOneAndUpdate(
      { sku },
      dto,
      { upsert: true, new: true }
    );
  }

  async softDeleteProductVariant(id: string) {
    return this.variantModel.findByIdAndUpdate(id, { deleted_at: new Date() });
  }

  async deleteProductVariant(id: string) {
    return this.variantModel.findByIdAndDelete(id);
  }

  async restoreProductVariant(id: string) {
    return this.variantModel.findByIdAndUpdate(id, { deleted_at: null });
  }

  async listProductVariants() {
    return this.variantModel.find({ deleted_at: null });
  }

  async listAndCountProductVariants() {
    const docs = await this.variantModel.find({ deleted_at: null });
    const count = await this.variantModel.countDocuments({ deleted_at: null });
    return { docs, count };
  }

  async retrieveProductVariant(id: string) {
    return this.variantModel.findById(id);
  }


  async findByIdAndUpdate(id: string, dto: UpdateProductDto, options = {}): Promise<Product> {
    const updatedProduct = await this.productModel.findByIdAndUpdate(id, dto, options).exec();
      if (!updatedProduct) {
        throw new NotFoundException(`Product with id ${id} not found`);
      }
    return updatedProduct;
  }
  //product tags



  //tag

  // product.service.ts (bloc ProductType)

  async createProductType(dto: CreateProductTypeDto) {
    return this.typeModel.create(dto);
  }

  async updateProductType(id: string, dto: UpdateProductTypeDto) {
    return this.typeModel.findByIdAndUpdate(id, dto, { new: true });
  }

  async upsertProductType(name: string, dto: CreateProductTypeDto) {
    return this.typeModel.findOneAndUpdate(
      { name },
      dto,
      { upsert: true, new: true }
    );
  }

  async softDeleteProductType(id: string) {
    return this.typeModel.findByIdAndUpdate(id, { deleted_at: new Date() });
  }

  async deleteProductType(id: string) {
    return this.typeModel.findByIdAndDelete(id);
  }

  async restoreProductType(id: string) {
    return this.typeModel.findByIdAndUpdate(id, { deleted_at: null });
  }

  async listProductTypes() {
    return this.typeModel.find({ deleted_at: null });
  }

  async listAndCountProductTypes() {
    const docs = await this.typeModel.find({ deleted_at: null });
    const count = await this.typeModel.countDocuments({ deleted_at: null });
    return { docs, count };
  }

  async retrieveProductType(id: string) {
    return this.typeModel.findById(id);
  }

    // product.service.ts (bloc ProductType)

  async createProductImage(dto: CreateProductImageDto) {
    return this.typeModel.create(dto);
  }



  /**COLLECTION DE PRODUIT */

  async findCategoriesByStore(storeId: string, page = 1, limit = 10) {
  const skip = (page - 1) * limit;

  const [categories, total] = await Promise.all([
    this.categoryModel
      .find({ store: storeId })
      .skip(skip)
      .limit(limit)
      .lean(),
    this.categoryModel.countDocuments({ store: storeId }),
  ]);

  return {
    data: categories,
    meta: {
      total,
      page,
      pageSize: limit,
      totalPages: Math.ceil(total / limit),
    },
  };
}



  
  async createCategoryInStore(dto: CreateProductCategoryDto, storeId: string) {
    const category = new this.categoryModel({
      ...dto,
      store: storeId,
      visibility: dto.visibility || Visibility.PRIVATE,
    });
    return category.save();
  }

  async findAllCategory(page = 1, limit = 10) {
    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      this.categoryModel
        .find()
        .populate('name')
        .skip(skip)
        .limit(limit)
        .lean(),
      this.categoryModel.countDocuments(),
    ]);
    return {
      data,
      meta: { total, page, pageSize: limit, totalPages: Math.ceil(total / limit) },
    };
  }




async getPublishedProducts() {
  return this.productModel
    .find({ status: ProductStatus.PUBLISHED })
    .populate("storeId", "name")  // on récupère le nom de la boutique
    .populate("variants")
    .populate("promotions", "value")
    .sort({ createdAt: -1 })
    .exec();
}

  async create(dto: CreateCollectionDto) {
    return this.collectionModel.create(dto);
  }

 async findAllCategories(page = 1, limit = 10) {
  const skip = (page - 1) * limit;

  const [data, total] = await Promise.all([
    this.categoryModel
      .find()
      .skip(skip)
      .limit(limit)
      .lean(), // renvoie des objets JS simples
    this.categoryModel.countDocuments(),
  ]);

  return {
    data,
    meta: {
      total,
      page,
      pageSize: limit,
      totalPages: Math.ceil(total / limit),
    },
  };
}

  async findOne(id: string) {
    return this.collectionModel.findById(id).populate('category', 'name');
  }




  async remove(id: string) {
    return this.collectionModel.findByIdAndDelete(id);
  }


async createCategory(dto: CreateProductCategoryDto) {
  // Vérifier d'abord si la catégorie existe
  const existing = await this.categoryModel.findOne({ name: dto.name }).lean();
  if (existing) {
    throw new BadRequestException(
      `La catégorie "${dto.name}" existe déjà.`,
    );
  }

  // Créer et sauvegarder
  const category = new this.categoryModel(dto);
  const saved = await category.save();

  // Compter le total après insertion
  const total = await this.categoryModel.countDocuments();

  return {
    data: saved.toObject(),
    meta: { total },
  };
}

async update(id: string, dto: UpdateProductCategoryDto): Promise<ProductCategory> {
  const category = await this.categoryModel.findByIdAndUpdate(id, dto, { new: true }).exec();
  if (!category) throw new NotFoundException(`Category ${id} not found`);
  return category;
}
 


  // READ ONE
  async findCategoryById(id: string): Promise<ProductCategory> {
    const category = await this.categoryModel.findById(id).exec();
    if (!category) throw new NotFoundException(`Category ${id} not found`);
    return category;
  }



 async updateCategory(id: string, dto: UpdateProductCategoryDto): Promise<ProductCategory> {
    const category = await this.categoryModel.findByIdAndUpdate(id, dto, { new: true }).exec();
    if (!category) throw new NotFoundException(`Category ${id} not found`);
    return category;
  }

 async findByName(name: string) {
    const product = await this.productModel.findOne({ name }).exec();
    if (!product) return null; // ou throw new NotFoundException('Produit introuvable');
    return product;
  }

}
