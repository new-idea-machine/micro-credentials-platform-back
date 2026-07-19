/**
 * This test module works in concert with an OpenAPI YAML test data file (see
 * {@symbol "testSchemaFilename"}) that's too impractical to document here.  Modifications to this
 * module may entail modifications to the test data file as well (and vice versa).  Comments are
 * added where reasonable to help discern what the tests are attempting to accomplish in case a
 * test should ever fail.
 */

import SchemaValidator from "./schemaValidator.js";
// import { log } from "console";

const testSchemaFilename = "./test-schemas.yaml";

describe("Tests for the SchemaValidator class", () => {
  const commonTestData = {
    product: {
      name: "Laptop",
      price: 999.99,
      inStock: true
    },
    order: {
      orderId: "order-123",
      customer: {
        customerId: "cust-456",
        fullName: "John Doe",
        email: "john@example.com"
      },
      items: [
        {
          productId: "prod-789",
          quantity: 2,
          unitPrice: 29.99
        }
      ],
      totalAmount: 59.98
    },
    car: {
      vehicleId: "car-123",
      manufacturer: "Toyota",
      model: "Camry",
      year: 2023,
      doors: 4,
      fuelType: "Hybrid",
      registrationDate: "2023-01-15T10:30:00Z"
    },
    carNew: {
      manufacturer: "Honda",
      model: "Accord",
      year: 2024,
      doors: 4,
      fuelType: "Gasoline"
    },
    creditCardPayment: {
      paymentId: "pay-123",
      amount: 100.5,
      method: {
        cardNumber: "1234567890123456",
        expiryMonth: 12,
        expiryYear: 2025,
        cvv: "123"
      },
      timestamp: "2024-01-15T10:30:00Z"
    },
    bankTransferPayment: {
      paymentId: "pay-456",
      amount: 250.0,
      method: {
        accountNumber: "123456789",
        routingNumber: "987654321",
        bankName: "Test Bank"
      },
      timestamp: "2024-01-15T10:30:00Z"
    },
    organization: {
      orgId: "org-123",
      name: "Tech Corp",
      departments: [
        {
          deptId: "dept-456",
          deptName: "Engineering",
          employees: [
            {
              empId: "emp-789",
              firstName: "Jane",
              lastName: "Smith",
              position: "Software Engineer",
              salary: 95000,
              hireDate: "2023-01-15"
            },
            {
              empId: "emp-790",
              firstName: "John",
              lastName: "Doe",
              position: "Senior Engineer",
              salary: 120000,
              hireDate: "2020-06-01"
            }
          ],
          budget: 500000
        },
        {
          deptId: "dept-457",
          deptName: "Marketing",
          employees: [
            {
              empId: "emp-791",
              firstName: "Alice",
              lastName: "Johnson",
              position: "Marketing Manager",
              salary: 85000,
              hireDate: "2021-03-10"
            }
          ],
          budget: 300000
        }
      ],
      headquarters: {
        street: "123 Main St",
        city: "Calgary",
        province: "AB",
        postalCode: "T2P 1J9",
        country: "Canada"
      },
      foundedDate: "2010-05-20"
    },
    blogPost: {
      postId: "post-123",
      title: "My Blog Post",
      content: "This is the content of my blog post.",
      author: {
        authorId: "author-456",
        username: "johndoe",
        bio: "Software developer"
      },
      tags: ["tech", "programming"],
      publishedDate: "2024-01-15T10:30:00Z",
      lastModified: "2024-01-16T14:20:00Z",
      viewCount: 42
    },
    labelOrValue: {
      value: "some text"
    }
  };

  let testDataVariants = {};

  let validator;

  beforeAll(() => {
    validator = new SchemaValidator(testSchemaFilename);

    if (!(validator instanceof SchemaValidator)) {
      throw new Error("Failed to create a SchemaValidator instance");
    }

    /*
    Test data variants for the Order schema.
    */

    console.assert(commonTestData.order.items.length > 0,
      "Order test data must have at least one item");

    const orderItemSchema = validator.getSchema("OrderItem");
    const orderItemQuantityMinimum = orderItemSchema?.properties?.quantity?.minimum;
    const orderItemUnitPriceMinimum = orderItemSchema?.properties?.unitPrice?.minimum;

    if ((typeof orderItemQuantityMinimum !== "number") || (orderItemQuantityMinimum < 1)) {
      throw new Error(`OrderItem schema (${orderItemQuantityMinimum}) must have a quantity minimum property of at least 1`);
    }

    if ((typeof orderItemUnitPriceMinimum !== "number") || (orderItemUnitPriceMinimum < 0)) {
      throw new Error(`OrderItem schema (${orderItemUnitPriceMinimum}) must have a unitPrice minimum property of at least 0`);
    }

    const orderSchema = validator.getSchema("Order");
    const orderMinItems = orderSchema?.properties?.items?.minItems;

    if ((typeof orderMinItems !== "number") || (orderMinItems < 1)) {
      throw new Error(`Order schema (${orderMinItems}) must have an items minItems property of at least 1`);
    }

    testDataVariants.orderQuantityOne = structuredClone(commonTestData.order);
    testDataVariants.orderQuantityOne.items[0].quantity = orderItemQuantityMinimum;
    testDataVariants.orderQuantityOne.totalAmount = 29.99;

    testDataVariants.orderBoundaryMin = structuredClone(commonTestData.order);
    testDataVariants.orderBoundaryMin.items[0].quantity = orderItemQuantityMinimum;
    testDataVariants.orderBoundaryMin.items[0].unitPrice = orderItemUnitPriceMinimum;
    testDataVariants.orderBoundaryMin.totalAmount = orderItemQuantityMinimum * orderItemUnitPriceMinimum;

    testDataVariants.orderMinItems = orderMinItems;

    /*
    Test data variants for the Car and CarNew schemas.
    */

    const vehicleBaseSchema = validator.getSchema("VehicleBase");
    const vehicleYearMinimum = vehicleBaseSchema?.properties?.year?.minimum;

    if (typeof vehicleYearMinimum !== "number") {
      throw new Error(`VehicleBase schema (${vehicleYearMinimum}) must have a year minimum property`);
    }

    testDataVariants.carGasoline = structuredClone(commonTestData.car);
    testDataVariants.carGasoline.fuelType = "Gasoline";

    testDataVariants.carYearMinimum = vehicleYearMinimum;

    /*
    Test data variants for the CreditCardPayment schema.
    */

    const creditCardPaymentSchema = validator.getSchema("CreditCardPayment");
    const paymentExpiryMonthMaximum = creditCardPaymentSchema?.properties?.expiryMonth?.maximum;

    if (typeof paymentExpiryMonthMaximum !== "number") {
      throw new Error(`CreditCardPayment schema (${paymentExpiryMonthMaximum}) must have an expiryMonth maximum property`);
    }

    testDataVariants.paymentBoundaryMax = structuredClone(commonTestData.creditCardPayment);
    testDataVariants.paymentBoundaryMax.method.expiryYear = 2099;

    testDataVariants.paymentExpiryMonthMaximum = paymentExpiryMonthMaximum;

    /*
    Test data variant for the BlogPost schema.
    */

    const blogPostSchema = validator.getSchema("BlogPost");

    if (typeof blogPostSchema?.properties?.title?.maxLength !== "number") {
      throw new Error("BlogPost schema must have a title property with maxLength constraint");
    }

    if (typeof blogPostSchema?.properties?.tags?.maxItems !== "number") {
      throw new Error("BlogPost schema must have a tags property with maxItems constraint");
    }

    if (typeof blogPostSchema?.properties?.content?.minLength !== "number") {
      throw new Error("BlogPost schema must have a content property with minLength constraint");
    }

    testDataVariants.blogPostMaxima = structuredClone(commonTestData.blogPost);
    testDataVariants.blogPostMaxima.title = "A".repeat(blogPostSchema.properties.title.maxLength);
    testDataVariants.blogPostMaxima.tags = [];

    testDataVariants.blogPostTitleMaxLength = blogPostSchema.properties.title.maxLength;
    testDataVariants.blogPostContentMinLength = blogPostSchema.properties.content.minLength;

    for (let i = 0; i < blogPostSchema.properties.tags.maxItems; i++) {
      testDataVariants.blogPostMaxima.tags.push(`tag${i + 1}`);
    }
  });

  /*
  Tests that validate each common test data object and each test data variant against its
  respective schema.  A failure here indicates a problem with the test data itself, not with the
  validator.
  */

  describe("Validate test data & variants against the test schema", () => {
    test("should confirm commonTestData.product is valid", () => {
      expect(validator.isValid(commonTestData.product, "Product")).toBe(true);
    });

    test("should confirm commonTestData.order is valid", () => {
      expect(validator.isValid(commonTestData.order, "Order")).toBe(true);
    });

    test("should confirm commonTestData.organization is valid", () => {
      expect(validator.isValid(commonTestData.organization, "Organization")).toBe(true);
    });

    test("should confirm commonTestData.blogPost is valid", () => {
      expect(validator.isValid(commonTestData.blogPost, "BlogPost")).toBe(true);
    });

    test("should confirm commonTestData.labelOrValue is valid", () => {
      expect(validator.isValid(commonTestData.labelOrValue, "LabelOrValue")).toBe(true);
    });

    test("should confirm testDataVariants.carGasoline is valid", () => {
      expect(validator.isValid(testDataVariants.carGasoline, "Car")).toBe(true);
    });

    test("should confirm testDataVariants.orderBoundaryMin is valid", () => {
      expect(validator.isValid(testDataVariants.orderBoundaryMin, "Order")).toBe(true);
    });

    test("should confirm testDataVariants.paymentBoundaryMax is valid", () => {
      expect(validator.isValid(testDataVariants.paymentBoundaryMax, "Payment")).toBe(true);
    });

    test("should confirm testDataVariants.blogPostMaxima is valid", () => {
      expect(validator.isValid(testDataVariants.blogPostMaxima, "BlogPost")).toBe(true);
    });
  });

  /*
  Tests for construction and initialization.

  The file "./non-existent-file.yaml" must NOT exist.
  */

  describe("Construction and Initialization", () => {
    test("should load schemas from OpenAPI YAML file", () => {
      expect(validator).toBeDefined();
      expect(validator.isValid).toBeDefined();
      expect(validator.validateWithErrors).toBeDefined();
    });

    test("should throw error for non-existent file", () => {
      expect(() => {
        new SchemaValidator("non-existent-file.yaml");
      }).toThrow();
    });
  });

  /*
  Tests for schema metadata helper methods.

  The following schemas must exist in the test data file:
  - Product
  - Order
  - StrictProduct

  The following schemas must NOT exist in the test data file:
  - NonExistentSchema
  */

  describe("Schema Metadata Helper Methods", () => {
    test("should return true for known schemas and false for unknown schemas", () => {
      expect(validator.hasSchema("Product")).toBe(true);
      expect(validator.hasSchema("NonExistentSchema")).toBe(false);
    });

    test("should return available schema names", () => {
      const schemaNames = validator.getSchemaNames();

      expect(schemaNames).toContain("Product");
      expect(schemaNames).toContain("Order");
      expect(schemaNames).toContain("StrictProduct");
    });

    test("should return raw schema definition for a named schema", () => {
      const schema = validator.getSchema("Product");

      expect(schema).toBeDefined();
      expect(schema.type).toBe("object");
      expect(schema.properties.name.type).toBe("string");
    });

    test("getSchema should throw for unknown schemas", () => {
      expect(() => validator.getSchema("NonExistentSchema")).toThrow();
    });
  });

  /*
  Simple schema validation tests.

  These tests use the "Product" schema.
  */

  describe(".isValid() - Simple Schema Validation", () => {
    test("should reject Product with missing required field", () => {
      const invalidProduct = structuredClone(commonTestData.product);

      delete invalidProduct.price; // price is required{

      expect(validator.isValid(invalidProduct, "Product")).toBe(false);
    });

    test("should reject Product with invalid type", () => {
      const invalidProduct = structuredClone(commonTestData.product);

      invalidProduct.price = "not a number"; // must be number

      expect(validator.isValid(invalidProduct, "Product")).toBe(false);
    });

    test("should reject Product with invalid constraint", () => {
      const invalidProduct = structuredClone(commonTestData.product);

      invalidProduct.name = ""; // minLength: 1

      expect(validator.isValid(invalidProduct, "Product")).toBe(false);
    });

    test("should accept Product with null optional field", () => {
      const validProduct = structuredClone(commonTestData.product);

      validProduct.tags = null;

      expect(validator.isValid(validProduct, "Product")).toBe(true);
    });

    test("should accept Product with optional nullable field", () => {
      const validProduct = structuredClone(commonTestData.product);

      validProduct.tags = ["electronics", "computers"];

      expect(validator.isValid(validProduct, "Product")).toBe(true);
    });

    test("should accept Product with readOnly field present", () => {
      const validProduct = structuredClone(commonTestData.product);

      validProduct.productId = "prod-123"; // readOnly field

      /*
      The validator should still validate this object, even though it's the caller's responsibility
      to ignore or remove read-only members.
      */

      expect(validator.isValid(validProduct, "Product")).toBe(true);
    });
  });

  /*
  Nested object validation tests.

  These tests use the "Order" schema, which contains nested objects and arrays.
  */

  describe(".isValid() - Nested Object Validation", () => {
    test("should reject Order with invalid nested object", () => {
      const invalidOrder = structuredClone(commonTestData.order);

      delete invalidOrder.customer.email; // missing email

      expect(validator.isValid(invalidOrder, "Order")).toBe(false);
    });

    test("should reject Order with invalid array item", () => {
      const invalidOrder = structuredClone(commonTestData.order);

      invalidOrder.items[0].quantity = testDataVariants.orderItemQuantityMinimum - 1;

      expect(validator.isValid(invalidOrder, "Order")).toBe(false);
    });

    test("should reject Order with empty items array", () => {
      const invalidOrder = structuredClone(commonTestData.order);

      invalidOrder.items = Array.from({ length: testDataVariants.orderMinItems - 1 });

      expect(validator.isValid(invalidOrder, "Order")).toBe(false);
    });
  });

  /*
  Tests for schema composition (allOf, oneOf) and advanced features.

  These tests use the "Car", "CarNew", and "Payment" schemas, which demonstrate allOf and oneOf
  composition, readOnly fields, enum constraints, and format validation.
  */

  describe(".isValid() - Schema Composition (allOf)", () => {
    test("should reject Car missing base schema field", () => {
      const invalidCar = structuredClone(commonTestData.car);

      delete invalidCar.model; // missing model

      expect(validator.isValid(invalidCar, "Car")).toBe(false);
    });

    test("should reject Car with invalid enum value", () => {
      const invalidCar = structuredClone(commonTestData.car);

      invalidCar.fuelType = "Nuclear"; // not in enum

      expect(validator.isValid(invalidCar, "Car")).toBe(false);
    });

    test("should reject CarNew with invalid year constraint", () => {
      const invalidCarNew = structuredClone(commonTestData.carNew);

      invalidCarNew.year = testDataVariants.carYearMinimum - 1;

      expect(validator.isValid(invalidCarNew, "CarNew")).toBe(false);
    });
  });

  /*
  Tests for oneOf composition, readOnly fields, and format validation.

  These tests use the "Payment" schema, which demonstrates oneOf composition with multiple $ref,
  readOnly fields, and "format: date-time" validation.
  */

  describe(".isValid() - Schema Composition (oneOf)", () => {
    test("should reject Payment with invalid credit card pattern", () => {
      const invalidPayment = structuredClone(commonTestData.creditCardPayment);

      invalidPayment.method.cardNumber = "123"; // pattern: ^\d{16}$

      expect(validator.isValid(invalidPayment, "Payment")).toBe(false);
    });

    test("should reject Payment with invalid expiry month", () => {
      const invalidPayment = structuredClone(commonTestData.creditCardPayment);

      invalidPayment.method.expiryMonth = testDataVariants.paymentExpiryMonthMaximum + 1;

      expect(validator.isValid(invalidPayment, "Payment")).toBe(false);
    });
  });

  /*
  Tests for complex nested structures, including:  multiple levels of arrays, readOnly fields,
  pattern validation, "format: date", and minItems constraint.

  These tests use the "Organization" schema, which demonstrates all of these features.  The
  validator should be able to handle the complexity of this schema and validate objects against it.
  */

  describe(".isValid() - Complex Nested Structures", () => {
    test("should reject Organization with invalid nested employee", () => {
      const invalidOrg = structuredClone(commonTestData.organization);

      console.assert(invalidOrg.departments.length > 0,
        "Test data must have at least one department");
      console.assert(invalidOrg.departments[0].employees.length > 0,
        "Test data must have at least one employee in the first department");

      delete invalidOrg.departments[0].employees[0].lastName; // missing lastName

      expect(validator.isValid(invalidOrg, "Organization")).toBe(false);
    });

    test("should accept Organization with nullable salary", () => {
      const validOrg = structuredClone(commonTestData.organization);

      console.assert(validOrg.departments.length > 0,
        "Test data must have at least one department");
      console.assert(validOrg.departments[0].employees.length > 0,
        "Test data must have at least one employee in the first department");

      const employee = validOrg.departments[0].employees[0];

      employee.position = "Intern";
      employee.salary = null; // nullable
      employee.hireDate = "2024-01-15";

      expect(validator.isValid(validOrg, "Organization")).toBe(true);
    });

    test("should reject Organization with invalid postalCode pattern", () => {
      const invalidOrg = structuredClone(commonTestData.organization);

      invalidOrg.headquarters.postalCode = "ABC"; // pattern: ^[A-Za-z]\d[A-Za-z][ -]?\d[A-Za-z]\d$

      expect(validator.isValid(invalidOrg, "Organization")).toBe(false);
    });
  });

  /*
  Tests for nullable fields, minLength/maxLength constraints, maxItems constraint, "format:
  date-time", readOnly fields, and optional fields.

  These tests use the "BlogPost" schema, which demonstrates all of these features.  The validator
  should be able to handle these constraints and validate objects accordingly.
  */

  describe(".isValid() - Nullable and Optional Fields", () => {
    test("should validate BlogPost with nullable bio", () => {
      const validPost = structuredClone(commonTestData.blogPost);

      validPost.content = "This is the content.";
      validPost.author.bio = null; // nullable
      delete validPost.tags;
      delete validPost.publishedDate;
      validPost.viewCount = 0;

      expect(validator.isValid(validPost, "BlogPost")).toBe(true);
    });

    test("should validate BlogPost with nullable tags", () => {
      const validPost = structuredClone(commonTestData.blogPost);

      validPost.content = "This is the content.";
      delete validPost.author.bio;
      validPost.tags = null; // nullable
      delete validPost.publishedDate;
      validPost.viewCount = 0;

      expect(validator.isValid(validPost, "BlogPost")).toBe(true);
    });

    test("should validate BlogPost with nullable publishedDate", () => {
      const validPost = structuredClone(commonTestData.blogPost);

      validPost.title = "Draft Post";
      validPost.content = "This is a draft.";
      delete validPost.author.bio;
      validPost.publishedDate = null; // nullable (draft post)
      delete validPost.tags;
      validPost.viewCount = 0;

      expect(validator.isValid(validPost, "BlogPost")).toBe(true);
    });

    test("should reject BlogPost with title exceeding maxLength", () => {
      const invalidPost = structuredClone(commonTestData.blogPost);

      invalidPost.title = "A".repeat(testDataVariants.blogPostTitleMaxLength + 1);
      invalidPost.content = "This is the content.";
      delete invalidPost.author.bio;
      delete invalidPost.tags;
      delete invalidPost.publishedDate;
      invalidPost.viewCount = 0;

      expect(validator.isValid(invalidPost, "BlogPost")).toBe(false);
    });

    test("should reject BlogPost with content below minLength", () => {
      const invalidPost = structuredClone(commonTestData.blogPost);

      invalidPost.title = "My Post";
      invalidPost.content = "A".repeat(testDataVariants.blogPostContentMinLength - 1);
      delete invalidPost.author.bio;
      delete invalidPost.tags;
      delete invalidPost.publishedDate;
      invalidPost.viewCount = 0;

      expect(validator.isValid(invalidPost, "BlogPost")).toBe(false);
    });
  });

  /*
  Tests for error reporting with validateWithErrors().

  These tests use the "Product", "Order", and "BlogPost" schemas to trigger various validation
  errors.
  */

  describe("validateWithErrors() - Error Reporting", () => {
    test("should return detailed errors for invalid Product", () => {
      const invalidProduct = structuredClone(commonTestData.product);

      invalidProduct.name = "";
      invalidProduct.price = -10.0;
      invalidProduct.inStock = "yes"; // should be boolean

      const result = validator.validateWithErrors(invalidProduct, "Product");

      expect(result.isValid).toBe(false);
      expect(result.errors).toBeDefined();
      expect(Array.isArray(result.errors)).toBe(true);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    test("should return empty errors array for valid Product", () => {
      const product = structuredClone(commonTestData.product);
      const result = validator.validateWithErrors(product, "Product");

      expect(result.isValid).toBe(true);
      expect(result.errors).toEqual([]);
    });

    test("should return schema-not-found error details", () => {
      const result = validator.validateWithErrors({ foo: "bar" }, "NonExistentSchema");

      expect(result.isValid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].message).toMatch(/Schema "NonExistentSchema" not found/);
    });

    test("should provide error details for nested object validation", () => {
      const invalidOrder = structuredClone(commonTestData.order);

      delete invalidOrder.customer.email; // missing email

      invalidOrder.items[0].quantity = testDataVariants.orderItemQuantityMinimum - 1;

      const result = validator.validateWithErrors(invalidOrder, "Order");

      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });
  });

  /*
  Tests for edge cases and error handling, including non-existent schema names, null/undefined
  data, empty objects, arrays instead of objects, and primitive values instead of objects.

  These tests ensure that the validator handles these scenarios gracefully and returns appropriate
  results or throws errors as expected.
  */

  describe("Edge Cases and Error Handling", () => {
    const edgeCasesTestData = {
      nonExistentSchemaData: { name: "Test" },
      nullProductData: null,
      undefinedProductData: undefined,
      emptyObjectData: {},
      arrayData: [],
      primitiveStringData: "string",
      primitiveNumberData: 123,
      primitiveBooleanData: true
    };

    test("should handle non-existent schema name", () => {
      const data = edgeCasesTestData.nonExistentSchemaData;

      expect(() => {
        validator.isValid(data, "NonExistentSchema");
      }).toThrow();
    });

    test("should handle null data", () => {
      expect(validator.isValid(edgeCasesTestData.nullProductData, "Product")).toBe(false);
    });

    test("should handle undefined data", () => {
      expect(validator.isValid(edgeCasesTestData.undefinedProductData, "Product")).toBe(false);
    });

    test("should handle empty object", () => {
      expect(validator.isValid(edgeCasesTestData.emptyObjectData, "Product")).toBe(false);
    });

    test("should handle array instead of object", () => {
      expect(validator.isValid(edgeCasesTestData.arrayData, "Product")).toBe(false);
    });

    test("should handle primitive value instead of object", () => {
      expect(validator.isValid(edgeCasesTestData.primitiveStringData, "Product")).toBe(false);
      expect(validator.isValid(edgeCasesTestData.primitiveNumberData, "Product")).toBe(false);
      expect(validator.isValid(edgeCasesTestData.primitiveBooleanData, "Product")).toBe(false);
    });
  });

  /*
  Tests for validating format (e.g. date-time, email, date), pattern, numeric constraints (minimum,
  maximum), array constraints (minItems, maxItems), string constraints (minLength, maxLength), enum
  values, readOnly fields, and complex validation scenarios.

  These tests use various schemas from the test data file to cover a wide range of validation
  scenarios and ensure that the validator behaves as expected.
  */

  describe("Format Validation", () => {
    test("should reject invalid date-time format", () => {
      const invalidPost = structuredClone(commonTestData.blogPost);

      invalidPost.publishedDate = "not-a-date";

      expect(validator.isValid(invalidPost, "BlogPost")).toBe(false);
    });

    test("should reject invalid email format", () => {
      const invalidOrder = structuredClone(commonTestData.order);

      invalidOrder.customer.email = "not-an-email";

      expect(validator.isValid(invalidOrder, "Order")).toBe(false);
    });

    test("should reject invalid date format", () => {
      const invalidOrg = structuredClone(commonTestData.organization);

      invalidOrg.departments[0].employees[0].hireDate = "01/15/2023"; // wrong format

      expect(validator.isValid(invalidOrg, "Organization")).toBe(false);
    });
  });

  /*
  Tests for pattern validation, including postal code and credit card number patterns.

  These tests use the "Organization" and "Payment" schemas to validate pattern constraints and
  ensure that the validator correctly identifies both valid and invalid patterns.
  */

  describe("Pattern Validation", () => {
    test("should reject invalid credit card pattern", () => {
      const invalidPayment = structuredClone(commonTestData.creditCardPayment);

      invalidPayment.method.cardNumber = "1234"; // too short

      expect(validator.isValid(invalidPayment, "Payment")).toBe(false);
    });
  });

  /*
  Tests for numeric constraints, including minimum and maximum values for various fields.

  These tests use the "Order" and "Payment" schemas to validate numeric constraints and ensure that
  the validator correctly identifies both valid and invalid numeric values.
  */

  describe("Numeric Constraints", () => {
    test("should reject value below minimum", () => {
      const invalidOrder = structuredClone(testDataVariants.orderQuantityOne);

      invalidOrder.items[0].quantity = testDataVariants.orderItemQuantityMinimum - 1;
      invalidOrder.totalAmount = 0;

      expect(validator.isValid(invalidOrder, "Order")).toBe(false);
    });

    test("should reject value above maximum", () => {
      const invalidPayment = structuredClone(commonTestData.creditCardPayment);

      invalidPayment.method.expiryMonth = testDataVariants.paymentExpiryMonthMaximum + 1;

      expect(validator.isValid(invalidPayment, "Payment")).toBe(false);
    });
  });

  /*
  Tests for array constraints, including minItems and maxItems for various fields.

  These tests use the "Order" and "BlogPost" schemas to validate array constraints and ensure that
  the validator correctly identifies both valid and invalid array lengths.
  */

  describe("Array Constraints", () => {
    test("should reject array below minItems", () => {
      const invalidOrder = structuredClone(testDataVariants.orderQuantityOne);

      invalidOrder.items = Array.from({ length: testDataVariants.orderMinItems - 1 });
      invalidOrder.totalAmount = 0;

      expect(validator.isValid(invalidOrder, "Order")).toBe(false);
    });

    test("should reject array above maxItems", () => {
      const invalidPost = structuredClone(testDataVariants.blogPostMaxima);

      invalidPost.tags.push(`tag${invalidPost.tags.length + 1}`); // one above schema maxItems

      expect(validator.isValid(invalidPost, "BlogPost")).toBe(false);
    });
  });

  /*
  Tests for string constraints, including minLength and maxLength for various fields.

  These tests use the "Product" and "BlogPost" schemas to validate string constraints and ensure
  that the validator correctly identifies both valid and invalid string lengths.
  */

  describe("String Constraints", () => {
    test("should validate minLength constraint", () => {
      const product = structuredClone(commonTestData.product);

      product.name = "A";

      expect(validator.isValid(product, "Product")).toBe(true);
    });

    test("should reject string below minLength", () => {
      const invalidProduct = structuredClone(commonTestData.product);

      invalidProduct.name = "";

      expect(validator.isValid(invalidProduct, "Product")).toBe(false);
    });

    test("should validate maxLength constraint", () => {
      const post = structuredClone(testDataVariants.blogPostMaxima);

      expect(validator.isValid(post, "BlogPost")).toBe(true);
    });

    test("should reject string above maxLength", () => {
      const invalidPost = structuredClone(testDataVariants.blogPostMaxima);

      invalidPost.title = "A".repeat(testDataVariants.blogPostTitleMaxLength + 1);

      expect(validator.isValid(invalidPost, "BlogPost")).toBe(false);
    });
  });

  /*
  Tests for enum validation, including valid and invalid enum values.

  These tests use the "Car" schema to validate enum constraints and ensure that the validator
  correctly identifies both valid and invalid enum values.
  */

  describe("Enum Validation", () => {
    test("should reject invalid enum value", () => {
      const invalidCar = structuredClone(testDataVariants.carGasoline);

      invalidCar.fuelType = "Plutonium";  // no car manufactured as of this writing uses this fuel!

      expect(validator.isValid(invalidCar, "Car")).toBe(false);
    });
  });

  /*
  Tests for readOnly fields, ensuring that objects with or without readOnly fields are validated
  correctly.

  These tests use the "Product" schema, which has a readOnly field "productId".
  */

  describe("ReadOnly Fields", () => {
    test("should accept object with readOnly field present", () => {
      const productWithId = structuredClone(commonTestData.product);

      productWithId.productId = "prod-123"; // readOnly

      // Validator should still validate it (caller's responsibility to handle readOnly)
      expect(validator.isValid(productWithId, "Product")).toBe(true);
    });

  });

  /*
  Tests for complex validation scenarios, including deeply nested structures, multiple validation
  errors, and objects with a mix of required and optional fields.

  These tests use the "Organization" and "BlogPost" schemas to validate complex scenarios and
  ensure that the validator behaves as expected.
  */

  describe("Complex Validation Scenarios", () => {
    test("should handle multiple validation errors", () => {
      const invalidProductData = structuredClone(commonTestData.product);

      invalidProductData.name = "";  // minLength violation
      invalidProductData.price = -10.0;  // minimum violation
      invalidProductData.inStock = "yes";  // type violation

      const result = validator.validateWithErrors(invalidProductData, "Product");

      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThanOrEqual(3);  // the minimum number of violations
    });

    test("should validate object with mix of required and optional fields", () => {
      const blogPost = structuredClone(commonTestData.blogPost);

      /*
      Some optional members of the blogPost object are removed here.
      */

      delete blogPost.author.bio;
      delete blogPost.tags;

      expect(validator.isValid(blogPost, "BlogPost")).toBe(true);
    });

    test("should validate object with all optional fields omitted", () => {
      const blogPost = structuredClone(commonTestData.blogPost);

      /*
      All optional members of the blogPost object are removed here.
      */

      delete blogPost.author.bio;
      delete blogPost.tags;
      delete blogPost.publishedDate;

      expect(validator.isValid(blogPost, "BlogPost")).toBe(true);
    });
  });

  /*
  Performance and stress tests to ensure that the validator can handle large and complex data
  structures efficiently.

  These tests use the "Organization" schema with a large number of departments and employees to
  test the performance of the validator.
  */

  describe("Performance and Stress Tests", () => {
    test("should handle large arrays efficiently", () => {
      const bigCorp = structuredClone(commonTestData.organization);

      /*
      For this stress test, the number of departments is increased to 128 (2^7) and each department
      has 64 (2^6) employees, resulting in a total of 8192 employees.
      */

      console.assert(bigCorp.departments.length > 0,
        "commonTestData.organization test data must have at least one department");
      console.assert(bigCorp.departments[0].employees.length > 0,
        "commonTestData.organization test data must have at least one employee in the first department");

      bigCorp.departments = [bigCorp.departments[0]];
      bigCorp.departments[0].employees = [bigCorp.departments[0].employees[0]];

      for (let i = 0; i < 6; i++) {
        bigCorp.departments[0].employees =
          bigCorp.departments[0].employees.concat(bigCorp.departments[0].employees);
      }

      for (let i = 0; i < 7; i++) {
        bigCorp.departments = bigCorp.departments.concat(bigCorp.departments);
      }

      const startTime = Date.now();
      const result = validator.isValid(bigCorp, "Organization");
      const endTime = Date.now();
      const timeLimit = 5000;  // 5 seconds

      expect(result).toBe(true);
      expect(endTime - startTime).toBeLessThan(timeLimit);
    });
  });

  /*
  Tests for allOf and anyOf schema composition, including validating objects against multiple
  schemas and ensuring that the validator correctly identifies valid and invalid cases.

  These tests use the "Car" and "LabelOrValue" schemas, which demonstrate allOf and anyOf
  composition.
  */

  describe("AllOf Validation", () => {
    test("should reject when allOf constraint is violated", () => {
      const invalidCar = structuredClone(testDataVariants.carGasoline);

      invalidCar.year = testDataVariants.carYearMinimum - 1;

      expect(validator.isValid(invalidCar, "Car")).toBe(false);
    });
  });

  /*
  Tests for anyOf schema composition, including validating objects against multiple schemas and
  ensuring that the validator correctly identifies valid and invalid cases.

  These tests use the "LabelOrValue" schema, which demonstrates anyOf composition.
  */

  describe("AnyOf Validation", () => {
    test("should validate anyOf with a numeric value", () => {
      const validData = structuredClone(commonTestData.labelOrValue);

      validData.value = 42;

      expect(validator.isValid(validData, "LabelOrValue")).toBe(true);
    });

    test("should reject anyOf with a non-matching value", () => {
      const invalidData = structuredClone(commonTestData.labelOrValue);

      invalidData.value = true;

      expect(validator.isValid(invalidData, "LabelOrValue")).toBe(false);
    });
  });

  /*
  Tests for additional properties, including validating objects with extra fields and ensuring
  that the validator correctly identifies valid and invalid cases based on the additionalProperties
  setting in the schema.

  These tests use the "Product" and "StrictProduct" schemas, which demonstrate additional
  properties handling.
  */

  describe("Additional Properties", () => {
    test("should allow additional properties when additionalProperties is true", () => {
      const productWithExtraField = structuredClone(commonTestData.product);

      productWithExtraField.extraField = "This is allowed";

      expect(validator.isValid(productWithExtraField, "Product")).toBe(true);
    });

    test("should reject additional properties when additionalProperties is false", () => {
      const productWithExtraField = structuredClone(commonTestData.product);

      productWithExtraField.extraField = "This is not allowed";

      expect(validator.isValid(productWithExtraField, "StrictProduct")).toBe(false);
    });
  });

  /*
  Tests for type coercion, ensuring that the validator does not coerce types and correctly identifies
  valid and invalid cases based on the expected types in the schema.

  These tests use the "Product" schema, which has specific type requirements for its fields.
  */

  describe("Type Coercion", () => {
    test("should not coerce types", () => {
      const invalidProduct = structuredClone(commonTestData.product);

      invalidProduct.price = "999.99"; // string instead of number

      expect(validator.isValid(invalidProduct, "Product")).toBe(false);
    });
  });

  /*
  Tests for null and undefined handling, ensuring that the validator correctly identifies valid and
  invalid cases based on the presence of null and undefined values in the data.

  These tests use the "BlogPost" schema, which has nullable fields and required fields.
  */

  describe("Null and Undefined Handling", () => {
    test("should handle null in nullable fields", () => {
      const post = structuredClone(commonTestData.blogPost);

      post.author.bio = null;  // nullable

      expect(validator.isValid(post, "BlogPost")).toBe(true);
    });

    test("should reject null in non-nullable fields", () => {
      const invalidPost = structuredClone(commonTestData.blogPost);

      invalidPost.title = null;  // not nullable

      expect(validator.isValid(invalidPost, "BlogPost")).toBe(false);
    });

    test("should handle missing field", () => {
      const postWithUndefined = structuredClone(commonTestData.blogPost);

      delete postWithUndefined.author.bio;  // not required

      expect(validator.isValid(postWithUndefined, "BlogPost")).toBe(true);
    });

    test("should handle undefined as missing field", () => {
      const postWithUndefined = structuredClone(commonTestData.blogPost);

      postWithUndefined.author.bio = undefined;  // not required, should be treated as missing

      expect(validator.isValid(postWithUndefined, "BlogPost")).toBe(true);
    });
  });

  /*
  Tests for empty values, including empty strings, empty arrays, and empty objects.

  These tests use the "Product" and "Order" schemas to validate empty values and ensure that the
  validator correctly identifies valid and invalid cases based on the schema constraints.
  */

  describe("Empty Values", () => {
    const product = structuredClone(commonTestData.product);
    const createOrder = () => structuredClone(testDataVariants.orderQuantityOne);

    test("should handle empty strings", () => {
      const invalidProduct = structuredClone(commonTestData.product);

      invalidProduct.name = "";

      expect(validator.isValid(invalidProduct, "Product")).toBe(false);
    });

    test("should handle empty arrays", () => {
      const invalidOrder = structuredClone(testDataVariants.orderQuantityOne);

      invalidOrder.items = [];
      invalidOrder.totalAmount = 0;

      expect(validator.isValid(invalidOrder, "Order")).toBe(false);
    });

    test("should handle empty objects", () => {
      expect(validator.isValid({}, "Product")).toBe(false);
    });
  });

  /*
  Tests for special characters and unicode handling, ensuring that the validator correctly identifies
  valid and invalid cases based on the presence of special characters and unicode in strings.

  These tests use the "Product" and "BlogPost" schemas to validate special characters and unicode
  handling.
  */

  describe("Special Characters and Unicode", () => {
    test("should handle special characters in strings", () => {
      const validProduct = structuredClone(commonTestData.product);

      validProduct.name = "Laptop™ with €500 discount!";

      expect(validator.isValid(validProduct, "Product")).toBe(true);
    });

    test("should handle unicode characters", () => {
      const validPost = structuredClone(commonTestData.blogPost);

      validPost.title = "My Post 你好 🎉";
      validPost.content = "This is the content with unicode: 日本語";

      expect(validator.isValid(validPost, "BlogPost")).toBe(true);
    });
  });

  /*
  Tests for boundary value testing, ensuring that the validator correctly identifies valid and
  invalid cases at the boundaries of constraints.

  These tests use the "Order" and "Payment" schemas to validate boundary values for numeric
  constraints.
  */

  describe("Boundary Value Testing", () => {
    test("should reject just below minimum", () => {
      const invalidOrder = structuredClone(testDataVariants.orderBoundaryMin);

      console.assert(invalidOrder.items.length > 0,
        "Test data must have at least one item to test quantity below minimum");

      invalidOrder.items[0].quantity = testDataVariants.orderItemQuantityMinimum - 1;
      invalidOrder.items[0].unitPrice = 29.99;
      invalidOrder.totalAmount = 0;

      expect(validator.isValid(invalidOrder, "Order")).toBe(false);
    });

    test("should reject just above maximum", () => {
      const invalidPayment = structuredClone(testDataVariants.paymentBoundaryMax);

      invalidPayment.method.expiryMonth = testDataVariants.paymentExpiryMonthMaximum + 1;

      expect(validator.isValid(invalidPayment, "Payment")).toBe(false);
    });
  });

  /*
  Tests for date and time validation, ensuring that the validator correctly identifies valid and
  invalid cases based on the date-time format specified in the schema.

  These tests use the "BlogPost" schema to validate date-time fields.
  */

  describe("Date and Time Validation", () => {
    test("should reject invalid date-time format", () => {
      const invalidPost = structuredClone(commonTestData.blogPost);

      invalidPost.lastModified = "2024-01-16 14:20:00";  // missing "T" and "Z"

      expect(validator.isValid(invalidPost, "BlogPost")).toBe(false);
    });
  });

  /*
  Tests for error message quality, ensuring that the validator provides clear and helpful error
  messages for various validation failures.

  These tests use the "Product" and "Order" schemas to trigger validation errors and check the
  quality of the error messages returned by the validator.
  */

  describe("Error Message Quality", () => {
    test("should provide clear error messages for type mismatches", () => {
      const invalidProduct = structuredClone(commonTestData.product);

      invalidProduct.price = "not a number";

      const result = validator.validateWithErrors(invalidProduct, "Product");

      // Check that error relates to price field and its type

      expect(result.isValid).toBe(false);
      expect(result.errors.some((error) =>
        error.instancePath.includes("price") || (error.params?.type === "number")
      )).toBe(true);
    });

    test("should provide clear error messages for missing required fields", () => {
      const invalidProduct = structuredClone(commonTestData.product);

      delete invalidProduct.name;

      const result = validator.validateWithErrors(invalidProduct, "Product");

      // Check for missing required field

      expect(result.isValid).toBe(false);
      expect(result.errors.some((error) =>
        error.params?.missingProperty === "name"
      )).toBe(true);
    });

    test("should provide clear error messages for constraint violations", () => {
      const invalidProduct = structuredClone(commonTestData.product);

      invalidProduct.name = "";
      invalidProduct.price = -10.0;

      const result = validator.validateWithErrors(invalidProduct, "Product");

      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThanOrEqual(2);  // the number of violations
    });

    test("should include detailed error properties for required field failures", () => {
      const invalidProduct = structuredClone(commonTestData.product);

      delete invalidProduct.name;

      const result = validator.validateWithErrors(invalidProduct, "Product");

      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);

      const missingFieldError = result.errors.find(
        (error) => error.keyword === "required" || error.params?.missingProperty === "name"
      );

      expect(missingFieldError).toBeDefined();
      expect(missingFieldError.params).toBeDefined();
      expect(missingFieldError.params.missingProperty).toBe("name");
      expect(missingFieldError.instancePath).toBeDefined();
    });
  });

  /*
  Tests for error detail structure, ensuring that the validator provides structured error objects
  with helpful properties for debugging and error handling.

  These tests use the "Product" and "Order" schemas to trigger validation errors and check the
  structure of the error objects returned by the validator.
  */

  describe("Error Detail Structure", () => {
    test("should structure error objects with helpful properties", () => {
      const invalidProduct = structuredClone(commonTestData.product);

      invalidProduct.price = -10.0; // violates minimum: 0

      const result = validator.validateWithErrors(invalidProduct, "Product");

      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);

      const error = result.errors[0];

      // Verify error has expected properties for debugging

      expect(error).toHaveProperty("instancePath");
      expect(error).toHaveProperty("keyword");
      expect(error).toHaveProperty("params");
      expect(error).toHaveProperty("message");
      expect(typeof error.message).toBe("string");
      expect(error.message.length).toBeGreaterThan(0);
    });

    test("should include constraint details in error params", () => {
      const invalidOrder = structuredClone(commonTestData.order);

      invalidOrder.items[0].quantity = testDataVariants.orderItemQuantityMinimum - 1;

      const result = validator.validateWithErrors(invalidOrder, "Order");

      expect(result.isValid).toBe(false);

      const minimumError = result.errors.find((error) => error.keyword === "minimum");

      expect(minimumError).toBeDefined();
      expect(minimumError.params.limit).toBe(1);
      expect(minimumError.instancePath).toMatch(/items.*quantity/);
    });
  });

  /*
  Tests for handling non-existent schema names, ensuring that the validator throws an error or
  returns an appropriate result when a schema name is not found.

  These tests use a non-existent schema name to trigger the error handling behavior of the
  validator.
  */

  describe("Schema Not Found", () => {
    test("should handle non-existent schema gracefully", () => {
      const data = { test: "data" };

      expect(() => {
        validator.isValid(data, "NonExistentSchema");
      }).toThrow();
    });
  });

  /*
  Tests for edge cases, including very large numbers, very small positive numbers, very long
  strings, and very large arrays.

  These tests use the "Product" and "BlogPost" schemas to validate edge cases and ensure that the
  validator correctly identifies valid cases for extreme values.
  */

  describe("Edge Cases", () => {
    test("should handle very large numbers", () => {
      const validProduct = structuredClone(commonTestData.product);

      validProduct.price = Number.MAX_SAFE_INTEGER;

      expect(validator.isValid(validProduct, "Product")).toBe(true);
    });

    test("should handle very small positive numbers", () => {
      const validProduct = structuredClone(commonTestData.product);

      validProduct.price = 0.01;

      expect(validator.isValid(validProduct, "Product")).toBe(true);
    });

    test("should handle very long strings", () => {
      const longString = "A".repeat(10000);
      const validPost = structuredClone(commonTestData.blogPost);

      validPost.content = longString;

      expect(validator.isValid(validPost, "BlogPost")).toBe(true);
    });

    test("should handle very large arrays", () => {
      const validOrder = structuredClone(testDataVariants.orderQuantityOne);

      console.assert(validOrder.items.length > 0,
        "testDataVariants.orderQuantityOne test data must have at least one item");

      validOrder.items = Array(1000).fill(structuredClone(validOrder.items[0]));

      expect(validator.isValid(validOrder, "Order")).toBe(true);
    });
  });
});
