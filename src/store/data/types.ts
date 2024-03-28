import { Font, Vector3 } from "three";
import { TFlareSegment } from "../main/types/flare";
import { TProcessElement } from "../process/types";
import { TPipingValve } from "./piping-valves";

export enum DataActionTypes {
  GET_FONT = "GET_FONT",

  GET_PROFILE_SECTION_DATA = "GET_PROFILE_SECTION_DATA",
  GET_MATERIALS = "GET_MATERIALS",
  GET_PIPE_PROFILES = "GET_PIPE_PROFILES",
  GET_PIPING_CAPS = "GET_PIPING_CAPS",
  GET_PIPING_COLLETS = "GET_PIPING_COLLETS",
  GET_PIPING_REDUCERS = "GET_PIPING_REDUCERS",
  GET_PIPING_RETURNS = "GET_PIPING_RETURNS",
  GET_PIPING_ELBOWS = "GET_PIPING_ELBOWS",
  GET_PIPING_TEES = "GET_PIPING_TEES",

  GET_FLANGES = "GET_FLANGES",

  CHANGE_DATA = "CHANGE_DATA",
}

export type DataState = {
  font?: Font;
  profileSectionData: Section[];
  pipingCS: PipeProfile[];
  pipingSS: PipeProfile[];
  CS_Libraries: string[];
  materials: Material[];
  // pipeMaterials: Material[];
  pipingCaps: TPipingCap[];
  pipingCollets: TPipingCollet[];
  pipingReducers: TPipingReducer[];
  pipingReturns: TPipingReturn[];
  pipingElbows: TPipingElbow[];
  pipingTees: TPipingTee[];
  pipingValves: TPipingValve[];
  pipingFlangesBlind: TPipingFlangeBlind[];
  pipingFlangesLapped: TPipingFlangeLapped[];
  pipingFlangesRingJointFacing: TPipingFlangeRingJointFacing[];
  pipingFlangesSlipon: TPipingFlangeSlipon[];
  pipingFlangesSocketWelding: TPipingFlangeSocketWelding[];
  pipingFlangesThreaded: TPipingFlangeThreaded[];
  pipingFlangesWeldingneck: TPipingFlangeWeldingneck[];
  pipingLongWeldingNeckFlanges: TPipingFlangeWeldingneck[];
  pipingFlangesAllPresRating: TPipingFlangeAllPresRating[];
  pipingValveActuators: any[];
  pipingValveControls: any[];
};

export type TPipingFlange = {
  piping_flange_id: number;
  nps: string;
  class?: number;
  shape: string;
  material: string;
  weight?: number;
  dn: number;
  a?: number | null;
  b?: number | null;
  c?: number;
  dr_no?: number;
  dr_d?: number;
  dr_g?: number;
  x?: number;
  y?: number;
};

export type TPipingFlangeAllPresRating = {
  r: number;
  s: number;
  t: number;
  u: number;
  k: number;
  l: number;
  w: number;
  x: number;
  y: number;
  z: number;
} & TPipingFlange;

export type TPipingFlangeWeldingneck = {
  o: number;
  k: any;
  e: any;
  r: number;
  r_mini: any;
  x: number;
  y: number;
} & TPipingFlange;

export type TPipingFlangeThreaded = {
  o: number;
  k: any;
  e: any;
  r: number;
  r_mini: any;
  x: number;
  y: number;
  t: number;
} & TPipingFlange;

export type TPipingFlangeSocketWelding = {
  o: number;
  k: any;
  e: any;
  r: number;
  r_mini: any;
  x: number;
  y: number;
  b3: number;
  d: number;
} & TPipingFlange;

export type TPipingFlangeSlipon = {
  o: number;
  k: any;
  e: any;
  r: number;
  r_mini: any;
  x: number;
  y: number;
} & TPipingFlange;

export type TPipingFlangeRingJointFacing = {
  k: number;
  p: number;
  e: number;
  f: number;
  r: number;
  d: number;
  r_no: string;
} & TPipingFlange;

export type TPipingFlangeLapped = {
  o: number;
  k: any;
  e: any;
  r: number;
  r_mini: any;
  x: number;
  y: number;
} & TPipingFlange;

export type TPipingFlangeBlind = {
  e: any;
  k: any;
  o: number;
  r: number;
  r_mini: any;
  x: number;
  y: number;
} & TPipingFlange;

export type Material = {
  material_id: number;
  material_name: string;
  material_type: "STRUCTURE" | "PIPING";
  created_by?: number;
  updated_by?: number;
  created_on?: Date | string;
  updated_on?: Date | string;
  _links?: {
    self: {
      href: string;
    };
    material: {
      href: string;
    };
  };
};

export type MaterialData = {
  temperature: number;
  density: number;
  material_details_id: number;
  material_id: number;
  min_yield: number;
  min_tensile: number;
  mod_of_elasticity: number;
  poisson_ratio: number;
  linear_alpha: number;
  created_by: number;
  updated_by: number;
  created_on: Date | string;
  updated_on: Date | string;
  _links: {
    self: {
      href: string;
    };
    materialdata: {
      href: string;
    };
  };
};

