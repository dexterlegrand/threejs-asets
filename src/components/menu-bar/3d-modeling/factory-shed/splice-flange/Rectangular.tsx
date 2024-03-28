import React, { useState, useEffect, useRef, useMemo } from "react";
import { Button } from "@blueprintjs/core";
import { CheckBoxCell } from "../../../../common/CheckBoxCell";
import { NumericCell } from "../../../../common/NumericCell";
import { SelectorCell } from "../../../../common/SelectorCell";
import { DesignMethod } from "../../../../../store/main/types";
import { changeModel, changeProjectAction } from "../../../../../store/main/actions";
import { useDispatch, useSelector } from "react-redux";
import { designMethods, stiffenerCounts, boltCounts } from "../../../../../store/main/constants";
import {
  getElementByName,
  getTopOffset,
  MMtoM,
  getIndexName,
  getNextId,
  convertToNamesArray,
  getElementByField,
  checkImportedNumber,
  importFromCSV,
  exportToCSV,
  getCurrentUI,
} from "../../../../3d-models/utils";
import { TOpenFrame, TRSpliceFlangeOF, TColumnOF } from "../../../../../store/main/openFrameTypes";
import { ApplicationState } from "../../../../../store";
import { OFRSpliceFlangeUI } from "../../../../../store/ui/types";
import { changeOFUIAction, addEventAction } from "../../../../../store/ui/actions";
import { insertSpliceFlange, removeSpliceFlange } from "../../../../3d-models/openFrame";
import { GeneralCheckBoxCell } from "../../../../common/GeneralCheckBoxCell";
import { InputCell } from "../../../../common/InputCell";

type Props = { models: TOpenFrame[] };

const initFlange: OFRSpliceFlangeUI = {
  id: 0,
  selected: false,
  dMethod: "Method 1",
  elevation: 0,
  plateThickness: 20,
  plateLength: 500,
  plateWidth: 500,
  bottomPlateThickness: 20,
  bottomPlateLength: 500,
  bottomPlateWidth: 500,
  grade: "1",
  anchorBoltDiameter: 20,
  countAlongLength: 4,
  countAlongWidth: 4,
  firstRowFromCenter_L: 50,
  rowToRow_L: 100,
  firstRowFromCenter_W: 50,
  rowToRow_W: 100,
  tension: 1,
  shear: 1,
  stiffenerThickness: 20,
  stiffenerHeight: 200,
  stiffenerAlongWeb: 3,
  stiffenerAlongFlange: 3,
};

