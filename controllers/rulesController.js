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

exports.getRule = async (req, res) => {
  try {
    const data = (await rulesTableModel.findById(req.params.id)) || null;
    res.status(200).json({ status: "success", data });
  } catch (err) {
    console.error(err);
    res.status(400).json({ status: "fail", message: err.message });
  }
};

exports.updateRuleName = async (req, res) => {
  try {
    const response = await rulesTableModel.findByIdAndUpdate(
      req.params.ruleId,
      { name: req.body.newRuleName },
      { new: true }
    );
    res.status(200).json({ status: "success", data: response });
  } catch (err) {
    console.error(err);
    res.status(400).json({ status: "fail", message: err.message });
  }
};

exports.updateRuleCategory = async (req, res) => {
  try {
    const valuesToSet = {};
    valuesToSet[`ruleCategories.$[category].name`] =
      req.body.newRuleCategoryName;

    const response = await rulesTableModel.findByIdAndUpdate(
      req.params.ruleId,
      { $set: valuesToSet },
      {
        new: true,
        arrayFilters: [{ "category._id": req.params.ruleCategoryId }],
      }
    );
    res.status(200).json({ status: "success", data: response });
  } catch (err) {
    console.error(err);
    res.status(400).json({ status: "fail", message: err.message });
  }
};

exports.addRuleCategory = async (req, res) => {
  try {
    const response = await rulesTableModel.findByIdAndUpdate(
      req.params.ruleId,
      {
        $push: { ruleCategories: { name: req.body.newRuleCategoryName } },
      },
      { new: true }
    );
    res.status(200).json({ status: "success", data: response });
  } catch (err) {
    console.error(err);
    res.status(400).json({ status: "fail", message: err.message });
  }
};

exports.updateRuleInput = async (req, res) => {
  try {
    const valuesToSet = {};
    valuesToSet[`ruleInputs.$[input].name`] = req.body.newRuleInputName;
    valuesToSet[`ruleInputs.$[input].points`] = req.body.newRuleInputPoints;
    const response = await rulesTableModel.findByIdAndUpdate(
      req.params.ruleId,
      {
        $set: valuesToSet,
      },
      {
        new: true,
        arrayFilters: [{ "input._id": req.params.ruleInputId }],
      }
    );
    res.status(200).json({ status: "success", data: response });
  } catch (err) {
    console.error(err);
    res.status(400).json({ status: "fail", message: err.message });
  }
};

exports.addRuleInput = async (req, res) => {
  try {
    const response = await rulesTableModel.findByIdAndUpdate(
      req.params.ruleId,
      {
        $push: {
          ruleInputs: {
            name: req.body.newRuleInputName,
            points: req.body.newRuleInputPoints,
            ruleCategoryId: req.body.ruleCategoryId,
          },
        },
      },
      { new: true }
    );
    res.status(200).json({ status: "success", data: response });
  } catch (err) {
    console.error(err);
    res.status(400).json({ status: "fail", message: err.message });
  }
};

exports.changeRuleInputOrder = async (req, res) => {
  try {
    const response = await rulesTableModel.findByIdAndUpdate(
      req.params.ruleId,
      { ruleInputs: req.body.newRuleInputs },
      { new: true }
    );
    res.status(200).json({ status: "success", data: response });
  } catch (err) {
    console.error(err);
    res.status(400).json({ status: "fail", message: err.message });
  }
};

exports.getAllRules = async (req, res) => {
  try {
    const rules = (await rulesTableModel.find().select("ruleName")).map(
      (rule) => {
        return { id: rule._id, label: `${rule.ruleName} -- ${rule._id}` };
      }
    );
    res.status(200).json({ status: "success", data: rules });
  } catch (err) {
    console.error(err);
    res.status(400).json({ status: "fail", message: err.message });
  }
};

exports.getExistingRuleCategories = async (req, res) => {
  try {
    const task = await recordsTableModel
      .findById(req.params.taskId)
      .populate("rule", "ruleCategories");
    const existingRuleCategories = task?.rule?.ruleCategories.map(
      (ruleCategory) => {
        return {
          id: ruleCategory._id,
          label: ruleCategory.name,
          checked: !task.skippedRuleCategories.find((skippedRuleCategoryId) =>
            skippedRuleCategoryId.equals(ruleCategory._id)
          ),
        };
      }
    );
    res.status(200).json({
      status: "success",
      data: existingRuleCategories || [],
    });
  } catch (err) {
    console.error(err);
    res.status(400).json({ status: "fail", message: err.message });
  }
};
