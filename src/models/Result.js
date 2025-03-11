// src/models/Result.js
const mongoose = require("mongoose");

const resultSchema = new mongoose.Schema({
  test: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Test", 
    required: true,
  },
  testAuthor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User", 
    required: true,
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User", 
    required: true,
  },
  score: {
    type: Number, 
    required: true,
  },
  percentage: {
    type: Number, 
    required: true,
  },
  grade: {
    type: Number, 
    required: true,
  },
  timeTaken: {
    type: Number, 
    required: true,
  },
  completionDate: {
    type: Date, 
    default: Date.now,
  },
});

const Result = mongoose.model("Result", resultSchema);
module.exports = Result;
