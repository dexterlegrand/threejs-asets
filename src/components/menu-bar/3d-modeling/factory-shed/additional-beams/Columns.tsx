import React, { useMemo } from "react";
import { Orientation, Project } from "../../../../../store/main/types";
import {
  TOpenFrame,
  TBeamOF,
  TCantileverOF,
  TColumnOF,
} from "../../../../../store/main/openFrameTypes";
import { Button } from "@blueprintjs/core";
import { useSelector, useDispatch } from "react-redux";
import { ApplicationState } from "../../../../../store";
import { changeOFUIAction, addEventAction } from "../../../../../store/ui/actions";
import { OFColumnsUI } from "../../../../../store/ui/types";
import { CheckBoxCell } from "../../../../common/CheckBoxCell";
import { SelectorCell } from "../../../../common/SelectorCell";
import {
  convertToNamesArray,
  getElementByName,
  getNextId,
  getIndexName,
  getElementByField,
  exportToCSV,
  importFromCSV,
  fixNumberToStr,
  getImportProfileByDesignation,
  getCurrentUI,
} from "../../../../3d-models/utils";
import { NumericCell } from "../../../../common/NumericCell";
import { orientations } from "../../../../../store/main/constants";
import { changeModel, changeProjectAction } from "../../../../../store/main/actions";
import { Vector3 } from "three";
import { updateConnections, removeConnections } from "../../../../3d-models/openFrame";
import { GeneralCheckBoxCell } from "../../../../common/GeneralCheckBoxCell";
import { isNumber } from "util";
import { Section } from "../../../../../store/data/types";

type Props = {
  project?: Project;
  libs: string[];
  profiles: Section[];
  models: TOpenFrame[];
};

