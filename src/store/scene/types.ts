import { Camera, WebGLRenderer } from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";

export enum SceneActionTypes {
  SET_CAMERA = "SET_CAMERA",
  SET_CONTROLS = "SET_CONTROLS",
  SET_RENDERER = "SET_RENDERER",
  FOCUS_TARGET = "FOCUS_TARGET",
}

export type SceneState = {
  camera?: Camera;
  controls?: OrbitControls;
  renderer?: WebGLRenderer;
};
