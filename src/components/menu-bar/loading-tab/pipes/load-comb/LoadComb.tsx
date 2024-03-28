import React, { useMemo, useState } from "react";
import { Button, FormGroup } from "@blueprintjs/core";
import { useDispatch, useSelector } from "react-redux";
import { ApplicationState } from "../../../../../store";
import { CheckBoxCell } from "../../../../common/CheckBoxCell";
import { NumericCell } from "../../../../common/NumericCell";
import { SelectorCell } from "../../../../common/SelectorCell";
import { SimpleSelector } from "../../../../common/SimpleSelector";
import {
  exportToCSV,
  getNextId,
  importFromCSV,
  getUnicuesArray,
  getCurrentProject,
  strFilter,
  fixNumberToStr,
  checkImportedNumber,
} from "../../../../3d-models/utils";
import { Paginator } from "../../../../common/Paginator";
import { CustomDlg } from "../../../../common/CustomDlg";
import { changeProjectAction } from "../../../../../store/main/actions";
import { TPipeLoadCombination } from "../../../../../store/main/pipeTypes";
import { pipeLoadCombinations } from "../../../../../store/data/constants";
import { GeneralCheckBoxCell } from "../../../../common/GeneralCheckBoxCell";

type Props = { onClose: () => any };

export function LoadCombPP({ onClose }: Props) {
  const [selectedRows, setSelectedRows] = useState<TPipeLoadCombination[]>([]);

  const project = useSelector((state: ApplicationState) => getCurrentProject(state));

  const dispatch = useDispatch();

  const data = useMemo(() => {
    return project?.pipeLoadings?.loadCombinations;
  }, [project]);

  const combinations = useMemo(() => {
    return data?.loads ?? [];
  }, [data]);

  const loadCases = useMemo(() => {
    return getUnicuesArray(combinations.map((c) => c.loadCase));
  }, [combinations]);

  const conditions = useMemo(() => {
    return getUnicuesArray(combinations.map((c) => c.condition));
  }, [combinations]);

  function handleChangeData(LC_lib: "CUSTOM" | "DEFAULT", loads: TPipeLoadCombination[]) {
    if (!project) return;
    dispatch(
      changeProjectAction({
        ...project,
        pipeLoadings: {
          ...project.pipeLoadings!,
          loadCombinations: { LC_lib, loads },
        },
      })
    );
  }

  function handleAddRow() {
    const id = getNextId(combinations);
    let newCombinations = [...combinations];
    if (data?.LC_lib === "DEFAULT") {
      newCombinations = [
        ...newCombinations,
        { id, selected: false, isEmpty: true },
        { id: id + 1, selected: false, isEmpty: false },
      ];
    } else {
      newCombinations.push({
        id: id,
        selected: false,
        isEmpty: false,
        LC_No: combinations.length
          ? combinations.reduce((max, item) => Math.max(max, item.LC_No ?? 0), 0) + 1
          : 100,
      });
    }
    handleChangeData("CUSTOM", newCombinations);
  }

  function handleDeleteRows() {
    handleChangeData(
      "CUSTOM",
      combinations.filter((lc) => !lc.selected)
    );
  }

  function handleSelect(item: TPipeLoadCombination, selected: boolean) {
    if (!data) return;
    handleChangeData(
      data.LC_lib,
      combinations.map((lc) => (lc.id === item.id ? { ...item, selected } : lc))
    );
  }

  function handleChangeRow(item: TPipeLoadCombination, field: string, value: any) {
    if (field === "LC_No" && combinations.some((c) => c.LC_No === value)) return;
    let changed = { ...item, [field]: value };
    switch (field) {
      case "empty":
        changed = { ...changed, emptyPlusFluid: undefined, emptyPlusWater: undefined };
        break;
      case "emptyPlusFluid":
        changed = { ...changed, empty: undefined, emptyPlusWater: undefined };
        break;
      case "emptyPlusWater":
        changed = { ...changed, emptyPlusFluid: undefined, empty: undefined };
        break;
      case "WXp":
        changed = { ...changed, WXm: undefined };
        break;
      case "WXm":
        changed = { ...changed, WXp: undefined };
        break;
      case "WZp":
        changed = { ...changed, WZm: undefined };
        break;
      case "WZm":
        changed = { ...changed, WZp: undefined };
        break;
      case "SXp":
        changed = { ...changed, SXm: undefined };
        break;
      case "SXm":
        changed = { ...changed, SXp: undefined };
        break;
      case "SZp":
        changed = { ...changed, SZm: undefined };
        break;
      case "SZm":
        changed = { ...changed, SZp: undefined };
        break;
      case "T1Hot":
        changed = {
          ...changed,
          T1Cold: undefined,
          T2Hot: undefined,
          T2Cold: undefined,
          T3Hot: undefined,
          T3Cold: undefined,
        };
        break;
      case "T1Cold":
        changed = {
          ...changed,
          T1Hot: undefined,
          T2Hot: undefined,
          T2Cold: undefined,
          T3Hot: undefined,
          T3Cold: undefined,
        };
        break;
      case "T2Hot":
        changed = {
          ...changed,
          T1Hot: undefined,
          T1Cold: undefined,
          T2Cold: undefined,
          T3Hot: undefined,
          T3Cold: undefined,
        };
        break;
      case "T2Cold":
        changed = {
          ...changed,
          T1Hot: undefined,
          T1Cold: undefined,
          T2Hot: undefined,
          T3Hot: undefined,
          T3Cold: undefined,
        };
        break;
      case "T3Hot":
        changed = {
          ...changed,
          T1Hot: undefined,
          T1Cold: undefined,
          T2Hot: undefined,
          T2Cold: undefined,
          T3Cold: undefined,
        };
        break;
      case "T3Cold":
        changed = {
          ...changed,
          T1Hot: undefined,
          T1Cold: undefined,
          T2Hot: undefined,
          T2Cold: undefined,
          T3Hot: undefined,
        };
        break;
      case "P1":
        changed = { ...changed, HP: undefined };
        break;
      case "HP":
        changed = { ...changed, P1: undefined };
        break;
    }
    handleChangeData(
      "CUSTOM",
      combinations.map((lc) => (lc.id === item.id ? changed : lc))
    );
  }

  function getRow(item: TPipeLoadCombination) {
    return !item.isEmpty ? (
      <tr key={item.id}>
        <CheckBoxCell value={item.selected} onChange={(value) => handleSelect(item, value)} />
        <NumericCell
          value={item.LC_No}
          className={"w-100"}
          onChange={(value) => handleChangeRow(item, "LC_No", value)}
        />
        <SelectorCell<string>
          items={loadCases}
          selected={item.loadCase}
          itemKey={(item) => item}
          itemLabel={(item) => item}
          onSelect={(value) => handleChangeRow(item, "loadCase", value)}
          onCreate={(value) => value}
          filter={strFilter}
        />
        <SelectorCell<string>
          items={conditions}
          selected={item.condition}
          itemKey={(item) => item}
          itemLabel={(item) => item}
          onSelect={(value) => handleChangeRow(item, "contdition", value)}
          onCreate={(value) => value}
          filter={strFilter}
        />
        <SelectorCell<string>
          items={["No", "D1"]}
          selected={item.dApplied}
          itemKey={(item) => item}
          itemLabel={(item) => item}
          onSelect={(value) => handleChangeRow(item, "dApplied", value)}
        />
        <NumericCell
          isDecimal={true}
          value={item.empty}
          className={"w-50"}
          onChange={(value) => handleChangeRow(item, "empty", value)}
        />
        <NumericCell
          isDecimal={true}
          value={item.emptyPlusFluid}
          className={"w-50"}
          onChange={(value) => handleChangeRow(item, "emptyPlusFluid", value)}
        />
        <NumericCell
          isDecimal={true}
          value={item.emptyPlusWater}
          className={"w-50"}
          onChange={(value) => handleChangeRow(item, "emptyPlusWater", value)}
        />
        <NumericCell
          isDecimal={true}
          value={item.WXp}
          className={"w-50"}
          onChange={(value) => handleChangeRow(item, "WXp", value)}
        />
        <NumericCell
          isDecimal={true}
          value={item.WXm}
          className={"w-50"}
          onChange={(value) => handleChangeRow(item, "WXm", value)}
        />
        <NumericCell
          isDecimal={true}
          value={item.WZp}
          className={"w-50"}
          onChange={(value) => handleChangeRow(item, "WZp", value)}
        />
        <NumericCell
          isDecimal={true}
          value={item.WZm}
          className={"w-50"}
          onChange={(value) => handleChangeRow(item, "WZm", value)}
        />
        <NumericCell
          isDecimal={true}
          value={item.SXp}
          className={"w-50"}
          onChange={(value) => handleChangeRow(item, "SXp", value)}
        />
        <NumericCell
          isDecimal={true}
          value={item.SXm}
          className={"w-50"}
          onChange={(value) => handleChangeRow(item, "SXm", value)}
        />
        <NumericCell
          isDecimal={true}
          value={item.SZp}
          className={"w-50"}
          onChange={(value) => handleChangeRow(item, "SZp", value)}
        />
        <NumericCell
          isDecimal={true}
          value={item.SZm}
          className={"w-50"}
          onChange={(value) => handleChangeRow(item, "SZm", value)}
        />
        <NumericCell
          isDecimal={true}
          value={item.slug}
          className={"w-50"}
          onChange={(value) => handleChangeRow(item, "slug", value)}
        />
        <NumericCell
          isDecimal={true}
          value={item.T1Hot}
          className={"w-50"}
          onChange={(value) => handleChangeRow(item, "T1Hot", value)}
        />
        <NumericCell
          isDecimal={true}
          value={item.T1Cold}
          className={"w-50"}
          onChange={(value) => handleChangeRow(item, "T1Cold", value)}
        />
        <NumericCell
          isDecimal={true}
          value={item.T2Hot}
          className={"w-50"}
          onChange={(value) => handleChangeRow(item, "T2Hot", value)}
        />
        <NumericCell
          isDecimal={true}
          value={item.T2Cold}
          className={"w-50"}
          onChange={(value) => handleChangeRow(item, "T2Cold", value)}
        />
        <NumericCell
          isDecimal={true}
          value={item.T3Hot}
          className={"w-50"}
          onChange={(value) => handleChangeRow(item, "T3Hot", value)}
        />
        <NumericCell
          isDecimal={true}
          value={item.T3Cold}
          className={"w-50"}
          onChange={(value) => handleChangeRow(item, "T3Cold", value)}
        />
        <NumericCell
          isDecimal={true}
          value={item.P1}
          className={"w-50"}
          onChange={(value) => handleChangeRow(item, "P1", value)}
        />
        <NumericCell
          isDecimal={true}
          value={item.HP}
          className={"w-50"}
          onChange={(value) => handleChangeRow(item, "HP", value)}
        />
        <NumericCell
          value={item.N}
          className={"w-50"}
          onChange={(value) => handleChangeRow(item, "N", value)}
        />
      </tr>
    ) : (
      <tr>
        <CheckBoxCell value={item.selected} onChange={(value) => handleSelect(item, value)} />
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
        <td></td>
        <td></td>
      </tr>
    );
  }

  function handleChangeLC_Lib(LC_lib: "CUSTOM" | "DEFAULT") {
    if (data?.LC_lib !== LC_lib) {
      if (LC_lib === "DEFAULT") {
        handleChangeData(LC_lib, pipeLoadCombinations);
      } else {
        handleChangeData(LC_lib, []);
      }
    }
  }

  function handleExportToCSV() {
    exportToCSV(
      combinations
        .filter((c) => !c.isEmpty)
        .map((c) => ({
          id: c.id,
          "No.": c.LC_No,
          "Load Case": c.loadCase ?? "",
          Condition: c.condition ?? "",
          "D Applied": c.dApplied ?? "No",
          Empty: fixNumberToStr(c.empty),
          "Empty + Fluid": fixNumberToStr(c.emptyPlusFluid),
          "Empty + Water": fixNumberToStr(c.emptyPlusWater),
          "WX+": fixNumberToStr(c.WXp),
          "WX-": fixNumberToStr(c.WXm),
          "WZ+": fixNumberToStr(c.WZp),
          "WZ-": fixNumberToStr(c.WZm),
          "SX+": fixNumberToStr(c.SXp),
          "SX-": fixNumberToStr(c.SXm),
          "SZ+": fixNumberToStr(c.SZp),
          "SZ-": fixNumberToStr(c.SZm),
          Slug: fixNumberToStr(c.slug),
          "T1 Hot": fixNumberToStr(c.T1Hot),
          "T1 Cold": fixNumberToStr(c.T1Cold),
          "T2 Hot": fixNumberToStr(c.T2Hot),
          "T2 Cold": fixNumberToStr(c.T2Cold),
          "T3 Hot": fixNumberToStr(c.T3Hot),
          "T3 Cold": fixNumberToStr(c.T3Cold),
          P1: fixNumberToStr(c.P1),
          HP: fixNumberToStr(c.HP),
          "Disp. Cycles N": fixNumberToStr(c.N),
        })),
      "Load Combinations"
    );
  }

  function handleImportFromCSVOrExcel() {
    importFromCSV((data) => {
      if (!Array.isArray(data)) return;
      const newLCs: TPipeLoadCombination[] = [];
      for (const item of data) {
        const newLC: TPipeLoadCombination = {
          id: newLCs.length,
          selected: false,
          isEmpty: false,
          LC_No: checkImportedNumber(item["No."]),
          loadCase: item["Load Case"],
          condition: item.Condition,
          dApplied: ["No", "D1"].includes(item["D Applied"]) ? item["D Applied"] : "No",
          empty: checkImportedNumber(item["Empty"]),
          emptyPlusFluid: checkImportedNumber(item["Empty + Fluid"]),
          emptyPlusWater: checkImportedNumber(item["Empty + Water"]),
          WXp: checkImportedNumber(item["WX+"]),
          WXm: checkImportedNumber(item["WX-"]),
          WZp: checkImportedNumber(item["WZ+"]),
          WZm: checkImportedNumber(item["WZ-"]),
          SXp: checkImportedNumber(item["SX+"]),
          SXm: checkImportedNumber(item["SX-"]),
          SZp: checkImportedNumber(item["SZ+"]),
          SZm: checkImportedNumber(item["SZ-"]),
          slug: checkImportedNumber(item["Slug"]),
          T1Hot: checkImportedNumber(item["T1 Hot"]),
          T1Cold: checkImportedNumber(item["T1 Cold"]),
          T2Hot: checkImportedNumber(item["T2 Hot"]),
          T2Cold: checkImportedNumber(item["T2 Cold"]),
          T3Hot: checkImportedNumber(item["T3 Hot"]),
          T3Cold: checkImportedNumber(item["T3 Cold"]),
          P1: checkImportedNumber(item["P1"]),
          HP: checkImportedNumber(item["HP"]),
          N: checkImportedNumber(item["Disp. Cycles N"]),
        };
        newLCs.push(newLC);
      }
      handleChangeData("CUSTOM", newLCs);
    });
  }

  function handleSelectGroup(selected: TPipeLoadCombination[]) {
    if (!data) return;
    handleChangeData(
      data.LC_lib,
      combinations.map((c) => {
        const sc = selected.find((sc) => sc.id === c.id);
        return sc ? { ...c, selected: sc.selected } : c;
      })
    );
  }

  return (
    <CustomDlg
      title={"Load Combination"}
      isMinimize={true}
      body={
        <div className={"d-flex f-column f-grow"}>
          <div className="label-light d-flex bg-dark">
            <Button small icon="trash" text="Delete" intent="warning" onClick={handleDeleteRows} />
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
            <Button small icon="plus" text="Add Row" intent="primary" onClick={handleAddRow} />
            <FormGroup className="no-m w-200">
              <SimpleSelector<"CUSTOM" | "DEFAULT">
                items={["CUSTOM", "DEFAULT"]}
                selected={data?.LC_lib}
                itemLabel={(item) => item}
                onSelect={(LC_lib) => LC_lib && handleChangeLC_Lib(LC_lib)}
                className={"fill-select"}
              />
            </FormGroup>
          </div>
          <div className="hr" />
          <div className={"bg-dark p-5"}>
            <div className={"table-container"}>
              <table className="table bg-gray">
                <thead>
                  <tr>
                    <GeneralCheckBoxCell
                      data={selectedRows}
                      onChange={(res) => handleSelectGroup(res)}
                    />
                    <th>No.</th>
                    <th>Load Case</th>
                    <th>Condition</th>
                    <th>D Applied</th>
                    <th>Empty</th>
                    <th>Empty + Fluid</th>
                    <th>Empty + Water</th>
                    <th>WX+</th>
                    <th>WX-</th>
                    <th>WZ+</th>
                    <th>WZ-</th>
                    <th>SX+</th>
                    <th>SX-</th>
                    <th>SZ+</th>
                    <th>SZ-</th>
                    <th>Slug</th>
                    <th>T1 Hot</th>
                    <th>T1 Cold</th>
                    <th>T2 Hot</th>
                    <th>T2 Cold</th>
                    <th>T3 Hot</th>
                    <th>T3 Cold</th>
                    <th>P1</th>
                    <th>HP</th>
                    <th>Disp. Cycles N</th>
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
