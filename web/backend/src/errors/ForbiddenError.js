const AppError = require('./AppError');

class ForbiddenError extends AppError {
    constructor(message = 'Access forbidden') {
        super(message, 403);
    }
}

module.exports = ForbiddenError;