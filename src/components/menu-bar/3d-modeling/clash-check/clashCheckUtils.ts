import {
  Vector3,
  Mesh,
  BoxGeometry,
  Shape,
  Path,
  Geometry,
  Raycaster,
  ExtrudeGeometry,
  Group,
  Material,
} from "three";
import {
  TClashElement,
  TClash,
  RolledSection,
  CombinedSection,
} from "../../../../store/data/types";
import { MMtoM, checkRange, degToRad } from "../../../3d-models/utils";
import {
  deg180InRad,
  deg90InRad,
  deg360InRad,
} from "../../../../store/main/constants";
import { getDefaultRotation } from "../../../3d-models/profileElement";
import { fixElevationOfBeamElement } from "../../../3d-models/openFrame";
import { getMeshRotation } from "../../../3d-models/pipes/pipesUtils";
import { createFaceMeshes } from "../../../../services/flare-services/flare-geometry-service";
import { drawProcessElement } from "../../../3d-models/process/process";

const angleInRad = degToRad(360 / 8);

export async function getClashes(elements: TClashElement[]) {
  const clashes: TClash[] = [];
  for (const current of elements) {
    for (const el of elements) {
      if (current.project === el.project) {
        if (current.model === el.model) {
          if (
            current.name === el.name ||
            (current.profile && el.profile) ||
            (current.flareSegment && el.flareSegment)
          )
            continue;
        }
      }
      const pos = checkClash(current, el);
      if (!pos) continue;
      clashes.push({
        id: clashes.length + 1,
        pos,
        elements: [current, el],
        remark: "",
        ignore: true,
      });
    }
  }
  return clashes;
}

export function getMesh(el?: TClashElement) {
  if (!el) return undefined;
  if (el.profile) {
    return createProfileGeometry(el);
  } else if (el.pipeProfile) {
    return createPipeGeometry(el);
  } else if (el.flareSegment) {
    return createFlareSegmentGeometry(el);
  } else if (el.equipment) {
    return createEquipmentGeometry(el);
  }
  return undefined;
}

function mergeGeometry(a: Mesh, b: Mesh) {
  b.updateMatrix();
  (a.geometry as THREE.Geometry).merge(b.geometry as THREE.Geometry, b.matrix);
}

