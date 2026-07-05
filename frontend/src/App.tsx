import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { MantineProvider } from '@mantine/core';
import { Notifications } from '@mantine/notifications';
import { theme } from './theme';
import { AuthProvider } from './context/AuthContext';
import { Layout } from './components/Layout';
import { AuthGuard } from './components/AuthGuard';
import { HomePage } from './pages/HomePage';
import { EventTypesPage } from './pages/EventTypesPage';
import { SlotsPage } from './pages/SlotsPage';
import { AvailabilityPage } from './pages/AvailabilityPage';
import { CalendarPage } from './pages/CalendarPage';
import { BookingPage } from './pages/BookingPage';

import '@mantine/core/styles.css';
import '@mantine/dates/styles.css';
import '@mantine/notifications/styles.css';

export default function App() {
  return (
    <MantineProvider theme={theme}>
      <Notifications />
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route element={<Layout />}>
              <Route path="/" element={<HomePage />} />
              <Route
                path="/event-types"
                element={
                  <AuthGuard>
                    <EventTypesPage />
                  </AuthGuard>
                }
              />
              <Route
                path="/event-types/:eventTypeId/slots"
                element={
                  <AuthGuard>
                    <SlotsPage />
                  </AuthGuard>
                }
              />
              <Route
                path="/availability"
                element={
                  <AuthGuard>
                    <AvailabilityPage />
                  </AuthGuard>
                }
              />
              <Route
                path="/calendar"
                element={
                  <AuthGuard>
                    <CalendarPage />
                  </AuthGuard>
                }
              />
              <Route path="/book" element={<Navigate to="/" replace />} />
              <Route path="/book/:slug" element={<BookingPage />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </MantineProvider>
  );
}