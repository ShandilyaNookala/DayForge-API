module.exports = function computeNextDayWork(
  nextDate,
  rule,
  isAdding,
  currentWork,
  mistakes,
  noOfProblems,
  threshold
) {
  const data = {
    nextDate,
    work: null,
  };
  if ((rule && isAdding) || (typeof currentWork !== "string" && rule)) {
    let returnedArr;

    if (!Array.isArray(currentWork)) currentWork = [];

    const indexesChecked = new Set();
    const ruleInputsMap = new Map(
      rule.ruleInputs.map((obj, index) => [String(obj._id), index])
    );
    const indexWork = currentWork.map((work) =>
      ruleInputsMap.get(String(work._id))
    );
    if (isAdding) {
      indexWork.sort((a, b) => a - b);

      let sumPoints = 0;
      Array.isArray(mistakes) &&
        mistakes?.forEach((mistakeId) => {
          const index = ruleInputsMap.get(mistakeId);
          if (index !== undefined) {
            indexesChecked.add(index);
            sumPoints += rule.ruleInputs[index].points;
          }
        });

      const points = rule.ruleInputs.map((input) => input.points);
      if (sumPoints < noOfProblems) {
        const startIndex =
          indexWork.length !== 0 ? indexWork[indexWork.length - 1] + 1 : 0;
        if (startIndex >= rule.ruleInputs.length) {
          returnedArr = rule.ruleInputs.map((ruleInput) => ({
            name: ruleInput.name,
            checked: mistakes?.some(
              (mistakeId) => mistakeId === String(ruleInput._id)
            ),
            id: ruleInput._id,
          }));
        } else {
          for (let i = startIndex; i < rule.ruleInputs.length; i++) {
            sumPoints += points[i];
            if (sumPoints > noOfProblems + threshold) {
              sumPoints -= points[i];
              break;
            }
            indexesChecked.add(i);
            if (sumPoints === noOfProblems) break;
          }
          returnedArr = rule.ruleInputs.map((ruleInput, i) => ({
            name: ruleInput.name,
            checked: indexesChecked.has(i),
            id: ruleInput._id,
          }));
        }
      } else {
        returnedArr = rule.ruleInputs.map((ruleInput, i) => ({
          name: ruleInput.name,
          checked: indexesChecked.has(i),
          id: ruleInput._id,
        }));
      }
    } else {
      returnedArr = rule.ruleInputs.map((ruleInput, i) => ({
        name: ruleInput.name,
        checked: indexWork.includes(i),
        id: ruleInput._id,
      }));
    }
    data.work = returnedArr;
  } else if (!isAdding) {
    data.work = currentWork;
  }

  return data;
};
