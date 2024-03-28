import { Dispatch } from "redux";
import { FreePipe, Direction3, Project } from "../../../../store/main/types";
import { Vector3, Object3D, Quaternion } from "three";
import {
  roundVectorM,
  getPosByDistance,
  roundM,
  getNextId,
  getDirection,
} from "../../../3d-models/utils";
import { changeProjectAction } from "../../../../store/main/actions";
import { deg90InRad } from "../../../../store/main/constants";
import { getNextPipeAngle } from "../../../3d-models/process/process";

function getRotation(dir: Direction3) {
  switch (dir) {
    case "+Y":
      return new Vector3(0, 1);
    case "+Z":
      return new Vector3(0, 0, 1);
    case "-X":
      return new Vector3(-1);
    case "-Y":
      return new Vector3(0, -1);
    case "-Z":
      return new Vector3(0, 0, -1);
    case "+X":
    default:
      return new Vector3(1);
  }
}

function changePipesDir(pipes: FreePipe[], pipe: FreePipe, source: Vector3, rotation: Quaternion) {
  let changed = [...pipes];
  const prev = changed.find((item) => item.pipe === pipe.preceding);
  const start = roundVectorM(
    new Vector3(pipe.x1, pipe.y1, pipe.z1)
      .sub(source)
      .applyQuaternion(rotation)
      .add(source)
  );
  const end = roundVectorM(
    new Vector3(pipe.x2, pipe.y2, pipe.z2)
      .sub(source)
      .applyQuaternion(rotation)
      .add(source)
  );
  const prevD = prev
    ? getDirection(new Vector3(prev.x1, prev.y1, prev.z1), new Vector3(prev.x2, prev.y2, prev.z2))
    : "+X";
  const nextD = getDirection(start, end);
  const { h, v } = getNextPipeAngle(prevD, nextD);
  const changedPipe: FreePipe = {
    ...pipe,
    x1: start.x,
    y1: start.y,
    z1: start.z,
    x2: end.x,
    y2: end.y,
    z2: end.z,
    hDir: prev ? h : 0,
    vDir: prev ? v : 0,
  };
  changed = changed.map((c) => (c.id === changedPipe.id ? changedPipe : c));
  const nexts = changed.filter((el) => el.preceding === pipe.pipe);
  for (const next of nexts) {
    changed = changePipesDir(changed, next, source, rotation);
  }
  return changed;
}

export function changePipeLineDirection(
  dispatch: Dispatch,
  project: Project,
  pipes: FreePipe[],
  pipe: FreePipe,
  dir: Direction3,
  distance: number
) {
  let changedPipes = [...pipes];
  const to = getRotation(dir);
  const source = new Vector3();
  let first = pipe;
  if (distance) {
    source.copy(
      roundVectorM(
        getPosByDistance(
          distance,
          new Vector3(pipe.x1, pipe.y1, pipe.z1),
          new Vector3(pipe.x2, pipe.y2, pipe.z2)
        )
      )
    );
    const splitSupports1 =
      pipe.params.supportDetails?.filter((sd) => sd.distance <= distance) ?? [];
    const splitSupports2 = pipe.params.supportDetails?.filter((sd) => sd.distance > distance) ?? [];
    const split1: FreePipe = {
      ...pipe,
      x2: source.x,
      y2: source.y,
      z2: source.z,
      elevation: roundM((pipe.y1 + source.y) / 2),
      length: roundM(new Vector3(pipe.x1, pipe.y1, pipe.z1).distanceTo(source)),
      params: {
        ...pipe.params,
        endConnector: undefined,
        endConnectorDetails: undefined,
        endConnectorType: undefined,
        endFlange: undefined,
        endFlangeClass: undefined,
        endFlangeLoads: undefined,
        endFlangeType: undefined,
        numberOfSupports: splitSupports1.length,
        reducerType: undefined,
        supportDetails: splitSupports1,
      },
    };
    const id = getNextId(pipes);
    const split2: FreePipe = {
      ...pipe,
      id,
      pipe: `PP${id}`,
      x1: source.x,
      y1: source.y,
      z1: source.z,
      elevation: roundM((source.y + pipe.y2) / 2),
      length: roundM(source.distanceTo(new Vector3(pipe.x2, pipe.y2, pipe.z2))),
      preceding: split1.pipe,
      hDir: 0,
      vDir: 0,
      params: {
        ...pipe.params,
        numberOfSupports: splitSupports2.length,
        supportDetails: splitSupports2,
        startFlange: undefined,
        startFlangeClass: undefined,
        startFlangeLoads: undefined,
        startFlangeType: undefined,
        valveActuator: undefined,
        valveControl: undefined,
        valvePosition: undefined,
        valveType: undefined,
      },
    };
    changedPipes = [
      ...changedPipes.map((p) =>
        p.preceding === pipe.pipe ? { ...p, preceding: split2.pipe } : p.id === pipe.id ? split1 : p
      ),
      split2,
    ];
    first = split2;
  } else {
    source.set(pipe.x1, pipe.y1, pipe.z1);
  }
  const group = new Object3D();
  group.lookAt(to);
  group.rotateY(-deg90InRad);
  changedPipes = changePipesDir(changedPipes, first, source, group.quaternion);
  dispatch(changeProjectAction({ ...project, freePipes: changedPipes }));
}
