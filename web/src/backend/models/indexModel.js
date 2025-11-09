// Export all models from a single file for easier imports
const User = require('./UserModel');
const Doctor = require('./DoctorModel');
const Patient = require('./PatientModel');
const Room = require('./RoomModel');
const Note = require('./NoteModel');

module.exports = {
  User,
  Doctor,
  Patient,
  Room,
  Note
};
