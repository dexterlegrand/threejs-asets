import { action } from "typesafe-actions";
import {
  EProcessActionTypes,
  EProcessElementType,
  TProcessElement,
  TProcessTank,
  TProcessPump,
  TProcessSource,
  TProcessSink,
  TProcessSplit,
  TProcessHeader,
  TProcessMix,
  TProcessValve,
  TProcessDrum,
  TProcessState,
  TProcess,
  TProcessElementPoint,
  TProcessIssue,
  TProcessLineSegment,
  TProcessLine,
  TProcessPFR,
  TProcessCSTR,
  TProcessRE,
  TProcessRC,
  TProcessRG,
  TProcessSTHE1P,
  TProcessSTHE2P,
  TProcessHeater,
  TProcessCooler,
  TProcessAbsorptionColumn,
  TProcessRevision,
  TInstrumentationElement,
  TInstrumentationLine,
  TProcessLineOrder,
  TProcessAirphinCooler,
  TProcessSkid,
  TProcessOther,
  TProcessColumn,
  TProcessExhaustStack,
  TProcessSupportType,
} from "./types";
import { Vector3 } from "three";
import {
  getNextId,
  degToRad,
  roundVectorM,
  MMtoM,
  getUnicuesArray,
  getRGB,
} from "../../components/3d-models/utils";
import { DataState, TPipingFlange } from "../data/types";
import { TFlangeType } from "../main/types";
import { flangeTypes, red } from "../main/constants";

const createProcessAction = (name: string) =>
  action(EProcessActionTypes.CREATE_PROCESS, { name });

const setProcessAction = (name: string, process: TProcess) =>
  action(EProcessActionTypes.SET_PROCESS, { name, process });

const renameProcessAction = (oldName: string, newName: string) =>
  action(EProcessActionTypes.RENAME_PROCESS, { oldName, newName });

const removeProcessAction = (name: string) =>
  action(EProcessActionTypes.REMOVE_PROCESS, { name });

