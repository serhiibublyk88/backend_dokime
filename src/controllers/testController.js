const Test = require("../models/Test");
const Group = require("../models/Group");
const TestResult = require("../models/TestResult");
const { mapTestToDto } = require("../helpers/testMapper");

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

    let questionIds = [];
    if (Array.isArray(questions)) {
      questionIds = questions
        .map((q) =>
          typeof q === "string"
            ? mongoose.Types.ObjectId.isValid(q)
              ? new mongoose.Types.ObjectId(q)
              : null
            : q?.id && mongoose.Types.ObjectId.isValid(q.id)
            ? new mongoose.Types.ObjectId(q.id)
            : null
        )
        .filter(Boolean);
    }

    const newTest = new Test({
      title,
      description,
      timeLimit,
      availableForGroups: groups.map((g) => g._id),
      questions: questionIds,
      status: status || "inactive",
      minimumScores: minimumScores || { 1: 95, 2: 85, 3: 70, 4: 50, 5: 0 },
      author: req.user._id,
    });

    await newTest.save();

    await newTest.populate("author", "username");
    await newTest.populate("questions");

    res.status(201).json({
      message: "Test created successfully",
      test: {
        ...mapTestToDto(newTest),
        userId: newTest.author._id.toString(),
        role: req.user.role,
      },
    });
  } catch (error) {
    console.error("Ошибка при создании теста:", error);
    res
      .status(500)
      .json({ message: "Error creating test", error: error.message });
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

// Обновление теста
const updateTest = async (req, res) => {
  try {
    const { testId } = req.params;
    const updates = { ...req.body };

    const existingTest = await Test.findById(testId);
    if (!existingTest) {
      return res.status(404).json({ error: "Тест не найден" });
    }

    if (Array.isArray(updates.questions)) {
      updates.questions = updates.questions
        .map((q) =>
          mongoose.Types.ObjectId.isValid(q.id || q)
            ? new mongoose.Types.ObjectId(q.id || q)
            : null
        )
        .filter(Boolean);
    } else {
      delete updates.questions;
    }

    if (Array.isArray(updates.availableForGroups)) {
      updates.availableForGroups = updates.availableForGroups
        .map((g) =>
          mongoose.Types.ObjectId.isValid(g.id || g)
            ? new mongoose.Types.ObjectId(g.id || g)
            : null
        )
        .filter(Boolean);
    } else {
      delete updates.availableForGroups;
    }

    if (
      updates.author &&
      typeof updates.author === "object" &&
      updates.author.id
    ) {
      updates.author = new mongoose.Types.ObjectId(updates.author.id);
    } else if (typeof updates.author === "string") {
      updates.author = new mongoose.Types.ObjectId(updates.author);
    } else {
      delete updates.author;
    }

    const updatedTest = await Test.findByIdAndUpdate(
      testId,
      { $set: updates },
      { new: true, runValidators: true }
    )
      .populate("availableForGroups", "name")
      .populate("author", "username")
      .populate({
        path: "questions",
        populate: { path: "answers" },
      });

    if (!updatedTest) {
      return res.status(404).json({ error: "Не удалось обновить тест" });
    }

    const testDto = mapTestToDto(updatedTest);
    testDto.userId = updatedTest.author._id.toString();
    testDto.role = req.user.role;

    res.status(200).json(testDto);
  } catch (error) {
    console.error("Ошибка при обновлении теста:", error);
    res.status(500).json({ error: "Ошибка сервера при обновлении теста" });
  }
};

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

// Удаление теста
async function deleteTest(req, res) {
  try {
    const { testId } = req.params;
    const test = await Test.findById(testId);
    if (!test) return res.status(404).json({ message: "Test not found" });

    await test.deleteOne();
    res.status(200).json({ message: "Test deleted successfully" });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error deleting test", error: error.message });
  }
}

// Копирование теста
async function copyTest(req, res) {
  try {
    const { testId } = req.params;
    const test = await Test.findById(testId);
    if (!test) return res.status(404).json({ message: "Test not found" });

    const testCopy = new Test({
      ...test.toObject(),
      title: test.title + "_copy",
      status: "inactive",
      _id: undefined,
      createdAt: undefined,
      updatedAt: undefined,
      availableForGroups: test.availableForGroups.map((group) => group._id),
      questions: test.questions.map((question) => question._id),
    });

    await testCopy.save();
    res.status(201).json({
      message: "Test copied successfully",
      test: mapTestToDto(testCopy),
    });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error copying test", error: error.message });
  }
}

// Получение результатов теста
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
      .populate("author", "name")
      .lean();

    const resultsWithDetails = groups.map((group) => ({
      groupName: group.name,
      participants: group.members.map((user) => {
        const result = testResults.find(
          (r) => r.userId._id.toString() === user._id.toString()
        );
        return result
          ? {
              userId: result.userId._id,
              userName: result.userId.name,
              percentageScore: result.percentageScore,
            }
          : { userId: user._id, userName: user.name, percentageScore: 0 };
      }),
    }));

    res.status(200).json({ testName: test.title, groups: resultsWithDetails });
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
