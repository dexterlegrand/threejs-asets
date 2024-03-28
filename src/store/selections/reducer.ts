import { ActionType, createReducer } from "typesafe-actions";
import { SelectionsState, SelectionsActionTypes as TYPES } from "./types";
import * as actions from "./actions";

export type Actions = ActionType<typeof actions>;

const reducer = createReducer<SelectionsState, Actions>({})
  .handleType(TYPES.SELECT_MODEL_ITEM, (state, action) => {
    const { item, isSingle } = action.payload;
    if (!item) {
      return {
        ...state,
        selectedItems: [],
        selectedPlatform: undefined,
        selectedConnector: undefined,
        selectedPipeSupport: undefined,
        selectedPipes: undefined,
      };
    }
    let selectedItems = state.selectedItems ?? [];
    if (isSingle) {
      selectedItems = [item];
    } else {
      if (
        selectedItems.some(
          (el) => el.model === item.model && el.name === item.name
        )
      ) {
        selectedItems = selectedItems.filter(
          (el) => !(el.model === item.model && el.name === item.name)
        );
      } else selectedItems = [...selectedItems, item];
    }
    return {
      ...state,
      selectedItems,
      selectedPlatform: undefined,
      selectedConnector: undefined,
      selectedPipeSupport: undefined,
      selectedPipes: undefined,
    };
  })
  .handleType(TYPES.SELECT_MODEL_ITEMS, (state, action) => {
    const { items } = action.payload;
    return {
      ...state,
      selectedItems: items,
      selectedPlatform: undefined,
      selectedConnector: undefined,
      selectedPipeSupport: undefined,
      selectedPipes: undefined,
    };
  })
  .handleType(TYPES.SELECT_MODEL_PLATFORM, (state, action) => {
    const { item } = action.payload;
    return {
      ...state,
      selectedItems: [],
      selectedPlatform: item,
      selectedConnector: undefined,
      selectedPipeSupport: undefined,
      selectedPipes: undefined,
    };
  })
  .handleType(TYPES.SELECT_PIPE, (state, action) => {
    const { item } = action.payload;
    let selectedPipes = state.selectedPipes ?? [];
    if (item.pipe) {
      if (selectedPipes.some((sp) => sp.pipeName === item.pipeName)) {
        selectedPipes = selectedPipes.map((sp) =>
          sp.pipeName === item.pipeName ? item : sp
        );
      } else {
        selectedPipes = [...selectedPipes, item];
      }
    } else {
      selectedPipes = selectedPipes.filter(
        (sp) => sp.pipeName !== item.pipeName
      );
    }
    return {
      ...state,
      selectedPlatform: undefined,
      selectedPipes,
      selectedConnector: undefined,
      selectedPipeSupport: undefined,
      selectedItems: undefined,
    };
  })

  .handleType(TYPES.SELECT_PIPE_SUPPORT, (state, action) => ({
    ...state,
    selectedPlatform: undefined,
    selectedPipeSupport: action.payload.item,
    selectedConnector: undefined,
    selectedPipes: undefined,
    selectedItems: undefined,
  }))
  .handleType(TYPES.SELECT_PIPE_CONNECTOR, (state, action) => ({
    ...state,
    selectedPlatform: undefined,
    selectedConnector: action.payload.item,
    selectedPipeSupport: undefined,
    selectedPipes: undefined,
    selectedItems: undefined,
  }))
  .handleType(TYPES.SET_HOVERED_PIPE, (state, action) => {
    if (state.hoveredPipe?.pipeName === action.payload.pipe.pipeName)
      return state;
    return {
      ...state,
      hoveredMember: undefined,
      hoveredPipe: action.payload.pipe,
      hoveredPipeConnector: undefined,
      hoveredPipeSupport: undefined,
    };
  })
  .handleType(TYPES.SET_HOVERED_PIPE_CONNECTOR, (state, action) => {
    if (state.hoveredPipeConnector?.id === action.payload.connector.id)
      return state;
    return {
      ...state,
      hoveredMember: undefined,
      hoveredPipe: undefined,
      hoveredPipeConnector: action.payload.connector,
      hoveredPipeSupport: undefined,
    };
  })
  .handleType(TYPES.SET_HOVERED_PIPE_SUPPORT, (state, action) => {
    if (
      state.hoveredPipeSupport?.position.equals(action.payload.support.position)
    )
      return state;
    return {
      ...state,
      hoveredMember: undefined,
      hoveredPipe: undefined,
      hoveredPipeConnector: undefined,
      hoveredPipeSupport: action.payload.support,
    };
  })
  .handleType(TYPES.SET_HOVERED_MEMBER, (state, action) => {
    if (state.hoveredMember?.name === action.payload.member.name) return state;
    return {
      ...state,
      hoveredMember: action.payload.member,
      hoveredPipe: undefined,
      hoveredPipeConnector: undefined,
      hoveredPipeSupport: undefined,
    };
  })
  .handleType(TYPES.UNSELECT_PIPE, (state) => {
    return { ...state, selectedPipes: [] };
  })
  .handleType(TYPES.UNSELECT_HOVERED, (state) => {
    return {
      ...state,
      hoveredMember: undefined,
      hoveredPipe: undefined,
      hoveredPipeConnector: undefined,
      hoveredPipeSupport: undefined,
    };
  });

export { reducer as selectionsReducer };
