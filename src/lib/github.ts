export type GitHubRepo = {
  name: string;
  description: string | null;
  language: string | null;
  html_url: string;
};

type GraphQLPinnedRepo = {
  name: string;
  description: string | null;
  url: string;
  primaryLanguage: { name: string } | null;
};

type GraphQLResponse = {
  data?: {
    user: {
      pinnedItems: {
        nodes: GraphQLPinnedRepo[];
      };
    } | null;
  };
  errors?: { message: string }[];
};

const PINNED_REPOS_QUERY = `
  query PinnedRepos($login: String!) {
    user(login: $login) {
      pinnedItems(first: 6, types: REPOSITORY) {
        nodes {
          ... on Repository {
            name
            description
            url
            primaryLanguage {
              name
            }
          }
        }
      }
    }
  }
`;

function authHeaders(): HeadersInit {
  const token = import.meta.env.GITHUB_TOKEN;

  if (!token) {
    throw new Error("GITHUB_TOKEN must be configured to fetch pinned repositories");
  }

  return {
    Accept: "application/vnd.github+json",
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };
}

export async function fetchPinnedRepos(username: string): Promise<GitHubRepo[]> {
  const response = await fetch("https://api.github.com/graphql", {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({
      query: PINNED_REPOS_QUERY,
      variables: { login: username },
    }),
  });

  if (!response.ok) {
    throw new Error(
      `GitHub API error for ${username}: ${response.status} ${response.statusText}`,
    );
  }

  const data = (await response.json()) as GraphQLResponse;

  if (data.errors?.length) {
    throw new Error(
      `GitHub GraphQL error: ${data.errors.map((e) => e.message).join(", ")}`,
    );
  }

  const nodes = data.data?.user?.pinnedItems.nodes;

  if (!nodes) {
    throw new Error(`GitHub user not found: ${username}`);
  }

  return nodes.map((repo) => ({
    name: repo.name,
    description: repo.description,
    language: repo.primaryLanguage?.name ?? null,
    html_url: repo.url,
  }));
}
