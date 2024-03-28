import {
  Mesh,
  CylinderBufferGeometry,
  BoxBufferGeometry,
  MeshLambertMaterial,
  Group,
  Shape,
  Path,
  ExtrudeBufferGeometry,
  Vector3,
  BoxGeometry,
  Geometry,
} from "three";
import { fixRGB, getRGB, MMtoM, getPosByDistance } from "./utils";
import {
  pedestalColor,
  deg90InRad,
  deg360InRad,
  deg180InRad,
} from "../../store/main/constants";
import { getSimpleAxisHelper } from "./axisHelper";
import {
  Section,
  RolledSection,
  CombinedSection,
} from "../../store/data/types";

/**
 * @param h - height (depth) in meters,
 * @param b - width in meters,
 * @param t - thickness in meters,
 * @returns angle in radian
 */
export function getLRotation(h: number, b: number, t: number) {
  const powB2 = Math.pow(b, 2);
  const powH2 = Math.pow(h, 2);
  const powT2 = Math.pow(t, 2);

  const powB3 = Math.pow(b, 3);
  const powH3 = Math.pow(h, 3);
  const powT3 = Math.pow(t, 3);

  const t_2 = t / 2;
  const t_3 = t / 3;

  const A = (h + b - t) * t;

  const _1_A = 1 / A;

  const Xc = _1_A * (t_2 * (powB2 + h * t - powT2));
  const Yc = _1_A * (t_2 * (powH2 + b * t - powT2));

  const Ix0 = t_3 * (powT2 * b + powH3 - powT3);
  const Iy0 = t_3 * (powT2 * h + powB3 - powT3);
  const Ix0y0 = (powT2 / 4) * (powB2 + powH2 - powT2);

  const Ix = Ix0 - A * Math.pow(Yc, 2);
  const Iy = Iy0 - A * Math.pow(Xc, 2);
  const Ixy = Ix0y0 - A * Xc * Yc;

  const theta = 0.5 * Math.atan((-2 * Ixy) / (Ix - Iy));

  return theta ? theta : 0;
}

export function getDefaultRotation(profile?: Section) {
  if (!profile) return 0;
  const type = profile.type?.toUpperCase().trim();
  const shape = profile.shape?.toUpperCase().trim();
  if (profile.country_code === "Combined") return 0;
  if (shape === "L" || type === "ANGLE") {
    return (
      deg90InRad -
      getLRotation(
        MMtoM(profile.d_global ?? 0),
        MMtoM(profile.b_global ?? 0),
        MMtoM(profile.t_global ?? 0)
      )
    );
  } else return 0;
}

