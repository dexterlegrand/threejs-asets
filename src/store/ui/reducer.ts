import { ActionType, createReducer } from "typesafe-actions";
import * as actions from "./actions";
import { UIActionTypes, UIState } from "./types";
import { initialState, initialStateProjectUI } from "./initialState";
import { getNextId } from "../../components/3d-models/utils";

export type UIActions = ActionType<typeof actions>;

const reducer = createReducer<UIState, UIActions>({ ...initialState })
  .handleType(UIActionTypes.CREATE_UI, (state, action) => ({
    ...state,
    project: action.payload.project,
    projectUIs: [
      ...state.projectUIs,
      {
        ...initialStateProjectUI,
        project: action.payload.project,
      },
    ],
  }))
  .handleType(UIActionTypes.REMOVE_UI, (state, action) => ({
    ...state,
    project: "",
    projectUIs: state.projectUIs.filter((ui) => ui.project !== action.payload.project),
  }))
  .handleType(UIActionTypes.CHANGE_UI, (state, action) => ({
    ...state,
    projectUIs: state.projectUIs.map((ui) =>
      ui.project === action.payload.ui.project ? { ...action.payload.ui } : ui
    ),
  }))
  .handleType(UIActionTypes.RENAME_UI, (state, action) => ({
    ...state,
    project: action.payload.newName,
    projectUIs: state.projectUIs.map((ui) =>
      ui.project === action.payload.oldName
        ? {
            ...ui,
            project: action.payload.newName,
          }
        : ui
    ),
  }))
  .handleType(UIActionTypes.SELECT_UI, (state, action) => ({
    ...state,
    project: action.payload.project,
  }))
  .handleType(UIActionTypes.LOAD_UI, (state, action) => ({
    ...state,
    project: action.payload.project,
    projectUIs: [
      ...state.projectUIs,
      {
        ...action.payload.ui,
        project: action.payload.project,
      },
    ],
  }))
  .handleType(UIActionTypes.CONFIRM, (state, action) => ({
    ...state,
    projectUIs: state.projectUIs.map((ui) => {
      if (ui.project === state.project) {
        return {
          ...ui,
          confirm: action.payload.confirm,
        };
      }
      return ui;
    }),
  }))
  .handleType(UIActionTypes.SECOND_CONFIRM, (state, action) => ({
    ...state,
    projectUIs: state.projectUIs.map((ui) => {
      if (ui.project === state.project) {
        return {
          ...ui,
          confirm_s: action.payload.confirm,
        };
      }
      return ui;
    }),
  }))
  .handleType(UIActionTypes.CHANGE_OF_UI, (state, action) => ({
    ...state,
    projectUIs: state.projectUIs.map((ui) => {
      if (ui.project === state.project) {
        return {
          ...ui,
          openFrameUI: { ...action.payload.newOFUIState },
        };
      }
      return ui;
    }),
  }))
  .handleType(UIActionTypes.CHANGE_OF_PR, (state, action) => ({
    ...state,
    projectUIs: state.projectUIs.map((ui) => {
      if (ui.project === state.project) {
        return {
          ...ui,
          pipeRackUI: { ...action.payload.newOFUIState },
        };
      }
      return ui;
    }),
  }))
  .handleType(UIActionTypes.ADD_EVENT, (state, action) => ({
    ...state,
    projectUIs: state.projectUIs.map((ui) => {
      if (ui.project === state.project) {
        return {
          ...ui,
          events: [
            ...(ui.events ?? []),
            {
              ...action.payload,
              id: getNextId(ui.events ?? []),
              isNew: true,
            },
          ],
        };
      }
      return ui;
    }),
  }))
  .handleType(UIActionTypes.CHANGE_EVENT, (state, action) => ({
    ...state,
    projectUIs: state.projectUIs.map((ui) => {
      if (ui.project === state.project) {
        return {
          ...ui,
          events: action.payload.events,
        };
      }
      return ui;
    }),
  }))
  .handleType(UIActionTypes.REMOVE_EVENT, (state, action) => ({
    ...state,
    projectUIs: state.projectUIs.map((ui) => {
      if (ui.project === state.project) {
        return {
          ...ui,
          events: ui.events?.filter((event) => event.id !== action.payload.id),
        };
      }
      return ui;
    }),
  }))
  .handleType(UIActionTypes.CREATE_XCH_OF, (state, action) => ({
    ...state,
    project: action.payload.ui.project,
    projectUIs: [...state.projectUIs, { ...action.payload.ui }],
  }))
  .handleType(UIActionTypes.CHANGE_REQUEST_PROGRESS, (state, action) => ({
    ...state,
    requests: {
      ...state.requests,
      [action.payload.request]: action.payload.isStart,
    },
  }))
  .handleType(UIActionTypes.CHANGE_PROJECT_REQUEST_PROGRESS, (state, action) => ({
    ...state,
    projectUIs: state.projectUIs.map((ui) => {
      if (ui.project === action.payload.project) {
        return {
          ...ui,
          requests: {
            ...ui.requests,
            [action.payload.request]: action.payload.isStart,
          },
        };
      }
      return ui;
    }),
  }))
  .handleType(UIActionTypes.CHANGE_MODEL_ANALYSIS_UI, (state, action) => {
    const { project, model, lcs, ui } = action.payload;
    return {
      ...state,
      projectUIs: state.projectUIs.map((projectUI) => {
        if (projectUI.project !== project) return projectUI;
        let modelAnalysis = projectUI.analysisUI[model];
        if (!modelAnalysis) {
          return { ...projectUI, analysisUI: { ...projectUI.analysisUI, [model]: ui } };
        }

        const numbers = new Set(lcs.map((lc) => lc.LC_No));

        modelAnalysis = {
          ...modelAnalysis,
          nodes: ui.nodes ?? modelAnalysis.nodes,
          beamNodes: ui.beamNodes ?? modelAnalysis.beamNodes,
          beamElements: ui.beamElements ?? modelAnalysis.beamElements,
          members: ui.members ?? modelAnalysis.members,
          pipeMTO: ui.pipeMTO ?? modelAnalysis.pipeMTO,
          accessoryMTO: ui.accessoryMTO ?? modelAnalysis.accessoryMTO,
          weightSummary: ui.weightSummary ?? modelAnalysis.weightSummary,
          reactionSupports:
            modelAnalysis.reactionSupports && ui.reactionSupports
              ? [
                  ...modelAnalysis.reactionSupports.filter(
                    (rs) => !numbers.has(Number(rs.LCNumber))
                  ),
                  ...ui.reactionSupports,
                ]
              : modelAnalysis.reactionSupports,
          memberEndForces:
            modelAnalysis.memberEndForces && ui.memberEndForces
              ? [
                  ...modelAnalysis.memberEndForces.filter(
                    (rs) => !numbers.has(Number(rs.LCNumber))
                  ),
                  ...ui.memberEndForces,
                ]
              : modelAnalysis.memberEndForces,
          memberStressChecks:
            modelAnalysis.memberStressChecks && ui.memberStressChecks
              ? [
                  ...modelAnalysis.memberStressChecks.filter(
                    (rs) => !numbers.has(Number(rs.LCNumber))
                  ),
                  ...ui.memberStressChecks,
                ]
              : modelAnalysis.memberStressChecks,
          deflectionChecks:
            modelAnalysis.deflectionChecks && ui.deflectionChecks
              ? [
                  ...modelAnalysis.deflectionChecks.filter(
                    (rs) => !numbers.has(Number(rs.LCNumber))
                  ),
                  ...ui.deflectionChecks,
                ]
              : modelAnalysis.deflectionChecks,
          nodalStressChecks:
            modelAnalysis.nodalStressChecks && ui.nodalStressChecks
              ? [
                  ...modelAnalysis.nodalStressChecks.filter(
                    (rs) => !numbers.has(Number(rs.LCNumber))
                  ),
                  ...ui.nodalStressChecks,
                ]
              : modelAnalysis.nodalStressChecks,
          nodeDisplacements:
            modelAnalysis.nodeDisplacements && ui.nodeDisplacements
              ? [
                  ...modelAnalysis.nodeDisplacements.filter(
                    (rs) => !numbers.has(Number(rs.LCNumber))
                  ),
                  ...ui.nodeDisplacements,
                ]
              : modelAnalysis.nodeDisplacements,
          thicknessChecks:
            modelAnalysis.thicknessChecks && ui.thicknessChecks
              ? [
                  ...modelAnalysis.thicknessChecks.filter(
                    (rs) => !numbers.has(Number(rs.LCNumber))
                  ),
                  ...ui.thicknessChecks,
                ]
              : modelAnalysis.thicknessChecks,
          flangeChecks: ui.flangeChecks ?? modelAnalysis.flangeChecks,
        };

        return { ...projectUI, analysisUI: { ...projectUI.analysisUI, [model]: modelAnalysis } };
      }),
    };
  });

export { reducer as UIReducer };
