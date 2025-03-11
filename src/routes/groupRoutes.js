// src/routes/groupRoutes.js
const express = require("express");
const router = express.Router();
const {
  getAllGroups,
  createGroup,
  updateGroup,
  deleteGroup,
  getGroupDetails,
  removeMemberFromGroup,
  editMemberInGroup,
} = require("../controllers/groupController");
const authMiddleware = require("../middleware/authMiddleware");
const checkRole = require("../middleware/checkRole");
const { TEST_CREATOR } = require("../constants/roles");

router.get("/public", getAllGroups);

router.use(authMiddleware, checkRole([TEST_CREATOR]));

router.get("/", getAllGroups);
router.post("/", createGroup);
router.put("/:groupId", updateGroup);
router.delete("/:groupId", deleteGroup);

router.get("/:groupId", getGroupDetails);
router.delete("/:groupId/member/:memberId", removeMemberFromGroup);
router.put("/:groupId/member/:memberId", editMemberInGroup);

module.exports = router;
