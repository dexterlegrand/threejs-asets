import {
  BracingType,
  DesignMethod,
  Direction2,
  Orientation,
  Releases,
  SupportType,
  UserDirection,
  LoadingAsPerCode,
  TerrainCategory,
  LC_LibType,
  LoadType,
  Named,
  Direction3,
  PipeSupportType,
  ShearResistedType,
  TShearKeyDetails,
  SimpleDirection3,
} from "../main/types";
import { Material, Section, PipeProfile, DataState } from "../data/types";
import { Vector3 } from "three";
import {
  TCategory,
  TSiteClass,
  TFlangeCheck,
  TPipeMTO,
  TAccessoryMTO,
} from "../main/pipeTypes";
import { TBoldedConn, TTrussType } from "../main/openFrameTypes";
import {
  Node,
  Member,
  BeamNode,
  BeamElement,
} from "../../components/3d-models/designCodeAndParametersOF";

export enum UIActionTypes {
  CREATE_UI = "CREATE_UI",
  REMOVE_UI = "REMOVE_UI",
  CHANGE_UI = "CHANGE_UI",
  SELECT_UI = "SELECT_UI",
  RENAME_UI = "RENAME_UI",
  LOAD_UI = "LOAD_UI",
  CONFIRM = "CONFIRM",
  CHANGE_OF_UI = "CHANGE_OF_UI",
  CHANGE_OF_PR = "CHANGE_OF_PR",
  ADD_EVENT = "ADD_EVENT",
  CHANGE_EVENT = "CHANGE_EVENT",
  REMOVE_EVENT = "REMOVE_EVENT",
  CREATE_XCH_OF = "CREATE_XCH_OF",
  SECOND_CONFIRM = "SECOND_CONFIRM",
  CHANGE_REQUEST_PROGRESS = "CHANGE_REQUEST_PROGRESS",
  CHANGE_PROJECT_REQUEST_PROGRESS = "CHANGE_PROJECT_REQUEST_PROGRESS",
  CHANGE_MODEL_ANALYSIS_UI = "CHANGE_MODEL_ANALYSIS_UI",
}

export type TDropDownItem = {
  id: number;
  name: string;
  children?: TDropDownItem[];
};

export type UIState = {
  project: string | undefined;
  projectUIs: ProjectUI[];
  requests?: {
    pipes?: boolean;
    pipingCaps?: boolean;
    pipingCollets?: boolean;
    pipingReducers?: boolean;
    pipingReturns?: boolean;
    pipingElbows?: boolean;
    pipingTees?: boolean;
    material?: boolean;
    profiles?: boolean;
    CII?: boolean;
    odssConverting?: boolean;
  };
};

export type ProjectUI = {
  project: string;
  events?: TEvent[];
  confirm?: TConfirm;
  confirm_s?: TConfirm; // TODO: create array of confirmations, like for events
  pipeRackUI: PipeRackUI; // TODO: create PR UI types and bind it to redux
  openFrameUI: OpenFrameUI;

  availableData?: DataState;
  designCodeAndParametersUI: DesignCodeAndParametersUI;
  analysisUI: AnalysisUI;
  requests?: {
    natfreq?: boolean;
    reports?: boolean;
    seismic?: boolean;
    weight?: boolean;
    optimizer?: boolean;
    loadsToStructure?: boolean;
    hanger?: boolean;
    CII?: boolean;
    Staad?: boolean;
    odssConverting?: boolean;
    combining?: boolean;
    profilePressure?: boolean;
  };
};

export type TEvent = {
  id: number;
  type: "danger" | "none" | "success" | "warning";
  message: string;
  isNew: boolean;
};

export type TConfirm = {
  message: string;
  onConfirm: () => any;
  onCancel?: () => any;
};

export type PipeRackUI = {
  portals: PFPortalsUI;
};

export type PFPortalsUI = {
  geometry: PRGeometryUI;
  parameters: PRParameterUI[];
};

export type PRGeometryUI = {
  noOfTiers: number;
  noOfBays: number;
  baseElevation: number;
  length: number;
  topTierElevation: number;
  width: number;
  direction: Direction2;
  material?: Material;
  supportType: SupportType;
  library?: string;
  colProfile?: Section;
  beamProfile?: Section;
  tieProfile?: Section;
  x: number;
  y: number;
  z: number;
};

export type PRParameterUI = {};

