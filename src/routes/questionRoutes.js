//src/routes/questionRoutes.js
const express = require("express");
const router = express.Router({ mergeParams: true });

const {
  createQuestion,
  getQuestions,
  updateQuestion, 
  deleteQuestion,
} = require("../controllers/questionController");

const authMiddleware = require("../middleware/authMiddleware");
const checkRole = require("../middleware/checkRole");
const { TEST_CREATOR } = require("../constants/roles");
const checkTestExists = require("../middleware/checkTestExists");
const imageUploadMiddleware = require("../middleware/imageUploadMiddleware");

const answerRoutes = require("./answerRoutes");

router.use(authMiddleware, checkRole([TEST_CREATOR]), checkTestExists);


router.post("/", imageUploadMiddleware, createQuestion);
router.get("/",getQuestions);
router.put("/:questionId", imageUploadMiddleware, updateQuestion);
router.delete("/:questionId", deleteQuestion);

router.use("/:questionId/answers", answerRoutes);

module.exports = router;
