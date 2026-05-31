import * as fs from 'fs';
import * as path from 'path';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/exception-filters/http.exception-filter';
import { setupSwagger } from './config/swagger.config';

async function bootstrap() {
  // mkdir must run before NestFactory (TypeORM connects during create)
  const dbPath = process.env.DATABASE_PATH ?? './data/db.sqlite';
  fs.mkdirSync(path.dirname(dbPath), { recursive: true });

  const app = await NestFactory.create(AppModule);
  const config = app.get(ConfigService);

  app.enableCors({
    origin: config.get<string>('frontend.url'),
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  app.useGlobalFilters(new HttpExceptionFilter());

  setupSwagger(app);

  const port = config.get<number>('port') ?? 3000;
  await app.listen(port);

  console.log('\x1b[36m%s\x1b[0m', '🚀 Server is running!');
  console.log(
    '\x1b[33m%s\x1b[0m',
    `🌐 API Documentation: http://localhost:${port}/api`,
  );
  console.log('\x1b[32m%s\x1b[0m', `🌍 Application: http://localhost:${port}`);
}
void bootstrap();
