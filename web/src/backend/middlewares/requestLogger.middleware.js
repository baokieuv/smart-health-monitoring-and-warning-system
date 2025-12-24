const morgan = require('morgan');
const logger = require('../utils/logger.util');

const stream = {
    write: (message) => logger.http(message.trim())
};

const requestLogger = morgan(
    ':remote-addr :method :url :status :res[content-length] - :response-time ms',
    { stream }
);

module.exports = requestLogger;