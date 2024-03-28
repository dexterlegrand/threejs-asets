import * as THREE from "three";
import { TPSS, TPSSConveyor, ERackColor } from "../../../store/pss/types";
import { deg90InRad } from "../../../store/main/constants";
import { checkRange, getPosByDistance, getOrientationByDirection, degToRad } from "../utils";

function createConveyors(data: TPSS) {
  const group = new THREE.Group();
  group.name = "PSS";
  for (const item of data.conveyors) {
    if (!item.length) continue;
    const model = createConveyor(data, item);
    group.add(model);
  }
  group.userData = { animate };
  return group;
}

function fixBoxPos(
  obj: THREE.Object3D,
  index: number,
  tier: number,
  size: number,
  pos?: THREE.Vector3
) {
  const s_4 = size / 4;
  const s_10 = size / 10;
  const s_20 = s_10 / 2;
  switch (index) {
    case 0:
      obj.position.set(s_4, tier * s_10 + tier * s_20, -s_4);
      break;
    case 1:
      obj.position.set(s_4, tier * s_10 + tier * s_20, s_4);
      break;
    case 2:
      obj.position.set(-s_4, tier * s_10 + tier * s_20, s_4);
      break;
    case 3:
      obj.position.set(-s_4, tier * s_10 + tier * s_20, -s_4);
      break;
  }
  pos && obj.position.add(pos);
}

