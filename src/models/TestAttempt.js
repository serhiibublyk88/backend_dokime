// src/models/TestAttempt
const mongoose = require("mongoose");

const TestAttemptSchema = new mongoose.Schema({
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
  maximumMarks: {
    type: Number,
    default: 0,
  },
  timeLimit: {
    type: Number,
    required: true,
  },
  startedAt: {
    type: Date,
    required: true,
  },
  finishedAt: {
    type: Date,
  },
  timeTaken: {
    type: Number,
  },
  percentageScore: {
    type: Number,
    default: 0,
  },
  isCompleted: {
    type: Boolean,
    default: false,
  },
  answers: [
    {
      questionId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Question",
        required: true,
      },
      answer: {
        type: mongoose.Mixed,
        required: true,
      },
      isCorrect: {
        type: Boolean,
        default: false,
      },
      score: {
        type: Number,
        default: 0,
      },
    },
  ],
  totalScore: {
    type: Number,
    default: 0,
  },
});

const TestAttempt = mongoose.model("TestAttempt", TestAttemptSchema);

module.exports = TestAttempt;