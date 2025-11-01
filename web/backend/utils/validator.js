exports.sanitizeInput = (input) => {
    if (typeof input === 'string') {
        return input.trim().replace(/[<>]/g, '');
    }
    return input;
};

exports.validateCCCD = (cccd) => {
    if (!cccd || typeof cccd !== 'string') return false;
    return /^\d{9,13}$/.test(cccd);
};

exports.validatePhone = (phone) => {
    if (!phone || typeof phone !== 'string') return false;
    return /^0\d{9,10}$/.test(phone);
};

exports.validateDate = (date) => {
    if (!date) return false;
    const regex = /^\d{4}-\d{2}-\d{2}$/;
    if (!regex.test(date)) return false;
    const d = new Date(date);
    return d instanceof Date && !isNaN(d);
};