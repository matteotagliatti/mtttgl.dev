export type Project = {
  name: string;
  description: string | null;
  url: string;
  where: string;
};

export type StaticProject = {
  url: string;
  name: string;
  where: string;
  description?: string | null;
};

export function toProject(entry: StaticProject): Project {
  return {
    name: entry.name,
    description: entry.description ?? null,
    url: entry.url,
    where: entry.where,
  };
}
