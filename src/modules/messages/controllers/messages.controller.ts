import { Body, Controller, Post } from '@nestjs/common';

interface NewMessageData {
    [key: string]: unknown;
}

@Controller('messages')
export class MessagesController {
    @Post('register')
    public async createNewDataMessage(
        @Body() newMessageData: NewMessageData,
    ): Promise<NewMessageData> {
        console.log(newMessageData);
        return newMessageData;
    }
}
