import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, HydratedDocument, isValidObjectId } from 'mongoose';
import { User } from './entities/user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { Role } from '../auth/role.enum';
import { v4 as uuidv4 } from 'uuid';
import { AuthIdentity } from 'src/auth/entities/auth-identity.entity';
import { JwtService } from '@nestjs/jwt';
import { Store } from 'src/store/entities/store.entity';
import { Invite } from './entities/invite.entiy';


type UserDocument = HydratedDocument<User>;

@Injectable()
export class UserService {
  constructor(
        private readonly jwtService: JwtService,
    
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
    @InjectModel(Invite.name) private readonly inviteModel: Model<Invite>,
    @InjectModel(Store.name) private readonly storeModel: Model<Invite>,



  ) {}

async findOne(id: string) {
  if (!isValidObjectId(id)) {
    throw new BadRequestException('ID invalide');
  }

  const user = await this.userModel
    .findById(id)
    .populate('stores')
    .exec();

  if (!user) {
    throw new NotFoundException('Utilisateur introuvable');
  }

  return user;
}

  /** Créer un nouvel utilisateur */
async createUser(dto: CreateUserDto): Promise<User> {
  const user = new this.userModel({
    ...dto,
    userId: uuidv4(),
  });

  // Sauvegarder et renvoyer l'utilisateur
  return user.save();
}


  public generateTokens(user: any, identity: AuthIdentity) {
      // Ton code de génération de JWT ici
  
      const payload = {
        sub: user.id.toString(),
        auth_identity: identity.id.toString(),
        phone: user.phone,
        first_name: user.first_name,
        roles: [user.role],
      };
  
      const access_token = this.jwtService.sign(payload, {
        expiresIn: '1h',
        secret: process.env.JWT_SECRET,
      });
  
      const refreshPayload = {
        sub: user.id.toString(),
      };
  
      const refresh_token = this.jwtService.sign(refreshPayload, {
        secret: process.env.JWT_REFRESH_SECRET,
        expiresIn: '7d',
      });
  
      return {
        access_token,
        refresh_token,
      };
    }
    

/** Cherche par userId au lieu de _id */
  async findOneByUserId(userId: string): Promise<UserDocument | null> {
    return this.userModel.findById(userId).exec()//this.userModel.findOne({ id:userId }).exec();
  }

  async findByEmail(email: string) {
  return this.userModel.findOne({ email }).exec();
}

async findOneByEmailOrUsername(login: string): Promise<User | null> {
  return this.userModel.findOne({
    $or: [{ email: login }, { username: login }],
  });
}




  /** Récupérer un utilisateur par ID */
  async findOneById(id: string): Promise<UserDocument | null> {
    return this.userModel.findById(id).exec();
  }

  /** Récupérer un utilisateur par nom d’utilisateur */
  async findByUsername(username: string): Promise<UserDocument | null> {
    return this.userModel.findOne({ username }).exec();
  }

  /** Récupérer un utilisateur par numéro de téléphone */
  async findByPhone(phone: string): Promise<UserDocument | null> {
    return this.userModel.findOne({ phone }).exec();
  }

  /** Mettre à jour un utilisateur */
  async update(id: string, updateUserDto: UpdateUserDto): Promise<UserDocument | null> {
    return this.userModel.findByIdAndUpdate(id, updateUserDto, { new: true }).exec();
  }

 
  /** recuper tout le role de tout les utilisateur */
  async findAllByRole(role: Role): Promise<User[]> {
    return this.userModel.find({ role }).exec();
  }

  // user.service.ts

async checkUserHasStoreByEmailOrPhone(email?: string, phone?: string): Promise<boolean> {
  const query: any = {};
  if (email) query.email = email;
  if (phone) query.phone = phone;

  const user = await this.userModel.findOne(query);
  if (!user) return false;

  const store = await this.storeModel.findOne({ owner: user._id });
  return !!store;
}

async updateUser(userId: string, dto: UpdateUserDto): Promise<User> {
    const user = await this.userModel.findById(userId);
    if (!user) {
      throw new NotFoundException('Utilisateur non trouvé');
    }

    // Mettre à jour uniquement les champs fournis
    Object.assign(user, dto);

    return user.save();
  }



   // Récupérer tous les utilisateurs avec pagination et recherche
async findAll(page = 1, limit = 10, search = '') {
  const query = search
    ? {
        $or: [
          { first_name: { $regex: search, $options: 'i' } },
          { last_name: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } },
          { phone: { $regex: search, $options: 'i' } },
        ],
      }
    : {};

  const users = await this.userModel
    .find(query)
    .populate('stores') // <-- ici tu lies la boutique
    .skip((page - 1) * limit)
    .limit(limit)
    .exec();

  const count = await this.userModel.countDocuments(query);

  return { users, count };
}


  // Supprimer un utilisateur par ID
  async remove(userId: string) {
    const result = await this.userModel.findByIdAndDelete(userId).exec();
    if (!result) throw new NotFoundException('Utilisateur non trouvé');
    return result;
  }

  // Changer le rôle d’un utilisateur
  async changeRole(userId: string, newRole: string) {
    const user = await this.userModel.findById(userId).exec();
    if (!user) throw new NotFoundException('Utilisateur non trouvé');
    user.role = newRole as any;
    return user.save();
  }
  
}
