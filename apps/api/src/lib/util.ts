import crypto from "crypto";

export const orderNo = () =>
  `MN${new Date().toISOString().slice(2, 10).replace(/-/g, "")}${crypto.randomInt(1000, 9999)}`;

export const rupees = (paise: number) =>
  `₹${(paise / 100).toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;

export const pushTimeline = (timeline: unknown, status: string, note?: string) => [
  ...(Array.isArray(timeline) ? timeline : []),
  { status, note: note ?? null, at: new Date().toISOString() },
];