function createProfileGeometry(el: TClashElement) {
  const d_global = MMtoM(el.profile!.d_global ?? 0);
  const bf_global = MMtoM(el.profile!.bf_global ?? 0);
  const type = el.profile!.type?.toUpperCase().trim();
  const shape = el.profile!.shape?.toUpperCase().trim();
  const mesh = new Mesh(new Geometry());
  const pWidth = bf_global; // Z
  const pDepth = d_global; // Y
  const pTflange = MMtoM(el.profile!.tf_global ?? 0);
  const pBflange = MMtoM(el.profile!.tfb_global ?? el.profile!.tf_global ?? 0);
  const pThickness = MMtoM(el.profile!.tw_global ?? 0);

  const pWidth_2 = pWidth / 2;
  const pDepth_2 = pDepth / 2;
  const pTflange_2 = pTflange / 2;
  const pBflange_2 = pBflange / 2;
  const pThickness_2 = pThickness / 2;

  const length = el.s.distanceTo(el.e);

  let topPlate;
  let bottomPlate;
  if (el.profile!.country_code === "Rolled") {
    const tpWidth = MMtoM((el.profile as RolledSection).tpWidth ?? 0);
    const tpThickness = MMtoM((el.profile as RolledSection).tpThickness ?? 0);
    if (tpWidth && tpThickness) {
      topPlate = new Mesh(new BoxGeometry(tpWidth, tpThickness, length));
      topPlate.position.setY(tpThickness / 2);
    }
    const bpWidth = MMtoM((el.profile as RolledSection).bpWidth ?? 0);
    const bpThickness = MMtoM((el.profile as RolledSection).bpThickness ?? 0);
    if (bpWidth && bpThickness) {
      bottomPlate = new Mesh(new BoxGeometry(bpWidth, bpThickness, length));
      bottomPlate.position.setY(bpThickness / -2);
    }
  }
  if (el.profile!.country_code === "Combined") {
    const a = createProfileGeometry({
      ...el,
      profile: {
        ...el.profile!,
        country_code: (el.profile as CombinedSection).CSLibrary,
      },
    });
    a.name = "Combined";
    const b = createProfileGeometry({
      ...el,
      profile: {
        ...el.profile!,
        country_code: (el.profile as CombinedSection).CSLibrary,
      },
    });
    b.name = "Combined";
    const gap = MMtoM((el.profile as CombinedSection).gap);
    const gap_2 = gap / 2;
    if ((el.profile as CombinedSection).combination === "B/B Depth") {
      if (shape === "C") {
        a.position.setZ(-(pWidth_2 + gap_2));
        a.rotateY(deg180InRad);
        b.position.setZ(pWidth_2 + gap_2);
      } else if (shape === "L") {
        const width = MMtoM(el.profile!.b_global ?? 0) / 2;
        a.position.setZ(-(width + gap_2));
        b.position.setZ(width + gap_2);
        b.rotateY(deg180InRad);
        a.rotateZ(deg180InRad);
        b.rotateZ(deg180InRad);
      }
    } else if ((el.profile as CombinedSection).combination === "B/B Width") {
      if (shape === "L") {
        a.position.setZ(-(pDepth_2 + gap_2));
        b.position.setZ(pDepth_2 + gap_2);
        a.rotateY(deg180InRad);
        a.rotateX(-deg90InRad);
        b.rotateX(-deg90InRad);
      }
    } else if ((el.profile as CombinedSection).combination === "F/F Depth") {
      if (shape === "C") {
        a.position.setZ(-(pWidth_2 + gap_2));
        b.position.setZ(pWidth_2 + gap_2);
        b.rotateY(deg180InRad);
      }
    } else if ((el.profile as CombinedSection).combination === "Star") {
      if (shape === "L") {
        const width = MMtoM(el.profile!.b_global ?? 0) / 2;
        a.position.setY(pDepth_2 + gap_2);
        a.position.setZ(-(width + gap_2));
        b.position.setY(-(pDepth_2 + gap_2));
        b.position.setZ(width + gap_2);
        a.rotateZ(deg180InRad);
        b.rotateY(deg180InRad);
      }
    }
    mergeGeometry(mesh, a);
    mergeGeometry(mesh, b);
    mesh.userData = { height: d_global, width: bf_global };
  } else if (shape === "I" || shape === "C" || shape === "BOX") {
    const height = pDepth - pTflange - pBflange;
    const height_2 = height / 2;
    const base = new Mesh(new BoxGeometry(pThickness, height, length));
    base.rotateY(-deg90InRad);
    if (shape === "C") {
      base.position.setZ(-pWidth_2 + pThickness_2);
    }
    if (shape === "BOX") {
      const base2 = base.clone();
      base.position.setZ(-pWidth_2 + pThickness_2);
      base2.position.setZ(pWidth_2 - pThickness_2);
      mergeGeometry(mesh, base2);
    }
    const topFlange = new Mesh(new BoxGeometry(pWidth, pTflange, length));
    topFlange.position.setY(height_2 + pTflange_2);
    topFlange.rotateY(-deg90InRad);
    if (topPlate) {
      topPlate.position.setY(topPlate.position.y + pTflange_2);
      topFlange.add(topPlate);
    }
    const bottomFlange = new Mesh(new BoxGeometry(pWidth, pBflange, length));
    bottomFlange.position.setY(-height_2 - pBflange_2);
    bottomFlange.rotateY(-deg90InRad);
    if (bottomPlate) {
      bottomPlate.position.setY(bottomPlate.position.y - pBflange_2);
      bottomFlange.add(bottomPlate);
    }
    mergeGeometry(mesh, base);
    mergeGeometry(mesh, topFlange);
    mergeGeometry(mesh, bottomFlange);
    mesh.userData = { height: d_global, width: bf_global };
  } else if (shape === "L" || type === "ANGLE") {
    const width = MMtoM(el.profile!.b_global ?? 0);
    const thickness = MMtoM(el.profile!.t_global ?? 0);
    const thickness_2 = thickness / 2;
    const height = pDepth - thickness;
    const base = new Mesh(new BoxGeometry(thickness, height, length));
    base.rotateY(-deg90InRad);
    base.position.setZ(width / 2 + thickness_2);
    const topFlange = new Mesh(new BoxGeometry(width, thickness, length));
    topFlange.rotateY(-deg90InRad);
    topFlange.position.setY(height / 2 + thickness_2);
    const group = new Mesh(new Geometry());
    mergeGeometry(group, base);
    mergeGeometry(group, topFlange);
    group.rotateX(-getDefaultRotation(el.profile));
    mergeGeometry(mesh, group);
    mesh.userData = {
      height: d_global,
      width: MMtoM(el.profile!.b_global ?? 0),
    };
  } else if (
    shape === "O" ||
    shape === "PIPE" ||
    shape === "OC PIPES" ||
    shape === "HSS ROUND" ||
    shape === "TUBE"
  ) {
    const t_g = MMtoM(el.profile?.t_global ?? 10);
    const arcShape = new Shape();
    arcShape.absarc(0, 0, pDepth_2, 0, deg360InRad, false);
    const holePath = new Path();
    holePath.absarc(0, 0, pDepth_2 - t_g, 0, deg360InRad, true);
    arcShape.holes.push(holePath);
    const pipe = new Mesh(
      new ExtrudeGeometry(arcShape, {
        steps: 1,
        bevelEnabled: false,
        curveSegments: 32,
        depth: length,
      })
    );
    pipe.rotateY(deg90InRad);
    pipe.position.x = -length / 2;
    mergeGeometry(mesh, pipe);
    mesh.userData = { height: d_global, width: d_global };
  }
  mesh.position.copy(el.s);
  mesh.lookAt(el.e);
  mesh.position.add(el.e).divideScalar(2);
  mesh.rotateY(-deg90InRad);
  mesh.rotateX(degToRad(el.orientation ?? 0));
  return mesh;
}

