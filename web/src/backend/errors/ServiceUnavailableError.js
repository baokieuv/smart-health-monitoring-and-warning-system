const AppError = require('./AppError');

class ServiceUnavailableError extends AppError {
    constructor(message = 'Service unavailable') {
        super(message, 503);
    }
}

module.exports = ServiceUnavailableError;