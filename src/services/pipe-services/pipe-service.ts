import {
  CylinderGeometry,
  Mesh,
  Quaternion,
  SphereGeometry,
  Vector3,
} from "three";
import {
  continuePipe,
  getAngle,
  rotationV,
} from "../../components/3d-models/pipes/pipesUtils";
import {
  getNextId,
  getPosByDistance,
  MMtoM,
  radToDeg,
  roundM,
  roundVectorM,
} from "../../components/3d-models/utils";
import {
  TMousePipeCreatingAtom,
  TPipeFlangeParams,
  TPipeSegmentParams,
} from "../../recoil/atoms/process-atoms";
import {
  DataState,
  TPipingAccessory,
  TPipingElbow,
  TPipingFlange,
  TPipingReturn,
  TPipingTee,
} from "../../store/data/types";
import { deg90InRad, initialPipe } from "../../store/main/constants";
import {
  FreePipe,
  PipeConnectorType,
  TFlangeType,
  TSupportDetail,
} from "../../store/main/types";
import {
  EPipeElementType,
  TProcessElement,
  TProcessLine,
} from "../../store/process/types";
import { dropZoneMaterial } from "../process-services/mouse-pipe-creating-service";

type TCreateNextPipe = {
  pipes: FreePipe[];
  start?: Vector3;
  end?: Vector3;
  params?: TPipeSegmentParams;
  prev?: number;
  processLine?: number;
};

export type TPipeElementAnchor = {
  pipe?: FreePipe;
  type?: PipeConnectorType;
  data?: any;
  position?: Vector3;
  isPipe?: boolean;
  processLine?: TProcessLine;
  segmentId?: number;
  valve?: TProcessElement;
  isDimensionAnchor?: boolean;
  setEndConnector?: (
    pipe: FreePipe,
    pipes: FreePipe[],
    type: PipeConnectorType,
    data: any
  ) => FreePipe[];
  setSupp?: (pipe: FreePipe, pipes: FreePipe[], pos: Vector3) => FreePipe[];
  setFlange?: (
    pipe: FreePipe,
    pipes: FreePipe[],
    pos: Vector3,
    data: TPipeFlangeParams
  ) => FreePipe[];
};

export function getPipePoints(pipe: FreePipe) {
  const start = new Vector3(pipe.x1, pipe.y1, pipe.z1);
  const end = new Vector3(pipe.x2, pipe.y2, pipe.z2);
  return { start, end };
}

export function isPrevConnector(pipe: FreePipe, pipes: FreePipe[]) {
  const prevs = pipes.filter((p) => p.pipe === pipe.preceding);
  return prevs.some((p) => p.params.endConnector);
}

export function getPipeLinesMap(pipes: FreePipe[]) {
  const map = new Map<number, FreePipe[]>();
  for (const pipe of pipes) {
    const line = map.get(pipe.line);
    if (line) {
      map.set(pipe.line, [...line, pipe]);
    } else map.set(pipe.line, [pipe]);
  }
  return map;
}

export function createNextPipe(props: TCreateNextPipe) {
  const id = getNextId(props.pipes);
  let pipe = setStartAndEndPointsToPipe(
    {
      ...initialPipe,
      id,
      line: id,
      pipe: `PP${id}`,
      processLine: props.processLine,
    },
    props.start,
    props.end
  );
  pipe = changePipeByPrev(
    pipe,
    props.pipes.find((p) => p.id === props.prev)
  );
  pipe = changePipeByPipeSegmentParams(pipe, props.params);
  return pipe;
}

function setStartAndEndPointsToPipe(
  pipe: FreePipe,
  start?: Vector3,
  end?: Vector3
) {
  let changed: FreePipe = { ...pipe };
  if (start && end) {
    changed = {
      ...changed,
      x1: roundM(start.x),
      y1: roundM(start.y),
      z1: roundM(start.z),
      x2: roundM(end.x),
      y2: roundM(end.y),
      z2: roundM(end.z),
      length: roundM(start.distanceTo(end)),
      elevation: roundM((start.y + end.y) / 2),
    };
  } else if (start) {
    changed = {
      ...changed,
      x1: roundM(start.x),
      y1: roundM(start.y),
      z1: roundM(start.z),
      x2: roundM(start.x),
      y2: roundM(start.y),
      z2: roundM(start.z),
      length: 0,
      elevation: roundM(start.y),
    };
  } else if (end) {
    changed = {
      ...changed,
      x1: roundM(end.x),
      y1: roundM(end.y),
      z1: roundM(end.z),
      x2: roundM(end.x),
      y2: roundM(end.y),
      z2: roundM(end.z),
      length: 0,
      elevation: roundM(end.y),
    };
  }
  return changed;
}

