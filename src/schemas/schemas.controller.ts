import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Logger,
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

  private readonly logger = new Logger(SchemasController.name);

  @Post('*endpoint')
  @HttpCode(HttpStatus.OK)
  async lookup(
    @Param('endpoint') endpoint: string,
    @Body() lookupDto: LookupSchemaDto,
  ) {
    this.logger.log(`Dynamic part: ${endpoint.toString()}`);
    const transformedEndpoint: string =
      '/' + endpoint.toString().replaceAll(',', '/');

    this.logger.log(`Transformed endpoint: ${transformedEndpoint}`);
    const result = await this.schemasService.lookupAndCompare(
      lookupDto,
      transformedEndpoint,
    );

    if (!result.isMatch) {
      throw new BadRequestException({
        message: result.message,
        differences: result.differences,
        schema: result.schema,
        statusCode: HttpStatus.BAD_REQUEST,
      });
    }

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
