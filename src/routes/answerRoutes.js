//src / routes /answerRoutes.js
const express = require("express");
const router = express.Router({ mergeParams: true });

const {
  createAnswer,
  getAnswers,
  updateAnswer,
  deleteAnswer,
} = require("../controllers/answerController");

const authMiddleware = require("../middleware/authMiddleware");
const checkRole = require("../middleware/checkRole");
const checkQuestionExists = require("../middleware/checkQuestionExists");
const { TEST_CREATOR } = require("../constants/roles");

router.use(authMiddleware, checkRole([TEST_CREATOR]), checkQuestionExists);

router.post("/", createAnswer);
router.get("/", getAnswers);
router.patch("/:answerId", updateAnswer);
router.delete("/:answerId", deleteAnswer);

module.exports = router;
