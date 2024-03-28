import { SetterOrUpdater } from "recoil";
import { Dispatch } from "redux";
import { DoubleSide, MeshLambertMaterial, Vector2, Vector3 } from "three";
import {
  degToRad,
  getNextId,
  getPosByDistance,
  roundM,
  roundVectorM,
} from "../../components/3d-models/utils";
import {
  TMousePipeCreatingAtom,
  TPipeSegmentParams,
} from "../../recoil/atoms/process-atoms";
import { TSnapPostion } from "../../recoil/atoms/snap-atom";
import { createPipeAction, setPipesAction } from "../../store/main/actions";
import { initialPipe } from "../../store/main/constants";
import { FreePipe } from "../../store/main/types";
import {
  changeProcessElementConnections,
  connectInstrElementAction,
  connectProcessElementAction,
  selectConnectionPointAction,
  selectProcessElementAction,
} from "../../store/process/actions";
import {
  EConnectionElementType,
  EPipeElementType,
  TProcess,
  TProcessElement,
  TProcessElementPoint,
  TProcessState,
} from "../../store/process/types";
import {
  changePipeByPrev,
  createNextPipe,
  getFlanges,
  getPipePoints,
  getPrecedingDirs,
  TPipeElementAnchor,
} from "../pipe-services/pipe-service";

type TClickBySceneProps = {
  currentProject: string;
  process: TProcessState;
  MPCState: TMousePipeCreatingAtom;
  item: any;
  point: Vector3 | undefined;
  position: Vector2;
  pipes: FreePipe[];
  setMPCState: SetterOrUpdater<TMousePipeCreatingAtom>;
  setSnap: (state: TSnapPostion) => any;
  dispatch: Dispatch<any>;
};

type TCreateInsidePipe = {
  currentProject: string;
  process: TProcess | undefined;
  pipes: FreePipe[];
  point: Vector3;
  nextPipe?: FreePipe;
  MPCState: TMousePipeCreatingAtom;
  setMPCState: SetterOrUpdater<TMousePipeCreatingAtom>;
  cteatePipe: (pipe: FreePipe) => any;
  dispatch: Dispatch<any>;
};
type TCreateInsideNozzle = {
  currentProject: string;
  process: TProcess | undefined;
  pipes: FreePipe[];
  point: Vector3;
  nextPipe?: FreePipe;
  MPCState: TMousePipeCreatingAtom;
  setMPCState: SetterOrUpdater<TMousePipeCreatingAtom>;
  dispatch: Dispatch<any>;
};

export const dropZoneMaterial = new MeshLambertMaterial({
  transparent: true,
  opacity: 0.2,
  side: DoubleSide,
  color: "yellow",
});

export function handleClickBySceneForProcess(props: TClickBySceneProps) {
  const { MPCState } = props;
  handleProcessClick(props);
  if (!MPCState.processPipeElement) return;
  if (
    MPCState.processPipeElement === EPipeElementType.PIPE ||
    MPCState.processPipeElement === EConnectionElementType.NOZZLE
  ) {
    {
      handleMousePipeCreating(props);
    }
  } else if (
    [
      EPipeElementType.ELBOW,
      EPipeElementType.REDUCER,
      EPipeElementType.RETURN,
      EPipeElementType.TEE,
      EPipeElementType.UDE,
      EPipeElementType.CAP,
    ].includes(MPCState.processPipeElement as EPipeElementType)
  ) {
    handleCreatePipeElement(props);
  } else if (MPCState.processPipeElement === EPipeElementType.FLANGE) {
    handleCreateFlange(props);
  } else if (MPCState.processPipeElement === EPipeElementType.SUPP) {
    handleCreatePipeSupp(props);
  } else if (MPCState.processPipeElement === EPipeElementType.DIMENSION) {
    props.setMPCState({ ...props.MPCState, dimensionPoint: props.point });
  } else if (MPCState.processPipeElement === EPipeElementType.VALVE) {
    handleCreateValve(props);
  }
}

