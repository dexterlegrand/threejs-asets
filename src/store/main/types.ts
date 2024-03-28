import { Vector3, Scene } from "three";
import { ProjectUI } from "../ui/types";
import {
  Section,
  RolledSection,
  Material,
  TPipingAccessory,
  PipeProfile,
  CableProfile,
  TPipingFlange,
  CombinedSection,
  TPipingElbow,
  TClash,
} from "../data/types";
import {
  TPipeLoadings,
  TPipeAnalysis,
  TCategory,
  TSiteClass,
} from "./pipeTypes";
import { TProcessImport, TProcess } from "../process/types";
import { TFlare } from "./types/flare";
import { TTower } from "./types/tower";
import { ODSS, ODSSUserDefinedSection } from "./odssTypes";
import { TPlatformOF } from "./openFrameTypes";

export type TWorkMode =
  | "PROCESS"
  | "DESIGNER"
  | "PRODESIGNER" //trial mode
  | "PIPDESIGNER" //trial mode
  | "STRDESIGNER" //trial mode
  | "PIPING"
  | "STRUCTURE"
  | "LEARNINGS";

export type MainState = {
  scene: Scene;
  products?: string[];
  activeTab: string;
  workMode: TWorkMode;
  currentProject: string;
  projects: Project[];
  fabricatedSections: Section[];
  rolledSections: RolledSection[];
  combinedSections: CombinedSection[];
  userDefinedElbows: TPipingElbow[];
  clashes?: TClash[];
};

export enum MainActionTypes {
  SET_PRODUCTS = "SET_PRODUCTS",
  CHANGE_ACTIVE_TAB = "CHANGE_ACTIVE_TAB",

  LOAD_PROJECT = "LOAD_PROJECT",
  CREATE_PROJECT = "CREATE_PROJECT",
  CREATE_XCH_PROJECT = "CREATE_XCH_PROJECT",
  CREATE_XCH_PROJECT_OF = "CREATE_XCH_PROJECT_OF",
  CREATE_XCH_PROJECT_PIPES = "CREATE_XCH_PROJECT_PIPES",
  SELECT_PROJECT = "SELECT_PROJECT",
  REMOVE_PROJECT = "REMOVE_PROJECT",
  RENAME_PROJECT = "RENAME_PROJECT",
  SET_TYPE_AND_MATERIAL = "SET_TYPE_AND_MATERIAL",
  CHANGE_FABRICATED_SECTIONS = "CHANGE_FABRICATED_SECTIONS",
  CHANGE_ROLLED_SECTIONS = "CHANGE_ROLLED_SECTIONS",
  CHANGE_COMBINED_SECTIONS = "CHANGE_COMBINED_SECTIONS",
  CHANGE_USER_DEFINED_ELBOWS = "CHANGE_USER_DEFINED_ELBOWS",
  CREATE_MODEL = "CREATE_MODEL",
  CHANGE_MODEL = "CHANGE_MODEL",
  REMOVE_MODEL = "REMOVE_MODEL",
  CHANGE_LOADINGS = "CHANGE_LOADINGS",
  CHANGE_LADDER_PARAMS = "CHANGE_LADDER_PARAMS",
  CHANGE_INDIAN_DC = "CHANGE_INDIAN_DC",
  CHANGE_AMERICAN_DC = "CHANGE_AMERICAN_DC",
  CHANGE_PROJECT = "CHANGE_PROJECT",
  CHANGE_PROJECT_BY_NAME = "CHANGE_PROJECT_BY_NAME",
  GET_REPORTS = "GET_REPORTS",
  GET_SEISMIC_LOADS = "GET_SEISMIC_LOADS",
  CHANGE_WORK_MODE = "CHANGE_WORK_MODE",
  CHANGE_NOT_EDITABLE_PROJECTS = "CHANGE_NOT_EDITABLE_PROJECTS",
  CHANGE_NOT_EDITABLE_PROCESSES = "CHANGE_NOT_EDITABLE_PROCESSES",
  SET_WEIGHT_SUMMARY = "SET_WEIGHT_SUMMARY",
  CHANGE_PROJECT_MODE = "CHANGE_PROJECT_MODE",

  CREATE_PIPE = "CREATE_PIPE",
  CHANGE_PIPES = "CHANGE_PIPES",
  DELETE_PIPES = "DELETE_PIPES",
  SET_PIPES = "SET_PIPES",

  CREATE_CABLE = "CREATE_CABLE",
  CHANGE_CABLES = "CHANGE_CABLES",
  DELETE_CABLES = "DELETE_CABLES",
  SET_CABLES = "SET_CABLES",