export function getPrecedingDirs(prev: FreePipe | undefined, pipe: FreePipe) {
  if (!prev) return { hDir: 0, vDir: 0 };

  const prevVector = new Vector3(
    prev.x2 - prev.x1,
    prev.y2 - prev.y1,
    prev.z2 - prev.z1
  ).normalize();

  const pipeVector = new Vector3(
    pipe.x2 - pipe.x1,
    pipe.y2 - pipe.y1,
    pipe.z2 - pipe.z1
  ).normalize();

  const normalZ = new Vector3(0, 0, 1);

  const quat = new Quaternion()
    .setFromUnitVectors(normalZ, prevVector)
    .inverse();

  pipeVector.normalize();
  pipeVector.applyQuaternion(quat);
  pipeVector.normalize();

  const pipeVectorH = pipeVector.clone().setY(0);
  const pipeVectorV = pipeVector.clone().setX(0);

  const hDir = pipeVectorH.length()
    ? radToDeg(normalZ.angleTo(pipeVectorH)) * -pipeVector.x
    : 0;
  const vDir = pipeVectorV.length()
    ? radToDeg(normalZ.angleTo(pipeVectorV)) * pipeVectorV.y
    : 0;

  return { hDir, vDir };
}

export function changePipeByPrev(pipe: FreePipe, prev?: FreePipe) {
  if (!prev) return pipe;
  const changed: FreePipe = {
    ...pipe,
    ...getPrecedingDirs(prev, pipe),
    preceding: prev.pipe,
    line: prev.line,
    params: { ...pipe.params },
    length: roundM(
      new Vector3(pipe.x1, pipe.y1, pipe.z1).distanceTo(
        new Vector3(pipe.x2, pipe.y2, pipe.z2)
      )
    ),
    elevation: roundM((pipe.y1 + pipe.y2) / 2),
  };
  return removeIndividualParams(changed);
}

function changePipeByPipeSegmentParams(
  pipe: FreePipe,
  params?: TPipeSegmentParams
) {
  if (!params) return pipe;
  const changed: FreePipe = {
    ...pipe,
    params: {
      ...pipe.params,
      lib: params.lib,
      nps: params.nps,
      profile: params.profile,
      od: params.profile?.outside_diameter_global,
      thickness: params.profile?.wall_thickness_global,
      corrosionAllowance: params.corAllow,
      millTolerance: params.millToll,
      material: params.material,
      longWeldType: params.longWeldType,
    },
  };
  return changed;
}

function removeIndividualParams(pipe: FreePipe): FreePipe {
  return {
    ...pipe,
    params: {
      ...pipe.params,
      endConnector: undefined,
      endConnectorDetails: undefined,
      endConnectorType: undefined,
      startFlange: undefined,
      startFlangeClass: undefined,
      startFlangeLoads: undefined,
      startFlangeType: undefined,
      endFlange: undefined,
      endFlangeClass: undefined,
      endFlangeLoads: undefined,
      endFlangeType: undefined,
      numberOfSupports: undefined,
      reducerType: undefined,
      supportDetails: undefined,
      valveActuator: undefined,
      valveControl: undefined,
      valvePosition: undefined,
      valveType: undefined,
    },
  };
}

