import { Dispatch } from "redux";
import {
  TCustomGrid,
  TSelectedPipe,
  TSelectedPipeSupport,
  ModelItem,
  TSelectedPipeConnector,
  FreePipe,
  Project,
  TGridSettings,
} from "../../../store/main/types";
import {
  Group,
  LineBasicMaterial,
  BufferGeometry,
  Vector3,
  Line,
  Font,
  Mesh,
  TextGeometry,
  MeshBasicMaterial,
  Scene,
  Camera,
  Vector2,
  Raycaster,
  Object3D,
  PerspectiveCamera,
  WebGLRenderer,
  Clock,
  CircleGeometry,
  Intersection,
  CylinderGeometry,
  SphereGeometry,
  Material,
  MeshLambertMaterial,
  DoubleSide,
  MeshPhongMaterial,
} from "three";
import {
  MMtoM,
  getPosByDistance,
  roundVectorM,
  radToDeg,
  degToRad,
  roundM,
  getMiddleVector3,
  localToGlobal,
  getRGB,
} from "../../3d-models/utils";
import { deg90InRad, deg360InRad, red } from "../../../store/main/constants";
import { addEventAction } from "../../../store/ui/actions";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import {
  unselectHovered,
  setHoveredPipeAction,
  setHoveredMemberAction,
  setHoveredPipeConnectorAction,
  setHoveredPipeSupportAction,
} from "../../../store/selections/actions";
import {
  drawProcessElement,
  dropProcess,
} from "../../3d-models/process/process";
import {
  EProcessElementType,
  TProcess,
  TProcessElement,
  TProcessState,
} from "../../../store/process/types";
import { fontUrl } from "../../../pages/utils/agent";
import { dropZoneMaterial } from "../../../services/process-services/mouse-pipe-creating-service";
import {
  TPipeElementAnchor,
  getPipePoints,
} from "../../../services/pipe-services/pipe-service";
import { TBeamElement, TOpenFrame } from "../../../store/main/openFrameTypes";
import { TOFCreationElementType } from "../../../recoil/atoms/of-creation-atom";
import { DataState } from "../../../store/data/types";
import { OpenFrameUI } from "../../../store/ui/types";

const UDGmaterial = new LineBasicMaterial({ color: "#FF0000" });

export function drawUserDefinedGrids(
  scene: Scene,
  customs: TCustomGrid[],
  dispatch?: Dispatch
) {
  const customGrids: TCustomGrid[] = [];

  for (const c of customs) {
    const grid = customGrids.find(
      (cg) => cg.x === c.x && cg.y === c.y && cg.z === c.z
    );
    if (
      grid &&
      grid.positionsX === c.positionsX &&
      grid.positionsZ === c.positionsZ
    ) {
      dispatch &&
        dispatch(
          addEventAction(
            `Grid "${c.name}" is duplicate of "${grid.name}"`,
            "warning"
          )
        );
    } else if (c.display) customGrids.push(c);
  }

  const json = localStorage.getItem(fontUrl);
  if (json) {
    const font = new Font(JSON.parse(json));

    const grids = new Group();
    grids.name = "UDG";
    for (const c of customGrids) {
      const group = new Group();
      group.position.set(MMtoM(c.x), MMtoM(c.y), MMtoM(c.z));
      group.name = `UDG-${c.name}`;
      const posX = c.positionsX.split(" ").map((val) => MMtoM(Number(val)));
      const namesX = c.namesX.split(" ");
      const posZ = c.positionsZ.split(" ").map((val) => MMtoM(Number(val)));
      const namesZ = c.namesZ.split(" ");
      const minX =
        posX.reduce((min, val) => Math.min(min, val), posX[0] ?? 0) - 1;
      const maxX =
        posX.reduce((max, val) => Math.max(max, val), posX[0] ?? 0) + 1;
      const minZ =
        posZ.reduce((min, val) => Math.min(min, val), posZ[0] ?? 0) - 1;
      const maxZ =
        posZ.reduce((max, val) => Math.max(max, val), posZ[0] ?? 0) + 1;
      for (let i = 0; i < posX.length; i++) {
        const x = posX[i];
        const start = new Vector3(x, 0, minZ);
        const end = new Vector3(x, 0, maxZ);
        group.add(createLine(start, end));
        const txt = createText(
          namesX[i] ?? "",
          font as Font,
          new Vector3(-deg90InRad)
        );
        const circle = createCircle(0.3);
        circle.position.copy(getPosByDistance(-0.3, start, end));
        circle.add(txt);
        const circle2 = circle.clone();
        circle.position.copy(
          getPosByDistance(start.distanceTo(end) + 0.3, start, end)
        );
        group.add(circle, circle2);
      }
      for (let i = 0; i < posZ.length; i++) {
        const z = posZ[i];
        const start = new Vector3(minX, 0, z);
        const end = new Vector3(maxX, 0, z);
        group.add(createLine(start, end));
        const txt = createText(
          namesZ[i] ?? "",
          font as Font,
          new Vector3(-deg90InRad, 0, deg90InRad)
        );
        const circle = createCircle(0.3);
        circle.position.copy(getPosByDistance(-0.3, start, end));
        circle.add(txt);
        const circle2 = circle.clone();
        circle.position.copy(
          getPosByDistance(start.distanceTo(end) + 0.3, start, end)
        );
        group.add(circle, circle2);
      }
      grids.add(group);
    }
    scene.add(grids);
  }
}

