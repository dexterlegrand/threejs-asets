import { Vector3 } from "three";
import {
  Direction2,
  Model,
  Named,
  Releases,
  SupportType,
  SimpleDirection,
  Orientation,
  DesignMethod,
  PipeSupportType,
  Direction3,
  ShearResistedType,
  TShearKeyDetails,
  SimpleDirection3,
} from "./types";
import { Material, Section, PipeProfile } from "../data/types";
import { TProcessLineSegment } from "../process/types";
import { TRoadType } from "../ui/types";

export type TOpenFrame = {
  startPos: Vector3;
  baseElevation: number;
  direction: Direction2;
  material?: Material;
  CSLibrary: string;
  frameColProfile: Section;
  frameBeamProfile: Section;
  frameTieProfile: Section;
  frames: TFrameOF[];
  columns: TColumnOF[];
  beams: TBeamOF[];
  cantilevers: TCantileverOF[];
  kneeBracings: TKneeBracingOF[];
  verticalBracings: TVerticalBracingOF[];
  horizontalBracings: THorizontalBracingOF[];
  staircases: TStaircaseOF[];
  accessories: TAccessoryGroupOF[];
  platforms: TPlatformOF[];
  cableTrays: TCableTrayOF[];
  circularBP: TCBasePlateOF[];
  rectangularBP: TRBasePlateOF[];
  circularSF: TCSpliceFlangeOF[];
  rectangularSF: TRSpliceFlangeOF[];
  beamToBeamConnections?: TBoldedConn[];
  beamToColumnConnections?: TBoldedConn[];
  hBracingConnections?: TBoldedConn[];
  vBracingConnections?: TBoldedConn[];
  kBracingConnections?: TBoldedConn[];
  pipes: TPipeOF[];
  truss?: TTrussOF[];
  runners?: TRunnerOF[];
  metalCladdings?: TMetalCladdingOF[];
  masonryCladdings?: TMasonryCladdingOF[];
  railings?: TRailingOF[];
  structuralNaturalFrequency?: number;
  palette?: TColorPallete;
  roads?: TRoad[];
  others?:TOther[];
} & Model;

export type TRoad = {
  id: number;
  orientation: number;
  name: string;
  width: number;
  type: TRoadType;
  thickness: number;
  segments: TProcessLineSegment[];
} & Named;

export type OpenFrameOtherType = "TREE"|"LAMP"|"FIRE_HOSE";

export type TOther = {
  id:number;
  position:Vector3;
  type:OpenFrameOtherType;
}&Named;

export type TColorPallete = {
  COLUMN?: string;
  BEAM?: string;
  "HORIZONTAL-BRACING"?: string;
  "VERTICAL-BRACING"?: string;
  "KNEE-BRACING"?: string;
  STAIRCASE?: string;
  CANTILEVER?: string;
  PLATFORM?: string;
};

export type TFrameOF = {
  id: number;
  model: string;
  height: number;
  width: number;
  chainage: number;
  columns: number;
  tiers: number;
  supportType: SupportType;
} & Named;

export type TElementType =
  | "COLUMN"
  | "BEAM"
  | "CANTILEVER"
  | "KNEE-BRACING"
  | "VERTICAL-BRACING"
  | "HORIZONTAL-BRACING"
  | "STAIRCASE"
  | "ROAD"
  | "DRAIN"
  | "TRANCH"
  | "CABLE_TRAY";

export type TBeamElement = {
  id: number;
  uiId?: number;
  frame: string;
  type: TElementType;
  startPos: Vector3;
  endPos: Vector3;
  profile: Section;
  orientation: Orientation;
  releases?: Releases;
  prev?: string;
  next?: string;
  startConnected: string[];
  connected: string[];
  endConnected: string[];
} & Named;

export type TColumnOF = {
  pos: Vector3;
  secondType: "GENERAL" | "ADDITIONAL" | "ACCESSORY";
} & TBeamElement;

export type TSecondBeamType =
  | "GENERAL"
  | "CtoC"
  | "CtoB"
  | "BtoB"
  | "ACCESSORY";

export type TBeamOF = {
  direction: SimpleDirection;
  secondType: TSecondBeamType;
} & TBeamElement;

export type TCantileverOF = {
  direction: Direction2;
} & TBeamElement;

export type TKneeBracingOF = {} & TBeamElement;

export type TSecondBracingType =
  | "Triangular Up"
  | "Triangular Down"
  | "X Bracing"
  | "Diagonal Up"
  | "Diagonal Down";

export type TVerticalBracingOF = {
  secondType: TSecondBracingType;
  isUp: boolean;
} & TBeamElement;

export type THorizontalBracingOF = {
  connectedTo: "BEAM" | "CANTILEVER" | "STAIRCASE";
} & TBeamElement;

export type TStaircaseOF = {
  flight: string;
  position: "L" | "R";
  direction: boolean;
  toX: boolean;
  supportType?: SupportType;
} & TBeamElement;

export type TPlatformOF = {
  id: number;
  from: string;
  to: string;
  width: number;
  thickness: number;
  distance: number;
} & Named;

export type TCableTrayOF = {
  id: number;
  from: Vector3;
  to: Vector3;
  direction?: SimpleDirection3;
  profile?: Section;
  type: TElementType;
  width: number;
  height: number;
  distance: number;
} & Named;

