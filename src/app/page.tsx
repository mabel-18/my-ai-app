// วางไฟล์นี้ที่: src/app/page.tsx (แทนที่ไฟล์เดิมทั้งไฟล์)
"use client";

import { useRef, useState } from "react";

type Level = "safe" | "low" | "medium" | "high" | "critical";

type Result = {
  score: number;
  level: Level;
  summary: string;
  redFlags: string[];
  advice: string[];
  extractedText: string;
};

const LEVELS: Record<Level, { label: string; color: string }> = {
  safe: { label: "ปลอดภัย", color: "#1E8E4E" },
  low: { label: "เสี่ยงต่ำ", color: "#7DA32B" },
  medium: { label: "เสี่ยงปานกลาง", color: "#C98B00" },
  high: { label: "เสี่ยงสูง", color: "#D9561E" },
  critical: { label: "เสี่ยงสูงมาก", color: "#C41E2E" },
};

const GAUGE_GRADIENT =
  "linear-gradient(90deg,#1E8E4E 0%,#7DA32B 25%,#E0A800 50%,#D9561E 75%,#C41E2E 100%)";

// ย่อรูปก่อนส่ง เพื่อให้ส่งเร็วและไม่เกินขนาดที่เซิร์ฟเวอร์รับได้
async function prepareImage(file: File) {
  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const el = new Image();
      el.onload = () => resolve(el);
      el.onerror = () => reject(new Error("เปิดรูปนี้ไม่ได้ ลองใช้ไฟล์ JPG หรือ PNG"));
      el.src = url;
    });
    const MAX = 1600;
    const scale = Math.min(1, MAX / Math.max(img.width, img.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(img.width * scale);
    canvas.height = Math.round(img.height * scale);
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("เบราว์เซอร์นี้ประมวลผลรูปไม่ได้");
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL("image/jpeg", 0.85);
    return { mimeType: "image/jpeg", data: dataUrl.split(",")[1] };
  } finally {
    URL.revokeObjectURL(url);
  }
}

