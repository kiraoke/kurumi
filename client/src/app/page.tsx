"use client";


import { api } from "@/utils/fetch";
import styles from "./page.module.css";
import Image from "next/image";
import Loading from "@/components/Loading";

export default function Home() {
  const login = async () => {
    const { data } = await api.get("/auth/google/url");
    console.log("login data", data);
    window.location.href = data.url; // Redirect to the Google login URL
  };

  return (
    <Loading loading={false}>
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
    </Loading>
  );
}
