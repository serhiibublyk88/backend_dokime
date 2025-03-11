// src/models/TestResultconst 
mongoose = require("mongoose");

const testResultSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  testId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Test",
    required: true,
  },
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  attemptId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "TestAttempt",
    required: true,
  },
  startTime: {
    type: Date,
    required: true,
  },
  finishTime: {
    type: Date,
    required: true,
  },
  timeTaken: {
    type: Number,
    required: true,
  },
  totalScore: {
    type: Number,
    required: true,
  },
  maximumMarks: {
    type: Number,
    required: true,
  },
  percentageScore: {
    type: Number,
    required: true,
  },
  grade: {
    type: String,
    required: true,
  },
  isCompleted: {
    type: Boolean,
    default: false,
  },
});
const TestResult = mongoose.model("TestResult", testResultSchema);
module.exports = TestResult;