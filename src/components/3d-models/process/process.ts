import * as THREE from "three";
import * as TYPES from "../../../store/process/types";
import { STLLoader } from "three/examples/jsm/loaders/STLLoader";

import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { BufferGeometryUtils } from "three/examples/jsm/utils/BufferGeometryUtils.js";

import {
  degToRad,
  roundM,
  getRGB,
  checkRange,
  roundVectorM,
  getPosByDistance,
  getNextId,
  getDirection,
  getIndexName,
  getMiddleVector3,
  MMtoM,
  getLocalStorageSTL,
} from "../utils";
import {
  pedestalColor,
  deg90InRad,
  pipeColorRGB,
  deg360InRad,
  supColorRGB,
  deg180InRad,
  deg45InRad,
  deg30InRad,
  rad,
  blue,
  red,
} from "../../../store/main/constants";
import { Dispatch } from "redux";
import {
  Project,
  FreePipe,
  TWorkMode,
  Direction3,
  TValveControlType,
  FreeCable,
  TGridSettings,
  TCustomGrid,
  CircularBP,
  CiculrStackBP,
} from "../../../store/main/types";
import { addEventAction } from "../../../store/ui/actions";
import {
  setProcessAction,
  changeProcessLineAction,
  selectProcessLineAction,
  createProcessElementAction,
  createInstrElementAction,
  selectInstrElementAction,
  changeProcessElementAction,
  changeInstrElementAction,
  createInstrLineAction,
  selectProcessElementAction,
} from "../../../store/process/actions";
import {
  changeModel,
  changeProjectAction,
  setModelTypeAndMaterial,
} from "../../../store/main/actions";
import { initialProcess } from "../../../store/process/initialState";
import { Font, MeshLambertMaterial, Vector3 } from "three";
import { DataState, TPipingElbow } from "../../../store/data/types";
import { getRotationAngle } from "../pipes/pipesUtils";
import { fontUrl } from "../../../pages/utils/agent";
import { createFlange } from "../pipes/pipeCreationUtils";
import {
  createAnchor,
  TPipeElementAnchor,
} from "../../../services/pipe-services/pipe-service";
import { getSimpleAxisHelper } from "../axisHelper";
import {
  createCircleDropZone,
  createDropZoneAxises,
  createSnappingPoint,
  getObjectOnScreen,
  snapToCustomGrid,
} from "../../work-field/workFieldUtils/sceneUtils";
import {
  createRoadModel,
  drawRawCircularBasePlate,
  drawRawRectangularBasePlate,
  removeOFModel,
} from "../openFrame";
import { TMousePipeCreatingAtom } from "../../../recoil/atoms/process-atoms";
import { recreateProcessLineByInitialLength } from "../../work-field/selections/process/SelectedLine";
import { OpenFrameUI } from "../../../store/ui/types";
import {
  OpenFrameOtherType,
  TOpenFrame,
  TOther,
} from "../../../store/main/openFrameTypes";

export const globalEvents = new THREE.EventDispatcher();

function abbreviateAndAppendNumber(input: string): string {
  // Extract words and numbers using a regular expression
  const words = input.match(/[A-Za-z]+/g) || [];
  const numbers = input.match(/\d+/g) || [];

  // Form the abbreviation by taking the first letter of each word
  let abbreviation = words.reduce((acc, word) => acc + word.charAt(0), "");

  // Append the numbers (if any) to the abbreviation
  if (numbers.length > 0) {
    abbreviation += "/" + numbers.join("");
  }

  return abbreviation.toUpperCase();
}

const meshMaterial = new THREE.MeshLambertMaterial({
  color: getRGB(pedestalColor),
  side: THREE.DoubleSide,
});
const electricMaterial = new THREE.MeshLambertMaterial({
  color: "yellow",
  side: THREE.DoubleSide,
});
const selectionMeshMaterial = new THREE.MeshLambertMaterial({
  color: "green",
});
const selectedMeshMaterial = new THREE.MeshLambertMaterial({
  color: getRGB(supColorRGB),
  side: THREE.DoubleSide,
});
const lineMeshMaterial = new THREE.MeshLambertMaterial({
  color: getRGB(pipeColorRGB),
  // side: THREE.DoubleSide,
});

const pipeMaterial = new THREE.MeshLambertMaterial({
  transparent: true,
  opacity: 1,
  color: getRGB(pipeColorRGB),
  side: THREE.DoubleSide,
});

function dropProcess(
  e: React.DragEvent<HTMLCanvasElement>,
  current: string,
  processes: TYPES.TProcess,
  scene: THREE.Scene,
  renderer: THREE.WebGLRenderer,
  camera: THREE.Camera,
  dispatch: Dispatch,
  resources: DataState,
  project: Project | undefined,
  ui?: OpenFrameUI,
  customGrids?: TCustomGrid[]
) {
  const data = e.dataTransfer.getData("text/html");
  const dataTypes = typeof data === "string" ? data.split("&") : [];
  const type = dataTypes[0];
  const subtype = dataTypes[1];
  const raycaster = new THREE.Raycaster();
  const mouse = {
    x: (e.clientX / renderer.domElement.clientWidth) * 2 - 1,
    y: -(e.clientY / renderer.domElement.clientHeight) * 2 + 1,
  };
  raycaster.setFromCamera(mouse, camera);
  // let items = getObjectOnScreen(e, camera, scene, e.target);
  if (type === "process" || type === "connections") {
    if (subtype === TYPES.EProcessElementType.PIPE) {
      const intersects = raycaster.intersectObjects(
        scene.getObjectByName("PROCESS")?.children ?? [],
        false
      );
      for (const i of intersects) {
        if (i.object.userData.isProcessLine) {
          const line = processes.lines?.find(
            (l) =>
              l.id === i.object.userData.line?.id &&
              i.object.userData.line?.type !== "PIPE"
          );
          if (!line) return;
          const changed: TYPES.TProcessLine = {
            ...line,
            type: "PIPE",
            parameters: { type: "Process Flow Line" },
          };
          dispatch(changeProcessLineAction(current, changed));
          dispatch(selectProcessLineAction(changed));
        } else if (i.object.parent?.userData?.isProcessLine) {
          const line = processes.lines?.find(
            (l) =>
              l.id === i.object.parent!.userData.line?.id &&
              i.object.parent!.userData.line?.type !== "PIPE"
          );
          if (!line) return;
          const changed: TYPES.TProcessLine = {
            ...line,
            type: "PIPE",
            parameters: { type: "Process Flow Line" },
          };
          dispatch(changeProcessLineAction(current, changed));
          dispatch(selectProcessLineAction(changed));
        }
      }
    } else if (subtype === TYPES.EProcessElementType.LEG) {
      const intersects = raycaster.intersectObjects(
        scene.getObjectByName("PROCESS")?.children ?? [],
        false
      );
      for (const i of intersects) {
        if (i.object.userData.isProcessItem) {
          const name = i.object.userData.name;
          const process:
            | TYPES.TProcessElement
            | undefined = processes.elements.get(name);
          if (process) {
            const changed: TYPES.TProcessElement = {
              ...process,
              supportParameters: {
                ...process.supportParameters,
                type: TYPES.TProcessSupportType.LEG,
                length:
                  process.parameters?.height / 3 || process.parameters.diameter,
                number: 4,
              },
            };
            dispatch(changeProcessElementAction(current, name, changed));
            dispatch(selectProcessElementAction(changed));
          }
        }
      }
    } else if (subtype === TYPES.EConnectionElementType.SKIRT) {
      const intersects = raycaster.intersectObjects(
        scene.getObjectByName("PROCESS")?.children ?? [],
        false
      );
      for (const i of intersects) {
        if (i.object.userData.isProcessItem) {
          const name = i.object.userData.name;
          const process:
            | TYPES.TProcessElement
            | undefined = processes.elements.get(name);
          if (process) {
            const changed: TYPES.TProcessElement = {
              ...process,
              supportParameters: {
                ...process.supportParameters,
                type: TYPES.TProcessSupportType.SKIRTS,
                length:
                  process.parameters?.height / 3 || process.parameters.diameter,
                diameter: process.parameters.diameter,
                thickness: 20,
                upperLength: 0,
              },
            };
            dispatch(changeProcessElementAction(current, name, changed));
            dispatch(selectProcessElementAction(changed));
          }
        }
      }
    } else if (subtype === TYPES.EConnectionElementType.LUG) {
      const intersects = raycaster.intersectObjects(
        scene.getObjectByName("PROCESS")?.children ?? [],
        false
      );
      // const point = roundVectorM(
      //   intersects
      //     .reduce((acc, i) => acc.add(i.point), new Vector3())
      //     .divideScalar(intersects.length),
      //   100
      // );
      let intersect = intersects[0];
      for (const i of intersects) {
        if (i.object.userData.isProcessItem) {
          if (intersect.distance > i.distance) {
            intersect = i;
          }
        }
      }

      const name = intersect.object.userData.name;
      const process: TYPES.TProcessElement | undefined = processes.elements.get(
        name
      );
      if (process) {
        const { height, radius, thickness } = getParameters(process);

        const changed: TYPES.TProcessElement = {
          ...process,
          lugs: [
            ...(process.lugs ?? []),
            {
              position: intersect.point,
              height: height / 7,
              width: (radius / 3) * 2,
              thickness: thickness ?? radius / 100,
            },
          ],
        };
        dispatch(changeProcessElementAction(current, name, changed));
        dispatch(selectProcessElementAction(changed));
      }
    } else if (subtype === TYPES.EProcessElementType.BLOCK) {
      const intersects = raycaster.intersectObjects(
        scene.getObjectByName("PROCESS")?.children ?? [],
        false
      );
      // const point = roundVectorM(
      //   intersects
      //     .reduce((acc, i) => acc.add(i.point), new Vector3())
      //     .divideScalar(intersects.length),
      //   100
      // );
      let intersect = intersects[0];
      if (intersect) {
        for (const i of intersects) {
          if (i.object.userData.isProcessItem) {
            if (intersect.distance > i.distance) {
              intersect = i;
            }
          }
        }

        const name = intersect.object.userData.name;
        const process:
          | TYPES.TProcessElement
          | undefined = processes.elements.get(name);
        if (process && process.type === TYPES.EProcessElementType.IAF) {
          const {
            height,
            radius,
            realHeight,
            width,
            thickness,
          } = getParameters(process);

          const changed: TYPES.TProcessElement = {
            ...process,
            blocks: [
              ...(process.blocks ?? []),
              {
                position: intersect.point,
                width: width / 3,
                height: realHeight / 3,
              },
            ],
          };
          dispatch(changeProcessElementAction(current, name, changed));
          dispatch(selectProcessElementAction(changed));
        }
      }
    } else if (subtype === TYPES.EProcessElementType.FireHose) {
      const intersects = raycaster.intersectObjects(
        scene.children.reduce(
          (total, children) => [
            ...total,
            ...(children.name.startsWith("OF")
              ? children.children.filter((mesh) => mesh.name.startsWith("C"))
              : []),
          ],

          []
        ),
        false
      );

      let intersect = intersects[0];
      if (intersect) {
        for (const i of intersects) {
          if (i.object.userData.isProcessItem) {
            if (intersect.distance > i.distance) {
              intersect = i;
            }
          }
        }

        dispatch(
          createProcessElementAction(
            current,
            `${subtype}${getIndexName(
              Array.from(processes.elements.values()),
              subtype
            )}`,
            subtype as TYPES.EProcessElementType,
            intersect.point,
            resources
          )
        );
      }
    } else if (subtype === TYPES.EConnectionElementType.RECTANGULAR_BP) {
      const intersects = raycaster.intersectObjects(
        scene.getObjectByName("PROCESS")?.children ?? [],
        false
      );
      for (const i of intersects) {
        if (i.object.userData.isProcessItem) {
          const name = i.object.userData.name;
          const process:
            | TYPES.TProcessElement
            | undefined = processes.elements.get(name);
          if (process) {
            const changed: TYPES.TProcessElement = {
              ...process,
              supportParameters: {
                ...process.supportParameters,
                basePlate: TYPES.TProcessBasePlateType.RECTANGULAR,
                type: TYPES.TProcessSupportType.LEG,
                length:
                  process.parameters?.height / 3 || process.parameters.diameter,
                number: 4,
              },
            };
            dispatch(changeProcessElementAction(current, name, changed));
            dispatch(selectProcessElementAction(changed));
          }
        }
      }
    } else if (subtype === TYPES.EConnectionElementType.CIRCULAR_BP) {
      const intersects = raycaster.intersectObjects(
        scene.getObjectByName("PROCESS")?.children ?? [],
        false
      );
      for (const i of intersects) {
        if (i.object.userData.isProcessItem) {
          const name = i.object.userData.name;
          const process:
            | TYPES.TProcessElement
            | undefined = processes.elements.get(name);
          if (process) {
            const changed: TYPES.TProcessElement = {
              ...process,
              supportParameters: {
                ...process.supportParameters,
                basePlate: TYPES.TProcessBasePlateType.CIRCULAR,
                type: TYPES.TProcessSupportType.LEG,
                length:
                  process.parameters?.height / 3 || process.parameters.diameter,
                number: 4,
              },
            };
            dispatch(changeProcessElementAction(current, name, changed));
            dispatch(selectProcessElementAction(changed));
          }
        }
      }
    } else {
      const grid = scene.getObjectByName("GridHelper");
      const intersects = raycaster.intersectObjects(grid ? [grid] : [], false);
      dispatch(
        createProcessElementAction(
          current,
          `${subtype}${getIndexName(
            Array.from(processes.elements.values()),
            subtype
          )}`,
          subtype as TYPES.EProcessElementType,
          snapToCustomGrid(
            roundVectorM(
              intersects
                .reduce((acc, i) => acc.add(i.point), new THREE.Vector3())
                .divideScalar(intersects.length),
              100
            ),
            customGrids
          ),
          resources
        )
      );
    }
  } else if (type === "instrumentation") {
    const intersects = raycaster.intersectObjects(
      scene.getObjectByName("PROCESS")?.children ?? [],
      true
    );
    const instrs = processes.instrumentations ?? [];
    const instrLines = processes.instrumentationLines ?? [];
    for (const i of intersects) {
      if (i.object.userData.isIntrumentationElement) {
        const instr = i.object.userData.instr as TYPES.TInstrumentationElement;
        // switch (subtype as TYPES.EInstrumentationElementType) {
        //   case TYPES.EInstrumentationElementType.INDICATOR:
        //   case TYPES.EInstrumentationElementType.RECORDER:
        //     if (
        //       instr.type !== TYPES.EInstrumentationElementType.INDICATOR &&
        //       instr.type !== TYPES.EInstrumentationElementType.RECORDER
        //     ) {
        //       const changed = {
        //         ...instr,
        //         combinedType: subtype as TYPES.EInstrumentationElementType,
        //       };
        //       dispatch(changeInstrElementAction(current, changed));
        //       dispatch(selectInstrElementAction(changed));
        //       return;
        //     }
        //     break;
        //   default:
        //     return;
        // }
      }
      if (i.object.userData.isProcessItem) {
        // if (
        //     subtype === TYPES.EInstrumentationElementType.INDICATOR ||
        //     subtype === TYPES.EInstrumentationElementType.RECORDER
        // )
        //   continue;
        const item = processes.elements.get(i.object.name);
        if (!item) return;
        if (item.type === TYPES.EProcessElementType.VALVE) {
          if (item.instrumentationIDs?.length) return;
          const control = (item as TYPES.TProcessValve).parameters.control;
          if (
            subtype === TYPES.EInstrumentationElementType.ELEMENT &&
            (control === "Pressure" || control === "Level")
          ) {
            return;
          }
        }

        const instr: TYPES.TInstrumentationElement = {
          id: getNextId(instrs),
          x: roundM(item.position.x - 0.5),
          y: roundM(item.position.y + 0.5),
          z: item.position.z,
          name: abbreviateAndAppendNumber(subtype),
          type: subtype as TYPES.EInstrumentationElementType,
          parent: item.name,
          parentType: "PROCESS",
        };
        const line: TYPES.TInstrumentationLine = {
          id: getNextId(instrLines),
          from: item.name,
          to: instr.id,
          type: "Instrument signal",
          connectionType: "PtoI",
        };
        dispatch(createInstrElementAction(current, instr));
        dispatch(createInstrLineAction(current, line));
        dispatch(
          changeProcessElementAction(current, item.name, {
            ...item,
            instrumentationIDs: [...(item.instrumentationIDs ?? []), instr.id],
          })
        );
        dispatch(selectInstrElementAction(instr));
        return;
      }
      if (
        i.object.userData.isProcessLine ||
        i.object.parent?.userData.isProcessLine
      ) {
        // if (
        //   subtype === TYPES.EInstrumentationElementType.INDICATOR ||
        //   subtype === TYPES.EInstrumentationElementType.RECORDER
        // )
        //   continue;
        const _3dLine = i.object.userData.isProcessLine
          ? i.object.userData
          : i.object.parent?.userData;
        const line = processes.lines?.find(
          (l) => l.id === _3dLine?.line?.id && _3dLine.line.type === "PIPE"
        );
        if (!line) return;
        const segment = line.segments.find((s) => s.id === _3dLine?.segmentID);
        const dir = getDirection(segment!.start, segment!.end);
        const mid = roundVectorM(
          getMiddleVector3(segment!.start, segment!.end)
        );
        const id = getNextId(processes.instrumentations ?? []);
        const instr: TYPES.TInstrumentationElement = {
          id,
          x: dir.includes("Y") ? roundM(mid.x - 0.5) : mid.x,
          y: dir.includes("Y") ? mid.y : roundM(mid.y + 0.5),
          z: mid.z,
          name: abbreviateAndAppendNumber(subtype),
          type: subtype as TYPES.EInstrumentationElementType,
          parent: line.id,
          parentID: _3dLine?.segmentID,
          parentType: "PIPE",
        };
        const instrLine: TYPES.TInstrumentationLine = {
          id: getNextId(instrLines),
          from: line.id,
          fromID: _3dLine?.segmentID,
          to: instr.id,
          type: "Instrument signal",
          connectionType: "LtoI",
        };
        dispatch(createInstrElementAction(current, instr));
        dispatch(createInstrLineAction(current, instrLine));
        dispatch(
          changeProcessLineAction(current, {
            ...line,
            segments: line.segments.map((s) =>
              s.id === segment?.id
                ? {
                    ...s,
                    instrumentationIDs: [
                      ...(s.instrumentationIDs ?? []),
                      instr.id,
                    ],
                  }
                : s
            ),
          })
        );
        dispatch(selectInstrElementAction(instr));
        return;
      }
    }
  }
  if (type === "creation-bar") {
    if (!project || !ui || !dispatch) return;
    const grid = scene.getObjectByName("GridHelper");
    const intersects = raycaster.intersectObjects(grid ? [grid] : [], false);
    const position = snapToCustomGrid(
      roundVectorM(
        intersects
          .reduce((acc, i) => acc.add(i.point), new THREE.Vector3())
          .divideScalar(intersects.length),
        100
      ),
      customGrids
    );
    const roadModelIndex = getIndexName(
      project?.models.filter((model) => model.type === "ROAD") ?? [],
      "Road"
    );
    const isNewModel =
      getIndexName(
        project?.models.filter((model) => model.type === "ROAD") ?? [],
        "Road"
      ) === 1;
    let model: TOpenFrame;
    if (isNewModel) {
      model = createRoadModel(`Road${roadModelIndex}`, project?.name, ui);
    } else {
      model = project.models.find(
        (model) => model.name === `Road${roadModelIndex - 1}`
      ) as TOpenFrame;
    }
    const others = model.others ?? [];
    const id = getNextId(others);

    const newOther: TOther = {
      id,
      name: `Other${id}`,
      position,
      type: subtype as OpenFrameOtherType,
    };

    others.push(newOther);

    if (!isNewModel)
      dispatch(
        changeModel({
          ...model,
          others,
        } as TOpenFrame)
      );
    else {
      dispatch(
        changeProjectAction({
          ...project,
          models: [...project.models, model],
        })
      );
    }

    // const modelName = `Road${getIndexName(
    //   project.models.filter((model) => model.type === "ROAD"),
    //   "Road"
    // )}`;
    // console.log(modelName);
    // // const newUI: OpenFrameUI = {
    // //   ...ui,
    // //   frames: {
    // //     ...ui.frames,
    // //     parameters: [
    // //       ...ui.frames.parameters,
    // //       ...createFramesParameters(modelName, ui.frames),
    // //     ],
    // //   },
    // // };

    // const changed = removeOFModel(project, ui, modelName);
    // dispatch(
    //   changeProjectAction({
    //     ...changed.newProject,
    //     models: [
    //       ...changed.newProject.models,
    //       createRoadModel(modelName, project.name, ui),
    //     ],
    //   })
    // );
    // return setState((prev) => ({
    //   ...prev,
    //   fromElementType: state.type as TElementType,
    //   fromElement: state.type,
    //   fromPoint: point,
    //   model: modelName,
    //   toElement: undefined,
    //   toPoint: undefined,
    // }));
    // dispatch(
    //   createProcessElementAction(
    //     current,
    //     `${subtype}${getIndexName(
    //       Array.from(processes.elements.values()),
    //       subtype
    //     )}`,
    //     subtype as TYPES.EProcessElementType,
    //     point,
    //     resources
    //   )
    // );
  }
}

function convertProcessToImporting(
  name: string,
  process: TYPES.TProcess,
  isFull?: boolean
) {
  return {
    name,
    elements: Array.from(process.elements.entries()).reduce(
      (acc, [key, value]) => {
        return { ...acc, [key]: value };
      },
      {}
    ),
    lines: process.lines ?? [],
    instrumentations: process.instrumentations ?? [],
    instrumentationLines: process.instrumentationLines ?? [],
    analysis: process.analysis,
    issues: isFull ? process.issues ?? [] : undefined,
    imported: isFull ? process.imported ?? [] : undefined,
    titles: isFull ? process.titles : undefined,
  };
}

function fixImportedProcess(obj: any) {
  const elements = new Map<string, TYPES.TProcessElement>();
  Object.entries(obj?.elements ?? {}).forEach(([key, value]) => {
    const el = value as TYPES.TProcessElement;
    elements.set(key, {
      ...el,
      points: el.points.map((p) => ({
        ...p,
        startPosition: new THREE.Vector3(
          p.startPosition?.x,
          p.startPosition?.y,
          p.startPosition?.z
        ),
        generalPosition: new THREE.Vector3(
          p.generalPosition?.x,
          p.generalPosition?.y,
          p.generalPosition?.z
        ),
      })),
    });
  });
  const lines = (obj?.lines ?? []).map((l: TYPES.TProcessLine) => {
    return {
      ...l,
      segments: l.segments.map((s) => ({
        ...s,
        start: new THREE.Vector3(s.start.x, s.start.y, s.start.z),
        end: new THREE.Vector3(s.end.x, s.end.y, s.end.z),
      })),
    } as TYPES.TProcessLine;
  });
  return {
    elements,
    analysis: obj
      ? {
          ...obj.analysis,
          CSTRSummary:
            obj.analysis?.CSTRSummary ?? initialProcess.analysis.CSTRSummary,
          PSVSummary:
            obj.analysis?.PSVSummary ?? initialProcess.analysis.PSVSummary,
          RCSummary:
            obj.analysis?.RCSummary ?? initialProcess.analysis.RCSummary,
          RESummary:
            obj.analysis?.RESummary ?? initialProcess.analysis.RESummary,
          STHE2PSummary:
            obj.analysis?.STHE2PSummary ??
            initialProcess.analysis.STHE2PSummary,
          compressorSummary:
            obj.analysis?.compressorSummary ??
            initialProcess.analysis.compressorSummary,
          distillationColumnSummary:
            obj.analysis?.distillationColumnSummary ??
            initialProcess.analysis.distillationColumnSummary,
          drumSummary:
            obj.analysis?.drumSummary ?? initialProcess.analysis.drumSummary,
          enlargerSummary:
            obj.analysis?.enlargerSummary ??
            initialProcess.analysis.enlargerSummary,
          expanderSummary:
            obj.analysis?.expanderSummary ??
            initialProcess.analysis.expanderSummary,
          extractorSummary:
            obj.analysis?.extractorSummary ??
            initialProcess.analysis.extractorSummary,
          headerSummary:
            obj.analysis?.headerSummary ??
            initialProcess.analysis.headerSummary,
          heatExchangers:
            obj.analysis?.heatExchangers ??
            initialProcess.analysis.heatExchangers,
          heaterAndCoolerSummary:
            obj.analysis?.heaterAndCoolerSummary ??
            initialProcess.analysis.heaterAndCoolerSummary,
          mixerAndSplitSummary:
            obj.analysis?.mixerAndSplitSummary ??
            initialProcess.analysis.mixerAndSplitSummary,
          pfrSummary:
            obj.analysis?.pfrSummary ?? initialProcess.analysis.pfrSummary,
          pumpSummary:
            obj.analysis?.pumpSummary ?? initialProcess.analysis.pumpSummary,
          separatorSummary:
            obj.analysis?.separatorSummary ??
            initialProcess.analysis.separatorSummary,
          sourceAndSinkSummary:
            obj.analysis?.sourceAndSinkSummary ??
            initialProcess.analysis.sourceAndSinkSummary,
          tankSummary:
            obj.analysis?.tankSummary ?? initialProcess.analysis.tankSummary,
          valveSummary:
            obj.analysis?.valveSummary ?? initialProcess.analysis.valveSummary,
        }
      : initialProcess.analysis,
    lines,
    instrumentations: obj?.instrumentations ?? [],
    instrumentationLines: obj?.instrumentationLines ?? [],
    issues: obj?.issues ?? [],
    imported: obj?.imported ?? [],
  } as TYPES.TProcess;
}

