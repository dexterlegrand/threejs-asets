import { getOffsetB, checkRange, getPosByDistance, getNextId, getIndexName } from "../utils";
import { TBeamElement, TBeamOF, TPipeOF, TOpenFrame } from "../../../store/main/openFrameTypes";
import { Direction3, FreePipe, Project, Direction2 } from "../../../store/main/types";
import { Vector3 } from "three";
import { changeOFUIAction } from "../../../store/ui/actions";
import { changeProjectAction } from "../../../store/main/actions";
import { OFPipeUI, OpenFrameUI } from "../../../store/ui/types";
import { getBeamElementsOfModel } from "../openFrame";
import { Dispatch } from "redux";
import { DataState } from "../../../store/data/types";
import { mapPipes } from "../xch/PPxch";

type TModelBox = { min: Vector3; minA: Vector3; max: Vector3; maxA: Vector3 };

export function importPipesToModels(
  dispatch: Dispatch<any>,
  ui: OpenFrameUI,
  project: Project,
  resoures: DataState,
  type: "pps" | "xch",
  data: any,
  dist?: number
) {
  const distance = dist ?? 2;
  const models = project.models as TOpenFrame[];
  const modelBoxes = getModelBoxes(models, distance);
  let changedProject = { ...project };
  const newPipes = getNewPipes(resoures, type, data);

  let changedUI = { ...ui };

  newPipes.forEach((item) => {
    // splitByModelsBoxes(item, models, modelBoxes);

    const middle = new Vector3(
      item.x1 + item.x2,
      item.y1 + item.y2,
      item.z1 + item.z2
    ).divideScalar(2);

    for (const model of changedProject.models as TOpenFrame[]) {
      const box = modelBoxes.get(model.name);
      if (box && checkPosition(middle, box)) {
        const name = `${model.name}-PP`;
        const index = getIndexName(model.pipes, name);
        const startPos = new Vector3();
        const endPos = new Vector3();
        if (model.direction.includes("Z")) {
          startPos.set(item.x1, item.y1, item.z1);
          endPos.set(item.x2, item.y2, item.z2);
          if (model.direction === "+Z") {
            startPos.sub(model.startPos).set(startPos.z, startPos.y, -startPos.x);
            endPos.sub(model.startPos).set(endPos.z, endPos.y, -endPos.x);
          } else {
            startPos.set(
              model.startPos.z - item.z2,
              startPos.y - model.startPos.y,
              startPos.x - model.startPos.x
            );
            endPos.set(
              model.startPos.z - item.z1,
              endPos.y - model.startPos.y,
              endPos.x - model.startPos.x
            );
          }
        } else {
          startPos.set(item.x1, item.y1, item.z1).sub(model.startPos);
          endPos.set(item.x2, item.y2, item.z2).sub(model.startPos);
          if (model.direction === "-X") {
            startPos.setX(-startPos.x).setZ(-startPos.z);
            endPos.setX(-endPos.x).setZ(-endPos.z);
          }
        }
        const direction = getPipeDirection(startPos, endPos);
        const beams = getBeamsAroundPipe(
          [...model.beams, ...model.cantilevers],
          direction,
          startPos,
          endPos
          // true
        );

        const b1 = getB1ForPipe(beams, direction);
        const b2 = getB2ForPipe(beams, direction);

        if (b1 && b2) {
          const pipe: TPipeOF = {
            id: getNextId(model.pipes),
            name: `${name}${index}`,
            diameter: item.params.od ?? item.params.profile?.outside_diameter_global ?? 0,
            thickness: item.params.thickness ?? item.params.profile?.wall_thickness_global ?? 0,
            direction,
            startPos,
            B1: b1.name,
            elevationB1: item.y1,
            distanceFromB1: (b1 as TBeamOF).direction.includes("X")
              ? startPos.z - b1.startPos.z
              : startPos.x - b1.startPos.x,
            distanceFromLeftB1: (b1 as TBeamOF).direction.includes("X")
              ? b1.startPos.x < b1.endPos.x
                ? startPos.x - b1.startPos.x
                : b1.startPos.x - startPos.x
              : b1.startPos.z < b1.endPos.z
              ? startPos.z - b1.startPos.z
              : b1.startPos.z - startPos.z,
            endPos,
            B2: b2.name,
            elevationB2: item.y2,
            distanceFromB2: (b2 as TBeamOF).direction.includes("X")
              ? endPos.z - b2.startPos.z
              : endPos.x - b2.startPos.x,
            distanceFromLeftB2: (b2 as TBeamOF).direction.includes("X")
              ? b2.startPos.x < b2.endPos.x
                ? endPos.x - b2.startPos.x
                : b2.startPos.x - endPos.x
              : b2.startPos.z < b2.endPos.z
              ? endPos.z - b2.startPos.z
              : b2.startPos.z - endPos.z,
            material: item.params.material ?? resoures.materials[0],
            profile: item.params.profile,
            succeeding: "END",
            supports:
              item.params.supportDetails?.map((supp) => {
                return {
                  ...supp,
                  KforSpring: 0,
                  beam: undefined,
                  position: getPosByDistance(supp.distance, startPos, endPos),
                };
              }) ?? [],
          };

          const pipeUI: OFPipeUI = {
            id: pipe.id,
            selected: false,
            name: pipe.name,
            model: model.name,
            direction: pipe.direction,
            diameter: pipe.diameter,
            thickness: pipe.thickness,
            B1: pipe.B1,
            elevationB1: pipe.elevationB1,
            distanceFromB1: pipe.distanceFromB1,
            distanceFromLeftB1: pipe.distanceFromLeftB1,
            B2: pipe.B2,
            elevationB2: pipe.elevationB2,
            distanceFromB2: pipe.distanceFromB2,
            distanceFromLeftB2: pipe.distanceFromLeftB2,
            lib: pipe.profile?.country_code?.trim() ?? "",
            profile: pipe.profile,
            material: pipe.material,
            succeeding: pipe.succeeding,
          };

          changedProject = {
            ...changedProject,
            models: changedProject.models.map((m) =>
              m.name === model.name ? { ...model, pipes: [...model.pipes, pipe] } : m
            ),
          };

          changedUI = {
            ...changedUI,
            pipes: {
              ...changedUI.pipes,
              items: [...changedUI.pipes.items, pipeUI],
            },
          };
          break;
        }
      }
    }
  });

  dispatch(changeOFUIAction(changedUI));
  dispatch(changeProjectAction(changedProject));
}

