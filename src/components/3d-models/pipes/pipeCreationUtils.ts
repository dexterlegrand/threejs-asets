import {
  TextGeometry,
  Mesh,
  Vector3,
  LineBasicMaterial,
  BufferGeometry,
  Line,
  MeshBasicMaterial,
  MeshLambertMaterial,
  CylinderBufferGeometry,
  SphereBufferGeometry,
  Shape,
  Path,
  ExtrudeBufferGeometry,
  DoubleSide,
  Group,
  Geometry,
  Font,
  BoxBufferGeometry,
  Face3,
  QuadraticBezierCurve3,
  TubeBufferGeometry,
  CubicBezierCurve3,
  ArrowHelper,
} from "three";
import {
  deg90InRad,
  deg360InRad,
  deg45InRad,
  platformColorRGB,
  pipeColorRGB,
  supColorRGB,
  pedestalColor,
  deg180InRad,
  gray,
} from "../../../store/main/constants";
import {
  getRGB,
  roundVectorM,
  getPosByDistance,
  MMtoM,
  checkRange,
  degToRad,
  fixVectorByOrientation,
  getDirection,
  getMiddleVector3,
} from "../utils";
import {
  FreePipe,
  TProjectMode,
  TSelectedPipeSupport,
  TSelectedPipe,
  TFlangeType,
  TSupportDetail,
  TValveType,
  TWorkMode,
} from "../../../store/main/types";
import {
  TPipeInsulationLoad,
  TPipeCheckParams,
} from "../../../store/main/pipeTypes";
import { getStressColor, getFlangeHoles } from "./pipesUtils";
import {
  AnalysisUI,
  MemberStressCheckUI,
  PipeThicknessCheckUI,
} from "../../../store/ui/types";
import {
  TPipingReturn,
  TPipingReducer,
  TPipingCap,
  TPipingElbow,
  TPipingTee,
  TPipingFlange,
  TPipingFlangeBlind,
  TPipingFlangeLapped,
  TPipingFlangeRingJointFacing,
  TPipingFlangeSlipon,
  TPipingFlangeWeldingneck,
  TPipingFlangeThreaded,
  TPipingFlangeSocketWelding,
} from "../../../store/data/types";
import { fontUrl } from "../../../pages/utils/agent";

const pipeColor = getRGB(pipeColorRGB);

const vX = new Vector3(1, 0, 0);
const vY = new Vector3(0, 1, 0);
const vZ = new Vector3(0, 0, 1);

let color = pipeColor;
let supColor = getRGB(supColorRGB);

// function adjustEndPosition(start: Vector3, end: Vector3) {
//   // Calculate the differences in each axis
//   const diffX = Math.abs(end.x - start.x);
//   const diffY = Math.abs(end.y - start.y);
//   const diffZ = Math.abs(end.z - start.z);

//   // Determine the axis with the largest difference
//   const maxDiff = Math.max(diffX, diffY, diffZ);

//   // Create a new end position based on the axis with the largest difference
//   const newEnd: Vector3 = new Vector3(end.x, end.y, end.z);

//   if (maxDiff === diffX) {
//     // X has the largest difference
//     newEnd.y = start.y; // Adjust Y to match start
//     newEnd.z = start.z; // Adjust Z to match start
//   } else if (maxDiff === diffY) {
//     // Y has the largest difference
//     newEnd.x = start.x; // Adjust X to match start
//     newEnd.z = start.z; // Adjust Z to match start
//   } else {
//     // Z has the largest difference
//     newEnd.x = start.x; // Adjust X to match start
//     newEnd.y = start.y; // Adjust Y to match start
//   }

//   return newEnd;
// }
export function generatePipe(
  name: string,
  start: Vector3,
  end: Vector3,
  offset: number,
  distance: number,
  diameter: number | undefined,
  thickness: number | undefined,
  mode: TProjectMode | undefined,
  pipeIns: TPipeInsulationLoad | undefined,
  isSelectedPipe: boolean | undefined,
  opacity: number,
  customColor: string | undefined,
  workMode: TWorkMode
) {
  if (mode === "stressCheck" || mode === "thicknessCheck") {
    color = getRGB(pedestalColor);
    supColor = getRGB(pedestalColor);
  } else {
    const defaultPipeColor: { [key in TWorkMode]?: string } = {
      PRODESIGNER: "#72bdf2",
      PIPDESIGNER: "#0070c0",
      PIPING: "#011759",
    };

    color = customColor ?? pipeColor;
    supColor = getRGB(supColorRGB);
  }

  if (diameter && thickness) {
    const r = MMtoM(diameter) / 2;
    const t = MMtoM(thickness);
    const pipeGroup = new Group();
    const pipeMesh = createPipeMesh(
      r,
      t,
      distance - offset,
      new MeshLambertMaterial({
        transparent: opacity < 1,
        opacity,
        color: isSelectedPipe ? supColor : color,
      })
    );
    if (pipeIns?.thickness) {
      const t = MMtoM(pipeIns.thickness);
      const insulationMesh = createPipeMesh(
        r + t,
        t,
        distance - offset,
        new MeshLambertMaterial({
          color: getRGB(platformColorRGB),
          transparent: true,
          opacity: 0.5,
        })
      );
      insulationMesh && pipeMesh.add(insulationMesh);
    }
    pipeMesh.name = name;
    pipeMesh.userData = {
      isFreePipe: true,
      pipeName: name,
      start,
      end,
    } as TSelectedPipe;
    // pipeMesh.rotateY(deg90InRad);
    const norm = new Vector3(
      end.x - start.x,
      end.y - start.y,
      end.z - start.z
    ).normalize();
    /*console.log(name, norm);*/

    pipeMesh.rotateY(deg90InRad);
    pipeGroup.add(pipeMesh);
    const connectorGroup = new Group();
    pipeGroup.position.copy(roundVectorM(getPosByDistance(offset, start, end)));
    pipeGroup.lookAt( end);

    pipeGroup.rotateY(-deg90InRad);

    connectorGroup.rotateX(deg90InRad);

    pipeGroup.add(connectorGroup);

    return { pipeGroup, pipeMesh, connectorGroup: pipeGroup };
  } else {
    const pipeGroup = new Group();
    const pipeMesh = createPipeMesh(
      0.001,
      0.001,
      distance - offset,
      new MeshLambertMaterial({
        transparent: opacity < 1,
        opacity,
        color: isSelectedPipe ? supColor : color,
      })
    );
    pipeMesh.name = name;
    pipeMesh.userData = {
      isFreePipe: true,
      pipeName: name,
      start,
      end,
    } as TSelectedPipe;
    pipeMesh.rotateY(deg90InRad);
    pipeGroup.add(pipeMesh);
    pipeGroup.position.copy(roundVectorM(getPosByDistance(offset, start, end)));
    // pipeGroup.lookAt(end);
    // pipeGroup.rotateX(deg90InRad);
    pipeGroup.rotateY(-deg90InRad);
    return { pipeGroup, pipeMesh };
  }
}

