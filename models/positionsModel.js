const mongoose = require("mongoose");

const positionsTableSchema = mongoose.Schema({
  student: {
    type: mongoose.Schema.ObjectId,
    required: [true, "The tasks must have a person assigned to them."],
  },
  tasks: {
    type: [mongoose.Schema.ObjectId],
    required: [true, "The tasks must exist."],
    ref: "record",
  },
  position: {
    type: String,
    required: [true, "The positions must exist."],
  },
});

module.exports = mongoose.model("position", positionsTableSchema);
