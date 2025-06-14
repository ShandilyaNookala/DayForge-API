const express = require("express");
const router = express.Router();

const integrationController = require("../controllers/integrationController");

router
  .route("/integrate-spellings-app")
  .post(integrationController.integrateTestTakingApp);

router
  .route("/get-current-test/:categoryName/:userName")
  .get(integrationController.getCurrentTest);

module.exports = router;
