import * as PR_TYPES from "../../../store/main/types";
import * as UTILS from "../utils";
import { getBeamsAroundPipe } from "../pipe-importing/toPipeRack";
import { PRGeometryUI } from "../../../store/ui/types";
import { Section } from "../../../store/data/types";
import {
  DoubleSide,
  Font,
  Group,
  Mesh,
  MeshLambertMaterial,
  TextGeometry,
  Vector3,
} from "three";
import { ArrowHelper } from "three";
import { deg180InRad, deg90InRad } from "../../../store/main/constants";

const blueHex = 0x0000ff;
const redHex = 0xff0000;
const greenHex = 0x00d000;

const vX = new Vector3(1, 0, 0);
const vY = new Vector3(0, 1, 0);
const vZ = new Vector3(0, 0, 1);

export function getPRModels(project?: PR_TYPES.Project): PR_TYPES.PipeRack[] {
  if (!project) return [];
  return project.models.filter(
    (model) => model.type === "Pipe Rack"
  ) as PR_TYPES.PipeRack[];
}

export function createPipeRack(
  project: string,
  index: number,
  name: string = "PR",
  params: PRGeometryUI
): PR_TYPES.PipeRack {
  const prName = name + index;
  const pr = {
    project,
    type: "Pipe Rack",
    name: prName,
    startPos: new Vector3(params.x, params.y, params.z),
    baseElevation: params.baseElevation,
    direction: params.direction,
    CSLibrary: params.library,
    portalBeamProfile: params.beamProfile,
    portalColProfile: params.colProfile,
    portalTieProfile: params.tieProfile,
    material: params.material,
    portals: [],
    columns: [],
    beams: [],
    vBracings: [],
    hBracings: [],
    cantilevers: [],
    accessories: [],
    pipes: [],
    platforms: [],
    ladders: [],
    plates: [],
    flanges: [],
  } as PR_TYPES.PipeRack;
  const height = params.topTierElevation / params.noOfTiers;
  const length = params.length / params.noOfBays;
  for (let i = 0; i <= params.noOfBays; i++) {
    createPortal(pr, params, i, height, length, params.supportType);
  }
  for (let tier = 0; tier < params.noOfTiers; tier++) {
    pr.portals.forEach((p) => {
      createColumn(pr, p, tier, "R", true);
      createColumn(pr, p, tier, "L", true);
      createBeams(pr, p, tier);
    });
  }
  return pr;
}

function createPortal(
  pr: PR_TYPES.PipeRack,
  params: PRGeometryUI,
  index: number,
  height: number,
  length: number,
  supportType: PR_TYPES.SupportType
) {
  const tiers: number[] = [];
  for (let tier = 0; tier < params.noOfTiers; tier++)
    tiers[tier] = height * (tier + 1);
  pr.portals.push({
    id: index + 1,
    name: `${pr.name}-P${index + 1}`,
    parent: pr.name,
    chainage: length * index,
    tiers,
    length: index === params.noOfBays ? 0 : length,
    width: params.width,
    position: index ? (index === params.noOfBays ? "end" : "middle") : "start",
    supportType,
  });
}

/**
 * @param pr is parent model
 * @param portal is parent portal
 * @param tier is number of portal tier
 * @param side is L (left) or R (right)
 * @param isInit is true only when creating a model
 * @return PipeRackColumn
 */
export function createColumn(
  pr: PR_TYPES.PipeRack,
  portal: PR_TYPES.PipeRackPortal,
  tier: number,
  side: PR_TYPES.Side,
  isInit?: boolean
) {
  const index = UTILS.getIndexName(pr.columns, "C");
  const posY = portal.tiers[tier - 1] ?? 0;
  let posZ = portal.width / 2;
  if (side === "L") posZ *= -1;
  let column = {
    id: index,
    name: `C${index}`,
    parent: portal.name,
    type: "PipeRackColumn",
    tier,
    side,
    startPos: new Vector3(portal.chainage, posY, posZ),
    endPos: new Vector3(
      portal.chainage,
      posY + (portal.tiers[tier] - posY),
      posZ
    ),
    CSLibrary: pr.CSLibrary,
    profile: pr.portalColProfile,
  } as PR_TYPES.PipeRackColumn;
  if (isInit && tier === 0) {
    column = {
      ...column,
      onGround: true,
      startPos: column.startPos.setY(pr.baseElevation),
    };
  }
  pr.columns.push(column);
}

export function createBeams(
  pr: PR_TYPES.PipeRack,
  portal: PR_TYPES.PipeRackPortal,
  tier: number
) {
  const beamH = portal.tiers[tier];
  const index = UTILS.getIndexName(pr.beams, "B");
  const posZ = portal.width / 2;
  pr.beams.push({
    id: index,
    name: `B${index}`,
    parent: portal.name,
    type: "PipeRackBeam",
    tier,
    direction: "Z",
    startPos: new Vector3(portal.chainage, beamH, posZ),
    endPos: new Vector3(portal.chainage, beamH, posZ * -1),
    CSLibrary: pr.CSLibrary,
    profile: pr.portalBeamProfile,
  });
  if (portal.position !== "end") {
    pr.beams.push({
      id: index + 1,
      name: `B${index + 1}`,
      parent: portal.name,
      type: "PipeRackBeam",
      tier,
      side: "R",
      direction: "X",
      startPos: new Vector3(portal.chainage, beamH, posZ),
      endPos: new Vector3(portal.chainage + portal.length, beamH, posZ),
      CSLibrary: pr.CSLibrary,
      profile: pr.portalTieProfile,
      releases: {
        my1: true,
        mz1: true,
        my2: true,
        mz2: true,
      },
    });
    pr.beams.push({
      id: index + 2,
      name: `B${index + 2}`,
      parent: portal.name,
      type: "PipeRackBeam",
      tier,
      side: "L",
      direction: "X",
      startPos: new Vector3(portal.chainage, beamH, posZ * -1),
      endPos: new Vector3(portal.chainage + portal.length, beamH, posZ * -1),
      CSLibrary: pr.CSLibrary,
      profile: pr.portalTieProfile,
      releases: {
        my1: true,
        mz1: true,
        my2: true,
        mz2: true,
      },
    });
  }
}

export function createVBracing(
  id: number,
  name: string,
  fromPortal: PR_TYPES.PipeRackPortal,
  toPortal: PR_TYPES.PipeRackPortal,
  tier: number,
  side: PR_TYPES.Side | "Portal",
  sideType: PR_TYPES.Side | "Both" | "Portal",
  bracingType: PR_TYPES.BracingType,
  CSLibrary: string,
  profile: Section,
  baseElevation: number,
  isUp?: boolean,
  uiId?: number
): PR_TYPES.PipeRackVBracing {
  let posY;
  let height;

  let startPos;
  let endPos;

  if (side === "Portal") {
    posY = fromPortal.tiers[tier - 1] ?? baseElevation ?? 0;
    height = fromPortal.tiers[tier] - posY;

    startPos = new Vector3(fromPortal.chainage, posY, fromPortal.width / 2);
    endPos = new Vector3(
      fromPortal.chainage,
      posY + height,
      fromPortal.width / -2
    );
  } else {
    posY =
      (fromPortal.tiers[tier - 1] > toPortal.tiers[tier - 1]
        ? toPortal.tiers[tier - 1]
        : fromPortal.tiers[tier - 1]) ??
      baseElevation ??
      0;
    height =
      (fromPortal.tiers[tier] > toPortal.tiers[tier]
        ? toPortal.tiers[tier]
        : fromPortal.tiers[tier]) - posY;

    startPos = new Vector3(
      fromPortal.chainage,
      posY,
      fromPortal.width / (side === "R" ? 2 : -2)
    );
    endPos = new Vector3(
      toPortal.chainage,
      posY + height,
      toPortal.width / (side === "R" ? 2 : -2)
    );
  }

  let avgZ;
  let length;

  if (side === "Portal") {
    avgZ = (startPos.z + endPos.z) / 2;
    length = 0;
  } else {
    avgZ = (startPos.z + endPos.z) / 2;
    length = (endPos.x - startPos.x) / 2;
  }

  switch (bracingType) {
    case "Diagonal Down":
      startPos.setY(posY + height);
      endPos.setY(posY);
      break;
    case "X Bracing":
      if (!isUp) {
        startPos.setY(posY + height);
        endPos.setY(posY);
      }
      break;
    case "Triangular Up":
      if (isUp) {
        endPos.set(fromPortal.chainage + length, posY + height, avgZ);
      } else {
        startPos.set(fromPortal.chainage + length, posY + height, avgZ);
        endPos.setY(posY);
      }
      break;
    case "Triangular Down":
      if (isUp) {
        startPos.set(fromPortal.chainage + length, posY, avgZ);
      } else {
        startPos.setY(posY + height);
        endPos.set(fromPortal.chainage + length, posY, avgZ);
      }
  }

  return {
    id,
    uiId,
    name,
    parent: fromPortal.name,
    type: "PipeRackVBracing",
    tier,
    side,
    sideType,
    bracingType,
    startPos,
    endPos,
    CSLibrary,
    profile,
    isUp,
    releases: {
      my1: true,
      mz1: true,
      my2: true,
      mz2: true,
    },
  } as PR_TYPES.PipeRackVBracing;
}

export function createCantilever(
  id: number,
  name: string,
  portal: PR_TYPES.PipeRackPortal,
  position: PR_TYPES.UserDirection,
  positionType: PR_TYPES.UserDirection | "Outsides",
  tier: number,
  length: number,
  side: PR_TYPES.Side,
  sideType: PR_TYPES.Side | "Both",
  CSLibrary: string,
  profile: Section
): PR_TYPES.PipeRackCantilever {
  const height = portal.tiers[tier];
  const startPos = new Vector3(
    portal.chainage,
    height,
    portal.width / (side === "R" ? 2 : -2)
  );
  const endPos = new Vector3(
    (position === "Front" ? -length : position === "Back" ? length : 0) +
      portal.chainage,
    height,
    (position === "Right" ? length : position === "Left" ? -length : 0) +
      portal.width / (side === "R" ? 2 : -2)
  );
  return {
    id,
    name,
    parent: portal.name,
    type: "PipeRackCantilever",
    tier,
    side,
    sideType,
    position,
    positionType,
    startPos,
    endPos,
    length,
    CSLibrary,
    profile,
  };
}

