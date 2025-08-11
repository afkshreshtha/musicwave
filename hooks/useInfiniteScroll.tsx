import { useState, useEffect, useCallback } from 'react';

export const useInfiniteScroll = (callback, hasMore, loading) => {
  const [isFetching, setIsFetching] = useState(false);

  useEffect(() => {
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    if (!isFetching) return;
    if (!hasMore) {
      setIsFetching(false);
      return;
    }
    fetchMore();
  }, [isFetching, hasMore]);

  const handleScroll = () => {
    if (loading || isFetching || !hasMore) return;
    
    if (window.innerHeight + document.documentElement.scrollTop !== document.documentElement.offsetHeight) return;
    
    setIsFetching(true);
  };

  const fetchMore = useCallback(async () => {
    await callback();
    setIsFetching(false);
  }, [callback]);

  return [isFetching, setIsFetching];
};
