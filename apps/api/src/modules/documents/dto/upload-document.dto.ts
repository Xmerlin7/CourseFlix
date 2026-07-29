/**
 * Not a class-validator request DTO — the request itself is
 * multipart/form-data with a single `file` field, parsed by
 * `FileInterceptor`. This carries the validated/normalized file data
 * from the controller into `DocumentsService.uploadDocument()`.
 */
export class UploadDocumentDto {
  originalName!: string;
  mimeType!: string;
  buffer!: Buffer;
  sizeBytes!: number;
}
