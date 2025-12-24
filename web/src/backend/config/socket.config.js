const socketIo = require('socket.io');
const jwt = require('jsonwebtoken');
const logger = require('../utils/logger.util');

let io = null;

function initSocket(server) {
    io = socketIo(server, {
        cors: {
            origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
            methods: ['GET', 'POST'],
            credentials: true,
            allowedHeaders: ['Authorization']
        },
        path: '/socket.io',
        transports: ['polling', 'websocket'],
        allowEIO3: true,
        pingTimeout: 60000,
        pingInterval: 25000
    });

    // Authentication middleware
    io.use((socket, next) => {
        try {
            const token = socket.handshake.auth.token;
            
            if (!token) {
                return next(new Error('Authentication error: No token provided'));
            }

            const jwtSecret = process.env.JWT_ACCESS_SECRET || 'secret_access';
            jwt.verify(token, jwtSecret, (err, decoded) => {
                if (err) {
                    return next(new Error('Authentication error: Invalid token'));
                }

                socket.userId = decoded.id;
                socket.userRole = decoded.role;
                next();
            });
        } catch (error) {
            next(new Error('Authentication error'));
        }
    });

    // Connection handling
    io.on('connection', (socket) => {
        const { userId, userRole } = socket;
        logger.info(`Socket connected: User ${userId} (${userRole})`);

        const userRoom = `${userRole}:${userId}`;
        socket.join(userRoom);

        socket.on('acknowledge-alarm', (data) => {
            logger.info(`Alarm acknowledged by user ${userId}:`, data);
        });

        socket.on('disconnect', (reason) => {
            logger.info(`Socket disconnected: User ${userId} - Reason: ${reason}`);
        });

        socket.on('error', (error) => {
            logger.error(`Socket error for user ${userId}:`, error);
        });

        socket.emit('connected', {
            message: 'Connected to notification server',
            userId,
            role: userRole
        });
    });

    logger.info('Socket.io initialized successfully');
    return io;
}

function getIO() {
    if (!io) {
        throw new Error('Socket.io not initialized');
    }
    return io;
}

function emitAlarmToDoctor(doctorUserId, alarmData) {
    if (!io) {
        logger.error('Socket.io not initialized');
        return;
    }

    const room = `doctor:${doctorUserId}`;
    io.to(room).emit('alarm-notification', alarmData);
    logger.info(`Alarm notification sent to room: ${room}`);
}

module.exports = {
    initSocket,
    getIO,
    emitAlarmToDoctor
};