function createLine(start: Vector3, end: Vector3) {
  const geometry = new BufferGeometry().setFromPoints([start, end]);
  return new Line(geometry, UDGmaterial);
}

function createCircle(radius: number) {
  const angle = deg360InRad / 16;
  const y = new Vector3(0, 1);
  const group = new Group();
  for (let i = 0; i < 16; i++) {
    const start = new Vector3(0, 0, radius).applyAxisAngle(y, angle * i);
    const end = new Vector3(0, 0, radius).applyAxisAngle(y, angle * (i + 1));
    group.add(createLine(start, end));
  }
  return group;
}

function createText(str: string, font: Font, rotation: Vector3) {
  const text = new Mesh(
    new TextGeometry(str, {
      font,
      size: 0.3,
      height: 0.001,
      curveSegments: 1,
    }),
    new MeshBasicMaterial({ color: 0xff0000 })
  );
  text.geometry.computeBoundingBox();

  const bb = text.geometry.boundingBox;

  if (!rotation.z) {
    text.position.setX(-bb.max.x / 2);
    text.position.setZ(bb.max.y / 2);
  } else {
    text.position.setX(bb.max.x / 2);
    text.position.setZ(bb.max.y / 2);
  }

  text.rotation.setFromVector3(rotation);

  text.updateMatrix();
  text.matrixAutoUpdate = false;

  return text;
}

export function changeTargetOfRotation(
  controls: OrbitControls | undefined | null,
  camera: Camera | undefined,
  point: Vector3
) {
  if (!(controls && camera)) return;
  controls.target.copy(point);
  controls.update();
  if (camera.position.distanceTo(point) > 100) {
    camera.position.copy(getPosByDistance(100, point, camera.position));
  }
  camera.lookAt(point);
}

function getParent(obj?: Object3D | null): Object3D | undefined {
  if (!obj) return undefined;
  return obj.userData?.isModelItem ? obj : getParent(obj.parent);
}

export function getObjectOnScreen(
  event: React.MouseEvent,
  camera: Camera,
  scene: Scene,
  canvas: HTMLCanvasElement
) {
  const mouse = new Vector2(
    (event.clientX / canvas.clientWidth) * 2 - 1,
    -(event.clientY / canvas.clientHeight) * 2 + 1
  );
  const raycaster = new Raycaster();
  raycaster.setFromCamera(mouse, camera);
  const intersects = raycaster.intersectObjects(scene.children, true);

  let obj;
  const elements = [];
  const modelItemsNames: string[] = [];
  if (
    intersects.some(
      (intersect) => intersect.object.name === "CONNECTION-ANCHOR"
    )
  ) {
    const data = intersects.find(
      (intersect) => intersect.object.name === "CONNECTION-ANCHOR"
    )?.object.userData;
    return data ? [data] : [];
  } else if (
    intersects.some((intersect) => intersect.object.name === "LSA-ANCHOR")
  ) {
    const intersect = intersects.find(
      (intersect) => intersect.object.name === "LSA-ANCHOR"
    );
    intersect?.object.userData.setElement({
      element: {
        item: intersect.object.userData.item,
        pipe: intersect.object.userData.pipe,
        type: intersect.object.userData.type,
      },
      result: undefined,
    });
    return [];
  } else if (
    intersects.some(
      (intersect) => intersect.object.name === "PIPE-ELEMENT-ANCHOR"
    )
  ) {
    const data = intersects.find(
      (intersect) => intersect.object.name === "PIPE-ELEMENT-ANCHOR"
    )?.object.userData;
    return data ? [data] : [];
  } else {
    for (const intersect of intersects) {
      if (
        intersect.object.parent?.userData?.isPipeConnector ||
        intersect.object.parent?.userData?.isProcessLine
      ) {
        elements.push(intersect.object.parent.userData);
      }
      if (
        intersect.object.userData?.isInstrLine ||
        intersect.object.userData?.isIntrumentationElement ||
        intersect.object.userData?.isProcessLine ||
        intersect.object.userData?.isProcessNozzle ||
        intersect.object.userData?.isFreePipe ||
        intersect.object.userData?.isAxisCube ||
        intersect.object.userData?.isModelPlatform
      ) {
        elements.push(intersect.object.userData);
      }
      if (intersect.object.userData?.isConnectPoint) {
        elements.push(intersect.object);
      }
      if (intersect.object.userData?.isProcessSubItem) {
        elements.push({
          ...intersect.object?.parent?.userData,
          point: intersect.point,
        });
      }
      if (intersect.object.userData?.isProcessItem) {
        elements.push({ ...intersect.object.userData, point: intersect.point });
      }
      if (intersect.object.parent?.parent?.userData?.isFreePipeSupport) {
        elements.push(intersect.object.parent?.parent?.userData);
      }

      obj = intersect.object;
      if (!intersect.object.userData?.isModelItem) {
        obj = getParent(obj.parent);
      }
      if (
        obj?.userData?.isModelItem &&
        !modelItemsNames.includes(obj.userData.name)
      ) {
        elements.push({
          ...obj.userData,
          intersect: intersect.point.clone(),
        });
        modelItemsNames.push(obj.userData.name);
      }
    }
  }
  return elements;
}

