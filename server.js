import express from "express";
import bodyParser from "body-parser";
import { GoogleGenAI } from "@google/genai";
import { moleculeDatabase } from "./data/moleculeDatabase.js";

const app = express();
app.use(bodyParser.json({ limit: "10mb" }));

const ai = new GoogleGenAI({});

function buildPrompt(molecule, drawingDataUrl) {
  // Prompt asks the model to compare the user's drawing to the reference.
  // For best results replace `molecule.referenceImage` with a publicly reachable URL.
  return `You are an expert chemistry grader. Compare the student's drawing to the reference image and formula.
Reference molecule: ${molecule.name} (${molecule.formula})
Reference image URL: ${molecule.referenceImage || "(none)"}

Student drawing (data URL or short description): ${drawingDataUrl}

Please produce a JSON object only with these fields:
{
  "score": <integer 0-100>,
  "feedback": <short textual feedback>,
  "details": <optional array of short observations>
}

Score should reflect structural correctness: rings, bond counts, double/triple bonds, and key functional groups. Be concise.`;
}

app.post("/api/gemini-evaluate", async (req, res) => {
  try {
    const { drawingDataUrl, molecule } = req.body || {};
    if (!drawingDataUrl || !molecule) return res.status(400).json({ error: "missing drawingDataUrl or molecule" });

    const prompt = buildPrompt(molecule, drawingDataUrl);

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
    });

    const text = response?.text || "";

    // Try to find JSON in the model output
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    let parsed = null;
    if (jsonMatch) {
      try {
        parsed = JSON.parse(jsonMatch[0]);
      } catch (e) {
        // fallthrough
      }
    }

    // Fallback: ask model for a numeric guess
    if (!parsed) {
      // crude extraction: look for a number 0-100
      const numMatch = text.match(/(\d{1,3})/);
      const score = numMatch ? Math.min(100, Math.max(0, Number(numMatch[1]))) : null;
      const feedback = text.substring(0, 240);
      return res.json({ score, feedback, raw: text });
    }

    return res.json({ score: parsed.score ?? null, feedback: parsed.feedback ?? "", details: parsed.details ?? [], raw: text });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message || String(err) });
  }
});

app.post("/api/gemini-recognize", async (req, res) => {
  try {
    const { drawingDataUrl, categoryKey } = req.body || {};
    if (!drawingDataUrl) return res.status(400).json({ error: "missing drawingDataUrl" });

    // Build candidate list from category or all categories
    let candidates = [];
    if (categoryKey && moleculeDatabase[categoryKey]) {
      candidates = moleculeDatabase[categoryKey].molecules;
    } else {
      // flatten all molecules
      candidates = Object.values(moleculeDatabase).flatMap((cat) => cat.molecules || []);
    }

    // Limit candidates to a reasonable number to keep prompt size manageable
    const limited = candidates.slice(0, 20);

    const candidateLines = limited
      .map((m, i) => `${i + 1}. ${m.name} (${m.formula}) - ${m.referenceDescription || m.referenceImage || "no reference"}`)
      .join("\n");

    const prompt = `You are an expert chemistry image analyst. A student has drawn a chemical structure. Compare the student's drawing (data URL or short description below) against the list of candidate molecules and choose the single best match.

Student drawing: ${drawingDataUrl}

Candidates:
${candidateLines}

Return a JSON object only with these fields:
{
  "top": { "name": <string>, "index": <integer 1-based>, "score": <0-100>, "reason": <short text> },
  "candidates": [ { "name": <string>, "score": <0-100> } ]
}

Assess based on visible structural features: rings (size), double/triple bonds, chain length, and prominent functional groups. Be concise.`;

    const response = await ai.models.generateContent({ model: "gemini-3-flash-preview", contents: prompt });
    const text = response?.text || "";

    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      try {
        const parsed = JSON.parse(jsonMatch[0]);
        return res.json({ ...parsed, raw: text });
      } catch (e) {
        // fallthrough to parsing attempts
      }
    }

    // Fallback: try to find top candidate name and a score
    // Use simple heuristics: look for candidate names present in text
    const found = limited.map((m) => ({ name: m.name, present: text.includes(m.name) }));
    const top = found.find((f) => f.present) || { name: limited[0]?.name || null };
    return res.json({ top: { name: top.name, index: 1, score: null, reason: text.substring(0, 240) }, raw: text });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message || String(err) });
  }
});

const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`Server listening on :${port}`));
