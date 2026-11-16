const { after, beforeEach, test } = require("node:test");
const assert = require("node:assert/strict");

const modelsPath = require.resolve("../models");
const mailQueuePath = require.resolve("../helpers/mailqueue");
const originalModelsModule = require.cache[modelsPath];
const originalMailQueueModule = require.cache[mailQueuePath];
const models = {
  Follow: { findOne: async () => null, count: async () => 0 },
  OtpModel: {},
  User: {
    findOne: async () => ({
      id: 8,
      toJSON: () => ({ id: 8, username: "profile-owner" }),
    }),
  },
};

require.cache[modelsPath] = {
  id: modelsPath,
  filename: modelsPath,
  loaded: true,
  exports: models,
};
require.cache[mailQueuePath] = {
  id: mailQueuePath,
  filename: mailQueuePath,
  loaded: true,
  exports: {},
};

const userController = require("../controllers/userController");
let response;
let followQueries;

beforeEach(() => {
  response = {
    body: null,
    statusCode: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(body) {
      this.body = body;
      return this;
    },
  };
  followQueries = [];
  models.Follow.findOne = async (query) => {
    followQueries.push(query);
    return followQueries.length === 2 ? { id: 4 } : null;
  };
  models.Follow.count = async () => 0;
});

after(() => {
  if (originalModelsModule) {
    require.cache[modelsPath] = originalModelsModule;
  } else {
    delete require.cache[modelsPath];
  }
  if (originalMailQueueModule) {
    require.cache[mailQueuePath] = originalMailQueueModule;
  } else {
    delete require.cache[mailQueuePath];
  }
});

test("profile reports when the viewed user follows the current user", async () => {
  await userController.getUser(
    { params: { username: "profile-owner" }, user: { id: 3 } },
    response,
    assert.fail,
  );

  assert.equal(response.statusCode, 200);
  assert.deepEqual(followQueries[1].where, {
    followerId: 8,
    followingId: 3,
    status: "accepted",
  });
  assert.equal(response.body.data.user.isFollowedByUser, true);
});
