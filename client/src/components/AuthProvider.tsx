"use client"

import { accessTokenAtom, userLoadingAtom, userPanicAtom } from '@/state/store';
import { logout, refreshToken } from '@/utils/fetch';
import { useAtom } from 'jotai';
import React, { useEffect } from 'react';

type AuthProviderProps = {
  children: React.ReactNode;
};

export default function AuthProvider(props: AuthProviderProps) {
  const [_, setAccessToken] = useAtom(accessTokenAtom);
  const [__, setUserLoading] = useAtom(userLoadingAtom);
  const [___, setUserPanic] = useAtom(userPanicAtom);

  const fetchUser = async () => {
    try {
      setUserLoading(true);
      const accessToken: string = await refreshToken();

      setAccessToken(accessToken);

      setUserLoading(false);
    } catch (error) {
      console.error("Failed to fetch user:", error);
      // logout
      try {
        await logout();
        setUserLoading(false);
        setAccessToken(null);
      } catch (e) {
        console.error("Failed to logout:", e);
        setUserLoading(false);
        setAccessToken(null); // delete access token just in case
        setUserPanic(true);
      }
    }
  }

  const refreshAccessToken = async () => {
    try {
      const accessToken: string = await refreshToken();
      setAccessToken(accessToken);
    } catch (error) {
      console.error("Failed to refresh access token:", error);
      setAccessToken(null);
      setUserPanic(true);
    }
  }

  useEffect(() => {
    fetchUser();

    const interval = setInterval(refreshAccessToken, 1000 * 60 * 10); // refresh every 10 minutes
    return () => clearInterval(interval);
  }, []);

  return (
    <>
      {props.children}
    </>
  );
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
