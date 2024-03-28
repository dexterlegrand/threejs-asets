import {
  Direction2,
  Named,
  Project,
  Direction3,
  SimpleDirection3,
  TWorkMode,
  LoadedProject,
  ModelType,
} from "../../store/main/types";
import { Vector3, Vector2 } from "three";
import { deg, rad } from "../../store/main/constants";
import { parse, unparse } from "papaparse";
import { read, utils } from "xlsx";
import { ProjectUI } from "../../store/ui/types";
import {
  Material,
  Section,
  RolledSection,
  CombinedSection,
  TPipingElbow,
} from "../../store/data/types";
import localForage from "localforage";

import { ApplicationState } from "../../store";
import { TProcess } from "../../store/process/types";
import { convertProcessToImporting } from "./process/process";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import Axios from "axios";
import { Dispatch } from "redux";
import { addEventAction } from "../../store/ui/actions";
import {
  openDesigner,
  openProcess,
  openProject,
} from "../menu-bar/project-tab/projectUtils";
import { Property } from "canvg";

export function getCurrentUI(state: ApplicationState) {
  return state.ui.projectUIs.find((ui) => ui.project === state.ui.project);
}

export function getCurrentProject(state: ApplicationState) {
  return state.main.projects.find((p) => p.name === state.main.currentProject);
}

export function getCurrentProcess(state: ApplicationState) {
  return state.process.processes?.get(state.main.currentProject);
}

export function getCurrentPSS(state: ApplicationState) {
  return state.pss.simulations.find(
    (s) => s.project === state.main.currentProject
  );
}

export function getNextId<T extends { id: number }>(
  target?: T[],
  field = "id"
) {
  return (
    // @ts-ignore
    (target?.reduce((max, item) => Math.max(max, item[field]), 0) ?? 0) + 1
  );
}

export function getIndexName(target: any[], name: string, field?: string) {
  let index = 1;
  const property = field ?? "name";
  while (
    target.some(
      (item) =>
        item[property].toLocaleLowerCase() ===
        `${name}${index}`.toLocaleLowerCase()
    )
  ) {
    index++;
  }
  return index;
}

export function getPName(target: any[], name: string, field?: string) {
  let index = 1;
  const property = field ?? "preceding";
  while (
    target.some(
      (item) =>
        item[property].toLocaleLowerCase() ===
        `${name}${index}`.toLocaleLowerCase()
    )
  ) {
    index++;
  }
  return index;
}

export function getPreceedingName(
  target: any[],
  preceding: string,
  field?: string
) {
  let index = 1;
  const property = field ?? "preceding";
  while (
    target.some(
      (item) =>
        item[property].toLocaleLowerCase() ===
        `${preceding}${index}`.toLocaleLowerCase()
    )
  ) {
    index++;
  }
  return index;
}

export function getElementsByParent<T extends { parent: string }>(
  elements: T[],
  parent: string
) {
  return elements.filter((el) => el.parent === parent);
}

export function getElementByName<T extends Named>(
  elements?: T[],
  name?: string
) {
  return elements?.find((el) => el.name === name);
}

export function getElementByField<T>(
  elements?: T[],
  field?: string,
  value?: any
) {
  if (!elements || !field) return undefined;
  return elements.find((el: any) => el[field] === value);
}

export function concatUnique<T>(
  arr1: T[] | undefined,
  arr2: T[] | undefined,
  comparator?: (a: T, b: T) => boolean
) {
  if (!arr1) return arr2;
  if (!arr2) return arr1;
  return [
    ...arr1,
    ...arr2.filter(
      (item2) =>
        !arr1.some((item1) =>
          comparator ? comparator(item1, item2) : item1 === item2
        )
    ),
  ];
}

/**
 * @param a1 start :: f.e. by x
 * @param b1 start :: f.e. by z
 * @param a2 end :: f.e. by x
 * @param b2 end :: f.e. by z
 * @returns angle between lines
 **/
export function getRotationByLegs(
  a1: number,
  b1: number,
  a2: number,
  b2: number
) {
  const angle = -Math.atan((b2 - b1) / (a2 - a1));
  return angle ? angle : 0;
}

/**
 * @param a1 start :: f.e. by x
 * @param b1 start :: f.e. by z
 * @param a2 end :: f.e. by x
 * @param b2 end :: f.e. by z
 * @param offsetA offset from a1
 * @returns offset from b1
 **/
