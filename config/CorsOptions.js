const AllowedOrigins = require("./AllowedOrigins");

const corsoptions = {
  origin: (origin, callback) => {
    if (AllowedOrigins.indexOf(origin) !== -1 || !origin) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true,
  optionsSuccessStatus: 200,
};

module.exports = corsoptions;
