import { useEffect, useRef } from 'react';
import { useAppDispatch, useAppSelector } from '../../app/store';
import { startRealtimeSync, subscribeToRealtimeStatus } from './realtimeService';
import { isSupabaseConfigured } from '../../supabase/client';
import { selectMultiTerminalMode } from '../settings/settingsSlice';
import { fetchProductsAsync } from '../products/productsSlice';
import { fetchSalesAsync } from '../sales/salesSlice';
import { fetchEmployeesAsync } from '../employees/employeesSlice';
import { useToast } from '../../components/ToastProvider';

export function useRealtimeSync() {
  const dispatch = useAppDispatch();
  const isAuthenticated = useAppSelector(state => state.auth.isAuthenticated);
  const tenantId = useAppSelector(state => state.auth.user?.tenantId || '');
  const multiTerminalMode = useAppSelector(selectMultiTerminalMode);
  const { addToast } = useToast();
  const notifiedRef = useRef(false);

  useEffect(() => {
    if (!isSupabaseConfigured() || !isAuthenticated || !tenantId) return;

    const unsubscribeStatus = subscribeToRealtimeStatus((status) => {
      if (status === 'connected' && !notifiedRef.current) {
        notifiedRef.current = true;
        if (multiTerminalMode) {
          addToast('Sincronización multi-terminal activa', 'success');
        }
      }
      if (status === 'error') {
        addToast('Error de conexión en tiempo real', 'error');
      }
    });

    const unsubscribeSync = startRealtimeSync(tenantId, {
      onProductChange: () => {
        dispatch(fetchProductsAsync());
      },
      onSaleChange: () => {
        dispatch(fetchSalesAsync());
      },
      onEmployeeChange: () => {
        dispatch(fetchEmployeesAsync());
      },
    });

    return () => {
      unsubscribeStatus();
      unsubscribeSync();
      notifiedRef.current = false;
    };
  }, [dispatch, isAuthenticated, tenantId, multiTerminalMode, addToast]);
}
