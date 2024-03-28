import {
  LoadedProject,
  Project,
  PipeRack,
  AccessoryElement,
  Loadings,
  TDashboard,
  TDashboardBudget,
  Model,
  FreePipe,
  ModelType,
} from "../../../store/main/types";
import { getIndexName } from "../../3d-models/utils";
import {
  initPipingLoad,
  initPipeDesignCode,
  initSettings,
  dampingRatios,
} from "../../../store/main/constants";
import { loadProject, createProject } from "../../../store/main/actions";
import { loadUIAction, addEventAction } from "../../../store/ui/actions";
import { TOpenFrame } from "../../../store/main/openFrameTypes";
import { Dispatch } from "redux";
import { Vector3 } from "three";
import { TPipeLoadings } from "../../../store/main/pipeTypes";
import { LoadingsUI, ProjectUI } from "../../../store/ui/types";
import { loadProcessAction } from "../../../store/process/actions";
import { fixImportedProcess } from "../../3d-models/process/process";
import { focusTarget } from "../../../store/scene/actions";
import {
  createAccessoryColumns,
  createAccessoryBeams,
} from "../../3d-models/pipe-rack/pipeRackUtils";
import { pipeOldDesignCode } from "../../../store/data/constants";
import { TFlare } from "../../../store/main/types/flare";
import { initialStateProjectUI } from "../../../store/ui/initialState";

function focusCamera(dispatch: Dispatch, camera: any) {
  if (!camera) return;
  dispatch(
    focusTarget(
      new Vector3(camera.target.x, camera.target.y, camera.target.z),
      new Vector3(camera.position.x, camera.position.y, camera.position.z)
    )
  );
}

export function openProcess(
  dispatch: Dispatch,
  projects: Project[],
  lp: any,
  name: string
) {
  try {
    let newName = name;
    if (projects.some((project) => project.name === newName)) {
      newName += getIndexName(projects, newName);
    }
    if (lp.project) {
      const loadedProject: LoadedProject = {
        project: {
          ...lp.project,
          flares: [],
          towers: [],
          models: [],
          freePipes: [],
          locked: false,
          modelType: undefined,
          mode: "standard",
          name: newName,
          settings: { ...initSettings, ...lp.project.settings },
          dashboard: fixDashboard(lp.project.dashboard),
        },
        fabricatedSections: lp.fabricatedSections ?? [],
        rolledSections: lp.rolledSections ?? [],
        combinedSections: lp.combinedSections ?? [],
        userDefinedElbows: lp.userDefinedElbows ?? [],
      };
      dispatch(loadProject(loadedProject));
    } else dispatch(createProject(newName));
    dispatch(loadProcessAction(newName, fixImportedProcess(lp)));
    focusCamera(dispatch, lp.camera);
  } catch (error) {
    dispatch(addEventAction(`Open process: ${error.message}`, "danger"));
  }
}

