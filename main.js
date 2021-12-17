require("./config-env");
const {
  getAllStaffUsers,
  getAllPatreonUsers,
  downloadAvatars,
  createStaffUserOverview,
  createPatreonUserOverview,
} = require("./users");
const {
  getAllAssets,
  downloadThumbnails: downloadAssetThumbnails,
  createQrCodesForAssets,
  writeAssetsToDisk,
  createAssetOverviews,
  resizeThumbnails: resizeAssetThumbnails,
} = require("./assets");
const {
  getAllSpecies,
  downloadThumbnails: downloadSpeciesThumbnails,
  createQrCodesForSpecies,
  writeSpeciesToDisk,
  createSpeciesOverviews,
} = require("./species");

const OperationNamesInOrder = {
  DOWNLOAD_ASSET_THUMBNAILS: "DOWNLOAD_ASSET_THUMBNAILS",
  RESIZE_ASSET_THUMBNAILS: "RESIZE_ASSET_THUMBNAILS",
  CREATE_ASSET_QR_CODES: "CREATE_ASSET_QR_CODES",
  CREATE_ASSET_OVERVIEWS: "CREATE_ASSET_OVERVIEWS",
  DOWNLOAD_SPECIES_THUMBNAILS: "DOWNLOAD_SPECIES_THUMBNAILS",
  CREATE_SPECIES_QR_CODES: "CREATE_SPECIES_QR_CODES",
  CREATE_SPECIES_OVERVIEWS: "CREATE_SPECIES_OVERVIEWS",
  DOWNLOAD_STAFF_USERS_AVATARS: "DOWNLOAD_STAFF_USERS_AVATARS",
  DOWNLOAD_STAFF_USERS_OVERVIEW: "DOWNLOAD_STAFF_USERS_OVERVIEW",
  DOWNLOAD_PATREON_USERS_AVATARS: "DOWNLOAD_PATREON_USERS_AVATARS",
  DOWNLOAD_PATREON_USERS_OVERVIEW: "DOWNLOAD_PATREON_USERS_OVERVIEW",
};

const operationNamesToOnlyPerformArg = process.argv.find((arg) =>
  arg.includes("--only")
);
const operationNamesToOnlyPerform = operationNamesToOnlyPerformArg
  ? operationNamesToOnlyPerformArg.split("=")[1].split(",")
  : [];

const operationNamesToSkipArg = process.argv.find((arg) =>
  arg.includes("--skip")
);
const operationNamesToSkip = operationNamesToSkipArg
  ? operationNamesToSkipArg.split("=")[1].split(",")
  : [];

const performOperation = async (
  operationName,
  assets,
  speciesItems,
  staffUsers,
  patreonUsers
) => {
  switch (operationName) {
    case OperationNamesInOrder.DOWNLOAD_ASSET_THUMBNAILS:
      await downloadAssetThumbnails(assets);
      break;
    case OperationNamesInOrder.RESIZE_ASSET_THUMBNAILS:
      await resizeAssetThumbnails(assets);
      break;
    case OperationNamesInOrder.CREATE_ASSET_QR_CODES:
      await createQrCodesForAssets(assets);
      break;
    case OperationNamesInOrder.CREATE_ASSET_OVERVIEWS:
      await createAssetOverviews(assets);
      break;
    case OperationNamesInOrder.DOWNLOAD_SPECIES_THUMBNAILS:
      await downloadSpeciesThumbnails(speciesItems);
      break;
    case OperationNamesInOrder.CREATE_SPECIES_QR_CODES:
      await createQrCodesForSpecies(speciesItems);
      break;
    case OperationNamesInOrder.CREATE_SPECIES_OVERVIEWS:
      await createSpeciesOverviews(speciesItems);
      break;
    case OperationNamesInOrder.DOWNLOAD_STAFF_USERS_AVATARS:
      await downloadAvatars(staffUsers);
      break;
    case OperationNamesInOrder.DOWNLOAD_STAFF_USERS_OVERVIEW:
      await createStaffUserOverview(staffUsers);
      break;
    case OperationNamesInOrder.DOWNLOAD_PATREON_USERS_AVATARS:
      await downloadAvatars(patreonUsers);
      break;
    case OperationNamesInOrder.DOWNLOAD_PATREON_USERS_OVERVIEW:
      await createPatreonUserOverview(patreonUsers);
      break;
    default:
      throw new Error(`Unknown operation name: ${operationName}`);
  }
};

const main = async () => {
  try {
    console.log("Starting...");

    const assets = await getAllAssets();
    const speciesItems = await getAllSpecies();
    const staffUsers = await getAllStaffUsers();
    const patreonUsers = await getAllPatreonUsers();

    await writeAssetsToDisk(assets);
    await writeSpeciesToDisk(speciesItems);

    // for (const operationName of Object.keys(OperationNamesInOrder)) {
    //   if (operationNamesToSkip.includes(operationName)) {
    //     console.log(`Skipping: ${operationName}`);
    //     continue;
    //   }

    //   if (
    //     operationNamesToOnlyPerform.length &&
    //     !operationNamesToOnlyPerform.includes(operationName)
    //   ) {
    //     console.log(`Skipping: ${operationName}`);
    //     continue;
    //   }

    //   await performOperation(
    //     operationName,
    //     assets,
    //     speciesItems,
    //     staffUsers,
    //     patreonUsers
    //   );
    // }

    console.log("All done");
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

main();
