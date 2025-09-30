import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  HttpStatus,
  HttpCode,
  BadRequestException,
} from '@nestjs/common';
import { SchemasService } from './schemas.service';
import { CreateSchemaDto } from './dto/create-schema.dto';
import { UpdateSchemaDto } from './dto/update-schema.dto';
import { LookupSchemaDto } from './dto/lookup-schema.dto';

@Controller('schemas')
export class SchemasController {
  constructor(private readonly schemasService: SchemasService) {}

  @Post('lookup')
  @HttpCode(HttpStatus.OK) // Default to 200, but we'll override based on result
  async lookup(@Body() lookupDto: LookupSchemaDto) {
    const result = await this.schemasService.lookupAndCompare(lookupDto);

    // If validation fails, throw BadRequestException (400 status)
    if (!result.isMatch) {
      throw new BadRequestException({
        message: result.message,
        differences: result.differences,
        schema: result.schema,
        statusCode: HttpStatus.BAD_REQUEST,
      });
    }

    // If validation passes, return 200 OK with success message
    return {
      message: result.message,
      isMatch: result.isMatch,
      schema: result.schema,
      statusCode: HttpStatus.OK,
    };
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
