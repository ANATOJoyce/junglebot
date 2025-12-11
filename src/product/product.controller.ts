import { Controller, Get, Post, Body, Patch, Param, Delete, Put, UseInterceptors, UploadedFile, Req, UseGuards, Query, BadRequestException, UnauthorizedException, NotFoundException, Type ,Request} from '@nestjs/common';
import { ProductService } from './product.service';
import { FileInterceptor } from '@nestjs/platform-express';
import { CloudinaryService } from './cloudinary.service';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { RolesGuard } from 'src/auth/roles.guards';
import { Roles } from 'src/auth/roles.decorator';
import { Role } from 'src/auth/role.enum';

import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { CreateVariantDto } from './dto/variant/create-product-variant.dto';
import { CreateProductCategoryDto } from './dto/category/create-product-category.dto';
import { CreateProductTagDto } from './dto/tage/create-product-tag.dto';
import { CreateProductOptionDto } from './dto/option/create-product-option.dto';
import { CreateProductOptionValueDto } from './dto/option-value/create-product-option-value.dto';
import { CurrentStore } from 'src/store/current-store.decorator';
import { Store } from 'src/store/entities/store.entity';
import { OwnerGuard } from 'src/auth/owner.guard';
import { AuthRequest } from 'src/types/auth-request';
import { AuthGuard } from '@nestjs/passport';
import { CurrentUser } from 'src/auth/current-user.decorator';
import { StoreGuard } from 'src/auth/StoreAuthGuard';
import { User } from 'src/user/entities/user.entity';
import { ProductStatus } from './product-enum';
import { UpdateProductCategoryDto } from './dto/category/update-product-category.dto';
import { CreateCollectionDto } from './dto/collection/create-product-collection.dto';



@Controller('product')
export class ProductController {
  constructor(
    private readonly productService: ProductService,

  ) {}

  // ==============================================
  // SECTION 1: CORE PRODUCT OPERATIONS
  // ==============================================
  
 /*
  @Get(':id')
  @Roles(Role.ADMIN, Role.VENDOR)
  findOne(@Param('id') id: string) {
    return this.productService.retrieveProduct(id);
  }*/
@Post('collections')
  async createCollection(@Body() dto: CreateCollectionDto) {
    return this.productService.createCollection(dto);
  }

  @Get('collections')
  async findAllCollections(
    @Query('page') page = 1,
    @Query('limit') limit = 10,
  ) {
    return this.productService.findAllCollections(Number(page), Number(limit));
  }



    
  @Post('categories')
  async createCategory(@Body() dto: CreateProductCategoryDto) {
    return this.productService.createCategory(dto);
  }


  @Get('search')
  async search(@Query('title') title: string) {
    return this.productService.searchProductsByTitleFuzzy(title);
  }

  
 @Get('categories')
  async findAllCategories(
    @Query('page') page = 1,
    @Query('limit') limit = 10,
  ) {
    return this.productService.findAllCategory(Number(page), Number(limit));
  }

/*
@Get(':id')
async findOne(@Param('id') id: string) {
  const product = await this.productService.findOne(id);
  if (!product) throw new NotFoundException(`Produit ${id} introuvable`);
  return { product };
}
*/
  @Get("published")
  async getPublishedProducts() {
    const products = await this.productService.getPublishedProducts();
    return products;
  }

  @Get(':id')
  async getProduct(@Param('id') id: string) {
    return this.productService.getProductWithVariants(id);
  }

  @Put(':id')
  @Roles(Role.ADMIN, Role.VENDOR)
  update(@Param('id') id: string, @Body() dto: UpdateProductDto) {
    return this.productService.updateProduct(id, dto);
  }


 



  @UseGuards(JwtAuthGuard, StoreGuard)
  @Roles(Role.ADMIN, Role.VENDOR)
  @Post(':storeId')
  async createProduct(
    @Param('storeId') storeId: string,
    @Body() dto: CreateProductDto,
  ) {
    return this.productService.createProductInStore(dto, storeId);
  }




@UseGuards(JwtAuthGuard, StoreGuard)
@Roles(Role.ADMIN, Role.VENDOR, Role.CUSTOMER)
  @Get('store/:storeId')
  async getProducts(
    @Param('storeId') storeId: string,
    @Query('page') page = '1',
    @Query('limit') limit = '10',
    @Query('search') search?: string
    
  ) {
    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    // Construction des paramètres de recherche
    const queryOptions: any = {
      storeId,
      page: pageNum,
      limit: limitNum,
    };

    if (search) queryOptions.search = search;

    // Appel du service pour récupérer les produits
    return this.productService.getProductsForStore({
  storeId,
  page: pageNum,
  limit: limitNum,
  search,
});

}



  @Get('filter')
  async filterProducts(
    @Query('storeId') storeId: string,
    @Query('minPrice') minPrice?: string,
    @Query('maxPrice') maxPrice?: string,
    @Query('size') size?: string,
    @Query('color') color?: string,
  ) {
    return this.productService.getProductsByVariantAndPrice(storeId, {
      minPrice: minPrice ? Number(minPrice) : undefined,
      maxPrice: maxPrice ? Number(maxPrice) : undefined,
      size,
      color, 
    });
  }




