import {
  Direction2,
  SimpleDirection,
  SupportType,
  BracingType,
  Direction3,
  UserDirection,
  PipeSupportType,
  AccessoryType,
  Orientation,
  PlatformPosition,
  DesignMethod,
  LoadType,
  TerrainCategory,
  LoadingAsPerCode,
  LC_LibType,
  LoadCombination,
  LC_Condition,
  IndianDesignCode,
  AmericanDesignCode,
  LadderParams,
  Loadings,
  MainState,
  PipeConnectorType,
  TSettings,
  TPipeDesignCode,
  TFlangeType,
  TValveType,
  TValveActuatorType,
  TValveControlType,
  TReducerType,
  FreePipe,
  FreeCable,
} from "./types";
import { Scene } from "three";
import { IndianLCsJSON } from "./loadCombinationLists";
import { CombinationType, ShapeType } from "../data/types";
import { TPipeLoadings, TSiteClass } from "./pipeTypes";
import { API_ROOT } from "../../pages/utils/agent";
import { TTrussType } from "./openFrameTypes";

export const baseUrl = `${API_ROOT}/`;

export const columnColorRGB = [0, 204, 0]; // rgb(0, 204, 0)
export const beamColorRGB = [212, 175, 55]; // rgb(255, 255, 0) change to rgb(212, 175, 55)
export const vBracingColorRGB = [0, 255, 255]; // rgb(0, 255, 255)
export const hBracingColorRGB = [0, 0, 255]; // rgb(0, 0, 255)
export const pipeColorRGB = [0, 112, 192]; // rgb(0, 112, 192)
export const supColorRGB = [255, 0, 0]; // rgb(255, 0, 0)
export const platformColorRGB = [153, 102, 0]; // rgb(153, 102, 0)
export const ladderColorRGB = [];
export const pedestalColor = [150, 150, 150];

// for stressCheck
export const gray = [128, 128, 128];
export const green = [107, 245, 50];
export const blue = [20, 20, 245];
export const yellow = [243, 245, 37];
export const red = [245, 28, 24];

export const deg30InRad = Math.PI / 6;
export const deg45InRad = Math.PI / 4;
export const deg90InRad = Math.PI / 2;
export const deg180InRad = Math.PI;
export const deg360InRad = Math.PI * 2;

export const rad = Math.PI / 180;
export const deg = 180 / Math.PI;

export const simpleDirections: SimpleDirection[] = ["X", "Z"];

export const directions2: Direction2[] = ["+X", "-X", "+Z", "-Z"];

export const directions3: Direction3[] = [...directions2, "+Y", "-Y"];

export const userDirections: UserDirection[] = [
  "Front",
  "Left",
  "Back",
  "Right",
];

export const supportTypes: SupportType[] = ["Pin", "Fix"];

export const initialPipe: FreePipe = {
  id: 0,
  line: 0,
  pipe: "",
  elevation: 0,
  length: 0,
  preceding: "START",
  hDir: 0,
  vDir: 0,
  x1: 0,
  y1: 0,
  z1: 0,
  x2: 0,
  y2: 0,
  z2: 0,
  params: { millTolerance: 12.5, longWeldType: "S", corrosionAllowance: 0 },
};

export const initialCable: FreeCable = {
  id: 0,
  line: 0,
  cable: "",
  elevation: 0,
  length: 0,
  preceding: "START",
  hDir: 0,
  vDir: 0,
  x1: 0,
  y1: 0,
  z1: 0,
  x2: 0,
  y2: 0,
  z2: 0,
  params: {
    millTolerance: 12.5,
    longWeldType: "S",
    corrosionAllowance: 50,
    thickness: 9.27,
    nps: "10",
    lib: "American",
    od: 273,
  },
};

export const pipeSupportTypes: PipeSupportType[] = [
  "Anchor",
  "Sliding",
  "Spring",
  "Custom",
  "Custom+",
  "Custom-",
  "Slave Node",
];

export const connectorTypes: PipeConnectorType[] = [
  "Elbow",
  "Return",
  "Reducer",
  "Cap",
  "Tee",
  // "Bend",
  // "Rigid joint",
  // "Expansion joint",
  // "Reducer",
  // "Stress intensity factor (Sif) & Tee",
];

export const flangeTypes: TFlangeType[] = [
  "Blind",
  "Lapped",
  // "Ring Joint Facing",
  "Slip On",
  "Socket Welding",
  "Threaded",
  "Welding Neck",
];

export const bracingTypes: BracingType[] = [
  "Triangular Up",
  "Triangular Down",
  "X Bracing",
  "Diagonal Up",
  "Diagonal Down",
];

