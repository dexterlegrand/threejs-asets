import { combineReducers, createStore, applyMiddleware } from "redux";
import { connectRouter } from "connected-react-router";
import { createBrowserHistory } from "history";

import { MainState } from "./main/types";
import { AuthState } from "./auth/types";
import { DataState } from "./data/types";
import { UIState } from "./ui/types";
import { TProcessState } from "./process/types";
import { TPSSState } from "./pss/types";
import { SelectionsState } from "./selections/types";
import { SceneState } from "./scene/types";
import { TLearningsState } from "./learnings/types";

import { mainReducer } from "./main/reducer";
import { authReducer } from "./auth/reducer";
import { UIReducer } from "./ui/reducer";
import { dataReducer } from "./data/reducer";
import { ProcessReducer } from "./process/reducer";
import { PSSReducer } from "./pss/reducer";
import { sceneReducer } from "./scene/reducer";
import { selectionsReducer } from "./selections/reducer";
import { LearningsReducer } from "./learnings/reducer";
// Import createLogger from redux-logger
import { createLogger } from "redux-logger";

export type ApplicationState = {
  selections: SelectionsState;
  scene: SceneState;
  main: MainState;
  data: DataState;
  auth: AuthState;
  ui: UIState;
  process: TProcessState;
  pss: TPSSState;
  learnings: TLearningsState;
  router: any;
};

export const history = createBrowserHistory();

const createRootReducer = () =>
  combineReducers<ApplicationState>({
    selections: selectionsReducer,
    scene: sceneReducer,
    main: mainReducer,
    data: dataReducer,
    auth: authReducer,
    ui: UIReducer,
    process: ProcessReducer,
    pss: PSSReducer,
    learnings: LearningsReducer,
    router: connectRouter(history),
  });

const configureStore = (preloadedState?: any) => {
  const logger = createLogger({
    predicate: (getState: any, action: any) =>
      action.type !== "UNSELECT_HOVERED" &&
      action.type !== "CHANGE_REQUEST_PROGRESS",
  });
  return createStore(
    createRootReducer(),
    preloadedState
    // applyMiddleware(logger)
  );
};

export default configureStore;
