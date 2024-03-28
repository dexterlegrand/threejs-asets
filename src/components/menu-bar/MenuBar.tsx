import React, { FunctionComponent, useMemo, useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Tab, Tabs } from "@blueprintjs/core";
import ProjectTab from "./project-tab/ProjectTab";
import ModelingTab from "./3d-modeling/ModelingTab";
import { ApplicationState } from "../../store";
import { changeActiveTab } from "../../store/main/actions";
import LoadingTab from "./loading-tab/LoadingTab";
import AnalysisTab from "./analysis-tab/AnalysisTab";
import GaDrawingsTab from "./ga-drawings-tab/GaDrawingsTab";
import HelpTab from "./help-tab/HelpTab";
import FeaAnalysisTab from "./fea-analysis-tab/FeaAnalysisTab";
import UserTab from "./user-tab/UserTab";
import EditTab from "./edit-tab/EditTab";
import { getLocalStorageImage } from "../3d-models/utils";
import { useHistory } from "react-router-dom";
import Axios from "axios";
import { secondServerAPILearning } from "../../pages/utils/agent";

type StateProps = {
  selectedTab?: string;
};

type Props = StateProps;

const logoUrl = "./old/icon/Logo-2.jpg";

const MenuBar: FunctionComponent<Props> = () => {
  const [logo, setLogo] = useState("");
  const [username, setUsername] = useState<string[]>([]);

  const selectedTab = useSelector(
    (state: ApplicationState) => state.main.activeTab
  );
  const auth = useSelector((state: ApplicationState) => state.auth);
  const project = useSelector((state: ApplicationState) =>
    state.main.projects.find((item) => item.name === state.main.currentProject)
  );
  const mode = useSelector((state: ApplicationState) => state.main.workMode);

  const dispatch = useDispatch();

  const handleTabChange = (
    newTabId: string,
    prevTabId: string,
    event: React.MouseEvent<HTMLElement>
  ) => {
    /*dispatch(changeActiveTab(newTabId));*/
    if (newTabId === selectedTab) {
      dispatch(changeActiveTab("")); 
    } else {
      dispatch(changeActiveTab(newTabId));
    }
  };

  const user = useSelector((state: ApplicationState) => state.auth.currentUser);

  const history = useHistory();

  function  handleGetUsername(){ 
    Axios.get(`${secondServerAPILearning}/api/v1/learning/userInformation`,{
      headers: {
        'user-id' : auth.User_id
      }
    })
    .then(res => {
      setUsername(res.data.userName);
    })
    .catch(error => {
      console.error("There was an error fetching username: ",error);
    });
  }

  /*useEffect(() => {
    handleGetUsername();
  })*/

  useEffect(() => {
    handleGetUsername();
    setLogo(localStorage.getItem(logoUrl) || "");
    getLocalStorageImage(logoUrl).then((data) => data && setLogo(data));
  }, []);

  return (
    <div className="menu-bar">
      <img src={logo} alt="Asets-Lux" style={{
          maxHeight: "101px",
          maxWidth: "100%",
        }} onClick={() => history.push("/modes")} />
      <Tabs
        id="TabsExample"
        animate
        large
        onChange={handleTabChange}
        selectedTabId={selectedTab}
      >
        <Tab id="project" title="Project" panel={<ProjectTab />} />
        <Tab id="edit" title="Edit" panel={<EditTab />} />
        <Tab id="3d_modeling" title="3D Modeling" panel={<ModelingTab />} />
        {mode !== "DESIGNER" && mode !== "PROCESS" && mode !== "PRODESIGNER" && mode !=="PIPDESIGNER" && mode !== "STRDESIGNER" ? (
          <Tab
            id="loading"
            title="Loading"
            panel={<LoadingTab project={project} />}
          />
        ) : null}
        {mode !== "DESIGNER"  && mode !== "PIPDESIGNER" && mode !== "STRDESIGNER" ? (
          <Tab id="analysis" title="Analysis" panel={<AnalysisTab />} />
        ) : null}
        {mode === "PIPING" ? (
          <Tab
            id="fba_analysis"
            title="FEA Analysis"
            panel={<FeaAnalysisTab />}
          />
        ) : null}
        <Tab id="exchange" title="Exchange" panel={<GaDrawingsTab />} />
        <Tab id="help" title="Help" panel={<HelpTab />} />
        <div className={"d-flex f-grow"} />
        <Tab id="user" title={`Welcome ${username}`} panel={<UserTab />} />
      </Tabs>
    </div>
  );
};

export default MenuBar;
