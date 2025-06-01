"use client"

import { accessTokenAtom, userLoadingAtom } from "@/state/store";
import { useAtom } from "jotai";
import AuthProvider from "@/components/AuthProvider";
import Protected from "@/components/Protected";
import { useEffect, useState } from "react";
import { authApi } from "@/utils/fetch";

export default function Page() {
  const [loading, _] = useAtom(userLoadingAtom);
  const [accessToken, __] = useAtom(accessTokenAtom);

  const [profile, setProfile] = useState<any>(null);

  const fetchProfile = async () => {
    if (!accessToken) {
      console.error("No access token available");
      return;
    }

    const response = await authApi(accessToken).get("/profile");

    setProfile(response.data);
  }

  useEffect(() => {
    fetchProfile();
  }, [accessToken, loading]);

  return (
    <AuthProvider>
      <Protected>
        <div>
          <h1>Welcome to the Home Page</h1>
          <p>{accessToken}</p>
          <p>{profile?.userId} {profile?.email}</p>
        </div>
      </Protected>
    </AuthProvider>
  );
}