export function createAccessoryColumns(
  model: PR_TYPES.PipeRack,
  ac: PR_TYPES.Accessory,
  row: any
) {
  const portal = model.portals.find((portal) => portal.name === ac.parent);

  const x =
    (portal?.chainage ?? 0) +
    (ac.distanceFromStart ?? 0) +
    row.index * ac.spacing;
  const y = portal?.tiers[ac.tier] ?? 0;
  const z = (portal?.width ?? 0) / (ac.side === "L" ? -2 : 2);

  const points: number[] = [0];
  if (row.totalH) {
    points.push(row.totalH);
    if (ac.type !== "T-Post") {
      row.h1 && points.push(row.h1);
      row.h2 && points.push(row.h2);
      row.h3 && points.push(row.h3);
      row.h4 && points.push(row.h4);
    }
  }

  points.sort();

  const colItems = [];
  for (let i = 1; i < points.length; i++) {
    colItems.push({
      parent: row.name,
      parentGroup: ac.name,
      type: "AccessoryColumn",
      name: `${row.name}-C${i}`,
      startPos: new Vector3(x, y + points[i - 1], z),
      endPos: new Vector3(x, y + points[i], z),
      orientation: row.colOrientation,
      profile: row.colProfile,
    });
  }

  return colItems;
}

export function createAccessoryBeams(
  model: PR_TYPES.PipeRack,
  ac: PR_TYPES.Accessory,
  row: any
) {
  const portal = model.portals.find((portal) => portal.name === ac.parent);

  const x =
    (portal?.chainage ?? 0) +
    (ac.distanceFromStart ?? 0) +
    row.index * ac.spacing;
  const y = portal?.tiers[ac.tier] ?? 0;
  const z = (portal?.width ?? 0) / (ac.side === "L" ? -2 : 2);

  const beamItems: any[] = [];

  const getLevel = (beamItems: any[], height: number) => {
    if (ac.type === "F-Post") {
      row.projection &&
        beamItems.push(
          getBeam(ac, beamItems, row, x, y, z, height, row.projection)
        );
    } else {
      row.leftProjection &&
        beamItems.push(
          getBeam(ac, beamItems, row, x, y, z, height, -row.leftProjection)
        );
      row.rightProjection &&
        beamItems.push(
          getBeam(ac, beamItems, row, x, y, z, height, row.rightProjection)
        );
    }
    return beamItems;
  };

  const getBeam = (
    ac: PR_TYPES.Accessory,
    beamItems: any[],
    row: any,
    x: number,
    y: number,
    z: number,
    h: number,
    projection: number
  ) => {
    return {
      position: projection > 0 ? "R" : "L",
      parent: row.name,
      parentGroup: ac.name,
      type: "AccessoryBeam",
      name: `${row.name}-B${beamItems.length + 1}`,
      startPos: new Vector3(x, y + h, z),
      endPos: UTILS.fixVectorByOrientation(
        new Vector3(x, y + h, z),
        new Vector3(x, y + h, z + projection),
        ac.orientation
      ),
      orientation: row.beamOrientation,
      profile: row.beamProfile,
    };
  };

  if (row.totalH) {
    getLevel(beamItems, row.totalH);
    if (ac.type !== "T-Post") {
      row.h1 && getLevel(beamItems, row.h1);
      row.h2 && getLevel(beamItems, row.h2);
      row.h3 && getLevel(beamItems, row.h3);
      row.h4 && getLevel(beamItems, row.h4);
    }
  }
  return beamItems;
}

export function concatBeams<
  T extends PR_TYPES.PipeRackBeam | PR_TYPES.PipeRackCantilever
>(elements: T[], splitter: "C" | "AB" | "VB" | "AG" | "PC" | "HB"): T[] {
  const oldBeams: T[] = [];
  const removed: string[] = [];
  elements.forEach((b, i, arr) => {
    if (
      !(
        removed.includes(b.name) ||
        (splitter === "AB" &&
          b.type === "PipeRackBeam" &&
          (b as PR_TYPES.PipeRackBeam).additional)
      )
    ) {
      if (b.splitters?.includes(splitter)) {
        if (b.splitters?.length > 1) {
          oldBeams.push({
            ...b,
            splitters: b.splitters?.filter((item) => item !== splitter),
          });
        } else {
          let nextB: T | undefined = UTILS.getElementByName(arr, b.next);
          while (nextB) {
            removed.push(nextB.name);
            if (nextB.splitters?.includes(splitter)) {
              const next = UTILS.getElementByName(arr, nextB?.next);
              if (next) {
                nextB = next;
              } else break;
            } else break;
          }
          if (nextB) {
            oldBeams.push({
              ...b,
              endPos: nextB.endPos,
              next: nextB.next,
              releases: nextB.releases
                ? b.releases
                  ? {
                      fx1: b.releases.fx1,
                      fy1: b.releases.fy1,
                      fz1: b.releases.fz1,
                      mx1: b.releases.mx1,
                      my1: b.releases.my1,
                      mz1: b.releases.mz1,
                      fx2: nextB.releases.fx2,
                      fy2: nextB.releases.fy2,
                      fz2: nextB.releases.fz2,
                      mx2: nextB.releases.mx2,
                      my2: nextB.releases.my2,
                      mz2: nextB.releases.mz2,
                    }
                  : {
                      fx2: nextB.releases.fx2,
                      fy2: nextB.releases.fy2,
                      fz2: nextB.releases.fz2,
                      mx2: nextB.releases.mx2,
                      my2: nextB.releases.my2,
                      mz2: nextB.releases.mz2,
                    }
                : b.releases,
              splitters: nextB.splitters
                ? UTILS.concatUnique(b.splitters, nextB.splitters)?.filter(
                    (item) => item !== splitter
                  )
                : undefined,
            });
          } else oldBeams.push(b);
        }
      } else oldBeams.push(b);
    }
  });
  return oldBeams;
}

export function concatColumns(columns: PR_TYPES.PipeRackColumn[]) {
  const newColumns: PR_TYPES.PipeRackColumn[] = [];
  const removed: string[] = [];
  columns.forEach((column, i, arr) => {
    if (!removed.includes(column.name)) {
      if (column.next) {
        let nextColumn = UTILS.getElementByName(arr, column.next);
        while (nextColumn?.next) {
          const next = UTILS.getElementByName(arr, nextColumn.next);
          if (next) {
            removed.push(next.name);
            nextColumn = {
              ...nextColumn,
              endPos: next.endPos,
              next: next.next,
              releases: {
                ...nextColumn.releases,
                fx2: next.releases?.fx2,
                fy2: next.releases?.fy2,
                fz2: next.releases?.fz2,
                mx2: next.releases?.mx2,
                my2: next.releases?.my2,
                mz2: next.releases?.mz2,
              },
              upperBeam: next.upperBeam,
            };
          }
        }
        if (nextColumn) {
          removed.push(nextColumn.name);
          newColumns.push({
            ...column,
            endPos: nextColumn.endPos,
            next: nextColumn.next,
            releases: {
              ...nextColumn.releases,
              fx2: nextColumn.releases?.fx2,
              fy2: nextColumn.releases?.fy2,
              fz2: nextColumn.releases?.fz2,
              mx2: nextColumn.releases?.mx2,
              my2: nextColumn.releases?.my2,
              mz2: nextColumn.releases?.mz2,
            },
            upperBeam: nextColumn.upperBeam,
          });
        }
      } else {
        removed.push(column.name);
        newColumns.push(column);
      }
    }
  });
  return newColumns;
}

export function splitColumnsBySpliceFlanges(
  columns: PR_TYPES.PipeRackColumn[],
  flanges: (PR_TYPES.CircularSF | PR_TYPES.RectangularSF)[]
) {
  let newColumns = [...columns];
  flanges.forEach((sf) => {
    const column = newColumns.find((col) => col.name === sf.column);
    if (
      column &&
      sf.elevation > column.startPos.y &&
      sf.elevation < column.endPos.y
    ) {
      const index = UTILS.getIndexName(newColumns, "C");
      const secondColumn = newColumns.find(
        (item) =>
          item.tier === (column.tier ? column.tier - 1 : column.tier + 1) &&
          item.startPos.x === column.startPos.x &&
          item.startPos.z === column.startPos.z
      );
      const newColumn: PR_TYPES.PipeRackColumn = {
        ...column,
        id: index,
        uiId: undefined,
        name: `C${index}`,
        next: column.next,
        isNext: true,
        startPos: column.startPos.clone().setY(sf.elevation),
        CSLibrary: !column.tier
          ? secondColumn?.CSLibrary ?? column.CSLibrary
          : column.CSLibrary,
        profile: !column.tier
          ? secondColumn?.profile ?? column.profile
          : column.profile,
        releases: {
          fx2: column.releases?.fx2,
          fy2: column.releases?.fy2,
          fz2: column.releases?.fz2,
          mx2: column.releases?.mx2,
          my2: column.releases?.my2,
          mz2: column.releases?.mz2,
        },
        deadLoadId: undefined,
        deadLoad: undefined,
        liveLoadId: undefined,
        liveLoad: undefined,
        windLoadId: undefined,
        windLoad: undefined,
        onGround: false,
        lowerBeam: undefined,
        memberId: undefined,
      };
      newColumns = [
        ...newColumns.map((nCol) => {
          if (nCol.name === column.name) {
            return {
              ...column,
              endPos: newColumn.startPos,
              next: newColumn.name,
              CSLibrary: column.tier
                ? secondColumn?.CSLibrary ?? column.CSLibrary
                : column.CSLibrary,
              profile: column.tier
                ? secondColumn?.profile ?? column.profile
                : column.profile,
              releases: {
                fx1: column.releases?.fx1,
                fy1: column.releases?.fy1,
                fz1: column.releases?.fz1,
                mx1: column.releases?.mx1,
                my1: column.releases?.my1,
                mz1: column.releases?.mz1,
              },
              upperBeam: undefined,
            };
          } else return nCol;
        }),
        newColumn,
      ];
    }
  });
  return newColumns;
}