export function createPipeMesh(
  radius: number,
  thickness: number,
  depth: number,
  material: THREE.Material,
  holes?: any[]
) {
  if (!radius) return new Group();
  const arcShape = new Shape();
  arcShape.absarc(0, 0, radius, 0, deg360InRad, false);
  if (thickness && checkRange(thickness, 0, radius)) {
    const holePath = new Path();
    holePath.absarc(0, 0, radius - thickness, 0, deg360InRad, true);
    arcShape.holes.push(holePath);
  }
  if (holes) {
    arcShape.holes.push(...holes);
  }
  const mesh = new Mesh(
    new ExtrudeBufferGeometry(arcShape, {
      steps: 1,
      bevelEnabled: false,
      curveSegments: 32,
      depth,
    }),
    material
  );
  return mesh;
}

export function createSupports(
  pipe: FreePipe,
  pipes: FreePipe[],
  pipeGroup: Group,
  pipeMesh: Mesh | Group,
  offset: number,
  supports: TSupportDetail[],
  selectedPipeSupport: TSelectedPipeSupport | undefined,
  font: Font | undefined
) {
  const container = new Group();
  const meshes: Group[] = [];
  const q = pipeMesh.quaternion
    .clone()
    .inverse()
    .multiply(pipeGroup.quaternion.clone().inverse());
  const radius = MMtoM(pipe.params.od ?? 0) / 2;
  supports.forEach((sd) => {
    const selected =
      selectedPipeSupport?.pipe === pipe.pipe &&
      sd.id === selectedPipeSupport.support.id;
    const suppMesh = new Group();
    suppMesh.position.setZ(sd.distance - offset);
    suppMesh.rotation.setFromQuaternion(q);
    suppMesh.rotateY(deg90InRad);

    const suppX = drawSupport(
      "X",
      sd.x,
      sd.Rx,
      pipe.params.od ?? 1,
      radius * 2,
      selected
    );

    const suppY = drawSupport(
      "Y",
      sd.y,
      sd.Ry,
      pipe.params.od ?? 1,
      radius * 2,
      selected
    );
    suppY.position.setY(-radius);

    const suppZ = drawSupport(
      "Z",
      sd.z,
      sd.Rz,
      pipe.params.od ?? 1,
      radius * 2,
      selected
    );
    suppZ.position.setX(radius);

    if (sd.type === "Slave Node" && sd.masterNodePipe) {
      const master = pipes.find((p) => p.pipe === sd.masterNodePipe);
      if (master) {
        const from = getPosByDistance(
          sd.masterNodeDist ?? 0,
          new Vector3(master.x1, master.y1, master.z1),
          new Vector3(master.x2, master.y2, master.z2)
        );
        const to = getPosByDistance(
          sd.distance,
          new Vector3(pipe.x1, pipe.y1, pipe.z1),
          new Vector3(pipe.x2, pipe.y2, pipe.z2)
        );

        from.copy(
          getPosByDistance(MMtoM(master.params.od ?? 0) / 2 + 0.01, from, to)
        );
        to.copy(
          getPosByDistance(MMtoM(pipe.params.od ?? 0) / 2 + 0.01, to, from)
        );

        const material = new MeshBasicMaterial({ color: "red" });

        createText(material, container, font, "M", from);
        createText(material, container, font, "S", to);

        const distance = from.distanceTo(to) - 0.02;
        let i = 0.02;
        while (i < distance) {
          const si = i;
          const ei = i + 0.2 > distance ? distance : i + 0.2;
          container.add(
            createBoldLine(
              material,
              getPosByDistance(si, from, to),
              getPosByDistance(ei, from, to)
            )
          );
          i += 0.3;
        }
      }
    }

    suppMesh.add(suppX, suppY, suppZ);

    if (pipe.x1 !== pipe.x2 && pipe.y1 === pipe.y2 && pipe.z1 === pipe.z2) {
      suppX.position.setX(-(radius + radius * 0.4));
      const suppLine = createLine(
        suppX.position,
        suppX.position.clone().setX(-radius),
        selected ? supColor : 0x0000ff
      );
      suppMesh.add(suppLine);
    } else if (
      pipe.x1 === pipe.x2 &&
      pipe.y1 !== pipe.y2 &&
      pipe.z1 === pipe.z2
    ) {
      suppX.position.setZ(-radius);
      suppY.position.setX(-(radius + radius * 0.4));
      const suppLine = createLine(
        suppY.position,
        suppY.position.clone().setX(-radius),
        selected ? supColor : 0xff0000
      );
      suppMesh.add(suppLine);
    } else if (
      pipe.x1 === pipe.x2 &&
      pipe.y1 === pipe.y2 &&
      pipe.z1 !== pipe.z2
    ) {
      suppX.position.setZ(-radius);
      suppZ.position.setX(0);
      suppZ.position.setZ(radius + radius * 0.4);
      const suppLine = createLine(
        suppZ.position,
        suppZ.position.clone().setZ(radius),
        selected ? supColor : 0x00ff00
      );
      suppMesh.add(suppLine);
    } else suppX.position.setZ(-radius);

    suppMesh.userData = {
      isFreePipeSupport: true,
      lineNo: `${pipe.line}`,
      pipe: pipe.pipe,
      position: roundVectorM(
        getPosByDistance(
          sd.distance,
          new Vector3(pipe.x1, pipe.y1, pipe.z1),
          new Vector3(pipe.x2, pipe.y2, pipe.z2)
        )
      ),
      support: sd,
    } as TSelectedPipeSupport;
    pipeMesh.add(suppMesh);
    meshes.push(suppMesh);
  });
  return { container, meshes };
}

export function showColoredElements(
  mode: TProjectMode | undefined,
  colored: (MemberStressCheckUI | PipeThicknessCheckUI)[],
  coloredParams: TPipeCheckParams | undefined,
  analysisUI: AnalysisUI | undefined,
  font: Font | undefined,
  isLabels: boolean | undefined,
  isNodes: boolean | undefined
) {
  const container = new Group();
  for (const segment of colored) {
    const r = MMtoM((segment as any).od / 2) + 0.002;
    const t = MMtoM((segment as any).wt) + 0.004;
    const start = new Vector3(
      MMtoM((segment as any).x1),
      MMtoM((segment as any).y1),
      MMtoM((segment as any).z1)
    );
    const end = new Vector3(
      MMtoM((segment as any).x2),
      MMtoM((segment as any).y2),
      MMtoM((segment as any).z2)
    );
    const material = new MeshLambertMaterial({
      color: getRGB(getStressColor(segment, coloredParams, mode)),
    });
    const d = start.distanceTo(end);
    const segmentMesh = createPipeMesh(r, t, d, material);
    if (!segmentMesh) continue;
    segmentMesh.position.copy(start);
    segmentMesh.lookAt(end);
    container.add(segmentMesh);
    if (!isLabels) continue;
    const modelAnalysis = analysisUI ? analysisUI[segment.model] : undefined;
    const member = modelAnalysis?.members.find(
      (m) => m.label === segment.elementNumber
    );
    if (!member) continue;
    const txtM = getMiddleVector3(start, end);
    const dir = getDirection(start, end);
    if (dir.includes("Y")) {
      txtM.setX(txtM.x + r * 1.25);
    } else txtM.setY(txtM.y + r * 1.25);
    createText(
      new MeshLambertMaterial({ color: getRGB(gray), side: DoubleSide }),
      container,
      font,
      `${member.label}:${member.name}`,
      txtM,
      0,
      0,
      "darkgray"
    );
    if (!isNodes) continue;
    const elements = modelAnalysis?.beamElements ?? {};
    const nodes = modelAnalysis?.nodes ?? {};
    const txtS = start.clone();
    const txtE = end.clone();
    if (dir.includes("Y")) {
      txtS.setX(txtS.x + r * 1.25);
      txtE.setX(txtE.x + r * 1.25);
    } else {
      txtS.setY(txtS.y + r * 1.25);
      txtE.setY(txtE.y + r * 1.25);
    }
    const element = elements[member.label];
    if (!element) continue;
    const node1 = nodes[element.nodes[0]];
    const node2 = nodes[element.nodes[1]];
    if (!(node1 && node2)) continue;
    createText(
      new MeshLambertMaterial({ color: getRGB(gray), side: DoubleSide }),
      container,
      font,
      `${node1.nodeNumber}`,
      txtS,
      0,
      0,
      "lightgray"
    );
    createText(
      new MeshLambertMaterial({ color: getRGB(gray), side: DoubleSide }),
      container,
      font,
      `${node2.nodeNumber}`,
      txtE,
      0,
      0,
      "lightgray"
    );
  }
  return container;
}

