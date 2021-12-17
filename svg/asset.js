const { escapeStringForSvg } = require("../utils");

module.exports = (asset) => `<svg viewBox="0 0 1000 500">
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
  font-size="48px"
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
