// logger.js
const tracer = require("tracer");

const logger = tracer.console({
  format: "<{{title}}> [{{file}}:{{line}}] {{message}}",

  preprocess: function (data) {
    // You can preprocess data here if needed
  },
});

module.exports = logger;
