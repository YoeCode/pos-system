import { useState, useEffect } from 'react';
import { subscribeToRealtimeStatus, type RealtimeStatus } from './realtimeService';

export function useRealtimeStatusIndicator(): RealtimeStatus {
  const [status, setStatus] = useState<RealtimeStatus>('disconnected');

  useEffect(() => {
    return subscribeToRealtimeStatus(setStatus);
  }, []);

  return status;
}
