import { Injectable, Logger } from '@nestjs/common';
import { parse } from 'path';

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

      const isMatch = this.deepCompareStructureWithTypes(
        schema.properties,
        payload,
        '',
        differences,
      );

      return {
        isMatch,
        message: isMatch
          ? 'Payload structure matches the schema perfectly!'
          : 'Payload structure does not match the schema',
        differences: differences.length > 0 ? differences : [],
      };
    } catch (error) {
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

    if (schema && typeof schema === 'object' && schema.type) {
      return this.validatePropertyType(schema, payload, path, differences);
    }

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

      const missingKeys = schemaKeys.filter(
        (key) => !payloadKeys.includes(key),
      );
      if (missingKeys.length > 0) {
        missingKeys.forEach((key) => {
          const propPath = path ? `${path}.${key}` : key;
          differences.push(`${propPath}: Missing required property`);
        });
      }

      const extraKeys = payloadKeys.filter((key) => !schemaKeys.includes(key));
      if (extraKeys.length > 0) {
        extraKeys.forEach((key) => {
          const propPath = path ? `${path}.${key}` : key;
          differences.push(
            `${propPath}: Unexpected property not defined in schema`,
          );
        });
      }

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
        if (payloadValue === null || payloadValue === undefined) {
          differences.push(`${path}: Property value is null or undefined`);
          isValid = false;
        }
        break;
    }

    return isValid;
  }
}
