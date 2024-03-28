import {
  Project,
  ModelItem,
  Direction2,
  Orientation,
  Direction3,
  TSelectedPlatform,
} from "../../store/main/types";
import {
  TOpenFrame,
  TFrameOF,
  TColumnOF,
  TBeamOF,
  TCantileverOF,
  TKneeBracingOF,
  THorizontalBracingOF,
  TVerticalBracingOF,
  TBeamElement,
  TPlatformOF,
  TCBasePlateOF,
  TRBasePlateOF,
  TRSpliceFlangeOF,
  TCSpliceFlangeOF,
  TTPElementOF,
  TFPElementOF,
  TCTElementOF,
  TPipeOF,
  TStaircaseOF,
  TElementType,
  TTrussOF,
  TRunnerOF,
  TMetalCladdingOF,
  TMasonryCladdingOF,
  TRailingOF,
  TBoldedConn,
  TRoad,
  TCableTrayOF,
} from "../../store/main/openFrameTypes";
import {
  OFFramesParametersUI,
  OpenFrameUI,
  OFFramesUI,
  ProjectUI,
  ModelAnalysisUI,
  MemberStressCheckUI,
  DeflectionCheckUI,
  AdditionalLoadUI,
  EquipmentLoadUI,
  DirectLoadUI,
} from "../../store/ui/types";
import * as THREE from "three";
import {
  Vector3,
  Mesh,
  BoxBufferGeometry,
  MeshBasicMaterial,
  CylinderBufferGeometry,
  MeshStandardMaterial,
  Shape,
  ExtrudeBufferGeometry,
  Group,
  Path,
  SphereBufferGeometry,
  Geometry,
  Line,
  MeshLambertMaterial,
  TextGeometry,
  DoubleSide,
  Font,
  ArrowHelper,
  SphereGeometry,
  Matrix4,
  CylinderGeometry,
  ExtrudeGeometry,
  CatmullRomCurve3,
  QuadraticBezierCurve3,
  CurvePath,
  Curve,
  LineCurve,
  LineCurve3,
  TextureLoader,
  MeshPhongMaterial,
  RGBAFormat,
  Color,
  Scene,
} from "three";
import {
  getDefaultRotation,
  createElementByProfile,
  createFireProofingByProfile,
} from "./profileElement";
import {
  columnColorRGB,
  deg90InRad,
  beamColorRGB,
  vBracingColorRGB,
  hBracingColorRGB,
  platformColorRGB,
  pedestalColor,
  deg180InRad,
  deg360InRad,
  pipeColorRGB,
  supColorRGB,
  green,
  red,
  yellow,
  gray,
} from "../../store/main/constants";
import {
  degToRad,
  getRotationByLegs,
  getIndexName,
  getRGB,
  MMtoM,
  fixRGB,
  getElementByName,
  checkRange,
  getNextId,
  getOffsetB,
  getPosByDistance,
  replaceSplitNumber,
  getUnicuesArray,
  fixVectorByOrientation,
  roundM,
  roundVectorM,
  hardCheckRange,
  getDirection,
  globalToLocal,
  getMiddleVector3,
  getSimpleDirection,
  vector3FromPoint,
} from "./utils";
import { Dispatch } from "redux";
import { changeModel, changeProjectAction } from "../../store/main/actions";
import {
  changeOFUIAction,
  addEventAction,
  secondConfirmAction,
} from "../../store/ui/actions";
import { getSimpleAxisHelper } from "./axisHelper";
import { getRotation } from "./common/commonUtils";
import { TBeamConnections } from "../../recoil/atoms/beam-connections-atom";
import { dropZoneMaterial } from "../../services/process-services/mouse-pipe-creating-service";
import { TOFCreateState } from "../../recoil/atoms/of-creation-atom";
import { TPipeElementAnchor } from "../../services/pipe-services/pipe-service";
import { TPipeSegmentParams } from "../../recoil/atoms/process-atoms";
import { getDistanceBetweenDropZones } from "../work-field/workFieldUtils/sceneUtils";
import { TProcessLineSegment } from "../../store/process/types";
import Segments from "../menu-bar/3d-modeling/flare/segments/Segments";
import { ELEVATION_2 } from "@blueprintjs/core/lib/esm/common/classes";
import { TAnalysisSettings } from "../../store/main/types";
import { useMemo, useState } from "react";
import { useSelector } from "react-redux";
import { ApplicationState } from "../../store";
import { getCurrentUI } from "./utils";
import { getJSONForDesignCodesAndParameters } from "./designCodeAndParameters";
import { getJSONForDesignCodesAndParametersOF } from "./designCodeAndParametersOF";

import { importPipesToModels } from "./pipe-importing/toPipeRack";
import { drawRawLadder } from "./pipe-rack/pipeRackModeling";
import { mergeMesh } from "./process/process";

const blueHex = 0x0000ff;
const redHex = 0xff0000;
const greenHex = 0x00d000;

const vX = new Vector3(1, 0, 0);
const vY = new Vector3(0, 1, 0);
const vZ = new Vector3(0, 0, 1);

export function getOFModels(project?: Project): TOpenFrame[] {
  if (!project) return [];
  return project.models.filter(
    (model) => model.type === "Open Frame" || model.type === "ROAD"
  ) as TOpenFrame[];
}

export function getFSModels(project?: Project): TOpenFrame[] {
  if (!project) return [];
  return project.models.filter(
    (model) => model.type === "Factory Shed"
  ) as TOpenFrame[];
}

export function createOFModel(name: string, project: string, ui: OpenFrameUI) {
  const frames = createFrames(name, ui.frames.parameters);
  const elements = createElements(ui.frames, frames);
  const model: TOpenFrame = {
    name,
    project: project,
    type: "Open Frame",
    baseElevation: ui.frames.pedestalHeight,
    startPos: new Vector3(ui.frames.x, ui.frames.y, ui.frames.z),
    direction: ui.frames.directionToReplicate!,
    CSLibrary: ui.frames.library!,
    frameColProfile: ui.frames.frameColProfile!,
    frameBeamProfile: ui.frames.frameBeamProfile!,
    frameTieProfile: ui.frames.frameTieProfile!,
    material: ui.frames.material,
    frames,
    platforms: [],
    circularBP: [],
    rectangularBP: [],
    circularSF: [],
    rectangularSF: [],
    accessories: [],
    pipes: [],
    roads: [],
    ...elements,
  };
  return model;
}

export function createRoadModel(
  name: string,
  project: string,
  ui: OpenFrameUI
) {
  const frames = createFrames(name, ui.frames.parameters);
  const elements = createElements(ui.frames, frames);
  const model: TOpenFrame = {
    name,
    project: project,
    type: "ROAD",
    baseElevation: ui.frames.pedestalHeight,
    startPos: new Vector3(ui.frames.x, ui.frames.y, ui.frames.z),
    direction: ui.frames.directionToReplicate!,
    CSLibrary: ui.frames.library!,
    frameColProfile: ui.frames.frameColProfile!,
    frameBeamProfile: ui.frames.frameBeamProfile!,
    frameTieProfile: ui.frames.frameTieProfile!,
    material: ui.frames.material,
    frames,
    platforms: [],
    circularBP: [],
    rectangularBP: [],
    circularSF: [],
    rectangularSF: [],
    accessories: [],
    pipes: [],
    roads: [],
    ...elements,
  };
  return model;
}

export function createFSModel(name: string, project: string, ui: OpenFrameUI) {
  const frames = createFrames(name, ui.frames.parameters);
  const elements = createElements(ui.frames, frames);
  const model: TOpenFrame = {
    name,
    project: project,
    type: "Factory Shed",
    baseElevation: ui.frames.pedestalHeight,
    startPos: new Vector3(ui.frames.x, ui.frames.y, ui.frames.z),
    direction: ui.frames.directionToReplicate!,
    CSLibrary: ui.frames.library!,
    frameColProfile: ui.frames.frameColProfile!,
    frameBeamProfile: ui.frames.frameBeamProfile!,
    frameTieProfile: ui.frames.frameTieProfile!,
    material: ui.frames.material,
    frames,
    platforms: [],
    circularBP: [],
    rectangularBP: [],
    circularSF: [],
    rectangularSF: [],
    accessories: [],
    pipes: [],
    ...elements,
  };
  return model;
}

export function removeOFModel(
  project: Project,
  ui: OpenFrameUI,
  modelName: string
) {
  const models = project.models.filter((model) => model.name !== modelName);
  const newProject: Project = {
    ...project,
    models,
    modelType: models.length ? project.modelType : undefined,
  };
  const newUI: OpenFrameUI = {
    ...ui,
    frames: {
      ...ui.frames,
      parameters: ui.frames.parameters.filter(
        (item) => item.model !== modelName
      ),
      relocations: ui.frames.relocations.filter(
        (item) => item.model !== modelName
      ),
    },
    additionalBeams: {
      beamToBeam: ui.additionalBeams.beamToBeam.filter(
        (item) => item.model !== modelName
      ),
      cantilever: ui.additionalBeams.cantilever.filter(
        (item) => item.model !== modelName
      ),
      columnToBeam: ui.additionalBeams.columnToBeam.filter(
        (item) => item.model !== modelName
      ),
      columnToColumn: ui.additionalBeams.columnToColumn.filter(
        (item) => item.model !== modelName
      ),
      columns: ui.additionalBeams.columns.filter(
        (item) => item.model !== modelName
      ),
      kneeBracings: ui.additionalBeams.kneeBracings.filter(
        (item) => item.model !== modelName
      ),
      planBracings: ui.additionalBeams.planBracings.filter(
        (item) => item.model !== modelName
      ),
      verticalBracings: ui.additionalBeams.verticalBracings.filter(
        (item) => item.model !== modelName
      ),
      staircases: ui.additionalBeams.staircases.filter(
        (item) => item.model !== modelName
      ),
    },
    members: {
      beams: ui.members.beams.filter((item) => item.model !== modelName),
      columns: ui.members.columns.filter((item) => item.model !== modelName),
      releases: ui.members.releases.filter((item) => item.model !== modelName),
    },
    platforms: ui.platforms.filter((item) => item.model !== modelName),
    basePlates: {
      ...ui.basePlates,
      circular: ui.basePlates.circular?.filter(
        (item) => item.model !== modelName
      ),
      rectangular: ui.basePlates.rectangular.filter(
        (item) => item.model !== modelName
      ),
    },
    spliceFlanges: {
      circular: ui.spliceFlanges.circular.filter(
        (item) => item.model !== modelName
      ),
      rectangular: ui.spliceFlanges.rectangular.filter(
        (item) => item.model !== modelName
      ),
    },
    ladders: {
      ...ui.ladders,
      ladders: ui.ladders.ladders.filter((item) => item.model !== modelName),
    },
    loadingsUI: {
      ...ui.loadingsUI,
      deadLoadUI: {
        ...ui.loadingsUI.deadLoadUI,
        loads: ui.loadingsUI.deadLoadUI.loads.filter(
          (item) => item.model !== modelName
        ),
      },
      liveLoadUI: {
        ...ui.loadingsUI.liveLoadUI,
        loads: ui.loadingsUI.liveLoadUI.loads.filter(
          (item) => item.model !== modelName
        ),
      },
      windLoadUI: {
        ...ui.loadingsUI.windLoadUI,
        loads: ui.loadingsUI.windLoadUI.loads.filter(
          (item) => item.model !== modelName
        ),
      },
      seismicLoadsUI: {
        ...ui.loadingsUI.seismicLoadsUI,
        seismicLoads: ui.loadingsUI.seismicLoadsUI.seismicLoads.filter(
          (item) => item.model !== modelName
        ),
      },
      pipingLoadsUI: {
        directLoads: ui.loadingsUI.pipingLoadsUI.directLoads.filter(
          (item) => item.model !== modelName
        ),
        blanketLoads: ui.loadingsUI.pipingLoadsUI.blanketLoads.filter(
          (item) => item.model !== modelName
        ),
      },
      equipmentLoadUI: ui.loadingsUI.equipmentLoadUI.filter(
        (item) => item.model !== modelName
      ),
    },
  };
  return { newProject, newUI };
}

export function createFramesParameters(model: string, frames: OFFramesUI) {
  let arr: OFFramesParametersUI[] = [];
  for (let i = 0, len = frames.noOfSimilarFrames; i < len; ++i) {
    arr = [
      ...arr,
      {
        id: i,
        selected: false,
        model,
        frame: `FRM${i + 1}`,
        chainage: i * frames.spacingOfFrames,
        width: frames.frameWidth,
        noOfColumns: frames.noOfColumns,
        totalHeight: frames.frameHeight,
        supportType: frames.supportType,
        noOfTiers: frames.noOfTiers,
      },
    ];
  }
  return arr;
}

function createFrames(
  model: string,
  parameters: OFFramesParametersUI[]
): TFrameOF[] {
  let frames: TFrameOF[] = [];
  const modelFP = parameters.filter((param) => param.model === model);
  modelFP.forEach((fp) => {
    const frame: TFrameOF = {
      id: fp.id,
      model: fp.model,
      name: fp.frame,
      chainage: fp.chainage,
      height: fp.totalHeight,
      supportType: fp.supportType,
      width: fp.width,
      columns: fp.noOfColumns,
      tiers: fp.noOfTiers,
    };
    frames = [...frames, frame];
  });
  return frames;
}

function createElements(framesUI: OFFramesUI, frames: TFrameOF[]) {
  const map = new Map<string, TBeamElement>();
  // const columns = new Map<string, TColumnOF>();
  // const beams = new Map<string, TBeamOF>();
  frames.forEach((frame) => {
    for (let i = 0; i < frame.columns; i++) {
      const columnDistance = frame.width / (frame.columns - 1);
      const leftZ = frame.width / -2;
      const z = leftZ + columnDistance * i;
      const pos = new Vector3(frame.chainage, framesUI.pedestalHeight, z);
      const indexColumn = map.size + 1;
      const column: TColumnOF = {
        id: indexColumn,
        type: "COLUMN",
        secondType: "GENERAL",
        name: `C${indexColumn}`,
        frame: frame.name,
        pos: pos.clone(),
        startPos: pos.clone(),
        endPos: pos.clone().setY(frame.height),
        profile: framesUI.frameColProfile!,
        orientation: 0,
        startConnected: [],
        connected: [],
        endConnected: [],
      };
      map.set(column.name, column);
    }
  });
  for (let tier = 0; tier < framesUI.noOfTiers; tier++) {
    frames.forEach((frame, indexFrame, arr) => {
      const columnDistance = frame.width / (frame.columns - 1);
      const leftZ = frame.width / -2;
      const tierHeight = frame.height / framesUI.noOfTiers;
      const frameBaysW = frame.columns - 1;
      const frameBaysL = arr.length - 1;

      for (let i = 0; i < frame.columns; i++) {
        const z = leftZ + columnDistance * i;
        const currentHeight = tierHeight * (tier + 1);
        const pos = new Vector3(frame.chainage, currentHeight, z);
        let indexFrameBeam;
        let frameBeam: TBeamOF | undefined;
        if (i !== frameBaysW) {
          indexFrameBeam = getNextId(
            mapToArray(map).filter((el) => el.type === "BEAM")
          );
          frameBeam = {
            id: indexFrameBeam,
            type: "BEAM",
            secondType: "GENERAL",
            name: `B${indexFrameBeam}`,
            frame: frame.name,
            direction: "Z",
            startPos: pos.clone(),
            endPos: pos.clone().setZ(leftZ + columnDistance * (i + 1)),
            profile: framesUI.frameBeamProfile!,
            orientation: 0,
            startConnected: [],
            connected: [],
            endConnected: [],
          };
          updateConnectionsFromMap(map, frameBeam);
        }

        let indexTieBeam;
        let tieBeam: TBeamOF | undefined;
        if (indexFrame !== frameBaysL) {
          indexTieBeam = indexFrameBeam
            ? indexFrameBeam + 1
            : getNextId(mapToArray(map).filter((el) => el.type === "BEAM"));
          tieBeam = {
            id: indexTieBeam,
            type: "BEAM",
            secondType: "GENERAL",
            name: `B${indexTieBeam}`,
            frame: frame.name,
            direction: "X",
            startPos: pos.clone(),
            endPos: pos.clone().setX(arr[indexFrame + 1]?.chainage ?? 0),
            profile: framesUI.frameTieProfile!,
            orientation: 0,
            startConnected: [],
            connected: [],
            endConnected: [],
            releases: {
              my1: true,
              mz1: true,
              my2: true,
              mz2: true,
            },
          };
          updateConnectionsFromMap(map, tieBeam);
        }
      }
    });
  }
  return getSeparetedElementsOfModel(mapToArray(map));
}

export function getBeamElementsOfModel(model: TOpenFrame): TBeamElement[] {
  return [
    ...model.columns,
    ...model.beams,
    ...model.cantilevers,
    ...model.horizontalBracings,
    ...model.kneeBracings,
    ...model.verticalBracings,
    ...model.staircases,
  ];
}

export function getMapOfBeamElements(
  model: TOpenFrame
): Map<string, TBeamElement> {
  const map = new Map<string, TBeamElement>();
  for (let i = 0, len = model.columns.length; i < len; i++) {
    const item = model.columns[i];
    map.set(item.name, item);
  }
  // if(model.roads)
  // for (let i = 0, len = model?.roads.length; i < len; i++) {
  //   const item = model.roads[i];
  //   map.set(item.name, item);
  // }
  for (let i = 0, len = model.beams.length; i < len; i++) {
    const item = model.beams[i];
    map.set(item.name, item);
  }
  for (let i = 0, len = model.cantilevers.length; i < len; i++) {
    const item = model.cantilevers[i];
    map.set(item.name, item);
  }
  for (let i = 0, len = model.horizontalBracings.length; i < len; i++) {
    const item = model.horizontalBracings[i];
    map.set(item.name, item);
  }
  for (let i = 0, len = model.kneeBracings.length; i < len; i++) {
    const item = model.kneeBracings[i];
    map.set(item.name, item);
  }
  for (let i = 0, len = model.verticalBracings.length; i < len; i++) {
    const item = model.verticalBracings[i];
    map.set(item.name, item);
  }
  for (let i = 0, len = model.staircases.length; i < len; i++) {
    const item = model.staircases[i];
    map.set(item.name, item);
  }
  if (model.roads) {
    for (let i = 0, len = model.roads.length; i < len; i++) {
      const item = model.roads[i];
      map.set(item.name, item);
    }
  }
  if (model.cableTrays) {
    for (let i = 0, len = model.cableTrays.length; i < len; i++) {
      const item = model.cableTrays[i];
      map.set(item.name, item);
    }
  }
  return map;
}

export function getMapOfBeamElementsFromArray(
  arr: TBeamElement[]
): Map<string, TBeamElement> {
  const map = new Map<string, TBeamElement>();
  for (const element of arr) {
    map.set(element.name, element);
  }
  return map;
}

export function getSeparetedElementsOfModel(elements: TBeamElement[]) {
  let columns: TColumnOF[] = [];
  let beams: TBeamOF[] = [];
  let cantilevers: TCantileverOF[] = [];
  let horizontalBracings: THorizontalBracingOF[] = [];
  let kneeBracings: TKneeBracingOF[] = [];
  let verticalBracings: TVerticalBracingOF[] = [];
  let cableTrays: TCableTrayOF[] = [];
  let staircases: TStaircaseOF[] = [];
  elements.forEach((el) => {
    switch (el.type) {
      case "COLUMN":
        columns = [...columns, el as TColumnOF];
        break;
      case "BEAM":
        beams = [...beams, el as TBeamOF];
        break;
      case "CANTILEVER":
        cantilevers = [...cantilevers, el as TCantileverOF];
        break;
      case "HORIZONTAL-BRACING":
        horizontalBracings = [
          ...horizontalBracings,
          el as THorizontalBracingOF,
        ];
        break;
      case "KNEE-BRACING":
        kneeBracings = [...kneeBracings, el as TKneeBracingOF];
        break;
      case "VERTICAL-BRACING":
        verticalBracings = [...verticalBracings, el as TVerticalBracingOF];
        break;
      case "STAIRCASE":
        staircases = [...staircases, el as TStaircaseOF];
        break;
      case "CABLE_TRAY":
        cableTrays = [...cableTrays, el as TCableTrayOF];
        break;
      default:
        break;
    }
  });
  return {
    columns,
    beams,
    cantilevers,
    horizontalBracings,
    cableTrays,
    kneeBracings,
    verticalBracings,
    staircases,
  };
}

export function convertElementsArrayToObject(elements: TBeamElement[]) {
  return elements.reduce(
    (acc, item) => ({ ...acc, [item.name]: { ...item } }),
    {}
  );
}

export function updateReleasesToColumn(
  dispatch: Dispatch<any>,
  place: string,
  map: Map<string, TBeamElement>,
  element: TColumnOF
) {
  const shape = element.profile.shape?.toUpperCase().trim();
  if (!(shape === "I" || shape === "C")) return;
  const connected = [
    ...element.startConnected,
    ...element.connected,
    ...element.endConnected,
  ];
  for (const conn of connected) {
    const item = map.get(conn);
    if (!item || item.type !== "BEAM") continue;
    const beam = item as TBeamOF;
    const isStart = beam.startConnected.includes(element.name);
    switch (element.orientation) {
      case undefined:
      case 0:
      case 180:
        if (beam.direction === "X") {
          map.set(beam.name, {
            ...beam,
            releases: isStart
              ? { ...beam.releases, my1: true, mz1: true }
              : { ...beam.releases, my2: true, mz2: true },
          });
        } else {
          map.set(beam.name, {
            ...beam,
            releases: isStart
              ? { ...beam.releases, my1: false, mz1: false }
              : { ...beam.releases, my2: false, mz2: false },
          });
        }
        break;
      case 90:
      case 270:
        if (beam.direction === "X") {
          map.set(beam.name, {
            ...beam,
            releases: isStart
              ? { ...beam.releases, my1: false, mz1: false }
              : { ...beam.releases, my2: false, mz2: false },
          });
        } else {
          map.set(beam.name, {
            ...beam,
            releases: isStart
              ? { ...beam.releases, my1: true, mz1: true }
              : { ...beam.releases, my2: true, mz2: true },
          });
        }
        break;
      default:
        map.set(beam.name, {
          ...beam,
          releases: isStart
            ? { ...beam.releases, my1: false, mz1: false }
            : { ...beam.releases, my2: false, mz2: false },
        });
    }
  }
  dispatch(
    addEventAction(
      `${place}: Updated releases for beams connected to "${element.name}"`,
      "warning"
    )
  );
}

// START - FRAME ---------------------------------------------------------------------------------

export function changeFrameChainage(
  model: TOpenFrame,
  frame: string,
  chainage: number
): TOpenFrame {
  const elements = getBeamElementsOfModel(model);
  let changedModel = { ...model };
  const currentFrame = changedModel.frames.find((item) => item.name === frame);
  const prevFrame = [...changedModel.frames]
    .sort((a, b) => b.id - a.id)
    .find((item) => item.name < frame)?.name;
  const diff = roundM(chainage - (currentFrame?.chainage ?? 0));
  changedModel = {
    ...changedModel,
    frames: changedModel.frames.map((item) => {
      if (item.name === frame) {
        return { ...item, chainage };
      }
      return item;
    }),
  };
  const prevBeams = prevFrame
    ? changedModel.beams.filter((item) => {
        if (item.frame !== prevFrame) return false;
        return changedModel.columns.some((column) => {
          if (column.frame !== frame) return false;
          return item.endConnected.includes(column.name);
        });
      })
    : [];
  for (const element of prevBeams) {
    const changed: TBeamElement = {
      ...element,
      endPos: element.endPos.clone().setX(roundM(element.endPos.x + diff)),
    };
    changedModel = updateConnections(changedModel, changed);
  }
  for (const element of elements) {
    if (element.frame !== frame) continue;
    if (element.type === "COLUMN") {
      const changed: TBeamElement = {
        ...element,
        pos: (element as TColumnOF).pos.clone().setX(chainage),
        startPos: element.startPos.clone().setX(chainage),
        endPos: element.endPos.clone().setX(chainage),
      } as TColumnOF;
      changedModel = updateConnections(changedModel, changed);
    } else if (element.type === "BEAM") {
      let changed: TBeamElement = {
        ...element,
        startPos: element.startPos.clone().setX(chainage),
      };
      if ((element as TBeamOF).direction === "Z") {
        changed = {
          ...changed,
          endPos: changed.endPos.clone().setX(chainage),
        };
      }
      changedModel = updateConnections(changedModel, changed);
    }
  }
  return changedModel;
}

export function changeFrameNoOfColumns(
  model: TOpenFrame,
  frame: string,
  noOfColumns: number
) {
  const frameItem = getElementByName(model.frames, frame);
  if (!frameItem) return model;
  const map = getMapOfBeamElements(model);
  model.columns.forEach((column) => {
    if (column.frame === frame && column.secondType === "GENERAL") {
      removeConnectionsFromMap(map, column);
    }
  });
  let elements = mapToArray(map);
  const columnDistance = frameItem.width / (noOfColumns - 1);
  const leftZ = frameItem.width / -2;
  for (let i = 0; i < noOfColumns; i++) {
    const z = leftZ + columnDistance * i;
    const index = getIndexName(elements, "C");
    elements = insertColumn(elements, {
      id: index,
      type: "COLUMN",
      secondType: "GENERAL",
      name: `C${index}`,
      frame,
      pos: new Vector3(frameItem.chainage, model.baseElevation, z),
      startPos: new Vector3(frameItem.chainage, model.baseElevation, z),
      endPos: new Vector3(frameItem.chainage, frameItem.height, z),
      profile: model.frameColProfile,
      orientation: 0,
      startConnected: [],
      connected: [],
      endConnected: [],
    } as TColumnOF);
  }
  return {
    ...model,
    ...getSeparetedElementsOfModel(elements),
  };
}

// END - FRAME -----------------------------------------------------------------------------------

// START - BEAM ----------------------------------------------------------------------------------

