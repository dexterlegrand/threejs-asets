import React, { useMemo } from "react";
import { Button } from "@blueprintjs/core";
import { useSelector, useDispatch } from "react-redux";
import { ApplicationState } from "../../../../../store";
import { removeConnections, fixVector, updateConnections } from "../../../../3d-models/openFrame";
import { OFAccessoryUI } from "../../../../../store/ui/types";
import { CheckBoxCell } from "../../../../common/CheckBoxCell";
import {
  convertToNamesArray,
  getElementByName,
  getNextId,
  getIndexName,
  getElementByField,
  exportToCSV,
  importFromCSV,
  fixVectorByOrientation,
  fixNumberToStr,
  getCurrentUI,
} from "../../../../3d-models/utils";
import { SelectorCell } from "../../../../common/SelectorCell";
import {
  TOpenFrame,
  TBeamOF,
  TAccessoryGroupOF,
  TTPElementOF,
  TFPElementOF,
  TCTElementOF,
  TColumnOF,
} from "../../../../../store/main/openFrameTypes";
import { changeOFUIAction, addEventAction } from "../../../../../store/ui/actions";
import { NumericCell } from "../../../../common/NumericCell";
import { Orientation, Project } from "../../../../../store/main/types";
import { orientations } from "../../../../../store/main/constants";
import { changeModel, changeProjectAction } from "../../../../../store/main/actions";
import { Vector3 } from "three";
import { GeneralCheckBoxCell } from "../../../../common/GeneralCheckBoxCell";
import { isNumber } from "util";

type Props = {
  project?: Project;
  models: TOpenFrame[];
};