export type OpenFrameUI = {
  frames: OFFramesUI;
  roads: OFRoadUI;
  elementsElevations: OFElementsElevationsUI;
  additionalBeams: OFAdditionalBeamsUI;
  accessories: OFAccessoryUI[];
  members: OFMembersUI;
  platforms: OFPlatformUI[];
  cableTrays: OFCableTrayUI[];
  ladders: OFLaddersUI;
  basePlates: OFBasePlatesUI;
  spliceFlanges: OFSpliceFlangesUI;
  pipes: {
    items: OFPipeUI[];
    supports: OFPipeSupportUI[];
  };
  truss: OFTrussUI[];
  runners: OFRunnerUI[];
  metalCladdings: OFMetalCladdingUI[];
  masonryCladdings: OFMasonryCladdingUI[];
  beamToBeamConnections?: TBoldedConn[];
  beamToColumnConnections?: TBoldedConn[];
  hBracingConnections?: TBoldedConn[];
  vBracingConnections?: TBoldedConn[];
  kBracingConnections?: TBoldedConn[];
  loadingsUI: LoadingsUI;
};

export type OFTrussUI = {
  model?: string;
  from?: string;
  offset: number;
  type?: TTrussType;
  slope: number;
  span: number;
  spacing: number;
  numbers: number;
  rafterLib?: string;
  rafterProfile?: Section;
  tieLib?: string;
  tieProfile?: Section;
  verticalLib?: string;
  verticalProfile?: Section;
  inclinedLib?: string;
  inclinedProfile?: Section;
} & UIArrayElement;

export type OFRunnerUI = {
  model?: string;
  globalSide?: "SIDE" | "ROOF";
  from?: string;
  offset: number;
  to?: string;
  elementSide?: "TOP" | "BOTTOM";
  spacing: number;
  numbers: number;
  lib?: string;
  profile?: Section;
  orientation?: Orientation;
} & UIArrayElement;

export type OFMetalCladdingUI = {
  model?: string;
  from?: string;
  to?: string;
  elevation: number;
  height: number;
} & UIArrayElement;

export type OFMasonryCladdingUI = {
  model?: string;
  from?: string;
  to?: string;
  height: number;
} & UIArrayElement;

export type OFPipeUI = {
  name: string;
  model?: string;
  direction: Direction3;
  B1?: string;
  elevationB1: number;
  distanceFromB1: number;
  distanceFromLeftB1: number;
  B2?: string;
  elevationB2: number;
  distanceFromB2: number;
  distanceFromLeftB2: number;
  lib?: string;
  profile?: PipeProfile;
  diameter: number;
  thickness: number;
  material?: Material;
  succeeding: "END" | string;
} & UIArrayElement;

export type OFPipeSupportUI = {
  model?: string;
  pipe?: string;
  type: PipeSupportType | "Custom";
  KforSpring: number;
  beam?: string;
  distance: number;
  position?: Vector3;
} & UIArrayElement;

export type LoadingsUI = {
  deadLoadUI: DeadLoadsUI;
  liveLoadUI: LiveLoadsUI;
  tempLoadUI: TempLoadUI;
  pipingLoadsUI: PipingLoadsUI;
  equipmentLoadUI: EquipmentLoadUI[];
  windLoadUI: WindLoadUI;
  seismicLoadsUI: SeismicLoadsUI;
  loadCombinations: LoadCombinationsUI;
};

export type DeadLoadsUI = {
  SWF: number;
  DLI: number;
  SDLI: number;
  FPd: number;
  FPt: number;
  FPh: number;
  FPto: "All elements" | "Only Columns and Beams";
  FPdl: number;
  accessoriesTab: "TP" | "FP" | "CT";
  accessoriesTPLoads: AccessoriesTPLoad[];
  accessoriesFPLoads: AccessoriesFPLoad[];
  accessoriesCTLoads: AccessoriesCTLoad[];
  loads: AdditionalLoadUI[];
};

export type LiveLoadsUI = {
  intensity: number;
  stairIntensity: number;
  loads: AdditionalLoadUI[];
};

export type TempLoadUI = {
  minTemp: number;
  maxTemp: number;
};

export type PipingLoadsUI = {
  directLoads: DirectLoadUI[];
  blanketLoads: BlanketLoadUI[];
};

export type BlanketLoadUI = {
  area: string;
  model?: string;
  from?: string;
  to?: string;
  width: number;
  distance: number;
  intensity: number;
  alongPercent: number;
  acrossPercent: number;
} & UIArrayElement;

