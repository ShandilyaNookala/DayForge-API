const jwt = require("jsonwebtoken");
const moment = require("moment");
const usersTableModel = require("../models/usersModel");
const catchAsync = require("../utils/catchAsync");

async function getUserFromToken(token) {
  if (!token) {
    throw new Error("You are not logged in. Please log in and try again!");
  }

  const userId = jwt.verify(token, process.env.JWT_SECRET_FOR_DAYFORGE).id;
  const user = await usersTableModel.findById(userId);
  if (!user) throw new Error("The user no longer exists.");
  return user;
}

exports.login = catchAsync(async (req, res) => {
  const { userName, password } = req.body;
  if (!userName || !password) {
    throw new Error("No username or password");
  }

  const user = await usersTableModel.findOne({ userName }).select("+password");
  if (!user)
    throw new Error("Incorrect username or password. Please try again!");

  const isLockExpired =
    user.lockUntil && moment.utc(user.lockUntil).isSameOrBefore(moment.utc());

  if (isLockExpired !== null && !isLockExpired) {
    const retryAfterSeconds = Math.max(
      0,
      Math.ceil((user.lockUntil.getTime() - Date.now()) / 1000),
    );
    const retryAfterMinutes = Math.ceil(retryAfterSeconds / 60);
    res.status(429).json({
      message: `Too many failed login attempts. Try again in ${retryAfterMinutes} minute(s).`,
    });
    return;
  }

  const correctPassword = await user.correctPassword(password, user.password);
  if (!correctPassword) {
    const nextUserLoginAttempts = user.loginAttempts + 1;
    let lockUntil = null;
    if (nextUserLoginAttempts % process.env.LOGIN_ATTEMPTS_PER_LOCK === 0) {
      const lockMinutes = Math.pow(
        process.env.LOCKOUT_BACKOFF_BASE,
        nextUserLoginAttempts / process.env.LOGIN_ATTEMPTS_PER_LOCK - 1,
      );
      lockUntil = moment.utc().add(lockMinutes, "minutes").toDate();
    }
    await usersTableModel.updateOne(
      { _id: user._id },
      { lockUntil, loginAttempts: nextUserLoginAttempts },
    );
    throw new Error("Incorrect username or password. Please try again!");
  }

  await usersTableModel.updateOne(
    { _id: user._id },
    { lockUntil: null, loginAttempts: 0 },
  );

  const token = jwt.sign(
    { id: user._id },
    process.env.JWT_SECRET_FOR_DAYFORGE,
    {
      expiresIn: process.env.JWT_EXPIRES_IN,
    },
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
});

exports.protect = catchAsync(async (req, res, next) => {
  const user = await getUserFromToken(
    req.cookies[process.env.COOKIE_NAME] ||
      req.headers.authorization?.split(" ")[1],
  );
  req.user = user;
  next();
});

exports.restrictTo =
  (...roles) =>
  (req, res, next) => {
    if (!roles.includes(req.user.role))
      return next(
        new Error("You do not have permission to perform this action"),
      );
    next();
  };

exports.logout = catchAsync(async (req, res) => {
  res.cookie(process.env.COOKIE_NAME, "loggedout", {
    expires: new Date(Date.now() + 10 * 1000),
    httpOnly: true,
    secure: true,
    sameSite: "None",
    path: "/",
  });
  res.status(200).json({ status: "success" });
});

exports.isLoggedIn = catchAsync(async (req, res) => {
  const user = await getUserFromToken(req.cookies[process.env.COOKIE_NAME]);
  res.status(200).json({
    status: "success",
    data: user,
  });
});
