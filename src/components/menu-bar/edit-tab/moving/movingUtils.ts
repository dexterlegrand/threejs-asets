import { Dispatch } from "redux";
import {
  changeModel,
  createModel,
  changeLoadings,
  changeProjectAction,
  changeFlareAction,
  createFlareAction,
} from "../../../../store/main/actions";
import {
  PipeRack,
  Model,
  Project,
  PipeRackPortal,
  Loadings,
} from "../../../../store/main/types";
import { TOpenFrame } from "../../../../store/main/openFrameTypes";
import {
  MMtoM,
  getIndexName,
  getNextId,
  roundM,
  roundVectorM,
  MtoMM,
} from "../../../3d-models/utils";
import { OpenFrameUI, ProjectUI } from "../../../../store/ui/types";
import { changeOFUIAction, changeUIAction } from "../../../../store/ui/actions";
import { Vector3 } from "three";
import {
  TProcess,
  TProcessElement,
  TProcessLine,
} from "../../../../store/process/types";
import { setProcessAction } from "../../../../store/process/actions";
import {
  updateProcessLine,
  updateProcessLines,
} from "../../../3d-models/process/process";
import { TFlare } from "../../../../store/main/types/flare";

export function handleMove(
  dispatch: Dispatch,
  x: number,
  y: number,
  z: number,
  models: Model[],
  project?: Project,
  process?: TProcess
) {
  if (!project) return;
  const fixedLines: number[] = [];
  const relocatedLines: number[] = [];
  let changed = process ? { ...process } : undefined;
  for (const model of models) {
    if (model.type === "Pipe Rack") {
      const pos = (model as PipeRack).startPos;
      pos.set(pos.x + MMtoM(x), pos.y + MMtoM(y), pos.z + MMtoM(z));
      const changed = { ...model, startPos: pos };
      dispatch(changeModel(changed as PipeRack));
    } else if (model.type === "Open Frame" || model.type === "Factory Shed") {
      const pos = (model as TOpenFrame).startPos;
      pos.set(pos.x + MMtoM(x), pos.y + MMtoM(y), pos.z + MMtoM(z));
      const changed = { ...model, startPos: pos };
      dispatch(changeModel(changed as TOpenFrame));
    } else if (model.type === "Pipe Line") {
      const mx = MMtoM(x);
      const my = MMtoM(y);
      const mz = MMtoM(z);
      const changed: Project = {
        ...project,
        freePipes: project.freePipes?.map((p) => {
          if (`${p.line}` === model.name) {
            const start = new Vector3(p.x1 + mx, p.y1 + my, p.z1 + mz);
            const end = new Vector3(p.x2 + mx, p.y2 + my, p.z2 + mz);
            return {
              ...p,
              x1: roundM(start.x),
              y1: roundM(start.y),
              z1: roundM(start.z),
              x2: roundM(end.x),
              y2: roundM(end.y),
              z2: roundM(end.z),
              elevation: roundM((start.y + end.y) / 2),
              length: roundM(start.distanceTo(end)),
            };
          }
          return p;
        }),
      };
      dispatch(changeProjectAction(changed));
    } else if (model.type === "Flare") {
      const { position } = model as TFlare;
      const pos = roundVectorM(
        new Vector3(
          position.x + MMtoM(x),
          position.y + MMtoM(y),
          position.z + MMtoM(z)
        )
      );
      const changed = { ...model, position: { x: pos.x, y: pos.y, z: pos.z } };
      dispatch(changeFlareAction(changed as TFlare));
    } else if (changed && model.type === "Equipment") {
      /*const element = changed.elements.get(model.name);*/
      if(!changed)  continue;
      const element = Array.from(changed.elements.values()).find(el => el.tag === (model.name));
      console.log("element found",element);
      
      if (!element) continue;
      const changedElement = {
        ...element,
        position: {
          x: roundM(element.position.x + MMtoM(x)),
          y: roundM(element.position.y + MMtoM(y)),
          z: roundM(element.position.z + MMtoM(z)),
        },
      };
      /*changed.elements.set(model.name, changedElement);*/
      const key = Array.from(changed!.elements.keys()).find(key => changed!.elements.get(key)?.tag === model.name);
      if (key) {
        changed!.elements.set(key, changedElement);
      } else {
          return; 
      }
      for (const p of changedElement.points) {
        const line: TProcessLine | undefined = changed.lines?.find(
          (l) =>
            ((p.connectionType === "START" &&
              l.from === model.name &&
              l.to === p.element) ||
              (p.connectionType === "END" &&
                l.from === p.element &&
                l.to === model.name)) &&
            !relocatedLines.includes(l.id) &&
            !fixedLines.includes(l.id)
        );
        if (!line) continue;
        const m = models.find((m) => m.name === p.element);
        if (!m) {
          if (!line.to) continue;
          const connected = changed.elements.get(
            line.from === changedElement.name ? line.to : line.from
          );
          if (!connected) continue;
          const res = updateProcessLine(
            line,
            changedElement,
            connected,
            changed.instrumentations ?? []
          );
          changed = {
            ...changed,
            lines: changed.lines?.map((l) => (l.id === line.id ? res.line : l)),
            instrumentations: res.instrs,
          };
          fixedLines.push(line.id);
          continue;
        }
        relocatedLines.push(line.id);
        const changedLine: TProcessLine = {
          ...line,
          segments: line.segments.map((s) => {
            return {
              ...s,
              start: new Vector3(
                roundM(s.start.x + MMtoM(x)),
                roundM(s.start.y + MMtoM(y)),
                roundM(s.start.z + MMtoM(z))
              ),
              end: new Vector3(
                roundM(s.end.x + MMtoM(x)),
                roundM(s.end.y + MMtoM(y)),
                roundM(s.end.z + MMtoM(z))
              ),
            };
          }),
        };
        changed = {
          ...changed,
          lines: changed.lines?.map((l) =>
            l.id === changedLine.id ? changedLine : l
          ),
        };
      }
    }
  }
  changed && dispatch(setProcessAction(project.name, changed));
}