export function openProject(
  dispatch: Dispatch,
  projects: Project[],
  lp: LoadedProject,
  name: string,
  typeOfModels: ModelType | undefined
) {
  try {
    if (!lp || !lp.project) {
      throw new Error("Parse error");
    }
    let newName = name;
    if (projects.some((project) => project.name === newName)) {
      newName += getIndexName(projects, newName);
    }
    const modelType =
      typeOfModels ??
      lp.project.modelType ??
      (lp.project.flares?.length
        ? "Flare"
        : lp.project.models.some((m) => m.type === "Pipe Rack")
        ? "Pipe Rack"
        : lp.project.models.some((m) => m.type === "Open Frame")
        ? "Open Frame"
        : lp.project.models.some((m) => m.type === "Factory Shed")
        ? "Factory Shed"
        : undefined);
    const models = fixModels(lp.project.models).filter((m) =>
      modelType ? m.type === modelType : true
    );
    const loadedProject = {
      ...lp,
      fabricatedSections: lp.fabricatedSections ?? [],
      rolledSections: lp.rolledSections ?? [],
      combinedSections: lp.combinedSections ?? [],
      userDefinedElbows: lp.userDefinedElbows ?? [],
      project: {
        ...lp.project,
        name: newName,
        models,
        flares:
          modelType === "Flare"
            ? fixFlares(lp.project.flares ?? [], newName)
            : [],
        towers: [],
        freePipes:
          !modelType || modelType === "Pipe Line"
            ? fixPipes(lp.project.freePipes ?? [])
            : [],
        modelType:
          !modelType || modelType === "Pipe Line" ? undefined : modelType,
        mode: "standard",
        loadings: fixLoadings(lp.project.loadings),
        pipeLoadings: lp.project.pipeLoadings
          ? fixPipingLoads(lp.project.pipeLoadings)
          : { ...initPipingLoad },
        pipeDesignCode: lp.project.pipeDesignCode
          ? {
              ...lp.project.pipeDesignCode,
              deflectionLimit: lp.project.pipeDesignCode.deflectionLimit ?? 13,
              designCode:
                pipeOldDesignCode[lp.project.pipeDesignCode.designCode!] ??
                lp.project.pipeDesignCode.designCode,
            }
          : { ...initPipeDesignCode },
        settings: { ...initSettings, ...lp.project.settings },
        notEditableProcesses: lp.project.notEditableProcesses?.map((nep) => ({
          ...nep,
          process: fixImportedProcess(nep.process),
        })),
        dashboard: fixDashboard(lp.project.dashboard),
      } as Project,
    };
    dispatch(loadProject(loadedProject));
    focusCamera(dispatch, lp.camera);
    if (loadedProject.ui) {
      let ui: ProjectUI = { ...loadedProject.ui, requests: {} };
      if (ui.openFrameUI?.loadingsUI) {
        ui = {
          ...ui,
          openFrameUI: {
            ...ui.openFrameUI,
            loadingsUI: fixOFLoadings(ui.openFrameUI.loadingsUI),
          },
        };
      }
      dispatch(loadUIAction(ui, newName));
    } else dispatch(loadUIAction(initialStateProjectUI, newName));
  } catch (e) {
    dispatch(addEventAction(`Open project: ${e.message}`, "danger"));
  }
}

export function openDesigner(
  dispatch: Dispatch,
  projects: Project[],
  lp: any,
  name: string
) {
  try {
    let newName = name;
    if (projects.some((project) => project.name === newName)) {
      newName += getIndexName(projects, newName);
    }

    if (lp && lp.project) {
      const models = fixModels(lp.project.models);
      const loadedProject = {
        ...lp,
        fabricatedSections: lp.fabricatedSections ?? [],
        rolledSections: lp.rolledSections ?? [],
        combinedSections: lp.combinedSections ?? [],
        userDefinedElbows: lp.userDefinedElbows ?? [],
        project: {
          ...lp.project,
          name: newName,
          flares: fixFlares(lp.project.flares ?? [], newName),
          towers: [],
          models,
          freePipes: fixPipes(lp.project.freePipes ?? []),
          modelType: undefined,
          mode: "standard",
          loadings: fixLoadings(lp.project.loadings),
          pipeLoadings: lp.project.pipeLoadings
            ? fixPipingLoads(lp.project.pipeLoadings)
            : { ...initPipingLoad },
          pipeDesignCode: lp.project.pipeDesignCode
            ? {
                ...lp.project.pipeDesignCode,
                deflectionLimit:
                  lp.project.pipeDesignCode.deflectionLimit ?? 13,
                designCode:
                  pipeOldDesignCode[lp.project.pipeDesignCode.designCode!] ??
                  lp.project.pipeDesignCode.designCode,
              }
            : { ...initPipeDesignCode },
          settings: { ...initSettings, ...lp.project.settings },
          dashboard: fixDashboard(lp.project.dashboard),
        } as Project,
      };
      dispatch(loadProject(loadedProject));
      if (loadedProject.ui) {
        let ui: ProjectUI = { ...loadedProject.ui, requests: {} };
        if (ui.openFrameUI?.loadingsUI) {
          ui = {
            ...ui,
            openFrameUI: {
              ...ui.openFrameUI,
              loadingsUI: fixOFLoadings(ui.openFrameUI.loadingsUI),
            },
          };
        }
        dispatch(loadUIAction(ui, newName));
      } else dispatch(loadUIAction(initialStateProjectUI, newName));
    } else dispatch(createProject(newName));
    dispatch(loadProcessAction(newName, fixImportedProcess(lp)));

    focusCamera(dispatch, lp.camera);
  } catch (error) {
    dispatch(addEventAction(`Open designer: ${error.message}`, "danger"));
  }
}