function convertDataToImportingValues(resoures: DataState, type: "pps" | "xch", data: any) {
  if (type === "xch") {
    return {
      pipes: mapPipes(data, resoures),
    };
  } else {
    return {
      pipes: (data.project as Project).freePipes ?? [],
    };
  }
}

function getPipeDirection(start: Vector3, end: Vector3): Direction3 {
  const subX = start.x - end.x;
  const subY = start.y - end.y;
  const subZ = start.z - end.z;

  const absX = Math.abs(subX);
  const absY = Math.abs(subY);
  const absZ = Math.abs(subZ);

  const max = Math.max(absX, absY, absZ);

  switch (max) {
    case absX:
      return subX < 0 ? "+X" : "-X";
    case absY:
      return subY < 0 ? "+Y" : "-Y";
    default:
      return subZ < 0 ? "+Z" : "-Z";
  }
}

function groupPipesByPipeLine(resoures: DataState, type: "pps" | "xch", data: any) {
  const { pipes } = convertDataToImportingValues(resoures, type, data);
  const pipeMap = new Map<number, FreePipe[]>();
  for (const pipe of pipes) {
    const arr = pipeMap.get(pipe.line) ?? [];
    pipeMap.set(pipe.line, [...arr, pipe]);
  }
  return pipeMap;
}