export function createPipeElementАnchors(
  pipe: FreePipe,
  nexts: FreePipe[],
  offset: number,
  MPCState: TMousePipeCreatingAtom,
  resoures: DataState,
  UDEs: TPipingElbow[]
) {
  const meshes: Mesh[] = [];
  if (MPCState.processPipeElement === EPipeElementType.PIPE) {
    const mesh = createPipeAnchor(MPCState, pipe, nexts, offset);
    for (const m of mesh) {
      meshes.push(m);
    }
  } else if (
    MPCState.processPipeElement === EPipeElementType.ELBOW ||
    MPCState.processPipeElement === EPipeElementType.UDE
  ) {
    const mesh = createElbowAnchor(pipe, nexts, resoures, UDEs, offset);
    mesh && meshes.push(mesh);
  } else if (MPCState.processPipeElement === EPipeElementType.REDUCER) {
    const mesh = createReducerAnchor(pipe, nexts, resoures, offset);
    mesh && meshes.push(mesh);
  } else if (MPCState.processPipeElement === EPipeElementType.TEE) {
    const mesh = createTeeAnchor(pipe, nexts, resoures, offset);
    mesh && meshes.push(mesh);
  } else if (MPCState.processPipeElement === EPipeElementType.RETURN) {
    const mesh = createReturnAnchor(pipe, nexts, resoures, offset);
    mesh && meshes.push(mesh);
  } else if (MPCState.processPipeElement === EPipeElementType.CAP) {
    const mesh = createCapAnchor(pipe, nexts, resoures, offset);
    mesh && meshes.push(mesh);
  } else if (MPCState.processPipeElement === EPipeElementType.SUPP) {
    const mesh = createSuppMesh(pipe, offset);
    mesh && meshes.push(mesh);
  } else if (MPCState.processPipeElement === EPipeElementType.FLANGE) {
    const mesh = createFlangeMesh(
      pipe,
      {
        ...MPCState.pipeFlangeParams,
        flange: getFlanges(MPCState.pipeFlangeParams?.type, resoures).find(
          (f) =>
            f.class === MPCState.pipeFlangeParams?.class &&
            f.nps === pipe.params.profile?.nominal_pipe_size_inch
        ),
      },
      offset
    );
    mesh?.forEach((m) => meshes.push(m));
  }
  //  else if (MPCState.processPipeElement === EPipeElementType.DIMENSION) {
  //   const mesh = createDimensionAnchors(pipe, offset);
  //   mesh?.forEach((m) => meshes.push(m));
  // }
  return meshes;
}

function setEndConnector(
  pipe: FreePipe,
  pipes: FreePipe[],
  type: PipeConnectorType,
  data: TPipingAccessory
) {
  const tn =
    (data as TPipingElbow)?.t ??
    (data as TPipingTee)?.t1 ??
    (data as TPipingTee)?.t2 ??
    0;
  const d =
    (data as TPipingElbow)?.d ??
    (data as TPipingTee)?.d1 ??
    (data as TPipingTee)?.d2 ??
    0;
  const changed: FreePipe = {
    ...pipe,
    params: {
      ...pipe.params,
      endConnectorType: type,
      endConnector: data,
      endConnectorDetails:
        type === "Elbow" || type === "Tee"
          ? {
              type: type === "Elbow" ? "BWE" : "TW",
              tn,
              r: (d - tn) / 2,
              R: (data as TPipingElbow)?.a,
            }
          : undefined,
    },
  };
  let changedPipes = [...pipes];
  if (changed.params.endConnectorType === "Return") {
    const o = MMtoM((data as TPipingReturn).o);
    const startA = new Vector3(changed.x1, changed.y1, changed.z1);
    const endA = new Vector3(changed.x2, changed.y2, changed.z2);
    const next = pipes.find((item) => item.preceding === changed.pipe);
    if (next) {
      const start = endA.clone();
      const end = continuePipe(pipe, next);
      rotationV(start, end, next.length, next.hDir, 0);
      start.copy(
        roundVectorM(getPosByDistance(changed.length + o, startA, endA))
      );
      rotationV(endA, start, o, next.hDir < 0 ? -90 : 90, 0);
      rotationV(endA, start, o, 0, next.vDir);
      end.add(start.clone().sub(endA));
      changedPipes = changedPipes.map((fp) =>
        fp.id === next.id
          ? {
              ...fp,
              x1: start.x,
              y1: start.y,
              z1: start.z,
              x2: end.x,
              y2: end.y,
              z2: end.z,
            }
          : fp
      );
    }
  }
  changedPipes = changedPipes.map((item) =>
    item.id === changed.id ? changed : item
  );
  return changedPipes;
}

