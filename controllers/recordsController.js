const recordsTableModel = require("../models/recordsModel");
const positionsTableModel = require("../models/positionsModel");
const insertInArray = require("../utils/insertInArray");
const aggregatePositions = require("../utils/aggregatePositions");
const getManagedRules = require("../utils/getManagedRules");
const getNextDate = require("../utils/getNextDate");
const getCurrentDate = require("../utils/getCurrentDate");
const mongoose = require("mongoose");
const compareDates = require("../utils/compareDates");
const computeNextDayWork = require("../utils/computeNextDayWork");
const computeNextDayGrade = require("../utils/computeNextDayGrade");
const getIPLocationOfUser = require("../utils/getIPLocationOfUser");
const authController = require("./authController");

async function getCommonRecordsData(newRecords, req) {
  newRecords = newRecords.toObject();
  const timezone = getIPLocationOfUser(req);

  const positions = await positionsTableModel.findOne({
    tasks: { $in: [new mongoose.Types.ObjectId(newRecords._id)] },
  });
  const indexOfTask = positions.tasks.indexOf(newRecords._id);
  const previousTask = positions.tasks[indexOfTask - 1];
  const nextTask = positions.tasks[indexOfTask + 1];

  newRecords.records.forEach((record) => {
    record.isEditable = isDateGreaterThanOrEqualToToday(record.date, timezone);
    record.isResultsMovable =
      isDateGreaterThanOrEqualToToday(record.date, timezone) &&
      !record.result &&
      !record.grade &&
      record.startTime &&
      record.endTime;
    record.isTimeTakenMovable =
      isDateGreaterThanOrEqualToToday(record.date, timezone) &&
      !record.startTime &&
      !record.endTime;
  });
  newRecords.rule = newRecords.rule?._id;
  return { ...newRecords, previousTask, nextTask };
}

function canMarkObsolete(currentRecord) {
  return (
    Boolean(currentRecord) &&
    currentRecord.grade === null &&
    currentRecord.result === null
  );
}

function isDateGreaterThanOrEqualToToday(date, timezone) {
  const localDate = getCurrentDate(timezone);
  return (
    new Date(date) >= new Date(localDate) ||
    compareDates(localDate, new Date(date), timezone)
  );
}

exports.getRecords = async (req, res) => {
  try {
    const response = await recordsTableModel
      .findById(req.params.id)
      .populate("rule");

    if (
      !req.user.isAdmin &&
      req.user._id.toString() !== response.student.toString()
    ) {
      return res.status(403).json({
        status: "fail",
        message: "You do not have permission to access these records.",
      });
    }

    res.status(200).json({
      status: "success",
      data: await getCommonRecordsData(response, req),
    });
  } catch (err) {
    console.error(err);
    res.status(400).json({
      status: "fail",
      message: err.message,
    });
  }
};

exports.updateOrCreateRecordInArray = async (req, res) => {
  async function addRecordToArray(data) {
    return await recordsTableModel
      .findByIdAndUpdate(
        req.params.taskId,
        { $push: { records: data } },
        { new: true }
      )
      .populate("rule");
  }

  try {
    if (req.body.result !== null && req.body.result !== undefined) {
      authController.restrictTo("admin")(req, res, () => {});
    }
    const { recordId } = req.params;
    const keysToConvertToObjectId = ["work", "result", "nextWork"];
    const timezone = getIPLocationOfUser(req);

    keysToConvertToObjectId.forEach((key) => {
      if (Array.isArray(req.body[key])) {
        req.body[key] = req.body[key].map(
          (id) => new mongoose.Types.ObjectId(id)
        );
      }
    });

    let newRecords;
    if (!recordId || recordId === "null") {
      newRecords = await addRecordToArray(req.body);
    } else {
      const valuesToSet = {};
      Object.keys(req.body).forEach(
        (key) =>
          key !== "nextWork" &&
          (valuesToSet[`records.$[elem].${key}`] = req.body[key])
      );
      newRecords = await recordsTableModel
        .findByIdAndUpdate(
          req.params.taskId,
          { $set: valuesToSet },
          {
            new: true,
            arrayFilters: [{ "elem._id": recordId }],
          }
        )
        .populate("rule");
      if (
        (!Array.isArray(req.body.nextWork) && req.body.nextWork) ||
        (Array.isArray(req.body.nextWork) && req.body.nextWork.length)
      ) {
        const data = {
          date: getNextDate(timezone),
          work: req.body.nextWork,
        };
        newRecords = await addRecordToArray(data);
      }
    }

    res.status(200).json({
      status: "success",
      data: await getCommonRecordsData(newRecords, req),
    });
  } catch (err) {
    console.error(err);
    res.status(400).json({
      status: "fail",
      message: err.message,
    });
  }
};

