// src/middleware/authMiddleware.js
const User = require("../models/User");
const { verify } = require("../helpers/token");

module.exports = async function (req, res, next) {
  try {
    const token = req.cookies.token;

    if (!token) {
      return res.status(401).json({ error: "No token provided" });
    }

    let tokenData;
    try {
      tokenData = verify(token);
    } catch (error) {
      return res.status(401).json({ error: "Invalid or expired token" });
    }

    const user = await User.findOne({ _id: tokenData.id });

    if (!user) {
      return res.status(401).json({ error: "Authentication user not found" });
    }

    req.user = user;

    next();
  } catch (error) {
    return res.status(500).json({ error: "Internal server error" });
  }
};