  CHANGE_PIPE_NF = "CHANGE_PIPE_NF",
  CHANGE_PIPE_ANALYSIS = "CHANGE_PIPE_ANALYSIS",
  CHANGE_PIPE_SEISMIC_LOADS = "CHANGE_PIPE_SEISMIC_LOADS",
  CHANGE_PIPE_LOADS_TO_STRUCTURE = "CHANGE_PIPE_LOADS_TO_STRUCTURE",

  CHANGE_STRESS_CHECK_PARAMS = "CHANGE_STRESS_CHECK_PARAMS",
  CHANGE_THICKNESS_CHECK_PARAMS = "CHANGE_THICKNESS_CHECK_PARAMS",
  CHANGE_FLANGE_CHECK_PARAMS = "CHANGE_FLANGE_CHECK_PARAMS",
  CHANGE_IMPORTED_TO_PROCESS = "CHANGE_IMPORTED_TO_PROCESS",

  SET_CLASHES = "SET_CLASHES",

  CREATE_FLARE = "CREATE_FLARE",
  CHANGE_FLARE = "CHANGE_FLARE",
  DELETE_FLARE = "DELETE_FLARE",

  CHANGE_DASHBOARD = "CHANGE_DASHBOARD",
}

export type DesignCode =
  | "IS 800 : 2007 LSD"
  | "AISC LRFD"
  | "Eurocode 3 [EN 1993-1-1:2005]";

export type Named = {
  name: string;
};

// mode is effect on showing model
export type TProjectMode =
  | "standard"
  | "stressCheck"
  | "deflectionCheck"
  | "thicknessCheck"
  | "flangeCheck"
  | "releases"
  | "clashes"
  | "endForces"
  | "LSA";

export type Project = {
  locked?: boolean;
  modelType?: ModelType;
  selectedMaterial?: Material;
  concreteGrade?: string;

  ladderParams: LadderParams;

  models: Model[];
  flares?: TFlare[];
  towers?: TTower[];
  odss?: ODSS[];

  loadings: Loadings;

  userDefinedSectionsOfStaad?: ODSSUserDefinedSection[];

  designCode: DesignCode;
  indianDesignCode: IndianDesignCode;
  americanDesignCode: AmericanDesignCode;

  mode?: TProjectMode;
  settings: TSettings;

  freeCables?: FreeCable[];
  freePipes?: FreePipe[];
  pipeDesignCode: TPipeDesignCode;
  pipeLoadings: TPipeLoadings;
  pipeAnalysis?: TPipeAnalysis;
  importedProcess?: TProcessImport[];
  loadsToStructure?: TLoadToStructure;

  notEditableProjects?: Project[];
  notEditableProcesses?: {
    id: number;
    locked: boolean;
    name: string;
    process: TProcess;
  }[];

  dashboard?: TDashboard;
} & Named;

export type TDashboard = {
  location?: string;
  description?: string;
  date?: string;
  checklist?: TDashboardCheckItem[];
  engineerGroups?: TDashboardEngineerGroup[];
  budget?: TDashboardBudget;
};

export type TDashboardCheckItem = {
  id: number;
  header: string;
  tasks: TDashboardCheckItemTask[];
};

export enum EDashboardCheckType {
  NONE,
  FINISHED,
  UNFINISHED,
}

export type TDashboardCheckItemTask = {
  id: number;
  type: EDashboardCheckType;
  title?: string;
};

export type TDashboardEngineerGroup = {
  id: number;
  header: string;
  engineers: TDashboardEngineer[];
};

export type TDashboardEngineer = {
  id: number;
  name: string;
  invitation: EDashboardCheckType;
  attending: EDashboardCheckType;
  thanks: EDashboardCheckType;
};

export type TDashboardBudget = {
  total?: number;
  categories?: TDashboardBudgetCategory[];
};

export type TDashboardBudgetCategory = {
  id: number;
  name: string;
  activities: TDashboardBudgetCategoryActivity[];
};

export type TDashboardBudgetCategoryActivity = {
  id: number;
  name: string;
  amount: number;
  comment?: string;
  start?: Date;
  duration: number;
  actualStart?: Date;
  actualDuration?: number;
};

export type TCamera = "Othrographic" | "Perspective";

export type TSettings = {
  display: TDisplaySettings;
  models: TModelsSettings;
  camera: TCameraSettings;
  grid: TGridSettings;
  analysis: TAnalysisSettings;
};

export type TDisplaySettings = {
  hoverEffects: boolean;
};

export type TModelsSettings = {
  axesHelper: "ALL" | string | undefined;
  modelAxesHelpers: boolean;
  modelLoadings?: boolean;
  platformTransparency: number;
  fireproofingTransparency: number;
  processInPiping?: boolean;
  processPipeTransparency?: number;
  pipeTransparency?: number;
};

export type TCameraSettings = {
  cameraType: TCamera;
  isPivot?: boolean;
};

