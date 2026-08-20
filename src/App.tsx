import { useEffect } from 'react';
import { RouterProvider } from 'react-router-dom';
import { Provider } from 'react-redux';
import { store } from './app/store';
import { router } from './router';
import { I18nProvider } from './i18n/I18nProvider';
import { ToastProvider } from './components/ToastProvider';
import { ErrorBoundary } from './components/ErrorBoundary';
import { initializeAuth } from './features/auth/authSlice';
import { fetchProductsAsync } from './features/products/productsSlice';
import { fetchSalesAsync, loadNextOrderNumberAsync } from './features/sales/salesSlice';
import { fetchEmployeesAsync } from './features/employees/employeesSlice';
import { fetchSettingsFromSupabase, syncCategoriesToSupabase, syncBrandsToSupabase, syncSizesToSupabase, syncSizeGroupsToSupabase } from './features/settings/settingsSlice';
import { useAppDispatch, useAppSelector } from './app/store';

function AppInner() {
  const dispatch = useAppDispatch();
  const isAuthenticated = useAppSelector(state => state.auth.isAuthenticated);
  const tenantId = useAppSelector(state => state.auth.user?.tenantId);

  useEffect(() => {
    dispatch(initializeAuth());
  }, [dispatch]);

  useEffect(() => {
    if (isAuthenticated && tenantId) {
      dispatch(fetchProductsAsync());
      dispatch(fetchSalesAsync());
      dispatch(loadNextOrderNumberAsync());
      dispatch(fetchEmployeesAsync());
      dispatch(fetchSettingsFromSupabase(tenantId)).then((result: any) => {
        if (result.meta.requestStatus === 'fulfilled' && !result.payload.hasData) {
          const { pos } = store.getState().settings;
          dispatch(syncCategoriesToSupabase({ tenantId, categories: pos.categories }));
          dispatch(syncBrandsToSupabase({ tenantId, brands: pos.brands }));
          dispatch(syncSizesToSupabase({ tenantId, sizes: pos.sizes }));
          dispatch(syncSizeGroupsToSupabase({ tenantId, sizeGroups: pos.sizeGroups }));
        }
      });
    }
  }, [dispatch, isAuthenticated, tenantId]);

  return (
    <ErrorBoundary>
      <I18nProvider>
        <ToastProvider>
          <RouterProvider router={router} />
        </ToastProvider>
      </I18nProvider>
    </ErrorBoundary>
  );
}

function App() {
  return (
    <Provider store={store}>
      <AppInner />
    </Provider>
  );
}

export default App;
