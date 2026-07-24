import { ValidationPipe, type INestApplication } from '@nestjs/common';
import cookieParser from 'cookie-parser';

// Shared between main.ts and e2e tests so both run with the exact same
// middleware/pipes — e2e tests build their app from AppModule directly
// and never execute main.ts's bootstrap() function.
export function configureApp(app: INestApplication): void {
  app.use(cookieParser(process.env.SESSION_SECRET));

  app.enableCors({
    origin: process.env.WEB_ORIGIN,
    credentials: true,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );
}