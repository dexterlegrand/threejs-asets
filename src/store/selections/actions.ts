import { action } from "typesafe-actions";
import { SelectionsActionTypes as TYPES } from "./types";
import {
  TSelectedPipe,
  ModelItem,
  TSelectedPipeConnector,
  TSelectedPipeSupport,
  TSelectedPlatform,
} from "../main/types";

export const selectModelItem = (item?: ModelItem, isSingle?: boolean) =>
  action(TYPES.SELECT_MODEL_ITEM, { item, isSingle });

export const selectModelItems = (items: ModelItem[]) => action(TYPES.SELECT_MODEL_ITEMS, { items });

export const selectModelPlatform = (item?: TSelectedPlatform) =>
  action(TYPES.SELECT_MODEL_PLATFORM, { item });

export const selectFreePipe = (item: TSelectedPipe) => action(TYPES.SELECT_PIPE, { item });

export const selectFreePipeSupport = (item?: TSelectedPipeSupport) =>
  action(TYPES.SELECT_PIPE_SUPPORT, { item });

export const selectPipeConnector = (item?: TSelectedPipeConnector) =>
  action(TYPES.SELECT_PIPE_CONNECTOR, { item });

export const setHoveredPipeAction = (pipe: TSelectedPipe) => {
  return action(TYPES.SET_HOVERED_PIPE, { pipe });
};

export const setHoveredPipeConnectorAction = (connector: TSelectedPipeConnector) => {
  return action(TYPES.SET_HOVERED_PIPE_CONNECTOR, { connector });
};

export const setHoveredPipeSupportAction = (support: TSelectedPipeSupport) => {
  return action(TYPES.SET_HOVERED_PIPE_SUPPORT, { support });
};

export const setHoveredMemberAction = (member: ModelItem) => {
  return action(TYPES.SET_HOVERED_MEMBER, { member });
};

export const unselectFreePipes = () => action(TYPES.UNSELECT_PIPE);

export const unselectHovered = () => action(TYPES.UNSELECT_HOVERED);
