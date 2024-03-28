import { ActionType, createReducer } from "typesafe-actions";
import { MainActionTypes, MainState, FreePipe, Project, FreeCable } from "./types";
import * as actions from "./actions";
import {
  concatUnique,
  getIndexName,
  getNextId,
} from "../../components/3d-models/utils";
import {
  initialAmericanDesignCode,
  initialIndianDesignCode,
  initialState,
  initLadderParams,
  initLoadings,
  initPipingLoad,
  initSettings,
  initPipeDesignCode,
  initialPipe,
  initialCable,
} from "./constants";
import {
  Section,
  RolledSection,
  CombinedSection,
  TPipingElbow,
} from "../data/types";
import { TFlare, TFlareSegment } from "./types/flare";
import {
  handleChangeFlare,
  handleCreateFlare,
  handleDeleteFlare,
} from "./handlers/flare";

export type MainAction = ActionType<typeof actions>;

const reducer = createReducer<MainState, MainAction>(initialState)
  .handleType(MainActionTypes.SET_PRODUCTS, (state, action) => ({
    ...state,
    products: action.payload.products,
  }))
  .handleType(MainActionTypes.CHANGE_WORK_MODE, (state, action) => ({
    ...state,
    workMode: action.payload.mode,
  }))
  .handleType(MainActionTypes.CHANGE_ACTIVE_TAB, (state, action) => ({
    ...state,
    activeTab: action.payload.tabName,
  }))
  .handleType(MainActionTypes.LOAD_PROJECT, (state, action) => {
    state.projects
      .find((project) => project.name === state.currentProject)
      ?.models.forEach((model) => {
        const obj = state.scene.getObjectByName(model.name);
        obj && state.scene.remove(obj);
      });
    return {
      ...state,
      currentProject: action.payload.project.project.name,
      projects: [
        ...state.projects,
        {
          ...action.payload.project.project,
          name: action.payload.project.project.name,
          models: action.payload.project.project.models.map((model) => ({
            ...model,
            project: action.payload.project.project.name,
          })),
        },
      ],
      fabricatedSections:
        concatUnique<Section>(
          state.fabricatedSections,
          action.payload.project.fabricatedSections,
          (a, b) =>
            a.designation === b.designation &&
            a.shape === b.shape &&
            a.d_global === b.d_global &&
            a.bf_global === b.bf_global &&
            a.tf_global === b.tf_global &&
            a.tfb_global === b.tfb_global &&
            a.tw_global === b.tw_global
        ) ?? [],
      rolledSections:
        concatUnique<RolledSection>(
          state.rolledSections,
          action.payload.project.rolledSections,
          (a, b) =>
            a.designation === b.designation &&
            a.baseLib === b.baseLib &&
            a.baseProfile === b.baseProfile &&
            a.tpWidth === b.tpWidth &&
            a.tpThickness === b.tpThickness &&
            a.bpWidth === b.bpWidth &&
            a.bpThickness === b.bpThickness
        ) ?? [],
      combinedSections:
        concatUnique<CombinedSection>(
          state.combinedSections,
          action.payload.project.combinedSections,
          (a, b) =>
            a.CSLibrary === b.CSLibrary &&
            a.baseProfile === b.baseProfile &&
            a.designation === b.designation &&
            a.combination === b.combination &&
            a.type === b.type &&
            a.gap === b.gap
        ) ?? [],
      userDefinedElbows:
        concatUnique<TPipingElbow>(
          state.userDefinedElbows,
          action.payload.project.userDefinedElbows,
          (a, b) =>
            a.nps === b.nps &&
            a.schedule === b.schedule &&
            a.material === b.material &&
            a.d === b.d &&
            a.t === b.t &&
            a.a === b.a &&
            a.degree === b.degree
        ) ?? [],
    };
  })
  .handleType(MainActionTypes.CREATE_PROJECT, (state, action) => {
    state.projects
      .find((project) => project.name === state.currentProject)
      ?.models.forEach((model) => {
        const obj = state.scene.getObjectByName(model.name);
        obj && state.scene.remove(obj);
      });
    return {
      ...state,
      currentProject: action.payload.name,
      projects: [
        ...state.projects,
        {
          name: action.payload.name,
          models: [],
          designCode: "IS 800 : 2007 LSD",
          loadings: { ...initLoadings },
          ladderParams: { ...initLadderParams },
          indianDesignCode: { ...initialIndianDesignCode },
          americanDesignCode: { ...initialAmericanDesignCode },
          settings: { ...initSettings },
          pipeDesignCode: { ...initPipeDesignCode },
          pipeLoadings: { ...initPipingLoad },
        },
      ],
    };
  })
  .handleType(MainActionTypes.CREATE_XCH_PROJECT, (state, action) => {
    state.projects
      .find((project) => project.name === state.currentProject)
      ?.models.forEach((model) => {
        const obj = state.scene.getObjectByName(model.name);
        obj && state.scene.remove(obj);
      });
    let newName = "XCH Project";
    if (state.projects.some((project) => project.name === newName)) {
      newName += getIndexName(state.projects, newName);
    }
    return {
      ...state,
      currentProject: newName,
      projects: [
        ...state.projects,
        {
          modelType: "Pipe Rack",
          name: newName,
          models: action.payload.models.map((model) => ({
            ...model,
            project: newName,
          })),
          designCode: "IS 800 : 2007 LSD",
          loadings: action.payload.loadings,
          ladderParams: action.payload.ladderParams,
          indianDesignCode: { ...initialIndianDesignCode },
          americanDesignCode: { ...initialAmericanDesignCode },
          settings: { ...initSettings },
          pipeDesignCode: { ...initPipeDesignCode },
          pipeLoadings: { ...initPipingLoad },
        },
      ],
      fabricatedSections: action.payload.fSections,
      rolledSections: action.payload.rSections,
      combinedSections: action.payload.cSections,
    };
  })
  .handleType(MainActionTypes.CREATE_XCH_PROJECT_OF, (state, action) => {
    state.projects
      .find((project) => project.name === state.currentProject)
      ?.models.forEach((model) => {
        const obj = state.scene.getObjectByName(model.name);
        obj && state.scene.remove(obj);
      });
    return {
      ...state,
      currentProject: action.payload.project.name,
      projects: [
        ...state.projects,
        {
          ...action.payload.project,
          settings: { ...initSettings },
        },
      ],
      fabricatedSections: action.payload.fSections,
      rolledSections: action.payload.rSections,
      combinedSections: action.payload.cSections,
    };
  })
  .handleType(MainActionTypes.CREATE_XCH_PROJECT_PIPES, (state, action) => {
    state.projects
      .find((project) => project.name === state.currentProject)
      ?.models.forEach((model) => {
        const obj = state.scene.getObjectByName(model.name);
        obj && state.scene.remove(obj);
      });
    return {
      ...state,
      currentProject: action.payload.project.name,
      projects: [
        ...state.projects,
        {
          ...action.payload.project,
          settings: { ...initSettings },
        },
      ],
      userDefinedElbows: action.payload.UDEs,
    };
  })
  .handleType(MainActionTypes.SELECT_PROJECT, (state, action) => {
    state.projects
      .find((project) => project.name === state.currentProject)
      ?.models.forEach((model) => {
        const obj = state.scene.getObjectByName(model.name);
        obj && state.scene.remove(obj);
      });
    return {
      ...state,
      currentProject: action.payload.name,
    };
  })
  .handleType(MainActionTypes.REMOVE_PROJECT, (state, action) => {
    state.projects
      .find((project) => project.name === action.payload.name)
      ?.models.forEach((model) => {
        const obj = state.scene.getObjectByName(model.name);
        obj && state.scene.remove(obj);
      });
    return {
      ...state,
      currentModel: state.projects[0] ? state.projects[0].name : "",
      projects: state.projects.filter(
        (project) => project.name !== action.payload.name
      ),
    };
  })
  .handleType(MainActionTypes.RENAME_PROJECT, (state, action) => {
    let newName = action.payload.newName;
    if (state.projects.some((project) => project.name === newName)) {
      newName += getIndexName(state.projects, newName);
    }
    return {
      ...state,
      currentProject: newName,
      projects: state.projects.map((project) => {
        if (project.name === action.payload.oldName) {
          return {
            ...project,
            name: newName,
            models: project.models.map((model) => ({
              ...model,
              project: newName,
            })),
            flares: project.flares?.map((flare) => ({
              ...flare,
              project: newName,
            })),
          };
        } else {
          return project;
        }
      }),
    };
  })
  .handleType(MainActionTypes.SET_TYPE_AND_MATERIAL, (state, action) => ({
    ...state,
    projects: state.projects.map((project) =>
      project.name === state.currentProject
        ? {
            ...project,
            modelType: action.payload.type,
            selectedMaterial: action.payload.mat,
          }
        : project
    ),
  }))
  .handleType(MainActionTypes.CHANGE_FABRICATED_SECTIONS, (state, action) => ({
    ...state,
    fabricatedSections: action.payload.sections,
  }))
  .handleType(MainActionTypes.CHANGE_ROLLED_SECTIONS, (state, action) => ({
    ...state,
    rolledSections: action.payload.sections,
  }))
  .handleType(MainActionTypes.CHANGE_COMBINED_SECTIONS, (state, action) => ({
    ...state,
    combinedSections: action.payload.sections,
  }))
  .handleType(MainActionTypes.CHANGE_USER_DEFINED_ELBOWS, (state, action) => ({
    ...state,
    userDefinedElbows: action.payload.UDEs,
  }))
  .handleType(MainActionTypes.CREATE_MODEL, (state, action) => ({
    ...state,
    projects: state.projects.map((project) =>
      project.name === state.currentProject
        ? {
            ...project,
            models: [...project.models, action.payload.model],
          }
        : project
    ),
  }))
  .handleType(MainActionTypes.CHANGE_MODEL, (state, action) => ({
    ...state,
    projects: state.projects.map((project) =>
      project.name === action.payload.model.project
        ? {
            ...project,
            models: project.models.map((item) =>
              item.name === action.payload.model.name
                ? action.payload.model
                : item
            ),
          }
        : project
    ),
  }))
  .handleType(MainActionTypes.REMOVE_MODEL, (state, action) => {
    const obj = state.scene.getObjectByName(action.payload.name);
    obj && state.scene.remove(obj);
    return {
      ...state,
      projects: state.projects.map((project) =>
        project.name === state.currentProject
          ? {
              ...project,
              models: project.models.filter(
                (model) => model.name !== action.payload.name
              ),
            }
          : project
      ),
    };
  })
  .handleType(MainActionTypes.CHANGE_LOADINGS, (state, action) => ({
    ...state,
    projects: state.projects.map((project) =>
      project.name === state.currentProject
        ? {
            ...project,
            loadings: action.payload.loadings,
          }
        : project
    ),
  }))
  .handleType(MainActionTypes.CHANGE_LADDER_PARAMS, (state, action) => ({
    ...state,
    projects: state.projects.map((project) =>
      project.name === state.currentProject
        ? {
            ...project,
            ladderParams: action.payload.ladderParams,
          }
        : project
    ),
  }))
  .handleType(MainActionTypes.CHANGE_INDIAN_DC, (state, action) => ({
    ...state,
    projects: state.projects.map((project) =>
      project.name === state.currentProject
        ? {
            ...project,
            indianDesignCode: action.payload.data,
          }
        : project
    ),
  }))
  .handleType(MainActionTypes.CHANGE_AMERICAN_DC, (state, action) => ({
    ...state,
    projects: state.projects.map((project) =>
      project.name === state.currentProject
        ? {
            ...project,
            americanDesignCode: action.payload.data,
          }
        : project
    ),
  }))
  .handleType(MainActionTypes.CHANGE_PROJECT, (state, action) => ({
    ...state,
    projects: state.projects.map((project) =>
      project.name === action.payload.project.name
        ? { ...action.payload.project }
        : project
    ),
  }))
  .handleType(MainActionTypes.CHANGE_PROJECT_BY_NAME, (state, action) => ({
    ...state,
    projects: state.projects.map((project) =>
      project.name === action.payload.name
        ? { ...project, ...action.payload.params }
        : project
    ),
  }))
  .handleType(MainActionTypes.SET_PIPES, (state, action) => ({
    ...state,
    projects: state.projects.map((project) =>
      project.name === state.currentProject
        ? { ...project, freePipes: [...action.payload.freePipes] }
        : project
    ),
  }))
  /*.handleType(MainActionTypes.SET_CABLES, (state, action) => ({
    ...state,
    projects: state.projects.map((project) =>
      project.name === state.currentProject
        ? { ...project, freeCables: [...action.payload.freeCable] }
        : project
    ),
  }))*/
  .handleType(MainActionTypes.GET_REPORTS, (state, action) => ({
    ...state,
    projects: state.projects.map((project) =>
      project.name === action.payload.projectName
        ? {
            ...project,
            reactionSupports: action.payload.reactionSupports,
            memberEndForces: action.payload.memberEndForces,
            nodeDisplacements: action.payload.nodeDisplacements,
            memberStressChecks: action.payload.memberStressCheck,
            elements: action.payload.elements,
          }
        : project
    ),
  }))
  .handleType(MainActionTypes.GET_SEISMIC_LOADS, (state, action) => ({
    ...state,
    projects: state.projects.map((project) =>
      project.name === action.payload.project
        ? {
            ...project,
            loadings: {
              ...project.loadings,
              seismicLoads: action.payload.loads,
            },
          }
        : project
    ),
  }))
  .handleType(
    MainActionTypes.CHANGE_NOT_EDITABLE_PROJECTS,
    (state, action) => ({
      ...state,
      projects: state.projects.map((project) =>
        project.name === state.currentProject
          ? {
              ...project,
              notEditableProjects: action.payload.projects,
            }
          : project
      ),
    })
  )
  .handleType(
    MainActionTypes.CHANGE_NOT_EDITABLE_PROCESSES,
    (state, action) => ({
      ...state,
      projects: state.projects.map((project) =>
        project.name === state.currentProject
          ? {
              ...project,
              notEditableProcesses: action.payload.processes,
            }
          : project
      ),
    })
  )
  .handleType(MainActionTypes.SET_WEIGHT_SUMMARY, (state, action) => ({
    ...state,
    projects: state.projects.map((project) =>
      project.name === action.payload.project
        ? {
            ...project,
            wieghtSummary: action.payload.weightSummary,
          }
        : project
    ),
  }))
  .handleType(MainActionTypes.CHANGE_PROJECT_MODE, (state, action) => ({
    ...state,
    projects: state.projects.map((project) =>
      project.name === action.payload.project
        ? { ...project, mode: action.payload.mode }
        : project
    ),
  }))
  .handleType(MainActionTypes.CHANGE_PIPE_NF, (state, action) => {
    return {
      ...state,
      projects: state.projects.map((project) =>
        project.name === action.payload.project
          ? {
              ...project,
              pipeLoadings: {
                ...project.pipeLoadings,
                NFs: {
                  ...(Array.isArray(project.pipeLoadings.NFs)
                    ? project.pipeLoadings.NFs.reduce(
                        (acc, el) => ({ ...acc, [el.line]: el.value }),
                        {}
                      )
                    : project.pipeLoadings.NFs),
                  ...action.payload.NFs,
                },
              },
            }
          : project
      ),
    };
  })
  .handleType(MainActionTypes.CHANGE_PIPE_ANALYSIS, (state, action) => ({
    ...state,
    projects: state.projects.map((project) =>
      project.name === action.payload.project
        ? {
            ...project,
            pipeAnalysis: {
              ...project.pipeAnalysis,
              ...action.payload.analysis,
            },
          }
        : project
    ),
  }))
  .handleType(MainActionTypes.CHANGE_STRESS_CHECK_PARAMS, (state, action) => ({
    ...state,
    projects: state.projects.map((project) =>
      project.name === state.currentProject
        ? {
            ...project,
            pipeAnalysis: {
              ...project.pipeAnalysis,
              stressCheckParams: action.payload.params,
            },
          }
        : project
    ),
  }))
  .handleType(
    MainActionTypes.CHANGE_THICKNESS_CHECK_PARAMS,
    (state, action) => ({
      ...state,
      projects: state.projects.map((project) =>
        project.name === state.currentProject
          ? {
              ...project,
              pipeAnalysis: {
                ...project.pipeAnalysis,
                thicknessCheckParams: action.payload.params,
              },
            }
          : project
      ),
    })
  )
  .handleType(MainActionTypes.CHANGE_FLANGE_CHECK_PARAMS, (state, action) => ({
    ...state,
    projects: state.projects.map((project) =>
      project.name === state.currentProject
        ? {
            ...project,
            pipeAnalysis: {
              ...project.pipeAnalysis,
              flangeCheckParams: action.payload.params,
            },
          }
        : project
    ),
  }))
  .handleType(MainActionTypes.CHANGE_PIPE_SEISMIC_LOADS, (state, action) => ({
    ...state,
    projects: state.projects.map((project) =>
      project.name === action.payload.project
        ? {
            ...project,
            pipeLoadings: {
              ...project.pipeLoadings,
              seismicLoads: {
                ...project.pipeLoadings.seismicLoads,
                seismicLoads: action.payload.loadings,
              },
            },
          }
        : project
    ),
  }))
  .handleType(
    MainActionTypes.CHANGE_PIPE_LOADS_TO_STRUCTURE,
    (state, action) => ({
      ...state,
      projects: state.projects.map((project) =>
        project.name === action.payload.project
          ? {
              ...project,
              loadsToStructure: action.payload.loads,
            }
          : project
      ),
    })
  )
  .handleType(MainActionTypes.CHANGE_IMPORTED_TO_PROCESS, (state, action) => {
    const { project, imported } = action.payload;
    return {
      ...state,
      projects: state.projects.map((p) =>
        p.name === project ? { ...p, importedProcess: imported } : p
      ),
    };
  })
  .handleType(MainActionTypes.SET_CLASHES, (state, action) => {
    const { clashes } = action.payload;
    return { ...state, clashes };
  })
  .handleType(MainActionTypes.CREATE_PIPE, (state, action) => {
    const project = state.projects.find((p) => p.name === state.currentProject);
    if (!project) return state;

    const id = getNextId(project.freePipes);
    const pipe = action.payload.pipe ?? {
      ...initialPipe,
      id,
      line: id,
      pipe: `PP${id}`,
    };

    const newProject = {
      ...project,
      freePipes: project.freePipes ? [...project.freePipes, pipe] : [pipe],
    };

    const newState: MainState = {
      ...state,
      projects: state.projects.map((p) =>
        p.name === newProject.name ? newProject : p
      ),
    };
    return newState;
  })
  .handleType(MainActionTypes.DELETE_PIPES, (state, action) => {
    const { ids } = action.payload;

    const project = state.projects.find((p) => p.name === state.currentProject);
    if (!project || !project.freePipes) return state;

    const removed: FreePipe[] = [];
    const newPipes: FreePipe[] = [];
    for (const fp of project.freePipes) {
      if (ids.includes(fp.id)) {
        removed.push(fp);
      } else newPipes.push(fp);
    }

    let deadLoad = { ...project.pipeLoadings.deadLoad };
    deadLoad = {
      ...deadLoad,
      loads: deadLoad.loads.filter(
        (l) => !removed.some((r) => r.pipe === l.element)
      ),
      insulations: deadLoad.insulations.filter(
        (l) => !removed.some((r) => r.pipe === l.element)
      ),
    };

    const slugLoads = project.pipeLoadings.slugLoads.filter(
      (l) => !removed.some((r) => r.pipe === l.element)
    );

    let windLoad = { ...project.pipeLoadings.windLoad };
    windLoad = {
      ...windLoad,
      loads: windLoad.loads.filter(
        (l) => !removed.some((r) => r.pipe === l.element)
      ),
    };

    const newProject: Project = {
      ...project,
      freePipes: newPipes.map((p) => {
        if (removed.some((r) => r.pipe === p.preceding)) {
          return { ...p, preceding: "START" };
        } else return p;
      }),
      pipeLoadings: { ...project.pipeLoadings, deadLoad, slugLoads },
    };

    const newState: MainState = {
      ...state,
      projects: state.projects.map((p) =>
        p.name === newProject.name ? newProject : p
      ),
    };
    return newState;
  })
  .handleType(MainActionTypes.CREATE_CABLE, (state, action) => {
    const project = state.projects.find((p) => p.name === state.currentProject);
    if (!project) return state;

    const id = getNextId(project.freeCables);
    const cable = action.payload.cable ?? {
      ...initialCable,
      id,
      line: id,
      cable: `CB${id}`,
    };

    const newProject = {
      ...project,
      freeCables: project.freeCables ? [...project.freeCables, cable] : [cable],
    };

    const newState: MainState = {
      ...state,
      projects: state.projects.map((p) =>
        p.name === newProject.name ? newProject : p
      ),
    };
    return newState;
  })
  .handleType(MainActionTypes.DELETE_CABLES, (state, action) => {
    const { ids } = action.payload;

    const project = state.projects.find((p) => p.name === state.currentProject);
    if (!project || !project.freeCables) return state;

    const removed: FreeCable[] = [];
    const newPipes: FreeCable[] = [];
    for (const fp of project.freeCables) {
      if (ids.includes(fp.id)) {
        removed.push(fp);
      } else newPipes.push(fp);
    }

    let deadLoad = { ...project.pipeLoadings.deadLoad };
    deadLoad = {
      ...deadLoad,
      loads: deadLoad.loads.filter(
        (l) => !removed.some((r) => r.cable === l.element)
      ),
      insulations: deadLoad.insulations.filter(
        (l) => !removed.some((r) => r.cable === l.element)
      ),
    };

    const slugLoads = project.pipeLoadings.slugLoads.filter(
      (l) => !removed.some((r) => r.cable === l.element)
    );

    let windLoad = { ...project.pipeLoadings.windLoad };
    windLoad = {
      ...windLoad,
      loads: windLoad.loads.filter(
        (l) => !removed.some((r) => r.cable === l.element)
      ),
    };

    const newProject: Project = {
      ...project,
      freeCables: newPipes.map((p) => {
        if (removed.some((r) => r.cable === p.preceding)) {
          return { ...p, preceding: "START" };
        } else return p;
      }),
      pipeLoadings: { ...project.pipeLoadings, deadLoad, slugLoads },
    };

    const newState: MainState = {
      ...state,
      projects: state.projects.map((p) =>
        p.name === newProject.name ? newProject : p
      ),
    };
    return newState;
  })
  .handleType(MainActionTypes.CREATE_FLARE, (state, action) => {
    const { params, model } = action.payload;
    return handleCreateFlare(state, params, model);
  })
  .handleType(MainActionTypes.CHANGE_FLARE, (state, action) => {
    return handleChangeFlare(state, action.payload.flare);
  })
  .handleType(MainActionTypes.DELETE_FLARE, (state, action) => {
    return handleDeleteFlare(state, action.payload.flare);
  })
  .handleType(MainActionTypes.CHANGE_DASHBOARD, (state, action) => {
    const { dashboard } = action.payload;
    return {
      ...state,
      projects: state.projects.map((p) =>
        p.name === state.currentProject ? { ...p, dashboard } : p
      ),
    };
  });

export { reducer as mainReducer };
