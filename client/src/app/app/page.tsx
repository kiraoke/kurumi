"use client"

import { accessTokenAtom, userAtom } from "@/state/store";
import { useAtom } from "jotai";
import AuthProvider from "@/components/AuthProvider";
import Protected from "@/components/Protected";

export default function Page() {
  const [accessToken] = useAtom(accessTokenAtom);
  const [user] = useAtom(userAtom);


  return (
    <AuthProvider>
      <Protected>
        <div>
          <h1>Welcome to the Home Page</h1>
          <p>{accessToken}</p>
          <p>{user?.username} {user?.email}</p>
        </div>
      </Protected>
    </AuthProvider>
  );
}
