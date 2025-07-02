const express = require("express");
const router = express.Router();

const rulesController = require("../controllers/rulesController");
const authController = require("../controllers/authController");

router
  .route("/create-new-rule")
  .post(authController.restrictTo("admin"), rulesController.createNewRule);

router
  .route("/get-rule/:id")
  .get(authController.restrictTo("admin"), rulesController.getRule);

router
  .route("/manage-rules")
  .get(authController.restrictTo("admin"), rulesController.getManageRules);

router
  .route("/:ruleId/update-rule-name")
  .patch(authController.restrictTo("admin"), rulesController.updateRuleName);

router
  .route("/:ruleId/update-rule-category/:ruleCategoryId")
  .patch(
    authController.restrictTo("admin"),
    rulesController.updateRuleCategory
  );

router
  .route("/:ruleId/add-rule-category")
  .patch(authController.restrictTo("admin"), rulesController.addRuleCategory);

router
  .route("/:ruleId/update-rule-input/:ruleInputId")
  .patch(authController.restrictTo("admin"), rulesController.updateRuleInput);

router
  .route("/:ruleId/add-rule-input")
  .patch(authController.restrictTo("admin"), rulesController.addRuleInput);

router
  .route("/:ruleId/change-rule-input-order")
  .patch(
    authController.restrictTo("admin"),
    rulesController.changeRuleInputOrder
  );

router.route("/get-all-rules").get(rulesController.getAllRules);

module.exports = router;
