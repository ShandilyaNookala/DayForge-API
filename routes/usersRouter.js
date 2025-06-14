const express = require("express");
const router = express.Router();

const authController = require("../controllers/authController");
const usersController = require("../controllers/usersController");

router
  .route("/create-new-user")
  .post(authController.restrictTo("admin"), usersController.createUser);

module.exports = router;
