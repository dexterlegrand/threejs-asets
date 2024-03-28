import React, { FunctionComponent, useState } from "react";
import { useHistory } from "react-router-dom";
import {
  faFilm,
  faInfoCircle,
  faQuestionCircle,
} from "@fortawesome/free-solid-svg-icons";
import MenuButton from "../MenuButton";
import { RemoteFiles } from "./remote-files/RemoteFiles";
import { VideoList } from "./video-list/VideoList";
import { useRecoilState } from "recoil";
import { viewerComments } from "../../../recoil/atoms/viewer-comments-atom";
import { openFile } from "../../3d-models/utils";
import ViewerComments from "../../../pages/viewer-comments/ViewerComments";
import { ManualDLG } from "./ManualDLG";

type DAILOG = "MANUAL";
import { OnboardList } from "./tour-list/OnboardList";
import { useSelector } from "react-redux";
import { ApplicationState } from "../../../store";
import { getTourListForDiscipline } from "../../tour-data-provider/TourDataProvider";

const HelpTab: FunctionComponent = () => {
  const [dialog, setDialog] = useState<JSX.Element>();
  const [dlg, setDlg] = useState<DAILOG>();

  const [comments, setComments] = useRecoilState(viewerComments);
  const mode = useSelector((state: ApplicationState) => state.main.workMode);
  const history = useHistory();

  function routeChange(url: string) {
    history.push(url);
  }

  function invokeReportIssue() {
    window.open("https://asets-tech-support.atlassian.net/servicedesk/customer/portal/1", "_blank");
  }

  function handleOpenVideoList() {
    setDialog(<VideoList onClose={() => setDialog(undefined)} />);
  }

  function handleCloseDlg(){
    setDlg(undefined);
  }

  function handleOpenManual() {
    setDlg('MANUAL');
  }

  

  /*function handleOpenRemoteFilesList() {
    setDialog(<RemoteFiles onClose={() => setDialog(undefined)} />);
  }*/

  function handleRedirect() {
    routeChange("/viewer");
    // window.open("/viewer", "_blank");
  }

  function handleOpenComments() {
    openFile([".idsvc"], (files) => {
      const file = files[0];
      if (!file) return;
      file.text().then((text) => {
        setComments(JSON.parse(text));
        setDialog(
          <ViewerComments
            isShow={true}
            title={file.name.replace(".idsvc", "")}
            onClose={() => setDialog(undefined)}
          />
        );
      });
    });
  }
  function tourListPopup() {
    setDialog(<OnboardList onboardDiscipline={mode} onClose={() => setDialog(undefined)} />);
  }
  return (
    <div className="d-flex">
      {dialog}
      <MenuButton
        text="Report Issue"
        icon={faQuestionCircle}
        onClick={invokeReportIssue}
        id="help-report-issue-button"
      />
      <MenuButton text="Videos" icon={faFilm} onClick={handleOpenVideoList} />
      {/*<MenuButton text="About" icon={faInfoCircle} disabled={true} />*/}
      {/*<MenuButton
        text="Download Datasheets"
        onClick={handleOpenRemoteFilesList}
  />*/}
      <MenuButton text="Open IDSV Viewer" onClick={handleRedirect} />
      <MenuButton text="Open IDSV Comments" onClick={handleOpenComments} />
      {dlg === "MANUAL" ? <ManualDLG isVisible={dlg === "MANUAL"} onClose={handleCloseDlg}/> :null}
      <MenuButton text ="Manual" onClick={handleOpenManual} />
      {
        getTourListForDiscipline(mode).length > 0 && <MenuButton text="Take a tour" onClick={tourListPopup} />
      }
      
    </div>
  );
};

export default HelpTab;
