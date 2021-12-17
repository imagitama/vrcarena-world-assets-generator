const { promises: fs } = require("fs");
const path = require("path");
const sharp = require("sharp");
const { downloadFromStorageAsWebp } = require("./download");
const { logIfNecessary } = require("./utils");
const createQrCode = require("./qrcode");
const getSvgForAsset = require("./svg/asset");
const { client } = require("./supabase");

const pageLimit = 1000;

const getAssets = async (count) => {
  const from = count * pageLimit;
  const to = count * pageLimit + pageLimit;

  console.log(`getting assets ${from} -> ${to}...`);

  const { data, error } = await client
    .from("getAssetsForVrchatWorld".toLowerCase())
    .select("*")
    .range(from, to)
    .eq("category", "avatar");

  if (error) {
    throw new Error(`Failed to get assets: ${error.code} ${error.message}`);
  }

  return data;
};

module.exports.writeAssetsToDisk = async (assets) => {
  const pathToJson = path.resolve(
    process.env.PATH_INSIDE_UNITY_PROJECT,
    "assets.json"
  );
  const data = JSON.stringify(
    {
      assets,
    },
    null,
    "  "
  );
  await fs.writeFile(pathToJson, data);
};

module.exports.getAllAssets = async () => {
  return new Promise((resolve) => {
    let allAssets = [];

    let count = 0;

    const recursivelyGetAssets = async () => {
      const newAssets = await getAssets(count);

      allAssets = allAssets.concat(newAssets);

      if (newAssets.length === pageLimit) {
        count++;
        recursivelyGetAssets();
      } else {
        resolve(allAssets);
      }
    };

    recursivelyGetAssets();
  });
};

module.exports.downloadThumbnails = async (assets) => {
  let count = 0;

  console.debug(`downloading ${assets.length} asset thumbnails...`);

  for (const asset of assets) {
    const destPath = path.resolve(
      process.cwd(),
      "downloads/asset-thumbnails",
      asset.id
    );

    await downloadFromStorageAsWebp(asset.thumbnailurl, destPath, "thumbnail");

    count++;

    logIfNecessary(count);
  }
  console.debug(`downloading thumbnails done`);
};

// some thumbs are 1000px wide for some reason
module.exports.resizeThumbnails = async (assets) => {
  let count = 0;
  let resizedCount = 0;

  console.debug(`resizing ${assets.length} asset thumbnails...`);

  sharp.cache(false);

  for (const asset of assets) {
    const thumbnailPath = path.resolve(
      process.cwd(),
      "downloads/asset-thumbnails",
      asset.id,
      "thumbnail.webp"
    );

    const image = sharp(thumbnailPath);
    const metadata = await image.metadata();

    if (metadata.width > 300) {
      const thumbnailPathWithOriginalSuffix = thumbnailPath.replace(
        ".webp",
        "-original.webp"
      );
      await image.toFile(thumbnailPathWithOriginalSuffix);
      await image.resize(300, 300);

      const tempThumbnailPath = thumbnailPath.replace(".webp", "-temp.webp");
      await image.toFile(tempThumbnailPath);

      await fs.unlink(thumbnailPath);
      await fs.rename(tempThumbnailPath, thumbnailPath);

      resizedCount++;
    }

    count++;

    logIfNecessary(count);
  }
  console.debug(`resizing thumbnails done (${resizedCount} resized)`);
};

module.exports.createQrCodesForAssets = async (assets) => {
  let count = 0;

  console.debug(`creating ${assets.length} asset QR codes...`);

  for (const asset of assets) {
    const pathToQrCode = path.resolve(
      process.cwd(),
      "downloads/asset-qr-codes",
      asset.id,
      "qrcode.png"
    );

    const url = `https://www.vrcarena.com/assets/${asset.id}`;

    await createQrCode(url, pathToQrCode);

    count++;

    logIfNecessary(count);
  }

  console.debug(`QR codes created`);
};

module.exports.createAssetOverviews = async (assets) => {
  let count = 0;

  console.debug(`creating ${assets.length} asset overviews...`);

  sharp.cache(false);

  for (const asset of assets) {
    const pathToOutputParent = path.resolve(
      process.env.PATH_INSIDE_UNITY_PROJECT,
      "asset-overviews",
      asset.id
    );

    const pathToOutput = path.resolve(pathToOutputParent, "overview.png");
    const svg = getSvgForAsset(asset);

    const pathToQrCode = path.resolve(
      process.cwd(),
      "downloads/asset-qr-codes",
      asset.id,
      "qrcode.png"
    );

    const pathToThumbnail = path.resolve(
      process.cwd(),
      "downloads/asset-thumbnails",
      asset.id,
      "thumbnail.webp"
    );

    await fs.mkdir(pathToOutputParent, { recursive: true });

    try {
      await sharp(Buffer.from(svg))
        .composite(
          [
            {
              input: pathToQrCode,
              top: 125,
              left: 550,
            },
          ].concat(
            asset.thumbnailurl
              ? [
                  {
                    input: pathToThumbnail,
                    top: 125,
                    left: 150,
                  },
                ]
              : []
          )
        )
        .png()
        .toFile(pathToOutput);
    } catch (err) {
      err.message = `Failed to create overview for asset "${asset.id}": ${err.message}`;
      throw err;
    }

    count++;

    logIfNecessary(count);
  }

  console.debug(`overviews created`);
};
