// src/models/Test.js
const mongoose = require("mongoose");

const testSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    timeLimit: {
      type: Number,
      required: true,
    },
    availableForGroups: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Group",
        required: true,
      },
    ],
    questions: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Question",
        required: false,
      },
    ],
    maximumMarks: {
      type: Number,
      default: 0,
    },
    status: {
      type: String,
      enum: ["active", "inactive"],
      default: "inactive",
    },
    minimumScores: {
      type: Map,
      of: Number,
      default: {
        1: 95, // Минимальный процент для оценки 1
        2: 80, // Минимальный процент для оценки 2
        3: 70, // Минимальный процент для оценки 3
        4: 50, // Минимальный процент для оценки 4
        5: 0, // Минимальный процент для оценки 5
      },
    },
  },
  { timestamps: true } //
);

const Test = mongoose.model("Test", testSchema);
module.exports = Test;
