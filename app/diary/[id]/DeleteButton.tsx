"use client";

import { useRouter } from "next/navigation";

export default function DeleteButton({ id }: { id: string }) {
  const router = useRouter();

  async function handleDelete() {
    if (!confirm("이 일기를 삭제할까요?")) return;
    const res = await fetch(`/api/diary/${id}`, { method: "DELETE" });
    if (res.ok) {
      router.push("/diary");
      router.refresh();
    } else {
      alert("삭제에 실패했습니다.");
    }
  }

  return (
    <button
      onClick={handleDelete}
      style={{
        padding: "var(--space-2) var(--space-5)",
        background: "rgba(239, 68, 68, 0.12)",
        border: "1px solid rgba(239, 68, 68, 0.3)",
        borderRadius: "var(--radius-full)",
        fontSize: "var(--font-size-sm)",
        color: "rgb(239, 68, 68)",
        cursor: "pointer",
      }}
    >
      삭제
    </button>
  );
}
