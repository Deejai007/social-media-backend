const { after, beforeEach, test } = require("node:test");
const assert = require("node:assert/strict");

const modelsPath = require.resolve("../models/index");
const originalModelsModule = require.cache[modelsPath];
let followStatus;
let updatedUsers;
let notifications;
let transactionCalls;
const transaction = {
  commit: async () => {
    transactionCalls.push("commit");
  },
  rollback: async () => {
    transactionCalls.push("rollback");
  },
};
const follow = {
  status: "pending",
  save: async () => {},
  destroy: async () => {
    transactionCalls.push("destroy");
  },
};
const models = {
  Follow: {
    findOne: async () => {
      follow.status = followStatus;
      return follow;
    },
  },
  Notification: {
    create: async (data, options) => {
      notifications.push({ data, options });
    },
  },
  User: {
    update: async (data, options) => {
      updatedUsers.push({ data, options });
    },
  },
  sequelize: {
    literal: (value) => value,
    transaction: async () => transaction,
  },
};

require.cache[modelsPath] = {
  id: modelsPath,
  filename: modelsPath,
  loaded: true,
  exports: models,
};

const followController = require("../controllers/followController");

beforeEach(() => {
  followStatus = "pending";
  follow.status = "pending";
  updatedUsers = [];
  notifications = [];
  transactionCalls = [];
});

after(() => {
  if (originalModelsModule) {
    require.cache[modelsPath] = originalModelsModule;
  } else {
    delete require.cache[modelsPath];
  }
});

const createResponse = () => ({
  body: null,
  json(body) {
    this.body = body;
    return this;
  },
});

test("cancelling a pending request does not decrement follow counts", async () => {
  const response = createResponse();
  await followController.unfollowUser(
    {
      user: { id: 3 },
      body: { userData: { followingId: 8, mode: "reqCancel" } },
    },
    response,
    assert.fail,
  );

  assert.deepEqual(updatedUsers, []);
  assert.deepEqual(transactionCalls, ["destroy", "commit"]);
  assert.equal(response.body.success, true);
});

test("unfollowing an accepted relationship decrements both counts", async () => {
  followStatus = "accepted";
  const response = createResponse();
  await followController.unfollowUser(
    {
      user: { id: 3 },
      body: { userData: { followingId: 8, mode: "reqUnfollow" } },
    },
    response,
    assert.fail,
  );

  assert.deepEqual(
    updatedUsers.map((update) => update.data),
    [
      { followingCount: "followingCount - 1" },
      { followerCount: "followerCount - 1" },
    ],
  );
  assert.equal(response.body.success, true);
});

test("accepting a follow creates a new-follower notification", async () => {
  followStatus = "pending";
  const response = createResponse();
  await followController.acceptFollowReq(
    { user: { id: 8 }, body: { followerId: 3 } },
    response,
    assert.fail,
  );

  assert.deepEqual(notifications, [
    {
      data: { userId: 8, actorId: 3, type: "new_follower" },
      options: { transaction },
    },
  ]);
  assert.equal(response.body.success, true);
});
