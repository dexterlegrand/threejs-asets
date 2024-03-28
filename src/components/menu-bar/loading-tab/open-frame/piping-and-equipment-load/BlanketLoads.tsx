import React, { useMemo } from "react";
import { Button } from "@blueprintjs/core";
import { useDispatch, useSelector } from "react-redux";
import { ApplicationState } from "../../../../../store";
import { CheckBoxCell } from "../../../../common/CheckBoxCell";
import { SelectorCell } from "../../../../common/SelectorCell";
import { NumericCell } from "../../../../common/NumericCell";
import { InputCell } from "../../../../common/InputCell";
import { CustomDlg } from "../../../../common/CustomDlg";
import { getOFModels, getMaxAndMinPoints } from "../../../../3d-models/openFrame";
import {
  getElementByName,
  getNextId,
  convertToNamesArray,
  exportToCSV,
  checkImportedNumber,
  importFromCSV,
  getCurrentUI,
  roundM,
  hardCheckRange,
  checkRange,
} from "../../../../3d-models/utils";
import { BlanketLoadUI } from "../../../../../store/ui/types";
import { changeOFUIAction, addEventAction } from "../../../../../store/ui/actions";
import { TOpenFrame, TBeamElement } from "../../../../../store/main/openFrameTypes";
import { GeneralCheckBoxCell } from "../../../../common/GeneralCheckBoxCell";

type Props = { onClose: () => any };

