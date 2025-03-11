// src/hooks/initializeAnswers
const QUESTION_TYPES = require("../constants/questionTypes");

function initializeDefaultAnswers(question) {
  if (!question) {
    throw new Error("Invalid question object.");
  }

  if (
    question.isDefaultInitialized &&
    question.answers &&
    question.answers.length
  ) {
    console.log("Answers are already initialized.");
    return;
  }

  const { questionType } = question;
  const defaultAnswers = [];

  try {
    switch (questionType) {
      case QUESTION_TYPES.SINGLE_CHOICE:
        for (let i = 0; i < 4; i++) {
          defaultAnswers.push({
            text: `Answer ${i + 1}`,
            score: i === 0 ? 1 : 0,
            isCorrect: i === 0,
          });
        }
        break;

      case QUESTION_TYPES.MULTIPLE_CHOICE:
        for (let i = 0; i < 4; i++) {
          defaultAnswers.push({
            text: `Answer ${i + 1}`,
            score: i < 2 ? 1 : 0,
            isCorrect: i < 2,
          });
        }
        break;

      case QUESTION_TYPES.NUMBER_INPUT:
        defaultAnswers.push({
          text: "Correct Number",
          score: 1,
          isCorrect: true,
        });
        break;

      case QUESTION_TYPES.TEXT_INPUT:
        defaultAnswers.push({
          text: "Correct Text",
          score: 1,
          isCorrect: true,
        });
        question.percentageError = 0;
        break;

      default:
        throw new Error(`Unsupported question type: ${questionType}`);
    }

    question.answers = defaultAnswers;
    question.isDefaultInitialized = true;
  } catch (error) {
    console.error("Error during default answers initialization:", error);
    throw error;
  }
}

module.exports = {
  initializeDefaultAnswers,
};
