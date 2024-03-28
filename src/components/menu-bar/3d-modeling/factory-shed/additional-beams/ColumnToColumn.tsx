import React, { FunctionComponent, useMemo } from "react";
import { Button } from "@blueprintjs/core";
import { useDispatch, useSelector } from "react-redux";
import { ApplicationState } from "../../../../../store";
import { Direction2, Project, SimpleDirection, Releases } from "../../../../../store/main/types";
import { CheckBoxCell } from "../../../../common/CheckBoxCell";
import { TOpenFrame, TColumnOF, TBeamOF } from "../../../../../store/main/openFrameTypes";
import { OFColumnToColumnUI } from "../../../../../store/ui/types";
import { changeOFUIAction, addEventAction } from "../../../../../store/ui/actions";
import { SelectorCell } from "../../../../common/SelectorCell";
import { NumericCell } from "../../../../common/NumericCell";
import {
  convertToNamesArray,
  getElementByName,
  getNextId,
  getIndexName,
  exportToCSV,
  importFromCSV,
  fixNumberToStr,
  getImportProfileByDesignation,
  getCurrentUI,
} from "../../../../3d-models/utils";
import { Vector3 } from "three";
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

const ColumnToColumn: FunctionComponent<Props> = (props) => {
  const { project, models, profiles, libs } = props;

  const openFrameUI = useSelector((state: ApplicationState) => getCurrentUI(state)?.openFrameUI);

  const dispatch = useDispatch();

  const data = useMemo(() => {
    return openFrameUI?.additionalBeams.columnToColumn ?? [];
  }, [openFrameUI]);

  function handleMsg(msg: string, type: "danger" | "none" | "success" | "warning") {
    dispatch(addEventAction(msg, type));
  }

  function handleChangeModel(model: TOpenFrame) {
    dispatch(changeModel(model));
  }

  function getReleases(direction: SimpleDirection, from: TColumnOF, to: TColumnOF) {
    let releases: Releases = {};
    if (direction === "X") {
      switch (from.orientation) {
        case undefined:
        case 0:
        case 180:
          releases = { ...releases, my1: true, mz1: true };
          break;
        default:
          releases = { ...releases, my1: false, mz1: false };
          break;
      }
      switch (to.orientation) {
        case undefined:
        case 0:
        case 180:
          releases = { ...releases, my2: true, mz2: true };
          break;
        default:
          releases = { ...releases, my2: false, mz2: false };
          break;
      }
    } else {
      switch (from.orientation) {
        case 90:
        case 270:
          releases = { ...releases, my1: true, mz1: true };
          break;
        default:
          releases = { ...releases, my1: false, mz1: false };
          break;
      }
      switch (to.orientation) {
        case 90:
        case 270:
          releases = { ...releases, my2: true, mz2: true };
          break;
        default:
          releases = { ...releases, my2: false, mz2: false };
          break;
      }
    }
    return releases;
  }

  function handleCreateElement(model: TOpenFrame, item: OFColumnToColumnUI) {
    if (!openFrameUI) return model;
    const from = getElementByName(model.columns, item.column);
    const startPos = from?.startPos.clone().setY(item.elevation);
    const to = startPos && getColumnByDirection(model.columns, item.direction!, startPos);
    if (from && to) {
      const direction = item.direction === "+X" || item.direction === "-X" ? "X" : "Z";
      const id = getIndexName(model.beams, "B");
      const newItem: TBeamOF = {
        id,
        uiId: item.id,
        type: "BEAM",
        secondType: "CtoC",
        name: `B${id}`,
        frame: from.frame,
        direction,
        startPos: startPos!,
        endPos: to.startPos.clone().setY(item.elevation),
        profile: item.profile!,
        orientation: 0,
        startConnected: [],
        connected: [],
        endConnected: [],
        releases: getReleases(direction, from, to),
      };
      return updateConnections(model, newItem, (a, b) =>
        handleMsg(
          `Additional Beams: Warning! Elements "${a}" and "${b}" are crossing in "${model.name}" model`,
          "warning"
        )
      );
    }
    return model;
  }

  function findBeam(beams: TBeamOF[], id: number) {
    return beams.find((item) => item.secondType === "CtoC" && item.uiId === id);
  }

  function handleChangeElement(model: TOpenFrame, item: OFColumnToColumnUI) {
    const changed: TOpenFrame = {
      ...model,
      beams: model.beams.map((element) =>
        element.uiId === item.id ? { ...element, profile: item.profile! } : element
      ),
    };
    dispatch(changeModel(changed));
  }

  function handleDeleteModels(elements: OFColumnToColumnUI[], project?: Project) {
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
          const element = findBeam(newModel.beams, id);
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

  function handleChangeData(columnToColumn: OFColumnToColumnUI[]) {
    if (!openFrameUI) return;
    dispatch(
      changeOFUIAction({
        ...openFrameUI,
        additionalBeams: { ...openFrameUI.additionalBeams, columnToColumn },
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
      },
    ]);
  }

  function handleDeleteRows() {
    handleChangeData(data.filter((item) => !item.selected));
    handleDeleteModels(data.filter((item) => item.selected));
  }

  function handleChangeRow(row: OFColumnToColumnUI, field: string, value: any) {
    handleChangeData(
      data.map((item) => {
        if (item.id === row.id) {
          return { ...item, [field]: value };
        } else return item;
      })
    );
  }

  function handleSoftChange(row: OFColumnToColumnUI, field: "profile", value: any) {
    if (!openFrameUI) return;
    handleChangeRow(row, field, value);
    const changedUI = { ...row, [field]: value };
    const model = getElementByName(models, changedUI.model);
    if (!model || !changedUI.profile) return;
    const element = findBeam(model.beams, changedUI.id);
    if (element) handleChangeElement(model, changedUI);
    else handleChangeModel(handleCreateElement(model, changedUI));
  }

  function handleHardChange(
    row: OFColumnToColumnUI,
    field: "model" | "column" | "direction" | "elevation",
    value: any
  ) {
    if (!openFrameUI) return;
    handleChangeRow(row, field, value);
    const changedUI = { ...row, [field]: value };
    let model = getElementByName(models, changedUI.model);
    if (!model || !changedUI.profile) return;
    const element = findBeam(model.beams, changedUI.id);
    if (element) model = removeConnections(model, element);
    handleChangeModel(handleCreateElement(model, changedUI));
  }

  function getDirections(columns: TColumnOF[], column: TColumnOF | undefined, elevation: number) {
    if (!column) return [];
    let dirs: Direction2[] = [];
    const columnX = column.startPos.x;
    const columnZ = column.startPos.z;
    if (
      columns.some(
        (item) =>
          item.startPos.x > columnX &&
          item.startPos.y <= elevation &&
          item.endPos.y >= elevation &&
          item.startPos.z === columnZ
      )
    )
      dirs = [...dirs, "+X"];
    if (
      columns.some(
        (item) =>
          item.startPos.x < columnX &&
          item.startPos.y <= elevation &&
          item.endPos.y >= elevation &&
          item.startPos.z === columnZ
      )
    )
      dirs = [...dirs, "-X"];
    if (
      columns.some(
        (item) =>
          item.startPos.x === columnX &&
          item.startPos.y <= elevation &&
          item.endPos.y >= elevation &&
          item.startPos.z > columnZ
      )
    )
      dirs = [...dirs, "+Z"];
    if (
      columns.some(
        (item) =>
          item.startPos.x === columnX &&
          item.startPos.y <= elevation &&
          item.endPos.y >= elevation &&
          item.startPos.z < columnZ
      )
    )
      dirs = [...dirs, "-Z"];
    return dirs;
  }

  function getColumnByDirection(columns: TColumnOF[], dir: Direction2, pos: Vector3) {
    const filtered = columns
      .filter((column) => {
        return (
          ((dir === "+X" && column.startPos.x > pos.x && column.startPos.z === pos.z) ||
            (dir === "-X" && column.startPos.x < pos.x && column.startPos.z === pos.z) ||
            (dir === "+Z" && column.startPos.x === pos.x && column.startPos.z > pos.z) ||
            (dir === "-Z" && column.startPos.x === pos.x && column.startPos.z < pos.z)) &&
          column.startPos.y <= pos.y &&
          column.endPos.y >= pos.y
        );
      })
      .sort((a, b) => {
        if (dir === "+X") {
          return a.startPos.x - b.startPos.x;
        } else if (dir === "-X") {
          return b.startPos.x - a.startPos.x;
        } else if (dir === "+Z") {
          return a.startPos.z - b.startPos.z;
        } else {
          return b.startPos.z - a.startPos.z;
        }
      });
    return filtered[0];
  }

  function getRow(item: OFColumnToColumnUI) {
    const model = getElementByName(models, item.model);
    const columns = model?.columns ?? [];
    const column = getElementByName(model?.columns, item.column);
    const toDirs = getDirections(columns, column, item.elevation);
    const widthPercent = `${100 / 7}%`;
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
          items={toDirs}
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
        "C/S Library": item.library ?? "",
        Profile: item.profile?.designation ?? "",
      })),
      "Column To Column"
    );
  }

  function showErrorMsg(msg: string) {
    dispatch(addEventAction(`Column To Column (Import): ${msg}`, "danger"));
  }

  function handleImport() {
    if (!project) return;
    importFromCSV((newData, isCSV) => {
      if (!isCSV || !Array.isArray(newData)) return;
      let changedProject = handleDeleteModels(data, project);
      if (!changedProject) return;
      const newBeams: OFColumnToColumnUI[] = [];
      newData.forEach((item: any) => {
        let newItem: OFColumnToColumnUI = {
          id: getNextId(newBeams),
          selected: false,
          elevation: 0,
        };
        let model: TOpenFrame | undefined;
        const itemModel = item["FS No."];
        const itemColumn = item["Column No."];
        const itemElevation = item["Elevation (m)"];
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
            const column = getElementByName(model.columns, itemColumn);
            if (column) {
              newItem = {
                ...newItem,
                column: column.name,
                direction: item.Direction?.replace("'", "") as Direction2,
              };
            } else {
              showErrorMsg(`(id: ${item.id}) - an element "${itemColumn}" not found!`);
            }
          } else {
            showErrorMsg(`(id: ${item.id}) - a model "${itemModel}" not found!`);
          }
        }
        if (itemElevation) {
          if (isNumber(itemElevation)) {
            newItem = { ...newItem, elevation: Math.abs(itemElevation) };
          } else {
            showErrorMsg(
              `(id: ${item.id}) - a value of "Elevation (m)" "${itemElevation}" is not a number!`
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
        newBeams.push(newItem);
        if (model && newItem.column && newItem.direction && newItem.profile) {
          // @ts-ignore
          changedProject = {
            ...changedProject,
            models: models.map((mItem) =>
              mItem.name === model!.name ? handleCreateElement(model!, newItem) : mItem
            ),
          };
        }
      });
      handleChangeData(newBeams);
      dispatch(changeProjectAction(changedProject));
    });
  }

  return (
    <div className="d-flex f-column">
      <div className="hr" />
      <div className="label-light bg-dark">
        <span>Column To Column</span>
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
                <th>Column No.</th>
                <th>Direction</th>
                <th>Elevation (m)</th>
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

export default ColumnToColumn;
