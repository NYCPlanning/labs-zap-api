import {
  Controller,
  Patch,
  Body,
  Req,
} from '@nestjs/common';

@Controller('dispositions')
export class DispositionController {
  @Patch('/:id')
  update(@Body() body) {
    return body;
  }
}
