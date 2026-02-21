const STORAGE_KEY = "reviewMolecules";

function readStore() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];

    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeStore(value) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(value));
}

export function addToReview(molecule) {
  const list = readStore();
  const existing = list.find((item) => item.name === molecule.name);

  if (existing) {
    existing.formula = molecule.formula;
    existing.lastScore = molecule.lastScore;
    existing.referenceImage = molecule.referenceImage;
    existing.category = molecule.category;
    existing.categoryKey = molecule.categoryKey || existing.categoryKey || "";
    existing.attempts = Math.max(existing.attempts || 1, molecule.attempts || 1);
  } else {
    list.push({
      name: molecule.name,
      formula: molecule.formula,
      lastScore: molecule.lastScore,
      attempts: molecule.attempts || 1,
      category: molecule.category || "",
      categoryKey: molecule.categoryKey || "",
      referenceImage: molecule.referenceImage || "",
    });
  }

  writeStore(list);
}

export function getReviewList() {
  return readStore();
}

export function removeFromReview(moleculeName) {
  const list = readStore().filter((item) => item.name !== moleculeName);
  writeStore(list);
}
