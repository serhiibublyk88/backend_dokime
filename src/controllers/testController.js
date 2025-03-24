const Test = require("../models/Test");
const Group = require("../models/Group");
const Question = require("../models/Question");
const TestResult = require("../models/TestResult");
const { mapTestToDto } = require("../helpers/testMapper");
const { convertFrontendTypeToBackend } = require("../utils/questionUtils");

// ✅ Получение теста по ID
async function getTestById(req, res) {
  try {
    const { testId } = req.params;

    const test = await Test.findById(testId)
      .populate("availableForGroups", "name")
      .populate("author", "username")
      .populate({
        path: "questions",
        populate: { path: "answers" },
      });

    if (!test) {
      return res.status(404).json({ message: "Test not found" });
    }

    const testDto = mapTestToDto(test);

    res.status(200).json(testDto);
  } catch (error) {
    res.status(500).json({
      message: "Error fetching test",
      error: error.message,
    });
  }
}

// Получение всех тестов
async function getAllTests(req, res) {
  try {
    const tests = await Test.find({ author: req.user._id })
      .populate("availableForGroups", "name")
      .populate("author", "username");

    res.status(200).json(tests.length ? tests.map(mapTestToDto) : []);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error fetching tests", error: error.message });
  }
}

// Получение списка всех групп + доступных групп у теста
async function getTestGroups(req, res) {
  try {
    const { testId } = req.params;
    const test = await Test.findById(testId).populate(
      "availableForGroups",
      "name"
    );
    if (!test) return res.status(404).json({ message: "Test not found" });

    const allGroups = await Group.find({}, "name");

    res.status(200).json({
      allGroups: allGroups.map((group) => ({
        id: group._id,
        name: group.name,
      })),
      availableForGroups: test.availableForGroups.map((group) =>
        group._id.toString()
      ),
    });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error fetching test groups", error: error.message });
  }
}
// Создание нового теста

async function createTest(req, res) {
  try {
    const {
      title,
      description,
      timeLimit,
      availableForGroups,
      questions,
      status,
      minimumScores,
    } = req.body;

    const groups = await Group.find({ _id: { $in: availableForGroups } });
    if (groups.length !== availableForGroups.length) {
      return res
        .status(400)
        .json({ message: "One or more groups are invalid" });
    }

    const newTest = new Test({
      title,
      description,
      timeLimit,
      availableForGroups: groups.map((g) => g._id),
      questions: [],
      status: status || "inactive",
      minimumScores: minimumScores || { 1: 95, 2: 80, 3: 70, 4: 50, 5: 0 },
      author: req.user._id,
    });

    await newTest.save();

    const createdQuestions = await Promise.all(
      questions.map((q) => {
        const convertedType = convertFrontendTypeToBackend(q.questionType);
        const questionData = {
          questionText: q.questionText,
          questionType: convertedType,
          imageUrl: q.imageUrl || null,
          answers: q.answers || [],
          testId: newTest._id,
        };
        // только для text-input
        if (
          convertedType === "text-input" &&
          typeof q.percentageError === "number"
        ) {
          questionData.percentageError = q.percentageError;
        }

        return Question.create(questionData);
      })
    );

    const maximumMarks = createdQuestions.reduce(
      (total, q) =>
        total +
        q.answers.reduce((sum, a) => sum + (a.score > 0 ? a.score : 0), 0),
      0
    );

    newTest.questions = createdQuestions.map((q) => q._id);
    newTest.maximumMarks = maximumMarks;
    await newTest.save();

    await newTest.populate("availableForGroups", "name");
    await newTest.populate("author", "username");
    await newTest.populate({
      path: "questions",
      populate: { path: "answers" },
    });

    res.status(201).json({
      message: "Test created successfully",
      test: {
        ...mapTestToDto(newTest),
        userId: req.user._id.toString(),
        role: req.user.role,
      },
    });
  } catch (error) {
    console.error("Ошибка при создании теста:", error);
    res.status(500).json({
      message: "Error creating test",
      error: error.message,
    });
  }
}

