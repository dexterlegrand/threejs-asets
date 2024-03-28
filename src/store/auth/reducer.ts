import { ActionType, createReducer } from "typesafe-actions";
import * as actions from "./actions";
import { AuthState, AuthActionTypes } from "./types"

export type AuthAction = ActionType<typeof actions>;

const reducer = createReducer<AuthState, AuthAction>({
  appLoaded: false,
  errors: null,
  appName: "ASETS-LUX",
  currentUser: null,
  redirectTo: null,
  token: null,
  inProgress: false,
  User_id: null,
})
  .handleType(AuthActionTypes.APP_LOAD, (state, action) => ({
    ...state,
    inProgress: false,
    currentUser: action.payload.body ?? null,
  }))
  .handleType(AuthActionTypes.LOGIN, (state, action) => ({
    ...state,
    inProgress: false,
    appLoaded: !action.payload.error,
    token: action.payload.error ? null : action.payload.access_token,
    errors: action.payload.error ? action.payload?.payload?.errors : null,
  }))
  .handleType(AuthActionTypes.LOGOUT, (state, action) => ({
    ...state,
    appLoaded: false,
    inProgress: false,
    token: null,
    currentUser: null,
    errors: null
  }))
  .handleType(AuthActionTypes.SET_USER_ID, (state, action) => ({
    ...state,
    User_id: action.payload.user_id,
  }))
  // .handleType(AuthActionTypes.REGISTER, (state, action) => ({
  //   ...state,
  //   redirectTo: action.payload.body.error ? null : "/editor",
  //   token: action.payload.body.error ? null : action.payload.body.payload?.access_token,
  //   currentUser: action.payload.body.error ? null : action.payload.body.payload,
  // }))
  .handleType(AuthActionTypes.ASYNC_START, (state, action) => ({
    ...state,
    inProgress: true
  }))

export { reducer as authReducer };

