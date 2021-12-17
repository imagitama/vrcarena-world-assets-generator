const { escapeStringForSvg } = require("../utils");

module.exports = (species) => `<svg viewBox="0 0 1000 500">
  <rect
    x="0"
    y="0"
    width="100%"
    height="100%"
    fill="#322148"
  />
  <text
    x="50%"
    y="18%"
    fill="white"
    font-family="Arial, Helvetica, sans-serif"
    font-weight="bold"
    alignment-baseline="center"
    font-size="54px"
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