export function updateProcessLine(
  line: TYPES.TProcessLine,
  element: TYPES.TProcessElement,
  connected: TYPES.TProcessElement,
  instrumentations: TYPES.TInstrumentationElement[]
) {
  const isPrevius = line.from === element.name;
  const prev = new THREE.Vector3();
  const next = new THREE.Vector3();
  if (isPrevius) {
    prev.set(element.position.x, element.position.y, element.position.z);
    next.set(connected.position.x, connected.position.y, connected.position.z);
    const prevPoint = element.points.find((p) => p.element === connected.name);
    const nextPoint = connected.points.find((p) => p.element === element.name);
    if (prevPoint) {
      prev.add(
        prevPoint.generalPosition
          .clone()
          .applyAxisAngle(
            new THREE.Vector3(1),
            degToRad(element.rotationX ?? 0)
          )
          .applyAxisAngle(new THREE.Vector3(0, 1), degToRad(element.rotation))
          .applyAxisAngle(
            new THREE.Vector3(0, 0, 1),
            degToRad(element.rotationZ ?? 0)
          )
      );
    }
    if (nextPoint) {
      next.add(
        nextPoint.generalPosition
          .clone()
          .applyAxisAngle(
            new THREE.Vector3(1),
            degToRad(connected.rotationX ?? 0)
          )
          .applyAxisAngle(new THREE.Vector3(0, 1), degToRad(connected.rotation))
          .applyAxisAngle(
            new THREE.Vector3(0, 0, 1),
            degToRad(connected.rotationZ ?? 0)
          )
      );
    }
  } else {
    prev.set(connected.position.x, connected.position.y, connected.position.z);
    next.set(element.position.x, element.position.y, element.position.z);
    const prevPoint = connected.points.find((p) => p.element === element.name);
    const nextPoint = element.points.find((p) => p.element === connected.name);
    if (prevPoint) {
      prev.add(
        prevPoint.generalPosition
          .clone()
          .applyAxisAngle(
            new THREE.Vector3(1),
            degToRad(connected.rotationX ?? 0)
          )
          .applyAxisAngle(new THREE.Vector3(0, 1), degToRad(connected.rotation))
          .applyAxisAngle(
            new THREE.Vector3(0, 0, 1),
            degToRad(connected.rotationZ ?? 0)
          )
      );
    }
    if (nextPoint) {
      next.add(
        nextPoint.generalPosition
          .clone()
          .applyAxisAngle(
            new THREE.Vector3(1),
            degToRad(element.rotationX ?? 0)
          )
          .applyAxisAngle(new THREE.Vector3(0, 1), degToRad(element.rotation))
          .applyAxisAngle(
            new THREE.Vector3(0, 0, 1),
            degToRad(element.rotationZ ?? 0)
          )
      );
    }
  }
  const lockedSegments = line.segments
    .filter((s) => s.locked)
    .map((s) => ({
      ...s,
      start: roundVectorM(s.start.clone()),
      end: roundVectorM(s.end.clone()),
    }));
  const availableSegments = line.segments
    .filter((s) => !s.locked)
    .map((s) => ({
      ...s,
      start: roundVectorM(s.start.clone()),
      end: roundVectorM(s.end.clone()),
    }));
  roundVectorM(prev);
  roundVectorM(next);

  const { segments, fixedInstrs } = addProcessLineSegmentsByOrder(
    line,
    roundVectorM(prev).clone(),
    roundVectorM(next).clone(),
    availableSegments,
    instrumentations
  );

  return recreateProcessLineByInitialLength(
    { ...line, segments } as TYPES.TProcessLine,
    line.initialLength ?? MMtoM(element.parameters?.diameter ?? 0),
    fixedInstrs
  );
}

export function addProcessLineSegmentsByOrder(
  line: TYPES.TProcessLine,
  prev: Vector3,
  next: Vector3,
  availableSegments: TYPES.TProcessLineSegment[],
  instrs: TYPES.TInstrumentationElement[]
) {
  let fixedInstrs = [...instrs];
  const segments: TYPES.TProcessLineSegment[] = [];

  const addSegment = (
    id: number,
    axisS: TYPES.TProcessLineSegment[],
    start: THREE.Vector3,
    end: THREE.Vector3
  ) => {
    if (axisS.length) {
      const f = axisS[0];
      if (f.instrumentationIDs?.length) {
        const oldPos = getMiddleVector3(f.start, f.end);
        const newPos = getMiddleVector3(start, end);
        fixedInstrs = fixedInstrs.map((i) =>
          f.instrumentationIDs!.some((id) => id === i.id)
            ? {
                ...i,
                x: roundM(i.x - oldPos.x + newPos.x),
                y: roundM(i.y - oldPos.y + newPos.y),
                z: roundM(i.z - oldPos.z + newPos.z),
              }
            : i
        );
        return { ...f, start, end };
      } else return { ...f, id, start, end };
    } else {
      return {
        id,
        start,
        end,
        parameters: {
          nps: line.parameters?.nps,
          profile: line.parameters?.schedule,
          material: line.parameters?.material,
          od: line.parameters?.schedule?.outside_diameter_global,
          thickness: line.parameters?.schedule?.wall_thickness_global,
        },
      };
    }
  };

  switch (line.order) {
    case "XZY":
      if (prev.x !== next.x) {
        const axisS = availableSegments.filter((s) => s.start.x !== s.end.x);
        const start = prev.clone();
        const end = prev.clone().setX(next.x);
        segments.push(addSegment(getNextId(segments), axisS, start, end));
      }
      if (prev.z !== next.z) {
        const axisS = availableSegments.filter((s) => s.start.z !== s.end.z);
        const start = prev.clone().setX(next.x);
        const end = next.clone().setY(prev.y);
        segments.push(addSegment(getNextId(segments), axisS, start, end));
      }
      if (prev.y !== next.y) {
        const axisS = availableSegments.filter((s) => s.start.y !== s.end.y);
        const start = next.clone().setY(prev.y);
        const end = next.clone();
        segments.push(addSegment(getNextId(segments), axisS, start, end));
      }
      break;
    case "YXZ":
      if (prev.y !== next.y) {
        const axisS = availableSegments.filter((s) => s.start.y !== s.end.y);
        const start = prev.clone();
        const end = prev.clone().setY(next.y);
        segments.push(addSegment(getNextId(segments), axisS, start, end));
      }
      if (prev.x !== next.x) {
        const axisS = availableSegments.filter((s) => s.start.x !== s.end.x);
        const start = prev.clone().setY(next.y);
        const end = next.clone().setZ(prev.z);
        segments.push(addSegment(getNextId(segments), axisS, start, end));
      }
      if (prev.z !== next.z) {
        const axisS = availableSegments.filter((s) => s.start.z !== s.end.z);
        const start = next.clone().setZ(prev.z);
        const end = next.clone();
        segments.push(addSegment(getNextId(segments), axisS, start, end));
      }
      break;
    case "YZX":
      if (prev.y !== next.y) {
        const axisS = availableSegments.filter((s) => s.start.y !== s.end.y);
        const start = prev.clone();
        const end = prev.clone().setY(next.y);
        segments.push(addSegment(getNextId(segments), axisS, start, end));
      }
      if (prev.z !== next.z) {
        const axisS = availableSegments.filter((s) => s.start.z !== s.end.z);
        const start = prev.clone().setY(next.y);
        const end = next.clone().setX(prev.x);
        segments.push(addSegment(getNextId(segments), axisS, start, end));
      }
      if (prev.x !== next.x) {
        const axisS = availableSegments.filter((s) => s.start.x !== s.end.x);
        const start = next.clone().setX(prev.x);
        const end = next.clone();
        segments.push(addSegment(getNextId(segments), axisS, start, end));
      }
      break;
    case "ZXY":
      if (prev.z !== next.z) {
        const axisS = availableSegments.filter((s) => s.start.z !== s.end.z);
        const start = prev.clone();
        const end = prev.clone().setZ(next.z);
        segments.push(addSegment(getNextId(segments), axisS, start, end));
      }
      if (prev.x !== next.x) {
        const axisS = availableSegments.filter((s) => s.start.x !== s.end.x);
        const start = prev.clone().setZ(next.z);
        const end = next.clone().setY(prev.y);
        segments.push(addSegment(getNextId(segments), axisS, start, end));
      }
      if (prev.y !== next.y) {
        const axisS = availableSegments.filter((s) => s.start.y !== s.end.y);
        const start = next.clone().setY(prev.y);
        const end = next.clone();
        segments.push(addSegment(getNextId(segments), axisS, start, end));
      }
      break;
    case "ZYX":
      if (prev.z !== next.z) {
        const axisS = availableSegments.filter((s) => s.start.z !== s.end.z);
        const start = prev.clone();
        const end = prev.clone().setZ(next.z);
        segments.push(addSegment(getNextId(segments), axisS, start, end));
      }
      if (prev.y !== next.y) {
        const axisS = availableSegments.filter((s) => s.start.y !== s.end.y);
        const start = prev.clone().setZ(next.z);
        const end = next.clone().setX(prev.x);
        segments.push(addSegment(getNextId(segments), axisS, start, end));
      }
      if (prev.x !== next.x) {
        const axisS = availableSegments.filter((s) => s.start.x !== s.end.x);
        const start = next.clone().setX(prev.x);
        const end = next.clone();
        segments.push(addSegment(getNextId(segments), axisS, start, end));
      }
      break;
    case "XYZ":
    default:
      if (prev.x !== next.x) {
        const axisS = availableSegments.filter((s) => s.start.x !== s.end.x);
        const start = prev.clone();
        const end = prev.clone().setX(next.x);
        segments.push(addSegment(getNextId(segments), axisS, start, end));
      }
      if (prev.y !== next.y) {
        const axisS = availableSegments.filter((s) => s.start.y !== s.end.y);
        const start = prev.clone().setX(next.x);
        const end = next.clone().setZ(prev.z);
        segments.push(addSegment(getNextId(segments), axisS, start, end));
      }
      if (prev.z !== next.z) {
        const axisS = availableSegments.filter((s) => s.start.z !== s.end.z);
        const start = next.clone().setZ(prev.z);
        const end = next.clone();
        segments.push(addSegment(getNextId(segments), axisS, start, end));
      }
  }

  return { segments, fixedInstrs };
}

function updateProcessLines(
  process: TYPES.TProcess,
  newElement: TYPES.TProcessElement
): TYPES.TProcess {
  let instrs = process.instrumentations ?? [];
  let changed = process.lines ?? [];
  const lines = changed.filter(
    (l) => l.from === newElement.name || l.to === newElement.name
  );
  for (const line of lines) {
    if (!line.to) continue;
    const connected = process.elements.get(
      line.from === newElement.name ? line.to : line.from
    );
    if (!connected) continue;
    const res = updateProcessLine(line, newElement, connected, instrs);
    instrs = res.instrs;
    changed = changed.map((c) => (c.id === line.id ? res.line : c));
  }
  return { ...process, lines: changed, instrumentations: instrs };
}

export function getNextPipeAngle(prev: Direction3, next: Direction3) {
  if (prev === "+X") {
    if (next === "+Z") {
      return { h: 90, v: 0 };
    } else if (next === "-Z") {
      return { h: -90, v: 0 };
    } else if (next === "+Y") {
      return { h: 0, v: 90 };
    } else if (next === "-Y") {
      return { h: 0, v: -90 };
    }
  } else if (prev === "-X") {
    if (next === "+Z") {
      return { h: -90, v: 0 };
    } else if (next === "-Z") {
      return { h: 90, v: 0 };
    } else if (next === "+Y") {
      return { h: 0, v: 90 };
    } else if (next === "-Y") {
      return { h: 0, v: -90 };
    }
  } else if (prev === "+Z") {
    if (next === "+X") {
      return { h: -90, v: 0 };
    } else if (next === "-X") {
      return { h: 90, v: 0 };
    } else if (next === "+Y") {
      return { h: 0, v: 90 };
    } else if (next === "-Y") {
      return { h: 0, v: -90 };
    }
  } else if (prev === "-Z") {
    if (next === "+X") {
      return { h: 90, v: 0 };
    } else if (next === "-X") {
      return { h: -90, v: 0 };
    } else if (next === "+Y") {
      return { h: 0, v: 90 };
    } else if (next === "-Y") {
      return { h: 0, v: -90 };
    }
  } else if (prev === "+Y") {
    if (next === "+X") {
      return { h: -90, v: 0 };
    } else if (next === "-X") {
      return { h: 90, v: 0 };
    } else if (next === "+Z") {
      return { h: 0, v: -90 };
    } else if (next === "-Z") {
      return { h: 0, v: 90 };
    }
  } else if (prev === "-Y") {
    if (next === "+X") {
      return { h: -90, v: 0 };
    } else if (next === "-X") {
      return { h: 90, v: 0 };
    } else if (next === "+Z") {
      return { h: 90, v: 90 };
    } else if (next === "-Z") {
      return { h: 90, v: -90 };
    }
  }
  return { h: 0, v: 0 };
}

function updatePipes(
  dispatch: Dispatch,
  project: Project,
  process: TYPES.TProcess
) {
  if (!project) return;
  let pipes = [...(project.freePipes ?? [])];
  const { elements, lines } = process;
  const usedValves: string[] = [];
  for (const line of lines ?? []) {
    if (!line.to) continue;
    const lineNo = line.processLineNo ?? 0;
    const prev = elements.get(line.from);
    const next = elements.get(line.to);

    const pipeLine = pipes.filter((p) => p.processLine === lineNo);
    pipes = pipes.filter((p) => p.processLine !== lineNo);

    let first: FreePipe | undefined;
    let last: FreePipe | undefined;
    for (const segment of line.segments) {
      const length = roundM(segment.start.distanceTo(segment.end));
      const pipe = createFreePipe(
        pipes,
        segment.start,
        segment.end,
        segment,
        lineNo
      );
      if (!first) first = pipe;
      const prevD = getDirection(
        new THREE.Vector3(
          (last ?? first).x1,
          (last ?? first).y1,
          (last ?? first).z1
        ),
        new THREE.Vector3(
          (last ?? first).x2,
          (last ?? first).y2,
          (last ?? first).z2
        )
      );
      const nextD = getDirection(
        new THREE.Vector3(pipe.x1, pipe.y1, pipe.z1),
        new THREE.Vector3(pipe.x2, pipe.y2, pipe.z2)
      );
      const { h, v } = getNextPipeAngle(prevD, nextD);
      pipes.push(
        last ? { ...pipe, preceding: last.pipe, hDir: h, vDir: v } : pipe
      );
      last = pipe;
    }

    if (first && prev?.type === TYPES.EProcessElementType.VALVE) {
      const s_valve = prev as TYPES.TProcessValve;
      const valveStart = new THREE.Vector3(
        s_valve.position.x,
        s_valve.position.y,
        s_valve.position.z
      );
      const endPoint = s_valve.points.find((p) => p.connectionType === "START");
      const valveEnd = endPoint
        ? new THREE.Vector3(
            endPoint.generalPosition.x,
            endPoint.generalPosition.y,
            endPoint.generalPosition.z
          )
            .applyAxisAngle(
              new THREE.Vector3(1),
              degToRad(s_valve.rotationX ?? 0)
            )
            .applyAxisAngle(new THREE.Vector3(0, 1), degToRad(s_valve.rotation))
            .applyAxisAngle(
              new THREE.Vector3(0, 0, 1),
              degToRad(s_valve.rotationZ ?? 0)
            )
            .add(valveStart)
        : valveStart.clone();
      const valveLength = roundM(valveStart.distanceTo(valveEnd));
      const valveDir = getDirection(valveStart, valveEnd);
      const pipeDir = getDirection(
        new THREE.Vector3(first.x1, first.y1, first.z1),
        new THREE.Vector3(first.x2, first.y2, first.z2)
      );
      if (valveDir === pipeDir || !valveLength) {
        pipes = pipes.map((p) =>
          p.id === first?.id
            ? {
                ...p,
                x1: valveStart.x,
                y1: valveStart.y,
                z1: valveStart.z,
                params: !usedValves.includes(prev.name)
                  ? {
                      ...p.params,
                      valveType: s_valve.parameters.type ?? "Gate Valve",
                      valveActuator: s_valve.parameters.actuator,
                      valveControl: s_valve.parameters.control,
                      valvePosition: "START",
                    }
                  : p.params,
              }
            : p
        );
      } else {
        const { h, v } = getNextPipeAngle(valveDir, pipeDir);
        const id = getNextId(pipes);
        pipes = [
          ...pipes,
          {
            ...first,
            id,
            pipe: `PP${id}`,
            elevation: (valveStart.y + valveEnd.y) / 2,
            length: roundM(valveStart.distanceTo(valveEnd)),
            x1: roundM(valveStart.x),
            y1: roundM(valveStart.y),
            z1: roundM(valveStart.z),
            x2: roundM(valveEnd.x),
            y2: roundM(valveEnd.y),
            z2: roundM(valveEnd.z),
            preceding: "START",
            vDir: 0,
            hDir: 0,
            params: !usedValves.includes(prev.name)
              ? {
                  ...first.params,
                  valveType: s_valve.parameters.type ?? "Gate Valve",
                  valveActuator: s_valve.parameters.actuator,
                  valveControl: s_valve.parameters.control,
                  valvePosition: "START",
                }
              : first.params,
          } as FreePipe,
        ].map((p) =>
          p.id === first?.id
            ? { ...p, preceding: `PP${id}`, hDir: h, vDir: v }
            : p
        );
      }
      usedValves.push(prev.name);
    }

    if (last && next?.type === TYPES.EProcessElementType.VALVE) {
      const e_valve = next as TYPES.TProcessValve;
      const valveEnd = new THREE.Vector3(
        e_valve.position.x,
        e_valve.position.y,
        e_valve.position.z
      );
      const startPoint = e_valve.points.find((p) => p.connectionType === "END");
      const valveStart = startPoint
        ? new THREE.Vector3(
            startPoint.generalPosition.x,
            startPoint.generalPosition.y,
            startPoint.generalPosition.z
          )
            .applyAxisAngle(
              new THREE.Vector3(1),
              degToRad(e_valve.rotationX ?? 0)
            )
            .applyAxisAngle(new THREE.Vector3(0, 1), degToRad(e_valve.rotation))
            .applyAxisAngle(
              new THREE.Vector3(0, 0, 1),
              degToRad(e_valve.rotationZ ?? 0)
            )
            .add(valveEnd)
        : valveEnd.clone();
      const valveLength = roundM(valveStart.distanceTo(valveEnd));
      const valveDir = getDirection(valveStart, valveEnd);
      const pipeDir = getDirection(
        new THREE.Vector3(last.x1, last.y1, last.z1),
        new THREE.Vector3(last.x2, last.y2, last.z2)
      );
      if (valveDir === pipeDir || !valveLength) {
        pipes = pipes.map((p) =>
          p.id === last?.id
            ? {
                ...p,
                x2: valveEnd.x,
                y2: valveEnd.y,
                z2: valveEnd.z,
                params: !usedValves.includes(next.name)
                  ? {
                      ...p.params,
                      valveType: e_valve.parameters.type ?? "Gate Valve",
                      valveActuator: e_valve.parameters.actuator,
                      valveControl: e_valve.parameters.control,
                      valvePosition: "END",
                    }
                  : p.params,
              }
            : p
        );
      } else {
        const { h, v } = getNextPipeAngle(valveDir, pipeDir);
        const id = getNextId(pipes);
        pipes = [
          ...pipes,
          {
            ...last,
            id,
            pipe: `PP${id}`,
            elevation: (valveStart.y + valveEnd.y) / 2,
            length: roundM(valveStart.distanceTo(valveEnd)),
            x1: roundM(valveStart.x),
            y1: roundM(valveStart.y),
            z1: roundM(valveStart.z),
            x2: roundM(valveEnd.x),
            y2: roundM(valveEnd.y),
            z2: roundM(valveEnd.z),
            preceding: last.pipe,
            vDir: v,
            hDir: h,
            params: !usedValves.includes(next.name)
              ? {
                  ...last.params,
                  valveType: e_valve.parameters.type ?? "Gate Valve",
                  valveActuator: e_valve.parameters.actuator,
                  valveControl: e_valve.parameters.control,
                  valvePosition: "END",
                }
              : last.params,
          } as FreePipe,
        ];
      }
      usedValves.push(next.name);
    }

    const lineLength = pipeLine.reduce((acc, p) => acc + p.length, 0);
    const processLineLength = line.segments.reduce(
      (acc, s) => acc + s.start.distanceTo(s.end),
      0
    );
    if (lineLength && lineLength !== processLineLength) {
      dispatch(
        addEventAction(
          `Process Import: Pipe Line (${line}) length (${lineLength}m) is not equal to Process Line (${line.from} - ${line.to}) length (${processLineLength}m)`,
          "danger"
        )
      );
    }
  }

  pipes.sort((a, b) => a.id - b.id);
  dispatch(setProcessAction(project.name, process));
  dispatch(changeProjectAction({ ...project, freePipes: pipes }));
}

function createFreePipe(
  pipes: FreePipe[],
  start: THREE.Vector3,
  end: THREE.Vector3,
  data: TYPES.TProcessLineSegment,
  line: number
) {
  const id = getNextId(pipes);
  const elevation = roundM((start.y + end.y) / 2);
  const length = roundM(start.distanceTo(end));
  const pipe: FreePipe = {
    id,
    processLine: line,
    line,
    pipe: `PP${id}`,
    elevation,
    length,
    x1: roundM(start.x),
    y1: roundM(start.y),
    z1: roundM(start.z),
    x2: roundM(end.x),
    y2: roundM(end.y),
    z2: roundM(end.z),
    preceding: "START",
    vDir: 0,
    hDir: 0,
    params: {
      millTolerance: data.parameters?.millTolerance ?? 12.5,
      longWeldType: data.parameters?.longWeldType ?? "S",
      corrosionAllowance: data.parameters?.corrosionAllowance ?? 0,
      lib: data.parameters?.profile?.country_code,
      nps: data.parameters?.nps ? `${data.parameters?.nps}` : undefined,
      profile: data.parameters?.profile,
      material: data.parameters?.material,
      od:
        data.parameters?.profile?.outside_diameter_global ??
        data.parameters?.od,
      thickness: data.parameters?.profile?.wall_thickness_global ?? 1,
      fluidDensity: data.parameters?.velocity,
      P1: data.parameters?.P1,
      T2: data.parameters?.T2,
    },
  };
  return pipe;
}

function updateCables(
  dispatch: Dispatch,
  project: Project,
  process: TYPES.TProcess
) {
  if (!project) return;
  let cables = [...(project.freeCables ?? [])];
  const { elements, lines } = process;
  const usedValves: string[] = [];
  for (const line of lines ?? []) {
    if (!line.to) continue;
    const lineNo = line.processLineNo ?? 0;
    const prev = elements.get(line.from);
    const next = elements.get(line.to);

    const cableLine = cables.filter((p) => p.processLine === lineNo);
    cables = cables.filter((p) => p.processLine !== lineNo);

    let first: FreeCable | undefined;
    let last: FreeCable | undefined;
    for (const segment of line.segments) {
      const length = roundM(segment.start.distanceTo(segment.end));
      const cable = createFreeCable(
        cables,
        segment.start,
        segment.end,
        segment,
        lineNo
      );
      if (!first) first = cable;
      const prevD = getDirection(
        new THREE.Vector3(
          (last ?? first).x1,
          (last ?? first).y1,
          (last ?? first).z1
        ),
        new THREE.Vector3(
          (last ?? first).x2,
          (last ?? first).y2,
          (last ?? first).z2
        )
      );
      const nextD = getDirection(
        new THREE.Vector3(cable.x1, cable.y1, cable.z1),
        new THREE.Vector3(cable.x2, cable.y2, cable.z2)
      );
      const { h, v } = getNextPipeAngle(prevD, nextD);
      cables.push(
        last ? { ...cable, preceding: last.cable, hDir: h, vDir: v } : cable
      );
      last = cable;
    }

    if (first && prev?.type === TYPES.EProcessElementType.VALVE) {
      const s_valve = prev as TYPES.TProcessValve;
      const valveStart = new THREE.Vector3(
        s_valve.position.x,
        s_valve.position.y,
        s_valve.position.z
      );
      const endPoint = s_valve.points.find((p) => p.connectionType === "START");
      const valveEnd = endPoint
        ? new THREE.Vector3(
            endPoint.generalPosition.x,
            endPoint.generalPosition.y,
            endPoint.generalPosition.z
          )
            .applyAxisAngle(
              new THREE.Vector3(1),
              degToRad(s_valve.rotationX ?? 0)
            )
            .applyAxisAngle(new THREE.Vector3(0, 1), degToRad(s_valve.rotation))
            .applyAxisAngle(
              new THREE.Vector3(0, 0, 1),
              degToRad(s_valve.rotationZ ?? 0)
            )
            .add(valveStart)
        : valveStart.clone();
      const valveLength = roundM(valveStart.distanceTo(valveEnd));
      const valveDir = getDirection(valveStart, valveEnd);
      const pipeDir = getDirection(
        new THREE.Vector3(first.x1, first.y1, first.z1),
        new THREE.Vector3(first.x2, first.y2, first.z2)
      );
      if (valveDir === pipeDir || !valveLength) {
        cables = cables.map((p) =>
          p.id === first?.id
            ? {
                ...p,
                x1: valveStart.x,
                y1: valveStart.y,
                z1: valveStart.z,
                params: !usedValves.includes(prev.name)
                  ? {
                      ...p.params,
                      valveType: s_valve.parameters.type ?? "Gate Valve",
                      valveActuator: s_valve.parameters.actuator,
                      valveControl: s_valve.parameters.control,
                      valvePosition: "START",
                    }
                  : p.params,
              }
            : p
        );
      } else {
        const { h, v } = getNextPipeAngle(valveDir, pipeDir);
        const id = getNextId(cables);
        cables = [
          ...cables,
          {
            ...first,
            id,
            cable: `PP${id}`,
            elevation: (valveStart.y + valveEnd.y) / 2,
            length: roundM(valveStart.distanceTo(valveEnd)),
            x1: roundM(valveStart.x),
            y1: roundM(valveStart.y),
            z1: roundM(valveStart.z),
            x2: roundM(valveEnd.x),
            y2: roundM(valveEnd.y),
            z2: roundM(valveEnd.z),
            preceding: "START",
            vDir: 0,
            hDir: 0,
            params: !usedValves.includes(prev.name)
              ? {
                  ...first.params,
                  valveType: s_valve.parameters.type ?? "Gate Valve",
                  valveActuator: s_valve.parameters.actuator,
                  valveControl: s_valve.parameters.control,
                  valvePosition: "START",
                }
              : first.params,
          } as FreeCable,
        ].map((p) =>
          p.id === first?.id
            ? { ...p, preceding: `PP${id}`, hDir: h, vDir: v }
            : p
        );
      }
      usedValves.push(prev.name);
    }

    if (last && next?.type === TYPES.EProcessElementType.VALVE) {
      const e_valve = next as TYPES.TProcessValve;
      const valveEnd = new THREE.Vector3(
        e_valve.position.x,
        e_valve.position.y,
        e_valve.position.z
      );
      const startPoint = e_valve.points.find((p) => p.connectionType === "END");
      const valveStart = startPoint
        ? new THREE.Vector3(
            startPoint.generalPosition.x,
            startPoint.generalPosition.y,
            startPoint.generalPosition.z
          )
            .applyAxisAngle(
              new THREE.Vector3(1),
              degToRad(e_valve.rotationX ?? 0)
            )
            .applyAxisAngle(new THREE.Vector3(0, 1), degToRad(e_valve.rotation))
            .applyAxisAngle(
              new THREE.Vector3(0, 0, 1),
              degToRad(e_valve.rotationZ ?? 0)
            )
            .add(valveEnd)
        : valveEnd.clone();
      const valveLength = roundM(valveStart.distanceTo(valveEnd));
      const valveDir = getDirection(valveStart, valveEnd);
      const pipeDir = getDirection(
        new THREE.Vector3(last.x1, last.y1, last.z1),
        new THREE.Vector3(last.x2, last.y2, last.z2)
      );
      if (valveDir === pipeDir || !valveLength) {
        cables = cables.map((p) =>
          p.id === last?.id
            ? {
                ...p,
                x2: valveEnd.x,
                y2: valveEnd.y,
                z2: valveEnd.z,
                params: !usedValves.includes(next.name)
                  ? {
                      ...p.params,
                      valveType: e_valve.parameters.type ?? "Gate Valve",
                      valveActuator: e_valve.parameters.actuator,
                      valveControl: e_valve.parameters.control,
                      valvePosition: "END",
                    }
                  : p.params,
              }
            : p
        );
      } else {
        const { h, v } = getNextPipeAngle(valveDir, pipeDir);
        const id = getNextId(cables);
        cables = [
          ...cables,
          {
            ...last,
            id,
            cable: `PP${id}`,
            elevation: (valveStart.y + valveEnd.y) / 2,
            length: roundM(valveStart.distanceTo(valveEnd)),
            x1: roundM(valveStart.x),
            y1: roundM(valveStart.y),
            z1: roundM(valveStart.z),
            x2: roundM(valveEnd.x),
            y2: roundM(valveEnd.y),
            z2: roundM(valveEnd.z),
            preceding: last.cable,
            vDir: v,
            hDir: h,
            params: !usedValves.includes(next.name)
              ? {
                  ...last.params,
                  valveType: e_valve.parameters.type ?? "Gate Valve",
                  valveActuator: e_valve.parameters.actuator,
                  valveControl: e_valve.parameters.control,
                  valvePosition: "END",
                }
              : last.params,
          } as FreeCable,
        ];
      }
      usedValves.push(next.name);
    }

    const lineLength = cableLine.reduce((acc, p) => acc + p.length, 0);
    const processLineLength = line.segments.reduce(
      (acc, s) => acc + s.start.distanceTo(s.end),
      0
    );
    if (lineLength && lineLength !== processLineLength) {
      dispatch(
        addEventAction(
          `Process Import: Pipe Line (${line}) length (${lineLength}m) is not equal to Process Line (${line.from} - ${line.to}) length (${processLineLength}m)`,
          "danger"
        )
      );
    }
  }

  cables.sort((a, b) => a.id - b.id);
  dispatch(setProcessAction(project.name, process));
  dispatch(changeProjectAction({ ...project, freeCables: cables }));
}