function createConveyor(data: TPSS, item: TPSSConveyor, size = 1) {
  const group = new THREE.Group();
  const start = new THREE.Vector3(item.x, item.y, item.z);
  const end = start.clone();
  switch (item.direction) {
    case "+X":
      end.setX(start.x + item.length);
      break;
    case "-X":
      end.setX(start.x - item.length);
      break;
    case "+Z":
      end.setZ(start.z + item.length);
      break;
    case "-Z":
      end.setZ(start.z - item.length);
      break;
  }
  group.position.copy(start);
  group.lookAt(end);
  group.rotateY(-deg90InRad);
  let count = Math.round(item.length);
  if (count < 2) count = 2;
  const l_2 = item.length / 2;
  const s_2 = size / 2;
  const s_10 = size / 10;
  const s_20 = s_10 / 2;
  const mc = count / 2 - 1;
  const sl = item.length / (mc + 1);
  const bl = new THREE.Mesh(
    new THREE.BoxGeometry(item.length, s_10, s_10),
    new THREE.MeshLambertMaterial({ color: "gray" })
  );
  const br = bl.clone();
  bl.position.set(l_2, item.height, -s_2);
  br.position.set(l_2, item.height, s_2);
  if (item.height) {
    const column = new THREE.Mesh(
      new THREE.BoxGeometry(s_10, item.height, s_10),
      new THREE.MeshLambertMaterial({ color: "gray" })
    );
    column.position.setY(-item.height / 2);
    const fcl = column.clone();
    fcl.position.setX(-l_2 + s_20);
    const lcl = column.clone();
    lcl.position.setX(l_2 - s_20);
    bl.add(fcl, lcl);
    const fcr = column.clone();
    fcr.position.setX(-l_2 + s_20);
    const lcr = column.clone();
    lcr.position.setX(l_2 - s_20);
    br.add(fcr, lcr);
    for (let i = 1; i <= mc; i++) {
      const x = -l_2 + sl * i;
      const mcl = column.clone();
      mcl.position.setX(x);
      bl.add(mcl);
      const mcr = column.clone();
      mcr.position.setX(x);
      br.add(mcr);
    }
  }
  const roll = new THREE.Mesh(
    new THREE.CylinderGeometry(s_20, s_20, size, 32, 1),
    new THREE.MeshLambertMaterial({ color: "white" })
  );
  roll.position.setY(item.height);
  roll.rotateX(deg90InRad);
  for (let i = 0, len = Math.round(item.length / s_10); i < len; i++) {
    const ri = roll.clone();
    ri.position.setX(s_10 * i + s_20);
    group.add(ri);
  }
  group.add(bl, br);
  group.userData = {
    height: item.height,
    length: item.length,
    speed: item.speed,
    left: [],
    right: [],
    racks: [],
  };
  const racksPosition = getPosByDistance(-1, start, end);
  const racks = createRacks(group, racksPosition, data.racks);
  group.userData = { ...group.userData, rPos: racksPosition.clone(), racks };
  if (item.EGVSpeed && item.EGVRacksPerTrip) {
    const egv = createEGV(item.EGVRacksPerTrip);
    const startEGV = item.EGVPath[0];
    startEGV && egv.position.set(startEGV.x, startEGV.y, startEGV.z);
    group.add(egv);
    const egvPath: any[] = [];
    for (let i = 0, len = item.EGVPath.length; i < len; i++) {
      if (i === len - 1) {
        const p1 = item.EGVPath[i];
        const p1v = new THREE.Vector3(p1.x, p1.y, p1.z)
          .sub(start)
          .applyAxisAngle(
            new THREE.Vector3(0, 1),
            degToRad(getOrientationByDirection(item.direction))
          );
        const p2v = new THREE.Vector3(-2);
        const path = new THREE.Mesh(
          new THREE.CylinderGeometry(s_20, s_20, p1v.distanceTo(p2v)),
          new THREE.MeshBasicMaterial({ color: "black" })
        );
        egvPath.push({ start: p1v, end: p2v, distance: p1v.distanceTo(p2v) });
        path.position.copy(p1v);
        path.lookAt(p2v);
        path.position.add(p2v).divideScalar(2);
        path.rotateX(deg90InRad);
        group.add(path);
      } else {
        const p1 = item.EGVPath[i];
        const p2 = item.EGVPath[i + 1];
        const p1v = new THREE.Vector3(p1.x, p1.y, p1.z)
          .sub(start)
          .applyAxisAngle(
            new THREE.Vector3(0, 1),
            degToRad(getOrientationByDirection(item.direction))
          );
        const p2v = new THREE.Vector3(p2.x, p2.y, p2.z)
          .sub(start)
          .applyAxisAngle(
            new THREE.Vector3(0, 1),
            degToRad(getOrientationByDirection(item.direction))
          );
        egvPath.push({ start: p1v, end: p2v, distance: p1v.distanceTo(p2v) });
        const path = new THREE.Mesh(
          new THREE.CylinderGeometry(s_20, s_20, p1v.distanceTo(p2v)),
          new THREE.MeshBasicMaterial({ color: "black" })
        );
        path.position.copy(p1v);
        path.lookAt(p2v);
        path.position.add(p2v).divideScalar(2);
        path.rotateX(deg90InRad);
        group.add(path);
      }
    }
    egv.userData = {
      ...egv.userData,
      EGVSpeed: item.EGVSpeed,
      index: 0,
      distance: 0,
      egvPath,
      started: false,
      finished: false,
      racksCount: item.EGVRacksPerTrip,
    };
  }
  const left: any[] = [];
  if (item.peopleCountL) {
    for (let i = 0; i < item.peopleCountL; i++) {
      const color = item.peopleRackAssignmentL[i].color;
      const position = new THREE.Vector3(
        item.peopleStartPositionL + item.peopleSpacingL * i,
        0,
        -size
      );
      const panel = new THREE.Mesh(
        new THREE.BoxGeometry(size, 0.001, size),
        new THREE.MeshLambertMaterial({ color: getColor(color), wireframe: true })
      );
      panel.position.copy(position);
      panel.userData = { index: 0, tier: 0 };
      group.add(panel);
      left.push({ id: panel.uuid, position, color });
    }
  }
  const right: any[] = [];
  if (item.peopleCountR) {
    for (let i = 0; i < item.peopleCountR; i++) {
      const color = item.peopleRackAssignmentR[i].color;
      const position = new THREE.Vector3(
        item.peopleStartPositionR + item.peopleSpacingR * i,
        0,
        size
      );
      const panel = new THREE.Mesh(
        new THREE.BoxGeometry(size, 0.001, size),
        new THREE.MeshLambertMaterial({ color: getColor(color), wireframe: true })
      );
      panel.position.copy(position);
      panel.userData = { index: 0, tier: 0 };
      group.add(panel);
      right.push({ id: panel.uuid, position, color });
    }
  }
  group.userData = { ...group.userData, left, right, missedIndex: 0, missedTier: 0 };
  return group;
}

function createRacks(
  obj: THREE.Object3D,
  pos: THREE.Vector3,
  count: number,
  i = 0,
  t = 0,
  size = 1
) {
  let r = i;
  let tier = t;
  const racks: any[] = [];
  for (let i = 0; i < count; i++) {
    const rack = createRack();
    fixBoxPos(rack, r, tier, size);
    rack.position.add(pos);
    rack.userData = { ...rack.userData, initialPos: rack.position.clone() };
    obj.add(rack);
    racks.unshift({ id: rack.uuid });
    if (r === 3) {
      r = 0;
      tier++;
    } else r++;
  }
  return racks;
}

