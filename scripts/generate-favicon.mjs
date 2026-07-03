import { writeFile } from "node:fs/promises";

const username = process.env.GITHUB_USERNAME ?? "matteotagliatti";
const response = await fetch(`https://github.com/${username}.png?size=64`);

if (!response.ok) {
  console.error(
    `Failed to fetch GitHub avatar for ${username}: ${response.status} ${response.statusText}`,
  );
  process.exit(1);
}

await writeFile("public/favicon.png", Buffer.from(await response.arrayBuffer()));
console.log(`Generated public/favicon.png from github.com/${username}`);
