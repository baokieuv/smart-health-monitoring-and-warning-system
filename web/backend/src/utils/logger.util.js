const winston = require('winston');
const path = require('path');

const logFormat = winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.errors({ stack: true }),
    winston.format.splat(),
    winston.format.json()
);

const logger = winston.createLogger({
    level: process.env.LOG_LEVEL || 'info',
    format: logFormat,
    transports: [
        new winston.transports.File({ 
            filename: path.join('logs', 'error.log'), 
            level: 'error',
            maxsize: 5242880, // 5MB
            maxFiles: 5
        }),
        new winston.transports.File({ 
            filename: path.join('logs', 'combined.log'),
            maxsize: 5242880,
            maxFiles: 5
        })
    ],
    exceptionHandlers: [
        new winston.transports.File({ 
            filename: path.join('logs', 'exceptions.log') 
        })
    ],
    rejectionHandlers: [
        new winston.transports.File({ 
            filename: path.join('logs', 'rejections.log') 
        })
    ]
});

module.exports = logger;