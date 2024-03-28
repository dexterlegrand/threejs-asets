import { Button,Card } from "@blueprintjs/core";
import React, { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { getCurrentProject } from "../../components/3d-models/utils";
import { ApplicationState } from "../../store";
import { changeDashboardAction } from "../../store/main/actions";
import ProjectChecklist from "./ProjectChecklist";
import "./dashboard_css/ProjectPlaner.css"
import { InputDlg } from "../../components/common/InputDlg";
import ProjectEngineerList from "./ProjectEngineerList";
import ProjectBudget from "./ProjectBudget";
import ProjectCategoriesActivities from "./ProjectCategoriesActivities";

export default function ProjectPlaner() {
  const [dlg, setDlg] = useState<JSX.Element>();
  const [isCheckList, setIsCheckList] = useState(true);
  const [isEngineers, setIsEngineers] = useState(true);
  const [isBudget, setIsBudget] = useState(true);

  const project = useSelector((state: ApplicationState) =>
    getCurrentProject(state)
  );

  const dispatch = useDispatch();

  const handleChangeDashboardInfo = (field: string, value: any) => {
    if (!project) return;
    dispatch(
      changeDashboardAction({ ...(project.dashboard ?? {}), [field]: value })
    );
  };

  return (
    <>
      {dlg}
      <div className="d-flex label-light  f-ai-center" />
      <table className={"dashboard-table-project-planer"}>
        <tbody>
          <tr>
            <td className={"info"}>PROJECT NAME / EVENT TITLE</td>
            <td colSpan={3}>{project?.name}</td>
          </tr>
          <tr>
            <td className={"info"}>VENUE / LOCATION</td>
            <td className={"additional-info-container"}
              onClick={() =>
                setDlg(
                  <InputDlg
                    title="Change location"
                    onClose={(val) => {
                      handleChangeDashboardInfo("location", val);
                      setDlg(undefined);
                    }}
                  />
                )
              }
            >
              {project?.dashboard?.location}
            </td>
            <td className={"info"}>PROJECT DATE & TIME</td>
            <td className={"additional-info-container"}
              onClick={() =>
                setDlg(
                  <InputDlg
                    title="Change date"
                    
                    onClose={(val) => {
                      handleChangeDashboardInfo("date", val);
                      setDlg(undefined);
                    }}
                  />
                )
              }
            >
              {project?.dashboard?.date}
            </td>
          </tr>
          <tr>
            <td className={"info"}>ADDITIONAL INFO</td>
            <td className={"additional-info-container"}
              colSpan={3}
              onClick={() =>
                setDlg(
                  <InputDlg
                    title="Change additional info"
                    onClose={(val) => {
                      handleChangeDashboardInfo("description", val);
                      setDlg(undefined);
                    }}
                  />
                )
              }
            >
              {project?.dashboard?.description}
            </td>
          </tr>
        </tbody>
      </table>
      <div className="label-light f-ai-center division">
        <h2 className="no-m-1">
          <Button
            small
            minimal
            icon={isCheckList ? "caret-down" : "caret-right"}
            onClick={() => setIsCheckList((prev) => !prev)}
          />
          Project Planning Checklist
        </h2>
      </div>
      <div className="hr" />
      {isCheckList ? (
        <ProjectChecklist
          list={project?.dashboard?.checklist ?? []}
          onChange={(list) => handleChangeDashboardInfo("checklist", list)}
        />
      ) : null}
      <div className="label-light f-ai-center division">
        <h2 className="no-m-1">
          <Button
            small
            minimal
            icon={isEngineers ? "caret-down" : "caret-right"}
            onClick={() => setIsEngineers((prev) => !prev)}
          />
          Engineering List
        </h2>
      </div>
      <div className="hr" />
      {isEngineers ? (
        <ProjectEngineerList
          list={project?.dashboard?.engineerGroups ?? []}
          onChange={(list) => handleChangeDashboardInfo("engineerGroups", list)}
        />
      ) : null}
      <div className="label-light f-ai-center division">
        <h2 className="no-m-1">
          <Button
            small
            minimal
            icon={isBudget ? "caret-down" : "caret-right"}
            onClick={() => setIsBudget((prev) => !prev)}
          />
          Project Budget
        </h2>
      </div>
      <div className="hr" />
      {isBudget ? (
        <ProjectBudget
          budget={project?.dashboard?.budget}
          onChange={(budget) => handleChangeDashboardInfo("budget", budget)}
        />
      ) : null}
      {isBudget ? (
        <ProjectCategoriesActivities
          budget={project?.dashboard?.budget}
          onChange={(budget) => handleChangeDashboardInfo("budget", budget)}
        />
      ) : null}
    </>
  );
}
