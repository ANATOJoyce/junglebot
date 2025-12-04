import { Controller, Post, Body, Param, BadRequestException } from '@nestjs/common';
import { ManagerService } from './manager.service';
import { RegisterDto } from 'src/auth/dto/Register.dto';

@Controller('manager')
export class ManagerController {
  constructor(private readonly managerService: ManagerService) {}

  // Endpoint pour créer un manager (vendeur doit passer son ID)
  @Post('register/:vendorId')
  async registerManager(
    @Param('vendorId') vendorId: string,
    @Body() registerDto: RegisterDto,
  ) {
    return await this.managerService.createManager(registerDto, vendorId);
  }

  // Endpoint pour vérifier OTP et activer le compte + générer JWT
  @Post('verify-otp')
  async verifyOtp(
    @Body() body: { email: string; code: string },
  ) {
    return await this.managerService.verifyOtp(body.email, body.code);
  }

  // Endpoint pour récupérer un manager avec le vendeur qui l'a nommé
  @Post('get/:managerId')
  async getManagerWithVendor(@Param('managerId') managerId: string) {
    const manager = await this.managerService.findByIdWithVendor(managerId);
    if (!manager) throw new BadRequestException('Manager non trouvé');
    return manager;
  }

}
 