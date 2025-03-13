const Test = require("../models/Test");
const Group = require("../models/Group");
const TestResult = require("../models/TestResult");
const { mapTestToDto } = require("../helpers/testMapper");

// Создание нового теста
async function createTest(req, res) {
  try {
    const {
      title,
      description,
      timeLimit,
      availableForGroups,
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
      status: status || "inactive",
      minimumScores: minimumScores || {
        1: 95,
        2: 85,
        3: 70,
        4: 50,
        5: 0,
      },
      author: req.user._id,
    });

    await newTest.save();
    res.status(201).json({
      message: "Test created successfully",
      test: mapTestToDto(newTest),
    });
  } catch (error) {
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

// Получение списка всех групп + доступных групп у теста (для выпадающего списка)
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
async function updateTest(req, res) {
  try {
    const { testId } = req.params;
    const updateFields = {};

    // Разбираем входные данные и обновляем только переданные поля
    ["title", "description", "timeLimit", "status", "minimumScores"].forEach(
      (field) => {
        if (req.body[field] !== undefined) updateFields[field] = req.body[field];
      }
    );

    // Преобразуем ObjectId для групп, если они переданы
    if (req.body.availableForGroups) {
      updateFields.availableForGroups = req.body.availableForGroups.map(String);
    }

    updateFields.updatedAt = new Date();

    // Обновляем тест и возвращаем новый объект
    const test = await Test.findByIdAndUpdate(testId, updateFields, {
      new: true,
      runValidators: true,
    });

    if (!test) {
      return res.status(404).json({ message: "Test not found" });
    }

    res.status(200).json({
      message: "Test updated successfully",
      test: mapTestToDto(test),
    });
  } catch (error) {
    res.status(500).json({
      message: "Error updating test",
      error: error.message,
    });
  }
}


// Обновление доступных групп
async function updateTestGroups(req, res) {
  try {
    const { testId } = req.params;
    const { groupId, action } = req.body;

    console.log("📡 [Backend] Получен запрос на обновление групп");
    console.log("➡️ [Backend] testId:", testId);
    console.log("➡️ [Backend] groupId:", groupId);
    console.log("➡️ [Backend] action:", action);

    if (!groupId || !["add", "remove"].includes(action)) {
      return res.status(400).json({ message: "Invalid request parameters" });
    }

    // Проверяем существование теста
    const test = await Test.findById(testId);
    if (!test) {
      return res.status(404).json({ message: "Test not found" });
    }

    // Проверяем существование группы
    const group = await Group.findById(groupId);
    if (!group) {
      return res.status(404).json({ message: "Group not found" });
    }

    if (action === "add") {
      console.log(`📡 [Backend] Добавляем группу ${groupId} к тесту ${testId}`);

      if (!test.availableForGroups.some((id) => id.toString() === groupId)) {
        test.availableForGroups.push(groupId);
      }
    } else if (action === "remove") {
      console.log(`📡 [Backend] Удаляем группу ${groupId} из теста ${testId}`);

      test.availableForGroups = test.availableForGroups.filter(
        (id) => id.toString() !== groupId
      );
    }

    await test.save();
    console.log(
      "✅ [Backend] Группы успешно обновлены:",
      test.availableForGroups
    );

    res.status(200).json({
      message: `Group ${action}ed successfully`,
      availableForGroups: test.availableForGroups.map((g) => g.toString()),
    });
  } catch (error) {
    console.error("❌ [Backend] Ошибка обновления групп:", error.message);
    res.status(500).json({
      message: "Error updating test groups",
      error: error.message,
    });
  }
}


//API для получения доступных групп
async function getTestAvailableGroups(req, res) {
  try {
    const { testId } = req.params;
    const test = await Test.findById(testId).populate(
      "availableForGroups",
      "name"
    );

    if (!test) {
      return res.status(404).json({ message: "Test not found" });
    }

    res.status(200).json({
      availableForGroups: test.availableForGroups.map((group) => ({
        id: group._id.toString(),
        name: group.name,
      })),
    });
  } catch (error) {
    console.error("❌ [Backend] Ошибка получения доступных групп:", error);
    res
      .status(500)
      .json({
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

module.exports = {
  createTest,
  getAllTests,
  getTestGroups,
  updateTest,
  deleteTest,
  copyTest,
  getTestResults,
  updateTestGroups,
  getTestAvailableGroups,
};
