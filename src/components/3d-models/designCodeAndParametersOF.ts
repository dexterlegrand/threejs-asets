import {
  Scene,
  Vector3,
  Vector2,
  MeshBasicMaterial,
  Mesh,
  CylinderBufferGeometry,
} from "three";
import {
  Project,
  LC_Condition,
  Releases,
  Orientation,
  Direction2,
  SimpleDirection,
  LoadType,
} from "../../store/main/types";
import {
  TOpenFrame,
  TBeamElement,
  TColumnOF,
  TBeamOF,
  TCantileverOF,
  TPipeOF,
  TFPElementOF,
  TStaircaseOF,
  TPlatformOF,
  TRBasePlateOF,
  TRSpliceFlangeOF,
  TTPElementOF,
  TCTElementOF,
  TVerticalBracingOF,
} from "../../store/main/openFrameTypes";
import {
  localToGlobal,
  MtoMM,
  fixValueToNumber,
  fixVectorByOrientation,
  getElementByName,
  checkRange,
  getElementByField,
  getRotationByLegs,
  getPosByDistance,
  radToDeg,
  getUnicuesArray,
  replaceSplitNumber,
  roundVectorM,
  roundM,
  getProfileLibrary,
  hardCheckRange,
  getDirection as getDirection3,
  getNextId,
  getIndexName,
  degToRad,
  getSimpleDirection,
} from "./utils";
import {
  OpenFrameUI,
  LoadingsUI,
  DeadLoadsUI,
  LoadCombinationUI,
  AdditionalLoadUI,
  LiveLoadsUI,
  WindLoadUI,
  BlanketLoadUI,
  DesignCodeAndParametersUI,
  AvailableSectionListUI,
  AccessoriesTPLoad,
  AccessoriesFPLoad,
  AccessoriesCTLoad,
  AmericanEffectiveLengthUI,
} from "../../store/ui/types";
import {
  getBeamElementsOfModel,
  getMapOfBeamElements,
  mapToArray,
  getMaxAndMinPoints,
  updateConnections,
  setPositionAndDirection,
} from "./openFrame";
import {
  deg90InRad,
  deg180InRad,
  beamColorRGB,
} from "../../store/main/constants";
import {
  Section,
  Material,
  RolledSection,
  CombinationType,
  CombinedSection,
  DataState,
} from "../../store/data/types";
import { createElementByProfile } from "./profileElement";

export type Node = {
  nodeNumber: number;
  x: number;
  y: number;
  z: number;
  memberNames: string; // all members that are connected with this node
};

export type BeamElement = {
  label: number;
  nodes: number[];
  bodyLoads: string[];
  boundaryLoads: any[];
  section: number;
  zAxis: number[];
  beamHinges: boolean[];
};

export type BeamNode = {
  label: number;
  coordinates: number[];
  loads: [];
  boundaryConditionsOne: "Fixed" | "Pinned" | "";
};

export type Member = {
  label: number;
  name: string;
  type: string | undefined;
  profileName?: string;
  countryCode: string | null;
  profileType: string | null;
  length: number;
  thickness: number;
  width: number;

  FabProfType: "I" | "C" | "O" | "L" | "Box" | null;
  FabProfDepth: number | null;
  FabProfWidth: number | null;
  FabProfTFthk: number | null;
  FabProfBFthk: number | null;
  FabProfWebThk: number | null;
  // if shape O
  FabProfOd: number | null;
  FabProfID: number | null;

  RolWthPltCountryCode: string | null;
  RolWthPltProfile: string | null;
  RolWthPltTPWidth: number | null;
  RolWthPltTPthk: number | null;
  RolWthPltBPWidth: number | null;
  RolWthPltBPthk: number | null;

  pipeouterdiameter: number | null;
  pipewallthickness: number | null;
  pipematerial: any | null;

  combination: CombinationType | null;
  clearGap: number | null;

  ky?: number | null;
  kz?: number | null;
  Ly?: number | null;
  Lz?: number | null;
};

type FireProofLoad = {
  fpDensity: number;
  fpThickness: number;
  fpHeight: number;
  fpApp: "All elements" | "Only Columns and Beams";
  fpDf: number;
  boxFpList: { label: number; length: number }[];
  profFpList: { label: number; length: number }[];
};

type DeadLoad = {
  selfWeightFactor: number;
  platformDeadLoadIntensity: number;
  stairDeadLoadIntensity: number;
  fireProofLoad: FireProofLoad;
  additionalLoad: {
    udl: any;
    pointLoad: any;
  };
  accessories: any;
};

type LiveLoad = {
  platformLiveLoadIntensity: number;
  stairLiveLoadIntensity: number;
  additionalLoad: {
    udl: any;
    pointLoad: any;
  };
};

type LoadComb = {
  number: number;
  limitState: string;
  loadCondition: LC_Condition;
  deadLoad: number;
  liveLoad: number;
  temperatureLoad: number;
  pipingEmptyLoad: number;
  pipingTestingLoad: number;
  pipingOperatingLoad: number;
  pipingThermalAnchorLoad: number;
  pipingThermalFrictionLoad: number;
  equipmentEmptyLoad: number;
  equipmentTestingLoad: number;
  equipmentOperatingLoad: number;
  windLoadPlusX0Deg: number;
  windLoadPlusXMinusZ45Deg: number;
  windLoadMinusZ90Deg: number;
  windLoadMinusZMinusX135Deg: number;
  windLoadMinusX180Deg: number;
  windLoadMinusXPlusZ225Deg: number;
  windLoadPlusZ270Deg: number;
  windLoadPlusZPlusX315Deg: number;
  seismicX: number;
  seismicZ: number;
  seismicY: number;
};

function getAdditionalLoadsParams(
  load: "deadLoadUI" | "liveLoadUI" | "windLoadUI",
  loadings: LoadingsUI,
  model: TOpenFrame,
  element: TBeamElement,
  points: number[]
) {
  const udls: number[][] = [];
  const loadPoints: number[] = [];
  const loadsUI = loadings[load];
  const elementLoads = loadsUI.loads.filter(
    (elLoad) => elLoad.model === model.name && elLoad.element === element.name
  );
  for (const elementLoad of elementLoads) {
    if (elementLoad.lengthOfUDL) {
      if (!points.includes(elementLoad.distance))
        points.push(elementLoad.distance);
      if (
        !points.includes(roundM(elementLoad.distance + elementLoad.lengthOfUDL))
      )
        points.push(roundM(elementLoad.distance + elementLoad.lengthOfUDL));
      udls.push([
        elementLoad.distance,
        roundM(elementLoad.distance + elementLoad.lengthOfUDL),
      ]);
    } else {
      if (!points.includes(elementLoad.distance))
        points.push(elementLoad.distance);
      loadPoints.push(elementLoad.distance);
    }
  }
  return { udls, loadPoints };
}

export function splitColumns(
  map: Map<string, TBeamElement>,
  model: TOpenFrame,
  columns: TColumnOF[],
  loadings?: LoadingsUI
) {
  let newColumns: any[] = [];
  columns.forEach((column) => {
    let splitPoints: number[] = [0, column.startPos.distanceTo(column.endPos)];

    column.connected.forEach((conn) => {
      const connected = map.get(conn);
      if (connected) {
        if (
          connected.startConnected.includes(column.name) ||
          (connected.connected.includes(column.name) &&
            (connected.type === "BEAM" || connected.type === "CANTILEVER"))
        ) {
          splitPoints = [
            ...splitPoints,
            connected.startPos.y - column.startPos.y,
          ];
        } else if (connected.endConnected.includes(column.name)) {
          splitPoints = [
            ...splitPoints,
            connected.endPos.y - column.startPos.y,
          ];
        }
      }
    });

    let DLParams, LLParams, WLParams;

    if (loadings) {
      DLParams = getAdditionalLoadsParams(
        "deadLoadUI",
        loadings,
        model,
        column,
        splitPoints
      );
      LLParams = getAdditionalLoadsParams(
        "liveLoadUI",
        loadings,
        model,
        column,
        splitPoints
      );
      WLParams = getAdditionalLoadsParams(
        "windLoadUI",
        loadings,
        model,
        column,
        splitPoints
      );
    }

    splitPoints = getUnicuesArray(splitPoints)
      .map((p) => roundM(p))
      .sort((a, b) => a - b);
    const newVector = column.startPos.clone();
    for (let i = 1; i < splitPoints.length; i++) {
      const startPos = newVector.clone();
      const endPos = roundVectorM(
        newVector.setY(column.startPos.y + splitPoints[i])
      ).clone();
      const isStart = startPos.equals(column.startPos);
      const isEnd = endPos.equals(column.endPos);
      newColumns = [
        ...newColumns,
        {
          ...column,
          name: splitPoints.length > 2 ? `${column.name}.${i}` : column.name,
          startPos,
          endPos,
          releases: {
            fx1: isStart ? column.releases?.fx1 : undefined,
            fy1: isStart ? column.releases?.fy1 : undefined,
            fz1: isStart ? column.releases?.fz1 : undefined,
            mx1: isStart ? column.releases?.mx1 : undefined,
            my1: isStart ? column.releases?.my1 : undefined,
            mz1: isStart ? column.releases?.mz1 : undefined,

            fx2: isEnd ? column.releases?.fx2 : undefined,
            fy2: isEnd ? column.releases?.fy2 : undefined,
            fz2: isEnd ? column.releases?.fz2 : undefined,
            mx2: isEnd ? column.releases?.mx2 : undefined,
            my2: isEnd ? column.releases?.my2 : undefined,
            mz2: isEnd ? column.releases?.mz2 : undefined,
          },
          deadLoadPointS: DLParams?.loadPoints.find(
            (lp) => lp === roundM(Math.abs(startPos.y - column.startPos.y))
          ),
          deadLoadPointE: DLParams?.loadPoints.find(
            (lp) => lp === roundM(Math.abs(endPos.y - column.startPos.y))
          ),
          deadLoadUDL: DLParams?.udls.find(
            (udl) =>
              udl[0] <= roundM(Math.abs(startPos.y - column.startPos.y)) &&
              udl[1] >= roundM(Math.abs(endPos.y - column.startPos.y))
          ),
          liveLoadPointS: LLParams?.loadPoints.find(
            (lp) => lp === roundM(Math.abs(startPos.y - column.startPos.y))
          ),
          liveLoadPointE: LLParams?.loadPoints.find(
            (lp) => lp === roundM(Math.abs(endPos.y - column.startPos.y))
          ),
          liveLoadUDL: LLParams?.udls.find(
            (udl) =>
              udl[0] <= roundM(Math.abs(startPos.y - column.startPos.y)) &&
              udl[1] >= roundM(Math.abs(endPos.y - column.startPos.y))
          ),
          windLoadPointS: WLParams?.loadPoints.find(
            (lp) => lp === roundM(Math.abs(startPos.y - column.startPos.y))
          ),
          windLoadPointE: WLParams?.loadPoints.find(
            (lp) => lp === roundM(Math.abs(endPos.y - column.startPos.y))
          ),
          windLoadUDL: WLParams?.udls.find(
            (udl) =>
              udl[0] <= roundM(Math.abs(startPos.y - column.startPos.y)) &&
              udl[1] >= roundM(Math.abs(endPos.y - column.startPos.y))
          ),
        },
      ];
    }
  });
  return newColumns;
}

export function splitBeams(
  map: Map<string, TBeamElement>,
  model: TOpenFrame,
  beams: TBeamOF[],
  loadings?: LoadingsUI
) {
  let newBeams: any[] = [];
  for (const beam of beams) {
    let splitPoints: number[] = [0, beam.startPos.distanceTo(beam.endPos)];

    const isX = roundM(beam.startPos.z) === roundM(beam.endPos.z);

    for (const conn of beam.connected) {
      const connected = map.get(conn);
      if (!connected) continue;
      let distance = 0;
      if (connected.startConnected.includes(beam.name)) {
        distance = beam.startPos.distanceTo(connected.startPos);
      } else if (connected.endConnected.includes(beam.name)) {
        distance = beam.startPos.distanceTo(connected.endPos);
      }
      splitPoints = [...splitPoints, distance];
    }

    let DLParams, LLParams, WLParams;
    const directLoadPoints: number[] = [];
    const equipmentLoadPoints: number[] = [];

    if (loadings) {
      DLParams = getAdditionalLoadsParams(
        "deadLoadUI",
        loadings,
        model,
        beam,
        splitPoints
      );
      LLParams = getAdditionalLoadsParams(
        "liveLoadUI",
        loadings,
        model,
        beam,
        splitPoints
      );
      WLParams = getAdditionalLoadsParams(
        "windLoadUI",
        loadings,
        model,
        beam,
        splitPoints
      );

      const directLoads = loadings.pipingLoadsUI.directLoads.filter(
        (load) => load.model === model.name && load.element === beam.name
      );
      for (const directLoad of directLoads) {
        if (!splitPoints.includes(directLoad.distance))
          splitPoints.push(directLoad.distance);
        directLoadPoints.push(directLoad.distance);
      }
      const equipmentLoads = loadings.equipmentLoadUI.filter(
        (load) => load.model === model.name && load.element === beam.name
      );
      for (const equipmentLoad of equipmentLoads) {
        if (!splitPoints.includes(equipmentLoad.distance))
          splitPoints.push(equipmentLoad.distance);
        equipmentLoadPoints.push(equipmentLoad.distance);
      }
    }

    splitPoints = getUnicuesArray(splitPoints.map((p) => roundM(p))).sort(
      (a, b) => a - b
    );
    const newVector = roundVectorM(beam.startPos.clone());
    for (let i = 1; i < splitPoints.length; i++) {
      const startPos = newVector.clone();
      const endPos = newVector
        .copy(
          roundVectorM(
            getPosByDistance(splitPoints[i], beam.startPos, beam.endPos)
          )
        )
        .clone();
      const isStart = startPos.equals(beam.startPos);
      const isEnd = endPos.equals(beam.endPos);
      newBeams = [
        ...newBeams,
        {
          ...beam,
          name: splitPoints.length > 2 ? `${beam.name}.${i}` : beam.name,
          startPos,
          endPos,
          releases: {
            fx1: isStart ? beam.releases?.fx1 : undefined,
            fy1: isStart ? beam.releases?.fy1 : undefined,
            fz1: isStart ? beam.releases?.fz1 : undefined,
            mx1: isStart ? beam.releases?.mx1 : undefined,
            my1: isStart ? beam.releases?.my1 : undefined,
            mz1: isStart ? beam.releases?.mz1 : undefined,

            fx2: isEnd ? beam.releases?.fx2 : undefined,
            fy2: isEnd ? beam.releases?.fy2 : undefined,
            fz2: isEnd ? beam.releases?.fz2 : undefined,
            mx2: isEnd ? beam.releases?.mx2 : undefined,
            my2: isEnd ? beam.releases?.my2 : undefined,
            mz2: isEnd ? beam.releases?.mz2 : undefined,
          },
          deadLoadPointS: isX
            ? DLParams?.loadPoints.find(
                (lp) => lp === roundM(Math.abs(startPos.x - beam.startPos.x))
              )
            : DLParams?.loadPoints.find(
                (lp) => lp === roundM(Math.abs(beam.startPos.z - startPos.z))
              ),
          deadLoadPointE: isX
            ? DLParams?.loadPoints.find(
                (lp) => lp === roundM(Math.abs(endPos.x - beam.startPos.x))
              )
            : DLParams?.loadPoints.find(
                (lp) => lp === roundM(Math.abs(beam.startPos.z - endPos.z))
              ),
          deadLoadUDL: DLParams?.udls.find(
            (udl) =>
              udl[0] <=
                (isX
                  ? roundM(Math.abs(startPos.x - beam.startPos.x))
                  : roundM(Math.abs(beam.startPos.z - startPos.z))) &&
              udl[1] >=
                (isX
                  ? roundM(Math.abs(endPos.x - beam.startPos.x))
                  : roundM(Math.abs(beam.startPos.z - endPos.z)))
          ),
          liveLoadPointS: isX
            ? LLParams?.loadPoints.find(
                (lp) => lp === roundM(Math.abs(startPos.x - beam.startPos.x))
              )
            : LLParams?.loadPoints.find(
                (lp) => lp === roundM(Math.abs(beam.startPos.z - startPos.z))
              ),
          liveLoadPointE: isX
            ? LLParams?.loadPoints.find(
                (lp) => lp === roundM(Math.abs(endPos.x - beam.startPos.x))
              )
            : LLParams?.loadPoints.find(
                (lp) => lp === roundM(Math.abs(beam.startPos.z - endPos.z))
              ),
          liveLoadUDL: LLParams?.udls.find(
            (udl) =>
              udl[0] <=
                (isX
                  ? roundM(Math.abs(startPos.x - beam.startPos.x))
                  : roundM(Math.abs(beam.startPos.z - startPos.z))) &&
              udl[1] >=
                (isX
                  ? roundM(Math.abs(endPos.x - beam.startPos.x))
                  : roundM(Math.abs(beam.startPos.z - endPos.z)))
          ),
          windLoadPointS: isX
            ? WLParams?.loadPoints.find(
                (lp) => lp === roundM(Math.abs(startPos.x - beam.startPos.x))
              )
            : WLParams?.loadPoints.find(
                (lp) => lp === roundM(Math.abs(beam.startPos.z - startPos.z))
              ),
          windLoadPointE: isX
            ? WLParams?.loadPoints.find(
                (lp) => lp === roundM(Math.abs(endPos.x - beam.startPos.x))
              )
            : WLParams?.loadPoints.find(
                (lp) => lp === roundM(Math.abs(beam.startPos.z - endPos.z))
              ),
          windLoadUDL: WLParams?.udls.find(
            (udl) =>
              udl[0] <=
                (isX
                  ? roundM(Math.abs(startPos.x - beam.startPos.x))
                  : roundM(Math.abs(beam.startPos.z - startPos.z))) &&
              udl[1] >=
                (isX
                  ? roundM(Math.abs(endPos.x - beam.startPos.x))
                  : roundM(Math.abs(beam.startPos.z - endPos.z)))
          ),
          directLoadPointS: isX
            ? directLoadPoints.find(
                (lp) => lp === roundM(Math.abs(startPos.x - beam.startPos.x))
              )
            : directLoadPoints.find(
                (lp) => lp === roundM(Math.abs(beam.startPos.z - startPos.z))
              ),
          directLoadPointE: isX
            ? directLoadPoints.find(
                (lp) => lp === roundM(Math.abs(endPos.x - beam.startPos.x))
              )
            : directLoadPoints.find(
                (lp) => lp === roundM(Math.abs(beam.startPos.z - endPos.z))
              ),
          equipmentLoadS: isX
            ? equipmentLoadPoints.find(
                (lp) => lp === roundM(Math.abs(startPos.x - beam.startPos.x))
              )
            : equipmentLoadPoints.find(
                (lp) => lp === roundM(Math.abs(beam.startPos.z - startPos.z))
              ),
          equipmentLoadE: isX
            ? equipmentLoadPoints.find(
                (lp) => lp === roundM(Math.abs(endPos.x - beam.startPos.x))
              )
            : equipmentLoadPoints.find(
                (lp) => lp === roundM(Math.abs(beam.startPos.z - endPos.z))
              ),
        },
      ];
    }
  }
  return newBeams;
}

export function splitCantilevers(
  map: Map<string, TBeamElement>,
  model: TOpenFrame,
  cnts: TCantileverOF[],
  loadings?: LoadingsUI
) {
  let newBeams: any[] = [];
  cnts.forEach((beam) => {
    let splitPoints: number[] = [0, beam.startPos.distanceTo(beam.endPos)];

    const isX = roundM(beam.startPos.z) === roundM(beam.endPos.z);
    beam.connected.forEach((conn) => {
      const connected = map.get(conn);
      if (connected) {
        if (
          connected.startConnected.includes(beam.name) ||
          (connected.connected.includes(beam.name) &&
            connected.type === "COLUMN")
        ) {
          const distance = roundM(beam.startPos.distanceTo(connected.startPos));
          splitPoints = [...splitPoints, distance];
        } else if (connected.endConnected.includes(beam.name)) {
          const distance = roundM(beam.startPos.distanceTo(connected.endPos));
          splitPoints = [...splitPoints, distance];
        }
      }
    });

    let DLParams, LLParams, WLParams;

    if (loadings) {
      DLParams = getAdditionalLoadsParams(
        "deadLoadUI",
        loadings,
        model,
        beam,
        splitPoints
      );
      LLParams = getAdditionalLoadsParams(
        "liveLoadUI",
        loadings,
        model,
        beam,
        splitPoints
      );
      WLParams = getAdditionalLoadsParams(
        "windLoadUI",
        loadings,
        model,
        beam,
        splitPoints
      );
    }

    splitPoints = getUnicuesArray(splitPoints)
      .map((p) => roundM(p))
      .sort((a, b) => a - b);
    const newVector = roundVectorM(beam.startPos.clone());
    for (let i = 1; i < splitPoints.length; i++) {
      const startPos = newVector.clone();
      const endPos = newVector
        .copy(
          roundVectorM(
            getPosByDistance(splitPoints[i], beam.startPos, beam.endPos)
          )
        )
        .clone();
      const isStart = startPos.equals(beam.startPos);
      const isEnd = endPos.equals(beam.endPos);
      newBeams = [
        ...newBeams,
        {
          ...beam,
          name: splitPoints.length > 2 ? `${beam.name}.${i}` : beam.name,
          startPos,
          endPos,
          releases: {
            fx1: isStart ? beam.releases?.fx1 : undefined,
            fy1: isStart ? beam.releases?.fy1 : undefined,
            fz1: isStart ? beam.releases?.fz1 : undefined,
            mx1: isStart ? beam.releases?.mx1 : undefined,
            my1: isStart ? beam.releases?.my1 : undefined,
            mz1: isStart ? beam.releases?.mz1 : undefined,

            fx2: isEnd ? beam.releases?.fx2 : undefined,
            fy2: isEnd ? beam.releases?.fy2 : undefined,
            fz2: isEnd ? beam.releases?.fz2 : undefined,
            mx2: isEnd ? beam.releases?.mx2 : undefined,
            my2: isEnd ? beam.releases?.my2 : undefined,
            mz2: isEnd ? beam.releases?.mz2 : undefined,
          },
          deadLoadPointS: isX
            ? DLParams?.loadPoints.find(
                (lp) => lp === roundM(Math.abs(startPos.x - beam.startPos.x))
              )
            : DLParams?.loadPoints.find(
                (lp) => lp === roundM(Math.abs(beam.startPos.z - startPos.z))
              ),
          deadLoadPointE: isX
            ? DLParams?.loadPoints.find(
                (lp) => lp === roundM(Math.abs(endPos.x - beam.startPos.x))
              )
            : DLParams?.loadPoints.find(
                (lp) => lp === roundM(Math.abs(beam.startPos.z - endPos.z))
              ),
          deadLoadUDL: DLParams?.udls.find(
            (udl) =>
              udl[0] <=
                (isX
                  ? roundM(Math.abs(startPos.x - beam.startPos.x))
                  : roundM(Math.abs(beam.startPos.z - startPos.z))) &&
              udl[1] >=
                (isX
                  ? roundM(Math.abs(endPos.x - beam.startPos.x))
                  : roundM(Math.abs(beam.startPos.z - endPos.z)))
          ),
          liveLoadPointS: isX
            ? LLParams?.loadPoints.find(
                (lp) => lp === roundM(Math.abs(startPos.x - beam.startPos.x))
              )
            : LLParams?.loadPoints.find(
                (lp) => lp === roundM(Math.abs(beam.startPos.z - startPos.z))
              ),
          liveLoadPointE: isX
            ? LLParams?.loadPoints.find(
                (lp) => lp === roundM(Math.abs(endPos.x - beam.startPos.x))
              )
            : LLParams?.loadPoints.find(
                (lp) => lp === roundM(Math.abs(beam.startPos.z - endPos.z))
              ),
          liveLoadUDL: LLParams?.udls.find(
            (udl) =>
              udl[0] <=
                (isX
                  ? roundM(Math.abs(startPos.x - beam.startPos.x))
                  : roundM(Math.abs(beam.startPos.z - startPos.z))) &&
              udl[1] >=
                (isX
                  ? roundM(Math.abs(endPos.x - beam.startPos.x))
                  : roundM(Math.abs(beam.startPos.z - endPos.z)))
          ),
          windLoadPointS: isX
            ? WLParams?.loadPoints.find(
                (lp) => lp === roundM(Math.abs(startPos.x - beam.startPos.x))
              )
            : WLParams?.loadPoints.find(
                (lp) => lp === roundM(Math.abs(beam.startPos.z - startPos.z))
              ),
          windLoadPointE: isX
            ? WLParams?.loadPoints.find(
                (lp) => lp === roundM(Math.abs(endPos.x - beam.startPos.x))
              )
            : WLParams?.loadPoints.find(
                (lp) => lp === roundM(Math.abs(beam.startPos.z - endPos.z))
              ),
          windLoadUDL: WLParams?.udls.find(
            (udl) =>
              udl[0] <=
                (isX
                  ? roundM(Math.abs(startPos.x - beam.startPos.x))
                  : roundM(Math.abs(beam.startPos.z - startPos.z))) &&
              udl[1] >=
                (isX
                  ? roundM(Math.abs(endPos.x - beam.startPos.x))
                  : roundM(Math.abs(beam.startPos.z - endPos.z)))
          ),
        },
      ];
    }
  });
  return newBeams;
}

