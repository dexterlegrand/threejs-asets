import React, { FunctionComponent, useState, useEffect, useRef } from "react";
import { Button, FormGroup } from "@blueprintjs/core";
import { SimpleSelector } from "../../../../common/SimpleSelector";
import { CheckBoxCell } from "../../../../common/CheckBoxCell";
import { NumericCell } from "../../../../common/NumericCell";
import { SelectorCell } from "../../../../common/SelectorCell";
import { PipeRack, RectangularBP, ShearResistedType } from "../../../../../store/main/types";
import { useDispatch, useSelector } from "react-redux";
import { changeModel, changeProjectAction } from "../../../../../store/main/actions";
import { boltCounts, stiffenerCounts, concreteGrade } from "../../../../../store/main/constants";
import { getTopOffset, getNextId, convertToNamesArray } from "../../../../3d-models/utils";
import { ApplicationState } from "../../../../../store";
import { InputCell } from "../../../../common/InputCell";
import { ShearKeyDetails } from "../../common/rectangular-base-plate/ShearKeyDetails";

type Props = { models: PipeRack[] };

type RowData = {
  id: number;
  selected: boolean;
  model?: string;
  data: RectangularBP;
};

const RectangularBasePlate: FunctionComponent<Props> = (props) => {
  const { models } = props;

  const [offsetTop, setOffsetTop] = useState<number>(0);
  const [dlg, setDlg] = useState<JSX.Element>();
  const [rows, setRows] = useState<RowData[]>([]);

  const project = useSelector((state: ApplicationState) => {
    return state.main.projects.find((project) => project.name === state.main.currentProject);
  });

  const dispatch = useDispatch();

  const tableRef = useRef<HTMLTableElement>(null);

  useEffect(() => {
    const newRows: RowData[] = [];
    for (const model of models) {
      for (const bp of model.plates) {
        if (bp.type !== "Rectangular") continue;
        const data = { ...bp } as RectangularBP;
        let row = {
          id: data.id,
          selected: false,
          model: model.name,
          data: { ...data, shearResistedBy: data.shearResistedBy ?? "Shear Key" },
        };
        row = { ...row, data: { ...row.data, shearKeyDetails: setShearKeyDetails(row) } };
        newRows.push(row);
      }
    }
    setRows(newRows);
  }, []);

  useEffect(() => {
    setOffsetTop(getTopOffset(tableRef.current, 1));
  }, [rows]);

  function setRowToModel(row: RowData) {
    const model = models.find((m) => m.name === row.model);
    const column = model?.columns.find((c) => c.name === row.data.column);
    if (!column) return;
    const newPlate = { ...row.data, name: `RBP-${column.name}`, parent: column.parent };
    if (model!.plates.some((p) => p.id === row.id)) {
      dispatch(
        changeModel({
          ...model,
          plates: model!.plates.map((p) => (p.id === row.id ? newPlate : p)),
        } as PipeRack)
      );
    } else {
      dispatch(changeModel({ ...model, plates: [...model!.plates, newPlate] } as PipeRack));
    }
  }

  function handleAddRow() {
    const data: RectangularBP = {
      id: getNextId(rows),
      name: `RBP`,
      parent: "",
      column: "",
      designMethod: "Method 1",
      // @ts-ignore
      type: "Rectangular",
      bPlateThickness: 20,
      bPlateLength: 200,
      bPlateWidth: 200,
      grade: "1",
      boltDiameter: 20,
      alongLength: 4,
      alongWidth: 4,
      firstRow_L: 50,
      RtoR_L: 100,
      firstRow_W: 50,
      RtoR_W: 100,
      tension: 1,
      shear: 1,
      sPlateThickness: 20,
      sPlateHeight: 200,
      alongWeb: 3,
      alongFlange: 3,
      shearResistedBy: "Shear Key",
      shearKeyDetails: {
        overalDepth: 400,
        flangeWidth: 400,
        webThick: 25,
        flangeThick: 25,
        keyLength: 325,
        groutThickness: 25,
        material: "IS2062 E250 GR B",
        materialYielding: 1.1,
        materialUltimateStress: 1.25,
        anchorBolt: 1.25,
        weld: 1.25,
      },
    };
    setRows([...rows, { id: data.id, selected: false, data }]);
  }

  function handleDeleteRows() {
    for (const model of models) {
      const modelRBPs = rows.filter((r) => r.selected && r.model === model.name).map((r) => r.id);
      const changed: PipeRack = {
        ...model,
        plates: model.plates.filter((p) => !modelRBPs.includes(p.id)),
      };
      dispatch(changeModel(changed));
    }
    setRows(rows.filter((row) => !row.selected));
  }

  function handleSelect(row: RowData, selected: boolean) {
    setRows(rows.map((item) => (item.id === row.id ? { ...item, selected } : item)));
  }

  function handleChangePR(row: RowData, pr?: string) {
    const model = models.find((m) => m.name === row.model);
    if (model) {
      const changed: PipeRack = {
        ...model,
        plates: model.plates.filter((p) => p.id !== row.id),
      };
      dispatch(changeModel(changed));
    }
    const changed: RowData = { ...row, model: pr, data: { ...row.data, parent: "", column: "" } };
    setRows(rows.map((item) => (item.id === row.id ? changed : item)));
    setRowToModel(changed);
  }

  function setShearKeyDetails(row: RowData) {
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

  function handleChangeRow(row: RowData, field: string, value: any) {
    let changed: RowData = { ...row, data: { ...row.data, [field]: value } };
    if (field === "column" && changed.data.shearResistedBy === "Shear Key") {
      changed = {
        ...changed,
        data: {
          ...changed.data,
          shearKeyDetails: setShearKeyDetails(changed),
        },
      };
    } else if (field === "shearResistedBy") {
      changed = {
        ...changed,
        data: {
          ...changed.data,
          shearKeyDetails: value === "Shear Key" ? setShearKeyDetails(changed) : undefined,
        },
      };
    }
    setRows(rows.map((item) => (item.id === row.id ? changed : item)));
    setRowToModel(changed);
  }

  function getRow(row: RowData) {
    const model = models.find((m) => m.name === row.model);
    const columns =
      model?.columns.filter((column) => {
        if (column.profile.shape !== "I") return false;
        return column.tier === 0 && !model.plates.some((p) => p.column === column.name);
      }) ?? [];
    const column = model?.columns.find((c) => c.name === row.data.column);
    return (
      <tr key={row.id}>
        <CheckBoxCell
          key={row.id}
          value={row.selected}
          onChange={(value) => handleSelect(row, value)}
        />
        <SelectorCell<string>
          items={convertToNamesArray(models)}
          itemKey={(item) => item}
          itemLabel={(item) => item}
          selected={row.model}
          onSelect={(value) => handleChangePR(row, value)}
        />
        <SelectorCell<string>
          items={convertToNamesArray(columns)}
          itemKey={(item) => item}
          itemLabel={(item) => item}
          selected={row.data.column}
          onSelect={(value) => handleChangeRow(row, "column", value)}
          filter={(query, item) => (query ? item.includes(query.toUpperCase()) : true)}
        />
        <td>{column?.profile.designation}</td>
        <NumericCell
          className="w-80"
          value={row.data.bPlateThickness}
          onChange={(value) => handleChangeRow(row, "bPlateThickness", value)}
        />
        <NumericCell
          className="w-60"
          value={row.data.bPlateLength}
          onChange={(value) => handleChangeRow(row, "bPlateLength", value)}
        />
        <NumericCell
          className="w-60"
          value={row.data.bPlateWidth}
          onChange={(value) => handleChangeRow(row, "bPlateWidth", value)}
        />
        <InputCell
          className="w-60"
          value={row.data.grade}
          onChange={(value) => handleChangeRow(row, "grade", value)}
        />
        <NumericCell
          className="w-50"
          value={row.data.boltDiameter}
          onChange={(value) => handleChangeRow(row, "boltDiameter", value)}
        />
        <SelectorCell<number>
          items={boltCounts}
          itemKey={(item) => item}
          itemLabel={(item) => `${item}`}
          selected={row.data.alongLength}
          onSelect={(value) => handleChangeRow(row, "alongLength", value)}
        />
        <SelectorCell<number>
          items={boltCounts}
          itemKey={(item) => item}
          itemLabel={(item) => `${item}`}
          selected={row.data.alongWidth}
          onSelect={(value) => handleChangeRow(row, "alongWidth", value)}
        />
        <NumericCell
          className="w-60"
          value={row.data.firstRow_L}
          onChange={(value) => handleChangeRow(row, "firstRow_L", value)}
        />
        <NumericCell
          className="w-100"
          value={row.data.RtoR_L}
          onChange={(value) => handleChangeRow(row, "RtoR_L", value)}
        />
        <NumericCell
          className="w-60"
          value={row.data.firstRow_W}
          onChange={(value) => handleChangeRow(row, "firstRow_W", value)}
        />
        <NumericCell
          className="w-100"
          value={row.data.RtoR_W}
          onChange={(value) => handleChangeRow(row, "RtoR_W", value)}
        />
        <NumericCell
          className="w-60"
          isDecimal={true}
          value={row.data.tension}
          onChange={(value) => handleChangeRow(row, "tension", value)}
        />
        <NumericCell
          className="w-60"
          isDecimal={true}
          value={row.data.shear}
          onChange={(value) => handleChangeRow(row, "shear", value)}
        />
        <NumericCell
          className="w-80"
          value={row.data.sPlateThickness}
          onChange={(value) => handleChangeRow(row, "sPlateThickness", value)}
        />
        <NumericCell
          className="w-60"
          value={row.data.sPlateHeight}
          onChange={(value) => handleChangeRow(row, "sPlateHeight", value)}
        />
        <SelectorCell<number>
          items={stiffenerCounts}
          itemKey={(item) => item}
          itemLabel={(item) => `${item}`}
          selected={row.data.alongWeb}
          onSelect={(value) => handleChangeRow(row, "alongWeb", value)}
        />
        <SelectorCell<number>
          items={stiffenerCounts}
          itemKey={(item) => item}
          itemLabel={(item) => `${item}`}
          selected={row.data.alongFlange}
          onSelect={(value) => handleChangeRow(row, "alongFlange", value)}
        />
        <SelectorCell<ShearResistedType>
          items={["Shear Key", "Bolts"]}
          itemKey={(item) => item}
          itemLabel={(item) => `${item}`}
          selected={row.data.shearResistedBy}
          onSelect={(val) => handleChangeRow(row, "shearResistedBy", val)}
        />
        <td>
          {row.data.shearResistedBy === "Shear Key" && row.data.shearKeyDetails ? (
            <Button
              small
              minimal
              icon={"menu"}
              intent={"primary"}
              className={"c-light"}
              onClick={() => {
                setDlg(
                  <ShearKeyDetails
                    details={row.data.shearKeyDetails!}
                    onChange={(val) => handleChangeRow(row, "shearKeyDetails", val)}
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

  return (
    <>
      <div className="d-flex f-column">
        <div className="hr" />
        <div className="d-flex f-ai-center label-light bg-dark">
          <span>Rectangular Base Plate</span>
          <Button small icon="trash" text="Delete" intent="warning" onClick={handleDeleteRows} />
          <Button small icon="export" text="Export to CSV" intent="success" disabled={true} />
          <Button small icon="import" text="Import from CSV" intent="success" disabled={true} />
          <Button small icon="plus" text="Add Row" intent="primary" onClick={handleAddRow} />
          <FormGroup className="no-m" label="Concrete Grade" inline>
            <SimpleSelector<string>
              items={concreteGrade}
              selected={project?.concreteGrade}
              onSelect={(concreteGrade) =>
                project && dispatch(changeProjectAction({ ...project, concreteGrade }))
              }
              itemLabel={(item) => item}
              className="fill-select w-150"
            />
          </FormGroup>
        </div>
        <div className="hr" />
        <div className="p-5">
          <div className="table-container">
            <table ref={tableRef} className="table bg-gray">
              <thead>
                <tr>
                  <th rowSpan={2} />
                  <th rowSpan={2}>PR No.</th>
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
              <tbody>{rows.map(getRow)}</tbody>
            </table>
          </div>
        </div>
      </div>
      {dlg}
    </>
  );
};

export default RectangularBasePlate;
