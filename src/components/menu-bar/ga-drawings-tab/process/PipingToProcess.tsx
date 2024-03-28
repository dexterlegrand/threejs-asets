import React, { useMemo, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { FormGroup, Button } from "@blueprintjs/core";
import { TProcessIssue } from "../../../../store/process/types";
import { CustomDlg } from "../../../common/CustomDlg";
import {
  getNextId,
  getCurrentProcess,
  checkFileType,
} from "../../../3d-models/utils";
import { ApplicationState } from "../../../../store";
import OpenModelDlg from "../../project-tab/OpenModelDlg";
import { changeProcessImportedAction } from "../../../../store/process/actions";
import { fixImportedProcess } from "../../../3d-models/process/process";

type Props = {
  onClose: () => any;
};

export function PipingToProcess({ onClose }: Props) {
  const [dlg, setDlg] = useState<JSX.Element>();

  const mode = useSelector((state: ApplicationState) => state.main.workMode);
  const process = useSelector((state: ApplicationState) =>
    getCurrentProcess(state)
  );
  const current = useSelector(
    (state: ApplicationState) => state.main.currentProject
  );

  const dispatch = useDispatch();

  const imported = useMemo(() => {
    return process?.imported ?? [];
  }, [process]);

  

  function handleImport() {
    setDlg(
      <OpenModelDlg
        mode={mode}
        /*title={"Open Process from Piping"}*/
        title={`Open ${mode === "PIPDESIGNER" ? "Piping from Process" : "Process from Piping"}`}
        onClose={(file) => {
          if (!file) {
            setDlg(undefined);
            return;
          }
          const extention = checkFileType(file.name);
          if ("dddpsm" === extention) {
            file.text().then((text) => {
              const json = JSON.parse(text);
              dispatch(
                changeProcessImportedAction(
                  current,
                  fixImportedProcess(JSON.parse(json.state ?? "{}")),
                  [...imported, { ...json, id: getNextId(imported) }]
                )
              );
              setDlg(undefined);
            });
          } else setDlg(undefined);
        }}
        extensions={[".dddpsm"]}
      />
    );
  }

  function drawRow(row: TProcessIssue) {
    return (
      <tr key={row.id}>
        <td>{row.id + 1}</td>
        <td>{row.fileName}</td>
        <td>{row.equipments}</td>
        <td>{row.lines}</td>
        <td>{row.date}</td>
        <td>{row.revision}</td>
      </tr>
    );
  }

  return (
    <>
      <CustomDlg
        zIndex={1}
        /*title={"Import From Piping"}*/
        title={`Open ${mode === "PIPDESIGNER" ? "Piping from Process" : "Process from Piping"}`}
        isMinimize={true}
        position={"center"}
        body={
          <div className="d-flex f-grow f-column bg-dark">
            <div
              className="label-light bg-dark d-flex f-ai-center "
              style={{ paddingRight: 10 }}
            >
              <FormGroup className="no-m">
                <Button
                  small
                  icon={"import"}
                  text={"Import"}
                  intent={"danger"}
                  onClick={handleImport}
                />
              </FormGroup>
            </div>
            <div className={"hr"} />
            <div className={"bg-dark p-5"}>
              <div className={"table-container"}>
                <table className="table bg-gray">
                  <thead>
                    <tr>
                      <th>SR. No.</th>
                      <th>Import File Name</th>
                      <th>No. of Equipments</th>
                      <th>No. of Lines</th>
                      <th>Date of Import</th>
                      <th>Rev.No.</th>
                    </tr>
                  </thead>
                  <tbody>{imported.map(drawRow)}</tbody>
                </table>
              </div>
            </div>
          </div>
        }
        onClose={onClose}
      />
      {dlg}
    </>
  );
}
