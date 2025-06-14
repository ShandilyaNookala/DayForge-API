const mongoose = require("mongoose");
const bcrypt = require("bcrypt");

const usersSchema = new mongoose.Schema({
  userName: {
    type: String,
    required: true,
  },
  password: {
    type: String,
    required: true,
    select: false,
    minlength: 8,
  },
  role: {
    type: String,
    required: true,
    enum: ["student", "admin", "semi-admin"],
    default: "student",
  },
});

usersSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(
    this.password,
    +process.env.SALT_COST_FACTOR
  );
  next();
});

usersSchema.methods.correctPassword = async function (
  candidatePassword,
  userPassword
) {
  return bcrypt.compare(candidatePassword, userPassword);
};

usersSchema.virtual("isAdmin").get(function () {
  return this.role === "admin";
});

usersSchema.set("toJSON", { virtuals: true });
usersSchema.set("toObject", { virtuals: true });

module.exports = mongoose.model("user", usersSchema);
