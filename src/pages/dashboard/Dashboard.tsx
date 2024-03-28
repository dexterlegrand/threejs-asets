import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useHistory } from "react-router-dom";
import { ApplicationState } from "../../store";
import MenuButton from "../../components/menu-bar/MenuButton";
import ProjectPlaner from "./ProjectPlaner";
import SchedulePlaner from "./SchedulePlaner";
import MTOContainer from "./MTOContainer";
import OpenModelDlg from "../../components/menu-bar/project-tab/OpenModelDlg";
import {
  getCurrentProject,
  getLocalStorageImage,
  openGenericProject,
} from "../../components/3d-models/utils";
import { saveToPDF } from "./dashboard-utils";

import "./Dashboard.css";
import { ModelType } from "../../store/main/types";
import { RemoteFiles } from "../../components/menu-bar/help-tab/remote-files/RemoteFiles";

const logoUrl = "../../assets/Logo.jpg";
import logo from "../../assets/Logo.jpg";

export default function Dashboard() {
  const [dialog, setDialog] = useState<JSX.Element>();
  const [tabId, setTabId] = useState(0);
  /*const [logo, setLogo] = useState("");*/

  const mode = useSelector((state: ApplicationState) => state.main.workMode);
  const project = useSelector((state: ApplicationState) =>
    getCurrentProject(state)
  );
  const projects = useSelector(
    (state: ApplicationState) => state.main.projects
  );

  const dispatch = useDispatch();

  const history = useHistory();

  /*useEffect(() => {
    setLogo(localStorage.getItem(logoUrl) || "");
    getLocalStorageImage(logoUrl).then((data) => data && setLogo(data));
  }, []);*/

  function handleOpenRemoteFilesList() {
    setDialog(<RemoteFiles onClose={() => setDialog(undefined)} />);
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

  function handleCloseOpenModelDlg(file?: File, type?: ModelType | undefined) {
    openGenericProject(dispatch, file, mode, projects, type).finally(() =>
      setDialog(undefined)
    );
  }

  const imgStyle = {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    width: '110px',
    height: '110px',
    borderRadius: '5%'
  };

  return (
    <div className={"dashboard-container"}>
      <div className={"dashboard-header"}>
        <img
          src={logo}
          style={imgStyle}
          alt="Asets-Lux"
          onClick={() => history.push("/modes")}
        />
        <div className={"dashboard-header-content"}>
          <MenuButton text={"Editor"} onClick={() => history.push("/editor")} />
          <MenuButton text={"Open Project"} onClick={handleOpenProject} />
          <MenuButton text={"Project Planner"} onClick={() => setTabId(0)} />
          <MenuButton
            text="Download Datasheets"
            onClick={handleOpenRemoteFilesList}
          />
          <MenuButton text={"Schedule Planner"} onClick={() => setTabId(1)} />
          <MenuButton text={"MTO"} onClick={() => setTabId(2)} />
          <MenuButton text={"Save to PDF"} onClick={() => saveToPDF(project)} />
        </div>
      </div>
      {tabId === 0 ? <ProjectPlaner /> : null}
      {tabId === 1 ? <SchedulePlaner /> : null}
      {tabId === 2 ? <MTOContainer /> : null}
      {dialog}
    </div>
  );
}
