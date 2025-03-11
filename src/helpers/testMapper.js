// helpers/testMapper.js
const mapTestToDto = (test) => ({
  id: test._id,
  title: test.title,
  description: test.description,
  timeLimit: test.timeLimit,
  status: test.status,
  createdAt: test.createdAt,//
  availableForGroups: test.availableForGroups.map((group) => ({
    id: group._id,
    name: group.name,
  })),
  maximumMarks: test.maximumMarks,
  minimumScores: Array.from(test.minimumScores.entries()).reduce(
    (result, [grade, minPercentage]) => {
      result[grade] = minPercentage;
      return result;
    },
    {}
  ),
});

module.exports = {
  mapTestToDto,
};