function adjustPipePosition(
  start: THREE.Vector3,
  end: THREE.Vector3
): { start: THREE.Vector3; end: THREE.Vector3 } {
  const isWithinThreePercent = (val1: number, val2: number): boolean => {
    return Math.abs(val1 - val2) / ((val1 + val2) / 2) <= 0.03;
  };
  const adjustIfNeeded = (componentIndex: number) => {
    if (
      isWithinThreePercent(
        start.getComponent(componentIndex),
        end.getComponent(componentIndex)
      )
    ) {
      end.setComponent(componentIndex, start.getComponent(componentIndex));
    }
  };
  const matchCounts = [0, 1, 2].filter(
    (index) => start.getComponent(index) === end.getComponent(index)
  ).length;
  if (matchCounts === 1) {
    [0, 1, 2].forEach(adjustIfNeeded);
  }

  return { start, end };
}

function handleMousePipeCreating(props: TClickBySceneProps) {
  const {
    currentProject,
    MPCState,
    item,
    point,
    process,
    pipes,
    setMPCState,
    dispatch,
  } = props;
  if (
    !MPCState.startPointPipeSegment &&
    MPCState.processPipeElement === EConnectionElementType.NOZZLE &&
    item?.isProcessItem &&
    Array.isArray(item?.points)
  ) {
    const process = props.process.processes.get(props.currentProject);
    if (!process) return;

    dispatch(selectProcessElementAction(item as TProcessElement));

    setMPCState({
      ...MPCState,
      startProcessElementPoint: item.points.length,
      startPointPipeSegment: point,
      startProcessElement: item as TProcessElement,
      isStart: true,
      connectionSegmentParams: {
        ...MPCState.connectionSegmentParams,
      },
    });
  } else if (
    MPCState.processPipeElement === EConnectionElementType.NOZZLE &&
    MPCState.startPointPipeSegment &&
    point
  ) {
    const from = MPCState.startPointPipeSegment.clone();
    props.setSnap({
      from,
      current: point.clone(),
      position: props.position.clone(),
      callback: (val: number) =>
        createNozzleBySegment({
          currentProject,
          process: process.processes.get(currentProject),
          pipes,
          point: roundVectorM(getPosByDistance(val, from, point)),
          MPCState,
          setMPCState,
          dispatch: props.dispatch,
        }),
    });
  } else if (MPCState.startProcessElement && item?.userData?.isConnectPoint) {
    if (
      item.parent?.userData?.isProcessItem &&
      (item.parent.userData as TProcessElement).name !==
        MPCState.startProcessElement.name
    ) {
      ({ ...props, item });
    } else {
      const process = props.process.processes.get(props.currentProject);
      if (!process) return;
      const element = props.MPCState.startProcessElement!;
      const point = element.points.find((p) => p.id === item.userData.id);

      setMPCState({
        ...MPCState,
        startProcessElementPoint: item.userData.id,
        startPointPipeSegment: getGlobalProcessPointPostionByElement(
          MPCState.startProcessElement,
          item.userData.id
        ),
        pipeSegmentParams: {
          ...MPCState.pipeSegmentParams,
          lib: point?.lib ?? MPCState.pipeSegmentParams.lib,
          nps: point?.nps ?? MPCState.pipeSegmentParams.nps,
          schedule:
            point?.profile?.schedule ?? MPCState.pipeSegmentParams.schedule,
          profile: point?.profile ?? MPCState.pipeSegmentParams.profile,
          material: point?.material ?? MPCState.pipeSegmentParams.material,
        },
      });
    }
  } else if (props.item?.isPipe) {
    const { end } = getPipePoints(props.item.pipe);
    if (MPCState.startPointPipeSegment) {
      connectPipeSegments({
        currentProject,
        process: undefined,
        pipes,
        point: new Vector3(),
        nextPipe: props.item.pipe,
        MPCState,
        setMPCState,
        cteatePipe: (pipe: FreePipe) => dispatch(createPipeAction(pipe)),
        dispatch: props.dispatch,
      });
    } else {
      setMPCState({
        ...MPCState,
        startPointPipeSegment: end.clone(),
        prevPipeSegment: props.item.pipe.id,
        isStart: false,
      });
    }
  } else if (props.item?.processLine) {
    handleCreateByProcessLine(props);
  } else if (MPCState.startPointPipeSegment && point) {
    const from = MPCState.startPointPipeSegment.clone();
    props.setSnap({
      from,
      current: point.clone(),
      position: props.position.clone(),
      callback: (val: number) =>
        createPipeBySegment({
          currentProject,
          process: process.processes.get(currentProject),
          pipes,
          point: roundVectorM(getPosByDistance(val, from, point)),
          MPCState,
          setMPCState,
          cteatePipe: (pipe: FreePipe) => dispatch(createPipeAction(pipe)),
          dispatch: props.dispatch,
        }),
    });
  }
}