export function handleCopy(
  dispatch: Dispatch,
  setDlg: (dlg?: JSX.Element) => any,
  models: Model[],
  x: number,
  y: number,
  z: number,
  project?: Project,
  process?: TProcess,
  ui?: ProjectUI,
  model?: Model,
  loads?: boolean
) {
  if (!project || !model) return;
  if (model.type === "Pipe Rack") {
    const m = handleCopyPipeRack(models, model, x, y, z, loads);
    dispatch(createModel(m));
    loads &&
      dispatch(changeLoadings(handleCopyPRLoads(project, model, m.name)));
  } else if (ui && model.type === "Open Frame") {
    const OF = handleCopyOpenFrame(ui, models, model, x, y, z, loads);
    dispatch(createModel(OF.changed));
    dispatch(changeOFUIAction(OF.newUI));
  } else if (ui && model.type === "Factory Shed") {
    const FS = handleCopyFactoryShed(ui, models, model, x, y, z, loads);
    dispatch(createModel(FS.changed));
    dispatch(changeOFUIAction(FS.newUI));
  } else if (model.type === "Pipe Line") {
    const p = handleCopyPipeLine(project, model, x, y, z, loads);
    dispatch(changeProjectAction(p));
  } else if (model.type === "Flare") {
    const f = handleCopyFlare(models, model, x, y, z, loads);
    dispatch(createFlareAction(undefined, f));
  } else if (process && model.type === "Equipment") {
    const eq = handleCopyEquipment(process, models, model, x, y, z);
    if (eq) {
      let changed = { ...process };
      changed.elements.set(eq.name, eq);
      changed = updateProcessLines(changed, eq);
      dispatch(setProcessAction(project.name, changed));
    }
  }
  setDlg(undefined);
}

export function handleCopySerial(
  dispatch: Dispatch,
  setDlg: (dlg?: JSX.Element) => any,
  models: Model[],
  x: number,
  y: number,
  z: number,
  copyCount: number,
  project?: Project,
  process?: TProcess,
  ui?: ProjectUI,
  selected?: Model[],
  loads?: boolean
) {
  if (!project || !selected?.length) return;
  let changedProject = { ...project };
  let changedUI = ui ? { ...ui } : undefined;
  let changedProcess = process ? { ...process } : undefined;
  const v = new Vector3();
  for (let i = 0; i < copyCount; i++) {
    v.add(new Vector3(MMtoM(x), MMtoM(y), MMtoM(z)));
    for (const sm of selected) {
      if (sm.type === "Pipe Rack") {
        const m = handleCopyPipeRack(
          changedProject.models,
          sm,
          MtoMM(v.x),
          MtoMM(v.y),
          MtoMM(v.z),
          loads
        );
        changedProject = {
          ...changedProject,
          models: [...changedProject.models, m],
          loadings: loads
            ? handleCopyPRLoads(changedProject, sm, m.name)
            : changedProject.loadings,
        };
      } else if (sm.type === "Open Frame" && changedUI) {
        const OF = handleCopyOpenFrame(
          changedUI,
          changedProject.models,
          sm,
          MtoMM(v.x),
          MtoMM(v.y),
          MtoMM(v.z),
          loads
        );
        changedProject = {
          ...changedProject,
          models: [...changedProject.models, OF.changed],
        };
        changedUI = { ...changedUI, openFrameUI: OF.newUI };
      } else if (sm.type === "Factory Shed" && changedUI) {
        const FS = handleCopyFactoryShed(
          changedUI,
          changedProject.models,
          sm,
          MtoMM(v.x),
          MtoMM(v.y),
          MtoMM(v.z),
          loads
        );
        changedProject = {
          ...changedProject,
          models: [...changedProject.models, FS.changed],
        };
        changedUI = { ...changedUI, openFrameUI: FS.newUI };
      } else if (sm.type === "Pipe Line") {
        changedProject = handleCopyPipeLine(
          changedProject,
          sm,
          MtoMM(v.x),
          MtoMM(v.y),
          MtoMM(v.z),
          loads
        );
      } else if (sm.type === "Flare") {
        const flares = changedProject.flares ?? [];
        const f = handleCopyFlare(
          flares,
          sm,
          MtoMM(v.x),
          MtoMM(v.y),
          MtoMM(v.z),
          loads
        );
        changedProject = { ...changedProject, flares: [...flares, f] };
      } else if (changedProcess && sm.type === "Equipment") {
        const eq = handleCopyEquipment(
          changedProcess,
          models,
          sm,
          MtoMM(v.x),
          MtoMM(v.y),
          MtoMM(v.z)
        );
        if (eq) {
          changedProcess.elements.set(eq.name, eq);
          changedProcess = updateProcessLines(changedProcess, eq);
          /*changedProcess.elements.set(eq.tag, eq); 
          changedProcess = updateProcessLines(changedProcess, eq);*/
        }
      }
    }
  }
  dispatch(changeProjectAction(changedProject));
  changedUI && dispatch(changeUIAction(changedUI));
  changedProcess && dispatch(setProcessAction(project.name, changedProcess));
  setDlg(undefined);
}

