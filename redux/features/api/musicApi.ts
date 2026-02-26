import { createMusicSlug } from "@/utils/urlUtils";
import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

export const musicApi = createApi({
  reducerPath: "musicApi",
  baseQuery: fetchBaseQuery({
    baseUrl: "https://musicwave-api.vercel.app/api",
  }),
  endpoints: (builder) => ({
    getTracksByGenre: builder.query({
      query: ({ genre, page = 1 }) =>
        `/search/playlists?query=${genre}&page=${page}`,
      transformResponse: (response) => {
        const transformedData = {
          ...response.data,
          results: response.data.results?.map((track) => ({
            ...track,
            slug: createMusicSlug(track.name),
            seoUrl: `/songs/${createMusicSlug(track.name)}`,
          })),
        };
        return transformedData;
      },
      // Merge pages for infinite loading
      serializeQueryArgs: ({ queryArgs }) => {
        const { genre } = queryArgs;
        return genre; // Only use genre as the cache key, ignore page
      },
      merge: (currentCache, newItems, { arg }) => {
        const { page } = arg;
        if (page === 1) {
          // Reset cache for new genre or first page
          return newItems;
        }
        // Merge new items with existing cache
        return {
          ...newItems,
          results: [
            ...(currentCache?.results || []),
            ...(newItems?.results || []),
          ],
        };
      },
      forceRefetch: ({ currentArg, previousArg }) => {
        // Force refetch when genre changes or page increases
        return (
          currentArg?.genre !== previousArg?.genre ||
          currentArg?.page !== previousArg?.page
        );
      },
    }),

    getTracksById: builder.query({
      query: ({ id, page = 1 }) => `/playlists?id=${id}&page=${page}`,
      transformResponse: (response) => {
        const transformedData = {
          ...response.data,
          songs:
            response.data.songs?.map((track) => ({
              ...track,
            })) ||
            response.data.results?.map((track) => ({
              ...track,
            })) ||
            [],
        };
        return transformedData;
      },
      // Serialize query args to use id as cache key, ignore page
      serializeQueryArgs: ({ queryArgs }) => {
        const { id } = queryArgs;
        return id;
      },
      merge: (currentCache, newItems, { arg }) => {
        const { page } = arg;
        if (page === 1) {
          // Reset cache for first page
          return newItems;
        }
        // Merge new songs with existing cache
        return {
          ...newItems,
          songs: [...(currentCache?.songs || []), ...(newItems?.songs || [])],
          // Keep track of pagination info
          hasMore: newItems.hasMore !== false && newItems.songs?.length > 0,
          total: newItems.total || currentCache?.total,
        };
      },
      forceRefetch: ({ currentArg, previousArg }) => {
        // Force refetch when id changes or page increases
        return (
          currentArg?.id !== previousArg?.id ||
          currentArg?.page !== previousArg?.page
        );
      },
    }),

    getGlobalSearchResults: builder.query({
      query: ({ query, page = 1 }) => `/search?query=${query}`,
      transformResponse: (response) => {
        const transformedData = {
          ...response.data,
          results: response.data.results?.map((item) => ({
            ...item,
            slug: createMusicSlug(item.name || item.title),
            seoUrl: `/songs/${createMusicSlug(item.name || item.title)}`,
          })),
        };
        return transformedData;
      },
    }),

    // Redux API - Fixed configuration
    getSearchResult: builder.query({
      query: ({ query, page = 1, activeTab }) =>
        `/search/${activeTab}?query=${query}&page=${page}`,
      transformResponse: (response) => {
        const transformedData = {
          ...response.data,
          results: response.data.results?.map((track) => ({
            ...track,
            slug: createMusicSlug(track.name),
            seoUrl: `/songs/${createMusicSlug(track.name)}`,
          })),
        };
        return transformedData;
      },
      // Fixed: Use query and activeTab as cache key
      serializeQueryArgs: ({ queryArgs }) => {
        const { query, activeTab } = queryArgs;
        return `${query}-${activeTab}`; // Cache by query and tab
      },
      merge: (currentCache, newItems, { arg }) => {
        const { page } = arg;
        if (page === 1) {
          // Reset cache for new search or tab
          return newItems;
        }
        // Merge new items with existing cache
        return {
          ...newItems,
          results: [
            ...(currentCache?.results || []),
            ...(newItems?.results || []),
          ],
        };
      },
      forceRefetch: ({ currentArg, previousArg }) => {
        // Fixed: Check for query, activeTab, or page changes
        return (
          currentArg?.query !== previousArg?.query ||
          currentArg?.activeTab !== previousArg?.activeTab ||
          currentArg?.page > (previousArg?.page || 1)
        );
      },
    }),

    getAlbumById: builder.query({
      query: ({ id, page = 1 }) => `/albums?id=${id}&page=${page}`,
      transformResponse: (response) => {
        const transformedData = {
          ...response.data,
          tracks:
            response.data.tracks?.map((track) => ({
              ...track,
            })) ||
            response.data.results?.map((track) => ({
              ...track,
            })) ||
            [],
        };
        return transformedData;
      },
      serializeQueryArgs: ({ queryArgs }) => {
        const { id } = queryArgs;
        return id;
      },
      merge: (currentCache, newItems, { arg }) => {
        const { page } = arg;
        if (page === 1) {
          // Reset cache for first page
          return newItems;
        }
        // Merge new tracks with existing cache
        return {
          ...newItems,
          tracks: [
            ...(currentCache?.tracks || []),
            ...(newItems?.tracks || []),
          ],
          hasMore: newItems.hasMore !== false && newItems.tracks?.length > 0,
          total: newItems.total || currentCache?.total,
        };
      },
      forceRefetch: ({ currentArg, previousArg }) => {
        // Force refetch when id changes or page increases
        return (
          currentArg?.id !== previousArg?.id ||
          currentArg?.page !== previousArg?.page
        );
      },
    }),

    getArtistById: builder.query({
      query: ({ id }) => `/artists/${id}`,
      transformResponse: (response) => {
        const transformedData = {
          data: response.data,
          slug: createMusicSlug(response.data.name),
          seoUrl: `/artists/${createMusicSlug(response.data.name)}`,
        };
        return transformedData;
      },
    }),

    // In your musicApi.js
    getArtistSongsById: builder.query({
      query: ({ id, page = 1, sortBy = "popularity", sortOrder = "desc" }) =>
        `/artists/${id}/songs?page=${page}&sortBy=${sortBy}&sortOrder=${sortOrder}`,
      transformResponse: (response) => {
        const transformedData = {
          ...response.data,
          songs:
            response.data.songs?.map((track) => ({
              ...track,
            })) ||
            response.data.results?.map((track) => ({
              ...track,
            })) ||
            [],
        };
        return transformedData;
      },
      // Update cache key to include sort parameters
      serializeQueryArgs: ({ queryArgs }) => {
        const { id, sortBy, sortOrder } = queryArgs;
        return `songs-${id}-${sortBy}-${sortOrder}`;
      },
      merge: (currentCache, newItems, { arg }) => {
        const { page } = arg;
        if (page === 1) {
          // Reset cache for first page (new sort)
          return newItems;
        }
        // Merge new songs with existing cache
        return {
          ...newItems,
          songs: [...(currentCache?.songs || []), ...(newItems?.songs || [])],
          hasMore: newItems.hasMore !== false && newItems.songs?.length > 0,
          total: newItems.total || currentCache?.total,
        };
      },
      forceRefetch: ({ currentArg, previousArg }) => {
        return (
          currentArg?.id !== previousArg?.id ||
          currentArg?.page !== previousArg?.page ||
          currentArg?.sortBy !== previousArg?.sortBy ||
          currentArg?.sortOrder !== previousArg?.sortOrder
        );
      },
    }),

    getArtistAlbumsById: builder.query({
      query: ({ id, page = 1, sortBy = "popularity", sortOrder = "desc" }) =>
        `/artists/${id}/albums?page=${page}&sortBy=${sortBy}&sortOrder=${sortOrder}`,
      transformResponse: (response) => {
        const transformedData = {
          ...response.data,
          albums:
            response.data.albums?.map((track) => ({
              ...track,
            })) ||
            response.data.results?.map((track) => ({
              ...track,
            })) ||
            [],
        };
        return transformedData;
      },
      // Update cache key to include sort parameters
      serializeQueryArgs: ({ queryArgs }) => {
        const { id, sortBy, sortOrder } = queryArgs;
        return `albums-${id}-${sortBy}-${sortOrder}`;
      },
      merge: (currentCache, newItems, { arg }) => {
        const { page } = arg;
        if (page === 1) {
          return newItems;
        }
        return {
          ...newItems,
          albums: [
            ...(currentCache?.albums || []),
            ...(newItems?.albums || []),
          ],
          hasMore: newItems.hasMore !== false && newItems.albums?.length > 0,
          total: newItems.total || currentCache?.total,
        };
      },
      forceRefetch: ({ currentArg, previousArg }) => {
        return (
          currentArg?.id !== previousArg?.id ||
          currentArg?.page !== previousArg?.page ||
          currentArg?.sortBy !== previousArg?.sortBy ||
          currentArg?.sortOrder !== previousArg?.sortOrder
        );
      },
    }),

    getSongById: builder.query({
      query: ({ id }) => `/songs/${id}`,
      transformResponse: (response) => {
        const transformedData = {
          data: response.data[0],

          slug: createMusicSlug(response.data.name),
          seoUrl: `/songs/${createMusicSlug(response.data.name)}`,
        };
        return transformedData;
      },
    }),

    getPlaylistById: builder.query({
      query: ({ id }) => `/playlists?id=${id}`,
    }),
    getSongsByIds: builder.query({
      queryFn: async (songIds, _queryApi, _extraOptions, fetchWithBQ) => {
        if (!songIds || songIds.length === 0) {
          return { data: [] };
        }

        try {
          const promises = songIds.map((id) => fetchWithBQ(`/songs/${id}`));

          const results = await Promise.all(promises);
          const songs = results
            .filter((result) => !result.error && result.data?.success)
            .map((result) => result.data.data[0])
            .filter(Boolean);

          return { data: songs };
        } catch (error) {
          return { error: { status: "FETCH_ERROR", error: error.message } };
        }
      },
      providesTags: (result, error, songIds) =>
        result
          ? [
              { type: "Song", id: "LIST" },
              ...songIds.map((id) => ({ type: "Song", id })),
            ]
          : [{ type: "Song", id: "LIST" }],
    }),

  getLyrics: builder.query({
  queryFn: async ({ artist, song, timestamps = false }) => {
    if (!artist || !song) {
      return { error: { status: "FETCH_ERROR", error: "Artist and song are required" } };
    }

    try {
      const params = new URLSearchParams({
        artist,
        song,
        timestamps: String(timestamps),
      });

      const response = await fetch(
        `https://difficult-nickie-shreshtha-4064af88.koyeb.app/lyrics/?${params.toString()}`
      );

      if (!response.ok) {
        return { error: { status: response.status, error: "Failed to fetch lyrics" } };
      }

      const data = await response.json();

      if (data?.status !== "success") {
        return { error: { status: "FETCH_ERROR", error: "Lyrics not found" } };
      }

      return { data: data.data };
    } catch (error) {
      return { error: { status: "FETCH_ERROR", error: error.message } };
    }
  },
  providesTags: (result, error, { artist, song }) =>
    result
      ? [
          { type: "Lyrics", id: "LIST" },
          { type: "Lyrics", id: `${artist}-${song}` },
        ]
      : [{ type: "Lyrics", id: "LIST" }],
}),
  }),
});

export const {
  useGetTracksByGenreQuery,
  useGetAlbumByIdQuery,
  useGetPlaylistByIdQuery,
  useGetTracksByIdQuery,
  useGetGlobalSearchResultsQuery,
  useGetSongByIdQuery,
  useGetArtistByIdQuery,
  useGetArtistSongsByIdQuery,
  useGetArtistAlbumsByIdQuery,
  useGetSearchResultQuery,
  useGetSongsByIdsQuery,
  useGetLyricsQuery,
} = musicApi;
