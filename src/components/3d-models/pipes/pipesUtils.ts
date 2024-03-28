import {
  Project,
  FreePipe,
  TProjectMode,
  TSupportDetail,
  PipeConnectorType,
} from "../../../store/main/types";
import {
  roundM,
  getNextId,
  getPosByDistance,
  roundVectorM,
  MMtoM,
  degToRad,
  round,
  radToDeg,
} from "../utils";
import {
  TPipingTee,
  TPipingReducer,
  TPipingReturn,
  TPipingElbow,
  TPipingFlange,
  TPipingAccessory,
  DataState,
  TPipingCap,
} from "../../../store/data/types";
import {
  Vector3,
  QuadraticBezierCurve3,
  Mesh,
  Group,
  Path,
  Vector2,
  Object3D,
  TextGeometry,
  MeshLambertMaterial,
  DoubleSide,
  ArrowHelper,
  Font,
} from "three";
import {
  deg90InRad,
  gray,
  deg360InRad,
  yellow,
  green,
  red,
  deg180InRad,
} from "../../../store/main/constants";
import {
  TPipeCheckParams,
  TFlangeCheck,
  TPipeWindLoad,
  TPipeDeadLoad,
} from "../../../store/main/pipeTypes";
import {
  PipeThicknessCheckUI,
  MemberStressCheckUI,
} from "../../../store/ui/types";
import { getPipePoints } from "../../../services/pipe-services/pipe-service";

const blueHex = 0x0000ff;
const redHex = 0xff0000;
const greenHex = 0x00d000;

const vX = new Vector3(1, 0, 0);
const vY = new Vector3(0, 1, 0);
const vZ = new Vector3(0, 0, 1);

export function getStressColor(
  segment?: MemberStressCheckUI | PipeThicknessCheckUI | TFlangeCheck,
  params?: TPipeCheckParams,
  mode?: TProjectMode
) {
  if (!segment || !params) return gray;
  if (mode === "stressCheck") {
    const info = segment as MemberStressCheckUI;
    if (info.actual <= (params.green ?? 0.3)) return green;
    if (info.actual >= (params.red ?? 1)) return red;
    return yellow;
  } else if (mode === "thicknessCheck") {
    const info = segment as PipeThicknessCheckUI;
    if (info.utilizationRatio <= (params.green ?? 0.3)) return green;
    if (info.utilizationRatio >= (params.red ?? 1)) return red;
    return yellow;
  } else if (mode === "flangeCheck") {
    const info = segment as TFlangeCheck;
    if (info.utilizationRatio <= (params.green ?? 0.3)) return green;
    if (info.utilizationRatio >= (params.red ?? 1)) return red;
    return yellow;
  }
  return gray;
}

export function getPipeLength(
  start: Vector3,
  end: Vector3,
  type: PipeConnectorType | undefined,
  connector: TPipingAccessory | undefined
) {
  const distance = start.distanceTo(end);
  switch (type) {
    case "Elbow": {
      const a = MMtoM((connector as TPipingElbow)?.a ?? 0);
      return start.distanceTo(
        roundVectorM(getPosByDistance(distance - a, start, end))
      );
    }
    case "Reducer": {
      const h = MMtoM((connector as TPipingReducer)?.h ?? 0);
      return start.distanceTo(
        roundVectorM(getPosByDistance(distance - h / 2, start, end))
      );
    }
    case "Cap": {
      const e = MMtoM((connector as TPipingCap)?.e ?? 0);
      return start.distanceTo(
        roundVectorM(getPosByDistance(distance - e, start, end))
      );
    }
    case "Tee": {
      const c = MMtoM((connector as TPipingTee)?.c ?? 0);
      return start.distanceTo(
        roundVectorM(getPosByDistance(distance - c, start, end))
      );
    }
    default:
      return distance;
  }
}

export function getStartOffsetFromConnector(pipe: FreePipe, byAngle?: boolean) {
  if (pipe.params.endConnector) {
    switch (pipe.params.endConnectorType) {
      case "Elbow":
        return MMtoM((pipe.params.endConnector as TPipingElbow).a);
      case "Reducer":
        return MMtoM((pipe.params.endConnector as TPipingReducer).h ?? 0) / 2;
      case "Tee":
        return byAngle
          ? MMtoM((pipe.params.endConnector as TPipingTee).m)
          : MMtoM((pipe.params.endConnector as TPipingTee).c);
    }
  }
  return 0;
}

export function setEndConnectorRotation(
  endConnector: Group | Mesh,
  prev: FreePipe,
  next?: FreePipe
) {
  if (next) {
    if (!next.hDir && !next.vDir) {
      const v = roundVectorM(
        new Vector3(
          next.x2 - next.x1,
          next.y2 - next.y1,
          next.z2 - next.z1
        ).applyEuler(
          getMeshRotation(
            new Vector3(prev.x1, prev.y1, prev.z1),
            new Vector3(prev.x2, prev.y2, prev.z2)
          )
        )
      );
      const vDir = getVAngle(next) - 90;
      endConnector.rotateX(getRotationAngle(v.z, vDir));
    } else {
      endConnector.rotateX(getRotationAngle(next.hDir, -next.vDir));
    }
  } else {
    endConnector.rotateX(
      getRotationAngle(prev.hNextDir ?? 0, -(prev.vNextDir ?? 0))
    );
  }
}

