const { promises: fs } = require("fs");
const path = require("path");
const sharp = require("sharp");
const { downloadFromStorageAsWebp } = require("./download");
const { logIfNecessary } = require("./utils");
const createQrCode = require("./qrcode");
const getSvgForSpecies = require("./svg/species");
const { client } = require("./supabase");

module.exports.writeSpeciesToDisk = async (speciesItems) => {
  const pathToJson = path.resolve(
    process.env.PATH_INSIDE_UNITY_PROJECT,
    "species.json"
  );
  const data = JSON.stringify(
    {
      species: speciesItems,
    },
    null,
    "  "
  );
  await fs.writeFile(pathToJson, data);
};

module.exports.getAllSpecies = async () => {
  const { data, error } = await client.from("species").select("*");

  if (error) {
    throw new Error(`Failed to get species: ${error.code} ${error.message}`);
  }

  const sortedData = data.sort((speciesA, speciesB) =>
    speciesA.pluralname.localeCompare(speciesB.pluralname)
  );

  return sortedData;
};

module.exports.downloadThumbnails = async (speciesItems) => {
  let count = 0;

  console.debug(`downloading ${speciesItems.length} species thumbnails...`);

  for (const speciesItem of speciesItems) {
    const destPath = path.resolve(
      process.cwd(),
      "downloads/species-thumbnails",
      speciesItem.id
    );

    await downloadFromStorageAsWebp(
      speciesItem.thumbnailurl,
      destPath,
      "thumbnail"
    );

    count++;

    logIfNecessary(count);
  }

  console.debug(`downloading species thumbnails done`);
};

module.exports.createQrCodesForSpecies = async (species) => {
  let count = 0;

  console.debug(`creating ${species.length} species QR codes...`);

  for (const speciesItem of species) {
    const pathToQrCode = path.resolve(
      process.cwd(),
      "downloads/species-qr-codes",
      speciesItem.id,
      "qrcode.png"
    );

    const url = `https://www.vrcarena.com/species/${
      speciesItem.slug || speciesItem.id
    }`;

    await createQrCode(url, pathToQrCode);

    count++;

    logIfNecessary(count);
  }

  console.debug(`QR codes created`);
};

module.exports.createSpeciesOverviews = async (species) => {
  let count = 0;

  console.debug(`creating ${species.length} species overviews...`);

  for (const speciesItem of species) {
    const pathToOutputParent = path.resolve(
      process.env.PATH_INSIDE_UNITY_PROJECT,
      "species-overviews",
      speciesItem.id
    );

    const pathToOutput = path.resolve(pathToOutputParent, "overview.png");
    const svg = getSvgForSpecies(speciesItem);

    const pathToQrCode = path.resolve(
      process.cwd(),
      "downloads/species-qr-codes",
      speciesItem.id,
      "qrcode.png"
    );

    const pathToThumbnail = path.resolve(
      process.cwd(),
      "downloads/species-thumbnails",
      speciesItem.id,
      "thumbnail.webp"
    );

    await fs.mkdir(pathToOutputParent, { recursive: true });

    try {
      await sharp(Buffer.from(svg))
        .composite(
          []
            .concat(
              speciesItem.thumbnailurl
                ? [
                    {
                      input: pathToThumbnail,
                      top: 125,
                      left: 150,
                    },
                  ]
                : []
            )
            .concat([
              {
                input: pathToQrCode,
                top: 125,
                left: 550,
              },
            ])
        )
        .png()
        .toFile(pathToOutput);
    } catch (err) {
      err.message = `Failed to create overview for species "${speciesItem.id}": ${err.message}`;
      throw err;
    }

    count++;

    logIfNecessary(count);
  }

  console.debug(`overviews created`);
};
