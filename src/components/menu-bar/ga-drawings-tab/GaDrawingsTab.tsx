import React, { FunctionComponent, useEffect, useMemo, useState } from "react";
import {
  faSave,
  faPen,
  faFileExport,
  faFileImport,
} from "@fortawesome/free-solid-svg-icons";
import MenuButton from "../MenuButton";
import { Popover, Tooltip } from "@blueprintjs/core";
import { useDispatch, useSelector } from "react-redux";
import { ApplicationState } from "../../../store";
import {
  Project,
  LoadedProject,
  PipeRack,
  FreePipe,
  ModelType,
  Model,
} from "../../../store/main/types";
import {
  checkFileType,
  checkRange,
  concatUnique,
  getCurrentProcess,
  getCurrentUI,
  getElementByName,
  getIndexName,
  getNextId,
  getPreceedingName,
  openFile,
  saveToFile,
} from "../../3d-models/utils";
import { TOpenFrame } from "../../../store/main/openFrameTypes";
import OpenModelDlg from "../project-tab/OpenModelDlg";
import {
  addEventAction,
  changeOFUIAction,
  changeRequestProgressAction,
  changeUIAction,
} from "../../../store/ui/actions";
import {
  changeNotEditableProjects,
  changeNotEditableProcesses,
  changeUserDefinedElbows,
  changeProjectAction,
  changeFabracatedSections,
  changeRolledSections,
  changeCombinedSections,
  getCII,
} from "../../../store/main/actions";
import { CloseNEProjectsDlg } from "./CloseNEProjectsDlg";
import { initSettings } from "../../../store/main/constants";
import GLTFLoader from "three-gltf-loader";
import {
  Section,
  RolledSection,
  CombinedSection,
  TPipingElbow,
  DataState,
  PipeProfile,
  TPipingCap,
  TPipingCollet,
  TPipingReducer,
  TPipingTee,
  TPipingReturn,
  TPipingFlangeAllPresRating,
  TPipingFlangeBlind,
  TPipingFlangeLapped,
  TPipingFlangeRingJointFacing,
  TPipingFlangeSlipon,
  TPipingFlangeSocketWelding,
  TPipingFlangeThreaded,
  TPipingFlangeWeldingneck,
} from "../../../store/data/types";
import { exportPipes, importPipes } from "../../3d-models/xch/PPxch";
import { exportPRs, importPRs } from "../../3d-models/xch/PRxch";
import { exportOFs, importOFs } from "../../3d-models/xch/OFxch";
import { IsometricView } from "../analysis-tab/piping/isometric-view/IsometrciView";
import {
  fixPipeRack,
  fixOpenFrame,
  fixPipes,
  fixFlares,
} from "../project-tab/projectUtils";
import { PaIDView } from "./process/PaIDView";
import { TProcess, TProcessLine } from "../../../store/process/types";
import {
  updatePipes,
  /*updateCables,*/
  fixImportedProcess,
  convertProcessToImporting,
} from "../../3d-models/process/process";
import { PipingToProcess } from "./process/PipingToProcess";
import { PFDView } from "./process/PFDView";
import { exportToGLTF } from "./exchangeUtils";
import { setProcessAction } from "../../../store/process/actions";
import { TFlare } from "../../../store/main/types/flare";
import { OpenFrameUI, ProjectUI } from "../../../store/ui/types";
import { initialStateProjectUI } from "../../../store/ui/initialState";
import { Dispatch } from "redux";
import { TPipingValve } from "../../../store/data/piping-valves";
import { AnalysisResultsDlg } from "./AnalysisResultsDlg";
import { ISODlg } from "./ISODlg";
import { StaadDlg } from "./StaadDlg";
import Axios from "axios";
import { secondServerAPI } from "../../../pages/utils/agent";
import { TProcessImport } from "../../../store/process/types";
import { ProcessDesignerToPipingDesigner } from "./ProcessDesignertoPipingDesigner";
import { changeImportedToProcessAction } from "../../../store/main/actions";
import { ProcessToPiping } from "./process/ProcessToPiping";
import {
  ODSS,
  ODSSBeamElement,
  ODSSBeamElementType,
  ODSSBeamSection,
  ODSSNode,
  ODSSUserDefinedSection,
} from "../../../store/main/odssTypes";
import { getPName } from "../../3d-models/utils";

type Props = {};

