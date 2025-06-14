const positionsTableModel = require("../models/positionsModel");

module.exports = async function aggregatePositions() {
  return await positionsTableModel.aggregate([
    {
      $lookup: {
        from: "records",
        let: { tasks: "$tasks" },
        pipeline: [
          { $match: { $expr: { $in: ["$_id", "$$tasks"] } } },
          { $addFields: { order: { $indexOfArray: ["$$tasks", "$_id"] } } },
          { $sort: { order: 1 } },
          { $project: { _id: 1, taskName: 1, rule: 1 } },
        ],
        as: "taskDetails",
      },
    },
    {
      $lookup: {
        from: "users",
        localField: "student",
        foreignField: "_id",
        as: "student",
      },
    },
    { $unwind: "$student" },
    {
      $group: {
        _id: { student: "$student", position: "$position" },
        tasks: { $first: "$taskDetails" },
      },
    },
    {
      $group: {
        _id: "$_id.student",
        positionsObj: {
          $push: { k: "$_id.position", v: "$tasks" },
        },
      },
    },
    {
      $addFields: {
        positionsObj: { $arrayToObject: "$positionsObj" },
      },
    },
    {
      $project: {
        _id: 0,
        studentName: "$_id.userName",
        studentId: "$_id._id",
        positions: [
          {
            position: "currentTasks",
            tasks: { $ifNull: ["$positionsObj.currentTasks", []] },
          },
          {
            position: "savedForLaterTasks",
            tasks: { $ifNull: ["$positionsObj.savedForLaterTasks", []] },
          },
          {
            position: "completedTasks",
            tasks: { $ifNull: ["$positionsObj.completedTasks", []] },
          },
        ],
      },
    },
    { $sort: { studentName: 1 } },
  ]);
};
