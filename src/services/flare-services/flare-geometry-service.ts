import {
  DoubleSide,
  Face3,
  Geometry,
  Group,
  Material,
  Mesh,
  MeshLambertMaterial,
  RingGeometry,
  Vector3,
} from "three";
import { degToRad, getRGB, MMtoM } from "../../components/3d-models/utils";
import { deg90InRad } from "../../store/main/constants";
import { TFlareSegment } from "../../store/main/types/flare";

function createFaceMesh(v1: Vector3, v2: Vector3, v3: Vector3, m: Material) {
  const g = new Geometry();
  g.vertices.push(v1);
  g.vertices.push(v2);
  g.vertices.push(v3);
  const f = new Face3(0, 1, 2);
  g.faces.push(f);
  g.computeFaceNormals();
  g.computeVertexNormals();
  return new Mesh(g, m);
}

export function createFaceMeshes(
  group: Group,
  topR: number,
  bottomR: number,
  height: number,
  m: Material
) {
  const count = 32;
  const angleInRad = degToRad(360 / count);
  const v1 = new Vector3(0, 0, bottomR);
  const v2 = new Vector3(0, 0, topR);
  const y = new Vector3(0, 1);
  for (let i = 0; i < count; i++) {
    const nv1 = v1.clone().applyAxisAngle(y, angleInRad);
    const nv2 = v2.clone().applyAxisAngle(y, angleInRad);

    const from1 = v1.clone().setY(0);
    const from2 = nv1.clone().setY(0);

    const to1 = v2.clone().setY(height);
    const to2 = nv2.clone().setY(height);

    group.add(createFaceMesh(from1, from2, to1, m));
    group.add(createFaceMesh(from2, to1, to2, m));

    v1.copy(nv1);
    v2.copy(nv2);
  }
}

function createRingMesh(
  group: Group,
  innerR: number,
  outerR: number,
  height: number,
  m: Material
) {
  const g = new RingGeometry(innerR, outerR, 32);
  const mesh = new Mesh(g, m);
  mesh.position.setY(height);
  mesh.rotateX(deg90InRad);
  group.add(mesh);
}

export function createFlareSegmentGroup(segment: TFlareSegment): Group {
  const group = new Group();
  group.name = segment.name;

  group.position.setY(segment.bottomElevation_M);

  const height = segment.topElevation_M - segment.bottomElevation_M;
  const thickness = MMtoM(segment.thickness_MM);

  const topInnerRadius = segment.topInternalDiameter_M / 2;
  const bottomInnerRadius = segment.bottomInternalDiameter_M / 2;

  const topOuterRadius = topInnerRadius + thickness;
  const bottomOuterRadius = bottomInnerRadius + thickness;

  const material = new MeshLambertMaterial({
    color: getRGB([150, 150, 150]),
    side: DoubleSide,
  });

  createRingMesh(group, topInnerRadius, topOuterRadius, height, material);
  createRingMesh(group, bottomInnerRadius, bottomOuterRadius, 0, material);
  createFaceMeshes(group, topInnerRadius, bottomInnerRadius, height, material);
  createFaceMeshes(group, topOuterRadius, bottomOuterRadius, height, material);

  return group;
}

export function createFlareRefractoryGroup(segment: TFlareSegment): Group {
  const group = new Group();
  group.name = `${segment.name}-REFRACTORY`;

  group.position.setY(segment.bottomElevation_M);

  const height = segment.topElevation_M - segment.bottomElevation_M;
  const thickness = MMtoM(segment.refractoryThickness_MM);

  const topOuterRadius = segment.topInternalDiameter_M / 2;
  const bottomOuterRadius = segment.bottomInternalDiameter_M / 2;

  const topInnerRadius = topOuterRadius - thickness;
  const bottomInnerRadius = bottomOuterRadius - thickness;

  const material = new MeshLambertMaterial({
    color: "green",
    side: DoubleSide,
  });

  createRingMesh(group, topInnerRadius, topOuterRadius, height, material);
  createRingMesh(group, bottomInnerRadius, bottomOuterRadius, 0, material);
  createFaceMeshes(group, topInnerRadius, bottomInnerRadius, height, material);
  createFaceMeshes(group, topOuterRadius, bottomOuterRadius, height, material);

  return group;
}