function handleCopyPipeRack(
  models: Model[],
  model: Model,
  x: number,
  y: number,
  z: number,
  loads?: boolean
): PipeRack {
  const PR = model as PipeRack;
  const pos = PR.startPos.clone();
  pos.set(pos.x + MMtoM(x), pos.y + MMtoM(y), pos.z + MMtoM(z));
  const name = `PR${getIndexName(models, "PR")}`;
  let changed: PipeRack = { ...PR, name, startPos: pos };
  const portals = new Map<string, PipeRackPortal>();
  PR.portals.forEach((p) => {
    const pName = `${name}-P${p.id}`;
    portals.set(p.name, { ...p, name: pName, parent: name });
  });
  let columnId = getNextId(PR.columns);
  let beamId = getNextId(PR.beams);
  let cntId = getNextId(PR.cantilevers);
  let agId = getNextId(PR.accessories);
  let fId = getNextId(PR.flanges);
  let pId = getNextId(PR.plates);
  let hbId = getNextId(PR.hBracings);
  let vbId = getNextId(PR.vBracings);
  let pipeId = getNextId(PR.pipes);
  let plId = getNextId(PR.platforms);

  changed = {
    ...changed,
    portals: Array.from(portals.values()),
    columns: PR.columns.map((c) => ({
      ...c,
      id: columnId++,
      uiId: undefined,
      parent: portals.get(c.parent)?.name ?? c.parent,
      deadLoadId: undefined,
      deadLoad: loads ? c.deadLoad : undefined,
      liveLoadId: undefined,
      liveLoad: loads ? c.liveLoad : undefined,
      windLoadId: undefined,
      windLoad: loads ? c.windLoad : undefined,
    })),
    beams: PR.beams.map((b) => ({
      ...b,
      id: beamId++,
      uiId: undefined,
      parent: portals.get(b.parent)?.name ?? b.parent,
      deadLoadId: undefined,
      deadLoad: loads ? b.deadLoad : undefined,
      liveLoadId: undefined,
      liveLoad: loads ? b.liveLoad : undefined,
      windLoadId: undefined,
      windLoad: loads ? b.windLoad : undefined,
      directLoadId: undefined,
      directLoad: loads ? b.directLoad : undefined,
      equipmentLoadId: undefined,
      equipmentLoad: loads ? b.equipmentLoad : undefined,
    })),
    cantilevers: PR.cantilevers.map((c) => ({
      ...c,
      id: cntId++,
      uiId: undefined,
      parent: portals.get(c.parent)?.name ?? c.parent,
      deadLoadId: undefined,
      deadLoad: loads ? c.deadLoad : undefined,
      liveLoadId: undefined,
      liveLoad: loads ? c.liveLoad : undefined,
      windLoadId: undefined,
      windLoad: loads ? c.windLoad : undefined,
      directLoadId: undefined,
      directLoad: loads ? c.directLoad : undefined,
    })),
    accessories: PR.accessories.map((ag) => ({
      ...ag,
      id: agId++,
      uiId: undefined,
      name: ag.name.replace(PR.name, name),
      parent: portals.get(ag.parent)?.name ?? ag.parent,
      elements: ag.elements.map((e) => ({
        ...e,
        name: e.name.replace(PR.name, name),
        group: e.group.replace(PR.name, name),
        parent: portals.get(e.parent)?.name ?? e.parent,
        colItems: e.colItems.map((i) => ({
          ...i,
          name: i.name.replace(PR.name, name),
          parent: i.parent.replace(PR.name, name),
          parentGroup: i.parentGroup.replace(PR.name, name),
        })),
        beamItems: e.beamItems.map((i) => ({
          ...i,
          name: i.name.replace(PR.name, name),
          parent: i.parent.replace(PR.name, name),
          parentGroup: i.parentGroup.replace(PR.name, name),
        })),
      })),
      deadLoad: loads ? ag.deadLoad : undefined,
    })),
    vBracings: PR.vBracings.map((vb) => ({
      ...vb,
      id: vbId++,
      uiId: undefined,
      parent: portals.get(vb.parent)?.name ?? vb.parent,
    })),
    hBracings: PR.hBracings.map((hb) => ({
      ...hb,
      id: hbId++,
      uiId: undefined,
      parent: portals.get(hb.parent)?.name ?? hb.parent,
    })),
    platforms: PR.platforms.map((p) => ({
      ...p,
      id: plId++,
      uiId: undefined,
      name: p.name.replace(PR.name, name),
      fromPortal: portals.get(p.fromPortal)?.name ?? p.fromPortal,
      toPortal: portals.get(p.toPortal)?.name ?? p.toPortal,
      parent: name,
    })),
    plates: PR.plates.map((p) => ({
      ...p,
      id: pId++,
      uiId: undefined,
      parent: portals.get(p.parent)?.name ?? p.parent,
    })),
    flanges: PR.flanges.map((f) => ({
      ...f,
      id: fId++,
      uiId: undefined,
      parent: portals.get(f.parent)?.name ?? f.parent,
    })),
    pipes: PR.pipes.map((p) => ({
      ...p,
      id: pipeId++,
      uiId: undefined,
      parent: name,
      fromPortal: portals.get(p.fromPortal)?.name ?? p.fromPortal,
      toPortal: portals.get(p.toPortal)?.name ?? p.toPortal,
    })),
  };
  return changed;
}

