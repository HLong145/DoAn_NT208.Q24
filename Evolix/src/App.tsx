/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { type ReactNode } from 'react';
import { BrowserRouter, Navigate, Route, Routes, useLocation } from 'react-router-dom';
import Layout from './components/Layout';
import { AuthProvider } from './contexts/AuthContext';
import Home from './pages/Home';
import Explore from './pages/Explore';
import Notifications from './pages/Notifications';
import Follow from './pages/Follow';
import Messages from './pages/Messages.tsx';
import Bookmarks from './pages/Bookmarks';
import Profile from './pages/Profile';
import TweetDetail from './pages/TweetDetail';
import Settings from './pages/Settings';
import ChangePassword from './pages/ChangePassword';
import AccountInformation from './pages/AccountInformation';
import DeactivateAccount from './pages/DeactivateAccount';
import DirectMessages from './pages/DirectMessages';
import PushNotifications from './pages/PushNotifications';
import EmailNotifications from './pages/EmailNotifications';
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import AddAccount from './pages/AddAccount';
import Logout from './pages/Logout';
import Post from './pages/Post';
import { ThemeProvider } from './contexts/ThemeContext';
import { getAuthSession } from './services/authApi';

function RequireAuth({ children }: { children: ReactNode }) {
  const location = useLocation();
  const session = getAuthSession();

  if (!session?.token) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return <>{children}</>;
}

function PublicOnlyRoute({ children }: { children: ReactNode }) {
  const session = getAuthSession();

  if (session?.token) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}

function RootRedirect() {
  return <Navigate to={getAuthSession()?.token ? '/' : '/login'} replace />;
}

export default function App() {
  return (
    <AuthProvider>
      <ThemeProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<PublicOnlyRoute><Login /></PublicOnlyRoute>} />
            <Route path="/register" element={<PublicOnlyRoute><Register /></PublicOnlyRoute>} />
            <Route path="/forgot-password" element={<PublicOnlyRoute><ForgotPassword /></PublicOnlyRoute>} />
            <Route path="/" element={<RequireAuth><Layout /></RequireAuth>}>
              <Route index element={<Home />} />
              <Route path="explore" element={<Explore />} />
              <Route path="notifications" element={<Notifications />} />
              <Route path="follow" element={<Follow />} />
              <Route path="messages" element={<Messages />} />
              <Route path="bookmarks" element={<Bookmarks />} />
              <Route path="profile" element={<Profile />} />
              <Route path="profile/:handle" element={<Profile />} />
              <Route path="tweet/:id" element={<TweetDetail />} />
              <Route path="settings" element={<Settings />} />
              <Route path="settings/change-password" element={<ChangePassword />} />
              <Route path="settings/account-info" element={<AccountInformation />} />
              <Route path="settings/deactivate-account" element={<DeactivateAccount />} />
              <Route path="settings/direct-messages" element={<DirectMessages />} />
              <Route path="settings/notifications/push" element={<PushNotifications />} />
              <Route path="settings/notifications/email" element={<EmailNotifications />} />
              <Route path="add-account" element={<AddAccount />} />
              <Route path="logout" element={<Logout />} />
              <Route path="post" element={<Post />} />
            </Route>
            <Route path="*" element={<RootRedirect />} />
          </Routes>
        </BrowserRouter>
      </ThemeProvider>
    </AuthProvider>
  );
}