export function showEndForces(
  analysisUI: AnalysisUI,
  params: TPipeCheckParams,
  font: Font
) {
  const group = new Group();
  group.name = "PIPE-END-FORCES";
  for (const line of params.lines ?? []) {
    const lineAnalysis = analysisUI[line];
    if (!lineAnalysis) continue;
    for (const force of lineAnalysis.memberEndForces) {
      if (
        (params.element && params.element !== force.elementNumber) ||
        force.LCNumber !== params.LC
      )
        continue;
      const member = lineAnalysis.members.find(
        (m) => m.label === force.elementNumber
      );
      if (!member) continue;
      const element = lineAnalysis.beamElements[member.label];
      if (!element) continue;
      const startNode = lineAnalysis.nodes[element.nodes[0]];
      const endNode = lineAnalysis.nodes[element.nodes[1]];
      if (!startNode || !endNode) continue;

      const start = new Vector3(
        MMtoM(startNode.x),
        MMtoM(startNode.y),
        MMtoM(startNode.z)
      );
      const end = new Vector3(
        MMtoM(endNode.x),
        MMtoM(endNode.y),
        MMtoM(endNode.z)
      );

      group.add(createForceArrowX(force.fx_1, start.clone(), font));
      group.add(createForceArrowY(force.fy_1, start.clone(), font));
      group.add(createForceArrowZ(force.fz_1, start.clone(), font));

      group.add(createForceArrowX(force.fx_2, end.clone(), font));
      group.add(createForceArrowY(force.fy_2, end.clone(), font));
      group.add(createForceArrowZ(force.fz_2, end.clone(), font));
    }
  }
  return group;
}

function getForceColor(value: number) {
  const val = Math.abs(value);
  if (checkRange(val, 0, 50, true, true)) {
    return 0x00ff00;
  } else if (checkRange(val, 50, 100, false, true)) {
    return 0x00e900;
  } else if (checkRange(val, 100, 150, false, true)) {
    return 0x00d300;
  } else if (checkRange(val, 150, 200, false, true)) {
    return 0x00bd00;
  } else if (checkRange(val, 200, 250, false, true)) {
    return 0x00a700;
  } else if (checkRange(val, 250, 300, false, true)) {
    return 0x009100;
  } else if (checkRange(val, 300, 350, false, true)) {
    return 0x007b00;
  } else if (checkRange(val, 350, 400, false, true)) {
    return 0x006500;
  } else return 0xff0000;
}

function createForceArrowX(value: number, position: Vector3, font: Font) {
  const isNegative = value < 0;
  const arrow = new ArrowHelper(
    isNegative ? vX.clone().multiplyScalar(-1) : vX,
    isNegative ? position.add(vX) : position,
    1,
    getForceColor(value)
  );
  const textParameters = { font, size: 0.05, height: 0.003, curveSegments: 1 };
  const geometry = new TextGeometry(`Fx: ${value} (kN, m)`, textParameters);
  geometry.center();
  const mesh = new Mesh(
    geometry,
    new MeshLambertMaterial({ color: "black", side: DoubleSide })
  );
  mesh.position.copy(isNegative ? new Vector3() : vY);
  mesh.rotateX(isNegative ? 0 : deg180InRad);
  mesh.rotateY(isNegative ? deg90InRad : -deg90InRad);
  arrow.add(mesh);
  return arrow;
}

function createForceArrowY(value: number, position: Vector3, font: Font) {
  const isNegative = value < 0;
  const arrow = new ArrowHelper(
    isNegative ? vY.clone().multiplyScalar(-1) : vY,
    isNegative ? position.add(vY) : position,
    1,
    getForceColor(value)
  );
  const textParameters = { font, size: 0.05, height: 0.003, curveSegments: 1 };
  const geometry = new TextGeometry(`Fy: ${value} (kN, m)`, textParameters);
  geometry.center();
  const mesh = new Mesh(
    geometry,
    new MeshLambertMaterial({ color: "black", side: DoubleSide })
  );
  mesh.position.copy(isNegative ? new Vector3() : vY);
  mesh.rotateX(isNegative ? deg180InRad : 0);
  arrow.add(mesh);
  return arrow;
}

function createForceArrowZ(value: number, position: Vector3, font: Font) {
  const isNegative = value < 0;
  const arrow = new ArrowHelper(
    isNegative ? vZ.clone().multiplyScalar(-1) : vZ,
    isNegative ? position.add(vZ) : position,
    1,
    getForceColor(value)
  );
  const textParameters = { font, size: 0.05, height: 0.003, curveSegments: 1 };
  const geometry = new TextGeometry(`Fz: ${value} (kN, m)`, textParameters);
  geometry.center();
  const mesh = new Mesh(
    geometry,
    new MeshLambertMaterial({ color: "black", side: DoubleSide })
  );
  mesh.position.copy(isNegative ? new Vector3() : vY);
  mesh.rotateX(isNegative ? 0 : deg180InRad);
  arrow.add(mesh);
  return arrow;
}

export function createText(
  material: THREE.Material,
  parent: THREE.Object3D,
  font: THREE.Font | undefined,
  text: string,
  pos: THREE.Vector3,
  rX?: number,
  rY?: number,
  options?: any
) {
  if (font) {
    const textParameters = {
      font,
      size: options?.size ?? 0.03,
      height: options?.height ?? 0.003,
      curveSegments: 1,
    };
    const geometry = new TextGeometry(text, textParameters);
    geometry.center();
    const mesh = new Mesh(geometry, material);
    mesh.position.copy(pos);
    rX && mesh.rotateX(rX);
    rY && mesh.rotateY(rY);
    parent.add(mesh);
  } else {
    const json = localStorage.getItem(fontUrl);
    if (json) {
      const font = new Font(JSON.parse(json));

      const textParameters = {
        font,
        size: options?.size ?? 0.03,
        height: options?.height ?? 0.003,
        curveSegments: 1,
      };
      const geometry = new TextGeometry(text, textParameters);
      geometry.center();
      const mesh = new Mesh(geometry, material);
      mesh.position.copy(pos);
      rX && mesh.rotateX(rX);
      rY && mesh.rotateY(rY);
      parent.add(mesh);
    }
  }
}