const GaDrawingsTab: FunctionComponent<Props> = () => {
  const [dialog, setDialog] = useState<JSX.Element>();

  const scene = useSelector((state: ApplicationState) => state.main.scene);
  const controls = useSelector(
    (state: ApplicationState) => state.scene.controls
  );
  const projects = useSelector(
    (state: ApplicationState) => state.main.projects
  );
  const mode = useSelector((state: ApplicationState) => state.main.workMode);
  const currentProject = useSelector(
    (state: ApplicationState) => state.main.currentProject
  );
  const resoures = useSelector((state: ApplicationState) => state.data);
  const fabricatedSections = useSelector(
    (state: ApplicationState) => state.main.fabricatedSections
  );
  const rolledSections = useSelector(
    (state: ApplicationState) => state.main.rolledSections
  );
  const combinedSections = useSelector(
    (state: ApplicationState) => state.main.combinedSections
  );
  const userDefinedElbows = useSelector(
    (state: ApplicationState) => state.main.userDefinedElbows
  );
  const process = useSelector((state: ApplicationState) =>
    getCurrentProcess(state)
  );
  const ui = useSelector((state: ApplicationState) => getCurrentUI(state));

  const dispatch = useDispatch();

  const project = useMemo(() => {
    return getElementByName(projects, currentProject);
  }, [projects, currentProject]);

  const neProjects = useMemo(() => {
    return project?.notEditableProjects ?? [];
  }, [project]);

  const neProcesses = useMemo(() => {
    return project?.notEditableProcesses ?? [];
  }, [project]);

  function exportPipesToXCH(project?: Project) {
    if (!project) return;
    exportPipes(controls, project, userDefinedElbows);
  }

  function exportPipeRacksToXCH(project?: Project) {
    if (!project) return;
    exportPRs(
      controls,
      project,
      fabricatedSections,
      rolledSections,
      combinedSections
    );
  }

  function exportOpenFramesToXCH(project?: Project) {
    if (!project) return;
    exportOFs(
      controls,
      project.models.filter((m) => m.type === "Open Frame") as TOpenFrame[],
      fabricatedSections,
      rolledSections,
      combinedSections
    );
  }

  function handleChangeNotEditableProjects(projects: Project[]) {
    dispatch(changeNotEditableProjects(projects));
  }

  function importFromXCH(project?: Project) {
    if (!project) return;
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".xch";
    input.onchange = (event: any) => {
      const file = (event.target.files as FileList)[0];
      if (file && checkFileType(file.name) === "xch") {
        file.text().then((text) => {
          const json = JSON.parse(text);
          if (mode === "PIPING") {
            importPipesFromXCH(json);
          } else if (mode === "STRUCTURE") {
            importPRsFromXCH(json);
            importOFsFromXCH(json);
          } else if (mode === "DESIGNER") {
            importPipesFromXCH(json);
            importPRsFromXCH(json);
            importOFsFromXCH(json);
          }
        });
      }
    };
    input.click();
    input.remove();
  }

  function importPipesFromXCH(json: any) {
    if (json.type !== "Pipes") return;
    const newUserDefinedElbows =
      concatUnique<TPipingElbow>(
        userDefinedElbows,
        json.userDefinedElbows,
        (a, b) =>
          a.nps === b.nps &&
          a.schedule === b.schedule &&
          a.material === b.material &&
          a.d === b.d &&
          a.t === b.t &&
          a.a === b.a &&
          a.degree === b.degree
      ) ?? [];
    importPipes(dispatch, projects, resoures, newUserDefinedElbows, json);
  }

  function getAllProfilesFromXCH(json: any) {
    const newFabricatedSections =
      concatUnique<Section>(
        fabricatedSections,
        json.fabricatedSections,
        (a, b) =>
          a.designation === b.designation &&
          a.shape === b.shape &&
          a.d_global === b.d_global &&
          a.bf_global === b.bf_global &&
          a.tf_global === b.tf_global &&
          a.tfb_global === b.tfb_global &&
          a.tw_global === b.tw_global
      ) ?? [];

    const newRolledSections =
      concatUnique<RolledSection>(
        rolledSections,
        json.rolledSections,
        (a, b) =>
          a.designation === b.designation &&
          a.baseLib === b.baseLib &&
          a.baseProfile === b.baseProfile &&
          a.tpWidth === b.tpWidth &&
          a.tpThickness === b.tpThickness &&
          a.bpWidth === b.bpWidth &&
          a.bpThickness === b.bpThickness
      ) ?? [];

    const newCombinedSections =
      concatUnique<CombinedSection>(
        combinedSections,
        json.combinedSections,
        (a, b) =>
          a.CSLibrary === b.CSLibrary &&
          a.baseProfile === b.baseProfile &&
          a.designation === b.designation &&
          a.combination === b.combination &&
          a.type === b.type &&
          a.gap === b.gap
      ) ?? [];

    const allProfiles = [
      ...resoures.profileSectionData,
      ...newFabricatedSections,
      ...newRolledSections,
      ...newCombinedSections,
    ];
    return {
      allProfiles,
      newFabricatedSections,
      newRolledSections,
      newCombinedSections,
    };
  }

  function importPRsFromXCH(json: any) {
    if (json.type !== "Pipe Rack") return;
    const {
      allProfiles,
      newCombinedSections,
      newFabricatedSections,
      newRolledSections,
    } = getAllProfilesFromXCH(json);
    importPRs(
      dispatch,
      resoures.materials,
      json,
      allProfiles,
      resoures.pipingSS,
      newFabricatedSections,
      newRolledSections,
      newCombinedSections
    );
  }

  function importOFsFromXCH(json: any) {
    if (json.type !== "Open Frame") return;
    const {
      allProfiles,
      newCombinedSections,
      newFabricatedSections,
      newRolledSections,
    } = getAllProfilesFromXCH(json);
    importOFs(
      dispatch,
      projects,
      resoures.materials,
      json,
      allProfiles,
      newFabricatedSections,
      newRolledSections,
      newCombinedSections
    );
  }

  function handleCloseOpenModelDlg(file?: File) {
    if (!file) {
      setDialog(undefined);
      return;
    }
    const extantion = checkFileType(file.name);
    if (["pps", "pds", "ods"].includes(extantion)) {
      file.text().then((text) => {
        openProject(JSON.parse(text) as LoadedProject);
      });
    } else if (["psm"].includes(extantion)) {
      file.text().then((text) => {
        const process = fixImportedProcess(JSON.parse(text));
        dispatch(
          changeNotEditableProcesses([
            ...neProcesses,
            {
              id: getNextId(neProcesses),
              locked: false,
              name: file.name.replace("." + extantion, ""),
              process,
            },
          ])
        );
      });
    } else if (["fd", "fdd"].includes(extantion)) {
      file.text().then((text) => {
        const json: any = JSON.parse(text);
        const loader = new GLTFLoader();
        if (!json.geometry) return;
        loader.parse(
          JSON.stringify(json.geometry),
          "",
          (gltf) => {
            const geometry = gltf.scene;
            geometry.scale.divideScalar(1000);
            const grid = geometry.children.find((child) =>
              child.children.some((child2) => child2.type === "LineSegments")
            );
            grid && geometry.remove(grid);
            const lp: Project = {
              name: json.projects?.name ?? extantion,
              models: [],
              geometry,
            } as any;
            handleChangeNotEditableProjects([...neProjects, lp]);
          },
          () => {
            dispatch(addEventAction(`Open project: Load failed`, "danger"));
          }
        );
      });
    } else {
      dispatch(
        addEventAction(`Open project: Incorrect file extension`, "danger")
      );
      return;
    }
    setDialog(undefined);
  }

  function openProject(lp: LoadedProject) {
    try {
      if (!lp || !lp.project) {
        throw new Error("Parse error");
      }
      const loadedProject = {
        ...lp.project,
        models: lp.project.models.map((model) => {
          if (model.type === "Pipe Rack") {
            return fixPipeRack(model as PipeRack);
          } else if (model.type === "Open Frame") {
            return fixOpenFrame(model as TOpenFrame);
          }
        }),
        settings: { ...initSettings },
      } as Project;
      handleChangeNotEditableProjects([...neProjects, loadedProject]);
    } catch (e) {
      dispatch(addEventAction(`Open project: ${(e as any).message}`, "danger"));
    }
  }

  function handleOpenProject() {
    setDialog(
      <OpenModelDlg
        mode={mode}
        onClose={handleCloseOpenModelDlg}
        extensions={[".pps", ".pds", ".ods", ".fd", ".fdd", ".psm", ".ddd"]}
      />
    );
  }

  function handleCloseProjects() {
    setDialog(
      <CloseNEProjectsDlg
        project={project}
        projects={neProjects}
        processes={neProcesses}
        onClose={() => setDialog(undefined)}
        onSave={(projects, locked) => {
          dispatch(
            changeNotEditableProjects(
              neProjects
                .filter(
                  (p) => locked.includes(p.name) || !projects.includes(p.name)
                )
                .map((p) => ({ ...p, locked: locked.includes(p.name) }))
            )
          );
          dispatch(
            changeNotEditableProcesses(
              neProcesses
                .filter(
                  (p) => locked.includes(p.name) || !projects.includes(p.name)
                )
                .map((p) => ({ ...p, locked: locked.includes(p.name) }))
            )
          );
          setDialog(undefined);
        }}
      />
    );
  }

  /*function importFromProcess() {
    if (!project) return;
    setDialog(
      <OpenModelDlg
        mode="DESIGNER"
        title={"Open Process"}
        onClose={(file) => {
          if (!file) {
            setDialog(undefined);
            return;
          }
          const extention = checkFileType(file.name);
          if ("dddpsm" === extention) {
            file.text().then((text) => {
              const json = JSON.parse(text);
              const state = JSON.parse(json?.state ?? "{}");
              const process: TProcess = fixImportedProcess(state);
              console.log();
              
              updatePipes(dispatch, project, process);
              updateCables(dispatch, project, process);
              setDialog(undefined);
            });
          } else setDialog(undefined);
        }}
        extensions={["dddpsm"]}
      />
    );
  }*/
  /*function importFromProcess() {
    if (!project) {
      console.log("No project found");
      return;
    }
  
    setDialog(
      <OpenModelDlg
        mode="DESIGNER"
        title={"Open Process"}
        onClose={(file) => {
          if (!file) {
            console.log("File selection cancelled");
            setDialog(undefined);
            return;
          }
  
          console.log("Selected file:", file);
  
          const extension = checkFileType(file.name);
          console.log("File extension:", extension);
  
          if ("dddpsm" === extension) {
            file.text().then((text) => {
              console.log("File content:", text);
  
              let json;
              try {
                json = JSON.parse(text);
              } catch (error) {
                console.error("Error parsing file text as JSON:", error);
                setDialog(undefined);
                return;
              }
  
              console.log("Parsed JSON:", json);
  
              let state;
              try {
                state = JSON.parse(json?.state ?? "{}");
              } catch (error) {
                console.error("Error parsing 'state' from JSON:", error);
                setDialog(undefined);
                return;
              }
  
              console.log("Parsed state:", state);
  
              let process: TProcess;
              try {
                process = fixImportedProcess(state);
              } catch (error) {
                console.error("Error in fixImportedProcess:", error);
                setDialog(undefined);
                return;
              }
  
              console.log("Processed process:", process);
  
              try {
                updatePipes(dispatch, project, process);
                // updateCables(dispatch, project, process);
                console.log("updatePipes executed successfully");
              } catch (error) {
                console.error("Error in updatePipes:", error);
              }
  
              setDialog(undefined);
            });
          } else {
            console.log("Unsupported file extension");
            setDialog(undefined);
          }
        }}
        extensions={["dddpsm"]}
      />
    );
  }*/
  function importFromProcess() {
    if (!project) {
      console.log("No project found");
      return;
    }

    setDialog(
      <OpenModelDlg
        mode="DESIGNER"
        title={"Open Process"}
        onClose={(file) => {
          if (!file) {
            console.log("File selection cancelled");
            setDialog(undefined);
            return;
          }

          console.log("Selected file:", file);

          const extension = checkFileType(file.name);
          console.log("File extension:", extension);

          if ("dddpsm" === extension) {
            file.text().then((text) => {
              console.log("File content:", text);

              let json;
              try {
                json = JSON.parse(text);
                console.log("Parsed JSON:", json);
              } catch (error) {
                console.error("Error parsing file text as JSON:", error);
                setDialog(undefined);
                return;
              }

              let state;
              try {
                state = JSON.parse(json?.state ?? "{}");
                console.log("Parsed state:", state);
              } catch (error) {
                console.error("Error parsing 'state' from JSON:", error);
                setDialog(undefined);
                return;
              }

              const process: TProcess = fixImportedProcess(state);

              const newImport: TProcessImport = {
                id: getNextId(project.importedProcess),
                fileName: file.name,
                equipments: json.equipments,
                lines: json.lines,
                date: json.date || new Date().toLocaleDateString(),
                revision: json.revision,
                state: JSON.stringify(state),
                imported: true,
              };

              console.log("New import object:", newImport);

              const updatedImports = [
                ...(project.importedProcess ?? []),
                newImport,
              ];
              console.log("Updated imports array:", updatedImports);

              updatePipes(dispatch, project, process);
              console.log(
                "Dispatching changeImportedToProcessAction with:",
                updatedImports
              );
              dispatch(
                changeImportedToProcessAction(project.name, updatedImports)
              );

              setDialog(undefined);
            });
          } else {
            console.log("Unsupported file extension");
            setDialog(undefined);
          }
        }}
        extensions={["dddpsm"]}
      />
    );
  }
  

  function importFromPiping() {
    setDialog(<PipingToProcess onClose={() => setDialog(undefined)} />);
  }

  function exporttoPipingDesigner() {
    setDialog(<ProcessToPiping onClose={() => setDialog(undefined)} />);
  }

  function importfromProcessDesigner() {
    setDialog(
      <ProcessDesignerToPipingDesigner onClose={() => setDialog(undefined)} />
    );
  }

  function handleExportToPSMM() {
    if (!project || !process) return;
    const data = {
      ...convertProcessToImporting(project.name, process),
      availableData: ui?.availableData,
    };
    saveToFile(data, "process", "psmm");
  }

  function handleExportToPPSM() {
    if (!project) return;
    const data = {
      items: project.freePipes ?? [],
      UDEs: userDefinedElbows,
      availableData: ui?.availableData,
    };
    saveToFile(data, "pipes", "ppsm");
  }

  function handleExportToDDDPPS() {
    if (!project) return;
    const data = {
      items: project.freePipes ?? [],
      UDEs: userDefinedElbows,
      availableData: ui?.availableData,
    };
    saveToFile(data, "pipes", "ppsm");
  }

  function handleExportToFDSM() {
    if (!project) return;
    const data = {
      items: project.flares ?? [],
      availableData: ui?.availableData,
    };
    saveToFile(data, "flares", "fdsm");
  }

  function handleExportToPDSM() {
    if (!project) return;
    const data = {
      items: project.models.filter((m) => m.type === "Pipe Rack"),
      fabricatedSections,
      rolledSections,
      combinedSections,
      availableData: ui?.availableData,
    };
    saveToFile(data, "pipe racks", "pdsm");
  }

  function handleExportToODSM(type: ModelType) {
    if (!project || !ui?.openFrameUI) return;
    const data = {
      type,
      items: project.models.filter(
        (m) => m.type === type || m.type === "ROAD" 
      ),
      ui: ui.openFrameUI,
      fabricatedSections,
      rolledSections,
      combinedSections,
      availableData: ui?.availableData,
    };
    saveToFile(data, "open frames", "odsm");
  }

  function handleExportToDDDSTR(type: ModelType) {
    if (!project || !ui?.openFrameUI) return;
    const data = {
      type,
      items: project.models.filter((m) => m.type === type),
      ui: ui.openFrameUI,
      fabricatedSections,
      rolledSections,
      combinedSections,
      availableData: ui?.availableData,
    };
    saveToFile(data, project.name, "dddstr");
  }

  function handleImportPSMM() {
    if (!project || !process) return;
    setDialog(
      <OpenModelDlg
        mode="DESIGNER"
        title={"Open PSMM"}
        onClose={(file) => {
          if (!file) {
            setDialog(undefined);
            return;
          }
          const extention = checkFileType(file.name);
          if ("psmm" === extention) {
            file.text().then((text) => {
              const json = JSON.parse(text);
              handleCombineAvailableData(dispatch, ui, json.availableData);
              const imported: TProcess = fixImportedProcess(json);
              const changed: TProcess = { ...process };
              const namesMap = new Map<string, string>();
              for (const [key, value] of Array.from(
                imported.elements.entries()
              )) {
                if (changed.elements.has(key)) {
                  const newName = `${value.type}${getIndexName(
                    Array.from(changed.elements.values()),
                    value.type
                  )}`;
                  namesMap.set(key, newName);
                  changed.elements.set(newName, {
                    ...value,
                    points: value.points.map((p) => ({
                      ...p,
                      element: p.element
                        ? namesMap.get(p.element) ?? p.element
                        : undefined,
                    })),
                  });
                } else changed.elements.set(key, value);
              }
              if (!changed.lines) changed.lines = [];
              for (const line of imported.lines ?? []) {
                const id = getNextId(changed.lines);
                const changedLine: TProcessLine = {
                  ...line,
                  id,
                  from: line.from
                    ? namesMap.get(line.from) ?? line.from
                    : line.from,
                  to: line.to ? namesMap.get(line.to) ?? line.to : line.to,
                  processLineNo: id,
                  segments: line.segments.map((s) => ({
                    ...s,
                    instrumentationIDs: undefined,
                  })),
                };
                changed.lines.push(changedLine);
              }
              dispatch(setProcessAction(project.name, changed));
              setDialog(undefined);
            });
          } else setDialog(undefined);
        }}
        extensions={[".psmm"]}
      />
    );
  }

  /*function handleImportPPSM() {
    if (!project) return;
    setDialog(
      <OpenModelDlg
        mode="DESIGNER"
        title={"Import PPSM"}
        onClose={(file) => {
          if (!file) {
            setDialog(undefined);
            return;
          }
          const extention = checkFileType(file.name);
          if ("ppsm" === extention || "dddpps" === extention) {
            file.text().then((text) => {
              const json = JSON.parse(text);
              handleCombineAvailableData(dispatch, ui, json.availableData);
              const newUserDefinedElbows =
                concatUnique<TPipingElbow>(
                  userDefinedElbows,
                  json.userDefinedElbows,
                  (a, b) =>
                    a.nps === b.nps &&
                    a.schedule === b.schedule &&
                    a.material === b.material &&
                    a.d === b.d &&
                    a.t === b.t &&
                    a.a === b.a &&
                    a.degree === b.degree
                ) ?? [];
              dispatch(changeUserDefinedElbows(newUserDefinedElbows));
              const namesMap = new Map<string, string>();
              const precMap = new Map<string, string>();
              let pipes = project.freePipes ?? [];
              const newPipes: FreePipe[] = [];
              for (const item of fixPipes(json.items as FreePipe[])) {
                if (pipes.some((p) => p.pipe === item.pipe)) {
                  const newName = `PP${getIndexName(pipes, "PP", "pipe")}`;
                  console.log("newName",newName);
                  
                  const preceeding = `PP${getPName(pipes, "PP", "preceding")}`
                  console.log("preceeding",preceeding);
                  
                  namesMap.set(item.pipe, newName);
                  const changed: FreePipe = {
                    ...item,
                    id: getNextId(pipes),
                    pipe: newName,
                    preceding: preceeding
                  };
                  
                  pipes.push(changed);
                  newPipes.push(changed);
                } else {
                  /*pipes.push(item);*//*
                  newPipes.push(item);
                }
              }*/
              
              /*newPipes = newPipes.map((p) => ({
                ...p,
                preceding: namesMap.get(p.preceding) ?? p.preceding,
                
              }));*//*
              console.log(newPipes);
              pipes = [...new Set([...pipes, ...newPipes])];
              console.log("pipes", pipes);
              
            dispatch(changeProjectAction({ ...project, freePipes: pipes }));
            setDialog(undefined);
          });
        }
        }}
        extensions={[".ppsm",".dddpps"]}
      />
    );
}*/

function handleImportPPSM(): void {
  if (!project) return;
  setDialog(
    <OpenModelDlg
      mode="DESIGNER"
      title={"Import PPSM"}
      onClose={(file) => {
        if (!file) {
          setDialog(undefined);
          return;
        }
        const extension = checkFileType(file.name);
        if ("ppsm" === extension || "dddpps"=== extension) {
          file.text().then((text) => {
            const json = JSON.parse(text);
            handleCombineAvailableData(dispatch, ui, json.availableData);
            const newUserDefinedElbows =
              concatUnique<TPipingElbow>(
                userDefinedElbows,
                json.userDefinedElbows,
                (a, b) =>
                  a.nps === b.nps &&
                  a.schedule === b.schedule &&
                  a.material === b.material &&
                  a.d === b.d &&
                  a.t === b.t &&
                  a.a === b.a &&
                  a.degree === b.degree
              ) ?? [];
            dispatch(changeUserDefinedElbows(newUserDefinedElbows));
            
            let pipes = project.freePipes ?? [];
            const newPipes: FreePipe[] = [];
            const namesMap = new Map<string, string>();

            for (const item of fixPipes(json.items as FreePipe[])) {
              if (pipes.some((p) => p.pipe === item.pipe)) {
                const newName = `PP${getIndexName(pipes, "PP", "pipe")}`;
                namesMap.set(item.pipe, newName);

                const changed: FreePipe = {
                  ...item,
                  id: getNextId(pipes),
                  pipe: newName,
                  preceding: item.preceding 
                };
                
                pipes.push(changed);
                newPipes.push(changed);
              } else {
                newPipes.push(item);
              }
            }
            for (const pipe of newPipes) {
              const newPrecedingName = namesMap.get(pipe.preceding);
              if (newPrecedingName) {
                pipe.preceding = newPrecedingName;
              }
            }
            pipes = [...new Set([...pipes, ...newPipes])];
            namesMap.forEach((value, key) => {
              console.log(`${key} -> ${value}`);
            });

            dispatch(changeProjectAction({ ...project, freePipes: pipes }));
            setDialog(undefined);
          });
        }
      }}
      extensions={[".ppsm",".dddpps"]}
    />
  );
}



  
  
  

  function handleImportFDSM() {
    if (!project) return;
    setDialog(
      <OpenModelDlg
        mode="DESIGNER"
        title={"Import FDSM"}
        onClose={(file) => {
          if (!file) {
            setDialog(undefined);
            return;
          }
          const extention = checkFileType(file.name);
          if ("fdsm" === extention) {
            file.text().then((text) => {
              const json = JSON.parse(text);
              handleCombineAvailableData(dispatch, ui, json.availableData);
              const flares = project.flares ?? [];
              for (const item of fixFlares(
                json.items as TFlare[],
                project.name
              )) {
                if (flares.some((f) => f.name === item.name)) {
                  const newName = `FLARE${getIndexName(flares, "FLARE")}`;
                  const changed: TFlare = {
                    ...item,
                    id: getNextId(flares),
                    name: newName,
                  };
                  flares.push(changed);
                } else flares.push(item);
              }
              dispatch(
                changeProjectAction({ ...project, flares, modelType: "Flare" })
              );
              setDialog(undefined);
            });
          } else setDialog(undefined);
        }}
        extensions={[".fdsm"]}
      />
    );
  }

  function handleImportPDSM() {
    if (!project) return;
    setDialog(
      <OpenModelDlg
        mode="DESIGNER"
        title={"Import PDSM"}
        onClose={(file) => {
          if (!file) {
            setDialog(undefined);
            return;
          }
          const extention = checkFileType(file.name);
          if ("pdsm" === extention) {
            file.text().then((text) => {
              const json = JSON.parse(text);
              handleCombineAvailableData(dispatch, ui, json.availableData);
              const {
                newCombinedSections,
                newFabricatedSections,
                newRolledSections,
              } = getAllProfilesFromXCH(json);
              const models = project.models ?? [];
              for (const item of json.items) {
                const fixed = fixPipeRack(item);
                if (models.some((m) => m.name === fixed.name)) {
                  const newName = `PR${getIndexName(models, "PR")}`;
                  const changed: PipeRack = {
                    ...item,
                    name: newName,
                    project: project.name,
                  };
                  models.push(changed);
                } else models.push({ ...fixed, project: project.name });
              }
              dispatch(changeFabracatedSections(newFabricatedSections));
              dispatch(changeRolledSections(newRolledSections));
              dispatch(changeCombinedSections(newCombinedSections));
              dispatch(
                changeProjectAction({
                  ...project,
                  models,
                  modelType: "Pipe Rack",
                })
              );
              setDialog(undefined);
            });
          } else setDialog(undefined);
        }}
        extensions={[".pdsm"]}
      />
    );
  }

  function handleImportODSM() {
    if (!project || !ui) return;
    setDialog(
      <OpenModelDlg
        mode="DESIGNER"
        title={"Import Structural Component"}
        onClose={(file) => {
          if (!file) {
            setDialog(undefined);
            return;
          }
          const extention = checkFileType(file.name);
          if ("dddstr" === extention || "odsm" === extention) {
            file.text().then((text) => {
              const json = JSON.parse(text);
              handleCombineAvailableData(dispatch, ui, json.availableData);
              const {
                newCombinedSections,
                newFabricatedSections,
                newRolledSections,
              } = getAllProfilesFromXCH(json);
              let models = project.models ?? [];
              let ofUI: OpenFrameUI = { ...ui.openFrameUI };
              let newOFUI: OpenFrameUI = json.ui && { ...json.ui };
              const type: ModelType = json.type;
              for (const item of json.items) {
                const fixed = fixOpenFrame(item);
                if (models.some((m) => m.name === fixed.name)) {
                  const generalName = type === "Factory Shed" ? "FS" : "OF";
                  const newName = `${generalName}${getIndexName(
                    models,
                    generalName
                  )}`;
                  const changeModel = (arr: any[]) => {
                    return arr
                      ? arr.map((el) => ({ ...el, model: newName }))
                      : [];
                  };
                  const changed: TOpenFrame = {
                    ...fixed,
                    name: newName,
                    project: project.name,
                  };
                  newOFUI = newOFUI && {
                    ...newOFUI,
                    accessories: changeModel(newOFUI.accessories),
                    additionalBeams: {
                      ...newOFUI.additionalBeams,
                      beamToBeam: changeModel(
                        newOFUI.additionalBeams.beamToBeam
                      ),
                      cantilever: changeModel(
                        newOFUI.additionalBeams.cantilever
                      ),
                      columnToBeam: changeModel(
                        newOFUI.additionalBeams.columnToBeam
                      ),
                      columnToColumn: changeModel(
                        newOFUI.additionalBeams.columnToColumn
                      ),
                      columns: changeModel(newOFUI.additionalBeams.columns),
                      kneeBracings: changeModel(
                        newOFUI.additionalBeams.kneeBracings
                      ),
                      planBracings: changeModel(
                        newOFUI.additionalBeams.planBracings
                      ),
                      staircases: changeModel(
                        newOFUI.additionalBeams.staircases
                      ),
                      verticalBracings: changeModel(
                        newOFUI.additionalBeams.verticalBracings
                      ),
                    },
                    basePlates: {
                      ...newOFUI.basePlates,
                      circular: changeModel(newOFUI.basePlates.circular),
                      rectangular: changeModel(newOFUI.basePlates.rectangular),
                    },
                    spliceFlanges: {
                      circular: changeModel(newOFUI.spliceFlanges.circular),
                      rectangular: changeModel(
                        newOFUI.spliceFlanges.rectangular
                      ),
                    },
                    platforms: changeModel(newOFUI.platforms),
                    pipes: {
                      ...newOFUI.pipes,
                      items: changeModel(newOFUI.pipes.items),
                      supports: changeModel(newOFUI.pipes.supports),
                    },
                    ladders: {
                      ...newOFUI.ladders,
                      ladders: changeModel(newOFUI.ladders.ladders),
                    },
                    members: {
                      beams: changeModel(newOFUI.members.beams),
                      columns: changeModel(newOFUI.members.columns),
                      releases: changeModel(newOFUI.members.releases),
                    },
                    frames: {
                      ...newOFUI.frames,
                      parameters: changeModel(newOFUI.frames.parameters),
                      relocations: changeModel(newOFUI.frames.relocations),
                    },
                    masonryCladdings: changeModel(newOFUI.masonryCladdings),
                    metalCladdings: changeModel(newOFUI.metalCladdings),
                    runners: changeModel(newOFUI.runners),
                    truss: changeModel(newOFUI.truss),
                    loadingsUI: {
                      ...initialStateProjectUI.openFrameUI.loadingsUI,
                    },
                  };
                  models.push(changed);
                } else models.push({ ...fixed, project: project.name });
              }
              const getNextIds = (oldArr: any[], newArr: any[]) => {
                let arr = [...oldArr];
                for (const el of newArr) {
                  arr = [...arr, { ...el, id: getNextId(arr) }];
                }
                return arr;
              };
              if (newOFUI) {
                // if (newOFUI.accessories) {
                // }
                if (newOFUI.additionalBeams) {
                  if (newOFUI.additionalBeams.columns) {
                    ofUI = {
                      ...ofUI,
                      additionalBeams: {
                        ...ofUI.additionalBeams,
                        columns: newOFUI.additionalBeams.columns.reduce(
                          (acc, item) => {
                            const changed = { ...item, id: getNextId(acc) };
                            let model = models.find(
                              (model) => model.name === item.model
                            );
                            if (model) {
                              model = {
                                ...model,
                                columns: (model as TOpenFrame).columns.map(
                                  (c) => {
                                    return c.uiId === item.id
                                      ? { ...c, uiId: changed.id }
                                      : c;
                                  }
                                ),
                              } as TOpenFrame;
                              models = models.map((m) =>
                                m.name === model!.name ? (model as Model) : m
                              );
                            }
                            return [...acc, changed];
                          },
                          ofUI.additionalBeams.columns
                        ),
                      },
                    };
                  }
                  if (newOFUI.additionalBeams.beamToBeam) {
                    ofUI = {
                      ...ofUI,
                      additionalBeams: {
                        ...ofUI.additionalBeams,
                        beamToBeam: newOFUI.additionalBeams.beamToBeam.reduce(
                          (acc, item) => {
                            const changed = { ...item, id: getNextId(acc) };
                            let model = models.find(
                              (model) => model.name === item.model
                            );
                            if (model) {
                              model = {
                                ...model,
                                beams: (model as TOpenFrame).beams.map((b) => {
                                  return b.uiId === item.id
                                    ? { ...b, uiId: changed.id }
                                    : b;
                                }),
                              } as TOpenFrame;
                              models = models.map((m) =>
                                m.name === model!.name ? (model as Model) : m
                              );
                            }
                            return [...acc, changed];
                          },
                          ofUI.additionalBeams.beamToBeam
                        ),
                      },
                    };
                  }
                  if (newOFUI.additionalBeams.cantilever) {
                    ofUI = {
                      ...ofUI,
                      additionalBeams: {
                        ...ofUI.additionalBeams,
                        cantilever: newOFUI.additionalBeams.cantilever.reduce(
                          (acc, item) => {
                            const changed = { ...item, id: getNextId(acc) };
                            let model = models.find(
                              (model) => model.name === item.model
                            );
                            if (model) {
                              model = {
                                ...model,
                                cantilevers: (model as TOpenFrame).cantilevers.map(
                                  (b) => {
                                    return b.uiId === item.id
                                      ? { ...b, uiId: changed.id }
                                      : b;
                                  }
                                ),
                              } as TOpenFrame;
                              models = models.map((m) =>
                                m.name === model!.name ? (model as Model) : m
                              );
                            }
                            return [...acc, changed];
                          },
                          ofUI.additionalBeams.cantilever
                        ),
                      },
                    };
                  }
                  if (newOFUI.additionalBeams.columnToBeam) {
                    ofUI = {
                      ...ofUI,
                      additionalBeams: {
                        ...ofUI.additionalBeams,
                        columnToBeam: newOFUI.additionalBeams.columnToBeam.reduce(
                          (acc, item) => {
                            const changed = { ...item, id: getNextId(acc) };
                            let model = models.find(
                              (model) => model.name === item.model
                            );
                            if (model) {
                              model = {
                                ...model,
                                beams: (model as TOpenFrame).beams.map((b) => {
                                  return b.uiId === item.id
                                    ? { ...b, uiId: changed.id }
                                    : b;
                                }),
                              } as TOpenFrame;
                              models = models.map((m) =>
                                m.name === model!.name ? (model as Model) : m
                              );
                            }
                            return [...acc, changed];
                          },
                          ofUI.additionalBeams.columnToBeam
                        ),
                      },
                    };
                  }
                  if (newOFUI.additionalBeams.columnToColumn) {
                    ofUI = {
                      ...ofUI,
                      additionalBeams: {
                        ...ofUI.additionalBeams,
                        columnToColumn: newOFUI.additionalBeams.columnToColumn.reduce(
                          (acc, item) => {
                            const changed = { ...item, id: getNextId(acc) };
                            let model = models.find(
                              (model) => model.name === item.model
                            );
                            if (model) {
                              model = {
                                ...model,
                                beams: (model as TOpenFrame).beams.map((b) => {
                                  return b.uiId === item.id
                                    ? { ...b, uiId: changed.id }
                                    : b;
                                }),
                              } as TOpenFrame;
                              models = models.map((m) =>
                                m.name === model!.name ? (model as Model) : m
                              );
                            }
                            return [...acc, changed];
                          },
                          ofUI.additionalBeams.columnToColumn
                        ),
                      },
                    };
                  }
                  if (newOFUI.additionalBeams.kneeBracings) {
                    ofUI = {
                      ...ofUI,
                      additionalBeams: {
                        ...ofUI.additionalBeams,
                        kneeBracings: newOFUI.additionalBeams.kneeBracings.reduce(
                          (acc, item) => {
                            const changed = { ...item, id: getNextId(acc) };
                            let model = models.find(
                              (model) => model.name === item.model
                            );
                            if (model) {
                              model = {
                                ...model,
                                kneeBracings: (model as TOpenFrame).kneeBracings.map(
                                  (b) => {
                                    return b.uiId === item.id
                                      ? { ...b, uiId: changed.id }
                                      : b;
                                  }
                                ),
                              } as TOpenFrame;
                              models = models.map((m) =>
                                m.name === model!.name ? (model as Model) : m
                              );
                            }
                            return [...acc, changed];
                          },
                          ofUI.additionalBeams.kneeBracings
                        ),
                      },
                    };
                  }
                  if (newOFUI.additionalBeams.planBracings) {
                    ofUI = {
                      ...ofUI,
                      additionalBeams: {
                        ...ofUI.additionalBeams,
                        planBracings: newOFUI.additionalBeams.planBracings.reduce(
                          (acc, item) => {
                            const changed = { ...item, id: getNextId(acc) };
                            let model = models.find(
                              (model) => model.name === item.model
                            );
                            if (model) {
                              model = {
                                ...model,
                                horizontalBracings: (model as TOpenFrame).horizontalBracings.map(
                                  (b) => {
                                    return b.uiId === item.id
                                      ? { ...b, uiId: changed.id }
                                      : b;
                                  }
                                ),
                              } as TOpenFrame;
                              models = models.map((m) =>
                                m.name === model!.name ? (model as Model) : m
                              );
                            }
                            return [...acc, changed];
                          },
                          ofUI.additionalBeams.planBracings
                        ),
                      },
                    };
                  }
                  if (newOFUI.additionalBeams.staircases) {
                    ofUI = {
                      ...ofUI,
                      additionalBeams: {
                        ...ofUI.additionalBeams,
                        staircases: newOFUI.additionalBeams.staircases.reduce(
                          (acc, item) => {
                            const changed = { ...item, id: getNextId(acc) };
                            let model = models.find(
                              (model) => model.name === item.model
                            );
                            if (model) {
                              model = {
                                ...model,
                                staircases: (model as TOpenFrame).staircases.map(
                                  (b) => {
                                    return b.uiId === item.id
                                      ? { ...b, uiId: changed.id }
                                      : b;
                                  }
                                ),
                              } as TOpenFrame;
                              models = models.map((m) =>
                                m.name === model!.name ? (model as Model) : m
                              );
                            }
                            return [...acc, changed];
                          },
                          ofUI.additionalBeams.staircases
                        ),
                      },
                    };
                  }
                  if (newOFUI.additionalBeams.verticalBracings) {
                    ofUI = {
                      ...ofUI,
                      additionalBeams: {
                        ...ofUI.additionalBeams,
                        verticalBracings: newOFUI.additionalBeams.verticalBracings.reduce(
                          (acc, item) => {
                            const changed = { ...item, id: getNextId(acc) };
                            let model = models.find(
                              (model) => model.name === item.model
                            );
                            if (model) {
                              model = {
                                ...model,
                                verticalBracings: (model as TOpenFrame).verticalBracings.map(
                                  (b) => {
                                    return b.uiId === item.id
                                      ? { ...b, uiId: changed.id }
                                      : b;
                                  }
                                ),
                              } as TOpenFrame;
                              models = models.map((m) =>
                                m.name === model!.name ? (model as Model) : m
                              );
                            }
                            return [...acc, changed];
                          },
                          ofUI.additionalBeams.verticalBracings
                        ),
                      },
                    };
                  }
                }
                if (newOFUI.basePlates) {
                  if (newOFUI.basePlates.circular) {
                    ofUI = {
                      ...ofUI,
                      basePlates: {
                        ...ofUI.basePlates,
                        circular: getNextIds(
                          ofUI.basePlates.circular,
                          newOFUI.basePlates.circular
                        ),
                      },
                    };
                  }
                  if (newOFUI.basePlates.rectangular) {
                    ofUI = {
                      ...ofUI,
                      basePlates: {
                        ...ofUI.basePlates,
                        rectangular: getNextIds(
                          ofUI.basePlates.rectangular,
                          newOFUI.basePlates.rectangular
                        ),
                      },
                    };
                  }
                }
                // if (newOFUI.elementsElevations) {
                //   if (newOFUI.elementsElevations.elements) {
                //   }
                // }
                if (newOFUI.frames) {
                  if (newOFUI.frames.parameters) {
                    ofUI = {
                      ...ofUI,
                      frames: {
                        ...ofUI.frames,
                        parameters: getNextIds(
                          ofUI.frames.parameters,
                          newOFUI.frames.parameters
                        ),
                      },
                    };
                  }
                  if (newOFUI.frames.relocations) {
                    ofUI = {
                      ...ofUI,
                      frames: {
                        ...ofUI.frames,
                        relocations: getNextIds(
                          ofUI.frames.relocations,
                          newOFUI.frames.relocations
                        ),
                      },
                    };
                  }
                }
                // if (newOFUI.members) {
                //   if (newOFUI.members.beams) {
                //   }
                //   if (newOFUI.members.columns) {
                //   }
                //   if (newOFUI.members.releases) {
                //   }
                // }
                if (newOFUI.masonryCladdings) {
                  ofUI = {
                    ...ofUI,
                    masonryCladdings: getNextIds(
                      ofUI.masonryCladdings,
                      newOFUI.masonryCladdings
                    ),
                  };
                }
                if (newOFUI.metalCladdings) {
                  ofUI = {
                    ...ofUI,
                    metalCladdings: getNextIds(
                      ofUI.metalCladdings,
                      newOFUI.metalCladdings
                    ),
                  };
                }
                if (newOFUI.platforms) {
                  ofUI = {
                    ...ofUI,
                    platforms: getNextIds(ofUI.platforms, newOFUI.platforms),
                  };
                }
                if (newOFUI.runners) {
                  ofUI = {
                    ...ofUI,
                    runners: getNextIds(ofUI.runners, newOFUI.runners),
                  };
                }
                if (newOFUI.truss) {
                  ofUI = {
                    ...ofUI,
                    truss: getNextIds(ofUI.truss, newOFUI.truss),
                  };
                }
                if (newOFUI.spliceFlanges) {
                  if (newOFUI.spliceFlanges.circular) {
                    ofUI = {
                      ...ofUI,
                      spliceFlanges: {
                        ...ofUI.spliceFlanges,
                        circular: getNextIds(
                          ofUI.spliceFlanges.circular,
                          newOFUI.spliceFlanges.circular
                        ),
                      },
                    };
                  }
                  if (newOFUI.spliceFlanges.rectangular) {
                    ofUI = {
                      ...ofUI,
                      spliceFlanges: {
                        ...ofUI.spliceFlanges,
                        rectangular: getNextIds(
                          ofUI.spliceFlanges.rectangular,
                          newOFUI.spliceFlanges.rectangular
                        ),
                      },
                    };
                  }
                }
              }
              dispatch(changeFabracatedSections(newFabricatedSections));
              dispatch(changeRolledSections(newRolledSections));
              dispatch(changeCombinedSections(newCombinedSections));
              dispatch(
                changeProjectAction({
                  ...project,
                  models,
                  modelType: project.modelType || type,
                })
              );
              dispatch(changeOFUIAction(ofUI));
              setDialog(undefined);
            });
          } else setDialog(undefined);
        }}
        extensions={[".odsm", ".dddstr"]}
      />
    );
  }

  function handleCII() {
    if (!project) return;
    setDialog(
      <AnalysisResultsDlg
        onSelect={(key, model, LC) => {
          getCII(dispatch, project.name, key, model, LC);
          setDialog(undefined);
        }}
        onClose={() => setDialog(undefined)}
      />
    );
  }

  function handleStaad() {
    if (!project) return;
    setDialog(<StaadDlg onClose={() => setDialog(undefined)} />);
  }

  function handleOpenISO() {
    setDialog(<ISODlg onClose={() => setDialog(undefined)} />);
  }

  function handleexportDDDPSM() {
    if (!project || !process) return;
    const data = {
      ...convertProcessToImporting(project.name, process),
      availableData: ui?.availableData,
    };

    saveToFile(data, project.name, "dddpsm");
  }
  function exportDDDPPS() {
    if (!project) return;
    const data = {
      items: project.freePipes ?? [],
      UDEs: userDefinedElbows,
      availableData: ui?.availableData,
    };
    saveToFile(data, project.name, "dddpps");
  }
  function exportDDDSTR() {
    if (!project || !ui?.openFrameUI) return;
    const data = {
      items: project.models ?? [],
      ui: ui.openFrameUI,
      fabricatedSections,
      rolledSections,
      combinedSections,
      availableData: ui?.availableData,
    };
    saveToFile(data, project.name, "dddstr");
  }

  return (
    <>
      {dialog}
      <div className="d-flex">
        {/*<MenuButton text="Drawings" icon={faPen} disabled={true} />
        <MenuButton text="Download SVG" icon={faSave} disabled={true} />
  <MenuButton text="Download DXF" icon={faSave} disabled={true} />*/}
        <Popover
          interactionKind={"click"}
          content={
            <div id="export-nav-subgroup" className={"menu-bar-subgroup"}>
              {/*mode !== "PIPDESIGNER" && mode !== "PRODESIGNER" && mode !== "STRDESIGNER" && mode !== "DESIGNER" && mode !=="PROCESS" ? (
                <MenuButton text={"To Tekla"} />
              ): null*/}

              {mode !== "PROCESS" ? (
                <Popover
                  interactionKind={"click"}
                  position={"bottom"}
                  content={
                    <div className="menu-bar-subgroup">
                      <MenuButton
                        text={"Pipes"}
                        onClick={() => exportPipesToXCH(project)}
                      />
                      <MenuButton
                        text={"Pipe Racks"}
                        onClick={() => exportPipeRacksToXCH(project)}
                      />
                      <MenuButton
                        text={"Open Frames"}
                        onClick={() => exportOpenFramesToXCH(project)}
                      />
                    </div>
                  }
                  target={<MenuButton text={"To Aveva"} />}
                />
              ) : null}

              {mode === "PRODESIGNER" ? (
                <MenuButton
                  id="to-piping-designer"
                  text="To Piping Designer"
                  onClick={() => {
                    exporttoPipingDesigner();
                  }}
                />
              ) : null}

              {mode === "PIPDESIGNER" ? (
                <MenuButton
                  text="To DDDPPS"
                  onClick={() => {
                    exportDDDPPS();
                  }}
                />
              ) : null}

              {mode === "STRDESIGNER" ? (
                <MenuButton
                  text="To DDDSTR"
                  onClick={() => {
                    exportDDDSTR();
                  }}
                />
              ) : null}

              {mode === "PROCESS" || mode === "DESIGNER" ? (
                <MenuButton
                  text={"To PFD"}
                  onClick={() => {
                    setDialog(<PFDView onClose={() => setDialog(undefined)} />);
                  }}
                />
              ) : null}
              {mode === "PIPING" ||
              mode === "PROCESS" ||
              mode === "DESIGNER" ? (
                <MenuButton
                  text={"To P&ID"}
                  onClick={() => {
                    setDialog(
                      <PaIDView onClose={() => setDialog(undefined)} />
                    );
                  }}
                />
              ) : null}
              {mode === "PIPING" ? (
                <MenuButton
                  text={"To Isometric View"}
                  disabled={mode !== "PIPING"}
                  onClick={() => {
                    setDialog(
                      <IsometricView onClose={() => setDialog(undefined)} />
                    );
                  }}
                />
              ) : null}
              <MenuButton
                text={"To IDSV"}
                onClick={() => {
                  project && exportToGLTF(scene, project.name);
                }}
              />
              {/* <MenuButton
                text={"To PLY"}
                onClick={() => {
                  project && exportToPLY(scene, project.name);
                }}
              />
              <MenuButton
                text={"To Collada"}
                onClick={() => {
                  project && exportToCollada(scene, project.name);
                }}
              /> */}
              {mode === "DESIGNER" ||
              mode === "PROCESS" ||
              mode === "PRODESIGNER" ||
              mode === "PIPDESIGNER" ? (
                <MenuButton text={"To PSMM"} onClick={handleExportToPSMM} />
              ) : null}
              {mode === "DESIGNER" ||
              mode === "PIPING" ||
              mode === "PRODESIGNER" ||
              mode === "PIPDESIGNER" ? (
                <MenuButton
                  id="to-ppsm-button-nav"
                  text={"To PPSM"}
                  onClick={handleExportToPPSM}
                />
              ) : null}
              {mode === "DESIGNER" || mode === "STRUCTURE" ? (
                <>
                  <MenuButton text={"To FDSM"} onClick={handleExportToFDSM} />
                  <MenuButton text={"To PDSM"} onClick={handleExportToPDSM} />
                  <Popover
                    interactionKind={"click"}
                    position={"bottom"}
                    content={
                      <div className={"menu-bar-subgroup"}>
                        <MenuButton
                          text={"Open Frames"}
                          onClick={() => handleExportToODSM("Open Frame")}
                        />
                        <MenuButton
                          text={"Factory Sheds"}
                          onClick={() => handleExportToODSM("Factory Shed")}
                        />
                      </div>
                    }
                    target={<MenuButton text={"To ODSM"} />}
                  />
                </>
              ) : null}
              {["DESIGNER", "PIPING", "STRUCTURE"].includes(mode) ? (
                <Tooltip content="Export Caeser File">
                  <MenuButton
                    text={"To CII"}
                    onClick={handleCII}
                    loading={ui?.requests?.CII}
                  />
                </Tooltip>
              ) : null}
              {["STRUCTURE", "STRDESIGNER"].includes(mode) ? (
                <>
                  <MenuButton
                    text={"To Staad"}
                    onClick={handleStaad}
                    loading={ui?.requests?.Staad}
                  />
                </>
              ) : null}
            </div>
          }
          target={
            <MenuButton
              id="export-model"
              text="Export Model"
              icon={faFileExport}
            />
          }
        />
        <Popover
          interactionKind={"click"}
          content={
            <div className="menu-bar-subgroup">
              {mode !== "PROCESS" &&
              mode !== "PRODESIGNER" &&
              mode !== "PIPDESIGNER" ? (
                <Popover
                  interactionKind={"click"}
                  position={"bottom"}
                  content={
                    <div className="menu-bar-subgroup">
                      <MenuButton
                        text={"Pipes"}
                        onClick={() => importFromXCH(project)}
                      />
                      <MenuButton
                        text={"Pipe Racks"}
                        onClick={() => importFromXCH(project)}
                      />
                      <MenuButton
                        text={"Open Frames"}
                        onClick={() => importFromXCH(project)}
                      />
                    </div>
                  }
                  target={<MenuButton text={"From Aveva"} />}
                />
              ) : null}
              {mode === "PIPING" ||
              mode === "PIPDESIGNER" ||
              mode === "DESIGNER" ||
              mode === "PRODESIGNER" ? (
                <>
                  <MenuButton
                    text="From Process Designer"
                    onClick={importFromPiping}
                  />
                </>
              ) : null}
              {mode === "PROCESS" ||
              mode === "DESIGNER" ||
              mode === "PRODESIGNER" ? (
                <>
                  {<MenuButton text="From Piping" onClick={importFromPiping} />}
                  <MenuButton
                    text="From Piping Designer"
                    onClick={handleImportPPSM}
                  />
                  {/*<MenuButton text="From Process Designer" onClick={importfromProcessDesigner} />*/}
                  <MenuButton text={"From PSMM"} onClick={handleImportPSMM} />
                </>
              ) : null}
              {mode === "DESIGNER" ||
              mode === "PIPING" ||
              mode === "PRODESIGNER" ||
              mode === "PIPDESIGNER" ? (
                <>
                  <MenuButton text={"From PPSM"} onClick={handleImportPPSM} />
                  {/*<MenuButton text="From Process Designer" onClick={importFromPiping} />*/}
                </>
              ) : null}
              {mode != "STRDESIGNER" &&
              mode != "PRODESIGNER" &&
              mode !== "PIPDESIGNER" ? (
                <>
                  {/*<MenuButton
                text={"From FDSM"}
                onClick={handleImportFDSM}
                disabled={
                  !project ||
                  (mode !== "DESIGNER" &&
                    project.modelType &&
                    project.modelType !== "Flare")
                }
              />*/}
                  <MenuButton
                    text={"From PDSM"}
                    onClick={handleImportPDSM}
                    disabled={
                      !project ||
                      (mode !== "DESIGNER" &&
                        project.modelType &&
                        project.modelType !== "Pipe Rack")
                    }
                  />
                </>
              ) : null}
              {mode === "DESIGNER" ||
              mode === "STRUCTURE" ||
              mode === "PIPDESIGNER" ||
              mode === "PRODESIGNER" ||
              mode === "STRDESIGNER" ? (
                <>
                  <MenuButton
                    text={"From ODSM"}
                    onClick={handleImportODSM}
                    disabled={
                      !project ||
                      (mode !== "DESIGNER" &&
                        project.modelType &&
                        project.modelType !== "Open Frame")
                    }
                  />
                  <Popover
                    interactionKind={"click"}
                    position={"bottom"}
                    content={
                      <div className="menu-bar-subgroup">
                        <MenuButton
                          text={"ODSS Geometry"}
                          onClick={() =>
                            handleImportStaad(
                              project,
                              resoures.profileSectionData,
                              dispatch
                            )
                          }
                          loading={ui?.requests?.odssConverting}
                        />
                        <MenuButton
                          text={"ODSS Viewer"}
                          // onClick={() => importFromXCH(project)}
                        />
                      </div>
                    }
                    target={<MenuButton text="From Staad" />}
                  />
                  <MenuButton
                    text={"From Structural Designer"}
                    onClick={handleImportODSM}
                    disabled={
                      !project ||
                      (mode !== "DESIGNER" &&
                        project.modelType &&
                        project.modelType !== "Open Frame")
                    }
                  />
                </>
              ) : null}
              {mode === "DESIGNER" ? (
                <MenuButton
                  text={"From Isometric View"}
                  onClick={handleOpenISO}
                />
              ) : null}
            </div>
          }
          target={
            <MenuButton
              id="import-model"
              text="Import Model"
              icon={faFileImport}
            />
          }
        />
        <Popover
          interactionKind={"click"}
          content={
            <div className="menu-bar-subgroup">
              <MenuButton text="Open" onClick={handleOpenProject} />
              <MenuButton text="Close" onClick={handleCloseProjects} />
            </div>
          }
          target={<MenuButton text="XREF" />}
        />
      </div>
    </>
  );
};

