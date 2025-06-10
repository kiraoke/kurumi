"use client";

import styles from "./Wavebar.module.css";

export default function Wavebar({ active }: { active?: boolean } = {}) {
  return (
    <>
      <div className={`${styles.bars} ${active ? styles.active : ""}`}>
        {[...Array(20)].map((_, i) => (
          <span key={i} className={styles.bar} />
        ))}
      </div>
    </>
  );
}
