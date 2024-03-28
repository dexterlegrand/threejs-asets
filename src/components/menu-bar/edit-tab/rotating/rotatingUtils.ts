import { Dispatch } from "redux";
import { Model, Project, PipeRack } from "../../../../store/main/types";
import {
  fixVectorByOrientation,
  MMtoM,
  getOrientationByDirection,
  getDirectionByOrientation,
  roundVectorM,
} from "../../../3d-models/utils";
import { Vector3 } from "three";
import {
  changeFlareAction,
  changeModel,
  changeProjectAction,
} from "../../../../store/main/actions";
import { TFlare } from "../../../../store/main/types/flare";
import { getPrecedingDirs } from "../../../../services/pipe-services/pipe-service";

export type TAngle = 270 | 180 | 90 | -90 | -180 | -270;

export function handleRotate(
  dispatch: Dispatch,
  setModel: (model: Model) => any,
  x: number,
  y: number,
  z: number,
  project?: Project,
  model?: Model,
  angle?: TAngle
) {
  if (!project || !model) return;
  const angleX = MMtoM(x);
  const angleY = MMtoM(y);
  const angleZ = MMtoM(z);
  const angleV = new Vector3(angleX, angleY, angleZ);
  if (
    model.type === "Pipe Rack" ||
    model.type === "Open Frame" ||
    model.type === "Factory Shed"
  ) {
    const o = getOrientationByDirection((model as PipeRack).direction);
    let fixed = o + (angle ?? 0);
    while (fixed > 360) fixed -= 360;
    while (fixed < -360) fixed += 360;
    const direction = getDirectionByOrientation(fixed);
    const startPos = fixVectorByOrientation(
      angleV,
      (model as PipeRack).startPos,
      angle ?? 0
    );
    const changed = { ...model, startPos, direction };
    setModel(changed);
    dispatch(changeModel(changed));
  } else if (model.type === "Flare") {
    const rotation = angle ?? 0;
    const pos = fixVectorByOrientation(
      angleV,
      new Vector3(
        (model as TFlare).position.x,
        (model as TFlare).position.y,
        (model as TFlare).position.z
      ),
      rotation
    );
    const changed: TFlare = {
      ...(model as TFlare),
      position: { x: pos.x, y: pos.y, z: pos.z },
      rotation,
    };
    setModel(changed);
    dispatch(changeFlareAction(changed));
  } else if (model.type === "Pipe Line") {
    let changed: Project = {
      ...project,
      freePipes:
        project.freePipes?.map((p) => {
          if (`${p.line}` === model!.name) {
            const startPos = roundVectorM(
              fixVectorByOrientation(
                angleV,
                new Vector3(p.x1, p.y1, p.z1),
                angle ?? 0
              )
            );
            const endPos = roundVectorM(
              fixVectorByOrientation(
                angleV,
                new Vector3(p.x2, p.y2, p.z2),
                angle ?? 0
              )
            );
            return {
              ...p,
              x1: startPos.x,
              y1: startPos.y,
              z1: startPos.z,
              x2: endPos.x,
              y2: endPos.y,
              z2: endPos.z,
            };
          }
          return p;
        }) ?? [],
    };
    changed = {
      ...changed,
      freePipes: changed.freePipes!.map((p) => {
        const prev = changed.freePipes!.find(
          (item) => item.pipe === p.preceding
        );
        return { ...p, ...getPrecedingDirs(prev, p) };
      }),
    };
    dispatch(changeProjectAction(changed));
  }
}