export function getFullReleases(supp: TSupportDetail) {
  let changed = { ...supp };
  switch (supp.type) {
    case "Anchor":
      changed = {
        ...changed,
        direction: undefined,
        valueType: "K",
        x: undefined,
        y: undefined,
        z: undefined,
        Rx: undefined,
        Ry: undefined,
        Rz: undefined,
        Mu: 0,
        masterNodeDist: undefined,
        masterNodePipe: undefined,
      };
      break;
    case "Sliding":
      {
        changed = {
          ...changed,
          direction: changed.direction ?? "X",
          valueType: "K",
          x: undefined,
          y: undefined,
          z: undefined,
          Rx: undefined,
          Ry: undefined,
          Rz: undefined,
          masterNodeDist: undefined,
          masterNodePipe: undefined,
        };
        switch (supp.direction) {
          case "X":
            changed = { ...changed, x: "Released" };
            break;
          case "Y":
            changed = { ...changed, y: "Released" };
            break;
          case "Z":
            changed = { ...changed, z: "Released" };
            break;
        }
      }
      break;
    case "Custom":
    case "Custom+":
    case "Custom-":
      {
        const isPM = supp.type !== "Custom";
        const isK = changed.valueType === "K";
        changed = {
          ...changed,
          direction: changed.direction ?? "X",
          masterNodeDist: undefined,
          masterNodePipe: undefined,
        };
        switch (supp.direction) {
          case "X":
            changed = {
              ...changed,
              x: !(isPM && isK)
                ? `${roundM(Math.abs(Number(changed.x) || 0))}`
                : undefined,
              y: isK ? "Released" : undefined,
              z: isK ? "Released" : undefined,
              Rx: isK ? "Released" : undefined,
              Ry: isK ? "Released" : undefined,
              Rz: isK ? "Released" : undefined,
            };
            break;
          case "Y":
            changed = {
              ...changed,
              x: isK ? "Released" : undefined,
              y: !(isPM && isK)
                ? `${roundM(Math.abs(Number(changed.y) || 0))}`
                : undefined,
              z: isK ? "Released" : undefined,
              Rx: isK ? "Released" : undefined,
              Ry: isK ? "Released" : undefined,
              Rz: isK ? "Released" : undefined,
            };
            break;
          case "Z":
            changed = {
              ...changed,
              x: isK ? "Released" : undefined,
              y: isK ? "Released" : undefined,
              z: !(isPM && isK)
                ? `${roundM(Math.abs(Number(changed.z) || 0))}`
                : undefined,
              Rx: isK ? "Released" : undefined,
              Ry: isK ? "Released" : undefined,
              Rz: isK ? "Released" : undefined,
            };
            break;
          case "RX":
            changed = {
              ...changed,
              x: isK ? "Released" : undefined,
              y: isK ? "Released" : undefined,
              z: isK ? "Released" : undefined,
              Rx: !(isPM && isK)
                ? `${roundM(Math.abs(Number(changed.Rx) || 0))}`
                : undefined,
              Ry: isK ? "Released" : undefined,
              Rz: isK ? "Released" : undefined,
            };
            break;
          case "RY":
            changed = {
              ...changed,
              x: isK ? "Released" : undefined,
              y: isK ? "Released" : undefined,
              z: isK ? "Released" : undefined,
              Rx: isK ? "Released" : undefined,
              Ry: !(isPM && isK)
                ? `${roundM(Math.abs(Number(changed.Ry) || 0))}`
                : undefined,
              Rz: isK ? "Released" : undefined,
            };
            break;
          case "RZ":
            changed = {
              ...changed,
              x: isK ? "Released" : undefined,
              y: isK ? "Released" : undefined,
              z: isK ? "Released" : undefined,
              Rx: isK ? "Released" : undefined,
              Ry: isK ? "Released" : undefined,
              Rz: !(isPM && isK)
                ? `${roundM(Math.abs(Number(changed.Rz) || 0))}`
                : undefined,
            };
        }
      }
      break;
    case "Slave Node": {
      changed = {
        ...changed,
        direction: undefined,
        valueType: "K",
        x: changed.x
          ? changed.x === "Released"
            ? "Released"
            : `${Number(changed.x) || 0}`
          : undefined,
        y: changed.y
          ? changed.y === "Released"
            ? "Released"
            : `${Number(changed.y) || 0}`
          : undefined,
        z: changed.z
          ? changed.z === "Released"
            ? "Released"
            : `${Number(changed.z) || 0}`
          : undefined,
        Rx: changed.Rx
          ? changed.Rx === "Released"
            ? "Released"
            : `${Number(changed.Rx) || 0}`
          : undefined,
        Ry: changed.Ry
          ? changed.Ry === "Released"
            ? "Released"
            : `${Number(changed.Ry) || 0}`
          : undefined,

        Rz: changed.Rz
          ? changed.Rz === "Released"
            ? "Released"
            : `${Number(changed.Rz) || 0}`
          : undefined,
      };
      break;
    }
    case "Hanger": {
      changed = {
        ...changed,
        valueType: "K",
        x: changed.direction === "X" ? "-1" : "Released",
        y: changed.direction === "Y" ? "-1" : "Released",
        z: changed.direction === "Z" ? "-1" : "Released",
        Rx: changed.direction === "RX" ? "-1" : "Released",
        Ry: changed.direction === "RY" ? "-1" : "Released",
        Rz: changed.direction === "RZ" ? "-1" : "Released",
        masterNodeDist: undefined,
        masterNodePipe: undefined,
      };
      break;
    }
  }
  return changed;
}

export function getRotationAngle(h: number, v: number) {
  if (h === 0) {
    const angle = v ? degToRad(v > 0 ? 90 : 270) : 0;
    return angle;
  } else {
    const angle = degToRad(h < 0 ? 180 - v : v ? v : 0);
    return angle;
  }
}

export function getVAngle(pipe: FreePipe) {
  const y = new Vector3(0, 1);
  const toV = new Vector3(
    pipe.x2 - pipe.x1,
    pipe.y2 - pipe.y1,
    pipe.z2 - pipe.z1
  ).normalize();
  return radToDeg(y.angleTo(toV));
}

export function getMeshRotation(s: Vector3, e: Vector3) {
  const obj = new Object3D();
  obj.position.copy(s);
  obj.lookAt(e);
  obj.rotateY(-deg90InRad);
  return obj.rotation;
}

export function getMeshRotationQ(s: Vector3, e: Vector3) {
  const obj = new Object3D();
  obj.position.copy(s);
  obj.lookAt(e);
  // obj.rotateY(-deg90InRad);
  return obj.quaternion;
}

export function rotationV(
  start: Vector3,
  end: Vector3,
  l: number,
  h: number,
  v: number
) {
  const child = new Mesh();
  child.position.setZ(l);

  const group = new Group();
  group.add(child);
  group.position.copy(start);
  group.lookAt(end);
  group.rotateY(degToRad(-h));
  group.rotateX(degToRad(-v));
  group.rotation.z = 0;
  const v1 = child.position.clone();
  v1.applyQuaternion(group.quaternion);
  end.copy(roundVectorM(v1).add(start));
}

export function getAngle(pipe: FreePipe, preceding?: FreePipe) {
  if (!preceding) return "";

  const s1 = new Vector3(pipe.x1, pipe.y1, pipe.z1);
  const e1 = new Vector3(pipe.x2, pipe.y2, pipe.z2);

  const s2 = new Vector3(preceding.x1, preceding.y1, preceding.z1);
  const e2 = new Vector3(preceding.x2, preceding.y2, preceding.z2);

  return round(radToDeg(e2.sub(s2).angleTo(e1.sub(s1))));
}

