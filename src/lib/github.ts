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

type GraphQLProfileResponse = {
  data?: {
    user: {
      company: string | null;
      location: string | null;
    } | null;
  };
  errors?: { message: string }[];
};

export type GitHubProfile = {
  company: string | null;
  location: string | null;
};

const USER_PROFILE_QUERY = `
  query UserProfile($login: String!) {
    user(login: $login) {
      company
      location
    }
  }
`;

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

function formatCompany(company: string | null | undefined): string | null {
  if (!company) return null;
  const formatted = company.replace(/^@/, "").trim();
  return formatted || null;
}

function formatLocation(location: string | null | undefined): string | null {
  if (!location) return null;
  const formatted = location.trim();
  return formatted || null;
}

export async function fetchGitHubProfile(username: string): Promise<GitHubProfile> {
  return fetchGitHubProfileCached(username);
}

const profileRequests = new Map<string, Promise<GitHubProfile>>();

function fetchGitHubProfileCached(username: string): Promise<GitHubProfile> {
  const existing = profileRequests.get(username);
  if (existing) return existing;

  const request = fetchGitHubProfileUncached(username).finally(() => {
    profileRequests.delete(username);
  });

  profileRequests.set(username, request);
  return request;
}

async function fetchGitHubProfileUncached(username: string): Promise<GitHubProfile> {
  const response = await fetch("https://api.github.com/graphql", {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({
      query: USER_PROFILE_QUERY,
      variables: { login: username },
    }),
  });

  if (!response.ok) {
    throw new Error(
      `GitHub API error for ${username}: ${response.status} ${response.statusText}`,
    );
  }

  const data = (await response.json()) as GraphQLProfileResponse;

  if (data.errors?.length) {
    throw new Error(
      `GitHub GraphQL error: ${data.errors.map((e) => e.message).join(", ")}`,
    );
  }

  const user = data.data?.user;

  return {
    company: formatCompany(user?.company),
    location: formatLocation(user?.location),
  };
}

export async function fetchGitHubCompany(username: string): Promise<string | null> {
  const profile = await fetchGitHubProfile(username);
  return profile.company;
}

export async function fetchGitHubLocation(username: string): Promise<string | null> {
  const profile = await fetchGitHubProfile(username);
  return profile.location;
}
