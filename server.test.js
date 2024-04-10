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
10. Register a new learner user with a missing user type.
11. Register a new learner user with a bad user type.
12. Register a new learner user.
13. Re-register the same learner user.
14. Register a new instructor user with a missing name.
15. Register a new instructor user with a bad name type.
16. Register a new instructor user with a bad name.
17. Register a new instructor user with a missing e-mail address.
18. Register a new instructor user with a bad e-mail address type.
19. Register a new instructor user with a bad e-mail address.
20. Register a new instructor user with a missing password.
21. Register a new instructor user with a bad password type.
22. Register a new instructor user with a bad password.
23. Register a new instructor user with a missing user type.
24. Register a new instructor user with a bad user type.
25. Register a new instructor user.
26. Re-register the same instructor user.

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
  userInfo: {
    name: "Test Learner User",
    email: `learner_${Date.now()}@test.user`
  },
  password: "T35t^U$er",
  isInstructor: false
};

const instructorUserData = {
  userInfo: {
    name: "Test Instructor User",
    email: `instructor_${Date.now()}@test.user`
  },
  password: "T35t^U$er",
  isInstructor: true
};

/*********************************************************************************************/

async function sendRequest(method, path, headers, data = null) {
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

  if (headers) options.headers = headers;

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

/*********************************************************************************************/

function isAValidUID(UID) {
  /*
  Check to see if "UID" is a valid user identification.

  Return true if it is and false if it isn't.
  */

  return typeof UID === "string" || typeof UID === "number";
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

  const [response, result] = await sendRequest("POST", "/user", {}, badData);

  expect(response?.ok).toBe(false);
  expect(response?.status).toBe(406);
  expect(typeof result?.msg).toBe("string");
  expect(typeof result?.userUID).toBe("undefined");
});

/*********************************************************************************************/

test("Register New Learner User (Bad Name Type)", async function () {
  /*
  TEST 2:  Register a new learner user with a bad name type.

  EXPECTED RESULT:  Fail (status 406).
  */

  const badData = structuredClone(learnerUserData);

  badData.userInfo.name = { rose: badData.userInfo.name };

  const [response, result] = await sendRequest("POST", "/user", {}, badData);

  expect(response?.ok).toBe(false);
  expect(response?.status).toBe(406);
  expect(typeof result?.msg).toBe("string");
  expect(typeof result?.userUID).toBe("undefined");
});

/*********************************************************************************************/

test("Register New Learner User (Bad Name)", async function () {
  /*
  TEST 3:  Register a new learner user with a bad name.

  EXPECTED RESULT:  Fail (status 406).
  */

  const badData = structuredClone(learnerUserData);

  badData.userInfo.name = "";

  const [response, result] = await sendRequest("POST", "/user", {}, badData);

  expect(response?.ok).toBe(false);
  expect(response?.status).toBe(406);
  expect(typeof result?.msg).toBe("string");
  expect(typeof result?.userUID).toBe("undefined");
});

/*********************************************************************************************/

test("Register New Learner User (Missing E-mail Address)", async function () {
  /*
  TEST 4:  Register a new learner user with a missing e-mail address.

  EXPECTED RESULT:  Fail (status 406).
  */

  const badData = structuredClone(learnerUserData);

  delete badData.userInfo.email;

  const [response, result] = await sendRequest("POST", "/user", {}, badData);

  expect(response?.ok).toBe(false);
  expect(response?.status).toBe(406);
  expect(typeof result?.msg).toBe("string");
  expect(typeof result?.userUID).toBe("undefined");
});

/*********************************************************************************************/

test("Register New Learner User (Bad E-mail Address Type)", async function () {
  /*
  TEST 5:  Register a new learner user with a bad e-mail address.

  EXPECTED RESULT:  Fail (status 406).
  */

  const badData = structuredClone(learnerUserData);

  badData.userInfo.email = -1;

  const [response, result] = await sendRequest("POST", "/user", {}, badData);

  expect(response?.ok).toBe(false);
  expect(response?.status).toBe(406);
  expect(typeof result?.msg).toBe("string");
  expect(typeof result?.userUID).toBe("undefined");
});

/*********************************************************************************************/

test("Register New Learner User (Bad E-mail Address)", async function () {
  /*
  TEST 6:  Register a new learner user with a bad e-mail address.

  EXPECTED RESULT:  Fail (status 406).
  */

  const badData = structuredClone(learnerUserData);

  badData.userInfo.email = "Bad e-mail address";

  const [response, result] = await sendRequest("POST", "/user", {}, badData);

  expect(response?.ok).toBe(false);
  expect(response?.status).toBe(406);
  expect(typeof result?.msg).toBe("string");
  expect(typeof result?.userUID).toBe("undefined");
});

