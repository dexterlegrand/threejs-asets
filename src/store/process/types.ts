import { Vector3, Vector2 } from "three";
import {
  PipeProfile,
  Material,
  TPipingFlange,
  TPipingAccessory,
  CableProfile,
} from "../data/types";
import {
  TValveType,
  TValveActuatorType,
  TValveControlType,
  TFlangeType,
  TFlangeLoads,
  TLongWeldType,
  PipeConnectorType,
  TEndConnectorDetails,
  TSupportDetail,
  TReducerType,
} from "../main/types";
import {
  TQuarter,
  TView,
} from "../../components/menu-bar/analysis-tab/piping/isometric-view/isometricTypes";

export enum EProcessActionTypes {
  LOAD_PROCESS = "LOAD_PROCESS",
  CREATE_PROCESS = "CREATE_PROCESS",
  RENAME_PROCESS = "RENAME_PROCESS",
  REMOVE_PROCESS = "REMOVE_PROCESS",
  SET_PROCESS = "SET_PROCESS",

  CREATE_ELEMENT = "CREATE_ELEMENT",
  CHANGE_ELEMENT = "CHANGE_ELEMENT",
  REMOVE_ELEMENT = "REMOVE_ELEMENT",
  SELECT_ELEMENT = "SELECT_ELEMENT",
  SELECT_ELEMENT_POINT_NOZZLE = "SELECT_ELEMENT_POINT_NOZZLE",
  SELECT_ELEMENT_NOZZLE = "SELECT_ELEMENT_NOZZLE",
  RELOCATE_ELEMENT = "RELOCATE_ELEMENT",

  CREATE_INSTR_ELEMENT = "CREATE_INSTR_ELEMENT",
  CHANGE_INSTR_ELEMENT = "CHANGE_INSTR_ELEMENT",
  CHANGE_INSTR_ELEMENT_FIELD = "CHANGE_INSTR_ELEMENT_FIELD",
  REMOVE_INSTR_ELEMENT = "REMOVE_INSTR_ELEMENT",
  SELECT_INSTR_ELEMENT = "SELECT_INSTR_ELEMENT",
  CONNECT_INSTR_ELEMENT = "CONNECT_INSTR_ELEMENT",

  CREATE_INSTR_LINE = "CREATE_INSTR_LINE",
  CHANGE_INSTR_LINE = "CHANGE_INSTR_LINE",
  REMOVE_INSTR_LINE = "REMOVE_INSTR_LINE",
  SELECT_INSTR_LINE = "SELECT_INSTR_LINE",

  SELECT_CONNECTION_POINT = "SELECT_CONNECTION_POINT",
  CHANGE_ELEMENTS_CONNECTIONS = "CHANGE_ELEMENTS_CONNECTIONS",
  CONNECT_ELEMENTS = "CONNECT_ELEMENTS",
  CREATE_CUSTOM_ELEMENTS_CONNECTION = "CREATE_CUSTOM_ELEMENTS_CONNECTION",
  CHANGE_CONNECTION_ACTION = "CHANGE_CONNECTION_ACTION",

  SELECT_PROCESS_LINE = "SELECT_PROCESS_LINE",
  CHANGE_PROCESS_LINE = "CHANGE_PROCESS_LINE",
  REMOVE_PROCESS_LINE = "REMOVE_PROCESS_LINE",

  CHANGE_ANALYSIS = "CHANGE_ANALYSIS",

  CHANGE_PROCESS_ISSUES = "CHANGE_PROCESS_ISSUES",
  CHANGE_PROCESS_IMPORTED = "CHANGE_PROCESS_IMPORTED",

  CHANGE_TITLES = "CHANGE_TITLES",
  CHANGE_REVISION = "CHANGE_REVISION",
}

export enum EProcessElementType {
  SOURCE = "SOURCE",
  SINK = "SINK",
  VALVE = "VALVE",
  PIPE = "PIPE",
  LEG = "LEG",
  MIX = "MIX",
  SPLIT = "SPLIT",
  HEADER = "HEADER",
  DRUM = "DRUM",
  SEPARATOR = "SEPARATOR",
  HORIZONTAL_DRUM = "HORIZONTAL_DRUM",
  DISTILLATION_COLUMN = "DISTILLATION_COLUMN",
  EXTRACTOR = "EXTRACTOR",
  TANK = "TANK",
  PUMP = "PUMP",
  EXPANDER = "EXPANDER",
  COMPRESSOR = "COMPRESSOR",
  PSV = "PSV",
  ENLARGER = "ENLARGER",

  PFR = "PFR",
  CSTR = "CSTR",
  RE = "RE",
  RC = "RC",
  RG = "RG",
  ST_HE_1P = "ST_HE_1P",
  ST_HE_2P = "ST_HE_2P",
  HEATER = "HEATER",
  COOLER = "COOLER",
  COLUMN = "COLUMN",
  ABSORPTION_COLUMN = "ABSORPTION_COLUMN",

  AIRPHIN_COOLER = "AIRPHIN_COOLER",
  SKID = "SKID",
  OTHER = "OTHER",

  AAM = "AAM",
  TAM = "TAM",
  AC = "AC",

  ES = "ES",
  BC = "C-1202_Bleacher Column",
  AV = "E-1200_Ammonia_vaporizer",
  AH = "E-1202_Air_Heater",
  WHB = "E-1203_Waste_Heat_Boiler",
  CC = "E-1205_Cooler_Condenser",

  NAH = "E-1206_Nitric_Acid_Heater",
  TGP = "E-1207_Tail_Gas_Preheater",
  IAF = "F-1200_Inlet_Air_Filter",
  BLOCK = "BLOCK",
  DAF = "F-1201_Discharge_Air_Filter",
  A_B_PUMP = "P-1201_A_B_Weak_acid_pump",
  PUMP_PRELUBE = "P-1201_pump_prelube",
  NOX_ABATOR = "Nox_Abator",
  AIC="AirCompressor",
  FireHose="FireHose",
}

export enum EPipeElementType {
  PIPE = "PIPE",
  ELBOW = "ELBOW",
  TEE = "TEE",
  CAP = "CAP",
  RETURN = "RETURN",
  REDUCER = "REDUCER",
  FLANGE = "FLANGE",
  VALVE = "VALVE",
  UDE = "UDE",
  SUPP = "SUPP",
  DIMENSION = "DIMENSION",
}
export enum EConnectionElementType {
  NOZZLE = "NOZZLE",
  RECTANGULAR_BP = "rectangular_base_plate",
  CIRCULAR_BP = "circular_base_plate",
  SKIRT = "skirt",
  LUG = "lug",
}

export enum ECabelElementType {
  CABEL = "CABEL",
  NOZZLE = "NOZZLE",
}

export enum ERoadElementType {
  ROAD = "ROAD",
  DRAIN = "DRAIN",
}

export enum EInstrumentationElementType {
  ELEMENT = "ELEMENT",
  INDICATOR = "INDICATOR",
  RECORDER = "RECORDER",
  TRANSMITTER = "TRANSMITTER",
  CONTROLLER = "CONTROLLER",
  TEMP_INDICATOR = "Temp Indicator",
  FLOW_INDICATOR = "Flow Indicator",
  TEMP_TRNASMITTER = "Temp Transmitter",
  FLOW_TRANSMITTER = "Flow Transmitter",
  PRESSURE_INDICATING_CONTROLLER = "Pressure Indicating 105",
  TEMP_RECORDER = "Temp Recorder",
  FLOW_RECORDER = "Flow Recorder",
  PRESSURE_RECORDING = "Pressure Recording 40",
  TEMP_CONTROLLER = "Temp Controller",
  FLOW_CONTROLLER = "Flow Controller",
  LEVEL_ALARM = "Level Alarm 25",
  LEVEL_INDICATOR = "Level Indicator",
  PRESSURE_INDICATOR = "Pressure Indicator",
  FLOW_ElEMENT = "Flow Element",
  LEVEL_TRNASMITTER = "Level Transmitter 65",
  PRESSURE_TRANSMITTER = "Pressure Transmitter 55",
  TEMPERATURE_ElEMENT = "Temperature Element",
  LEVEL_RECORDER = "Level Recorder 65",
  PRESSURE_RECORDER = "Pressure Recorder 55",
  LEVEL_GAUGE = "Level Gauge",
  LEVEL_CONTROLLER = "Level Controller 65",
  PRESSURE_CONTROLLER = "Pressure Controller 55",
  // ANALYZER_TRANSMITTER = "Analyzer Transmitter"
}
export type TProcessSelectedNozzle = {
  el: TProcessElement;
  point: TProcessElementPoint;
  isProcessNozzle: boolean;
};
export type TProcessState = {
  selected?: TProcessElement;
  selectedNozzle?: TProcessSelectedNozzle;
  selectedInstr?: TInstrumentationElement;
  selectedLine?: TProcessLine;
  selectedInstrLine?: TInstrumentationLine;
  selectedPoint?: TProcessElementPoint;
  processes: Map<string, TProcess>;
};