export function getPipingAccessories(
  resoures: DataState,
  UDEs: TPipingElbow[],
  pipe: FreePipe,
  nexts: FreePipe[],
  angles: { angle: number; pipe: FreePipe }[]
): TPipingAccessory[] {
  let accessories: TPipingAccessory[] = [];
  const firstAngle = Math.abs(angles[0]?.angle);
  switch (pipe.params.endConnectorType) {
    case "Elbow":
      accessories = [...UDEs, ...resoures.pipingElbows].filter(
        (item) =>
          item.nps === pipe.params.nps &&
          (nexts.length ? item.degree === firstAngle : true)
      );
      break;
    case "Return":
      accessories = [...UDEs, ...resoures.pipingReturns].filter(
        (item) =>
          item.nps === pipe.params.nps &&
          (nexts.length ? item.degree === firstAngle : true)
      );
      break;
    case "Reducer":
      accessories = resoures.pipingReducers.filter((item) => {
        const npss = item.nps.split(" x ");
        return nexts.length
          ? (npss[0] === pipe.params.nps && npss[1] === nexts[0]?.params.nps) ||
              (npss[1] === pipe.params.nps && npss[0] === nexts[0]?.params.nps)
          : npss[0] === pipe.params.nps || npss[1] === pipe.params.nps;
      });
      break;
    case "Cap":
      accessories = resoures.pipingCaps.filter(
        (item) => item.nps === pipe.params.nps
      );
      break;
    case "Tee":
      accessories = resoures.pipingTees.filter((item) => {
        const npss = item.nps.split(" x ");
        if (npss[0] !== pipe.params.nps) return false;
        if (!nexts.length) return true;
        const next0 = angles.find((item) => item.angle === 0)?.pipe;
        const next90 = angles.find((item) => item.angle === 90)?.pipe;
        if (!(next0 || next90)) return false;
        if (next0 && next90) {
          if (next0.params.nps !== next90.params.nps) {
            return (
              npss[0] === next0.params.nps && npss[1] === next90.params.nps
            );
          }
          return (
            npss[0] === next0.params.nps &&
            (npss[1] !== undefined ? npss[1] === next90.params.nps : true)
          );
        } else if (next0) {
          return npss[0] === next0.params.nps;
        } else if (next90) {
          return (npss[1] ?? npss[0]) === next90.params.nps;
        }
        return false;
      });
  }
  return accessories;
}

export function continuePipe(prev: FreePipe | undefined, next: FreePipe) {
  const pos = new Vector3();
  if (prev) {
    const startA = new Vector3(prev.x1, prev.y1, prev.z1);
    const endA = new Vector3(prev.x2, prev.y2, prev.z2);
    pos.copy(
      roundVectorM(getPosByDistance(prev.length + next.length, startA, endA))
    );
  } else {
    pos.setX(next.length);
  }
  return pos;
}

export function getFlangeHoles(params: TPipingFlange) {
  const d = MMtoM(params.dr_d ?? 0) / 2;
  const nos = params.dr_no ?? 0;
  const G = MMtoM(params.dr_g ?? 0) / 2;
  const holes: Path[] = [];
  const delta = degToRad(360 / nos);
  for (let i = 0; i < nos; i++) {
    const rad = delta * i;
    const v = new Vector2(-G * Math.sin(rad), G * Math.cos(rad));
    const hole = new Path();
    hole.absarc(v.x, v.y, d, 0, deg360InRad, true);
    holes.push(hole);
  }
  return holes;
}

function sqrt(val: number) {
  return Math.sqrt(val);
}

function pow(val: number) {
  return Math.pow(val, 2);
}

function tan(val: number) {
  return Math.tan(val);
}

function cos(val: number) {
  return Math.cos(val);
}

function sin(val: number) {
  return Math.sin(val);
}

function mod(v: Vector3) {
  return sqrt(pow(v.x) + pow(v.y) + pow(v.z));
}

function addVectors(v1: Vector3, v2: Vector3) {
  return v1.clone().add(v2);
}

function subVectors(v1: Vector3, v2: Vector3) {
  return v1.clone().sub(v2);
}

function multiplyVectorByScalar(v: Vector3, scalar: number) {
  return v.clone().multiplyScalar(scalar);
}

function divideVectorByScalar(v: Vector3, scalar: number) {
  return v.clone().divideScalar(scalar);
}

function defineMiddlePoint(
  elbow: TPipingElbow,
  n1: Vector3,
  n2: Vector3,
  n3: Vector3
) {
  const theta = degToRad(elbow.degree);
  const alphaP1 = theta / 2;
  const radius = MMtoM(elbow.a ?? 0);

  const sub_n2_n1 = subVectors(n2, n1);
  const mod_n2_n1 = mod(sub_n2_n1);
  const VectV1 = divideVectorByScalar(sub_n2_n1, mod_n2_n1);

  const sub_n3_n2 = subVectors(n3, n2);
  const mod_n3_n2 = mod(sub_n3_n2);
  const VectV2 = divideVectorByScalar(sub_n3_n2, mod_n3_n2);

  const r_theta_2 = radius * tan(alphaP1);

  const n_2 = addVectors(n2, multiplyVectorByScalar(VectV2, r_theta_2));
  const n_0 = subVectors(n2, multiplyVectorByScalar(VectV1, r_theta_2));

  const negV2xV1 = new Vector3(
    VectV1.z * -VectV2.y - VectV1.y * -VectV2.z,
    -(VectV1.z * -VectV2.x - VectV1.x * -VectV2.z),
    VectV1.y * -VectV2.x - VectV1.x * -VectV2.y
  );
  const mod_negV2xV1 = mod(negV2xV1);
  const VectZ = divideVectorByScalar(negV2xV1, mod_negV2xV1);

  const sub_n_2_n_0 = subVectors(n_2, n_0);
  const mod_sub_n_2_n_0 = mod(sub_n_2_n_0);

  const VectIX = divideVectorByScalar(sub_n_2_n_0, mod_sub_n_2_n_0);
  const VectIY = new Vector3(
    VectZ.y * VectIX.z - VectZ.z * VectIX.y,
    -(VectZ.x * VectIX.z - VectZ.z * VectIX.x),
    VectZ.x * VectIX.y - VectZ.y * VectIX.x
  );
  const VectIZ = new Vector3(
    VectIX.y * VectIY.z - VectIX.z * VectIY.y,
    -(VectIX.x * VectIY.z - VectIX.z * VectIY.x),
    VectIX.x * VectIY.y - VectIX.y * VectIY.x
  );

  // const Rot = [VectIX, VectIY, VectIZ];

  const P1r = new Vector3(
    VectIX.x * n_0.x + VectIX.y * n_0.y + VectIX.z * n_0.z,
    VectIY.x * n_0.x + VectIY.y * n_0.y + VectIY.z * n_0.z,
    VectIZ.x * n_0.x + VectIZ.y * n_0.y + VectIZ.z * n_0.z
  );

  const P2r = new Vector3(
    VectIX.x * n_2.x + VectIX.y * n_2.y + VectIX.z * n_2.z,
    VectIY.x * n_2.x + VectIY.y * n_2.y + VectIY.z * n_2.z,
    VectIZ.x * n_2.x + VectIZ.y * n_2.y + VectIZ.z * n_2.z
  );

  const x1r = P1r.x;
  const x2r = P2r.x;
  const y1r = P1r.y;
  const zcr1 = P1r.z;

  const xcr = (x1r + x2r) / 2;

  const deltaYcr = sqrt(pow(radius) - pow(x1r - xcr));
  const signDelta = 1;

  const ycr1 = y1r + deltaYcr * signDelta;

  const C1r = new Vector3(xcr, ycr1, zcr1);

  const ang = -alphaP1 - Math.PI / 2 + alphaP1;

  const angV = new Vector3(radius * cos(ang), radius * sin(ang));

  const P1_ = addVectors(C1r, angV);

  return roundVectorM(
    new Vector3(
      VectIX.x * P1_.x + VectIY.x * P1_.y + VectIZ.x * P1_.z,
      VectIX.y * P1_.x + VectIY.y * P1_.y + VectIZ.y * P1_.z,
      VectIX.z * P1_.x + VectIY.z * P1_.y + VectIZ.z * P1_.z
    )
  );
}