function getFlanges(resoures: DataState, type?: TFlangeType): TPipingFlange[] {
  switch (type) {
    case "Blind":
      return resoures.pipingFlangesBlind;
    case "Lapped":
      return resoures.pipingFlangesLapped;
    // case "Ring Joint Facing":
    // return resoures.pipingFlangesRingJointFacing;
    case "Slip On":
      return resoures.pipingFlangesSlipon.filter((f) => f.class !== 2500);
    case "Socket Welding":
      return resoures.pipingFlangesSocketWelding;
    case "Threaded":
      return resoures.pipingFlangesThreaded;
    case "Welding Neck":
      return resoures.pipingFlangesWeldingneck;
    default:
      return [];
  }
}
const getNozzleFlangeData = (
  resoures: DataState,
  nps?: string,
  flangeClass?: number,
  flangeType?: TFlangeType
) => {
  const filteredProfiles = resoures.pipingSS.filter(
    (p) => p.outside_diameter_global && p.wall_thickness_global
  );

  const libs = getUnicuesArray(
    filteredProfiles.map((profile) => profile.country_code?.trim() ?? "")
  );

  const lib = libs[0];

  const NPSs = (lib?: string) => {
    if (lib) {
      return getUnicuesArray(
        filteredProfiles
          .filter((p) => p.country_code === lib)
          .map((profile) => profile.nominal_pipe_size_inch)
      );
    } else return [];
  };

  if (!nps) nps = NPSs(lib)[0];

  const schedules = getUnicuesArray(
    filteredProfiles.filter((p) => p.nominal_pipe_size_inch === nps)
  );

  const schedule = "STD";

  const profile = filteredProfiles.find(
    (p) =>
      p.country_code === lib &&
      p.nominal_pipe_size_inch === nps &&
      p.schedule === schedule
  );

  const materials = resoures.materials.filter(
    (m) => m.material_type === "PIPING"
  );

  const material = materials[0];
  let flangeData = {};
  if (flangeClass) {
    if (!flangeType) flangeType = "Lapped";
    const flangeClasses = getUnicuesArray(
      getFlanges(resoures, flangeType).map((f: TPipingFlange) => f.class)
    );

    if (!flangeClass) {
      flangeClass = flangeClasses[0];
    }
    const flanges = getFlanges(resoures, flangeType).filter(
      (f) => f.class === flangeClass
    );

    const flange = flanges.filter((f) => f.nps == nps)[0];
    flangeData = {
      flange,
      flangeClass,
      flangeType,
    };
  }

  return {
    nps,
    lib,
    schedule,
    profile,
    material,
    od_MM: profile?.outside_diameter_global,
    wt_MM: profile?.wall_thickness_global,
    ...flangeData,
  };
};
const createProcessElementAction = (
  process: string,
  name: string,
  type: EProcessElementType,
  pos: Vector3,
  resoures: DataState
) => {
  const init: TProcessElement = {
    type,
    name,
    tag: name,
    position: { x: pos.x, y: pos.y, z: pos.z },
    rotationX: 0,
    rotation: 0,
    rotationZ: 0,
    scale: 1,
    pointsConfig: { isVariable: false, min: 0 },
    points: [],
    parameters: {},
  };
  const l = init.scale / 2;
  const l_1 = init.scale / 10;
  const l_3 = init.scale / 3;
  const l_4 = l / 2;
  const l_5 = init.scale / 5;
  const l_6 = l_3 / 2;
  const l_8 = l_4 / 2;
  let element: TProcessElement | undefined;

  switch (type) {
    case EProcessElementType.DISTILLATION_COLUMN:
      element = {
        ...init,
        pointsConfig: { isVariable: false, min: 2 },
        points: [
          {
            id: 0,
            startPosition: new Vector3(0, 0.375),
            generalPosition: new Vector3(0.1, 0.375),
          },
          {
            id: 1,
            startPosition: new Vector3(0, -0.375),
            generalPosition: new Vector3(0.3, -0.375),
          },
          {
            id: 2,
            connectionType: "END",
            startPosition: new Vector3(),
            generalPosition: new Vector3(-0.3),
          },
        ],
        parameters: {
          height: 750,
          diameter: 300,
        },
      } as TProcessColumn;
      break;

    case EProcessElementType.BC:
      element = {
        ...init,
        pointsConfig: { isVariable: false, min: 2 },
        points: [
          // {
          //   id: 0,
          //   startPosition: new Vector3(0, -0.1, 0),
          //   generalPosition: new Vector3(-0.35, -0.1, 0),
          //   ...getNozzleFlangeData(resoures, "4", 400),
          // },
          {
            id: 0,
            isFixed: false,
            connectionType: "START",
            isVertical: false,

            startPosition: new Vector3(0, 1.391 - 0.961, 0),
            generalPosition: new Vector3(-0.0041, 1.89 - 0.961, -0.0029),
            ...getNozzleFlangeData(resoures, "10", 300),
            od_MM: 273,
            wt_MM: 9.27,
          },

          {
            id: 1,
            isFixed: false,
            connectionType: "START",
            isVertical: false,

            startPosition: new Vector3(0, 0, 0),
            generalPosition: new Vector3(0.05341, 0, 1.298902),
            ...getNozzleFlangeData(resoures, "10", 300),
            od_MM: 273,
            wt_MM: 9.27,
          },

          // {
          //   id: 2,
          //   isFixed: false,
          //   connectionType: "START",
          //   isVertical: false,

          //   startPosition: new Vector3(0, -1.279, 0),
          //   generalPosition: new Vector3(0.002603, -1.878, 0.003904),
          //   ...getNozzleFlangeData(resoures, "4", 300),
          //   od_MM: 114.3,
          //   wt_MM: 6.02,
          // },

          // {
          //   id: 3,
          //   isFixed: false,
          //   connectionType: "START",
          //   isVertical: false,

          //   startPosition: new Vector3(0, -0.3, 0),
          //   generalPosition: new Vector3(-0.001, -0.3, -1.534),
          //   ...getNozzleFlangeData(resoures, "10", 300),
          //   od_MM: 273,
          //   wt_MM: 9.27,
          // },
        ],
        parameters: {
          height: 3006.31,
          diameter: 2000,
        },
        supportParameters: {
          type: TProcessSupportType.LEG,
          number: 4,
          length: 1000,
        },
      };
      break;

    case EProcessElementType.COMPRESSOR:
      element = {
        ...init,
        pointsConfig: { isVariable: false, min: 2 },
        points: [
          {
            id: 0,
            isFixed: true,
            connectionType: "START",
            startPosition: new Vector3(),
            generalPosition: new Vector3(l),
          },
          {
            id: 1,
            isFixed: true,
            connectionType: "END",
            startPosition: new Vector3(),
            generalPosition: new Vector3(-l),
          },
        ],
      };
      break;
    case EProcessElementType.DRUM:
      element = {
        ...init,
        pointsConfig: { isVariable: true, min: 2 },
        points: [
          {
            id: 0,
            isVertical: true,
            startPosition: new Vector3(0, l_8),
            generalPosition: new Vector3(l + l_5, l_8),
          },
          {
            id: 1,
            isVertical: true,
            startPosition: new Vector3(0, -l_8),
            generalPosition: new Vector3(0, -l_8, -(l + l_5)),
          },
        ],
        parameters: {
          diameter: 500,
          height: 1000,
          baseElevation: 0,
        },
      } as TProcessDrum;
      break;
    case EProcessElementType.AV:
      element = {
        ...init,
        pointsConfig: { isVariable: true, min: 2 },
        points: [
          // {
          //   id: 0,
          //   isVertical: true,
          //   startPosition: new Vector3(0, l_8),
          //   generalPosition: new Vector3(l + l_5, l_8),
          // },
          // {
          //   id: 1,
          //   isVertical: true,
          //   startPosition: new Vector3(0, -l_8),
          //   generalPosition: new Vector3(0, -l_8, -(l + l_5)),
          // },
        ],
        parameters: {
          diameter1: 300,
          diameter: 500,
          diameter2: 300,
          length: 2,
          length1: 2,
          length2: 2.5,
          distance: 0.5,
          baseElevation: 0,
        },
      };
      break;
    case EProcessElementType.AH:
      element = {
        ...init,
        pointsConfig: { isVariable: true, min: 2 },
        points: [
          // {
          //   id: 0,
          //   isVertical: true,
          //   startPosition: new Vector3(0, l_8),
          //   generalPosition: new Vector3(l + l_5, l_8),
          // },
          // {
          //   id: 1,
          //   isVertical: true,
          //   startPosition: new Vector3(0, -l_8),
          //   generalPosition: new Vector3(0, -l_8, -(l + l_5)),
          // },
        ],
        parameters: {
          diameter: 500,
          length: 1.5,
          baseElevation: 0,
        },
      };
      break;
    case EProcessElementType.WHB:
      element = {
        ...init,
        pointsConfig: { isVariable: true, min: 2 },
        points: [
          // {
          //   id: 0,
          //   isVertical: true,
          //   startPosition: new Vector3(0, l_8),
          //   generalPosition: new Vector3(l + l_5, l_8),
          // },
          // {
          //   id: 1,
          //   isVertical: true,
          //   startPosition: new Vector3(0, -l_8),
          //   generalPosition: new Vector3(0, -l_8, -(l + l_5)),
          // },
        ],
        parameters: {
          diameter: 500,
          length: 1.3,
          baseElevation: 0,
        },
      };
      break;
    case EProcessElementType.CC:
      element = {
        ...init,
        pointsConfig: { isVariable: true, min: 2 },
        points: [
          // {
          //   id: 0,
          //   isVertical: true,
          //   startPosition: new Vector3(0, l_8),
          //   generalPosition: new Vector3(l + l_5, l_8),
          // },
          // {
          //   id: 1,
          //   isVertical: true,
          //   startPosition: new Vector3(0, -l_8),
          //   generalPosition: new Vector3(0, -l_8, -(l + l_5)),
          // },
        ],
        parameters: {
          diameter: 500,
          length: 1.75,
          baseElevation: 0,
        },
      };
      break;
    case EProcessElementType.ENLARGER:
      element = {
        ...init,
        pointsConfig: { isVariable: false, min: 2 },
        points: [
          {
            id: 0,
            isFixed: true,
            connectionType: "START",
            startPosition: new Vector3(),
            generalPosition: new Vector3(l),
          },
          {
            id: 1,
            isFixed: true,
            connectionType: "END",
            startPosition: new Vector3(),
            generalPosition: new Vector3(-l),
          },
        ],
        parameters: {
          diameter: 200,
          length: 0.75,
        },
      };
      break;
    case EProcessElementType.EXPANDER:
      element = {
        ...init,
        pointsConfig: { isVariable: false, min: 2 },
        points: [
          {
            id: 0,
            isFixed: true,
            connectionType: "START",
            startPosition: new Vector3(),
            generalPosition: new Vector3(l),
          },
          {
            id: 1,
            isFixed: true,
            connectionType: "END",
            startPosition: new Vector3(),
            generalPosition: new Vector3(-l),
          },
        ],
      };
      break;
    case EProcessElementType.EXTRACTOR:
      element = {
        ...init,
        pointsConfig: { isVariable: true, min: 2 },
        points: [
          {
            id: 0,
            isFixed: true,
            connectionType: "END",
            startPosition: new Vector3(0, l - l_5),
            generalPosition: new Vector3(-(l_5 + l_6), l - l_5),
          },
          {
            id: 1,
            isFixed: true,
            connectionType: "START",
            startPosition: new Vector3(),
            generalPosition: new Vector3(0, -(l + l_5)),
          },
        ],
        parameters: {
          height: 750,
          diameter: 300,
        },
      };
      break;

    case EProcessElementType.AAM:
      element = {
        ...init,
        pointsConfig: { isVariable: true, min: 2 },
        points: [
          {
            id: 0,
            connectionType: "START",
            startPosition: new Vector3(),
            generalPosition: new Vector3(l),
            ...getNozzleFlangeData(resoures, "12", 400),
          },
          {
            id: 1,
            connectionType: "END",
            startPosition: new Vector3(),
            generalPosition: new Vector3(-l),
            ...getNozzleFlangeData(resoures, "12", 400),
          },
          {
            id: 2,
            connectionType: "START",
            startPosition: new Vector3(-l / 2),
            generalPosition: new Vector3(-l / 2, length / 3),
            ...getNozzleFlangeData(resoures, "2", 400),
          },
        ],
        parameters: {
          diameter: 500,
          length: l * 2,
        },
      } as TProcessHeader;
      break;

    case EProcessElementType.AIC:
      element = {
        ...init,
        pointsConfig: { isVariable: true, min: 2 },

        parameters: {
          width: 1000,
          height: 500,
        },
      };
      break;

    case EProcessElementType.FireHose:
      element = {
        ...init,
        pointsConfig: { isVariable: true, min: 2 },

        color: getRGB(red),
        parameters: {
          width: 200,
          diameter: 500,
          height: 600,
        },
      };
      break;
    case EProcessElementType.DAF:
      element = {
        ...init,
        pointsConfig: { isVariable: true, min: 2 },
        points: [
          {
            id: 0,
            isFixed: false,
            isVertical: false,
            startPosition: new Vector3(0, 1, 0),
            generalPosition: new Vector3(0, 0.5, 1),
            ...getNozzleFlangeData(resoures, "10", 300),
            od_MM: 273,
            wt_MM: 9.27,
          },

          {
            id: 1,
            isFixed: false,
            isVertical: false,
            startPosition: new Vector3(0, -1, 0),
            generalPosition: new Vector3(0, -0.5, -1),
            ...getNozzleFlangeData(resoures, "10", 300),
            od_MM: 273,
            wt_MM: 9.27,
          },
        ],
        parameters: {
          diameter: 609.6,
          height: 2945,
          thickness: 30,
        },
      } as TProcessHeader;
      break;

    case EProcessElementType.A_B_PUMP:
      element = {
        ...init,
        pointsConfig: { isVariable: true, min: 2 },

        parameters: {
          diameter: 170,
          height: 1219,
          thickness: 10,
        },
      } as TProcessHeader;
      break;
    case EProcessElementType.PUMP_PRELUBE:
      element = {
        ...init,
        pointsConfig: { isVariable: true, min: 2 },

        parameters: {
          diameter: 170,
          height: 1219,
          thickness: 10,
        },

        pumpParameters: {
          pumpWidth: 80,
          pumpDiam: 260,
          heightSupport: 220,
          motorLength: 300,
          shaftLength: 390,
          shaftDiam: 50,
          motorDiam: 260,
        },
      };
      break;

    case EProcessElementType.IAF:
      element = {
        ...init,
        pointsConfig: { isVariable: true, min: 2 },
        points: [
          // {
          //   id: 0,
          //   isFixed: false,
          //   connectionType: "START",
          //   isVertical: false,
          //   startPosition: new Vector3(0, 0.375, 0),
          //   generalPosition: new Vector3(0, 0, 1),
          //   ...getNozzleFlangeData(resoures, "30"),
          //   od_MM: 762,
          //   wt_MM: 9.53,
          // },
          // {
          //   id: 1,
          //   isFixed: false,
          //   connectionType: "START",
          //   isVertical: false,
          //   startPosition: new Vector3(0, -0.375, 0),
          //   generalPosition: new Vector3(0, 0, -1),
          //   ...getNozzleFlangeData(resoures, "30"),
          //   od_MM: 762,
          //   wt_MM: 9.53,
          // },
        ],
        parameters: {
          width: 1625.6,
          length: 1625.6,
          height: 1844.68,
        },
      };
      break;

    case EProcessElementType.TGP:
      element = {
        ...init,
        pointsConfig: { isVariable: true, min: 2 },
        points: [
          {
            id: 0,
            connectionType: "START",
            isVertical: false,
            startPosition: new Vector3(-0.7, 0, 0),
            generalPosition: new Vector3(-0.95, 0, 0),
            ...getNozzleFlangeData(resoures, "14", 300, "Welding Neck"),
            od_MM: 355.6,
            wt_MM: 9.53,
          },
          {
            id: 1,
            connectionType: "START",
            isVertical: false,
            startPosition: new Vector3(0.7, 0, 0),
            generalPosition: new Vector3(0.95, 0, 0),
            ...getNozzleFlangeData(resoures, "14", 300, "Welding Neck"),
            od_MM: 355.6,
            wt_MM: 9.53,
          },

          {
            id: 2,
            connectionType: "START",
            isVertical: false,
            startPosition: new Vector3(-0.72, 0.18, 0),
            generalPosition: new Vector3(-0.72, 0.38, 0),
            ...getNozzleFlangeData(resoures, "5", 300, "Welding Neck"),
            od_MM: 141.3,
            wt_MM: 6.55,
          },
          {
            id: 3,
            connectionType: "START",
            isVertical: false,
            startPosition: new Vector3(0.43, -0.16, 0),
            generalPosition: new Vector3(0.43, -0.36, 0),
            ...getNozzleFlangeData(resoures, "5", 300, "Welding Neck"),
            od_MM: 141.3,
            wt_MM: 6.55,
          },
        ],
        parameters: {
          diameter: 406.4,
          length: 1.819,
        },
      };
      break;

    case EProcessElementType.NAH:
      element = {
        ...init,
        pointsConfig: { isVariable: true, min: 2 },
        points: [
          {
            id: 0,
            isVertical: true,
            startPosition: new Vector3(0, 0.5, 0),
            generalPosition: new Vector3(0, 0.6, 0),
            ...getNozzleFlangeData(resoures, "5", 300),
            od_MM: 141.3,
            wt_MM: 6.55,
          },
          {
            id: 1,
            isVertical: true,
            startPosition: new Vector3(0, -0.5, 0),
            generalPosition: new Vector3(0, -0.6, 0),
            ...getNozzleFlangeData(resoures, "5", 300),
            od_MM: 141.3,
            wt_MM: 6.55,
          },
          {
            id: 2,
            connectionType: "START",
            isVertical: false,
            startPosition: new Vector3(0, 0.47, 0),
            generalPosition: new Vector3(0, 0.47, 0.2),
            ...getNozzleFlangeData(resoures, "2"),
            od_MM: 60.3,
            wt_MM: 3.91,
          },
          {
            id: 3,
            connectionType: "START",
            isVertical: false,
            startPosition: new Vector3(0, -0.46, 0),
            generalPosition: new Vector3(-0.06448259, -0.46, 0.199896023),
            ...getNozzleFlangeData(resoures, "2"),
            od_MM: 60.3,
            wt_MM: 3.91,
          },
        ],
        parameters: {
          diameter: 141.3,
          height: 1219.2,
          thickness: 6.55,
        },
      };
      break;
    case EProcessElementType.TAM:
      element = {
        ...init,
        pointsConfig: { isVariable: true, min: 2 },
        points: [
          {
            id: 0,
            connectionType: "START",
            startPosition: new Vector3(),
            generalPosition: new Vector3(l),
            ...getNozzleFlangeData(resoures, "12", 400),
          },
          {
            id: 1,
            connectionType: "END",
            startPosition: new Vector3(),
            generalPosition: new Vector3(-l),
            ...getNozzleFlangeData(resoures, "12", 400),
          },
          {
            id: 2,
            connectionType: "START",
            startPosition: new Vector3(-l / 2),
            generalPosition: new Vector3(-l / 2, length / 3),
            ...getNozzleFlangeData(resoures, "2", 400),
          },
          {
            id: 3,
            connectionType: "START",
            startPosition: new Vector3(l / 2),
            generalPosition: new Vector3(l / 2, length / 2.5),
            ...getNozzleFlangeData(resoures, "2", 400),
          },
        ],
        parameters: {
          diameter: 500,
          length: l * 2,
        },
      } as TProcessHeader;
      break;

    case EProcessElementType.HEADER:
      element = {
        ...init,
        pointsConfig: { isVariable: true, min: 2 },
        points: [
          {
            id: 0,
            connectionType: "START",
            startPosition: new Vector3(),
            generalPosition: new Vector3(l),
          },
          {
            id: 1,
            connectionType: "END",
            startPosition: new Vector3(),
            generalPosition: new Vector3(-l),
          },
        ],
        parameters: {
          diameter: 500,
          length: 0.75,
        },
      } as TProcessHeader;
      break;
    case EProcessElementType.MIX:
      element = {
        ...init,
        pointsConfig: { isVariable: true, min: 3 },
        points: [
          {
            id: 0,
            isFixed: true,
            connectionType: "START",
            startPosition: new Vector3(),
            generalPosition: new Vector3(l),
          },
          {
            id: 1,
            isFixed: true,
            connectionType: "END",
            startPosition: new Vector3(),
            generalPosition: new Vector3(-l, 0, -l_6),
          },
          {
            id: 2,
            isFixed: true,
            connectionType: "END",
            startPosition: new Vector3(),
            generalPosition: new Vector3(-l, 0, l_6),
          },
        ],
      } as TProcessMix;
      break;
    case EProcessElementType.PSV:
      element = {
        ...init,
        pointsConfig: { isVariable: false, min: 2 },
        points: [
          {
            id: 0,
            connectionType: "START",
            startPosition: new Vector3(),
            generalPosition: new Vector3(l),
          },
          {
            id: 1,
            connectionType: "END",
            startPosition: new Vector3(),
            generalPosition: new Vector3(0, -l),
          },
        ],
      };
      break;
    case EProcessElementType.PUMP:
      element = {
        ...init,
        pointsConfig: { isVariable: false, min: 2 },
        points: [
          {
            id: 0,
            isFixed: true,
            connectionType: "END",
            startPosition: new Vector3(0, 0, l_4),
            generalPosition: new Vector3(-(l_8 + l_5), 0, l_4),
            height: 0,
          },
          {
            id: 1,
            isFixed: true,
            connectionType: "START",
            startPosition: new Vector3(0, l_4 - l_1),
            generalPosition: new Vector3(l_4 + l_8 + l_5, l_4 - l_1),
            height: 0,
          },
        ],
        details: {
          efficiency: 0,
          head: 0,
          inletPressure: 0,
          massFlow: 0,
          molarFlow: 0,
          outletPressure: 0,
          power: 0,
          pressureRise: 0,
          speed: 0,
          volumetricFlow: 0,
        },
      } as TProcessPump;
      break;
    case EProcessElementType.SEPARATOR:
      element = {
        ...init,
        pointsConfig: { isVariable: false, min: 3 },
        points: [
          {
            id: 0,
            isFixed: true,
            connectionType: "END",
            startPosition: new Vector3(),
            generalPosition: new Vector3(-0.5),
          },
          {
            id: 1,
            isFixed: true,
            connectionType: "START",
            startPosition: new Vector3(),
            generalPosition: new Vector3(0.5),
          },
          {
            id: 2,
            isFixed: true,
            connectionType: "START",
            startPosition: new Vector3(0.2),
            generalPosition: new Vector3(0.2, -0.25),
            od_MM: 200,
            wt_MM: 2,
          },
        ],
        parameters: {
          diameter: 300,
          length: 0.75,
        },
      };
      break;
    case EProcessElementType.HORIZONTAL_DRUM:
      element = {
        ...init,
        pointsConfig: { isVariable: true, min: 0 },
        points: [
          {
            id: 0,
            startPosition: new Vector3(),
            generalPosition: new Vector3(-0.5),
          },
          {
            id: 1,
            startPosition: new Vector3(),
            generalPosition: new Vector3(0.5),
          },
        ],
        parameters: {
          diameter: 350,
          length: 0.75,
        },
      };
      break;
    case EProcessElementType.SINK:
      element = {
        ...init,
        pointsConfig: { isVariable: false, min: 1 },
        points: [
          {
            id: 0,
            isFixed: true,
            connectionType: "END",
            startPosition: new Vector3(),
            generalPosition: new Vector3(-l),
          },
        ],
      } as TProcessSink;
      break;
    case EProcessElementType.SOURCE:
      element = {
        ...init,
        pointsConfig: { isVariable: false, min: 1 },
        points: [
          {
            id: 0,
            isFixed: true,
            connectionType: "START",
            startPosition: new Vector3(),
            generalPosition: new Vector3(l),
          },
        ],
      } as TProcessSource;
      break;
    case EProcessElementType.SPLIT:
      element = {
        ...init,
        pointsConfig: { isVariable: true, min: 3 },
        points: [
          {
            id: 0,
            isFixed: true,
            connectionType: "END",
            startPosition: new Vector3(),
            generalPosition: new Vector3(-l),
          },
          {
            id: 1,
            connectionType: "START",
            startPosition: new Vector3(),
            generalPosition: new Vector3(l, 0, -l_6),
          },
          {
            id: 2,
            connectionType: "START",
            startPosition: new Vector3(),
            generalPosition: new Vector3(l, 0, l_6),
          },
        ],
      } as TProcessSplit;
      break;
    case EProcessElementType.TANK:
      element = {
        ...init,
        pointsConfig: { isVariable: true, min: 2 },
        points: [
          {
            id: 0,
            isVertical: true,
            startPosition: new Vector3(0, l_8),
            generalPosition: new Vector3(l + l_5, l_8),
          },
          {
            id: 1,
            isVertical: true,
            startPosition: new Vector3(0, -l_8),
            generalPosition: new Vector3(0, -l_8, -(l + l_5)),
          },
        ],
        parameters: {
          diameter: 1000,
          height: 1000,
        },
      } as TProcessTank;
      break;
    case EProcessElementType.VALVE:
      element = {
        ...init,
        pointsConfig: { isVariable: false, min: 2 },
        points: [
          {
            id: 0,
            connectionType: "START",
            startPosition: new Vector3(),
            generalPosition: new Vector3(l),
          },
          {
            id: 1,
            connectionType: "END",
            startPosition: new Vector3(),
            generalPosition: new Vector3(-l),
          },
        ],
        details: {
          flowCoefficient: 0,
          flowType: 0,
          massFlow: 0,
          position: 0,
          pressureDrop: 0,
          vaporFraction: 0,
        },
      } as TProcessValve;
      break;
    case EProcessElementType.PFR:
      element = {
        ...init,
        pointsConfig: { isVariable: false, min: 4 },
        points: [
          {
            id: 0,
            connectionType: "END",
            startPosition: new Vector3(),
            generalPosition: new Vector3(-0.5),
            od_MM: 100,
            wt_MM: 2,
          },
          {
            id: 1,
            isElectrical: true,
            startPosition: new Vector3(0, l_1),
            generalPosition: new Vector3(-l, l_1),
          },
          {
            id: 2,
            connectionType: "START",
            startPosition: new Vector3(),
            generalPosition: new Vector3(0.5),
            od_MM: 100,
            wt_MM: 2,
          },
          {
            id: 3,
            isElectrical: true,
            startPosition: new Vector3(0, l_1),
            generalPosition: new Vector3(l, l_1),
          },
        ],
        parameters: {
          diameter: 200,
          length: 0.75,
        },
      } as TProcessPFR;
      break;
    case EProcessElementType.CSTR:
      element = {
        ...init,
        pointsConfig: { isVariable: true, min: 3 },
        points: [
          {
            id: 0,
            connectionType: "END",
            startPosition: new Vector3(),
            generalPosition: new Vector3(-(l + l_4)),
            od_MM: 200,
            wt_MM: 2,
          },
          {
            id: 1,
            connectionType: "START",
            startPosition: new Vector3(0, l_4 - l_8),
            generalPosition: new Vector3(l + l_4, l_4 - l_8),
            od_MM: 200,
            wt_MM: 2,
          },
          {
            id: 2,
            connectionType: "START",
            startPosition: new Vector3(0, -(l_4 - l_8)),
            generalPosition: new Vector3(l + l_4, -(l_4 - l_8)),
            od_MM: 200,
            wt_MM: 2,
          },
          {
            id: 3,
            isElectrical: true,
            startPosition: new Vector3(),
            generalPosition: new Vector3(0, 0, -(l + l_4)),
          },
          {
            id: 4,
            isElectrical: true,
            startPosition: new Vector3(),
            generalPosition: new Vector3(0, 0, l + l_4),
          },
        ],
        parameters: {
          diameter: 1000,
          height: 1000,
        },
      } as TProcessCSTR;
      break;
    case EProcessElementType.RE:
      element = {
        ...init,
        pointsConfig: { isVariable: true, min: 3 },
        points: [
          {
            id: 0,
            connectionType: "END",
            startPosition: new Vector3(),
            generalPosition: new Vector3(-(l + l_4)),
            od_MM: 200,
            wt_MM: 2,
          },
          {
            id: 1,
            connectionType: "START",
            startPosition: new Vector3(0, l - l_8),
            generalPosition: new Vector3(l + l_4, l - l_8),
            od_MM: 200,
            wt_MM: 2,
          },
          {
            id: 2,
            connectionType: "START",
            startPosition: new Vector3(0, -(l - l_8)),
            generalPosition: new Vector3(l + l_4, -(l - l_8)),
            od_MM: 200,
            wt_MM: 2,
          },
          {
            id: 3,
            isElectrical: true,
            startPosition: new Vector3(),
            generalPosition: new Vector3(0, 0, -(l + l_4)),
          },
          {
            id: 4,
            isElectrical: true,
            startPosition: new Vector3(),
            generalPosition: new Vector3(0, 0, l + l_4),
          },
        ],
        parameters: {
          diameter: 1000,
          height: 1500,
        },
      } as TProcessRE;
      break;
    case EProcessElementType.RC:
      element = {
        ...init,
        pointsConfig: { isVariable: true, min: 3 },
        points: [
          {
            id: 0,
            connectionType: "END",
            startPosition: new Vector3(),
            generalPosition: new Vector3(-(l + l_4)),
            od_MM: 200,
            wt_MM: 2,
          },
          {
            id: 1,
            connectionType: "START",
            startPosition: new Vector3(0, l - l_8),
            generalPosition: new Vector3(l + l_4, l - l_8),
            od_MM: 200,
            wt_MM: 2,
          },
          {
            id: 2,
            connectionType: "START",
            startPosition: new Vector3(0, -(l - l_8)),
            generalPosition: new Vector3(l + l_4, -(l - l_8)),
            od_MM: 200,
            wt_MM: 2,
          },
          {
            id: 3,
            isElectrical: true,
            startPosition: new Vector3(),
            generalPosition: new Vector3(0, 0, -(l + l_4)),
          },
          {
            id: 4,
            isElectrical: true,
            startPosition: new Vector3(),
            generalPosition: new Vector3(0, 0, l + l_4),
          },
        ],
        parameters: {
          diameter: 1000,
          height: 1500,
        },
      } as TProcessRC;
      break;
    case EProcessElementType.RG:
      element = {
        ...init,
        pointsConfig: { isVariable: true, min: 3 },
        points: [
          {
            id: 0,
            connectionType: "END",
            startPosition: new Vector3(),
            generalPosition: new Vector3(-(l + l_4)),
            od_MM: 200,
            wt_MM: 2,
          },
          {
            id: 1,
            connectionType: "START",
            startPosition: new Vector3(0, l - l_8),
            generalPosition: new Vector3(l + l_4, l - l_8),
            od_MM: 200,
            wt_MM: 2,
          },
          {
            id: 2,
            connectionType: "START",
            startPosition: new Vector3(0, -(l - l_8)),
            generalPosition: new Vector3(l + l_4, -(l - l_8)),
            od_MM: 200,
            wt_MM: 2,
          },
          {
            id: 3,
            isElectrical: true,
            startPosition: new Vector3(),
            generalPosition: new Vector3(0, 0, -(l + l_4)),
          },
          {
            id: 4,
            isElectrical: true,
            startPosition: new Vector3(),
            generalPosition: new Vector3(0, 0, l + l_4),
          },
        ],
        parameters: {
          diameter: 1000,
          height: 1500,
        },
      } as TProcessRG;
      break;
    case EProcessElementType.ST_HE_1P:
      element = {
        ...init,
        pointsConfig: { isVariable: false, min: 4 },
        points: [
          {
            id: 0,
            isVertical: true,
            connectionType: "END",
            startPosition: new Vector3(-0.75 / 4),
            generalPosition: new Vector3(-0.75 / 4, -(0.75 / 4 + 0.75 / 8)),
            od_MM: 100,
            wt_MM: 2,
          },
          {
            id: 1,
            isVertical: true,
            connectionType: "END",
            startPosition: new Vector3(0.75 / 4),
            generalPosition: new Vector3(0.75 / 4, 0.75 / 4 + 0.75 / 8),
            od_MM: 50,
            wt_MM: 2,
          },
          {
            id: 2,
            isVertical: true,
            connectionType: "START",
            startPosition: new Vector3(0.75 / 4),
            generalPosition: new Vector3(0.75 / 4, -(0.75 / 4 + 0.75 / 8)),
            od_MM: 100,
            wt_MM: 2,
          },
          {
            id: 3,
            isVertical: true,
            connectionType: "START",
            startPosition: new Vector3(-0.75 / 8),
            generalPosition: new Vector3(-0.75 / 8, -(0.75 / 4 + 0.75 / 8)),
            od_MM: 50,
            wt_MM: 2,
          },
        ],
        parameters: {
          diameter: 300,
          length: 0.75,
        },
      } as TProcessSTHE1P;
      break;
    case EProcessElementType.AC:
      element = {
        ...init,
        pointsConfig: { isVariable: false, min: 4 },
        points: [
          {
            id: 0,
            isVertical: true,
            connectionType: "END",
            startPosition: new Vector3(-0.75 / 4),
            generalPosition: new Vector3(-0.75 / 4, -(0.75 / 4 + 0.75 / 8)),
            od_MM: 100,
            wt_MM: 2,
          },
          {
            id: 1,
            isVertical: true,
            connectionType: "END",
            startPosition: new Vector3(0.75 / 4),
            generalPosition: new Vector3(0.75 / 4, 0.75 / 4 + 0.75 / 8),
            od_MM: 50,
            wt_MM: 2,
          },
          {
            id: 2,
            isVertical: true,
            connectionType: "START",
            startPosition: new Vector3(0.75 / 4),
            generalPosition: new Vector3(0.75 / 4, -(0.75 / 4 + 0.75 / 8)),
            od_MM: 100,
            wt_MM: 2,
          },
          {
            id: 3,
            isVertical: true,
            connectionType: "START",
            startPosition: new Vector3(-0.75 / 8),
            generalPosition: new Vector3(-0.75 / 8, -(0.75 / 4 + 0.75 / 8)),
            od_MM: 50,
            wt_MM: 2,
          },
        ],
        parameters: {
          diameter: 300,
          length: 0.75,
        },
      } as TProcessSTHE1P;
      break;
    case EProcessElementType.ST_HE_2P:
      element = {
        ...init,
        pointsConfig: { isVariable: false, min: 4 },
        points: [
          {
            id: 0,
            isVertical: true,
            connectionType: "END",
            startPosition: new Vector3(0.75 / 4),
            generalPosition: new Vector3(0.75 / 4, 0.75 / 4 + 0.75 / 8),
            od_MM: 100,
            wt_MM: 2,
          },
          {
            id: 1,
            isVertical: true,
            connectionType: "END",
            startPosition: new Vector3(0.75 / 8),
            generalPosition: new Vector3(0.75 / 8, 0.75 / 4 + 0.75 / 8),
            od_MM: 50,
            wt_MM: 2,
          },
          {
            id: 2,
            isVertical: true,
            connectionType: "START",
            startPosition: new Vector3(0.75 / 4),
            generalPosition: new Vector3(0.75 / 4, -(0.75 / 4 + 0.75 / 8)),
            od_MM: 100,
            wt_MM: 2,
          },
          {
            id: 3,
            isVertical: true,
            connectionType: "START",
            startPosition: new Vector3(-0.75 / 4),
            generalPosition: new Vector3(-0.75 / 4, -(0.75 / 4 + 0.75 / 8)),
            od_MM: 50,
            wt_MM: 2,
          },
        ],
        parameters: {
          diameter: 300,
          length: 0.75,
        },
      } as TProcessSTHE2P;
      break;
    case EProcessElementType.HEATER:
      element = {
        ...init,
        pointsConfig: { isVariable: true, min: 2 },
        points: [
          {
            id: 0,
            connectionType: "END",
            startPosition: new Vector3(),
            generalPosition: new Vector3(-(l + l_4) / 2),
            od_MM: 100,
            wt_MM: 2,
          },
          {
            id: 2,
            connectionType: "START",
            startPosition: new Vector3(),
            generalPosition: new Vector3((l + l_4) / 2),
            od_MM: 100,
            wt_MM: 2,
          },
          {
            id: 3,
            isElectrical: true,
            connectionType: "END",
            startPosition: new Vector3(),
            generalPosition: new Vector3(0, 0, (l + l_4) / 2),
          },
        ],
        parameters: {
          diameter: 500,
          height: 650,
        },
      } as TProcessHeater;
      break;
    case EProcessElementType.COOLER:
      element = {
        ...init,
        pointsConfig: { isVariable: true, min: 2 },
        points: [
          {
            id: 0,
            connectionType: "END",
            startPosition: new Vector3(),
            generalPosition: new Vector3(-(l + l_4) / 2),
            od_MM: 100,
            wt_MM: 2,
          },
          {
            id: 2,
            connectionType: "START",
            startPosition: new Vector3(),
            generalPosition: new Vector3((l + l_4) / 2),
            od_MM: 100,
            wt_MM: 2,
          },
          {
            id: 3,
            isElectrical: true,
            connectionType: "START",
            startPosition: new Vector3(),
            generalPosition: new Vector3(0, 0, (l + l_4) / 2),
          },
        ],
        parameters: {
          diameter: 500,
          height: 650,
        },
      } as TProcessCooler;
      break;
    case EProcessElementType.ABSORPTION_COLUMN:
      element = {
        ...init,
        pointsConfig: { isVariable: false, min: 4 },
        points: [
          {
            id: 0,
            connectionType: "END",
            startPosition: new Vector3(0, 0.75 / 4),
            generalPosition: new Vector3(-0.25, 0.75 / 4),
          },
          {
            id: 1,
            connectionType: "END",
            startPosition: new Vector3(0, -0.75 / 4),
            generalPosition: new Vector3(-0.25, -0.75 / 4),
          },
          {
            id: 2,
            connectionType: "START",
            startPosition: new Vector3(0, 0.375),
            generalPosition: new Vector3(0.25, 0.375),
          },
          {
            id: 3,
            connectionType: "START",
            startPosition: new Vector3(0, -0.375),
            generalPosition: new Vector3(0.25, -0.375),
          },
        ],
        parameters: {
          height: 750,
          diameter: 300,
        },
      } as TProcessAbsorptionColumn;
      break;
    case EProcessElementType.COLUMN:
      element = {
        ...init,
        pointsConfig: { isVariable: true, min: 0 },
        points: [
          {
            id: 0,
            startPosition: new Vector3(0, 0.375),
            generalPosition: new Vector3(0.25, 0.375),
          },
          {
            id: 1,
            startPosition: new Vector3(0, -0.375),
            generalPosition: new Vector3(0.25, -0.375),
          },
        ],
        parameters: {
          height: 750,
          diameter: 300,
        },
      } as TProcessAbsorptionColumn;
      break;
    case EProcessElementType.ES:
      element = {
        ...init,
        pointsConfig: { isVariable: true, min: 0 },
        points: [
          {
            id: 0,
            startPosition: new Vector3(0, 0.5, 0),
            generalPosition: new Vector3(0, 0.4, 0.2),
            ...getNozzleFlangeData(resoures, "3", 150),
          },
        ],
        parameters: {
          heightTot: 2000,
          height: 2000,
          diameter1: 100,
          diameter2: 200,
          heightBase: 600,
          thickness: 10,
        },
      } as TProcessExhaustStack;
      break;
    case EProcessElementType.NOX_ABATOR:
      element = {
        ...init,
        pointsConfig: { isVariable: true, min: 0 },
        points: [
          {
            id: 0,
            isFixed: false,
            connectionType: "START",
            isVertical: false,
            startPosition: new Vector3(0, 1.2 - 0.2, 0),
            generalPosition: new Vector3(0, 1.9 - 0.2, 0),
            ...getNozzleFlangeData(resoures, "16", 300),
            od_MM: 406.4,
            wt_MM: 9.53,
          },
          {
            id: 1,
            isFixed: true,
            connectionType: "START",
            isVertical: false,
            startPosition: new Vector3(0, -1.2 + 0.7, 0),
            generalPosition: new Vector3(0, -1.9 + 0.7, 0),
            ...getNozzleFlangeData(resoures, "14", 300),
            od_MM: 355.4,
            wt_MM: 9.53,
          },
        ],
        parameters: {
          height: 3284.98,
          diameter: 1652,
          thickness: 10,
        },
      };
      break;
    case EProcessElementType.AIRPHIN_COOLER:
      element = {
        ...init,
        pointsConfig: { isVariable: true, min: 0 },
        parameters: {
          width: 0.5,
          height: 0.25,
          length: 1,
          legs: [
            {
              id: 1,
              width: 0.1,
              height: 0.25,
              length: 0.1,
            },
            {
              id: 2,
              width: 0.1,
              height: 0.25,
              length: 0.1,
            },
            {
              id: 3,
              width: 0.1,
              height: 0.25,
              length: 0.1,
            },
            {
              id: 4,
              width: 0.1,
              height: 0.25,
              length: 0.1,
            },
          ],
        },
      } as TProcessAirphinCooler;
      break;
    case EProcessElementType.SKID:
      element = {
        ...init,
        pointsConfig: { isVariable: true, min: 0 },
        parameters: { width: 0.5, height: 0.25, length: 1 },
      } as TProcessSkid;
      break;
    case EProcessElementType.OTHER:
      element = {
        ...init,
        pointsConfig: { isVariable: true, min: 0 },
        parameters: { width: 0.5, height: 0.25, length: 1 },
      } as TProcessOther;
      break;
  }
  return action(EProcessActionTypes.CREATE_ELEMENT, { process, element });
};