function getNewPipes(resoures: DataState, type: "pps" | "xch", data: any) {
  const pipeMap = groupPipesByPipeLine(resoures, type, data);
  let newPipes: FreePipe[] = [];
  Array.from(pipeMap.values()).forEach((arr) => {
    // sort pipes from start to end pipe line
    const pipes: FreePipe[] = arr.sort((a, b) => {
      if (a.pipe === b.preceding) return -1;
      if (b.pipe === a.preceding) return 1;
      return -1;
    });
    newPipes = [...newPipes, ...pipes];
  });
  return newPipes;
}

function getModelBoxes(models: TOpenFrame[], distance: number) {
  const map = new Map<string, TModelBox>();
  models.forEach((model) => {
    const elements = getBeamElementsOfModel(model);
    const min = getMinPosition(model.direction, model.startPos, elements);
    const minA = min.clone();
    const max = getMaxPosition(model.direction, model.startPos, elements);
    const maxA = max.clone();
    if (model.direction === "+X") {
      minA.subScalar(distance);
      maxA.addScalar(distance);
    } else if (model.direction === "-X") {
      minA.set(minA.x + distance, minA.y - distance, minA.z - distance);
      maxA.set(maxA.x - distance, maxA.y + distance, maxA.z + distance);
    } else if (model.direction === "+Z") {
      minA.subScalar(distance);
      maxA.addScalar(distance);
    } else {
      minA.set(minA.x + distance, minA.y - distance, minA.z + distance);
      maxA.set(maxA.x - distance, maxA.y + distance, maxA.z - distance);
    }
    map.set(model.name, { min, minA, max, maxA });
  });
  return map;
}

function getMinPosition(direction: Direction2, pos: Vector3, elements: TBeamElement[]) {
  const v = new Vector3();
  elements.forEach((item) => {
    if (item.startPos.x < v.x) v.setX(item.startPos.x);
    if (item.startPos.y < v.y) v.setY(item.startPos.y);
    if (item.startPos.z < v.z) v.setZ(item.startPos.z);
    if (item.endPos.x < v.x) v.setX(item.endPos.x);
    if (item.endPos.y < v.y) v.setY(item.endPos.y);
    if (item.endPos.z < v.z) v.setZ(item.endPos.z);
  });
  switch (direction) {
    case "-X":
      return v.set(-(v.x - pos.x), v.y + pos.y, v.z + pos.z);
    case "+Z":
      return v.set(v.z, v.y, v.x).add(pos);
    case "-Z":
      return v.set(-v.z, v.y, -v.x).add(pos);
    default:
      return v.add(pos);
  }
}

function getMaxPosition(direction: Direction2, pos: Vector3, elements: TBeamElement[]) {
  const v = new Vector3();
  elements.forEach((item) => {
    if (item.startPos.x > v.x) v.setX(item.startPos.x);
    if (item.startPos.y > v.y) v.setY(item.startPos.y);
    if (item.startPos.z > v.z) v.setZ(item.startPos.z);
    if (item.endPos.x > v.x) v.setX(item.endPos.x);
    if (item.endPos.y > v.y) v.setY(item.endPos.y);
    if (item.endPos.z > v.z) v.setZ(item.endPos.z);
  });
  switch (direction) {
    case "-X":
      return v.set(-(v.x - pos.x), v.y + pos.y, v.z + pos.z);
    case "+Z":
      return v.set(v.z, v.y, v.x).add(pos);
    case "-Z":
      return v.set(-v.z, v.y, -v.x).add(pos);
    default:
      return v.add(pos);
  }
}

function getB1ForPipe(elements: TBeamElement[], direction: Direction3) {
  let beam: TBeamElement | undefined;
  elements
    .filter((el) => el.type === "BEAM")
    .forEach((el) => {
      if (!beam) {
        beam = el;
      } else {
        switch (direction) {
          case "+X":
            if (beam.startPos.x > el.startPos.x) beam = el;
            break;
          case "-X":
            if (beam.startPos.x < el.startPos.x) beam = el;
            break;
          case "+Z":
            if (beam.startPos.z > el.startPos.z) beam = el;
            break;
          case "-Z":
            if (beam.startPos.z < el.startPos.z) beam = el;
            break;
          case "+Y":
            if (beam.startPos.y > el.startPos.y) beam = el;
            break;
          case "-Y":
            if (beam.startPos.y < el.startPos.y) beam = el;
        }
      }
    });
  return beam;
}