export function createJSONElbow(
  pipes: FreePipe[],
  prev: FreePipe,
  next: FreePipe
) {
  const startA = roundVectorM(new Vector3(prev.x1, prev.y1, prev.z1));
  const endA = roundVectorM(new Vector3(prev.x2, prev.y2, prev.z2));
  const startB = roundVectorM(new Vector3(next.x1, next.y1, next.z1));
  const endB = roundVectorM(new Vector3(next.x2, next.y2, next.z2));

  const elbow = prev.params.endConnector as TPipingElbow;
  const a = MMtoM(elbow.a ?? 0);
  const start = roundVectorM(
    getPosByDistance(startA.distanceTo(endA) - a, startA, endA)
  );
  const center = endA.clone();
  const end = roundVectorM(getPosByDistance(a, startB, endB));

  endA.copy(start);
  const fixedTo = roundM(startA.distanceTo(endA));

  const fixedFrom = roundM(startB.distanceTo(end));
  startB.copy(end);

  const name = `${elbow.shape === "LR ELBOWS" ? "LRE" : "SRE"}${elbow.degree}`;
  const id = prev.params.endConnectorDetails?.type ?? "";

  let S: any, S1: any, S2: any, E: any;

  const index = getNextId(pipes);

  if (id === "BWE") {
    const centerA = defineMiddlePoint(elbow, start, center, end);

    // const curve = new QuadraticBezierCurve3(start, center, end);
    // const centerA = roundVectorM(curve.getPointAt(0.5));

    // const v1 = center
    //   .clone()
    //   .sub(startA)
    //   .normalize();
    // const v2 = endB
    //   .clone()
    //   .sub(center)
    //   .normalize();

    // const z = v2
    //   .clone()
    //   .negate()
    //   .cross(v1);

    // const ix = end
    //   .clone()
    //   .sub(start)
    //   .normalize();
    // const iy = z.clone().cross(ix);
    // const iz = ix.clone().cross(iy);

    // const P1r = new Vector3(ix.dot(start), iy.dot(start), iz.dot(start));
    // const P2r = new Vector3(ix.dot(end), iy.dot(end), iz.dot(end));

    // const xcr = (P1r.x + P2r.x) / 2;

    // const deltaYcr = Math.sqrt((a ^ 2) - ((P1r.x - xcr) ^ 2));

    // const ycr1 = P1r.y + deltaYcr;

    // const C1r = new Vector3(xcr, ycr1, P1r.z);

    // const theta1 = Math.acos(
    //   P1r.clone()
    //     .sub(C1r)
    //     .dot(P2r.clone().sub(C1r)) /
    //     (a ^ 2)
    // );

    // const ang = -theta1 / 2 - deg90InRad + degToRad(elbow.degree / 2);

    // const P1_1 = C1r.clone().add(new Vector3(a * Math.cos(ang), a * Math.sin(ang)));

    // const P1 = new Vector3(
    //   new Vector3(ix.x, iy.x, iz.x).dot(P1_1),
    //   new Vector3(ix.y, iy.y, iz.y).dot(P1_1),
    //   new Vector3(ix.z, iy.z, iz.z).dot(P1_1)
    // );

    S = {
      ...prev,
      id: index,
      x1: start.x,
      y1: start.y,
      z1: start.z,
      x2: centerA.x,
      y2: centerA.y,
      z2: centerA.z,
      length: roundM(start.distanceTo(centerA)),
      pipe: `${prev.pipe}-E-${name}`,
      preceding: prev.pipe,
      isNotPipe: true,
      isElbow: true,
      elId: `${id}-I`,
      params: {
        ...prev.params,
        connectorDegree: elbow.degree,
        startFlange: undefined,
        startFlangeClass: undefined,
        startFlangeType: undefined,
        endFlange: undefined,
        endFlangeClass: undefined,
        endFlangeType: undefined,
        numberOfSupports: undefined,
        supportDetails: undefined,
      },
    } as FreePipe;
    E = {
      ...next,
      id: index + 1,
      x1: centerA.x,
      y1: centerA.y,
      z1: centerA.z,
      x2: end.x,
      y2: end.y,
      z2: end.z,
      length: roundM(centerA.distanceTo(end)),
      pipe: `${next.pipe}-S-${name}`,
      preceding: S.pipe,
      isNotPipe: true,
      isElbow: true,
      elId: `${id}-O`,
      params: { ...S.params },
    } as FreePipe;
  } else if (id === "BCSM") {
    const curve = new QuadraticBezierCurve3(start, center, end);
    const centerA = roundVectorM(curve.getPointAt(0.5).clone());
    const thetaPercent =
      (prev.params.endConnectorDetails?.Theta ?? 0) / elbow.degree;
    const betweenA = roundVectorM(curve.getPointAt(thetaPercent).clone());
    const betweenB = roundVectorM(curve.getPointAt(1 - thetaPercent).clone());
    S = {
      ...prev,
      id: index,
      x1: start.x,
      y1: start.y,
      z1: start.z,
      x2: betweenA.x,
      y2: betweenA.y,
      z2: betweenA.z,
      length: roundM(start.distanceTo(betweenA)),
      pipe: `${prev.pipe}-E-${name}1`,
      preceding: prev.pipe,
      isNotPipe: true,
      isElbow: true,
      elId: `${id}-I1`,
      params: {
        ...prev.params,
        connectorDegree: elbow.degree,
        startFlange: undefined,
        startFlangeClass: undefined,
        startFlangeType: undefined,
        endFlange: undefined,
        endFlangeClass: undefined,
        endFlangeType: undefined,
        numberOfSupports: undefined,
        supportDetails: undefined,
      },
    } as FreePipe;
    S1 = {
      ...S,
      id: index + 1,
      x1: betweenA.x,
      y1: betweenA.y,
      z1: betweenA.z,
      x2: centerA.x,
      y2: centerA.y,
      z2: centerA.z,
      length: roundM(betweenA.distanceTo(centerA)),
      pipe: `${prev.pipe}-E-${name}2`,
      preceding: S.pipe,
      elId: `${id}-I2`,
    } as FreePipe;
    S2 = {
      ...next,
      id: index + 2,
      x1: centerA.x,
      y1: centerA.y,
      z1: centerA.z,
      x2: betweenB.x,
      y2: betweenB.y,
      z2: betweenB.z,
      length: roundM(centerA.distanceTo(betweenB)),
      pipe: `${next.pipe}-S-${name}1`,
      preceding: S1.pipe,
      isNotPipe: true,
      isElbow: true,
      elId: `${id}-I3`,
      params: { ...S.params },
    } as FreePipe;
    E = {
      ...S2,
      id: index + 3,
      x1: betweenB.x,
      y1: betweenB.y,
      z1: betweenB.z,
      x2: end.x,
      y2: end.y,
      z2: end.z,
      length: roundM(betweenB.distanceTo(end)),
      pipe: `${next.pipe}-S-${name}2`,
      preceding: S2.pipe,
      elId: `${id}-O`,
    } as FreePipe;
  } else if (id === "BWSM") {
    const curve = new QuadraticBezierCurve3(start, center, end);
    const thetaPercent =
      (prev.params.endConnectorDetails?.Theta ?? 0) / elbow.degree;
    const betweenA = roundVectorM(curve.getPointAt(thetaPercent));
    const betweenB = roundVectorM(curve.getPointAt(1 - thetaPercent));
    S = {
      ...prev,
      id: index,
      x1: start.x,
      y1: start.y,
      z1: start.z,
      x2: betweenA.x,
      y2: betweenA.y,
      z2: betweenA.z,
      length: roundM(start.distanceTo(betweenA)),
      pipe: `${prev.pipe}-E-${name}1`,
      preceding: prev.pipe,
      isNotPipe: true,
      isElbow: true,
      elId: `${id}-I1`,
      params: {
        ...prev.params,
        connectorDegree: elbow.degree,
        startFlange: undefined,
        startFlangeClass: undefined,
        startFlangeType: undefined,
        endFlange: undefined,
        endFlangeClass: undefined,
        endFlangeType: undefined,
        numberOfSupports: undefined,
        supportDetails: undefined,
      },
    } as FreePipe;
    S1 = {
      ...S,
      id: index + 1,
      x1: betweenA.x,
      y1: betweenA.y,
      z1: betweenA.z,
      x2: betweenB.x,
      y2: betweenB.y,
      z2: betweenB.z,
      length: roundM(betweenA.distanceTo(betweenB)),
      pipe: `${prev.pipe}-E-${name}2`,
      preceding: S.pipe,
      elId: `${id}-I2`,
    } as FreePipe;
    E = {
      ...S1,
      id: index + 2,
      x1: betweenB.x,
      y1: betweenB.y,
      z1: betweenB.z,
      x2: end.x,
      y2: end.y,
      z2: end.z,
      length: roundM(betweenB.distanceTo(end)),
      pipe: `${next.pipe}-S-${name}`,
      preceding: S1.pipe,
      elId: `${id}-O`,
    } as FreePipe;
  }

  const res = [
    ...pipes.map((pp) => {
      if (pp.id === prev.id) {
        return {
          ...prev,
          x2: endA.x,
          y2: endA.y,
          z2: endA.z,
          params: {
            ...prev.params,
            supportDetails: prev.params.supportDetails?.filter(
              (supp) => supp.distance <= fixedTo
            ),
          },
        };
      }
      if (pp.id === next.id) {
        return {
          ...next,
          x1: startB.x,
          y1: startB.y,
          z1: startB.z,
          preceding: E.pipe,
          params: {
            ...next.params,
            supportDetails: next.params.supportDetails
              ?.filter((supp) => supp.distance >= fixedFrom)
              .map((supp) => ({
                ...supp,
                distance: supp.distance - fixedFrom,
              })),
          },
        };
      }
      return pp;
    }),
  ];

  res.push(S);
  if (S1) res.push(S1);
  if (S2) res.push(S2);
  res.push(E);

  return res;
}

