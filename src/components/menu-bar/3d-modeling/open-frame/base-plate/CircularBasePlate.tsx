import React, { useState, useEffect, useRef, useMemo } from "react";
import { Button, FormGroup, Tooltip } from "@blueprintjs/core";
import { SimpleSelector } from "../../../../common/SimpleSelector";
import { CheckBoxCell } from "../../../../common/CheckBoxCell";
import { NumericCell } from "../../../../common/NumericCell";
import { SelectorCell } from "../../../../common/SelectorCell";
import { DesignMethod } from "../../../../../store/main/types";
import { useDispatch, useSelector } from "react-redux";
import { concreteGrade, designMethods } from "../../../../../store/main/constants";
import { changeModel, changeProjectAction } from "../../../../../store/main/actions";
import {
  getTopOffset,
  convertToNamesArray,
  getElementByName,
  getNextId,
  getIndexName,
  exportToCSV,
  importFromCSV,
  checkImportedNumber,
  getCurrentUI,
} from "../../../../3d-models/utils";
import { ApplicationState } from "../../../../../store";
import { TOpenFrame, TCBasePlateOF, TColumnOF } from "../../../../../store/main/openFrameTypes";
import { OFCBasePlateUI } from "../../../../../store/ui/types";
import { changeOFUIAction, addEventAction } from "../../../../../store/ui/actions";
import { GeneralCheckBoxCell } from "../../../../common/GeneralCheckBoxCell";
import { InputCell } from "../../../../common/InputCell";

type Props = { models: TOpenFrame[] };