function fixModels(models: Model[]): Model[] {
  const fixed: Model[] = [];
  for (const m of models) {
    if (m.type === "Pipe Rack") {
      fixed.push(fixPipeRack(m as PipeRack));
    } else if (
      ["Open Frame", "ROAD",  "Factory Shed"].includes(m.type)
    ) {
      fixed.push(fixOpenFrame(m as TOpenFrame));
    }
  }
  return fixed;
}

export function fixPipeRack(pr: PipeRack) {
const fixed: PipeRack = {
    ...pr,
    startPos: fixVector(pr.startPos),
    columns: fixElements(pr.columns),
    beams: fixElements(pr.beams),
    cantilevers: fixElements(pr.cantilevers),
    vBracings: fixElements(pr.vBracings),
    pipes: pr.pipes.map((pipe) => ({
      ...pipe,
      start: fixVector(pipe.start),
      end: fixVector(pipe.end),
    })),
    accessories: pr.accessories.map((ag: any) => ({
      ...ag,
      elements: ag.elements.map((el: AccessoryElement) => ({
        ...el,
        colItems: el.colItems
          ? fixElements(el.colItems)
          : createAccessoryColumns(pr, ag, el),
        beamItems: el.beamItems
          ? fixElements(el.beamItems)
          : createAccessoryBeams(pr, ag, el),
      })),
    })),
  } as PipeRack;
  return fixed;
}

export function fixOpenFrame(of: TOpenFrame) {
  const fixed: TOpenFrame = {
    ...of,
    startPos: fixVector(of.startPos),
    columns: fixElements(of.columns).map((el) => ({
      ...el,
      pos: fixVector(el.pos),
    })),
    beams: fixElements(of.beams),
    cantilevers: fixElements(of.cantilevers),
    kneeBracings: fixElements(of.kneeBracings),
    verticalBracings: fixElements(of.verticalBracings),
    horizontalBracings: fixElements(of.horizontalBracings),
    staircases: of.staircases ? fixElements(of.staircases) : [],
    pipes: fixElements(of.pipes),
  };
  return fixed;
}

export function fixFlares(flares: TFlare[], project: string): TFlare[] {
  return flares.map((f: TFlare) => {
    return {
      ...f,
      project,
    };
  });
}

export function fixPipes(pipes: FreePipe[]): FreePipe[] {
  return pipes.map((fp) => ({
    ...fp,
    params: {
      ...fp.params,
      startFlangeLoads: fp.params.startFlangeLoads
        ? {
            ...fp.params.startFlangeLoads,
            code: fp.params.startFlangeLoads.code ?? "API 517",
          }
        : undefined,
      endFlangeLoads: fp.params.endFlangeLoads
        ? {
            ...fp.params.endFlangeLoads,
            code: fp.params.endFlangeLoads.code ?? "API 517",
          }
        : undefined,
    },
  }));
}

function fixLoadings(l: Loadings): Loadings {
  return {
    ...l,
    modalCombinationMethod: l.modalCombinationMethod ?? "CQC",
    usSeismicCode: {
      S_S: l.usSeismicCode?.S_S ?? 0.35,
      S_1: l.usSeismicCode?.S_1 ?? 0.08,
      siteClass: l.usSeismicCode?.siteClass ?? "C",
      category: l.usSeismicCode?.category ?? "III",
      T_L: l.usSeismicCode?.T_L ?? 1,
      R: l.usSeismicCode?.R ?? 3.5,
      dampingRatio: l.usSeismicCode?.dampingRatio ?? dampingRatios[1],
      importanceFactor: l.usSeismicCode?.importanceFactor ?? 1.25,
      structureHeight: l.usSeismicCode?.structureHeight ?? 20,
      structureType:
        l.usSeismicCode?.structureType ?? "Steel moment-resisting frames",
      timePeriod: l.usSeismicCode?.timePeriod ?? 0.31,
    },
  };
}