export function getIntersects(mouse: Vector2, camera: Camera, scene: Scene) {
  const raycaster = new Raycaster();
  raycaster.setFromCamera(mouse, camera);
  return raycaster.intersectObjects(scene.children, true);
}

export function hoverObjectOnScreen(
  dispatch: Dispatch,
  mouse: Vector2,
  camera: Camera,
  scene: Scene
) {
  const intersects = getIntersects(mouse, camera, scene);

  for (const intersect of intersects) {
    if (intersect.object.parent?.userData?.isPipeConnector) {
      dispatch(
        setHoveredPipeConnectorAction(
          intersect.object.parent.userData as TSelectedPipeConnector
        )
      );
      return;
    } else if (intersect.object.parent?.parent?.userData?.isFreePipeSupport) {
      dispatch(
        setHoveredPipeSupportAction(
          intersect.object.parent?.parent?.userData as TSelectedPipeSupport
        )
      );
      return;
    } else if (intersect.object.userData?.isFreePipe) {
      dispatch(
        setHoveredPipeAction(intersect.object.userData as TSelectedPipe)
      );
      return;
    }
    let obj: Object3D | undefined = intersect.object;
    if (!intersect.object.userData?.isModelItem) {
      obj = getParent(obj.parent);
    }
    if (obj?.userData?.isModelItem) {
      dispatch(setHoveredMemberAction(obj.userData as ModelItem));
      return;
    }
  }
  dispatch(unselectHovered());
}

export function getMouseScreenPosition(event: React.MouseEvent) {
  const x = (event.clientX / window.innerWidth) * 2 - 1;
  const y = -(event.clientY / window.innerHeight) * 2 + 1;
  const position = new Vector2(x, y);
  return position;
}

export function checkCtrlShiftS(event: KeyboardEvent) {
  return event.ctrlKey && event.shiftKey && event.code === "KeyS";
}

export function removeElementFromScene(scene: Scene, elementName: string) {
  const obj = scene.getObjectByName(elementName);
  obj && scene.remove(obj);
}

export function resizeScene(renderer: WebGLRenderer, controls: OrbitControls) {
  const canvas = renderer.domElement;
  const width = canvas.clientWidth;
  const height = canvas.clientHeight;
  const needResize = canvas.width !== width || canvas.height !== height;
  if (!needResize) return;
  renderer.setSize(width, height, false);
  if (!(controls.object as THREE.PerspectiveCamera).isPerspectiveCamera) return;
  (controls.object as THREE.PerspectiveCamera).aspect = width / height;
  (controls.object as THREE.PerspectiveCamera).updateProjectionMatrix();
}

export function animatePSS(scene: Scene, clock: Clock) {
  const group = scene.getObjectByName("PSS");
  if (!clock.running || !group) return;
  const delta = clock.getDelta();
  for (const ch of group.children) {
    group.userData.animate(ch, delta);
  }
}

