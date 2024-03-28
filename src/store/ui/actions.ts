import { action } from "typesafe-actions";
import {
  OpenFrameUI,
  TConfirm,
  UIActionTypes,
  TEvent,
  ProjectUI,
  PipeRackUI,
  ModelAnalysisUI,
  LoadCombinationUI,
} from "./types";
import { LoadCombination } from "../main/types";
import { TPipeLoadCombination } from "../main/pipeTypes";

export const confirmAction = (confirm?: TConfirm) => action(UIActionTypes.CONFIRM, { confirm });

export const secondConfirmAction = (confirm?: TConfirm) =>
  action(UIActionTypes.SECOND_CONFIRM, { confirm });

export const changeOFUIAction = (newOFUIState: OpenFrameUI) =>
  action(UIActionTypes.CHANGE_OF_UI, { newOFUIState });

export const changePRUIAction = (newOFUIState: PipeRackUI) =>
  action(UIActionTypes.CHANGE_OF_PR, { newOFUIState });

export const addEventAction = (message: string, type: "danger" | "none" | "success" | "warning") =>
  action(UIActionTypes.ADD_EVENT, { message, type });

export const changeEventsAction = (events: TEvent[]) =>
  action(UIActionTypes.CHANGE_EVENT, { events });

export const removeEventAction = (id: number) => action(UIActionTypes.REMOVE_EVENT, { id });

export const createUIAction = (project: string) => action(UIActionTypes.CREATE_UI, { project });

export const removeUIAction = (project: string) => action(UIActionTypes.REMOVE_UI, { project });

export const changeUIAction = (ui: ProjectUI) => action(UIActionTypes.CHANGE_UI, { ui });

export const changeModelAnalysisUIAction = (
  project: string,
  model: string,
  lcs: (LoadCombination | LoadCombinationUI | TPipeLoadCombination)[],
  ui: ModelAnalysisUI
) => action(UIActionTypes.CHANGE_MODEL_ANALYSIS_UI, { project, model, lcs, ui });

export const renameUIProject = (oldName: string, newName: string) =>
  action(UIActionTypes.RENAME_UI, { oldName, newName });

export const loadUIAction = (ui: ProjectUI, project: string) =>
  action(UIActionTypes.LOAD_UI, { ui, project });

export const selectUIAction = (project: string) => action(UIActionTypes.SELECT_UI, { project });

export const createUI_XCH_OF = (ui: ProjectUI) => action(UIActionTypes.CREATE_XCH_OF, { ui });

export const changeRequestProgressAction = (request: string, isStart: boolean = true) =>
  action(UIActionTypes.CHANGE_REQUEST_PROGRESS, { request, isStart });

export const changeProjectRequestProgressAction = (
  project: string,
  request: string,
  isStart: boolean = true
) => action(UIActionTypes.CHANGE_PROJECT_REQUEST_PROGRESS, { project, request, isStart });