export function splitStaircases(
  map: Map<string, TBeamElement>,
  model: TOpenFrame,
  strs: TStaircaseOF[]
) {
  let newStrs: any[] = [];
  for (const str of strs) {
    let splitPoints: number[] = [0, str.startPos.distanceTo(str.endPos)];
    for (const conn of str.connected) {
      const connected = map.get(conn);
      if (!connected) continue;
      if (connected.startConnected.includes(str.name)) {
        splitPoints = [
          ...splitPoints,
          str.startPos.distanceTo(connected.startPos),
        ];
      } else if (connected.endConnected.includes(str.name)) {
        splitPoints = [
          ...splitPoints,
          str.startPos.distanceTo(connected.endPos),
        ];
      }
    }
    splitPoints = getUnicuesArray(splitPoints)
      .map((p) => roundM(p))
      .sort((a, b) => a - b);
    const newVector = str.startPos.clone();
    for (let i = 1; i < splitPoints.length; i++) {
      const startPos = newVector.clone();
      const endPos = newVector
        .copy(
          roundVectorM(
            getPosByDistance(splitPoints[i], str.startPos, str.endPos)
          )
        )
        .clone();
      const isStart = startPos.equals(str.startPos);
      const isEnd = endPos.equals(str.endPos);
      newStrs = [
        ...newStrs,
        {
          ...str,
          name: splitPoints.length > 2 ? `${str.name}.${i}` : str.name,
          startPos,
          endPos,
          releases: {
            fx1: isStart ? str.releases?.fx1 : undefined,
            fy1: isStart ? str.releases?.fy1 : undefined,
            fz1: isStart ? str.releases?.fz1 : undefined,
            mx1: isStart ? str.releases?.mx1 : undefined,
            my1: isStart ? str.releases?.my1 : undefined,
            mz1: isStart ? str.releases?.mz1 : undefined,

            fx2: isEnd ? str.releases?.fx2 : undefined,
            fy2: isEnd ? str.releases?.fy2 : undefined,
            fz2: isEnd ? str.releases?.fz2 : undefined,
            mx2: isEnd ? str.releases?.mx2 : undefined,
            my2: isEnd ? str.releases?.my2 : undefined,
            mz2: isEnd ? str.releases?.mz2 : undefined,
          },
        },
      ];
    }
  }
  return newStrs;
}

export function splitBracings(
  model: TOpenFrame,
  items: TBeamElement[],
  loadings?: LoadingsUI
) {
  let newBeams: any[] = [];
  items.forEach((beam) => {
    let splitPoints: number[] = [
      0,
      roundM(beam.startPos.distanceTo(beam.endPos)),
    ];

    let DLParams, LLParams, WLParams;

    if (loadings) {
      DLParams = getAdditionalLoadsParams(
        "deadLoadUI",
        loadings,
        model,
        beam,
        splitPoints
      );
      LLParams = getAdditionalLoadsParams(
        "liveLoadUI",
        loadings,
        model,
        beam,
        splitPoints
      );
      WLParams = getAdditionalLoadsParams(
        "windLoadUI",
        loadings,
        model,
        beam,
        splitPoints
      );
    }

    splitPoints = getUnicuesArray(splitPoints)
      .map((p) => roundM(p))
      .sort((a, b) => a - b);
    const newVector = roundVectorM(beam.startPos.clone());
    for (let i = 1; i < splitPoints.length; i++) {
      const startPos = newVector.clone();
      const endPos = newVector
        .copy(
          roundVectorM(
            getPosByDistance(splitPoints[i], beam.startPos, beam.endPos)
          )
        )
        .clone();
      const isStart = startPos.equals(beam.startPos);
      const isEnd = endPos.equals(beam.endPos);
      newBeams = [
        ...newBeams,
        {
          ...beam,
          name: splitPoints.length > 2 ? `${beam.name}.${i}` : beam.name,
          startPos,
          endPos,
          releases: {
            fx1: isStart ? beam.releases?.fx1 : undefined,
            fy1: isStart ? beam.releases?.fy1 : undefined,
            fz1: isStart ? beam.releases?.fz1 : undefined,
            mx1: isStart ? beam.releases?.mx1 : undefined,
            my1: isStart ? beam.releases?.my1 : undefined,
            mz1: isStart ? beam.releases?.mz1 : undefined,

            fx2: isEnd ? beam.releases?.fx2 : undefined,
            fy2: isEnd ? beam.releases?.fy2 : undefined,
            fz2: isEnd ? beam.releases?.fz2 : undefined,
            mx2: isEnd ? beam.releases?.mx2 : undefined,
            my2: isEnd ? beam.releases?.my2 : undefined,
            mz2: isEnd ? beam.releases?.mz2 : undefined,
          },
          deadLoadPointS: DLParams?.loadPoints.find(
            (lp) => lp === roundM(beam.startPos.distanceTo(startPos))
          ),
          deadLoadPointE: DLParams?.loadPoints.find(
            (lp) => lp === roundM(beam.startPos.distanceTo(endPos))
          ),
          deadLoadUDL: DLParams?.udls.find(
            (udl) =>
              udl[0] <= roundM(beam.startPos.distanceTo(startPos)) &&
              udl[1] >= roundM(beam.startPos.distanceTo(endPos))
          ),
          liveLoadPointS: LLParams?.loadPoints.find(
            (lp) => lp === roundM(beam.startPos.distanceTo(startPos))
          ),
          liveLoadPointE: LLParams?.loadPoints.find(
            (lp) => lp === roundM(beam.startPos.distanceTo(endPos))
          ),
          liveLoadUDL: LLParams?.udls.find(
            (udl) =>
              udl[0] <= roundM(beam.startPos.distanceTo(startPos)) &&
              udl[1] >= roundM(beam.startPos.distanceTo(endPos))
          ),
          windLoadPointS: WLParams?.loadPoints.find(
            (lp) => lp === roundM(beam.startPos.distanceTo(startPos))
          ),
          windLoadPointE: WLParams?.loadPoints.find(
            (lp) => lp === roundM(beam.startPos.distanceTo(endPos))
          ),
          windLoadUDL: WLParams?.udls.find(
            (udl) =>
              udl[0] <= roundM(beam.startPos.distanceTo(startPos)) &&
              udl[1] >= roundM(beam.startPos.distanceTo(endPos))
          ),
        },
      ];
    }
  });
  return newBeams;
}

function sortByMiddlePoint(a: any, b: any) {
  if (
    (a.type === "PipeItem" && b.type === "PipeItem") ||
    (a.type !== "PipeItem" && b.type !== "PipeItem")
  ) {
    const A = new Vector3().addVectors(a.endPos, a.startPos).divideScalar(2);
    const B = new Vector3().addVectors(b.endPos, b.startPos).divideScalar(2);
    return A.y === B.y ? (A.z === B.z ? A.x - B.x : A.z - B.z) : A.y - B.y;
  }
  if (a.type === "PipeItem") return 1;
  if (b.type === "PipeItem") return -1;
  return 0;
}

function getBeamElement(
  start: number,
  end: number,
  count: number,
  zAxis: number[],
  releases?: Releases
): BeamElement {
  const label = count + 1;
  return {
    label,
    nodes: [start, end],
    bodyLoads: ["DeadWeight"],
    boundaryLoads: [],
    section: label,
    zAxis,
    beamHinges: releases
      ? [
          !!releases.fx1,
          !!releases.fy1,
          !!releases.fz1,
          !!releases.mx1,
          !!releases.my1,
          !!releases.mz1,
          !!releases.fx2,
          !!releases.fy2,
          !!releases.fz2,
          !!releases.mx2,
          !!releases.my2,
          !!releases.mz2,
        ]
      : [
          false,
          false,
          false,
          false,
          false,
          false,
          false,
          false,
          false,
          false,
          false,
          false,
        ],
  };
}

function getMember(
  label: number,
  name: string,
  profile: Section | undefined,
  length: number,
  pipeouterdiameter?: number,
  pipewallthickness?: number,
  pipematerial?: Material,
  effectiveLength?: AmericanEffectiveLengthUI
): Member {
  let type;
  switch (profile?.country_code) {
    case "Rolled":
      type = "ProfileWithPlates";
      break;
    case "Fabricated":
      type = "FabProfile";
      break;
    case "Combined":
      type = "CombinedSection";
      break;
    case undefined:
      type = "Pipe";
      break;
    default:
      type = "Profile";
  }

  const rolled =
    type === "ProfileWithPlates" ? (profile as RolledSection) : undefined;
  const combined =
    type === "CombinedSection" ? (profile as CombinedSection) : undefined;

  return {
    label,
    name,
    type,
    profileName: profile ? profile.name : undefined,
    countryCode: type === "Profile" ? profile!.country_code : null,
    profileType:
      type === "Profile" ? profile!.designation?.replace(/\./gm, "_") : null,
    length: MtoMM(length),
    thickness: profile?.tw_global ?? 0,
    width: profile?.bf_global ?? 0,

    FabProfType: type === "FabProfile" ? profile!.shape : null,
    FabProfDepth:
      type === "FabProfile" && profile!.shape !== "O"
        ? profile!.d_global ?? null
        : null,
    FabProfWidth:
      type === "FabProfile" && profile!.shape !== "O"
        ? profile!.bf_global ?? null
        : null,
    FabProfTFthk:
      type === "FabProfile" && profile!.shape !== "O"
        ? profile!.tf_global ?? null
        : null,
    FabProfBFthk:
      type === "FabProfile" && profile!.shape !== "O"
        ? profile!.tfb_global ?? null
        : null,
    FabProfWebThk:
      type === "FabProfile" && profile!.shape !== "O"
        ? profile!.tw_global ?? null
        : null,

    FabProfOd:
      type === "FabProfile" && profile!.shape === "O"
        ? profile!.d_global ?? null
        : null,
    FabProfID:
      type === "FabProfile" && profile!.shape === "O"
        ? profile!.bf_global ?? null
        : null,

    RolWthPltCountryCode: rolled ? rolled.baseCountryCode : null,
    RolWthPltProfile: rolled ? rolled.baseProfile : null,
    RolWthPltTPWidth: rolled ? rolled.tpWidth ?? null : null,
    RolWthPltTPthk: rolled ? rolled.tpThickness ?? null : null,
    RolWthPltBPWidth: rolled ? rolled.bpWidth ?? null : null,
    RolWthPltBPthk: rolled ? rolled.bpThickness ?? null : null,

    pipeouterdiameter: pipeouterdiameter ?? null,
    pipewallthickness: pipewallthickness ?? null,
    pipematerial: pipematerial?.material_id ?? null,

    combination: combined?.combination ?? null,
    clearGap: combined?.gap ?? null,

    ky: effectiveLength?.Ky ?? null,
    kz: effectiveLength?.Kz ?? null,
    Ly: effectiveLength?.Ly ?? null,
    Lz: effectiveLength?.Lz ?? null,
  };
}

function getDeadLoad(loadings: DeadLoadsUI): DeadLoad {
  return {
    selfWeightFactor: loadings.SWF,
    platformDeadLoadIntensity: loadings.DLI,
    stairDeadLoadIntensity: loadings.SDLI ?? 200,
    fireProofLoad: {
      fpDensity: loadings.FPd,
      fpThickness: loadings.FPt,
      fpHeight: loadings.FPh,
      fpApp: loadings.FPto,
      fpDf: loadings.FPdl,
      boxFpList: [],
      profFpList: [],
    },
    additionalLoad: {
      udl: {},
      pointLoad: {},
    },
    accessories: {},
  };
}

function getLiveLoad(loadings: LiveLoadsUI): LiveLoad {
  return {
    platformLiveLoadIntensity: loadings.intensity,
    stairLiveLoadIntensity: loadings.stairIntensity ?? 500,
    additionalLoad: {
      udl: {},
      pointLoad: {},
    },
  };
}

function getPipingLoad() {
  return {
    directLoad: {
      emptyLoad: {
        pointLoad: {},
      },
      testingLoad: {
        pointLoad: {},
      },
      operatingLoad: {
        pointLoad: {},
      },
      thermalAnchorLoad: {
        pointLoad: {},
      },
      thermalFrictionLoad: {
        pointLoad: {},
      },
      windOnPipeLoadX: {
        pointLoad: {},
      },
      windOnPipeLoadZ: {
        pointLoad: {},
      },
      psvReleaseOrSurgeLoad: {
        pointLoad: {},
      },
      snowIceLoad: {
        pointLoad: {},
      },
    },
    blanketLoad: {},
  };
}

function getBlanketLoad(
  bls: BlanketLoadUI[],
  model: TOpenFrame,
  allElements: any[],
  members: Member[]
) {
  const elements = allElements.filter(
    (el) => el.type === "BEAM" || el.type === "CANTILEVER"
  );
  const blanketLoads = bls.reduce((acc, el, i) => {
    const from = getElementByName(
      [...model.beams, ...model.cantilevers],
      el.from
    );
    const to = getElementByName([...model.beams, ...model.cantilevers], el.to);
    if (!from || !to) return { ...acc };
    const frameBeams: any[] = [];
    const peripherialElements: any[] = [];

    const { fromS, fromE, toS, toE } = fixPoints(
      {
        ...from,
        startPos: roundVectorM(
          localToGlobal(model.startPos, from.startPos, model.direction)
        ),
        endPos: roundVectorM(
          localToGlobal(model.startPos, from.endPos, model.direction)
        ),
      },
      {
        ...to,
        startPos: roundVectorM(
          localToGlobal(model.startPos, to.startPos, model.direction)
        ),
        endPos: roundVectorM(
          localToGlobal(model.startPos, to.endPos, model.direction)
        ),
      }
    );
    fromS.copy(roundVectorM(getPosByDistance(el.distance, fromS, fromE)));
    fromE.copy(roundVectorM(getPosByDistance(el.width, fromS, fromE)));
    toS.copy(roundVectorM(getPosByDistance(el.distance, toS, toE)));
    toE.copy(roundVectorM(getPosByDistance(el.width, toS, toE)));
    const { minV, maxV } = getMaxAndMinPoints(
      { startPos: fromS, endPos: fromE } as TBeamElement,
      { startPos: toS, endPos: toE } as TBeamElement
    );

    const unders = new Map<string, TBeamElement>();
    const fixed = new Map<string, TBeamElement>();
    for (const beam of elements) {
      if (beam.startPos.y !== minV.y) continue;
      if (!hardCheckRange(beam.startPos.x, minV.x, maxV.x)) continue;
      if (!hardCheckRange(beam.endPos.x, minV.x, maxV.x)) continue;
      if (!hardCheckRange(beam.startPos.z, minV.z, maxV.z)) continue;
      if (!hardCheckRange(beam.endPos.z, minV.z, maxV.z)) continue;
      unders.set(beam.name, beam);
      fixed.set(beam.name, beam);
    }
    let isNext = false;
    do {
      isNext = false;
      const beams = mapToArray(fixed);
      for (const beam of beams) {
        const beamDir = getDirection(beam);
        const toStart: TBeamElement[] = beams.filter(
          (item) =>
            beam.name !== item.name &&
            (beam.startPos.equals(item.startPos) ||
              beam.startPos.equals(item.endPos))
        );
        if (!toStart.length) {
          fixed.delete(beam.name);
          isNext = true;
          break;
        } else if (toStart.length === 1) {
          const elDir = getDirection(toStart[0]);
          if (beamDir === elDir) {
            const correct = toStart[0].endPos.equals(beam.startPos);
            const newEl: TBeamElement = {
              ...toStart[0],
              startPos: correct
                ? toStart[0].startPos.clone()
                : toStart[0].endPos.clone(),
              endPos: beam.endPos.clone(),
            };
            fixed.set(newEl.name, newEl);
            fixed.delete(beam.name);
            isNext = true;
            break;
          }
          if (
            !(
              (beamDir === "X" &&
                hardCheckRange(beam.startPos.x, minV.x, maxV.x) &&
                hardCheckRange(beam.endPos.x, minV.x, maxV.x) &&
                (beam.startPos.z === minV.z || beam.startPos.z === maxV.z)) ||
              (beamDir === "Z" &&
                hardCheckRange(beam.startPos.z, minV.z, maxV.z) &&
                hardCheckRange(beam.endPos.z, minV.z, maxV.z) &&
                (beam.startPos.x === minV.x || beam.startPos.x === maxV.x))
            )
          ) {
            fixed.delete(beam.name);
            isNext = true;
            break;
          }
        }
        const toEnd: TBeamElement[] = beams.filter(
          (item) =>
            beam.name !== item.name &&
            (beam.endPos.equals(item.startPos) ||
              beam.endPos.equals(item.endPos))
        );
        if (!toEnd.length) {
          fixed.delete(beam.name);
          isNext = true;
          break;
        } else if (toEnd.length === 1) {
          const elDir = getDirection(toEnd[0]);
          if (toEnd[0].startPos.equals(beam.endPos) && beamDir === elDir) {
            const newEl: TBeamElement = {
              ...beam,
              endPos: toEnd[0].endPos.clone(),
            };
            fixed.set(newEl.name, newEl);
            fixed.delete(toEnd[0].name);
            isNext = true;
            break;
          }
          if (
            !(
              (beamDir === "X" &&
                hardCheckRange(beam.startPos.x, minV.x, maxV.x) &&
                hardCheckRange(beam.endPos.x, minV.x, maxV.x) &&
                (beam.startPos.z === minV.z || beam.startPos.z === maxV.z)) ||
              (beamDir === "Z" &&
                hardCheckRange(beam.startPos.z, minV.z, maxV.z) &&
                hardCheckRange(beam.endPos.z, minV.z, maxV.z) &&
                (beam.startPos.x === minV.x || beam.startPos.x === maxV.x))
            )
          ) {
            fixed.delete(beam.name);
            isNext = true;
            break;
          }
        }
      }
    } while (isNext);
    const fixedBeams = mapToArray(fixed);
    const nodes = new Map<string, TNodeInfo>();
    for (const beam of fixedBeams) {
      const node1 = getNodeLabel(beam.startPos);
      const node2 = getNodeLabel(beam.endPos);
      const info1 = nodes.get(node1);
      const info2 = nodes.get(node2);
      nodes.set(
        node1,
        info1
          ? { ...info1, count: info1.count === 3 ? 5 : info1.count + 1 }
          : { v: beam.startPos.clone(), count: 1 }
      );
      nodes.set(
        node2,
        info2
          ? { ...info2, count: info2.count === 3 ? 5 : info2.count + 1 }
          : { v: beam.endPos.clone(), count: 1 }
      );
    }
    const nodesArr = Array.from(nodes.values())
      .map((info) => info.v)
      .sort((a, b) => (a.x === b.x ? a.z - b.z : a.x - b.x));
    for (const v of nodesArr) {
      if (!nodes.has(getNodeLabel(v))) continue;
      const vectors = Array.from(nodes.values()).map((info) => info.v);
      const BL = v;
      const TL = getNextNode(BL, vectors, fixedBeams, "X");
      if (!TL) continue;
      const BR = getNextNode(BL, vectors, fixedBeams, "Z");
      if (!BR) continue;
      let tTL: Vector3 | undefined = TL.clone();
      let tBR: Vector3 | undefined = BR.clone();
      let TR: Vector3 | undefined;
      while (tTL && tBR) {
        TR = getCrossNode(tTL, tBR, vectors, fixedBeams);
        if (!TR) {
          tBR = getNextNode(tBR, vectors, fixedBeams, "Z");
          if (!tBR) {
            tBR = BR.clone();
            tTL = getNextNode(tTL, vectors, fixedBeams, "X");
          }
        } else break;
      }
      if (BL && tBR && tTL && TR) {
        const xBeams: TBeamElement[] = [];
        const zBeams: TBeamElement[] = [];
        for (const beam of mapToArray(unders)) {
          if (
            checkRange(beam.startPos.x, BL.x, TR.x, true, true) &&
            checkRange(beam.endPos.x, BL.x, TR.x, true, true) &&
            checkRange(beam.startPos.z, BL.z, TR.z, true, true) &&
            checkRange(beam.endPos.z, BL.z, TR.z, true, true)
          ) {
            if (getDirection(beam) === "X") {
              xBeams.push(beam);
            } else {
              zBeams.push(beam);
            }
          }
        }
        const xPositions = getUnicuesArray(
          zBeams.map((beam) => beam.startPos.x)
        );
        for (let i = 1, len = xPositions.length; i < len; ++i) {
          const prevX = xPositions[i - 1];
          const nextX = xPositions[i];
          peripherialElements.push({
            front: zBeams
              .filter((beam) => beam.startPos.x === prevX)
              .reduce(
                (acc, beam) => [...acc, ...getLabels(beam, members)],
                [] as number[]
              ),
            left: xBeams
              .filter(
                (beam) =>
                  beam.startPos.x >= prevX &&
                  beam.endPos.x <= nextX &&
                  beam.startPos.z === BL.z
              )
              .reduce(
                (acc, beam) => [...acc, ...getLabels(beam, members)],
                [] as number[]
              ),
            back: zBeams
              .filter((beam) => beam.startPos.x === nextX)
              .reduce(
                (acc, beam) => [...acc, ...getLabels(beam, members)],
                [] as number[]
              ),
            right: xBeams
              .filter(
                (beam) =>
                  beam.startPos.x >= prevX &&
                  beam.endPos.x <= nextX &&
                  beam.startPos.z === TR!.z
              )
              .reduce(
                (acc, beam) => [...acc, ...getLabels(beam, members)],
                [] as number[]
              ),
          });
        }
        fixNodeInfo(BL, nodes);
        fixNodeInfo(tBR, nodes);
        fixNodeInfo(tTL, nodes);
        fixNodeInfo(TR, nodes);
      }
    }

    const load = {
      loadNumber: el.area,
      level: from.startPos.y,
      fromBayAlongLength: 0,
      fromBayAlongWidth: 0,
      toBayAlongLength: 0,
      toBayAlongWidth: 0,
      frameBeams,
      load: {
        fy: el.intensity,
        alongPipeDirection:
          model.direction === "+X" || model.direction === "-X" ? "X" : "Z",
        alongPipePercent: el.alongPercent,
        acrossPipeDirection:
          model.direction === "+X" || model.direction === "-X" ? "Z" : "X",
        acrossPipePercent: el.acrossPercent,
      },
      peripherialElements,
    };
    return { ...acc, [i + 1]: load };
  }, {});
  return blanketLoads;
}

