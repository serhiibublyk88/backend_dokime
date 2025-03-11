//src / controllers/testController.js
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
      availableForGroups: groups,
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
    console.error(error);
    res
      .status(500)
      .json({ message: "Error creating test", error: error.message });
  }
}

// Получение всех тестов для текущего пользователя
async function getAllTests(req, res) {
  try {
    const tests = await Test.find({ author: req.user._id })
      .populate("availableForGroups", "name")
      .populate("author", "username");

    res.status(200).json(tests.length ? tests.map(mapTestToDto) : []);
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ message: "Error fetching tests", error: error.message });
  }
}

// Редактирование теста
async function updateTest(req, res) {
  try {
    const { testId } = req.params;
    const {
      title,
      description,
      timeLimit,
      availableForGroups,
      status,
      minimumScores,
    } = req.body;

    const test = await Test.findById(testId);
    if (!test) {
      return res.status(404).json({ message: "Test not found" });
    }

    test.title = title || test.title;
    test.description = description || test.description;
    test.timeLimit = timeLimit || test.timeLimit;
    test.availableForGroups = availableForGroups || test.availableForGroups;
    test.status = status || test.status;
    test.minimumScores = minimumScores || test.minimumScores;

    await test.save();

    res
      .status(200)
      .json({ message: "Test updated successfully", test: mapTestToDto(test) });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ message: "Error updating test", error: error.message });
  }
}

// Обновление доступных групп у теста
async function updateTestGroups(req, res) {
  try {
    const { testId } = req.params;
    const { groupId, action } = req.body; // action: "add" | "remove"

    if (!groupId || !["add", "remove"].includes(action)) {
      return res.status(400).json({ message: "Invalid request parameters" });
    }

    const test = await Test.findById(testId);
    if (!test) {
      return res.status(404).json({ message: "Test not found" });
    }

    const group = await Group.findById(groupId);
    if (!group) {
      return res.status(404).json({ message: "Group not found" });
    }

    if (action === "add") {
      if (!test.availableForGroups.includes(groupId)) {
        test.availableForGroups.push(groupId);
      }
    } else if (action === "remove") {
      test.availableForGroups = test.availableForGroups.filter(
        (id) => id.toString() !== groupId
      );
    }

    await test.save();

    res.status(200).json({
      message: `Group ${action}ed successfully`,
      availableForGroups: test.availableForGroups,
    });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ message: "Error updating test groups", error: error.message });
  }
}

// Удаление теста
async function deleteTest(req, res) {
  try {
    const { testId } = req.params;

    const test = await Test.findById(testId);
    if (!test) {
      return res.status(404).json({ message: "Test not found" });
    }

    await test.deleteOne();
    res.status(200).json({ message: "Test deleted successfully" });
  } catch (error) {
    console.error(error);
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
    if (!test) {
      return res.status(404).json({ message: "Test not found" });
    }

    const testCopy = new Test({
      ...test.toObject(),
      title: test.title + "_copy",
      status: "inactive",
      _id: undefined,
    });

    await testCopy.save();

    res.status(201).json({
      message: "Test copied successfully",
      test: mapTestToDto(testCopy),
    });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ message: "Error copying test", error: error.message });
  }
}

const getTestResults = async (req, res, next) => {
  try {
    const { testId } = req.params;
    const test = await Test.findById(testId).populate("author", "name").lean();
    if (!test) {
      return res.status(404).json({ error: "Test not found" });
    }

    const groups = await Group.find({ _id: { $in: test.availableForGroups } })
      .populate("members", "name")
      .lean();

    const testResults = await TestResult.find({ testId })
      .populate("userId", "name")
      .populate("author", "name")
      .lean();

    const maximumMarks = test.maximumMarks;

    const resultsWithDetails = groups.map((group) => {
      const groupParticipants = group.members.map((user, index) => {
        const result = testResults.find(
          (r) => r.userId._id.toString() === user._id.toString()
        );

        if (!result) {
          return {
            userId: user._id,
            userName: user.name,
            testStatus: "Not completed",
            startTime: null,
            finishTime: null,
            timeTaken: 0,
            maximumMarks: maximumMarks,
            totalScore: 0,
            percentageScore: 0,
            grade: "Not graded",
          };
        }

        return {
          userId: result.userId._id,
          userName: result.userId.name,
          testStatus: result.isCompleted ? "Completed" : "Not completed",
          startTime: result.startTime,
          finishTime: result.finishTime,
          timeTaken: result.timeTaken,
          maximumMarks: result.maximumMarks,
          totalScore: result.totalScore,
          percentageScore: result.percentageScore,
          grade: result.grade,
        };
      });

      return {
        groupName: group.name,
        participants: groupParticipants,
      };
    });

    res.status(200).json({
      testName: test.title,
      testAuthor: test.author.name,
      groups: resultsWithDetails,
    });
  } catch (error) {
    console.error(error);
    next(error);
  }
};

module.exports = {
  createTest,
  getAllTests,
  updateTest,
  deleteTest,
  copyTest,
  getTestResults,
  updateTestGroups,
};
