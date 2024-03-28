import React, { FunctionComponent, useMemo } from "react";
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
import { changeOFUIAction, addEventAction } from "../../../../../store/ui/actions";
import { Button } from "@blueprintjs/core";
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

const PlanBracings: FunctionComponent<Props> = (props) => {
  const { project, models, profiles, libs } = props;

  const openFrameUI = useSelector((state: ApplicationState) => getCurrentUI(state)?.openFrameUI);

  const dispatch = useDispatch();

  const data = useMemo(() => {
    return openFrameUI?.additionalBeams.planBracings ?? [];
  }, [openFrameUI]);

  function handleChangeModel(model: TOpenFrame) {
    dispatch(changeModel(model));
  }

  function handleCreateElement(model: TOpenFrame, item: OFPlanBracingsUI) {
    if (!openFrameUI) return model;
    const elements = [...model.beams, ...model.cantilevers, ...model.staircases];
    const from = getElementByName(elements, item.fromBeam);
    const to = getElementByName(elements, item.toBeam);
    if (from && to) {
      const id = getNextId(model.horizontalBracings);
      const startPos = roundVectorM(getPosByDistance(item.fromBeamDFS, from.startPos, from.endPos));
      const endPos = roundVectorM(getPosByDistance(item.toBeamDFS, to.startPos, to.endPos));
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
      return updateConnections(model, newItem, () => {});
    }
    return model;
  }

  function handleChangeElement(model: TOpenFrame, item: OFPlanBracingsUI) {
    const changed: TOpenFrame = {
      ...model,
      horizontalBracings: model.horizontalBracings.map((element) =>
        element.uiId === item.id ? { ...element, profile: item.profile! } : element
      ),
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
          const element = getElementByField(newModel.horizontalBracings, "uiId", id);
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
    const element = model.horizontalBracings.find((element) => element.uiId === changedUI.id);
    if (element) handleChangeElement(model, changedUI);
    else handleChangeModel(handleCreateElement(model, changedUI));
  }

  function handleHardChange(row: OFPlanBracingsUI, field: string, value: any) {
    if (!openFrameUI) return;
    handleChangeRow(row, field, value);
    const changedUI = { ...row, [field]: value };
    let model = getElementByName(models, changedUI.model);
    if (!model || !changedUI.profile) return;
    const element = model.horizontalBracings.find((element) => element.uiId === changedUI.id);
    if (element) model = removeConnections(model, element);
    handleChangeModel(handleCreateElement(model, changedUI));
  }

  function getToBeams(
    frames?: TFrameOF[],
    beams?: (TBeamOF | TCantileverOF | TStaircaseOF)[],
    beam?: TBeamOF | TCantileverOF | TStaircaseOF
  ) {
    if (!frames || !beams || !beam) return [];
    if (beam.type === "STAIRCASE") {
      return beams.filter(
        (item) => item.type === beam.type && item.id !== beam.id && item.uiId === beam.uiId
      );
    } else {
      const frameIndex = frames.findIndex((item) => item.name === beam.frame);
      const nextFrame = frameIndex !== -1 ? frames[frameIndex + 1] : undefined;
      const filtered = beams.filter((item) => {
        return (
          item.name !== beam.name &&
          item.type !== "STAIRCASE" &&
          item.startPos.y === beam.startPos.y &&
          // @ts-ignore
          (beam.direction.includes("X") && item.direction.includes("X")
            ? item.startPos.z !== beam.startPos.z
            : true) &&
          // @ts-ignore
          (beam.direction.includes("Z") && item.direction.includes("Z")
            ? item.startPos.x !== beam.startPos.x
            : true) &&
          (item.frame === beam.frame ||
            (item.frame === nextFrame?.name &&
              item.startPos.x === nextFrame.chainage &&
              item.endPos.x === nextFrame.chainage))
        );
      });
      const leftItems = filtered
        .filter((item) => {
          return (
            // @ts-ignore
            item.direction.includes("X") && item.startPos.z <= beam.startPos.z
          );
        })
        .sort((a, b) => b.startPos.z - a.startPos.z);
      const rightItems = filtered
        .filter((item) => {
          return (
            // @ts-ignore
            item.direction.includes("X") && item.startPos.z >= beam.startPos.z
          );
        })
        .sort((a, b) => a.startPos.z - b.startPos.z);
      const minZ = leftItems[0]?.startPos.z ?? beam.startPos.z;
      const maxZ = rightItems[0]?.startPos.z ?? beam.startPos.z;
      return filtered.filter((item) => item.startPos.z >= minZ && item.startPos.z <= maxZ);
    }
  }

  function getRow(item: OFPlanBracingsUI) {
    const model = getElementByName(models, item.model);
    const beams = model ? [...model.beams, ...model.cantilevers, ...model.staircases] : [];
    const fromBeam = getElementByName(beams, item.fromBeam);
    const toBeams = getToBeams(model?.frames, beams, fromBeam);
    const toBeam = getElementByName(toBeams, item.toBeam);
    const widthPercent = `${100 / 8}%`;
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
          items={convertToNamesArray(beams)}
          itemKey={(item) => item}
          itemLabel={(item) => item}
          selected={item.fromBeam}
          onSelect={(value) => handleHardChange(item, "fromBeam", value)}
          filterable={true}
          filter={(query, item) => (query ? item.includes(query.toUpperCase()) : true)}
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
          filterable={true}
          filter={(query, item) => (query ? item.includes(query.toUpperCase()) : true)}
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
        "From Beam No.": item.fromBeam ?? "",
        "Distance from start of First Beam (m)": fixNumberToStr(item.fromBeamDFS),
        "To Beam No.": item.toBeam ?? "",
        "Distance from start of Second Beam (m)": fixNumberToStr(item.toBeamDFS),
        "C/S Library": item.library ?? "",
        Profile: item.profile?.designation ?? "",
      })),
      "Plan Bracings"
    );
  }

  function showErrorMsg(msg: string) {
    dispatch(addEventAction(`Plan Bracings (Import): ${msg}`, "danger"));
  }

  function handleImport() {
    if (!project) return;
    importFromCSV((newData, isCSV) => {
      if (!isCSV || !Array.isArray(newData)) return;
      let changedProject = handleDeleteModels(data, project);
      if (!changedProject) return;
      const newItems: OFPlanBracingsUI[] = [];
      newData.forEach((item: any) => {
        let newItem: OFPlanBracingsUI = {
          id: getNextId(newItems),
          selected: false,
          fromBeamDFS: 0,
          toBeamDFS: 0,
        };
        let model: TOpenFrame | undefined;
        const itemModel = item["FS No."];
        const itemFrom = item["From Beam No."];
        const itemDistance1 = item["Distance from start of First Beam (m)"];
        const itemTo = item["To Beam No."];
        const itemDistance2 = item["Distance from start of Second Beam (m)"];
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
            const elements = [...model.beams, ...model.cantilevers];
            if (itemFrom) {
              const fromBeam = getElementByName(elements, itemFrom);
              if (fromBeam) {
                newItem = { ...newItem, fromBeam: fromBeam.name };
              } else {
                showErrorMsg(`(id: ${item.id}) - an element "${itemFrom}" not found!`);
              }
            }
            if (itemTo) {
              const toBeam = getElementByName(elements, itemTo);
              if (toBeam) {
                newItem = { ...newItem, toBeam: toBeam.name };
              } else {
                showErrorMsg(`(id: ${item.id}) - an element "${itemTo}" not found!`);
              }
            }
          } else {
            showErrorMsg(`(id: ${item.id}) - a model "${item.model}" not found!`);
          }
        }
        if (itemDistance1) {
          if (isNumber(itemDistance1)) {
            newItem = {
              ...newItem,
              fromBeamDFS: Math.abs(itemDistance1),
            };
          } else {
            showErrorMsg(
              `(id: ${item.id}) - a value of "Distance from start (m)" "${itemDistance1}" is not a number!`
            );
          }
        }
        if (itemDistance2) {
          if (isNumber(itemDistance2)) {
            newItem = {
              ...newItem,
              toBeamDFS: Math.abs(itemDistance2),
            };
          } else {
            showErrorMsg(
              `(id: ${item.id}) - a value of "Distance from start (m)" "${itemDistance2}" is not a number!`
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
        if (model && newItem.profile) {
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
        <span>Plan Bracings</span>
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

export default PlanBracings;