export function handleDragOver(event: React.DragEvent<HTMLCanvasElement>) {
  event.preventDefault();
}
export function getNearestDistance(pos: Vector3, customGrids?: TCustomGrid[]) {
  if (!customGrids) return { dis: 0, point: pos.clone(), realPos: pos.clone() };

  for (const c of customGrids) {
    const posX = c.positionsX
      .split(" ")
      .map((val) => MMtoM(c.x) + MMtoM(Number(val)));
    const posZ = c.positionsZ
      .split(" ")
      .map((val) => MMtoM(c.z) + MMtoM(Number(val)));

    const minX =
      posX.reduce((min, val) => Math.min(min, val), posX[0] ?? 0) - 1;
    const maxX =
      posX.reduce((max, val) => Math.max(max, val), posX[0] ?? 0) + 1;
    const minZ =
      posZ.reduce((min, val) => Math.min(min, val), posZ[0] ?? 0) - 1;
    const maxZ =
      posZ.reduce((max, val) => Math.max(max, val), posZ[0] ?? 0) + 1;

    let disX = Number.POSITIVE_INFINITY;
    let disZ = Number.POSITIVE_INFINITY;
    let newX = pos.x;
    let newZ = pos.z;
    if (pos.x >= minX && pos.x <= maxX && pos.z >= minZ && pos.z <= maxZ) {
      for (let i = 0; i < posX.length; i++) {
        if (disX > Math.abs(posX[i] - pos.x)) {
          disX = Math.abs(posX[i] - pos.x);
          newX = posX[i];
        }
      }
      for (let i = 0; i < posZ.length; i++) {
        if (disZ > Math.abs(posZ[i] - pos.z)) {
          disZ = Math.abs(posZ[i] - pos.z);
          newZ = posZ[i];
        }
      }
      const point = new Vector3(newX, MMtoM(c.y), newZ);

      const realPos = pos.clone();
      if (disX > disZ) realPos.setZ(newZ);
      else realPos.setX(newX);
      realPos.setY(MMtoM(c.y));
      return {
        dis: disX > disZ ? disZ : disX,
        axe: disX > disZ ? "Z" : "X",
        point,
        realPos,
      };
    }
  }
  return { dis: 0, point: pos.clone(), realPos: pos.clone() };
}
export function snapToCustomGrid(pos: Vector3, customGrids?: TCustomGrid[]) {
  if (!customGrids) return pos;
  const realPos = pos.clone();

  for (const c of customGrids) {
    const posX = c.positionsX
      .split(" ")
      .map((val) => MMtoM(c.x) + MMtoM(Number(val)));
    const posZ = c.positionsZ
      .split(" ")
      .map((val) => MMtoM(c.z) + MMtoM(Number(val)));

    const minX =
      posX.reduce((min, val) => Math.min(min, val), posX[0] ?? 0) - 1;
    const maxX =
      posX.reduce((max, val) => Math.max(max, val), posX[0] ?? 0) + 1;
    const minZ =
      posZ.reduce((min, val) => Math.min(min, val), posZ[0] ?? 0) - 1;
    const maxZ =
      posZ.reduce((max, val) => Math.max(max, val), posZ[0] ?? 0) + 1;

    let disX = Number.POSITIVE_INFINITY;
    let disZ = Number.POSITIVE_INFINITY;
    let newX = pos.x;
    let newZ = pos.z;
    if (pos.x >= minX && pos.x <= maxX && pos.z >= minZ && pos.z <= maxZ) {
      for (let i = 0; i < posX.length; i++) {
        if (disX > Math.abs(posX[i] - pos.x)) {
          disX = Math.abs(posX[i] - pos.x);
          newX = posX[i];
        }
      }
      for (let i = 0; i < posZ.length; i++) {
        if (disZ > Math.abs(posZ[i] - pos.z)) {
          disZ = Math.abs(posZ[i] - pos.z);
          newZ = posZ[i];
        }
      }
      if (disX > disZ) realPos.setZ(newZ);
      else realPos.setX(newX);
      realPos.setY(MMtoM(c.y));
    }
  }

  return pos.copy(realPos);
}
export function handleDrop(
  event: React.DragEvent<HTMLCanvasElement>,
  process: TProcessState,
  currentProject: string,
  scene: Scene,
  renderer: WebGLRenderer | undefined,
  camera: Camera | undefined,
  dispatch: Dispatch,
  resources: DataState,
  project: Project | undefined,
  openFrameUI: OpenFrameUI | undefined,
  customGrids: TCustomGrid[]
) {
  const p = process.processes?.get(currentProject);
  if (!p || !renderer || !camera) return;
  dropProcess(
    event,
    currentProject,
    p,
    scene,
    renderer,
    camera,
    dispatch,
    resources,
    project,
    openFrameUI,
    customGrids
  );
}

export function updateAxesHelperParams(scene: Scene, controls: OrbitControls) {
  const abh = scene.getObjectByName("AxesBoxHelper");
  if (abh) {
    abh.parent?.position.set(
      controls.object.position.x,
      controls.object.position.y,
      controls.object.position.z
    );
    abh.parent?.rotation.set(
      controls.object.rotation.x,
      controls.object.rotation.y,
      controls.object.rotation.z
    );
    abh.quaternion.copy(controls.object.quaternion.inverse());
    abh.position.set(
      -0.82 * (controls.object as PerspectiveCamera).aspect,
      -0.69,
      -1.4
    );
    abh
      .getObjectByName("AxesText")
      ?.children.forEach((child) =>
        child.quaternion.copy(
          child.name === "X"
            ? controls.object.quaternion.inverse()
            : controls.object.quaternion
        )
      );
  }
}

function getDropZoneIntersect(intersects: Intersection[]) {
  let i: Intersection | undefined;
  for (const intersect of intersects) {
    if (intersect.object.userData.isConnectPoint) {
      return intersect;
    }
    if (
      [
        "DROP-CIRCLE",
        "DROP-CYLINDER-X",
        "DROP-CYLINDER-Y",
        "DROP-CYLINDER-Z",
        "PIPE-ELEMENT-ANCHOR",
      ].includes(intersect.object.name) ||
      intersect.object.userData.isProcessItem
    ) {
      if (!i || i.distance > intersect.distance) i = intersect;
    }
  }
  return i;
}

