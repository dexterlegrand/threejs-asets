import * as MAIN_TYPES from "../../../store/main/types";
import * as CONSTANTS from "../../../store/main/constants";
import * as UI_TYPES from "../../../store/ui/types";
import * as PR_UTILS from "./pipeRackUtils";
import * as UTILS from "../utils";
import * as THREE from "three";

import { getSimpleAxisHelper } from "../axisHelper";
import { getDefaultRotation, createElementByProfile } from "../profileElement";
import { Section } from "../../../store/data/types";
import { getColor, getRotation } from "../common/commonUtils";

export function drawPipeRackObject(
  project: MAIN_TYPES.Project,
  object: MAIN_TYPES.PipeRack,
  ui: UI_TYPES.ProjectUI | undefined,
  font?: THREE.Font
) {
  const modelAnalysis = ui?.analysisUI[object.name];
  let min = 0.3;
  let max = 1;
  if (project.designCode === "IS 800 : 2007 LSD") {
    min = project.indianDesignCode.minStressRation ?? 0.3;
    max = project.indianDesignCode.stressRation;
  } else if (project.designCode === "AISC LRFD") {
    min = project.americanDesignCode.minStressRation ?? 0.3;
    max = project.americanDesignCode.stressRation;
  }

  const pipeRack = new THREE.Mesh();
  pipeRack.name = object.name;
  pipeRack.position.add(object.startPos);
  pipeRack.rotation.setFromVector3(getRotation(object.direction));
  // drawing elements
  if (project.mode === "stressCheck" || project.mode === "deflectionCheck") {
    for (const column of object.columns) {
      const colored = drawColoredElement(
        project,
        object,
        column,
        modelAnalysis,
        min,
        max,
        font
      );
      colored.length
        ? pipeRack.add(...colored)
        : pipeRack.add(drawColumn(project, object, column, true));
    }
    for (const beam of object.beams) {
      const colored = drawColoredElement(
        project,
        object,
        beam,
        modelAnalysis,
        min,
        max,
        font
      );
      colored.length
        ? pipeRack.add(...colored)
        : pipeRack.add(drawBeam(project, object, beam, true));
    }
    for (const cantilever of object.cantilevers) {
      const colored = drawColoredElement(
        project,
        object,
        cantilever,
        modelAnalysis,
        min,
        max,
        font
      );
      colored.length
        ? pipeRack.add(...colored)
        : pipeRack.add(drawCantilever(project, object, cantilever, true));
    }
    for (const bracing of object.vBracings) {
      const colored = drawColoredElement(
        project,
        object,
        bracing,
        modelAnalysis,
        min,
        max,
        font
      );
      colored.length
        ? pipeRack.add(...colored)
        : pipeRack.add(drawVBracing(project, object, bracing, true));
    }
    for (const hb of object.hBracings) {
      const colored = drawColoredElement(
        project,
        object,
        hb,
        modelAnalysis,
        min,
        max,
        font
      );
      if (colored.length) {
        pipeRack.add(...colored);
      } else {
        const startBeam = UTILS.getElementByName(
          [...object.beams, ...object.cantilevers],
          hb.start
        );
        const endBeam = UTILS.getElementByName(
          [...object.beams, ...object.cantilevers],
          hb.end
        );
        startBeam &&
          endBeam &&
          pipeRack.add(drawHBracing(project, object, hb, startBeam, endBeam));
      }
    }
    for (const portal of object.portals) {
      UTILS.getElementsByParent(object.accessories, portal.name).forEach(
        (ac) => {
          const elements = drawAccessory(
            project,
            object,
            ac,
            portal.tiers,
            modelAnalysis,
            min,
            max,
            font,
            true
          );
          elements.length && pipeRack.add(...elements);
        }
      );
    }
  } else {
    for (const column of object.columns) {
      pipeRack.add(drawColumn(project, object, column));
    }
    for (const beam of object.beams) {
      pipeRack.add(drawBeam(project, object, beam));
    }
    for (const cantilever of object.cantilevers) {
      pipeRack.add(drawCantilever(project, object, cantilever));
    }
    for (const bracing of object.vBracings) {
      pipeRack.add(drawVBracing(project, object, bracing));
    }
    for (const hb of object.hBracings) {
      const startBeam = UTILS.getElementByName(
        [...object.beams, ...object.cantilevers],
        hb.start
      );
      const endBeam = UTILS.getElementByName(
        [...object.beams, ...object.cantilevers],
        hb.end
      );
      startBeam &&
        endBeam &&
        pipeRack.add(drawHBracing(project, object, hb, startBeam, endBeam));
    }
    for (const portal of object.portals) {
      UTILS.getElementsByParent(object.accessories, portal.name).forEach(
        (ac) => {
          const elements = drawAccessory(project, object, ac, portal.tiers);
          elements.length && pipeRack.add(...elements);
        }
      );
    }
  }
  for (const plate of object.plates) {
    const column = object.columns.find((c) => c.name === plate.column);
    if (column && plate.type === "Circular") {
      const cbp = drawCircularBasePlate(plate as MAIN_TYPES.CircularBP, column);
      cbp.position.add(column.startPos);
      pipeRack.add(cbp);
    } else if (column) {
      const rbp = drawRectangularBasePlate(
        plate as MAIN_TYPES.RectangularBP,
        column
      );
      rbp.position.add(column.startPos);
      pipeRack.add(rbp);
    }
  }
  for (const flange of object.flanges) {
    const column = object.columns.find((c) => c.name === flange.column);
    const secondColumn = object.columns.find((c) => c.name === column?.next);
    if (flange.type === "Circular") {
      column &&
        secondColumn &&
        pipeRack.add(
          drawCircularSliceFlange(
            flange as MAIN_TYPES.CircularSF,
            column,
            secondColumn
          )
        );
    } else {
      column &&
        secondColumn &&
        pipeRack.add(
          drawRectangularSliceFlange(
            flange as MAIN_TYPES.RectangularSF,
            column,
            secondColumn
          )
        );
    }
  }
  for (const pipe of object.pipes) {
    pipeRack.add(drawPipe(object, pipe));
  }
  for (const pl of object.platforms) {
    if (!pl) continue;
    const from = object.portals.find((p) => p.name === pl.fromPortal);
    const to = object.portals.find((p) => p.name === pl.toPortal);
    if (from && to) {
      pipeRack.add(drawPlatform(project, pl, from, to));
      object.ladders
        .filter((ld) => ld.platform === pl.name)
        .forEach((ld) =>
          pipeRack.add(drawLadder(pl, from, to, project.ladderParams, ld))
        );
    }
  }
  if (project.settings?.models?.modelAxesHelpers) {
    pipeRack.add(
      getSimpleAxisHelper(
        object.portals.reduce((acc, p) => Math.max(acc, ...p.tiers), 0) * 1.5
      )
    );
  }
  return pipeRack;
}

function createText(
  parent: THREE.Object3D,
  font: THREE.Font | undefined,
  text: string,
  pos: THREE.Vector3,
  rX?: number,
  rY?: number,
  color = UTILS.getRGB(CONSTANTS.gray)
) {
  if (!font) return;
  const textParameters = { font, size: 0.1, height: 0.003, curveSegments: 1 };
  const geometry = new THREE.TextGeometry(text, textParameters);
  geometry.center();
  const mesh = new THREE.Mesh(
    geometry,
    new THREE.MeshLambertMaterial({ color, side: THREE.DoubleSide })
  );
  mesh.position.copy(pos);
  rX && mesh.rotateX(rX);
  rY && mesh.rotateY(rY);
  parent.add(mesh);
}

