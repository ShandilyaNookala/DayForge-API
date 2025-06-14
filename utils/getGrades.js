const gradeTexts = [
  "Birdie",
  "Obsolete",
  "Below Average",
  "Average",
  "Above Average",
  "Excellent",
];

module.exports = function getGrades(grade) {
  if (!Number.isInteger(grade)) return null;
  else return gradeTexts[grade];
};
