const mongoose = require('mongoose');

const attendeeSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Attendee name is required'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Attendee email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [
        /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
        'Please enter a valid email address',
      ],
    },
    phone: {
      type: String,
      trim: true,
      default: '',
    },
    role: {
      type: String,
      enum: {
        values: ['attendee', 'organizer', 'admin'],
        message: '{VALUE} is not a valid user role',
      },
      default: 'attendee',
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Attendee', attendeeSchema);
