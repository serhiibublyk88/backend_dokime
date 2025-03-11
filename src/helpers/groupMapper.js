// src/helpers/groupMapper.js
function mapGroups(groups) {
  return groups.map((group) => ({
    id: group._id,
    name: group.name,
    description: group.description,
    membersCount: group.members.length,
    createdBy: group.createdBy.username,
    createdAt: group.createdAt.toLocaleString("en-GB", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    }),
  }));
}

module.exports = { mapGroups };
