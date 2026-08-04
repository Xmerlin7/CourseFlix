import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';
import { DataSource } from 'typeorm';
import { AppModule } from '../src/app.module';
import { configureApp } from '../src/bootstrap';
import { COURSE_PRICE_MINOR } from '../src/modules/commerce/commerce.constants';
import { seedCourse } from '../src/database/seeds/course.seed';
import { seedUsers } from '../src/database/seeds/user.seed';

/**
 * CF-TASK-058 / CF-TASK-059 (sprint3-plan.md §5 A-1/A-2/A-3/A-5). The
 * deterministic commerce flow:
 *   success, decline + retry, duplicate confirm, already owned,
 *   unauthorized receipt, price tamper, idempotent create.
 *
 * Each test that ends in an enrollment uses its own course
 * (courseA/B/C), so a single run is self-contained. Re-running the suite
 * against the same database expects the team's reset tooling
 * (sprint3-plan.md E-2) to clear orders/payments/enrollments first —
 * same posture as the canonical E2E flow.
 */
describe('Commerce (e2e)', () => {
  let app: INestApplication<App>;
  let dataSource: DataSource;
  let courseA: string;
  let courseB: string;
  let courseC: string;
  let courseD: string;
  let archivedCourseId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    configureApp(app);
    await app.init();

    dataSource = moduleFixture.get(DataSource);

    const { teacher } = await seedUsers(dataSource);
    const { courses } = await seedCourse(dataSource, teacher.id);

    const published = courses.filter((c) => c.status === 'published');
    const archived = courses.find((c) => c.status === 'archived');

    if (published.length < 4 || !archived) {
      throw new Error(
        'Course seed produced too few published/archived courses.',
      );
    }

    courseA = published[0].id;
    courseB = published[1].id;
    courseC = published[2].id;
    courseD = published[3].id;
    archivedCourseId = archived.id;
  });

  afterAll(async () => {
    await app.close();
  });

  async function login(agent: ReturnType<typeof request.agent>) {
    await agent
      .post('/api/v1/auth/login')
      .send({
        email: process.env.SEED_STUDENT_EMAIL,
        password: process.env.SEED_STUDENT_PASSWORD,
      })
      .expect(200);
  }

  it('creates a pending order with server-set amount and currency', async () => {
    const agent = request.agent(app.getHttpServer());
    await login(agent);

    const response = await agent
      .post('/api/v1/checkout/orders')
      .send({ courseId: courseA })
      .expect(201);

    const body = response.body as {
      orderReference: string;
      status: string;
      paymentStatus: string;
      currency: string;
      amountMinor: number;
      items: Array<{ title: string; priceMinor: number }>;
    };
    expect(body.orderReference).toEqual(expect.any(String));
    expect(body.status).toBe('pending');
    expect(body.paymentStatus).toBe('pending');
    expect(body.currency).toBe('EGP');
    expect(body.amountMinor).toBe(COURSE_PRICE_MINOR);
    expect(body.items[0].title).toEqual(expect.any(String));
    expect(body.items[0].priceMinor).toBe(COURSE_PRICE_MINOR);
  });

  it('rejects a client-supplied price or currency (price tamper)', async () => {
    const agent = request.agent(app.getHttpServer());
    await login(agent);

    await agent
      .post('/api/v1/checkout/orders')
      .send({ courseId: courseA, priceMinor: 1, currency: 'USD' })
      .expect(400);
  });

  it('is idempotent on order creation with the same idempotency key', async () => {
    const agent = request.agent(app.getHttpServer());
    await login(agent);

    const key = `commerce-e2e-${Date.now()}`;
    const first = await agent
      .post('/api/v1/checkout/orders')
      .send({ courseId: courseA, idempotencyKey: key })
      .expect(201);
    const second = await agent
      .post('/api/v1/checkout/orders')
      .send({ courseId: courseA, idempotencyKey: key })
      .expect(201);

    expect((first.body as { orderReference: string }).orderReference).toBe(
      (second.body as { orderReference: string }).orderReference,
    );
  });

  it('rejects checkout for an archived course', async () => {
    const agent = request.agent(app.getHttpServer());
    await login(agent);

    await agent
      .post('/api/v1/checkout/orders')
      .send({ courseId: archivedCourseId })
      .expect(409);
  });

  it('records a failed payment on decline and succeeds on retry', async () => {
    const agent = request.agent(app.getHttpServer());
    await login(agent);

    const created = await agent
      .post('/api/v1/checkout/orders')
      .send({ courseId: courseB })
      .expect(201);
    const orderId = (created.body as { orderReference: string }).orderReference;

    const declined = await agent
      .post(`/api/v1/checkout/orders/${orderId}/confirm`)
      .send({ simulate: 'decline' })
      .expect(200);
    const declinedBody = declined.body as {
      status: string;
      paymentStatus: string;
    };
    expect(declinedBody.status).toBe('pending');
    expect(declinedBody.paymentStatus).toBe('failed');

    const retried = await agent
      .post(`/api/v1/checkout/orders/${orderId}/confirm`)
      .send({ simulate: 'success' })
      .expect(200);
    expect((retried.body as { status: string }).status).toBe('paid');
  });

  it('rejects already-owned checkout', async () => {
    const agent = request.agent(app.getHttpServer());
    await login(agent);

    // courseB was purchased by the retry test above.
    await agent
      .post('/api/v1/checkout/orders')
      .send({ courseId: courseB })
      .expect(409);
  });

  it('completes a purchase, creating exactly one enrollment', async () => {
    const agent = request.agent(app.getHttpServer());
    await login(agent);

    const created = await agent
      .post('/api/v1/checkout/orders')
      .send({ courseId: courseC })
      .expect(201);
    const orderId = (created.body as { orderReference: string }).orderReference;

    const confirmed = await agent
      .post(`/api/v1/checkout/orders/${orderId}/confirm`)
      .send({ simulate: 'success' })
      .expect(200);
    const confirmedBody = confirmed.body as {
      status: string;
      paymentStatus: string;
      paidAt: string;
    };
    expect(confirmedBody.status).toBe('paid');
    expect(confirmedBody.paymentStatus).toBe('paid');
    expect(confirmedBody.paidAt).toEqual(expect.any(String));

    // Duplicate confirm returns the same authoritative state.
    const duplicate = await agent
      .post(`/api/v1/checkout/orders/${orderId}/confirm`)
      .send({ simulate: 'success' })
      .expect(200);
    expect((duplicate.body as { status: string }).status).toBe('paid');

    const enrollments = await agent
      .get('/api/v1/student/enrollments')
      .expect(200);
    const matching = (enrollments.body as Array<{ courseId: string }>).filter(
      (e) => e.courseId === courseC,
    );
    expect(matching.length).toBe(1);
  });

  it('returns the receipt to its owner', async () => {
    const agent = request.agent(app.getHttpServer());
    await login(agent);

    const created = await agent
      .post('/api/v1/checkout/orders')
      .send({ courseId: courseD })
      .expect(201);
    const orderId = (created.body as { orderReference: string }).orderReference;

    const receipt = await agent.get(`/api/v1/orders/${orderId}`).expect(200);
    expect((receipt.body as { orderReference: string }).orderReference).toBe(
      orderId,
    );
  });

  it('blocks reading another student receipt', async () => {
    const owner = request.agent(app.getHttpServer());
    await login(owner);
    const created = await owner
      .post('/api/v1/checkout/orders')
      .send({ courseId: courseD })
      .expect(201);
    const orderId = (created.body as { orderReference: string }).orderReference;

    const intruder = request.agent(app.getHttpServer());
    await intruder
      .post('/api/v1/auth/login')
      .send({
        email: `student2@courseflix.local`,
        password: process.env.SEED_STUDENT_PASSWORD,
      })
      .expect(200);

    await intruder.get(`/api/v1/orders/${orderId}`).expect(403);
  });
});
