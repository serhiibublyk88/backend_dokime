// src/models/Question.js
const mongoose = require("mongoose");
const QUESTION_TYPES = require("../constants/questionTypes");
const { onSave, onRemove, updateIsCorrect } = require("../hooks/answerHooks");

// Схема для встроенных ответов
const answerSchema = new mongoose.Schema(
  {
    text: {
      type: String,
      required: true,
    }, 
    score: {
      type: Number,
      default: 0,
    },
    isCorrect: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

answerSchema.post("save", async function (doc, next) {
  try {
    await onSave(doc, next);
  } catch (error) {
    console.error("Error during answer save hook:", error);
    next(error);
  }
});

answerSchema.post("remove", async function (doc, next) {
  try {
    await onRemove(doc, next);
  } catch (error) {
    console.error("Error during answer remove hook:", error);
    next(error);
  }
});

// Схема для вопросов
const questionSchema = new mongoose.Schema(
  {
    questionText: {
      type: String,
      required: true,
    },
    imageUrl: {
      type: String,
      default: null,
    },
    questionType: {
      type: String,
      enum: Object.values(QUESTION_TYPES),
      required: true,
    },
    answers: {
      type: [answerSchema],
      default: [],
    },
    percentageError: {
      type: Number,
      default: undefined,
      validate: {
        validator: function (value) {
          return this.questionType === QUESTION_TYPES.TEXT_INPUT
            ? value >= 0 && value <= 100
            : value === undefined;
        },
        message:
          "Percentage error must be between 0 and 100, only for TEXT_INPUT type.",
      },
    },
    testId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Test",
      required: true,
      index: true,
    },
  },
  { timestamps: true }
);

const Question = mongoose.model("Question", questionSchema);
module.exports = Question;
