// Export all models from a single file for easier imports
const User = require('./user.model');
const Doctor = require('./doctor.model');
const Patient = require('./patient.model');
const Room = require('./room.model');
const Note = require('./note.model');

module.exports = {
  User,
  Doctor,
  Patient,
  Room,
  Note
};