export function Columns(props: Props) {
  const { project, libs, profiles, models } = props;

  const openFrameUI = useSelector((state: ApplicationState) => getCurrentUI(state)?.openFrameUI);

  const dispatch = useDispatch();

  const data = useMemo(() => {
    return openFrameUI?.additionalBeams.columns ?? [];
  }, [openFrameUI]);

  function handleMsg(msg: string, type: "danger" | "none" | "success" | "warning") {
    dispatch(addEventAction(msg, type));
  }

  function handleChangeModel(model: TOpenFrame) {
    dispatch(changeModel(model));
  }

  function handleCreateElement(model: TOpenFrame, item: OFColumnsUI) {
    if (!openFrameUI) return model;
    const elements = [...model.beams, ...model.cantilevers];
    const lowerBeam = getElementByName(elements, item.lowerBeam);
    const upperBeam = getElementByName(elements, item.upperBeam);
    if (lowerBeam) {
      const pos = new Vector3(lowerBeam.startPos.x, lowerBeam.startPos.y, lowerBeam.startPos.z);
      if (lowerBeam.direction === "X" || lowerBeam.direction === "+X")
        pos.setX(pos.x + item.distance);
      if (lowerBeam.direction === "-X") pos.setX(pos.x - item.distance);
      if (lowerBeam.direction === "Z" || lowerBeam.direction === "+Z")
        pos.setZ(pos.z + item.distance);
      if (lowerBeam.direction === "-Z") pos.setZ(pos.z - item.distance);
      const id = getIndexName(model.columns, "C");
      const newItem: TColumnOF = {
        id,
        uiId: item.id,
        type: "COLUMN",
        secondType: "ADDITIONAL",
        name: `C${id}`,
        frame: lowerBeam.frame,
        pos,
        startPos: pos.clone(),
        endPos: pos.clone().setY(upperBeam?.startPos.y ?? pos.y + item.height),
        profile: item.profile!,
        orientation: item.orientation,
        startConnected: [],
        connected: [],
        endConnected: [],
      };
      return updateConnections(model, newItem, (a, b) =>
        handleMsg(
          `Additional Columns: Warning! Elements "${a}" and "${b}" are crossing in "${model.name}" model`,
          "warning"
        )
      );
    }
    return model;
  }

  function handleChangeElement(model: TOpenFrame, item: OFColumnsUI) {
    const changed: TOpenFrame = {
      ...model,
      columns: model.columns.map((element) =>
        element.uiId === item.id
          ? {
              ...element,
              profile: item.profile!,
              orientation: item.orientation,
            }
          : element
      ),
    };
    dispatch(changeModel(changed));
  }

  function handleDeleteModels(elements: OFColumnsUI[], project?: Project) {
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
          const element = getElementByField(newModel.columns, "uiId", id);
          if (element) newModel = removeConnections(newModel, element);
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

  function handleChangeData(columns: OFColumnsUI[]) {
    if (!openFrameUI) return;
    dispatch(
      changeOFUIAction({
        ...openFrameUI,
        additionalBeams: { ...openFrameUI.additionalBeams, columns },
      })
    );
  }

  function handleAddRow() {
    handleChangeData([
      ...data,
      {
        id: getNextId(data),
        selected: false,
        distance: 0,
        height: 0,
        orientation: 0,
      },
    ]);
  }

  function handleDeleteRows() {
    handleChangeData(data.filter((item) => !item.selected));
    handleDeleteModels(data.filter((item) => item.selected));
  }

  function handleChangeRow(row: OFColumnsUI, field: string, value: any) {
    handleChangeData(
      data.map((element) => {
        if (element.id === row.id) {
          return { ...element, [field]: value };
        } else return element;
      })
    );
  }

  function handleSoftChange(
    row: OFColumnsUI,
    field: "library" | "profile" | "orientation",
    value: any
  ) {
    if (!openFrameUI) return;
    handleChangeRow(row, field, value);
    const changedUI = { ...row, [field]: value };
    const model = getElementByName(models, changedUI.model);
    if (!model || !changedUI.profile) return;
    const element = model.columns.find((element) => element.uiId === changedUI.id);
    if (element) handleChangeElement(model, changedUI);
    else handleChangeModel(handleCreateElement(model, changedUI));
  }

  function handleHardChange(
    row: OFColumnsUI,
    field: "model" | "lowerBeam" | "distance" | "upperBeam" | "height",
    value: any
  ) {
    if (!openFrameUI) return;
    handleChangeRow(row, field, value);
    const changedUI = { ...row, [field]: value };
    let model = getElementByName(models, changedUI.model);
    if (!model || !changedUI.profile || !(changedUI.upperBeam || changedUI.height)) return;
    const element = model.columns.find((element) => element.uiId === changedUI.id);
    if (element) model = removeConnections(model, element);
    handleChangeModel(handleCreateElement(model, changedUI));
  }

  function getUpperBeams<T extends TBeamOF | TCantileverOF>(beams: T[], beam?: T) {
    if (!beam) return [];
    const filtered = beams.filter((item) => {
      return (
        item.direction === beam.direction &&
        item.startPos.y > beam.startPos.y &&
        ((item.startPos.z === beam.startPos.z &&
          ((item.startPos.x >= beam.startPos.x && item.startPos.x <= beam.endPos.x) ||
            (item.endPos.x >= beam.startPos.x && item.endPos.x <= beam.endPos.x))) ||
          (item.startPos.x === beam.startPos.x &&
            ((item.startPos.z >= beam.startPos.z && item.startPos.z <= beam.endPos.z) ||
              (item.endPos.z >= beam.startPos.z && item.endPos.z <= beam.endPos.z))))
      );
    });
    return filtered;
  }

  function getRow(item: OFColumnsUI) {
    const width = `${100 / 9}%`;
    const model = getElementByName(models, item.model);
    const elements = model ? [...model.beams, ...model.cantilevers] : [];
    const lowerBeam = getElementByName(elements, item.lowerBeam);
    return (
      <tr key={item.id}>
        <CheckBoxCell
          key={item.id}
          value={item.selected}
          onChange={(value) => handleChangeRow(item, "selected", value)}
        />
        <SelectorCell<string>
          items={convertToNamesArray(models)}
          itemKey={(item) => item}
          itemLabel={(item) => item}
          selected={item.model}
          onSelect={(value) => handleHardChange(item, "model", value)}
          filterable={false}
        />
        <SelectorCell<string>
          items={convertToNamesArray(elements)}
          selected={item.lowerBeam}
          onSelect={(value) => handleHardChange(item, "lowerBeam", value)}
          itemKey={(item) => item}
          itemLabel={(item) => item}
          filterable={true}
          filter={(query, item) => (query ? item.includes(query.toUpperCase()) : true)}
        />
        <NumericCell
          min={0}
          isDecimal={true}
          value={item.distance}
          onChange={(value) => handleHardChange(item, "distance", value)}
          style={{ width }}
        />
        <SelectorCell<string>
          items={convertToNamesArray(getUpperBeams(elements, lowerBeam))}
          selected={item.upperBeam}
          onSelect={(value) => handleHardChange(item, "upperBeam", value)}
          itemKey={(item) => item}
          itemLabel={(item) => item}
          filterable={true}
          clearable={true}
          filter={(query, item) => (query ? item.includes(query.toUpperCase()) : true)}
        />
        <NumericCell
          min={0}
          isDecimal={true}
          value={item.height}
          disabled={!!item.upperBeam}
          onChange={(value) => handleHardChange(item, "height", value)}
          style={{ width }}
        />
        <SelectorCell<string>
          items={libs}
          selected={item.library}
          onSelect={(value) => handleChangeRow(item, "library", value)}
          itemKey={(item) => item}
          itemLabel={(item) => item}
          filterable={false}
        />
        <SelectorCell<Section>
          items={profiles.filter((profile) => profile.country_code === item.library)}
          selected={item.profile}
          onSelect={(value) => handleSoftChange(item, "profile", value)}
          itemKey={(item) => item.profile_section_id}
          itemLabel={(item) => item.designation}
          filterable={true}
          filter={(query, item) =>
            query ? item.designation.toLocaleLowerCase().includes(query.toLocaleLowerCase()) : true
          }
        />
        <SelectorCell<Orientation>
          items={orientations}
          selected={item.orientation}
          onSelect={(value) => handleSoftChange(item, "orientation", value)}
          itemKey={(item) => item}
          itemLabel={(item) => `${item}`}
          filterable={false}
        />
      </tr>
    );
  }

  function handleExport() {
    exportToCSV(
      data.map((item) => ({
        id: item.id,
        "FS No.": item.model ?? "",
        "On Beam No. (Lower Beam)": item.lowerBeam ?? "",
        "At Distance from Start of beam (m)": fixNumberToStr(item.distance),
        "To Beam No. (Upper Beam)": item.upperBeam ?? "",
        "Height (m) if Stub on Top Beam": fixNumberToStr(item.height),
        "C/S Library": item.library ?? "",
        Profile: item.profile?.designation ?? "",
        Orientation: item.orientation,
      })),
      "Additional Columns"
    );
  }

  function showErrorMsg(msg: string) {
    dispatch(addEventAction(`Additional Columns (Import): ${msg}`, "danger"));
  }

  function handleImport() {
    if (!project) return;
    importFromCSV((newData, isCSV) => {
      if (!isCSV || !Array.isArray(newData)) return;
      let changedProject = handleDeleteModels(data, project);
      if (!changedProject) return;
      const newItems: OFColumnsUI[] = [];
      newData.forEach((item: any) => {
        let newItem: OFColumnsUI = {
          id: getNextId(newItems),
          selected: false,
          distance: 0,
          height: 0,
          orientation: 0,
        };
        const itemModel = item["FS No."];
        const itemLB = item["On Beam No. (Lower Beam)"];
        const itemDistance = item["At Distance from Start of beam (m)"];
        const itemUB = item["To Beam No. (Upper Beam)"];
        const itemHeight = item["Height (m) if Stub on Top Beam"];
        const itemLib = item["C/S Library"];
        const itemProfile = item["Profile"];
        const itemOrientation = item["Orientation"];
        let model: TOpenFrame | undefined;
        if (itemModel) {
          model = getElementByName(
            // @ts-ignore
            changedProject.models as TOpenFrame[],
            itemModel
          );
          if (model) {
            newItem = { ...newItem, model: model.name };
            const elements = [...model.beams, ...model.cantilevers];
            if (itemLB) {
              const lowerBeam = getElementByName(elements, itemLB);
              if (lowerBeam) {
                newItem = { ...newItem, lowerBeam: lowerBeam.name };
              } else {
                showErrorMsg(`(id: ${item.id}) - an element "${itemLB}" not found!`);
              }
            }
            if (itemUB) {
              const upperBeam = getElementByName(elements, itemUB);
              if (upperBeam) {
                newItem = { ...newItem, upperBeam: upperBeam.name };
              } else {
                showErrorMsg(`(id: ${item.id}) - an element "${itemUB}" not found!`);
              }
            }
          } else {
            showErrorMsg(`(id: ${item.id}) - a model "${itemModel}" not found!`);
          }
        }
        if (itemDistance !== undefined) {
          if (isNumber(itemDistance)) {
            newItem = { ...newItem, distance: Math.abs(itemDistance) };
          } else {
            showErrorMsg(
              `(id: ${item.id}) - a value of "At Distance from Start of beam (m)" "${itemDistance}" is not a number!`
            );
          }
        }
        if (itemHeight) {
          if (isNumber(itemHeight)) {
            newItem = { ...newItem, height: Math.abs(itemHeight) };
          } else {
            showErrorMsg(
              `(id: ${item.id}) - a value of "Height (m) if Stub on Top Beam" "${itemHeight}" is not a number!`
            );
          }
        }
        if (itemOrientation) {
          if (orientations.includes(itemOrientation)) {
            newItem = { ...newItem, orientation: itemOrientation };
          } else {
            showErrorMsg(`(id: ${item.id}) - Incorrect orientation value (${itemOrientation})!`);
          }
        }
        const profile = getImportProfileByDesignation(profiles, itemProfile, () =>
          showErrorMsg(`(id: ${item.id}) - a profile "${itemProfile}" not found!`)
        );
        if (profile) {
          newItem = {
            ...newItem,
            profile: profile,
            library: profile.country_code?.trim(),
          };
        } else {
          if (itemLib) {
            if (libs.includes(itemLib)) {
              newItem = { ...newItem, library: itemLib };
            } else {
              showErrorMsg(`(id: ${item.id}) - Incorrect C/S library "${itemLib}"!`);
            }
          }
        }
        newItems.push(newItem);
        if (model && newItem.lowerBeam && newItem.profile) {
          // @ts-ignore
          changedProject = {
            ...changedProject,
            models: models.map((mItem) =>
              mItem.name === model!.name ? handleCreateElement(model!, newItem) : mItem
            ),
          };
        }
      });
      handleChangeData(newItems);
      dispatch(changeProjectAction(changedProject));
    });
  }

  return (
    <div className="d-flex f-column">
      <div className="hr" />
      <div className="label-light bg-dark">
        <span>Additional Columns</span>
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
                <th>FS No.</th>
                <th>On Beam No. (Lower Beam)</th>
                <th>At Distance from Start of beam (m)</th>
                <th>To Beam No. (Upper Beam)</th>
                <th>Height (m) if Stub on Top Beam</th>
                <th>C/S Library</th>
                <th>Profile</th>
                <th>Orientation</th>
              </tr>
            </thead>
            <tbody>{data.map((item) => getRow(item))}</tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