function getDropZoneIntersectPoint(
  intersect: Intersection | undefined,
  position?: Vector3
) {
  if (!intersect) return undefined;
  if (intersect.object.userData.isDimensionAnchor) {
    return intersect.object.userData.position;
  }

  if (intersect.object.userData.isProcessItem) {
    const element = intersect.object.userData as TProcessElement;
    const pos = intersect.point.clone();

    // const pos = new Vector3(
    //   element.position.x,
    //   element.position.y,
    //   element.position.z
    // );
    return roundVectorM(pos, 100);
  } else if (intersect.object.userData.isConnectPoint) {
    const element = intersect.object.parent!.userData as TProcessElement;
    const point = element.points.find(
      (p) => p.id === intersect.object.userData.id
    );

    if (point) {
      const pos = new Vector3(
        element.position.x,
        element.position.y,
        element.position.z
      );
      pos.add(
        point.generalPosition
          .clone()
          .applyAxisAngle(new Vector3(1), degToRad(element.rotationX ?? 0))
          .applyAxisAngle(new Vector3(0, 1), degToRad(element.rotation))
          .applyAxisAngle(
            new Vector3(0, 0, 1),
            degToRad(element.rotationZ ?? 0)
          )
      );
      return roundVectorM(pos, 100);
    }
  }
  if (intersect.object.name === "PIPE-ELEMENT-ANCHOR") {
    const pos = intersect.point.clone();

    return roundVectorM(pos, 100);
  }
  if (!position) return;
  if (intersect.object.name === "DROP-CIRCLE") {
    const pos = intersect.point.clone();
    pos.copy(adjustDropPosition(position, pos));
    return roundVectorM(pos, 100);
  } else if (intersect.object.name === "DROP-CYLINDER-X") {
    const point = position.clone();
    point.setX(intersect.point.x);
    return roundVectorM(point, 100);
  } else if (intersect.object.name === "DROP-CYLINDER-Y") {
    const point = position.clone();
    point.setY(intersect.point.y);
    return roundVectorM(point, 100);
  } else if (intersect.object.name === "DROP-CYLINDER-Z") {
    const point = position.clone();
    point.setZ(intersect.point.z);
    return roundVectorM(point, 100);
  } else return undefined;
}

export function getNewPointOnScreen(
  event: React.MouseEvent,
  camera: Camera,
  scene: Scene,
  canvas: HTMLCanvasElement
) {
  const mouse = new Vector2(
    (event.clientX / canvas.clientWidth) * 2 - 1,
    -(event.clientY / canvas.clientHeight) * 2 + 1
  );
  const raycaster = new Raycaster();
  raycaster.setFromCamera(mouse, camera);

  const grid = scene.getObjectByName("GridHelper");
  const intersects = raycaster.intersectObjects(grid ? [grid] : [], false);

  return roundVectorM(
    intersects
      .reduce((acc, i) => acc.add(i.point), new Vector3())
      .divideScalar(intersects.length),
    100
  );
}

export function getPointOnScreen(
  event: React.MouseEvent,
  camera: Camera,
  scene: Scene,
  canvas: HTMLCanvasElement,
  position?: Vector3
) {
  const mouse = new Vector2(
    (event.clientX / canvas.clientWidth) * 2 - 1,
    -(event.clientY / canvas.clientHeight) * 2 + 1
  );
  return getDropZoneIntersectPoint(
    getDropZoneIntersect(getIntersects(mouse, camera, scene)),
    position
  );
}

export function getDistanceBetweenDropZones(
  mouse: Vector2,
  controls: OrbitControls,
  scene: Scene,
  position?: Vector3,
  font?: Font
) {
  if (!position || !font) return;
  const intersect = getDropZoneIntersect(
    getIntersects(mouse, controls.object, scene)
  );
  if (!intersect) return;
  const point = getDropZoneIntersectPoint(intersect, position);
  if (!point) return;
  scene.add(getDistanceHelper(controls, intersect, position, point, font));
}

export function adjustDropPosition(from: Vector3, to: Vector3) {
  let angle;
  const newTo = to.clone();

  // if (from.y === to.y) {
  const xV = new Vector3(1);
  const v = to
    .clone()
    .sub(from)
    .normalize();
  angle = radToDeg(Math.atan2(v.z, v.x));

  let newAngle = Math.round(angle / 10) * 10;

  if (Math.abs(newAngle - angle) > Math.abs(45 - angle)) newAngle = 45;
  if (Math.abs(newAngle - angle) > Math.abs(135 - angle)) newAngle = 135;
  if (Math.abs(newAngle - angle) > Math.abs(-45 - angle)) newAngle = -45;
  if (Math.abs(newAngle - angle) > Math.abs(-135 - angle)) newAngle = -135;
  // }
  angle = newAngle;
  // If angle is not a multiple of 45, adjust the position
  const adjustedAngle = degToRad(angle);
  const length = to.distanceTo(from);
  newTo.x = from.x + length * Math.cos(adjustedAngle);
  newTo.z = from.z + length * Math.sin(adjustedAngle);
  // }
  return newTo;
}

