// src/controllers/questionController.js
const Question = require("../models/Question");
const Test = require("../models/Test");
const { validateQuestionHook } = require("../hooks/questionValidation");
const { initializeDefaultAnswers } = require("../hooks/initializeAnswers");
const { recalculateTotalMaximumMarks } = require("../hooks/answerHooks");
const {
  mapCreateQuestionRequest,
  mapFromDBModel,
} = require("../helpers/questionMapper");
const { uploadImage } = require("../utils/imageService");
const path = require("path");
const QUESTION_TYPES = require("../constants/questionTypes");

// Создание нового вопроса
async function createQuestion(req, res, next) {
  try {
    const testId = req.params.testId;
    const questionData = mapCreateQuestionRequest(req.body);

    initializeDefaultAnswers(questionData);

    if (!questionData.questionType) {
      return res.status(400).json({ error: "questionType is required." });
    }

    const test = await Test.findById(testId);
    if (!test) {
      return res.status(404).json({ message: "Test not found." });
    }

    await validateQuestionHook(questionData);

    if (req.body.imageUrl) {
      try {
        const imagePath = path.join(
          process.cwd(),
          "uploads",
          req.body.imageUrl
        );
        questionData.imageUrl = await uploadImage(imagePath);
      } catch (error) {
        return res.status(500).json({ message: "Failed to upload image." });
      }
    }

    const newQuestion = new Question({ ...questionData, testId: test._id });
    const savedQuestion = await newQuestion.save();

    test.questions.push(savedQuestion._id);
    await test.save();

    const { recalculateTotalMaximumMarks } = require("../hooks/answerHooks");
    await recalculateTotalMaximumMarks(test._id);

    res.status(201).json({
      message: "Question created successfully.",
      data: mapFromDBModel(savedQuestion),
    });
  } catch (error) {
    next(error);
  }
}

// Получение всех вопросов для теста
async function getQuestions(req, res, next) {
  try {
    const testId = req.params.testId;
    const questions = await Question.find({ testId }).lean();

    res.status(200).json({
      data: questions.map(mapFromDBModel),
    });
  } catch (error) {
    next(error);
  }
}

// Обновление вопроса
async function updateQuestion(req, res, next) {
  try {
    const { questionId } = req.params;
    const updatedData = req.body;

    const question = await Question.findById(questionId);
    if (!question) {
      return res.status(404).json({ message: "Question not found." });
    }

    const allowedUpdates = ["questionText", "imageUrl", "percentageError"];

    const updates = Object.keys(updatedData);

    const isValidUpdate = updates.every((update) =>
      allowedUpdates.includes(update)
    );

    if (!isValidUpdate) {
      return res.status(400).json({
        error: `You can only update ${allowedUpdates.join(", ")} fields.`,
      });
    }

    if (
      question.questionType === QUESTION_TYPES.TEXT_INPUT &&
      updatedData.percentageError !== undefined
    ) {
      if (
        updatedData.percentageError < 0 ||
        updatedData.percentageError > 100
      ) {
        return res.status(400).json({
          error: "percentageError must be between 0 and 100.",
        });
      }
    }

    Object.assign(question, updatedData);

    if (updatedData.imageUrl) {
      const imagePath = path.join(
        process.cwd(),
        "uploads",
        updatedData.imageUrl
      );
      question.imageUrl = await uploadImage(imagePath);
    }

    const updatedQuestion = await question.save();

    res.status(200).json({
      message: "Question updated successfully.",
      data: mapFromDBModel(updatedQuestion),
    });
  } catch (error) {
    next(error);
  }
}

/// Удаление вопроса
async function deleteQuestion(req, res, next) {
  try {
    const { questionId } = req.params;

    const question = await Question.findById(questionId);
    if (!question) {
      return res.status(404).json({ message: "Question not found." });
    }

    await question.deleteOne();

    const test = await Test.findById(question.testId);
    if (test) {
      а;
      test.questions.pull(question._id);
      await test.save();

      await recalculateTotalMaximumMarks(test._id);
    }

    res.status(200).json({
      message: "Question deleted successfully.",
    });
  } catch (error) {
    console.error("Error deleting question:", error);
    next(error);
  }
}

module.exports = {
  createQuestion,
  getQuestions,
  updateQuestion,
  deleteQuestion,
};