function handleProcessClick(props: TClickBySceneProps) {
  const { item, process, currentProject, MPCState, dispatch } = props;
  // if (item && item.isProcessItem && process.selectedPoint) {
  //   const elPos = new Vector3(
  //     item.position.x,
  //     item.position.y,
  //     item.position.z
  //   );
  //   dispatch(
  //     changeProcessElementConnections(
  //       currentProject,
  //       {
  //         ...(item as TProcessElement),
  //         points: item.points.map((p: TProcessElementPoint) => {
  //           return p.id === process.selectedPoint!.id
  //             ? { ...p, generalPosition: item.point.clone().sub(elPos) }
  //             : p;
  //         }),
  //       },
  //       []
  //     )
  //   );
  // } else
  if (item && item.userData?.isConnectPoint) {
    if (!process.selected) return;
    const parent = item.parent?.userData;
    if (!parent?.isProcessItem) return;
    if (
      process.selectedPoint &&
      process.selected.name !== (parent as TProcessElement).name &&
      process.selectedPoint.connectionType !== "END" &&
      MPCState.processPipeElement !== EPipeElementType.PIPE
    ) {
      dispatch(
        connectProcessElementAction(
          process,
          currentProject,
          parent as TProcessElement,
          item.userData.id
        )
      );
    } else if (
      process.selected?.name === parent.name &&
      item.userData.connectionType !== "END"
    ) {
      dispatch(
        selectConnectionPointAction(parent as TProcessElement, item.userData.id)
      );
    }
  } else if (item && item.isIntrumentationElement) {
    if (!process.selectedInstr || process.selectedInstr.id === item.instr.id)
      return;
    dispatch(
      connectInstrElementAction(
        currentProject,
        process.selectedInstr,
        item.instr
      )
    );
  }
}

