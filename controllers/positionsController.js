const positionsTableModel = require("../models/positionsModel");
const aggregatePositions = require("../utils/aggregatePositions");
const catchAsync = require("../utils/catchAsync");

exports.getPositions = catchAsync(async (req, res) => {
  const allPositions = await aggregatePositions();
  res.status(200).json({
    status: "success",
    data: allPositions,
  });
});

exports.updatePositions = catchAsync(async (req, res) => {
  const newTasks = req.body;
  await Promise.all(
    newTasks.positions.map((position) =>
      positionsTableModel.findOneAndUpdate(
        {
          student: newTasks.studentId,
          position: position.position,
        },
        { tasks: position.tasks }
      )
    )
  );
  const allPositions = await aggregatePositions();
  res.status(200).json({
    status: "success",
    data: allPositions,
  });
});