export function getOffsetB(
  a1: number,
  b1: number,
  a2: number,
  b2: number,
  offsetA: number
) {
  return getRotationByLegs(a1, b1, a2, b2) * offsetA;
}

export function MtoMM(meters: number) {
  return meters * 1000;
}

export function MMtoM(millimeters: number) {
  return millimeters / 1000;
}

export function fixValueToNumber(
  value?: number | string,
  type: "int" | "float" = "int"
): number {
  if (value === undefined || value === null) return 0;
  if (typeof value === "string") {
    const fixValue = value.replace(",", ".");
    const parsed = type === "int" ? parseInt(fixValue) : parseFloat(fixValue);
    return parsed ? parsed : 0;
  }
  return value;
}

export function localToGlobal(
  startPos: Vector3,
  pos: Vector3,
  dir: Direction2
) {
  const angle = getOrientationByDirection(dir);
  const rotated = fixVectorByOrientation(new Vector3(), pos, angle);
  const result = new Vector3(
    (startPos?.x ?? 0) + rotated.x,
    (startPos?.y ?? 0) + rotated.y,
    (startPos?.z ?? 0) + rotated.z
  );
  return result;
}

export function convertXYZToVector3(x: number, y: number, z: number): Vector3 {
  return convertToVector3({ x, y, z });
}

export function convertToVector3({ x, y, z }: any): Vector3 {
  return new Vector3(x, y, z);
}

export function globalToLocal(
  startPos: Vector3,
  pos: Vector3,
  dir: Direction2
) {
  switch (dir) {
    case "+X":
      return new Vector3(
        pos.x - startPos.x,
        pos.y - startPos.y,
        pos.z - startPos.z
      );
    case "+Z":
      return new Vector3(
        -startPos.z + pos.z,
        pos.y - startPos.y,
        startPos.x - pos.x
      );
    case "-X":
      return new Vector3(
        startPos.x - pos.x,
        pos.y - startPos.y,
        startPos.z - pos.z
      );
    case "-Z":
      return new Vector3(
        startPos.z - pos.z,
        pos.y - startPos.y,
        startPos.x + pos.x
      );
    default:
      return pos.clone();
  }
}
export function vector3FromPoint(point: { x: number; y: number; z: number }) {
  return new Vector3(point.x, point.y, point.z);
}
export function fixVectorByOrientation(
  center = new Vector3(),
  v = new Vector3(),
  o = 0,
  axis: "x" | "y" | "z" = "y"
) {
  const rad = degToRad(o);
  const rotation = new Vector2();
  switch (axis) {
    case "x":
      rotation.copy(
        rotateVector2(
          new Vector2(v.y, v.z),
          new Vector2(center.y, center.z),
          rad
        )
      );
      return new Vector3(v.x, roundM(rotation.x), roundM(rotation.y));
    case "y":
      rotation.copy(
        rotateVector2(
          new Vector2(v.x, v.z),
          new Vector2(center.x, center.z),
          rad
        )
      );
      return new Vector3(roundM(rotation.x), v.y, roundM(rotation.y));
    case "z":
      rotation.copy(
        rotateVector2(
          new Vector2(v.x, v.y),
          new Vector2(center.x, center.y),
          rad
        )
      );
      return new Vector3(roundM(rotation.x), roundM(rotation.y), v.z);
  }
}

export function rotateVector2(v: Vector2, center: Vector2, rad: number) {
  return new Vector2(
    (v.x - center.x) * Math.cos(rad) -
      (v.y - center.y) * Math.sin(rad) +
      center.x,
    (v.x - center.x) * Math.sin(rad) +
      (v.y - center.y) * Math.cos(rad) +
      center.y
  );
}

/**
 * @param table HTMLTableElement
 * @param row number of necessary row
 * @returns row top offset
 **/
export function getTopOffset(table: HTMLTableElement | null, row: number = 0) {
  if (!table) return 0;
  return table.tHead?.rows[row]?.offsetTop ?? 0;
}

export function setDefaultCellWidth(
  table: HTMLTableElement | null,
  count: number
) {
  if (!table) return 0;
  const header = table.tHead;
  if (!header) return 0;
  const width = table.clientWidth / count;
  for (const row of header.rows) {
    for (const cell of row.cells) {
      if (cell.colSpan > 1 || cell.className) continue;
      cell.setAttribute("width", `${width}px`);
    }
  }
}

