"use client";

import {
  accessTokenAtom,
  User,
  userAtom,
  userLoadingAtom,
  userPanicAtom,
} from "@/state/store";
import { AuthApi, logout, refreshToken } from "@/utils/fetch";
import { useAtom } from "jotai";
import React, { useEffect } from "react";

type AuthProviderProps = {
  children: React.ReactNode;
};

export default function AuthProvider({ children }: AuthProviderProps) {
  const [, setAccessToken] = useAtom(accessTokenAtom);
  const [, setUserLoading] = useAtom(userLoadingAtom);
  const [, setUserPanic] = useAtom(userPanicAtom);
  const [, setUser] = useAtom(userAtom);

  const fetchUser = async () => {
    console.log("Fetching user...");
    try {
      setUserLoading(true);
      const accessToken: string = await refreshToken();

      setAccessToken(accessToken);

      const { data: user } = await AuthApi.get<User>(accessToken, "/profile");
      console.log("User fetched: tako", user);

      setUser(user);
      setUserLoading(false);
    } catch (error) {
      console.log("Failed to fetch user tako:", error);
      // logout
      try {
        await logout();
        setUserLoading(false);
        setUser(null);
        setAccessToken(null);
      } catch (e) {
        console.error("Failed to logout:", e);
        setUserLoading(false);
        setUser(null);
        setAccessToken(null); // delete access token just in case
        setUserPanic(true);
      }
    }
  };

  const refreshAccessToken = async () => {
    console.log("Refreshing access token...");
    try {
      const accessToken: string = await refreshToken();
      setAccessToken(accessToken);

      const { data: user } = await AuthApi.get<User>(accessToken, "/profile");
      setUser(user);
    } catch (error) {
      console.error("Failed to refresh access token:", error);
      setAccessToken(null);
      setUser(null);
      setUserPanic(true);
    }
  };

  useEffect(() => {
    fetchUser();

    const interval = setInterval(refreshAccessToken, 1000 * 60 * 10); // refresh every 10 minutes
    return () => clearInterval(interval);
  }, []);

  return <>{children}</>;
}

// for refresh
// retries 3 times
// if accessToken not received, panics
//
//
// for load
// retries 3 times
// if not received, tries to logout
// if logout fails, panics
