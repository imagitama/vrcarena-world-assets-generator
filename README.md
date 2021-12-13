# Create Assets Overview for Unity

A Node.js script that gets all approved avatars from VRCArena and generates a single "overview" image for use in a Unity world.

It:

1. queries the database to fetch all approved avatars and species
2. outputs to a JSON file
3. downloads assets and species thumbnails
4. generates a QR code image for them
5. merges everything into a single overview image (using a SVG template in code)

## Usage

    npm i
    npm start -- --output="path/to/parent/folder/in/unity"

Example:

    npm start -- --output="C:/myproject/Assets/MyOverviews"

## Switches

### `--download`

Download all thumbnails.

### `--prod`

Switch from `.env.dev` to `.env.prod`

### `--existing`

Do not query database - use existing JSON file.

### `--only=$thing`

Only perform the name of the action (see JS)