export default function Home() {
  const [mode, setMode] = useState<"image" | "text">("image");
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<Result | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  function onPickFile(f: File | undefined) {
    if (!f) return;
    if (preview) URL.revokeObjectURL(preview);
    setFile(f);
    setPreview(URL.createObjectURL(f));
    setError(null);
  }

  function reset() {
    if (preview) URL.revokeObjectURL(preview);
    setFile(null);
    setPreview(null);
    setText("");
    setResult(null);
    setError(null);
  }

  async function onSubmit() {
    setError(null);
    const useImage = mode === "image" && file;
    if (!useImage && !text.trim()) {
      setError(
        mode === "image"
          ? "เลือกรูปแคปหน้าแชทก่อน"
          : "พิมพ์หรือวางข้อความที่ต้องการตรวจสอบก่อน"
      );
      return;
    }
    setLoading(true);
    try {
      const image = useImage ? await prepareImage(file as File) : undefined;
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, image }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "วิเคราะห์ไม่สำเร็จ");
      setResult(data as Result);
    } catch (e) {
      setError(e instanceof Error ? e.message : "เกิดข้อผิดพลาด ลองใหม่อีกครั้ง");
    } finally {
      setLoading(false);
    }
  }

  const level = result ? LEVELS[result.level] : null;

  return (
    <main
      className="min-h-screen w-full px-4 py-8"
      style={{
        background: "#F4F6F2",
        color: "#16231B",
        fontFamily:
          '"Noto Sans Thai","Sarabun","Thonburi","Tahoma",system-ui,sans-serif',
      }}
    >
      <div className="mx-auto w-full max-w-xl">
        <header className="mb-6">
          <h1 className="text-2xl font-bold" style={{ color: "#0F5C3A" }}>
            KU care U
          </h1>
          <p className="mt-1 text-base" style={{ color: "#46594D" }}>
            ตรวจสอบก่อนโอน ปลอดภัยกว่า
          </p>
        </header>

        {!result && (
          <section
            className="rounded-2xl p-5"
            style={{ background: "#FFFFFF", border: "1px solid #DCE3DD" }}
          >
            <h2 className="text-lg font-semibold">ตรวจสอบบทสนทนา</h2>

            <div
              role="tablist"
              className="mt-4 grid grid-cols-2 gap-1 rounded-xl p-1"
              style={{ background: "#EAEFEA" }}
            >
              {(
                [
                  ["image", "อัปโหลดรูป"],
                  ["text", "วางข้อความ"],
                ] as const
              ).map(([key, label]) => (
                <button
                  key={key}
                  role="tab"
                  aria-selected={mode === key}
                  onClick={() => setMode(key)}
                  className="rounded-lg py-2 text-sm font-medium"
                  style={{
                    background: mode === key ? "#FFFFFF" : "transparent",
                    color: mode === key ? "#0F5C3A" : "#46594D",
                    boxShadow:
                      mode === key ? "0 1px 2px rgba(0,0,0,0.12)" : "none",
                  }}
                >
                  {label}
                </button>
              ))}
            </div>

            {mode === "image" && (
              <div className="mt-4">
                <input
                  ref={inputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => onPickFile(e.target.files?.[0])}
                />
                {preview ? (
                  <div>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={preview}
                      alt="รูปแคปหน้าแชทที่เลือก"
                      className="max-h-80 w-full rounded-xl object-contain"
                      style={{ background: "#F4F6F2" }}
                    />
                    <button
                      onClick={() => inputRef.current?.click()}
                      className="mt-2 text-sm underline"
                      style={{ color: "#0F5C3A" }}
                    >
                      เปลี่ยนรูป
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => inputRef.current?.click()}
                    className="w-full rounded-xl px-4 py-10 text-center"
                    style={{ border: "2px dashed #9DB5A6", color: "#2E4A3A" }}
                  >
                    <span className="block font-medium">เลือกรูปแคปหน้าแชท</span>
                    <span className="mt-1 block text-sm" style={{ color: "#5B6F62" }}>
                      JPG หรือ PNG
                    </span>
                  </button>
                )}
              </div>
            )}

            <label className="mt-4 block text-sm font-medium" htmlFor="story">
              {mode === "image"
                ? "เล่าเพิ่มเติม (ไม่บังคับ)"
                : "ข้อความหรือเหตุการณ์ที่เจอ"}
            </label>
            <textarea
              id="story"
              value={text}
              onChange={(e) => setText(e.target.value)}
              rows={mode === "text" ? 8 : 3}
              placeholder={
                mode === "text"
                  ? "วางข้อความแชท หรือเล่าว่าเกิดอะไรขึ้น เช่น มีคนทักมาชวนทำงานพาร์ทไทม์แล้วให้โอนเงินก่อน"
                  : "เช่น คนนี้ทักมาจากกลุ่มหางาน"
              }
              className="mt-1 w-full rounded-xl p-3 text-base"
              style={{
                background: "#FFFFFF",
                color: "#16231B",
                border: "1px solid #B8C6BC",
              }}
            />

            {error && (
              <p role="alert" className="mt-3 text-sm font-medium" style={{ color: "#C41E2E" }}>
                {error}
              </p>
            )}

            <button
              onClick={onSubmit}
              disabled={loading}
              className="mt-4 w-full rounded-xl py-3 text-base font-semibold"
              style={{
                background: loading ? "#7FA38F" : "#0F5C3A",
                color: "#FFFFFF",
              }}
            >
              {loading ? "กำลังวิเคราะห์..." : "ตรวจสอบ"}
            </button>
          </section>
        )}

        {result && level && (
          <section
            className="rounded-2xl p-5"
            style={{ background: "#FFFFFF", border: "1px solid #DCE3DD" }}
          >
            <h2 className="text-lg font-semibold">ผลการวิเคราะห์</h2>

            <p className="mt-4 text-3xl font-bold" style={{ color: level.color }}>
              {level.label}
            </p>
            <p className="text-sm" style={{ color: "#5B6F62" }}>
              คะแนนความเสี่ยง {result.score} จาก 100
            </p>

            <div
              className="relative mt-5 h-3 rounded-full"
              style={{ background: GAUGE_GRADIENT }}
              role="img"
              aria-label={`ระดับความเสี่ยง ${level.label} คะแนน ${result.score} จาก 100`}
            >
              <div
                className="absolute top-1/2 h-6 w-6 rounded-full"
                style={{
                  left: `${result.score}%`,
                  transform: "translate(-50%, -50%)",
                  background: level.color,
                  border: "4px solid #FFFFFF",
                  boxShadow: "0 1px 4px rgba(0,0,0,0.35)",
                }}
              />
            </div>
            <div className="mt-2 flex justify-between text-xs" style={{ color: "#5B6F62" }}>
              <span>ปลอดภัย</span>
              <span>เสี่ยงสูงมาก</span>
            </div>

            {result.summary && <p className="mt-5 text-base leading-7">{result.summary}</p>}

            {result.redFlags.length > 0 && (
              <div className="mt-5">
                <h3 className="font-semibold">จุดที่น่าสงสัย</h3>
                <ul className="mt-2 list-disc space-y-1 pl-5 leading-7">
                  {result.redFlags.map((item, i) => (
                    <li key={i}>{item}</li>
                  ))}
                </ul>
              </div>
            )}

            {result.advice.length > 0 && (
              <div className="mt-5">
                <h3 className="font-semibold">สิ่งที่ควรทำต่อ</h3>
                <ul className="mt-2 list-disc space-y-1 pl-5 leading-7">
                  {result.advice.map((item, i) => (
                    <li key={i}>{item}</li>
                  ))}
                </ul>
              </div>
            )}

            {result.extractedText && (
              <details className="mt-5">
                <summary className="cursor-pointer text-sm font-medium" style={{ color: "#0F5C3A" }}>
                  ดูข้อความที่ AI อ่านได้จากรูป
                </summary>
                <p
                  className="mt-2 whitespace-pre-wrap rounded-xl p-3 text-sm leading-6"
                  style={{ background: "#F4F6F2" }}
                >
                  {result.extractedText}
                </p>
              </details>
            )}

            <p className="mt-5 text-xs leading-5" style={{ color: "#5B6F62" }}>
              ผลนี้เป็นการประเมินเบื้องต้นโดย AI ไม่ใช่คำตัดสิน หากโอนเงินไปแล้วหรือไม่แน่ใจ ให้แจ้งความทันที
            </p>

            <div className="mt-5 grid grid-cols-2 gap-3">
              <a
                href="https://thaipoliceonline.go.th"
                target="_blank"
                rel="noreferrer"
                className="rounded-xl py-3 text-center text-base font-semibold"
                style={{ background: "#C41E2E", color: "#FFFFFF" }}
              >
                แจ้งเหตุ
              </a>
              <button
                onClick={reset}
                className="rounded-xl py-3 text-base font-semibold"
                style={{ background: "#FFFFFF", color: "#0F5C3A", border: "2px solid #0F5C3A" }}
              >
                ตรวจสอบใหม่
              </button>
            </div>
          </section>
        )}
      </div>
    </main>
  );
}