function setSupp(pipe: FreePipe, pipes: FreePipe[], pos: Vector3) {
  const { start, end } = getPipePoints(pipe);
  const length = start.distanceTo(end);
  const a = start.distanceTo(pos);
  const b = MMtoM(pipe.params.profile!.outside_diameter_global / 2);
  const distance = roundM(
    Math.max(0, Math.min(length, Math.sqrt(Math.pow(a, 2) - Math.pow(b, 2))))
  );
  const supp: TSupportDetail = {
    id: getNextId(pipe.params.supportDetails),
    type: "Anchor",
    distance,
    valueType: "K",
    Mu: 0,
  };
  const supps = pipe.params.supportDetails ?? [];
  const changed: FreePipe = {
    ...pipe,
    params: {
      ...pipe.params,
      supportDetails: [...supps, supp],
      numberOfSupports: (pipe.params.numberOfSupports ?? 0) + 1,
    },
  };
  return pipes.map((p) => (p.id === changed.id ? changed : p));
}

function setFlange(pipe: FreePipe, pipes: FreePipe[], pos: Vector3, data: any) {
  const { start } = getPipePoints(pipe);
  const prefix = start.equals(pos) ? "start" : "end";
  const changed: FreePipe = {
    ...pipe,
    params: {
      ...pipe.params,
      [`${prefix}FlangeType`]: data.type,
      [`${prefix}FlangeClass`]: data.class,
      [`${prefix}Flange`]: data.flange,
    },
  };
  return pipes.map((p) => (p.id === changed.id ? changed : p));
}

export function createAnchor(
  size: number,
  pos: Vector3,
  data: TPipeElementAnchor
) {
  const geometry = new SphereGeometry(size, 32, 32);
  const m = dropZoneMaterial.clone();
  m.opacity = 0.3;
  const anchorMesh = new Mesh(geometry, m);
  anchorMesh.name = "PIPE-ELEMENT-ANCHOR";
  anchorMesh.position.copy(pos);
  anchorMesh.userData = data;
  return anchorMesh;
}

function createSuppAnchor(
  size: number,
  length: number,
  data: TPipeElementAnchor
) {
  const r = size / 2;
  const geometry = new CylinderGeometry(r, r, length, 32);
  const m = dropZoneMaterial.clone();
  m.opacity = 0.3;
  const anchorMesh = new Mesh(geometry, m);
  anchorMesh.name = "PIPE-ELEMENT-ANCHOR";
  anchorMesh.userData = data;
  anchorMesh.position.setX(length / 2);
  anchorMesh.rotateZ(deg90InRad);
  return anchorMesh;
}

function createFlangeAnchor(
  size: number,
  distance: number,
  data: TPipeElementAnchor
) {
  const geometry = new SphereGeometry(size, 32, 32);
  const m = dropZoneMaterial.clone();
  m.opacity = 0.3;
  const anchorMesh = new Mesh(geometry, m);
  anchorMesh.name = "PIPE-ELEMENT-ANCHOR";
  anchorMesh.userData = data;
  anchorMesh.position.setX(distance);
  return anchorMesh;
}

function createPipeAnchor(
  MPCState: TMousePipeCreatingAtom,
  pipe: FreePipe,
  nexts: FreePipe[],
  offset: number
) {
  const size = MMtoM(
    (pipe.params.profile?.outside_diameter_global ?? 0.2) * 0.8
  );
  const { start, end } = getPipePoints(pipe);
  const anchorData: TPipeElementAnchor = { pipe, isPipe: true };
  const meshes: Mesh[] = [];
  if (
    (!pipe.preceding || pipe.preceding === "START") &&
    MPCState.prevPipeSegment &&
    MPCState.prevPipeSegment !== pipe.id
  ) {
    meshes.push(createAnchor(size, new Vector3(), anchorData));
  }
  if (nexts.length < 2 && !MPCState.prevPipeSegment) {
    meshes.push(
      createAnchor(
        size,
        new Vector3(start.distanceTo(end) - offset),
        anchorData
      )
    );
  }
  return meshes;
}

export function createLSAAnchor(
  pipe: FreePipe,
  type: "pipe" | "connector" | "start-flange" | "end-flange",
  setElement: (data: any) => any
) {
  const size = MMtoM(
    (pipe.params.profile?.outside_diameter_global ?? 0.2) * 0.8
  );
  const data: any = {
    pipe,
    type,
    isLSAAnchor: true,
    setElement,
  };
  const anchor = createAnchor(size, new Vector3(), data);
  anchor.name = "LSA-ANCHOR";
  return anchor;
}

