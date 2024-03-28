import { atom } from "recoil";
import { Section } from "../../store/data/types";
import { Vector3 } from "three";
import { TElementType } from "../../store/main/openFrameTypes";
import {
  BracingType,
  ModelType,
  SimpleDirection3,
} from "../../store/main/types";

export type TOFCreationElementType =
  | "BEAM"
  | "V-BRACING"
  | "H-BRACING"
  | "K-BRACING"
  | "PLATFORM"
  | "ROAD"
  | "DRAIN"
  | "TRANCH"
  | "CABLE-TRAY"
  | "TREE"
  | "LAMP";

export type TOFCreateState = {
  type: TOFCreationElementType | undefined;
  lib: string | undefined;
  profile: Section | undefined;
  thickness: number | undefined;
  bracingType: BracingType | undefined;
  width?: number | undefined;
  routing: "AUTO" | "MANUAL";
  model?: string;
  distance?: number;
  modelType?: ModelType;
  fromElement?: string;
  fromElementType?:
    | TElementType
    | "PipeRackColumn"
    | "PipeRackBeam"
    | "PipeRackVBracing"
    | "PipeRackHBracing"
    | "PipeRackCantilever"
    | "Ladder"
    | "AccessoryBeam"
    | "COLUMN"
    | "AccessoryColumn";
  toElementDirection?: SimpleDirection3;
  fromElementDirection?: SimpleDirection3;
  fromPoint?: Vector3;
  toElement?: string;
  toPoint?: Vector3;
  fromSecondElement?: string;
  toSecondElement?: string;
};

const OFCreationAtom = atom<TOFCreateState>({
  key: "OFCreationAtom",
  default: {
    type: undefined,
    lib: undefined,
    profile: undefined,
    routing: "AUTO",
    width: 1000,
    thickness: 25,
    bracingType: undefined,
  },
});

export default OFCreationAtom;