export function getDropPosition(
  mouse: Vector2,
  controls: OrbitControls,
  scene: Scene,
  font: Font | undefined,
  position: Vector3 | undefined
) {
  if (!font || !position) return;
  const intersect = getDropZoneIntersect(
    getIntersects(mouse, controls.object, scene)
  );
  const point = getDropZoneIntersectPoint(intersect, position);
  if (point) {
    const from = roundVectorM(position.clone());
    const to = roundVectorM(point.clone());
    let angle;
    if (from.y === to.y) {
      const xV = new Vector3(1);
      const v = to
        .clone()
        .sub(from)
        .normalize();
      angle = Math.round(radToDeg(v.angleTo(xV)) * 100) / 100;
    }
    const coords = createPositionInfo(
      to,
      font,
      false,
      Math.round(angle ?? 0),
      roundM(position.distanceTo(point))
    );
    coords.quaternion.copy(controls.object.quaternion);
    coords.scale.multiplyScalar(intersect!.distance / 2);

    const referenceLine = new Mesh(
      new CylinderGeometry(0.02, 0.02, position.distanceTo(point), 32),
      new MeshPhongMaterial({ color: getRGB(red) })
    );
    referenceLine.name = "REFERENCE-HELPER";
    referenceLine.position.add(position);
    referenceLine.lookAt(point);
    referenceLine.position.add(
      point
        .clone()
        .sub(position.clone())
        .divideScalar(2)
    );

    referenceLine.rotateX(deg90InRad);

    // referenceLine.quaternion.copy(controls.object.quaternion);
    scene.add(referenceLine);
    scene.add(coords);
  }
}

function createPositionInfo(
  point: Vector3,
  font: Font,
  isCenter?: boolean,
  angle?: number,
  distance?: number
) {
  const textParameters = { font, size: 0.03, height: 0.001, curveSegments: 1 };
  let text = `(${point.x}, ${point.y}, ${point.z})`;
  if (angle && distance) {
    text += ` : ${distance} m; ${angle}°`;
  } else if (angle) {
    text += ` : ${angle}°`;
  } else if (distance) {
    text += ` : ${distance} m`;
  }
  const geometry = new TextGeometry(text, textParameters);
  const textMesh = new Mesh(
    geometry,
    new MeshBasicMaterial({ color: "black" })
  );
  textMesh.name = `${isCenter ? "CENTER-" : ""}COORDS`;
  textMesh.position.copy(point);
  if (isCenter) textMesh.rotateX(-deg90InRad);
  return textMesh;
}

export function createDistanceInfo(
  point: Vector3,
  font: Font,
  dis?: number,
  disY?: number,
  isX?: boolean
) {
  const textParameters = { font, size: 0.03, height: 0.001, curveSegments: 1 };
  // let text = `(${point.x}, ${point.y}, ${point.z})`;

  const x = !isX ? (typeof dis === "number" ? dis.toFixed(2) : 0) : 0;
  const y = typeof disY === "number" ? disY.toFixed(2) : 0;
  const z = isX ? (typeof dis === "number" ? dis.toFixed(2) : 0) : 0;

  const geometry = new TextGeometry(`x:${x} y:${y} z:${z}`, textParameters);
  const textMesh = new Mesh(
    geometry,
    new MeshBasicMaterial({ color: "black" })
  );
  textMesh.name = `COORDS-DISTANCE-INFO`;
  textMesh.position.copy(new Vector3(point.x - 1, point.y, point.z + 1));

  // textMesh.rotateZ(-deg90InRad);
  return textMesh;
}

function getDistanceHelper(
  controls: OrbitControls,
  intersect: Intersection,
  from: Vector3,
  to: Vector3,
  font: Font
) {
  const group = new Group();
  group.name = "DISTANCE-HELPER";
  const dir = createDistanceHelperLine(
    controls,
    intersect,
    from,
    to,
    font,
    "black"
  );
  dir && group.add(dir);
  const xDir = createDistanceHelperLine(
    controls,
    intersect,
    from,
    from.clone().setX(to.x),
    font,
    "blue"
  );
  xDir && group.add(xDir);
  const yDir = createDistanceHelperLine(
    controls,
    intersect,
    from.clone().setX(to.x),
    to.clone().setZ(from.z),
    font,
    "red"
  );
  yDir && group.add(yDir);
  const zDir = createDistanceHelperLine(
    controls,
    intersect,
    to.clone().setZ(from.z),
    to,
    font,
    "green"
  );
  zDir && group.add(zDir);
  return group;
}