export const accessoryTypes: AccessoryType[] = [
  "T-Post",
  "F-Post",
  "Christmas Tree",
];

export const orientations: Orientation[] = [0, 45, 90, 135, 180, 225, 270, 315];

export const platformPositions: PlatformPosition[] = [
  "LEFT IN",
  "LEFT OUT",
  "MID",
  "RIGHT IN",
  "RIGHT OUT",
];

export const shapeTypes: ShapeType[] = ["I", "C", "O"];

export const combinationTypes: CombinationType[] = [
  "B/B Depth",
  "B/B Width",
  "F/F Depth",
  "F/F Width",
  "Star",
];

export const designMethods: DesignMethod[] = ["Method 1", "Method 2"];

export const boltCounts = [2, 4, 6, 8];

export const stiffenerCounts = [1, 2, 3];

export const loadTypes: LoadType[] = ["Point Load", "UDL"];

export const loadingAsPerCodes: LoadingAsPerCode[] = [
  "IS Code",
  "US Code",
  "EU Code",
];

export const terrainCategories: TerrainCategory[] = [
  "Category 1",
  "Category 2",
  "Category 3",
  "Category 4",
];

export const LC_types: string[] = ["Ultimate", "Serviceability"];

export const zoneFactors = ["II", "III", "IV", "V"];

export const zoneFactorData = {
  II: 0.1,
  III: 0.16,
  IV: 0.24,
  V: 0.35,
};

export const dampingRatios = [0, 2, 5, 7, 10, 15, 20, 25, 30];

export const dampingRatioData = {
  0: 3.2,
  2: 1.4,
  5: 1,
  7: 0.9,
  10: 0.8,
  15: 0.7,
  20: 0.6,
  25: 0.55,
  30: 0.5,
};

export const soilFoundationConditions: string[] = [
  "Fixed Base",
  "Raft on Soil",
  "Pile Foundation",
];

export const soilTypes = ["Hard soil", "Medium soil", "Soft soil"];

export const soilTypeData = {
  "Hard soil": 1,
  "Medium soil": 2,
  "Soft soil": 3,
};

export const siteClassesA: {
  [K in TSiteClass]: { [key in number]: number };
} = {
  A: { 0.25: 0.8, 0.5: 0.8, 0.75: 0.8, 1: 0.8, 1.25: 0.8 },
  B: { 0.25: 1, 0.5: 1, 0.75: 1, 1: 1, 1.25: 1 },
  C: { 0.25: 1.2, 0.5: 1.2, 0.75: 1.1, 1: 1, 1.25: 1 },
  D: { 0.25: 1.6, 0.5: 1.4, 0.75: 1.2, 1: 1.1, 1.25: 1 },
  E: { 0.25: 2.5, 0.5: 1.7, 0.75: 1.2, 1: 0.9, 1.25: 0.9 },
  F: {},
};

export const siteClasses1: {
  [K in TSiteClass]: { [key in number]: number };
} = {
  A: { 0.1: 0.8, 0.2: 0.8, 0.3: 0.8, 0.4: 0.8, 0.5: 0.8 },
  B: { 0.1: 1, 0.2: 1, 0.3: 1, 0.4: 1, 0.5: 1 },
  C: { 0.1: 1.7, 0.2: 1.6, 0.3: 1.5, 0.4: 1.4, 0.5: 1.3 },
  D: { 0.1: 2.4, 0.2: 2, 0.3: 1.8, 0.4: 1.6, 0.5: 1.5 },
  E: { 0.1: 3.5, 0.2: 3.2, 0.3: 2.8, 0.4: 2.4, 0.5: 2.4 },
  F: {},
};

export const windCodesUS: string[] = ["ASCE 7-16", "ASCE 7-10", "ASCE 7-98"];
export const windCodesIS: string[] = ["IS875(Part3): 2015"];

export const exposures: string[] = ["B", "C", "D"];

export const LC_Libs: LC_LibType[] = ["CUSTOM", "IS", "US", "EU"];

export const LC_Conditions: LC_Condition[] = [
  "Erection / shutdown",
  "Hydrotest",
  "Operating",
];

export const LC_IS: LoadCombination[] = IndianLCsJSON as LoadCombination[];

export const LC_US: LoadCombination[] = IndianLCsJSON as LoadCombination[];

export const LC_EU: LoadCombination[] = IndianLCsJSON as LoadCombination[];

export const LCTypesList: string[] = ["Primary", "Ultimate", "Serviceability"];

