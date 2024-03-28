import React, { FunctionComponent, useMemo } from "react";
import { Button } from "@blueprintjs/core";
import { useDispatch, useSelector } from "react-redux";
import { ApplicationState } from "../../../../../store";
import { Direction2, Project } from "../../../../../store/main/types";
import { OFCantileverUI } from "../../../../../store/ui/types";
import { CheckBoxCell } from "../../../../common/CheckBoxCell";
import { changeOFUIAction, addEventAction } from "../../../../../store/ui/actions";
import { TOpenFrame, TCantileverOF, TColumnOF } from "../../../../../store/main/openFrameTypes";
import { SelectorCell } from "../../../../common/SelectorCell";
import { NumericCell } from "../../../../common/NumericCell";
import { directions2 } from "../../../../../store/main/constants";
import {
  getNextId,
  convertToNamesArray,
  getElementByField,
  fixVectorByOrientation,
  getOrientationByDirection,
  getElementByName,
  exportToCSV,
  importFromCSV,
  fixNumberToStr,
  getImportProfileByDesignation,
  getCurrentUI,
} from "../../../../3d-models/utils";
import { changeModel, changeProjectAction } from "../../../../../store/main/actions";
import { updateConnections, removeConnections } from "../../../../3d-models/openFrame";
import { GeneralCheckBoxCell } from "../../../../common/GeneralCheckBoxCell";
import { isNumber } from "util";
import { Section } from "../../../../../store/data/types";

type Props = {
  project?: Project;
  models: TOpenFrame[];
  profiles: Section[];
  libs: string[];
};

