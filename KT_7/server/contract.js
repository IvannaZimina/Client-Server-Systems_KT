
import { CONTRACT } from '../materials/api-contract.js';
import { toType } from '../materials/api-schemas.js';

export { CONTRACT };

// 1–3. Skeemi kontroll: nõutud väljad, väljade tüübid ja tundmatud väljad.
export function checkSchema(contract, schemaName, data) {
  const schema = contract.schemas[schemaName];

  if (!schema) {
    return [`tundmatu skeem: ${schemaName}`];
  }

  const errors = [];

  if (!data || typeof data !== 'object' || Array.isArray(data)) {
    return ['keha peab olema objekt'];
  }

  // Kontrollitakse nõutud väljade olemasolu.
  for (const field of schema.required) {
    if (!Object.prototype.hasOwnProperty.call(data, field)) {
      errors.push(`puudub nõutud väli: ${field}`);
    }
  }

  // Kontrollitakse väljade tüüpe ja lepingus puuduvate väljade olemasolu.
  for (const [field, value] of Object.entries(data)) {
    if (!Object.prototype.hasOwnProperty.call(schema.fields, field)) {
      errors.push(`lepingus puuduv väli: ${field}`);
      continue;
    }

    // Valikulise välja väärtus võib olla null.
    if (value === null && !schema.required.includes(field)) {
      continue;
    }

    const expected = schema.fields[field];
    const actual = toType(value);

    // Integer sobib number-väljale, kuid number ei sobi integer-väljale.
    if (expected === 'number' && actual === 'integer') {
      continue;
    }

    if (actual !== expected) {
      errors.push(`${field}: ootasin ${expected}, sain ${actual}`);
    }
  }

  return errors;
}

// 4. Vastuse kontroll: tee, meetod, staatus, keha ja nõutud päised.
export function checkResponse(
  contract,
  path,
  method,
  status,
  body,
  headers = {},
) {
  const methodName = method.toUpperCase();
  const operation = contract.paths[path]?.[method.toLowerCase()];

  if (!operation) {
    return [`lepingus ei ole: ${methodName} ${path}`];
  }

  const response = operation.responses[status];

  if (!response) {
    return [
      `lepingus ei ole vastust ${status} teele ${methodName} ${path}`,
    ];
  }

  const errors = [];

  if (response.schema) {
    errors.push(...checkSchema(contract, response.schema, body));
  }

  // Päiste nimede võrdlemine ei sõltu tähtede suurusest.
  const actualHeaders = Object.keys(headers).map((name) => name.toLowerCase());

  for (const requiredHeader of response.headers ?? []) {
    if (!actualHeaders.includes(requiredHeader.toLowerCase())) {
      errors.push(`puudub nõutud päis: ${requiredHeader}`);
    }
  }

  return errors;
}

// 5. Muudatuse mõju sõltub sellest, kas tegemist on päringu või vastusega.
export function changeKind(direction, action, required = false) {
  if (action === 'update') {
    return 'BREAKING';
  }

  if (action === 'remove') {
    return 'BREAKING';
  }

  if (action === 'add') {
    if (direction === 'response') {
      return 'safe';
    }

    if (direction === 'request') {
      return required ? 'BREAKING' : 'safe';
    }
  }

  return 'BREAKING';
}

// 6. Näidisandmete loomine skeemi väljade põhjal.
function createSchemaExample(contract, schemaName) {
  const schema = contract.schemas[schemaName];

  if (!schema) {
    return {};
  }

  const body = {};

  for (const [field, type] of Object.entries(schema.fields)) {
    if (type === 'integer') {
      body[field] = 1;
    } else if (type === 'number') {
      body[field] = 1;
    } else if (type === 'string') {
      body[field] = 'example';
    } else if (type === 'array') {
      body[field] = [];
    } else if (type === 'object') {
      body[field] = {};
    }
  }

  return body;
}

// 6. Mock-vastuse loomine lepingu põhjal.
export function createMock(contract, examples = {}) {
  return function mock(method, path) {
    const methodName = method.toUpperCase();

    const matchingPath = Object.keys(contract.paths).find((pattern) => {
      const expression = new RegExp(
        '^' + pattern.replace(/\{[^/]+\}/g, '[^/]+') + '$',
      );

      return expression.test(path);
    });

    const operation = matchingPath
      ? contract.paths[matchingPath]?.[method.toLowerCase()]
      : undefined;

    if (!operation) {
      return {
        code: 404,
        body: {
          err: 'Not found',
          code: 'NOT_FOUND',
        },
        headers: {},
      };
    }

    const [status, response] = Object.entries(operation.responses)[0];
    const schemaName = response.schema;

    const body = schemaName
      ? structuredClone(
          examples[schemaName] ??
          createSchemaExample(contract, schemaName),
        )
      : {};

    const headers = {};

    // Mock lisab kõik lepingus nõutud päised.
    for (const header of response.headers ?? []) {
      if (header.toLowerCase() === 'location') {
        headers[header] = `${contract.servers[0].url}/orders/1`;
      }
    }

    return {
      code: Number(status),
      body,
      headers,
    };
  };
}

// 7. Päringust eemaldamine on murdev, sest serveri päringuskeem on range.
 // 8. Lepingute võrdlemine ja muudatuste liigitamine.
export function compareContracts(a, b) {
  const changes = [];

  // Leitakse skeemid, mida kasutatakse päringute sisendina.
  const requestSchemas = new Set();

  for (const path of Object.values(a.paths)) {
    for (const operation of Object.values(path)) {
      if (operation.requestBody?.schema) {
        requestSchemas.add(operation.requestBody.schema);
      }
    }
  }

  for (const path of Object.values(b.paths)) {
    for (const operation of Object.values(path)) {
      if (operation.requestBody?.schema) {
        requestSchemas.add(operation.requestBody.schema);
      }
    }
  }

  const schemaNames = new Set([
    ...Object.keys(a.schemas),
    ...Object.keys(b.schemas),
  ]);

  for (const schemaName of schemaNames) {
    const oldSchema = a.schemas[schemaName];
    const newSchema = b.schemas[schemaName];

    if (!oldSchema || !newSchema) {
      continue;
    }

    const oldFields = oldSchema.fields;
    const newFields = newSchema.fields;
    const direction = requestSchemas.has(schemaName)
      ? 'request'
      : 'response';

    const fieldNames = new Set([
      ...Object.keys(oldFields),
      ...Object.keys(newFields),
    ]);

    for (const field of fieldNames) {
      const existedBefore = Object.prototype.hasOwnProperty.call(
        oldFields,
        field,
      );

      const existsNow = Object.prototype.hasOwnProperty.call(
        newFields,
        field,
      );

      let kind;

      if (!existedBefore && existsNow) {
        const required = newSchema.required.includes(field);
        kind = changeKind(direction, 'add', required);
      } else if (existedBefore && !existsNow) {
        kind = changeKind(direction, 'remove');
      } else if (oldFields[field] !== newFields[field]) {
        kind = changeKind('type', 'update');
      } else {
        continue;
      }

      changes.push({
        schema: schemaName,
        field,
        kind,
      });
    }
  }

  return changes;
}
