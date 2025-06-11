"use client";

import { useState, useEffect } from "react";
import { api } from "@/utils/fetch";
import styles from "./Lyrics.module.css";

export default function Lyrics({ track }: { track: string }) {
  const [lrc, setLrc] = useState<string>("");

  const fetch = async () => {
    const { data } = (await api.get<{ lrc: string }>(
      `/static/lyrics/${encodeURIComponent(track)}.lrc`
    )) as any;

    if (data.split(" ")[0] === "404") {
      setLrc("");
      return;
    }

    setLrc(data);
  };

  useEffect(() => {
    fetch();
  }, [track]);

  return (
    <div className={styles.container}>
      {!lrc && <p className={styles.not}>Not found :(</p>}
      {lrc?.split("\n").map((lr, i) => (
        <div key={i}>
          <p>{lr}</p>
          <br />
        </div>
      ))}
    </div>
  );
}
