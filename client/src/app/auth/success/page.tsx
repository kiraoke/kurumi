"use client";

import { useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { useAtom } from "jotai";
import { accessTokenAtom } from "@/state/store";
import { useRouter } from "next/navigation";

export default function SuccessPage() {
  const searchParams = useSearchParams();
  const accessToken = searchParams.get("accessToken");
  const [, setAccessToken] = useAtom(accessTokenAtom);
  const router = useRouter();

  useEffect(() => {
    setAccessToken(accessToken);
    router.push("/");
  }, []);

  return (
    <div>
      <h1>Success!</h1>
      <p>Your action was successful.</p>
    </div>
  );
}
