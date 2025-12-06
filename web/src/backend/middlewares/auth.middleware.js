const { verifyAccessToken } = require('../utils/token');

exports.authenticate = (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({
                status: 'error',
                message: 'Authentication required.'
            });
        }

        const token = authHeader.slice(7);
        const payload = verifyAccessToken(token);
        req.user = {
            id: payload.id,
            username: payload.username,
            role: payload.role
        };
        return next();
    } catch (error) {
        const status = error.name === 'TokenExpiredError' || error.name === 'JsonWebTokenError' ? 401 : 500;
        return res.status(status).json({
            status: 'error',
            message: status === 401 ? 'Authentication required.' : 'Unexpected error occurred.'
        });
    }
};

exports.authorizeRoles = (...roles) => (req, res, next) => {
    console.log('Authorization check - User role:', req.user?.role, 'Required roles:', roles);
    if (!req.user || !roles.includes(req.user.role)) {
        console.log('Authorization failed - Access denied');
        return res.status(403).json({
            status: 'error',
            message: 'Permission denied.'
        });
    }
    return next();
};