function insertBeam(elements: TBeamElement[], item: TBeamOF): TBeamElement[] {
  let newEl = { ...item };
  let newElements: any = convertElementsArrayToObject([...elements, newEl]);
  const elevation = newEl.startPos.y;
  const isX = newEl.startPos.z === newEl.endPos.z;
  const isZ = newEl.startPos.x === newEl.endPos.x;
  const fromStart = newEl.startPos.x <= newEl.endPos.x;
  const fromLeft = newEl.startPos.z <= newEl.endPos.z;
  elements.forEach((el) => {
    if (el.type === "COLUMN") {
      const x = el.startPos.x;
      const z = el.startPos.z;
      if (newEl.startPos.x === newEl.endPos.x && newEl.startPos.x === x) {
        // X = X
        if (
          (newEl.startPos.z > z && newEl.endPos.z < z) ||
          (newEl.startPos.z < z && newEl.endPos.z > z)
        ) {
          // between Z
          if (elevation === el.startPos.y || elevation === el.endPos.y) {
            // Y = Y
            newElements = CBE(newElements, newEl, el as TColumnOF);
            newEl = { ...newElements[newEl.name] };
          } else if (elevation >= el.startPos.y && elevation <= el.endPos.y) {
            // between Y
            newElements = CBB(newElements, newEl, el as TColumnOF);
            newEl = { ...newElements[newEl.name] };
          }
        } else if (newEl.startPos.z === z || newEl.endPos.z === z) {
          // Z = Z
          if (elevation === el.startPos.y || elevation === el.endPos.y) {
            // Y = Y
            newElements = CEE(newElements, newEl, el as TColumnOF);
            newEl = { ...newElements[newEl.name] };
          } else if (elevation >= el.startPos.y && elevation <= el.endPos.y) {
            // between Y
            newElements = CEB(newElements, newEl, el as TColumnOF);
            newEl = { ...newElements[newEl.name] };
          }
        }
      } else if (
        newEl.startPos.z === newEl.endPos.z &&
        newEl.startPos.z === z
      ) {
        // Z = Z
        if (
          (newEl.startPos.x > x && newEl.endPos.x < x) ||
          (newEl.startPos.x < x && newEl.endPos.x > x)
        ) {
          // between X
          if (elevation === el.startPos.y || elevation === el.endPos.y) {
            // Y = Y
            newElements = CBE(newElements, newEl, el as TColumnOF);
            newEl = { ...newElements[newEl.name] };
          } else if (elevation >= el.startPos.y && elevation <= el.endPos.y) {
            // between Y
            newElements = CBB(newElements, newEl, el as TColumnOF);
            newEl = { ...newElements[newEl.name] };
          }
        } else if (newEl.startPos.x === x || newEl.endPos.x === x) {
          // X = X
          if (elevation === el.startPos.y || elevation === el.endPos.y) {
            // Y = Y
            newElements = CEE(newElements, newEl, el as TColumnOF);
            newEl = { ...newElements[newEl.name] };
          } else if (elevation >= el.startPos.y && elevation <= el.endPos.y) {
            // between Y
            newElements = CEB(newElements, newEl, el as TColumnOF);
            newEl = { ...newElements[newEl.name] };
          }
        }
      }
    } else if (el.type === "BEAM") {
      if (elevation === el.startPos.y) {
        // Y = Y
        if (el.startPos.x === el.endPos.x) {
          // element by Z
          if (isX) {
            if (
              (el.startPos.z < newEl.startPos.z &&
                el.endPos.z > newEl.startPos.z) ||
              (el.startPos.z > newEl.startPos.z &&
                el.endPos.z < newEl.startPos.z)
            ) {
              if (
                (el.startPos.x > newEl.startPos.x &&
                  el.startPos.x < newEl.endPos.x) ||
                (el.startPos.x < newEl.startPos.x &&
                  el.startPos.x > newEl.endPos.x)
              ) {
                const indexEl = getIndexName(Object.values(newElements), "B");
                const crossing = new Vector3(
                  el.startPos.x,
                  elevation,
                  newEl.startPos.z
                );
                const nextA: TBeamElement = {
                  ...el,
                  name: `B${indexEl}`,
                  startPos: crossing.clone(),
                  prev: el.name,
                  next: el.next,
                  startConnected: [newEl.name, `B${indexEl + 1}`],
                  id: indexEl,
                  uiId: undefined,
                };
                const prevA: TBeamElement = {
                  ...el,
                  endPos: crossing.clone(),
                  next: nextA.name,
                  endConnected: [newEl.name, `B${indexEl + 1}`],
                };
                const nextB: TBeamElement = {
                  ...newEl,
                  name: `B${indexEl + 1}`,
                  startPos: crossing.clone(),
                  prev: newEl.name,
                  next: newEl.next,
                  startConnected: [prevA.name, nextA.name],
                  id: indexEl + 1,
                  uiId: undefined,
                };
                const prevB: TBeamElement = {
                  ...newEl,
                  endPos: crossing.clone(),
                  next: nextB.name,
                  endConnected: [prevA.name, nextA.name],
                };
                newElements = convertElementsArrayToObject(
                  insertBeam(
                    insertBeam(
                      Object.values({
                        ...newElements,
                        [prevA.name]: prevA,
                        [prevB.name]: prevB,
                      }),
                      nextA as TBeamOF
                    ),
                    nextB as TBeamOF
                  )
                );
                newEl = { ...newElements[newEl.name] };
              } else if (
                el.startPos.x === newEl.startPos.x ||
                el.startPos.x === newEl.endPos.x
              ) {
                const isStartNewEl = el.startPos.x === newEl.startPos.x;
                const index = getIndexName(Object.values(newElements), "B");
                const next: TBeamElement = {
                  ...el,
                  name: `B${index}`,
                  startPos: newEl[isStartNewEl ? "startPos" : "endPos"].clone(),
                  prev: el.name,
                  next: el.next,
                  startConnected: [newEl.name],
                  id: index,
                  uiId: undefined,
                };
                const prev: TBeamElement = {
                  ...el,
                  endPos: newEl[isStartNewEl ? "startPos" : "endPos"].clone(),
                  next: next.name,
                  endConnected: [newEl.name],
                };
                newElements = insertBeam(
                  Object.values({
                    ...newElements,
                    [prev.name]: prev,
                    [newEl.name]: {
                      ...newEl,
                      [isStartNewEl
                        ? "startConnected"
                        : "endConnected"]: Array.from(
                        new Set([
                          ...newEl[
                            isStartNewEl ? "startConnected" : "endConnected"
                          ],
                          prev.name,
                          next.name,
                        ])
                      ),
                    },
                  }),
                  next as TBeamOF
                );
                newEl = { ...newElements[newEl.name] };
              }
            } else if (
              el.startPos.z === newEl.startPos.z ||
              el.endPos.z === newEl.startPos.z
            ) {
              const isStart =
                el.startPos.z === newEl.startPos.z
                  ? "startConnected"
                  : "endConnected";
              const isStartNewEl =
                el.startPos.x === newEl.startPos.x
                  ? "startConnected"
                  : "endConnected";
              if (
                (el.startPos.x > newEl.startPos.x &&
                  el.startPos.x < newEl.endPos.x) ||
                (el.startPos.x < newEl.startPos.x &&
                  el.startPos.x > newEl.endPos.x)
              ) {
                const index = getIndexName(Object.values(newElements), "B");
                const next: TBeamElement = {
                  ...newEl,
                  name: `B${index}`,
                  startPos: el.startPos.clone(),
                  prev: newEl.name,
                  next: newEl.next,
                  startConnected: [el.name],
                  id: index,
                  uiId: undefined,
                };
                const prev: TBeamElement = {
                  ...newEl,
                  endPos: el.startPos.clone(),
                  next: next.name,
                  endConnected: [el.name],
                };
                newElements = insertBeam(
                  Object.values({
                    ...newElements,
                    [prev.name]: prev,
                    [el.name]: {
                      ...el,
                      [isStart]: Array.from(
                        new Set([...el[isStart], prev.name, next.name])
                      ),
                    },
                  }),
                  next as TBeamOF
                );
                newEl = { ...newElements[newEl.name] };
              } else if (
                el.startPos.x === newEl.startPos.x ||
                el.startPos.x === newEl.endPos.x
              ) {
                newElements = {
                  ...newElements,
                  [el.name]: {
                    ...el,
                    [isStart]: [...el[isStart], newEl.name],
                  },
                  [newEl.name]: {
                    ...newEl,
                    [isStartNewEl]: [...newEl[isStartNewEl], el.name],
                  },
                };
                newEl = { ...newElements[newEl.name] };
              }
            }
          } else if (isZ && el.startPos.x === newEl.startPos.x) {
            if (el.startPos.z <= el.endPos.z) {
              if (fromLeft && el.endPos.z === newEl.startPos.z) {
                newElements = {
                  ...newElements,
                  [el.name]: { ...el, next: newEl.name },
                  [newEl.name]: { ...newEl, prev: el.name },
                };
                newEl = { ...newElements[newEl.name] };
              } else if (fromLeft && el.startPos.z === newEl.endPos.z) {
                newElements = {
                  ...newElements,
                  [el.name]: { ...el, prev: newEl.name },
                  [newEl.name]: { ...newEl, next: el.name },
                };
                newEl = { ...newElements[newEl.name] };
              }
            } else {
              if (!fromLeft && el.startPos.z === newEl.endPos.z) {
                newElements = {
                  ...newElements,
                  [el.name]: { ...el, next: newEl.name },
                  [newEl.name]: { ...newEl, prev: el.name },
                };
                newEl = { ...newElements[newEl.name] };
              } else if (!fromLeft && el.endPos.z === newEl.startPos.z) {
                newElements = {
                  ...newElements,
                  [el.name]: { ...el, prev: newEl.name },
                  [newEl.name]: { ...newEl, next: el.name },
                };
                newEl = { ...newElements[newEl.name] };
              }
            }
          }
        } else if (el.startPos.z === el.endPos.z) {
          // element by X
          if (isX && el.startPos.z === newEl.startPos.z) {
            if (el.startPos.x <= el.endPos.x) {
              if (fromStart && el.endPos.x === newEl.startPos.x) {
                newElements = {
                  ...newElements,
                  [el.name]: { ...el, next: newEl.name },
                  [newEl.name]: { ...newEl, prev: el.name },
                };
              } else if (fromStart && el.startPos.x === newEl.endPos.x) {
                newElements = {
                  ...newElements,
                  [el.name]: { ...el, prev: newEl.name },
                  [newEl.name]: { ...newEl, next: el.name },
                };
              }
            } else {
              if (!fromStart && el.startPos.x === newEl.endPos.x) {
                newElements = {
                  ...newElements,
                  [el.name]: { ...el, prev: newEl.name },
                  [newEl.name]: { ...newEl, next: el.name },
                };
              } else if (!fromStart && el.endPos.x === newEl.startPos.x) {
                newElements = {
                  ...newElements,
                  [el.name]: { ...el, next: newEl.name },
                  [newEl.name]: { ...newEl, prev: el.name },
                };
              }
            }
          } else if (isZ) {
            if (
              (newEl.startPos.z < el.startPos.z &&
                newEl.endPos.z > el.startPos.z) ||
              (newEl.startPos.z > el.startPos.z &&
                newEl.endPos.z < el.startPos.z)
            ) {
              if (
                (newEl.startPos.x > el.startPos.x &&
                  newEl.startPos.x < el.endPos.x) ||
                (newEl.startPos.x < el.startPos.x &&
                  newEl.startPos.x > el.endPos.x)
              ) {
                const indexEl = getIndexName(Object.values(newElements), "B");
                const crossing = new Vector3(
                  newEl.startPos.x,
                  elevation,
                  el.startPos.z
                );
                const nextA: TBeamElement = {
                  ...newEl,
                  name: `B${indexEl}`,
                  startPos: crossing.clone(),
                  prev: newEl.name,
                  next: newEl.next,
                  startConnected: [el.name, `B${indexEl + 1}`],
                  id: indexEl,
                  uiId: undefined,
                };
                const prevA: TBeamElement = {
                  ...newEl,
                  endPos: crossing.clone(),
                  next: nextA.name,
                  endConnected: [el.name, `B${indexEl + 1}`],
                };
                const nextB: TBeamElement = {
                  ...el,
                  name: `B${indexEl + 1}`,
                  startPos: crossing.clone(),
                  prev: el.name,
                  next: el.next,
                  startConnected: [prevA.name, nextA.name],
                  id: indexEl + 1,
                  uiId: undefined,
                };
                const prevB: TBeamElement = {
                  ...el,
                  endPos: crossing.clone(),
                  next: nextB.name,
                  endConnected: [prevA.name, nextA.name],
                };
                newElements = convertElementsArrayToObject(
                  insertBeam(
                    insertBeam(
                      Object.values({
                        ...newElements,
                        [prevA.name]: prevA,
                        [prevB.name]: prevB,
                      }),
                      nextA as TBeamOF
                    ),
                    nextB as TBeamOF
                  )
                );
                newEl = { ...newElements[newEl.name] };
              } else if (
                newEl.startPos.x === el.startPos.x ||
                newEl.startPos.x === el.endPos.x
              ) {
                const isStartNewEl = newEl.startPos.x === el.startPos.x;
                const index = getIndexName(Object.values(newElements), "B");
                const next: TBeamElement = {
                  ...newEl,
                  name: `B${index}`,
                  startPos: el[isStartNewEl ? "startPos" : "endPos"].clone(),
                  prev: newEl.name,
                  next: newEl.next,
                  startConnected: [el.name],
                  id: index,
                  uiId: undefined,
                };
                const prev: TBeamElement = {
                  ...newEl,
                  endPos: el[isStartNewEl ? "startPos" : "endPos"].clone(),
                  next: next.name,
                  endConnected: [el.name],
                };
                newElements = insertBeam(
                  Object.values({
                    ...newElements,
                    [prev.name]: prev,
                    [el.name]: {
                      ...el,
                      [isStartNewEl
                        ? "startConnected"
                        : "endConnected"]: Array.from(
                        new Set([
                          ...el[
                            isStartNewEl ? "startConnected" : "endConnected"
                          ],
                          prev.name,
                          next.name,
                        ])
                      ),
                    },
                  }),
                  next as TBeamOF
                );
                newEl = { ...newElements[newEl.name] };
              }
            } else if (
              newEl.startPos.z === el.startPos.z ||
              newEl.endPos.z === el.startPos.z
            ) {
              const isStart =
                newEl.startPos.z === el.startPos.z
                  ? "startConnected"
                  : "endConnected";
              const isStartNewEl =
                newEl.startPos.x === el.startPos.x
                  ? "startConnected"
                  : "endConnected";
              if (
                (newEl.startPos.x > el.startPos.x &&
                  newEl.startPos.x < el.endPos.x) ||
                (newEl.startPos.x < el.startPos.x &&
                  newEl.startPos.x > el.endPos.x)
              ) {
                const index = getIndexName(Object.values(newElements), "B");
                const next: TBeamElement = {
                  ...el,
                  name: `B${index}`,
                  startPos: el.startPos.clone(),
                  prev: el.name,
                  next: el.next,
                  startConnected: [newEl.name],
                  id: index,
                  uiId: undefined,
                };
                const prev: TBeamElement = {
                  ...el,
                  endPos: newEl.startPos.clone(),
                  next: next.name,
                  endConnected: [newEl.name],
                };
                newElements = insertBeam(
                  Object.values({
                    ...newElements,
                    [prev.name]: prev,
                    [newEl.name]: {
                      ...newEl,
                      [isStart]: Array.from(
                        new Set([...newEl[isStart], prev.name, next.name])
                      ),
                    },
                  }),
                  next as TBeamOF
                );
                newEl = { ...newElements[newEl.name] };
              } else if (
                newEl.startPos.x === el.startPos.x ||
                newEl.startPos.x === el.endPos.x
              ) {
                newElements = {
                  ...newElements,
                  [newEl.name]: {
                    ...newEl,
                    [isStart]: [...newEl[isStart], el.name],
                  },
                  [el.name]: {
                    ...el,
                    [isStartNewEl]: [...el[isStartNewEl], newEl.name],
                  },
                };
                newEl = { ...newElements[newEl.name] };
              }
            }
          }
        }
        newEl = { ...newElements[newEl.name] };
      }
    }
  });
  return Object.values(newElements);
}

// END - BEAM ------------------------------------------------------------------------------------

// START - COLUMN --------------------------------------------------------------------------------

export function insertColumn(
  elements: TBeamElement[],
  item: TColumnOF
): TBeamElement[] {
  let newEl = { ...item };
  let newElements: any = convertElementsArrayToObject([...elements, newEl]);
  elements.forEach((el) => {
    if (el.type === "COLUMN") {
      if (el.endPos.equals(newEl.startPos)) {
        newElements = {
          ...newElements,
          [el.name]: { ...el, next: newEl.name },
          [newEl.name]: { ...newEl, prev: el.name },
        };
        newEl = { ...newElements[newEl.name] };
      } else if (el.startPos.equals(newEl.endPos)) {
        newElements = {
          ...newElements,
          [el.name]: { ...el, prev: newEl.name },
          [newEl.name]: { ...newEl, next: el.name },
        };
        newEl = { ...newElements[newEl.name] };
      }
    } else if (el.type === "BEAM" || el.type === "CANTILEVER") {
      const elevation = el.startPos.y;
      const x = newEl.startPos.x;
      const z = newEl.startPos.z;
      if (el.startPos.x === el.endPos.x && el.startPos.x === x) {
        // X = X
        if (
          (el.startPos.z > z && el.endPos.z < z) ||
          (el.startPos.z < z && el.endPos.z > z)
        ) {
          // between Z
          if (elevation === newEl.startPos.y || elevation === newEl.endPos.y) {
            // Y = Y
            newElements = CBE(newElements, el, newEl);
            newEl = { ...newElements[newEl.name] };
          } else if (
            elevation >= newEl.startPos.y &&
            elevation <= newEl.endPos.y
          ) {
            // between Y
            newElements = CBB(newElements, el, newEl);
            newEl = { ...newElements[newEl.name] };
          }
        } else if (el.startPos.z === z || el.endPos.z === z) {
          // Z = Z
          if (elevation === newEl.startPos.y || elevation === newEl.endPos.y) {
            // Y = Y
            newElements = CEE(newElements, el, newEl);
            newEl = { ...newElements[newEl.name] };
          } else if (
            elevation >= newEl.startPos.y &&
            elevation <= newEl.endPos.y
          ) {
            // between Y
            newElements = CEB(newElements, el, newEl);
            newEl = { ...newElements[newEl.name] };
          }
        }
      } else if (el.startPos.z === el.endPos.z && el.startPos.z === z) {
        // Z = Z
        if (
          (el.startPos.x > x && el.endPos.x < x) ||
          (el.startPos.x < x && el.endPos.x > x)
        ) {
          // between X
          if (elevation === newEl.startPos.y || elevation === newEl.endPos.y) {
            // Y = Y
            newElements = CBE(newElements, el, newEl);
            newEl = { ...newElements[newEl.name] };
          } else if (
            elevation >= newEl.startPos.y &&
            elevation <= newEl.endPos.y
          ) {
            // between Y
            newElements = CBB(newElements, el, newEl);
            newEl = { ...newElements[newEl.name] };
          }
        } else if (el.startPos.x === x || el.endPos.x === x) {
          // X = X
          if (elevation === newEl.startPos.y || elevation === newEl.endPos.y) {
            // Y = Y
            newElements = CEE(newElements, el, newEl);
            newEl = { ...newElements[newEl.name] };
          } else if (
            elevation >= newEl.startPos.y &&
            elevation <= newEl.endPos.y
          ) {
            // between Y
            newElements = CEB(newElements, el, newEl);
            newEl = { ...newElements[newEl.name] };
          }
        }
      }
    }
  });
  return Object.values(newElements);
}

/**
 * @param item changed column of Open Frame
 * @param elements beam elements which converted to object
 * @returns changed column and beam elements which connected to end node (and to start node if column don't has prev element)
 **/
function changeConnectedToColumn(item: TColumnOF, elements: any) {
  let changedElements = {
    ...elements,
    [item.name]: item,
  };
  if (!item.prev) {
    item.startConnected.forEach((scItem) => {
      const connected = changedElements[scItem] as TBeamElement;
      if (connected.type === "CANTILEVER") {
        const changed: TCantileverOF = {
          ...connected,
          startPos: item.startPos.clone(),
          endPos: (connected as TCantileverOF).direction.includes("X")
            ? connected.endPos
                .clone()
                .setX(
                  connected.endPos.x + (item.startPos.x - connected.startPos.x)
                )
                .setZ(item.startPos.z)
            : connected.endPos
                .clone()
                .setX(item.startPos.x)
                .setZ(
                  connected.endPos.z + (item.startPos.z - connected.startPos.z)
                ),
        } as TCantileverOF;
        changedElements = changeConnectedToCantilever(changed, changedElements);
      } else {
        const pos = connected.startPos.equals(elements[item.name].startPos)
          ? "startPos"
          : "endPos";
        changedElements = {
          ...changedElements,
          [connected.name]: {
            ...connected,
            [pos]: item.startPos.clone(),
          },
        };
      }
    });
  }
  item.connected.forEach((conn) => {
    const connected = changedElements[conn] as TBeamElement;
    if (connected.type === "CANTILEVER") {
      const changed: TCantileverOF = {
        ...connected,
        startPos: connected.startPos.set(
          item.startPos.x,
          connected.startPos.y,
          item.startPos.z
        ),
        endPos: (connected as TCantileverOF).direction.includes("X")
          ? connected.endPos
              .clone()
              .setX(connected.endPos.x + (item.endPos.x - connected.startPos.x))
              .setZ(item.endPos.z)
          : connected.endPos
              .clone()
              .setX(item.endPos.x)
              .setZ(
                connected.endPos.z + (item.endPos.z - connected.startPos.z)
              ),
      } as TCantileverOF;
      changedElements = changeConnectedToCantilever(changed, changedElements);
    } else {
      const old = elements[item.name] as TColumnOF;
      const pos =
        connected.startPos.x === old.startPos.x &&
        connected.startPos.z === old.startPos.z
          ? "startPos"
          : connected.endPos.x === old.startPos.x &&
            connected.endPos.z === old.startPos.z
          ? "endPos"
          : undefined;
      if (pos) {
        changedElements = {
          ...changedElements,
          [connected.name]: {
            ...connected,
            [pos]: connected[pos].set(
              item.startPos.x,
              connected[pos].y,
              item.startPos.z
            ),
          },
        };
      }
    }
  });
  item.endConnected.forEach((scItem) => {
    const connected = changedElements[scItem] as TBeamElement;
    if (connected.type === "CANTILEVER") {
      const changed: TCantileverOF = {
        ...connected,
        startPos: item.endPos.clone(),
        endPos: (connected as TCantileverOF).direction.includes("X")
          ? connected.endPos
              .clone()
              .setX(connected.endPos.x + (item.endPos.x - connected.startPos.x))
              .setZ(item.endPos.z)
          : connected.endPos
              .clone()
              .setX(item.endPos.x)
              .setZ(
                connected.endPos.z + (item.endPos.z - connected.startPos.z)
              ),
      } as TCantileverOF;
      changedElements = changeConnectedToCantilever(changed, changedElements);
    } else {
      const pos = connected.startPos.equals(elements[item.name].endPos)
        ? "startPos"
        : "endPos";
      changedElements = {
        ...changedElements,
        [connected.name]: {
          ...connected,
          [pos]: item.endPos.clone(),
        },
      };
    }
  });
  return changedElements;
}

// COLUMN - BETWEEN (X or Z) - EQUALS Y
function CBE(newElements: any, el: TBeamElement, newEl: TColumnOF) {
  const isStart = el.startPos.y === newEl.startPos.y;
  const name = el.type === "BEAM" ? "B" : "CNT";
  const index = getIndexName(Object.values(newElements), name);
  const crossing = isStart ? newEl.startPos : newEl.endPos;
  const isGeneralBeam =
    el.type === "BEAM" &&
    (((el as TBeamOF).secondType === "GENERAL" &&
      (el as TBeamOF).direction === "X") ||
      (el as TBeamOF).secondType !== "GENERAL");
  const next: TBeamElement = {
    ...el,
    name: `${name}${index}`,
    startPos: crossing.clone(),
    prev: el.name,
    next: el.next,
    startConnected: [newEl.name],
    id: index,
    uiId: undefined,
    releases: {
      ...el.releases,
      mx1: false,
      my1: isGeneralBeam ? true : false,
      mz1: isGeneralBeam ? true : false,
    },
  };
  const prev: TBeamElement = {
    ...el,
    endPos: crossing.clone(),
    next: next.name,
    endConnected: [newEl.name],
    releases: {
      ...el.releases,
      mx2: false,
      my2: isGeneralBeam ? true : false,
      mz2: isGeneralBeam ? true : false,
    },
  };
  const elements = {
    ...newElements,
    [prev.name]: prev,
    [newEl.name]: {
      ...newEl,
      [isStart ? "startConnected" : "endConnected"]: getUnicuesArray([
        ...newEl[isStart ? "startConnected" : "endConnected"],
        prev.name,
        next.name,
      ]),
    },
  };
  return next.type === "BEAM"
    ? convertElementsArrayToObject(
        insertBeam(Object.values(elements), next as TBeamOF)
      )
    : elements;
}

// COLUMN - BETWEEN (X or Z) - BETWEEN Y
function CBB(newElements: any, el: TBeamElement, newEl: TColumnOF) {
  const indexB = getIndexName(Object.values(newElements), "B");
  const isGeneralBeam =
    el.type === "BEAM" &&
    (((el as TBeamOF).secondType === "GENERAL" &&
      (el as TBeamOF).direction === "X") ||
      (el as TBeamOF).secondType !== "GENERAL");
  const crossing = new Vector3(
    newEl.startPos.x,
    el.startPos.y,
    newEl.startPos.z
  );
  const nextB: TBeamElement = {
    ...el,
    name: `B${indexB}`,
    startPos: crossing.clone(),
    prev: el.name,
    next: el.next,
    startConnected: [newEl.name],
    id: indexB,
    uiId: undefined,
    releases: {
      ...el.releases,
      mx1: false,
      my1: isGeneralBeam ? true : false,
      mz1: isGeneralBeam ? true : false,
    },
  };
  const prevB: TBeamElement = {
    ...el,
    endPos: crossing.clone(),
    next: nextB.name,
    endConnected: [newEl.name],
    releases: {
      ...el.releases,
      mx2: false,
      my2: isGeneralBeam ? true : false,
      mz2: isGeneralBeam ? true : false,
    },
  };
  const field =
    crossing.y === newEl.endPos.y
      ? "endConnected"
      : crossing.y === newEl.startPos.y
      ? "startConnected"
      : "connected";
  const _newEl = {
    ...newEl,
    // @ts-ignore
    [field]: getUnicuesArray([...newEl[field], prevB.name, nextB.name]),
  };
  const elements: any =
    nextB.type === "BEAM"
      ? insertBeam(
          Object.values({
            ...newElements,
            [prevB.name]: prevB,
            [_newEl.name]: _newEl,
          }),
          nextB as TBeamOF
        )
      : Object.values({
          ...newElements,
          [prevB.name]: prevB,
          [_newEl.name]: _newEl,
        });
  // const indexC = getIndexName(Object.values(elements), "C");
  // const nextC: TColumnOF = {
  //   ...newEl,
  //   name: `C${indexC}`,
  //   startPos: crossing.clone(),
  //   prev: newEl.name,
  //   next: newEl.next,
  //   startConnected: [prevB.name, nextB.name],
  //   id: indexC,
  //   uiId: undefined,
  // };
  // return convertElementsArrayToObject(insertColumn(elements, nextC));
  return convertElementsArrayToObject(elements);
}

// COLUMN - EQUALS (X or Z) - EQUALS Y
function CEE(newElements: any, el: TBeamElement, newEl: TColumnOF) {
  const connectedC =
    el.startPos.y === newEl.startPos.y ? "startConnected" : "endConnected";
  const connectedB =
    el.startPos.z === newEl.startPos.z ? "startConnected" : "endConnected";
  return {
    ...newElements,
    [el.name]: {
      ...el,
      [connectedB]: getUnicuesArray([...el[connectedB], newEl.name]),
    },
    [newEl.name]: {
      ...newEl,
      [connectedC]: getUnicuesArray([...newEl[connectedC], el.name]),
    },
  };
}