function createFreeCable(
  cables: FreeCable[],
  start: THREE.Vector3,
  end: THREE.Vector3,
  data: TYPES.TProcessLineSegment,
  line: number
) {
  const id = getNextId(cables);
  const elevation = roundM((start.y + end.y) / 2);
  const length = roundM(start.distanceTo(end));
  const cable: FreeCable = {
    id,
    processLine: line,
    line,
    cable: `PP${id}`,
    elevation,
    length,
    x1: roundM(start.x),
    y1: roundM(start.y),
    z1: roundM(start.z),
    x2: roundM(end.x),
    y2: roundM(end.y),
    z2: roundM(end.z),
    preceding: "START",
    vDir: 0,
    hDir: 0,
    params: {
      millTolerance: data.parameters?.millTolerance ?? 12.5,
      longWeldType: data.parameters?.longWeldType ?? "S",
      corrosionAllowance: data.parameters?.corrosionAllowance ?? 0,
      lib: data.parameters?.profile?.country_code,
      nps: data.parameters?.nps ? `${data.parameters?.nps}` : undefined,
      profile: data.parameters?.profile,
      material: data.parameters?.material,
      od:
        data.parameters?.profile?.outside_diameter_global ??
        data.parameters?.od,
      thickness: data.parameters?.profile?.wall_thickness_global ?? 1,
      fluidDensity: data.parameters?.velocity,
      P1: data.parameters?.P1,
      T2: data.parameters?.T2,
    },
  };
  return cable;
}

function drawProcess(
  project: Project,
  mode: TWorkMode,
  process: TYPES.TProcess,
  state: TYPES.TProcessState,
  data: DataState,
  isProcessPipe: boolean,
  isDimension: boolean,
  font?: Font,
  MPCState?: TMousePipeCreatingAtom
) {
  const group = new THREE.Group();
  group.name = "PROCESS";
  const lines = process.lines ?? [];
  const instrs = process.instrumentations ?? [];
  const instrLines = process.instrumentationLines ?? [];
  for (const el of Array.from(process.elements.values())) {
    const elMesh = drawProcessElement(
      mode,
      el,
      undefined,
      state.selected,
      state.selectedPoint,
      state.selectedNozzle,
      data.font ?? font,
      MPCState
    );
    if (isDimension) {
      elMesh.geometry.computeBoundingSphere();
      const sphere = elMesh.geometry.boundingSphere;
      const anchor = createAnchor(sphere.radius, new Vector3(), {
        isDimensionAnchor: true,
        position: elMesh.position.clone(),
      });
      elMesh.add(anchor);
    }
    group.add(elMesh);
  }
  const lID = state.selectedLine?.id;
  const pipeOpacity =
    (project.settings.models.processPipeTransparency ?? 0) / 100;
  // pipeMaterial.opacity = pipeOpacity;
  for (const line of lines) {
    for (const segment of line.segments) {
      const lineMesh = createBoldLine(
        segment.start,
        segment.end,
        line.parameters?.type,
        data.font,
        0.005
      );
      if (lineMesh) {
        if (line.type === "PIPE") {
          const length = segment.start.distanceTo(segment.end) * 0.05;
          const pipe = createPipeMesh(
            0.05,
            0.005,
            length,
            lID === line.id ? selectedMeshMaterial : meshMaterial
          );
          if (pipe) {
            if ((lineMesh as THREE.Group).isGroup) {
              const end = segment.end.clone().sub(segment.start);
              pipe.position.copy(end.clone().divideScalar(2));
              pipe.lookAt(end);
            } else {
              pipe.position.setY(-length / 2);
              pipe.rotateX(-deg90InRad);
            }
            lineMesh.add(pipe);
          }
        }
        lineMesh.userData = {
          isProcessLine: true,
          segmentID: segment.id,
          line,
        };
        if (isProcessPipe) {
          const pos = getMiddleVector3(segment.start, segment.end);
          const anchorData: TPipeElementAnchor = {
            processLine: line,
            segmentId: segment.id,
          };
          const anchor = createAnchor(
            MMtoM(segment.parameters?.od ?? 0.2) * 0.8,
            pos,
            anchorData
          );
          group.add(anchor);
        }
        group.add(lineMesh);
      }
    }
    if (pipeOpacity) {
      const material = lineMeshMaterial.clone();
      material.transparent = pipeOpacity < 1;
      material.opacity = pipeOpacity;
      for (let i = 0; i < line.segments.length; i++) {
        const pipe = line.segments[i];
        if (!pipe.parameters?.profile) continue;
        const start = pipe.start.clone();
        const end = pipe.end.clone();
        let offset = 0;
        if (i) {
          const prev = line.segments[i - 1];
          if (prev) {
            const connector = data.pipingElbows.find(
              (elbow) =>
                elbow.degree === 90 && elbow.nps === pipe.parameters?.nps
            );
            offset = MMtoM((connector as TPipingElbow)?.a ?? 0);
            offset &&
              start.copy(roundVectorM(getPosByDistance(offset, start, end)));
          }
        }
        const { endConnector, distance } =
          i < line.segments.length - 1
            ? createEndConnector(
                i,
                pipe,
                start,
                end,
                line.segments,
                material,
                data
              )
            : { endConnector: undefined, distance: start.distanceTo(end) };
        const radius = MMtoM(pipe.parameters?.od ?? 0) / 2;
        const thickness = MMtoM(pipe.parameters?.thickness ?? 0);
        const pipeGroup = new THREE.Group();
        const pipeMesh = createPipeMesh(radius, thickness, distance, material);
        pipeMesh.rotateY(deg90InRad);
        pipeGroup.add(pipeMesh);
        if (endConnector) {
          pipeGroup.add(endConnector);
        }
        pipeGroup.position.copy(start);
        pipeGroup.lookAt(end);
        pipeGroup.rotateY(-deg90InRad);
        group.add(pipeGroup);
      }
    }
  }
  for (const instr of instrs) {
    let connected;
    const connectedInstr = instrs.find((i) => i.id === instr.connected);
    if (connectedInstr) {
      if (connectedInstr.parentType === "PIPE") {
        const line = lines.find((l) => l.id === instr.parent);
        connected = line?.segments.find((s) => s.id === instr.parentID);
      } else if (connectedInstr.parentType === "PROCESS") {
        connected = process.elements.get(connectedInstr.parent + "");
      }
    }
    if (instr.parentType === "PIPE") {
      const line = lines.find((l) => l.id === instr.parent);
      const segment = line?.segments.find((s) => s.id === instr.parentID);
      if (!segment) continue;
      group.add(
        drawInstrElement(
          instr,
          segment,
          connected,
          data.font,
          state.selectedInstr?.id === instr.id
        )
      );
    } else if (instr.parentType === "PROCESS") {
      const element = process.elements.get(instr.parent + "");
      if (!element) continue;
      group.add(
        drawInstrElement(
          instr,
          element,
          connected,
          data.font,
          state.selectedInstr?.id === instr.id
        )
      );
    }
  }
  for (const line of instrLines) {
    const start = new THREE.Vector3();
    const to = instrs.find((i) => i.id === line.to);
    if (!to) continue;
    const end = new THREE.Vector3(to.x, to.y, to.z);
    if (line.connectionType === "ItoI") {
      const from = instrs.find((i) => i.id === line.from);
      if (!from) continue;
      start.set(from.x, from.y, from.z);
    } else if (line.connectionType === "PtoI") {
      const from = process.elements.get(line.from + "");
      if (!from) continue;
      start.set(from.position.x, from.position.y, from.position.z);
    } else if (line.connectionType === "LtoI") {
      const fromLine = process.lines?.find((l) => l.id === line.from);
      const fromSegment = fromLine?.segments.find((l) => l.id === line.fromID);
      if (!fromSegment) continue;
      start.copy(getMiddleVector3(fromSegment.start, fromSegment.end));
    }
    const isSelected = state.selectedInstrLine?.id === line.id;
    const m1 = new MeshLambertMaterial({
      color: isSelected ? "red" : "black",
      side: THREE.DoubleSide,
    });
    const m2 = new MeshLambertMaterial({ visible: false });
    const points: THREE.Vector3[][] = [];
    if (start.x !== end.x) {
      const s = start.clone();
      const e = new THREE.Vector3(end.x, start.y, start.z);
      s.copy(getPosByDistance(0.125, s, e));
      points.push([s, e]);
    }
    if (start.y !== end.y) {
      const s = new THREE.Vector3(end.x, start.y, start.z);
      const e = new THREE.Vector3(end.x, end.y, start.z);
      if (!points.length) s.copy(getPosByDistance(0.125, s, e));
      points.push([s, e]);
    }
    if (start.z !== end.z) {
      const s = new THREE.Vector3(end.x, end.y, start.z);
      const e = end.clone();
      if (!points.length) s.copy(getPosByDistance(0.125, s, e));
      e.copy(getPosByDistance(0.125, e, s));
      points.push([s, e]);
    }
    for (const point of points) {
      const lineMesh = createBoldLine(
        point[0],
        point[1],
        line.type,
        data.font,
        0.005,
        m1
      );
      const lineMeshT = createBoldLine(
        point[0],
        point[1],
        undefined,
        undefined,
        0.025,
        m2
      );
      if (lineMesh && lineMeshT) {
        lineMeshT.userData = { isInstrLine: true, line };
        group.add(lineMesh, lineMeshT);
      }
    }
  }

  return group;
}

function createEndConnector(
  i: number,
  pipe: TYPES.TProcessLineSegment,
  startPos: THREE.Vector3,
  endPos: THREE.Vector3,
  pipes: TYPES.TProcessLineSegment[],
  material: THREE.MeshLambertMaterial,
  data: DataState
) {
  const distance = startPos.distanceTo(endPos);
  const params = data.pipingElbows.find(
    (elbow) => elbow.degree === 90 && elbow.nps === pipe.parameters?.nps
  );
  if (!params) return { endConnector: undefined, distance };
  const radius = MMtoM(params.d) / 2;
  const a = MMtoM(params.a);
  const start = new THREE.Vector3(0, 0, -a);
  const end = roundVectorM(
    start
      .clone()
      .applyAxisAngle(new THREE.Vector3(0, 1), degToRad(180 - params.degree))
  );
  const curve = new THREE.QuadraticBezierCurve3(
    start,
    new THREE.Vector3(),
    end
  );
  const mesh = new THREE.Mesh(
    new THREE.TubeBufferGeometry(curve, 32, radius, 32),
    material
  );
  mesh.rotateY(deg90InRad);
  const endConnector = new THREE.Group().add(mesh);
  endConnector.position.setX(distance);
  endPos.copy(roundVectorM(getPosByDistance(distance - a, startPos, endPos)));
  const next = pipes[i + 1];
  setEndConnectorRotation(endConnector, pipe, next);
  return { endConnector, distance: startPos.distanceTo(endPos) };
}

function setEndConnectorRotation(
  endConnector: THREE.Group | THREE.Mesh,
  prev: TYPES.TProcessLineSegment,
  next?: TYPES.TProcessLineSegment
) {
  if (!next) return;
  const prevD = getDirection(prev.start, prev.end);
  const nextD = getDirection(next.start, next.end);
  const { h, v } = getNextPipeAngle(prevD, nextD);
  endConnector.rotateX(getRotationAngle(h, -v));
}

function drawInstrElement(
  instr: TYPES.TInstrumentationElement,
  parent: any,
  connected: any,
  font?: THREE.Font,
  isSelected?: boolean
) {
  const group = new THREE.Group();
  group.position.set(instr.x, instr.y, instr.z);
  let control = "";
  const p = parent as TYPES.TProcessElement;
  if (p.type === TYPES.EProcessElementType.VALVE) {
    if (p.parameters.control as TValveControlType)
      control = p.parameters.control[0];
  } else if (connected?.type === TYPES.EProcessElementType.VALVE) {
    if (connected.parameters.control as TValveControlType)
      control = connected.parameters.control[0];
  }
  const sphere = new THREE.Mesh(
    new THREE.SphereGeometry(0.125, 16, 16),
    new THREE.MeshBasicMaterial({
      color: "black",
      transparent: true,
      opacity: 0.1,
    })
  );
  sphere.userData = { isIntrumentationElement: true, instr };
  createText(
    sphere,
    font,
    control + (instr.combinedType ? instr.combinedType[0] : "") + instr.name,
    new THREE.Vector3(),
    undefined,
    undefined,
    {
      size: 0.0625,
      height: 0.001,
    },
    new THREE.LineBasicMaterial({ color: isSelected ? "red" : "black" })
  );
  group.add(sphere);
  return group;
}

export function drawProcessElement(
  mode: TWorkMode,
  el: TYPES.TProcessElement,
  isDimension?: boolean,
  selected?: TYPES.TProcessElement,
  selectedPoint?: TYPES.TProcessElementPoint,
  selectedNozzle?: any,
  font?: THREE.Font,
  MPCState?: TMousePipeCreatingAtom
): THREE.Mesh {
  const mesh = new THREE.Mesh(new THREE.Geometry());
  const material =
    el.name === selected?.name
      ? selectedMeshMaterial.clone()
      : el?.color
      ? new THREE.MeshLambertMaterial({
          color: el.color,
          side: THREE.DoubleSide,
        })
      : meshMaterial.clone();

  material.transparent = true;
  material.opacity = 1 - (el.opacity ?? 0);

  const elementMesh = new THREE.Mesh(new THREE.Geometry());
  switch (el.type) {
    case TYPES.EProcessElementType.SOURCE:
      drawSource(elementMesh, el as TYPES.TProcessSource);
      break;
    case TYPES.EProcessElementType.SINK:
      drawSink(elementMesh, el as TYPES.TProcessSink);
      break;
    case TYPES.EProcessElementType.VALVE:
      drawValve(mode, elementMesh, el as TYPES.TProcessValve);
      break;
    case TYPES.EProcessElementType.MIX:
      drawMix(elementMesh, el as TYPES.TProcessMix);
      break;
    case TYPES.EProcessElementType.SPLIT:
      drawSplit(elementMesh, el as TYPES.TProcessSplit);
      break;
    case TYPES.EProcessElementType.TANK:
      drawTank(elementMesh, el as TYPES.TProcessTank);
      break;
    case TYPES.EProcessElementType.PUMP:
      drawPump(elementMesh, el as TYPES.TProcessPump);
      break;
    case TYPES.EProcessElementType.HEADER:
      drawHeader(elementMesh, el as TYPES.TProcessHeader);
      break;
    case TYPES.EProcessElementType.AAM:
      drawAAM(elementMesh, el as TYPES.TProcessHeader);
      break;
    case TYPES.EProcessElementType.FireHose:
      drawFireHose(elementMesh, el as TYPES.TProcessHeader);
      break;
    case TYPES.EProcessElementType.AIC:
      drawAIC(elementMesh, el as TYPES.TProcessHeader);
      break;
    case TYPES.EProcessElementType.TAM:
      drawTAM(elementMesh, el as TYPES.TProcessHeader);
      break;
    case TYPES.EProcessElementType.DRUM:
      drawDrum(elementMesh, el as TYPES.TProcessDrum);
      break;
    case TYPES.EProcessElementType.SEPARATOR:
      drawSeparator(elementMesh, el as TYPES.TProcessSeparator);
      break;
    case TYPES.EProcessElementType.HORIZONTAL_DRUM:
      drawHorizontalDrum(elementMesh, el as TYPES.TProcessHorizontalDrum);
      break;
    case TYPES.EProcessElementType.DISTILLATION_COLUMN:
      drawColumn(elementMesh, el as TYPES.TProcessColumn);
      break;
    case TYPES.EProcessElementType.BC:
      drawBC(elementMesh, el as TYPES.TProcessColumn);
      break;
    case TYPES.EProcessElementType.AV:
      drawAV(elementMesh, el as TYPES.TProcessColumn);
      break;
    case TYPES.EProcessElementType.AH:
      drawAH(elementMesh, el as TYPES.TProcessColumn);
      break;
    case TYPES.EProcessElementType.WHB:
      drawWHB(elementMesh, el as TYPES.TProcessColumn);
      break;
    case TYPES.EProcessElementType.CC:
      drawCC(elementMesh, el as TYPES.TProcessColumn);
      break;
    case TYPES.EProcessElementType.ES:
      drawES(elementMesh, el as TYPES.TProcessColumn);
      break;
    case TYPES.EProcessElementType.NOX_ABATOR:
      drawNoxAbator(elementMesh, el as TYPES.TProcessColumn);
      break;
    case TYPES.EProcessElementType.NAH:
      drawNAH(elementMesh, el as TYPES.TProcessColumn, material);
      break;
    case TYPES.EProcessElementType.TGP:
      drawTGP(elementMesh, el as TYPES.TProcessColumn, material);
      break;
    case TYPES.EProcessElementType.IAF:
      drawIAF(elementMesh, el as TYPES.TProcessColumn, material);
      drawBlockElement(mesh, el, material);
      break;
    case TYPES.EProcessElementType.DAF:
      drawDAF(elementMesh, el as TYPES.TProcessColumn, material);
      break;
    case TYPES.EProcessElementType.A_B_PUMP:
      drawAB_PUMP(mesh, el as TYPES.TProcessColumn, material);
      break;
    case TYPES.EProcessElementType.PUMP_PRELUBE:
      drawPUMP_PRELUDE(mesh, el as TYPES.TProcessColumn, material);
      break;
    case TYPES.EProcessElementType.EXTRACTOR:
      drawExtractor(elementMesh, el as TYPES.TProcessExtractor);
      break;
    case TYPES.EProcessElementType.EXPANDER:
      drawExpander(elementMesh, el as TYPES.TProcessExpander);
      break;
    case TYPES.EProcessElementType.COMPRESSOR:
      drawCompressor(elementMesh, el as TYPES.TProcessCompressor);
      break;
    case TYPES.EProcessElementType.PSV:
      drawPSV(elementMesh, el as TYPES.TProcessPSV);
      break;
    case TYPES.EProcessElementType.ENLARGER:
      drawEnlarger(elementMesh, el as TYPES.TProcessEnlarger);
      break;
    case TYPES.EProcessElementType.PFR:
      drawPFR(elementMesh, el as TYPES.TProcessPFR);
      break;
    case TYPES.EProcessElementType.CSTR:
      drawCSTR(elementMesh, el as TYPES.TProcessCSTR);
      break;
    case TYPES.EProcessElementType.RE:
      drawReactor(elementMesh, el as TYPES.TProcessRE);
      break;
    case TYPES.EProcessElementType.RC:
      drawReactor(elementMesh, el as TYPES.TProcessRC, font);
      break;
    case TYPES.EProcessElementType.RG:
      drawReactor(elementMesh, el as TYPES.TProcessRG, font);
      break;
    case TYPES.EProcessElementType.ST_HE_1P:
      drawSTHE1P(elementMesh, el as TYPES.TProcessSTHE1P);
      break;
    case TYPES.EProcessElementType.AC:
      drawAC(elementMesh, el as TYPES.TProcessSTHE1P);
      break;
    case TYPES.EProcessElementType.ST_HE_2P:
      drawSTHE2P(elementMesh, el as TYPES.TProcessSTHE2P);
      break;
    case TYPES.EProcessElementType.HEATER:
      drawHeater(elementMesh, el as TYPES.TProcessHeater);
      break;
    case TYPES.EProcessElementType.COOLER:
      drawCooler(elementMesh, el as TYPES.TProcessCooler);
      break;
    case TYPES.EProcessElementType.ABSORPTION_COLUMN:
      drawAbsorptionColumn(elementMesh, el as TYPES.TProcessAbsorptionColumn);
      break;
    case TYPES.EProcessElementType.COLUMN:
      drawSimpleColumn(elementMesh, el as TYPES.TProcessAbsorptionColumn);
      break;
    case TYPES.EProcessElementType.AIRPHIN_COOLER:
      drawAirphinCooler(elementMesh, el as TYPES.TProcessAirphinCooler);
      break;
    case TYPES.EProcessElementType.SKID:
      drawSkid(elementMesh, el as TYPES.TProcessSkid);
      break;
    case TYPES.EProcessElementType.OTHER:
      drawSkid(elementMesh, el as TYPES.TProcessSkid);
      break;
  }
  // const connectionMesh = new THREE.Mesh(new THREE.Geometry());
  // if (el.bridge && el.bridge > 0) {
  //   if (height) {
  //     connectionMesh.translateY(height / 2 + height / 2.32);
  //     elementMesh.translateY(height / 2 + height / 2.32);
  //   } else if (radius) {
  //     elementMesh.translateY(radius / 2 + radius / 2.32);
  //     connectionMesh.translateY(radius / 2 + radius / 2.32);
  //   }
  // }
  elementMesh.updateMatrix();

  (mesh.geometry as THREE.Geometry).merge(
    elementMesh.geometry as THREE.Geometry,
    elementMesh.matrix
  );
  drawElementConnections(mesh, el, selected, selectedPoint, selectedNozzle);
  drawElementSupports(mesh, el, material);
  drawLugElement(mesh, el, material);

  mesh.name = el.name;
  mesh.position.set(el.position.x, el.position.y, el.position.z);
  mesh.rotateX(degToRad(el.rotationX ?? 0));
  mesh.rotateY(degToRad(el.rotation));
  mesh.rotateZ(degToRad(el.rotationZ ?? 0));

  // mesh.geometry.computeBoundingBox();
  const boundingBox = new THREE.Box3();
  boundingBox.setFromObject(mesh);
  const center = new THREE.Vector3();
  boundingBox.getCenter(center); // Gets the center point of the bounding box

  const size = new THREE.Vector3();
  boundingBox.getSize(size); // Gets the size of the bounding box (width, height, depth)

  // Adjust the center vector by the mesh's current position if necessary
  // center.add(mesh.position);

  // Find bottom point
  const bottom = center.clone();
  bottom.y = -size.y / 2;
  mesh.userData = { ...el, center, snappingPoint: bottom, isProcessItem: true };
  mesh.material = material;

  // if (el.name === selected?.name && font) {
  //   // Adjust the bottom vector by the mesh's current position if necessary
  //   // bottom.add(mesh.position);
  //   console.log(
  //     MPCState?.startProcessElement,
  //     MPCState?.startProcessElement?.name
  //   );
  //   if (
  //     !(MPCState?.processPipeElement === TYPES.EConnectionElementType.NOZZLE)
  //   ) {
  //     const axes = createDropZoneAxises(center, font);
  //     mesh.add(axes);
  //   }
  //   const helper = getSimpleAxisHelper(
  //     (MMtoM(el.parameters.height) || el.parameters.length || 1) * 2
  //   );
  //   const snappingAxe = createSnappingPoint(bottom, font);
  //   mesh.add(snappingAxe);
  //   mesh.add(helper);
  // }

  return mesh;
}

const buildBasePlate = (mesh: THREE.Mesh, entityData: CiculrStackBP) => {
  //Base Plate
  const bpOuterCircleShape = new THREE.Shape();

  bpOuterCircleShape.moveTo(entityData.BottomPlateOuterDiameter / 2, 0);
  bpOuterCircleShape.absarc(
    0,
    0,
    entityData.BottomPlateOuterDiameter / 2,
    0,
    Math.PI * 2,
    false
  );

  const BpInnerCircle = new THREE.Path();
  BpInnerCircle.moveTo(entityData.BottomPlateInnerDiameter / 2, 0);
  BpInnerCircle.absarc(
    0,
    0,
    entityData.BottomPlateInnerDiameter / 2,
    0,
    Math.PI * 2,
    true
  );
  bpOuterCircleShape.holes.push(BpInnerCircle);

  /**/
  for (let i = 0; i < entityData.NumberOfBolts; i++) {
    const boltCircleX =
      0 +
      (entityData.BoltCircleDiameter / 2) *
        Math.sin((i * 2 * Math.PI) / entityData.NumberOfBolts);
    const boltCircleY =
      0 +
      (entityData.BoltCircleDiameter / 2) *
        Math.cos((i * 2 * Math.PI) / entityData.NumberOfBolts);
    const holeCircle = new THREE.Path();
    holeCircle.moveTo(
      boltCircleX + entityData.BoltHoleDiameter / 2,
      boltCircleY
    );
    holeCircle.absarc(
      boltCircleX,
      boltCircleY,
      entityData.BoltHoleDiameter / 2,
      0,
      Math.PI * 2.0,
      true
    );
    bpOuterCircleShape.holes.push(holeCircle);
  }

  const BpflangeSettingsnew = {
    amount: entityData.BottomPlateThickness,
    curveSegments: 36,
    bevelEnabled: false,
  };
  const BpflangeGeometry = new THREE.ExtrudeGeometry(
    bpOuterCircleShape,
    BpflangeSettingsnew
  ); // 3D Shape
  // const BpflangeMaterial =  new THREE.MeshPhongMaterial( { color: 0xFFCC00, specular: 0xFFCC00, shininess: 10, flatShading: false } );
  const BpflangeMaterial = new THREE.MeshPhongMaterial({
    color: 0x81b8d6,
    specular: 0x81b8d6,
    shininess: 10,
    flatShading: false,
  });
  const BpflangeMesh = new THREE.Mesh(BpflangeGeometry, BpflangeMaterial);

  BpflangeMesh.rotation.x = Math.PI / 2;
  BpflangeMesh.position.set(0, 0, 0);
  BpflangeMesh.name = "bottomPlateMesh";
  mergeMesh(mesh, BpflangeMesh);
  // baseplateMeshArray.push(BpflangeMesh);
};

