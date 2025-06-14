const express = require("express");
const router = express.Router();

const authController = require("../controllers/authController");

router.route("/login").post(authController.login);
router.route("/logout").post(authController.logout);
router.route("/is-logged-in").post(authController.isLoggedIn);

module.exports = router;
