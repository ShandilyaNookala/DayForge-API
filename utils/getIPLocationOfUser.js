const geoip = require("geoip-lite");

module.exports = function getIPLocationOfUser(req) {
  const clientIp = req?.headers["x-forwarded-for"]?.split(",")[0] || req.ip;
  const timezoneObject = geoip.lookup(clientIp);
  const timezone = timezoneObject?.timezone || process.env.DEFAULT_TIMEZONE;
  return timezone;
};