/*********************************************************************************************/

test("Register New Learner User (Missing Password)", async function () {
  /*
  TEST 7:  Register a new learner user with a missing password.

  EXPECTED RESULT:  Fail (status 406).
  */

  const badData = structuredClone(learnerUserData);

  delete badData.password;

  const [response, result] = await sendRequest("POST", "/user", {}, badData);

  expect(response?.ok).toBe(false);
  expect(response?.status).toBe(406);
  expect(typeof result?.msg).toBe("string");
  expect(typeof result?.userUID).toBe("undefined");
});

/*********************************************************************************************/

test("Register New Learner User (Bad Password Type)", async function () {
  /*
  TEST 8:  Register a new learner user with a bad password type.

  EXPECTED RESULT:  Fail (status 406).
  */

  const badData = structuredClone(learnerUserData);

  badData.password = { error: badData.password };

  const [response, result] = await sendRequest("POST", "/user", {}, badData);

  expect(response?.ok).toBe(false);
  expect(response?.status).toBe(406);
  expect(typeof result?.msg).toBe("string");
  expect(typeof result?.userUID).toBe("undefined");
});

/*********************************************************************************************/

test("Register New Learner User (Bad Password)", async function () {
  /*
  TEST 9:  Register a new learner user with a bad password.

  EXPECTED RESULT:  Fail (status 406).
  */

  const badData = structuredClone(learnerUserData);

  badData.password = "";

  const [response, result] = await sendRequest("POST", "/user", {}, badData);

  expect(response?.ok).toBe(false);
  expect(response?.status).toBe(406);
  expect(typeof result?.msg).toBe("string");
  expect(typeof result?.userUID).toBe("undefined");
});

/*********************************************************************************************/

test("Register New Learner User (Missing User Type)", async function () {
  /*
  TEST 10:  Register a new learner user with a bad password.

  EXPECTED RESULT:  Fail (status 406).
  */

  const badData = structuredClone(learnerUserData);

  delete badData.isInstructor;

  const [response, result] = await sendRequest("POST", "/user", {}, badData);

  expect(response?.ok).toBe(false);
  expect(response?.status).toBe(406);
  expect(typeof result?.msg).toBe("string");
  expect(typeof result?.userUID).toBe("undefined");
});

/*********************************************************************************************/

test("Register New Learner User (Bad User Type)", async function () {
  /*
  TEST 11:  Register a new learner user with a bad user type.

  EXPECTED RESULT:  Fail (status 406).
  */

  const badData = structuredClone(learnerUserData);

  badData.isInstructor = 42;

  const [response, result] = await sendRequest("POST", "/user", {}, badData);

  expect(response?.ok).toBe(false);
  expect(response?.status).toBe(406);
  expect(typeof result?.msg).toBe("string");
  expect(typeof result?.userUID).toBe("undefined");
});

/*********************************************************************************************/

test("Register New Learner User", async function () {
  /*
  TEST 12:  Register a new learner user.

  EXPECTED RESULT:  Success (status 201).
  */

  const [response, result] = await sendRequest("POST", "/user", {}, learnerUserData);

  expect(response?.ok).toBe(true);
  expect(response?.status).toBe(201);
  expect(isAValidUID(result?.userUID)).toBe(true);
  expect(typeof result?.msg).toBe("undefined");
});

/*********************************************************************************************/

test("Re-Register New Learner User", async function () {
  /*
  TEST 13:  Re-register the same learner.

  EXPECTED RESULT:  Fail (status 403).
  */

  const [response, result] = await sendRequest("POST", "/user", {}, learnerUserData);

  expect(response?.ok).toBe(false);
  expect(response?.status).toBe(403);
  expect(typeof result?.msg).toBe("string");
  expect(typeof result?.userUID).toBe("undefined");
});

/*********************************************************************************************/

test("Register New Instructor User (Missing Name)", async function () {
  /*
  TEST 14:  Register a new instructor user with a missing name.

  EXPECTED RESULT:  Fail (status 406).
  */

  const badData = structuredClone(instructorUserData);

  delete badData.userInfo.name;

  const [response, result] = await sendRequest("POST", "/user", {}, badData);

  expect(response?.ok).toBe(false);
  expect(response?.status).toBe(406);
  expect(typeof result?.msg).toBe("string");
  expect(typeof result?.userUID).toBe("undefined");
});

/*********************************************************************************************/

