import React, { useState, useEffect, useRef, useMemo } from "react";
import { Button, FormGroup, Tooltip } from "@blueprintjs/core";
import { SimpleSelector } from "../../../../common/SimpleSelector";
import { CheckBoxCell } from "../../../../common/CheckBoxCell";
import { NumericCell } from "../../../../common/NumericCell";
import { SelectorCell } from "../../../../common/SelectorCell";
import { DesignMethod, ShearResistedType, TShearKeyDetails } from "../../../../../store/main/types";
import { useDispatch, useSelector } from "react-redux";
import { changeModel, changeProjectAction } from "../../../../../store/main/actions";
import {
  designMethods,
  boltCounts,
  stiffenerCounts,
  concreteGrade,
} from "../../../../../store/main/constants";
import {
  getTopOffset,
  getElementByName,
  getIndexName,
  getNextId,
  convertToNamesArray,
  checkImportedNumber,
  exportToCSV,
  importFromCSV,
  getCurrentUI,
  getCurrentProject,
} from "../../../../3d-models/utils";
import { ApplicationState } from "../../../../../store";
import { TOpenFrame, TRBasePlateOF, TColumnOF } from "../../../../../store/main/openFrameTypes";
import { changeOFUIAction, addEventAction } from "../../../../../store/ui/actions";
import { OFRBasePlateUI } from "../../../../../store/ui/types";
import { GeneralCheckBoxCell } from "../../../../common/GeneralCheckBoxCell";
import { InputCell } from "../../../../common/InputCell";
import { ShearKeyDetails } from "../../common/rectangular-base-plate/ShearKeyDetails";

type Props = { models: TOpenFrame[] };

const initPlate = {
  id: 0,
  selected: false,
  dMethod: "Method 1" as DesignMethod,
  plateThickness: 25,
  plateLength: 400,
  plateWidth: 400,
  anchorBoltDiameter: 20,
  countAlongLength: 4,
  countAlongWidth: 4,
  firstRowFromCenter_L: 50,
  firstRowFromCenter_W: 50,
  rowToRow_L: 100,
  rowToRow_W: 100,
  grade: "1",
  tension: 1,
  shear: 1,
  stiffenerHeight: 200,
  stiffenerThickness: 20,
  stiffenerAlongFlange: 3,
  stiffenerAlongWeb: 3,
  shearResistedBy: "Shear Key",
  shearKeyDetails: {
    overalDepth: 400,
    flangeWidth: 400,
    webThick: 25,
    flangeThick: 25,
    keyLength: 325,
    groutThickness: 25,
    material: "IS2062 E250 GR B",
  },
};

