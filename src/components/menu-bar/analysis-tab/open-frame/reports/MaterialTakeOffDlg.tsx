import React, { useEffect, useMemo, useState } from "react";
import { FormGroup, ProgressBar, Button } from "@blueprintjs/core";
import { SimpleSelector } from "../../../../common/SimpleSelector";
import { getElementByName, exportToCSV, getCurrentUI } from "../../../../3d-models/utils";
import { useSelector } from "react-redux";
import { ApplicationState } from "../../../../../store";
import { CustomDlg } from "../../../../common/CustomDlg";
import { getOFModels } from "../../../../3d-models/openFrame";
import { TOpenFrame } from "../../../../../store/main/openFrameTypes";
import { RolledSection } from "../../../../../store/data/types";

type Props = {
  onClose: () => any;
};

type RowData = {
  section: any;
  material: any;
  unit: any;
  quantity: any;
};

export function MaterialTakeOffOF(props: Props) {
  const { onClose } = props;

  const [model, setModel] = useState<TOpenFrame>();
  const [rows, setRows] = useState<RowData[]>([]);

  const ui = useSelector((state: ApplicationState) => getCurrentUI(state));
  const project = useSelector((state: ApplicationState) =>
    getElementByName(state.main.projects, state.main.currentProject)
  );

  const models = useMemo(() => getOFModels(project), [project]);
  const progress = useMemo(() => ui?.requests?.weight, [ui]);

  useEffect(() => {
    setModel(models[0]);
  }, [models]);

  useEffect(() => {
    if (!ui || !model || !project) return;
    const analysis = ui.analysisUI[model.name];
    const response = analysis?.weightSummary;
    if (!response) return;
    const newRows: RowData[] = [];
    let rolledSections: RolledSection[] = [];
    [
      ...model.columns,
      ...model.beams,
      ...model.cantilevers,
      ...model.horizontalBracings,
      ...model.verticalBracings,
    ].forEach((el) => {
      if (!rolledSections.some((rs) => rs.designation === el.profile.designation)) {
        rolledSections = [...rolledSections, el.profile as RolledSection];
      }
    });

    rolledSections.forEach((rs) => {
      newRows.push({
        section: rs.designation,
        material: model.material?.material_name,
        unit: "KG",
        quantity: response.data?.rolledProfileSectionList?.find(
          (item: any) => item.name === rs.designation
        )?.weight,
      });
    });

    const plateThicknesses: number[] = [];
    [...model.circularBP, ...model.rectangularBP].forEach((plate) => {
      // todo 2 column, it should take material from drop down value of "Concrete Grade" on base plate tabs
      if (!plateThicknesses.includes(plate.plateThickness)) {
        newRows.push({
          section: `Plate ${plate.plateThickness}mm thk.`,
          material: "",
          unit: "KG",
          quantity: response.data?.platesList?.find(
            (item: any) => item.name === `Plate ${plate.plateThickness}mm thk.`
          )?.weight,
        });
        plateThicknesses.push(plate.plateThickness);
      }
    });

    newRows.push({
      section: "Total",
      material: "-",
      unit: "MT",
      quantity: response.data?.totalWeight ?? "",
    });

    const gratingThicknesses: number[] = [];
    model.platforms.forEach((pl) => {
      // todo 4 column, it should take data from response
      if (!gratingThicknesses.includes(pl.thickness)) {
        newRows.push({
          section: `Grating ${pl.thickness}mm thk.`,
          material: "-",
          unit: "M^2",
          quantity: "",
        });
        gratingThicknesses.push(pl.thickness);
      }
    });

    // todo Chequered Plate thickness list, handrail and ladders

    setRows(newRows);
  }, [project, model]);

  function getRow(row: RowData, i: number) {
    return (
      <tr key={i} className={"simple-table-rows"}>
        <td>{row.section}</td>
        <td>{row.material}</td>
        <td className={"t-center"}>{row.unit}</td>
        <td className={"t-center"}>{row.quantity}</td>
      </tr>
    );
  }

  function handleExport() {
    exportToCSV(rows, "OF Material Take Off");
  }

  return (
    <CustomDlg
      title={"Material Take Off"}
      isMinimize={true}
      body={
        <div className="d-flex f-grow f-column">
          <div className="d-flex f-ai-center bg-dark always" style={{ paddingRight: 10 }}>
            <Button
              small
              icon="export"
              text="Export to CSV"
              intent="success"
              onClick={handleExport}
            />
            <div className="label-light t-end w-160">Open Frame model</div>
            <FormGroup className="no-m w-160">
              <SimpleSelector<TOpenFrame>
                items={models}
                selected={model}
                onSelect={setModel}
                itemLabel={(item) => item.name}
                className="fill-select"
              />
            </FormGroup>
          </div>
          <div className={"hr"} />
          {progress ? (
            <>
              <ProgressBar />
              <div className={"hr"} />
            </>
          ) : null}
          <div className={"p-5 bg-dark"}>
            <div className={"small-table-container"}>
              <table className="table bg-gray">
                <thead>
                  <tr>
                    <th>Sections</th>
                    <th>Material</th>
                    <th>Unit</th>
                    <th>Quantity</th>
                  </tr>
                </thead>
                <tbody>{rows.map((row, i) => getRow(row, i))}</tbody>
              </table>
            </div>
          </div>
        </div>
      }
      onClose={onClose}
    />
  );
}
