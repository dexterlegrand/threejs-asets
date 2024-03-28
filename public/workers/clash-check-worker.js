importScripts("three.js");

const rad = Math.PI / 180;
const angleInRad = degToRad(360 / 8);
const deg30InRad = Math.PI / 6;
const deg45InRad = Math.PI / 4;
const deg90InRad = Math.PI / 2;
const deg180InRad = Math.PI;
const deg360InRad = Math.PI * 2;

self.onmessage = (e) => {
  const { project, process } = e.data;
  const elements = defineClashElements(project, process);
  const clashes = getClashes(elements);
  self.postMessage(clashes);
};

function getClashes(elements) {
  const clashes = [];
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

function checkClash(elA, elB) {
  const v = elA.e
    .clone()
    .sub(elA.s)
    .normalize();
  const mesh = getMesh(elB);
  if (!mesh) return;
  if (
    elB.type === "BEAM" ||
    elB.type === "CANTILEVER" ||
    elB.type === "HORIZONTAL-BRACING"
  ) {
    fixElevationOfBeamElement(elB, mesh, mesh.position);
  }
  mesh.geometry.computeBoundingSphere();
  mesh.geometry.computeBoundingBox();
  mesh.updateMatrixWorld();
  const length = elA.s.distanceTo(elA.e);

  if (elA.profile) {
    const vectors = getProfileShape(elA);
    for (const vect of vectors) {
      const raycaster = new THREE.Raycaster(vect, v, 0, length);
      const intersects = raycaster.intersectObject(mesh);
      if (intersects.length) return intersects[0]?.point;
    }
  } else if (elA.pipeProfile) {
    const raycaster = new THREE.Raycaster(elA.s, v, 0, length);
    const intersects = raycaster.intersectObject(mesh);
    if (intersects.length) {
      return intersects[0]?.point;
    }
    const r = MMtoM(elA.pipeProfile.outside_diameter_global) / 2;
    const rotation = getMeshRotation(elA.s, elA.e);
    const sideV = new THREE.Vector3(0, 0, r);
    for (let i = 0; i < 8; i++) {
      const from = sideV.clone();
      from.applyAxisAngle(new THREE.Vector3(1), angleInRad * i);
      from.applyEuler(rotation);
      from.add(elA.s);
      const raycaster = new THREE.Raycaster(from, v, 0, length);
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
      const raycaster = new THREE.Raycaster(from, dir, 0, from.distanceTo(to));
      const intersects = raycaster.intersectObject(mesh);
      if (intersects.length) return intersects[0]?.point;
    }
  } else if (elA.equipment) {
    const meshA = getMesh(elA);
    if (!meshA) return;
    const vectors = meshA.geometry.vertices ?? [];
    for (const vect of vectors) {
      const dir = elA.s
        .clone()
        .sub(vect)
        .normalize();
      const raycaster = new THREE.Raycaster(
        elA.s,
        dir,
        0,
        elA.s.distanceTo(vect)
      );
      const intersects = raycaster.intersectObject(mesh);
      if (intersects.length) return intersects[0]?.point;
    }
  }
}

function getMesh(el) {
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

function mergeGeometry(a, b) {
  b.updateMatrix();
  a.geometry.merge(b.geometry, b.matrix);
}

function createProfileGeometry(el) {
  const d_global = MMtoM(el.profile.d_global ?? 0);
  const bf_global = MMtoM(el.profile.bf_global ?? 0);
  const type = el.profile.type?.toUpperCase().trim();
  const shape = el.profile.shape?.toUpperCase().trim();
  const mesh = new THREE.Mesh(new THREE.Geometry());
  const pWidth = bf_global; // Z
  const pDepth = d_global; // Y
  const pTflange = MMtoM(el.profile.tf_global ?? 0);
  const pBflange = MMtoM(el.profile.tfb_global ?? el.profile.tf_global ?? 0);
  const pThickness = MMtoM(el.profile.tw_global ?? 0);

  const pWidth_2 = pWidth / 2;
  const pDepth_2 = pDepth / 2;
  const pTflange_2 = pTflange / 2;
  const pBflange_2 = pBflange / 2;
  const pThickness_2 = pThickness / 2;

  const length = el.s.distanceTo(el.e);

  let topPlate;
  let bottomPlate;
  if (el.profile.country_code === "Rolled") {
    const tpWidth = MMtoM(el.profile.tpWidth ?? 0);
    const tpThickness = MMtoM(el.profile.tpThickness ?? 0);
    if (tpWidth && tpThickness) {
      topPlate = new THREE.Mesh(
        new THREE.BoxGeometry(tpWidth, tpThickness, length)
      );
      topPlate.position.setY(tpThickness / 2);
    }
    const bpWidth = MMtoM(el.profile.bpWidth ?? 0);
    const bpThickness = MMtoM(el.profile.bpThickness ?? 0);
    if (bpWidth && bpThickness) {
      bottomPlate = new THREE.Mesh(
        new THREE.BoxGeometry(bpWidth, bpThickness, length)
      );
      bottomPlate.position.setY(bpThickness / -2);
    }
  }
  if (el.profile.country_code === "Combined") {
    const a = createProfileGeometry({
      ...el,
      profile: {
        ...el.profile,
        country_code: el.profile.CSLibrary,
      },
    });
    a.name = "Combined";
    const b = createProfileGeometry({
      ...el,
      profile: {
        ...el.profile,
        country_code: el.profile.CSLibrary,
      },
    });
    b.name = "Combined";
    const gap = MMtoM(el.profile.gap);
    const gap_2 = gap / 2;
    if (el.profile.combination === "B/B Depth") {
      if (shape === "C") {
        a.position.setZ(-(pWidth_2 + gap_2));
        a.rotateY(deg180InRad);
        b.position.setZ(pWidth_2 + gap_2);
      } else if (shape === "L") {
        const width = MMtoM(el.profile.b_global ?? 0) / 2;
        a.position.setZ(-(width + gap_2));
        b.position.setZ(width + gap_2);
        b.rotateY(deg180InRad);
        a.rotateZ(deg180InRad);
        b.rotateZ(deg180InRad);
      }
    } else if (el.profile.combination === "B/B Width") {
      if (shape === "L") {
        a.position.setZ(-(pDepth_2 + gap_2));
        b.position.setZ(pDepth_2 + gap_2);
        a.rotateY(deg180InRad);
        a.rotateX(-deg90InRad);
        b.rotateX(-deg90InRad);
      }
    } else if (el.profile.combination === "F/F Depth") {
      if (shape === "C") {
        a.position.setZ(-(pWidth_2 + gap_2));
        b.position.setZ(pWidth_2 + gap_2);
        b.rotateY(deg180InRad);
      }
    } else if (el.profile.combination === "Star") {
      if (shape === "L") {
        const width = MMtoM(el.profile.b_global ?? 0) / 2;
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
    const base = new THREE.Mesh(
      new THREE.BoxGeometry(pThickness, height, length)
    );
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
    const topFlange = new THREE.Mesh(
      new THREE.BoxGeometry(pWidth, pTflange, length)
    );
    topFlange.position.setY(height_2 + pTflange_2);
    topFlange.rotateY(-deg90InRad);
    if (topPlate) {
      topPlate.position.setY(topPlate.position.y + pTflange_2);
      topFlange.add(topPlate);
    }
    const bottomFlange = new THREE.Mesh(
      new THREE.BoxGeometry(pWidth, pBflange, length)
    );
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
    const width = MMtoM(el.profile.b_global ?? 0);
    const thickness = MMtoM(el.profile.t_global ?? 0);
    const thickness_2 = thickness / 2;
    const height = pDepth - thickness;
    const base = new THREE.Mesh(
      new THREE.BoxGeometry(thickness, height, length)
    );
    base.rotateY(-deg90InRad);
    base.position.setZ(width / 2 + thickness_2);
    const topFlange = new THREE.Mesh(
      new THREE.BoxGeometry(width, thickness, length)
    );
    topFlange.rotateY(-deg90InRad);
    topFlange.position.setY(height / 2 + thickness_2);
    const group = new THREE.Mesh(new THREE.Geometry());
    mergeGeometry(group, base);
    mergeGeometry(group, topFlange);
    group.rotateX(-getDefaultRotation(el.profile));
    mergeGeometry(mesh, group);
    mesh.userData = {
      height: d_global,
      width: MMtoM(el.profile.b_global ?? 0),
    };
  } else if (
    shape === "O" ||
    shape === "PIPE" ||
    shape === "OC PIPES" ||
    shape === "HSS ROUND" ||
    shape === "TUBE"
  ) {
    const t_g = MMtoM(el.profile?.t_global ?? 10);
    const arcShape = new THREE.Shape();
    arcShape.absarc(0, 0, pDepth_2, 0, deg360InRad, false);
    const holePath = new THREE.Path();
    holePath.absarc(0, 0, pDepth_2 - t_g, 0, deg360InRad, true);
    arcShape.holes.push(holePath);
    const pipe = new THREE.Mesh(
      new THREE.ExtrudeGeometry(arcShape, {
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

function createPipeGeometry(el) {
  const mesh = new THREE.Mesh(new THREE.Geometry());
  const radius = MMtoM(el.pipeProfile.outside_diameter_global) / 2;
  const thickness = MMtoM(el.pipeProfile.wall_thickness_global);
  if (!radius) return mesh;
  const arcShape = new THREE.Shape();
  arcShape.absarc(0, 0, radius, 0, deg360InRad, false);
  if (thickness && checkRange(thickness, 0, radius)) {
    const holePath = new THREE.Path();
    holePath.absarc(0, 0, radius - thickness, 0, deg360InRad, true);
    arcShape.holes.push(holePath);
  }
  const pipe = new THREE.Mesh(
    new THREE.ExtrudeGeometry(arcShape, {
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

function createFlareSegmentGeometry(el) {
  if (!el.flareSegment) return;
  const mesh = new THREE.Mesh(new THREE.Geometry());
  const group = new THREE.Group();
  const height =
    el.flareSegment.topElevation_M - el.flareSegment.bottomElevation_M;
  const thickness = MMtoM(el.flareSegment.thickness_MM);
  const topInnerRadius = el.flareSegment.topInternalDiameter_M / 2;
  const bottomInnerRadius = el.flareSegment.bottomInternalDiameter_M / 2;
  const topOuterRadius = topInnerRadius + thickness;
  const bottomOuterRadius = bottomInnerRadius + thickness;
  createFaceMeshes(group, topOuterRadius, bottomOuterRadius, height);
  for (const child of group.children) {
    const childMesh = child;
    mergeGeometry(mesh, childMesh);
  }
  mesh.position.copy(el.s);
  return mesh;
}

function createEquipmentGeometry(el) {
  if (!el.equipment) return;
  const mesh = new THREE.Mesh(new THREE.Geometry());
  const proccessMesh = drawProcessElement(el.equipment);
  mergeGeometry(mesh, proccessMesh);
  mesh.position.copy(el.s);
  return mesh;
}

function getProfileShape(el) {
  const vectors = [new THREE.Vector3()];

  const type = el.profile.type?.toUpperCase().trim();
  const shape = el.profile.shape?.toUpperCase().trim();

  const d_global = MMtoM(el.profile.d_global ?? 0);
  const bf_global = MMtoM(el.profile.bf_global ?? 0);

  const pWidth = bf_global; // Z
  const pDepth = d_global; // Y

  const pWidth_2 = pWidth / 2;
  const pDepth_2 = pDepth / 2;

  let width = 0;
  let height = 0;

  if (shape === "I" || shape === "C" || shape === "BOX") {
    vectors.push(new THREE.Vector3(0, pDepth_2, -pWidth_2));
    vectors.push(new THREE.Vector3(0, pDepth_2, pWidth_2));
    vectors.push(new THREE.Vector3(0, -pDepth_2, pWidth_2));
    vectors.push(new THREE.Vector3(0, -pDepth_2, -pWidth_2));
    width = pWidth;
    height = pDepth;
  } else if (shape === "L" || type === "ANGLE") {
    const w = MMtoM(el.profile.b_global ?? 0) / 2;
    vectors.push(new THREE.Vector3(0, pDepth_2, -w));
    vectors.push(new THREE.Vector3(0, pDepth_2, w));
    vectors.push(new THREE.Vector3(0, -pDepth_2, -w));
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
    const sideV = new THREE.Vector3(0, 0, pDepth_2);
    for (let i = 0; i < 8; i++) {
      const from = sideV.clone();
      from.applyAxisAngle(new THREE.Vector3(1), angleInRad * i);
      vectors.push(from);
    }
  }
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

function getFlareSegmentVectors(el) {
  const vectors = [];
  if (!el.flareSegment) return vectors;
  const thickness = MMtoM(el.flareSegment.thickness_MM);
  const topOuterRadius = el.flareSegment.topInternalDiameter_M / 2 + thickness;
  const bottomOuterRadius =
    el.flareSegment.bottomInternalDiameter_M / 2 + thickness;
  const v1 = el.s.clone().add(new THREE.Vector3(0, 0, bottomOuterRadius));
  const v2 = el.e.clone().add(new THREE.Vector3(0, 0, topOuterRadius));
  const y = new THREE.Vector3(0, 1);
  for (let i = 0; i < 32; i++) {
    const from = v1.clone().applyAxisAngle(y, angleInRad);
    const to = v2.clone().applyAxisAngle(y, angleInRad);

    vectors.push({ from, to });

    v1.copy(from);
    v2.copy(to);
  }
  return vectors;
}

function defineClashElements(project, process) {
  const elements = [
    ...definePipeRackClashElements(project),
    ...defineOpenFrameClashElements(project),
    ...defineFlareClashElements(project),
    ...definePipeClashElements(project),
    ...defineProcessClashElements(project, process),
  ];

  return elements;
}

function definePipeRackClashElements(project) {
  const prs = [];

  for (const model of project.models) {
    if (model.type === "Pipe Rack") prs.push(model);
  }

  for (const nep of project.notEditableProjects ?? []) {
    for (const model of nep.models) {
      if (model.type === "Pipe Rack") prs.push(model);
    }
  }

  const elements = [];

  for (const pr of prs) {
    for (const item of pr.columns) {
      elements.push(getClashProfileElement(pr, item));
    }
    for (const item of pr.beams) {
      elements.push(getClashProfileElement(pr, item));
    }
    for (const item of pr.cantilevers) {
      elements.push(getClashProfileElement(pr, item));
    }
    for (const item of pr.hBracings) {
      const startB = getElementByName(
        [...pr.beams, ...pr.cantilevers],
        item.start
      );
      const endB = getElementByName([...pr.beams, ...pr.cantilevers], item.end);
      if (!startB || !endB) continue;
      const start = convertToVector3(startB.startPos);
      if (
        startB.direction === "X" ||
        startB.position === "Front" ||
        startB.position === "Back"
      ) {
        startB.position === "Front"
          ? start.setX(start.x - item.startOffset)
          : start.setX(start.x + item.startOffset);
      } else {
        startB.position === "Right"
          ? start.setZ(start.z + item.startOffset)
          : start.setZ(start.z - item.startOffset);
      }

      const end = convertToVector3(endB.startPos);
      if (
        endB.direction === "X" ||
        endB.position === "Front" ||
        endB.position === "Back"
      ) {
        endB.position === "Front"
          ? end.setX(end.x - item.endOffset)
          : end.setX(end.x + item.endOffset);
      } else {
        endB.position === "Right"
          ? end.setZ(end.z + item.endOffset)
          : end.setZ(end.z - item.endOffset);
      }
      elements.push(getClashProfileElement(pr, item, start, end));
    }
    for (const item of pr.vBracings) {
      elements.push(getClashProfileElement(pr, item));
    }
    for (const item of pr.pipes) {
      const element = {
        project: pr.project,
        model: pr.name,
        name: item.name,
        s: new THREE.Vector3(),
        e: new THREE.Vector3(),
        pipeProfile: item.profile,
      };
      elements.push(element);
    }
  }

  return elements;
}

function defineOpenFrameClashElements(project) {
  const ofs = [];

  for (const model of project.models) {
    if (model.type === "Open Frame" || model.type === "Factory Shed")
      ofs.push(model);
  }

  for (const nep of project.notEditableProjects ?? []) {
    for (const model of nep.models) {
      if (model.type === "Open Frame" || model.type === "Factory Shed")
        ofs.push(model);
    }
  }

  const elements = [];

  for (const of of ofs) {
    const itemToNE = (item) => {
      const start = convertToVector3(item.startPos);
      const end = convertToVector3(item.endPos);
      if (item.type === "BEAM" || item.type === "CANTILEVER") {
        fixPointsOfBeamElement(start, end, of, item, true);
        fixPointsOfBeamElement(start, end, of, item);
      }
      const element = {
        project: of.project,
        model: of.name,
        name: item.name,
        s: localToGlobal(convertToVector3(of.startPos), start, of.direction),
        e: localToGlobal(convertToVector3(of.startPos), end, of.direction),
        profile: item.profile,
        type: item.type,
        orientation: item.orientation,
      };
      return element;
    };

    for (const item of of.columns) {
      elements.push(itemToNE(item));
    }
    for (const item of of.beams) {
      elements.push(itemToNE(item));
    }
    for (const item of of.cantilevers) {
      elements.push(itemToNE(item));
    }
    for (const item of of.horizontalBracings) {
      elements.push(itemToNE(item));
    }
    for (const item of of.verticalBracings) {
      elements.push(itemToNE(item));
    }
    for (const item of of.kneeBracings) {
      elements.push(itemToNE(item));
    }
    for (const item of of.staircases) {
      elements.push(itemToNE(item));
    }
    for (const item of of.pipes) {
      const element = {
        project: of.project,
        model: of.name,
        name: item.name,
        s: localToGlobal(
          convertToVector3(of.startPos),
          convertToVector3(item.startPos),
          of.direction
        ),
        e: localToGlobal(
          convertToVector3(of.startPos),
          convertToVector3(item.endPos),
          of.direction
        ),
        pipeProfile: item.profile,
      };
      elements.push(element);
    }
  }

  return elements;
}

function defineFlareClashElements(project) {
  let flares = [...(project.flares ?? [])];

  for (const nep of project.notEditableProjects ?? []) {
    flares = [...flares, ...(nep.flares ?? [])];
  }

  const elements = [];

  for (const flare of flares) {
    const position = convertToVector3(flare.position);
    for (const segment of flare.segments) {
      const element = {
        project: flare.project,
        model: flare.name,
        name: segment.name,
        s: position
          .clone()
          .add(new THREE.Vector3(0, segment.bottomElevation_M)),
        e: position.clone().add(new THREE.Vector3(0, segment.topElevation_M)),
        flareSegment: segment,
      };
      elements.push(element);
    }
  }

  return elements;
}

function definePipeClashElements(project) {
  let pipes = [...(project.freePipes ?? [])];

  for (const nep of project.notEditableProjects ?? []) {
    pipes = [...pipes, ...(nep.freePipes ?? [])];
  }

  const elements = [];

  for (const pipe of pipes) {
    const element = {
      model: pipe.line + "",
      name: pipe.pipe,
      s: new THREE.Vector3(pipe.x1, pipe.y1, pipe.z1),
      e: new THREE.Vector3(pipe.x2, pipe.y2, pipe.z2),
      // @ts-ignore
      pipeProfile: pipe.params.profile ?? {
        outside_diameter_global: pipe.params.od ?? 0,
        wall_thickness_global: pipe.params.thickness ?? 0,
      },
    };
    elements.push(element);
  }

  return elements;
}

function getClashProfileElement(model, item, start, end) {
  const element = {
    project: model.project,
    model: model.name,
    name: item.name,
    s: localToGlobal(
      convertToVector3(model.startPos),
      convertToVector3(start ?? item.startPos),
      model.direction
    ),
    e: localToGlobal(
      convertToVector3(model.startPos),
      convertToVector3(end ?? item.endPos),
      model.direction
    ),
    profile: item.profile,
  };
  return element;
}

function defineProcessClashElements(project, process) {
  const elements = [];
  if (!process) return elements;
  for (const el of Array.from(process.elements.values())) {
    const positon = convertToVector3(el.position);
    const element = {
      project: project.name,
      model: el.name,
      name: el.name,
      s: positon.clone(),
      e: positon.clone(),
      equipment: el,
    };
    elements.push(element);
  }
  return elements;
}

function degToRad(deg) {
  return deg * rad;
}

function MMtoM(millimeters) {
  return millimeters / 1000;
}

function checkRange(value, from, to, isEqualFrom, isEqualTo, isNegative) {
  const checkFrom = isEqualFrom ? value >= from : value > from;
  const checkTo = isEqualTo ? value <= to : value < to;
  if (isNegative) {
    const checkFromN = isEqualFrom ? value <= from : value < from;
    const checkToN = isEqualTo ? value >= to : value > to;
    return (checkFrom && checkTo) || (checkFromN && checkToN);
  }
  return checkFrom && checkTo;
}

function getDefaultRotation(profile) {
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

function getLRotation(h, b, t) {
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

function fixElevationOfBeamElement(item, mesh, pos) {
  const width = mesh.userData.width ?? 0;
  const height = mesh.userData.height ?? width;
  switch (item.orientation) {
    case 0:
    case 180:
      pos.setY(pos.y - height / 2);
      break;
    case 90:
    case 270:
      pos.setY(pos.y - width / 2);
      break;
    default: {
      const a = width + height;
      const b = Math.sqrt(2 * Math.pow(a, 2)) / 2;
      const offset = Math.sqrt(Math.pow(a, 2) - Math.pow(b, 2)) / 2;
      pos.setY(pos.y - offset);
    }
  }
}

function getMeshRotation(s, e) {
  const obj = new THREE.Object3D();
  obj.position.copy(s);
  obj.lookAt(e);
  obj.rotateY(-deg90InRad);
  return obj.rotation;
}

function createFaceMeshes(group, topR, bottomR, height) {
  const count = 32;
  const angleInRad = degToRad(360 / count);
  const v1 = new THREE.Vector3(0, 0, bottomR);
  const v2 = new THREE.Vector3(0, 0, topR);
  const y = new THREE.Vector3(0, 1);
  for (let i = 0; i < count; i++) {
    const nv1 = v1.clone().applyAxisAngle(y, angleInRad);
    const nv2 = v2.clone().applyAxisAngle(y, angleInRad);

    const from1 = v1.clone().setY(0);
    const from2 = nv1.clone().setY(0);

    const to1 = v2.clone().setY(height);
    const to2 = nv2.clone().setY(height);

    group.add(createFaceMesh(from1, from2, to1));
    group.add(createFaceMesh(from2, to1, to2));

    v1.copy(nv1);
    v2.copy(nv2);
  }
}

function createFaceMesh(v1, v2, v3) {
  const g = new THREE.Geometry();
  g.vertices.push(v1);
  g.vertices.push(v2);
  g.vertices.push(v3);
  const f = new THREE.Face3(0, 1, 2);
  g.faces.push(f);
  g.computeFaceNormals();
  g.computeVertexNormals();
  return new THREE.Mesh(g);
}

function drawProcessElement(el) {
  const mesh = new THREE.Mesh(new THREE.Geometry());
  switch (el.type) {
    case "SOURCE":
      drawSource(mesh, el);
      break;
    case "SINK":
      drawSink(mesh, el);
      break;
    case "VALVE":
      drawValve(mesh, el);
      break;
    case "MIX":
      drawMix(mesh, el);
      break;
    case "SPLIT":
      drawSplit(mesh, el);
      break;
    case "TANK":
      drawTank(mesh, el);
      break;
    case "PUMP":
      drawPump(mesh, el);
      break;
    case "HEADER":
      drawHeader(mesh, el);
      break;
    case "DRUM":
      drawDrum(mesh, el);
      break;
    case "SEPARATOR":
      drawSeparator(mesh, el);
      break;
    case "HORIZONTAL_DRUM":
      drawHorizontalDrum(mesh, el);
      break;
    case "DISTILLATION_COLUMN":
      drawColumn(mesh, el);
      break;
    case "EXTRACTOR":
      drawExtractor(mesh, el);
      break;
    case "EXPANDER":
      drawExpander(mesh, el);
      break;
    case "COMPRESSOR":
      drawCompressor(mesh, el);
      break;
    case "PSV":
      drawPSV(mesh, el);
      break;
    case "ENLARGER":
      drawEnlarger(mesh, el);
      break;
    case "PFR":
      drawPFR(mesh, el);
      break;
    case "CSTR":
      drawCSTR(mesh, el);
      break;
    case "RE":
      drawReactor(mesh, el);
      break;
    case "RC":
      drawReactor(mesh, el);
      break;
    case "RG":
      drawReactor(mesh, el);
      break;
    case "ST_HE_1P":
      drawSTHE1P(mesh, el);
      break;
    case "ST_HE_2P":
      drawSTHE2P(mesh, el);
      break;
    case "HEATER":
      drawHeater(mesh, el);
      break;
    case "COOLER":
      drawCooler(mesh, el);
      break;
    case "ABSORPTION_COLUMN":
      drawAbsorptionColumn(mesh, el);
      break;
    case "COLUMN":
      drawSimpleColumn(mesh, el);
      break;
    case "AIRPHIN_COOLER":
      drawAirphinCooler(mesh, el);
      break;
    case "SKID":
      drawSkid(mesh, el);
      break;
    case "OTHER":
      drawSkid(mesh, el);
      break;
  }
  mesh.name = el.name;
  el.position && mesh.position.set(el.position.x, el.position.y, el.position.z);
  mesh.rotateX(degToRad(el.rotationX ?? 0));
  mesh.rotateY(degToRad(el.rotation));
  mesh.rotateZ(degToRad(el.rotationZ ?? 0));
  mesh.userData = { ...el, isProcessItem: true };
  return mesh;
}

function drawSource(mesh, el) {
  const l = el.scale;
  const l_3 = l / 3;
  const l_2 = l / 2;
  const l_1 = l / 10;
  const l_6 = l_3 / 2;

  const meshA = new THREE.Mesh(
    new THREE.CylinderGeometry(l_1, l_1, l_3, 32, 1)
  );
  meshA.position.setX(-l_2 + l_6);
  meshA.rotateZ(-deg90InRad);
  meshA.updateMatrix();

  mesh.geometry.merge(meshA.geometry, meshA.matrix);

  const meshB = new THREE.Mesh(new THREE.ConeGeometry(l_1 * 2, l_3, 32, 1));
  meshB.rotateZ(-deg90InRad);
  meshB.updateMatrix();

  mesh.geometry.merge(meshB.geometry, meshB.matrix);
}

function drawSink(mesh, el) {
  const l = el.scale;
  const l_3 = l / 3;
  const l_2 = l / 2;
  const l_1 = l / 10;
  const l_6 = l_3 / 2;

  const meshA = new THREE.Mesh(
    new THREE.CylinderGeometry(l_1, l_1, l_3, 32, 1)
  );
  meshA.rotateZ(-deg90InRad);
  meshA.updateMatrix();

  mesh.geometry.merge(meshA.geometry, meshA.matrix);

  const meshB = new THREE.Mesh(new THREE.ConeGeometry(l_1 * 2, l_3, 32, 1));
  meshB.position.setX(l_2 - l_6);
  meshB.rotateZ(-deg90InRad);
  meshB.updateMatrix();

  mesh.geometry.merge(meshB.geometry, meshB.matrix);
}

function drawValve(mesh, el) {
  const l = el.scale;
  const l_2 = l / 2;
  const l_4 = l_2 / 2;
  const l_1 = l / 10;
  const l_1_2 = l_1 / 2;

  const meshA = new THREE.Mesh(new THREE.ConeGeometry(l_1 * 2, l_4, 32, 1));
  const meshB = meshA.clone();

  switch (el.parameters?.type) {
    case "Three-Way Valve":
      {
        const meshAa = meshA.clone();
        meshAa.position.setZ(l_4 / 2);
        meshAa.rotateX(-deg90InRad);
        meshAa.updateMatrix();
        mesh.geometry.merge(meshAa.geometry, meshAa.matrix);
      }
      break;
    case "Four-Way Valve":
      {
        const meshAa = meshA.clone();
        meshAa.position.setZ(l_4 / 2);
        meshAa.rotateX(-deg90InRad);
        meshAa.updateMatrix();
        mesh.geometry.merge(meshAa.geometry, meshAa.matrix);
        const meshAb = meshA.clone();
        meshAb.position.setZ(-l_4 / 2);
        meshAb.rotateX(deg90InRad);
        meshAb.updateMatrix();
        mesh.geometry.merge(meshAb.geometry, meshAb.matrix);
      }
      break;
  }

  switch (el.parameters?.type) {
    case "Left Angle Valve":
      meshB.position.setZ(-l_4 / 2);
      meshB.rotateX(deg90InRad);
      break;
    case "Right Angle Valve":
      meshB.position.setZ(l_4 / 2);
      meshB.rotateX(-deg90InRad);
      break;
    case "Up Angle Valve":
      meshB.position.setY(l_4 / 2);
      meshB.rotateZ(deg180InRad);
      break;
    case "Down Angle Valve":
      meshB.position.setY(-l_4 / 2);
      break;
    default:
      meshB.position.setX(l_4 / 2);
      meshB.rotateZ(deg90InRad);
      break;
  }

  meshA.position.setX(-l_4 / 2);
  meshA.rotateZ(-deg90InRad);

  const meshC = new THREE.Mesh(
    new THREE.CylinderGeometry(l_1, l_1, l_4, 32, 1)
  );
  meshC.position.setY(l_4 / 2);

  const meshD = new THREE.Mesh(
    new THREE.CylinderGeometry(l_1 * 2, l_1 * 2, l_1_2, 32, 1)
  );
  meshD.position.setY(l_4 - l_1_2 / 2);

  meshA.updateMatrix();
  meshB.updateMatrix();
  meshC.updateMatrix();
  meshD.updateMatrix();

  mesh.geometry.merge(meshA.geometry, meshA.matrix);
  mesh.geometry.merge(meshB.geometry, meshB.matrix);
  mesh.geometry.merge(meshC.geometry, meshC.matrix);
  mesh.geometry.merge(meshD.geometry, meshD.matrix);
}

function drawMix(mesh, el) {
  const l = el.scale;
  const l_3 = l / 3;

  const meshA = new THREE.Mesh(new THREE.ConeGeometry(l_3, l_3, 32, 1));
  meshA.rotateZ(-deg90InRad);

  meshA.updateMatrix();

  mesh.geometry.merge(meshA.geometry, meshA.matrix);
}

function drawSplit(mesh, el) {
  const l = el.scale;
  const l_3 = l / 3;

  const meshA = new THREE.Mesh(new THREE.ConeGeometry(l_3, l_3, 32, 1));
  meshA.rotateZ(deg90InRad);

  meshA.updateMatrix();

  mesh.geometry.merge(meshA.geometry, meshA.matrix);
}

function drawTank(mesh, el) {
  const r = el.scale / 2;

  const meshA = new THREE.Mesh(new THREE.CylinderGeometry(r, r, r, 32, 1));
  const meshB = new THREE.Mesh(new THREE.SphereGeometry(r, 32, 32));
  meshB.position.setY(r / 2);

  meshA.updateMatrix();
  meshB.updateMatrix();

  mesh.geometry.merge(meshA.geometry, meshA.matrix);
  mesh.geometry.merge(meshB.geometry, meshB.matrix);
}

function drawPump(mesh, el) {
  const l_1 = el.scale / 10;
  const l_2 = el.scale / 2;
  const l_4 = l_2 / 2;
  const l_8 = l_4 / 2;

  const meshA = new THREE.Mesh(
    new THREE.CylinderGeometry(l_4, l_4, l_4, 32, 1)
  );
  meshA.rotateX(deg90InRad);
  const meshB = createElbow(l_1, l_8);
  meshB.position.setZ(l_4);
  const meshC = createPipeMesh(l_1, l_1 / 10, l_4 + l_8);

  meshC.position.setY(l_4 - l_1);
  meshC.rotateY(deg90InRad);

  meshA.updateMatrix();
  meshB.updateMatrix();
  meshC.updateMatrix();

  mesh.geometry.merge(meshA.geometry, meshA.matrix);
  mesh.geometry.merge(meshB.geometry, meshB.matrix);
  mesh.geometry.merge(meshC.geometry, meshC.matrix);
}

function drawHeader(mesh, el) {
  const l = el.scale;
  const l_1 = l / 10;
  const l_3 = l / 3;

  const meshA = createPipeMesh(l_1 * 2, l_1 / 10, l_3 * 2);
  meshA.position.setX(-l_3);
  meshA.lookAt(new THREE.Vector3(l_3));

  meshA.updateMatrix();

  mesh.geometry.merge(meshA.geometry, meshA.matrix);
}

function drawDrum(mesh, el) {
  const r = el.scale / 2;
  const r_2 = r / 2;

  const meshA = new THREE.Mesh(new THREE.CylinderGeometry(r, r, r, 32, 1));
  const meshB = new THREE.Mesh(new THREE.SphereGeometry(r, 32, 32));
  meshB.position.setY(-r_2);
  const meshC = new THREE.Mesh(new THREE.SphereGeometry(r, 32, 32));
  meshC.position.setY(r_2);

  meshA.updateMatrix();
  meshB.updateMatrix();
  meshC.updateMatrix();

  mesh.geometry.merge(meshA.geometry, meshA.matrix);
  mesh.geometry.merge(meshB.geometry, meshB.matrix);
  mesh.geometry.merge(meshC.geometry, meshC.matrix);
}

function drawAirphinCooler(mesh, el) {
  const mesh0 = new THREE.Mesh(
    new THREE.BoxGeometry(
      el.parameters.width,
      el.parameters.height,
      el.parameters.length
    )
  );
  mesh0.updateMatrix();
  mesh.geometry.merge(mesh0.geometry, mesh0.matrix);

  const legs = el.parameters.legs;
  const l1 = legs[0];
  const l2 = legs[1];
  const l3 = legs[2];
  const l4 = legs[3];
  const w_2 = el.parameters.width / 2;
  const h_2 = el.parameters.height / 2;
  const l_2 = el.parameters.length / 2;
  if (l1) {
    const mesh1 = new THREE.Mesh(
      new THREE.BoxGeometry(l1.width, l1.height, l1.length)
    );
    mesh1.position.set(
      w_2 - l1.width / 2,
      -(l1.height / 2 + h_2),
      l_2 - l1.length / 2
    );
    mesh1.updateMatrix();
    mesh.geometry.merge(mesh1.geometry, mesh1.matrix);
  }
  if (l2) {
    const mesh2 = new THREE.Mesh(
      new THREE.BoxGeometry(l2.width, l2.height, l2.length)
    );
    mesh2.position.set(
      -(w_2 - l2.width / 2),
      -(l2.height / 2 + h_2),
      l_2 - l2.length / 2
    );
    mesh2.updateMatrix();
    mesh.geometry.merge(mesh2.geometry, mesh2.matrix);
  }
  if (l3) {
    const mesh3 = new THREE.Mesh(
      new THREE.BoxGeometry(l3.width, l3.height, l3.length)
    );
    mesh3.position.set(
      -(w_2 - l3.width / 2),
      -(l3.height / 2 + h_2),
      -(l_2 - l3.length / 2)
    );
    mesh3.updateMatrix();
    mesh.geometry.merge(mesh3.geometry, mesh3.matrix);
  }
  if (l4) {
    const mesh4 = new THREE.Mesh(
      new THREE.BoxGeometry(l4.width, l4.height, l4.length)
    );
    mesh4.position.set(
      w_2 - l4.width / 2,
      -(l4.height / 2 + h_2),
      -(l_2 - l4.length / 2)
    );
    mesh4.updateMatrix();
    mesh.geometry.merge(mesh4.geometry, mesh4.matrix);
  }
}

function drawSkid(mesh, el) {
  const mesh0 = new THREE.Mesh(
    new THREE.BoxGeometry(
      el.parameters.width,
      el.parameters.height,
      el.parameters.length
    )
  );
  mesh0.updateMatrix();
  mesh.geometry.merge(mesh0.geometry, mesh0.matrix);
}

function drawSeparator(mesh, el) {
  const length = el.parameters.length ?? el.scale;
  const diameter = MMtoM(el.parameters.diameter ?? 0) || el.scale / 2;

  const d_2 = diameter / 2;

  const meshA = new THREE.Mesh(
    new THREE.CylinderGeometry(d_2, d_2, length - diameter, 32, 1)
  );
  meshA.rotateZ(deg90InRad);
  const meshB = new THREE.Mesh(new THREE.SphereGeometry(d_2, 32, 32));
  meshB.position.setX(-(length - diameter) / 2);
  const meshC = new THREE.Mesh(new THREE.SphereGeometry(d_2, 32, 32));
  meshC.position.setX((length - diameter) / 2);
  const meshD = createPipeMesh(d_2 / 2, 0.005, d_2 * 1.5);
  meshD.position.setX((length - diameter) / 2);
  meshD.rotateX(deg90InRad);

  meshA.updateMatrix();
  meshB.updateMatrix();
  meshC.updateMatrix();
  meshD.updateMatrix();

  mesh.geometry.merge(meshA.geometry, meshA.matrix);
  mesh.geometry.merge(meshB.geometry, meshB.matrix);
  mesh.geometry.merge(meshC.geometry, meshC.matrix);
  mesh.geometry.merge(meshD.geometry, meshD.matrix);
}

function drawHorizontalDrum(mesh, el) {
  const length = el.parameters.length ?? el.scale;
  const diameter = MMtoM(el.parameters.diameter ?? 0) || el.scale / 2;

  const d_2 = diameter / 2;

  const l_2 = length - diameter;
  const l_4 = l_2 / 2;

  const meshA = new THREE.Mesh(
    new THREE.CylinderGeometry(d_2, d_2, l_2, 32, 1)
  );
  meshA.rotateZ(deg90InRad);
  const meshB = new THREE.Mesh(new THREE.SphereGeometry(d_2, 32, 32));
  meshB.position.setX(-l_4);
  const meshC = new THREE.Mesh(new THREE.SphereGeometry(d_2, 32, 32));
  meshC.position.setX(l_4);

  meshA.updateMatrix();
  meshB.updateMatrix();
  meshC.updateMatrix();

  mesh.geometry.merge(meshA.geometry, meshA.matrix);
  mesh.geometry.merge(meshB.geometry, meshB.matrix);
  mesh.geometry.merge(meshC.geometry, meshC.matrix);
}

function drawColumn(mesh, el) {
  const height = MMtoM(el.parameters.height ?? 0) || el.scale;
  const diameter = MMtoM(el.parameters.diameter ?? 0) || el.scale / 4;

  const d_2 = diameter / 2;

  const l_2 = height - diameter;
  const l_4 = l_2 / 2;
  const l_5 = l_2 / 2.5;
  const l_1 = l_5 / 2;

  const meshA = new THREE.Mesh(
    new THREE.CylinderGeometry(d_2, d_2, l_2, 32, 1)
  );
  const meshB = new THREE.Mesh(new THREE.SphereGeometry(d_2, 32, 32));
  meshB.position.setY(-l_4);
  const meshC = new THREE.Mesh(new THREE.SphereGeometry(d_2, 32, 32));
  meshC.position.setY(l_4);
  const meshD = createPipeMesh(d_2 / 4, 0.005, d_2);
  meshD.position.set(d_2 * 1.5, l_4 + d_2 * 1.5, 0);
  meshD.lookAt(new THREE.Vector3(0, l_4 + d_2 * 1.5));
  const meshF = meshD.clone();
  meshF.position.setY(-(l_4 + d_2 * 1.5));

  const meshEa = new THREE.Mesh(
    new THREE.CircleGeometry(d_2 + 0.01, 32, 0, deg180InRad)
  );
  meshEa.position.setY(l_4 - l_1 / 2);
  meshEa.rotateX(deg90InRad);
  const meshEb = meshEa.clone();
  meshEb.position.setY(meshEa.position.y - l_1);
  meshEb.rotateX(deg180InRad);
  const meshEc = meshEa.clone();
  meshEc.position.setY(meshEb.position.y - l_1);
  const meshEd = meshEa.clone();
  meshEd.position.setY(meshEc.position.y - l_1);
  meshEd.rotateX(deg180InRad);

  meshA.updateMatrix();
  meshB.updateMatrix();
  meshC.updateMatrix();
  meshD.updateMatrix();
  meshF.updateMatrix();
  meshEa.updateMatrix();
  meshEb.updateMatrix();
  meshEc.updateMatrix();
  meshEd.updateMatrix();

  mesh.geometry.merge(meshA.geometry, meshA.matrix);
  mesh.geometry.merge(meshB.geometry, meshB.matrix);
  mesh.geometry.merge(meshC.geometry, meshC.matrix);
  mesh.geometry.merge(meshD.geometry, meshD.matrix);
  mesh.geometry.merge(meshF.geometry, meshF.matrix);
  mesh.geometry.merge(meshEa.geometry, meshEa.matrix);
  mesh.geometry.merge(meshEb.geometry, meshEb.matrix);
  mesh.geometry.merge(meshEc.geometry, meshEc.matrix);
  mesh.geometry.merge(meshEd.geometry, meshEd.matrix);

  const square = (tl, br) => {
    const lineCa = createBoldLine(
      new THREE.Vector3(tl.x, tl.y),
      new THREE.Vector3(br.x, tl.y)
    );
    const lineCb = createBoldLine(
      new THREE.Vector3(br.x, tl.y),
      new THREE.Vector3(br.x, br.y)
    );
    const lineCc = createBoldLine(
      new THREE.Vector3(br.x, br.y),
      new THREE.Vector3(tl.x, br.y)
    );
    const lineCd = createBoldLine(
      new THREE.Vector3(tl.x, br.y),
      new THREE.Vector3(tl.x, tl.y)
    );
    lineCa && mesh.add(lineCa);
    lineCb && mesh.add(lineCb);
    lineCc && mesh.add(lineCc);
    lineCd && mesh.add(lineCd);
  };

  square(
    new THREE.Vector3(0, l_4 + d_2 * 1.5),
    new THREE.Vector3(d_2 * 1.5, l_4)
  );
  square(
    new THREE.Vector3(0, -l_4),
    new THREE.Vector3(d_2 * 1.5, -(l_4 + d_2 * 1.5))
  );
}

function drawExtractor(mesh, el) {
  const l = el.scale;
  const l_2 = l / 2;
  const l_3 = l / 3;
  const l_4 = l_2 / 2;
  const l_6 = l_3 / 2;

  const meshA = new THREE.Mesh(new THREE.CylinderGeometry(l_6, l_6, l, 32, 1));

  const meshBa = new THREE.Mesh(new THREE.CircleGeometry(l_6 + 0.01, 32));
  meshBa.position.setY(l_2 - l_4);
  meshBa.rotateX(deg90InRad);
  const meshBb = meshBa.clone();
  meshBb.position.setY(meshBa.position.y - l_4);
  const meshBc = meshBa.clone();
  meshBc.position.setY(meshBb.position.y - l_4);

  meshA.updateMatrix();
  meshBa.updateMatrix();
  meshBb.updateMatrix();
  meshBc.updateMatrix();

  mesh.geometry.merge(meshA.geometry, meshA.matrix);
  mesh.geometry.merge(meshBa.geometry, meshBa.matrix);
  mesh.geometry.merge(meshBb.geometry, meshBb.matrix);
  mesh.geometry.merge(meshBc.geometry, meshBc.matrix);
}

function drawExpander(mesh, el) {
  const l = el.scale;
  const l_3 = l / 3;
  const l_6 = l_3 / 2;

  const meshA = new THREE.Mesh(
    new THREE.CylinderGeometry(l_6, l_3, l_3, 32, 1)
  );
  meshA.rotateZ(deg90InRad);

  meshA.updateMatrix();

  mesh.geometry.merge(meshA.geometry, meshA.matrix);
}

function drawCompressor(mesh, el) {
  const l = el.scale;
  const l_3 = l / 3;
  const l_6 = l_3 / 2;

  const meshA = new THREE.Mesh(
    new THREE.CylinderGeometry(l_6, l_3, l_3, 32, 1)
  );
  meshA.rotateZ(-deg90InRad);

  meshA.updateMatrix();

  mesh.geometry.merge(meshA.geometry, meshA.matrix);
}

function drawPSV(mesh, el) {
  const l = el.scale;
  const l_1 = l / 10;
  const l_3 = l / 3;
  const l_6 = l_3 / 2;

  const meshA = new THREE.Mesh(new THREE.ConeGeometry(l_6, l_3, 32, 1));
  meshA.position.setY(-l_6);
  const meshB = new THREE.Mesh(new THREE.ConeGeometry(l_6, l_3, 32, 1));
  meshB.position.setX(l_6);
  meshB.rotateZ(deg90InRad);

  const curve = new THREE.CubicBezierCurve3(
    new THREE.Vector3(0, 0),
    new THREE.Vector3(-l_3, l_3 / 3),
    new THREE.Vector3(l_3, (l_3 / 3) * 2),
    new THREE.Vector3(0, l_3)
  );

  const meshCa = new THREE.Mesh(new THREE.TubeGeometry(curve, 32, 0.005, 32));
  const meshCb = meshCa.clone();
  meshCb.position.setZ(-l_1);
  const meshCc = meshCa.clone();
  meshCc.position.setZ(l_1);

  meshA.updateMatrix();
  meshB.updateMatrix();
  meshCa.updateMatrix();
  meshCb.updateMatrix();
  meshCc.updateMatrix();

  mesh.geometry.merge(meshA.geometry, meshA.matrix);
  mesh.geometry.merge(meshB.geometry, meshB.matrix);
  mesh.geometry.merge(meshCa.geometry, meshCa.matrix);
  mesh.geometry.merge(meshCb.geometry, meshCb.matrix);
  mesh.geometry.merge(meshCc.geometry, meshCc.matrix);
}

function drawEnlarger(mesh, el) {
  const l = el.scale;
  const l_1 = l / 10;
  const l_1x3 = l_1 * 3;
  const l_1x3_2 = l_1x3 / 2;

  const meshA = createPipeMesh(l_1 / 2, 0.005, l_1x3_2);
  meshA.position.setX(-l_1x3);
  meshA.lookAt(new THREE.Vector3());
  const meshB = new THREE.Mesh(
    new THREE.CylinderGeometry(l_1 / 2, l_1, l_1x3_2, 32, 1, true)
  );
  meshB.position.setX(-l_1x3_2 / 2);
  meshB.rotateZ(deg90InRad);
  const meshC = createPipeMesh(l_1, 0.005, l_1x3);
  meshC.lookAt(new THREE.Vector3(l_1x3));

  meshA.updateMatrix();
  meshB.updateMatrix();
  meshC.updateMatrix();

  mesh.geometry.merge(meshA.geometry, meshA.matrix);
  mesh.geometry.merge(meshB.geometry, meshB.matrix);
  mesh.geometry.merge(meshC.geometry, meshC.matrix);
}

function drawPFR(mesh, el) {
  const l = el.scale;
  const l_1 = l / 10;
  const l_2 = l / 2;
  const l_4 = l_2 / 2;

  const meshA = createPipeMesh(l_1 / 2, 0.005, l);
  meshA.position.setX(-l_2);
  meshA.lookAt(new THREE.Vector3());
  const meshB = new THREE.Mesh(
    new THREE.CylinderGeometry(l_1, l_1, l_2, 32, 1)
  );
  meshB.rotateZ(deg90InRad);
  const meshC = new THREE.Mesh(new THREE.SphereGeometry(l_1, 32, 32));
  meshC.position.setX(-l_4);
  const meshD = meshC.clone();
  meshD.position.setX(l_4);

  meshA.updateMatrix();
  meshB.updateMatrix();
  meshC.updateMatrix();
  meshD.updateMatrix();

  mesh.geometry.merge(meshA.geometry, meshA.matrix);
  mesh.geometry.merge(meshB.geometry, meshB.matrix);
  mesh.geometry.merge(meshC.geometry, meshC.matrix);
  mesh.geometry.merge(meshD.geometry, meshD.matrix);

  const delta = l_2 / 10;
  const delta2 = delta / 8;

  const meshE = createPipeMesh(delta / 2, delta2, delta);
  const meshF = meshE.clone();
  meshE.position.set(-l_4, l_1, 0);
  meshE.lookAt(new THREE.Vector3(-l, l_1));
  meshF.position.set(l_4, l_1, 0);
  meshF.lookAt(new THREE.Vector3(l, l_1));
  const sphere = new THREE.Mesh(new THREE.SphereGeometry(delta / 2));
  meshE.add(sphere);
  meshF.add(sphere.clone());

  mesh.add(meshE, meshF);

  for (let x = -l_4; x < l_4; x += delta) {
    const v1 = new THREE.Vector3(x, l_1);
    const v2 = new THREE.Vector3(x + delta2, l_1, l_1);
    const v3 = new THREE.Vector3(x + delta2 * 2, 0, l_1);
    const v4 = new THREE.Vector3(x + delta2 * 3, -l_1, l_1);
    const v5 = new THREE.Vector3(x + delta2 * 4, -l_1);
    const v6 = new THREE.Vector3(x + delta2 * 5, -l_1, -l_1);
    const v7 = new THREE.Vector3(x + delta2 * 6, 0, -l_1);
    const v8 = new THREE.Vector3(x + delta2 * 7, l_1, -l_1);
    const v9 = new THREE.Vector3(x + delta2 * 8, l_1);
    const curve1 = new THREE.QuadraticBezierCurve3(v1, v2, v3);
    const curve2 = new THREE.QuadraticBezierCurve3(v3, v4, v5);
    const curve3 = new THREE.QuadraticBezierCurve3(v5, v6, v7);
    const curve4 = new THREE.QuadraticBezierCurve3(v7, v8, v9);
    const mesh1 = new THREE.Mesh(
      new THREE.TubeGeometry(curve1, 8, delta / 2, 8)
    );
    const mesh2 = new THREE.Mesh(
      new THREE.TubeGeometry(curve2, 8, delta / 2, 8)
    );
    const mesh3 = new THREE.Mesh(
      new THREE.TubeGeometry(curve3, 8, delta / 2, 8)
    );
    const mesh4 = new THREE.Mesh(
      new THREE.TubeGeometry(curve4, 8, delta / 2, 8)
    );
    mesh1.updateMatrix();
    mesh2.updateMatrix();
    mesh3.updateMatrix();
    mesh4.updateMatrix();
    mesh.geometry.merge(mesh1.geometry, mesh1.matrix);
    mesh.geometry.merge(mesh2.geometry, mesh2.matrix);
    mesh.geometry.merge(mesh3.geometry, mesh3.matrix);
    mesh.geometry.merge(mesh4.geometry, mesh4.matrix);
  }
}

function drawCSTR(mesh, el) {
  const r = el.scale / 2;
  const r_2 = r / 2;
  const r_4 = r_2 / 2;
  const l_1 = el.scale / 10;
  const l_10 = l_1 / 10;
  const h = ((Math.sqrt(3) / 2) * r_4) / 2;
  const delta = r / 10;
  const delta2 = delta / 8;

  const mesh1 = createPipeMesh(r, r_4, r);
  mesh1.position.setY(-r_2);
  mesh1.rotateX(-deg90InRad);
  const mesh2 = new THREE.Mesh(
    new THREE.SphereGeometry(r, 32, 32, undefined, deg180InRad)
  );
  mesh2.position.setY(-r_2);
  mesh2.rotateX(deg90InRad);
  const mesh3 = createPipeMesh(r_4, r_4 / 2, r_2);
  const mesh4 = mesh3.clone();
  const mesh5 = mesh3.clone();
  mesh3.position.setX(-r + r_4);
  mesh3.lookAt(new THREE.Vector3(-el.scale));
  mesh4.position.setX(r - r_4);
  mesh4.position.setY(r_2 - r_4);
  mesh4.lookAt(new THREE.Vector3(el.scale, r_2 - r_4));
  mesh5.position.setX(r - r_4);
  mesh5.position.setY(-r_2 + r_4);
  mesh5.lookAt(new THREE.Vector3(el.scale, -r_2 + r_4));

  const mesh7 = new THREE.Mesh(
    new THREE.CylinderGeometry(l_10, l_10, r_4, 8, 1)
  );
  const mesh8 = mesh7.clone();
  const mesh9 = mesh7.clone();
  const mesh10 = new THREE.Mesh(
    new THREE.CylinderGeometry(l_10, l_10, r_4 / 2, 8, 1)
  );
  const mesh11 = mesh10.clone();
  mesh7.position.setY(r_2 + r_4 / 2);
  mesh8.position.setY(r_2);
  mesh8.rotateZ(deg90InRad);
  mesh8.rotateX(deg30InRad);
  mesh9.position.setY(r_2);
  mesh9.rotateZ(deg90InRad);
  mesh9.rotateX(-deg30InRad);
  mesh10.position.setY(r_2);
  mesh10.position.setX(-h);
  mesh10.rotateX(deg90InRad);
  mesh11.position.setY(r_2);
  mesh11.position.setX(h);
  mesh11.rotateX(deg90InRad);

  mesh1.updateMatrix();
  mesh2.updateMatrix();
  mesh3.updateMatrix();
  mesh4.updateMatrix();
  mesh5.updateMatrix();
  mesh7.updateMatrix();
  mesh8.updateMatrix();
  mesh9.updateMatrix();
  mesh10.updateMatrix();
  mesh11.updateMatrix();

  mesh.geometry.merge(mesh1.geometry, mesh1.matrix);
  mesh.geometry.merge(mesh2.geometry, mesh2.matrix);
  mesh.geometry.merge(mesh3.geometry, mesh3.matrix);
  mesh.geometry.merge(mesh4.geometry, mesh4.matrix);
  mesh.geometry.merge(mesh5.geometry, mesh5.matrix);
  mesh.geometry.merge(mesh7.geometry, mesh7.matrix);
  mesh.geometry.merge(mesh8.geometry, mesh8.matrix);
  mesh.geometry.merge(mesh9.geometry, mesh9.matrix);
  mesh.geometry.merge(mesh10.geometry, mesh10.matrix);
  mesh.geometry.merge(mesh11.geometry, mesh11.matrix);

  const meshE = createPipeMesh(delta / 2, delta2, delta);
  const meshF = meshE.clone();
  meshE.position.setZ(r);
  meshF.position.setZ(-r);
  meshF.rotateY(deg180InRad);

  mesh.add(meshE, meshF);
}

function drawReactor(mesh, el) {
  const r = el.scale / 2;
  const r_2 = r / 2;
  const r_4 = r_2 / 2;
  const delta = r / 10;
  const delta2 = delta / 8;

  const mesh1 = new THREE.Mesh(new THREE.CylinderGeometry(r, r, r, 32, 1));
  const mesh2 = new THREE.Mesh(new THREE.SphereGeometry(r, 32, 32));
  mesh2.position.setY(-r_2);
  const mesh3 = mesh2.clone();
  mesh3.position.setY(r_2);
  const mesh4 = createPipeMesh(r_4, r_4 / 2, r + r_4);
  const mesh5 = mesh4.clone();
  const mesh6 = mesh4.clone();
  mesh4.lookAt(new THREE.Vector3(-r));
  mesh5.position.setY(r - r_4);
  mesh5.lookAt(new THREE.Vector3(r, r - r_4));
  mesh6.position.setY(-r + r_4);
  mesh6.lookAt(new THREE.Vector3(r, -r + r_4));

  mesh1.updateMatrix();
  mesh2.updateMatrix();
  mesh3.updateMatrix();
  mesh4.updateMatrix();
  mesh5.updateMatrix();
  mesh6.updateMatrix();

  mesh.geometry.merge(mesh1.geometry, mesh1.matrix);
  mesh.geometry.merge(mesh2.geometry, mesh2.matrix);
  mesh.geometry.merge(mesh3.geometry, mesh3.matrix);
  mesh.geometry.merge(mesh4.geometry, mesh4.matrix);
  mesh.geometry.merge(mesh5.geometry, mesh5.matrix);
  mesh.geometry.merge(mesh6.geometry, mesh6.matrix);

  const meshE = createPipeMesh(delta / 2, delta2, delta);
  const meshF = meshE.clone();
  meshE.position.setZ(r);
  meshF.position.setZ(-r);
  meshF.rotateY(deg180InRad);

  mesh.add(meshE, meshF);
}

function drawSTHE1P(mesh, el) {
  const length = el.parameters.length ?? el.scale;
  const diameter = MMtoM(el.parameters.diameter ?? 0) || el.scale / 2;

  const d_2 = diameter / 2;

  const l_2 = length / 2;
  const l_1 = l_2 / 5;
  const l_4 = l_2 / 2;
  const l_8 = l_4 / 2;

  const mesh1 = new THREE.Mesh(
    new THREE.CylinderGeometry(d_2, d_2, length - diameter, 32, 1)
  );
  mesh1.rotateZ(deg90InRad);
  const mesh2 = new THREE.Mesh(new THREE.SphereGeometry(d_2, 32, 32));
  mesh2.position.setX(-(length - diameter) / 2);
  const mesh3 = new THREE.Mesh(new THREE.SphereGeometry(d_2, 32, 32));
  mesh3.position.setX((length - diameter) / 2);
  const mesh4 = createPipeMesh(l_1 / 2, 0.005, d_2 * 1.5);
  mesh4.position.setX(l_4);
  mesh4.rotateX(deg90InRad);
  const mesh5 = mesh4.clone();
  mesh5.position.setX(-l_4);
  const mesh6 = createPipeMesh(l_1 / 4, 0.005, d_2 * 1.5);
  mesh6.position.setX(-l_8);
  mesh6.rotateX(deg90InRad);
  const mesh7 = mesh6.clone();
  mesh7.position.setX(l_4);
  mesh7.rotateX(deg180InRad);

  mesh1.updateMatrix();
  mesh2.updateMatrix();
  mesh3.updateMatrix();
  mesh4.updateMatrix();
  mesh5.updateMatrix();
  mesh6.updateMatrix();
  mesh7.updateMatrix();

  mesh.geometry.merge(mesh1.geometry, mesh1.matrix);
  mesh.geometry.merge(mesh2.geometry, mesh2.matrix);
  mesh.geometry.merge(mesh3.geometry, mesh3.matrix);
  mesh.geometry.merge(mesh4.geometry, mesh4.matrix);
  mesh.geometry.merge(mesh5.geometry, mesh5.matrix);
  mesh.geometry.merge(mesh6.geometry, mesh6.matrix);
  mesh.geometry.merge(mesh7.geometry, mesh7.matrix);
}

function drawSTHE2P(mesh, el) {
  const length = el.parameters.length ?? el.scale;
  const diameter = MMtoM(el.parameters.diameter ?? 0) || el.scale / 2;

  const d_2 = diameter / 2;

  const l_2 = length / 2;
  const l_1 = l_2 / 5;
  const l_4 = l_2 / 2;
  const l_8 = l_4 / 2;

  const mesh1 = new THREE.Mesh(
    new THREE.CylinderGeometry(d_2, d_2, length - diameter, 32, 1)
  );
  mesh1.rotateZ(deg90InRad);
  const mesh2 = new THREE.Mesh(new THREE.SphereGeometry(d_2, 32, 32));
  mesh2.position.setX(-(length - diameter) / 2);
  const mesh3 = new THREE.Mesh(new THREE.SphereGeometry(d_2, 32, 32));
  mesh3.position.setX((length - diameter) / 2);
  const mesh4 = createPipeMesh(l_1 / 2, 0.005, d_2 * 1.5);
  mesh4.position.setX(l_4);
  mesh4.rotateX(deg90InRad);
  const mesh5 = mesh4.clone();
  mesh5.rotateX(deg180InRad);
  const mesh6 = createPipeMesh(l_1 / 4, 0.005, d_2 * 1.5);
  mesh6.position.setX(-l_4);
  mesh6.rotateX(deg90InRad);
  const mesh7 = mesh6.clone();
  mesh7.position.setX(l_8);
  mesh7.rotateX(deg180InRad);

  mesh1.updateMatrix();
  mesh2.updateMatrix();
  mesh3.updateMatrix();
  mesh4.updateMatrix();
  mesh5.updateMatrix();
  mesh6.updateMatrix();
  mesh7.updateMatrix();

  mesh.geometry.merge(mesh1.geometry, mesh1.matrix);
  mesh.geometry.merge(mesh2.geometry, mesh2.matrix);
  mesh.geometry.merge(mesh3.geometry, mesh3.matrix);
  mesh.geometry.merge(mesh4.geometry, mesh4.matrix);
  mesh.geometry.merge(mesh5.geometry, mesh5.matrix);
  mesh.geometry.merge(mesh6.geometry, mesh6.matrix);
  mesh.geometry.merge(mesh7.geometry, mesh7.matrix);
}

function drawHeater(mesh, el) {
  const r = el.scale / 2;
  const r_2 = r / 2;
  const r_4 = r_2 / 2;

  const l_3 = el.scale / 3;
  const delta = r / 10;
  const delta2 = delta / 8;

  const meshA = new THREE.Mesh(
    new THREE.CylinderGeometry(r_2, r_2, r_2, 32, 1)
  );
  const meshB = new THREE.Mesh(new THREE.SphereGeometry(r_2, 32, 32));
  meshB.position.setY(-r_4);
  const meshC = meshB.clone();
  meshC.position.setY(r_4);
  const meshD = createPipeMesh(r_4 / 2, r_4 / 4, r + r_4);
  meshD.position.setX(-(r + r_4) / 2);
  meshD.lookAt(new THREE.Vector3());

  meshA.updateMatrix();
  meshB.updateMatrix();
  meshC.updateMatrix();
  meshD.updateMatrix();

  mesh.geometry.merge(meshA.geometry, meshA.matrix);
  mesh.geometry.merge(meshB.geometry, meshB.matrix);
  mesh.geometry.merge(meshC.geometry, meshC.matrix);
  mesh.geometry.merge(meshD.geometry, meshD.matrix);

  const meshE = createPipeMesh(delta / 2, delta2, delta);
  meshE.position.setZ(r_2);

  mesh.add(meshE);

  const curve = new THREE.CubicBezierCurve3(
    new THREE.Vector3(0),
    new THREE.Vector3(-l_3, l_3 / 3),
    new THREE.Vector3(l_3, (l_3 / 3) * 2),
    new THREE.Vector3(0, l_3)
  );

  for (let i = 0; i < 8; i++) {
    const angle = deg45InRad * i;
    const meshF = new THREE.Mesh(new THREE.TubeGeometry(curve, 32, 0.005, 32));
    meshF.scale.divideScalar(2);
    meshF.position.set(r_4, -r, 0).applyAxisAngle(new Vector3(0, 1), angle);
    meshF.rotateY(angle);
    mesh.add(meshF);
  }
}

function drawCooler(mesh, el) {
  const r = el.scale / 2;
  const r_2 = r / 2;
  const r_4 = r_2 / 2;

  const l_3 = el.scale / 3;
  const delta = r / 10;
  const delta2 = delta / 8;

  const meshA = new THREE.Mesh(
    new THREE.CylinderGeometry(r_2, r_2, r_2, 32, 1)
  );
  const meshB = new THREE.Mesh(new THREE.SphereGeometry(r_2, 32, 32));
  meshB.position.setY(-r_4);
  const meshC = meshB.clone();
  meshC.position.setY(r_4);
  const meshD = createPipeMesh(r_4 / 2, r_4 / 4, r + r_4);
  meshD.position.setX(-(r + r_4) / 2);
  meshD.lookAt(new THREE.Vector3());

  meshA.updateMatrix();
  meshB.updateMatrix();
  meshC.updateMatrix();
  meshD.updateMatrix();

  mesh.geometry.merge(meshA.geometry, meshA.matrix);
  mesh.geometry.merge(meshB.geometry, meshB.matrix);
  mesh.geometry.merge(meshC.geometry, meshC.matrix);
  mesh.geometry.merge(meshD.geometry, meshD.matrix);

  const meshE = createPipeMesh(delta / 2, delta2, delta);
  meshE.position.setZ(r_2);

  mesh.add(meshE);

  const curve = new THREE.CubicBezierCurve3(
    new THREE.Vector3(0),
    new THREE.Vector3(-l_3, l_3 / 3),
    new THREE.Vector3(l_3, (l_3 / 3) * 2),
    new THREE.Vector3(0, l_3)
  );

  for (let i = 1; i <= 3; i++) {
    const z = -r_2 + r_4 * i;
    for (let j = 1; j <= 3; j++) {
      const meshF = new THREE.Mesh(
        new THREE.TubeGeometry(curve, 32, 0.005, 32)
      );
      meshF.scale.divideScalar(2);
      meshF.position.set(-r_2 + r_4 * j, r_2 + r_4, z);
      meshF.updateMatrix();
      mesh.geometry.merge(meshF.geometry, meshF.matrix);
    }
  }
}

function drawAbsorptionColumn(mesh, el) {
  const height = MMtoM(el.parameters.height ?? 0) || el.scale;
  const diameter = MMtoM(el.parameters.diameter ?? 0) || el.scale / 4;

  const d_2 = diameter / 2;

  const meshA = new THREE.Mesh(
    new THREE.CylinderGeometry(d_2, d_2, height - diameter, 32, 1)
  );
  const meshB = new THREE.Mesh(new THREE.SphereGeometry(d_2, 32, 32));
  meshB.position.setY(-(height - diameter) / 2);
  const meshC = meshB.clone();
  meshC.position.setY((height - diameter) / 2);

  meshA.updateMatrix();
  meshB.updateMatrix();
  meshC.updateMatrix();

  mesh.geometry.merge(meshA.geometry, meshA.matrix);
  mesh.geometry.merge(meshB.geometry, meshB.matrix);
  mesh.geometry.merge(meshC.geometry, meshC.matrix);

  const line = createBoldLine(
    new THREE.Vector3(0, -height / 2 - 0.05),
    new THREE.Vector3(0, height / 2 + 0.05)
  );
  if (line) {
    line.updateMatrix();
    mesh.geometry.merge(line.geometry, line.matrix);
  }
}

function drawSimpleColumn(mesh, el) {
  const height = MMtoM(el.parameters.height ?? 0) || el.scale;
  const diameter = MMtoM(el.parameters.diameter ?? 0) || el.scale / 4;

  const d_2 = diameter / 2;

  const l_2 = height - diameter;
  const l_4 = l_2 / 2;

  const meshA = new THREE.Mesh(
    new THREE.CylinderGeometry(d_2, d_2, l_2, 32, 1)
  );
  const meshB = new THREE.Mesh(new THREE.SphereGeometry(d_2, 32, 32));
  meshB.position.setY(-l_4);
  const meshC = meshB.clone();
  meshC.position.setY(l_4);

  meshA.updateMatrix();
  meshB.updateMatrix();
  meshC.updateMatrix();

  mesh.geometry.merge(meshA.geometry, meshA.matrix);
  mesh.geometry.merge(meshB.geometry, meshB.matrix);
  mesh.geometry.merge(meshC.geometry, meshC.matrix);
}

function createBoldLine(start, end, lineType, size = 0.005) {
  const length = start.distanceTo(end);
  if (!length) return;
  const l_2 = length / 2;
  const coef = 0.2;
  const und = undefined;
  if (lineType === "Pneumatic (Air) Line") {
    const line = new THREE.Mesh(new THREE.CylinderGeometry(size, size, length));
    line.position.copy(
      start
        .clone()
        .add(end)
        .divideScalar(2)
    );
    line.lookAt(end);
    line.rotateX(deg90InRad);
    let offset = 0;
    const f = new THREE.Vector3(0, 0, -size * 3);
    const s = new THREE.Vector3(0, 0, size * 3);
    while (offset < l_2) {
      if (offset) {
        const py = offset;
        const my = -offset;
        const a = createBoldLine(
          f.clone().setY(py),
          s.clone().setY(py - 0.01),
          und,
          0.003
        );
        const b = createBoldLine(
          f.clone().setY(py + 0.01),
          s.clone().setY(py),
          und,
          0.003
        );
        const c = createBoldLine(
          f.clone().setY(my),
          s.clone().setY(my - 0.01),
          und,
          0.003
        );
        const d = createBoldLine(
          f.clone().setY(my + 0.01),
          s.clone().setY(my),
          und,
          0.003
        );
        a && line.add(a);
        b && line.add(b);
        c && line.add(c);
        d && line.add(d);
      } else {
        const a = createBoldLine(f.clone(), s.clone().setY(-0.01), und, 0.003);
        const b = createBoldLine(f.clone().setY(0.01), s.clone(), und, 0.003);
        a && line.add(a);
        b && line.add(b);
      }
      offset += coef;
    }
    return line;
  } else if (lineType === "Inert gas line") {
    const line = new THREE.Mesh(new THREE.CylinderGeometry(size, size, length));
    line.position.copy(
      start
        .clone()
        .add(end)
        .divideScalar(2)
    );
    line.lookAt(end);
    line.rotateX(deg90InRad);
    let offset = 0;
    const f = new THREE.Vector3(0, 0, -size * 3);
    const s = new THREE.Vector3(0, 0, size * 3);
    const so = 0.005;
    while (offset < l_2) {
      const py = offset;
      const my = -offset;
      const a = createBoldLine(
        f.clone().setY(py + so),
        s.clone().setY(py - so),
        und,
        0.003
      );
      const b = createBoldLine(
        f.clone().setY(my + so),
        s.clone().setY(my - so),
        und,
        0.003
      );
      a && line.add(a);
      b && line.add(b);
      offset += coef;
    }
    return line;
  } else if (lineType === "Instrument capillary") {
    const line = new THREE.Mesh(new THREE.CylinderGeometry(size, size, length));
    line.position.copy(
      start
        .clone()
        .add(end)
        .divideScalar(2)
    );
    line.lookAt(end);
    line.rotateX(deg90InRad);
    const l_2 = length / 2;
    const coef = 0.2;
    let offset = 0;
    const f = new THREE.Vector3(0, 0, -size * 3);
    const s = new THREE.Vector3(0, 0, size * 3);
    while (offset < l_2) {
      if (offset) {
        const py = offset;
        const my = -offset;
        const a = createBoldLine(
          f.clone().setY(py + 0.01),
          s.clone().setY(py - 0.01),
          und,
          0.003
        );
        const b = createBoldLine(
          f.clone().setY(py - 0.01),
          s.clone().setY(py + 0.01),
          und,
          0.003
        );
        const c = createBoldLine(
          f.clone().setY(my + 0.01),
          s.clone().setY(my - 0.01),
          und,
          0.003
        );
        const d = createBoldLine(
          f.clone().setY(my - 0.01),
          s.clone().setY(my + 0.01),
          und,
          0.003
        );
        a && line.add(a);
        b && line.add(b);
        c && line.add(c);
        d && line.add(d);
      } else {
        const a = createBoldLine(
          f.clone().setY(0.01),
          s.clone().setY(-0.01),
          und,
          0.003
        );
        const b = createBoldLine(
          f.clone().setY(-0.01),
          s.clone().setY(0.01),
          und,
          0.003
        );
        a && line.add(a);
        b && line.add(b);
      }
      offset += coef;
    }
    return line;
  } else if (lineType === "Electrical wires") {
    const line = new THREE.Mesh(new THREE.CylinderGeometry(size, size, length));
    line.position.copy(
      start
        .clone()
        .add(end)
        .divideScalar(2)
    );
    line.lookAt(end);
    line.rotateX(deg90InRad);
    let offset = 0;
    const geometry = new THREE.SphereGeometry(size * 3, 8, 8);
    while (offset < l_2) {
      if (offset) {
        const a = new THREE.Mesh(geometry.clone());
        a.position.setY(offset);
        const b = a.clone();
        b.position.setY(-offset);
        line.add(a, b);
      } else {
        line.add(new THREE.Mesh(geometry.clone()));
      }
      offset += coef;
    }
    return line;
  } else if (lineType === "Hydraulic Line") {
    const line = new THREE.Group();
    let offset = 0;
    const long = 0.2;
    const short = 0.05;
    let isShort = false;
    const sStart = new THREE.Vector3();
    const sEnd = end.clone().sub(start);
    while (offset < length) {
      if (isShort) offset += short;
      if (offset >= length) break;
      const s = getPosByDistance(offset, sStart, sEnd);
      offset += isShort ? short : long;
      if (offset >= length) offset = length;
      const e = getPosByDistance(offset, sStart, sEnd);
      if (isShort) offset += short;
      const a = createBoldLine(s, e);
      a && line.add(a);
      isShort = !isShort;
    }
    line.position.copy(start);
    return line;
  } else if (lineType === "Instrument signal") {
    const line = new THREE.Group();
    let offset = 0;
    const l = 0.1;
    const sStart = new THREE.Vector3();
    const sEnd = end.clone().sub(start);
    while (offset < length) {
      offset += l;
      if (offset >= length) break;
      const s = getPosByDistance(offset, sStart, sEnd);
      offset += l;
      if (offset >= length) offset = length;
      const e = getPosByDistance(offset, sStart, sEnd);
      const a = createBoldLine(s, e);
      a && line.add(a);
    }
    line.position.copy(start);
    return line;
  } else {
    const line = new THREE.Mesh(new THREE.CylinderGeometry(size, size, length));
    line.position.copy(
      start
        .clone()
        .add(end)
        .divideScalar(2)
    );
    line.lookAt(end);
    line.rotateX(deg90InRad);
    if (
      lineType === "Electric heat tracing" ||
      lineType === "Steam heat tracing"
    ) {
      const sline = new THREE.Group();
      let offset = 0;
      const l = 0.1;
      const txt = lineType[0];
      let isTxt = false;
      while (offset < length) {
        offset += l;
        if (offset >= length) break;
        const s = new THREE.Vector3(0, offset, 0.05);
        offset += l;
        if (offset >= length) offset = length;
        const e = new THREE.Vector3(0, offset, 0.05);
        if (isTxt) {
          const mid = s
            .clone()
            .add(e)
            .divideScalar(2);
          createText(sline, font, txt, mid, -deg90InRad, -deg90InRad);
        } else {
          const a = createBoldLine(s, e);
          a && sline.add(a);
        }
        isTxt = !isTxt;
      }
      sline.position.setY(-length / 2);
      line.add(sline);
    }
    return line;
  }
}

function createPipeMesh(radius, thickness, depth) {
  const arcShape = new THREE.Shape();
  arcShape.absarc(0, 0, radius, 0, deg360InRad, false);
  if (thickness && checkRange(thickness, 0, radius)) {
    const holePath = new THREE.Path();
    holePath.absarc(0, 0, radius - thickness, 0, deg360InRad, true);
    arcShape.holes.push(holePath);
  }
  const mesh = new THREE.Mesh(
    new THREE.ExtrudeGeometry(arcShape, {
      steps: 1,
      bevelEnabled: false,
      curveSegments: 32,
      depth,
    })
  );
  return mesh;
}

function createElbow(radius, length) {
  const start = new THREE.Vector3(0, 0, -length);
  const end = roundVectorM(
    start.clone().applyAxisAngle(new THREE.Vector3(0, 1), deg90InRad)
  );
  const curve = new THREE.QuadraticBezierCurve3(
    start,
    new THREE.Vector3(),
    end
  );
  const mesh = new THREE.Mesh(new THREE.TubeGeometry(curve, 32, radius, 32));
  return mesh;
}

function convertXYZToVector3(x, y, z) {
  return convertToVector3({ x, y, z });
}

function convertToVector3({ x, y, z }) {
  return new THREE.Vector3(x, y, z);
}

function localToGlobal(startPos, pos, dir) {
  switch (dir) {
    case "+X":
      return new THREE.Vector3(
        startPos.x + pos.x,
        startPos.y + pos.y,
        startPos.z + pos.z
      );
    case "+Z":
      return new THREE.Vector3(
        startPos.x - pos.z,
        startPos.y + pos.y,
        startPos.z - pos.x
      );
    case "-X":
      return new THREE.Vector3(
        startPos.x - pos.x,
        startPos.y + pos.y,
        startPos.z - pos.z
      );
    case "-Z":
      return new THREE.Vector3(
        startPos.x + pos.z,
        startPos.y + pos.y,
        startPos.z + pos.x
      );
    default:
      return pos.clone();
  }
}

function fixPointsOfBeamElement(start, end, model, item, isStart) {
  const column = model.columns.find((column) => {
    const pos = isStart ? "startPos" : "endPos";
    if (column.startPos.x !== item[pos].x) return false;
    if (column.startPos.z !== item[pos].z) return false;
    return checkRange(
      item[pos].y,
      column.startPos.y,
      column.endPos.y,
      false,
      true
    );
  });
  if (column) {
    const shape = column.profile.shape?.toUpperCase().trim();
    if (shape === "I" || shape === "C") {
      const width = MMtoM(column.profile.bf_global ?? 0) / 2;
      const height = MMtoM(column.profile.d_global ?? 0) / 2;
      const vector = isStart ? start : end;
      const isZ = Math.round(start.z) === Math.round(end.z);
      switch (column.orientation) {
        case 0:
        case 180:
          if (isZ) {
            vector.setX(
              start.x < end.x
                ? isStart
                  ? vector.x + width
                  : vector.x - width
                : isStart
                ? vector.x - width
                : vector.x + width
            );
          } else {
            vector.setZ(
              start.z < end.z
                ? isStart
                  ? vector.z + height
                  : vector.z - height
                : isStart
                ? vector.z - height
                : vector.z + height
            );
          }
          break;
        case 90:
        case 270:
          if (isZ) {
            vector.setX(
              start.x < end.x
                ? isStart
                  ? vector.x + height
                  : vector.x - height
                : isStart
                ? vector.x - height
                : vector.x + height
            );
          } else {
            vector.setZ(
              start.z < end.z
                ? isStart
                  ? vector.z + width
                  : vector.z - width
                : isStart
                ? vector.z - width
                : vector.z + width
            );
          }
          break;
        default: {
          const a = width + height;
          const b = Math.sqrt(2 * Math.pow(a, 2)) / 2;
          const offset = Math.sqrt(Math.pow(a, 2) - Math.pow(b, 2));
          if (isZ) {
            vector.setX(
              start.x < end.x
                ? isStart
                  ? vector.x + offset
                  : vector.x - offset
                : isStart
                ? vector.x - offset
                : vector.x + offset
            );
          } else {
            vector.setZ(
              start.z < end.z
                ? isStart
                  ? vector.z + offset
                  : vector.z - offset
                : isStart
                ? vector.z - offset
                : vector.z + offset
            );
          }
        }
      }
    }
  }
}
