import React, { FunctionComponent, useMemo } from "react";
import { Button } from "@blueprintjs/core";
import { useDispatch, useSelector } from "react-redux";
import { ApplicationState } from "../../../../../store";
import {
  Project,
  SimpleDirection,
  Releases,
} from "../../../../../store/main/types";
import { CheckBoxCell } from "../../../../common/CheckBoxCell";
import {
  TOpenFrame,
  TColumnOF,
  TBeamOF,
} from "../../../../../store/main/openFrameTypes";
import { OFColumnToBeamUI } from "../../../../../store/ui/types";
import {
  changeOFUIAction,
  addEventAction,
} from "../../../../../store/ui/actions";
import { SelectorCell } from "../../../../common/SelectorCell";
import {
  convertToNamesArray,
  getElementByName,
  getNextId,
  getIndexName,
  exportToCSV,
  importFromCSV,
  getImportProfileByDesignation,
  getCurrentUI,
  checkImportedNumber,
} from "../../../../3d-models/utils";
import { Vector3 } from "three";
import {
  changeModel,
  changeProjectAction,
} from "../../../../../store/main/actions";
import {
  removeConnections,
  updateConnections,
} from "../../../../3d-models/openFrame";
import { GeneralCheckBoxCell } from "../../../../common/GeneralCheckBoxCell";
import { Section } from "../../../../../store/data/types";

type Props = {
  project?: Project;
  models: TOpenFrame[];
  profiles: Section[];
  libs: string[];
};