const changeProcessElementAction = (
  process: string,
  name: string,
  element: TProcessElement
) => action(EProcessActionTypes.CHANGE_ELEMENT, { process, name, element });

const relocateProcessElementAction = (
  process: string,
  element: TProcessElement
) => action(EProcessActionTypes.RELOCATE_ELEMENT, { process, element });

const removeProcessElementAction = (process: string, name: string) =>
  action(EProcessActionTypes.REMOVE_ELEMENT, { process, name });

const selectProcessElementAction = (element?: TProcessElement) =>
  action(EProcessActionTypes.SELECT_ELEMENT, { element });

const selectProcessElementNozzlePointAction = (
  element?: TProcessElement,
  point?: TProcessElementPoint
) =>
  action(EProcessActionTypes.SELECT_ELEMENT_POINT_NOZZLE, { element, point });

const selectProcessElementNozzleAction = (element?: TProcessElement) =>
  action(EProcessActionTypes.SELECT_ELEMENT_NOZZLE, { element });

const createInstrElementAction = (
  process: string,
  element: TInstrumentationElement
) => action(EProcessActionTypes.CREATE_INSTR_ELEMENT, { process, element });

const changeInstrElementAction = (
  process: string,
  element: TInstrumentationElement
) => action(EProcessActionTypes.CHANGE_INSTR_ELEMENT, { process, element });

