const recordsTableModel = require("../models/recordsModel");
const rulesTableModel = require("../models/rulesModel");
const getManagedRules = require("../utils/getManagedRules");

exports.createNewRule = async (req, res) => {
  try {
    const newRule = await rulesTableModel.create(req.body);
    await recordsTableModel.findOneAndUpdate(
      { assignedTo: req.body.assignedTo, taskName: req.body.taskName },
      { $set: { rule: newRule._id } }
    );
    res.status(200).json({ status: "success", data: newRule });
  } catch (err) {
    console.error(err);
    res.status(400).json({
      status: "fail",
      message: err.message,
    });
  }
};

exports.getManageRules = async (req, res) => {
  try {
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
    res.status(400).json({ status: "fail", message: err.message });
  }
};

exports.doesRuleExist = async (req, res) => {
  try {
    const data = (await rulesTableModel.findById(req.params.id)) || null;
    res.status(200).json({ status: "success", data });
  } catch (err) {
    console.error(err);
    res.status(400).json({ status: "fail", message: err.message });
  }
};

exports.updateRule = async (req, res) => {
  try {
    const updatedRule = await rulesTableModel.findByIdAndUpdate(
      req.params.ruleId,
      req.body,
      { new: true }
    );

    res.status(200).json({ status: "success", data: updatedRule });
  } catch (err) {
    console.error(err);
    res.status(400).json({ status: "fail", message: err.message });
  }
};
