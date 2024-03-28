import {
  FreePipe,
  Direction3,
  Project,
  PipeRack,
  PipeRackBeam,
  PipeRackCantilever,
  PipeRackColumn,
  Pipe,
  SupType,
  AccessoryElement,
  PipeRackPortal,
  Accessory,
  Direction2,
} from "../../../store/main/types";
import { changeProjectAction } from "../../../store/main/actions";
import { Dispatch } from "redux";
import { getPosByDistance, checkRange, getOffsetB, getIndexName, getNextId, MMtoM } from "../utils";
import { Vector3 } from "three";
import { DataState } from "../../../store/data/types";
import { mapPipes } from "../xch/PPxch";

type TModelBox = { min: Vector3; minA: Vector3; max: Vector3; maxA: Vector3 };

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

function getDistance(arr: FreePipe[], toIndex: number) {
  let distance = 0;
  for (let i = 0; i <= toIndex; i++) {
    const pipe = arr[i];
    const start = new Vector3(pipe.x1, pipe.y1, pipe.z1);
    const end = new Vector3(pipe.x2, pipe.y2, pipe.z2);
    distance += start.distanceTo(end);
  }
  return distance;
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

function getMinPosition(
  direction: Direction2,
  pos: Vector3,
  elements: (PipeRackBeam | PipeRackCantilever)[]
) {
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

function getMaxPosition(
  direction: Direction2,
  pos: Vector3,
  elements: (PipeRackBeam | PipeRackCantilever)[]
) {
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

export function getBeamsAroundPipe(
  elements: (PipeRackBeam | PipeRackCantilever)[],
  direction: Direction3,
  start: Vector3,
  end: Vector3,
  isSoft?: boolean
) {
  const beams: (PipeRackBeam | PipeRackCantilever)[] = [];
  elements.forEach((el) => {
    if (direction.includes("X")) {
      if (
        el.startPos.x === el.endPos.x &&
        checkRange(el.startPos.x, start.x, end.x, true, true, true)
      ) {
        const z =
          start.z +
          (direction === "+X"
            ? -getOffsetB(start.x, start.z, end.x, end.z, el.startPos.x)
            : getOffsetB(start.x, start.z, end.x, end.z, el.startPos.x));
        if (checkRange(z, el.startPos.z, el.endPos.z, true, true, true) || isSoft) {
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
              if (distance > oldDistance) beams.splice(beams.indexOf(old), 1, el as PipeRackBeam);
            } else {
              if (distance < oldDistance) beams.splice(beams.indexOf(old), 1, el as PipeRackBeam);
            }
          } else beams.push(el as PipeRackBeam);
        }
      }
    } else if (direction.includes("Z")) {
      if (
        el.startPos.z === el.endPos.z &&
        checkRange(el.startPos.z, start.z, end.z, true, true, true)
      ) {
        const x = start.x + getOffsetB(start.z, start.x, end.z, end.x, el.startPos.z);
        if (checkRange(x, el.startPos.x, el.endPos.x, true, true, true) || isSoft) {
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
              if (distance > oldDistance) beams.splice(beams.indexOf(old), 1, el as PipeRackBeam);
            } else {
              if (distance < oldDistance) beams.splice(beams.indexOf(old), 1, el as PipeRackBeam);
            }
          } else beams.push(el as PipeRackBeam);
        }
      }
    } else {
      if (el.startPos.x === el.endPos.x) {
        const z = start.z + getOffsetB(start.y, start.z, end.y, end.z, el.startPos.y);
        if (checkRange(z, el.startPos.z, el.endPos.z, true, true, true)) {
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
              if (distance > oldDistance) beams.splice(beams.indexOf(old), 1, el as PipeRackBeam);
            } else {
              if (distance < oldDistance) beams.splice(beams.indexOf(old), 1, el as PipeRackBeam);
            }
          } else beams.push(el as PipeRackBeam);
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
              if (distance > oldDistance) beams.splice(beams.indexOf(old), 1, el as PipeRackBeam);
            } else {
              if (distance < oldDistance) beams.splice(beams.indexOf(old), 1, el as PipeRackBeam);
            }
          } else beams.push(el as PipeRackBeam);
        }
      }
    }
  });
  return beams;
}

