import React from "react";
import Image from "next/image";

export default function Home() {
  return (
    <div>
      <h1>Kurumi.</h1>
      <Image
        src="/mi.gif"
        height={80}
        width={80}
        alt="Picture of kurumi tokisaki"
      />
    </div>
  );
}
