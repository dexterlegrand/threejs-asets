import React, {
  FunctionComponent,
  useState,
  useEffect,
  useRef,
  useMemo,
} from "react";
import { useRecoilState, useSetRecoilState } from "recoil";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import { DragControls } from "three/examples/jsm/controls/DragControls";
import { useDispatch, useSelector } from "react-redux";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { IconProp } from "@fortawesome/fontawesome-svg-core";
import { ApplicationState } from "../../store";
import { faHome } from "@fortawesome/free-solid-svg-icons";
import {
  AmbientLight,
  GridHelper,
  Mesh,
  PCFSoftShadowMap,
  WebGLRenderer,
  Scene,
  Camera,
  Object3D,
  BoxBufferGeometry,
  Color,
  Group,
  MeshBasicMaterial,
  DirectionalLight,
  Vector3,
  Event,
  Clock,
  SphereGeometry,
  Box3,
  CompressedPixelFormat,
  TextGeometry,
} from "three";
import {
  ModelItem,
  TSelectedPipe,
  TSelectedPipeSupport,
  TSelectedPipeConnector,
  TWorkMode,
  TSelectedPlatform,
  TCustomGrid,
} from "../../store/main/types";
import { getAxisHelper, getSimpleAxisHelper } from "../3d-models/axisHelper";
import {
  roundM,
  getCurrentPSS,
  checkRange,
  getMiddleVector3,
  localToGlobal,
  fixVectorByOrientation,
  getOrientationByDirection,
  MMtoM,
  getCurrentUI,
  vector3FromPoint,
} from "../3d-models/utils";
import { Searcher } from "./Searcher";
import {
  drawUserDefinedGrids,
  changeTargetOfRotation,
  getObjectOnScreen,
  hoverObjectOnScreen,
  getMouseScreenPosition,
  checkCtrlShiftS,
  removeElementFromScene,
  resizeScene,
  animatePSS,
  handleDragOver,
  handleDrop,
  updateAxesHelperParams,
  getPointOnScreen,
  createCircleDropZone,
  getDropPosition,
  getDistanceBetweenDropZones,
  createValvesDropZones,
  createDimensionAnchors,
  getIntersects,
  getNewPointOnScreen,
  getNearestDistance,
  createDistanceInfo,
  createReferenceLine,
  createSnappingPoint,
  createDropZoneAxises,
} from "./workFieldUtils/sceneUtils";
import {
  selectProcessElementAction,
  selectProcessLineAction,
  selectInstrElementAction,
  relocateProcessElementAction,
  changeInstrElementAction,
  selectInstrLineAction,
  selectProcessElementNozzleAction,
  changeProcessElementAction,
  selectConnectionPointAction,
  selectProcessElementNozzlePointAction,
} from "../../store/process/actions";
import { drawProcess, globalEvents } from "../3d-models/process/process";
import {
  TProcessElement,
  TProcessLine,
  EPipeElementType,
  EConnectionElementType,
} from "../../store/process/types";
import { createConveyors } from "../3d-models/pss/modeling";
import { PipeSearcher } from "./PipeSearcher";
import { AdvancedSearcher } from "./AdvancedSearcher";
import { BeamSearcher } from "./BeamSearcher";
import {
  setCameraAction,
  setControlsAction,
  setRendererAction,
} from "../../store/scene/actions";
import {
  unselectHovered,
  unselectFreePipes,
  selectFreePipe,
  selectModelItem,
  selectModelItems,
  selectFreePipeSupport,
  selectPipeConnector,
  selectModelPlatform,
} from "../../store/selections/actions";
import { DataState } from "../../store/data/types";
import { getCamera } from "./workFieldUtils/cameraUtils";
import { enableControls } from "./workFieldUtils/controlsUtils";
import { mousePipeCreating } from "../../recoil/atoms/process-atoms";
import { handleClickBySceneForProcess } from "../../services/process-services/mouse-pipe-creating-service";
import { SnapInput } from "../common/SnapInput";
import { snapPosition } from "../../recoil/atoms/snap-atom";
import { Vector2 } from "three";
import { beamConnections } from "../../recoil/atoms/beam-connections-atom";
import { changeModel } from "../../store/main/actions";
import OFCreationAtom from "../../recoil/atoms/of-creation-atom";
import { handleDefineDataForCreationElements } from "../../services/of-services/elements-creation-service";
import { TOpenFrame } from "../../store/main/openFrameTypes";
import { CustomDlg } from "../common/CustomDlg";
import { Button } from "@blueprintjs/core";
import { post } from "superagent";
import { isElementAccessExpression } from "typescript";

type Props = {
  workMode: TWorkMode;
  data: DataState;
};

let animationFrame: number | undefined = undefined;
let drag_controls: DragControls | undefined = undefined;
let mouseDown = false;
let coordsId: any = undefined;

