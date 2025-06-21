const mongoose = require("mongoose");
const getGrades = require("../utils/getGrades");

const recordSchema = mongoose.Schema({
  date: { type: Date, required: [true, "The records must have a date."] },
  work: {
    type: Object,
    required: [true, "The records must have a work done that day."],
  },
  startTime: { type: Date, default: null },
  endTime: { type: Date, default: null },
  result: { type: Object, default: null },
  comment: { type: String, default: null },
  grade: { type: Number, default: null },
});

const recordsTableSchema = mongoose.Schema({
  student: {
    type: mongoose.Schema.ObjectId,
    required: [true, "The records must have a person assigned to them."],
    ref: "user",
  },
  taskName: {
    type: String,
    required: [true, "The records must have a name."],
  },
  rule: {
    type: mongoose.Schema.ObjectId,
    default: null,
    ref: "rule",
  },
  threshold: {
    type: Number,
    default: 0,
  },
  noOfProblems: {
    type: Number,
    default: 0,
  },
  records: {
    type: [recordSchema],
    default: [],
    required: [true, "The records must have a record."],
  },
});

function getNamesOfRuleInputs(ruleInputs) {
  if (!Array.isArray(ruleInputs)) return ruleInputs;
  return ruleInputs.map((ruleInput) => ruleInput?.name).join("\n");
}

function getRuleInputs(rule, workOrResults) {
  if (!workOrResults) return null;
  if (typeof workOrResults === "string") return workOrResults;
  const arr = workOrResults.map((id) =>
    rule.ruleInputs?.find((ruleInput) => ruleInput._id.equals(id))
  );
  return arr;
}

function getNewRecords(records, rule) {
  if (!records) return records;
  if (!rule) return records.reverse();
  if (!rule.ruleInputs) return records.reverse();
  return records
    .map((record) => {
      return {
        ...record,
        work: getRuleInputs(rule, record.work),
        result: getRuleInputs(rule, record.result),
      };
    })
    .reverse();
}

function getSummaryProblems(field) {
  if (!this.rule) return null;
  return new Set(
    this.records
      .filter(
        (record) =>
          record[field] &&
          Array.isArray(record[field]) &&
          record.result !== null
      )
      .flatMap((record) =>
        record[field].map((fieldUnit) => String(fieldUnit._id))
      )
  ).size;
}

recordSchema.virtual("timeTaken").get(function () {
  return this.startTime && this.endTime
    ? this.endTime.getTime() - this.startTime.getTime()
    : null;
});

recordSchema.virtual("formattedWork").get(function () {
  return getNamesOfRuleInputs(this.work);
});

recordSchema.virtual("formattedResult").get(function () {
  return getNamesOfRuleInputs(this.result);
});

recordSchema.virtual("formattedGrade").get(function () {
  return getGrades(this.grade);
});

recordsTableSchema.virtual("totalProblems").get(function () {
  return this.rule ? this.rule?.ruleInputs?.length : null;
});

recordsTableSchema.virtual("totalAttemptedProblems").get(function () {
  return getSummaryProblems.call(this, "work");
});

recordsTableSchema.virtual("mistakes").get(function () {
  return getSummaryProblems.call(this, "result");
});

recordsTableSchema.post(/^find/, function (docs, next) {
  if (Array.isArray(docs)) {
    docs.forEach((doc) => {
      doc.records = getNewRecords(doc.records, doc.rule);
    });
  } else {
    if (!docs) return next();
    docs.records = getNewRecords(docs.records, docs.rule);
  }
  next();
});

recordsTableSchema.post("aggregate", function (docs, next) {
  if (Array.isArray(docs)) {
    docs.forEach((doc) => {
      doc.records = getNewRecords(doc.records, doc.rule);
    });
  }
  next();
});

recordSchema.set("toJSON", { virtuals: true });
recordSchema.set("toObject", { virtuals: true });

recordsTableSchema.set("toJSON", { virtuals: true });
recordsTableSchema.set("toObject", { virtuals: true });

module.exports = mongoose.model("record", recordsTableSchema);