export default GaDrawingsTab;

function handleCombineAvailableData(
  dispatch: Dispatch<any>,
  ui?: ProjectUI,
  availableData?: DataState
) {
  if (!ui || !availableData) return;
  const changed: ProjectUI = {
    ...ui,
    availableData: ui.availableData
      ? {
          ...ui.availableData,
          profileSectionData:
            concatUnique<Section>(
              ui.availableData.profileSectionData,
              availableData.profileSectionData,
              (a, b) => a.profile_section_id === b.profile_section_id
            ) ?? [],
          pipingCS:
            concatUnique<PipeProfile>(
              ui.availableData.pipingCS,
              availableData.pipingCS,
              (a, b) => a.piping_details_id === b.piping_details_id
            ) ?? [],
          pipingSS:
            concatUnique<PipeProfile>(
              ui.availableData.pipingSS,
              availableData.pipingSS,
              (a, b) => a.piping_details_id === b.piping_details_id
            ) ?? [],
          pipingCaps:
            concatUnique<TPipingCap>(
              ui.availableData.pipingCaps,
              availableData.pipingCaps,
              (a, b) => a.id === b.id || a.piping_caps_id === b.piping_caps_id
            ) ?? [],
          pipingCollets:
            concatUnique<TPipingCollet>(
              ui.availableData.pipingCollets,
              availableData.pipingCollets,
              (a, b) =>
                a.id === b.id || a.piping_collets_id === b.piping_collets_id
            ) ?? [],
          pipingElbows:
            concatUnique<TPipingElbow>(
              ui.availableData.pipingElbows,
              availableData.pipingElbows,
              (a, b) =>
                a.id === b.id || a.piping_elbows_id === b.piping_elbows_id
            ) ?? [],
          pipingReducers:
            concatUnique<TPipingReducer>(
              ui.availableData.pipingReducers,
              availableData.pipingReducers,
              (a, b) =>
                a.id === b.id || a.piping_reducers_id === b.piping_reducers_id
            ) ?? [],
          pipingTees:
            concatUnique<TPipingTee>(
              ui.availableData.pipingTees,
              availableData.pipingTees,
              (a, b) => a.id === b.id || a.piping_tees_id === b.piping_tees_id
            ) ?? [],
          pipingReturns:
            concatUnique<TPipingReturn>(
              ui.availableData.pipingReturns,
              availableData.pipingReturns,
              (a, b) =>
                a.id === b.id || a.piping_returns_id === b.piping_returns_id
            ) ?? [],
          pipingFlangesAllPresRating:
            concatUnique<TPipingFlangeAllPresRating>(
              ui.availableData.pipingFlangesAllPresRating,
              availableData.pipingFlangesAllPresRating,
              (a, b) => a.piping_flange_id === b.piping_flange_id
            ) ?? [],
          pipingFlangesBlind:
            concatUnique<TPipingFlangeBlind>(
              ui.availableData.pipingFlangesBlind,
              availableData.pipingFlangesBlind,
              (a, b) => a.piping_flange_id === b.piping_flange_id
            ) ?? [],
          pipingFlangesLapped:
            concatUnique<TPipingFlangeLapped>(
              ui.availableData.pipingFlangesLapped,
              availableData.pipingFlangesLapped,
              (a, b) => a.piping_flange_id === b.piping_flange_id
            ) ?? [],
          pipingFlangesRingJointFacing:
            concatUnique<TPipingFlangeRingJointFacing>(
              ui.availableData.pipingFlangesRingJointFacing,
              availableData.pipingFlangesRingJointFacing,
              (a, b) => a.piping_flange_id === b.piping_flange_id
            ) ?? [],
          pipingFlangesSlipon:
            concatUnique<TPipingFlangeSlipon>(
              ui.availableData.pipingFlangesSlipon,
              availableData.pipingFlangesSlipon,
              (a, b) => a.piping_flange_id === b.piping_flange_id
            ) ?? [],
          pipingFlangesSocketWelding:
            concatUnique<TPipingFlangeSocketWelding>(
              ui.availableData.pipingFlangesSocketWelding,
              availableData.pipingFlangesSocketWelding,
              (a, b) => a.piping_flange_id === b.piping_flange_id
            ) ?? [],
          pipingFlangesThreaded:
            concatUnique<TPipingFlangeThreaded>(
              ui.availableData.pipingFlangesThreaded,
              availableData.pipingFlangesThreaded,
              (a, b) => a.piping_flange_id === b.piping_flange_id
            ) ?? [],
          pipingFlangesWeldingneck:
            concatUnique<TPipingFlangeWeldingneck>(
              ui.availableData.pipingFlangesWeldingneck,
              availableData.pipingFlangesWeldingneck,
              (a, b) => a.piping_flange_id === b.piping_flange_id
            ) ?? [],
          pipingLongWeldingNeckFlanges:
            concatUnique<TPipingFlangeWeldingneck>(
              ui.availableData.pipingLongWeldingNeckFlanges,
              availableData.pipingLongWeldingNeckFlanges,
              (a, b) => a.piping_flange_id === b.piping_flange_id
            ) ?? [],
          pipingValveActuators:
            concatUnique<any>(
              ui.availableData.pipingValveActuators,
              availableData.pipingValveActuators,
              (a, b) => a.id === b.id
            ) ?? [],
          pipingValveControls:
            concatUnique<any>(
              ui.availableData.pipingValveControls,
              availableData.pipingValveControls,
              (a, b) => a.id === b.id
            ) ?? [],
          pipingValves:
            concatUnique<TPipingValve>(
              ui.availableData.pipingValves,
              availableData.pipingValves,
              (a, b) => a.id === b.id
            ) ?? [],
        }
      : availableData,
  };
  dispatch(changeUIAction(changed));
}

