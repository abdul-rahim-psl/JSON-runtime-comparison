import { Injectable, Logger } from '@nestjs/common';
import Ajv from 'ajv';
import addFormats from 'ajv-formats';

export interface ComparisonResult {
  isMatch: boolean;
  message: string;
  differences?: string[];
}

@Injectable()
export class SchemaComparisonService {
  private readonly logger = new Logger(SchemaComparisonService.name);
  private readonly ajv: Ajv;

  constructor() {
    this.ajv = new Ajv({ allErrors: true });
    addFormats(this.ajv);
  }

  compareSchemaWithPayload(schema: any, payload: any): ComparisonResult {
    try {
      const isValid = this.ajv.validate(schema, payload);

      if (isValid) {
        return {
          isMatch: true,
          message: 'Payload structure matches the schema perfectly!',
          differences: [],
        };
      }

      const differences =
        this.ajv.errors?.map((error) => {
          const path = error.instancePath || 'root';
          const message = error.message || 'validation failed';

          // Format the error message to be more human-readable
          if (error.keyword === 'required') {
            return `${path}: Missing required property '${error.params?.missingProperty}'`;
          } else if (error.keyword === 'additionalProperties') {
            return `${path}: Unexpected property '${error.params?.additionalProperty}' not defined in schema`;
          } else if (error.keyword === 'type') {
            return `${path}: Expected ${error.params?.type} but got ${typeof error.data} (${error.data})`;
          } else {
            return `${path}: ${message}`;
          }
        }) || [];

      return {
        isMatch: false,
        message: 'Payload structure does not match the schema',
        differences,
      };
    } catch (error) {
      this.logger.error('Error during schema validation', error);
      return {
        isMatch: false,
        message: 'Error occurred during comparison',
        differences: [`Comparison error: ${error.message}`],
      };
    }
  }
}
