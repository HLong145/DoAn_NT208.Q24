import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { AppModule } from './app.module';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { existsSync, mkdirSync } from 'fs';
import { join } from 'path';

async function bootstrap() {
  const uploadsDir = join(process.cwd(), 'uploads');
  if (!existsSync(uploadsDir)) mkdirSync(uploadsDir, { recursive: true });

  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  app.useStaticAssets(uploadsDir, { prefix: '/uploads' });
  app.setGlobalPrefix('api');
  const corsOrigins = (process.env.CORS_ORIGINS ?? 'http://localhost:5173,http://localhost:3000')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );
  app.enableCors({
    origin: corsOrigins,
    credentials: true,
  });

  // Cấu hình Microservice để NestJS có thể lắng nghe Message Queue (Kafka Consumer)
  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.KAFKA,
    options: {
      client: {
        brokers: (process.env.KAFKA_BROKERS ?? 'localhost:9092').split(',').map((broker) => broker.trim()).filter(Boolean),
      },
      consumer: {
        // Nhóm xử lý sự kiện, phải khớp với cấu hình ở KafkaModule
        groupId: 'evolix-consumer-group',
      },
    },
  });

  // Khởi động tất cả các Microservices đang được kết nối ngầm, nhưng không chặn HTTP server
  void app.startAllMicroservices().catch((error) => {
    console.error('Microservice startup failed:', error);
  });

  // Khởi chạy server chính ở cổng 3000 để phục vụ các RESTful API
  await app.listen(Number(process.env.PORT ?? 4001));
}
bootstrap();