import { supabase, isSupabaseConfigured } from '../../supabase/client';
import type { RealtimePostgresChangesPayload } from '@supabase/supabase-js';

export type RealtimeStatus = 'connecting' | 'connected' | 'disconnected' | 'error';

let status: RealtimeStatus = 'disconnected';
const statusListeners = new Set<(s: RealtimeStatus) => void>();

function setStatus(newStatus: RealtimeStatus) {
  status = newStatus;
  statusListeners.forEach(cb => cb(newStatus));
}

export function getRealtimeStatus(): RealtimeStatus {
  return status;
}

export function subscribeToRealtimeStatus(callback: (s: RealtimeStatus) => void): () => void {
  statusListeners.add(callback);
  callback(status);
  return () => statusListeners.delete(callback);
}

export interface RealtimeCallbacks {
  onProductChange?: (payload: RealtimePostgresChangesPayload<any>) => void;
  onSaleChange?: (payload: RealtimePostgresChangesPayload<any>) => void;
  onEmployeeChange?: (payload: RealtimePostgresChangesPayload<any>) => void;
  onCustomerChange?: (payload: RealtimePostgresChangesPayload<any>) => void;
}

export function startRealtimeSync(callbacks: RealtimeCallbacks): () => void {
  if (!isSupabaseConfigured()) {
    console.warn('[Realtime] Supabase not configured, skipping Realtime');
    return () => {};
  }

  setStatus('connecting');
  console.log('[Realtime] Starting sync...');

  const channels: ReturnType<typeof supabase.channel>[] = [];

  if (callbacks.onProductChange) {
    const productsChannel = supabase
      .channel('db-products')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'products' },
        (payload) => {
          console.log('[Realtime] Product change:', payload);
          callbacks.onProductChange!(payload);
        }
      )
      .subscribe((status) => {
        console.log('[Realtime] Products channel:', status);
        if (status === 'SUBSCRIBED') setStatus('connected');
        if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') setStatus('error');
      });
    channels.push(productsChannel);
  }

  if (callbacks.onSaleChange) {
    const salesChannel = supabase
      .channel('db-sales')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'sales' },
        (payload) => {
          console.log('[Realtime] Sale inserted:', payload);
          callbacks.onSaleChange!(payload);
        }
      )
      .subscribe((status) => {
        console.log('[Realtime] Sales channel:', status);
        if (status === 'SUBSCRIBED') setStatus('connected');
        if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') setStatus('error');
      });
    channels.push(salesChannel);
  }

  if (callbacks.onEmployeeChange) {
    const employeesChannel = supabase
      .channel('db-employees')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'employees' },
        (payload) => {
          console.log('[Realtime] Employee change:', payload);
          callbacks.onEmployeeChange!(payload);
        }
      )
      .subscribe((status) => {
        console.log('[Realtime] Employees channel:', status);
        if (status === 'SUBSCRIBED') setStatus('connected');
        if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') setStatus('error');
      });
    channels.push(employeesChannel);
  }

  if (callbacks.onCustomerChange) {
    const customersChannel = supabase
      .channel('db-customers')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'customers' },
        (payload) => {
          console.log('[Realtime] Customer change:', payload);
          callbacks.onCustomerChange!(payload);
        }
      )
      .subscribe((status) => {
        console.log('[Realtime] Customers channel:', status);
        if (status === 'SUBSCRIBED') setStatus('connected');
        if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') setStatus('error');
      });
    channels.push(customersChannel);
  }

  const connectionChannel = supabase.channel('realtime-connection').subscribe((status) => {
    console.log('[Realtime] Connection channel:', status);
    if (status === 'SUBSCRIBED') setStatus('connected');
    if (status === 'CLOSED') setStatus('disconnected');
    if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') setStatus('error');
  });
  channels.push(connectionChannel);

  return () => {
    console.log('[Realtime] Stopping sync...');
    channels.forEach(ch => supabase.removeChannel(ch));
    setStatus('disconnected');
  };
}
