import { SetterOrUpdater } from "recoil";
import { TOFCreateState } from "../../recoil/atoms/of-creation-atom";
import {
  TBeamElement,
  TBeamOF,
  TCableTrayOF,
  TCantileverOF,
  TColumnOF,
  TElementType,
  THorizontalBracingOF,
  TKneeBracingOF,
  TOpenFrame,
  TPlatformOF,
  TRoad,
} from "../../store/main/openFrameTypes";
import {
  Direction2,
  Model,
  ModelItem,
  PipeRack,
  PipeRackBeam,
  PipeRackCantilever,
  PipeRackColumn,
  Project,
  Releases,
  SimpleDirection,
  SimpleDirection3,
} from "../../store/main/types";
import {
  MMtoM,
  checkRange,
  getIndexName,
  getNextId,
  getOffsetB,
  getPosByDistance,
  getSimpleDirection,
  globalToLocal,
  hardCheckRange,
  localToGlobal,
  roundM,
  roundVectorM,
} from "../../components/3d-models/utils";
import {
  OFBeamToBeamUI,
  OFCableTrayUI,
  OFCantileverUI,
  OFColumnToBeamUI,
  OFColumnToColumnUI,
  OFColumnsUI,
  OFKneeBracingsUI,
  OFPlanBracingsUI,
  OFPlatformUI,
  OFRoadUI,
  OFVerticalBracingsUI,
  OpenFrameUI,
  ProjectUI,
  TRoadType,
} from "../../store/ui/types";
import { Dispatch } from "redux";
import {
  changeModel,
  changeProjectAction,
  createModel,
} from "../../store/main/actions";
import {
  createOFModel,
  createRoadModel,
  removeOFModel,
  updateConnections,
} from "../../components/3d-models/openFrame";
import { addEventAction, changeOFUIAction } from "../../store/ui/actions";
import { CylinderGeometry, Mesh, SphereGeometry, Vector3 } from "three";
import { dropZoneMaterial } from "../process-services/mouse-pipe-creating-service";
import { deg90InRad } from "../../store/main/constants";
import {
  concatBeams,
  splitBeamsByColumns,
  splitReleases,
} from "../../components/3d-models/pipe-rack/pipeRackUtils";
import {
  getLeftDistances,
  getWidths,
} from "../../components/menu-bar/3d-modeling/open-frame/platforms/Platforms";
import {
  createVBracing,
  filterColumns,
  getBeams,
} from "../../components/menu-bar/3d-modeling/open-frame/additional-beams/VerticalBracing";
import { getToBeams } from "../../components/menu-bar/3d-modeling/open-frame/additional-beams/PlanBracings";
import { TProcessLineSegment } from "../../store/process/types";

export function handleDefineDataForCreationElements(
  models: Model[],
  item: ModelItem | undefined,
  point: Vector3,
  state: TOFCreateState,
  setState: SetterOrUpdater<TOFCreateState>,
  dispatch?: Dispatch<any>,
  project?: Project,
  ui?: OpenFrameUI
) {
  if (
    !item &&
    point &&
    (state.type === "ROAD" ||
      state.type === "DRAIN" ||
      state.type === "TRANCH") &&
    state.model &&
    state.modelType
  ) {
    return setState((prev) => ({
      ...prev,
      toPoint: roundVectorM(point),
    }));
  }
  if (!item) {
    if (
      state.type === "ROAD" ||
      state.type === "DRAIN" ||
      state.type === "TRANCH"
    ) {
      if (!state.fromElementType && !state.fromPoint && !state.toPoint) {
        if (!project || !ui || !dispatch) return;
        const modelName = `Road${getIndexName(
          project.models.filter((model) => model.type === "ROAD"),
          "Road"
        )}`;
        console.log("modelName", modelName);
        // const newUI: OpenFrameUI = {
        //   ...ui,
        //   frames: {
        //     ...ui.frames,
        //     parameters: [
        //       ...ui.frames.parameters,
        //       ...createFramesParameters(modelName, ui.frames),
        //     ],
        //   },
        // };

        const changed = removeOFModel(project, ui, modelName);
        dispatch(
          changeProjectAction({
            ...changed.newProject,
            models: [
              ...changed.newProject.models,
              createRoadModel(modelName, project.name, ui),
            ],
          })
        );
        return setState((prev) => ({
          ...prev,
          fromElementType: state.type as TElementType,
          fromElement: state.type,
          fromPoint: point,
          model: modelName,
          toElement: undefined,
          toPoint: undefined,
        }));
      } else if (!state.toElement && !state.modelType) {
        // dispatch(changeOFUIAction(newUI));
        // if (ui.frames.material) {
        //   dispatch(setModelTypeAndMaterial(ui.frames.material, "Open Frame"));
        // }
        return setState({
          ...state,
          toPoint: point,
          toElement: state.type,
          modelType: "ROAD",
        });
      } else
        return setState({
          ...state,
          fromElement: state.type,
          fromElementType: state.type as TElementType,
          fromPoint: state.toPoint,
          toPoint: point,
          toElement: state.type,
        });
    }
    return;
  }
  const model = models.find((m) => m.name === item.model);
  if (!model) return;
  if (model.type === "ROAD") {
    const id = item?.processLine?.id;
    //@ts-ignore
    const segmentId = item.segmentId;
    if (id) {
      const roads = (model as TOpenFrame).roads?.map((road) =>
        road.id !== id
          ? road
          : {
              ...road,
              segments: road.segments.map((segment) =>
                segment.id !== segmentId
                  ? segment
                  : {
                      ...segment,
                      isPopup: true,
                    }
              ),
            }
      );
      dispatch &&
        dispatch(
          changeModel({
            ...model,
            roads,
          } as TOpenFrame)
        );
      return;
    }
  }
  if (model.type === "Open Frame") {
    //@ts-ignore

    const elements = [
      ...(model as TOpenFrame).columns,
      ...(state.type !== "CABLE-TRAY" ||
      (state.model && state.model === item.model)
        ? (model as TOpenFrame).cantilevers
        : []),
      ...(state.type !== "CABLE-TRAY" ||
      (state.model && state.model === item.model)
        ? (model as TOpenFrame).beams
        : []),
    ];
    const element = elements.find((el) => el.name === item.name);
    if (!element || !["BEAM", "CANTILEVER", "COLUMN"].includes(element.type))
      return;
    if (state.model && state.model === item.model) {
      if (state.type !== "CABLE-TRAY" && state.fromElement === element.name) {
        return setState((prev) => ({
          ...prev,
          model: undefined,
          fromElement: undefined,
        }));
      } else if (state.toElement === element.name) {
        return setState((prev) => ({
          ...prev,
          toElement: undefined,
        }));
      } else if (
        state.type === "V-BRACING" &&
        state.fromSecondElement === element.name
      ) {
        return setState((prev) => ({
          ...prev,
          fromSecondElement: undefined,
        }));
      } else if (state.type === "V-BRACING" && state.fromSecondElement) {
        return setState((prev) => ({
          ...prev,
          toSecondElement: element.name,
        }));
      } else if (state.type === "V-BRACING" && state.toElement) {
        return setState((prev) => ({
          ...prev,
          fromSecondElement: element.name,
        }));
      } else if (state.fromElement) {
        const pos = roundVectorM(
          localToGlobal(
            (model as TOpenFrame).startPos,
            (model as TOpenFrame).direction === "+X" ||
              (model as TOpenFrame).direction === "-Z"
              ? item.start
              : item.end,
            (model as TOpenFrame).direction
          )
        );

        const direction = getSimpleDirection(pos, item.intersect ?? pos);
        const position =
          item.intersect?.clone() ?? item.intersect?.clone() ?? new Vector3();
        if (direction === "Y") {
          position.setX(pos.x).setZ(pos.z);
        } else if (direction === "X") {
          position.setY(pos.y);
          position.setZ(pos.z);
        } else if (direction === "Z") {
          {
            position.setY(pos.y);
            position.setX(pos.x);
          }
        }
        return setState((prev) => ({
          ...prev,
          toElement: element.name,
          toElementDirection: direction,
          toPoint:
            state.type === "CABLE-TRAY" && position
              ? roundVectorM(position)
              : item.intersect,
        }));
      }
    } else {
      let direction: SimpleDirection3;
      const position =
        state.type !== "CABLE-TRAY"
          ? item.intersect ?? element?.startPos.clone()
          : element?.endPos.clone();
      if (element.type === "BEAM" || element.type === "CANTILEVER") {
        const start = roundVectorM(
          localToGlobal(
            (model as TOpenFrame).startPos,
            element.startPos,
            (model as TOpenFrame).direction
          )
        );
        const end = roundVectorM(
          localToGlobal(
            (model as TOpenFrame).startPos,
            element.endPos,
            (model as TOpenFrame).direction
          )
        );
        direction = getSimpleDirection(start, end);
        if (direction === "X") {
          position.setY(start.y).setZ(start.z);
        } else if (direction === "Z") {
          position.setX(start.x).setY(start.y);
        }
      } else {
        const pos = roundVectorM(
          localToGlobal(
            (model as TOpenFrame).startPos,
            element.startPos,
            (model as TOpenFrame).direction
          )
        );
        position.setX(pos.x).setZ(pos.z);
        // if (state.type === "CABLE-TRAY") position.setY(element.endPos.);
      }
      setState((prev) => ({
        ...prev,
        model: model.name,
        modelType: model.type,
        fromElement: element.name,
        fromElementType: element.type,
        distance: state.distance,
        fromElementDirection: direction ?? "Y",
        fromPoint: roundVectorM(position),
      }));
    }
  } else if (model.type === "Pipe Rack") {
    const elements = [
      ...(model as PipeRack).beams,
      ...(model as PipeRack).cantilevers,
      ...(model as PipeRack).columns,
    ];
    const element = elements.find((el) => el.name === item.name);
    if (
      !element ||
      !["PipeRackBeam", "PipeRackCantilever"].includes(element.type ?? "")
    )
      return;
    if (state.model && state.model === item.model) {
      if (state.fromElement === element.name) {
        return setState((prev) => ({
          ...prev,
          model: undefined,
          fromElement: undefined,
        }));
      }
      setState((prev) => ({
        ...prev,
        toElement: element.name,
      }));
    } else {
      let direction: SimpleDirection3;
      const position = item.intersect ?? element?.startPos.clone();
      if (
        element.type === "PipeRackBeam" ||
        element.type === "PipeRackCantilever"
      ) {
        const start = roundVectorM(
          localToGlobal(
            (model as PipeRack).startPos,
            element.startPos,
            (model as PipeRack).direction
          )
        );
        const end = roundVectorM(
          localToGlobal(
            (model as PipeRack).startPos,
            element.endPos,
            (model as PipeRack).direction
          )
        );
        direction = getSimpleDirection(start, end);
        if (direction === "X") {
          position.setY(start.y).setZ(start.z);
        } else if (direction === "Z") {
          position.setX(start.x).setY(start.y);
        }
      } else {
        const pos = roundVectorM(
          localToGlobal(
            (model as PipeRack).startPos,
            element.startPos,
            (model as PipeRack).direction
          )
        );
        position.setX(pos.x).setZ(pos.z);
      }
      setState((prev) => ({
        ...prev,
        model: model.name,
        modelType: model.type,
        fromElement: element.name,
        fromElementType: element.type,
        fromElementDirection: direction ?? "Y",
        fromPoint: state.type === "CABLE-TRAY" ? point : roundVectorM(position),
      }));
    }
  }
}