const changeInstrElementFieldAction = (
  process: string,
  id: number,
  field: string,
  value: any
) =>
  action(EProcessActionTypes.CHANGE_INSTR_ELEMENT_FIELD, {
    process,
    id,
    field,
    value,
  });

const removeInstrElementAction = (
  process: string,
  element: TInstrumentationElement
) => action(EProcessActionTypes.REMOVE_INSTR_ELEMENT, { process, element });

const selectInstrElementAction = (element?: TInstrumentationElement) =>
  action(EProcessActionTypes.SELECT_INSTR_ELEMENT, { element });

const selectConnectionPointAction = (element: TProcessElement, id: number) =>
  action(EProcessActionTypes.SELECT_CONNECTION_POINT, { element, id });

const changeProcessElementConnections = (
  process: string,
  element: TProcessElement,
  points: TProcessElementPoint[]
) =>
  action(EProcessActionTypes.CHANGE_ELEMENTS_CONNECTIONS, {
    process,
    element,
    points,
  });

const connectProcessElementAction = (
  state: TProcessState,
  processName: string,
  next: TProcessElement,
  pointId: number
) => {
  const process = state.processes.get(processName);

  const p: TProcessElement = { ...state.selected! };
  const n: TProcessElement = { ...next };

  const order: TProcessLineOrder = "XYZ";

  const spId = state.selectedPoint?.id;

  const start = new Vector3(p.position.x, p.position.y, p.position.z);
  const startDir = new Vector3();
  const end = new Vector3(n.position.x, n.position.y, n.position.z);
  const endDir = new Vector3();

  const starts: TProcessElementPoint[] = [];
  const ends: TProcessElementPoint[] = [];

  let lines = process?.lines ?? [];

  let prevPoint: TProcessElementPoint | null = null;

  for (const point of p.points) {
    if (point.id !== spId) {
      starts.push(point);
      continue;
    }
    prevPoint = { ...point };
    const globalGeneralPosition = point.generalPosition
      .clone()
      .applyAxisAngle(new Vector3(1), degToRad(p.rotationX ?? 0))
      .applyAxisAngle(new Vector3(0, 1), degToRad(p.rotation))
      .applyAxisAngle(new Vector3(0, 0, 1), degToRad(p.rotationZ ?? 0));
    startDir
      .copy(globalGeneralPosition)
      .sub(
        point.startPosition
          .clone()
          .applyAxisAngle(new Vector3(1), degToRad(p.rotationX ?? 0))
          .applyAxisAngle(new Vector3(0, 1), degToRad(p.rotation))
          .applyAxisAngle(new Vector3(0, 0, 1), degToRad(p.rotationZ ?? 0))
      )
      .normalize();
    start.add(globalGeneralPosition);
    starts.push({ ...point, element: n.name, connectionType: "START" });
    if (!point.element) continue;
    const next = process?.elements.get(point.element);
    if (!next) continue;
    process!.elements.set(next.name, resetProcessPoint(next, p.name));
    lines = lines.filter((l) => l.from === p.name && l.to === next.name);
  }

  for (const point of n.points) {
    if (point.id !== pointId) {
      ends.push(point);
      continue;
    }
    const globalGeneralPosition = point.generalPosition
      .clone()
      .applyAxisAngle(new Vector3(1), degToRad(n.rotationX ?? 0))
      .applyAxisAngle(new Vector3(0, 1), degToRad(n.rotation))
      .applyAxisAngle(new Vector3(0, 0, 1), degToRad(n.rotationZ ?? 0));
    endDir
      .copy(globalGeneralPosition)
      .sub(
        point.startPosition
          .clone()
          .applyAxisAngle(new Vector3(1), degToRad(n.rotationX ?? 0))
          .applyAxisAngle(new Vector3(0, 1), degToRad(n.rotation))
          .applyAxisAngle(new Vector3(0, 0, 1), degToRad(n.rotationZ ?? 0))
      )
      .normalize();
    end.add(globalGeneralPosition);
    ends.push({ ...point, element: p.name, connectionType: "END" });
  }

  process?.elements.set(p.name, { ...p, points: [...starts] });
  process?.elements.set(n.name, { ...n, points: [...ends] });

  const segments: TProcessLineSegment[] = [];

  const initialLength: number =
    prevPoint && prevPoint.od_MM
      ? MMtoM(prevPoint.od_MM * 3)
      : MMtoM(p.parameters?.diameter) ?? 0;
  let endSegment: TProcessLineSegment;
  if (initialLength) {
    const newStart = roundVectorM(
      start.clone().add(startDir.multiplyScalar(initialLength))
    );
    segments.push({
      id: getNextId(segments),
      start: roundVectorM(start).clone(),
      end: newStart.clone(),
    });
    start.copy(newStart);

    const newEnd = roundVectorM(
      end.clone().add(endDir.multiplyScalar(initialLength))
    );

    endSegment = {
      id: 0,
      start: newEnd.clone(),
      end: roundVectorM(end).clone(),
    };

    end.copy(newEnd);
  }

  if (start.x !== end.x) {
    if (start.y !== end.y) {
      if (start.z !== end.z) {
        segments.push({
          id: getNextId(segments),
          start,
          end: new Vector3(end.x, start.y, start.z),
        });
        segments.push({
          id: getNextId(segments),
          start: new Vector3(end.x, start.y, start.z),
          end: new Vector3(end.x, end.y, start.z),
        });
        segments.push({
          id: getNextId(segments),
          start: new Vector3(end.x, end.y, start.z),
          end,
        });
      }
    } else if (start.z !== end.z) {
      segments.push({
        id: getNextId(segments),
        start,
        end: new Vector3(end.x, start.y, start.z),
      });
      segments.push({
        id: getNextId(segments),
        start: new Vector3(end.x, start.y, start.z),
        end,
      });
    } else segments.push({ id: getNextId(segments), start, end });
  } else if (start.y !== end.y) {
    if (start.z !== end.z) {
      segments.push({
        id: getNextId(segments),
        start,
        end: new Vector3(start.x, end.y, start.z),
      });
      segments.push({
        id: getNextId(segments),
        start: new Vector3(start.x, end.y, start.z),
        end,
      });
    } else segments.push({ id: getNextId(segments), start, end });
  } else segments.push({ id: getNextId(segments), start, end });

  // @ts-ignore
  if (endSegment) segments.push({ ...endSegment, id: getNextId(segments) });

  const id = getNextId(lines);
  lines.push({
    id,
    order,
    processLineNo: id,
    from: p.name,
    to: n.name,
    type: "LINE",
    initialLength,
    segments,
  });

  return action(EProcessActionTypes.CONNECT_ELEMENTS, {
    processName,
    process,
    lines,
    selected: process?.elements.get(p.name),
  });
};

