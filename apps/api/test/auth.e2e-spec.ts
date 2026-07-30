import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import * as argon2 from 'argon2';
import request from 'supertest';
import { App } from 'supertest/types';
import { DataSource } from 'typeorm';
import { AppModule } from '../src/app.module';
import { SessionEntity } from '../src/modules/sessions/entities/session.entity';
import { UserEntity } from '../src/modules/users/entities/user.entity';
import { configureApp } from '../src/bootstrap';

describe('Auth (e2e)', () => {
  let app: INestApplication<App>;
  let dataSource: DataSource;
  let testUserId: string;

  const testUser = {
    email: 'e2e-auth-regression@courseflix.local',
    password: 'RegressionTest123!',
    fullName: 'E2E Regression User',
    role: 'student' as const,
  };
  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    configureApp(app);
    await app.init();

    dataSource = moduleFixture.get(DataSource);

    const passwordHash = await argon2.hash(testUser.password);
    const usersRepository = dataSource.getRepository(UserEntity);
    const created = await usersRepository.save(
      usersRepository.create({
        email: testUser.email,
        fullName: testUser.fullName,
        passwordHash,
        role: testUser.role,
        status: 'active',
      }),
    );
    testUserId = created.id;
  });

  afterAll(async () => {
    // Deleting the user cascades to their sessions (ON DELETE CASCADE).
    await dataSource.getRepository(UserEntity).delete({ id: testUserId });
    await app.close();
  });

  it('logs in, reads /me, and logs out — full session lifecycle', async () => {
    const agent = request.agent(app.getHttpServer());

    const loginResponse = await agent
      .post('/api/v1/auth/login')
      .send({ email: testUser.email, password: testUser.password })
      .expect(200);

    expect(loginResponse.headers['set-cookie']).toBeDefined();
    expect(loginResponse.body.user).toMatchObject({
      email: testUser.email,
      role: testUser.role,
    });

    const meResponse = await agent.get('/api/v1/me').expect(200);
    expect(meResponse.body).toMatchObject({
      email: testUser.email,
      role: testUser.role,
    });

    await agent.post('/api/v1/auth/logout').expect(200);

    // Even if a client replayed the old cookie, the session is now
    // revoked server-side.
    await agent.get('/api/v1/me').expect(401);
  });

  it('rejects a wrong password without creating a session', async () => {
    const response = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email: testUser.email, password: 'wrong-password' })
      .expect(401);

    expect(response.headers['set-cookie']).toBeUndefined();
  });

  it('rejects /me with no session cookie at all', async () => {
    await request(app.getHttpServer()).get('/api/v1/me').expect(401);
  });

  it('rejects /me with a tampered or unknown cookie value', async () => {
    await request(app.getHttpServer())
      .get('/api/v1/me')
      .set('Cookie', 'courseflix.sid=not-a-real-session')
      .expect(401);
  });

  it('rejects /me once the session has expired', async () => {
    const agent = request.agent(app.getHttpServer());

    await agent
      .post('/api/v1/auth/login')
      .send({ email: testUser.email, password: testUser.password })
      .expect(200);

    await agent.get('/api/v1/me').expect(200);

    // Force-expire the session directly in the DB, bypassing the app.
    await dataSource
      .getRepository(SessionEntity)
      .update(
        { userId: testUserId },
        { expiresAt: new Date(Date.now() - 1000) },
      );

    await agent.get('/api/v1/me').expect(401);
  });
});

// Isolated in its own app instance so the throttler's request count isn't
// polluted by the login attempts made in the block above.
describe('Auth rate limiting (e2e)', () => {
  let app: INestApplication<App>;
  let dataSource: DataSource;
  let testUserId: string;

  const testUser = {
    email: 'e2e-auth-rate-limit@courseflix.local',
    password: 'RegressionTest123!',
    fullName: 'E2E Rate Limit User',
    role: 'student' as const,
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    dataSource = moduleFixture.get(DataSource);

    const passwordHash = await argon2.hash(testUser.password);
    const usersRepository = dataSource.getRepository(UserEntity);
    const created = await usersRepository.save(
      usersRepository.create({
        email: testUser.email,
        fullName: testUser.fullName,
        passwordHash,
        role: testUser.role,
        status: 'active',
      }),
    );
    testUserId = created.id;
  });

  afterAll(async () => {
    await dataSource.getRepository(UserEntity).delete({ id: testUserId });
    await app.close();
  });

  it('rate-limits repeated failed login attempts', async () => {
    const maxAttempts = Number(process.env.LOGIN_RATE_LIMIT_MAX_ATTEMPTS ?? 5);

    for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
      await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({ email: testUser.email, password: 'wrong-password' })
        .expect(401);
    }

    await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email: testUser.email, password: 'wrong-password' })
      .expect(429);
  });
});