function createPipeBySegment(props: TCreateInsidePipe) {
  if (!props.MPCState.startPointPipeSegment) return;
  const start = props.MPCState.startPointPipeSegment.clone();
  const end = props.point.clone();
  // const adjustedPositions = adjustPipePosition(start, end);
  // const adjustedStart = adjustedPositions.start;
  // const adjustedEnd = adjustedPositions.end;
  let pipe = createNextPipe({
    pipes: props.pipes,
    start,
    end: end,
    /*end,*/
    params: props.MPCState.pipeSegmentParams,
    prev: props.MPCState.prevPipeSegment,
  });
  if (props.MPCState.isStart) {
    let element = props.MPCState.startProcessElement!;
    const point = element.points.find(
      (p) => p.id === props.MPCState.startProcessElementPoint
    );
    if (point) {
      const profile = point.profile ?? props.MPCState.pipeSegmentParams.profile;
      pipe = {
        ...pipe,
        params: {
          ...pipe.params,
          lib: point.lib ?? props.MPCState.pipeSegmentParams.lib,
          nps: point.nps ?? props.MPCState.pipeSegmentParams.nps,
          profile,
          od: profile?.outside_diameter_global,
          thickness: profile?.wall_thickness_global,
          startFlangeType: point.flangeType,
          startFlangeClass: point.flangeClass,
          startFlange: point.flange,
        },
      };
      element = {
        ...element,
        points: element.points.map((p) =>
          p.id === point.id ? { ...point, nextPipe: pipe.id } : p
        ),
      };
      props.dispatch(
        changeProcessElementConnections(props.currentProject, element, [])
      );
      props.setMPCState((prev) => ({
        ...prev,
        pipeSegmentParams: {
          ...prev.pipeSegmentParams,
          lib: point.lib ?? props.MPCState.pipeSegmentParams.lib,
          nps: point.nps ?? props.MPCState.pipeSegmentParams.nps,
          profile,
        },
      }));
    }
  }
  props.cteatePipe(pipe);
  props.setMPCState((prev) => ({
    ...prev,
    prevPipeSegment: pipe.id,
    startPointPipeSegment: end.clone(),
    isStart: false,
  }));
}
function createNozzleBySegment(props: TCreateInsideNozzle) {
  if (!props.MPCState.startPointPipeSegment) return;

  let element = props.MPCState.startProcessElement!;

  const pos = new Vector3(
    -element.position.x,
    -element.position.y,
    -element.position.z
  );
  const start = props.MPCState.startPointPipeSegment.clone();
  start.add(
    pos
      .clone()
      .applyAxisAngle(new Vector3(1), degToRad(element.rotationX ?? 0))
      .applyAxisAngle(new Vector3(0, 1), degToRad(element.rotation))
      .applyAxisAngle(new Vector3(0, 0, 1), degToRad(element.rotationZ ?? 0))
  );

  if (props.MPCState.connectionSegmentParams.startingAt === "Center") {
    start.setX(0);
    start.setZ(0);
  }

  const end = props.point.clone();
  end.add(
    pos
      .clone()
      .applyAxisAngle(new Vector3(1), degToRad(element.rotationX ?? 0))
      .applyAxisAngle(new Vector3(0, 1), degToRad(element.rotation))
      .applyAxisAngle(new Vector3(0, 0, 1), degToRad(element.rotationZ ?? 0))
  );
  const points = props.MPCState.startProcessElement?.points;

  const point: TProcessElementPoint = {
    id: getNextId(points),
    startPosition: start,
    generalPosition: end,
    lib: props.MPCState.connectionSegmentParams.lib,
    nps: props.MPCState.connectionSegmentParams.nps,
    material: props.MPCState.connectionSegmentParams.material,
    profile: props.MPCState.connectionSegmentParams.profile,
    flangeType: props.MPCState.pipeFlangeParams?.type,
    flangeClass: props.MPCState.pipeFlangeParams?.class,
    flange: props.MPCState.pipeFlangeParams?.material,
    od_MM: props.MPCState.connectionSegmentParams.od_MM,
    wt_MM: props.MPCState.connectionSegmentParams.wt_MM,
    connectionType: props.MPCState.connectionSegmentParams.connectionType,
    // flange: getFlanges(resoures,  props.MPCState.pipeFlangeParams?.type)
    //   .filter((f) => f.nps === nps && f.class === flangeClass)
    //   .find((f) => f.material === item["Flange Material"]),
  };

  element = {
    ...element,
    points: [...element.points, point],
  };
  props.dispatch(
    changeProcessElementConnections(props.currentProject, element, [])
  );
  props.setMPCState((prev) => ({
    ...prev,
    startPointPipeSegment: undefined,
    isStart: true,
  }));
}

function connectPipeSegments(props: TCreateInsidePipe) {
  if (!props.MPCState.startPointPipeSegment || !props.nextPipe) return;
  const start = props.MPCState.startPointPipeSegment.clone();
  const end = new Vector3(
    props.nextPipe.x1,
    props.nextPipe.y1,
    props.nextPipe.z1
  );
  const pipe = createNextPipe({
    pipes: props.pipes,
    start,
    end,
    params: props.MPCState.pipeSegmentParams,
    prev: props.MPCState.prevPipeSegment,
  });
  const changedNextPipe = changePipeByPrev(props.nextPipe, pipe);
  props.dispatch(
    setPipesAction(
      [...props.pipes, pipe].map((p) =>
        p.id === changedNextPipe.id ? changedNextPipe : p
      )
    )
  );
  props.setMPCState({
    ...props.MPCState,
    processPipeElement: undefined,
    prevPipeSegment: undefined,
    startPointPipeSegment: undefined,
    isStart: false,
  });
}