function getEquipmentLoad() {
  return {
    directLoad: {
      emptyLoad: {
        pointLoad: {},
      },
      testingLoad: {
        pointLoad: {},
      },
      operatingLoad: {
        pointLoad: {},
      },
    },
  };
}

function getElementsForWindDirection(
  elements: any[],
  A: Vector3,
  B: Vector3,
  C: Vector3
) {
  const selected: any[] = [];
  const square = getSquareByGeron(A, B, C);
  elements?.forEach((el) => {
    if (checkHit(A, B, C, el.startPos, square)) {
      selected.push(el);
    } else {
      if (checkHit(A, B, C, el.endPos, square)) selected.push(el);
    }
  });
  return selected;
}

function checkHit(
  A: Vector3,
  B: Vector3,
  C: Vector3,
  P: Vector3,
  square: number
) {
  const fixP = new Vector3().add(P).setY(0);
  const sum =
    getSquareByGeron(A, B, fixP) +
    getSquareByGeron(A, C, fixP) +
    getSquareByGeron(B, C, fixP);
  return sum.toFixed(5) === square.toFixed(5);
}

function getSquareByGeron(A: Vector3, B: Vector3, C: Vector3) {
  const a = A.distanceTo(B);
  const b = A.distanceTo(C);
  const c = B.distanceTo(C);
  const p = (a + b + c) / 2;
  const square = Math.sqrt(p * (p - a) * (p - b) * (p - c));
  return square ? square : 0;
}

function getLoad(load: AdditionalLoadUI) {
  return {
    fx: load.Fx ?? 0,
    fy: load.Fy ?? 0,
    fz: load.Fz ?? 0,
    mx: load.Mx ?? 0,
    my: load.My ?? 0,
    mz: load.Mz ?? 0,
  };
}

function getUDL(
  udl: any,
  beamElement: BeamElement,
  load: AdditionalLoadUI,
  isWindLoad?: boolean
) {
  const elementLoad = udl[beamElement.label];
  if (elementLoad) {
    const newLoad = getLoad(load);
    if (isWindLoad) {
      return {
        ...udl,
        [beamElement.label]: {
          ...elementLoad,
          load: [...elementLoad.load, newLoad],
        },
      };
    } else {
      return {
        ...udl,
        [beamElement.label]: {
          elementLabel: beamElement.label,
          load: {
            fx: elementLoad.load.fx + newLoad.fx,
            fy: elementLoad.load.fy + newLoad.fy,
            fz: elementLoad.load.fz + newLoad.fz,
            mx: elementLoad.load.mx + newLoad.mx,
            my: elementLoad.load.my + newLoad.my,
            mz: elementLoad.load.mz + newLoad.mz,
          },
        },
      };
    }
  } else {
    if (isWindLoad) {
      return {
        ...udl,
        [beamElement.label]: {
          elementLabel: beamElement.label,
          load: [getLoad(load)],
        },
      };
    } else {
      return {
        ...udl,
        [beamElement.label]: {
          elementLabel: beamElement.label,
          load: getLoad(load),
        },
      };
    }
  }
}

function getPointLoad(
  pointLoad: any,
  node: Node,
  load: AdditionalLoadUI,
  lineNo?: string,
  isWindLoad?: boolean
) {
  const nodeLoad = pointLoad[node.nodeNumber];
  if (nodeLoad) {
    const newLoad = getLoad(load);
    if (isWindLoad) {
      return {
        ...pointLoad,
        [node.nodeNumber]: {
          ...nodeLoad,
          load: [...nodeLoad.load, newLoad],
        },
      };
    } else {
      return {
        ...pointLoad,
        [node.nodeNumber]: {
          lineNo,
          nodeLabel: node.nodeNumber,
          load: {
            fx: nodeLoad.load.fx + newLoad.fx,
            fy: nodeLoad.load.fy + newLoad.fy,
            fz: nodeLoad.load.fz + newLoad.fz,
            mx: nodeLoad.load.mx + newLoad.mx,
            my: nodeLoad.load.my + newLoad.my,
            mz: nodeLoad.load.mz + newLoad.mz,
          },
        },
      };
    }
  } else {
    if (isWindLoad) {
      return {
        ...pointLoad,
        [node.nodeNumber]: {
          lineNo,
          nodeLabel: node.nodeNumber,
          load: [getLoad(load)],
        },
      };
    } else {
      return {
        ...pointLoad,
        [node.nodeNumber]: {
          lineNo,
          nodeLabel: node.nodeNumber,
          load: getLoad(load),
        },
      };
    }
  }
}

function getAllElements(ui: OpenFrameUI, models: TOpenFrame[]) {
  let elements: any[] = [];
  models.forEach((model) => {
    const map = getMapOfBeamElements(model);
    elements = [
      ...elements,
      ...[
        ...splitColumns(map, model, model.columns, ui.loadingsUI),
        ...splitBeams(map, model, model.beams, ui.loadingsUI),
        ...splitCantilevers(map, model, model.cantilevers, ui.loadingsUI),
        ...splitBracings(model, model.kneeBracings, ui.loadingsUI),
        ...splitBracings(model, model.verticalBracings, ui.loadingsUI),
        ...splitBracings(model, model.horizontalBracings, ui.loadingsUI),
        ...splitStaircases(map, model, model.staircases),
      ]
        .map((el) => ({
          ...el,
          modelName: model.name,
          localStart: roundVectorM(el.startPos.clone()),
          localEnd: roundVectorM(el.endPos.clone()),
          startPos: roundVectorM(
            localToGlobal(model.startPos, el.startPos, model.direction)
          ),
          endPos: roundVectorM(
            localToGlobal(model.startPos, el.endPos, model.direction)
          ),
        }))
        .sort((a, b) => sortByMiddlePoint(a, b)),
    ];
  });
  return elements;
}

function parseLoadCombinations(arr: LoadCombinationUI[]) {
  return arr.map(
    (item) =>
      ({
        number: item.LC_No,
        limitState: item.LC_Type,
        loadCondition: item.CONDITION,
        deadLoad: fixValueToNumber(item.DL, "float"),
        liveLoad: fixValueToNumber(item.LL, "float"),
        temperatureLoad: fixValueToNumber(item.TL, "float"),
        pipingEmptyLoad: fixValueToNumber(item.PE, "float"),
        pipingTestingLoad: fixValueToNumber(item.PT, "float"),
        pipingOperatingLoad: fixValueToNumber(item.PO, "float"),
        pipingThermalAnchorLoad: fixValueToNumber(item.TA, "float"),
        pipingThermalFrictionLoad: fixValueToNumber(item.TF, "float"),
        pipingSnowIceLoad: fixValueToNumber(item.PI, "float"),
        pipingPSVReleaseSurgeLoad: fixValueToNumber(item.PS, "float"),
        equipmentEmptyLoad: fixValueToNumber(item.EE, "float"),
        equipmentTestingLoad: fixValueToNumber(item.ET, "float"),
        equipmentOperatingLoad: fixValueToNumber(item.EO, "float"),
        windLoadPlusX0Deg: fixValueToNumber(item.WLpX, "float"),
        windLoadPlusXMinusZ45Deg: fixValueToNumber(item.WLmZpX, "float"),
        windLoadMinusZ90Deg: fixValueToNumber(item.WLmZ, "float"),
        windLoadMinusZMinusX135Deg: fixValueToNumber(item.WLmXmZ, "float"),
        windLoadMinusX180Deg: fixValueToNumber(item.WLmX, "float"),
        windLoadMinusXPlusZ225Deg: fixValueToNumber(item.WLpZmX, "float"),
        windLoadPlusZ270Deg: fixValueToNumber(item.WLpZ, "float"),
        windLoadPlusZPlusX315Deg: fixValueToNumber(item.WLpXpZ, "float"),
        seismicX: fixValueToNumber(item.SX, "float"),
        seismicZ: fixValueToNumber(item.SZ, "float"),
        seismicY: fixValueToNumber(item.SY, "float"),
      } as LoadComb)
  );
}

function checkMemberByElementName(member: Member, el?: any) {
  if (!el) return false;
  return replaceSplitNumber(member.name) === el.name;
}

function getFrameData(model: TOpenFrame, members: Member[]) {
  const frames = model.frames.reduce((acc, frame, index) => {
    const columns = model.columns.filter(
      (column) => column.startPos.x === frame.chainage
    );
    const beams = model.beams.filter(
      (beam) => beam.direction === "Z" && beam.startPos.x === frame.chainage
    );
    const verBrace = model.verticalBracings.filter(
      (vb) => vb.startPos.x === vb.endPos.x && vb.startPos.x === frame.chainage
    );
    const levels = Array.from(
      new Set(beams.map((beam) => beam.startPos.y))
    ).sort((a, b) => a - b);
    return {
      ...acc,
      [index + 1]: {
        chainage: frame.chainage,
        levels: levels.reduce((acc, elevation, index) => {
          return {
            ...acc,
            [index + 1]: {
              elevation,
              columns: columns
                .filter(
                  (column) =>
                    column.startPos.y === elevation ||
                    column.endPos.y === elevation
                )
                .map(
                  (column) =>
                    members.find((member) =>
                      checkMemberByElementName(member, column)
                    )?.label
                ),
              beams: beams
                .filter((beam) => beam.startPos.y === elevation)
                .map(
                  (beam) =>
                    members.find((member) =>
                      checkMemberByElementName(member, beam)
                    )?.label
                ),
              verBrace: verBrace
                .filter(
                  (vb) =>
                    vb.startPos.y === elevation || vb.endPos.y === elevation
                )
                .map(
                  (vb) =>
                    members.find((member) =>
                      checkMemberByElementName(member, vb)
                    )?.label
                ),
            },
          };
        }, {}),
      },
    };
  }, {});
  return frames;
}

function getBayData(model: TOpenFrame, members: Member[]) {
  const frames = model.frames.reduce((acc, frame, index, arr) => {
    const next = arr[index + 1];
    if (index === arr.length - 1 || !next) return acc;
    const columns = model.columns.filter((column) =>
      checkRange(column.startPos.x, frame.chainage, next.chainage)
    );
    const beams = model.beams.filter(
      (beam) =>
        (beam.direction === "Z" &&
          beam.startPos.x !== frame.chainage &&
          beam.startPos.x !== next.chainage) ||
        (beam.direction === "X" &&
          beam.startPos.x >= frame.chainage &&
          beam.endPos.x <= next.chainage)
    );
    const verBrace = model.verticalBracings.filter(
      (vb) =>
        (vb.startPos.x === vb.endPos.x &&
          vb.startPos.x !== frame.chainage &&
          vb.startPos.x !== next.chainage) ||
        (vb.startPos.x !== vb.endPos.x &&
          vb.startPos.x >= frame.chainage &&
          vb.endPos.x <= next.chainage)
    );
    const levels = Array.from(
      new Set(beams.map((beam) => beam.startPos.y))
    ).sort((a, b) => a - b);
    return {
      ...acc,
      [index + 1]: {
        chainage: frame.chainage,
        levels: levels.reduce((acc, elevation, index) => {
          return {
            ...acc,
            [index + 1]: {
              elevation,
              columns: columns
                .filter(
                  (column) =>
                    column.startPos.y === elevation ||
                    column.endPos.y === elevation
                )
                .map(
                  (column) =>
                    members.find((member) =>
                      checkMemberByElementName(member, column)
                    )?.label
                ),
              beams: beams
                .filter(
                  (beam) =>
                    beam.startPos.y === elevation && beam.direction === "Z"
                )
                .map(
                  (beam) =>
                    members.find((member) =>
                      checkMemberByElementName(member, beam)
                    )?.label
                ),
              tieBeams: beams
                .filter(
                  (beam) =>
                    beam.startPos.y === elevation && beam.direction === "X"
                )
                .map(
                  (beam) =>
                    members.find((member) =>
                      checkMemberByElementName(member, beam)
                    )?.label
                ),
              verBrace: verBrace
                .filter(
                  (vb) =>
                    vb.startPos.y === elevation || vb.endPos.y === elevation
                )
                .map(
                  (vb) =>
                    members.find((member) =>
                      checkMemberByElementName(member, vb)
                    )?.label
                ),
            },
          };
        }, {}),
      },
    };
  }, {});
  return frames;
}

function getDirection(beam: TBeamElement): SimpleDirection {
  return beam.startPos.x === beam.endPos.x ? "Z" : "X";
}

function fixPoints(from: TBeamElement, to: TBeamElement) {
  const fromD = getDirection3(from.startPos, from.endPos) as Direction2;
  const fromS = from.startPos.clone();
  const fromE = from.endPos.clone();
  const toD = getDirection3(to.startPos, to.endPos) as Direction2;
  const toS = to.startPos.clone();
  const toE = to.endPos.clone();
  switch (fromD) {
    case "+X":
      switch (toD) {
        case "+X":
          if (fromS.x > toS.x) {
            toS.setX(fromS.x);
          } else fromS.setX(toS.x);
          if (fromE.x > toE.x) {
            fromE.setX(toE.x);
          } else toE.setX(fromE.x);
          break;
        case "-X":
          if (fromS.x > toE.x) {
            toE.setX(fromS.x);
          } else fromS.setX(toE.x);
          if (fromE.x > toS.x) {
            fromE.setX(toS.x);
          } else toS.setX(fromE.x);
      }
      break;
    case "-X":
      switch (toD) {
        case "+X":
          if (fromE.x > toS.x) {
            toS.setX(fromE.x);
          } else fromE.setX(toS.x);
          if (fromS.x > toE.x) {
            fromS.setX(toE.x);
          } else toE.setX(fromS.x);
          break;
        case "-X":
          if (fromE.x > toE.x) {
            toE.setX(fromE.x);
          } else fromE.setX(toE.x);
          if (fromS.x > toS.x) {
            fromS.setX(toS.x);
          } else toS.setX(fromS.x);
          break;
      }
      break;
    case "+Z":
      switch (toD) {
        case "+Z":
          if (fromS.z > toS.z) {
            toS.setZ(fromS.z);
          } else fromS.setZ(toS.z);
          if (fromE.z > toE.z) {
            fromE.setZ(toE.z);
          } else toE.setZ(fromE.z);
          break;
        case "-Z":
          if (fromS.z > toE.z) {
            toE.setZ(fromS.z);
          } else fromS.setZ(toE.z);
          if (fromE.z > toS.z) {
            fromE.setZ(toS.z);
          } else toS.setZ(fromE.z);
          break;
      }
      break;
    case "-Z":
      switch (toD) {
        case "+Z":
          if (fromE.z > toS.z) {
            toS.setZ(fromE.z);
          } else fromE.setZ(toS.z);
          if (fromS.z > toE.z) {
            fromS.setZ(toE.z);
          } else toE.setZ(fromS.z);
          break;
        case "-Z":
          if (fromE.z > toE.z) {
            toE.setZ(fromE.z);
          } else fromE.setZ(toE.z);
          if (fromS.z > toS.z) {
            fromS.setZ(toS.z);
          } else toS.setZ(fromS.z);
          break;
      }
      break;
  }
  return { fromD, fromS, fromE, toD, toS, toE };
}

function splitPlatform(
  platform: TPlatformOF,
  beams: TBeamElement[],
  members: Member[],
  from: TBeamElement,
  to: TBeamElement
) {
  const { fromD, fromS, fromE, toS, toE } = fixPoints(from, to);
  fromS.copy(roundVectorM(getPosByDistance(platform.distance, fromS, fromE)));
  fromE.copy(roundVectorM(getPosByDistance(platform.width, fromS, fromE)));
  toS.copy(roundVectorM(getPosByDistance(platform.distance, toS, toE)));
  toE.copy(roundVectorM(getPosByDistance(platform.width, toS, toE)));
  const { minV, maxV } = getMaxAndMinPoints(
    { startPos: fromS, endPos: fromE } as TBeamElement,
    { startPos: toS, endPos: toE } as TBeamElement
  );
  const unders = new Map<string, TBeamElement>();
  const fixed = new Map<string, TBeamElement>();
  for (const beam of beams) {
    if (beam.startPos.y !== fromS.y) continue;
    if (
      !(
        hardCheckRange(beam.startPos.x, minV.x, maxV.x) &&
        hardCheckRange(beam.endPos.x, minV.x, maxV.x)
      )
    )
      continue;
    if (
      !(
        hardCheckRange(beam.startPos.z, minV.z, maxV.z) &&
        hardCheckRange(beam.endPos.z, minV.z, maxV.z)
      )
    )
      continue;
    unders.set(beam.name, beam);
    fixed.set(beam.name, beam);
  }
  let isNext = false;
  do {
    isNext = false;
    const beams = mapToArray(fixed);
    for (const beam of beams) {
      const beamDir = getDirection(beam);
      const toStart: TBeamElement[] = beams.filter(
        (item) =>
          (beam.name !== item.name && beam.startPos.equals(item.startPos)) ||
          beam.startPos.equals(item.endPos)
      );
      if (!toStart.length) {
        fixed.delete(beam.name);
        isNext = true;
        break;
      } else if (toStart.length === 1) {
        if (beamDir === getDirection(toStart[0])) {
          const correct = toStart[0].endPos.equals(beam.startPos);
          const newEl: TBeamElement = {
            ...toStart[0],
            startPos: correct
              ? toStart[0].startPos.clone()
              : toStart[0].endPos.clone(),
            endPos: beam.endPos.clone(),
          };
          fixed.set(newEl.name, newEl);
          fixed.delete(beam.name);
          isNext = true;
          break;
        }
        if (
          !(
            (beamDir === "X" &&
              hardCheckRange(beam.startPos.x, minV.x, maxV.x) &&
              hardCheckRange(beam.endPos.x, minV.x, maxV.x) &&
              (beam.startPos.z === minV.z || beam.startPos.z === maxV.z)) ||
            (beamDir === "Z" &&
              hardCheckRange(beam.startPos.z, minV.z, maxV.z) &&
              hardCheckRange(beam.endPos.z, minV.z, maxV.z) &&
              (beam.startPos.x === minV.x || beam.startPos.x === maxV.x))
          )
        ) {
          fixed.delete(beam.name);
          isNext = true;
          break;
        }
      }
      const toEnd: TBeamElement[] = beams.filter(
        (item) =>
          beam.name !== item.name &&
          (beam.endPos.equals(item.startPos) || beam.endPos.equals(item.endPos))
      );
      if (!toEnd.length) {
        fixed.delete(beam.name);
        isNext = true;
        break;
      } else if (toEnd.length === 1) {
        const elDir = getDirection(toEnd[0]);
        if (toEnd[0].startPos.equals(beam.endPos) && beamDir === elDir) {
          const newEl: TBeamElement = {
            ...beam,
            endPos: toEnd[0].endPos.clone(),
          };
          fixed.set(newEl.name, newEl);
          fixed.delete(toEnd[0].name);
          isNext = true;
          break;
        }
        if (
          !(
            (beamDir === "X" &&
              hardCheckRange(beam.startPos.x, minV.x, maxV.x) &&
              hardCheckRange(beam.endPos.x, minV.x, maxV.x) &&
              (beam.startPos.z === minV.z || beam.startPos.z === maxV.z)) ||
            (beamDir === "Z" &&
              hardCheckRange(beam.startPos.z, minV.z, maxV.z) &&
              hardCheckRange(beam.endPos.z, minV.z, maxV.z) &&
              (beam.startPos.x === minV.x || beam.startPos.x === maxV.x))
          )
        ) {
          fixed.delete(beam.name);
          isNext = true;
          break;
        }
      }
    }
  } while (isNext);
  const fixedBeams = mapToArray(fixed);
  const nodes = new Map<string, TNodeInfo>();
  for (const beam of fixedBeams) {
    const info1 = nodes.get(getNodeLabel(beam.startPos));
    nodes.set(
      getNodeLabel(beam.startPos),
      info1
        ? { ...info1, count: info1.count === 3 ? 5 : info1.count + 1 }
        : { v: beam.startPos.clone(), count: 1 }
    );
    const info2 = nodes.get(getNodeLabel(beam.endPos));
    nodes.set(
      getNodeLabel(beam.endPos),
      info2
        ? { ...info2, count: info2.count === 3 ? 5 : info2.count + 1 }
        : { v: beam.endPos.clone(), count: 1 }
    );
  }
  const nodesArr = Array.from(nodes.values())
    .map((info) => info.v)
    .sort((a, b) => (a.x === b.x ? a.z - b.z : a.x - b.x));
  const newPlatforms: any[] = [];
  for (const v of nodesArr) {
    if (!nodes.has(getNodeLabel(v))) continue;
    const vectors = Array.from(nodes.values()).map((info) => info.v);
    const BL = v;
    const TL = getNextNode(BL, vectors, fixedBeams, "X");
    if (!TL) continue;
    const BR = getNextNode(BL, vectors, fixedBeams, "Z");
    if (!BR) continue;
    let tTL: Vector3 | undefined = TL.clone();
    let tBR: Vector3 | undefined = BR.clone();
    let TR;
    while (tTL && tBR) {
      TR = getCrossNode(tTL, tBR, vectors, fixedBeams);
      if (!TR) {
        tBR = getNextNode(tBR, vectors, fixedBeams, "Z");
        if (!tBR) {
          tBR = BR.clone();
          tTL = getNextNode(tTL, vectors, fixedBeams, "X");
        }
      } else break;
    }
    if (BL && tBR && tTL && TR) {
      newPlatforms.push({
        name: `${platform.name}.${newPlatforms.length + 1}`,
        level: from.startPos.y,
        direction: fromD,
        width: fromD.includes("X") ? TR.z - BL.z : TR.x - BL.x,
        gratingThickness: platform.thickness,
        peripherialElements: getPeripherialElements(
          BL.x,
          TR.x,
          BL.z,
          TR.z,
          mapToArray(unders),
          members
        ),
      });
      fixNodeInfo(BL, nodes);
      fixNodeInfo(tBR, nodes);
      fixNodeInfo(tTL, nodes);
      fixNodeInfo(TR, nodes);
    }
  }
  return newPlatforms;
}

