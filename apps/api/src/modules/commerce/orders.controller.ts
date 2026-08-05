import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AuthGuard } from '../auth/guards/auth.guard';
import { StudentRoleGuard } from '../auth/guards/student-role.guard';
import type { AuthenticatedUser } from '../auth/interfaces/authenticated-user.interface';
import { CommerceService } from './commerce.service';

@Controller('api/v1/orders')
@UseGuards(AuthGuard, StudentRoleGuard)
export class OrdersController {
  constructor(private readonly commerceService: CommerceService) {}

  @Get(':orderId')
  getOrder(
    @Param('orderId') orderId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.commerceService.getOrder(user.id, orderId);
  }
}