function createElbowAnchor(
  pipe: FreePipe,
  nexts: FreePipe[],
  resoures: DataState,
  UDEs: TPipingElbow[],
  offset: number
) {
  if (
    !nexts.length ||
    nexts.length > 1 ||
    !pipe.params.profile ||
    pipe.params.endConnector
  )
    return;
  const next = nexts[0];
  const angle = getAngle(next, pipe);
  if (!angle) return;
  const absAngle = Math.abs(angle);
  const data =
    resoures.pipingElbows.find(
      (item) =>
        item.degree === absAngle &&
        item.nps === pipe.params.profile!.nominal_pipe_size_inch
    ) ??
    UDEs.find(
      (item) =>
        item.degree === absAngle &&
        item.nps === pipe.params.profile!.nominal_pipe_size_inch
    );
  if (!data) return;

  const { start, end } = getPipePoints(pipe);
  const pos = new Vector3(start.distanceTo(end) - offset);
  const anchorData: TPipeElementAnchor = {
    pipe,
    type: "Elbow" as PipeConnectorType,
    data,
    setEndConnector,
  };
  return createAnchor(
    MMtoM(pipe.params.profile.outside_diameter_global * 0.8),
    pos,
    anchorData
  );
}

function createReducerAnchor(
  pipe: FreePipe,
  nexts: FreePipe[],
  resoures: DataState,
  offset: number
) {
  if (
    !nexts.length ||
    nexts.length > 1 ||
    !pipe.params.profile ||
    pipe.params.endConnector
  )
    return;
  const next = nexts[0];
  const angle = getAngle(next, pipe);
  if (angle) return;

  const data = resoures.pipingReducers.find((item) => {
    const npss = item.nps.split(" x ");
    return nexts.length
      ? (npss[0] === pipe.params.profile!.nominal_pipe_size_inch &&
          npss[1] === nexts[0]?.params.nps) ||
          (npss[1] === pipe.params.profile!.nominal_pipe_size_inch &&
            npss[0] === nexts[0]?.params.nps)
      : npss[0] === pipe.params.profile!.nominal_pipe_size_inch ||
          npss[1] === pipe.params.profile!.nominal_pipe_size_inch;
  });
  if (!data) return;

  const { start, end } = getPipePoints(pipe);
  const pos = new Vector3(start.distanceTo(end) - offset);
  const anchorData: TPipeElementAnchor = {
    pipe,
    type: "Reducer" as PipeConnectorType,
    data,
    setEndConnector,
  };
  return createAnchor(
    MMtoM(pipe.params.profile.outside_diameter_global * 0.8),
    pos,
    anchorData
  );
}

function createTeeAnchor(
  pipe: FreePipe,
  nexts: FreePipe[],
  resoures: DataState,
  offset: number
) {
  if (!pipe.params.profile || pipe.params.endConnector) return;
  const next0 = nexts.find((item) => Math.abs(getAngle(item, pipe) || 0) === 0);
  const next90 = nexts.find(
    (item) => Math.abs(getAngle(item, pipe) || 0) === 90
  );
  const data = resoures.pipingTees.find((item) => {
    const npss = item.nps.split(" x ");
    if (npss[0] !== pipe.params.profile!.nominal_pipe_size_inch) return false;
    if (next0 && next90) {
      if (next0.params.nps !== next90.params.nps) {
        return npss[0] === next0.params.nps && npss[1] === next90.params.nps;
      }
      return (
        npss[0] === next0.params.nps &&
        (npss[1] ? npss[1] === next90.params.nps : true)
      );
    } else if (next0) {
      return npss[0] === next0.params.nps;
    } else if (next90) {
      return (npss[1] ?? npss[0]) === next90.params.nps;
    }
  });
  if (!data) return;

  const { start, end } = getPipePoints(pipe);
  const pos = new Vector3(start.distanceTo(end) - offset);
  const anchorData: TPipeElementAnchor = {
    pipe,
    type: "Tee" as PipeConnectorType,
    data,
    setEndConnector,
  };
  return createAnchor(
    MMtoM(pipe.params.profile.outside_diameter_global * 0.8),
    pos,
    anchorData
  );
}