//////////////////////////////////////////////////
async function updateTest(req, res) {
  try {
    const { testId } = req.params;
    const {
      title,
      description,
      timeLimit,
      availableForGroups,
      questions,
      status,
      minimumScores,
    } = req.body;

    const existingTest = await Test.findById(testId);
    if (!existingTest) {
      return res.status(404).json({ error: "Тест не найден" });
    }

    if (
      Array.isArray(existingTest.questions) &&
      existingTest.questions.length > 0
    ) {
      await Question.deleteMany({ _id: { $in: existingTest.questions } });
    }

    const createdQuestions = await Promise.all(
      questions.map((q) => {
        const convertedType = convertFrontendTypeToBackend(q.questionType);
        const questionData = {
          questionText: q.questionText,
          questionType: convertedType,
          imageUrl: q.imageUrl || null,
          answers: q.answers || [],
          testId: testId,
        };
        if (
          convertedType === "text-input" &&
          typeof q.percentageError === "number"
        ) {
          questionData.percentageError = q.percentageError;
        }
        return Question.create(questionData);
      })
    );

    const questionIds = createdQuestions.map((q) => q._id);
    const maximumMarks = createdQuestions.reduce(
      (total, q) =>
        total +
        q.answers.reduce((sum, a) => sum + (a.score > 0 ? a.score : 0), 0),
      0
    );

    const groups = await Group.find({ _id: { $in: availableForGroups } });
    if (groups.length !== availableForGroups.length) {
      return res
        .status(400)
        .json({ message: "One or more groups are invalid" });
    }

    existingTest.title = title;
    existingTest.description = description;
    existingTest.timeLimit = timeLimit;
    existingTest.status = status || "inactive";
    existingTest.minimumScores = minimumScores || {
      1: 95,
      2: 80,
      3: 70,
      4: 50,
      5: 0,
    };
    existingTest.availableForGroups = groups.map((g) => g._id);
    existingTest.questions = questionIds;
    existingTest.maximumMarks = maximumMarks;

    await existingTest.save();

    await existingTest.populate("availableForGroups", "name");
    await existingTest.populate("author", "username");
    await existingTest.populate({
      path: "questions",
      populate: { path: "answers" },
    });

    const testDto = mapTestToDto(existingTest);
    testDto.userId = existingTest.author._id.toString();
    testDto.role = req.user.role;

    res.status(200).json(testDto);
  } catch (error) {
    console.error("Ошибка при обновлении теста:", error);
    res.status(500).json({ error: "Ошибка сервера при обновлении теста" });
  }
}

////////////////////////////////////////////////////
async function deleteTest(req, res) {
  try {
    const { testId } = req.params;
    const test = await Test.findById(testId);
    if (!test) return res.status(404).json({ message: "Test not found" });

    // Удаляем связанные вопросы
    if (Array.isArray(test.questions) && test.questions.length > 0) {
      await Question.deleteMany({ _id: { $in: test.questions } });
    }

    await test.deleteOne();
    res.status(200).json({ message: "Test deleted successfully" });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error deleting test", error: error.message });
  }
}

/////////////////////////////////////////////////////
async function copyTest(req, res) {
  try {
    const { testId } = req.params;

    const originalTest = await Test.findById(testId)
      .populate("questions")
      .populate("availableForGroups", "name")
      .populate("author", "username");

    if (!originalTest) {
      return res.status(404).json({ message: "Test not found" });
    }

    // Создаём копию теста (без вопросов)
    const testCopy = new Test({
      title: `${originalTest.title}_copy`,
      description: originalTest.description,
      timeLimit: originalTest.timeLimit,
      availableForGroups: originalTest.availableForGroups.map((g) => g._id),
      status: "inactive",
      minimumScores: originalTest.minimumScores,
      author: req.user._id,
      questions: [],
    });

    await testCopy.save();

    // Копируем вопросы, включая testId и корректный тип
    const copiedQuestions = await Promise.all(
      originalTest.questions.map((q) => {
        const convertedType = convertFrontendTypeToBackend(q.questionType);

        const questionData = {
          questionText: q.questionText,
          questionType: convertedType,
          imageUrl: q.imageUrl || null,
          answers: q.answers || [],
          testId: testCopy._id,
        };

        if (
          convertedType === "text-input" &&
          typeof q.percentageError === "number"
        ) {
          questionData.percentageError = q.percentageError;
        }

        return Question.create(questionData);
      })
    );

    const maximumMarks = copiedQuestions.reduce(
      (total, q) =>
        total +
        q.answers.reduce((sum, a) => sum + (a.score > 0 ? a.score : 0), 0),
      0
    );

    testCopy.questions = copiedQuestions.map((q) => q._id);
    testCopy.maximumMarks = maximumMarks;
    await testCopy.save();

    await testCopy.populate("author", "username");
    await testCopy.populate("availableForGroups", "name");
    await testCopy.populate({
      path: "questions",
      populate: { path: "answers" },
    });

    res.status(201).json({
      message: "Test copied successfully",
      test: {
        ...mapTestToDto(testCopy),
        userId: req.user._id.toString(),
        role: req.user.role,
      },
    });
  } catch (error) {
    console.error("Ошибка при копировании теста:", error);
    res
      .status(500)
      .json({ message: "Error copying test", error: error.message });
  }
}

