import { ActionType, createReducer } from "typesafe-actions";
import { SceneActionTypes, SceneState } from "./types";
import * as actions from "./actions";
import { getPosByDistance } from "../../components/3d-models/utils";

export type MainAction = ActionType<typeof actions>;

const reducer = createReducer<SceneState, MainAction>({})
  .handleType(SceneActionTypes.SET_CAMERA, (state, action) => ({
    ...state,
    camera: action.payload.camera,
  }))
  .handleType(SceneActionTypes.SET_CONTROLS, (state, action) => {
    const controls = action.payload.controls;
    controls.rotateSpeed = 0.3;
    controls.panSpeed = 0.3;
    controls.zoomSpeed = 0.3;
    return { ...state, controls };
  })
  .handleType(SceneActionTypes.SET_RENDERER, (state, action) => ({
    ...state,
    renderer: action.payload.renderer,
  }))
  .handleType(SceneActionTypes.FOCUS_TARGET, (state, action) => {
    const { target, position } = action.payload;
    const controls = state.controls;
    if (!controls) return state;
    controls.target.copy(target);
    controls.update();
    if (position) {
      controls.object.position.copy(position);
    } else if (controls.object.position.distanceTo(target) > 5) {
      controls.object.position.copy(
        getPosByDistance(5, target, controls.object.position)
      );
    }
    controls.object.lookAt(target);
    return { ...state, controls };
  });

export { reducer as sceneReducer };