export function degToRad(deg: number) {
  return deg * rad;
}

export function radToDeg(rad: number) {
  return rad * deg;
}

export function saveToFile(
  obj: any,
  name: string,
  extension: string,
  type?: string
) {
  const content = typeof obj === "string" ? obj : JSON.stringify(obj);
  const a = document.createElement("a");
  a.href = URL.createObjectURL(
    new Blob([content], { type: type ?? "text/plain" })
  );
  a.download = `${name}.${extension}`;
  a.click();
  a.remove();
}

export function getRGB(rgb: number[]) {
  return `rgb(${rgb[0]},${rgb[1]},${rgb[2]})`;
}

export function fixRGB(rgb: number[]) {
  return getRGB([
    rgb[0] > 20 ? rgb[0] - 20 : 0,
    rgb[1] > 20 ? rgb[1] - 20 : 0,
    rgb[2] > 20 ? rgb[2] - 20 : 0,
  ]);
}

export function checkFileType(fileName: string) {
  return fileName.replace(/^.+\./, "").toLowerCase();
}

export function fixNumberToStr(value: any) {
  return value !== undefined ? ` ${`${value}`.replace(",", ".")}` : "";
}

export function exportToCSV(data: any[], name: string) {
  const unparseResult = unparse(data, { header: true, delimiter: ";" });
  const result = unparseResult
    .split("\r\n")
    .map((row) =>
      row
        .split(";")
        .map((element) => {
          if (new RegExp(/^-?\d+,\d+$/gm).test(element)) {
            return fixNumberToStr(element);
          }
          return element;
        })
        .join(",")
    )
    .join("\r\n");
  saveToFile(result, name, "csv");
}

export function openFile(
  extensions: string[],
  callback: (files: File[]) => any,
  isMultiple = false
) {
  const input = document.createElement("input");
  input.type = "file";
  input.accept = extensions.join(",");
  input.multiple = isMultiple;
  input.onchange = (event: any) => {
    const files = event.target.files as FileList;
    if (files && files.length) {
      callback(Array.from(files));
    }
    input.remove();
  };
  input.click();
}

export function readFileAsync(file: File) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        resolve(reader.result);
      } else {
        resolve(new TextDecoder("utf-8").decode(reader.result ?? undefined));
      }
    };
    reader.onerror = reject;
    reader.readAsArrayBuffer(file);
  });
}

export function importFromCSV(callback: (arr: any[], isCSV?: boolean) => any) {
  openFile([".csv", ".xls", ".xlsx"], (files) => {
    for (const file of files) {
      if (!file) continue;
      const type = checkFileType(file.name);
      if (type === "xlsx" || type === "xls") {
        const reader = new FileReader();
        reader.onload = (e) => {
          const data = e.target?.result;
          const workbook = read(data, { type: "binary" });
          // @ts-ignore
          const XL_row_object = utils.sheet_to_row_object_array(
            workbook.Sheets[workbook.SheetNames[0]]
          );
          Array.isArray(XL_row_object) && callback(XL_row_object);
        };
        reader.onerror = (ex) => console.error(ex);
        reader.readAsBinaryString(file);
      } else if (type === "csv") {
        parse<any>(file, {
          header: true,
          dynamicTyping: true,
          complete: (arr) => callback(arr.data, true),
        });
        console.log("files is opening", file);
      } else callback([]);
    }
  });
}

export function checkImportedNumber(
  value: any,
  isNegative: boolean = true
): number | undefined {
  const number = Number(value);
  if (!isNaN(number)) {
    return isNegative ? number : Math.abs(number);
  }
  return undefined;
}

export function getImportMaterialByMaterialName(
  materials: Material[],
  value: any,
  onError?: () => any
) {
  if (value) {
    const material = materials.find(
      (material) => material.material_name === value
    );
    if (material) {
      return material;
    } else onError && onError();
  }
  return undefined;
}

export function getImportProfileByDesignation(
  profiles: Section[],
  value: any,
  onError?: () => any
) {
  if (value) {
    const profile = profiles.find((profile) => profile.designation === value);
    if (profile) {
      return profile;
    } else onError && onError();
  }
  return undefined;
}

export function getProfileLibrary(profile?: Section) {
  return profile?.country_code?.trim();
}

