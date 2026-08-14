import {
  BadRequestException,
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Patch,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AuthGuard } from '../auth/guards/auth.guard';
import type { AuthenticatedUser } from '../auth/interfaces/authenticated-user.interface';
import { ChangePasswordDto } from './dto/change-password.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { UpdateSettingsDto } from './dto/update-settings.dto';
import type { UploadedAvatarFile } from './users.service';
import { UsersService } from './users.service';

// Self-service "my account" surface — every route here acts on the
// session-derived user only (never a userId param), unlike AdminUsersController.
@Controller('api/v1/users/me')
@UseGuards(AuthGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Patch('profile')
  async updateProfile(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: UpdateProfileDto,
  ): Promise<AuthenticatedUser> {
    const updated = await this.usersService.updateOwnProfile(user.id, dto);
    return {
      id: updated.id,
      email: updated.email,
      role: updated.role,
      fullName: updated.fullName,
      avatarUrl: updated.avatarUrl,
      whatsappNumber: updated.whatsappNumber,
      managedByTeacherId: updated.managedByTeacherId,
    };
  }

  @Post('avatar')
  @UseInterceptors(FileInterceptor('file'))
  async uploadAvatar(
    @CurrentUser() user: AuthenticatedUser,
    @UploadedFile() file?: UploadedAvatarFile,
  ): Promise<AuthenticatedUser> {
    if (!file) {
      throw new BadRequestException('لم يتم إرفاق أي صورة.');
    }

    const updated = await this.usersService.uploadAvatar(user.id, file);
    return {
      id: updated.id,
      email: updated.email,
      role: updated.role,
      fullName: updated.fullName,
      avatarUrl: updated.avatarUrl,
      whatsappNumber: updated.whatsappNumber,
      managedByTeacherId: updated.managedByTeacherId,
    };
  }

  @Get('settings')
  getSettings(@CurrentUser() user: AuthenticatedUser) {
    return this.usersService.getSettings(user.id);
  }

  @Patch('settings')
  updateSettings(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: UpdateSettingsDto,
  ) {
    return this.usersService.updateSettings(user.id, dto);
  }

  @Patch('password')
  @HttpCode(HttpStatus.NO_CONTENT)
  async changePassword(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: ChangePasswordDto,
  ): Promise<void> {
    await this.usersService.changePassword(
      user.id,
      dto.currentPassword,
      dto.newPassword,
    );
  }
}
