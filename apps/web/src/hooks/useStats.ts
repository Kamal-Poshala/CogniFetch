import { useEffect, useState } from 'react';
import { fetchStats } from '../api/client.ts';
import type { CorpusStats } from '../api/types.ts';

export function useStats(): CorpusStats | null {
  const [stats, setStats] = useState<CorpusStats | null>(null);
  useEffect(() => {
    const controller = new AbortController();
    fetchStats(controller.signal)
      .then(setStats)
      .catch(() => {
        /* header stats are non-essential */
      });
    return () => controller.abort();
  }, []);
  return stats;
}