// COLUMN - EQUALS (X or Z) - BETWEEN Y
function CEB(newElements: any, el: TBeamElement, newEl: TColumnOF) {
  const connectedB =
    el.startPos.z === newEl.startPos.z ? "startConnected" : "endConnected";
  const _newEl = {
    ...newEl,
    connected: getUnicuesArray([...newEl.connected, el.name]),
  };
  const elements: any = {
    ...newElements,
    [el.name]: {
      ...el,
      [connectedB]: getUnicuesArray([...el[connectedB], _newEl.name]),
    },
    [_newEl.name]: _newEl,
  };
  return convertElementsArrayToObject(Object.values(elements));
}

// END - COLUMN ----------------------------------------------------------------------------------

/**
 * @param item changed cantilever of Open Frame
 * @param elements beam elements which converted to object
 * @returns changed cantilever and beam elements which connected to end node
 **/
function changeConnectedToCantilever(item: TCantileverOF, elements: any) {
  let changedElements = {
    ...elements,
    [item.name]: item,
  };
  item.endConnected.forEach((scItem) => {
    const connected = changedElements[scItem] as TBeamElement;
    if (connected.type === "COLUMN") {
      const changed: TColumnOF = {
        ...connected,
        pos: item.endPos.clone(),
        startPos: item.endPos.clone(),
        endPos: item.endPos.clone().setY(connected.endPos.y),
      } as TColumnOF;
      changedElements = changeConnectedToColumn(changed, changedElements);
    } else {
      const pos = connected.startPos.equals(elements[item.name].endPos)
        ? "startPos"
        : "endPos";
      changedElements = {
        ...changedElements,
        [connected.name]: {
          ...connected,
          [pos]: item.endPos.clone(),
        },
      };
    }
  });
  return changedElements;
}

// START - SPLICE FLANGE -------------------------------------------------------------------------

export function insertSpliceFlange(
  ui: OpenFrameUI,
  model: TOpenFrame,
  sf: TCSpliceFlangeOF | TRSpliceFlangeOF,
  type: "circularSF" | "rectangularSF"
) {
  let changedUI = { ...ui };
  const elementsMap = getMapOfBeamElements(model);
  let column = elementsMap.get(sf.column);
  if (!column) return { elements: {}, changedUI };
  let checked = checkRange(
    sf.elevation,
    column.startPos.y,
    column.endPos.y,
    false,
    true
  );
  if (!checked) {
    while (column) {
      column = model.columns.find((c) => column!.endConnected.includes(c.name));
      if (!column) return { elements: {}, changedUI };
      checked = checkRange(
        sf.elevation,
        column.startPos.y,
        column.endPos.y,
        false,
        true
      );
      if (checked) break;
    }
  }
  if (!checked) return { elements: {}, changedUI };
  const field = type === "rectangularSF" ? "rectangular" : "circular";
  changedUI = {
    ...changedUI,
    spliceFlanges: {
      ...changedUI.spliceFlanges,
      [field]: [...changedUI.spliceFlanges[field], sf],
    },
  };
  const next = model.columns.find((c) => column!.endConnected.includes(c.name));
  if (column.endPos.y === sf.elevation && next) {
    elementsMap.set(column.name, {
      ...column,
      endConnected: [...column.endConnected, sf.name],
    });
    elementsMap.set(next.name, {
      ...next,
      startConnected: [...next.startConnected, sf.name],
    });
    return {
      elements: {
        ...getSeparetedElementsOfModel(Array.from(elementsMap.values())),
        [type]: [...model[type], sf],
      },
      changedUI,
    };
  } else {
    const secondColumn = column.prev
      ? elementsMap.get(column.prev)
      : column.next
      ? elementsMap.get(column.next)
      : undefined;
    const newId = getNextId(model.columns);
    const newColumn: TColumnOF = {
      ...(column as TColumnOF),
      id: newId,
      name: `C${getIndexName(model.columns, "C")}`,
      prev: column.name,
      next: column.next,
      startPos: column.startPos.clone().setY(sf.elevation),
      startConnected: [sf.name],
      connected: [],
      profile: !column.prev
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
    };
    column = {
      ...column,
      endPos: newColumn.startPos.clone(),
      connected: [],
      endConnected: [sf.name],
      next: newColumn.name,
      profile: column.prev
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
    };
    elementsMap.set(column.name, column);
    elementsMap.set(newColumn.name, newColumn);
    updateConnectionsFromMap(elementsMap, column);
    updateConnectionsFromMap(elementsMap, newColumn);

    const nextColumn = elementsMap.get(newColumn.name);
    if (nextColumn) {
      for (const conn of [
        ...nextColumn.connected,
        ...nextColumn.endConnected,
      ]) {
        const element = elementsMap.get(conn);
        if (!element) continue;
        switch (element.type) {
          case "BEAM":
            {
              const item = element as TBeamOF;
              switch (item.secondType) {
                case "CtoB":
                  changedUI = {
                    ...changedUI,
                    additionalBeams: {
                      ...changedUI.additionalBeams,
                      columnToBeam: changedUI.additionalBeams.columnToBeam.map(
                        (el) =>
                          el.id === element.uiId && el.column === column!.name
                            ? { ...el, column: nextColumn!.name }
                            : el
                      ),
                    },
                  };
                  break;
                case "CtoC":
                  changedUI = {
                    ...changedUI,
                    additionalBeams: {
                      ...changedUI.additionalBeams,
                      columnToColumn: changedUI.additionalBeams.columnToColumn.map(
                        (el) =>
                          el.id === element.uiId && el.column === column!.name
                            ? { ...el, column: nextColumn!.name }
                            : el
                      ),
                    },
                  };
              }
            }
            break;
          case "CANTILEVER":
            changedUI = {
              ...changedUI,
              additionalBeams: {
                ...changedUI.additionalBeams,
                cantilever: changedUI.additionalBeams.cantilever.map((el) =>
                  el.id === element.uiId && el.column === column!.name
                    ? { ...el, column: nextColumn!.name }
                    : el
                ),
              },
            };
            break;
          case "KNEE-BRACING":
            changedUI = {
              ...changedUI,
              additionalBeams: {
                ...changedUI.additionalBeams,
                kneeBracings: changedUI.additionalBeams.kneeBracings.map((el) =>
                  el.id === element.uiId && el.column === column!.name
                    ? { ...el, column: nextColumn!.name }
                    : el
                ),
              },
            };
            break;
          case "VERTICAL-BRACING":
            changedUI = {
              ...changedUI,
              additionalBeams: {
                ...changedUI.additionalBeams,
                verticalBracings: changedUI.additionalBeams.verticalBracings.map(
                  (el) =>
                    el.id === element.uiId
                      ? el.fromColumn === column!.name
                        ? { ...el, fromColumn: nextColumn!.name }
                        : el.toColumn === column!.name
                        ? { ...el, toColumn: nextColumn!.name }
                        : el
                      : el
                ),
              },
            };
        }
      }
    }
    return {
      elements: {
        ...getSeparetedElementsOfModel(mapToArray(elementsMap)),
        [type]: [...model[type], sf],
      },
      changedUI,
    };
  }
}

export function removeSpliceFlange(
  model: TOpenFrame,
  sf: TCSpliceFlangeOF | TRSpliceFlangeOF,
  type: "circularSF" | "rectangularSF",
  ui: OpenFrameUI,
  onWarning?: (msg: string) => any,
  onError?: (msg: string) => any
) {
  let changedUI = { ...ui };
  const elementsMap = getMapOfBeamElements(model);
  let column = elementsMap.get(sf.column);
  if (!column) {
    onError &&
      onError(`Splice Flange Removing: Column "${sf.column}" not found!`);
    return { elements: {}, changedUI };
  }
  const next = column.next
    ? (elementsMap.get(column.next) as TColumnOF)
    : undefined;
  column = {
    ...column,
    endConnected: column.endConnected.filter((conn) => conn !== sf.name),
  };
  if (next) {
    if (next.secondType === "GENERAL") {
      column = {
        ...column,
        next: next.next,
        endPos: next.endPos.clone(),
        connected: getUnicuesArray([
          ...column.connected,
          ...column.endConnected,
          ...next.startConnected,
          ...next.connected,
        ]),
        endConnected: next.endConnected,
        releases: {
          ...column.releases,
          mx2: next.releases?.mx2,
          my2: next.releases?.my2,
          mz2: next.releases?.mz2,
          fx2: next.releases?.fx2,
          fy2: next.releases?.fy2,
          fz2: next.releases?.fz2,
        },
      };
      for (const conn of [
        ...next.startConnected,
        ...next.connected,
        ...next.endConnected,
      ]) {
        const element = elementsMap.get(conn);
        if (!element) continue;
        const isStart = roundVectorM(column.endPos.clone()).equals(
          roundVectorM(element.startPos.clone())
        );
        const isEnd = roundVectorM(column.endPos.clone()).equals(
          roundVectorM(element.endPos.clone())
        );
        if (isStart) {
          const startConnected = element.startConnected.filter(
            (sc) => sc !== next.name
          );
          elementsMap.set(element.name, {
            ...element,
            startConnected: getUnicuesArray([...startConnected, column.name]),
          });
        } else if (isEnd) {
          const endConnected = element.endConnected.filter(
            (ec) => ec !== next.name
          );
          elementsMap.set(element.name, {
            ...element,
            endConnected: getUnicuesArray([...endConnected, column.name]),
          });
        }

        switch (element.type) {
          case "BEAM":
            {
              const item = element as TBeamOF;
              switch (item.secondType) {
                case "CtoB":
                  changedUI = {
                    ...changedUI,
                    additionalBeams: {
                      ...changedUI.additionalBeams,
                      columnToBeam: changedUI.additionalBeams.columnToBeam.map(
                        (el) =>
                          el.id === element.uiId && el.column === next.name
                            ? { ...el, column: column!.name }
                            : el
                      ),
                    },
                  };
                  break;
                case "CtoC":
                  changedUI = {
                    ...changedUI,
                    additionalBeams: {
                      ...changedUI.additionalBeams,
                      columnToColumn: changedUI.additionalBeams.columnToColumn.map(
                        (el) =>
                          el.id === element.uiId && el.column === next.name
                            ? { ...el, column: column!.name }
                            : el
                      ),
                    },
                  };
              }
            }
            break;
          case "CANTILEVER":
            changedUI = {
              ...changedUI,
              additionalBeams: {
                ...changedUI.additionalBeams,
                cantilever: changedUI.additionalBeams.cantilever.map((el) =>
                  el.id === element.uiId && el.column === next.name
                    ? { ...el, column: column!.name }
                    : el
                ),
              },
            };
            break;
          case "KNEE-BRACING":
            changedUI = {
              ...changedUI,
              additionalBeams: {
                ...changedUI.additionalBeams,
                kneeBracings: changedUI.additionalBeams.kneeBracings.map((el) =>
                  el.id === element.uiId && el.column === next.name
                    ? { ...el, column: column!.name }
                    : el
                ),
              },
            };
            break;
          case "VERTICAL-BRACING":
            changedUI = {
              ...changedUI,
              additionalBeams: {
                ...changedUI.additionalBeams,
                verticalBracings: changedUI.additionalBeams.verticalBracings.map(
                  (el) =>
                    el.id === element.uiId
                      ? el.fromColumn === next.name
                        ? { ...el, fromColumn: column!.name }
                        : el.toColumn === next.name
                        ? { ...el, toColumn: column!.name }
                        : el
                      : el
                ),
              },
            };
        }

        changedUI = {
          ...changedUI,
          spliceFlanges: {
            ...changedUI.spliceFlanges,
            rectangular: changedUI.spliceFlanges.rectangular.map((r) =>
              r.column === next.name ? { ...r, column: column!.name } : r
            ),
          },
        };
      }
      elementsMap.set(column.name, column);
      elementsMap.delete(next.name);

      return {
        elements: {
          ...getSeparetedElementsOfModel(Array.from(elementsMap.values())),
          [type]: model[type]
            // @ts-ignore
            .filter((item) => item.id !== sf.id)
            .map((item: TRSpliceFlangeOF) =>
              item.column === next.name
                ? { ...item, column: column!.name }
                : item
            ),
        },
        changedUI,
      };
    } else {
      elementsMap.set(next.name, {
        ...next,
        startConnected: next.startConnected.filter((conn) => conn !== sf.name),
      });
    }
  } else elementsMap.set(column.name, column);
  return {
    elements: {
      ...getSeparetedElementsOfModel(Array.from(elementsMap.values())),
      // @ts-ignore
      [type]: model[type].filter((item) => item.id !== sf.id),
    },
    changedUI,
  };
}

// END - SPLICE FLANGE ---------------------------------------------------------------------------

export function mapToArray(map: Map<string, TBeamElement>) {
  return Array.from(map.values());
}

function checkConnectivity(
  parent: TElementType,
  connecting: TElementType,
  type: "SIDE" | "MIDDLE"
) {
  const connections = {
    SIDE: {
      COLUMN: [
        "COLUMN",
        "BEAM",
        "CANTILEVER",
        "KNEE-BRACING",
        "VERTICAL-BRACING",
      ],
      BEAM: [
        "COLUMN",
        "BEAM",
        "CANTILEVER",
        "KNEE-BRACING",
        "VERTICAL-BRACING",
        "HORIZONTAL-BRACING",
        "STAIRCASE",
      ],
      CANTILEVER: [
        "COLUMN",
        "BEAM",
        "KNEE-BRACING",
        "HORIZONTAL-BRACING",
        "STAIRCASE",
      ],
      "KNEE-BRACING": ["COLUMN", "BEAM", "CANTILEVER"],
      "VERTICAL-BRACING": ["COLUMN", "BEAM"],
      "HORIZONTAL-BRACING": ["BEAM", "CANTILEVER", "STAIRCASE"],
      STAIRCASE: ["BEAM", "HORIZONTAL-BRACING", "CANTILEVER"],
    },
    MIDDLE: {
      COLUMN: ["BEAM", "CANTILEVER", "KNEE-BRACING", "VERTICAL-BRACING"],
      BEAM: [
        "COLUMN",
        "BEAM",
        "CANTILEVER",
        "KNEE-BRACING",
        "VERTICAL-BRACING",
        "HORIZONTAL-BRACING",
        "STAIRCASE",
      ],
      CANTILEVER: [
        "COLUMN",
        "BEAM",
        "KNEE-BRACING",
        "HORIZONTAL-BRACING",
        "STAIRCASE",
      ],
      "KNEE-BRACING": [],
      "VERTICAL-BRACING": [],
      "HORIZONTAL-BRACING": [],
      STAIRCASE: ["HORIZONTAL-BRACING"],
    },
  };
  // @ts-ignore
  return connections[type][parent].includes(connecting);
}

function checkByDistances(start: Vector3, end: Vector3, point: Vector3) {
  const distance = roundM(start.distanceTo(end));
  const distance1 = start.distanceTo(point);
  const distance2 = end.distanceTo(point);
  const distance3 = roundM(distance1 + distance2);
  return distance === distance3;
}

export function mergeBeams(model: TOpenFrame) {
  const map = getMapOfBeamElements(model);
  const beams = mapToArray(map).filter(
    (el) => el.type === "BEAM" && (el as TBeamOF).secondType === "GENERAL"
  );
  for (const beam of beams) {
    const beamElement = map.get(beam.name);
    if (!beamElement) continue;
    if (!beamElement.startConnected.length && beamElement.prev) {
      const prev = map.get(beamElement.prev);
      if (!prev) continue;
      removeConnectionsFromMap(map, beamElement, true, true);
      const newChanged: TBeamElement = {
        ...prev,
        next: beamElement.next,
        endPos: beamElement.endPos,
        endConnected: [],
        releases: {
          ...prev.releases,
          fx2: beamElement.releases?.fx2,
          fy2: beamElement.releases?.fy2,
          fz2: beamElement.releases?.fz2,
          mx2: beamElement.releases?.mx2,
          my2: beamElement.releases?.my2,
          mz2: beamElement.releases?.mz2,
        },
      };
      updateConnectionsFromMap(map, newChanged);
    } else if (!beamElement.endConnected.length && beamElement.next) {
      const next = map.get(beamElement.next);
      if (!next) continue;
      removeConnectionsFromMap(map, next, true, true);
      const newChanged: TBeamElement = {
        ...beamElement,
        next: next.next,
        endPos: next.endPos,
        endConnected: [],
        releases: {
          ...beamElement.releases,
          fx2: next.releases?.fx2,
          fy2: next.releases?.fy2,
          fz2: next.releases?.fz2,
          mx2: next.releases?.mx2,
          my2: next.releases?.my2,
          mz2: next.releases?.mz2,
        },
      };
      updateConnectionsFromMap(map, newChanged);
    }
  }
  return {
    ...model,
    ...getSeparetedElementsOfModel(mapToArray(map)),
  };
}

export function updateConnectionsFromMap(
  map: Map<string, TBeamElement>,
  item: TBeamElement,
  onWarning?: (a: string, b: string) => any
) {
  let updated = item;
  const rStartU = roundVectorM(updated.startPos.clone());
  const rEndU = roundVectorM(updated.endPos.clone());
  for (const element of mapToArray(map)) {
    if (element.name === item.name) continue;
    const rStartE = roundVectorM(element.startPos.clone());
    const rEndE = roundVectorM(element.endPos.clone());
    const toSide = checkConnectivity(element.type, updated.type, "SIDE");
    const toMiddleE = checkConnectivity(element.type, updated.type, "MIDDLE");
    const toMiddleU = checkConnectivity(updated.type, element.type, "MIDDLE");
    if (toSide) {
      // start of element === start of updated
      if (toSide && rStartE.equals(rStartU)) {
        map.set(element.name, {
          ...element,
          startConnected: getUnicuesArray([
            ...element.startConnected,
            updated.name,
          ]),
        });
        updated = {
          ...updated,
          startConnected: getUnicuesArray([
            ...updated.startConnected,
            element.name,
          ]),
        };
        continue;
      }
      // start of element === end of updated
      if (toSide && rStartE.equals(rEndU)) {
        // if (
        //   (element.type === "BEAM" || element.type === "CANTILEVER") &&
        //   (updated.type === "BEAM" || updated.type === "CANTILEVER")
        // ) {
        //   if (rEndE.x === rStartU.x || rEndE.z === rStartU.z) continue;
        // }
        map.set(element.name, {
          ...element,
          startConnected: getUnicuesArray([
            ...element.startConnected,
            updated.name,
          ]),
        });
        updated = {
          ...updated,
          endConnected: getUnicuesArray([
            ...updated.endConnected,
            element.name,
          ]),
        };
        continue;
      }
      // end of element === start of updated
      if (toSide && rEndE.equals(rStartU)) {
        // if (
        //   (element.type === "BEAM" || element.type === "CANTILEVER") &&
        //   (updated.type === "BEAM" || updated.type === "CANTILEVER")
        // ) {
        //   if (rEndE.x === rStartU.x || rEndE.z === rStartU.z) continue;
        // }
        map.set(element.name, {
          ...element,
          endConnected: getUnicuesArray([
            ...element.endConnected,
            updated.name,
          ]),
        });
        updated = {
          ...updated,
          startConnected: getUnicuesArray([
            ...updated.startConnected,
            element.name,
          ]),
        };
        continue;
      }
      // end of element === end of updated
      if (toSide && rEndE.equals(rEndU)) {
        map.set(element.name, {
          ...element,
          endConnected: getUnicuesArray([
            ...element.endConnected,
            updated.name,
          ]),
        });
        updated = {
          ...updated,
          endConnected: getUnicuesArray([
            ...updated.endConnected,
            element.name,
          ]),
        };
        continue;
      }
    }
    if (toMiddleE) {
      // middle of element === start of updated
      if (
        hardCheckRange(rStartU.x, rStartE.x, rEndE.x) &&
        hardCheckRange(rStartU.y, rStartE.y, rEndE.y) &&
        hardCheckRange(rStartU.z, rStartE.z, rEndE.z) &&
        checkByDistances(rStartE, rEndE, rStartU)
      ) {
        map.set(element.name, {
          ...element,
          connected: getUnicuesArray([...element.connected, updated.name]),
        });
        updated = {
          ...updated,
          startConnected: getUnicuesArray([
            ...updated.startConnected,
            element.name,
          ]),
        };
        continue;
      }
      // middle of element === end of updated
      if (
        hardCheckRange(rEndU.x, rStartE.x, rEndE.x) &&
        hardCheckRange(rEndU.y, rStartE.y, rEndE.y) &&
        hardCheckRange(rEndU.z, rStartE.z, rEndE.z) &&
        checkByDistances(rStartE, rEndE, rEndU)
      ) {
        map.set(element.name, {
          ...element,
          connected: getUnicuesArray([...element.connected, updated.name]),
        });
        updated = {
          ...updated,
          endConnected: getUnicuesArray([
            ...updated.endConnected,
            element.name,
          ]),
        };
        continue;
      }
    }
    if (toMiddleU) {
      // start of element === middle of updated
      if (
        hardCheckRange(rStartE.x, rStartU.x, rEndU.x) &&
        hardCheckRange(rStartE.y, rStartU.y, rEndU.y) &&
        hardCheckRange(rStartE.z, rStartU.z, rEndU.z) &&
        checkByDistances(rStartU, rEndU, rStartE)
      ) {
        map.set(element.name, {
          ...element,
          startConnected: getUnicuesArray([
            ...element.startConnected,
            updated.name,
          ]),
        });
        updated = {
          ...updated,
          connected: getUnicuesArray([...updated.connected, element.name]),
        };
        continue;
      }
      // end of element === middle of updated
      if (
        hardCheckRange(rEndE.x, rStartU.x, rEndU.x) &&
        hardCheckRange(rEndE.y, rStartU.y, rEndU.y) &&
        hardCheckRange(rEndE.z, rStartU.z, rEndU.z) &&
        checkByDistances(rStartU, rEndU, rEndE)
      ) {
        map.set(element.name, {
          ...element,
          endConnected: getUnicuesArray([
            ...element.endConnected,
            updated.name,
          ]),
        });
        updated = {
          ...updated,
          connected: getUnicuesArray([...updated.connected, element.name]),
        };
        continue;
      }
    }
  }
  map.set(updated.name, updated);
}

export function updateConnections(
  model: TOpenFrame,
  item: TBeamElement,
  onWarning?: (a: string, b: string) => any
): TOpenFrame {
  const map = getMapOfBeamElements(model);
  updateConnectionsFromMap(map, item, onWarning);
  return {
    ...model,
    ...getSeparetedElementsOfModel(mapToArray(map)),
  };
}

function removeConnectionsFromElement(
  item: TBeamElement,
  removable: string
): TBeamElement {
  const changed = {
    ...item,
    startConnected: item.startConnected.filter((conn) => conn !== removable),
    connected: item.connected.filter((conn) => conn !== removable),
    endConnected: item.endConnected.filter((conn) => conn !== removable),
  };
  return changed;
}

function checkColumnElevation(
  map: Map<string, TBeamElement>,
  item: TBeamElement
) {
  if (!item.endConnected.length) {
    if (item.connected.length) {
      let max = item.startPos.y;
      for (const connected of item.connected) {
        const element = map.get(connected);
        if (element) {
          if (element.startConnected.includes(item.name)) {
            max = Math.max(max, element.startPos.y);
          } else if (element.endConnected.includes(item.name)) {
            max = Math.max(max, element.endPos.y);
          }
        }
      }
      removeConnectionsFromMap(map, item, false, true);
      updateConnectionsFromMap(map, { ...item, endPos: item.endPos.setY(max) });
    } else {
      removeConnectionsFromMap(map, item);
    }
  } else {
    map.set(item.name, item);
  }
}

export function removeConnectionsFromMap(
  map: Map<string, TBeamElement>,
  item: TBeamElement,
  isDeleting: boolean = true,
  isSoft?: boolean
) {
  if (isDeleting) {
    map.delete(item.name);
  } else {
    map.set(item.name, {
      ...item,
      startConnected: [],
      connected: [],
      endConnected: [],
    });
  }
  if (item.prev) {
    const prev = map.get(item.prev);
    if (prev) {
      map.set(prev.name, { ...prev, next: undefined });
    }
  }
  if (item.next) {
    const next = map.get(item.next);
    if (next) {
      map.set(next.name, { ...next, prev: undefined });
    }
  }
  for (const conn of [
    ...(item.startConnected ?? []),
    ...(item.connected ?? []),
    ...(item.endConnected ?? []),
  ]) {
    const connected = map.get(conn);
    if (!connected) continue;
    const changed = removeConnectionsFromElement(connected, item.name);
    if (isSoft) {
      map.set(conn, changed);
    } else {
      map.set(conn, changed);

      if (
        changed.type === "COLUMN" &&
        (changed as TColumnOF).secondType === "GENERAL"
      ) {
        checkColumnElevation(map, changed);
      }
    }
  }
  return map;
}

export function removeConnections(
  model: TOpenFrame,
  item: TBeamElement,
  isDeleting: boolean = true
): TOpenFrame {
  const map = getMapOfBeamElements(model);
  removeConnectionsFromMap(map, item, isDeleting);
  return {
    ...model,
    ...getSeparetedElementsOfModel(mapToArray(map)),
  };
}

function getField(removing: TBeamElement) {
  switch (removing.type) {
    case "COLUMN":
      return "columns";
    case "BEAM":
      if ((removing as TBeamOF).secondType === "BtoB") return "beamToBeam";
      else if ((removing as TBeamOF).secondType === "CtoB")
        return "columnToBeam";
      else if ((removing as TBeamOF).secondType === "CtoC")
        return "columnToColumn";
      break;
    case "CANTILEVER":
      return "cantilever";
    case "VERTICAL-BRACING":
      return "verticalBracings";
    case "HORIZONTAL-BRACING":
      return "planBracings";
    case "KNEE-BRACING":
      return "kneeBracings";
    case "STAIRCASE":
      return "staircases";
    default:
      return;
  }
}

export function isAdditionalElement(
  element: TBeamElement,
  connected: string,
  ui: OpenFrameUI
) {
  let isAdditional = false;
  switch (element.type) {
    case "BEAM":
      {
        const item = element as TBeamOF;
        switch (item.secondType) {
          case "BtoB":
            isAdditional = ui.additionalBeams.beamToBeam.some(
              (el) =>
                el.id === element.uiId &&
                (el.from === connected || el.to === connected)
            );
            break;
          case "CtoB":
            isAdditional = ui.additionalBeams.columnToBeam.some(
              (el) =>
                el.id === element.uiId &&
                (el.beam === connected || el.column === connected)
            );
            break;
          case "CtoC":
            isAdditional = ui.additionalBeams.columnToColumn.some(
              (el) => el.id === element.uiId && el.column === connected
            );
        }
      }
      break;
    case "CANTILEVER":
      isAdditional = ui.additionalBeams.cantilever.some(
        (el) => el.id === element.uiId && el.column === connected
      );
      break;
    case "COLUMN":
      {
        const item = element as TColumnOF;
        if (item.type) {
          isAdditional = ui.additionalBeams.columns.some(
            (el) =>
              el.id === element.uiId &&
              (el.lowerBeam === connected || el.upperBeam === connected)
          );
        }
      }
      break;
    case "HORIZONTAL-BRACING":
      isAdditional = ui.additionalBeams.planBracings.some(
        (el) =>
          el.id === element.uiId &&
          (el.fromBeam === connected || el.toBeam === connected)
      );
      break;
    case "KNEE-BRACING":
      isAdditional = ui.additionalBeams.kneeBracings.some(
        (el) =>
          el.id === element.uiId &&
          (el.beam === connected || el.column === connected)
      );
      break;
    case "VERTICAL-BRACING":
      isAdditional = ui.additionalBeams.verticalBracings.some(
        (el) =>
          el.id === element.uiId &&
          (el.fromBeam === connected ||
            el.toBeam === connected ||
            el.fromColumn === connected ||
            el.toColumn === connected)
      );
      break;
    case "STAIRCASE":
      isAdditional = ui.additionalBeams.staircases.some(
        (el) =>
          el.id === element.uiId &&
          (el.from === connected || el.to === connected)
      );
      break;
  }

  // switch (element.type) {
  //   case "COLUMN":
  //     if ((element as TColumnOF).secondType !== "GENERAL") isAdditional = true;
  //     break;
  //   case "BEAM":
  //     if ((element as TBeamOF).secondType !== "GENERAL") isAdditional = true;
  //     break;
  //   default:
  //     isAdditional = true;
  // }
  if (
    isAdditional &&
    [...element.startConnected, ...element.endConnected].includes(connected)
  ) {
    return element.name;
  }
  return undefined;
}