function fixPipingLoads(l: TPipeLoadings) {
  return {
    ...l,
    seismicLoads: {
      ...l.seismicLoads,
      usSeismicCode: {
        S_S: l.seismicLoads.usSeismicCode?.S_S ?? 0.35,
        S_1: l.seismicLoads.usSeismicCode?.S_1 ?? 0.08,
        siteClass: l.seismicLoads.usSeismicCode?.siteClass ?? "C",
        category: l.seismicLoads.usSeismicCode?.category ?? "III",
        T_L: l.seismicLoads.usSeismicCode?.T_L ?? 1,
        R: l.seismicLoads.usSeismicCode?.R ?? 3.5,
        dampingRatio:
          l.seismicLoads.usSeismicCode?.dampingRatio ?? dampingRatios[1],
        importanceFactor:
          l.seismicLoads.usSeismicCode?.importanceFactor ?? 1.25,
        structureHeight: l.seismicLoads.usSeismicCode?.structureHeight ?? 20,
        structureType:
          l.seismicLoads.usSeismicCode?.structureType ??
          "Steel moment-resisting frames",
        timePeriod: l.seismicLoads.usSeismicCode?.timePeriod ?? 0.31,
      },
    },
  };
}

function fixOFLoadings(l: LoadingsUI): LoadingsUI {
  return {
    ...l,
    seismicLoadsUI: {
      ...l.seismicLoadsUI,
      modalCombinationMethod: l.seismicLoadsUI.modalCombinationMethod ?? "CQC",
      usSeismicCode: {
        S_S: l.seismicLoadsUI.usSeismicCode?.S_S ?? 0.35,
        S_1: l.seismicLoadsUI.usSeismicCode?.S_1 ?? 0.08,
        siteClass: l.seismicLoadsUI.usSeismicCode?.siteClass ?? "C",
        category: l.seismicLoadsUI.usSeismicCode?.category ?? "III",
        T_L: l.seismicLoadsUI.usSeismicCode?.T_L ?? 1,
        R: l.seismicLoadsUI.usSeismicCode?.R ?? 3.5,
        dampingRatio:
          l.seismicLoadsUI.usSeismicCode?.dampingRatio ?? dampingRatios[1],
        importanceFactor:
          l.seismicLoadsUI.usSeismicCode?.importanceFactor ?? 1.25,
        structureHeight: l.seismicLoadsUI.usSeismicCode?.structureHeight ?? 20,
        structureType:
          l.seismicLoadsUI.usSeismicCode?.structureType ??
          "Steel moment-resisting frames",
        timePeriod: l.seismicLoadsUI.usSeismicCode?.timePeriod ?? 0.31,
      },
    },
  };
}

function fixDashboard(dashboard?: TDashboard): TDashboard | undefined {
  if (!dashboard) return;
  return {
    ...dashboard,
    budget: fixDashboardBudget(dashboard.budget),
  };
}

function fixDashboardBudget(
  budget?: TDashboardBudget
): TDashboardBudget | undefined {
  if (!budget) return;
  return {
    ...budget,
    categories: budget.categories?.map((cat) => {
      return {
        ...cat,
        activities: cat.activities.map((act) => {
          return {
            ...act,
            actualStart: act.actualStart
              ? new Date(act.actualStart)
              : undefined,
            start: act.start ? new Date(act.start) : undefined,
          };
        }),
      };
    }),
  };
}

function fixElements<T extends { startPos: any; endPos: any }>(elements: T[]) {
  return elements.map((item) => fixVectors(item));
}

function fixVectors<T extends { startPos: any; endPos: any }>(el: T) {
  return {
    ...el,
    startPos: fixVector(el.startPos),
    endPos: fixVector(el.endPos),
  };
}

function fixVector<T extends { x: number; y: number; z: number }>(vector: T) {
  return new Vector3(vector.x, vector.y, vector.z);
}
