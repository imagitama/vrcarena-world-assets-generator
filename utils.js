module.exports.escapeStringForSvg = (string) =>
  string
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");

module.exports.logIfNecessary = (count) => {
  if ((count / 50) % 1 === 0) {
    console.log(`${count} processed`);
  }
};

module.exports.isNumberDivisibleBy = (divisibleBy, num) =>
  num % divisibleBy === 0;
