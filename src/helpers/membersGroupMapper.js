// src/helpers/membersGroupMapper.js

function mapGroupMembers(members) {
  return members.map((member, index) => ({
    order: index + 1,
    name: member.username,
    email: member.email,
  }));
}

module.exports = { mapGroupMembers };
