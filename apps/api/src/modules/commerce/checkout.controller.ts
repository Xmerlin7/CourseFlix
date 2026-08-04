import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AuthGuard } from '../auth/guards/auth.guard';
import { StudentRoleGuard } from '../auth/guards/student-role.guard';
import type { AuthenticatedUser } from '../auth/interfaces/authenticated-user.interface';
import { CommerceService } from './commerce.service';
import { ConfirmOrderDto } from './dto/confirm-order.dto';
import { CreateOrderDto } from './dto/create-order.dto';

@Controller('api/v1/checkout')
@UseGuards(AuthGuard, StudentRoleGuard)
export class CheckoutController {
  constructor(private readonly commerceService: CommerceService) {}

  @Post('orders')
  @HttpCode(HttpStatus.CREATED)
  createOrder(
    @Body() dto: CreateOrderDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.commerceService.createDraftOrder(user.id, dto);
  }

  @Post('orders/:orderId/confirm')
  confirmOrder(
    @Param('orderId') orderId: string,
    @Body() dto: ConfirmOrderDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.commerceService.confirmOrder(user.id, orderId, dto);
  }
}