export function createLine(
  start: Vector3,
  end: Vector3,
  color: number | string
) {
  const material = new LineBasicMaterial({ color });
  const geometry = new BufferGeometry().setFromPoints([start, end]);
  return new Line(geometry, material);
}

export function createBoldLine(
  material: MeshBasicMaterial | MeshLambertMaterial,
  start: Vector3,
  end: Vector3,
  size = 0.002,
  isRounded?: boolean
) {
  const length = start.distanceTo(end);
  const line = new Mesh(
    new CylinderBufferGeometry(size, size, length),
    material
  );
  line.position.copy(
    start
      .clone()
      .add(end)
      .divideScalar(2)
  );
  line.lookAt(end);
  line.rotateX(deg90InRad);
  if (isRounded) {
    const startMesh = new Mesh(
      new SphereBufferGeometry(size, 32, 32),
      material
    );
    const endMesh = startMesh.clone();
    startMesh.position.setY(-length / 2);
    endMesh.position.setY(length / 2);
    line.add(startMesh, endMesh);
  }
  return line;
}

function drawCircle(
  material: MeshBasicMaterial | MeshLambertMaterial,
  size: number,
  radius: number,
  points = 16,
  isRounded?: boolean,
  isValve?: boolean
) {
  const angle = deg360InRad / points;
  const y = new Vector3(0, 1);
  const circle = new Group();
  const start = new Vector3(0, 0, radius);
  for (let i = 0; i < points; i++) {
    const end = start.clone().applyAxisAngle(y, angle);
    circle.add(
      createBoldLine(material, start.clone(), end.clone(), size, isRounded)
    );
    start.copy(end);
    if (isValve) {
      circle.add(
        createBoldLine(material, start.clone(), new Vector3(0, -size), size)
      );
    }
  }
  return circle;
}

function drawSupport(
  dir: "X" | "Y" | "Z",
  F?: string,
  M?: string,
  od?: number,
  l = 1,
  selected?: boolean
) {
  const r = 0.003 * ((od ?? 1) / 100);

  const group = new Group();
  const material = new MeshBasicMaterial({
    color: selected
      ? supColor
      : dir === "X"
      ? 0x0000ff
      : dir === "Y"
      ? 0xff0000
      : 0x00ff00,
  });

  const l0_1 = l * 0.1;
  const start = new Vector3();
  const end = new Vector3(l);
  if (!F) {
    group.add(createBoldLine(material, start, end, r));
    if (!M) {
      group.add(
        createBoldLine(
          material,
          new Vector3(l, 0, -l0_1 * 2),
          new Vector3(l, 0, l0_1 * 2),
          r
        )
      );
      for (let i = 0; i <= 4; i++) {
        const z = -l0_1 * 2 + l0_1 * i;
        const s = new Vector3(l, 0, z);
        const e = new Vector3(l0_1 * 2)
          .applyAxisAngle(new Vector3(0, 1), deg45InRad)
          .add(s);
        group.add(createBoldLine(material, s, e, r));
      }
    } else if (M !== "Released") {
      const c1 = drawCircle(material, r, l0_1);
      c1.rotateZ(deg90InRad);
      c1.position.copy(end);
      const c2 = drawCircle(material, r, l0_1 * 2);
      c2.rotateZ(deg90InRad);
      c2.position.copy(end);
      group.add(c1, c2);
    }
  } else if (F === "Released") {
    if (!M) {
      group.add(createBoldLine(material, start, end, r));
      const c1 = drawCircle(material, r, l0_1);
      c1.position.set(l * 0.75, 0, l0_1);
      const c2 = c1.clone();
      c2.position.set(l * 0.75, 0, -l0_1);
      group.add(c1, c2);
    } else if (M !== "Released") {
      group.add(createBoldLine(material, start, end, r));
      const c1 = drawCircle(material, r, l0_1);
      c1.rotateZ(deg90InRad);
      c1.position.copy(end);
      const c2 = drawCircle(material, r, l0_1 * 2);
      c2.rotateZ(deg90InRad);
      c2.position.copy(end);
      group.add(c1, c2);
    }
  } else {
    group.add(
      createBoldLine(material, new Vector3(), new Vector3(l0_1 * 2), r),
      createBoldLine(
        material,
        new Vector3(l0_1 * 2),
        new Vector3(l0_1 * 3, 0, l0_1),
        r
      ),
      createBoldLine(
        material,
        new Vector3(l0_1 * 3, 0, l0_1),
        new Vector3(l0_1 * 4, 0, -l0_1),
        r
      ),
      createBoldLine(
        material,
        new Vector3(l0_1 * 4, 0, -l0_1),
        new Vector3(l0_1 * 5, 0, l0_1),
        r
      ),
      createBoldLine(
        material,
        new Vector3(l0_1 * 5, 0, l0_1),
        new Vector3(l0_1 * 6, 0, -l0_1),
        r
      ),
      createBoldLine(
        material,
        new Vector3(l0_1 * 6, 0, -l0_1),
        new Vector3(l0_1 * 7, 0, l0_1),
        r
      ),
      createBoldLine(
        material,
        new Vector3(l0_1 * 7, 0, l0_1),
        new Vector3(l0_1 * 8),
        r
      ),
      createBoldLine(material, new Vector3(l0_1 * 8), new Vector3(l), r)
    );
    if (!M) {
      group.add(
        createBoldLine(
          material,
          new Vector3(l, 0, -l0_1 * 2),
          new Vector3(l, 0, l0_1 * 2),
          r
        )
      );
      for (let i = 0; i <= 4; i++) {
        const z = -l0_1 * 2 + l0_1 * i;
        const s = new Vector3(l, 0, z);
        const e = new Vector3(l0_1 * 2)
          .applyAxisAngle(new Vector3(0, 1), deg45InRad)
          .add(s);
        group.add(createBoldLine(material, s, e, r));
      }
    } else if (M !== "Released") {
      const c1 = drawCircle(material, r, l0_1);
      c1.rotateZ(deg90InRad);
      c1.position.copy(end);
      const c2 = drawCircle(material, r, l0_1 * 2);
      c2.rotateZ(deg90InRad);
      c2.position.copy(end);
      group.add(c1, c2);
    }
  }

  switch (dir) {
    case "X":
      group.rotateY(deg90InRad);
      break;
    case "Y":
      group.rotateZ(-deg90InRad);
      break;
  }

  return group;
}

