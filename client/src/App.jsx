import React, { Suspense } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import Layout from "./components/Layout.jsx";
import PageLoader from "./components/PageLoader.jsx";
import CallNotification from "./components/CallNotification.jsx";
import { useThemeStore } from "./store/useThemeStore.js";
import useAuthUser from "./hooks/useAuthUser.js";

// Lazy pages
const HomePage = React.lazy(() => import("./pages/HomePage.jsx"));
const SignupPage = React.lazy(() => import("./pages/SignupPage.jsx"));
const LoginPage = React.lazy(() => import("./pages/LoginPage.jsx"));
const OnboardingPage = React.lazy(() => import("./pages/OnboardingPage.jsx"));
const NotificationPage = React.lazy(() => import("./pages/NotificationPage.jsx"));
const FriendsPage = React.lazy(() => import("./pages/FriendsPage.jsx"));
const SearchPage = React.lazy(() => import("./pages/SearchPage.jsx"));
const CallPage = React.lazy(() => import("./pages/CallPage.jsx"));
const ChatPage = React.lazy(() => import("./pages/ChatPage.jsx"));
const EditProfilePage = React.lazy(() => import("./pages/EditProfilePage.jsx"));
const PublicProfilePage = React.lazy(() => import("./pages/PublicProfilePage.jsx"));

const App = () => {
  const { authUser, isLoading } = useAuthUser();
  const { theme } = useThemeStore();

  const isAuthenticated = !!authUser;
  const isOnboarded = authUser?.isOnboarded;

  if (isLoading) return <PageLoader />;

  return (
    <div className="h-screen" data-theme={theme}>
      <Suspense fallback={<PageLoader />}>
        <Routes>
          {/* HOME */}
          <Route
            path="/"
            element={
              isAuthenticated ? (
                isOnboarded ? (
                  <Layout showSidebar={true}>
                    <HomePage />
                  </Layout>
                ) : (
                  <Navigate to="/onboarding" />
                )
              ) : (
                <Navigate to="/login" />
              )
            }
          />

          {/* SIGNUP */}
          <Route
            path="/signup"
            element={!isAuthenticated ? <SignupPage /> : <Navigate to="/" />}
          />

          {/* LOGIN */}
          <Route
            path="/login"
            element={
              !isAuthenticated ? (
                <LoginPage onLoginSuccess={() => { }} />
              ) : (
                <Navigate to="/" />
              )
            }
          />

          {/* ONBOARDING */}
          <Route
            path="/onboarding"
            element={
              isAuthenticated && !isOnboarded ? (
                <OnboardingPage authUser={authUser} onComplete={() => { }} />
              ) : (
                <Navigate to="/" />
              )
            }
          />

          {/* NOTIFICATION */}
          <Route
            path="/notification"
            element={
              isAuthenticated ? (
                <Layout showSidebar={true}>
                  <NotificationPage />
                </Layout>
              ) : (
                <Navigate to="/login" />
              )
            }
          />

          {/* FRIENDS */}
          <Route
            path="/friends"
            element={
              isAuthenticated ? (
                <Layout showSidebar={true}>
                  <FriendsPage />
                </Layout>
              ) : (
                <Navigate to="/login" />
              )
            }
          />

          {/* SEARCH */}
          <Route
            path="/search"
            element={
              isAuthenticated ? (
                <Layout showSidebar={true}>
                  <SearchPage />
                </Layout>
              ) : (
                <Navigate to="/login" />
              )
            }
          />

          {/* CALL */}
          <Route
            path="/call"
            element={
              isAuthenticated ? (
                <Layout showSidebar={true}>
                  <CallPage />
                </Layout>
              ) : (
                <Navigate to="/login" />
              )
            }
          />

          {/* CHAT */}
          <Route
            path="/chat"
            element={
              isAuthenticated ? (
                <Layout showSidebar={true}>
                  <ChatPage authUser={authUser} />
                </Layout>
              ) : (
                <Navigate to="/login" />
              )
            }
          />
          <Route
            path="/chat/:id"
            element={
              isAuthenticated ? (
                <Layout showSidebar={true}>
                  <ChatPage authUser={authUser} />
                </Layout>
              ) : (
                <Navigate to="/login" />
              )
            }
          />

          {/* EDIT PROFILE */}
          <Route
            path="/profile/edit"
            element={
              isAuthenticated ? (
                <Layout showSidebar={true}>
                  <EditProfilePage authUser={authUser} />
                </Layout>
              ) : (
                <Navigate to="/login" />
              )
            }
          />

          {/* PUBLIC PROFILE */}
          <Route
            path="/profile/:id"
            element={
              isAuthenticated ? (
                <Layout showSidebar={true}>
                  <PublicProfilePage />
                </Layout>
              ) : (
                <Navigate to="/login" />
              )
            }
          />

          {/* 404 */}
          <Route
            path="*"
            element={
              <div className="text-center mt-20 text-xl font-bold">
                404 | Page Not Found
              </div>
            }
          />
        </Routes>
      </Suspense>

      <CallNotification />
      <Toaster position="top-right" reverseOrder={false} />
    </div>
  );
};

export default App;
