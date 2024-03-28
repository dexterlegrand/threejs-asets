import {
  ArrowHelper,
  Font,
  Mesh,
  MeshBasicMaterial,
  TextGeometry,
  Vector3,
  BoxGeometry,
} from "three";
import { fontUrl } from "../../pages/utils/agent";
import { deg180InRad, deg90InRad } from "../../store/main/constants";

const vectorX = new Vector3(1, 0, 0);
const vectorY = new Vector3(0, 1, 0);
const vectorZ = new Vector3(0, 0, 1);

export function getSimpleAxisHelper(length: number = 1, parent?: string) {
  const mesh = new Mesh();
  mesh.name = `AxisHelper-${parent ?? ""}`;
  mesh.add(
    getArrowHelper(vectorX, length, 0x0000ff),
    getArrowHelper(vectorY, length, 0xff0000),
    getArrowHelper(vectorZ, length, 0x00d000)
  );
  return mesh;
}

export function getAxisHelper(length: number, parent: Mesh, boxSize: number) {
  const json = localStorage.getItem(fontUrl);
  if (!json) return;

  const font = new Font(JSON.parse(json));

  const mesh = new Mesh();
  mesh.name = "AxisHelper";

  const textParameters = {
    font,
    size: 0.03,
    height: 0.001,
    curveSegments: 1,
  };

  const xGeometry = new TextGeometry("X", textParameters);
  xGeometry.center();
  const textX = new Mesh(xGeometry, new MeshBasicMaterial({ color: 0x0000ff }));
  textX.position.setX(length + 0.15 * length);
  textX.name = "X";

  const yGeometry = new TextGeometry("Y", textParameters);
  yGeometry.center();
  const textY = new Mesh(yGeometry, new MeshBasicMaterial({ color: 0xff0000 }));
  textY.position.setY(length + 0.15 * length);
  textY.name = "Y";

  const zGeometry = new TextGeometry("Z", textParameters);
  zGeometry.center();
  const textZ = new Mesh(zGeometry, new MeshBasicMaterial({ color: 0x00d000 }));
  textZ.position.setZ(length + 0.15 * length);
  textZ.name = "Z";

  const textMesh = new Mesh();
  textMesh.name = "AxesText";
  textMesh.add(textX, textY, textZ);

  mesh.add(
    getArrowHelper(vectorX, length, 0x0000ff),
    getArrowHelper(vectorY, length, 0xff0000),
    getArrowHelper(vectorZ, length, 0x00d000),
    textMesh
  );

  const transparentMaterial = new MeshBasicMaterial({
    transparent: true,
    opacity: 0,
  });

  const southPanel = new Mesh(
    new BoxGeometry(boxSize, boxSize, 0.001),
    transparentMaterial
  );
  southPanel.position.setZ(boxSize / 2);
  southPanel.userData = { isAxisCube: true, rotation: new Vector3(0, 0, 1) };
  mesh.add(southPanel);

  const northPanel = new Mesh(
    new BoxGeometry(boxSize, boxSize, 0.001),
    transparentMaterial
  );
  northPanel.position.setZ(-boxSize / 2);
  northPanel.userData = { isAxisCube: true, rotation: new Vector3(0, 0, -1) };
  mesh.add(northPanel);

  const westPanel = new Mesh(
    new BoxGeometry(0.001, boxSize, boxSize),
    transparentMaterial
  );
  westPanel.position.setX(-boxSize / 2);
  westPanel.userData = { isAxisCube: true, rotation: new Vector3(-1) };
  mesh.add(westPanel);

  const eastPanel = new Mesh(
    new BoxGeometry(0.001, boxSize, boxSize),
    transparentMaterial
  );
  eastPanel.position.setX(boxSize / 2);
  eastPanel.userData = { isAxisCube: true, rotation: new Vector3(1) };
  mesh.add(eastPanel);

  const topPanel = new Mesh(
    new BoxGeometry(boxSize, 0.001, boxSize),
    transparentMaterial
  );
  topPanel.position.setY(boxSize / 2);
  topPanel.userData = { isAxisCube: true, rotation: new Vector3(0, 1) };
  mesh.add(topPanel);

  const bottomPanel = new Mesh(
    new BoxGeometry(boxSize, 0.001, boxSize),
    transparentMaterial
  );
  bottomPanel.position.setY(-boxSize / 2);
  bottomPanel.userData = { isAxisCube: true, rotation: new Vector3(0, -1) };
  mesh.add(bottomPanel);

  createText(
    "SOUTH",
    font,
    mesh,
    new Vector3(-2, 0.01, 0.05),
    new Vector3(),
    true
  );
  createText(
    "XY",
    font,
    mesh,
    new Vector3(-2, -0.03, 0.05),
    new Vector3(),
    true
  );

  createText(
    "NORTH",
    font,
    mesh,
    new Vector3(2, 0.01, -0.05),
    new Vector3(0, deg180InRad),
    true
  );
  createText(
    "X-Y",
    font,
    mesh,
    new Vector3(2, -0.03, -0.05),
    new Vector3(0, deg180InRad),
    true
  );

  createText(
    "TOP",
    font,
    mesh,
    new Vector3(-2, 0.05, -0.01),
    new Vector3(-deg90InRad),
    true
  );
  createText(
    "X-Z",
    font,
    mesh,
    new Vector3(-2, 0.05, 0.02),
    new Vector3(-deg90InRad),
    true
  );

  createText(
    "BOTTOM",
    font,
    mesh,
    new Vector3(2, -0.051, -0.01),
    new Vector3(-deg90InRad, deg180InRad),
    true
  );
  createText(
    "XZ",
    font,
    mesh,
    new Vector3(2, -0.051, 0.02),
    new Vector3(-deg90InRad, deg180InRad),
    true
  );

  createText(
    "EAST",
    font,
    mesh,
    new Vector3(0.05, 0.01, 2),
    new Vector3(0, deg90InRad)
  );
  createText(
    "-ZY",
    font,
    mesh,
    new Vector3(0.05, -0.03, 2),
    new Vector3(0, deg90InRad)
  );

  createText(
    "WEST",
    font,
    mesh,
    new Vector3(-0.05, 0.01, -2),
    new Vector3(0, -deg90InRad)
  );
  createText(
    "ZY",
    font,
    mesh,
    new Vector3(-0.05, -0.03, -2),
    new Vector3(0, -deg90InRad)
  );

  parent.add(mesh);
}

function createText(
  str: string,
  font: Font,
  parent: Mesh,
  vector: Vector3,
  rotation: Vector3,
  isX?: boolean
) {
  const text = new Mesh(
    new TextGeometry(str, {
      font,
      size: 0.012,
      height: 0.001,
      curveSegments: 1,
    }),
    new MeshBasicMaterial({ color: 0xffffff })
  );
  text.geometry.computeBoundingBox();
  const bb = text.geometry.boundingBox;

  text.position.add(vector);
  text.rotation.setFromVector3(rotation);

  isX
    ? text.position.setX(bb.max.x / text.position.x)
    : text.position.setZ(bb.max.x / text.position.z);

  text.updateMatrix();
  text.matrixAutoUpdate = false;

  parent.add(text);
}

export function getArrowHelper(
  vector: Vector3,
  length: number,
  hexColor: number
) {
  return new ArrowHelper(vector, new Vector3(0, 0, 0), length, hexColor);
}
