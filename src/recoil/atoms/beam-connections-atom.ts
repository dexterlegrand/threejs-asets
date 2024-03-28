import { atom } from "recoil";

export type TBeamConnections = {
  type?: "ODSM" | "ODSS";
  subtype?: "Bolted" | "Welded";
  anchor?: "BP" | "SF" | "BB" | "BC" | "HB" | "VB" | "KB";
  item?: {
    model: string;
    element: string;
    subtype?: "rectangular" | "circular";
    position?: "START" | "END";
    connection: any;
  };
};

const beamConnections = atom<TBeamConnections>({
  key: "beam-connections-atom",
  default: {},
});

export { beamConnections };
