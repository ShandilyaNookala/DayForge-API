const recordsTableModel = require("../models/recordsModel");

const calcDate = require("../utils/calcDate");
const catchAsync = require("../utils/catchAsync");

exports.integrateTestTakingApp = catchAsync(async (req, res) => {
  const results = req.body.score;
  const taskName = req.body.categoryName;
  const recordName = req.body.testName;
  const task = (
    await recordsTableModel.findOne({
      taskName,
      assignedTo: req.body.userName,
    })
  ).toObject();
  const noOfMistakes = results.split("/")[1] - results.split("/")[0];
  let nextTask;
  let grade;
  if (noOfMistakes >= 4) {
    grade = 2;
    nextTask = recordName;
  } else {
    grade = !noOfMistakes ? 5 : noOfMistakes === 1 ? 4 : 6 - noOfMistakes;
    nextTask = req.body.nextTask;
  }
  const today = calcDate(new Date());
  let tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow = calcDate(tomorrow);
  for (let i = task.works.length - 1; i > -1; i--) {
    if (task.dates[i] === today && task.works[i] === recordName) {
      task.results[i] = results;
      task.grades[i] = grade;
      break;
    }
  }
  if (nextTask) {
    task.dates.push(tomorrow);
    task.works.push(nextTask);
    task.timeTaken.push("");
    task.results.push("");
    task.grades.push("");
    task.comments.push("");
  }
  await recordsTableModel.findOneAndUpdate(
    { taskName, assignedTo: req.body.userName },
    task
  );
  res.status(200).json({
    status: "success",
    returnedData: task,
  });
});

exports.getCurrentTest = catchAsync(async (req, res) => {
  const taskName = req.params.categoryName;
  const task = await recordsTableModel.findOne({
    assignedTo: req.params.userName,
    taskName,
  });
  const today = calcDate(new Date());
  let tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow = calcDate(tomorrow);
  const lastTask = [];
  task.works.forEach((el, i) => {
    if (task.dates[i] === today || task.dates[i] === tomorrow) {
      lastTask.push(el);
    }
  });
  res.status(200).json({
    status: "success",
    data: lastTask,
  });
});
