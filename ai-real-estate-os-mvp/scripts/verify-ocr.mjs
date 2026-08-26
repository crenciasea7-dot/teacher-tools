import { createWorker } from "tesseract.js";

const imagePath = process.argv[2];
if (!imagePath) throw new Error("Usage: node scripts/verify-ocr.mjs <image-path>");

const worker = await createWorker("kor+eng", 1, { langPath: "./public/ocr/" });
try {
  const result = await worker.recognize(imagePath);
  const compact = result.data.text.replace(/\s+/g, " ").trim();
  if (!compact) throw new Error("OCR returned no text");
  console.log(compact.slice(0, 400));
} finally {
  await worker.terminate();
}
