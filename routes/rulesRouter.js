const express = require("express");
const router = express.Router();

const rulesController = require("../controllers/rulesController");
const authController = require("../controllers/authController");

router
  .route("/create-new-rule")
  .post(authController.restrictTo("admin"), rulesController.createNewRule);

router
  .route("/rule-exists/:id")
  .get(authController.restrictTo("admin"), rulesController.doesRuleExist);

router
  .route("/manage-rules")
  .get(authController.restrictTo("admin"), rulesController.getManageRules);

router
  .route("/:ruleId")
  .patch(authController.restrictTo("admin"), rulesController.updateRule);

module.exports = router;