function handleCopyPRLoads(
  project: Project,
  model: Model,
  name: string
): Loadings {
  return {
    ...project.loadings,
    blanketLoads: project.loadings.blanketLoads.reduce((acc, item) => {
      if (item.pr === model.name) {
        return [...acc, { ...item, id: getNextId(acc), pr: name }];
      }
      return acc;
    }, project.loadings.blanketLoads),
    directLoads: project.loadings.directLoads?.reduce((acc, item) => {
      if (item.model === model.name) {
        return [...acc, { ...item, id: getNextId(acc), model: name }];
      }
      return acc;
    }, project.loadings.directLoads ?? []),
    seismicLoads: project.loadings.seismicLoads?.reduce((acc, item) => {
      if (item.prNo === model.name) {
        return [...acc, { ...item, id: getNextId(acc), model: name }];
      }
      return acc;
    }, project.loadings.seismicLoads ?? []),
  };
}

function handleCopyOpenFrame(
  ui: ProjectUI,
  models: Model[],
  model: Model,
  x: number,
  y: number,
  z: number,
  loads?: boolean
) {
  let OF = { ...(model as TOpenFrame) };
  const pos = OF.startPos.clone();
  pos.set(pos.x + MMtoM(x), pos.y + MMtoM(y), pos.z + MMtoM(z));
  const name = `OF${getIndexName(models, "OF")}`;

  const newArrElement = (arr: any[]) => {
    return arr
      ? arr.reduce((acc, item) => {
          if (item.model === model.name) {
            return [...acc, { ...item, id: getNextId(acc), model: name }];
          }
          return acc;
        }, arr)
      : [];
  };

  let newUI: OpenFrameUI = {
    ...ui.openFrameUI,
    frames: {
      ...ui.openFrameUI.frames,
      x: pos.x,
      y: pos.y,
      z: pos.z,
      parameters: newArrElement(ui.openFrameUI.frames.parameters),
      relocations: newArrElement(ui.openFrameUI.frames.relocations),
    },
    members: {
      beams: newArrElement(ui.openFrameUI.members.beams),
      columns: newArrElement(ui.openFrameUI.members.columns),
      releases: newArrElement(ui.openFrameUI.members.releases),
    },
    accessories: newArrElement(ui.openFrameUI.accessories),
    platforms: newArrElement(ui.openFrameUI.platforms),
    basePlates: {
      ...ui.openFrameUI.basePlates,
      circular: newArrElement(ui.openFrameUI.basePlates.circular),
      rectangular: newArrElement(ui.openFrameUI.basePlates.rectangular),
    },
    spliceFlanges: {
      circular: newArrElement(ui.openFrameUI.spliceFlanges.circular),
      rectangular: newArrElement(ui.openFrameUI.spliceFlanges.rectangular),
    },
    ladders: {
      ...ui.openFrameUI.ladders,
      ladders: newArrElement(ui.openFrameUI.ladders.ladders),
    },
    pipes: {
      items: newArrElement(ui.openFrameUI.pipes.items),
      supports: newArrElement(ui.openFrameUI.pipes.supports),
    },
    loadingsUI: { ...ui.openFrameUI.loadingsUI },
  };

  for (const item of newUI.additionalBeams.beamToBeam ?? []) {
    if (item.model !== model.name) continue;
    const newItem = {
      ...item,
      id: getNextId(newUI.additionalBeams.beamToBeam ?? []),
      model: name,
    };
    OF = {
      ...OF,
      beams: OF.beams.map((el) =>
        el.uiId === item.id ? { ...el, uiId: newItem.id } : el
      ),
    };
    newUI = {
      ...newUI,
      additionalBeams: {
        ...newUI.additionalBeams,
        beamToBeam: [...newUI.additionalBeams.beamToBeam, newItem],
      },
    };
  }

  for (const item of newUI.additionalBeams.columnToBeam ?? []) {
    if (item.model !== model.name) continue;
    const newItem = {
      ...item,
      id: getNextId(newUI.additionalBeams.columnToBeam ?? []),
      model: name,
    };
    OF = {
      ...OF,
      beams: OF.beams.map((el) =>
        el.uiId === item.id ? { ...el, uiId: newItem.id } : el
      ),
    };
    newUI = {
      ...newUI,
      additionalBeams: {
        ...newUI.additionalBeams,
        columnToBeam: [...newUI.additionalBeams.columnToBeam, newItem],
      },
    };
  }

  for (const item of newUI.additionalBeams.columnToColumn ?? []) {
    if (item.model !== model.name) continue;
    const newItem = {
      ...item,
      id: getNextId(newUI.additionalBeams.columnToColumn ?? []),
      model: name,
    };
    OF = {
      ...OF,
      beams: OF.beams.map((el) =>
        el.uiId === item.id ? { ...el, uiId: newItem.id } : el
      ),
    };
    newUI = {
      ...newUI,
      additionalBeams: {
        ...newUI.additionalBeams,
        columnToColumn: [...newUI.additionalBeams.columnToColumn, newItem],
      },
    };
  }

  for (const item of newUI.additionalBeams.cantilever ?? []) {
    if (item.model !== model.name) continue;
    const newItem = {
      ...item,
      id: getNextId(newUI.additionalBeams.cantilever ?? []),
      model: name,
    };
    OF = {
      ...OF,
      cantilevers: OF.cantilevers.map((el) =>
        el.uiId === item.id ? { ...el, uiId: newItem.id } : el
      ),
    };
    newUI = {
      ...newUI,
      additionalBeams: {
        ...newUI.additionalBeams,
        cantilever: [...newUI.additionalBeams.cantilever, newItem],
      },
    };
  }

  for (const item of newUI.additionalBeams.columns ?? []) {
    if (item.model !== model.name) continue;
    const newItem = {
      ...item,
      id: getNextId(newUI.additionalBeams.columns ?? []),
      model: name,
    };
    OF = {
      ...OF,
      columns: OF.columns.map((el) =>
        el.uiId === item.id ? { ...el, uiId: newItem.id } : el
      ),
    };
    newUI = {
      ...newUI,
      additionalBeams: {
        ...newUI.additionalBeams,
        columns: [...newUI.additionalBeams.columns, newItem],
      },
    };
  }

  for (const item of newUI.additionalBeams.staircases ?? []) {
    if (item.model !== model.name) continue;
    const newItem = {
      ...item,
      id: getNextId(newUI.additionalBeams.staircases ?? []),
      model: name,
    };
    OF = {
      ...OF,
      staircases: OF.staircases.map((el) =>
        el.uiId === item.id ? { ...el, uiId: newItem.id } : el
      ),
    };
    newUI = {
      ...newUI,
      additionalBeams: {
        ...newUI.additionalBeams,
        staircases: [...newUI.additionalBeams.staircases, newItem],
      },
    };
  }

  for (const item of newUI.additionalBeams.kneeBracings ?? []) {
    if (item.model !== model.name) continue;
    const newItem = {
      ...item,
      id: getNextId(newUI.additionalBeams.kneeBracings ?? []),
      model: name,
    };
    OF = {
      ...OF,
      kneeBracings: OF.kneeBracings.map((el) =>
        el.uiId === item.id ? { ...el, uiId: newItem.id } : el
      ),
    };
    newUI = {
      ...newUI,
      additionalBeams: {
        ...newUI.additionalBeams,
        kneeBracings: [...newUI.additionalBeams.kneeBracings, newItem],
      },
    };
  }

  for (const item of newUI.additionalBeams.planBracings ?? []) {
    if (item.model !== model.name) continue;
    const newItem = {
      ...item,
      id: getNextId(newUI.additionalBeams.planBracings ?? []),
      model: name,
    };
    OF = {
      ...OF,
      horizontalBracings: OF.horizontalBracings.map((el) =>
        el.uiId === item.id ? { ...el, uiId: newItem.id } : el
      ),
    };
    newUI = {
      ...newUI,
      additionalBeams: {
        ...newUI.additionalBeams,
        planBracings: [...newUI.additionalBeams.planBracings, newItem],
      },
    };
  }

  for (const item of newUI.additionalBeams.verticalBracings ?? []) {
    if (item.model !== model.name) continue;
    const newItem = {
      ...item,
      id: getNextId(newUI.additionalBeams.verticalBracings ?? []),
      model: name,
    };
    OF = {
      ...OF,
      verticalBracings: OF.verticalBracings.map((el) =>
        el.uiId === item.id ? { ...el, uiId: newItem.id } : el
      ),
    };
    newUI = {
      ...newUI,
      additionalBeams: {
        ...newUI.additionalBeams,
        verticalBracings: [...newUI.additionalBeams.verticalBracings, newItem],
      },
    };
  }

  if (loads) {
    newUI = {
      ...newUI,
      loadingsUI: {
        ...ui.openFrameUI.loadingsUI,
        deadLoadUI: {
          ...ui.openFrameUI.loadingsUI.deadLoadUI,
          accessoriesTPLoads: newArrElement(
            ui.openFrameUI.loadingsUI.deadLoadUI.accessoriesTPLoads
          ),
          accessoriesFPLoads: newArrElement(
            ui.openFrameUI.loadingsUI.deadLoadUI.accessoriesFPLoads
          ),
          accessoriesCTLoads: newArrElement(
            ui.openFrameUI.loadingsUI.deadLoadUI.accessoriesCTLoads
          ),
          loads: newArrElement(ui.openFrameUI.loadingsUI.deadLoadUI.loads),
        },
        liveLoadUI: {
          ...ui.openFrameUI.loadingsUI.liveLoadUI,
          loads: newArrElement(ui.openFrameUI.loadingsUI.liveLoadUI.loads),
        },
        windLoadUI: {
          ...ui.openFrameUI.loadingsUI.windLoadUI,
          loads: newArrElement(ui.openFrameUI.loadingsUI.windLoadUI.loads),
        },
        equipmentLoadUI: newArrElement(
          ui.openFrameUI.loadingsUI.equipmentLoadUI
        ),
        pipingLoadsUI: {
          directLoads: newArrElement(
            ui.openFrameUI.loadingsUI.pipingLoadsUI.directLoads
          ),
          blanketLoads: newArrElement(
            ui.openFrameUI.loadingsUI.pipingLoadsUI.blanketLoads
          ),
        },
        seismicLoadsUI: {
          ...ui.openFrameUI.loadingsUI.seismicLoadsUI,
          seismicLoads: newArrElement(
            ui.openFrameUI.loadingsUI.seismicLoadsUI.seismicLoads
          ),
        },
      },
    };
  }
  const changed: TOpenFrame = {
    ...OF,
    name,
    startPos: pos,
    frames: OF.frames.map((f) => ({ ...f, model: name })),
  };
  return { changed, newUI };
}

