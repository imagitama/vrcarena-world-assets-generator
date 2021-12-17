const QRCode = require("qrcode");
const { promises: fs } = require("fs");
const path = require("path");

module.exports = async (text, outputPath) => {
  const dirPathToCreate = outputPath.replace(path.basename(outputPath), "");

  await fs.mkdir(dirPathToCreate, { recursive: true });

  await QRCode.toFile(outputPath, text, {
    width: 300,
    height: 300,
  });
};
