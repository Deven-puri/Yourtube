import {
  Home,
  Compass,
  PlaySquare,
  Clock,
  ThumbsUp,
  History,
  User,
} from "lucide-react";
import Link from "next/link";
import React, { useState } from "react";
import { Button } from "./ui/button";
import Channeldialogue from "./channeldialogue";
import { useUser } from "@/lib/AuthContext";

const Sidebar = () => {
  const { user } = useUser();

  const [isdialogeopen, setisdialogeopen] = useState(false);
  return (
    <aside className="hidden min-h-screen w-16 border-r bg-white p-1 sm:w-20 md:block md:w-64 md:p-2">
      <nav className="space-y-1">
        <Link href="/">
          <Button variant="ghost" className="w-full justify-start md:justify-start">
            <Home className="h-5 w-5 md:mr-3" />
            <span className="hidden md:inline">Home</span>
          </Button>
        </Link>
        <Link href="/explore">
          <Button variant="ghost" className="w-full justify-start md:justify-start">
            <Compass className="h-5 w-5 md:mr-3" />
            <span className="hidden md:inline">Explore</span>
          </Button>
        </Link>
        <Link href="/subscriptions">
          <Button variant="ghost" className="w-full justify-start md:justify-start">
            <PlaySquare className="h-5 w-5 md:mr-3" />
            <span className="hidden md:inline">Subscriptions</span>
          </Button>
        </Link>

        {user && (
          <>
            <div className="mt-2 border-t pt-2">
              <Link href="/history">
                <Button variant="ghost" className="w-full justify-start md:justify-start">
                  <History className="h-5 w-5 md:mr-3" />
                  <span className="hidden md:inline">History</span>
                </Button>
              </Link>
              <Link href="/liked">
                <Button variant="ghost" className="w-full justify-start md:justify-start">
                  <ThumbsUp className="h-5 w-5 md:mr-3" />
                  <span className="hidden md:inline">Liked videos</span>
                </Button>
              </Link>
              <Link href="/watch-later">
                <Button variant="ghost" className="w-full justify-start md:justify-start">
                  <Clock className="h-5 w-5 md:mr-3" />
                  <span className="hidden md:inline">Watch later</span>
                </Button>
              </Link>
              {user?.channelname ? (
                <Link href={`/channel/${user.id}`}>
                  <Button variant="ghost" className="w-full justify-start md:justify-start">
                    <User className="h-5 w-5 md:mr-3" />
                    <span className="hidden md:inline">Your channel</span>
                  </Button>
                </Link>
              ) : (
                <div className="px-2 py-1.5">
                  <Button
                    variant="secondary"
                    size="sm"
                    className="hidden w-full md:block"
                    onClick={() => setisdialogeopen(true)}
                  >
                    Create Channel
                  </Button>
                  <Button
                    variant="secondary"
                    size="icon"
                    className="w-full md:hidden"
                    onClick={() => setisdialogeopen(true)}
                  >
                    <User className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>
          </>
        )}
      </nav>
      <Channeldialogue
        isopen={isdialogeopen}
        onclose={() => setisdialogeopen(false)}
        mode="create"
      />
    </aside>
  );
};

export default Sidebar;
