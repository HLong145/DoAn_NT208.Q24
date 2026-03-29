/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
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

export default function App() {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/" element={<Layout />}>
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
        </Routes>
      </BrowserRouter>
    </ThemeProvider>
  );
}