function createDistanceHelperLine(
  controls: OrbitControls,
  intersect: Intersection,
  from: Vector3,
  to: Vector3,
  font: Font,
  color: string
) {
  const distance = roundM(from.distanceTo(to));
  if (!distance) return null;
  const text = `${distance} m`;
  const textParameters = { font, size: 0.06, height: 0.002, curveSegments: 1 };
  const material = new MeshBasicMaterial({ color });
  material.depthTest = false;
  const textMesh = new Mesh(new TextGeometry(text, textParameters), material);
  textMesh.renderOrder = 900;
  const line = new Mesh(new CylinderGeometry(0.005, 0.005, distance), material);
  line.renderOrder = 900;
  line.position.copy(getMiddleVector3(from, to));
  line.lookAt(to);
  line.rotateX(-deg90InRad);
  line.add(textMesh);
  textMesh.quaternion.copy(line.quaternion.clone().inverse());
  textMesh.quaternion.multiply(controls.object.quaternion.clone());
  textMesh.scale.multiplyScalar(intersect.distance / 2);
  return line;
}

export function createCircleDropZone(position: Vector3, font: Font) {
  const group = new Group();
  group.position.copy(position);
  group.name = "DROP-ZONE";
  group.add(createDropCircle());
  group.add(createCylinderDropZone("X"));
  group.add(createCylinderDropZone("Y"));
  group.add(createCylinderDropZone("Z"));
  const text = createPositionInfo(roundVectorM(position.clone()), font, true);
  text.position.set(0.2, 0.2, -0.2);
  group.add(text);
  return group;
}
export function createSnappingPoint(position: Vector3, font: Font) {
  const group = new Group();
  group.position.copy(position);
  group.name = "DROP-ZONE";
  // group.add(createDropCircle());
  const material = new MeshLambertMaterial({
    transparent: true,
    opacity: 0.2,
    side: DoubleSide,
    color: "green",
  });
  const axisX = createCylinderDropZone("X");
  axisX.material = material;
  axisX.name = "POSITION_AXIS_X";
  group.add(axisX);
  const axisZ = createCylinderDropZone("Z");
  axisZ.material = material;
  axisZ.name = "POSITION_AXIS_Z";
  group.add(axisZ);
  return group;
}

export function createDropZoneAxises(position: Vector3, font: Font) {
  const group = new Group();
  group.position.copy(position);
  group.name = "DROP-ZONE";
  // group.add(createDropCircle());
  const material = new MeshLambertMaterial({
    transparent: true,
    opacity: 0.2,
    side: DoubleSide,
    color: "grey",
  });
  const axisX = createCylinderDropZone("X");
  axisX.material = material;
  axisX.name = "POSITION_AXIS_X";
  group.add(axisX);
  const axisY = createCylinderDropZone("Y");
  axisY.material = material;
  axisY.name = "POSITION_AXIS_Y";
  group.add(axisY);
  const axisZ = createCylinderDropZone("Z");
  axisZ.material = material;
  axisZ.name = "POSITION_AXIS_Z";
  group.add(axisZ);
  const text = createDistanceInfo(roundVectorM(position.clone()), font, 0);
  text.position.set(0.2, 0.2, -0.2);
  group.add(text);
  console.log("Creat distance info");
  return group;
}

function createDropCircle() {
  const geometry = new CircleGeometry(25, 32);
  const mesh = new Mesh(geometry, dropZoneMaterial);
  mesh.name = "DROP-CIRCLE";
  mesh.rotateX(deg90InRad);
  return mesh;
}

function createCylinderDropZone(type: "X" | "Y" | "Z") {
  const geometry = new CylinderGeometry(0.1, 0.1, 50);
  const m = dropZoneMaterial.clone();
  m.opacity = 0.3;
  const mesh = new Mesh(geometry, m);
  if (type === "X") {
    mesh.rotateZ(deg90InRad);
  } else if (type === "Z") {
    mesh.rotateX(deg90InRad);
  }
  mesh.name = `DROP-CYLINDER-${type}`;
  return mesh;
}

export function createReferenceLine(
  start: Vector3,
  end: Vector3,
  axe?: string
) {
  const geometry = new CylinderGeometry(0.1, 0.1, start.distanceTo(end));
  const m = new MeshLambertMaterial({
    transparent: true,
    opacity: 0.2,
    side: DoubleSide,
    color: "red",
  });
  m.opacity = 0.3;

  const mesh = new Mesh(geometry, m);
  mesh.position.copy(getMiddleVector3(start, end));
  // mesh.lookAt(end);
  if (axe === "X") {
    mesh.rotateX(deg90InRad);
  } else if (axe === "Z") {
    console.log(axe);
    mesh.rotateZ(deg90InRad);
  }
  mesh.name = `DROP-CYLINDER-REFERENCE`;
  return mesh;
}