function getB2ForPipe(elements: TBeamElement[], direction: Direction3) {
  let beam: TBeamElement | undefined;
  elements
    .filter((el) => el.type === "BEAM")
    .forEach((el) => {
      if (!beam) {
        beam = el;
      } else {
        switch (direction) {
          case "+X":
            if (beam.startPos.x < el.startPos.x) beam = el;
            break;
          case "-X":
            if (beam.startPos.x > el.startPos.x) beam = el;
            break;
          case "+Z":
            if (beam.startPos.z < el.startPos.z) beam = el;
            break;
          case "-Z":
            if (beam.startPos.z > el.startPos.z) beam = el;
            break;
          case "+Y":
            if (beam.startPos.y < el.startPos.y) beam = el;
            break;
          case "-Y":
            if (beam.startPos.y > el.startPos.y) beam = el;
        }
      }
    });
  return beam;
}

export function getBeamsAroundPipe(
  elements: TBeamElement[],
  direction: Direction3,
  start: Vector3,
  end: Vector3
) {
  const columns: TBeamElement[] = [];
  const beams: TBeamElement[] = [];
  elements.forEach((el) => {
    if (
      el.type !== "HORIZONTAL-BRACING" &&
      el.type !== "KNEE-BRACING" &&
      el.type !== "VERTICAL-BRACING"
    ) {
      if (direction.includes("X")) {
        if (el.type !== "COLUMN") {
          if (el.startPos.x === el.endPos.x) {
            const z =
              start.z +
              (direction === "+X"
                ? -getOffsetB(start.x, start.z, end.x, end.z, el.startPos.x)
                : getOffsetB(start.x, start.z, end.x, end.z, el.startPos.x));
            if (
              checkRange(z, el.startPos.z, el.endPos.z, true, true) ||
              checkRange(z, el.endPos.z, el.startPos.z, true, true)
            ) {
              const y = start.y + getOffsetB(start.x, start.y, end.x, end.y, el.startPos.x);
              const distance = el.startPos.y - y;
              const old = beams.find(
                (item) =>
                  item.startPos.x === el.startPos.x &&
                  (distance <= 0 ? item.startPos.y <= y : item.startPos.y > y)
              );
              if (old) {
                const oldDistance = old.startPos.y - y;
                if (distance <= 0) {
                  if (distance > oldDistance) beams.splice(beams.indexOf(old), 1, el);
                } else {
                  if (distance < oldDistance) beams.splice(beams.indexOf(old), 1, el);
                }
              } else beams.push(el);
            }
          }
        } else {
          const y = start.y + getOffsetB(start.x, start.y, end.x, end.y, el.startPos.x);
          if (checkRange(y, el.startPos.y, el.endPos.y, true, true)) {
            const z = start.z + getOffsetB(start.x, start.z, end.x, end.z, el.startPos.x);
            const distance = el.startPos.z - z;
            const old = columns.find(
              (item) =>
                item.startPos.x === el.startPos.x &&
                (distance <= 0 ? item.startPos.z <= z : item.startPos.z > z)
            );
            if (old) {
              const oldDistance = old.startPos.z - z;
              if (distance <= 0) {
                if (distance > oldDistance) columns.splice(columns.indexOf(old), 1, el);
              } else {
                if (distance < oldDistance) columns.splice(columns.indexOf(old), 1, el);
              }
            } else columns.push(el);
          }
        }
      } else if (direction.includes("Z")) {
        if (el.type !== "COLUMN") {
          if (el.startPos.z === el.endPos.z) {
            const x = start.x + getOffsetB(start.z, start.x, end.z, end.x, el.startPos.z);
            if (
              checkRange(x, el.startPos.x, el.endPos.x, true, true) ||
              checkRange(x, el.endPos.x, el.startPos.x, true, true)
            ) {
              const y = start.y + getOffsetB(start.z, start.y, end.z, end.y, el.startPos.z);
              const distance = el.startPos.y - y;
              const old = beams.find(
                (item) =>
                  item.startPos.z === el.startPos.z &&
                  (distance <= 0 ? item.startPos.y <= y : item.startPos.y > y)
              );
              if (old) {
                const oldDistance = old.startPos.y - y;
                if (distance <= 0) {
                  if (distance > oldDistance) beams.splice(beams.indexOf(old), 1, el);
                } else {
                  if (distance < oldDistance) beams.splice(beams.indexOf(old), 1, el);
                }
              } else beams.push(el);
            }
          }
        } else {
          const y = start.y + getOffsetB(start.z, start.y, end.z, end.y, el.startPos.z);
          if (checkRange(y, el.startPos.y, el.endPos.y, true, true)) {
            const x = start.x + getOffsetB(start.z, start.x, end.z, end.x, el.startPos.z);
            const distance = el.startPos.x - x;
            const old = columns.find(
              (item) =>
                item.startPos.z === el.startPos.z &&
                (distance <= 0 ? item.startPos.x <= x : item.startPos.x > x)
            );
            if (old) {
              const oldDistance = old.startPos.x - x;
              if (distance <= 0) {
                if (distance > oldDistance) columns.splice(columns.indexOf(old), 1, el);
              } else {
                if (distance < oldDistance) columns.splice(columns.indexOf(old), 1, el);
              }
            } else columns.push(el);
          }
        }
      } else if (el.type !== "COLUMN") {
        if (el.startPos.x === el.endPos.x) {
          const z = start.z + getOffsetB(start.y, start.z, end.y, end.z, el.startPos.y);
          if (
            checkRange(z, el.startPos.z, el.endPos.z, true, true) ||
            checkRange(z, el.endPos.z, el.startPos.z, true, true)
          ) {
            const x = start.x + getOffsetB(start.y, start.x, end.y, end.x, el.startPos.y);
            const distance = el.startPos.x - x;
            const old = beams.find(
              (item) =>
                item.startPos.x === item.endPos.x &&
                item.startPos.y === el.startPos.y &&
                (distance <= 0 ? item.startPos.x <= x : item.startPos.x > x)
            );
            if (old) {
              const oldDistance = old.startPos.x - x;
              if (distance <= 0) {
                if (distance > oldDistance) beams.splice(beams.indexOf(old), 1, el);
              } else {
                if (distance < oldDistance) beams.splice(beams.indexOf(old), 1, el);
              }
            } else beams.push(el);
          }
        } else if (el.startPos.z === el.endPos.z) {
          const x = start.x + getOffsetB(start.y, start.x, end.y, end.x, el.startPos.y);
          if (
            checkRange(x, el.startPos.x, el.endPos.x, true, true) ||
            checkRange(x, el.endPos.x, el.startPos.x, true, true)
          ) {
            const z = start.z + getOffsetB(start.y, start.z, end.y, end.z, el.startPos.y);
            const distance = el.startPos.z - z;
            const old = beams.find(
              (item) =>
                item.startPos.x === item.endPos.x &&
                item.startPos.y === el.startPos.y &&
                (distance <= 0 ? item.startPos.z <= z : item.startPos.z > z)
            );
            if (old) {
              const oldDistance = old.startPos.z - z;
              if (distance <= 0) {
                if (distance > oldDistance) beams.splice(beams.indexOf(old), 1, el);
              } else {
                if (distance < oldDistance) beams.splice(beams.indexOf(old), 1, el);
              }
            } else beams.push(el);
          }
        }
      }
    }
  });
  return [...columns, ...beams];
}

function checkPosition(point: Vector3, box: TModelBox) {
  return (
    checkRange(point.x, box.minA.x, box.maxA.x, true, true, true) &&
    checkRange(point.y, box.minA.y, box.maxA.y, true, true) &&
    checkRange(point.z, box.minA.z, box.maxA.z, true, true, true)
  );
}