export type TBasePlateOF = {
  id: number;
  column: string;
  plateThickness: number;
  anchorBoltDiameter: number;
  stiffenerThickness: number;
  stiffenerHeight: number;
  grade: string;
  dMethod: DesignMethod;
  tension: number;
  shear: number;
} & Named;

export type TCBasePlateOF = {
  plateDiameter: number;
  boltBCD: number;
  boltNos: number;
  stiffenerNos: number;
} & TBasePlateOF;

export type TRBasePlateOF = {
  plateLength: number;
  plateWidth: number;
  countAlongLength: number;
  countAlongWidth: number;
  firstRowFromCenter_L: number;
  rowToRow_L: number;
  firstRowFromCenter_W: number;
  rowToRow_W: number;
  stiffenerAlongWeb: 1 | 2 | 3;
  stiffenerAlongFlange: 1 | 2 | 3;

  shearResistedBy?: ShearResistedType;
  shearKeyDetails?: TShearKeyDetails;
} & TBasePlateOF;

export type TSpliceFlangeUI = {
  elevation: number;
  bottomPlateThickness: number;
};

export type TCSpliceFlangeOF = {
  bottomPlateDiameter: number;
} & TSpliceFlangeUI &
  TCBasePlateOF;

export type TRSpliceFlangeOF = {
  bottomPlateLength: number;
  bottomPlateWidth: number;
} & TSpliceFlangeUI &
  TRBasePlateOF;

export type TAccessoryGroupOF = {
  id: number;
  startPos: Vector3;
  type: "TP" | "FP" | "CT";
  orientation: Orientation;
  distanceFromStart: number;
  accessorySpacing: number;
  elements: TAccessoryElementOF[];
} & Named;

type TAccessoryElementOF = {
  id: number;
  frame: string;
  height: number;
  position: Vector3;
  columnProfile: Section;
  columnOrientation: Orientation;
  beamProfile: Section;
  beamOrientation: Orientation;
  columns: string[];
  beams: string[];
} & Named;

export type TTPElementOF = {
  projectionLeft: number;
  projectionRight: number;
} & TAccessoryElementOF;

export type TFPElementOF = {
  h1: number;
  h2: number;
  h3: number;
  h4: number;
  projection: number;
} & TAccessoryElementOF;

export type TCTElementOF = {
  h1: number;
  h2: number;
  h3: number;
  h4: number;
  projectionLeft: number;
  projectionRight: number;
} & TAccessoryElementOF;

export type TPipeOF = {
  id: number;
  name: string;
  direction: Direction3;
  B1: string;
  elevationB1: number;
  color?: string;
  distanceFromB1: number;
  distanceFromLeftB1: number;
  B2: string;
  elevationB2: number;
  distanceFromB2: number;
  distanceFromLeftB2: number;
  startPos: Vector3;
  endPos: Vector3;
  diameter: number;
  thickness: number;
  profile?: PipeProfile;
  material: Material;
  succeeding: "END" | string;
  supports: TPipeSupportOF[];
};

export type TPipeSupportOF = {
  id: number;
  beam?: string;
  type: PipeSupportType | "Custom";
  KforSpring: number;
  distance: number;
  position: Vector3;
};

export type TTrussType =
  | "Kingpost"
  | "Simple Fink"
  | "Queen"
  | "Fink"
  | "Howe"
  | "Fan"
  | "Modified Queen"
  | "Double Fink"
  | "Doble Howe";

export type TTrussOF = {
  id: number;
  uiId: number;
  from: string;
  offset: number;
  type: TTrussType;
  slope: number;
  span: number;
  spacing: number;
  numbers: number;
  rafter: Section;
  tie: Section;
  vertical: Section;
  inclined: Section;
};

export type TRunnerOF = {
  id: number;
  uiId: number;
  globalSide: "SIDE" | "ROOF";
  from: string;
  offset: number;
  to: string;
  elementSide: "TOP" | "BOTTOM";
  spacing: number;
  numbers: number;
  profile: Section;
  orientation?: Orientation;
};

export type TMetalCladdingOF = {
  id: number;
  uiId: number;
  from: string;
  to: string;
  elevation: number;
  height: number;
};

export type TMasonryCladdingOF = {
  id: number;
  uiId: number;
  from: string;
  to: string;
  height: number;
};

export type TRailingOF = {
  id: number;
  name: string;
  element: string;
  totalHeight: number; // meters
  middleHeight: number; // meters
  distFromStartNode: number; // meters
  length: number; // meters
  noOfSpacings: number;
  lib: string;
  topRail: Section;
  middleRail?: Section;
  verticalRail: Section;
};

export type TBoldedConn = {
  id: number;
  selected?: boolean;
  model: string;
  name: string;
  parent?: string;
  position: "START" | "END";
  grossAreaOfMember: number;
  thiknessOfGusset: number;
  thiknessOfWeb: number;
  thiknessOfFlange: number;
  widthOfFlange: number;
  overalDepthOfMember: number;
  yieldStressOfMember: number;
  maxTension: number;
  lengthOfPlate: number;
  widthOfPlate: number;
  boltClassSize: string;
  boltDiameter: number;
  noOfBoltsAlongLength: number;
  noOfBoltsAlongWidth: number;
  boltSpacingLengthRow: number;
  boltSpacingRowToRow: number;
  boltCapacityTension: number;
  boltCapacityShear: number;
  maxAxialCapacity?: number;
  maxShearCapacity?: number;
  maxBendCapacity?: number;
};
