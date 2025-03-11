//src / routes / authRoutes.js;
const express = require("express");
const router = express.Router();

const {
  registerUser,
  loginUser,
  logoutUser,
  checkTestCreatorPassword,
} = require("../controllers/authController");

router.post("/register", registerUser);
router.post("/login", loginUser);
router.post("/logout", logoutUser);
router.post("/check-creator-password", checkTestCreatorPassword);



module.exports = router;
