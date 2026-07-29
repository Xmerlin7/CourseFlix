import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './modules/auth/auth.module';
import { CoursesModule } from './modules/courses/courses.module';
import { DocumentsModule } from './modules/documents/documents.module';
import { EnrollmentsModule } from './modules/enrollments/enrollments.module';
import { HealthModule } from './modules/health/health.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { SessionsModule } from './modules/sessions/sessions.module';
import { StudentModule } from './modules/student/student.module';
import { TeacherModule } from './modules/teacher/teacher.module';
import { UsersModule } from './modules/users/users.module';

@Module({
  imports: [
    // TypeOrmModule.forRoot({
    //   type: 'postgres',
    //   url: process.env.DATABASE_URL,
    //   autoLoadEntities: true,
    //   // Never true outside a throwaway local sandbox — migrations are the
    //   // only supported way to change the schema (see CONTRIBUTING.md).
    //   synchronize: false,
    // }),
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
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule { }
