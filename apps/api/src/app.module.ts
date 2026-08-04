import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BullModule } from '@nestjs/bullmq';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AgentLogsModule } from './modules/agent-logs/agent-logs.module';
import { AuthModule } from './modules/auth/auth.module';
import { CoursesModule } from './modules/courses/courses.module';
import { DocumentsModule } from './modules/documents/documents.module';
import { EnrollmentsModule } from './modules/enrollments/enrollments.module';
import { HealthModule } from './modules/health/health.module';
import { InterventionsModule } from './modules/interventions/interventions.module';
import { LessonsModule } from './modules/lessons/lessons.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { QuizzesModule } from './modules/quizzes/quiz.module';
import { SessionsModule } from './modules/sessions/sessions.module';
import { StudentModule } from './modules/student/student.module';
import { TeacherModule } from './modules/teacher/teacher.module';
import { UsersModule } from './modules/users/users.module';
import { JobsModule } from './modules/jobs/jobs.module';
import { RetrievalModule } from './modules/retrieval/retrieval.module';
import { TutorModule } from './modules/tutor/tutor.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),

    BullModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        connection: {
          host: configService.get<string>('REDIS_HOST', 'localhost'),
          port: configService.get<number>('REDIS_PORT', 6379),
        },
      }),
    }),

    TypeOrmModule.forRoot({
      type: 'postgres',
      url: process.env.DATABASE_URL,
      autoLoadEntities: true,
      synchronize: true,
      port: 5432,
      ssl: true,
      extra: {
        ssl: {
          rejectUnauthorized: false, // Allows connection to Neon over safe TLS
        },
      },
    }),
    HealthModule,
    AuthModule,
    UsersModule,
    SessionsModule,
    CoursesModule,
    EnrollmentsModule,
    StudentModule,
    TeacherModule,
    DocumentsModule,
    NotificationsModule,
    QuizzesModule,
    JobsModule,
    RetrievalModule,
    LessonsModule,
    TutorModule,
    AgentLogsModule,
    InterventionsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