export function saveGenericProject(
  project: Project | undefined,
  ui: ProjectUI | undefined,
  process: TProcess | undefined,
  mode: TWorkMode,
  fabricatedSections: Section[],
  rolledSections: RolledSection[],
  combinedSections: CombinedSection[],
  userDefinedElbows: TPipingElbow[],
  controls: OrbitControls | undefined
) {
  if (!project) return;
  let content = {};
  let extension = "";
  if (mode === "PROCESS" && process) {
    extension = "psm";
    content = {
      ...convertProcessToImporting(project.name, process, true),
      project: {
        ...project,
        models: [],
        freePipes: undefined,
        flares: undefined,
        towers: undefined,
        importedProcess: undefined,
        locked: false,
        modelType: undefined,
        notEditableProjects: project.notEditableProjects?.filter(
          (nep) => nep.locked
        ),
        notEditableProcesses: project.notEditableProcesses
          ?.filter((nep) => nep.locked)
          .map((nep) => ({
            ...nep,
            process: convertProcessToImporting(nep.name, nep.process),
          })),
        pipeAnalysis: undefined,
      } as Project,
      camera: convertControls(controls),
    };
  } else if (mode === "DESIGNER") {
    extension = "ddd";
    content = {
      ...(process
        ? convertProcessToImporting(project.name, process, true)
        : {}),
      project: {
        ...project,
        freePipes: project?.freePipes || [],
        pipeAnalysis: undefined,
      } as Project,
      fabricatedSections,
      rolledSections,
      combinedSections,
      userDefinedElbows,
      ui: ui ? { ...ui, analysisUI: {} } : undefined,
      camera: convertControls(controls),
    };
  } else if (mode === "PRODESIGNER") {
    extension = "dddpsm";
    content = {
      ...(process
        ? convertProcessToImporting(project.name, process, true)
        : {}),
      project: {
        ...project,
        freePipes: project?.freePipes || [],
        pipeAnalysis: undefined,
      } as Project,
      fabricatedSections,
      rolledSections,
      combinedSections,
      userDefinedElbows,
      ui: ui ? { ...ui, analysisUI: {} } : undefined,
      camera: convertControls(controls),
    };
  } else if (mode === "PIPDESIGNER") {
    extension = "dddpps";
    content = {
      ...(process
        ? convertProcessToImporting(project.name, process, true)
        : {}),
      project: {
        ...project,
        freePipes: project?.freePipes || [],
        pipeAnalysis: undefined,
      } as Project,
      fabricatedSections,
      rolledSections,
      combinedSections,
      userDefinedElbows,
      ui: ui ? { ...ui, analysisUI: {} } : undefined,
      camera: convertControls(controls),
    };
  } else if (mode === "STRDESIGNER") {
    extension = "dddstru";
    content = {
      ...(process
        ? convertProcessToImporting(project.name, process, true)
        : {}),
      project: {
        ...project,
        freePipes: project?.freePipes || [],
        pipeAnalysis: undefined,
      } as Project,
      fabricatedSections,
      rolledSections,
      combinedSections,
      userDefinedElbows,
      ui: ui ? { ...ui, analysisUI: {} } : undefined,
      camera: convertControls(controls),
    };
  } else if (mode === "PIPING") {
    extension = "pps";
    content = {
      project: {
        ...project,
        models: [],
        freePipes: project.freePipes ?? [],
        flares: undefined,
        towers: undefined,
        importedProcess: undefined,
        locked: false,
        modelType: undefined,
        notEditableProjects: project.notEditableProjects?.filter(
          (nep) => nep.locked
        ),
        notEditableProcesses: project.notEditableProcesses
          ?.filter((nep) => nep.locked)
          .map((nep) => ({
            ...nep,
            process: convertProcessToImporting(nep.name, nep.process),
          })),
        pipeAnalysis: undefined,
      } as Project,
      fabricatedSections,
      rolledSections,
      combinedSections,
      userDefinedElbows,
      ui: { ...ui, analysisUI: {} },
      camera: convertControls(controls),
    };
  } else if (mode === "STRUCTURE") {
    if (project.modelType === "Flare") {
      extension = "fds";
      content = {
        project: {
          ...project,
          models: [],
          freePipes: [],
          flares: project.flares ?? [],
          towers: [],
          importedProcess: undefined,
          locked: false,
          modelType: "Flare",
          notEditableProjects: project.notEditableProjects?.filter(
            (nep) => nep.locked
          ),
          notEditableProcesses: project.notEditableProcesses
            ?.filter((nep) => nep.locked)
            .map((nep) => ({
              ...nep,
              process: convertProcessToImporting(nep.name, nep.process),
            })),
          pipeAnalysis: undefined,
        } as Project,
        fabricatedSections,
        rolledSections,
        combinedSections,
        userDefinedElbows,
        ui: { ...ui, analysisUI: {} },
        camera: convertControls(controls),
      };
    } else if (project.modelType === "Pipe Rack") {
      extension = "pds";
      content = {
        project: {
          ...project,
          models: project.models.filter((m) => m.type === "Pipe Rack"),
          freePipes: undefined,
          flares: undefined,
          towers: undefined,
          importedProcess: undefined,
          locked: false,
          modelType: "Pipe Rack",
          notEditableProjects: project.notEditableProjects?.filter(
            (nep) => nep.locked
          ),
          notEditableProcesses: project.notEditableProcesses
            ?.filter((nep) => nep.locked)
            .map((nep) => ({
              ...nep,
              process: convertProcessToImporting(nep.name, nep.process),
            })),
          pipeAnalysis: undefined,
        } as Project,
        fabricatedSections,
        rolledSections,
        combinedSections,
        userDefinedElbows,
        ui: { ...ui, analysisUI: {} },
        camera: convertControls(controls),
      };
    } else if (
      project.modelType === "Open Frame" ||
      project.modelType === "ROAD" ||
      project.modelType === "Factory Shed"
    ) {
      extension = "ods";
      content = {
        project: {
          ...project,
          models: project.models.filter(
            (m) =>
              m.type === "Open Frame" ||
              m.type === "Factory Shed" ||
              m.type === "ROAD"
          ),
          freePipes: undefined,
          flares: undefined,
          towers: undefined,
          importedProcess: undefined,
          locked: false,
          modelType: project.modelType,
          notEditableProjects: project.notEditableProjects?.filter(
            (nep) => nep.locked
          ),
          notEditableProcesses: project.notEditableProcesses
            ?.filter((nep) => nep.locked)
            .map((nep) => ({
              ...nep,
              process: convertProcessToImporting(nep.name, nep.process),
            })),
          pipeAnalysis: undefined,
        } as Project,
        fabricatedSections,
        rolledSections,
        combinedSections,
        userDefinedElbows,
        ui: { ...ui, analysisUI: {} },
        camera: convertControls(controls),
      };
    }
  }
  const a = document.createElement("a");
  a.href = URL.createObjectURL(
    new Blob([JSON.stringify(content)], { type: "text/plain" })
  );
  a.download = `${project.name}.${extension}`;
  a.click();
  a.remove();
}

