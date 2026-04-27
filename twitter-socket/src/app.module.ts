import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { NotificationGateway } from './notification/notification.gateway';
import { NotificationController } from './notification/notification.controller';

@Module({
  imports: [],
  controllers: [AppController, NotificationController],
  providers: [AppService, NotificationGateway],
})
export class AppModule {}