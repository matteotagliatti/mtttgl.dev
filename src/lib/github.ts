export type GitHubRepo = {
  name: string;
  description: string | null;
  language: string | null;
  html_url: string;
};

function parseGitHubUrl(url: string): { owner: string; repo: string } {
  const match = url.match(/github\.com\/([^/]+)\/([^/]+)/);
  if (!match) {
    throw new Error(`Invalid GitHub URL: ${url}`);
  }

  const [, owner, repo] = match;
  return { owner, repo: repo.replace(/\.git$/, "") };
}

export async function fetchGitHubRepo(url: string): Promise<GitHubRepo> {
  const { owner, repo } = parseGitHubUrl(url);
  const headers: HeadersInit = {
    Accept: "application/vnd.github+json",
  };

  if (import.meta.env.GITHUB_TOKEN) {
    headers.Authorization = `Bearer ${import.meta.env.GITHUB_TOKEN}`;
  }

  const response = await fetch(`https://api.github.com/repos/${owner}/${repo}`, {
    headers,
  });

  if (!response.ok) {
    throw new Error(
      `GitHub API error for ${owner}/${repo}: ${response.status} ${response.statusText}`,
    );
  }

  const data = await response.json();

  return {
    name: data.name,
    description: data.description,
    language: data.language,
    html_url: data.html_url,
  };
}