export const LCLoadTypesList: string[] = [
  "DL",
  "LL",
  "TL",
  "PE",
  "PT",
  "PO",
  "TA",
  "TF",
  "EE",
  "ET",
  "EO",
  "WL +X",
  "WL +X,-Z",
  "WL -Z",
  "WL -Z,-X",
  "WL -X",
  "WL -X,+Z",
  "WL +Z",
  "WL +Z,+X",
  "SX",
  "SZ",
  "SY",
];

export const concreteGrade: string[] = ["M20", "M30", "M45", "M50", "M70"];

export const trussTypes: TTrussType[] = [
  "Doble Howe",
  "Double Fink",
  "Fan",
  "Fink",
  "Howe",
  "Kingpost",
  "Modified Queen",
  "Queen",
  "Simple Fink",
];

export const initialIndianDesignCode: IndianDesignCode = {
  cmx: 0.9,
  cmy: 0.9,
  cmz: 0.9,
  deflectionRatio: 325,
  klrMaxColumns: 180,
  klrMaxBracings: 180,
  klrMaxBeams: 250,
  stressRation: 1,
  effectiveLengths: [],
};

export const initialAmericanDesignCode: AmericanDesignCode = {
  cb: 1.0,
  deflectionRatio: 325,
  klrMaxColumns: 180,
  klrMaxBracings: 180,
  klrMaxBeams: 250,
  stressRation: 1,
  effectiveLengths: [],
};

export const initLadderParams: LadderParams = {
  lib: undefined,
  profile: undefined,
  spacing: 0,
  rungDia: 0,
  rungSpacing: 0,
  CHBw: 0,
  CHBt: 0,
  CHBs: 0,
  CHBd: 0,
  CVBw: 0,
  CVBt: 0,
  CVBnos: 0,
  CHR: 0,
};

export const initLoadings: Loadings = {
  SWF: 1.0,
  DLI: 200,
  FPd: 0,
  FPt: 0,
  FPh: 0,
  FPto: "All elements",
  FPdl: 0,
  intensity: 500,
  minTemp: 20,
  maxTemp: 20,
  blanketLoads: [],
  windLoadingAsPerCode: "IS Code",
  isWindCode: {
    windCode: "IS875(Part3): 2015",
    basicWindSpeed: 23,
    riskCoefficient: 1,
    terrainCategory: "Category 1",
    topographicFactor: 1,
    impFactorCyclonic: 1,
    locationOfStructure: "",
    windDirectionalityFactor: 1,
    areaAveragingFactor: 1,
    combinationFactor: 1,
    datumElevation: 0,
  },
  usWindCode: {
    windCode: "ASCE 7-16",
    basicWindSpeed: 23,
    exposure: "B",
    windDirectionalityFactor: 1,
    topographyDetails: 0,
    importanceFactor: 0,
    flexibleStructure: "",
    structuralCategory: "",
    crossSectionShape: "",
    structureType: "",
    datumElevation: 0,
  },
  euWindCode: {},
  manualWindCode: [],
  seismicLoadingAsPerCode: "IS Code",
  seismicAnalysisMethod: "Equivalent Static",
  modalCombinationMethod: "CQC",
  spectralMode: "Manual",
  spectralsPoints: [],
  isSeismicCode: {
    zoneFactor: zoneFactors[0],
    dampingRatio: dampingRatios[1],
    importanceFactor: 1.15,
    responseReductionFactor: 1,
    soilType: soilTypes[0],
    soilFoundationCondition: soilFoundationConditions[0],
    timePeriod: "1/Naturalfreq",
  },
  usSeismicCode: {
    S_S: 0.35,
    S_1: 0.08,
    siteClass: "C",
    category: "III",
    T_L: 1,
    R: 3.5,
    dampingRatio: dampingRatios[1],
    importanceFactor: 1.25,
    structureHeight: 20,
    structureType: "Steel moment-resisting frames",
    timePeriod: 0.31,
  },
  LC_lib: "CUSTOM",
  loadCombinations: [],
};

