import React, { FunctionComponent, useMemo, useState } from "react";
import MenuButton from "../MenuButton";
import { InputDlg } from "../../common/InputDlg";
import OpenModelDlg from "./OpenModelDlg";
import {
  faCog,
  faFile,
  faFolderOpen,
  faSave,
} from "@fortawesome/free-solid-svg-icons";
import { useDispatch, useSelector } from "react-redux";
import { ApplicationState } from "../../../store";
import { createProject } from "../../../store/main/actions";
import {
  getCurrentUI,
  getCurrentProcess,
  saveGenericProject,
  openGenericProject,
} from "../../3d-models/utils";
import { createUIAction } from "../../../store/ui/actions";
import { SettingsDlg } from "./settings/SettingsDlg";
import { AvailableData } from "./available-data/AvailableData";
import { createPSSAction } from "../../../store/pss/actions";
import { createProcessAction } from "../../../store/process/actions";
import { useHistory } from "react-router-dom";
import { ModelType } from "../../../store/main/types";
import MTOContainer from "../../../pages/dashboard/MTOContainer";

type Props = {};

const ProjectTab: FunctionComponent<Props> = () => {
  const [dialog, setDialog] = useState<JSX.Element>();

  const history = useHistory();

  function routeChange(url: string) {
    history.push(url);
  }

  const mode = useSelector((state: ApplicationState) => state.main.workMode);

  const controls = useSelector(
    (state: ApplicationState) => state.scene.controls
  );
  const currentProject = useSelector(
    (state: ApplicationState) => state.main.currentProject
  );
  const projects = useSelector(
    (state: ApplicationState) => state.main.projects
  );
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
  const ui = useSelector((state: ApplicationState) => getCurrentUI(state));
  const process = useSelector((state: ApplicationState) =>
    getCurrentProcess(state)
  );

  const dispatch = useDispatch();

  const project = useMemo(() => {
    return projects.find((project) => project.name === currentProject);
  }, [projects, currentProject]);

  function handleCloseOpenModelDlg(file?: File, type?: ModelType | undefined) {
    openGenericProject(dispatch, file, mode, projects, type).finally(() =>
      setDialog(undefined)
    );
  }

  function handleCloseInputDlg(name?: string) {
    if (name) {
      dispatch(createProject(name));
      dispatch(createUIAction(name));
      dispatch(createProcessAction(name));
      dispatch(createPSSAction(name));
    }
    setDialog(undefined);
  }

  function handleCreateProject() {
    setDialog(
      <InputDlg title={`Create new project`} onClose={handleCloseInputDlg} />
    );
  }

  function handleOpenProject() {
    let extensions;
    switch (mode) {
      case "PIPING":
        extensions = [".pps", ".ddd"];
        break;
      case "STRUCTURE":
        extensions = [".pds", ".ods", ".ddd"];
        break;
      case "PROCESS":
        extensions = [".psm", ".p2p", ".ddd"];
        break;
      case "DESIGNER":
        extensions = [".psm", ".p2p", ".pds", ".ods", ".pps", ".ddd"];
    }
    setDialog(
      <OpenModelDlg
        mode={mode}
        onClose={handleCloseOpenModelDlg}
        extensions={extensions}
      />
    );
  }

  function handleSave() {
    saveGenericProject(
      project,
      ui,
      process,
      mode,
      fabricatedSections,
      rolledSections,
      combinedSections,
      userDefinedElbows,
      controls
    );
  }

  function handleOpenSettings() {
    setDialog(<SettingsDlg onClose={() => setDialog(undefined)} />);
  }

  function handleOpenAvailableData() {
    setDialog(<AvailableData onClose={() => setDialog(undefined)} />);
  }

  function handleOpenDashboard() {
    routeChange("/dashboard");
  }

  function handleOpenMTO(){
    
  }


  return (
    <div className="d-flex">
      {dialog}
      <MenuButton id="new-project" text="New" icon={faFile} onClick={handleCreateProject} />
      <MenuButton id="open-project" text="Open" icon={faFolderOpen} onClick={handleOpenProject} />
      <MenuButton id="save-project" text="Save" icon={faSave} onClick={handleSave} />
      <MenuButton id="project-settings" text="Settings" icon={faCog} onClick={handleOpenSettings} />
      <MenuButton id="project-catalogue" text="Catalogue" onClick={handleOpenAvailableData} />
      {mode === "DESIGNER" ? (
        <MenuButton id="project-dashboard" text="Dashboard" onClick={handleOpenDashboard} />
      ): null}
      {mode !== "DESIGNER" ? (
        <MenuButton text="MTO" onClick = {handleOpenMTO} />
      ): null}
      {}
    </div>
  );
};

export default ProjectTab;
