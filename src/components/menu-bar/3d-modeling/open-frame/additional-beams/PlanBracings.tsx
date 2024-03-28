import React, { FunctionComponent, useMemo, useState } from "react";
import {
  TBeamOF,
  TFrameOF,
  TOpenFrame,
  THorizontalBracingOF,
  TCantileverOF,
  TStaircaseOF,
} from "../../../../../store/main/openFrameTypes";
import { Project } from "../../../../../store/main/types";
import { useDispatch, useSelector } from "react-redux";
import { ApplicationState } from "../../../../../store";
import { OFPlanBracingsUI } from "../../../../../store/ui/types";
import {
  changeOFUIAction,
  addEventAction,
} from "../../../../../store/ui/actions";
import { Button, Checkbox, FormGroup, Popover } from "@blueprintjs/core";
import { CheckBoxCell } from "../../../../common/CheckBoxCell";
import { SelectorCell } from "../../../../common/SelectorCell";
import { NumericCell } from "../../../../common/NumericCell";
import {
  getElementByName,
  getNextId,
  convertToNamesArray,
  getElementByField,
  exportToCSV,
  importFromCSV,
  getPosByDistance,
  fixNumberToStr,
  getImportProfileByDesignation,
  getCurrentUI,
  roundVectorM,
  roundM,
  checkImportedNumber,
} from "../../../../3d-models/utils";
import {
  changeModel,
  changeProjectAction,
} from "../../../../../store/main/actions";
import {
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

const PlanBracings: FunctionComponent<Props> = (props) => {
  const { project, models, profiles, libs } = props;

  const [filterByFrame, setFilterByFrame] = useState(false);

  const openFrameUI = useSelector(
    (state: ApplicationState) => getCurrentUI(state)?.openFrameUI
  );

  const dispatch = useDispatch();

  const data = useMemo(() => {
    return openFrameUI?.additionalBeams.planBracings ?? [];
  }, [openFrameUI]);

  function handleChangeModel(model: TOpenFrame) {
    dispatch(changeModel(model));
  }

  function handleCreateElement(model: TOpenFrame, item: OFPlanBracingsUI) {
    if (!openFrameUI) return model;
    const elements = [
      ...model.beams,
      ...model.cantilevers,
      ...model.staircases,
    ];
    const from = getElementByName(elements, item.fromBeam);
    const to = getElementByName(elements, item.toBeam);
    if (from && to) {
      const id = getNextId(model.horizontalBracings);
      const startPos = roundVectorM(
        getPosByDistance(item.fromBeamDFS, from.startPos, from.endPos)
      );
      const endPos = roundVectorM(
        getPosByDistance(item.toBeamDFS, to.startPos, to.endPos)
      );
      const newItem: THorizontalBracingOF = {
        id,
        uiId: item.id,
        type: "HORIZONTAL-BRACING",
        name: `HB${id}`,
        frame: from.frame,
        startPos,
        endPos,
        // @ts-ignore
        connectedTo: from.type,
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

  function handleChangeElement(model: TOpenFrame, item: OFPlanBracingsUI) {
    const changed: TOpenFrame = {
      ...model,
      horizontalBracings: model.horizontalBracings.map((element) => {
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

  function handleDeleteModels(elements: OFPlanBracingsUI[], project?: Project) {
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
          const element = getElementByField(
            newModel.horizontalBracings,
            "uiId",
            id
          );
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

  function handleChangeData(planBracings: OFPlanBracingsUI[]) {
    if (!openFrameUI) return;
    dispatch(
      changeOFUIAction({
        ...openFrameUI,
        additionalBeams: { ...openFrameUI.additionalBeams, planBracings },
      })
    );
  }

  function handleAddRow() {
    handleChangeData([
      ...data,
      {
        id: getNextId(data),
        selected: false,
        fromBeamDFS: 0,
        toBeamDFS: 0,
      },
    ]);
  }

  function handleDeleteRows() {
    handleChangeData(data.filter((item) => !item.selected));
    handleDeleteModels(data.filter((item) => item.selected));
  }

  function handleChangeRow(row: OFPlanBracingsUI, field: string, value: any) {
    handleChangeData(
      data.map((cnt) => {
        if (cnt.id === row.id) {
          return { ...cnt, [field]: value };
        } else return cnt;
      })
    );
  }

  function handleSoftChange(row: OFPlanBracingsUI, field: string, value: any) {
    if (!openFrameUI) return;
    handleChangeRow(row, field, value);
    const changedUI = { ...row, [field]: value };
    const model = getElementByName(models, changedUI.model);
    if (!model || !changedUI.profile) return;
    const element = model.horizontalBracings.find(
      (element) => element.uiId === changedUI.id
    );
    if (element) handleChangeElement(model, changedUI);
    else handleChangeModel(handleCreateElement(model, changedUI));
  }

  function handleHardChange(row: OFPlanBracingsUI, field: string, value: any) {
    if (!openFrameUI) return;
    handleChangeRow(row, field, value);
    const changedUI = { ...row, [field]: value };
    let model = getElementByName(models, changedUI.model);
    if (!model || !changedUI.profile) return;
    const element = model.horizontalBracings.find(
      (element) => element.uiId === changedUI.id
    );
    if (element) model = removeConnections(model, element);
    handleChangeModel(handleCreateElement(model, changedUI));
  }

  function getRow(item: OFPlanBracingsUI) {
    const model = getElementByName(models, item.model);
    const beams = model
      ? [...model.beams, ...model.cantilevers, ...model.staircases]
      : [];
    const fromBeam = getElementByName(beams, item.fromBeam);
    const toBeams = getToBeams({
      frames: model?.frames,
      beams,
      beam: fromBeam,
      filterByFrame,
    });
    const toBeam = getElementByName(toBeams, item.toBeam);
    return (
      <tr key={item.id}>
        <CheckBoxCell
          key={item.id}
          value={item.selected}
          onChange={(value) => handleChangeRow(item, "selected", value)}
        />
        <td>
          {model?.horizontalBracings.find((b) => b.uiId === item.id)?.name}
        </td>
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
          selected={item.fromBeam}
          onSelect={(value) => handleHardChange(item, "fromBeam", value)}
          filter={(query, item) =>
            query ? item.includes(query.toUpperCase()) : true
          }
        />
        <NumericCell
          min={0}
          max={fromBeam ? fromBeam.startPos.distanceTo(fromBeam.endPos) : 0}
          isDecimal={true}
          value={item.fromBeamDFS}
          onChange={(value) => handleHardChange(item, "fromBeamDFS", value)}
          style={{ width: widthPercent }}
        />
        <SelectorCell<string>
          items={convertToNamesArray(toBeams)}
          itemKey={(item) => item}
          itemLabel={(item) => item}
          selected={item.toBeam}
          onSelect={(value) => handleHardChange(item, "toBeam", value)}
          filter={(query, item) =>
            query ? item.includes(query.toUpperCase()) : true
          }
        />
        <NumericCell
          min={0}
          max={toBeam ? toBeam.startPos.distanceTo(toBeam.endPos) : 0}
          isDecimal={true}
          value={item.toBeamDFS}
          onChange={(value) => handleHardChange(item, "toBeamDFS", value)}
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
          id: item.id,
          "Element No.":
            model?.kneeBracings.find((b) => b.uiId === item.id)?.name ?? "",
          "OF No.": item.model ?? "",
          "From Beam No.": item.fromBeam ?? "",
          "Distance from start of First Beam (m)": fixNumberToStr(
            item.fromBeamDFS
          ),
          "To Beam No.": item.toBeam ?? "",
          "Distance from start of Second Beam (m)": fixNumberToStr(
            item.toBeamDFS
          ),
          "C/S Library": item.library ?? "",
          Profile: item.profile?.designation ?? "",
        };
      }),
      "Plan Bracings"
    );
  }

  function showErrorMsg(msg: string) {
    dispatch(addEventAction(`Plan Bracings (Import): ${msg}`, "danger"));
  }

  function createItems(
    project: Project,
    newData: any[],
    oldData: OFPlanBracingsUI[]
  ): { changedProject: Project; newItems: OFPlanBracingsUI[] } {
    let changedProject = { ...project };
    let newItems: OFPlanBracingsUI[] = [...oldData];
    for (const item of newData) {
      const itemName = item["Element No."] ?? "";
      const itemModel = item["OF No."];
      const itemFrom = item["From Beam No."];
      const itemDistance1 = item["Distance from start of First Beam (m)"];
      const itemTo = item["To Beam No."];
      const itemDistance2 = item["Distance from start of Second Beam (m)"];
      const itemLib = item["C/S Library"];
      const itemProfile = item["Profile"];

      if (
        newItems.some(
          (item) =>
            item.model === itemModel &&
            item.library === itemLib &&
            item.fromBeam === itemFrom &&
            item.fromBeamDFS === itemDistance1 &&
            item.toBeam === itemTo &&
            item.toBeamDFS === itemDistance2 &&
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

      const createdEl = model?.horizontalBracings.find(
        (item) => item.name === itemName
      );

      if (model && createdEl) {
        const createdUI = newItems.find((item) => item.id === createdEl.uiId);
        if (
          createdUI &&
          createdUI.fromBeam === itemFrom &&
          createdUI.toBeam === itemTo
        ) {
          let changed: OFPlanBracingsUI = {
            ...createdUI,
            fromBeamDFS: checkImportedNumber(itemDistance1, false) ?? 0,
            toBeamDFS: checkImportedNumber(itemDistance2, false) ?? 0,
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

      let newItem: OFPlanBracingsUI = {
        id: getNextId(newItems),
        selected: false,
        fromBeamDFS: checkImportedNumber(itemDistance1, false) ?? 0,
        toBeamDFS: checkImportedNumber(itemDistance2, false) ?? 0,
      };

      if (itemModel) {
        if (model) {
          newItem = { ...newItem, model: model.name };
          const elements = [...model.beams, ...model.cantilevers];
          if (itemFrom) {
            const fromBeam = getElementByName(elements, itemFrom);
            if (fromBeam) {
              newItem = { ...newItem, fromBeam: fromBeam.name };
            } else {
              showErrorMsg(
                `(id: ${item.id}) - an element "${itemFrom}" not found!`
              );
            }
          }
          if (itemTo) {
            const toBeam = getElementByName(elements, itemTo);
            if (toBeam) {
              newItem = { ...newItem, toBeam: toBeam.name };
            } else {
              showErrorMsg(
                `(id: ${item.id}) - an element "${itemTo}" not found!`
              );
            }
          }
        } else {
          showErrorMsg(`(id: ${item.id}) - a model "${item.model}" not found!`);
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
        <span>Plan Bracings</span>
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
        <Popover
          content={
            <>
              <div className={"d-flex f-ai-center bg-gray p-end-10"}>
                <div className="label-light w-mc p-start-10">
                  Filter by Frames
                </div>
                <FormGroup className={"m-5"}>
                  <Checkbox
                    checked={filterByFrame}
                    onChange={(event) =>
                      setFilterByFrame(event.currentTarget.checked)
                    }
                  />
                </FormGroup>
              </div>
            </>
          }
        >
          <Button small text="Options" />
        </Popover>
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
                <th>From Beam No.</th>
                <th>Distance from start (m)</th>
                <th>To Beam No.</th>
                <th>Distance from start (m)</th>
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

export default React.memo(PlanBracings);

export function getToBeams({
  frames,
  beams,
  beam,
  filterByFrame,
}: {
  frames?: TFrameOF[];
  beams?: (TBeamOF | TCantileverOF | TStaircaseOF)[];
  beam?: TBeamOF | TCantileverOF | TStaircaseOF;
  filterByFrame: boolean;
}) {
  if (!beams || !beam) return [];
  if (filterByFrame && !frames) return [];
  if (beam.type === "STAIRCASE") {
    return beams.filter(
      (item) =>
        item.type === beam.type &&
        item.id !== beam.id &&
        item.uiId === beam.uiId
    );
  } else {
    const frameIndex = filterByFrame
      ? frames!.findIndex((item) => item.name === beam.frame)
      : undefined;
    const nextFrame =
      filterByFrame && frames && frameIndex && frameIndex !== -1
        ? frames[frameIndex + 1]
        : undefined;
    const aY = roundM(beam.startPos.y);
    const filtered = beams.filter((item) => {
      const bY = roundM(item.startPos.y);
      if (item.name === beam.name || item.type === "STAIRCASE" || aY !== bY)
        return false;
      if (
        // @ts-ignore
        beam.direction.includes("X") &&
        // @ts-ignore
        item.direction.includes("X") &&
        item.startPos.z === beam.startPos.z
      )
        return false;
      if (
        // @ts-ignore
        beam.direction.includes("Z") &&
        // @ts-ignore
        item.direction.includes("Z") &&
        item.startPos.x === beam.startPos.x
      )
        return false;
      if (filterByFrame) {
        return (
          item.frame === beam.frame ||
          (item.frame === nextFrame?.name &&
            item.startPos.x === nextFrame.chainage &&
            item.endPos.x === nextFrame.chainage)
        );
      }
      return true;
    });
    return filtered;
  }
}