export function createAnchors(state: TOFCreateState) {
  if (!state.fromPoint) return [];
  const anchors = [];
  if (state.fromElementType === "COLUMN") {
    const geometry = new CylinderGeometry(0.1, 0.1, 50);
    const m = dropZoneMaterial.clone();
    m.opacity = 0.3;
    const meshX = new Mesh(geometry, m);
    const meshZ = new Mesh(geometry, m);
    meshX.position.copy(state.fromPoint);
    meshZ.position.copy(state.fromPoint);
    meshX.rotateZ(deg90InRad);
    meshZ.rotateX(deg90InRad);
    meshX.name = `DROP-CYLINDER-X`;
    meshZ.name = `DROP-CYLINDER-Z`;
    anchors.push(meshX);
    anchors.push(meshZ);
  } else if (
    state.fromElementType === "BEAM" ||
    state.fromElementType === "PipeRackBeam" ||
    state.fromElementType === "CANTILEVER" ||
    state.fromElementType === "PipeRackCantilever"
  ) {
    const geometry = new CylinderGeometry(0.1, 0.1, 50);
    const m = dropZoneMaterial.clone();
    m.opacity = 0.3;
    const mesh = new Mesh(geometry, m);
    mesh.name = `DROP-CYLINDER-Y`;
    mesh.position.copy(state.fromPoint);
    const sideMesh = mesh.clone();
    if (state.fromElementDirection === "X") {
      sideMesh.rotateX(deg90InRad);
      sideMesh.name = `DROP-CYLINDER-Z`;
    } else if (state.fromElementDirection === "Z") {
      sideMesh.rotateZ(deg90InRad);
      sideMesh.name = `DROP-CYLINDER-X`;
    }
    anchors.push(mesh);
    anchors.push(sideMesh);
  } else if (
    state.fromElementType === "ROAD" ||
    state.fromElementType === "DRAIN" ||
    state.fromElementType === "TRANCH"
  ) {
    const geometry = new SphereGeometry(0.5);
    const m = dropZoneMaterial.clone();
    m.opacity = 0.3;
    const mesh = new Mesh(geometry, m);
    mesh.name = `DROP-SHPHERE-POINT`;

    mesh.position.copy(state.fromPoint);

    if (state.toPoint) {
      const secondMesh = mesh.clone();
      secondMesh.position.copy(state.toPoint);
      anchors.push(secondMesh);
    }
    anchors.push(mesh);
  }
  return anchors;
}

export function createElement(
  ui: ProjectUI | undefined,
  models: Model[],
  state: TOFCreateState,
  setState: SetterOrUpdater<TOFCreateState>,
  dispatch: Dispatch<any>
) {
  if (
    (!state.model || !(state.toElement || state.toPoint)) &&
    state.type !== "ROAD" &&
    state.type !== "DRAIN" &&
    state.type !== "TRANCH"
  )
    return;
  switch (state.type) {
    case "BEAM":
      createBeam(ui, models, state, setState, dispatch);
      break;
    case "V-BRACING":
      createVerticalBracing(ui, models, state, setState, dispatch);
      break;
    case "H-BRACING":
      createHorizontalBracing(ui, models, state, setState, dispatch);
      break;
    case "K-BRACING":
      createKneeBracing(ui, models, state, setState, dispatch);
      break;
    case "PLATFORM":
      createPlatform(ui, models, state, setState, dispatch);
      break;
    case "CABLE-TRAY":
      createCableTray(ui, models, state, setState, dispatch);
      break;
    case "ROAD":
    case "DRAIN":
    case "TRANCH":
      createRoad(ui, models, state, setState, dispatch);
      break;
  }
}
function createRoad(
  ui: ProjectUI | undefined,
  models: Model[],
  state: TOFCreateState,
  setState: SetterOrUpdater<TOFCreateState>,
  dispatch: Dispatch<any>
) {
  if (!ui) return;
  const model = models.find((m) => m.name === state.model) as TOpenFrame;

  if (!model) return;
  let roads = model.roads ?? [];
  const segments: TProcessLineSegment[] = !state.modelType
    ? roads[roads.length - 1].segments
    : [];

  const start = state.fromPoint?.clone() ?? new Vector3();
  const end = state.toPoint?.clone() ?? new Vector3();
  let endSegment: TProcessLineSegment;

  if (start.x !== end.x) {
    if (start.y !== end.y) {
      if (start.z !== end.z) {
        segments.push({
          id: getNextId(segments),
          start,
          end: new Vector3(end.x, start.y, start.z),
        });
        segments.push({
          id: getNextId(segments),
          start: new Vector3(end.x, start.y, start.z),
          end: new Vector3(end.x, end.y, start.z),
        });
        segments.push({
          id: getNextId(segments),
          start: new Vector3(end.x, end.y, start.z),
          end,
        });
      }
    } else if (start.z !== end.z) {
      segments.push({
        id: getNextId(segments),
        start,
        end: new Vector3(end.x, start.y, start.z),
      });
      segments.push({
        id: getNextId(segments),
        start: new Vector3(end.x, start.y, start.z),
        end,
      });
    } else segments.push({ id: getNextId(segments), start, end });
  } else if (start.y !== end.y) {
    if (start.z !== end.z) {
      segments.push({
        id: getNextId(segments),
        start,
        end: new Vector3(start.x, end.y, start.z),
      });
      segments.push({
        id: getNextId(segments),
        start: new Vector3(start.x, end.y, start.z),
        end,
      });
    } else segments.push({ id: getNextId(segments), start, end });
  } else segments.push({ id: getNextId(segments), start, end });
  // @ts-ignore
  if (endSegment) segments.push({ ...endSegment, id: getNextId(segments) });

  const id = getNextId(ui.openFrameUI.roads);

  const newUI: OFRoadUI = {
    id: id,
    name: `Road${getIndexName(
      ui.openFrameUI.platforms.filter((el) => el.model === model.name),
      "P"
    )}`,
    selected: false,
    model: model.name,
    // profile: state.profile!,
    width: state.width ?? 1000,
    type: (state.type ?? "ROAD") as TRoadType,
    thickness: state.thickness ?? 2,
  };

  const newRoad: TRoad = {
    id: newUI.id,
    name: newUI.name,
    orientation: 0,
    // profile: state.profile!,
    width: newUI.width,
    thickness: newUI.thickness,
    type: newUI.type,
    segments,
  };

  if (state.modelType) {
    roads.push(newRoad);
  } else {
    roads = [
      ...roads.slice(0, -1),
      {
        ...roads[roads.length - 1],
        segments,
      },
    ];
  }

  dispatch(
    changeModel({
      ...model,
      roads,
    } as TOpenFrame)
  );

  setState((prev) => ({
    ...prev,
    fromElementType: undefined,
    fromElement: undefined,
    modelType: undefined,
  }));
  // return action(EProcessActionTypes.CONNECT_ELEMENTS, {
  //   processName,
  //   process,
  //   lines,
  //   selected: process?.elements.get(p.name),
  // });
}
function createBeam(
  ui: ProjectUI | undefined,
  models: Model[],
  state: TOFCreateState,
  setState: SetterOrUpdater<TOFCreateState>,
  dispatch: Dispatch<any>
) {
  if (!state.lib) {
    dispatch(
      addEventAction(
        `Additional Beams: Warning! Please, select "C/S Lib" for creating element`,
        "warning"
      )
    );
    return setState((prev) => ({
      ...prev,
      toElement: undefined,
      toPoint: undefined,
    }));
  }
  if (!state.profile) {
    dispatch(
      addEventAction(
        `Additional Beams: Warning! Please, select "Profile" for creating element`,
        "warning"
      )
    );
    return setState((prev) => ({
      ...prev,
      toElement: undefined,
      toPoint: undefined,
    }));
  }
  const model = models.find((m) => m.name === state.model);
  if (!model) return;
  if (model.type === "Open Frame") {
    if (!ui) return;
    createOFBeam(ui, model as TOpenFrame, state, setState, dispatch);
  } else if (model.type === "Pipe Rack") {
    createPRBeam(model as PipeRack, state, setState, dispatch);
  }
}

