const rateLimit = require('express-rate-limit');

const createRateLimiter = (windowMs = 15 * 60 * 1000, max = 100, message = 'Too many requests') => {
    return rateLimit({
        windowMs,
        max,
        message: {
            status: 'error',
            message
        },
        standardHeaders: true,
        legacyHeaders: false
    });
};

const authLimiter = createRateLimiter(
    15 * 60 * 1000, // 15 minutes
    100, // 5 attempts
    'Too many login attempts, please try again later'
);

const apiLimiter = createRateLimiter(
    15 * 60 * 1000, // 15 minutes
    100, // 100 requests
    'Too many requests from this IP, please try again later'
);

const strictLimiter = createRateLimiter(
    60 * 1000, // 1 minute
    10, // 10 requests
    'Rate limit exceeded'
);

module.exports = {
    createRateLimiter,
    authLimiter,
    apiLimiter,
    strictLimiter
};