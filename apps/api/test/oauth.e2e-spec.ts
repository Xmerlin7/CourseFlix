import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../src/app.module';
import { configureApp } from '../src/bootstrap';

// env-setup.ts deliberately leaves GOOGLE_CLIENT_ID/GOOGLE_CLIENT_SECRET at
// the `replace-me` placeholder, so every test run exercises the
// "not configured" path — the same path a fresh checkout hits before real
// credentials are added. Real Google exchanges can't be tested here.
describe('Google OAuth (e2e)', () => {
  let app: INestApplication<App>;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    configureApp(app);
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('refuses to start the flow until credentials are configured', async () => {
    await request(app.getHttpServer())
      .get('/api/v1/auth/oauth/google')
      .expect(503);

    await request(app.getHttpServer())
      .get('/api/v1/auth/oauth/google/callback')
      .expect(503);
  });
});
