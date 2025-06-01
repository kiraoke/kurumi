import React from 'react';
import styles from './Loading.module.css';
import Image from 'next/image';

export default function Loading() {
  return <div className={styles.container}>
    <Image
      unoptimized
      src={"/kuload.gif"}
      priority={true}
      width={400}
      height={500}
      alt='kurumi finger spin gif' />
  </div>;
}
