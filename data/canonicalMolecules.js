export const canonicalMolecules = {
  H2O: {
    name: "H2O",
    atoms: [
      { id: "a1", element: "O" },
      { id: "a2", element: "H" },
      { id: "a3", element: "H" },
    ],
    bonds: [
      { from: "a1", to: "a2", type: "single" },
      { from: "a1", to: "a3", type: "single" },
    ],
  },
  CO2: {
    name: "CO2",
    atoms: [
      { id: "a1", element: "O" },
      { id: "a2", element: "C" },
      { id: "a3", element: "O" },
    ],
    bonds: [
      { from: "a2", to: "a1", type: "double" },
      { from: "a2", to: "a3", type: "double" },
    ],
  },
  NH3: {
    name: "NH3",
    atoms: [
      { id: "a1", element: "N" },
      { id: "a2", element: "H" },
      { id: "a3", element: "H" },
      { id: "a4", element: "H" },
    ],
    bonds: [
      { from: "a1", to: "a2", type: "single" },
      { from: "a1", to: "a3", type: "single" },
      { from: "a1", to: "a4", type: "single" },
    ],
  },
  CH4: {
    name: "CH4",
    atoms: [
      { id: "a1", element: "C" },
      { id: "a2", element: "H" },
      { id: "a3", element: "H" },
      { id: "a4", element: "H" },
      { id: "a5", element: "H" },
    ],
    bonds: [
      { from: "a1", to: "a2", type: "single" },
      { from: "a1", to: "a3", type: "single" },
      { from: "a1", to: "a4", type: "single" },
      { from: "a1", to: "a5", type: "single" },
    ],
  },
  HCN: {
    name: "HCN",
    atoms: [
      { id: "a1", element: "H" },
      { id: "a2", element: "C" },
      { id: "a3", element: "N" },
    ],
    bonds: [
      { from: "a1", to: "a2", type: "single" },
      { from: "a2", to: "a3", type: "triple" },
    ],
  },
  O2: {
    name: "O2",
    atoms: [
      { id: "a1", element: "O" },
      { id: "a2", element: "O" },
    ],
    bonds: [
      { from: "a1", to: "a2", type: "double" },
    ],
  },
  N2: {
    name: "N2",
    atoms: [
      { id: "a1", element: "N" },
      { id: "a2", element: "N" },
    ],
    bonds: [
      { from: "a1", to: "a2", type: "triple" },
    ],
  },
  HCl: {
    name: "HCl",
    atoms: [
      { id: "a1", element: "H" },
      { id: "a2", element: "Cl" },
    ],
    bonds: [
      { from: "a1", to: "a2", type: "single" },
    ],
  },
  C2H4: {
    name: "C2H4",
    atoms: [
      { id: "a1", element: "C" },
      { id: "a2", element: "C" },
      { id: "a3", element: "H" },
      { id: "a4", element: "H" },
      { id: "a5", element: "H" },
      { id: "a6", element: "H" },
    ],
    bonds: [
      { from: "a1", to: "a2", type: "double" },
      { from: "a1", to: "a3", type: "single" },
      { from: "a1", to: "a4", type: "single" },
      { from: "a2", to: "a5", type: "single" },
      { from: "a2", to: "a6", type: "single" },
    ],
  },
  C2H2: {
    name: "C2H2",
    atoms: [
      { id: "a1", element: "C" },
      { id: "a2", element: "C" },
      { id: "a3", element: "H" },
      { id: "a4", element: "H" },
    ],
    bonds: [
      { from: "a1", to: "a2", type: "triple" },
      { from: "a1", to: "a3", type: "single" },
      { from: "a2", to: "a4", type: "single" },
    ],
  },
  NO2: {
    name: "NO2",
    atoms: [
      { id: "a1", element: "N" },
      { id: "a2", element: "O" },
      { id: "a3", element: "O" },
    ],
    bonds: [
      { from: "a1", to: "a2", type: "double" },
      { from: "a1", to: "a3", type: "single" },
    ],
  },
  SO2: {
    name: "SO2",
    atoms: [
      { id: "a1", element: "S" },
      { id: "a2", element: "O" },
      { id: "a3", element: "O" },
    ],
    bonds: [
      { from: "a1", to: "a2", type: "double" },
      { from: "a1", to: "a3", type: "double" },
    ],
  },
};
