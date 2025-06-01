"use client";

import { useAtom } from "jotai";
import { accessTokenAtom, userLoadingAtom, userPanicAtom } from "@/state/store";
import Home from "@/components/Home";
import Panic from "@/components/Panic";
import Loading from "@/components/Loading";
import { useRouter } from "next/navigation";

export default function Page() {
  const [userLoading] = useAtom(userLoadingAtom);
  const [userPanic] = useAtom(userPanicAtom);
  const [accessToken] = useAtom(accessTokenAtom);

  const router = useRouter();

  if (userPanic) return <Panic/>;

  if (userLoading && !accessToken) return <Loading />;

  if (!userLoading && accessToken) router.push("/player");

  return <Home />;
}