function getB1ForPipe(
  elements: (PipeRackColumn | PipeRackBeam | PipeRackCantilever)[],
  direction: Direction3
) {
  let beam: PipeRackBeam | undefined;
  elements
    .filter((el) => el.type === "PipeRackBeam" && !(el as PipeRackBeam).additional)
    .forEach((el) => {
      if (!beam) {
        beam = el as PipeRackBeam;
      } else {
        switch (direction) {
          case "+X":
            if (beam.startPos.x > el.startPos.x) beam = el as PipeRackBeam;
            break;
          case "-X":
            if (beam.startPos.x < el.startPos.x) beam = el as PipeRackBeam;
            break;
          case "+Z":
            if (beam.startPos.z > el.startPos.z) beam = el as PipeRackBeam;
            break;
          case "-Z":
            if (beam.startPos.z < el.startPos.z) beam = el as PipeRackBeam;
            break;
          case "+Y":
            if (beam.startPos.y > el.startPos.y) beam = el as PipeRackBeam;
            break;
          case "-Y":
            if (beam.startPos.y < el.startPos.y) beam = el as PipeRackBeam;
        }
      }
    });
  return beam;
}

function getB2ForPipe(
  elements: (PipeRackColumn | PipeRackBeam | PipeRackCantilever)[],
  direction: Direction3
) {
  let beam: PipeRackBeam | undefined;
  elements
    .filter((el) => el.type === "PipeRackBeam" && !(el as PipeRackBeam).additional)
    .forEach((el) => {
      if (!beam) {
        beam = el as PipeRackBeam;
      } else {
        switch (direction) {
          case "+X":
            if (beam.startPos.x < el.startPos.x) beam = el as PipeRackBeam;
            break;
          case "-X":
            if (beam.startPos.x > el.startPos.x) beam = el as PipeRackBeam;
            break;
          case "+Z":
            if (beam.startPos.z < el.startPos.z) beam = el as PipeRackBeam;
            break;
          case "-Z":
            if (beam.startPos.z > el.startPos.z) beam = el as PipeRackBeam;
            break;
          case "+Y":
            if (beam.startPos.y < el.startPos.y) beam = el as PipeRackBeam;
            break;
          case "-Y":
            if (beam.startPos.y > el.startPos.y) beam = el as PipeRackBeam;
        }
      }
    });
  return beam;
}

function getAccessoriesBeams(accessories: Accessory[], portals: PipeRackPortal[]) {
  let mapped: any[] = [];
  accessories.forEach((ag: Accessory) => {
    const portal = portals.find((portal) => portal.name === ag.parent);
    if (portal) {
      ag.elements.forEach((el: AccessoryElement) => {
        mapped = [...mapped, ...el.beamItems];
      });
    }
  });
  return mapped;
}

