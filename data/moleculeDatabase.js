function parseAtomCounts(formula = "") {
  const text = String(formula || "")
    .replace(/\s+/g, "")
    .replace(/\([^)]*\)/g, "")
    .replace(/[+\-].*$/, "");

  const counts = {};
  const regex = /([A-Z][a-z]?)(\d*)/g;
  let match;

  while ((match = regex.exec(text)) !== null) {
    const atom = match[1];
    const amount = match[2] ? Number(match[2]) : 1;
    counts[atom] = (counts[atom] || 0) + amount;
  }

  return counts;
}

const canonicalOverrides = {
  "Water": {
    atomCounts: { H: 2, O: 1 },
    bonds: [{ from: "O", to: "H", type: "single" }, { from: "O", to: "H", type: "single" }],
    geometry: "bent",
    lonePairs: { O: 2 },
  },
  "Carbon Dioxide": {
    atomCounts: { C: 1, O: 2 },
    bonds: [{ from: "C", to: "O", type: "double" }, { from: "C", to: "O", type: "double" }],
    geometry: "linear",
  },
  "Ammonia": {
    atomCounts: { N: 1, H: 3 },
    bonds: [
      { from: "N", to: "H", type: "single" },
      { from: "N", to: "H", type: "single" },
      { from: "N", to: "H", type: "single" },
    ],
    geometry: "trigonal pyramidal",
    lonePairs: { N: 1 },
  },
  "Hydrogen Cyanide": {
    atomCounts: { H: 1, C: 1, N: 1 },
    bonds: [{ from: "H", to: "C", type: "single" }, { from: "C", to: "N", type: "triple" }],
    geometry: "linear",
  },
  "Carbon Disulfide": {
    atomCounts: { C: 1, S: 2 },
    bonds: [{ from: "C", to: "S", type: "double" }, { from: "C", to: "S", type: "double" }],
    geometry: "linear",
  },
  "Methane": {
    atomCounts: { C: 1, H: 4 },
    bonds: [
      { from: "C", to: "H", type: "single" },
      { from: "C", to: "H", type: "single" },
      { from: "C", to: "H", type: "single" },
      { from: "C", to: "H", type: "single" },
    ],
    geometry: "tetrahedral",
  },
  "Boron Trifluoride": {
    atomCounts: { B: 1, F: 3 },
    bonds: [
      { from: "B", to: "F", type: "single" },
      { from: "B", to: "F", type: "single" },
      { from: "B", to: "F", type: "single" },
    ],
    geometry: "trigonal planar",
  },
  "Ethene": {
    atomCounts: { C: 2, H: 4 },
    bonds: [{ from: "C", to: "C", type: "double" }],
    geometry: "trigonal planar",
  },
  "Ethyne": {
    atomCounts: { C: 2, H: 2 },
    bonds: [{ from: "C", to: "C", type: "triple" }],
    geometry: "linear",
  },
  "Formaldehyde": {
    atomCounts: { C: 1, H: 2, O: 1 },
    bonds: [{ from: "C", to: "O", type: "double" }],
    geometry: "trigonal planar",
  },
};

function fallbackCanonical(formula) {
  return {
    atomCounts: parseAtomCounts(formula),
    bonds: [],
  };
}

function createMolecule(category, name, formula, referenceImage = "assets/placeholder-structure.png", referenceDescription = "") {
  return {
    name,
    formula,
    category,
    referenceImage,
    referenceDescription,
    canonical: canonicalOverrides[name] || fallbackCanonical(formula),
  };
}

function mapMolecules(categoryLabel, items) {
  return items.map((item) =>
    createMolecule(
      categoryLabel,
      item.name,
      item.formula,
      item.referenceImage,
      item.referenceDescription
    )
  );
}