export function splitReleases(
  element: PR_TYPES.PipeRackBeam | PR_TYPES.PipeRackCantilever,
  isNext?: boolean
): PR_TYPES.Releases {
  if (
    element.type === "PipeRackBeam" &&
    (element as PR_TYPES.PipeRackBeam).additional
  ) {
    if (isNext) {
      return (element as PR_TYPES.PipeRackBeam).direction === "Z"
        ? {
            my2: element.releases?.my2,
            mz2: element.releases?.mz2,
          }
        : {
            my1: element.releases?.my1,
            mz1: element.releases?.mz1,
            my2: element.releases?.my2,
            mz2: element.releases?.mz2,
          };
    } else {
      return (element as PR_TYPES.PipeRackBeam).direction === "Z"
        ? {
            my1: element.releases?.my1,
            mz1: element.releases?.mz1,
          }
        : {
            my1: element.releases?.my1,
            mz1: element.releases?.mz1,
            my2: element.releases?.my2,
            mz2: element.releases?.mz2,
          };
    }
  } else {
    if (isNext) {
      return {
        fx2: element.releases?.fx2,
        fy2: element.releases?.fy2,
        fz2: element.releases?.fz2,
        mx2: element.releases?.mx2,
        my2: element.releases?.my2,
        mz2: element.releases?.mz2,
      };
    } else {
      return {
        fx1: element.releases?.fx1,
        fy1: element.releases?.fy1,
        fz1: element.releases?.fz1,
        mx1: element.releases?.mx1,
        my1: element.releases?.my1,
        mz1: element.releases?.mz1,
      };
    }
  }
}

function splitBeamByHBracing<
  T extends PR_TYPES.PipeRackBeam | PR_TYPES.PipeRackCantilever
>(beams: T[], bName: string, offset: number) {
  const beam = beams.find((beam) => beam.name === bName);
  if (beam) {
    const bLength = beam.startPos.distanceTo(beam.endPos);
    if (offset && offset < bLength) {
      const byXDir =
        beam.type === "PipeRackBeam"
          ? (beam as PR_TYPES.PipeRackBeam).direction === "X"
          : (beam as PR_TYPES.PipeRackCantilever).position === "Front" ||
            (beam as PR_TYPES.PipeRackCantilever).position === "Back";
      const name = beam.type === "PipeRackBeam" ? "B" : `CNT-${beam.side}`;
      const nextId = UTILS.getIndexName(beams, name);
      const nextBItem: T = {
        ...beam,
        id: nextId,
        name: `${name}${nextId}`,
        startPos: new Vector3(
          byXDir
            ? (beam as PR_TYPES.PipeRackCantilever).position === "Front"
              ? beam.startPos.x - offset
              : beam.startPos.x + offset
            : beam.startPos.x,
          beam.startPos.y,
          byXDir
            ? beam.startPos.z
            : (beam as PR_TYPES.PipeRackCantilever).position === "Right"
            ? beam.startPos.z + offset
            : beam.startPos.z - offset
        ),
        next: beam.next,
        splitters: beam.splitters,
        releases: splitReleases(beam, true),
      };
      return [
        ...beams.map((newBeam) =>
          newBeam.name === beam.name
            ? {
                ...beam,
                endPos: nextBItem.startPos,
                next: nextBItem.name,
                splitters: ["HB"],
                releases: splitReleases(beam),
              }
            : newBeam
        ),
        nextBItem,
      ];
    } else if (
      offset === bLength &&
      beam.splitters &&
      !beam.splitters.includes("HB")
    ) {
      return beams.map((newBeam) =>
        newBeam.name === beam.name
          ? { ...beam, splitters: [...beam.splitters!, "HB"] }
          : newBeam
      );
    }
  }
  return beams;
}

export function splitBeamsByHBracings(
  beams: (PR_TYPES.PipeRackBeam | PR_TYPES.PipeRackCantilever)[],
  hBracings: PR_TYPES.PipeRackHBracing[]
) {
  let newBeams = [...beams];
  hBracings.forEach((hb) => {
    newBeams = splitBeamByHBracing(
      splitBeamByHBracing(newBeams, hb.start, hb.startOffset),
      hb.end,
      hb.endOffset
    );
  });
  return newBeams;
}

export function splitBeamsByVBracings(
  beams: PR_TYPES.PipeRackBeam[],
  vBracings: PR_TYPES.PipeRackVBracing[]
) {
  let newBeams = [...beams];
  vBracings.forEach((vb) => {
    if (
      vb.bracingType === "Triangular Up" ||
      vb.bracingType === "Triangular Down"
    ) {
      const offset =
        vb.side === "Portal"
          ? Math.min(vb.startPos.z)
          : Math.max(vb.endPos.x, vb.startPos.x);
      newBeams
        .filter(
          (beam) =>
            beam.parent === vb.parent &&
            beam.tier ===
              (vb.bracingType === "Triangular Up" ? vb.tier : vb.tier - 1) &&
            ((vb.side === "Portal" &&
              beam.direction === "Z" &&
              vb.startPos.x === beam.startPos.x) ||
              (beam.side === vb.side && beam.startPos.z === vb.startPos.z))
        )
        .forEach((beam) => {
          if (vb.side !== "Portal") {
            if (offset > beam.startPos.x && offset < beam.endPos.x) {
              const nextId = UTILS.getIndexName(newBeams, "B");
              const nextBeam: PR_TYPES.PipeRackBeam = {
                ...beam,
                id: nextId,
                name: `B${nextId}`,
                startPos: new Vector3(
                  offset,
                  beam.startPos.y,
                  beam.startPos.z -
                    UTILS.getOffsetB(
                      beam.startPos.x,
                      beam.startPos.z,
                      beam.endPos.x,
                      beam.endPos.z,
                      offset - beam.startPos.x
                    )
                ),
                next: beam.next,
                splitters: beam.splitters,
                releases: splitReleases(beam, true),
              };
              newBeams = [
                ...newBeams.map((newBeam) =>
                  newBeam.name === beam.name
                    ? ({
                        ...beam,
                        endPos: nextBeam.startPos,
                        next: nextBeam.name,
                        splitters: ["VB"],
                        releases: splitReleases(beam),
                      } as PR_TYPES.PipeRackBeam)
                    : newBeam
                ),
                nextBeam,
              ];
            } else if (offset === beam.endPos.x && beam.splitters) {
              newBeams = newBeams.map((newBeam) =>
                newBeam.name === beam.name
                  ? ({
                      ...beam,
                      splitters: [...beam.splitters!, "VB"],
                    } as PR_TYPES.PipeRackBeam)
                  : newBeam
              );
            }
          } else {
            if (offset < beam.startPos.z && offset > beam.endPos.z) {
              const nextId = UTILS.getIndexName(newBeams, "B");
              const nextBeam: PR_TYPES.PipeRackBeam = {
                ...beam,
                id: nextId,
                name: `B${nextId}`,
                startPos: new Vector3(beam.startPos.x, beam.startPos.y, offset),
                next: beam.next,
                splitters: beam.splitters,
                releases: splitReleases(beam, true),
              };
              newBeams = [
                ...newBeams.map((newBeam) =>
                  newBeam.name === beam.name
                    ? ({
                        ...beam,
                        endPos: nextBeam.startPos,
                        next: nextBeam.name,
                        splitters: ["VB"],
                        releases: splitReleases(beam),
                      } as PR_TYPES.PipeRackBeam)
                    : newBeam
                ),
                nextBeam,
              ];
            } else if (offset === beam.endPos.z && beam.splitters) {
              newBeams = newBeams.map((newBeam) =>
                newBeam.name === beam.name
                  ? ({
                      ...beam,
                      splitters: [...beam.splitters!, "VB"],
                    } as PR_TYPES.PipeRackBeam)
                  : newBeam
              );
            }
          }
        });
    }
  });
  return newBeams;
}

export function splitBeamsByColumns<
  T extends PR_TYPES.PipeRackBeam | PR_TYPES.PipeRackCantilever
>(beams: T[], columns: PR_TYPES.PipeRackColumn[]) {
  let newBeams = [...beams];
  columns.forEach((column) => {
    const beams = newBeams.filter(
      (beam) =>
        beam.startPos.y >= column.startPos.y &&
        beam.startPos.y <= column.endPos.y &&
        ((column.startPos.x >= beam.startPos.x &&
          column.startPos.x <= beam.endPos.x) ||
          (column.startPos.x <= beam.startPos.x &&
            column.startPos.x >= beam.endPos.x)) &&
        ((column.startPos.z > beam.startPos.z &&
          column.startPos.z <= beam.endPos.z) ||
          (column.startPos.z <= beam.startPos.z &&
            column.startPos.z >= beam.endPos.z))
    );
    beams.forEach((beam) => {
      if (
        beam.endPos.x === column.endPos.x &&
        beam.endPos.z === column.endPos.z
      ) {
        newBeams = newBeams.map((newBeam) =>
          newBeam.name === beam.name
            ? ({
                ...beam,
                splitters: beam.splitters
                  ? [...beam.splitters!, "C"]
                  : undefined,
              } as T)
            : newBeam
        );
      } else if (
        (beam.type === "PipeRackBeam" &&
          (beam as any).direction === "X" &&
          beam.startPos.x !== column.startPos.x) ||
        ((beam as any).direction === "Z" &&
          beam.startPos.z !== column.startPos.z) ||
        (beam.type === "PipeRackCantilever" &&
          ((beam as any).position === "Front" ||
            (beam as any).position === "Back") &&
          beam.startPos.x !== column.startPos.x) ||
        (((beam as any).position === "Left" ||
          (beam as any).position === "Right") &&
          beam.startPos.z !== column.startPos.z)
      ) {
        const name = beam.type === "PipeRackBeam" ? "B" : `CNT-${beam.side}`;
        const nextId = UTILS.getIndexName(newBeams, name);
        const nextBeam: T = {
          ...beam,
          id: nextId,
          name: `${name}${nextId}`,
          startPos: new Vector3(
            column.startPos.x,
            beam.startPos.y,
            column.startPos.z
          ),
          next: beam.next,
          splitters: beam.splitters,
          releases: splitReleases(beam, true),
        };
        newBeams = [
          ...newBeams.map((newBeam) =>
            newBeam.name === beam.name
              ? ({
                  ...beam,
                  endPos: nextBeam.startPos,
                  next: nextBeam.name,
                  splitters: ["C"],
                  releases: splitReleases(beam),
                } as T)
              : newBeam
          ),
          nextBeam,
        ];
      }
    });
  });
  return newBeams;
}

