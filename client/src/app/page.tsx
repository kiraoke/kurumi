"use client";

import AuthProvider from "@/components/AuthProvider/AuthProvider";
import Protected from "@/components/Protected/Protected";
import Redirecter from "@/components/Redirecter/Redirecter";

export default function Page() {
  return (
    <AuthProvider>
      <Protected>
        <Redirecter />
      </Protected>
    </AuthProvider>
  );
}
