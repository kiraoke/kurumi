"use client";

import Agora from "@/components/Agora";
import AuthProvider from "@/components/AuthProvider";
import Protected from "@/components/Protected";

export default function Page() {

  return (
    <AuthProvider>
      <Protected>
        <Agora>hi</Agora>
      </Protected>
    </AuthProvider>
  );
}