function createPipeGeometry(el: TClashElement) {
  const mesh = new Mesh(new Geometry());
  const radius = MMtoM(el.pipeProfile!.outside_diameter_global) / 2;
  const thickness = MMtoM(el.pipeProfile!.wall_thickness_global);
  if (!radius) return mesh;
  const arcShape = new Shape();
  arcShape.absarc(0, 0, radius, 0, deg360InRad, false);
  if (thickness && checkRange(thickness, 0, radius)) {
    const holePath = new Path();
    holePath.absarc(0, 0, radius - thickness, 0, deg360InRad, true);
    arcShape.holes.push(holePath);
  }
  const pipe = new Mesh(
    new ExtrudeGeometry(arcShape, {
      steps: 1,
      bevelEnabled: false,
      curveSegments: 32,
      depth: el.s.distanceTo(el.e),
    })
  );
  pipe.rotateY(deg90InRad);
  mergeGeometry(mesh, pipe);
  mesh.position.copy(el.s);
  mesh.lookAt(el.e);
  mesh.rotateY(-deg90InRad);
  return mesh;
}

function createFlareSegmentGeometry(el: TClashElement) {
  if (!el.flareSegment) return;
  const mesh = new Mesh(new Geometry());
  const group = new Group();
  const height =
    el.flareSegment.topElevation_M - el.flareSegment.bottomElevation_M;
  const thickness = MMtoM(el.flareSegment.thickness_MM);
  const topInnerRadius = el.flareSegment.topInternalDiameter_M / 2;
  const bottomInnerRadius = el.flareSegment.bottomInternalDiameter_M / 2;
  const topOuterRadius = topInnerRadius + thickness;
  const bottomOuterRadius = bottomInnerRadius + thickness;
  createFaceMeshes(
    group,
    topOuterRadius,
    bottomOuterRadius,
    height,
    new Material()
  );
  for (const child of group.children) {
    const childMesh = child as Mesh;
    mergeGeometry(mesh, childMesh);
  }
  mesh.position.copy(el.s);
  return mesh;
}

function createEquipmentGeometry(el: TClashElement) {
  if (!el.equipment) return;
  const mesh = new Mesh(new Geometry());
  const proccessMesh = drawProcessElement("PROCESS", el.equipment, false);
  mergeGeometry(mesh, proccessMesh);
  mesh.position.copy(el.s);
  return mesh;
}

