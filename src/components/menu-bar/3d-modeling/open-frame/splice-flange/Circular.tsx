import React, { useState, useEffect, useRef, useMemo } from "react";
import { Button } from "@blueprintjs/core";
import { CheckBoxCell } from "../../../../common/CheckBoxCell";
import { NumericCell } from "../../../../common/NumericCell";
import { SelectorCell } from "../../../../common/SelectorCell";
import { DesignMethod } from "../../../../../store/main/types";
import { changeModel, changeProjectAction } from "../../../../../store/main/actions";
import { useDispatch, useSelector } from "react-redux";
import { designMethods } from "../../../../../store/main/constants";
import {
  getElementByName,
  getTopOffset,
  MMtoM,
  convertToNamesArray,
  getIndexName,
  getNextId,
  getElementByField,
  exportToCSV,
  importFromCSV,
  checkImportedNumber,
  getCurrentUI,
} from "../../../../3d-models/utils";
import { TOpenFrame, TColumnOF, TCSpliceFlangeOF } from "../../../../../store/main/openFrameTypes";
import { OFCSpliceFlangeUI } from "../../../../../store/ui/types";
import { ApplicationState } from "../../../../../store";
import { changeOFUIAction, addEventAction } from "../../../../../store/ui/actions";
import { insertSpliceFlange, removeSpliceFlange } from "../../../../3d-models/openFrame";
import { GeneralCheckBoxCell } from "../../../../common/GeneralCheckBoxCell";
import { InputCell } from "../../../../common/InputCell";

type Props = { models: TOpenFrame[] };

const initFlange: OFCSpliceFlangeUI = {
  id: 0,
  selected: false,
  dMethod: "Method 1",
  plateThickness: 25,
  bottomPlateThickness: 25,
  plateDiameter: 400,
  bottomPlateDiameter: 400,
  elevation: 0,
  anchorBoltDiameter: 20,
  grade: "1",
  tension: 1,
  shear: 1,
  stiffenerHeight: 200,
  stiffenerNos: 6,
  stiffenerThickness: 20,
  boltBCD: 300,
  boltNos: 6,
};

