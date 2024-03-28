import React, { useMemo, useEffect } from "react";
import { CustomDlg } from "../../../common/CustomDlg";
import { Button, ProgressBar } from "@blueprintjs/core";
import { TLoadToStructureElement, TLoadToStructure } from "../../../../store/main/types";
import { useDispatch, useSelector } from "react-redux";
import { ApplicationState } from "../../../../store";
import {
  changeProjectAction,
  getAndMapPipeAnalysisToSending,
  changeLoadsToStructureAction,
} from "../../../../store/main/actions";
import {
  exportToCSV,
  fixNumberToStr,
  getCurrentProject,
  getCurrentUI,
  saveToFile,
} from "../../../3d-models/utils";

type Props = {
  onClose: () => any;
};

export function LoadsToStructure(props: Props) {
  const { onClose } = props;

  const dispatch = useDispatch();

  const scene = useSelector((state: ApplicationState) => state.main.scene);
  const project = useSelector((state: ApplicationState) => getCurrentProject(state));
  const ui = useSelector((state: ApplicationState) => getCurrentUI(state));

  const progress = useMemo(() => ui?.requests?.loadsToStructure, [ui]);

  const rows = useMemo(() => project?.loadsToStructure?.last ?? [], [project]);

  useEffect(() => {
    if (!project) return;
    getAndMapPipeAnalysisToSending(dispatch, project, scene);
  }, []);

  function handleChangeData(loadsToStructure: TLoadToStructure) {
    if (!project) return;
    dispatch(changeLoadsToStructureAction(project.name, loadsToStructure));
  }

  function getRow(row: TLoadToStructureElement) {
    return (
      <tr key={row.id}>
        <td>{row.line}</td>
        <td>{row.pipe}</td>
        <td>{row.restraint}</td>
        <td>{row.type}</td>
        <td>{row.emptyFy}</td>
        <td>{row.testFy}</td>
        <td>{row.operatingFy}</td>
        <td>{row.taFy}</td>
        <td>{row.tfFx}</td>
        <td>{row.tfFz}</td>
        <td>{row.wxFx}</td>
        <td>{row.wxFy}</td>
        <td>{row.wxFz}</td>
        <td>{row.wzFx}</td>
        <td>{row.wzFy}</td>
        <td>{row.wzFz}</td>
        <td>{row.psvSurgeFx}</td>
        <td>{row.psvSurgeFy}</td>
        <td>{row.psvSurgeFz}</td>
        <td>{row.iceSnow}</td>
        <td>{row.revision}</td>
        <td>{row.status}</td>
      </tr>
    );
  }

  function handleSend() {
    const coef = 1 / 9.81;
    const toSave: TLoadToStructureElement[] = rows
      .filter((r) => r.status !== "Deleted")
      .map((r) => ({ ...r, status: "Issued" }));

    saveToFile(
      toSave.map((r) => ({
        ...r,
        emptyFy: (r.emptyFy ?? 0) * coef,
        testFy: (r.testFy ?? 0) * coef,
        operatingFy: (r.operatingFy ?? 0) * coef,
        taFy: (r.taFy ?? 0) * coef,
        tfFx: (r.tfFx ?? 0) * coef,
        tfFz: (r.tfFz ?? 0) * coef,
        wxFx: (r.wxFx ?? 0) * coef,
        wxFy: (r.wxFy ?? 0) * coef,
        wxFz: (r.wxFz ?? 0) * coef,
        wzFx: (r.wzFx ?? 0) * coef,
        wzFy: (r.wzFy ?? 0) * coef,
        wzFz: (r.wzFz ?? 0) * coef,
        psvSurgeFx: (r.psvSurgeFx ?? 0) * coef,
        psvSurgeFy: (r.psvSurgeFy ?? 0) * coef,
        psvSurgeFz: (r.psvSurgeFz ?? 0) * coef,
        iceSnow: (r.iceSnow ?? 0) * coef,
      })),
      "Loads To Structure",
      "lts"
    );

    handleChangeData({ sent: [...toSave], last: [...toSave] });
  }

  function handleExport() {
    exportToCSV(
      rows.map((row) => {
        return {
          id: row.id,
          "Line No.": row.line,
          "Pipe No.": row.pipe,
          "Restraint No.": row.restraint,
          Type: row.type,
          "Empty Fy(N)": fixNumberToStr(row.emptyFy ? row.emptyFy : 0),
          "Test Fy(N)": fixNumberToStr(row.testFy ? row.testFy : 0),
          "Operating Fy(N)": fixNumberToStr(row.operatingFy ? row.operatingFy : 0),
          "TA Fy(N)": fixNumberToStr(row.taFy ? row.taFy : 0),
          "TF Fx(N)": fixNumberToStr(row.tfFx ? row.tfFx : 0),
          "TF Fz(N)": fixNumberToStr(row.tfFz ? row.tfFz : 0),
          "Wind X Fx(N)": fixNumberToStr(row.wxFx ? row.wxFx : 0),
          "Wind X Fy(N)": fixNumberToStr(row.wxFy ? row.wxFy : 0),
          "Wind X Fz(N)": fixNumberToStr(row.wxFz ? row.wxFz : 0),
          "Wind Z Fx(N)": fixNumberToStr(row.wzFx ? row.wzFx : 0),
          "Wind Z Fy(N)": fixNumberToStr(row.wzFy ? row.wzFy : 0),
          "Wind Z Fz(N)": fixNumberToStr(row.wzFz ? row.wzFz : 0),
          "PSV / Surge Fx(N)": fixNumberToStr(row.psvSurgeFx ? row.psvSurgeFx : 0),
          "PSV / Surge Fy(N)": fixNumberToStr(row.psvSurgeFy ? row.psvSurgeFy : 0),
          "PSV / Surge Fz(N)": fixNumberToStr(row.psvSurgeFz ? row.psvSurgeFz : 0),
          "Ice / Snow": fixNumberToStr(row.iceSnow ? row.iceSnow : 0),
          "Rev. No.": row.revision,
          Status: row.status,
        };
      }),
      "Loads to Structure"
    );
  }

  return (
    <CustomDlg
      title={"Loads to Structure"}
      isMinimize={true}
      body={
        <div className="d-flex f-grow f-column bg-dark">
          <div className="label-light bg-dark" style={{ paddingRight: 10 }}>
            <Button
              small
              icon="export"
              text="Export to CSV"
              intent="success"
              onClick={handleExport}
            />
            <Button small text={"Send To Structure"} intent={"danger"} onClick={handleSend} />
          </div>
          <div className={"hr"} />
          {progress ? (
            <>
              <ProgressBar />
              <div className={"hr"} />
            </>
          ) : null}
          <div className="p-5">
            <div className="table-container">
              <table className="table bg-gray">
                <thead>
                  <tr>
                    <th>Line No.</th>
                    <th>Pipe No.</th>
                    <th>Restraint No.</th>
                    <th>Type</th>
                    <th>Empty Fy(N)</th>
                    <th>Test Fy(N)</th>
                    <th>Operating Fy(N)</th>
                    <th>TA Fy(N)</th>
                    <th>TF Fx(N)</th>
                    <th>TF Fz(N)</th>
                    <th>Wind X Fx(N)</th>
                    <th>Wind X Fy(N)</th>
                    <th>Wind X Fz(N)</th>
                    <th>Wind Z Fx(N)</th>
                    <th>Wind Z Fy(N)</th>
                    <th>Wind Z Fz(N)</th>
                    <th>PSV / Surge Fx(N)</th>
                    <th>PSV / Surge Fy(N)</th>
                    <th>PSV / Surge Fz(N)</th>
                    <th>Ice / Snow</th>
                    <th>Rev. No.</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>{rows.map((row) => getRow(row))}</tbody>
              </table>
            </div>
          </div>
        </div>
      }
      onClose={onClose}
    />
  );
}