function handleCopyFactoryShed(
  ui: ProjectUI,
  models: Model[],
  model: Model,
  x: number,
  y: number,
  z: number,
  loads?: boolean
) {
  const FS = model as TOpenFrame;
  const pos = FS.startPos.clone();
  pos.set(pos.x + MMtoM(x), pos.y + MMtoM(y), pos.z + MMtoM(z));
  const name = `FS${getIndexName(models, "FS")}`;

  const newArrElement = (arr: any[]) => {
    return arr
      ? arr.reduce((acc, item) => {
          if (item.model === model.name) {
            return [...acc, { ...item, id: getNextId(acc), model: name }];
          }
          return acc;
        }, arr)
      : [];
  };

  let newUI: OpenFrameUI = {
    ...ui.openFrameUI,
    frames: {
      ...ui.openFrameUI.frames,
      x: pos.x,
      y: pos.y,
      z: pos.z,
      parameters: newArrElement(ui.openFrameUI.frames.parameters),
      relocations: newArrElement(ui.openFrameUI.frames.relocations),
    },
    additionalBeams: {
      beamToBeam: newArrElement(ui.openFrameUI.additionalBeams.beamToBeam),
      cantilever: newArrElement(ui.openFrameUI.additionalBeams.cantilever),
      columnToBeam: newArrElement(ui.openFrameUI.additionalBeams.columnToBeam),
      columnToColumn: newArrElement(
        ui.openFrameUI.additionalBeams.columnToColumn
      ),
      columns: newArrElement(ui.openFrameUI.additionalBeams.columns),
      kneeBracings: newArrElement(ui.openFrameUI.additionalBeams.kneeBracings),
      planBracings: newArrElement(ui.openFrameUI.additionalBeams.planBracings),
      staircases: newArrElement(ui.openFrameUI.additionalBeams.staircases),
      verticalBracings: newArrElement(
        ui.openFrameUI.additionalBeams.verticalBracings
      ),
    },
    members: {
      beams: newArrElement(ui.openFrameUI.members.beams),
      columns: newArrElement(ui.openFrameUI.members.columns),
      releases: newArrElement(ui.openFrameUI.members.releases),
    },
    accessories: newArrElement(ui.openFrameUI.accessories),
    platforms: newArrElement(ui.openFrameUI.platforms),
    basePlates: {
      ...ui.openFrameUI.basePlates,
      circular: newArrElement(ui.openFrameUI.basePlates.circular),
      rectangular: newArrElement(ui.openFrameUI.basePlates.rectangular),
    },
    spliceFlanges: {
      circular: newArrElement(ui.openFrameUI.spliceFlanges.circular),
      rectangular: newArrElement(ui.openFrameUI.spliceFlanges.rectangular),
    },
    ladders: {
      ...ui.openFrameUI.ladders,
      ladders: newArrElement(ui.openFrameUI.ladders.ladders),
    },
    pipes: {
      items: newArrElement(ui.openFrameUI.pipes.items),
      supports: newArrElement(ui.openFrameUI.pipes.supports),
    },
    masonryCladdings: newArrElement(ui.openFrameUI.masonryCladdings),
    metalCladdings: newArrElement(ui.openFrameUI.metalCladdings),
    runners: newArrElement(ui.openFrameUI.runners),
    truss: newArrElement(ui.openFrameUI.truss),
    loadingsUI: { ...ui.openFrameUI.loadingsUI },
  };
  if (loads) {
    newUI = {
      ...newUI,
      loadingsUI: {
        ...ui.openFrameUI.loadingsUI,
        deadLoadUI: {
          ...ui.openFrameUI.loadingsUI.deadLoadUI,
          accessoriesTPLoads: newArrElement(
            ui.openFrameUI.loadingsUI.deadLoadUI.accessoriesTPLoads
          ),
          accessoriesFPLoads: newArrElement(
            ui.openFrameUI.loadingsUI.deadLoadUI.accessoriesFPLoads
          ),
          accessoriesCTLoads: newArrElement(
            ui.openFrameUI.loadingsUI.deadLoadUI.accessoriesCTLoads
          ),
          loads: newArrElement(ui.openFrameUI.loadingsUI.deadLoadUI.loads),
        },
        liveLoadUI: {
          ...ui.openFrameUI.loadingsUI.liveLoadUI,
          loads: newArrElement(ui.openFrameUI.loadingsUI.liveLoadUI.loads),
        },
        windLoadUI: {
          ...ui.openFrameUI.loadingsUI.windLoadUI,
          loads: newArrElement(ui.openFrameUI.loadingsUI.windLoadUI.loads),
        },
        equipmentLoadUI: newArrElement(
          ui.openFrameUI.loadingsUI.equipmentLoadUI
        ),
        pipingLoadsUI: {
          directLoads: newArrElement(
            ui.openFrameUI.loadingsUI.pipingLoadsUI.directLoads
          ),
          blanketLoads: newArrElement(
            ui.openFrameUI.loadingsUI.pipingLoadsUI.blanketLoads
          ),
        },
        seismicLoadsUI: {
          ...ui.openFrameUI.loadingsUI.seismicLoadsUI,
          seismicLoads: newArrElement(
            ui.openFrameUI.loadingsUI.seismicLoadsUI.seismicLoads
          ),
        },
      },
    };
  }
  const changed: TOpenFrame = {
    ...FS,
    name,
    startPos: pos,
    frames: FS.frames.map((f) => ({ ...f, model: name })),
  };
  return { changed, newUI };
}

