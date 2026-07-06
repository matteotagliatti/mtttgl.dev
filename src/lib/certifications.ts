import { readdirSync } from "node:fs";
import { join } from "node:path";

export type Certification = {
  year: number;
  issuer: string;
  title: string;
  url: string;
};

const CERT_DIR = join(process.cwd(), "public/certifications");

function parseFilename(file: string): Certification {
  const url = `/certifications/${encodeURIComponent(file)}`;
  const match = file.match(/^(\d{4}) - (.+) - (.+)\.pdf$/);

  if (!match) {
    return {
      year: 0,
      issuer: "",
      title: file.replace(/\.pdf$/, ""),
      url,
    };
  }

  const [, year, issuer, title] = match;
  return {
    year: Number.parseInt(year, 10),
    issuer,
    title,
    url,
  };
}

export function getCertifications(): Certification[] {
  return readdirSync(CERT_DIR)
    .filter((file) => file.endsWith(".pdf"))
    .map(parseFilename)
    .sort((a, b) => b.year - a.year || a.title.localeCompare(b.title));
}
