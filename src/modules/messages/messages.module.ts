import { Module } from '@nestjs/common';
import { MessagesService } from './services/messages.service.js';
import { MessagesController } from './controllers/messages.controller.js';

@Module({
  providers: [MessagesService],
  controllers: [MessagesController]
})
export class MessagesModule {}
