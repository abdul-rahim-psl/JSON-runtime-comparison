import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
} from '@nestjs/common';
import { SchemasService } from './schemas.service';
import { CreateSchemaDto } from './dto/create-schema.dto';
import { UpdateSchemaDto } from './dto/update-schema.dto';

@Controller('schemas')
export class SchemasController {
  constructor(private readonly schemasService: SchemasService) {}

  @Get('lookup')
  async lookup(@Query('path') path: string) {
    const schema = await this.schemasService.findByEndpointPath(path);
    if (!schema) {
      return { message: 'Schema not found' };
    }
    return schema;
  }

  @Post()
  create(@Body() createSchemaDto: CreateSchemaDto) {
    return this.schemasService.create(createSchemaDto);
  }

  @Get()
  findAll() {
    return this.schemasService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.schemasService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateSchemaDto: UpdateSchemaDto) {
    return this.schemasService.update(+id, updateSchemaDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.schemasService.remove(+id);
  }
}
