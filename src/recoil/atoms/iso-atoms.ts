import { atom } from "recoil";
import {
  TScale,
  TSize,
} from "../../components/menu-bar/analysis-tab/piping/isometric-view/isometricTypes";
import {
  scales,
  sizes,
} from "../../components/menu-bar/analysis-tab/piping/isometric-view/isometricUtils";
import { TSupportDetail } from "../../store/main/types";

export type TISODataItem = {
  id: number;
  tag: string;
  line: number;
  name: string;
  preceding: "START" | string;
  start_M: { x: number; y: number; z: number };
  end_M: { x: number; y: number; z: number };
  northing_MM: number;
  easting_MM: number;
  up_MM: number;
  lib?: string;
  nps?: string;
  schedule?: string;
  material?: string;
  diameter: number;
  remark: string;
  fluidDensity: number;
  operatingTemperature: number;
  designTemperature: number;
  designPressure: number;
  testPressure: number;
  insulationThickness: number;
  numberOfRestraints: number;
  supports: TISODataItemSupport[];
};

export type TISODataItemSupport = TSupportDetail;

export type TISOState = {
  size: TSize;
  scale: TScale;
  tab: "Viewer" | "Table";
  data: TISODataItem[];
};

const isoState = atom<TISOState>({
  key: "iso-state",
  default: {
    size: sizes[1],
    scale: scales[4],
    tab: "Viewer",
    data: [],
  },
});

export { isoState };