function handleCopyPipeLine(
  project: Project,
  model: Model,
  x: number,
  y: number,
  z: number,
  loads?: boolean
) {
  const mx = MMtoM(x);
  const my = MMtoM(y);
  const mz = MMtoM(z);
  const line =
    (project.freePipes?.reduce((max, item) => Math.max(max, item.line), 0) ??
      0) + 1;
  const replacer = new Map<string, string>();
  const freePipes = project.freePipes?.reduce((acc, p) => {
    if (`${p.line}` === model.name) {
      const start = new Vector3(p.x1 + mx, p.y1 + my, p.z1 + mz);
      const end = new Vector3(p.x2 + mx, p.y2 + my, p.z2 + mz);
      const id = getNextId(acc);
      const name = `PP${id}`;
      replacer.set(p.pipe, name);
      return [
        ...acc,
        {
          ...p,
          id,
          line,
          pipe: name,
          x1: start.x,
          y1: start.y,
          z1: start.z,
          x2: end.x,
          y2: end.y,
          z2: end.z,
          elevation: (start.y + end.y) / 2,
          length: roundM(start.distanceTo(end)),
        },
      ];
    }
    return acc;
  }, project.freePipes ?? []);
  const changed: Project = {
    ...project,
    freePipes: freePipes?.map((p) => {
      if (p.line === line) {
        return { ...p, preceding: replacer.get(p.preceding) ?? "START" };
      }
      return p;
    }),
    pipeLoadings: loads
      ? {
          ...project.pipeLoadings,
          deadLoad: {
            ...project.pipeLoadings.deadLoad,
            insulations: project.pipeLoadings.deadLoad.insulations.reduce(
              (acc, item) => {
                if (item.element === model.name) {
                  return [
                    ...acc,
                    { ...item, id: getNextId(acc), element: `${line}` },
                  ];
                }
                return acc;
              },
              project.pipeLoadings.deadLoad.insulations
            ),
            loads: project.pipeLoadings.deadLoad.loads.reduce((acc, item) => {
              if (item.element === model.name) {
                return [
                  ...acc,
                  { ...item, id: getNextId(acc), element: `${line}` },
                ];
              }
              return acc;
            }, project.pipeLoadings.deadLoad.loads),
          },
          seismicLoads: {
            ...project.pipeLoadings.seismicLoads,
            seismicLoads: project.pipeLoadings.seismicLoads.seismicLoads.reduce(
              (acc, item) => {
                if (item.line === model.name) {
                  return [
                    ...acc,
                    { ...item, id: getNextId(acc), line: `${line}` },
                  ];
                }
                return acc;
              },
              project.pipeLoadings.seismicLoads.seismicLoads
            ),
          },
          slugLoads: project.pipeLoadings.slugLoads.reduce((acc, item) => {
            if (item.element === model.name) {
              return [
                ...acc,
                { ...item, id: getNextId(acc), element: `${line}` },
              ];
            }
            return acc;
          }, project.pipeLoadings.slugLoads),
          windLoad: {
            ...project.pipeLoadings.windLoad,
            loads: project.pipeLoadings.windLoad.loads.reduce((acc, item) => {
              if (item.element === model.name) {
                return [
                  ...acc,
                  { ...item, id: getNextId(acc), element: `${line}` },
                ];
              }
              return acc;
            }, project.pipeLoadings.windLoad.loads),
          },
        }
      : project.pipeLoadings,
  };
  return changed;
}

