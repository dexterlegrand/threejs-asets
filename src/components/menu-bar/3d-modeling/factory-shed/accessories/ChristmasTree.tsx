import React, { useState, useEffect } from "react";
import { Button } from "@blueprintjs/core";
import { useDispatch } from "react-redux";
import { updateConnections, removeConnections } from "../../../../3d-models/openFrame";
import { NumericCell } from "../../../../common/NumericCell";
import { SelectorCell } from "../../../../common/SelectorCell";
import { Orientation, Project } from "../../../../../store/main/types";
import { orientations } from "../../../../../store/main/constants";
import { CheckBoxCell } from "../../../../common/CheckBoxCell";
import {
  getElementByName,
  getElementByField,
  getIndexName,
  exportToCSV,
  importFromCSV,
  getImportProfileByDesignation,
  fixNumberToStr,
} from "../../../../3d-models/utils";
import { OFCTElementUI } from "../../../../../store/ui/types";
import { addEventAction } from "../../../../../store/ui/actions";
import {
  TOpenFrame,
  TBeamOF,
  TColumnOF,
  TCTElementOF,
} from "../../../../../store/main/openFrameTypes";
import { Vector3 } from "three";
import { changeModel, changeProjectAction } from "../../../../../store/main/actions";
import { GeneralCheckBoxCell } from "../../../../common/GeneralCheckBoxCell";
import { isNumber } from "util";
import { Section } from "../../../../../store/data/types";

type Props = {
  project?: Project;
  models: TOpenFrame[];
  libs: string[];
  profiles: Section[];
};

