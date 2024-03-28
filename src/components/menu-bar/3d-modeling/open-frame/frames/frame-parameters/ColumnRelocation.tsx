import React, { useState, useMemo } from "react";
import { OFFramesColumnRelocationUI, OpenFrameUI } from "../../../../../../store/ui/types";
import {
  getElementByName,
  convertToNamesArray,
  getNextId,
  importFromCSV,
  exportToCSV,
  fixNumberToStr,
} from "../../../../../3d-models/utils";
import { TOpenFrame, TColumnOF } from "../../../../../../store/main/openFrameTypes";
import { Vector3 } from "three";
import {
  getSeparetedElementsOfModel,
  insertColumn,
  getBeamElementsOfModel,
  getOFModels,
  removeConnections,
  mergeBeams,
} from "../../../../../3d-models/openFrame";
import { NumericCell } from "../../../../../common/NumericCell";
import { SelectorCell } from "../../../../../common/SelectorCell";
import { CheckBoxCell } from "../../../../../common/CheckBoxCell";
import { GeneralCheckBoxCell } from "../../../../../common/GeneralCheckBoxCell";
import { Button } from "@blueprintjs/core";
import { Project } from "../../../../../../store/main/types";
import { isNumber } from "util";

type Props = {
  project?: Project;
  openFrameUI?: OpenFrameUI;
  setTab: (tab: "OFP" | "CR") => any;
  onChangeUI: (ui: OpenFrameUI) => any;
  onChagneModel: (model: TOpenFrame) => any;
  onError: (msg: string) => any;
};

