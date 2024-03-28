import { action } from "typesafe-actions";
import { SceneActionTypes } from "./types";
import { Camera, WebGLRenderer, Vector3 } from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";

export const setCameraAction = (camera: Camera) => {
  return action(SceneActionTypes.SET_CAMERA, { camera });
};

export const setControlsAction = (controls: OrbitControls) => {
  return action(SceneActionTypes.SET_CONTROLS, { controls });
};

export const setRendererAction = (renderer: WebGLRenderer) => {
  return action(SceneActionTypes.SET_RENDERER, { renderer });
};

export const focusTarget = (target: Vector3, position?: Vector3) => {
  return action(SceneActionTypes.FOCUS_TARGET, { target, position });
};
