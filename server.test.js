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
 7. Register a new learner user with a missing user type.
 8. Register a new learner user with a bad user type.
 9. Register a new learner user.
10. Re-register the same learner user.
11. Register a new instructor user.
12. Re-register the same instructor user.

User GET Tests
---------------

 1. Get a user without providing an e-mail.
 2. Get a user without providing a password.
 3. Get a non-existent user.
 4. Get an existing learner user.
 5. Get the same learner user using the wrong password.
 6. Get an existing instructor user.
 7. Get the same instructor user using the wrong password.
*/

/*
When jest supports importing modules, the following code fragment can be
used:

  import dotenv from "dotenv";

  dotenv.config();

  const port = process.env.PORT;

  console.assert(port?.length > 0, "Server port not specified -- add \"PORT=<port>\" to .env");
*/

const port = "5001"; // MUST match the setting in .env
const serverURL = `http://localhost:${port}`;

const learnerUserData = {
  credentials: {
    email: `learner_${Date.now()}@test.user`,
    password: "T35t^U$er"
  },
  userInfo: {
    name: "Test Learner User",
    isInstructor: false
  }
};

const instructorUserData = {
  credentials: {
    email: `instructor_${Date.now()}@test.user`,
    password: "T35t^U$er"
  },
  userInfo: {
    name: "Test Instructor User",
    isInstructor: true
  }
};

/*********************************************************************************************/

async function sendRequest(method, path, credentials, data = null) {
  /*
  Handle all of the communication with the server.

  "method" is the HTTP request method (e.g. "GET" or "POST).

  If "method" is "GET" then "data" is a string of query parameters; otherwise, "data" is the
  object to be converted to a JSON string and sent as the body of the request.

  Return an array consisting of a "Response" object (or null if there was no response from the
  server) and the JSON object from the response's body (or null if the response's body didn't
  contain a JSON string).
  */

  let parameters = "";

  const options = {
    method,
    mode: "cors",
    headers: {}
  };

  if (credentials) {
    const credentialsBuffer = Buffer.from(`${credentials.email}:${credentials.password}`);
    options.headers["Authorization"] = `Basic ${credentialsBuffer.toString("base64")}`;
  }

  if (data) {
    if (method !== "GET") {
      options.body = JSON.stringify(data);
      options.headers["Content-Type"] = "application/json";
    } else {
      parameters = "?" + data;
    }
  }

  let response = null; // the response from the server (if any)
  let result = null; // the JSON object in the response's body (if any)

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
    badData.credentials,
    badData.userInfo
  );

  expect(response?.ok).toBe(false);
  expect(response?.status).toBe(406);
  expect(typeof result?.msg).toBe("string");
  expect(typeof result?.access_token).toBe("undefined");
  expect(typeof result?.token_type).toBe("undefined");
  expect(typeof result?.user_info).toBe("undefined");
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
    badData.credentials,
    badData.userInfo
  );

  expect(response?.ok).toBe(false);
  expect(response?.status).toBe(406);
  expect(typeof result?.msg).toBe("string");
  expect(typeof result?.access_token).toBe("undefined");
  expect(typeof result?.token_type).toBe("undefined");
  expect(typeof result?.user_info).toBe("undefined");
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
    badData.credentials,
    badData.userInfo
  );

  expect(response?.ok).toBe(false);
  expect(response?.status).toBe(406);
  expect(typeof result?.msg).toBe("string");
  expect(typeof result?.access_token).toBe("undefined");
  expect(typeof result?.token_type).toBe("undefined");
  expect(typeof result?.user_info).toBe("undefined");
});

/*********************************************************************************************/

test("Register New Learner User (Missing E-mail Address)", async function () {
  /*
  TEST 4:  Register a new learner user with a missing e-mail address.

  EXPECTED RESULT:  Fail (status 401).
  */

  const badData = structuredClone(learnerUserData);

  badData.credentials.email = "";

  const [response, result] = await sendRequest(
    "POST",
    "/auth",
    badData.credentials,
    badData.userInfo
  );

  expect(response?.ok).toBe(false);
  expect(response?.status).toBe(401);
  expect(typeof result?.msg).toBe("string");
  expect(typeof result?.access_token).toBe("undefined");
  expect(typeof result?.token_type).toBe("undefined");
  expect(typeof result?.user_info).toBe("undefined");
});

/*********************************************************************************************/

