import {
  generateToken,
  getUserUid,
  logout,
  authenticationMiddleware,
} from './tokenManager.js';
import JWT from 'jsonwebtoken';

// Helper to simulate different users
const userUid1 = 'user-uid-1';
const userUid2 = 'user-uid-2';

// ============================================================================================
// TOKEN GENERATION TESTS
// ============================================================================================

test("Generate Token (Valid User UID)", () => {
  /*
  TEST 1: Generate a token for a valid user UID.

  EXPECTED: The token should be generated and decodable.
  */
  const token = generateToken(userUid1);
  const decoded = JWT.verify(token, process.env.SECRET_KEY);

  expect(decoded.token).toBeDefined();
  expect(typeof decoded.token).toBe('string');
  expect(decoded.token.length).toBe(40); // Tokens are 40 characters long
});

test("Generate Token (Unique Tokens)", () => {
  /*
  TEST 2: Ensure that two generated tokens are unique.

  EXPECTED: Tokens should be unique even for the same user.
  */
  const token1 = generateToken(userUid1);
  const token2 = generateToken(userUid1);

  expect(token1).not.toBe(token2);
});

// ============================================================================================
// USER UID RETRIEVAL TESTS
// ============================================================================================

test("Get User UID (Valid Token)", () => {
  /*
  TEST 1: Retrieve user UID from a valid token.

  EXPECTED: The correct user UID should be returned.
  */
  const token = generateToken(userUid1);
  const retrievedUserUid = getUserUid(token);

  expect(retrievedUserUid).toBe(userUid1);
});

test("Get User UID (Invalid Token)", () => {
  /*
  TEST 2: Attempt to retrieve user UID from an invalid token.

  EXPECTED: The result should be null for an invalid token.
  */
  const invalidToken = 'invalid-token';
  const result = getUserUid(invalidToken);

  expect(result).toBeNull();
});

test("Get User UID (Expired Token)", (done) => {
  /*
  TEST 3: Attempt to retrieve user UID from an expired token.

  EXPECTED: The result should be null for an expired token.
  */
  const token = generateToken(userUid1);

  // Simulate token expiration after 1 hour
  setTimeout(() => {
    const result = getUserUid(token);
    expect(result).toBeNull();
    done();
  }, 3600 * 1000 + 1);
});

// ============================================================================================
// LOGOUT TESTS
// ============================================================================================

test("Logout (Valid Token)", () => {
  /*
  TEST 1: Log out a valid token.

  EXPECTED: The token should be removed, and the function should return true.
  */
  const token = generateToken(userUid1);
  const loggedOut = logout(token);

  expect(loggedOut).toBe(true);
  const result = getUserUid(token);
  expect(result).toBeNull(); // The token should no longer be valid
});

test("Logout (Invalid Token)", () => {
  /*
  TEST 2: Attempt to log out with an invalid token.

  EXPECTED: The function should return false for an invalid token.
  */
  const result = logout('invalid-token');
  expect(result).toBe(false);
});

// ============================================================================================
// AUTHENTICATION MIDDLEWARE TESTS
// ============================================================================================

test("Authentication Middleware (Valid Bearer Token)", () => {
  /*
  TEST 1: Handle a request with a valid Bearer token.

  EXPECTED: The request should have userUid set, and next() should be called.
  */
  const token = generateToken(userUid1);
  const req = {
    headers: {
      authorization: `Bearer ${token}`,
    },
  };
  const res = {};
  const next = jest.fn();

  authenticationMiddleware(req, res, next);

  expect(req.userUid).toBe(userUid1);
  expect(next).toHaveBeenCalled();
});

test("Authentication Middleware (Invalid Bearer Token)", () => {
  /*
  TEST 2: Handle a request with an invalid Bearer token.

  EXPECTED: The request should not have userUid set, but next() should still be called.
  */
  const req = {
    headers: {
      authorization: 'Bearer invalid-token',
    },
  };
  const res = {};
  const next = jest.fn();

  authenticationMiddleware(req, res, next);

  expect(req.userUid).toBeUndefined();
  expect(next).toHaveBeenCalled();
});

test("Authentication Middleware (Missing Authorization Header)", () => {
  /*
  TEST 3: Handle a request without an authorization header.

  EXPECTED: The request should not have userUid or userId set, but next() should be called.
  */
  const req = { headers: {} };
  const res = {};
  const next = jest.fn();

  authenticationMiddleware(req, res, next);

  expect(req.userUid).toBeUndefined();
  expect(req.userId).toBeUndefined();
  expect(next).toHaveBeenCalled();
});