const buildTopPlate = (mesh: THREE.Mesh, entityData: CiculrStackBP) => {
  //Top Plate
  if (entityData.topPlateRequired == "CANT_REQUIRED") {
    const TpOuterCircle = new THREE.Shape();

    TpOuterCircle.moveTo(entityData.TopPlateOuterDiameter / 2, 0);
    TpOuterCircle.absarc(
      0,
      0,
      entityData.TopPlateOuterDiameter / 2,
      0,
      Math.PI * 2,
      false
    );

    const TpInnerCircle = new THREE.Path();
    TpInnerCircle.moveTo(entityData.TopPlateInnerDiameter / 2, 0);
    TpInnerCircle.absarc(
      0,
      0,
      entityData.TopPlateInnerDiameter / 2,
      0,
      Math.PI * 2,
      true
    );
    TpOuterCircle.holes.push(TpInnerCircle);
    /**/
    for (let i = 0; i < entityData.NumberOfBolts; i++) {
      const TpboltCircleX =
        0 +
        (entityData.BoltCircleDiameter / 2) *
          Math.sin((i * 2 * Math.PI) / entityData.NumberOfBolts);
      const TpboltCircleY =
        0 +
        (entityData.BoltCircleDiameter / 2) *
          Math.cos((i * 2 * Math.PI) / entityData.NumberOfBolts);
      const TpholeCircle = new THREE.Path();
      TpholeCircle.moveTo(
        TpboltCircleX + entityData.BoltHoleDiameter / 2,
        TpboltCircleY
      );
      TpholeCircle.absarc(
        TpboltCircleX,
        TpboltCircleY,
        entityData.BoltHoleDiameter / 2,
        0,
        Math.PI * 2.0,
        true
      );
      TpOuterCircle.holes.push(TpholeCircle);
    }

    const TpflangeSettingsnew = {
      amount: entityData.TopPlateThickness,
      curveSegments: 36,
      bevelEnabled: false,
    };
    const TpflangeGeometry = new THREE.ExtrudeGeometry(
      TpOuterCircle,
      TpflangeSettingsnew
    ); // 3D Shape
    // const TpflangeMaterial =  new THREE.MeshPhongMaterial( { color: 0xFFCC00, specular: 0xFFCC00, shininess: 10, flatShading: false } );
    const TpflangeMaterial = new THREE.MeshPhongMaterial({
      color: 0x81b8d6,
      specular: 0x81b8d6,
      shininess: 10,
      flatShading: false,
    });

    const TpflangeMesh = new THREE.Mesh(TpflangeGeometry, TpflangeMaterial);

    TpflangeMesh.rotation.x = Math.PI / 2;
    TpflangeMesh.position.set(
      0,
      entityData.gussetheight + entityData.TopPlateThickness,
      0
    );
    TpflangeMesh.name = "topPlateMesh";
    mergeMesh(mesh, TpflangeMesh);

    // this.baseplateMeshArray.push(TpflangeMesh);
  }
};

const buildGusset = (mesh: THREE.Mesh, entityData: CiculrStackBP) => {
  const centreOffset =
    Math.max(
      entityData.computed.parentUpperDiameter,
      entityData.computed.parentLowerDiameter
    ) / 2;
  let numberofGussets = 0;
  const selValue = entityData.gussetPlate;
  if (selValue == "ONE_GUSSET_PER_BOlT")
    numberofGussets = entityData.NumberOfBolts;
  else if (selValue == "TWO_GUSSET_PER_BOlT")
    numberofGussets = 2 * entityData.NumberOfBolts;
  else numberofGussets = 0;

  const gussetPts = [];
  gussetPts.push(new THREE.Vector3(0, 0, 0));
  gussetPts.push(new THREE.Vector3(entityData.gussetwidth, 0, 0));
  gussetPts.push(
    new THREE.Vector3(
      entityData.gussetwidth,
      entityData.gussetheight - entityData.verticalChamferDistance,
      0
    )
  );
  gussetPts.push(
    new THREE.Vector3(
      entityData.gussetwidth - entityData.horizontalChamferDistance,
      entityData.gussetheight,
      0
    )
  );
  gussetPts.push(new THREE.Vector3(0, entityData.gussetheight, 0));
  gussetPts.push(new THREE.Vector3(0, 0, 0));

  const gussetShape = new THREE.Shape(
    gussetPts.map((gusset) => new THREE.Vector2(gusset.x, gusset.y))
  ); // 2D Shape
  const gussetSettingsnew = {
    amount: entityData.gussetthickness,
    bevelEnabled: false,
  };
  const gussetGeometry = new THREE.ExtrudeGeometry(
    gussetShape,
    gussetSettingsnew
  ); // 3D Shape
  // const gussetMaterial =  new THREE.MeshPhongMaterial( { color: 0xFFCC00, specular: 0xFFCC00, shininess: 10, flatShading: false } );
  const gussetMaterial = new THREE.MeshPhongMaterial({
    color: 0x174d8b,
    specular: 0x174d8b,
    shininess: 10,
    flatShading: false,
  });

  const gussetMesh = new THREE.Mesh(gussetGeometry, gussetMaterial);

  const gussetMeshNew = [];
  for (let i = 0; i < numberofGussets; i++) {
    gussetMeshNew.push(gussetMesh.clone());
  }

  for (let i = 0; i < gussetMeshNew.length; i++) {
    const angle = ((i + 0.5) * 2 * Math.PI) / numberofGussets;
    gussetMeshNew[i].rotateOnAxis(
      new THREE.Vector3(0, 1, 0),
      -Math.PI / 2 + angle
    );
    gussetMeshNew[i].position.set(
      0 +
        centreOffset * Math.sin(angle) +
        (entityData.gussetthickness / 2) * Math.cos(angle),
      0,
      0 +
        centreOffset * Math.cos(angle) -
        (entityData.gussetthickness / 2) * Math.sin(angle)
    );

    gussetMeshNew[i].name = "gussetMesh" + (i + 1);
    mergeMesh(mesh, gussetMeshNew[i]);
    // this.baseplateMeshArray.push(gussetMeshNew[i]);
  }
};

const buildGeometry = function(
  el: TYPES.TProcessElement,
  bridgeWidth: number,
  bridgeHeight: number
) {
  const diameter = bridgeWidth;
  const mesh = new THREE.Mesh(new THREE.Geometry());
  const bp: CiculrStackBP = {
    BottomPlateOuterDiameter: diameter * 1.24,
    BottomPlateInnerDiameter: diameter,
    NumberOfBolts: 24,
    BoltCircleDiameter: diameter * 1.12,
    BoltHoleDiameter: diameter * 0.04,
    BottomPlateThickness: bridgeHeight * 0.1 * 0.2,
    topPlateRequired: "CANT_REQUIRED",
    TopPlateOuterDiameter: diameter * 1.24,
    TopPlateInnerDiameter: diameter,
    TopPlateThickness: bridgeHeight * 0.1 * 0.2,
    gussetheight: bridgeHeight * 0.1,
    computed: {
      parentUpperDiameter: diameter * 1.12,
      parentLowerDiameter: diameter * 0.04,
    },
    gussetPlate: "ONE_GUSSET_PER_BOlT",
    gussetwidth: diameter * 0.02,
    verticalChamferDistance: 0,
    horizontalChamferDistance: 0,
    gussetPts: 1,
    gussetthickness: diameter * 0.02,
  };
  buildBasePlate(mesh, bp);
  buildTopPlate(mesh, bp);
  buildGusset(mesh, bp);
  return mesh;
};
function drawSkirt(el: TYPES.TProcessElement) {
  const { radius, height } = getParameters(el);
  const diameter = MMtoM(el.supportParameters?.diameter ?? 0) ?? radius;
  const thickness = MMtoM(el.supportParameters?.thickness ?? 0);
  const length = MMtoM(el.supportParameters?.length ?? 0) ?? height;
  const upperLength = MMtoM(el.supportParameters?.upperLength ?? 0);
  const mesh = createPipeMesh(diameter / 2, thickness, length + upperLength);
  mesh.position.setY(-height / 2 + upperLength);
  mesh.rotateX(deg90InRad);
  mesh.material = new THREE.MeshPhongMaterial({
    color: "blue", // A blue color for the water
    transparent: true, // Required for opacity to work
    opacity: 0.9, // Adjust for desired transparency
    shininess: 100, // Adjust for the desired shininess
    reflectivity: 1, // Reflectivity of the material surface
  });
  return mesh;
}
function drawElementSupports(
  mesh: THREE.Mesh,
  el: TYPES.TProcessElement,
  material: THREE.Material
) {
  if (!el.supportParameters) return;
  const radius =
    ((el.parameters.diameter ? MMtoM(el.parameters.diameter) : el.scale) /
      2 /
      3) *
    2;
  const height =
    (el.parameters.height
      ? MMtoM(el.parameters.height)
      : el.parameters.length
      ? el.parameters.length
      : el.scale) -
      radius * 2 || 0.001;

  // Assumptions for bridge dimensions
  const bridgeWidth = radius / 3; // Adjust as needed
  const bridgeHeight = MMtoM(el.supportParameters.length ?? 0) || height / 2.3; // Same as cylinder's height or adjust as needed
  function createSupport(
    id: number,
    width: number,
    height: number,
    depth: number,
    type?: TYPES.TProcessBasePlateType
  ) {
    let geometry;
    if (type !== TYPES.TProcessBasePlateType.CIRCULAR)
      geometry = new THREE.BoxGeometry(width, height, depth);
    else {
      // geometry = new THREE.Geometry();
      geometry = new THREE.CylinderGeometry(
        width / 2,
        width / 2,
        height,
        32,
        1
      );
    }
    const bridge = new THREE.Mesh(geometry, material);
    const name = `BRIDGE${id}`;
    bridge.name = name;
    if (type === TYPES.TProcessBasePlateType.RECTANGULAR) {
      const basePlateMesh = drawRawRectangularBasePlate(
        name,
        new Vector3(0, -bridgeHeight / 2, 0),
        bridgeWidth * 1.2,
        0,
        0,

        bridgeWidth * 1.4,
        0.025,
        bridgeWidth * 1.4,

        0.2,
        0.02,
        2,
        2
      );
      bridge.add(basePlateMesh);
    }
    if (type === TYPES.TProcessBasePlateType.CIRCULAR) {
      const bp = buildGeometry(el, bridgeWidth, bridgeHeight);

      bp.position.setY(-bridgeHeight / 2);

      mergeMesh(bridge, bp);
    }
    return bridge;
  }
  if (el.supportParameters.type === TYPES.TProcessSupportType.SKIRTS) {
    const skirtMesh = drawSkirt(el);
    mesh.add(skirtMesh);
  } else if (el.supportParameters.type === TYPES.TProcessSupportType.LEG) {
    // Calculate positions for the bridges around the cylinder
    const distanceFromCenter = radius + bridgeWidth / 2; // Positioning bridges outside the cylinder

    if (el.supportParameters.number) {
      const y =
        -height / 2 -
        ((el.type !== TYPES.EProcessElementType.BC) * bridgeHeight) / 2;

      const angleStep = (Math.PI * 2) / el.supportParameters.number; // 90 degrees step for 4 bridges
      for (let i = 0; i < el.supportParameters.number; i++) {
        const bridge = createSupport(
          i,
          bridgeWidth,
          bridgeHeight,
          bridgeWidth,
          el.supportParameters.basePlate
        );

        if (el.parameters.height) {
          const angle = angleStep * i;
          bridge.position.x = Math.cos(angle) * distanceFromCenter;
          bridge.position.z = Math.sin(angle) * distanceFromCenter;
          // Keep bridge at the same vertical position as the cylinder
          bridge.position.y = y;
        } else if (el.parameters.length) {
          const length = el.parameters.length;
          bridge.position.x =
            -length / 2 +
            length / el.supportParameters.number / 2 +
            i * (length / el.supportParameters.number);
          bridge.position.y = y;
        }
        // Update matrix of the bridge for correct geometry merging
        mesh.add(bridge);
        // mesh.translateY(height / 2);
      }
    }
  }
  // Function to create a bridge
}

function createText(
  parent: THREE.Object3D,
  font: THREE.Font | undefined,
  text: string,
  pos: THREE.Vector3,
  rX?: number,
  rY?: number,
  options?: any,
  material: THREE.Material = lineMeshMaterial
) {
  if (font) {
    const textParameters = {
      font,
      size: options?.size ?? 0.03,
      height: options?.height ?? 0.003,
      curveSegments: 1,
    };
    const geometry = new THREE.TextGeometry(text, textParameters);
    geometry.center();
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.copy(pos);
    rX && mesh.rotateX(rX);
    rY && mesh.rotateY(rY);
    parent.add(mesh);
  } else {
    const json = localStorage.getItem(fontUrl);
    if (json) {
      const font = new Font(JSON.parse(json));

      const textParameters = {
        font,
        size: options?.size ?? 0.03,
        height: options?.height ?? 0.003,
        curveSegments: 1,
      };
      const geometry = new THREE.TextGeometry(text, textParameters);
      geometry.center();
      const mesh = new THREE.Mesh(geometry, material);
      mesh.position.copy(pos);
      rX && mesh.rotateX(rX);
      rY && mesh.rotateY(rY);
      parent.add(mesh);
    }
  }
}

function createBoldLine(
  start: THREE.Vector3,
  end: THREE.Vector3,
  lineType?: TYPES.TProcessPipeType | TYPES.TInstrumentationLineType,
  font?: THREE.Font,
  size = 0.005,
  material: THREE.MeshLambertMaterial = lineMeshMaterial
) {
  const length = start.distanceTo(end);
  if (!length) return;
  const l_2 = length / 2;
  const coef = 0.2;
  const und = undefined;
  if (lineType === "Pneumatic (Air) Line") {
    const line = new THREE.Mesh(
      new THREE.CylinderGeometry(size, size, length),
      material
    );
    line.position.copy(
      start
        .clone()
        .add(end)
        .divideScalar(2)
    );
    line.lookAt(end);
    line.rotateX(deg90InRad);
    let offset = 0;
    const f = new THREE.Vector3(0, 0, -size * 3);
    const s = new THREE.Vector3(0, 0, size * 3);
    while (offset < l_2) {
      if (offset) {
        const py = offset;
        const my = -offset;
        const a = createBoldLine(
          f.clone().setY(py),
          s.clone().setY(py - 0.01),
          und,
          und,
          0.003,
          material
        );
        const b = createBoldLine(
          f.clone().setY(py + 0.01),
          s.clone().setY(py),
          und,
          und,
          0.003,
          material
        );
        const c = createBoldLine(
          f.clone().setY(my),
          s.clone().setY(my - 0.01),
          und,
          und,
          0.003,
          material
        );
        const d = createBoldLine(
          f.clone().setY(my + 0.01),
          s.clone().setY(my),
          und,
          und,
          0.003,
          material
        );
        a && line.add(a);
        b && line.add(b);
        c && line.add(c);
        d && line.add(d);
      } else {
        const a = createBoldLine(
          f.clone(),
          s.clone().setY(-0.01),
          und,
          und,
          0.003,
          material
        );
        const b = createBoldLine(
          f.clone().setY(0.01),
          s.clone(),
          und,
          und,
          0.003,
          material
        );
        a && line.add(a);
        b && line.add(b);
      }
      offset += coef;
    }
    return line;
  } else if (lineType === "Inert gas line") {
    const line = new THREE.Mesh(
      new THREE.CylinderGeometry(size, size, length),
      material
    );
    line.position.copy(
      start
        .clone()
        .add(end)
        .divideScalar(2)
    );
    line.lookAt(end);
    line.rotateX(deg90InRad);
    let offset = 0;
    const f = new THREE.Vector3(0, 0, -size * 3);
    const s = new THREE.Vector3(0, 0, size * 3);
    const so = 0.005;
    while (offset < l_2) {
      const py = offset;
      const my = -offset;
      const a = createBoldLine(
        f.clone().setY(py + so),
        s.clone().setY(py - so),
        und,
        und,
        0.003,
        material
      );
      const b = createBoldLine(
        f.clone().setY(my + so),
        s.clone().setY(my - so),
        und,
        und,
        0.003,
        material
      );
      a && line.add(a);
      b && line.add(b);
      offset += coef;
    }
    return line;
  } else if (lineType === "Instrument capillary") {
    const line = new THREE.Mesh(
      new THREE.CylinderGeometry(size, size, length),
      material
    );
    line.position.copy(
      start
        .clone()
        .add(end)
        .divideScalar(2)
    );
    line.lookAt(end);
    line.rotateX(deg90InRad);
    const l_2 = length / 2;
    const coef = 0.2;
    let offset = 0;
    const f = new THREE.Vector3(0, 0, -size * 3);
    const s = new THREE.Vector3(0, 0, size * 3);
    while (offset < l_2) {
      if (offset) {
        const py = offset;
        const my = -offset;
        const a = createBoldLine(
          f.clone().setY(py + 0.01),
          s.clone().setY(py - 0.01),
          und,
          und,
          0.003,
          material
        );
        const b = createBoldLine(
          f.clone().setY(py - 0.01),
          s.clone().setY(py + 0.01),
          und,
          und,
          0.003,
          material
        );
        const c = createBoldLine(
          f.clone().setY(my + 0.01),
          s.clone().setY(my - 0.01),
          und,
          und,
          0.003,
          material
        );
        const d = createBoldLine(
          f.clone().setY(my - 0.01),
          s.clone().setY(my + 0.01),
          und,
          und,
          0.003,
          material
        );
        a && line.add(a);
        b && line.add(b);
        c && line.add(c);
        d && line.add(d);
      } else {
        const a = createBoldLine(
          f.clone().setY(0.01),
          s.clone().setY(-0.01),
          und,
          und,
          0.003,
          material
        );
        const b = createBoldLine(
          f.clone().setY(-0.01),
          s.clone().setY(0.01),
          und,
          und,
          0.003,
          material
        );
        a && line.add(a);
        b && line.add(b);
      }
      offset += coef;
    }
    return line;
  } else if (lineType === "Electrical wires") {
    const line = new THREE.Mesh(
      new THREE.CylinderGeometry(size, size, length),
      material
    );
    line.position.copy(
      start
        .clone()
        .add(end)
        .divideScalar(2)
    );
    line.lookAt(end);
    line.rotateX(deg90InRad);
    let offset = 0;
    const geometry = new THREE.SphereGeometry(size * 3, 8, 8);
    while (offset < l_2) {
      if (offset) {
        const a = new THREE.Mesh(geometry.clone(), material);
        a.position.setY(offset);
        const b = a.clone();
        b.position.setY(-offset);
        line.add(a, b);
      } else {
        line.add(new THREE.Mesh(geometry.clone(), material));
      }
      offset += coef;
    }
    return line;
  } else if (lineType === "Hydraulic Line") {
    const line = new THREE.Group();
    let offset = 0;
    const long = 0.2;
    const short = 0.05;
    let isShort = false;
    const sStart = new THREE.Vector3();
    const sEnd = end.clone().sub(start);
    while (offset < length) {
      if (isShort) offset += short;
      if (offset >= length) break;
      const s = getPosByDistance(offset, sStart, sEnd);
      offset += isShort ? short : long;
      if (offset >= length) offset = length;
      const e = getPosByDistance(offset, sStart, sEnd);
      if (isShort) offset += short;
      const a = createBoldLine(s, e, undefined, undefined, undefined, material);
      a && line.add(a);
      isShort = !isShort;
    }
    line.position.copy(start);
    return line;
  } else if (lineType === "Instrument signal") {
    const line = new THREE.Group();
    let offset = 0;
    const l = 0.1;
    const sStart = new THREE.Vector3();
    const sEnd = end.clone().sub(start);
    while (offset < length) {
      offset += l;
      if (offset >= length) break;
      const s = getPosByDistance(offset, sStart, sEnd);
      offset += l;
      if (offset >= length) offset = length;
      const e = getPosByDistance(offset, sStart, sEnd);
      const a = createBoldLine(s, e, undefined, undefined, undefined, material);
      a && line.add(a);
    }
    line.position.copy(start);
    return line;
  } else {
    const line = new THREE.Mesh(
      new THREE.CylinderGeometry(size * 5, size * 5, length),
      new THREE.MeshLambertMaterial({
        opacity: 0,
        transparent: true,
        visible: false,
      })
    );
    const mainLine = new THREE.Mesh(
      new THREE.CylinderGeometry(size, size, length),
      material
    );
    line.position.copy(
      start
        .clone()
        .add(end)
        .divideScalar(2)
    );
    line.lookAt(end);
    line.rotateX(deg90InRad);
    line.add(mainLine);
    if (
      lineType === "Electric heat tracing" ||
      lineType === "Steam heat tracing"
    ) {
      const sline = new THREE.Group();
      let offset = 0;
      const l = 0.1;
      const txt = lineType[0];
      let isTxt = false;
      while (offset < length) {
        offset += l;
        if (offset >= length) break;
        const s = new THREE.Vector3(0, offset, 0.05);
        offset += l;
        if (offset >= length) offset = length;
        const e = new THREE.Vector3(0, offset, 0.05);
        if (isTxt) {
          const mid = s
            .clone()
            .add(e)
            .divideScalar(2);
          createText(sline, font, txt, mid, -deg90InRad, -deg90InRad);
        } else {
          const a = createBoldLine(
            s,
            e,
            undefined,
            undefined,
            undefined,
            material
          );
          a && sline.add(a);
        }
        isTxt = !isTxt;
      }
      sline.position.setY(-length / 2);
      line.add(sline);
    }
    return line;
  }
}

function createPipeMesh(
  radius: number,
  thickness: number,
  depth: number,
  material?: THREE.MeshLambertMaterial
) {
  const arcShape = new THREE.Shape();
  arcShape.absarc(0, 0, radius, 0, deg360InRad, false);
  if (thickness && checkRange(thickness, 0, radius)) {
    const holePath = new THREE.Path();
    holePath.absarc(0, 0, radius - thickness, 0, deg360InRad, true);
    arcShape.holes.push(holePath);
  }
  const mesh = new THREE.Mesh(
    new THREE.ExtrudeGeometry(arcShape, {
      steps: 1,
      bevelEnabled: false,
      curveSegments: 32,
      depth,
    }),
    material
  );
  return mesh;
}

function createElbow(
  radius: number,
  length: number,
  material?: THREE.MeshLambertMaterial
) {
  const start = new THREE.Vector3(0, 0, -length);
  const end = roundVectorM(
    start.clone().applyAxisAngle(new THREE.Vector3(0, 1), deg90InRad)
  );
  const curve = new THREE.QuadraticBezierCurve3(
    start,
    new THREE.Vector3(),
    end
  );
  const mesh = new THREE.Mesh(
    new THREE.TubeGeometry(curve, 32, radius, 32),
    material
  );
  return mesh;
}

function drawConnectPoint(
  el: TYPES.TProcessElement,
  props: TYPES.TProcessElementPoint
) {
  const { id, generalPosition } = props;
  const mesh = new THREE.Mesh(
    new THREE.SphereGeometry(0.05, 8, 8),
    selectionMeshMaterial
  );
  mesh.position.copy(generalPosition);
  mesh.userData = { id, parent: el.name, isConnectPoint: true };
  return mesh;
}

function drawSelectedPoint(position: THREE.Vector3) {
  const mesh = new THREE.Mesh(
    new THREE.SphereGeometry(0.05, 8, 8),
    selectedMeshMaterial
  );
  mesh.position.copy(position);
  return mesh;
}

function drawPoint(
  el: TYPES.TProcessElement,
  id: number,
  position: THREE.Vector3
) {
  const mesh = new THREE.Mesh(
    new THREE.SphereGeometry(0.05, 8, 8),
    lineMeshMaterial
  );
  mesh.position.copy(position);
  mesh.userData = { id, parent: el.name, isConnectPoint: false };
  return mesh;
}

function drawSource(mesh: THREE.Mesh, el: TYPES.TProcessSource) {
  const l = el.scale;
  const l_3 = l / 3;
  const l_2 = l / 2;
  const l_1 = l / 10;
  const l_6 = l_3 / 2;

  const meshA = new THREE.Mesh(
    new THREE.CylinderGeometry(l_1, l_1, l_3, 32, 1)
  );
  meshA.position.setX(-l_2 + l_6);
  meshA.rotateZ(-deg90InRad);
  meshA.updateMatrix();

  (mesh.geometry as THREE.Geometry).merge(
    meshA.geometry as THREE.Geometry,
    meshA.matrix
  );

  const meshB = new THREE.Mesh(new THREE.ConeGeometry(l_1 * 2, l_3, 32, 1));
  meshB.rotateZ(-deg90InRad);
  meshB.updateMatrix();

  (mesh.geometry as THREE.Geometry).merge(
    meshB.geometry as THREE.Geometry,
    meshB.matrix
  );
}

function drawSink(mesh: THREE.Mesh, el: TYPES.TProcessSink) {
  const l = el.scale;
  const l_3 = l / 3;
  const l_2 = l / 2;
  const l_1 = l / 10;
  const l_6 = l_3 / 2;

  const meshA = new THREE.Mesh(
    new THREE.CylinderGeometry(l_1, l_1, l_3, 32, 1)
  );
  meshA.rotateZ(-deg90InRad);
  meshA.updateMatrix();

  (mesh.geometry as THREE.Geometry).merge(
    meshA.geometry as THREE.Geometry,
    meshA.matrix
  );

  const meshB = new THREE.Mesh(new THREE.ConeGeometry(l_1 * 2, l_3, 32, 1));
  meshB.position.setX(l_2 - l_6);
  meshB.rotateZ(-deg90InRad);
  meshB.updateMatrix();

  (mesh.geometry as THREE.Geometry).merge(
    meshB.geometry as THREE.Geometry,
    meshB.matrix
  );
}