export function createEndConnector(
  pipe: FreePipe,
  nexts: FreePipe[],
  length: number,
  isSelected: boolean,
  opacity: number
) {
  const material = isSelected
    ? new MeshLambertMaterial({
        transparent: opacity < 1,
        opacity,
        color: "red",
        side: DoubleSide,
      })
    : new MeshLambertMaterial({
        transparent: opacity < 1,
        opacity,
        color,
        side: DoubleSide,
      });
  if (pipe.params.endConnectorType === "Elbow") {
    return drawElbow(pipe, length, material);
  } else if (pipe.params.endConnectorType === "Return") {
    return drawReturn(
      pipe.params.endConnector as TPipingReturn,
      length,
      material
    );
  } else if (pipe.params.endConnectorType === "Reducer") {
    const next = nexts[0];
    const dir = (pipe.params.od ?? 0) > (next?.params.od ?? 0);
    let params = {
      next: true,
      right: true,
      offset:
        pipe.params.reducerType && pipe.params.reducerType !== "Concentric"
          ? MMtoM(Math.abs((pipe.params.od ?? 0) - (next?.params.od ?? 0)) / 2)
          : 0,
    };
    switch (pipe.params.reducerType) {
      case "Eccentric Left (Preceding)":
        params = { ...params, next: false, right: false };
        break;
      case "Eccentric Right (Preceding)":
        params = { ...params, next: false };
        break;
      case "Eccentric Left (Succeeding)":
        params = { ...params, right: false };
    }
    return drawReducer(
      pipe.params.endConnector as TPipingReducer,
      length,
      params,
      dir,
      material
    );
  } else if (pipe.params.endConnectorType === "Cap") {
    return drawCap(pipe.params.endConnector as TPipingCap, length, material);
  } else if (pipe.params.endConnectorType === "Tee") {
    const endConnector = drawTee(pipe, length, material);
    const nextsF = nexts.filter(
      (p) => Math.abs(p.vDir) === 90 || Math.abs(p.hDir) === 90
    );
    if (nextsF.length === 2) {
      const sdH = nextsF[0].hDir === -nextsF[1].hDir;
      const sdV = nextsF[0].vDir === -nextsF[1].vDir;
      if (sdH && sdV) {
        endConnector.rotateY(-deg90InRad);
        endConnector.rotateZ(degToRad(-nextsF[0].vDir));
      }
    }
    return endConnector;
  }
}

export function drawValve(
  opacity: number,
  diameter: number | undefined,
  type: TValveType | undefined,
  position: string | number | undefined,
  start: Vector3,
  end: Vector3
) {
  if (!diameter || !type) return { valve: undefined, valvePosition: 0 };
  const od = MMtoM(diameter);
  const or = od / 2;
  const od_1 = od / 10;
  const numbericPosition =
    position === "START"
      ? 0
      : position === "END"
      ? start.distanceTo(end)
      : +(position ?? 0);
  const group = new Group();
  group.position.setX(numbericPosition);
  const pipeMesh = new Mesh(
    new CylinderBufferGeometry(or, or, od * 2, 32, 1),
    new MeshLambertMaterial({
      transparent: opacity < 1,
      opacity,
      color: pipeColor,
    })
  );
  pipeMesh.rotateZ(deg90InRad);
  group.add(pipeMesh);
  if (type === "Gate Valve") {
    const meshA = new Mesh(
      new CylinderBufferGeometry(or * 0.9, or * 0.9, od_1 * 12, 32, 1),
      new MeshLambertMaterial({
        transparent: opacity < 1,
        opacity,
        color: pipeColor,
      })
    );
    const meshB = new Mesh(
      new SphereBufferGeometry(od_1 * 4, 32, 32),
      new MeshLambertMaterial({
        transparent: opacity < 1,
        opacity,
        color: pipeColor,
      })
    );
    meshB.position.setY(od_1 * 6);
    const meshC = new Mesh(
      new CylinderBufferGeometry(or * 0.5, or * 0.5, od_1 * 5, 32, 1),
      new MeshLambertMaterial({
        transparent: opacity < 1,
        opacity,
        color: pipeColor,
      })
    );
    meshC.position.setY(meshB.position.y + od_1 * 2.5);
    const valve = drawCircle(
      new MeshLambertMaterial({
        transparent: opacity < 1,
        opacity,
        color: getRGB(supColorRGB),
      }),
      od_1 / 2,
      or,
      5,
      true,
      true
    );
    valve.position.setY(meshC.position.y + od_1 * 2.5);
    group.add(meshA, meshB, meshC, valve);
  } else if (type === "Globe Valve") {
    const meshB = new Mesh(
      new BoxBufferGeometry(od_1 * 11, or, od_1 * 11),
      new MeshLambertMaterial({
        transparent: opacity < 1,
        opacity,
        color: pipeColor,
      })
    );
    meshB.position.setY(or);
    const meshC = new Mesh(
      new CylinderBufferGeometry(or * 0.5, or * 0.5, od_1 * 5, 32, 1),
      new MeshLambertMaterial({
        transparent: opacity < 1,
        opacity,
        color: pipeColor,
      })
    );
    meshC.position.setY(meshB.position.y + od_1 * 2.5);
    const valve = drawCircle(
      new MeshLambertMaterial({
        transparent: opacity < 1,
        opacity,
        color: getRGB(supColorRGB),
      }),
      od_1 / 2,
      or,
      5,
      true,
      true
    );
    valve.position.setY(meshC.position.y + od_1 * 2.5);
    group.add(meshB, meshC, valve);
  } else {
    const meshB = new Mesh(
      new BoxBufferGeometry(od_1 * 11, or, od_1 * 11),
      new MeshLambertMaterial({
        transparent: opacity < 1,
        opacity,
        color: pipeColor,
      })
    );
    meshB.position.setY(or);
    group.add(meshB);
  }
  return { valve: group, valvePosition: numbericPosition };
}

export function drawCap(
  params: TPipingCap,
  distance: number,
  material = new MeshLambertMaterial({ color, side: DoubleSide })
) {
  const radius = MMtoM(params.d) / 2;
  const mesh = new Mesh(
    new CylinderBufferGeometry(
      radius,
      radius,
      MMtoM(params.e + params.e1 / 2),
      32,
      1,
      true
    ),
    material
  );
  mesh.rotateZ(deg90InRad);
  mesh.position.setX(MMtoM(params.e1 / 2 - params.e) / 2);
  const cap = new Mesh(new SphereBufferGeometry(radius, 32, 32), material);
  cap.position.setX(MMtoM(params.e1 / 2));
  const el = new Group().add(mesh, cap);
  el.position.setX(distance);
  return el;
}