export function RectangularBasePlateFS(props: Props) {
  const { models } = props;

  const [offsetTop, setOffsetTop] = useState<number>(0);
  const [dlg, setDlg] = useState<JSX.Element>();

  const openFrameUI = useSelector((state: ApplicationState) => getCurrentUI(state)?.openFrameUI);

  const project = useSelector((state: ApplicationState) => getCurrentProject(state));

  const dispatch = useDispatch();

  const data = useMemo(() => {
    return openFrameUI?.basePlates;
  }, [openFrameUI]);

  const plates = useMemo(() => {
    return data?.rectangular ?? [];
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

  function handleChangeModel(item: OFRBasePlateUI) {
    const model = getElementByName(models, item.model);
    const column = getElementByName(model?.columns, item.column);
    if (!(model && column)) return;
    const changed: TRBasePlateOF = {
      ...item,
      name: `RBP${getIndexName(model.rectangularBP, "RBP")}`,
      column: item.column!,
    };
    dispatch(
      changeModel({
        ...model,
        rectangularBP: model.rectangularBP.some((rbp) => rbp.id === changed.id)
          ? model.rectangularBP.map((rbp) => (rbp.id === item.id ? changed : rbp))
          : [...model.rectangularBP, changed],
      } as TOpenFrame)
    );
  }

  function handleDeleteModels(rbps: OFRBasePlateUI[]) {
    const map = new Map<string, number[]>();
    rbps.forEach((rbp) => {
      if (rbp.model) {
        const ids = map.get(rbp.model);
        if (ids) {
          map.set(rbp.model, [...ids, rbp.id]);
        } else {
          map.set(rbp.model, [rbp.id]);
        }
      }
    });
    map.forEach((ids, key) => {
      const model = getElementByName(models, key);
      if (model) {
        dispatch(
          changeModel({
            ...model,
            rectangularBP: model.rectangularBP.filter((item) => !ids.some((id) => id === item.id)),
          } as TOpenFrame)
        );
      }
    });
  }

  function handleAdd() {
    handleChangeData("rectangular", [...plates, { ...initPlate, id: getNextId(plates) }]);
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
    let newPlates: OFRBasePlateUI[] = [];
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
    handleChangeData("rectangular", newPlates);
    dispatch(
      changeModel({
        ...model,
        rectangularBP: newPlates.map((bp) => ({
          ...bp,
          name: `RBP${bp.id + 1}`,
          column: bp.column,
        })),
      } as TOpenFrame)
    );
  }

  function handleDelete() {
    handleDeleteModels(plates.filter((item) => item.selected));
    handleChangeData(
      "rectangular",
      plates.filter((item) => !item.selected)
    );
  }

  function setShearKeyDetails(row: any): TShearKeyDetails {
    const model = models.find((m) => m.name === row.model);
    const column = model?.columns.find((c) => c.name === row.data.column);
    const profile = column?.profile;
    return {
      overalDepth: profile?.d_global ?? 400,
      flangeWidth: profile?.bf_global ?? 400,
      webThick: profile?.tw_global ?? 25,
      flangeThick: profile?.tf_global ?? 25,
      keyLength: 325,
      groutThickness: 25,
      material: "IS2062 E250 GR B",
      materialYielding: 1.1,
      materialUltimateStress: 1.25,
      anchorBolt: 1.25,
      weld: 1.25,
    };
  }

  function handleChange(item: OFRBasePlateUI, field: string, value: any) {
    let changed = { ...item, [field]: value };
    if (field === "column" && changed.shearResistedBy === "Shear Key") {
      changed = {
        ...changed,
        shearKeyDetails: setShearKeyDetails(changed),
      };
    } else if (field === "shearResistedBy") {
      changed = {
        ...changed,
        shearKeyDetails: value === "Shear Key" ? setShearKeyDetails(changed) : undefined,
      };
    }
    handleChangeData(
      "rectangular",
      plates.map((dataItem) => (dataItem.id === item.id ? changed : dataItem))
    );
    handleChangeModel(changed);
  }

  function getRow(item: OFRBasePlateUI) {
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
        />
        <SelectorCell<string>
          items={convertToNamesArray(
            columns.filter((column) => {
              if (column.profile.shape !== "I") return false;
              return !plates.some((r) => r.model === item.model && r.column === column.name);
            })
          )}
          selected={item.column}
          onSelect={(value) => handleChange(item, "column", value)}
          itemKey={(item) => item}
          itemLabel={(item) => item}
          filter={(query, item) => (query ? item.includes(query.toUpperCase()) : true)}
        />
        <td>{column?.profile?.designation}</td>
        {/* <SelectorCell<DesignMethod>
          items={designMethods}
          selected={item.dMethod}
          onSelect={(value) => handleChange(item, "dMethod", value)}
          itemKey={(item) => item}
          itemLabel={(item) => item}
          filterable={false}
        /> */}
        <NumericCell
          className="w-80"
          value={item.plateThickness}
          onChange={(value) => handleChange(item, "plateThickness", value)}
        />
        <NumericCell
          className="w-60"
          value={item.plateLength}
          onChange={(value) => handleChange(item, "plateLength", value)}
        />
        <NumericCell
          className="w-60"
          value={item.plateWidth}
          onChange={(value) => handleChange(item, "plateWidth", value)}
        />
        <InputCell
          className="w-60"
          value={item.grade}
          onChange={(value) => handleChange(item, "grade", value)}
        />
        <NumericCell
          className="w-50"
          value={item.anchorBoltDiameter}
          onChange={(value) => handleChange(item, "anchorBoltDiameter", value)}
        />
        <SelectorCell<number>
          items={boltCounts}
          selected={item.countAlongLength}
          onSelect={(value) => handleChange(item, "countAlongLength", value)}
          itemKey={(item) => item}
          itemLabel={(item) => `${item}`}
        />
        <SelectorCell<number>
          items={boltCounts}
          selected={item.countAlongWidth}
          onSelect={(value) => handleChange(item, "countAlongWidth", value)}
          itemKey={(item) => item}
          itemLabel={(item) => `${item}`}
        />
        <NumericCell
          className="w-60"
          value={item.firstRowFromCenter_L}
          onChange={(value) => handleChange(item, "firstRowFromCenter_L", value)}
        />
        <NumericCell
          className="w-100"
          value={item.rowToRow_L}
          onChange={(value) => handleChange(item, "rowToRow_L", value)}
        />
        <NumericCell
          className="w-60"
          value={item.firstRowFromCenter_W}
          onChange={(value) => handleChange(item, "firstRowFromCenter_W", value)}
        />
        <NumericCell
          className="w-100"
          value={item.rowToRow_W}
          onChange={(value) => handleChange(item, "rowToRow_W", value)}
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
        <SelectorCell<number>
          items={stiffenerCounts}
          selected={item.stiffenerAlongWeb}
          onSelect={(value) => handleChange(item, "stiffenerAlongWeb", value)}
          itemKey={(item) => item}
          itemLabel={(item) => `${item}`}
        />
        <SelectorCell<number>
          items={stiffenerCounts}
          selected={item.stiffenerAlongFlange}
          onSelect={(value) => handleChange(item, "stiffenerAlongFlange", value)}
          itemKey={(item) => item}
          itemLabel={(item) => `${item}`}
        />
        <SelectorCell<ShearResistedType>
          items={["Shear Key", "Bolts"]}
          itemKey={(item) => item}
          itemLabel={(item) => `${item}`}
          selected={item.shearResistedBy}
          onSelect={(val) => handleChange(item, "shearResistedBy", val)}
        />
        <td>
          {item.shearResistedBy === "Shear Key" && item.shearKeyDetails ? (
            <Button
              small
              minimal
              icon={"menu"}
              intent={"primary"}
              className={"c-light"}
              onClick={() => {
                setDlg(
                  <ShearKeyDetails
                    details={item.shearKeyDetails!}
                    onChange={(val) => handleChange(item, "shearKeyDetails", val)}
                    onClose={() => setDlg(undefined)}
                  />
                );
              }}
            />
          ) : null}
        </td>
      </tr>
    );
  }

  function handleExport() {
    exportToCSV(plates, "FS Rectangular Base Plates");
  }

  function showErrorMsg(msg: string) {
    dispatch(addEventAction(`Rectangular Base Plates (Import): ${msg}`, "danger"));
  }

  function handleImport() {
    if (!project) return;
    importFromCSV((newData, isCSV) => {
      if (!isCSV || !Array.isArray(newData)) return;
      let changedProject = { ...project };
      let newItems: OFRBasePlateUI[] = [...plates];
      newData.forEach((item: OFRBasePlateUI) => {
        // @ts-ignore
        let newItem: OFRBasePlateUI = {
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
        // if (item.dMethod) {
        //   if (designMethods.includes(item.dMethod)) {
        //     newItem = { ...newItem, dMethod: item.dMethod };
        //   } else {
        //     showErrorMsg(`(id: ${item.id}) - Incorrect design method (${item.dMethod})!`);
        //   }
        // }
        newItem = {
          ...newItem,
          plateLength: checkImportedNumber(item.plateLength, false) ?? 0,
          plateWidth: checkImportedNumber(item.plateWidth, false) ?? 0,
          plateThickness: checkImportedNumber(item.plateThickness, false) ?? 0,
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
          const bp = model.rectangularBP.find((bp) => bp.column === newItem.column);
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
                      rectangularBP: model!.rectangularBP.map((cbp) =>
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
              name: `RBP${getIndexName(model.rectangularBP, "RBP")}`,
              column: column.name,
            };
            changedProject = {
              ...changedProject,
              models: models.map((mItem) =>
                mItem.name === model!.name
                  ? {
                      ...model!,
                      rectangularBP: [...model!.rectangularBP, newBP],
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
      handleChangeData("rectangular", newItems);
      dispatch(changeProjectAction(changedProject));
    });
  }

  return (
    <>
      <div className="d-flex f-column">
        <div className="hr" />
        <div className="d-flex f-ai-center label-light bg-dark">
          <span>Rectangular Base Plate</span>
          <Button small icon="trash" text="Delete" intent="warning" onClick={handleDelete} />
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
                    onChange={(data) => handleChangeData("rectangular", data)}
                  />
                  <th rowSpan={2}>FS No.</th>
                  <th rowSpan={2}>Column No.</th>
                  <th rowSpan={2}>Column Profile</th>
                  {/* <th rowSpan={2}>Design Method</th> */}
                  <th colSpan={3}>Base Plate</th>
                  <th colSpan={2}>Anchor Bolt Size</th>
                  <th colSpan={2}>No of bolts</th>
                  <th colSpan={2}>Spacing along Length (mm)</th>
                  <th colSpan={2}>Spacing along Width (mm)</th>
                  <th colSpan={2}>Anchor Bolt Capacity</th>
                  <th colSpan={2}>Stiffener Plate Size</th>
                  <th colSpan={2}>Stiffener Plate Nos</th>
                  <th rowSpan={2}>Shear Resisted By</th>
                  <th rowSpan={2}>Shear Key Details</th>
                </tr>
                <tr>
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
              <tbody>{plates.map(getRow)}</tbody>
            </table>
          </div>
        </div>
      </div>
      {dlg}
    </>
  );
}
