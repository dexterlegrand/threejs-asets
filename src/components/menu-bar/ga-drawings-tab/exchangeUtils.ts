import GLTFLoader from "three-gltf-loader";
import { GLTFExporter } from "three/examples/jsm/exporters/GLTFExporter.js";
import { PLYExporter } from "three/examples/jsm/exporters/PLYExporter.js";
import { ColladaExporter } from "three/examples/jsm/exporters/ColladaExporter.js";
import { Object3D, Scene } from "three";
import saveAs from "file-saver";

const glTF = new GLTFExporter();
const ply = new PLYExporter();
const collada = new ColladaExporter();

function removeElement(scene: Scene, name: string) {
  const element = scene.getObjectByName(name);
  while (element && element.parent) {
    element.parent.remove(element);
  }
}

function fixSceneForConverting(scene: Scene) {
  const fixed = scene.clone();
  removeElement(fixed, "AxesBoxHelper");
  removeElement(fixed, "DROP-CIRCLE");
  removeElement(fixed, "DROP-CYLINDER-X");
  removeElement(fixed, "DROP-CYLINDER-Y");
  removeElement(fixed, "DROP-CYLINDER-Z");
  removeElement(fixed, "PIPE-ELEMENT-ANCHOR");
  removeElement(fixed, "COORDS");
  removeElement(fixed, "CENTER-COORDS");
  removeElement(fixed, "DISTANCE-HELPER");
  // fixed.scale.multiplyScalar(1000);
  return fixed;
}

export function exportToGLTF(scene: Scene, name: string) {
  try {
    const fixed = fixSceneForConverting(scene);
    glTF.parse(
      fixed,
      (obj) => {
        console.log(obj);
        const data = new Blob([JSON.stringify(obj)]);
        saveAs(data, `${name}.idsv`);
      },
      {}
    );
  } catch (error) {
    console.error(error);
  }
}

export function exportToPLY(scene: Scene, name: string) {
  const fixed = fixSceneForConverting(scene);
  ply.parse(
    fixed,
    (obj) => {
      console.log(obj);
      const data = new Blob([obj]);
      saveAs(data, `${name}.ply`);
    },
    {}
  );
}

export function exportToCollada(scene: Scene, name: string) {
  const fixed = fixSceneForConverting(scene);
  collada.parse(
    fixed,
    (obj) => {
      console.log(obj);
      const data = new Blob([JSON.stringify(obj)]);
      saveAs(data, `${name}.dae`);
    },
    {}
  );
}

export function loadGLTF(file: File, callback: (scene: Scene) => any) {
  const loader = new GLTFLoader();
  file
    .arrayBuffer()
    .then((buffer) => loader.parse(buffer, "", (gltf) => callback(gltf.scene)));
}
