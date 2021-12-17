const { escapeStringForSvg } = require("../utils");

module.exports = () => `<svg viewBox="0 0 1300 1000">
<rect
  x="0"
  y="0"
  width="100%"
  height="100%"
  fill="#322148"
/>
<text
  x="50%"
  y="7%"
  fill="white"
  font-family="Arial, Helvetica, sans-serif"
  alignment-baseline="center"
  font-size="32px"
  text-anchor="middle"
>Our Volunteer Staff
</text>
<text
  x="50%"
  y="95%"
  fill="white"
  font-family="Arial, Helvetica, sans-serif"
  alignment-baseline="center"
  font-size="16px"
  text-anchor="middle"
>https://www.vrcarena.com/users (filter by Staff)</text>
</svg>`;
