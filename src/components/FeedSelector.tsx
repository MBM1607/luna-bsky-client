import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../lib/bluesky/hooks/useAuth';
import { useFeeds } from '../lib/bluesky/hooks/useFeeds';
import { usePreferences } from '../lib/bluesky/hooks/usePreferences';

export const FeedSelector = () => {
  const { isAuthenticated } = useAuth();
  const preferences = usePreferences();
  const queryClient = useQueryClient();
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
  const { isLoading, error, data } = useFeeds({ feeds });

  if (isLoading) {
    return <div className="text-gray-600 dark:text-gray-400">Loading feeds...</div>;
  }

  if (error) {
    return <div className="text-red-500">{error.message}</div>;
  }

  const onClick = () => {
    // make the feed mark as stale
    queryClient.invalidateQueries({
      queryKey: ['timeline', { isAuthenticated: true }],
    });
  };

  return (
    <ul className="flex flex-row gap-2 max-w-full overflow-x-scroll">
      {data?.map((feed) => (
        <li key={feed.uri} className="p-2 bg-blue-500 w-auto">
          <button className="text-white whitespace-nowrap" onClick={onClick}>
            {feed.displayName}
          </button>
        </li>
      ))}
    </ul>
  );
};