export function createElementByProfile(
  length: number,
  rgb: string | number[],
  profile: Section,
  axesHelper?: boolean,
  defualtRotationX?: number
) {
  const type = profile.type?.toUpperCase().trim();
  const shape = profile.shape?.toUpperCase().trim();
  const mesh = new Mesh(new Geometry());
  const material = new MeshLambertMaterial({
    color: typeof rgb === "string" ? rgb : fixRGB(rgb),
  });
  const pWidth = MMtoM(profile.bf_global ?? 0); // Z
  const pDepth = MMtoM(profile.d_global ?? 200); // Y
  const pTflange = MMtoM(profile.tf_global ?? 0);
  const pBflange = MMtoM(profile.tfb_global ?? profile.tf_global ?? 0);
  const pThickness = MMtoM(profile.tw_global ?? 0);

  const pWidth_2 = pWidth / 2;
  const pDepth_2 = pDepth / 2;
  const pTflange_2 = pTflange / 2;
  const pBflange_2 = pBflange / 2;
  const pThickness_2 = pThickness / 2;

  let topPlate;
  let bottomPlate;
  if (profile?.country_code === "Rolled") {
    const tpWidth = MMtoM((profile as RolledSection).tpWidth ?? 0);
    const tpThickness = MMtoM((profile as RolledSection).tpThickness ?? 0);
    if (tpWidth && tpThickness) {
      topPlate = new Mesh(
        new BoxBufferGeometry(tpWidth, tpThickness, length),
        new MeshLambertMaterial({ color: getRGB(pedestalColor) })
      );
      topPlate.position.setY(tpThickness / 2);
    }
    const bpWidth = MMtoM((profile as RolledSection).bpWidth ?? 0);
    const bpThickness = MMtoM((profile as RolledSection).bpThickness ?? 0);
    if (bpWidth && bpThickness) {
      bottomPlate = new Mesh(
        new BoxBufferGeometry(bpWidth, bpThickness, length),
        new MeshLambertMaterial({ color: getRGB(pedestalColor) })
      );
      bottomPlate.position.setY(bpThickness / -2);
    }
  }
  if (profile?.country_code === "Combined") {
    const a = createElementByProfile(length, rgb, {
      ...profile,
      country_code: (profile as CombinedSection).CSLibrary,
    });
    a.name = "Combined";
    const b = createElementByProfile(length, rgb, {
      ...profile,
      country_code: (profile as CombinedSection).CSLibrary,
    });
    b.name = "Combined";
    const gap = MMtoM((profile as CombinedSection).gap);
    const gap_2 = gap / 2;
    if ((profile as CombinedSection).combination === "B/B Depth") {
      if (profile.shape === "C") {
        a.position.setZ(-(pWidth_2 + gap_2));
        a.rotateY(deg180InRad);
        b.position.setZ(pWidth_2 + gap_2);
      } else if (profile.shape === "L") {
        const width = MMtoM(profile.b_global ?? 0) / 2;
        a.position.setZ(-(width + gap_2));
        b.position.setZ(width + gap_2);
        b.rotateY(deg180InRad);
        a.rotateZ(deg180InRad);
        b.rotateZ(deg180InRad);
      }
    } else if ((profile as CombinedSection).combination === "B/B Width") {
      if (profile.shape === "L") {
        a.position.setZ(-(pDepth_2 + gap_2));
        b.position.setZ(pDepth_2 + gap_2);
        a.rotateY(deg180InRad);
        a.rotateX(-deg90InRad);
        b.rotateX(-deg90InRad);
      }
    } else if ((profile as CombinedSection).combination === "F/F Depth") {
      if (profile.shape === "C") {
        a.position.setZ(-(pWidth_2 + gap_2));
        b.position.setZ(pWidth_2 + gap_2);
        b.rotateY(deg180InRad);
      }
    }
    // else if ((profile as CombinedSection).combination === "F/F Width") {
    // }
    else if ((profile as CombinedSection).combination === "Star") {
      if (profile.shape === "L") {
        const width = MMtoM(profile.b_global ?? 0) / 2;
        a.position.setY(pDepth_2 + gap_2);
        a.position.setZ(-(width + gap_2));
        b.position.setY(-(pDepth_2 + gap_2));
        b.position.setZ(width + gap_2);
        a.rotateZ(deg180InRad);
        b.rotateY(deg180InRad);
      }
    }
    if (axesHelper) {
      const axesHelperMesh = getSimpleAxisHelper();
      axesHelperMesh.position.setY(pDepth_2);
      mesh.add(axesHelperMesh);
    }
    mesh.userData = {
      height: pDepth,
      width: pWidth,
    };
    mesh.add(a, b);
    return mesh;
  } else if (shape === "I" || shape === "C" || shape === "Box") {
    const height = pDepth - pTflange - pBflange;
    const height_2 = height / 2;
    const base = new Mesh(
      new BoxGeometry(pThickness, height, length)
      // new MeshLambertMaterial({ color: fixRGB(rgb) })
    );
    base.rotateY(-deg90InRad);
    if (shape === "C") {
      base.position.setZ(-pWidth_2 + pThickness_2);
    }
    if (shape === "Box") {
      const base2 = base.clone();
      base.position.setZ(-pWidth_2 + pThickness_2);
      base2.position.setZ(pWidth_2 - pThickness_2);
      base2.updateMatrix();
      (mesh.geometry as THREE.Geometry).merge(
        base2.geometry as THREE.Geometry,
        base2.matrix
      );
    }
    base.updateMatrix();
    (mesh.geometry as THREE.Geometry).merge(
      base.geometry as THREE.Geometry,
      base.matrix
    );
    const topFlange = new Mesh(
      new BoxGeometry(pWidth, pTflange, length)
      // new MeshLambertMaterial({ color: getRGB(rgb) })
    );
    topFlange.position.setY(height_2 + pTflange_2);
    topFlange.rotateY(-deg90InRad);
    topFlange.updateMatrix();
    (mesh.geometry as THREE.Geometry).merge(
      topFlange.geometry as THREE.Geometry,
      topFlange.matrix
    );
    if (topPlate) {
      topPlate.position.setY(topPlate.position.y + pTflange_2);
      topFlange.add(topPlate);
    }
    const bottomFlange = new Mesh(
      new BoxGeometry(pWidth, pBflange, length)
      // new MeshLambertMaterial({ color: getRGB(rgb) })
    );
    bottomFlange.position.setY(-height_2 - pBflange_2);
    bottomFlange.rotateY(-deg90InRad);
    bottomFlange.updateMatrix();
    (mesh.geometry as THREE.Geometry).merge(
      bottomFlange.geometry as THREE.Geometry,
      bottomFlange.matrix
    );
    if (bottomPlate) {
      bottomPlate.position.setY(bottomPlate.position.y - pBflange_2);
      bottomFlange.add(bottomPlate);
    }
    if (axesHelper) {
      const axesHelperMesh = getSimpleAxisHelper();
      axesHelperMesh.position.setY(pDepth_2);
      mesh.add(axesHelperMesh);
    }
    mesh.userData = {
      height: pDepth,
      width: pWidth,
    };
    mesh.material = material;
    return mesh;
  } else if (shape === "L" || type === "ANGLE") {
    const temp = new Mesh(new Geometry());
    const width = MMtoM(profile.b_global ?? 0);
    const thickness = MMtoM(profile.t_global ?? 0);
    const thickness_2 = thickness / 2;
    const height = pDepth - thickness;
    const base = new Mesh(new BoxGeometry(thickness, height, length));
    base.rotateY(-deg90InRad);
    base.position.setZ(width / 2 + thickness_2);
    base.updateMatrix();
    (temp.geometry as THREE.Geometry).merge(
      base.geometry as THREE.Geometry,
      base.matrix
    );
    const topFlange = new Mesh(new BoxGeometry(width, thickness, length));
    topFlange.rotateY(-deg90InRad);
    topFlange.position.setY(height / 2 + thickness_2);
    topFlange.updateMatrix();
    (temp.geometry as THREE.Geometry).merge(
      topFlange.geometry as THREE.Geometry,
      topFlange.matrix
    );
    if (axesHelper) {
      const axesHelperMesh = getSimpleAxisHelper();
      axesHelperMesh.position.setY(pDepth_2);
      mesh.add(axesHelperMesh);
    }
    temp.rotateX(-(defualtRotationX ?? 0));
    temp.updateMatrix();
    (mesh.geometry as THREE.Geometry).merge(
      temp.geometry as THREE.Geometry,
      temp.matrix
    );
    mesh.userData = {
      height: pDepth,
      width: width,
    };
    mesh.material = material;
    return mesh;
  } else if (
    shape === "O" ||
    shape === "PIPE" ||
    shape === "OC PIPES" ||
    shape === "HSS ROUND" ||
    shape === "TUBE"
  ) {
    const t_g = MMtoM(profile?.t_global ?? 10);
    // if (!t_g) {
    // t_g = (pDepth - pWidth) / 2;
    // }
    const arcShape = new Shape();
    arcShape.absarc(0, 0, pDepth_2, 0, deg360InRad, false);
    const holePath = new Path();
    holePath.absarc(0, 0, pDepth_2 - t_g, 0, deg360InRad, true);
    arcShape.holes.push(holePath);
    const pipe = new Mesh(
      new ExtrudeBufferGeometry(arcShape, {
        steps: 1,
        bevelEnabled: false,
        curveSegments: 32,
        depth: length,
      }),
      new MeshLambertMaterial({
        color: typeof rgb === "string" ? rgb : getRGB(rgb),
      })
    );
    if (axesHelper) {
      const axesHelperMesh = getSimpleAxisHelper();
      axesHelperMesh.position.setY(pDepth_2);
      mesh.add(axesHelperMesh);
    }
    pipe.rotateY(deg90InRad);
    pipe.position.x = -length / 2;
    mesh.userData = {
      height: pDepth,
      width: pDepth,
    };
    return mesh.add(pipe);
  }
  const pipe = new Mesh(
    new CylinderBufferGeometry(pDepth_2, pDepth_2, length, 32),
    new MeshLambertMaterial({
      color: typeof rgb === "string" ? rgb : getRGB(rgb),
    })
  );
  pipe.rotateZ(-deg90InRad);
  return mesh.add(pipe);
}

