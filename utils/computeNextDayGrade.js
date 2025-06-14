module.exports = function computeNextDayGrade(
  currentWork,
  mistakes,
  weightedMistakes
) {
  const weightedSum = weightedMistakes.reduce((acc, curr) => acc + curr, 0);
  const sum = currentWork.reduce(
    (acc, cur, i) =>
      mistakes.includes(String(cur._id)) ? acc + weightedMistakes[i] : acc,
    0.0
  );
  const percentCorrect =
    weightedSum === 0 ? 0 : parseFloat((1 - sum / weightedSum).toFixed(2));
  if (percentCorrect <= 0.3333) return 2;
  else if (percentCorrect <= 0.6666) return 3;
  else if (percentCorrect <= 0.9999) return 4;
  else return 5;
};
