// utils/scoreUtils.js

const QUESTION_TYPES = require("../constants/questionTypes");
const stringSimilarity = require("string-similarity");

// Сравнение строк с учетом регистра, пробелов и допуска ошибок
const calculateTextSimilarity = (input, correct) =>
  stringSimilarity.compareTwoStrings(
    input.trim().toLowerCase(),
    correct.trim().toLowerCase()
  );

// Основная функция подсчета баллов за вопрос
const calculateTotalScore = (question, userAnswer) => {
  let isCorrect = false;
  let score = 0;

  const correctAnswers = question.answers
    .filter((ans) => ans.isCorrect)
    .map((ans) => ans._id.toString());

  const userAnswers = Array.isArray(userAnswer)
    ? userAnswer.map((id) => id.toString())
    : [];

  switch (question.questionType) {
    case QUESTION_TYPES.SINGLE_CHOICE: {
      const selected = Array.isArray(userAnswer) ? userAnswer[0] : userAnswer;
      if (selected && correctAnswers.includes(selected)) {
        const correct = question.answers.find(
          (ans) => ans._id.toString() === selected
        );
        score = correct?.score || 0;
        isCorrect = true;
      }
      break;
    }

    case QUESTION_TYPES.MULTIPLE_CHOICE: {
      const uniqueUserAnswers = [...new Set(userAnswers)];
      const isAllCorrect =
        uniqueUserAnswers.every((id) => correctAnswers.includes(id)) &&
        correctAnswers.length === uniqueUserAnswers.length;

      score = uniqueUserAnswers.reduce((total, id) => {
        const ans = question.answers.find(
          (a) => a._id.toString() === id && a.isCorrect
        );
        return total + (ans?.score || 0);
      }, 0);

      isCorrect = isAllCorrect;
      break;
    }

    case QUESTION_TYPES.NUMBER_INPUT: {
      const input = parseFloat(userAnswer);
      const correct = question.answers.find((ans) => ans.isCorrect);
      const correctValue = parseFloat(correct?.text);
      if (!isNaN(input) && !isNaN(correctValue) && input === correctValue) {
        isCorrect = true;
        score = correct?.score || 0;
      }
      break;
    }

    case QUESTION_TYPES.TEXT_INPUT: {
      if (typeof userAnswer === "string") {
        const correct = question.answers.find((ans) => ans.isCorrect);
        const similarity = calculateTextSimilarity(
          userAnswer,
          correct?.text || ""
        );
        const allowedError = question.percentageError || 0;
        isCorrect = similarity >= 1 - allowedError / 100;
        score = isCorrect ? correct?.score || 0 : 0;
      }
      break;
    }

    default:
      break;
  }

  return { isCorrect, score };
};

// Подсчет итоговой оценки по проценту прохождения
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

module.exports = {
  calculateTotalScore,
  calculateGrade,
};
