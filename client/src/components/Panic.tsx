import styles from "./Panic.module.css";
import Image from "next/image";

export default function Panic() {
  return (
    <div className={styles.container}>
      <div className={styles.imgContainer}>
        <Image
          src="/panic.gif"
          unoptimized
          priority={true}
          width={500}
          height={600}
          alt="random kurumi gif, get eyes if you want to see the best girl"
        />

        <p className={styles.desc}>behind the scenes, server and client</p>
      </div>

      <h1 className={styles.title}>
        Cannot connect to server, check your network!
      </h1>
    </div>
  );
}