const Cantilever: FunctionComponent<Props> = (props) => {
  const { project, models, profiles, libs } = props;

  const openFrameUI = useSelector((state: ApplicationState) => getCurrentUI(state)?.openFrameUI);

  const dispatch = useDispatch();

  const data = useMemo(() => {
    return openFrameUI?.additionalBeams.cantilever ?? [];
  }, [openFrameUI]);

  function handleMsg(msg: string, type: "danger" | "none" | "success" | "warning") {
    dispatch(addEventAction(msg, type));
  }

  function handleChangeModel(model: TOpenFrame) {
    dispatch(changeModel(model));
  }

  function handleCreateElement(model: TOpenFrame, column: TColumnOF, item: OFCantileverUI) {
    if (!openFrameUI) return model;
    const startPos = column.startPos.clone().setY(item.elevation);
    const endPos = startPos.clone().setX(startPos.x + item.length);
    const id = getNextId(model.cantilevers);
    const newItem: TCantileverOF = {
      id,
      uiId: item.id,
      name: `CNT${id}`,
      frame: column.frame,
      type: "CANTILEVER",
      startPos,
      endPos: fixVectorByOrientation(startPos, endPos, getOrientationByDirection(item.direction)),
      direction: item.direction!,
      profile: item.profile!,
      orientation: 0,
      startConnected: [],
      connected: [],
      endConnected: [],
    };
    return updateConnections(model, newItem, (a, b) =>
      handleMsg(
        `Cantilevers: Warning! Elements "${a}" and "${b}" are crossing in "${model.name}" model`,
        "warning"
      )
    );
  }

  function handleChangeElement(model: TOpenFrame, item: OFCantileverUI) {
    const changed: TOpenFrame = {
      ...model,
      cantilevers: model.cantilevers.map((cnt) =>
        cnt.uiId === item.id ? { ...cnt, profile: item.profile! } : cnt
      ),
    };
    dispatch(changeModel(changed));
  }

  function handleDeleteModels(cnts: OFCantileverUI[], project?: Project): Project | undefined {
    if (!openFrameUI) return;
    let changedProject = project ? { ...project } : undefined;
    const map = new Map<string, number[]>();
    cnts.forEach((cnt) => {
      if (cnt.model) {
        const ids = map.get(cnt.model);
        if (ids) {
          map.set(cnt.model, [...ids, cnt.id]);
        } else {
          map.set(cnt.model, [cnt.id]);
        }
      }
    });
    map.forEach((ids, key) => {
      const model = getElementByName(models, key);
      if (model) {
        let newModel = { ...model };
        ids.forEach((id) => {
          const cnt = getElementByField(newModel.cantilevers, "uiId", id);
          if (cnt) newModel = removeConnections(newModel, cnt);
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

  function handleChangeData(cantilever: OFCantileverUI[]) {
    if (!openFrameUI) return;
    dispatch(
      changeOFUIAction({
        ...openFrameUI,
        additionalBeams: { ...openFrameUI.additionalBeams, cantilever },
      })
    );
  }

  function handleAddRow() {
    handleChangeData([
      ...data,
      {
        id: getNextId(data),
        selected: false,
        elevation: 0,
        length: 0,
      },
    ]);
  }

  function handleDeleteRows() {
    handleChangeData(data.filter((item) => !item.selected));
    handleDeleteModels(data.filter((item) => item.selected));
  }

  function handleChangeRow(row: OFCantileverUI, field: string, value: any) {
    handleChangeData(
      data.map((cnt) => {
        if (cnt.id === row.id) {
          return { ...cnt, [field]: value };
        } else return cnt;
      })
    );
  }

  function handleSoftChange(
    row: OFCantileverUI,
    field: "length" | "library" | "profile",
    value: any
  ) {
    if (!openFrameUI) return;
    handleChangeRow(row, field, value);
    const changedUI = { ...row, [field]: value };
    const model = getElementByName(models, changedUI.model);
    const column = getElementByName(model?.columns, changedUI.column);
    if (!model || !column || !changedUI.profile) return;
    const cnt = model.cantilevers.find((cnt) => cnt.uiId === changedUI.id);
    if (cnt) handleChangeElement(model, changedUI);
    else handleChangeModel(handleCreateElement(model, column, changedUI));
  }

  function handleHardChange(
    row: OFCantileverUI,
    field: "model" | "column" | "direction" | "elevation" | "length",
    value: any
  ) {
    if (!openFrameUI) return;
    handleChangeRow(row, field, value);
    const changedUI = { ...row, [field]: value };
    let model = getElementByName(models, changedUI.model);
    const column = getElementByName(model?.columns, changedUI.column);
    if (!model || !column || !changedUI.profile) return;
    const cnt = model.cantilevers.find((cnt) => cnt.uiId === changedUI.id);
    if (cnt) model = removeConnections(model, cnt);
    handleChangeModel(handleCreateElement(model, column, changedUI));
  }

  function getRow(item: OFCantileverUI) {
    const model = getElementByName(models, item.model);
    const columns = model?.columns ?? [];
    const column = getElementByName(model?.columns, item.column);
    const widthPercent = `${100 / 9}%`;
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
          items={convertToNamesArray(columns)}
          itemKey={(item) => item}
          itemLabel={(item) => item}
          selected={item.column}
          onSelect={(value) => handleHardChange(item, "column", value)}
          filterable={true}
          filter={(query, item) => (query ? item.includes(query.toUpperCase()) : true)}
        />
        <SelectorCell<Direction2>
          items={directions2}
          itemKey={(item) => item}
          itemLabel={(item) => item}
          selected={item.direction}
          onSelect={(value) => handleHardChange(item, "direction", value)}
          filterable={false}
        />
        <NumericCell
          min={column?.startPos.y ?? 0}
          max={column?.endPos.y}
          isDecimal={true}
          value={item.elevation}
          onChange={(value) => handleHardChange(item, "elevation", value)}
          style={{ width: widthPercent }}
        />
        <NumericCell
          min={0}
          isDecimal={true}
          value={item.length}
          onChange={(value) => handleHardChange(item, "length", value)}
          style={{ width: widthPercent }}
        />
        <SelectorCell<string>
          items={libs}
          selected={item.library}
          onSelect={(value) => handleSoftChange(item, "library", value)}
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
      </tr>
    );
  }

  function handleExport() {
    exportToCSV(
      data.map((item) => ({
        id: item.id,
        "FS No.": item.model ?? "",
        "Column No.": item.column ?? "",
        Direction: item.direction ? `'${item.direction}` : "",
        "Elevation (m)": fixNumberToStr(item.elevation),
        "Length (m)": fixNumberToStr(item.length),
        "C/S Library": item.library ?? "",
        Profile: item.profile?.designation ?? "",
      })),
      "Cantilevers"
    );
  }

  function showErrorMsg(msg: string) {
    dispatch(addEventAction(`Cantilevers (Import): ${msg}`, "danger"));
  }

  function handleImport() {
    if (!project) return;
    importFromCSV((newData, isCSV) => {
      if (!isCSV || !Array.isArray(newData)) return;
      let changedProject = handleDeleteModels(data, project);
      if (!changedProject) return;
      const newItems: OFCantileverUI[] = [];
      newData.forEach((item: any) => {
        let newItem: OFCantileverUI = {
          id: getNextId(newItems),
          selected: false,
          length: 0,
          elevation: 0,
          direction: item.Direction?.replace("'", "") as Direction2,
        };
        let model: TOpenFrame | undefined;
        let column: TColumnOF | undefined;
        const itemModel = item["FS No."];
        const itemColumn = item["Column No."];
        const itemElevation = item["Elevation (m)"];
        const itemLength = item["Length (m)"];
        const itemLib = item["C/S Library"];
        const itemProfile = item["Profile"];
        if (itemModel) {
          model = getElementByName(
            // @ts-ignore
            changedProject.models as TOpenFrame[],
            itemModel
          );
          if (model) {
            newItem = { ...newItem, model: model.name };
            column = getElementByName(model.columns, itemColumn);
            if (column) {
              newItem = { ...newItem, column: column.name };
            } else {
              showErrorMsg(`(id: ${item.id}) - an element "${itemColumn}" not found!`);
            }
          } else {
            showErrorMsg(`(id: ${item.id}) - a model "${itemModel}" not found!`);
          }
        }
        if (itemElevation !== undefined) {
          if (isNumber(itemElevation)) {
            newItem = { ...newItem, elevation: Math.abs(itemElevation) };
          } else {
            showErrorMsg(
              `(id: ${item.id}) - a value of "Elevation (m)" "${itemElevation}" is not a number!`
            );
          }
        }
        if (itemLength !== undefined) {
          if (isNumber(itemLength)) {
            newItem = { ...newItem, length: Math.abs(itemLength) };
          } else {
            showErrorMsg(
              `(id: ${item.id}) - a value of "Length (m)" "${itemLength}" is not a number!`
            );
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
        if (model && column && newItem.direction && newItem.length && newItem.profile) {
          // @ts-ignore
          changedProject = {
            ...changedProject,
            models: models.map((mItem) =>
              mItem.name === model!.name ? handleCreateElement(model!, column!, newItem) : mItem
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
        <span>Cantilevers</span>
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
        <div className={"table-container"}>
          <table className="table bg-gray">
            <thead>
              <tr>
                <GeneralCheckBoxCell data={data} onChange={handleChangeData} />
                <th>FS No.</th>
                <th>Column No.</th>
                <th>Direction</th>
                <th>Elevation (m)</th>
                <th>Length (m)</th>
                <th>C/S Library</th>
                <th>Profile</th>
              </tr>
            </thead>
            <tbody>{data.map((item) => getRow(item))}</tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Cantilever;