type TNodeInfo = {
  v: Vector3;
  count: number;
};

function getNodeLabel(v: Vector3) {
  return `${v.x}:${v.z}`;
}

function fixNodeInfo(v: Vector3, nodes: Map<string, TNodeInfo>) {
  const info = nodes.get(getNodeLabel(v));
  if (info) {
    if (info.count > 2) {
      nodes.set(getNodeLabel(v), { ...info, count: info.count - 1 });
    } else nodes.delete(getNodeLabel(v));
  }
}

function getNextNode(
  v: Vector3,
  nodes: Vector3[],
  beams: TBeamElement[],
  dir: SimpleDirection
) {
  let result;
  if (dir === "X") {
    for (const node of nodes) {
      if (v.z === node.z && v.x < node.x) {
        if (result) {
          if (result.x > node.x && checkBeamByNodes(v, node, beams)) {
            result = node;
          }
        } else if (checkBeamByNodes(v, node, beams)) {
          result = node;
        }
      }
    }
  } else {
    for (const node of nodes) {
      if (v.x === node.x && v.z < node.z) {
        if (result) {
          if (result.z > node.z && checkBeamByNodes(v, node, beams)) {
            result = node;
          }
        } else if (checkBeamByNodes(v, node, beams)) {
          result = node;
        }
      }
    }
  }
  return result;
}

function getCrossNode(
  top: Vector3,
  bottom: Vector3,
  nodes: Vector3[],
  beams: TBeamElement[]
) {
  let nodeA = getNextNode(top, nodes, beams, "Z");
  let nodeB = getNextNode(bottom, nodes, beams, "X");
  if (!nodeA || !nodeB) return undefined;
  while (nodeA.z < nodeB.z) {
    nodeA = getNextNode(nodeA, nodes, beams, "Z");
    if (!nodeA) return undefined;
  }
  while (nodeB.x < nodeA.x) {
    nodeB = getNextNode(nodeB, nodes, beams, "X");
    if (!nodeB) return undefined;
  }
  return nodeA.equals(nodeB) ? nodeA : undefined;
}

function checkBeamByNodes(v1: Vector3, v2: Vector3, beams: TBeamElement[]) {
  return beams.some(
    (beam) =>
      (beam.startPos.equals(v1) && beam.endPos.equals(v2)) ||
      (beam.startPos.equals(v2) && beam.endPos.equals(v1))
  );
}

function getPeripherialElements(
  sx: number,
  ex: number,
  sz: number,
  ez: number,
  beams: TBeamElement[],
  members: Member[]
) {
  const xBeams: TBeamElement[] = [];
  const zBeams: TBeamElement[] = [];
  for (const beam of beams) {
    if (
      checkRange(beam.startPos.x, sx, ex, true, true) &&
      checkRange(beam.endPos.x, sx, ex, true, true) &&
      checkRange(beam.startPos.z, sz, ez, true, true) &&
      checkRange(beam.endPos.z, sz, ez, true, true)
    ) {
      if (getDirection(beam) === "X") {
        xBeams.push(beam);
      } else {
        zBeams.push(beam);
      }
    }
  }
  let peripherialElements: any = {};
  const xPositions = getUnicuesArray(
    zBeams.map((beam) => beam.startPos.x)
  ).sort((a, b) => a - b);
  for (let i = 1, len = xPositions.length; i < len; ++i) {
    const prevX = xPositions[i - 1];
    const nextX = xPositions[i];
    peripherialElements = {
      ...peripherialElements,
      [`set${i}`]: {
        front: zBeams
          .filter((beam) => beam.startPos.x === prevX)
          .reduce(
            (acc, beam) => [...acc, ...getLabels(beam, members)],
            [] as number[]
          ),
        left: xBeams
          .filter(
            (beam) =>
              beam.startPos.x >= prevX &&
              beam.endPos.x <= nextX &&
              beam.startPos.z === sz
          )
          .reduce(
            (acc, beam) => [...acc, ...getLabels(beam, members)],
            [] as number[]
          ),
        back: zBeams
          .filter((beam) => beam.startPos.x === nextX)
          .reduce(
            (acc, beam) => [...acc, ...getLabels(beam, members)],
            [] as number[]
          ),
        right: xBeams
          .filter(
            (beam) =>
              beam.startPos.x >= prevX &&
              beam.endPos.x <= nextX &&
              beam.startPos.z === ez
          )
          .reduce(
            (acc, beam) => [...acc, ...getLabels(beam, members)],
            [] as number[]
          ),
      },
    };
  }
  return peripherialElements;
}

function getLabels(beam: TBeamElement, members: Member[]) {
  const label = members.find((m) => m.name === beam.name)?.label;
  if (label !== undefined) return [label];
  return [];
}

function getPlatformData(
  model: TOpenFrame,
  members: Member[],
  elements: any[]
) {
  const modelBeams = [...model.beams, ...model.cantilevers].map((el) => ({
    ...el,
    startPos: roundVectorM(
      localToGlobal(model.startPos, el.startPos, model.direction)
    ),
    endPos: roundVectorM(
      localToGlobal(model.startPos, el.endPos, model.direction)
    ),
  }));
  const beams = elements.filter(
    (el) => el.type === "BEAM" || el.type === "CANTILEVER"
  );
  let platforms: any[] = [];
  for (const platform of model.platforms) {
    const from = getElementByName(modelBeams, platform.from);
    const to = getElementByName(modelBeams, platform.to);
    if (!from || !to) continue;
    platforms = [
      ...platforms,
      ...splitPlatform(platform, beams, members, from, to),
    ];
  }
  return platforms;
}

function getBasePlateData(
  concreteGrade: string,
  model: TOpenFrame,
  members: Member[]
) {
  return {
    concreteGrade,
    rectangular: {
      ...model.rectangularBP.reduce((acc, plate) => {
        const fMembers = members
          .filter((member) => replaceSplitNumber(member.name) === plate.column)
          .sort();
        const member = fMembers[0];
        if (!member) return acc;
        return {
          ...acc,
          [member.name]: {
            label: member.label,
            designMethod: plate.dMethod,
            basePlate: {
              thickness: plate.plateThickness,
              length: plate.plateLength,
              width: plate.plateWidth,
            },
            anchorBolt: {
              grade: plate.grade,
              dia: plate.anchorBoltDiameter,
              nos: {
                alongLength: plate.countAlongLength,
                alongWidth: plate.countAlongWidth,
                spacingAlongLength: {
                  "1stRowFromCenter": plate.firstRowFromCenter_L,
                  rowToRow: plate.rowToRow_L,
                },
                spacingAlongWidth: {
                  "1stRowFromCenter": plate.firstRowFromCenter_W,
                  rowToRow: plate.rowToRow_W,
                },
              },
              capacity: {
                tension: plate.tension,
                shear: plate.shear,
              },
            },
            stiffenerPlates: {
              size: {
                thickness: plate.stiffenerThickness,
                height: plate.stiffenerHeight,
              },
              nos: {
                alongWeb: plate.stiffenerAlongWeb,
                alongFlange: plate.stiffenerAlongFlange,
              },
            },
            shearResistedBy: plate.shearResistedBy,
            shear: {
              fck: +concreteGrade.replace("M", ""),
              tg: plate.shearKeyDetails?.groutThickness ?? null,
              gammam0: plate.shearKeyDetails?.materialYielding ?? 1.1,
              gammam1: plate.shearKeyDetails?.materialUltimateStress ?? 1.25,
              gammamb: plate.shearKeyDetails?.anchorBolt ?? 1.25,
              gammammw: plate.shearKeyDetails?.weld ?? 1.25,
              hd: plate.shearKeyDetails?.overalDepth ?? null,
              hb: plate.shearKeyDetails?.flangeWidth ?? null,
              tskw: plate.shearKeyDetails?.webThick ?? null,
              tskf: plate.shearKeyDetails?.flangeThick ?? null,
              length: plate.shearKeyDetails?.keyLength ?? null,
              material: plate.shearKeyDetails?.material ?? null,
            },
            tensionCheck: getTensionCheck(
              plate,
              model.columns.find((c) => c.name === plate.column)
            ),
          },
        };
      }, {}),
    },
    circular: {
      ...model.circularBP.reduce((acc, plate) => {
        const column = getElementByName(model.columns, plate.column);
        const fMembers = members
          .filter((member) => replaceSplitNumber(member.name) === plate.column)
          .sort();
        const member = fMembers[0];
        if (!member) return acc;
        return {
          ...acc,
          [member.name]: {
            label: member.label,
            designMethod: plate.dMethod,
            basePlate: {
              thickness: plate.plateThickness,
              dia: plate.plateDiameter,
            },
            anchorBolt: {
              grade: plate.grade,
              dia: plate.anchorBoltDiameter,
              nos: plate.boltNos,
              BCD: plate.boltBCD,
              capacity: {
                tension: plate.tension,
                shear: plate.shear,
              },
            },
            stiffenerPlates: {
              size: {
                thickness: plate.stiffenerThickness,
                height: plate.stiffenerHeight,
                width: plate.plateDiameter - (column?.profile.d_global ?? 0),
              },
              nos: plate.stiffenerNos,
            },
          },
        };
      }, {}),
    },
  };
}

function getTensionCheck(rbp: TRBasePlateOF, column?: TColumnOF) {
  if (!column) {
    return { boltNos: 0, leverArm: 0, plateSupportedSides: 0, a: 0, b: 0 };
  }

  const pDepth = (column.profile.d_global ?? 0) / 2;
  const pTflange = (column.profile.tf_global ?? 0) / 2;
  const pThickness = (column.profile.tw_global ?? 0) / 2;

  const pWidth = (column.profile.bf_global ?? 0) / 2;
  const pHeight = pDepth - pTflange;

  const length = rbp.plateLength / 2;
  const width = rbp.plateWidth / 2;

  const stfT = rbp.stiffenerThickness / 2;

  const stfW = rbp.countAlongWidth / 2;
  const stfW1 = rbp.stiffenerAlongFlange !== 2;
  const stfW2 = rbp.stiffenerAlongFlange !== 1;

  const stfL = rbp.countAlongLength / 2;
  const stfL1 = rbp.stiffenerAlongWeb !== 2;

  const cmp1 = stfL1 ? 3 : 2;
  const cmp2 = stfW1 && stfW2 ? 3 : 2;
  const cmp3 = stfW2 ? 2 : undefined;

  const bolts: Vector2[] = [];
  for (
    let x = rbp.firstRowFromCenter_L,
      lenX = rbp.firstRowFromCenter_L + rbp.rowToRow_L * stfL;
    x < lenX;
    x += rbp.rowToRow_L
  ) {
    if (x > length) break;
    for (
      let y = rbp.firstRowFromCenter_W,
        lenY = rbp.firstRowFromCenter_W + rbp.rowToRow_W * stfW;
      y < lenY;
      y += rbp.rowToRow_W
    ) {
      if (y > width) break;
      bolts.push(new Vector2(x, y));
    }
  }

  const cmps: {
    nb: number;
    la: number;
    m: number;
    plateSupportedSides: number;
    a: number;
    b: number;
  }[] = [];

  const getBolts = (from: Vector2, to: Vector2) => {
    const center = new Vector2();
    let nb = 0;
    for (const b of bolts) {
      if (
        checkRange(b.x, from.x, to.x, true) &&
        checkRange(b.y, from.y, to.y, true)
      ) {
        center.add(b);
        nb++;
      }
    }
    center.divideScalar(nb);
    return { center, nb };
  };

  if (cmp3) {
    const fromV = new Vector2(pDepth, pWidth);
    const toV = new Vector2(length, width);
    const { center, nb } = getBolts(fromV, toV);
    const la = Math.max(center.x - fromV.x, center.y - fromV.y);
    la &&
      cmps.push({
        nb,
        la,
        m: roundM(nb * la),
        plateSupportedSides: cmp3,
        a: roundM(toV.x - fromV.x),
        b: roundM(toV.y - fromV.y),
      });
  }

  if (cmp2 === 2) {
    const fromV = new Vector2(pDepth, stfT);
    const toV = new Vector2(length, width);
    const { center, nb } = getBolts(fromV, toV);
    const la = Math.max(center.x - fromV.x, center.y - fromV.y);
    la &&
      cmps.push({
        nb,
        la,
        m: roundM(nb * la),
        plateSupportedSides: cmp2,
        a: roundM(toV.x - fromV.x),
        b: roundM(toV.y - fromV.y),
      });
  } else {
    const fromV = new Vector2(pDepth, stfT);
    const toV = new Vector2(length, pWidth - stfT);
    const { center, nb } = getBolts(fromV, toV);
    const la = Math.max(
      center.x - fromV.x,
      center.y - fromV.y,
      toV.y - center.y
    );
    la &&
      cmps.push({
        nb,
        la,
        m: roundM(nb * la),
        plateSupportedSides: cmp2,
        a: roundM(toV.x - fromV.x),
        b: roundM(toV.y - fromV.y),
      });
  }

  if (cmp1 === 2) {
    const fromV = new Vector2(0, pThickness);
    const toV = new Vector2(pHeight, width);
    const { center, nb } = getBolts(fromV, toV);
    const la = Math.max(toV.x - center.x, center.y - fromV.y);
    la &&
      cmps.push({
        nb,
        la,
        m: roundM(nb * la),
        plateSupportedSides: cmp1,
        a: roundM(toV.x - fromV.x),
        b: roundM(toV.y - fromV.y),
      });
  } else {
    const fromV = new Vector2(stfT, pThickness);
    const toV = new Vector2(pHeight, width);
    const { center, nb } = getBolts(fromV, toV);
    const la = Math.max(
      toV.x - center.x,
      center.x - fromV.x,
      center.y - fromV.y
    );
    la &&
      cmps.push({
        nb,
        la,
        m: roundM(nb * la),
        plateSupportedSides: cmp1,
        a: roundM(toV.x - fromV.x),
        b: roundM(toV.y - fromV.y),
      });
  }

  const max = Math.max(...cmps.map((cmp) => cmp.m));
  if (cmps.filter((cmp) => cmp.m === max).length > 1) {
    const leverArm = Math.max(...cmps.map((cmp) => cmp.la));
    const cmp = cmps.find((cmp) => cmp.la === leverArm);
    return cmp
      ? {
          boltNos: cmp.nb,
          leverArm,
          plateSupportedSides: cmp.plateSupportedSides,
          a: cmp.a,
          b: cmp.b,
        }
      : { boltNos: 0, leverArm: 0, plateSupportedSides: 0, a: 0, b: 0 };
  } else {
    const cmp = cmps.find((cmp) => cmp.m === max);
    return cmp
      ? {
          boltNos: cmp.nb,
          leverArm: cmp.la,
          plateSupportedSides: cmp.plateSupportedSides,
          a: cmp.a,
          b: cmp.b,
        }
      : { boltNos: 0, leverArm: 0, plateSupportedSides: 0, a: 0, b: 0 };
  }
}

function getSplicePlateData(model: TOpenFrame, members: Member[]) {
  return {
    rectangular: {
      ...model.rectangularSF.reduce((acc, flange) => {
        const column = model.columns.find(
          (column) => column.name === flange.column
        );
        const connectingCol = model.columns.find(
          (connCol) => column && column.next === connCol.name
        );
        const memberPrev = members.find(
          (member) => replaceSplitNumber(member.name) === flange.column
        );
        const memberNext = members.find(
          (member) => replaceSplitNumber(member.name) === connectingCol?.name
        );
        return {
          ...acc,
          [flange.column]: {
            label: memberPrev?.label,
            connectingColName: connectingCol?.name,
            connectingColLabel: memberNext?.label,
            designMethod: flange.dMethod,
            topSplicePlate: {
              thickness: flange.plateThickness,
              length: flange.plateLength,
              width: flange.plateWidth,
            },
            bottomSplicePlate: {
              thickness: flange.bottomPlateThickness,
              length: flange.bottomPlateLength,
              width: flange.bottomPlateWidth,
            },
            spliceBolt: {
              grade: flange.grade,
              dia: flange.anchorBoltDiameter,
              nos: {
                alongLength: flange.countAlongLength,
                alongWidth: flange.countAlongWidth,
                spacingAlongLength: {
                  "1stRowFromCenter": flange.firstRowFromCenter_L,
                  rowToRow: flange.rowToRow_L,
                },
                spacingAlongWidth: {
                  "1stRowFromCenter": flange.firstRowFromCenter_W,
                  rowToRow: flange.rowToRow_W,
                },
              },
              capacity: {
                tension: flange.tension,
                shear: flange.shear,
              },
            },
            stiffenerPlates: {
              size: {
                thickness: flange.stiffenerThickness,
                height: flange.stiffenerHeight,
              },
              nos: {
                alongWeb: flange.stiffenerAlongWeb,
                alongFlange: flange.stiffenerAlongFlange,
              },
            },
            tensionCheck: {
              topSplicePlate: getTensionCheck(
                flange as TRBasePlateOF,
                connectingCol
              ),
              bottomSplicePlate: getTensionCheck(
                {
                  ...flange,
                  plateWidth: (flange as TRSpliceFlangeOF).bottomPlateWidth,
                  plateLength: (flange as TRSpliceFlangeOF).bottomPlateLength,
                } as TRBasePlateOF,
                column
              ),
            },
          },
        };
      }, {}),
    },
    circular: {
      ...model.circularSF.reduce((acc, flange) => {
        const column = model.columns.find(
          (column) => column.name === flange.column
        );
        const connectingCol = model.columns.find(
          (connCol) => column && column.next === connCol.name
        );
        return {
          ...acc,
          [flange.column]: {
            label: members.find((member) => member.name === flange.column)
              ?.label,
            connectingColName: connectingCol?.name,
            connectingColLabel: members.find(
              (member) => member.name === connectingCol?.name
            )?.label,
            designMethod: flange.dMethod,
            topSplicePlate: {
              thickness: flange.plateThickness,
              dia: flange.plateDiameter,
            },
            bottomSplicePlate: {
              thickness: flange.bottomPlateThickness,
              dia: flange.bottomPlateDiameter,
            },
            anchorBolt: {
              grade: flange.grade,
              dia: flange.anchorBoltDiameter,
              nos: flange.boltNos,
              BCD: flange.boltBCD,
              capacity: {
                tension: flange.tension,
                shear: flange.shear,
              },
            },
            stiffenerPlates: {
              size: {
                thickness: flange.stiffenerThickness,
                height: flange.stiffenerHeight,
                width: flange.plateDiameter - (column?.profile.d_global ?? 0),
              },
              nos: flange.stiffenerNos,
            },
          },
        };
      }, {}),
    },
  };
}

function getPipes(pipes: TPipeOF[], beams: TBeamElement[]) {
  let pipeItems: any[] = [];
  let PCIndex = 0;
  pipes.forEach((pipe) => {
    let index = 1;
    let points: any[] = [{ ...pipe.startPos }];

    // getting support beams
    pipe.supports.forEach((sup) => {
      const beam = beams.find((beam) => beam.name === sup.beam);
      if (beam) {
        points = [
          ...points,
          {
            ...sup.position,
            supBeam: { ...beam, supType: sup.type },
            PCIndex: ++PCIndex,
          },
        ];
      } else points = [...points, { ...sup.position }];
    });

    // create pipe items
    points = [...points, pipe.endPos].sort((a, b) =>
      a.x === b.x ? (a.y === b.y ? a.z - b.z : a.y - b.y) : a.x - b.x
    );

    points.forEach((point, i, arr) => {
      const nextPoint = arr[i + 1];
      if (nextPoint) {
        const start = new Vector3(point.x, point.y, point.z);
        const end = new Vector3(nextPoint.x, nextPoint.y, nextPoint.z);
        let distance = start.distanceTo(end);
        let x = point.x;
        let y = point.y;
        let z = point.z;
        while (distance > 0) {
          let offsetX = 0;
          let offsetY = 0;
          let offsetZ = 0;
          const length = distance > 1 ? 1 : distance;
          // todo offsets using cos
          const pos = getPosByDistance(
            start.distanceTo(new Vector3(x, y, z)) + length,
            start,
            end
          );
          offsetX = pos.x;
          offsetY = pos.y;
          offsetZ = pos.z;
          let startSupBeam;
          if (point.x === x && point.y === y && point.z === z) {
            startSupBeam = point.supBeam;
            const pcName = point.PCIndex ? `PC${point.PCIndex}` : undefined;
            if (startSupBeam && pcName) {
              const isSlidingX = point.supBeam.supType === "Sliding X";
              const isSlidingY = point.supBeam.supType === "Sliding Y";
              const isSlidingZ = point.supBeam.supType === "Sliding Z";
              if (!pipeItems.some((item) => item.name === pcName)) {
                pipeItems = [
                  ...pipeItems,
                  {
                    type: "PipeConnector",
                    name: pcName,
                    beamName: `${pcName}-${startSupBeam.name}`,
                    pipeName: `${pcName}-${pipe.name}`,
                    startPos: new Vector3(x, startSupBeam.startPos.y, z),
                    endPos: new Vector3(x, y, z),
                    diameter: pipe.diameter,
                    thickness: pipe.thickness,
                    material: pipe.material.material_name,
                    supType: point.supBeam.supType,
                    releases: {
                      fx2: isSlidingX,
                      fy2: isSlidingY,
                      fz2: isSlidingZ,
                      mx2: isSlidingY || isSlidingZ,
                      my2: isSlidingX || isSlidingZ,
                      mz2: isSlidingX || isSlidingY,
                    },
                  },
                ];
              }
            }
          }

          let endSupBeam;
          if (
            nextPoint.x === offsetX &&
            nextPoint.y === offsetY &&
            nextPoint.z === offsetZ
          ) {
            endSupBeam = nextPoint.supBeam;
            const pcName = nextPoint.PCIndex
              ? `PC${nextPoint.PCIndex}`
              : undefined;
            if (endSupBeam && pcName) {
              const isSlidingX = nextPoint.supBeam.supType === "Sliding X";
              const isSlidingY = nextPoint.supBeam.supType === "Sliding Y";
              const isSlidingZ = nextPoint.supBeam.supType === "Sliding Z";
              if (!pipeItems.some((item) => item.name === pcName)) {
                pipeItems = [
                  ...pipeItems,
                  {
                    type: "PipeConnector",
                    name: pcName,
                    beamName: `${pcName}-${endSupBeam.name}`,
                    pipeName: `${pcName}-${pipe.name}`,
                    startPos: new Vector3(
                      offsetX,
                      startSupBeam.startPos.y,
                      offsetZ
                    ),
                    endPos: new Vector3(offsetX, offsetY, offsetZ),
                    diameter: pipe.diameter,
                    thickness: pipe.thickness,
                    material: pipe.material,
                    supType: nextPoint.supBeam.supType,
                    releases: {
                      fx2: isSlidingX,
                      fy2: isSlidingY,
                      fz2: isSlidingZ,
                      mx2: isSlidingY || isSlidingZ,
                      my2: isSlidingX || isSlidingZ,
                      mz2: isSlidingX || isSlidingY,
                    },
                  },
                ];
              }
            }
          }

          pipeItems = [
            ...pipeItems,
            {
              type: "PipeItem",
              name: `${pipe.name}.${index}`,
              startPos: new Vector3(x, y, z),
              endPos: new Vector3(offsetX, offsetY, offsetZ),
              diameter: pipe.diameter,
              thickness: pipe.thickness,
              material: pipe.material.material_name,
            },
          ];
          x = offsetX;
          y = offsetY;
          z = offsetZ;
          distance--;
          index++;
        }
      }
    });
  });
  // at first PipeItems after PipeConnectors
  return pipeItems.sort((a, b) => -a.type.localeCompare(b.type));
}


