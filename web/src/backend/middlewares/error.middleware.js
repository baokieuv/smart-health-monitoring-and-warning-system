const logger = require('../utils/logger.util');
const { AppError } = require('../errors');

const errorHandler = (err, req, res, next) => {
    let error = { ...err };
    error.message = err.message;
    error.stack = err.stack;

    logger.error({
        message: err.message,
        stack: err.stack,
        url: req.originalUrl,
        method: req.method,
        ip: req.ip,
        userId: req.user?.id
    });

    // Mongoose bad ObjectId
    if (err.name === 'CastError') {
        error = new AppError('Invalid resource ID', 400);
    }

    // Mongoose duplicate key
    if (err.code === 11000) {
        const field = Object.keys(err.keyValue)[0];
        error = new AppError(`Duplicate value for field: ${field}`, 409);
    }

    // Mongoose validation error
    if (err.name === 'ValidationError') {
        const errors = Object.values(err.errors).map(e => ({
            field: e.path,
            message: e.message
        }));
        error = new AppError('Validation failed', 400);
        error.errors = errors;
    }

    // JWT errors
    if (err.name === 'JsonWebTokenError') {
        error = new AppError('Invalid token', 401);
    }

    if (err.name === 'TokenExpiredError') {
        error = new AppError('Token expired', 401);
    }

    // Send response
    const statusCode = error.statusCode || 500;
    const response = {
        status: error.status || 'error',
        message: error.message || 'Internal server error'
    };

    if (error.errors) {
        response.errors = error.errors;
    }

    // Include stack trace in development
    if (process.env.NODE_ENV === 'development') {
        response.stack = error.stack;
    }

    res.status(statusCode).json(response);
};

const notFoundHandler = (req, res, next) => {
    const error = new AppError(`Route ${req.originalUrl} not found`, 404);
    next(error);
};

module.exports = {
    errorHandler,
    notFoundHandler
};