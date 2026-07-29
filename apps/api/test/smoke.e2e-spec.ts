import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';
import { DataSource } from 'typeorm';
import { AppModule } from '../src/app.module';
import { configureApp } from '../src/bootstrap';
import { seedCourse } from '../src/database/seeds/course.seed';
import { seedEnrollment } from '../src/database/seeds/enrollment.seed';
import { seedUsers } from '../src/database/seeds/user.seed';
import { seedVideo } from '../src/database/seeds/video.seed';

/**
 * CF-TASK-024 (carried over from Sprint 1). The canonical demo path:
 * login as student -> read a course -> read one of its lessons -> post a
 * progress heartbeat -> logout. Two of the four steps are Albraa's own
 * endpoints (sprint2-plan.md §A-6), which is why he owns this test.
 *
 * "Reset seed" means calling the same seed functions `npm run seed` uses,
 * against this test's own DataSource — every one of them upserts, so
 * running this suite never duplicates fixture rows and is safe to run
 * against a database that already has demo data.
 */
describe('Smoke (e2e)', () => {
  let app: INestApplication<App>;
  let dataSource: DataSource;
  let courseId: string;
  let lessonId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    configureApp(app);
    await app.init();

    dataSource = moduleFixture.get(DataSource);

    const { student, teacher } = await seedUsers(dataSource);
    const { course, lessons } = await seedCourse(dataSource, teacher.id);
    await seedEnrollment(dataSource, {
      studentId: student.id,
      courseId: course.id,
    });
    await seedVideo(dataSource);

    courseId = course.id;
    lessonId = lessons[0].id;
  });

  afterAll(async () => {
    await app.close();
  });

  it('runs the full login -> course -> lesson -> heartbeat -> logout path', async () => {
    const agent = request.agent(app.getHttpServer());

    await agent
      .post('/api/v1/auth/login')
      .send({
        email: process.env.SEED_STUDENT_EMAIL,
        password: process.env.SEED_STUDENT_PASSWORD,
      })
      .expect(200);

    const courseResponse = await agent
      .get(`/api/v1/courses/${courseId}`)
      .expect(200);
    const courseBody = courseResponse.body as { id: string };
    expect(courseBody.id).toBe(courseId);

    const lessonResponse = await agent
      .get(`/api/v1/lessons/${lessonId}`)
      .expect(200);
    const lessonBody = lessonResponse.body as {
      id: string;
      video: { url: string };
    };
    expect(lessonBody.id).toBe(lessonId);
    expect(lessonBody.video.url).toEqual(expect.any(String));

    const progressResponse = await agent
      .post(`/api/v1/lessons/${lessonId}/progress`)
      .send({ positionSeconds: 1, watchedSeconds: 1 })
      .expect(200);
    const progressBody = progressResponse.body as {
      status: string;
      attendanceAwarded: boolean;
    };
    expect(typeof progressBody.status).toBe('string');
    expect(typeof progressBody.attendanceAwarded).toBe('boolean');

    await agent.post('/api/v1/auth/logout').expect(200);
    await agent.get('/api/v1/me').expect(401);
  });
});