export const moleculeDatabase = {
  lewisStructures: {
    label: "Lewis Structures",
    molecules: mapMolecules("Lewis Structures", [
      { name: "Water", formula: "H2O", referenceDescription: "oxygen in center with two single bonds to hydrogens (bent shape)" },
      { name: "Carbon Dioxide", formula: "CO2", referenceDescription: "linear O=C=O" },
      { name: "Ammonia", formula: "NH3", referenceDescription: "nitrogen with three single bonds and a lone pair (trigonal pyramidal)" },
      { name: "Sulfur Dioxide", formula: "SO2", referenceDescription: "bent structure with S double-bonded to oxygens" },
      { name: "Nitrogen Dioxide", formula: "NO2", referenceDescription: "bent, odd-electron structure" },
      { name: "Hydrogen Cyanide", formula: "HCN", referenceDescription: "linear H-C≡N triple bond" },
      { name: "Ozone", formula: "O3", referenceDescription: "bent three-oxygen chain" },
      { name: "Carbon Disulfide", formula: "CS2", referenceDescription: "linear S=C=S" },
      { name: "Phosphorus Trichloride", formula: "PCl3", referenceDescription: "phosphorus center with three single bonds to chlorines" },
      { name: "Sulfur Tetrafluoride", formula: "SF4", referenceDescription: "see-saw shape with sulfur center and four fluorines" },
    ]),
  },
  molecularGeometry: {
    label: "Molecular Geometry",
    molecules: mapMolecules("Molecular Geometry", [
      { name: "Methane", formula: "CH4", referenceDescription: "tetrahedral central carbon with four single bonds" },
      { name: "Boron Trifluoride", formula: "BF3", referenceDescription: "trigonal planar boron with three fluorines" },
      { name: "Phosphorus Pentachloride", formula: "PCl5", referenceDescription: "trigonal bipyramidal" },
      { name: "Sulfur Hexafluoride", formula: "SF6", referenceDescription: "octahedral central sulfur" },
      { name: "Ammonia", formula: "NH3", referenceDescription: "trigonal pyramidal nitrogen" },
      { name: "Water", formula: "H2O", referenceDescription: "bent molecule with oxygen center" },
      { name: "Xenon Tetrafluoride", formula: "XeF4", referenceDescription: "square planar" },
      { name: "Carbon Dioxide", formula: "CO2", referenceDescription: "linear O=C=O" },
      { name: "Bromine Pentafluoride", formula: "BrF5", referenceDescription: "see-saw shape" },
      { name: "Chlorine Trifluoride", formula: "ClF3", referenceDescription: "T-shaped geometry" },
    ]),
  },
  organicCompounds: {
    label: "Organic Compounds",
    molecules: mapMolecules("Organic Compounds", [
      { name: "Methane", formula: "CH4", referenceDescription: "single central carbon with four single bonds (tetrahedral)" },
      { name: "Ethane", formula: "C2H6", referenceDescription: "two carbons connected with a single bond, each with single bonds to hydrogens" },
      { name: "Ethene", formula: "C2H4", referenceDescription: "two carbons connected with a double bond" },
      { name: "Ethyne", formula: "C2H2", referenceDescription: "two carbons connected with a triple bond" },
      { name: "Ethanol", formula: "C2H5OH", referenceDescription: "two-carbon chain with an -OH group" },
      { name: "Acetone", formula: "C3H6O", referenceDescription: "three-carbon chain with a central carbonyl (C=O)" },
      { name: "Benzene", formula: "C6H6", referenceDescription: "six-membered aromatic ring (hexagon) with alternating double bonds" },
      { name: "Toluene", formula: "C7H8", referenceDescription: "benzene ring with a methyl substituent" },
      { name: "Propanoic Acid", formula: "C3H6O2", referenceDescription: "three-carbon chain with a terminal carboxylic acid (-COOH)" },
      { name: "Formaldehyde", formula: "CH2O", referenceDescription: "single carbon with a double-bonded oxygen (aldehyde)" },
    ]),
  },
  polyatomicIons: {
    label: "Polyatomic Ions",
    molecules: mapMolecules("Polyatomic Ions", [
      { name: "Nitrate", formula: "NO3-" },
      { name: "Nitrite", formula: "NO2-" },
      { name: "Sulfate", formula: "SO4 2-" },
      { name: "Sulfite", formula: "SO3 2-" },
      { name: "Carbonate", formula: "CO3 2-" },
      { name: "Bicarbonate", formula: "HCO3-" },
      { name: "Phosphate", formula: "PO4 3-" },
      { name: "Hydroxide", formula: "OH-" },
      { name: "Ammonium", formula: "NH4+" },
      { name: "Permanganate", formula: "MnO4-" },
    ]),
  },
  functionalGroups: {
    label: "Functional Groups",
    molecules: mapMolecules("Functional Groups", [
      { name: "Hydroxyl", formula: "-OH" },
      { name: "Carbonyl", formula: "C=O" },
      { name: "Carboxyl", formula: "-COOH" },
      { name: "Amino", formula: "-NH2" },
      { name: "Aldehyde", formula: "-CHO" },
      { name: "Ketone", formula: ">C=O" },
      { name: "Ester", formula: "-COO-" },
      { name: "Ether", formula: "-O-" },
      { name: "Amide", formula: "-CONH2" },
      { name: "Nitrile", formula: "-C#N" },
    ]),
  },
  vseprShapes: {
    label: "VSEPR Shapes",
    molecules: mapMolecules("VSEPR Shapes", [
      { name: "Linear", formula: "AX2" },
      { name: "Bent", formula: "AX2E / AX2E2" },
      { name: "Trigonal Planar", formula: "AX3" },
      { name: "Tetrahedral", formula: "AX4" },
      { name: "Trigonal Pyramidal", formula: "AX3E" },
      { name: "Trigonal Bipyramidal", formula: "AX5" },
      { name: "Octahedral", formula: "AX6" },
      { name: "Seesaw", formula: "AX4E" },
      { name: "T-Shaped", formula: "AX3E2" },
      { name: "Square Planar", formula: "AX4E2" },
    ]),
  },
  acidsAndBases: {
    label: "Acids & Bases",
    molecules: mapMolecules("Acids & Bases", [
      { name: "Hydrochloric Acid", formula: "HCl" },
      { name: "Sulfuric Acid", formula: "H2SO4" },
      { name: "Nitric Acid", formula: "HNO3" },
      { name: "Acetic Acid", formula: "CH3COOH" },
      { name: "Phosphoric Acid", formula: "H3PO4" },
      { name: "Sodium Hydroxide", formula: "NaOH" },
      { name: "Potassium Hydroxide", formula: "KOH" },
      { name: "Ammonia", formula: "NH3" },
      { name: "Calcium Hydroxide", formula: "Ca(OH)2" },
      { name: "Carbonic Acid", formula: "H2CO3" },
    ]),
  },
  hybridization: {
    label: "Hybridization",
    molecules: mapMolecules("Hybridization", [
      { name: "Beryllium Chloride", formula: "BeCl2 (sp)" },
      { name: "Boron Trifluoride", formula: "BF3 (sp2)" },
      { name: "Methane", formula: "CH4 (sp3)" },
      { name: "Phosphorus Pentachloride", formula: "PCl5 (sp3d)" },
      { name: "Sulfur Hexafluoride", formula: "SF6 (sp3d2)" },
      { name: "Ethene Carbon", formula: "C (sp2)" },
      { name: "Ethyne Carbon", formula: "C (sp)" },
      { name: "Ammonia Nitrogen", formula: "N (sp3)" },
      { name: "Water Oxygen", formula: "O (sp3)" },
      { name: "Carbon Dioxide Carbon", formula: "C (sp)" },
    ]),
  },
};

export function getCategoryEntries() {
  return Object.entries(moleculeDatabase).map(([key, value]) => ({
    key,
    label: value.label,
    count: value.molecules.length,
  }));
}

export function getRandomMolecule(categoryKey) {
  const entry = moleculeDatabase[categoryKey];
  if (!entry || entry.molecules.length === 0) return null;

  const randomIndex = Math.floor(Math.random() * entry.molecules.length);
  return entry.molecules[randomIndex];
}
