import {
  PipeRack,
  IndianEffectiveLength,
  TDeflectionLengthPR,
} from "../../../../../store/main/types";
import { roundM } from "../../../../3d-models/utils";
import {
  splitColumns,
  splitBeams,
  splitCantilevers,
  getHBracingsWithPositions,
  getAccessoriesElements,
} from "../../../../3d-models/pipe-rack/pipeRackUtils";

function getDirection(el: any) {
  const byX = el.startPos.x - el.endPos.x;
  const byZ = el.startPos.z - el.endPos.z;
  return Math.abs(byX) >= Math.abs(byZ) ? "X" : "Z";
}

function checkStart(
  elements: any[],
  el: any,
  method: 1 | 2 | 3,
  slz: boolean,
  sly: boolean,
  isEL = true
) {
  let isStartLz = slz;
  let isStartLy = sly;
  const startColumns = elements.filter(
    (item) =>
      item.type === "PipeRackColumn" &&
      (item.startPos.equals(el.startPos) || item.endPos.equals(el.startPos))
  );

  if (startColumns.some((item) => !item.additional)) isStartLz = isStartLy = false;

  if (
    isEL &&
    (startColumns.some((item) => item.additional && item.lowerBeam && item.upperBeam) ||
      elements.some(
        (item) =>
          item === "PipeRackVBracing" &&
          (item.startPos.equals(el.startPos) || item.endPos.equals(el.startPos))
      ))
  ) {
    if (method === 1) isStartLz = false;
    if (method === 2) isStartLy = false;
    if (method === 3) isStartLz = isStartLy = false;
  }

  if (
    isEL &&
    elements.some((item) => {
      if (item.name === el.name) return false;
      if (item.type === "PipeRackBeam") {
        return (
          item.startPos.equals(el.startPos) ||
          (item.endPos.equals(el.startPos) && getDirection(item) !== getDirection(el))
        );
      } else if (item.type === "PipeRackHBracing") {
        return item.startPos.equals(el.startPos) || item.endPos.equals(el.startPos);
      } else return false;
    })
  ) {
    if (method === 1) isStartLy = false;
    if (method === 2) isStartLz = false;
    if (method === 3) isStartLz = isStartLy = false;
  }

  if (el.releases) {
    if (
      el.releases.fx1 ||
      el.releases.fy1 ||
      el.releases.fz1 ||
      el.releases.mx1 ||
      el.releases.my1 ||
      el.releases.mz1
    ) {
      isStartLy = isStartLz = false;
    }
  }

  return { isStartLy, isStartLz };
}

function checkEnd(
  elements: any[],
  el: any,
  method: 1 | 2 | 3,
  elz: boolean,
  ely: boolean,
  isEL = true
) {
  let isEndLz = elz;
  let isEndLy = ely;
  const endColumns = elements.filter(
    (item) =>
      item.type === "PipeRackColumn" &&
      (item.startPos.equals(el.endPos) || item.endPos.equals(el.endPos))
  );

  if (endColumns.some((item) => !item.additional)) isEndLz = isEndLy = false;

  if (
    isEL &&
    (endColumns.some((item) => item.additional && item.lowerBeam && item.upperBeam) ||
      elements.some(
        (item) =>
          item.type === "PipeRackVBracing" &&
          (item.startPos.equals(el.endPos) || item.endPos.equals(el.endPos))
      ))
  ) {
    if (method === 1) isEndLz = false;
    if (method === 2) isEndLy = false;
    if (method === 3) isEndLz = isEndLy = false;
  }

  if (
    isEL &&
    elements.some((item) => {
      if (item.name === el.name) return false;
      if (item.type === "PipeRackBeam") {
        return (
          item.endPos.equals(el.endPos) ||
          (item.startPos.equals(el.endPos) && getDirection(item) !== getDirection(el))
        );
      } else if (item.type === "PipeRackHBracing") {
        return item.startPos.equals(el.endPos) || item.endPos.equals(el.endPos);
      } else return false;
    })
  ) {
    if (method === 1) isEndLy = false;
    if (method === 2) isEndLz = false;
    if (method === 3) isEndLz = isEndLy = false;
  }

  if (el.releases) {
    if (
      el.releases.fx2 ||
      el.releases.fy2 ||
      el.releases.fz2 ||
      el.releases.mx2 ||
      el.releases.my2 ||
      el.releases.mz2
    ) {
      isEndLy = isEndLz = false;
    }
  }

  return { isEndLy, isEndLz };
}

