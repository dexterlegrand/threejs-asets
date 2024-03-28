import React, { useEffect, useMemo, useState } from "react";
import { useSelector, useDispatch  } from "react-redux";
import { FormGroup, Button } from "@blueprintjs/core";
import {
  TProcessIssue,
  TProcessIssueStatus,
  EProcessElementType,
  TProcessImport,
  TProcessElement,
  TProcess,
  TProcessLine,
} from "../../../store/process/types";
import { CustomDlg } from "../../common/CustomDlg";
import { InputCell } from "../../common/InputCell";
import { SelectorCell } from "../../common/SelectorCell";
import {
  saveToFile,
  getNextId,
  getCurrentProcess,
  getCurrentProject,
} from "../../3d-models/utils";
import { ApplicationState } from "../../../store";
import { changeProcessIssuesAction } from "../../../store/process/actions";
import { convertProcessToImporting } from "../../3d-models/process/process";
import { changeImportedToProcessAction } from "../../../store/main/actions";
import OpenModelDlg from "../project-tab/OpenModelDlg";
import { checkFileType } from "../../3d-models/utils";
import { fixImportedProcess } from "../../3d-models/process/process";
import { updatePipes } from "../../3d-models/process/process";
import { getElementByName } from "../../3d-models/utils";

type Props = {
  pipeProcess?: TProcess;
  onClose: () => any;
};

