// src/hooks/questionValidation
const QUESTION_TYPES = require("../constants/questionTypes");


async function validateQuestionHook(doc) {
  switch (doc.questionType) {
    case QUESTION_TYPES.SINGLE_CHOICE:
      await validateSingleChoice(doc);
      break;

    case QUESTION_TYPES.MULTIPLE_CHOICE:
      await validateMultipleChoice(doc);
      break;

    case QUESTION_TYPES.NUMBER_INPUT:
      await validateNumberInput(doc);
      break;

    case QUESTION_TYPES.TEXT_INPUT:
      await validateTextInput(doc);
      break;

    default:
      throw new Error(`Unsupported question type: ${doc.questionType}`);
  }
}


async function validateSingleChoice(doc) {
  const nonEmptyAnswers = doc.answers.filter(
    (answer) => answer.text.trim().length > 0
  );

  if (nonEmptyAnswers.length < 1) {
    throw new Error("At least one answer must have valid text.");
  }

  const scoreCount = nonEmptyAnswers.filter(
    (answer) => answer.score > 0
  ).length;

  if (scoreCount !== 1) {
    throw new Error(
      "Only one answer can have a score greater than 0 in SINGLE_CHOICE."
    );
  }
}


async function validateMultipleChoice(doc) {
  
  const nonEmptyAnswers = doc.answers.filter(
    (answer) => answer.text.trim().length > 0
  );

  
  if (nonEmptyAnswers.length < 2) {
    throw new Error("At least two answers must have valid text.");
  }

  
  const scoreCount = nonEmptyAnswers.filter(
    (answer) => answer.score > 0
  ).length;

  if (scoreCount < 2) {
    throw new Error(
      "At least two answers must have score > 0 in MULTIPLE_CHOICE."
    );
  }
}


async function validateNumberInput(doc) {
  const validAnswers = doc.answers.filter(
    (answer) => answer.text.trim().length > 0 && answer.score > 0
  );

  if (validAnswers.length !== 1) {
    throw new Error(
      "There must be exactly one valid answer with score > 0 in NUMBER_INPUT."
    );
  }
}


async function validateTextInput(doc) {
  const validAnswers = doc.answers.filter(
    (answer) => answer.text.trim().length > 0 && answer.score > 0
  );

  if (validAnswers.length !== 1) {
    throw new Error(
      "There must be exactly one valid answer with score > 0 in TEXT_INPUT."
    );
  }

  if (doc.percentageError < 0 || doc.percentageError > 100) {
    throw new Error("Percentage error must be between 0 and 100.");
  }
}

module.exports = {
  validateQuestionHook,
};
