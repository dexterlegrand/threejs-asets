import React, { useMemo, useState } from "react";
import { Button } from "@blueprintjs/core";
import { useDispatch, useSelector } from "react-redux";
import { ApplicationState } from "../../../../../store";
import { CheckBoxCell } from "../../../../common/CheckBoxCell";
import { exportToCSV, getCurrentProject, importFromCSV } from "../../../../3d-models/utils";
import { Paginator } from "../../../../common/Paginator";
import { CustomDlg } from "../../../../common/CustomDlg";
import { changeProjectAction } from "../../../../../store/main/actions";
import { TPipeLoadCombination } from "../../../../../store/main/pipeTypes";
import { GeneralCheckBoxCell } from "../../../../common/GeneralCheckBoxCell";

type Props = { onClose: () => any };

export function LoadCombToStructurePP({ onClose }: Props) {
  const [selectedRows, setSelectedRows] = useState<TPipeLoadCombination[]>([]);

  const project = useSelector((state: ApplicationState) => getCurrentProject(state));

  const dispatch = useDispatch();

  const data = useMemo(() => {
    return project?.pipeLoadings?.loadCombinations;
  }, [project]);

  const combinations = useMemo(() => {
    return data?.loads ?? [];
  }, [data]);

  function handleChangeData(loads: TPipeLoadCombination[]) {
    if (!project) return;
    dispatch(
      changeProjectAction({
        ...project,
        pipeLoadings: {
          ...project.pipeLoadings!,
          loadCombinations: { ...project.pipeLoadings!.loadCombinations, loads },
        },
      })
    );
  }

  function handleChangeRow(item: TPipeLoadCombination, field: string, value: boolean) {
    handleChangeData(
      combinations.map((lc) => (lc.id === item.id ? { ...item, [field]: value } : lc))
    );
  }

  function getRow(item: TPipeLoadCombination) {
    return !item.isEmpty ? (
      <tr key={item.id}>
        <td>{item.LC_No}</td>
        <td>{item.loadCase}</td>
        <td>{item.condition}</td>
        <CheckBoxCell
          key={`${item.id}-isEmpties`}
          value={item.isEmpties}
          onChange={(value) => handleChangeRow(item, "isEmpties", value)}
        />
        <CheckBoxCell
          key={`${item.id}-isTests`}
          value={item.isTests}
          onChange={(value) => handleChangeRow(item, "isTests", value)}
        />
        <CheckBoxCell
          key={`${item.id}-isOperatings`}
          value={item.isOperatings}
          onChange={(value) => handleChangeRow(item, "isOperatings", value)}
        />
        <CheckBoxCell
          key={`${item.id}-isThermals`}
          value={item.isThermals}
          onChange={(value) => handleChangeRow(item, "isThermals", value)}
        />
        <CheckBoxCell
          key={`${item.id}-isWX`}
          value={item.isWX}
          onChange={(value) => handleChangeRow(item, "isWX", value)}
        />
        <CheckBoxCell
          key={`${item.id}-isWZ`}
          value={item.isWZ}
          onChange={(value) => handleChangeRow(item, "isWZ", value)}
        />
        <CheckBoxCell
          key={`${item.id}-isPSV`}
          value={item.isPSV}
          onChange={(value) => handleChangeRow(item, "isPSV", value)}
        />
        <CheckBoxCell
          key={`${item.id}-isIce`}
          value={item.isIce}
          onChange={(value) => handleChangeRow(item, "isIce", value)}
        />
      </tr>
    ) : (
      <tr>
        <td></td>
        <td></td>
        <td></td>
        <td></td>
        <td></td>
        <td></td>
        <td></td>
        <td></td>
        <td></td>
        <td></td>
        <td></td>
      </tr>
    );
  }

  function handleExportToCSV() {
    exportToCSV(
      combinations
        .filter((c) => !c.isEmpty)
        .map((c) => ({
          "No.": c.LC_No ?? "",
          "Load Case": c.loadCase ?? "",
          Condition: c.condition ?? "",
          Empty: c.isEmpties ? "X" : "",
          Test: c.isTests ? "X" : "",
          Operating: c.isOperatings ? "X" : "",
          Thermal: c.isThermals ? "X" : "",
          WX: c.isWX ? "X" : "",
          WZ: c.isWZ ? "X" : "",
          "PSV/SURGE": c.isPSV ? "X" : "",
          "ICE/SNOW": c.isIce ? "X" : "",
        })),
      "Load Combinations To Structure"
    );
  }

  function handleImportFromCSVOrExcel() {
    importFromCSV((data) => {
      if (!Array.isArray(data)) return;
      let changedC = [...combinations];
      for (const el of data) {
        let changed = combinations.find((c) => c.LC_No === el["No."]);
        if (!changed) continue;
        changed = {
          ...changed,
          isEmpties: el.Empty === "X",
          isTests: el.Test === "X",
          isOperatings: el.Operating === "X",
          isThermals: el.Thermal === "X",
          isWX: el.WX === "X",
          isWZ: el.WZ === "X",
          isPSV: el["PSV/SURGE"] === "X",
          isIce: el["ICE/SNOW"] === "X",
        };
        changedC = changedC.map((c) => (c.id === changed!.id ? changed! : c));
      }
      handleChangeData(changedC);
    });
  }

  function handleSelectGroup(selected: TPipeLoadCombination[]) {
    handleChangeData(
      combinations.map((c) => {
        const sc = selected.find((sc) => sc.id === c.id);
        if (!sc) return c;
        return {
          ...c,
          isEmpties: sc.isEmpties,
          isTests: sc.isTests,
          isOperatings: sc.isOperatings,
          isThermals: sc.isThermals,
          isWX: sc.isWX,
          isWZ: sc.isWZ,
          isPSV: sc.isPSV,
          isIce: sc.isIce,
        };
      })
    );
  }

  return (
    <CustomDlg
      title={"Load Transfer To Structure"}
      isMinimize={true}
      body={
        <div className={"d-flex f-column f-grow"}>
          <div className="label-light d-flex bg-dark">
            <Button
              small
              icon="export"
              text="Export to CSV"
              intent="success"
              onClick={handleExportToCSV}
            />
            <Button
              small
              icon="import"
              text="Import from CSV"
              intent="success"
              onClick={handleImportFromCSVOrExcel}
            />
          </div>
          <div className="hr" />
          <div className={"bg-dark p-5"}>
            <div className={"table-container"}>
              <table className="table bg-gray">
                <thead>
                  <tr>
                    <th>No.</th>
                    <th>Load Case</th>
                    <th>Condition</th>
                    <GeneralCheckBoxCell
                      field={"isEmpties"}
                      title={"Empty"}
                      data={selectedRows}
                      onChange={handleSelectGroup}
                    />
                    <GeneralCheckBoxCell
                      field={"isTests"}
                      title={"Test"}
                      data={selectedRows}
                      onChange={handleSelectGroup}
                    />
                    <GeneralCheckBoxCell
                      field={"isOperatings"}
                      title={"Operating"}
                      data={selectedRows}
                      onChange={handleSelectGroup}
                    />
                    <GeneralCheckBoxCell
                      field={"isThermals"}
                      title={"Thermal"}
                      data={selectedRows}
                      onChange={handleSelectGroup}
                    />
                    <GeneralCheckBoxCell
                      field={"isWX"}
                      title={"WX"}
                      data={selectedRows}
                      onChange={handleSelectGroup}
                    />
                    <GeneralCheckBoxCell
                      field={"isWZ"}
                      title={"WZ"}
                      data={selectedRows}
                      onChange={handleSelectGroup}
                    />
                    <GeneralCheckBoxCell
                      field={"isPSV"}
                      title={"PSV/SURGE"}
                      data={selectedRows}
                      onChange={handleSelectGroup}
                    />
                    <GeneralCheckBoxCell
                      field={"isIce"}
                      title={"ICE/SNOW"}
                      data={selectedRows}
                      onChange={handleSelectGroup}
                    />
                  </tr>
                </thead>
                <tbody>{selectedRows.map((row) => getRow(row))}</tbody>
              </table>
            </div>
          </div>
          <div className="hr" />
          <Paginator items={combinations} onChange={setSelectedRows} />
        </div>
      }
      onClose={onClose}
    />
  );
}
