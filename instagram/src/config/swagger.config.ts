import { DocumentBuilder } from '@nestjs/swagger';

export const swaggerConfig = new DocumentBuilder()
  .setTitle('Instagram')
  .setDescription('The Collection of APIs for Instagram')
  .setVersion('1.0')
  .build();