export type DirectLoadUI = {
  lineNo: string;

  thermalAnchor_Fx: number;
  thermalAnchor_Fy: number;
  thermalAnchor_Fz: number;
  thermalAnchor_Mx: number;
  thermalAnchor_My: number;
  thermalAnchor_Mz: number;

  thermalFriction_Fx: number;
  thermalFriction_Fy: number;
  thermalFriction_Fz: number;

  windLoadX_Fx: number;
  windLoadX_Fy: number;
  windLoadX_Fz: number;

  windLoadZ_Fx: number;
  windLoadZ_Fy: number;
  windLoadZ_Fz: number;

  surgeLoad_Fx: number;
  surgeLoad_Fy: number;
  surgeLoad_Fz: number;

  snowLoad: number;
} & EquipmentLoadUI;

export type EquipmentLoadUI = {
  model?: string;
  element?: string;
  distance: number;

  empty_Fy: number;

  test_Fx: number;
  test_Fy: number;
  test_Fz: number;
  test_Mx: number;
  test_My: number;
  test_Mz: number;

  operating_Fx: number;
  operating_Fy: number;
  operating_Fz: number;
  operating_Mx: number;
  operating_My: number;
  operating_Mz: number;
} & UIArrayElement;

export type WindLoadUI = {
  windLoadingAsPerCode: LoadingAsPerCode | "Manual";
  isWindCode: {
    windCode: string;
    basicWindSpeed: number;
    riskCoefficient: number;
    terrainCategory: TerrainCategory;
    topographicFactor: number;
    impFactorCyclonic: number;
    locationOfStructure: string;
    windDirectionalityFactor: number;
    areaAveragingFactor: number;
    combinationFactor: number;
    datumElevation?: number;
  };
  usWindCode: {
    windCode: string;
    basicWindSpeed: number;
    exposure: string;
    windDirectionalityFactor: number;
    topographyDetails: number;
    importanceFactor: number;
    flexibleStructure: "Yes" | "No" | string;
    structuralCategory: string;
    crossSectionShape: string;
    structureType: string;
    datumElevation?: number;
  };
  euWindCode: {};
  manualWindCode: {
    id: number;
    selected: boolean;
    height: number;
    pressure: number;
  }[];
  tab: "NF" | "AL" | "PP";
  loads: AdditionalLoadUI[];
  profilePressure?: TProfilePressure[];
};

export type TProfilePressure = {
  id: number;
  height: number;
  pressure: number;
};

export type SeismicLoadsUI = {
  seismicLoadingAsPerCode: LoadingAsPerCode;
  seismicAnalysisMethod: "Equivalent Static" | "Response Spectrum";
  modalCombinationMethod: "ABS-SUM" | "SRSS" | "CQC";
  spectralMode: "Manual" | "Code";
  spectralsPoints: SpectralPointUI[];
  isSeismicCode: {
    zoneFactor: string;
    dampingRatio: number;
    responseReductionFactor: number;
    soilType: string;
    importanceFactor: number;
    soilFoundationCondition: string;
    timePeriod: string;
  };
  usSeismicCode: {
    T_L: number;
    S_S: number;
    S_1: number;
    category: TCategory;
    siteClass: TSiteClass;
    importanceFactor: number;
    R: number;
    dampingRatio: number;
    structureHeight: number;
    structureType: string;
    timePeriod: number;
  };
  seismicLoads: SeismicLoadUI[];
};

export type SpectralPointUI = {
  timePeriod: number;
  acceleration: number;
} & UIArrayElement;

export type SeismicLoadUI = {
  id: number;
  model: string;
  level: number;
  node: number;
  weight: number;
};

export type LoadCombinationsUI = {
  LC_lib: LC_LibType;
  loadCombinations: LoadCombinationUI[];
};

export type AdditionalLoadUI = {
  model?: string;
  element?: string;
  type: LoadType;
  distance: number;
  lengthOfUDL: number;
  Fx: number;
  Fy: number;
  Fz: number;
  Mx: number;
  My: number;
  Mz: number;
} & UIArrayElement;

export type AccessoriesLoad = {
  model?: string;
  group?: string;
  top: number;
} & UIArrayElement;

export type AccessoriesTPLoad = AccessoriesLoad;

export type AccessoriesFPLoad = {
  l1: number;
  l2: number;
  l3: number;
  l4: number;
} & AccessoriesLoad;

export type AccessoriesCTLoad = AccessoriesFPLoad;