export function RectangularSpliceFlangeFS(props: Props) {
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
    return data?.rectangular ?? [];
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

  function handleChangeModel(item: OFRSpliceFlangeUI) {
    if (!openFrameUI) return;
    const model = getElementByName(models, item.model);
    const column = getElementByName(model?.columns, item.column);
    if (!(model && column)) return;
    const changed: TRSpliceFlangeOF = {
      ...item,
      name: `RSF${getIndexName(
        model.rectangularSF.filter((rsf) => rsf.id !== item.id),
        "RSF"
      )}`,
      column: item.column!,
    };
    if (model.rectangularSF.some((rsf) => rsf.id === changed.id)) {
      dispatch(
        changeModel({
          ...model,
          rectangularSF: model.rectangularSF.map((rsf) => (rsf.id === item.id ? changed : rsf)),
        } as TOpenFrame)
      );
    } else {
      const { elements } = insertSpliceFlange(openFrameUI, model, changed, "rectangularSF");
      dispatch(changeModel({ ...model, ...elements }));
    }
  }

  function handleDeleteModels(rsfs: OFRSpliceFlangeUI[]) {
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
          const sf = getElementByField(newModel.rectangularSF, "id", id);
          if (sf) {
            newModel = {
              ...newModel,
              ...removeSpliceFlange(newModel, sf, "rectangularSF", openFrameUI, () => {}),
            };
          }
        });
        dispatch(changeModel(newModel));
      }
    });
  }

  function handleAddRow() {
    handleChangeData("rectangular", [...flanges, { ...initFlange, id: getNextId(flanges) }]);
  }

  function handleDeleteRows() {
    handleChangeData(
      "rectangular",
      flanges.filter((item) => !item.selected)
    );
    handleDeleteModels(flanges.filter((item) => item.selected));
  }

  function handleChangeRow(row: OFRSpliceFlangeUI, field: string, value: any) {
    const changed = { ...row, [field]: value };
    handleChangeData(
      "rectangular",
      flanges.map((dataItem) => (dataItem.id === row.id ? changed : dataItem))
    );
    console.log(changed); // error message
    field !== "selected" && handleChangeModel(changed);
  }

  function handleHardChange(row: OFRSpliceFlangeUI, field: string, value: any) {
    if (!openFrameUI) return;
    const changedRow = { ...row, [field]: value };
    handleChangeData(
      "rectangular",
      flanges.map((dataItem) => (dataItem.id === changedRow.id ? changedRow : dataItem))
    );
    const model = getElementByName(models, changedRow.model);
    const column = getElementByName(model?.columns, changedRow.column);
    if (!(model && column)) return;
    let changed: TRSpliceFlangeOF = {
      ...changedRow,
      name: `RSF${getIndexName(
        model.rectangularSF.filter((rsf) => rsf.id !== changedRow.id),
        "RSF"
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
    if (newModel.rectangularSF.some((rsf) => rsf.id === changed.id)) {
      const { elements } = removeSpliceFlange(newModel, changed, "rectangularSF", openFrameUI);
      newModel = { ...newModel, ...elements };
    }
    const { elements } = insertSpliceFlange(openFrameUI, newModel, changed, "rectangularSF");
    dispatch(changeModel({ ...newModel, ...elements }));
  }

  function getFirstColumnY(row: OFRSpliceFlangeUI, column?: TColumnOF) {
    if (!column) return undefined;
    return column.startPos.y + 0.1 + MMtoM(row.bottomPlateThickness);
  }

  function getLastColumnY(row: OFRSpliceFlangeUI, columns: TColumnOF[], column?: TColumnOF) {
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

  function getRow(row: OFRSpliceFlangeUI) {
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
          onSelect={(value) =>
            row.model ? handleHardChange(row, "model", value) : handleChangeRow(row, "model", value)
          }
          filterable={false}
        />
        <SelectorCell<string>
          items={convertToNamesArray(
            columns.filter((column) => {
              return (
                column.profile.shape === "I" &&
                !flanges.some((r) => r.model === row.model && r.column === column.name)
              );
            })
          )}
          selected={row.column}
          onSelect={(value) =>
            row.column
              ? handleHardChange(row, "column", value)
              : handleChangeRow(row, "column", value)
          }
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
        {/* <SelectorCell<DesignMethod>
          items={designMethods}
          selected={row.dMethod}
          onSelect={(value) => handleChangeRow(row, "dMethod", value)}
          itemKey={(item) => item}
          itemLabel={(item) => item}
          filterable={false}
        /> */}
        <NumericCell
          className="w-80"
          value={row.plateThickness}
          onChange={(value) => handleChangeRow(row, "plateThickness", value)}
        />
        <NumericCell
          className="w-60"
          value={row.plateLength}
          onChange={(value) => handleChangeRow(row, "plateLength", value)}
        />
        <NumericCell
          className="w-60"
          value={row.plateWidth}
          onChange={(value) => handleChangeRow(row, "plateWidth", value)}
        />
        <NumericCell
          className="w-80"
          value={row.bottomPlateThickness}
          onChange={(value) => handleChangeRow(row, "bottomPlateThickness", value)}
        />
        <NumericCell
          className="w-60"
          value={row.bottomPlateLength}
          onChange={(value) => handleChangeRow(row, "bottomPlateLength", value)}
        />
        <NumericCell
          className="w-60"
          value={row.bottomPlateWidth}
          onChange={(value) => handleChangeRow(row, "bottomPlateWidth", value)}
        />
        <InputCell
          className="w-60"
          value={row.grade}
          onChange={(value) => handleChangeRow(row, "grade", value)}
        />
        <NumericCell
          className="w-50"
          value={row.anchorBoltDiameter}
          onChange={(value) => handleChangeRow(row, "anchorBoltDiameter", value)}
        />
        <SelectorCell<number>
          items={boltCounts}
          selected={row.countAlongLength}
          onSelect={(value) => handleChangeRow(row, "countAlongLength", value)}
          itemKey={(item) => item}
          itemLabel={(item) => `${item}`}
          filterable={false}
        />
        <SelectorCell<number>
          items={boltCounts}
          selected={row.countAlongWidth}
          onSelect={(value) => handleChangeRow(row, "countAlongWidth", value)}
          itemKey={(item) => item}
          itemLabel={(item) => `${item}`}
          filterable={false}
        />
        <NumericCell
          className="w-60"
          value={row.firstRowFromCenter_L}
          onChange={(value) => handleChangeRow(row, "firstRowFromCenter_L", value)}
        />
        <NumericCell
          className="w-100"
          value={row.rowToRow_L}
          onChange={(value) => handleChangeRow(row, "rowToRow_L", value)}
        />
        <NumericCell
          className="w-60"
          value={row.firstRowFromCenter_W}
          onChange={(value) => handleChangeRow(row, "firstRowFromCenter_W", value)}
        />
        <NumericCell
          className="w-100"
          value={row.rowToRow_W}
          onChange={(value) => handleChangeRow(row, "rowToRow_W", value)}
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
        <SelectorCell<number>
          items={stiffenerCounts}
          selected={row.stiffenerAlongWeb}
          onSelect={(value) => handleChangeRow(row, "stiffenerAlongWeb", value)}
          itemKey={(item) => item}
          itemLabel={(item) => `${item}`}
          filterable={false}
        />
        <SelectorCell<number>
          items={stiffenerCounts}
          selected={row.stiffenerAlongFlange}
          onSelect={(value) => handleChangeRow(row, "stiffenerAlongFlange", value)}
          itemKey={(item) => item}
          itemLabel={(item) => `${item}`}
          filterable={false}
        />
      </tr>
    );
  }

  function handleExport() {
    exportToCSV(flanges, "OF Rectangular Splice Flanges");
  }

  function showErrorMsg(msg: string) {
    dispatch(addEventAction(`Rectangular Splice Flanges (Import): ${msg}`, "danger"));
  }

  function handleImport() {
    if (!project || !openFrameUI) return;
    importFromCSV((newData, isCSV) => {
      if (!isCSV || !Array.isArray(newData)) return;
      let changedProject = { ...project };
      let newItems: OFRSpliceFlangeUI[] = [...flanges];
      newData.forEach((item: OFRSpliceFlangeUI) => {
        let newItem: OFRSpliceFlangeUI = {
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
        // if (item.dMethod) {
        //   if (designMethods.includes(item.dMethod)) {
        //     newItem = { ...newItem, dMethod: item.dMethod };
        //   } else {
        //     showErrorMsg(`(id: ${item.id}) - Incorrect design method (${item.dMethod})!`);
        //   }
        // }
        newItem = {
          ...newItem,
          elevation: checkImportedNumber(item.elevation, false) ?? 0,
          plateWidth: checkImportedNumber(item.plateWidth, false) ?? 0,
          plateLength: checkImportedNumber(item.plateLength, false) ?? 0,
          plateThickness: checkImportedNumber(item.plateThickness, false) ?? 0,
          bottomPlateLength: checkImportedNumber(item.bottomPlateLength, false) ?? 0,
          bottomPlateWidth: checkImportedNumber(item.bottomPlateWidth, false) ?? 0,
          bottomPlateThickness: checkImportedNumber(item.bottomPlateThickness, false) ?? 0,
          anchorBoltDiameter: checkImportedNumber(item.anchorBoltDiameter, false) ?? 0,
          grade: item.grade ?? "0",
          shear: checkImportedNumber(item.shear) ?? 0,
          tension: checkImportedNumber(item.tension) ?? 0,
          stiffenerHeight: checkImportedNumber(item.stiffenerHeight, false) ?? 0,
          stiffenerThickness: checkImportedNumber(item.stiffenerThickness, false) ?? 0,
          rowToRow_L: checkImportedNumber(item.rowToRow_L, false) ?? 0,
          rowToRow_W: checkImportedNumber(item.rowToRow_W, false) ?? 0,
          firstRowFromCenter_L: checkImportedNumber(item.firstRowFromCenter_L, false) ?? 0,
          firstRowFromCenter_W: checkImportedNumber(item.firstRowFromCenter_W, false) ?? 0,
        };
        if (item.countAlongLength) {
          const value = checkImportedNumber(item.countAlongLength, false) ?? 0;
          if (boltCounts.includes(value)) {
            // @ts-ignore
            newItem = { ...newItem, countAlongLength: value };
          }
        }
        if (item.countAlongWidth) {
          const value = checkImportedNumber(item.countAlongWidth, false) ?? 0;
          if (boltCounts.includes(value)) {
            // @ts-ignore
            newItem = { ...newItem, countAlongWidth: value };
          }
        }
        if (item.stiffenerAlongFlange) {
          const value = checkImportedNumber(item.stiffenerAlongFlange, false) ?? 0;
          if (stiffenerCounts.includes(value)) {
            // @ts-ignore
            newItem = { ...newItem, stiffenerAlongFlange: value };
          }
        }
        if (item.stiffenerAlongWeb) {
          const value = checkImportedNumber(item.stiffenerAlongWeb, false) ?? 0;
          if (stiffenerCounts.includes(value)) {
            // @ts-ignore
            newItem = { ...newItem, stiffenerAlongWeb: value };
          }
        }
        if (model) {
          const sf = model.rectangularSF.find((bp) => bp.column === newItem.column);
          if (sf) {
            newItem = { ...newItem, id: sf.id };
            const newSF: TRSpliceFlangeOF = {
              ...newItem,
              name: sf.name,
              column: sf.column,
            };

            const removeRes = removeSpliceFlange(model, sf, "rectangularSF", openFrameUI);

            let changedModel = { ...model, ...removeRes.elements };

            const insertRes = insertSpliceFlange(openFrameUI, changedModel, newSF, "rectangularSF");

            changedModel = { ...changedModel, ...insertRes.elements };

            changedProject = {
              ...changedProject,
              models: models.map((mItem) => (mItem.name === model!.name ? changedModel : mItem)),
            };
            newItems = newItems.map((el) => (el.id === newItem.id ? newItem : el));
          } else if (column) {
            const newSF = {
              ...newItem,
              name: `RSF${getIndexName(model.circularBP, "RSF")}`,
              column: column.name,
            };

            const { elements } = insertSpliceFlange(openFrameUI, model, newSF, "rectangularSF");

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
      handleChangeData("rectangular", newItems);
      dispatch(changeProjectAction(changedProject));
    });
  }

  return (
    <div className="d-flex f-column">
      <div className="hr" />
      <div className="d-flex f-ai-center label-light bg-dark">
        <span>Rectangular</span>
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
      <div className="p-5">
        <div className="table-container">
          <table ref={tableRef} className="table bg-gray">
            <thead>
              <tr>
                <GeneralCheckBoxCell
                  rowSpan={2}
                  data={flanges}
                  onChange={(data) => handleChangeData("rectangular", data)}
                />
                <th rowSpan={2}>FS No.</th>
                <th rowSpan={2}>Column No.</th>
                <th rowSpan={2}>Column Profile</th>
                <th rowSpan={2}>Elevation (m)</th>
                {/* <th rowSpan={2}>Design Method</th> */}
                <th colSpan={3}>Top Splice Plate</th>
                <th colSpan={3}>Bottom Splice Plate</th>
                <th colSpan={2}>Splice Bolt Size</th>
                <th colSpan={2}>No of bolts</th>
                <th colSpan={2}>Spacing along Length (mm)</th>
                <th colSpan={2}>Spacing along Width (mm)</th>
                <th colSpan={2}>Splice Bolt Capacity</th>
                <th colSpan={2}>Stiffener Plate Size</th>
                <th colSpan={2}>Stiffener Plate Nos</th>
              </tr>
              <tr>
                <th style={{ top: offsetTop }}>Thickness (mm)</th>
                <th style={{ top: offsetTop }}>Length (mm)</th>
                <th style={{ top: offsetTop }}>Width (mm)</th>
                <th style={{ top: offsetTop }}>Thickness (mm)</th>
                <th style={{ top: offsetTop }}>Length (mm)</th>
                <th style={{ top: offsetTop }}>Width (mm)</th>
                <th style={{ top: offsetTop }}>Grade</th>
                <th style={{ top: offsetTop }}>Dia (mm)</th>
                <th style={{ top: offsetTop }}>Along Length</th>
                <th style={{ top: offsetTop }}>Along Width</th>
                <th style={{ top: offsetTop }}>1st Row from Center</th>
                <th style={{ top: offsetTop }}>Row to Row</th>
                <th style={{ top: offsetTop }}>1st Row from Center</th>
                <th style={{ top: offsetTop }}>Row to Row</th>
                <th style={{ top: offsetTop }}>Tension (kN)</th>
                <th style={{ top: offsetTop }}>Shear (kN)</th>
                <th style={{ top: offsetTop }}>Thickness (mm)</th>
                <th style={{ top: offsetTop }}>Height (mm)</th>
                <th style={{ top: offsetTop }}>Along Web</th>
                <th style={{ top: offsetTop }}>Along Flange</th>
              </tr>
            </thead>
            <tbody>{flanges.map((item) => getRow(item))}</tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