function handleCopyFlare(
  models: Model[],
  model: Model,
  x: number,
  y: number,
  z: number,
  loads?: boolean
) {
  const flare = model as TFlare;
  const pos = roundVectorM(
    new Vector3(
      flare.position.x + MMtoM(x),
      flare.position.y + MMtoM(y),
      flare.position.z + MMtoM(z)
    )
  );
  const name = `FLARE${getIndexName(models, "FLARE")}`;
  const changed: TFlare = {
    ...flare,
    id: getNextId(models.filter((m) => m.type === "Flare") as TFlare[]),
    name,
    position: { x: pos.x, y: pos.y, z: pos.z },
  };
  return changed;
}

/*function handleCopyEquipment(
  process: TProcess,
  models: Model[],
  model: Model,
  x: number,
  y: number,
  z: number
): TProcessElement | undefined {
  const element = process.elements.get(model.name);
  if (!element) return;
  const changedElement: TProcessElement = {
    ...element,
    instrumentationIDs: [],
    name: `${element.type}${getIndexName(models, element.type)}`,
    tag: (element.tag ?? "") + 1,
    points: element.points.map((p) => ({ ...p, element: undefined })),
    position: {
      x: roundM(element.position.x + MMtoM(x)),
      y: roundM(element.position.y + MMtoM(y)),
      z: roundM(element.position.z + MMtoM(z)),
    },
  };
  return changedElement;
}*/

