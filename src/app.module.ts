import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { SchemasModule } from './schemas/schemas.module';

@Module({
  imports: [SchemasModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
