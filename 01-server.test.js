/*
List of Tests
=============

User POST Tests
---------------

 1. Register a new learner user with a missing name.
 2. Register a new learner user with a bad name type.
 3. Register a new learner user with a bad name.
 4. Register a new learner user with a missing e-mail address.
 5. Register a new learner user with a bad e-mail address.
 6. Register a new learner user with a missing password.
 7. Register a new learner user with an invalid password.
 8. Register a new learner user with an invalid information object.
 9. Register a new learner user.
10. Re-register the same learner user.
11. Register a new instructor user.
12. Re-register the same instructor user.

User GET Tests
---------------

 1. Get a user without providing an e-mail.
 2. Get a user without providing a password.
 3. Get a non-existent learner user.
 4. Get an existing learner user.
 5. Get the same learner user using the wrong password.
 6. Get an existing instructor user.
 7. Get the same instructor user using the wrong password.

User Profile PATCH Tests
-----------------------

 1. Update a user's profile without providing credentials
 2. Update learner user's profile using invalid credentials.
 3. Update the learner user's name.
 4. Add a course to the learner user's profile.
 5. Add a course to the instructor user's profile.
 6. Update the learner user's email address.
 7. Update the learner user's password.

 User DELETE Tests
 ------------------

 1. Delete a user without passing a bearer token.
 2. Delete a user by passing a blank bearer token.
 3. Delete the test learner user.
 4. Delete the test instructor user.
*/

import dotenv from "dotenv";

dotenv.config();

const port = process.env.PORT;
const serverURL = `http://localhost:${port}`;
const learnerEmail = `learner_${Date.now()}@test.user`;
const instructorEmail = `instructor_${Date.now()}@test.user`;

const learnerUserData = {
  basicAuth: {
    type: "Basic",
    email: learnerEmail,
    password: "T35t^U$er"
  },
  bearerAuth: {
    type: "Bearer",
    token: undefined
  },
  userInfo: {
    name: "Test Learner User",
    email: learnerEmail,
    learnerData: {
      courses: []
    },
    instructorData: null
  }
};

const instructorUserData = {
  basicAuth: {
    type: "Basic",
    email: instructorEmail,
    password: "T35t^U$er"
  },
  bearerAuth: {
    type: "Bearer",
    token: undefined
  },
  userInfo: {
    name: "Test Instructor User",
    email: instructorEmail,
    learnerData: {
      courses: []
    },
    instructorData: {
      courses: []
    }
  }
};

console.assert(port?.length > 0, 'Server port not specified -- add "PORT=<port>" to .env');

/*********************************************************************************************/

async function sendRequest(method, path, credentials = null, data = null) {
  /*
  Handle all of the communication with the server.

  "method" is the HTTP request method (e.g. "GET" or "POST).

  If "method" is "GET" then "data" is a string of query parameters; otherwise, "data" is the
  object to be converted to a JSON string and sent as the body of the request.

  Return an array consisting of a "Response" object (or null if there was no response from the
  server) and the JSON object from the response's body (or null if the response's body didn't
  contain a JSON string).
  */

  console.assert(
    ["GET", "POST", "PATCH", "DELETE"].includes(method),
    "Invalid HTTP request method"
  );
  console.assert(path?.startsWith("/"), "Invalid path");

  let parameters = "";

  const options = {
    method,
    mode: "cors",
    headers: {}
  };

  if (credentials?.type === "Basic") {
    console.assert(
      typeof credentials.email === "string",
      "Missing basic authentication e-mail"
    );
    console.assert(
      typeof credentials.password === "string",
      "Missing basic authentication password"
    );

    const credentialsBuffer = Buffer.from(`${credentials.email}:${credentials.password}`);

    options.headers["Authorization"] = `Basic ${credentialsBuffer.toString("base64")}`;
  } else if (credentials?.type === "Bearer") {
    console.assert(
      typeof credentials?.token === "string",
      "Missing bearer authentication token"
    );

    options.headers["Authorization"] = `Bearer ${credentials.token}`;
  }

  if (data) {
    if (method !== "GET") {
      options.body = JSON.stringify(data);
      options.headers["Content-Type"] = "application/json";
    } else {
      parameters = "?" + data;
    }
  }

  let response = undefined; // the response from the server (if any)
  let result = undefined; // the JSON object in the response's body (if any)

  /*
  "try-catch" blocks are used to handle the cases where there's no response from the server or
  the server's body doesn't contain a JSON object string ("await" will throw exceptions in
  these cases).
  */

  try {
    response = await fetch(`${serverURL}${path}${parameters}`, options);

    try {
      result = await response.json();
    } catch (error) {}
  } catch (error) {}

  return [response, result];
}

