import React, { useMemo, useState, useEffect, useRef } from "react";
import { Button } from "@blueprintjs/core";
import { useDispatch, useSelector } from "react-redux";
import { ApplicationState } from "../../../../../store";
import { CheckBoxCell } from "../../../../common/CheckBoxCell";
import { SelectorCell } from "../../../../common/SelectorCell";
import { NumericCell } from "../../../../common/NumericCell";
import { InputCell } from "../../../../common/InputCell";
import { CustomDlg } from "../../../../common/CustomDlg";
import { getFSModels } from "../../../../3d-models/openFrame";
import {
  getElementByName,
  getNextId,
  convertToNamesArray,
  getTopOffset,
  exportToCSV,
  checkImportedNumber,
  importFromCSV,
  getCurrentUI,
} from "../../../../3d-models/utils";
import { BlanketLoadUI } from "../../../../../store/ui/types";
import { changeOFUIAction, addEventAction } from "../../../../../store/ui/actions";
import { TBeamOF, TOpenFrame } from "../../../../../store/main/openFrameTypes";

type Props = { onClose: () => any };

export function BlanketLoadsFS({ onClose }: Props) {
  const [offsetTop, setOffsetTop] = useState<number>(0);

  const openFrameUI = useSelector((state: ApplicationState) => getCurrentUI(state)?.openFrameUI);

  const project = useSelector((state: ApplicationState) =>
    getElementByName(state.main.projects, state.main.currentProject)
  );

  const dispatch = useDispatch();

  const tableRef = useRef<HTMLTableElement>(null);

  const models = useMemo(() => {
    return getFSModels(project);
  }, [project]);

  const data = useMemo(() => {
    return openFrameUI?.loadingsUI.pipingLoadsUI.blanketLoads ?? [];
  }, [openFrameUI]);

  useEffect(() => {
    setOffsetTop(getTopOffset(tableRef.current, 1));
  }, [data]);

  function handleChangeData(blanketLoads: BlanketLoadUI[]) {
    if (!openFrameUI) return;
    dispatch(
      changeOFUIAction({
        ...openFrameUI,
        loadingsUI: {
          ...openFrameUI.loadingsUI,
          pipingLoadsUI: {
            ...openFrameUI.loadingsUI.pipingLoadsUI,
            blanketLoads,
          },
        },
      })
    );
  }

  function handleAddRow() {
    handleChangeData([
      ...data,
      {
        id: getNextId(data),
        selected: false,
        area: "",
        distance: 0,
        intensity: 0,
        width: 0,
        alongPercent: 0,
        acrossPercent: 0,
      },
    ]);
  }

  function handleDeleteRows() {
    handleChangeData(data.filter((bl) => !bl.selected));
  }

  function handleChangeRow(item: BlanketLoadUI, field: string, value: any) {
    handleChangeData(data.map((bl) => (bl.id === item.id ? { ...item, [field]: value } : bl)));
  }

  function getBeams(beams?: TBeamOF[], beam?: TBeamOF) {
    if (!beams || !beam) return [];
    const filtered = beams.filter((item) => {
      if (
        item.name === beam.name ||
        item.startPos.y !== beam.startPos.y ||
        item.direction !== beam.direction
      )
        return false;
      if (beam.direction === "X") {
        return (
          (beam.startPos.x < item.startPos.x && beam.startPos.x >= item.endPos.x) ||
          (beam.startPos.x >= item.startPos.x && beam.startPos.x < item.endPos.x)
        );
      } else {
        return (
          (beam.startPos.z >= item.startPos.z && beam.startPos.z < item.endPos.z) ||
          (beam.startPos.z < item.startPos.z && beam.startPos.z >= item.endPos.z)
        );
      }
    });
    return filtered;
  }

  function getRow(item: BlanketLoadUI) {
    const model = getElementByName(models, item.model);
    const beams = model?.beams;
    const from = getElementByName(beams, item.from);
    const toBeams = getBeams(beams, from);
    return (
      <tr key={item.id}>
        <CheckBoxCell
          value={item.selected}
          onChange={(value) => handleChangeRow(item, "selected", value)}
        />
        <InputCell value={item.area} onChange={(value) => handleChangeRow(item, "area", value)} />
        <SelectorCell<string>
          items={convertToNamesArray(models)}
          selected={item.model}
          itemKey={(item) => item}
          itemLabel={(item) => item}
          onSelect={(value) => handleChangeRow(item, "model", value)}
          filterable={false}
        />
        <SelectorCell<string>
          items={convertToNamesArray(beams)}
          itemKey={(item) => item}
          itemLabel={(item) => item}
          selected={item.from}
          onSelect={(value) => handleChangeRow(item, "from", value)}
          filterable={true}
          filter={(query, item) => (query ? item.includes(query.toUpperCase()) : true)}
        />
        <SelectorCell<string>
          items={convertToNamesArray(toBeams)}
          itemKey={(item) => item}
          itemLabel={(item) => item}
          selected={item.to}
          onSelect={(value) => handleChangeRow(item, "to", value)}
          filterable={true}
          filter={(query, item) => (query ? item.includes(query.toUpperCase()) : true)}
        />
        <NumericCell
          value={item.width}
          className={"w-100"}
          onChange={(value) => handleChangeRow(item, "width", value)}
        />
        <NumericCell
          value={item.distance}
          className={"w-100"}
          onChange={(value) => handleChangeRow(item, "distance", value)}
        />
        <NumericCell
          value={item.intensity}
          className={"w-100"}
          onChange={(value) => handleChangeRow(item, "intensity", value)}
        />
        <NumericCell
          value={item.alongPercent}
          className={"w-100"}
          onChange={(value) => handleChangeRow(item, "alongPercent", value)}
        />
        <NumericCell
          value={item.acrossPercent}
          className={"w-100"}
          onChange={(value) => handleChangeRow(item, "acrossPercent", value)}
        />
      </tr>
    );
  }

  function handleExport() {
    exportToCSV(data, "FS Blanket Piping Load");
  }

  function showErrorMsg(msg: string) {
    dispatch(addEventAction(`Blanket Piping Load (Import): ${msg}`, "danger"));
  }

  function handleImport() {
    importFromCSV((newData, isCSV) => {
      if (!isCSV || !Array.isArray(newData)) return;
      const newItems: BlanketLoadUI[] = [...data];
      newData.forEach((item: BlanketLoadUI) => {
        let newItem: BlanketLoadUI = {
          id: getNextId(newItems),
          selected: false,
          area: item.area,
          width: 0,
          distance: 0,
          intensity: 0,
          alongPercent: 0,
          acrossPercent: 0,
        };
        let model: TOpenFrame | undefined;
        if (item.model) {
          model = getElementByName(models, item.model);
          if (model) {
            newItem = { ...newItem, model: model.name };
            if (item.from) {
              const from = getElementByName(model.beams, item.from);
              if (from) {
                newItem = { ...newItem, from: from.name };
              } else {
                showErrorMsg(`(id: ${item.id}) - an element "${item.from}" not found!`);
              }
            }
            if (item.to) {
              const to = getElementByName(model.beams, item.to);
              if (to) {
                newItem = { ...newItem, to: to.name };
              } else {
                showErrorMsg(`(id: ${item.id}) - an element "${item.to}" not found!`);
              }
            }
          } else {
            showErrorMsg(`(id: ${item.id}) - a model "${item.model}" not found!`);
          }
        }
        newItem = {
          ...newItem,
          width: checkImportedNumber(item.width, false) ?? 0,
          distance: checkImportedNumber(item.distance, false) ?? 0,
          intensity: checkImportedNumber(item.intensity) ?? 0,
          alongPercent: checkImportedNumber(item.alongPercent) ?? 0,
          acrossPercent: checkImportedNumber(item.acrossPercent) ?? 0,
        };
        newItems.push(newItem);
      });
      handleChangeData(newItems);
    });
  }

  return (
    <CustomDlg
      title={"Blanket Piping Load"}
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
                  <th></th>
                  <th>Area No.</th>
                  <th>FS No.</th>
                  <th>From Beam</th>
                  <th>To Beam</th>
                  <th>Width (m)</th>
                  <th>Dist. From Left (m)</th>
                  <th>
                    Fy Intensity (kg/<sub>m</sub>
                    <sup>2</sup>)
                  </th>
                  <th>Load % along Pipe</th>
                  <th>Load % across Pipe</th>
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