function drawValve(mode: TWorkMode, mesh: THREE.Mesh, el: TYPES.TProcessValve) {
  const l = el.scale;
  const l_2 = l / 2;
  const l_4 = l_2 / 2;
  const l_1 = l / 10;
  const l_1_2 = l_1 / 2;

  if (
    mode === "PROCESS" ||
    mode === "DESIGNER" ||
    mode === "PRODESIGNER" ||
    mode === "PIPDESIGNER" ||
    mode === "STRDESIGNER"
  ) {
    //Trial mode
    const meshA = new THREE.Mesh(new THREE.ConeGeometry(l_1 * 2, l_4, 32, 1));
    const meshB = meshA.clone();

    switch (el.parameters?.type) {
      case "Three-Way Valve":
        {
          const meshAa = meshA.clone();
          meshAa.position.setZ(l_4 / 2);
          meshAa.rotateX(-deg90InRad);
          meshAa.updateMatrix();
          (mesh.geometry as THREE.Geometry).merge(
            meshAa.geometry as THREE.Geometry,
            meshAa.matrix
          );
        }
        break;
      case "Four-Way Valve":
        {
          const meshAa = meshA.clone();
          meshAa.position.setZ(l_4 / 2);
          meshAa.rotateX(-deg90InRad);
          meshAa.updateMatrix();
          (mesh.geometry as THREE.Geometry).merge(
            meshAa.geometry as THREE.Geometry,
            meshAa.matrix
          );
          const meshAb = meshA.clone();
          meshAb.position.setZ(-l_4 / 2);
          meshAb.rotateX(deg90InRad);
          meshAb.updateMatrix();
          (mesh.geometry as THREE.Geometry).merge(
            meshAb.geometry as THREE.Geometry,
            meshAb.matrix
          );
        }
        break;
    }

    switch (el.parameters?.type) {
      case "Left Angle Valve":
        meshB.position.setZ(-l_4 / 2);
        meshB.rotateX(deg90InRad);
        break;
      case "Right Angle Valve":
        meshB.position.setZ(l_4 / 2);
        meshB.rotateX(-deg90InRad);
        break;
      case "Up Angle Valve":
        meshB.position.setY(l_4 / 2);
        meshB.rotateZ(deg180InRad);
        break;
      case "Down Angle Valve":
        meshB.position.setY(-l_4 / 2);
        break;
      default:
        meshB.position.setX(l_4 / 2);
        meshB.rotateZ(deg90InRad);
        break;
    }

    meshA.position.setX(-l_4 / 2);
    meshA.rotateZ(-deg90InRad);

    const meshC = new THREE.Mesh(
      new THREE.CylinderGeometry(l_1, l_1, l_4, 32, 1)
    );
    meshC.position.setY(l_4 / 2);

    const meshD = new THREE.Mesh(
      new THREE.CylinderGeometry(l_1 * 2, l_1 * 2, l_1_2, 32, 1)
    );
    meshD.position.setY(l_4 - l_1_2 / 2);

    meshA.updateMatrix();
    meshB.updateMatrix();
    meshC.updateMatrix();
    meshD.updateMatrix();

    (mesh.geometry as THREE.Geometry).merge(
      meshA.geometry as THREE.Geometry,
      meshA.matrix
    );
    (mesh.geometry as THREE.Geometry).merge(
      meshB.geometry as THREE.Geometry,
      meshB.matrix
    );
    (mesh.geometry as THREE.Geometry).merge(
      meshC.geometry as THREE.Geometry,
      meshC.matrix
    );
    (mesh.geometry as THREE.Geometry).merge(
      meshD.geometry as THREE.Geometry,
      meshD.matrix
    );
  }
}

function drawMix(mesh: THREE.Mesh, el: TYPES.TProcessMix) {
  const l = el.scale;
  const l_3 = l / 3;

  const meshA = new THREE.Mesh(new THREE.ConeGeometry(l_3, l_3, 32, 1));
  meshA.rotateZ(-deg90InRad);

  meshA.updateMatrix();

  (mesh.geometry as THREE.Geometry).merge(
    meshA.geometry as THREE.Geometry,
    meshA.matrix
  );
}

function drawSplit(mesh: THREE.Mesh, el: TYPES.TProcessSplit) {
  const l = el.scale;
  const l_3 = l / 3;

  const meshA = new THREE.Mesh(new THREE.ConeGeometry(l_3, l_3, 32, 1));
  meshA.rotateZ(deg90InRad);

  meshA.updateMatrix();

  (mesh.geometry as THREE.Geometry).merge(
    meshA.geometry as THREE.Geometry,
    meshA.matrix
  );
}

function drawTank(mesh: THREE.Mesh, el: TYPES.TProcessTank) {
  const radius =
    (el.parameters.diameter ? MMtoM(el.parameters.diameter) : el.scale) / 2;
  const height =
    (el.parameters.height ? MMtoM(el.parameters.height) : el.scale) - radius;

  const meshA = new THREE.Mesh(
    new THREE.CylinderGeometry(radius, radius, height, 32, 1)
  );
  const meshB = new THREE.Mesh(new THREE.SphereGeometry(radius, 32, 32));
  meshB.position.setY(height / 2);

  meshA.updateMatrix();
  meshB.updateMatrix();

  (mesh.geometry as THREE.Geometry).merge(
    meshA.geometry as THREE.Geometry,
    meshA.matrix
  );
  (mesh.geometry as THREE.Geometry).merge(
    meshB.geometry as THREE.Geometry,
    meshB.matrix
  );

  mesh.scale.setScalar(el.scale);
}

function drawPump(mesh: THREE.Mesh, el: TYPES.TProcessPump) {
  const l_1 = el.scale / 10;
  const l_2 = el.scale / 2;
  const l_4 = l_2 / 2;
  const l_8 = l_4 / 2;

  const meshA = new THREE.Mesh(
    new THREE.CylinderGeometry(l_4, l_4, l_4, 32, 1)
  );
  meshA.rotateX(deg90InRad);
  const meshB = createElbow(l_1, l_8);
  meshB.position.setZ(l_4);
  const meshC = createPipeMesh(l_1, l_1 / 10, l_4 + l_8);

  meshC.position.setY(l_4 - l_1);
  meshC.rotateY(deg90InRad);

  meshA.updateMatrix();
  meshB.updateMatrix();
  meshC.updateMatrix();

  (mesh.geometry as THREE.Geometry).merge(
    meshA.geometry as THREE.Geometry,
    meshA.matrix
  );
  (mesh.geometry as THREE.Geometry).merge(
    meshB.geometry as THREE.Geometry,
    meshB.matrix
  );
  (mesh.geometry as THREE.Geometry).merge(
    meshC.geometry as THREE.Geometry,
    meshC.matrix
  );
}

function drawHeader(mesh: THREE.Mesh, el: TYPES.TProcessHeader) {
  const l = el.scale;
  const l_1 = l / 10;
  const l_3 = l / 3;

  const radius = el.parameters.diameter
    ? MMtoM(el.parameters.diameter / 2)
    : l_1 * 2;
  const length = el.parameters.length ?? l_3 * 2;
  const thickness = el.parameters.schedule?.wall_thickness_global
    ? MMtoM(el.parameters.schedule.wall_thickness_global)
    : l_1 / 10;

  const meshA = createPipeMesh(radius, thickness, length);
  meshA.position.setX(-length / 2);
  meshA.lookAt(new THREE.Vector3(length / 2));

  meshA.updateMatrix();

  (mesh.geometry as THREE.Geometry).merge(
    meshA.geometry as THREE.Geometry,
    meshA.matrix
  );

  mesh.scale.setScalar(el.scale);
}

function drawAAM(mesh: THREE.Mesh, el: TYPES.TProcessHeader) {
  const l = el.scale;
  const l_1 = l / 10;
  const l_3 = l / 3;

  const radius = el.parameters.diameter
    ? MMtoM(el.parameters.diameter / 2)
    : l_1 * 2;
  const length = el.parameters.length ?? l_3 * 2;
  const thickness = el.parameters.schedule?.wall_thickness_global
    ? MMtoM(el.parameters.schedule.wall_thickness_global)
    : l_1 / 10;

  const meshA = createPipeMesh(radius, thickness, length);
  meshA.position.setX(-length / 2);
  meshA.lookAt(new THREE.Vector3(length / 2));

  meshA.updateMatrix();

  (mesh.geometry as THREE.Geometry).merge(
    meshA.geometry as THREE.Geometry,
    meshA.matrix
  );

  mesh.scale.setScalar(el.scale);
}

function drawFireHose(mesh: THREE.Mesh, el: TYPES.TProcessHeader) {
  // // Load a glTF resource
  // new GLTFLoader().load(
  //   // resource URL
  //   "gltf/fire-hose.glb",
  //   // called when the resource is loaded
  //   function(gltf) {
  //     mesh.add(gltf.scene);
  //     gltf.animations; // Array<THREE.AnimationClip>
  //     gltf.scene; // THREE.Group
  //     gltf.scenes; // Array<THREE.Group>
  //     gltf.cameras; // Array<THREE.Camera>
  //     gltf.asset; // Object
  //   },
  //   // called while loading is progressing
  //   function(xhr) {
  //     console.log(xhr, (xhr.loaded / xhr.total) * 100 + "% loaded");
  //   },
  //   // called when loading has errors
  //   function(error) {
  //     console.log("An error happened", error);
  //   }
  // );
  const turns = 10; // Number of turns
  const redMaterial = new THREE.MeshPhongMaterial({
    color: getRGB(red),
    side: THREE.DoubleSide,
  });
  class CustomHelixCurve extends THREE.Curve<THREE.Vector3> {
    constructor(
      private radius: number,
      private height: number,
      private turns: number
    ) {
      super();
    }

    getPoint(t: number): THREE.Vector3 {
      const angle = 2 * Math.PI * t * this.turns; // Full circle times the number of turns
      const x = this.radius * Math.cos(angle);
      const z = this.radius * Math.sin(angle);
      const y = t * this.height; // Map t to 1/3 of the total height
      return new THREE.Vector3(x, y, z);
    }
  }

  const { width, realHeight, radius } = getParameters(el);
  const height = realHeight;
  // Creating the spring geometry
  const path = new CustomHelixCurve(radius, height, turns);
  const geometry = new THREE.TubeGeometry(
    path,
    400,
    height / turns / 2,
    100,
    false
  );
  const spring = new THREE.Mesh(geometry, redMaterial);
  spring.rotateX(deg90InRad);

  const frontCylinder = new THREE.Mesh(
    new THREE.CylinderGeometry(
      radius * 1.1,
      radius * 1.1,
      height / turns / 2,
      200,
      32
    )
  );
  const backCylinder = frontCylinder.clone();
  backCylinder.translateZ(height + height / turns / 2);
  backCylinder.rotateX(deg90InRad);
  frontCylinder.translateZ(-height / turns / 2);
  frontCylinder.rotateX(deg90InRad);

  mergeMesh(mesh, frontCylinder);
  mergeMesh(mesh, backCylinder);

  const edge1 = new THREE.Mesh(
    new THREE.CylinderGeometry(
      height / turns / 2,
      height / turns / 2,
      height,
      32,
      32
    )
  );
  const edgeEnd1 = new THREE.Mesh(
    new THREE.CylinderGeometry(
      (height / turns) * 0.8,
      (height / turns) * 0.8,
      height / 7,
      32
    )
  );
  edgeEnd1.translateY(height / 2);
  mergeMesh(edge1, edgeEnd1);

  const edge2 = edge1.clone();
  edge2.translateY(-height / 2);
  edge2.translateX(-radius);
  edge2.translateZ(height);
  edge2.rotateZ(deg180InRad);

  edge1.translateY(height / 2);
  edge1.translateX(radius);
  // edge1.translateZ()

  mergeMesh(mesh, edge1);
  mergeMesh(mesh, edge2);

  mergeMesh(mesh, spring);
}
function drawAIC(mesh: THREE.Mesh, el: TYPES.TProcessHeader) {
  const { realHeight: height, width } = getParameters(el);

  const length = width / 3;

  const boxMesh = new THREE.Mesh(
    new THREE.BoxGeometry(width, height, length, 1, 1, 1)
  );

  const topCylinder = new THREE.Mesh(
    new THREE.CylinderGeometry(width / 2, width / 2, length, 32)
  );

  topCylinder.translateY(height / 2);
  topCylinder.rotateX(deg90InRad);

  const height1 = length * 1.5;

  const height2 = length * 2.5;

  const offset = width / 10;
  const radius = (width / 2 - offset * 2) / 2;

  const cylinder1 = new THREE.Mesh(
    new THREE.CylinderGeometry(radius, radius, height1, 32)
  );
  const cylinder2 = cylinder1.clone();
  const cylinder3 = new THREE.Mesh(
    new THREE.CylinderGeometry(radius, radius, height2, 32)
  );

  const c1 = new Vector3(
    -width / 2 + radius + offset,
    -height / 2 + offset + radius,
    -length
  );
  const c2 = new Vector3(0, height / 2 + width / 2 - radius - offset, -length);
  const c3 = new Vector3(
    width / 2 - radius - offset,
    -height / 2 + offset + radius,
    -length
  );

  cylinder3.position.copy(c1.clone());
  cylinder1.position.copy(c3.clone());
  cylinder2.position.copy(c2.clone());
  cylinder1.rotateX(deg90InRad);
  cylinder2.rotateX(deg90InRad);
  cylinder3.rotateX(deg90InRad);

  const points = [
    c1,
    c1.clone().setZ(c1.z - height2 / 2 - length / 5),
    c2.clone().setZ(c1.z - height2 / 2 - length / 5),
    c2,
  ];

  // Create a CatmullRomCurve3, which interpolates between the given points
  const curve = new THREE.CatmullRomCurve3(points);
  const tube = new THREE.Mesh(
    new THREE.TubeGeometry(curve, 32, radius / 3, 32, false)
  );

  mergeMesh(mesh, boxMesh);
  mergeMesh(mesh, topCylinder);
  mergeMesh(mesh, cylinder1);
  mergeMesh(mesh, cylinder2);
  mergeMesh(mesh, cylinder3);
  mergeMesh(mesh, tube);

  mesh.scale.setScalar(el.scale);
}
function drawTAM(mesh: THREE.Mesh, el: TYPES.TProcessHeader) {
  const l = el.scale;
  const l_1 = l / 10;
  const l_3 = l / 3;

  const radius = el.parameters.diameter
    ? MMtoM(el.parameters.diameter / 2)
    : l_1 * 2;
  const length = el.parameters.length ?? l_3 * 2;
  const thickness = el.parameters.schedule?.wall_thickness_global
    ? MMtoM(el.parameters.schedule.wall_thickness_global)
    : l_1 / 10;

  const meshA = createPipeMesh(radius, thickness, length);
  meshA.position.setX(-length / 2);
  meshA.lookAt(new THREE.Vector3(length / 2));

  // // Create the small pipe and position it
  // const smallPipeRadius = radius / 8; // Adjust the size according to your needs
  // const smallPipeLength = radius / 2; // Adjust the length according to your needs
  // const meshSmallPipe = createPipeMesh(
  //   smallPipeRadius,
  //   thickness,
  //   smallPipeLength
  // );
  // const attachmentPoint = new THREE.Vector3(
  //   -length / 3, // X position - middle of the main pipe
  //   radius + smallPipeLength, // Y position - just outside the main pipe's surface
  //   0 // Z position - middle of the main pipe
  // );
  // meshSmallPipe.position.copy(attachmentPoint); // Adjust the position according to your needs
  // meshSmallPipe.rotation.x = Math.PI / 2; // Rotate to make it vertical
  // meshSmallPipe.updateMatrix(); // Update the matrix

  // // Create the small pipe and position it
  // const smallPipeRadius1 = radius / 12; // Adjust the size according to your needs
  // const smallPipeLength1 = radius / 3; // Adjust the length according to your needs
  // const meshSmallPipe1 = createPipeMesh(
  //   smallPipeRadius1,
  //   thickness,
  //   smallPipeLength1
  // );
  // const attachmentPoint1 = new THREE.Vector3(
  //   -length / 3, // X position - middle of the main pipe
  //   radius + smallPipeLength1, // Y position - just outside the main pipe's surface
  //   0 // Z position - middle of the main pipe
  // );
  // meshSmallPipe1.position.copy(attachmentPoint1); // Adjust the position according to your needs
  // meshSmallPipe1.rotation.x = Math.PI / 2; // Rotate to make it vertical
  // meshSmallPipe1.updateMatrix(); // Update the matrix

  meshA.updateMatrix();

  (mesh.geometry as THREE.Geometry).merge(
    meshA.geometry as THREE.Geometry,
    meshA.matrix
  );

  // (mesh.geometry as THREE.Geometry).merge(
  //   meshSmallPipe.geometry as THREE.Geometry,
  //   meshSmallPipe.matrix
  // );

  // (mesh.geometry as THREE.Geometry).merge(
  //   meshSmallPipe1.geometry as THREE.Geometry,
  //   meshSmallPipe1.matrix
  // );

  mesh.scale.setScalar(el.scale);
}
function drawDrum(mesh: THREE.Mesh, el: TYPES.TProcessDrum) {
  const radius =
    (el.parameters.diameter ? MMtoM(el.parameters.diameter) : el.scale) / 2;
  const height =
    (el.parameters.height ? MMtoM(el.parameters.height) : el.scale) -
    radius * 2 +
    0.001;

  const meshA = new THREE.Mesh(
    new THREE.CylinderGeometry(radius, radius, height, 32, 1)
  );
  const meshB = new THREE.Mesh(new THREE.SphereGeometry(radius, 32, 32));
  meshB.position.setY(-height / 2);
  const meshC = new THREE.Mesh(new THREE.SphereGeometry(radius, 32, 32));
  meshC.position.setY(height / 2);

  meshA.updateMatrix();
  meshB.updateMatrix();
  meshC.updateMatrix();

  (mesh.geometry as THREE.Geometry).merge(
    meshA.geometry as THREE.Geometry,
    meshA.matrix
  );
  (mesh.geometry as THREE.Geometry).merge(
    meshB.geometry as THREE.Geometry,
    meshB.matrix
  );
  (mesh.geometry as THREE.Geometry).merge(
    meshC.geometry as THREE.Geometry,
    meshC.matrix
  );

  mesh.scale.setScalar(el.scale);
}

function drawAirphinCooler(mesh: THREE.Mesh, el: TYPES.TProcessAirphinCooler) {
  const mesh0 = new THREE.Mesh(
    new THREE.BoxGeometry(
      el.parameters.width,
      el.parameters.height,
      el.parameters.length
    )
  );
  mesh0.updateMatrix();
  (mesh.geometry as THREE.Geometry).merge(
    mesh0.geometry as THREE.Geometry,
    mesh0.matrix
  );

  const legs = el.parameters.legs;
  const l1 = legs[0];
  const l2 = legs[1];
  const l3 = legs[2];
  const l4 = legs[3];
  const w_2 = el.parameters.width / 2;
  const h_2 = el.parameters.height / 2;
  const l_2 = el.parameters.length / 2;
  if (l1) {
    const mesh1 = new THREE.Mesh(
      new THREE.BoxGeometry(l1.width, l1.height, l1.length)
    );
    mesh1.position.set(
      w_2 - l1.width / 2,
      -(l1.height / 2 + h_2),
      l_2 - l1.length / 2
    );
    mesh1.updateMatrix();
    (mesh.geometry as THREE.Geometry).merge(
      mesh1.geometry as THREE.Geometry,
      mesh1.matrix
    );
  }
  if (l2) {
    const mesh2 = new THREE.Mesh(
      new THREE.BoxGeometry(l2.width, l2.height, l2.length)
    );
    mesh2.position.set(
      -(w_2 - l2.width / 2),
      -(l2.height / 2 + h_2),
      l_2 - l2.length / 2
    );
    mesh2.updateMatrix();
    (mesh.geometry as THREE.Geometry).merge(
      mesh2.geometry as THREE.Geometry,
      mesh2.matrix
    );
  }
  if (l3) {
    const mesh3 = new THREE.Mesh(
      new THREE.BoxGeometry(l3.width, l3.height, l3.length)
    );
    mesh3.position.set(
      -(w_2 - l3.width / 2),
      -(l3.height / 2 + h_2),
      -(l_2 - l3.length / 2)
    );
    mesh3.updateMatrix();
    (mesh.geometry as THREE.Geometry).merge(
      mesh3.geometry as THREE.Geometry,
      mesh3.matrix
    );
  }
  if (l4) {
    const mesh4 = new THREE.Mesh(
      new THREE.BoxGeometry(l4.width, l4.height, l4.length)
    );
    mesh4.position.set(
      w_2 - l4.width / 2,
      -(l4.height / 2 + h_2),
      -(l_2 - l4.length / 2)
    );
    mesh4.updateMatrix();
    (mesh.geometry as THREE.Geometry).merge(
      mesh4.geometry as THREE.Geometry,
      mesh4.matrix
    );
  }

  // el.parameters.legs.forEach((l) => {
  //   const mesh = new THREE.Mesh(new THREE.BoxGeometry(l.width, l.height, l.length));
  //   mesh.updateMatrix();
  //   (mesh.geometry as THREE.Geometry).merge(mesh.geometry as THREE.Geometry, mesh.matrix);
  // });
}

function drawSkid(mesh: THREE.Mesh, el: TYPES.TProcessSkid) {
  const mesh0 = new THREE.Mesh(
    new THREE.BoxGeometry(
      el.parameters.width,
      el.parameters.height,
      el.parameters.length
    )
  );
  mesh0.updateMatrix();
  (mesh.geometry as THREE.Geometry).merge(
    mesh0.geometry as THREE.Geometry,
    mesh0.matrix
  );
}

function drawSeparator(mesh: THREE.Mesh, el: TYPES.TProcessSeparator) {
  const radius =
    (el.parameters.diameter ? MMtoM(el.parameters.diameter) : el.scale / 2) / 2;
  const length = (el.parameters.length ?? el.scale) - radius * 2 || 0.001;

  const meshA = new THREE.Mesh(
    new THREE.CylinderGeometry(radius, radius, length, 32, 1)
  );
  meshA.rotateZ(deg90InRad);
  const meshB = new THREE.Mesh(new THREE.SphereGeometry(radius, 32, 32));
  meshB.position.setX(-length / 2);
  const meshC = new THREE.Mesh(new THREE.SphereGeometry(radius, 32, 32));
  meshC.position.setX(length / 2);

  meshA.updateMatrix();
  meshB.updateMatrix();
  meshC.updateMatrix();

  (mesh.geometry as THREE.Geometry).merge(
    meshA.geometry as THREE.Geometry,
    meshA.matrix
  );
  (mesh.geometry as THREE.Geometry).merge(
    meshB.geometry as THREE.Geometry,
    meshB.matrix
  );
  (mesh.geometry as THREE.Geometry).merge(
    meshC.geometry as THREE.Geometry,
    meshC.matrix
  );

  mesh.scale.setScalar(el.scale);
}

function drawHorizontalDrum(
  mesh: THREE.Mesh,
  el: TYPES.TProcessHorizontalDrum
) {
  const radius = el.parameters.diameter
    ? MMtoM(el.parameters.diameter) / 2
    : el.scale / 4;
  const length = (el.parameters.length ?? el.scale) - radius * 2 || 0.001;

  const meshA = new THREE.Mesh(
    new THREE.CylinderGeometry(radius, radius, length, 32, 1)
  );
  meshA.rotateZ(deg90InRad);
  const meshB = new THREE.Mesh(new THREE.SphereGeometry(radius, 32, 32));
  meshB.position.setX(-length / 2);
  const meshC = new THREE.Mesh(new THREE.SphereGeometry(radius, 32, 32));
  meshC.position.setX(length / 2);

  meshA.updateMatrix();
  meshB.updateMatrix();
  meshC.updateMatrix();

  (mesh.geometry as THREE.Geometry).merge(
    meshA.geometry as THREE.Geometry,
    meshA.matrix
  );
  (mesh.geometry as THREE.Geometry).merge(
    meshB.geometry as THREE.Geometry,
    meshB.matrix
  );
  (mesh.geometry as THREE.Geometry).merge(
    meshC.geometry as THREE.Geometry,
    meshC.matrix
  );

  mesh.scale.setScalar(el.scale);
}

function drawColumn(mesh: THREE.Mesh, el: TYPES.TProcessColumn) {
  const radius = el.parameters.diameter
    ? MMtoM(el.parameters.diameter) / 2
    : el.scale / 4;
  const height =
    (el.parameters.height ? MMtoM(el.parameters.height) : el.scale) -
      radius * 2 || 0.001;

  const l_4 = height / 2;
  const l_5 = height / 2.5;
  const l_1 = l_5 / 2;

  const meshA = new THREE.Mesh(
    new THREE.CylinderGeometry(radius, radius, height, 32, 1)
  );
  const meshB = new THREE.Mesh(new THREE.SphereGeometry(radius, 32, 32));
  meshB.position.setY(-l_4);
  const meshC = new THREE.Mesh(new THREE.SphereGeometry(radius, 32, 32));
  meshC.position.setY(l_4);
  const meshD = createPipeMesh(radius / 4, 0.005, radius);
  meshD.position.set(radius * 1.5, l_4 + radius * 1.5, 0);
  meshD.lookAt(new THREE.Vector3(0, l_4 + radius * 1.5));
  const meshF = meshD.clone();
  meshF.position.setY(-(l_4 + radius * 1.5));

  const meshEa = new THREE.Mesh(
    new THREE.CircleGeometry(radius + 0.01, 32, 0, deg180InRad)
  );
  meshEa.position.setY(l_4 - l_1 / 2);
  meshEa.rotateX(deg90InRad);
  const meshEb = meshEa.clone();
  meshEb.position.setY(meshEa.position.y - l_1);
  meshEb.rotateX(deg180InRad);
  const meshEc = meshEa.clone();
  meshEc.position.setY(meshEb.position.y - l_1);
  const meshEd = meshEa.clone();
  meshEd.position.setY(meshEc.position.y - l_1);
  meshEd.rotateX(deg180InRad);

  meshA.updateMatrix();
  meshB.updateMatrix();
  meshC.updateMatrix();
  meshD.updateMatrix();
  meshF.updateMatrix();
  meshEa.updateMatrix();
  meshEb.updateMatrix();
  meshEc.updateMatrix();
  meshEd.updateMatrix();

  (mesh.geometry as THREE.Geometry).merge(
    meshA.geometry as THREE.Geometry,
    meshA.matrix
  );
  (mesh.geometry as THREE.Geometry).merge(
    meshB.geometry as THREE.Geometry,
    meshB.matrix
  );
  (mesh.geometry as THREE.Geometry).merge(
    meshC.geometry as THREE.Geometry,
    meshC.matrix
  );
  (mesh.geometry as THREE.Geometry).merge(
    meshD.geometry as THREE.Geometry,
    meshD.matrix
  );
  (mesh.geometry as THREE.Geometry).merge(
    meshF.geometry as THREE.Geometry,
    meshF.matrix
  );
  (mesh.geometry as THREE.Geometry).merge(
    meshEa.geometry as THREE.Geometry,
    meshEa.matrix
  );
  (mesh.geometry as THREE.Geometry).merge(
    meshEb.geometry as THREE.Geometry,
    meshEb.matrix
  );
  (mesh.geometry as THREE.Geometry).merge(
    meshEc.geometry as THREE.Geometry,
    meshEc.matrix
  );
  (mesh.geometry as THREE.Geometry).merge(
    meshEd.geometry as THREE.Geometry,
    meshEd.matrix
  );

  const square = (tl: THREE.Vector2, br: THREE.Vector2) => {
    const lineCa = createBoldLine(
      new THREE.Vector3(tl.x, tl.y),
      new THREE.Vector3(br.x, tl.y)
    );
    const lineCb = createBoldLine(
      new THREE.Vector3(br.x, tl.y),
      new THREE.Vector3(br.x, br.y)
    );
    const lineCc = createBoldLine(
      new THREE.Vector3(br.x, br.y),
      new THREE.Vector3(tl.x, br.y)
    );
    const lineCd = createBoldLine(
      new THREE.Vector3(tl.x, br.y),
      new THREE.Vector3(tl.x, tl.y)
    );
    lineCa && mesh.add(lineCa);
    lineCb && mesh.add(lineCb);
    lineCc && mesh.add(lineCc);
    lineCd && mesh.add(lineCd);
  };

  square(
    new THREE.Vector2(0, l_4 + radius * 1.5),
    new THREE.Vector2(radius * 1.5, l_4)
  );
  square(
    new THREE.Vector2(0, -l_4),
    new THREE.Vector2(radius * 1.5, -(l_4 + radius * 1.5))
  );

  mesh.scale.setScalar(el.scale);
}

