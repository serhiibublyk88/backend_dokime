// helpers/testMapper.js
const mapTestToDto = (test) => ({
  id: test._id || "",
  title: test.title || "Без названия",
  description: test.description || "",
  author: test.author
    ? {
        id: test.author._id || "unknown",
        username: test.author.username || "unknown",
      }
    : { id: "unknown", username: "unknown" }, 
  timeLimit: test.timeLimit ?? 0,
  status: test.status || "inactive",
  createdAt: test.createdAt || new Date().toISOString(),
  availableForGroups: Array.isArray(test.availableForGroups)
    ? test.availableForGroups.map((group) => ({
        id: group._id || "unknown",
        name: group.name || "Без названия",
      }))
    : [],
  maximumMarks: test.maximumMarks ?? 0,
  minimumScores:
    test.minimumScores instanceof Map
      ? Array.from(test.minimumScores.entries()).reduce(
          (result, [grade, minPercentage]) => {
            result[grade] = minPercentage ?? 0;
            return result;
          },
          {}
        )
      : {},
  questions: Array.isArray(test.questions)
    ? test.questions.map((q) => ({
        id: q._id || "unknown",
        text: q.text || "Без текста",
      }))
    : [], // ✅ Добавляем `questions`
});

module.exports = {
  mapTestToDto,
};
