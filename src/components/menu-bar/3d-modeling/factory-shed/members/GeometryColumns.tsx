import React, { FunctionComponent, useMemo } from "react";
import { Button } from "@blueprintjs/core";
import { TOpenFrame, TBeamElement, TColumnOF } from "../../../../../store/main/openFrameTypes";
import { Orientation, Project } from "../../../../../store/main/types";
import { OFColumnUI } from "../../../../../store/ui/types";
import { useDispatch, useSelector } from "react-redux";
import { ApplicationState } from "../../../../../store";
import { changeOFUIAction, addEventAction } from "../../../../../store/ui/actions";
import {
  getElementByName,
  getNextId,
  exportToCSV,
  importFromCSV,
  getProfileLibrary,
  getImportProfileByDesignation,
  getCurrentUI,
} from "../../../../3d-models/utils";
import { CheckBoxCell } from "../../../../common/CheckBoxCell";
import { SelectorCell } from "../../../../common/SelectorCell";
import { orientations } from "../../../../../store/main/constants";
import { changeModel, changeProjectAction } from "../../../../../store/main/actions";
import {
  getSeparetedElementsOfModel,
  mapToArray,
  getMapOfBeamElements,
  updateReleasesToColumn,
} from "../../../../3d-models/openFrame";
import { GeneralCheckBoxCell } from "../../../../common/GeneralCheckBoxCell";
import { Section } from "../../../../../store/data/types";

type Props = {
  project?: Project;
  models: TOpenFrame[];
  profiles: Section[];
  libs: string[];
};

