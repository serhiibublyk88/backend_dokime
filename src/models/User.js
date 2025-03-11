// src/models/User.js
const mongoose = require("mongoose");
const { TEST_CREATOR, USER } = require("../constants/roles");

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    
  },
  password: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
    validate: {
      validator: (email) => /\S+@\S+\.\S+/.test(email),
      message: "Invalid email format",
    },
  },
  role: {
    type: Number,
    enum: [USER, TEST_CREATOR],
    default: USER,
  },
  group: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Group",
    default: null,
    validate: {
      validator: function (value) {
       
        return this.role !== USER || value !== null;
      },
      message: "Group is required for users",
    },
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const User = mongoose.model("User", userSchema);
module.exports = User;