function createRack(size = 1) {
  const s_2 = size / 2;
  const s_10 = size / 10;
  const colorRnd = Math.random();
  let color;
  let userData = {};
  if (checkRange(colorRnd, 0, 0.25, true, false)) {
    color = getColor(ERackColor.RED);
    userData = { color: ERackColor.RED, size };
  } else if (checkRange(colorRnd, 0.25, 0.5, true, false)) {
    color = getColor(ERackColor.GREEN);
    userData = { color: ERackColor.GREEN, size };
  } else if (checkRange(colorRnd, 0.5, 0.75, true, false)) {
    color = getColor(ERackColor.BLUE);
    userData = { color: ERackColor.BLUE, size };
  } else {
    color = getColor(ERackColor.YELLOW);
    userData = { color: ERackColor.YELLOW, size };
  }
  const rack = new THREE.Mesh(
    new THREE.BoxGeometry(s_2, s_10, s_2),
    new THREE.MeshLambertMaterial({ color })
  );
  rack.userData = { ...userData, started: false, finished: false };
  return rack;
}

function getColor(color: ERackColor) {
  return color.toLowerCase();
}

function createEGV(racksCount: number, size = 1) {
  const s_2 = size / 2;
  const s_4 = s_2 / 2;
  const s_8 = s_4 / 2;
  const s_16 = s_8 / 2;
  const egv = new THREE.Group();
  const m1 = new THREE.Mesh(
    new THREE.BoxGeometry(size - s_4, s_4, size),
    new THREE.MeshLambertMaterial({ color: "yellow" })
  );
  m1.position.setX(-s_8).setY(s_4);
  const m2 = new THREE.Mesh(
    new THREE.BoxGeometry(size + s_2, s_4, size),
    new THREE.MeshLambertMaterial({ color: "gray" })
  );
  m2.position.setX(-s_8).setY(s_2);
  const m3 = new THREE.Mesh(
    new THREE.BoxGeometry(size, s_4, size),
    new THREE.MeshLambertMaterial({ color: "yellow" })
  );
  m3.position.setX(-s_4).setY(size - s_4);

  const wheel = new THREE.Mesh(
    new THREE.CylinderGeometry(s_4, s_4, s_8),
    new THREE.MeshLambertMaterial({ color: "black" })
  );
  const w1 = wheel.clone();
  w1.position.set(-s_2 - s_4, s_8, -s_2 + s_8);
  w1.rotateX(deg90InRad);
  const w2 = wheel.clone();
  w2.position.set(-s_2 - s_4, s_8, s_2 - s_8);
  w2.rotateX(deg90InRad);
  const w3 = wheel.clone();
  w3.position.set(s_2, s_8, -s_2 + s_8);
  w3.rotateX(deg90InRad);
  const w4 = wheel.clone();
  w4.position.set(s_2, s_8, s_2 - s_8);
  w4.rotateX(deg90InRad);

  const ax = new THREE.Mesh(
    new THREE.CylinderGeometry(s_16, s_16, size - s_4),
    new THREE.MeshLambertMaterial({ color: "black" })
  );
  ax.position.setY(s_8);
  const ax1 = ax.clone();
  ax1.position.setX(-s_2 - s_4);
  ax1.rotateX(deg90InRad);
  const ax2 = ax.clone();
  ax2.position.setX(s_2);
  ax2.rotateX(deg90InRad);

  const tube1 = new THREE.Mesh(
    new THREE.CylinderGeometry(s_16, s_16, size),
    new THREE.MeshLambertMaterial({ color: "black" })
  );

  const t1 = tube1.clone();
  t1.position.set(-s_2, size + s_4, -s_2 + s_16);
  const t2 = tube1.clone();
  t2.position.set(-s_2, size + s_4, s_2 - s_16);
  const t3 = tube1.clone();
  t3.position.set(-s_2, size * 2 - s_4, 0);
  t3.rotateX(deg90InRad);
  const t4 = t3.clone();
  t4.position.setX(s_4);

  const tube2 = new THREE.Mesh(
    new THREE.CylinderGeometry(s_16, s_16, size - s_4),
    new THREE.MeshLambertMaterial({ color: "black" })
  );
  const t1_2 = tube2.clone();
  t1_2.position.set(-s_8, size * 2 - s_4, -s_2 + s_16);
  t1_2.rotateZ(deg90InRad);
  const t2_2 = tube2.clone();
  t2_2.position.set(-s_8, size * 2 - s_4, s_2 - s_16);
  t2_2.rotateZ(deg90InRad);

  const tube3 = new THREE.Mesh(
    new THREE.CylinderGeometry(s_16, s_16, size + s_2),
    new THREE.MeshLambertMaterial({ color: "black" })
  );
  tube3.position.set(s_2, s_4, 0);
  tube3.lookAt(new THREE.Vector3(-s_8, size * 2 - s_4));
  tube3.rotateX(-deg90InRad);
  tube3.position.add(new THREE.Vector3(s_2, size * 2 - s_4)).divideScalar(2);
  const t1_3 = tube3.clone();
  t1_3.position.setZ(-s_2 + s_16);
  const t2_3 = tube3.clone();
  t2_3.position.setZ(s_2 - s_16);

  const panel = new THREE.Mesh(
    new THREE.BoxGeometry(s_16, size * 2, s_4),
    new THREE.MeshLambertMaterial({ color: "black" })
  );
  panel.position.set(size - s_4 + s_16, size, 0);
  const p1 = panel.clone();
  p1.position.setZ(-s_2 + s_8);
  const p2 = panel.clone();
  p2.position.setZ(s_2 - s_8);

  const panel1 = new THREE.Mesh(
    new THREE.BoxGeometry(s_16, s_4, size),
    new THREE.MeshLambertMaterial({ color: "black" })
  );
  panel1.position.set(size - s_4 + s_16, s_2, 0);

  const panel2 = new THREE.Mesh(
    new THREE.BoxGeometry(size, s_16, s_8),
    new THREE.MeshLambertMaterial({ color: "black" })
  );
  panel2.position.set(size + s_4, s_2, 0);
  const p1_2 = panel2.clone();
  p1_2.position.setZ(-s_2 + s_8);
  const p2_2 = panel2.clone();
  p2_2.position.setZ(s_2 - s_8);

  egv.add(
    m1,
    m2,
    m3,
    w1,
    w2,
    w3,
    w4,
    ax1,
    ax2,
    t1,
    t2,
    t3,
    t4,
    t1_2,
    t2_2,
    t1_3,
    t2_3,
    p1,
    p2,
    panel1,
    p1_2,
    p2_2
  );
  egv.name = "EGV";
  const racks = createRacks(egv, panel2.position, racksCount, 0, 1, size);
  egv.userData = {
    racksPosition: panel2.position.clone(),
    EGVRacks: racks,
  };
  return egv;
}

