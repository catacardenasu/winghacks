import { canonicalMolecules } from "../data/canonicalMolecules.js";
import { GoogleGenAI } from "@google/genai";

const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-2.5-flash";

const NAME_TO_FORMULA = {
  h2o: "H2O",
  water: "H2O",
  co2: "CO2",
  carbondioxide: "CO2",
  "carbon dioxide": "CO2",
  nh3: "NH3",
  ammonia: "NH3",
  ch4: "CH4",
  methane: "CH4",
  hcn: "HCN",
  hydrogencyanide: "HCN",
  "hydrogen cyanide": "HCN",
  o2: "O2",
  oxygen: "O2",
  n2: "N2",
  nitrogen: "N2",
  hcl: "HCl",
  hydrogenchloride: "HCl",
  "hydrogen chloride": "HCl",
  c2h4: "C2H4",
  ethene: "C2H4",
  c2h2: "C2H2",
  ethyne: "C2H2",
  acetylene: "C2H2",
  no2: "NO2",
  nitrogendioxide: "NO2",
  "nitrogen dioxide": "NO2",
  so2: "SO2",
  sulfurdioxide: "SO2",
  "sulfur dioxide": "SO2",
};

function normalizeBondType(type) {
  const value = String(type || "single").toLowerCase();
  if (value === "double" || value === "triple") return value;
  return "single";
}

function normalizeName(value) {
  return String(value || "").trim().toLowerCase();
}

function normalizeFormula(value) {
  return String(value || "").replace(/\s+/g, "").toUpperCase();
}

function resolveCanonicalMolecule({ moleculeName, moleculeFormula }) {
  const byName = NAME_TO_FORMULA[normalizeName(moleculeName)] || NAME_TO_FORMULA[normalizeName(moleculeName).replace(/\s+/g, "")];
  if (byName && canonicalMolecules[byName]) return canonicalMolecules[byName];

  const byFormula = canonicalMolecules[normalizeFormula(moleculeFormula)];
  if (byFormula) return byFormula;

  return null;
}

function normalizeParsedDrawing(parsedDrawing = {}) {
  const seenIds = new Set();
  const atoms = [];

  for (const atom of Array.isArray(parsedDrawing.atoms) ? parsedDrawing.atoms : []) {
    const id = String(atom?.id || "").trim();
    const element = String(atom?.element || atom?.symbol || "").trim();
    if (!id || !element || seenIds.has(id)) continue;
    seenIds.add(id);
    atoms.push({ id, element });
  }

  const atomIds = new Set(atoms.map((atom) => atom.id));
  const bonds = [];
  const seenBonds = new Set();

  for (const bond of Array.isArray(parsedDrawing.bonds) ? parsedDrawing.bonds : []) {
    const from = String(bond?.from || "").trim();
    const to = String(bond?.to || "").trim();
    if (!from || !to || from === to) continue;
    if (!atomIds.has(from) || !atomIds.has(to)) continue;

    const left = from < to ? from : to;
    const right = from < to ? to : from;
    const type = normalizeBondType(bond?.type);
    const key = `${left}__${right}`;
    if (seenBonds.has(key)) continue;
    seenBonds.add(key);

    bonds.push({ from: left, to: right, type });
  }

  return { atoms, bonds };
}

function edgeKey(a, b) {
  return a < b ? `${a}__${b}` : `${b}__${a}`;
}

function elementCounts(atoms) {
  const counts = new Map();
  for (const atom of atoms) {
    counts.set(atom.element, (counts.get(atom.element) || 0) + 1);
  }
  return counts;
}

function buildAdjacencyMap(graph) {
  const adjacency = new Map();
  for (const atom of graph.atoms) {
    adjacency.set(atom.id, []);
  }

  for (const bond of graph.bonds) {
    if (!adjacency.has(bond.from) || !adjacency.has(bond.to)) continue;
    adjacency.get(bond.from).push({ neighborId: bond.to, type: bond.type });
    adjacency.get(bond.to).push({ neighborId: bond.from, type: bond.type });
  }

  for (const list of adjacency.values()) {
    list.sort((a, b) => {
      if (a.neighborId === b.neighborId) return a.type.localeCompare(b.type);
      return a.neighborId.localeCompare(b.neighborId);
    });
  }

  return adjacency;
}

function buildEdgeMap(graph) {
  const edgeMap = new Map();
  for (const bond of graph.bonds) {
    edgeMap.set(edgeKey(bond.from, bond.to), bond.type);
  }
  return edgeMap;
}

function buildIndexedGraph(graph) {
  const atomById = new Map(graph.atoms.map((atom) => [atom.id, atom]));
  return {
    ...graph,
    atomById,
    adjacency: buildAdjacencyMap(graph),
    edgeMap: buildEdgeMap(graph),
  };
}

function neighborSignature(graph, atomId) {
  const buckets = new Map();
  for (const edge of graph.adjacency.get(atomId) || []) {
    const neighbor = graph.atomById.get(edge.neighborId);
    if (!neighbor) continue;
    const key = `${neighbor.element}|${edge.type}`;
    buckets.set(key, (buckets.get(key) || 0) + 1);
  }

  return Array.from(buckets.entries())
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([key, count]) => `${key}:${count}`)
    .join(",");
}

