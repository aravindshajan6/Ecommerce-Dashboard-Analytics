import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import App from './App.jsx';
import { ThemeProvider } from './lib/theme.jsx';
import { RangeProvider } from './lib/range.jsx';
import './styles/globals.css';
import 'leaflet/dist/leaflet.css';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 60_000, refetchOnWindowFocus: false, retry: 1 },
  },
});

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <RangeProvider>
          <BrowserRouter>
            <App />
          </BrowserRouter>
        </RangeProvider>
      </ThemeProvider>
    </QueryClientProvider>
  </StrictMode>,
);
