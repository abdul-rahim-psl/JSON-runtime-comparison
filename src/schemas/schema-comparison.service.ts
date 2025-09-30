import { Injectable, Logger } from '@nestjs/common';

export interface ComparisonResult {
  isMatch: boolean;
  message: string;
  differences?: string[];
}

@Injectable()
export class SchemaComparisonService {
  private readonly logger = new Logger(SchemaComparisonService.name);

  compareSchemaWithPayload(schema: any, payload: any): ComparisonResult {
    try {
      const differences: string[] = [];

      // Parse schema if it's a string
      let parsedSchema;
      if (typeof schema === 'string') {
        try {
          parsedSchema = JSON.parse(schema);
        } catch (e) {
          return {
            isMatch: false,
            message: 'Invalid schema format - unable to parse JSON',
            differences: ['Schema is not valid JSON'],
          };
        }
      } else {
        parsedSchema = schema;
      }

      // Use the full schema properties for validation (including types)
      let schemaProperties;
      if (parsedSchema.type === 'object' && parsedSchema.properties) {
        // It's a JSON Schema format - use the full properties with type information
        schemaProperties = parsedSchema.properties;
      } else {
        // Assume it's already in the right format
        schemaProperties = parsedSchema;
      }

      // Perform deep comparison with type validation
      const isMatch = this.deepCompareStructureWithTypes(
        schemaProperties,
        payload,
        '',
        differences,
      );

      return {
        isMatch,
        message: isMatch
          ? 'Payload structure matches the schema perfectly!'
          : 'Payload structure does not match the schema',
        differences: differences.length > 0 ? differences : undefined,
      };
    } catch (error) {
      this.logger.error('Error during schema comparison:', error);
      return {
        isMatch: false,
        message: 'Error occurred during comparison',
        differences: [`Comparison error: ${error.message}`],
      };
    }
  }

  private deepCompareStructureWithTypes(
    schema: any,
    payload: any,
    path: string = '',
    differences: string[],
  ): boolean {
    if (payload === null || payload === undefined) {
      differences.push(
        `${path}: Property exists in schema but is null/undefined in payload`,
      );
      return false;
    }

    // Handle JSON Schema property definitions
    if (schema && typeof schema === 'object' && schema.type) {
      return this.validatePropertyType(schema, payload, path, differences);
    }

    // Handle objects without type definition (treat as object type)
    if (
      typeof schema === 'object' &&
      schema !== null &&
      !Array.isArray(schema)
    ) {
      if (
        typeof payload !== 'object' ||
        payload === null ||
        Array.isArray(payload)
      ) {
        differences.push(
          `${path}: Expected object but got ${Array.isArray(payload) ? 'array' : typeof payload}`,
        );
        return false;
      }

      const schemaKeys = Object.keys(schema);
      const payloadKeys = Object.keys(payload);

      // Check for missing keys in payload
      const missingKeys = schemaKeys.filter(
        (key) => !payloadKeys.includes(key),
      );
      if (missingKeys.length > 0) {
        missingKeys.forEach((key) => {
          const propPath = path ? `${path}.${key}` : key;
          differences.push(`${propPath}: Missing required property`);
        });
      }

      // Check for extra keys in payload
      const extraKeys = payloadKeys.filter((key) => !schemaKeys.includes(key));
      if (extraKeys.length > 0) {
        extraKeys.forEach((key) => {
          const propPath = path ? `${path}.${key}` : key;
          differences.push(
            `${propPath}: Unexpected property not defined in schema`,
          );
        });
      }

      // Recursively check common keys
      let allMatch = true;
      schemaKeys.forEach((key) => {
        if (payloadKeys.includes(key)) {
          const newPath = path ? `${path}.${key}` : key;
          if (
            !this.deepCompareStructureWithTypes(
              schema[key],
              payload[key],
              newPath,
              differences,
            )
          ) {
            allMatch = false;
          }
        } else {
          allMatch = false;
        }
      });

      return allMatch && missingKeys.length === 0 && extraKeys.length === 0;
    }

    return true;
  }

  private validatePropertyType(
    schemaProp: any,
    payloadValue: any,
    path: string,
    differences: string[],
  ): boolean {
    const expectedType = schemaProp.type;
    let isValid = true;

    switch (expectedType) {
      case 'string':
        if (typeof payloadValue !== 'string') {
          differences.push(
            `${path}: Expected string but got ${typeof payloadValue} (${payloadValue})`,
          );
          isValid = false;
        }
        break;

      case 'number':
        if (typeof payloadValue !== 'number') {
          differences.push(
            `${path}: Expected number but got ${typeof payloadValue} (${payloadValue})`,
          );
          isValid = false;
        }
        break;

      case 'integer':
        if (
          typeof payloadValue !== 'number' ||
          !Number.isInteger(payloadValue)
        ) {
          differences.push(
            `${path}: Expected integer but got ${typeof payloadValue} (${payloadValue})`,
          );
          isValid = false;
        }
        break;

      case 'boolean':
        if (typeof payloadValue !== 'boolean') {
          differences.push(
            `${path}: Expected boolean but got ${typeof payloadValue} (${payloadValue})`,
          );
          isValid = false;
        }
        break;

      case 'array':
        if (!Array.isArray(payloadValue)) {
          differences.push(
            `${path}: Expected array but got ${typeof payloadValue}`,
          );
          isValid = false;
        } else if (schemaProp.items) {
          // Validate array items
          payloadValue.forEach((item, index) => {
            const itemPath = `${path}[${index}]`;
            if (
              !this.validatePropertyType(
                schemaProp.items,
                item,
                itemPath,
                differences,
              )
            ) {
              isValid = false;
            }
          });
        }
        break;

      case 'object':
        if (
          typeof payloadValue !== 'object' ||
          payloadValue === null ||
          Array.isArray(payloadValue)
        ) {
          differences.push(
            `${path}: Expected object but got ${Array.isArray(payloadValue) ? 'array' : typeof payloadValue}`,
          );
          isValid = false;
        } else if (schemaProp.properties) {
          // Recursively validate object properties
          if (
            !this.deepCompareStructureWithTypes(
              schemaProp.properties,
              payloadValue,
              path,
              differences,
            )
          ) {
            isValid = false;
          }
        }
        break;

      default:
        // Unknown type - just check that payload value exists
        if (payloadValue === null || payloadValue === undefined) {
          differences.push(`${path}: Property value is null or undefined`);
          isValid = false;
        }
        break;
    }

    return isValid;
  }
}