export function createValvesDropZones(
  scene: Scene,
  process: TProcess | undefined,
  pipes: FreePipe[] = []
) {
  if (!process) return;
  const valves = Array.from(process.elements.values()).filter(
    (e) => e.type === EProcessElementType.VALVE
  );
  for (const valve of valves) {
    const mesh = scene.getObjectByName(valve.name) as Mesh;
    if (!mesh) return;
    const firstPipe = pipes.find((p) =>
      valve.points.some((point) => point.prevPipe === p.id)
    );
    const nextPipe = pipes.find((p) =>
      valve.points.some((point) => point.nextPipe === p.id)
    );
    if (!firstPipe || !nextPipe) continue;
    if (firstPipe && pipes.some((p) => p.preceding === firstPipe.pipe))
      continue;
    if (nextPipe && pipes.some((p) => p.pipe === nextPipe.preceding)) continue;
    mesh.geometry.computeBoundingSphere();
    return createAnchor(mesh.geometry.boundingSphere.radius, mesh.position, {
      valve,
    });
  }
}

function createAnchor(size: number, pos: Vector3, data: TPipeElementAnchor) {
  const geometry = new SphereGeometry(size, 32, 32);
  const m = dropZoneMaterial.clone();
  m.opacity = 0.3;
  const anchorMesh = new Mesh(geometry, m);
  anchorMesh.name = "PIPE-ELEMENT-ANCHOR";
  anchorMesh.position.copy(pos);
  anchorMesh.userData = data;
  return anchorMesh;
}

export function createDimensionAnchors(
  project: Project | undefined,
  process: TProcessState
): Mesh[] {
  if (!project) return [];
  const nodes = new Map<string, { pos: Vector3; size: number }>();
  const currentProcess = process.processes.get(project.name);
  if (currentProcess) {
    for (const el of Array.from(currentProcess.elements.values())) {
      const elMesh = drawProcessElement("DESIGNER", el);
      elMesh.geometry.computeBoundingSphere();
      const sphere = elMesh.geometry.boundingSphere;
      const key = `${roundM(elMesh.position.x)}-${roundM(
        elMesh.position.y
      )}-${roundM(elMesh.position.z)}`;
      const node = nodes.get(key);
      if (node && node.size >= sphere.radius) continue;
      nodes.set(key, { pos: elMesh.position.clone(), size: sphere.radius });
    }
  }

  for (const pipe of project.freePipes ?? []) {
    const { start, end } = getPipePoints(pipe);
    const size = MMtoM(
      (pipe.params.profile?.outside_diameter_global ?? 0.2) * 0.8
    );

    const key1 = `${roundM(start.x)}-${roundM(start.y)}-${roundM(start.z)}`;
    const node1 = nodes.get(key1);
    if (!node1 || node1.size < size)
      nodes.set(key1, { pos: start.clone(), size });

    const key2 = `${roundM(end.x)}-${roundM(end.y)}-${roundM(end.z)}`;
    const node2 = nodes.get(key2);
    if (!node2 || node2.size < size)
      nodes.set(key2, { pos: end.clone(), size });
  }

  const getSectionSize = (item: TBeamElement) => {
    return (
      Math.max(
        MMtoM(item.profile.bf_global ?? 0),
        MMtoM(item.profile.d_global ?? 0)
      ) * 1.5
    );
  };

  const getGlobalNodes = (model: TOpenFrame, item: TBeamElement) => {
    const start = localToGlobal(model.startPos, item.startPos, model.direction);
    const end = localToGlobal(model.startPos, item.endPos, model.direction);
    return { start, end };
  };

  for (const model of project.models) {
    if (model.type !== "Open Frame") continue;
    const elements = [
      ...(model as TOpenFrame).cantilevers,
      ...(model as TOpenFrame).beams,
      ...(model as TOpenFrame).columns,
      ...(model as TOpenFrame).horizontalBracings,
      ...(model as TOpenFrame).kneeBracings,
      ...(model as TOpenFrame).staircases,
      ...(model as TOpenFrame).verticalBracings,
    ];
    for (const item of elements) {
      const size = getSectionSize(item);
      const { start, end } = getGlobalNodes(model as TOpenFrame, item);
      dropZoneMaterial;
      const key1 = `${roundM(start.x)}-${roundM(start.y)}-${roundM(start.z)}`;
      const node1 = nodes.get(key1);
      if (!node1 || node1.size < size)
        nodes.set(key1, { pos: start.clone(), size });

      const key2 = `${roundM(end.x)}-${roundM(end.y)}-${roundM(end.z)}`;
      const node2 = nodes.get(key2);
      if (!node2 || node2.size < size)
        nodes.set(key2, { pos: end.clone(), size });
    }
  }

  const meshes: Mesh[] = Array.from(nodes.values()).map((node) => {
    return createAnchor(node.size, node.pos, {
      isDimensionAnchor: true,
      position: node.pos.clone(),
    });
  });

  return meshes;
}
