export enum AuthActionTypes {
  APP_LOAD = "APP_LOAD",

  LOGIN = "LOGIN",
  REGISTER = "REGISTER",
  LOGOUT = "LOGOUT",

  ASYNC_START = "ASYNC_START",

  SET_USER_ID = "SET_USER_ID",
}

type TUser = {
  email: string;
}

export type AuthState = {
  errors: any;
  appLoaded: boolean;
  appName: string;
  currentUser: TUser | null;
  redirectTo: any;
  token: any;
  inProgress: boolean
  User_id: number | null;
}
