const path = require("path");
const sharp = require("sharp");
const { promises: fs } = require("fs");
const { client } = require("./supabase");
const getSvgForStaffUser = require("./svg/staff-user");
const getSvgForPatreonUser = require("./svg/patreon-user");
const getSvgForStaffUsersOverview = require("./svg/staff-users-overview");
const getSvgForPatreonUsersOverview = require("./svg/patreon-users-overview");
const { isNumberDivisibleBy } = require("./utils");
const { downloadFromStorageAsWebp } = require("./download");
const { logIfNecessary } = require("./utils");

const getUsersFromDisk = async (filename) => {
  const json = await fs.readFile(
    process.env.MY_OUTPUT_PATH,
    path.resolve(filename)
  );
  const data = JSON.parse(json);
  return data.users;
};

module.exports.getStaffUsersFromDisk = async () => {
  return getUsersFromDisk("staff-users");
};

module.exports.getAllStaffUsers = async () => {
  const { data, error } = await client
    .from("getStaffUsers".toLowerCase())
    .select("*");

  if (error) {
    throw new Error(
      `Failed to get staff users: ${error.code} ${error.message}`
    );
  }

  return data;
};

module.exports.getPatreonUsersFromDisk = async () => {
  return getUsersFromDisk("patreon-users");
};

module.exports.getAllPatreonUsers = async () => {
  const { data, error } = await client
    .from("getPatreonUsers".toLowerCase())
    .select("*");

  if (error) {
    throw new Error(
      `Failed to get patreon users: ${error.code} ${error.message}`
    );
  }

  return data;
};

module.exports.downloadAvatars = async (users) => {
  let count = 0;

  console.debug(`downloading ${users.length} user avatars...`);

  for (const user of users) {
    const destPath = path.resolve(
      process.cwd(),
      "downloads/user-avatars",
      user.id
    );

    await downloadFromStorageAsWebp(user.avatarurl, destPath, "avatar");

    count++;

    logIfNecessary(count);
  }

  console.debug(`downloading avatars done`);
};

module.exports.createStaffUserOverview = async (users) => {
  let count = 0;

  console.debug(`creating staff user overviews (${users.length})...`);

  const buffers = [];

  for (const user of users) {
    try {
      const pathToAvatar = path.resolve(
        process.cwd(),
        "downloads/user-avatars",
        user.id,
        "avatar.webp"
      );

      const resizedAvatarBuffer = user.avatarurl
        ? await sharp(pathToAvatar).resize(300, 300).toBuffer()
        : null;

      const svg = getSvgForStaffUser(user);

      const buffer = await sharp(Buffer.from(svg))
        .composite(
          [].concat(
            user.avatarurl
              ? [
                  {
                    input: resizedAvatarBuffer,
                    top: 50,
                    left: 50,
                  },
                ]
              : []
          )
        )
        .png()
        .toBuffer();

      buffers.push(buffer);
    } catch (err) {
      if (err.message.includes("Input file is missing")) {
        continue;
      }

      err.message = `Failed to create overview for user "${user.id}": ${err.message}`;
      throw err;
    }

    count++;

    logIfNecessary(count);
  }

  const pathToOverview = path.resolve(
    process.env.PATH_INSIDE_UNITY_PROJECT,
    "staff-users-overview.png"
  );

  let rowCount = 0;
  let colCount = 0;
  const maxRowCount = 3;
  const svg = getSvgForStaffUsersOverview();

  try {
    await sharp(Buffer.from(svg))
      .composite(
        buffers.map((buffer, idx) => {
          const returnVal = {
            input: buffer,
            top: 400 * rowCount + 100,
            left: 400 * colCount,
          };

          colCount++;

          if (isNumberDivisibleBy(maxRowCount, idx + 1)) {
            rowCount++;
            colCount = 0;
          }

          return returnVal;
        })
      )
      .png()
      .toFile(pathToOverview);
  } catch (err) {
    err.message = `Failed to create staff users overview: ${err.message}`;
    throw err;
  }

  console.debug(`staff overview created`);
};

module.exports.createPatreonUserOverview = async (users) => {
  let count = 0;

  console.debug(`creating patreon user overviews (${users.length})...`);

  const buffers = [];

  for (const user of users) {
    try {
      const pathToAvatar = path.resolve(
        process.cwd(),
        "downloads/user-avatars",
        user.id,
        "avatar.webp"
      );

      const resizedAvatarBuffer = user.avatarurl
        ? await sharp(pathToAvatar).resize(100, 100).toBuffer()
        : null;

      const svg = getSvgForPatreonUser(user);

      const buffer = await sharp(Buffer.from(svg))
        .composite(
          [].concat(
            user.avatarurl
              ? [
                  {
                    input: resizedAvatarBuffer,
                    top: 50,
                    left: 50,
                  },
                ]
              : []
          )
        )
        .png()
        .toBuffer();

      buffers.push(buffer);
    } catch (err) {
      if (err.message.includes("Input file is missing")) {
        continue;
      }

      err.message = `Failed to create overview for user "${user.id}": ${err.message}`;
      throw err;
    }

    count++;

    logIfNecessary(count);
  }

  const pathToOverview = path.resolve(
    process.env.PATH_INSIDE_UNITY_PROJECT,
    "patreon-users-overview.png"
  );

  let rowCount = 0;
  let colCount = 0;
  const maxRowCount = 7;
  const svg = getSvgForPatreonUsersOverview();

  try {
    await sharp(Buffer.from(svg))
      .composite(
        buffers.map((buffer, idx) => {
          const returnVal = {
            input: buffer,
            top: 175 * rowCount + 100,
            left: 175 * colCount,
          };

          colCount++;

          if (isNumberDivisibleBy(maxRowCount, idx + 1)) {
            rowCount++;
            colCount = 0;
          }

          return returnVal;
        })
      )
      .png()
      .toFile(pathToOverview);
  } catch (err) {
    err.message = `Failed to create patreon users overview: ${err.message}`;
    throw err;
  }

  console.debug(`patreon overview created`);
};
