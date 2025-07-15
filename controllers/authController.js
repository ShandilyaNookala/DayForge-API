const jwt = require("jsonwebtoken");
const usersTableModel = require("../models/usersModel");

async function getUserFromToken(token) {
  if (!token) {
    throw new Error("You are not logged in. Please log in and try again!");
  }

  const userId = jwt.verify(token, process.env.JWT_SECRET_FOR_DAYFORGE).id;
  const user = await usersTableModel.findById(userId);
  if (!user) throw new Error("The user no longer exists.");
  return user;
}

exports.login = async (req, res) => {
  try {
    const { userName, password } = req.body;
    if (!userName || !password) {
      throw new Error("No username or password");
    }

    const user = await usersTableModel
      .findOne({ userName })
      .select("+password");
    if (!user) throw new Error("User does not exist. Please sign up.");

    const correctPassword = await user.correctPassword(password, user.password);
    if (!correctPassword) {
      throw new Error("Incorrect username or password. Please try again!");
    }

    const token = jwt.sign(
      { id: user._id },
      process.env.JWT_SECRET_FOR_DAYFORGE,
      {
        expiresIn: process.env.JWT_EXPIRES_IN,
      }
    );

    res.cookie(process.env.COOKIE_NAME, token, {
      httpOnly: true,
      secure: true,
      sameSite: "None",
      path: "/",
    });

    const userData = user.toObject();
    delete userData.password;

    res.status(200).json({
      status: "success",
      data: userData,
      token,
    });
  } catch (err) {
    console.error(err);
    res.status(400).json({
      status: "fail",
      message: err.message,
    });
  }
};

exports.protect = async (req, res, next) => {
  try {
    const user = await getUserFromToken(
      req.cookies[process.env.COOKIE_NAME] ||
        req.headers.authorization?.split(" ")[1]
    );
    req.user = user;
    next();
  } catch (err) {
    console.error(err);
    res.status(400).json({
      status: "fail",
      message: err.message,
    });
  }
};

exports.restrictTo = (...roles) => {
  return (req, res, next) => {
    try {
      if (!roles.includes(req.user.role))
        throw new Error("You do not have permission to perform this action");
      next();
    } catch (err) {
      console.error(err);
      res.status(403).json({
        status: "fail",
        message: err.message,
      });
    }
  };
};

exports.logout = async (req, res) => {
  try {
    res.cookie(process.env.COOKIE_NAME, "loggedout", {
      expires: new Date(Date.now() + 10 * 1000),
      httpOnly: true,
      secure: true,
      sameSite: "None",
      path: "/",
    });
    res.status(200).json({ status: "success" });
  } catch (err) {
    console.error(err);
    res.status(400).json({
      status: "fail",
      message: err.message,
    });
  }
};

exports.isLoggedIn = async (req, res) => {
  try {
    const user = await getUserFromToken(req.cookies[process.env.COOKIE_NAME]);
    res.status(200).json({
      status: "success",
      data: user,
    });
  } catch (err) {
    console.error(err);
    res.status(400).json({
      status: "fail",
      message: err.message,
    });
  }
};
