const { default: mongoose } = require("mongoose");
const positionsTableModel = require("../models/positionsModel");

module.exports = async function getPreviousAndNextTask(currentTaskId) {
  const positions = await positionsTableModel.findOne({
    tasks: { $in: [new mongoose.Types.ObjectId(currentTaskId)] },
  });
  const indexOfTask = positions.tasks.indexOf(currentTaskId);
  const previousTask = positions.tasks[indexOfTask - 1];
  const nextTask = positions.tasks[indexOfTask + 1];
  return {
    previousTask,
    nextTask,
  };
};
