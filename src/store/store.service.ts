import { BadRequestException, Get, Injectable, InternalServerErrorException, NotFoundException, Req, UseGuards } from '@nestjs/common';
import { UpdateStoreDto } from './dto/update-store.dto';
import { Currency, CurrencyDocument } from 'src/currency/entities/currency.entity';
import { InjectModel } from '@nestjs/mongoose';
import { Store, StoreDocument } from './entities/store.entity';
import mongoose, { Model, Types } from 'mongoose';
import { CreateCurrencyDto } from './dto/create-currency.dto';
import { User, UserDocument } from 'src/user/entities/user.entity';
import { JwtService } from '@nestjs/jwt';
import { CreateStoreWithUserDto } from './dto/create-store-with-user.dto';
import { Role } from 'src/auth/role.enum';
import { UserService } from 'src/user/user.service';
import { CreateStoreDto } from './dto/create-store.dto';
import { UpdateCurrencyDto } from 'src/currency/dto/update-currency.dto';
import { StoreStatus } from './update-store-status.dto';
import { MailService } from 'src/mail/mail.service';
import { Region, RegionDocument } from 'src/region/entities/region.entity';
import { Country, CountryDocument } from 'src/region/entities/country.entity';
import { VerificationCodeDocument, VerificationType } from 'src/verification/entities/verification-code.entity';
import { VerificationCodeService } from 'src/verification/verification-code.service';

@Injectable()
export class StoreService {

  constructor(
      @InjectModel(Currency.name) private readonly currencyModel: Model<CurrencyDocument>,
      @InjectModel(Store.name) private readonly storeModel: Model<StoreDocument>,
      @InjectModel(Country.name) private regionModel: Model<CountryDocument>,
      @InjectModel(User.name) private readonly userModel: Model<UserDocument>,


      private jwtService: JwtService,
      private readonly mailService: MailService,
    private readonly verificationCodeService: VerificationCodeService, //

  ) {}

  async NomExitante(NameStore: string){
    const nom = await this.storeModel.name
    if (NameStore == nom){
      throw new NotFoundException(" cette boutique existe deja ")
    }
    return nom
  }

async createStoreForExistingUser(dto: CreateStoreDto & { owner: string }) {
  const session = await this.storeModel.db.startSession();
  session.startTransaction();

  try {
    // 🔹 Vérification si une boutique avec le même nom existe déjà
    const existingStore = await this.storeModel.findOne({ name: dto.name }).session(session);
    if (existingStore) {
      throw new BadRequestException(`Une boutique avec le nom "${dto.name}" existe déjà.`);
    }

    const user = await this.userModel.findById(dto.owner).session(session);
    if (!user) throw new NotFoundException("Utilisateur introuvable");

    const region = await this.regionModel.findById(dto.country).session(session);
    if (!region) throw new NotFoundException("Région introuvable");

    const currency = region.currency_code;
    if (!currency) throw new NotFoundException("Le pays associé n’a pas de devise définie");

    const store = new this.storeModel({
      ...dto,
      owner: user._id,
      country: region._id,
      supported_currencies: currency,
      status: StoreStatus.INACTIVE,
    });

    await store.save({ session });

    user.stores = user.stores || [];
    user.stores.push(store.id);
    await user.save({ session });

    await session.commitTransaction();

    // 🔹 Contenu du mail
    const subject = `Votre boutique "${store.name}" a été créée avec succès !`;
    const html = `
      <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
        <h1 style="color: #fbb344;">Félicitations, ${user.first_name} !</h1>
        <p>Votre boutique <strong>${store.name}</strong> a été créée avec succès.</p>
        <p>Attendez un instant pour l'activation de votre boutique.</p>
        <hr style="border:none;border-top:1px solid #eee;margin:20px 0;">
        <p style="font-size:12px;color:#888;">
          Si vous n'avez pas créé cette boutique, ignorez ce message.
        </p>
      </div>
    `;

    // 🔹 Envoi du mail directement
    await this.mailService.sendMail({
      to: user.email,
      subject,
      html,
    });

    return {
      message: "Boutique créée avec succès. Un email de confirmation a été envoyé.",
      store,
    };
  } catch (err) {
    await session.abortTransaction();
    console.error("Erreur lors de la création de la boutique :", err);
    throw err instanceof BadRequestException
      ? err
      : new InternalServerErrorException("Échec de la création de la boutique");
  } finally {
    session.endSession();
  }
}