test("Register New Instructor User (Bad Name Type)", async function () {
  /*
  TEST 15:  Register a new instructor user with a bad name type.

  EXPECTED RESULT:  Fail (status 406).
  */

  const badData = structuredClone(instructorUserData);

  badData.userInfo.name = { rose: badData.userInfo.name };

  const [response, result] = await sendRequest("POST", "/user", {}, badData);

  expect(response?.ok).toBe(false);
  expect(response?.status).toBe(406);
  expect(typeof result?.msg).toBe("string");
  expect(typeof result?.userUID).toBe("undefined");
});

/*********************************************************************************************/

test("Register New Instructor User (Bad Name)", async function () {
  /*
  TEST 16:  Register a new instructor user with a bad name.

  EXPECTED RESULT:  Fail (status 406).
  */

  const badData = structuredClone(instructorUserData);

  badData.userInfo.name = "";

  const [response, result] = await sendRequest("POST", "/user", {}, badData);

  expect(response?.ok).toBe(false);
  expect(response?.status).toBe(406);
  expect(typeof result?.msg).toBe("string");
  expect(typeof result?.userUID).toBe("undefined");
});

/*********************************************************************************************/

test("Register New Instructor User (Missing E-mail Address)", async function () {
  /*
  TEST 17:  Register a new instructor user with a missing e-mail address.

  EXPECTED RESULT:  Fail (status 406).
  */

  const badData = structuredClone(instructorUserData);

  delete badData.userInfo.email;

  const [response, result] = await sendRequest("POST", "/user", {}, badData);

  expect(response?.ok).toBe(false);
  expect(response?.status).toBe(406);
  expect(typeof result?.msg).toBe("string");
  expect(typeof result?.userUID).toBe("undefined");
});

/*********************************************************************************************/

test("Register New Instructor User (Bad E-mail Address Type)", async function () {
  /*
  TEST 18:  Register a new instructor user with a bad e-mail address.

  EXPECTED RESULT:  Fail (status 406).
  */

  const badData = structuredClone(instructorUserData);

  badData.userInfo.email = -1;

  const [response, result] = await sendRequest("POST", "/user", {}, badData);

  expect(response?.ok).toBe(false);
  expect(response?.status).toBe(406);
  expect(typeof result?.msg).toBe("string");
  expect(typeof result?.userUID).toBe("undefined");
});

/*********************************************************************************************/

test("Register New Instructor User (Bad E-mail Address)", async function () {
  /*
  TEST 19:  Register a new instructor user with a bad e-mail address.

  EXPECTED RESULT:  Fail (status 406).
  */

  const badData = structuredClone(instructorUserData);

  badData.userInfo.email = "Bad e-mail address";

  const [response, result] = await sendRequest("POST", "/user", {}, badData);

  expect(response?.ok).toBe(false);
  expect(response?.status).toBe(406);
  expect(typeof result?.msg).toBe("string");
  expect(typeof result?.userUID).toBe("undefined");
});

/*********************************************************************************************/

test("Register New Instructor User (Missing Password)", async function () {
  /*
  TEST 20:  Register a new instructor user with a missing password.

  EXPECTED RESULT:  Fail (status 406).
  */

  const badData = structuredClone(instructorUserData);

  delete badData.password;

  const [response, result] = await sendRequest("POST", "/user", {}, badData);

  expect(response?.ok).toBe(false);
  expect(response?.status).toBe(406);
  expect(typeof result?.msg).toBe("string");
  expect(typeof result?.userUID).toBe("undefined");
});

/*********************************************************************************************/

test("Register New Instructor User (Bad Password Type)", async function () {
  /*
  TEST 21:  Register a new instructor user with a bad password type.

  EXPECTED RESULT:  Fail (status 406).
  */

  const badData = structuredClone(instructorUserData);

  badData.password = { error: badData.password };

  const [response, result] = await sendRequest("POST", "/user", {}, badData);

  expect(response?.ok).toBe(false);
  expect(response?.status).toBe(406);
  expect(typeof result?.msg).toBe("string");
  expect(typeof result?.userUID).toBe("undefined");
});

/*********************************************************************************************/

test("Register New Instructor User (Bad Password)", async function () {
  /*
  TEST 22:  Register a new instructor user with a bad password.

  EXPECTED RESULT:  Fail (status 406).
  */

  const badData = structuredClone(instructorUserData);

  badData.password = "";

  const [response, result] = await sendRequest("POST", "/user", {}, badData);

  expect(response?.ok).toBe(false);
  expect(response?.status).toBe(406);
  expect(typeof result?.msg).toBe("string");
  expect(typeof result?.userUID).toBe("undefined");
});

/*********************************************************************************************/