/*********************************************************************************************/

function validateCredentialObject(userData, result) {
  /*
  Test the properties of a response body to see if it's a valid "Credential" object with
  expected content.
  */

  expect(typeof result.access_token).toBe("string");
  expect(result.token_type).toBe("Bearer");
  expect(result.user_data.name).toBe(userData.userInfo.name);
  expect(result.user_data.email).toBe(userData.basicAuth.email);
  expect(typeof result.user_data.learnerData).toBe("object");

  if (userData.userInfo.isInstructor)
    expect(typeof result.user_data.instructorData).toBe("object");
  else expect(result.user_data.instructorData).toBe(null);
}

// ============================================================================================
// USER POST TESTS
// ============================================================================================

test("Register New Learner User (Missing Name)", async function () {
  /*
  TEST 1:  Register a new learner user with a missing name.

  EXPECTED RESULT:  Fail (status 406).
  */

  const badData = structuredClone(learnerUserData);

  delete badData.userInfo.name;

  const [response, result] = await sendRequest(
    "POST",
    "/auth",
    badData.basicAuth,
    badData.userInfo
  );

  expect(response?.status).toBe(406);
  expect(result).toBe(undefined);
});

/*********************************************************************************************/

test("Register New Learner User (Bad Name Type)", async function () {
  /*
  TEST 2:  Register a new learner user with a bad name type.

  EXPECTED RESULT:  Fail (status 406).
  */

  const badData = structuredClone(learnerUserData);

  badData.userInfo.name = { rose: badData.userInfo.name };

  const [response, result] = await sendRequest(
    "POST",
    "/auth",
    badData.basicAuth,
    badData.userInfo
  );

  expect(response?.status).toBe(406);
  expect(result).toBe(undefined);
});

/*********************************************************************************************/

test("Register New Learner User (Bad Name)", async function () {
  /*
  TEST 3:  Register a new learner user with a bad name.

  EXPECTED RESULT:  Fail (status 406).
  */

  const badData = structuredClone(learnerUserData);

  badData.userInfo.name = "";

  const [response, result] = await sendRequest(
    "POST",
    "/auth",
    badData.basicAuth,
    badData.userInfo
  );

  expect(response?.status).toBe(406);
  expect(result).toBe(undefined);
});

/*********************************************************************************************/

test("Register New Learner User (Missing E-mail Address)", async function () {
  /*
  TEST 4:  Register a new learner user with a missing e-mail address.

  EXPECTED RESULT:  Fail (status 406).
  */

  const badData = structuredClone(learnerUserData);

  badData.basicAuth.email = "";

  const [response, result] = await sendRequest(
    "POST",
    "/auth",
    badData.basicAuth,
    badData.userInfo
  );

  expect(response?.status).toBe(406);
  expect(result).toBe(undefined);
});

/*********************************************************************************************/

test("Register New Learner User (Bad E-mail Address)", async function () {
  /*
  TEST 5:  Register a new learner user with a bad e-mail address.

  EXPECTED RESULT:  Fail (status 406).
  */

  const badData = structuredClone(learnerUserData);

  badData.basicAuth.email = "Bad e-mail address";

  const [response, result] = await sendRequest(
    "POST",
    "/auth",
    badData.basicAuth,
    badData.userInfo
  );

  expect(response?.status).toBe(406);
  expect(result).toBe(undefined);
});

/*********************************************************************************************/