exports.updateManageRules = async (req, res) => {
  try {
    const taskIds = req.body.taskIds;
    const ruleId = req.body.ruleId;
    await recordsTableModel.updateMany(
      { _id: { $in: taskIds } },
      { rule: ruleId }
    );
    const { managedRules, tasksWithNoRule } = await getManagedRules();
    res.status(200).json({
      status: "success",
      data: {
        rows: managedRules,
        tasksWithNoRule,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(400).json({
      status: "fail",
      message: err.message,
    });
  }
};

exports.updateThresholdPoints = async (req, res) => {
  try {
    const taskId = req.params.taskId;
    const response = await recordsTableModel
      .findByIdAndUpdate(taskId, {
        threshold: req.body.threshold,
        noOfProblems: req.body.noOfProblems,
      })
      .populate("rule");

    res.status(200).json({
      status: "success",
      data: await getCommonRecordsData(response, req),
    });
  } catch (err) {
    console.error(err);
    res.status(400).json({
      status: "fail",
      message: err.message,
    });
  }
};

exports.updateRuleForTask = async (req, res) => {
  try {
    const taskId = req.params.taskId;
    const ruleId = req.body.ruleId;
    const updatedTask = await recordsTableModel
      .findByIdAndUpdate(taskId, { rule: ruleId }, { new: true })
      .populate("rule");

    res.status(200).json({
      status: "success",
      data: await getCommonRecordsData(updatedTask, req),
    });
  } catch (err) {
    console.error(err);
    res.status(400).json({
      status: "fail",
      message: err.message,
    });
  }
};

exports.updateSkippedRuleCategories = async (req, res) => {
  try {
    const taskId = req.params.taskId;
    const { skippedRuleCategories } = req.body;
    const updatedTask = await recordsTableModel
      .findByIdAndUpdate(taskId, { skippedRuleCategories }, { new: true })
      .populate("rule");

    res.status(200).json({
      status: "success",
      data: await getCommonRecordsData(updatedTask, req),
    });
  } catch (err) {
    console.error(err);
    res.status(400).json({
      status: "fail",
      message: err.message,
    });
  }
};

exports.getStudentTasks = async (req, res) => {
  try {
    const timezone = getIPLocationOfUser(req);
    const formattedDate = getCurrentDate(timezone);
    const returned = await positionsTableModel
      .findOne({
        student: req.user._id,
        position: "currentTasks",
      })
      .populate({
        path: "tasks",
        select: "taskName records",
        populate: { path: "rule" },
      });
    const dataGridData = returned.tasks.map((task, i) => {
      const currentRecord = task.records?.find((record) =>
        compareDates(record.date, formattedDate, timezone)
      );
      return {
        ...currentRecord?.toObject(),
        number: i + 1,
        taskName: task.taskName,
        id: task._id,
        checkable:
          canMarkObsolete(currentRecord) &&
          compareDates(formattedDate, new Date(), timezone),
      };
    });
    res.status(200).json({
      status: "success",
      data: dataGridData,
    });
  } catch (err) {
    console.error(err);
    res.status(400).json({
      status: "fail",
      message: err.message,
    });
  }
};

exports.getAutomaticDataWithMistakes = async (req, res) => {
  try {
    const { mistakes } = req.body;
    const record = await recordsTableModel
      .findById(req.params.taskId, {
        records: { $elemMatch: { _id: req.params.recordId } },
      })
      .select("rule threshold noOfProblems records skippedRuleCategories")
      .populate("rule");

    const data = computeNextDayWork(
      null,
      record.rule,
      true,
      record.records[0].work,
      mistakes,
      record.noOfProblems,
      record.threshold,
      record.skippedRuleCategories || []
    );

    const arr = record.records[0].work;
    if (Array.isArray(arr)) {
      const S = arr.reduce((acc, val) => acc + val?.points, 0);
      const R = arr.reduce((acc, val) => acc + 1 / val?.points, 0);

      const scale = S / R;
      const weightedMistakes = arr.map((val) => scale * (1 / val?.points));

      data.grade = computeNextDayGrade(
        record.records[0].work,
        mistakes,
        weightedMistakes
      );
    }

    if (!data.grade) data.grade = 5;

    res.status(200).json({
      status: "success",
      data,
    });
  } catch (err) {
    console.error(err);
    res.status(400).json({
      status: "fail",
      message: err.message,
    });
  }
};

exports.addRecord = async (req, res) => {
  try {
    const newRecord = await recordsTableModel.create({
      taskName: req.body.taskName,
      student: req.body.studentId,
    });
    await positionsTableModel.findOneAndUpdate(
      {
        student: req.body.studentId,
        position: "currentTasks",
      },
      { $push: { tasks: newRecord._id } },
      { new: true }
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

exports.updateTaskName = async (req, res) => {
  try {
    await recordsTableModel.findByIdAndUpdate(req.params.taskId, {
      taskName: req.body.taskName,
    });
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

exports.getAutomaticData = async (req, res) => {
  try {
    const { taskId } = req.params;
    const { recordId } = req.query;
    const timezone = getIPLocationOfUser(req);

    let recordAndRule;

    if (recordId) {
      const result = await recordsTableModel
        .findById(taskId)
        .select({
          _id: 1,
          rule: 1,
          threshold: 1,
          noOfProblems: 1,
          skippedRuleCategories: 1,
          records: { $elemMatch: { _id: recordId } },
        })
        .populate("rule");

      recordAndRule = { ...result.toObject(), records: result.records[0] };
    } else {
      const [result] = await recordsTableModel.aggregate([
        { $match: { _id: new mongoose.Types.ObjectId(taskId) } },
        {
          $project: {
            rule: 1,
            threshold: 1,
            noOfProblems: 1,
            skippedRuleCategories: 1,
            records: { $slice: ["$records", -1] },
          },
        },
        {
          $lookup: {
            from: "rules",
            localField: "rule",
            foreignField: "_id",
            as: "rule",
          },
        },
        { $unwind: "$rule" },
      ]);
      recordAndRule = { ...result, records: result?.records[0] };
    }

    const { rule, records, threshold, noOfProblems, skippedRuleCategories } =
      recordAndRule;
    let {
      work: currentWork,
      date: currentNextDate,
      result: mistakes,
    } = records || {};
    const isAdding = !recordId;

    const nextDate = isAdding ? getCurrentDate(timezone) : currentNextDate;

    const data = computeNextDayWork(
      nextDate,
      rule,
      isAdding,
      currentWork,
      mistakes,
      noOfProblems,
      threshold,
      skippedRuleCategories || []
    );

    res.status(200).json({ status: "success", data });
  } catch (err) {
    console.error(err);
    res.status(400).json({ status: "fail", message: err.message });
  }
};

exports.markObsolete = async (req, res) => {
  try {
    const tasksToMarkObsolete = req.body.tasksToMarkObsolete;
    const timezone =
      req.user.role !== "semi-admin"
        ? getIPLocationOfUser(req)
        : process.env.DEFAULT_TIMEZONE;
    const localDate = getCurrentDate(timezone);
    const nextDateUtc = getNextDate(timezone);
    let tasks;
    if (req.user.role === "semi-admin") {
      const allPositions = await positionsTableModel
        .find({ position: "currentTasks" })
        .select("tasks")
        .populate({ path: "tasks", select: "records" });
      tasks = allPositions.flatMap((position) => position.tasks);
    } else {
      tasks = await recordsTableModel.find({
        _id: { $in: tasksToMarkObsolete },
        student: req.user._id,
      });
    }
    await Promise.all(
      tasks.map(async (task) => {
        let newRecords = null;
        task.records.reverse().some((record, i) => {
          if (
            canMarkObsolete(record) &&
            compareDates(localDate, record.date, timezone)
          ) {
            newRecords = task.records;
            newRecords[i].result = "Automated Obsolete";
            newRecords[i].comment = "Automated Obsolete";
            newRecords[i].grade = 1;
            const recordToInsert = {
              date: nextDateUtc,
              work: newRecords[i].work,
            };
            insertInArray(newRecords, i, recordToInsert);
            return true;
          } else return false;
        });
        if (newRecords)
          await recordsTableModel.findByIdAndUpdate(
            task._id,
            { records: newRecords },
            { new: true }
          );
      })
    );
    res.status(200).json({
      status: "success",
      message: "Automated Obsolete Records Created",
    });
  } catch (err) {
    console.error(err);
    res.status(400).json({
      status: "fail",
      message: err.message,
    });
  }
};