async function handleImportStaad(
  project: Project | undefined,
  profiles: Section[],
  dispatch: Dispatch<any>
) {
  if (!project) return;
  let file: File | undefined;
  try {
    file = await new Promise((res, rej) => {
      openFile([".txt", ".std"], (files) => {
        const file = files[0];
        if (file) res(file);
        rej("File is undefined");
      });
    });
  } catch (error) {
    console.error(error);
    dispatch(addEventAction("Failed to read Staad file", "danger"));
  }
  if (!file) return;
  dispatch(changeRequestProgressAction("odssConverting"));
  try {
    const formData = new FormData();
    formData.append("file", file, file.name);
    const res = await Axios.post(
      `${secondServerAPI}/structure/ODSS/importfromstaad`,
      formData
    );
    createODSS(project, profiles, res.data, dispatch);
    dispatch(changeRequestProgressAction("odssConverting", false));
    dispatch(addEventAction("File has been successfuly converted", "success"));
    return;
  } catch (error) {
    console.error(error);
    dispatch(addEventAction("Failed to convert Staad file", "danger"));
    dispatch(changeRequestProgressAction("odssConverting", false));
  }

  try {
    const text = await file.text();
    const json = JSON.parse(text);
    createODSS(project, profiles, json, dispatch);
  } catch (error) {
    dispatch(addEventAction("Failed to convert Staad file locally", "danger"));
  }
  dispatch(changeRequestProgressAction("odssConverting", false));
}

