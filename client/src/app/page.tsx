import styles from "./page.module.css";
import Image from "next/image";

export default function Home() {
  return (
    <div className={styles.container}>
      <div className={styles.titleContainer}>
        <h1 className={styles.title}>Kurumi.</h1>
        <Image
          src="/mi.gif"
          height={100}
          width={100}
          className={styles.img}
          alt="Picture of kurumi tokisaki"
        />
      </div>

      <button className={styles.button}>
      Log in
      </button>
    </div>
  );
}