  async getStoreByIdAndUser(storeId: string, userId: string) {
    return this.storeModel.findOne({ _id: storeId, userId }); // ou tenantId selon ta structure
  }


  async findByUserId(userId: string): Promise<Store | null> {
    return this.storeModel.findOne({ user: userId }).exec();
  }

/**LE MESSI  */
  async findStoreByUserId(userId: string | Types.ObjectId) {
    const objectId = new Types.ObjectId(userId); // cast manuel
    return this.storeModel.find({ owner: objectId });
  }

  async updateStore(id: string, dto: UpdateStoreDto) {
    return this.storeModel.findByIdAndUpdate(id, dto, { new: true });
  }

async getMyStores(userId: string) {
  return this.storeModel
    .find({ owner: userId })
    .populate('country', 'name iso2') // récupère uniquement name et iso2 du pays
    .exec();
}


  async findOneByIdAndUser(storeId: string) {
    const storeObjectId = new Types.ObjectId(storeId);
    console.log("storeId converti en ObjectId:", storeObjectId);
    const store = await this.storeModel.findOne({
      _id: storeObjectId,
    
    });

    console.log("la BOUTIQUE", store);

    if (!store ) {
      throw new BadRequestException('boutique pas trouver.');
    }else{
      throw new BadRequestException('succes')
    } 

    return store?.id;
  }


  async findByOwner(ownerId: string) {
    return this.storeModel.findOne({ owner: ownerId });
  }


  async findStoreByIdAndUser(storeId: string, userId: string) {
    return this.storeModel.findOne({ _id: storeId, ownerId: userId }); // ownerId ou vendorId
  }

  // store.service.ts 

async findAll(params: any) {
  const { page = 1, limit = 10, q = "" } = params;

  const query = q
    ? { name: { $regex: q, $options: "i" } }
    : {};

  const [stores, count] = await Promise.all([
    this.storeModel
      .find(query)
      .skip((page - 1) * limit)
      .limit(limit)
      .populate('owner', 'email first_name last_name')
      .populate('country', 'name currency_code'), //  ici c'est correct
    this.storeModel.countDocuments(query),
  ]);

  return { stores, count };
}


  async findOne(id: string, user?: any) {
    const storeId = id === 'me' ? user?.id ?? id : id;

    if (!mongoose.Types.ObjectId.isValid(storeId)) {
      throw new BadRequestException('Invalid store ID');
    }

    return this.storeModel
      .findById(storeId)
      .populate('country', 'name currency_code')
      .populate('owner', 'email first_name last_name');
  }


  
  async update(id: string, updateStoreDto: UpdateStoreDto): Promise<Store> {
    const updatedStore = await this.storeModel.findByIdAndUpdate(id, updateStoreDto, { new: true }).exec();
    if (!updatedStore) {
      throw new NotFoundException(`Store with id ${id} not found`);
    }
    return updatedStore;
  }

  async remove(id: string): Promise<Store> {
    const deletedStore = await this.storeModel.findByIdAndDelete(id).exec();
    if (!deletedStore) {
      throw new NotFoundException(`Store with id ${id} not found`);
    }
    return deletedStore;
  }

  //-------------------------------
  // CRUD CURRENCY 
  // -------------------------------

async activateStore(storeId: string): Promise<Store> {
  const store = await this.storeModel.findById(storeId);
  if (!store) throw new NotFoundException('Boutique non trouvée');

  store.status = StoreStatus.ACTIVE;
  await store.save();

  const owner = await this.userModel.findById(store.owner);
  if (!owner) throw new NotFoundException('Propriétaire introuvable');

  // 🔹 Vérifier que le mail existe avant d’envoyer
  if (owner.email) {
    await this.mailService.sendStoreActivatedEmail(owner.email, store.name);
    console.log(`Email d'activation envoyé à ${owner.email}`);
  } else {
    console.warn(` Aucun email défini pour le propriétaire de la boutique ${store.name}`);
  }

  return store;
}


  // store.service.ts

  
}
 