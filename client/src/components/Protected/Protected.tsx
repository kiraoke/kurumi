"use client";

import { useAtom } from "jotai";
import { accessTokenAtom, userLoadingAtom, userPanicAtom } from "@/state/store";
import Loading from "@/components/Loading/Loading";
import Panic from "@/components/Panic/Panic";
import Home from "@/components/Home/Home";

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
