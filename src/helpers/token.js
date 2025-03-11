//helpers/token.js
const jwt = require("jsonwebtoken");

const sign = process.env.JWT_SECRET || "default_secret";

module.exports = {
  generate(data) {
    return jwt.sign(data, sign, { expiresIn: "3h" });
  },

  verify(token) {
    try {
      return jwt.verify(token, sign);
    } catch (error) {
      throw new Error("Invalid or expired token");
    }
  },
};