/**
 * Draws a GLB file.
 *
 * @param {THREE.Group} group - The group to which the loaded GLB model should be added.
 * @param {Object} el - The element containing properties for scaling and other transformations.
 * @param {string} glbFileName - The name of the GLB file to load.
 * @param {string} triggerEventType - The event type to trigger after loading.
 * @param {boolean} mergeGeometry - Whether to merge the loaded geometry with an existing mesh.
 * @param {THREE.Material} material - The material to apply to the loaded model.
 * @param {number} [scale=1] - The scale factor to apply to the loaded model.
 */
function drawGLBFile(
  group: THREE.Mesh,
  el: any, // Assuming `TYPES.TProcessColumn` is a custom type, replace `any` with the appropriate type
  glbFileName: string,
  triggerEventType: string,
  mergeGeometry: boolean,
  material: THREE.Material,
  scale: number = 1
) {
  const loader = new GLTFLoader();
  getLocalStorageSTL(glbFileName).then((binaryGLB) => {
    if (binaryGLB) {
      loader.load(
        glbFileName,
        (gltf) => {
          const model = gltf.scene;
          model.traverse((object) => {
            if ((object as THREE.Mesh).isMesh) {
              (object as THREE.Mesh).material = material;
              object.scale.setScalar(scale * (el.scale || 1));
            }
          });

          if (
            mergeGeometry &&
            group.children.length > 0 &&
            group.children[0] instanceof THREE.Mesh
          ) {
            const mesh = group.children[0];
            model.traverse((object: THREE.Object3D) => {
              if (object instanceof THREE.Mesh) {
                object.material = material;
                object.scale.setScalar(scale * (el.scale || 1));
              }
            });
          } else {
            model.position.set(0, 0, 0); // Adjust position as needed
            model.scale.setScalar(scale * (el.scale || 1)); // Adjust scale based on external factors
            group.add(model);
          }

          // Optional: Add metadata or helpers to the model
          model.name = el.name;
          model.userData = { isProcessSubItem: true };
          if (el.isAxesHelper) {
            const helper = new THREE.AxesHelper(1);
            model.add(helper);
          }

          // Dispatch event after loading
          globalEvents.dispatchEvent({
            type: triggerEventType,
            message: "GLB model loaded!",
          });
        },
        (error: any) => {
          console.error(
            "An error happened during the GLB loading process:",
            error
          );
        }
      );
    }
  });
}
async function drawSTLFile(
  mesh: THREE.Mesh,
  el: TYPES.TProcessColumn,
  stlFileName: string,
  triggerEventType: string,
  mergeGeometry: boolean,
  material: THREE.Material,
  scale: number = 1
) {
  const loader = new STLLoader();
  try {
    const binarySTL = await getLocalStorageSTL(stlFileName);
    if (binarySTL) {
      const geometry = loader.parse(binarySTL);
      geometry.computeBoundingBox();
      geometry.scale(
        (el.scale || 1) * (1 / 1000 / scale),
        (el.scale || 1) * (1 / 1000 / scale),
        (el.scale || 1) * (1 / 1000 / scale)
      );

      // Directly use BufferGeometry for better performance
      const meshA = new THREE.Mesh(geometry, material);
      // Rotate the mesh to align the axes
      meshA.rotateY(deg180InRad); // Assuming deg180InRad is correctly defined elsewhere

      const size = geometry.boundingBox.getSize(new THREE.Vector3());
      console.log("size", size);
      meshA.position.set(0, (-size.y / 2) * scale, 0);

      if (mergeGeometry) {
        // If merging geometries, consider using BufferGeometryUtils.mergeBufferGeometries for better performance
        // Note: This requires all geometries to be BufferGeometry instances
        console.error(
          "Merging geometries directly is not optimized in this example. Consider using BufferGeometryUtils.mergeBufferGeometries."
        );
      } else {
        mesh.add(meshA);

        meshA.name = el.name;
        meshA.userData = { isProcessSubItem: true };

        if (el.isAxesHelper) {
          const helper = getSimpleAxisHelper(); // Ensure this function returns a helper compatible with BufferGeometry
          meshA.add(helper);
        }
      }

      globalEvents.dispatchEvent({
        type: triggerEventType,
        message: "STL model loaded!",
      });

      // Adjust scale if necessary
      mesh.scale.setScalar(el.scale || 1);
    }
  } catch (error) {
    console.error("Error loading STL file:", error);
  }
}
function drawBC(meshGroup: THREE.Mesh, el: TYPES.TProcessColumn) {
  // drawSTLFile(
  //   mesh,
  //   el,
  //   `stl/${TYPES.EProcessElementType.BC}.stl`,
  //   "stl-loaded",
  //   true
  // );
  const mesh = new THREE.Mesh(new THREE.Geometry());
  const { radius, height } = getParameters(el);
  const meshA = new THREE.Mesh(
    new THREE.CylinderGeometry(radius, radius, height, 32, 1)
  );
  const meshB = new THREE.Mesh(new THREE.SphereGeometry(radius, 32, 32));
  // The desired height of the hemisphere, which is smaller than its radius

  // Scale the hemisphere geometry along the Y-axis to reduce its height
  meshB.geometry.scale(1, 0.4, 1);
  meshB.position.setY(-height / 2);
  const meshC = meshB.clone();
  meshC.position.setY(height / 2);

  meshA.updateMatrix();
  meshB.updateMatrix();
  meshC.updateMatrix();

  const meshD = new THREE.Mesh(
    new THREE.CylinderGeometry(
      (radius / 6) * 7,
      (radius / 6) * 7,
      height / 10,
      32,
      1
    )
  );
  meshD.position.setY((height / 7) * 3);
  meshD.updateMatrix();

  (mesh.geometry as THREE.Geometry).merge(
    meshA.geometry as THREE.Geometry,
    meshA.matrix
  );
  (mesh.geometry as THREE.Geometry).merge(
    meshB.geometry as THREE.Geometry,
    meshB.matrix
  );
  (mesh.geometry as THREE.Geometry).merge(
    meshC.geometry as THREE.Geometry,
    meshC.matrix
  );

  (mesh.geometry as THREE.Geometry).merge(
    meshD.geometry as THREE.Geometry,
    meshD.matrix
  );

  // const line = createBoldLine(
  //   new THREE.Vector3(0, -height / 2 - radius - 0.05),
  //   new THREE.Vector3(0, height / 2 + radius + 0.05)
  // );
  // if (line) {
  //   line.updateMatrix();
  //   (mesh.geometry as THREE.Geometry).merge(
  //     (line as THREE.Mesh).geometry as THREE.Geometry,
  //     line.matrix
  //   );
  // }

  (meshGroup.geometry as THREE.Geometry).merge(
    mesh.geometry as THREE.Geometry,
    mesh.matrix
  );

  meshGroup.scale.setScalar(el.scale);
}

function drawAV(mesh: THREE.Mesh, el: TYPES.TProcessColumn) {
  const radius1 = el.parameters.diameter
    ? MMtoM(el.parameters.diameter1) / 2
    : el.scale / 4;
  const radius2 = el.parameters.diameter2
    ? MMtoM(el.parameters.diameter2) / 2
    : el.scale / 4;
  const length1 = el.parameters.length1 ?? el.scale;
  const length2 = el.parameters.length2 ?? el.scale;
  const distance = el.parameters.distance ?? el.scale / 8;

  const mesh1A = new THREE.Mesh(
    new THREE.CylinderGeometry(radius1, radius1, length1, 32, 1)
  );
  mesh1A.rotateZ(deg90InRad);
  mesh1A.position.setY(distance + radius1 / 2);

  const mesh1B = new THREE.Mesh(new THREE.SphereGeometry(radius1, 32, 32));
  mesh1B.position.setY(distance + radius1 / 2);
  const scaleZ = 0.4;
  mesh1B.position.setX(length1 / 2);

  mesh1B.geometry.scale(scaleZ, 1, 1);

  // mesh1B.rotateZ(deg90InRad);

  const mesh1C = new THREE.Mesh(new THREE.SphereGeometry(radius1, 32, 32));
  mesh1C.position.setX(-length1 / 2);
  mesh1C.position.setY(distance + radius1 / 2);

  mesh1C.geometry.scale(scaleZ, 1, 1);
  // mesh1C.rotateZ(deg90InRad);

  const mesh2A = new THREE.Mesh(
    new THREE.CylinderGeometry(radius2, radius2, length2, 32, 1)
  );
  mesh2A.rotateZ(deg90InRad);

  const mesh2B = new THREE.Mesh(
    new THREE.CylinderGeometry(
      (radius2 / 10) * 11,
      (radius2 / 10) * 11,
      length2 / 30,
      32,
      1
    )
  );
  mesh2B.rotateZ(deg90InRad);
  mesh2B.position.setX((length2 / 20) * 8);
  mesh2B.updateMatrix();

  const mesh2C = mesh2B.clone();
  mesh2C.position.setX(-(length2 / 20) * 8);
  mesh2C.updateMatrix();

  // const meshB = new THREE.Mesh(
  //   new THREE.CylinderGeometry((radius / 3) * 2, radius, length / 4, 32, 1)
  // );
  // meshB.position.setX(-length / 2 - length / 8);
  // meshB.rotateZ(deg90InRad);
  // const meshC = new THREE.Mesh(new THREE.SphereGeometry(radius, 32, 32));
  // meshC.position.setX(length / 2);

  // const desiredHeight = radius * 0.4; // Example: 75% of the radius
  // // Calculate the scale factor for the Y-axis to achieve the desired height
  // const scaleZ = desiredHeight / radius;

  // meshC.geometry.scale(scaleZ, 1, 1);

  const leglength = radius2 * 4 + radius1 + distance;

  const meshLeg1 = new THREE.Mesh(
    new THREE.BoxGeometry(radius2 / 14, leglength, Math.min(radius1, radius2))
  );
  const meshLeg1Bottom = new THREE.Mesh(
    new THREE.BoxGeometry(radius2 / 3, radius2 / 14, Math.min(radius1, radius2))
  );
  meshLeg1.position.setX(length1 / 3),
    meshLeg1Bottom.position.setX(length1 / 3),
    meshLeg1.position.setY(radius1 + distance - leglength / 2);
  meshLeg1Bottom.position.setY(radius1 + distance - leglength);

  const meshLeg2 = new THREE.Mesh(
    new THREE.BoxGeometry(radius2 / 14, leglength, Math.min(radius1, radius2))
  );
  const meshLeg2Bottom = new THREE.Mesh(
    new THREE.BoxGeometry(radius2 / 3, radius2 / 14, Math.min(radius1, radius2))
  );
  meshLeg2.position.setX(-length1 / 3),
    meshLeg2Bottom.position.setX(-length1 / 3),
    meshLeg2.position.setY(radius1 + distance - leglength / 2);
  meshLeg2Bottom.position.setY(radius1 + distance - leglength);

  const meshD = new THREE.Mesh(
    new THREE.CylinderGeometry(
      (Math.min(radius1, radius2) / 3) * 1,
      (Math.min(radius1, radius2) / 3) * 1,
      (distance / 5) * 6,
      32
    )
  );
  meshD.position.setX(
    -Math.min(length1, length2) / 3 - Math.min(length1, length2) / 12
  ),
    meshD.position.setY((distance / 5) * 3);

  // const meshLeg2 = new THREE.Mesh(
  //   new THREE.BoxGeometry(radius / 14, radius, radius)
  // );
  // const meshLeg2Bottom = new THREE.Mesh(
  //   new THREE.BoxGeometry(radius / 3, radius / 14, radius)
  // );

  // meshLeg2.position.setX(-length / 3),
  //   meshLeg2Bottom.position.setX(-length / 3),
  //   meshLeg2.position.setY(-radius - radius / 3);
  // meshLeg2Bottom.position.setY(-radius - radius / 3 - radius / 2);

  meshLeg1.updateMatrix();
  meshLeg1Bottom.updateMatrix();
  meshLeg2.updateMatrix();
  meshLeg2Bottom.updateMatrix();

  mesh1A.updateMatrix();
  mesh1B.updateMatrix();
  mesh1C.updateMatrix();
  mesh2A.updateMatrix();
  meshD.updateMatrix();

  (mesh.geometry as THREE.Geometry).merge(
    mesh1A.geometry as THREE.Geometry,
    mesh1A.matrix
  );
  (mesh.geometry as THREE.Geometry).merge(
    mesh2A.geometry as THREE.Geometry,
    mesh2A.matrix
  );
  (mesh.geometry as THREE.Geometry).merge(
    mesh1B.geometry as THREE.Geometry,
    mesh1B.matrix
  );
  (mesh.geometry as THREE.Geometry).merge(
    mesh1C.geometry as THREE.Geometry,
    mesh1C.matrix
  );
  (mesh.geometry as THREE.Geometry).merge(
    meshD.geometry as THREE.Geometry,
    meshD.matrix
  );
  (mesh.geometry as THREE.Geometry).merge(
    mesh2B.geometry as THREE.Geometry,
    mesh2B.matrix
  );
  (mesh.geometry as THREE.Geometry).merge(
    mesh2C.geometry as THREE.Geometry,
    mesh2C.matrix
  );
  // (mesh.geometry as THREE.Geometry).merge(
  //   meshC.geometry as THREE.Geometry,
  //   meshC.matrix
  // );
  (mesh.geometry as THREE.Geometry).merge(
    meshLeg1.geometry as THREE.Geometry,
    meshLeg1.matrix
  );
  (mesh.geometry as THREE.Geometry).merge(
    meshLeg1Bottom.geometry as THREE.Geometry,
    meshLeg1Bottom.matrix
  );
  (mesh.geometry as THREE.Geometry).merge(
    meshLeg2.geometry as THREE.Geometry,
    meshLeg2.matrix
  );
  (mesh.geometry as THREE.Geometry).merge(
    meshLeg2Bottom.geometry as THREE.Geometry,
    meshLeg2Bottom.matrix
  );
  mesh.scale.setScalar(el.scale);
}

function drawAH(mesh: THREE.Mesh, el: TYPES.TProcessColumn) {
  const radius = el.parameters.diameter
    ? MMtoM(el.parameters.diameter) / 2
    : el.scale / 4;
  const length = (el.parameters.length ?? el.scale) - radius * 2 || 0.001;

  const meshA = new THREE.Mesh(
    new THREE.CylinderGeometry(radius, radius, length, 32, 1)
  );
  meshA.rotateZ(deg90InRad);

  const meshB = new THREE.Mesh(
    new THREE.CylinderGeometry((radius / 10) * 7, radius, length / 6, 32, 1)
  );
  meshB.position.setX(-length / 2 - length / 12);
  meshB.rotateZ(deg90InRad);
  const meshC = new THREE.Mesh(new THREE.SphereGeometry(radius, 32, 32));
  meshC.position.setX(length / 2);

  const desiredHeight = radius * 0.4; // Example: 75% of the radius
  // Calculate the scale factor for the Y-axis to achieve the desired height
  const scaleZ = desiredHeight / radius;

  meshC.geometry.scale(scaleZ, 1, 1);

  const meshLeg1 = new THREE.Mesh(
    new THREE.BoxGeometry(radius / 14, radius, radius)
  );
  const meshLeg1Bottom = new THREE.Mesh(
    new THREE.BoxGeometry(radius / 3, radius / 14, radius)
  );
  meshLeg1.position.setX(length / 3),
    meshLeg1Bottom.position.setX(length / 3),
    meshLeg1.position.setY(-radius - radius / 3);
  meshLeg1Bottom.position.setY(-radius - radius / 3 - radius / 2);

  const meshLeg2 = new THREE.Mesh(
    new THREE.BoxGeometry(radius / 14, radius, radius)
  );
  const meshLeg2Bottom = new THREE.Mesh(
    new THREE.BoxGeometry(radius / 3, radius / 14, radius)
  );

  meshLeg2.position.setX(-length / 3),
    meshLeg2Bottom.position.setX(-length / 3),
    meshLeg2.position.setY(-radius - radius / 3);
  meshLeg2Bottom.position.setY(-radius - radius / 3 - radius / 2);

  meshLeg1.updateMatrix();
  meshLeg1Bottom.updateMatrix();
  meshLeg2.updateMatrix();
  meshLeg2Bottom.updateMatrix();

  meshA.updateMatrix();
  meshB.updateMatrix();
  meshC.updateMatrix();

  (mesh.geometry as THREE.Geometry).merge(
    meshA.geometry as THREE.Geometry,
    meshA.matrix
  );
  (mesh.geometry as THREE.Geometry).merge(
    meshB.geometry as THREE.Geometry,
    meshB.matrix
  );
  (mesh.geometry as THREE.Geometry).merge(
    meshC.geometry as THREE.Geometry,
    meshC.matrix
  );
  (mesh.geometry as THREE.Geometry).merge(
    meshLeg1.geometry as THREE.Geometry,
    meshLeg1.matrix
  );
  (mesh.geometry as THREE.Geometry).merge(
    meshLeg1Bottom.geometry as THREE.Geometry,
    meshLeg1Bottom.matrix
  );
  (mesh.geometry as THREE.Geometry).merge(
    meshLeg2.geometry as THREE.Geometry,
    meshLeg2.matrix
  );
  (mesh.geometry as THREE.Geometry).merge(
    meshLeg2Bottom.geometry as THREE.Geometry,
    meshLeg2Bottom.matrix
  );
  mesh.scale.setScalar(el.scale);
}

function drawWHB(mesh: THREE.Mesh, el: TYPES.TProcessColumn) {
  const radius = el.parameters.diameter
    ? MMtoM(el.parameters.diameter) / 2
    : el.scale / 4;
  const length = (el.parameters.length ?? el.scale) - radius * 2 || 0.001;

  const meshA = new THREE.Mesh(
    new THREE.CylinderGeometry(radius, radius, length, 32, 1)
  );
  meshA.rotateZ(deg90InRad);

  const meshB = new THREE.Mesh(
    new THREE.CylinderGeometry(
      (radius / 5) * 4,
      (radius / 5) * 4,
      length,
      32,
      1
    )
  );
  meshB.position.setX(-length / 2 - length / 2);
  meshB.rotateZ(deg90InRad);
  const meshC = new THREE.Mesh(new THREE.SphereGeometry(radius, 32, 32));
  meshC.position.setX(length / 2);

  const desiredHeight = radius * 0.4; // Example: 75% of the radius
  // Calculate the scale factor for the Y-axis to achieve the desired height
  const scaleZ = desiredHeight / radius;

  meshC.geometry.scale(scaleZ, 1, 1);

  const path1 = new THREE.Path();
  path1.lineTo(-radius, radius);
  path1.quadraticCurveTo(0, radius * 2, radius, radius);
  path1.lineTo(0, 0);

  // Use the getPoints() method to generate a series of points along the path
  // The first argument of TubeGeometry should be a 3D curve object. In this case, we need to convert the 2D points to a 3D path
  const points = path1.getPoints();
  const curve = new THREE.CatmullRomCurve3(
    points.map((p) => new THREE.Vector3(-length - length / 5, p.y, p.x))
  );

  const tube1 = new THREE.Mesh(
    new THREE.TubeGeometry(curve, 32, radius / 5, 32, true)
  );

  const handler1 = new THREE.Mesh(
    new THREE.CylinderGeometry(radius / 5, radius / 5, length / 2, 32)
  );
  handler1.position.copy(
    new Vector3(
      -length - length / 5 - length / 4,
      radius * 2 - radius / 10 - (radius / 5) * 2,
      0
    )
  );
  handler1.rotateZ(deg90InRad);
  const handler2 = handler1.clone();
  handler2.position.setY(-radius * 2 + radius / 10 + (radius / 5) * 2);

  const tube2 = tube1.clone();
  tube2.rotateX(deg180InRad);

  meshA.updateMatrix();
  meshB.updateMatrix();
  meshC.updateMatrix();
  tube1.updateMatrix();
  tube2.updateMatrix();
  handler1.updateMatrix();
  handler2.updateMatrix();

  (mesh.geometry as THREE.Geometry).merge(
    meshA.geometry as THREE.Geometry,
    meshA.matrix
  );
  (mesh.geometry as THREE.Geometry).merge(
    meshB.geometry as THREE.Geometry,
    meshB.matrix
  );
  (mesh.geometry as THREE.Geometry).merge(
    meshC.geometry as THREE.Geometry,
    meshC.matrix
  );

  (mesh.geometry as THREE.Geometry).merge(
    tube1.geometry as THREE.Geometry,
    tube1.matrix
  );
  (mesh.geometry as THREE.Geometry).merge(
    tube2.geometry as THREE.Geometry,
    tube2.matrix
  );
  (mesh.geometry as THREE.Geometry).merge(
    handler1.geometry as THREE.Geometry,
    handler1.matrix
  );
  (mesh.geometry as THREE.Geometry).merge(
    handler2.geometry as THREE.Geometry,
    handler2.matrix
  );

  mesh.scale.setScalar(el.scale);
}

function drawCC(mesh: THREE.Mesh, el: TYPES.TProcessColumn) {
  const radius = el.parameters.diameter
    ? MMtoM(el.parameters.diameter) / 2
    : el.scale / 4;
  const length = (el.parameters.length ?? el.scale) - radius * 2 || 0.001;

  const meshA = new THREE.Mesh(
    new THREE.CylinderGeometry(radius, radius, length, 32, 1)
  );
  meshA.rotateZ(deg90InRad);

  const meshB = new THREE.Mesh(
    new THREE.CylinderGeometry(
      (radius / 10) * 12,
      (radius / 10) * 12,
      length / 20,
      32,
      1
    )
  );
  meshB.position.setX(-length / 2 - length / 40);
  meshB.rotateZ(deg90InRad);
  const meshC = new THREE.Mesh(
    new THREE.CylinderGeometry(radius, (radius / 3) * 4, length / 8, 32)
  );
  meshC.position.setX(length / 2 + length / 16);
  meshC.rotateZ(deg90InRad);

  const meshD = new THREE.Mesh(
    new THREE.CylinderGeometry(
      (radius / 3) * 4,
      (radius / 3) * 4,
      length / 5,
      32
    )
  );
  meshD.position.setX(length / 2 + length / 8 + length / 10);
  meshD.rotateZ(deg90InRad);

  const meshE = new THREE.Mesh(
    new THREE.SphereGeometry((radius / 3) * 4, 32, 32)
  );
  meshE.position.setX(length / 2 + length / 8 + length / 5);

  // const desiredHeight = (radius / 3) * 4 * 0.4; // Example: 75% of the radius
  // Calculate the scale factor for the Y-axis to achieve the desired height
  const scaleZ = 0.4;

  meshE.geometry.scale(scaleZ, 1, 1);
  // const desiredHeight = radius * 0.4; // Example: 75% of the radius
  // // Calculate the scale factor for the Y-axis to achieve the desired height
  // const scaleZ = desiredHeight / radius;

  // meshC.geometry.scale(scaleZ, 1, 1);

  const meshLeg1 = new THREE.Mesh(
    new THREE.BoxGeometry(radius / 14, radius, radius)
  );
  const meshLeg1Bottom = new THREE.Mesh(
    new THREE.BoxGeometry(radius / 3, radius / 14, radius)
  );
  meshLeg1.position.setX(length / 3),
    meshLeg1Bottom.position.setX(length / 3),
    meshLeg1.position.setY(-radius - radius / 3);
  meshLeg1Bottom.position.setY(-radius - radius / 3 - radius / 2);

  const meshLeg2 = new THREE.Mesh(
    new THREE.BoxGeometry(radius / 14, radius, radius)
  );
  const meshLeg2Bottom = new THREE.Mesh(
    new THREE.BoxGeometry(radius / 3, radius / 14, radius)
  );

  meshLeg2.position.setX(-length / 3),
    meshLeg2Bottom.position.setX(-length / 3),
    meshLeg2.position.setY(-radius - radius / 3);
  meshLeg2Bottom.position.setY(-radius - radius / 3 - radius / 2);

  meshLeg1.updateMatrix();
  meshLeg1Bottom.updateMatrix();
  meshLeg2.updateMatrix();
  meshLeg2Bottom.updateMatrix();

  meshA.updateMatrix();
  meshB.updateMatrix();
  meshC.updateMatrix();
  meshD.updateMatrix();
  meshE.updateMatrix();

  (mesh.geometry as THREE.Geometry).merge(
    meshA.geometry as THREE.Geometry,
    meshA.matrix
  );
  (mesh.geometry as THREE.Geometry).merge(
    meshB.geometry as THREE.Geometry,
    meshB.matrix
  );
  (mesh.geometry as THREE.Geometry).merge(
    meshC.geometry as THREE.Geometry,
    meshC.matrix
  );
  (mesh.geometry as THREE.Geometry).merge(
    meshD.geometry as THREE.Geometry,
    meshD.matrix
  );
  (mesh.geometry as THREE.Geometry).merge(
    meshE.geometry as THREE.Geometry,
    meshE.matrix
  );
  (mesh.geometry as THREE.Geometry).merge(
    meshLeg1.geometry as THREE.Geometry,
    meshLeg1.matrix
  );
  (mesh.geometry as THREE.Geometry).merge(
    meshLeg1Bottom.geometry as THREE.Geometry,
    meshLeg1Bottom.matrix
  );
  (mesh.geometry as THREE.Geometry).merge(
    meshLeg2.geometry as THREE.Geometry,
    meshLeg2.matrix
  );
  (mesh.geometry as THREE.Geometry).merge(
    meshLeg2Bottom.geometry as THREE.Geometry,
    meshLeg2Bottom.matrix
  );
  mesh.scale.setScalar(el.scale);
}

function getParameters(el: TYPES.TProcessElement) {
  const radius = el.parameters.diameter
    ? MMtoM(el.parameters.diameter) / 2
    : el.scale / 4;
  const height =
    (el.parameters.height ? MMtoM(el.parameters.height) : el.scale) -
      radius * 2 || 0.001;
  const length = (el.parameters.length ?? el.scale) - radius * 2 || 0.001;
  const thickness = el.parameters.thickness
    ? MMtoM(el.parameters.thickness)
    : el.scale / 10;

  const realHeight = MMtoM(el.parameters.height);
  const width = MMtoM(el.parameters.width);
  const realLength = MMtoM(el.parameters.length);
  return { radius, height, realLength, length, realHeight, width, thickness };
}

function drawVerticalCylinder(
  mesh: THREE.Mesh,
  el: TYPES.TProcessColumn,
  height?: number
) {
  const { radius, height: heightParam, thickness } = getParameters(el);

  if (!height) height = heightParam;

  const meshA = createPipeMesh(radius, thickness, height);
  meshA.position.setY(-height / 2);
  meshA.lookAt(new THREE.Vector3(0, height, 0));

  meshA.updateMatrix();
  (mesh.geometry as THREE.Geometry).merge(
    meshA.geometry as THREE.Geometry,
    meshA.matrix
  );
}

