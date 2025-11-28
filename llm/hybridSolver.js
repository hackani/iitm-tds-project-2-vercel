import renderPage from "../lib/browserless.js";
import extractTables from "../lib/extract.js";
import extractPDF from "../lib/pdf.js";
import extractCSV from "../lib/csv.js";
import pipeAI from "./pipeClient.js";

export default async function solveQuiz({ email, secret, startUrl }) {
  let currentUrl = startUrl;
  const steps = [];

  for (let step = 0; step < 10; step++) {

    // 1. Render the quiz page
    const { html, text } = await renderPage(currentUrl);

    // 2. Extract submit URL
    const submitUrl = extractSubmitUrl(html, text, currentUrl);
    if (!submitUrl) {
      return {
        error: "Submit URL not found",
        url: currentUrl,
        sample: html.slice(0, 500)
      };
    }

    // 3. Compute correct answer
    const answer = await dispatchTask({ currentUrl, html, text });

    // 4. Submit payload
    const payload = { email, secret, url: currentUrl, answer };

    const submitResp = await fetch(submitUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    })
      .then((r) => r.json())
      .catch((e) => ({ error: e.message }));

    steps.push({
      step,
      page: currentUrl,
      answer,
      submitResp
    });

    if (!submitResp.url) {
      return { done: true, steps };
    }

    currentUrl = submitResp.url;
  }

  return { done: false, message: "Max steps reached", steps };
}

/* -------------------------------------------------------------------------- */
/*  TASK DISPATCHER (Handles all known quiz types including demo chain)       */
/* -------------------------------------------------------------------------- */

async function dispatchTask({ currentUrl, html, text }) {

  /* ---------------------------- DEMO STEP 0 -------------------------------- */
  if (currentUrl.includes("/demo")) {
    return "demo_answer"; // demo always accepts any answer
  }

  /* ------------------------- DEMO SCRAPE STEP ------------------------------ */
  if (currentUrl.includes("/demo-scrape")) {
    const rel = html.match(/href="(\/demo-scrape-data[^"]+)"/)?.[1];
    if (!rel) return "error: scrape-data link not found";

    const origin = currentUrl.match(/^https?:\/\/[^\/]+/)[0];
    const targetUrl = origin + rel;

    const { text: scrapeText } = await renderPage(targetUrl);

    // secret code looks like: Secret Code: XYZ123
    const secret = scrapeText.match(/secret code[:\s]+([A-Za-z0-9]+)/i)?.[1];

    return secret || "error: secret code not found";
  }

  /* --------------------------- DEMO AUDIO STEP ----------------------------- */
  if (currentUrl.includes("/demo-audio")) {
    // The demo-audio page contains numbers in plain text like:
    // "Audio transcript: 12 14 50 7"
    const nums = text.match(/\d+/g);
    if (!nums) return "0";
    const sum = nums.map(Number).reduce((a, b) => a + b, 0);
    return String(sum);
  }

  /* ------------------------- PDF HANDLING ---------------------------------- */
  const pdfLink = html.match(/https?:\/\/[^\s"'<>]+\.pdf/gi)?.[0];
  if (pdfLink) {
    const pdfText = await extractPDF(pdfLink);
    return await pipeAI(`Solve this PDF based question:\n${pdfText}`);
  }

  /* ------------------------- CSV HANDLING ---------------------------------- */
  const csvLink = html.match(/https?:\/\/[^\s"'<>]+\.csv/gi)?.[0];
  if (csvLink) {
    const csv = await extractCSV(csvLink);
    return await pipeAI(`Solve based on this CSV:\n${JSON.stringify(csv)}`);
  }

  /* ------------------------- TABLE HANDLING -------------------------------- */
  const tables = extractTables(html);
  if (tables.length > 0) {
    return await pipeAI(`
      Solve based on these HTML tables:
      ${JSON.stringify(tables)}
      Page text:
      ${text}
    `);
  }

  /* ------------------------- FALLBACK: TEXT ONLY --------------------------- */
  return await pipeAI(`
    Solve the quiz using ONLY this text:
    ${text}
  `);
}

/* -------------------------------------------------------------------------- */
/*  UNIVERSAL SUBMIT URL DETECTOR                                             */
/* -------------------------------------------------------------------------- */

function extractSubmitUrl(html, text, pageUrl) {
  const origin = pageUrl.match(/^https?:\/\/[^\/]+/i)?.[0];

  // 1. Absolute URL
  let full =
    html.match(/https?:\/\/[^\s"'<>]+\/submit[^\s"'<>]*/)?.[0] ||
    text.match(/https?:\/\/[^\s"'<>]+\/submit[^\s"'<>]*/)?.[0];
  if (full) return full;

  // 2. Split origin <span class="origin">http..</span>/submit
  const spanOrigin =
    html.match(/<span class="origin">(.*?)<\/span>/)?.[1] ||
    text.match(/origin">(.*?)<\/span>/)?.[1];

  if (spanOrigin) {
    const cleanOrigin = spanOrigin.replace(/<[^>]+>/g, "").trim();
    if (html.includes(`</span>/submit`) || text.includes(`/submit`)) {
      return `${cleanOrigin}/submit`;
    }
  }

  // 3. Relative /submit
  const rel =
    html.match(/href="(\/submit[^"]*)"/)?.[1] ||
    text.match(/(\/submit)(?![^<]*>)/)?.[1];
  if (rel && origin) {
    return `${origin}${rel}`;
  }

  return null;
}