export type TProcess = {
  elements: Map<string, TProcessElement>;
  instrumentations?: TInstrumentationElement[];
  lines?: TProcessLine[];
  instrumentationLines?: TInstrumentationLine[];
  analysis: TProcessAnalysis;
  issues?: TProcessIssue[];
  imported?: TProcessIssue[];
  titles?: TProcessTitles;
  revisions?: TProcessRevision[];
};

export type TProcessTitles = {
  project?: string;
  createdBy?: string;
  customer?: string;
  title?: string;
  drawn?: string;
  checked?: string;
  approved?: string;
  date?: string;
  scale?: string;
  specificNotes?: string;
};

export type TProcessRevision = {
  id: number;
  date?: string;
  modification?: string;
  reviewedBy?: string;
  checkedBy?: string;
  approvedBy?: string;
};

export type TProcessLineOrder =
  | "XYZ"
  | "XZY"
  | "YXZ"
  | "YZX"
  | "ZXY"
  | "ZYX"
  | "CUSTOM";

export type TProcessLine = {
  id: number;
  order?: TProcessLineOrder;
  processLineNo?: number;
  pipelineNo?: number;
  cableNo?: number;
  from: string;
  to?: string;
  type: "LINE" | "PIPE" | "CABLE";
  initialLength?: number; // m
  q?: number; //just for trial bases
  prs?: number; //just for trial bases
  parameters?: {
    type?: TProcessPipeType | TInstrumentationLineType;
    nps?: string;
    schedule?: PipeProfile;
    material?: Material;
  };
  segments: TProcessLineSegment[];
};

export type TInstrumentationLine = {
  id: number;
  type: TInstrumentationLineType;
  connectionType: "ItoI" | "PtoI" | "LtoI";
  from: number | string;
  fromID?: number;
  to: number | string;
};

export type TProcessLineSegment = {
  id: number;
  start: Vector3;
  end: Vector3;
  isPopup?: boolean;
  locked?: boolean;
  parameters?: TProcessPipeData;
  instrumentationIDs?: number[];
  freePipeId?: number;
};

export type TProcessCableSegment = {
  id: number;
  start: Vector3;
  end: Vector3;
  locked?: boolean;
  parameters?: TProcessCableData;
  instrumentationIDs?: number[];
  freePipeId?: number;
};

export type TProcessIssue = {
  id: number;
  fileName: string;
  equipments: number;
  lines: number;
  date: string;
  revision: number;
  status: TProcessIssueStatus;
  state?: string;
};

export type TProcessImport = {
  id: number;
  fileName: string;
  equipments: number;
  lines: number;
  date?: string;
  revision: number;
  state: string;
  imported?: boolean;
};

export type TProcessIssueStatus = "Draft Copy" | "Issued";
export enum TProcessSupportType {
  LEG = "LEG",
  SKIRTS = "SKIRTS",
}
export enum TProcessBasePlateType {
  NONE = "NONE",
  CIRCULAR = "CIRCULAR",
  RECTANGULAR = "RECTANGULAR",
}
export type Lug = {
  position: Vector3;
  width: number;
  height: number;
  thickness: number;
};
export type Block = {
  position: Vector3;
  width: number;
  height: number;
};
export type PumpParamter = {
  motorDiam: number;
  motorLength: number;
  shaftLength: number;
  shaftDiam: number;
  heightSupport: number;

  pumpWidth: number;
  pumpDiam: number;
};
export type TProcessElement = {
  name: string;
  tag: string;
  isAxesHelper?: boolean;
  type: EProcessElementType;
  color?: string;
  position: {
    x: number;
    y: number;
    z: number;
  };
  rotationX?: number;
  rotation: number;
  rotationZ?: number;
  scale: number;
  opacity?:number;
  supportParameters?: {
    type?: TProcessSupportType;
    length?: number;
    diameter?: number;
    thickness?: number;
    basePlate?: TProcessBasePlateType;
    number?: number;
    upperLength?: number;
  };
  lugs?: Lug[];
  blocks?: Block[];
  pointsConfig: {
    isVariable: boolean;
    min: number;
  };
  dragged?: boolean;
  points: TProcessElementPoint[];
  details?: { [key: string]: any };
  parameters: { [key: string]: any };
  pumpParameters: PumpParamter;
  instrumentationIDs?: number[];
  kValue?: {
    Kx: number;
    Ky: number;
    Kz: number;
    KRx: number;
    KRy: number;
    KRz: number;
  }; // elasticisty of the element by Hammad;
};

export type TInstrumentationElement = {
  id: number;
  x: number;
  y: number;
  z: number;
  name: string;
  type: EInstrumentationElementType;
  combinedType?: EInstrumentationElementType;
  parent: string | number;
  parentID?: number;
  parentType: "PIPE" | "PROCESS";
  connected?: number;
};

export type TProcessElementPoint = {
  id: number;
  element?: string;
  isFixed?: boolean;
  isVertical?: boolean;
  isElectrical?: boolean;
  connectionType?: "START" | "END";
  height?: number;
  orientation?: number;
  startPosition: Vector3;
  generalPosition: Vector3;
  lib?: string;
  nps?: string;
  profile?: PipeProfile;
  od_MM?: number;
  wt_MM?: number;
  material?: Material;
  flangeType?: TFlangeType;
  flangeClass?: number;
  flange?: TPipingFlange;
  prevPipe?: number;
  nextPipe?: number;
  //k_value?: number; // added by hammad elastic value
};

// spring Element
export type TprocessSpringElement = {
  elementNumber: number;
  node1: number;
  node2: number;
  orientationX: number;
  orientationY: number;
  orientationZ: number;
  mode: number;
  kfactor: number;
};

export type TProcessElementPoint2D = {
  startPosition2D: Vector2;
  generalPosition2D: Vector2;
} & TProcessElementPoint;

export type TProcessLine2D = {
  segments2D: TProcessLineSegment2D[];
} & TProcessLine;

export type TProcessLineSegment2D = {
  view?: TView;
  quarter?: TQuarter;
  start2D: Vector2;
  end2D: Vector2;
} & TProcessLineSegment;

export type TProcessElement2D = {
  view?: TView;
  quarter?: TQuarter;
  position2D: Vector2;
  points2D: TProcessElementPoint2D[];
} & TProcessElement;

export type TInstrElement2D = {
  view?: TView;
  quarter?: TQuarter;
  position2D: Vector2;
} & TInstrumentationElement;

export type TInstrLine2D = {
  view?: TView;
  quarter?: TQuarter;
  start2D: Vector2;
  end2D: Vector2;
} & TInstrumentationLine;

export type TProcess2D = {
  elements: TProcessElement2D[];
  lines: TProcessLine2D[];
  instrs2D: TInstrElement2D[];
  instrLines2D: TInstrLine2D[];
  titles?: TProcessTitles;
  revisions?: TProcessRevision[];
};

export type TProcessSource = {
  details?: {
    tagNo: number;
    massFlow: number;
    moleFlow: number;
    volumetricFlow: number;
    pressure: number;
    temperature: number;
    vaporFracton: number;
    composition1: number;
    composition2: number;
    streamHeatFlow: number;
  };
} & TProcessElement;

export type TProcessSink = {
  details?: {
    tagNo: number;
    massFlow: number;
    moleFlow: number;
    volumetricFlow: number;
    pressure: number;
    temperature: number;
    vaporFracton: number;
    composition1: number;
    composition2: number;
    streamHeatFlow: number;
  };
} & TProcessElement;

export type TProcessValve = {
  parameters: {
    type?: TValveType;
    actuator?: TValveActuatorType;
    control?: TValveControlType;
  };
  details: {
    massFlow: number;
    flowCoefficient: number;
    position: number;
    vaporFraction: number;
    pressureDrop: number;
    flowType: number;
  };
  controller?: {
    type?: number;
    action?: number;
    setPoint?: number;
    controlRangeHighValue?: number;
    controlRangeLowValue?: number;
    processVariable?: number;
    output?: number;
  };
} & TProcessElement;

export type TProcessPipeType =
  | "Process Flow Line"
  | "Pneumatic (Air) Line"
  | "Hydraulic Line"
  | "Inert gas line"
  | "Electric heat tracing"
  | "Steam heat tracing";

export type TInstrumentationLineType =
  | "Instrument signal"
  | "Instrument capillary"
  | "Electrical wires";