function handleCopyEquipment(
  process: TProcess,
  models: Model[],
  model: Model,
  x: number,
  y: number,
  z: number
): TProcessElement | undefined {
  const element = Array.from(process.elements.values()).find(el => el.tag === model.name);
  if (!element) return;
  const newTag = generateUniqueTag(process.elements, element.tag);
  const newName = generateUniqueName(process.elements, element.name, element.type);

  const changedElement: TProcessElement = {
    ...element,
    instrumentationIDs: [],
    /*name: `${element.type}${getIndexName(models, element.type)}`,*/
    name: newName,
    tag: newTag, 
    points: element.points.map(p => ({ ...p, element: undefined })),
    position: {
      x: roundM(element.position.x + MMtoM(x)),
      y: roundM(element.position.y + MMtoM(y)),
      z: roundM(element.position.z + MMtoM(z)),
    },
  };
  return changedElement;
}

function generateUniqueTag(elements: Map<string, TProcessElement>, baseTag: string): string {
  let uniqueTag = baseTag;
  let counter = 1;
  while (Array.from(elements.values()).some(el => el.tag === uniqueTag)) {
    uniqueTag = `${baseTag}_${counter}`;
    counter++;
  }
  return uniqueTag;
}

function generateUniqueName(elements: Map<string, TProcessElement>, baseName: string, type: string): string {
  let newName = baseName;
  let counter = 1;
  while (Array.from(elements.values()).some(el => el.name === newName || el.tag === newName)) {
    newName = `${type}_${counter}`;
    counter++;
  }
  return newName;
}



