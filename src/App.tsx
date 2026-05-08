import { RouterProvider } from 'react-router-dom';
import { Provider } from 'react-redux';
import { store } from './app/store';
import { router } from './router';
import { I18nProvider } from './i18n/I18nProvider';
import { ToastProvider } from './components/ToastProvider';

function App() {
  return (
    <Provider store={store}>
      <I18nProvider>
        <ToastProvider>
          <RouterProvider router={router} />
        </ToastProvider>
      </I18nProvider>
    </Provider>
  );
}

export default App;