export async function openGenericProject(
  dispatch: Dispatch<any>,
  file: File | undefined,
  mode: TWorkMode,
  projects: Project[],
  typeOfModels: ModelType | undefined
) {
  if (!file) return;
  const text = await file.text();
  const extantion = checkFileType(file.name);
  const fileName = file.name.replace("." + extantion, "");
  if (mode === "PROCESS") {
    if (extantion === "psm" || extantion === "ddd") {
      openProcess(dispatch, projects, JSON.parse(text), fileName);
    } else if (extantion === "p2p") {
      openProcess(
        dispatch,
        projects,
        JSON.parse(JSON.parse(text).state ?? "{}"),
        fileName
      );
    } else {
      dispatch(
        addEventAction(`Open project: Incorrect file extension`, "danger")
      );
      return;
    }
  } else if (mode === "DESIGNER") {
    if (
      ["ddd", "dddpsm", "psm", "pps", "fds", "pds", "ods"].includes(extantion)
    ) {
      openDesigner(dispatch, projects, JSON.parse(text), fileName);
    } else {
      dispatch(
        addEventAction(`Open project: Incorrect file extension`, "danger")
      );
      return;
    }
  } else if (mode === "PRODESIGNER") {
    if (["dddpsm", "psm", "pps"].includes(extantion)) {
      openDesigner(dispatch, projects, JSON.parse(text), fileName);
    } else {
      dispatch(
        addEventAction(`Open project: Incorrect file extension`, "danger")
      );
      return;
    }
  } else if (mode === "PIPDESIGNER") {
    if (["dddpps", "psm", "pps"].includes(extantion)) {
      openDesigner(dispatch, projects, JSON.parse(text), fileName);
    } else {
      dispatch(
        addEventAction(`Open project: Incorrect file extension`, "danger")
      );
      return;
    }
  } else if (mode === "STRDESIGNER") {
    if (["dddstru", "fds", "pds", "ods"].includes(extantion)) {
      openProject(
        dispatch,
        projects,
        JSON.parse(text) as LoadedProject,
        fileName,
        typeOfModels
      );
    }
  } else if (mode === "STRUCTURE") {
    if (["ddd", "fds", "pds", "ods"].includes(extantion)) {
      openProject(
        dispatch,
        projects,
        JSON.parse(text) as LoadedProject,
        fileName,
        typeOfModels
      );
    } else {
      dispatch(
        addEventAction(`Open project: Incorrect file extension`, "danger")
      );
      return;
    }
  } else if (mode === "PIPING") {
    if (["ddd", "pps"].includes(extantion)) {
      openProject(
        dispatch,
        projects,
        JSON.parse(text) as LoadedProject,
        fileName,
        "Pipe Line"
      );
    } else {
      dispatch(
        addEventAction(`Open project: Incorrect file extension`, "danger")
      );
      return;
    }
  }
}

