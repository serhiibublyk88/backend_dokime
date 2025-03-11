// src/hooks/answerHooks
const mongoose = require("mongoose");
const Test = require("../models/Test");
const QUESTION_TYPES = require("../constants/questionTypes");

let isProcessing = false;

async function calculateScore(doc, question) {
  try {
    const validAnswers = question.answers.filter((a) => a.score > 0);
    return validAnswers.length &&
      validAnswers.some((ca) => ca.text === doc.text)
      ? validAnswers[0].score
      : 0;
  } catch (error) {
    return 0;
  }
}

async function adjustMaximumMarks(testId, scoreDelta, operationType) {
  try {
    const test = await Test.findById(testId);

    if (!test) return;

    const newMarks =
      operationType === "add"
        ? (test.maximumMarks || 0) + scoreDelta
        : Math.max(0, (test.maximumMarks || 0) - scoreDelta);

    await Test.findByIdAndUpdate(
      testId,
      { maximumMarks: newMarks },
      { new: true }
    );
  } catch (error) {}
}

async function recalculateTotalMaximumMarks(testId) {
  try {
    const Question = mongoose.model("Question");
    const questions = await Question.find({ testId }).populate("answers");

    const totalScore = questions.reduce((sum, question) => {
      const questionScores = question.answers.filter((a) => a.score > 0);
      return (
        sum +
        questionScores.reduce((innerSum, answer) => innerSum + answer.score, 0)
      );
    }, 0);

    await Test.findByIdAndUpdate(
      testId,
      { maximumMarks: totalScore },
      { new: true }
    );
  } catch (error) {}
}

async function onSave(doc, next) {
  try {
    if (isProcessing) return next();

    isProcessing = true;

    const Question = mongoose.model("Question");
    const question = await Question.findOne({
      "answers._id": doc._id,
    }).populate("answers");

    if (!question || question.isDefaultInitialized) return next();

    await updateIsCorrect(question);
    await recalculateTotalMaximumMarks(question.testId);

    next();
  } catch (error) {
    next(error);
  } finally {
    isProcessing = false;
  }
}

async function onRemove(doc, next) {
  try {
    const Question = mongoose.model("Question");
    const question = await Question.findOne({
      "answers._id": doc._id,
    }).populate("answers");

    if (!question) {
      return next(new Error(`No question found for answer ${doc._id}`));
    }

    const score = await calculateScore(doc, question);

    if (score) {
      await adjustMaximumMarks(question.testId, score, "subtract");
    }

    await recalculateTotalMaximumMarks(question.testId);

    next();
  } catch (error) {
    next(error);
  }
}

async function updateIsCorrect(question) {
  if (!Array.isArray(question.answers) || question.answers.length === 0) {
    return;
  }

  const changesRequired = question.answers.some(
    (ans) => ans.isCorrect !== ans.score > 0
  );

  if (!changesRequired) return;

  try {
    question.answers = question.answers.map((ans) => ({
      ...ans.toObject(),
      isCorrect: ans.score > 0,
    }));

    await question.save({ validateBeforeSave: false });
  } catch (error) {}
}

module.exports = {
  recalculateTotalMaximumMarks,
  onSave,
  onRemove,
  updateIsCorrect,
};
