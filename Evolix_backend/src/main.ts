import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Cấu hình Microservice để NestJS có thể lắng nghe Message Queue (Kafka Consumer)
  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.KAFKA,
    options: {
      client: {
        brokers: ['localhost:9092'],
      },
      consumer: {
        // Nhóm xử lý sự kiện, phải khớp với cấu hình ở KafkaModule
        groupId: 'evolix-consumer-group',
      },
    },
  });

  // Khởi động tất cả các Microservices đang được kết nối ngầm
  await app.startAllMicroservices();

  // Khởi chạy server chính ở cổng 3000 để phục vụ các RESTful API
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();