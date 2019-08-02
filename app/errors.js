///// Error helper class /////
const logger = require('../utils/logger');

class ErrorHelpers {
  // BestBuy error helper
  bestBuyError(error) {
    logger.info(error);
    return `Error occurred while processing your request\nERROR ${error.status} ${error.statusText}`;
  }
}

module.exports = ErrorHelpers;
