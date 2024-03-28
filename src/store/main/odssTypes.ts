import { Model } from "./types";

export type ODSS = {
  id: number;
  Nodes: { [key: number]: ODSSNode };
  BeamElements: { [key: number]: ODSSBeamElement };
  BeamSections: { [key: number]: ODSSBeamSection };
  RectangularBasePlates?: { [key: number]: ODSSRectangularBasePlate };
  RectangularSpliceFlange?: { [key: number]: ODSSRectangularSpliceFlange };
  DisplacementBoundaryConditions: {
    [key: string]: ODSSDisplacementBoundaryCondition;
  };
  ConstantElementLoad: any;
  NodalLoad: any;
  DeadWeightLoad: any;
} & Model;

export type ODSSNode = {
  Label: number;
  Coords: number[]; // [x, y, z]
  BoundaryConditions: string;
};

export type ODSSBeamElementType =
  | "Beam"
  | "Column"
  | "H-Bracing"
  | "V-Bracing"
  | "Undefined";

export type ODSSBeamElement = {
  Label: number;
  Nodes: number[]; // [start, end]
  BeamHinges: boolean[]; // [Fx1, Fy1, Fz1, Mx1, My1, Mz1, Fx2, Fy2, Fz2, Mx2, My2, Mz2]
  BeamHingesK: number[];
  Material: string;
  Section: number;
  SectionName: string;
  Zaxis: number[]; // [x, y, z]
  Orientation?: number;
  Type: ODSSBeamElementType;
  StartConnected: number[];
  Connected: number[];
  EndConnected: number[];
};

export type ODSSBeamSection = {
  Area: number;
  MomentOfInertia_x: number;
  MomentOfInertia_y: number;
  MomentOfInertia_z: number;
  PoissonRatio: number;
  ThermalExpansionCoeff: number;
  YoungModulus: number;
  Density: number;
  Width: number;
  Thickness: number;
  Label: number;
  Name: string;
  Material: string;
};

export type ODSSDisplacementBoundaryCondition = {
  Label: string;
  Components: number[];
  ImposedBCFlag: boolean[];
  Stiffness: number[];
  dirBC: number[];
  gap: number[];
  mu: number;
};

export type ODSSUserDefinedSection = {
  id: number;
  name: string;
  type: string;
  area: number;
  lx: number;
  ly: number;
  lz: number;
  width: number;
  height: number;
};

export type ODSSRectangularBasePlate = {
  id: number;
  element: number;
  plateThickness: number;
  plateLength: number;
  plateWidth: number;
  anchorBoltGrade: string;
  anchorBoltDiameter: number;
  boltsAlongLength: number;
  boltsAlongWidth: number;
  spacingAlongLengthFromCenter: number;
  spacingAlongLengthFromRowToRow: number;
  spacingAlongWidthFromCenter: number;
  spacingAlongWidthFromRowToRow: number;
  anchorBoltTension: number;
  anchorBoltShear: number;
  stiffenersThickness: number;
  stiffenersHeight: number;
  stiffenersAlongWeb: number;
  stiffenersAlongFlange: number;
};

export type ODSSRectangularSpliceFlange = {
  id: number;
  element: number;
  topPlateThickness: number;
  topPlateLegnth: number;
  topPlateWidth: number;
  bottomPlateThickness: number;
  bottomPlateLength: number;
  bottomPlateWidth: number;
  anchorBoltGrade: string;
  anchorBoltDiameter: number;
  spacingAlongLengthFromCenter: number;
  spacingAlongLengthFromRowToRow: number;
  spacingAlongWidthFromCenter: number;
  spacingAlongWidthFromRowToRow: number;
  acnhorBoltTension: number;
  acnhorBoltShear: number;
  stiffenersThickness: number;
  stiffenersHeight: number;
  stiffenersAlongWeb: number;
  stiffenersAlongFlange: number;
};
