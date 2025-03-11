//src / controllers / authController.js;
const bcrypt = require("bcrypt");
const User = require("../models/User");
const Group = require("../models/Group");
const { generate } = require("../helpers/token");
const { TEST_CREATOR, USER } = require("../constants/roles");
require("dotenv").config();

const TEST_CREATOR_PASSWORD = process.env.TEST_CREATOR_PASSWORD;
const TEST_CREATOR_PASSWORD_HASH = bcrypt.hashSync(TEST_CREATOR_PASSWORD, 10);

async function checkTestCreatorPassword(req, res) {
  const { password } = req.body;

  if (!password) {
    return res.status(400).json({ message: "Password is required" });
  }

  const isPasswordValid = await bcrypt.compare(
    password,
    TEST_CREATOR_PASSWORD_HASH
  );

  if (!isPasswordValid) {
    return res
      .status(401)
      .json({ success: false, message: "Incorrect password" });
  }

  return res
    .status(200)
    .json({ success: true, message: "Password is correct" });
}

async function registerUser(req, res) {
  const { username, email, password, role, groupId } = req.body;

  if (!password || !username || !email) {
    return res
      .status(400)
      .json({ message: "Username, email, and password are required" });
  }

try {
  
 
  
  const existingUserByEmail = await User.findOne({ email });
  if (existingUserByEmail) {
    return res
      .status(400)
      .json({ message: "Bitte geben Sie eine gültige E-Mail-Adresse ein." });
  }

  let userRole = USER;
  let group = null;

  if (role === TEST_CREATOR) {
    userRole = TEST_CREATOR;
  } else if (role === USER) {
    if (!groupId) {
      return res.status(400).json({ message: "Group is required for users" });
    }

    group = await Group.findById(groupId);
    if (!group) {
      return res.status(404).json({ message: "Group not found" });
    }
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const newUser = new User({
    username,
    email,
    password: hashedPassword,
    role: userRole,
    group: group ? group._id : null,
  });

  await newUser.save();

  if (userRole === USER) {
    group.members.push(newUser._id);
    await group.save();
  }

  const token = generate({ id: newUser._id, role: newUser.role });

  res.cookie("token", token, { httpOnly: true });

  return res.status(201).json({
    message: "User registered successfully",
    user: newUser,
  });
} catch (error) {
  console.error(error);
  return res.status(500).json({ message: "Error registering user" });
}
}


async function loginUser(req, res) {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: "Email and password are required" });
  }

  try {
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(401).json({ message: "User not found" });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const token = generate({ id: user._id, role: user.role });

    res.cookie("token", token, { httpOnly: true });

    return res.status(200).json({ message: "Login successful", user });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Server error" });
  }
}

function logoutUser(req, res) {
  res.clearCookie("token");

  return res.status(200).json({ message: "Logout successful" });
}

module.exports = {
  registerUser,
  loginUser,
  logoutUser,
  checkTestCreatorPassword,
};
