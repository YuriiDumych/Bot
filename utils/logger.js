const winston = require("winston");

const { createLogger, format, transports } = winston;
const { combine, colorize, simple } = format;

const logger = createLogger({
  transports: [
    new transports.Console({
      format: combine(colorize(), simple())
    })
  ]
});

module.exports = logger;
