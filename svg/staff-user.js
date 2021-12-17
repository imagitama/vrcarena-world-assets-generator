const { escapeStringForSvg } = require("../utils");

module.exports = (user) => `<svg viewBox="0 0 400 400">
<rect
  x="0"
  y="0"
  width="100%"
  height="100%"
  fill="#322148"
/>
<text
  x="50%"
  y="5%"
  fill="white"
  font-family="Arial, Helvetica, sans-serif"
  alignment-baseline="center"
  font-size="24px"
  text-anchor="middle"
>${escapeStringForSvg(user.username)}
</text>
</svg>`;
