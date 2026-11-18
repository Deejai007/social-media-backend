const { after, test } = require("node:test");
const assert = require("node:assert/strict");

const modelsPath = require.resolve("../models");
const originalModelsModule = require.cache[modelsPath];
let listQuery;
let updateQuery;
const models = {
  Notification: {
    findAll: async (query) => {
      listQuery = query;
      return [{ id: 4 }];
    },
    update: async (values, query) => {
      updateQuery = { values, query };
      return [1];
    },
  },
  Post: {},
  User: {},
};

require.cache[modelsPath] = {
  id: modelsPath,
  filename: modelsPath,
  loaded: true,
  exports: models,
};

const notificationController = require("../controllers/notificationController");

after(() => {
  if (originalModelsModule) {
    require.cache[modelsPath] = originalModelsModule;
  } else {
    delete require.cache[modelsPath];
  }
});

test("notifications are scoped to the signed-in user and include actors and posts", async () => {
  const response = {
    body: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(body) {
      this.body = body;
      return this;
    },
  };
  await notificationController.getNotifications(
    { user: { id: 7 } },
    response,
    assert.fail,
  );

  assert.deepEqual(listQuery.where, { userId: 7 });
  assert.deepEqual(
    listQuery.include.map(({ as }) => as),
    ["actor", "post"],
  );
  assert.equal(response.body.data[0].id, 4);
});

test("marking a notification read only updates the current user's notification", async () => {
  const response = {
    body: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(body) {
      this.body = body;
      return this;
    },
  };
  await notificationController.markNotificationRead(
    { params: { notificationId: "4" }, user: { id: 7 } },
    response,
    assert.fail,
  );

  assert.deepEqual(updateQuery, {
    values: { isRead: true },
    query: { where: { id: "4", userId: 7 } },
  });
  assert.equal(response.body.success, true);
});