function getProfileShape(el: TClashElement) {
  const vectors: Vector3[] = [new Vector3()];

  const type = el.profile!.type?.toUpperCase().trim();
  const shape = el.profile!.shape?.toUpperCase().trim();

  const d_global = MMtoM(el.profile!.d_global ?? 0);
  const bf_global = MMtoM(el.profile!.bf_global ?? 0);

  const pWidth = bf_global; // Z
  const pDepth = d_global; // Y

  const pWidth_2 = pWidth / 2;
  const pDepth_2 = pDepth / 2;

  // if (el.profile!.country_code === "Combined") {
  //   const a = getProfileShape({
  //     ...el,
  //     profile: {
  //       ...el.profile!,
  //       country_code: (el.profile as CombinedSection).CSLibrary,
  //     },
  //   });
  //   const b = getProfileShape({
  //     ...el,
  //     profile: {
  //       ...el.profile!,
  //       country_code: (el.profile as CombinedSection).CSLibrary,
  //     },
  //   });
  //   const gap = MMtoM((el.profile as CombinedSection).gap);
  //   const gap_2 = gap / 2;
  //   if ((el.profile as CombinedSection).combination === "B/B Depth") {
  //     if (shape === "C") {
  //       a.position.setZ(-(pWidth_2 + gap_2));
  //       a.rotateY(deg180InRad);
  //       b.position.setZ(pWidth_2 + gap_2);
  //     } else if (shape === "L") {
  //       const width = MMtoM(el.profile!.b_global ?? 0) / 2;
  //       a.position.setZ(-(width + gap_2));
  //       b.position.setZ(width + gap_2);
  //       b.rotateY(deg180InRad);
  //       a.rotateZ(deg180InRad);
  //       b.rotateZ(deg180InRad);
  //     }
  //   } else if ((el.profile as CombinedSection).combination === "B/B Width") {
  //     if (shape === "L") {
  //       a.position.setZ(-(pDepth_2 + gap_2));
  //       b.position.setZ(pDepth_2 + gap_2);
  //       a.rotateY(deg180InRad);
  //       a.rotateX(-deg90InRad);
  //       b.rotateX(-deg90InRad);
  //     }
  //   } else if ((el.profile as CombinedSection).combination === "F/F Depth") {
  //     if (shape === "C") {
  //       a.position.setZ(-(pWidth_2 + gap_2));
  //       b.position.setZ(pWidth_2 + gap_2);
  //       b.rotateY(deg180InRad);
  //     }
  //   } else if ((el.profile as CombinedSection).combination === "Star") {
  //     if (shape === "L") {
  //       const width = MMtoM(el.profile!.b_global ?? 0) / 2;
  //       a.position.setY(pDepth_2 + gap_2);
  //       a.position.setZ(-(width + gap_2));
  //       b.position.setY(-(pDepth_2 + gap_2));
  //       b.position.setZ(width + gap_2);
  //       a.rotateZ(deg180InRad);
  //       b.rotateY(deg180InRad);
  //     }
  //   }
  // } else

  let width = 0;
  let height = 0;

  if (shape === "I" || shape === "C" || shape === "BOX") {
    vectors.push(new Vector3(0, pDepth_2, -pWidth_2));
    vectors.push(new Vector3(0, pDepth_2, pWidth_2));
    vectors.push(new Vector3(0, -pDepth_2, pWidth_2));
    vectors.push(new Vector3(0, -pDepth_2, -pWidth_2));
    width = pWidth;
    height = pDepth;
  } else if (shape === "L" || type === "ANGLE") {
    const w = MMtoM(el.profile!.b_global ?? 0) / 2;
    vectors.push(new Vector3(0, pDepth_2, -w));
    vectors.push(new Vector3(0, pDepth_2, w));
    vectors.push(new Vector3(0, -pDepth_2, -w));
    width = w * 2;
    height = pDepth;
  } else if (
    shape === "O" ||
    shape === "PIPE" ||
    shape === "OC PIPES" ||
    shape === "HSS ROUND" ||
    shape === "TUBE"
  ) {
    width = pDepth;
    height = pDepth;
    const sideV = new Vector3(0, 0, pDepth_2);
    for (let i = 0; i < 8; i++) {
      const from = sideV.clone();
      from.applyAxisAngle(new Vector3(1), angleInRad * i);
      vectors.push(from);
    }
  }
  // mesh.position.copy(el.s);
  // mesh.lookAt(el.e);
  // mesh.position.add(el.e).divideScalar(2);
  // mesh.rotateY(-deg90InRad);
  // mesh.rotateX(degToRad(el.orientation ?? 0));

  const rotation = getMeshRotation(el.s, el.e);

  const start = el.s.clone();

  switch (el.orientation) {
    case 0:
    case 180:
      start.setY(start.y - height / 2);
      break;
    case 90:
    case 270:
      start.setY(start.y - width / 2);
      break;
    default: {
      const a = width + height;
      const b = Math.sqrt(2 * Math.pow(a, 2)) / 2;
      const offset = Math.sqrt(Math.pow(a, 2) - Math.pow(b, 2)) / 2;
      start.setY(start.y - offset);
    }
  }

  vectors.forEach((v) => v.applyEuler(rotation).add(start));

  return vectors;
}

