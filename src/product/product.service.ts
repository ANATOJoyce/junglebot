import { BadRequestException, Body, ConflictException, ForbiddenException, Inject, Injectable, InternalServerErrorException, NotFoundException, Post } from '@nestjs/common';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { Product } from './entities/product.entity';
import { ProductCategory } from './entities/product-category.entity';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { CreateProductCategoryDto } from './dto/category/create-product-category.dto';
import { UpdateProductCategoryDto } from './dto/category/update-product-category.dto';
import { ProductCollection } from './entities/product-collection.entity';
import { CreateProductCollectionDto } from './dto/collection/create-product-collection.dto';
import { UpdateProductCollectionDto } from './dto/collection/update-product-collection.dto';
import { ProductOption } from './entities/product-option.entity';
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

@Injectable()
export class ProductService {

  constructor(
    @InjectModel(Product.name) private readonly productModel: Model<Product>,
    @InjectModel(ProductCategory.name) private readonly categoryModel: Model<ProductCategory>,
    @InjectModel(ProductCollection.name) private readonly collectionModel: Model<ProductCollection>,
    @InjectModel(ProductOption.name) private readonly optionModel: Model<ProductOption>,
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



async createProductInStore(dto: CreateProductDto, storeId: string) {
  const store = await this.storeModel.findById(storeId);

  if (!store) {
    throw new NotFoundException("Cette boutique n'existe pas.");
  }

  const existingProduct = await this.productModel.findOne({
    storeId: store._id,
    title: dto.title,
  });

  if (existingProduct) {
    throw new ConflictException("Un produit avec ce nom existe déjà dans cette boutique.");
  }

  const product = new this.productModel({
    title: dto.title,
    description: dto.description,
    price: dto.price,
    
    imageUrl: dto.imageUrl, 
    storeId: store._id,
    variants: dto.variants || [],
  });

  try {
    const savedProduct = await product.save();
    return savedProduct;
  } catch (error) {
    console.error("Erreur lors de la création :", error);
    throw new InternalServerErrorException("Erreur lors de la création du produit.");
  }

}

async getProductsForStore({
  storeId,
  page = 1,
  limit = 10,
  search,
}: { storeId: string; page?: number; limit?: number; search?: string }) {
  if (!Types.ObjectId.isValid(storeId)) {
    throw new Error(`Invalid storeId: ${storeId}`);
  }
  const storeObjectId = new Types.ObjectId(storeId.trim());

  const query: any = { storeId: storeObjectId };
  if (search) {
    query.title = { $regex: search, $options: "i" };
  }

  // Récupération des produits avec pagination et populate de la boutique
  const products = await this.productModel
    .find(query)
    .populate('storeId', 'name') // <- ici on inclut le nom de la boutique
    .skip((page - 1) * limit)
    .limit(limit)
    .sort({ createdAt: -1 })
    .exec();

  // Calcul du stock total par produit
  const productsWithTotalStock = products.map((product) => {
    const totalStock = product.variants?.reduce((sum, v) => sum + (v.stock || 0), 0) ?? 0;
    return {
      ...product.toObject(),
      totalStock,
      store: product.storeId, // rename pour correspondre au front
    };
  });

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

 

  async create(dto: CreateProductDto & { store: string }) {
    const product = new this.productModel(dto);
    return product.save();
  }
 

 //l'adimin le regete LE PRODUIT


 



 //**SEULELEMENT LES PRODUITS QUI ON UN STATUT PUBLISHED QUI SERONT VUS DE TOUS */
  async getPublishedProducts(): Promise<Product[]> {
  return this.productModel.find({ status: 'published' }).exec();
  }
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


 



  async findAllAdmin(): Promise<Product[]> {
    return this.productModel.find().populate('user').exec();
  }

  async findAllByCtegorie(): Promise<Product[]> {
  return this.productModel.find().populate('category', 'title').exec();
 }

 async findAll() {
  return this.productModel.find(); // ← sans populate
}



  async findOne(id: string): Promise<Product> {
    const product = await this.productModel.findById(id).populate('vendor').exec();
    if (!product) {
      throw new NotFoundException(`Produit avec l'id ${id} introuvable`);
    }
    return product;
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

    const products = await this.productModel
      .find()
      .select('title description imageUrl price variants')
      .lean()
      .exec();

    const fuse = new Fuse(products, {
      keys: ['title'],
      threshold: 0.4,
      distance: 100,
      includeScore: true,
    });

    const results = fuse.search(query);
    return results.map(r => r.item);
}


  async remove(id: string): Promise<void> {
    await this.productModel.findByIdAndDelete(id);
  }



  async updateProduct(id: string, dto: UpdateProductDto) {
    return this.productModel.findByIdAndUpdate(id, dto, { new: true });
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



   async createCategory(dto: { name: string; description?: string; parent?: string }) {
    const category = new this.categoryModel(dto);
    return category.save();
  }

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

  async createProductCollection(dto: CreateProductCollectionDto) {
    return this.collectionModel.create(dto);
  }

  async updateProductCollection(id: string, dto: UpdateProductCollectionDto) {
    return this.collectionModel.findByIdAndUpdate(id, dto, { new: true });
  }

  async upsertProductCollection(handle: string, dto: CreateProductCollectionDto) {
    return this.collectionModel.findOneAndUpdate(
      { handle },
      dto,
      { upsert: true, new: true }
    );
  }

  async softDeleteProductCollection(id: string) {
    return this.collectionModel.findByIdAndUpdate(id, { deleted_at: new Date() });
  }

  async deleteProductCollection(id: string) {
    return this.collectionModel.findByIdAndDelete(id);
  }

  async restoreProductCollection(id: string) {
    return this.collectionModel.findByIdAndUpdate(id, { deleted_at: null });
  }

  async listProductCollections() {
    return this.collectionModel.find({ deleted_at: null });
  }

  async listAndCountProductCollections() {
    const docs = await this.collectionModel.find({ deleted_at: null });
    const count = await this.collectionModel.countDocuments({ deleted_at: null });
    return { docs, count };
  }

  async retrieveProductCollection(id: string) {
    return this.collectionModel.findById(id);
  }

  //  ProductOption

  async createProductOption(dto: CreateProductOptionDto) {
    return this.optionModel.create(dto);
  }

  async updateProductOption(id: string, dto: UpdateProductOptionDto) {
    return this.optionModel.findByIdAndUpdate(id, dto, { new: true });
  }

  async upsertProductOption(title: string, dto: CreateProductOptionDto) {
    return this.optionModel.findOneAndUpdate(
      { title },
      dto,
      { upsert: true, new: true }
    );
  }

  async softDeleteProductOption(id: string) {
    return this.optionModel.findByIdAndUpdate(id, { deleted_at: new Date() });
  }

  async deleteProductOption(id: string) {
    return this.optionModel.findByIdAndDelete(id);
  }

  async restoreProductOption(id: string) {
    return this.optionModel.findByIdAndUpdate(id, { deleted_at: null });
  }

  async listProductOptions() {
    return this.optionModel.find({ deleted_at: null });
  }

  async listAndCountProductOptions() {
    const docs = await this.optionModel.find({ deleted_at: null });
    const count = await this.optionModel.countDocuments({ deleted_at: null });
    return { docs, count };
  }

  async retrieveProductOption(id: string) {
    return this.optionModel.findById(id);
  }

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


  

  // product.service.ts (bloc ProductTag)

  async createProductTag(dto: CreateProductTagDto) {
    return this.tagModel.create(dto);
  }

  async updateProductTag(id: string, dto: UpdateProductTagDto) {
    return this.tagModel.findByIdAndUpdate(id, dto, { new: true });
  }

  async upsertProductTag(name: string, dto: CreateProductTagDto) {
    return this.tagModel.findOneAndUpdate(
      { name },
      dto,
      { upsert: true, new: true }
    );
  }

  async softDeleteProductTag(id: string) {
    return this.tagModel.findByIdAndUpdate(id, { deleted_at: new Date() });
  }

  async deleteProductTag(id: string) {
    return this.tagModel.findByIdAndDelete(id);
  }

  async restoreProductTag(id: string) {
    return this.tagModel.findByIdAndUpdate(id, { deleted_at: null });
  }

  async listProductTags() {
    return this.tagModel.find({ deleted_at: null });
  }

  async listAndCountProductTags() {
    const docs = await this.tagModel.find({ deleted_at: null });
    const count = await this.tagModel.countDocuments({ deleted_at: null });
    return { docs, count };
  }

  async retrieveProductTag(id: string) {
    return this.tagModel.findById(id);
  }

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


  //tag

  // product.service.ts (bloc ProductType)

  async createProductImage(dto: CreateProductImageDto) {
    return this.typeModel.create(dto);
  }

  

 

}
