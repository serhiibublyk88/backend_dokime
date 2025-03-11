// src/routes/userRoutes.js
const express = require("express");
const router = express.Router();
const {
  getAvailableTests,
  getUserResults,
  createTestAttemptAndGetQuestions,
  submitTestAttempt,
  getTestAttempt,
 
} = require("../controllers/userController");

const authMiddleware = require("../middleware/authMiddleware");
const checkRole = require("../middleware/checkRole");
const { USER } = require("../constants/roles");

router.use(authMiddleware, checkRole([USER]));

router.get("/available", getAvailableTests);
router.get("/results", getUserResults);
router.post("/tests/:testId/attempts", createTestAttemptAndGetQuestions);
router.post("/tests/:testId/attempts/:attemptId/submit", submitTestAttempt);
router.get("/tests/:testId/attempts/:attemptId", getTestAttempt);


module.exports = router;