function drawColoredElement(
  project: MAIN_TYPES.Project,
  model: MAIN_TYPES.PipeRack,
  el:
    | MAIN_TYPES.PipeRackColumn
    | MAIN_TYPES.PipeRackBeam
    | MAIN_TYPES.PipeRackCantilever
    | MAIN_TYPES.PipeRackVBracing
    | MAIN_TYPES.PipeRackHBracing,
  ui: UI_TYPES.ModelAnalysisUI | undefined,
  min: number,
  max: number,
  font?: THREE.Font
) {
  const members =
    ui?.members.filter((m) => UTILS.replaceSplitNumber(m.name) === el.name) ??
    [];
  const checks =
    (project.mode === "stressCheck"
      ? ui?.memberStressChecks
      : ui?.deflectionChecks) ?? [];
  const nodes = ui?.nodes ?? {};
  const elements = ui?.beamElements ?? {};
  const meshes: THREE.Mesh[] = [];
  const defualtRotationX = getDefaultRotation(el.profile);
  const offset = Math.max(
    UTILS.MMtoM(el.profile.bf_global ?? 0),
    UTILS.MMtoM(el.profile.d_global ?? 0)
  );
  for (const member of members) {
    const element = elements[member.label];
    if (!element) continue;
    const node1 = nodes[element.nodes[0]];
    const node2 = nodes[element.nodes[1]];
    if (!node1 || !node2) continue;
    const check = checks.find((c) => c.elementNumber === member.label);
    const color = getColor(check, min, max);
    const start = UTILS.globalToLocal(
      model.startPos,
      new THREE.Vector3(node1.x, node1.y, node1.z).divideScalar(1000),
      model.direction
    );
    const end = UTILS.globalToLocal(
      model.startPos,
      new THREE.Vector3(node2.x, node2.y, node2.z).divideScalar(1000),
      model.direction
    );
    const d = start.distanceTo(end);
    const mesh = createElementByProfile(
      d,
      color,
      el.profile,
      undefined,
      defualtRotationX
    );
    mesh.position.copy(start);
    mesh.lookAt(end);
    mesh.rotateY(-CONSTANTS.deg90InRad);
    mesh.position.add(end).divideScalar(2);
    (mesh.material as THREE.MeshLambertMaterial).setValues({
      transparent: project.settings.analysis.transparensyOfColors < 1,
      opacity: project.settings.analysis.transparensyOfColors,
    });
    const txtS = new THREE.Vector3(-d / 2, offset, offset + 0.002);
    const txtM = new THREE.Vector3(0, offset, offset - 0.002);
    const txtE = new THREE.Vector3(d / 2, offset, offset + 0.002);
    if (project.settings.analysis.showLabels) {
      createText(
        mesh,
        font,
        `${member.label}:${member.name}`,
        txtM,
        0,
        0,
        "darkgray"
      );
    }
    if (project.settings.analysis.showNodes) {
      createText(mesh, font, `${node1.nodeNumber}`, txtS, 0, 0, "lightgray");
      createText(mesh, font, `${node2.nodeNumber}`, txtE, 0, 0, "lightgray");
    }
    meshes.push(mesh);
  }
  return meshes;
}

function drawColumn(
  project: MAIN_TYPES.Project,
  model: MAIN_TYPES.PipeRack,
  tc: MAIN_TYPES.PipeRackColumn,
  isGray?: boolean
) {
  const end = tc.endPos.clone();
  if (tc.upperBeam) {
    const beam = [...model.beams, ...model.cantilevers].find(
      (beam) => beam.name === tc.upperBeam
    );
    beam && end.setY(end.y - UTILS.MMtoM(beam.profile.d_global ?? 0));
  }

  const isAxesHelper =
    project.settings.models.axesHelper === "ALL" ||
    project.settings.models.axesHelper === tc.name;
  const defualtRotationX = getDefaultRotation(tc.profile);
  const column = createElementByProfile(
    end.y - tc.startPos.y,
    isGray ? CONSTANTS.gray : CONSTANTS.columnColorRGB,
    // getColor(project, stressChecks, tc, columnColorRGB, min, max),
    tc.profile,
    isAxesHelper,
    defualtRotationX
  );
  column.position.addVectors(tc.startPos, end).divideScalar(2);
  column.rotateZ(CONSTANTS.deg90InRad);
  column.rotateX(CONSTANTS.deg90InRad + defualtRotationX);
  if (tc.orientation) column.rotateX(UTILS.degToRad(tc.orientation));
  column.name = tc.name;
  // for showing element info after click by it
  column.userData = {
    model: model.name,
    isModelItem: true,
    name: tc.name,
    modelStart: model.startPos,
    modelDir: model.direction,
    start: tc.startPos,
    end: tc.endPos,
    profile: tc.profile,
    orientation: tc.orientation,
    releases: tc.releases,
    isAxesHelper: project.settings.models.axesHelper === tc.name,
  } as MAIN_TYPES.ModelItem;
  return column;
}