export function createJSONReturn(
  pipes: FreePipe[],
  prev: FreePipe,
  next: FreePipe
) {
  const startA = roundVectorM(new Vector3(prev.x1, prev.y1, prev.z1));
  const endA = roundVectorM(new Vector3(prev.x2, prev.y2, prev.z2));
  const startB = roundVectorM(new Vector3(next.x1, next.y1, next.z1));
  const endB = roundVectorM(new Vector3(next.x2, next.y2, next.z2));

  const returning = prev.params.endConnector as TPipingReturn;
  const offset = MMtoM((returning.k ?? 0) - (returning.d ?? 0) / 2);
  const start = roundVectorM(
    getPosByDistance(startA.distanceTo(endA) + offset, startA, endA)
  );
  const end = roundVectorM(getPosByDistance(-offset, startB, endB));
  const center = roundVectorM(start.add(end).divideScalar(2));

  const name = `${returning.shape === "LR RETURNS" ? "LRR" : "SRR"}`;

  const index = getNextId(pipes);

  const A: FreePipe = {
    ...prev,
    id: index,
    x1: endA.x,
    y1: endA.y,
    z1: endA.z,
    x2: center.x,
    y2: center.y,
    z2: center.z,
    length: roundM(endA.distanceTo(center)),
    pipe: `${prev.pipe}-E-${name}`,
    preceding: prev.pipe,
    // @ts-ignore
    isNotPipe: true,
    // @ts-ignore
    isReturn: true,
    params: {
      ...prev.params,
      startFlange: undefined,
      startFlangeClass: undefined,
      startFlangeType: undefined,
      endFlange: undefined,
      endFlangeClass: undefined,
      endFlangeType: undefined,
      numberOfSupports: undefined,
      supportDetails: undefined,
    },
  };

  const B: FreePipe = {
    ...next,
    id: index + 1,
    x1: center.x,
    y1: center.y,
    z1: center.z,
    x2: startB.x,
    y2: startB.y,
    z2: startB.z,
    length: roundM(center.distanceTo(startB)),
    pipe: `${next.pipe}-S-${name}`,
    preceding: A.pipe,
    // @ts-ignore
    isNotPipe: true,
    // @ts-ignore
    isReturn: true,
    params: A.params,
  };

  return [
    ...pipes.map((pp) => {
      if (pp.id === prev.id) {
        return { ...prev, x2: endA.x, y2: endA.y, z2: endA.z };
      }
      if (pp.id === next.id) {
        return {
          ...next,
          x1: startB.x,
          y1: startB.y,
          z1: startB.z,
          preceding: B.pipe,
        };
      }
      return pp;
    }),
    A,
    B,
  ];
}