const initPlate = {
  id: 0,
  selected: false,
  dMethod: "Method 1" as DesignMethod,
  plateThickness: 25,
  plateDiameter: 400,
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

export function CircularBasePlateOF(props: Props) {
  const { models } = props;

  const [offsetTop, setOffsetTop] = useState<number>(0);

  const openFrameUI = useSelector((state: ApplicationState) => getCurrentUI(state)?.openFrameUI);

  const project = useSelector((state: ApplicationState) =>
    getElementByName(state.main.projects, state.main.currentProject)
  );

  const dispatch = useDispatch();

  const data = useMemo(() => {
    return openFrameUI?.basePlates;
  }, [openFrameUI]);

  const plates = useMemo(() => {
    return data?.circular ?? [];
  }, [data]);

  const tableRef = useRef<HTMLTableElement>(null);

  useEffect(() => {
    setOffsetTop(getTopOffset(tableRef.current, 1));
  }, [plates]);

  function handleChangeData(field: string, value: any) {
    if (!openFrameUI || !data) return;
    dispatch(
      changeOFUIAction({
        ...openFrameUI,
        basePlates: { ...data, [field]: value },
      })
    );
  }

  function handleChangeModel(item: OFCBasePlateUI) {
    const model = getElementByName(models, item.model);
    const column = getElementByName(model?.columns, item.column);
    if (!model || !column) return;
    const changed: TCBasePlateOF = {
      ...item,
      name: `CBP${getIndexName(model.circularBP, "CBP")}`,
      column: item.column!,
    };
    dispatch(
      changeModel({
        ...model,
        circularBP: model.circularBP.some((cbp) => cbp.id === changed.id)
          ? model.circularBP.map((cbp) => (cbp.id === item.id ? changed : cbp))
          : [...model.circularBP, changed],
      } as TOpenFrame)
    );
  }

  function handleDeleteModels(cbps: OFCBasePlateUI[]) {
    const map = new Map<string, number[]>();
    cbps.forEach((cbp) => {
      if (cbp.model) {
        const ids = map.get(cbp.model);
        if (ids) {
          map.set(cbp.model, [...ids, cbp.id]);
        } else {
          map.set(cbp.model, [cbp.id]);
        }
      }
    });
    map.forEach((ids, key) => {
      const model = getElementByName(models, key);
      if (model) {
        dispatch(
          changeModel({
            ...model,
            circularBP: model.circularBP.filter((item) => !ids.some((id) => id === item.id)),
          } as TOpenFrame)
        );
      }
    });
  }

  function handleAdd() {
    handleChangeData("circular", [...plates, { ...initPlate, id: getNextId(plates) }]);
  }

  function handleAddForAll() {
    const plate = plates.find((plate) => plate.selected);
    if (!plate) {
      dispatch(addEventAction(`Base Plates: Select an entry!`, "danger"));
      return;
    }
    if (!plate.model) {
      dispatch(addEventAction(`Base Plates: Select a model in the selected entry!`, "danger"));
      return;
    }
    const model = getElementByName(models, plate.model);
    if (!model) {
      dispatch(addEventAction(`Base Plates: Model not found!`, "danger"));
      return;
    }
    let newPlates: OFCBasePlateUI[] = [];
    model.columns.forEach((column) => {
      if (column.startPos.y === model.baseElevation) {
        newPlates = [
          ...newPlates,
          {
            ...plate,
            id: newPlates.length,
            selected: false,
            column: column.name,
          },
        ];
      }
    });
    handleChangeData("circular", newPlates);
    dispatch(
      changeModel({
        ...model,
        circularBP: newPlates.map((bp) => ({
          ...bp,
          name: `CBP${bp.id + 1}`,
          column: bp.column,
        })),
      } as TOpenFrame)
    );
  }

  function handleDelete() {
    handleDeleteModels(plates.filter((item) => item.selected));
    handleChangeData(
      "circular",
      plates.filter((item) => !item.selected)
    );
  }

  function handleChange(item: OFCBasePlateUI, field: string, value: any) {
    const changed = { ...item, [field]: value };
    handleChangeData(
      "circular",
      plates.map((dataItem) => (dataItem.id === item.id ? changed : dataItem))
    );
    handleChangeModel(changed);
  }

  function getRow(item: OFCBasePlateUI) {
    const model = getElementByName(models, item.model);
    const columns =
      model?.columns.filter((column) => column.startPos.y === model.baseElevation) ?? [];
    const column = getElementByName(columns, item.column);
    return (
      <tr key={item.id}>
        <CheckBoxCell
          key={item.id}
          value={item.selected}
          onChange={(value) => handleChange(item, "selected", value)}
        />
        <SelectorCell<string>
          items={convertToNamesArray(models)}
          itemKey={(item) => item}
          itemLabel={(item) => item}
          selected={item.model}
          onSelect={(value) => handleChange(item, "model", value)}
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
                !plates.some((r) => r.model === item.model && r.column === column.name)
              );
            })
          )}
          selected={item.column}
          onSelect={(value) => handleChange(item, "column", value)}
          itemKey={(item) => item}
          itemLabel={(item) => item}
          filterable={true}
          filter={(query, item) => (query ? item.includes(query.toUpperCase()) : true)}
        />
        <td>{column?.profile?.designation}</td>
        <SelectorCell<DesignMethod>
          items={designMethods}
          selected={item.dMethod}
          onSelect={(value) => handleChange(item, "dMethod", value)}
          itemKey={(item) => item}
          itemLabel={(item) => item}
          filterable={false}
        />
        <NumericCell
          className="w-80"
          value={item.plateThickness}
          onChange={(value) => handleChange(item, "plateThickness", value)}
        />
        <NumericCell
          className="w-60"
          value={item.plateDiameter}
          onChange={(value) => handleChange(item, "plateDiameter", value)}
        />
        <InputCell
          className="w-60"
          value={item.grade}
          onChange={(value) => handleChange(item, "grade", value)}
        />
        <NumericCell
          className="w-60"
          value={item.anchorBoltDiameter}
          onChange={(value) => handleChange(item, "anchorBoltDiameter", value)}
        />
        <NumericCell
          className="w-60"
          value={item.boltBCD}
          onChange={(value) => handleChange(item, "boltBCD", value)}
        />
        <NumericCell
          className="w-50"
          value={item.boltNos}
          onChange={(value) => handleChange(item, "boltNos", value)}
        />
        <NumericCell
          className="w-60"
          isDecimal={true}
          value={item.tension}
          onChange={(value) => handleChange(item, "tension", value)}
        />
        <NumericCell
          className="w-60"
          isDecimal={true}
          value={item.shear}
          onChange={(value) => handleChange(item, "shear", value)}
        />
        <NumericCell
          className="w-80"
          value={item.stiffenerThickness}
          onChange={(value) => handleChange(item, "stiffenerThickness", value)}
        />
        <NumericCell
          className="w-60"
          value={item.stiffenerHeight}
          onChange={(value) => handleChange(item, "stiffenerHeight", value)}
        />
        <NumericCell
          className="w-50"
          value={item.stiffenerNos}
          onChange={(value) => handleChange(item, "stiffenerNos", value)}
        />
      </tr>
    );
  }

  function handleExport() {
    exportToCSV(plates, "OF Circular Base Plates");
  }

  function showErrorMsg(msg: string) {
    dispatch(addEventAction(`Circular Base Plates (Import): ${msg}`, "danger"));
  }

  function handleImport() {
    if (!project) return;
    importFromCSV((newData, isCSV) => {
      if (!isCSV || !Array.isArray(newData)) return;
      let changedProject = { ...project };
      let newItems: OFCBasePlateUI[] = [...plates];
      newData.forEach((item: OFCBasePlateUI) => {
        let newItem: OFCBasePlateUI = {
          ...initPlate,
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
          plateDiameter: checkImportedNumber(item.plateDiameter, false) ?? 0,
          plateThickness: checkImportedNumber(item.plateThickness, false) ?? 0,
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
          const bp = model.circularBP.find((bp) => bp.column === newItem.column);
          if (bp) {
            newItem = { ...newItem, id: bp.id };
            const newBP = {
              ...newItem,
              name: bp.name,
              column: bp.column,
            };
            changedProject = {
              ...changedProject,
              models: models.map((mItem) =>
                mItem.name === model!.name
                  ? {
                      ...model!,
                      circularBP: model!.circularBP.map((cbp) =>
                        cbp.id === newItem.id ? newBP : cbp
                      ),
                    }
                  : mItem
              ),
            };
            newItems = newItems.map((el) => (el.id === newItem.id ? newItem : el));
          } else if (column) {
            const newBP = {
              ...newItem,
              name: `CBP${getIndexName(model.circularBP, "CBP")}`,
              column: column.name,
            };
            changedProject = {
              ...changedProject,
              models: models.map((mItem) =>
                mItem.name === model!.name
                  ? {
                      ...model!,
                      circularBP: [...model!.circularBP, newBP],
                    }
                  : mItem
              ),
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
        <span>Circular Base Plate</span>
        <Button small icon="trash" text="Delete" intent="warning" onClick={handleDelete} />
        <Button small icon="export" text="Export to CSV" intent="success" onClick={handleExport} />
        <Button
          small
          icon="import"
          text="Import from CSV"
          intent="success"
          onClick={handleImport}
        />
        <Button small icon="plus" text="Add Row" intent="primary" onClick={handleAdd} />
        <FormGroup className="no-m" label="Concrete Grade" inline>
          <SimpleSelector<string>
            items={concreteGrade}
            selected={data?.concreteGrade}
            onSelect={(concreteGrade) => handleChangeData("concreteGrade", concreteGrade)}
            itemLabel={(item) => item}
            className="fill-select w-150"
          />
        </FormGroup>
        <Tooltip content="Select an entry with necessary data">
          <Button
            small
            icon="add"
            text="Add for All"
            intent="danger"
            onClick={handleAddForAll}
            style={{ marginLeft: 20 }}
          />
        </Tooltip>
      </div>
      <div className="hr" />
      <div className="p-5">
        <div className="table-container">
          <table ref={tableRef} className="table bg-gray">
            <thead>
              <tr>
                <GeneralCheckBoxCell
                  rowSpan={2}
                  data={plates}
                  onChange={(data) => handleChangeData("circular", data)}
                />
                <th rowSpan={2}>OF No.</th>
                <th rowSpan={2}>Column No.</th>
                <th rowSpan={2}>Column Profile</th>
                <th rowSpan={2}>Design Method</th>
                <th colSpan={2}>Base Plate</th>
                <th colSpan={2}>Anchor Bolt Size</th>
                <th colSpan={2}>Anchor Bolt Location</th>
                <th colSpan={2}>Anchor Bolt Capacity</th>
                <th colSpan={3}>Stiffener Plate</th>
              </tr>
              <tr>
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
            <tbody>{plates.map((item) => getRow(item))}</tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