function getLength(el: any) {
  return el.startPos.distanceTo(el.endPos);
}

export function getElements(model: PipeRack | undefined, isDl: boolean) {
  if (!model) return [];
  const elements = [
    ...splitColumns(model.columns, isDl),
    ...splitBeams(model.beams, isDl),
    ...splitCantilevers(model.cantilevers, isDl),
    ...model.vBracings,
    ...getHBracingsWithPositions(model.hBracings, [...model.beams, ...model.cantilevers]),
    ...getAccessoriesElements(model.accessories, model.portals, isDl),
  ];
  return elements;
}

function getElementLengthsPR(model: PipeRack, elements: any[], el: any) {
  let Ly = el.startPos.distanceTo(el.endPos);
  let Lz = Ly;
  let Ky = 1;
  let Kz = 1;

  let isStartLy = true;
  let isEndLy = true;
  let isStartLz = true;
  let isEndLz = true;

  const method =
    !el.orientation || el.orientation === 180
      ? 1
      : el.orientation === 90 || el.orientation === 270
      ? 2
      : 3;

  if (el.type === "PipeRackColumn" || el.type === "AccessoryColumn") {
    if (el.startPos.y === model.baseElevation) {
      const portal = model.portals.find((p) => p.name === el.parent);
      if (portal) {
        if (portal.supportType === "Pin") {
          if (
            (method === 1 && el.startPos.x === el.endPos.x) ||
            (method === 2 && el.startPos.z === el.endPos.z)
          ) {
            Kz = 2;
          } else if (
            (method === 1 && el.startPos.z === el.endPos.z) ||
            (method === 2 && el.startPos.x === el.endPos.x)
          ) {
            Ky = 2;
          }
        } else {
          if (
            (method === 1 && el.startPos.x === el.endPos.x) ||
            (method === 2 && el.startPos.z === el.endPos.z)
          ) {
            Kz = 1.2;
            Ky = 2;
          } else if (
            (method === 1 && el.startPos.z === el.endPos.z) ||
            (method === 2 && el.startPos.x === el.endPos.x)
          ) {
            Kz = 2;
            Ky = 1.2;
          }
        }
      }
    } else if (
      el.additional &&
      ((el.lowerBeam && !el.upperBeam) ||
        !el.releases ||
        el.releases.fx1 ||
        el.releases.fy1 ||
        el.releases.fz1 ||
        el.releases.mx1 ||
        el.releases.my1 ||
        el.releases.mz1)
    ) {
      Kz = 2;
    }
  } else if (
    el.type === "PipeRackBeam" ||
    el.type === "PipeRackCantilever" ||
    el.type === "AccessoryBeam"
  ) {
    const checkS = checkStart(elements, el, method, isStartLz, isStartLy);
    isStartLy = checkS.isStartLy;
    isStartLz = checkS.isStartLz;

    let prev;
    while (isStartLy || isStartLz) {
      const element: any = prev ?? el;
      prev = elements.find(
        (item) =>
          item.type === element.type &&
          item.endPos.equals(element.startPos) &&
          getDirection(item) === getDirection(element) &&
          (item.orientation ?? 0) === (element.orientation ?? 0) &&
          item.profile?.profile_section_id === element.profile?.profile_section_id
      );

      if (!prev) {
        isStartLz = isStartLy = false;
        break;
      }

      const checkPrevE = checkEnd(elements, prev, method, isStartLz, isStartLy);
      isStartLy = checkPrevE.isEndLy;
      isStartLz = checkPrevE.isEndLz;

      if (isStartLy) Ly += getLength(prev);
      if (isStartLz) Lz += getLength(prev);

      const checkPrevS = checkStart(elements, prev, method, isStartLz, isStartLy);
      isStartLy = checkPrevS.isStartLy;
      isStartLz = checkPrevS.isStartLz;
    }

    const checkE = checkEnd(elements, el, method, isEndLz, isEndLy);
    isEndLy = checkE.isEndLy;
    isEndLz = checkE.isEndLz;

    let next;
    while (isEndLy || isEndLz) {
      const element: any = next ?? el;
      next = elements.find(
        (item) =>
          item.type === element.type &&
          item.startPos.equals(element.endPos) &&
          getDirection(item) === getDirection(element) &&
          (item.orientation ?? 0) === (element.orientation ?? 0) &&
          item.profile?.profile_section_id === element.profile?.profile_section_id
      );

      if (!next) {
        isEndLz = isEndLy = false;
        break;
      }

      const checkNextS = checkStart(elements, next, method, isEndLz, isEndLy);
      isEndLy = checkNextS.isStartLy;
      isEndLz = checkNextS.isStartLz;

      if (isEndLy) Ly += getLength(next);
      if (isEndLz) Lz += getLength(next);

      const checkNextE = checkEnd(elements, next, method, isEndLz, isEndLy);
      isEndLy = checkNextE.isEndLy;
      isEndLz = checkNextE.isEndLz;
    }
  }
  return { Ly, Lz, Ky, Kz };
}