export function createJSONReducer(
  pipes: FreePipe[],
  prev: FreePipe,
  next: FreePipe
) {
  const startA = roundVectorM(new Vector3(prev.x1, prev.y1, prev.z1));
  const endA = roundVectorM(new Vector3(prev.x2, prev.y2, prev.z2));
  const startB = roundVectorM(new Vector3(next.x1, next.y1, next.z1));
  const endB = roundVectorM(new Vector3(next.x2, next.y2, next.z2));

  const reducer = prev.params.endConnector as TPipingReducer;
  const h = MMtoM(reducer.h ?? 0) / 2;
  const start = roundVectorM(
    getPosByDistance(startA.distanceTo(endA) - h, startA, endA)
  );
  const end = roundVectorM(getPosByDistance(h, startB, endB));

  endA.copy(start);
  const fixedTo = roundM(startA.distanceTo(endA));

  const fixedFrom = roundM(startB.distanceTo(end));
  startB.copy(end);

  const name = "RC"; // TODO

  const A: FreePipe = {
    ...prev,
    id: getNextId(pipes),
    x1: start.x,
    y1: start.y,
    z1: start.z,
    x2: end.x,
    y2: end.y,
    z2: end.z,
    length: roundM(start.distanceTo(end)),
    pipe: `${prev.pipe}-${name}-${next.pipe}`,
    preceding: prev.pipe,
    // @ts-ignore
    isNotPipe: true,
    // @ts-ignore
    isReducer: true,
    // @ts-ignore
    dir: (prev.params.od ?? 0) > (next.params.od ?? 0) ? ">" : "<",
    params: {
      ...prev.params,
      startFlange: undefined,
      startFlangeClass: undefined,
      startFlangeType: undefined,
      endFlange: undefined,
      endFlangeClass: undefined,
      endFlangeType: undefined,
      numberOfSupports: undefined,
      supportDetails: undefined,
    },
  };

  return [
    ...pipes.map((pp) => {
      if (pp.id === prev.id) {
        return {
          ...prev,
          x2: endA.x,
          y2: endA.y,
          z2: endA.z,
          params: {
            ...prev.params,
            supportDetails: prev.params.supportDetails?.filter(
              (supp) => supp.distance <= fixedTo
            ),
          },
        };
      }
      if (pp.id === next.id) {
        return {
          ...next,
          x1: startB.x,
          y1: startB.y,
          z1: startB.z,
          preceding: A.pipe,
          params: {
            ...next.params,
            supportDetails: next.params.supportDetails
              ?.filter((supp) => supp.distance >= fixedFrom)
              .map((supp) => ({
                ...supp,
                distance: supp.distance - fixedFrom,
              })),
          },
        };
      }
      return pp;
    }),
    A,
  ];
}