test("Register New Learner User (Missing Password)", async function () {
  /*
  TEST 6:  Register a new learner user with a missing password.

  EXPECTED RESULT:  Fail (status 406).
  */

  const badData = structuredClone(learnerUserData);

  badData.basicAuth.password = "";

  const [response, result] = await sendRequest(
    "POST",
    "/auth",
    badData.basicAuth,
    badData.userInfo
  );

  expect(response?.status).toBe(406);
  expect(result).toBe(undefined);
});

/*********************************************************************************************/

test("Register New Learner User (Invalid Password)", async function () {
  /*
  TEST 7:  Register a new learner user with an invalid password.

  EXPECTED RESULT:  Fail (status 406).
  */

  const badData = structuredClone(learnerUserData);

  badData.basicAuth.password = "password"; // the weakest possible password

  const [response, result] = await sendRequest(
    "POST",
    "/auth",
    badData.basicAuth,
    badData.userInfo
  );

  expect(response?.status).toBe(406);
  expect(result).toBe(undefined);
});

/*********************************************************************************************/

test("Register New Learner User (Invalid Information Object)", async function () {
  /*
  TEST 8:  Register a new learner user with an invalid information object.

  EXPECTED RESULT:  Fail (status 406).
  */

  const badData = structuredClone(learnerUserData);

  badData.userInfo.isInstructor = 42;

  delete badData.userInfo.instructorData;

  const [response, result] = await sendRequest(
    "POST",
    "/auth",
    badData.basicAuth,
    badData.userInfo
  );

  expect(response?.status).toBe(406);
  expect(result).toBe(undefined);
});

/*********************************************************************************************/

test("Register New Learner User", async function () {
  /*
  TEST 9:  Register a new learner user.

  EXPECTED RESULT:  Success (status 201).
  */

  const [response, result] = await sendRequest(
    "POST",
    "/auth",
    learnerUserData.basicAuth,
    learnerUserData.userInfo
  );

  expect(response?.status).toBe(201);
  expect(result).not.toBe(undefined);
  validateCredentialObject(learnerUserData, result);

  /*
  The bearer token is added to the "learnerUserData" object at this point for future use.
  */

  learnerUserData.bearerAuth.token = result.access_token;
});

/*********************************************************************************************/

test("Re-Register New Learner User", async function () {
  /*
  TEST 10:  Re-register the same learner.

  EXPECTED RESULT:  Fail (status 403).
  */

  const [response, result] = await sendRequest(
    "POST",
    "/auth",
    learnerUserData.basicAuth,
    learnerUserData.userInfo
  );

  expect(response?.status).toBe(403);
  expect(result).toBe(undefined);
});

/*********************************************************************************************/

test("Register New Instructor User", async function () {
  /*
  TEST 11:  Register a new instructor user.

  EXPECTED RESULT:  Success (status 201).
  */

  const [response, result] = await sendRequest(
    "POST",
    "/auth",
    instructorUserData.basicAuth,
    instructorUserData.userInfo
  );

  expect(response?.status).toBe(201);
  expect(result).not.toBe(undefined);
  validateCredentialObject(instructorUserData, result);

  /*
  The bearer token is added to the "instructorUserData" object at this point for future use.
  */

  instructorUserData.bearerAuth.token = result.access_token;
});

/*********************************************************************************************/

test("Re-Register New Instructor User", async function () {
  /*
  TEST 12:  Re-register the same instructor.

  EXPECTED RESULT:  Fail (status 403).
  */

  const [response, result] = await sendRequest(
    "POST",
    "/auth",
    instructorUserData.basicAuth,
    instructorUserData.userInfo
  );

  expect(response?.status).toBe(403);
  expect(result).toBe(undefined);
});

// ============================================================================================
// USER GET TESTS
// ============================================================================================

test("Get a User Without Providing an E-mail", async function () {
  /*
  TEST 1:  Get a user without providing an e-mail.

  EXPECTED RESULT:  Fail (status 404).
  */

  const credentials = structuredClone(learnerUserData.basicAuth);

  credentials.email = "";

  const [response, result] = await sendRequest("GET", "/auth", credentials);

  expect(response?.status).toBe(404);
  expect(result).toBe(undefined);
});

/*********************************************************************************************/

