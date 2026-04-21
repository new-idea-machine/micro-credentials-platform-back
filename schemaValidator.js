/**
 * @fileoverview Schema validation utility for OpenAPI specifications
 *
 * This module provides a SchemaValidator class that reads schemas ("components/schemas" section)
 * from an OpenAPI YAML file and validates JavaScript objects against those schemas using AJV
 * (Another JSON Schema Validator).  This is useful for validating JSON HTTP request/response
 * bodies against defined schemas.
 *
 * Key features:
 * - Single source of truth:  only the OpenAPI YAML file needs to be updated when schemas are
 *   updated (with one caveat – see note below)
 * - Lazy compilation:  validator functions are compiled on-demand for better performance
 * - Validator caching:  compiled validators are cached for reuse
 * - Cross-schema references:  supports "$ref" references between schemas
 * - Detailed error reporting:  provides both simple boolean validation and detailed error
 *   information
 * - OpenAPI compatibility:  configured to work with OpenAPI-specific schema keywords
 *
 * CAVEAT:  if a schema property is tagged as "readOnly: true" then the corresponding member of the
 * subject object will be still be validated if present.  It is the caller's responsibility to deal
 * with such members after validation has been completed.
 *
 * @example
 * // Initialize the validator with an OpenAPI document
 * const validator = new SchemaValidator('./openapi.yaml');
 *
 * // Simple validation
 * const isValid = validator.isValid(userProfile, "UserProfile");
 *
 * // Validation with detailed errors
 * const result = validator.validateWithErrors(courseData, 'Course');
 * if (!result.isValid) {
 *   console.error('Validation errors:', result.errors);
 * }
 *
 * // Check if a schema exists
 * if (validator.hasSchema('Vehicle')) {
 *   // Proceed with validation
 * }
 *
 * // Get all available schema names
 * const schemas = validator.getSchemaNames();
 * console.log('Available schemas:', schemas);
 *
 * @module schemaValidator
 * @requires fs
 * @requires js-yaml
 * @requires ajv
 * @requires ajv-formats
 */

import fs from "fs";
import yaml from "js-yaml";
import Ajv from "ajv";
import addFormats from "ajv-formats";

/**
 * Schema validator for OpenAPI specifications
 */
class SchemaValidator {
  /**
   * AJV (Another JSON Schema Validator) instance for validating schemas
   *
   * @private
   * @type {Ajv}
   */
  #ajv;

  /**
   * Schemas loaded from the OpenAPI document file
   *
   * @private
   * @type {Object.<string, object>}
   */
  #schemas;

  /**
   * Compiled schemas loaded from the OpenAPI document file
   *
   * @private
   * @type {Map<string, Ajv.ValidateFunction>}
   */
  #compiledSchemas = new Map();

  /**
   * Create a new SchemaValidator instance
   *
   * @param {string} openApiFilename - Path to the OpenAPI YAML file
   * @throws {Error} If the OpenAPI document can't be read or doesn't contain any schemas
   */
  constructor(openApiFilename) {
    try {
      /*
      First, the contents of the OpenAPI document file are read and the schemas are extracted.
      */

      const fileContents = fs.readFileSync(openApiFilename, "utf8");
      const openAPIDocument = yaml.load(fileContents);

      if (openAPIDocument?.components.schemas === undefined) {
        throw new Error(`No schemas found in OpenAPI document file "${openApiFilename}"`);
      }

      this.#schemas = openAPIDocument.components.schemas;

      /*
      Next, an Ajv instance is initialized with OpenAPI-compatible settings and additional format
      validators.
      */

      this.#ajv = new Ajv({
        allErrors: true, // Return all errors, not just the first one
        strict: false, // Allow OpenAPI-specific keywords
        validateFormats: true, // Validate format keywords
        coerceTypes: false // Don't coerce types (strict validation)
      });

      addFormats(this.#ajv);

      /*
      Finally, all schemas are added to the Ajv instance so that it will be ready to compile
      validator functions on-demand.
      */

      for (const [schemaName, schemaDetails] of Object.entries(this.#schemas)) {
        this.#ajv.addSchema(schemaDetails, `#/components/schemas/${schemaName}`);
      }
    } catch (error) {
      throw new Error(`Failed to load schemas: ${error.message}`);
    }
  }

  /**
   * Get a compiled validation function for a specific schema
   *
   * @private
   * @param {string} schemaName - Name of the schema to validate against
   * @returns {Function} Compiled validation function
   * @throws {Error} If schema doesn't exist
   */
  #getValidator(schemaName) {
    console.assert(this.#schemas !== undefined, "Schemas not loaded.");

    /*
    Validator functions are compiled on-demand.  If the one for "schemaName" hasn't been compiled
    yet then it's done so at this point and stored for future use.
    */

    let validator = this.#compiledSchemas.get(schemaName);

    if (validator === undefined) {
      const schema = this.#schemas[schemaName];

      if (schema === undefined) {
        throw new Error(`Schema "${schemaName}" not found in OpenAPI document`);
      }

      validator = this.#ajv.compile(schema);
      this.#compiledSchemas.set(schemaName, validator);
    }

    return validator;
  }

  /**
   * Check if a schema exists
   *
   * @param {string} schemaName - Name of the schema
   * @returns {boolean} True if schema exists
   */
  hasSchema(schemaName) {
    console.assert(this.#schemas !== undefined, "Schemas not loaded.");

    return this.#schemas[schemaName] !== undefined;
  }

  /**
   * Validate a JavaScript object against a named schema
   *
   * NOTE:  if a schema property is tagged as "readOnly: true" then the corresponding member of
   * "data" will be still be validated if present.  It is the caller's responsibility to deal with
   * such members after validation has been completed.
   *
   * @param {Object} data - The object to validate
   * @param {string} schemaName - Name of the schema to validate against
   * @returns {boolean} True if valid, false otherwise
   * @throws {Error} If schema doesn't exist
   */
  isValid(data, schemaName) {
    const validator = this.#getValidator(schemaName);

    return validator(data);
  }

  /**
   * Validate a JavaScript object and return detailed error information
   *
   * NOTE:  if a schema property is tagged as "readOnly: true" then the corresponding member of
   * "data" will be still be validated if present.  It is the caller's responsibility to deal with
   * such members after validation has been completed.
   *
   * @param {Object} data - The object to validate
   * @param {string} schemaName - Name of the schema to validate against
   * @returns {Object} Validation result with isValid flag and errors array
   */
  validateWithErrors(data, schemaName) {
    try {
      const validator = this.#getValidator(schemaName);
      const isValid = validator(data);

      return { isValid, errors: isValid ? [] : validator.errors || [] };
    } catch (error) {
      return { isValid: false, errors: [{ message: error.message }] };
    }
  }

  /**
   * Get a list of all available schema names
   *
   * @returns {string[]} Array of schema names
   */
  getSchemaNames() {
    console.assert(this.#schemas !== undefined, "Schemas not loaded.");

    return Object.keys(this.#schemas);
  }

  /**
   * Get the raw schema definition for a specific schema
   *
   * @param {string} schemaName - Name of the schema
   * @returns {Object} The schema definition
   * @throws {Error} If schema doesn't exist in OpenAPI document file
   */
  getSchema(schemaName) {
    console.assert(this.#schemas !== undefined, "Schemas not loaded.");

    const schema = this.#schemas[schemaName];

    if (!schema) {
      throw new Error(`Schema "${schemaName}" not found in OpenAPI document`);
    }

    return schema;
  }
}

export default SchemaValidator;
