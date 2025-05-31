"use client"

import { accessTokenAtom , userLoadingAtom} from '@/state/store';
import { api } from '@/utils/fetch';
import { useAtom } from 'jotai';
import React, {useEffect} from 'react';

type AuthProviderProps = {
  children: React.ReactNode;
};

export default function AuthProvider(props: AuthProviderProps) {
  const [_, setAccessToken] = useAtom(accessTokenAtom);
  const [__, setUserLoading] = useAtom(userLoadingAtom);

  const fetchUser = async () => {
    setUserLoading(true);

    const response = await api.get('/auth/refresh');

    setAccessToken(response.data.accessToken);

    setUserLoading(false);
  }

  useEffect(() => {
    fetchUser();
  }, []);

  return (
    <>
      {props.children}
    </>
  );

}