function drawSurface(
  mesh: THREE.Mesh,
  el: TYPES.TProcessColumn,
  position: "TOP" | "BOTTOM" | "BOTH"
) {
  const { radius, height, thickness } = getParameters(el);
  const meshC = new THREE.Mesh(new THREE.SphereGeometry(radius, 32, 32));
  if (position == "TOP" || position == "BOTH") meshC.position.setY(height / 2);

  const desiredHeight = radius * 0.4; // Example: 75% of the radius
  // Calculate the scale factor for the Y-axis to achieve the desired height
  const scaleZ = desiredHeight / radius;

  meshC.geometry.scale(scaleZ, 1, 1);
  meshC.rotateZ(deg90InRad);

  if (position === "BOTH") {
    const meshB = meshC.clone();
    meshB.position.setY(-height / 2);
    meshB.updateMatrix();

    (mesh.geometry as THREE.Geometry).merge(
      meshB.geometry as THREE.Geometry,
      meshB.matrix
    );
  }

  meshC.updateMatrix();

  (mesh.geometry as THREE.Geometry).merge(
    meshC.geometry as THREE.Geometry,
    meshC.matrix
  );
}

function drawLugElement(
  mesh: THREE.Mesh,
  el: TYPES.TProcessElement,
  material: THREE.Material
) {
  if (!el.lugs) return;

  for (let i = 0; i < el.lugs.length; i++) {
    const { position, height, width, thickness } = el.lugs[i];

    // const angle = (Math.PI / count) * i;
    const path = new THREE.Shape();
    path.moveTo(0, 0);
    path.moveTo(-height / 8, 0);
    path.lineTo(-height, (height / 8) * 7);
    path.lineTo(-height, height);
    path.lineTo(0, height);
    path.lineTo(0, 0);
    const extrudeSettings = {
      steps: 100, // Number of points along the path
      bevelEnabled: false, // No bevel
      depth: thickness / 10,
      // Path to extrude along
    };
    const lug = new THREE.Mesh(
      new THREE.ExtrudeGeometry(path, extrudeSettings),
      material
    );

    const realpos = position
      .clone()
      .sub(new THREE.Vector3(el.position.x, el.position.y, el.position.z));
    if (realpos.z > 0) realpos.z += height;
    if (realpos.z < 0) realpos.z -= height;
    lug.position.copy(realpos);

    lug.lookAt(new Vector3().setY(realpos.y));
    lug.rotateZ(-deg90InRad);
    lug.rotateX(deg90InRad);

    const lugBottom = new THREE.Mesh(
      new THREE.BoxGeometry(thickness / 10, height, width, 32),
      material
    );

    // lugBottom.position.copy(realpos);
    lugBottom.position.x += thickness / 10 / 2;
    lugBottom.position.y += height / 2;

    // lugBottom.position.x -= height;

    lugBottom.updateMatrix();
    mergeMesh(lug, lugBottom);

    const temp = new THREE.Mesh(
      new THREE.SphereGeometry(height, 32, 32),
      material
    );
    temp.position.copy(realpos);
    // lug.rotateY(angle);
    // lugBottom.rotateZ(angle);
    // mergeMesh(mesh, temp);

    mergeMesh(mesh, lug);
  }
}
function createSplitBoxGeometry(
  width: number,
  height: number,
  depth: number
): THREE.BufferGeometry {
  // Create an empty BufferGeometry
  const geometry = new THREE.BufferGeometry();

  // Define the vertices for the split box
  const vertices = new Float32Array([
    // Vertices for the first half
    0,
    0,
    0, // 0
    width / 2,
    0,
    0, // 1
    0,
    height,
    0, // 2
    0,
    0,
    depth, // 3
    width / 2,
    0,
    depth, // 4
    0,
    height,
    depth, // 5
  ]);

  // Indexes to create the faces
  const indices = [
    // First half faces
    0,
    2,
    1,
    2,
    5,
    1,
    1,
    5,
    4,
    5,
    3,
    4,
    2,
    0,
    3,
    5,
    2,
    3,
  ];

  // Create a buffer attribute to hold the vertices
  geometry.setIndex(indices);
  geometry.setAttribute("position", new THREE.BufferAttribute(vertices, 3));

  // Compute normals for the faces
  geometry.computeVertexNormals();

  return geometry;
}
function getPointSideRelativeToBoxLocal(
  position: THREE.Vector3,
  width: number,
  height: number,
  length: number
) {
  // Half dimensions
  const halfWidth = width / 2;
  const halfHeight = height / 2;
  const halfLength = length / 2;

  // Define a small tolerance to account for floating point precision issues
  const tolerance = 1e-3; // Adjust as needed

  // Check if the point is close to any of the sides within the tolerance
  if (Math.abs(position.x + halfWidth) < tolerance) return "left";
  if (Math.abs(position.x - halfWidth) < tolerance) return "right";
  if (Math.abs(position.y - halfHeight) < tolerance) return "up";
  if (Math.abs(position.z + halfLength) < tolerance) return "back";
  if (Math.abs(position.z - halfLength) < tolerance) return "front";

  return "unknown"; // Not on any of the specified sides or within tolerance
}

function drawBlockElement(
  mesh: THREE.Mesh,
  el: TYPES.TProcessElement,
  material: THREE.Material
) {
  if (!el.blocks) return;
  const boxWidth = MMtoM(el.parameters.width);
  const boxHeight = MMtoM(el.parameters.height);
  const boxLength = MMtoM(el.parameters.length);

  for (let i = 0; i < el.blocks.length; i++) {
    const { width, height, position } = el.blocks[i];
    const halfBoxPositive = createSplitBoxGeometry(
      width,
      height,
      height / Math.sqrt(3)
    );

    const realpos = new Vector3(position.x, position.y, position.z).sub(
      new THREE.Vector3(el.position.x, el.position.y, el.position.z)
    );

    const block = new THREE.Mesh(halfBoxPositive, material);
    block.position.copy(realpos);

    const direction = getPointSideRelativeToBoxLocal(
      realpos,
      boxWidth,
      boxHeight,
      boxLength
    );
    console.log(direction);

    switch (direction) {
      case "front":
        block.rotateY(-deg90InRad);
        mesh.add(block);
        break;
      case "back":
        block.rotateY(deg90InRad);
        mesh.add(block);
        break;
      case "left":
        block.rotateY(-deg180InRad);
        mesh.add(block);
        break;
      case "right":
        mesh.add(block);
        break;
    }
  }
}

function drawLug(
  mesh: THREE.Mesh,
  el: TYPES.TProcessColumn,
  count: number,
  scaleX: number = 1,
  scaleY: number = 1
) {
  const { radius, height, thickness } = getParameters(el);
  for (let i = 0; i < count; i++) {
    const angle = (Math.PI / count) * i;
    const path = new THREE.Shape();
    const lugHeight = height / 7;
    const lugStartY = height / 2 - height / 5;
    const lugEndY = lugStartY - lugHeight;
    path.moveTo((-radius / 5) * scaleY * 7, lugStartY);
    path.lineTo(-radius * scaleY * 3, lugEndY + lugHeight / 6);
    path.lineTo(-radius * scaleY * 3, lugEndY);
    path.lineTo(radius * scaleY * 3, lugEndY);
    path.lineTo(radius * scaleY * 3, lugEndY + lugHeight / 6);
    path.lineTo((radius / 5) * scaleY * 7, lugStartY);
    path.lineTo((-radius / 5) * scaleY * 7, lugStartY);
    const extrudeSettings = {
      steps: 100, // Number of points along the path
      bevelEnabled: false, // No bevel
      depth: thickness,
      // Path to extrude along
    };
    const lug = new THREE.Mesh(
      new THREE.ExtrudeGeometry(path, extrudeSettings)
    );

    const lugBottom = new THREE.Mesh(
      new THREE.BoxGeometry(
        radius * scaleY * 6,
        radius * scaleX * 2,
        thickness,
        32
      )
    );
    lugBottom.rotateX(deg90InRad);
    lugBottom.position.setY(lugEndY + thickness / 2);

    lug.rotateY(angle);
    lugBottom.rotateZ(angle);

    lug.updateMatrix();
    lugBottom.updateMatrix();

    (mesh.geometry as THREE.Geometry).merge(
      lug.geometry as THREE.Geometry,
      lug.matrix
    );
    (mesh.geometry as THREE.Geometry).merge(
      lugBottom.geometry as THREE.Geometry,
      lugBottom.matrix
    );
  }
}
function drawNAH(
  mesh: THREE.Mesh,
  el: TYPES.TProcessColumn,
  material: THREE.Material
) {
  const { radius, height, thickness } = getParameters(el);

  function drawBox() {
    const mesh = new THREE.Mesh(new THREE.Geometry());
    const boxHeight = height / 7;
    const boxFrontWidth = (radius / 5) * 8;
    const boxFront = new THREE.Mesh(
      new THREE.BoxGeometry(boxFrontWidth, boxHeight, thickness)
    );
    const boxSide = new THREE.Mesh(
      new THREE.BoxGeometry((radius / 5) * 7, boxHeight, thickness)
    );
    boxSide.rotateY(deg90InRad);
    boxSide.position.copy(
      new Vector3(
        -boxFrontWidth / 2 + thickness / 2,
        height / 4,
        (radius / 5) * 3 + ((radius / 5) * 7) / 2
      )
    );

    const boxSide2 = boxSide.clone();
    boxSide2.position.setX(+boxFrontWidth / 2 - thickness / 2);

    boxFront.position.copy(new Vector3(0, height / 4, radius * 2));

    boxFront.updateMatrix();
    boxSide.updateMatrix();
    boxSide2.updateMatrix();

    (mesh.geometry as THREE.Geometry).merge(
      boxFront.geometry as THREE.Geometry,
      boxFront.matrix
    );
    (mesh.geometry as THREE.Geometry).merge(
      boxSide.geometry as THREE.Geometry,
      boxSide.matrix
    );
    (mesh.geometry as THREE.Geometry).merge(
      boxSide2.geometry as THREE.Geometry,
      boxSide2.matrix
    );
    return mesh;
  }
  const boxMesh = drawBox();

  drawLug(mesh, el, 1);

  drawVerticalCylinder(mesh, el);

  boxMesh.position.setY(-height / 2);
  boxMesh.updateMatrix();
  (mesh.geometry as THREE.Geometry).merge(
    boxMesh.geometry as THREE.Geometry,
    boxMesh.matrix
  );

  mesh.scale.setScalar(el.scale);
}
function drawHorizontalCylinder(mesh: THREE.Mesh, el: TYPES.TProcessColumn) {
  const { radius, length } = getParameters(el);
  const meshA = new THREE.Mesh(
    new THREE.CylinderGeometry(radius, radius, length, 32, 1)
  );
  meshA.rotateZ(deg90InRad);

  meshA.updateMatrix();
  (mesh.geometry as THREE.Geometry).merge(
    meshA.geometry as THREE.Geometry,
    meshA.matrix
  );

  mesh.scale.setScalar(el.scale);
}

function drawTGP(
  mesh: THREE.Mesh,
  el: TYPES.TProcessColumn,
  material: THREE.Material
) {
  const { radius, length } = getParameters(el);

  const topRadius = radius / 3;
  const topLength = radius * 1.5;

  const meshA = new THREE.Mesh(
    new THREE.CylinderGeometry(topRadius, topRadius, topLength, 32, 1)
  );
  meshA.position.copy(new Vector3(0, topLength / 2, 0));

  meshA.updateMatrix();
  (mesh.geometry as THREE.Geometry).merge(
    meshA.geometry as THREE.Geometry,
    meshA.matrix
  );

  drawHorizontalCylinder(mesh, el);
}
function drawIAF(
  mesh: THREE.Mesh,
  el: TYPES.TProcessColumn,
  material: THREE.Material
) {
  // drawSTLFile(
  //   mesh,
  //   el,
  //   `stl/${TYPES.EProcessElementType.IAF}.stl`,
  //   "stl-loaded",
  //   false,
  //   material
  // );

  const width = MMtoM(el.parameters.width);
  const height = MMtoM(el.parameters.height);
  const length = MMtoM(el.parameters.length);

  const box = new THREE.Mesh(
    new THREE.BoxGeometry(width, height, length, 1, 1, 1)
  );
  mergeMesh(mesh, box);
}
function drawDAF(
  mesh: THREE.Mesh,
  el: TYPES.TProcessColumn,
  material: THREE.Material
) {
  drawSurface(mesh, el, "BOTH");
  drawVerticalCylinder(mesh, el);
  drawLug(mesh, el, 2, 0.4, 0.6);

  mesh.scale.setScalar(el.scale);
}
function drawPUMP_PRELUDE(
  mesh: THREE.Mesh,
  el: TYPES.TProcessColumn,
  material: THREE.Material
) {
  const shaftLength = MMtoM(el.pumpParameters.shaftLength);
  const shaftDiam = MMtoM(el.pumpParameters.shaftDiam);
  const motorDiam = MMtoM(el.pumpParameters.motorDiam);

  const pumpWidth = MMtoM(el.pumpParameters.pumpWidth);
  const pumpDiam = MMtoM(el.pumpParameters.pumpDiam);
  const motorLength = MMtoM(el.pumpParameters.motorLength);
  const heightSupport = MMtoM(el.pumpParameters.heightSupport);
  const pump = new THREE.Mesh(new THREE.Geometry());
  const pumpMesh = new THREE.Mesh(
    new THREE.CylinderGeometry(pumpDiam / 2, pumpDiam / 2, pumpWidth, 32),
    material
  );
  pumpMesh.rotateX(deg90InRad);

  const supportShape = new THREE.Shape();
  supportShape.moveTo(0, 0);
  supportShape.lineTo(-pumpDiam / 2, -heightSupport);
  supportShape.lineTo(pumpDiam / 2, -heightSupport);
  supportShape.lineTo(0, 0);

  const extrudeSettings = {
    steps: 100, // Number of points along the path
    bevelEnabled: false, // No bevel
    depth: pumpWidth / 2,
  };

  const supportMesh = new THREE.Mesh(
    new THREE.ExtrudeGeometry(supportShape, extrudeSettings),
    material
  );
  supportMesh.translateZ(-pumpWidth / 4);

  const middleLine = new THREE.Mesh(
    new THREE.CylinderGeometry(pumpDiam / 10, pumpDiam / 10, shaftLength),
    material
  );
  middleLine.translateZ(-shaftLength / 2);
  middleLine.rotateX(deg90InRad);

  const connectionCylinder = new THREE.Mesh(
    new THREE.CylinderGeometry(
      shaftDiam * 1.5,
      shaftDiam * 1.5,
      (shaftLength * 0.15) / 2,
      32
    ),
    material
  );
  connectionCylinder.translateZ(-shaftLength * 0.75 - (shaftLength * 0.15) / 4);

  connectionCylinder.rotateX(deg90InRad);

  const motor = new THREE.Mesh(new THREE.Geometry());
  const motorMaterial = new THREE.MeshLambertMaterial({
    transparent: true,
    opacity: 1,
    color: getRGB(blue),
    side: THREE.DoubleSide,
  });

  const motorMesh = new THREE.Mesh(
    new THREE.CylinderGeometry(motorDiam / 2, motorDiam / 2, motorLength, 32),
    motorMaterial
  );
  motorMesh.rotateX(deg90InRad);

  const motorSupportShape = new THREE.Shape();
  motorSupportShape.moveTo(0, 0);
  motorSupportShape.lineTo(-motorDiam / 2, -0.6 * motorDiam);
  motorSupportShape.lineTo(motorDiam / 2, -0.6 * motorDiam);
  motorSupportShape.lineTo(0, 0);

  const motorSupportMesh = new THREE.Mesh(
    new THREE.ExtrudeGeometry(motorSupportShape, extrudeSettings),
    motorMaterial
  );
  const motorSupportMesh2 = motorSupportMesh.clone();
  motorSupportMesh.translateZ(
    motorLength / 2 - motorLength / 5 - pumpWidth / 4
  );
  motorSupportMesh2.translateZ(
    -motorLength / 2 + motorLength / 5 - pumpWidth / 4
  );
  mergeMesh(motor, motorSupportMesh);
  mergeMesh(motor, motorSupportMesh2);
  mergeMesh(motor, motorMesh);

  const motorLine = new THREE.Mesh(
    new THREE.CylinderGeometry(
      pumpDiam / 2 / 5,
      pumpDiam / 2 / 5,
      motorLength * 0.2
    ),
    motorMaterial
  );
  motorLine.translateZ(motorLength / 2 + motorLength / 5 / 2);
  motorLine.rotateX(deg90InRad);
  mergeMesh(motor, motorLine);

  motor.translateZ(-shaftLength - motorLength * 0.6 - pumpWidth / 4);

  motor.material = motorMaterial;
  // mergeMesh(mesh, motor);
  mesh.add(motor);
  mergeMesh(pump, middleLine);
  mergeMesh(pump, connectionCylinder);
  mergeMesh(pump, pumpMesh);
  mergeMesh(pump, supportMesh);

  mergeMesh(mesh, pump);
}
function drawAB_PUMP(
  mesh: THREE.Mesh,
  el: TYPES.TProcessColumn,
  material: THREE.Material
) {
  const pumpWidth = MMtoM(el.pumpParameters.pumpWidth);
  const pumpDiam = MMtoM(el.pumpParameters.pumpDiam);
  const heightSupport = MMtoM(el.pumpParameters.heightSupport);
  const pumpMesh = new THREE.Mesh(
    new THREE.CylinderGeometry(pumpDiam, pumpDiam, pumpWidth, 32)
  );

  const supportShape = new THREE.Shape();
  supportShape.moveTo(0, 0);
  supportShape.lineTo(-pumpDiam / 2, -heightSupport);
  supportShape.lineTo(pumpDiam / 2, -heightSupport);
  supportShape.lineTo(0, 0);

  const extrudeSettings = {
    steps: 100, // Number of points along the path
    bevelEnabled: false, // No bevel
    depth: 100,
  };

  const supportMesh = new THREE.Mesh(
    new THREE.ExtrudeGeometry(supportShape, extrudeSettings),
    material
  );

  mergeMesh(pumpMesh, supportMesh);

  mergeMesh(mesh, pumpMesh);
}

function drawES(mesh: THREE.Mesh, el: TYPES.TProcessColumn) {
  const radius1 = el.parameters.diameter1
    ? MMtoM(el.parameters.diameter1) / 2
    : el.scale / 4;
  const radius2 = el.parameters.diameter2
    ? MMtoM(el.parameters.diameter2) / 2
    : el.scale / 4;
  const heightTot = el.parameters.heightTot
    ? MMtoM(el.parameters.heightTot)
    : el.scale;

  const heightBase = el.parameters.heightBase
    ? MMtoM(el.parameters.heightBase)
    : el.scale;

  const thickness = el.parameters.thickness
    ? MMtoM(el.parameters.thickness)
    : el.scale / 10;

  // const l_4 = heightT / 2;
  // const l_5 = height / 2.5;
  // const l_1 = l_5 / 2;
  const meshA = createPipeMesh(radius1, thickness, heightTot);
  // meshA.position.setX(-heightTot / 2);
  meshA.position.setY(heightBase + (radius2 - radius1));
  meshA.lookAt(new THREE.Vector3(0, heightTot, 0));
  const meshB = createPipeMesh(radius2, thickness, heightBase);
  // meshB.position.setY(heightBase / 2);
  meshB.lookAt(new THREE.Vector3(0, heightBase, 0));

  const meshC = new THREE.Mesh(
    new THREE.CylinderGeometry(radius1, radius2, radius2 - radius1, 32, 1)
  );
  meshC.position.setY(heightBase + (radius2 - radius1) / 2);
  const turns = 15; // Number of turns
  class CustomHelixCurve extends THREE.Curve<THREE.Vector3> {
    constructor(
      private radius: number,
      private height: number,
      private turns: number
    ) {
      super();
    }

    getPoint(t: number): THREE.Vector3 {
      const angle = 2 * Math.PI * t * this.turns; // Full circle times the number of turns
      const x = this.radius * Math.cos(angle);
      const y = this.radius * Math.sin(angle);
      const z = t * (this.height / 3); // Map t to 1/3 of the total height
      return new THREE.Vector3(x, y, z);
    }
  }

  // Creating the spring geometry
  const path = new CustomHelixCurve(radius1, heightTot, turns);
  const geometry = new THREE.TubeGeometry(path, 200, radius1 / 6, 8, false);
  const spring = new THREE.Mesh(geometry, meshMaterial);
  spring.position.setY(heightBase + (radius2 - radius1) + heightTot);
  spring.rotateX(deg90InRad);

  meshA.updateMatrix();
  meshB.updateMatrix();
  meshC.updateMatrix();
  spring.updateMatrix();
  // meshB.updateMatrix();
  // meshC.updateMatrix();
  // meshD.updateMatrix();
  // meshF.updateMatrix();
  // meshEa.updateMatrix();
  // meshEb.updateMatrix();
  // meshEc.updateMatrix();
  // meshEd.updateMatrix();

  (mesh.geometry as THREE.Geometry).merge(
    meshA.geometry as THREE.Geometry,
    meshA.matrix
  );
  (mesh.geometry as THREE.Geometry).merge(
    meshB.geometry as THREE.Geometry,
    meshB.matrix
  );
  (mesh.geometry as THREE.Geometry).merge(
    meshC.geometry as THREE.Geometry,
    meshC.matrix
  );
  (mesh.geometry as THREE.Geometry).merge(
    spring.geometry as THREE.Geometry,
    spring.matrix
  );
  // (mesh.geometry as THREE.Geometry).merge(
  //   meshD.geometry as THREE.Geometry,
  //   meshD.matrix
  // );
  // (mesh.geometry as THREE.Geometry).merge(
  //   meshF.geometry as THREE.Geometry,
  //   meshF.matrix
  // );
  // (mesh.geometry as THREE.Geometry).merge(
  //   meshEa.geometry as THREE.Geometry,
  //   meshEa.matrix
  // );
  // (mesh.geometry as THREE.Geometry).merge(
  //   meshEb.geometry as THREE.Geometry,
  //   meshEb.matrix
  // );
  // (mesh.geometry as THREE.Geometry).merge(
  //   meshEc.geometry as THREE.Geometry,
  //   meshEc.matrix
  // );
  // (mesh.geometry as THREE.Geometry).merge(
  //   meshEd.geometry as THREE.Geometry,
  //   meshEd.matrix
  // )

  mesh.scale.setScalar(el.scale);
}
export function mergeMesh(mesh: THREE.Mesh, subMesh: THREE.Mesh) {
  subMesh.updateMatrix();
  (mesh.geometry as THREE.Geometry).merge(
    subMesh.geometry as THREE.Geometry,
    subMesh.matrix
  );
}

function drawRing(el: TYPES.TProcessElement, position?: "BOTTOM" | "TOP") {
  const { height, radius } = getParameters(el);
  const ring = new THREE.Mesh(
    new THREE.CylinderGeometry(radius * 1.14, radius * 1.14, height / 10, 32)
  );
  return ring;
}
function drawNoxAbator(mesh: THREE.Mesh, el: TYPES.TProcessColumn) {
  const { height, radius } = getParameters(el);
  drawVerticalCylinder(mesh, el, height * 0.6);

  const bottomSurface = new THREE.Mesh(new THREE.Geometry());
  drawSurface(bottomSurface, el, "BOTTOM");
  bottomSurface.position.setY(-height * 0.3);

  mergeMesh(mesh, bottomSurface);

  const height1 = height * 0.4;
  const radius1 = radius * 0.28;

  const topMesh = new THREE.Mesh(
    new THREE.CylinderGeometry(radius1, radius, height1, 32, 1)
  );
  topMesh.position.setY(height * 0.3 + height1 / 2);

  mergeMesh(mesh, topMesh);

  const ring = drawRing(el);
  ring.position.setY(-height * 0.25);
  mergeMesh(mesh, ring);

  // drawLug(mesh, el, 2);

  mesh.scale.setScalar(el.scale);
}
function drawExtractor(mesh: THREE.Mesh, el: TYPES.TProcessExtractor) {
  const l = el.scale;
  const l_3 = l / 3;

  const radius =
    (el.parameters.diameter ? MMtoM(el.parameters.diameter) : l_3) / 2;
  const height = el.parameters.height ? MMtoM(el.parameters.height) : l;

  const meshA = new THREE.Mesh(
    new THREE.CylinderGeometry(radius, radius, height, 32, 1)
  );

  const meshBa = new THREE.Mesh(new THREE.CircleGeometry(radius + 0.01, 32));
  meshBa.rotateX(deg90InRad);
  const meshBb = meshBa.clone();
  meshBb.position.setY(height / 4);
  const meshBc = meshBa.clone();
  meshBc.position.setY(-height / 4);

  meshA.updateMatrix();
  meshBa.updateMatrix();
  meshBb.updateMatrix();
  meshBc.updateMatrix();

  (mesh.geometry as THREE.Geometry).merge(
    meshA.geometry as THREE.Geometry,
    meshA.matrix
  );
  (mesh.geometry as THREE.Geometry).merge(
    meshBa.geometry as THREE.Geometry,
    meshBa.matrix
  );
  (mesh.geometry as THREE.Geometry).merge(
    meshBb.geometry as THREE.Geometry,
    meshBb.matrix
  );
  (mesh.geometry as THREE.Geometry).merge(
    meshBc.geometry as THREE.Geometry,
    meshBc.matrix
  );

  mesh.scale.setScalar(el.scale);
}

function drawExpander(mesh: THREE.Mesh, el: TYPES.TProcessExpander) {
  const l = el.scale;
  const l_3 = l / 3;
  const l_6 = l_3 / 2;

  const meshA = new THREE.Mesh(
    new THREE.CylinderGeometry(l_6, l_3, l_3, 32, 1)
  );
  meshA.rotateZ(deg90InRad);

  meshA.updateMatrix();

  (mesh.geometry as THREE.Geometry).merge(
    meshA.geometry as THREE.Geometry,
    meshA.matrix
  );
}

function drawCompressor(mesh: THREE.Mesh, el: TYPES.TProcessCompressor) {
  const l = el.scale;
  const l_3 = l / 3;
  const l_6 = l_3 / 2;

  const meshA = new THREE.Mesh(
    new THREE.CylinderGeometry(l_6, l_3, l_3, 32, 1)
  );
  meshA.rotateZ(-deg90InRad);

  meshA.updateMatrix();

  (mesh.geometry as THREE.Geometry).merge(
    meshA.geometry as THREE.Geometry,
    meshA.matrix
  );
}

