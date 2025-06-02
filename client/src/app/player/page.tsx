"use client"

import { userAtom, accessTokenAtom } from "@/state/store";
import { useAtom } from "jotai";
import AuthProvider from "@/components/AuthProvider";
import Protected from "@/components/Protected";
import styles from './page.module.css';
import Image from "next/image";
import { ChangeEvent, useState } from "react";
import { postMultipart } from "@/utils/fetch";

export default function Page() {
  const [user] = useAtom(userAtom);
  const [accessToken] = useAtom(accessTokenAtom);
  const [username, setUsername] = useState<string>("");
  const [pfp, setPfp] = useState<string>("");
  const [pfpFile, setPfpFile] = useState<File | null>(null);

  const uploadPfp = async (file: File) => {
    const formData = new FormData();
    formData.append("image", file as Blob);

    if (!accessToken) return;

    const response = await postMultipart(accessToken, "/upload/image", formData);

    console.log("PFP upload response:", response.data);
  }

  const handleImageChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      setPfp(URL.createObjectURL(file));
      setPfpFile(file);
      uploadPfp(file);
    }
  };


  const pfpSource = pfp || "/pfp.jpg";

  return (
    <AuthProvider>
      <Protected>
        <div className={styles.container}>
          <main className={styles.main}>

            <h1 className={styles.title}>Konichiwa,</h1>
            <p className={styles.subtitle}>Edit profile</p>

            <div className={styles.box}>
              <div>
                <label className={styles.label}>username</label>
                <input
                  placeholder={user?.username}
                  className={styles.input}
                  onChange={(e) => setUsername(e.target.value)} />
              </div>

              <div className={styles.pfpBox} onClick={() => document.getElementById("pfpPicker")?.click()}>
                <Image
                  className={styles.pfp}
                  src={pfpSource}
                  width={200}
                  height={200}
                  alt="profile picture" />
                <input
                  type="file"
                  id={"pfpPicker"}
                  accept="image/*"
                  className={styles.picker}
                  onChange={handleImageChange} />
              </div>
            </div>

            <button
              disabled={(username ? username === user?.username : true) && pfpSource === "/pfp.jpg"}
              className={styles.save}>
              save
            </button>
          </main>

          <div className={styles.dock}>
            <Image
              className={styles.icon}
              width={25}
              height={25}
              src="/icons/home.svg"
              alt="home icon" />

            <Image
              className={styles.icon}
              width={25}
              height={25}
              src="/icons/playArrow.svg"
              alt="home icon" />
          </div>
        </div>
      </Protected>
    </AuthProvider>
  );
}