function buildCandidateMap(parsed, canonical) {
  const canonicalIds = canonical.atoms.map((atom) => atom.id);
  const candidates = new Map();

  for (const parsedAtom of parsed.atoms) {
    const parsedId = parsedAtom.id;
    const parsedDegree = parsed.adjacency.get(parsedId)?.length || 0;
    const parsedSignature = neighborSignature(parsed, parsedId);

    let options = canonicalIds.filter((canonId) => {
      const canonAtom = canonical.atomById.get(canonId);
      if (!canonAtom || canonAtom.element !== parsedAtom.element) return false;
      const canonDegree = canonical.adjacency.get(canonId)?.length || 0;
      if (canonDegree !== parsedDegree) return false;
      return neighborSignature(canonical, canonId) === parsedSignature;
    });

    if (options.length === 0) {
      options = canonicalIds.filter((canonId) => {
        const canonAtom = canonical.atomById.get(canonId);
        if (!canonAtom || canonAtom.element !== parsedAtom.element) return false;
        const canonDegree = canonical.adjacency.get(canonId)?.length || 0;
        return canonDegree === parsedDegree;
      });
    }

    candidates.set(parsedId, options.sort((a, b) => a.localeCompare(b)));
  }

  return candidates;
}

function findNodeMapping(parsed, canonical) {
  const parsedIds = parsed.atoms.map((atom) => atom.id);
  const candidates = buildCandidateMap(parsed, canonical);

  const order = [...parsedIds].sort((a, b) => {
    const diff = (candidates.get(a)?.length || 0) - (candidates.get(b)?.length || 0);
    if (diff !== 0) return diff;
    return a.localeCompare(b);
  });

  const mapping = new Map();
  const usedCanonical = new Set();

  function isConsistent(parsedId, canonicalId) {
    for (const edge of parsed.adjacency.get(parsedId) || []) {
      const mappedNeighbor = mapping.get(edge.neighborId);
      if (!mappedNeighbor) continue;
      const expectedType = canonical.edgeMap.get(edgeKey(canonicalId, mappedNeighbor));
      if (!expectedType || expectedType !== edge.type) return false;
    }
    return true;
  }

  function backtrack(index) {
    if (index >= order.length) return true;

    const parsedId = order[index];
    const options = candidates.get(parsedId) || [];

    for (const canonicalId of options) {
      if (usedCanonical.has(canonicalId)) continue;
      if (!isConsistent(parsedId, canonicalId)) continue;

      mapping.set(parsedId, canonicalId);
      usedCanonical.add(canonicalId);

      if (backtrack(index + 1)) return true;

      mapping.delete(parsedId);
      usedCanonical.delete(canonicalId);
    }

    return false;
  }

  return backtrack(0) ? mapping : null;
}

