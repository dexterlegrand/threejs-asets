import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";

export function enableControls(controls: OrbitControls, enabled: boolean) {
  controls.enabled = enabled;
}