function createCustomProcessLine(props: TClickBySceneProps) {
  let prev = props.MPCState.startProcessElement!;
  let next = props.item.parent.userData as TProcessElement;

  const process = props.process.processes.get(props.currentProject);
  if (!process) return;

  let startPoint = prev.points.find(
    (p) => p.id === props.MPCState.startProcessElementPoint
  );
  if (!startPoint) return;

  let endPoint = next.points.find((p) => p.id === props.item.userData.id);
  if (!endPoint) return;

  const segmentParams: TPipeSegmentParams = {
    ...props.MPCState.pipeSegmentParams,
    lib: endPoint.lib ?? props.MPCState.pipeSegmentParams.lib,
    nps: endPoint.nps ?? props.MPCState.pipeSegmentParams.nps,
    schedule:
      endPoint.profile?.schedule ?? props.MPCState.pipeSegmentParams.schedule,
    profile: endPoint.profile ?? props.MPCState.pipeSegmentParams.profile,
    material: endPoint.material ?? props.MPCState.pipeSegmentParams.material,
  };

  startPoint = { ...startPoint, element: next.name, connectionType: "START" };
  endPoint = { ...endPoint, element: next.name, connectionType: "END" };

  const end = roundVectorM(
    getGlobalProcessPointPostionByElement(next, endPoint.id)
  );

  let pipe = createNextPipe({
    pipes: props.pipes,
    start: props.MPCState.startPointPipeSegment!.clone(),
    end: end.clone(),
    params: segmentParams,
    prev: props.MPCState.prevPipeSegment,
  });

  pipe = {
    ...pipe,
    params: {
      ...pipe.params,
      endFlangeType: endPoint.flangeType,
      endFlangeClass: endPoint.flangeClass,
      endFlange: endPoint.flange,
    },
  };

  if (props.MPCState.isStart) {
    startPoint = { ...startPoint, nextPipe: pipe.id };
    // props.dispatch(
    //   changeProcessElementConnections(props.currentProject, element, [])
    // );
  }
  endPoint = { ...endPoint, prevPipe: pipe.id };

  prev = {
    ...prev,
    points: prev.points.map((p) => (p.id === startPoint!.id ? startPoint! : p)),
  };
  next = {
    ...next,
    points: next.points.map((p) => (p.id === endPoint!.id ? endPoint! : p)),
  };

  process.elements.set(prev.name, prev);
  process.elements.set(next.name, next);

  props.dispatch(createPipeAction(pipe));
  props.setMPCState({
    pipeSegmentParams: segmentParams,
    processPipeElement: props.MPCState.processPipeElement,
    connectionSegmentParams: props.MPCState.connectionSegmentParams,
  });
}

function getGlobalProcessPointPostionByElement(
  element: TProcessElement,
  pointId: number
) {
  const pos = new Vector3(
    element.position.x,
    element.position.y,
    element.position.z
  );
  const point = element.points.find((p) => p.id === pointId);
  return point
    ? pos.add(
        point.generalPosition
          .clone()
          .applyAxisAngle(new Vector3(1), degToRad(element.rotationX ?? 0))
          .applyAxisAngle(new Vector3(0, 1), degToRad(element.rotation))
          .applyAxisAngle(
            new Vector3(0, 0, 1),
            degToRad(element.rotationZ ?? 0)
          )
      )
    : pos;
}

function handleCreatePipeElement(props: TClickBySceneProps) {
  const item: TPipeElementAnchor = props.item;
  if (!item?.setEndConnector || !item?.type || !item.pipe) return;
  const freePipes = item.setEndConnector(
    item.pipe,
    props.pipes,
    item.type,
    item.data
  );
  props.dispatch(setPipesAction(freePipes));
}