function drawPSV(mesh: THREE.Mesh, el: TYPES.TProcessPSV) {
  const l = el.scale;
  const l_1 = l / 10;
  const l_3 = l / 3;
  const l_6 = l_3 / 2;

  const meshA = new THREE.Mesh(new THREE.ConeGeometry(l_6, l_3, 32, 1));
  meshA.position.setY(-l_6);
  const meshB = new THREE.Mesh(new THREE.ConeGeometry(l_6, l_3, 32, 1));
  meshB.position.setX(l_6);
  meshB.rotateZ(deg90InRad);

  const curve = new THREE.CubicBezierCurve3(
    new THREE.Vector3(0, 0),
    new THREE.Vector3(-l_3, l_3 / 3),
    new THREE.Vector3(l_3, (l_3 / 3) * 2),
    new THREE.Vector3(0, l_3)
  );

  const meshCa = new THREE.Mesh(new THREE.TubeGeometry(curve, 32, 0.005, 32));
  const meshCb = meshCa.clone();
  meshCb.position.setZ(-l_1);
  const meshCc = meshCa.clone();
  meshCc.position.setZ(l_1);

  meshA.updateMatrix();
  meshB.updateMatrix();
  meshCa.updateMatrix();
  meshCb.updateMatrix();
  meshCc.updateMatrix();

  (mesh.geometry as THREE.Geometry).merge(
    meshA.geometry as THREE.Geometry,
    meshA.matrix
  );
  (mesh.geometry as THREE.Geometry).merge(
    meshB.geometry as THREE.Geometry,
    meshB.matrix
  );
  (mesh.geometry as THREE.Geometry).merge(
    meshCa.geometry as THREE.Geometry,
    meshCa.matrix
  );
  (mesh.geometry as THREE.Geometry).merge(
    meshCb.geometry as THREE.Geometry,
    meshCb.matrix
  );
  (mesh.geometry as THREE.Geometry).merge(
    meshCc.geometry as THREE.Geometry,
    meshCc.matrix
  );
}

function drawEnlarger(mesh: THREE.Mesh, el: TYPES.TProcessEnlarger) {
  const radius = el.parameters.diameter
    ? MMtoM(el.parameters.diameter) / 2
    : el.scale / 4;
  const length = el.parameters.length ? el.parameters.length : el.scale;
  const l_3 = length / 3;

  const meshA = createPipeMesh(radius / 2, 0.005, l_3);
  meshA.position.setX(-l_3 / 2);
  meshA.lookAt(new Vector3(-l_3));
  const meshB = new THREE.Mesh(
    new THREE.CylinderGeometry(radius / 2, radius, l_3, 32, 1, true)
  );
  meshB.rotateZ(deg90InRad);
  const meshC = createPipeMesh(radius, 0.005, l_3);
  meshC.position.setX(l_3 / 2);
  meshC.lookAt(new Vector3(l_3));

  meshA.updateMatrix();
  meshB.updateMatrix();
  meshC.updateMatrix();

  (mesh.geometry as THREE.Geometry).merge(
    meshA.geometry as THREE.Geometry,
    meshA.matrix
  );
  (mesh.geometry as THREE.Geometry).merge(
    meshB.geometry as THREE.Geometry,
    meshB.matrix
  );
  (mesh.geometry as THREE.Geometry).merge(
    meshC.geometry as THREE.Geometry,
    meshC.matrix
  );

  mesh.scale.setScalar(el.scale);
}

function drawPFR(mesh: THREE.Mesh, el: TYPES.TProcessPFR) {
  const radius = el.parameters.diameter
    ? MMtoM(el.parameters.diameter) / 2
    : el.scale / 4;
  const length = (el.parameters.length ?? el.scale) - radius * 2 || 0.001;

  const l_2 = length / 2;

  const meshB = new THREE.Mesh(
    new THREE.CylinderGeometry(radius, radius, length, 32, 1)
  );
  meshB.rotateZ(deg90InRad);
  const meshC = new THREE.Mesh(new THREE.SphereGeometry(radius, 32, 32));
  meshC.position.setX(-length / 2);
  const meshD = meshC.clone();
  meshD.position.setX(length / 2);

  meshB.updateMatrix();
  meshC.updateMatrix();
  meshD.updateMatrix();

  (mesh.geometry as THREE.Geometry).merge(
    meshB.geometry as THREE.Geometry,
    meshB.matrix
  );
  (mesh.geometry as THREE.Geometry).merge(
    meshC.geometry as THREE.Geometry,
    meshC.matrix
  );
  (mesh.geometry as THREE.Geometry).merge(
    meshD.geometry as THREE.Geometry,
    meshD.matrix
  );

  const delta = length / 20;
  const delta2 = delta / 8;

  const meshE = createPipeMesh(delta / 2, delta2, delta, electricMaterial);
  const meshF = meshE.clone();
  meshE.position.set(-l_2, radius, 0);
  meshE.lookAt(new THREE.Vector3(-length, radius));
  meshF.position.set(l_2, radius, 0);
  meshF.lookAt(new THREE.Vector3(length, radius));
  const sphere = new THREE.Mesh(
    new THREE.SphereGeometry(delta / 2),
    electricMaterial
  );
  meshE.add(sphere);
  meshF.add(sphere.clone());

  mesh.add(meshE, meshF);

  for (let x = -l_2; x < l_2; x += delta) {
    const v1 = new THREE.Vector3(x, radius);
    const v2 = new THREE.Vector3(x + delta2, radius, radius);
    const v3 = new THREE.Vector3(x + delta2 * 2, 0, radius);
    const v4 = new THREE.Vector3(x + delta2 * 3, -radius, radius);
    const v5 = new THREE.Vector3(x + delta2 * 4, -radius);
    const v6 = new THREE.Vector3(x + delta2 * 5, -radius, -radius);
    const v7 = new THREE.Vector3(x + delta2 * 6, 0, -radius);
    const v8 = new THREE.Vector3(x + delta2 * 7, radius, -radius);
    const v9 = new THREE.Vector3(x + delta2 * 8, radius);
    const curve1 = new THREE.QuadraticBezierCurve3(v1, v2, v3);
    const curve2 = new THREE.QuadraticBezierCurve3(v3, v4, v5);
    const curve3 = new THREE.QuadraticBezierCurve3(v5, v6, v7);
    const curve4 = new THREE.QuadraticBezierCurve3(v7, v8, v9);
    const mesh1 = new THREE.Mesh(
      new THREE.TubeGeometry(curve1, 8, delta / 2, 8)
    );
    const mesh2 = new THREE.Mesh(
      new THREE.TubeGeometry(curve2, 8, delta / 2, 8)
    );
    const mesh3 = new THREE.Mesh(
      new THREE.TubeGeometry(curve3, 8, delta / 2, 8)
    );
    const mesh4 = new THREE.Mesh(
      new THREE.TubeGeometry(curve4, 8, delta / 2, 8)
    );
    mesh1.updateMatrix();
    mesh2.updateMatrix();
    mesh3.updateMatrix();
    mesh4.updateMatrix();
    (mesh.geometry as THREE.Geometry).merge(
      mesh1.geometry as THREE.Geometry,
      mesh1.matrix
    );
    (mesh.geometry as THREE.Geometry).merge(
      mesh2.geometry as THREE.Geometry,
      mesh2.matrix
    );
    (mesh.geometry as THREE.Geometry).merge(
      mesh3.geometry as THREE.Geometry,
      mesh3.matrix
    );
    (mesh.geometry as THREE.Geometry).merge(
      mesh4.geometry as THREE.Geometry,
      mesh4.matrix
    );
  }

  mesh.scale.setScalar(el.scale);
}

function drawCSTR(mesh: THREE.Mesh, el: TYPES.TProcessCSTR) {
  const radius = el.parameters.diameter
    ? MMtoM(el.parameters.diameter) / 2
    : el.scale / 2;
  const height =
    (el.parameters.height ? MMtoM(el.parameters.height) - radius : radius) ||
    0.001;

  const r_2 = radius / 2;
  const r_4 = r_2 / 2;
  const l_1 = el.scale / 10;
  const l_10 = l_1 / 10;
  const h = ((Math.sqrt(3) / 2) * r_4) / 2;
  const delta = radius / 10;
  const delta2 = delta / 8;

  const mesh1 = createPipeMesh(radius, 0.025, height);
  mesh1.position.setY(-height / 2);
  mesh1.rotateX(-deg90InRad);
  const mesh2 = new THREE.Mesh(
    new THREE.SphereGeometry(radius, 32, 32, undefined, deg180InRad)
  );
  mesh2.position.setY(-height / 2);
  mesh2.rotateX(deg90InRad);

  const mesh7 = new THREE.Mesh(
    new THREE.CylinderGeometry(l_10, l_10, r_4, 8, 1)
  );
  const mesh8 = mesh7.clone();
  const mesh9 = mesh7.clone();
  const mesh10 = new THREE.Mesh(
    new THREE.CylinderGeometry(l_10, l_10, r_4 / 2, 8, 1)
  );
  const mesh11 = mesh10.clone();
  mesh7.position.setY(r_2 + r_4 / 2);
  mesh8.position.setY(r_2);
  mesh8.rotateZ(deg90InRad);
  mesh8.rotateX(deg30InRad);
  mesh9.position.setY(r_2);
  mesh9.rotateZ(deg90InRad);
  mesh9.rotateX(-deg30InRad);
  mesh10.position.setY(r_2);
  mesh10.position.setX(-h);
  mesh10.rotateX(deg90InRad);
  mesh11.position.setY(r_2);
  mesh11.position.setX(h);
  mesh11.rotateX(deg90InRad);

  mesh1.updateMatrix();
  mesh2.updateMatrix();
  mesh7.updateMatrix();
  mesh8.updateMatrix();
  mesh9.updateMatrix();
  mesh10.updateMatrix();
  mesh11.updateMatrix();

  (mesh.geometry as THREE.Geometry).merge(
    mesh1.geometry as THREE.Geometry,
    mesh1.matrix
  );
  (mesh.geometry as THREE.Geometry).merge(
    mesh2.geometry as THREE.Geometry,
    mesh2.matrix
  );
  (mesh.geometry as THREE.Geometry).merge(
    mesh7.geometry as THREE.Geometry,
    mesh7.matrix
  );
  (mesh.geometry as THREE.Geometry).merge(
    mesh8.geometry as THREE.Geometry,
    mesh8.matrix
  );
  (mesh.geometry as THREE.Geometry).merge(
    mesh9.geometry as THREE.Geometry,
    mesh9.matrix
  );
  (mesh.geometry as THREE.Geometry).merge(
    mesh10.geometry as THREE.Geometry,
    mesh10.matrix
  );
  (mesh.geometry as THREE.Geometry).merge(
    mesh11.geometry as THREE.Geometry,
    mesh11.matrix
  );

  const meshE = createPipeMesh(delta / 2, delta2, delta, electricMaterial);
  const meshF = meshE.clone();
  meshE.position.setZ(radius);
  meshF.position.setZ(-radius);
  meshF.rotateY(deg180InRad);

  mesh.add(meshE, meshF);

  mesh.scale.setScalar(el.scale);
}

function drawReactor(
  mesh: THREE.Mesh,
  el: TYPES.TProcessRE | TYPES.TProcessRC | TYPES.TProcessRG,
  font?: THREE.Font
) {
  const radius =
    (el.parameters.diameter ? MMtoM(el.parameters.diameter) : el.scale) / 2;
  const height =
    (el.parameters.height ? MMtoM(el.parameters.height) : el.scale) -
      radius * 2 || 0.001;

  const r_2 = radius / 2;
  const delta = radius / 10;
  const delta2 = delta / 8;

  const mesh1 = new THREE.Mesh(
    new THREE.CylinderGeometry(radius, radius, height, 32, 1)
  );
  const mesh2 = new THREE.Mesh(new THREE.SphereGeometry(radius, 32, 32));
  mesh2.position.setY(-height / 2);
  const mesh3 = mesh2.clone();
  mesh3.position.setY(height / 2);

  mesh1.updateMatrix();
  mesh2.updateMatrix();
  mesh3.updateMatrix();

  (mesh.geometry as THREE.Geometry).merge(
    mesh1.geometry as THREE.Geometry,
    mesh1.matrix
  );
  (mesh.geometry as THREE.Geometry).merge(
    mesh2.geometry as THREE.Geometry,
    mesh2.matrix
  );
  (mesh.geometry as THREE.Geometry).merge(
    mesh3.geometry as THREE.Geometry,
    mesh3.matrix
  );

  switch (el.type) {
    case TYPES.EProcessElementType.RE:
      createText(
        mesh,
        font,
        "RE",
        new THREE.Vector3(0, radius + r_2),
        -deg90InRad
      );
      break;
    case TYPES.EProcessElementType.RC:
      createText(
        mesh,
        font,
        "RC",
        new THREE.Vector3(0, radius + r_2),
        -deg90InRad
      );
      break;
    case TYPES.EProcessElementType.RG:
      createText(
        mesh,
        font,
        "RG",
        new THREE.Vector3(0, radius + r_2),
        -deg90InRad
      );
      break;
  }

  const meshE = createPipeMesh(delta / 2, delta2, delta, electricMaterial);
  const meshF = meshE.clone();
  meshE.position.setZ(radius);
  meshF.position.setZ(-radius);
  meshF.rotateY(deg180InRad);

  mesh.add(meshE, meshF);

  mesh.scale.setScalar(el.scale);
}

function drawSTHE1P(mesh: THREE.Mesh, el: TYPES.TProcessSTHE1P) {
  const radius = el.parameters.diameter
    ? MMtoM(el.parameters.diameter) / 2
    : el.scale / 4;
  const length = (el.parameters.length ?? el.scale) - radius * 2 || 0.001;

  const mesh1 = new THREE.Mesh(
    new THREE.CylinderGeometry(radius, radius, length, 32, 1)
  );
  mesh1.rotateZ(deg90InRad);
  const mesh2 = new THREE.Mesh(new THREE.SphereGeometry(radius, 32, 32));
  mesh2.position.setX(-length / 2);
  const mesh3 = new THREE.Mesh(new THREE.SphereGeometry(radius, 32, 32));
  mesh3.position.setX(length / 2);

  mesh1.updateMatrix();
  mesh2.updateMatrix();
  mesh3.updateMatrix();

  (mesh.geometry as THREE.Geometry).merge(
    mesh1.geometry as THREE.Geometry,
    mesh1.matrix
  );
  (mesh.geometry as THREE.Geometry).merge(
    mesh2.geometry as THREE.Geometry,
    mesh2.matrix
  );
  (mesh.geometry as THREE.Geometry).merge(
    mesh3.geometry as THREE.Geometry,
    mesh3.matrix
  );

  mesh.scale.setScalar(el.scale);
}
function drawAC(mesh: THREE.Mesh, el: TYPES.TProcessSTHE1P) {
  const radius = el.parameters.diameter
    ? MMtoM(el.parameters.diameter) / 2
    : el.scale / 4;
  const length = (el.parameters.length ?? el.scale) - radius * 2 || 0.001;

  const mesh1 = new THREE.Mesh(
    new THREE.CylinderGeometry(radius, radius, length, 32, 1)
  );
  mesh1.rotateZ(deg90InRad);
  const mesh2 = new THREE.Mesh(new THREE.SphereGeometry(radius, 32, 32));
  mesh2.position.setX(-length / 2);
  const mesh3 = new THREE.Mesh(new THREE.SphereGeometry(radius, 32, 32));
  mesh3.position.setX(length / 2);

  mesh1.updateMatrix();
  mesh2.updateMatrix();
  mesh3.updateMatrix();

  (mesh.geometry as THREE.Geometry).merge(
    mesh1.geometry as THREE.Geometry,
    mesh1.matrix
  );
  (mesh.geometry as THREE.Geometry).merge(
    mesh2.geometry as THREE.Geometry,
    mesh2.matrix
  );
  (mesh.geometry as THREE.Geometry).merge(
    mesh3.geometry as THREE.Geometry,
    mesh3.matrix
  );

  mesh.scale.setScalar(el.scale);
}

function drawSTHE2P(mesh: THREE.Mesh, el: TYPES.TProcessSTHE2P) {
  const radius = el.parameters.diameter
    ? MMtoM(el.parameters.diameter) / 2
    : el.scale / 4;
  const length = (el.parameters.length ?? el.scale) - radius * 2 || 0.001;

  const mesh1 = new THREE.Mesh(
    new THREE.CylinderGeometry(radius, radius, length, 32, 1)
  );
  mesh1.rotateZ(deg90InRad);
  const mesh2 = new THREE.Mesh(new THREE.SphereGeometry(radius, 32, 32));
  mesh2.position.setX(-length / 2);
  const mesh3 = new THREE.Mesh(new THREE.SphereGeometry(radius, 32, 32));
  mesh3.position.setX(length / 2);

  mesh1.updateMatrix();
  mesh2.updateMatrix();
  mesh3.updateMatrix();

  (mesh.geometry as THREE.Geometry).merge(
    mesh1.geometry as THREE.Geometry,
    mesh1.matrix
  );
  (mesh.geometry as THREE.Geometry).merge(
    mesh2.geometry as THREE.Geometry,
    mesh2.matrix
  );
  (mesh.geometry as THREE.Geometry).merge(
    mesh3.geometry as THREE.Geometry,
    mesh3.matrix
  );

  mesh.scale.setScalar(el.scale);
}

function drawHeater(mesh: THREE.Mesh, el: TYPES.TProcessHeater) {
  const radius =
    (el.parameters.diameter ? MMtoM(el.parameters.diameter) : el.scale) / 2;
  const height =
    (el.parameters.height ? MMtoM(el.parameters.height) : el.scale) -
      radius * 2 || 0.001;

  const r_2 = radius / 2;
  const r_4 = r_2 / 2;

  const l_3 = radius / 1.5;
  const delta = radius / 10;
  const delta2 = delta / 8;

  const meshA = new THREE.Mesh(
    new THREE.CylinderGeometry(radius, radius, height, 32, 1)
  );
  const meshB = new THREE.Mesh(new THREE.SphereGeometry(radius, 32, 32));
  meshB.position.setY(-height / 2);
  const meshC = meshB.clone();
  meshC.position.setY(height / 2);

  meshA.updateMatrix();
  meshB.updateMatrix();
  meshC.updateMatrix();

  (mesh.geometry as THREE.Geometry).merge(
    meshA.geometry as THREE.Geometry,
    meshA.matrix
  );
  (mesh.geometry as THREE.Geometry).merge(
    meshB.geometry as THREE.Geometry,
    meshB.matrix
  );
  (mesh.geometry as THREE.Geometry).merge(
    meshC.geometry as THREE.Geometry,
    meshC.matrix
  );

  const meshE = createPipeMesh(delta / 2, delta2, delta, electricMaterial);
  meshE.position.setZ(radius);

  mesh.add(meshE);

  const curve = new THREE.CubicBezierCurve3(
    new THREE.Vector3(0),
    new THREE.Vector3(-l_3, l_3 / 3),
    new THREE.Vector3(l_3, (l_3 / 3) * 2),
    new THREE.Vector3(0, l_3)
  );

  for (let i = 0; i < 8; i++) {
    const angle = deg45InRad * i;
    const meshF = new THREE.Mesh(
      new THREE.TubeGeometry(curve, 32, 0.005, 32),
      electricMaterial
    );
    meshF.scale.divideScalar(2);
    meshF.position
      .set(r_4, -height / 2 - radius - l_3 / 2, 0)
      .applyAxisAngle(new THREE.Vector3(0, 1), angle);
    meshF.rotateY(angle);
    mesh.add(meshF);
  }

  mesh.scale.setScalar(el.scale);
}

function drawCooler(mesh: THREE.Mesh, el: TYPES.TProcessCooler) {
  const radius =
    (el.parameters.diameter ? MMtoM(el.parameters.diameter) : el.scale) / 2;
  const height =
    (el.parameters.height ? MMtoM(el.parameters.height) : el.scale) -
      radius * 2 || 0.001;

  const r_2 = radius / 2;
  const r_4 = r_2 / 2;

  const l_3 = radius / 1.5;
  const delta = radius / 10;
  const delta2 = delta / 8;

  const meshA = new THREE.Mesh(
    new THREE.CylinderGeometry(radius, radius, height, 32, 1)
  );
  const meshB = new THREE.Mesh(new THREE.SphereGeometry(radius, 32, 32));
  meshB.position.setY(-height / 2);
  const meshC = meshB.clone();
  meshC.position.setY(height / 2);

  meshA.updateMatrix();
  meshB.updateMatrix();
  meshC.updateMatrix();

  (mesh.geometry as THREE.Geometry).merge(
    meshA.geometry as THREE.Geometry,
    meshA.matrix
  );
  (mesh.geometry as THREE.Geometry).merge(
    meshB.geometry as THREE.Geometry,
    meshB.matrix
  );
  (mesh.geometry as THREE.Geometry).merge(
    meshC.geometry as THREE.Geometry,
    meshC.matrix
  );

  const meshE = createPipeMesh(delta / 2, delta2, delta, electricMaterial);
  meshE.position.setZ(radius);

  mesh.add(meshE);

  const curve = new THREE.CubicBezierCurve3(
    new THREE.Vector3(0),
    new THREE.Vector3(-l_3, l_3 / 3),
    new THREE.Vector3(l_3, (l_3 / 3) * 2),
    new THREE.Vector3(0, l_3)
  );

  for (let i = 1; i <= 3; i++) {
    const z = -r_2 + r_4 * i;
    for (let j = 1; j <= 3; j++) {
      const meshF = new THREE.Mesh(
        new THREE.TubeGeometry(curve, 32, 0.005, 32)
      );
      meshF.scale.divideScalar(2);
      meshF.position.set(-r_2 + r_4 * j, height / 2 + radius, z);
      meshF.updateMatrix();
      (mesh.geometry as THREE.Geometry).merge(
        meshF.geometry as THREE.Geometry,
        meshF.matrix
      );
    }
  }

  mesh.scale.setScalar(el.scale);
}

function drawAbsorptionColumn(
  mesh: THREE.Mesh,
  el: TYPES.TProcessAbsorptionColumn
) {
  const radius = el.parameters.diameter
    ? MMtoM(el.parameters.diameter) / 2
    : el.scale / 4;
  const height =
    (el.parameters.height ? MMtoM(el.parameters.height) : el.scale) -
      radius * 2 || 0.001;

  const meshA = new THREE.Mesh(
    new THREE.CylinderGeometry(radius, radius, height, 32, 1)
  );
  const meshB = new THREE.Mesh(new THREE.SphereGeometry(radius, 32, 32));
  meshB.position.setY(-height / 2);
  const meshC = meshB.clone();
  meshC.position.setY(height / 2);

  meshA.updateMatrix();
  meshB.updateMatrix();
  meshC.updateMatrix();

  (mesh.geometry as THREE.Geometry).merge(
    meshA.geometry as THREE.Geometry,
    meshA.matrix
  );
  (mesh.geometry as THREE.Geometry).merge(
    meshB.geometry as THREE.Geometry,
    meshB.matrix
  );
  (mesh.geometry as THREE.Geometry).merge(
    meshC.geometry as THREE.Geometry,
    meshC.matrix
  );

  const line = createBoldLine(
    new THREE.Vector3(0, -height / 2 - radius - 0.05),
    new THREE.Vector3(0, height / 2 + radius + 0.05)
  );
  if (line) {
    line.updateMatrix();
    (mesh.geometry as THREE.Geometry).merge(
      (line as THREE.Mesh).geometry as THREE.Geometry,
      line.matrix
    );
  }

  mesh.scale.setScalar(el.scale);
}

function drawSimpleColumn(
  mesh: THREE.Mesh,
  el: TYPES.TProcessAbsorptionColumn
) {
  const radius = el.parameters.diameter
    ? MMtoM(el.parameters.diameter) / 2
    : el.scale / 4;
  const height =
    (el.parameters.height ? MMtoM(el.parameters.height) : el.scale) -
      radius * 2 || 0.001;

  const l_4 = height / 2;

  const meshA = new THREE.Mesh(
    new THREE.CylinderGeometry(radius, radius, height, 32, 1)
  );
  const meshB = new THREE.Mesh(new THREE.SphereGeometry(radius, 32, 32));
  meshB.position.setY(-l_4);
  const meshC = meshB.clone();
  meshC.position.setY(l_4);

  meshA.updateMatrix();
  meshB.updateMatrix();
  meshC.updateMatrix();

  (mesh.geometry as THREE.Geometry).merge(
    meshA.geometry as THREE.Geometry,
    meshA.matrix
  );
  (mesh.geometry as THREE.Geometry).merge(
    meshB.geometry as THREE.Geometry,
    meshB.matrix
  );
  (mesh.geometry as THREE.Geometry).merge(
    meshC.geometry as THREE.Geometry,
    meshC.matrix
  );

  mesh.scale.setScalar(el.scale);
}

function drawElementConnections(
  mesh: THREE.Mesh,
  el: TYPES.TProcessElement,
  selected?: TYPES.TProcessElement,
  selectedPoint?: TYPES.TProcessElementPoint,
  selectedNozzle?: TYPES.TProcessSelectedNozzle
) {
  const isSelected = selected?.name === el.name;
  const pID = selectedPoint?.id;
  const nID = selectedNozzle?.point?.id;
  for (const point of el.points) {
    const radius =
      MMtoM(point.profile?.outside_diameter_global ?? point.od_MM ?? 0) / 2;
    const thickness = MMtoM(
      point.profile?.wall_thickness_global ?? point.wt_MM ?? 0
    );
    if (point.profile || (radius && thickness)) {
      const distance = point.startPosition.distanceTo(point.generalPosition);

      const pipeGroup = new THREE.Group();
      const pipe = createPipeMesh(
        radius,
        thickness,
        distance,
        nID === point.id ? selectedMeshMaterial : pipeMaterial
      );
      pipe.rotateY(deg90InRad);
      pipe.userData = { el, point, isProcessNozzle: true };
      pipeGroup.add(pipe);
      pipeGroup.position.copy(point.startPosition);
      pipeGroup.lookAt(point.generalPosition);
      pipeGroup.rotateY(-deg90InRad);

      if (point.profile && point.flangeType && point.flange) {
        const flange = createFlange(
          point.flangeType,
          point.flange,
          point.profile.outside_diameter_global,
          1,
          nID === point.id ? getRGB(supColorRGB) : getRGB(pipeColorRGB)
        );
        if (point.flangeType === "Blind") {
          flange.rotateY(deg180InRad);
          flange.position.setX(distance + MMtoM(point.flange.y ?? 0) / 2);
        } else {
          flange.position.setX(distance - MMtoM(point.flange.y ?? 0));
        }
        pipeGroup.add(flange);
      }
      mesh.add(pipeGroup);
    } else {
      const line = createBoldLine(point.startPosition, point.generalPosition);
      line && mesh.add(line);
    }
    if (isSelected) {
      if (pID === point.id) {
        mesh.add(drawSelectedPoint(point.generalPosition));
      } else {
        if (point.connectionType === "END")
          mesh.add(drawPoint(el, point.id, point.generalPosition));
        else mesh.add(drawConnectPoint(el, point));
      }
    } else if (
      selected &&
      selectedPoint &&
      !point.element &&
      point.connectionType !== "START"
    ) {
      mesh.add(drawConnectPoint(el, point));
    }
  }
}

export {
  dropProcess,
  convertProcessToImporting,
  fixImportedProcess,
  drawProcess,
  updatePipes,
  updateCables,
  updateProcessLines,
};
