const moment = require("moment-timezone");

module.exports = function getNextDate(timezone) {
  const nextDate = moment.tz(timezone).add(1, "day").startOf("day").format();
  return nextDate;
};
