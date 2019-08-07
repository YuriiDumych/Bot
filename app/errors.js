///// Error helper class /////
const logger = require('../utils/logger');

class ErrorHelpers {
  dbError(error) {
    logger.info(error);
    return `Error occurred while processing your request!\nERROR ${error.code} ${error.errmsg}`;
  }
  // BestBuy error helper
  bestBuyError(error) {
    logger.info(error);
    return `Error occurred while processing your request\nERROR ${error.status} ${error.statusText}`;
  }
}

module.exports = ErrorHelpers;
