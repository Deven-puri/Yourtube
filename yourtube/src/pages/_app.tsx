import Header from "@/components/Header";
import Sidebar from "@/components/Sidebar";
import { Toaster } from "@/components/ui/sonner";
import ThemeIndicator from "@/components/ThemeIndicator";
import "@/styles/globals.css";
import type { AppProps } from "next/app";
import { UserProvider, useUser } from "../lib/AuthContext";
import { ThemeProvider, useTheme } from "../lib/ThemeContext";
import { useRouter } from "next/router";
import { useEffect } from "react";

const AUTH_ROUTES = ["/signin", "/signup"];

const AuthGate = ({ children }: { children: React.ReactNode }) => {
  const { user } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (!user && !AUTH_ROUTES.includes(router.pathname)) {
      router.replace("/signin");
    }
  }, [user, router]);

  if (!user && !AUTH_ROUTES.includes(router.pathname)) {
    return null;
  }

  return <>{children}</>;
};

const AppContent = ({ Component, pageProps }: { Component: any; pageProps: any }) => {
  const router = useRouter();
  const isAuthRoute = AUTH_ROUTES.includes(router.pathname);
  const { theme, loading } = useTheme();

  return (
    <div className={`min-h-screen transition-colors duration-300 ${
      theme === 'light' 
        ? 'bg-white text-black' 
        : 'bg-gray-900 text-white'
    }`}>
      <title>Your-Tube Clone</title>
      {!isAuthRoute && <Header />}
      <Toaster />
      <ThemeIndicator />
      <div className="flex min-h-[calc(100vh-56px)]">
        {!isAuthRoute && <Sidebar />}
        <div className="flex-1 overflow-auto">
          <Component {...pageProps} />
        </div>
      </div>
    </div>
  );
};

export default function App({ Component, pageProps }: AppProps) {
  return (
    <UserProvider>
      <ThemeProvider>
        <AuthGate>
          <AppContent Component={Component} pageProps={pageProps} />
        </AuthGate>
      </ThemeProvider>
    </UserProvider>
  );
}
