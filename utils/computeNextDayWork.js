const Decimal = require("decimal.js");

module.exports = function computeNextDayWork(
  nextDate,
  rule,
  isAdding,
  currentWork,
  mistakes,
  noOfProblems,
  threshold,
  skippedRuleCategories
) {
  const repeatableMistakeIds = new Set(
    (Array.isArray(mistakes) ? mistakes : [])
      .filter((mistake) => mistake && mistake.shouldRepeat)
      .map((mistake) => String(mistake.id))
  );
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

    const skippedRuleCategoriesSet = new Set(skippedRuleCategories.map(String));
    const skippedRuleInputsSet = new Set(
      rule.ruleInputs
        .filter((input) =>
          skippedRuleCategoriesSet.has(String(input.ruleCategoryId))
        )
        .map((input) => String(input._id))
    );

    const indexWork = currentWork.map((work) =>
      ruleInputsMap.get(String(work?._id))
    );
    if (isAdding) {
      noOfProblems = new Decimal(noOfProblems);
      indexWork.sort((a, b) => a - b);

      let sumPoints = new Decimal(0);
      Array.isArray(mistakes) &&
        mistakes?.forEach((mistake) => {
          const mistakeId = String(mistake.id);
          if (skippedRuleInputsSet.has(mistakeId)) return;
          const index = ruleInputsMap.get(mistakeId);
          if (mistake.shouldRepeat) {
            if (index !== undefined) {
              indexesChecked.add(index);
              if (!mistake.addMistakes)
                sumPoints = sumPoints.add(rule.ruleInputs[index].points);
            }
          }
        });

      const points = rule.ruleInputs.map((input) => input.points);
      if (sumPoints.lessThan(noOfProblems)) {
        const startIndex =
          indexWork.length !== 0 ? indexWork[indexWork.length - 1] + 1 : 0;
        if (startIndex >= rule.ruleInputs.length) {
          returnedArr = rule.ruleInputs.map((ruleInput) => ({
            name: ruleInput.name,
            checked:
              repeatableMistakeIds.has(String(ruleInput._id)) &&
              !skippedRuleInputsSet.has(String(ruleInput._id)),
            id: ruleInput._id,
          }));
        } else {
          for (let i = startIndex; i < rule.ruleInputs.length; i++) {
            if (skippedRuleInputsSet.has(String(rule.ruleInputs[i]._id)))
              continue;
            sumPoints = sumPoints.add(points[i]);
            if (sumPoints.greaterThanOrEqualTo(noOfProblems)) {
              if (sumPoints.greaterThan(noOfProblems.add(threshold)))
                sumPoints = sumPoints.sub(points[i]);
              else indexesChecked.add(i);
              break;
            }
            indexesChecked.add(i);
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
