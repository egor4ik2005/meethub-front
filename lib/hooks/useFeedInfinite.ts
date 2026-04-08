import {
  useInfiniteQuery,
  QueryKey,
  InfiniteData,
} from '@tanstack/react-query';
import { getForYouFeed } from '@/lib/api/generated/feed/feed';
import type { FeedResponse } from '@/lib/api/generated/models';
import { useAuthStore } from '@/lib/store/useAuthStore';

const LIMIT = 10;

/**
 * Custom useInfiniteQuery for the For-You feed with cursor-based pagination.
 * Orval generates useQuery but not useInfiniteQuery for cursor APIs,
 * so we build it manually using the generated raw fetch function `getForYouFeed`.
 *
 * Feed API shape: GET /feed/foryou?cursor=...&limit=...
 * Response: { items: VideoResponse[], next_cursor: string | null }
 */
export function useForYouFeedInfinite(hashtag?: string) {
  const token = useAuthStore((s) => s.token);

  return useInfiniteQuery<FeedResponse, Error, InfiniteData<FeedResponse>, QueryKey, string | undefined>({
    queryKey: ['feed', 'foryou', 'infinite', hashtag ?? null],
    initialPageParam: undefined,
    getNextPageParam: (lastPage) => lastPage.next_cursor ?? undefined,
    queryFn: async ({ pageParam }): Promise<FeedResponse> => {
      // customInstance (axios mutator) already unwraps .data, so result is FeedResponse directly
      return getForYouFeed({ cursor: pageParam, limit: LIMIT }) as unknown as FeedResponse;
    },
    enabled: !!token,
    staleTime: 1000 * 30,
  });
}

export type { FeedResponse };
export { LIMIT };

