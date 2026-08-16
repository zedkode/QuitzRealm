import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { webAppOrigins } from './web-origins';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useGlobalPipes(
    new ValidationPipe({
      forbidNonWhitelisted: true,
      transform: true,
      whitelist: true,
    }),
  );
  // Aplicația mobilă nu trimite `Origin`, deci nu depinde de CORS. Panoul web
  // rulează pe alt hostname decât API-ul, deci fără lista asta browserul
  // blochează fiecare cerere. Lista vine din mediu: fără ea nu se deschide
  // nimic (comportamentul de dinainte de panoul web).
  const origins = webAppOrigins();
  if (origins.length > 0) {
    app.enableCors({
      origin: origins,
      credentials: true,
      methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
    });
  }
  await app.listen(process.env.PORT ?? 3000);
}
void bootstrap();
