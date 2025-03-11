// utils/scoreUtils
const QUESTION_TYPES = require("../constants/questionTypes");
const stringSimilarity = require("string-similarity");

const calculateTextSimilarity = (input, correct) =>
  stringSimilarity.compareTwoStrings(
    input.trim().toLowerCase(),
    correct.trim().toLowerCase()
  );

const calculateTotalScore = (question, userAnswer) => {
  let isCorrect = false,
    score = 0;

  const correctAnswers = question.answers
    .filter((ans) => ans.isCorrect)
    .map((ans) => ans._id.toString());

  const userAnswers = Array.isArray(userAnswer)
    ? userAnswer.map((id) => id.toString())
    : [];

  switch (question.questionType) {
    case QUESTION_TYPES.SINGLE_CHOICE: {
      const selectedAnswer = userAnswers[0];
      if (selectedAnswer && correctAnswers.includes(selectedAnswer)) {
        const correctAnswer = question.answers.find(
          (ans) => ans._id.toString() === selectedAnswer
        );
        score = correctAnswer?.score || 0;
        isCorrect = true;
      }
      break;
    }
    case QUESTION_TYPES.MULTIPLE_CHOICE: {
      score = userAnswers.reduce(
        (total, id) =>
          correctAnswers.includes(id)
            ? total +
              (question.answers.find((ans) => ans._id.toString() === id)
                ?.score || 0)
            : total,
        0
      );
      isCorrect = userAnswers.every((id) => correctAnswers.includes(id));
      break;
    }
    case QUESTION_TYPES.NUMBER_INPUT: {
      if (typeof userAnswer === "number") {
        const correctAnswer = question.answers.find((ans) => ans.isCorrect);
        if (Number(correctAnswer?.text) === userAnswer) {
          isCorrect = true;
          score = correctAnswer?.score || 0;
        }
      }
      break;
    }
    case QUESTION_TYPES.TEXT_INPUT: {
      if (typeof userAnswer === "string") {
        const correctAnswer = question.answers.find((ans) => ans.isCorrect);
        const similarity = calculateTextSimilarity(
          userAnswer,
          correctAnswer?.text || ""
        );
        isCorrect = similarity >= 1 - (question.percentageError || 0) / 100;
        score = isCorrect ? correctAnswer?.score || 0 : 0;
      }
      break;
    }
    default:
      break;
  }

  return { isCorrect, score };
};

const calculateGrade = (correctAnswers, totalQuestions, minimumScores) => {
  const percentage = (correctAnswers / totalQuestions) * 100;

  const grades =
    minimumScores instanceof Map
      ? Array.from(minimumScores.entries())
      : Object.entries(minimumScores || {});

  if (!grades.length) throw new Error("No grade thresholds defined.");

  grades.sort(([, a], [, b]) => b - a);

  for (const [grade, minScore] of grades) {
    if (percentage >= minScore) return grade;
  }

  return grades[grades.length - 1][0];
};

module.exports = { calculateTotalScore, calculateGrade };
