import { Vector3 } from "three";

export type TRow = {
  selected: boolean;
  line: number;
  view?: TView;
};

export type TView = "NW" | "NE" | "SE" | "SW";

export type TLineType =
  | "Pipe"
  | "Traced Line"
  | "Jacketted Line"
  | "Flow Direction"
  | "Pipe Slope"
  | "Existing / Hidden / Underground Lines"
  | "Math Line"
  | "Battery Limit"
  | "Butt Weld"
  | "Field Weld (Site Weld)"
  | "Weld Neck"
  | "Slip-on-Flange"
  | "SCRD, Socket Weld & Blind Flange"
  | "Lap Jt. Flange"
  | "Spectacle Blind"
  | "45 Mitre Elbow"
  | "45 Mitre Elbow (2-Cut)"
  | "45 Mitre Elbow (3-Cut)"
  | "90 Mitre Elbow"
  | "90 Mitre Elbow (2-Cut)"
  | "90 Mitre Elbow (3-Cut)"
  | "Pulled Bend (any angle)"
  | "90 Elbow or Bend other than Butt Weld & Flanged"
  | "90 Elbow or Bend Butt Weld"
  | "90 Elbow or Bend Flanged"
  | "Tee Butt Weld"
  | "Tee Flanged"
  | "Coupling, Half-Coupling"
  | "Reducer Conc. >"
  | "Reducer Conc. <"
  | "Reducer Ecc. >"
  | "Reducer Ecc. <"
  | "Swage Nipple Ecc."
  | "Flgd. Reducer Conc."
  | "Flgd. Reducer Ecc."
  | "Strainer (Butt Weld)"
  | "Strainer (Flanged)";

export type TLine = {
  id: number;
  name: string;
  type: TLineType;
  start: Vector3;
  end: Vector3;
  length: number;
  sFlange?: string;
  eFlange?: string;
};

export type TResult = {
  view: TView;
  lines: TLine[];
  scale: TScale;
};

export type TSize = {
  label: string;
  width: number;
  height: number;
};

export type TScale = number | 2 | 5 | 10 | 20 | 50 | 100 | 200 | 500 | 1000 | 2000 | 5000 | 10000;

export type TQuarter = "T" | "RT" | "R" | "RB" | "B" | "LB" | "L" | "LT";