function resetProcessPoint(element: TProcessElement, connected: string) {
  return {
    ...element,
    points: element.points.map((point) => {
      return point.element === connected
        ? {
            ...point,
            element: undefined,
            connectionType: point.isFixed ? point.connectionType : undefined,
          }
        : point;
    }),
  };
}

const createCustomElementsConnectionAction = (
  processName: string,
  process: TProcess,
  lines: TProcessLine[]
) => {
  return action(EProcessActionTypes.CREATE_CUSTOM_ELEMENTS_CONNECTION, {
    processName,
    process,
    lines,
  });
};

const changeConnectionAction = (
  processName: string,
  process: TProcess,
  lines: TProcessLine[]
) => {
  return action(EProcessActionTypes.CHANGE_CONNECTION_ACTION, {
    processName,
    process,
    lines,
  });
};

const changeProcessAnalysisAction = (processName: string, process: TProcess) =>
  action(EProcessActionTypes.CHANGE_ANALYSIS, { processName, process });

const loadProcessAction = (processName: string, process: TProcess) =>
  action(EProcessActionTypes.LOAD_PROCESS, { processName, process });

const changeProcessIssuesAction = (
  processName: string,
  issues: TProcessIssue[]
) => action(EProcessActionTypes.CHANGE_PROCESS_ISSUES, { processName, issues });

