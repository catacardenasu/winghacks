const { GoogleGenAI } = require("@google/genai");

const GEMINI_MODEL = process.env.GEMINI_VISION_MODEL || "gemini-2.5-pro";

const FALLBACK_ERROR_JSON = {
  score: 0,
  feedback: "AI grading error. Please retry.",
  mistakes: [],
  confidence: 0,
};

/**
 * Prompt is intentionally strict and rubric-driven so Gemini behaves like a
 * deterministic chemistry grader rather than a general assistant.
 */
const SYSTEM_INSTRUCTION = [
  "You are a strict university-level chemistry professor grading a student-drawn molecular structure.",
  "Use formal chemistry rules only.",
  "Be precise and analytical.",
  "Do not guess.",
  "If image quality is unclear, reduce clarityScore and confidence.",
  "Return ONLY valid JSON and no extra text.",
  "Do not include markdown.",
].join(" ");

function parseImagePayload(imageBase64, explicitMimeType) {
  if (!imageBase64 || typeof imageBase64 !== "string") {
    throw new Error("Missing imageBase64");
  }

  const trimmed = imageBase64.trim();

  // Accept either a raw base64 payload or a data URL.
  if (trimmed.startsWith("data:")) {
    const match = trimmed.match(/^data:([^;]+);base64,(.+)$/);
    if (!match) {
      throw new Error("Invalid data URL format");
    }

    return {
      mimeType: match[1],
      data: match[2],
    };
  }

  return {
    mimeType: explicitMimeType || "image/png",
    data: trimmed,
  };
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function numberOr(value, fallback) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function normalizeGradingJson(raw) {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    throw new Error("Response is not an object");
  }

  const mistakes = Array.isArray(raw.mistakes)
    ? raw.mistakes.filter((m) => typeof m === "string").slice(0, 12)
    : [];

  return {
    score: clamp(numberOr(raw.score, 0), 0, 100),
    atomScore: clamp(numberOr(raw.atomScore, 0), 0, 100),
    bondScore: clamp(numberOr(raw.bondScore, 0), 0, 100),
    geometryScore: clamp(numberOr(raw.geometryScore, 0), 0, 100),
    lonePairScore: clamp(numberOr(raw.lonePairScore, 0), 0, 100),
    clarityScore: clamp(numberOr(raw.clarityScore, 0), 0, 100),
    mistakes,
    feedback: typeof raw.feedback === "string" ? raw.feedback : "",
    confidence: clamp(numberOr(raw.confidence, 0), 0, 1),
  };
}

function extractTextResponse(response) {
  if (typeof response?.text === "string" && response.text.trim()) {
    return response.text.trim();
  }

  const firstPartText =
    response?.candidates?.[0]?.content?.parts?.find((p) => typeof p?.text === "string")?.text;

  if (typeof firstPartText === "string" && firstPartText.trim()) {
    return firstPartText.trim();
  }

  throw new Error("Gemini returned no text content");
}

async function callGeminiGrade({ moleculeName, moleculeFormula, category, imagePart }) {
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

  const gradingRequest = [
    `Molecule: ${moleculeName || "Unknown"}${moleculeFormula ? ` (${moleculeFormula})` : ""}`,
    `Category: ${category || "Unknown"}`,
    "",
    "Grade this student drawing using these strict weighted criteria:",
    "- Atom correctness: 20",
    "- Bond correctness: 30",
    "- Geometry (if relevant): 20",
    "- Lone pairs/formal charge: 20",
    "- Clarity: 10",
    "",
    "Evaluate:",
    "1) Atom count correctness",
    "2) Bond count correctness",
    "3) Formal charges",
    "4) Geometry (if relevant to category)",
    "5) Lone pairs",
    "6) Resonance (if applicable)",
    "7) Overall structural validity",
    "",
    "Return ONLY valid JSON with this exact shape:",
    '{"score":number,"atomScore":number,"bondScore":number,"geometryScore":number,"lonePairScore":number,"clarityScore":number,"mistakes":["string"],"feedback":"string","confidence":number}',
    "No markdown. No explanation outside JSON.",
  ].join("\n");

  // responseMimeType + temperature 0 helps consistency and machine-parseable output.
  return ai.models.generateContent({
    model: GEMINI_MODEL,
    config: {
      systemInstruction: SYSTEM_INSTRUCTION,
      responseMimeType: "application/json",
      temperature: 0,
      topP: 0.1,
      candidateCount: 1,
    },
    contents: [
      {
        role: "user",
        parts: [
          { text: gradingRequest },
          {
            inlineData: {
              mimeType: imagePart.mimeType,
              data: imagePart.data,
            },
          },
        ],
      },
    ],
  });
}

async function gradeHandler(req, res) {
  if (req.method && req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const {
      moleculeName,
      moleculeFormula,
      category,
      imageBase64,
      imageMimeType,
    } = req.body || {};

    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({ error: "GEMINI_API_KEY is not set" });
    }

    const imagePart = parseImagePayload(imageBase64, imageMimeType);
    const modelResponse = await callGeminiGrade({
      moleculeName,
      moleculeFormula,
      category,
      imagePart,
    });

    const textPayload = extractTextResponse(modelResponse);

    try {
      const parsed = JSON.parse(textPayload);
      const normalized = normalizeGradingJson(parsed);
      return res.status(200).json(normalized);
    } catch {
      // Required malformed-response fallback contract.
      return res.status(200).json(FALLBACK_ERROR_JSON);
    }
  } catch (error) {
    console.error("/api/grade error:", error);
    return res.status(200).json(FALLBACK_ERROR_JSON);
  }
}

module.exports = gradeHandler;
module.exports.FALLBACK_ERROR_JSON = FALLBACK_ERROR_JSON;
