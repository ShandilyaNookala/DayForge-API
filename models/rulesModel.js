const mongoose = require("mongoose");

const rulesTableSchema = mongoose.Schema({
  ruleInputs: {
    type: [
      {
        name: { type: String, required: [true, "Rule inputs must have name"] },
        ruleCategoryId: {
          type: mongoose.Schema.ObjectId,
          required: [true, "Rule inputs must have rule category id"],
        },
        points: {
          type: Number,
          required: [true, "Rule inputs must have points."],
        },
      },
    ],
    default: [],
  },
  ruleName: {
    type: String,
    required: [true, "The rules must have a name."],
  },
  ruleCategories: {
    type: [
      {
        name: {
          type: String,
          required: [true, "Rule category must have a name"],
        },
        standardPoints: {
          type: Number,
          default: 0,
        },
      },
    ],
    default: [],
  },
});

module.exports = mongoose.model("rule", rulesTableSchema);
