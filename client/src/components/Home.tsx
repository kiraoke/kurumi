import Image from "next/image";
import styles from "./Home.module.css";
import { api } from "@/utils/fetch";

export default function Home() {
  const login = async () => {
    const { data } = await api.get("/auth/google/url");
    window.location.href = data.url; // Redirect to the Google login URL
  };

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

        <button className={styles.button} onClick={(event) => {
          event.preventDefault();
          login();
        }}>
          Log in
        </button>
      </div>
  );
}
