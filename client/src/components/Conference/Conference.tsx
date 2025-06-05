import { IAgoraRTCRemoteUser } from 'agora-rtc-sdk-ng';
import styles from './Conference.module.css';
import Image from 'next/image';

interface Props {
  toggleMic: () => void;
  leaveRoom: () => void;
  participants: IAgoraRTCRemoteUser[];
};

export default function Conference({ toggleMic, leaveRoom, participants }: Props) {
  return (
    <div className={styles.container}>
      <div className={styles.participants}>
        <div className={styles.buttContainer}>
          <button className={styles.button} onClick={toggleMic}>
            <Image src={"/icons/mic.svg"} width={25} height={25} alt="mic icon" />
          </button>
          <button className={styles.button} onClick={leaveRoom}>
            <Image src={"/icons/leave.svg"} width={25} height={25} alt="mic icon" />
          </button>
        </div>

        <div className={styles.part}>
          <img src="/mi.gif" alt="profile picture" className={`${styles.avatar} ${styles.speaking}`} />
        </div>
        {
          participants.map((participant, index) => (
            <div className={styles.part} key={index}>
              <img src="/pfp.jpg" alt="profile picture" className={`${styles.avatar} ${styles.speaking}`} />
            </div>))
        }
      </div>
    </div>
  );
}
