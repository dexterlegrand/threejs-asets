import { Material } from "../../data/types";
import { Model } from "../types";

export type TInitFlare = {
  project: string;
  position: { x: number; y: number; z: number };
  numberOfSegments: number;
  height_M: number;
  diameter_M: number;
  thickness_MM: number;
  refractoryThickness_MM: number;
  refractoryDensity: number;
  corrosionAllowance_MM: number;
  minDesignTemperature: number;
  maxDesignTemperature: number;
  material?: Material;
};

export type TFlare = {
  id: number;
  name: string;
  position: { x: number; y: number; z: number };
  rotation?: number;
  segments: TFlareSegment[];
} & Model;

export type TFlareSegment = {
  id: number;
  name: string;

  topElevation_M: number;
  bottomElevation_M: number;
  topInternalDiameter_M: number;
  bottomInternalDiameter_M: number;
  thickness_MM: number;

  refractoryThickness_MM: number;
  refractoryDensity: number;

  corrosionAllowance_MM: number;
  minDesignTemperature: number;
  maxDesignTemperature: number;
  material?: Material;
};