export function ChristmasTreeFS(props: Props) {
  const { project, models, libs, profiles } = props;

  const [data, setData] = useState<OFCTElementUI[]>([]);

  const dispatch = useDispatch();

  useEffect(() => {
    mapData(models);
  }, []);

  function mapData(models: TOpenFrame[]) {
    let newData: OFCTElementUI[] = [];
    models.forEach((model) => {
      model.accessories.forEach((ag) => {
        if (ag.type === "CT") {
          //@ts-ignore
          ag.elements.forEach((el: TCTElementOF) => {
            newData = [
              ...newData,
              {
                id: el.id,
                selected: false,
                model: model.name,
                group: ag.name,
                name: el.name,
                height: el.height,
                h1: el.h1,
                h2: el.h2,
                h3: el.h3,
                h4: el.h4,
                projectionLeft: el.projectionLeft,
                projectionRight: el.projectionRight,
                columnProfile: el.columnProfile,
                columnLib: el.columnProfile.country_code?.trim() ?? "",
                columnOrientation: el.columnOrientation,
                beamProfile: el.beamProfile,
                beamLib: el.beamProfile.country_code?.trim() ?? "",
                beamOrientation: el.beamOrientation,
              },
            ];
          });
        }
      });
    });
    setData(newData);
  }

  function handleChangeRow(row: OFCTElementUI, field: string, value: any) {
    setData(
      data.map((element) => {
        if (element.id === row.id) {
          return { ...element, [field]: value };
        } else return element;
      })
    );
  }

  function handleDeleteRows() {
    setData(data.filter((item) => !item.selected));
    handleDeleteElements(data.filter((item) => item.selected));
  }

  function handleMsg(msg: string, type: "danger" | "none" | "success" | "warning") {
    dispatch(addEventAction(msg, type));
  }

  function handleCreateColumn(
    model: TOpenFrame,
    ui: OFCTElementUI,
    frame: string,
    id: number,
    pos: Vector3,
    height: number
  ) {
    const newItem: TColumnOF = {
      id,
      type: "COLUMN",
      secondType: "ACCESSORY",
      name: `C${id}`,
      frame,
      pos,
      startPos: pos.clone(),
      endPos: pos.clone().setY(pos.y + height),
      profile: ui.columnProfile ?? model.frameColProfile!,
      orientation: ui.columnOrientation,
      startConnected: [],
      connected: [],
      endConnected: [],
    };
    return updateConnections(model, newItem, (a, b) =>
      handleMsg(
        `Accessories: Warning! Elements "${a}" and "${b}" are crossing in "${model.name}" model`,
        "warning"
      )
    );
  }

  function handleCreateBeam(
    model: TOpenFrame,
    ui: OFCTElementUI,
    frame: string,
    id: number,
    startPos: Vector3,
    projection: number
  ) {
    const newItem: TBeamOF = {
      id,
      type: "BEAM",
      secondType: "ACCESSORY",
      name: `B${id}`,
      frame,
      direction: "Z",
      startPos,
      endPos: startPos.clone().setZ(startPos.z + projection),
      profile: ui.beamProfile ?? model.frameBeamProfile!,
      orientation: ui.beamOrientation,
      startConnected: [],
      connected: [],
      endConnected: [],
    };
    return updateConnections(model, newItem, (a, b) =>
      handleMsg(
        `Accessories: Warning! Elements "${a}" and "${b}" are crossing in "${model.name}" model`,
        "warning"
      )
    );
  }

  function handleDeleteElements(elements: OFCTElementUI[]) {
    const map = new Map<string, Map<string, number[]>>();
    elements.forEach((element) => {
      const groups = map.get(element.model);
      if (groups) {
        const ids = groups.get(element.group) ?? [];
        groups.set(element.group, [...ids, element.id]);
      } else {
        const groupsMap = new Map<string, number[]>();
        groupsMap.set(element.group, [element.id]);
        map.set(element.model, groupsMap);
      }
    });
    map.forEach((groups, key) => {
      const model = getElementByName(models, key);
      if (model) {
        let newModel = { ...model };
        groups.forEach((ids, groupKey) => {
          ids.forEach((id) => {
            newModel = handleDeleteElement(newModel, groupKey, id);
          });
        });
        dispatch(changeModel(newModel));
      }
    });
  }

  function handleDeleteElement(model: TOpenFrame, group: string, id: number) {
    let newModel = { ...model };
    const ag = getElementByName(newModel.accessories, group);
    if (ag) {
      ag.elements.forEach((agEl) => {
        if (agEl.id === id) {
          agEl.columns.forEach((el) => {
            const element = getElementByName(model.columns, el);
            if (element) {
              newModel = removeConnections(newModel, element);
            }
          });
          agEl.beams.forEach((el) => {
            const element = getElementByName(model.beams, el);
            if (element) {
              newModel = removeConnections(newModel, element);
            }
          });
        }
      });
    }
    return {
      ...newModel,
      accessories: newModel.accessories.map((ag) =>
        ag.name === group ? { ...ag, elements: ag.elements.filter((agEl) => agEl.id !== id) } : ag
      ),
    };
  }

  function handleHardChange(row: OFCTElementUI, field: string, value: any) {
    handleChangeRow(row, field, value);
    let model = getElementByName(models, row.model);
    const group = getElementByName(model?.accessories, row.group);
    const element = getElementByField(group?.elements, "id", row.id);
    if (!model || !group || !element) return;
    if (model.accessories.some((ag) => ag.elements.some((el) => el.id === row.id))) {
      model = handleDeleteElement(model, group.name, row.id);
    }
    const changed = { ...row, [field]: value };
    dispatch(changeModel(handleCreateAccessory(model, element as TCTElementOF, changed)));
  }

  function handleCreateAccessory(model: TOpenFrame, element: TCTElementOF, ui: OFCTElementUI) {
    let newModel = { ...model };
    let columns: string[] = [];
    let beams: string[] = [];

    let heights = [0];
    if (ui.height && !heights.includes(ui.height)) {
      heights = [...heights, ui.height];
    }
    if (ui.h1 && !heights.includes(ui.h1)) {
      heights = [...heights, ui.h1];
    }
    if (ui.h2 && !heights.includes(ui.h2)) {
      heights = [...heights, ui.h2];
    }
    if (ui.h3 && !heights.includes(ui.h3)) {
      heights = [...heights, ui.h3];
    }
    if (ui.h4 && !heights.includes(ui.h4)) {
      heights = [...heights, ui.h4];
    }
    heights.sort((a, b) => a - b);

    let id = getIndexName(newModel.columns, "C");
    columns = [...columns, `C${id}`];
    newModel = handleCreateColumn(
      newModel,
      ui,
      element.frame,
      id,
      element.position.clone(),
      ui.height
    );

    for (let i = 1, len = heights.length; i < len; i++) {
      const to = heights[i];

      id = getIndexName(newModel.beams, "B");
      beams = [...beams, `B${id}`];
      newModel = handleCreateBeam(
        newModel,
        ui,
        element.frame,
        id,
        element.position.clone().setY(element.position.y + to),
        -ui.projectionLeft
      );

      id = getIndexName(newModel.beams, "B");
      beams = [...beams, `B${id}`];
      newModel = handleCreateBeam(
        newModel,
        ui,
        element.frame,
        id,
        element.position.clone().setY(element.position.y + to),
        ui.projectionRight
      );
    }

    const newElement = {
      id: element.id,
      name: element.name,
      position: element.position,
      columns,
      beams,
      height: ui.height,
      h1: ui.h1,
      h2: ui.h2,
      h3: ui.h3,
      h4: ui.h4,
      projectionLeft: ui.projectionLeft,
      projectionRight: ui.projectionRight,
      columnProfile: ui.columnProfile,
      columnOrientation: ui.columnOrientation,
      beamProfile: ui.beamProfile,
      beamOrientation: ui.beamOrientation,
    };
    return {
      ...newModel,
      accessories: newModel.accessories.map((ag) => {
        if (ag.name === ui.group) {
          return {
            ...ag,
            elements: [...ag.elements, newElement],
          };
        } else return ag;
      }),
    } as TOpenFrame;
  }

  function handleSoftChange(row: OFCTElementUI, field: string, value: any) {
    handleChangeRow(row, field, value);
    let model = getElementByName(models, row.model);
    const group = getElementByName(model?.accessories, row.group);
    const element = getElementByField(group?.elements, "id", row.id);
    if (!model || !group || !element) return;
    if (field === "columnProfile") {
      model = {
        ...model,
        columns: model.columns.map((item) => {
          if (element!.columns.includes(item.name)) {
            return { ...item, profile: value };
          } else return item;
        }),
      };
    } else if (field === "columnOrientation") {
      model = {
        ...model,
        columns: model.columns.map((item) => {
          if (element!.columns.includes(item.name)) {
            return { ...item, orientation: value };
          } else return item;
        }),
      };
    } else if (field === "beamProfile") {
      model = {
        ...model,
        beams: model.beams.map((item) => {
          if (element!.beams.includes(item.name)) {
            return { ...item, profile: value };
          } else return item;
        }),
      };
    } else if (field === "beamOrientation") {
      model = {
        ...model,
        beams: model.beams.map((item) => {
          if (element!.beams.includes(item.name)) {
            return { ...item, orientation: value };
          } else return item;
        }),
      };
    }
    dispatch(changeModel(model));
  }

  function getRow(item: OFCTElementUI) {
    const width = `${100 / 14}%`;
    return (
      <tr key={item.id}>
        <CheckBoxCell
          key={item.id}
          value={item.selected}
          onChange={(value) => handleChangeRow(item, "selected", value)}
        />
        <td>{item.name}</td>
        <NumericCell
          min={0}
          isDecimal={true}
          value={item.height}
          onChange={(value) => handleHardChange(item, "height", value)}
          style={{ width }}
        />
        <NumericCell
          min={0}
          isDecimal={true}
          value={item.h1}
          onChange={(value) => handleHardChange(item, "h1", value)}
          style={{ width }}
        />
        <NumericCell
          min={0}
          isDecimal={true}
          value={item.h2}
          onChange={(value) => handleHardChange(item, "h2", value)}
          style={{ width }}
        />
        <NumericCell
          min={0}
          isDecimal={true}
          value={item.h3}
          onChange={(value) => handleHardChange(item, "h3", value)}
          style={{ width }}
        />
        <NumericCell
          min={0}
          isDecimal={true}
          value={item.h4}
          onChange={(value) => handleHardChange(item, "h4", value)}
          style={{ width }}
        />
        <SelectorCell<string>
          items={libs}
          selected={item.columnLib}
          onSelect={(value) => handleChangeRow(item, "columnLib", value)}
          itemKey={(item) => item}
          itemLabel={(item) => item}
          filterable={false}
        />
        <SelectorCell<Section>
          items={profiles.filter((profile) => profile.country_code === item.columnLib)}
          selected={item.columnProfile}
          onSelect={(value) => handleSoftChange(item, "columnProfile", value)}
          itemKey={(item) => item.profile_section_id}
          itemLabel={(item) => item.designation}
          filterable={true}
          filter={(query, item) =>
            query ? item.designation.toLocaleLowerCase().includes(query.toLocaleLowerCase()) : true
          }
        />
        <SelectorCell<Orientation>
          items={orientations}
          selected={item.columnOrientation}
          onSelect={(value) => handleSoftChange(item, "columnOrientation", value)}
          itemKey={(item) => item}
          itemLabel={(item) => `${item}`}
          filterable={false}
        />
        <SelectorCell<string>
          items={libs}
          selected={item.beamLib}
          onSelect={(value) => handleChangeRow(item, "beamLib", value)}
          itemKey={(item) => item}
          itemLabel={(item) => item}
          filterable={false}
        />
        <SelectorCell<Section>
          items={profiles.filter((profile) => profile.country_code === item.beamLib)}
          selected={item.beamProfile}
          onSelect={(value) => handleSoftChange(item, "beamProfile", value)}
          itemKey={(item) => item.profile_section_id}
          itemLabel={(item) => item.designation}
          filterable={true}
          filter={(query, item) =>
            query ? item.designation.toLocaleLowerCase().includes(query.toLocaleLowerCase()) : true
          }
        />
        <SelectorCell<Orientation>
          items={orientations}
          selected={item.beamOrientation}
          onSelect={(value) => handleSoftChange(item, "beamOrientation", value)}
          itemKey={(item) => item}
          itemLabel={(item) => `${item}`}
          filterable={false}
        />
        <NumericCell
          min={0}
          isDecimal={true}
          value={item.projectionLeft}
          onChange={(value) => handleHardChange(item, "projectionLeft", value)}
          style={{ width }}
        />
        <NumericCell
          min={0}
          isDecimal={true}
          value={item.projectionRight}
          onChange={(value) => handleHardChange(item, "projectionRight", value)}
          style={{ width }}
        />
      </tr>
    );
  }

  function handleExport() {
    exportToCSV(
      data.map((item) => ({
        id: item.id,
        "Christmas Tree Group No.": item.name,
        "Total Height (m)": fixNumberToStr(item.height),
        "L1 Height (m)": fixNumberToStr(item.h1),
        "L2 Height (m)": fixNumberToStr(item.h2),
        "L3 Height (m)": fixNumberToStr(item.h3),
        "L4 Height (m)": fixNumberToStr(item.h4),
        "Column C/S Library": item.columnLib,
        "Column Profile": item.columnProfile.designation ?? "",
        "Column Orientation": item.columnOrientation,
        "Beam C/S Library": item.beamLib,
        "Beam Profile": item.beamProfile.designation ?? "",
        "Beam Orientation": item.beamOrientation,
        "Projection Left (m)": fixNumberToStr(item.projectionLeft),
        "Projection Right (m)": fixNumberToStr(item.projectionRight),
      })),
      "Christmass Tree Accessories"
    );
  }

  function showErrorMsg(msg: string) {
    handleMsg(`Christmass Tree Accessories (Import): ${msg}`, "danger");
  }

  function handleImport() {
    if (!project) return;
    importFromCSV((imported, isCSV) => {
      if (!isCSV || !Array.isArray(imported)) return;
      let changedProject = { ...project };
      const newData: OFCTElementUI[] = [...data];
      for (const row of imported as any[]) {
        const rowName = row["Christmas Tree Group No."];
        if (!rowName) continue;
        let changed = newData.find((item) => item.name === rowName);
        if (changed) {
          const rowHeight = row["Total Height (m)"];
          const rowH1 = row["L1 Height (m)"];
          const rowH2 = row["L2 Height (m)"];
          const rowH3 = row["L3 Height (m)"];
          const rowH4 = row["L4 Height (m)"];
          const rowCL = row["Column C/S Library"];
          const rowCP = row["Column Profile"];
          const rowCO = row["Column Orientation"];
          const rowBL = row["Beam C/S Library"];
          const rowBP = row["Beam Profile"];
          const rowBO = row["Beam Orientation"];
          const rowPL = row["Projection Left (m)"];
          const rowPR = row["Projection Right (m)"];
          if (rowHeight) {
            if (isNumber(rowHeight)) {
              changed = { ...changed, height: Math.abs(rowHeight) };
            } else {
              showErrorMsg(
                `(id: ${row.id}) - a value of "Total Height (m)" "${rowHeight}" is not a number!`
              );
            }
          }
          if (rowH1) {
            if (isNumber(rowH1)) {
              changed = { ...changed, h1: Math.abs(rowH1) };
            } else {
              showErrorMsg(`(id: ${row.id}) - a value of "L1 (m)" "${rowH1}" is not a number!`);
            }
          }
          if (rowH2) {
            if (isNumber(rowH2)) {
              changed = { ...changed, h2: Math.abs(rowH2) };
            } else {
              showErrorMsg(`(id: ${row.id}) - a value of "L2 (m)" "${rowH2}" is not a number!`);
            }
          }
          if (rowH3) {
            if (isNumber(rowH3)) {
              changed = { ...changed, h3: Math.abs(rowH3) };
            } else {
              showErrorMsg(`(id: ${row.id}) - a value of "L3 (m)" "${rowH3}" is not a number!`);
            }
          }
          if (rowH4) {
            if (isNumber(rowH4)) {
              changed = { ...changed, h4: Math.abs(rowH4) };
            } else {
              showErrorMsg(`(id: ${row.id}) - a value of "L4 (m)" "${rowH4}" is not a number!`);
            }
          }
          if (rowBO != undefined) {
            if (orientations.includes(rowBO)) {
              changed = { ...changed, beamOrientation: rowBO };
            } else {
              showErrorMsg(`(id: ${row.id}) - Incorrect beam orientation value (${rowBO})!`);
            }
          }
          const bProfile = getImportProfileByDesignation(profiles, rowBP, () =>
            showErrorMsg(`(id: ${row.id}) - a profile "${rowBP}" not found!`)
          );
          if (bProfile) {
            changed = {
              ...changed,
              beamProfile: bProfile,
              beamLib: bProfile.country_code?.trim(),
            };
          } else {
            if (rowBL) {
              if (libs.includes(rowBL)) {
                changed = { ...changed, beamLib: rowBL };
              } else {
                showErrorMsg(`(id: ${row.id}) - Incorrect C/S library "${rowBL}"!`);
              }
            }
          }
          if (rowCO != undefined) {
            if (orientations.includes(rowCO)) {
              changed = { ...changed, columnOrientation: rowCO };
            } else {
              showErrorMsg(`(id: ${row.id}) - Incorrect column orientation value (${rowCO})!`);
            }
          }
          const cProfile = getImportProfileByDesignation(profiles, rowCP, () =>
            showErrorMsg(`(id: ${row.id}) - a profile "${rowCP}" not found!`)
          );
          if (cProfile) {
            changed = {
              ...changed,
              columnProfile: cProfile,
              columnLib: cProfile.country_code?.trim(),
            };
          } else {
            if (rowCL) {
              if (libs.includes(rowCL)) {
                changed = { ...changed, beamLib: rowCL };
              } else {
                showErrorMsg(`(id: ${row.id}) - Incorrect C/S library "${rowCL}"!`);
              }
            }
          }
          if (rowPL) {
            if (isNumber(rowPL)) {
              changed = { ...changed, projectionLeft: Math.abs(rowPL) };
            } else {
              showErrorMsg(
                `(id: ${row.id}) - a value of "Projection Left (m)" "${rowPL}" is not a number!`
              );
            }
          }
          if (rowPR) {
            if (isNumber(rowPR)) {
              changed = { ...changed, projectionRight: Math.abs(rowPR) };
            } else {
              showErrorMsg(
                `(id: ${row.id}) - a value of "Projection Right (m)" "${rowPR}" is not a number!`
              );
            }
          }
          const model = getElementByName(models, changed.model);
          const group = getElementByName(model?.accessories, changed.group);
          const element = getElementByField(group?.elements, "id", changed.id);
          if (!model || !element) continue;
          changedProject = {
            ...changedProject,
            models: changedProject.models.map((mItem) =>
              mItem.name === model.name
                ? handleCreateAccessory(
                    handleDeleteElement(model, changed!.group, changed!.id),
                    element as TCTElementOF,
                    changed!
                  )
                : mItem
            ),
          };
        } else {
          showErrorMsg(`(id: ${row.id}) - an accessory element "${rowName}" not found!`);
        }
      }
      dispatch(changeProjectAction(changedProject));
      mapData(changedProject.models as TOpenFrame[]);
    });
  }

  return (
    <div className="d-flex f-column">
      <div className="hr" />
      <div className="label-light bg-dark">
        <span>Christmas Three</span>
        <Button small icon="trash" text="Delete" intent="warning" onClick={handleDeleteRows} />
        <Button small icon="export" text="Export to CSV" intent="success" onClick={handleExport} />
        <Button
          small
          icon="import"
          text="Import from CSV"
          intent="success"
          onClick={handleImport}
        />
      </div>
      <div className="hr" />
      <div className={"p-5"}>
        <div className={"table-container"}>
          <table className="table bg-gray">
            <thead>
              <tr>
                <GeneralCheckBoxCell rowSpan={2} data={data} onChange={setData} />
                <th rowSpan={2}>Christmas Tree Group No.</th>
                <th colSpan={5}>Height from Base of CT (m)</th>
                <th colSpan={3}>Column</th>
                <th colSpan={3}>Beam</th>
                <th colSpan={2}>Projection</th>
              </tr>
              <tr>
                <th>Total</th>
                <th>L1</th>
                <th>L2</th>
                <th>L3</th>
                <th>L4</th>
                <th>C/S Library</th>
                <th>Profile</th>
                <th>Orientation (deg)</th>
                <th>C/S Library</th>
                <th>Profile</th>
                <th>Orientation (deg)</th>
                <th>Left (m)</th>
                <th>Right (m)</th>
              </tr>
            </thead>
            <tbody>{data.map((item) => getRow(item))}</tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
