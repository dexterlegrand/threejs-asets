import React, { useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@blueprintjs/core";
import { useDispatch, useSelector } from "react-redux";
import { CheckBoxCell } from "../../../../common/CheckBoxCell";
import { SelectorCell } from "../../../../common/SelectorCell";
import { NumericCell } from "../../../../common/NumericCell";
import {
  exportToCSV,
  getTopOffset,
  importFromCSV,
  getElementByName,
  getNextId,
  convertToNamesArray,
  getCurrentUI,
  openFile,
  checkFileType,
  readFileAsync,
  strFilter,
} from "../../../../3d-models/utils";
import { InputCell } from "../../../../common/InputCell";
import { Paginator } from "../../../../common/Paginator";
import { CustomDlg } from "../../../../common/CustomDlg";
import { DirectLoadUI } from "../../../../../store/ui/types";
import { ApplicationState } from "../../../../../store";
import { getOFModels } from "../../../../3d-models/openFrame";
import { changeOFUIAction, addEventAction } from "../../../../../store/ui/actions";
import { DirectLoadsImportParamsOF } from "./DirectLoadsImportParams";
import { TLoadToStructureElement } from "../../../../../store/main/types";
import { GeneralCheckBoxCell } from "../../../../common/GeneralCheckBoxCell";

type Props = {
  onClose: () => any;
};

const initialLoad: DirectLoadUI = {
  id: 0,
  selected: false,
  lineNo: "",
  distance: 0,

  empty_Fy: 0,

  test_Fx: 0,
  test_Fy: 0,
  test_Fz: 0,
  test_Mx: 0,
  test_My: 0,
  test_Mz: 0,

  operating_Fx: 0,
  operating_Fy: 0,
  operating_Fz: 0,
  operating_Mx: 0,
  operating_My: 0,
  operating_Mz: 0,

  thermalAnchor_Fx: 0,
  thermalAnchor_Fy: 0,
  thermalAnchor_Fz: 0,
  thermalAnchor_Mx: 0,
  thermalAnchor_My: 0,
  thermalAnchor_Mz: 0,

  thermalFriction_Fx: 0,
  thermalFriction_Fy: 0,
  thermalFriction_Fz: 0,

  windLoadX_Fx: 0,
  windLoadX_Fy: 0,
  windLoadX_Fz: 0,

  windLoadZ_Fx: 0,
  windLoadZ_Fy: 0,
  windLoadZ_Fz: 0,

  surgeLoad_Fx: 0,
  surgeLoad_Fy: 0,
  surgeLoad_Fz: 0,

  snowLoad: 0,
};

export function DirectLoadsOF({ onClose }: Props) {
  const [paramsDialog, setParamsDialog] = useState<JSX.Element>();
  const [offsetTop, setOffsetTop] = useState<number>(0);
  const [selectedRows, setSelectedRows] = useState<DirectLoadUI[]>([]);

  const openFrameUI = useSelector((state: ApplicationState) => getCurrentUI(state)?.openFrameUI);

  const project = useSelector((state: ApplicationState) =>
    getElementByName(state.main.projects, state.main.currentProject)
  );

  const dispatch = useDispatch();

  const models = useMemo(() => {
    return getOFModels(project);
  }, [project]);

  const data = useMemo(() => {
    return openFrameUI?.loadingsUI.pipingLoadsUI.directLoads ?? [];
  }, [openFrameUI]);

  useEffect(() => {
    setOffsetTop(getTopOffset(tableRef.current, 1));
  }, [data]);

  function handleChangeData(directLoads: DirectLoadUI[]) {
    if (!openFrameUI) return;
    dispatch(
      changeOFUIAction({
        ...openFrameUI,
        loadingsUI: {
          ...openFrameUI.loadingsUI,
          pipingLoadsUI: {
            ...openFrameUI.loadingsUI.pipingLoadsUI,
            directLoads,
          },
        },
      })
    );
  }

  function handleAddRow() {
    handleChangeData([
      ...data,
      {
        ...initialLoad,
        id: getNextId(data),
      },
    ]);
  }

  function handleDeleteRows() {
    handleChangeData(data.filter((item) => !item.selected));
  }

  function handleChangeModel(item: DirectLoadUI, model?: string) {
    handleChangeData(
      data.map((dataItem) => {
        if (dataItem.id === item.id) {
          return {
            ...dataItem,
            model,
            element: undefined,
          };
        }
        return dataItem;
      })
    );
  }

  function handleChangeRow(item: DirectLoadUI, field: string, value: any) {
    handleChangeData(
      data.map((dataItem) => {
        if (dataItem.id === item.id) {
          return { ...dataItem, [field]: value };
        }
        return dataItem;
      })
    );
  }

  function getRow(item: DirectLoadUI) {
    const model = getElementByName(models, item.model);
    const beams = model ? [...model.beams, ...model.cantilevers] : [];
    return (
      <tr key={item.id}>
        <CheckBoxCell
          value={item.selected}
          onChange={(value) => handleChangeRow(item, "selected", value)}
        />
        <InputCell
          value={item.lineNo}
          onChange={(value) => handleChangeRow(item, "lineNo", value)}
        />
        <SelectorCell<string>
          items={convertToNamesArray(models)}
          selected={item.model}
          itemKey={(item) => item}
          itemLabel={(item) => item}
          onSelect={(value) => handleChangeModel(item, value)}
        />
        <SelectorCell<string>
          items={convertToNamesArray(beams)}
          selected={item.element}
          itemKey={(item) => item}
          itemLabel={(item) => item}
          onSelect={(value) => handleChangeRow(item, "element", value)}
          filter={strFilter}
        />
        <NumericCell
          isDecimal={true}
          min={0}
          value={item.distance}
          className={"w-100"}
          onChange={(value) => handleChangeRow(item, "distance", value)}
        />
        <NumericCell
          isDecimal={true}
          value={item.empty_Fy}
          className={"w-50"}
          onChange={(value) => handleChangeRow(item, "empty_Fy", value)}
        />
        <NumericCell
          isDecimal={true}
          value={item.test_Fx}
          className={"w-50"}
          onChange={(value) => handleChangeRow(item, "test_Fx", value)}
        />
        <NumericCell
          isDecimal={true}
          value={item.test_Fy}
          className={"w-50"}
          onChange={(value) => handleChangeRow(item, "test_Fy", value)}
        />
        <NumericCell
          isDecimal={true}
          value={item.test_Fz}
          className={"w-50"}
          onChange={(value) => handleChangeRow(item, "test_Fz", value)}
        />
        <NumericCell
          isDecimal={true}
          value={item.test_Mx}
          className={"w-50"}
          onChange={(value) => handleChangeRow(item, "test_Mx", value)}
        />
        <NumericCell
          isDecimal={true}
          value={item.test_My}
          className={"w-50"}
          onChange={(value) => handleChangeRow(item, "test_My", value)}
        />
        <NumericCell
          isDecimal={true}
          value={item.test_Mz}
          className={"w-50"}
          onChange={(value) => handleChangeRow(item, "test_Mz", value)}
        />
        <NumericCell
          isDecimal={true}
          value={item.operating_Fx}
          className={"w-50"}
          onChange={(value) => handleChangeRow(item, "operating_Fx", value)}
        />
        <NumericCell
          isDecimal={true}
          value={item.operating_Fy}
          className={"w-50"}
          onChange={(value) => handleChangeRow(item, "operating_Fy", value)}
        />
        <NumericCell
          isDecimal={true}
          value={item.operating_Fz}
          className={"w-50"}
          onChange={(value) => handleChangeRow(item, "operating_Fz", value)}
        />
        <NumericCell
          isDecimal={true}
          value={item.operating_Mx}
          className={"w-50"}
          onChange={(value) => handleChangeRow(item, "operating_Mx", value)}
        />
        <NumericCell
          isDecimal={true}
          value={item.operating_My}
          className={"w-50"}
          onChange={(value) => handleChangeRow(item, "operating_My", value)}
        />
        <NumericCell
          isDecimal={true}
          value={item.operating_Mz}
          className={"w-50"}
          onChange={(value) => handleChangeRow(item, "operating_Mz", value)}
        />
        <NumericCell
          isDecimal={true}
          value={item.thermalAnchor_Fx}
          className={"w-50"}
          onChange={(value) => handleChangeRow(item, "thermalAnchor_Fx", value)}
        />
        <NumericCell
          isDecimal={true}
          value={item.thermalAnchor_Fy}
          className={"w-50"}
          onChange={(value) => handleChangeRow(item, "thermalAnchor_Fy", value)}
        />
        <NumericCell
          isDecimal={true}
          value={item.thermalAnchor_Fz}
          className={"w-50"}
          onChange={(value) => handleChangeRow(item, "thermalAnchor_Fz", value)}
        />
        <NumericCell
          isDecimal={true}
          value={item.thermalAnchor_Mx}
          className={"w-50"}
          onChange={(value) => handleChangeRow(item, "thermalAnchor_Mx", value)}
        />
        <NumericCell
          isDecimal={true}
          value={item.thermalAnchor_My}
          className={"w-50"}
          onChange={(value) => handleChangeRow(item, "thermalAnchor_My", value)}
        />
        <NumericCell
          isDecimal={true}
          value={item.thermalAnchor_Mz}
          className={"w-50"}
          onChange={(value) => handleChangeRow(item, "thermalAnchor_Mz", value)}
        />
        <NumericCell
          isDecimal={true}
          value={item.thermalFriction_Fx}
          className={"w-50"}
          onChange={(value) => handleChangeRow(item, "thermalFriction_Fx", value)}
        />
        <NumericCell
          isDecimal={true}
          value={item.thermalFriction_Fy}
          className={"w-50"}
          onChange={(value) => handleChangeRow(item, "thermalFriction_Fy", value)}
        />
        <NumericCell
          isDecimal={true}
          value={item.thermalFriction_Fz}
          className={"w-50"}
          onChange={(value) => handleChangeRow(item, "thermalFriction_Fz", value)}
        />
        <NumericCell
          isDecimal={true}
          value={item.windLoadX_Fx}
          className={"w-50"}
          onChange={(value) => handleChangeRow(item, "windLoadX_Fx", value)}
        />
        <NumericCell
          isDecimal={true}
          value={item.windLoadX_Fy}
          className={"w-50"}
          onChange={(value) => handleChangeRow(item, "windLoadX_Fy", value)}
        />
        <NumericCell
          isDecimal={true}
          value={item.windLoadX_Fz}
          className={"w-50"}
          onChange={(value) => handleChangeRow(item, "windLoadX_Fz", value)}
        />
        <NumericCell
          isDecimal={true}
          value={item.windLoadZ_Fx}
          className={"w-50"}
          onChange={(value) => handleChangeRow(item, "windLoadZ_Fx", value)}
        />
        <NumericCell
          isDecimal={true}
          value={item.windLoadZ_Fy}
          className={"w-50"}
          onChange={(value) => handleChangeRow(item, "windLoadZ_Fy", value)}
        />
        <NumericCell
          isDecimal={true}
          value={item.windLoadZ_Fz}
          className={"w-50"}
          onChange={(value) => handleChangeRow(item, "windLoadZ_Fz", value)}
        />
        <NumericCell
          isDecimal={true}
          value={item.surgeLoad_Fx}
          className={"w-50"}
          onChange={(value) => handleChangeRow(item, "surgeLoad_Fx", value)}
        />
        <NumericCell
          isDecimal={true}
          value={item.surgeLoad_Fy}
          className={"w-50"}
          onChange={(value) => handleChangeRow(item, "surgeLoad_Fy", value)}
        />
        <NumericCell
          isDecimal={true}
          value={item.surgeLoad_Fz}
          className={"w-50"}
          onChange={(value) => handleChangeRow(item, "surgeLoad_Fz", value)}
        />
        <NumericCell
          isDecimal={true}
          value={item.snowLoad}
          className={"w-50"}
          onChange={(value) => handleChangeRow(item, "snowLoad", value)}
        />
      </tr>
    );
  }

  function handleExportToCSV() {
    exportToCSV(data, "OF Direct Piping Load");
  }

  function mapJSONFromExcel(data: any[], map: any) {
    let newLoads: DirectLoadUI[] = [];
    let index = getNextId(data);

    const convert = (
      row: any,
      param: any,
      fieldLoad: string,
      fieldRow: string,
      empty_Fy?: number,
      contentOnly: boolean = false
    ) => {
      switch (param.name) {
        case "FX":
          return {
            [`${fieldLoad}_Fx`]:
              param.coef * ((row[fieldRow] ?? 0) + (contentOnly ? empty_Fy ?? 0 : 0)),
          };
        case "FY":
          return {
            [`${fieldLoad}_Fy`]:
              param.coef * ((row[fieldRow] ?? 0) + (contentOnly ? empty_Fy ?? 0 : 0)),
          };
        case "FZ":
          return {
            [`${fieldLoad}_Fz`]:
              param.coef * ((row[fieldRow] ?? 0) + (contentOnly ? empty_Fy ?? 0 : 0)),
          };
        default:
          return undefined;
      }
    };

    for (let i = 2, len = data.length; i < len; ++i) {
      const row = data[i];
      const contentOnly = map.get("content_only");
      const convertX = map.get("FX");
      const convertY = map.get("FY");
      const convertZ = map.get("FZ");
      const empty_Fy = convertZ.name === "FY" ? convertZ.coef * (row["Dead Load"] ?? 0) : 0;
      newLoads = [
        ...newLoads,
        {
          id: index++,
          distance: 0,
          lineNo: row.__EMPTY_1,
          empty_Fy,

          ...convert(row, convertZ, "test", "Content test medium", empty_Fy, contentOnly),
          ...convert(row, convertZ, "operating", "Content", empty_Fy, contentOnly),

          ...convert(row, convertX, "thermalFriction", "Thermal Loads (Note 1)"),
          ...convert(row, convertY, "thermalFriction", "__EMPTY_2"),
          ...convert(row, convertZ, "thermalFriction", "__EMPTY_3"),

          ...convert(row, convertX, "windLoadX", "Wind Load +X- direction (Note 2)"),
          ...convert(row, convertY, "windLoadX", "__EMPTY_4"),
          ...convert(row, convertZ, "windLoadX", "__EMPTY_5"),

          ...convert(row, convertX, "windLoadZ", "Wind Load +Y- direction (Note 2)"),
          ...convert(row, convertY, "windLoadZ", "__EMPTY_6"),
          ...convert(row, convertZ, "windLoadZ", "__EMPTY_7"),

          ...convert(
            row,
            convertX,
            "surgeLoad",
            "Additional Forces (PSV Relief load, Pressure Surge)\\r\\n"
          ),
          ...convert(row, convertY, "surgeLoad", "__EMPTY_12"),
          ...convert(row, convertZ, "surgeLoad", "__EMPTY_13"),

          snowLoad: convertZ.name === "FY" ? convertZ.coef * (row["Snow / Ice Load"] ?? 0) : 0,
        } as DirectLoadUI,
      ];
    }
    handleChangeData([...data, ...newLoads]);
  }

  function mapJSONFromCSV(CSVData: any[]) {
    let index = getNextId(data);
    handleChangeData([...data, ...CSVData.map((item) => ({ ...item, id: index++ }))]);
  }

  function handleImportFromCSV() {
    setParamsDialog(
      <DirectLoadsImportParamsOF
        onConfirm={(map) => {
          importFromCSV((data, isCSV) =>
            isCSV ? mapJSONFromCSV(data) : mapJSONFromExcel(data, map)
          );
          setParamsDialog(undefined);
        }}
        onClose={() => setParamsDialog(undefined)}
      />
    );
  }

  function handleImport() {
    openFile([".lts"], async (files) => {
      const newRows: DirectLoadUI[] = [];
      for (const file of files) {
        const type = checkFileType(file.name);
        if (type !== "lts") continue;
        try {
          const data = await readFileAsync(file);
          // @ts-ignore
          const entries = JSON.parse(data);
          if (!Array.isArray(entries)) throw new Error("Not array");
          for (const entry of entries as TLoadToStructureElement[]) {
            const newRow: DirectLoadUI = {
              ...initialLoad,
              id: newRows.length,
              distance: 0,
              lineNo: entry.line,
              empty_Fy: entry.emptyFy ?? 0,
              test_Fy: entry.testFy ?? 0,
              operating_Fy: entry.operatingFy ?? 0,
              thermalAnchor_Fy: entry.taFy ?? 0,
              thermalFriction_Fx: entry.tfFx ?? 0,
              thermalFriction_Fz: entry.tfFz ?? 0,
              windLoadX_Fx: entry.wxFx ?? 0,
              windLoadX_Fy: entry.wxFy ?? 0,
              windLoadX_Fz: entry.wxFz ?? 0,
              windLoadZ_Fx: entry.wzFx ?? 0,
              windLoadZ_Fy: entry.wzFy ?? 0,
              windLoadZ_Fz: entry.wzFz ?? 0,
              surgeLoad_Fx: entry.psvSurgeFx ?? 0,
              surgeLoad_Fy: entry.psvSurgeFy ?? 0,
              surgeLoad_Fz: entry.psvSurgeFz ?? 0,
              snowLoad: entry.iceSnow ?? 0,
            };
            newRows.push(newRow);
          }
        } catch (e) {
          dispatch(
            addEventAction(`Direct Piping Load: Parse error of file "${file.name}"`, "danger")
          );
        }
      }
      let index = getNextId(data);
      handleChangeData([...data, ...newRows.map((r) => ({ ...r, id: index++ }))]);
    });
  }

  const tableRef = useRef<HTMLTableElement>(null);

  return (
    <>
      <CustomDlg
        title={"Direct Piping Load"}
        isMinimize={true}
        body={
          <div className="d-flex f-grow f-column">
            <div className="label-light bg-dark">
              <Button
                small
                icon="trash"
                text="Delete"
                intent="warning"
                onClick={handleDeleteRows}
              />
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
                onClick={handleImportFromCSV}
              />
              <Button small icon="plus" text="Add Row" intent="primary" onClick={handleAddRow} />
              <Button small text="Import AL Piping Load" intent="primary" onClick={handleImport} />
            </div>
            <div className="hr" />
            <div className={"d-flex f-grow  bg-dark p-5"}>
              <div className={"table-container"}>
                <table ref={tableRef} className="table bg-gray">
                  <thead>
                    <tr>
                      <GeneralCheckBoxCell
                        rowSpan={2}
                        data={selectedRows}
                        onChange={handleChangeData}
                      />
                      <th rowSpan={2}>Line No.</th>
                      <th rowSpan={2}>OF No.</th>
                      <th rowSpan={2}>Element No.</th>
                      <th rowSpan={2}>Dist. From Start Node (m)</th>
                      <th>Empty</th>
                      <th colSpan={6}>Test</th>
                      <th colSpan={6}>Operating</th>
                      <th colSpan={6}>Thermal Anchor</th>
                      <th colSpan={3}>Thermal Friction</th>
                      <th colSpan={3}>Wind Load +X</th>
                      <th colSpan={3}>Wind Load +Z</th>
                      <th colSpan={3}>PSV Release / Surge Load</th>
                      <th>Ice / Snow Load</th>
                    </tr>
                    <tr>
                      {/*Test*/}
                      <th style={{ top: offsetTop }}>Fy (kg)</th>
                      <th style={{ top: offsetTop }}>Fx (kg)</th>
                      <th style={{ top: offsetTop }}>Fy (kg)</th>
                      <th style={{ top: offsetTop }}>Fz (kg)</th>
                      <th style={{ top: offsetTop }}>Mx (kg.m)</th>
                      <th style={{ top: offsetTop }}>My (kg.m)</th>
                      <th style={{ top: offsetTop }}>Mz (kg.m)</th>
                      {/*Operating*/}
                      <th style={{ top: offsetTop }}>Fx (kg)</th>
                      <th style={{ top: offsetTop }}>Fy (kg)</th>
                      <th style={{ top: offsetTop }}>Fz (kg)</th>
                      <th style={{ top: offsetTop }}>Mx (kg.m)</th>
                      <th style={{ top: offsetTop }}>My (kg.m)</th>
                      <th style={{ top: offsetTop }}>Mz (kg.m)</th>
                      {/*Thermal Anchor*/}
                      <th style={{ top: offsetTop }}>Fx (kg)</th>
                      <th style={{ top: offsetTop }}>Fy (kg)</th>
                      <th style={{ top: offsetTop }}>Fz (kg)</th>
                      <th style={{ top: offsetTop }}>Mx (kg.m)</th>
                      <th style={{ top: offsetTop }}>My (kg.m)</th>
                      <th style={{ top: offsetTop }}>Mz (kg.m)</th>
                      {/*Thermal Friction*/}
                      <th style={{ top: offsetTop }}>Fx (kg)</th>
                      <th style={{ top: offsetTop }}>Fy (kg)</th>
                      <th style={{ top: offsetTop }}>Fz (kg)</th>
                      {/*Wind Load +X*/}
                      <th style={{ top: offsetTop }}>Fx (kg)</th>
                      <th style={{ top: offsetTop }}>Fy (kg)</th>
                      <th style={{ top: offsetTop }}>Fz (kg)</th>
                      {/*Wind Load +Z*/}
                      <th style={{ top: offsetTop }}>Fx (kg)</th>
                      <th style={{ top: offsetTop }}>Fy (kg)</th>
                      <th style={{ top: offsetTop }}>Fz (kg)</th>
                      {/*PSV Release / Surge Load*/}
                      <th style={{ top: offsetTop }}>Fx (kg)</th>
                      <th style={{ top: offsetTop }}>Fy (kg)</th>
                      <th style={{ top: offsetTop }}>Fz (kg)</th>
                      {/*Ice / Snow Load*/}
                      <th style={{ top: offsetTop }}>Fy (kg)</th>
                    </tr>
                  </thead>
                  <tbody>{selectedRows.map((item) => getRow(item))}</tbody>
                </table>
              </div>
            </div>
            <div className="hr" />
            <Paginator items={data} onChange={setSelectedRows} />
          </div>
        }
        onClose={onClose}
      />
      {paramsDialog}
    </>
  );
}
