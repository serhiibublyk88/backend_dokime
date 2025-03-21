// src/routes/testRoutes.js
const express = require("express");
const router = express.Router();
const {
  createTest,
  getAllTests,
  getTestById,
  updateTest,
  deleteTest,
  copyTest,
  getTestResults,
  updateTestGroups,
  getTestGroups,
  getTestAvailableGroups,
  updateTestStatus,
} = require("../controllers/testController");

const authMiddleware = require("../middleware/authMiddleware");
const checkRole = require("../middleware/checkRole");
const { TEST_CREATOR } = require("../constants/roles");

router.use(authMiddleware, checkRole([TEST_CREATOR]));


router.post("/", createTest);
router.get("/", getAllTests);
router.get("/:testId", getTestById);
router.put("/:testId", updateTest);
router.delete("/:testId", deleteTest);
router.post("/:testId/copy", copyTest);
router.get("/:testId/results", getTestResults);
router.patch("/:testId/available-groups",updateTestGroups);
router.get("/:testId/available-groups", getTestAvailableGroups);
router.get("/:testId/groups", getTestGroups);
router.patch("/:testId/status", updateTestStatus);


const questionRoutes = require("./questionRoutes");
router.use("/:testId/questions", questionRoutes);

module.exports = router;
