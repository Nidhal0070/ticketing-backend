import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import * as dotenv from 'dotenv';
dotenv.config();

async function bootstrap() {
  console.log('🚀 [BOOTSTRAP] Starting NestJS application...');
  dotenv.config();
  const app = await NestFactory.create(AppModule);

  app.useGlobalPipes(new ValidationPipe());
  
  // CORS compatible avec les containers et requêtes cross-origin
  const corsOrigins = process.env.CORS_ORIGINS
    ? process.env.CORS_ORIGINS.split(',')
    : ['http://localhost:5173', 'http://localhost:5174', 'http://frontend-user', 'http://frontend-admin', 'http://localhost:3000'];
  
  console.log('🌐 [BOOTSTRAP] CORS enabled for origins:', corsOrigins);
  
  app.enableCors({
    origin: corsOrigins,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
    allowedHeaders: 'Content-Type,Authorization',
  });

  await app.listen(3000,'0.0.0.0');
  console.log('✅ [BOOTSTRAP] Application started on port 3000');
}
bootstrap();
