const positionsTableModel = require("../models/positionsModel");
const aggregatePositions = require("../utils/aggregatePositions");

exports.getPositions = async (req, res) => {
  try {
    const allPositions = await aggregatePositions();
    res.status(200).json({
      status: "success",
      data: allPositions,
    });
  } catch (err) {
    console.error(err);
    res.status(400).json({
      status: "fail",
      message: err.message,
    });
  }
};

exports.updatePositions = async (req, res) => {
  try {
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
  } catch (err) {
    console.error(err);
    res.status(400).json({
      status: "fail",
      message: err.message,
    });
  }
};
