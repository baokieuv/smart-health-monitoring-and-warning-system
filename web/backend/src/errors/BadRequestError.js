const AppError = require('./AppError');

class BadRequestError extends AppError {
    constructor(message = 'Bad request') {
        super(message, 400);
    }
}

module.exports = BadRequestError;