function getModelBoxes(models: PipeRack[], distance: number) {
  const map = new Map<string, TModelBox>();
  models.forEach((model) => {
    const elements = [
      ...model.beams,
      ...model.cantilevers,
      ...getAccessoriesBeams(model.accessories, model.portals),
    ];
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

export function importPipesToModels(
  dispatch: Dispatch<any>,
  project: Project,
  resoures: DataState,
  type: "pps" | "xch",
  data: any,
  dist?: number
) {
  const distance = dist ?? 2;
  const models = project.models as PipeRack[];
  const modelBoxes = getModelBoxes(models, distance);
  let changedProject = { ...project };
  const oldPipes = models.reduce((acc, model) => [...acc, ...model.pipes], [] as Pipe[]);
  const newPipes = getNewPipes(resoures, type, data);
  newPipes.forEach((item) => {
    splitByModelsBoxes(item, models, modelBoxes);

    const middle = new Vector3(
      item.x1 + item.x2,
      item.y1 + item.y2,
      item.z1 + item.z2
    ).divideScalar(2);

    let isAdded = false;

    models.forEach((model) => {
      if (!isAdded) {
        const box = modelBoxes.get(model.name);
        if (box && checkPosition(middle, box)) {
          const index = getIndexName(oldPipes, "PP");
          const start = new Vector3();
          const end = new Vector3();
          if (model.direction.includes("Z")) {
            start.set(item.x1, item.y1, item.z1);
            end.set(item.x2, item.y2, item.z2);
            if (model.direction === "+Z") {
              start.sub(model.startPos).set(start.z, start.y, -start.x);
              end.sub(model.startPos).set(end.z, end.y, -end.x);
            } else {
              start.set(
                model.startPos.z - item.z2,
                start.y - model.startPos.y,
                start.x - model.startPos.x
              );
              end.set(
                model.startPos.z - item.z1,
                end.y - model.startPos.y,
                end.x - model.startPos.x
              );
            }
          } else {
            start.set(item.x1, item.y1, item.z1).sub(model.startPos);
            end.set(item.x2, item.y2, item.z2).sub(model.startPos);
            if (model.direction === "-X") {
              start.setX(-start.x).setZ(-start.z);
              end.setX(-end.x).setZ(-end.z);
            }
          }
          const direction = getPipeDirection(start, end);
          const beams = getBeamsAroundPipe(
            [...model.beams, ...model.cantilevers],
            direction,
            start,
            end,
            true
          );

          const b1 = getB1ForPipe(beams, direction);
          const b2 = getB2ForPipe(beams, direction);

          const fromIndex = model.portals.findIndex(
            (portal) => portal.name === (b1?.parent ?? b2?.parent)
          );
          const toIndex = model.portals.findIndex(
            (portal) => portal.name === (b2?.parent ?? b1?.parent)
          );

          const fromPortal = model.portals[fromIndex];
          const toPortal = model.portals[toIndex];

          if (fromPortal && toPortal) {
            let startBayDist = 0,
              startLeftDist = 0,
              endBayDist = 0,
              endLeftDist = 0;
            switch (direction) {
              case "+X":
                startBayDist = start.x - fromPortal.chainage;
                startLeftDist = start.z + fromPortal.width / 2;
                endBayDist = toPortal.chainage + toPortal.length - end.x;
                endLeftDist = end.z + toPortal.width / 2;
                break;
              case "-X":
                if (model.direction === "-X") {
                  startBayDist = fromPortal.chainage + fromPortal.length - start.x;
                  endBayDist = end.x - toPortal.chainage;
                } else {
                  startBayDist = toPortal.chainage + toPortal.length - start.x;
                  endBayDist = end.x - fromPortal.chainage;
                }
                startLeftDist = fromPortal.width / 2 - start.z;
                endLeftDist = toPortal.width / 2 - end.z;
                break;
              case "+Z":
                startBayDist = start.z + fromPortal.width / 2;
                startLeftDist = toPortal.chainage + toPortal.length - start.x;
                endBayDist = fromPortal.width / 2 - end.z;
                endLeftDist = toPortal.chainage + toPortal.length - end.x;
                break;
              case "-Z":
                startBayDist = fromPortal.width / 2 - start.z;
                startLeftDist = start.x - fromPortal.chainage;
                endBayDist = end.z + fromPortal.width / 2;
                endLeftDist = end.x - fromPortal.chainage;
                break;
              case "+Y":
              case "-Y":
                startBayDist = start.x - fromPortal.chainage;
                startLeftDist = start.z + fromPortal.width / 2;
                endBayDist = end.x - fromPortal.chainage;
                endLeftDist = end.z + fromPortal.width / 2;
            }

            const pipe: Pipe = {
              id: getNextId(oldPipes),
              name: `PP${index}`,
              diameter: MMtoM(item.params.od ?? item.params.profile?.outside_diameter_global ?? 0),
              thickness: MMtoM(
                item.params.thickness ?? item.params.profile?.wall_thickness_global ?? 0
              ),
              direction,
              start,
              parent: model.name,
              fromPortal: fromPortal.name,
              toPortal: direction.includes("Y") ? fromPortal.name : toPortal.name,
              startElevation: start.y,
              startBayDist,
              startLeftDist,
              end,
              endElevation: end.y,
              endBayDist,
              endLeftDist,
              material: item.params.material ?? resoures.materials[0],
              profile: item.params.profile,
              succeeding: "END",
              supTypes:
                item.params.supportDetails?.map((supp) => {
                  return {
                    ...supp,
                    KforSpring: 0,
                    beam: undefined,
                    position: getPosByDistance(supp.distance, start, end),
                  } as SupType;
                }) ?? [],
            };

            oldPipes.push(pipe);
            isAdded = true;
          }
        }
      }
    });
  });

  changedProject = {
    ...changedProject,
    models: changedProject.models.map((model) => ({
      ...model,
      pipes: oldPipes.filter((oldPipe) => oldPipe.parent === model.name),
    })),
  };

  dispatch(changeProjectAction(changedProject));
}

function checkPosition(point: Vector3, box: TModelBox) {
  return (
    checkRange(point.x, box.minA.x, box.maxA.x, true, true, true) &&
    checkRange(point.y, box.minA.y, box.maxA.y, true, true) &&
    checkRange(point.z, box.minA.z, box.maxA.z, true, true, true)
  );
}

type TSplitModificator = {
  position: "in" | "out" | "start" | "end";
  point: "start" | "middle" | "end";
  model: string;
};

function splitByModelsBoxes(pipe: FreePipe, models: PipeRack[], boxes: Map<string, TModelBox>) {
  const start = new Vector3(pipe.x1, pipe.y1, pipe.z1);
  const end = new Vector3(pipe.x2, pipe.y2, pipe.z2);
  const dir = getPipeDirection(start, end);
  const map = new Map<number, TSplitModificator>();
  // for (const model of models) {
  //   const box = boxes.get(model.name);
  //   if (!box) continue;
  //   if (checkPosition(start, box)) {
  //     // map.set()
  //   } else {
  //   }
  //   if (checkPosition(end, box)) {
  //   } else {
  //   }
  // }
}
