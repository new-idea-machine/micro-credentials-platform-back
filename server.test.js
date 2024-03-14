/*
List of Tests
=============

User POST Tests
---------------

 1. Register a new learner user with a missing name.
 2. Register a new learner user with a bad name type.
 3. Register a new learner user with a bad name.
 4. Register a new learner user with a missing e-mail address.
 5. Register a new learner user with a bad e-mail address type.
 6. Register a new learner user with a bad e-mail address.
 7. Register a new learner user with a missing password.
 8. Register a new learner user with a bad password type.
 9. Register a new learner user with a bad password.
10. Register a new learner user.
11. Re-register the same learner user.

User GET Tests
---------------

1. Get a user without providing an e-mail.
2. Get a user without providing a password.
3. Get an existing user.
4. Get the same user using the wrong password.
5. Get a non-existent user.
*/

/*
When jest supports importing modules, the following code fragment can be
used:

  import dotenv from "dotenv";

  dotenv.config();

  const port = process.env.PORT;

  console.assert(port?.length > 0, "Server port not specified -- add \"PORT=<port>\" to .env");
*/

const port      = "5001";                                     // MUST match the setting in .env
const serverURL = `http://localhost:${port}`;

const learnerUserData = {
  userInfo: {
    name: "Test Learner User",
    email: `learner_${Date.now()}@test.user`
  },
  password: "T35t^U$er",
  isInstructor:  false
};

/*********************************************************************************************/

async function sendRequest(method, data = null) {
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
    mode: "cors"
  };

  if (data) {
    if (method !== "GET") {
      options.headers = {"Content-Type": "application/json"};
      options.body = JSON.stringify(data);
    }
    else {
      parameters = "?" + data
    }
  }

  let response = null;                       // the response from the server (if any)
  let result = null;                         // the JSON object in the response's body (if any)

  /*
  "try-catch" blocks are used to handle the cases where there's no response from the server or
  the server's body doesn't contain a JSON object string ("await" will throw exceptions in
  these cases).
  */

  try {
    response = await fetch(`${serverURL}/user${parameters}`, options);

    try {
      result = await response.json();
    }
    catch(error) {
    }
  }
  catch(error) {
  }

  return [response, result];
}

/*********************************************************************************************/

function isAValidUID(UID) {
  /*
  Check to see if "UID" is a valid user identification.

  Return true if it is and false if it isn't.
  */

  return (typeof UID === "string") || (typeof UID === "number");
}
// ============================================================================================
// USER POST TESTS
// ============================================================================================

test("Register New Learner User (Missing Name)", async function() {
  /*
  TEST 1:  Register a new learner user with a missing name.

  EXPECTED RESULT:  Fail (status 406).
  */

  const badData = structuredClone(learnerUserData);

  delete badData.userInfo.name;

  const [response, result] = await sendRequest("POST", badData);

  expect(response?.ok).toBe(false);
  expect(response?.status).toBe(406);
  expect(typeof result?.msg).toBe("string");
  expect(typeof result?.userUID).toBe("undefined");
});

/*********************************************************************************************/

test("Register New Learner User (Bad Name Type)", async function() {
  /*
  TEST 2:  Register a new learner user with a bad name type.

  EXPECTED RESULT:  Fail (status 406).
  */

  const badData = structuredClone(learnerUserData);

  badData.userInfo.name = {rose: badData.userInfo.name};

  const [response, result] = await sendRequest("POST", badData);

  expect(response?.ok).toBe(false);
  expect(response?.status).toBe(406);
  expect(typeof result?.msg).toBe("string");
  expect(typeof result?.userUID).toBe("undefined");
});

/*********************************************************************************************/

test("Register New Learner User (Bad Name)", async function() {
  /*
  TEST 3:  Register a new learner user with a bad name.

  EXPECTED RESULT:  Fail (status 406).
  */

  const badData = structuredClone(learnerUserData);

  badData.userInfo.name = "";

  const [response, result] = await sendRequest("POST", badData);

  expect(response?.ok).toBe(false);
  expect(response?.status).toBe(406);
  expect(typeof result?.msg).toBe("string");
  expect(typeof result?.userUID).toBe("undefined");
});

/*********************************************************************************************/

test("Register New Learner User (Missing E-mail Address)", async function() {
  /*
  TEST 4:  Register a new learner user with a missing e-mail address.

  EXPECTED RESULT:  Fail (status 406).
  */

  const badData = structuredClone(learnerUserData);

  delete badData.userInfo.email;

  const [response, result] = await sendRequest("POST", badData);

  expect(response?.ok).toBe(false);
  expect(response?.status).toBe(406);
  expect(typeof result?.msg).toBe("string");
  expect(typeof result?.userUID).toBe("undefined");
});

/*********************************************************************************************/

test("Register New Learner User (Bad E-mail Address Type)", async function() {
  /*
  TEST 5:  Register a new learner user with a bad e-mail address.

  EXPECTED RESULT:  Fail (status 406).
  */

  const badData = structuredClone(learnerUserData);

  badData.userInfo.email = -1;

  const [response, result] = await sendRequest("POST", badData);

  expect(response?.ok).toBe(false);
  expect(response?.status).toBe(406);
  expect(typeof result?.msg).toBe("string");
  expect(typeof result?.userUID).toBe("undefined");
});

/*********************************************************************************************/

test("Register New Learner User (Bad E-mail Address)", async function() {
  /*
  TEST 6:  Register a new learner user with a bad e-mail address.

  EXPECTED RESULT:  Fail (status 406).
  */

  const badData = structuredClone(learnerUserData);

  badData.userInfo.email = "Bad e-mail address";

  const [response, result] = await sendRequest("POST", badData);

  expect(response?.ok).toBe(false);
  expect(response?.status).toBe(406);
  expect(typeof result?.msg).toBe("string");
  expect(typeof result?.userUID).toBe("undefined");
});

