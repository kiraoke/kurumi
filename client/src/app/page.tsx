"use client";

import AuthProvider from "@/components/AuthProvider";
import Protected from "@/components/Protected";
import Redirecter from "@/components/Redirecter";

export default function Page() {
  return (
    <AuthProvider>
      <Protected>
        <Redirecter />
      </Protected>
    </AuthProvider>
  );
}