test("Register New Learner User (Bad E-mail Address)", async function () {
  /*
  TEST 5:  Register a new learner user with a bad e-mail address.

  EXPECTED RESULT:  Fail (status 401).
  */

  const badData = structuredClone(learnerUserData);

  badData.credentials.email = "Bad e-mail address";

  const [response, result] = await sendRequest(
    "POST",
    "/auth",
    badData.credentials,
    badData.userInfo
  );

  expect(response?.ok).toBe(false);
  expect(response?.status).toBe(401);
  expect(typeof result?.msg).toBe("string");
  expect(typeof result?.access_token).toBe("undefined");
  expect(typeof result?.token_type).toBe("undefined");
  expect(typeof result?.user_info).toBe("undefined");
});

/*********************************************************************************************/

test("Register New Learner User (Missing Password)", async function () {
  /*
  TEST 6:  Register a new learner user with a missing password.

  EXPECTED RESULT:  Fail (status 401).
  */

  const badData = structuredClone(learnerUserData);

  badData.credentials.password = "";

  const [response, result] = await sendRequest(
    "POST",
    "/auth",
    badData.credentials,
    badData.userInfo
  );

  expect(response?.ok).toBe(false);
  expect(response?.status).toBe(401);
  expect(typeof result?.msg).toBe("string");
  expect(typeof result?.access_token).toBe("undefined");
  expect(typeof result?.token_type).toBe("undefined");
  expect(typeof result?.user_info).toBe("undefined");
});

/*********************************************************************************************/

test("Register New Learner User (Missing User Type)", async function () {
  /*
  TEST 7:  Register a new learner user with a bad password.

  EXPECTED RESULT:  Fail (status 406).
  */

  const badData = structuredClone(learnerUserData);

  delete badData.userInfo.isInstructor;

  const [response, result] = await sendRequest(
    "POST",
    "/auth",
    badData.credentials,
    badData.userInfo
  );

  expect(response?.ok).toBe(false);
  expect(response?.status).toBe(406);
  expect(typeof result?.msg).toBe("string");
  expect(typeof result?.access_token).toBe("undefined");
  expect(typeof result?.token_type).toBe("undefined");
  expect(typeof result?.user_info).toBe("undefined");
});

/*********************************************************************************************/

test("Register New Learner User (Bad User Type)", async function () {
  /*
  TEST 8:  Register a new learner user with a bad user type.

  EXPECTED RESULT:  Fail (status 406).
  */

  const badData = structuredClone(learnerUserData);

  badData.userInfo.isInstructor = 42;

  const [response, result] = await sendRequest(
    "POST",
    "/auth",
    badData.credentials,
    badData.userInfo
  );

  expect(response?.ok).toBe(false);
  expect(response?.status).toBe(406);
  expect(typeof result?.msg).toBe("string");
  expect(typeof result?.access_token).toBe("undefined");
  expect(typeof result?.token_type).toBe("undefined");
  expect(typeof result?.user_info).toBe("undefined");
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
    learnerUserData.credentials,
    learnerUserData.userInfo
  );

  expect(response?.ok).toBe(true);
  expect(response?.status).toBe(201);
  expect(typeof result?.msg).toBe("undefined");
  expect(typeof result?.access_token).toBe("string");
  expect(result?.token_type).toBe("Bearer");
  expect(result?.user_info.name).toBe(learnerUserData.userInfo.name);
  expect(result?.user_info.email).toBe(learnerUserData.credentials.email);
  expect(typeof result?.user_info.learnerData).toBe("object");
  expect(result?.user_info.instructorData).toBe(null);
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
    learnerUserData.credentials,
    learnerUserData.userInfo
  );

  expect(response?.ok).toBe(false);
  expect(response?.status).toBe(403);
  expect(typeof result?.msg).toBe("string");
  expect(typeof result?.access_token).toBe("undefined");
  expect(typeof result?.token_type).toBe("undefined");
  expect(typeof result?.user_info).toBe("undefined");
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
    instructorUserData.credentials,
    instructorUserData.userInfo
  );

  expect(response?.ok).toBe(true);
  expect(response?.status).toBe(201);
  expect(typeof result?.msg).toBe("undefined");
  expect(typeof result?.access_token).toBe("string");
  expect(result?.token_type).toBe("Bearer");
  expect(result?.user_info.name).toBe(instructorUserData.userInfo.name);
  expect(result?.user_info.email).toBe(instructorUserData.credentials.email);
  expect(typeof result?.user_info.learnerData).toBe("object");
  expect(typeof result?.user_info.instructorData).toBe("object");
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
    instructorUserData.credentials,
    instructorUserData.userInfo
  );

  expect(response?.ok).toBe(false);
  expect(response?.status).toBe(403);
  expect(typeof result?.msg).toBe("string");
  expect(typeof result?.access_token).toBe("undefined");
  expect(typeof result?.token_type).toBe("undefined");
  expect(typeof result?.user_info).toBe("undefined");
});

