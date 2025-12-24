const AppError = require('./AppError');

class UnauthorizedError extends AppError {
    constructor(message = 'Unauthorized access') {
        super(message, 401);
    }
}

module.exports = UnauthorizedError;