export type TProcessPipe = {
  parameters: {
    type?: TProcessPipeType;
    nps?: string;
    schedule?: PipeProfile;
    diameter: number;
  };
  hydraulic?: {
    length: number;
    model: string;
    vol: number;
    elevationChange: number;
    pressDrop: number;
    pressDropper: number;
    velocity: number;
    press1: number;
    press2: number;
    temperature: number;
  };
};

export type TProcessPipeData = {
  vol?: number;
  pressDrop?: number;
  pressDropper?: number;
  velocity?: number;
  press2?: number;

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
  od?: number;
  thickness?: number;
  millTolerance?: number;
  longWeldType?: TLongWeldType;
  corrosionAllowance?: number;
  endConnectorType?: PipeConnectorType;
  endConnector?: TPipingAccessory;
  endConnectorDetails?: TEndConnectorDetails;
  reducerType?: TReducerType;
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

export type TProcessCableData = {
  vol?: number;
  pressDrop?: number;
  pressDropper?: number;
  velocity?: number;
  press2?: number;

  lib?: string;
  nps?: string;
  profile?: CableProfile;
  material?: Material;
  startFlangeType?: TFlangeType;
  startFlangeClass?: number;
  startFlange?: TPipingFlange;
  startFlangeLoads?: TFlangeLoads;
  endFlangeType?: TFlangeType;
  endFlangeClass?: number;
  endFlange?: TPipingFlange;
  endFlangeLoads?: TFlangeLoads;
  od?: number;
  thickness?: number;
  millTolerance?: number;
  longWeldType?: TLongWeldType;
  corrosionAllowance?: number;
  endConnectorType?: PipeConnectorType;
  endConnector?: TPipingAccessory;
  endConnectorDetails?: TEndConnectorDetails;
  reducerType?: TReducerType;
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

export type TStiffener = {
  id: number;
  offset: number;
  topPlateDiameter: number;
  topPlateThickness: number;
  bottomPlateDiameter: number;
  bottomPlateThickness: number;
  boltBCD: number;
  boltDiameter: number;
  boltNos: number;
  verticalPlateHeight: number;
  verticalPlateThickness: number;
  verticalPlateNos: number;
};

export type TProcessMix = {} & TProcessElement;

export type TProcessSplit = {} & TProcessElement;

export type TProcessTank = {
  parameters: {
    diameter: number;
    height: number;
  };
  stiffeners?: TStiffener[];
} & TProcessElement;

export type TProcessPump = {
  parameters: {
    inletElevation: number;
    outletElevation: number;
  };
  details: {
    massFlow: number;
    molarFlow: number;
    pressureRise: number;
    inletPressure: number;
    outletPressure: number;
    volumetricFlow: number;
    head: number;
    speed: number;
    efficiency: number;
    power: number;
  };
} & TProcessElement;

export type TProcessHeader = {
  parameters: {
    type?: TProcessPipeType;
    nps?: string;
    schedule?: PipeProfile;
    diameter: number;
  };
  stiffeners?: TStiffener[];
} & TProcessElement;

export type TProcessDrum = {
  parameters: {
    baseElevation: number;
  };
  stiffeners?: TStiffener[];
} & TProcessTank;

export type TProcessSeparator = {
  parameters: {
    diameter: number;
    length: number;
    centerElevation: number;
    outletElevation: number;
    offset: number;
  };
  stiffeners?: TStiffener[];
} & TProcessElement;

export type TProcessColumn = {
  parameters: {
    diameter: number;
    height: number;
    baseElevation: number;
    inletElevation: number;
    outletElevation: number;
  };
  stiffeners?: TStiffener[];
} & TProcessElement;

export type TProcessAAM = {
  parameters: {
    diameter: number;
    height: number;
  };
  stiffeners?: TStiffener[];
} & TProcessElement;

export type TProcessTAM = {
  parameters: {
    nps?: string;
    schedule?: PipeProfile;
    diameter: number;
    length: number;
  };
  stiffeners?: TStiffener[];
} & TProcessElement;

export type TProcessNox_Abator = {
  parameters: {
    diameter: number;
    height: number;
  };
} & TProcessElement;

export type TProcessAC = {
  parameters: {
    diameter: number;
    height: number;
  };
  stiffeners: TStiffener[];
} & TProcessElement;



export type TProcessAFD = {
  stiffeners: TStiffener[];
} & TProcessElement;

export type TProcessBC = {
  parameters: {
    diameter: number;
    height: number;
  };
  stiffeners: TStiffener[];
} & TProcessElement;

export type TProcessNAH = {
  stiffeners: TStiffener[];
} & TProcessElement;

export type TProcessTGP = {
  stiffeners: TStiffener[];
} & TProcessElement;

export type TProcessES = {
  parameters: {
    diameter1: number;
    diameter2: number;
    heightTot: number;
    heightBase: number;
    thickness: number;
  };
  stiffeners: TStiffener[];
} & TProcessElement;

export type TProcessCC = {
  stiffeners: TStiffener[];
} & TProcessElement;

export type TProcessAH = {
  stiffeners: TStiffener[];
} & TProcessElement;

export type TProcessWHB = {
  stiffeners: TStiffener[];
} & TProcessElement;

export type TProcessExtractor = {
  parameters: {
    diameter: number;
    height: number;
    baseElevation: number;
  };
  stiffeners?: TStiffener[];
} & TProcessElement;

export type TProcessAV = {
  stiffeners?: TStiffener[];
} & TProcessElement;

export type TProcessExpander = {
  parameters: {
    centerElevation: number;
  };
} & TProcessElement;

export type TProcessCompressor = {
  parameters: {
    centerElevation: number;
  };
} & TProcessElement;

export type TProcessPSV = {
  parameters: {
    inletElevation: number;
    outletElevation: number;
  };
} & TProcessElement;

export type TProcessIAF = {
  stiffeners?: TStiffener[];
} & TProcessElement;

export type TProcessDAF = {
  stiffeners?: TStiffener[];
} & TProcessElement;

export type TProcessEnlarger = {} & TProcessElement;

export type TProcessPFR = {} & TProcessElement;

export type TProcessCSTR = {
  stiffeners?: TStiffener[];
} & TProcessElement;

export type TProcessRE = {
  stiffeners?: TStiffener[];
} & TProcessElement;

export type TProcessABPUMP = {} & TProcessElement;

export type TProcessPUMPPRELUBE = {} & TProcessElement;

export type TProcessRC = {
  stiffeners?: TStiffener[];
} & TProcessElement;

export type TProcessRG = {
  stiffeners?: TStiffener[];
} & TProcessElement;

export type TProcessSTHE1P = {
  parameters: {
    diameter: number;
    length: number;
  };
  stiffeners?: TStiffener[];
} & TProcessElement;

export type TProcessSTHE2P = {
  parameters: {
    diameter: number;
    length: number;
  };
  stiffeners?: TStiffener[];
} & TProcessElement;

export type TProcessHeater = {
  stiffeners?: TStiffener[];
} & TProcessElement;

export type TProcessCooler = {
  stiffeners?: TStiffener[];
} & TProcessElement;

export type TProcessAbsorptionColumn = {
  parameters: {
    diameter: number;
    height: number;
  };
  stiffeners?: TStiffener[];
} & TProcessElement;

export type TProcessExhaustStack = {
  parameters: {
    diameter1: number;
    diameter2: number;
    heightTot: number;
    heightBase: number;
    thickness: number;
  };
  stiffeners?: TStiffener[];
} & TProcessElement;

export type TProcessAirphinCooler = {
  parameters: {
    width: number;
    height: number;
    length: number;
    legs: {
      id: number;
      width: number;
      height: number;
      length: number;
    }[];
  };
} & TProcessElement;

export type TProcessSkid = {
  parameters: {
    width: number;
    height: number;
    length: number;
  };
} & TProcessElement;

export type TProcessOther = {} & TProcessSkid;

export type TProcessHorizontalDrum = {
  parameters: {
    diameter: number;
    length: number;
  };
  stiffeners?: TStiffener[];
} & TProcessElement;

export type TProcessAnalysis = {
  energyBalances: TProcessEnergyBalance[];
  heatExchangers: TProcessHeatExchanger[];
  sourceAndSinkSummary: TSourceAndSinkSummary;
  mixerAndSplitSummary: TMixerAndSplitSummary;
  heaterAndCoolerSummary: THeaterAndCoolerSummary;
  headerSummary: THeaderSummary;
  drumSummary: TDrumSummary;
  separatorSummary: TSeparatorSummary;
  compressorSummary: TCompressorSummary;
  pfrSummary: TPFRSummary;
  RESummary: TRESummary;
  distillationColumnSummary: TDistillationColumnSummary;
  extractorSummary: TExtractorSummary;
  tankSummary: TTankSummary;
  expanderSummary: TExpanderSummary;
  PSVSummary: TPSVSummary;
  enlargerSummary: TEnlargerSummary;
  CSTRSummary: TCSTRSummary;
  RCSummary: TRCSummary;
  STHE2PSummary: TSTHE2PSummary;
  pumpSummary: TPumpSummary;
  valveSummary: TValveSummary;
  AAMSummary: TAAMSummary;
  TAMSummary: TTAMSummary;
  ACSummary: TACSummary;
  BCSummary: TBCSummary;
  ESSummary: TESSummary;
  AVSummary: TAVSummary;
  AHSummary: TAHSummary;
  WHBSummary: TWHBSummary;
  CCSummary: TCCSummary;
  NAHSummary: TNAHSummary;
  TGPSummary: TTGPSummary;
  IAFSummary: TIAFSummary;
  DAFSummary: TDAFSummary;
  ABPUMPSummary: TABPUMPSummary;
  PUMPPRELUBESummary: TPUMPPRELUBERSummary;
  AFDSummary: TAFDSummary;
  Nox_AbatorSummary: TProcessNox_AbatorSummary; 
};

export type TRowElement = {
  id: number;
  selected: boolean;
};

export type TProcessEnergyBalance = {
  stage: string;
  UOM: string;
  energyIn: number;
  energyOut: number;
} & TRowElement;

export type TProcessHeatExchanger = {
  HEID: string;
  parameter: string;
  UOM: string;
  value: number;
} & TRowElement;

type TSummaryField = { desc: string; label: string; UOM: string };

export type TSourceAndSinkSummary = {
  massFlow: TSummaryField;
  moleFlow: TSummaryField;
  volumetricFlow: TSummaryField;
  pressure: TSummaryField;
  temperature: TSummaryField;
  vaporFracton: TSummaryField;
  composition1: TSummaryField;
  composition2: TSummaryField;
  streamHeatFlow: TSummaryField;
};

export type TMixerAndSplitSummary = {
  volumen: TSummaryField;
  diameter: TSummaryField;
  orientation: TSummaryField;
  pressure: TSummaryField;
  ratioSum: TSummaryField;
};

export type THeaterAndCoolerSummary = {
  massFlow: TSummaryField;
  volumen: TSummaryField;
  diameter: TSummaryField;
  tMin: TSummaryField;
  tMax: TSummaryField;
  vf: TSummaryField;
  p: TSummaryField;
  dp: TSummaryField;
  t1: TSummaryField;
  t2: TSummaryField;
  duty: TSummaryField;
};

export type THeaderSummary = {
  volumen: TSummaryField;
  pressure: TSummaryField;
  residenceTime: TSummaryField;
  heatDuty: TSummaryField;
};

export type TDrumSummary = {
  length: TSummaryField;
  diameter: TSummaryField;
  pressure: TSummaryField;
  temperature: TSummaryField;
  vaporFracton: TSummaryField;
  levelFraction: TSummaryField;
};

export type TSeparatorSummary = {
  length: TSummaryField;
  diameter: TSummaryField;
  pressure: TSummaryField;
  temperature: TSummaryField;
  lengthOfBoot: TSummaryField;
  diameterOfBoot: TSummaryField;
};

export type TCompressorSummary = {
  pressure1: TSummaryField;
  pressure2: TSummaryField;
  pressureDrop: TSummaryField;
  pressureRatio: TSummaryField;
  temperature1: TSummaryField;
  temperature2: TSummaryField;
  powerGenerate: TSummaryField;
  rotationSpeed: TSummaryField;
  volumentricFlow: TSummaryField;
  molarFlow: TSummaryField;
  massFlow: TSummaryField;
  head: TSummaryField;
  area: TSummaryField;
  efficiency: TSummaryField;
  thermalOperation: TSummaryField;
};

export type TPFRSummary = {
  thermalOperation: TSummaryField;
  numberOfTubes: TSummaryField;
  length: TSummaryField;
  diameter: TSummaryField;
  volumen: TSummaryField;
  residenceTime: TSummaryField;
  basisReactorRate: TSummaryField;
  catalystLoading: TSummaryField;
  catalystParticleDensity: TSummaryField;
  catalystVoidFraction: TSummaryField;
  catalystHeatCapacity: TSummaryField;
  pressureDrope: TSummaryField;
  deltaT: TSummaryField;
  reactorHeatDuty: TSummaryField;
  conversion: TSummaryField;
};

export type TRESummary = {
  thermalOperation: TSummaryField;
  length: TSummaryField;
  diameter: TSummaryField;
  volumen: TSummaryField;
  residenceTime: TSummaryField;
  pressure: TSummaryField;
  pressureDrope: TSummaryField;
  temperature: TSummaryField;
  temperatureDrope: TSummaryField;
  reactorHeatDuty: TSummaryField;
  equilibriumConversion: TSummaryField;
};

export type TDistillationColumnSummary = {
  nstage: TSummaryField;
  feedStage: TSummaryField;
  diameter: TSummaryField;
  height: TSummaryField;
  pressure: TSummaryField;
  stagePressureDrop: TSummaryField;
  temperature: TSummaryField;
  efficiency: TSummaryField;
  refluxRatio: TSummaryField;
  boilupRatio: TSummaryField;
  condencerTemperature: TSummaryField;
  condencerPressureTop: TSummaryField;
  condencerDuty: TSummaryField;
  condencerDiameter: TSummaryField;
  condencerLength: TSummaryField;
  reboilerSectionTemperature: TSummaryField;
  reboilerSectionPressureBottom: TSummaryField;
  reboilerSectionDuty: TSummaryField;
  reboilerSectionDiameter: TSummaryField;
  reboilerSectionLength: TSummaryField;
};

export type TExtractorSummary = {
  nstage: TSummaryField;
  diameter: TSummaryField;
  height: TSummaryField;
  pressure: TSummaryField;
  stagePDrop: TSummaryField;
  temperature: TSummaryField;
  efficiency: TSummaryField;
  productRateL1: TSummaryField;
  productRateL2: TSummaryField;
};

export type TTankSummary = {
  length: TSummaryField;
  diameter: TSummaryField;
  volumen: TSummaryField;
  pressure: TSummaryField;
  temperature: TSummaryField;
  fluidTimeResidence: TSummaryField;
};

export type TExpanderSummary = {
  pressure1: TSummaryField;
  pressure2: TSummaryField;
  pressureDrop: TSummaryField;
  temperature1: TSummaryField;
  temperature2: TSummaryField;
  powerGenerate: TSummaryField;
  rotationSpeed: TSummaryField;
  volumentricFlow: TSummaryField;
  area: TSummaryField;
  efficiency: TSummaryField;
  thermalOperation: TSummaryField;
};

export type TPSVSummary = {
  massFlow: TSummaryField;
  setPressureDiff: TSummaryField;
  backPressure: TSummaryField;
  orificeArea: TSummaryField;
  overPressure: TSummaryField;
};

export type TEnlargerSummary = {
  upstreamDiameter: TSummaryField;
  downstreamDiameter: TSummaryField;
  enlargerAngle: TSummaryField;
  pressureDrop: TSummaryField;
  heatLoss: TSummaryField;
};

export type TCSTRSummary = {
  thermalOperation: TSummaryField;
  length: TSummaryField;
  diameter: TSummaryField;
  volumen: TSummaryField;
  residenceTime: TSummaryField;
  basisReactorTime: TSummaryField;
  catalystLoading: TSummaryField;
  catalystParticleDensity: TSummaryField;
  catalystVoidFraction: TSummaryField;
  catalystHeatCapacity: TSummaryField;
  pressure: TSummaryField;
  temperature: TSummaryField;
  temperatureDrope: TSummaryField;
  reactorHeatDuty: TSummaryField;
  conversion: TSummaryField;
  vaporFraction: TSummaryField;
};

export type TRCSummary = {
  thermalOperation: TSummaryField;
  length: TSummaryField;
  diameter: TSummaryField;
  volumen: TSummaryField;
  residenceTime: TSummaryField;
  pressure: TSummaryField;
  pressureDrope: TSummaryField;
  temperature: TSummaryField;
  temperatureDrope: TSummaryField;
  reactorHeatDuty: TSummaryField;
  conversion: TSummaryField;
};

export type TSTHE2PSummary = {
  oec: TSummaryField;
  area: TSummaryField;
  tc: TSummaryField;
  duty: TSummaryField;
  efficiency: TSummaryField;
  vssf: TSummaryField;
  vtsf: TSummaryField;
  tsi: TSummaryField;
  tso: TSummaryField;
  tti: TSummaryField;
  tto: TSummaryField;
  vfso: TSummaryField;
  vfto: TSummaryField;
  shellPasses: TSummaryField;
  shellDin: TSummaryField;
  shellRfi: TSummaryField;
  shellBaffleSpacing: TSummaryField;
  tubesDin: TSummaryField;
  tubesDext: TSummaryField;
  tubesL: TSummaryField;
  tubesRfo: TSummaryField;
  tubesR: TSummaryField;
  tubesPerShell: TSummaryField;
  tubesSpacing: TSummaryField;
  tubeLayour: TSummaryField;
  fluidInTubes: TSummaryField;
};

export type TPumpSummary = {
  massFlow: TSummaryField;
  molarFlow: TSummaryField;
  pressureRise: TSummaryField;
  inletPressure: TSummaryField;
  outletPressure: TSummaryField;
  volumetricFlow: TSummaryField;
  head: TSummaryField;
  speed: TSummaryField;
  efficiency: TSummaryField;
  power: TSummaryField;
};

export type TValveSummary = {
  massFlow: TSummaryField;
  flowCoefficient: TSummaryField;
  position: TSummaryField;
  vaporFraction: TSummaryField;
  pressureDrop: TSummaryField;
  flowType: TSummaryField;
};

export type TAAMSummary = {
  material: TSummaryField;
  type: TSummaryField;
  temperature_mix_operating: TSummaryField;
  temperature_mix_design: TSummaryField;
  pressure_operating: TSummaryField;
  pressure_design: TSummaryField;
  normal_operating_gas_flow_ammonia: TSummaryField;
  normal_operating_gas_flow_ammonia_attemp: TSummaryField;
  normal_operating_gas_flow_air: TSummaryField;
  normal_operating_gas_flow_air_attemp: TSummaryField;
  allowable_pressure_drop: TSummaryField;
  materials_of_construction_Shell_and_internal_comps: TSummaryField;
  materials_of_construction_flanges: TSummaryField;
  code_requirements: TSummaryField;
};

export type TTAMSummary = {
  material_handled: TSummaryField;
  type: TSummaryField;
  temperature_mix_operating: TSummaryField;
  temperature_mix_design: TSummaryField;
  pressure_operating: TSummaryField;
  pressure_design: TSummaryField;
  normal_operating_gas_flows_ammonia: TSummaryField;
  normal_operating_gas_flows_ammonia_attemp: TSummaryField;
  normal_operating_gas_flows_tail_gas: TSummaryField;
  normal_operating_gas_flows_tail_gas_attemp: TSummaryField;
  mixing: TSummaryField;
  sample_size: TSummaryField;
  allowable_pressure_drop: TSummaryField;
  materials_of_construction_Shell_and_internal_comps: TSummaryField;
  materials_of_construction_flanges: TSummaryField;
  code_requirements: TSummaryField;
};

export type TACSummary = {
  material_handled: TSummaryField;
  diameter: TSummaryField;
  height: TSummaryField;
  design_pressure: TSummaryField;
  design_temp: TSummaryField;
  tray_spacing: TSummaryField;
  no_of_absorption_tray: TSummaryField;
  no_of_bleach_trays: TSummaryField;
  corrosion_allowance: TSummaryField;
  operating_pressure: TSummaryField;
  operating_temp: TSummaryField;
  earthquake_zone: TSummaryField;
  windload: TSummaryField;
  tray_type: TSummaryField;
  no_of_caps: TSummaryField;
  pitch: TSummaryField;
  no_of_rows: TSummaryField;
  weir_height: TSummaryField;
  weephole: TSummaryField;
  level_max: TSummaryField;
  downcomer: TSummaryField;
  cap_type: TSummaryField;
  cap_od: TSummaryField;
  cap_bwg: TSummaryField;
  cap_height: TSummaryField;
  no_slots: TSummaryField;
  slots_width: TSummaryField;
  slots_height: TSummaryField;
  skirt_height: TSummaryField;
  skirt_clear: TSummaryField;
  riser_od: TSummaryField;
  riser_bwg: TSummaryField;
  riser_height: TSummaryField;
  total_area: TSummaryField;
  cooling_coil_bwg: TSummaryField;
  cooling_coil_od: TSummaryField;
  cooling_coil_material: TSummaryField;
  code_requirement: TSummaryField;
  material_of_construction_shell_head_coil: TSummaryField;
  material_construction_skirt_base_ring: TSummaryField;
  material_of_construction_clips_ladders_platforms: TSummaryField;
  manways: TSummaryField;
};

export type TESSummary = {
  operation: TSummaryField;
  material: TSummaryField;
  flow_rate: TSummaryField;
  operating_temperature: TSummaryField;
  diameter_lower: TSummaryField;
  diameter_upper: TSummaryField;
  height: TSummaryField;
  material_of_construction: TSummaryField;
};

export type TAVSummary = {
  size: TSummaryField;
  type: TSummaryField;
  connected_in: TSummaryField;
  surf_per_unit: TSummaryField;
  shells_per_unit: TSummaryField;
  surf_per_shell: TSummaryField;
  fluid_entering_shell_side: TSummaryField;
  fluid_entering_tube_side: TSummaryField;
  condensable_vapor_shell_side: TSummaryField;
  condensable_vapor_tube_side: TSummaryField;
  non_condensable_vapor_shell_side: TSummaryField;
  non_condensable_vapor_tube_side: TSummaryField;
  liquid_shell_side: TSummaryField;
  liquid_tube_side: TSummaryField;
  total_fluid_enter_shell_side: TSummaryField;
  total_fluid_enter_tube_side: TSummaryField;
  fluid_vapor_or_cond_shell_side: TSummaryField;
  fluid_vapor_or_cond_tube_side: TSummaryField;
  gravity_liquid_shell_side: TSummaryField;
  gravity_liquid_tube_side: TSummaryField;
  viscosity_shell_side: TSummaryField;
  viscosity_tube_side: TSummaryField;
  molecular_weight_shell_side: TSummaryField;
  molecular_weight_tube_side: TSummaryField;
  specific_heat_shell_side: TSummaryField;
  specific_heat_tube_side: TSummaryField;
  latent_heat_shell_side: TSummaryField;
  latent_heat_tube_side: TSummaryField;
  thermal_cond_shell_side: TSummaryField;
  thermal_cond_tube_side: TSummaryField;
  fouling_resist_shell_side: TSummaryField;
  fouling_resist_tube_side: TSummaryField;
  temperature_in_shell_side: TSummaryField;
  temperature_in_tube_side: TSummaryField;
  temperature_out_shell_side: TSummaryField;
  temperature_out_tube_side: TSummaryField;
  operating_pressure_shell_side: TSummaryField;
  operating_pressure_tube_side: TSummaryField;
  number_of_passes_shell_side: TSummaryField;
  number_of_passes_tube_side: TSummaryField;
  velocity_shell_side: TSummaryField;
  velocity_tube_side: TSummaryField;
  pressure_drop_shell_side: TSummaryField;
  pressure_drop_tube_side: TSummaryField;
  design_pressure_shell_side: TSummaryField;
  design_pressure_tube_side: TSummaryField;
  test_pressure_shell_side: TSummaryField;
  test_pressure_tube_side: TSummaryField;
  design_temperature_shell_side: TSummaryField;
  design_temperature_tube_side: TSummaryField;
  heat_exchanged: TSummaryField;
  trans_coef_: TSummaryField;
  mtd: TSummaryField;
  trans_coef_clean: TSummaryField;
  tubes: TSummaryField;
  no: TSummaryField;
  od: TSummaryField;
  bwg: TSummaryField;
  length: TSummaryField;
  pitch: TSummaryField;
  shell: TSummaryField;
  id: TSummaryField;
  thickness: TSummaryField;
  shell_cover: TSummaryField;
  floating_head_cover: TSummaryField;
  channel: TSummaryField;
  channel_cover: TSummaryField;
  tube_sheets_stationary: TSummaryField;
  floating: TSummaryField;
  baffles_cross: TSummaryField;
  baffles_type: TSummaryField;
  baffles_thickness: TSummaryField;
  baffles_impingement: TSummaryField;
  tube_fastening: TSummaryField;
  tube_supports: TSummaryField;
  tube_thickness: TSummaryField;
  gaskets: TSummaryField;
  shell_in_: TSummaryField;
  shell_out: TSummaryField;
  shell_series: TSummaryField;
  channel_in: TSummaryField;
  channel_out: TSummaryField;
  channel_series: TSummaryField;
  corrosion_allowance_shell_side: TSummaryField;
  corr_allowance_tube_side: TSummaryField;
  code_requirements: TSummaryField;
};

export type TAHSummary = {
  size: TSummaryField;
  type: TSummaryField;
  connected_in: TSummaryField;
  surf_per_unit: TSummaryField;
  shells_per_unit: TSummaryField;
  surf_per_shell: TSummaryField;
  fluid_entering_shell_side: TSummaryField;
  fluid_entering_tube_side: TSummaryField;
  condensable_vapor_shell_side: TSummaryField;
  condensable_vapor_tube_side: TSummaryField;
  non_condensable_vapor_shell_side: TSummaryField;
  non_condensable_vapor_tube_side: TSummaryField;
  liquid_shell_side: TSummaryField;
  liquid_tube_side: TSummaryField;
  total_fluid_enter_shell_side: TSummaryField;
  total_fluid_enter_tube_side: TSummaryField;
  fluid_vapor_or_cond_shell_side: TSummaryField;
  fluid_vapor_or_cond_tube_side: TSummaryField;
  gravity_liquid_shell_side: TSummaryField;
  gravity_liquid_tube_side: TSummaryField;
  viscosity_shell_side: TSummaryField;
  viscosity_tube_side: TSummaryField;
  molecular_weight_shell_side: TSummaryField;
  molecular_weight_tube_side: TSummaryField;
  specific_heat_shell_side: TSummaryField;
  specific_heat_tube_side: TSummaryField;
  latent_heat_shell_side: TSummaryField;
  latent_heat_tube_side: TSummaryField;
  thermal_cond_shell_side: TSummaryField;
  thermal_cond_tube_side: TSummaryField;
  fouling_resist_shell_side: TSummaryField;
  fouling_resist_tube_side: TSummaryField;
  temperature_in_shell_side: TSummaryField;
  temperature_in_tube_side: TSummaryField;
  temperature_out_shell_side: TSummaryField;
  temperature_out_tube_side: TSummaryField;
  operating_pressure_shell_side: TSummaryField;
  operating_pressure_tube_side: TSummaryField;
  number_of_passes_shell_side: TSummaryField;
  number_of_passes_tube_side: TSummaryField;
  velocity_shell_side: TSummaryField;
  velocity_tube_side: TSummaryField;
  pressure_drop_shell_side: TSummaryField;
  pressure_drop_tube_side: TSummaryField;
  design_pressure_shell_side: TSummaryField;
  design_pressure_tube_side: TSummaryField;
  test_pressure_shell_side: TSummaryField;
  test_pressure_tube_side: TSummaryField;
  design_temperature_shell_side: TSummaryField;
  design_temperature_tube_side: TSummaryField;
  heat_exchanged: TSummaryField;
  trans_coef: TSummaryField;
  mtd: TSummaryField;
  trans_coef_clean: TSummaryField;
  tubes: TSummaryField;
  no: TSummaryField;
  od: TSummaryField;
  bwg: TSummaryField;
  length: TSummaryField;
  pitch: TSummaryField;
  shell: TSummaryField;
  id: TSummaryField;
  thickness: TSummaryField;
  shell_cover: TSummaryField;
  floating_head_cover: TSummaryField;
  channel: TSummaryField;
  channel_cover: TSummaryField;
  tube_sheets_stationary: TSummaryField;
  floating: TSummaryField;
  baffles_cross: TSummaryField;
  baffles_type: TSummaryField;
  baffles_thickness: TSummaryField;
  baffles_impingement: TSummaryField;
  tube_fastening: TSummaryField;
  tube_supports: TSummaryField;
  tube_thickness: TSummaryField;
  gaskets: TSummaryField;
  shell_in: TSummaryField;
  shell_out: TSummaryField;
  shell_series: TSummaryField;
  channel_in: TSummaryField;
  channel_out: TSummaryField;
  channel_series: TSummaryField;
  corrosion_allowance_shell_side: TSummaryField;
  corr_allowance_tube_side: TSummaryField;
  code_requirements: TSummaryField;
};

export type TWHBSummary = {
  size: TSummaryField;
  type: TSummaryField;
  connected_in: TSummaryField;
  surf_per_unit: TSummaryField;
  shells_per_unit: TSummaryField;
  surf_per_shell: TSummaryField;
  fluid_entering_shell_side: TSummaryField;
  fluid_entering_tube_side: TSummaryField;
  condensable_vapor_shell_side: TSummaryField;
  condensable_vapor_tube_side: TSummaryField;
  non_condensable_vapor_shell_side: TSummaryField;
  non_condensable_vapor_tube_side: TSummaryField;
  liquid_shell_side: TSummaryField;
  liquid_tube_side: TSummaryField;
  total_fluid_enter_shell_side: TSummaryField;
  total_fluid_enter_tube_side: TSummaryField;
  fluid_vapor_or_cond_shell_side: TSummaryField;
  fluid_vapor_or_cond_tube_side: TSummaryField;
  gravity_liquid_shell_side: TSummaryField;
  gravity_liquid_tube_side: TSummaryField;
  viscosity_shell_side: TSummaryField;
  viscosity_tube_side: TSummaryField;
  molecular_weight_shell_side: TSummaryField;
  molecular_weight_tube_side: TSummaryField;
  specific_heat_shell_side: TSummaryField;
  specific_heat_tube_side: TSummaryField;
  latent_heat_shell_side: TSummaryField;
  latent_heat_tube_side: TSummaryField;
  thermal_cond_shell_side: TSummaryField;
  thermal_cond_tube_side: TSummaryField;
  fouling_resist_shell_side: TSummaryField;
  fouling_resist_tube_side: TSummaryField;
  temperature_in_shell_side: TSummaryField;
  temperature_in_tube_side: TSummaryField;
  temperature_out_shell_side: TSummaryField;
  temperature_out_tube_side: TSummaryField;
  operating_pressure_shell_side: TSummaryField;
  operating_pressure_tube_side: TSummaryField;
  number_of_passes_shell_side: TSummaryField;
  number_of_passes_tube_side: TSummaryField;
  velocity_shell_side: TSummaryField;
  velocity_tube_side: TSummaryField;
  pressure_drop_shell_side: TSummaryField;
  pressure_drop_tube_side: TSummaryField;
  design_pressure_shell_side: TSummaryField;
  design_pressure_tube_side: TSummaryField;
  test_pressure_shell_side: TSummaryField;
  test_pressure_tube_side: TSummaryField;
  design_temperature_shell_side: TSummaryField;
  design_temperature_tube_side: TSummaryField;
  heat_exchanged: TSummaryField;
  trans_coef: TSummaryField;
  mtd: TSummaryField;
  trans_coef_clean: TSummaryField;
  tubes: TSummaryField;
  no: TSummaryField;
  od: TSummaryField;
  bwg: TSummaryField;
  length: TSummaryField;
  pitch: TSummaryField;
  shell: TSummaryField;
  id: TSummaryField;
  thickness: TSummaryField;
  shell_cover: TSummaryField;
  floating_head_cover: TSummaryField;
  channel: TSummaryField;
  channel_cover: TSummaryField;
  tube_sheets_stationary: TSummaryField;
  floating: TSummaryField;
  baffles_cross: TSummaryField;
  baffles_type: TSummaryField;
  baffles_thickness: TSummaryField;
  baffles_impingement: TSummaryField;
  tube_fastening: TSummaryField;
  tube_supports: TSummaryField;
  tube_thickness: TSummaryField;
  gaskets: TSummaryField;
  shell_in: TSummaryField;
  shell_out: TSummaryField;
  shell_series: TSummaryField;
  channel_in: TSummaryField;
  channel_out: TSummaryField;
  channel_series: TSummaryField;
  corrosion_allowance_shell_side: TSummaryField;
  corr_allowance_tube_side: TSummaryField;
  code_requirements: TSummaryField;
};

export type TCCSummary = {
  size: TSummaryField;
  type: TSummaryField;
  connected_in: TSummaryField;
  surf_per_unit: TSummaryField;
  shells_per_unit: TSummaryField;
  surf_per_shell: TSummaryField;
  fluid_entering_shell_side: TSummaryField;
  fluid_entering_tube_side: TSummaryField;
  condensable_vapor_shell_side: TSummaryField;
  condensable_vapor_tube_side: TSummaryField;
  non_condensable_vapor_shell_side: TSummaryField;
  non_condensable_vapor_tube_side: TSummaryField;
  liquid_shell_side: TSummaryField;
  liquid_tube_side: TSummaryField;
  total_fluid_enter_shell_side: TSummaryField;
  total_fluid_enter_tube_side: TSummaryField;
  fluid_vapor_or_cond_shell_side: TSummaryField;
  fluid_vapor_or_cond_tube_side: TSummaryField;
  gravity_liquid_shell_side: TSummaryField;
  gravity_liquid_tube_side: TSummaryField;
  viscosity_shell_side: TSummaryField;
  viscosity_tube_side: TSummaryField;
  molecular_weight_shell_side: TSummaryField;
  molecular_weight_tube_side: TSummaryField;
  specific_heat_shell_side: TSummaryField;
  specific_heat_tube_side: TSummaryField;
  latent_heat_shell_side: TSummaryField;
  latent_heat_tube_side: TSummaryField;
  thermal_cond_shell_side: TSummaryField;
  thermal_cond_tube_side: TSummaryField;
  fouling_resist_shell_side: TSummaryField;
  fouling_resist_tube_side: TSummaryField;
  temperature_in_shell_side: TSummaryField;
  temperature_in_tube_side: TSummaryField;
  temperature_out_shell_side: TSummaryField;
  temperature_out_tube_side: TSummaryField;
  operating_pressure_shell_side: TSummaryField;
  operating_pressure_tube_side: TSummaryField;
  number_of_passes_shell_side: TSummaryField;
  number_of_passes_tube_side: TSummaryField;
  velocity_shell_side: TSummaryField;
  velocity_tube_side: TSummaryField;
  pressure_drop_shell_side: TSummaryField;
  pressure_drop_tube_side: TSummaryField;
  design_pressure_shell_side: TSummaryField;
  design_pressure_tube_side: TSummaryField;
  test_pressure_shell_side: TSummaryField;
  test_pressure_tube_side: TSummaryField;
  design_temperature_shell_side: TSummaryField;
  design_temperature_tube_side: TSummaryField;
  heat_exchanged: TSummaryField;
  trans_coef: TSummaryField;
  mtd: TSummaryField;
  trans_coef_clean: TSummaryField;
  tubes: TSummaryField;
  no: TSummaryField;
  od: TSummaryField;
  bwg: TSummaryField;
  length: TSummaryField;
  pitch: TSummaryField;
  shell: TSummaryField;
  id: TSummaryField;
  thickness: TSummaryField;
  shell_cover: TSummaryField;
  floating_head_cover: TSummaryField;
  channel: TSummaryField;
  channel_cover: TSummaryField;
  tube_sheets_stationary: TSummaryField;
  floating: TSummaryField;
  baffles_cross: TSummaryField;
  baffles_type: TSummaryField;
  baffles_thickness: TSummaryField;
  baffles_impingement: TSummaryField;
  tube_fastening: TSummaryField;
  tube_supports: TSummaryField;
  tube_thickness: TSummaryField;
  gaskets: TSummaryField;
  shell_in: TSummaryField;
  shell_out: TSummaryField;
  shell_series: TSummaryField;
  channel_in: TSummaryField;
  channel_out: TSummaryField;
  channel_series: TSummaryField;
  corrosion_allowance_shell_side: TSummaryField;
  corr_allowance_tube_side: TSummaryField;
  code_requirements: TSummaryField;
};

export type TNAHSummary = {
  size: TSummaryField;
  type: TSummaryField;
  connected_in: TSummaryField;
  surf_per_unit: TSummaryField;
  shells_per_unit: TSummaryField;
  surf_per_shell: TSummaryField;
  fluid_entering_shell_side: TSummaryField;
  fluid_entering_tube_side: TSummaryField;
  condensable_vapor_shell_side: TSummaryField;
  condensable_vapor_tube_side: TSummaryField;
  non_condensable_vapor_shell_side: TSummaryField;
  non_condensable_vapor_tube_side: TSummaryField;
  liquid_shell_side: TSummaryField;
  liquid_tube_side: TSummaryField;
  total_fluid_enter_shell_side: TSummaryField;
  total_fluid_enter_tube_side: TSummaryField;
  fluid_vapor_or_cond_shell_side: TSummaryField;
  fluid_vapor_or_cond_tube_side: TSummaryField;
  gravity_liquid_shell_side: TSummaryField;
  gravity_liquid_tube_side: TSummaryField;
  viscosity_shell_side: TSummaryField;
  viscosity_tube_side: TSummaryField;
  molecular_weight_shell_side: TSummaryField;
  molecular_weight_tube_side: TSummaryField;
  specific_heat_shell_side: TSummaryField;
  specific_heat_tube_side: TSummaryField;
  latent_heat_shell_side: TSummaryField;
  latent_heat_tube_side: TSummaryField;
  thermal_cond_shell_side: TSummaryField;
  thermal_cond_tube_side: TSummaryField;
  fouling_resist_shell_side: TSummaryField;
  fouling_resist_tube_side: TSummaryField;
  temperature_in_shell_side: TSummaryField;
  temperature_in_tube_side: TSummaryField;
  temperature_out_shell_side: TSummaryField;
  temperature_out_tube_side: TSummaryField;
  operating_pressure_shell_side: TSummaryField;
  operating_pressure_tube_side: TSummaryField;
  number_of_passes_shell_side: TSummaryField;
  number_of_passes_tube_side: TSummaryField;
  velocity_shell_side: TSummaryField;
  velocity_tube_side: TSummaryField;
  pressure_drop_shell_side: TSummaryField;
  pressure_drop_tube_side: TSummaryField;
  design_pressure_shell_side: TSummaryField;
  design_pressure_tube_side: TSummaryField;
  test_pressure_shell_side: TSummaryField;
  test_pressure_tube_side: TSummaryField;
  design_temperature_shell_side: TSummaryField;
  design_temperature_tube_side: TSummaryField;
  heat_exchanged: TSummaryField;
  trans_coef: TSummaryField;
  mtd: TSummaryField;
  trans_coef_clean: TSummaryField;
  tubes: TSummaryField;
  no: TSummaryField;
  od: TSummaryField;
  bwg: TSummaryField;
  length: TSummaryField;
  pitch: TSummaryField;
  shell: TSummaryField;
  id: TSummaryField;
  thickness: TSummaryField;
  shell_cover: TSummaryField;
  floating_head_cover: TSummaryField;
  channel: TSummaryField;
  channel_cover: TSummaryField;
  tube_sheets_stationary: TSummaryField;
  floating: TSummaryField;
  baffles_cross: TSummaryField;
  baffles_type: TSummaryField;
  baffles_thickness: TSummaryField;
  baffles_impingement: TSummaryField;
  tube_fastening: TSummaryField;
  tube_supports: TSummaryField;
  tube_thickness: TSummaryField;
  gaskets: TSummaryField;
  shell_in: TSummaryField;
  shell_out: TSummaryField;
  shell_series: TSummaryField;
  channel_in: TSummaryField;
  channel_out: TSummaryField;
  channel_series: TSummaryField;
  corrosion_allowance_shell_side: TSummaryField;
  corr_allowance_tube_side: TSummaryField;
  code_requirements: TSummaryField;
};
export type TTGPSummary = {
  size: TSummaryField;
  type: TSummaryField;
  connected_in: TSummaryField;
  surf_per_unit: TSummaryField;
  shells_per_unit: TSummaryField;
  surf_per_shell: TSummaryField;
  fluid_entering_shell_side: TSummaryField;
  fluid_entering_tube_side: TSummaryField;
  condensable_vapor_shell_side: TSummaryField;
  condensable_vapor_tube_side: TSummaryField;
  non_condensable_vapor_shell_side: TSummaryField;
  non_condensable_vapor_tube_side: TSummaryField;
  liquid_shell_side: TSummaryField;
  liquid_tube_side: TSummaryField;
  total_fluid_enter_shell_side: TSummaryField;
  total_fluid_enter_tube_side: TSummaryField;
  fluid_vapor_or_cond_shell_side: TSummaryField;
  fluid_vapor_or_cond_tube_side: TSummaryField;
  gravity_liquid_shell_side: TSummaryField;
  gravity_liquid_tube_side: TSummaryField;
  viscosity_shell_side: TSummaryField;
  viscosity_tube_side: TSummaryField;
  molecular_weight_shell_side: TSummaryField;
  molecular_weight_tube_side: TSummaryField;
  specific_heat_shell_side: TSummaryField;
  specific_heat_tube_side: TSummaryField;
  latent_heat_shell_side: TSummaryField;
  latent_heat_tube_side: TSummaryField;
  thermal_cond_shell_side: TSummaryField;
  thermal_cond_tube_side: TSummaryField;
  fouling_resist_shell_side: TSummaryField;
  fouling_resist_tube_side: TSummaryField;
  temperature_in_shell_side: TSummaryField;
  temperature_in_tube_side: TSummaryField;
  temperature_out_shell_side: TSummaryField;
  temperature_out_tube_side: TSummaryField;
  operating_pressure_shell_side: TSummaryField;
  operating_pressure_tube_side: TSummaryField;
  number_of_passes_shell_side: TSummaryField;
  number_of_passes_tube_side: TSummaryField;
  velocity_shell_side: TSummaryField;
  velocity_tube_side: TSummaryField;
  pressure_drop_shell_side: TSummaryField;
  pressure_drop_tube_side: TSummaryField;
  design_pressure_shell_side: TSummaryField;
  design_pressure_tube_side: TSummaryField;
  test_pressure_shell_side: TSummaryField;
  test_pressure_tube_side: TSummaryField;
  design_temperature_shell_side: TSummaryField;
  design_temperature_tube_side: TSummaryField;
  heat_exchanged: TSummaryField;
  trans_coef: TSummaryField;
  mtd: TSummaryField;
  trans_coef_clean: TSummaryField;
  tubes: TSummaryField;
  no: TSummaryField;
  od: TSummaryField;
  bwg: TSummaryField;
  length: TSummaryField;
  pitch: TSummaryField;
  shell: TSummaryField;
  id: TSummaryField;
  thickness: TSummaryField;
  shell_cover: TSummaryField;
  floating_head_cover: TSummaryField;
  channel: TSummaryField;
  channel_cover: TSummaryField;
  tube_sheets_stationary: TSummaryField;
  floating: TSummaryField;
  baffles_cross: TSummaryField;
  baffles_type: TSummaryField;
  baffles_thickness: TSummaryField;
  baffles_impingement: TSummaryField;
  tube_fastening: TSummaryField;
  tube_supports: TSummaryField;
  tube_thickness: TSummaryField;
  gaskets: TSummaryField;
  shell_in: TSummaryField;
  shell_out: TSummaryField;
  shell_series: TSummaryField;
  channel_in: TSummaryField;
  channel_out: TSummaryField;
  channel_series: TSummaryField;
  corrosion_allowance_shell_side: TSummaryField;
  corr_allowance_tube_side: TSummaryField;
  code_requirements: TSummaryField;
};

export type TIAFSummary = {
  operation: TSummaryField;
  material_handled: TSummaryField;
  capacity: TSummaryField;
  inlet_temperature_D_B: TSummaryField;
  inlet_temperature_W_B: TSummaryField;
  inlet_pressure: TSummaryField;
  molecular_weight: TSummaryField;
  face_velocity: TSummaryField;
  pressure_drop: TSummaryField;
  dust_loading: TSummaryField;
  efficiency: TSummaryField;
};

export type TDAFSummary = {
  operation: TSummaryField;
  material_handled: TSummaryField;
  flow_normal_operation: TSummaryField;
  flow_max: TSummaryField;
  temperature_operating: TSummaryField;
  temperature_design: TSummaryField;
  pressure_operating: TSummaryField;
  pressure_design: TSummaryField;
  gas_density: TSummaryField;
  filter_efficiency: TSummaryField;
  filter_media: TSummaryField;
  element_pressure_drop: TSummaryField;
  face_velocity: TSummaryField;
  material_of_construction: TSummaryField;
  code_requirement: TSummaryField;
};

export type TBCSummary = {
  design_pressure_int: TSummaryField;
  design_pressure_ext: TSummaryField;
  design_temperature: TSummaryField;
  mawp_int_200f: TSummaryField;
  mawp_ext_200f: TSummaryField;
  mdmt_int: TSummaryField;
  mdmt_int_at: TSummaryField;
  mdmt_ext: TSummaryField;
  mdmt_ext_at: TSummaryField;
  corrosion_allowance: TSummaryField;
  hydrotest_pressure: TSummaryField;
  radiography: TSummaryField;
  joint_efficiency_head: TSummaryField;
  joint_efficiency_shell: TSummaryField;
  stress_relieve: TSummaryField;
  shell_material: TSummaryField;
  head_material: TSummaryField;
  nozzle_material: TSummaryField;
  flange_material: TSummaryField;
  internal_material: TSummaryField;
  repads_material: TSummaryField;
  legs_material: TSummaryField;
  base_plate_material: TSummaryField;
  bolts: TSummaryField;
  gasket: TSummaryField;
  vessel_weight_empty: TSummaryField;
  vessel_weight_full: TSummaryField;
  vessel_weight_capacity: TSummaryField;
};

export type TABPUMPSummary = {
  capacity: TSummaryField;
  tdh: TSummaryField;
  specific_gravity: TSummaryField;
  temperature: TSummaryField;
  npsha: TSummaryField;
  viscosity: TSummaryField;
  c_q_flow: TSummaryField;
  c_h_tdh: TSummaryField;
  c_n_eff: TSummaryField;
  model: TSummaryField;
  series: TSummaryField;
  size: TSummaryField;
  ansi_std: TSummaryField;
  ansi_std_2: TSummaryField;
  max_pressure: TSummaryField;
  max_temperature: TSummaryField;
  casting: TSummaryField;
  impeller: TSummaryField;
  cont_shell: TSummaryField;
  shaft: TSummaryField;
  gasket: TSummaryField;
  magnets: TSummaryField;
  bearings: TSummaryField;
  w_rings: TSummaryField;
  impeller_shut_off: TSummaryField;
  impeller_duty_point: TSummaryField;
  impeller_eoc: TSummaryField;
  speed_shut_off: TSummaryField;
  speed_duty_point: TSummaryField;
  speed_eoc: TSummaryField;
  power_shut_off: TSummaryField;
  power_duty_point: TSummaryField;
  power_eoc: TSummaryField;
  npshr_shut_off: TSummaryField;
  npshr_duty_point: TSummaryField;
  npshr_eoc: TSummaryField;
  efficiency_shut_off: TSummaryField;
  efficiency_duty_point: TSummaryField;
  efficiency_eoc: TSummaryField;
  capacity_shut_off: TSummaryField;
  capacity_duty_point: TSummaryField;
  capacity_eoc: TSummaryField;
  tdh_shut_off: TSummaryField;
  tdh_duty_point: TSummaryField;
  tdh_eoc: TSummaryField;
  pressure_shut_off: TSummaryField;
  pressure_duty_point: TSummaryField;
  pressure_eoc: TSummaryField;
};

export type TPUMPPRELUBERSummary = {
  speed: TSummaryField;
  viscosity: TSummaryField;
  temperature: TSummaryField;
  inlet_pressure: TSummaryField;
  drive: TSummaryField;
  mounting: TSummaryField;
};

export type TAFDSummary = {
  shell_id: TSummaryField;
  shell_corrosion_allowance: TSummaryField;
  shell_thickness: TSummaryField;
  shell_length: TSummaryField;
  seams_rt: TSummaryField;
  seams_off: TSummaryField;
  seams_ht_temperature: TSummaryField;
  seams_time: TSummaryField;
  seams_girth: TSummaryField;
  seams_no_of_courses: TSummaryField;
  head_a_location: TSummaryField;
  head_a_min_thickness: TSummaryField;
  head_a_corrosion_allowance: TSummaryField;
  head_a_crown_radius: TSummaryField;
  head_a_knuckle_radius: TSummaryField;
  head_a_elliptical_ratio: TSummaryField;
  head_a_conical_apex_angle: TSummaryField;
  head_a_hemispherical_radius: TSummaryField;
  head_a_flat_diameter: TSummaryField;
  head_a_side_to_pressure: TSummaryField;
  head_b_location: TSummaryField;
  head_b_min_thickness: TSummaryField;
  head_b_corrosion_allowance: TSummaryField;
  head_b_crown_radius: TSummaryField;
  head_b_knuckle_radius: TSummaryField;
  head_b_elliptical_ratio: TSummaryField;
  head_b_conical_apex_angle: TSummaryField;
  head_b_hemispherical_radius: TSummaryField;
  head_b_flat_diameter: TSummaryField;
  head_b_side_to_pressure: TSummaryField;
  maximum_allowable_work_pressure: TSummaryField;
  max_temp: TSummaryField;
  min_design_metal_temp: TSummaryField;
  at_pressure: TSummaryField;
  hydro_test_pressure: TSummaryField;
  supports: TSummaryField;
};

export type TProcessNox_AbatorSummary = {
  operation: TSummaryField;
  materials_handled_tail_gas: TSummaryField;
  materials_handled_fuel: TSummaryField;
  operating_temperature_tail_gas_inlet: TSummaryField;
  operating_temperature_ammonia_inlet: TSummaryField;
  operating_temperature_outlet: TSummaryField;
  design_temperature: TSummaryField;
  operating_pressure: TSummaryField;
  design_pressure: TSummaryField;
  allowable_pressure_drop: TSummaryField;
  catalyst: TSummaryField;
  materials_of_construction: TSummaryField;
  code_requirements: TSummaryField;
}
