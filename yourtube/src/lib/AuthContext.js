import { onAuthStateChanged, signInWithPopup, signOut } from "firebase/auth";
import { useState } from "react";
import { createContext } from "react";
import { provider, auth } from "./firebase";
import axiosInstance from "./axiosinstance";
import { useEffect, useContext } from "react";

const UserContext = createContext();

export const UserProvider = ({ children }) => {
  const [user, setUser] = useState(null);

  const login = (userdata) => {
    setUser(userdata);
    if (typeof window !== "undefined" && window.localStorage) {
      window.localStorage.setItem("user", JSON.stringify(userdata));
    }
  };
  const logout = async () => {
    setUser(null);
    if (typeof window !== "undefined" && window.localStorage) {
      window.localStorage.removeItem("user");
    }
    try {
      await signOut(auth);
    } catch (error) {
    }
  };
  const handlegooglesignin = async () => {
    try {
      const result = await signInWithPopup(auth, provider);
      const firebaseuser = result.user;
      const payload = {
        email: firebaseuser.email,
        name: firebaseuser.displayName,
        image: firebaseuser.photoURL || "https://github.com/shadcn.png",
      };
      const response = await axiosInstance.post("/user/login", payload);
      login(response.data.result);
      return response.data.result; // Return the user data
    } catch (error) {
      throw error; // Throw error so it can be caught in the component
    }
  };
  useEffect(() => {
    if (typeof window !== "undefined" && window.localStorage) {
      const storedUser = window.localStorage.getItem("user");
      if (storedUser) {
        setUser(JSON.parse(storedUser));
      }
    }

    // Only set up auth listener on client side
    if (typeof window === "undefined" || !auth) {
      return;
    }

    const unsubcribe = onAuthStateChanged(auth, async (firebaseuser) => {
      if (firebaseuser) {
        try {
          const payload = {
            email: firebaseuser.email,
            name: firebaseuser.displayName,
            image: firebaseuser.photoURL || "https://github.com/shadcn.png",
          };
          const response = await axiosInstance.post("/user/login", payload);
          login(response.data.result);
        } catch (error) {
          logout();
        }
      }
    });
    return () => unsubcribe();
  }, []);

  return (
    <UserContext.Provider value={{ user, login, logout, handlegooglesignin }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => useContext(UserContext);
export const useAuth = () => useContext(UserContext); // Alias for compatibility

