import { useEffect } from 'react';
import { RouterProvider } from 'react-router-dom';
import { Provider } from 'react-redux';
import { store } from './app/store';
import { router } from './router';
import { I18nProvider } from './i18n/I18nProvider';
import { ToastProvider } from './components/ToastProvider';
import { initializeAuth } from './features/auth/authSlice';
import { useAppDispatch } from './app/store';

function AppInner() {
  const dispatch = useAppDispatch();

  useEffect(() => {
    dispatch(initializeAuth());
  }, [dispatch]);

  return (
    <I18nProvider>
      <ToastProvider>
        <RouterProvider router={router} />
      </ToastProvider>
    </I18nProvider>
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