function handleCreatePipeSupp(props: TClickBySceneProps) {
  const item: TPipeElementAnchor = props.item;
  if (!item?.setSupp || !props.point || !item.pipe) return;
  const freePipes = item.setSupp(item.pipe, props.pipes, props.point);
  props.dispatch(setPipesAction(freePipes));
}

function handleCreateFlange(props: TClickBySceneProps) {
  const item: TPipeElementAnchor = props.item;
  if (!item?.setFlange || !item.position || !item.data || !item.pipe) return;
  const freePipes = item.setFlange(
    item.pipe,
    props.pipes,
    item.position,
    item.data
  );
  props.dispatch(setPipesAction(freePipes));
}

function handleCreateValve(props: TClickBySceneProps) {
  const item: TPipeElementAnchor = props.item;
  if (!item?.valve) return;
  const valve = item.valve;
  const { pipes } = props;
  const prevPipe = pipes.find((pipe) =>
    valve.points.some((point) => point.prevPipe === pipe.id)
  );
  const prevPoint = prevPipe
    ? valve.points.find((point) => point.prevPipe === prevPipe.id)
    : undefined;

  let nextPipe = pipes.find((pipe) =>
    valve.points.some((point) => point.nextPipe === pipe.id)
  );
  const nextPoint = nextPipe
    ? valve.points.find((point) => point.prevPipe === nextPipe!.id)
    : undefined;

  const position = new Vector3(
    valve.position.x,
    valve.position.y,
    valve.position.z
  );
  let changedPipes = [...pipes];
  let newPrevPipe: FreePipe | undefined;
  let newNextPipe: FreePipe | undefined;

  if (prevPipe) {
    const end = new Vector3(prevPipe.x2, prevPipe.y2, prevPipe.z2);
    const id = getNextId(changedPipes);
    newPrevPipe = changePipeByPrev(
      {
        ...initialPipe,
        id,
        pipe: `PP${id}`,
        x1: end.x,
        y1: end.y,
        z1: end.z,
        x2: position.x,
        y2: position.y,
        z2: position.z,
        line: prevPipe.line,
        preceding: prevPipe.pipe,
      },
      prevPipe
    );
    newPrevPipe = {
      ...newPrevPipe,
      params: {
        ...newPrevPipe.params,
        lib: prevPoint?.lib ?? prevPipe.params.lib,
        nps: prevPoint?.nps ?? prevPipe.params.nps,
        profile: prevPoint?.profile ?? prevPipe.params.profile,
        od:
          prevPoint?.profile?.outside_diameter_global ??
          prevPipe.params.profile?.outside_diameter_global,
        thickness:
          prevPoint?.profile?.wall_thickness_global ??
          prevPipe.params.profile?.wall_thickness_global,
        material: prevPoint?.material ?? prevPipe.params.material,
        startFlange: prevPoint?.flange ?? prevPipe.params.endFlange,
        startFlangeClass:
          prevPoint?.flangeClass ?? prevPipe.params.endFlangeClass,
        startFlangeType: prevPoint?.flangeType ?? prevPipe.params.endFlangeType,
        valvePosition: "END",
        valveType: valve.parameters.type ?? "Globe Valve",
      },
    };
    changedPipes = [...changedPipes, newPrevPipe];
  }

  if (nextPipe) {
    const start = new Vector3(nextPipe.x1, nextPipe.y1, nextPipe.z1);
    const id = getNextId(changedPipes);
    newNextPipe = {
      ...initialPipe,
      id,
      pipe: `PP${id}`,
      x1: position.x,
      y1: position.y,
      z1: position.z,
      x2: start.x,
      y2: start.y,
      z2: start.z,
      line: nextPipe.line,
      preceding: newPrevPipe?.pipe ?? "START",
    };
    if (newPrevPipe) newNextPipe = changePipeByPrev(newNextPipe, newPrevPipe);
    newNextPipe = {
      ...newNextPipe,
      params: {
        ...newNextPipe.params,
        lib: nextPoint?.lib ?? newPrevPipe?.params.lib ?? nextPipe.params.lib,
        nps: nextPoint?.nps ?? newPrevPipe?.params.nps ?? nextPipe.params.nps,
        profile:
          nextPoint?.profile ??
          newPrevPipe?.params.profile ??
          nextPipe.params.profile,
        od:
          nextPoint?.profile?.outside_diameter_global ??
          newPrevPipe?.params.profile?.outside_diameter_global ??
          nextPipe.params.profile?.outside_diameter_global,
        thickness:
          nextPoint?.profile?.wall_thickness_global ??
          newPrevPipe?.params.profile?.wall_thickness_global ??
          nextPipe.params.profile?.wall_thickness_global,
        material:
          nextPoint?.material ??
          newPrevPipe?.params.material ??
          nextPipe.params.material,
        endFlange: nextPoint?.flange ?? nextPipe.params.startFlange,
        endFlangeClass:
          nextPoint?.flangeClass ?? nextPipe.params.startFlangeClass,
        endFlangeType: nextPoint?.flangeType ?? nextPipe.params.startFlangeType,
        valvePosition: !newPrevPipe ? "START" : undefined,
        valveType: !newPrevPipe
          ? valve.parameters.type ?? "Globe Valve"
          : undefined,
      },
    };
    nextPipe = {
      ...nextPipe,
      ...getPrecedingDirs(newNextPipe, nextPipe),
      preceding: newNextPipe.pipe,
      line: newNextPipe.line,
    };
    changedPipes = [...changedPipes, newNextPipe].map((p) =>
      p.id === nextPipe!.id ? nextPipe! : p
    );
  }

  props.dispatch(setPipesAction(changedPipes));
}