export function getJSONForDesignCodesAndParametersOF(
  ui: OpenFrameUI,
  designCode: DesignCodeAndParametersUI,
  scene: Scene,
  project: Project,
  selected: TOpenFrame,
  models: TOpenFrame[]
) {
  let nodes: Node[] = [];
  const beamElements: BeamElement[] = [];
  let members: Member[] = [];
  let beamNodes: BeamNode[] = [];

  const deadLoadsElements: number[] = [];
  const liveLoadsElements: number[] = [];
  const windLoadsElements: number[] = [];
  const directLoadsElements: number[] = [];
  const equipmentLoadsElements: number[] = [];

  const secondScene = scene.clone();

  let model = createBeamsFromRunners(selected, secondScene);
  model = createElementsFromTruss(model, secondScene);
  model = createElementsFromRailings(model, secondScene);
  const deadLoad = getDeadLoad(ui.loadingsUI.deadLoadUI);
  const liveLoad = getLiveLoad(ui.loadingsUI.liveLoadUI);
  const windLoads = getElementsForWindLoads(
    model,
    ui.loadingsUI.windLoadUI,
    getAllElements(ui, models)
  );
  const pipingLoad = getPipingLoad();
  const equipmentLoad = getEquipmentLoad();

  const prBlanketLoads = ui.loadingsUI.pipingLoadsUI.blanketLoads.filter(
    (item) => item.model === model.name && item.from && item.to
  );

  const map = getMapOfBeamElements(model);
  const elements = [
    ...splitColumns(map, model, model.columns, ui.loadingsUI),
    ...splitBeams(map, model, model.beams, ui.loadingsUI),
    ...splitCantilevers(map, model, model.cantilevers, ui.loadingsUI),
    ...splitBracings(model, model.kneeBracings, ui.loadingsUI),
    ...splitBracings(model, model.verticalBracings, ui.loadingsUI),
    ...splitBracings(model, model.horizontalBracings, ui.loadingsUI),
    ...splitStaircases(map, model, model.staircases),
  ]
    .map((el) => ({
      ...el,
      startPos: roundVectorM(
        localToGlobal(model.startPos, el.startPos, model.direction)
      ),
      endPos: roundVectorM(
        localToGlobal(model.startPos, el.endPos, model.direction)
      ),
    }))
    .sort((a, b) => sortByMiddlePoint(a, b));
  // creating nodes
  let vectors: Vector3[] = [];
  elements.forEach((el) => {
    if (!vectors.some((v) => v.equals(el.startPos)))
      vectors = [...vectors, el.startPos];
    if (!vectors.some((v) => v.equals(el.endPos)))
      vectors = [...vectors, el.endPos];
  });
  vectors
    .sort((a, b) =>
      a.y === b.y ? (a.z === b.z ? a.x - b.x : a.z - b.z) : a.y - b.y
    )
    .forEach((v, i) => {
      const x = MtoMM(v.x);
      const y = MtoMM(v.y);
      const z = MtoMM(v.z);
      nodes = [...nodes, { nodeNumber: i + 1, x, y, z, memberNames: "" }];
      beamNodes = [
        ...beamNodes,
        {
          label: i + 1,
          coordinates: [x, y, z],
          loads: [],
          boundaryConditionsOne: "",
        },
      ];
    });

  const pipesElements = getPipes(model.pipes, [
    ...model.beams,
    ...model.cantilevers,
    ...model.columns,
  ])
    .map((el) => ({
      ...el,
      startPos: localToGlobal(model.startPos, el.startPos, model.direction),
      endPos: localToGlobal(model.startPos, el.endPos, model.direction),
    }))
    .sort((a, b) => sortByMiddlePoint(a, b));
  const pipeVectors: Vector3[] = [];
  pipesElements.forEach((el) => {
    if (
      !pipeVectors.some((v) => v.equals(el.startPos)) &&
      !vectors.some((v) => v.equals(el.startPos))
    )
      pipeVectors.push(el.startPos);
    if (
      !pipeVectors.some((v) => v.equals(el.endPos)) &&
      !vectors.some((v) => v.equals(el.endPos))
    )
      pipeVectors.push(el.endPos);
  });
  pipeVectors
    .sort((a, b) =>
      a.y === b.y ? (a.z === b.z ? a.x - b.x : a.z - b.z) : a.y - b.y
    )
    .forEach((v) => {
      const x = MtoMM(v.x);
      const y = MtoMM(v.y);
      const z = MtoMM(v.z);
      nodes = [
        ...nodes,
        { nodeNumber: nodes.length + 1, x, y, z, memberNames: "" },
      ];
      beamNodes = [
        ...beamNodes,
        {
          label: nodes.length,
          coordinates: [x, y, z],
          loads: [],
          boundaryConditionsOne: "",
        },
      ];
    });

  const allElements: any[] = [...elements, ...pipesElements];
  // creating others
  allElements.forEach((item) => {
    // start node
    const node1 = nodes.find(
      (node) =>
        node.x === MtoMM(item.startPos.x) &&
        node.y === MtoMM(item.startPos.y) &&
        node.z === MtoMM(item.startPos.z)
    );
    // end node
    const node2 = nodes.find(
      (node) =>
        node.x === MtoMM(item.endPos.x) &&
        node.y === MtoMM(item.endPos.y) &&
        node.z === MtoMM(item.endPos.z)
    );
    nodes = nodes.map((node) => {
      if (node.nodeNumber === node1!.nodeNumber) {
        return {
          ...node1,
          memberNames: node1!.memberNames
            ? `${node1!.memberNames},${
                item.type === "PipeConnector" ? item.beamName : item.name
              }`
            : item.name,
        } as Node;
      } else if (node.nodeNumber === node2!.nodeNumber) {
        return {
          ...node2,
          memberNames: node2!.memberNames
            ? `${node2!.memberNames},${
                item.type === "PipeConnector" ? item.pipeName : item.name
              }`
            : item.name,
        } as Node;
      } else return node;
    });

    if (
      item.type === "COLUMN" &&
      item.secondType === "GENERAL" &&
      item.startPos.y === model.startPos.y + model.baseElevation
    ) {
      const frame = model.frames.find((frame) => frame.name === item.frame);
      if (frame) {
        beamNodes = beamNodes.map((bNode) => {
          if (bNode.label === node1!.nodeNumber) {
            return {
              ...bNode,
              boundaryConditionsOne:
                frame.supportType === "Fix" ? "Fixed" : "Pinned",
            };
          } else return bNode;
        });
      }
    }

    if ((item.type === "STAIRCASE") === item.supportType) {
      beamNodes = beamNodes.map((bNode) => {
        if (bNode.label === node1!.nodeNumber) {
          return {
            ...bNode,
            boundaryConditionsOne:
              item.supportType === "Fix" ? "Fixed" : "Pinned",
          };
        } else return bNode;
      });
    }

    const zAxis = new Vector3();

    if (item.type === "PipeConnector") {
      const start = new Vector3(node1!.x, node1!.y, node1!.z);
      const end = new Vector3(node2!.x, node2!.y, node2!.z);
      const pos = new Vector3().addVectors(start, end).divideScalar(2);
      const pc = new Mesh(
        new CylinderBufferGeometry(1, 1, start.distanceTo(end)),
        new MeshBasicMaterial()
      );
      pc.position.add(pos);
      pc.lookAt(end);
      pc.rotateX(deg90InRad);
      pc.getWorldDirection(zAxis);
    } else if (item.type === "PipeItem") {
      const start = new Vector3(node1!.x, node1!.y, node1!.z);
      const end = new Vector3(node2!.x, node2!.y, node2!.z);
      const pos = new Vector3().addVectors(start, end).divideScalar(2);
      const pc = new Mesh(
        new CylinderBufferGeometry(1, 1, start.distanceTo(end))
      );
      pc.position.add(pos);
      pc.lookAt(end);
      pc.rotateY(-deg90InRad);
      pc.rotateX(deg180InRad);
      pc.getWorldDirection(zAxis);
    } else {
      scene
        .getObjectByName(model.name)
        ?.getObjectByName(replaceSplitNumber(item.name))
        ?.getWorldDirection(zAxis) ||
        secondScene
          .getObjectByName(model.name)
          ?.getObjectByName(replaceSplitNumber(item.name))
          ?.getWorldDirection(zAxis);
    }

    const beamElement = getBeamElement(
      node1!.nodeNumber,
      node2!.nodeNumber,
      beamElements.length,
      [zAxis.x, zAxis.y, zAxis.z],
      item.releases
    );

    beamElements[beamElement.label - 1] = beamElement;

    let effectiveLength: AmericanEffectiveLengthUI | undefined;
    if (designCode.designCode === "AISC LRFD") {
      effectiveLength = designCode.americanDesignCode.effectiveLengths.find(
        (el) => el.model === model.name && el.element === item.name
      );
    }

    members = [
      ...members,
      getMember(
        beamElement.label,
        item.name,
        item.profile,
        roundM(item.startPos.distanceTo(item.endPos)),
        item.diameter,
        item.thickness,
        item.material,
        effectiveLength
      ),
    ];

    if (
      deadLoad.fireProofLoad.fpApp === "All elements" &&
      (item.startPos.y < deadLoad.fireProofLoad.fpHeight + model.startPos.y ||
        item.endPos.y < deadLoad.fireProofLoad.fpHeight + model.startPos.y)
    ) {
      let maxValue;
      if (item.type === "PipeItem") {
        maxValue = item.diameter;
      } else {
        maxValue = Math.max(
          item.profile.bf_global ?? 0,
          item.profile.d_global ?? 0,
          item.profile.tf_global ?? 0,
          item.profile.tfb_global ?? 0,
          item.profile.tw_global ?? 0
        );
      }

      let length = item.startPos.distanceTo(item.endPos);

      if (item.endPos.y > deadLoad.fireProofLoad.fpHeight + model.startPos.y)
        length -=
          item.endPos.y - (deadLoad.fireProofLoad.fpHeight + model.startPos.y);
      if (item.startPos.y > deadLoad.fireProofLoad.fpHeight + model.startPos.y)
        length -=
          item.startPos.y -
          (deadLoad.fireProofLoad.fpHeight + model.startPos.y);

      if (maxValue <= deadLoad.fireProofLoad.fpDf) {
        deadLoad.fireProofLoad.boxFpList.push({
          label: beamElement.label,
          length: MtoMM(length),
        });
      } else {
        deadLoad.fireProofLoad.profFpList.push({
          label: beamElement.label,
          length: MtoMM(length),
        });
      }
    }

    function getItemDeadLoad(
      item: any,
      type: LoadType,
      distance: number,
      l?: number
    ) {
      const loads = ui.loadingsUI.deadLoadUI.loads.filter((load) => {
        return (
          load.type === type &&
          load.model === model.name &&
          load.element === replaceSplitNumber(item.name) &&
          load.distance === distance &&
          (l ? roundM(load.lengthOfUDL) === roundM(l - distance) : true)
        );
      });
      return loads.filter((l) => {
        if (deadLoadsElements.includes(l.id)) return false;
        if (l.type === "Point Load") deadLoadsElements.push(l.id);
        return true;
      });
    }

    function getItemLiveLoad(
      item: any,
      type: LoadType,
      distance: number,
      l?: number
    ) {
      const loads = ui.loadingsUI.liveLoadUI.loads.filter(
        (load) =>
          load.model === model.name &&
          load.element === replaceSplitNumber(item.name) &&
          load.type === type &&
          load.distance === distance &&
          (l ? load.lengthOfUDL === roundM(l - distance) : true)
      );
      return loads.filter((l) => {
        if (liveLoadsElements.includes(l.id)) return false;
        if (l.type === "Point Load") liveLoadsElements.push(l.id);
        return true;
      });
    }

    function getItemWindLoad(
      item: any,
      type: LoadType,
      distance: number,
      l?: number
    ) {
      const loads = ui.loadingsUI.windLoadUI.loads.filter(
        (load) =>
          load.model === model.name &&
          load.element === replaceSplitNumber(item.name) &&
          load.type === type &&
          load.distance === distance &&
          (l ? load.lengthOfUDL === roundM(l - distance) : true)
      );
      return loads.filter((l) => {
        if (windLoadsElements.includes(l.id)) return false;
        if (l.type === "Point Load") windLoadsElements.push(l.id);
        return true;
      });
    }

    function getItemDirectLoad(item: any, distance: number) {
      const loads = ui.loadingsUI.pipingLoadsUI.directLoads.filter(
        (load) =>
          load.model === model.name &&
          load.element === replaceSplitNumber(item.name) &&
          load.distance === distance
      );
      return loads.filter((l) => {
        if (directLoadsElements.includes(l.id)) return false;
        directLoadsElements.push(l.id);
        return true;
      });
    }

    function getItemEquipmentLoad(item: any, distance: number) {
      const loads = ui.loadingsUI.equipmentLoadUI.filter(
        (load) =>
          load.model === model.name &&
          load.element === replaceSplitNumber(item.name) &&
          load.distance === distance
      );
      return loads.filter((l) => {
        if (equipmentLoadsElements.includes(l.id)) return false;
        equipmentLoadsElements.push(l.id);
        return true;
      });
    }

    // additional load
    if (item.deadLoadPointS !== undefined) {
      const loads = getItemDeadLoad(item, "Point Load", item.deadLoadPointS);
      for (const load of loads) {
        deadLoad.additionalLoad.pointLoad = getPointLoad(
          deadLoad.additionalLoad.pointLoad,
          node1!,
          load
        );
      }
    }
    if (item.deadLoadPointE !== undefined) {
      const loads = getItemDeadLoad(item, "Point Load", item.deadLoadPointE);
      for (const load of loads) {
        deadLoad.additionalLoad.pointLoad = getPointLoad(
          deadLoad.additionalLoad.pointLoad,
          node2!,
          load
        );
      }
    }
    if (item.liveLoadPointS !== undefined) {
      const loads = getItemLiveLoad(item, "Point Load", item.liveLoadPointS);
      for (const load of loads) {
        liveLoad.additionalLoad.pointLoad = getPointLoad(
          liveLoad.additionalLoad.pointLoad,
          node1!,
          load
        );
      }
    }
    if (item.liveLoadPointE !== undefined) {
      const loads = getItemLiveLoad(item, "Point Load", item.liveLoadPointE);
      for (const load of loads) {
        liveLoad.additionalLoad.pointLoad = getPointLoad(
          liveLoad.additionalLoad.pointLoad,
          node2!,
          load
        );
      }
    }
    if (item.windLoadPointS !== undefined) {
      const loads = getItemWindLoad(item, "Point Load", item.windLoadPointS);
      for (const load of loads) {
        windLoads.additionalLoad.pointLoad = getPointLoad(
          windLoads.additionalLoad.pointLoad,
          node1!,
          load,
          undefined,
          true
        );
      }
    }
    if (item.windLoadPointE !== undefined) {
      const loads = getItemWindLoad(item, "Point Load", item.windLoadPointE);
      for (const load of loads) {
        windLoads.additionalLoad.pointLoad = getPointLoad(
          windLoads.additionalLoad.pointLoad,
          node2!,
          load,
          undefined,
          true
        );
      }
    }
    if (item.directLoadPointS !== undefined) {
      const loads = getItemDirectLoad(item, item.directLoadPointS);
      for (const load of loads) {
        pipingLoad.directLoad.emptyLoad.pointLoad = {
          ...getPointLoad(
            pipingLoad.directLoad.emptyLoad.pointLoad,
            node1!,
            { Fy: load.empty_Fy } as AdditionalLoadUI,
            load.lineNo
          ),
        };
        pipingLoad.directLoad.testingLoad.pointLoad = {
          ...getPointLoad(
            pipingLoad.directLoad.testingLoad.pointLoad,
            node1!,
            {
              Fx: load.test_Fx,
              Fy: load.test_Fy,
              Fz: load.test_Fz,
              Mx: load.test_Mx,
              My: load.test_My,
              Mz: load.test_Mz,
            } as AdditionalLoadUI,
            load.lineNo
          ),
        };
        pipingLoad.directLoad.operatingLoad.pointLoad = {
          ...getPointLoad(
            pipingLoad.directLoad.operatingLoad.pointLoad,
            node1!,
            {
              Fx: load.operating_Fx,
              Fy: load.operating_Fy,
              Fz: load.operating_Fz,
              Mx: load.operating_Mx,
              My: load.operating_My,
              Mz: load.operating_Mz,
            } as AdditionalLoadUI,
            load.lineNo
          ),
        };
        pipingLoad.directLoad.thermalAnchorLoad.pointLoad = {
          ...getPointLoad(
            pipingLoad.directLoad.thermalAnchorLoad.pointLoad,
            node1!,
            {
              Fx: load.thermalAnchor_Fx,
              Fy: load.thermalAnchor_Fy,
              Fz: load.thermalAnchor_Fz,
              Mx: load.thermalAnchor_Mx,
              My: load.thermalAnchor_My,
              Mz: load.thermalAnchor_Mz,
            } as AdditionalLoadUI,
            load.lineNo
          ),
        };
        pipingLoad.directLoad.thermalFrictionLoad.pointLoad = {
          ...getPointLoad(
            pipingLoad.directLoad.thermalFrictionLoad.pointLoad,
            node1!,
            {
              Fx: load.thermalFriction_Fx,
              Fy: load.thermalFriction_Fy,
              Fz: load.thermalFriction_Fz,
            } as AdditionalLoadUI,
            load.lineNo
          ),
        };
        pipingLoad.directLoad.windOnPipeLoadX.pointLoad = {
          ...getPointLoad(
            pipingLoad.directLoad.windOnPipeLoadX.pointLoad,
            node1!,
            {
              Fx: load.windLoadX_Fx,
              Fy: load.windLoadX_Fy,
              Fz: load.windLoadX_Fz,
            } as AdditionalLoadUI,
            load.lineNo
          ),
        };
        pipingLoad.directLoad.windOnPipeLoadZ.pointLoad = {
          ...getPointLoad(
            pipingLoad.directLoad.windOnPipeLoadZ.pointLoad,
            node1!,
            {
              Fx: load.windLoadZ_Fx,
              Fy: load.windLoadZ_Fy,
              Fz: load.windLoadZ_Fz,
            } as AdditionalLoadUI,
            load.lineNo
          ),
        };
        pipingLoad.directLoad.psvReleaseOrSurgeLoad.pointLoad = {
          ...getPointLoad(
            pipingLoad.directLoad.psvReleaseOrSurgeLoad.pointLoad,
            node1!,
            {
              Fx: load.surgeLoad_Fx,
              Fy: load.surgeLoad_Fy,
              Fz: load.surgeLoad_Fz,
            } as AdditionalLoadUI,
            load.lineNo
          ),
        };
        pipingLoad.directLoad.snowIceLoad.pointLoad = {
          ...getPointLoad(
            pipingLoad.directLoad.snowIceLoad.pointLoad,
            node1!,
            { Fy: load.snowLoad } as AdditionalLoadUI,
            load.lineNo
          ),
        };
      }
    }
    if (item.directLoadPointE !== undefined) {
      const loads = getItemDirectLoad(item, item.directLoadPointE);
      for (const load of loads) {
        pipingLoad.directLoad.emptyLoad.pointLoad = {
          ...getPointLoad(
            pipingLoad.directLoad.emptyLoad.pointLoad,
            node2!,
            { Fy: load.empty_Fy } as AdditionalLoadUI,
            load.lineNo
          ),
        };
        pipingLoad.directLoad.testingLoad.pointLoad = {
          ...getPointLoad(
            pipingLoad.directLoad.testingLoad.pointLoad,
            node2!,
            {
              Fx: load.test_Fx,
              Fy: load.test_Fy,
              Fz: load.test_Fz,
              Mx: load.test_Mx,
              My: load.test_My,
              Mz: load.test_Mz,
            } as AdditionalLoadUI,
            load.lineNo
          ),
        };
        pipingLoad.directLoad.operatingLoad.pointLoad = {
          ...getPointLoad(
            pipingLoad.directLoad.operatingLoad.pointLoad,
            node2!,
            {
              Fx: load.operating_Fx,
              Fy: load.operating_Fy,
              Fz: load.operating_Fz,
              Mx: load.operating_Mx,
              My: load.operating_My,
              Mz: load.operating_Mz,
            } as AdditionalLoadUI,
            load.lineNo
          ),
        };
        pipingLoad.directLoad.thermalAnchorLoad.pointLoad = {
          ...getPointLoad(
            pipingLoad.directLoad.thermalAnchorLoad.pointLoad,
            node2!,
            {
              Fx: load.thermalAnchor_Fx,
              Fy: load.thermalAnchor_Fy,
              Fz: load.thermalAnchor_Fz,
              Mx: load.thermalAnchor_Mx,
              My: load.thermalAnchor_My,
              Mz: load.thermalAnchor_Mz,
            } as AdditionalLoadUI,
            load.lineNo
          ),
        };
        pipingLoad.directLoad.thermalFrictionLoad.pointLoad = {
          ...getPointLoad(
            pipingLoad.directLoad.thermalFrictionLoad.pointLoad,
            node2!,
            {
              Fx: load.thermalFriction_Fx,
              Fy: load.thermalFriction_Fy,
              Fz: load.thermalFriction_Fz,
            } as AdditionalLoadUI,
            load.lineNo
          ),
        };
        pipingLoad.directLoad.windOnPipeLoadX.pointLoad = {
          ...getPointLoad(
            pipingLoad.directLoad.windOnPipeLoadX.pointLoad,
            node2!,
            {
              Fx: load.windLoadX_Fx,
              Fy: load.windLoadX_Fy,
              Fz: load.windLoadX_Fz,
            } as AdditionalLoadUI,
            load.lineNo
          ),
        };
        pipingLoad.directLoad.windOnPipeLoadZ.pointLoad = {
          ...getPointLoad(
            pipingLoad.directLoad.windOnPipeLoadZ.pointLoad,
            node2!,
            {
              Fx: load.windLoadZ_Fx,
              Fy: load.windLoadZ_Fy,
              Fz: load.windLoadZ_Fz,
            } as AdditionalLoadUI,
            load.lineNo
          ),
        };
        pipingLoad.directLoad.psvReleaseOrSurgeLoad.pointLoad = {
          ...getPointLoad(
            pipingLoad.directLoad.psvReleaseOrSurgeLoad.pointLoad,
            node2!,
            {
              Fx: load.surgeLoad_Fx,
              Fy: load.surgeLoad_Fy,
              Fz: load.surgeLoad_Fz,
            } as AdditionalLoadUI,
            load.lineNo
          ),
        };
        pipingLoad.directLoad.snowIceLoad.pointLoad = {
          ...getPointLoad(
            pipingLoad.directLoad.snowIceLoad.pointLoad,
            node2!,
            { Fy: load.snowLoad } as AdditionalLoadUI,
            load.lineNo
          ),
        };
      }
    }
    if (item.equipmentLoadS !== undefined) {
      const loads = getItemEquipmentLoad(item, item.equipmentLoadS);
      for (const load of loads) {
        equipmentLoad.directLoad.emptyLoad.pointLoad = getPointLoad(
          equipmentLoad.directLoad.emptyLoad.pointLoad,
          node1!,
          {
            Fy: load.empty_Fy,
          } as AdditionalLoadUI
        );
        equipmentLoad.directLoad.testingLoad.pointLoad = getPointLoad(
          equipmentLoad.directLoad.testingLoad.pointLoad,
          node1!,
          {
            Fx: load.test_Fx,
            Fy: load.test_Fy,
            Fz: load.test_Fz,
            Mx: load.test_Mx,
            My: load.test_My,
            Mz: load.test_Mz,
          } as AdditionalLoadUI
        );
        equipmentLoad.directLoad.operatingLoad.pointLoad = getPointLoad(
          equipmentLoad.directLoad.operatingLoad.pointLoad,
          node1!,
          {
            Fx: load.operating_Fx,
            Fy: load.operating_Fy,
            Fz: load.operating_Fz,
            Mx: load.operating_Mx,
            My: load.operating_My,
            Mz: load.operating_Mz,
          } as AdditionalLoadUI
        );
      }
    }
    if (item.equipmentLoadE !== undefined) {
      const loads = getItemEquipmentLoad(item, item.equipmentLoadE);
      for (const load of loads) {
        equipmentLoad.directLoad.emptyLoad.pointLoad = getPointLoad(
          equipmentLoad.directLoad.emptyLoad.pointLoad,
          node2!,
          {
            Fy: load.empty_Fy,
          } as AdditionalLoadUI
        );
        equipmentLoad.directLoad.testingLoad.pointLoad = getPointLoad(
          equipmentLoad.directLoad.testingLoad.pointLoad,
          node2!,
          {
            Fx: load.test_Fx,
            Fy: load.test_Fy,
            Fz: load.test_Fz,
            Mx: load.test_Mx,
            My: load.test_My,
            Mz: load.test_Mz,
          } as AdditionalLoadUI
        );
        equipmentLoad.directLoad.operatingLoad.pointLoad = getPointLoad(
          equipmentLoad.directLoad.operatingLoad.pointLoad,
          node2!,
          {
            Fx: load.operating_Fx,
            Fy: load.operating_Fy,
            Fz: load.operating_Fz,
            Mx: load.operating_Mx,
            My: load.operating_My,
            Mz: load.operating_Mz,
          } as AdditionalLoadUI
        );
      }
    }

    if (item.deadLoadUDL) {
      const loads = getItemDeadLoad(
        item,
        "UDL",
        item.deadLoadUDL[0],
        item.deadLoadUDL[1]
      );
      for (const load of loads) {
        deadLoad.additionalLoad.udl = getUDL(
          deadLoad.additionalLoad.udl,
          beamElement,
          load
        );
      }
    }
    if (item.liveLoadUDL) {
      const loads = getItemLiveLoad(
        item,
        "UDL",
        item.liveLoadUDL[0],
        item.liveLoadUDL[1]
      );
      for (const load of loads) {
        liveLoad.additionalLoad.udl = getUDL(
          liveLoad.additionalLoad.udl,
          beamElement,
          load
        );
      }
    }
    if (item.windLoadUDL) {
      const loads = getItemWindLoad(
        item,
        "UDL",
        item.windLoadUDL[0],
        item.windLoadUDL[1]
      );
      for (const load of loads) {
        windLoads.additionalLoad.udl = getUDL(
          windLoads.additionalLoad.udl,
          beamElement,
          load,
          true
        );
      }
    }
  });

  let accessoriesItems: any[] = [];
  for (const ag of model.accessories) {
    let load:
      | AccessoriesTPLoad
      | AccessoriesFPLoad
      | AccessoriesCTLoad
      | undefined;
    const isTP = ag.type === "TP";
    const isFP = ag.type === "FP";
    const isCT = ag.type === "CT";
    if (isTP) {
      load = ui.loadingsUI.deadLoadUI.accessoriesTPLoads.find(
        (l) => l.model === model.name && l.group === ag.name
      );
    } else if (isFP) {
      load = ui.loadingsUI.deadLoadUI.accessoriesFPLoads.find(
        (l) => l.model === model.name && l.group === ag.name
      );
    } else if (isCT) {
      load = ui.loadingsUI.deadLoadUI.accessoriesCTLoads.find(
        (l) => l.model === model.name && l.group === ag.name
      );
    }
    if (!load) continue;
    accessoriesItems = [
      ...accessoriesItems,
      ...ag.elements.map((el) => ({
        grName: ag.name,
        loadData: {
          type: ag.type,
          TPS: isTP ? ag.accessorySpacing : 0,
          TPL: isTP ? load!.top : 0,
          TPPL: isTP ? (el as TTPElementOF).projectionLeft : 0,
          TPPR: isTP ? (el as TTPElementOF).projectionRight : 0,
          FPS: isFP ? ag.accessorySpacing : 0,
          FPLL1: isFP ? (load as AccessoriesFPLoad).l1 : 0,
          FPLL2: isFP ? (load as AccessoriesFPLoad).l2 : 0,
          FPLL3: isFP ? (load as AccessoriesFPLoad).l3 : 0,
          FPLL4: isFP ? (load as AccessoriesFPLoad).l4 : 0,
          FPLT: isFP ? (load as AccessoriesFPLoad).top : 0,
          FPPL1: isFP ? (el as TFPElementOF).projection : 0,
          FPPL2: isFP ? (el as TFPElementOF).projection : 0,
          FPPL3: isFP ? (el as TFPElementOF).projection : 0,
          FPPL4: isFP ? (el as TFPElementOF).projection : 0,
          FPPLT: isFP ? (el as TFPElementOF).projection : 0,
          CPS: isCT ? ag.accessorySpacing : 0,
          CPL1: isCT ? (load as AccessoriesCTLoad).l1 : 0,
          CPL2: isCT ? (load as AccessoriesCTLoad).l2 : 0,
          CPL3: isCT ? (load as AccessoriesCTLoad).l3 : 0,
          CPL4: isCT ? (load as AccessoriesCTLoad).l4 : 0,
          CPLT: isCT ? (load as AccessoriesCTLoad).top : 0,
          CPPL1: isCT ? (el as TCTElementOF).projectionLeft : 0,
          CPPL2: isCT ? (el as TCTElementOF).projectionLeft : 0,
          CPPL3: isCT ? (el as TCTElementOF).projectionLeft : 0,
          CPPL4: isCT ? (el as TCTElementOF).projectionLeft : 0,
          CPPLT: isCT ? (el as TCTElementOF).projectionLeft : 0,
          CPPR1: isCT ? (el as TCTElementOF).projectionRight : 0,
          CPPR2: isCT ? (el as TCTElementOF).projectionRight : 0,
          CPPR3: isCT ? (el as TCTElementOF).projectionRight : 0,
          CPPR4: isCT ? (el as TCTElementOF).projectionRight : 0,
          CPPRT: isCT ? (el as TCTElementOF).projectionRight : 0,
        },
      })),
    ];
  }

  deadLoad.accessories = accessoriesItems.reduce(
    (acc, el, i) => ({ ...acc, [i]: el }),
    {}
  );

  if (prBlanketLoads) {
    pipingLoad.blanketLoad = getBlanketLoad(
      prBlanketLoads,
      model,
      elements,
      members
    );
  }

  const designParameters = {
    designCode: designCode.designCode,
    isCodeParameters: {
      cmx: designCode.indianDesignCode.cmx,
      cmy: designCode.indianDesignCode.cmy,
      cmz: designCode.indianDesignCode.cmz,
      deflectionRatio: designCode.indianDesignCode.deflectionRatio,
      klrColumn: designCode.indianDesignCode.klrMaxColumns,
      klrBracings: designCode.indianDesignCode.klrMaxBracings,
      klrBeams: designCode.indianDesignCode.klrMaxBeams,
      allowStressRatio: designCode.indianDesignCode.stressRation,
      effectiveLengthTable: designCode.indianDesignCode.effectiveLengths
        .filter((item) => item.model === model.name && item.element)
        .reduce((acc, item) => {
          const label =
            members.find((member) => member.name === item.element)?.label ?? -1;
          return {
            ...acc,
            [label]: {
              element: label,
              ky: item.Ky,
              kz: item.Kz,
              ly: item.Ly,
              lz: item.Lz,
            },
          };
        }, {}),
      deflectionLengthTable:
        designCode.indianDesignCode.deflectionLengths
          ?.filter((item) => item.model === model.name && item.element)
          .reduce((acc, item) => {
            const label =
              members.find((member) => member.name === item.element)?.label ??
              -1;
            return { ...acc, [label]: item.dl };
          }, {}) ?? {},
    },
    aiscLRFDCodeParameters: {
      cb: designCode.americanDesignCode.cb,
      deflectionRatio: designCode.americanDesignCode.deflectionRatio,
      klrColumn: designCode.americanDesignCode.klrMaxColumns,
      klrBracings: designCode.americanDesignCode.klrMaxBracings,
      klrBeams: designCode.americanDesignCode.klrMaxBeams,
      allowStressRatio: designCode.americanDesignCode.stressRation,
      effectiveLengthTable: designCode.americanDesignCode.effectiveLengths
        .filter((item) => item.model === model.name && item.element)
        .reduce((acc, item) => {
          const label =
            members.find((member) => member.name === item.element)?.label ?? -1;
          return {
            ...acc,
            [label]: {
              element: label,
              ky: item.Ky,
              kz: item.Kz,
              ly: item.Ly,
              lz: item.Lz,
              unlb: item.UNLB,
              unlt: item.UNLT,
            },
          };
        }, {}),
      deflectionLengthTable:
        designCode.americanDesignCode.deflectionLengths
          ?.filter((item) => item.model === model.name && item.element)
          .reduce((acc, item) => {
            const label =
              members.find((member) => member.name === item.element)?.label ??
              -1;
            return { ...acc, [label]: item.dl };
          }, {}) ?? {},
    },
    euroCodeParameters: {},
  };

  const modelBeamElements = getBeamElementsOfModel(model);
  let elevations: number[] = [];
  modelBeamElements.forEach((el) => {
    if (
      el.type === "COLUMN" ||
      el.type === "VERTICAL-BRACING" ||
      el.type === "KNEE-BRACING"
    ) {
      if (!elevations.includes(el.endPos.y)) {
        elevations = [...elevations, el.endPos.y];
      }
    } else {
      if (!elevations.includes(el.startPos.y)) {
        elevations = [...elevations, el.startPos.y];
      }
    }
  });

  const elementElevations = elevations
    .sort((a, b) => a - b)
    .reduce(
      (acc, elevation, index) => ({
        ...acc,
        [index + 1]: { group: "", level: index + 1, elevation },
      }),
      {}
    );

  const accessoriesData = getAccessoriesData(
    model,
    allElements,
    members,
    elementElevations
  );

  return {
    id: `admin${project.name.replace(/\s/g, "")}`, // TODO: selecting user name
    projectName: project.name,
    openFrameName: model.name,
    openFrameDirection: model.direction,
    material:
      project.selectedMaterial?.material_name ?? model.material?.material_name,
    materialId:
      project.selectedMaterial?.material_id ?? model.material?.material_id,
    overallStructureHeight: modelBeamElements.reduce(
      (acc, item) => Math.max(acc, item.startPos.y),
      0
    ),
    numberOfSimilarFrames: model.frames.length,
    numberOfColumns: model.columns.length,
    width: model.frames.reduce((acc, item) => Math.max(acc, item.width), 0),
    length: model.frames.reduce((acc, item) => Math.max(acc, item.chainage), 0),
    baseElevation: model.baseElevation,
    elementElevations,
    structuralNaturalFrequency: model.structuralNaturalFrequency ?? 0,
    beamElements: beamElements.reduce(
      (acc, element) => ({ ...acc, [element.label]: element }),
      {}
    ),
    beamNodes: beamNodes.reduce(
      (acc, node) => ({ ...acc, [node.label]: node }),
      {}
    ),
    nodes: nodes.reduce(
      (acc, node) => ({ ...acc, [node.nodeNumber]: node }),
      {}
    ),
    members,
    loadCombinations: parseLoadCombinations(
      ui.loadingsUI.loadCombinations.loadCombinations
    ),
    designParameters,
    frameData: getFrameData(model, members),
    bayData: getBayData(model, members),
    basePlate: getBasePlateData(ui.basePlates.concreteGrade, model, members),
    splicePlate: getSplicePlateData(model, members),
    platformData: getPlatformData(model, members, elements),
    accessoriesData,
    deadLoad,
    liveLoad,
    pipingLoad,
    equipmentLoad,
    temperatureLoad: {
      min: ui.loadingsUI.tempLoadUI.minTemp,
      max: ui.loadingsUI.tempLoadUI.maxTemp,
    },
    windLoads,
    seismicData: getSeismicData(model, ui, elements, beamElements, members),
  } as any;
}

