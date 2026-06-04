"use client";

import { useState } from "react";

interface Props {
  id: string;
  isFavorite: boolean;
}

export default function FavoriteButton({ id, isFavorite: initialFav }: Props) {
  const [isFav, setIsFav] = useState(initialFav);
  const [loading, setLoading] = useState(false);

  async function toggle() {
    if (loading) return;
    setLoading(true);
    const next = !isFav;
    setIsFav(next); // 낙관적 업데이트

    const res = await fetch(`/api/diary/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isFavorite: next }),
    });

    if (!res.ok) {
      setIsFav(!next); // 롤백
      alert("즐겨찾기 변경에 실패했습니다.");
    }
    setLoading(false);
  }

  return (
    <button
      onClick={toggle}
      disabled={loading}
      aria-label={isFav ? "즐겨찾기 해제" : "즐겨찾기 추가"}
      title={isFav ? "즐겨찾기 해제" : "즐겨찾기 추가"}
      style={{
        fontSize: "1.5rem",
        lineHeight: 1,
        color: isFav ? "var(--color-accent-star)" : "var(--color-text-muted)",
        background: "transparent",
        padding: "var(--space-1)",
        borderRadius: "var(--radius-full)",
        transition: "color 0.15s ease, opacity 0.15s ease",
        opacity: loading ? 0.5 : 1,
        cursor: loading ? "not-allowed" : "pointer",
      }}
    >
      {isFav ? "★" : "☆"}
    </button>
  );
}
