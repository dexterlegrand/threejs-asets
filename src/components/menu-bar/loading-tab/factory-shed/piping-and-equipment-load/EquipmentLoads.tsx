import React, { useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@blueprintjs/core";
import { useDispatch, useSelector } from "react-redux";
import { ApplicationState } from "../../../../../store";
import { CheckBoxCell } from "../../../../common/CheckBoxCell";
import { SelectorCell } from "../../../../common/SelectorCell";
import { NumericCell } from "../../../../common/NumericCell";
import {
  getTopOffset,
  getElementByName,
  getNextId,
  convertToNamesArray,
  exportToCSV,
  importFromCSV,
  checkImportedNumber,
  getCurrentUI,
} from "../../../../3d-models/utils";
import { CustomDlg } from "../../../../common/CustomDlg";
import { getFSModels } from "../../../../3d-models/openFrame";
import { EquipmentLoadUI } from "../../../../../store/ui/types";
import { changeOFUIAction, addEventAction } from "../../../../../store/ui/actions";
import { TOpenFrame } from "../../../../../store/main/openFrameTypes";

type Props = {
  onClose: () => any;
};

const initLoad: EquipmentLoadUI = {
  id: 0,
  selected: false,
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
};

export function EquipmentLoadsFS({ onClose }: Props) {
  const [offsetTop, setOffsetTop] = useState<number>(0);

  const openFrameUI = useSelector((state: ApplicationState) => getCurrentUI(state)?.openFrameUI);

  const project = useSelector((state: ApplicationState) =>
    getElementByName(state.main.projects, state.main.currentProject)
  );

  const dispatch = useDispatch();

  const models = useMemo(() => {
    return getFSModels(project);
  }, [project]);

  const data = useMemo(() => {
    return openFrameUI?.loadingsUI.equipmentLoadUI ?? [];
  }, [openFrameUI]);

  useEffect(() => {
    setOffsetTop(getTopOffset(tableRef.current, 1));
  }, [data]);

  function handleChangeData(equipmentLoadUI: EquipmentLoadUI[]) {
    if (!openFrameUI) return;
    dispatch(
      changeOFUIAction({
        ...openFrameUI,
        loadingsUI: {
          ...openFrameUI.loadingsUI,
          equipmentLoadUI,
        },
      })
    );
  }

  function handleAddRow() {
    handleChangeData([...data, { ...initLoad, id: getNextId(data) }]);
  }

  function handleDeleteRows() {
    handleChangeData(data.filter((item) => !item.selected));
  }

  function handleChangeRow(item: EquipmentLoadUI, field: string, value: any) {
    handleChangeData(
      data.map((dataItem) => {
        if (dataItem.id === item.id) {
          return { ...dataItem, [field]: value };
        }
        return dataItem;
      })
    );
  }

  function handleChangeModel(item: EquipmentLoadUI, model?: string) {
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

  function getRow(item: EquipmentLoadUI) {
    const model = getElementByName(models, item.model);
    const beams = model?.beams.filter(
      (beam) => !data.some((dataItem) => dataItem.element === beam.name)
    );
    return (
      <tr key={item.id}>
        <CheckBoxCell
          value={item.selected}
          onChange={(value) => handleChangeRow(item, "selected", value)}
        />
        <SelectorCell<string>
          items={convertToNamesArray(models)}
          selected={item.model}
          itemKey={(item) => item}
          itemLabel={(item) => item}
          onSelect={(value) => handleChangeModel(item, value)}
          filterable={false}
        />
        <SelectorCell<string>
          items={convertToNamesArray(beams)}
          selected={item.element}
          itemKey={(item) => item}
          itemLabel={(item) => item}
          onSelect={(value) => handleChangeRow(item, "element", value)}
          filterable={true}
          filter={(query, item) => (query ? item.includes(query.toUpperCase()) : true)}
        />
        <NumericCell
          disabled={!item.element}
          value={item.distance}
          className={"w-100"}
          onChange={(value) => handleChangeRow(item, "distance", value)}
        />
        <NumericCell
          disabled={!item.element}
          value={item.empty_Fy}
          className={"w-50"}
          onChange={(value) => handleChangeRow(item, "empty_Fy", value)}
        />
        <NumericCell
          disabled={!item.element}
          value={item.test_Fx}
          className={"w-50"}
          onChange={(value) => handleChangeRow(item, "test_Fx", value)}
        />
        <NumericCell
          disabled={!item.element}
          value={item.test_Fy}
          className={"w-50"}
          onChange={(value) => handleChangeRow(item, "test_Fy", value)}
        />
        <NumericCell
          disabled={!item.element}
          value={item.test_Fz}
          className={"w-50"}
          onChange={(value) => handleChangeRow(item, "test_Fz", value)}
        />
        <NumericCell
          disabled={!item.element}
          value={item.test_Mx}
          className={"w-50"}
          onChange={(value) => handleChangeRow(item, "test_Mx", value)}
        />
        <NumericCell
          disabled={!item.element}
          value={item.test_My}
          className={"w-50"}
          onChange={(value) => handleChangeRow(item, "test_My", value)}
        />
        <NumericCell
          disabled={!item.element}
          value={item.test_Mz}
          className={"w-50"}
          onChange={(value) => handleChangeRow(item, "test_Mz", value)}
        />
        <NumericCell
          disabled={!item.element}
          value={item.operating_Fx}
          className={"w-50"}
          onChange={(value) => handleChangeRow(item, "operating_Fx", value)}
        />
        <NumericCell
          disabled={!item.element}
          value={item.operating_Fy}
          className={"w-50"}
          onChange={(value) => handleChangeRow(item, "operating_Fy", value)}
        />
        <NumericCell
          disabled={!item.element}
          value={item.operating_Fz}
          className={"w-50"}
          onChange={(value) => handleChangeRow(item, "operating_Fz", value)}
        />
        <NumericCell
          disabled={!item.element}
          value={item.operating_Mx}
          className={"w-50"}
          onChange={(value) => handleChangeRow(item, "operating_Mx", value)}
        />
        <NumericCell
          disabled={!item.element}
          value={item.operating_My}
          className={"w-50"}
          onChange={(value) => handleChangeRow(item, "operating_My", value)}
        />
        <NumericCell
          disabled={!item.element}
          value={item.operating_Mz}
          className={"w-50"}
          onChange={(value) => handleChangeRow(item, "operating_Mz", value)}
        />
      </tr>
    );
  }

  const tableRef = useRef<HTMLTableElement>(null);

  function handleExport() {
    exportToCSV(data, "FS Equipment Load");
  }

  function showErrorMsg(msg: string) {
    dispatch(addEventAction(`Equipment Load (Import): ${msg}`, "danger"));
  }

  function handleImport() {
    importFromCSV((newData, isCSV) => {
      if (!isCSV || !Array.isArray(newData)) return;
      const newItems: EquipmentLoadUI[] = [...data];
      newData.forEach((item: EquipmentLoadUI) => {
        let newItem: EquipmentLoadUI = {
          ...initLoad,
          id: getNextId(newItems),
        };
        let model: TOpenFrame | undefined;
        if (item.model) {
          model = getElementByName(models, item.model);
          if (model) {
            newItem = { ...newItem, model: model.name };
            if (item.element) {
              const element = getElementByName(model.beams, item.element);
              if (element) {
                newItem = { ...newItem, element: element.name };
              } else {
                showErrorMsg(`(id: ${item.id}) - an element "${item.element}" not found!`);
              }
            }
          } else {
            showErrorMsg(`(id: ${item.id}) - a model "${item.model}" not found!`);
          }
        }
        newItem = {
          ...newItem,
          distance: checkImportedNumber(item.distance, false) ?? 0,
          empty_Fy: checkImportedNumber(item.empty_Fy) ?? 0,
          test_Fx: checkImportedNumber(item.test_Fx) ?? 0,
          test_Fy: checkImportedNumber(item.test_Fy) ?? 0,
          test_Fz: checkImportedNumber(item.test_Fx) ?? 0,
          test_Mx: checkImportedNumber(item.test_Mx) ?? 0,
          test_My: checkImportedNumber(item.test_My) ?? 0,
          test_Mz: checkImportedNumber(item.test_Mz) ?? 0,

          operating_Fx: checkImportedNumber(item.operating_Fx) ?? 0,
          operating_Fy: checkImportedNumber(item.operating_Fy) ?? 0,
          operating_Fz: checkImportedNumber(item.operating_Fz) ?? 0,
          operating_Mx: checkImportedNumber(item.operating_Mx) ?? 0,
          operating_My: checkImportedNumber(item.operating_My) ?? 0,
          operating_Mz: checkImportedNumber(item.operating_Mz) ?? 0,
        };
        newItems.push(newItem);
      });
      handleChangeData(newItems);
    });
  }

  return (
    <CustomDlg
      title={"Equipment Load"}
      isMinimize={true}
      body={
        <div className="d-flex f-grow f-column">
          <div className="label-light bg-dark">
            <Button small icon="trash" text="Delete" intent="warning" onClick={handleDeleteRows} />
            <Button
              small
              icon="export"
              text="Export to CSV"
              intent="success"
              onClick={handleExport}
            />
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
          <div className={"table-container bg-dark p-5"}>
            <table ref={tableRef} className="table bg-gray">
              <thead>
                <tr>
                  <th rowSpan={2}></th>
                  <th rowSpan={2}>FS No.</th>
                  <th rowSpan={2}>Element No.</th>
                  <th rowSpan={2}>Dist. From Start Node (m)</th>
                  <th>Empty</th>
                  <th colSpan={6}>Test</th>
                  <th colSpan={6}>Operating</th>
                </tr>
                <tr>
                  <th style={{ top: offsetTop }}>Fy (kg)</th>
                  <th style={{ top: offsetTop }}>Fx (kg)</th>
                  <th style={{ top: offsetTop }}>Fy (kg)</th>
                  <th style={{ top: offsetTop }}>Fz (kg)</th>
                  <th style={{ top: offsetTop }}>Mx (kg.m)</th>
                  <th style={{ top: offsetTop }}>My (kg.m)</th>
                  <th style={{ top: offsetTop }}>Mz (kg.m)</th>
                  <th style={{ top: offsetTop }}>Fx (kg)</th>
                  <th style={{ top: offsetTop }}>Fy (kg)</th>
                  <th style={{ top: offsetTop }}>Fz (kg)</th>
                  <th style={{ top: offsetTop }}>Mx (kg.m)</th>
                  <th style={{ top: offsetTop }}>My (kg.m)</th>
                  <th style={{ top: offsetTop }}>Mz (kg.m)</th>
                </tr>
              </thead>
              <tbody>{data.map((item) => getRow(item))}</tbody>
            </table>
          </div>
        </div>
      }
      onClose={onClose}
    />
  );
}
