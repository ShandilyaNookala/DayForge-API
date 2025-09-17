const recordsTableModel = require("../models/recordsModel");
const rulesTableModel = require("../models/rulesModel");
const getManagedRules = require("../utils/getManagedRules");
const catchAsync = require("../utils/catchAsync");

exports.createNewRule = catchAsync(async (req, res) => {
  const newRule = await rulesTableModel.create(req.body);
  await recordsTableModel.findOneAndUpdate(
    { assignedTo: req.body.assignedTo, taskName: req.body.taskName },
    { $set: { rule: newRule._id } }
  );
  res.status(200).json({ status: "success", data: newRule });
});

exports.getManageRules = catchAsync(async (req, res) => {
  const { managedRules, tasksWithNoRule } = await getManagedRules();
  res.status(200).json({
    status: "success",
    data: {
      rows: managedRules,
      tasksWithNoRule,
    },
  });
});

exports.getRule = catchAsync(async (req, res) => {
  const data = (await rulesTableModel.findById(req.params.id)) || null;
  res.status(200).json({ status: "success", data });
});

exports.updateRuleName = catchAsync(async (req, res) => {
  const response = await rulesTableModel.findByIdAndUpdate(
    req.params.ruleId,
    { ruleName: req.body.newRuleName },
    { new: true }
  );
  res.status(200).json({ status: "success", data: response });
});

exports.updateRuleCategory = catchAsync(async (req, res) => {
  const valuesToSet = {};
  valuesToSet[`ruleCategories.$[category].name`] = req.body.newRuleCategoryName;

  const response = await rulesTableModel.findByIdAndUpdate(
    req.params.ruleId,
    { $set: valuesToSet },
    {
      new: true,
      arrayFilters: [{ "category._id": req.params.ruleCategoryId }],
    }
  );
  res.status(200).json({ status: "success", data: response });
});

exports.addRuleCategory = catchAsync(async (req, res) => {
  const response = await rulesTableModel.findByIdAndUpdate(
    req.params.ruleId,
    {
      $push: { ruleCategories: { name: req.body.newRuleCategoryName } },
    },
    { new: true }
  );
  res.status(200).json({ status: "success", data: response });
});

exports.updateRuleInput = catchAsync(async (req, res) => {
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
});

exports.addRuleInput = catchAsync(async (req, res) => {
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
});

exports.changeRuleInputOrder = catchAsync(async (req, res) => {
  const response = await rulesTableModel.findByIdAndUpdate(
    req.params.ruleId,
    { ruleInputs: req.body.newRuleInputs },
    { new: true }
  );
  res.status(200).json({ status: "success", data: response });
});

exports.bulkEditPoints = catchAsync(async (req, res) => {
  const rule = await rulesTableModel.findById(req.params.ruleId);
  rule.ruleInputs.forEach((ruleInput) => {
    if (ruleInput.ruleCategoryId.toString() === req.params.ruleCategoryId) {
      ruleInput.points = +req.body.bulkEditPoints;
    }
  });
  await rule.save();
  res.status(200).json({ status: "success", data: rule });
});

exports.updateStandardPoints = catchAsync(async (req, res) => {
  const rule = await rulesTableModel.findById(req.params.ruleId);
  rule.ruleCategories.forEach((ruleCategory) => {
    if (ruleCategory._id.toString() === req.params.ruleCategoryId)
      ruleCategory.standardPoints = +req.body.standardPoints;
  });
  await rule.save();
  res.status(200).json({ status: "success", data: rule });
  const response = await rulesTableModel.findByIdAndUpdate(
    req.params.ruleId,
    {
      $set: {
        "ruleCategories.$[category].standardPoints": +req.body.standardPoints,
      },
    },
    {
      new: true,
      arrayFilters: [{ "category._id": req.params.ruleCategoryId }],
    }
  );
  res.status(200).json({ status: "success", data: response });
});

exports.getAllRules = catchAsync(async (req, res) => {
  const rules = (await rulesTableModel.find().select("ruleName")).map(
    (rule) => {
      return { id: rule._id, label: `${rule.ruleName} -- ${rule._id}` };
    }
  );
  res.status(200).json({ status: "success", data: rules });
});

exports.getExistingRuleCategories = catchAsync(async (req, res) => {
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
});
