import Tesseract from "tesseract.js";

export const extractTextFromImage = async (buffer) => {
  try {
    const ocrPromise = Tesseract.recognize(buffer, "eng");
    const timeoutPromise = new Promise((resolve) =>
      setTimeout(() => resolve({ data: { text: "" } }), 2500)
    );
    const res = await Promise.race([ocrPromise, timeoutPromise]);
    return res?.data?.text || "";
  } catch {
    return "";
  }
};