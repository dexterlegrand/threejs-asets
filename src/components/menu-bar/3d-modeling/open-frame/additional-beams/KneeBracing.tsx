import React, {
  FunctionComponent,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { Button } from "@blueprintjs/core";
import { Project } from "../../../../../store/main/types";
import {
  TOpenFrame,
  TColumnOF,
  TBeamOF,
  TKneeBracingOF,
  TCantileverOF,
} from "../../../../../store/main/openFrameTypes";
import { OFKneeBracingsUI } from "../../../../../store/ui/types";
import { SelectorCell } from "../../../../common/SelectorCell";
import { CheckBoxCell } from "../../../../common/CheckBoxCell";
import { useDispatch, useSelector } from "react-redux";
import { ApplicationState } from "../../../../../store";
import {
  changeOFUIAction,
  addEventAction,
} from "../../../../../store/ui/actions";
import { NumericCell } from "../../../../common/NumericCell";
import {
  getTopOffset,
  getElementByName,
  convertToNamesArray,
  getNextId,
  getElementByField,
  exportToCSV,
  importFromCSV,
  fixNumberToStr,
  getImportProfileByDesignation,
  getCurrentUI,
  roundVectorM,
  roundM,
  checkImportedNumber,
} from "../../../../3d-models/utils";
import { Vector3 } from "three";
import {
  changeModel,
  changeProjectAction,
} from "../../../../../store/main/actions";
import {
  fixVector,
  updateConnections,
  removeConnections,
} from "../../../../3d-models/openFrame";
import { GeneralCheckBoxCell } from "../../../../common/GeneralCheckBoxCell";
import { Section } from "../../../../../store/data/types";

type Props = {
  project?: Project;
  models: TOpenFrame[];
  profiles: Section[];
  libs: string[];
};

const widthPercent = `${100 / 9}%`;

const KneeBracing: FunctionComponent<Props> = (props) => {
  const { project, models, profiles, libs } = props;

  const [offsetTop, setOffsetTop] = useState<number>(0);

  const openFrameUI = useSelector(
    (state: ApplicationState) => getCurrentUI(state)?.openFrameUI
  );

  const dispatch = useDispatch();

  const data = useMemo(() => {
    return openFrameUI?.additionalBeams.kneeBracings ?? [];
  }, [openFrameUI]);

  const tableRef = useRef<HTMLTableElement>(null);

  useEffect(() => {
    setOffsetTop(getTopOffset(tableRef.current, 1));
  }, [data]);

  function handleChangeModel(model: TOpenFrame) {
    dispatch(changeModel(model));
  }

  function handleCreateElement(model: TOpenFrame, item: OFKneeBracingsUI) {
    if (!openFrameUI) return model;
    const elements = [...model.beams, ...model.cantilevers];
    const id = getNextId(model.kneeBracings);
    const beam = getElementByName(elements, item.beam);
    const column = getElementByName(model.columns, item.column);
    if (beam && column) {
      const isStart = beam.startConnected.includes(column.name);
      const startPos = roundVectorM(
        fixVector(
          beam,
          isStart ? beam.startPos : beam.endPos,
          isStart ? item.fromBeamJunction : -item.fromBeamJunction
        )
      );
      const endPos = roundVectorM(
        new Vector3(
          column.startPos.x,
          beam.startPos.y - item.fromColumnJunction,
          column.startPos.z
        )
      );
      const newItem: TKneeBracingOF = {
        id,
        uiId: item.id,
        type: "KNEE-BRACING",
        name: `KB${id}`,
        frame: beam.frame,
        startPos,
        endPos,
        profile: item.profile!,
        orientation: 0,
        startConnected: [],
        connected: [],
        endConnected: [],
        releases: {
          my1: true,
          mz1: true,
          my2: true,
          mz2: true,
        },
      };
      if (roundM(newItem.startPos.distanceTo(newItem.endPos)) === 0) {
        dispatch(
          addEventAction(
            `The element "${newItem.name}" has zero length`,
            "danger"
          )
        );
      }
      return updateConnections(model, newItem, () => {});
    }
    return model;
  }

  function handleChangeElement(model: TOpenFrame, item: OFKneeBracingsUI) {
    const changed: TOpenFrame = {
      ...model,
      kneeBracings: model.kneeBracings.map((element) => {
        if (element.uiId === item.id) {
          if (roundM(element.startPos.distanceTo(element.endPos)) === 0) {
            dispatch(
              addEventAction(
                `The element "${element.name}" has zero length`,
                "danger"
              )
            );
          }
          return { ...element, profile: item.profile! };
        }
        return element;
      }),
    };
    dispatch(changeModel(changed));
  }

  function handleDeleteModels(elements: OFKneeBracingsUI[], project?: Project) {
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
          const element = getElementByField(newModel.kneeBracings, "uiId", id);
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

  function handleChangeData(kneeBracings: OFKneeBracingsUI[]) {
    if (!openFrameUI) return;
    dispatch(
      changeOFUIAction({
        ...openFrameUI,
        additionalBeams: { ...openFrameUI.additionalBeams, kneeBracings },
      })
    );
  }

  function handleAddRow() {
    handleChangeData([
      ...data,
      {
        id: getNextId(data),
        selected: false,
        fromBeamJunction: 0,
        fromColumnJunction: 0,
      },
    ]);
  }

  function handleDeleteRows() {
    handleChangeData(data.filter((item) => !item.selected));
    handleDeleteModels(data.filter((item) => item.selected));
  }

  function handleChangeRow(row: OFKneeBracingsUI, field: string, value: any) {
    handleChangeData(
      data.map((cnt) => {
        if (cnt.id === row.id) {
          return { ...cnt, [field]: value };
        } else return cnt;
      })
    );
  }

  function handleSoftChange(row: OFKneeBracingsUI, field: string, value: any) {
    if (!openFrameUI) return;
    handleChangeRow(row, field, value);
    const changedUI = { ...row, [field]: value };
    const model = getElementByName(models, changedUI.model);
    if (!model || !changedUI.profile) return;
    const element = model.kneeBracings.find(
      (element) => element.uiId === changedUI.id
    );
    if (element) handleChangeElement(model, changedUI);
    else handleChangeModel(handleCreateElement(model, changedUI));
  }

  function handleHardChange(row: OFKneeBracingsUI, field: string, value: any) {
    if (!openFrameUI) return;
    handleChangeRow(row, field, value);
    const changedUI = { ...row, [field]: value };
    let model = getElementByName(models, changedUI.model);
    if (!model || !changedUI.profile) return;
    const element = model.kneeBracings.find(
      (element) => element.uiId === changedUI.id
    );
    if (element) model = removeConnections(model, element);
    handleChangeModel(handleCreateElement(model, changedUI));
  }

  function getColumns(columns?: TColumnOF[], beam?: TBeamOF | TCantileverOF) {
    if (!columns || !beam) return [];
    const filtered = columns.filter(
      (column) =>
        beam.startConnected.includes(column.name) ||
        beam.endConnected.includes(column.name)
    );
    return filtered;
  }

  function getRow(item: OFKneeBracingsUI) {
    const model = getElementByName(models, item.model);
    const beams = model ? [...model.beams, ...model.cantilevers] : [];
    const beam = getElementByName(beams, item.beam);
    const columns = getColumns(model?.columns, beam);
    const column = getElementByName(model?.columns, item.column);
    return (
      <tr key={item.id}>
        <CheckBoxCell
          key={item.id}
          value={item.selected}
          onChange={(value) => handleChangeRow(item, "selected", value)}
        />
        <td>{model?.kneeBracings.find((b) => b.uiId === item.id)?.name}</td>
        <SelectorCell<string>
          items={convertToNamesArray(models)}
          itemKey={(item) => item}
          itemLabel={(item) => item}
          selected={item.model}
          onSelect={(value) => handleHardChange(item, "model", value)}
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
          items={convertToNamesArray(columns)}
          itemKey={(item) => item}
          itemLabel={(item) => item}
          selected={item.column}
          onSelect={(value) => handleHardChange(item, "column", value)}
        />
        <NumericCell
          min={0}
          max={beam ? roundM(beam.startPos.distanceTo(beam.endPos)) : undefined}
          isDecimal={true}
          value={item.fromBeamJunction}
          onChange={(value) =>
            handleHardChange(item, "fromBeamJunction", value)
          }
          style={{ width: widthPercent }}
        />
        <NumericCell
          min={beam && column ? beam.endPos.y - column.endPos.y : undefined}
          max={beam && column ? beam.endPos.y - column.startPos.y : undefined}
          isDecimal={true}
          value={item.fromColumnJunction}
          onChange={(value) =>
            handleHardChange(item, "fromColumnJunction", value)
          }
          style={{ width: widthPercent }}
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
          id: item,
          "Element No.":
            model?.kneeBracings.find((b) => b.uiId === item.id)?.name ?? "",
          "OF No.": item.model ?? "",
          "Connected to Beam No.": item.beam ?? "",
          "Connected to Column No.": item.column ?? "",
          "Distance from Junction on Beam (m)": fixNumberToStr(
            item.fromBeamJunction
          ),
          "Distance from Junction on Column (m)": fixNumberToStr(
            item.fromColumnJunction
          ),
          "C/S Library": item.library ?? "",
          Profile: item.profile?.designation ?? "",
        };
      }),
      "Knee Bracings"
    );
  }

  function showErrorMsg(msg: string) {
    dispatch(addEventAction(`Knee Bracings (Import): ${msg}`, "danger"));
  }

  function createItems(
    project: Project,
    newData: any[],
    oldData: OFKneeBracingsUI[]
  ): { changedProject: Project; newItems: OFKneeBracingsUI[] } {
    let changedProject = { ...project };
    let newItems: OFKneeBracingsUI[] = [...oldData];
    for (const item of newData) {
      const itemName = item["Element No."] ?? "";
      const itemModel = item["OF No."];
      const itemColumn = item["Connected to Column No."];
      const itemBeam = item["Connected to Beam No."];
      const itemBJ = item["Distance from Junction on Beam (m)"];
      const itemCJ = item["Distance from Junction on Column (m)"];
      const itemLib = item["C/S Library"];
      const itemProfile = item["Profile"];

      if (
        newItems.some(
          (item) =>
            item.model === itemModel &&
            item.column === itemColumn &&
            item.fromColumnJunction === itemCJ &&
            item.fromBeamJunction === itemBJ &&
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

      const createdEl = model?.kneeBracings.find(
        (item) => item.name === itemName
      );

      if (model && createdEl) {
        const createdUI = newItems.find((item) => item.id === createdEl.uiId);
        if (
          createdUI &&
          createdUI.column === itemColumn &&
          createdUI.beam === itemBeam
        ) {
          let changed: OFKneeBracingsUI = {
            ...createdUI,
            fromBeamJunction: checkImportedNumber(itemBJ, false) ?? 0,
            fromColumnJunction: checkImportedNumber(itemCJ) ?? 0,
          };
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

      let newItem: OFKneeBracingsUI = {
        id: getNextId(newItems),
        selected: false,
        fromBeamJunction: checkImportedNumber(itemBJ, false) ?? 0,
        fromColumnJunction: checkImportedNumber(itemCJ) ?? 0,
      };

      if (itemModel) {
        if (model) {
          newItem = { ...newItem, model: model.name };
          const elements = [...model.beams, ...model.cantilevers];
          if (itemBeam) {
            const beam = getElementByName(elements, itemBeam);
            if (beam) {
              newItem = { ...newItem, beam: beam.name };
              if (itemColumn) {
                const column = getElementByName(
                  getColumns(model.columns, beam),
                  itemColumn
                );
                if (column) {
                  newItem = { ...newItem, column: column.name };
                } else {
                  showErrorMsg(
                    `(id: ${item.id}) - an element "${itemColumn}" not found!`
                  );
                }
              }
            } else {
              showErrorMsg(
                `(id: ${item.id}) - an element "${itemBeam}" not found!`
              );
            }
          }
        } else {
          showErrorMsg(`(id: ${item.id}) - a model "${itemModel}" not found!`);
        }
      }
      newItem = {
        ...newItem,
        fromBeamJunction: checkImportedNumber(itemBJ, false) ?? 0,
        fromColumnJunction: checkImportedNumber(itemCJ) ?? 0,
      };
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
      if (model && newItem.profile) {
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
        <span>Knee Bracing</span>
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
          <table ref={tableRef} className="table bg-gray">
            <thead>
              <tr>
                <GeneralCheckBoxCell
                  rowSpan={2}
                  data={data}
                  onChange={handleChangeData}
                />
                <th rowSpan={2}>Element No.</th>
                <th rowSpan={2}>OF No.</th>
                <th colSpan={2}>Element to be connected</th>
                <th colSpan={2}>Distance from Junction</th>
                <th rowSpan={2}>C/S Library</th>
                <th rowSpan={2}>Profile</th>
              </tr>
              <tr>
                <th style={{ top: offsetTop }}>Beam No.</th>
                <th style={{ top: offsetTop }}>Column No</th>
                <th style={{ top: offsetTop }}>on Beam (m)</th>
                <th style={{ top: offsetTop }}>on Column (m)</th>
              </tr>
            </thead>
            <tbody>{data.map((item) => getRow(item))}</tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default React.memo(KneeBracing);
