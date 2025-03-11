// src/mappers/questionMapper.js

const QUESTION_TYPES = require("../constants/questionTypes");

function mapCreateQuestionRequest(data) {
  if (!data.text || !data.type) {
    throw new Error("text and type are required.");
  }

  const mappedAnswers =
    data.answers?.map((answer) => ({
      text: answer.text || "",
      score: answer.score || 0,
      isCorrect: answer.score > 0,
    })) || [];

  const dbModel = {
    questionText: data.text,
    questionType: data.type,
    answers: mappedAnswers,
    isDefaultInitialized: false,
  };

  if (data.type === QUESTION_TYPES.TEXT_INPUT) {
    dbModel.percentageError = data.percentageError || 0;
  }

  return dbModel;
}

function mapFromDBModel(dbModel) {
  if (!dbModel) return null;

  const mappedResponse = {
    id: dbModel._id,
    questionText: dbModel.questionText,
    questionType: dbModel.questionType,
    answers: dbModel.answers.map((answer) => ({
      id: answer._id,
      text: answer.text,
      score: answer.score,
      isCorrect: answer.isCorrect,
    })),
  };

  if (dbModel.questionType === QUESTION_TYPES.TEXT_INPUT) {
    mappedResponse.percentageError = dbModel.percentageError || 0;
  }

  return mappedResponse;
}

function mapToDBModel(data) {
  const mappedAnswers =
    data.answers?.map((answer) => ({
      text: answer.text,
      score: answer.score,
      isCorrect: answer.score > 0,
    })) || [];

  const dbModel = {
    questionText: data.questionText,
    questionType: data.questionType,
    answers: mappedAnswers,
  };

  if (data.isDefaultInitialized) {
    dbModel.isDefaultInitialized = true;
  }

  if (data.questionType === QUESTION_TYPES.TEXT_INPUT) {
    dbModel.percentageError = data.percentageError || 0;
  }

  return dbModel;
}

module.exports = {
  mapCreateQuestionRequest,
  mapFromDBModel,
  mapToDBModel,
};
