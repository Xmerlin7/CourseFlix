import { UserRole } from '../../auth/interfaces/authenticated-user.interface';

export class UserEntity {
  // TODO: convert to TypeORM entity once database dependencies are added.
  id!: string;
  email!: string;
  passwordHash!: string;
  role!: UserRole;
  createdAt!: Date;
  updatedAt!: Date;
}