function createBeamsFromRunners(model: TOpenFrame, secondScene: Scene) {
  let changed = { ...model };
  for (const item of changed.runners ?? []) {
    if (item.globalSide === "SIDE") {
      const from = changed.columns.find((el) => el.name === item.from);
      const to = changed.columns.find((el) => el.name === item.to);
      if (!from || !to) continue;
      for (let i = 0; i < item.numbers; i++) {
        const start = new Vector3(
          from.startPos.x,
          roundM(from.startPos.y + item.offset + item.spacing * i),
          from.startPos.z
        );
        const end = new Vector3(to.startPos.x, start.y, to.startPos.z);
        const id = getNextId(changed.beams);
        const name = `B${getIndexName(changed.beams, "B")}`;
        const beam: TBeamOF = {
          id,
          frame: from.frame,
          startPos: start.clone(),
          endPos: end.clone(),
          connected: [],
          startConnected: [],
          endConnected: [],
          name,
          orientation: 0,
          profile: item.profile,
          secondType: "CtoC",
          type: "BEAM",
          direction: start.x === end.x ? "Z" : "X",
        };
        changed = updateConnections(changed, beam);
        const beamMesh = createElementByProfile(
          start.distanceTo(end),
          beamColorRGB,
          item.profile
        );
        beamMesh.name = name;
        beamMesh.position.copy(start);
        beamMesh.lookAt(end);
        beamMesh.position.add(end).divideScalar(2);
        beamMesh.rotateY(-deg90InRad);
        secondScene.getObjectByName(model.name)?.add(beamMesh);
      }
    } else {
      const from = changed.beams.find((el) => el.name === item.from);
      const to = changed.beams.find((el) => el.name === item.to);
      if (!from || !to) continue;
      const dir = from.direction;
      for (let i = 0; i < item.numbers; i++) {
        const start = new Vector3(
          dir === "X"
            ? roundM(from.startPos.x + item.offset + item.spacing * i)
            : from.startPos.x,
          from.startPos.y,
          dir === "X"
            ? from.startPos.z
            : roundM(from.startPos.z + item.offset + item.spacing * i)
        );
        const end = new Vector3(
          dir === "X"
            ? roundM(from.startPos.x + item.offset + item.spacing * i)
            : to.startPos.x,
          to.startPos.y,
          dir === "X"
            ? to.startPos.z
            : roundM(from.startPos.z + item.offset + item.spacing * i)
        );
        const id = getNextId(changed.beams);
        const name = `B${getIndexName(changed.beams, "B")}`;
        const beam: TBeamOF = {
          id,
          frame: from.frame,
          startPos: start.clone(),
          endPos: end.clone(),
          connected: [],
          startConnected: [],
          endConnected: [],
          name,
          orientation: 0,
          profile: item.profile,
          secondType: "BtoB",
          type: "BEAM",
          direction: start.x === end.x ? "Z" : "X",
        };
        changed = updateConnections(changed, beam);
        const beamMesh = createElementByProfile(
          start.distanceTo(end),
          beamColorRGB,
          item.profile
        );
        beamMesh.name = name;
        beamMesh.position.copy(start);
        beamMesh.lookAt(end);
        beamMesh.position.add(end).divideScalar(2);
        beamMesh.rotateY(-deg90InRad);
        secondScene.getObjectByName(model.name)?.add(beamMesh);
      }
    }
  }
  return changed;
}