export function createFireProofingByProfile(
  start: Vector3,
  end: Vector3,
  profile: Section,
  height: number,
  thickness: number,
  limit: number,
  opacity: number
) {
  const minY = Math.min(start.y, end.y);
  const maxY = Math.max(start.y, end.y);

  if (height <= minY) return;

  let length = 0;

  const t = MMtoM(thickness * 2);

  const s = start.y <= end.y ? start.clone() : end.clone();
  const e = start.y <= end.y ? end.clone() : start.clone();

  if (height >= maxY) {
    length = s.distanceTo(e);
  } else {
    e.copy(getPosByDistance(height - s.y, s, e));
    length = s.distanceTo(e);
  }

  const defRX = getDefaultRotation(profile);

  const material = new MeshLambertMaterial({
    color: fixRGB(pedestalColor),
    transparent: opacity < 100,
    opacity: opacity / 100,
  });

  const type = profile.type?.toUpperCase().trim();
  const shape = profile.shape?.toUpperCase().trim();

  const mesh = new Mesh();
  mesh.position.copy(s);
  mesh.lookAt(e);
  mesh.position.add(e).divideScalar(2);
  mesh.rotateY(-deg90InRad);
  mesh.rotateX(-defRX);

  const d_global = MMtoM(profile.d_global ?? 0);
  const bf_global = MMtoM(profile.bf_global ?? 0);

  const pWidth = bf_global + t; // Z
  const pDepth = d_global + t; // Y
  const pTflange = MMtoM(profile.tf_global ?? 0) + t;
  const pBflange = MMtoM(profile.tfb_global ?? profile.tf_global ?? 0) + t;
  const pThickness = MMtoM(profile.tw_global ?? 0) + t;

  const pWidth_2 = pWidth / 2;
  const pDepth_2 = pDepth / 2;
  const pTflange_2 = pTflange / 2;
  const pBflange_2 = pBflange / 2;
  const pThickness_2 = pThickness / 2;

  if (d_global <= limit) {
    const box = new Mesh(
      new BoxBufferGeometry(
        length,
        pDepth,
        bf_global ? pWidth : MMtoM(profile.b_global ?? 0) + t
      ),
      material
    );
    box.rotateX(-defRX);
    mesh.add(box);
    mesh.userData = {
      height: d_global,
      width: bf_global,
    };
    return mesh;
  } else {
    if (profile?.country_code === "Combined") {
      const a = createFireProofingByProfile(
        s,
        e,
        profile,
        height,
        thickness,
        limit,
        opacity
      );
      if (!a) return;
      a.name = "Combined";
      const b = createFireProofingByProfile(
        s,
        e,
        profile,
        height,
        thickness,
        limit,
        opacity
      );
      if (!b) return;
      b.name = "Combined";
      const gap = MMtoM((profile as CombinedSection).gap);
      const gap_2 = gap / 2;
      if ((profile as CombinedSection).combination === "B/B Depth") {
        if (profile.shape === "C") {
          a.position.setZ(-(pWidth_2 + gap_2));
          a.rotateY(deg180InRad);
          b.position.setZ(pWidth_2 + gap_2);
        } else if (profile.shape === "L") {
          const width = MMtoM(profile.b_global ?? 0) / 2;
          a.position.setZ(-(width + gap_2));
          b.position.setZ(width + gap_2);
          b.rotateY(deg180InRad);
          a.rotateZ(deg180InRad);
          b.rotateZ(deg180InRad);
        }
      } else if ((profile as CombinedSection).combination === "B/B Width") {
        if (profile.shape === "L") {
          a.position.setZ(-(pDepth_2 + gap_2));
          b.position.setZ(pDepth_2 + gap_2);
          a.rotateY(deg180InRad);
          a.rotateX(-deg90InRad);
          b.rotateX(-deg90InRad);
        }
      } else if ((profile as CombinedSection).combination === "F/F Depth") {
        if (profile.shape === "C") {
          a.position.setZ(-(pWidth_2 + gap_2));
          b.position.setZ(pWidth_2 + gap_2);
          b.rotateY(deg180InRad);
        }
      } else if ((profile as CombinedSection).combination === "Star") {
        if (profile.shape === "L") {
          const width = MMtoM(profile.b_global ?? 0) / 2 + t;
          a.position.setY(pDepth_2 + gap_2);
          a.position.setZ(-(width + gap_2));
          b.position.setY(-(pDepth_2 + gap_2));
          b.position.setZ(width + gap_2);
          a.rotateZ(deg180InRad);
          b.rotateY(deg180InRad);
        }
      }
      mesh.userData = {
        height: d_global,
        width: MMtoM(profile.bf_global ?? 0),
      };
      mesh.add(a, b);
      return mesh;
    } else if (shape === "I" || shape === "C" || shape === "Box") {
      const height = pDepth - pTflange - pBflange;
      const height_2 = height / 2;
      const base = new Mesh(
        new BoxBufferGeometry(pThickness, height, length),
        material
      );
      base.rotateY(-deg90InRad);
      if (shape === "C") {
        base.position.setZ(-pWidth_2 + pThickness_2);
      }
      if (shape === "Box") {
        const base2 = base.clone();
        base.position.setZ(-pWidth_2 + pThickness_2);
        base2.position.setZ(pWidth_2 - pThickness_2);
        mesh.add(base2);
      }
      const topFlange = new Mesh(
        new BoxBufferGeometry(pWidth, pTflange, length),
        material
      );
      topFlange.position.setY(height_2 + pTflange_2);
      topFlange.rotateY(-deg90InRad);
      const bottomFlange = new Mesh(
        new BoxBufferGeometry(pWidth, pBflange, length),
        material
      );
      bottomFlange.position.setY(-height_2 - pBflange_2);
      bottomFlange.rotateY(-deg90InRad);
      mesh.userData = {
        height: d_global,
        width: bf_global,
      };
      return mesh.add(base, topFlange, bottomFlange);
    } else if (shape === "L" || type === "ANGLE") {
      const width = MMtoM(profile.b_global ?? 0);
      const thickness = MMtoM(profile.t_global ?? 0);
      const thickness_2 = thickness / 2;
      const height = pDepth - thickness;
      const base = new Mesh(
        new BoxBufferGeometry(thickness + t, height, length),
        material
      );
      base.rotateY(-deg90InRad);
      base.position.setZ(width / 2 + thickness_2);
      const topFlange = new Mesh(
        new BoxBufferGeometry(width + t, thickness + t, length),
        material
      );
      topFlange.rotateY(-deg90InRad);
      topFlange.position.setY(height / 2 + thickness_2 - t / 2);
      const group = new Group();
      group.add(base, topFlange);
      group.rotateX(-defRX);
      group.name = "Group";
      mesh.userData = {
        height: d_global,
        width: MMtoM(profile.b_global ?? 0),
      };
      return mesh.add(group);
    } else if (
      shape === "O" ||
      shape === "PIPE" ||
      shape === "OC PIPES" ||
      shape === "HSS ROUND" ||
      shape === "TUBE"
    ) {
      const t_g = MMtoM(profile?.t_global ?? 10) + t;
      const arcShape = new Shape();
      arcShape.absarc(0, 0, pDepth_2, 0, deg360InRad, false);
      const holePath = new Path();
      holePath.absarc(0, 0, pDepth_2 - t_g, 0, deg360InRad, true);
      arcShape.holes.push(holePath);
      const pipe = new Mesh(
        new ExtrudeBufferGeometry(arcShape, {
          steps: 1,
          bevelEnabled: false,
          curveSegments: 32,
          depth: length,
        }),
        material
      );
      pipe.rotateY(deg90InRad);
      pipe.position.x = -length / 2;
      mesh.userData = {
        height: d_global,
        width: d_global,
      };
      return mesh.add(pipe);
    }
  }

  const pipe = new Mesh(
    new CylinderBufferGeometry(pDepth_2, pDepth_2, length, 32),
    material
  );
  pipe.rotateZ(-deg90InRad);
  return mesh.add(pipe);
}
