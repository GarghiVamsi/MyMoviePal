"use client";

import Image from "next/image";
import { useState, useEffect } from "react";

export function HeroSlideshow({ posters }: { posters: string[] }) {
  const [idx, setIdx] = useState(0);

  useEffect(() => {
    if (posters.length <= 1) return;
    const t = setInterval(() => setIdx((i) => (i + 1) % posters.length), 5000);
    return () => clearInterval(t);
  }, [posters.length]);

  return (
    <>
      {posters.map((src, i) => (
        <Image
          key={src}
          src={src}
          alt=""
          fill
          priority={i === 0}
          sizes="100vw"
          className={`object-cover scale-105 blur-sm transition-opacity duration-1000 motion-reduce:transition-none ${
            i === idx ? "opacity-100" : "opacity-0"
          }`}
        />
      ))}
    </>
  );
}
