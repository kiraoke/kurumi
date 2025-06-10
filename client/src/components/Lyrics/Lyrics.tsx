"use client";

import { useState, useEffect, useCallback } from "react";
import { api } from "@/utils/fetch";
import { Lrc, LrcLine, useRecoverAutoScrollImmediately } from "react-lrc";

export default function Lyrics() {
  const [lrc, setLrc] = useState<string>("");
  const { signal, recoverAutoScrollImmediately } =
    useRecoverAutoScrollImmediately();

  const fetch = async () => {
    const { data } = (await api.get<{ lrc: string }>(
      `/static/lyrics/${encodeURIComponent("Blue - Yung Kai.flac")}.lrc`
    )) as any;

    console.log("data", data);
    setLrc(data);
  };

  const lineRenderer = useCallback(
    ({ active, line: { content } }: { active: boolean; line: LrcLine }) => (
      <div style={{ background: "wheat", color: "blue" }}>{content}</div>
    ),
    []
  );

  useEffect(() => {
    fetch();
  }, []);

  return (
    <div>
      <Lrc
        lrc={lrc}
        lineRenderer={lineRenderer}
        currentMillisecond={34000}
        verticalSpace
        recoverAutoScrollSingal={signal}
        recoverAutoScrollInterval={1000}
      />
    </div>
  );
}
