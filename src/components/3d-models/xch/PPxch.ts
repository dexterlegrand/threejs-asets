import {
  FreePipe,
  Project,
  PipeConnectorType,
  TFlangeType,
  TSupportDetail,
  TLongWeldType,
  TEndConnectorDetails,
  TValveType,
} from "../../../store/main/types";
import { saveToFile, getIndexName, fixValueToNumber, roundM } from "../utils";
import {
  DataState,
  TPipingAccessory,
  TPipingElbow,
} from "../../../store/data/types";
import { Vector3 } from "three";
import { getPipeProfile, getMaterial } from "./xchUtils";
import { Dispatch } from "redux";
import { createXCHProjectPipes } from "../../../store/main/actions";
import {
  initLadderParams,
  initLoadings,
  initialIndianDesignCode,
  initialAmericanDesignCode,
  initPipeDesignCode,
  initSettings,
  initPipingLoad,
} from "../../../store/main/constants";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import { focusTarget } from "../../../store/scene/actions";

type TExportedPipe = {
  lineNo: number;
  pipeNo: string;
  precedingPipeNo: string;
  startPos: { x: number; y: number; z: number };
  endPos: { x: number; y: number; z: number };
  library?: string;
  nps?: string;
  schedule?: string;
  material?: string;
  outerDiameter?: number;
  wallThickness?: number;
  longWeldType: TLongWeldType;
  endConnectorType?: PipeConnectorType;
  endConnectorId?: number;
  endConnectorSchedule?: string;
  endConnectorShape?: string;
  endConnectorMaterial?: string;
  endConnectorAngle?: number;
  endConnectorStd: any;
  endConnectorDetails?: TEndConnectorDetails;
  fluidDensity?: number;
  planDirection?: number;
  elevationDirection?: number;
  valveType?: TValveType;
  valvePosition?: number | "START" | "END";
  startFlange: any;
  endFlange: any;
  supports: any[];
  TP: {
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

function mapPipe(item: FreePipe): TExportedPipe {
  return {
    lineNo: item.line,
    pipeNo: item.pipe,
    precedingPipeNo: item.preceding,
    startPos: { x: roundM(item.x1), y: roundM(item.y1), z: roundM(item.z1) },
    endPos: { x: roundM(item.x2), y: roundM(item.y2), z: roundM(item.z2) },
    library: item.params.lib,
    nps: item.params.profile?.nominal_pipe_size_inch,
    schedule: item.params.profile?.schedule,
    material: item.params.material?.material_name,
    outerDiameter: item.params.od,
    wallThickness: item.params.thickness,
    longWeldType: item.params.longWeldType,
    endConnectorType: item.params.endConnectorType,
    endConnectorId: item.params.endConnector?.id,
    endConnectorSchedule: item.params.endConnector?.schedule,
    endConnectorShape: item.params.endConnector?.shape,
    endConnectorMaterial: item.params.endConnector?.material,
    // @ts-ignore
    endConnectorAngle: item.params.endConnector?.degree,
    endConnectorStd: item.params.endConnector?.std,
    endConnectorDetails: item.params.endConnectorDetails,
    fluidDensity: item.params.fluidDensity,
    planDirection: item.hDir,
    elevationDirection: item.vDir,
    valveType: item.params.valveType,
    valvePosition: item.params.valvePosition,
    TP: {
      T1: item.params.T1,
      T2: item.params.T2,
      T3: item.params.T3,
      T4: item.params.T4,
      T5: item.params.T5,
      T6: item.params.T6,
      T7: item.params.T7,
      T8: item.params.T8,
      T9: item.params.T9,
      P1: item.params.P1,
      P2: item.params.P2,
      P3: item.params.P3,
      P4: item.params.P4,
      HP: item.params.HP,
    },
    startFlange: item.params.startFlange
      ? {
          id: item.params.startFlange.piping_flange_id,
          type: item.params.startFlangeType,
          class: item.params.startFlange.class,
          shape: item.params.startFlange.shape,
          material: item.params.startFlange.material,
          loads: {
            ...item.params.startFlangeLoads,
            code: item.params.startFlangeLoads ?? "API 517",
          },
        }
      : null,
    endFlange: item.params.endFlange
      ? {
          id: item.params.endFlange.piping_flange_id,
          type: item.params.endFlangeType,
          class: item.params.endFlange.class,
          shape: item.params.endFlange.shape,
          material: item.params.endFlange.material,
          loads: {
            ...item.params.endFlangeLoads,
            code: item.params.startFlangeLoads ?? "API 517",
          },
        }
      : null,
    supports:
      item.params.supportDetails?.map((supp) => ({
        type: supp.type,
        direction: supp.direction,
        distance: supp.distance,
        valueType: supp.valueType,
        x: supp.x,
        y: supp.y,
        z: supp.z,
        Rx: supp.Rx,
        Ry: supp.Ry,
        Rz: supp.Rz,
        Mu: supp.Mu,
        masterNodePipe: supp.masterNodePipe,
        masterNodeDist: supp.masterNodeDist,
      })) ?? [],
  };
}

export function exportPipes(
  controls: OrbitControls | undefined,
  project: Project,
  userDefinedElbows: TPipingElbow[]
) {
  const xchArr = {
    camera: controls
      ? {
          target: {
            x: controls.target.x,
            y: controls.target.y,
            z: controls.target.z,
          },
          position: {
            x: controls.object.position.x,
            y: controls.object.position.y,
            z: controls.object.position.z,
          },
        }
      : undefined,
    type: "Pipes",
    pipes: project.freePipes?.map((item) => mapPipe(item)) ?? [],
    userDefinedElbows,
  };
  saveToFile(xchArr, "pipes", "xch");
}

function getPipingAccessory(
  type: PipeConnectorType | undefined,
  id: number | undefined,
  schedule: string | undefined,
  shape: string | undefined,
  material: string | undefined,
  angle: number | undefined,
  data: DataState,
  UDEs: TPipingElbow[]
): TPipingAccessory | undefined {
  switch (type) {
    case "Elbow":
      return [...data.pipingElbows, ...UDEs].find(
        (item) =>
          item.id === id &&
          item.schedule === schedule &&
          item.shape === shape &&
          item.material === material &&
          item.degree === angle
      );
    case "Return":
      return [...data.pipingReturns, ...UDEs].find(
        (item) =>
          item.id === id &&
          item.schedule === schedule &&
          item.shape === shape &&
          item.material === material &&
          item.degree === angle
      );
    case "Reducer":
      return data.pipingReducers.find((item) => item.id === id);
    case "Cap":
      return data.pipingCaps.find((item) => item.id === id);
    case "Tee":
      return data.pipingTees.find((item) => item.id === id);
  }
}

function getFlange(type: TFlangeType, id: number, data: DataState) {
  switch (type) {
    case "Blind":
      return data.pipingFlangesBlind.find(
        (item) => item.piping_flange_id === id
      );
    case "Lapped":
      return data.pipingFlangesLapped.find(
        (item) => item.piping_flange_id === id
      );
    case "Ring Joint Facing":
      return data.pipingFlangesRingJointFacing.find(
        (item) => item.piping_flange_id === id
      );
    case "Slip On":
      return data.pipingFlangesSlipon.find(
        (item) => item.piping_flange_id === id
      );
    case "Socket Welding":
      return data.pipingFlangesSocketWelding.find(
        (item) => item.piping_flange_id === id
      );
    case "Threaded":
      return data.pipingFlangesThreaded.find(
        (item) => item.piping_flange_id === id
      );
    case "Welding Neck":
      return data.pipingFlangesWeldingneck.find(
        (item) => item.piping_flange_id === id
      );
  }
}

export function mapPipes(
  json: any,
  data: DataState,
  UDEs: TPipingElbow[] = []
) {
  const freePipes: FreePipe[] = [];
  json.pipes.forEach((item: TExportedPipe) => {
    const supports: TSupportDetail[] = [];
    item.supports.forEach((supp: any) => {
      supports.push({
        id: supports.length + 1,
        type: supp.type,
        direction: supp.direction,
        distance: supp.distance,
        valueType: supp.valueType,
        x: supp.x,
        y: supp.y,
        z: supp.z,
        Rx: supp.Rx,
        Ry: supp.Ry,
        Rz: supp.Rz,
        Mu: supp.Mu ?? 0,
        masterNodePipe: supp.masterNodePipe,
        masterNodeDist: supp.masterNodeDist ?? 0,
      });
    });
    freePipes.push({
      id: freePipes.length + 1,
      line: item.lineNo,
      pipe: item.pipeNo,
      preceding: item.precedingPipeNo,
      hDir: item.planDirection ?? 0,
      vDir: item.elevationDirection ?? 0,
      x1: item.startPos.x,
      y1: item.startPos.y,
      z1: item.startPos.z,
      x2: item.endPos.x,
      y2: item.endPos.y,
      z2: item.endPos.z,
      elevation: (item.startPos.y + item.endPos.y) / 2,
      length: new Vector3(
        item.startPos.x,
        item.startPos.y,
        item.startPos.z
      ).distanceTo(new Vector3(item.endPos.x, item.endPos.y, item.endPos.z)),
      params: {
        fluidDensity: item.fluidDensity,
        millTolerance: 12.5,
        nps: item.nps,
        longWeldType: item.longWeldType ?? "S",
        corrosionAllowance: 0,
        endConnectorType: item.endConnectorType,
        endConnector: getPipingAccessory(
          item.endConnectorType,
          item.endConnectorId,
          item.endConnectorSchedule,
          item.endConnectorShape,
          item.endConnectorMaterial,
          item.endConnectorAngle,
          data,
          UDEs
        ),
        endConnectorDetails: item.endConnectorDetails,
        startFlangeType: item.startFlange?.type,
        startFlangeClass: item.startFlange?.class,
        startFlange: getFlange(
          item.startFlange?.type,
          item.startFlange?.id,
          data
        ),
        endFlangeType: item.endFlange?.type,
        endFlangeClass: item.endFlange?.class,
        endFlange: getFlange(item.endFlange?.type, item.endFlange?.id, data),
        lib: item.library,
        profile: getPipeProfile(
          data.pipingSS,
          item.library,
          item.nps,
          item.schedule
        ),
        material: getMaterial(data.materials, item.material),
        od: item.outerDiameter,
        thickness: item.wallThickness,
        numberOfSupports: supports.length,
        supportDetails: supports,
        valveType: item.valveType,
        valvePosition: item.valvePosition,
        startFlangeLoads: item.startFlange?.startFlangeLoads,
        endFlangeLoads: item.endFlange?.endFlangeLoads,
        T1: item.TP.T1,
        T2: item.TP.T2,
        T3: item.TP.T3,
        T4: item.TP.T4,
        T5: item.TP.T5,
        T6: item.TP.T6,
        T7: item.TP.T7,
        T8: item.TP.T8,
        T9: item.TP.T9,
        P1: item.TP.P1,
        P2: item.TP.P2,
        P3: item.TP.P3,
        P4: item.TP.P4,
        HP: item.TP.HP,
      },
    });
  });
  return freePipes;
}

export function importPipes(
  dispatch: Dispatch<any>,
  projects: Project[],
  data: DataState,
  UDEs: TPipingElbow[],
  json: any
) {
  const project: Project = {
    name: `XCH Project ${getIndexName(projects, "XCH Project")}`,
    models: [],
    designCode: "IS 800 : 2007 LSD",
    ladderParams: { ...initLadderParams },
    loadings: { ...initLoadings },
    indianDesignCode: { ...initialIndianDesignCode },
    americanDesignCode: { ...initialAmericanDesignCode },
    freePipes: mapPipes(json, data, UDEs),
    pipeDesignCode: { ...initPipeDesignCode },
    settings: { ...initSettings },
    pipeLoadings: { ...initPipingLoad },
  };
  dispatch(createXCHProjectPipes(project, UDEs));
  if (json.camera) {
    dispatch(
      focusTarget(
        new Vector3(
          json.camera.target.x,
          json.camera.target.y,
          json.camera.target.z
        ),
        new Vector3(
          json.camera.position.x,
          json.camera.position.y,
          json.camera.position.z
        )
      )
    );
  }
}
