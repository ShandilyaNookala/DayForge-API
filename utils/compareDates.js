const moment = require("moment-timezone");

module.exports = function compareDates(date1, date2, timezone) {
  const localDate1 = moment.tz(date1, timezone);
  const localDate2 = moment.tz(date2, timezone);

  return (
    localDate1.date() === localDate2.date() &&
    localDate1.month() === localDate2.month() &&
    localDate1.year() === localDate2.year()
  );
};
