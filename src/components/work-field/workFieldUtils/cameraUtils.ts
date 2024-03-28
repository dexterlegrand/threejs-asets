import { Quaternion, Camera, Vector3, OrthographicCamera, PerspectiveCamera } from "three";
import { deg90InRad } from "../../../store/main/constants";
import { TCameraSettings } from "../../../store/main/types";

export function getCamera(camera?: Camera, cameraSettings?: TCameraSettings) {
  if (cameraSettings?.cameraType === "Othrographic") {
    return getOrthographicCamera(camera);
  } else {
    return getPerspectiveCamera(camera);
  }
}

function getPerspectiveCamera(camera?: Camera) {
  const newCamera = new PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.1, 10000);
  newCamera.name = "PerspectiveCamera";
  setCameraParams(newCamera, camera);
  return newCamera;
}

function getOrthographicCamera(camera?: Camera) {
  const newCamera = new OrthographicCamera(
    window.innerWidth / -16,
    window.innerWidth / 16,
    window.innerHeight / 16,
    window.innerHeight / -16,
    -400,
    10000
  );
  newCamera.name = "OrthographicCamera";
  setCameraParams(newCamera, camera);
  return newCamera;
}

function setCameraParams(newCamera: Camera, camera?: Camera) {
  if (camera) {
    newCamera.position.copy(camera.position);
    newCamera.rotation.copy(camera.rotation);
  } else {
    newCamera.position.set(30, 30, 0);
    newCamera.position.applyQuaternion(
      new Quaternion().setFromAxisAngle(new Vector3(0, 1, 0), -deg90InRad)
    );
  }
}