const changeProcessImportedAction = (
  processName: string,
  news: TProcess,
  imported: TProcessIssue[]
) =>
  action(EProcessActionTypes.CHANGE_PROCESS_IMPORTED, {
    processName,
    news,
    imported,
  });

const selectProcessLineAction = (line?: TProcessLine) =>
  action(EProcessActionTypes.SELECT_PROCESS_LINE, { line });

const changeProcessLineAction = (processName: string, line: TProcessLine) =>
  action(EProcessActionTypes.CHANGE_PROCESS_LINE, { processName, line });

const removeProcessLineAction = (processName: string, line: TProcessLine) =>
  action(EProcessActionTypes.REMOVE_PROCESS_LINE, { processName, line });

const changeProcessTitlesAction = (
  processName: string,
  field: string,
  value: any
) => action(EProcessActionTypes.CHANGE_TITLES, { processName, field, value });

const changeProcessRevisionsAction = (
  processName: string,
  revisions: TProcessRevision[]
) => action(EProcessActionTypes.CHANGE_REVISION, { processName, revisions });

const connectInstrElementAction = (
  processName: string,
  from: TInstrumentationElement,
  to: TInstrumentationElement
) =>
  action(EProcessActionTypes.CONNECT_INSTR_ELEMENT, { processName, from, to });

