import { LoadingAsPerCode, TSpectralPoint, TerrainCategory, LoadType } from "./types";

export type TPipeLoadings = {
  deadLoad: TPipeDeadLoad;
  slugLoads: TPipeSlugLoad[];
  windLoad: TPipeWindLoad;
  seismicLoads: TPipeSeismicLoads;
  loadCombinations: {
    LC_lib: "CUSTOM" | "DEFAULT";
    loads: TPipeLoadCombination[];
  };
  NFs?: { [key: number]: number | undefined };
};

export type TPipeNF = {
  line: number;
  value: number | undefined;
};

export type TPipeDeadLoad = {
  pipingSelfWeightFactor: number;
  insulations: TPipeInsulationLoad[];
  loads: TPipeAdditionalLoad[];
};

export type TPipeAdditionalLoad = {
  id: number;
  selected: boolean;
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
};

export type TPipeInsulationLoad = {
  id: number;
  selected: boolean;
  element?: string;
  thickness: number;
  density: number;
  type: string;
};

export type TPipeSlugLoad = {
  id: number;
  selected: boolean;
  element?: string;
  location: "End";
  velocity: number;
  DLF: number;
};

export type TPipeWindLoad = {
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
    shapeFactor?: number;
    datumElevation?: number;
    limitingSize?: number;
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
    shapeFactor?: number;
    datumElevation?: number;
    limitingSize?: number;
  };
  euWindCode: {};
  manualWindCode: {
    id: number;
    selected: boolean;
    height: number;
    pressure: number;
  }[];
  loads: TPipeAdditionalLoad[];
};

export type TPipeSeismicLoads = {
  seismicLoadingAsPerCode: LoadingAsPerCode;
  seismicAnalysisMethod: "Equivalent Static" | "Response Spectrum";
  spectralMode: "Manual" | "Code";
  spectralsPoints: TSpectralPoint[];
  modalCombinationMethod: "ABS-SUM" | "SRSS" | "CQC";
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
  seismicLoads: TPipeSeismicLoad[];
};

export type TCategory = "I" | "II" | "III" | "IV";

export type TSiteClass = "A" | "B" | "C" | "D" | "E" | "F";

export type TPipeSeismicLoad = {
  id: number;
  line: string;
  node: number;
  weight: number;
};

export type TPipeLoadCombination = {
  id: number;
  selected: boolean;
  isEmpty: boolean;
  LC_No?: number;
  loadCase?: string;
  condition?: string;
  dApplied?: "No" | "D1"; 
  empty?: number;
  emptyPlusFluid?: number;
  emptyPlusWater?: number;
  WXp?: number;
  WXm?: number;
  WZp?: number;
  WZm?: number;
  SXp?: number;
  SXm?: number;
  SZp?: number;
  SZm?: number;
  slug?: number;
  T1Hot?: number;
  T1Cold?: number;
  T2Hot?: number;
  T2Cold?: number;
  T3Hot?: number;
  T3Cold?: number;
  P1?: number;
  HP?: number;
  N?: number;
  isEmpties?: boolean;
  isTests?: boolean;
  isOperatings?: boolean;
  isThermals?: boolean;
  isWX?: boolean;
  isWZ?: boolean;
  isPSV?: boolean;
  isIce?: boolean;
};

export type TPipeAnalysis = {
  reactionSupports?: TPipeReactionSupport[];
  memberEndForces?: TPipeMemberEndForces[];
  memberStressChecks?: TPipeMemberStressCheck[];
  thicknessChecks?: TPipeThicknessCheck[];
  nodeDisplacements?: TPipeNodeDisplacement[];
  flangeChecks?: TFlangeCheck[];
  pipeMTO?: TPipeMTO[];
  accessoryMTO?: TAccessoryMTO[];

  stressCheckParams?: TPipeCheckParams;
  thicknessCheckParams?: TPipeCheckParams;
  flangeCheckParams?: TPipeCheckParams;
};

export type TPipeReactionSupport = {
  line: string;
  nodeNumber: number;
  LC: string;
  Fx: number;
  Fy: number;
  Fz: number;
  Mx: number;
  My: number;
  Mz: number;
};

export type TPipeMemberEndForces = {
  line: string;
  pipe: number;
  LC: string;
  elementNumber: number;
  corTc: string;
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

type TPipeCheck = {
  line: string;
  element: string;
  pipe?: string;
  LC: string;
  result: string;
  x1: number;
  y1: number;
  z1: number;
  x2: number;
  y2: number;
  z2: number;
  od: number;
  wt: number;
};

export type TPipeMemberStressCheck = {
  actualStressRatio: number;
  allowableStressRatio: number;
} & TPipeCheck;

export type TPipeCheckParams = {
  lines?: string[];
  LC?: string;
  LCT?: string;
  element?: number;
  green?: number;
  red?: number;
};

export type TPipeThicknessCheck = {
  requiredThickness: number;
  providedThickness: number;
  utilizationRatio: number;
} & TPipeCheck;

export type TFlangeCheck = {
  line: string;
  pipe: string;
  flangeAt: "START" | "END";
  nodeNo: number;
  nps: string;
  type: string;
  class: number;
  material: string;
  loadCase: number;
  criticalLoadDir: string;
  loadValue: number;
  allowableLoad: number;
  utilizationRatio: number;
  result: string;
};

export type TPipeMTO = {
  line: string;
  tag: string;
  structure: string;
  size: string;
  material: string;
  weight: number;
  length: number;
};

//Process MTO
export type TProcessMTO = {
  line: string;
  size: string;
  material: string;
  weight: number;
  length: number;
}

export type TAccessoryMTO = {
  line: string;
  tag: string;
  structure: string;
  size: string;
  type: string;
  schedule?: string;
  class?: string | number;
  nos?: number;
  weight: number;
};

export type TPipeNodeDisplacement = {
  line: string;
  lines?: string[];
  nodeNumber: number;
  LC?: string;
  LCT?: string;

  x: number;
  y: number;
  z: number;

  rx: number;
  ry: number;
  rz: number;

  du: number; // dx
  dv: number; // dy
  dw: number; // dz

  tResultant: number;
  rResultant: number;
};
