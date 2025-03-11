// src/controllers/answerController.js
const Question = require("../models/Question");
const { validateQuestionHook } = require("../hooks/questionValidation");
const { updateIsCorrect } = require("../hooks/answerHooks");  

// Создание нового ответа
async function createAnswer(req, res, next) {
  try {
    const { testId, questionId } = req.params;
    const newAnswer = req.body;

    const question = await Question.findOne({ _id: questionId, testId });
    if (!question) {
      return res.status(404).json({ message: "Question not found." });
    }

    // Добавляем новый ответ в массив ответов вопроса
    question.answers.push(newAnswer);

    // Перед сохранением валидируем вопрос с учётом новых данных
    try {
      await validateQuestionHook(question);
    } catch (validationError) {
      return res.status(400).json({ message: validationError.message });
    }

    // Обновляем корректность ответов
    await updateIsCorrect(question);

    // Сохраняем вопрос
    const savedQuestion = await question.save();

    // Возвращаем успешный ответ
    res.status(201).json({
      message: "Answer created successfully.",
      data: savedQuestion.answers,
    });
  } catch (error) {
    console.error("Error creating answer:", error);
    next(error);
  }
}



// Получение всех ответов для вопроса
async function getAnswers(req, res, next) {
  try {
    const { testId, questionId } = req.params;

    const question = await Question.findOne({ _id: questionId, testId });
    if (!question) {
      return res.status(404).json({ message: "Question not found." });
    }

    res.status(200).json({
      data: question.answers,
    });
  } catch (error) {
    console.error("Error fetching answers:", error);
    next(error);
  }
}

// Обновление ответа
async function updateAnswer(req, res, next) {
  try {
    const { testId, questionId, answerId } = req.params;
    const updatedData = req.body;

    const question = await Question.findOne({ _id: questionId, testId });
    if (!question) {
      return res.status(404).json({ message: "Question not found." });
    }

    const answer = question.answers.id(answerId);
    if (!answer) {
      return res.status(404).json({ message: "Answer not found." });
    }

    // Обновляем данные ответа
    Object.assign(answer, updatedData);

    // Сохраняем вопрос, что автоматически вызовет хуки и пересчитает баллы
    const updatedQuestion = await question.save();

    res.status(200).json({
      message: "Answer updated successfully.",
      data: updatedQuestion.answers,
    });
  } catch (error) {
    console.error("Error updating answer:", error);
    next(error);
  }
}

// Удаление ответа
async function deleteAnswer(req, res, next) {
  try {
    const { testId, questionId, answerId } = req.params;

    const question = await Question.findOne({ _id: questionId, testId });
    if (!question) {
      return res.status(404).json({ message: "Question not found." });
    }

    // Проверяем наличие ответа по ID
    const answer = question.answers.id(answerId);
    if (!answer) {
      return res.status(404).json({ message: "Answer not found." });
    }

    // Удаляем ответ из массива
    question.answers.pull(answerId);

    // Сохраняем вопрос, что автоматически вызовет хуки и пересчитает баллы
    const updatedQuestion = await question.save();

    res.status(200).json({
      message: "Answer deleted successfully.",
      data: updatedQuestion.answers,
    });
  } catch (error) {
    console.error("Error deleting answer:", error);
    next(error);
  }
}


module.exports = {
  createAnswer,
  getAnswers,
  updateAnswer,
  deleteAnswer,
};
