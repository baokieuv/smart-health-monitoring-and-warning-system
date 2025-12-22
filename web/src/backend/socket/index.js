const socketIo = require('socket.io');
const jwt = require('jsonwebtoken');

let io = null;

/**
 * Initialize Socket.io
 * @param {Object} server - HTTP server instance
 */
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
                console.error('❌ No token provided');
                return next(new Error('Authentication error: No token provided'));
            }

            console.log('🔑 JWT_SECRET exists:', !!process.env.JWT_ACCESS_SECRET);
            
            // Verify JWT token (use same secret as auth service)
            const jwtSecret = process.env.JWT_ACCESS_SECRET || 'secret_access';
            jwt.verify(token, jwtSecret, (err, decoded) => {
                if (err) {
                    console.error('❌ JWT verification failed:', err.message);
                    return next(new Error('Authentication error: Invalid token'));
                }

                // Attach user info to socket
                socket.userId = decoded.id;
                socket.userRole = decoded.role;
                
                console.log(`✅ Socket authenticated: User ${socket.userId} (${socket.userRole})`);
                next();
            });
        } catch (error) {
            console.error('❌ Socket authentication error:', error);
            next(new Error('Authentication error'));
        }
    });

    // Connection handling
    io.on('connection', (socket) => {
        const userId = socket.userId;
        const userRole = socket.userRole;

        console.log(`✅ Socket connected: User ${userId} (${userRole})`);

        // Join user-specific room
        const userRoom = `${userRole}:${userId}`;
        socket.join(userRoom);
        console.log(`User ${userId} joined room: ${userRoom}`);

        // Handle client acknowledgment
        socket.on('acknowledge-alarm', (data) => {
            console.log(`Alarm acknowledged by user ${userId}:`, data);
        });

        // Handle disconnection
        socket.on('disconnect', (reason) => {
            console.log(`❌ Socket disconnected: User ${userId} - Reason: ${reason}`);
        });

        // Handle errors
        socket.on('error', (error) => {
            console.error(`Socket error for user ${userId}:`, error);
        });

        // Send welcome message
        socket.emit('connected', {
            message: 'Connected to notification server',
            userId: userId,
            role: userRole
        });
    });

    console.log('🔌 Socket.io initialized successfully');
    return io;
}

/**
 * Get Socket.io instance
 */
function getIO() {
    if (!io) {
        throw new Error('Socket.io not initialized. Call initSocket first.');
    }
    return io;
}

/**
 * Emit alarm notification to specific doctor
 */
function emitAlarmToDoctor(doctorUserId, alarmData) {
    if (!io) {
        console.error('Socket.io not initialized');
        return;
    }

    const room = `doctor:${doctorUserId}`;
    io.to(room).emit('alarm-notification', alarmData);
    console.log(`📢 Alarm notification sent to room: ${room}`);
}

module.exports = {
    initSocket,
    getIO,
    emitAlarmToDoctor
};
