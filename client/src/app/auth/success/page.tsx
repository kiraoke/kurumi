"use client";

import { useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { useAtom } from "jotai";
import { accessTokenAtom } from "@/state/store";
import Link from "next/link";

export default function SuccessPage() {
  const searchParams = useSearchParams();
  const accessToken = searchParams.get("accessToken");
  const [, setAccessToken] = useAtom(accessTokenAtom);

  useEffect(() => setAccessToken(accessToken), []);

  return (
    <div>
      <h1>Success!</h1>
      <p>Your action was successful.</p>
      <Link href="/auth/fail">access</Link>
    </div>
  );
}
