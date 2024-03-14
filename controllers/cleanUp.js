const fsPrmoises = require("fs").promises;

const cleanup = async (path) => {
  await fsPrmoises.rm(path);
};

module.exports = cleanup;