const clock = new Clock();
let coords: any;
const WorkField: FunctionComponent<Props> = ({ workMode, data }) => {
  const [dlg, setDlg] = useState<JSX.Element>();

  const threeD_scene = useSelector(
    (state: ApplicationState) => state.main.scene
  );
  const threeD_camera = useSelector(
    (state: ApplicationState) => state.scene.camera
  );
  const threeD_controls = useSelector(
    (state: ApplicationState) => state.scene.controls
  );
  const threeD_renderer = useSelector(
    (state: ApplicationState) => state.scene.renderer
  );
  const openFrameUI = useSelector(
    (state: ApplicationState) => getCurrentUI(state)?.openFrameUI
  );
  const currentProject = useSelector(
    (state: ApplicationState) => state.main.currentProject
  );
  const projects = useSelector(
    (state: ApplicationState) => state.main.projects
  );

  const process = useSelector((state: ApplicationState) => state.process);
  const pss = useSelector((state: ApplicationState) => getCurrentPSS(state));
  const pssAnimation = useSelector(
    (state: ApplicationState) => state.pss.animate
  );
  const font = useSelector((state: ApplicationState) => state.data.font);
  const clashes = useSelector((state: ApplicationState) => state.main.clashes);
  const selectedBeams = useSelector(
    (state: ApplicationState) => state.selections.selectedItems
  );

  const [MPCState, setMPCState] = useRecoilState(mousePipeCreating);
  const [OFCreationState, setOFCreationState] = useRecoilState(OFCreationAtom);
  const [BCS, setBCS] = useRecoilState(beamConnections);
  const setSnap = useSetRecoilState(snapPosition);

  const dispatch = useDispatch();

  const project = useMemo(() => {
    return projects.find((project) => project.name === currentProject);
  }, [currentProject, projects]);

  const neProjects = useMemo(() => {
    return project?.notEditableProjects ?? [];
  }, [project]);

  const neProcesses = useMemo(() => {
    return project?.notEditableProcesses ?? [];
  }, [project]);

  const displaySettings = useMemo(() => {
    return project?.settings.display;
  }, [project]);

  const modelSettings = useMemo(() => {
    return project?.settings.models;
  }, [project]);

  const cameraSettings = useMemo(() => {
    return project?.settings.camera;
  }, [project]);

  const gridSettings = useMemo(() => {
    return project?.settings.grid;
  }, [project]);

  const isDimension = useMemo(() => {
    return MPCState.processPipeElement === EPipeElementType.DIMENSION;
  }, [MPCState.processPipeElement]);

  const isProcessPipe = useMemo(() => {
    return MPCState.processPipeElement === EPipeElementType.PIPE;
  }, [MPCState.processPipeElement]);

  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!clashes || !clashes.length) return;
    if (project?.mode !== "clashes") return;
    const group = new Group();
    group.name = "CLASHES";
    const mesh = new Mesh(
      new SphereGeometry(0.5),
      new MeshBasicMaterial({ color: "red", transparent: true, opacity: 0.5 })
    );
    for (const clash of clashes) {
      if (clash.ignore) continue;
      const clashMesh = mesh.clone();
      clashMesh.position.copy(clash.pos);
      group.add(clashMesh);
    }
    threeD_scene.add(group);
    return () => {
      removeElementFromScene(threeD_scene, "CLASHES");
    };
  }, [clashes, project]);

  /*useEffect(() => {
    console.log("PROJECT", project);
    console.log("threeD_scene", threeD_scene);
  }, [project, threeD_scene]);*/

  function convertWorldPositionToScreen(
    worldPosition: Vector3,
    camera: Camera,
    renderer: WebGLRenderer
  ): Vector2 {
    const positionScreen = worldPosition.clone().project(camera);
    return new Vector2(
      Math.round(
        ((positionScreen.x + 1) * renderer.domElement.clientWidth) / 2
      ),
      Math.round(
        ((-positionScreen.y + 1) * renderer.domElement.clientHeight) / 2
      )
    );
  }

  function updateVisualFeedback(
    worldPosition: Vector3,
    point: Vector3,
    realPos: Vector3,
    axe?: string,
    object?: any
  ) {
    if (object.isModelItem) {
      const data = object;
      const model = project?.models.find((m) => m.name === data.model);
      if (model) {
        const center = vector3FromPoint(data.start)
          .clone()
          .add(vector3FromPoint(data.end))
          .divideScalar(2);
        center.add(worldPosition);
        center.add(vector3FromPoint(model.startPos));
        worldPosition.copy(center);
      }
    }
    if (coords) {
      threeD_scene.remove(coords);
      coords = null;
    }

    // removeElementFromScene(threeD_scene, "COORDS");
    if (!threeD_controls || !font) return;

    coords = new Group();
    const textMesh = createDistanceInfo(
      worldPosition,
      font,
      point.distanceTo(realPos),
      worldPosition.y - realPos.y,
      point.x === realPos.x
    );
    textMesh.quaternion.copy(threeD_controls.object.quaternion);
    textMesh.scale.multiplyScalar(3);
    textMesh.name = "COORDS-DISTANCE_INFO";

    const referenceMesh1 = createReferenceLine(point, realPos, axe);
    const referenceMesh2 = createReferenceLine(
      realPos,
      realPos.clone().setY(worldPosition.y + object?.snappingPoint?.y ?? 0),
      "Y"
    );
    coords.add(referenceMesh1);
    coords.add(referenceMesh2);
    coords.add(textMesh);

    if (object) {
      if (!(MPCState?.processPipeElement === EConnectionElementType.NOZZLE)) {
        const axes = createDropZoneAxises(worldPosition, font);
        coords.add(axes);
      }
      const helper = getSimpleAxisHelper(
        (MMtoM(object.parameters?.height) || object.parameters?.length || 1) * 2
      );
      helper.position.copy(worldPosition);
      const snappingAxe = createSnappingPoint(
        worldPosition
          .clone()
          .setY(worldPosition.y + object?.snappingPoint?.y ?? 0),
        font
      );

      coords.add(snappingAxe);
      coords.add(helper);
    }

    threeD_scene.add(coords);
  }

  function handleObjectUpdate(
    event: Event,
    realPos: Vector3,
    point: Vector3,
    axe: string,
    valx: number,
    valy: number = 0,
    valz: number = 0
  ) {
    realPos = vector3FromPoint(realPos);
    point = vector3FromPoint(point);
    const draggedObject = event.object;
    const newPos = point.clone();

    // Calculate new position based on the axe
    // if (axe === "Z") {
    newPos.x += valx;
    // } else if (axe === "X") {
    newPos.z += valz;
    // }
    console.log(valy, newPos.y);

    const isSnapping = !realPos.equals(point);
    if (isSnapping) {
      newPos.y -= draggedObject.userData?.snappingPoint?.y ?? 0;
      newPos.y += valy;
      console.log(valy, newPos.y);
    }
    // Handle specific object types
    if (
      draggedObject.userData.isProcessItem ||
      draggedObject.userData.isProcessSubItem
    ) {
      const data = draggedObject.userData.isProcessSubItem
        ? draggedObject.parent.userData
        : draggedObject.userData;
      const processElement = {
        ...data,
        position: {
          x: roundM(newPos.x),
          y: roundM(newPos.y),
          z: roundM(newPos.z),
        },
      };
      // Assuming dispatch is a function to dispatch actions in a Redux-like state management system
      dispatch(relocateProcessElementAction(currentProject, processElement));
    } else if (draggedObject.userData.isInstrumentationElement) {
      const parent = draggedObject.parent;
      const instrElement = {
        ...draggedObject.userData.instr,
        x: roundM(newPos.x + (parent ? parent.position.x : 0)),
        y: roundM(newPos.y + (parent ? parent.position.y : 0)),
        z: roundM(newPos.z + (parent ? parent.position.z : 0)),
      };
      dispatch(changeInstrElementAction(currentProject, instrElement));
    }
    // else if (draggedObject.userData.isModelItem) {
    //   const data = draggedObject.userData;
    //   const model = project?.models.find((m) => m.name === data.model);
    //   if (model) {
    //     const center = vector3FromPoint(data.start)
    //       .clone()
    //       .add(vector3FromPoint(data.end))
    //       .divideScalar(2);
    //     center.sub(vector3FromPoint(model.startPos));
    //     const angle = getOrientationByDirection(data.modelDir);
    //     const offset = fixVectorByOrientation(
    //       new Vector3(),
    //       newPos.clone().sub(center),
    //       angle
    //     );
    //     const updatedModel = {
    //       ...model,
    //       startPos: new Vector3(
    //         roundM(model.startPos.x + offset.x),
    //         roundM(model.startPos.y + offset.y),
    //         roundM(model.startPos.z + offset.z)
    //       ),
    //     };
    //     dispatch(changeModel(updatedModel));
    //   }
    // }

    updateVisualFeedback(newPos, point, newPos, axe, draggedObject.userData);
    coords.userData.dropped = true;
  }

  function processEvent(event: Event, isRelocate: boolean = false) {
    const worldPosition = new Vector3();
    const movedObject = event.object;
    movedObject.getWorldPosition(worldPosition);
    let draggedObject = movedObject;
    while (draggedObject.name === "") {
      draggedObject = draggedObject.parent;
      if (!draggedObject.parent) break;
    }
    console.log("draggedObject", draggedObject);

    const { dis, point, axe, realPos } = getNearestDistance(
      worldPosition.clone(),
      gridSettings?.customs ?? []
    );

    const canvas = threeD_renderer?.domElement;
    const width = canvas?.clientWidth; // Use clientWidth for CSS size
    const height = canvas?.clientHeight; // Use clientHeight for CSS size

    const positionScreen = convertWorldPositionToScreen(
      worldPosition,
      threeD_camera ?? new Camera(),
      threeD_renderer ?? new WebGLRenderer()
    );
    // Clamp the screen position to ensure it does not exceed the screen size
    positionScreen.x = Math.max(
      0,
      Math.min(positionScreen.x, width ? width - 300 : Number.POSITIVE_INFINITY)
    );
    positionScreen.y = Math.max(
      0,
      Math.min(
        positionScreen.y,
        height ? height - 300 : Number.POSITIVE_INFINITY
      )
    );
    if (isRelocate) {
      setSnap({
        from: point,
        current: new Vector3(realPos.x, worldPosition.y, realPos.z),
        isString: true,
        position: new Vector2(positionScreen.x, positionScreen.y),
        callback: (valX: number, valY?: number, valZ?: number) => {
          handleObjectUpdate(event, realPos, point, axe, valX, valY, valZ);
        },
      });
    }

    updateVisualFeedback(
      worldPosition,
      point,
      realPos,
      axe,
      draggedObject.userData
    );
    if (isRelocate) {
      threeD_controls && enableControls(threeD_controls, true);
    }
  }

  // Refactored functions
  function onDragProcess(event: Event) {
    processEvent(event, false);
  }

  function relocateElement(event: Event) {
    processEvent(event, true);
  }

  useEffect(() => {
    if (
      !project ||
      !threeD_camera ||
      !threeD_renderer ||
      !threeD_controls ||
      (!(
        workMode === "PROCESS" ||
        workMode === "DESIGNER" ||
        workMode === "PRODESIGNER" ||
        workMode === "PIPDESIGNER" ||
        workMode === "STRDESIGNER"
      ) && //Trial modes
        !modelSettings?.processInPiping)
    )
      return;
    const p = process.processes?.get(project.name);
    if (!p) return;
    if (coords) {
      threeD_scene.remove(coords);
      coords = null;
    }

    const processGroup = drawProcess(
      project,
      workMode,
      p,
      process,
      data,
      isProcessPipe,
      false,
      font,
      MPCState
      // () => threeD_renderer.render()
    );
    const elements: Object3D[] = [];
    for (const pc of processGroup.children) {
      if (pc.userData.isProcessItem) {
        elements.push(pc);
      } else {
        const ch = pc.children.find(
          (ch) => ch.userData.isIntrumentationElement
        );
        if (ch) elements.push(ch);
      }
    }
    threeD_scene.add(processGroup);
    return () => {
      removeElementFromScene(threeD_scene, processGroup.name);
    };
  }, [
    workMode,
    modelSettings,
    process,
    project,
    threeD_camera,
    threeD_renderer,
    data,
    isProcessPipe,
  ]);

  useEffect(() => {
    if (!neProjects?.length) return;
    const group = new Group();
    group.name = "NEP";
    neProjects.forEach((item) => {
      if ((item as any).geometry) group.add((item as any).geometry);
    });
    threeD_scene.add(group);
    return () => {
      removeElementFromScene(threeD_scene, "NEP");
    };
  }, [neProjects]);

  useEffect(() => {
    if (!isDimension) return;
    const meshes = createDimensionAnchors(project, process);
    threeD_scene.add(...meshes);
    return () => {
      threeD_scene.remove(...meshes);
    };
  }, [project, process, isDimension]);

  useEffect(() => {
    if (!project || !neProcesses.length) return;
    const group = new Group();
    group.name = "NEPS";
    for (const nep of neProcesses) {
      group.add(
        drawProcess(
          project,
          workMode,
          nep.process,
          process,
          data,
          false,
          false,
          font,
          MPCState
        )
      );
    }
    threeD_scene.add(group);
    return () => {
      removeElementFromScene(threeD_scene, "NEPS");
    };
  }, [project, neProcesses, process]);

  useEffect(() => {
    if (!pss) return;
    const pssModels = createConveyors(pss);
    threeD_scene.add(pssModels);
    return () => {
      removeElementFromScene(threeD_scene, pssModels.name);
    };
  }, [pss]);

  useEffect(() => {
    if (pssAnimation) {
      clock.start();
    } else clock.stop();
  }, [pssAnimation]);

  useEffect(() => {
    if (!canvasRef.current) return;
    dispatch(
      setRendererAction(
        new WebGLRenderer({
          canvas: canvasRef.current,
          antialias: true,
          preserveDrawingBuffer: true,
        })
      )
    );
  }, [canvasRef]);

  useEffect(() => {
    const camera = getCamera(threeD_camera, cameraSettings);
    dispatch(setCameraAction(camera));
  }, [cameraSettings?.cameraType]);

  useEffect(() => {
    if (!gridSettings) return;
    drawUserDefinedGrids(threeD_scene, gridSettings.customs ?? [], dispatch);
    if (gridSettings.display) {
      const divisions = 2 * gridSettings.count;
      const gridHelper = new GridHelper(
        gridSettings.spacing * divisions,
        divisions
      );
      gridHelper.name = "GridHelper";
      threeD_scene.add(gridHelper);
    }
    return () => {
      removeElementFromScene(threeD_scene, "GridHelper");
      removeElementFromScene(threeD_scene, "UDG");
    };
  }, [threeD_scene, gridSettings]);

  useEffect(() => {
    if (!threeD_scene) return;

    const light = new DirectionalLight(0xffffff);
    light.position.set(0, 500, 0);
    light.name = "Light";
    light.castShadow = true;
    light.intensity = 0.6;

    const light2 = new AmbientLight(0xffffff);
    light2.name = "Light2";
    light2.intensity = 0.4;

    threeD_scene.add(light, light2);

    const size = 0.1;
    const axesBox = new Mesh(
      new BoxBufferGeometry(size, size, size, 1, 1, 1),
      new MeshBasicMaterial({ color: 0x4b4b4b })
    );
    getAxisHelper(0.15, axesBox, size);
    axesBox.name = "AxesBoxHelper";
    const axesBoxArea = new Group();
    axesBoxArea.add(axesBox);

    threeD_scene.add(axesBoxArea);
    threeD_scene.background = new Color(0xc8c8c8);
    return () => {
      threeD_scene.remove(...threeD_scene.children);
    };
  }, [threeD_scene]);

  useEffect(() => {
    if (!threeD_renderer) return;
    threeD_renderer.setSize(window.innerWidth, window.innerHeight);
    threeD_renderer.shadowMap.enabled = true;
    threeD_renderer.shadowMap.type = PCFSoftShadowMap;
  }, [threeD_renderer]);

  useEffect(() => {
    if (!threeD_camera || !threeD_renderer) return;
    dispatch(
      setControlsAction(
        new OrbitControls(threeD_camera, threeD_renderer.domElement)
      )
    );
  }, [threeD_camera, threeD_renderer]);

  useEffect(() => {
    if (!threeD_renderer || !threeD_controls) return;
    globalEvents.addEventListener("stl-loaded", function(event) {
      console.log("stl loaded");
      animate3DPage(threeD_scene, threeD_controls);
      // threeD_renderer.render(threeD_scene, threeD_controls.object);
    });
    animate3DPage(threeD_scene, threeD_controls);
    return () => {
      globalEvents.removeEventListener("stl-loaded", () => {});
      animationFrame && cancelAnimationFrame(animationFrame);
    };
  }, [threeD_renderer, threeD_controls]);
  const resoures = useSelector((state: ApplicationState) => state.data);

  useEffect(() => {
    if (!threeD_scene || !threeD_camera) return;
    const takeElementFn = (event: any) => {
      event.preventDefault();
      if (!event.ctrlKey) return;
      takeElement(event, threeD_camera, threeD_scene, canvasRef.current);
    };
    canvasRef.current?.addEventListener("click", takeElementFn, false);

    const mouseDownFn = (event: any) => {
      event.preventDefault();
      adjustCameraToFit(event, threeD_camera, threeD_scene, canvasRef.current);
      if (!(event.ctrlKey && event.shiftKey)) return;
      clickScene(
        event,
        threeD_camera,
        threeD_scene,
        resoures,
        canvasRef.current,
        threeD_controls
      );
    };
    canvasRef.current?.addEventListener("mousedown", mouseDownFn, false);

    const selectElementFn = (event: any) => {
      event.preventDefault();
      selectElement(
        event,
        threeD_camera,
        threeD_scene,
        canvasRef.current,
        threeD_controls
      );
    };
    canvasRef.current?.addEventListener("dblclick", selectElementFn, false);

    return () => {
      canvasRef.current?.removeEventListener("click", takeElementFn, false);
      canvasRef.current?.removeEventListener("mousedown", mouseDownFn, false);
      canvasRef.current?.removeEventListener(
        "dblclick",
        selectElementFn,
        false
      );
    };
  }, [
    process,
    threeD_scene,
    threeD_camera,
    threeD_controls,
    MPCState,
    OFCreationState,
    BCS,
    project?.freePipes,
    /*project?.freeCables,*/
    project?.models,
    cameraSettings,
  ]);

  useEffect(() => {
    window.addEventListener("mousedown", handleMouseDown);
    window.addEventListener("mouseup", handleMouseUp);
    window.addEventListener("keydown", activateDragControls);
    window.addEventListener("keyup", deactivateDragControls);
    return () => {
      window.removeEventListener("keydown", activateDragControls);
      window.removeEventListener("keyup", deactivateDragControls);
      window.removeEventListener("mousedown", handleMouseDown);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, []);

  useEffect(() => {
    window.addEventListener("keypress", searchOnScene);
    return () => {
      window.removeEventListener("keypress", searchOnScene);
    };
  }, [project, threeD_camera, threeD_controls]);

  useEffect(() => {
    window.addEventListener("mousemove", handleMouseMove);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
    };
  }, [
    threeD_scene,
    threeD_controls,
    displaySettings,
    font,
    MPCState.startPointPipeSegment,
    MPCState.dimensionPoint,
  ]);

  useEffect(() => {
    if (
      !MPCState.startPointPipeSegment ||
      (MPCState.processPipeElement !== EConnectionElementType.NOZZLE &&
        MPCState.processPipeElement !== EPipeElementType.PIPE) ||
      !font
    )
      return;
    const dropZone = createCircleDropZone(MPCState.startPointPipeSegment, font);
    threeD_scene.add(dropZone);
    return () => {
      threeD_scene.remove(dropZone);
    };
  }, [
    threeD_scene,
    MPCState.startPointPipeSegment,
    MPCState.processPipeElement,
    font,
  ]);

  useEffect(() => {
    if (MPCState.processPipeElement !== EPipeElementType.VALVE) return;
    const anchor = createValvesDropZones(
      threeD_scene,
      process.processes.get(currentProject),
      project?.freePipes
    );
    anchor && threeD_scene.add(anchor);
    return () => {
      anchor && threeD_scene.remove(anchor);
    };
  }, [
    threeD_scene,
    process,
    currentProject,
    project?.freePipes,
    /*project?.freeCables,*/
    MPCState.processPipeElement,
  ]);

  useEffect(() => {
    if (!threeD_camera || !threeD_renderer || !threeD_controls) return;
    const elements: Object3D[] = [];
    if (process.selected) {
      const obj = threeD_scene.getObjectByName(process.selected.name);
      obj &&
        obj.userData &&
        Object.keys(obj.userData).length > 0 &&
        elements.push(obj);
    }
    if (process.selectedInstr) {
      const obj = threeD_scene.getObjectByName(process.selectedInstr.name);
      obj && elements.push(obj);
    }
    if (selectedBeams) {
      for (const beam of selectedBeams) {
        const obj = threeD_scene
          .getObjectByName(beam.model)
          ?.getObjectByName(beam.name);
        obj && elements.push(obj);
      }
    }
    if (!elements.length) return;
    console.log(elements);
    drag_controls = new DragControls(
      elements,
      threeD_camera,
      threeD_renderer.domElement
    );
    drag_controls?.deactivate();
    drag_controls.addEventListener("dragstart", () => {
      enableControls(threeD_controls, false);
    });
    function debounce<T extends (...args: any[]) => void>(
      func: T,
      wait: number
    ): (...args: Parameters<T>) => void {
      let timeout: ReturnType<typeof setTimeout> | null = null;
      return (...args: Parameters<T>): void => {
        const later = () => {
          timeout = null;
          func(...args);
        };

        if (timeout !== null) {
          clearTimeout(timeout);
        }

        timeout = setTimeout(later, wait);
      };
    }

    // Assuming onDragProcess is your event handler
    const debouncedOnDragProcess = debounce((event) => {
      onDragProcess(event);
    }, 50);

    drag_controls.addEventListener("drag", debouncedOnDragProcess);
    drag_controls.addEventListener("dragend", (event) => {
      relocateElement(event);
    });
    return () => {
      drag_controls?.dispose();
    };
  }, [threeD_camera, threeD_renderer, threeD_controls, process, selectedBeams]);

  function handleMouseDown() {
    mouseDown = true;
    dispatch(unselectHovered());
  }

  function handleMouseUp() {
    mouseDown = false;
  }

  function handleMouseMove(event: any) {
    clearTimeout(coordsId);
    removeElementFromScene(threeD_scene, "COORDS");
    removeElementFromScene(threeD_scene, "REFERENCE-HELPER");
    removeElementFromScene(threeD_scene, "DISTANCE-HELPER");
    if (!threeD_controls || mouseDown) return;
    if (event.target.id === "scene") {
      const position = getMouseScreenPosition(event);
      coordsId = setTimeout(() => {
        getDropPosition(
          position,
          threeD_controls,
          threeD_scene,
          font,
          MPCState.startPointPipeSegment
        );
        getDistanceBetweenDropZones(
          position,
          threeD_controls,
          threeD_scene,
          MPCState.dimensionPoint,
          font
        );
      }, 33);
      if (!displaySettings?.hoverEffects) return;
      hoverObjectOnScreen(
        dispatch,
        position,
        threeD_controls.object,
        threeD_scene
      );
    } else dispatch(unselectHovered());
  }

  function activateDragControls(event: KeyboardEvent) {
    if (
      !event.shiftKey ||
      !(
        workMode === "PROCESS" ||
        workMode === "DESIGNER" ||
        workMode === "PRODESIGNER" ||
        workMode === "PIPDESIGNER" ||
        workMode === "STRDESIGNER"
      )
    )
      //Trial mode
      return;
    drag_controls?.activate();
  }

  function deactivateDragControls(event: KeyboardEvent) {
    if (event.key !== "Shift") return;
    drag_controls?.deactivate();
  }

  function searchPipe(res: any) {
    if (!project) return;
    dispatch(unselectFreePipes());
    const pipes = threeD_scene.getObjectByName(`${project.name}-Pipes`);
    const pipe = pipes?.getObjectByName(res.name);
    if (pipe?.userData?.isFreePipe) {
      const data = pipe.userData as TSelectedPipe;
      const mid = getMiddleVector3(data.start, data.end);
      changeTargetOfRotation(threeD_controls, threeD_camera, mid);
      dispatch(selectFreePipe(data));
    } else {
      for (const pipe of pipes?.children ?? []) {
        for (const ch of pipe.children) {
          if (!ch.userData.isFreePipe) continue;
          let r = false;
          if (res.line !== undefined) {
            r = ch.userData.pipe?.line === res.line;
            if (!r) continue;
          }
          if (res.size) {
            r = ch.userData.pipe?.params.nps === res.size;
            if (!r) continue;
          }
          if (res.min && res.max) {
            r =
              checkRange(
                ch.userData.pipe.x1,
                res.min.x,
                res.max.x,
                true,
                true
              ) &&
              checkRange(
                ch.userData.pipe.y1,
                res.min.y,
                res.max.y,
                true,
                true
              ) &&
              checkRange(ch.userData.pipe.z1, res.min.z, res.max.z, true, true);
            if (!r) continue;
            r =
              checkRange(
                ch.userData.pipe.x2,
                res.min.x,
                res.max.x,
                true,
                true
              ) &&
              checkRange(
                ch.userData.pipe.y2,
                res.min.y,
                res.max.y,
                true,
                true
              ) &&
              checkRange(ch.userData.pipe.z2, res.min.z, res.max.z, true, true);
            if (!r) continue;
          }
          if (project && res.insulation) {
            const ies = res.insulation.split(" - ");
            r = project.pipeLoadings.deadLoad.insulations.some(
              (i) =>
                i.element === ch.userData.pipeName &&
                i.thickness === +ies[0] &&
                i.type === ies[1]
            );
            if (!r) continue;
          }
          if (r) {
            const data = ch.userData as TSelectedPipe;
            if (threeD_camera && threeD_controls) {
              const mid = getMiddleVector3(data.start, data.end);
              threeD_controls.target.copy(mid);
              threeD_controls.update();
              threeD_camera.position.copy(mid.clone().addScalar(3));
              threeD_camera.lookAt(mid);
            }
            dispatch(selectFreePipe(ch.userData as TSelectedPipe));
          }
        }
      }
    }
    setDlg(undefined);
  }

  function searchByName(val: string) {
    const obj = threeD_scene.getObjectByName(val);
    if (obj?.userData?.isProcessItem) {
      const data = obj.userData as TProcessElement;
      if (threeD_camera && threeD_controls) {
        const mid = new Vector3(
          data.position.x,
          data.position.y,
          data.position.z
        );
        threeD_controls.target.copy(mid);
        threeD_controls.update();
        threeD_camera.position.copy(mid.clone().addScalar(3));
        threeD_camera.lookAt(mid);
      }
      dispatch(selectProcessElementAction(obj.userData as TProcessElement));
    }
    setDlg(undefined);
  }
  function searchEquipmentNozzle(res: any) {
    const obj = threeD_scene.getObjectByName(res.name);
    console.log("name of equipment", obj);
    if (obj?.userData?.isProcessItem) {
      const data = obj.userData as TProcessElement;
      if (threeD_camera && threeD_controls) {
        const mid = new Vector3(
          data.position.x,
          data.position.y,
          data.position.z
        );
        threeD_controls.target.copy(mid);
        threeD_controls.update();
        threeD_camera.position.copy(mid.clone().addScalar(3));
        threeD_camera.lookAt(mid);
      }
      const el = obj.userData as TProcessElement;
      if (!res.connection) {
        dispatch(selectProcessElementAction(el));
      } else {
        dispatch(
          selectProcessElementNozzlePointAction(el, el.points[res.connection])
        );
      }
    }
    setDlg(undefined);
  }

  function searchOnScene(e: KeyboardEvent) {
    if (!checkCtrlShiftS(e) || !project) return;
    if (workMode === "PIPING") {
      setDlg(
        <PipeSearcher
          onClose={() => setDlg(undefined)}
          onSubmit={(res) => {
            searchPipe(res);
          }}
        />
      );
    } else if (workMode === "STRUCTURE") {
      setDlg(
        <BeamSearcher
          onClose={() => setDlg(undefined)}
          onSubmit={(params) => {
            let obj;
            if (params.model) {
              const model = threeD_scene.getObjectByName(params.model);
              obj = model?.getObjectByName(params.name);
            } else {
              obj = threeD_scene.getObjectByName(params.name);
            }
            if (obj?.userData?.isModelItem) {
              const data = obj.userData as ModelItem;
              const mid = getMiddleVector3(
                localToGlobal(data.modelStart, data.start, data.modelDir),
                localToGlobal(data.modelStart, data.end, data.modelDir)
              );
              changeTargetOfRotation(threeD_controls, threeD_camera, mid);
              dispatch(selectModelItem(obj.userData as ModelItem, true));
            } else if (!params.name) {
              const group = params.model
                ? threeD_scene.getObjectByName(params.model)
                : threeD_scene;

              if (!group) return;
              const findItem = (children: Object3D[]) => {
                let items: ModelItem[] = [];
                for (const child of children) {
                  if (child.userData.isModelItem) {
                    const data = child.userData as ModelItem;
                    if (params.designation) {
                      if (data.profile?.designation !== params.designation)
                        continue;
                    }
                    if (params.releases) {
                      if (data.releases) {
                        if (
                          !(
                            !!data.releases.fx1 === !!params.releases.fx1 &&
                            !!data.releases.fy1 === !!params.releases.fy1 &&
                            !!data.releases.fz1 === !!params.releases.fz1 &&
                            !!data.releases.fx2 === !!params.releases.fx2 &&
                            !!data.releases.fy2 === !!params.releases.fy2 &&
                            !!data.releases.fz2 === !!params.releases.fz2 &&
                            !!data.releases.mx1 === !!params.releases.mx1 &&
                            !!data.releases.my1 === !!params.releases.my1 &&
                            !!data.releases.mz1 === !!params.releases.mz1 &&
                            !!data.releases.mx2 === !!params.releases.mx2 &&
                            !!data.releases.my2 === !!params.releases.my2 &&
                            !!data.releases.mz2 === !!params.releases.mz2
                          )
                        )
                          continue;
                      } else continue;
                    }
                    items = [...items, data];
                  } else {
                    items = [...items, ...findItem(child.children)];
                  }
                }
                return items;
              };
              const items = findItem(group.children);
              dispatch(selectModelItems(items));
            }
          }}
        />
      );
    } else if (
      workMode === "PROCESS" ||
      workMode === "DESIGNER" ||
      workMode === "PRODESIGNER" ||
      workMode === "PIPDESIGNER" ||
      workMode === "STRDESIGNER"
    ) {
      //Trial Mode
      setDlg(
        <AdvancedSearcher
          onClose={() => setDlg(undefined)}
          onSubmit={(result) => {
            if (result.type === "Pipe") {
              searchPipe(result);
            } else {
              searchEquipmentNozzle(result);
            }
          }}
        />
      );
    }
  }

  // Function to request render for 3D scene animations
  function animate3DPage(
    threeD_scene: Scene,
    threeD_controls: OrbitControls,
    isSkip = false
  ) {
    if (!threeD_renderer) return;
    if (!isSkip) {
      threeD_controls.update();

      updateAxesHelperParams(threeD_scene, threeD_controls);
      animatePSS(threeD_scene, clock);
      resizeScene(threeD_renderer, threeD_controls);
      threeD_renderer.render(threeD_scene, threeD_controls.object);
    }
    animationFrame = requestAnimationFrame(() => {
      return animate3DPage(threeD_scene, threeD_controls, !isSkip);
    });
  }
  function changeCameraPosition(
    camera: Camera,
    scene: Scene,
    canvas?: HTMLCanvasElement | null,
    position?: Vector3
  ) {
    if (!canvas) return;
    // 1. Calculate the bounding box of the entire scene
    const bbox = new Box3().setFromObject(scene);

    // 2. Determine the center of the bounding box
    const bboxCenter = bbox.getCenter(new Vector3());

    // 3. Calculate the distance from the center to fit the scene
    const bboxSize = bbox.getSize(new Vector3());

    const maxDim = Math.max(bboxSize.x, bboxSize.y, bboxSize.z);

    //@ts-ignore
    const fov = camera.fov * (Math.PI / 180);
    const cameraZ = Math.abs((maxDim / 4) * Math.tan(fov * 2));

    const distance = cameraZ; // Distance from the cube

    if (position)
      camera.position.copy(
        position.add(position.normalize().multiplyScalar(distance))
      );
    camera.lookAt(bboxCenter);
  }
  function adjustCameraToFit(
    event: React.MouseEvent,
    camera: Camera,
    scene: Scene,
    canvas?: HTMLCanvasElement | null
  ) {
    if (!canvas) return;
    const items = getObjectOnScreen(event, camera, scene, canvas);
    //@ts-ignore
    if (items.length > 1 && items[0].isAxisCube) {
      console.log(items);
      //@ts-ignore
      const position = items[0].rotation;
      changeCameraPosition(camera, scene, canvas, position);
    }
  }
  function selectElement(
    event: React.MouseEvent,
    camera: Camera,
    scene: Scene,
    canvas?: HTMLCanvasElement | null,
    controls?: OrbitControls | null
  ) {
    if (!canvas) return;
    const isCtrl = event.ctrlKey;
    let items = getObjectOnScreen(event, camera, scene, canvas);
    // 1. Calculate the bounding box of the entire scene
    const bbox = new Box3().setFromObject(scene);

    // 2. Determine the center of the bounding box
    const bboxCenter = bbox.getCenter(new Vector3());

    // 3. Calculate the distance from the center to fit the scene
    const bboxSize = bbox.getSize(new Vector3());

    const maxDim = Math.max(bboxSize.x, bboxSize.y, bboxSize.z);

    //@ts-ignore
    const fov = camera.fov * (Math.PI / 180);
    const cameraZ = Math.abs((maxDim / 4) * Math.tan(fov * 2));

    // Adjust the cameraZ to fit the whole scene
    // cameraZ *= 2; // Increase this value to move the camera further away

    //@ts-ignore
    if (items.length > 1 && items[0].isAxisCube) {
      console.log(items);
      const distance = cameraZ; // Distance from the cube
      //@ts-ignore
      if (items[0].rotation.equals(new Vector3(1, 0, 0))) {
        // Right side
        camera.position.set(distance, 0, 0);
        camera.lookAt(new Vector3(0, 0, 0));
        //@ts-ignore
      } else if (items[0].rotation.equals(new Vector3(-1, 0, 0))) {
        // Left side
        camera.position.set(-distance, 0, 0);
        camera.lookAt(bboxCenter);
        //@ts-ignore
      } else if (items[0].rotation.equals(new Vector3(0, 1, 0))) {
        // Top
        camera.position.set(0, distance, 0);
        camera.lookAt(bboxCenter);
        //@ts-ignore
      } else if (items[0].rotation.equals(new Vector3(0, -1, 0))) {
        // Bottom
        camera.position.set(0, -distance, 0);
        camera.lookAt(bboxCenter);
        //@ts-ignore
      } else if (items[0].rotation.equals(new Vector3(0, 0, 1))) {
        // Front
        camera.position.set(0, 0, distance);
        camera.lookAt(bboxCenter);
        //@ts-ignore
      } else if (items[0].rotation.equals(new Vector3(0, 0, -1))) {
        // Back
        camera.position.set(0, 0, -distance);
        camera.lookAt(bboxCenter);
      }

      // camera.rotateOnAxis(items[0].rotation, 180);
    }
    const handleItem = (item: any) => {
      if (item?.isAxisCube && controls) {
        const distance = controls.target.distanceTo(camera.position);
        camera.position
          .copy(controls.target)
          .add(item.rotation.clone().multiplyScalar(distance));
        camera.lookAt(controls.target);
      } else if (item?.isPipeConnector) {
        dispatch(selectPipeConnector(item as TSelectedPipeConnector));
      } else if (item?.isInstrLine) {
        dispatch(selectInstrLineAction(item.line));
      } else if (item?.isIntrumentationElement) {
        const data = item.instr.instr;
        isCtrl &&
          changeTargetOfRotation(
            controls,
            camera,
            new Vector3(data.x, data.y, data.z)
          );
        dispatch(selectInstrElementAction(item.instr));
      } else if (item?.isProcessLine && item.line?.type === "PIPE") {
        dispatch(selectProcessLineAction(item.line as TProcessLine));
      } else if (item?.isProcessItem) {
        const mid = new Vector3(
          item.position.x,
          item.position.y,
          item.position.z
        );
        isCtrl && changeTargetOfRotation(controls, camera, mid);
        dispatch(selectProcessElementAction(item as TProcessElement));

        // Mouse pipe creating
        setMPCState({
          processPipeElement: MPCState.processPipeElement,
          startProcessElement: item as TProcessElement,
          pipeSegmentParams: MPCState.pipeSegmentParams,
          isStart: true,
          connectionSegmentParams: MPCState.connectionSegmentParams,
          pipeFlangeParams: MPCState.pipeFlangeParams,
        });
      } else if (item?.isProcessNozzle) {
        dispatch(selectProcessElementNozzleAction(item));
      } else if (item?.isFreePipe) {
        const mid = getMiddleVector3(item.start, item.end);
        isCtrl && changeTargetOfRotation(controls, camera, mid);
        dispatch(unselectFreePipes());
        dispatch(selectFreePipe(item as TSelectedPipe));
      } else if (item?.isFreePipeSupport) {
        dispatch(selectFreePipeSupport(item as TSelectedPipeSupport));
      } else if (item?.isModelPlatform) {
        dispatch(selectModelPlatform(item as TSelectedPlatform));
      } else if (item?.isModelItem) {
        const mid = getMiddleVector3(
          localToGlobal(item.modelStart, item.start, item.modelDir),
          localToGlobal(item.modelStart, item.end, item.modelDir)
        );
        isCtrl && changeTargetOfRotation(controls, camera, mid);
        dispatch(selectModelItem(item as ModelItem, true));
      }
    };
    if (items.length === 1) {
      return handleItem(items[0]);
    }
    items = items
      .filter(filterInterractiveCrossedElements)
      .reduce(reduceInterractiveCrossedElements, [] as any[]);
    if (items.length === 1) {
      handleItem(items[0]);
    } else if (items.length > 1) {
      setDlg(
        <CustomDlg
          title="Crossed elements"
          zIndex={100}
          position={"center"}
          body={
            <div className={`d-flex f-column f-grow bg-dark`}>
              <div className="hr" />
              <div className="table-container">
                <table className="table bg-gray">
                  <tbody>
                    {items.map((item, i) => {
                      return (
                        <tr key={i}>
                          <td>{getCrossedElementLabel(item)}</td>
                          <td>
                            <Button
                              text="Select"
                              intent="primary"
                              onClick={() => {
                                handleItem(item);
                                setDlg(undefined);
                              }}
                            />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          }
          onClose={() => setDlg(undefined)}
        />
      );
    } else if (isCtrl && controls) {
      controls.target.set(0, 0, 0);
      controls.update();
    }
  }

  function takeElement(
    event: React.MouseEvent,
    camera: Camera,
    scene: Scene,
    canvas?: HTMLCanvasElement | null
  ) {
    if (!canvas) return;
    let items = getObjectOnScreen(event, camera, scene, canvas);
    const handleItem = (item: any) => {
      if (
        [
          "STRUCTURE",
          "DESIGNER",
          "PRODESIGNER",
          "PIPDESIGNER",
          "STRDESIGNER",
        ].includes(workMode) &&
        OFCreationState.type
      ) {
        const point = getPointOnScreen(
          event,
          camera,
          scene,
          canvas,
          OFCreationState.fromPoint
        );
        return handleDefineDataForCreationElements(
          project?.models.filter((m) =>
            ["Open Frame", "Pipe Rack", "ROAD", "DRAIN"].includes(m.type)
          ) ?? [],
          item as ModelItem,
          point,
          OFCreationState,
          setOFCreationState,
          dispatch
        );
      }
      if (
        workMode === "PROCESS" ||
        workMode === "DESIGNER" ||
        workMode === "PRODESIGNER" ||
        workMode === "PIPDESIGNER" ||
        workMode === "STRDESIGNER"
      ) {
        //trial
        const position = new Vector2(event.clientX, event.clientY);
        const point = getPointOnScreen(
          event,
          camera,
          scene,
          canvas,
          MPCState.startPointPipeSegment
        );
        handleClickBySceneForProcess({
          currentProject,
          item,
          point,
          position,
          process,
          MPCState,
          pipes: project?.freePipes ?? [],
          setMPCState,
          setSnap,
          dispatch,
        });
      }
      if (!item) return;
      if (item.isFreePipe) {
        dispatch(selectFreePipe(item as TSelectedPipe));
      } else if (item.isModelItem) {
        dispatch(selectModelItem(item as ModelItem));
      } else if (item.isBeamConnection) {
        setBCS((prev) => ({ ...prev, item: item as any }));
      }
    };
    if (items.length === 1) {
      return handleItem(items[0]);
    }
    items = items
      .filter(filterInterractiveCrossedElements)
      .reduce(reduceInterractiveCrossedElements, [] as any[]);
    if (items.length === 1) {
      handleItem(items[0]);
    } else if (items.length > 1) {
      setDlg(
        <CustomDlg
          title="Crossed elements"
          zIndex={100}
          position={"center"}
          body={
            <div className={`d-flex f-column f-grow bg-dark`}>
              <div className="hr" />
              <div className="table-container">
                <table className="table bg-gray">
                  <tbody>
                    {items.map((item, i) => {
                      return (
                        <tr key={i}>
                          <td>{getCrossedElementLabel(item)}</td>
                          <td>
                            <Button
                              text="Select"
                              intent="primary"
                              onClick={() => {
                                handleItem(item);
                                setDlg(undefined);
                              }}
                            />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          }
          onClose={() => setDlg(undefined)}
        />
      );
    } else {
      if (
        ["STRUCTURE", "DESIGNER"].includes(workMode) &&
        OFCreationState.type
      ) {
        let point = getPointOnScreen(
          event,
          camera,
          scene,
          canvas,
          OFCreationState.fromPoint
        );
        if (
          OFCreationState.type === "DRAIN" ||
          OFCreationState.type === "ROAD" ||
          OFCreationState.type === "TRANCH"
        ) {
          point = getNewPointOnScreen(event, camera, scene, canvas);
        }

        return handleDefineDataForCreationElements(
          project?.models.filter((m) =>
            ["Open Frame", "Pipe Rack"].includes(m.type)
          ) ?? [],
          undefined,
          point,
          OFCreationState,
          setOFCreationState,
          dispatch,
          project,
          openFrameUI
        );
      }
      if (
        workMode === "PROCESS" ||
        workMode === "DESIGNER" ||
        workMode === "PRODESIGNER" ||
        workMode === "PIPDESIGNER" ||
        workMode === "STRDESIGNER"
      ) {
        //Trial Mode
        const position = new Vector2(event.clientX, event.clientY);
        const point = getPointOnScreen(
          event,
          camera,
          scene,
          canvas,
          MPCState.startPointPipeSegment
        );
        handleClickBySceneForProcess({
          currentProject,
          item: undefined,
          point,
          position,
          process,
          MPCState,
          pipes: project?.freePipes ?? [],
          setMPCState,
          setSnap,
          dispatch,
        });
      }
    }
  }

  function clickScene(
    event: React.MouseEvent,
    camera: Camera,
    scene: Scene,
    resources: DataState,
    canvas?: HTMLCanvasElement | null,
    controls?: OrbitControls | null
  ) {
    if (!canvas || !cameraSettings?.isPivot) return;
    const mouse = new Vector2(
      (event.clientX / canvas.clientWidth) * 2 - 1,
      -(event.clientY / canvas.clientHeight) * 2 + 1
    );
    const intersects = getIntersects(mouse, camera, scene).filter(
      (el) =>
        !(
          el.object.name === "AxisHelper" ||
          el.object.name === "AxesBoxHelper" ||
          el.object.parent?.name === "AxisHelper" ||
          el.object.parent?.name === "AxesBoxHelper" ||
          el.object.parent?.parent?.name === "AxisHelper" ||
          el.object.parent?.parent?.name === "AxesBoxHelper" ||
          el.object.name === "GridHelper"
        )
    );
    const intersect = intersects[0];
    if (!intersect) {
      return;
    }
    controls?.target.copy(intersect.point);
    controls?.update();
  }

  return (
    <>
      <canvas
        id={"scene"}
        ref={canvasRef}
        className={"scene"}
        onDragOver={handleDragOver}
        onDrop={(e) =>
          handleDrop(
            e,
            process,
            currentProject,
            threeD_scene,
            threeD_renderer,
            threeD_camera,
            dispatch,
            resoures,
            project,
            openFrameUI,
            gridSettings?.customs ?? []
          )
        }
      />
      {dlg}
      <SnapInput />
      <button
        style={{
          position: "fixed",
          left: 20,
          bottom: 150,
          background: "transparent",
          border: "none",
          outline: "none",
          cursor: "pointer",
        }}
        onClick={() => {
          threeD_camera &&
            changeCameraPosition(
              threeD_camera,
              threeD_scene,
              canvasRef.current,
              new Vector3(1, 1, 1)
            );
        }}
      >
        <FontAwesomeIcon icon={faHome} size="lg" />
      </button>
    </>
  );
};

export default WorkField;

function filterInterractiveCrossedElements(item: any) {
  return !(
    !item ||
    item.isAxisCube ||
    (item.isProcessLine && item.line?.type !== "PIPE")
  );
}

function reduceInterractiveCrossedElements(acc: any[], item: any) {
  const label = getCrossedElementLabel(item);
  if (!label) return [...acc, item];
  if (
    acc.some((el) => {
      const elLabel = getCrossedElementLabel(el);
      if (!elLabel) return false;
      return elLabel === label;
    })
  )
    return acc;
  return [...acc, item];
}

function getCrossedElementLabel(item: any) {
  if (item.isPipeConnector) {
    return `Pipe Connector`;
  } else if (item.isInstrLine) {
    return `Intrumentation Line`;
  } else if (item.isIntrumentationElement) {
    return `Intrumentation Element`;
  } else if (item.isProcessLine && item.line?.type === "PIPE") {
    return `Process Pipe Line`;
  } else if (item.isProcessItem) {
    return `Process Item "${item.name}"`;
  } else if (item.isFreePipe) {
    return `Pipe ${item.pipeName}`;
  } else if (item?.isFreePipeSupport) {
    return `Pipe Support`;
  } else if (item?.isModelPlatform) {
    return `Platform "${item.data.name}"`;
  } else if (item?.isModelItem) {
    return `Beam "${item.name}"`;
  } else if (item?.isProcessNozzle) {
    return `Nozzle ${item.point.id} of ${item.el.name}`;
  } else if (item?.userData?.isConnectPoint) {
    return `Conn. ${item.userData.id} of ${item.userData.parent}`;
  }
  return undefined;
}
