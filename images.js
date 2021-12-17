const sharp = require("sharp");
const path = require("path");

module.exports.convertImageToWebp = async (imagePath) => {
  if (imagePath.includes(".webp")) {
    return imagePath;
  }

  const newPath = imagePath.replace(path.extname(imagePath), ".webp");
  await sharp(imagePath).webp().toFile(newPath);
  return newPath;
};