/*********************************************************************************************/

test("Register New Learner User (Missing Password)", async function() {
  /*
  TEST 7:  Register a new learner user with a missing password.

  EXPECTED RESULT:  Fail (status 406).
  */

  const badData = structuredClone(learnerUserData);

  delete badData.password;

  const [response, result] = await sendRequest("POST", badData);

  expect(response?.ok).toBe(false);
  expect(response?.status).toBe(406);
  expect(typeof result?.msg).toBe("string");
  expect(typeof result?.userUID).toBe("undefined");
});

/*********************************************************************************************/

test("Register New Learner User (Bad Password Type)", async function() {
  /*
  TEST 8:  Register a new learner user with a bad password type.

  EXPECTED RESULT:  Fail (status 406).
  */

  const badData = structuredClone(learnerUserData);

  badData.password = {error:  badData.password};

  const [response, result] = await sendRequest("POST", badData);

  expect(response?.ok).toBe(false);
  expect(response?.status).toBe(406);
  expect(typeof result?.msg).toBe("string");
  expect(typeof result?.userUID).toBe("undefined");
});

/*********************************************************************************************/

test("Register New Learner User (Bad Password)", async function() {
  /*
  TEST 9:  Register a new learner user with a bad password.

  EXPECTED RESULT:  Fail (status 406).
  */

  const badData    = structuredClone(learnerUserData);

  badData.password = "";

  const [response, result] = await sendRequest("POST", badData);

  expect(response?.ok).toBe(false);
  expect(response?.status).toBe(406);
  expect(typeof result?.msg).toBe("string");
  expect(typeof result?.userUID).toBe("undefined");
});

/*********************************************************************************************/

test("Register New Learner User", async function() {
  /*
  TEST 10:  Register a new learner user.

  EXPECTED RESULT:  Success (status 201).
  */

  const [response, result] = await sendRequest("POST", learnerUserData);

  expect(response?.ok).toBe(true);
  expect(response?.status).toBe(201);
  expect(isAValidUID(result?.userUID)).toBe(true);
  expect(typeof result?.msg).toBe("undefined");
});

/*********************************************************************************************/

test("Re-Register New Learner User", async function() {
  /*
  TEST 11:  Re-register the same learner.

  EXPECTED RESULT:  Fail (status 403).
  */

  const [response, result] = await sendRequest("POST", learnerUserData);

  expect(response?.ok).toBe(false);
  expect(response?.status).toBe(403);
  expect(typeof result?.msg).toBe("string");
  expect(typeof result?.userUID).toBe("undefined");
});

// ============================================================================================
// USER GET TESTS
// ============================================================================================

test("Get a User Without Providing an E-mail", async function () {
  /*
  TEST 1:  Get a user without providing an e-mail.

  EXPECTED RESULT:  Success (status 406).
  */

  const query = `password=${encodeURIComponent(learnerUserData.password)}`;

  const [response, result] = await sendRequest("GET", query);

  expect(response?.ok).toBe(false);
  expect(response?.status).toBe(406);
  expect(typeof result?.msg).toBe("string");
});

/*********************************************************************************************/

test("Get a User Without Providing a Password", async function() {
  /*
  TEST 2:  Get a user without providing a password.

  EXPECTED RESULT:  Success (status 406).
  */

  const query = `email=${encodeURIComponent(learnerUserData.userInfo.email)}`;

  const [response, result] = await sendRequest("GET", query);

  expect(response?.ok).toBe(false);
  expect(response?.status).toBe(406);
  expect(typeof result?.msg).toBe("string");
});

/*********************************************************************************************/

test("Get an Existing User", async function() {
  /*
  TEST 3:  Get an existing user.

  EXPECTED RESULT:  Success (status 200).
  */

  const query = `email=${encodeURIComponent(learnerUserData.userInfo.email)}&` +
                `password=${encodeURIComponent(learnerUserData.password)}`;

  const [response, result] = await sendRequest("GET", query);

  expect(response?.ok).toBe(true);
  expect(response?.status).toBe(200);
  expect(isAValidUID(result?.userUID)).toBe(true);
  expect(result?.name).toBe(learnerUserData.userInfo.name);
  expect(result?.email).toBe(learnerUserData.userInfo.email);
  expect(typeof result?.msg).toBe("undefined");
});

/*********************************************************************************************/

test("Get the Same User Using Wrong Password", async function() {
  /*
  TEST 4:  Get the same user using the wrong password.

  EXPECTED RESULT:  Fail (status 403).
  */

  const query = `email=${encodeURIComponent(learnerUserData.userInfo.email)}&` +
                `password=${encodeURIComponent("wrong_password")}`;

  const [response, result] = await sendRequest("GET", query);

  expect(response?.ok).toBe(false);
  expect(response?.status).toBe(403);
  expect(typeof result?.msg).toBe("string");
});

/*********************************************************************************************/

test("Get a Non-Existent User", async function() {
  /*
  TEST 5:  Get a non-existent user.

  EXPECTED RESULT:  Fail (status 404).
  */

  const query = `email=${encodeURIComponent("-" + learnerUserData.userInfo.email)}&` +
                `password=${encodeURIComponent(learnerUserData.password)}`;

  const [response, result] = await sendRequest("GET", query);

  expect(response?.ok).toBe(false);
  expect(response?.status).toBe(404);
  expect(typeof result?.msg).toBe("string");
});
