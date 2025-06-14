const rulesTableModel = require("../models/rulesModel");
const recordsTableModel = require("../models/recordsModel");

module.exports = async function getManagedRules() {
  const rules = await rulesTableModel.find().select("ruleName");
  const tasksContainingRules = await recordsTableModel
    .find()
    .select("taskName rule")
    .populate("student", "userName");
  const managedRules = rules.map((rule) => {
    return {
      ruleName: rule.ruleName,
      tasks: tasksContainingRules.filter((task) => task.rule?.equals(rule._id)),
      id: rule._id,
    };
  });
  const tasksWithNoRule = tasksContainingRules
    .filter((task) => !task.rule)
    .map((task) => {
      return {
        label: `${task.taskName} - ${task.student.userName}`,
        id: task._id,
      };
    });
  return { managedRules, tasksWithNoRule };
};
