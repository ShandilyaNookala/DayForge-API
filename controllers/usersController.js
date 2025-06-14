const usersTableModel = require("../models/usersModel");

exports.createUser = async (req, res) => {
  try {
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
  } catch (err) {
    res.status(400).json({
      status: "fail",
      message: err.message,
    });
  }
};
