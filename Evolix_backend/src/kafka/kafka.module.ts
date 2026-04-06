import { Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';

@Module({
  imports: [
    ClientsModule.register([
      {
        name: 'KAFKA_SERVICE', 
        transport: Transport.KAFKA,
        options: {
          client: {
            clientId: 'evolix-backend', 
            brokers: ['localhost:9092'], 
          },
          consumer: {
            groupId: 'evolix-consumer-group', 
          },
        },
      },
    ]),
  ],
  exports: [ClientsModule], 
})
export class KafkaModule {}