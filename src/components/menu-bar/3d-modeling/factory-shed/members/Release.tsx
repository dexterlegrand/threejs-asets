import React, { FunctionComponent, useMemo, useState, useEffect } from "react";
import { Button } from "@blueprintjs/core";
import { TBeamElement, TOpenFrame } from "../../../../../store/main/openFrameTypes";
import { useDispatch, useSelector } from "react-redux";
import { ApplicationState } from "../../../../../store";
import { Paginator } from "../../../../common/Paginator";
import { OFReleasesUI } from "../../../../../store/ui/types";
import { CheckBoxCell } from "../../../../common/CheckBoxCell";
import { SelectorCell } from "../../../../common/SelectorCell";
import { changeOFUIAction, addEventAction } from "../../../../../store/ui/actions";
import {
  getElementByName,
  getNextId,
  exportToCSV,
  importFromCSV,
  getCurrentUI,
} from "../../../../3d-models/utils";
import {
  getBeamElementsOfModel,
  getMapOfBeamElements,
  getSeparetedElementsOfModel,
  mapToArray,
} from "../../../../3d-models/openFrame";
import { changeModel, changeProjectAction } from "../../../../../store/main/actions";
import { GeneralCheckBoxCell } from "../../../../common/GeneralCheckBoxCell";
import { Project } from "../../../../../store/main/types";

type Props = {
  project?: Project;
  models: TOpenFrame[];
};

