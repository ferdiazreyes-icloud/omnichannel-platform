const { execSync } = require("child_process");
const path = require("path");

const seedFile = path.join(__dirname, "..", "prisma", "seed.ts");

try {
  execSync(
    `npx ts-node --compiler-options '{"module":"CommonJS"}' "${seedFile}"`,
    { stdio: "inherit", cwd: path.join(__dirname, "..") }
  );
} catch (error) {
  console.error("Seed failed:", error.message);
  process.exit(1);
}
