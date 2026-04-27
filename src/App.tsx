import { RouterProvider } from 'react-router-dom';
import { Provider } from 'react-redux';
import { store } from './app/store';
import { router } from './router';
import { I18nProvider } from './i18n/I18nProvider';

function App() {
  return (
    <Provider store={store}>
      <I18nProvider>
        <RouterProvider router={router} />
      </I18nProvider>
    </Provider>
  );
}

export default App;
