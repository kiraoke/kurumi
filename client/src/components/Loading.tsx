import React from 'react';
import styles from './Loading.module.css';
import Image from 'next/image';

type LoadingProps = {
  loading: boolean;
  children: React.ReactNode;
};

export default function Loading(props: LoadingProps) {
  return props.loading ? <div className={styles.container}>
    <Image src={"/kuload.gif"} width={400} height={500} alt='kurumi finger spin gif' />
  </div> : <>{props.children}</>;
}
