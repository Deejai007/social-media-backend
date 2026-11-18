const { after, beforeEach, test } = require("node:test");
const assert = require("node:assert/strict");

const modelsPath = require.resolve("../models");
const cloudinaryPath = require.resolve("../config/cloudinary");
const originalModelsModule = require.cache[modelsPath];
const originalCloudinaryModule = require.cache[cloudinaryPath];
let createdPost;
let cloudinaryUploadCalls;
const models = {
  Post: {
    vibeOptions: [{ label: "Vibin’" }, { label: "Lit" }],
    create: async (data) => {
      createdPost = data;
      return { id: 17 };
    },
  },
  User: {
    findByPk: async () => ({
      lastVibeDate: null,
      streakCount: 0,
      save: async () => {},
    }),
  },
};

require.cache[modelsPath] = {
  id: modelsPath,
  filename: modelsPath,
  loaded: true,
  exports: models,
};
require.cache[cloudinaryPath] = {
  id: cloudinaryPath,
  filename: cloudinaryPath,
  loaded: true,
  exports: {
    uploader: {
      upload: (...args) => {
        cloudinaryUploadCalls.push(args);
      },
    },
  },
};

const postController = require("../controllers/postController");

beforeEach(() => {
  createdPost = null;
  cloudinaryUploadCalls = [];
});

after(() => {
  if (originalModelsModule) {
    require.cache[modelsPath] = originalModelsModule;
  } else {
    delete require.cache[modelsPath];
  }
  if (originalCloudinaryModule) {
    require.cache[cloudinaryPath] = originalCloudinaryModule;
  } else {
    delete require.cache[cloudinaryPath];
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

test("creates a public text-only post with its required vibe", async () => {
  const response = createResponse();
  await postController.uploadPost(
    {
      user: { id: 5 },
      body: {
        caption: "A text-only post",
        location: "Home",
        vibe: "Vibin’",
        isPrivate: "true",
      },
      files: [],
    },
    response,
    assert.fail,
  );

  assert.deepEqual(createdPost, {
    userId: 5,
    caption: "A text-only post",
    location: "Home",
    media: null,
    isPrivate: false,
    vibeType: "Vibin’",
  });
  assert.deepEqual(cloudinaryUploadCalls, []);
  assert.equal(response.statusCode, 201);
  assert.equal(response.body.postId, 17);
});

test("rejects a post without a valid vibe", async () => {
  let error;
  await postController.uploadPost(
    {
      user: { id: 5 },
      body: { caption: "A post", vibe: "Not a vibe" },
      files: [],
    },
    createResponse(),
    (nextError) => {
      error = nextError;
    },
  );

  assert.equal(error.message, "Choose a valid vibe.");
  assert.equal(error.status, 400);
  assert.equal(createdPost, null);
});

test("requires a vibe even when the post has text content", async () => {
  let error;
  await postController.uploadPost(
    {
      user: { id: 5 },
      body: { caption: "A post without a vibe" },
      files: [],
    },
    createResponse(),
    (nextError) => {
      error = nextError;
    },
  );

  assert.equal(error.message, "Choose a valid vibe.");
  assert.equal(error.status, 400);
  assert.equal(createdPost, null);
});

test("rejects an empty text-only post", async () => {
  let error;
  await postController.uploadPost(
    {
      user: { id: 5 },
      body: { caption: "   ", vibe: "Vibin’" },
      files: [],
    },
    createResponse(),
    (nextError) => {
      error = nextError;
    },
  );

  assert.equal(error.message, "Add a photo or write something to share.");
  assert.equal(error.status, 400);
  assert.equal(createdPost, null);
});
