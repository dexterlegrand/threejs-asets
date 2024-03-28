import {
  FreePipe,
  Project,
  Orientation,
  TFlangeType,
  PipeConnectorType,
  TLongWeldType,
  TSupportDetail,
  LoadType,
} from "../../store/main/types";
import { Mesh, Vector3, CylinderBufferGeometry, Vector2, Scene } from "three";
import {
  deg90InRad,
  deg180InRad,
  initPipingLoad,
  initPipeDesignCode,
} from "../../store/main/constants";
import {
  getPosByDistance,
  MtoMM,
  radToDeg,
  getRotationByLegs,
  roundVectorM,
  fixValueToNumber,
  replaceSplitNumber,
  checkRange,
  roundM,
} from "./utils";
import { PipeProfile, Material } from "../../store/data/types";
import {
  TPipeAdditionalLoad,
  TPipeLoadings,
  TPipeSlugLoad,
  TPipeDeadLoad,
  TPipeWindLoad,
  TPipeSeismicLoads,
  TPipeLoadCombination,
} from "../../store/main/pipeTypes";
import { isArray } from "util";
import {
  createJSONElbow,
  createJSONReturn,
  createJSONReducer,
  createJSONTee,
} from "./pipes/pipesUtils";

type Node = {
  nodeNumber: number;
  x: number;
  y: number;
  z: number;
  memberNames: string; // all members that are connected with this node
};

type BeamElement = {
  id: string;
  type: string;
  bwe: any;
  bcsm: any;
  bwsm: any;
  tw: any;
  trf: any;
  turf: any;
  tew: any;
  twci: any;
  tbwf: any;
  temperaturePressure: {
    t1: number | null;
    t2: number | null;
    t3: number | null;
    t4: number | null;
    t5: number | null;
    p1: number | null;
    hp: number | null;
  };
  label: number;
  nodes: number[];
  bodyLoads: string[];
  boundaryLoads: any[];
  section: number;
  zAxis: number[];
  beamHinges: boolean[];
};

type BeamNode = {
  label: number;
  coordinates: number[];
  loads: [];
  boundaryConditionsOne: string;
  restraints: any[];
  masterNode: number | null;
};

type Member = {
  label: number;
  name: string;
  type: "Pipe";
  nps: string | null;
  countryCode: string | null;
  schedule: string | null;
  length: number;
  longWeldType: TLongWeldType;
  corrosionAllowance: number;
  millTolerance: number;
  pipeouterdiameter: number | null;
  pipewallthickness: number | null;
  pipematerialId: number | null;
  pipematerialName: string | null;
};

function getPipes(project: Project, pipes: FreePipe[]) {
  const discretization = project.pipeDesignCode?.discretizationLengthLimit ?? 1;

  const newPipes: FreePipe[] = pipes.reduce((acc: FreePipe[], p) => {
    const pipe = acc.find((val) => val.id === p.id);
    if (pipe?.params.endConnector) {
      const next = acc.find((p) => p.preceding === pipe.pipe);
      if (!next) return acc;
      if (pipe.params.endConnectorType === "Elbow") {
        return createJSONElbow(acc, pipe, next);
      } else if (pipe.params.endConnectorType === "Return") {
        return createJSONReturn(acc, pipe, next);
      } else if (pipe.params.endConnectorType === "Reducer") {
        return createJSONReducer(acc, pipe, next);
      } else if (pipe.params.endConnectorType === "Tee") {
        return createJSONTee(acc, pipe);
      }
    }
    return acc;
  }, pipes);

  let supId = 0;
  const pipeItems: any[] = [];
  newPipes.sort((a, b) => {
    // sort pipes from start to end pipe line
    if (a.pipe === b.preceding) return -1;
    if (b.pipe === a.preceding) return 1;
    return -1;
  });
  newPipes.forEach((pipe) => {
    const sp = roundVectorM(new Vector3(pipe.x1, pipe.y1, pipe.z1));
    const ep = roundVectorM(new Vector3(pipe.x2, pipe.y2, pipe.z2));
    const pipeL = roundM(sp.distanceTo(ep));

    let index = 1;
    let points: Vector3[] = [sp];

    const supports: { key: string; sup: TSupportDetail }[] = [];

    // getting support beams
    pipe.params.supportDetails?.forEach((sup) => {
      if (sup.type === "Slave Node") {
        const master = pipes.find(
          (p) => p.line === pipe.line && p.pipe === sup.masterNodePipe
        );
        if (master) {
          const pos = roundVectorM(getPosByDistance(sup.distance, sp, ep));
          const masterNodePos = roundVectorM(
            getPosByDistance(
              sup.masterNodeDist ?? 0,
              new Vector3(master.x1, master.y1, master.z1),
              new Vector3(master.x2, master.y2, master.z2)
            )
          );
          supports.push({
            key: `${pos.x}|${pos.y}|${pos.z}`,
            sup: { ...sup, supId: supId++, masterNodePos } as any,
          });
          points = [...points, pos];
        }
      } else {
        const pos = roundVectorM(getPosByDistance(sup.distance, sp, ep));
        supports.push({
          key: `${pos.x}|${pos.y}|${pos.z}`,
          sup: { ...sup, supId: supId++ } as any,
        });
        points = [...points, pos];
      }
    });

    pipes
      .filter((p) => p.line === pipe.line && p.id !== pipe.id)
      .forEach((p) => {
        p.params.supportDetails?.forEach((sup) => {
          if (sup.type === "Slave Node" && sup.masterNodePipe === pipe.pipe) {
            const pos = roundVectorM(
              getPosByDistance(sup.masterNodeDist ?? 0, sp, ep)
            );
            points = [...points, pos];
          }
        });
      });

    const DLParams = getAdditionalLoadsParams(
      "deadLoad",
      project.pipeLoadings,
      pipe,
      sp,
      ep,
      points
    );
    const WLParams = getAdditionalLoadsParams(
      "windLoad",
      project.pipeLoadings,
      pipe,
      sp,
      ep,
      points
    );

    // create pipe items
    points = [...points, ep]
      .reduce(
        (acc, v) => (!acc.some((el) => el.equals(v)) ? [...acc, v] : acc),
        [] as Vector3[]
      )
      .sort((a, b) =>
        a.x === b.x ? (a.y === b.y ? a.z - b.z : a.y - b.y) : a.x - b.x
      );

    if ((pipe as any).isNotPipe) {
      const sDistance = roundM(sp.distanceTo(ep));
      const startSupp = supports
        .filter((sup) => sup.key === `${sp.x}|${sp.y}|${sp.z}`)
        .map((sup) => sup.sup);
      const endSupp = supports
        .filter((sup) => sup.key === `${ep.x}|${ep.y}|${ep.z}`)
        .map((sup) => sup.sup);
      pipeItems.push({
        line: pipe.line,
        name: `${pipe.pipe}`,
        startPos: sp.clone(),
        endPos: ep.clone(),
        diameter: pipe.params.od ?? 0,
        thickness: pipe.params.thickness ?? 0,
        params: {
          ...pipe.params,
          valveType: undefined,
          valvePosition: undefined,
          valveActuator: undefined,
          valveControl: undefined,
        },
        type: (pipe as any).isElbow
          ? pipe.params.endConnectorDetails?.type ?? "BWE"
          : (pipe as any).isTee
          ? pipe.params.endConnectorDetails?.type ?? "TW"
          : "PST",
        isNotPipe: true,
        isElbow: (pipe as any).isElbow,
        isTee: (pipe as any).isTee,
        elId: (pipe as any).elId ?? "PST",
        startSupp,
        endSupp,
        deadLoadPointS: DLParams.loadPoints.includes(0) ? 0 : undefined,
        deadLoadPointE: DLParams.loadPoints.includes(sDistance)
          ? sDistance
          : undefined,
        windLoadPointS: WLParams.loadPoints.includes(0) ? 0 : undefined,
        windLoadPointE: WLParams.loadPoints.includes(sDistance)
          ? sDistance
          : undefined,
      });
    } else {
      for (let i = 0; i < points.length; i++) {
        const point = points[i];
        const nextPoint = points[i + 1];
        if (nextPoint === undefined) break;
        const start = point.clone();
        const end = nextPoint.clone();
        let distance = roundM(start.distanceTo(end));
        let x = point.x;
        let y = point.y;
        let z = point.z;
        let sDistance = 0;
        while (distance > 0) {
          const length = distance > discretization ? discretization : distance;
          const prevDistance = sDistance;
          sDistance = roundM(sDistance + length);
          const startPos = new Vector3(x, y, z);
          const pos =
            distance > discretization
              ? roundVectorM(
                  getPosByDistance(
                    start.distanceTo(startPos) + length,
                    start,
                    end
                  )
                )
              : end.clone();
          const startSupp = supports
            .filter(
              (sup) => sup.key === `${startPos.x}|${startPos.y}|${startPos.z}`
            )
            .map((sup) => sup.sup);
          const endSupp = supports
            .filter((sup) => sup.key === `${pos.x}|${pos.y}|${pos.z}`)
            .map((sup) => sup.sup);
          const fsts = roundM(sp.distanceTo(startPos));
          const fste = roundM(sp.distanceTo(pos));
          let valveInfo = {
            valveType: undefined,
            valvePosition: undefined,
            valveActuator: undefined,
            valveControl: undefined,
            valvePositionPoint: new Vector3(),
          };
          if (pipe.params.valveType) {
            if (
              pipe.params.valvePosition === "START" ||
              pipe.params.valvePosition === 0
            ) {
              if (!prevDistance) {
                valveInfo = {
                  valveType: pipe.params.valveType as any,
                  valvePosition: pipe.params.valvePosition as any,
                  valveActuator: pipe.params.valveActuator as any,
                  valveControl: pipe.params.valveControl as any,
                  valvePositionPoint: roundVectorM(
                    new Vector3(
                      MtoMM(startPos.x),
                      MtoMM(startPos.y),
                      MtoMM(startPos.z)
                    )
                  ),
                };
              }
            } else if (
              pipe.params.valvePosition === "END" ||
              pipe.params.valvePosition === pipeL
            ) {
              if (sDistance === pipeL) {
                valveInfo = {
                  valveType: pipe.params.valveType as any,
                  valvePosition: pipe.params.valvePosition as any,
                  valveActuator: pipe.params.valveActuator as any,
                  valveControl: pipe.params.valveControl as any,
                  valvePositionPoint: roundVectorM(
                    new Vector3(MtoMM(pos.x), MtoMM(pos.y), MtoMM(pos.z))
                  ),
                };
              }
            } else if (pipe.params.valvePosition) {
              if (
                checkRange(
                  pipe.params.valvePosition as number,
                  prevDistance,
                  sDistance,
                  true
                )
              ) {
                valveInfo = {
                  valveType: pipe.params.valveType as any,
                  valvePosition: pipe.params.valvePosition as any,
                  valveActuator: pipe.params.valveActuator as any,
                  valveControl: pipe.params.valveControl as any,
                  valvePositionPoint: new Vector3(),
                };
              }
            }
          }
          pipeItems.push({
            line: pipe.line,
            name: `${pipe.pipe}.${index}`,
            startPos: startPos.clone(),
            endPos: pos.clone(),
            diameter: pipe.params.od ?? 0,
            thickness: pipe.params.thickness ?? 0,
            params: {
              ...pipe.params,
              valveType: valveInfo.valveType,
              valvePosition: valveInfo.valvePosition,
              valveActuator: valveInfo.valveActuator,
              valveControl: valveInfo.valveControl,
              valvePositionPoint: valveInfo.valvePositionPoint,
            },
            type: (pipe as any).isElbow
              ? pipe.params.endConnectorDetails?.type ?? "BWE"
              : (pipe as any).isTee
              ? pipe.params.endConnectorDetails?.type ?? "TW"
              : "PST",
            isElbow: (pipe as any).isElbow,
            isTee: (pipe as any).isTee,
            elId: (pipe as any).elId ?? "PST",
            startSupp,
            endSupp,
            deadLoadPointS: DLParams.loadPoints.includes(fsts)
              ? fsts
              : undefined,
            deadLoadPointE: DLParams.loadPoints.includes(fste)
              ? fste
              : undefined,
            deadLoadUDL: DLParams.udls.find(
              (udl) => udl[0] <= fsts && udl[1] >= fste
            ),
            windLoadPointS: WLParams.loadPoints.includes(fsts)
              ? fsts
              : undefined,
            windLoadPointE: WLParams.loadPoints.includes(fste)
              ? fste
              : undefined,
            windLoadUDL: WLParams.udls.find(
              (udl) => udl[0] <= fsts && udl[1] >= fste
            ),
          });
          x = pos.x;
          y = pos.y;
          z = pos.z;
          distance = roundM(distance - discretization);
          index++;
        }
      }
    }
  });
  console.log("these are the pipe items",pipeItems);
  return pipeItems;
}