  @Get()
  async getAllProduct(){
    return this.productService.findAllCategories()
  }
 
 
  @Patch(':id')
  async updateProduct(@Param('id') id: string, @Body() dto: UpdateProductDto) {
    return this.productService.updateProduct(id, dto);
  }

  // Mettre à jour le status
  @Patch(':id/status')
  async updateStatus(@Param('id') id: string, @Body('status') status: string) {
    return this.productService.updateStatus(id, status);
  }

 

  // ==============================================
  // SECTION 4: PRODUCT VARIANTS
  // ==============================================


  @Get('variants')
  @Roles(Role.ADMIN, Role.VENDOR)
  listVariants() {
    return this.productService.listProductVariants();
  }

  @Get('variants/:id')
  @Roles(Role.ADMIN, Role.VENDOR)
  getVariant(@Param('id') id: string) {
    return this.productService.retrieveProductVariant(id);
  }

  // ==============================================
  // SECTION 5: PRODUCT CATEGORIES
  // ==============================================


  @Post('tags')
  @Roles(Role.ADMIN, Role.VENDOR)
  createTag(@Body() dto: CreateProductTagDto) {
    return this.productService.createProductTag(dto);
  }

  @Get('tags')
  @Roles(Role.ADMIN, Role.VENDOR)
  listTags() {
    return this.productService.listProductTags();
  }


 
  @Post('option-values')
  @Roles(Role.ADMIN, Role.VENDOR)
  createOptionValue(@Body() dto: CreateProductOptionValueDto) {
    return this.productService.createProductOptionValue(dto);
  }

  // ==============================================
  // SECTION 9: PUBLIC ENDPOINTS
  // ==============================================

  @Get('public/pagination')
  async getPublishedProduct(
    @Query('page') page = 1,
    @Query('limit') limit = 10,
    @Query('search') search = '',
    @Query('sort') sort = '-createdAt',
    @Query('category') category?: string,
    @Query('minPrice') minPrice?: string,
    @Query('maxPrice') maxPrice?: string
  ) {
    // Convertir les minPrice et maxPrice en nombres si définis
    const filters = {
      search,
      category,
      minPrice: minPrice ? parseFloat(minPrice) : undefined,  // Utilisation de parseFloat pour plus de sécurité
      maxPrice: maxPrice ? parseFloat(maxPrice) : undefined,  // Utilisation de parseFloat pour plus de sécurité
    };

    // Appel du service pour obtenir les produits avec les filtres
    return this.productService.getProductsWithFilters(
      filters,            // Filtrage dynamique basé sur les paramètres
      Number(page),       // Page convertie en nombre
      Number(limit),      // Limit converti en nombre
      
      sort                // Tri des produits
    );
  }


  @Get('budget')
  async searchByBudget(
    @Query('min') min: number,
    @Query('max') max: number
  ) {
    return this.productService.searchProductsByBudget(min, max);
  }





  @Patch(':id/soft-delete')
  @Roles(Role.ADMIN, Role.VENDOR)
  softDelete(@Param('id') id: string) {
    return this.productService.softDeleteProduct(id);
  }

  @Post(':id/restore')
  @Roles(Role.ADMIN, Role.VENDOR)
  restore(@Param('id') id: string) {
    return this.productService.restoreProduct(id);
  }



@Get('category/store/:storeId')
async getCategoriesByStore(
  @Param('storeId') storeId: string,
  @Query('page') page = '1',
  @Query('limit') limit = '10',
) {
  return this.productService.findCategoriesByStore(storeId, +page, +limit);
}




  @Post(':id/variant')
  async createVariant(@Param('id') id: string, @Body() body: any) {
    const { size, color, price, stock } = body;
    return this.productService.createVariant(id, { size, color, price, stock });
  }


  
  @UseGuards(JwtAuthGuard, StoreGuard)
  @Roles(Role.ADMIN)
  @Get('categories/:id')
  async findCategoryById(@Param('id') id: string) {
    return this.productService.findCategoryById(id);
  }

 @UseGuards(JwtAuthGuard, StoreGuard)
  @Roles(Role.ADMIN)
  @Put('categories/:id')
  async updateCategory(@Param('id') id: string, @Body() dto: UpdateProductCategoryDto) {
    return this.productService.updateCategory(id, dto);
  }

 @UseGuards(JwtAuthGuard, StoreGuard)
  @Roles(Role.ADMIN)
  @Post()
  async create(@Body() dto: CreateCollectionDto) {
    return this.productService.create(dto);
  }




  @UseGuards(JwtAuthGuard, StoreGuard)
  @Roles(Role.ADMIN)
  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.productService.findOne(id);
  }

  @UseGuards(JwtAuthGuard, StoreGuard)
  @Roles(Role.ADMIN)
  @Delete(':id')
  async remove(@Param('id') id: string) {
    return this.productService.remove(id);
  }






}