function createElementsFromTruss(model: TOpenFrame, secondScene: Scene) {
  let changed = { ...model };
  for (const item of model.truss ?? []) {
    const from = model.beams.find((b) => b.name === item.from);
    if (!from) continue;
    const { startPos } = from;
    const span_2 = item.span / 2;
    const prevTV = new Vector3();
    const prevSLT = new Vector3();
    const prevBLT = new Vector3();
    const prevSRT = new Vector3();
    const prevBRT = new Vector3();
    for (let i = 0; i < item.numbers; i++) {
      const span_2_3 = span_2 / 3;
      const top = span_2 * Math.tan(degToRad(item.slope));
      const small = span_2_3 * Math.tan(degToRad(item.slope));
      const big = span_2_3 * 2 * Math.tan(degToRad(item.slope));
      const x = item.offset + item.spacing * i;

      const LT = new Vector3(x).add(startPos);
      const CT = new Vector3(x, 0, span_2).add(startPos);
      const RT = new Vector3(x, 0, item.span).add(startPos);

      const TV = CT.clone();
      TV.setY(TV.y + top);

      const SLB = new Vector3(x, 0, span_2_3).add(startPos);
      const SLT = SLB.clone();
      SLT.setY(SLT.y + small);

      const BLB = SLB.clone();
      BLB.setZ(BLB.z + span_2_3);
      const BLT = BLB.clone();
      BLT.setY(BLT.y + big);

      const BRB = new Vector3(x, 0, span_2 + span_2_3).add(startPos);
      const BRT = BRB.clone();
      BRT.setY(BRT.y + big);

      const SRB = new Vector3(x, 0, span_2 + span_2_3 * 2).add(startPos);
      const SRT = SRB.clone();
      SRT.setY(SRT.y + small);

      LT.copy(fixVectorByOrientation(startPos, LT, -90));
      LT.set(roundM(LT.x), roundM(LT.y), roundM(LT.z));
      CT.copy(fixVectorByOrientation(startPos, CT, -90));
      CT.set(roundM(CT.x), roundM(CT.y), roundM(CT.z));
      RT.copy(fixVectorByOrientation(startPos, RT, -90));
      RT.set(roundM(RT.x), roundM(RT.y), roundM(RT.z));
      TV.copy(fixVectorByOrientation(startPos, TV, -90));
      TV.set(roundM(TV.x), roundM(TV.y), roundM(TV.z));
      SLB.copy(fixVectorByOrientation(startPos, SLB, -90));
      SLB.set(roundM(SLB.x), roundM(SLB.y), roundM(SLB.z));
      SLT.copy(fixVectorByOrientation(startPos, SLT, -90));
      SLT.set(roundM(SLT.x), roundM(SLT.y), roundM(SLT.z));
      BLB.copy(fixVectorByOrientation(startPos, BLB, -90));
      BLB.set(roundM(BLB.x), roundM(BLB.y), roundM(BLB.z));
      BLT.copy(fixVectorByOrientation(startPos, BLT, -90));
      BLT.set(roundM(BLT.x), roundM(BLT.y), roundM(BLT.z));
      BRB.copy(fixVectorByOrientation(startPos, BRB, -90));
      BRB.set(roundM(BRB.x), roundM(BRB.y), roundM(BRB.z));
      BRT.copy(fixVectorByOrientation(startPos, BRT, -90));
      BRT.set(roundM(BRT.x), roundM(BRT.y), roundM(BRT.z));
      SRB.copy(fixVectorByOrientation(startPos, SRB, -90));
      SRB.set(roundM(SRB.x), roundM(SRB.y), roundM(SRB.z));
      SRT.copy(fixVectorByOrientation(startPos, SRT, -90));
      SRT.set(roundM(SRT.x), roundM(SRT.y), roundM(SRT.z));

      let name = "";
      if (
        !changed.beams.some((beam) => {
          if (beam.startPos.y !== LT.y || beam.endPos.y !== LT.y) return false;
          const dir = getSimpleDirection(LT, RT);
          if (dir !== getSimpleDirection(beam.startPos, beam.endPos))
            return false;
          return dir === "X"
            ? LT.z === beam.startPos.z &&
                checkRange(LT.x, beam.startPos.x, beam.endPos.x, true, true)
            : LT.x === beam.startPos.x &&
                checkRange(LT.z, beam.startPos.z, beam.endPos.z, true, true);
        })
      ) {
        name = `B${getIndexName(changed.beams, "B")}`;
        const tie: TBeamOF = {
          id: getNextId(changed.beams),
          frame: from.frame,
          startPos: LT.clone(),
          endPos: RT.clone(),
          connected: [],
          startConnected: [],
          endConnected: [],
          name,
          orientation: 0,
          profile: item.tie,
          secondType: "BtoB",
          type: "BEAM",
          direction: LT.x === RT.x ? "Z" : "X",
        };
        changed = updateConnections(changed, tie);
        const tieMesh = createElementByProfile(
          item.span,
          beamColorRGB,
          item.tie
        );
        tieMesh.name = name;
        setPositionAndDirection(tieMesh, LT, RT);
        secondScene.getObjectByName(model.name)?.add(tieMesh);
      }

      name = `B${getIndexName(changed.beams, "B")}`;
      const rafterL: TBeamOF = {
        id: getNextId(changed.beams),
        frame: from.frame,
        startPos: LT.clone(),
        endPos: TV.clone(),
        connected: [],
        startConnected: [],
        endConnected: [],
        name,
        orientation: 0,
        profile: item.rafter,
        secondType: "BtoB",
        type: "BEAM",
        direction: LT.x === TV.x ? "Z" : "X",
      };
      changed = updateConnections(changed, rafterL);
      const rafterLMesh = createElementByProfile(
        LT.distanceTo(TV),
        beamColorRGB,
        item.rafter
      );
      rafterLMesh.name = name;
      setPositionAndDirection(rafterLMesh, LT, TV);
      secondScene.getObjectByName(model.name)?.add(rafterLMesh);

      name = `B${getIndexName(changed.beams, "B")}`;
      const rafterR: TBeamOF = {
        id: getNextId(changed.beams),
        frame: from.frame,
        startPos: TV.clone(),
        endPos: RT.clone(),
        connected: [],
        startConnected: [],
        endConnected: [],
        name,
        orientation: 0,
        profile: item.rafter,
        secondType: "BtoB",
        type: "BEAM",
        direction: TV.x === RT.x ? "Z" : "X",
      };
      changed = updateConnections(changed, rafterR);
      const rafterRMesh = createElementByProfile(
        TV.distanceTo(RT),
        beamColorRGB,
        item.rafter
      );
      rafterRMesh.name = name;
      setPositionAndDirection(rafterRMesh, TV, RT);
      secondScene.getObjectByName(model.name)?.add(rafterRMesh);

      name = `C${getIndexName(changed.columns, "C")}`;
      const verticalSL: TColumnOF = {
        id: getNextId(changed.columns),
        startPos: SLB.clone(),
        endPos: SLT.clone(),
        frame: from.frame,
        name,
        pos: SLB.clone(),
        profile: item.vertical,
        secondType: "ADDITIONAL",
        type: "COLUMN",
        orientation: 0,
        connected: [],
        startConnected: [],
        endConnected: [],
      };
      changed = updateConnections(changed, verticalSL);
      const verticalSLMesh = createElementByProfile(
        small,
        beamColorRGB,
        item.vertical
      );
      verticalSLMesh.name = name;
      setPositionAndDirection(verticalSLMesh, SLB, SLT);
      secondScene.getObjectByName(model.name)?.add(verticalSLMesh);

      name = `C${getIndexName(changed.columns, "C")}`;
      const verticalBL: TColumnOF = {
        id: getNextId(changed.columns),
        startPos: BLB.clone(),
        endPos: BLT.clone(),
        frame: from.frame,
        name,
        pos: BLB.clone(),
        profile: item.vertical,
        secondType: "ADDITIONAL",
        type: "COLUMN",
        orientation: 0,
        connected: [],
        startConnected: [],
        endConnected: [],
      };
      changed = updateConnections(changed, verticalBL);
      const verticalBLMesh = createElementByProfile(
        big,
        beamColorRGB,
        item.vertical
      );
      verticalBLMesh.name = name;
      setPositionAndDirection(verticalBLMesh, BLB, BLT);
      secondScene.getObjectByName(model.name)?.add(verticalBLMesh);

      name = `C${getIndexName(changed.columns, "C")}`;
      const verticalC: TColumnOF = {
        id: getNextId(changed.columns),
        startPos: CT.clone(),
        endPos: TV.clone(),
        frame: from.frame,
        name,
        pos: CT.clone(),
        profile: item.vertical,
        secondType: "ADDITIONAL",
        type: "COLUMN",
        orientation: 0,
        connected: [],
        startConnected: [],
        endConnected: [],
      };
      changed = updateConnections(changed, verticalC);
      const verticalCMesh = createElementByProfile(
        top,
        beamColorRGB,
        item.vertical
      );
      verticalCMesh.name = name;
      setPositionAndDirection(verticalCMesh, CT, TV);
      secondScene.getObjectByName(model.name)?.add(verticalCMesh);

      name = `C${getIndexName(changed.columns, "C")}`;
      const verticalBR: TColumnOF = {
        id: getNextId(changed.columns),
        startPos: BRB.clone(),
        endPos: BRT.clone(),
        frame: from.frame,
        name,
        pos: BRB.clone(),
        profile: item.vertical,
        secondType: "ADDITIONAL",
        type: "COLUMN",
        orientation: 0,
        connected: [],
        startConnected: [],
        endConnected: [],
      };
      changed = updateConnections(changed, verticalBR);
      const verticalBRMesh = createElementByProfile(
        big,
        beamColorRGB,
        item.vertical
      );
      verticalBRMesh.name = name;
      setPositionAndDirection(verticalBRMesh, BRB, BRT);
      secondScene.getObjectByName(model.name)?.add(verticalBRMesh);

      name = `C${getIndexName(changed.columns, "C")}`;
      const verticalSR: TColumnOF = {
        id: getNextId(changed.columns),
        startPos: SRB.clone(),
        endPos: SRT.clone(),
        frame: from.frame,
        name,
        pos: SRB.clone(),
        profile: item.vertical,
        secondType: "ADDITIONAL",
        type: "COLUMN",
        orientation: 0,
        connected: [],
        startConnected: [],
        endConnected: [],
      };
      changed = updateConnections(changed, verticalSR);
      const verticalSRMesh = createElementByProfile(
        small,
        beamColorRGB,
        item.vertical
      );
      verticalSRMesh.name = name;
      setPositionAndDirection(verticalSRMesh, SRB, SRT);
      secondScene.getObjectByName(model.name)?.add(verticalSRMesh);

      name = `VB${getIndexName(changed.verticalBracings, "VB")}`;
      const inclinedSL: TVerticalBracingOF = {
        id: getNextId(changed.verticalBracings),
        frame: from.frame,
        startPos: BLB.clone(),
        endPos: SLT.clone(),
        connected: [],
        startConnected: [],
        endConnected: [],
        name,
        orientation: 0,
        profile: item.inclined,
        type: "VERTICAL-BRACING",
        secondType: "Diagonal Up",
        isUp: true,
      };
      changed = updateConnections(changed, inclinedSL);
      const inclinedSLMesh = createElementByProfile(
        BLB.distanceTo(SLT),
        beamColorRGB,
        item.inclined
      );
      inclinedSLMesh.name = name;
      setPositionAndDirection(inclinedSLMesh, BLB, SLT);
      secondScene.getObjectByName(model.name)?.add(inclinedSLMesh);

      name = `VB${getIndexName(changed.verticalBracings, "VB")}`;
      const inclinedSR: TVerticalBracingOF = {
        id: getNextId(changed.verticalBracings),
        frame: from.frame,
        startPos: BRB.clone(),
        endPos: SRT.clone(),
        connected: [],
        startConnected: [],
        endConnected: [],
        name,
        orientation: 0,
        profile: item.inclined,
        type: "VERTICAL-BRACING",
        secondType: "Diagonal Up",
        isUp: true,
      };
      changed = updateConnections(changed, inclinedSR);
      const inclinedSRMesh = createElementByProfile(
        BRB.distanceTo(SRT),
        beamColorRGB,
        item.inclined
      );
      inclinedSRMesh.name = name;
      setPositionAndDirection(inclinedSRMesh, BRB, SRT);
      secondScene.getObjectByName(model.name)?.add(inclinedSRMesh);

      name = `VB${getIndexName(changed.verticalBracings, "VB")}`;
      const inclinedBL: TVerticalBracingOF = {
        id: getNextId(changed.verticalBracings),
        frame: from.frame,
        startPos: CT.clone(),
        endPos: BLT.clone(),
        connected: [],
        startConnected: [],
        endConnected: [],
        name,
        orientation: 0,
        profile: item.inclined,
        type: "VERTICAL-BRACING",
        secondType: "Diagonal Up",
        isUp: true,
      };
      changed = updateConnections(changed, inclinedBL);
      const inclinedBLMesh = createElementByProfile(
        CT.distanceTo(BLT),
        beamColorRGB,
        item.inclined
      );
      inclinedBLMesh.name = name;
      setPositionAndDirection(inclinedBLMesh, CT, BLT);
      secondScene.getObjectByName(model.name)?.add(inclinedBLMesh);

      name = `VB${getIndexName(changed.verticalBracings, "VB")}`;
      const inclinedBR: TVerticalBracingOF = {
        id: getNextId(changed.verticalBracings),
        frame: from.frame,
        startPos: CT.clone(),
        endPos: BRT.clone(),
        connected: [],
        startConnected: [],
        endConnected: [],
        name,
        orientation: 0,
        profile: item.inclined,
        type: "VERTICAL-BRACING",
        secondType: "Diagonal Up",
        isUp: true,
      };
      changed = updateConnections(changed, inclinedBR);
      const inclinedBRMesh = createElementByProfile(
        CT.distanceTo(BRT),
        beamColorRGB,
        item.inclined
      );
      inclinedBRMesh.name = name;
      setPositionAndDirection(inclinedBRMesh, CT, BRT);
      secondScene.getObjectByName(model.name)?.add(inclinedBRMesh);

      if (i) {
        const distance = prevTV.distanceTo(TV);
        name = `B${getIndexName(changed.beams, "B")}`;
        const topTie: TBeamOF = {
          id: getNextId(changed.beams),
          frame: from.frame,
          startPos: prevTV.clone(),
          endPos: TV.clone(),
          connected: [],
          startConnected: [],
          endConnected: [],
          name,
          orientation: 0,
          profile: item.tie,
          secondType: "BtoB",
          type: "BEAM",
          direction: prevTV.x === TV.x ? "Z" : "X",
        };
        changed = updateConnections(changed, topTie);
        const topTieMesh = createElementByProfile(
          distance,
          beamColorRGB,
          item.tie
        );
        topTieMesh.name = name;
        setPositionAndDirection(topTieMesh, prevTV, TV);
        secondScene.getObjectByName(model.name)?.add(topTieMesh);

        name = `B${getIndexName(changed.beams, "B")}`;
        const slTie: TBeamOF = {
          id: getNextId(changed.beams),
          frame: from.frame,
          startPos: prevSLT.clone(),
          endPos: SLT.clone(),
          connected: [],
          startConnected: [],
          endConnected: [],
          name,
          orientation: 0,
          profile: item.tie,
          secondType: "BtoB",
          type: "BEAM",
          direction: prevSLT.x === SLT.x ? "Z" : "X",
        };
        changed = updateConnections(changed, slTie);
        const slTieMesh = topTieMesh.clone();
        slTieMesh.name = name;
        setPositionAndDirection(slTieMesh, prevSLT, SLT);
        secondScene.getObjectByName(model.name)?.add(slTieMesh);

        name = `B${getIndexName(changed.beams, "B")}`;
        const blTie: TBeamOF = {
          id: getNextId(changed.beams),
          frame: from.frame,
          startPos: prevBLT.clone(),
          endPos: BLT.clone(),
          connected: [],
          startConnected: [],
          endConnected: [],
          name,
          orientation: 0,
          profile: item.tie,
          secondType: "BtoB",
          type: "BEAM",
          direction: prevBLT.x === BLT.x ? "Z" : "X",
        };
        changed = updateConnections(changed, blTie);
        const blTieMesh = topTieMesh.clone();
        blTieMesh.name = name;
        setPositionAndDirection(blTieMesh, prevBLT, BLT);
        secondScene.getObjectByName(model.name)?.add(blTieMesh);

        name = `B${getIndexName(changed.beams, "B")}`;
        const srTie: TBeamOF = {
          id: getNextId(changed.beams),
          frame: from.frame,
          startPos: prevSRT.clone(),
          endPos: SRT.clone(),
          connected: [],
          startConnected: [],
          endConnected: [],
          name,
          orientation: 0,
          profile: item.tie,
          secondType: "BtoB",
          type: "BEAM",
          direction: prevSRT.x === SRT.x ? "Z" : "X",
        };
        changed = updateConnections(changed, srTie);
        const srTieMesh = topTieMesh.clone();
        srTieMesh.name = name;
        setPositionAndDirection(srTieMesh, prevSRT, SRT);
        secondScene.getObjectByName(model.name)?.add(srTieMesh);

        name = `B${getIndexName(changed.beams, "B")}`;
        const brTie: TBeamOF = {
          id: getNextId(changed.beams),
          frame: from.frame,
          startPos: prevBRT.clone(),
          endPos: BRT.clone(),
          connected: [],
          startConnected: [],
          endConnected: [],
          name,
          orientation: 0,
          profile: item.tie,
          secondType: "BtoB",
          type: "BEAM",
          direction: prevBRT.x === BRT.x ? "Z" : "X",
        };
        changed = updateConnections(changed, brTie);
        const brTieMesh = topTieMesh.clone();
        brTieMesh.name = name;
        setPositionAndDirection(brTieMesh, prevBRT, BRT);
        secondScene.getObjectByName(model.name)?.add(brTieMesh);
      }

      prevTV.copy(TV);
      prevSLT.copy(SLT);
      prevBLT.copy(BLT);
      prevSRT.copy(SRT);
      prevBRT.copy(BRT);
    }
  }
  return changed;
}

function createElementsFromRailings(model: TOpenFrame, secondScene: Scene) {
  let changed = { ...model };
  for (const el of changed.railings ?? []) {
    const element =
      changed.beams.find((b) => b.name === el.element) ??
      changed.cantilevers.find((cnt) => cnt.name === el.element);
    if (!element) continue;
    const step = el.length / el.noOfSpacings;
    for (let i = 0; i <= el.noOfSpacings; i++) {
      const offset = el.distFromStartNode + step * i;

      const start = getPosByDistance(offset, element.startPos, element.endPos);
      start.set(roundM(start.x), roundM(start.y), roundM(start.z));

      const end = start.clone().setY(start.y + el.totalHeight);
      end.set(roundM(end.x), roundM(end.y), roundM(end.z));

      const name = `C${getIndexName(changed.columns, "C")}`;
      const vertical: TColumnOF = {
        id: getNextId(changed.columns),
        startPos: start.clone(),
        endPos: end.clone(),
        frame: element.frame,
        name,
        pos: start.clone(),
        profile: el.verticalRail,
        secondType: "ADDITIONAL",
        type: "COLUMN",
        orientation: 0,
        connected: [],
        startConnected: [],
        endConnected: [],
      };
      changed = updateConnections(changed, vertical);
      const verticalMesh = createElementByProfile(
        el.totalHeight,
        beamColorRGB,
        el.verticalRail
      );
      verticalMesh.name = name;
      setPositionAndDirection(verticalMesh, start, end);
      secondScene.getObjectByName(model.name)?.add(verticalMesh);

      if (el.middleHeight && el.middleRail && i < el.noOfSpacings) {
        const startB = start.clone().setY(start.y + el.middleHeight);
        startB.set(roundM(startB.x), roundM(startB.y), roundM(startB.z));

        const endB = getPosByDistance(
          offset + step,
          element.startPos,
          element.endPos
        );
        endB.setY(endB.y + el.middleHeight);
        endB.set(roundM(endB.x), roundM(endB.y), roundM(endB.z));

        const name = `B${getIndexName(changed.beams, "B")}`;
        const middle: TBeamOF = {
          id: getNextId(changed.beams),
          frame: element.frame,
          startPos: startB.clone(),
          endPos: endB.clone(),
          connected: [],
          startConnected: [],
          endConnected: [],
          name,
          orientation: 0,
          profile: el.middleRail,
          secondType: "CtoC",
          type: "BEAM",
          direction: startB.x === endB.x ? "Z" : "X",
        };
        changed = updateConnections(changed, middle);
        const middleMesh = createElementByProfile(
          step,
          beamColorRGB,
          el.middleRail
        );
        middleMesh.name = name;
        setPositionAndDirection(middleMesh, startB, endB);
        secondScene.getObjectByName(model.name)?.add(middleMesh);
      }
    }

    const start = getPosByDistance(
      el.distFromStartNode,
      element.startPos,
      element.endPos
    );
    start.setY(start.y + el.totalHeight);
    start.set(roundM(start.x), roundM(start.y), roundM(start.z));

    const end = getPosByDistance(
      el.distFromStartNode + el.length,
      element.startPos,
      element.endPos
    );
    end.setY(end.y + el.totalHeight);
    end.set(roundM(end.x), roundM(end.y), roundM(end.z));

    const name = `B${getIndexName(changed.beams, "B")}`;
    const top: TBeamOF = {
      id: getNextId(changed.beams),
      frame: element.frame,
      startPos: start.clone(),
      endPos: end.clone(),
      connected: [],
      startConnected: [],
      endConnected: [],
      name,
      orientation: 0,
      profile: el.topRail,
      secondType: "CtoC",
      type: "BEAM",
      direction: start.x === end.x ? "Z" : "X",
    };
    changed = updateConnections(changed, top);
    const topMesh = createElementByProfile(step, beamColorRGB, el.topRail);
    topMesh.name = name;
    setPositionAndDirection(topMesh, start, end);
    secondScene.getObjectByName(model.name)?.add(topMesh);
  }
  return changed;
}

type TAccessoriesData = {
  groupData: TAccessoryGroupData[];
  tPosts: TAccessoryElementData[];
  fPosts: TAccessoryElementData[];
  christmasTree: TAccessoryElementData[];
};

type TAccessoryGroupData = {
  type: "T-Post" | "F-Post" | "Christmas Tree";
  grName: string;
  distanceFromStart: number;
  orientation: Orientation;
  accessorySpacing: number;
  nos: number;
  frame: number;
  level: number;
};

type TAccessoryElementData = {
  grName: string;
  totalHeight: number;
  level1?: number;
  level2?: number;
  level3?: number;
  level4?: number;
  columns: any[];
  beams: any[];
};

function getAccessoryElements(
  members: Member[],
  elements: any[],
  names: string[]
) {
  return names.reduce((acc, item) => {
    const beamElement = elements.find(
      (el) => replaceSplitNumber(el.name) === item
    );
    const beamName = replaceSplitNumber(beamElement?.name ?? "");
    const filtered = members
      .filter((member) => checkMemberByElementName(member, { name: beamName }))
      .map((member) => ({
        label: member.label,
        orientation: beamElement?.orientation ?? 0,
      }));
    return [...acc, ...filtered];
  }, [] as any[]);
}

function getAccessoriesData(
  model: TOpenFrame,
  elements: any[],
  members: Member[],
  levels: any
) {
  const accessoriesData: TAccessoriesData = {
    groupData: [],
    tPosts: [],
    fPosts: [],
    christmasTree: [],
  };
  for (const ag of model.accessories) {
    let frame = model.frames.findIndex(
      (frame) => frame.name === ag.elements[0]?.frame
    );
    if (!frame) {
      frame = model.frames.findIndex(
        (frame) =>
          frame.name ===
          getElementByName(model.columns, ag.elements[0].columns[0])?.frame
      );
    }
    const level = Array.from(Object.values<any>(levels)).find(
      (level: any) => level.elevation === ag.startPos.y
    )?.level;
    if (level === undefined) continue;
    const type =
      ag.type === "TP"
        ? "T-Post"
        : ag.type === "FP"
        ? "F-Post"
        : "Christmas Tree";
    const agData: TAccessoryGroupData = {
      type,
      grName: ag.name,
      distanceFromStart: ag.distanceFromStart,
      orientation: ag.orientation,
      accessorySpacing: ag.accessorySpacing,
      nos: ag.elements.length,
      frame: frame < 0 ? 1 : frame + 1,
      level,
    };
    accessoriesData.groupData.push(agData);
    for (const element of ag.elements) {
      const elementData: TAccessoryElementData = {
        grName: ag.name,
        totalHeight: element.height,
        level1: (element as TFPElementOF).h1,
        level2: (element as TFPElementOF).h2,
        level3: (element as TFPElementOF).h3,
        level4: (element as TFPElementOF).h4,
        columns: getAccessoryElements(members, elements, element.columns),
        beams: getAccessoryElements(members, elements, element.beams),
      };
      if (type === "T-Post") {
        accessoriesData.tPosts.push(elementData);
      } else if (type === "F-Post") {
        accessoriesData.fPosts.push(elementData);
      } else {
        accessoriesData.christmasTree.push(elementData);
      }
    }
  }
  return accessoriesData;
}

export function getSeismicData(
  model: TOpenFrame,
  ui: OpenFrameUI,
  elements: any[],
  beamElements: BeamElement[],
  members: Member[]
) {
  const levels = Array.from(
    new Set(
      elements
        .filter((el) => el.type === "COLUMN" && el.secondType === "GENERAL")
        .map((el) => el.endPos.y)
    )
  );

  return {
    countryCode: ui.loadingsUI.seismicLoadsUI.seismicLoadingAsPerCode,
    analysisMethod: ui.loadingsUI.seismicLoadsUI.seismicAnalysisMethod,
    modalCombination: ui.loadingsUI.seismicLoadsUI.modalCombinationMethod,
    spectralData: ui.loadingsUI.seismicLoadsUI.spectralsPoints.map((sp) => ({
      timePeriod: sp.timePeriod,
      acceleration: sp.acceleration,
    })),
    zoneFactor: ui.loadingsUI.seismicLoadsUI.isSeismicCode.zoneFactor,
    responseReductionFactor:
      ui.loadingsUI.seismicLoadsUI.isSeismicCode.responseReductionFactor,
    soilType: ui.loadingsUI.seismicLoadsUI.isSeismicCode.soilType,
    importanceFactor:
      ui.loadingsUI.seismicLoadsUI.isSeismicCode.importanceFactor,
    dampingRatio: ui.loadingsUI.seismicLoadsUI.isSeismicCode.dampingRatio,
    soilFoundationCondition:
      ui.loadingsUI.seismicLoadsUI.isSeismicCode.soilFoundationCondition,
    timePeriod: ui.loadingsUI.seismicLoadsUI.isSeismicCode.timePeriod,
    seismicResponse: ui.loadingsUI.seismicLoadsUI.seismicLoads
      .filter((sl) => sl.model === model.name)
      .map((sl) => ({
        level: sl.level,
        node: sl.node,
        seismicWeight: sl.weight,
      })),
    nodes: levels.reduce((acc, level, index) => {
      const columns = elements.filter(
        (el) =>
          el.type === "COLUMN" &&
          el.secondType === "GENERAL" &&
          el.endPos.y === level
      );
      return {
        ...acc,
        [index + 1]: columns.reduce((acc, column) => {
          const beamElement = beamElements.find(
            (beamElement) =>
              beamElement.label ===
              getElementByName(members, column.name)?.label
          );
          if (!beamElement) return acc;
          const connNode = beamElement.nodes[1];
          const connected = beamElements.filter((el) => {
            if (!el.nodes.includes(connNode)) return false;
            const member = getElementByField(members, "label", el.label);
            if (!member) return false;
            const element = getElementByName(elements, member.name);
            return element.type === "BEAM";
          });
          return {
            ...acc,
            [connNode]: connected.map((conn) => conn.label),
          };
        }, {}),
      };
    }, {}),
  };
}

