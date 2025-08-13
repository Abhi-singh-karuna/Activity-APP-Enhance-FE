const path = require("path");
const fs = require("fs");
const sharp = require("sharp");

async function ensureDir(dir) {
  await fs.promises.mkdir(dir, { recursive: true });
}

async function generatePng(inputSvg, outputPng, size, background) {
  const svgBuffer = await fs.promises.readFile(inputSvg);
  const resized = await sharp(svgBuffer, { density: 512 })
    .resize(size, size, { fit: "contain", background: background || "transparent" })
    .png()
    .toBuffer();
  await fs.promises.writeFile(outputPng, resized);
}

async function main() {
  const projectRoot = path.resolve(__dirname, "..");
  const assetsDir = path.join(projectRoot, "assets");

  const argv = process.argv.slice(2);
  const svgArgIndex = argv.indexOf("--svg");
  const nameArgIndex = argv.indexOf("--name");

  const svgPath = svgArgIndex !== -1 && argv[svgArgIndex + 1]
    ? path.join(projectRoot, argv[svgArgIndex + 1])
    : path.join(assetsDir, "logo.svg");
  const nameSuffix = nameArgIndex !== -1 && argv[nameArgIndex + 1]
    ? `-${argv[nameArgIndex + 1]}`
    : "";

  const iconPng = path.join(assetsDir, `icon${nameSuffix}.png`);
  const adaptivePng = path.join(assetsDir, `adaptive-icon${nameSuffix}.png`);

  await ensureDir(assetsDir);

  if (!fs.existsSync(svgPath)) {
    console.error("Missing SVG at:", svgPath);
    process.exit(1);
  }

  await generatePng(svgPath, iconPng, 1024, { r: 255, g: 255, b: 255, alpha: 0 });
  await generatePng(svgPath, adaptivePng, 1024, { r: 255, g: 255, b: 255, alpha: 0 });

  console.log("Generated:", iconPng, "and", adaptivePng);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});


