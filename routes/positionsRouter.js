const express = require("express");
const router = express.Router();

const positionsController = require("../controllers/positionsController");
const authController = require("../controllers/authController");

router
  .route("/")
  .patch(
    authController.restrictTo("admin"),
    positionsController.updatePositions
  );
router
  .route("/")
  .get(authController.restrictTo("admin"), positionsController.getPositions);

module.exports = router;