function createOFBeam(
  ui: ProjectUI,
  model: TOpenFrame,
  state: TOFCreateState,
  setState: SetterOrUpdater<TOFCreateState>,
  dispatch: Dispatch<any>
) {
  const elements = [...model.columns, ...model.beams, ...model.cantilevers];
  const from = elements.find((el) => el.name === state.fromElement);
  if (!from) return;
  const fromStart = roundVectorM(
    localToGlobal(model.startPos, from.startPos, model.direction)
  );
  if (from.type === "COLUMN") {
    if (state.toElement) {
      const to = elements.find((el) => el.name === state.toElement);
      if (!to) {
        dispatch(
          addEventAction(
            `Additional Beams: Error! Element "${state.toElement}" not found in "${state.model}" model`,
            "danger"
          )
        );
        return setState((prev) => ({
          ...prev,
          toElement: undefined,
          toPoint: undefined,
        }));
      }
      if (to.type === "COLUMN") {
        const elevation = state.fromPoint
          ? roundM(state.fromPoint.y - fromStart.y)
          : 0;
        const startPos = from.startPos
          .clone()
          .setY(from.startPos.y + elevation);
        const direction = getDirection(from, to, elevation);
        if (!direction) {
          dispatch(
            addEventAction(
              `Additional Beams: Error! Impossible to create element between "${from.name}" and "${to.name}"`,
              "danger"
            )
          );
          return setState((prev) => ({
            ...prev,
            toElement: undefined,
            toPoint: undefined,
          }));
        }
        const newUI: OFColumnToColumnUI = {
          id: getNextId(ui.openFrameUI.additionalBeams.columnToColumn),
          elevation,
          selected: false,
          column: from.name,
          direction,
          library: state.lib,
          model: model.name,
          profile: state.profile,
        };
        const id = getIndexName(model.beams, "B");
        const newItem: TBeamOF = {
          id,
          uiId: newUI.id,
          type: "BEAM",
          secondType: "CtoC",
          name: `B${id}`,
          frame: from.frame,
          direction: direction === "+X" || direction === "-X" ? "X" : "Z",
          startPos: startPos.clone(),
          endPos: to.startPos.clone().setY(startPos.y),
          profile: newUI.profile!,
          orientation: 0,
          startConnected: [],
          connected: [],
          endConnected: [],
          releases: getCtoCReleases(
            direction === "+X" || direction === "-X" ? "X" : "Z",
            from as TColumnOF,
            to as TColumnOF
          ),
        };
        setState((prev) => ({
          type: prev.type,
          lib: prev.lib,
          profile: prev.profile,
          thickness: prev.thickness,
          bracingType: prev.bracingType,
          routing: prev.routing,
        }));
        dispatch(
          changeModel(
            updateConnections(model, newItem, (a, b) =>
              dispatch(
                addEventAction(
                  `Additional Beams: Warning! Elements "${a}" and "${b}" are crossing in "${model.name}" model`,
                  "warning"
                )
              )
            )
          )
        );
        dispatch(
          changeOFUIAction({
            ...ui.openFrameUI,
            additionalBeams: {
              ...ui.openFrameUI.additionalBeams,
              columnToColumn: [
                ...ui.openFrameUI.additionalBeams.columnToColumn,
                newUI,
              ],
            },
          })
        );
      } else if (to.type === "BEAM") {
        const x = from.startPos.x;
        const z = from.startPos.z;
        const top = from.endPos.y;
        const bottom = from.startPos.y;
        if (
          !checkRange(to.startPos.y, bottom, top, true, true) ||
          !(
            ((to as TBeamOF).direction === "X" &&
              to.startPos.z !== z &&
              (checkRange(x, to.startPos.x, to.endPos.x, true, true) ||
                checkRange(x, to.endPos.x, to.startPos.x, true, true))) ||
            ((to as TBeamOF).direction === "Z" &&
              to.startPos.x !== x &&
              (checkRange(z, to.startPos.z, to.endPos.z, true, true) ||
                checkRange(z, to.endPos.z, to.startPos.z, true, true)))
          )
        ) {
          dispatch(
            addEventAction(
              `Additional Beams: Error! Impossible to create element between "${from.name}" and "${to.name}"`,
              "danger"
            )
          );
          return setState((prev) => ({
            ...prev,
            toElement: undefined,
            toPoint: undefined,
          }));
        }
        const startPos = from.startPos.clone().setY(to.startPos.y);
        const endPos = new Vector3(
          (to as TBeamOF).direction === "X" ? startPos.x : to.startPos.x,
          to.startPos.y,
          (to as TBeamOF).direction === "X" ? to.startPos.z : startPos.z
        );
        const direction = (to as TBeamOF).direction === "X" ? "Z" : "X";
        const newUI: OFColumnToBeamUI = {
          id: getNextId(ui.openFrameUI.additionalBeams.columnToBeam),
          selected: false,
          model: model.name,
          column: from.name,
          beam: to.name,
          library: state.lib,
          profile: state.profile,
        };
        const id = getIndexName(model.beams, "B");
        const newItem: TBeamOF = {
          id,
          uiId: newUI.id,
          type: "BEAM",
          secondType: "CtoC",
          name: `B${id}`,
          frame: from.frame,
          direction,
          startPos,
          endPos,
          profile: newUI.profile!,
          orientation: 0,
          startConnected: [],
          connected: [],
          endConnected: [],
          releases: getCtoBReleases(direction, from as TColumnOF),
        };
        setState((prev) => ({
          type: prev.type,
          lib: prev.lib,
          profile: prev.profile,
          thickness: prev.thickness,
          bracingType: prev.bracingType,
          routing: prev.routing,
        }));
        dispatch(
          changeModel(
            updateConnections(model, newItem, (a, b) =>
              dispatch(
                addEventAction(
                  `Additional Beams: Warning! Elements "${a}" and "${b}" are crossing in "${model.name}" model`,
                  "warning"
                )
              )
            )
          )
        );
        dispatch(
          changeOFUIAction({
            ...ui.openFrameUI,
            additionalBeams: {
              ...ui.openFrameUI.additionalBeams,
              columnToBeam: [
                ...ui.openFrameUI.additionalBeams.columnToBeam,
                newUI,
              ],
            },
          })
        );
      }
    } else if (state.toPoint) {
      const distance = roundM(fromStart.distanceTo(state.fromPoint!));
      const startPos = from.startPos.clone().setY(from.startPos.y + distance);
      const endPos = roundVectorM(
        globalToLocal(model.startPos, state.toPoint, model.direction)
      );
      const direction: Direction2 =
        startPos.x < endPos.x
          ? "+X"
          : startPos.x > endPos.x
          ? "-X"
          : startPos.z < endPos.z
          ? "+Z"
          : "-Z";
      const newUI: OFCantileverUI = {
        id: getNextId(ui.openFrameUI.additionalBeams.cantilever),
        selected: false,
        elevation: distance,
        length: roundM(startPos.distanceTo(endPos)),
        direction,
        library: state.lib,
        profile: state.profile,
        column: from.name,
        model: model.name,
      };
      const id = getNextId(model.cantilevers);
      const newItem: TCantileverOF = {
        id,
        uiId: newUI.id,
        name: `CNT${id}`,
        frame: from.frame,
        type: "CANTILEVER",
        startPos,
        endPos,
        direction: direction!,
        profile: state.profile!,
        orientation: 0,
        startConnected: [],
        connected: [],
        endConnected: [],
      };
      setState((prev) => ({
        type: prev.type,
        lib: prev.lib,
        profile: prev.profile,
        thickness: prev.thickness,
        bracingType: prev.bracingType,
        routing: prev.routing,
      }));
      dispatch(
        changeModel(
          updateConnections(model, newItem, (a, b) =>
            dispatch(
              addEventAction(
                `Additional Beams: Warning! Elements "${a}" and "${b}" are crossing in "${model.name}" model`,
                "warning"
              )
            )
          )
        )
      );
      dispatch(
        changeOFUIAction({
          ...ui.openFrameUI,
          additionalBeams: {
            ...ui.openFrameUI.additionalBeams,
            cantilever: [...ui.openFrameUI.additionalBeams.cantilever, newUI],
          },
        })
      );
    }
  } else if (from.type === "BEAM" || from.type === "CANTILEVER") {
    if (state.toElement) {
      const to = elements.find(
        (el) =>
          el.name === state.toElement &&
          (el.type === "BEAM" || el.type === "CANTILEVER")
      );
      const distance = roundM(fromStart.distanceTo(state.fromPoint!));
      const startPos = roundVectorM(
        getPosByDistance(distance, from.startPos, from.endPos)
      );
      const isBtoB = checkBeamToBeam(from as TBeamOF, to as TBeamOF);
      const isC = checkColumns(from as TBeamOF, to as TBeamOF, startPos);
      if (!to) {
        dispatch(
          addEventAction(
            `Additional Beams: Error! Impossible to create element between "${from.name}" and "${state.toElement}"`,
            "danger"
          )
        );
        return setState((prev) => ({
          ...prev,
          toElement: undefined,
          toPoint: undefined,
        }));
      }
      if (isBtoB) {
        const endPos = startPos.clone();
        if ((to as TBeamOF).direction.includes("X")) {
          endPos.setZ(to.startPos.z);
        } else {
          endPos.setX(to.startPos.x);
        }
        const newUI: OFBeamToBeamUI = {
          id: getNextId(ui.openFrameUI.additionalBeams.beamToBeam),
          selected: false,
          distance,
          model: model.name,
          from: from.name,
          to: to.name,
          library: state.lib,
          profile: state.profile,
        };
        const id = getIndexName(model.beams, "B");
        const newItem: TBeamOF = {
          id,
          uiId: newUI.id,
          type: "BEAM",
          secondType: "BtoB",
          name: `B${id}`,
          frame: from.frame,
          direction: getSimpleDirection(startPos, endPos) as SimpleDirection,
          startPos,
          endPos,
          profile: state.profile!,
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
        setState((prev) => ({
          type: prev.type,
          lib: prev.lib,
          profile: prev.profile,
          thickness: prev.thickness,
          bracingType: prev.bracingType,
          routing: prev.routing,
        }));
        dispatch(
          changeModel(
            updateConnections(model, newItem, (a, b) =>
              dispatch(
                addEventAction(
                  `Additional Beams: Warning! Elements "${a}" and "${b}" are crossing in "${model.name}" model`,
                  "warning"
                )
              )
            )
          )
        );
        dispatch(
          changeOFUIAction({
            ...ui.openFrameUI,
            additionalBeams: {
              ...ui.openFrameUI.additionalBeams,
              beamToBeam: [...ui.openFrameUI.additionalBeams.beamToBeam, newUI],
            },
          })
        );
      } else if (isC) {
        const newUI: OFColumnsUI = {
          id: getNextId(ui.openFrameUI.additionalBeams.columns),
          selected: false,
          distance,
          height: 0,
          orientation: 0,
          library: state.lib,
          lowerBeam: from.name,
          model: model.name,
          upperBeam: to.name,
          profile: state.profile,
        };
        const id = getIndexName(model.columns, "C");
        const newItem: TColumnOF = {
          id,
          uiId: newUI.id,
          type: "COLUMN",
          secondType: "ADDITIONAL",
          name: `C${id}`,
          frame: from.frame,
          pos: startPos.clone(),
          startPos: startPos.clone(),
          endPos: startPos.clone().setY(to.startPos.y),
          profile: state.profile!,
          orientation: 0,
          startConnected: [],
          connected: [],
          endConnected: [],
        };
        setState((prev) => ({
          type: prev.type,
          lib: prev.lib,
          profile: prev.profile,
          thickness: prev.thickness,
          bracingType: prev.bracingType,
          routing: prev.routing,
        }));
        dispatch(
          changeModel(
            updateConnections(model, newItem, (a, b) =>
              dispatch(
                addEventAction(
                  `Additional Beams: Warning! Elements "${a}" and "${b}" are crossing in "${model.name}" model`,
                  "warning"
                )
              )
            )
          )
        );
        dispatch(
          changeOFUIAction({
            ...ui.openFrameUI,
            additionalBeams: {
              ...ui.openFrameUI.additionalBeams,
              columns: [...ui.openFrameUI.additionalBeams.columns, newUI],
            },
          })
        );
      } else {
        dispatch(
          addEventAction(
            `Additional Beams: Error! Impossible to create element between "${from.name}" and "${state.toElement}"`,
            "danger"
          )
        );
        return setState((prev) => ({
          ...prev,
          toElement: undefined,
          toPoint: undefined,
        }));
      }
    } else if (state.toPoint) {
      const distance = roundM(fromStart.distanceTo(state.fromPoint!));
      const startPos = roundVectorM(
        getPosByDistance(distance, from.startPos, from.endPos)
      );
      const newUI: OFColumnsUI = {
        id: getNextId(ui.openFrameUI.additionalBeams.columns),
        selected: false,
        distance,
        height: roundM(state.fromPoint!.distanceTo(state.toPoint)),
        orientation: 0,
        library: state.lib,
        lowerBeam: from.name,
        model: model.name,
        profile: state.profile,
      };
      const id = getIndexName(model.columns, "C");
      const newItem: TColumnOF = {
        id,
        uiId: newUI.id,
        type: "COLUMN",
        secondType: "ADDITIONAL",
        name: `C${id}`,
        frame: from.frame,
        pos: startPos.clone(),
        startPos: startPos.clone(),
        endPos: startPos.clone().setY(roundM(startPos.y + newUI.height)),
        profile: state.profile!,
        orientation: 0,
        startConnected: [],
        connected: [],
        endConnected: [],
      };
      setState((prev) => ({
        type: prev.type,
        lib: prev.lib,
        profile: prev.profile,
        thickness: prev.thickness,
        bracingType: prev.bracingType,
        routing: prev.routing,
      }));
      dispatch(
        changeModel(
          updateConnections(model, newItem, (a, b) =>
            dispatch(
              addEventAction(
                `Additional Beams: Warning! Elements "${a}" and "${b}" are crossing in "${model.name}" model`,
                "warning"
              )
            )
          )
        )
      );
      dispatch(
        changeOFUIAction({
          ...ui.openFrameUI,
          additionalBeams: {
            ...ui.openFrameUI.additionalBeams,
            columns: [...ui.openFrameUI.additionalBeams.columns, newUI],
          },
        })
      );
    }
  }
}

function createPRBeam(
  model: PipeRack,
  state: TOFCreateState,
  setState: SetterOrUpdater<TOFCreateState>,
  dispatch: Dispatch<any>
) {
  const elements = [...model.columns, ...model.beams, ...model.cantilevers];
  const from = elements.find((el) => el.name === state.fromElement);
  if (!from) return;
  const fromStart = roundVectorM(
    localToGlobal(model.startPos, from.startPos, model.direction)
  );
  if (from.type === "PipeRackBeam" || from.type === "PipeRackCantilever") {
    if (state.toElement) {
      const to = elements.find(
        (el) =>
          el.name === state.toElement &&
          (el.type === "PipeRackBeam" || el.type === "PipeRackCantilever")
      );
      const distance = roundM(fromStart.distanceTo(state.fromPoint!));
      const startPos = roundVectorM(
        getPosByDistance(distance, from.startPos, from.endPos)
      );
      let isBtoB = false;
      let isC = false;
      const direction = getSimpleDirection(from.startPos, from.endPos);
      if (to) {
        if (from.type === "PipeRackBeam" && from.type === to.type) {
          const fb = from as PipeRackBeam;
          const tb = to as PipeRackBeam;
          isBtoB =
            fb.direction === tb.direction && fb.startPos.y === tb.startPos.y;
        } else if (
          from.type === "PipeRackCantilever" &&
          from.type === to.type
        ) {
          const fb = from as PipeRackCantilever;
          const tb = to as PipeRackCantilever;
          isBtoB =
            fb.position === tb.position && fb.startPos.y === tb.startPos.y;
        }
      }
      if (
        to &&
        ((getSimpleDirection(to.startPos, to.endPos).includes("X") &&
          direction.includes("X")) ||
          (getSimpleDirection(to.startPos, to.endPos).includes("Z") &&
            direction.includes("Z"))) &&
        to.startPos.y > from.startPos.y
      ) {
        const temp = startPos.clone().setY(to.startPos.y);
        const d = roundM(to.startPos.distanceTo(to.endPos));
        const d1 = to.startPos.distanceTo(temp);
        const d2 = temp.distanceTo(to.endPos);
        isC = d === roundM(d1 + d2);
      }

      if (!to) {
        dispatch(
          addEventAction(
            `Additional Beams: Error! Impossible to create element between "${from.name}" and "${state.toElement}"`,
            "danger"
          )
        );
        return setState((prev) => ({
          ...prev,
          toElement: undefined,
          toPoint: undefined,
        }));
      }
      if (isBtoB) {
        const rows: any[] = [];
        model.beams.forEach((b) => {
          if (b.additional && !b.next) {
            const portal = model.portals.find((p) => p.name === b.parent);
            const nextP = portal
              ? model.portals[model.portals.indexOf(portal) + 1]
              : undefined;
            rows.push({
              id: b.uiId ?? -1,
              selected: false,
              pr: model,
              portal,
              tier: b.tier,
              direction: b.direction,
              offset: portal
                ? b.direction === "X"
                  ? portal.width / 2 + b.startPos.z
                  : nextP
                  ? nextP.chainage - b.startPos.x
                  : 0
                : 0,
              CSLibrary: b.CSLibrary,
              profile: b.profile,
            });
          }
        });
        for (let i = 0, len = rows.length; i < len; ++i) {
          const item = rows[i];
          if (item.id === -1) {
            rows[i] = { ...item, id: getNextId(rows) };
          }
        }
        rows.sort((a, b) => a.id - b.id);
        const portal = model.portals.find((p) => p.name === from.parent);
        const dir = direction === "X" ? "Z" : "X";
        let offset = 0;
        if (dir === "X") {
          const leftZ = roundM((portal?.width ?? 0) / -2);
          const angle = new Vector3(
            portal?.chainage ?? 0,
            from.startPos.y,
            leftZ
          );
          const fixed = startPos.clone();
          fixed.setX(angle.x);
          offset = roundM(angle.distanceTo(fixed));
        } else {
          const rightZ = roundM((portal?.width ?? 0) / 2);
          const angle = new Vector3(
            roundM((portal?.chainage ?? 0) + (portal?.length ?? 0)),
            from.startPos.y,
            rightZ
          );
          const fixed = startPos.clone();
          fixed.setZ(angle.z);
          offset = roundM(angle.distanceTo(fixed));
        }
        rows.push({
          id: getNextId(rows),
          selected: false,
          pr: model,
          portal,
          tier: from.tier,
          direction: dir,
          offset,
          CSLibrary: state.lib,
          profile: state.profile,
        });
        let oldBeams: PipeRackBeam[] = concatBeams(model.beams, "AB");
        let oldCnts: PipeRackCantilever[] = concatBeams(
          model.cantilevers,
          "AB"
        );
        // generate new beams
        model.portals.forEach((p) => {
          rows
            .filter(
              (row) =>
                row.pr?.name === model.name && row.portal?.name === p.name
            )
            .sort((a: any, b: any) => {
              return a.direction === "X" && b.direction === "Z"
                ? -1
                : a.direction === "Z" && b.direction === "X"
                ? 1
                : b.offset - a.offset;
            })
            .forEach((vRow) => {
              const height = p.tiers[vRow.tier!];
              const startPos = new Vector3(
                vRow.direction === "Z"
                  ? p.chainage + p.length - vRow.offset
                  : p.chainage,
                height,
                vRow.direction === "X"
                  ? p.width / -2 + vRow.offset
                  : p.width / 2
              );
              const endPos = new Vector3(
                vRow.direction === "Z"
                  ? p.chainage + p.length - vRow.offset
                  : p.chainage + p.length,
                height,
                vRow.direction === "X"
                  ? p.width / -2 + vRow.offset
                  : p.width / -2
              );
              if (
                !oldBeams.some((b) => {
                  if (b.startPos.equals(startPos) && b.endPos.equals(endPos))
                    return true;
                  if (vRow.direction === "Z") {
                    return (
                      startPos.x === b.startPos.x &&
                      startPos.x === b.endPos.x &&
                      startPos.y === b.startPos.y &&
                      ((b.startPos.z < startPos.z && b.startPos.z > endPos.z) ||
                        (b.endPos.z < startPos.z && b.endPos.z > endPos.z))
                    );
                  } else {
                    return (
                      ((b.startPos.x > startPos.x && b.startPos.x < endPos.x) ||
                        (b.endPos.x > startPos.x && b.endPos.x < endPos.x)) &&
                      startPos.y === b.startPos.y &&
                      startPos.z === b.startPos.z &&
                      startPos.z === b.endPos.z
                    );
                  }
                })
              ) {
                const index = getIndexName(oldBeams, "B");
                // genereate additional beam
                let ab = {
                  id: index,
                  uiId: vRow.id,
                  name: `B${index}`,
                  parent: p.name,
                  type: "PipeRackBeam",
                  tier: vRow.tier,
                  direction: vRow.direction,
                  startPos,
                  endPos,
                  CSLibrary: vRow.CSLibrary,
                  profile: vRow.profile,
                  additional: true,
                  releases: {
                    my1: true,
                    mz1: true,
                    my2: true,
                    mz2: true,
                  },
                } as PipeRackBeam;
                if (vRow.direction === "X") ab.side = "L";
                // getting available beams
                const beams = oldBeams.filter((b) => {
                  if (ab.direction === "Z") {
                    return (
                      b.direction === "X" &&
                      b.startPos.y === ab.startPos.y &&
                      ab.startPos.x >= b.startPos.x &&
                      ab.startPos.x <= b.endPos.x &&
                      b.startPos.z >= p.width / -2 &&
                      b.startPos.z <= p.width / 2
                    );
                  } else {
                    return (
                      b.direction === "Z" &&
                      b.startPos.y === ab.startPos.y &&
                      b.startPos.x >= ab.startPos.x &&
                      b.startPos.x <= ab.endPos.x &&
                      ab.startPos.z <= b.startPos.z &&
                      ab.startPos.z >= b.endPos.z
                    );
                  }
                });
                // split beams
                beams.forEach((b) => {
                  // check the start and end of the beam
                  if (
                    (b.direction === "X" &&
                      ab.direction === "Z" &&
                      (b.startPos.x === ab.startPos.x ||
                        b.endPos.x === ab.startPos.x) &&
                      b.startPos.z !== ab.startPos.z &&
                      b.startPos.z !== ab.endPos.z) ||
                    (b.direction === "Z" &&
                      ab.direction === "X" &&
                      (b.startPos.z === ab.startPos.z ||
                        b.endPos.z === ab.startPos.z) &&
                      b.startPos.x !== ab.startPos.x &&
                      b.endPos.x !== ab.startPos.x &&
                      b.startPos.x !== ab.endPos.x &&
                      b.endPos.x !== ab.endPos.x)
                  ) {
                    // In this case, only the additional beam is splitting
                    const nextId = getIndexName(
                      [...oldBeams, { name: ab.name }],
                      "B"
                    );
                    const nextAb =
                      ab.direction === "Z"
                        ? {
                            ...ab,
                            id: nextId,
                            name: `B${nextId}`,
                            startPos: new Vector3()
                              .add(b.startPos)
                              .setX(ab.startPos.x),
                            next: undefined,
                            releases: splitReleases(ab, true),
                          }
                        : {
                            ...ab,
                            id: nextId,
                            name: `B${nextId}`,
                            startPos: new Vector3()
                              .add(ab.startPos)
                              .setX(b.startPos.x),
                            next: undefined,
                            releases: splitReleases(ab, true),
                          };
                    oldBeams.push({
                      ...ab,
                      endPos: nextAb.startPos,
                      next: nextAb.name,
                      releases: splitReleases(ab),
                    });
                    ab = nextAb;
                  } else if (
                    (b.direction === "X" &&
                      ab.direction === "Z" &&
                      b.endPos.x === ab.startPos.x &&
                      (b.endPos.z === ab.startPos.z ||
                        b.endPos.z === ab.endPos.z)) ||
                    (b.direction === "Z" &&
                      ab.direction === "X" &&
                      b.endPos.z === ab.startPos.z &&
                      (b.endPos.x === ab.startPos.x ||
                        b.endPos.x === ab.endPos.x))
                  ) {
                    oldBeams = oldBeams.map((ob) =>
                      ob.name === b.name
                        ? {
                            ...b,
                            splitters: b.splitters
                              ? [...b.splitters, "AB"]
                              : ["AB"],
                          }
                        : ob
                    );
                  } else if (
                    (b.direction === "X" &&
                      ab.direction === "Z" &&
                      ab.startPos.x > b.startPos.x &&
                      ab.startPos.x < b.endPos.x) ||
                    (b.direction === "Z" &&
                      ab.direction === "X" &&
                      ab.startPos.z < b.startPos.z &&
                      ab.startPos.z > b.endPos.z)
                  ) {
                    const nextId = getIndexName(
                      [...oldBeams, { name: ab.name }],
                      "B"
                    );
                    const nextBeam: PipeRackBeam = {
                      ...b,
                      id: nextId,
                      name: `B${nextId}`,
                      startPos:
                        ab.direction === "Z"
                          ? new Vector3().add(b.startPos).setX(ab.startPos.x)
                          : new Vector3().add(b.startPos).setZ(ab.startPos.z),
                      next: b.next,
                      splitters: b.splitters,
                      releases: splitReleases(b, true),
                    };
                    const prevBeam = {
                      ...b,
                      endPos: nextBeam.startPos,
                      next: nextBeam.name,
                      splitters: ["AB"],
                      releases: splitReleases(b),
                    } as PipeRackBeam;
                    if (
                      ab.direction === "Z" &&
                      ab.startPos.z > b.startPos.z &&
                      ab.endPos.z < b.startPos.z
                    ) {
                      const nextAbId = getIndexName(
                        [
                          ...oldBeams,
                          { name: ab.name },
                          { name: nextBeam.name },
                        ],
                        "B"
                      );
                      const nextAb = {
                        ...ab,
                        id: nextAbId,
                        name: `B${nextAbId}`,
                        startPos: new Vector3()
                          .add(b.startPos)
                          .setX(ab.startPos.x),
                        next: undefined,
                        releases: splitReleases(ab, true),
                      };
                      oldBeams.push({
                        ...ab,
                        endPos: nextAb.startPos,
                        next: nextAb.name,
                        releases: splitReleases(ab),
                      });
                      ab = nextAb;
                    }
                    oldBeams = [
                      ...oldBeams.map((ob) =>
                        ob.name === b.name ? prevBeam : ob
                      ),
                      nextBeam,
                    ];
                  }
                });
                if (!beams.length) {
                  const cantilevers = oldCnts.filter((cnt) => {
                    if (ab.direction === "Z") {
                      return (
                        cnt.startPos.y === ab.startPos.y &&
                        ((cnt.position === "Front" &&
                          ab.startPos.x <= cnt.startPos.x &&
                          ab.startPos.x >= cnt.endPos.x) ||
                          (cnt.position === "Back" &&
                            ab.startPos.x >= cnt.startPos.x &&
                            ab.startPos.x <= cnt.endPos.x)) &&
                        cnt.startPos.z >= p.width / -2 &&
                        cnt.startPos.z <= p.width / 2
                      );
                    } else {
                      return (
                        cnt.startPos.y === ab.startPos.y &&
                        cnt.startPos.x >= ab.startPos.x &&
                        cnt.startPos.x <= ab.endPos.x &&
                        ((cnt.position === "Left" &&
                          ab.startPos.z <= cnt.startPos.z &&
                          ab.startPos.z >= cnt.endPos.z) ||
                          (cnt.position === "Right" &&
                            ab.startPos.z >= cnt.startPos.z &&
                            ab.startPos.z <= cnt.endPos.z))
                      );
                    }
                  });
                  cantilevers.forEach((cnt) => {
                    if (
                      (ab.direction === "Z" &&
                        (cnt.position === "Front" || cnt.position === "Back") &&
                        cnt.endPos.x === ab.startPos.x &&
                        (cnt.endPos.z === ab.startPos.z ||
                          cnt.endPos.z === ab.endPos.z)) ||
                      (ab.direction === "X" &&
                        (cnt.position === "Left" || cnt.position === "Right") &&
                        cnt.endPos.z === ab.startPos.z &&
                        (cnt.endPos.x === ab.startPos.x ||
                          cnt.endPos.x === ab.endPos.x))
                    ) {
                      oldCnts = oldCnts.map((ocnt) =>
                        ocnt.name === cnt.name
                          ? {
                              ...cnt,
                              splitters: cnt.splitters
                                ? [...cnt.splitters, "AB"]
                                : ["AB"],
                            }
                          : ocnt
                      );
                    } else if (
                      (ab.direction === "Z" &&
                        ((cnt.position === "Front" &&
                          ab.startPos.x < cnt.startPos.x &&
                          ab.startPos.x > cnt.endPos.x) ||
                          (cnt.position === "Back" &&
                            ab.startPos.x > cnt.startPos.x &&
                            ab.startPos.x < cnt.endPos.x))) ||
                      (ab.direction === "X" &&
                        ((cnt.position === "Left" &&
                          ab.startPos.z < cnt.startPos.z &&
                          ab.startPos.z > cnt.endPos.z) ||
                          (cnt.position === "Right" &&
                            ab.startPos.z > cnt.startPos.z &&
                            ab.startPos.z < cnt.endPos.z)))
                    ) {
                      const nextId = getIndexName(oldCnts, `CNT-${cnt.side}`);
                      const nextCnt: PipeRackCantilever = {
                        ...cnt,
                        id: nextId,
                        name: `CNT-${cnt.side}${nextId}`,
                        startPos:
                          ab.direction === "Z"
                            ? new Vector3()
                                .add(cnt.startPos)
                                .setX(ab.startPos.x)
                            : new Vector3()
                                .add(cnt.startPos)
                                .setZ(ab.startPos.z),
                        next: cnt.next,
                        splitters: cnt.splitters,
                      };
                      const prevCnt = {
                        ...cnt,
                        endPos: nextCnt.startPos,
                        next: nextCnt.name,
                        splitters: ["AB"],
                      } as PipeRackCantilever;
                      oldCnts = [
                        ...oldCnts.map((ocnt) =>
                          ocnt.name === cnt.name ? prevCnt : ocnt
                        ),
                        nextCnt,
                      ];
                    }
                    // end
                  });
                }
                oldBeams.push(ab);
              }
            });
        });
        oldBeams.sort((a, b) => a.id - b.id);
        setState((prev) => ({
          type: prev.type,
          lib: prev.lib,
          profile: prev.profile,
          thickness: prev.thickness,
          bracingType: prev.bracingType,
          routing: prev.routing,
        }));
        dispatch(
          changeModel({
            ...model,
            beams: oldBeams,
            cantilevers: oldCnts,
          } as PipeRack)
        );
      } else if (isC) {
        const index = getIndexName(model.columns, "C");
        const startPos = new Vector3();
        const endPos = new Vector3();
        if (from.type === "PipeRackBeam") {
          const beam = from as PipeRackBeam;
          startPos.set(
            beam.startPos.x + (beam.direction === "X" ? distance : 0),
            beam.startPos.y,
            beam.startPos.z -
              (beam.direction === "Z"
                ? distance
                : getOffsetB(
                    beam.startPos.x,
                    beam.startPos.z,
                    beam.endPos.x,
                    beam.endPos.z,
                    distance
                  ))
          );
          endPos.set(
            beam.startPos.x + (beam.direction === "X" ? distance : 0),
            to.startPos.y,
            beam.startPos.z -
              (beam.direction === "Z"
                ? distance
                : getOffsetB(
                    beam.startPos.x,
                    beam.startPos.z,
                    beam.endPos.x,
                    beam.endPos.z,
                    distance
                  ))
          );
        } else {
          const beam = from as PipeRackCantilever;
          startPos.set(
            beam.startPos.x +
              (beam.position === "Front"
                ? -distance
                : beam.position === "Back"
                ? distance
                : 0),
            beam.startPos.y,
            beam.startPos.z -
              (beam.position === "Left"
                ? distance
                : beam.position === "Right"
                ? -distance
                : getOffsetB(
                    beam.startPos.x,
                    beam.startPos.z,
                    beam.endPos.x,
                    beam.endPos.z,
                    distance
                  ))
          );
          endPos.set(
            beam.startPos.x +
              (beam.position === "Front"
                ? -distance
                : beam.position === "Back"
                ? distance
                : 0),
            to.startPos.y,
            beam.startPos.z -
              (beam.position === "Left"
                ? distance
                : beam.position === "Right"
                ? -distance
                : getOffsetB(
                    beam.startPos.x,
                    beam.startPos.z,
                    beam.endPos.x,
                    beam.endPos.z,
                    distance
                  ))
          );
        }
        const newItem: PipeRackColumn = {
          id: index,
          name: `C${index}`,
          type: "PipeRackColumn",
          parent: from.name,
          tier: from.tier,
          lowerBeam: from.name,
          upperBeam: to.name,
          startPos,
          endPos,
          orientation: 0,
          CSLibrary: state.lib!,
          profile: state.profile!,
          additional: true,
        };
        setState((prev) => ({
          type: prev.type,
          lib: prev.lib,
          profile: prev.profile,
          thickness: prev.thickness,
          bracingType: prev.bracingType,
          routing: prev.routing,
        }));
        const newColumns = [...model.columns, newItem];
        dispatch(
          changeModel({
            ...model,
            columns: newColumns,
            beams: splitBeamsByColumns(
              concatBeams(model.beams, "C"),
              newColumns
            ),
            cantilevers: splitBeamsByColumns(
              concatBeams(model.cantilevers, "C"),
              newColumns
            ),
          } as PipeRack)
        );
      } else {
        dispatch(
          addEventAction(
            `Additional Beams: Error! Impossible to create element between "${from.name}" and "${state.toElement}"`,
            "danger"
          )
        );
        return setState((prev) => ({
          ...prev,
          toElement: undefined,
          toPoint: undefined,
        }));
      }
    } else if (state.toPoint) {
      const distance = roundM(fromStart.distanceTo(state.fromPoint!));
      const index = getIndexName(model.columns, "C");
      const startPos = new Vector3();
      const endPos = new Vector3();
      if (from.type === "PipeRackBeam") {
        const beam = from as PipeRackBeam;
        startPos.set(
          beam.startPos.x + (beam.direction === "X" ? distance : 0),
          beam.startPos.y,
          beam.startPos.z -
            (beam.direction === "Z"
              ? distance
              : getOffsetB(
                  beam.startPos.x,
                  beam.startPos.z,
                  beam.endPos.x,
                  beam.endPos.z,
                  distance
                ))
        );
        endPos.set(
          beam.startPos.x + (beam.direction === "X" ? distance : 0),
          beam.startPos.y + roundM(state.fromPoint!.distanceTo(state.toPoint)),
          beam.startPos.z -
            (beam.direction === "Z"
              ? distance
              : getOffsetB(
                  beam.startPos.x,
                  beam.startPos.z,
                  beam.endPos.x,
                  beam.endPos.z,
                  distance
                ))
        );
      } else {
        const beam = from as PipeRackCantilever;
        startPos.set(
          beam.startPos.x +
            (beam.position === "Front"
              ? -distance
              : beam.position === "Back"
              ? distance
              : 0),
          beam.startPos.y,
          beam.startPos.z -
            (beam.position === "Left"
              ? distance
              : beam.position === "Right"
              ? -distance
              : getOffsetB(
                  beam.startPos.x,
                  beam.startPos.z,
                  beam.endPos.x,
                  beam.endPos.z,
                  distance
                ))
        );
        endPos.set(
          beam.startPos.x +
            (beam.position === "Front"
              ? -distance
              : beam.position === "Back"
              ? distance
              : 0),
          roundM(state.fromPoint!.distanceTo(state.toPoint)),
          beam.startPos.z -
            (beam.position === "Left"
              ? distance
              : beam.position === "Right"
              ? -distance
              : getOffsetB(
                  beam.startPos.x,
                  beam.startPos.z,
                  beam.endPos.x,
                  beam.endPos.z,
                  distance
                ))
        );
      }
      const newItem: PipeRackColumn = {
        id: index,
        name: `C${index}`,
        type: "PipeRackColumn",
        parent: from.name,
        tier: from.tier,
        lowerBeam: from.name,
        startPos,
        endPos,
        orientation: 0,
        CSLibrary: state.lib!,
        profile: state.profile!,
        additional: true,
      };
      setState((prev) => ({
        type: prev.type,
        lib: prev.lib,
        profile: prev.profile,
        thickness: prev.thickness,
        bracingType: prev.bracingType,
        routing: prev.routing,
      }));
      const newColumns = [...model.columns, newItem];
      dispatch(
        changeModel({
          ...model,
          columns: newColumns,
          beams: splitBeamsByColumns(concatBeams(model.beams, "C"), newColumns),
          cantilevers: splitBeamsByColumns(
            concatBeams(model.cantilevers, "C"),
            newColumns
          ),
        } as PipeRack)
      );
    }
  }
}

function getDirection(
  from: TBeamElement,
  to: TBeamElement | undefined,
  elevation: number
) {
  if (!to) return undefined;
  const columnX = from.startPos.x;
  const columnZ = from.startPos.z;
  if (
    to.startPos.x > columnX &&
    to.startPos.y <= elevation &&
    to.endPos.y >= elevation &&
    to.startPos.z === columnZ
  )
    return "+X";
  if (
    to.startPos.x < columnX &&
    to.startPos.y <= elevation &&
    to.endPos.y >= elevation &&
    to.startPos.z === columnZ
  )
    return "-X";
  if (
    to.startPos.x === columnX &&
    to.startPos.y <= elevation &&
    to.endPos.y >= elevation &&
    to.startPos.z > columnZ
  )
    return "+Z";
  if (
    to.startPos.x === columnX &&
    to.startPos.y <= elevation &&
    to.endPos.y >= elevation &&
    to.startPos.z < columnZ
  )
    return "-Z";
  return undefined;
}

function getCtoCReleases(
  direction: SimpleDirection,
  from: TColumnOF,
  to: TColumnOF
) {
  let releases: Releases = {};
  if (direction === "X") {
    switch (from.orientation) {
      case undefined:
      case 0:
      case 180:
        releases = { ...releases, my1: true, mz1: true };
        break;
      default:
        releases = { ...releases, my1: false, mz1: false };
        break;
    }
    switch (to.orientation) {
      case undefined:
      case 0:
      case 180:
        releases = { ...releases, my2: true, mz2: true };
        break;
      default:
        releases = { ...releases, my2: false, mz2: false };
        break;
    }
  } else {
    switch (from.orientation) {
      case 90:
      case 270:
        releases = { ...releases, my1: true, mz1: true };
        break;
      default:
        releases = { ...releases, my1: false, mz1: false };
        break;
    }
    switch (to.orientation) {
      case 90:
      case 270:
        releases = { ...releases, my2: true, mz2: true };
        break;
      default:
        releases = { ...releases, my2: false, mz2: false };
        break;
    }
  }
  return releases;
}

function getCtoBReleases(direction: SimpleDirection, column: TColumnOF) {
  let releases: Releases = {};
  if (direction === "X") {
    switch (column.orientation) {
      case undefined:
      case 0:
      case 180:
        releases = { ...releases, my1: true, mz1: true };
        break;
      default:
        releases = { ...releases, my1: false, mz1: false };
        break;
    }
  } else {
    switch (column.orientation) {
      case 90:
      case 270:
        releases = { ...releases, my1: true, mz1: true };
        break;
      default:
        releases = { ...releases, my1: false, mz1: false };
        break;
    }
  }
  return releases;
}

function checkBeamToBeam(
  from: TBeamOF | TCantileverOF,
  to: TBeamOF | TCantileverOF | undefined
) {
  if (!to) return false;
  const aSX = roundM(from.startPos.x);
  const aEX = roundM(from.endPos.x);
  const aSZ = roundM(from.startPos.z);
  const aEZ = roundM(from.endPos.z);
  const aY = roundM(from.startPos.y);

  const bY = roundM(to.startPos.y);
  if (aY !== bY) return false;
  if (from.direction.includes("X")) {
    const bSX = roundM(to.startPos.x);
    return (aSX <= bSX && aEX >= bSX) || (aSX >= bSX && aEX <= bSX);
  } else {
    const bSZ = roundM(to.startPos.z);
    return (aSZ >= bSZ && aEZ <= bSZ) || (aSZ <= bSZ && aEZ >= bSZ);
  }
}

function checkColumns(
  from: TBeamOF | TCantileverOF,
  to: TBeamOF | TCantileverOF | undefined,
  pos: Vector3
) {
  if (
    !to ||
    !(
      ((to.direction.includes("X") && from.direction.includes("X")) ||
        (to.direction.includes("Z") && from.direction.includes("Z"))) &&
      to.startPos.y > from.startPos.y
    )
  ) {
    return false;
  }
  const temp = pos.clone().setY(to.startPos.y);
  const d = roundM(to.startPos.distanceTo(to.endPos));
  const d1 = to.startPos.distanceTo(temp);
  const d2 = temp.distanceTo(to.endPos);
  return d === roundM(d1 + d2);
}

function createVerticalBracing(
  ui: ProjectUI | undefined,
  models: Model[],
  state: TOFCreateState,
  setState: SetterOrUpdater<TOFCreateState>,
  dispatch: Dispatch<any>
) {
  if (!ui) return;
  if (!state.lib) {
    dispatch(
      addEventAction(
        `Additional Beams: Warning! Please, select "C/S Lib" for creating element`,
        "warning"
      )
    );
    return setState((prev) => ({
      ...prev,
      toElement: undefined,
      toPoint: undefined,
    }));
  }
  if (!state.profile) {
    dispatch(
      addEventAction(
        `Additional Beams: Warning! Please, select "Profile" for creating element`,
        "warning"
      )
    );
    return setState((prev) => ({
      ...prev,
      toElement: undefined,
      toPoint: undefined,
    }));
  }
  if (!state.bracingType) {
    dispatch(
      addEventAction(
        `Additional Beams: Warning! Please, select "Type" for creating element`,
        "warning"
      )
    );
    return setState((prev) => ({
      ...prev,
      toElement: undefined,
      toPoint: undefined,
    }));
  }
  if (!state.fromSecondElement || !state.toSecondElement) return;
  const model = models.find((m) => m.name === state.model) as TOpenFrame;
  if (!model) return;
  const columns = model?.columns ?? [];
  const from = columns.find((c) => c.name === state.fromElement);
  const to = filterColumns(columns, from).find(
    (c) => c.name === state.toElement
  );
  const { beams } = getBeams(model?.beams, from, to);
  const fromBeam = beams.find((c) => c.name === state.fromSecondElement);
  const toBeam = beams.find((c) => c.name === state.toSecondElement);
  if (!from || !to || !fromBeam || !toBeam) {
    dispatch(
      addEventAction(
        `Additional Beams: Error! Impossible to create element between "${state.fromElement}", "${state.toElement}", "${state.fromSecondElement}", "${state.toSecondElement}", First Select Columns and then Beams`,
        "danger"
      )
    );
    return setState((prev) => ({
      ...prev,
      toElement: undefined,
      fromSecondElement: undefined,
      toSecondElement: undefined,
    }));
  }
  const newUI: OFVerticalBracingsUI = {
    id: getNextId(ui.openFrameUI.additionalBeams.verticalBracings),
    selected: false,
    model: model.name,
    fromColumn: from.name,
    toColumn: to.name,
    library: state.lib,
    profile: state.profile,
    type: state.bracingType,
    fromBeam: fromBeam.name,
    toBeam: toBeam.name,
  };
  const fromElevation = fromBeam.startPos.y;
  const toElevation = toBeam.startPos.y;
  const id = getNextId(model.verticalBracings);
  let newModel = { ...model };
  if (newUI.type === "Diagonal Up" || newUI.type === "Diagonal Down") {
    const isUp = newUI.type === "Diagonal Up";
    newModel = updateConnections(
      model,
      createVBracing(id, from, to, fromElevation, toElevation, newUI, isUp),
      () => {}
    );
  } else {
    newModel = updateConnections(
      updateConnections(
        model,
        createVBracing(id, from, to, fromElevation, toElevation, newUI, true),
        () => {}
      ),
      createVBracing(
        id + 1,
        from,
        to,
        fromElevation,
        toElevation,
        newUI,
        false
      ),
      () => {}
    );
  }
  setState((prev) => ({
    type: prev.type,
    lib: prev.lib,
    profile: prev.profile,
    thickness: prev.thickness,
    bracingType: prev.bracingType,
    routing: prev.routing,
  }));
  dispatch(changeModel(newModel));
  dispatch(
    changeOFUIAction({
      ...ui.openFrameUI,
      additionalBeams: {
        ...ui.openFrameUI.additionalBeams,
        verticalBracings: [
          ...ui.openFrameUI.additionalBeams.verticalBracings,
          newUI,
        ],
      },
    })
  );
}

function createHorizontalBracing(
  ui: ProjectUI | undefined,
  models: Model[],
  state: TOFCreateState,
  setState: SetterOrUpdater<TOFCreateState>,
  dispatch: Dispatch<any>
) {
  if (!ui || !state.toElement || !state.toPoint) return;
  if (!state.lib) {
    dispatch(
      addEventAction(
        `Additional Beams: Warning! Please, select "C/S Lib" for creating element`,
        "warning"
      )
    );
    return setState((prev) => ({
      ...prev,
      toElement: undefined,
      toPoint: undefined,
    }));
  }
  if (!state.profile) {
    dispatch(
      addEventAction(
        `Additional Beams: Warning! Please, select "Profile" for creating element`,
        "warning"
      )
    );
    return setState((prev) => ({
      ...prev,
      toElement: undefined,
      toPoint: undefined,
    }));
  }
  const model = models.find((m) => m.name === state.model) as TOpenFrame;
  if (!model) return;
  const beams = [...model.beams, ...model.cantilevers];
  const from = beams.find((el) => el.name === state.fromElement);
  const to = getToBeams({
    beams,
    beam: from,
    frames: model.frames,
    filterByFrame: false,
  }).find((el) => el.name === state.toElement);
  if (!from || !to) {
    dispatch(
      addEventAction(
        `Additional Beams: Error! Impossible to create element between "${state.fromElement}" and "${state.toElement}"`,
        "danger"
      )
    );
    return setState((prev) => ({
      ...prev,
      toElement: undefined,
    }));
  }

  const fromStart = roundVectorM(
    localToGlobal(model.startPos, from.startPos, model.direction)
  );
  const toStart = roundVectorM(
    localToGlobal(model.startPos, to.startPos, model.direction)
  );

  const fromBeamDFS = roundM(fromStart.distanceTo(state.fromPoint!));
  const startPos = roundVectorM(
    getPosByDistance(fromBeamDFS, from.startPos, from.endPos)
  );
  const toBeamDFS = roundM(toStart.distanceTo(state.toPoint!));
  const endPos = roundVectorM(
    getPosByDistance(toBeamDFS, to.startPos, to.endPos)
  );

  const newUI: OFPlanBracingsUI = {
    id: getNextId(ui.openFrameUI.additionalBeams.planBracings),
    selected: false,
    library: state.lib,
    profile: state.profile,
    model: model.name,
    fromBeam: from.name,
    fromBeamDFS,
    toBeam: to.name,
    toBeamDFS,
  };
  const id = getNextId(model.horizontalBracings);
  const newItem: THorizontalBracingOF = {
    id,
    uiId: newUI.id,
    type: "HORIZONTAL-BRACING",
    name: `HB${id}`,
    frame: from.frame,
    startPos,
    endPos,
    // @ts-ignore
    connectedTo: from.type,
    profile: state.profile!,
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
  if (roundM(newItem.startPos.distanceTo(newItem.endPos)) === 0) {
    dispatch(
      addEventAction(`The element "${newItem.name}" has zero length`, "danger")
    );
  }
  setState((prev) => ({
    type: prev.type,
    lib: prev.lib,
    profile: prev.profile,
    thickness: prev.thickness,
    bracingType: prev.bracingType,
    routing: prev.routing,
  }));
  dispatch(changeModel(updateConnections(model, newItem, () => {})));
  dispatch(
    changeOFUIAction({
      ...ui.openFrameUI,
      additionalBeams: {
        ...ui.openFrameUI.additionalBeams,
        planBracings: [...ui.openFrameUI.additionalBeams.planBracings, newUI],
      },
    })
  );
}

function createKneeBracing(
  ui: ProjectUI | undefined,
  models: Model[],
  state: TOFCreateState,
  setState: SetterOrUpdater<TOFCreateState>,
  dispatch: Dispatch<any>
) {
  if (!ui || !state.toElement || !state.toPoint) return;
  if (!state.lib) {
    dispatch(
      addEventAction(
        `Additional Beams: Warning! Please, select "C/S Lib" for creating element`,
        "warning"
      )
    );
    return setState((prev) => ({
      ...prev,
      toElement: undefined,
      toPoint: undefined,
    }));
  }
  if (!state.profile) {
    dispatch(
      addEventAction(
        `Additional Beams: Warning! Please, select "Profile" for creating element`,
        "warning"
      )
    );
    return setState((prev) => ({
      ...prev,
      toElement: undefined,
      toPoint: undefined,
    }));
  }
  const model = models.find((m) => m.name === state.model) as TOpenFrame;
  if (!model) return;
  const beams = [...model.beams, ...model.cantilevers];
  const from = beams.find((b) => b.name === state.fromElement);
  const to = model.columns.find((el) => el.name === state.toElement);
  if (
    !from ||
    !to ||
    !(
      from.startConnected.includes(to.name) ||
      from.endConnected.includes(to.name)
    )
  ) {
    dispatch(
      addEventAction(
        `Additional Beams: Error! Impossible to create element between "${state.fromElement}" and "${state.toElement}"`,
        "danger"
      )
    );
    return setState((prev) => ({
      ...prev,
      toElement: undefined,
    }));
  }
  let isStart = false;
  const center = new Vector3();
  if (from.startConnected.includes(to.name)) {
    center.copy(from.startPos);
    isStart = true;
  } else {
    center.copy(from.endPos);
  }
  const fromStart = roundVectorM(
    localToGlobal(model.startPos, center, model.direction)
  );

  const fromBeamJunction = roundM(fromStart.distanceTo(state.fromPoint!));
  const startPos = roundVectorM(
    getPosByDistance(
      fromBeamJunction,
      isStart ? from.startPos : from.endPos,
      isStart ? from.endPos : from.startPos
    )
  );
  const fromColumnJunction = roundM(fromStart.distanceTo(state.toPoint!));
  const endPos = roundVectorM(
    getPosByDistance(
      fromColumnJunction,
      isStart ? from.startPos : from.endPos,
      to.startPos
    )
  );

  const newUI: OFKneeBracingsUI = {
    id: getNextId(ui.openFrameUI.additionalBeams.kneeBracings),
    selected: false,
    model: model.name,
    beam: from.name,
    column: to.name,
    library: state.lib,
    profile: state.profile,
    fromBeamJunction,
    fromColumnJunction,
  };
  const id = getNextId(model.kneeBracings);
  const newItem: TKneeBracingOF = {
    id,
    uiId: newUI.id,
    type: "KNEE-BRACING",
    name: `KB${id}`,
    frame: from.frame,
    startPos,
    endPos,
    profile: state.profile!,
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
  if (roundM(newItem.startPos.distanceTo(newItem.endPos)) === 0) {
    dispatch(
      addEventAction(`The element "${newItem.name}" has zero length`, "danger")
    );
  }
  setState((prev) => ({
    type: prev.type,
    lib: prev.lib,
    profile: prev.profile,
    thickness: prev.thickness,
    bracingType: prev.bracingType,
    routing: prev.routing,
  }));
  dispatch(changeModel(updateConnections(model, newItem, () => {})));
  dispatch(
    changeOFUIAction({
      ...ui.openFrameUI,
      additionalBeams: {
        ...ui.openFrameUI.additionalBeams,
        kneeBracings: [...ui.openFrameUI.additionalBeams.kneeBracings, newUI],
      },
    })
  );
}

function createPlatform(
  ui: ProjectUI | undefined,
  models: Model[],
  state: TOFCreateState,
  setState: SetterOrUpdater<TOFCreateState>,
  dispatch: Dispatch<any>
) {
  if (!ui) return;
  const model = models.find((m) => m.name === state.model) as TOpenFrame;
  if (!model) return;
  const beams = [...model.beams, ...model.cantilevers];
  const from = beams.find((b) => b.name === state.fromElement);
  const toBeams = getPlatformBeams(beams, from);
  const to = toBeams.find((b) => b.name === state.toElement);
  if (!from || !to) {
    dispatch(
      addEventAction(
        `Additional Beams: Error! Impossible to create element between "${state.fromElement}" and "${state.toElement}"`,
        "danger"
      )
    );
    return setState((prev) => ({
      ...prev,
      toElement: undefined,
      toPoint: undefined,
    }));
  }
  const distances = getLeftDistances(beams, from, to);
  const widths = getWidths(distances, 0);
  const newUI: OFPlatformUI = {
    id: getNextId(ui.openFrameUI.platforms),
    distanceFromLeft: 0,
    name: `P${getIndexName(
      ui.openFrameUI.platforms.filter((el) => el.model === model.name),
      "P"
    )}`,
    selected: false,
    thickness: state.thickness ?? 1,
    width: widths.reduce((max, el) => Math.max(max, el), 0),
    from: from.name,
    to: to.name,
    model: model.name,
  };
  const newItem: TPlatformOF = {
    id: newUI.id,
    name: newUI.name,
    distance: 0,
    from: from.name,
    to: to.name,
    thickness: newUI.thickness,
    width: newUI.width,
  };
  setState((prev) => ({
    type: prev.type,
    lib: prev.lib,
    profile: prev.profile,
    thickness: prev.thickness,
    bracingType: prev.bracingType,
    routing: prev.routing,
  }));
  dispatch(
    changeModel({
      ...model,
      platforms: [...model.platforms, newItem],
    } as TOpenFrame)
  );
  dispatch(
    changeOFUIAction({
      ...ui.openFrameUI,
      platforms: [...ui.openFrameUI.platforms, newUI],
    })
  );
}

function createCableTray(
  ui: ProjectUI | undefined,
  models: Model[],
  state: TOFCreateState,
  setState: SetterOrUpdater<TOFCreateState>,
  dispatch: Dispatch<any>
) {
  if (!ui) return;
  const model = models.find((m) => m.name === state.model) as TOpenFrame;
  if (!model) return;
  const columns = [...model.columns, ...model.beams, ...model.cantilevers];
  const from = columns.find((b) => b.name === state.fromElement);
  const to = columns.find((b) => b.name === state.toElement);
  const height =
    state.fromPoint && state.toPoint
      ? state.fromPoint.distanceTo(state.toPoint)
      : 3;
  const profile = (state.modelType ? to : from)?.profile;
  const width = MMtoM(profile?.d_global ?? 10000);
  const newUI: OFCableTrayUI = {
    id: getNextId(ui.openFrameUI.cableTrays),
    name: `LadderOF-LD${getIndexName(
      ui.openFrameUI.cableTrays?.filter((el) => el.model === model.name) ?? [],
      "LadderOF-LD"
    )}`,
    selected: false,
    // width: widths.reduce((max, el) => Math.max(max, el), 0),
    profile,
    from: state.fromPoint,
    to: state.toPoint,
    direction: state.toElementDirection,
    model: model.name,
    distance: state.distance ?? width / 2,
    width,
    height,
  };
  const newItem: TCableTrayOF = {
    id: newUI.id,
    from: newUI.from ?? model.startPos,
    profile: newUI?.profile,
    to: newUI.to ?? model.startPos,
    direction: newUI.direction,
    name: newUI.name,
    type: "CABLE_TRAY",
    distance: newUI.distance,
    width,
    height,
  };
  setState((prev) => ({
    type: prev.type,
    lib: prev.lib,
    profile: prev.profile,
    thickness: prev.thickness,
    bracingType: prev.bracingType,
    routing: prev.routing,
    fromElement: prev.toElement,
    fromElementType: to?.type,
    fromPoint: prev.toPoint,
    toElement: undefined,
    model: prev.model,
    toPoint: undefined,
    distance: prev.distance,
  }));
  dispatch(
    changeModel({
      ...model,
      cableTrays: [...(model.cableTrays ?? []), newItem],
    } as TOpenFrame)
  );
  dispatch(
    changeOFUIAction({
      ...ui.openFrameUI,
      cableTrays: [...(ui.openFrameUI.cableTrays ?? []), newUI],
    })
  );
}

function getPlatformBeams(beams: TBeamElement[], beam?: TBeamElement) {
  if (!beam) return [];
  const sxb = roundM(beam.startPos.x);
  const exb = roundM(beam.endPos.x);
  const szb = roundM(beam.startPos.z);
  const ezb = roundM(beam.endPos.z);
  const yb = roundM(beam.endPos.y);
  const filtered = beams.filter((item) => {
    const sxi = roundM(item.startPos.x);
    const exi = roundM(item.endPos.x);
    const szi = roundM(item.startPos.z);
    const ezi = roundM(item.endPos.z);
    const yi = roundM(item.endPos.y);
    if (
      item.name === beam.name ||
      yi !== yb ||
      !((sxi === exi && sxb === exb) || (szi === ezi && szb === ezb))
    )
      return false;
    if (szb === ezb) {
      if (hardCheckRange(sxi, sxb, exb) && hardCheckRange(exi, sxb, exb)) {
        return true;
      } else if (
        hardCheckRange(sxb, sxi, exi) &&
        hardCheckRange(exb, sxi, exi)
      ) {
        return true;
      } else if (
        checkRange(sxi, sxb, exb, true, false) &&
        !checkRange(exi, sxb, exb)
      ) {
        return true;
      } else if (
        !checkRange(sxi, sxb, exb) &&
        checkRange(exi, sxb, exb, false, true)
      ) {
        return true;
      } else return false;
    } else {
      if (hardCheckRange(szi, szb, ezb) && hardCheckRange(ezi, szb, ezb)) {
        return true;
      } else if (
        hardCheckRange(szb, szi, ezi) &&
        hardCheckRange(ezb, szi, ezi)
      ) {
        return true;
      } else if (
        checkRange(szi, szb, ezb, true, false) &&
        !checkRange(ezi, szb, ezb)
      ) {
        return true;
      } else if (
        !checkRange(szi, szb, ezb) &&
        checkRange(ezi, szb, ezb, false, true)
      ) {
        return true;
      } else return false;
    }
  });
  return filtered;
}