test("Get a User Without Providing a Password", async function () {
  /*
  TEST 2:  Get a user without providing a password.

  EXPECTED RESULT:  Fail (status 401).
  */

  const credentials = structuredClone(learnerUserData.basicAuth);

  credentials.password = "";

  const [response, result] = await sendRequest("GET", "/auth", credentials);

  expect(response?.status).toBe(401);
  expect(result).toBe(undefined);
});

/*********************************************************************************************/

test("Get a Non-Existent Learner User", async function () {
  /*
  TEST 3:  Get a non-existent learner User.

  EXPECTED RESULT:  Fail (status 404).
  */

  const credentials = structuredClone(learnerUserData.basicAuth);

  credentials.email = "-" + credentials.email;

  const [response, result] = await sendRequest("GET", "/auth", credentials);

  expect(response?.status).toBe(404);
  expect(result).toBe(undefined);
});

/*********************************************************************************************/

test("Get an Existing Learner User", async function () {
  /*
  TEST 4:  Get an existing learner User.

  EXPECTED RESULT:  Success (status 200).
  */

  const [response, result] = await sendRequest("GET", "/auth", learnerUserData.basicAuth);

  expect(response?.status).toBe(200);
  expect(result).not.toBe(undefined);
  validateCredentialObject(learnerUserData, result);
});

/*********************************************************************************************/

test("Get the Same Learner User Using Wrong Password", async function () {
  /*
  TEST 5:  Get the same learner User using the wrong password.

  EXPECTED RESULT:  Fail (status 401).
  */

  const credentials = structuredClone(learnerUserData.basicAuth);

  credentials.password = "wrong_password";

  const [response, result] = await sendRequest("GET", "/auth", credentials);

  expect(response?.status).toBe(401);
  expect(result).toBe(undefined);
});

/*********************************************************************************************/

test("Get an Existing Instructor User", async function () {
  /*
  TEST 6:  Get an existing instructor user.

  EXPECTED RESULT:  Success (status 200).
  */

  const [response, result] = await sendRequest("GET", "/auth", instructorUserData.basicAuth);

  expect(response?.status).toBe(200);
  expect(result).not.toBe(undefined);
  validateCredentialObject(instructorUserData, result);
});

/*********************************************************************************************/

test("Get the Same Instructor User Using Wrong Password", async function () {
  /*
  TEST 7:  Get the same instructor user using the wrong password.

  EXPECTED RESULT:  Fail (status 401).
  */

  const credentials = structuredClone(instructorUserData.basicAuth);

  credentials.password = "wrong_password";

  const [response, result] = await sendRequest("GET", "/auth", credentials);

  expect(response?.status).toBe(401);
  expect(result).toBe(undefined);
});

// ============================================================================================
// USER PROFILE PATCH TESTS
// ============================================================================================

test("Update a user's profile without providing credentials", async function () {
  /*
  TEST 1:  Update learner user's profile using invalid credentials.

  EXPECTED RESULT:  Fail (status 401).
  */

  const [response, result] = await sendRequest("PATCH", "/user", null, learnerUserData);

  expect(response?.status).toBe(401);
  expect(result).toBe(undefined);
});

/*********************************************************************************************/

test("Update learner user's profile using invalid credentials", async function () {
  /*
  TEST 2:  Update learner user's profile using invalid credentials.

  EXPECTED RESULT:  Fail (status 401).
  */

  const credentials = structuredClone(learnerUserData.bearerAuth);

  credentials.token = "bad_token";

  const [response, result] = await sendRequest("PATCH", "/user", credentials, learnerUserData);

  expect(response?.status).toBe(401);
  expect(result).toBe(undefined);
});

/*********************************************************************************************/

test("Update the learner user's name", async function () {
  /*
  TEST 3:  Update the learner user's name.

  EXPECTED RESULT:  Success (status 200).
  */

  const updatedUserInfo = { name: "Test Learner User, New Name" };

  const [response, result] = await sendRequest(
    "PATCH",
    "/user",
    learnerUserData.bearerAuth,
    updatedUserInfo
  );

  expect(response?.status).toBe(200);
  expect(result?.name).toBe(updatedUserInfo.name);
});

/*********************************************************************************************/