// ============================================================================================
// USER GET TESTS
// ============================================================================================

test("Get a User Without Providing an E-mail", async function () {
  /*
  TEST 1:  Get a user without providing an e-mail.

  EXPECTED RESULT:  Fail (status 401).
  */

  const credentials = structuredClone(learnerUserData.credentials);

  credentials.email = "";

  const [response, result] = await sendRequest("GET", "/auth", credentials);

  expect(response?.ok).toBe(false);
  expect(response?.status).toBe(401);
  expect(typeof result?.msg).toBe("string");
});

/*********************************************************************************************/

test("Get a User Without Providing a Password", async function () {
  /*
  TEST 2:  Get a user without providing a password.

  EXPECTED RESULT:  Fail (status 401).
  */

  const credentials = structuredClone(learnerUserData.credentials);

  credentials.password = "";

  const [response, result] = await sendRequest("GET", "/auth", credentials);

  expect(response?.ok).toBe(false);
  expect(response?.status).toBe(401);
  expect(typeof result?.msg).toBe("string");
});

/*********************************************************************************************/

test("Get a Non-Existent Learner User", async function () {
  /*
  TEST 3:  Get a non-existent learner User.

  EXPECTED RESULT:  Fail (status 404).
  */

  const credentials = structuredClone(learnerUserData.credentials);

  credentials.email = "-" + credentials.email;

  const [response, result] = await sendRequest("GET", "/auth", credentials);

  expect(response?.ok).toBe(false);
  expect(response?.status).toBe(404);
  expect(typeof result?.msg).toBe("string");
});

/*********************************************************************************************/

test("Get an Existing Learner User", async function () {
  /*
  TEST 4:  Get an existing learner User.

  EXPECTED RESULT:  Success (status 200).
  */

  const credentials = structuredClone(learnerUserData.credentials);
  const [response, result] = await sendRequest("GET", "/auth", credentials);

  expect(response?.ok).toBe(true);
  expect(response?.status).toBe(200);
  expect(typeof result?.access_token).toBe("string");
  expect(result?.user_info?.name).toBe(learnerUserData.userInfo.name);
  expect(result?.user_info?.email).toBe(learnerUserData.credentials.email);
  expect(typeof result?.msg).toBe("undefined");
});

/*********************************************************************************************/

test("Get the Same Learner User Using Wrong Password", async function () {
  /*
  TEST 5:  Get the same learner User using the wrong password.

  EXPECTED RESULT:  Fail (status 401).
  */

  const credentials = structuredClone(learnerUserData.credentials);

  credentials.password = "wrong_password";

  const [response, result] = await sendRequest("GET", "/auth", credentials);

  expect(response?.ok).toBe(false);
  expect(response?.status).toBe(401);
  expect(typeof result?.msg).toBe("string");
});

/*********************************************************************************************/

test("Get an Existing Instructor User", async function () {
  /*
  TEST 6:  Get an existing instructor user.

  EXPECTED RESULT:  Success (status 200).
  */

  const credentials = structuredClone(instructorUserData.credentials);
  const [response, result] = await sendRequest("GET", "/auth", credentials);

  expect(response?.ok).toBe(true);
  expect(response?.status).toBe(200);
  expect(typeof result?.access_token).toBe("string");
  expect(result?.user_info?.name).toBe(instructorUserData.userInfo.name);
  expect(result?.user_info?.email).toBe(instructorUserData.credentials.email);
  expect(typeof result?.msg).toBe("undefined");
});

/*********************************************************************************************/

test("Get the Same Instructor User Using Wrong Password", async function () {
  /*
  TEST 7:  Get the same instructor user using the wrong password.

  EXPECTED RESULT:  Fail (status 401).
  */

  const credentials = structuredClone(instructorUserData.credentials);

  credentials.password = "wrong_password";

  const [response, result] = await sendRequest("GET", "/auth", credentials);

  expect(response?.ok).toBe(false);
  expect(response?.status).toBe(401);
  expect(typeof result?.msg).toBe("string");
});
