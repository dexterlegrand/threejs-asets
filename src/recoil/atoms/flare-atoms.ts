import { atom } from "recoil";
import { TInitFlare } from "../../store/main/types/flare";

const flareGeometryUI = atom<TInitFlare>({
  key: "flareGeometryUI",
  default: {
    project: "",
    position: { x: 0, y: 0, z: 0 },
    numberOfSegments: 5,
    height_M: 20,
    diameter_M: 5,
    thickness_MM: 10,
    refractoryThickness_MM: 0,
    refractoryDensity: 0,
    corrosionAllowance_MM: 0,
    minDesignTemperature: 0,
    maxDesignTemperature: 0,
  },
});

export { flareGeometryUI };