test("Add a course to the learner user's profile.", async function () {
  /*
  TEST 4:  Add a course to the learner user's profile.

  EXPECTED RESULT:  Success (status 200).
  */

  const updatedUserInfo = {
    learnerData: {
      courses: [...learnerUserData.userInfo.learnerData.courses, "12345656778"]
    }
  };

  const [response, result] = await sendRequest(
    "PATCH",
    "/user",
    learnerUserData.bearerAuth,
    updatedUserInfo
  );

  expect(response?.status).toBe(200);
  expect(typeof result).toBe("object");
});

/*********************************************************************************************/

test("Add a course to the instructor user's profile.", async function () {
  /*
  TEST 5:  Add a course to the instructor user's profile.

  EXPECTED RESULT:  Success (status 200).
  */

  const updatedUserInfo = {
    instructorData: {
      courses: [...instructorUserData.userInfo.learnerData.courses, "12345678901"]
    }
  };

  const [response, result] = await sendRequest(
    "PATCH",
    "/user",
    instructorUserData.bearerAuth,
    updatedUserInfo
  );

  expect(response?.status).toBe(200);
  expect(typeof result).toBe("object");
});

/*********************************************************************************************/

test("Update the learner user's email address", async function () {
  /*
  TEST 6:  Update the learner user's email address.

  EXPECTED RESULT:  Success (status 200).
  */

  const updatedUserInfo = {
    email: `learner_${Date.now()}@test.user`
  };

  const [response, result] = await sendRequest(
    "PATCH",
    "/user",
    learnerUserData.bearerAuth,
    updatedUserInfo
  );

  expect(response?.status).toBe(200);
  expect(typeof result).toBe("object");
  expect(result?.email).toBe(updatedUserInfo.email);
  expect(result?.email).not.toBe(learnerUserData.email);

  /*
  The new email address is stored in the "learnerData" object at this point for future use.
  */

  learnerUserData.basicAuth.email = updatedUserInfo.email;
  learnerUserData.userInfo.email = updatedUserInfo.email;
});

/*********************************************************************************************/

test("Update the learner user's password", async function () {
  /*
  TEST 6:  Update the learner user's password.

  EXPECTED RESULT:  Success (status 200).
  */

  const updatedUserInfo = { password: "new_T35t^U$er" };
  const [response, result] = await sendRequest(
    "PATCH",
    "/user",
    learnerUserData.bearerAuth,
    updatedUserInfo
  );

  expect(response?.status).toBe(200);
  expect(result?.password).toBe(undefined);

  /*
  The new password is stored in the "learnerData" object at this point for future use.
  */

  learnerUserData.basicAuth.password = updatedUserInfo.password;
});

// ============================================================================================
// USER DELETE TESTS
// ============================================================================================

test("Delete a user without passing a bearer token.", async function () {
  /*
  TEST 1:  Delete a user without passing a bearer token.

  EXPECTED RESULT:  Fail (status 401).
  */

  const [response, result] = await sendRequest("DELETE", "/user");

  expect(response?.status).toBe(401);
  expect(result).toBe(undefined);
});

test("Delete a user by passing a blank bearer token.", async function () {
  /*
  TEST 2:  Delete a user by passing a blank bearer token.

  EXPECTED RESULT:  Fail (status 401).
  */

  const badCredentials = structuredClone(learnerUserData.bearerAuth);

  badCredentials.token = "";

  const [response, result] = await sendRequest("DELETE", "/user", badCredentials);

  expect(response?.status).toBe(401);
  expect(result).toBe(undefined);
});

test("Delete the test learner user.", async function () {
  /*
  TEST 3:  Delete the test learner user.

  EXPECTED RESULT:  Success (status 200).
  */

  const [response, result] = await sendRequest("DELETE", "/user", learnerUserData.bearerAuth);

  expect(response?.status).toBe(200);
  expect(result).toBe(undefined);
});

test("Delete the test instructor user.", async function () {
  /*
  TEST 4:  Delete the test instructor user.

  EXPECTED RESULT:  Success (status 200).
  */

  const [response, result] = await sendRequest(
    "DELETE",
    "/user",
    instructorUserData.bearerAuth
  );

  expect(response?.status).toBe(200);
  expect(result).toBe(undefined);
});