export function createJSONTee(pipes: FreePipe[], prev: FreePipe) {
  const next0 = pipes.find(
    (pp) => pp.preceding === prev.pipe && getAngle(pp, prev) === 0
  );
  const next90 = pipes.find(
    (pp) => pp.preceding === prev.pipe && getAngle(pp, prev) === 90
  );

  if (next0 && next90) {
    const startA = roundVectorM(new Vector3(prev.x1, prev.y1, prev.z1));
    const endA = roundVectorM(new Vector3(prev.x2, prev.y2, prev.z2));

    const startB = roundVectorM(new Vector3(next0.x1, next0.y1, next0.z1));
    const endB = roundVectorM(new Vector3(next0.x2, next0.y2, next0.z2));

    const startC = roundVectorM(new Vector3(next90.x1, next90.y1, next90.z1));
    const endC = roundVectorM(new Vector3(next90.x2, next90.y2, next90.z2));

    const tee = prev.params.endConnector as TPipingTee;
    const c = MMtoM(tee.c ?? 0);
    const m = MMtoM(tee.m ?? tee.c ?? 0);
    const nps = tee.nps.split(" x ");
    const startFromA = roundVectorM(
      getPosByDistance(startA.distanceTo(endA) - c, startA, endA)
    );
    const center = endA.clone();
    const endFromB = roundVectorM(getPosByDistance(c, startB, endB));
    const endFromC = roundVectorM(getPosByDistance(m, startC, endC));

    endA.copy(startFromA);
    const fixedTo = roundM(startA.distanceTo(endA));

    const fixedFromB = roundM(startB.distanceTo(endFromB));
    startB.copy(endFromB);

    const fixedFromC = roundM(startC.distanceTo(endFromC));
    startC.copy(endFromC);

    const name = nps.length > 1 ? "TR" : "T";
    const id = prev.params.endConnectorDetails?.type ?? "";

    const index = getNextId(pipes);

    const A: FreePipe = {
      ...prev,
      id: index,
      x1: startFromA.x,
      y1: startFromA.y,
      z1: startFromA.z,
      x2: center.x,
      y2: center.y,
      z2: center.z,
      length: roundM(startFromA.distanceTo(center)),
      pipe: `${prev.pipe}-E-${name}`,
      preceding: prev.pipe,
      // @ts-ignore
      isNotPipe: true,
      // @ts-ignore
      isTee: true,
      // @ts-ignore
      elId: `${id}-I`,
      params: {
        ...prev.params,
        startFlange: undefined,
        startFlangeClass: undefined,
        startFlangeType: undefined,
        endFlange: undefined,
        endFlangeClass: undefined,
        endFlangeType: undefined,
        numberOfSupports: undefined,
        supportDetails: undefined,
      },
    };

    const B: FreePipe = {
      ...next0,
      id: index + 1,
      x1: center.x,
      y1: center.y,
      z1: center.z,
      x2: endFromB.x,
      y2: endFromB.y,
      z2: endFromB.z,
      length: roundM(center.distanceTo(endFromB)),
      pipe: `${next0.pipe}-S-${name}`,
      preceding: A.pipe,
      // @ts-ignore
      isNotPipe: true,
      // @ts-ignore
      isTee: true,
      // @ts-ignore
      elId: `${id}-O`,
      params: {
        ...next0.params,
        endConnectorType: prev.params.endConnectorType,
        endConnector: prev.params.endConnector,
        endConnectorDetails: prev.params.endConnectorDetails,
        startFlange: undefined,
        startFlangeClass: undefined,
        startFlangeType: undefined,
        endFlange: undefined,
        endFlangeClass: undefined,
        endFlangeType: undefined,
        numberOfSupports: undefined,
        supportDetails: undefined,
      },
    };

    const C: FreePipe = {
      ...next90,
      id: index + 2,
      x1: center.x,
      y1: center.y,
      z1: center.z,
      x2: endFromC.x,
      y2: endFromC.y,
      z2: endFromC.z,
      length: roundM(center.distanceTo(endFromC)),
      pipe: `${next90.pipe}-S-${name}`,
      preceding: A.pipe,
      // @ts-ignore
      isNotPipe: true,
      // @ts-ignore
      isTee: true,
      // @ts-ignore
      elId: `${id}-B`,
      params: {
        ...next90.params,
        endConnectorType: prev.params.endConnectorType,
        endConnector: prev.params.endConnector,
        endConnectorDetails: prev.params.endConnectorDetails,
        startFlange: undefined,
        startFlangeClass: undefined,
        startFlangeType: undefined,
        endFlange: undefined,
        endFlangeClass: undefined,
        endFlangeType: undefined,
        numberOfSupports: undefined,
        supportDetails: undefined,
      },
    };

    return [
      ...pipes.map((pp) => {
        if (pp.id === prev.id) {
          return {
            ...prev,
            x2: endA.x,
            y2: endA.y,
            z2: endA.z,
            params: {
              ...prev.params,
              supportDetails: prev.params.supportDetails?.filter(
                (supp) => supp.distance <= fixedTo
              ),
            },
          };
        }
        if (pp.id === next0.id) {
          return {
            ...next0,
            x1: startB.x,
            y1: startB.y,
            z1: startB.z,
            preceding: B.pipe,
            params: {
              ...next0.params,
              supportDetails: next0.params.supportDetails
                ?.filter((supp) => supp.distance >= fixedFromB)
                .map((supp) => ({
                  ...supp,
                  distance: supp.distance - fixedFromB,
                })),
            },
          };
        }
        if (pp.id === next90.id) {
          return {
            ...next90,
            x1: startC.x,
            y1: startC.y,
            z1: startC.z,
            preceding: C.pipe,
            params: {
              ...next90.params,
              supportDetails: next90.params.supportDetails
                ?.filter((supp) => supp.distance >= fixedFromC)
                .map((supp) => ({
                  ...supp,
                  distance: supp.distance - fixedFromC,
                })),
            },
          };
        }
        return pp;
      }),
      A,
      B,
      C,
    ];
  } else if (next90) {
    const next90_2 = pipes.find(
      (pp) =>
        pp.preceding === prev.pipe &&
        pp.pipe !== next90.pipe &&
        getAngle(pp, prev) === 90
    );
    if (!next90_2) return pipes;

    const startA = roundVectorM(new Vector3(prev.x1, prev.y1, prev.z1));
    const endA = roundVectorM(new Vector3(prev.x2, prev.y2, prev.z2));

    const startB = roundVectorM(new Vector3(next90.x1, next90.y1, next90.z1));
    const endB = roundVectorM(new Vector3(next90.x2, next90.y2, next90.z2));

    const startC = roundVectorM(
      new Vector3(next90_2.x1, next90_2.y1, next90_2.z1)
    );
    const endC = roundVectorM(
      new Vector3(next90_2.x2, next90_2.y2, next90_2.z2)
    );

    const tee = prev.params.endConnector as TPipingTee;
    const c = MMtoM(tee.c ?? 0);
    const m = MMtoM(tee.c ?? 0);
    const nps = tee.nps.split(" x ");
    const startFromA = roundVectorM(
      getPosByDistance(startA.distanceTo(endA) - c, startA, endA)
    );
    const center = endA.clone();
    const endFromB = roundVectorM(getPosByDistance(c, startB, endB));
    const endFromC = roundVectorM(getPosByDistance(m, startC, endC));

    endA.copy(startFromA);
    const fixedTo = roundM(startA.distanceTo(endA));

    const fixedFromB = roundM(startB.distanceTo(endFromB));
    startB.copy(endFromB);

    const fixedFromC = roundM(startC.distanceTo(endFromC));
    startC.copy(endFromC);

    const name = nps.length > 1 ? "TR" : "T";
    const id = prev.params.endConnectorDetails?.type ?? "";

    const index = getNextId(pipes);

    const A: FreePipe = {
      ...prev,
      id: index,
      x1: startFromA.x,
      y1: startFromA.y,
      z1: startFromA.z,
      x2: center.x,
      y2: center.y,
      z2: center.z,
      length: roundM(startFromA.distanceTo(center)),
      pipe: `${prev.pipe}-E-${name}`,
      preceding: prev.pipe,
      // @ts-ignore
      isNotPipe: true,
      // @ts-ignore
      isTee: true,
      // @ts-ignore
      elId: `${id}-I`,
      params: {
        ...prev.params,
        startFlange: undefined,
        startFlangeClass: undefined,
        startFlangeType: undefined,
        endFlange: undefined,
        endFlangeClass: undefined,
        endFlangeType: undefined,
        numberOfSupports: undefined,
        supportDetails: undefined,
      },
    };

    const B: FreePipe = {
      ...next90,
      id: index + 1,
      x1: center.x,
      y1: center.y,
      z1: center.z,
      x2: endFromB.x,
      y2: endFromB.y,
      z2: endFromB.z,
      length: roundM(center.distanceTo(endFromB)),
      pipe: `${next90.pipe}-S-${name}`,
      preceding: A.pipe,
      // @ts-ignore
      isNotPipe: true,
      // @ts-ignore
      isTee: true,
      // @ts-ignore
      elId: `${id}-O`,
      params: {
        ...next90.params,
        startFlange: undefined,
        startFlangeClass: undefined,
        startFlangeType: undefined,
        endFlange: undefined,
        endFlangeClass: undefined,
        endFlangeType: undefined,
        numberOfSupports: undefined,
        supportDetails: undefined,
      },
    };

    const C: FreePipe = {
      ...next90_2,
      id: index + 2,
      x1: center.x,
      y1: center.y,
      z1: center.z,
      x2: endFromC.x,
      y2: endFromC.y,
      z2: endFromC.z,
      length: roundM(center.distanceTo(endFromC)),
      pipe: `${next90_2.pipe}-S-${name}`,
      preceding: A.pipe,
      // @ts-ignore
      isNotPipe: true,
      // @ts-ignore
      isTee: true,
      // @ts-ignore
      elId: `${id}-B`,
      params: {
        ...next90_2.params,
        startFlange: undefined,
        startFlangeClass: undefined,
        startFlangeType: undefined,
        endFlange: undefined,
        endFlangeClass: undefined,
        endFlangeType: undefined,
        numberOfSupports: undefined,
        supportDetails: undefined,
      },
    };

    return [
      ...pipes.map((pp) => {
        if (pp.id === prev.id) {
          return {
            ...prev,
            x2: endA.x,
            y2: endA.y,
            z2: endA.z,
            params: {
              ...prev.params,
              supportDetails: prev.params.supportDetails?.filter(
                (supp) => supp.distance <= fixedTo
              ),
            },
          };
        }
        if (pp.id === next90.id) {
          return {
            ...next90,
            x1: startB.x,
            y1: startB.y,
            z1: startB.z,
            preceding: B.pipe,
            params: {
              ...next90.params,
              supportDetails: next90.params.supportDetails
                ?.filter((supp) => supp.distance >= fixedFromB)
                .map((supp) => ({
                  ...supp,
                  distance: supp.distance - fixedFromB,
                })),
            },
          };
        }
        if (pp.id === next90_2.id) {
          return {
            ...next90_2,
            x1: startC.x,
            y1: startC.y,
            z1: startC.z,
            preceding: C.pipe,
            params: {
              ...next90_2.params,
              supportDetails: next90_2.params.supportDetails
                ?.filter((supp) => supp.distance >= fixedFromC)
                .map((supp) => ({
                  ...supp,
                  distance: supp.distance - fixedFromC,
                })),
            },
          };
        }
        return pp;
      }),
      A,
      B,
      C,
    ];
  }
  return pipes;
}

