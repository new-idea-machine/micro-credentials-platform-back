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
  const testData = {
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

  const constraints = {};

  let validator;

  beforeAll(() => {
    validator = new SchemaValidator(testSchemaFilename);

    if (!(validator instanceof SchemaValidator)) {
      throw new Error("Failed to create a SchemaValidator instance");
    }

    /*
    Test data variants for the Order schema.
    */

    console.assert(testData.order.items.length > 0,
      "Order test data must have at least one item");

    const orderItemSchema = validator.getSchema("OrderItem");
    const orderItemUnitPriceMinimum = orderItemSchema?.properties?.unitPrice?.minimum;

    constraints.orderItemQuantityMinimum = orderItemSchema?.properties?.quantity?.minimum;

    if ((typeof constraints.orderItemQuantityMinimum !== "number") || (constraints.orderItemQuantityMinimum < 1)) {
      throw new Error(`OrderItem schema (${constraints.orderItemQuantityMinimum}) must have a quantity minimum property of at least 1`);
    }

    if ((typeof orderItemUnitPriceMinimum !== "number") || (orderItemUnitPriceMinimum < 0)) {
      throw new Error(`OrderItem schema (${orderItemUnitPriceMinimum}) must have a unitPrice minimum property of at least 0`);
    }

    const orderSchema = validator.getSchema("Order");

    constraints.orderMinItems = orderSchema?.properties?.items?.minItems;

    if ((typeof constraints.orderMinItems !== "number") || (constraints.orderMinItems < 1)) {
      throw new Error(`Order schema (${constraints.orderMinItems}) must have an items minItems property of at least 1`);
    }

    testData.orderQuantityOne = structuredClone(testData.order);
    testData.orderQuantityOne.items[0].quantity = constraints.orderItemQuantityMinimum;
    testData.orderQuantityOne.totalAmount = 29.99;

    testData.orderBoundaryMin = structuredClone(testData.order);
    testData.orderBoundaryMin.items[0].quantity = constraints.orderItemQuantityMinimum;
    testData.orderBoundaryMin.items[0].unitPrice = orderItemUnitPriceMinimum;
    testData.orderBoundaryMin.totalAmount = constraints.orderItemQuantityMinimum * orderItemUnitPriceMinimum;

    /*
    Test data variants for the Car and CarNew schemas.
    */

    const vehicleBaseSchema = validator.getSchema("VehicleBase");

    constraints.vehicleYearMinimum = vehicleBaseSchema?.properties?.year?.minimum;

    if (typeof constraints.vehicleYearMinimum !== "number") {
      throw new Error(`VehicleBase schema (${constraints.vehicleYearMinimum}) must have a year minimum property`);
    }

    testData.carGasoline = structuredClone(testData.car);
    testData.carGasoline.fuelType = "Gasoline";

    /*
    Test data variants for the CreditCardPayment schema.
    */

    const creditCardPaymentSchema = validator.getSchema("CreditCardPayment");

    constraints.paymentExpiryMonthMaximum = creditCardPaymentSchema?.properties?.expiryMonth?.maximum;

    if (typeof constraints.paymentExpiryMonthMaximum !== "number") {
      throw new Error(`CreditCardPayment schema (${constraints.paymentExpiryMonthMaximum}) must have an expiryMonth maximum property`);
    }

    testData.paymentBoundaryMax = structuredClone(testData.creditCardPayment);
    testData.paymentBoundaryMax.method.expiryYear = 2099;

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

    testData.blogPostMaxima = structuredClone(testData.blogPost);
    testData.blogPostMaxima.title = "A".repeat(blogPostSchema.properties.title.maxLength);
    testData.blogPostMaxima.tags = [];

    testData.blogPostTitleMaxLength = blogPostSchema.properties.title.maxLength;
    testData.blogPostContentMinLength = blogPostSchema.properties.content.minLength;

    for (let i = 0; i < blogPostSchema.properties.tags.maxItems; i++) {
      testData.blogPostMaxima.tags.push(`tag${i + 1}`);
    }
  });

  describe("OpenAPI Schema Loading and Metadata", () => {

    /*
    Tests that validate each common test data object and each test data variant against its
    respective schema.  A failure here indicates a problem with either the test data or the
    schema, not with the validator.
    */

    describe("Test Data Sanity Checks", () => {
      test("should confirm testData.product is valid", () => {
        expect(validator.isValid(testData.product, "Product")).toBe(true);
      });

      test("should confirm testData.order is valid", () => {
        expect(validator.isValid(testData.order, "Order")).toBe(true);
      });

      test("should confirm testData.organization is valid", () => {
        expect(validator.isValid(testData.organization, "Organization")).toBe(true);
      });

      test("should confirm testData.blogPost is valid", () => {
        expect(validator.isValid(testData.blogPost, "BlogPost")).toBe(true);
      });

      test("should confirm testData.labelOrValue is valid", () => {
        expect(validator.isValid(testData.labelOrValue, "LabelOrValue")).toBe(true);
      });

      test("should confirm testData.carGasoline is valid", () => {
        expect(validator.isValid(testData.carGasoline, "Car")).toBe(true);
      });

      test("should confirm testData.orderBoundaryMin is valid", () => {
        expect(validator.isValid(testData.orderBoundaryMin, "Order")).toBe(true);
      });

      test("should confirm testData.paymentBoundaryMax is valid", () => {
        expect(validator.isValid(testData.paymentBoundaryMax, "Payment")).toBe(true);
      });

      test("should confirm testData.blogPostMaxima is valid", () => {
        expect(validator.isValid(testData.blogPostMaxima, "BlogPost")).toBe(true);
      });
    });

    /*
    Tests for construction and initialization.

    The file "./non-existent-file.yaml" must NOT exist.
    */

    describe("Schema Loading", () => {
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

    describe("Schema Detection and Lookup", () => {
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

      test("should handle non-existent schema gracefully", () => {
        const data = { test: "data" };

        expect(() => {
          validator.isValid(data, "NonExistentSchema");
        }).toThrow();
      });
    });
  });

  describe("Structure and Requiredness", () => {
    test("should reject Product with missing required field", () => {
      const invalidProduct = structuredClone(testData.product);

      delete invalidProduct.price; // price is required

      expect(validator.isValid(invalidProduct, "Product")).toBe(false);
    });

    test("should reject Product with invalid type", () => {
      const invalidProduct = structuredClone(testData.product);

      invalidProduct.price = "not a number"; // must be number

      expect(validator.isValid(invalidProduct, "Product")).toBe(false);
    });

    test("should handle null data", () => {
      expect(validator.isValid(null, "Product")).toBe(false);
    });

    test("should handle undefined data", () => {
      expect(validator.isValid(undefined, "Product")).toBe(false);
    });

    test("should handle empty object", () => {
      expect(validator.isValid({}, "Product")).toBe(false);
    });

    test("should handle array instead of object", () => {
      expect(validator.isValid([], "Product")).toBe(false);
    });

    test("should handle primitive value instead of object", () => {
      expect(validator.isValid("string", "Product")).toBe(false);
      expect(validator.isValid(123, "Product")).toBe(false);
      expect(validator.isValid(true, "Product")).toBe(false);
    });

    test("should not coerce types", () => {
      const invalidProduct = structuredClone(testData.product);

      invalidProduct.price = "999.99"; // string instead of number

      expect(validator.isValid(invalidProduct, "Product")).toBe(false);
    });
  });

  describe("Primitive and Range Constraints", () => {
    test("should reject invalid date format", () => {
      const invalidOrg = structuredClone(testData.organization);

      console.assert(invalidOrg.departments.length > 0,
        "Organization test data must have at least one department");
      console.assert(invalidOrg.departments[0].employees.length > 0,
        "Organization test data must have at least one employee in the first department");

      invalidOrg.departments[0].employees[0].hireDate = "01/15/2023"; // wrong format

      expect(validator.isValid(invalidOrg, "Organization")).toBe(false);
    });

    test("should reject invalid date-time format", () => {
      const invalidPost = structuredClone(testData.blogPost);

      invalidPost.publishedDate = "not-a-date";

      expect(validator.isValid(invalidPost, "BlogPost")).toBe(false);
    });

    test("should reject invalid email format", () => {
      const invalidOrder = structuredClone(testData.order);

      invalidOrder.customer.email = "not-an-email";

      expect(validator.isValid(invalidOrder, "Order")).toBe(false);
    });

    test("should reject array below minItems", () => {
      const invalidOrder = structuredClone(testData.orderQuantityOne);

      invalidOrder.items = Array.from({ length: constraints.orderMinItems - 1 });
      invalidOrder.totalAmount = 0;

      expect(validator.isValid(invalidOrder, "Order")).toBe(false);
    });

    test("should reject array above maxItems", () => {
      const invalidPost = structuredClone(testData.blogPostMaxima);

      invalidPost.tags.push(`tag${invalidPost.tags.length + 1}`); // one above schema maxItems

      expect(validator.isValid(invalidPost, "BlogPost")).toBe(false);
    });

    test("should validate minLength constraint", () => {
      const product = structuredClone(testData.product);

      product.name = "A";

      expect(validator.isValid(product, "Product")).toBe(true);
    });

    test("should reject string above maxLength", () => {
      const invalidPost = structuredClone(testData.blogPostMaxima);

      invalidPost.title = "A".repeat(testData.blogPostTitleMaxLength + 1);

      expect(validator.isValid(invalidPost, "BlogPost")).toBe(false);
    });

    test("should handle very long strings", () => {
      const longString = "A".repeat(10000);
      const validPost = structuredClone(testData.blogPost);

      validPost.content = longString;

      expect(validator.isValid(validPost, "BlogPost")).toBe(true);
    });

    test("should reject BlogPost with content below minLength", () => {
      const invalidPost = structuredClone(testData.blogPost);

      invalidPost.content = "A".repeat(testData.blogPostContentMinLength - 1);

      expect(validator.isValid(invalidPost, "BlogPost")).toBe(false);
    });

    test("should reject just below minimum", () => {
      const invalidOrder = structuredClone(testData.orderBoundaryMin);

      console.assert(invalidOrder.items.length > 0,
        "Test data must have at least one item to test quantity below minimum");

      invalidOrder.items[0].quantity = constraints.orderItemQuantityMinimum - 1;
      invalidOrder.items[0].unitPrice = 29.99;
      invalidOrder.totalAmount = 0;

      expect(validator.isValid(invalidOrder, "Order")).toBe(false);
    });

    test("should reject just above maximum", () => {
      const invalidPayment = structuredClone(testData.paymentBoundaryMax);

      invalidPayment.method.expiryMonth = constraints.paymentExpiryMonthMaximum + 1;

      expect(validator.isValid(invalidPayment, "Payment")).toBe(false);
    });

    test("should handle very large numbers", () => {
      const validProduct = structuredClone(testData.product);

      validProduct.price = Number.MAX_SAFE_INTEGER;

      expect(validator.isValid(validProduct, "Product")).toBe(true);
    });

    test("should handle very small positive numbers", () => {
      const validProduct = structuredClone(testData.product);

      validProduct.price = 0.01;

      expect(validator.isValid(validProduct, "Product")).toBe(true);
    });

    test("should reject Organization with invalid postalCode pattern", () => {
      const invalidOrg = structuredClone(testData.organization);

      invalidOrg.headquarters.postalCode = "ABC"; // pattern: ^[A-Za-z]\d[A-Za-z][ -]?\d[A-Za-z]\d$

      expect(validator.isValid(invalidOrg, "Organization")).toBe(false);
    });

  });

  describe("Composition and References", () => {
    test("should reject Order with invalid nested object", () => {
      const invalidOrder = structuredClone(testData.order);

      delete invalidOrder.customer.email; // missing email

      expect(validator.isValid(invalidOrder, "Order")).toBe(false);
    });

    test("should reject Order with invalid array item", () => {
      const invalidOrder = structuredClone(testData.order);

      invalidOrder.items[0].quantity = constraints.orderItemQuantityMinimum - 1;

      expect(validator.isValid(invalidOrder, "Order")).toBe(false);
    });

    test("should reject Order with empty items array", () => {
      const invalidOrder = structuredClone(testData.order);

      invalidOrder.items = [];

      expect(validator.isValid(invalidOrder, "Order")).toBe(false);
    });

    test("should reject Car missing base schema field", () => {
      const invalidCar = structuredClone(testData.car);

      delete invalidCar.model; // missing model

      expect(validator.isValid(invalidCar, "Car")).toBe(false);
    });

    test("should reject invalid enum value", () => {
      const invalidCar = structuredClone(testData.carGasoline);

      invalidCar.fuelType = "Plutonium";  // no car manufactured as of this writing uses this fuel!

      expect(validator.isValid(invalidCar, "Car")).toBe(false);
    });

    test("should reject CarNew with invalid year constraint", () => {
      const invalidCarNew = structuredClone(testData.carNew);

      invalidCarNew.year = constraints.vehicleYearMinimum - 1;

      expect(validator.isValid(invalidCarNew, "CarNew")).toBe(false);
    });

    test("should reject Car when allOf base branch fails", () => {
      const invalidCar = structuredClone(testData.carGasoline);

      // Keep the Car-specific branch valid, but violate VehicleBase in the allOf branch.

      delete invalidCar.manufacturer;

      const result = validator.validateWithErrors(invalidCar, "Car");

      expect(result.isValid).toBe(false);
      expect(result.errors.some((error) =>
        error.keyword === "required" && error.params?.missingProperty === "manufacturer"
      )).toBe(true);
    });

    test("should validate anyOf with a numeric value", () => {
      const validData = structuredClone(testData.labelOrValue);

      validData.value = 42;

      expect(validator.isValid(validData, "LabelOrValue")).toBe(true);
    });

    test("should reject anyOf with a non-matching value", () => {
      const invalidData = structuredClone(testData.labelOrValue);

      invalidData.value = true;

      expect(validator.isValid(invalidData, "LabelOrValue")).toBe(false);
    });

    test("should reject Organization with invalid nested employee", () => {
      const invalidOrg = structuredClone(testData.organization);

      console.assert(invalidOrg.departments.length > 0,
        "Test data must have at least one department");
      console.assert(invalidOrg.departments[0].employees.length > 0,
        "Test data must have at least one employee in the first department");

      delete invalidOrg.departments[0].employees[0].lastName; // missing lastName

      expect(validator.isValid(invalidOrg, "Organization")).toBe(false);
    });
  });

  describe("Nullability and Optionality", () => {
    test("should accept Product with null optional field", () => {
      const validProduct = structuredClone(testData.product);

      validProduct.tags = null;

      expect(validator.isValid(validProduct, "Product")).toBe(true);
    });

    test("should reject null in non-nullable fields", () => {
      const invalidPost = structuredClone(testData.blogPost);

      invalidPost.title = null;  // not nullable

      expect(validator.isValid(invalidPost, "BlogPost")).toBe(false);
    });

    test("should handle missing field", () => {
      const postWithUndefined = structuredClone(testData.blogPost);

      delete postWithUndefined.author.bio;  // not required

      expect(validator.isValid(postWithUndefined, "BlogPost")).toBe(true);
    });

    test("should handle undefined as missing field", () => {
      const postWithUndefined = structuredClone(testData.blogPost);

      postWithUndefined.author.bio = undefined;  // not required, should be treated as missing

      expect(validator.isValid(postWithUndefined, "BlogPost")).toBe(true);
    });

  });

  describe("Object Semantics", () => {
    test("should accept Product with readOnly field present", () => {
      const validProduct = structuredClone(testData.product);

      validProduct.productId = "prod-123"; // readOnly field

      /*
      The validator should still validate this object, even though it's the caller's responsibility
      to ignore or remove read-only members.
      */

      expect(validator.isValid(validProduct, "Product")).toBe(true);
    });

    test("should allow additional properties when additionalProperties is true", () => {
      const productWithExtraField = structuredClone(testData.product);

      productWithExtraField.extraField = "This is allowed";

      expect(validator.isValid(productWithExtraField, "Product")).toBe(true);
    });

    test("should reject additional properties when additionalProperties is false", () => {
      const productWithExtraField = structuredClone(testData.product);

      productWithExtraField.extraField = "This is not allowed";

      expect(validator.isValid(productWithExtraField, "StrictProduct")).toBe(false);
    });
  });

  describe("Validation Reporting", () => {
    test("should return detailed errors for invalid Product", () => {
      const invalidProduct = structuredClone(testData.product);

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
      const product = structuredClone(testData.product);
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

    test("should include detailed error properties for required field failures", () => {
      const invalidProduct = structuredClone(testData.product);

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

    test("should structure error objects with helpful properties", () => {
      const invalidProduct = structuredClone(testData.product);

      invalidProduct.price = -10.0; // violates minimum: 0

      const result = validator.validateWithErrors(invalidProduct, "Product");

      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);

      const error = result.errors[0];

      expect(error).toHaveProperty("instancePath");
      expect(error).toHaveProperty("keyword");
      expect(error).toHaveProperty("params");
      expect(error).toHaveProperty("message");
      expect(typeof error.message).toBe("string");
      expect(error.message.length).toBeGreaterThan(0);
    });
  });

  describe("Stress and Edge Behavior", () => {
    test("should handle large arrays efficiently", () => {
      const bigCorp = structuredClone(testData.organization);

      /*
      For this stress test, the number of departments is increased to 128 (2^7) and each department
      has 64 (2^6) employees, resulting in a total of 8192 employees.
      */

      console.assert(bigCorp.departments.length > 0,
        "testData.organization test data must have at least one department");
      console.assert(bigCorp.departments[0].employees.length > 0,
        "testData.organization test data must have at least one employee in the first department");

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

    test("should handle special characters in strings", () => {
      const validProduct = structuredClone(testData.product);

      validProduct.name = "Laptop™ with €500 discount!";

      expect(validator.isValid(validProduct, "Product")).toBe(true);
    });

    test("should handle unicode characters", () => {
      const validPost = structuredClone(testData.blogPost);

      validPost.title = "My Post 你好 🎉";
      validPost.content = "This is the content with unicode: 日本語";

      expect(validator.isValid(validPost, "BlogPost")).toBe(true);
    });

    test("should handle very large arrays", () => {
      const validOrder = structuredClone(testData.orderQuantityOne);

      console.assert(validOrder.items.length > 0,
        "testData.orderQuantityOne test data must have at least one item");

      validOrder.items = Array(1000).fill(structuredClone(validOrder.items[0]));

      expect(validator.isValid(validOrder, "Order")).toBe(true);
    });
  });
});