export function splitBeamsByAccessories(
  beams: PR_TYPES.PipeRackBeam[],
  accessories: PR_TYPES.Accessory[],
  portals: PR_TYPES.PipeRackPortal[]
) {
  let newBeams = [...beams];
  accessories.forEach((ag) => {
    const portal = UTILS.getElementByName(portals, ag.parent);
    if (portal) {
      ag.elements.forEach((element) => {
        const x =
          portal.chainage +
          (ag.distanceFromStart ?? 0) +
          element.index * ag.spacing;
        const y = portal.tiers[ag.tier];
        const z = portal.width / (element.side === "L" ? -2 : 2);
        const beams = newBeams.filter(
          (beam) =>
            beam.tier === ag.tier &&
            beam.direction === "X" &&
            beam.startPos.y === y &&
            x > beam.startPos.x &&
            x <= beam.endPos.x &&
            ((z >= beam.startPos.z && z <= beam.endPos.z) ||
              (z <= beam.startPos.z && z >= beam.endPos.z))
        );
        beams.forEach((beam) => {
          if (x > beam.startPos.x && x < beam.endPos.x) {
            const nextId = UTILS.getIndexName(newBeams, "B");
            const nextBeam: PR_TYPES.PipeRackBeam = {
              ...beam,
              id: nextId,
              name: `B${nextId}`,
              startPos: new Vector3(
                x,
                beam.startPos.y,
                beam.startPos.z -
                  UTILS.getOffsetB(
                    beam.startPos.x,
                    beam.startPos.z,
                    beam.endPos.x,
                    beam.endPos.z,
                    x - beam.startPos.x
                  )
              ),
              next: beam.next,
              splitters: beam.splitters,
              releases: splitReleases(beam, true),
            };
            newBeams = [
              ...newBeams.map((newBeam) =>
                newBeam.name === beam.name
                  ? ({
                      ...beam,
                      endPos: nextBeam.startPos,
                      next: nextBeam.name,
                      splitters: ["AG"],
                      releases: splitReleases(beam),
                    } as PR_TYPES.PipeRackBeam)
                  : newBeam
              ),
              nextBeam,
            ];
          } else if (x === beam.endPos.x && beam.splitters) {
            newBeams = newBeams.map((newBeam) =>
              newBeam.name === beam.name
                ? ({
                    ...beam,
                    splitters: [...beam.splitters!, "AG"],
                  } as PR_TYPES.PipeRackBeam)
                : newBeam
            );
          }
        });
      });
    } else console.error(`PARENT FOR ${ag.name} NOT FOUND`);
  });
  return newBeams;
}

export function getZPosForBeam(
  prev: PR_TYPES.PipeRackPortal,
  next: PR_TYPES.PipeRackPortal,
  side: PR_TYPES.Side,
  x: number
) {
  return (
    (prev.width / 2 -
      UTILS.getOffsetB(
        prev.chainage,
        prev.width / 2,
        next.chainage,
        next.width / 2,
        x - prev.chainage
      )) *
    (side === "L" ? -1 : 1)
  );
}

export function fixPortalElements(
  pr: PR_TYPES.PipeRack,
  portals: PR_TYPES.PipeRackPortal[],
  columns: PR_TYPES.PipeRackColumn[],
  beams: PR_TYPES.PipeRackBeam[],
  vBracings: PR_TYPES.PipeRackVBracing[],
  cantilevers: PR_TYPES.PipeRackCantilever[]
) {
  const newPortals: PR_TYPES.PipeRackPortal[] = [];
  const newColumns: PR_TYPES.PipeRackColumn[] = [];
  const newBeams: PR_TYPES.PipeRackBeam[] = [];
  const newVBracings: PR_TYPES.PipeRackVBracing[] = [];
  const newCantilevers: PR_TYPES.PipeRackCantilever[] = [];
  portals.forEach((p, i, arrP) => {
    const nextP = arrP[i + 1];
    UTILS.getElementsByParent(beams, p.name).forEach(
      (b: PR_TYPES.PipeRackBeam, i, arrB: PR_TYPES.PipeRackBeam[]) => {
        if (b.side) {
          if (nextP) {
            const height =
              p.tiers[b.tier] > nextP.tiers[b.tier]
                ? nextP.tiers[b.tier]
                : p.tiers[b.tier];
            const prev = arrB.find((item) => item.next === b.name);
            const next = b.next && arrB.find((item) => item.name === b.next);
            newBeams.push({
              ...b,
              startPos: new Vector3(
                prev ? prev.endPos.x : p.chainage,
                height,
                prev
                  ? getZPosForBeam(
                      p,
                      nextP,
                      b.side,
                      prev ? prev.endPos.x : p.chainage
                    )
                  : b.additional
                  ? b.startPos.z
                  : p.width / (b.side === "L" ? -2 : 2)
              ),
              endPos: new Vector3(
                next ? next.startPos.x : p.chainage + p.length,
                height,
                next
                  ? getZPosForBeam(
                      p,
                      nextP,
                      b.side,
                      next ? next.startPos.x : p.chainage + p.length
                    )
                  : b.additional
                  ? b.endPos.z
                  : nextP.width / (b.side === "L" ? -2 : 2)
              ),
            });
          }
        } else {
          const height = p.tiers[b.tier];
          const prev = arrB.find((item) => item.next === b.name);
          const next = b.next && arrB.find((item) => item.name === b.next);
          newBeams.push({
            ...b,
            startPos: new Vector3(
              b.additional
                ? prev
                  ? prev.endPos.x
                  : next
                  ? next.startPos.x
                  : b.startPos.x
                : p.chainage,
              height,
              prev ? prev.endPos.z : p.width / 2
            ),
            endPos: new Vector3(
              b.additional
                ? next
                  ? next.startPos.x
                  : prev
                  ? prev.endPos.x
                  : b.endPos.x
                : p.chainage,
              height,
              next ? next.startPos.z : p.width / -2
            ),
          });
        }
      }
    );
    UTILS.getElementsByParent(vBracings, p.name).forEach(
      (vb: PR_TYPES.PipeRackVBracing) => {
        newVBracings.push({
          ...createVBracing(
            vb.id,
            vb.name,
            p,
            nextP,
            vb.tier,
            vb.side,
            vb.sideType,
            vb.bracingType,
            vb.CSLibrary,
            vb.profile,
            pr.baseElevation,
            vb.isUp
          ),
          releases: vb.releases,
        });
      }
    );
    UTILS.getElementsByParent(cantilevers, p.name).forEach(
      (cnt: PR_TYPES.PipeRackCantilever) => {
        const length = cnt.startPos.distanceTo(cnt.endPos);
        newCantilevers.push({
          ...cnt,
          startPos: new Vector3(
            p.chainage,
            p.tiers[cnt.tier],
            p.width / (cnt.side === "L" ? -2 : 2)
          ),
          endPos: new Vector3(
            (cnt.position === "Front"
              ? -length
              : cnt.position === "Back"
              ? length
              : 0) + p.chainage,
            p.tiers[cnt.tier],
            (cnt.position === "Right"
              ? length
              : cnt.position === "Left"
              ? -length
              : 0) +
              p.width / (cnt.side === "L" ? -2 : 2)
          ),
        });
      }
    );
    newPortals.push(
      i === arrP.length - 1 && p.position === "middle"
        ? { ...p, position: "end" }
        : p
    );
  });
  columns.forEach((c: PR_TYPES.PipeRackColumn) => {
    if (c.additional) {
      const beam = newBeams.find((beam) => beam.name === c.lowerBeam);
      if (beam) {
        if (beam.direction === "Z") {
          const z =
            (c.startPos.z > 0 &&
              beam.startPos.z > 0 &&
              c.startPos.z > beam.startPos.z) ||
            (c.startPos.z < 0 &&
              beam.startPos.z < 0 &&
              c.startPos.z < beam.startPos.z)
              ? beam.startPos.z
              : (c.startPos.z > 0 &&
                  beam.endPos.z > 0 &&
                  c.startPos.z > beam.endPos.z) ||
                (c.startPos.z < 0 &&
                  beam.endPos.z < 0 &&
                  c.startPos.z < beam.endPos.z)
              ? beam.endPos.z
              : c.startPos.z;
          newColumns.push({
            ...c,
            startPos: new Vector3(beam.startPos.x, c.startPos.y, z),
            endPos: new Vector3(beam.startPos.x, c.endPos.y, z),
          });
        } else {
          newColumns.push({
            ...c,
            startPos: new Vector3(beam.endPos.x, c.startPos.y, beam.endPos.z),
            endPos: new Vector3(beam.endPos.x, c.endPos.y, beam.endPos.z),
          });
        }
      }
    } else {
      const p = newPortals.find((p) => p.name === c.parent);
      if (p) {
        const y = p.tiers[c.tier - 1] ?? pr.baseElevation ?? 0;
        const z = p.width / (c.side === "L" ? -2 : 2);
        newColumns.push({
          ...c,
          startPos: new Vector3(p.chainage, y, z),
          endPos: new Vector3(p.chainage, y + (p.tiers[c.tier] - y), z),
        });
      }
    }
  });
  return {
    portals: newPortals,
    columns: newColumns.sort((a, b) => a.id - b.id),
    beams: newBeams.sort((a, b) => a.id - b.id),
    vBracings: newVBracings.sort((a, b) => a.id - b.id),
    cantilevers: newCantilevers.sort((a, b) => a.id - b.id),
  };
}

