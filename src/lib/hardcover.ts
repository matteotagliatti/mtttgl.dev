export type HardcoverEntry = {
  title: string;
  coverUrl: string | null;
  link: string;
};

export type HardcoverData = {
  profileUrl: string;
  entries: HardcoverEntry[];
};

type GraphQLBook = {
  title: string;
  slug: string;
  image: { url: string } | null;
};

type GraphQLUserBook = {
  book: GraphQLBook;
};

type GraphQLUser = {
  username: string;
  user_books: GraphQLUserBook[];
};

type GraphQLResponse = {
  data?: { me: GraphQLUser[] };
  errors?: { message: string }[];
};

const RECENTLY_READ_QUERY = `
  query RecentlyRead($limit: Int!) {
    me {
      username
      user_books(
        where: { status_id: { _eq: 3 } }
        order_by: { last_read_date: desc_nulls_last }
        limit: $limit
      ) {
        book {
          title
          slug
          image {
            url
          }
        }
      }
    }
  }
`;

export async function fetchRecentlyRead(limit: number): Promise<HardcoverData> {
  const token = import.meta.env.HARDCOVER_TOKEN;

  if (!token) {
    throw new Error("HARDCOVER_TOKEN is not configured");
  }

  const response = await fetch("https://api.hardcover.app/v1/graphql", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      query: RECENTLY_READ_QUERY,
      variables: { limit },
    }),
  });

  if (!response.ok) {
    throw new Error(
      `Hardcover API error: ${response.status} ${response.statusText}`,
    );
  }

  const data = (await response.json()) as GraphQLResponse;

  if (data.errors?.length) {
    throw new Error(
      `Hardcover GraphQL error: ${data.errors.map((e) => e.message).join(", ")}`,
    );
  }

  const user = data.data?.me?.[0];

  if (!user?.username) {
    throw new Error("Hardcover API returned no authenticated user");
  }

  const entries: HardcoverEntry[] = user.user_books
    .filter((userBook) => userBook.book?.slug)
    .map((userBook) => ({
      title: userBook.book.title,
      coverUrl: userBook.book.image?.url ?? null,
      link: `https://hardcover.app/books/${userBook.book.slug}`,
    }));

  return {
    profileUrl: `https://hardcover.app/@${user.username}`,
    entries,
  };
}
