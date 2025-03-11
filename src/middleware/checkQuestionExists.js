//src/middleware/checkQuestionExists.js

const mongoose = require("mongoose");
const Question = require("../models/Question");

async function checkQuestionExists(req, res, next) {
  const { questionId } = req.params;

  if (!mongoose.Types.ObjectId.isValid(questionId)) {
    return res.status(400).json({ message: "Invalid question ID format" });
  }

  try {
    const question = await Question.findById(questionId);

    if (!question) {
      console.log(`Question not found: ${questionId}`);
      return res.status(404).json({ message: "Question not found" });
    }

    req.question = question;
    next();
  } catch (error) {
    console.error("Error while checking if question exists:", error.message);
    next(error);
  }
}

module.exports = checkQuestionExists;