function createReturnAnchor(
  pipe: FreePipe,
  nexts: FreePipe[],
  resoures: DataState,
  offset: number
) {
  if (
    !nexts.length ||
    nexts.length > 1 ||
    !pipe.params.profile ||
    pipe.params.endConnector
  )
    return;
  const next = nexts[0];
  const angle = getAngle(next, pipe);
  if (!angle) return;
  const absAngle = Math.abs(angle);
  const data = resoures.pipingReturns.some(
    (item) =>
      absAngle === 180 &&
      item.nps === pipe.params.profile!.nominal_pipe_size_inch
  );
  if (!data) return;

  const { start, end } = getPipePoints(pipe);
  const pos = new Vector3(start.distanceTo(end) - offset);
  const anchorData: TPipeElementAnchor = {
    pipe,
    type: "Return" as PipeConnectorType,
    data,
    setEndConnector,
  };
  return createAnchor(
    MMtoM(pipe.params.profile.outside_diameter_global * 0.8),
    pos,
    anchorData
  );
}

function createCapAnchor(
  pipe: FreePipe,
  nexts: FreePipe[],
  resoures: DataState,
  offset: number
) {
  if (!pipe.params.profile || nexts.length || pipe.params.endConnector) return;
  const data = resoures.pipingCaps.find(
    (item) => item.nps === pipe.params.profile!.nominal_pipe_size_inch
  );
  if (!data) return;

  const { start, end } = getPipePoints(pipe);
  const pos = new Vector3(start.distanceTo(end) - offset);
  const anchorData: TPipeElementAnchor = {
    pipe,
    type: "Cap" as PipeConnectorType,
    data,
    setEndConnector,
  };
  return createAnchor(
    MMtoM(pipe.params.profile.outside_diameter_global * 0.8),
    pos,
    anchorData
  );
}

function createSuppMesh(pipe: FreePipe, offset: number) {
  if (!pipe.params.profile) return;
  const { start, end } = getPipePoints(pipe);
  const anchorData: TPipeElementAnchor = { pipe, setSupp };
  return createSuppAnchor(
    MMtoM(pipe.params.profile.outside_diameter_global * 1.2),
    start.distanceTo(end) - offset,
    anchorData
  );
}

function createFlangeMesh(
  pipe: FreePipe,
  data: any | undefined,
  offset: number
) {
  if (!pipe.params.profile || !data?.flange) return;
  const { start, end } = getPipePoints(pipe);
  const size = MMtoM(pipe.params.profile.outside_diameter_global * 0.8);
  const anchors: Mesh[] = [];
  if (!pipe.params.startFlange) {
    anchors.push(
      createFlangeAnchor(size, 0, {
        pipe,
        position: start.clone(),
        data,
        setFlange,
      })
    );
  }
  if (!pipe.params.endFlange) {
    anchors.push(
      createFlangeAnchor(size, start.distanceTo(end) - offset, {
        pipe,
        position: end.clone(),
        data,
        setFlange,
      })
    );
  }
  return anchors;
}

function createDimensionAnchors(pipe: FreePipe, offset: number) {
  const { start, end } = getPipePoints(pipe);
  const size = MMtoM(
    (pipe.params.profile?.outside_diameter_global ?? 0.2) * 0.8
  );
  const anchors: Mesh[] = [
    createAnchor(size, new Vector3(), {
      isDimensionAnchor: true,
      position: start.clone(),
    }),
    createAnchor(size, new Vector3(start.distanceTo(end) - offset), {
      isDimensionAnchor: true,
      position: end.clone(),
    }),
  ];
  return anchors;
}

export function getFlanges(
  type: TFlangeType | undefined,
  resoures: DataState
): TPipingFlange[] {
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

export function changePipeLineTag(
  pipes: FreePipe[],
  current: string,
  tag: string
) {
  let changedPipes = [...pipes];
  const nexts = changedPipes.filter((p) => p.preceding === current);
  for (const next of nexts) {
    changedPipes = changePipeLineTag(
      changedPipes.map((item) =>
        item.id === next.id ? { ...item, tag } : item
      ),
      next.pipe,
      tag
    );
  }
  return changedPipes;
}