export function drawReducer(
  params: TPipingReducer,
  distance: number,
  offsetParams: { next: boolean; right: boolean; offset: number },
  dir: boolean,
  material = new MeshLambertMaterial({ color, side: DoubleSide })
) {
  const h = params ? MMtoM(params.h) : 1;
  const d1 = (params ? MMtoM(params.d1) : 0.5) / 2;
  const d2 = (params ? MMtoM(params.d2) : d1) / 2;

  const group = new Group();
  group.position.setX(distance);
  if (!dir) {
    !dir && group.rotateY(deg180InRad);
    if (offsetParams.next) {
      if (offsetParams.right) {
        group.position.setZ(group.position.z + offsetParams.offset);
      } else {
        group.position.setZ(group.position.z - offsetParams.offset);
      }
    } else {
      if (offsetParams.right) {
        group.position.setZ(group.position.z - offsetParams.offset);
      } else {
        group.position.setZ(group.position.z + offsetParams.offset);
      }
    }
  }

  const v1 = new Vector3(0, 0, d1);
  const v2 = new Vector3(0, 0, d2);

  const x = new Vector3(1);

  const angleInRad = degToRad(360 / 64);

  const h_2 = h / 2;

  for (let i = 0; i < 64; i++) {
    const nv1 = v1.clone().applyAxisAngle(x, angleInRad);
    const nv2 = v2.clone().applyAxisAngle(x, angleInRad);

    const from1 = v1.clone().setX(-h_2);
    const from2 = nv1.clone().setX(-h_2);

    const to1 = v2.clone().setX(h_2);
    const to2 = nv2.clone().setX(h_2);

    if (offsetParams.next) {
      if (offsetParams.right) {
        to1.setZ(to1.z + offsetParams.offset);
        to2.setZ(to2.z + offsetParams.offset);
      } else {
        to1.setZ(to1.z - offsetParams.offset);
        to2.setZ(to2.z - offsetParams.offset);
      }
    } else {
      if (offsetParams.right) {
        to1.setZ(to1.z - offsetParams.offset);
        to2.setZ(to2.z - offsetParams.offset);
      } else {
        to1.setZ(to1.z + offsetParams.offset);
        to2.setZ(to2.z + offsetParams.offset);
      }
    }

    const geometry1 = new Geometry();
    geometry1.vertices.push(from1);
    geometry1.vertices.push(from2);
    geometry1.vertices.push(to1);
    const face1 = new Face3(0, 1, 2);
    geometry1.faces.push(face1);
    geometry1.computeFaceNormals();
    geometry1.computeVertexNormals();

    const geometry2 = new Geometry();
    geometry2.vertices.push(from2);
    geometry2.vertices.push(to1);
    geometry2.vertices.push(to2);
    const face2 = new Face3(0, 1, 2);
    geometry2.faces.push(face2);
    geometry2.computeFaceNormals();
    geometry2.computeVertexNormals();

    group.add(new Mesh(geometry1, material), new Mesh(geometry2, material));

    v1.copy(nv1);
    v2.copy(nv2);
  }

  return group;
}

export function drawElbow(
  pipe: FreePipe,
  distance: number,
  material = new MeshLambertMaterial({ color, side: DoubleSide })
) {
  const params = pipe.params.endConnector as TPipingElbow;

  if (pipe.params.endConnectorDetails) {
    if (pipe.params.endConnectorDetails.type === "BWE") {
      const radius = MMtoM(params.d) / 2;
      const a = MMtoM(params.a);
      const start = new Vector3(0, 0, -a);
      const end = roundVectorM(
        start
          .clone()
          .applyAxisAngle(new Vector3(0, 1), degToRad(180 - params.degree))
      );
      // console.log(pipe, params.degree);
      const curve = new QuadraticBezierCurve3(start, new Vector3(), end);
      const mesh = new Mesh(
        new TubeBufferGeometry(curve, 32, radius, 32),
        material
      );
      mesh.rotateY(deg90InRad);
      const group = new Group().add(mesh);
      group.position.setX(distance);
      return group;
    } else if (pipe.params.endConnectorDetails.type === "BCSM") {
      // TODO: create through polygons
      const details = pipe.params.endConnectorDetails!;

      const a = MMtoM(params.a ?? 0);
      const tn = MMtoM(details.tn ?? params.t);
      const r = MMtoM(details.r ? details.r + tn / 2 : params.d / 2);
      const Re = MMtoM(details.Re ?? a);
      const theta = details.Theta ?? 0;
      const thetaRad = degToRad(theta);
      const s1 = MMtoM(details.S ?? 0);
      const s2 = s1 / 2;
      const cutback = Math.tan(thetaRad) * r;

      const p1 = createPipeMesh(r, tn, s2 + cutback, material);
      const p2 = createPipeMesh(r, tn, s1 + cutback * 2, material);
      const p3 = p2.clone();
      const p4 = p1.clone();

      const centerR = new Vector3(-Re, 0, -a);

      const start = new Vector3(0, 0, -a);

      const cut1 = fixVectorByOrientation(centerR, start, -theta, "y");
      const cut2 = fixVectorByOrientation(
        centerR,
        start,
        -params.degree / 2,
        "y"
      );
      const cut3 = fixVectorByOrientation(
        centerR,
        start,
        -(params.degree - theta),
        "y"
      );

      const end = fixVectorByOrientation(centerR, start, -params.degree, "y");

      const g1 = new Group();
      p1.position.setZ(-cutback / 2);
      g1.add(p1);
      g1.position.copy(start);
      g1.lookAt(cut1);

      const g2 = new Group();
      p2.position.setZ(-cutback);
      g2.add(p2);
      g2.position.copy(cut1);
      g2.lookAt(cut2);

      const g3 = new Group();
      p3.position.setZ(-cutback);
      g3.add(p3);
      g3.position.copy(cut2);
      g3.lookAt(cut3);

      const g4 = new Group();
      p4.position.setZ(-cutback / 2);
      g4.add(p4);
      g4.position.copy(cut3);
      g4.lookAt(end);

      const mesh = new Group().add(g1, g2, g3, g4);

      mesh.rotateY(deg90InRad);
      const group = new Group().add(mesh);
      group.position.setX(distance);

      return group;
    } else if (pipe.params.endConnectorDetails.type === "BWSM") {
      // TODO: create through polygons
      const details = pipe.params.endConnectorDetails!;

      const a = MMtoM(params.a ?? 0);
      const tn = MMtoM(details.tn ?? params.t);
      const r = MMtoM(details.r ? details.r + tn / 2 : params.d / 2);
      const Re = MMtoM(details.Re ?? a);
      const theta = details.Theta ?? 0;
      const thetaRad = degToRad(theta);
      const s1 = MMtoM(details.S ?? 0);
      const s2 = s1 / 2;
      const cutback = Math.tan(thetaRad) * r;

      const p1 = createPipeMesh(r, tn, s2 + cutback, material);
      const p2 = createPipeMesh(r, tn, s1 + cutback * 2, material);
      const p4 = p1.clone();

      const centerR = new Vector3(-Re, 0, -a);

      const start = new Vector3(0, 0, -a);

      const cut1 = fixVectorByOrientation(centerR, start, -theta, "y");
      const cut3 = fixVectorByOrientation(
        centerR,
        start,
        -(params.degree - theta),
        "y"
      );

      const end = fixVectorByOrientation(centerR, start, -params.degree, "y");

      const g1 = new Group();
      p1.position.setZ(-cutback / 2);
      g1.add(p1);
      g1.position.copy(start);
      g1.lookAt(cut1);

      const g2 = new Group();
      p2.position.setZ(-cutback);
      g2.add(p2);
      g2.position.copy(cut1);
      g2.lookAt(cut3);

      const g4 = new Group();
      p4.position.setZ(-cutback / 2);
      g4.add(p4);
      g4.position.copy(cut3);
      g4.lookAt(end);

      const mesh = new Group().add(g1, g2, g4);

      mesh.rotateY(deg90InRad);
      const group = new Group().add(mesh);
      group.position.setX(distance);

      return group;
    }
  }
  return new Group();
}

export function drawReturn(
  params: TPipingReturn,
  distance: number,
  material = new MeshLambertMaterial({ color, side: DoubleSide })
) {
  const radius = MMtoM(params.d) / 2;
  const o = MMtoM(params.o);
  const k = MMtoM(params.k ?? radius * 1.5);
  const curve = new CubicBezierCurve3(
    new Vector3(),
    new Vector3(0, 0, k),
    new Vector3(-o, 0, k),
    new Vector3(-o)
  );
  const mesh = new Mesh(
    new TubeBufferGeometry(curve, 32, radius, 32),
    material
  );
  mesh.rotateY(deg90InRad);
  const group = new Group().add(mesh);
  group.position.setX(distance);
  return group;
}