export function BlanketLoadsOF({ onClose }: Props) {
  const openFrameUI = useSelector((state: ApplicationState) => getCurrentUI(state)?.openFrameUI);

  const project = useSelector((state: ApplicationState) =>
    getElementByName(state.main.projects, state.main.currentProject)
  );

  const dispatch = useDispatch();

  const models = useMemo(() => {
    return getOFModels(project);
  }, [project]);

  const data = useMemo(() => {
    return openFrameUI?.loadingsUI.pipingLoadsUI.blanketLoads ?? [];
  }, [openFrameUI]);

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

  function getBeams(beams: TBeamElement[], beam?: TBeamElement) {
    if (!beam) return [];
    const sxb = roundM(beam.startPos.x);
    const exb = roundM(beam.endPos.x);
    const szb = roundM(beam.startPos.z);
    const ezb = roundM(beam.endPos.z);
    const yb = roundM(beam.endPos.y);
    const filtered = beams.filter((item) => {
      const sxi = roundM(item.startPos.x);
      const exi = roundM(item.endPos.x);
      const szi = roundM(item.startPos.z);
      const ezi = roundM(item.endPos.z);
      const yi = roundM(item.endPos.y);
      if (
        item.name === beam.name ||
        yi !== yb ||
        !((sxi === exi && sxb === exb) || (szi === ezi && szb === ezb))
      )
        return false;
      if (szb === ezb) {
        if (hardCheckRange(sxi, sxb, exb) && hardCheckRange(exi, sxb, exb)) {
          return true;
        } else if (hardCheckRange(sxb, sxi, exi) && hardCheckRange(exb, sxi, exi)) {
          return true;
        } else if (checkRange(sxi, sxb, exb, true, false) && !checkRange(exi, sxb, exb)) {
          return true;
        } else if (!checkRange(sxi, sxb, exb) && checkRange(exi, sxb, exb, false, true)) {
          return true;
        } else return false;
      } else {
        if (hardCheckRange(szi, szb, ezb) && hardCheckRange(ezi, szb, ezb)) {
          return true;
        } else if (hardCheckRange(szb, szi, ezi) && hardCheckRange(ezb, szi, ezi)) {
          return true;
        } else if (checkRange(szi, szb, ezb, true, false) && !checkRange(ezi, szb, ezb)) {
          return true;
        } else if (!checkRange(szi, szb, ezb) && checkRange(ezi, szb, ezb, false, true)) {
          return true;
        } else return false;
      }
    });
    return filtered;
  }

  function getLeftDistances(elements: TBeamElement[], from?: TBeamElement, to?: TBeamElement) {
    if (!from || !to) return [];
    const { minV, maxV } = getMaxAndMinPoints(from, to);
    const isX = roundM(from.startPos.z) === roundM(from.endPos.z);
    const distances: number[] = [];
    for (const el of elements) {
      if (roundM(el.startPos.y) !== minV.y) continue;
      if (isX) {
        const sz = roundM(el.startPos.z);
        const ez = roundM(el.endPos.z);
        if (sz === ez) continue;
        if (
          (hardCheckRange(sz, minV.z, maxV.z) && hardCheckRange(ez, minV.z, maxV.z)) ||
          (hardCheckRange(minV.z, sz, ez) && hardCheckRange(maxV.z, sz, ez))
        ) {
          const sx = roundM(el.startPos.x);
          if (!hardCheckRange(sx, minV.x, maxV.x)) continue;
          const x = roundM(Math.abs(sx - minV.x));
          if (!distances.includes(x)) distances.push(x);
        }
      } else {
        const sx = roundM(el.startPos.x);
        const ex = roundM(el.endPos.x);
        if (sx === ex) continue;
        if (
          (hardCheckRange(sx, minV.x, maxV.x) && hardCheckRange(ex, minV.x, maxV.x)) ||
          (hardCheckRange(minV.x, sx, ex) && hardCheckRange(maxV.x, sx, ex))
        ) {
          const sz = roundM(el.startPos.z);
          if (!hardCheckRange(sz, minV.z, maxV.z)) continue;
          const z = roundM(Math.abs(sz - minV.z));
          if (!distances.includes(z)) distances.push(z);
        }
      }
    }
    return distances.sort((a, b) => a - b);
  }

  function getWidths(distances: number[], leftDistance: number) {
    const width: number[] = [];
    for (const d of distances) {
      if (d < leftDistance) continue;
      width.push(roundM(d - leftDistance));
    }
    return width;
  }

  function getRow(item: BlanketLoadUI) {
    const model = getElementByName(models, item.model);
    const beams = model ? [...model.beams, ...model.cantilevers] : [];
    const from = getElementByName(beams, item.from);
    const toBeams = getBeams(beams, from);
    const to = getElementByName(toBeams, item.to);
    const distances = getLeftDistances(beams, from, to);
    const widths = getWidths(distances, item.distance);
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
        />
        <SelectorCell<string>
          items={convertToNamesArray(beams)}
          itemKey={(item) => item}
          itemLabel={(item) => item}
          selected={item.from}
          onSelect={(value) => handleChangeRow(item, "from", value)}
          filter={(query, item) => (query ? item.includes(query.toUpperCase()) : true)}
        />
        <SelectorCell<string>
          items={convertToNamesArray(toBeams)}
          itemKey={(item) => item}
          itemLabel={(item) => item}
          selected={item.to}
          onSelect={(value) => handleChangeRow(item, "to", value)}
          filter={(query, item) => (query ? item.includes(query.toUpperCase()) : true)}
        />
        <SelectorCell<number>
          items={distances}
          itemKey={(item) => item}
          itemLabel={(item) => `${item}`}
          selected={item.distance}
          onSelect={(value) => handleChangeRow(item, "distance", value)}
        />
        <SelectorCell<number>
          items={widths}
          itemKey={(item) => item}
          itemLabel={(item) => `${item}`}
          selected={item.width}
          onSelect={(value) => handleChangeRow(item, "width", value)}
        />
        <NumericCell
          isDecimal={true}
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
    exportToCSV(data, "OF Blanket Piping Load");
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
              const from = getElementByName([...model.beams, ...model.cantilevers], item.from);
              if (from) {
                newItem = { ...newItem, from: from.name };
              } else {
                showErrorMsg(`(id: ${item.id}) - an element "${item.from}" not found!`);
              }
            }
            if (item.to) {
              const to = getElementByName([...model.beams, ...model.cantilevers], item.to);
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
          <div className={"bg-dark p-5"}>
            <div className={"table-container"}>
              <table className="table bg-gray">
                <thead>
                  <tr>
                    <GeneralCheckBoxCell data={data} onChange={handleChangeData} />
                    <th>Area No.</th>
                    <th>OF No.</th>
                    <th>From Beam</th>
                    <th>To Beam</th>
                    <th>Dist. From Left (m)</th>
                    <th>Width (m)</th>
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
        </div>
      }
      onClose={onClose}
    />
  );
}