export type LoadCombinationUI = {
  CONDITION?: "Erection / shutdown" | "Hydrotest" | "Operating";
  LC_No: number;
  LC_Type: string | undefined;
  DL?: number | string;
  LL?: number | string;
  TL?: number | string;
  PE?: number | string;
  PT?: number | string;
  PO?: number | string;
  TA?: number | string;
  TF?: number | string;
  PS?: number | string;
  PI?: number | string;
  EE?: number | string;
  ET?: number | string;
  EO?: number | string;
  WLpX?: number | string;
  WLpXpZ?: number | string;
  WLpZ?: number | string;
  WLpZmX?: number | string;
  WLmX?: number | string;
  WLmXmZ?: number | string;
  WLmZ?: number | string;
  WLmZpX?: number | string;
  SX?: number | string;
  SZ?: number | string;
  SY?: number | string;
} & UIArrayElement;

export type OFFramesUI = {
  x: number;
  y: number;
  z: number;
  noOfTiers: number;
  noOfColumns: number;
  frameWidth: number;
  frameHeight: number;
  pedestalHeight: number;
  noOfSimilarFrames: number;
  spacingOfFrames: number;
  directionToReplicate: Direction2;
  supportType: SupportType;
  library?: string;
  frameColProfile?: Section;
  frameBeamProfile?: Section;
  frameTieProfile?: Section;
  material?: Material;
  parameters: OFFramesParametersUI[];
  relocations: OFFramesColumnRelocationUI[];
};

export type UIArrayElement = {
  id: number; // readonly, invisible
  selected: boolean;
};

export type UIBeamElement = {
  library?: string;
  profile?: Section;
};

export type OFFramesParametersUI = {
  model: string; // readonly
  frame: string; // readonly
  chainage: number;
  width: number;
  noOfColumns: number;
  totalHeight: number;
  noOfTiers: number;
  supportType: SupportType;
} & UIArrayElement;

export type OFFramesColumnRelocationUI = {
  model?: string;
  frame?: string;
  column?: string;
  distance: number;
} & UIArrayElement;

export type OFElementsElevationsUI = {
  elements: ("Beam" | "Cantilever")[];
};

export type OFAdditionalBeamsUI = {
  cantilever: OFCantileverUI[];
  columnToColumn: OFColumnToColumnUI[];
  columnToBeam: OFColumnToBeamUI[];
  beamToBeam: OFBeamToBeamUI[];
  columns: OFColumnsUI[];
  kneeBracings: OFKneeBracingsUI[];
  verticalBracings: OFVerticalBracingsUI[];
  planBracings: OFPlanBracingsUI[];
  staircases: OFStaircaseUI[];
};

export type OFCantileverUI = {
  model?: string;
  column?: string;
  direction?: Direction2;
  elevation: number;
  length: number;
} & UIArrayElement &
  UIBeamElement;

export type OFColumnToColumnUI = {
  model?: string;
  column?: string;
  direction?: Direction2;
  elevation: number;
} & UIArrayElement &
  UIBeamElement;

export type OFColumnToBeamUI = {
  model?: string;
  column?: string;
  beam?: string;
} & UIArrayElement &
  UIBeamElement;

export type OFBeamToBeamUI = {
  model?: string;
  from?: string;
  to?: string;
  distance: number;
} & UIArrayElement &
  UIBeamElement;

export type OFColumnsUI = {
  model?: string;
  lowerBeam?: string;
  distance: number;
  upperBeam?: string;
  height: number;
  orientation: Orientation;
} & UIArrayElement &
  UIBeamElement;

export type OFKneeBracingsUI = {
  model?: string;
  beam?: string;
  column?: string;
  fromBeamJunction: number;
  fromColumnJunction: number;
} & UIArrayElement &
  UIBeamElement;

export type OFVerticalBracingsUI = {
  model?: string;
  type?: BracingType;
  fromColumn?: string;
  fromBeam?: string;
  fromElevation?: number;
  toColumn?: string;
  toBeam?: string;
  toElevation?: number;
} & UIArrayElement &
  UIBeamElement;

export type OFPlanBracingsUI = {
  model?: string;
  fromBeam?: string;
  fromBeamDFS: number;
  toBeam?: string;
  toBeamDFS: number;
} & UIArrayElement &
  UIBeamElement;

export type OFStaircaseUI = {
  name: string;
  model?: string;
  from?: "Ground" | string;
  fromDetails: OFFromDetailsUI;
  to?: string;
  distance: number;
  width: number;
  orientation: Orientation;
  rugs: number;
  rugWidth: number;
  rugThickness: number;
} & UIArrayElement &
  UIBeamElement;

export type OFFromDetailsUI = {
  vertical: number;
  horizontal: number;
  supportType?: SupportType;
};