export function drawTee(
  pipe: FreePipe,
  distance: number,
  material = new MeshLambertMaterial({ color, side: DoubleSide })
) {
  const params = pipe.params.endConnector as TPipingTee;

  const radiusA = MMtoM(params.d1 ?? params.d) / 2;
  const radiusB = MMtoM(params.d2 ?? params.d) / 2;
  const thicknessA = MMtoM(params.t1 ?? params.t);
  const thicknessB = MMtoM(params.t2 ?? params.t);

  const m = MMtoM(params.m);

  const pipeShape = new Shape();
  pipeShape.absarc(0, 0, radiusA, 0, deg360InRad, false);

  const reducerShape = new Shape();
  reducerShape.absarc(0, 0, radiusB, 0, deg360InRad, false);

  const pipeHolePath = new Path();
  pipeHolePath.absarc(0, 0, radiusA - thicknessA, 0, deg360InRad, true);

  const reducerHolePath = new Path();
  reducerHolePath.absarc(0, 0, radiusB - thicknessB, 0, deg360InRad, true);

  pipeShape.holes.push(pipeHolePath);
  const c = MMtoM(params.c);
  const pipeMesh = new Mesh(
    new ExtrudeBufferGeometry(pipeShape, {
      steps: 1,
      bevelEnabled: false,
      curveSegments: 32,
      depth: c * 2,
    }),
    material
  );

  reducerShape.holes.push(reducerHolePath);
  const reducerMesh = new Mesh(
    new ExtrudeBufferGeometry(reducerShape, {
      steps: 1,
      bevelEnabled: false,
      curveSegments: 32,
      depth: m,
    }),
    material
  );
  reducerMesh.position.setZ(c);
  reducerMesh.rotateY(-deg90InRad);
  pipeMesh.add(reducerMesh);
  pipeMesh.position.setX(-c);
  pipeMesh.rotateY(deg90InRad);
  const group = new Group().add(pipeMesh);
  group.position.setX(distance);

  if (pipe.params.endConnectorDetails) {
    if (
      pipe.params.endConnectorDetails.type === "TWCI" ||
      pipe.params.endConnectorDetails.type === "TBWF"
    ) {
      const conn = new Mesh(
        new CylinderBufferGeometry(radiusB, radiusA, m, 32, 1, true),
        new MeshLambertMaterial({ color, side: DoubleSide })
      );
      conn.position.setZ(c);
      conn.rotateZ(deg90InRad);
      conn.position.setX(-m / 2);
      pipeMesh.add(conn);
    }
  }

  return group;
}

export function createFlange(
  type: TFlangeType,
  params: TPipingFlange,
  diameter: number | undefined,
  opacity: number,
  color?: string
) {
  switch (type) {
    case "Blind":
      return drawFlangeBlind(params as TPipingFlangeBlind, opacity, color);
    case "Lapped":
      return drawFlangeLapped(
        params as TPipingFlangeLapped,
        opacity,
        diameter,
        color
      );
    case "Ring Joint Facing":
      return drawFlangeRJF(
        params as TPipingFlangeRingJointFacing,
        opacity,
        diameter,
        color
      );
    case "Slip On":
      return drawFlange(
        params as TPipingFlangeSlipon,
        opacity,
        diameter,
        color
      );
    case "Socket Welding":
      return drawFlangeSocketWelding(
        params as TPipingFlangeSocketWelding,
        opacity,
        diameter,
        color
      );
    case "Threaded":
      return drawFlange(
        params as TPipingFlangeThreaded,
        opacity,
        diameter,
        color
      );
    case "Welding Neck":
      return drawFlangWeldingNeck(
        params as TPipingFlangeWeldingneck,
        opacity,
        diameter,
        color
      );
  }
}

export function drawFlange(
  params: TPipingFlangeSlipon | TPipingFlangeThreaded,
  opacity: number,
  diameter?: number,
  checkColor?: string
) {
  const material = new MeshLambertMaterial({
    transparent: opacity < 1,
    opacity,
    color: checkColor ?? pipeColor,
  });
  const B = MMtoM(params.b ?? diameter ?? 0) / 2;
  const X = MMtoM(params.x ?? 0) / 2;
  const Y = MMtoM(params.y ?? 0);
  const C = MMtoM(params.c ?? 0);
  const R = MMtoM(params.r ?? 0) / 2;
  const O = MMtoM(params.o ?? 0) / 2;
  const cs = params.class;
  const offset = cs && cs <= 900 ? 0.00635 : 0.0016;
  const deaphB = C - offset;
  const deaphA = Y - C;
  const mesh = new Group();
  const meshA = createPipeMesh(X, X - B, deaphA, material);
  const meshB = createPipeMesh(
    O,
    O - B,
    deaphB,
    material,
    getFlangeHoles(params)
  );
  meshB.position.setZ(deaphA);
  mesh.add(meshA, meshB);
  // if (cs && cs <= 900) {
  //   // @ts-ignore
  //   const P = MMtoM(params.p ?? 0) / 2;
  //   const K = MMtoM(params.k ?? 0) / 2;
  //   // @ts-ignore
  //   const F = MMtoM(params.f ?? 0) / 2;
  //   const meshC = createPipeMesh(K, K - (P + F), offset, material);
  //   const meshD = createPipeMesh(P - F, P - F - B, offset, material);
  //   meshC.position.setZ(deaphA + deaphB);
  //   meshD.position.setZ(deaphA + deaphB);
  //   mesh.add(meshC, meshD);
  // } else {
  const meshC = createPipeMesh(R, R - B, offset, material);
  meshC.position.setZ(deaphA + deaphB);
  mesh.add(meshC);
  // }
  mesh.rotateY(deg90InRad);
  return mesh;
}

export function drawFlangeRJF(
  params: TPipingFlangeRingJointFacing,
  opacity: number,
  diameter?: number,
  checkColor?: string
) {
  const material = new MeshLambertMaterial({
    transparent: opacity < 1,
    opacity,
    color: checkColor ?? pipeColor,
  });
  const cs = params.class;
  const B = MMtoM(params.b ?? diameter ?? 0) / 2;
  // @ts-ignore
  const X = MMtoM(params.x ?? 0) / 2;
  // @ts-ignore
  const Y = MMtoM(params.y ?? 0);
  const C = MMtoM(params.c ?? 0);
  // @ts-ignore
  const O = MMtoM(params.o ?? 0) / 2;
  const offset = cs && cs <= 900 ? 0.00635 : 0.0016;
  const deaphA = Y - C;
  const deaphB = C - offset;
  const deaphC = offset;
  const mesh = new Group();
  const meshA = createPipeMesh(X, X - B, deaphA, material);
  const meshB = createPipeMesh(
    O,
    O - B,
    deaphB,
    material,
    getFlangeHoles(params)
  );
  meshB.position.setZ(deaphA);
  mesh.add(meshA, meshB);
  if (cs && cs <= 900) {
    const P = MMtoM(params.p ?? 0) / 2;
    const K = MMtoM(params.k ?? 0) / 2;

    const F = MMtoM(params.f ?? 0) / 2;
    const meshC = createPipeMesh(K, K - (P + F), deaphC, material);
    const meshD = createPipeMesh(P - F, P - F - B, deaphC, material);
    meshC.position.setZ(deaphA + deaphB);
    meshD.position.setZ(deaphA + deaphB);
    mesh.add(meshC, meshD);
  } else {
    const R = MMtoM(params.r ?? 0) / 2;
    const meshC = createPipeMesh(R, R - B, deaphC, material);
    meshC.position.setZ(deaphA + deaphB);
    mesh.add(meshC);
  }
  mesh.rotateY(deg90InRad);
  return mesh;
}

