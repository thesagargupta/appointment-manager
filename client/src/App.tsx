import { lazy, Suspense, type ComponentType } from 'react';
import { Route, Routes } from 'react-router-dom';
import { AppLayout } from './components/layout/AppLayout';
import { ProtectedRoute } from './components/layout/ProtectedRoute';
import { Spinner } from './components/ui/Feedback';
import { useIsMobile } from './hooks/useMediaQuery';

const LoginPage = lazy(() => import('./pages/LoginPage'));
const DashboardPage = lazy(() => import('./pages/DashboardPage'));
const AppointmentsPage = lazy(() => import('./pages/AppointmentsPage'));
const MobileHomePage = lazy(() => import('./pages/MobileHomePage'));
const MobileAppointmentsPage = lazy(() => import('./pages/MobileAppointmentsPage'));
const NewAppointmentPage = lazy(() => import('./pages/NewAppointmentPage'));
const ProfilePage = lazy(() => import('./pages/ProfilePage'));
const NotFoundPage = lazy(() => import('./pages/NotFoundPage'));

/** Picks the desktop or phone version of a screen; only the chosen chunk is downloaded. */
const responsive = (Desktop: ComponentType, Mobile: ComponentType) =>
  function ResponsivePage() {
    return useIsMobile() ? <Mobile /> : <Desktop />;
  };
const Home = responsive(DashboardPage, MobileHomePage);
const Appointments = responsive(AppointmentsPage, MobileAppointmentsPage);

export default function App() {
  return (
    <Suspense fallback={<Spinner />}>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route element={<ProtectedRoute />}>
          <Route path="new" element={<NewAppointmentPage />} />
          <Route element={<AppLayout />}>
            <Route index element={<Home />} />
            <Route path="appointments" element={<Appointments />} />
            <Route path="profile" element={<ProfilePage />} />
            <Route path="*" element={<NotFoundPage />} />
          </Route>
        </Route>
      </Routes>
    </Suspense>
  );
}