function getFlareSegmentVectors(el: TClashElement) {
  const vectors: { from: Vector3; to: Vector3 }[] = [];
  if (!el.flareSegment) return vectors;
  const thickness = MMtoM(el.flareSegment.thickness_MM);
  const topOuterRadius = el.flareSegment.topInternalDiameter_M / 2 + thickness;
  const bottomOuterRadius =
    el.flareSegment.bottomInternalDiameter_M / 2 + thickness;
  const v1 = el.s.clone().add(new Vector3(0, 0, bottomOuterRadius));
  const v2 = el.e.clone().add(new Vector3(0, 0, topOuterRadius));
  const y = new Vector3(0, 1);
  for (let i = 0; i < 32; i++) {
    const from = v1.clone().applyAxisAngle(y, angleInRad);
    const to = v2.clone().applyAxisAngle(y, angleInRad);

    vectors.push({ from, to });

    v1.copy(from);
    v2.copy(to);
  }
  return vectors;
}

export function checkClash(
  elA: TClashElement,
  elB: TClashElement
): Vector3 | undefined | null {
  const v = elA.e
    .clone()
    .sub(elA.s)
    .normalize();
  const mesh = getMesh(elB);
  if (!mesh) return;
  // scene.add(mesh);
  if (
    elB.type === "BEAM" ||
    elB.type === "CANTILEVER" ||
    elB.type === "HORIZONTAL-BRACING"
  ) {
    fixElevationOfBeamElement(elB as any, mesh, mesh.position);
  }
  mesh.geometry.computeBoundingSphere();
  mesh.geometry.computeBoundingBox();
  mesh.updateMatrixWorld();
  const length = elA.s.distanceTo(elA.e);

  if (elA.profile) {
    const vectors = getProfileShape(elA);
    for (const vect of vectors) {
      const raycaster = new Raycaster(vect, v, 0, length);
      const intersects = raycaster.intersectObject(mesh);
      if (intersects.length) return intersects[0]?.point;
    }
  } else if (elA.pipeProfile) {
    const raycaster = new Raycaster(elA.s, v, 0, length);
    const intersects = raycaster.intersectObject(mesh);
    if (intersects.length) {
      return intersects[0]?.point;
    }
    const r = MMtoM(elA.pipeProfile.outside_diameter_global) / 2;
    const rotation = getMeshRotation(elA.s, elA.e);
    const sideV = new Vector3(0, 0, r);
    for (let i = 0; i < 8; i++) {
      const from = sideV.clone();
      from.applyAxisAngle(new Vector3(1), angleInRad * i);
      from.applyEuler(rotation);
      from.add(elA.s);
      const raycaster = new Raycaster(from, v, 0, length);
      const intersects = raycaster.intersectObject(mesh);
      if (intersects.length) return intersects[0]?.point;
    }
  } else if (elA.flareSegment) {
    const vectors = getFlareSegmentVectors(elA);
    for (const vect of vectors) {
      const { from, to } = vect;
      const dir = from
        .clone()
        .sub(to)
        .normalize();
      const raycaster = new Raycaster(from, dir, 0, from.distanceTo(to));
      const intersects = raycaster.intersectObject(mesh);
      if (intersects.length) return intersects[0]?.point;
    }
  } else if (elA.equipment) {
    const meshA = getMesh(elA);
    if (!meshA) return;
    const vectors = ((meshA.geometry as any).vertices ?? []) as Vector3[];
    for (const vect of vectors) {
      const dir = elA.s
        .clone()
        .sub(vect)
        .normalize();
      const raycaster = new Raycaster(elA.s, dir, 0, elA.s.distanceTo(vect));
      const intersects = raycaster.intersectObject(mesh);
      if (intersects.length) return intersects[0]?.point;
    }
  }
}