export function AccessoriesOF(props: Props) {
  const { project, models } = props;

  const openFrameUI = useSelector((state: ApplicationState) => getCurrentUI(state)?.openFrameUI);

  const dispatch = useDispatch();

  const data = useMemo(() => {
    return openFrameUI?.accessories ?? [];
  }, [openFrameUI]);

  function handleChangeData(accessories: OFAccessoryUI[]) {
    if (!openFrameUI) return;
    dispatch(changeOFUIAction({ ...openFrameUI, accessories }));
  }

  function handleAddRow() {
    const name = `TP${getIndexName(data, "TP")}`;
    handleChangeData([
      ...data,
      {
        id: getNextId(data),
        selected: false,
        name,
        type: "TP",
        distance: 0,
        count: 1,
        spacing: 0,
        orientation: 0,
      },
    ]);
  }

  function handleChangeRow(row: OFAccessoryUI, field: string, value: any) {
    let name = row.name;
    if (field === "model" && value) {
      name = `${value}-${row.type}${getIndexName(data, `${value}-${row.type}`)}`;
    }
    if (field === "type" && value) {
      name = row.model
        ? `${row.model}-${value}${getIndexName(data, `${row.model}-${value}`)}`
        : `${value}${getIndexName(data, value)}`;
    }
    handleChangeData(
      data.map((element) => {
        if (element.id === row.id) {
          return { ...element, name, [field]: value };
        } else return element;
      })
    );
  }

  function handleDeleteRows() {
    handleChangeData(data.filter((item) => !item.selected));
    handleDeleteElements(data.filter((item) => item.selected));
  }

  function getMaxDistance(model?: TOpenFrame, beam?: TBeamOF) {
    if (!model || !beam) return 0;
    let distance = beam.startPos.distanceTo(beam.endPos);
    let current: TBeamOF | undefined = beam;
    while (current?.next) {
      current = getElementByName(model.beams, current.next);
      if (current) {
        distance += current.startPos.distanceTo(current.endPos);
      }
    }
    return distance;
  }

  function getMaxCount(item: OFAccessoryUI, maxDistance: number) {
    return Math.floor((maxDistance - item.distance) / item.spacing) + 1;
  }

  function getRow(item: OFAccessoryUI) {
    const width = `${100 / 9}%`;
    const model = getElementByName(models, item.model);
    const beams = model?.beams ?? [];
    const beam = getElementByName(beams, item.beam);
    const maxDistance = getMaxDistance(model, beam);
    return (
      <tr key={item.id}>
        <CheckBoxCell
          key={item.id}
          value={item.selected}
          onChange={(value) => handleChangeRow(item, "selected", value)}
        />
        <td>{item.name}</td>
        <SelectorCell<string>
          items={convertToNamesArray(models)}
          itemKey={(item) => item}
          itemLabel={(item) => item}
          selected={item.model}
          onSelect={(value) => handleHardChange(item, "model", value)}
          filterable={false}
        />
        <SelectorCell<string>
          items={convertToNamesArray(beams)}
          itemKey={(item) => item}
          itemLabel={(item) => item}
          selected={item.beam}
          onSelect={(value) => handleHardChange(item, "beam", value)}
          filterable={true}
          filter={(query, item) => (query ? item.includes(query.toUpperCase()) : true)}
        />
        <NumericCell
          min={0}
          max={maxDistance}
          isDecimal={true}
          value={item.distance}
          onChange={(value) => handleHardChange(item, "distance", value)}
          style={{ width }}
        />
        <SelectorCell<"TP" | "FP" | "CT">
          items={["TP", "FP", "CT"]}
          itemKey={(item) => item}
          itemLabel={(item) => item}
          selected={item.type}
          onSelect={(value) => handleHardChange(item, "type", value)}
          filterable={false}
        />
        <SelectorCell<Orientation>
          items={orientations}
          selected={item.orientation}
          onSelect={(value) => handleHardChange(item, "orientation", value)}
          itemKey={(item) => item}
          itemLabel={(item) => `${item}`}
          filterable={false}
        />
        <NumericCell
          min={0}
          max={maxDistance}
          isDecimal={true}
          value={item.spacing}
          onChange={(value) => handleHardChange(item, "spacing", value)}
          style={{ width }}
        />
        <NumericCell
          min={0}
          max={item.spacing ? getMaxCount(item, maxDistance) : 1}
          isDecimal={true}
          value={item.count}
          onChange={(value) => handleHardChange(item, "count", value)}
          style={{ width }}
        />
      </tr>
    );
  }

  function handleHardChange(row: OFAccessoryUI, field: string, value: any) {
    if (!openFrameUI) return;
    let name = row.name;
    if (field === "model" && value) {
      name = `${value}-${row.type}${getIndexName(data, `${value}-${row.type}`)}`;
    }
    if (field === "type" && value) {
      name = row.model
        ? `${row.model}-${value}${getIndexName(data, `${row.model}-${value}`)}`
        : `${value}${getIndexName(data, value)}`;
    }
    handleChangeRow(row, field, value);
    const changedUI = { ...row, name, [field]: value };
    let model = getElementByName(models, changedUI.model);
    const beam = getElementByName(model?.beams, changedUI.beam);
    if (!model || !beam) return;
    if (model.accessories.some((ag) => ag.id === changedUI.id)) {
      model = handleDeleteElement(model, changedUI.id);
    }
    handleChangeModel(handleCreateAccessoryGroup(model, beam, changedUI));
  }

  // function handleSoftChange(row: OFAccessoryUI, field: string, value: any) {
  //   if (!openFrameUI) return;
  //   handleChangeRow(row, field, value);
  //   const changedUI = { ...row, [field]: value };
  //   let model = getElementByName(models, changedUI.model);
  //   if (!model) return;
  //   const group = getElementByField(model.accessories, "id", changedUI.id);
  //   if (group) {
  //     handleChangeAccessoryGroup(model, { ...group, [field]: value });
  //   }
  // }

  function handleChangeModel(model: TOpenFrame) {
    dispatch(changeModel(model));
  }

  function handleCreateAccessoryGroup(model: TOpenFrame, beam: TBeamOF, ui: OFAccessoryUI) {
    if (!openFrameUI) return model;
    let newModel = { ...model };
    const startPos = fixVector(beam, beam.startPos, ui.distance);
    let elements: (TTPElementOF | TFPElementOF | TCTElementOF)[] = [];
    for (let i = 0; i < ui.count; i++) {
      const position = startPos.clone();

      if (beam.startPos.x === beam.endPos.x) {
        if (beam.startPos.z <= beam.endPos.z) {
          position.setZ(position.z + ui.spacing * i);
        } else position.setZ(position.z - ui.spacing * i);
      } else if (beam.startPos.z === beam.endPos.z) {
        if (beam.startPos.x <= beam.endPos.x) {
          position.setX(position.x + ui.spacing * i);
        } else position.setX(position.x - ui.spacing * i);
      }

      let columns: string[] = [];
      let beams: string[] = [];

      const height = 2;
      const H1 = 1.5;
      const projection = 1;

      const topPosition = position.y + height;
      const H1Position = position.y + H1;

      let element: TTPElementOF | TFPElementOF | TCTElementOF | undefined;

      if (ui.type === "TP") {
        let id = getIndexName(newModel.columns, "C");
        columns = [`C${id}`];
        newModel = handleCreateColumn(newModel, beam, id, position.clone(), height);

        id = getIndexName(newModel.beams, "B");
        beams = [...beams, `B${id}`];
        newModel = handleCreateBeam(
          newModel,
          beam,
          id,
          position.clone().setY(topPosition),
          -projection,
          ui.orientation
        );

        id = getIndexName(newModel.beams, "B");
        beams = [...beams, `B${id}`];
        newModel = handleCreateBeam(
          newModel,
          beam,
          id,
          position.clone().setY(topPosition),
          projection,
          ui.orientation
        );
        element = {
          id: elements.length + 1,
          name: `${ui.name}-${elements.length + 1}`,
          frame: beam.frame,
          position,
          columns,
          beams,
          height,
          projectionLeft: 1,
          projectionRight: 1,
          columnProfile: model.frameColProfile,
          columnOrientation: 0,
          beamProfile: model.frameBeamProfile,
          beamOrientation: 0,
        };
      } else if (ui.type === "FP") {
        let id = getIndexName(newModel.columns, "C");
        columns = [`C${id}`];
        newModel = handleCreateColumn(newModel, beam, id, position.clone(), height);

        id = getIndexName(newModel.beams, "B");
        beams = [...beams, `B${id}`];
        newModel = handleCreateBeam(
          newModel,
          beam,
          id,
          position.clone().setY(H1Position),
          projection,
          ui.orientation
        );

        id = getIndexName(newModel.beams, "B");
        beams = [...beams, `B${id}`];
        newModel = handleCreateBeam(
          newModel,
          beam,
          id,
          position.clone().setY(topPosition),
          projection,
          ui.orientation
        );
        element = {
          id: elements.length + 1,
          name: `${ui.name}-${elements.length + 1}`,
          frame: beam.frame,
          position,
          columns,
          beams,
          height,
          h1: H1,
          h2: 0,
          h3: 0,
          h4: 0,
          projection: 1,
          columnProfile: model.frameColProfile,
          columnOrientation: 0,
          beamProfile: model.frameBeamProfile,
          beamOrientation: 0,
        };
      } else {
        let id = getIndexName(newModel.columns, "C");
        columns = [`C${id}`];
        newModel = handleCreateColumn(newModel, beam, id, position.clone(), height);

        id = getIndexName(newModel.beams, "B");
        beams = [...beams, `B${id}`];
        newModel = handleCreateBeam(
          newModel,
          beam,
          id,
          position.clone().setY(H1Position),
          -projection,
          ui.orientation
        );

        id = getIndexName(newModel.beams, "B");
        beams = [...beams, `B${id}`];
        newModel = handleCreateBeam(
          newModel,
          beam,
          id,
          position.clone().setY(H1Position),
          projection,
          ui.orientation
        );

        id = getIndexName(newModel.beams, "B");
        beams = [...beams, `B${id}`];
        newModel = handleCreateBeam(
          newModel,
          beam,
          id,
          position.clone().setY(topPosition),
          -projection,
          ui.orientation
        );

        id = getIndexName(newModel.beams, "B");
        beams = [...beams, `B${id}`];
        newModel = handleCreateBeam(
          newModel,
          beam,
          id,
          position.clone().setY(topPosition),
          projection,
          ui.orientation
        );
        element = {
          id: elements.length + 1,
          name: `${ui.name}-${elements.length + 1}`,
          frame: beam.frame,
          position,
          columns,
          beams,
          height,
          h1: H1,
          h2: 0,
          h3: 0,
          h4: 0,
          projectionLeft: 1,
          projectionRight: 1,
          columnProfile: model.frameColProfile,
          columnOrientation: 0,
          beamProfile: model.frameBeamProfile,
          beamOrientation: 0,
        } as TCTElementOF;
      }
      if (element) elements = [...elements, element];
    }
    const group: TAccessoryGroupOF = {
      id: ui.id,
      name: ui.name,
      startPos,
      type: ui.type,
      orientation: ui.orientation,
      accessorySpacing: ui.spacing,
      distanceFromStart: ui.distance,
      elements,
    };
    return {
      ...newModel,
      accessories: [...model.accessories, group],
    } as TOpenFrame;
  }

  function handleMsg(msg: string, type: "danger" | "none" | "success" | "warning") {
    dispatch(addEventAction(msg, type));
  }

  function handleCreateColumn(
    model: TOpenFrame,
    beam: TBeamOF,
    id: number,
    pos: Vector3,
    height: number
  ) {
    const newItem: TColumnOF = {
      id,
      type: "COLUMN",
      secondType: "ACCESSORY",
      name: `C${id}`,
      frame: beam.frame,
      pos,
      startPos: pos.clone(),
      endPos: pos.clone().setY(pos.y + height),
      profile: model.frameColProfile!,
      orientation: 0,
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
    beam: TBeamOF,
    id: number,
    startPos: Vector3,
    projection: number,
    groupOrientation: Orientation
  ) {
    const newItem: TBeamOF = {
      id,
      type: "BEAM",
      secondType: "ACCESSORY",
      name: `B${id}`,
      frame: beam.frame,
      direction: "Z",
      startPos,
      endPos: fixVectorByOrientation(
        startPos,
        startPos.clone().setZ(startPos.z + projection),
        groupOrientation
      ),
      profile: model.frameBeamProfile!,
      orientation: 0,
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

  // function handleChangeAccessoryGroup(
  //   model: TOpenFrame,
  //   group: TAccessoryGroupOF
  // ) {
  //   dispatch(
  //     changeModel({
  //       ...model,
  //       accessories: model.accessories.map((ag) => {
  //         if (ag.id === group.id) {
  //           return group;
  //         } else return ag;
  //       }),
  //     } as TOpenFrame)
  //   );
  // }

  function handleDeleteElements(elements: OFAccessoryUI[], project?: Project) {
    if (!openFrameUI) return;
    let changedProject = project ? { ...project } : undefined;
    const map = new Map<string, number[]>();
    elements.forEach((element) => {
      if (element.model) {
        const ids = map.get(element.model);
        if (ids) {
          map.set(element.model, [...ids, element.id]);
        } else {
          map.set(element.model, [element.id]);
        }
      }
    });
    map.forEach((ids, key) => {
      const model = getElementByName(models, key);
      if (model) {
        let newModel = { ...model };
        ids.forEach((id) => {
          newModel = handleDeleteElement(newModel, id);
        });
        if (changedProject) {
          changedProject = {
            ...changedProject,
            models: changedProject.models.map((mItem) =>
              mItem.name === newModel.name ? newModel : mItem
            ),
          };
        } else dispatch(changeModel(newModel));
      }
    });
    return changedProject;
  }

  function handleDeleteElement(model: TOpenFrame, id: number) {
    let newModel = { ...model };
    const ag = getElementByField(newModel.accessories, "id", id);
    if (ag) {
      ag.elements.forEach((agEl) => {
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
      });
    }
    return {
      ...newModel,
      accessories: newModel.accessories.filter((item) => item.id !== id),
    };
  }

  function handleExport() {
    exportToCSV(
      data.map((item) => ({
        id: item.id,
        Accessory: item.name,
        "OF No.": item.model ?? "",
        "Along Beam No.": item.beam ?? "",
        "Distance of 1st Acc. from Beam start (m)": fixNumberToStr(item.distance),
        "Accessory Type": item.type,
        "Orientation (deg)": item.orientation,
        "Accessory Spacing (m)": fixNumberToStr(item.spacing),
        "Nos.": item.count,
      })),
      "Accessories"
    );
  }

  function showErrorMsg(msg: string) {
    handleMsg(`Accessories (Import): ${msg}`, "danger");
  }

  function handleImport() {
    if (!project) return;
    importFromCSV((imported, isCSV) => {
      if (!isCSV || !Array.isArray(imported)) return;
      let changedProject = handleDeleteElements(data, project);
      if (!changedProject) return;
      const newData: OFAccessoryUI[] = [];
      for (const row of imported as any[]) {
        const name = `TP${getIndexName(newData, "TP")}`;
        let newRow: OFAccessoryUI = {
          id: getNextId(newData),
          selected: false,
          name,
          type: "TP",
          spacing: 0,
          distance: 0,
          count: 0,
          orientation: 0,
        };
        let model: TOpenFrame | undefined;
        let beam: TBeamOF | undefined;
        const rowModel = row["OF No."];
        const rowBeam = row["Along Beam No."];
        const rowDistance = row["Distance of 1st Acc. from Beam start (m)"];
        const rowType = row["Accessory Type"];
        const rowOrientation = row["Orientation (deg)"];
        const rowSpacing = row["Accessory Spacing (m)"];
        const rowCount = row["Nos."];
        if (rowModel) {
          model = getElementByName(changedProject.models as TOpenFrame[], rowModel);
          if (model) {
            newRow = {
              ...newRow,
              name: `${model.name}-${newRow.type}${getIndexName(
                newData,
                `${model.name}-${newRow.type}`
              )}`,
              model: model.name,
            };
            if (rowBeam) {
              beam = getElementByName(model.beams, rowBeam);
              if (beam) {
                newRow = { ...newRow, beam: beam.name };
              } else {
                showErrorMsg(`(id: ${row.id}) - an element "${rowBeam}" not found!`);
              }
            }
          } else {
            showErrorMsg(`(id: ${row.id}) - a model "${rowModel}" not found!`);
          }
        }
        if (rowType) {
          if (["TP", "FP", "CT"].includes(rowType)) {
            newRow = {
              ...newRow,
              name: newRow.model
                ? `${rowModel}-${rowType}${getIndexName(newData, `${rowModel}-${rowType}`)}`
                : `${rowType}${getIndexName(newData, rowType)}`,
              type: rowType,
            };
          } else {
            showErrorMsg(`(id: ${row.id}) - Incorrect accessory type (${rowType})!`);
          }
        }
        if (rowOrientation !== undefined) {
          if (orientations.includes(rowOrientation)) {
            newRow = { ...newRow, orientation: rowOrientation };
          } else {
            showErrorMsg(`(id: ${row.id}) - Incorrect orientation value (${rowOrientation})!`);
          }
        }
        if (rowDistance) {
          if (isNumber(rowDistance)) {
            newRow = { ...newRow, distance: Math.abs(rowDistance) };
          } else {
            showErrorMsg(
              `(id: ${row.id}) - a value of "Distance of 1st Acc. from Beam start (m)" "${rowDistance}" is not a number!`
            );
          }
        }
        if (rowSpacing) {
          if (isNumber(rowSpacing)) {
            newRow = { ...newRow, spacing: Math.abs(rowSpacing) };
          } else {
            showErrorMsg(
              `(id: ${row.id}) - a value of "Accessory Spacing (m)" "${rowSpacing}" is not a number!`
            );
          }
        }
        if (rowCount) {
          if (isNumber(rowCount)) {
            newRow = { ...newRow, count: Math.abs(rowCount) };
          } else {
            showErrorMsg(`(id: ${row.id}) - a value of "Nos." "${rowCount}" is not a number!`);
          }
        }
        newData.push(newRow);
        if (model && beam) {
          changedProject = {
            ...changedProject,
            models: models.map((mItem) =>
              mItem.name === model!.name ? handleCreateAccessoryGroup(model!, beam!, newRow) : mItem
            ),
          };
        }
      }
      handleChangeData(newData);
      dispatch(changeProjectAction(changedProject));
    });
  }

  return (
    <div className="d-flex f-column">
      <div className="hr" />
      <div className="label-light bg-dark">
        <span>Accessories</span>
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
      <div className={"p-5"}>
        <div className={"table-container"}>
          <table className="table bg-gray">
            <thead>
              <tr>
                <GeneralCheckBoxCell data={data} onChange={handleChangeData} />
                <th>Accessory</th>
                <th>OF No.</th>
                <th>Along Beam No.</th>
                <th>Distance of 1st Acc. from Beam start (m)</th>
                <th>Accessory Type</th>
                <th>Orientation (deg)</th>
                <th>Accessory Spacing (m)</th>
                <th>Nos.</th>
              </tr>
            </thead>
            <tbody>{data.map((item) => getRow(item))}</tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
