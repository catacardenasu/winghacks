function createMolecule(category, name, formula, referenceImage = "assets/placeholder-structure.png") {
  return { name, formula, category, referenceImage };
}

function mapMolecules(categoryLabel, items) {
  return items.map((item) => createMolecule(categoryLabel, item.name, item.formula, item.referenceImage));
}

export const moleculeDatabase = {
  lewisStructures: {
    label: "Lewis Structures",
    molecules: mapMolecules("Lewis Structures", [
      { name: "Water", formula: "H2O" },
      { name: "Carbon Dioxide", formula: "CO2" },
      { name: "Ammonia", formula: "NH3" },
      { name: "Sulfur Dioxide", formula: "SO2" },
      { name: "Nitrogen Dioxide", formula: "NO2" },
      { name: "Hydrogen Cyanide", formula: "HCN" },
      { name: "Ozone", formula: "O3" },
      { name: "Carbon Disulfide", formula: "CS2" },
      { name: "Phosphorus Trichloride", formula: "PCl3" },
      { name: "Sulfur Tetrafluoride", formula: "SF4" },
    ]),
  },
  molecularGeometry: {
    label: "Molecular Geometry",
    molecules: mapMolecules("Molecular Geometry", [
      { name: "Methane", formula: "CH4" },
      { name: "Boron Trifluoride", formula: "BF3" },
      { name: "Phosphorus Pentachloride", formula: "PCl5" },
      { name: "Sulfur Hexafluoride", formula: "SF6" },
      { name: "Ammonia", formula: "NH3" },
      { name: "Water", formula: "H2O" },
      { name: "Xenon Tetrafluoride", formula: "XeF4" },
      { name: "Carbon Dioxide", formula: "CO2" },
      { name: "Bromine Pentafluoride", formula: "BrF5" },
      { name: "Chlorine Trifluoride", formula: "ClF3" },
    ]),
  },
  organicCompounds: {
    label: "Organic Compounds",
    molecules: mapMolecules("Organic Compounds", [
      { name: "Methane", formula: "CH4" },
      { name: "Ethane", formula: "C2H6" },
      { name: "Ethene", formula: "C2H4" },
      { name: "Ethyne", formula: "C2H2" },
      { name: "Ethanol", formula: "C2H5OH" },
      { name: "Acetone", formula: "C3H6O" },
      { name: "Benzene", formula: "C6H6" },
      { name: "Toluene", formula: "C7H8" },
      { name: "Propanoic Acid", formula: "C3H6O2" },
      { name: "Formaldehyde", formula: "CH2O" },
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