export function ColumnRelocation(props: Props) {
  const { project, openFrameUI, setTab, onChangeUI, onChagneModel, onError } = props;

  const [display, setDisplay] = useState<boolean>(true);

  const models = useMemo(() => getOFModels(project), [project]);

  const relocations = useMemo(() => {
    return openFrameUI?.frames.relocations ?? [];
  }, [openFrameUI]);

  function handleChangeUI(relocations: OFFramesColumnRelocationUI[]) {
    if (!openFrameUI) return;
    onChangeUI({
      ...openFrameUI,
      frames: { ...openFrameUI.frames, relocations },
    });
  }

  function handleDeleteRows() {
    handleChangeUI(relocations.filter((item) => !item.selected));
    Array.from(
      new Set(relocations.filter((item) => item.selected && item.model).map((item) => item.model))
    ).forEach((modelName) => {
      let model = getElementByName(models, modelName);
      if (model) {
        const valid = relocations.filter(
          (item) => item.selected && item.model === modelName && item.column
        );
        valid.forEach((item) => {
          const column = getElementByName(model!.columns, item.column);
          if (column) {
            const changedColumn: TColumnOF = {
              ...column,
              startPos: new Vector3(column.pos.x, column.startPos.y, column.pos.z),
              endPos: new Vector3(column.pos.x, column.endPos.y, column.pos.z),
            };
            model = removeConnections(model!, column);
            model = mergeBeams(model);
            model = {
              ...model,
              ...getSeparetedElementsOfModel(
                insertColumn(getBeamElementsOfModel(model), changedColumn)
              ),
            };
          }
        });
        valid.length && onChagneModel(model);
      }
    });
  }

  function handleSelect(row: OFFramesColumnRelocationUI, selected: any) {
    const changed = { ...row, selected };
    handleChangeUI(relocations.map((item) => (item.id === row.id ? changed : item)));
  }

  function handleChangeRow(
    row: OFFramesColumnRelocationUI,
    field: string,
    value: any,
    isHard?: boolean
  ) {
    const changed = { ...row, [field]: value };
    handleChangeUI(relocations.map((item) => (item.id === row.id ? changed : item)));
    let _models = [...models];
    if (isHard) {
      const model = getElementByName(models, row.model);
      const column = getElementByName(model?.columns, row.column);
      if (model && column) {
        const changedColumn: TColumnOF = {
          ...column,
          startPos: new Vector3(column.pos.x, column.startPos.y, column.pos.z),
          endPos: new Vector3(column.pos.x, column.endPos.y, column.pos.z),
        };
        let changedModel = removeConnections(model!, column);
        changedModel = mergeBeams(changedModel);
        changedModel = {
          ...changedModel,
          ...getSeparetedElementsOfModel(
            insertColumn(getBeamElementsOfModel(changedModel), changedColumn)
          ),
        };
        _models = _models.map((m) => (m.name === model.name ? changedModel : m));
        onChagneModel(changedModel);
      }
    }
    const model = getElementByName(_models, changed.model);
    if (!model) return;
    const column = getElementByName(model.columns, changed.column);
    if (!column) return;
    const changedColumn: TColumnOF = {
      ...column,
      startPos: new Vector3(column.pos.x, column.startPos.y, column.pos.z + changed.distance),
      endPos: new Vector3(column.pos.x, column.endPos.y, column.pos.z + changed.distance),
      startConnected: [],
      connected: [],
      endConnected: [],
    };
    let changedModel = removeConnections(model, column);
    changedModel = mergeBeams(changedModel);
    changedModel = {
      ...changedModel,
      ...getSeparetedElementsOfModel(
        insertColumn(getBeamElementsOfModel(changedModel), changedColumn)
      ),
    };
    onChagneModel(changedModel);
  }

  function handleAddRow() {
    if (!openFrameUI) return;
    onChangeUI({
      ...openFrameUI,
      frames: {
        ...openFrameUI.frames,
        relocations: [...relocations, { id: getNextId(relocations), selected: false, distance: 0 }],
      },
    });
  }

  function getRow(item: OFFramesColumnRelocationUI) {
    const model = getElementByName(models, item.model);
    const frame = getElementByName(model?.frames, item.frame);
    const columns =
      model?.columns.filter(
        (column) => column.frame === frame?.name && column.secondType === "GENERAL"
      ) ?? [];
    const column = getElementByName(columns, item.column);
    const mNames = convertToNamesArray(models);
    const fNames = convertToNamesArray(model?.frames);
    const cNames = convertToNamesArray(columns);
    let minD = frame && column ? -frame.width / 2 - column.pos.z : 0;
    let maxD = frame && column ? frame.width / 2 - column.pos.z : 0;
    if (column) {
      for (const el of columns) {
        if (el.name === column.name) continue;
        if (el.startPos.z < column.pos.z) minD = Math.max(minD, el.startPos.z - column.pos.z);
        if (el.startPos.z > column.pos.z) maxD = Math.min(maxD, el.startPos.z - column.pos.z);
      }
    }
    return (
      <tr key={item.id}>
        <CheckBoxCell
          key={item.id}
          value={item.selected}
          onChange={(value) => handleSelect(item, value)}
        />
        <SelectorCell<string>
          items={mNames}
          itemKey={(item) => item}
          itemLabel={(item) => item}
          selected={item.model}
          onSelect={(value) => handleChangeRow(item, "model", value, true)}
          filterable={false}
        />
        <SelectorCell<string>
          items={fNames}
          itemKey={(item) => item}
          itemLabel={(item) => item}
          selected={item.frame}
          onSelect={(value) => handleChangeRow(item, "frame", value, true)}
          filterable={false}
        />
        <SelectorCell<string>
          items={cNames}
          itemKey={(item) => item}
          itemLabel={(item) => item}
          selected={item.column}
          onSelect={(value) => handleChangeRow(item, "column", value, true)}
          filterable={true}
          filter={(query: string, item: string) => (query ? item === query.toUpperCase() : true)}
        />
        <NumericCell
          min={minD}
          max={maxD}
          isDecimal={true}
          value={item.distance}
          onChange={(value) => handleChangeRow(item, "distance", value)}
          style={{ width: "20%" }}
        />
      </tr>
    );
  }

  function handleExport() {
    exportToCSV(
      relocations.map((item) => ({
        id: item.id,
        "OF No.": item.model ?? "",
        "Frame No.": item.frame ?? "",
        "Column No.": item.column ?? "",
        "Distance (m)": fixNumberToStr(item.distance),
      })),
      "Frames Column Relocations"
    );
  }

  function handleImport() {
    if (!openFrameUI) return;
    importFromCSV((arr) => {
      let _relocations: OFFramesColumnRelocationUI[] = [];
      arr.forEach((item) => {
        try {
          let model, frame, column;
          const itemModel = item["OF No."];
          const itemFrame = item["Frame No."];
          const itemColumn = item["Column No."];
          const itemDistance = item["Distance (m)"];
          if (itemModel) {
            model = getElementByName(models, itemModel);
            if (!model)
              throw new Error(
                `Open Frame Column Relocation (Import): Model "${itemModel}" not found`
              );
          }
          if (itemFrame) {
            frame = getElementByName(model?.frames, itemFrame);
            if (!frame)
              throw new Error(
                `Open Frame Column Relocation (Import): Frame "${itemFrame}" not found`
              );
          }
          if (itemColumn) {
            column = model?.columns.find((column) => column.name === itemColumn);
            if (!column)
              throw new Error(
                `Open Frame Column Relocation (Import): Column "${itemColumn}" not found`
              );
          }
          if (itemDistance) {
            if (!isNumber(itemDistance)) {
              throw new Error(
                `Open Frame Column Relocation (Import): (id: ${item.id}) - a value of "Distance (m)" "${itemDistance}" is not a number!`
              );
            }
          }
          try {
            _relocations = [
              ..._relocations,
              {
                id: getNextId(_relocations),
                selected: false,
                model: model?.name,
                frame: frame?.name,
                column: column?.name,
                distance: item.distance,
              },
            ];
          } catch (pE) {
            throw new Error(`Open Frame Parameters (Import): Parse Error`);
          }
        } catch (e) {
          onError(e.message);
        }
      });
      onChangeUI({
        ...openFrameUI,
        frames: { ...openFrameUI.frames, relocations: _relocations },
      });
    });
  }

  return (
    <>
      <div className="label-light bg-dark">
        <Button
          icon={display ? "caret-down" : "caret-right"}
          onClick={() => setDisplay(!display)}
          minimal
          small
        />
        <Button
          small
          minimal
          className={"c-light"}
          text={"Open Frame Parameters"}
          onClick={() => setTab("OFP")}
        />
        <span>|</span>
        <Button
          small
          minimal
          className={"c-light"}
          text={"Column Relocation"}
          onClick={() => setTab("CR")}
        />
        <Button small icon="trash" text="Delete" intent="warning" onClick={handleDeleteRows} />
        <Button small icon="export" text="Export to CSV" intent="success" onClick={handleExport} />
        <Button
          small
          icon="import"
          text="Import from CSV"
          intent="success"
          onClick={handleImport}
        />
        <Button small icon="plus" text="Add Row" intent="primary" onClick={handleAddRow} />
      </div>
      <div className="hr" />
      <div className={"p-5"} style={{ display: display ? "block" : "none" }}>
        <div className={"small-table-container"}>
          <table className="table bg-gray">
            <thead>
              <tr>
                <GeneralCheckBoxCell data={relocations} onChange={handleChangeUI} />
                <th>OF No.</th>
                <th>Frame No.</th>
                <th>Column No.</th>
                <th>Distance (m)</th>
              </tr>
            </thead>
            <tbody>{relocations?.map((item) => getRow(item))}</tbody>
          </table>
        </div>
      </div>
    </>
  );
}
