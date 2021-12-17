const http = require("https");
const { promises: fs, ...originalFs } = require("fs");
const path = require("path");
const { convertImageToWebp } = require("./images");

const getIsValidUrl = (url) => {
  if (!url) {
    return false;
  }

  // ignore relative paths to the website
  if (url.substr(0, 1) === "/") {
    return false;
  }

  if (url.includes("data:")) {
    return false;
  }

  return true;
};

const downloadFromStorage = async (
  url,
  destDir,
  intendedFilenameWithoutExt = ""
) => {
  if (!getIsValidUrl(url)) {
    return false;
  }

  if (url.includes("GoogleAccessId")) {
    url = url.split("?")[0];
  }

  const originalFilename = path.basename(url).split("?")[0];
  const newFilename = intendedFilenameWithoutExt
    ? `${intendedFilenameWithoutExt}${path.extname(originalFilename)}`
    : originalFilename;
  const downloadDestFullPath = path.resolve(destDir, newFilename);
  const downloadDestParent = path.dirname(downloadDestFullPath);

  await fs.mkdir(downloadDestParent, { recursive: true });

  return new Promise((resolve) => {
    const file = originalFs.createWriteStream(downloadDestFullPath);

    var request = http
      .get(url, function (response) {
        response.pipe(file);
        file.on("finish", function () {
          file.close(() => {
            resolve(downloadDestFullPath);
          });
        });
      })
      .on("error", function (err) {
        // Handle errors
        originalFs.unlink(downloadDestFullPath); // Delete the file async. (But we don't check the result)
        throw err;
      });
  });
};

module.exports.downloadFromStorageAsWebp = async (
  url,
  destDir,
  intendedFilenameWithoutExt = ""
) => {
  const downloadedFilepath = await downloadFromStorage(
    url,
    destDir,
    intendedFilenameWithoutExt
  );

  if (!downloadedFilepath) {
    return "";
  }

  const webpPath = await convertImageToWebp(downloadedFilepath);
  return webpPath;
};