export type OFAccessoryUI = {
  model?: string;
  beam?: string;
  distance: number;
  spacing: number;
  count: number;
  type: "TP" | "FP" | "CT";
  orientation: Orientation;
} & UIArrayElement &
  Named;

type OFAccessoryElementUI = {
  model: string;
  group: string;
  height: number;
  columnLib: string;
  columnProfile: Section;
  columnOrientation: Orientation;
  beamLib: string;
  beamProfile: Section;
  beamOrientation: Orientation;
} & UIArrayElement &
  Named;

export type OFTPElementUI = {
  projectionLeft: number;
  projectionRight: number;
} & OFAccessoryElementUI;

export type OFFPElementUI = {
  h1: number;
  h2: number;
  h3: number;
  h4: number;
  projection: number;
} & OFAccessoryElementUI;

export type OFCTElementUI = {
  h1: number;
  h2: number;
  h3: number;
  h4: number;
  projectionLeft: number;
  projectionRight: number;
} & OFAccessoryElementUI;

export type OFMembersUI = {
  beams: OFBeamUI[];
  columns: OFColumnUI[];
  releases: OFReleasesUI[];
};

export type OFBeamUI = {
  model?: string;
  element?: string;
  orientation: Orientation;
} & UIArrayElement &
  UIBeamElement;

export type OFColumnUI = {
  model?: string;
  element?: string;
  orientation: Orientation;
} & UIArrayElement &
  UIBeamElement;

export type OFReleasesUI = {
  model?: string;
  element?: string;
} & UIArrayElement &
  Releases;

export type OFPlatformUI = {
  name: string;
  model?: string;
  from?: string;
  to?: string;
  width: number;
  distanceFromLeft: number;
  thickness: number;
} & UIArrayElement;

export type OFCableTrayUI = {
  id: number;
  name: string;
  from?: Vector3;
  to?: Vector3;
  width: number;
  profile?: Section;
  distance: number;
  height: number;
  direction?: SimpleDirection3;
  model?: string;
} & UIArrayElement;

export type TRoadType = "ROAD" | "DRAIN" | "TRANCH";

export type OFRoadUI = {
  name: string;
  model?: string;
  from?: string;
  to?: string;
  width: number;
  type: TRoadType;
  thickness: number;
} & UIArrayElement;

export type OFLaddersUI = {
  params: {
    library?: string;
    profile?: Section;
    spacingStringer: number;
    diameterRung: number;
    spacingRung: number;
    widthCageHBars: number;
    thicknessCageHBars: number;
    spacingCageHBars: number;
    diameterCageHBars: number;
    widthCageVBars: number;
    thicknessCageVBars: number;
    nosCageVBars: number;
    cageHeadRoom: number;
  };
  ladders: ({
    model?: string;
    platform?: string;
    onFace?: UserDirection;
    distanceFromLeft: number;
    fromElevation: number;
  } & UIArrayElement &
    UIBeamElement)[];
};

export type OFBasePlatesUI = {
  concreteGrade: string;
  circular: OFCBasePlateUI[];
  rectangular: OFRBasePlateUI[];
};

export type OFBasePlateUI = {
  model?: string;
  column?: string;
  dMethod: DesignMethod;
  plateThickness: number;
  grade: string;
  anchorBoltDiameter: number;
  tension: number;
  shear: number;
  stiffenerThickness: number;
  stiffenerHeight: number;
} & UIArrayElement;

export type OFCBasePlateUI = {
  plateDiameter: number;
  boltBCD: number;
  boltNos: number;
  stiffenerNos: number;
} & OFBasePlateUI;

export type OFRBasePlateUI = {
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
} & OFBasePlateUI;

export type OFSpliceFlangeUI = {
  elevation: number;
  bottomPlateThickness: number;
};

export type OFCSpliceFlangeUI = {
  bottomPlateDiameter: number;
} & OFSpliceFlangeUI &
  OFCBasePlateUI;

export type OFRSpliceFlangeUI = {
  bottomPlateLength: number;
  bottomPlateWidth: number;
} & OFSpliceFlangeUI &
  OFRBasePlateUI;

export type OFSpliceFlangesUI = {
  circular: OFCSpliceFlangeUI[];
  rectangular: OFRSpliceFlangeUI[];
};

export type DesignCode =
  | "IS 800 : 2007 LSD"
  | "AISC LRFD"
  | "Eurocode 3 [EN 1993-1-1:2005]";

