import { action } from "typesafe-actions";
import { AuthActionTypes } from "./types";

export const appLoadAction = (payload: any) =>
  action(AuthActionTypes.APP_LOAD, { body: payload })

export const logInAction = (payload: any) => action(AuthActionTypes.LOGIN, payload)

export const logOutAction = () => action(AuthActionTypes.LOGOUT)

export const registerAction = (payload: any) => action(AuthActionTypes.REGISTER, payload)

export const asyncStartAction = () => action(AuthActionTypes.ASYNC_START)

export const setUserIdAction = (user_id: number) => action(AuthActionTypes.SET_USER_ID, {user_id})
