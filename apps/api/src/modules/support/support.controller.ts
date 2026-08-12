import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AuthGuard } from '../auth/guards/auth.guard';
import { StudentRoleGuard } from '../auth/guards/student-role.guard';
import { SupportStaffRoleGuard } from '../auth/guards/support-staff-role.guard';
import type { AuthenticatedUser } from '../auth/interfaces/authenticated-user.interface';
import { CreateMessageDto } from './dto/create-message.dto';
import { UpdateStatusDto } from './dto/update-status.dto';
import type {
  SupportTicketCategory,
  SupportTicketStatus,
} from './entities/support-ticket.entity';
import type { StaffTicketListFilters } from './support.service';
import { SupportService } from './support.service';

type UploadedAttachment = {
  originalname: string;
  mimetype: string;
  buffer: Buffer;
  size: number;
};

const TICKET_STATUSES: readonly SupportTicketStatus[] = [
  'open',
  'in_progress',
  'waiting_for_student',
  'resolved',
  'closed',
];
const TICKET_CATEGORIES: readonly SupportTicketCategory[] = [
  'technical',
  'course',
  'payment',
  'account',
  'other',
];

function decodeOriginalName(filename: string | undefined): string {
  if (!filename) return '';
  try {
    const decoded = Buffer.from(filename, 'latin1').toString('utf8');
    if (/[\u0600-\u06FF]/.test(decoded)) {
      return decoded;
    }
  } catch {
    // fallback
  }
  return filename;
}

@Controller('api/v1/support')
@UseGuards(AuthGuard)
export class SupportController {
  constructor(private readonly supportService: SupportService) {}

  @Post('tickets')
  @UseGuards(StudentRoleGuard)
  @UseInterceptors(FileInterceptor('attachment'))
  createTicket(
    @CurrentUser() user: AuthenticatedUser,
    @Body('category') category: SupportTicketCategory,
    @Body('subject') subject: string,
    @Body('description') description: string,
    @Body('courseId') courseId: string | undefined,
    @UploadedFile() attachment?: UploadedAttachment,
  ) {
    return this.supportService.createTicket(user, {
      category,
      subject: subject ?? '',
      description: description ?? '',
      courseId: courseId || undefined,
      attachment: attachment
        ? {
            buffer: attachment.buffer,
            originalName: decodeOriginalName(attachment.originalname),
            mimeType: attachment.mimetype,
            sizeBytes: attachment.size,
          }
        : undefined,
    });
  }

  @Get('tickets')
  @UseGuards(StudentRoleGuard)
  listMyTickets(
    @CurrentUser() user: AuthenticatedUser,
    @Query('status') status?: string,
  ) {
    const parsedStatus = TICKET_STATUSES.includes(status as SupportTicketStatus)
      ? (status as SupportTicketStatus)
      : undefined;
    return this.supportService.listMyTickets(user, parsedStatus);
  }

  @Get('staff/tickets')
  @UseGuards(SupportStaffRoleGuard)
  listStaffTickets(
    @Query('status') status?: string,
    @Query('category') category?: string,
    @Query('courseId') courseId?: string,
    @Query('search') search?: string,
  ) {
    const filters: StaffTicketListFilters = {
      status: TICKET_STATUSES.includes(status as SupportTicketStatus)
        ? (status as SupportTicketStatus)
        : undefined,
      category: TICKET_CATEGORIES.includes(category as SupportTicketCategory)
        ? (category as SupportTicketCategory)
        : undefined,
      courseId: courseId || undefined,
      search: search?.trim() || undefined,
    };
    return this.supportService.listStaffTickets(filters);
  }

  // Reachable by the owning student or any support staff — resolved in
  // the service, same reasoning as DiscussionsController.
  @Get('tickets/:ticketId')
  getTicket(
    @Param('ticketId') ticketId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.supportService.getTicket(ticketId, user);
  }

  @Post('tickets/:ticketId/messages')
  addMessage(
    @Param('ticketId') ticketId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateMessageDto,
  ) {
    return this.supportService.addMessage(ticketId, user, dto);
  }

  @Patch('tickets/:ticketId/status')
  @UseGuards(SupportStaffRoleGuard)
  updateStatus(
    @Param('ticketId') ticketId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: UpdateStatusDto,
  ) {
    return this.supportService.updateStatus(ticketId, user, dto);
  }
}
