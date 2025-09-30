# deepCompareStructureWithTypes Function Documentation

## Overview

The `deepCompareStructureWithTypes` function is a recursive method that performs comprehensive validation of JSON payload structure and data types against a JSON schema. It ensures both structural integrity (property names and nesting) and type compliance of the data.

## Method Signature

```typescript
private deepCompareStructureWithTypes(
  schema: any,
  payload: any,
  path: string = '',
  differences: string[],
): boolean
```

## Parameters

| Parameter     | Type       | Description                                                             |
| ------------- | ---------- | ----------------------------------------------------------------------- |
| `schema`      | `any`      | The JSON schema definition (or part of it during recursion)             |
| `payload`     | `any`      | The actual data to validate (or part of it during recursion)            |
| `path`        | `string`   | Current property path for error reporting (e.g., "user.address.street") |
| `differences` | `string[]` | Array to collect validation error messages                              |

## Return Value

- **Type**: `boolean`
- **Returns**: `true` if payload matches schema structure and types, `false` otherwise
- **Side Effect**: Populates the `differences` array with specific validation errors

## Validation Process

### 1. Null/Undefined Check

```typescript
if (payload === null || payload === undefined) {
  differences.push(
    `${path}: Property exists in schema but is null/undefined in payload`,
  );
  return false;
}
```

**Purpose**: Validates that required properties are not null or undefined.

**Example**:

- Schema expects: `"name": {"type": "string"}`
- Payload has: `"name": null`
- Error: `"name: Property exists in schema but is null/undefined in payload"`

### 2. Type Validation Delegation

```typescript
if (schema && typeof schema === 'object' && schema.type) {
  return this.validatePropertyType(schema, payload, path, differences);
}
```

**Purpose**: If the schema has an explicit `type` property, delegates to specialized type validation.

**Example**:

- Schema: `{"type": "number"}`
- Payload: `"123"` (string)
- Delegates to `validatePropertyType` for detailed number validation

### 3. Object Structure Validation

This section handles complex object-to-object comparison when the schema represents nested structure.

#### 3a. Payload Type Verification

```typescript
if (typeof payload !== 'object' || payload === null || Array.isArray(payload)) {
  differences.push(
    `${path}: Expected object but got ${Array.isArray(payload) ? 'array' : typeof payload}`,
  );
  return false;
}
```

**Purpose**: Ensures payload is an object when schema expects an object.

**Examples**:

- Schema: `{"name": {...}, "email": {...}}`
- Payload: `"just a string"`
- Error: `"Expected object but got string"`

#### 3b. Missing Properties Detection

```typescript
const missingKeys = schemaKeys.filter((key) => !payloadKeys.includes(key));
if (missingKeys.length > 0) {
  missingKeys.forEach((key) => {
    const propPath = path ? `${path}.${key}` : key;
    differences.push(`${propPath}: Missing required property`);
  });
}
```

**Purpose**: Identifies properties defined in schema but missing in payload.

**Example**:

- Schema: `{"name": {...}, "email": {...}, "age": {...}}`
- Payload: `{"name": "John"}`
- Errors:
  - `"email: Missing required property"`
  - `"age: Missing required property"`

#### 3c. Extra Properties Detection

```typescript
const extraKeys = payloadKeys.filter((key) => !schemaKeys.includes(key));
if (extraKeys.length > 0) {
  extraKeys.forEach((key) => {
    const propPath = path ? `${path}.${key}` : key;
    differences.push(`${propPath}: Unexpected property not defined in schema`);
  });
}
```

**Purpose**: Identifies properties in payload that don't exist in schema.

**Example**:

- Schema: `{"name": {...}}`
- Payload: `{"name": "John", "age": 25, "city": "NYC"}`
- Errors:
  - `"age: Unexpected property not defined in schema"`
  - `"city: Unexpected property not defined in schema"`

#### 3d. Recursive Property Validation

```typescript
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
```

**Purpose**: Recursively validates each matching property, building nested paths for precise error reporting.

**Path Building Examples**:

- Root level: `"name"`
- Nested: `"user.name"`
- Deep nesting: `"user.address.street"`

#### 3e. Final Result Calculation

```typescript
return allMatch && missingKeys.length === 0 && extraKeys.length === 0;
```

**Purpose**: Returns `true` only if ALL conditions are satisfied:

- All recursive validations passed
- No missing properties
- No extra properties

## Complete Usage Example

### Schema Definition

```json
{
  "properties": {
    "user": {
      "type": "object",
      "properties": {
        "name": { "type": "string" },
        "age": { "type": "number" },
        "address": {
          "type": "object",
          "properties": {
            "street": { "type": "string" },
            "zipCode": { "type": "string" }
          }
        }
      }
    }
  }
}
```

### Test Payload

```json
{
  "user": {
    "name": "John Doe",
    "age": "25",
    "address": {
      "street": "123 Main St"
    },
    "email": "john@example.com"
  }
}
```

### Validation Results

**Errors Found**:

1. `"user.age: Expected number but got string (25)"`
2. `"user.address.zipCode: Missing required property"`
3. `"user.email: Unexpected property not defined in schema"`

**Return Value**: `false`

### Successful Validation Example

**Correct Payload**:

```json
{
  "user": {
    "name": "John Doe",
    "age": 25,
    "address": {
      "street": "123 Main St",
      "zipCode": "12345"
    }
  }
}
```

**Result**:

- **Return Value**: `true`
- **Differences**: `[]` (empty array)

## Key Features

1. **Recursive Validation**: Handles deeply nested object structures
2. **Precise Error Reporting**: Provides exact property paths for errors
3. **Type Safety**: Validates both structure and data types
4. **Comprehensive Coverage**: Checks for missing, extra, and mismatched properties
5. **Path Context**: Maintains context of where in the object tree validation fails

## Error Message Patterns

| Error Type         | Pattern                                                              | Example                                                            |
| ------------------ | -------------------------------------------------------------------- | ------------------------------------------------------------------ |
| Null/Undefined     | `{path}: Property exists in schema but is null/undefined in payload` | `name: Property exists in schema but is null/undefined in payload` |
| Type Mismatch      | `{path}: Expected {type} but got {actualType}`                       | `age: Expected number but got string`                              |
| Missing Property   | `{path}: Missing required property`                                  | `email: Missing required property`                                 |
| Extra Property     | `{path}: Unexpected property not defined in schema`                  | `phoneNumber: Unexpected property not defined in schema`           |
| Structure Mismatch | `{path}: Expected object but got {actualType}`                       | `user: Expected object but got array`                              |

## Integration Notes

This function is part of the `SchemaComparisonService` and is called by `compareSchemaWithPayload` to perform the core validation logic. It works in conjunction with `validatePropertyType` for specific data type validation when schema properties have explicit type definitions.
