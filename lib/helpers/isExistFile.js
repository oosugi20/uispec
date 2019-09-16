const fs = require('fs');

/**
 * @param {string} filePath
 */
module.exports = function isExistFile(filePath) {
  try {
    fs.statSync(filePath);
    return true;
  } catch (err) {
    if (err.code === 'ENOENT') {
      return false;
    }
  }
};
