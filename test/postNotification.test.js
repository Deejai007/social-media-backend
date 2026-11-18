const { after, beforeEach, test } = require("node:test");
const assert = require("node:assert/strict");

const modelsPath = require.resolve("../models");
const originalModelsModule = require.cache[modelsPath];
let actorId;
let createdNotifications;
let createdLikes;
let updatedPosts;
const transaction = {};
const models = {
  Follow: {},
  Like: {
    count: async () => 0,
    create: async (data, options) => {
      createdLikes.push({ data, options });
    },
  },
  Notification: {
    create: async (data, options) => {
      createdNotifications.push({ data, options });
    },
  },
  Post: {
    findByPk: async () => ({ id: 11, userId: 5 }),
    increment: async (...args) => updatedPosts.push(args),
  },
  User: {},
  sequelize: {
    transaction: async (callback) => callback(transaction),
  },
};

require.cache[modelsPath] = {
  id: modelsPath,
  filename: modelsPath,
  loaded: true,
  exports: models,
};

const postController = require("../controllers/postController");

beforeEach(() => {
  actorId = 7;
  createdNotifications = [];
  createdLikes = [];
  updatedPosts = [];
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
  status(code) {
    this.statusCode = code;
    return this;
  },
  json(body) {
    this.body = body;
    return this;
  },
});

test("liking another user's post creates a notification in the same transaction", async () => {
  const response = createResponse();
  await postController.likePost(
    { user: { id: actorId }, body: { postId: 11 } },
    response,
    assert.fail,
  );

  assert.deepEqual(createdNotifications, [
    {
      data: { userId: 5, actorId: 7, postId: 11, type: "post_like" },
      options: { transaction },
    },
  ]);
  assert.equal(createdLikes.length, 1);
  assert.equal(response.body.success, true);
});

test("liking your own post does not create a notification", async () => {
  actorId = 5;
  const response = createResponse();
  await postController.likePost(
    { user: { id: actorId }, body: { postId: 11 } },
    response,
    assert.fail,
  );

  assert.deepEqual(createdNotifications, []);
});
