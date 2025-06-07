"use client";

import styles from './Conference.module.css';
import Image from 'next/image';
import { User } from '@/utils/socket';
import { AudioTrack } from '../Agora';
import { useState } from 'react';

interface Props {
  participants: User[];
  audioTrack?: AudioTrack;
};

export default function Conference({ participants, audioTrack }: Props) {
  const [micMuted, setMicMuted] = useState(false);

  const toggleMic = () => {
    audioTrack?.localTrack?.setMuted(!micMuted);

    setMicMuted(!micMuted);
  }

  return (
    <div className={styles.container}>
      <div className={styles.participants}>
        <div className={styles.buttContainer}>
          <button className={styles.button} onClick={toggleMic}>
            <Image src={`/icons/${micMuted ? "micoff" : "mic"}.svg`} width={25} height={25} alt="mic icon" />
          </button>
          <button className={styles.button} >
            <Image src={"/icons/leave.svg"} width={25} height={25} alt="mic icon" />
          </button>
        </div>

        <div className={styles.part}>
          <img src={"/mi.gif"} alt="profile picture" className={`${styles.avatar} ${styles.speaking}`} />
        </div>
        {
          participants.map((participant, index) => {
            console.log("Participant", participant.pfp);
            return (
              <div className={styles.part} key={index}>
                <img src={participant.pfp} alt="profile picture" className={`${styles.avatar} ${styles.speaking}`} />
              </div>)
          })
        }
      </div>
    </div>
  );
}
