// src/middleware/testExistenceMiddleware.js
const Test = require("../models/Test");
const mongoose = require("mongoose");

async function checkTestExists(req, res, next) {
  try {
    const { testId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(testId)) {
      return res.status(400).json({ message: "Invalid test ID format." });
    }

    const test = await Test.findById(testId);
    if (!test) {
      return res.status(404).json({ message: "Test not found." });
    }

    req.test = test;
    next();
  } catch (error) {
    console.error("Error checking test existence:", error.message);
    return res.status(500).json({ message: "Server error occurred." });
  }
}

module.exports = checkTestExists;
