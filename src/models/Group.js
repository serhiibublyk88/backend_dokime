// src/models/Group.js
const mongoose = require("mongoose");

const groupSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
  },
  description: {
    type: String,
    default: "",
  },
  members: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User", // Пользователи, состоящие в группе
      required: true,
    },
  ],
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User", // Кто создал группу (администратор)
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const Group = mongoose.model("Group", groupSchema);

module.exports = Group;