const ColumnToBeam: FunctionComponent<Props> = (props) => {
  const { project, models, profiles, libs } = props;

  const openFrameUI = useSelector(
    (state: ApplicationState) => getCurrentUI(state)?.openFrameUI
  );

  const dispatch = useDispatch();

  const data = useMemo(() => {
    return openFrameUI?.additionalBeams.columnToBeam ?? [];
  }, [openFrameUI]);

  function handleMsg(
    msg: string,
    type: "danger" | "none" | "success" | "warning"
  ) {
    dispatch(addEventAction(msg, type));
  }

  function handleChangeModel(model: TOpenFrame) {
    dispatch(changeModel(model));
  }

  function getReleases(direction: SimpleDirection, column: TColumnOF) {
    let releases: Releases = {};
    if (direction === "X") {
      switch (column.orientation) {
        case undefined:
        case 0:
        case 180:
          releases = { ...releases, my1: true, mz1: true };
          break;
        default:
          releases = { ...releases, my1: false, mz1: false };
          break;
      }
    } else {
      switch (column.orientation) {
        case 90:
        case 270:
          releases = { ...releases, my1: true, mz1: true };
          break;
        default:
          releases = { ...releases, my1: false, mz1: false };
          break;
      }
    }
    return releases;
  }

  function handleCreateElement(model: TOpenFrame, item: OFColumnToBeamUI) {
    if (!openFrameUI) return model;
    const from = getElementByName(model.columns, item.column);
    const to = getElementByName(model.beams, item.beam);
    if (from && to) {
      const startPos = from.startPos.clone().setY(to.startPos.y);
      const endPos = new Vector3(
        to.direction === "X" ? startPos.x : to.startPos.x,
        to.startPos.y,
        to.direction === "X" ? to.startPos.z : startPos.z
      );
      const direction = to.direction === "X" ? "Z" : "X";
      const id = getIndexName(model.beams, "B");
      const newItem: TBeamOF = {
        id,
        uiId: item.id,
        type: "BEAM",
        secondType: "CtoB",
        name: `B${id}`,
        frame: from.frame,
        direction,
        startPos,
        endPos,
        profile: item.profile!,
        orientation: 0,
        startConnected: [],
        connected: [],
        endConnected: [],
        releases: getReleases(direction, from),
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

  function handleChangeElement(model: TOpenFrame, item: OFColumnToBeamUI) {
    const changed: TOpenFrame = {
      ...model,
      beams: model.beams.map((element) =>
        element.uiId === item.id
          ? { ...element, profile: item.profile! }
          : element
      ),
    };
    dispatch(changeModel(changed));
  }

  function findBeam(beams: TBeamOF[], id: number) {
    return beams.find((item) => item.secondType === "CtoB" && item.uiId === id);
  }

  function handleDeleteModels(elements: OFColumnToBeamUI[], project?: Project) {
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

  function handleChangeData(columnToBeam: OFColumnToBeamUI[]) {
    if (!openFrameUI) return;
    dispatch(
      changeOFUIAction({
        ...openFrameUI,
        additionalBeams: { ...openFrameUI.additionalBeams, columnToBeam },
      })
    );
  }

  function handleAddRow() {
    handleChangeData([
      ...data,
      {
        id: getNextId(data),
        selected: false,
      },
    ]);
  }

  function handleDeleteRows() {
    handleChangeData(data.filter((item) => !item.selected));
    handleDeleteModels(data.filter((item) => item.selected));
  }

  function handleChangeRow(row: OFColumnToBeamUI, field: string, value: any) {
    handleChangeData(
      data.map((item) => {
        if (item.id === row.id) {
          return { ...item, [field]: value };
        } else return item;
      })
    );
  }

  function handleSoftChange(
    row: OFColumnToBeamUI,
    field: "profile",
    value: any
  ) {
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
    row: OFColumnToBeamUI,
    field: "model" | "column" | "beam",
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

  function getBeams(beams?: TBeamOF[], column?: TColumnOF) {
    if (!beams || !column) return [];
    const x = column.startPos.x;
    const z = column.startPos.z;
    const top = column.endPos.y;
    const bottom = column.startPos.y;
    const filtered = beams.filter((beam) => {
      if (beam.startPos.y < bottom || beam.startPos.y > top) return false;
      if (beam.direction === "X") {
        return (
          ((beam.startPos.x <= x && beam.endPos.x >= x) ||
            (beam.startPos.x >= x && beam.endPos.x <= x)) &&
          beam.startPos.z !== z
        );
      } else {
        return (
          ((beam.startPos.z >= z && beam.endPos.z <= z) ||
            (beam.startPos.z <= z && beam.endPos.z >= z)) &&
          beam.startPos.x !== x
        );
      }
    });
    return filtered;
  }

  function getRow(item: OFColumnToBeamUI) {
    const model = getElementByName(models, item.model);
    const columns = model?.columns ?? [];
    const column = getElementByName(columns, item.column);
    const beams = getBeams(model?.beams, column);
    return (
      <tr key={item.id}>
        <CheckBoxCell
          key={item.id}
          value={item.selected}
          onChange={(value) => handleChangeRow(item, "selected", value)}
        />
        <td>
          {
            model?.beams.find(
              (b) => b.secondType === "CtoB" && b.uiId === item.id
            )?.name
          }
        </td>
        <SelectorCell<string>
          items={convertToNamesArray(models)}
          itemKey={(item) => item}
          itemLabel={(item) => item}
          selected={item.model}
          onSelect={(value) => handleHardChange(item, "model", value)}
        />
        <SelectorCell<string>
          items={convertToNamesArray(columns)}
          itemKey={(item) => item}
          itemLabel={(item) => item}
          selected={item.column}
          onSelect={(value) => handleHardChange(item, "column", value)}
          filter={(query, item) =>
            query ? item.includes(query.toUpperCase()) : true
          }
        />
        <SelectorCell<string>
          items={convertToNamesArray(beams)}
          itemKey={(item) => item}
          itemLabel={(item) => item}
          selected={item.beam}
          onSelect={(value) => handleHardChange(item, "beam", value)}
          filter={(query, item) =>
            query ? item.includes(query.toUpperCase()) : true
          }
        />
        <SelectorCell<string>
          items={libs}
          selected={item.library}
          onSelect={(value) => handleChangeRow(item, "library", value)}
          itemKey={(item) => item}
          itemLabel={(item) => item}
        />
        <SelectorCell<Section>
          items={profiles.filter(
            (profile) => profile.country_code === item.library
          )}
          selected={item.profile}
          onSelect={(value) => handleSoftChange(item, "profile", value)}
          itemKey={(item) => item.profile_section_id}
          itemLabel={(item) => item.designation}
          filter={(query, item) =>
            query
              ? item.designation
                  .toLocaleLowerCase()
                  .includes(query.toLocaleLowerCase())
              : true
          }
        />
      </tr>
    );
  }

  function handleExport() {
    exportToCSV(
      data.map((item) => {
        const model = getElementByName(models, item.model);
        return {
          id: item.id,
          "Element No.":
            model?.beams.find(
              (b) => b.secondType === "CtoB" && b.uiId === item.id
            )?.name ?? "",
          "OF No.": item.model ?? "",
          "Column No.": item.column ?? "",
          "Beam No.": item.beam ?? "",
          "C/S Library": item.library ?? "",
          Profile: item.profile?.designation ?? "",
        };
      }),
      "Column To Beam"
    );
  }

  function showErrorMsg(msg: string) {
    dispatch(addEventAction(`Column To Beam (Import): ${msg}`, "danger"));
  }

  function createItems(
    project: Project,
    newData: any[],
    oldData: OFColumnToBeamUI[]
  ): { changedProject: Project; newItems: OFColumnToBeamUI[] } {
    let changedProject = { ...project };
    let newItems: OFColumnToBeamUI[] = [...oldData];
    for (const item of newData) {
      const itemName = item["Element No."] ?? "";
      const itemModel = item["OF No."];
      const itemColumn = item["Column No."];
      const itemBeam = item["Beam No."];
      const itemLib = item["C/S Library"];
      const itemProfile = item["Profile"];

      if (
        newItems.some(
          (item) =>
            item.model === itemModel &&
            item.column === itemColumn &&
            item.beam === itemBeam &&
            item.library === itemLib &&
            item.profile?.designation === itemProfile
        ) ||
        item.id === undefined
      ) {
        continue;
      }

      const model = getElementByName(
        // @ts-ignore
        changedProject.models as TOpenFrame[],
        itemModel
      );

      const createdEl = model?.beams.find(
        (item) => item.secondType === "CtoB" && item.name === itemName
      );

      if (model && createdEl) {
        const createdUI = newItems.find((item) => item.id === createdEl.uiId);
        if (
          createdUI &&
          createdUI.column === itemColumn &&
          createdUI.beam === itemBeam
        ) {
          let changed: OFColumnToBeamUI = { ...createdUI };
          const profile = getImportProfileByDesignation(
            profiles,
            itemProfile,
            () =>
              showErrorMsg(
                `(id: ${item.id}) - a profile "${itemProfile}" not found!`
              )
          );
          if (profile) {
            changed = {
              ...changed,
              profile: profile,
              library: profile.country_code?.trim(),
            };
          } else {
            if (itemLib) {
              if (libs.includes(itemLib)) {
                changed = { ...changed, library: itemLib };
              } else {
                showErrorMsg(
                  `(id: ${item.id}) - Incorrect C/S library "${itemLib}"!`
                );
              }
            }
          }
          newItems = newItems.map((item) =>
            item.id === changed.id ? changed : item
          );
          const changedModel = handleCreateElement(
            removeConnections(model, createdEl),
            changed
          );
          changedProject = {
            ...changedProject,
            models: changedProject.models.map((mItem) =>
              mItem.name === model.name ? changedModel : mItem
            ),
          };
          continue;
        }
      }

      let newItem: OFColumnToBeamUI = {
        id: getNextId(newItems),
        selected: false,
      };

      if (itemModel) {
        if (model) {
          newItem = { ...newItem, model: model.name };
          const column = getElementByName(model.columns, itemColumn);
          if (column) {
            newItem = { ...newItem, column: column.name };
          } else {
            showErrorMsg(
              `(id: ${item.id}) - an element "${itemColumn}" not found!`
            );
          }
          const beam = getElementByName(model.beams, itemBeam);
          if (beam) {
            newItem = { ...newItem, beam: beam.name };
          } else {
            showErrorMsg(
              `(id: ${item.id}) - an element "${itemBeam}" not found!`
            );
          }
        } else {
          showErrorMsg(`(id: ${item.id}) - a model "${itemModel}" not found!`);
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
            showErrorMsg(
              `(id: ${item.id}) - Incorrect C/S library "${itemLib}"!`
            );
          }
        }
      }
      newItems.push(newItem);
      if (model && newItem.column && newItem.beam && newItem.profile) {
        // @ts-ignore
        changedProject = {
          ...changedProject,
          models: changedProject.models.map((mItem) =>
            mItem.name === model!.name
              ? handleCreateElement(model!, newItem)
              : mItem
          ),
        };
      }
    }
    return { changedProject, newItems };
  }

  function handleImport() {
    if (!project) return;
    importFromCSV((newData, isCSV) => {
      if (!isCSV || !Array.isArray(newData)) return;
      const res = createItems(project, newData, data);
      handleChangeData(res.newItems);
      dispatch(changeProjectAction(res.changedProject));
    });
  }

  return (
    <div className="d-flex f-column">
      <div className="hr" />
      <div className="label-light bg-dark">
        <span>Column To Beam</span>
        <Button
          small
          icon="trash"
          text="Delete"
          intent="warning"
          onClick={handleDeleteRows}
        />
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
        <Button
          small
          icon="plus"
          text="Add Row"
          intent="primary"
          onClick={handleAddRow}
        />
      </div>
      <div className="hr" />
      <div className={"p-5"}>
        <div className={"table-container"}>
          <table className="table bg-gray">
            <thead>
              <tr>
                <GeneralCheckBoxCell data={data} onChange={handleChangeData} />
                <th>Element No.</th>
                <th>OF No.</th>
                <th>Column No.</th>
                <th>Beam No.</th>
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

export default React.memo(ColumnToBeam);
