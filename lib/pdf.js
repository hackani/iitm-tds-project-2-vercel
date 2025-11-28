import { getDocument } from "pdfjs-dist/legacy/build/pdf.js";

export default async function extractPDF(url) {
  const loading = getDocument(url);
  const pdf = await loading.promise;

  let fullText = "";

  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    const strings = content.items.map((it) => it.str);
    fullText += strings.join(" ") + "\n";
  }

  return fullText.trim();
}
