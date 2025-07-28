const mongoose = require("mongoose");

const getGrades = require("../utils/getGrades");
const computeNextDayWork = require("../utils/computeNextDayWork");

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
  skippedRuleCategories: {
    type: [mongoose.Schema.ObjectId],
    default: [],
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

function getSummaryProblems(field, includePoints = false) {
  if (!this.rule || !this.rule.ruleInputs) return null;
  const set = new Set(
    this.records
      ?.filter(
        (record) =>
          record[field] &&
          Array.isArray(record[field]) &&
          record.result !== null &&
          record.grade !== 1
      )
      .flatMap((record) =>
        record[field].map((fieldUnit) => String(fieldUnit._id))
      )
  );
  if (!includePoints) return set.size;
  return this.rule.ruleInputs
    .filter((ruleInput) => set.has(String(ruleInput._id)))
    .reduce((acc, ruleInput) => acc + ruleInput.points, 0);
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

recordsTableSchema.virtual("percentageCorrect").get(function () {
  return (
    (1 -
      getSummaryProblems.call(this, "result", true) /
        getSummaryProblems.call(this, "work", true)) *
    100
  );
});

recordsTableSchema.virtual("totalPoints").get(function () {
  if (!this.rule || !this.rule.ruleInputs) return null;
  return this.rule.ruleInputs.reduce(
    (acc, ruleInput) => acc + ruleInput.points,
    0
  );
});

recordsTableSchema.virtual("totalPointsAttempted").get(function () {
  if (!this.rule || !this.rule.ruleInputs) return null;
  return getSummaryProblems.call(this, "work", true);
});

recordsTableSchema.virtual("mistakePoints").get(function () {
  if (!this.rule || !this.rule.ruleInputs) return null;
  return getSummaryProblems.call(this, "result", true);
});

recordsTableSchema.virtual("endDate").get(function () {
  if (!this.records) return null;
  if (!this.rule || !this.rule.ruleInputs) return null;
  const lastRecordDate = this.records[0]
    ? new Date(this.records[0]?.date)
    : new Date();
  let endNumberOfDays = 0;
  let currentWork = this.records[0]?.work;
  let index = 0;
  while (1) {
    let { work: nextWorks } = computeNextDayWork(
      null,
      this.rule,
      true,
      currentWork,
      index === 0 ? this.records[0]?.result : null,
      this.noOfProblems,
      this.threshold,
      this.skippedRuleCategories
    );
    nextWorks = nextWorks?.filter((work) => work.checked);
    if (!nextWorks || nextWorks.length === 0) break;
    currentWork = nextWorks.map((work) => {
      return { _id: work.id };
    });
    endNumberOfDays++;
    index++;
  }
  return new Date(
    lastRecordDate.getTime() + endNumberOfDays * 24 * 60 * 60 * 1000
  );
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
