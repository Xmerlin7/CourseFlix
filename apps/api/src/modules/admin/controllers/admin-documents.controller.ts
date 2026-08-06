import {
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '../../auth/guards/auth.guard';
import { AdminRoleGuard } from '../../auth/guards/admin-role.guard';
import { AdminDocumentsService } from '../services/admin-documents.service';
import { ListDocumentsQueryDto } from '../dto/list-documents-query.dto';

@Controller('api/v1/admin/documents')
@UseGuards(AuthGuard, AdminRoleGuard)
export class AdminDocumentsController {
  constructor(private readonly adminDocumentsService: AdminDocumentsService) {}

  @Get()
  listDocuments(@Query() query: ListDocumentsQueryDto) {
    return this.adminDocumentsService.listDocuments(query);
  }

  @Delete(':documentId')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteDocument(@Param('documentId') documentId: string) {
    await this.adminDocumentsService.deleteDocument(documentId);
  }
}
