import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import * as argon2 from 'argon2';
import request from 'supertest';
import { App } from 'supertest/types';
import { DataSource } from 'typeorm';
import { AppModule } from '../src/app.module';
import { configureApp } from '../src/bootstrap';
import { UserEntity } from '../src/modules/users/entities/user.entity';

interface OtpResponseBody {
  message: string;
  email: string;
  devCode?: string;
}

// Helper: an OTP email isn't actually sent (RESEND_API_KEY is a placeholder),
// so the plaintext code can only come from the `devCode` the endpoints echo
// outside production.
function expectDevCode(body: OtpResponseBody): string {
  expect(typeof body.devCode).toBe('string');
  expect(body.devCode).toMatch(/^\d{6}$/);
  return body.devCode as string;
}

// Isolated in its own app instance so the throttler's request count isn't
// polluted by other describes — same trade-off as auth.e2e-spec.ts.
describe('Register email verification (e2e)', () => {
  let app: INestApplication<App>;
  let dataSource: DataSource;

  const testUser = {
    email: `e2e-otp-register-${Date.now()}@courseflix.local`,
    password: 'RegisterTest123!',
    fullName: 'E2E OTP Register User',
    acceptedTerms: true,
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    configureApp(app);
    await app.init();

    dataSource = moduleFixture.get(DataSource);
  });

  afterAll(async () => {
    const user = await dataSource
      .getRepository(UserEntity)
      .findOne({ where: { email: testUser.email } });
    if (user) {
      await dataSource.getRepository(UserEntity).delete({ id: user.id });
    }
    await app.close();
  });

  it('registers an inactive account, then activates it via the OTP', async () => {
    const registered = await request(app.getHttpServer())
      .post('/api/v1/auth/register')
      .send(testUser)
      .expect(201);

    // No session is issued at registration — the account is only usable
    // (and logged in) after the verification OTP is redeemed.
    expect(registered.headers['set-cookie']).toBeUndefined();
    const code = expectDevCode(registered.body as OtpResponseBody);

    const usersRepository = dataSource.getRepository(UserEntity);
    const pendingUser = await usersRepository.findOne({
      where: { email: testUser.email },
    });
    expect(pendingUser).not.toBeNull();
    expect(pendingUser?.status).toBe('inactive');
    expect(pendingUser?.emailVerifiedAt).toBeNull();

    // An inactive account can't password-login yet.
    await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email: testUser.email, password: testUser.password })
      .expect(401);

    const agent = request.agent(app.getHttpServer());
    const verified = await agent
      .post('/api/v1/auth/otp/verify')
      .send({ email: testUser.email, code, purpose: 'register' })
      .expect(200);

    expect(verified.headers['set-cookie']).toBeDefined();
    expect(verified.body).toMatchObject({
      user: { email: testUser.email, role: 'student' },
    });

    await agent.get('/api/v1/me').expect(200);

    const activatedUser = await usersRepository.findOne({
      where: { email: testUser.email },
    });
    expect(activatedUser?.status).toBe('active');
    expect(activatedUser?.emailVerifiedAt).not.toBeNull();

    // Now the password works too.
    await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email: testUser.email, password: testUser.password })
      .expect(200);
  });

  it('re-sends the verification code for an unverified registration', async () => {
    const resendEmail = `e2e-otp-resend-${Date.now()}@courseflix.local`;

    await request(app.getHttpServer())
      .post('/api/v1/auth/register')
      .send({
        email: resendEmail,
        password: 'RegisterTest123!',
        fullName: 'E2E OTP Resend User',
        acceptedTerms: true,
      })
      .expect(201);

    const resend = await request(app.getHttpServer())
      .post('/api/v1/auth/otp/request')
      .send({ email: resendEmail, purpose: 'register' })
      .expect(200);

    const code = expectDevCode(resend.body as OtpResponseBody);

    // The re-sent code still activates the account and signs it in.
    const agent = request.agent(app.getHttpServer());
    const verified = await agent
      .post('/api/v1/auth/otp/verify')
      .send({ email: resendEmail, code, purpose: 'register' })
      .expect(200);

    expect(verified.headers['set-cookie']).toBeDefined();
    await agent.get('/api/v1/me').expect(200);

    const user = await dataSource
      .getRepository(UserEntity)
      .findOne({ where: { email: resendEmail } });
    if (user) {
      await dataSource.getRepository(UserEntity).delete({ id: user.id });
    }
  });

  it('does not reveal whether an email is registered', async () => {
    const response = await request(app.getHttpServer())
      .post('/api/v1/auth/otp/request')
      .send({ email: 'nobody@courseflix.local', purpose: 'register' })
      .expect(200);

    const body = response.body as OtpResponseBody;
    expect(body.message).toBeDefined();
    expect(body.devCode).toBeUndefined();

    // Purpose 'login' no longer exists — only register/google_oauth do.
    await request(app.getHttpServer())
      .post('/api/v1/auth/otp/request')
      .send({ email: 'nobody@courseflix.local', purpose: 'login' })
      .expect(400);
  });
});

describe('Password reset via OTP (e2e)', () => {
  let app: INestApplication<App>;
  let dataSource: DataSource;
  let testUserId: string;

  const testUser = {
    email: 'e2e-otp-reset@courseflix.local',
    password: 'OldPassword123!',
    fullName: 'E2E OTP Reset User',
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
        emailVerifiedAt: new Date(),
      }),
    );
    testUserId = created.id;
  });

  afterAll(async () => {
    await dataSource.getRepository(UserEntity).delete({ id: testUserId });
    await app.close();
  });

  it('resets the password only after the OTP is verified', async () => {
    const requested = await request(app.getHttpServer())
      .post('/api/v1/auth/password/request')
      .send({ email: testUser.email })
      .expect(200);
    const code = expectDevCode(requested.body as OtpResponseBody);

    const newPassword = 'NewPassword123!';

    await request(app.getHttpServer())
      .post('/api/v1/auth/password/reset')
      .send({ email: testUser.email, code: '000000', newPassword })
      .expect(401);

    await request(app.getHttpServer())
      .post('/api/v1/auth/password/reset')
      .send({ email: testUser.email, code, newPassword })
      .expect(200);

    await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email: testUser.email, password: newPassword })
      .expect(200);

    await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email: testUser.email, password: testUser.password })
      .expect(401);
  });
});
