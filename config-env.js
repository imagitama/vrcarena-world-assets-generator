const isProd = process.argv.find((arg) => arg.includes("--prod"));

const path = require("path");

if (isProd) {
  console.log("### PRODUCTION ###");
} else {
  console.log("Development (use --prod for prod)");
}

require("dotenv").config({
  path: path.resolve(process.cwd(), isProd ? ".env.prod" : ".env.dev"),
});