const createInstrLineAction = (
  processName: string,
  line: TInstrumentationLine
) => action(EProcessActionTypes.CREATE_INSTR_LINE, { processName, line });

const changeInstrLineAction = (
  processName: string,
  line: TInstrumentationLine
) => action(EProcessActionTypes.CHANGE_INSTR_LINE, { processName, line });

const removeInstrLineAction = (
  processName: string,
  line: TInstrumentationLine
) => action(EProcessActionTypes.REMOVE_INSTR_LINE, { processName, line });

const selectInstrLineAction = (line?: TInstrumentationLine) =>
  action(EProcessActionTypes.SELECT_INSTR_LINE, { line });

export {
  loadProcessAction,
  createProcessAction,
  setProcessAction,
  renameProcessAction,
  removeProcessAction,
  createProcessElementAction,
  changeProcessElementAction,
  removeProcessElementAction,
  selectProcessElementAction,
  selectProcessElementNozzlePointAction,
  selectProcessElementNozzleAction,
  relocateProcessElementAction,
  createInstrElementAction,
  changeInstrElementAction,
  changeInstrElementFieldAction,
  removeInstrElementAction,
  selectInstrElementAction,
  selectConnectionPointAction,
  connectProcessElementAction,
  createCustomElementsConnectionAction,
  changeConnectionAction,
  changeProcessElementConnections,
  changeProcessAnalysisAction,
  changeProcessIssuesAction,
  changeProcessImportedAction,
  selectProcessLineAction,
  changeProcessLineAction,
  removeProcessLineAction,
  changeProcessTitlesAction,
  changeProcessRevisionsAction,
  connectInstrElementAction,
  changeInstrLineAction,
  removeInstrLineAction,
  selectInstrLineAction,
  createInstrLineAction,
};