// Обновление доступных групп
async function updateTestGroups(req, res) {
  try {
    const { testId } = req.params;
    const { groupIds } = req.body;

    if (!Array.isArray(groupIds)) {
      return res.status(400).json({ message: "Invalid request parameters" });
    }

    const test = await Test.findById(testId);
    if (!test) return res.status(404).json({ message: "Test not found" });

    const groups = await Group.find({ _id: { $in: groupIds } });
    if (groups.length !== groupIds.length) {
      return res
        .status(400)
        .json({ message: "One or more groups are invalid" });
    }

    test.availableForGroups = groupIds;
    await test.save();

    res.status(200).json({
      message: "Groups updated successfully",
      availableForGroups: test.availableForGroups.map((g) => g.toString()),
    });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error updating test groups", error: error.message });
  }
}

// API для получения доступных групп
async function getTestAvailableGroups(req, res) {
  try {
    const { testId } = req.params;
    const test = await Test.findById(testId).populate(
      "availableForGroups",
      "name"
    );

    if (!test) return res.status(404).json({ message: "Test not found" });

    res.status(200).json({
      availableForGroups: test.availableForGroups.map((group) => ({
        id: group._id.toString(),
        name: group.name,
      })),
    });
  } catch (error) {
    res.status(500).json({
      message: "Error fetching available groups",
      error: error.message,
    });
  }
}

// Получение результатов теста
// controllers/testController.js

async function getTestResults(req, res, next) {
  try {
    const { testId } = req.params;

    const test = await Test.findById(testId).populate("author", "name").lean();
    if (!test) return res.status(404).json({ error: "Test not found" });

    const groups = await Group.find({ _id: { $in: test.availableForGroups } })
      .populate("members", "name")
      .lean();

    const testResults = await TestResult.find({ testId })
      .populate("userId", "name")
      .lean();

    const resultsWithDetails = groups.map((group) => ({
      groupId: group._id,
      groupName: group.name,
      participants: group.members.map((user) => {
        const result = testResults.find(
          (r) => r.userId._id.toString() === user._id.toString()
        );

        if (result) {
          return {
            userId: user._id,
            userName: user.name,
            hasPassed: true,
            startTime: new Date(result.startTime)
              .toISOString()
              .split(".")[0]
              .replace("T", " "),
            timeTaken: result.timeTaken,
            maximumMarks: result.maximumMarks,
            obtainedMarks: result.totalScore,
            percentageScore: result.percentageScore,
            grade: result.grade,
          };
        }

        return {
          userId: user._id,
          userName: user.name,
          hasPassed: false,
          startTime: null,
          timeTaken: null,
          maximumMarks: test.maximumMarks,
          obtainedMarks: 0,
          percentageScore: 0,
          grade: null,
        };
      }),
    }));

    res.status(200).json({
      testId: test._id,
      testName: test.title,
      groups: resultsWithDetails,
    });
  } catch (error) {
    next(error);
  }
}

//  Обновление статуса теста (active / inactive)
const updateTestStatus = async (req, res) => {
  try {
    const { testId } = req.params;
    const { status } = req.body;

    // ✅ Проверка ID и значения
    if (!mongoose.Types.ObjectId.isValid(testId)) {
      return res.status(400).json({ message: "Invalid test ID" });
    }

    if (!["active", "inactive"].includes(status)) {
      return res
        .status(400)
        .json({ message: "Status must be 'active' or 'inactive'" });
    }

    const test = await Test.findById(testId);
    if (!test) {
      return res.status(404).json({ message: "Test not found" });
    }

    test.status = status;
    await test.save();

    return res.status(200).json({
      message: "Status updated successfully",
      test: mapTestToDto(test),
    });
  } catch (error) {
    console.error("Ошибка при обновлении статуса теста:", error);
    return res
      .status(500)
      .json({ message: "Error updating test status", error: error.message });
  }
};

module.exports = {
  createTest,
  getTestById,
  getAllTests,
  getTestGroups,
  updateTest,
  deleteTest,
  copyTest,
  getTestResults,
  updateTestGroups,
  getTestAvailableGroups,
  updateTestStatus,
};