export function getPipeVector(
  direction: PR_TYPES.Direction3,
  leftOffset: number,
  bayOffset: number,
  elevation: number,
  portal: PR_TYPES.PipeRackPortal,
  portals: PR_TYPES.PipeRackPortal[],
  type: "start" | "end"
) {
  const currentIndex = portals.indexOf(portal);
  const isLast = portals.length - 1 === currentIndex;
  if (type === "start") {
    switch (direction) {
      case "+X":
        return new Vector3(
          portal.chainage + bayOffset,
          elevation,
          portal.width / -2 + leftOffset
        );
      case "-X":
        return new Vector3(
          portals[isLast ? currentIndex : currentIndex + 1].chainage -
            bayOffset,
          elevation,
          portal.width / 2 - leftOffset
        );
      case "+Z":
        return new Vector3(
          portals[isLast ? currentIndex : currentIndex + 1].chainage -
            leftOffset,
          elevation,
          portal.width / -2 + bayOffset
        );
      case "-Z":
        return new Vector3(
          portal.chainage + leftOffset,
          elevation,
          portal.width / 2 - bayOffset
        );
      case "+Y":
      case "-Y":
        return new Vector3(
          portal.chainage + bayOffset,
          elevation,
          portal.width / -2 + leftOffset
        );
    }
  } else {
    switch (direction) {
      case "+X":
        return new Vector3(
          portals[isLast ? currentIndex : currentIndex + 1].chainage -
            bayOffset,
          elevation,
          portal.width / -2 + leftOffset
        );
      case "-X":
        return new Vector3(
          portal.chainage + bayOffset,
          elevation,
          portal.width / 2 - leftOffset
        );
      case "+Z":
        return new Vector3(
          portals[isLast ? currentIndex : currentIndex + 1].chainage -
            leftOffset,
          elevation,
          portal.width / 2 - bayOffset
        );
      case "-Z":
        return new Vector3(
          portal.chainage + leftOffset,
          elevation,
          portal.width / -2 + bayOffset
        );
      case "+Y":
        return new Vector3(
          portal.chainage + bayOffset,
          elevation,
          portal.width / -2 + leftOffset
        );
      case "-Y":
        return new Vector3(
          portal.chainage + bayOffset,
          elevation,
          portal.width / -2 + leftOffset
        );
    }
  }
}

