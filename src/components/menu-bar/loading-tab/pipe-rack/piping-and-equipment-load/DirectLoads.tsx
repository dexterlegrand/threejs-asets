import React, { FunctionComponent, useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@blueprintjs/core";
import { useDispatch, useSelector } from "react-redux";
import {
  DirectLoad,
  PipeRack,
  PipeRackBeam,
  PipeRackCantilever,
  TLoadToStructureElement,
} from "../../../../../store/main/types";
import { ApplicationState } from "../../../../../store";
import { CheckBoxCell } from "../../../../common/CheckBoxCell";
import { SelectorCell } from "../../../../common/SelectorCell";
import { NumericCell } from "../../../../common/NumericCell";
import { changeLoadings, changeModel } from "../../../../../store/main/actions";
import {
  exportToCSV,
  getTopOffset,
  importFromCSV,
  openFile,
  checkFileType,
  getNextId,
  readFileAsync,
} from "../../../../3d-models/utils";
import { InputCell } from "../../../../common/InputCell";
import { DirectLoadsImportParams } from "./DirectLoadsImportParams";
import { Paginator } from "../../../../common/Paginator";
import { CustomDlg } from "../../../../common/CustomDlg";
import { addEventAction } from "../../../../../store/ui/actions";
import { GeneralCheckBoxCell } from "../../../../common/GeneralCheckBoxCell";
import { getAccessoryBeams } from "../../../../3d-models/pipe-rack/pipeRackUtils";

type Props = {
  onClose: () => any;
};

type RowData = {
  id: number;
  selected: boolean;
  pr?: PipeRack;
  element?: PipeRackBeam;
  directLoad: DirectLoad;
};

const DirectLoads: FunctionComponent<Props> = ({ onClose }) => {
  const [paramsDialog, setParamsDialog] = useState<JSX.Element>();
  const [offsetTop, setOffsetTop] = useState<number>(0);
  const [selectedRows, setSelectedRows] = useState<RowData[]>([]);

  const dispatch = useDispatch();

  const currentProject = useSelector((state: ApplicationState) => {
    return state.main.projects.find((project) => project.name === state.main.currentProject);
  });

  const models = useMemo(() => {
    return currentProject
      ? (currentProject.models.filter((model) => model.type === "Pipe Rack") as PipeRack[])
      : [];
  }, [currentProject]);

  const rows = useMemo(
    () =>
      (currentProject?.loadings.directLoads ?? []).map((load) => {
        const model = models.find((model) => model.name === load.model);
        return {
          id: load.id,
          pr: model,
          element: model?.beams.find((beam) => beam.name === load.element),
          directLoad: load,
        };
      }),
    [currentProject]
  );

  useEffect(() => {
    setOffsetTop(getTopOffset(tableRef.current, 1));
    models.forEach((model) => {
      let newBeams: PipeRackBeam[] = model.beams.map((item) => ({
        ...item,
        directLoadId: undefined,
        directLoad: undefined,
      }));
      rows
        .filter((vr) => vr.pr?.name === model.name && vr.element)
        .forEach((vr) => {
          newBeams = newBeams.map((item) =>
            item.name === vr.element?.name
              ? ({
                  ...vr.element,
                  directLoadId: vr.id,
                  directLoad: { ...vr.directLoad },
                } as PipeRackBeam)
              : item
          );
        });
      !equal(model.beams, newBeams) &&
        dispatch(changeModel({ ...model, beams: newBeams } as PipeRack));
    });
  }, [rows]);

  function equal(old: PipeRackBeam[], news: PipeRackBeam[]) {
    for (let i = 0; i < old.length; ++i) {
      if ((!old[i].directLoad && news[i].directLoad) || (old[i].directLoad && !news[i].directLoad))
        return false;
      if (old[i].directLoad && news[i].directLoad) {
        for (const key of Object.keys(old[i].directLoad!)) {
          // @ts-ignore
          if (old[i].directLoad[key] !== news[i].directLoad[key]) return false;
        }
      }
    }
    return true;
  }

  function handleAddRow() {
    if (!currentProject) return;
    const loadings = currentProject.loadings;
    const dLoads = loadings.directLoads ?? [];
    dispatch(
      changeLoadings({
        ...loadings,
        directLoads: [
          ...dLoads,
          {
            id: dLoads.reduce((max, item) => Math.max(max, item.id), 0) + 1,
            distance: 0,
          },
        ],
      })
    );
  }

  function handleDeleteRows() {
    if (currentProject) {
      const loadings = currentProject.loadings;
      dispatch(
        changeLoadings({
          ...loadings,
          directLoads: rows
            .filter((row) => !selectedRows.some((sr) => sr.id === row.id && sr.selected))
            .map((row) => ({ ...row.directLoad })),
        })
      );
    }
  }

  function handleChangePR(item: RowData, pr?: PipeRack) {
    if (currentProject) {
      const loadings = currentProject.loadings;
      dispatch(
        changeLoadings({
          ...loadings,
          directLoads: rows.map((row) =>
            row.id === item.id
              ? { ...row.directLoad, model: pr?.name, element: undefined }
              : { ...row.directLoad }
          ),
        })
      );
    }
  }

  function handleChangeElement(item: RowData, element?: PipeRackBeam | PipeRackCantilever) {
    if (currentProject) {
      const loadings = currentProject.loadings;
      dispatch(
        changeLoadings({
          ...loadings,
          directLoads: rows.map((row) =>
            row.id === item.id
              ? { ...row.directLoad, element: element?.name }
              : { ...row.directLoad }
          ),
        })
      );
    }
  }

  function handleChangeRow(item: RowData, field: string, value: any) {
    if (!currentProject) return;
    const loadings = currentProject.loadings;
    dispatch(
      changeLoadings({
        ...loadings,
        directLoads: rows.map((row) =>
          row.id === item.id ? { ...row.directLoad, [field]: value } : { ...row.directLoad }
        ),
      })
    );
  }

  function handleSelect(item: RowData, selected: boolean) {
    setSelectedRows(selectedRows.map((sr) => (sr.id === item.id ? { ...sr, selected } : sr)));
  }

  function getRow(item: RowData) {
    return (
      <tr key={item.id}>
        <CheckBoxCell value={item.selected} onChange={(value) => handleSelect(item, value)} />
        <InputCell
          value={item.directLoad.lineNo}
          onChange={(value) => handleChangeRow(item, "lineNo", value)}
        />
        <SelectorCell<PipeRack>
          items={models}
          selected={item.pr}
          itemKey={(item) => item.name}
          itemLabel={(item) => item.name}
          onSelect={(value) => handleChangePR(item, value)}
        />
        <SelectorCell<PipeRackBeam | PipeRackCantilever>
          items={
            item.pr
              ? [
                  ...item.pr.beams,
                  ...item.pr.cantilevers,
                  ...getAccessoryBeams(item.pr.accessories),
                ]
              : []
          }
          selected={item.element}
          itemKey={(item) => `${item.parent}-${item.id}-${item.name}`}
          itemLabel={(item) => item.name}
          itemSecondLabel={(item) => item.parent}
          onSelect={(value) => handleChangeElement(item, value)}
          filter={(query, item) => (query ? item.name.includes(query.toUpperCase()) : true)}
        />
        <NumericCell
          isDecimal={true}
          min={0}
          max={item.element?.startPos.distanceTo(item.element?.endPos)}
          value={item.directLoad.distance}
          className={"w-100"}
          onChange={(value) => handleChangeRow(item, "distance", value)}
        />
        <NumericCell
          isDecimal={true}
          value={item.directLoad.empty_Fy}
          className={"w-50"}
          onChange={(value) => handleChangeRow(item, "empty_Fy", value)}
        />
        <NumericCell
          isDecimal={true}
          value={item.directLoad.test_Fx}
          className={"w-50"}
          onChange={(value) => handleChangeRow(item, "test_Fx", value)}
        />
        <NumericCell
          isDecimal={true}
          value={item.directLoad.test_Fy}
          className={"w-50"}
          onChange={(value) => handleChangeRow(item, "test_Fy", value)}
        />
        <NumericCell
          isDecimal={true}
          value={item.directLoad.test_Fz}
          className={"w-50"}
          onChange={(value) => handleChangeRow(item, "test_Fz", value)}
        />
        <NumericCell
          isDecimal={true}
          value={item.directLoad.test_Mx}
          className={"w-50"}
          onChange={(value) => handleChangeRow(item, "test_Mx", value)}
        />
        <NumericCell
          isDecimal={true}
          value={item.directLoad.test_My}
          className={"w-50"}
          onChange={(value) => handleChangeRow(item, "test_My", value)}
        />
        <NumericCell
          isDecimal={true}
          value={item.directLoad.test_Mz}
          className={"w-50"}
          onChange={(value) => handleChangeRow(item, "test_Mz", value)}
        />
        <NumericCell
          isDecimal={true}
          value={item.directLoad.operating_Fx}
          className={"w-50"}
          onChange={(value) => handleChangeRow(item, "operating_Fx", value)}
        />
        <NumericCell
          isDecimal={true}
          value={item.directLoad.operating_Fy}
          className={"w-50"}
          onChange={(value) => handleChangeRow(item, "operating_Fy", value)}
        />
        <NumericCell
          isDecimal={true}
          value={item.directLoad.operating_Fz}
          className={"w-50"}
          onChange={(value) => handleChangeRow(item, "operating_Fz", value)}
        />
        <NumericCell
          isDecimal={true}
          value={item.directLoad.operating_Mx}
          className={"w-50"}
          onChange={(value) => handleChangeRow(item, "operating_Mx", value)}
        />
        <NumericCell
          isDecimal={true}
          value={item.directLoad.operating_My}
          className={"w-50"}
          onChange={(value) => handleChangeRow(item, "operating_My", value)}
        />
        <NumericCell
          isDecimal={true}
          value={item.directLoad.operating_Mz}
          className={"w-50"}
          onChange={(value) => handleChangeRow(item, "operating_Mz", value)}
        />
        <NumericCell
          isDecimal={true}
          value={item.directLoad.thermalAnchor_Fx}
          className={"w-50"}
          onChange={(value) => handleChangeRow(item, "thermalAnchor_Fx", value)}
        />
        <NumericCell
          isDecimal={true}
          value={item.directLoad.thermalAnchor_Fy}
          className={"w-50"}
          onChange={(value) => handleChangeRow(item, "thermalAnchor_Fy", value)}
        />
        <NumericCell
          isDecimal={true}
          value={item.directLoad.thermalAnchor_Fz}
          className={"w-50"}
          onChange={(value) => handleChangeRow(item, "thermalAnchor_Fz", value)}
        />
        <NumericCell
          isDecimal={true}
          value={item.directLoad.thermalAnchor_Mx}
          className={"w-50"}
          onChange={(value) => handleChangeRow(item, "thermalAnchor_Mx", value)}
        />
        <NumericCell
          isDecimal={true}
          value={item.directLoad.thermalAnchor_My}
          className={"w-50"}
          onChange={(value) => handleChangeRow(item, "thermalAnchor_My", value)}
        />
        <NumericCell
          isDecimal={true}
          value={item.directLoad.thermalAnchor_Mz}
          className={"w-50"}
          onChange={(value) => handleChangeRow(item, "thermalAnchor_Mz", value)}
        />
        <NumericCell
          isDecimal={true}
          value={item.directLoad.thermalFriction_Fx}
          className={"w-50"}
          onChange={(value) => handleChangeRow(item, "thermalFriction_Fx", value)}
        />
        <NumericCell
          isDecimal={true}
          value={item.directLoad.thermalFriction_Fy}
          className={"w-50"}
          onChange={(value) => handleChangeRow(item, "thermalFriction_Fy", value)}
        />
        <NumericCell
          isDecimal={true}
          value={item.directLoad.thermalFriction_Fz}
          className={"w-50"}
          onChange={(value) => handleChangeRow(item, "thermalFriction_Fz", value)}
        />
        <NumericCell
          isDecimal={true}
          value={item.directLoad.windLoadX_Fx}
          className={"w-50"}
          onChange={(value) => handleChangeRow(item, "windLoadX_Fx", value)}
        />
        <NumericCell
          isDecimal={true}
          value={item.directLoad.windLoadX_Fy}
          className={"w-50"}
          onChange={(value) => handleChangeRow(item, "windLoadX_Fy", value)}
        />
        <NumericCell
          isDecimal={true}
          value={item.directLoad.windLoadX_Fz}
          className={"w-50"}
          onChange={(value) => handleChangeRow(item, "windLoadX_Fz", value)}
        />
        <NumericCell
          isDecimal={true}
          value={item.directLoad.windLoadZ_Fx}
          className={"w-50"}
          onChange={(value) => handleChangeRow(item, "windLoadZ_Fx", value)}
        />
        <NumericCell
          isDecimal={true}
          value={item.directLoad.windLoadZ_Fy}
          className={"w-50"}
          onChange={(value) => handleChangeRow(item, "windLoadZ_Fy", value)}
        />
        <NumericCell
          isDecimal={true}
          value={item.directLoad.windLoadZ_Fz}
          className={"w-50"}
          onChange={(value) => handleChangeRow(item, "windLoadZ_Fz", value)}
        />
        <NumericCell
          isDecimal={true}
          value={item.directLoad.surgeLoad_Fx}
          className={"w-50"}
          onChange={(value) => handleChangeRow(item, "surgeLoad_Fx", value)}
        />
        <NumericCell
          isDecimal={true}
          value={item.directLoad.surgeLoad_Fy}
          className={"w-50"}
          onChange={(value) => handleChangeRow(item, "surgeLoad_Fy", value)}
        />
        <NumericCell
          isDecimal={true}
          value={item.directLoad.surgeLoad_Fz}
          className={"w-50"}
          onChange={(value) => handleChangeRow(item, "surgeLoad_Fz", value)}
        />
        <NumericCell
          isDecimal={true}
          value={item.directLoad.snowLoad}
          className={"w-50"}
          onChange={(value) => handleChangeRow(item, "snowLoad", value)}
        />
      </tr>
    );
  }

  function handleExportToCSV() {
    exportToCSV(
      rows.map((row) => ({
        ...row.directLoad,
        id: row.id,
        pr: row.pr?.name,
        element: row.element?.name,
      })),
      "Direct piping load"
    );
  }

  function mapJSONFromExcel(data: any[], map: any) {
    let newLoads: DirectLoad[] = [];
    let index = rows.reduce((max, item) => Math.max(max, item.id), 0) + 1;

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
              param.coef * (row[fieldRow] ?? 0) + (contentOnly ? empty_Fy ?? 0 : 0),
          };
        case "FY":
          return {
            [`${fieldLoad}_Fy`]:
              param.coef * (row[fieldRow] ?? 0) + (contentOnly ? empty_Fy ?? 0 : 0),
          };
        case "FZ":
          return {
            [`${fieldLoad}_Fz`]:
              param.coef * (row[fieldRow] ?? 0) + (contentOnly ? empty_Fy ?? 0 : 0),
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
        },
      ];
    }

    if (currentProject) {
      const loadings = currentProject.loadings;
      const dLoads = loadings.directLoads ?? [];
      dispatch(changeLoadings({ ...loadings, directLoads: [...dLoads, ...newLoads] }));
    }
  }

  function mapJSONFromCSV(data: any[]) {
    if (currentProject) {
      let index = rows.reduce((max, item) => Math.max(max, item.id), 0) + 1;
      const loadings = currentProject.loadings;
      const dLoads = loadings.directLoads ?? [];
      dispatch(
        changeLoadings({
          ...loadings,
          directLoads: [...dLoads, ...data.map((item) => ({ ...item, id: index++ }))],
        })
      );
    }
  }

  function handleImportFromCSV() {
    setParamsDialog(
      <DirectLoadsImportParams
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
    if (!currentProject) return;
    openFile([".lts"], async (files) => {
      const newRows: DirectLoad[] = [];
      for (const file of files) {
        const type = checkFileType(file.name);
        if (type !== "lts") continue;
        try {
          const data = await readFileAsync(file);
          // @ts-ignore
          const entries = JSON.parse(data);
          if (!Array.isArray(entries)) throw new Error("Not array");
          for (const entry of entries as TLoadToStructureElement[]) {
            const newRow: DirectLoad = {
              id: newRows.length,
              distance: 0,
              lineNo: entry.line,
              empty_Fy: entry.emptyFy ?? undefined,
              test_Fy: entry.testFy ?? undefined,
              operating_Fy: entry.operatingFy ?? undefined,
              thermalAnchor_Fy: entry.taFy ?? undefined,
              thermalFriction_Fx: entry.tfFx ?? undefined,
              thermalFriction_Fz: entry.tfFz ?? undefined,
              windLoadX_Fx: entry.wxFx ?? undefined,
              windLoadX_Fy: entry.wxFy ?? undefined,
              windLoadX_Fz: entry.wxFz ?? undefined,
              windLoadZ_Fx: entry.wzFx ?? undefined,
              windLoadZ_Fy: entry.wzFy ?? undefined,
              windLoadZ_Fz: entry.wzFz ?? undefined,
              surgeLoad_Fx: entry.psvSurgeFx ?? undefined,
              surgeLoad_Fy: entry.psvSurgeFy ?? undefined,
              surgeLoad_Fz: entry.psvSurgeFz ?? undefined,
              snowLoad: entry.iceSnow ?? undefined,
            };
            newRows.push(newRow);
          }
        } catch (e) {
          dispatch(
            addEventAction(`Direct Piping Load: Parse error of file "${file.name}"`, "danger")
          );
        }
      }
      const loadings = currentProject.loadings;
      const dLoads = loadings.directLoads ?? [];
      let index = getNextId(dLoads);
      dispatch(
        changeLoadings({
          ...loadings,
          directLoads: [...dLoads, ...newRows.map((r) => ({ ...r, id: index++ }))],
        })
      );
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
              <Button small text="Import AL Piping Loads" intent="primary" onClick={handleImport} />
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
                        onChange={setSelectedRows}
                      />
                      <th rowSpan={2}>Line No.</th>
                      <th rowSpan={2}>PR No.</th>
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
            <Paginator items={rows} onChange={setSelectedRows} />
          </div>
        }
        onClose={onClose}
      />
      {paramsDialog}
    </>
  );
};

export default DirectLoads;
