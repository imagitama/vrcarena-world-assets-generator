const isProd = process.argv.find((arg) => arg.includes("--prod"));

const path = require("path");

if (isProd) {
  console.log("PRODUCTION!!!!");
} else {
  console.log("Development (use --prod for prod)");
}

require("dotenv").config({
  path: path.resolve(process.cwd(), isProd ? ".env.prod" : ".env.dev"),
});

const { createClient } = require("@supabase/supabase-js");
const { promises: fs, ...originalFs } = require("fs");
const http = require("https");
var QRCode = require("qrcode");
const sharp = require("sharp");

const outputPathArg = process.argv.find((arg) => arg.includes("--output"));

if (!outputPathArg) {
  throw new Error("No output path! Use --output");
}

const outputPath = outputPathArg.split("=")[1];

const onlyArg = process.argv.find((arg) => arg.includes("--only"));

const only = onlyArg ? onlyArg.split("=")[1] : "";

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_API_KEY;

const isToDownload = process.argv.find((arg) => arg.includes("--download"));
const isToUseExistingJson = process.argv.find((arg) =>
  arg.includes("--existing")
);

const client = createClient(supabaseUrl, supabaseKey);

let count = 0;
const pageLimit = 1000;

const getAssets = async () => {
  const from = count * pageLimit;
  const to = count * pageLimit + pageLimit;

  console.log(`getting ${from} -> ${to}`);

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

const getAllAssets = async (useExisting) => {
  if (useExisting) {
    const json = await fs.readFile(
      path.resolve(outputPath, "test-assets.json")
    );
    const data = JSON.parse(json);
    return data.assets;
  }

  return new Promise((resolve) => {
    let allAssets = [];

    const recursivelyGetAssets = async () => {
      const newAssets = await getAssets();

      allAssets = allAssets.concat(newAssets);

      if (newAssets.length === 1000) {
        count++;
        recursivelyGetAssets();
      } else {
        resolve(allAssets);
      }
    };

    recursivelyGetAssets();
  });
};

const getAllSpecies = async (useExisting) => {
  if (useExisting) {
    const json = await fs.readFile(
      path.resolve(outputPath, "test-assets.json")
    );
    const data = JSON.parse(json);
    return data.species;
  }

  const { data, error } = await client.from("species").select("*");

  const sortedData = data.sort((speciesA, speciesB) =>
    speciesA.pluralname.localeCompare(speciesB.pluralname)
  );

  return sortedData;
};

const writeJson = async (species, assets) => {
  const jsonOutputPath = path.resolve(outputPath, "test-assets.json");
  const data = {
    species,
    assets,
  };
  await fs.writeFile(jsonOutputPath, JSON.stringify(data, null, "  "));
};

const downloadThumbnail = async (itemId, thumbnailUrl, directoryName) => {
  const dirPath = path.resolve(outputPath, directoryName, itemId);

  if (!originalFs.existsSync(dirPath)) {
    await fs.mkdir(dirPath);
  }

  // remove wierd google key thing
  // const url = thumbnailUrl.split("?")[0];

  let url = thumbnailUrl;

  if (url.includes("GoogleAccessId")) {
    url = url.split("?")[0];
  }

  console.log(`${itemId} => ${url}`);

  if (!url || url.substr(0, 1) === "/") {
    return false;
  }

  return new Promise((resolve) => {
    const filePath = path.resolve(
      dirPath,
      "thumb" + path.extname(url.split("?")[0])
    );

    // if (originalFs.existsSync(filePath)) {
    //   resolve(false);
    //   return;
    // }

    // TEMP
    if (originalFs.existsSync(path.resolve(dirPath, "thumb.png"))) {
      resolve(false);
      return;
    }

    const file = originalFs.createWriteStream(filePath);

    var request = http
      .get(url, function (response) {
        response.pipe(file);
        file.on("finish", function () {
          file.close(() => {
            resolve(true);
          });
        });
      })
      .on("error", function (err) {
        // Handle errors
        originalFs.unlink(filePath); // Delete the file async. (But we don't check the result)
        throw err;
      });
  });
};

const downloadAssetThumbnails = async (assets) => {
  let count = 0;
  let successCount = 0;
  let failedCount = 0;

  console.debug(`downloading asset thumbnails...`);

  for (const asset of assets) {
    const success = await downloadThumbnail(
      asset.id,
      asset.thumbnailurl,
      "asset-data"
    );

    // if (!success) {
    //   throw new Error("Failed to download!");
    // }

    count++;

    if (success) {
      successCount++;
    } else {
      failedCount++;
    }

    logIfNecessary(count);
  }

  console.debug(`success: ${successCount} failed: ${failedCount}`);
};

const downloadSpeciesThumbnails = async (species) => {
  let successCount = 0;
  let failedCount = 0;

  console.debug(`downloading species thumbnails...`);

  for (const speciesItem of species) {
    const success = await downloadThumbnail(
      speciesItem.id,
      speciesItem.thumbnailurl,
      "species-data"
    );

    if (success) {
      successCount++;
    } else {
      failedCount++;
    }
  }

  console.debug(`success: ${successCount} failed: ${failedCount}`);
};

const createQrCodesForAssets = async (assets) => {
  let count = 0;

  console.debug(`creating asset qr codes...`);

  for (const asset of assets) {
    const pathOfImage = path.resolve(
      outputPath,
      "asset-data",
      asset.id,
      "qrcode.png"
    );
    const url = `https://www.vrcarena.com/assets/${asset.id}`;
    await QRCode.toFile(pathOfImage, url, {
      width: 300,
      height: 300,
    });

    count++;

    logIfNecessary(count);
  }

  console.debug(`qr codes created`);
};

const createQrCodesForSpecies = async (species) => {
  let count = 0;

  console.debug(`creating species qr codes...`);

  for (const speciesItem of species) {
    const pathOfImage = path.resolve(
      outputPath,
      "species-data",
      speciesItem.id,
      "qrcode.png"
    );
    const url = `https://www.vrcarena.com/species/${
      speciesItem.slug || speciesItem.id
    }`;
    await QRCode.toFile(pathOfImage, url, {
      width: 300,
      height: 300,
    });

    count++;

    logIfNecessary(count);
  }

  console.debug(`qr codes created`);
};

const escapeStringForSvg = (string) =>
  string
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");

const getSvgForAsset = (asset) => `<svg viewBox="0 0 1000 500">
  <rect
    x="0"
    y="0"
    width="100%"
    height="100%"
    fill="#322148"
  />
  <text
    x="50%"
    y="15%"
    fill="white"
    font-family="Arial, Helvetica, sans-serif"
    alignment-baseline="center"
    font-size="32px"
    text-anchor="middle"
  >${escapeStringForSvg(asset.title)}${
  asset.authorname ? ` by ${escapeStringForSvg(asset.authorname)}` : ""
}</text>
  <text
    x="50%"
    y="95%"
    fill="white"
    font-family="Arial, Helvetica, sans-serif"
    alignment-baseline="center"
    font-size="16px"
    text-anchor="middle"
  >https://www.vrcarena.com/assets/${asset.id}</text>
</svg>`;

const getSvgForSpecies = (species) => `<svg viewBox="0 0 1000 500">
  <rect
    x="0"
    y="0"
    width="100%"
    height="100%"
    fill="#322148"
  />
  <text
    x="50%"
    y="15%"
    fill="white"
    font-family="Arial, Helvetica, sans-serif"
    alignment-baseline="center"
    font-size="32px"
    text-anchor="middle"
  >
    ${escapeStringForSvg(species.pluralname)}
  </text>
  <text
    x="50%"
    y="95%"
    fill="white"
    font-family="Arial, Helvetica, sans-serif"
    alignment-baseline="center"
    font-size="16px"
    text-anchor="middle"
  >https://www.vrcarena.com/species/${species.id}</text>
</svg>`;

const logIfNecessary = (count) => {
  if ((count / 50) % 1 === 0) {
    console.log(`${count} processed`);
  }
};

const getPathToThumbnailForAssetId = (assetId) => {
  const pathToAssetImages = path.resolve(outputPath, "asset-data", assetId);
  const pathWebp = path.resolve(pathToAssetImages, "thumb.webp");
  const pathPng = path.resolve(pathToAssetImages, "thumb.png");
  const pathJpg = path.resolve(pathToAssetImages, "thumb.jpg");

  if (originalFs.existsSync(pathWebp)) {
    return pathWebp;
  } else if (originalFs.existsSync(pathPng)) {
    return pathPng;
  } else if (originalFs.existsSync(pathJpg)) {
    return pathJpg;
  }

  return "";
};

const createAssetOverviews = async (assets) => {
  let count = 0;

  console.debug(`creating asset overviews...`);

  for (const asset of assets) {
    const pathToAssetImages = path.resolve(outputPath, "asset-data", asset.id);
    const pathOfImage = path.resolve(pathToAssetImages, "overview.png");

    try {
      await sharp(Buffer.from(getSvgForAsset(asset)))
        .composite(
          []
            .concat(
              asset.thumbnailurl
                ? [
                    {
                      input: getPathToThumbnailForAssetId(asset.id),
                      top: 125,
                      left: 150,
                    },
                  ]
                : []
            )
            .concat([
              {
                input: path.resolve(pathToAssetImages, "qrcode.png"),
                top: 125,
                left: 550,
              },
            ])
        )
        .png()
        .toFile(pathOfImage);
    } catch (err) {
      err.message = `Failed to create overview for asset "${asset.id}": ${err.message}`;
      throw err;
    }

    count++;

    logIfNecessary(count);
  }

  console.debug(`overviews created`);
};

const createSpeciesOverviews = async (species) => {
  let count = 0;

  console.debug(`creating species overviews...`);

  for (const speciesItem of species) {
    const pathToImages = path.resolve(
      outputPath,
      "species-data",
      speciesItem.id
    );
    const pathOfImage = path.resolve(pathToImages, "overview.png");

    try {
      await sharp(Buffer.from(getSvgForSpecies(speciesItem)))
        .composite(
          []
            .concat(
              speciesItem.thumbnailurl
                ? [
                    {
                      input: path.resolve(pathToImages, "thumb.webp"),
                      top: 125,
                      left: 150,
                    },
                  ]
                : []
            )
            .concat([
              {
                input: path.resolve(pathToImages, "qrcode.png"),
                top: 125,
                left: 550,
              },
            ])
        )
        .png()
        .toFile(pathOfImage);
    } catch (err) {
      err.message = `Failed to create overview for species "${speciesItem.id}": ${err.message}`;
      throw err;
    }

    count++;

    logIfNecessary(count);
  }

  console.debug(`overviews created`);
};

const main = async () => {
  try {
    const assets = await getAllAssets(isToUseExistingJson);

    console.debug(`found ${assets.length} assets`);

    const species = await getAllSpecies(isToUseExistingJson);

    console.debug(`found ${species.length} species`);

    await writeJson(species, assets);

    if (!only || only === "assets-qr") {
      await createQrCodesForAssets(assets);
    }

    if (!only || only === "species-qr") {
      await createQrCodesForSpecies(species);
    }

    if (!only || only === "assets-overview") {
      await createAssetOverviews(assets);
    }

    if (!only || only === "species-overview") {
      await createSpeciesOverviews(species);
    }

    if (isToDownload) {
      await downloadAssetThumbnails(assets);
      await downloadSpeciesThumbnails(species);
    } else {
      console.log("did not download thumbnails (pass --download to do this)");
    }

    console.log("done");
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

main();
