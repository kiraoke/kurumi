"use client";

import styles from "./Conference.module.css";
import Image from "next/image";
import { AudioTrack } from "../Agora/Agora";
import { useState } from "react";
import { IAgoraRTCRemoteUser } from "agora-rtc-sdk-ng";

interface Props {
  participants: IAgoraRTCRemoteUser[];
  audioTrack?: AudioTrack;
}

export default function Conference({ participants, audioTrack }: Props) {
  const [micMuted, setMicMuted] = useState(false);

  const toggleMic = () => {
    audioTrack?.localTrack?.setMuted(!micMuted);

    setMicMuted(!micMuted);
  };

  return (
    <div className={styles.container}>
      <div className={styles.participants}>
        <div className={styles.buttContainer}>
          <button className={styles.button} onClick={toggleMic}>
            <Image
              src={`/icons/${micMuted ? "micoff" : "mic"}.svg`}
              width={25}
              height={25}
              alt="mic icon"
            />
          </button>
          <button className={styles.button}>
            <Image
              src={"/icons/leave.svg"}
              width={25}
              height={25}
              alt="mic icon"
            />
          </button>
        </div>

        <div className={styles.part}>
          <img
            src={"/mi.gif"}
            alt="profile picture"
            className={`${styles.avatar} ${styles.speaking}`}
          />
        </div>
        {participants.map((participant, index) => (
          <div
            className={styles.part}
            id={`part_${participant.uid}`}
            key={index}>
            <img
              src={"/pfp.jpg"}
              alt="profile picture"
              className={`${styles.avatar}`}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
