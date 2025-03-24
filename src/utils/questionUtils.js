// src/utils/questionUtils.js
const QUESTION_TYPES = require("../constants/questionTypes");


function convertFrontendTypeToBackend(frontType) {
  switch (frontType) {
    case "single":
      return QUESTION_TYPES.SINGLE_CHOICE;
    case "multiple":
      return QUESTION_TYPES.MULTIPLE_CHOICE;
    case "number":
      return QUESTION_TYPES.NUMBER_INPUT;
    case "text":
      return QUESTION_TYPES.TEXT_INPUT;
    default:
      return QUESTION_TYPES.SINGLE_CHOICE;
  }
}

module.exports = {
  convertFrontendTypeToBackend,
};