const Release: FunctionComponent<Props> = (props) => {
  const { project, models } = props;

  const [selectedData, setSelectedData] = useState<OFReleasesUI[]>([]);

  const openFrameUI = useSelector((state: ApplicationState) => getCurrentUI(state)?.openFrameUI);

  const dispatch = useDispatch();

  const data = useMemo(() => {
    return openFrameUI?.members.releases ?? [];
  }, [openFrameUI]);

  useEffect(() => {
    let releases: OFReleasesUI[] = [];
    models.forEach((model) => {
      getBeamElementsOfModel(model).forEach((el) => {
        if (el.releases) {
          releases = [
            ...releases,
            {
              id: releases.length,
              selected: false,
              element: el.name,
              model: model.name,
              ...el.releases,
            },
          ];
        }
      });
    });
    handleChangeData(releases);
  }, []);

  function handleChangeData(releases: OFReleasesUI[]) {
    if (!openFrameUI) return;
    dispatch(
      changeOFUIAction({
        ...openFrameUI,
        members: { ...openFrameUI.members, releases },
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
    handleDeleteReleases(data.filter((item) => item.selected));
  }

  function handleChangeRow(row: OFReleasesUI, field: string, value: any) {
    handleChangeData(
      data.map((cnt) => {
        if (cnt.id === row.id) {
          return { ...cnt, [field]: value };
        } else return cnt;
      })
    );
  }

  function handleDeleteReleases(elements: OFReleasesUI[], toReturn?: boolean) {
    if (!project) return;
    let changedProject = { ...project };
    const map = new Map<string, string[]>();
    for (const element of elements) {
      if (!element.model || !element.element) continue;
      const names = map.get(element.model);
      map.set(element.model, names ? [...names, element.element] : [element.element]);
    }
    for (const [key, names] of Array.from(map.entries())) {
      const model = getElementByName(models, key);
      if (!model) continue;
      const elements = getMapOfBeamElements(model);
      for (const name of names) {
        const element = elements.get(name);
        if (!element) continue;
        elements.set(name, { ...element, releases: undefined });
      }
      const newModel = {
        ...model,
        ...getSeparetedElementsOfModel(mapToArray(elements)),
      };
      changedProject = {
        ...changedProject,
        models: changedProject.models.map((mItem) =>
          mItem.name === newModel.name ? newModel : mItem
        ),
      };
    }
    if (toReturn) {
      return changedProject;
    } else dispatch(changeProjectAction(changedProject));
  }

  function handleChangeModelElement(row: OFReleasesUI, field: string, value: boolean) {
    handleChangeRow(row, field, value);
    const model = getElementByName(models, row.model);
    const element = getElementByName(model ? getBeamElementsOfModel(model) : [], row.element);
    if (model && element) {
      let elements:
        | "columns"
        | "beams"
        | "cantilevers"
        | "verticalBracings"
        | "kneeBracings"
        | "horizontalBracings"
        | undefined;
      switch (element.type) {
        case "COLUMN":
          elements = "columns";
          break;
        case "BEAM":
          elements = "beams";
          break;
        case "CANTILEVER":
          elements = "cantilevers";
          break;
        case "VERTICAL-BRACING":
          elements = "verticalBracings";
          break;
        case "KNEE-BRACING":
          elements = "kneeBracings";
          break;
        case "HORIZONTAL-BRACING":
          elements = "horizontalBracings";
          break;
        default:
          break;
      }
      if (!elements) return;
      dispatch(
        changeModel({
          ...model,
          [elements]: (model[elements] as TBeamElement[]).map((el) => {
            if (el.name === row.element) {
              return {
                ...el,
                releases: {
                  ...el.releases,
                  [field]: value,
                },
              };
            }
            return el;
          }),
        } as TOpenFrame)
      );
    }
  }

  function handleChangeModel(row: OFReleasesUI, model?: string) {
    handleChangeData(
      data.map((cnt) => {
        if (cnt.id === row.id) {
          return { ...cnt, model, element: undefined };
        } else return cnt;
      })
    );
  }

  function handleChangeElement(row: OFReleasesUI, element?: TBeamElement) {
    handleChangeData(
      data.map((cnt) => {
        if (cnt.id === row.id) {
          return { ...cnt, element: element?.name, ...element?.releases };
        } else return cnt;
      })
    );
  }

  function getRow(item: OFReleasesUI) {
    const model = getElementByName(models, item.model);
    const elements = model ? getBeamElementsOfModel(model) : [];
    return (
      <tr key={item.id}>
        <CheckBoxCell
          key={item.id}
          value={item.selected}
          onChange={(value) => handleChangeRow(item, "selected", value)}
        />
        <SelectorCell<string>
          items={models.map((model) => model.name)}
          selected={item.model}
          onSelect={(value) => handleChangeModel(item, value)}
          itemKey={(item) => item}
          itemLabel={(item) => item}
          filterable={false}
        />
        <SelectorCell<TBeamElement>
          items={elements.filter((el) => !data.some((dataEl) => dataEl.element === el.name))}
          selected={elements.find((el) => el.name === item.element)}
          onSelect={(value) => handleChangeElement(item, value)}
          itemKey={(item) => item.name}
          itemLabel={(item) => item.name}
          filterable={true}
          filter={(query, item) => item.name.includes(query.toUpperCase())}
        />
        <CheckBoxCell
          key={`${item.id}-${item.model}-${item.element}-fx1`}
          value={item.fx1}
          onChange={(value) => handleChangeModelElement(item, "fx1", value)}
        />
        <CheckBoxCell
          key={`${item.id}-${item.model}-${item.element}-fy1`}
          value={item.fy1}
          onChange={(value) => handleChangeModelElement(item, "fy1", value)}
        />
        <CheckBoxCell
          key={`${item.id}-${item.model}-${item.element}-fz1`}
          value={item.fz1}
          onChange={(value) => handleChangeModelElement(item, "fz1", value)}
        />
        <CheckBoxCell
          key={`${item.id}-${item.model}-${item.element}-mx1`}
          value={item.mx1}
          onChange={(value) => handleChangeModelElement(item, "mx1", value)}
        />
        <CheckBoxCell
          key={`${item.id}-${item.model}-${item.element}-my1`}
          value={item.my1}
          onChange={(value) => handleChangeModelElement(item, "my1", value)}
        />
        <CheckBoxCell
          key={`${item.id}-${item.model}-${item.element}-mz1`}
          value={item.mz1}
          onChange={(value) => handleChangeModelElement(item, "mz1", value)}
        />
        <CheckBoxCell
          key={`${item.id}-${item.model}-${item.element}-fx2`}
          value={item.fx2}
          onChange={(value) => handleChangeModelElement(item, "fx2", value)}
        />
        <CheckBoxCell
          key={`${item.id}-${item.model}-${item.element}-fy2`}
          value={item.fy2}
          onChange={(value) => handleChangeModelElement(item, "fy2", value)}
        />
        <CheckBoxCell
          key={`${item.id}-${item.model}-${item.element}-fz2`}
          value={item.fz2}
          onChange={(value) => handleChangeModelElement(item, "fz2", value)}
        />
        <CheckBoxCell
          key={`${item.id}-${item.model}-${item.element}-mx2`}
          value={item.mx2}
          onChange={(value) => handleChangeModelElement(item, "mx2", value)}
        />
        <CheckBoxCell
          key={`${item.id}-${item.model}-${item.element}-my2`}
          value={item.my2}
          onChange={(value) => handleChangeModelElement(item, "my2", value)}
        />
        <CheckBoxCell
          key={`${item.id}-${item.model}-${item.element}-mz2`}
          value={item.mz2}
          onChange={(value) => handleChangeModelElement(item, "mz2", value)}
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
        Fx1: !!item.fx1,
        Fy1: !!item.fy1,
        Fz1: !!item.fz1,
        Mx1: !!item.mx1,
        My1: !!item.my1,
        Mz1: !!item.mz1,
        Fx2: !!item.fx2,
        Fy2: !!item.fy2,
        Fz2: !!item.fz2,
        Mx2: !!item.mx2,
        My2: !!item.my2,
        Mz2: !!item.mz2,
      })),
      "Releases"
    );
  }

  function showErrorMsg(msg: string) {
    dispatch(addEventAction(`Releases (Import): ${msg}`, "danger"));
  }

  function handleImport() {
    if (!project) return;
    importFromCSV((newData, isCSV) => {
      if (!isCSV || !Array.isArray(newData)) return;
      let changedProject = handleDeleteReleases(data, true);
      const newItems: OFReleasesUI[] = [];
      newData.forEach((item: any) => {
        let newItem: OFReleasesUI = {
          id: getNextId(newItems),
          selected: false,
        };
        let model: TOpenFrame | undefined;
        let element: TBeamElement | undefined;
        const itemModel = item["FS No."];
        if (itemModel) {
          model = getElementByName(
            // @ts-ignore
            changedProject.models as TOpenFrame[],
            itemModel
          );
          if (model) {
            newItem = { ...newItem, model: model.name };
            const elements = getBeamElementsOfModel(model);
            if (item.Element) {
              element = getElementByName(elements, item.Element);
              if (element) {
                newItem = {
                  ...newItem,
                  element: element.name,
                  fx1: item.Fx1 === true,
                  fy1: item.Fy1 === true,
                  fz1: item.Fz1 === true,
                  fx2: item.Fx2 === true,
                  fy2: item.Fy2 === true,
                  fz2: item.Fz2 === true,
                  mx1: item.Mx1 === true,
                  my1: item.My1 === true,
                  mz1: item.Mz1 === true,
                  mx2: item.Mx2 === true,
                  my2: item.My2 === true,
                  mz2: item.Mz2 === true,
                };
              } else {
                showErrorMsg(`(id: ${item.id}) - an element "${item.Element}" not found!`);
              }
            }
          } else {
            showErrorMsg(`(id: ${item.id}) - a model "${itemModel}" not found!`);
          }
        }
        newItems.push(newItem);
        if (model && element) {
          let elements:
            | "columns"
            | "beams"
            | "cantilevers"
            | "verticalBracings"
            | "kneeBracings"
            | "horizontalBracings"
            | undefined;
          switch (element.type) {
            case "COLUMN":
              elements = "columns";
              break;
            case "BEAM":
              elements = "beams";
              break;
            case "CANTILEVER":
              elements = "cantilevers";
              break;
            case "VERTICAL-BRACING":
              elements = "verticalBracings";
              break;
            case "KNEE-BRACING":
              elements = "kneeBracings";
              break;
            case "HORIZONTAL-BRACING":
              elements = "horizontalBracings";
              break;
            default:
              break;
          }
          if (elements) {
            // @ts-ignore
            changedProject = {
              ...changedProject,
              // @ts-ignore
              models: changedProject.models.map((mItem) =>
                mItem.name === model!.name
                  ? {
                      ...mItem,
                      //@ts-ignore
                      [elements]: (mItem[elements] as TBeamElement[]).map((el) => {
                        if (el.name === newItem.element) {
                          return {
                            ...el,
                            releases: {
                              fx1: newItem.fx1,
                              fy1: newItem.fy1,
                              fz1: newItem.fz1,
                              fx2: newItem.fx2,
                              fy2: newItem.fy2,
                              fz2: newItem.fz2,
                              mx1: newItem.mx1,
                              my1: newItem.my1,
                              mz1: newItem.mz1,
                              mx2: newItem.mx2,
                              my2: newItem.my2,
                              mz2: newItem.mz2,
                            },
                          };
                        }
                        return el;
                      }),
                    }
                  : mItem
              ),
            };
          }
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
        <span>Release</span>
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
                <GeneralCheckBoxCell
                  data={selectedData}
                  onChange={(selected) => {
                    handleChangeData(
                      data.map((item) => {
                        const selectedItem = selected.find((sItem) => sItem.id === item.id);
                        if (selectedItem?.id === item.id) return selectedItem;
                        return item;
                      })
                    );
                  }}
                />
                <th>FS No.</th>
                <th>Element</th>
                <th>Fx1</th>
                <th>Fy1</th>
                <th>Fz1</th>
                <th>Mx1</th>
                <th>My1</th>
                <th>Mz1</th>
                <th>Fx2</th>
                <th>Fy2</th>
                <th>Fz2</th>
                <th>Mx2</th>
                <th>My2</th>
                <th>Mz2</th>
              </tr>
            </thead>
            <tbody>{selectedData.map((item) => getRow(item))}</tbody>
          </table>
        </div>
      </div>
      <div className="hr" />
      <Paginator items={data} onChange={setSelectedData} />
    </div>
  );
};

export default Release;
