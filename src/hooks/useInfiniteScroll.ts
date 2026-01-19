import { useState, useEffect, useCallback, useRef } from 'react';

interface UseInfiniteScrollOptions<T> {
  items: T[];
  itemsPerPage: number;
  enabled: boolean;
}

export function useInfiniteScroll<T>({
  items,
  itemsPerPage,
  enabled,
}: UseInfiniteScrollOptions<T>) {
  const [displayedItems, setDisplayedItems] = useState<T[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const loadMoreRef = useRef<HTMLDivElement | null>(null);

  // Reset when items or enabled state changes
  useEffect(() => {
    setPage(1);
    if (enabled) {
      setDisplayedItems(items.slice(0, itemsPerPage));
      setHasMore(items.length > itemsPerPage);
    } else {
      setDisplayedItems(items);
      setHasMore(false);
    }
  }, [items, itemsPerPage, enabled]);

  const loadMore = useCallback(() => {
    if (!enabled || !hasMore) return;

    const nextPage = page + 1;
    const start = 0;
    const end = nextPage * itemsPerPage;
    const newItems = items.slice(start, end);

    setDisplayedItems(newItems);
    setPage(nextPage);
    setHasMore(end < items.length);
  }, [enabled, hasMore, page, items, itemsPerPage]);

  // Set up intersection observer
  useEffect(() => {
    if (!enabled) return;

    observerRef.current = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore) {
          loadMore();
        }
      },
      { threshold: 0.1, rootMargin: '100px' }
    );

    if (loadMoreRef.current) {
      observerRef.current.observe(loadMoreRef.current);
    }

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [enabled, hasMore, loadMore]);

  const setLoadMoreElement = useCallback((element: HTMLDivElement | null) => {
    if (loadMoreRef.current && observerRef.current) {
      observerRef.current.unobserve(loadMoreRef.current);
    }

    loadMoreRef.current = element;

    if (element && observerRef.current) {
      observerRef.current.observe(element);
    }
  }, []);

  return {
    displayedItems,
    hasMore,
    loadMoreRef: setLoadMoreElement,
    page,
    totalPages: Math.ceil(items.length / itemsPerPage),
  };
}