export function sortByMiddlePoint(a: any, b: any) {
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

export function getDistanceForDirectLoad(
  beam: PR_TYPES.PipeRackBeam | PR_TYPES.PipeRackCantilever,
  pipe: PR_TYPES.Pipe
) {
  const start = beam.startPos;
  if (pipe.direction === "+X" || pipe.direction === "-X") {
    if (beam.startPos.z === beam.endPos.z) {
      return beam.startPos.x + (beam.endPos.x - beam.startPos.x) / 2;
    } else {
      return (
        beam.startPos.z -
        pipe.start.z +
        UTILS.getOffsetB(
          pipe.start.x,
          pipe.start.z,
          pipe.end.x,
          pipe.end.z,
          start.x
        )
      );
    }
  } else if (pipe.direction === "+Z") {
    if (beam.startPos.z === beam.endPos.z) {
      return (
        beam.endPos.x -
        pipe.start.x +
        UTILS.getOffsetB(
          pipe.start.z,
          pipe.start.x,
          pipe.end.z,
          pipe.end.x,
          start.z
        )
      );
    } else {
      return beam.startPos.z + (beam.startPos.z - beam.endPos.z) / 2;
    }
  } else if (pipe.direction === "-Z") {
    if (beam.startPos.z === beam.endPos.z) {
      return (
        pipe.start.x +
        UTILS.getOffsetB(
          pipe.start.z,
          pipe.start.x,
          pipe.end.z,
          pipe.end.x,
          start.z
        ) -
        beam.startPos.x
      );
    } else {
      return beam.startPos.z + (beam.startPos.z - beam.endPos.z) / 2;
    }
  } else {
    return beam.startPos.z === beam.endPos.z
      ? pipe.startBayDist
      : pipe.startLeftDist;
  }
}

export function getCrossPoint(
  beam: PR_TYPES.PipeRackBeam,
  pipe: PR_TYPES.Pipe
) {
  const offset = getDistanceForDirectLoad(beam, pipe);
  return new Vector3(
    beam.direction === "X" ? beam.startPos.x + offset : beam.startPos.x,
    beam.startPos.y,
    beam.direction === "Z" ? beam.startPos.z - offset : beam.startPos.z
  );
}

export function getAdditionalLoadsParams(
  load: "deadLoad" | "liveLoad" | "windLoad",
  element: any,
  points: number[]
) {
  let udl, point;
  if (element[load]) {
    if (element[load].lengthOfUDL) {
      if (!points.includes(element[load].distance))
        points.push(element[load].distance);
      if (!points.includes(element[load].distance + element[load].lengthOfUDL))
        points.push(element[load].distance + element[load].lengthOfUDL);
      udl = [
        element[load].distance,
        element[load].distance + element[load].lengthOfUDL,
      ];
    } else {
      if (!points.includes(element[load].distance))
        points.push(element[load].distance);
      point = element[load].distance;
    }
  }
  return { udl, point };
}

export function splitColumns(
  columns: PR_TYPES.PipeRackColumn[],
  loadings = true
) {
  let newColumns: any[] = [];
  columns.forEach((column) => {
    const splitPoints: number[] = [
      0,
      column.startPos.distanceTo(column.endPos),
    ];

    const DLParams = loadings
      ? getAdditionalLoadsParams("deadLoad", column, splitPoints)
      : undefined;
    const LLParams = loadings
      ? getAdditionalLoadsParams("liveLoad", column, splitPoints)
      : undefined;
    const WLParams = loadings
      ? getAdditionalLoadsParams("windLoad", column, splitPoints)
      : undefined;

    splitPoints.sort();
    const newVector = UTILS.roundVectorM(column.startPos.clone());
    for (let i = 1; i < splitPoints.length; i++) {
      const startPos = newVector.clone();
      const endPos = UTILS.roundVectorM(
        newVector.setY(column.startPos.y + splitPoints[i])
      ).clone();
      newColumns = [
        ...newColumns,
        {
          ...column,
          name: splitPoints.length > 2 ? `${column.name}.${i}` : column.name,
          startPos,
          endPos,
          isDeadLoadPointS:
            DLParams?.point ===
            UTILS.roundM(Math.abs(startPos.y - column.startPos.y)),
          isDeadLoadPointE:
            DLParams?.point ===
            UTILS.roundM(Math.abs(endPos.y - column.startPos.y)),
          isDeadLoadUDL:
            DLParams?.udl &&
            DLParams.udl[0] <=
              UTILS.roundM(Math.abs(startPos.y - column.startPos.y)) &&
            DLParams.udl[1] >=
              UTILS.roundM(Math.abs(endPos.y - column.startPos.y)),
          isLiveLoadPointS:
            LLParams?.point ===
            UTILS.roundM(Math.abs(startPos.y - column.startPos.y)),
          isLiveLoadPointE:
            LLParams?.point ===
            UTILS.roundM(Math.abs(endPos.y - column.startPos.y)),
          isLiveLoadUDL:
            LLParams?.udl &&
            LLParams.udl[0] <=
              UTILS.roundM(Math.abs(startPos.y - column.startPos.y)) &&
            LLParams.udl[1] >=
              UTILS.roundM(Math.abs(endPos.y - column.startPos.y)),
          isWindLoadPointS:
            WLParams?.point ===
            UTILS.roundM(Math.abs(startPos.y - column.startPos.y)),
          isWindLoadPointE:
            WLParams?.point ===
            UTILS.roundM(Math.abs(endPos.y - column.startPos.y)),
          isWindLoadUDL:
            WLParams?.udl &&
            WLParams.udl[0] <=
              UTILS.roundM(Math.abs(startPos.y - column.startPos.y)) &&
            WLParams.udl[1] >=
              UTILS.roundM(Math.abs(endPos.y - column.startPos.y)),
        },
      ];
    }
  });
  return newColumns;
}

export function splitBeams(beams: PR_TYPES.PipeRackBeam[], loadings = true) {
  let newBeams: any[] = [];
  beams.forEach((beam) => {
    const splitPoints: number[] = [0, beam.startPos.distanceTo(beam.endPos)];

    const DLParams = loadings
      ? getAdditionalLoadsParams("deadLoad", beam, splitPoints)
      : undefined;
    const LLParams = loadings
      ? getAdditionalLoadsParams("liveLoad", beam, splitPoints)
      : undefined;
    const WLParams = loadings
      ? getAdditionalLoadsParams("windLoad", beam, splitPoints)
      : undefined;

    let directLoadPoint;
    if (loadings && beam.directLoad?.distance) {
      if (!splitPoints.includes(beam.directLoad.distance))
        splitPoints.push(beam.directLoad.distance);
      directLoadPoint = beam.directLoad.distance;
    }

    let equipmentLoadPoint;
    if (loadings && beam.equipmentLoad?.distance) {
      if (!splitPoints.includes(beam.equipmentLoad.distance))
        splitPoints.push(beam.equipmentLoad.distance);
      equipmentLoadPoint = beam.equipmentLoad.distance;
    }

    splitPoints.sort();
    const newVector = UTILS.roundVectorM(beam.startPos.clone());
    for (let i = 1; i < splitPoints.length; i++) {
      const startPos = newVector.clone();
      const endPos = UTILS.roundVectorM(
        beam.direction === "X"
          ? newVector.setX(beam.startPos.x + splitPoints[i])
          : newVector.setZ(beam.startPos.z - splitPoints[i])
      ).clone();
      const isX = beam.direction === "X";
      newBeams = [
        ...newBeams,
        {
          ...beam,
          name: splitPoints.length > 2 ? `${beam.name}.${i}` : beam.name,
          startPos,
          endPos,
          isDeadLoadPointS: isX
            ? DLParams?.point ===
              UTILS.roundM(Math.abs(startPos.x - beam.startPos.x))
            : DLParams?.point ===
              UTILS.roundM(Math.abs(beam.startPos.z - startPos.z)),
          isDeadLoadPointE: isX
            ? DLParams?.point ===
              UTILS.roundM(Math.abs(endPos.x - beam.startPos.x))
            : DLParams?.point ===
              UTILS.roundM(Math.abs(beam.startPos.z - endPos.z)),
          isDeadLoadUDL:
            DLParams?.udl &&
            DLParams.udl[0] <=
              UTILS.roundM(
                Math.abs(
                  isX
                    ? startPos.x - beam.startPos.x
                    : beam.startPos.z - startPos.z
                )
              ) &&
            DLParams.udl[1] >=
              UTILS.roundM(
                Math.abs(
                  isX ? endPos.x - beam.startPos.x : beam.startPos.z - endPos.z
                )
              ),
          isLiveLoadPointS: isX
            ? LLParams?.point ===
              UTILS.roundM(Math.abs(startPos.x - beam.startPos.x))
            : LLParams?.point ===
              UTILS.roundM(Math.abs(beam.startPos.z - startPos.z)),
          isLiveLoadPointE: isX
            ? LLParams?.point ===
              UTILS.roundM(Math.abs(endPos.x - beam.startPos.x))
            : LLParams?.point ===
              UTILS.roundM(Math.abs(beam.startPos.z - endPos.z)),
          isLiveLoadUDL:
            LLParams?.udl &&
            LLParams.udl[0] <=
              UTILS.roundM(
                Math.abs(
                  isX
                    ? startPos.x - beam.startPos.x
                    : beam.startPos.z - startPos.z
                )
              ) &&
            LLParams.udl[1] >=
              UTILS.roundM(
                Math.abs(
                  isX ? endPos.x - beam.startPos.x : beam.startPos.z - endPos.z
                )
              ),
          isWindLoadPointS: isX
            ? WLParams?.point ===
              UTILS.roundM(Math.abs(startPos.x - beam.startPos.x))
            : WLParams?.point ===
              UTILS.roundM(Math.abs(beam.startPos.z - startPos.z)),
          isWindLoadPointE: isX
            ? WLParams?.point ===
              UTILS.roundM(Math.abs(endPos.x - beam.startPos.x))
            : WLParams?.point ===
              UTILS.roundM(Math.abs(beam.startPos.z - endPos.z)),
          isWindLoadUDL:
            WLParams?.udl &&
            WLParams.udl[0] <=
              UTILS.roundM(
                Math.abs(
                  isX
                    ? startPos.x - beam.startPos.x
                    : beam.startPos.z - startPos.z
                )
              ) &&
            WLParams.udl[1] >=
              UTILS.roundM(
                Math.abs(
                  isX ? endPos.x - beam.startPos.x : beam.startPos.z - endPos.z
                )
              ),
          isDirectLoadPointS: isX
            ? directLoadPoint ===
              UTILS.roundM(Math.abs(startPos.x - beam.startPos.x))
            : directLoadPoint ===
              UTILS.roundM(Math.abs(beam.startPos.z - startPos.z)),
          isDirectLoadPointE: isX
            ? directLoadPoint ===
              UTILS.roundM(Math.abs(endPos.x - beam.startPos.x))
            : directLoadPoint ===
              UTILS.roundM(Math.abs(beam.startPos.z - endPos.z)),
          isEquipmentLoadS: isX
            ? equipmentLoadPoint ===
              UTILS.roundM(Math.abs(startPos.x - beam.startPos.x))
            : equipmentLoadPoint ===
              UTILS.roundM(Math.abs(beam.startPos.z - startPos.z)),
          isEquipmentLoadE: isX
            ? equipmentLoadPoint ===
              UTILS.roundM(Math.abs(endPos.x - beam.startPos.x))
            : equipmentLoadPoint ===
              UTILS.roundM(Math.abs(beam.startPos.z - endPos.z)),
        },
      ];
    }
  });
  return newBeams;
}

export function splitCantilevers(
  cnts: PR_TYPES.PipeRackCantilever[],
  loadings = true
) {
  let newBeams: any[] = [];
  cnts.forEach((beam) => {
    const splitPoints: number[] = [0, beam.startPos.distanceTo(beam.endPos)];

    const DLParams = loadings
      ? getAdditionalLoadsParams("deadLoad", beam, splitPoints)
      : undefined;
    const LLParams = loadings
      ? getAdditionalLoadsParams("liveLoad", beam, splitPoints)
      : undefined;
    const WLParams = loadings
      ? getAdditionalLoadsParams("windLoad", beam, splitPoints)
      : undefined;

    let directLoadPoint;
    if (loadings && beam.directLoad?.distance) {
      if (!splitPoints.includes(beam.directLoad.distance))
        splitPoints.push(beam.directLoad.distance);
      directLoadPoint = beam.directLoad.distance;
    }

    splitPoints.sort();
    const newVector = UTILS.roundVectorM(beam.startPos.clone());
    for (let i = 1; i < splitPoints.length; i++) {
      const isFB = beam.position === "Front" || beam.position === "Back";
      const startPos = newVector.clone();
      const endPos = UTILS.roundVectorM(
        isFB
          ? newVector.setX(beam.startPos.x + splitPoints[i])
          : newVector.setZ(beam.startPos.z - splitPoints[i])
      ).clone();
      newBeams = [
        ...newBeams,
        {
          ...beam,
          name: splitPoints.length > 2 ? `${beam.name}.${i}` : beam.name,
          startPos,
          endPos,
          isDeadLoadPointS: isFB
            ? DLParams?.point ===
              UTILS.roundM(Math.abs(startPos.x - beam.startPos.x))
            : DLParams?.point ===
              UTILS.roundM(Math.abs(beam.startPos.z - startPos.z)),
          isDeadLoadPointE: isFB
            ? DLParams?.point ===
              UTILS.roundM(Math.abs(endPos.x - beam.startPos.x))
            : DLParams?.point ===
              UTILS.roundM(Math.abs(beam.startPos.z - endPos.z)),
          isDeadLoadUDL:
            DLParams?.udl &&
            DLParams.udl[0] <=
              UTILS.roundM(
                Math.abs(
                  isFB
                    ? startPos.x - beam.startPos.x
                    : beam.startPos.z - startPos.z
                )
              ) &&
            DLParams.udl[1] >=
              UTILS.roundM(
                Math.abs(
                  isFB ? endPos.x - beam.startPos.x : beam.startPos.z - endPos.z
                )
              ),
          isLiveLoadPointS: isFB
            ? LLParams?.point ===
              UTILS.roundM(Math.abs(startPos.x - beam.startPos.x))
            : LLParams?.point ===
              UTILS.roundM(Math.abs(beam.startPos.z - startPos.z)),
          isLiveLoadPointE: isFB
            ? LLParams?.point ===
              UTILS.roundM(Math.abs(endPos.x - beam.startPos.x))
            : LLParams?.point ===
              UTILS.roundM(Math.abs(beam.startPos.z - endPos.z)),
          isLiveLoadUDL:
            LLParams?.udl &&
            LLParams.udl[0] <=
              UTILS.roundM(
                Math.abs(
                  isFB
                    ? startPos.x - beam.startPos.x
                    : beam.startPos.z - startPos.z
                )
              ) &&
            LLParams.udl[1] >=
              UTILS.roundM(
                Math.abs(
                  isFB ? endPos.x - beam.startPos.x : beam.startPos.z - endPos.z
                )
              ),
          isWindLoadPointS: isFB
            ? WLParams?.point ===
              UTILS.roundM(Math.abs(startPos.x - beam.startPos.x))
            : WLParams?.point ===
              UTILS.roundM(Math.abs(beam.startPos.z - startPos.z)),
          isWindLoadPointE: isFB
            ? WLParams?.point ===
              UTILS.roundM(Math.abs(endPos.x - beam.startPos.x))
            : WLParams?.point ===
              UTILS.roundM(Math.abs(beam.startPos.z - endPos.z)),
          isWindLoadUDL:
            WLParams?.udl &&
            WLParams.udl[0] <=
              UTILS.roundM(
                Math.abs(
                  isFB
                    ? startPos.x - beam.startPos.x
                    : beam.startPos.z - startPos.z
                )
              ) &&
            WLParams.udl[1] >=
              UTILS.roundM(
                Math.abs(
                  isFB ? endPos.x - beam.startPos.x : beam.startPos.z - endPos.z
                )
              ),
          isDirectLoadPointS: isFB
            ? directLoadPoint ===
              UTILS.roundM(Math.abs(startPos.x - beam.startPos.x))
            : directLoadPoint ===
              UTILS.roundM(Math.abs(beam.startPos.z - startPos.z)),
          isDirectLoadPointE: isFB
            ? directLoadPoint ===
              UTILS.roundM(Math.abs(endPos.x - beam.startPos.x))
            : directLoadPoint ===
              UTILS.roundM(Math.abs(beam.startPos.z - endPos.z)),
        },
      ];
    }
  });
  return newBeams;
}

export function splitAccessoryBeams(beams: any[], loadings = true) {
  let newBeams: any[] = [];
  beams.forEach((beam) => {
    const splitPoints: number[] = [0, beam.startPos.distanceTo(beam.endPos)];

    const DLParams = loadings
      ? getAdditionalLoadsParams("deadLoad", beam, splitPoints)
      : undefined;
    const LLParams = loadings
      ? getAdditionalLoadsParams("liveLoad", beam, splitPoints)
      : undefined;
    const WLParams = loadings
      ? getAdditionalLoadsParams("windLoad", beam, splitPoints)
      : undefined;

    let directLoadPoint;
    if (loadings && beam.directLoad?.distance) {
      if (!splitPoints.includes(beam.directLoad.distance))
        splitPoints.push(beam.directLoad.distance);
      directLoadPoint = beam.directLoad.distance;
    }

    splitPoints.sort();
    const newVector = UTILS.roundVectorM(beam.startPos.clone());

    for (let i = 1; i < splitPoints.length; i++) {
      const startPos = newVector.clone();
      const endPos = UTILS.roundVectorM(
        beam.position === "R"
          ? newVector.setZ(beam.startPos.z + splitPoints[i])
          : newVector.setZ(beam.startPos.z - splitPoints[i])
      ).clone();

      newBeams = [
        ...newBeams,
        {
          ...beam,
          name: splitPoints.length > 2 ? `${beam.name}.${i}` : beam.name,
          startPos,
          endPos,
          isDeadLoadPointS:
            DLParams?.point ===
            UTILS.roundM(Math.abs(beam.startPos.z - startPos.z)),
          isDeadLoadPointE:
            DLParams?.point ===
            UTILS.roundM(Math.abs(beam.startPos.z - endPos.z)),
          isDeadLoadUDL:
            DLParams?.udl &&
            DLParams.udl[0] <=
              UTILS.roundM(Math.abs(beam.startPos.z - startPos.z)) &&
            DLParams.udl[1] >=
              UTILS.roundM(Math.abs(beam.startPos.z - endPos.z)),
          isLiveLoadPointS:
            LLParams?.point ===
            UTILS.roundM(Math.abs(beam.startPos.z - startPos.z)),
          isLiveLoadPointE:
            LLParams?.point ===
            UTILS.roundM(Math.abs(beam.startPos.z - endPos.z)),
          isLiveLoadUDL:
            LLParams?.udl &&
            LLParams.udl[0] <=
              UTILS.roundM(Math.abs(beam.startPos.z - startPos.z)) &&
            LLParams.udl[1] >=
              UTILS.roundM(Math.abs(beam.startPos.z - endPos.z)),
          isWindLoadPointS:
            WLParams?.point ===
            UTILS.roundM(Math.abs(beam.startPos.z - startPos.z)),
          isWindLoadPointE:
            WLParams?.point ===
            UTILS.roundM(Math.abs(beam.startPos.z - endPos.z)),
          isWindLoadUDL:
            WLParams?.udl &&
            WLParams.udl[0] <=
              UTILS.roundM(Math.abs(beam.startPos.z - startPos.z)) &&
            WLParams.udl[1] >=
              UTILS.roundM(Math.abs(beam.startPos.z - endPos.z)),
          isDirectLoadPoint:
            directLoadPoint ===
            UTILS.roundM(Math.abs(beam.startPos.z - endPos.z)),
        },
      ];
    }
  });
  return newBeams;
}

export function getHBracingsWithPositions(
  bracings: PR_TYPES.PipeRackHBracing[],
  beams: (PR_TYPES.PipeRackBeam | PR_TYPES.PipeRackCantilever)[]
) {
  let mapped: any[] = [];
  bracings.forEach((bracing) => {
    const startB = beams.find((beam) => beam.name === bracing.start);
    const endB = beams.find((beam) => beam.name === bracing.end);
    if (startB && endB) {
      const startPos = startB.startPos.clone();
      const endPos = endB.startPos.clone();
      if (
        (startB as PR_TYPES.PipeRackBeam).direction === "X" ||
        (startB as PR_TYPES.PipeRackCantilever).position === "Front" ||
        (startB as PR_TYPES.PipeRackCantilever).position === "Back"
      ) {
        (startB as PR_TYPES.PipeRackCantilever).position === "Front"
          ? startPos.setX(startPos.x - bracing.startOffset)
          : startPos.setX(startPos.x + bracing.startOffset);
      } else {
        (startB as PR_TYPES.PipeRackCantilever).position === "Right"
          ? startPos.setZ(startPos.z + bracing.startOffset)
          : startPos.setZ(startPos.z - bracing.startOffset);
      }
      if (
        (endB as PR_TYPES.PipeRackBeam).direction === "X" ||
        (endB as PR_TYPES.PipeRackCantilever).position === "Front" ||
        (endB as PR_TYPES.PipeRackCantilever).position === "Back"
      ) {
        (endB as PR_TYPES.PipeRackCantilever).position === "Front"
          ? endPos.setX(endPos.x - bracing.endOffset)
          : endPos.setX(endPos.x + bracing.endOffset);
      } else {
        (endB as PR_TYPES.PipeRackCantilever).position === "Right"
          ? endPos.setZ(endPos.z + bracing.endOffset)
          : endPos.setZ(endPos.z - bracing.endOffset);
      }
      mapped = [
        ...mapped,
        {
          ...bracing,
          startPos: UTILS.roundVectorM(startPos),
          endPos: UTILS.roundVectorM(endPos),
        },
      ];
    }
  });
  return mapped;
}

export function getAccessoriesElements(
  accessories: PR_TYPES.Accessory[],
  portals: PR_TYPES.PipeRackPortal[],
  loadings = true
) {
  let mapped: any[] = [];
  accessories.forEach((ag: any) => {
    const portal = portals.find((portal) => portal.name === ag.parent);
    portal &&
      ag.elements.forEach((el: PR_TYPES.AccessoryElement) => {
        mapped = [
          ...mapped,
          ...splitColumns(el.colItems, loadings),
          ...splitAccessoryBeams(el.beamItems, loadings),
        ];
      });
  });
  return mapped;
}

export function getPipes(
  pipes: PR_TYPES.Pipe[],
  beams: PR_TYPES.PipeRackBeam[]
) {
  let pipeItems: any[] = [];
  let PCIndex = 0;
  pipes.forEach((pipe) => {
    let index = 1;
    let supBeams: any[] = [];
    let points: any[] = [{ ...pipe.start }];

    // getting support beams
    pipe.supTypes.forEach((sup) => {
      const beam = beams.find((beam) => beam.name === sup.beam);
      if (beam) supBeams = [...supBeams, { ...beam, supType: sup.type }];
    });

    // getting crossing points of pipe and supporting beams
    supBeams.forEach((sb) => {
      if (pipe.direction === "+X" || pipe.direction === "-X") {
        let x;
        if (sb.direction === "X") {
          const startZ =
            pipe.start.z +
            UTILS.getOffsetB(
              pipe.start.x,
              pipe.start.z,
              pipe.end.x,
              pipe.end.z,
              sb.startPos.x - pipe.start.x
            );
          const length =
            startZ /
            Math.sin(
              UTILS.getRotationByLegs(
                pipe.start.x,
                pipe.start.z,
                pipe.end.x,
                pipe.end.z
              )
            );
          x = length
            ? sb.startPos.x +
              Math.sqrt(Math.pow(length, 2) - Math.pow(startZ, 2))
            : 0;
        } else {
          x = sb.startPos.x;
        }
        points = [
          ...points,
          {
            supBeam: sb,
            PCIndex: ++PCIndex,
            x,
            y:
              pipe.start.y +
              UTILS.getOffsetB(
                pipe.start.x,
                pipe.start.y,
                pipe.end.x,
                pipe.end.y,
                x - pipe.start.x
              ),
            z:
              pipe.start.z +
              UTILS.getOffsetB(
                pipe.start.x,
                pipe.start.z,
                pipe.end.x,
                pipe.end.z,
                x - pipe.start.x
              ),
          },
        ];
      } else if (pipe.direction === "+Z" || pipe.direction === "-Z") {
        let z;
        if (sb.direction === "Z") {
          const startX =
            pipe.start.x +
            UTILS.getOffsetB(
              pipe.start.z,
              pipe.start.x,
              pipe.end.z,
              pipe.end.x,
              sb.startPos.z - pipe.start.z
            );
          const length =
            startX /
            Math.sin(
              UTILS.getRotationByLegs(
                pipe.start.z,
                pipe.start.x,
                pipe.end.z,
                pipe.end.x
              )
            );
          z = length
            ? sb.startPos.z +
              Math.sqrt(Math.pow(length, 2) - Math.pow(startX, 2))
            : 0;
        } else {
          z = (sb.startPos.z + sb.endPos.z) / 2;
        }
        points = [
          ...points,
          {
            supBeam: sb,
            PCIndex: ++PCIndex,
            x:
              pipe.start.x +
              UTILS.getOffsetB(
                pipe.start.z,
                pipe.start.x,
                pipe.end.z,
                pipe.end.x,
                z - pipe.start.z
              ),
            Y:
              pipe.start.y +
              UTILS.getOffsetB(
                pipe.start.z,
                pipe.start.y,
                pipe.end.z,
                pipe.end.y,
                z - pipe.start.z
              ),
            z,
          },
        ];
      } else {
        points = [
          ...points,
          {
            supBeam: sb,
            PCIndex: ++PCIndex,
            x:
              pipe.start.x +
              UTILS.getOffsetB(
                pipe.start.y,
                pipe.start.x,
                pipe.end.y,
                pipe.end.x,
                sb.startPos.y - pipe.start.y
              ),
            y: sb.startPos.y,
            z:
              pipe.start.z +
              UTILS.getOffsetB(
                pipe.start.y,
                pipe.start.z,
                pipe.end.y,
                pipe.end.z,
                sb.startPos.y - pipe.start.y
              ),
          },
        ];
      }
    });

    // create pipe items
    points = [...points, pipe.end].sort((a, b) =>
      a.x === b.x ? (a.y === b.y ? a.z - b.z : a.y - b.y) : a.x - b.x
    );
    points.forEach((point, i, arr) => {
      const nextPoint = arr[i + 1];
      if (nextPoint) {
        let distance = new Vector3(point.x, point.y, point.z).distanceTo(
          new Vector3(nextPoint.x, nextPoint.y, nextPoint.z)
        );
        let x = point.x;
        let y = point.y;
        let z = point.z;
        while (distance > 0) {
          let offsetX = 0;
          let offsetY = 0;
          let offsetZ = 0;
          const length = distance > 1 ? 1 : distance;
          // todo offsets using cos
          if (pipe.direction === "+X" || pipe.direction === "-X") {
            offsetX =
              x +
              length *
                (point.y !== nextPoint.y
                  ? Math.cos(
                      UTILS.getRotationByLegs(
                        point.x,
                        point.y,
                        nextPoint.x,
                        nextPoint.y
                      )
                    )
                  : Math.cos(
                      UTILS.getRotationByLegs(
                        point.x,
                        point.z,
                        nextPoint.x,
                        nextPoint.z
                      )
                    ));
            offsetY =
              point.y -
              UTILS.getOffsetB(
                point.x,
                point.y,
                nextPoint.x,
                nextPoint.y,
                offsetX
              );
            offsetZ =
              point.z -
              UTILS.getOffsetB(
                point.x,
                point.z,
                nextPoint.x,
                nextPoint.z,
                offsetX
              );
          } else if (pipe.direction === "+Z" || pipe.direction === "-Z") {
            offsetZ =
              z +
              length *
                (point.y !== nextPoint.y
                  ? Math.cos(
                      UTILS.getRotationByLegs(
                        point.z,
                        point.y,
                        nextPoint.z,
                        nextPoint.y
                      )
                    )
                  : Math.cos(
                      UTILS.getRotationByLegs(
                        point.z,
                        point.x,
                        nextPoint.z,
                        nextPoint.x
                      )
                    ));
            offsetY =
              point.y -
              UTILS.getOffsetB(
                point.z,
                point.y,
                nextPoint.z,
                nextPoint.y,
                offsetZ
              );
            offsetX =
              point.x -
              UTILS.getOffsetB(
                point.z,
                point.x,
                nextPoint.z,
                nextPoint.x,
                offsetZ
              );
          } else {
            offsetY =
              y +
              length *
                (point.x !== nextPoint.x
                  ? Math.cos(
                      UTILS.getRotationByLegs(
                        point.y,
                        point.x,
                        nextPoint.y,
                        nextPoint.x
                      )
                    )
                  : Math.cos(
                      UTILS.getRotationByLegs(
                        point.y,
                        point.z,
                        nextPoint.y,
                        nextPoint.z
                      )
                    ));
            offsetX =
              point.x -
              UTILS.getOffsetB(
                point.y,
                point.x,
                nextPoint.y,
                nextPoint.x,
                offsetY
              );
            offsetZ =
              point.z -
              UTILS.getOffsetB(
                point.y,
                point.z,
                nextPoint.y,
                nextPoint.z,
                offsetY
              );
          }
          let tier;
          let startSupBeam;
          if (point.x === x && point.y === y && point.z === z) {
            startSupBeam = point.supBeam?.name;
            tier = point.supBeam?.tier;
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
                    beamName: `${pcName}-${startSupBeam}`,
                    pipeName: `${pcName}-${pipe.name}`,
                    startPos: getCrossPoint(point.supBeam, pipe),
                    endPos: new Vector3(x, y, z),
                    diameter: UTILS.MtoMM(pipe.diameter),
                    thickness: UTILS.MtoMM(pipe.thickness),
                    material: pipe.material,
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
            endSupBeam = nextPoint.supBeam?.name;
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
                    beamName: `${pcName}-${endSupBeam}`,
                    pipeName: `${pcName}-${pipe.name}`,
                    startPos: getCrossPoint(nextPoint.supBeam, pipe),
                    endPos: new Vector3(offsetX, offsetY, offsetZ),
                    diameter: UTILS.MtoMM(pipe.diameter),
                    thickness: UTILS.MtoMM(pipe.thickness),
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
              tier,
              type: "PipeItem",
              name: `${pipe.name}.${index}`,
              startPos: new Vector3(x, y, z),
              endPos: new Vector3(offsetX, offsetY, offsetZ),
              diameter: UTILS.MtoMM(pipe.diameter),
              thickness: UTILS.MtoMM(pipe.thickness),
              material: pipe.material,
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

export function getAllElements(models: PR_TYPES.PipeRack[]) {
  let elements: any[] = [];
  models.forEach((model) => {
    elements = [
      ...elements,
      ...[
        ...splitColumns(model.columns),
        ...splitBeams(model.beams),
        ...model.cantilevers,
        ...model.vBracings,
        ...getHBracingsWithPositions(model.hBracings, [
          ...model.beams,
          ...model.cantilevers,
        ]),
        ...getAccessoriesElements(model.accessories, model.portals),
      ]
        .map((el) => ({
          ...el,
          modelName: model.name,
          startPos: UTILS.localToGlobal(
            model.startPos,
            el.startPos,
            model.direction
          ),
          endPos: UTILS.localToGlobal(
            model.startPos,
            el.endPos,
            model.direction
          ),
        }))
        .sort((a, b) => sortByMiddlePoint(a, b)),
      ...getPipes(model.pipes, model.beams)
        .map((el) => ({
          ...el,
          modelName: model.name,
          startPos: UTILS.localToGlobal(
            model.startPos,
            el.startPos,
            model.direction
          ),
          endPos: UTILS.localToGlobal(
            model.startPos,
            el.endPos,
            model.direction
          ),
        }))
        .sort((a, b) => sortByMiddlePoint(a, b)),
    ];
  });
  return elements;
}

export function getSupportPosByBeam(
  startPos: Vector3,
  endPos: Vector3,
  direction: PR_TYPES.Direction3,
  beam: PR_TYPES.PipeRackBeam | PR_TYPES.PipeRackCantilever
) {
  const pos = startPos.clone();
  if (direction === "+X" || direction === "-X") {
    pos.setX(beam.startPos.x);
    pos.setY(
      pos.y -
        UTILS.getOffsetB(startPos.x, startPos.y, endPos.x, endPos.y, pos.x)
    );
    pos.setZ(
      pos.z -
        UTILS.getOffsetB(startPos.x, startPos.z, endPos.x, endPos.z, pos.x)
    );
  } else if (direction === "+Z" || direction === "-Z") {
    pos.setX(
      pos.x +
        UTILS.getOffsetB(
          startPos.z,
          startPos.x,
          endPos.z,
          endPos.x,
          beam.startPos.z
        )
    );
    pos.setY(
      pos.y +
        UTILS.getOffsetB(
          startPos.z,
          startPos.y,
          endPos.z,
          endPos.y,
          beam.startPos.z
        )
    );
    pos.setZ(beam.startPos.z);
  } else {
    pos.set(
      (startPos.x + endPos.x) / 2,
      beam.startPos.y,
      (startPos.z + endPos.z) / 2
    );
  }
  return pos;
}

export function getAccessoryBeams(accessories: PR_TYPES.Accessory[]) {
  return accessories.reduce(
    (acc, ag) => [
      ...acc,
      ...ag.elements.reduce(
        (acc2, el) => [...acc2, ...el.beamItems],
        [] as any[]
      ),
    ],
    [] as any[]
  );
}

export function getPipeSupportBeams(
  model: PR_TYPES.PipeRack,
  pipe: PR_TYPES.Pipe
) {
  return getBeamsAroundPipe(
    [
      ...model.beams,
      ...model.cantilevers,
      ...getAccessoryBeams(model.accessories),
    ],
    pipe.direction,
    pipe.start,
    pipe.end
  );
}

export function getNodesAndMembersPR(models: PR_TYPES.PipeRack[]) {}

export function drawPipeRackLoads(
  elements: (
    | PR_TYPES.PipeRackBeam
    | PR_TYPES.PipeRackColumn
    | PR_TYPES.PipeRackCantilever
  )[],
  font: Font
) {
  const group = new Group();
  group.name = "PIPE-RACK-LOADS";

  for (const element of elements) {
    const start = element.startPos.clone();
    const end = element.endPos.clone();

    const xLoads = new Map<number, number>();
    const yLoads = new Map<number, number>();
    const zLoads = new Map<number, number>();

    if (element.deadLoad) {
      const { distance, Fx, Fy, Fz } = element.deadLoad;
      const xLoad = xLoads.get(distance) ?? 0;
      const yLoad = yLoads.get(distance) ?? 0;
      const zLoad = zLoads.get(distance) ?? 0;

      Fx && xLoads.set(distance, UTILS.roundM(xLoad + Fx));
      Fy && yLoads.set(distance, UTILS.roundM(yLoad + Fy));
      Fz && zLoads.set(distance, UTILS.roundM(zLoad + Fz));
    }

    if (element.liveLoad) {
      const { distance, Fx, Fy, Fz } = element.liveLoad;
      const xLoad = xLoads.get(distance) ?? 0;
      const yLoad = yLoads.get(distance) ?? 0;
      const zLoad = zLoads.get(distance) ?? 0;

      Fx && xLoads.set(distance, UTILS.roundM(xLoad + Fx));
      Fy && yLoads.set(distance, UTILS.roundM(yLoad + Fy));
      Fz && zLoads.set(distance, UTILS.roundM(zLoad + Fz));
    }

    if (element.windLoad) {
      const { distance, Fx, Fy, Fz } = element.windLoad;
      const xLoad = xLoads.get(distance) ?? 0;
      const yLoad = yLoads.get(distance) ?? 0;
      const zLoad = zLoads.get(distance) ?? 0;

      Fx && xLoads.set(distance, UTILS.roundM(xLoad + Fx));
      Fy && yLoads.set(distance, UTILS.roundM(yLoad + Fy));
      Fz && zLoads.set(distance, UTILS.roundM(zLoad + Fz));
    }

    for (const [distance, value] of Array.from(xLoads.entries())) {
      if (!value) continue;
      const isNegative = value < 0;
      const position = UTILS.getPosByDistance(distance, start, end);
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
      const position = UTILS.getPosByDistance(distance, start, end);
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
      const position = UTILS.getPosByDistance(distance, start, end);
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