export type PipeProfile = {
  piping_details_id: number;
  cable_details_id?: number;
  nominal_cabel_size_inch?: string;
  nominal_pipe_size_inch: string;
  schedule: string;
  outside_diameter: number;
  wall_thickness: number;
  weight: number;
  outside_diameter_global: number;
  wall_thickness_global: number;
  weight_global: number;
  specification: string;
  ixx: number;
  material: string;
  country_code: string;
  type: number;
};

export type CableProfile = {
  cable_details_id: number;
  nominal_cabel_size_inch: string;
  schedule: string;
  outside_diameter: number;
  wall_thickness: number;
  weight: number;
  outside_diameter_global: number;
  wall_thickness_global: number;
  weight_global: number;
  specification: string;
  ixx: number;
  material: string;
  country_code: string;
  type: number;
}

export type ShapeType = "I" | "C" | "O" | "L" | "Box";

export type CombinationType =
  | "B/B Depth"
  | "B/B Width"
  | "F/F Depth"
  | "F/F Width"
  | "Star";

export type TClash = {
  id: number;
  pos: Vector3;
  elements: TClashElement[];
  remark: string;
  ignore?: boolean;
};

export type TClashElement = {
  project: string;
  model: string;
  name: string;
  s: Vector3;
  e: Vector3;
  profile?: Section;
  pipeProfile?: PipeProfile;
  flareSegment?: TFlareSegment;
  equipment?: TProcessElement;
  type?: string;
  orientation?: number;
};

export type Section = {
  profile_section_id: number;
  country_code: string;
  name: string;
  designation: string;
  type: string;
  /*shape: ShapeType;*/
  shape: string;
  height_global: number;
  width_global: number;
  thickness_global?: number;
  ax_global?: number;
  b_global?: number;
  bf_global?: number;
  c_global?: number;
  ct_global?: number;
  d_global?: number;
  de_global?: number;
  i_global?: number;
  ix_global?: number;
  iy_global?: number;
  iz_global?: number;
  k_global?: number;
  k1_global?: number;
  od_global?: number;
  r1_global?: number;
  r2_global?: number;
  rz_global?: number;
  t_global?: number;
  tf_global?: number;
  tfb_global?: number;
  tw_global?: number;
  z_global?: number;
  zx_global?: number;
  zy_global?: number;
  zz_global?: number;
};

export type RolledSection = {
  baseLib: string;
  baseCountryCode: string;
  baseProfile: string;
  tpWidth?: number;
  tpThickness?: number;
  bpWidth?: number;
  bpThickness?: number;
} & Section;

export type CombinedSection = {
  baseProfile: string;
  CSLibrary: string;
  combination: CombinationType;
  gap: number;
} & Section;

export type ProfileSection = {
  ax: number | null;
  b: number | null;
  bf: number | null;
  c: number | null;
  ct: number | null;
  d: number | null;
  de: number | null;
  i: number | null;
  ix: number | null;
  iy: number | null;
  iz: number | null;
  k: number | null;
  k1: number | null;
  od: number | null;
  r1: number | null;
  r2: number | null;
  rz: number | null;
  t: number | null;
  tf: number | null;
  tw: number | null;
  z: number | null;
  zx: number | null;
  zy: number | null;
  zz: number | null;
  width: number;
  thickness: number;
  height: number;
} & Section;

export type TPipingAccessory = {
  id: number;
  nps: string;
  material: string;
  shape: string;
  schedule: string;
  weight: number;

  std: unknown | null;
  xs: unknown | null;
  xxs: unknown | null;
  sch_10: unknown | null;
  sch_20: unknown | null;
  sch_30: unknown | null;
  sch_40: unknown | null;
  sch_60: unknown | null;
  sch_80: unknown | null;
  sch_100: unknown | null;
  sch_120: unknown | null;
  sch_140: unknown | null;
  sch_160: unknown | null;
  sch_5s: unknown | null;
  sch_10s: unknown | null;
  sch_40s: unknown | null;
  sch_80s: unknown | null;
};

export type TPipingCap = {
  piping_caps_id: number;
  d: number;
  e: number;
  limiting_wt: number;
  e1: number;
  t: number;
} & TPipingAccessory;

export type TPipingCollet = {
  piping_collets_id: number;
  d: number;
  f1: number;
  f2: number;
  g: number;
  a: number;
  b: number;
  t: number;
} & TPipingAccessory;

export type TPipingReducer = {
  piping_reducers_id: number;
  d1: number;
  d2: number;
  h: number;
  t1: number;
  t2: number;
} & TPipingAccessory;

export type TPipingReturn = {
  piping_returns_id: number;
  degree: number;
  d: number;
  o: number;
  k: number;
  t: number;
} & TPipingAccessory;

export type TPipingElbow = {
  piping_elbows_id: number;
  degree: number;
  d: number;
  a: number;
  o: number;
  t: number;
  isUser?: boolean;
} & TPipingAccessory;

export type TPipingTee = {
  piping_tees_id: number;
  d1: number | null;
  d2: number | null;
  c: number;
  m: number;
  d: number;
  t1: number | null;
  t2: number | null;
  t: number;
} & TPipingAccessory;
