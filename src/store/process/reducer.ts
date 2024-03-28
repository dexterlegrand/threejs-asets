import * as actions from "./actions";
import { ActionType, createReducer } from "typesafe-actions";
import { processInitialState, initialProcess } from "./initialState";
import {
  TProcessState,
  EProcessActionTypes,
  TProcess,
  TProcessElement,
  TInstrumentationLine,
} from "./types";
import {
  getIndexName,
  roundM,
  getNextId,
} from "../../components/3d-models/utils";
import { updateProcessLines } from "../../components/3d-models/process/process";

export type Actions = ActionType<typeof actions>;

const reducer = createReducer<TProcessState, Actions>({
  ...processInitialState,
})
  .handleType(EProcessActionTypes.CREATE_PROCESS, (state, action) => {
    if (state.processes.has(action.payload.name)) return state;
    return {
      ...state,
      processes: state.processes.set(action.payload.name, {
        ...initialProcess,
        elements: new Map<string, TProcessElement>(),
      }),
    };
  })
  .handleType(EProcessActionTypes.SET_PROCESS, (state, action) => {
    const { name, process } = action.payload;
    const selected = state.selected
      ? process.elements.get(state.selected.name)
      : undefined;
    const selectedLine = state.selectedLine
      ? process.lines?.find((l) => l.id === state.selectedLine!.id)
      : undefined;
    return {
      ...state,
      processes: state.processes.set(name, process),
      selected,
      selectedLine,
      selectedPoint: undefined,
      selectedInstr: undefined,
      selectedInstrLine: undefined,
    };
  })
  .handleType(EProcessActionTypes.RENAME_PROCESS, (state, action) => {
    const process = state.processes.get(action.payload.oldName) ?? {
      ...initialProcess,
      elements: new Map<string, TProcessElement>(),
    };
    state.processes.delete(action.payload.oldName);
    return {
      ...state,
      processes: state.processes.set(action.payload.newName, process),
    };
  })
  .handleType(EProcessActionTypes.REMOVE_PROCESS, (state, action) => {
    const processes = state.processes;
    processes.delete(action.payload.name);
    return { ...state, processes, selected: undefined };
  })
  .handleType(EProcessActionTypes.CREATE_ELEMENT, (state, action) => {
    if (!action.payload.element) return state;
    const process = state.processes.get(action.payload.process);
    if (process) {
      process.elements.set(action.payload.element.name, action.payload.element);
      return {
        ...state,
        processes: state.processes.set(action.payload.process, process),
      };
    } else return state;
  })
  .handleType(EProcessActionTypes.CREATE_INSTR_ELEMENT, (state, action) => {
    const { process, element } = action.payload;
    const p = state.processes.get(process);
    if (!p) return state;
    const changed: TProcess = {
      ...p,
      instrumentations: [...(p.instrumentations ?? []), element],
    };
    return { ...state, processes: state.processes.set(process, changed) };
  })
  .handleType(EProcessActionTypes.CHANGE_INSTR_ELEMENT, (state, action) => {
    const { process, element } = action.payload;
    const p = state.processes.get(process);
    if (!p) return state;
    const changed: TProcess = {
      ...p,
      instrumentations: p.instrumentations!.map((i) =>
        i.id === element.id ? element : i
      ),
    };
    const selectedInstr =
      state.selectedInstr?.id === element.id ? element : state.selectedInstr;
    return {
      ...state,
      processes: state.processes.set(process, changed),
      selectedInstr,
      selectedInstrLine: undefined,
    };
  })
  .handleType(
    EProcessActionTypes.CHANGE_INSTR_ELEMENT_FIELD,
    (state, action) => {
      const { process, id, field, value } = action.payload;
      const p = state.processes.get(process);
      if (!p) return state;
      let element = p.instrumentations?.find((i) => i.id === id);
      if (!element) return state;
      element = { ...element, [field]: value };
      const changed: TProcess = {
        ...p,
        instrumentations: p.instrumentations!.map((i) =>
          i.id === id ? element! : i
        ),
      };
      const selectedInstr =
        state.selectedInstr?.id === element.id ? element : state.selectedInstr;
      return {
        ...state,
        processes: state.processes.set(process, changed),
        selectedInstr,
        selectedInstrLine: undefined,
      };
    }
  )
  .handleType(EProcessActionTypes.REMOVE_INSTR_ELEMENT, (state, action) => {
    const { process, element } = action.payload;
    const p = state.processes.get(process);
    if (!p) return state;
    let instrs = p.instrumentations ?? [];
    instrs = instrs.filter((i) => i.id !== element.id);
    let changed: TProcess = { ...p, instrumentations: instrs };
    if (element.parentType === "PIPE") {
      let lines = p.lines ?? [];
      const line = lines.find((l) => l.id === element.parent);
      if (line) {
        lines = lines.map((l) => {
          if (l.id === line.id) {
            const segments = l.segments.map((s) =>
              s.id === element.parentID
                ? {
                    ...s,
                    instrumentationIDs: s.instrumentationIDs?.filter(
                      (id) => id !== element.id
                    ),
                  }
                : s
            );
            return { ...l, segments };
          }
          return l;
        });
        changed = { ...changed, lines };
      }
    } else if (element.parentType === "PROCESS") {
      const el = changed.elements.get(element.parent + "");
      if (el) {
        changed.elements.set(el.name, {
          ...el,
          instrumentationIDs: el.instrumentationIDs?.filter(
            (id) => id !== element.id
          ),
        });
      }
    }
    if (element.connected) {
      instrs = instrs.map((i) =>
        i.id === element.connected ? { ...i, connected: undefined } : i
      );
      changed = { ...changed, instrumentations: instrs };
    }
    let lines = p.instrumentationLines ?? [];
    lines = lines.filter((l) => l.from !== element.id && l.to !== element.id);
    changed = { ...changed, instrumentationLines: lines };
    return {
      ...state,
      processes: state.processes.set(process, changed),
      selectedInstr: undefined,
      selectedInstrLine: undefined,
    };
  })
  .handleType(EProcessActionTypes.SELECT_INSTR_ELEMENT, (state, action) => {
    const { element } = action.payload;
    return {
      ...state,
      selected: undefined,
      selectedNozzle: undefined,
      selectedLine: undefined,
      selectedPoint: undefined,
      selectedInstr: element,
      selectedInstrLine: undefined,
    };
  })
  .handleType(EProcessActionTypes.CHANGE_ELEMENT, (state, action) => {
    const { process, element } = action.payload;
    const p = state.processes.get(process);
    if (p) {
      p.elements.set(element.name, element);
      const selected =
        state.selected?.name === element.name ? element : state.selected;
      return {
        ...state,
        processes: state.processes.set(process, updateProcessLines(p, element)),
        selected,
        selectedPoint: undefined,
      };
    } else return state;
  })
  .handleType(EProcessActionTypes.RELOCATE_ELEMENT, (state, action) => {
    const { process, element } = action.payload;
    let p = state.processes.get(process);
    if (p) {
      const old = p.elements.get(element.name)?.position ?? {
        x: 0,
        y: 0,
        z: 0,
      };
      p.elements.set(element.name, element);
      const selected =
        state.selected?.name === element.name ? element : state.selected;
      if (element.instrumentationIDs?.length) {
        let instrs = p.instrumentations ?? [];
        instrs = instrs.map((i) =>
          element.instrumentationIDs!.includes(i.id)
            ? {
                ...i,
                x: roundM(i.x - old.x + element.position.x),
                y: roundM(i.y - old.y + element.position.y),
                z: roundM(i.z - old.z + element.position.z),
              }
            : i
        );
        p = { ...p, instrumentations: instrs };
      }
      return {
        ...state,
        processes: state.processes.set(process, updateProcessLines(p, element)),
        selected,
      };
    } else return state;
  })
  .handleType(EProcessActionTypes.REMOVE_ELEMENT, (state, action) => {
    const { process, name } = action.payload;
    const p = state.processes.get(process);
    if (p) {
      const del = p.elements.get(name);
      if (!del) return state;
      for (const point of del.points) {
        if (!point.element) continue;
        const connected = p.elements.get(point.element);
        if (!connected) continue;
        if (connected.points.some((p) => p.element === del.name)) {
          p.elements.set(connected.name, {
            ...connected,
            points: connected.points.map((p) => {
              if (p.element === del.name) {
                return {
                  ...p,
                  element: undefined,
                  connectionType: p.connectionType,
                };
              }
              return p;
            }),
          });
        }
      }
      const lines =
        p.lines?.filter((l) => l.from !== name && l.to !== name) ?? [];
      p.elements.delete(name);
      let instrs = p.instrumentations ?? [];
      let instrLines = p.instrumentationLines ?? [];
      if (del.instrumentationIDs?.length) {
        instrs = instrs.filter((i) => {
          if (del.instrumentationIDs!.includes(i.id)) {
            instrLines = instrLines.filter(
              (il) => il.from !== i.id && il.to !== i.id
            );
            return false;
          }
          return true;
        });
      }
      return {
        ...state,
        processes: state.processes.set(process, {
          ...p,
          lines,
          instrumentations: instrs,
          instrumentationLines: instrLines,
        }),
        selected: undefined,
        selectedPoint: undefined,
      };
    } else return state;
  })
  .handleType(EProcessActionTypes.SELECT_ELEMENT, (state, action) => {
    return {
      ...state,
      selected: action.payload.element,
      selectedNozzle: undefined,
      selectedLine: undefined,
      selectedPoint: undefined,
      selectedInstr: undefined,
      selectedInstrLine: undefined,
    };
  })
  .handleType(
    EProcessActionTypes.SELECT_ELEMENT_POINT_NOZZLE,
    (state, action) => {
      return {
        ...state,
        selected: action.payload.element,
        selectedNozzle: {el:action.payload.element,point:action.payload.point, 
          isProcessNozzle:true,
        },
        selectedLine: undefined,
        selectedPoint: action.payload.point,
        selectedInstr: undefined,
        selectedInstrLine: undefined,
      };
    }
  )
  .handleType(EProcessActionTypes.SELECT_ELEMENT_NOZZLE, (state, action) => {
    return {
      ...state,
      selected: undefined,
      selectedNozzle: action.payload.element,
      selectedLine: undefined,
      selectedPoint: undefined,
      selectedInstr: undefined,
      selectedInstrLine: undefined,
    };
  })
  .handleType(EProcessActionTypes.SELECT_CONNECTION_POINT, (state, action) => {
    const { element, id } = action.payload;
    return {
      ...state,
      selected: element,
      selectedPoint: element.points.find((p) => p.id === id),
    };
  })
  .handleType(EProcessActionTypes.CONNECT_ELEMENTS, (state, action) => {
    const { processName, process, lines, selected } = action.payload;
    if (!process) return state;
    return {
      ...state,
      processes: state.processes.set(processName, { ...process, lines }),
      selected,
      selectedPoint: undefined,
      selectedInstr: undefined,
      selectedInstrLine: undefined,
    };
  })
  .handleType(
    EProcessActionTypes.CHANGE_ELEMENTS_CONNECTIONS,
    (state, action) => {
      const { process, element, points } = action.payload;
      const p = state.processes.get(process);
      if (!p) return state;
      p.elements.set(element.name, element);
      let lines = p.lines ?? [];
      for (const point of points) {
        if (!point.element) continue;
        const connected = p.elements.get(point.element);
        if (!connected?.points.some((p) => p.element === element.name))
          continue;
        p.elements.set(connected.name, {
          ...connected,
          points: connected.points.map((p) =>
            p.element === element.name
              ? {
                  ...p,
                  element: undefined,
                  connectionType: p.connectionType,
                }
              : p
          ),
        });
        lines = lines.filter(
          (l) => !(l.from === element.name && l.to === connected.name)
        );
      }
      const changed = { ...p, lines };
      return {
        ...state,
        processes: state.processes.set(
          process,
          updateProcessLines(changed, element)
        ),
        selected: element,
      };
    }
  )
  .handleType(EProcessActionTypes.CHANGE_ANALYSIS, (state, action) => {
    const { processName, process } = action.payload;
    return { ...state, processes: state.processes.set(processName, process) };
  })
  .handleType(EProcessActionTypes.LOAD_PROCESS, (state, action) => {
    const { processName, process } = action.payload;
    return { ...state, processes: state.processes.set(processName, process) };
  })
  .handleType(EProcessActionTypes.CHANGE_PROCESS_ISSUES, (state, action) => {
    const { processName, issues } = action.payload;
    const process = state.processes.get(processName);
    if (!process) return state;
    return {
      ...state,
      processes: state.processes.set(processName, { ...process, issues }),
    };
  })
  .handleType(EProcessActionTypes.CHANGE_PROCESS_IMPORTED, (state, action) => {
    const { processName, news, imported } = action.payload;
    const process = state.processes.get(processName);
    if (!process) return state;
    const elements = process.elements;
    let lines = news.lines ?? [];
    for (const el of Array.from(news.elements.values())) {
      const arr = Array.from(elements.values());
      const newName = `${el.type}${getIndexName(arr, el.type)}`;
      elements.set(newName, { ...el, name: newName });
      lines = lines.map((l) =>
        l.from === el.name || l.to === el.name
          ? {
              ...l,
              from: l.from === el.name ? newName : l.from,
              to: l.to === el.name ? newName : l.to,
            }
          : l
      );
    }

    return {
      ...state,
      processes: state.processes.set(processName, {
        ...process,
        elements,
        lines,
        imported,
      }),
    };
  })
  .handleType(EProcessActionTypes.SELECT_PROCESS_LINE, (state, action) => {
    const { line } = action.payload;
    return {
      ...state,
      selectedLine: line,
      selectedNozzle: undefined,
      selected: undefined,
      selectedPoint: undefined,
      selectedInstr: undefined,
      selectedInstrLine: undefined,
    };
  })
  .handleType(EProcessActionTypes.CHANGE_PROCESS_LINE, (state, action) => {
    const { processName, line } = action.payload;
    const process = state.processes.get(processName);
    if (!process) return state;
    return {
      ...state,
      processes: state.processes.set(processName, {
        ...process,
        lines: process.lines?.map((l) => (l.id === line.id ? line : l)) ?? [],
      }),
      selectedLine:
        state.selectedLine?.id === line.id ? line : state.selectedLine,
    };
  })
  .handleType(EProcessActionTypes.REMOVE_PROCESS_LINE, (state, action) => {
    const { processName, line } = action.payload;
    const process = state.processes.get(processName);
    if (!process) return state;
    const from = process.elements.get(line.from);
    const to = line.to ? process.elements.get(line.to) : undefined;
    if (!from) return state;
    process.elements.set(from.name, {
      ...from,
      points: from.points.map((p) =>
        p.element === to?.name
          ? {
              ...p,
              element: undefined,
              connectionType: p.connectionType,
            }
          : p
      ),
    });
    if (to)
      process.elements.set(to.name, {
        ...to,
        points: to.points.map((p) =>
          p.element === from.name
            ? {
                ...p,
                element: undefined,
                connectionType: p.connectionType,
              }
            : p
        ),
      });
    let instrs = process.instrumentations ?? [];
    for (const s of line.segments) {
      if (s.instrumentationIDs?.length) {
        instrs = instrs.filter((i) => !s.instrumentationIDs!.includes(i.id));
      }
    }
    return {
      ...state,
      processes: state.processes.set(processName, {
        ...process,
        lines: process.lines?.filter((l) => l.id !== line.id),
        instrumentations: instrs,
      }),
      selectedLine: undefined,
    };
  })
  .handleType(EProcessActionTypes.CHANGE_TITLES, (state, action) => {
    const { processName, field, value } = action.payload;
    const process = state.processes.get(processName);
    if (!process) return state;
    const changed: TProcess = {
      ...process,
      titles: { ...process.titles, [field]: value },
    };
    return { ...state, processes: state.processes.set(processName, changed) };
  })
  .handleType(EProcessActionTypes.CHANGE_REVISION, (state, action) => {
    const { processName, revisions } = action.payload;
    const process = state.processes.get(processName);
    if (!process) return state;
    const changed: TProcess = { ...process, revisions };
    return { ...state, processes: state.processes.set(processName, changed) };
  })
  .handleType(EProcessActionTypes.CONNECT_INSTR_ELEMENT, (state, action) => {
    const { processName, from, to } = action.payload;
    const process = state.processes.get(processName);
    if (!process) return state;
    let instrs = process.instrumentations ?? [];
    let instrLines = process.instrumentationLines ?? [];
    if (from.connected) {
      instrs = instrs.map((i) =>
        i.id === from.connected ? { ...i, connected: undefined } : i
      );
      instrLines = instrLines.filter(
        (i) => i.from !== from.id && i.to !== from.connected
      );
    }
    instrs = instrs.map((i) =>
      i.id === from.id
        ? { ...i, connected: to.id }
        : i.id === to.id
        ? { ...i, connected: from.id }
        : i
    );
    const line: TInstrumentationLine = {
      id: getNextId(instrLines),
      from: from.id,
      to: to.id,
      type: "Instrument signal",
      connectionType: "ItoI",
    };
    instrLines.push(line);
    return {
      ...state,
      processes: state.processes.set(processName, {
        ...process,
        instrumentations: instrs,
        instrumentationLines: instrLines,
      }),
      selectedInstr: undefined,
      selectedInstrLine: line,
    };
  })
  .handleType(EProcessActionTypes.CHANGE_INSTR_LINE, (state, action) => {
    const { processName, line } = action.payload;
    const process = state.processes.get(processName);
    if (!process) return state;
    let lines = process.instrumentationLines ?? [];
    lines = lines.map((l) => (l.id === line.id ? line : l));
    const selectedInstrLine =
      state.selectedInstrLine?.id === line.id ? line : state.selectedInstrLine;
    return {
      ...state,
      processes: state.processes.set(processName, {
        ...process,
        instrumentationLines: lines,
      }),
      selectedInstrLine,
    };
  })
  .handleType(EProcessActionTypes.REMOVE_INSTR_LINE, (state, action) => {
    const { processName, line } = action.payload;
    const process = state.processes.get(processName);
    if (!process) return state;
    let instrs = process.instrumentations ?? [];
    let lines = process.instrumentationLines ?? [];
    lines = lines.filter((l) => l.id !== line.id);
    instrs = instrs.map((i) =>
      i.id === line.from
        ? { ...i, connected: undefined }
        : i.id === line.to
        ? { ...i, connected: undefined }
        : i
    );
    return {
      ...state,
      processes: state.processes.set(processName, {
        ...process,
        instrumentations: instrs,
        instrumentationLines: lines,
      }),
      selectedInstrLine: undefined,
    };
  })
  .handleType(EProcessActionTypes.SELECT_INSTR_LINE, (state, action) => {
    const { line } = action.payload;
    return {
      ...state,
      selected: undefined,
      selectedPoint: undefined,
      selectedInstr: undefined,
      selectedLine: undefined,
      selectedInstrLine: line,
    };
  })
  .handleType(EProcessActionTypes.CREATE_INSTR_LINE, (state, action) => {
    const { processName, line } = action.payload;
    const process = state.processes.get(processName);
    if (!process) return state;
    let lines = process.instrumentationLines ?? [];
    lines = [...lines, line];
    return {
      ...state,
      processes: state.processes.set(processName, {
        ...process,
        instrumentationLines: lines,
      }),
    };
  })
  .handleType(
    EProcessActionTypes.CREATE_CUSTOM_ELEMENTS_CONNECTION,
    (state, action) => {
      const { processName, process, lines } = action.payload;
      return {
        ...state,
        processes: state.processes.set(processName, { ...process, lines }),
        selectedPoint: undefined,
        selectedInstr: undefined,
        selectedInstrLine: undefined,
      };
    }
  )
  .handleType(EProcessActionTypes.CHANGE_CONNECTION_ACTION, (state, action) => {
    const { processName, process, lines } = action.payload;
    return {
      ...state,
      processes: state.processes.set(processName, { ...process, lines }),
      selectedPoint: undefined,
      selectedInstr: undefined,
      selectedInstrLine: undefined,
    };
  });

export { reducer as ProcessReducer };
