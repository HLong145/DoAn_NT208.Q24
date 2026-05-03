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
            brokers: (process.env.KAFKA_BROKERS ?? 'localhost:9092').split(',').map((broker) => broker.trim()).filter(Boolean), 
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