export type DesignCodeAndParametersUI = {
  designCode: DesignCode;
  indianDesignCode: IndianDesignCodeUI;
  americanDesignCode: AmericanDesignCodeUI;
};

export type AvailableSectionListUI = {
  library?: string;
  profiles: string[];
} & UIArrayElement;

type GenericDesignCodeUI = {
  deflectionRatio: number;
  klrMaxColumns: number;
  klrMaxBracings: number;
  klrMaxBeams: number;
  minStressRation?: number;
  stressRation: number;
  deflectionLengths?: TDeflectionLengthOF[];
};

export type IndianDesignCodeUI = {
  cmx: number;
  cmy: number;
  cmz: number;
  effectiveLengths: IndianEffectiveLengthUI[];
} & GenericDesignCodeUI;

export type AmericanDesignCodeUI = {
  cb: number;
  effectiveLengths: AmericanEffectiveLengthUI[];
} & GenericDesignCodeUI;

export type IndianEffectiveLengthUI = {
  id: number;
  selected: boolean;
  model?: string;
  element?: string;
  elementNo?: number;
  Ky: number;
  Kz: number;
  Ly: number;
  Lz: number;
};

export type AmericanEffectiveLengthUI = {
  UNLB: number;
  UNLT: number;
} & IndianEffectiveLengthUI;

export type TDeflectionLengthOF = {
  id: number;
  selected: boolean;
  model?: string;
  element?: string;
  dl: number;
};

export type AnalysisUI = {
  [key: string]: ModelAnalysisUI;
};

export type ModelAnalysisUI = {
  reactionSupports: ReactionSupportUI[];
  memberEndForces: MemberEndForceUI[];
  memberStressChecks: MemberStressCheckUI[];
  nodalStressChecks?: NodalStressCheckUI[];
  thicknessChecks?: PipeThicknessCheckUI[];
  flangeChecks?: TFlangeCheck[];
  deflectionChecks: DeflectionCheckUI[];
  nodeDisplacements: NodeDisplacementUI[];
  nodes: { [key: number]: Node };
  beamNodes: { [key: number]: BeamNode };
  beamElements: { [key: number]: BeamElement };
  members: Member[];
  weightSummary: any;
  pipeMTO?: TPipeMTO[];
  accessoryMTO?: TAccessoryMTO[];
};

export type MemberEndForceUI = {
  model: string;
  elementNumber: number;
  elementName?: string;
  LCNumber: string;
  LCType: string;

  fx_1: number;
  fy_1: number;
  fz_1: number;
  mx_1: number;
  my_1: number;
  mz_1: number;

  fx_2: number;
  fy_2: number;
  fz_2: number;
  mx_2: number;
  my_2: number;
  mz_2: number;
};

export type DeflectionCheckUI = {
  model: string;
  elementName: string;
  elementNumber: number;
  LCNumber: string;
  LCType?: string;
  length: number;
  actual: number;
  allowable: number;
  utilizationRatio: number;
  result: "pass" | "fail";
};

export type MemberStressCheckUI = {
  model: string;
  elementName: string;
  elementNumber: number;
  LCNumber: string;
  LCType?: string; //new adition for displaying the stress check based on the analysis result
  actual: number;
  allowable: number;
  result: "pass" | "fail";
};

export type NodalStressCheckUI = {
  model: string;
  elementNumber: number;
  nodeNumber: number;
  LCNumber: string;
  LCType?: string;
  flexibilityFactor: number;
  outOfPlaneSIF: number;
  inPlaneSIF: number;
  actualMPa: number;
  allowableMPa: number;
  ratio: number;
  result: string;
};

export type PipeThicknessCheckUI = {
  model: string;
  elementNumber: string;
  elementName?: string;
  LCNumber: string;
  LCType?: string;
  result: string;
  x1: number;
  y1: number;
  z1: number;
  x2: number;
  y2: number;
  z2: number;
  od: number;
  wt: number;
  requiredThickness: number;
  providedThickness: number;
  utilizationRatio: number;
};

export type NodeDisplacementUI = {
  model: string;
  nodeNumber: number;
  LCNumber: string;
  LCType: string;

  rx: number;
  ry: number;
  rz: number;

  du: number; // dx
  dv: number; // dy
  dw: number; // dz

  tResultant: number;
  rResultant: number;
};

export type ReactionSupportUI = {
  model: string;
  nodeNumber: number;
  LCNumber: string;
  LCType?: string;

  Fx: number;
  Fy: number;
  Fz: number;
  Mx: number;
  My: number;
  Mz: number;
  value: number;
};
