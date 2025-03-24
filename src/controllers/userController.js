//src / controllers/userController
const TestAttempt = require("../models/TestAttempt");
const User = require("../models/User");
const TestResult = require("../models/TestResult");
const Test = require("../models/Test");
const Question = require("../models/Question");
const { calculateTotalScore, calculateGrade } = require("../utils/scoreUtils");

// Запрос доступных тестов для юзера
const getAvailableTests = async (req, res, next) => {
  try {
    const userId = req.user.id;

    const user = await User.findById(userId).populate("group");
    if (!user || !user.group) {
      return res.status(404).json({ error: "User or group not found" });
    }

    const completedTestIds = await TestResult.find({
      userId,
      isCompleted: true,
    }).distinct("testId");

    const availableTests = await Test.find({
      availableForGroups: user.group._id,
      _id: { $nin: completedTestIds },
    }).select("_id title status");

    res.status(200).json({ data: availableTests });
  } catch (error) {
    next(error);
  }
};

async function getUserResults(req, res, next) {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(400).json({ error: "User ID is missing" });
    }

    const results = await TestResult.find({ userId })
      .populate("testId", "title")
      .lean();

    if (!results || results.length === 0) {
      return res
        .status(404)
        .json({ message: "No results found for this user" });
    }

    const formattedResults = results.map((result) => ({
      testTitle: result.testId.title,
      startTime: new Date(result.startTime)
        .toISOString()
        .split(".")[0]
        .replace("T", " "),
      timeTaken: result.timeTaken,
      maximumMarks: result.maximumMarks,
      obtainedMarks: result.totalScore,
      percentageScore: result.percentageScore,
      grade: result.grade,
    }));

    res.status(200).json({ data: formattedResults });
  } catch (error) {
    next(error);
  }
}

// Создание новой попытки теста и получение вопросов
// Создание новой попытки теста и получение вопросов
const createTestAttemptAndGetQuestions = async (req, res, next) => {
  try {
    const { testId } = req.params;
    const userId = req.user._id;

    const test = await Test.findById(testId);
    if (!test) {
      return res.status(404).json({ error: "Test not found" });
    }

    const user = await User.findById(userId).populate("group");
    if (!user || !user.group) {
      return res.status(404).json({ error: "User or group not found" });
    }

    if (
      !test.availableForGroups.some(
        (groupId) => groupId.toString() === user.group._id.toString()
      )
    ) {
      return res
        .status(403)
        .json({ error: "Test is not available for your group" });
    }

    const existingTestResult = await TestResult.findOne({
      userId,
      testId,
      isCompleted: true,
    });

    if (existingTestResult) {
      return res
        .status(400)
        .json({ error: "Test has already been completed" });
    }

    const attempt = new TestAttempt({
      userId,
      testId,
      startedAt: new Date(),
      timeLimit: test.timeLimit,
    });

    await attempt.save();

    const questions = await Question.find({ testId }).lean();

    const filteredQuestions = questions.map((question) => ({
      id: question._id,
      questionText: question.questionText,
      imageUrl: question.imageUrl,
      type: question.questionType,
      answers:
        question.questionType === "single-choice" ||
        question.questionType === "multiple-choice"
          ? question.answers.map((answer) => ({
              id: answer._id,
              text: answer.text,
            }))
          : undefined,
    }));

    res.status(201).json({
      data: {
        attemptId: attempt._id,
        questions: filteredQuestions,
        timeLimit: attempt.timeLimit,
      },
    });
  } catch (error) {
    console.error("Error in createTestAttemptAndGetQuestions:", error);
    next(error);
  }
};




