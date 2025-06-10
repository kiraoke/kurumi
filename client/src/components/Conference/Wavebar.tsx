"use client";

// its styles are in global.css
export default function Wavebar() {
  return (
    <>
      <div className={`bars`}>
        {[...Array(20)].map((_, i) => (
          <span key={i} className={"bar"} />
        ))}
      </div>
    </>
  );
}