export function getAdditionalElements(
  map: Map<string, TBeamElement>,
  element: TBeamElement,
  ui: OpenFrameUI
) {
  const elements: string[] = [];
  if (element.startConnected)
    for (const connected of element.startConnected) {
      const connectedElement = map.get(connected);
      if (!connectedElement) continue;
      const additional = isAdditionalElement(
        connectedElement,
        element.name,
        ui
      );
      if (additional) elements.push(additional);
    }
  if (element.connected)
    for (const connected of element.connected) {
      const connectedElement = map.get(connected);
      if (!connectedElement) continue;
      const additional = isAdditionalElement(
        connectedElement,
        element.name,
        ui
      );
      if (additional) elements.push(additional);
    }
  if (element.endConnected)
    for (const connected of element.endConnected) {
      const connectedElement = map.get(connected);
      if (!connectedElement) continue;
      const additional = isAdditionalElement(
        connectedElement,
        element.name,
        ui
      );
      if (additional) elements.push(additional);
    }
  return elements;
}

export function removeElementFromUI(
  dispatch: Dispatch,
  ui: OpenFrameUI,
  field: string,
  removing: TBeamElement,
  model: TOpenFrame
) {
  const changed: OpenFrameUI = {
    ...ui,
    additionalBeams: {
      ...ui.additionalBeams,
      //@ts-ignore
      [field]: ui.additionalBeams[field].filter(
        (item: any) => item.id !== removing.uiId
      ),
    },
    loadingsUI: {
      ...ui.loadingsUI,
      deadLoadUI: {
        ...ui.loadingsUI.deadLoadUI,
        loads: ui.loadingsUI.deadLoadUI.loads.map((load) => {
          if (load.model === model.name && load.element === removing.name) {
            dispatch(
              addEventAction(
                `Dead Loads: "${removing.name}" has been removed from the "Element No." field!`,
                "warning"
              )
            );
            return { ...load, element: undefined };
          }
          return load;
        }),
      },
      liveLoadUI: {
        ...ui.loadingsUI.liveLoadUI,
        loads: ui.loadingsUI.liveLoadUI.loads.map((load) => {
          if (load.model === model.name && load.element === removing.name) {
            dispatch(
              addEventAction(
                `Live Loads: "${removing.name}" has been removed from the "Element No." field!`,
                "warning"
              )
            );
            return { ...load, element: undefined };
          }
          return load;
        }),
      },
      pipingLoadsUI: {
        directLoads: ui.loadingsUI.pipingLoadsUI.directLoads.map((load) => {
          if (load.model === model.name && load.element === removing.name) {
            dispatch(
              addEventAction(
                `Direct Loads: "${removing.name}" has been removed from the "Element No." field!`,
                "warning"
              )
            );
            return { ...load, element: undefined };
          }
          return load;
        }),
        blanketLoads: ui.loadingsUI.pipingLoadsUI.blanketLoads.map((load) => {
          if (load.model !== model.name) return load;
          let changed = { ...load };
          if (load.from === removing.name) {
            dispatch(
              addEventAction(
                `Blanket Loads: "${removing.name}" has been removed from the "From Beam" field!`,
                "warning"
              )
            );
            changed = { ...load, from: undefined };
          }
          if (load.to === removing.name) {
            dispatch(
              addEventAction(
                `Blanket Loads: "${removing.name}" has been removed from the "To Beam" field!`,
                "warning"
              )
            );
            changed = { ...load, to: undefined };
          }
          return changed;
        }),
      },
      equipmentLoadUI: ui.loadingsUI.equipmentLoadUI.map((load) => {
        if (load.model === model.name && load.element === removing.name) {
          dispatch(
            addEventAction(
              `Equipment Loads: "${removing.name}" has been removed from the "Element No." field!`,
              "warning"
            )
          );
          return { ...load, element: undefined };
        }
        return load;
      }),
      windLoadUI: {
        ...ui.loadingsUI.windLoadUI,
        loads: ui.loadingsUI.windLoadUI.loads.map((load) => {
          if (load.model === model.name && load.element === removing.name) {
            dispatch(
              addEventAction(
                `Wind Loads: "${removing.name}" has been removed from the "Element No." field!`,
                "warning"
              )
            );
            return { ...load, element: undefined };
          }
          return load;
        }),
      },
    },
  };
  return changed;
}

export function removeElementsFromOpenFrame(
  dispatch: Dispatch,
  ui: OpenFrameUI,
  project: Project,
  elements: ModelItem[]
) {
  if (!elements.length) {
    dispatch(changeProjectAction(project));
    dispatch(changeOFUIAction(ui));
    return;
  }
  let changedProject = { ...project };
  let changedUI = { ...ui };
  const element = elements.shift();
  if (!element) {
    removeElementsFromOpenFrame(dispatch, changedUI, changedProject, elements);
    return;
  }
  const model = getElementByName(
    changedProject.models as TOpenFrame[],
    element.model
  );
  if (!model) {
    removeElementsFromOpenFrame(dispatch, changedUI, changedProject, elements);
    return;
  }
  const map = getMapOfBeamElements(model);
  const removing = map.get(element.name);
  if (!removing) {
    removeElementsFromOpenFrame(dispatch, changedUI, changedProject, elements);
    return;
  }
  const additionalElements = getAdditionalElements(map, removing, ui);
  if (additionalElements.length) {
    dispatch(
      addEventAction(
        `Deleting Elements: Element "${
          removing.name
        }" has additional elements like ${additionalElements.join(", ")}!`,
        "danger"
      )
    );
    removeElementsFromOpenFrame(dispatch, changedUI, changedProject, elements);
    return;
  }
  if (
    removing.type === "COLUMN" &&
    (removing as TColumnOF).secondType === "GENERAL"
  ) {
    const beamsToRemoving: string[] = [];
    for (const connected of [
      ...removing.startConnected,
      ...removing.connected,
      ...removing.endConnected,
    ]) {
      const connectedElement = map.get(connected);
      if (connectedElement && connectedElement.type === "BEAM") {
        const beam = connectedElement as TBeamOF;
        if (!beam.releases) continue;
        const toStart = beam.startConnected.includes(removing.name);
        if (
          beam.releases[toStart ? "fx1" : "fx2"] ||
          beam.releases[toStart ? "fy1" : "fy2"] ||
          beam.releases[toStart ? "fz1" : "fz2"] ||
          beam.releases[toStart ? "mx1" : "mx2"] ||
          beam.releases[toStart ? "my1" : "my2"] ||
          beam.releases[toStart ? "mz1" : "mz2"]
        ) {
          beamsToRemoving.push(beam.name);
        }
      }
    }
    if (beamsToRemoving.length) {
      dispatch(
        secondConfirmAction({
          message: `Deleting Column ${
            element.name
          } would remove Beam ${beamsToRemoving.join(
            ", "
          )}. Do you want to continue?`,
          onConfirm: () => {
            let changedUI: OpenFrameUI = { ...ui };
            for (const beam of beamsToRemoving) {
              const beamElement = map.get(beam);
              if (!beamElement) continue;
              removeConnectionsFromMap(map, beamElement);
              const field = getField(beamElement);
              if (field) {
                changedUI = removeElementFromUI(
                  dispatch,
                  changedUI,
                  field,
                  beamElement,
                  model
                );
              }
            }
            removeConnectionsFromMap(map, removing);
            const changed = {
              ...model,
              ...getSeparetedElementsOfModel(mapToArray(map)),
            };
            const field = getField(removing);
            if (field) {
              changedUI = removeElementFromUI(
                dispatch,
                changedUI,
                field,
                removing,
                model
              );
              dispatch(changeOFUIAction(changedUI));
            }
            changedProject = {
              ...changedProject,
              models: changedProject.models.map((modelItem) =>
                modelItem.name === changed.name ? changed : modelItem
              ),
            };
            removeElementsFromOpenFrame(
              dispatch,
              changedUI,
              changedProject,
              elements
            );
          },
          onCancel: () => {
            removeElementsFromOpenFrame(
              dispatch,
              changedUI,
              changedProject,
              elements
            );
          },
        })
      );
      return;
    }
  }
  removeConnectionsFromMap(map, removing);
  const changedModel = {
    ...model,
    ...getSeparetedElementsOfModel(mapToArray(map)),
  };
  const field = getField(removing);
  if (field) {
    changedUI = removeElementFromUI(
      dispatch,
      changedUI,
      field,
      removing,
      model
    );
  }
  changedProject = {
    ...changedProject,
    models: changedProject.models.map((modelItem) =>
      modelItem.name === changedModel.name ? changedModel : modelItem
    ),
  };
  removeElementsFromOpenFrame(dispatch, changedUI, changedProject, elements);
}

export function removeFromOpenFrame(
  dispatch: Dispatch,
  model: TOpenFrame,
  ui: OpenFrameUI,
  element: string
) {
  const elements = getMapOfBeamElements(model);
  const removing = elements.get(element);
  if (!removing) return;
  const additionalElements = ![
    "KNEE-BRACING",
    "VERTICAL-BRACING",
    "HORIZONTAL-BRACING",
  ].includes(removing.type)
    ? getAdditionalElements(elements, removing, ui)
    : [];
  if (additionalElements.length) {
    dispatch(
      addEventAction(
        `Deleting Element: Element "${
          removing.name
        }" has additional elements like ${additionalElements.join(", ")}!`,
        "danger"
      )
    );
    return;
  }
  if (
    removing.type === "COLUMN" &&
    (removing as TColumnOF).secondType === "GENERAL"
  ) {
    const beamsToRemoving: string[] = [];
    for (const connected of [
      ...removing.startConnected,
      ...removing.connected,
      ...removing.endConnected,
    ]) {
      const connectedElement = elements.get(connected);
      if (connectedElement && connectedElement.type === "BEAM") {
        const beam = connectedElement as TBeamOF;
        if (!beam.releases) continue;
        const toStart = beam.startConnected.includes(removing.name);
        if (
          beam.releases[toStart ? "fx1" : "fx2"] ||
          beam.releases[toStart ? "fy1" : "fy2"] ||
          beam.releases[toStart ? "fz1" : "fz2"] ||
          beam.releases[toStart ? "mx1" : "mx2"] ||
          beam.releases[toStart ? "my1" : "my2"] ||
          beam.releases[toStart ? "mz1" : "mz2"]
        ) {
          beamsToRemoving.push(beam.name);
        }
      }
    }
    if (beamsToRemoving.length) {
      dispatch(
        secondConfirmAction({
          message: `Deleting Column ${element} would remove Beam ${beamsToRemoving.join(
            ", "
          )}. Do you want to continue?`,
          onConfirm: () => {
            let changedUI: OpenFrameUI = { ...ui };
            for (const beam of beamsToRemoving) {
              const beamElement = elements.get(beam);
              if (!beamElement) continue;
              removeConnectionsFromMap(elements, beamElement);
              const field = getField(beamElement);
              if (field) {
                changedUI = removeElementFromUI(
                  dispatch,
                  changedUI,
                  field,
                  beamElement,
                  model
                );
              }
            }
            removeConnectionsFromMap(elements, removing);
            const changed = {
              ...model,
              ...getSeparetedElementsOfModel(mapToArray(elements)),
            };
            dispatch(changeModel(changed));
            const field = getField(removing);
            if (field) {
              changedUI = removeElementFromUI(
                dispatch,
                changedUI,
                field,
                removing,
                model
              );
              dispatch(changeOFUIAction(changedUI));
            }
          },
        })
      );
      return;
    }
  }
  removeConnectionsFromMap(elements, removing);
  const changed = {
    ...model,
    ...getSeparetedElementsOfModel(mapToArray(elements)),
  };
  dispatch(changeModel(changed));
  const field = getField(removing);
  if (!field) return;
  const changedUI: OpenFrameUI = removeElementFromUI(
    dispatch,
    ui,
    field,
    removing,
    model
  );
  dispatch(changeOFUIAction(changedUI));
}

// -----------------------------------------------------------------------------------------------

export function fixPointsOfBeamElement(
  start: Vector3,
  end: Vector3,
  model: TOpenFrame,
  item: TBeamElement,
  isStart?: boolean
) {
  const column = model.columns.find((column) => {
    const pos = isStart ? "startPos" : "endPos";
    if (column.startPos.x !== item[pos].x) return false;
    if (column.startPos.z !== item[pos].z) return false;
    return checkRange(
      item[pos].y,
      column.startPos.y,
      column.endPos.y,
      false,
      true
    );
  });
  if (column) {
    const shape = column.profile.shape?.toUpperCase().trim();
    if (shape === "I" || shape === "C") {
      const width = MMtoM(column.profile.bf_global ?? 0) / 2;
      const height = MMtoM(column.profile.d_global ?? 0) / 2;
      const vector = isStart ? start : end;
      const isZ = Math.round(start.z) === Math.round(end.z);
      switch (column.orientation) {
        case 0:
        case 180:
          if (isZ) {
            vector.setX(
              start.x < end.x
                ? isStart
                  ? vector.x + width
                  : vector.x - width
                : isStart
                ? vector.x - width
                : vector.x + width
            );
          } else {
            vector.setZ(
              start.z < end.z
                ? isStart
                  ? vector.z + height
                  : vector.z - height
                : isStart
                ? vector.z - height
                : vector.z + height
            );
          }
          break;
        case 90:
        case 270:
          if (isZ) {
            vector.setX(
              start.x < end.x
                ? isStart
                  ? vector.x + height
                  : vector.x - height
                : isStart
                ? vector.x - height
                : vector.x + height
            );
          } else {
            vector.setZ(
              start.z < end.z
                ? isStart
                  ? vector.z + width
                  : vector.z - width
                : isStart
                ? vector.z - width
                : vector.z + width
            );
          }
          break;
        default: {
          const a = width + height;
          const b = Math.sqrt(2 * Math.pow(a, 2)) / 2;
          const offset = Math.sqrt(Math.pow(a, 2) - Math.pow(b, 2));
          if (isZ) {
            vector.setX(
              start.x < end.x
                ? isStart
                  ? vector.x + offset
                  : vector.x - offset
                : isStart
                ? vector.x - offset
                : vector.x + offset
            );
          } else {
            vector.setZ(
              start.z < end.z
                ? isStart
                  ? vector.z + offset
                  : vector.z - offset
                : isStart
                ? vector.z - offset
                : vector.z + offset
            );
          }
        }
      }
    }
  }
}

export function fixElevationOfBeamElement(
  item: TBeamElement,
  mesh: Mesh,
  pos: Vector3
) {
  const width = mesh.userData.width ?? 0;
  const height = mesh.userData.height ?? width;
  switch (item.orientation) {
    case 0:
    case 180:
      pos.setY(pos.y - height / 2);
      break;
    case 90:
    case 270:
      pos.setY(pos.y - width / 2);
      break;
    default: {
      const a = width + height;
      const b = Math.sqrt(2 * Math.pow(a, 2)) / 2;
      const offset = Math.sqrt(Math.pow(a, 2) - Math.pow(b, 2)) / 2;
      pos.setY(pos.y - offset);
    }
  }
}