export function getElementsForWindLoads(
  model: TOpenFrame,
  loadings: WindLoadUI,
  elements: any[],
  angle: number = 45
) {
  let minX = 0;
  let maxX = 0;
  let minZ = 0;
  let maxZ = 0;

  elements.forEach((el) => {
    minX = Math.min(minX, el.startPos.x);
    minX = Math.min(minX, el.endPos.x);

    maxX = Math.max(maxX, el.startPos.x);
    maxX = Math.max(maxX, el.endPos.x);

    minZ = Math.min(minZ, el.startPos.z);
    minZ = Math.min(minZ, el.endPos.z);

    maxZ = Math.max(maxZ, el.startPos.z);
    maxZ = Math.max(maxZ, el.endPos.z);
  });

  const minV = new Vector2(minX, minZ);
  const maxV = new Vector2(maxX, maxZ);

  const center = new Vector2().addVectors(minV, maxV).divideScalar(2);

  const radius = minV.distanceTo(maxV) / 2;

  const vector45 = fixVectorByOrientation(
    new Vector3(center.x, 0, center.y),
    new Vector3(center.x + radius, 0, center.y),
    45
  );
  const vector45x2 = fixVectorByOrientation(
    new Vector3(center.x, 0, center.y),
    new Vector3(center.x + radius * 2, 0, center.y),
    45
  );
  const vector135 = fixVectorByOrientation(
    new Vector3(center.x, 0, center.y),
    new Vector3(center.x + radius, 0, center.y),
    135
  );
  const vector135x2 = fixVectorByOrientation(
    new Vector3(center.x, 0, center.y),
    new Vector3(center.x + radius * 2, 0, center.y),
    135
  );
  const vector225 = fixVectorByOrientation(
    new Vector3(center.x, 0, center.y),
    new Vector3(center.x + radius, 0, center.y),
    225
  );
  const vector225x2 = fixVectorByOrientation(
    new Vector3(center.x, 0, center.y),
    new Vector3(center.x + radius * 2, 0, center.y),
    225
  );
  const vector315 = fixVectorByOrientation(
    new Vector3(center.x, 0, center.y),
    new Vector3(center.x + radius, 0, center.y),
    315
  );
  const vector315x2 = fixVectorByOrientation(
    new Vector3(center.x, 0, center.y),
    new Vector3(center.x + radius * 2, 0, center.y),
    315
  );

  let modelsElements: any = {};
  elements.forEach((el) => {
    if (modelsElements[el.modelName]) {
      modelsElements = {
        ...modelsElements,
        [el.modelName]: [
          ...modelsElements[el.modelName],
          { ...el, index: modelsElements[el.modelName].length + 1 },
        ],
      };
    } else {
      modelsElements = {
        ...modelsElements,
        [el.modelName]: [{ ...el, index: 1 }],
      };
    }
  });

  const modelElements = modelsElements[model.name] as any[];

  const getLength = (
    model: TOpenFrame | undefined,
    items: any[],
    deg: Orientation
  ) => {
    if (!model || !items.length) return 0;

    let minItemX: number;
    let maxItemX: number;
    let minItemZ: number;
    let maxItemZ: number;

    items.forEach((item) => {
      minItemX =
        minItemX !== undefined
          ? Math.min(minItemX, item.startPos.x)
          : item.startPos.x;
      minItemX = Math.min(minItemX, item.endPos.x);

      maxItemX =
        maxItemX !== undefined
          ? Math.max(maxItemX, item.startPos.x)
          : item.startPos.x;
      maxItemX = Math.max(maxItemX, item.endPos.x);

      minItemZ =
        minItemZ !== undefined
          ? Math.min(minItemZ, item.startPos.z)
          : item.startPos.z;
      minItemZ = Math.min(minItemZ, item.endPos.z);

      maxItemZ =
        maxItemZ !== undefined
          ? Math.max(maxItemZ, item.startPos.z)
          : item.startPos.z;
      maxItemZ = Math.max(maxItemZ, item.endPos.z);
    });

    if (deg === 0 || deg === 180) {
      return maxItemZ! - minItemZ!;
    } else if (deg === 90 || deg === 270) {
      return maxItemX! - minItemX!;
    } else if (deg === 45 || deg === 225) {
      return new Vector2(minItemX!, minItemZ!).distanceTo(
        new Vector2(maxItemX!, maxItemZ!)
      );
    } else {
      return new Vector2(minItemX!, maxItemZ!).distanceTo(
        new Vector2(maxItemX!, minItemZ!)
      );
    }
  };

  const dir45Elements = getElementsForWindDirection(
    modelElements,
    vector45,
    fixVectorByOrientation(vector45, vector225x2, angle),
    fixVectorByOrientation(vector45, vector225x2, -angle)
  );

  const dir135Elements = getElementsForWindDirection(
    modelElements,
    vector135,
    fixVectorByOrientation(vector135, vector315x2, angle),
    fixVectorByOrientation(vector135, vector315x2, -angle)
  );

  const dir225Elements = getElementsForWindDirection(
    modelElements,
    vector225,
    fixVectorByOrientation(vector225, vector45x2, angle),
    fixVectorByOrientation(vector225, vector45x2, -angle)
  );

  const dir315Elements = getElementsForWindDirection(
    modelElements,
    vector315,
    fixVectorByOrientation(vector315, vector135x2, angle),
    fixVectorByOrientation(vector315, vector135x2, -angle)
  );

  const createPipeLevels = (elements: any[]) => {
    const map = new Map<number, number[]>();

    elements.forEach((el) => {
      const middle = (el.startPos.y + el.endPos.y) / 2;
      const items = map.get(middle);
      if (items) {
        map.set(middle, [...items, el.index]);
      } else map.set(middle, [el.index]);
    });

    return Array.from(map.entries()).reduce(
      (acc, [level, items], i) => ({ ...acc, [level]: items }),
      {}
    );
  };

  const height = modelElements.reduce(
    (max, item) => Math.max(max, item.startPos.y, item.endPos.y),
    model.baseElevation
  );

  const facingMembers = (elements: any[], deg: Orientation): any[] => {
    let selected: any[] = [];
    let filtered: any[] = [];
    switch (deg) {
      case 0:
      case 180:
        filtered = elements.filter((item) => item.startPos.x === item.endPos.x);
        for (const el of filtered) {
          if (el.type === "COLUMN") {
            const distance = el.endPos.y - el.startPos.y;
            let frames: { s: number; e: number }[] = [
              { s: el.startPos.y, e: el.endPos.y },
            ];
            for (const item of filtered) {
              if (item.type !== "COLUMN") continue;
              const resXZ =
                item.startPos.z === el.startPos.z &&
                (deg === 0
                  ? item.startPos.x > el.startPos.x
                  : item.startPos.x < el.startPos.x);
              if (!resXZ) continue;
              const newFrames: { s: number; e: number }[] = [...frames];
              for (let i = 0; i < frames.length; i++) {
                if (
                  checkRange(item.startPos.y, frames[i].s, frames[i].e, true)
                ) {
                  let repl = false;
                  if (item.startPos.y > frames[i].s) {
                    newFrames.splice(i, 1, {
                      s: frames[i].s,
                      e: item.startPos.y,
                    });
                    repl = true;
                  }
                  if (frames[i].e > item.endPos.y) {
                    newFrames.splice(repl ? i + 1 : i, repl ? 0 : 1, {
                      s: item.endPos.y,
                      e: frames[i].e,
                    });
                  } else if (!repl) newFrames.splice(i, 1);
                } else if (
                  checkRange(frames[i].s, item.startPos.y, item.endPos.y, true)
                ) {
                  if (frames[i].e > item.endPos.y) {
                    newFrames.splice(i, 1, {
                      s: item.endPos.y,
                      e: frames[i].e,
                    });
                  } else newFrames.splice(i, 1);
                }
              }
              frames = newFrames;
            }
            const clearH = frames.reduce((acc, item) => {
              return acc + (item.e - item.s);
            }, 0);
            if (clearH < distance / 2) continue;
          } else if (el.type === "BEAM" || el.type === "CANTILEVER") {
            let frames: { s: number; e: number }[] = [
              {
                s: Math.min(el.startPos.z, el.endPos.z),
                e: Math.max(el.startPos.z, el.endPos.z),
              },
            ];
            const distance = frames[0].e - frames[0].s;
            for (const item of filtered) {
              if (item.type !== "BEAM" && item.type !== "CANTILEVER") continue;
              const res =
                deg === 0
                  ? item.startPos.x > el.startPos.x
                  : item.startPos.x < el.startPos.x;
              if (!res) continue;
              const newFrames: { s: number; e: number }[] = [...frames];
              for (let i = 0; i < frames.length; i++) {
                const frame = frames[i];
                const sz = Math.min(item.startPos.z, item.endPos.z);
                const ez = Math.max(item.startPos.z, item.endPos.z);
                if (checkRange(sz, frame.s, frame.e, true)) {
                  let repl = false;
                  if (sz > frame.s) {
                    newFrames.splice(i, 1, { s: frame.s, e: sz });
                    repl = true;
                  }
                  if (frame.e > ez) {
                    newFrames.splice(repl ? i + 1 : i, repl ? 0 : 1, {
                      s: ez,
                      e: frame.e,
                    });
                  } else if (!repl) newFrames.splice(i, 1);
                } else if (checkRange(frame.s, sz, ez, true)) {
                  if (frame.e > ez) {
                    newFrames.splice(i, 1, { s: ez, e: frame.e });
                  } else newFrames.splice(i, 1);
                }
              }
              frames = newFrames;
            }
            const clearD = frames.reduce((acc, item) => {
              return acc + (item.e - item.s);
            }, 0);
            if (clearD < distance / 2) continue;
          } else if (
            el.type === "KNEE-BRACING" ||
            el.type === "VERTICAL-BRACING" ||
            el.type === "STAIRCASE"
          ) {
            const res = filtered.some((item) => {
              if (
                item.type !== "KNEE-BRACING" &&
                item.type !== "VERTICAL-BRACING" &&
                item.type !== "STAIRCASE"
              )
                return false;
              return (
                ((item.startPos.y === el.startPos.y &&
                  item.endPos.y === el.endPos.y) ||
                  (item.startPos.y === el.endPos.y &&
                    item.endPos.y === el.startPos.y)) &&
                ((item.startPos.z === el.startPos.z &&
                  item.endPos.z === el.endPos.z) ||
                  (item.startPos.z === el.endPos.z &&
                    item.endPos.z === el.startPos.z)) &&
                (deg === 0
                  ? item.startPos.x > el.startPos.x
                  : item.startPos.x < el.startPos.x)
              );
            });
            if (res) continue;
          }
          selected = [...selected, el];
        }
        break;
      case 90:
      case 270:
        filtered = elements.filter((item) => item.startPos.z === item.endPos.z);
        for (const el of filtered) {
          if (el.type === "COLUMN") {
            const distance = el.endPos.y - el.startPos.y;
            let frames: { s: number; e: number }[] = [
              { s: el.startPos.y, e: el.endPos.y },
            ];
            for (const item of filtered) {
              if (item.type !== "COLUMN") continue;
              const resXZ =
                item.startPos.x === el.startPos.x &&
                (deg === 90
                  ? item.startPos.z < el.startPos.z
                  : item.startPos.z > el.startPos.z);
              if (!resXZ) continue;
              const newFrames: { s: number; e: number }[] = [...frames];
              for (let i = 0; i < frames.length; i++) {
                if (
                  checkRange(item.startPos.y, frames[i].s, frames[i].e, true)
                ) {
                  let repl = false;
                  if (item.startPos.y > frames[i].s) {
                    newFrames.splice(i, 1, {
                      s: frames[i].s,
                      e: item.startPos.y,
                    });
                    repl = true;
                  }
                  if (frames[i].e > item.endPos.y) {
                    newFrames.splice(repl ? i + 1 : i, repl ? 0 : 1, {
                      s: item.endPos.y,
                      e: frames[i].e,
                    });
                  } else if (!repl) newFrames.splice(i, 1);
                } else if (
                  checkRange(frames[i].s, item.startPos.y, item.endPos.y, true)
                ) {
                  if (frames[i].e > item.endPos.y) {
                    newFrames.splice(i, 1, {
                      s: item.endPos.y,
                      e: frames[i].e,
                    });
                  } else newFrames.splice(i, 1);
                }
              }
              frames = newFrames;
            }
            const clearH = frames.reduce((acc, item) => {
              return acc + (item.e - item.s);
            }, 0);
            if (clearH < distance / 2) continue;
          } else if (el.type === "BEAM" || el.type === "CANTILEVER") {
            let frames: { s: number; e: number }[] = [
              {
                s: Math.min(el.startPos.x, el.endPos.x),
                e: Math.max(el.startPos.x, el.endPos.x),
              },
            ];
            const distance = frames[0].e - frames[0].s;
            for (const item of filtered) {
              if (item.type !== "BEAM" && item.type !== "CANTILEVER") continue;
              const res =
                deg === 90
                  ? item.startPos.z < el.startPos.z
                  : item.startPos.z > el.startPos.z;
              if (!res) continue;
              const newFrames: { s: number; e: number }[] = [...frames];
              for (let i = 0; i < frames.length; i++) {
                const frame = frames[i];
                const sx = Math.min(item.startPos.x, item.endPos.x);
                const ex = Math.max(item.startPos.x, item.endPos.x);
                if (checkRange(sx, frame.s, frame.e, true)) {
                  let repl = false;
                  if (sx > frame.s) {
                    newFrames.splice(i, 1, { s: frame.s, e: sx });
                    repl = true;
                  }
                  if (frame.e > ex) {
                    newFrames.splice(repl ? i + 1 : i, repl ? 0 : 1, {
                      s: ex,
                      e: frame.e,
                    });
                  } else if (!repl) newFrames.splice(i, 1);
                } else if (checkRange(frame.s, sx, ex, true)) {
                  if (frame.e > ex) {
                    newFrames.splice(i, 1, { s: ex, e: frame.e });
                  } else newFrames.splice(i, 1);
                }
              }
              frames = newFrames;
            }
            const clearD = frames.reduce((acc, item) => {
              return acc + (item.e - item.s);
            }, 0);
            if (clearD < distance / 2) continue;
          } else if (
            el.type === "KNEE-BRACING" ||
            el.type === "VERTICAL-BRACING" ||
            el.type === "STAIRCASE"
          ) {
            const res = filtered.some((item) => {
              if (
                item.type !== "KNEE-BRACING" &&
                item.type !== "VERTICAL-BRACING" &&
                item.type !== "STAIRCASE"
              )
                return false;
              return (
                ((item.startPos.y === el.startPos.y &&
                  item.endPos.y === el.endPos.y) ||
                  (item.startPos.y === el.endPos.y &&
                    item.endPos.y === el.startPos.y)) &&
                ((item.startPos.x === el.startPos.x &&
                  item.endPos.x === el.endPos.x) ||
                  (item.startPos.x === el.endPos.x &&
                    item.endPos.x === el.startPos.x)) &&
                (deg === 90
                  ? item.startPos.z < el.startPos.z
                  : item.startPos.z > el.startPos.z)
              );
            });
            if (res) continue;
          }
          selected = [...selected, el];
        }
        break;
      case 45:
        return Array.from(
          new Set([
            ...facingMembers(elements, 0),
            ...facingMembers(elements, 90),
          ])
        ).sort((a, b) => a - b);
      case 135:
        return Array.from(
          new Set([
            ...facingMembers(elements, 90),
            ...facingMembers(elements, 180),
          ])
        ).sort((a, b) => a - b);
      case 225:
        return Array.from(
          new Set([
            ...facingMembers(elements, 180),
            ...facingMembers(elements, 270),
          ])
        ).sort((a, b) => a - b);
      case 315:
        return Array.from(
          new Set([
            ...facingMembers(elements, 270),
            ...facingMembers(elements, 0),
          ])
        ).sort((a, b) => a - b);
    }
    return selected.map((el) => el.index).sort((a, b) => a - b);
  };

  const dir0 = {
    length: getLength(model, modelElements, 0),
    height,
    z: modelElements
      .filter((item) => item.startPos.x === item.endPos.x)
      .map((item) => ({
        label: item.index,
        orientation: item.orientation ?? 0,
      })),
    x: [],
    pipeZ: createPipeLevels(
      modelElements.filter(
        (item) => item.type === "PipeItem" && item.startPos.z !== item.endPos.z
      )
    ),
    pipeX: {},
    windFacingMembers: facingMembers(modelElements, 0),
  };

  const dir45 = {
    length: getLength(model, modelElements, 45),
    height,
    z: dir45Elements
      .filter((item) => item.startPos.x === item.endPos.x)
      .map((item) => ({
        label: item.index,
        orientation: item.orientation ?? 0,
      })),
    x: dir45Elements
      .filter((item) => item.startPos.z === item.endPos.z)
      .map((item) => ({
        label: item.index,
        orientation: item.orientation ?? 0,
      })),
    windFacingMembers: facingMembers(modelElements, 45),
    pipeZ: createPipeLevels(
      modelElements.filter((item) => {
        if (item.type !== "PipeItem") return false;
        if (item.startPos.y === item.endPos.y) {
          const angle = Math.abs(
            radToDeg(
              getRotationByLegs(
                item.startPos.x,
                item.startPos.z,
                item.endPos.x,
                item.endPos.z
              )
            )
          );
          return item.startPos.x !== item.endPos.x && angle !== 45;
        } else return item.startPos.x !== item.endPos.x;
      })
    ),
    pipeX: createPipeLevels(
      modelElements.filter((item) => {
        if (item.type !== "PipeItem") return false;
        if (item.startPos.y === item.endPos.y) {
          const angle = Math.abs(
            radToDeg(
              getRotationByLegs(
                item.startPos.x,
                item.startPos.z,
                item.endPos.x,
                item.endPos.z
              )
            )
          );
          return item.startPos.x !== item.endPos.x && angle !== 45;
        } else return item.startPos.x !== item.endPos.x;
      })
    ),
  };

  const dir90 = {
    length: getLength(model, modelElements, 90),
    height,
    z: [],
    x: modelElements
      .filter((item) => item.startPos.z === item.endPos.z)
      .map((item) => ({
        label: item.index,
        orientation: item.orientation ?? 0,
      })),
    windFacingMembers: facingMembers(modelElements, 90),
    pipeZ: {},
    pipeX: createPipeLevels(
      modelElements.filter(
        (item) => item.type === "PipeItem" && item.startPos.x !== item.endPos.x
      )
    ),
  };

  const dir135 = {
    length: getLength(model, modelElements, 135),
    height,
    z: dir135Elements
      .filter((item) => item.startPos.x === item.endPos.x)
      .map((item) => ({
        label: item.index,
        orientation: item.orientation ?? 0,
      })),
    x: dir135Elements
      .filter((item) => item.startPos.z === item.endPos.z)
      .map((item) => ({
        label: item.index,
        orientation: item.orientation ?? 0,
      })),
    windFacingMembers: facingMembers(modelElements, 135),
    pipeZ: createPipeLevels(
      modelElements.filter((item) => {
        if (item.type !== "PipeItem") return false;
        if (item.startPos.y === item.endPos.y) {
          const angle = Math.abs(
            radToDeg(
              getRotationByLegs(
                item.startPos.x,
                item.startPos.z,
                item.endPos.x,
                item.endPos.z
              )
            )
          );
          return item.startPos.x !== item.endPos.x && angle !== 45;
        } else return item.startPos.x !== item.endPos.x;
      })
    ),
    pipeX: createPipeLevels(
      modelElements.filter((item) => {
        if (item.type !== "PipeItem") return false;
        if (item.startPos.y === item.endPos.y) {
          const angle = Math.abs(
            radToDeg(
              getRotationByLegs(
                item.startPos.x,
                item.startPos.z,
                item.endPos.x,
                item.endPos.z
              )
            )
          );
          return item.startPos.x !== item.endPos.x && angle !== 45;
        } else return item.startPos.x !== item.endPos.x;
      })
    ),
  };

  const dir180 = {
    length: getLength(model, modelElements, 180),
    height,
    z: modelElements
      .filter((item) => item.startPos.x === item.endPos.x)
      .map((item) => ({
        label: item.index,
        orientation: item.orientation ?? 0,
      })),
    x: [],
    windFacingMembers: facingMembers(modelElements, 180),
    pipeZ: createPipeLevels(
      modelElements.filter(
        (item) => item.type === "PipeItem" && item.startPos.z !== item.endPos.z
      )
    ),
    pipeX: {},
  };

  const dir225 = {
    length: getLength(model, modelElements, 225),
    height,
    z: dir225Elements
      .filter((item) => item.startPos.x === item.endPos.x)
      .map((item) => ({
        label: item.index,
        orientation: item.orientation ?? 0,
      })),
    x: dir225Elements
      .filter((item) => item.startPos.z === item.endPos.z)
      .map((item) => ({
        label: item.index,
        orientation: item.orientation ?? 0,
      })),
    windFacingMembers: facingMembers(modelElements, 225),
    pipeZ: createPipeLevels(
      modelElements.filter((item) => {
        if (item.type !== "PipeItem") return false;
        if (item.startPos.y === item.endPos.y) {
          const angle = Math.abs(
            radToDeg(
              getRotationByLegs(
                item.startPos.x,
                item.startPos.z,
                item.endPos.x,
                item.endPos.z
              )
            )
          );
          return item.startPos.x !== item.endPos.x && angle !== 45;
        } else return item.startPos.x !== item.endPos.x;
      })
    ),
    pipeX: createPipeLevels(
      modelElements.filter((item) => {
        if (item.type !== "PipeItem") return false;
        if (item.startPos.y === item.endPos.y) {
          const angle = Math.abs(
            radToDeg(
              getRotationByLegs(
                item.startPos.x,
                item.startPos.z,
                item.endPos.x,
                item.endPos.z
              )
            )
          );
          return item.startPos.x !== item.endPos.x && angle !== 45;
        } else return item.startPos.x !== item.endPos.x;
      })
    ),
  };

  const dir270 = {
    length: getLength(model, modelElements, 270),
    height,
    z: [],
    x: modelElements
      .filter((item) => item.startPos.z === item.endPos.z)
      .map((item) => ({
        label: item.index,
        orientation: item.orientation ?? 0,
      })),
    windFacingMembers: facingMembers(modelElements, 270),
    pipeZ: {},
    pipeX: createPipeLevels(
      modelElements.filter(
        (item) => item.type === "PipeItem" && item.startPos.x !== item.endPos.x
      )
    ),
  };

  const dir315 = {
    length: getLength(model, modelElements, 315),
    height,
    z: dir315Elements
      .filter((item) => item.startPos.x === item.endPos.x)
      .map((item) => ({
        label: item.index,
        orientation: item.orientation ?? 0,
      })),
    x: dir315Elements
      .filter((item) => item.startPos.z === item.endPos.z)
      .map((item) => ({
        label: item.index,
        orientation: item.orientation ?? 0,
      })),
    windFacingMembers: facingMembers(modelElements, 315),
    pipeZ: createPipeLevels(
      modelElements.filter((item) => {
        if (item.type !== "PipeItem") return false;
        if (item.startPos.y === item.endPos.y) {
          const angle = Math.abs(
            radToDeg(
              getRotationByLegs(
                item.startPos.x,
                item.startPos.z,
                item.endPos.x,
                item.endPos.z
              )
            )
          );
          return item.startPos.x !== item.endPos.x && angle !== 45;
        } else return item.startPos.x !== item.endPos.x;
      })
    ),
    pipeX: createPipeLevels(
      modelElements.filter((item) => {
        if (item.type !== "PipeItem") return false;
        if (item.startPos.y === item.endPos.y) {
          const angle = Math.abs(
            radToDeg(
              getRotationByLegs(
                item.startPos.x,
                item.startPos.z,
                item.endPos.x,
                item.endPos.z
              )
            )
          );
          return item.startPos.x !== item.endPos.x && angle !== 45;
        } else return item.startPos.x !== item.endPos.x;
      })
    ),
  };

  return {
    countryCode: loadings.windLoadingAsPerCode,
    manual:
      loadings.manualWindCode?.map((item) => ({
        height: item.height,
        pressure: item.pressure,
      })) ?? [],
    isWindCode: {
      ...loadings.isWindCode,
      datumElevation: loadings.isWindCode.datumElevation ?? 0,
    },
    usWindCode: {
      ...loadings.usWindCode,
      datumElevation: loadings.usWindCode.datumElevation ?? 0,
    },
    euWindCode: loadings.euWindCode,
    additionalLoad: { udl: {}, pointLoad: {} },
    dir0,
    dir45,
    dir90,
    dir135,
    dir180,
    dir225,
    dir270,
    dir315,
  };
}

export function getASL_OF(asl?: DataState) {
  const mapped = asl?.profileSectionData.map((profile) => {
    return {
      countryCode: profile.country_code,
      profileName: profile.name,
      profileType: profile.designation,
    };
  });
  return mapped ?? [];
}
