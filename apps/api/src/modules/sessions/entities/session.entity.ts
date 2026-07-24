export class SessionEntity {
  // TODO: convert to TypeORM entity once database dependencies are added.
  id!: string;
  userId!: string;
  tokenHash!: string;
  expiresAt!: Date;
  revokedAt!: Date | null;
  createdAt!: Date;
}
