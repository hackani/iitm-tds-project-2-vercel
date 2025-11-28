import renderPage from "../lib/browserless.js";
import extractTables from "../lib/extract.js";
import extractPDF from "../lib/pdf.js";
import extractCSV from "../lib/csv.js";
import pipeAI from "./pipeClient.js";

/**
 * Loop solver for multi-step quiz chain
 */
export default async function solveQuiz({ email, secret, startUrl }) {
  let currentUrl = startUrl;
  let finalResponses = [];

  for (let step = 0; step < 10; step++) {
    // 10 steps max to prevent infinite loops

    // 1. Render quiz page
    const { html, text } = await renderPage(currentUrl);

    // 2. Extract submit URL from page
    const submitUrl = extractSubmitUrl(html, text);
    if (!submitUrl) {
      return {
        error: "Submit URL not found. Quiz page format unexpected.",
        url: currentUrl,
        htmlSample: html.slice(0, 500)
      };
    }

    // 3. Ask PiPe AI to interpret instructions
    const instruction = await pipeAI(`
      You are assisting in a quiz solver.
      Given the text of a quiz page, extract:
      1. What is being asked?
      2. What steps are needed?
      3. What data must be extracted (tables, PDFs, CSVs etc)?
      4. What the final answer should be like (string/number/boolean/JSON)?

      Quiz Text:
      ${text}
    `);

    // 4. Execute task using hybrid tools
    const answer = await solveInstruction({ instruction, html, text, currentUrl });

    // 5. Submit answer payload
    const payload = {
      email,
      secret,
      url: currentUrl,
      answer
    };

    const submitResp = await fetch(submitUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    }).then(r => r.json()).catch(e => ({ error: e.message }));

    finalResponses.push({
      step,
      page: currentUrl,
      instruction,
      answer,
      submitResp
    });

    if (!submitResp.url) {
      // quiz finished
      return {
        done: true,
        steps: finalResponses
      };
    }

    // move to next quiz page
    currentUrl = submitResp.url;
  }

  return {
    done: false,
    message: "Max steps reached (10)",
    steps: finalResponses
  };
}

/**
 * Look for submit URL in HTML or page text
 */
function extractSubmitUrl(html, text) {
  return (
    html.match(/https?:\/\/[^\s"'<>]+\/submit[^\s"'<>]*/)?.[0] ||
    text.match(/https?:\/\/[^\s"'<>]+\/submit[^\s"'<>]*/)?.[0]
  );
}

/**
 * Executes task based on AI instructions:
 * - Extract PDF
 * - Extract CSV
 * - Extract tables
 * - Basic math
 * - Returning JSON answers
 */
async function solveInstruction({ instruction, html, text, currentUrl }) {
  try {
    // Detect PDF link
    const pdfLink = html.match(/https?:\/\/[^\s"'<>]+\.pdf/gi)?.[0];
    if (pdfLink) {
      const pdfText = await extractPDF(pdfLink);
      return await pipeAI(`Given this PDF text, answer the quiz: ${pdfText}`);
    }

    // Detect CSV link
    const csvLink = html.match(/https?:\/\/[^\s"'<>]+\.csv/gi)?.[0];
    if (csvLink) {
      const csv = await extractCSV(csvLink);
      return await pipeAI(`Given this CSV data: ${JSON.stringify(csv)}, answer the quiz: ${instruction}`);
    }

    // Extract HTML tables
    const tables = extractTables(html);
    if (tables.length > 0) {
      return await pipeAI(`
        Quiz instruction: ${instruction}
        Tables extracted: ${JSON.stringify(tables)}
        Compute the correct answer.
      `);
    }

    // If nothing special → let AI solve directly from text
    return await pipeAI(`
      Solve the quiz question based ONLY on this text:
      ${text}
    `);
  } catch (e) {
    return `error: ${e.message}`;
  }
}
