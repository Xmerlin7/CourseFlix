import { DataSource, Repository } from 'typeorm';
import * as argon2 from 'argon2';
import { UserEntity } from '../../modules/users/entities/user.entity';

export interface SeededUsers {
  teacher: UserEntity;
  student: UserEntity;
}

/**
 * Seeds exactly the one teacher and one student the Sprint 1 fixture
 * needs (see sprint1-plan.md "Shared Team Task: DB and Seeds"). Safe to
 * run on every reseed: upserts by email instead of inserting duplicates.
 *
 * Credentials come from env (`SEED_TEACHER_EMAIL`/`SEED_TEACHER_PASSWORD`,
 * `SEED_STUDENT_EMAIL`/`SEED_STUDENT_PASSWORD` in `.env.example`) so no
 * secret is committed to source.
 */
export async function seedUsers(dataSource: DataSource): Promise<SeededUsers> {
  const repository = dataSource.getRepository(UserEntity);

  const teacher = await upsertUser(repository, {
    fullName: 'محمد عبدالرحمن',
    email: requireEnv('SEED_TEACHER_EMAIL'),
    password: requireEnv('SEED_TEACHER_PASSWORD'),
    role: 'teacher',
  });

  const student = await upsertUser(repository, {
    fullName: 'عبدالله حبسه',
    email: requireEnv('SEED_STUDENT_EMAIL'),
    password: requireEnv('SEED_STUDENT_PASSWORD'),
    role: 'student',
  });

  return { teacher, student };
}

async function upsertUser(
  repository: Repository<UserEntity>,
  input: {
    fullName: string;
    email: string;
    password: string;
    role: 'student' | 'teacher';
  },
): Promise<UserEntity> {
  const email = input.email.trim().toLowerCase();
  const existing = await repository.findOne({ where: { email } });
  if (existing) {
    return existing;
  }

  const passwordHash = await argon2.hash(input.password);
  return repository.save(
    repository.create({
      fullName: input.fullName,
      email,
      passwordHash,
      role: input.role,
      status: 'active',
    }),
  );
}

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required seed env var: ${name}`);
  }
  return value;
}
