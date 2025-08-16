const usersTableModel = require("../models/usersModel");
const catchAsync = require("../utils/catchAsync");

exports.createUser = catchAsync(async (req, res) => {
  const user = await usersTableModel.findOne({ userName: req.body.userName });
  if (user) throw new Error("User already exists");
  const newUser = await usersTableModel.create({
    userName: req.body.userName,
    password: req.body.password,
  });
  res.status(201).json({
    status: "success",
    data: {
      newUser,
    },
  });
});