export function CircularSpliceFlangeOF(props: Props) {
  const { models } = props;

  const [offsetTop, setOffsetTop] = useState<number>(0);

  const openFrameUI = useSelector((state: ApplicationState) => getCurrentUI(state)?.openFrameUI);

  const project = useSelector((state: ApplicationState) =>
    getElementByName(state.main.projects, state.main.currentProject)
  );

  const dispatch = useDispatch();

  const data = useMemo(() => {
    return openFrameUI?.spliceFlanges;
  }, [openFrameUI]);

  const flanges = useMemo(() => {
    return data?.circular ?? [];
  }, [data]);

  const tableRef = useRef<HTMLTableElement>(null);

  useEffect(() => {
    setOffsetTop(getTopOffset(tableRef.current, 1));
  }, [flanges]);

  function handleChangeData(field: string, value: any) {
    if (!openFrameUI || !data) return;
    dispatch(
      changeOFUIAction({
        ...openFrameUI,
        spliceFlanges: { ...data, [field]: value },
      })
    );
  }

  function handleChangeModel(item: OFCSpliceFlangeUI) {
    if (!openFrameUI) return;
    const model = getElementByName(models, item.model);
    const column = getElementByName(model?.columns, item.column);
    if (!(model && column)) return;
    const changed: TCSpliceFlangeOF = {
      ...item,
      name: `CSF${getIndexName(
        model.circularSF.filter((rsf) => rsf.id !== item.id),
        "CSF"
      )}`,
      column: item.column!,
    };
    if (model.circularSF.some((rsf) => rsf.id === changed.id)) {
      dispatch(
        changeModel({
          ...model,
          circularSF: model.circularSF.map((rsf) => (rsf.id === item.id ? changed : rsf)),
        } as TOpenFrame)
      );
    } else {
      const { elements } = insertSpliceFlange(openFrameUI, model, changed, "circularSF");
      dispatch(changeModel({ ...model, ...elements }));
    }
  }

  function handleDeleteModels(rsfs: OFCSpliceFlangeUI[]) {
    if (!openFrameUI) return;
    const map = new Map<string, number[]>();
    rsfs.forEach((rsf) => {
      if (rsf.model) {
        const ids = map.get(rsf.model);
        if (ids) {
          map.set(rsf.model, [...ids, rsf.id]);
        } else {
          map.set(rsf.model, [rsf.id]);
        }
      }
    });
    map.forEach((ids, key) => {
      const model = getElementByName(models, key);
      if (model) {
        let newModel = { ...model };
        ids.forEach((id) => {
          const sf = getElementByField(newModel.circularSF, "id", id);
          if (sf) {
            newModel = {
              ...newModel,
              ...removeSpliceFlange(newModel, sf, "circularSF", openFrameUI, () => {}),
            };
          }
        });
        dispatch(changeModel(newModel));
      }
    });
  }

  function handleAdd() {
    handleChangeData("circular", [...flanges, { ...initFlange, id: getNextId(flanges) }]);
  }

  function handleDeleteRows() {
    handleChangeData(
      "circular",
      flanges.filter((item) => !item.selected)
    );
    handleDeleteModels(flanges.filter((item) => item.selected));
  }

  function handleChangeRow(row: OFCSpliceFlangeUI, field: string, value: any) {
    const changed = { ...row, [field]: value };
    handleChangeData(
      "circular",
      flanges.map((dataItem) => (dataItem.id === row.id ? changed : dataItem))
    );
    field !== "selected" && handleChangeModel(changed);
  }

  function handleHardChange(row: OFCSpliceFlangeUI, field: string, value: any) {
    if (!openFrameUI) return;
    const changedRow = { ...row, [field]: value };
    handleChangeData(
      "circular",
      flanges.map((dataItem) => (dataItem.id === changedRow.id ? changedRow : dataItem))
    );
    const model = getElementByName(models, changedRow.model);
    const column = getElementByName(model?.columns, changedRow.column);
    if (!(model && column)) return;
    let changed: TCSpliceFlangeOF = {
      ...changedRow,
      name: `CSF${getIndexName(
        model.circularSF.filter((rsf) => rsf.id !== changedRow.id),
        "CSF"
      )}`,
      column: changedRow.column!,
    };
    const min = getFirstColumnY(changedRow, column);
    if (min && changed.elevation < min) {
      changed = {
        ...changed,
        elevation: min,
      };
    }
    let newModel = { ...model };
    if (newModel.circularSF.some((rsf) => rsf.id === changed.id)) {
      const { elements } = removeSpliceFlange(newModel, changed, "circularSF", openFrameUI);
      newModel = { ...newModel, ...elements };
    }
    const { elements } = insertSpliceFlange(openFrameUI, newModel, changed, "circularSF");
    dispatch(changeModel({ ...newModel, ...elements }));
  }

  function getFirstColumnY(row: OFCSpliceFlangeUI, column?: TColumnOF) {
    if (!column) return undefined;
    return column.startPos.y + 0.1 + MMtoM(row.bottomPlateThickness);
  }

  function getLastColumnY(row: OFCSpliceFlangeUI, columns: TColumnOF[], column?: TColumnOF) {
    if (!column) return undefined;
    let result = column;
    while (result.next) {
      const next = getElementByName(columns, result.next);
      if (next) {
        result = next;
      } else break;
    }
    return result.endPos.y - 0.1 - MMtoM(row.bottomPlateThickness);
  }

  function getRow(row: OFCSpliceFlangeUI) {
    const model = getElementByName(models, row.model);
    const columns = model?.columns ?? [];
    const column = getElementByName(columns, row.column);
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
          onSelect={(value) => handleHardChange(row, "model", value)}
          filterable={false}
        />
        <SelectorCell<string>
          items={convertToNamesArray(
            columns.filter((column) => {
              const shape = column.profile.shape?.trim().toUpperCase();
              return (
                (shape === "O" ||
                  shape === "PIPE" ||
                  shape === "OC PIPES" ||
                  shape === "HSS ROUND" ||
                  shape === "TUBE" ||
                  shape === "CIRCULAR HOLLOW" ||
                  shape === "SOLID ROUND") &&
                column.secondType === "GENERAL" &&
                !column.prev &&
                !flanges.some((r) => r.model === row.model && r.column === column.name)
              );
            })
          )}
          selected={row.column}
          onSelect={(value) => handleHardChange(row, "column", value)}
          itemKey={(item) => item}
          itemLabel={(item) => item}
          filterable={true}
          filter={(query, item) => (query ? item.includes(query.toUpperCase()) : true)}
        />
        <td>{column?.profile?.designation}</td>
        <NumericCell
          className="w-80"
          min={getFirstColumnY(row, column)}
          max={getLastColumnY(row, columns, column)}
          isDecimal={true}
          value={row.elevation}
          onChange={(value) => handleHardChange(row, "elevation", value)}
        />
        <SelectorCell<DesignMethod>
          items={designMethods}
          selected={row.dMethod}
          onSelect={(value) => handleChangeRow(row, "dMethod", value)}
          itemKey={(item) => item}
          itemLabel={(item) => item}
          filterable={false}
        />
        <NumericCell
          className="w-80"
          value={row.plateThickness}
          onChange={(value) => handleChangeRow(row, "plateThickness", value)}
        />
        <NumericCell
          className="w-60"
          value={row.plateDiameter}
          onChange={(value) => handleChangeRow(row, "plateDiameter", value)}
        />
        <NumericCell
          className="w-80"
          value={row.bottomPlateThickness}
          onChange={(value) => handleChangeRow(row, "bottomPlateThickness", value)}
        />
        <NumericCell
          className="w-60"
          value={row.bottomPlateDiameter}
          onChange={(value) => handleChangeRow(row, "bottomPlateDiameter", value)}
        />
        <InputCell
          className="w-60"
          value={row.grade}
          onChange={(value) => handleChangeRow(row, "grade", value)}
        />
        <NumericCell
          className="w-60"
          value={row.anchorBoltDiameter}
          onChange={(value) => handleChangeRow(row, "anchorBoltDiameter", value)}
        />
        <NumericCell
          className="w-60"
          value={row.boltBCD}
          onChange={(value) => handleChangeRow(row, "boltBCD", value)}
        />
        <NumericCell
          className="w-50"
          value={row.boltNos}
          onChange={(value) => handleChangeRow(row, "boltNos", value)}
        />
        <NumericCell
          className="w-60"
          isDecimal={true}
          value={row.tension}
          onChange={(value) => handleChangeRow(row, "tension", value)}
        />
        <NumericCell
          className="w-60"
          isDecimal={true}
          value={row.shear}
          onChange={(value) => handleChangeRow(row, "shear", value)}
        />
        <NumericCell
          className="w-80"
          value={row.stiffenerThickness}
          onChange={(value) => handleChangeRow(row, "stiffenerThickness", value)}
        />
        <NumericCell
          className="w-60"
          value={row.stiffenerHeight}
          onChange={(value) => handleChangeRow(row, "stiffenerHeight", value)}
        />
        <NumericCell
          className="w-50"
          value={row.stiffenerNos}
          onChange={(value) => handleChangeRow(row, "stiffenerNos", value)}
        />
      </tr>
    );
  }

  function handleExport() {
    exportToCSV(flanges, "OF Circular Splice Flanges");
  }

  function showErrorMsg(msg: string) {
    dispatch(addEventAction(`Circular Splice Flanges (Import): ${msg}`, "danger"));
  }

  function handleImport() {
    if (!project || !openFrameUI) return;
    importFromCSV((newData, isCSV) => {
      if (!isCSV || !Array.isArray(newData)) return;
      let changedProject = { ...project };
      let newItems: OFCSpliceFlangeUI[] = [...flanges];
      newData.forEach((item: OFCSpliceFlangeUI) => {
        let newItem: OFCSpliceFlangeUI = {
          ...initFlange,
          id: getNextId(newItems),
        };
        let model: TOpenFrame | undefined;
        let column: TColumnOF | undefined;
        if (item.model) {
          model = getElementByName(changedProject.models as TOpenFrame[], item.model);
          if (model) {
            newItem = { ...newItem, model: model.name };
            if (item.column) {
              column = getElementByName(model.columns, item.column);
              if (column) {
                newItem = { ...newItem, column: column.name };
              } else {
                showErrorMsg(`(id: ${item.id}) - an element "${item.column}" not found!`);
              }
            }
          } else {
            showErrorMsg(`(id: ${item.id}) - a model "${item.model}" not found!`);
          }
        }
        if (item.dMethod) {
          if (designMethods.includes(item.dMethod)) {
            newItem = { ...newItem, dMethod: item.dMethod };
          } else {
            showErrorMsg(`(id: ${item.id}) - Incorrect design method (${item.dMethod})!`);
          }
        }
        newItem = {
          ...newItem,
          elevation: checkImportedNumber(item.elevation, false) ?? 0,
          plateDiameter: checkImportedNumber(item.plateDiameter, false) ?? 0,
          bottomPlateDiameter: checkImportedNumber(item.bottomPlateDiameter, false) ?? 0,
          plateThickness: checkImportedNumber(item.plateThickness, false) ?? 0,
          bottomPlateThickness: checkImportedNumber(item.bottomPlateThickness, false) ?? 0,
          anchorBoltDiameter: checkImportedNumber(item.anchorBoltDiameter, false) ?? 0,
          boltBCD: checkImportedNumber(item.boltBCD, false) ?? 0,
          boltNos: checkImportedNumber(item.boltNos, false) ?? 0,
          grade: item.grade ?? "0",
          shear: checkImportedNumber(item.shear) ?? 0,
          tension: checkImportedNumber(item.tension) ?? 0,
          stiffenerHeight: checkImportedNumber(item.stiffenerHeight, false) ?? 0,
          stiffenerNos: checkImportedNumber(item.stiffenerNos, false) ?? 0,
          stiffenerThickness: checkImportedNumber(item.stiffenerThickness, false) ?? 0,
        };
        if (model) {
          const sf = model.circularSF.find((bp) => bp.column === newItem.column);
          if (sf) {
            newItem = { ...newItem, id: sf.id };
            const newSF: TCSpliceFlangeOF = {
              ...newItem,
              name: sf.name,
              column: sf.column,
            };

            const removeRes = removeSpliceFlange(model, sf, "circularSF", openFrameUI);

            let changedModel = { ...model, ...removeRes.elements };

            const insertRes = insertSpliceFlange(openFrameUI, changedModel, newSF, "circularSF");

            changedModel = { ...changedModel, ...insertRes.elements };

            changedProject = {
              ...changedProject,
              models: models.map((mItem) => (mItem.name === model!.name ? changedModel : mItem)),
            };
            newItems = newItems.map((el) => (el.id === newItem.id ? newItem : el));
          } else if (column) {
            const newSF = {
              ...newItem,
              name: `CSF${getIndexName(model.circularBP, "CSF")}`,
              column: column.name,
            };

            const { elements } = insertSpliceFlange(openFrameUI, model, newSF, "circularSF");

            const changedModel = { ...model, ...elements };

            changedProject = {
              ...changedProject,
              models: models.map((mItem) => (mItem.name === model!.name ? changedModel : mItem)),
            };
            newItems.push(newItem);
          } else {
            newItems.push(newItem);
          }
        } else {
          newItems.push(newItem);
        }
      });
      handleChangeData("circular", newItems);
      dispatch(changeProjectAction(changedProject));
    });
  }

  return (
    <div className="d-flex f-column">
      <div className="hr" />
      <div className="d-flex f-ai-center label-light bg-dark">
        <span>Circular</span>
        <Button small icon="trash" text="Delete" intent="warning" onClick={handleDeleteRows} />
        <Button small icon="export" text="Export to CSV" intent="success" onClick={handleExport} />
        <Button
          small
          icon="import"
          text="Import from CSV"
          intent="success"
          onClick={handleImport}
        />
        <Button small icon="plus" text="Add Row" intent="primary" onClick={handleAdd} />
      </div>
      <div className="hr" />
      <div className="p-5">
        <div className="table-container">
          <table ref={tableRef} className="table bg-gray">
            <thead>
              <tr>
                <GeneralCheckBoxCell
                  rowSpan={2}
                  data={flanges}
                  onChange={(data) => handleChangeData("circular", data)}
                />
                <th rowSpan={2}>OF No.</th>
                <th rowSpan={2}>Column No.</th>
                <th rowSpan={2}>Column Profile</th>
                <th rowSpan={2}>Elevation (m)</th>
                <th rowSpan={2}>Design Method</th>
                <th colSpan={2}>Top Splice Plate</th>
                <th colSpan={2}>Bottom Splice Plate</th>
                <th colSpan={2}>Splice Bolt Size</th>
                <th colSpan={2}>Splice Bolt Location</th>
                <th colSpan={2}>Splice Bolt Capacity</th>
                <th colSpan={3}>Stiffener Plate</th>
              </tr>
              <tr>
                <th style={{ top: offsetTop }}>Thickness (mm)</th>
                <th style={{ top: offsetTop }}>Dia (mm)</th>
                <th style={{ top: offsetTop }}>Thickness (mm)</th>
                <th style={{ top: offsetTop }}>Dia (mm)</th>
                <th style={{ top: offsetTop }}>Grade</th>
                <th style={{ top: offsetTop }}>Dia (mm)</th>
                <th style={{ top: offsetTop }}>BCD (mm)</th>
                <th style={{ top: offsetTop }}>Nos</th>
                <th style={{ top: offsetTop }}>Tension (kN)</th>
                <th style={{ top: offsetTop }}>Shear (kN)</th>
                <th style={{ top: offsetTop }}>Thickness (mm)</th>
                <th style={{ top: offsetTop }}>Height (mm)</th>
                <th style={{ top: offsetTop }}>Nos</th>
              </tr>
            </thead>
            <tbody>{flanges.map((item) => getRow(item))}</tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
