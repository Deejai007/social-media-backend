const { after, beforeEach, test } = require("node:test");
const assert = require("node:assert/strict");
const { Op } = require("sequelize");

const modelsPath = require.resolve("../models");
const originalModelsModule = require.cache[modelsPath];
const models = {
  Follow: { findAll: async () => [] },
  Like: {},
  Post: { findAll: async () => [] },
  User: {},
};

require.cache[modelsPath] = {
  id: modelsPath,
  filename: modelsPath,
  loaded: true,
  exports: models,
};

const postController = require("../controllers/postController");
let response;
let postQuery;
let followQuery;

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
  postQuery = null;
  followQuery = null;
});

after(() => {
  if (originalModelsModule) {
    require.cache[modelsPath] = originalModelsModule;
  } else {
    delete require.cache[modelsPath];
  }
});

test("feed contains own and accepted-following posts and reports pagination", async () => {
  models.Follow.findAll = async (query) => {
    followQuery = query;
    return [{ followingId: 12 }];
  };
  models.Post.findAll = async (query) => {
    postQuery = query;
    return [
      {
        toJSON: () => ({
          id: 8,
          userId: 12,
          isPrivate: true,
          likeCount: 3,
          post: { username: "followed", profileImage: "avatar.png" },
          likes: [{ id: 4 }],
        }),
      },
      { toJSON: () => ({ id: 7 }) },
    ];
  };

  await postController.getFeed(
    { user: { id: 5 }, query: { limit: "1", offset: "4" } },
    response,
    assert.fail,
  );

  assert.equal(response.statusCode, 200);
  assert.deepEqual(followQuery.where, { followerId: 5, status: "accepted" });
  assert.deepEqual(postQuery.where.userId[Op.in], [5, 12]);
  assert.equal(postQuery.limit, 2);
  assert.equal(postQuery.offset, 4);
  assert.deepEqual(postQuery.order, [
    ["createdAt", "DESC"],
    ["id", "DESC"],
  ]);
  assert.equal(response.body.hasMore, true);
  assert.deepEqual(response.body.data[0], {
    id: 8,
    userId: 12,
    isPrivate: true,
    likeCount: 3,
    username: "followed",
    profileImage: "avatar.png",
    isLikedByUser: true,
  });
});

test("feed caps page size and normalizes a negative offset", async () => {
  models.Follow.findAll = async () => [];
  models.Post.findAll = async (query) => {
    postQuery = query;
    return [];
  };

  await postController.getFeed(
    { user: { id: 5 }, query: { limit: "100", offset: "-1" } },
    response,
    assert.fail,
  );

  assert.deepEqual(postQuery.where.userId[Op.in], [5]);
  assert.equal(postQuery.limit, 51);
  assert.equal(postQuery.offset, 0);
  assert.equal(response.body.hasMore, false);
  assert.deepEqual(response.body.data, []);
});