export function ProcessDesignerToPipingDesigner({ pipeProcess, onClose }: Props) {
  const mode = useSelector((state: ApplicationState) => state.main.workMode);
  const projects = useSelector((state: ApplicationState) => state.main.projects);
  const currentProject = useSelector((state: ApplicationState) => state.main.currentProject);
  const process = useSelector((state: ApplicationState) => getCurrentProcess(state));
  const current = useSelector((state: ApplicationState) => state.main.currentProject);
  const imported = useSelector(
    (state: ApplicationState) => getCurrentProject(state)?.importedProcess ?? []
  );
  const [dialog, setDialog] = useState<JSX.Element>();

  const dispatch = useDispatch();

  const issues = useMemo(() => {
    return process?.issues ?? [];
  }, [process]);

  const project = useMemo(() => {
    return getElementByName(projects, currentProject);
  }, [projects, currentProject]);

  useEffect(() => {
    if (mode === "PRODESIGNER" || mode === "DESIGNER") {
      if (!process) return;
      const elements = Array.from(process.elements.values());
      const lines = process.lines ?? [];
      let issue = issues.find((i) => i.status === "Draft Copy");
      if (issue) {
        issue = {
          ...issue,
          equipments: getEquipments(elements),
          lines: getLines(lines),
          date: new Date().toLocaleDateString(),
          state: JSON.stringify(convertProcessToImporting(current, process)),
        };
        dispatch(
          changeProcessIssuesAction(
            current,
            issues.map((i) => (i.id === issue!.id ? issue! : i))
          )
        );
      } else {
        issue = {
          id: 0,
          fileName: "",
          equipments: getEquipments(elements),
          lines: getLines(lines),
          date: new Date().toLocaleDateString(),
          revision: 0,
          status: "Draft Copy",
          state: JSON.stringify(convertProcessToImporting(current, process)),
        };
        dispatch(changeProcessIssuesAction(current, [issue]));
      }
    } else if (mode === "PIPDESIGNER") {
      if (!pipeProcess) return;
      const elements = Array.from(pipeProcess.elements.values());
      const lines = pipeProcess.lines ?? [];
      let importing = imported.find((i) => !i.imported);
      if (importing) {
        importing = {
          ...importing,
          equipments: getEquipments(elements),
          lines: getLines(lines),
          state: JSON.stringify(convertProcessToImporting(current, pipeProcess)),
        };
      } else {
        importing = {
          id: 0,
          fileName: "",
          equipments: getEquipments(elements),
          lines: getLines(lines),
          state: JSON.stringify(convertProcessToImporting(current, pipeProcess)),
          imported: false,
          revision: 0,
        };
      }
      dispatch(
        changeImportedToProcessAction(
          current,
          imported.length
            ? imported.map((i) => (i.id === importing!.id ? importing! : i))
            : [importing]
        )
      );
    }
  }, [pipeProcess]);

  function getEquipments(elements: TProcessElement[]) {
    return elements.reduce((acc, e) => {
      if (
        [
          EProcessElementType.SOURCE,
          EProcessElementType.SINK,
          EProcessElementType.PIPE,
          EProcessElementType.VALVE,
        ].includes(e.type)
      )
        return acc;
      return acc + 1;
    }, 0);
  }

  function getLines(lines: TProcessLine[]) {
    return lines.reduce((acc, e) => (e.type === "PIPE" ? acc + 1 : acc), 0);
  }

  function issueDraftCopy() {
    const issue = issues.find((i) => i.status === "Draft Copy");
    if (!issue) return;
    saveToFile(JSON.stringify(issue), issue.fileName + issue.revision + "_draft_copy", "dddpsm");
  }
  function issueDraftCopypps() {
    const issue = issues.find((i) => i.status === "Draft Copy");
    if (!issue) return;
    saveToFile(JSON.stringify(issue), issue.fileName + issue.revision + "_draft_copy", "dddpps");
  }

  function issueProcess(issue: TProcessIssue) {
    saveToFile(JSON.stringify(issue), issue.fileName + issue.revision, "dddpsm");
  }

  function handleImport() {
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
              updatePipes(dispatch, project, process);
              /*updateCables(dispatch, project, process);*/
              setDialog(undefined);
            });
          } else setDialog(undefined);
        }}
        extensions={[".dddpsm"]}
      />
    );
  }

  function handleChangeIssue(issue: TProcessIssue, field: string, value: any) {
    if (!process) return;
    const changed = { ...issue, [field]: value };
    if (field === "status" && (value as TProcessIssueStatus) === "Issued") {
      issueProcess(changed);
      const elements = Array.from(process.elements.values());
      dispatch(
        changeProcessIssuesAction(current, [
          ...issues.map((i) => (i.id === issue!.id ? changed : i)),
          {
            id: getNextId(issues),
            fileName: "",
            equipments: elements.reduce((acc, e) => {
              if (
                [
                  EProcessElementType.SOURCE,
                  EProcessElementType.SINK,
                  EProcessElementType.PIPE,
                  EProcessElementType.VALVE,
                ].includes(e.type)
              )
                return acc;
              return acc + 1;
            }, 0),
            lines: elements.reduce(
              (acc, e) => (e.type === EProcessElementType.PIPE ? acc + 1 : acc),
              0
            ),
            date: new Date().toLocaleDateString(),
            revision: changed.revision + 1,
            status: "Draft Copy",
            state: JSON.stringify(process),
          },
        ])
      );
    } else {
      dispatch(
        changeProcessIssuesAction(
          current,
          issues.map((i) => (i.id === issue!.id ? changed : i))
        )
      );
    }
  }

  function drawRowIssue(row: TProcessIssue) {
    return (
      <tr key={row.id}>
        <td>{row.id + 1}</td>
        <InputCell
          value={row.fileName}
          disabled={row.status === "Issued"}
          onChange={(val) => handleChangeIssue(row, "fileName", val)}
        />
        <td>{row.equipments}</td>
        <td>{row.lines}</td>
        <td>{row.date}</td>
        <td>{row.revision}</td>
        <SelectorCell<TProcessIssueStatus>
          items={["Draft Copy", "Issued"]}
          itemKey={(val) => val}
          itemLabel={(val) => val}
          selected={row.status}
          disabled={row.status === "Issued"}
          onSelect={(val) => handleChangeIssue(row, "status", val)}
        />
      </tr>
    );
  }

  function handleChangeImported(importing: TProcessImport, field: string, value: any) {
    let changed = { ...importing, [field]: value };
    if (field === "imported" && value) {
      changed = { ...changed, date: new Date().toLocaleDateString() };
      saveToFile(JSON.stringify(changed), changed.fileName + changed.revision, "dddpsm");
      dispatch(
        changeImportedToProcessAction(current, [
          ...imported.map((i) => (i.id === changed.id ? changed : i)),
          {
            ...changed,
            id: getNextId(imported),
            fileName: "",
            revision: changed.revision + 1,
            imported: false,
          },
        ])
      );
    } else {
      dispatch(
        changeImportedToProcessAction(
          current,
          imported.map((i) => (i.id === importing.id ? changed : i))
        )
      );
    }
  }

  function drawRowImported(row: TProcessImport) {
    return (
      <tr key={row.id}>
        <td>{row.id + 1}</td>
        <InputCell
          value={row.fileName}
          disabled={row.imported}
          onChange={(val) => handleChangeImported(row, "fileName", val)}
        />
        <td>{row.equipments}</td>
        <td>{row.lines}</td>
        <td>{row.date}</td>
        <td>{row.revision}</td>
        <SelectorCell<boolean>
          items={[false, true]}
          itemKey={(val) => (val ? "Issued" : "Draft Copy")}
          itemLabel={(val) => (val ? "Issued" : "Draft Copy")}
          selected={row.imported}
          disabled={row.imported}
          onSelect={(val) => handleChangeImported(row, "imported", val)}
        />
      </tr>
    );
  }

  return (
    <CustomDlg
      title={` ${mode === "PIPDESIGNER" ? " Piping Designer To Process Designer" : "Export Process Designer To Piping Designer"}`}
      isMinimize={true}
      position={"center"}
      body={
        <div className="d-flex f-grow f-column bg-dark">
          <div className="label-light bg-dark d-flex f-ai-center " style={{ paddingRight: 10 }}>
            <FormGroup className="no-m">
              {mode === "PRODESIGNER" || mode === "DESIGNER" ? (
                <Button
                  small
                  icon={"export"}
                  text={"Issue"}
                  intent={"danger"}
                  onClick={issueDraftCopy}
                />
              ) : null}
              {mode === "PIPDESIGNER"  ? (
                <>
                <Button
                  small
                  icon={"import"}
                  text={"import"}
                  onClick={handleImport}
                />
                {/*<Button
                small
                icon={"export"}
                text={"export"}
                intent={"danger"}
                onClick={issueDraftCopypps}
              />*/}
                </>
              ) : null}
            </FormGroup>
          </div>
          <div className={"hr"} />
          <div className={"bg-dark p-5"}>
            <div className={"table-container"}>
              <table className="table bg-gray">
                <thead>
                  <tr>
                    <th>SR. No.</th>
                    <th>Export File Name</th>
                    <th>No. of Equipments</th>
                    <th>No. of Lines</th>
                    <th>Date</th>
                    <th>Rev.No.</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {mode === "PRODESIGNER" || mode === "DESIGNER"
                    ? issues.map(drawRowIssue)
                    : mode === "PIPDESIGNER"
                    ? imported.map(drawRowImported)
                    : null}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      }
      onClose={onClose}
    />
  );
}