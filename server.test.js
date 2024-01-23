/*
When jest supports importing modules, the following code fragment can be
used:

  import dotenv from "dotenv";

  dotenv.config();

  const port = process.env.PORT;

  console.assert(port?.length > 0, "Server port not specified -- add \"PORT=<port>\" to .env");
*/

const port      = "5001";                     // MUST match the setting in .env
const serverURL = `http://localhost:${port}`;

const learnerUserData = {
  userInfo: {
    name: "Test Learner User",
    email: `learner_${Date.now()}@test.user`
  },
  password: "T35t^U$er",
  isInstructor:  false
};

/*****************************************************************************/

async function sendRequest(data, response, result) {
  const options = {
    method: "POST",
    mode: "cors",
    headers: {"Content-Type": "application/json"},
    body: JSON.stringify(data)
  };

  try {
    response = await fetch(`${serverURL}/user`, options);
    result = await response.json();
  }
  catch(error) {
  }

  return;
}

/*****************************************************************************/

test("Register New Learner User", async function() {
  let response = null;
  let result = null;

  sendRequest(learnerUserData, response, result);

  expect(response?.ok).toBe(true);
  expect(["string", "number"].indexOf(typeof result?.userUID)).toBeGreaterThanOrEqual(0);
  expect(typeof result?.msg).toBe("undefined");
});

/*****************************************************************************/

test("Re-Register New Learner User", async function() {
  let response = null;
  let result = null;

  sendRequest(learnerUserData, response, result);

  expect(response?.ok).toBe(false);
  expect(typeof result?.msg).toBe("string");
  expect(typeof result?.userUID).toBe("undefined");
});

/*****************************************************************************/

test("Register New Learner User (Bad E-mail Address)", async function() {
  const badData = {...learnerUserData};

  badData.userInfo.email = "Bad e-mail address";

  let response = null;
  let result = null;

  sendRequest(badData, response, result);

  expect(response?.ok).toBe(false);
  expect(typeof result?.msg).toBe("string");
  expect(typeof result?.userUID).toBe("undefined");
});

/*****************************************************************************/

test("Register New Learner User (Bad Password)", async function() {
  const badData = {...learnerUserData};

  badData.password = null;

  let response = null;
  let result = null;

  sendRequest(badData, response, result);

  expect(response?.ok).toBe(false);
  expect(typeof result?.msg).toBe("string");
  expect(typeof result?.userUID).toBe("undefined");
});