export type TGridSettings = {
  spacing: number;
  count: number;
  display: boolean;
  customs?: TCustomGrid[];
};

export type TAnalysisSettings = {
  transparensyOfColors: number;
  showNodes?: boolean;
  showLabels?: boolean;
};

export type TCustomGrid = {
  id: number;
  name: string;
  positionsX: string;
  namesX: string;
  positionsZ: string;
  namesZ: string;
  x: number;
  y: number;
  z: number;
  display: boolean;
};

export type TLongWeldType = "S" | "ERW" | "EFW" | "FBW";

export type FreePipe = {
  id: number;
  processLine?: number;
  line: number;
  tag?: string;
  structure?: string;
  pipe: string;
  elevation: number;
  length: number;
  color?: string;
  preceding: string;
  hDir: number;
  hNextDir?: number;
  vDir: number;
  vNextDir?: number;
  x1: number;
  y1: number;
  z1: number;
  x2: number;
  y2: number;
  z2: number;
  params: {
    lib?: string;
    nps?: string;
    profile?: PipeProfile;
    material?: Material;
    startFlangeType?: TFlangeType;
    startFlangeClass?: number;
    startFlange?: TPipingFlange;
    startFlangeLoads?: TFlangeLoads;
    endFlangeType?: TFlangeType;
    endFlangeClass?: number;
    endFlange?: TPipingFlange;
    endFlangeLoads?: TFlangeLoads;
    reducerType?: TReducerType;
    valveType?: TValveType;
    valvePosition?: "START" | "END" | number;
    valveActuator?: TValveActuatorType;
    valveControl?: TValveControlType;
    valveMass?: number; // New Value
    valveLength?: number; // New Value
    od?: number;
    thickness?: number;
    millTolerance: number;
    longWeldType: TLongWeldType;
    corrosionAllowance: number;
    endConnectorType?: PipeConnectorType;
    endConnector?: TPipingAccessory;
    endConnectorDetails?: TEndConnectorDetails;
    numberOfSupports?: number;
    supportDetails?: TSupportDetail[];
    fluidDensity?: number;
    T1?: number;
    T2?: number;
    T3?: number;
    T4?: number;
    T5?: number;
    T6?: number;
    T7?: number;
    T8?: number;
    T9?: number;
    P1?: number;
    P2?: number;
    P3?: number;
    P4?: number;
    HP?: number;
  };
};

export type FreeCable = {
  id: number;
  processLine?: number;
  line: number;
  tag?: string;
  structure?: string;
  cable: string;
  elevation: number;
  length: number;
  preceding: string;
  hDir: number;
  hNextDir?: number;
  vDir: number;
  vNextDir?: number;
  x1: number;
  y1: number;
  z1: number;
  x2: number;
  y2: number;
  z2: number;
  params: {
    lib?: string;
    nps?: string;
    profile?: CableProfile | PipeProfile;
    material?: Material;
    startFlangeType?: TFlangeType;
    startFlangeClass?: number;
    startFlange?: TPipingFlange;
    startFlangeLoads?: TFlangeLoads;
    endFlangeType?: TFlangeType;
    endFlangeClass?: number;
    endFlange?: TPipingFlange;
    endFlangeLoads?: TFlangeLoads;
    reducerType?: TReducerType;
    valveType?: TValveType;
    valvePosition?: "START" | "END" | number;
    valveActuator?: TValveActuatorType;
    valveControl?: TValveControlType;
    od?: number;
    thickness?: number;
    millTolerance: number;
    longWeldType: TLongWeldType;
    corrosionAllowance: number;
    endConnectorType?: PipeConnectorType;
    endConnector?: TPipingAccessory;
    endConnectorDetails?: TEndConnectorDetails;
    numberOfSupports?: number;
    supportDetails?: TSupportDetail[];
    fluidDensity?: number;
    T1?: number;
    T2?: number;
    T3?: number;
    T4?: number;
    T5?: number;
    T6?: number;
    T7?: number;
    T8?: number;
    T9?: number;
    P1?: number;
    P2?: number;
    P3?: number;
    P4?: number;
    HP?: number;
  };
};

export type TNozzleLoadCode = "API 517" | "API 617" | "NEMA/SM23";

export type TFlangeLoads = {
  code: TNozzleLoadCode;
  fx: number;
  fy: number;
  fz: number;
  mx: number;
  my: number;
  mz: number;
  "3F+M"?: number;
};

export type TEndConnectorDetails = {
  type:
    | "BWE"
    | "BCSM"
    | "BWSM"
    | "TW"
    | "TRF"
    | "TURF"
    | "TEW"
    | "TWCI"
    | "TBWF";
  tn?: number;
  tr?: number;
  tc?: number;
  r?: number;
  rx?: number;
  R?: number;
  Re?: number;
  S?: number;
  Theta?: number;
};

