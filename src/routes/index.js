// src/routes/index.js
const express = require("express");

const authRoutes = require("./authRoutes")
const userRoutes = require("./userRoutes");
const testRoutes = require("./testRoutes");
const questionRoutes = require("./questionRoutes");
const answerRoutes = require("./answerRoutes");
const groupRoutes = require("./groupRoutes");



const router = express.Router({ mergeParams: true });

router.use("/auth", authRoutes);
router.use("/users", userRoutes);
router.use("/groups", groupRoutes);
router.use("/tests", testRoutes);
router.use("/tests/:testId/questions", questionRoutes);
router.use("/tests/:testId/questions/:questionId/answers", answerRoutes);



module.exports = router;
