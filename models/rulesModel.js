const mongoose = require("mongoose");

const rulesTableSchema = mongoose.Schema({
  ruleInputs: {
    type: [
      {
        name: { type: String, required: [true, "Rule inputs must have name"] },
        type: { type: String, required: [true, "Rule inputs must have type"] },
        points: {
          type: Number,
          required: [true, "Rule inputs must have points."],
        },
      },
    ],
    required: [true, "The rules must have some inputs."],
  },
  ruleName: {
    type: String,
    required: [true, "The rules must have a name."],
  },
});

module.exports = mongoose.model("rule", rulesTableSchema);
