# mtttgl.dev

Personal website for [Matteo Tagliatti](https://mtttgl.dev).

This site auto-updates as much as possible from the services I already use, instead of duplicating the same information in multiple places. Profile details, projects, and activity feeds are pulled in at build or request time from external sources.

## Data sources

| Section             | Source                                                       |
| ------------------- | ------------------------------------------------------------ |
| Location & employer | [GitHub](https://github.com/matteotagliatti) profile         |
| Projects            | GitHub pinned repositories + static entries                  |
| Movies              | [Letterboxd](https://letterboxd.com/mattetgl/) diary         |
| Books               | [Hardcover](https://hardcover.app/@mattetgl) shelf           |
| Music               | [Spotify](https://open.spotify.com/user/matteotagliatti) top tracks |

## Setup

Copy `.env.example` to `.env` and fill in the API tokens you need:

```sh
cp .env.example .env
pnpm install
pnpm dev
```

Required tokens depend on which sections you want live:

- `GITHUB_TOKEN` — GitHub profile and pinned repos
- `HARDCOVER_TOKEN` — Hardcover bookshelf
- `SPOTIFY_CLIENT_ID`, `SPOTIFY_CLIENT_SECRET`, `SPOTIFY_REFRESH_TOKEN` — Spotify top tracks (`pnpm spotify:auth` to obtain the refresh token)

Set the same variables in your Vercel project settings for production.

## Stack

- [Astro](https://astro.build) with server-side rendering on Vercel
- [Tailwind CSS](https://tailwindcss.com)
- [@astrojs/alpinejs](https://docs.astro.build/en/guides/integrations-guide/alpinejs/) for the colophon dialog