export function drawFlangWeldingNeck(
  params: TPipingFlangeWeldingneck,
  opacity: number,
  diameter?: number,
  checkColor?: string
) {
  const material = new MeshLambertMaterial({
    transparent: opacity < 1,
    opacity,
    color: checkColor ?? pipeColor,
  });
  const A = MMtoM(params.a ?? 0) / 2;
  const B = MMtoM(params.b ?? diameter ?? 0) / 2;
  const X = MMtoM(params.x ?? 0) / 2;
  const Y = MMtoM(params.y ?? 0);
  const C = MMtoM(params.c ?? 0);
  const O = MMtoM(params.o ?? 0) / 2;
  const cs = params.class;
  const offset = cs && cs <= 900 ? 0.00635 : 0.0016;
  const deaphA = Y - C;
  const deaphB = C - offset;
  const deaphC = offset;
  const mesh = new Group();
  const meshA = new Mesh(
    new CylinderBufferGeometry(A, X, deaphA, 32, 1, true),
    material
  );
  meshA.rotateX(-deg90InRad);
  meshA.position.setZ(deaphA / 2);
  const meshB = createPipeMesh(
    O,
    O - B,
    deaphB,
    material,
    getFlangeHoles(params)
  );
  meshB.position.setZ(deaphA);
  mesh.add(meshA, meshB);
  // if (cs && cs <= 900) {
  //   // @ts-ignore
  //   const P = MMtoM(params.p ?? 0) / 2;
  //   const K = MMtoM(params.k ?? 0) / 2;
  //   // @ts-ignore
  //   const F = MMtoM(params.f ?? 0) / 2;
  //   const meshC = createPipeMesh(K, K - (P + F), deaphC, material);
  //   const meshD = createPipeMesh(P - F, P - F - B, deaphC, material);
  //   meshC.position.setZ(deaphA + deaphB);
  //   meshD.position.setZ(deaphA + deaphB);
  //   mesh.add(meshC, meshD);
  // } else {
  const R = MMtoM(params.r ?? 0) / 2;
  const meshC = createPipeMesh(R, R - B, deaphC, material);
  meshC.position.setZ(deaphA + deaphB);
  mesh.add(meshC);
  // }
  mesh.rotateY(deg90InRad);
  return mesh;
}

export function drawFlangeLapped(
  params: TPipingFlangeLapped,
  opacity: number,
  diameter?: number,
  checkColor?: string
) {
  const material = new MeshLambertMaterial({
    transparent: opacity < 1,
    opacity,
    color: checkColor ?? pipeColor,
  });
  const B = MMtoM(params.b ?? diameter ?? 0) / 2;
  const X = MMtoM(params.x ?? 0) / 2;
  const Y = MMtoM(params.y ?? 0);
  const C = MMtoM(params.c ?? 0);
  const O = MMtoM(params.o ?? 0) / 2;
  const deaphA = Y - C;
  const deaphB = C;
  const mesh = new Group();
  const meshA = createPipeMesh(X, X - B, deaphA, material);
  const meshB = createPipeMesh(
    O,
    O - B,
    deaphB,
    material,
    getFlangeHoles(params)
  );
  meshB.position.setZ(deaphA);
  mesh.add(meshA, meshB);
  mesh.rotateY(deg90InRad);
  return mesh;
}

export function drawFlangeBlind(
  params: TPipingFlangeBlind,
  opacity: number,
  checkColor?: string
) {
  const material = new MeshLambertMaterial({
    transparent: opacity < 1,
    opacity,
    color: checkColor ?? pipeColor,
  });
  const C = MMtoM(params.c ?? 0);
  const R = MMtoM(params.r ?? 0) / 2;
  const O = MMtoM(params.o ?? 0) / 2;
  const cs = params.class;
  const offset = cs && cs <= 900 ? 0.00635 : 0.0016;
  const deaphB = C - offset;
  const deaphC = offset;
  const mesh = new Group();
  const meshB = createPipeMesh(O, 0, deaphB, material, getFlangeHoles(params));
  const meshC = createPipeMesh(R, 0, deaphC, material);
  meshC.position.setZ(deaphB);
  mesh.add(meshB, meshC);
  mesh.rotateY(deg90InRad);
  return mesh;
}

export function drawFlangeSocketWelding(
  params: TPipingFlangeSocketWelding,
  opacity: number,
  diameter?: number,
  checkColor?: string
) {
  const material = new MeshLambertMaterial({
    transparent: opacity < 1,
    opacity,
    color: checkColor ?? pipeColor,
  });
  const B = MMtoM(params.b ?? diameter ?? 0) / 2;
  const B3 = MMtoM(params.b3 ?? params.b ?? diameter ?? 0) / 2;
  const X = MMtoM(params.x ?? 0) / 2;
  const Y = MMtoM(params.y ?? 0);
  const C = MMtoM(params.c ?? 0);
  const O = MMtoM(params.o ?? 0) / 2;
  const cs = params.class;
  const offset = cs && cs <= 900 ? 0.00635 : 0.0016;
  const deaphA = Y - C;
  const deaphB = C - offset;
  const deaphC = offset;
  const deaphD = Y / 2;
  const mesh = new Group();
  const meshA = createPipeMesh(X, X - B, deaphA, material);
  const meshB = createPipeMesh(
    O,
    O - B,
    deaphB,
    material,
    getFlangeHoles(params)
  );
  const meshD = createPipeMesh(B, B - B3 || 0.001, deaphD, material);
  meshB.position.setZ(deaphA);
  meshD.position.setZ(deaphD);
  mesh.add(meshA, meshB, meshD);
  // if (cs && cs <= 900) {
  //   // @ts-ignore
  //   const P = MMtoM(params.p ?? 0) / 2;
  //   const K = MMtoM(params.k ?? 0) / 2;
  //   // @ts-ignore
  //   const F = MMtoM(params.f ?? 0) / 2;
  //   const meshC = createPipeMesh(K, K - (P + F), deaphC, material);
  //   const meshD = createPipeMesh(P - F, P - F - B, deaphC, material);
  //   meshC.position.setZ(deaphA + deaphB);
  //   meshD.position.setZ(deaphA + deaphB);
  //   mesh.add(meshC, meshD);
  // } else {
  const R = MMtoM(params.r ?? 0) / 2;
  const meshC = createPipeMesh(R, R - B, deaphC, material);
  meshC.position.setZ(deaphA + deaphB);
  mesh.add(meshC);
  // }
  mesh.rotateY(deg90InRad);
  return mesh;
}
