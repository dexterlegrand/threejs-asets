import React, { useMemo } from "react";
import { GeneralCheckBoxCell } from "../../../../common/GeneralCheckBoxCell";
import { Button } from "@blueprintjs/core";
import { Project } from "../../../../../store/main/types";
import {
  TOpenFrame,
  TMetalCladdingOF,
  TColumnOF,
} from "../../../../../store/main/openFrameTypes";
import { useSelector, useDispatch } from "react-redux";
import { ApplicationState } from "../../../../../store";
import {
  getCurrentUI,
  getNextId,
  getElementByName,
  convertToNamesArray,
} from "../../../../3d-models/utils";
import { getOFModels } from "../../../../3d-models/openFrame";
import { changeModel } from "../../../../../store/main/actions";
import { OFMetalCladdingUI } from "../../../../../store/ui/types";
import { changeOFUIAction } from "../../../../../store/ui/actions";
import { SelectorCell } from "../../../../common/SelectorCell";
import { CheckBoxCell } from "../../../../common/CheckBoxCell";
import { NumericCell } from "../../../../common/NumericCell";

type Props = {
  project?: Project;
};

export function MetalCladdings(props: Props) {
  const { project } = props;

  const openFrameUI = useSelector(
    (state: ApplicationState) => getCurrentUI(state)?.openFrameUI
  );

  const dispatch = useDispatch();

  const models = useMemo(() => {
    return getOFModels(project);
  }, [project]);

  const data = useMemo(() => {
    return (openFrameUI?.metalCladdings ?? []).filter(
      (el) => !el.model || models.some((m) => m.name === el.model)
    );
  }, [openFrameUI, models]);

  function handleChangeModel(model: TOpenFrame) {
    dispatch(changeModel(model));
  }

  function handleChangeData(metalCladdings: OFMetalCladdingUI[]) {
    if (!openFrameUI) return;
    dispatch(changeOFUIAction({ ...openFrameUI, metalCladdings }));
  }

  function handleAddRow() {
    handleChangeData([
      ...data,
      { id: getNextId(data), selected: false, elevation: 0, height: 0 },
    ]);
  }

  function handleCreateElements(row: OFMetalCladdingUI, model: TOpenFrame) {
    if (!row.model || !row.from || !row.to) return model;
    const id = getNextId(model.metalCladdings ?? []);
    const el: TMetalCladdingOF = {
      id,
      uiId: row.id,
      from: row.from,
      to: row.to,
      elevation: row.elevation,
      height: row.height,
    };
    const changedModel: TOpenFrame = {
      ...model,
      metalCladdings: model.metalCladdings
        ? [...model.metalCladdings, el]
        : [el],
    };
    return changedModel;
  }

  function handleChangeRow(row: OFMetalCladdingUI, field: string, value: any) {
    const changedRow = { ...row, [field]: value };
    handleChangeData(
      data.map((element) => {
        if (element.id === changedRow.id) {
          return changedRow;
        } else return element;
      })
    );
    if (field === "selected") return;
    let model = getElementByName(models, row.model);
    if (!changedRow.model) return;
    if (row.model !== changedRow.model) {
      model = getElementByName(models, changedRow.model);
    }
    if (!model) return;
    const cp = handleDeleteModels([changedRow], project);
    // @ts-ignore
    model = cp?.models.find((m) => m.name === model?.name);
    model && handleChangeModel(handleCreateElements(changedRow, model));
  }

  function handleDeleteRows() {
    handleChangeData(data.filter((item) => !item.selected));
    handleDeleteModels(data.filter((item) => item.selected));
  }

  function handleDeleteModels(
    elements: OFMetalCladdingUI[],
    project?: Project
  ) {
    const map = new Map<string, number[]>();
    let changedProject = project ? { ...project } : undefined;
    for (const element of elements) {
      if (!element.model) continue;
      const ids = map.get(element.model);
      map.set(element.model, ids ? [...ids, element.id] : [element.id]);
    }
    for (const [key, ids] of Array.from(map.entries())) {
      const model = getElementByName(models, key);
      if (!model) continue;
      let newModel = { ...model };
      for (const id of ids) {
        newModel = {
          ...newModel,
          metalCladdings:
            newModel.metalCladdings?.filter((item) => item.uiId !== id) ?? [],
        };
      }
      if (changedProject) {
        changedProject = {
          ...changedProject,
          models: changedProject.models.map((mItem) =>
            mItem.name === newModel.name ? newModel : mItem
          ),
        };
      } else handleChangeModel(newModel);
    }
    return changedProject;
  }

  function getColumns(
    columns: TColumnOF[],
    column: TColumnOF | undefined,
    elevation: number
  ) {
    if (!column) return [];
    const columnX = column.startPos.x;
    const columnZ = column.startPos.z;
    return columns.filter(
      (item) =>
        (item.startPos.x > columnX &&
          item.startPos.y <= elevation &&
          item.endPos.y >= elevation &&
          item.startPos.z === columnZ) ||
        (item.startPos.x < columnX &&
          item.startPos.y <= elevation &&
          item.endPos.y >= elevation &&
          item.startPos.z === columnZ) ||
        (item.startPos.x === columnX &&
          item.startPos.y <= elevation &&
          item.endPos.y >= elevation &&
          item.startPos.z > columnZ) ||
        (item.startPos.x === columnX &&
          item.startPos.y <= elevation &&
          item.endPos.y >= elevation &&
          item.startPos.z < columnZ)
    );
  }

  function getRow(row: OFMetalCladdingUI) {
    const model = getElementByName(models, row.model);
    const columns = model?.columns ?? [];
    const column = getElementByName(columns, row.from);
    const toColumns = getColumns(columns, column, row.elevation);
    const width = `${100 / 6}%`;
    return (
      <tr key={row.id}>
        <CheckBoxCell
          key={row.id}
          value={row.selected}
          onChange={(value) => handleChangeRow(row, "selected", value)}
        />
        <SelectorCell<string>
          items={convertToNamesArray(models)}
          itemKey={(item) => item}
          itemLabel={(item) => item}
          selected={row.model}
          onSelect={(value) => handleChangeRow(row, "model", value)}
        />
        <SelectorCell<string>
          items={convertToNamesArray(columns)}
          itemKey={(item) => item}
          itemLabel={(item) => item}
          selected={row.from}
          onSelect={(value) => handleChangeRow(row, "from", value)}
          filter={(query, item) =>
            query ? item.includes(query.toUpperCase()) : true
          }
        />
        <SelectorCell<string>
          items={convertToNamesArray(toColumns)}
          itemKey={(item) => item}
          itemLabel={(item) => item}
          selected={row.to}
          onSelect={(value) => handleChangeRow(row, "to", value)}
          filter={(query, item) =>
            query ? item.includes(query.toUpperCase()) : true
          }
        />
        <NumericCell
          min={0}
          isDecimal={true}
          value={row.elevation}
          onChange={(val) => handleChangeRow(row, "elevation", val)}
          style={{ width }}
        />
        <NumericCell
          min={0}
          isDecimal={true}
          value={row.height}
          onChange={(val) => handleChangeRow(row, "height", val)}
          style={{ width }}
        />
      </tr>
    );
  }

  return (
    <div className="d-flex f-column">
      <div className="hr" />
      <div className="label-light bg-dark">
        <span>Metal Claddings</span>
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
          disabled={true}
        />
        <Button
          small
          icon="import"
          text="Import from CSV"
          intent="success"
          disabled={true}
        />
        <Button
          small
          icon="plus"
          text="Add Row"
          intent="primary"
          onClick={handleAddRow}
        />
      </div>
      <div className="hr" />
      <div className={"p-5"}>
        <div className={"table-container"}>
          <table className="table bg-gray">
            <thead>
              <tr>
                <GeneralCheckBoxCell data={data} onChange={handleChangeData} />
                <th>OF No.</th>
                <th>From Column No.</th>
                <th>To Column No.</th>
                <th>Distance from Start, (m)</th>
                <th>Height, (m)</th>
              </tr>
            </thead>
            <tbody>{data.map((item) => getRow(item))}</tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