export type TSupportDetail = {
  id: number;
  type: PipeSupportType;
  direction?: "X" | "Y" | "Z" | "RX" | "RY" | "RZ";
  distance: number;
  valueType: "K" | "δ allow." | "δ appl.";
  x?: "Released" | string;
  y?: "Released" | string;
  z?: "Released" | string;
  Rx?: "Released" | string;
  Ry?: "Released" | string;
  Rz?: "Released" | string;
  Mu: number;
  masterNodePipe?: string;
  masterNodeDist?: number;
};

export type TLoadToStructure = {
  sent: TLoadToStructureElement[];
  last: TLoadToStructureElement[];
};

export type TLoadToStructureElement = {
  id: number;
  line: string;
  pipe: string;
  restraint: string;
  type: string;
  emptyFy?: number;
  testFy?: number;
  operatingFy?: number;
  taFy?: number;
  tfFx?: number;
  tfFz?: number;
  wxFx?: number;
  wxFy?: number;
  wxFz?: number;
  wzFx?: number;
  wzFy?: number;
  wzFz?: number;
  psvSurgeFx?: number;
  psvSurgeFy?: number;
  psvSurgeFz?: number;
  iceSnow?: number;
  revision: number;
  status: "No issued" | "Issued" | "Revised" | "Deleted";
};

export type TPipeDesignCode = {
  discretizationLengthLimit: number;
  designCode?: string;
  deflectionLimit: number;
  isCodeParameters?: {
    cmx: number;
    cmy: number;
    cmz: number;
    deflectionRatio: number;
    klrColumn: number;
    klrBracings: number;
    klrBeams: number;
    allowStressRatio: number;
    minStressRation?: number;
    effectiveLengthTable: {};
  };
  aiscLRFDCodeParameters?: {
    cb: number;
    deflectionRatio: number;
    klrColumn: number;
    klrBracings: number;
    klrBeams: number;
    allowStressRatio: number;
    minStressRation?: number;
    effectiveLengthTable: {};
  };
  euroCodeParameters?: {};
};

export type PipeConnectorType =
  | "Bend"
  | "Rigid joint"
  | "Expansion joint"
  | "Stress intensity factor (Sif) & Tee"
  | "Supp Sliding X"
  | "Supp Sliding Y"
  | "Supp Sliding Z"
  | "Supp Fixed"
  | "Elbow"
  | "Return"
  | "Reducer"
  | "Cap"
  | "Tee";

export type TFlangeType =
  | "Slip On"
  | "Blind"
  | "Ring Joint Facing"
  | "Welding Neck"
  | "Lapped"
  | "Threaded"
  | "Socket Welding";

export type TReducerType =
  | "Concentric"
  | "Eccentric Right (Succeeding)"
  | "Eccentric Right (Preceding)"
  | "Eccentric Left (Succeeding)"
  | "Eccentric Left (Preceding)";

export type TValveType =
  | "Globe Valve"
  | "Gate Valve"
  | "Ball Valve"
  | "Needle Valve"
  | "Butterfly Valve"
  | "Plug Valve"
  | "Diaphragm Valve"
  | "Relief Valve"
  | "Three-Way Valve"
  | "Four-Way Valve"
  | "Check Valve"
  | "Stop Check Valve"
  | "Left Angle Valve"
  | "Right Angle Valve"
  | "Up Angle Valve"
  | "Down Angle Valve"
  | "Pressure Regulator";

export type TValveActuatorType =
  | "Diaphragm"
  | "Alternative"
  | "Piston"
  | "Electric motor"
  | "Solenoid"
  | "Reachrod"
  | "Manual";

export type TValveControlType = "Flow" | "Temperature" | "Level" | "Pressure";

export type TReactionSupport = {
  model: string;
  nodeNumber: number;
  LCNumber: string;

  Fx: number;
  Fy: number;
  Fz: number;
  Mx: number;
  My: number;
  Mz: number;
  value: number;
};