export const initPipingLoad: TPipeLoadings = {
  deadLoad: {
    pipingSelfWeightFactor: 1,
    insulations: [],
    loads: [],
  },
  slugLoads: [],
  loadCombinations: {
    LC_lib: "CUSTOM",
    loads: [],
  },
  windLoad: {
    windLoadingAsPerCode: "IS Code",
    isWindCode: {
      windCode: "IS875(Part3): 2015",
      basicWindSpeed: 23,
      riskCoefficient: 1,
      terrainCategory: "Category 1",
      topographicFactor: 1,
      impFactorCyclonic: 1,
      locationOfStructure: "",
      windDirectionalityFactor: 1,
      areaAveragingFactor: 1,
      combinationFactor: 1,
      shapeFactor: 0.7,
      datumElevation: 0,
      limitingSize: 100,
    },
    usWindCode: {
      windCode: "ASCE 7-16",
      basicWindSpeed: 23,
      exposure: "B",
      windDirectionalityFactor: 1,
      topographyDetails: 0,
      importanceFactor: 0,
      flexibleStructure: "",
      structuralCategory: "",
      crossSectionShape: "",
      structureType: "",
      shapeFactor: 0.7,
      datumElevation: 0,
      limitingSize: 100,
    },
    euWindCode: {},
    manualWindCode: [],
    loads: [],
  },
  seismicLoads: {
    seismicLoadingAsPerCode: "IS Code",
    seismicAnalysisMethod: "Equivalent Static",
    modalCombinationMethod: "CQC",
    spectralMode: "Manual",
    spectralsPoints: [],
    isSeismicCode: {
      zoneFactor: zoneFactors[0],
      dampingRatio: dampingRatios[1],
      importanceFactor: 1.15,
      responseReductionFactor: 1,
      soilType: soilTypes[0],
      soilFoundationCondition: soilFoundationConditions[0],
      timePeriod: "1/Naturalfreq",
    },
    usSeismicCode: {
      S_S: 0.35,
      S_1: 0.08,
      siteClass: "C",
      category: "III",
      T_L: 1,
      R: 3.5,
      dampingRatio: dampingRatios[1],
      importanceFactor: 1.25,
      structureHeight: 20,
      structureType: "Steel moment-resisting frames",
      timePeriod: 0.31,
    },
    seismicLoads: [],
  },
};

export const initPipeDesignCode: TPipeDesignCode = {
  designCode: "ASME B31.3 – 2017",
  discretizationLengthLimit: 1,
  deflectionLimit: 13,
  isCodeParameters: {
    cmx: 0.9,
    cmy: 0.9,
    cmz: 0.9,
    deflectionRatio: 325,
    klrColumn: 180,
    klrBracings: 180,
    klrBeams: 250,
    allowStressRatio: 1,
    effectiveLengthTable: {},
  },
  aiscLRFDCodeParameters: {
    cb: 1,
    deflectionRatio: 325,
    klrColumn: 180,
    klrBracings: 180,
    klrBeams: 250,
    allowStressRatio: 1,
    effectiveLengthTable: {},
  },
  euroCodeParameters: {},
};

export const initSettings: TSettings = {
  display: {
    hoverEffects: true,
  },
  models: {
    axesHelper: undefined,
    modelAxesHelpers: false,
    platformTransparency: 80,
    fireproofingTransparency: 50,
  },
  camera: {
    cameraType: "Perspective",
  },
  grid: {
    spacing: 1,
    count: 50,
    display: true,
  },
  analysis: {
    transparensyOfColors: 50,
    showNodes: false,
    showLabels: false,
  },
};

export const initialState: MainState = {
  activeTab: "project",
  workMode: "STRUCTURE",
  scene: new Scene(),
  currentProject: "New Project",
  projects: [
    {
      name: "New Project",
      models: [],
      designCode: "IS 800 : 2007 LSD",
      loadings: { ...initLoadings },
      ladderParams: { ...initLadderParams },
      indianDesignCode: { ...initialIndianDesignCode },
      americanDesignCode: { ...initialAmericanDesignCode },
      settings: { ...initSettings },
      pipeDesignCode: { ...initPipeDesignCode },
      pipeLoadings: { ...initPipingLoad },
    },
  ],
  fabricatedSections: [],
  rolledSections: [],
  combinedSections: [],
  userDefinedElbows: [],
};

export const reducerTypes: TReducerType[] = [
  "Concentric",
  "Eccentric Left (Preceding)",
  "Eccentric Right (Preceding)",
  "Eccentric Left (Succeeding)",
  "Eccentric Right (Succeeding)",
];

export const valveTypes: TValveType[] = [
  "Globe Valve",
  "Gate Valve",
  "Ball Valve",
  "Needle Valve",
  "Butterfly Valve",
  "Plug Valve",
  "Diaphragm Valve",
  "Relief Valve",
  "Three-Way Valve",
  "Four-Way Valve",
  "Check Valve",
  "Stop Check Valve",
  "Left Angle Valve",
  "Right Angle Valve",
  "Up Angle Valve",
  "Down Angle Valve",
  "Pressure Regulator",
];

export const valveActuators: TValveActuatorType[] = [
  "Diaphragm",
  "Alternative",
  "Piston",
  "Electric motor",
  "Solenoid",
  "Reachrod",
  "Manual",
];

export const valveControls: TValveControlType[] = [
  "Flow",
  "Temperature",
  "Level",
  "Pressure",
];