function convertControls(controls?: OrbitControls) {
  return controls
    ? {
        target: {
          x: controls.target.x,
          y: controls.target.y,
          z: controls.target.z,
        },
        position: {
          x: controls.object.position.x,
          y: controls.object.position.y,
          z: controls.object.position.z,
        },
      }
    : undefined;
}

export function arrayToString(arr: any[]) {
  try {
    return arr ? `[${arr.join("&")}]` : "[]";
  } catch (error) {
    return "[]";
  }
}

export function stringToArray(str: string) {
  return str
    ? str
        .replace("[", "")
        .replace("]", "")
        .split("&")
    : [];
}

export function convertToNamesArray<T extends Named>(arr?: T[]) {
  return arr?.map((item) => item.name) ?? [];
}

export function getDirection(start: Vector3, end: Vector3): Direction3 {
  const subX = start.x - end.x;
  const subY = start.y - end.y;
  const subZ = start.z - end.z;

  const absX = Math.abs(subX);
  const absY = Math.abs(subY);
  const absZ = Math.abs(subZ);

  const max = Math.max(absX, absY, absZ);

  switch (max) {
    case absX:
      return subX < 0 ? "+X" : "-X";
    case absY:
      return subY < 0 ? "+Y" : "-Y";
    default:
      return subZ < 0 ? "+Z" : "-Z";
  }
}

export function getSimpleDirection(
  start: Vector3,
  end: Vector3
): SimpleDirection3 {
  const subX = start.x - end.x;
  const subY = start.y - end.y;
  const subZ = start.z - end.z;

  const absX = Math.abs(subX);
  const absY = Math.abs(subY);
  const absZ = Math.abs(subZ);

  const max = Math.max(absX, absY, absZ);

  switch (max) {
    case absX:
      return "X";
    case absY:
      return "Y";
    default:
      return "Z";
  }
}

export function getHardDirection(
  start: Vector3,
  end: Vector3
): { axis: SimpleDirection3; dir: boolean; isSoft: boolean } {
  if (start.x !== end.x && start.y === end.y && start.z === end.z) {
    return { axis: "X", dir: start.x < end.x, isSoft: false };
  } else if (start.x === end.x && start.y !== end.y && start.z === end.z) {
    return { axis: "Y", dir: start.y < end.y, isSoft: false };
  } else if (start.x === end.x && start.y === end.y && start.z !== end.z) {
    return { axis: "Z", dir: start.z < end.z, isSoft: false };
  }
  const subX = start.x - end.x;
  const subY = start.y - end.y;
  const subZ = start.z - end.z;

  const absX = Math.abs(subX);
  const absY = Math.abs(subY);
  const absZ = Math.abs(subZ);

  const max = Math.max(absX, absY, absZ);

  switch (max) {
    case absX:
      return { axis: "X", dir: subX < 0, isSoft: true };
    case absY:
      return { axis: "Y", dir: subY < 0, isSoft: true };
    default:
      return { axis: "Z", dir: subZ < 0, isSoft: true };
  }
}

export function getMiddleVector2(start: Vector2, end: Vector2) {
  const middle = start.clone();
  middle.add(end);
  middle.divideScalar(2);
  return middle;
}

