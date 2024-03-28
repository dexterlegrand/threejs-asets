import {
  ModelItem,
  TSelectedPipe,
  TSelectedPipeConnector,
  TSelectedPipeSupport,
  TSelectedPlatform,
} from "../main/types";

export enum SelectionsActionTypes {
  SELECT_MODEL_ITEM = "SELECT_MODEL_ITEM",
  SELECT_MODEL_ITEMS = "SELECT_MODEL_ITEMS",
  SELECT_MODEL_PLATFORM = "SELECT_MODEL_PLATFORM",
  SELECT_PIPE = "SELECT_PIPE",
  SELECT_PIPE_SUPPORT = "SELECT_PIPE_SUPPORT",
  SELECT_PIPE_CONNECTOR = "SELECT_PIPE_CONNECTOR",

  SET_HOVERED_PIPE = "SET_HOVERED_PIPE",
  SET_HOVERED_PIPE_CONNECTOR = "SET_HOVERED_PIPE_CONNECTOR",
  SET_HOVERED_PIPE_SUPPORT = "SET_HOVERED_PIPE_SUPPORT",
  SET_HOVERED_MEMBER = "SET_HOVERED_MEMBER",

  UNSELECT_PIPE = "UNSELECT_PIPE",
  UNSELECT_HOVERED = "UNSELECT_HOVERED",
}

export type SelectionsState = {
  selectedItems?: ModelItem[];
  selectedPlatform?: TSelectedPlatform;
  selectedPipes?: TSelectedPipe[];
  selectedPipeSupport?: TSelectedPipeSupport;
  selectedConnector?: TSelectedPipeConnector;

  hoveredPipe?: TSelectedPipe;
  hoveredPipeConnector?: TSelectedPipeConnector;
  hoveredPipeSupport?: TSelectedPipeSupport;
  hoveredMember?: ModelItem;
};