const submitTestAttempt = async (req, res, next) => {
  try {
    const { attemptId } = req.params;
    const { answers } = req.body;

    const attempt = await TestAttempt.findById(attemptId).populate("testId");
    if (!attempt) {
      return res.status(404).json({ error: "Test attempt not found" });
    }

    const now = new Date();
    const endTime = new Date(
      attempt.startedAt.getTime() + attempt.timeLimit * 60000
    );
    const isTimeExpired = now > endTime;

    if (isTimeExpired) {
      attempt.finishedAt = endTime;
    } else {
      attempt.finishedAt = now;
    }

    attempt.timeTaken = Math.round(
      (attempt.finishedAt - attempt.startedAt) / 60000
    );

    if (isTimeExpired) {
      attempt.timeTaken = attempt.timeLimit;
    }

    const questions = await Question.find({ testId: attempt.testId });

    let totalScore = 0;
    const processedAnswers = questions.map((question) => {
      const userAnswer = answers.find(
        (a) => String(a.questionId) === String(question._id)
      );

      let isCorrect = false;
      let score = 0;

      if (userAnswer && !isTimeExpired) {
        const result = calculateTotalScore(question, userAnswer.answer);
        isCorrect = result.isCorrect;
        score = result.score;
        if (score > 0) {
          totalScore += score;
        }
      }

      return {
        questionId: question._id,
        answer: userAnswer ? userAnswer.answer : null,
        isCorrect,
        score,
      };
    });

    attempt.answers = processedAnswers;
    attempt.totalScore = totalScore;
    attempt.maximumMarks = attempt.testId.maximumMarks;
    attempt.percentageScore = (totalScore / attempt.maximumMarks) * 100;
    attempt.isCompleted = true;

    await attempt.save();

    const testResult = new TestResult({
      userId: attempt.userId,
      testId: attempt.testId,
      attemptId: attempt._id,
      totalScore: totalScore,
      maximumMarks: attempt.maximumMarks,
      percentageScore: attempt.percentageScore,
      isCompleted: true,
      timeTaken: attempt.timeTaken,
      finishTime: attempt.finishedAt,
      startTime: attempt.startedAt,
      author: attempt.testId.author,
    });

    const minimumScores = attempt.testId.minimumScores;

    const grade = calculateGrade(
      attempt.totalScore,
      attempt.maximumMarks,
      minimumScores
    );

    testResult.grade = grade;

    await testResult.save();
    res.status(200).json({ data: testResult });
  } catch (error) {
    next(error);
  }
};

// Получить данные о попытке теста для юзера
const getTestAttempt = async (req, res, next) => {
  try {
    const { attemptId } = req.params;
    const userId = req.user?.id;

    const attempt = await TestAttempt.findById(attemptId)
      .populate("testId")
      .lean();

    if (!attempt) {
      return res.status(404).json({ error: "Test attempt not found" });
    }

    // Защита: доступ только к своей попытке
    if (String(attempt.userId) !== String(userId)) {
      return res.status(403).json({ error: "Access denied" });
    }

    const test = attempt.testId;
    const questions = await Question.find({ testId: test._id }).lean();

    // Словарь вопросов по ID
    const questionMap = {};
    questions.forEach((q) => {
      questionMap[q._id.toString()] = q;
    });

    const formattedQuestions = attempt.answers
      .map((answerObj) => {
        const question = questionMap[answerObj.questionId.toString()];
        if (!question) return null;

        let correctAnswer = null;
        if (
          question.questionType === "single-choice" ||
          question.questionType === "multiple-choice"
        ) {
          correctAnswer = question.answers
            .filter((a) => a.isCorrect)
            .map((a) => a.text);
        } else if (
          question.questionType === "number-input" ||
          question.questionType === "text-input"
        ) {
          correctAnswer = question.answers[0]?.text || null;
        }

        return {
          questionText: question.questionText,
          imageUrl: question.imageUrl,
          type: question.questionType,
          userAnswer: answerObj.answer,
          correctAnswer,
          isCorrect: answerObj.isCorrect,
          score: answerObj.score,
        };
      })
      .filter(Boolean);

    const result = {
      testTitle: test.title,
      startTime: new Date(attempt.startedAt)
        .toISOString()
        .split(".")[0]
        .replace("T", " "),
      finishTime: new Date(attempt.finishedAt)
        .toISOString()
        .split(".")[0]
        .replace("T", " "),
      timeLimit: attempt.timeLimit,
      timeTaken: attempt.timeTaken,
      totalScore: attempt.totalScore,
      maximumMarks: attempt.maximumMarks,
      percentageScore: attempt.percentageScore,
      grade: attempt.grade,
      questions: formattedQuestions,
    };

    res.status(200).json({ data: result });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAvailableTests,
  getUserResults,
  createTestAttemptAndGetQuestions,
  submitTestAttempt,
  getTestAttempt,
};
