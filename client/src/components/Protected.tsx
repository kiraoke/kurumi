"use client";

import { useAtom } from "jotai";
import { accessTokenAtom, userLoadingAtom, userPanicAtom } from "@/state/store";
import Loading from "./Loading";
import Panic from "./Panic";
import Home from "./Home";

export default function Protected({ children }: { children: React.ReactNode }) {
  const [userLoading] = useAtom(userLoadingAtom);
  const [userPanic] = useAtom(userPanicAtom);
  const [accessToken] = useAtom(accessTokenAtom);

  if (userPanic) {
    return <Panic />;
  }

  if (userLoading && !accessToken) {
    return <Loading />;
  }

  if (!userLoading && !accessToken) {
    return <Home />;
  }

  return children;
}