const GeometryColumns: FunctionComponent<Props> = (props) => {
  const { project, models, profiles, libs } = props;

  const openFrameUI = useSelector((state: ApplicationState) => getCurrentUI(state)?.openFrameUI);

  const dispatch = useDispatch();

  const data = useMemo(() => {
    return openFrameUI?.members.columns ?? [];
  }, [openFrameUI]);

  function handleChangeData(columns: OFColumnUI[]) {
    if (!openFrameUI) return;
    dispatch(
      changeOFUIAction({
        ...openFrameUI,
        members: { ...openFrameUI.members, columns },
      })
    );
  }

  function handleAddRow() {
    handleChangeData([
      ...data,
      {
        id: getNextId(data),
        selected: false,
        orientation: 0,
      },
    ]);
  }

  function handleDeleteRows() {
    handleChangeData(data.filter((cnt) => !cnt.selected));
    handleRestoreElements(data.filter((cnt) => cnt.selected));
  }

  function handleRestoreElements(elements: OFColumnUI[], toReturn?: boolean) {
    if (!project || !openFrameUI) return;
    let changedProject = { ...project };
    const map = new Map<string, OFColumnUI[]>();
    for (const el of elements) {
      if (!el.model || !el.element) continue;
      const els = map.get(el.model);
      if (els) {
        map.set(el.model, [...els, el]);
      } else {
        map.set(el.model, [el]);
      }
    }
    for (const [modelName, modelElements] of Array.from(map.entries())) {
      let model = getElementByName(changedProject.models as TOpenFrame[], modelName);
      if (!model) continue;
      const elementsMap = getMapOfBeamElements(model);
      for (const modelElement of modelElements) {
        const item = elementsMap.get(modelElement.element!);
        if (!item) continue;
        let profile: Section | undefined;
        if (item.type === "COLUMN") {
          const column = item as TColumnOF;
          if (column.secondType === "GENERAL") {
            profile = model.frameColProfile;
          } else if (column.secondType === "ADDITIONAL") {
            profile = openFrameUI.additionalBeams.columns.find(
              (aColumn) => aColumn.id === column.uiId
            )?.profile;
          } else if (column.secondType === "ACCESSORY") {
            for (const ag of model.accessories) {
              if (profile) break;
              for (const agEl of ag.elements) {
                if (agEl.columns.includes(column.name)) {
                  profile = agEl.beamProfile;
                  break;
                }
              }
            }
          }
        } else if (item.type === "KNEE-BRACING") {
          profile = openFrameUI.additionalBeams.kneeBracings.find((kb) => kb.id === item.uiId)
            ?.profile;
        } else if (item.type === "VERTICAL-BRACING") {
          profile = openFrameUI.additionalBeams.verticalBracings.find((vb) => vb.id === item.uiId)
            ?.profile;
        }
        const changed: TBeamElement = {
          ...item,
          orientation: 0,
          profile: profile ?? item.profile,
        };
        elementsMap.set(item.name, changed);
      }
      model = {
        ...model,
        ...getSeparetedElementsOfModel(mapToArray(elementsMap)),
      };
      changedProject = {
        ...changedProject,
        models: changedProject.models.map((cpm) => (cpm.name === model?.name ? model : cpm)),
      };
    }
    if (toReturn) {
      return changedProject;
    } else dispatch(changeProjectAction(changedProject));
  }

  function handleChangeRow(row: OFColumnUI, field: string, value: any) {
    handleChangeData(
      data.map((cnt) => {
        if (cnt.id === row.id) {
          return { ...cnt, [field]: value };
        } else return cnt;
      })
    );
  }

  function handleChangeModelElement(row: OFColumnUI, field: "profile" | "orientation", value: any) {
    const model = getElementByName(models, row.model);
    const element = getElementByName(getModelColumns(model), row.element);
    if (model && element) {
      handleChangeRow(row, field, value);
      const map = getMapOfBeamElements(model);
      const changed = { ...element, [field]: value };
      map.set(element.name, changed);
      if (element.type === "COLUMN" && field === "orientation") {
        updateReleasesToColumn(dispatch, "Columns Geometry", map, changed as TColumnOF);
      }
      dispatch(
        changeModel({
          ...model,
          ...getSeparetedElementsOfModel(mapToArray(map)),
        } as TOpenFrame)
      );
    }
  }

  function handleChangeModel(row: OFColumnUI, model?: string) {
    handleChangeData(
      data.map((cnt) => {
        if (cnt.id === row.id) {
          return { ...cnt, model, element: undefined };
        } else return cnt;
      })
    );
  }

  function handleChangeElement(row: OFColumnUI, element?: TBeamElement) {
    handleChangeData(
      data.map((cnt) => {
        if (cnt.id === row.id) {
          return {
            ...cnt,
            element: element?.name,
            library: getProfileLibrary(element?.profile),
            profile: element?.profile,
          };
        } else return cnt;
      })
    );
  }

  function getModelColumns(model?: TOpenFrame): TBeamElement[] {
    if (!model) return [];
    return [...model.columns, ...model.kneeBracings, ...model.verticalBracings];
  }

  function getRow(item: OFColumnUI) {
    const model = getElementByName(models, item.model);
    const columns = getModelColumns(model);
    return (
      <tr key={item.id}>
        <CheckBoxCell
          key={item.id}
          value={item.selected}
          onChange={(value) => handleChangeRow(item, "selected", value)}
        />
        <SelectorCell<string>
          items={models.map((model) => model.name)}
          itemKey={(item) => item}
          itemLabel={(item) => item}
          selected={item.model}
          onSelect={(value) => handleChangeModel(item, value)}
          filterable={false}
        />
        <SelectorCell<TBeamElement>
          items={columns}
          itemKey={(item) => item.name}
          itemLabel={(item) => item.name}
          selected={columns.find((column) => column.name === item.element)}
          onSelect={(value) => handleChangeElement(item, value)}
          filterable={true}
          filter={(query, item) => item.name.includes(query.toUpperCase())}
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
          onSelect={(value) => handleChangeModelElement(item, "profile", value)}
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
          onSelect={(value) => handleChangeModelElement(item, "orientation", value)}
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
        Element: item.element ?? "",
        "C/S Library": item.library ?? "",
        Profile: item.profile?.designation ?? "",
        Orientation: item.orientation,
      })),
      "Columns Geometry"
    );
  }

  function showErrorMsg(msg: string) {
    dispatch(addEventAction(`Columns Geometry (Import): ${msg}`, "danger"));
  }

  function handleImport() {
    if (!project) return;
    importFromCSV((newData, isCSV) => {
      if (!isCSV || !Array.isArray(newData)) return;
      let changedProject = handleRestoreElements(data, true);
      const newItems: OFColumnUI[] = [];
      newData.forEach((item: any) => {
        let newItem: OFColumnUI = {
          id: getNextId(newItems),
          selected: false,
          orientation: 0,
        };
        let model: TOpenFrame | undefined;
        let element: TBeamElement | undefined;
        const itemModel = item["FS No."];
        const itemElement = item["Element"];
        const itemLib = item["C/S Library"];
        const itemProfile = item["Profile"];
        const itemOrientation = item["Orientation"];
        if (itemModel) {
          model = getElementByName(
            // @ts-ignore
            changedProject.models as TOpenFrame[],
            itemModel
          );
          if (model) {
            newItem = { ...newItem, model: model.name };
            const elements = [...model.columns, ...model.kneeBracings, ...model.verticalBracings];
            if (itemElement) {
              element = getElementByName(elements, itemElement);
              if (element) {
                newItem = { ...newItem, element: element.name };
              } else {
                showErrorMsg(`(id: ${item.id}) - an element "${itemElement}" not found!`);
              }
            }
          } else {
            showErrorMsg(`(id: ${item.id}) - a model "${itemModel}" not found!`);
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
        if (model && element && newItem.profile) {
          const elements =
            element.type === "COLUMN"
              ? "columns"
              : element.type === "VERTICAL-BRACING"
              ? "verticalBracings"
              : "kneeBracings";
          const changedModel: TOpenFrame = {
            ...model,
            [elements]: (model[elements] as TBeamElement[]).map((el) => {
              if (el.name === element!.name) {
                return {
                  ...el,
                  profile: newItem.profile,
                  orientation: newItem.orientation,
                };
              }
              return el;
            }),
          };
          // @ts-ignore
          changedProject = {
            ...changedProject,
            models: models.map((mItem) => (mItem.name === model!.name ? changedModel : mItem)),
          };
        }
      });
      handleChangeData(newItems);
      // @ts-ignore
      dispatch(changeProjectAction(changedProject));
    });
  }

  return (
    <div className="d-flex f-column">
      <div className="hr" />
      <div className="label-light bg-dark">
        <span>Geometry Columns</span>
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
                <th>Element</th>
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
};

export default GeometryColumns;