export function getSupportPosByBeam(
  startPos: Vector3,
  endPos: Vector3,
  direction: Direction3,
  beam: TBeamElement
) {
  const pos = startPos.clone();
  if (direction === "+X" || direction === "-X") {
    pos.setX(beam.startPos.x);
    pos.setY(
      pos.y + getOffsetB(startPos.x, startPos.y, endPos.x, endPos.y, pos.x)
    );
    pos.setZ(
      pos.z + getOffsetB(startPos.x, startPos.z, endPos.x, endPos.z, pos.x)
    );
  } else if (direction === "+Z" || direction === "-Z") {
    pos.setX(
      pos.x +
        getOffsetB(startPos.z, startPos.x, endPos.z, endPos.x, beam.startPos.z)
    );
    pos.setY(
      pos.y +
        getOffsetB(startPos.z, startPos.y, endPos.z, endPos.y, beam.startPos.z)
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

export function fixVector(
  element: TBeamOF | TCantileverOF,
  vector: Vector3,
  offset: number,
  isAcross?: boolean
) {
  const fixed = vector.clone();
  if (element.direction === "X" || element.direction === "+X") {
    isAcross ? fixed.setZ(fixed.z + offset) : fixed.setX(fixed.x + offset);
  } else if (element.direction === "-X") {
    isAcross ? fixed.setZ(fixed.z + offset) : fixed.setX(fixed.x - offset);
  } else if (element.direction === "Z" || element.direction === "+Z") {
    isAcross ? fixed.setX(fixed.x + offset) : fixed.setZ(fixed.z + offset);
  } else if (element.direction === "-Z") {
    isAcross ? fixed.setX(fixed.x + offset) : fixed.setZ(fixed.z - offset);
  }
  return fixed;
}

// -----------------------------------------------------------------------------------------------

/*export function drawOpenFrameNode(
  project: Project,
  ui: ProjectUI | undefined,
  model: TOpenFrame,
  scene: Scene,
  font: Font | undefined,
  models?: TOpenFrame[],
){
  const mesh = new THREE.Mesh();
  mesh.name = model.name;
  mesh.position.add(model.startPos);
  mesh.rotation.setFromVector3(getRotation(model.direction));
  const visibleNodes = project.settings.analysis.showNodes;
  if(visibleNodes === true) {
    console.log("condition met");
    numberonElement(
      project,
      ui,
      scene,
      font,
      models,
    );
  }
  return mesh;
}*/

export function drawOpenFrame(
  project: Project,
  ui: ProjectUI | undefined,
  model: TOpenFrame,
  font: Font | undefined,

  scene: Scene,
  oUI?: OpenFrameUI,
  BCS?: TBeamConnections,
  ofCreationState?: TOFCreateState,
  models?: TOpenFrame[]
) {
  console.log("draw open frame function runs");

  const modelAnalysis = ui?.analysisUI[model.name];
  const loadingsUI = ui?.openFrameUI.loadingsUI;
  let min = 0.3;
  let max = 1;
  if (ui?.designCodeAndParametersUI.designCode === "IS 800 : 2007 LSD") {
    min = ui.designCodeAndParametersUI.indianDesignCode.minStressRation ?? 0.3;
    max = ui.designCodeAndParametersUI.indianDesignCode.stressRation;
  } else if (ui?.designCodeAndParametersUI.designCode === "AISC LRFD") {
    min =
      ui.designCodeAndParametersUI.americanDesignCode.minStressRation ?? 0.3;
    max = ui.designCodeAndParametersUI.americanDesignCode.stressRation;
  }

  let anchors: any = {};
  if (BCS?.type === "ODSM" && BCS.anchor) {
    if (BCS.subtype === "Bolted") {
      anchors = { [BCS.anchor]: true };
    }
  }
  const fireProofing = loadingsUI
    ? {
        thickness: loadingsUI.deadLoadUI.FPt,
        height: loadingsUI.deadLoadUI.FPh,
        elements: loadingsUI.deadLoadUI.FPto === "All elements",
        limit: MMtoM(loadingsUI.deadLoadUI.FPdl),
      }
    : undefined;

  const mesh = new Mesh();
  mesh.name = model.name;
  mesh.position.add(model.startPos);
  mesh.rotation.setFromVector3(getRotation(model.direction));
  const visibleNodes = project.settings.analysis.showNodes;
  console.log("visiblenodes", visibleNodes);

  // if (visibleNodes === true) {
  //   numberonElement(project, ui, font, scene, oUI, models);
  // }

  if (project.mode === "stressCheck" || project.mode === "deflectionCheck") {
    for (const item of model.columns) {
      if (item.secondType === "ACCESSORY") continue;
      const colored = drawColoredElement(
        project,
        model,
        item,
        modelAnalysis,
        min,
        max,
        font
      );
      colored.length
        ? mesh.add(...colored)
        : mesh.add(drawColumn(project, ui, model, item, true));
    }
    for (const item of model.beams) {
      if (item.secondType === "ACCESSORY") continue;
      const colored = drawColoredElement(
        project,
        model,
        item,
        modelAnalysis,
        min,
        max,
        font
      );
      colored.length
        ? mesh.add(...colored)
        : mesh.add(drawBeam(project, ui, model, item, undefined, true));
    }
    for (const item of model.cantilevers) {
      const colored = drawColoredElement(
        project,
        model,
        item,
        modelAnalysis,
        min,
        max,
        font
      );
      colored.length
        ? mesh.add(...colored)
        : mesh.add(drawCantilever(project, ui, model, item, true));
    }
    for (const item of model.kneeBracings) {
      const colored = drawColoredElement(
        project,
        model,
        item,
        modelAnalysis,
        min,
        max,
        font
      );
      colored.length
        ? mesh.add(...colored)
        : mesh.add(drawBracing(project, ui, model, item, true));
    }
    for (const item of model.verticalBracings) {
      const colored = drawColoredElement(
        project,
        model,
        item,
        modelAnalysis,
        min,
        max,
        font
      );
      colored.length
        ? mesh.add(...colored)
        : mesh.add(drawBracing(project, ui, model, item, true));
    }
    for (const item of model.horizontalBracings) {
      const colored = drawColoredElement(
        project,
        model,
        item,
        modelAnalysis,
        min,
        max,
        font
      );
      colored.length
        ? mesh.add(...colored)
        : mesh.add(drawBracing(project, ui, model, item, true));
    }
    if (model.staircases) {
      for (const item of model.staircases) {
        const colored = drawColoredElement(
          project,
          model,
          item,
          modelAnalysis,
          min,
          max,
          font
        );
        colored.length
          ? mesh.add(...colored)
          : mesh.add(drawStaircase(project, ui, model, item, true));
      }
    }
    for (const item of model.accessories) {
      for (const agEl of item.elements) {
        mesh.add(
          drawAccessoriesElements(
            project,
            ui,
            model,
            agEl as any,
            item.orientation,
            modelAnalysis,
            min,
            max,
            true,
            font
          )
        );
      }
    }
  } else {
    for (const item of model.columns) {
      if (item.secondType === "ACCESSORY") continue;
      mesh.add(drawColumn(project, ui, model, item, false, anchors));
      if (fireProofing) {
        const fp = createFireProofingByProfile(
          item.startPos,
          item.endPos,
          item.profile,
          fireProofing.height,
          fireProofing.thickness,
          fireProofing.limit,
          project.settings.models.fireproofingTransparency
        );
        if (fp) {
          fp.rotateX(degToRad(item.orientation));
          mesh.add(fp);
        }
      }
    }
    for (const item of model.beams) {
      if (item.secondType !== "ACCESSORY") {
        mesh.add(drawBeam(project, ui, model, item, undefined, false, anchors));
        if (fireProofing) {
          const fp = createFireProofingByProfile(
            roundVectorM(item.startPos),
            roundVectorM(item.endPos),
            item.profile,
            fireProofing.height,
            fireProofing.thickness,
            fireProofing.limit,
            project.settings.models.fireproofingTransparency
          );
          if (fp) {
            fixElevationOfBeamElement(item, fp, fp.position);
            fp.rotateX(degToRad(item.orientation));
            mesh.add(fp);
          }
        }
      }
    }
    for (const item of model.cantilevers) {
      mesh.add(drawCantilever(project, ui, model, item));
      if (fireProofing?.elements) {
        const fp = createFireProofingByProfile(
          roundVectorM(item.startPos),
          roundVectorM(item.endPos),
          item.profile,
          fireProofing.height,
          fireProofing.thickness,
          fireProofing.limit,
          project.settings.models.fireproofingTransparency
        );
        if (fp) {
          fixElevationOfBeamElement(item, fp, fp.position);
          fp.rotateX(degToRad(item.orientation));
          mesh.add(fp);
        }
      }
    }
    for (const item of model.kneeBracings) {
      mesh.add(drawBracing(project, ui, model, item, false, anchors));
      if (fireProofing?.elements) {
        const fp = createFireProofingByProfile(
          item.startPos,
          item.endPos,
          item.profile,
          fireProofing.height,
          fireProofing.thickness,
          fireProofing.limit,
          project.settings.models.fireproofingTransparency
        );
        if (fp) {
          fp.rotateX(degToRad(item.orientation));
          mesh.add(fp);
        }
      }
    }
    for (const item of model.verticalBracings) {
      mesh.add(drawBracing(project, ui, model, item, false, anchors));
      if (fireProofing?.elements) {
        const fp = createFireProofingByProfile(
          item.startPos,
          item.endPos,
          item.profile,
          fireProofing.height,
          fireProofing.thickness,
          fireProofing.limit,
          project.settings.models.fireproofingTransparency
        );
        if (fp) {
          fp.rotateX(degToRad(item.orientation));
          mesh.add(fp);
        }
      }
    }
    for (const item of model.horizontalBracings) {
      mesh.add(drawBracing(project, ui, model, item, false, anchors));
      if (fireProofing?.elements) {
        const fp = createFireProofingByProfile(
          item.startPos,
          item.endPos,
          item.profile,
          fireProofing.height,
          fireProofing.thickness,
          fireProofing.limit,
          project.settings.models.fireproofingTransparency
        );
        if (fp) {
          fixElevationOfBeamElement(item, fp, fp.position);
          fp.rotateX(degToRad(item.orientation));
          mesh.add(fp);
        }
      }
    }
    if (model.staircases) {
      for (const item of model.staircases) {
        mesh.add(drawStaircase(project, ui, model, item));
        if (fireProofing?.elements) {
          const fp = createFireProofingByProfile(
            item.startPos,
            item.endPos,
            item.profile,
            fireProofing.height,
            fireProofing.thickness,
            fireProofing.limit,
            project.settings.models.fireproofingTransparency
          );
          if (fp) {
            fp.rotateX(degToRad(item.orientation));
            mesh.add(fp);
          }
        }
      }
    }
    for (const item of model.accessories) {
      for (const agEl of item.elements) {
        mesh.add(
          drawAccessoriesElements(
            project,
            ui,
            model,
            agEl as any,
            item.orientation
          )
        );
      }
    }
  }
  for (const item of model.platforms) {
    const arrEl = [...model.beams, ...model.cantilevers];
    const from = arrEl.find((beam) => beam.name === item.from);
    const to = arrEl.find((beam) => beam.name === item.to);
    from && to && mesh.add(drawPlatform(project, model, from, to, item));
  }
  for (const item of model.circularBP) {
    const column = getElementByName(model.columns, item.column);
    column && mesh.add(drawCircularBasePlate(item, column));
  }
  for (const item of model.rectangularBP) {
    const column = getElementByName(model.columns, item.column);
    column && mesh.add(drawRectangularBasePlate(item, column));
  }
  if (model.beamToBeamConnections) {
    for (const item of model.beamToBeamConnections) {
      const beam = getElementByName(model.beams, item.parent);
      if (beam) {
        const column = getElementByName(
          model.columns,
          (item.position === "START"
            ? beam.startConnected
            : beam.endConnected
          ).find((e) => e.startsWith("C"))
        );
        if (column) mesh.add(drawBeamToColumnConnection(item, beam, column));
        else {
          const beamConnected: TBeamOF | undefined = getElementByName<TBeamOF>(
            model.beams,
            (item.position === "START"
              ? beam.startConnected
              : beam.endConnected)[0]
          );
          beamConnected &&
            mesh.add(drawBeamToBeamConnection(item, beam, beamConnected));
        }
      }
    }
  }

  if (model.beamToColumnConnections) {
    for (const item of model.beamToColumnConnections) {
      const beam = getElementByName(model.beams, item.parent);
      if (beam) {
        const column = getElementByName(
          model.columns,
          (item.position === "START"
            ? beam.startConnected
            : beam.endConnected
          ).find((e) => e.startsWith("C"))
        );
        if (column) mesh.add(drawBeamToColumnConnection(item, beam, column));
      }
    }
  }

  if (model.vBracingConnections) {
    for (const item of model.vBracingConnections) {
      const vBracing = getElementByName(model.verticalBracings, item.parent);

      if (vBracing) {
        const column = getElementByName(
          model.columns,
          (item.position === "START"
            ? vBracing.startConnected
            : vBracing.endConnected
          ).find((e) => e.startsWith("C"))
        );
        const beam = getElementByName(
          model.beams,
          (item.position === "START"
            ? vBracing.startConnected
            : vBracing.endConnected
          ).find((e) => e.startsWith("B"))
        );
        column &&
          beam &&
          mesh.add(drawVBracingConnection(item, vBracing, column, beam));
      }
    }
  }

  if (model.vBracingConnections) {
    for (const item of model.vBracingConnections) {
      const vBracing = getElementByName(model.verticalBracings, item.parent);

      if (vBracing) {
        const column = getElementByName(
          model.columns,
          (item.position === "START"
            ? vBracing.startConnected
            : vBracing.endConnected
          ).find((e) => e.startsWith("C"))
        );
        const beam = getElementByName(
          model.beams,
          (item.position === "START"
            ? vBracing.startConnected
            : vBracing.endConnected
          ).find((e) => e.startsWith("B"))
        );
        column &&
          beam &&
          mesh.add(drawVBracingConnection(item, vBracing, column, beam));
      }
    }
  }

  if (model.roads) {
    for (const item of model.roads) {
      mesh.add(drawRoad(item, model, ofCreationState?.routing, project));
    }
  }

  if (model.cableTrays) {
    for (const item of model.cableTrays) {
      mesh.add(drawLadder(model, item, project));
    }
  }

  if (model.others) {
    for (const item of model.others) {
      mesh.add(drawOther(model, item, project));
    }
  }

  for (const item of model.circularSF) {
    const column = model.columns.find((c) => c.name === item.column);
    const secondColumn =
      column &&
      model.columns.find((c) => c.startConnected.includes(column!.name));
    column &&
      secondColumn &&
      mesh.add(drawCircularSliceFlange(item, column, secondColumn));
  }
  for (const item of model.rectangularSF) {
    const column = model.columns.find((c) => c.name === item.column);
    const secondColumn =
      column &&
      model.columns.find((c) => c.startConnected.includes(column!.name));
    column &&
      secondColumn &&
      mesh.add(drawRectangularSliceFlange(item, column, secondColumn));
  }
  for (const item of model.pipes) {
    mesh.add(drawPipe(model, item));
  }
  if (project.settings?.models?.modelAxesHelpers) {
    mesh.add(
      getSimpleAxisHelper(
        model.frames.reduce((acc, f) => Math.max(acc, f.height), 0) * 1.5
      )
    );
  }
  model.truss?.forEach((item) => {
    mesh.add(drawTruss(model.beams, item));
  });
  model.runners?.forEach((item) => {
    if (item.globalSide === "SIDE") {
      const from = model.columns.find((el) => el.name === item.from);
      const to = model.columns.find((el) => el.name === item.to);
      if (from && to) {
        drawRunner(mesh, item, from, to);
      }
    } else {
      const from = model.beams.find((el) => el.name === item.from);
      const to = model.beams.find((el) => el.name === item.to);
      if (from && to) {
        drawRunner(mesh, item, from, to);
      }
    }
  });
  model.metalCladdings?.forEach((item) => {
    const from = model.columns.find((c) => c.name === item.from);
    const to = model.columns.find((c) => c.name === item.to);
    drawMetalCladding(mesh, item, from, to);
  });
  model.masonryCladdings?.forEach((item) => {
    const from = model.columns.find((c) => c.name === item.from);
    const to = model.columns.find((c) => c.name === item.to);
    drawMasonryCladding(mesh, item, from, to);
  });
  model.railings?.forEach((item) => {
    const element =
      model.beams.find((b) => b.name === item.element) ??
      model.staircases.find((b) => b.name === item.element) ??
      model.cantilevers.find((cnt) => cnt.name === item.element);
    drawRailing(mesh, item, element);
  });
  return mesh;
}

const lineMeshMaterial = new MeshLambertMaterial({
  color: getRGB(pipeColorRGB),
});

function createBoldLine(
  start: THREE.Vector3,
  end: THREE.Vector3,
  font?: THREE.Font,
  size = 0.005,
  material: THREE.MeshLambertMaterial = lineMeshMaterial
) {
  const length = start.distanceTo(end);
  if (!length) return;
  const l_2 = length / 2;
  const coef = 0.2;
  const und = undefined;
  const line = new Mesh(
    new CylinderGeometry(size * 5, size * 5, length),
    new MeshLambertMaterial({
      opacity: 0,
      transparent: true,
      visible: false,
    })
  );
  const mainLine = new Mesh(new CylinderGeometry(size, size, length), material);
  line.position.copy(
    start
      .clone()
      .add(end)
      .divideScalar(2)
  );
  line.lookAt(end);
  line.rotateX(deg90InRad);
  line.add(mainLine);

  return line;
}
function createPipeMesh(
  radius: number,
  thickness: number,
  depth: number,
  material?: THREE.MeshLambertMaterial
) {
  const arcShape = new Shape();
  arcShape.absarc(0, 0, radius, 0, deg360InRad, false);
  if (thickness && checkRange(thickness, 0, radius)) {
    const holePath = new Path();
    holePath.absarc(0, 0, radius - thickness, 0, deg360InRad, true);
    arcShape.holes.push(holePath);
  }
  const mesh = new Mesh(
    new ExtrudeGeometry(arcShape, {
      steps: 1,
      bevelEnabled: false,
      curveSegments: 32,
      depth,
    }),
    material
  );
  return mesh;
}
const selectedMeshMaterial = new MeshLambertMaterial({
  color: getRGB(supColorRGB),
  side: DoubleSide,
});
const meshMaterial = new MeshLambertMaterial({
  color: getRGB(pedestalColor),
  side: DoubleSide,
});

const createAnchor = (size: number, point: Vector3, data?: any) => {
  const geometry = new SphereGeometry(0.5);
  const m = dropZoneMaterial.clone();
  m.opacity = 0.3;
  const mesh = new Mesh(geometry, m);
  mesh.name = `DROP-SHPHERE-POINT`;

  if (data) mesh.userData = data;

  mesh.position.copy(point);

  return mesh;
};

function drawPlatform(
  project: Project,
  model: TOpenFrame,
  from: TBeamElement,
  to: TBeamElement,
  item: TPlatformOF
) {
  const { minV, maxV, fromD } = getMaxAndMinPoints(from, to);
  const isX = fromD.includes("X");
  let length = 0;
  if (isX) {
    length = maxV.z - minV.z;
  } else {
    length = maxV.x - minV.x;
  }
  const material = new MeshBasicMaterial({
    color: model.palette?.PLATFORM ?? getRGB(platformColorRGB),
    transparent: project.settings.models.platformTransparency < 100,
    opacity: project.settings.models.platformTransparency / 100,
  });
  const mesh = new Mesh(
    new BoxBufferGeometry(
      isX ? item.width : length,
      MMtoM(item.thickness),
      isX ? length : item.width,
      1,
      1,
      1
    ),
    material
  );
  if (isX) {
    mesh.position.set(
      minV.x + item.distance + item.width / 2,
      from.startPos.y,
      (minV.z + maxV.z) / 2
    );
  } else {
    mesh.position.set(
      (minV.x + maxV.x) / 2,
      from.startPos.y,
      minV.z + item.distance + item.width / 2
    );
  }
  mesh.name = item.name;
  mesh.userData = {
    isModelPlatform: true,
    model: model.name,
    project: project.name,
    modelDir: model.direction,
    modelStart: model.startPos.clone(),
    name: item.name,
    start: from.startPos.clone(),
    end: to.endPos.clone(),
    data: { ...item },
  } as TSelectedPlatform;
  return mesh;
}
function isVectorApproximatelyEqual(
  vec: Vector3,
  target: Vector3,
  tolerance: number
) {
  // Check if the absolute difference between each component is within the tolerance
  return (
    Math.abs(vec.x - target.x) <= tolerance &&
    Math.abs(vec.y - target.y) <= tolerance &&
    Math.abs(vec.z - target.z) <= tolerance
  );
}

function rotateShape90Degree(shape: Shape) {
  return new Shape(
    shape.getPoints().map((point) => new THREE.Vector2(-point.y, point.x))
  );
}
function rotateShape180Degree(shape: Shape) {
  return new Shape(
    shape.getPoints().map((point) => new THREE.Vector2(point.x, -point.y))
  );
}
function drawRoadSegement(model: TOpenFrame, points: Vector3[], line: TRoad) {
  // const curve = new CatmullRomCurve3(points);
  const direction = new Vector3()
    .subVectors(
      new Vector3(points[0].x, points[0].y, points[0].z),
      new Vector3(points[1].x, points[1].y, points[1].z)
    )
    .normalize();
  console.log(direction, points);
  // const angle = Math.atan2(direction.z, direction.x);
  const width = MMtoM(line.width); // width of the road
  const depth = MMtoM(line.thickness); // depth of the road, if it's elevated from the ground

  console.log(points);

  // let swapped = false;
  // if (
  //   Math.abs(points[0].x - points[1].x) > Math.abs(points[0].z - points[1].z)
  // ) {
  //   [width, depth] = [depth, width];
  //   swapped = true;
  // }
  // if (isVectorApproximatelyEqual(direction,new Vector3(1, 0, 0),0.1)) {
  //   [width, depth] = [depth, -width];
  // }
  // if (direction.equals(new Vector3(0, 0, 1))) {
  //   [width, depth] = [-depth, width];
  // }
  // [width, depth] = [depth, width];

  let drainShape = new Shape();
  // Start with the left bottom corner
  drainShape.moveTo(0, 0);

  // Draw the left side
  drainShape.lineTo(0, -depth / 5);
  drainShape.lineTo(width / 10, -depth / 5);
  drainShape.quadraticCurveTo(
    width / 2,
    -depth,
    width - width / 10,
    -depth / 5
  );
  drainShape.lineTo(width, -depth / 5);
  drainShape.lineTo(width, -0);
  drainShape.lineTo(width - width / 5, 0);
  drainShape.quadraticCurveTo(width / 2, -depth + depth / 5, width / 5, 0);
  drainShape.lineTo(0, -0);

  let waterShape = new Shape();
  waterShape.moveTo(width / 5 + width / 20, -depth / 10);
  waterShape.quadraticCurveTo(
    width / 2,
    -depth + depth / 5,
    width - width / 5 - width / 20,
    -depth / 10
  );

  // Draw the curve of the drain (assuming a simple semi-circle for the bottom part)
  // drainShape.quadraticCurveTo()
  // drainShape.absarc(-width / 2, -depth, width / 2, Math.PI, 0, true);

  // Draw the right side
  // drainShape.lineTo(-width, 0);

  // Draw a rectangle for the road shape
  let roadShape = new Shape();
  roadShape.moveTo(-width / 2, -depth / 2);
  roadShape.lineTo(-width / 2, depth / 2);
  roadShape.lineTo(width / 2, depth / 2);
  roadShape.lineTo(width / 2, -depth / 2);
  roadShape.lineTo(-width / 2, -depth / 2);

  let middleline = new Shape();
  middleline.moveTo(-width / 20, -depth / 2);
  middleline.lineTo(-width / 20, depth / 2);
  middleline.lineTo(width / 20, depth / 2);
  middleline.lineTo(width / 20, -depth / 2);
  middleline.lineTo(-width / 20, -depth / 2);

  let tranchShape = new Shape();
  tranchShape.moveTo((-width / 20) * 6, -depth / 2);
  tranchShape.lineTo((-width / 20) * 7, 0);
  tranchShape.lineTo(-width / 2, 0);
  tranchShape.lineTo(-width / 2, -depth);
  tranchShape.lineTo(width / 2, -depth);
  tranchShape.lineTo(width / 2, 0);
  tranchShape.lineTo((width / 20) * 7, 0);
  tranchShape.lineTo((width / 20) * 7, 0);
  tranchShape.lineTo((width / 20) * 6, -depth / 2);

  tranchShape.lineTo((-width / 20) * 6, -depth / 2);

  if (
    isVectorApproximatelyEqual(direction, new Vector3(0, 0, 1), 0.1) ||
    isVectorApproximatelyEqual(direction, new Vector3(0, 0, -1), 0.1)
  ) {
    drainShape = rotateShape90Degree(drainShape);
    waterShape = rotateShape90Degree(waterShape);
    roadShape = rotateShape90Degree(roadShape);
    middleline = rotateShape90Degree(middleline);
    tranchShape = rotateShape90Degree(tranchShape);
  }
  if (isVectorApproximatelyEqual(direction, new Vector3(1, 0, 0), 0.1)) {
    drainShape = rotateShape180Degree(drainShape);
    waterShape = rotateShape180Degree(waterShape);
    roadShape = rotateShape180Degree(roadShape);
    middleline = rotateShape180Degree(middleline);
    tranchShape = rotateShape180Degree(tranchShape);
  }
  if (
    direction.equals(new Vector3(0, 0, 1)) ||
    direction.equals(new Vector3(0, 0, -1))
  ) {
    //rotate all gemotry in 90 in y axis
  }
  const newPoints: Vector3[] = [points[0]];
  for (let i = 1; i < points.length - 1; i++) {
    const length1 = vector3FromPoint(points[i - 1]).distanceTo(
      vector3FromPoint(points[i])
    );
    const length2 = vector3FromPoint(points[i + 1]).distanceTo(
      vector3FromPoint(points[i])
    );
    const point1 = new Vector3().lerpVectors(
      vector3FromPoint(points[i - 1]),
      vector3FromPoint(points[i]),
      (length1 - (length1 / 6) * 1) / length1
    );
    const point2 = new Vector3().lerpVectors(
      vector3FromPoint(points[i + 1]),
      vector3FromPoint(points[i]),
      (length2 - (length2 / 6) * 1) / length2
    );
    newPoints.push(
      vector3FromPoint(point1),
      vector3FromPoint(points[i]),
      vector3FromPoint(point2)
    );
  }
  newPoints.push(points[points.length - 1]);

  const curvePath = new CurvePath<Vector3>();
  curvePath.add(new LineCurve3(newPoints[0], newPoints[1]));
  for (let i = 1; i < points.length - 1; i++) {
    const index = (i - 1) * 3 + 2;
    curvePath.add(
      new QuadraticBezierCurve3(
        newPoints[index - 1],
        newPoints[index],
        newPoints[index + 1]
      )
    );
    curvePath.add(new LineCurve3(newPoints[index + 1], newPoints[index + 2]));
  }

  // Extrude options
  const extrudeSettings = {
    steps: 100, // Number of points along the path
    bevelEnabled: false, // No bevel
    extrudePath: curvePath, // Path to extrude along
  };

  // Create the geometry
  const roadGeometry = new ExtrudeGeometry(roadShape, extrudeSettings);
  const middleLineGeometry = new ExtrudeGeometry(middleline, extrudeSettings);
  const drainGeometry = new ExtrudeGeometry(drainShape, extrudeSettings);
  const waterGeometry = new ExtrudeGeometry(waterShape, extrudeSettings);

  const tranchMaterial = new MeshPhongMaterial({
    color: "#CCB000",
    side: DoubleSide,
  });

  // const tranchMesh = new Mesh(new Geometry());
  // let straightPath = new CurvePath<Vector3>();
  // straightPath.add(new LineCurve3(newPoints[0], newPoints[1]));
  // extrudeTranchSettings.extrudePath = straightPath;
  // mergeMesh(
  //   tranchMesh,
  //   new Mesh(new ExtrudeGeometry(tranchShape, extrudeTranchSettings))
  // );

  // for (let i = 1; i < points.length - 1; i++) {
  //   const index = (i - 1) * 3 + 2;
  //   // straightPath.add(
  //   //   new QuadraticBezierCurve3(
  //   //     newPoints[index - 1],
  //   //     newPoints[index],
  //   //     newPoints[index + 1]
  //   //   )
  //   // );
  //   straightPath = new CurvePath<Vector3>();
  //   straightPath.add(
  //     new LineCurve3(newPoints[index + 1], newPoints[index + 2])
  //   );
  //   extrudeTranchSettings.extrudePath = straightPath;
  //   mergeMesh(
  //     tranchMesh,
  //     new Mesh(new ExtrudeGeometry(tranchShape, extrudeTranchSettings))
  //   );
  // }

  const tranchGeometry = new ExtrudeGeometry(tranchShape, extrudeSettings);

  const tranchMesh = new Mesh(tranchGeometry, tranchMaterial);
  // const curve = new QuadraticBezierCurve3(...points);

  // const path = new THREE.Path(curve.getPoints(50));
  // const geometry = path.createPointsGeometry(50);

  // const length = item.start.distanceTo(item.end);
  // const pos = getMiddleVector3(item.start, item.end);
  // const middle = getMiddleVector3(item.start, item.end);
  // // Calculate the rotation angle required for the road segment

  // const mesh = new Mesh(
  //   new BoxBufferGeometry(
  //     length,
  //     MMtoM(line.thickness),
  //     MMtoM(line.width),
  //     1,
  //     1,
  //     1
  //   ),
  //   meshMaterial
  // );
  // mesh.position.copy(middle);

  // Apply rotation to the mesh
  // mesh.name = `ROAD SEGEMENT${line.id}${item.id}`;
  const textureLoader = new TextureLoader();
  const roadTexture = textureLoader.load("material/road.png"); // Replace with the path to your texture

  // Create the material with the texture
  const roadMaterial = new MeshPhongMaterial({ map: roadTexture });
  // const roadTexture = textureLoader.load("material/road.png"); // Replace with the path to your texture

  // for (const face of roadGeometry.faces) {
  //   // Check if the normal is pointing up
  //   if (face.normal.y > 0.99) { // Using 0.99 to account for potential floating-point errors
  //     // This face is a top face
  //     face.materialIndex = 1; // Assign the road material to this face
  //   } else {
  //     // This face is not a top face
  //     face.materialIndex = 0; // Assign a different material to this face
  //   }
  // }

  const roadMesh = new Mesh(
    roadGeometry,
    // roadMaterial
    new MeshPhongMaterial({
      color: new Color(0, 0, 0),
      side: DoubleSide,
    })
  );

  const middleLineMesh = new Mesh(
    middleLineGeometry,
    new MeshPhongMaterial({
      color: new Color(255, 255, 255),
      side: DoubleSide,
    })
  );
  middleLineMesh.position.add(new Vector3(0, 0.001, 0));

  const roadMeshGroup = new Mesh();
  roadMeshGroup.add(roadMesh);
  roadMesh.add(middleLineMesh);

  const drainMeshGroup = new Mesh();
  const drainMesh = new Mesh(drainGeometry, meshMaterial);
  const waterMesh = new Mesh(
    waterGeometry,
    new MeshPhongMaterial({
      color: 0x0e87cc, // A blue color for the water
      transparent: true, // Required for opacity to work
      opacity: 0.8, // Adjust for desired transparency
      shininess: 100, // Adjust for the desired shininess
      reflectivity: 1, // Reflectivity of the material surface
    })
  );
  drainMeshGroup.add(drainMesh);
  drainMesh.add(waterMesh);

  const meshGroup = new Group();

  if (line.type === "ROAD") meshGroup.add(roadMesh);
  else if (line.type === "DRAIN") meshGroup.add(drainMesh);
  else if (line.type === "TRANCH") meshGroup.add(tranchMesh);

  // if (swapped) meshGroup.rotateZ(deg180InRad);
  return meshGroup;

  // if(points.length===2)
  // {
  //   const direction = new Vector3().subVectors(points[0], points[1]).normalize();
  //   // const angle = Math.atan2(direction.z, direction.x);
  //   if(direction.equals(new Vector3(0,0,1)))
  //   meshGroup.setRotationFromAxisAngle
  // // }

  return meshGroup;
}
export function drawOther(
  model: TOpenFrame,
  item: TCableTrayOF,
  project: Project
) {
  const mesh = new Mesh(new Geometry());
  return mesh;
}

export function drawLadder(
  model: TOpenFrame,
  item: TCableTrayOF,
  project: Project

) {
  const mesh=new Mesh(new Geometry());
  if (!item.to || !item.from) return mesh;
  const from = vector3FromPoint(item.from);
  const to = vector3FromPoint(item.to);
  const start = globalToLocal(model.startPos, from, model.direction);
  const end = globalToLocal(model.startPos, to, model.direction);

  const mesh1= drawRawLadder(
    item.id,
    item.width || 2,
    item.height || 10,
    item.distance,
    item.profile,
    
    [0, 253, 251],
  );
  const mesh2 = drawRawLadder(
    item.id,
    item.width || 2,
    item.height || 10,
    item.distance,
    item.profile,
    
    [0,10,255],
  );
  
  mesh2.translateZ(-item.distance ?? item.width / 2);
  mergeMesh(mesh1,mesh2);
  mesh.add(mesh2);
  // mesh.scale.setScalar(0.3);
  mesh.position.copy(start);
  mesh.lookAt(end);

  const direction = getSimpleDirection(start, end);
  console.log(direction);

  mesh.translateX(-item.width / 2);
  if (direction === "X" || direction === "Z") {
    mesh.translateY(-item.width / 2);
  }

  // if (direction === "Y") {
  // }
  // mesh.position.sub(model.startPos);
  mesh.rotateX(deg90InRad);

  mesh.rotateY(deg90InRad);

  // if (model.direction === "-X") mesh.rotateY(deg180InRad);

  mesh.userData = {
    name: mesh.name,
    start,
    end,
    isModelItem: true,
    project: project.name,
    model: model.name,
    endConnected: [],
  };

  return mesh;
}

export function drawRoad(
  line: TRoad,
  model: TOpenFrame,
  routing: "AUTO" | "MANUAL" = "AUTO",
  project: Project
) {
  const mesh = new Group();

  let points: Vector3[] = [];
  let meshID = 1;

  function drawSegements() {
    if (points.length > 0) {
      const meshModel = drawRoadSegement(model, points, line);
      if (meshModel) mesh.add(meshModel);
      const name = `ROAD${line.id}${meshID++}`;
      meshModel.userData = {
        processLine: { ...line },
        points: [...points],
        model: model.name,
        project: project.name,
        startConnected: [],
        connected: [],
        endConnected: [],
        isModelItem: true,
        start: points[0],
        end: points[points.length - 1],
        name: name,
      };
      meshModel.name = name;

      points = [];
    }
  }
  for (const segment of line.segments) {
    if (!segment.isPopup) {
      drawSegements();
      const lineMesh = createBoldLine(
        vector3FromPoint(segment.start),
        vector3FromPoint(segment.end),
        undefined,
        0.005
      );
      if (routing === "AUTO") {
        mesh.add(createAnchor(0.5, vector3FromPoint(segment.start)));
        if (segment.id == getNextId(line.segments) - 1)
          mesh.add(createAnchor(0.5, vector3FromPoint(segment.end)));
      }
      if (lineMesh) {
        // const length = segment.start.distanceTo(segment.end) * 0.05;
        // const pipe = createPipeMesh(0.05, 0.005, length, meshMaterial);
        // if (pipe) {
        //   pipe.position.setY(-length / 2);
        //   pipe.rotateX(-deg90InRad);
        //   lineMesh.add(pipe);
        // }
        lineMesh.userData = {
          isProcessLine: true,
          segmentID: segment.id,
          line,
        };
        if (routing === "MANUAL") {
          const pos = getMiddleVector3(
            vector3FromPoint(segment.start),
            vector3FromPoint(segment.end)
          );
          const anchorData = {
            processLine: line,
            segmentId: segment.id,
            model: model.name,
          };
          const anchor = createAnchor(
            MMtoM(segment.parameters?.od ?? 0.2) * 0.8,
            pos,
            anchorData
          );
          anchor.name = "PIPE-ELEMENT-ANCHOR";
          mesh.add(anchor);
        }
        mesh.add(lineMesh);
      }
    } else {
      if (
        points.length > 1 &&
        new Vector3(
          points[points.length - 1].x,
          points[points.length - 1].y,
          points[points.length - 1].z
        ).equals(vector3FromPoint(segment.start))
      ) {
        points.push(segment.end);
      } else points.push(segment.start, segment.end);
    }
  }

  drawSegements();
  // if (pipeOpacity) {
  //   const material = lineMeshMaterial.clone();
  //   material.transparent = pipeOpacity < 1;
  //   material.opacity = pipeOpacity;
  //   for (let i = 0; i < line.segments.length; i++) {
  //     const pipe = line.segments[i];
  //     if (!pipe.parameters?.profile) continue;
  //     const start = pipe.start.clone();
  //     const end = pipe.end.clone();
  //     let offset = 0;
  //     if (i) {
  //       const prev = line.segments[i - 1];
  //       if (prev) {
  //         const connector = data.pipingElbows.find(
  //           (elbow) => elbow.degree === 90 && elbow.nps === pipe.parameters?.nps
  //         );
  //         offset = MMtoM((connector as TPipingElbow)?.a ?? 0);
  //         offset &&
  //           start.copy(roundVectorM(getPosByDistance(offset, start, end)));
  //       }
  //     }
  //     const { endConnector, distance } =
  //       i < line.segments.length - 1
  //         ? createEndConnector(
  //             i,
  //             pipe,
  //             start,
  //             end,
  //             line.segments,
  //             material,
  //             data
  //           )
  //         : { endConnector: undefined, distance: start.distanceTo(end) };
  //     const radius = MMtoM(pipe.parameters?.od ?? 0) / 2;
  //     const thickness = MMtoM(pipe.parameters?.thickness ?? 0);
  //     const pipeGroup = new THREE.Group();
  //     const pipeMesh = createPipeMesh(radius, thickness, distance, material);
  //     pipeMesh.rotateY(deg90InRad);
  //     pipeGroup.add(pipeMesh);
  //     if (endConnector) {
  //       pipeGroup.add(endConnector);
  //     }
  //     pipeGroup.position.copy(start);
  //     pipeGroup.lookAt(end);
  //     pipeGroup.rotateY(-deg90InRad);
  //     group.add(pipeGroup);
  //   }
  // }

  return mesh;
}

export function drawOpenFrameLoads(
  elements: TBeamElement[],
  loads: {
    deadLoads: AdditionalLoadUI[];
    liveLoads: AdditionalLoadUI[];
    equipmentLoads: EquipmentLoadUI[];
    pipingDirectLoads: DirectLoadUI[];
    windLoads: AdditionalLoadUI[];
  },
  font: Font
) {
  const group = new Group();
  group.name = "OPEN-FRAME-LOADS";

  for (const element of elements) {
    const start = element.startPos.clone();
    const end = element.endPos.clone();

    const xLoads = new Map<number, number>();
    const yLoads = new Map<number, number>();
    const zLoads = new Map<number, number>();

    const additionalLoads = getElementAdditionalLoads<AdditionalLoadUI>(
      element.name,
      [...loads.deadLoads, ...loads.liveLoads, ...loads.windLoads]
    );
    const equipmentLoads = getElementAdditionalLoads<EquipmentLoadUI>(
      element.name,
      loads.equipmentLoads
    );
    const pipingDirectLoads = getElementAdditionalLoads<DirectLoadUI>(
      element.name,
      loads.pipingDirectLoads
    );

    for (const load of additionalLoads) {
      const xLoad = xLoads.get(load.distance) ?? 0;
      const yLoad = yLoads.get(load.distance) ?? 0;
      const zLoad = zLoads.get(load.distance) ?? 0;

      load.Fx && xLoads.set(load.distance, roundM(xLoad + load.Fx));
      load.Fy && yLoads.set(load.distance, roundM(yLoad + load.Fy));
      load.Fz && zLoads.set(load.distance, roundM(zLoad + load.Fz));
    }

    for (const load of equipmentLoads) {
      const xLoad = xLoads.get(load.distance) ?? 0;
      const yLoad = yLoads.get(load.distance) ?? 0;
      const zLoad = zLoads.get(load.distance) ?? 0;

      const Fx = roundM(load.test_Fx + load.operating_Fx);
      const Fy = roundM(load.test_Fy + load.operating_Fy + load.empty_Fy);
      const Fz = roundM(load.test_Fz + load.operating_Fz);

      Fx && xLoads.set(load.distance, roundM(xLoad + Fx));
      Fy && yLoads.set(load.distance, roundM(yLoad + Fy));
      Fz && zLoads.set(load.distance, roundM(zLoad + Fz));
    }

    for (const load of pipingDirectLoads) {
      const xLoad = xLoads.get(load.distance) ?? 0;
      const yLoad = yLoads.get(load.distance) ?? 0;
      const zLoad = zLoads.get(load.distance) ?? 0;

      const Fx = roundM(load.test_Fx + load.operating_Fx);
      const Fy = roundM(load.test_Fy + load.operating_Fy + load.empty_Fy);
      const Fz = roundM(load.test_Fz + load.operating_Fz);

      Fx && xLoads.set(load.distance, roundM(xLoad + Fx));
      Fy && yLoads.set(load.distance, roundM(yLoad + Fy));
      Fz && zLoads.set(load.distance, roundM(zLoad + Fz));
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

function getElementAdditionalLoads<T extends { element?: string }>(
  name: string,
  loads: T[]
) {
  const elementLoads: T[] = [];
  for (const load of loads) {
    if (load.element !== name) continue;
    elementLoads.push(load);
  }
  return elementLoads;
}

function createText(
  parent: THREE.Object3D,
  font: THREE.Font | undefined,
  text: string,
  pos: THREE.Vector3,
  rX?: number,
  rY?: number,
  color = getRGB(gray)
) {
  if (!font) return;

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

function getColor(
  checks: MemberStressCheckUI | DeflectionCheckUI | undefined,
  min: number,
  max: number
) {
  if (checks) {
    if (checks.actual <= min) return green;
    if (checks.actual >= max) return red;
    return yellow;
  } else return gray;
}

interface Node {
  x: number;
  y: number;
  z: number;
  nodeNumber: string | number;
}

function numberonElement(
  project: Project,
  ui: ProjectUI | undefined,
  font: THREE.Font | undefined,
  scene: Scene,
  oUI?: OpenFrameUI,
  models?: TOpenFrame[]
) {
  if (!ui || !oUI || !models) {
    return;
  }

  if (models.length > 0) {
    const jsons = models
      .filter((model) => model.type !== "ROAD")
      .map((model) =>
        getJSONForDesignCodesAndParametersOF(
          scene,
          ui?.designCodeAndParametersUI ?? [],
          oUI,
          project,
          model,
          models
        )
      );

    jsons.forEach((json) => {
      Object.values(json.nodes).forEach((node) => {
        const typedNode = node as Node;
        const parent = new THREE.Object3D();
        oUI.add(parent);

        const position = new THREE.Vector3(
          typedNode.x,
          typedNode.y,
          typedNode.z
        ).divideScalar(1150);
        const text = `N ${typedNode.nodeNumber}`;

        createText(parent, font, text, position, 0, 0, "red");
      });
    });
  }
}

function drawColoredElement(
  project: Project,
  model: TOpenFrame,
  el: TBeamElement,
  ui: ModelAnalysisUI | undefined,
  min: number,
  max: number,
  font?: Font
) {
  const members =
    ui?.members.filter((m) => replaceSplitNumber(m.name) === el.name) ?? [];
  const checks =
    (project.mode === "stressCheck"
      ? ui?.memberStressChecks
      : ui?.deflectionChecks) ?? [];
  const nodes = ui?.nodes ?? {};
  const elements = ui?.beamElements ?? {};
  const meshes: Mesh[] = [];
  const defualtRotationX = getDefaultRotation(el.profile);
  const offset = Math.max(
    MMtoM(el.profile.bf_global ?? 0),
    MMtoM(el.profile.d_global ?? 0)
  );
  for (const member of members) {
    const element = elements[member.label];
    if (!element) continue;
    const node1 = nodes[element.nodes[0]];
    const node2 = nodes[element.nodes[1]];
    if (!node1 || !node2) continue;
    const check = checks.find((c) => c.elementNumber === member.label);
    const color = getColor(check, min, max);
    const start = globalToLocal(
      model.startPos,
      new Vector3(node1.x, node1.y, node1.z).divideScalar(1000),
      model.direction
    );
    const end = globalToLocal(
      model.startPos,
      new Vector3(node2.x, node2.y, node2.z).divideScalar(1000),
      model.direction
    );
    const d = start.distanceTo(end);
    const mesh = createElementByProfile(
      d,
      color,
      el.profile,
      undefined,
      defualtRotationX
    );
    (mesh.material as MeshLambertMaterial).setValues({
      transparent: project.settings.analysis.transparensyOfColors < 1,
      opacity: project.settings.analysis.transparensyOfColors,
    });
    mesh.position.copy(start);
    mesh.lookAt(end);
    mesh.rotateY(-deg90InRad);
    mesh.position.add(end).divideScalar(2);
    if (project.settings.analysis.showLabels) {
      const txtM = new Vector3(0, offset, offset - 0.002);
      createText(
        mesh,
        font,
        `${member.label}:${member.name}`,
        txtM,
        0,
        0,
        "darkgray"
      );
    }
    if (project.settings.analysis.showNodes) {
      const txtS = new Vector3(-d / 2, offset, offset + 0.002);
      const txtE = new Vector3(d / 2, offset, offset + 0.002);
      createText(mesh, font, `${node1.nodeNumber}`, txtS, 0, 0, "lightgray");
      createText(mesh, font, `${node2.nodeNumber}`, txtE, 0, 0, "lightgray");
    }
    meshes.push(mesh);
  }
  return meshes;
}

function drawColumn(
  project: Project,
  ui: ProjectUI | undefined,
  model: TOpenFrame,
  item: TColumnOF,
  isGray?: boolean,
  anchor?: { BP: boolean; SF: boolean }
) {
  const isAxesHelper =
    project.settings.models.axesHelper === "ALL" ||
    project.settings.models.axesHelper === item.name;

  const defualtRotationX = getDefaultRotation(item.profile);

  const start = new Vector3(item.startPos.x, item.startPos.y, item.startPos.z);
  const end = new Vector3(item.endPos.x, item.endPos.y, item.endPos.z);

  if (ui && item.uiId !== undefined) {
    const column = ui.openFrameUI.additionalBeams.columns.find(
      (column) => column.id === item.uiId
    );
    if (column && column.upperBeam) {
      const beam = model.beams.find((beam) => beam.name === column.upperBeam);
      if (beam) {
        const shape = beam.profile.shape?.toUpperCase().trim();
        if (shape === "I" || shape === "C") {
          const width = MMtoM(beam.profile.bf_global ?? 0);
          const height = MMtoM(beam.profile.d_global ?? 0);
          switch (beam.orientation) {
            case 0:
            case 180:
              end.setY(end.y - height);
              break;
            case 90:
            case 270:
              end.setY(end.y - width);
              break;
            default: {
              const a = width + height;
              const b = Math.sqrt(2 * Math.pow(a, 2)) / 2;
              const offset = Math.sqrt(Math.pow(a, 2) - Math.pow(b, 2));
              end.setY(end.y - offset);
            }
          }
        }
      }
    }
  }

  const mesh = createElementByProfile(
    start.distanceTo(end),
    isGray ? gray : model.palette?.COLUMN ?? columnColorRGB,
    item.profile,
    isAxesHelper,
    defualtRotationX
  );
  mesh.name = item.name;
  mesh.position.addVectors(start, end).divideScalar(2);
  mesh.rotateZ(deg90InRad);
  mesh.rotateX(deg90InRad + defualtRotationX);
  if (item.orientation) mesh.rotateX(degToRad(item.orientation));
  mesh.userData = {
    project: project.name,
    model: model.name,
    isModelItem: true,
    name: item.name,
    modelStart: model.startPos,
    modelDir: model.direction,
    start: item.startPos,
    end: item.endPos,
    profile: item.profile,
    orientation: item.orientation,
    releases: item.releases,
    isAxesHelper,
  } as ModelItem;

  if (
    anchor?.BP &&
    !item.startConnected.length &&
    !model.rectangularBP.some((rbp) => rbp.column === item.name)
  ) {
    const anchorMesh = new Mesh(
      new SphereGeometry(0.5),
      new MeshBasicMaterial({
        color: "yellow",
        transparent: true,
        opacity: 0.5,
      })
    );
    anchorMesh.position.setX(-start.distanceTo(end) / 2);
    anchorMesh.name = "CONNECTION-ANCHOR";
    anchorMesh.userData = {
      model: model.name,
      element: item.name,
      subtype: item.profile.shape === "I" ? "rectangular" : "circular",
      isBeamConnection: true,
    };
    mesh.add(anchorMesh);
  } else if (
    anchor?.SF &&
    item.endConnected.some((ec) => model.columns.some((c) => c.name === ec)) &&
    !model.rectangularSF.some((rsf) => rsf.column === item.name)
  ) {
    const anchorMesh = new Mesh(
      new SphereGeometry(0.5),
      new MeshBasicMaterial({
        color: "yellow",
        transparent: true,
        opacity: 0.5,
      })
    );
    anchorMesh.position.setX(start.distanceTo(end) / 2);
    anchorMesh.name = "CONNECTION-ANCHOR";
    anchorMesh.userData = {
      model: model.name,
      element: item.name,
      subtype: item.profile.shape === "I" ? "rectangular" : "circular",
      isBeamConnection: true,
    };
    mesh.add(anchorMesh);
  }

  return mesh;
}

function drawBeam(
  project: Project,
  ui: ProjectUI | undefined,
  model: TOpenFrame,
  item: TBeamOF,
  accessoryOrientation?: Orientation,
  isGray?: boolean,
  anchor?: { BB: boolean; BC: boolean }
) {
  const isAxesHelper =
    project.settings.models.axesHelper === "ALL" ||
    project.settings.models.axesHelper === item.name;

  const defualtRotationX = getDefaultRotation(item.profile);

  const start = new Vector3(item.startPos.x, item.startPos.y, item.startPos.z);
  const end = new Vector3(item.endPos.x, item.endPos.y, item.endPos.z);

  fixPointsOfBeamElement(start, end, model, item, true);
  if (
    accessoryOrientation &&
    [45, 135, 225, 315].includes(accessoryOrientation)
  ) {
    start.copy(
      fixVectorByOrientation(
        item.startPos,
        start,
        accessoryOrientation === 45 || accessoryOrientation === 225 ? 45 : -45
      )
    );
  }
  fixPointsOfBeamElement(start, end, model, item);
  const mesh = createElementByProfile(
    start.distanceTo(end),
    isGray ? gray : model.palette?.BEAM ?? beamColorRGB,
    item.profile,
    isAxesHelper,
    defualtRotationX
  );
  mesh.name = item.name;
  mesh.position.add(start);
  mesh.lookAt(end);
  mesh.position.add(end).divideScalar(2);
  mesh.rotateY(-deg90InRad);
  fixElevationOfBeamElement(item, mesh, mesh.position);
  mesh.rotateX(defualtRotationX);
  if (item.orientation) mesh.rotateX(degToRad(item.orientation));
  mesh.userData = {
    project: project.name,
    model: model.name,
    isModelItem: true,
    name: item.name,
    modelStart: model.startPos,
    modelDir: model.direction,
    start: item.startPos,
    end: item.endPos,
    profile: item.profile,
    orientation: item.orientation,
    releases: item.releases,
    isAxesHelper,
  } as ModelItem;
  if (anchor?.BB) {
    if (
      model.beams.some(
        (b) =>
          item.startConnected.includes(b.name) &&
          !item.startConnected.some((val) => val.startsWith("C"))
      ) &&
      !model.beamToBeamConnections?.some(
        (bbc) => bbc.parent === item.name && bbc.position === "START"
      )
    ) {
      const anchorMesh = new Mesh(
        new SphereGeometry(0.5),
        new MeshBasicMaterial({
          color: "yellow",
          transparent: true,
          opacity: 0.5,
        })
      );
      anchorMesh.position.setX(-start.distanceTo(end) / 2);
      anchorMesh.name = "CONNECTION-ANCHOR";
      anchorMesh.userData = {
        model: model.name,
        element: item.name,
        position: "START",
        isBeamConnection: true,
      };
      mesh.add(anchorMesh);
    }
    if (
      model.beams.some(
        (b) =>
          item.endConnected.includes(b.name) &&
          !item.endConnected.some((val) => val.startsWith("C"))
      ) &&
      !model.beamToBeamConnections?.some(
        (bbc) => bbc.parent === item.name && bbc.position === "END"
      )
    ) {
      const anchorMesh = new Mesh(
        new SphereGeometry(0.5),
        new MeshBasicMaterial({
          color: "yellow",
          transparent: true,
          opacity: 0.5,
        })
      );
      anchorMesh.position.setX(start.distanceTo(end) / 2);
      anchorMesh.name = "CONNECTION-ANCHOR";
      anchorMesh.userData = {
        model: model.name,
        element: item.name,
        position: "END",
        isBeamConnection: true,
      };
      mesh.add(anchorMesh);
    }
  } else if (anchor?.BC) {
    if (
      model.columns.some((c) => item.startConnected.includes(c.name)) &&
      !model.beamToColumnConnections?.some(
        (bcc) => bcc.parent === item.name && bcc.position === "START"
      )
    ) {
      const anchorMesh = new Mesh(
        new SphereGeometry(0.5),
        new MeshBasicMaterial({
          color: "yellow",
          transparent: true,
          opacity: 0.5,
        })
      );
      anchorMesh.position.setX(-start.distanceTo(end) / 2);
      anchorMesh.name = "CONNECTION-ANCHOR";
      anchorMesh.userData = {
        model: model.name,
        element: item.name,
        position: "START",
        isBeamConnection: true,
      };
      mesh.add(anchorMesh);
    }
    if (
      model.columns.some((c) => item.endConnected.includes(c.name)) &&
      !model.beamToColumnConnections?.some(
        (bcc) => bcc.parent === item.name && bcc.position === "END"
      )
    ) {
      const anchorMesh = new Mesh(
        new SphereGeometry(0.5),
        new MeshBasicMaterial({
          color: "yellow",
          transparent: true,
          opacity: 0.5,
        })
      );
      anchorMesh.position.setX(start.distanceTo(end) / 2);
      anchorMesh.name = "CONNECTION-ANCHOR";
      anchorMesh.userData = {
        model: model.name,
        element: item.name,
        position: "END",
        isBeamConnection: true,
      };
      mesh.add(anchorMesh);
    }
  }
  return mesh;
}

function drawCantilever(
  project: Project,
  ui: ProjectUI | undefined,
  model: TOpenFrame,
  item: TCantileverOF,
  isGray?: boolean
) {
  const isAxesHelper =
    project.settings.models.axesHelper === "ALL" ||
    project.settings.models.axesHelper === item.name;

  const defualtRotationX = getDefaultRotation(item.profile);

  const start = new Vector3(item.startPos.x, item.startPos.y, item.startPos.z);
  const end = new Vector3(item.endPos.x, item.endPos.y, item.endPos.z);

  fixPointsOfBeamElement(start, end, model, item, true);
  fixPointsOfBeamElement(start, end, model, item);
  const mesh = createElementByProfile(
    start.distanceTo(end),
    isGray ? gray : model.palette?.CANTILEVER ?? beamColorRGB,
    item.profile,
    isAxesHelper,
    defualtRotationX
  );
  mesh.name = item.name;
  mesh.position.add(start);
  mesh.lookAt(end);
  mesh.position.add(end).divideScalar(2);
  mesh.rotateY(-deg90InRad);
  fixElevationOfBeamElement(item, mesh, mesh.position);
  mesh.rotateX(defualtRotationX);
  if (item.orientation) mesh.rotateX(degToRad(item.orientation));
  mesh.userData = {
    project: project.name,
    model: model.name,
    isModelItem: true,
    name: item.name,
    modelStart: model.startPos,
    modelDir: model.direction,
    start: item.startPos,
    end: item.endPos,
    profile: item.profile,
    orientation: item.orientation,
    releases: item.releases,
    isAxesHelper,
  } as ModelItem;
  return mesh;
}

function drawBracing(
  project: Project,
  ui: ProjectUI | undefined,
  model: TOpenFrame,
  item: TKneeBracingOF | TVerticalBracingOF | THorizontalBracingOF,
  isGray?: boolean,
  anchor?: { HB: boolean; VB: boolean; KB: boolean }
) {
  const isAxesHelper =
    project.settings.models.axesHelper === "ALL" ||
    project.settings.models.axesHelper === item.name;

  let startPos: Vector3, endPos: Vector3;
  // @ts-ignore
  if (!item.isUp) {
    startPos = item.startPos.clone().add(new Vector3(0, -0.25, 0));
    endPos = item.endPos.clone().add(new Vector3(0, -0.1, 0));
  } else {
    startPos = item.startPos.clone().add(new Vector3(0, -0.1, 0));
    endPos = item.endPos.clone().add(new Vector3(0, -0.25, 0));
  }

  const defualtRotationX = getDefaultRotation(item.profile);

  let hasStartConnection: boolean = false;
  let hasEndConnection: boolean = false;
  if (model.vBracingConnections)
    for (const connection of model.vBracingConnections) {
      if (connection.parent === item.name && connection.position === "START") {
        hasStartConnection = true;
      }
      if (connection.parent === item.name && connection.position === "END") {
        hasEndConnection = true;
      }
    }
  const length = item.startPos.distanceTo(item.endPos);

  const mesh = createElementByProfile(
    (length * (6 - (hasStartConnection ? 1 : 0) - (hasEndConnection ? 1 : 0))) /
      6,
    !isGray
      ? (model.palette && model.palette[item.type]) ||
          (item.type === "HORIZONTAL-BRACING"
            ? hBracingColorRGB
            : vBracingColorRGB)
      : gray,
    item.profile,
    isAxesHelper,
    defualtRotationX
  );
  mesh.name = item.name;
  mesh.position.add(startPos);
  mesh.lookAt(endPos);

  const direction = new Vector3().subVectors(endPos, startPos).normalize();

  // Set the distance you want to move
  let distance = length / 6; // Replace with the distance you want the mesh to move

  if (hasStartConnection && !hasEndConnection) {
    distance = 1;
  }

  if (!hasStartConnection && hasEndConnection) {
    distance = -1;
  }

  if (
    (hasStartConnection && hasEndConnection) ||
    (!hasStartConnection && !hasEndConnection)
  ) {
    distance = 0;
  }

  // Calculate the movement vector
  const movement = direction.multiplyScalar(distance);

  // Move the mesh
  mesh.position.add(movement);

  // Keep the mesh looking at endPos
  mesh.lookAt(endPos);

  mesh.position.add(endPos).divideScalar(2);

  const isToStr = (item as THorizontalBracingOF).connectedTo === "STAIRCASE";
  if (item.type === "HORIZONTAL-BRACING" && !isToStr) {
    fixElevationOfBeamElement(item, mesh, mesh.position);
  }
  mesh.rotateY(-deg90InRad);
  mesh.rotateX(defualtRotationX);
  if (item.orientation) mesh.rotateX(degToRad(item.orientation));
  mesh.userData = {
    project: project.name,
    model: model.name,
    isModelItem: true,
    name: item.name,
    modelStart: model.startPos,
    modelDir: model.direction,
    start: item.startPos,
    end: item.endPos,
    profile: item.profile,
    orientation: item.orientation,
    releases: item.releases,
    isAxesHelper,
  } as ModelItem;
  if (item.type === "HORIZONTAL-BRACING" && anchor?.HB) {
    if (
      !model.hBracingConnections?.some(
        (bbc) => bbc.parent === item.name && bbc.position === "START"
      )
    ) {
      const anchorMesh = new Mesh(
        new SphereGeometry(0.5),
        new MeshBasicMaterial({
          color: "yellow",
          transparent: true,
          opacity: 0.5,
        })
      );
      anchorMesh.position.setX(-item.startPos.distanceTo(item.endPos) / 2);
      anchorMesh.name = "CONNECTION-ANCHOR";
      anchorMesh.userData = {
        model: model.name,
        element: item.name,
        position: "START",
        isBeamConnection: true,
      };
      mesh.add(anchorMesh);
    }
    if (
      !model.hBracingConnections?.some(
        (hbc) => hbc.parent === item.name && hbc.position === "END"
      )
    ) {
      const anchorMesh = new Mesh(
        new SphereGeometry(0.5),
        new MeshBasicMaterial({
          color: "yellow",
          transparent: true,
          opacity: 0.5,
        })
      );
      anchorMesh.position.setX(item.startPos.distanceTo(item.endPos) / 2);
      anchorMesh.name = "CONNECTION-ANCHOR";
      anchorMesh.userData = {
        model: model.name,
        element: item.name,
        position: "END",
        isBeamConnection: true,
      };
      mesh.add(anchorMesh);
    }
  } else if (item.type === "VERTICAL-BRACING" && anchor?.VB) {
    if (
      !model.vBracingConnections?.some(
        (vbc) => vbc.parent === item.name && vbc.position === "START"
      )
    ) {
      const anchorMesh = new Mesh(
        new SphereGeometry(0.5),
        new MeshBasicMaterial({
          color: "yellow",
          transparent: true,
          opacity: 0.5,
        })
      );
      anchorMesh.position.setX(-item.startPos.distanceTo(item.endPos) / 2);
      anchorMesh.name = "CONNECTION-ANCHOR";
      anchorMesh.userData = {
        model: model.name,
        element: item.name,
        position: "START",
        isBeamConnection: true,
      };
      mesh.add(anchorMesh);
    }
    if (
      !model.vBracingConnections?.some(
        (vbc) => vbc.parent === item.name && vbc.position === "END"
      )
    ) {
      const anchorMesh = new Mesh(
        new SphereGeometry(0.5),
        new MeshBasicMaterial({
          color: "yellow",
          transparent: true,
          opacity: 0.5,
        })
      );
      anchorMesh.position.setX(item.startPos.distanceTo(item.endPos) / 2);
      anchorMesh.name = "CONNECTION-ANCHOR";
      anchorMesh.userData = {
        model: model.name,
        element: item.name,
        position: "END",
        isBeamConnection: true,
      };
      mesh.add(anchorMesh);
    }
  } else if (item.type === "KNEE-BRACING" && anchor?.KB) {
    if (
      !model.kBracingConnections?.some(
        (kbc) => kbc.parent === item.name && kbc.position === "START"
      )
    ) {
      const anchorMesh = new Mesh(
        new SphereGeometry(0.5),
        new MeshBasicMaterial({
          color: "yellow",
          transparent: true,
          opacity: 0.5,
        })
      );
      anchorMesh.position.setX(-item.startPos.distanceTo(item.endPos) / 2);
      anchorMesh.name = "CONNECTION-ANCHOR";
      anchorMesh.userData = {
        model: model.name,
        element: item.name,
        position: "START",
        isBeamConnection: true,
      };
      mesh.add(anchorMesh);
    }
    if (
      !model.kBracingConnections?.some(
        (kbc) => kbc.parent === item.name && kbc.position === "END"
      )
    ) {
      const anchorMesh = new Mesh(
        new SphereGeometry(0.5),
        new MeshBasicMaterial({
          color: "yellow",
          transparent: true,
          opacity: 0.5,
        })
      );
      anchorMesh.position.setX(item.startPos.distanceTo(item.endPos) / 2);
      anchorMesh.name = "CONNECTION-ANCHOR";
      anchorMesh.userData = {
        model: model.name,
        element: item.name,
        position: "END",
        isBeamConnection: true,
      };
      mesh.add(anchorMesh);
    }
  }
  return mesh;
}

function drawStaircase(
  project: Project,
  ui: ProjectUI | undefined,
  model: TOpenFrame,
  item: TStaircaseOF,
  isGray?: boolean
) {
  const rugsGroup = new Group();
  const isAxesHelper =
    project.settings.models.axesHelper === "ALL" ||
    project.settings.models.axesHelper === item.name;
  const defualtRotationX = getDefaultRotation(item.profile);
  const mesh = createElementByProfile(
    item.startPos.distanceTo(item.endPos),
    isGray ? gray : model.palette?.STAIRCASE ?? beamColorRGB,
    item.profile,
    isAxesHelper,
    defualtRotationX
  );

  const stairUI = ui?.openFrameUI.additionalBeams.staircases.find(
    (ui) => ui.id === item.uiId
  );
  const rugWidth = stairUI?.rugWidth ?? 0.5;
  const rugThickness = stairUI?.rugThickness ?? 0.1;
  const rugs = stairUI?.rugs ?? 0;

  const offset =
    (item.orientation === 0 || item.orientation === 180
      ? MMtoM(item.profile?.bf_global ?? 0)
      : MMtoM(item.profile?.d_global ?? 0)) / 2;
  mesh.name = item.name;
  mesh.position.add(item.startPos);
  mesh.lookAt(item.endPos);
  mesh.position.add(item.endPos).divideScalar(2);

  if (rugs > 0 && item.position === "L") {
    const scalar = item.endPos
      .clone()
      .sub(item.startPos.clone())
      .divideScalar(rugs);
    for (let i = 0; i < rugs; i++) {
      const pos = scalar.clone().multiplyScalar(i);
      const rugMesh = new Mesh(
        new THREE.BoxGeometry(
          (stairUI?.distance ?? 0) * 2,
          rugThickness,
          rugWidth
        ),
        new MeshPhongMaterial({ color: getRGB(beamColorRGB) })
      );
      rugMesh.position.copy(pos);
      if (!item.toX) rugMesh.translateZ(stairUI?.distance ?? 0);
      else rugMesh.translateX(stairUI?.distance ?? 0);

      if (!item.toX) {
        rugMesh.rotateY(deg90InRad);
      }
      rugsGroup.add(rugMesh);
    }
    rugsGroup.position.add(item.startPos);
    rugsGroup.position.add(item.endPos).divideScalar(2);
    rugsGroup.position.sub(
      item.endPos
        .clone()
        .sub(item.startPos.clone())
        .divideScalar(2)
    );
  }

  if (item.toX) {
    mesh.position.setX(
      mesh.position.x + (item.position === "L" ? -offset : offset)
    );
  } else {
    mesh.position.setZ(
      mesh.position.z + (item.position === "L" ? -offset : offset)
    );
  }
  mesh.rotateY(-deg90InRad);
  mesh.rotateX(defualtRotationX);
  const o = item.orientation ?? 0;

  if (item.position === "L") {
    mesh.rotateX(degToRad(item.direction ? 180 - o : 0 + o));
  } else {
    mesh.rotateX(degToRad(item.direction ? 0 + o : 180 - o));
  }

  mesh.userData = {
    project: project.name,
    model: model.name,
    isModelItem: true,
    name: item.name,
    modelStart: model.startPos,
    modelDir: model.direction,
    start: item.startPos,
    end: item.endPos,
    profile: item.profile,
    orientation: item.orientation,
    releases: item.releases,
    isAxesHelper,
  } as ModelItem;
  if (item.position === "R") return mesh;
  else {
    const group = new Group();
    group.add(mesh);
    group.add(rugsGroup);
    return group;
  }
}

function drawAccessoriesElements(
  project: Project,
  ui: ProjectUI | undefined,
  model: TOpenFrame,
  element: TTPElementOF | TFPElementOF | TCTElementOF,
  orientation: Orientation,
  analysis?: ModelAnalysisUI | undefined,
  min = 0.3,
  max = 1,
  isGray?: boolean,
  font?: Font
) {
  const group = new Group();
  group.name = element.name;
  group.position.add(element.position);
  // group.rotateY(degToRad(orientation));
  for (const item of element.columns) {
    const column = getElementByName(model.columns, item);
    if (!column) continue;
    let colored: Mesh[] = [];
    if (analysis) {
      colored = drawColoredElement(
        project,
        model,
        column,
        analysis,
        min,
        max,
        font
      );
    }
    const columnMesh = drawColumn(project, ui, model, column, isGray);
    columnMesh.position.sub(group.position);
    columnMesh.rotateX(degToRad(orientation));
    group.add(columnMesh);
  }
  for (const item of element.beams) {
    const beam = getElementByName(model.beams, item);
    if (!beam) continue;
    let colored: Mesh[] = [];
    if (analysis) {
      colored = drawColoredElement(
        project,
        model,
        beam,
        analysis,
        min,
        max,
        font
      );
    }
    const beamMesh = drawBeam(project, ui, model, beam, orientation, isGray);
    beamMesh.position.sub(group.position);
    group.add(beamMesh);
  }
  return group;
}

export function getMaxAndMinPoints(from: TBeamElement, to: TBeamElement) {
  const minV = new Vector3(0, roundM(from.startPos.y), 0);
  const maxV = new Vector3(0, roundM(from.startPos.y), 0);
  const fromD = getDirection(from.startPos, from.endPos) as Direction2;
  const toD = getDirection(to.startPos, to.endPos) as Direction2;
  switch (fromD) {
    case "+X":
      switch (toD) {
        case "+X":
          minV
            .setX(Math.max(from.startPos.x, to.startPos.x))
            .setZ(Math.min(from.startPos.z, to.startPos.z));
          maxV
            .setX(Math.min(from.endPos.x, to.endPos.x))
            .setZ(Math.max(from.startPos.z, to.startPos.z));
          break;
        case "-X":
          minV
            .setX(Math.max(from.startPos.x, to.endPos.x))
            .setZ(Math.min(from.startPos.z, to.startPos.z));
          maxV
            .setX(Math.min(from.endPos.x, to.startPos.x))
            .setZ(Math.max(from.startPos.z, to.startPos.z));
          break;
      }
      break;
    case "-X":
      switch (toD) {
        case "+X":
          minV
            .setX(Math.max(from.endPos.x, to.startPos.x))
            .setZ(Math.min(from.startPos.z, to.startPos.z));
          maxV
            .setX(Math.min(from.startPos.x, to.endPos.x))
            .setZ(Math.max(from.startPos.z, to.startPos.z));
          break;
        case "-X":
          minV
            .setX(Math.max(from.endPos.x, to.endPos.x))
            .setZ(Math.min(from.startPos.z, to.startPos.z));
          maxV
            .setX(Math.min(from.startPos.x, to.startPos.x))
            .setZ(Math.max(from.startPos.z, to.startPos.z));
          break;
      }
      break;
    case "+Z":
      switch (toD) {
        case "+Z":
          minV
            .setX(Math.min(from.startPos.x, to.startPos.x))
            .setZ(Math.max(from.startPos.z, to.startPos.z));
          maxV
            .setX(Math.max(from.startPos.x, to.startPos.x))
            .setZ(Math.min(from.endPos.z, to.endPos.z));
          break;
        case "-Z":
          minV
            .setX(Math.min(from.startPos.x, to.startPos.x))
            .setZ(Math.max(from.startPos.z, to.endPos.z));
          maxV
            .setX(Math.max(from.startPos.x, to.startPos.x))
            .setZ(Math.min(from.endPos.z, to.startPos.z));
          break;
      }
      break;
    case "-Z":
      switch (toD) {
        case "+Z":
          minV
            .setX(Math.min(from.startPos.x, to.startPos.x))
            .setZ(Math.max(from.endPos.z, to.startPos.z));
          maxV
            .setX(Math.max(from.startPos.x, to.startPos.x))
            .setZ(Math.min(from.startPos.z, to.endPos.z));
          break;
        case "-Z":
          minV
            .setX(Math.min(from.startPos.x, to.startPos.x))
            .setZ(Math.max(from.endPos.z, to.endPos.z));
          maxV
            .setX(Math.max(from.startPos.x, to.startPos.x))
            .setZ(Math.min(from.startPos.z, to.startPos.z));
          break;
      }
      break;
  }
  return { minV: roundVectorM(minV), maxV: roundVectorM(maxV), fromD, toD };
}

export function drawCircularBasePlate(
  bp: TCBasePlateOF,
  column: TColumnOF,
  fixedBolt?: boolean
) {
  const columnR = MMtoM(column.profile.d_global ?? 0) / 2;
  const plateR = MMtoM(bp.plateDiameter) / 2;
  const plateOffsetY = MMtoM(bp.plateThickness) / 2;
  const boltAngleRad = degToRad(360 / bp.boltNos);
  const boltR = MMtoM(bp.anchorBoltDiameter) / 2;
  const boltH = boltR * 3;
  const bsdR = MMtoM(bp.boltBCD) / 2;
  const stiffenerAngleRad = degToRad(360 / bp.stiffenerNos);
  const width = plateR - columnR;
  const height = MMtoM(bp.stiffenerHeight);
  const depth = MMtoM(bp.stiffenerThickness);
  const plate = new Mesh(
    new CylinderBufferGeometry(plateR, plateR, plateOffsetY * 2, 32),
    new MeshStandardMaterial({ color: getRGB(pedestalColor) })
  );
  plate.position.copy(column.startPos).setY(plateOffsetY);
  plate.name = bp.name;
  for (let i = 0; i < bp.boltNos; i++) {
    plate.add(
      drawCircularBoltGroup(
        i,
        boltR,
        boltH,
        bsdR,
        boltAngleRad,
        plateOffsetY,
        fixedBolt
      )
    );
  }
  if (width > 0) {
    for (let i = 0; i < bp.stiffenerNos; i++) {
      plate.add(
        drawCircularStiffener(
          i,
          columnR,
          plateOffsetY,
          stiffenerAngleRad,
          width,
          height,
          depth
        )
      );
    }
  }
  return plate;
}

export function drawRawCircularBasePlate(
  name: string,
  position: Vector3,
  columnR: number,
  plateR: number,
  plateThickness: number,
  boltNos: number,
  boltBCD: number,
  stiffenerNos: number,
  stiffenerHeight: number,
  stiffenerThickness: number
) {
  const plateOffsetY = plateThickness / 2;
  const boltAngleRad = degToRad(360 / boltNos);
  const boltR = columnR / boltNos / 2;
  const boltH = boltR * 3;
  const bsdR = boltBCD / 2;
  const stiffenerAngleRad = degToRad(360 / stiffenerNos);
  const width = plateR - columnR;
  const height = stiffenerHeight;
  const depth = stiffenerThickness;
  const plate = new Mesh(
    new CylinderBufferGeometry(plateR, plateR, plateOffsetY * 2, 32),
    new MeshStandardMaterial({ color: getRGB(pedestalColor) })
  );
  plate.position.copy(position).setY(position.y + plateOffsetY);
  plate.name = `${name}_BASE_PLATE`;
  for (let i = 0; i < boltNos; i++) {
    plate.add(
      drawCircularBoltGroup(
        i,
        boltR,
        boltH,
        bsdR,
        boltAngleRad,
        plateOffsetY,
        false
      )
    );
  }
  if (width > 0) {
    for (let i = 0; i < stiffenerNos; i++) {
      plate.add(
        drawCircularStiffener(
          i,
          columnR,
          plateOffsetY,
          stiffenerAngleRad,
          width,
          height,
          depth
        )
      );
    }
  }
  return plate;
}
function drawCircularBoltGroup(
  i: number,
  boltR: number,
  boltH: number,
  bsdR: number,
  boltAngleRad: number,
  plateOffsetY: number,
  fixedBolt?: boolean
) {
  const boltGroup = new Mesh();
  boltGroup.name = `BG${i + 1}`;
  if (fixedBolt) {
    const g1 = new Mesh(
      new CylinderBufferGeometry(boltR * 2, boltR * 2, boltR),
      new MeshStandardMaterial({ color: fixRGB(pedestalColor) })
    );
    g1.name = `G1`;
    g1.position.setX(bsdR);
    g1.position.setY(boltR / 2);
    boltGroup.add(g1);
  } else {
    const bolt = new Mesh(
      new CylinderBufferGeometry(boltR, boltR, boltH),
      new MeshStandardMaterial({ color: fixRGB(pedestalColor) })
    );
    bolt.name = `Bolt${i + 1}`;
    bolt.position.setX(bsdR);
    bolt.position.setY(boltH / 2);
    const g1 = new Mesh(
      new CylinderBufferGeometry(boltR * 2, boltR * 2, boltR),
      new MeshStandardMaterial({ color: fixRGB(pedestalColor) })
    );
    g1.name = `${bolt.name}-G1`;
    g1.position.setX(bsdR);
    g1.position.setY(boltR / 2);
    const g2 = new Mesh(
      new CylinderBufferGeometry(boltR * 2, boltR * 2, boltR),
      new MeshStandardMaterial({ color: fixRGB(pedestalColor) })
    );
    g2.name = `${bolt.name}-G2`;
    g2.position.setX(bsdR);
    g2.position.setY(boltR * 1.5);
    boltGroup.add(bolt, g1, g2);
  }
  boltGroup.rotateY((i + 1) * boltAngleRad - boltAngleRad / 2);
  boltGroup.position.setY(plateOffsetY);
  return boltGroup;
}

function drawCircularStiffener(
  i: number,
  columnR: number,
  plateOffsetY: number,
  stiffenerAngleRad: number,
  width: number,
  height: number,
  depth: number
) {
  const stiffenerGroup = new Mesh();
  stiffenerGroup.name = `SG${i + 1}`;
  const stiffener = drawStiffener(width, height, depth);
  stiffener.name = `${stiffenerGroup.name}-S`;
  stiffener.position.set(columnR, plateOffsetY, depth / -2);
  stiffenerGroup.add(stiffener);
  stiffenerGroup.rotateY(i * stiffenerAngleRad);
  return stiffenerGroup;
}

function drawStiffener(width: number, height: number, depth: number) {
  const shape = new Shape();
  shape.moveTo(0, 0);
  shape.lineTo(width, 0);
  shape.lineTo(width, 0.025);
  shape.lineTo(0.025, height);
  shape.lineTo(0, height);
  shape.autoClose = true;
  return new Mesh(
    new ExtrudeBufferGeometry(shape, { depth, bevelEnabled: false, steps: 1 }),
    new MeshStandardMaterial({ color: fixRGB(pedestalColor) })
  );
}

// function drawVBracingConnection(
//   item: TBoldedConn,
//   vBracing: TVerticalBracingOF,
//   column: TColumnOF,
//   beam: TBeamOF
// ) {
//   const plateGroup = new Mesh();

//   const plateW = MMtoM(item.widthOfPlate);
//   const plateT = MMtoM(item.thiknessOfGusset);
//   const plateL = MMtoM(item.lengthOfPlate);
//   const plate1 = new Mesh(
//     new BoxBufferGeometry(plateL, plateT, plateW),
//     new MeshStandardMaterial({ color: getRGB(pedestalColor) })
//   );
//   // const depthOffset = MMtoM(beam.profile.d_global ?? 0) / 2.0;
//   const columnWidthOffset = MMtoM(column.profile.bf_global ?? 0) / 2.0 + plateT;
//   const columnHeightOffset = MMtoM(column.profile.d_global ?? 0) / 2.0 + plateT;
//   // const innerWidthOffset = MMtoM(beam.profile.ct_global ?? 0) / 2.0 + plateT;
//   // const widthOffset = innerWidthOffset + plateW / 2;
//   plate1.position.copy(item.position === "START" ? beam.startPos : beam.endPos);
//   plate1.translateX(-columnHeightOffset);
//   plate1.translateY(plateL / 2);
//   plate1.rotateZ(deg90InRad + degToRad(beam.orientation ?? 0));
//   // plate1.`
//   const boltR = MMtoM(item.boltDiameter) / 2.0;
//   const boltH = boltR * 3;
//   plate1.add(...drawRectangularBoltOnBeamToBeam(boltR, boltH, 0, item, false));

//   plateGroup.add(plate1);
//   return plateGroup;
// }

function drawBeamToBeamConnection(
  bb: TBoldedConn,
  beam: TBeamOF,
  beamTwo: TBeamOF,
  fixedBolt?: boolean
) {
  const plateW = MMtoM(bb.widthOfPlate);
  const plateT = MMtoM(bb.thiknessOfGusset);
  const plateL = MMtoM(
    Math.min(
      bb.lengthOfPlate,
      (beam.profile.d_global ?? Number.POSITIVE_INFINITY) -
        (beam.profile.ct_global ?? 0) * 2
    )
  );

  const plateGroup = new Mesh();
  const plate1 = new Mesh(
    new BoxBufferGeometry(plateL, plateT, plateW),
    new MeshStandardMaterial({ color: getRGB(pedestalColor) })
  );
  plate1.position.copy(bb.position === "START" ? beam.startPos : beam.endPos);

  const boltR = MMtoM(bb.boltDiameter) / 2.0;
  const boltH = boltR * 3;
  plate1.add(
    ...drawRectangularBoltOnBeamToBeam(boltR, boltH, 0, bb, fixedBolt)
  );
  let direction;
  if (beam.direction === "X" && bb.position === "START") {
    direction = "X";
  }
  if (beam.direction === "X" && bb.position === "END") {
    direction = "-X";
  }
  if (beam.direction === "Z" && bb.position === "START") {
    direction = "Z";
  }
  if (beam.direction === "Z" && bb.position === "END") {
    direction = "-Z";
  }

  const depthOffset = MMtoM(beam.profile.d_global ?? 0) / 2.0;
  const columnWidthOffset =
    MMtoM(beamTwo.profile.ct_global ?? 0) / 2.0 + plateT;
  const columnHeightOffset =
    MMtoM(beamTwo.profile.ct_global ?? 0) / 2.0 + plateT;
  const heightOffset =
    MMtoM(beam.profile.ct_global ?? 0) / 2.0 + plateW / 2 + plateT;
  const innerWidthOffset = MMtoM(beam.profile.ct_global ?? 0) / 2.0 + plateT;

  plate1.translateY(-depthOffset);
  if (direction === "X") {
    plate1.translateX(columnWidthOffset);
    plate1.rotateZ(-deg90InRad + degToRad(beam.orientation ?? 0));
  }
  if (direction === "-X") {
    plate1.translateX(-columnWidthOffset);
    plate1.rotateZ(deg90InRad + degToRad(beam.orientation ?? 0));
  }
  if (direction === "Z") {
    plate1.translateZ(columnHeightOffset);
    plate1.rotateY(deg90InRad + degToRad(beam.orientation ?? 0));
    plate1.rotateZ(deg90InRad + degToRad(beam.orientation ?? 0));
  }
  if (direction === "-Z") {
    plate1.translateZ(-columnHeightOffset);
    plate1.rotateY(deg90InRad + degToRad(beam.orientation ?? 0));
    plate1.rotateZ(-deg90InRad + degToRad(beam.orientation ?? 0));
  }

  const plate2 = plate1.clone();
  const plate3 = plate1.clone();
  plate1.translateZ(heightOffset);
  plate2.translateZ(-heightOffset);

  plate3.translateY(plateW / 2);

  if (direction === "X" || direction === "-X") {
    plate3.rotateX(deg90InRad + degToRad(beam.orientation ?? 0));
  }
  if (direction === "Z" || direction === "-Z") {
    plate3.rotateX(deg90InRad + degToRad(beam.orientation ?? 0));
  }

  const plate4 = plate3.clone();
  plate3.translateY(-innerWidthOffset);
  plate3.rotateX(deg180InRad);
  plate4.translateY(innerWidthOffset);

  plateGroup.add(plate1);
  plateGroup.add(plate2);
  plateGroup.add(plate3);
  plateGroup.add(plate4);
  return plateGroup;
}

function drawVBracingConnection(
  item: TBoldedConn,
  vBracing: TVerticalBracingOF,
  column: TColumnOF,
  beam: TBeamOF
) {
  const plateGroup = new Mesh();

  let startPos: Vector3, endPos: Vector3;
  // @ts-ignore
  if (!vBracing.isUp) {
    startPos = vBracing.startPos.clone().add(new Vector3(0, -0.25, 0));
    endPos = vBracing.endPos.clone().add(new Vector3(0, -0.1, 0));
  } else {
    startPos = vBracing.startPos.clone().add(new Vector3(0, -0.1, 0));
    endPos = vBracing.endPos.clone().add(new Vector3(0, -0.25, 0));
  }

  const plateW = MMtoM(item.widthOfPlate * 2);
  const plateT = MMtoM(item.thiknessOfGusset);
  const plateL = MMtoM(item.lengthOfPlate * 3);
  const plate1 = new Mesh(
    new BoxBufferGeometry((plateL * 4) / 3, plateT, plateW),
    new MeshStandardMaterial({ color: getRGB(pedestalColor) })
  );

  const depthOffset = MMtoM(beam.profile.d_global ?? 0) / 2.0;
  const columnWidthOffset = MMtoM(column.profile.bf_global ?? 0) / 2.0 + plateT;
  const columnHeightOffset = MMtoM(column.profile.d_global ?? 0) / 2.0 + plateT;
  const innerWidthOffset = MMtoM(beam.profile.ct_global ?? 0) / 2.0 + plateT;

  const bracingWidth = MMtoM(
    vBracing.profile.height_global ?? vBracing.profile.d_global ?? 0
  );
  // const widthOffset = innerWidthOffset + plateW / 2;
  const pos = item.position === "START" ? startPos : endPos;
  plate1.position.copy(pos);

  plate1.rotateZ(deg90InRad + degToRad(beam.orientation ?? 0));

  const boltR = MMtoM(item.boltDiameter) / 2.0;
  const boltH = boltR * 3;
  plate1.add(...drawRectangularBoltOnBeamToBeam(boltR, boltH, 0, item, false));

  const shape = new Shape();

  // // Start from the bottom left
  shape.moveTo(0, 0);

  // Draw lines to define the shape
  shape.lineTo(0 - (plateL * 3) / 4, 0); // height is the vertical size of your object
  shape.lineTo(0 - (plateL * 3) / 4, 0 - plateL / 3); // topWidth is the width of the top edge
  shape.lineTo(0 - plateL / 3, 0 - (plateL * 3) / 4); // bottomWidth is the width of the bottom edge
  shape.lineTo(0, 0 - (plateL * 3) / 4); // Close the shape

  const extrudeSettings = {
    steps: 1, // Number of points used for subdividing segments
    depth: plateT, // Depth to extrude the shape
    bevelEnabled: false, // Disable bevel
  };

  const plate3 = new Mesh(
    new BoxBufferGeometry(plateL / 2, plateT, bracingWidth),
    new MeshStandardMaterial({ color: getRGB(pedestalColor) })
  );

  plate3.position.add(endPos);

  plate3.lookAt(startPos);

  plate3.rotateY(deg90InRad + degToRad(vBracing.orientation ?? 0));
  plate3.rotateX(deg90InRad + degToRad(vBracing.orientation ?? 0));
  plate3.translateZ(-0.173);
  plate3.translateX(-0.6);

  const plate2 = new Mesh(
    new ExtrudeBufferGeometry(shape, extrudeSettings),
    new MeshStandardMaterial({ color: getRGB(pedestalColor) })
  );
  plate2.position.copy(
    item.position === "START" ? vBracing.startPos : vBracing.endPos
  );
  plateGroup.add(plate1);
  plateGroup.add(plate2);
  plateGroup.add(plate3);

  if (item.position === "END") {
    plateGroup.translateX(-columnHeightOffset);
  } else {
    plateGroup.translateX(columnHeightOffset);
  }
  // @ts-ignore
  if (vBracing.isUp) {
    plateGroup.translateY(-depthOffset * 2);
  } else {
    plateGroup.translateY(-depthOffset * 2);
  }
  return plateGroup;
}

function drawBeamToColumnConnection(
  bb: TBoldedConn,
  beam: TBeamOF,
  column: TColumnOF,
  fixedBolt?: boolean
) {
  const plateW = MMtoM(bb.widthOfPlate);
  const plateT = MMtoM(bb.thiknessOfGusset);
  const plateL = MMtoM(bb.lengthOfPlate);

  const plateGroup = new Mesh();
  const plate1 = new Mesh(
    new BoxBufferGeometry(plateL, plateT, plateW),
    new MeshStandardMaterial({ color: getRGB(pedestalColor) })
  );

  plate1.position.copy(bb.position === "START" ? beam.startPos : beam.endPos);

  const boltR = MMtoM(bb.boltDiameter) / 2.0;
  const boltH = boltR * 3;
  plate1.add(
    ...drawRectangularBoltOnBeamToBeam(boltR, boltH, 0, bb, fixedBolt)
  );
  let direction;
  if (beam.direction === "X" && bb.position === "START") {
    direction = "X";
  }
  if (beam.direction === "X" && bb.position === "END") {
    direction = "-X";
  }
  if (beam.direction === "Z" && bb.position === "START") {
    direction = "Z";
  }
  if (beam.direction === "Z" && bb.position === "END") {
    direction = "-Z";
  }

  const depthOffset = MMtoM(beam.profile.d_global ?? 0) / 2.0;
  const columnWidthOffset = MMtoM(column.profile.bf_global ?? 0) / 2.0 + plateT;
  const columnHeightOffset = MMtoM(column.profile.d_global ?? 0) / 2.0 + plateT;
  const innerWidthOffset = MMtoM(beam.profile.ct_global ?? 0) / 2.0 + plateT;
  const widthOffset = innerWidthOffset + plateW / 2;

  plate1.translateY(-depthOffset);
  if (direction === "X") {
    plate1.translateX(columnWidthOffset);
    plate1.rotateZ(-deg90InRad + degToRad(beam.orientation ?? 0));
  }
  if (direction === "-X") {
    plate1.translateX(-columnWidthOffset);
    plate1.rotateZ(deg90InRad + degToRad(beam.orientation ?? 0));
  }
  if (direction === "Z") {
    plate1.translateZ(columnHeightOffset);
    plate1.rotateY(deg90InRad + degToRad(beam.orientation ?? 0));
    plate1.rotateZ(deg90InRad + degToRad(beam.orientation ?? 0));
  }
  if (direction === "-Z") {
    plate1.translateZ(-columnHeightOffset);
    plate1.rotateY(deg90InRad + degToRad(beam.orientation ?? 0));
    plate1.rotateZ(-deg90InRad + degToRad(beam.orientation ?? 0));
  }

  const plate2 = plate1.clone();
  const plate3 = plate1.clone();
  plate1.translateZ(widthOffset);
  plate2.translateZ(-widthOffset);

  plate3.translateY(plateW / 2);

  if (direction === "X" || direction === "-X") {
    plate3.rotateX(deg90InRad + degToRad(beam.orientation ?? 0));
  }
  if (direction === "Z" || direction === "-Z") {
    plate3.rotateX(deg90InRad + degToRad(beam.orientation ?? 0));
  }

  const plate4 = plate3.clone();
  plate3.translateY(-innerWidthOffset);
  plate3.rotateX(deg180InRad);
  plate4.translateY(innerWidthOffset);

  plateGroup.add(plate1);
  plateGroup.add(plate2);
  plateGroup.add(plate3);
  plateGroup.add(plate4);
  return plateGroup;
}

export function drawRawRectangularBasePlate(
  name: string,
  position: Vector3,
  thicknessOffset: number,
  widthOffset: number,
  depthOffset: number,
  plateW: number,
  plateT: number,
  plateL: number,
  stiffenerH: number,
  stiffenerT: number,
  stiffenerAlongFlange: 1 | 2 | 3,
  stiffenerAlongWeb: 1 | 2 | 3
) {
  const boltR = MMtoM(plateW) / 40;
  const boltH = boltR * 3;

  const plate = new Mesh(
    new BoxBufferGeometry(plateL, plateT, plateW),
    new MeshStandardMaterial({ color: getRGB(pedestalColor) })
  );
  plate.position.copy(position).setY(position.y + plateT / 2);
  plate.name = `${name}_BASE_PLATE`;
  plate.add(...drawRectangularBolt(boltR, boltH, plateT / 2, undefined, false));
  plate.add(
    drawRectangularStiffener(
      plateL / 2 - depthOffset,
      stiffenerH,
      stiffenerT,
      depthOffset,
      widthOffset,
      thicknessOffset,
      plateT / 2,
      "+X",
      stiffenerAlongFlange
    ),
    drawRectangularStiffener(
      plateW / 2 - widthOffset,
      stiffenerH,
      stiffenerT,
      depthOffset,
      widthOffset,
      thicknessOffset,
      plateT / 2,
      "+Z",
      stiffenerAlongWeb
    ),
    drawRectangularStiffener(
      plateL / 2 - depthOffset,
      stiffenerH,
      stiffenerT,
      depthOffset,
      widthOffset,
      thicknessOffset,
      plateT / 2,
      "-X",
      stiffenerAlongFlange
    ),
    drawRectangularStiffener(
      plateW / 2 - widthOffset,
      stiffenerH,
      stiffenerT,
      depthOffset,
      widthOffset,
      thicknessOffset,
      plateT / 2,
      "-Z",
      stiffenerAlongWeb
    )
  );
  plate.rotateY(deg90InRad);
  return plate;
}
function drawRectangularBasePlate(
  bp: TRBasePlateOF | TRSpliceFlangeOF,
  column: TColumnOF,
  fixedBolt?: boolean
) {
  const thicknessOffset = MMtoM(column.profile.tw_global ?? 0) / 2;
  const widthOffset = MMtoM(column.profile.bf_global ?? 0) / 2;
  const depthOffset = MMtoM(column.profile.d_global ?? 0) / 2;

  const plateW = MMtoM(bp.plateWidth);
  const plateT = MMtoM(bp.plateThickness);
  const plateL = MMtoM(bp.plateLength);

  const boltR = MMtoM(bp.anchorBoltDiameter) / 2;
  const boltH = boltR * 3;

  const stiffenerH = MMtoM(bp.stiffenerHeight);
  const stiffenerT = MMtoM(bp.stiffenerThickness);

  const plate = new Mesh(
    new BoxBufferGeometry(plateL, plateT, plateW),
    new MeshStandardMaterial({ color: getRGB(pedestalColor) })
  );
  plate.position.copy(column.startPos).setY(plateT / 2);
  plate.name = bp.name;
  plate.add(...drawRectangularBolt(boltR, boltH, plateT / 2, bp, fixedBolt));
  plate.add(
    drawRectangularStiffener(
      plateL / 2 - depthOffset,
      stiffenerH,
      stiffenerT,
      depthOffset,
      widthOffset,
      thicknessOffset,
      plateT / 2,
      "+X",
      bp.stiffenerAlongFlange
    ),
    drawRectangularStiffener(
      plateW / 2 - widthOffset,
      stiffenerH,
      stiffenerT,
      depthOffset,
      widthOffset,
      thicknessOffset,
      plateT / 2,
      "+Z",
      bp.stiffenerAlongWeb
    ),
    drawRectangularStiffener(
      plateL / 2 - depthOffset,
      stiffenerH,
      stiffenerT,
      depthOffset,
      widthOffset,
      thicknessOffset,
      plateT / 2,
      "-X",
      bp.stiffenerAlongFlange
    ),
    drawRectangularStiffener(
      plateW / 2 - widthOffset,
      stiffenerH,
      stiffenerT,
      depthOffset,
      widthOffset,
      thicknessOffset,
      plateT / 2,
      "-Z",
      bp.stiffenerAlongWeb
    )
  );
  plate.rotateY(deg90InRad + degToRad(column.orientation ?? 0));
  return plate;
}

function drawRectangularBolt(
  radius: number,
  height: number,
  heightOffset: number,
  bp?: TRBasePlateOF,
  fixedBolt?: boolean
) {
  const fL = MMtoM(bp?.firstRowFromCenter_L ?? 50);
  const rL = MMtoM(bp?.rowToRow_L ?? 100);
  const fW = MMtoM(bp?.firstRowFromCenter_W ?? 50);
  const rW = MMtoM(bp?.rowToRow_W ?? 100);
  const bolts: Mesh[] = [];
  for (let i = 0; i < (bp?.countAlongLength ?? 4); i++) {
    const coefI = i % 2 === 0 ? -1 : 1;
    for (let j = 0; j < (bp?.countAlongWidth ?? 4); j++) {
      const coefJ = j % 2 === 0 ? -1 : 1;
      const bolt = drawBolt(radius, height, heightOffset, i, j, fixedBolt);
      if (i === 0 || i === 1) {
        bolt.position.setX(fL * coefI);
      } else {
        bolt.position.setX((fL + rL * Math.floor(i / 2)) * coefI);
      }
      if (j === 0 || j === 1) {
        bolt.position.setZ(fW * coefJ);
      } else {
        bolt.position.setZ((fW + rW * Math.floor(j / 2)) * coefJ);
      }
      bolts.push(bolt);
    }
  }
  return bolts;
}

function drawRectangularBoltOnBeamToBeam(
  radius: number,
  height: number,
  heightOffset: number,
  bb: TBoldedConn,
  fixedBolt?: boolean
) {
  const fL = MMtoM(50);
  const rL = MMtoM(50);
  const fW = MMtoM(30);
  const rW = MMtoM(50);
  const bolts: Mesh[] = [];
  for (let i = 0; i < bb.noOfBoltsAlongLength; i++) {
    const coefI = i % 2 === 0 ? -1 : 1;
    for (let j = 0; j < bb.noOfBoltsAlongWidth / 2; j++) {
      const coefJ = j % 2 === 0 ? -1 : 1;
      const bolt = drawBolt(radius, height, heightOffset, i, j, fixedBolt);
      if (i === 0 || i === 1) {
        bolt.position.setX(fL * coefI);
      } else {
        bolt.position.setX((fL + rL * Math.floor(i / 2)) * coefI);
      }
      if (j === 0 || j === 1) {
        bolt.position.setZ(fW * coefJ);
      } else {
        bolt.position.setZ((fW + rW * Math.floor(j / 2)) * coefJ);
      }
      bolts.push(bolt);
    }
  }
  return bolts;
}

function drawBolt(
  radius: number,
  height: number,
  heightOffset: number,
  i: number,
  j: number,
  fixedBolt?: boolean
) {
  const boltGroup = new Mesh();
  boltGroup.name = `BG${i + 1}-${j + 1}`;
  if (fixedBolt) {
    const g1 = new Mesh(
      new CylinderBufferGeometry(radius * 2, radius * 2, radius),
      new MeshStandardMaterial({ color: fixRGB(pedestalColor) })
    );
    g1.name = `G1`;
    g1.position.setY(radius / 2);
    boltGroup.add(g1);
  } else {
    const bolt = new Mesh(
      new CylinderBufferGeometry(radius, radius, height),
      new MeshStandardMaterial({ color: fixRGB(pedestalColor) })
    );
    bolt.name = `Bolt${i + 1}-${j + 1}`;
    bolt.position.setY(height / 2);
    const g1 = new Mesh(
      new CylinderBufferGeometry(radius * 2, radius * 2, radius),
      new MeshStandardMaterial({ color: fixRGB(pedestalColor) })
    );
    g1.name = `${bolt.name}-G1`;
    g1.position.setY(radius / 2);
    const g2 = new Mesh(
      new CylinderBufferGeometry(radius * 2, radius * 2, radius),
      new MeshStandardMaterial({ color: fixRGB(pedestalColor) })
    );
    g2.name = `${bolt.name}-G2`;
    g2.position.setY(radius * 1.5);
    boltGroup.add(bolt, g1, g2);
  }
  boltGroup.position.setY(heightOffset);
  return boltGroup;
}

function drawRectangularStiffener(
  width: number,
  height: number,
  depth: number,
  depthOffset: number,
  widthOffset: number,
  thicknessOffset: number,
  heightOffset: number,
  direction: Direction2,
  count: 1 | 2 | 3
) {
  const stiffenerGroup = new Mesh();
  stiffenerGroup.name = `SG(${direction})`;
  const stiffeners: Mesh[] = [];
  for (let i = 0; i < count; i++) {
    let stiffener;
    if (count === 1 || (count === 3 && i === 1)) {
      if (direction === "+X" || direction === "-X") {
        stiffener = drawStiffener(width, height, depth);
        stiffener.position.set(depthOffset, heightOffset, depth / -2);
      } else {
        stiffener = drawStiffener(
          width + widthOffset - thicknessOffset,
          height,
          depth
        );
        stiffener.position.set(thicknessOffset, heightOffset, depth / -2);
      }
    } else {
      stiffener = drawStiffener(width, height, depth);
      if (direction === "+X" || direction === "-X") {
        if ((count === 2 || count === 3) && i === 0)
          stiffener.position.set(depthOffset, heightOffset, -widthOffset);
        if ((count === 2 && i === 1) || (count === 3 && i === 2))
          stiffener.position.set(
            depthOffset,
            heightOffset,
            widthOffset - depth
          );
      } else {
        if ((count === 2 || count === 3) && i === 0)
          stiffener.position.set(widthOffset, heightOffset, -depthOffset);
        if ((count === 2 && i === 1) || (count === 3 && i === 2))
          stiffener.position.set(
            widthOffset,
            heightOffset,
            depthOffset - depth
          );
      }
    }
    stiffener.name = `${stiffenerGroup.name}-S${i + 1}`;
    stiffeners.push(stiffener);
  }
  stiffenerGroup.add(...stiffeners);
  if (direction === "-X") stiffenerGroup.rotateY(deg180InRad);
  if (direction === "-Z") stiffenerGroup.rotateY(deg90InRad);
  if (direction === "+Z") stiffenerGroup.rotateY(-deg90InRad);
  return stiffenerGroup;
}

function drawCircularSliceFlange(
  sf: TCSpliceFlangeOF,
  column: TColumnOF,
  secondColumn: TColumnOF
) {
  const sliceFlange = new Mesh();
  sliceFlange.name = `CSF-${column.name}`;
  sliceFlange.add(drawCircularBasePlate(sf, secondColumn, true));
  const down = drawCircularBasePlate(
    {
      ...sf,
      plateThickness: sf.bottomPlateThickness,
      plateDiameter: sf.bottomPlateDiameter,
    } as TCSpliceFlangeOF,
    column
  );
  down.rotateY(deg180InRad);
  down.rotateZ(deg180InRad);
  down.position.setY(MMtoM(sf.bottomPlateThickness) / -2);
  sliceFlange.add(down);
  sliceFlange.position.setY(sf.elevation);
  return sliceFlange;
}

function drawRectangularSliceFlange(
  sf: TRSpliceFlangeOF,
  column: TColumnOF,
  secondColumn: TColumnOF
) {
  const sliceFlange = new Mesh();
  sliceFlange.name = `RSF-${column.name}`;
  sliceFlange.add(drawRectangularBasePlate(sf, secondColumn, true));
  const down = drawRectangularBasePlate(
    {
      ...sf,
      plateThickness: sf.bottomPlateThickness,
      plateLength: sf.bottomPlateLength,
      plateWidth: sf.bottomPlateWidth,
    } as TRSpliceFlangeOF,
    column
  );
  down.rotateZ(deg180InRad);
  down.position.setY(MMtoM(sf.bottomPlateThickness) / -2);
  sliceFlange.add(down);
  sliceFlange.position.setY(sf.elevation);
  return sliceFlange;
}

function drawPipe(model: TOpenFrame, pipe: TPipeOF) {
  const arcShape = new Shape();
  const radius = MMtoM(pipe.diameter) / 2;
  const thickness = MMtoM(pipe.thickness);
  arcShape.absarc(0, 0, radius, 0, deg360InRad, false);
  const holePath = new Path();
  holePath.absarc(0, 0, radius - thickness, 0, deg360InRad, true);
  arcShape.holes.push(holePath);
  const pipeMesh = new Mesh(
    new ExtrudeBufferGeometry(arcShape, {
      steps: 1,
      bevelEnabled: false,
      curveSegments: 32,
      depth: pipe.startPos.distanceTo(pipe.endPos),
    }),
    new MeshBasicMaterial({
      color: getRGB(pipeColorRGB),
    })
  );
  if (pipe.direction.includes("Y")) {
    pipeMesh.rotateY(deg90InRad);
    pipeMesh.rotateZ(
      -getRotationByLegs(
        pipe.startPos.y,
        pipe.startPos.z,
        pipe.endPos.y,
        pipe.endPos.z
      )
    );
    pipeMesh.rotateX(
      -getRotationByLegs(
        pipe.startPos.y,
        pipe.startPos.x,
        pipe.endPos.y,
        pipe.endPos.x
      ) +
        deg180InRad / (pipe.direction === "+Y" ? -2 : 2)
    );
  } else {
    pipeMesh.rotateY(
      getRotationByLegs(
        pipe.startPos.x,
        pipe.startPos.z,
        pipe.endPos.x,
        pipe.endPos.z
      ) +
        deg180InRad / (pipe.direction === "-X" ? -2 : 2)
    );
    pipeMesh.rotateX(
      getRotationByLegs(
        pipe.startPos.x,
        pipe.startPos.y,
        pipe.endPos.x,
        pipe.endPos.y
      ) * (pipe.direction === "-X" ? -1 : 1)
    );
  }
  pipeMesh.position.add(pipe.startPos);
  if (pipe.succeeding !== "END") {
    const sphere = new Mesh(
      new SphereBufferGeometry(radius, 32, 32),
      new MeshBasicMaterial({ color: getRGB(pipeColorRGB) })
    );
    sphere.position.setZ(pipe.startPos.distanceTo(pipe.endPos));
    pipeMesh.add(sphere);
  }
  pipeMesh.name = pipe.name;
  pipe.supports.forEach((sup) => {
    const beam = model.beams.find((b) => b.name === sup.beam);
    const pos = beam
      ? getSupportPosByBeam(pipe.startPos, pipe.endPos, pipe.direction, beam)
      : getPosByDistance(sup.distance, pipe.startPos, pipe.endPos);
    // @ts-ignore
    if (sup.type === "Fixed" || sup.type === "Anchor") {
      const fArcShape = new Shape().absarc(
        0,
        0,
        radius + 0.02,
        0,
        deg360InRad,
        false
      );
      fArcShape.holes.push(
        new Path().absarc(0, 0, radius, 0, deg360InRad, true)
      );
      const supMesh = new Mesh(
        new ExtrudeBufferGeometry(fArcShape, {
          steps: 1,
          bevelEnabled: false,
          curveSegments: 32,
          depth: 0.1,
        }),
        new MeshBasicMaterial({ color: getRGB(supColorRGB) })
      );
      supMesh.position.setZ(pipe.startPos.distanceTo(pos) - 0.05);
      pipeMesh.add(supMesh);
    } else if (sup.type === "Spring") {
      const isTop = beam ? pos.y < beam.startPos.y : true;
      const h = beam
        ? (Math.abs(beam.startPos.y - pos.y) - radius) * (isTop ? 1 : -1)
        : 1;
      const geometry = new Geometry();
      geometry.vertices.push(new Vector3(0, h));
      geometry.vertices.push(new Vector3(0, h * 0.8));
      geometry.vertices.push(new Vector3(0.1, h * 0.7));
      geometry.vertices.push(new Vector3(-0.1, h * 0.6));
      geometry.vertices.push(new Vector3(0.1, h * 0.5));
      geometry.vertices.push(new Vector3(-0.1, h * 0.4));
      geometry.vertices.push(new Vector3(0.1, h * 0.3));
      geometry.vertices.push(new Vector3(0, h * 0.2));
      geometry.vertices.push(new Vector3());
      const supLine = new Line(
        geometry,
        new MeshBasicMaterial({ color: getRGB(supColorRGB) })
      );
      supLine.position.set(
        0,
        radius * (isTop ? 1 : -1),
        pipe.startPos.distanceTo(pos)
      );
      pipeMesh.add(supLine);
    } else {
      const lBox = new Mesh(
        new BoxBufferGeometry(0.02, 0.1, 0.4),
        new MeshBasicMaterial({ color: getRGB(supColorRGB) })
      );
      lBox.position.setX(-radius - 0.01);
      const rBox = new Mesh(
        new BoxBufferGeometry(0.02, 0.1, 0.4),
        new MeshBasicMaterial({ color: getRGB(supColorRGB) })
      );
      rBox.position.setX(radius + 0.01);
      const supMesh = new Mesh();
      supMesh.add(lBox, rBox);
      supMesh.position.setZ(pos.x > 0 ? pipe.startPos.distanceTo(pos) : 0);
      pipeMesh.add(supMesh);
    }
  });
  pipeMesh.userData = {
    model: model.name,
    isModelItem: true,
    name: pipe.name,
    modelStart: model.startPos,
    modelDir: model.direction,
    start: pipe.startPos,
    end: pipe.endPos,
    profile: pipe.profile ?? {
      d_global: pipe.diameter,
      bf_global: pipe.thickness,
    },
  } as ModelItem;
  return pipeMesh;
}

export function setPositionAndDirection(
  mesh: Mesh | Group,
  start: Vector3,
  end: Vector3
) {
  mesh.position.add(start);
  mesh.lookAt(end);
  mesh.position.add(end).divideScalar(2);
  mesh.rotateY(-deg90InRad);
}

function drawTruss(beams: TBeamOF[], truss: TTrussOF) {
  const group = new Group();
  const from = beams.find((b) => b.name === truss.from);
  group.position.set(
    from?.startPos.x ?? 0,
    from?.startPos.y ?? 0,
    from?.startPos.z ?? 0
  );
  group.lookAt(
    new Vector3(from?.endPos.x ?? 0, from?.endPos.y ?? 0, from?.endPos.z ?? 0)
  );
  group.rotateY(-deg90InRad);
  const span_2 = truss.span / 2;

  const prevTV = new Vector3();
  const prevSLT = new Vector3();
  const prevBLT = new Vector3();
  const prevSRT = new Vector3();
  const prevBRT = new Vector3();

  for (let i = 0; i < truss.numbers; i++) {
    const span_2_3 = span_2 / 3;
    const top = span_2 * Math.tan(degToRad(truss.slope));
    const small = span_2_3 * Math.tan(degToRad(truss.slope));
    const big = span_2_3 * 2 * Math.tan(degToRad(truss.slope));
    const x = truss.offset + truss.spacing * i;

    const LT = new Vector3(x);
    const CT = new Vector3(x, 0, span_2);
    const RT = new Vector3(x, 0, truss.span);

    const TV = CT.clone().setY(top);

    const SLB = new Vector3(x, 0, span_2_3);
    const SLT = SLB.clone().setY(small);

    const BLB = SLB.clone().setZ(span_2_3 * 2);
    const BLT = BLB.clone().setY(big);

    const BRB = new Vector3(x, 0, span_2 + span_2_3);
    const BRT = BRB.clone().setY(big);

    const SRB = new Vector3(x, 0, span_2 + span_2_3 * 2);
    const SRT = SRB.clone().setY(small);

    const globalLT = fixVectorByOrientation(
      from!.startPos,
      LT.clone().add(from!.startPos),
      -90
    );
    globalLT.set(roundM(globalLT.x), roundM(globalLT.y), roundM(globalLT.z));
    const globalRT = fixVectorByOrientation(
      from!.startPos,
      RT.clone().add(from!.startPos),
      -90
    );
    globalRT.set(roundM(globalRT.x), roundM(globalRT.y), roundM(globalRT.z));
    if (
      !beams.some((beam) => {
        if (beam.startPos.y !== globalLT.y || beam.endPos.y !== globalLT.y)
          return false;
        const dir = getSimpleDirection(globalLT, globalRT);
        if (dir !== getSimpleDirection(beam.startPos, beam.endPos))
          return false;
        return dir === "X"
          ? globalLT.z === beam.startPos.z &&
              checkRange(globalLT.x, beam.startPos.x, beam.endPos.x, true, true)
          : globalLT.x === beam.startPos.x &&
              checkRange(
                globalLT.z,
                beam.startPos.z,
                beam.endPos.z,
                true,
                true
              );
      })
    ) {
      const tie = createElementByProfile(truss.span, beamColorRGB, truss.tie);
      setPositionAndDirection(tie, LT, RT);
      group.add(tie);
    }

    if (i) {
      const distance = prevTV.distanceTo(TV);
      const topTie = createElementByProfile(distance, beamColorRGB, truss.tie);
      const slTie = topTie.clone();
      const srTie = topTie.clone();
      const blTie = topTie.clone();
      const brTie = topTie.clone();

      setPositionAndDirection(topTie, prevTV, TV);
      setPositionAndDirection(slTie, prevSLT, SLT);
      setPositionAndDirection(srTie, prevBLT, BLT);
      setPositionAndDirection(blTie, prevSRT, SRT);
      setPositionAndDirection(brTie, prevBRT, BRT);

      group.add(topTie, slTie, srTie, blTie, brTie);
    }

    prevTV.copy(TV);
    prevSLT.copy(SLT);
    prevBLT.copy(BLT);
    prevSRT.copy(SRT);
    prevBRT.copy(BRT);

    const verticalSL = createElementByProfile(
      small,
      beamColorRGB,
      truss.vertical
    );
    const inclinedSL = createElementByProfile(
      SLT.distanceTo(BLB),
      beamColorRGB,
      truss.inclined
    );
    const verticalBL = createElementByProfile(
      big,
      beamColorRGB,
      truss.vertical
    );
    const inclinedBL = createElementByProfile(
      BLT.distanceTo(CT),
      beamColorRGB,
      truss.inclined
    );
    const rafterL = createElementByProfile(
      LT.distanceTo(TV),
      beamColorRGB,
      truss.rafter
    );
    const verticalC = createElementByProfile(top, beamColorRGB, truss.vertical);
    const rafterR = rafterL.clone();
    const verticalBR = verticalBL.clone();
    const inclinedBR = inclinedBL.clone();
    const verticalSR = verticalSL.clone();
    const inclinedSR = inclinedSL.clone();

    setPositionAndDirection(verticalSL, SLB, SLT);
    setPositionAndDirection(inclinedSL, BLB, SLT);
    setPositionAndDirection(verticalBL, BLB, BLT);
    setPositionAndDirection(inclinedBL, CT, BLT);
    setPositionAndDirection(rafterL, TV, LT);
    setPositionAndDirection(verticalC, CT, TV);
    setPositionAndDirection(rafterR, TV, RT);
    setPositionAndDirection(inclinedBR, CT, BRT);
    setPositionAndDirection(verticalBR, BRB, BRT);
    setPositionAndDirection(inclinedSR, BRB, SRT);
    setPositionAndDirection(verticalSR, SRB, SRT);

    group.add(
      verticalSL,
      inclinedSL,
      verticalBL,
      inclinedBL,
      rafterL,
      verticalC,
      rafterR,
      inclinedBR,
      verticalBR,
      inclinedSR,
      verticalSR
    );
  }
  return group;
}

function drawRunner(
  mesh: Mesh,
  runner: TRunnerOF,
  from: TBeamOF | TColumnOF,
  to: TBeamOF | TColumnOF
) {
  if (runner.globalSide === "SIDE") {
    const cf = from as TColumnOF;
    const ct = to as TColumnOF;
    for (let i = 0; i < runner.numbers; i++) {
      const start = new Vector3(
        cf.startPos.x,
        cf.startPos.y + runner.offset + runner.spacing * i,
        cf.startPos.z
      );
      const end = new Vector3(ct.startPos.x, start.y, ct.startPos.z);
      // const dir = getDirection(start, end);
      // if (dir.includes("X")) {
      // } else if (dir.includes("Z")) {
      // }
      const beam = createElementByProfile(
        start.distanceTo(end),
        beamColorRGB,
        runner.profile
      );
      beam.position.copy(start);
      beam.lookAt(end);
      beam.position.add(end).divideScalar(2);
      beam.rotateY(-deg90InRad);
      mesh.add(beam);
    }
  } else {
    const bf = from as TBeamOF;
    const bt = to as TBeamOF;
    const dir = bf.direction;
    for (let i = 0; i < runner.numbers; i++) {
      const start = new Vector3(
        dir === "X"
          ? bf.startPos.x + runner.offset + runner.spacing * i
          : bf.startPos.x,
        bf.startPos.y,
        dir === "X"
          ? bf.startPos.z
          : bf.startPos.z + runner.offset + runner.spacing * i
      );
      const end = new Vector3(
        dir === "X"
          ? bf.startPos.x + runner.offset + runner.spacing * i
          : bt.startPos.x,
        bt.startPos.y,
        dir === "X"
          ? bt.startPos.z
          : bf.startPos.z + runner.offset + runner.spacing * i
      );
      const beam = createElementByProfile(
        start.distanceTo(end),
        beamColorRGB,
        runner.profile
      );
      beam.position.copy(start);
      beam.lookAt(end);
      beam.position.add(end).divideScalar(2);
      beam.rotateY(-deg90InRad);
      mesh.add(beam);
    }
  }
}

function drawMetalCladding(
  mesh: Mesh,
  item: TMetalCladdingOF,
  from?: TColumnOF,
  to?: TColumnOF
) {
  if (!from || !to) return;
  const start = from.startPos.clone();
  start.setY(start.y + item.elevation);
  const end = to.startPos.clone().setY(start.y);
  const cladding = new Mesh(
    new BoxBufferGeometry(0.001, item.height, start.distanceTo(end)),
    new MeshLambertMaterial({ color: getRGB(hBracingColorRGB) })
  );
  cladding.position.copy(start);
  cladding.lookAt(end);
  cladding.position.add(end).divideScalar(2);
  cladding.position.setY(start.y + item.height / 2);
  mesh.add(cladding);
}

function drawMasonryCladding(
  mesh: Mesh,
  item: TMasonryCladdingOF,
  from?: TColumnOF,
  to?: TColumnOF
) {
  if (!from || !to) return;
  const start = from.startPos.clone();
  const end = to.startPos.clone().setY(start.y);
  const cladding = new Mesh(
    new BoxBufferGeometry(0.1, item.height, start.distanceTo(end)),
    new MeshLambertMaterial({ color: getRGB(pedestalColor) })
  );
  cladding.position.copy(start);
  cladding.lookAt(end);
  cladding.position.add(end).divideScalar(2);
  cladding.position.setY(start.y + item.height / 2);
  mesh.add(cladding);
}

function drawRailing(mesh: Mesh, item: TRailingOF, element?: TBeamElement) {
  if (!element) return;
  const group = new Group();

  const step = item.length / item.noOfSpacings;
  for (let i = 0; i <= item.noOfSpacings; i++) {
    const offset = item.distFromStartNode + step * i;
    const start = new Vector3(0, 0, offset);
    const end = new Vector3(0, item.totalHeight, offset);
    const vMesh = createElementByProfile(
      item.totalHeight,
      beamColorRGB,
      item.verticalRail
    );
    setPositionAndDirection(vMesh, start, end);
    group.add(vMesh);
  }

  const start = new Vector3(0, item.totalHeight, item.distFromStartNode);
  const end = new Vector3(
    0,
    item.totalHeight,
    item.distFromStartNode + item.length
  );
  const tMesh = createElementByProfile(item.length, beamColorRGB, item.topRail);
  setPositionAndDirection(tMesh, start, end);
  group.add(tMesh);

  if (item.middleHeight && item.middleRail) {
    const start = new Vector3(0, item.middleHeight, item.distFromStartNode);
    const end = new Vector3(
      0,
      item.middleHeight,
      item.distFromStartNode + item.length
    );
    const mMesh = createElementByProfile(
      item.length,
      beamColorRGB,
      item.middleRail
    );
    setPositionAndDirection(mMesh, start, end);
    group.add(mMesh);
  }

  group.name = item.name;
  group.position.copy(element.startPos);
  group.lookAt(element.endPos);
  mesh.add(group);
}
