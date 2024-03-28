import { atom } from "recoil";
import { Vector3 } from "three";
import {
  CableProfile,
  Material,
  PipeProfile,
  TPipingFlange,
} from "../../store/data/types";
import { TFlangeType, TLongWeldType } from "../../store/main/types";
import {
  ECabelElementType,
  EConnectionElementType,
  EPipeElementType,
  TProcessElement,
} from "../../store/process/types";

export type TPipeSegmentParams = {
  lib?: string;
  nps?: string;
  schedule?: string;
  material?: Material;
  corAllow: number;
  millToll: number;
  longWeldType: TLongWeldType;
  profile?: PipeProfile;
};

export type TCabelSegmentParams = {
  lib?: string;
  nps?: string;
  schedule?: string;
  material?: Material;
  corAllow: number;
  millToll: number;
  longWeldType: TLongWeldType;
  profile?: CableProfile;
};

export type TConnectionSegmentParams = {
  lib?: string;
  nps?: string;
  schedule?: string;
  material?: Material;
  od_MM: number;
  wt_MM: number;
  profile?: PipeProfile;
  connectionType?: "START" | "END";
  startingAt: "Surface" | "Center";
};

export type TPipeFlangeParams = {
  type?: TFlangeType;
  class?: number;
  material?: TPipingFlange;
};

export type TMousePipeCreatingAtom = {
  isStart?: boolean;
  processPipeElement?: EPipeElementType | EConnectionElementType;
  startProcessElement?: TProcessElement;
  startProcessElementPoint?: number;
  startPointPipeSegment?: Vector3;
  prevPipeSegment?: number;
  pipeSegmentParams: TPipeSegmentParams;
  connectionSegmentParams: TConnectionSegmentParams;
  pipeFlangeParams?: TPipeFlangeParams;
  dimensionPoint?: Vector3;
};

export type TMouseCabelCreatingAtom = {
  isStart?: boolean;
  processCabelElement?: ECabelElementType;
  startProcessElement?: TProcessElement;
  startProcessElementPoint?: number;
  startPointPipeSegment?: Vector3;
  prevCabelSegment?: number;
  cabelSegmentParams: TCabelSegmentParams;
  dimensionPoint?: Vector3;
};

const mousePipeCreating = atom<TMousePipeCreatingAtom>({
  key: "mousePipeCreating",
  default: {
    pipeSegmentParams: { corAllow: 0, millToll: 0, longWeldType: "S" },
    connectionSegmentParams: {
      od_MM: 200,
      wt_MM: 2,
      startingAt: "Center",
      connectionType: "START",
    },
  },
});

export { mousePipeCreating };
