const moment = require("moment-timezone");

module.exports = function getCurrentDate(timezone) {
  const localDate = moment().tz(timezone).format();
  return localDate;
};