function compareStructures(parsedDrawing, canonicalStructure) {
  const feedback = [];

  const parsed = buildIndexedGraph(normalizeParsedDrawing(parsedDrawing));
  const canonical = buildIndexedGraph(normalizeParsedDrawing(canonicalStructure));

  if (parsed.atoms.length !== canonical.atoms.length) {
    feedback.push("Atom count mismatch");
  }

  const parsedElementCounts = elementCounts(parsed.atoms);
  const canonicalElementCounts = elementCounts(canonical.atoms);
  const allElements = Array.from(new Set([...parsedElementCounts.keys(), ...canonicalElementCounts.keys()]))
    .sort((a, b) => a.localeCompare(b));

  for (const element of allElements) {
    const parsedCount = parsedElementCounts.get(element) || 0;
    const canonicalCount = canonicalElementCounts.get(element) || 0;
    if (parsedCount !== canonicalCount) {
      feedback.push("Atom count mismatch");
      break;
    }
  }

  if (parsed.bonds.length !== canonical.bonds.length) {
    feedback.push("Connectivity mismatch");
  }

  const mapping = findNodeMapping(parsed, canonical);

  if (!mapping) {
    const parsedPairs = new Map();
    const canonicalPairs = new Map();

    for (const bond of parsed.bonds) {
      const left = parsed.atomById.get(bond.from)?.element || "?";
      const right = parsed.atomById.get(bond.to)?.element || "?";
      const pair = [left, right].sort((a, b) => a.localeCompare(b)).join("-");
      parsedPairs.set(`${pair}|${bond.type}`, (parsedPairs.get(`${pair}|${bond.type}`) || 0) + 1);
    }

    for (const bond of canonical.bonds) {
      const left = canonical.atomById.get(bond.from)?.element || "?";
      const right = canonical.atomById.get(bond.to)?.element || "?";
      const pair = [left, right].sort((a, b) => a.localeCompare(b)).join("-");
      canonicalPairs.set(`${pair}|${bond.type}`, (canonicalPairs.get(`${pair}|${bond.type}`) || 0) + 1);
    }

    const keys = Array.from(new Set([...parsedPairs.keys(), ...canonicalPairs.keys()]))
      .sort((a, b) => a.localeCompare(b));

    for (const key of keys) {
      const expected = canonicalPairs.get(key) || 0;
      const actual = parsedPairs.get(key) || 0;
      if (actual === expected) continue;

      const [pair] = key.split("|");
      const [x, y] = pair.split("-");
      if (actual < expected) feedback.push(`Missing bond between ${x} and ${y}`);
      if (actual > expected) feedback.push(`Extra bond between ${x} and ${y}`);
    }

    return {
      passed: feedback.length === 0,
      feedback,
    };
  }

  const reverseMapping = new Map();
  for (const [parsedId, canonicalId] of mapping.entries()) {
    reverseMapping.set(canonicalId, parsedId);
  }

  for (const canonicalAtom of canonical.atoms) {
    const parsedId = reverseMapping.get(canonicalAtom.id);
    const expectedDegree = canonical.adjacency.get(canonicalAtom.id)?.length || 0;
    const actualDegree = parsed.adjacency.get(parsedId)?.length || 0;
    if (expectedDegree !== actualDegree) {
      feedback.push("Connectivity mismatch");
      break;
    }
  }

  for (const canonicalBond of canonical.bonds) {
    const parsedFrom = reverseMapping.get(canonicalBond.from);
    const parsedTo = reverseMapping.get(canonicalBond.to);
    const parsedType = parsed.edgeMap.get(edgeKey(parsedFrom, parsedTo));

    const left = canonical.atomById.get(canonicalBond.from)?.element || "?";
    const right = canonical.atomById.get(canonicalBond.to)?.element || "?";

    if (!parsedType) {
      feedback.push(`Missing bond between ${left} and ${right}`);
    } else if (parsedType !== canonicalBond.type) {
      feedback.push(`Incorrect bond type between ${left} and ${right}`);
    }
  }

  for (const parsedBond of parsed.bonds) {
    const canonicalFrom = mapping.get(parsedBond.from);
    const canonicalTo = mapping.get(parsedBond.to);
    const canonicalType = canonical.edgeMap.get(edgeKey(canonicalFrom, canonicalTo));

    const left = parsed.atomById.get(parsedBond.from)?.element || "?";
    const right = parsed.atomById.get(parsedBond.to)?.element || "?";

    if (!canonicalType) {
      feedback.push(`Extra bond between ${left} and ${right}`);
    }
  }

  return {
    passed: feedback.length === 0,
    feedback,
  };
}

async function buildAiExplanation(moleculeName, structuralFeedback) {
  if (!Array.isArray(structuralFeedback) || structuralFeedback.length === 0) {
    return null;
  }

  if (!process.env.GEMINI_API_KEY) {
    return "Review the listed structural mismatches and adjust your bonds and atoms to match the target molecule.";
  }

  try {
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    const feedbackLines = structuralFeedback.map((item) => `- ${item}`).join("\n");
    const prompt = [
      `The student attempted to draw ${moleculeName || "the molecule"}.`,
      "Structural errors:",
      feedbackLines,
      "Explain clearly and briefly what they did wrong and how to fix it.",
      "Be encouraging.",
    ].join("\n");

    const response = await ai.models.generateContent({
      model: GEMINI_MODEL,
      config: {
        temperature: 0,
        topP: 0.1,
        candidateCount: 1,
        maxOutputTokens: 140,
      },
      contents: [{ role: "user", parts: [{ text: prompt }] }],
    });

    const text = typeof response?.text === "string"
      ? response.text.trim()
      : response?.candidates?.[0]?.content?.parts?.find((part) => typeof part?.text === "string")?.text?.trim() || "";

    return text || "Review the listed structural mismatches and try again.";
  } catch (error) {
    console.error("Gemini explanation error:", error);
    return "Review the listed structural mismatches and try again.";
  }
}

export async function gradeWithHybrid(reqBody) {
  const { moleculeName, moleculeFormula, parsedDrawing } = reqBody || {};
  const canonical = resolveCanonicalMolecule({ moleculeName, moleculeFormula });

  if (!canonical) {
    const structuralFeedback = ["Atom count mismatch"];
    return {
      passed: false,
      structuralFeedback,
      aiExplanation: await buildAiExplanation(moleculeName || moleculeFormula, structuralFeedback),
    };
  }

  const comparison = compareStructures(parsedDrawing || {}, canonical);
  if (comparison.passed) {
    return {
      passed: true,
      structuralFeedback: [],
      aiExplanation: null,
    };
  }

  return {
    passed: false,
    structuralFeedback: comparison.feedback,
    aiExplanation: await buildAiExplanation(canonical.name || moleculeName, comparison.feedback),
  };
}

export async function gradeRoute(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ passed: false, structuralFeedback: [], aiExplanation: null });
  }

  try {
    const output = await gradeWithHybrid(req.body || {});
    return res.status(200).json(output);
  } catch (error) {
    console.error("/api/grade error:", error);
    return res.status(200).json({ passed: false, structuralFeedback: [], aiExplanation: null });
  }
}
