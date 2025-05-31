"use client";

import { useAtom } from "jotai";
import { accessTokenAtom } from "@/state/store";

export default function FailPage() {
  const [accessToken, _] = useAtom(accessTokenAtom);
  return (
    <div>
      <h1>Failure</h1>
      <p>There was an error processing your request.</p>
      {accessToken}
    </div>
  );
} 
