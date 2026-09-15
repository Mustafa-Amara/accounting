"use client";
export default function PrintButton() {
  return <button className="btn-ghost btn" onClick={() => window.print()}>طباعة</button>;
}