export function getMiddleVector3(start: Vector3, end: Vector3) {
  const middle = start.clone();
  middle.add(end);
  middle.divideScalar(2);
  return middle;
}

export function getOrientationByDirection(dir?: Direction2) {
  switch (dir) {
    case "-X":
      return 180;
    case "+Z":
      return 90;
    case "-Z":
      return 270;
    case "+X":
    default:
      return 0;
  }
}

export function getDirectionByOrientation(o: number) {
  switch (o) {
    case 180:
    case -180:
      return "-X";
    case 270:
    case -90:
      return "+Z";
    case 90:
    case -270:
      return "-Z";
    case 0:
    default:
      return "+X";
  }
}

export function checkRange(
  value: number,
  from: number,
  to: number,
  isEqualFrom?: boolean,
  isEqualTo?: boolean,
  isNegative?: boolean
) {
  const checkFrom = isEqualFrom ? value >= from : value > from;
  const checkTo = isEqualTo ? value <= to : value < to;
  if (isNegative) {
    const checkFromN = isEqualFrom ? value <= from : value < from;
    const checkToN = isEqualTo ? value >= to : value > to;
    return (checkFrom && checkTo) || (checkFromN && checkToN);
  }
  return checkFrom && checkTo;
}

export function hardCheckRange(value: number, from: number, to: number) {
  return checkRange(value, from, to, true, true, true);
}

export function recreateMap(old: any) {
  const map = new Map<any, any>();
  old && Object.entries(old).forEach(([key, value]) => map.set(key, value));
  return map;
}

export function getPosByDistance(
  distance: number,
  start: Vector3,
  end: Vector3
) {
  const distance2 = start.distanceTo(end) - distance;
  if (!distance2) return end.clone();
  const L = distance / distance2;
  const Lp1 = L + 1;
  const x = (start.x + L * end.x) / Lp1;
  const y = (start.y + L * end.y) / Lp1;
  const z = (start.z + L * end.z) / Lp1;
  return new Vector3(x, y, z);
}

export function getPosByDistance2D(
  distance: number,
  start: Vector2,
  end: Vector2
) {
  const distance2 = start.distanceTo(end) - distance;
  if (!distance2) return end.clone();
  const L = distance / distance2;
  const Lp1 = L + 1;
  const x = (start.x + L * end.x) / Lp1;
  const y = (start.y + L * end.y) / Lp1;
  return new Vector2(x, y);
}

export function getUnicuesArray(arr: any[]) {
  return Array.from(new Set(arr));
}

export function strFilter(query: string, item: string | number) {
  if (!item) return false;
  return !query || `${item}`.toUpperCase().includes(query.toUpperCase());
}

export function replaceSplitNumber(str: string) {
  return str.replace(/\..+$/gi, "");
}

/**
 * @param value any number
 * @param by precision; it must be 1 or multiple of 10
 * @returns rounded value
 **/
export function round(value: number, by?: number) {
  return by ? Math.round(value * by) / by : Math.round(value);
}

export function roundM(value: number, by = 1000) {
  return round(value, by);
}

export function rountMM(value: number) {
  return round(value, 1);
}

export function roundVectorM(v: Vector3, by = 1000) {
  return v.set(roundM(v.x, by), roundM(v.y, by), roundM(v.z, by));
}
export async function getLocalStorageImage(url: string) {
  try {
    const response = await Axios.get(url, { responseType: "blob" });
    const dataUrl = await new Promise((resolve, _) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result);
      reader.readAsDataURL(response.data);
    });
    localStorage.setItem(url, dataUrl as any);
  } catch (e) {
    //
  }
  return localStorage.getItem(url);
}

export async function getLocalStorageSTL(url: string) {
  let dataUrl;
  // = await localForage.getItem<string>(url);
  // if (!dataUrl) {
  // STL is not in IndexedDB
  try {
    const response = await Axios.get(url, { responseType: "blob" });
    dataUrl = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(response.data);
    });
    // await localForage.setItem(url, dataUrl);
  } catch (e) {
    console.error("Error while loading and storing STL: ", e);
  }
  // }
  return dataUrl ? atob(dataUrl.split(",")[1]) : null;
}
export async function getLocalStorageFont(url: string) {
  try {
    const response = await Axios.get(url, { responseType: "json" });
    localStorage.setItem(url, response.data);
  } catch (e) {
    //
  }
  return localStorage.getItem(url);
}
