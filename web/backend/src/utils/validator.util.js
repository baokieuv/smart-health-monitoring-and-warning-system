const validator = {
    sanitizeInput: (input) => {
        if (typeof input === 'string') {
            return input.trim().replace(/[<>]/g, '');
        }
        return input;
    },

    validateCCCD: (cccd) => {
        if (!cccd || typeof cccd !== 'string') return false;
        return /^\d{9,13}$/.test(cccd);
    },

    validatePhone: (phone) => {
        if (!phone || typeof phone !== 'string') return false;
        return /^0\d{9,10}$/.test(phone);
    },

    validateDate: (date) => {
        if (!date) return false;
        const regex = /^\d{4}-\d{2}-\d{2}$/;
        if (!regex.test(date)) return false;
        const d = new Date(date);
        return d instanceof Date && !isNaN(d);
    },

    validateEmail: (email) => {
        if (!email || typeof email !== 'string') return false;
        const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return regex.test(email);
    },

    normalizeUsername: (username) => {
        if (!username) return '';
        return username.toLowerCase().trim();
    },

    normalizeCCCD: (cccd, length = 12) => {
        if (!cccd) return null;
        return String(cccd).padStart(length, '0');
    }
};

module.exports = validator;