function animate(group: THREE.Group, delta: number) {
  const {
    height,
    length,
    speed,
    left,
    right,
    rPos,
    racks,
    missedIndex,
    missedTier,
  } = group.userData;
  let lastX = 0;
  for (const rack of racks) {
    const mesh = group.getObjectByProperty("uuid", rack.id);
    if (!mesh) break;
    const { color, size, started, finished } = mesh.userData;
    const s_2 = size / 2;
    if (finished) continue;
    if (started) {
      const x = mesh.position.x + speed * delta;
      lastX = x;
      if (x >= length) {
        mesh.userData = { ...mesh.userData, finished: true };
        group.userData = { ...group.userData, racks: racks.filter((r: any) => r.id !== rack.id) };
        fixBoxPos(mesh, missedIndex, missedTier, size, new THREE.Vector3(length + 1));
        if (missedIndex === 3) {
          group.userData = { ...group.userData, missedIndex: 0, missedTier: missedTier + 1 };
        } else group.userData = { ...group.userData, missedIndex: missedIndex + 1 };
      } else {
        mesh.position.setX(x);
        let finished = false;
        for (const l of left) {
          if (checkRange(x, l.position.x - s_2, l.position.x + s_2) && color === l.color) {
            const panel = group.getObjectByProperty("uuid", l.id);
            if (!panel) break;
            let index = panel.userData.index;
            let tier = panel.userData.tier;
            mesh.userData = { ...mesh.userData, finished: true };
            group.userData = {
              ...group.userData,
              racks: racks.filter((r: any) => r.id !== rack.id),
            };
            fixBoxPos(mesh, index, tier, size, l.position);
            if (index === 3) {
              index = 0;
              tier++;
            } else index++;
            panel.userData = { index, tier };
            finished = true;
            break;
          }
        }
        if (finished) continue;
        for (const r of right) {
          if (checkRange(x, r.position.x - s_2, r.position.x + s_2) && color === r.color) {
            const panel = group.getObjectByProperty("uuid", r.id);
            if (!panel) break;
            let index = panel.userData.index;
            let tier = panel.userData.tier;
            mesh.userData = { ...mesh.userData, finished: true };
            group.userData = {
              ...group.userData,
              racks: racks.filter((r: any) => r.id !== rack.id),
            };
            fixBoxPos(mesh, index, tier, size, r.position);
            if (index === 3) {
              index = 0;
              tier++;
            } else index++;
            panel.userData = { index, tier };
            break;
          }
        }
      }
    } else if (!lastX || lastX >= size * 2) {
      mesh.userData = { ...mesh.userData, started: true };
      mesh.position.set(s_2, height, 0);
      lastX = s_2;
      break;
    }
  }
  const ns = !racks.some((r: any) => {
    const mesh = group.getObjectByProperty("uuid", r.id);
    return !mesh?.userData.started;
  });
  const egv = group.getObjectByName("EGV");
  if (!egv) return;
  const {
    index,
    distance,
    egvPath,
    EGVSpeed,
    started,
    finished,
    EGVRacks,
    racksPosition,
    racksCount,
  } = egv.userData;
  if (ns && !started && !finished) {
    egv.userData = { ...egv.userData, started: true, finished: false };
  }
  const part = egvPath[index];
  if (!part) return;
  if (started) {
    if (distance >= part.distance) {
      if (index === egvPath.length - 1) {
        let i = 0;
        let tier = 0;
        for (const rack of EGVRacks) {
          const mesh = group.getObjectByProperty("uuid", rack.id);
          if (!mesh) continue;
          fixBoxPos(mesh, i, tier, mesh.userData.size, rPos);
          group.add(mesh);
          if (index === 3) {
            i = 0;
            tier++;
          } else i++;
        }
        group.userData = { ...group.userData, racks: [...racks, ...EGVRacks] };
        egv.userData = { ...egv.userData, started: false, finished: true, EGVRacks: [] };
        egv.position.copy(part.end);
        egv.lookAt(new THREE.Vector3());
        egv.rotateY(-deg90InRad);
      } else {
        const next = egvPath[index + 1];
        if (!next) return;
        egv.userData = { ...egv.userData, index: index + 1, distance: 0 };
        egv.position.copy(next.start);
        egv.lookAt(next.end);
        egv.rotateY(-deg90InRad);
      }
    } else {
      const newD = distance + EGVSpeed * delta;
      egv.position.copy(getPosByDistance(newD, part.start, part.end));
      egv.userData = { ...egv.userData, distance: newD };
      egv.lookAt(part.end);
      egv.rotateY(-deg90InRad);
    }
  } else if (finished) {
    if (distance <= 0) {
      if (!index) {
        egv.userData = {
          ...egv.userData,
          finished: false,
          EGVRacks: createRacks(egv, racksPosition, racksCount, 0, 1),
        };
        egv.position.copy(part.start);
      } else {
        const prev = egvPath[index - 1];
        if (!prev) return;
        egv.userData = { ...egv.userData, index: index - 1, distance: prev.distance };
        egv.position.copy(prev.end);
        egv.lookAt(prev.start);
        egv.rotateY(-deg90InRad);
      }
    } else {
      const newD = distance - EGVSpeed * delta;
      egv.position.copy(getPosByDistance(newD, part.start, part.end));
      egv.userData = { ...egv.userData, distance: newD };
      egv.lookAt(part.start);
      egv.rotateY(-deg90InRad);
    }
  }
  // if (allFinished) {
  //   group.userData = { ...group.userData, missedIndex: 0, missedTier: 0 };
  //   for (const rack of racks) {
  //     const mesh = group.getObjectByProperty("uuid", rack.id);
  //     if (!mesh) break;
  //     mesh.userData = { ...mesh.userData, started: false, finished: false };
  //     mesh.position.copy(mesh.userData.initialPos);
  //   }
  //   for (const lr of [...left, ...right]) {
  //     const panel = group.getObjectByProperty("uuid", lr.id);
  //     if (!panel) continue;
  //     panel.userData = { index: 0, tier: 0 };
  //   }
  // }
}

export { createConveyors };
