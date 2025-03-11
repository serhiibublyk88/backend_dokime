// src/controllers/groupController.js
const Group = require("../models/Group");
const { mapGroups } = require("../helpers/groupMapper");
const { mapGroupMembers } = require("../helpers/membersGroupMapper");
const User = require("../models/User"); 


// Получаем все группы из базы данных
async function getAllGroups(req, res) {
  try {
    const groups = await Group.find()
      .populate("members", "username")
      .populate("createdBy", "username");

    const groupsWithCreatorCheck = groups.map((group) => {
      if (!group.createdBy) {
        group.createdBy = { username: "Unknown" };
      }
      return group;
    });

    const formattedGroups = mapGroups(groupsWithCreatorCheck);

    res.status(200).json(formattedGroups);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error fetching groups", error: error.message });
  }
}

// Создание новой группы
async function createGroup(req, res) {
  try {
    const { name, description, members } = req.body;
    const newGroup = new Group({
      name,
      description,
      members: [],
      createdBy: req.user._id,
    });

    await newGroup.save();
    res
      .status(201)
      .json({ message: "Group created successfully", group: newGroup });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error creating group", error: error.message });
  }
}

// Обновление группы
async function updateGroup(req, res) {
  try {
    const { groupId } = req.params;
    const updatedData = req.body;

    const updatedGroup = await Group.findByIdAndUpdate(groupId, updatedData, {
      new: true,
    });

    if (!updatedGroup) {
      return res.status(404).json({ message: "Group not found" });
    }

    res
      .status(200)
      .json({ message: "Group updated successfully", group: updatedGroup });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error updating group", error: error.message });
  }
}

// Удаление группы
async function deleteGroup(req, res) {
  try {
    const { groupId } = req.params;

    const deletedGroup = await Group.findByIdAndDelete(groupId);

    if (!deletedGroup) {
      return res.status(404).json({ message: "Group not found" });
    }

    res.status(200).json({ message: "Group deleted successfully" });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error deleting group", error: error.message });
  }
}

// Получение информации о группе и участниках
async function getGroupDetails(req, res) {
  try {
    const { groupId } = req.params;

    const group = await Group.findById(groupId).populate(
      "members",
      "_id username email role"
    );

    if (!group) {
      return res.status(404).json({ message: "Group not found" });
    }

    
    const groupsForCarousel = await Group.find({}, "_id name");
    

    const members = mapGroupMembers(group.members);

    res.status(200).json({
      groupDetails: group,
     
      groupsForCarousel: groupsForCarousel.map((g) => ({
        id: g._id,
        name: g.name,
      })),
      members,
    });
  } catch (error) {
   
    res.status(500).json({
      message: "Error fetching group details",
      error: error.message,
    });
  }
}
// Удаление участника из группы
async function removeMemberFromGroup(req, res) {
  try {
    const { groupId, memberId } = req.params;

    const group = await Group.findOne({
      _id: groupId,
      members: memberId,
    });

    if (!group) {
      return res.status(404).json({ message: "Group or member not found" });
    }

    await Group.updateOne({ _id: groupId }, { $pull: { members: memberId } });

    res.status(200).json({ message: "Member removed successfully" });
  } catch (error) {
    console.error("Error removing member from group:", error);
    res.status(500).json({
      message: "Error removing member from group",
      error: error.message,
    });
  }
}

// 🔹 Редактирование имени участника в группе

async function editMemberInGroup(req, res) {
  try {
    const { groupId, memberId } = req.params;
    const { newName } = req.body;

    if (!newName || newName.trim() === "") {
      return res.status(400).json({ message: "Ein Name kann nicht leer sein" });
    }

    // ✅ Проверяем, есть ли пользователь в группе
    const group = await Group.findOne({
      _id: groupId,
      members: memberId,
    });

    if (!group) {
      return res.status(404).json({ message: "Group or member not found" });
    }

    // ✅ Обновляем имя пользователя в базе
    const updatedUser = await User.findByIdAndUpdate(
      memberId,
      { username: newName },
      { new: true, select: "_id username email role" }
    );

    if (!updatedUser) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json(updatedUser);
  } catch (error) {
    console.error("Error editing member in group:", error);
    res.status(500).json({
      message: "Error editing member in group",
      error: error.message,
    });
  }
}



module.exports = {
  getAllGroups,
  createGroup,
  updateGroup,
  deleteGroup,
  getGroupDetails,
  removeMemberFromGroup,
  editMemberInGroup,
};