function fixPointsOfBeamElement(
  start: THREE.Vector3,
  end: THREE.Vector3,
  model: MAIN_TYPES.PipeRack,
  item: MAIN_TYPES.PipeRackBeam | MAIN_TYPES.PipeRackCantilever,
  isStart?: boolean,
  custom?: { profile: Section; orientation: MAIN_TYPES.Orientation }
) {
  const column =
    custom ??
    model.columns.find((column) => {
      if (column.additional) return false;
      const pos = isStart ? "startPos" : "endPos";
      if (column.startPos.x !== item[pos].x) return false;
      if (column.startPos.z !== item[pos].z) return false;
      return UTILS.checkRange(
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
      const width = UTILS.MMtoM(column.profile.bf_global ?? 0) / 2;
      const height = UTILS.MMtoM(column.profile.d_global ?? 0) / 2;
      const vector = isStart ? start : end;
      if (!column.orientation || column.orientation === 180) {
        if (start.z === end.z) {
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
      } else if (column.orientation === 90 || column.orientation === 270) {
        if (start.z === end.z) {
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
      } else {
        const a = width + height;
        const b = Math.sqrt(2 * Math.pow(a, 2)) / 2;
        const offset = Math.sqrt(Math.pow(a, 2) - Math.pow(b, 2));
        if (start.z === end.z) {
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

function fixElevationOfBeamElement(
  item:
    | MAIN_TYPES.PipeRackBeam
    | MAIN_TYPES.PipeRackCantilever
    | MAIN_TYPES.PipeRackHBracing,
  mesh: THREE.Mesh,
  pos: THREE.Vector3
) {
  const width = mesh.userData.width ?? 0;
  const height = mesh.userData.height ?? width;
  switch (item.orientation) {
    case undefined:
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

function drawBeam(
  project: MAIN_TYPES.Project,
  model: MAIN_TYPES.PipeRack,
  tb: MAIN_TYPES.PipeRackBeam,
  isGray?: boolean
) {
  const start = tb.startPos.clone();
  const end = tb.endPos.clone();

  fixPointsOfBeamElement(start, end, model, tb, true);
  fixPointsOfBeamElement(start, end, model, tb);

  const isAxesHelper =
    project.settings.models.axesHelper === "ALL" ||
    project.settings.models.axesHelper === tb.name;
  const defualtRotationX = getDefaultRotation(tb.profile);
  const beam = createElementByProfile(
    start.distanceTo(end),
    isGray ? CONSTANTS.gray : CONSTANTS.beamColorRGB,
    // getColor(project, stressChecks, tb, beamColorRGB, min, max),
    tb.profile,
    isAxesHelper,
    defualtRotationX
  );
  const pos = new THREE.Vector3().addVectors(start, end).divideScalar(2);
  fixElevationOfBeamElement(tb, beam, pos);
  beam.position.copy(pos);
  if (tb.direction === "Z") beam.rotateY(CONSTANTS.deg90InRad);
  if (tb.direction === "X")
    beam.rotateY(UTILS.getRotationByLegs(start.x, start.z, end.x, end.z));
  beam.rotateX(defualtRotationX);
  if (tb.orientation) beam.rotateX(UTILS.degToRad(tb.orientation));
  beam.name = tb.name;
  // for showing element info after click by it
  beam.userData = {
    model: model.name,
    isModelItem: true,
    name: tb.name,
    modelStart: model.startPos,
    modelDir: model.direction,
    start: tb.startPos,
    end: tb.endPos,
    profile: tb.profile,
    orientation: tb.orientation,
    releases: tb.releases,
    isAxesHelper: project.settings.models.axesHelper === tb.name,
  } as MAIN_TYPES.ModelItem;
  return beam;
}

function drawVBracing(
  project: MAIN_TYPES.Project,
  model: MAIN_TYPES.PipeRack,
  bracing: MAIN_TYPES.PipeRackVBracing,
  isGray?: boolean
) {
  const offsetX = (model.portalColProfile.bf_global ?? 0) / 2000;
  const offsetZ = (model.portalColProfile.d_global ?? 0) / 2000;
  const offsetTop = (model.portalTieProfile.d_global ?? 0) / 1000;

  const start = bracing.startPos.clone();
  const end = bracing.endPos.clone();

  switch (bracing.bracingType) {
    case "Diagonal Up":
      if (bracing.side !== "Portal") {
        start.setX(start.x + offsetX);
        end.setX(end.x - offsetX);
      } else {
        start.setZ(start.z - offsetZ);
        end.setZ(end.z + offsetZ);
      }
      end.setY(end.y - offsetTop);
      break;
    case "Diagonal Down":
      if (bracing.side !== "Portal") {
        start.setX(start.x + offsetX);
        end.setX(end.x - offsetX);
      } else {
        start.setZ(start.z - offsetZ);
        end.setZ(end.z + offsetZ);
      }
      start.setY(start.y - offsetTop);
      break;
    case "X Bracing":
      if (bracing.side !== "Portal") {
        start.setX(start.x + offsetX);
        end.setX(end.x - offsetX);
      } else {
        start.setZ(start.z - offsetZ);
        end.setZ(end.z + offsetZ);
      }
      if (bracing.isUp) {
        end.setY(end.y - offsetTop);
      } else {
        start.setY(start.y - offsetTop);
      }
      break;
    case "Triangular Up":
      if (bracing.isUp) {
        if (bracing.side !== "Portal") {
          start.setX(start.x + offsetX);
        } else {
          start.setZ(start.z - offsetZ);
        }
        end.setY(end.y - offsetTop);
      } else {
        start.setY(start.y - offsetTop);
        if (bracing.side !== "Portal") {
          end.setX(end.x - offsetX);
        } else {
          end.setZ(end.z + offsetZ);
        }
      }
      break;
    case "Triangular Down":
      if (bracing.isUp) {
        if (bracing.side !== "Portal") {
          end.setX(end.x - offsetX);
        } else {
          end.setZ(end.z + offsetZ);
        }
        end.setY(end.y - offsetTop);
      } else {
        if (bracing.side !== "Portal") {
          start.setX(start.x + offsetX);
        } else {
          start.setZ(start.z - offsetZ);
        }
        start.setY(start.y - offsetTop);
      }
  }

  const isAxesHelper =
    project.settings.models.axesHelper === "ALL" ||
    project.settings.models.axesHelper === bracing.name;
  const defualtRotationX = getDefaultRotation(bracing.profile);
  const diagonal = createElementByProfile(
    start.distanceTo(end),
    isGray ? CONSTANTS.gray : CONSTANTS.vBracingColorRGB,
    // getColor(project, stressChecks, bracing, vBracingColorRGB, min, max),
    bracing.profile,
    isAxesHelper,
    defualtRotationX
  );
  diagonal.position.addVectors(start, end).divideScalar(2);
  const yRotation = UTILS.getRotationByLegs(start.x, start.z, end.x, end.z);
  const zRotation =
    UTILS.getRotationByLegs(
      0,
      0,
      new THREE.Vector3().distanceTo(
        new THREE.Vector3(end.x - start.x, 0, end.z - start.z)
      ),
      end.y - start.y
    ) * -1;
  diagonal.rotateY(yRotation);
  diagonal.rotateZ(zRotation);
  diagonal.name = bracing.name;
  diagonal.userData = {
    model: model.name,
    isModelItem: true,
    name: bracing.name,
    modelStart: model.startPos,
    modelDir: model.direction,
    start: bracing.startPos,
    end: bracing.endPos,
    profile: bracing.profile,
    orientation: bracing.orientation,
    releases: bracing.releases,
    isAxesHelper: project.settings.models.axesHelper === bracing.name,
  } as MAIN_TYPES.ModelItem;
  diagonal.rotateX(defualtRotationX);
  if (bracing.orientation)
    diagonal.rotateX(UTILS.degToRad(bracing.orientation));
  return diagonal;
}

function drawCantilever(
  project: MAIN_TYPES.Project,
  model: MAIN_TYPES.PipeRack,
  cnt: MAIN_TYPES.PipeRackCantilever,
  isGray?: boolean
) {
  const length = cnt.startPos.distanceTo(cnt.endPos);
  const isAxesHelper =
    project.settings.models.axesHelper === "ALL" ||
    project.settings.models.axesHelper === cnt.name;
  const defualtRotationX = getDefaultRotation(cnt.profile);
  const cantilever = createElementByProfile(
    length,
    isGray ? CONSTANTS.gray : CONSTANTS.beamColorRGB,
    // getColor(project, stressChecks, cnt, beamColorRGB, min, max),
    cnt.profile,
    isAxesHelper,
    defualtRotationX
  );
  cantilever.rotateY(
    cnt.position === "Front"
      ? CONSTANTS.deg180InRad
      : cnt.position === "Left"
      ? -CONSTANTS.deg90InRad
      : cnt.position === "Right"
      ? CONSTANTS.deg90InRad
      : 0
  );
  cantilever.rotateX(defualtRotationX);
  if (cnt.orientation) cantilever.rotateX(UTILS.degToRad(cnt.orientation));
  const pos = new THREE.Vector3()
    .addVectors(cnt.startPos, cnt.endPos)
    .divideScalar(2);
  fixElevationOfBeamElement(cnt, cantilever, pos);
  cantilever.position.copy(pos);
  cantilever.position.setX(
    cnt.position === "Front"
      ? cantilever.position.x - (model.portalColProfile.bf_global ?? 0) / 2000
      : cnt.position === "Back"
      ? cantilever.position.x + (model.portalColProfile.bf_global ?? 0) / 2000
      : cantilever.position.x
  );
  cantilever.position.setZ(
    cnt.position === "Right"
      ? cantilever.position.z + (model.portalColProfile.d_global ?? 0) / 2000
      : cnt.position === "Left"
      ? cantilever.position.z - (model.portalColProfile.d_global ?? 0) / 2000
      : cantilever.position.z
  );
  cantilever.name = cnt.name;
  cantilever.userData = {
    model: model.name,
    isModelItem: true,
    name: cnt.name,
    modelStart: model.startPos,
    modelDir: model.direction,
    start: cnt.startPos,
    end: cnt.endPos,
    profile: cnt.profile,
    releases: cnt.releases,
    isAxesHelper: project.settings.models.axesHelper === cnt.name,
  } as MAIN_TYPES.ModelItem;
  return cantilever;
}

function drawPipe(pr: MAIN_TYPES.PipeRack, pipe: MAIN_TYPES.Pipe) {
  const arcShape = new THREE.Shape();
  arcShape.absarc(0, 0, pipe.diameter / 2, 0, CONSTANTS.deg360InRad, false);
  const holePath = new THREE.Path();
  holePath.absarc(
    0,
    0,
    pipe.diameter / 2 - pipe.thickness,
    0,
    CONSTANTS.deg360InRad,
    true
  );
  arcShape.holes.push(holePath);
  const pipeMesh = new THREE.Mesh(
    new THREE.ExtrudeBufferGeometry(arcShape, {
      steps: 1,
      bevelEnabled: false,
      curveSegments: 32,
      depth: pipe.start.distanceTo(pipe.end),
    }),
    new THREE.MeshBasicMaterial({
      color: `rgb(${CONSTANTS.pipeColorRGB[0]},${CONSTANTS.pipeColorRGB[1]},${CONSTANTS.pipeColorRGB[2]})`,
    })
  );
  if (pipe.direction === "+Y" || pipe.direction === "-Y") {
    pipeMesh.rotateY(CONSTANTS.deg90InRad);
    pipeMesh.rotateZ(
      -UTILS.getRotationByLegs(
        pipe.start.y,
        pipe.start.z,
        pipe.end.y,
        pipe.end.z
      )
    );
    pipeMesh.rotateX(
      -UTILS.getRotationByLegs(
        pipe.start.y,
        pipe.start.x,
        pipe.end.y,
        pipe.end.x
      ) +
        CONSTANTS.deg180InRad / (pipe.direction === "+Y" ? -2 : 2)
    );
  } else {
    pipeMesh.rotateY(
      UTILS.getRotationByLegs(
        pipe.start.x,
        pipe.start.z,
        pipe.end.x,
        pipe.end.z
      ) +
        CONSTANTS.deg180InRad / (pipe.direction === "-X" ? -2 : 2)
    );
    pipeMesh.rotateX(
      UTILS.getRotationByLegs(
        pipe.start.x,
        pipe.start.y,
        pipe.end.x,
        pipe.end.y
      ) * (pipe.direction === "-X" ? -1 : 1)
    );
  }
  pipeMesh.position.add(pipe.start);
  if (pipe.succeeding !== "END") {
    const sphere = new THREE.Mesh(
      new THREE.SphereBufferGeometry(pipe.diameter / 2, 32, 32),
      new THREE.MeshBasicMaterial({
        color: UTILS.getRGB(CONSTANTS.pipeColorRGB),
      })
    );
    sphere.position.setZ(pipe.start.distanceTo(pipe.end));
    pipeMesh.add(sphere);
  }
  pipeMesh.name = pipe.name;
  pipe.supTypes.forEach((sup) => {
    const beam = PR_UTILS.getPipeSupportBeams(pr, pipe).find(
      (b) => b.name === sup.beam
    );
    const pos = beam
      ? PR_UTILS.getSupportPosByBeam(pipe.start, pipe.end, pipe.direction, beam)
      : UTILS.getPosByDistance(sup.distance, pipe.start, pipe.end);
    // @ts-ignore
    if (sup.type === "Fixed" || sup.type === "Anchor") {
      const fArcShape = new THREE.Shape().absarc(
        0,
        0,
        (pipe.diameter + 0.04) / 2,
        0,
        CONSTANTS.deg360InRad,
        false
      );
      fArcShape.holes.push(
        new THREE.Path().absarc(
          0,
          0,
          pipe.diameter / 2,
          0,
          CONSTANTS.deg360InRad,
          true
        )
      );
      const supMesh = new THREE.Mesh(
        new THREE.ExtrudeBufferGeometry(fArcShape, {
          steps: 1,
          bevelEnabled: false,
          curveSegments: 32,
          depth: 0.1,
        }),
        new THREE.MeshBasicMaterial({
          color: UTILS.getRGB(CONSTANTS.supColorRGB),
        })
      );
      supMesh.position.setZ(pipe.start.distanceTo(pos) - 0.05);
      pipeMesh.add(supMesh);
    } else if (sup.type === "Spring") {
      const isTop = beam ? sup.position.y < beam.startPos.y : true;
      const h = beam
        ? (Math.abs(beam.startPos.y - sup.position.y) - pipe.diameter / 2) *
          (isTop ? 1 : -1)
        : 1;
      const geometry = new THREE.Geometry();
      geometry.vertices.push(new THREE.Vector3(0, h));
      geometry.vertices.push(new THREE.Vector3(0, h * 0.8));
      geometry.vertices.push(new THREE.Vector3(0.1, h * 0.7));
      geometry.vertices.push(new THREE.Vector3(-0.1, h * 0.6));
      geometry.vertices.push(new THREE.Vector3(0.1, h * 0.5));
      geometry.vertices.push(new THREE.Vector3(-0.1, h * 0.4));
      geometry.vertices.push(new THREE.Vector3(0.1, h * 0.3));
      geometry.vertices.push(new THREE.Vector3(0, h * 0.2));
      geometry.vertices.push(new THREE.Vector3());
      const supLine = new THREE.Line(
        geometry,
        new THREE.MeshBasicMaterial({
          color: `rgb(${CONSTANTS.supColorRGB[0]},${CONSTANTS.supColorRGB[1]},${CONSTANTS.supColorRGB[2]})`,
        })
      );
      supLine.position.set(
        0,
        (pipe.diameter / 2) * (isTop ? 1 : -1),
        pipe.start.distanceTo(pos)
      );
      pipeMesh.add(supLine);
    } else {
      const lBox = new THREE.Mesh(
        new THREE.BoxBufferGeometry(0.02, 0.1, 0.4),
        new THREE.MeshBasicMaterial({
          color: `rgb(${CONSTANTS.supColorRGB[0]},${CONSTANTS.supColorRGB[1]},${CONSTANTS.supColorRGB[2]})`,
        })
      );
      lBox.position.setX(pipe.diameter / -2 - 0.01);
      const rBox = new THREE.Mesh(
        new THREE.BoxBufferGeometry(0.02, 0.1, 0.4),
        new THREE.MeshBasicMaterial({
          color: `rgb(${CONSTANTS.supColorRGB[0]},${CONSTANTS.supColorRGB[1]},${CONSTANTS.supColorRGB[2]})`,
        })
      );
      rBox.position.setX(pipe.diameter / 2 + 0.01);
      const supMesh = new THREE.Mesh();
      supMesh.add(lBox, rBox);
      supMesh.position.setZ(pipe.start.distanceTo(pos));
      pipeMesh.add(supMesh);
    }
  });
  // pipeMesh.add(new AxesHelper(2));
  pipeMesh.userData = {
    model: pr.name,
    isModelItem: true,
    name: pipe.name,
    modelStart: pr.startPos,
    modelDir: pr.direction,
    start: pipe.start,
    end: pipe.end,
    profile: pipe.profile ?? {
      d_global: UTILS.MtoMM(pipe.diameter),
      bf_global: UTILS.MtoMM(pipe.thickness),
    },
    releases: pipe.releases,
  } as MAIN_TYPES.ModelItem;
  return pipeMesh;
}

function drawHBracing(
  project: MAIN_TYPES.Project,
  model: MAIN_TYPES.PipeRack,
  hb: MAIN_TYPES.PipeRackHBracing,
  startB: MAIN_TYPES.PipeRackBeam | MAIN_TYPES.PipeRackCantilever,
  endB: MAIN_TYPES.PipeRackBeam | MAIN_TYPES.PipeRackCantilever,
  isGray?: boolean
) {
  const start = new THREE.Vector3().add(startB.startPos);
  const clearStart = new THREE.Vector3().add(startB.startPos);

  if (
    (startB as MAIN_TYPES.PipeRackBeam).direction === "X" ||
    (startB as MAIN_TYPES.PipeRackCantilever).position === "Front" ||
    (startB as MAIN_TYPES.PipeRackCantilever).position === "Back"
  ) {
    (startB as MAIN_TYPES.PipeRackCantilever).position === "Front"
      ? start.setX(start.x - hb.startOffset)
      : start.setX(start.x + hb.startOffset);
    (startB as MAIN_TYPES.PipeRackCantilever).position === "Front"
      ? clearStart.setX(clearStart.x - hb.startOffset)
      : clearStart.setX(clearStart.x + hb.startOffset);
  } else {
    (startB as MAIN_TYPES.PipeRackCantilever).position === "Right"
      ? start.setZ(start.z + hb.startOffset)
      : start.setZ(start.z - hb.startOffset);
    (startB as MAIN_TYPES.PipeRackCantilever).position === "Right"
      ? clearStart.setZ(clearStart.z + hb.startOffset)
      : clearStart.setZ(clearStart.z - hb.startOffset);
  }

  const end = new THREE.Vector3().add(endB.startPos);
  const clearEnd = new THREE.Vector3().add(endB.startPos);

  if (
    (endB as MAIN_TYPES.PipeRackBeam).direction === "X" ||
    (endB as MAIN_TYPES.PipeRackCantilever).position === "Front" ||
    (endB as MAIN_TYPES.PipeRackCantilever).position === "Back"
  ) {
    (endB as MAIN_TYPES.PipeRackCantilever).position === "Front"
      ? end.setX(end.x - hb.endOffset)
      : end.setX(end.x + hb.endOffset);
    (endB as MAIN_TYPES.PipeRackCantilever).position === "Front"
      ? clearEnd.setX(clearEnd.x - hb.endOffset)
      : clearEnd.setX(clearEnd.x + hb.endOffset);
  } else {
    (endB as MAIN_TYPES.PipeRackCantilever).position === "Right"
      ? end.setZ(end.z + hb.endOffset)
      : end.setZ(end.z - hb.endOffset);
    (endB as MAIN_TYPES.PipeRackCantilever).position === "Right"
      ? clearEnd.setZ(clearEnd.z + hb.endOffset)
      : clearEnd.setZ(clearEnd.z - hb.endOffset);
  }
  const isAxesHelper =
    project.settings.models.axesHelper === "ALL" ||
    project.settings.models.axesHelper === hb.name;
  const defualtRotationX = getDefaultRotation(hb.profile);
  const hBracingMesh = createElementByProfile(
    start.distanceTo(end),
    isGray ? CONSTANTS.gray : CONSTANTS.hBracingColorRGB,
    // getColor(project, stressChecks, hb, hBracingColorRGB, min, max),
    hb.profile,
    isAxesHelper,
    defualtRotationX
  );
  const pos = new THREE.Vector3().addVectors(start, end).divideScalar(2);
  fixElevationOfBeamElement(hb, hBracingMesh, pos);
  hBracingMesh.position.copy(pos);
  const yRotation = UTILS.getRotationByLegs(start.x, start.z, end.x, end.z);
  hBracingMesh.rotateY(yRotation);
  hBracingMesh.rotateX(defualtRotationX);
  if (hb.orientation) hBracingMesh.rotateX(UTILS.degToRad(hb.orientation));
  hBracingMesh.name = hb.name;
  hBracingMesh.userData = {
    model: model.name,
    isModelItem: true,
    name: hb.name,
    modelStart: model.startPos,
    modelDir: model.direction,
    start: clearStart,
    end: clearEnd,
    profile: hb.profile,
    orientation: hb.orientation,
    releases: hb.releases,
    isAxesHelper: project.settings.models.axesHelper === hb.name,
  } as MAIN_TYPES.ModelItem;
  return hBracingMesh;
}

function drawAccessory(
  project: MAIN_TYPES.Project,
  model: MAIN_TYPES.PipeRack,
  ac: MAIN_TYPES.Accessory,
  tiers: number[],
  modelAnalysis?: UI_TYPES.ModelAnalysisUI,
  min = 0.3,
  max = 1,
  font?: THREE.Font,
  isGray?: boolean
) {
  return ac.elements
    .filter((el: MAIN_TYPES.AccessoryElement) => el.colItems.length)
    .map(
      (
        el:
          | MAIN_TYPES.TPostAccessory
          | MAIN_TYPES.FPostAccessory
          | MAIN_TYPES.ChristmasTreeAccessory
      ) => {
        const accessoryMesh = new THREE.Mesh();
        accessoryMesh.rotateY(UTILS.degToRad(ac.orientation));
        accessoryMesh.position.add(el.colItems[0].startPos);
        accessoryMesh.name = el.name;

        el.colItems.forEach((col) => {
          let colored: THREE.Mesh[] = [];
          if (modelAnalysis) {
            colored = drawColoredElement(
              project,
              model,
              col,
              modelAnalysis,
              min,
              max,
              font
            );
          }
          if (colored.length) {
            accessoryMesh.add(
              ...colored.map((c) => {
                c.position.sub(accessoryMesh.position);
                return c;
              })
            );
          } else {
            const startY = col.startPos.y - tiers[ac.tier];
            const endY = col.endPos.y - col.startPos.y + startY;
            const isAxesHelper =
              project.settings.models.axesHelper === "ALL" ||
              project.settings.models.axesHelper === col.name;
            const defualtRotationX = getDefaultRotation(col.profile);
            const colMesh = createElementByProfile(
              col.startPos.distanceTo(col.endPos),
              isGray ? CONSTANTS.gray : CONSTANTS.columnColorRGB,
              // getColor(project, stressChecks, col as Element, columnColorRGB, min, max),
              col.profile,
              isAxesHelper,
              defualtRotationX
            );
            colMesh.position
              .addVectors(
                new THREE.Vector3(0, startY, 0),
                new THREE.Vector3(0, endY, 0)
              )
              .divideScalar(2);
            colMesh.rotateZ(CONSTANTS.deg90InRad);
            colMesh.rotateX(
              CONSTANTS.deg90InRad +
                defualtRotationX +
                UTILS.degToRad(col.orientation)
            );
            colMesh.name = col.name;
            colMesh.userData = {
              model: model.name,
              isModelItem: true,
              name: col.name,
              modelStart: model.startPos,
              modelDir: model.direction,
              start: col.startPos,
              end: col.endPos,
              profile: col.profile,
              orientation: col.orientation,
              isAxesHelper: project.settings.models.axesHelper === col.name,
            } as MAIN_TYPES.ModelItem;
            accessoryMesh.add(colMesh);
          }
        });
        el.beamItems.forEach((beam) => {
          let colored: THREE.Mesh[] = [];
          if (modelAnalysis) {
            colored = drawColoredElement(
              project,
              model,
              beam,
              modelAnalysis,
              min,
              max,
              font
            );
          }
          if (colored.length) {
            accessoryMesh.add(
              ...colored.map((c) => {
                c.position.sub(accessoryMesh.position);
                return c;
              })
            );
          } else {
            const startPos = new THREE.Vector3(
              0,
              beam.startPos.y - tiers[ac.tier],
              0
            );
            const endPos = new THREE.Vector3(
              0,
              beam.endPos.y - tiers[ac.tier],
              beam.position === "R"
                ? beam.startPos.distanceTo(beam.endPos)
                : -beam.startPos.distanceTo(beam.endPos)
            );

            fixPointsOfBeamElement(startPos, endPos, model, beam, true, {
              profile: el.colProfile,
              orientation: el.colOrientation,
            });

            const isAxesHelper =
              project.settings.models.axesHelper === "ALL" ||
              project.settings.models.axesHelper === beam.name;
            const defualtRotationX = getDefaultRotation(beam.profile);
            const beamMesh = createElementByProfile(
              startPos.distanceTo(endPos),
              isGray ? CONSTANTS.gray : CONSTANTS.beamColorRGB,
              // getColor(project, stressChecks, beam as Element, beamColorRGB, min, max),
              beam.profile,
              isAxesHelper,
              defualtRotationX
            );
            const pos = new THREE.Vector3()
              .addVectors(startPos, endPos)
              .divideScalar(2);
            fixElevationOfBeamElement(beam, beamMesh, pos);
            beamMesh.position.copy(pos);
            beamMesh.rotateY(-CONSTANTS.deg90InRad);
            beamMesh.rotateX(
              defualtRotationX + UTILS.degToRad(beam.orientation)
            );
            beamMesh.name = beam.name;
            beamMesh.userData = {
              model: model.name,
              isModelItem: true,
              name: beam.name,
              modelStart: model.startPos,
              modelDir: model.direction,
              start: beam.startPos,
              end: beam.endPos,
              profile: beam.profile,
              orientation: beam.orientation,
              releases: beam.releases,
              isAxesHelper: project.settings.models.axesHelper === beam.name,
            } as MAIN_TYPES.ModelItem;
            accessoryMesh.add(beamMesh);
          }
        });
        return accessoryMesh;
      }
    );
}

function drawPlatform(
  project: MAIN_TYPES.Project,
  platform: MAIN_TYPES.PipeRackPlatform,
  from: MAIN_TYPES.PipeRackPortal,
  to: MAIN_TYPES.PipeRackPortal
) {
  const length = Math.abs(to.chainage - from.chainage);
  const material = new THREE.MeshBasicMaterial({
    color: UTILS.getRGB(CONSTANTS.platformColorRGB),
    transparent: project.settings.models.platformTransparency < 100,
    opacity: project.settings.models.platformTransparency / 100,
  });
  const platformMesh = new THREE.Mesh(
    new THREE.BoxBufferGeometry(length, platform.thickness, platform.width),
    material
  );
  platformMesh.position.set(
    from.chainage + length / 2,
    from.tiers[platform.tier] + platform.thickness / 2,
    0
  );
  switch (platform.side) {
    case "LEFT OUT":
      platformMesh.position.setZ(from.width / -2 - platform.width / 2);
      break;
    case "LEFT IN":
      platformMesh.position.setZ(from.width / -2 + platform.width / 2);
      break;
    case "RIGHT IN":
      platformMesh.position.setZ(from.width / 2 - platform.width / 2);
      break;
    case "RIGHT OUT":
      platformMesh.position.setZ(from.width / 2 + platform.width / 2);
      break;
  }
  platformMesh.name = platform.name;
  return platformMesh;
}

export function drawCircularBasePlate(
  bp: MAIN_TYPES.CircularBP,
  column: MAIN_TYPES.PipeRackColumn,
  fixedBolt?: boolean
) {
  const columnR = (column.profile.d_global ?? 0) / 2000;
  const plateR = bp.bPlateDiameter / 2000;
  const plateOffsetY = bp.bPlateThickness / 2000;
  const boltAngleRad = UTILS.degToRad(360 / bp.boltNos);
  const boltR = bp.boltDiameter / 2000;
  const boltH = boltR * 3;
  const bsdR = bp.boltBCD / 2000;
  const stiffenerAngleRad = UTILS.degToRad(360 / bp.sPlateNos);
  const width = bp.sPlateWidth / 1000;
  const height = bp.sPlateHeight / 1000;
  const depth = bp.sPlateThickness / 1000;
  const plate = new THREE.Mesh(
    new THREE.CylinderBufferGeometry(
      plateR,
      plateR,
      bp.bPlateThickness / 1000,
      32
    ),
    new THREE.MeshStandardMaterial({
      color: UTILS.getRGB(CONSTANTS.pedestalColor),
    })
  );
  plate.position.setY(plateOffsetY);
  plate.name = bp.name;
  for (let i = 0; i < bp.boltNos; i++) {
    plate.add(
      drawCircularBoltGroup(
        i,
        boltR,
        boltH,
        bsdR,
        boltAngleRad,
        plateOffsetY,
        fixedBolt
      )
    );
  }
  for (let i = 0; i < bp.sPlateNos; i++) {
    plate.add(
      drawCircularStiffener(
        i,
        columnR,
        plateOffsetY,
        stiffenerAngleRad,
        width,
        height,
        depth
      )
    );
  }
  return plate;
}

function drawCircularBoltGroup(
  i: number,
  boltR: number,
  boltH: number,
  bsdR: number,
  boltAngleRad: number,
  plateOffsetY: number,
  fixedBolt?: boolean
) {
  const boltGroup = new THREE.Mesh();
  boltGroup.name = `BG${i + 1}`;
  if (fixedBolt) {
    const g1 = new THREE.Mesh(
      new THREE.CylinderBufferGeometry(boltR * 2, boltR * 2, boltR),
      new THREE.MeshStandardMaterial({
        color: UTILS.fixRGB(CONSTANTS.pedestalColor),
      })
    );
    g1.name = `G1`;
    g1.position.setX(bsdR);
    g1.position.setY(boltR / 2);
    boltGroup.add(g1);
  } else {
    const bolt = new THREE.Mesh(
      new THREE.CylinderBufferGeometry(boltR, boltR, boltH),
      new THREE.MeshStandardMaterial({
        color: UTILS.fixRGB(CONSTANTS.pedestalColor),
      })
    );
    bolt.name = `Bolt${i + 1}`;
    bolt.position.setX(bsdR);
    bolt.position.setY(boltH / 2);
    const g1 = new THREE.Mesh(
      new THREE.CylinderBufferGeometry(boltR * 2, boltR * 2, boltR),
      new THREE.MeshStandardMaterial({
        color: UTILS.fixRGB(CONSTANTS.pedestalColor),
      })
    );
    g1.name = `${bolt.name}-G1`;
    g1.position.setX(bsdR);
    g1.position.setY(boltR / 2);
    const g2 = new THREE.Mesh(
      new THREE.CylinderBufferGeometry(boltR * 2, boltR * 2, boltR),
      new THREE.MeshStandardMaterial({
        color: UTILS.fixRGB(CONSTANTS.pedestalColor),
      })
    );
    g2.name = `${bolt.name}-G2`;
    g2.position.setX(bsdR);
    g2.position.setY(boltR * 1.5);
    boltGroup.add(bolt, g1, g2);
  }
  boltGroup.rotateY((i + 1) * boltAngleRad - boltAngleRad / 2);
  boltGroup.position.setY(plateOffsetY);
  return boltGroup;
}

function drawCircularStiffener(
  i: number,
  columnR: number,
  plateOffsetY: number,
  stiffenerAngleRad: number,
  width: number,
  height: number,
  depth: number
) {
  const stiffenerGroup = new THREE.Mesh();
  stiffenerGroup.name = `SG${i + 1}`;
  const stiffener = drawStiffener(width, height, depth);
  stiffener.name = `${stiffenerGroup.name}-S`;
  stiffener.position.set(columnR, plateOffsetY, depth / -2);
  stiffenerGroup.add(stiffener);
  stiffenerGroup.rotateY(i * stiffenerAngleRad);
  return stiffenerGroup;
}

export function drawRectangularBasePlate(
  bp: MAIN_TYPES.RectangularBP | MAIN_TYPES.RectangularSF,
  column: MAIN_TYPES.PipeRackColumn,
  fixedBolt?: boolean
) {
  const thicknessOffset = (column.profile.tw_global ?? 0) / 2000;
  const widthOffset = (column.profile.bf_global ?? 0) / 2000;
  const depthOffset = (column.profile.d_global ?? 0) / 2000;

  const plateW = bp.bPlateWidth / 1000;
  const plateT = bp.bPlateThickness / 1000;
  const plateL = bp.bPlateLength / 1000;

  const boltR = bp.boltDiameter / 2000;
  const boltH = boltR * 3;

  const stiffenerH = bp.sPlateHeight / 1000;
  const stiffenerT = bp.sPlateThickness / 1000;

  const plate = new THREE.Mesh(
    new THREE.BoxBufferGeometry(plateL, plateT, plateW),
    new THREE.MeshStandardMaterial({
      color: UTILS.getRGB(CONSTANTS.pedestalColor),
    })
  );
  plate.position.setY(plateT / 2);
  plate.name = bp.name;
  plate.add(...drawRectangularBolt(boltR, boltH, plateT / 2, bp, fixedBolt));
  plate.add(
    drawRectangularStiffener(
      plateL / 2 - depthOffset,
      stiffenerH,
      stiffenerT,
      depthOffset,
      widthOffset,
      thicknessOffset,
      plateT / 2,
      "+X",
      bp.alongFlange
    ),
    drawRectangularStiffener(
      plateW / 2 - widthOffset,
      stiffenerH,
      stiffenerT,
      depthOffset,
      widthOffset,
      thicknessOffset,
      plateT / 2,
      "+Z",
      bp.alongWeb
    ),
    drawRectangularStiffener(
      plateL / 2 - depthOffset,
      stiffenerH,
      stiffenerT,
      depthOffset,
      widthOffset,
      thicknessOffset,
      plateT / 2,
      "-X",
      bp.alongFlange
    ),
    drawRectangularStiffener(
      plateW / 2 - widthOffset,
      stiffenerH,
      stiffenerT,
      depthOffset,
      widthOffset,
      thicknessOffset,
      plateT / 2,
      "-Z",
      bp.alongWeb
    )
  );
  plate.rotateY(CONSTANTS.deg90InRad + UTILS.degToRad(column.orientation ?? 0));
  return plate;
}

function drawRectangularBolt(
  radius: number,
  height: number,
  heightOffset: number,
  bp: MAIN_TYPES.RectangularBP,
  fixedBolt?: boolean
) {
  const fL = bp.firstRow_L / 1000;
  const rL = bp.RtoR_L / 1000;
  const fW = bp.firstRow_W / 1000;
  const rW = bp.RtoR_W / 1000;
  const bolts: THREE.Mesh[] = [];
  for (let i = 0; i < bp.alongLength; i++) {
    const coefI = i % 2 === 0 ? -1 : 1;
    for (let j = 0; j < bp.alongWidth; j++) {
      const coefJ = j % 2 === 0 ? -1 : 1;
      const bolt = drawBolt(radius, height, heightOffset, i, j, fixedBolt);
      if (i === 0 || i === 1) {
        bolt.position.setX(fL * coefI);
      } else {
        bolt.position.setX((fL + rL * Math.floor(i / 2)) * coefI);
      }
      if (j === 0 || j === 1) {
        bolt.position.setZ(fW * coefJ);
      } else {
        bolt.position.setZ((fW + rW * Math.floor(j / 2)) * coefJ);
      }
      bolts.push(bolt);
    }
  }
  return bolts;
}

function drawBolt(
  radius: number,
  height: number,
  heightOffset: number,
  i: number,
  j: number,
  fixedBolt?: boolean
) {
  const boltGroup = new THREE.Mesh();
  boltGroup.name = `BG${i + 1}-${j + 1}`;
  if (fixedBolt) {
    const g1 = new THREE.Mesh(
      new THREE.CylinderBufferGeometry(radius * 2, radius * 2, radius),
      new THREE.MeshStandardMaterial({
        color: UTILS.fixRGB(CONSTANTS.pedestalColor),
      })
    );
    g1.name = `G1`;
    g1.position.setY(radius / 2);
    boltGroup.add(g1);
  } else {
    const bolt = new THREE.Mesh(
      new THREE.CylinderBufferGeometry(radius, radius, height),
      new THREE.MeshStandardMaterial({
        color: UTILS.fixRGB(CONSTANTS.pedestalColor),
      })
    );
    bolt.name = `Bolt${i + 1}-${j + 1}`;
    bolt.position.setY(height / 2);
    const g1 = new THREE.Mesh(
      new THREE.CylinderBufferGeometry(radius * 2, radius * 2, radius),
      new THREE.MeshStandardMaterial({
        color: UTILS.fixRGB(CONSTANTS.pedestalColor),
      })
    );
    g1.name = `${bolt.name}-G1`;
    g1.position.setY(radius / 2);
    const g2 = new THREE.Mesh(
      new THREE.CylinderBufferGeometry(radius * 2, radius * 2, radius),
      new THREE.MeshStandardMaterial({
        color: UTILS.fixRGB(CONSTANTS.pedestalColor),
      })
    );
    g2.name = `${bolt.name}-G2`;
    g2.position.setY(radius * 1.5);
    boltGroup.add(bolt, g1, g2);
  }
  boltGroup.position.setY(heightOffset);
  return boltGroup;
}

function drawRectangularStiffener(
  width: number,
  height: number,
  depth: number,
  depthOffset: number,
  widthOffset: number,
  thicknessOffset: number,
  heightOffset: number,
  direction: MAIN_TYPES.Direction2,
  count: 1 | 2 | 3
) {
  const stiffenerGroup = new THREE.Mesh();
  stiffenerGroup.name = `SG(${direction})`;
  const stiffeners: THREE.Mesh[] = [];
  for (let i = 0; i < count; i++) {
    let stiffener;
    if (count === 1 || (count === 3 && i === 1)) {
      if (direction === "+X" || direction === "-X") {
        stiffener = drawStiffener(width, height, depth);
        stiffener.position.set(depthOffset, heightOffset, depth / -2);
      } else {
        stiffener = drawStiffener(
          width + widthOffset - thicknessOffset,
          height,
          depth
        );
        stiffener.position.set(thicknessOffset, heightOffset, depth / -2);
      }
    } else {
      stiffener = drawStiffener(width, height, depth);
      if (direction === "+X" || direction === "-X") {
        if ((count === 2 || count === 3) && i === 0)
          stiffener.position.set(depthOffset, heightOffset, -widthOffset);
        if ((count === 2 && i === 1) || (count === 3 && i === 2))
          stiffener.position.set(
            depthOffset,
            heightOffset,
            widthOffset - depth
          );
      } else {
        if ((count === 2 || count === 3) && i === 0)
          stiffener.position.set(widthOffset, heightOffset, -depthOffset);
        if ((count === 2 && i === 1) || (count === 3 && i === 2))
          stiffener.position.set(
            widthOffset,
            heightOffset,
            depthOffset - depth
          );
      }
    }
    stiffener.name = `${stiffenerGroup.name}-S${i + 1}`;
    stiffeners.push(stiffener);
  }
  stiffenerGroup.add(...stiffeners);
  if (direction === "-X") stiffenerGroup.rotateY(CONSTANTS.deg180InRad);
  if (direction === "-Z") stiffenerGroup.rotateY(CONSTANTS.deg90InRad);
  if (direction === "+Z") stiffenerGroup.rotateY(-CONSTANTS.deg90InRad);
  return stiffenerGroup;
}

function drawStiffener(width: number, height: number, depth: number) {
  const shape = new THREE.Shape();
  shape.moveTo(0, 0);
  shape.lineTo(width, 0);
  shape.lineTo(width, 0.025);
  shape.lineTo(0.025, height);
  shape.lineTo(0, height);
  shape.autoClose = true;
  return new THREE.Mesh(
    new THREE.ExtrudeBufferGeometry(shape, {
      depth,
      bevelEnabled: false,
      steps: 1,
    }),
    new THREE.MeshStandardMaterial({
      color: UTILS.fixRGB(CONSTANTS.pedestalColor),
    })
  );
}

function drawCircularSliceFlange(
  sf: MAIN_TYPES.CircularSF,
  column: MAIN_TYPES.PipeRackColumn,
  secondColumn: MAIN_TYPES.PipeRackColumn
) {
  const sliceFlange = new THREE.Mesh();
  sliceFlange.name = `CSF-${column.name}`;
  sliceFlange.add(drawCircularBasePlate(sf, secondColumn, true));
  const down = drawCircularBasePlate(
    {
      ...sf,
      bPlateThickness: sf.bBottomPlateThickness,
      bPlateDiameter: sf.bBottomPlateDiameter,
    } as MAIN_TYPES.CircularBP,
    column
  );
  down.rotateY(CONSTANTS.deg180InRad);
  down.rotateZ(CONSTANTS.deg180InRad);
  down.position.setY(sf.bBottomPlateThickness / -2000);
  sliceFlange.add(down);
  sliceFlange.position.set(column.startPos.x, sf.elevation, column.startPos.z);
  return sliceFlange;
}

function drawRectangularSliceFlange(
  sf: MAIN_TYPES.RectangularSF,
  column: MAIN_TYPES.PipeRackColumn,
  secondColumn: MAIN_TYPES.PipeRackColumn
) {
  const sliceFlange = new THREE.Mesh();
  sliceFlange.name = `RSF-${column.name}`;
  sliceFlange.add(drawRectangularBasePlate(sf, secondColumn, true));
  const down = drawRectangularBasePlate(
    {
      ...sf,
      bPlateThickness: sf.bBottomPlateThickness,
      bPlateLength: sf.bBottomPlateLength,
      bPlateWidth: sf.bBottomPlateWidth,
    } as MAIN_TYPES.RectangularBP,
    column
  );
  down.rotateZ(CONSTANTS.deg180InRad);
  down.position.setY(sf.bBottomPlateThickness / -2000);
  sliceFlange.add(down);
  sliceFlange.position.set(column.startPos.x, sf.elevation, column.startPos.z);
  return sliceFlange;
}

export function drawRawLadder(
  id: number,
  width: number,
  height: number,
  distance: number,
  profile?: Section,
  color: number[] = [0, 253, 251],
) {
  const plParams = {
    id: 1,
    name: "L1",
    parent: "PR1-PL1",
    type: "Ladder",
    platform: "PR1-PL1",
    onFace: "Front",
    distanceFromLeft: 1,
    fromEL: 0,
  };
  const params = {
    lib: "British",
    profile: {
      profile_section_id: 1351,
      name: "UB203X133X30",
      type: "UB Shape",
      designation: "UB203X133X30",
      country_code: "British",
      ax: 38.2,
      b: null,
      bf: 133.9,
      c: null,
      ct: 2.11,
      d: 206.8,
      de: null,
      i: null,
      ix: 10.3,
      iy: 385,
      iz: 2900,
      k: null,
      k1: null,
      od: null,
      r1: null,
      r2: null,
      rz: null,
      t: null,
      tf: 9.6,
      tw: 6.4,
      z: null,
      zx: 314,
      zy: 88.2,
      zz: null,
      shape: "I",
      width: 133.9,
      thickness: 9.6,
      height: 206.8,
      width_global: 133.9,
      thickness_global: 9.6,
      height_global: 206.8,
      ax_global: 3820,
      b_global: null,
      bf_global: 133.9,
      c_global: null,
      ct_global: 21.1,
      d_global: 206.8,
      de_global: null,
      i_global: null,
      ix_global: 103000,
      iy_global: 3850000,
      iz_global: 29000000,
      k_global: null,
      k1_global: null,
      od_global: null,
      r1_global: null,
      r2_global: null,
      rz_global: null,
      t_global: null,
      tf_global: 9.6,
      tw_global: 6.4,
      z_global: null,
      zx_global: 314000,
      zy_global: 88200,
      zz_global: null,
      created_by: null,
      updated_by: null,
      created_on: null,
      updated_on: null,
      _links: {
        self: {
          href: "http://testing.asets-ca.com/rest/profilesectiondata/1351",
        },
        profileSection: {
          href: "http://testing.asets-ca.com/rest/profilesectiondata/1351",
        },
      },
    },
    spacing: 2000,
    rungDia: 300,
    rungSpacing: 2000,
    CHBw: 0,
    CHBt: 0,
    CHBs: 0,
    CHBd: 0,
    CVBw: 0,
    CVBt: 0,
    CVBnos: 0,
    CHR: 1,
  };
  const stringerSpacing = width;
  const leftPos = stringerSpacing / -2;
  const rightPos = stringerSpacing / 2;

  const rungRadius = (width / 2) * 0.15;
  const rungSpacing = width;
  const rungCount = Math.floor(height / rungSpacing);

  const ladder = new THREE.Mesh();
  ladder.name = `LadderOF-LD${id}`;
  const CHR = width / 2;
  const stringerH = height + CHR;
  if (!profile)
    profile = {
      profile_section_id: 1351,
      name: "UB203X133X30",
      type: "UB Shape",
      designation: "UB203X133X30",
      country_code: "British",
      ax: 38.2,
      b: null,
      bf: 133.9,
      c: null,
      ct: 2.11,
      d: 206.8,
      de: null,
      i: null,
      ix: 10.3,
      iy: 385,
      iz: 2900,
      k: null,
      k1: null,
      od: null,
      r1: null,
      r2: null,
      rz: null,
      t: null,
      tf: 9.6,
      tw: 6.4,
      z: null,
      zx: 314,
      zy: 88.2,
      zz: null,
      shape: "I",
      width: 133.9,
      thickness: 9.6,
      height: 206.8,
      width_global: 133.9,
      thickness_global: 9.6,
      height_global: 206.8,
      ax_global: 3820,
      b_global: null,
      bf_global: 133.9,
      c_global: null,
      ct_global: 21.1,
      d_global: 206.8,
      de_global: null,
      i_global: null,
      ix_global: 103000,
      iy_global: 3850000,
      iz_global: 29000000,
      k_global: null,
      k1_global: null,
      od_global: null,
      r1_global: null,
      r2_global: null,
      rz_global: null,
      t_global: null,
      tf_global: 9.6,
      tw_global: 6.4,
      z_global: null,
      zx_global: 314000,
      zy_global: 88200,
      zz_global: null,
      created_by: null,
      updated_by: null,
      created_on: null,
      updated_on: null,
      _links: {
        self: {
          href: "http://testing.asets-ca.com/rest/profilesectiondata/1351",
        },
        profileSection: {
          href: "http://testing.asets-ca.com/rest/profilesectiondata/1351",
        },
      },
    };
  const defualtRotationX = getDefaultRotation(profile);

  const left = createElementByProfile(stringerH, color, profile!);
  left.scale.set(1, 0.3, 0.3);
  left.position.set(leftPos, stringerH / 2, 0);
  left.rotateZ(CONSTANTS.deg90InRad);
  left.rotateX(defualtRotationX);
  left.name = `${ladder.name}-SL`;

  const right = createElementByProfile(stringerH, color, profile!);
  right.scale.set(1, 0.3, 0.3);
  right.position.set(rightPos, stringerH / 2, 0);
  right.rotateZ(CONSTANTS.deg90InRad);
  right.rotateX(defualtRotationX);
  right.name = `${ladder.name}-SR`;

  for (let i = 0; i < rungCount; i++) {
    ladder.add(
      createRungWithColor(
        ladder.name,
        i + 1,
        rungRadius,
        stringerSpacing,
        height - rungSpacing * i,
        color,
      )
    );
  }

  const CHBw = UTILS.MMtoM(0);
  const CHBd = UTILS.MMtoM(0);
  const CHBt = UTILS.MMtoM(0);
  const CHBs = UTILS.MMtoM(0);
  const CHBcount = Math.floor(height / CHBs);

  if (CHBw && CHBd && CHBd > stringerSpacing && CHBt && CHBs) {
    const offset = Math.sqrt(
      Math.pow(CHBd / 2, 2) - Math.pow(stringerSpacing / 2, 2)
    );
    const angle = Math.asin(stringerSpacing / CHBd);

    // const curve = new EllipseCurve(
    //   0, 0,            // ax, aY
    //   CHBd / 2, CHBd / 2,           // xRadius, yRadius
    //   angle, -angle,
    //   false,
    //   0
    // );
    // const points = curve.getPoints(16);
    // const ellipse = new Line(
    //   new BufferGeometry().setFromPoints(points),
    //   new LineBasicMaterial({ color: 0xff0000, linewidth: CHBw })
    // );

    const arcShape = new THREE.Shape();
    arcShape.autoClose = false;
    arcShape.absarc(0, 0, CHBd / 2 + CHBt / 2, angle, -angle, false);
    const holePath = new THREE.Path();
    holePath.autoClose = false;
    holePath.absarc(0, 0, CHBd / 2 - CHBt / 2, 0, CONSTANTS.deg360InRad, false);
    arcShape.holes.push(holePath);

    for (let i = 0; i < CHBcount; i++) {
      // const iEl = ellipse.clone();
      // iEl.position.set(0, height - CHBs * i + params.CHR, offset);
      // iEl.rotateX(deg90InRad);
      // iEl.rotateZ(-deg90InRad)
      // ladder.add(iEl)
      ladder.add(
        createCHB(
          ladder.name,
          i + 1,
          arcShape,
          CHBw,
          offset,
          height - CHBs * i + CHR
        )
      );
    }
  }

  ladder.add(left, right);

  ladder.position.setY(plParams.fromEL);
  return ladder;
}

function drawLadder(
  pl: MAIN_TYPES.PipeRackPlatform,
  from: MAIN_TYPES.PipeRackPortal,
  to: MAIN_TYPES.PipeRackPortal,
  params: MAIN_TYPES.LadderParams,
  plParams: MAIN_TYPES.Ladder
) {
  const height = from.tiers[pl.tier] - plParams.fromEL;

  const stringerSpacing = UTILS.MMtoM(params.spacing);
  const leftPos = stringerSpacing / -2;
  const rightPos = stringerSpacing / 2;

  const rungRadius = UTILS.MMtoM(params.rungDia) / 2;
  const rungSpacing = UTILS.MMtoM(params.rungSpacing);
  const rungCount = Math.floor(height / rungSpacing);

  const ladder = new THREE.Mesh();
  ladder.name = `${pl.name}-LD${plParams.id}`;

  const stringerH = height + params.CHR;

  const defualtRotationX = getDefaultRotation(params.profile);

  const left = createElementByProfile(
    stringerH,
    [255, 153, 51],
    params.profile!
  );
  left.position.set(leftPos, stringerH / 2, 0);
  left.rotateZ(CONSTANTS.deg90InRad);
  left.rotateX(defualtRotationX);
  left.name = `${ladder.name}-SL`;

  const right = createElementByProfile(
    stringerH,
    [255, 153, 51],
    params.profile!
  );
  right.position.set(rightPos, stringerH / 2, 0);
  right.rotateZ(CONSTANTS.deg90InRad);
  right.rotateX(defualtRotationX);
  right.name = `${ladder.name}-SR`;

  for (let i = 0; i < rungCount; i++) {
    ladder.add(
      createRung(
        ladder.name,
        i + 1,
        rungRadius,
        stringerSpacing,
        height - rungSpacing * i
      )
    );
  }

  const CHBw = UTILS.MMtoM(params.CHBw);
  const CHBd = UTILS.MMtoM(params.CHBd);
  const CHBt = UTILS.MMtoM(params.CHBt);
  const CHBs = UTILS.MMtoM(params.CHBs);
  const CHBcount = Math.floor(height / CHBs);

  if (CHBw && CHBd && CHBd > stringerSpacing && CHBt && CHBs) {
    const offset = Math.sqrt(
      Math.pow(CHBd / 2, 2) - Math.pow(stringerSpacing / 2, 2)
    );
    const angle = Math.asin(stringerSpacing / CHBd);

    // const curve = new EllipseCurve(
    //   0, 0,            // ax, aY
    //   CHBd / 2, CHBd / 2,           // xRadius, yRadius
    //   angle, -angle,
    //   false,
    //   0
    // );
    // const points = curve.getPoints(16);
    // const ellipse = new Line(
    //   new BufferGeometry().setFromPoints(points),
    //   new LineBasicMaterial({ color: 0xff0000, linewidth: CHBw })
    // );

    const arcShape = new THREE.Shape();
    arcShape.autoClose = false;
    arcShape.absarc(0, 0, CHBd / 2 + CHBt / 2, angle, -angle, false);
    const holePath = new THREE.Path();
    holePath.autoClose = false;
    holePath.absarc(0, 0, CHBd / 2 - CHBt / 2, 0, CONSTANTS.deg360InRad, false);
    arcShape.holes.push(holePath);

    for (let i = 0; i < CHBcount; i++) {
      // const iEl = ellipse.clone();
      // iEl.position.set(0, height - CHBs * i + params.CHR, offset);
      // iEl.rotateX(deg90InRad);
      // iEl.rotateZ(-deg90InRad)
      // ladder.add(iEl)
      ladder.add(
        createCHB(
          ladder.name,
          i + 1,
          arcShape,
          CHBw,
          offset,
          height - CHBs * i + params.CHR
        )
      );
    }
  }

  ladder.add(left, right);

  switch (plParams.onFace) {
    case "Back":
      ladder.rotateY(CONSTANTS.deg90InRad);
      ladder.position.setX(to.chainage);
      ladder.position.setZ(
        to.width / 2 - plParams.distanceFromLeft - stringerSpacing / 2
      );
      break;
    case "Left":
      ladder.rotateY(CONSTANTS.deg90InRad);
      ladder.position.setX(
        to.chainage - plParams.distanceFromLeft - stringerSpacing / 2
      );
      ladder.position.setZ(to.width / -2);
      break;
    case "Front":
      ladder.rotateY(-CONSTANTS.deg90InRad);
      ladder.position.setX(from.chainage);
      ladder.position.setZ(
        to.width / -2 + plParams.distanceFromLeft + stringerSpacing / 2
      );
      break;
    case "Right":
      ladder.position.setX(
        from.chainage + plParams.distanceFromLeft + stringerSpacing / 2
      );
      ladder.position.setZ(to.width / 2);
  }
  ladder.position.setY(plParams.fromEL);

  return ladder;
}
function createRungWithColor(
  ladder: string,
  i: number,
  radius: number,
  spacing: number,
  height: number,
  color: number[]
) {
  const rung = new THREE.Mesh(
    new THREE.CylinderBufferGeometry(radius, radius, spacing),
    new THREE.MeshStandardMaterial({ color: UTILS.getRGB(color) })
  );
  rung.name = `${ladder}-RUNG${i}`;
  rung.position.setY(height);
  rung.rotateZ(CONSTANTS.deg90InRad);
  return rung;
}

function createRung(
  ladder: string,
  i: number,
  radius: number,
  spacing: number,
  height: number
) {
  const rung = new THREE.Mesh(
    new THREE.CylinderBufferGeometry(radius, radius, spacing),
    new THREE.MeshStandardMaterial({ color: "rgb(255,153,51)" })
  );
  rung.name = `${ladder}-RUNG${i}`;
  rung.position.setY(height);
  rung.rotateZ(CONSTANTS.deg90InRad);
  return rung;
}

function createCHB(
  ladder: string,
  i: number,
  arcShape: THREE.Shape,
  depth: number,
  offset: number,
  height: number
) {
  const CHB = new THREE.Mesh(
    new THREE.ExtrudeBufferGeometry(arcShape, {
      steps: 1,
      bevelEnabled: false,
      curveSegments: 32,
      depth,
    }),
    new THREE.MeshBasicMaterial({ color: "rgb(255,153,51)" })
  );
  CHB.name = `${ladder}-CHB${i}`;
  CHB.position.setY(height);
  CHB.position.setZ(offset);
  CHB.rotateX(CONSTANTS.deg90InRad);
  CHB.rotateZ(-CONSTANTS.deg90InRad);
  return CHB;
}
