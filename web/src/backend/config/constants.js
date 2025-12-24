module.exports = {
    ROLES: {
        ADMIN: 'admin',
        DOCTOR: 'doctor',
        PATIENT: 'patient'
    },

    THINGSBOARD: {
        URL: process.env.THINGSBOARD_URL || 'http://localhost:8080',
        ADMIN: {
            USERNAME: 'sysadmin@thingsboard.org',
            PASSWORD: 'sysadmin'
        },
        TENANT: {
            USERNAME: 'tenant@thingsboard.org',
            PASSWORD: 'tenant'
        }
    },

    PAGINATION: {
        DEFAULT_PAGE: 1,
        DEFAULT_LIMIT: 10,
        MAX_LIMIT: 100
    },

    ALARM_SEVERITY: {
        CRITICAL: 'CRITICAL',
        WARNING: 'WARNING',
        INFO: 'INFO'
    },

    DEVICE_KEYS: {
        TELEMETRY: ['heart_rate', 'SpO2', 'temperature', 'alarm'],
        ATTRIBUTES: ['patient', 'doctor']
    },

    CCCD_LENGTH: 12,

    PASSWORD_SALT_ROUNDS: 10,

    FILE_UPLOAD: {
        MAX_SIZE: 5 * 1024 * 1024, // 5MB
        ALLOWED_TYPES: ['image/jpeg', 'image/jpg', 'image/png']
    }
};