test("Register New Instructor User (Missing User Type)", async function () {
  /*
  TEST 23:  Register a new instructor user with a bad password.

  EXPECTED RESULT:  Fail (status 406).
  */

  const badData = structuredClone(instructorUserData);

  delete badData.isInstructor;

  const [response, result] = await sendRequest("POST", "/user", {}, badData);

  expect(response?.ok).toBe(false);
  expect(response?.status).toBe(406);
  expect(typeof result?.msg).toBe("string");
  expect(typeof result?.userUID).toBe("undefined");
});

/*********************************************************************************************/

test("Register New Instructor User (Bad User Type)", async function () {
  /*
  TEST 24:  Register a new instructor user with a bad user type.

  EXPECTED RESULT:  Fail (status 406).
  */

  const badData = structuredClone(instructorUserData);

  badData.isInstructor = { professor: "Ned Brainard" };

  const [response, result] = await sendRequest("POST", "/user", {}, badData);

  expect(response?.ok).toBe(false);
  expect(response?.status).toBe(406);
  expect(typeof result?.msg).toBe("string");
  expect(typeof result?.userUID).toBe("undefined");
});

/*********************************************************************************************/

test("Register New Instructor User", async function () {
  /*
  TEST 25:  Register a new instructor user.

  EXPECTED RESULT:  Success (status 201).
  */

  const [response, result] = await sendRequest("POST", "/user", {}, instructorUserData);

  expect(response?.ok).toBe(true);
  expect(response?.status).toBe(201);
  expect(isAValidUID(result?.userUID)).toBe(true);
  expect(typeof result?.msg).toBe("undefined");
});

/*********************************************************************************************/

test("Re-Register New Instructor User", async function () {
  /*
  TEST 26:  Re-register the same instructor.

  EXPECTED RESULT:  Fail (status 403).
  */

  const [response, result] = await sendRequest("POST", "/user", {}, instructorUserData);

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

  EXPECTED RESULT:  Fail (status 401).
  */

  const headers = { Authorization: `Basic ${btoa(":" + learnerUserData.password)}` };

  const [response, result] = await sendRequest("GET", "/auth", headers);

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

  const headers = { Authorization: `Basic ${btoa(learnerUserData.userInfo.email)}` };

  const [response, result] = await sendRequest("GET", "/auth", headers);

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

  const headers = {
    Authorization: `Basic ${btoa(
      "-" + learnerUserData.userInfo.email + ":" + learnerUserData.password
    )}`
  };

  const [response, result] = await sendRequest("GET", "/auth", headers);

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

  const headers = {
    Authorization: `Basic ${btoa(
      learnerUserData.userInfo.email + ":" + learnerUserData.password
    )}`
  };

  const [response, result] = await sendRequest("GET", "/auth", headers);

  expect(response?.ok).toBe(true);
  expect(response?.status).toBe(200);
  expect(typeof result?.access_token).toBe("string");
  expect(result?.user_info?.name).toBe(learnerUserData.userInfo.name);
  expect(result?.user_info?.email).toBe(learnerUserData.userInfo.email);
  expect(typeof result?.msg).toBe("undefined");
});

/*********************************************************************************************/

test("Get the Same Learner User Using Wrong Password", async function () {
  /*
  TEST 5:  Get the same learner User using the wrong password.

  EXPECTED RESULT:  Fail (status 401).
  */

  const headers = {
    Authorization: `Basic ${btoa(learnerUserData.userInfo.email + ":wrong_password")}`
  };

  const [response, result] = await sendRequest("GET", "/auth", headers);

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

  const headers = {
    Authorization: `Basic ${btoa(
      instructorUserData.userInfo.email + ":" + instructorUserData.password
    )}`
  };

  const [response, result] = await sendRequest("GET", "/auth", headers);

  expect(response?.ok).toBe(true);
  expect(response?.status).toBe(200);
  expect(typeof result?.access_token).toBe("string");
  expect(result?.user_info?.name).toBe(instructorUserData.userInfo.name);
  expect(result?.user_info?.email).toBe(instructorUserData.userInfo.email);
  expect(typeof result?.msg).toBe("undefined");
});

/*********************************************************************************************/

test("Get the Same Instructor User Using Wrong Password", async function () {
  /*
  TEST 7:  Get the same instructor user using the wrong password.

  EXPECTED RESULT:  Fail (status 401).
  */

  const headers = {
    Authorization: `Basic ${btoa(instructorUserData.userInfo.email + ":wrong_password")}`
  };

  const [response, result] = await sendRequest("GET", "/auth", headers);

  expect(response?.ok).toBe(false);
  expect(response?.status).toBe(401);
  expect(typeof result?.msg).toBe("string");
});
