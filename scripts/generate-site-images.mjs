import { writeFile } from "node:fs/promises";
import sharp from "sharp";

const username = process.env.GITHUB_USERNAME ?? "matteotagliatti";
const response = await fetch(`https://github.com/${username}.png?size=512`);

if (!response.ok) {
  console.error(
    `Failed to fetch GitHub avatar for ${username}: ${response.status} ${response.statusText}`,
  );
  process.exit(1);
}

const avatar = Buffer.from(await response.arrayBuffer());

await writeFile(
  "public/favicon.png",
  await sharp(avatar).resize(64, 64).png().toBuffer(),
);
await writeFile(
  "public/og.jpg",
  await sharp(avatar).resize(1200, 1200).jpeg({ quality: 85 }).toBuffer(),
);

console.log(
  `Generated public/favicon.png and public/og.jpg from github.com/${username}`,
);