function getBeamElement(
  start: number,
  end: number,
  count: number,
  zAxis: number[],
  pipeElement: any
): BeamElement {
  const label = count + 1;

  const get_tn = () => {
    if (pipeElement.params.endConnectorDetails?.tn)
      return pipeElement.params.endConnectorDetails.tn;
    if (pipeElement.params.endConnector) {
      const t =
        pipeElement.params.endConnector.t ||
        pipeElement.params.endConnector.t1 ||
        pipeElement.params.endConnector.t2;
      return t ? t : 0;
    }
    return 0;
  };

  const get_r = () => {
    if (pipeElement.params.endConnectorDetails?.r)
      return pipeElement.params.endConnectorDetails.r;
    if (pipeElement.params.endConnector) {
      const d =
        pipeElement.params.endConnector.d ||
        pipeElement.params.endConnector.d1 ||
        pipeElement.params.endConnector.d2;
      return d ? d / 2 : 0;
    }
    return 0;
  };

  let res = {
    id: pipeElement.elId,
    type: pipeElement.type,
    label,
    nodes: [start, end],
    bwe: {},
    bcsm: {},
    bwsm: {},
    tw: {},
    trf: {},
    turf: {},
    tew: {},
    twci: {},
    tbwf: {},
    temperaturePressure: {
      t1: pipeElement.params.T1 ?? null,
      t2: pipeElement.params.T2 ?? null,
      t3: pipeElement.params.T3 ?? null,
      t4: pipeElement.params.T4 ?? null,
      t5: pipeElement.params.T5 ?? null,
      p1: pipeElement.params.P1 ?? null,
      hp: pipeElement.params.HP ?? null,
    },
    bodyLoads: ["DeadWeight"],
    boundaryLoads: [],
    section: label,
    zAxis,
    beamHinges: pipeElement.releases
      ? [
          !!pipeElement.releases.fx1,
          !!pipeElement.releases.fy1,
          !!pipeElement.releases.fz1,
          !!pipeElement.releases.mx1,
          !!pipeElement.releases.my1,
          !!pipeElement.releases.mz1,
          !!pipeElement.releases.fx2,
          !!pipeElement.releases.fy2,
          !!pipeElement.releases.fz2,
          !!pipeElement.releases.mx2,
          !!pipeElement.releases.my2,
          !!pipeElement.releases.mz2,
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
  switch (pipeElement.type) {
    case "BWE":
      {
        const tn = get_tn();
        const ar = pipeElement.params.endConnectorDetails?.R ?? 0;
        const pr = get_r();
        const ia = pipeElement.params.connectorDegree ?? 0;
        res = { ...res, bwe: { tn, ar, pr, ia } };
      }
      break;
    case "BCSM":
      {
        const tn = get_tn();
        const pr = get_r();
        const ar = pipeElement.params.endConnectorDetails?.R ?? 0;
        const s = pipeElement.params.endConnectorDetails?.S ?? 0;
        const theta = pipeElement.params.endConnectorDetails?.Theta ?? 0;
        const ia = pipeElement.params.connectorDegree ?? 0;
        res = { ...res, bcsm: { tn, ar, pr, ia, s, theta } };
      }
      break;
    case "BWSM":
      {
        const tn = get_tn();
        const pr = get_r();
        const ar = pipeElement.params.endConnectorDetails?.R ?? 0;
        const s = pipeElement.params.endConnectorDetails?.S ?? 0;
        const theta = pipeElement.params.endConnectorDetails?.Theta ?? 0;
        const ia = pipeElement.params.connectorDegree ?? 0;
        res = { ...res, bcsm: { tn, ar, pr, ia, s, theta } };
      }
      break;
    case "TW":
      {
        const tn = get_tn();
        const pr = get_r();
        res = { ...res, tw: { tn, pr } };
      }
      break;
    case "TRF":
      {
        const tn = get_tn();
        const tr = pipeElement.params.endConnectorDetails?.tr ?? 0;
        const pr = get_r();
        res = { ...res, trf: { tn, tr, pr } };
      }
      break;
    case "TURF":
      {
        const tn = get_tn();
        const pr = get_r();
        res = { ...res, turf: { tn, pr } };
      }
      break;
    case "TEW":
      {
        const tn = get_tn();
        const pr = get_r();
        const tc = pipeElement.params.endConnectorDetails?.tc ?? 0;
        const rx = pipeElement.params.endConnectorDetails?.rx ?? 0;
        res = { ...res, tew: { tn, pr, tc, rx } };
      }
      break;
    case "TWCI":
      {
        const tn = get_tn();
        const pr = get_r();
        res = { ...res, twci: { tn, pr } };
      }
      break;
    case "TBWF": {
      const tn = get_tn();
      const pr = get_r();
      res = { ...res, tbwf: { tn, pr } };
    }
  }
  return res;
}

// function getBeamElement(
//   start: number,
//   end: number,
//   count: number,
//   zAxis: number[],
//   pipeElement: any
// ): BeamElement {
//   const label = count + 1;

//   const get_tn = () => {
//     if (pipeElement.params.endConnectorDetails?.tn)
//       return pipeElement.params.endConnectorDetails.tn;
//     if (pipeElement.params.endConnector) {
//       const t =
//         pipeElement.params.endConnector.t ||
//         pipeElement.params.endConnector.t1 ||
//         pipeElement.params.endConnector.t2;
//       return t ? t : 0;
//     }
//     return 0;
//   };

//   const get_r = () => {
//     if (pipeElement.params.endConnectorDetails?.r)
//       return pipeElement.params.endConnectorDetails.r;
//     if (pipeElement.params.endConnector) {
//       const d =
//         pipeElement.params.endConnector.d ||
//         pipeElement.params.endConnector.d1 ||
//         pipeElement.params.endConnector.d2;
//       return d ? d / 2 : 0;
//     }
//     return 0;
//   };

//   if (pipeElement.params.valveType){
//     let res = {
//       id: pipeElement.elId,
//       type: "VAL",
//       label,
//       nodes: [start, end],
//       bwe: {},
//       bcsm: {},
//       bwsm: {},
//       tw: {},
//       trf: {},
//       turf: {},
//       tew: {},
//       twci: {},
//       tbwf: {},
//       temperaturePressure: {
//         t1: pipeElement.params.T1 ?? null,
//         t2: pipeElement.params.T2 ?? null,
//         t3: pipeElement.params.T3 ?? null,
//         t4: pipeElement.params.T4 ?? null,
//         t5: pipeElement.params.T5 ?? null,
//         p1: pipeElement.params.P1 ?? null,
//         hp: pipeElement.params.HP ?? null,
//       },
//       bodyLoads: ["DeadWeight"],
//       boundaryLoads: [],
//       section: label,
//       zAxis,
//       beamHinges: pipeElement.releases
//         ? [
//             !!pipeElement.releases.fx1,
//             !!pipeElement.releases.fy1,
//             !!pipeElement.releases.fz1,
//             !!pipeElement.releases.mx1,
//             !!pipeElement.releases.my1,
//             !!pipeElement.releases.mz1,
//             !!pipeElement.releases.fx2,
//             !!pipeElement.releases.fy2,
//             !!pipeElement.releases.fz2,
//             !!pipeElement.releases.mx2,
//             !!pipeElement.releases.my2,
//             !!pipeElement.releases.mz2,
//           ]
//         : [
//             false,
//             false,
//             false,
//             false,
//             false,
//             false,
//             false,
//             false,
//             false,
//             false,
//             false,
//             false,
//           ],
//     };
//     switch (pipeElement.type) {
//       case "BWE":
//         {
//           const tn = get_tn();
//           const ar = pipeElement.params.endConnectorDetails?.R ?? 0;
//           const pr = get_r();
//           const ia = pipeElement.params.connectorDegree ?? 0;
//           res = { ...res, bwe: { tn, ar, pr, ia } };
//         }
//         break;
//       case "BCSM":
//         {
//           const tn = get_tn();
//           const pr = get_r();
//           const ar = pipeElement.params.endConnectorDetails?.R ?? 0;
//           const s = pipeElement.params.endConnectorDetails?.S ?? 0;
//           const theta = pipeElement.params.endConnectorDetails?.Theta ?? 0;
//           const ia = pipeElement.params.connectorDegree ?? 0;
//           res = { ...res, bcsm: { tn, ar, pr, ia, s, theta } };
//         }
//         break;
//       case "BWSM":
//         {
//           const tn = get_tn();
//           const pr = get_r();
//           const ar = pipeElement.params.endConnectorDetails?.R ?? 0;
//           const s = pipeElement.params.endConnectorDetails?.S ?? 0;
//           const theta = pipeElement.params.endConnectorDetails?.Theta ?? 0;
//           const ia = pipeElement.params.connectorDegree ?? 0;
//           res = { ...res, bcsm: { tn, ar, pr, ia, s, theta } };
//         }
//         break;
//       case "TW":
//         {
//           const tn = get_tn();
//           const pr = get_r();
//           res = { ...res, tw: { tn, pr } };
//         }
//         break;
//       case "TRF":
//         {
//           const tn = get_tn();
//           const tr = pipeElement.params.endConnectorDetails?.tr ?? 0;
//           const pr = get_r();
//           res = { ...res, trf: { tn, tr, pr } };
//         }
//         break;
//       case "TURF":
//         {
//           const tn = get_tn();
//           const pr = get_r();
//           res = { ...res, turf: { tn, pr } };
//         }
//         break;
//       case "TEW":
//         {
//           const tn = get_tn();
//           const pr = get_r();
//           const tc = pipeElement.params.endConnectorDetails?.tc ?? 0;
//           const rx = pipeElement.params.endConnectorDetails?.rx ?? 0;
//           res = { ...res, tew: { tn, pr, tc, rx } };
//         }
//         break;
//       case "TWCI":
//         {
//           const tn = get_tn();
//           const pr = get_r();
//           res = { ...res, twci: { tn, pr } };
//         }
//         break;
//       case "TBWF": {
//         const tn = get_tn();
//         const pr = get_r();
//         res = { ...res, tbwf: { tn, pr } };
//       }
//     }
//     return res;
//   }else{

//   let res = {
//     id: pipeElement.elId,
//     type: pipeElement.type,
//     label,
//     nodes: [start, end],
//     bwe: {},
//     bcsm: {},
//     bwsm: {},
//     tw: {},
//     trf: {},
//     turf: {},
//     tew: {},
//     twci: {},
//     tbwf: {},
//     temperaturePressure: {
//       t1: pipeElement.params.T1 ?? null,
//       t2: pipeElement.params.T2 ?? null,
//       t3: pipeElement.params.T3 ?? null,
//       t4: pipeElement.params.T4 ?? null,
//       t5: pipeElement.params.T5 ?? null,
//       p1: pipeElement.params.P1 ?? null,
//       hp: pipeElement.params.HP ?? null,
//     },
//     bodyLoads: ["DeadWeight"],
//     boundaryLoads: [],
//     section: label,
//     zAxis,
//     beamHinges: pipeElement.releases
//       ? [
//           !!pipeElement.releases.fx1,
//           !!pipeElement.releases.fy1,
//           !!pipeElement.releases.fz1,
//           !!pipeElement.releases.mx1,
//           !!pipeElement.releases.my1,
//           !!pipeElement.releases.mz1,
//           !!pipeElement.releases.fx2,
//           !!pipeElement.releases.fy2,
//           !!pipeElement.releases.fz2,
//           !!pipeElement.releases.mx2,
//           !!pipeElement.releases.my2,
//           !!pipeElement.releases.mz2,
//         ]
//       : [
//           false,
//           false,
//           false,
//           false,
//           false,
//           false,
//           false,
//           false,
//           false,
//           false,
//           false,
//           false,
//         ],
//   };
//   switch (pipeElement.type) {
//     case "BWE":
//       {
//         const tn = get_tn();
//         const ar = pipeElement.params.endConnectorDetails?.R ?? 0;
//         const pr = get_r();
//         const ia = pipeElement.params.connectorDegree ?? 0;
//         res = { ...res, bwe: { tn, ar, pr, ia } };
//       }
//       break;
//     case "BCSM":
//       {
//         const tn = get_tn();
//         const pr = get_r();
//         const ar = pipeElement.params.endConnectorDetails?.R ?? 0;
//         const s = pipeElement.params.endConnectorDetails?.S ?? 0;
//         const theta = pipeElement.params.endConnectorDetails?.Theta ?? 0;
//         const ia = pipeElement.params.connectorDegree ?? 0;
//         res = { ...res, bcsm: { tn, ar, pr, ia, s, theta } };
//       }
//       break;
//     case "BWSM":
//       {
//         const tn = get_tn();
//         const pr = get_r();
//         const ar = pipeElement.params.endConnectorDetails?.R ?? 0;
//         const s = pipeElement.params.endConnectorDetails?.S ?? 0;
//         const theta = pipeElement.params.endConnectorDetails?.Theta ?? 0;
//         const ia = pipeElement.params.connectorDegree ?? 0;
//         res = { ...res, bcsm: { tn, ar, pr, ia, s, theta } };
//       }
//       break;
//     case "TW":
//       {
//         const tn = get_tn();
//         const pr = get_r();
//         res = { ...res, tw: { tn, pr } };
//       }
//       break;
//     case "TRF":
//       {
//         const tn = get_tn();
//         const tr = pipeElement.params.endConnectorDetails?.tr ?? 0;
//         const pr = get_r();
//         res = { ...res, trf: { tn, tr, pr } };
//       }
//       break;
//     case "TURF":
//       {
//         const tn = get_tn();
//         const pr = get_r();
//         res = { ...res, turf: { tn, pr } };
//       }
//       break;
//     case "TEW":
//       {
//         const tn = get_tn();
//         const pr = get_r();
//         const tc = pipeElement.params.endConnectorDetails?.tc ?? 0;
//         const rx = pipeElement.params.endConnectorDetails?.rx ?? 0;
//         res = { ...res, tew: { tn, pr, tc, rx } };
//       }
//       break;
//     case "TWCI":
//       {
//         const tn = get_tn();
//         const pr = get_r();
//         res = { ...res, twci: { tn, pr } };
//       }
//       break;
//     case "TBWF": {
//       const tn = get_tn();
//       const pr = get_r();
//       res = { ...res, tbwf: { tn, pr } };
//     }
//   }
//   return res;
// }
  
// }

function getMember(
  label: number,
  name: string,
  longWeldType: TLongWeldType,
  corrosionAllowance: number,
  millTolerance: number,
  profile: PipeProfile | undefined,
  length: number,
  pipeouterdiameter?: number,
  pipewallthickness?: number,
  pipematerial?: Material
): Member {
  return {
    label,
    name,
    type: "Pipe",
    longWeldType,
    corrosionAllowance,
    millTolerance,
    nps: profile?.nominal_pipe_size_inch ?? null,
    countryCode: profile?.country_code ?? null,
    schedule: profile?.schedule ?? null,
    length: MtoMM(length),
    pipeouterdiameter: pipeouterdiameter ?? null,
    pipewallthickness: pipewallthickness ?? null,
    pipematerialId: pipematerial?.material_id ?? null,
    pipematerialName: pipematerial?.material_name ?? null,
  };
}

function sortByMiddlePoint(a: any, b: any) {
  const A = new Vector3().addVectors(a.endPos, a.startPos).divideScalar(2);
  const B = new Vector3().addVectors(b.endPos, b.startPos).divideScalar(2);
  return A.y === B.y ? (A.z === B.z ? A.x - B.x : A.z - B.z) : A.y - B.y;
}

function getAdditionalLoadsParams(
  load: "deadLoad" | "windLoad",
  loadings: TPipeLoadings,
  element: FreePipe,
  start: Vector3,
  end: Vector3,
  points: Vector3[]
) {
  const udls: number[][] = [];
  const loadPoints: number[] = [];
  const loads = loadings[load] ?? initPipingLoad[load];
  const elementLoads =
    loads.loads?.filter((elLoad) => elLoad.element === element.pipe) ?? [];
  for (const elementLoad of elementLoads) {
    if (elementLoad.lengthOfUDL) {
      const pos1 = elementLoad.distance
        ? roundVectorM(getPosByDistance(elementLoad.distance, start, end))
        : start;
      const pos2 =
        elementLoad.distance + elementLoad.lengthOfUDL
          ? roundVectorM(
              getPosByDistance(
                elementLoad.distance + elementLoad.lengthOfUDL,
                start,
                end
              )
            )
          : start;
      if (!points.some((point) => point.equals(pos1))) points.push(pos1);
      if (!points.some((point) => point.equals(pos2))) points.push(pos2);
      udls.push([
        elementLoad.distance,
        elementLoad.distance + elementLoad.lengthOfUDL,
      ]);
    } else {
      const pos1 = elementLoad.distance
        ? roundVectorM(getPosByDistance(elementLoad.distance, start, end))
        : start;
      if (!points.some((point) => point.equals(pos1))) points.push(pos1);
      loadPoints.push(elementLoad.distance);
    }
  }
  return { udls, loadPoints };
}

function getPointLoad(
  pointLoad: any,
  node: Node,
  load: TPipeAdditionalLoad,
  lineNo?: string
) {
  const nodeLoad = pointLoad[node.nodeNumber];
  if (nodeLoad) {
    const newLoad = getLoad(load);
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

function getUDL(udl: any, beamElement: BeamElement, load: TPipeAdditionalLoad) {
  const elementLoad = udl[beamElement.label];
  if (elementLoad) {
    const newLoad = getLoad(load);
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

function getLoad(load: TPipeAdditionalLoad) {
  return {
    fx: load.Fx ?? 0,
    fy: load.Fy ?? 0,
    fz: load.Fz ?? 0,
    mx: load.Mx ?? 0,
    my: load.My ?? 0,
    mz: load.Mz ?? 0,
  };
}

export function getPipeAnalysisJSON(
  project: Project,
  pipes: FreePipe[],
  lcs: TPipeLoadCombination[],
  scene: Scene
) {
  let nodes: Node[] = [];
  const beamElements: BeamElement[] = [];
  const members: Member[] = [];
  const beamNodes: BeamNode[] = [];
  const deadLoadsElements: number[] = [];
  const windLoadsElements: number[] = [];

  // const pipesElements = getPipes(project, pipes)
  //   .map((el) => ({
  //     ...el,
  //     startPos: roundVectorM(el.startPos),
  //     endPos: roundVectorM(el.endPos),
  //   }))
  //   .sort((a, b) => sortByMiddlePoint(a, b));
  const pipesElements = getPipes(project, pipes)
    .map(el => ({
        ...el,
        startPos: roundVectorM(el.startPos),
        endPos: roundVectorM(el.endPos),
    }))
    .sort((a, b) => sortByMiddlePoint(a, b))
    .reduce((acc, el) => {
        if (el.params && el.params.valveType) {
            console.log("Found a pipe element with a valve:", el);
            const valveLength = el.params.valveLength;
            let splitStart, splitEnd;
            if (el.params.valvePosition.toUpperCase() === 'START') {
                splitStart = el.startPos.clone(); 
                splitEnd = el.startPos.clone().add(el.endPos.clone().sub(el.startPos).normalize().multiplyScalar(valveLength));
            } else if (el.params.valvePosition.toUpperCase() === 'END') {
                splitEnd = el.endPos.clone(); 
                splitStart = el.endPos.clone().sub(el.endPos.clone().sub(el.startPos).normalize().multiplyScalar(valveLength));
            } else {
                console.error("Invalid valve position:", el.params.valvePosition);
                return acc.concat(el); 
            }
            const segmentBeforeValve = { ...el, endPos: roundVectorM(splitEnd) };
            const segmentAfterValve = { ...el, startPos: roundVectorM(splitEnd), type: "VAL" };
            return acc.concat([segmentBeforeValve, segmentAfterValve]);
        } else {
            return acc.concat(el);
        }
    }, []);

console.log("new pipe elements", pipesElements);



    
  const pipeVectors: Vector3[] = [];
  pipesElements.forEach((el) => {
    if (!pipeVectors.some((v) => v.equals(el.startPos)))
      pipeVectors.push(roundVectorM(el.startPos.clone()));
    if (!pipeVectors.some((v) => v.equals(el.endPos)))
      pipeVectors.push(roundVectorM(el.endPos.clone()));
  });

  pipeVectors
    .sort((a, b) =>
      a.y === b.y ? (a.z === b.z ? a.x - b.x : a.z - b.z) : a.y - b.y
    )
    .forEach((v) => {
      const x = MtoMM(v.x);
      const y = MtoMM(v.y);
      const z = MtoMM(v.z);
      nodes.push({ nodeNumber: nodes.length + 1, x, y, z, memberNames: "" });
    });

  const supportsIDs: number[] = [];

  for (const node of nodes) {
    const v = new Vector3(node.x, node.y, node.z);
    const vM = roundVectorM(v.clone().divideScalar(1000));
    const pElement = pipesElements.find(
      (pe) =>
        (pe.startPos.equals(vM) || pe.endPos.equals(vM)) &&
        (pe.startSupp.length || pe.endSupp.length)
    );
    const supp = pElement
      ? vM.equals(pElement.startPos)
        ? pElement.startSupp
        : pElement.endSupp
      : undefined;
    const supType =
      supp && supp?.length
        ? supp[0].type?.includes("Custom")
          ? "Custom"
          : supp[0].type
        : "";
    let masterNode = null;
    if (supType === "Slave Node") {
      const mv = supp[0].masterNodePos;
      if (mv) {
        const x = MtoMM(mv.x);
        const y = MtoMM(mv.y);
        const z = MtoMM(mv.z);
        const mn = nodes.find((n) => n.x === x && n.y === y && n.z === z);
        if (mn) masterNode = mn.nodeNumber;
      }
    }
    const restraints: any[] = [];
    if (isArray(supp)) {
      for (const sup of supp) {
        if (!supportsIDs.includes(sup.supId)) {
          supportsIDs.push(sup.supId);
        } else continue;
        if (
          (supType === "Custom" && sup.type.includes(supType)) ||
          sup.type === supType
        ) {
          restraints.push({
            type: sup.type === "Hanger" ? "Custom" : sup.type,
            direction: sup.direction,
            subType: sup.valueType,
            Kx: sup.valueType === "K" ? sup.x ?? null : null,
            Ky: sup.valueType === "K" ? sup.y ?? null : null,
            Kz: sup.valueType === "K" ? sup.z ?? null : null,
            KMx: sup.valueType === "K" ? sup.Rx ?? null : null,
            KMy: sup.valueType === "K" ? sup.Ry ?? null : null,
            KMz: sup.valueType === "K" ? sup.Rz ?? null : null,
            dx_allow: sup.valueType === "δ allow." ? sup.x ?? null : null,
            dy_allow: sup.valueType === "δ allow." ? sup.y ?? null : null,
            dz_allow: sup.valueType === "δ allow." ? sup.z ?? null : null,
            rx_allow: sup.valueType === "δ allow." ? sup.Rx ?? null : null,
            ry_allow: sup.valueType === "δ allow." ? sup.Ry ?? null : null,
            rz_allow: sup.valueType === "δ allow." ? sup.Rz ?? null : null,
            dx_appl: sup.valueType === "δ appl." ? sup.x ?? null : null,
            dy_appl: sup.valueType === "δ appl." ? sup.y ?? null : null,
            dz_appl: sup.valueType === "δ appl." ? sup.z ?? null : null,
            rx_appl: sup.valueType === "δ appl." ? sup.Rx ?? null : null,
            ry_appl: sup.valueType === "δ appl." ? sup.Ry ?? null : null,
            rz_appl: sup.valueType === "δ appl." ? sup.Rz ?? null : null,
            frictionCoefficient: sup.Mu,
          });
        }
      }
    }
    beamNodes.push({
      label: node.nodeNumber,
      coordinates: [v.x, v.y, v.z],
      loads: [],
      boundaryConditionsOne: supType === "Hanger" ? "Custom" : supType,
      restraints,
      masterNode: masterNode,
    });
  }

  const isLines =
    Array.from(new Set(pipes.map((pipe) => pipe.line))).length > 1;
  const lineNo = pipes[0]?.line ? `${pipes[0].line}` : "";

  const windLoads = getElementsForWindLoads(
    project.pipeLoadings?.windLoad ?? initPipingLoad.windLoad,
    pipesElements
  );
  const seismicData = getSeismicData(
    isLines ? lineNo : "ALL",
    project.pipeLoadings?.seismicLoads ?? initPipingLoad.seismicLoads
  );
  const loadCombinations = parseLoadCombinations(lcs);
  const deadLoad = getDeadLoad(project.pipeLoadings?.deadLoad);

  const nodesMap = new Map<number, Node[]>();
  const beamElementsMap = new Map<number, BeamElement[]>();
  const beamNodesMap = new Map<number, BeamNode[]>();
  const membersMap = new Map<number, Member[]>();

  pipesElements.forEach((item) => {
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
            ? `${node1!.memberNames},${item.name}`
            : item.name,
        } as Node;
      } else if (node.nodeNumber === node2!.nodeNumber) {
        return {
          ...node2,
          memberNames: node2!.memberNames
            ? `${node2!.memberNames},${item.name}`
            : item.name,
        } as Node;
      } else return node;
    });

    const zAxis = new Vector3();

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

    const beamElement = getBeamElement(
      node1!.nodeNumber,
      node2!.nodeNumber,
      beamElements.length,
      [zAxis.x, zAxis.y, zAxis.z],
      item
    );

    beamElements[beamElement.label - 1] = beamElement;

    const member = getMember(
      beamElement.label,
      item.name,
      item.params.longWeldType,
      item.params.corrosionAllowance,
      item.params.millTolerance,
      item.params.profile,
      item.startPos.distanceTo(item.endPos),
      item.diameter,
      item.thickness,
      item.params.material
    );

    members.push(member);

    let lineNodes = nodesMap.get(item.line);
    if (lineNodes) {
      if (
        lineNodes.some((lineNode) => lineNode.nodeNumber === node1!.nodeNumber)
      ) {
        lineNodes = lineNodes.map((lineNode) =>
          lineNode.nodeNumber === node1!.nodeNumber ? node1! : lineNode
        );
      } else lineNodes = [...lineNodes, node1!];
      if (
        lineNodes.some((lineNode) => lineNode.nodeNumber === node2!.nodeNumber)
      ) {
        lineNodes = lineNodes.map((lineNode) =>
          lineNode.nodeNumber === node2!.nodeNumber ? node2! : lineNode
        );
      } else lineNodes = [...lineNodes, node2!];
      nodesMap.set(item.line, lineNodes);
    } else nodesMap.set(item.line, [node1!, node2!]);

    lineNodes = nodesMap.get(item.line);
    beamNodesMap.set(
      item.line,
      beamNodes.filter((beamNode) =>
        lineNodes?.some((lineNode) => lineNode.nodeNumber === beamNode.label)
      )
    );

    const lineBeamElements = beamElementsMap.get(item.line);
    if (lineBeamElements) {
      if (lineBeamElements.some((el) => el.label === beamElement.label)) {
        beamElementsMap.set(
          item.line,
          lineBeamElements.map((el) =>
            el.label === beamElement.label ? beamElement : el
          )
        );
      } else beamElementsMap.set(item.line, [...lineBeamElements, beamElement]);
    } else beamElementsMap.set(item.line, [beamElement]);

    const lineMembers = membersMap.get(item.line);
    if (lineMembers) {
      if (lineMembers.some((el) => el.label === member.label)) {
        membersMap.set(
          item.line,
          lineMembers.map((el) => (el.label === member.label ? member : el))
        );
      } else membersMap.set(item.line, [...lineMembers, member]);
    } else membersMap.set(item.line, [member]);

    function getItemDeadLoad(
      item: any,
      type: LoadType,
      distance: number,
      l?: number
    ) {
      const loads = project.pipeLoadings?.deadLoad.loads.filter(
        (load) =>
          load.element === replaceSplitNumber(item.name) &&
          load.type === type &&
          load.distance === distance &&
          (l ? load.lengthOfUDL === roundM(l - distance) : true)
      );
      return loads.filter((l) => {
        if (deadLoadsElements.includes(l.id)) return false;
        deadLoadsElements.push(l.id);
        return true;
      });
    }

    function getItemWindLoad(
      item: any,
      type: LoadType,
      distance: number,
      l?: number
    ) {
      const loads = project.pipeLoadings?.windLoad.loads.filter(
        (load) =>
          load.element === replaceSplitNumber(item.name) &&
          load.type === type &&
          load.distance === distance &&
          (l ? load.lengthOfUDL === roundM(l - distance) : true)
      );
      return loads.filter((l) => {
        if (windLoadsElements.includes(l.id)) return false;
        windLoadsElements.push(l.id);
        return true;
      });
    }

    if (item.deadLoadPointS !== undefined) {
      const loads = getItemDeadLoad(item, "Point Load", item.deadLoadPointS);
      for (const load of loads) {
        deadLoad.additionalLoad.pointLoad = getPointLoad(
          deadLoad.additionalLoad.pointLoad,
          node1!,
          load,
          item.line + ""
        );
      }
    }
    if (item.deadLoadPointE !== undefined) {
      const loads = getItemDeadLoad(item, "Point Load", item.deadLoadPointE);
      for (const load of loads) {
        deadLoad.additionalLoad.pointLoad = getPointLoad(
          deadLoad.additionalLoad.pointLoad,
          node2!,
          load,
          item.line + ""
        );
      }
    }
    if (item.windLoadPointS) {
      const loads = getItemWindLoad(item, "Point Load", item.windLoadPointS);
      for (const load of loads) {
        windLoads.additionalLoad.pointLoad = getPointLoad(
          windLoads.additionalLoad.pointLoad,
          node1!,
          load,
          item.line + ""
        );
      }
    }
    if (item.windLoadPointE) {
      const loads = getItemWindLoad(item, "Point Load", item.windLoadPointE);
      for (const load of loads) {
        windLoads.additionalLoad.pointLoad = getPointLoad(
          windLoads.additionalLoad.pointLoad,
          node2!,
          load,
          item.line + ""
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
          load
        );
      }
    }
  });

  deadLoad.elementLoad = getElementsLoad(
    project.pipeLoadings,
    pipesElements,
    members
    // beamElements,
    // nodes
  );

  const slugLoads = getSlugLoad(
    project.pipeLoadings.slugLoads,
    scene,
    pipes,
    pipesElements,
    members,
    beamElements
  );

  let structuralNaturalFrequency = 0;

  if (project.pipeLoadings?.NFs) {
    const snf = isArray(project.pipeLoadings.NFs)
      ? project.pipeLoadings.NFs.find((nf) => nf.line === +lineNo)?.value
      : project.pipeLoadings.NFs[+lineNo];
    structuralNaturalFrequency = snf ?? 0;
  }

  return {
    //maps: { nodesMap, beamNodesMap, beamElementsMap, membersMap },
    json: {
      id: `admin${project.name.replace(/\s/g, "")}`,
      lineNo,
      systemNo: Array.from(
        new Set(pipesElements.map((item) => item.name.replace(/\..+$/gi, "")))
      ).join(","),
      structuralNaturalFrequency,
      nodes: nodes.reduce(
        (acc, node) => ({ ...acc, [node.nodeNumber]: node }),
        {}
      ),
      beamElements: beamElements.reduce(
        (acc, element) => ({ ...acc, [element.label]: element }),
        {}
      ),
      beamNodes: beamNodes.reduce(
        (acc, node) => ({ ...acc, [node.label]: node }),
        {}
      ),
      members,
      deadLoad,
      liveLoad: { additionalLoad: { udl: {}, pointLoad: {} } },
      slugLoads,
      windLoads,
      flangeData: getFlangesData(pipes, members, beamElements, nodes),
      nonStraightElementData: getNonStraightElementData(
        pipesElements,
        members,
        beamElements
      ),
      valveData: getValveData(
        pipes,
        pipesElements,
        members,
        beamElements,
        nodes
      ),
      seismicData,
      ...getTPLoad(members, pipesElements),
      loadCombinations,
      designParameters: project.pipeDesignCode.designCode
        ? project.pipeDesignCode
        : initPipeDesignCode,
    
    },
  };
}

function getSlugLoad(
  loads: TPipeSlugLoad[],
  scene: Scene,
  pipes: FreePipe[],
  pElements: any[],
  members: Member[],
  beamElements: BeamElement[]
) {
  return loads.reduce((acc: any[], load) => {
    let prev: FreePipe | undefined, prevMember: Member | undefined;
    let next: FreePipe | undefined, nextMember: Member | undefined;

    if (load.location === "End") {
      prev = pipes.find((p) => p.pipe === load.element);
      if (
        !prev ||
        !prev.params.endConnector ||
        !(
          prev.params.endConnectorType === "Elbow" ||
          prev.params.endConnectorType === "Return"
        )
      )
        return acc;
      const index = members.reduce((acc, m) => {
        const spl = m.name.split(".");
        return prev!.pipe === spl[0] ? Math.max(+spl[1], acc) : acc;
      }, 0);
      prevMember = members.find(
        (m) => m.name === prev!.pipe || m.name === `${prev!.pipe}.${index}`
      );
      if (!prevMember) return acc;
      next = pipes.find((p) => p.preceding === prev!.pipe);
      if (!next) return acc;
      nextMember = members.find(
        (m) => m.name === next!.pipe || m.name === `${next!.pipe}.1`
      );
      if (!nextMember) return acc;
    } else {
      next = pipes.find((p) => p.pipe === load.element);
      if (!next) return acc;
      nextMember = members.find(
        (m) => m.name === next!.pipe || m.name === `${next!.pipe}.1`
      );
      if (!nextMember) return acc;
      prev = pipes.find((p) => p.pipe === next!.pipe);
      if (
        !prev ||
        !prev.params.endConnector ||
        !(
          prev.params.endConnectorType === "Elbow" ||
          prev.params.endConnectorType === "Return"
        )
      )
        return acc;
      const index = members.reduce((acc, m) => {
        const spl = m.name.split(".");
        return prev!.pipe === spl[0] ? Math.max(+spl[1], acc) : acc;
      }, 0);
      prevMember = members.find(
        (m) => m.name === prev!.pipe || m.name === `${prev!.pipe}.${index}`
      );
      if (!prevMember) return acc;
    }

    const fc = pElements.find((pe) =>
      (pe.name as string).startsWith(`${prev!.pipe}-E-`)
    );
    if (!fc) return acc;

    const fcMember = members.find((m) => m.name === fc.name);
    if (!fcMember) return acc;

    const prevZAxis = new Vector3();
    scene.getObjectByName(prev!.pipe)?.getWorldDirection(prevZAxis);
    const nextZAxis = new Vector3();
    scene.getObjectByName(next!.pipe)?.getWorldDirection(nextZAxis);

    const fcBE = beamElements.find((be) => be.label === fcMember!.label);

    const prevPE = pElements.find((pe) => pe.name === prevMember!.name);
    const nextPE = pElements.find((pe) => pe.name === nextMember!.name);

    if (!fcBE || !prevPE || !nextPE) return acc;

    return [
      ...acc,
      {
        slugNode: fcBE.nodes[1],
        coordinates: fc.endPos.toArray(),
        fluidDensity:
          load.location === "End"
            ? prev.params.fluidDensity
            : next.params.fluidDensity,
        fluidVelocity: load.velocity,
        // @ts-ignore
        angleOfBend: prev.params.endConnector?.degree ?? null,
        inPipe: {
          label: prevMember.label,
          zAxis: prevZAxis.toArray(),
          startPt: prevPE.startPos.toArray(),
          endPt: prevPE.endPos.toArray(),
        },
        outPipe: {
          label: nextMember!.label,
          zAxis: nextZAxis.toArray(),
          startPt: nextPE.startPos.toArray(),
          endPt: nextPE.endPos.toArray(),
        },
        faxial: null,
        fortho: null,
      },
    ];
  }, []);
}

function getDeadLoad(loadings?: TPipeDeadLoad) {
  return {
    pipingSelfWeightFactor: loadings?.pipingSelfWeightFactor ?? 1,
    additionalLoad: {
      udl: {},
      pointLoad: {},
    },
    elementLoad: {},
  };
}

function getFlangeConnectorType(type?: TFlangeType) {
  switch (type) {
    case "Blind":
      return "pipingflange-blind";
    case "Lapped":
      return "pipingflange-lapped";
    case "Ring Joint Facing":
      return "pipingflange-ring-joint-facing";
    case "Slip On":
      return "pipingflange-slipon";
    case "Socket Welding":
      return "pipingflange-socket-welding";
    case "Threaded":
      return "pipingflange-threaded";
    case "Welding Neck":
      return "pipingflange-weldingneck";
    default:
      return null;
  }
}

function getPipeEndConnectorType(type?: PipeConnectorType) {
  switch (type) {
    case "Cap":
      return "pipingcaps";
    case "Reducer":
      return "piping-reducers";
    case "Return":
      return "piping-returns";
    case "Elbow":
      return "piping-elbows";
    case "Tee":
      return "piping-tees";
    default:
      return null;
  }
}

function getElementsLoad(
  loadings: TPipeLoadings,
  pipes: any[],
  members: Member[]
  // beamElements: BeamElement[],
  // nodes: Node[]
) {
  const loads = members.reduce((acc, member) => {
    const pipe = pipes.find((pipe) => pipe.name === member.name);
    // if (!pipe) return acc;
    // const beamElement = beamElements.find((be) => be.label === member.label);
    // const node1 = nodes.find((node) => node.nodeNumber === beamElement?.nodes[0]);
    // const node2 = nodes.find((node) => node.nodeNumber === beamElement?.nodes[1]);
    const ins = loadings.deadLoad.insulations.find(
      (ins) => ins.element === pipe?.name
    );
    // let accessoryData = {};
    // const spl = member.name.split(".");
    // const maxIndex = `${members.reduce((acc, m) => {
    //   const spl = m.name.split(".");
    //   return pipe.pipe === spl[0] ? Math.max(+spl[1], acc) : acc;
    // }, 0)}`;
    // if (node1 && (!spl[1] || spl[1] === "1")) {
    //   if (pipe.params.startFlange) {
    //     accessoryData = {
    //       ...accessoryData,
    //       [node1.nodeNumber]: {
    //         id: pipe.params.startFlange.piping_flange_id,
    //         nodeLabel: node1.nodeNumber,
    //         label: member.label,
    //         class: pipe.params.startFlange.class,
    //         shape: pipe.params.startFlange.shape,
    //         materialId: pipe.params.material?.material_id,
    //         materialName: pipe.params.material?.material_name,
    //         nps: pipe.params.startFlange.nps,
    //         degree: null,
    //         connector: getFlangeConnectorType(pipe.params.startFlangeType),
    //       },
    //     };
    //   }
    // }
    // if (node2 && spl[1] === maxIndex) {
    //   if (pipe.params.endFlange) {
    //     accessoryData = {
    //       ...accessoryData,
    //       [node2.nodeNumber]: {
    //         id: pipe.params.endFlange.piping_flange_id,
    //         nodeLabel: node2.nodeNumber,
    //         label: member.label,
    //         class: pipe.params.endFlange.class,
    //         shape: pipe.params.endFlange.shape,
    //         materialId: pipe.params.material?.material_id,
    //         materialName: pipe.params.material?.material_name,
    //         nps: pipe.params.endFlange.nps,
    //         degree: null,
    //         connector: getFlangeConnectorType(pipe.params.endFlangeType),
    //       },
    //     };
    //   }
    //   if (pipe.params.endConnector) {
    //     accessoryData = {
    //       ...accessoryData,
    //       [node2.nodeNumber]: {
    //         id: pipe.params.endConnector.id,
    //         nodeLabel: node2.nodeNumber,
    //         label: member.label,
    //         class: null,
    //         shape: pipe.params.endConnector.shape,
    //         materialId: pipe.params.material?.material_id,
    //         materialName: pipe.params.material?.material_name,
    //         nps: pipe.params.endConnector.nps,
    //         // @ts-ignore
    //         degree: pipe.params.endConnector.degree ?? null,
    //         connector: getPipeEndConnectorType(pipe.params.endConnectorType),
    //       },
    //     };
    //   }
    // }
    const newItem = {
      label: member.label,
      fluidDensity: pipe?.params.fluidDensity ?? 0,
      insulationLoad: {
        insDensity: ins?.density ?? 0,
        insThickness: ins?.thickness ?? 0,
      },
      accessoryData: {},
    };
    return { ...acc, [member.label]: newItem };
  }, {});
  return loads;
}

function getFlangesData(
  pipes: FreePipe[],
  members: Member[],
  beamElements: BeamElement[],
  nodes: Node[]
) {
  const flanges = members.reduce((acc, member) => {
    const pipe = pipes.find(
      (pipe) => pipe.pipe === replaceSplitNumber(member.name)
    );
    if (!pipe) return acc;
    let newAcc = [...acc];
    const beamElement = beamElements.find((be) => be.label === member.label);
    const node1 = nodes.find(
      (node) => node.nodeNumber === beamElement?.nodes[0]
    );
    const node2 = nodes.find(
      (node) => node.nodeNumber === beamElement?.nodes[1]
    );
    const spl = member.name.split(".");
    const maxIndex = `${members.reduce((acc, m) => {
      const spl = m.name.split(".");
      return pipe.pipe === spl[0] ? Math.max(+spl[1], acc) : acc;
    }, 0)}`;
    if (node1 && (!spl[1] || spl[1] === "1")) {
      if (pipe.params.startFlange) {
        const Code = pipe.params.startFlangeLoads?.code ?? "API 517";
        newAcc = [
          ...newAcc,
          {
            element: beamElement?.label,
            node: node1.nodeNumber,
            pipe: pipe.pipe,
            flangeAt: "START",
            type: pipe.params.startFlangeType,
            nps: pipe.params.startFlange.nps,
            class: pipe.params.startFlange.class,
            material: pipe.params.startFlange.material,
            Code,
            dn:
              Code === "API 517"
                ? pipe.params.od ?? 0
                : Number(pipe.params.nps),
            fx: pipe.params.startFlangeLoads?.fx ?? 0,
            fy: pipe.params.startFlangeLoads?.fy ?? 0,
            fz: pipe.params.startFlangeLoads?.fz ?? 0,
            mx: pipe.params.startFlangeLoads?.mx ?? 0,
            my: pipe.params.startFlangeLoads?.my ?? 0,
            mz: pipe.params.startFlangeLoads?.mz ?? 0,
            "3F+M": pipe.params.startFlangeLoads?.["3F+M"] ?? "",
            shape: pipe.params.startFlange.shape,
            connector: getFlangeConnectorType(pipe.params.startFlangeType),
            weight: pipe.params.startFlange.weight ?? 0,
            id: pipe.params.startFlange.piping_flange_id,
          },
        ];
      }
    }
    if (node2 && spl[1] === maxIndex) {
      if (pipe.params.endFlange) {
        const Code = pipe.params.endFlangeLoads?.code ?? "API 517";
        newAcc = [
          ...newAcc,
          {
            element: beamElement?.label,
            node: node2.nodeNumber,
            pipe: pipe.pipe,
            flangeAt: "END",
            type: pipe.params.endFlangeType,
            nps: pipe.params.endFlange.nps,
            class: pipe.params.endFlange.class,
            material: pipe.params.endFlange.material,
            Code,
            dn:
              Code === "API 517"
                ? pipe.params.od ?? 0
                : Number(pipe.params.nps),
            fx: pipe.params.endFlangeLoads?.fx ?? 0,
            fy: pipe.params.endFlangeLoads?.fy ?? 0,
            fz: pipe.params.endFlangeLoads?.fz ?? 0,
            mx: pipe.params.endFlangeLoads?.mx ?? 0,
            my: pipe.params.endFlangeLoads?.my ?? 0,
            mz: pipe.params.endFlangeLoads?.mz ?? 0,
            "3F+M": pipe.params.endFlangeLoads?.["3F+M"] ?? "",
            shape: pipe.params.endFlange.shape,
            connector: getFlangeConnectorType(pipe.params.endFlangeType),
            weight: pipe.params.endFlange.weight ?? 0,
            id: pipe.params.endFlange.piping_flange_id,
          },
        ];
      }
    }
    return newAcc;
  }, [] as any[]);
  return flanges.reduce((acc, item) => ({ ...acc, [item.node]: item }), {});
}

function getNonStraightElementData(
  pipes: any[],
  members: Member[],
  beamElements: BeamElement[]
) {
  const nonStraightElements = pipes.filter((p) => p.isNotPipe);
  return nonStraightElements.reduce((acc, p) => {
    const data = p.params.endConnector;
    if (!data) return acc;
    const member = members.find((m) => m.name === p.name);
    if (!member) return acc;
    const be = beamElements.find((be) => be.label === member.label);
    if (!be) return acc;
    return {
      ...acc,
      [be.label]: {
        label: be.label,
        nps: data.nps,
        schedule: data.schedule,
        class: null,
        degree: data.degree ?? null,
        shape: data.shape,
        type: p.type,
        connector: getPipeEndConnectorType(p.params.endConnectorType),
        material: data.material,
        weight: data.weight,
        id: data.id,
      },
    };
  }, {});
}

function getValveData(
  pipes: FreePipe[],
  pipesElements: any[],
  members: Member[],
  beamElements: BeamElement[],
  nodes: Node[]
) {
  return pipesElements.reduce((acc, p) => {
    if (!p.params.valveType) return acc;
    const pipe = pipes.find((pipe) => pipe.pipe === replaceSplitNumber(p.name));
    if (!pipe) return acc;
    const member = members.find((m) => m.name === p.name);
    if (!member) return acc;
    const be = beamElements.find((be) => be.label === member.label);
    if (!be) return acc;
    const n1 = nodes.find((node) => node.nodeNumber === be.nodes[0]);
    const isN1 = n1
      ? n1.x === p.params.valvePositionPoint.x &&
        n1.y === p.params.valvePositionPoint.y &&
        n1.z === p.params.valvePositionPoint.z
      : false;
    const n2 = nodes.find((node) => node.nodeNumber === be.nodes[1]);
    const isN2 = n2
      ? n2.x === p.params.valvePositionPoint.x &&
        n2.y === p.params.valvePositionPoint.y &&
        n2.z === p.params.valvePositionPoint.z
      : false;
    return {
      ...acc,
      [be.label]: {
        id: null,
        weight: 0,
        element: be.label,
        node: isN1
          ? n1?.nodeNumber ?? null
          : isN2
          ? n2?.nodeNumber ?? null
          : null,
        pipe: pipe.pipe,
        nps: pipe.params.nps ?? null,
        schedule: pipe.params.profile?.schedule ?? null,
        material: pipe.params.material?.material_name ?? null,
        outerDiameter: pipe.params.od ?? 0,
        thickness: pipe.params.thickness ?? 0,
        valveType: p.params.valveType,
        valveActuatorType: p.params.valveActuator ?? null,
        valveControlType: p.params.valveControl ?? null,
        valvePosition: p.params.valvePosition,
        valveMass: p.params.valveMass?? 0,  /// valve data added
        valveLength: p.params.valveLength?? 0,  /// valve data added
      },
    };
  }, {});
}

export function getElementsForWindLoads(
  loadings: TPipeWindLoad,
  elements: any[]
) {
  let minX = 0;
  let maxX = 0;
  let minZ = 0;
  let maxZ = 0;

  const nameToLabel = new Map<string, number>();

  elements.forEach((el, i) => {
    nameToLabel.set(el.name, i + 1);

    minX = Math.min(minX, el.startPos.x);
    minX = Math.min(minX, el.endPos.x);

    maxX = Math.max(maxX, el.startPos.x);
    maxX = Math.max(maxX, el.endPos.x);

    minZ = Math.min(minZ, el.startPos.z);
    minZ = Math.min(minZ, el.endPos.z);

    maxZ = Math.max(maxZ, el.startPos.z);
    maxZ = Math.max(maxZ, el.endPos.z);
  });

  const getLength = (items: any[], deg: Orientation) => {
    if (!items.length) return 0;

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

  const createPipeLevels = (elements: any[]) => {
    const map = new Map<number, any[]>();

    elements.forEach((el) => {
      const middle = (el.startPos.y + el.endPos.y) / 2;
      const items = map.get(middle);
      if (items) {
        map.set(middle, [...items, nameToLabel.get(el.name)]);
      } else map.set(middle, [nameToLabel.get(el.name)]);
    });

    return Array.from(map.entries()).reduce(
      (acc, [level, items], i) => ({ ...acc, [level]: items }),
      {}
    );
  };

  const height = elements.reduce(
    (max, item) => Math.max(max, item.startPos.y, item.endPos.y),
    0
  );

  const dir0 = {
    length: getLength(elements, 0),
    height,
    z: [],
    x: [],
    pipeZ: createPipeLevels(
      elements.filter((item) => item.startPos.z !== item.endPos.z)
    ),
    pipeX: {},
  };

  const dir45 = {
    length: getLength(elements, 45),
    height,
    z: [],
    x: [],
    pipeZ: createPipeLevels(
      elements.filter((item) => {
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
      elements.filter((item) => {
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
    length: getLength(elements, 90),
    height,
    z: [],
    x: [],
    pipeZ: {},
    pipeX: createPipeLevels(
      elements.filter((item) => item.startPos.x !== item.endPos.x)
    ),
  };

  const dir135 = {
    length: getLength(elements, 135),
    height,
    z: [],
    x: [],
    pipeZ: createPipeLevels(
      elements.filter((item) => {
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
      elements.filter((item) => {
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
    length: getLength(elements, 180),
    height,
    z: [],
    x: [],
    pipeZ: createPipeLevels(
      elements.filter((item) => item.startPos.z !== item.endPos.z)
    ),
    pipeX: {},
  };

  const dir225 = {
    length: getLength(elements, 225),
    height,
    z: [],
    x: [],
    pipeZ: createPipeLevels(
      elements.filter((item) => {
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
      elements.filter((item) => {
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
    length: getLength(elements, 270),
    height,
    z: [],
    x: [],
    pipeZ: {},
    pipeX: createPipeLevels(
      elements.filter((item) => item.startPos.x !== item.endPos.x)
    ),
  };

  const dir315 = {
    length: getLength(elements, 315),
    height,
    z: [],
    x: [],
    pipeZ: createPipeLevels(
      elements.filter((item) => {
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
      elements.filter((item) => {
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
      shapeFactor: loadings.isWindCode.shapeFactor ?? 0.7,
      datumElevation: loadings.isWindCode.datumElevation ?? 0,
      limitingSize: loadings.isWindCode.limitingSize ?? 100,
    },
    usWindCode: {
      ...loadings.usWindCode,
      shapeFactor: loadings.usWindCode.shapeFactor ?? 0.7,
      datumElevation: loadings.usWindCode.datumElevation ?? 0,
      limitingSize: loadings.usWindCode.limitingSize ?? 100,
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

function getTPLoad(members: Member[], pipes: any[]) {
  return members.reduce(
    (acc, member) => {
      const pipe = pipes.find((pipe) => pipe.name === member.name);
      return pipe
        ? {
            temperatureLoad: {
              ...acc.temperatureLoad,
              [member.label]: {
                label: member.label,
                T1: pipe.params.T1,
                T2: pipe.params.T2,
                T3: pipe.params.T3,
                T4: pipe.params.T4,
                T5: pipe.params.T5,
                T6: pipe.params.T6,
                T7: pipe.params.T7,
                T8: pipe.params.T8,
                T9: pipe.params.T9,
              },
            },
            pressureLoad: {
              ...acc.pressureLoad,
              [member.label]: {
                label: member.label,
                P1: pipe.params.P1,
                P2: pipe.params.P2,
                P3: pipe.params.P3,
                P4: pipe.params.P4,
                HP: pipe.params.HP,
              },
            },
          }
        : acc;
    },
    {
      temperatureLoad: {},
      pressureLoad: {},
    }
  );
}

function getSeismicData(line: string, loads: TPipeSeismicLoads) {
  switch (loads.seismicLoadingAsPerCode) {
    case "IS Code":
      return {
        countryCode: loads.seismicLoadingAsPerCode,
        analysisMethod: loads.seismicAnalysisMethod,
        modalCombination: loads.modalCombinationMethod,
        spectralData: loads.spectralsPoints.map((sp) => ({
          timePeriod: sp.timePeriod,
          acceleration: sp.acceleration,
        })),
        zoneFactor: loads.isSeismicCode.zoneFactor,
        responseReductionFactor: loads.isSeismicCode.responseReductionFactor,
        soilType: loads.isSeismicCode.soilType,
        importanceFactor: loads.isSeismicCode.importanceFactor,
        dampingRatio: loads.isSeismicCode.dampingRatio,
        soilFoundationCondition: loads.isSeismicCode.soilFoundationCondition,
        timePeriod: loads.isSeismicCode.timePeriod,
        seismicResponse: loads.seismicLoads
          .filter((sl) => (line === "ALL" ? true : sl.line === line))
          .map((sl) => ({
            node: sl.node,
            seismicWeight: sl.weight,
          })),
        nodes: {},
        temperatureLoad: {},
        pressureLoad: {},
      };
    default:
      return {
        zoneFactor: "II",
        responseReductionFactor: 1,
        soilType: "Hard soil",
        importanceFactor: 1.15,
        dampingRatio: 2,
        soilFoundationCondition: "Fixed Base",
        timePeriod: "1/Naturalfreq",
        seismicResponse: [],
        nodes: {},
      };
  }
}

function parseLoadCombinations(arr: TPipeLoadCombination[]) {
  return arr
    .filter((c) => !c.isEmpty)
    .map((item) => ({
      number: item.LC_No,
      loadCase: item.loadCase,
      loadCondition: item.condition ?? "Empty",
      dApplied: item.dApplied ?? "No",
      empty: fixValueToNumber(item.empty, "float"),
      emptyPlusFluid: fixValueToNumber(item.emptyPlusFluid, "float"),
      emptyPlusWater: fixValueToNumber(item.emptyPlusWater, "float"),
      windPlusX: fixValueToNumber(item.WXp, "float"),
      windMinusX: fixValueToNumber(item.WXm, "float"),
      windPlusZ: fixValueToNumber(item.WZp, "float"),
      windMinusZ: fixValueToNumber(item.WZm, "float"),
      seismicPlusX: fixValueToNumber(item.SXp, "float"),
      seismicMinusX: fixValueToNumber(item.SXm, "float"),
      seismicPlusZ: fixValueToNumber(item.SZp, "float"),
      seismicMinusZ: fixValueToNumber(item.SZm, "float"),
      slug: fixValueToNumber(item.slug, "float"),
      t1Hot: fixValueToNumber(item.T1Hot, "float"),
      t1Cold: fixValueToNumber(item.T1Cold, "float"),
      t2Hot: fixValueToNumber(item.T2Hot, "float"),
      t2Cold: fixValueToNumber(item.T2Cold, "float"),
      t3Hot: fixValueToNumber(item.T3Hot, "float"),
      t3Cold: fixValueToNumber(item.T3Cold, "float"),
      p1: fixValueToNumber(item.P1, "float"),
      hp: fixValueToNumber(item.HP, "float"),
      numberOfCycles: fixValueToNumber(item.N),
    }));
}