export type TMemberEndForce = {
  model: string;
  elementNumber: number;
  LCNumber: string;

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

export type TMemberStressCheck = {
  model: string;
  elementName: string;
  elementNumber: number;
  LCNumber: string;

  actual: number;
  allowable: number;
  result: "pass" | "fail";
};

export type TDeflectionCheck = {
  model: string;
  elementName: string;
  elementNumber: number;
  LCNumber: string;
  length: number;
  actual: number;
  allowable: number;
  utilizationRatio: number;
  result: "pass" | "fail";
};

export type TNodeDisplacement = {
  model: string;
  nodeNumber: number;
  LCNumber: string;

  rx: number;
  ry: number;
  rz: number;

  du: number; // dx
  dv: number; // dy
  dw: number; // dz

  tResultant: number;
  rResultant: number;
};

export type LoadedProject = {
  fabricatedSections: Section[];
  rolledSections: RolledSection[];
  combinedSections: CombinedSection[];
  userDefinedElbows: TPipingElbow[];
  project: Project;
  ui?: ProjectUI;
  camera?: {
    target: { x: number; y: number; z: number };
    position: { x: number; y: number; z: number };
  };
};

export type ModelType =
  | "Pipe Rack"
  | "Open Frame"
  | "Factory Shed"
  | "Pipe Line"
  | "Flare"
  | "Equipment"
  | "ODSS"
  | "ROAD";

export type Model = {
  project: string;
  type: ModelType;
} & Named;

export type Side = "L" | "R";

export type SupportType = "Pin" | "Fix";

export type PipeSupportType =
  | "Anchor"
  | "Sliding"
  | "Spring"
  | "Custom"
  | "Custom+"
  | "Custom-"
  | "Slave Node"
  | "Hanger";

export type SimpleDirection = "X" | "Z";

export type Direction2 = "+X" | "-X" | "+Z" | "-Z";

export type SimpleDirection3 = "X" | "Y" | "Z";

export type Direction3 = "+X" | "-X" | "+Y" | "-Y" | "+Z" | "-Z";

export type UserDirection = "Front" | "Left" | "Back" | "Right";

export type BracingType =
  | "Triangular Up"
  | "Triangular Down"
  | "X Bracing"
  | "Diagonal Up"
  | "Diagonal Down";

export type PortalParams = {
  tiers: number;
  bays: number;
  baseElevation: number;
  width: number;
  height: number;
  length: number;
  direction: Direction2;
  CSLibrary: string;
  colProfile: Section;
  beamProfile: Section;
  tieProfile: Section;
  x: number;
  y: number;
  z: number;
  material: Material | undefined;
  supportType: SupportType;
};

export type BracingParams = {
  bracingType: BracingType;
  sideType: Side | "Both";
  tiers: number[];
  CSLibrary: string;
  profile: Section;
};

export type CantileverParams = {
  tiers: number[];
  sideType: Side | "Both";
  position: UserDirection | "Outsides";
  length: number;
  CSLibrary: string;
  profile: Section;
};

export type Element = {
  id: number;
  uiId?: number;
  parent: string;
  type?:
    | "PipeRackColumn"
    | "PipeRackBeam"
    | "PipeRackVBracing"
    | "PipeRackHBracing"
    | "PipeRackCantilever"
    | "Ladder"
    | "AccessoryBeam"
    | "AccessoryColumn";
  releases?: Releases;
} & Named;

export type Releases = {
  fx1?: boolean;
  fy1?: boolean;
  fz1?: boolean;
  mx1?: boolean;
  my1?: boolean;
  mz1?: boolean;
  fx2?: boolean;
  fy2?: boolean;
  fz2?: boolean;
  mx2?: boolean;
  my2?: boolean;
  mz2?: boolean;
};

export type PipeRack = {
  baseElevation: number;
  portals: PipeRackPortal[];
  columns: PipeRackColumn[];
  beams: PipeRackBeam[];
  vBracings: PipeRackVBracing[];
  hBracings: PipeRackHBracing[];
  cantilevers: PipeRackCantilever[];
  accessories: Accessory[];
  pipes: Pipe[];
  platforms: PipeRackPlatform[];
  ladders: Ladder[];
  plates: (CircularBP | RectangularBP)[];
  flanges: (CircularSF | RectangularSF)[];
  startPos: Vector3;
  direction: Direction2;
  material?: Material;
  CSLibrary: string;
  portalColProfile: Section;
  portalBeamProfile: Section;
  portalTieProfile: Section;
  structuralNaturalFrequency?: number;
} & Model;

export type PipeRackPortal = {
  chainage: number;
  width: number;
  tiers: number[];
  length: number;
  position: "start" | "middle" | "end";
  supportType: SupportType;
} & Element;

export type PipeRackColumn = {
  tier: number;
  side?: Side;
  startPos: Vector3;
  endPos: Vector3;
  CSLibrary: string;
  profile: Section;
  onGround?: boolean;
  additional?: boolean;
  lowerBeam?: string;
  upperBeam?: string;
  orientation?: Orientation;
  memberId?: number;
  next?: string;
  isNext?: boolean;
  // loadings
  deadLoadId?: number;
  deadLoad?: AdditionalLoad;

  liveLoadId?: number;
  liveLoad?: AdditionalLoad;

  windLoadId?: number;
  windLoad?: AdditionalLoad;
} & Element;

export type PipeRackBeam = {
  tier: number;
  side?: Side;
  direction: SimpleDirection;
  startPos: Vector3;
  endPos: Vector3;
  CSLibrary: string;
  profile: Section;
  additional?: boolean;
  orientation?: Orientation;
  elevation?: number;
  next?: string;
  splitters?: ("C" | "AB" | "VB" | "AG" | "PC" | "HB")[];
  memberId?: number;
  // loadings
  deadLoadId?: number;
  deadLoad?: AdditionalLoad;

  liveLoadId?: number;
  liveLoad?: AdditionalLoad;

  directLoadId?: number;
  directLoad?: DirectLoad;

  equipmentLoadId?: number;
  equipmentLoad?: EquipmentLoad;

  windLoadId?: number;
  windLoad?: AdditionalLoad;
} & Element;

export type PipeRackVBracing = {
  tier: number;
  side: Side | "Portal";
  sideType: Side | "Both" | "Portal";
  bracingType: BracingType;
  startPos: Vector3;
  endPos: Vector3;
  CSLibrary: string;
  profile: Section;
  isUp?: boolean;
  orientation?: Orientation;
  memberId?: number;
} & Element;

export type PipeRackHBracing = {
  tier: number;
  start: string;
  startOffset: number;
  end: string;
  endOffset: number;
  CSLibrary: string;
  profile: Section;
  orientation?: Orientation;
  elevation?: number;
  memberId?: number;
} & Element;

export type PipeRackCantilever = {
  tier: number;
  side: Side;
  sideType: Side | "Both";
  position: UserDirection;
  positionType: UserDirection | "Outsides";
  length: number;
  CSLibrary: string;
  profile: Section;

  startPos: Vector3;
  endPos: Vector3;

  orientation?: Orientation;
  elevation?: number;
  next?: string;
  splitters?: ("C" | "AB" | "VB" | "AG" | "PC" | "HB")[];
  memberId?: number;
  // loadings
  deadLoadId?: number;
  deadLoad?: AdditionalLoad;

  liveLoadId?: number;
  liveLoad?: AdditionalLoad;

  directLoadId?: number;
  directLoad?: DirectLoad;

  windLoadId?: number;
  windLoad?: AdditionalLoad;
} & Element;

export type Pipe = {
  direction: Direction3;
  fromPortal: string;
  startElevation: number;
  startLeftDist: number;
  startBayDist: number;
  start: Vector3;
  toPortal: string;
  endElevation: number;
  endLeftDist: number;
  endBayDist: number;
  end: Vector3;
  diameter: number;
  thickness: number;
  lib?: string;
  profile?: PipeProfile;
  material: Material;
  succeeding: string;
  supTypes: SupType[];
} & Element;

export type SupType = {
  id?: number;
  KforSpring?: number;
  distance: number;
  position: Vector3;
  type: PipeSupportType;
  beam?: string;
};

export type AccessoryType = "T-Post" | "F-Post" | "Christmas Tree";

export type Orientation = 0 | 45 | 90 | 135 | 180 | 225 | 270 | 315;

export type Accessory = {
  tier: number;
  side: Side;
  type: AccessoryType;
  orientation: Orientation;
  distanceFromStart?: number;
  spacing: number;
  count: number;
  elements: (TPostAccessory | FPostAccessory | ChristmasTreeAccessory)[];
  deadLoad?: DL_TPost | DL_FPost | DL_CTree;
} & Element;

export type AccessoryElement = {
  group: string;
  index: number;
  side: Side;
  totalH: number;

  colOrientation: Orientation;
  colCSLibrary: string;
  colProfile: Section;

  colItems: any[];

  beamOrientation: Orientation;
  beamCSLibrary: string;
  beamProfile: Section;

  beamItems: any[];
} & Element;

export type TPostAccessory = {
  leftProjection: number;
  rightProjection: number;
} & AccessoryElement;

export type FPostAccessory = {
  h1: number;
  h2?: number;
  h3?: number;
  h4?: number;

  projection: number;
} & AccessoryElement;

export type ChristmasTreeAccessory = {
  h1: number;
  h2?: number;
  h3?: number;
  h4?: number;

  leftProjection: number;
  rightProjection: number;
} & AccessoryElement;

export type PipeRackPlatform = {
  fromPortal: string;
  toPortal: string;
  tier: number;
  side: PlatformPosition;
  width: number;
  thickness: number;
  valid: boolean;
} & Element;

export type PlatformPosition =
  | "LEFT OUT"
  | "LEFT IN"
  | "MID"
  | "RIGHT IN"
  | "RIGHT OUT";

export type DesignMethod = "Method 1" | "Method 2";

export type ShearResistedType = "Shear Key" | "Bolts";

export type TShearKeyDetails = {
  overalDepth: number;
  flangeWidth: number;
  webThick: number;
  flangeThick: number;
  keyLength: number;
  groutThickness: number;
  material: string;
  materialYielding: number;
  materialUltimateStress: number;
  anchorBolt: number;
  weld: number;
};

export type BasePlate = {
  type: "Circular" | "Rectangular";
  column: string;
  designMethod: DesignMethod;
  // Base Plate
  bPlateThickness: number;
  // Anchor Bolt Size
  grade: string;
  boltDiameter: number;
  // Anchor Bolt Capacity
  tension: number;
  shear: number;
  // Stiffener Plate
  sPlateThickness: number;
  sPlateHeight: number;
} & Element;

export type CiculrStackBP = {
  BottomPlateOuterDiameter: number;
  BottomPlateInnerDiameter: number;
  NumberOfBolts: number;
  BoltCircleDiameter: number;
  BoltHoleDiameter: number;
  BottomPlateThickness: number;
  topPlateRequired: "CANT_REQUIRED";
  TopPlateOuterDiameter: number;
  TopPlateInnerDiameter: number;
  TopPlateThickness: number;
  gussetheight: number;
  computed: {
    parentUpperDiameter: number;
    parentLowerDiameter: number;
  };
  gussetPlate: "ONE_GUSSET_PER_BOlT" | "TWO_GUSSET_PER_BOlT";
  gussetwidth: number;
  verticalChamferDistance: number;
  horizontalChamferDistance: number;
  gussetPts: number;
  gussetthickness: number;
};

export type CircularBP = {
  // Base Plate
  bPlateDiameter: number;
  // Anchor Bolt Location
  boltBCD: number;
  boltNos: number;
  // Stiffener Plate
  sPlateWidth: number;
  sPlateNos: number;
} & BasePlate;

export type CircularSF = {
  elevation: number;

  bBottomPlateThickness: number;
  bBottomPlateDiameter: number;
} & CircularBP;

export type RectangularBP = {
  // Base Plate
  bPlateLength: number;
  bPlateWidth: number;
  // No of Bolts
  alongLength: 2 | 4 | 6 | 8;
  alongWidth: 2 | 4 | 6 | 8;
  // Spacing along Length
  firstRow_L: number;
  RtoR_L: number;
  // Spacing along Width
  firstRow_W: number;
  RtoR_W: number;
  // Stiffener Plate
  alongWeb: 1 | 2 | 3;
  alongFlange: 1 | 2 | 3;

  shearResistedBy?: ShearResistedType;
  shearKeyDetails?: TShearKeyDetails;
} & BasePlate;

export type RectangularSF = {
  elevation: number;

  bBottomPlateThickness: number;
  bBottomPlateLength: number;
  bBottomPlateWidth: number;
} & RectangularBP;

export type Ladder = {
  platform: string;
  onFace: UserDirection;
  distanceFromLeft: number;
  fromEL: number;
} & Element;

export type LadderParams = {
  lib: string | undefined;
  profile: Section | undefined;
  spacing: number;
  rungDia: number;
  rungSpacing: number;
  CHBw: number;
  CHBt: number;
  CHBs: number;
  CHBd: number;
  CVBw: number;
  CVBt: number;
  CVBnos: number;
  CHR: number;
};

/* ==================== LOADING TYPES ==================== */

export type Loadings = {
  // Dead Load
  SWF: number;
  DLI: number;
  FPd: number;
  FPt: number;
  FPh: number;
  FPto: "All elements" | "Only Columns and Beams";
  FPdl: number;
  // Live Load
  intensity: number;
  // Temp. Load
  minTemp: number;
  maxTemp: number;
  // Piping Load
  blanketLoads: BlanketLoad[];
  // Wind Load
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
  // Seismic Load
  seismicLoadingAsPerCode: LoadingAsPerCode;
  seismicAnalysisMethod: "Equivalent Static" | "Response Spectrum";
  modalCombinationMethod: "ABS-SUM" | "SRSS" | "CQC";
  spectralMode: "Manual" | "Code";
  spectralsPoints: TSpectralPoint[];
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
  // Load Comb.
  LC_lib: LC_LibType;
  directLoads?: DirectLoad[];
  seismicLoads?: TSeismicLoad[];
  loadCombinations: LoadCombination[];
};

export type TSpectralPoint = {
  id: number;
  selected: boolean;
  timePeriod: number;
  acceleration: number;
};

export type LC_LibType = "IS" | "US" | "EU" | "CUSTOM";

export type TerrainCategory =
  | "Category 1"
  | "Category 2"
  | "Category 3"
  | "Category 4";

export type LoadingAsPerCode = "IS Code" | "US Code" | "EU Code";

export type LoadType = "Point Load" | "UDL";

export type AdditionalLoad = {
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

export type DL_TPost = {
  id: number;
  intensity: number;
};

export type DL_FPost = {
  intensityL1: number;
  intensityL2: number;
  intensityL3: number;
  intensityL4: number;
} & DL_TPost;

export type DL_CTree = DL_FPost;

export type EquipmentLoad = {
  id: number;
  selected?: boolean;
  model?: string;
  element?: string;
  distance: number;
  empty_Fy?: number;

  test_Fx?: number;
  test_Fy?: number;
  test_Fz?: number;
  test_Mx?: number;
  test_My?: number;
  test_Mz?: number;

  operating_Fx?: number;
  operating_Fy?: number;
  operating_Fz?: number;
  operating_Mx?: number;
  operating_My?: number;
  operating_Mz?: number;
};

export type DirectLoad = {
  lineNo?: string;

  thermalAnchor_Fx?: number;
  thermalAnchor_Fy?: number;
  thermalAnchor_Fz?: number;
  thermalAnchor_Mx?: number;
  thermalAnchor_My?: number;
  thermalAnchor_Mz?: number;

  thermalFriction_Fx?: number;
  thermalFriction_Fy?: number;
  thermalFriction_Fz?: number;

  windLoadX_Fx?: number;
  windLoadX_Fy?: number;
  windLoadX_Fz?: number;

  windLoadZ_Fx?: number;
  windLoadZ_Fy?: number;
  windLoadZ_Fz?: number;

  surgeLoad_Fx?: number;
  surgeLoad_Fy?: number;
  surgeLoad_Fz?: number;

  snowLoad?: number;
} & EquipmentLoad;

export type BlanketLoad = {
  id: number;
  selected: boolean;
  areaNo?: string;
  pr?: string;
  fromPortal?: string;
  toPortal?: string;
  tier?: number;
  intensity?: number;
  alongPercent?: number;
  acrossPercent?: number;
};

export type TSeismicLoad = {
  id: number;
  prNo: string;
  tierNo: number;
  nodeNo: number;
  seismicWeight: number;
};

export type LC_Condition = "Erection / shutdown" | "Hydrotest" | "Operating";

export type LoadCombination = {
  id: number;
  selected: boolean;
  CONDITION?: LC_Condition;
  LC_No: number;
  LC_Type?: string | undefined;
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
};

export type ModelItem = {
  isModelItem: boolean;
  project?: string;
  isAxesHelper?: boolean;
  model: string;
  name: string;
  orientation?: number;
  modelStart: Vector3;
  modelDir: Direction2;
  start: Vector3;
  end: Vector3;
  profile?: Section;
  releases?: Releases;
  intersect?: Vector3;

  isPipe?: boolean;
  lineNo?: string;

  lib?: string;
  nps?: string;
  schedule?: string;
  material?: string;

  od?: number;
  wt?: number;
};

export type TSelectedPlatform = {
  isModelPlatform: boolean;
  project?: string;
  model: string;
  name: string;
  modelStart: Vector3;
  modelDir: Direction2;
  start: Vector3;
  end: Vector3;
  data: TPlatformOF;
};

export type TSelectedPipe = {
  isFreePipe: boolean;
  isAxesHelper: boolean;
  pipeName: string;
  pipe?: FreePipe;
  start: Vector3;
  end: Vector3;
};

export type TSelectedPipeSupport = {
  isFreePipeSupport: boolean;
  lineNo: string;
  pipe: string;
  position: Vector3;
  support: TSupportDetail;
};

export type TSelectedPipeConnector = {
  id: number;
  isPipeConnector: boolean;
  lineNo: number;
  prev: string;
  nexts: string[];
  type: PipeConnectorType;
  connector: TPipingAccessory;
};

type GenericDesignCode = {
  deflectionRatio: number;
  klrMaxColumns: number;
  klrMaxBracings: number;
  klrMaxBeams: number;
  minStressRation?: number;
  stressRation: number;
  deflectionLengths?: TDeflectionLengthPR[];
};

export type IndianDesignCode = {
  cmx: number;
  cmy: number;
  cmz: number;
  effectiveLengths: IndianEffectiveLength[];
} & GenericDesignCode;

export type AmericanDesignCode = {
  cb: number;
  effectiveLengths: AmericanEffectiveLength[];
} & GenericDesignCode;

export type IndianEffectiveLength = {
  id: number;
  selected: boolean;
  pr?: string;
  element?: string;
  Ky: number;
  Kz: number;
  Ly: number;
  Lz: number;
};

export type AmericanEffectiveLength = {
  UNLB: number;
  UNLT: number;
} & IndianEffectiveLength;

export type TDeflectionLengthPR = {
  id: number;
  selected: boolean;
  model?: string;
  element?: string;
  dl: number;
};
