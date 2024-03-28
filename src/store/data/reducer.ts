import { ActionType, createReducer } from "typesafe-actions";
import * as actions from "./actions";
import { DataActionTypes, DataState } from "./types";
import { initialState } from "./constants";

export type DataActions = ActionType<typeof actions>;

const reducer = createReducer<DataState, DataActions>({ ...initialState })
  .handleType(DataActionTypes.GET_PROFILE_SECTION_DATA, (state, action) => ({
    ...state,
    profileSectionData: action.payload.data,
    CS_Libraries: action.payload.libs,
  }))
  .handleType(DataActionTypes.GET_MATERIALS, (state, action) => ({
    ...state,
    materials: action.payload.data,
  }))
  .handleType(DataActionTypes.GET_PIPE_PROFILES, (state, action) => ({
    ...state,
    pipingSS: action.payload.data,
  }))
  .handleType(DataActionTypes.GET_PIPING_CAPS, (state, action) => ({
    ...state,
    pipingCaps: action.payload.data,
  }))
  .handleType(DataActionTypes.GET_PIPING_COLLETS, (state, action) => ({
    ...state,
    pipingCollets: action.payload.data,
  }))
  .handleType(DataActionTypes.GET_PIPING_REDUCERS, (state, action) => ({
    ...state,
    pipingReducers: action.payload.data,
  }))
  .handleType(DataActionTypes.GET_PIPING_RETURNS, (state, action) => ({
    ...state,
    pipingReturns: action.payload.data,
  }))
  .handleType(DataActionTypes.GET_PIPING_ELBOWS, (state, action) => ({
    ...state,
    pipingElbows: action.payload.data,
  }))
  .handleType(DataActionTypes.GET_PIPING_TEES, (state, action) => ({
    ...state,
    pipingTees: action.payload.data,
  }))
  .handleType(DataActionTypes.GET_FLANGES, (state, action) => ({
    ...state,
    ...action.payload.data,
  }))
  .handleType(DataActionTypes.GET_FONT, (state, action) => {
    const { font } = action.payload;
    return { ...state, font };
  })
  .handleType(DataActionTypes.CHANGE_DATA, (state, action) => {
    return action.payload.data;
  });

export { reducer as dataReducer };