export function getPREffectiveLengths(models: PipeRack[]) {
  const els: IndianEffectiveLength[] = [];
  for (const model of models) {
    const elements = getElements(model, true);
    for (const el of elements) {
      const { Ly, Lz, Ky, Kz } = getElementLengthsPR(model, elements, el);
      els.push({
        id: els.length,
        selected: false,
        pr: model.name,
        element: el.name,
        Ly: roundM(Ly),
        Lz: roundM(Lz),
        Ky,
        Kz,
      });
    }
  }
  return els;
}

function getDeflectionLengthsPR(elements: any[], el: any): number {
  let dl: number = el.startPos.distanceTo(el.endPos);

  let isStart = true;
  let isEnd = true;
  const method =
    !el.orientation || el.orientation === 180
      ? 1
      : el.orientation === 90 || el.orientation === 270
      ? 2
      : 3;

  if (
    el.type === "PipeRackBeam" ||
    el.type === "PipeRackCantilever" ||
    el.type === "AccessoryBeam"
  ) {
    const checkS = checkStart(elements, el, method, isStart, isStart, false);
    isStart = checkS.isStartLy;

    let prev;
    while (isStart) {
      const element: any = prev ?? el;
      prev = elements.find(
        (item) =>
          item.type === element.type &&
          item.endPos.equals(element.startPos) &&
          getDirection(item) &&
          getDirection(element) &&
          (item.orientation ?? 0) === (element.orientation ?? 0) &&
          item.profile?.profile_section_id === element.profile?.profile_section_id
      );

      if (!prev) {
        isStart = false;
        break;
      }

      const checkPrevE = checkEnd(elements, prev, method, isStart, isStart, false);
      isStart = checkPrevE.isEndLy;

      if (isStart) dl += getLength(prev);

      const checkPrevS = checkStart(elements, prev, method, isStart, isStart, false);
      isStart = checkPrevS.isStartLy;
    }

    const checkE = checkEnd(elements, el, method, isEnd, isEnd, false);
    isEnd = checkE.isEndLy;

    let next;
    while (isEnd) {
      const element: any = next ?? el;
      next = elements.find(
        (item) =>
          item.type === element.type &&
          item.startPos.equals(element.endPos) &&
          getDirection(item) &&
          getDirection(element) &&
          (item.orientation ?? 0) === (element.orientation ?? 0) &&
          item.profile?.profile_section_id === element.profile?.profile_section_id
      );

      if (!next) {
        isEnd = false;
        break;
      }

      const checkNextS = checkStart(elements, next, method, isEnd, isEnd, false);
      isEnd = checkNextS.isStartLy;

      if (isEnd) dl += getLength(next);

      const checkNextE = checkEnd(elements, next, method, isEnd, isEnd, false);
      isEnd = checkNextE.isEndLy;
    }
  }
  return roundM(dl);
}

export function getPRDeflectionLengths(models: PipeRack[]) {
  const els: TDeflectionLengthPR[] = [];
  for (const model of models) {
    const elements = getElements(model, true);
    for (const el of elements) {
      els.push({
        id: els.length,
        selected: false,
        model: model.name,
        element: el.name,
        dl: getDeflectionLengthsPR(elements, el),
      });
    }
  }
  return els;
}