export function getNodesAndMembers(project: Project, pipes: FreePipe[]) {
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

  const pipeItems: any[] = [];
  newPipes.sort((a, b) => {
    // sort pipes from start to end pipe line
    if (a.pipe === b.preceding) return -1;
    if (b.pipe === a.preceding) return 1;
    return -1;
  });

  for (const pipe of newPipes) {
    let index = 1;

    const sp = roundVectorM(new Vector3(pipe.x1, pipe.y1, pipe.z1));
    const ep = roundVectorM(new Vector3(pipe.x2, pipe.y2, pipe.z2));

    const points: Vector3[] = [sp, ep];

    pipe.params.supportDetails?.forEach((sup) => {
      if (sup.type === "Slave Node") {
        const master = pipes.find(
          (p) => p.line === pipe.line && p.pipe === sup.masterNodePipe
        );
        if (master) {
          const pos = roundVectorM(getPosByDistance(sup.distance, sp, ep));
          points.push(pos);
        }
      } else {
        const pos = roundVectorM(getPosByDistance(sup.distance, sp, ep));
        points.push(pos);
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
            points.push(pos);
          }
        });
      });

    points
      .reduce(
        (acc, v) => (!acc.some((el) => el.equals(v)) ? [...acc, v] : acc),
        [] as Vector3[]
      )
      .sort((a, b) =>
        a.x === b.x ? (a.y === b.y ? a.z - b.z : a.y - b.y) : a.x - b.x
      );

    if ((pipe as any).isNotPipe) {
      pipeItems.push({
        name: `${pipe.pipe}`,
        startPos: sp.clone(),
        endPos: ep.clone(),
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
          pipeItems.push({
            name: `${pipe.pipe}.${index}`,
            startPos: startPos.clone(),
            endPos: pos.clone(),
          });
          x = pos.x;
          y = pos.y;
          z = pos.z;
          distance = roundM(distance - discretization);
          index++;
        }
      }
    }
  }

  // newPipes.forEach((pipe) => {});
  return pipeItems;
}

export function drawPipingLoads(
  pipes: FreePipe[],
  dLoads: TPipeDeadLoad,
  wLoads: TPipeWindLoad,
  font: Font
) {
  const group = new Group();
  group.name = "PIPING-LOADS";

  for (const pipe of pipes) {
    const { start, end } = getPipePoints(pipe);

    const xLoads = new Map<number, number>();
    const yLoads = new Map<number, number>();
    const zLoads = new Map<number, number>();

    const deadLoads = dLoads.loads.filter((l) => l.element === pipe.pipe);
    const windLoads = wLoads.loads.filter((l) => l.element === pipe.pipe);

    for (const load of deadLoads) {
      const { distance, Fx, Fy, Fz } = load;
      const xLoad = xLoads.get(distance) ?? 0;
      const yLoad = yLoads.get(distance) ?? 0;
      const zLoad = zLoads.get(distance) ?? 0;

      Fx && xLoads.set(distance, roundM(xLoad + Fx));
      Fy && yLoads.set(distance, roundM(yLoad + Fy));
      Fz && zLoads.set(distance, roundM(zLoad + Fz));
    }

    for (const load of windLoads) {
      const { distance, Fx, Fy, Fz } = load;
      const xLoad = xLoads.get(distance) ?? 0;
      const yLoad = yLoads.get(distance) ?? 0;
      const zLoad = zLoads.get(distance) ?? 0;

      Fx && xLoads.set(distance, roundM(xLoad + Fx));
      Fy && yLoads.set(distance, roundM(yLoad + Fy));
      Fz && zLoads.set(distance, roundM(zLoad + Fz));
    }

    for (const [distance, value] of Array.from(xLoads.entries())) {
      if (!value) continue;
      const isNegative = value < 0;
      const position = getPosByDistance(distance, start, end);
      const arrow = new ArrowHelper(
        isNegative ? vX.clone().multiplyScalar(-1) : vX,
        isNegative ? position.add(vX) : position,
        1,
        blueHex
      );
      createText(
        arrow,
        font,
        `Fx: ${value} (kg & m)`,
        isNegative ? new Vector3() : vY,
        isNegative ? 0 : deg180InRad,
        isNegative ? deg90InRad : -deg90InRad,
        "black"
      );
      group.add(arrow);
    }

    for (const [distance, value] of Array.from(yLoads.entries())) {
      if (!value) continue;
      const isNegative = value < 0;
      const position = getPosByDistance(distance, start, end);
      const arrow = new ArrowHelper(
        isNegative ? vY.clone().multiplyScalar(-1) : vY,
        isNegative ? position.add(vY) : position,
        1,
        redHex
      );
      createText(
        arrow,
        font,
        `Fy: ${value} (kg & m)`,
        isNegative ? new Vector3() : vY,
        isNegative ? deg180InRad : 0,
        0,
        "black"
      );
      group.add(arrow);
    }

    for (const [distance, value] of Array.from(zLoads.entries())) {
      if (!value) continue;
      const isNegative = value < 0;
      const position = getPosByDistance(distance, start, end);
      const arrow = new ArrowHelper(
        isNegative ? vZ.clone().multiplyScalar(-1) : vZ,
        isNegative ? position.add(vZ) : position,
        1,
        greenHex
      );
      createText(
        arrow,
        font,
        `Fz: ${value} (kg & m)`,
        isNegative ? new Vector3() : vY,
        isNegative ? 0 : deg180InRad,
        0,
        "black"
      );
      group.add(arrow);
    }
  }
  return group;
}

function createText(
  parent: THREE.Object3D,
  font: THREE.Font,
  text: string,
  pos: THREE.Vector3,
  rX?: number,
  rY?: number,
  color?: string
) {
  const textParameters = { font, size: 0.1, height: 0.003, curveSegments: 1 };
  const geometry = new TextGeometry(text, textParameters);
  geometry.center();
  const mesh = new Mesh(
    geometry,
    new MeshLambertMaterial({ color, side: DoubleSide })
  );
  mesh.position.copy(pos);
  rX && mesh.rotateX(rX);
  rY && mesh.rotateY(rY);
  parent.add(mesh);
}
