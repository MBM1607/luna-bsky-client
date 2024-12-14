import { useInfiniteQuery } from '@tanstack/react-query';
import { useBlueskyStore } from '../store';
import { usePreferences } from './usePreferences';
import { BskyPost } from '../types';

type Timeline = {
  feed: {
    post: BskyPost;
    feedContext: string;
  }[];
  cursor: string;
};

export function useTimeline() {
  const { agent, isAuthenticated } = useBlueskyStore();
  const preferences = usePreferences();
  const savedFeedsPrefV2 = isAuthenticated
    ? preferences.data?.find((item) => item.$type === 'app.bsky.actor.defs#savedFeedsPrefV2')
    : null;
  const feeds =
    (
      savedFeedsPrefV2?.items as
        | (
            | {
                type: 'feed';
                value: `at://${string}`;
                pinned: boolean;
                id: string;
              }
            | {
                type: 'timeline';
                value: string;
                pinned: boolean;
                id: string;
              }
          )[]
        | undefined
    )
      ?.filter((item) => item.type === 'feed')
      ?.map((item) => item.value) ?? [];
  const feed = feeds[0];

  return useInfiniteQuery<Timeline>({
    queryKey: ['timeline', { isAuthenticated }],
    queryFn: async ({ pageParam }) => {
      if (!agent) {
        throw new Error('Not authenticated');
      }

      // // guest
      // if (!isAuthenticated) {
      //   return agent.app.bsky.feed.getFeed({
      //     feed: "discover",
      //   });
      // }

      // authenticated
      const cursor = pageParam as string | undefined;
      const response = await agent.app.bsky.feed.getFeed({
        feed,
        cursor,
      });

      return response.data as Timeline;
    },
    getNextPageParam: (lastPage) => lastPage.cursor,
    initialPageParam: undefined,
    enabled: !!agent && feed !== undefined,
    retry: 1,
  });
}