function createODSS(
  project: Project,
  profiles: Section[],
  json: any,
  dispatch: Dispatch<any>
) {
  const id = getNextId(project.odss ?? []);
  const index = getIndexName(project.odss ?? [], "ODSS");
  const sections = json.BeamSections ?? {};
  const userDefinedSectionsOfStaad: ODSSUserDefinedSection[] =
    project.userDefinedSectionsOfStaad ?? [];
  for (const element of Object.values(sections) as ODSSBeamSection[]) {
    if (
      profiles.some(
        (p) => p.designation.toLowerCase() === element.Name.toLowerCase()
      )
    )
      continue;
    userDefinedSectionsOfStaad.push({
      id: getNextId(userDefinedSectionsOfStaad),
      type: "Prismatic",
      name: element.Name,
      area: element.Area,
      lx: element.MomentOfInertia_x,
      ly: element.MomentOfInertia_y,
      lz: element.MomentOfInertia_z,
      height: element.Thickness,
      width: element.Width,
    });
  }
  let odss: ODSS = {
    ...json,
    id,
    name: `ODSS${index}`,
    project: project.name,
    type: "ODSS",
  };
  const elements: ODSSBeamElement[] = Object.values(odss.BeamElements);
  for (const element of elements) {
    const n1: ODSSNode = odss.Nodes[element.Nodes[0]];
    const n2: ODSSNode = odss.Nodes[element.Nodes[1]];
    let Type: ODSSBeamElementType = "Undefined";
    if (n1.Coords[1] !== n2.Coords[2]) {
      if (n1.Coords[0] !== n2.Coords[0] || n1.Coords[2] !== n2.Coords[2]) {
        Type = "V-Bracing";
      } else if (
        n1.Coords[0] === n2.Coords[0] &&
        n1.Coords[2] === n2.Coords[2]
      ) {
        Type = "Column";
      }
    } else {
      Type =
        n1.Coords[0] !== n2.Coords[0] && n1.Coords[2] !== n2.Coords[2]
          ? "H-Bracing"
          : "Beam";
    }
    const StartConnected: number[] = elements
      .filter(
        (el) =>
          el.Label !== element.Label && el.Nodes.includes(element.Nodes[0])
      )
      .map((el) => el.Label);
    const EndConnected: number[] = elements
      .filter(
        (el) =>
          el.Label !== element.Label && el.Nodes.includes(element.Nodes[1])
      )
      .map((el) => el.Label);
    const Connected: number[] = Array.from(
      new Set(
        elements
          .filter((el) => {
            if (el.Label === element.Label) return false;
            const ns1: ODSSNode = odss.Nodes[el.Nodes[0]];
            const ns2: ODSSNode = odss.Nodes[el.Nodes[1]];
            if (
              ns1.Coords.some(
                (c) =>
                  !checkRange(c, n1.Coords[0], n2.Coords[0]) ||
                  !checkRange(c, n1.Coords[0], n2.Coords[0], false, false, true)
              ) ||
              ns2.Coords.some(
                (c) =>
                  !checkRange(c, n1.Coords[0], n2.Coords[0]) ||
                  !checkRange(c, n1.Coords[0], n2.Coords[0], false, false, true)
              )
            )
              return false;
            return true;
          })
          .map((el) => el.Label)
      )
    );
    const updated: ODSSBeamElement = {
      ...element,
      Type,
      StartConnected,
      EndConnected,
      Connected,
    };
    odss = {
      ...odss,
      BeamElements: { ...odss.BeamElements, [updated.Label]: updated },
    };
  }
  dispatch(
    changeProjectAction({
      ...project,
      odss: [...(project.odss ?? []), odss],
      userDefinedSectionsOfStaad,
    })
  );
}