function handleCreateByProcessLine(props: TClickBySceneProps) {
  const { processLine, segmentId } = props.item! as TPipeElementAnchor;
  if (!processLine || !segmentId) return;
  const segment = processLine.segments.find((s) => s.id === segmentId);
  if (!segment) return;

  const { start, end } = segment;
  const rStart = roundVectorM(start);
  const rEnd = roundVectorM(end);
  const params = props.MPCState.pipeSegmentParams;

  let pipes = [...props.pipes];
  const prevPipe = pipes.find((p) =>
    new Vector3(p.x2, p.y2, p.z2).equals(rStart)
  );
  let nextPipe = pipes.find((p) => new Vector3(p.x1, p.y1, p.z1).equals(rEnd));

  const id = getNextId(props.pipes);
  let pipe: FreePipe = changePipeByPrev(
    {
      ...initialPipe,
      id,
      pipe: `PP${id}`,
      x1: rStart.x,
      y1: rStart.y,
      z1: rStart.z,
      x2: rEnd.x,
      y2: rEnd.y,
      z2: rEnd.z,
      line: id,
      length: roundM(rStart.distanceTo(rEnd)),
      elevation: roundM((rStart.y + rEnd.y) / 2),
    },
    prevPipe
  );

  pipe = {
    ...pipe,
    params: {
      ...pipe.params,
      lib:
        params.lib ??
        processLine.parameters?.schedule?.country_code ??
        prevPipe?.params.lib,
      nps: params.nps ?? processLine.parameters?.nps ?? prevPipe?.params.nps,
      profile:
        params.profile ??
        processLine.parameters?.schedule ??
        prevPipe?.params.profile,
      od:
        params.profile?.outside_diameter_global ??
        processLine.parameters?.schedule?.outside_diameter_global ??
        prevPipe?.params.profile?.outside_diameter_global,
      thickness:
        params.profile?.wall_thickness_global ??
        processLine.parameters?.schedule?.wall_thickness_global ??
        prevPipe?.params.profile?.wall_thickness_global,
      material:
        params.material ??
        processLine.parameters?.material ??
        prevPipe?.params.material,
    },
  };

  pipes = [...pipes, pipe];

  if (nextPipe) {
    nextPipe = changePipeByPrev(nextPipe, pipe);
    pipes = pipes.map((p) => (p.id === nextPipe!.id ? nextPipe! : p));
  }

  props.dispatch(setPipesAction(pipes));
}
