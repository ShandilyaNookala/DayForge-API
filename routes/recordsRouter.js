const express = require("express");
const router = express.Router();

const recordsController = require("../controllers/recordsController");
const authController = require("../controllers/authController");

router
  .route("/get-student-tasks")
  .get(authController.restrictTo("student"), recordsController.getStudentTasks);

router
  .route("/mark-obsolete")
  .post(
    authController.restrictTo("student", "semi-admin"),
    recordsController.markObsolete
  );

router
  .route("/get-automatic-data-with-mistakes/:taskId/:recordId")
  .post(
    authController.restrictTo("admin"),
    recordsController.getAutomaticDataWithMistakes
  );

router
  .route("/update-or-create-record/:taskId/:recordId")
  .patch(recordsController.updateOrCreateRecordInArray);

router
  .route("/update-manage-rules")
  .patch(
    authController.restrictTo("admin"),
    recordsController.updateManageRules
  );

router
  .route("/update-threshold-points/:taskId")
  .patch(
    authController.restrictTo("admin"),
    recordsController.updateThresholdPoints
  );

router
  .route("/update-rule-for-task/:taskId")
  .patch(
    authController.restrictTo("admin"),
    recordsController.updateRuleForTask
  );

router
  .route("/update-skipped-rule-categories/:taskId")
  .patch(
    authController.restrictTo("admin"),
    recordsController.updateSkippedRuleCategories
  );

router
  .route("/get-automatic-data/:taskId")
  .get(authController.restrictTo("admin"), recordsController.getAutomaticData);

router
  .route("/update-task-name/:taskId")
  .patch(authController.restrictTo("admin"), recordsController.updateTaskName);
router
  .route("/")
  .post(authController.restrictTo("admin"), recordsController.addRecord);

router.route("/:id").get(recordsController.getRecords);

module.exports = router;
