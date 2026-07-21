export type SpotifyTrack = {
  title: string;
  artist: string;
  albumArtUrl: string | null;
  link: string;
};

export type SpotifyData = {
  profileUrl: string;
  entries: SpotifyTrack[];
};

type SpotifyImage = {
  url: string;
  height: number;
  width: number;
};

type SpotifyArtist = {
  name: string;
};

type SpotifyAlbum = {
  images: SpotifyImage[];
};

type SpotifyApiTrack = {
  name: string;
  artists: SpotifyArtist[];
  album: SpotifyAlbum;
  external_urls: { spotify: string };
};

type TopTracksResponse = {
  items: SpotifyApiTrack[];
};

type SpotifyUser = {
  external_urls: { spotify: string };
};

type TokenResponse = {
  access_token: string;
  error?: string;
  error_description?: string;
};

function getCredentials(): {
  clientId: string;
  clientSecret: string;
  refreshToken: string;
} {
  const clientId = import.meta.env.SPOTIFY_CLIENT_ID;
  const clientSecret = import.meta.env.SPOTIFY_CLIENT_SECRET;
  const refreshToken = import.meta.env.SPOTIFY_REFRESH_TOKEN;

  if (!clientId || !clientSecret || !refreshToken) {
    throw new Error(
      "SPOTIFY_CLIENT_ID, SPOTIFY_CLIENT_SECRET, and SPOTIFY_REFRESH_TOKEN must be configured",
    );
  }

  return { clientId, clientSecret, refreshToken };
}

async function getAccessToken(): Promise<string> {
  const { clientId, clientSecret, refreshToken } = getCredentials();
  const basic = btoa(`${clientId}:${clientSecret}`);

  const response = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: {
      Authorization: `Basic ${basic}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: refreshToken,
    }),
  });

  if (!response.ok) {
    throw new Error(
      `Spotify token error: ${response.status} ${response.statusText}`,
    );
  }

  const data = (await response.json()) as TokenResponse;

  if (data.error || !data.access_token) {
    throw new Error(
      `Spotify token error: ${data.error_description ?? data.error ?? "unknown"}`,
    );
  }

  return data.access_token;
}

function largestImageUrl(images: SpotifyImage[]): string | null {
  if (!images.length) return null;
  const sorted = [...images].sort((a, b) => b.width - a.width);
  return sorted[0]?.url ?? null;
}

export async function fetchTopTracks(limit: number): Promise<SpotifyData> {
  const accessToken = await getAccessToken();

  const [tracksResponse, userResponse] = await Promise.all([
    fetch(
      `https://api.spotify.com/v1/me/top/tracks?time_range=short_term&limit=${limit}`,
      {
        headers: { Authorization: `Bearer ${accessToken}` },
      },
    ),
    fetch("https://api.spotify.com/v1/me", {
      headers: { Authorization: `Bearer ${accessToken}` },
    }),
  ]);

  if (!tracksResponse.ok) {
    throw new Error(
      `Spotify API error: ${tracksResponse.status} ${tracksResponse.statusText}`,
    );
  }

  if (!userResponse.ok) {
    throw new Error(
      `Spotify API error: ${userResponse.status} ${userResponse.statusText}`,
    );
  }

  const tracksData = (await tracksResponse.json()) as TopTracksResponse;
  const userData = (await userResponse.json()) as SpotifyUser;

  const entries: SpotifyTrack[] = tracksData.items.map((track) => ({
    title: track.name,
    artist: track.artists.map((a) => a.name).join(", "),
    albumArtUrl: largestImageUrl(track.album.images),
    link: track.external_urls.spotify,
  }));

  return {
    profileUrl: userData.external_urls.spotify,
    entries,
  };
}
