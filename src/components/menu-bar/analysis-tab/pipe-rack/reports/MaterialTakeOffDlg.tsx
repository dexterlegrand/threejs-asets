import React, { useEffect, useMemo, useState } from "react";
import { FormGroup, ProgressBar } from "@blueprintjs/core";
import { SimpleSelector } from "../../../../common/SimpleSelector";
import { Accessory, PipeRack, AccessoryElement } from "../../../../../store/main/types";
import { MtoMM, getCurrentUI, getCurrentProject } from "../../../../3d-models/utils";
import { useSelector } from "react-redux";
import { ApplicationState } from "../../../../../store";
import { CustomDlg } from "../../../../common/CustomDlg";
import { RolledSection } from "../../../../../store/data/types";

type Props = {
  onClose: () => any;
};

export function MaterialTakeOff(props: Props) {
  const { onClose } = props;

  const progress = useSelector((state: ApplicationState) => getCurrentUI(state)?.requests?.weight);

  const ui = useSelector((state: ApplicationState) => getCurrentUI(state));
  const project = useSelector((state: ApplicationState) => getCurrentProject(state));

  const models = useMemo(
    () => (project?.models.filter((model) => model.type === "Pipe Rack") ?? []) as PipeRack[],
    [project]
  );

  const [model, setModel] = useState<PipeRack>();
  const [rows, setRows] = useState<JSX.Element[]>([]);

  function getAccessoryElements(accessories: Accessory[]) {
    let agElements: any[] = [];
    accessories.forEach((ag) => {
      ag.elements.forEach((el: AccessoryElement) => {
        agElements = [
          ...agElements,
          {
            ...el,
            profile: el.colProfile,
          },
          {
            ...el,
            profile: el.beamProfile,
          },
        ];
      });
    });
    return agElements;
  }

  useEffect(() => {
    if (!ui || !model || !project) return;
    const analysis = ui.analysisUI[model.name];
    const response = analysis?.weightSummary;
    if (!response) return;
    const newRows: JSX.Element[] = [];
    let rolledSections: RolledSection[] = [];
    [
      ...model.columns,
      ...model.beams,
      ...model.cantilevers,
      ...model.hBracings,
      ...model.vBracings,
      ...getAccessoryElements(model.accessories),
    ].forEach((el) => {
      if (!rolledSections.some((rs) => rs.designation === el.profile.designation)) {
        rolledSections = [...rolledSections, el.profile];
      }
    });

    rolledSections.forEach((rs) => {
      newRows.push(
        <tr key={rs.designation} className={"simple-table-rows"}>
          <td>{rs.designation}</td>
          <td>{model.material?.material_name}</td>
          <td className={"t-center"}>KG</td>
          <td className={"t-center"}>
            {
              response.data?.rolledProfileSectionList?.find(
                (item: any) => item.name === rs.designation
              )?.weight
            }
          </td>
        </tr>
      );
    });

    const plateThicknesses: number[] = [];
    model.plates.forEach((plate) => {
      // todo 2 column, it should take material from drop down value of "Concrete Grade" on base plate tabs
      if (!plateThicknesses.includes(plate.bPlateThickness)) {
        newRows.push(
          <tr key={`Plate ${plate.bPlateThickness}mm thk.`} className={"simple-table-rows"}>
            <td>Plate {plate.bPlateThickness}mm thk.</td>
            <td></td>
            <td className={"t-center"}>KG</td>
            <td className={"t-center"}>
              {
                response.data?.platesList?.find(
                  (item: any) => item.name === `Plate ${plate.bPlateThickness}mm thk.`
                )?.weight
              }
            </td>
          </tr>
        );
        plateThicknesses.push(plate.bPlateThickness);
      }
    });

    if (newRows.length) {
      newRows.push(
        <tr key={"Total"} className={"simple-table-rows"}>
          <td>
            <strong>Total</strong>
          </td>
          <td>-</td>
          <td className={"t-center"}>MT</td>
          <td className={"t-center"}>{response.data?.totalWeight}</td>
        </tr>
      );
    }

    const gratingThicknesses: number[] = [];
    model.platforms.forEach((pl) => {
      // todo 4 column, it should take data from response
      if (!gratingThicknesses.includes(pl.thickness)) {
        newRows.push(
          <tr key={pl.name} className={"simple-table-rows"}>
            <td>Grating {MtoMM(pl.thickness)}mm thk.</td>
            <td>-</td>
            <td className={"t-center"}>
              M<sup>2</sup>
            </td>
            <td className={"t-center"}></td>
          </tr>
        );
        gratingThicknesses.push(pl.thickness);
      }
    });

    // todo Chequered Plate thickness list, handrail and ladders

    setRows(newRows);
  }, [ui, project, model]);

  return (
    <CustomDlg
      title={"Material Take Off"}
      isMinimize={true}
      body={
        <div className="d-flex f-grow f-column">
          <div className="d-flex f-ai-center bg-dark always" style={{ paddingRight: 10 }}>
            <div className="label-light t-end w-160">Pipe Rack model</div>
            <FormGroup className="no-m w-160">
              <SimpleSelector<PipeRack>
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
                <tbody>{rows}</tbody>
              </table>
            </div>
          </div>
        </div>
      }
      onClose={onClose}
    />
  );
}
