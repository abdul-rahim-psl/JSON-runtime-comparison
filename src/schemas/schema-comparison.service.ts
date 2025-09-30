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

      // Extract properties from JSON Schema format
      let schemaProperties;
      if (parsedSchema.type === 'object' && parsedSchema.properties) {
        // It's a JSON Schema format - extract the properties
        schemaProperties = this.extractPropertiesStructure(
          parsedSchema.properties,
        );
      } else {
        // Assume it's already in the right format
        schemaProperties = parsedSchema;
      }

      // Perform deep comparison
      const isMatch = this.deepCompareStructure(
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

  private extractPropertiesStructure(properties: any): any {
    const result: any = {};

    for (const [key, value] of Object.entries(properties)) {
      const propDef = value as any;

      if (propDef.type === 'object' && propDef.properties) {
        // Nested object - recursively extract its properties
        result[key] = this.extractPropertiesStructure(propDef.properties);
      } else if (propDef.type === 'array' && propDef.items) {
        // Array type - extract structure of items
        if (propDef.items.type === 'object' && propDef.items.properties) {
          result[key] = [
            this.extractPropertiesStructure(propDef.items.properties),
          ];
        } else {
          // Simple array - just indicate it's an array with a placeholder
          result[key] = [];
        }
      } else {
        // Primitive type - just use a placeholder value
        result[key] = null;
      }
    }

    return result;
  }

  private deepCompareStructure(
    schema: any,
    payload: any,
    path: string = '',
    differences: string[],
  ): boolean {
    // Handle null/undefined cases for schema (payload can be any value)
    if (schema === null) {
      // Schema is null means it's a primitive property - payload can be anything
      return true;
    }

    if (payload === null || payload === undefined) {
      differences.push(
        `${path}: Property exists in schema but is null/undefined in payload`,
      );
      return false;
    }

    // Handle arrays
    if (Array.isArray(schema)) {
      if (!Array.isArray(payload)) {
        differences.push(`${path}: Expected array but got ${typeof payload}`);
        return false;
      }

      // Empty schema array means any array is valid
      if (schema.length === 0) return true;

      // If schema has structure, check that all payload items match the schema structure
      if (schema.length > 0) {
        const schemaItem = schema[0];
        let allMatch = true;

        if (payload.length === 0) {
          differences.push(
            `${path}: Expected array with items but got empty array`,
          );
          return false;
        }

        payload.forEach((payloadItem, index) => {
          const itemPath = `${path}[${index}]`;
          if (
            !this.deepCompareStructure(
              schemaItem,
              payloadItem,
              itemPath,
              differences,
            )
          ) {
            allMatch = false;
          }
        });

        return allMatch;
      }

      return true;
    }

    // Handle objects
    if (typeof schema === 'object' && schema !== null) {
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

      // Check for extra keys in payload (optional - you might want to allow extra properties)
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
            !this.deepCompareStructure(
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

    // For any other case (primitives in schema), payload can be anything
    return true;
  }
}
