import Header from "@/components/Header";
import Sidebar from "@/components/Sidebar";
import { Toaster } from "@/components/ui/sonner";
import "@/styles/globals.css";
import type { AppProps } from "next/app";
import { UserProvider, useUser } from "../lib/AuthContext";
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

export default function App({ Component, pageProps }: AppProps) {
  const router = useRouter();
  const isAuthRoute = AUTH_ROUTES.includes(router.pathname);

  return (
    <UserProvider>
      <AuthGate>
        <div className="min-h-screen bg-white text-black">
          <title>Your-Tube Clone</title>
          {!isAuthRoute && <Header />}
          <Toaster />
          <div className="flex min-h-[calc(100vh-56px)]">
            {!isAuthRoute && <Sidebar />}
            <div className="flex-1 overflow-auto">
              <Component {...pageProps} />
            </div>
          </div>
        </div>
      </AuthGate>
    </UserProvider>
  );
}
