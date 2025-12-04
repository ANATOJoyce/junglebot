import { Controller, Get, Post, Body, Patch, Param, Delete, HttpStatus, HttpException, UsePipes, ValidationPipe, Query, Req, UseGuards, Put } from '@nestjs/common';
import { UserService } from './user.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import mongoose from 'mongoose';
import { Role } from '../auth/role.enum';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { AuthRequest } from 'src/types/auth-request';
import { Roles } from 'src/auth/roles.decorator';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from 'src/auth/roles.guards';

import { User } from './entities/user.entity';
import { CurrentUser } from 'src/auth/current-user.decorator';


@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}


  
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(Role.ADMIN, Role.VENDOR)
  @Get('/profile')
  async getProfile(@CurrentUser() user: User) {
    return user; // déjà bien typé grâce au décorateur
  }
  


  //user/:id(recherceh d'un utililisateur par son id )
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Roles(Role.VENDOR)
@Get('me')
async findMe(@CurrentUser() id: string) {
  const isValid = mongoose.Types.ObjectId.isValid(id);
  if (!isValid) throw new HttpException('Utilisateur introuvable', 404);

  const findOneUser = await this.userService.findOneById(id);
  if (!findOneUser) throw new HttpException('Utilisateur est absent', 404);

  return findOneUser;
}


  @Patch(':id')
  @UsePipes()
  async updateUser(@Param('id') id: string, @Body(ValidationPipe) updateUserDto: UpdateUserDto) {
    const isValid = mongoose.Types.ObjectId.isValid(id);
    if (!isValid) throw new HttpException('ID invalide',400);
    const updateUser = await this.userService.update(id, updateUserDto);
    if (!updateUser) throw new HttpException('user not found', 404);
    return updateUser;

  }

  @Delete(':id')
  async deleteUser(@Param('id') id: string) {
    const isValid = mongoose.Types.ObjectId.isValid(id);
    if (!isValid) throw new HttpException('Invalid ID',400);
    const deleteUser = await this.userService.remove(id);
    if (!deleteUser) throw new HttpException('User Not Found', 404);
    return this.userService.remove(id);
  }
  
  @Get() // GET /users ou GET /users?role=VENDOR
  findAllByRole(@Query('role') role?: Role) {
    if (role) {
      return this.userService.findAllByRole(role);
    }
    return this.userService.findAll(); // <- récupère tout si aucun rôle fourni
  }

// user.controller.ts

  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(Role.ADMIN, Role.VENDOR)
  @Put('/profile')
  async updateProfile(
    @CurrentUser() user: User,
    @Body() dto: UpdateUserDto
  ) {
    return this.userService.updateUser(user.id, dto);
  }
 

   // ----------------- GET /users -----------------
@UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(Role.ADMIN)
  @Get()
  async findAll(
    @Query('page') page = '1',
    @Query('limit') limit = '10',
    @Query('q') search = '',
  ) {
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    return this.userService.findAll(pageNum, limitNum, search);
  }

  // ----------------- DELETE /users/:id -----------------
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(Role.ADMIN)
  @Delete(':id')
  async remove(@Param('id') userId: string) {
    return this.userService.remove(userId);
  }

  // ----------------- PATCH /users/:id/role -----------------
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(Role.ADMIN, Role.VENDOR)
  @Patch(':id/role')
  async changeRole(@Param('id') userId: string, @Body('role') role: string) {
    return this.userService.changeRole(userId, role);
  }
  
}
