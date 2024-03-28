import React, { FunctionComponent, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { ApplicationState } from "../../../../../store";
import { TOpenFrame, TBeamOF, TCantileverOF } from "../../../../../store/main/openFrameTypes";
import { Project, SimpleDirection } from "../../../../../store/main/types";
import { OFBeamToBeamUI } from "../../../../../store/ui/types";
import { CheckBoxCell } from "../../../../common/CheckBoxCell";
import { SelectorCell } from "../../../../common/SelectorCell";
import { changeOFUIAction, addEventAction } from "../../../../../store/ui/actions";
import { Button } from "@blueprintjs/core";
import { NumericCell } from "../../../../common/NumericCell";
import {
  getNextId,
  getElementByName,
  convertToNamesArray,
  getIndexName,
  exportToCSV,
  importFromCSV,
  getImportProfileByDesignation,
  fixNumberToStr,
  getCurrentUI,
  getPosByDistance,
  getSimpleDirection,
  checkImportedNumber,
  roundM,
} from "../../../../3d-models/utils";
import { changeModel, changeProjectAction } from "../../../../../store/main/actions";
import { removeConnections, updateConnections } from "../../../../3d-models/openFrame";
import { GeneralCheckBoxCell } from "../../../../common/GeneralCheckBoxCell";
import { Section } from "../../../../../store/data/types";

type Props = {
  project?: Project;
  models: TOpenFrame[];
  profiles: Section[];
  libs: string[];
};

const BeamToBeam: FunctionComponent<Props> = (props) => {
  const { project, models, profiles, libs } = props;

  const openFrameUI = useSelector((state: ApplicationState) => getCurrentUI(state)?.openFrameUI);

  const dispatch = useDispatch();

  const data = useMemo(() => {
    return openFrameUI?.additionalBeams.beamToBeam ?? [];
  }, [openFrameUI]);

  function handleMsg(msg: string, type: "danger" | "none" | "success" | "warning") {
    dispatch(addEventAction(msg, type));
  }

  function handleChangeModel(model: TOpenFrame) {
    dispatch(changeModel(model));
  }

  function handleCreateElement(model: TOpenFrame, item: OFBeamToBeamUI) {
    if (!openFrameUI) return model;
    const elements = [...model.beams, ...model.cantilevers];
    const from = getElementByName(elements, item.from);
    const to = getElementByName(elements, item.to);
    if (from && to) {
      // const startPos = fixVector(from, from.startPos, item.distance);
      const startPos = getPosByDistance(item.distance, from.startPos, from.endPos);
      const endPos = startPos.clone();
      if (to.direction.includes("X")) {
        endPos.setZ(to.startPos.z);
      } else {
        endPos.setX(to.startPos.x);
      }
      const id = getIndexName(model.beams, "B");
      const newItem: TBeamOF = {
        id,
        uiId: item.id,
        type: "BEAM",
        secondType: "BtoB",
        name: `B${id}`,
        frame: from.frame,
        direction: getSimpleDirection(startPos, endPos) as SimpleDirection,
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
      return updateConnections(model, newItem, (a, b) =>
        handleMsg(
          `Additional Beams: Warning! Elements "${a}" and "${b}" are crossing in "${model.name}" model`,
          "warning"
        )
      );
    }
    return model;
  }

  function handleChangeElement(model: TOpenFrame, item: OFBeamToBeamUI) {
    const changed: TOpenFrame = {
      ...model,
      beams: model.beams.map((element) =>
        element.uiId === item.id ? { ...element, profile: item.profile! } : element
      ),
    };
    dispatch(changeModel(changed));
  }

  function findBeam(beams: TBeamOF[], id: number) {
    return beams.find((item) => item.secondType === "BtoB" && item.uiId === id);
  }

  function handleDeleteModels(elements: OFBeamToBeamUI[], project?: Project) {
    if (!openFrameUI) return;
    const map = new Map<string, number[]>();
    let changedProject = project ? { ...project } : undefined;
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

  function handleChangeData(beamToBeam: OFBeamToBeamUI[]) {
    if (!openFrameUI) return;
    dispatch(
      changeOFUIAction({
        ...openFrameUI,
        additionalBeams: { ...openFrameUI.additionalBeams, beamToBeam },
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
      },
    ]);
  }

  function handleDeleteRows() {
    handleChangeData(data.filter((item) => !item.selected));
    handleDeleteModels(data.filter((item) => item.selected));
  }

  function handleChangeRow(row: OFBeamToBeamUI, field: string, value: any) {
    handleChangeData(
      data.map((element) => {
        if (element.id === row.id) {
          return { ...element, [field]: value };
        } else return element;
      })
    );
  }

  function handleSoftChange(row: OFBeamToBeamUI, field: "profile", value: any) {
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
    row: OFBeamToBeamUI,
    field: "model" | "from" | "distance" | "to",
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

  function getBeams(beams?: (TBeamOF | TCantileverOF)[], beam?: TBeamOF | TCantileverOF) {
    if (!beams || !beam) return [];
    const filtered = beams.filter((item) => {
      if (
        item.name === beam.name ||
        item.startPos.y !== beam.startPos.y ||
        item.direction !== beam.direction
      )
        return false;
      if (beam.direction.includes("X")) {
        const aSX = roundM(beam.startPos.x);
        const aEX = roundM(beam.endPos.x);
        const bSX = roundM(item.startPos.x);
        return (aSX <= bSX && aEX >= bSX) || (aSX >= bSX && aEX <= bSX);
      } else {
        const aSZ = roundM(beam.startPos.z);
        const aEZ = roundM(beam.endPos.z);
        const bSZ = roundM(item.startPos.z);
        return (aSZ >= bSZ && aEZ <= bSZ) || (aSZ <= bSZ && aEZ >= bSZ);
      }
    });
    return filtered;
  }

  function getRow(item: OFBeamToBeamUI) {
    const model = getElementByName(models, item.model);
    const beams = model ? [...model.beams, ...model.cantilevers] : [];
    const beam = getElementByName(beams, item.from);
    const toBeams = getBeams(beams, beam);
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
        />
        <SelectorCell<string>
          items={convertToNamesArray(beams)}
          itemKey={(item) => item}
          itemLabel={(item) => item}
          selected={item.from}
          onSelect={(value) => handleHardChange(item, "from", value)}
          filter={(query, item) => (query ? item.includes(query.toUpperCase()) : true)}
        />
        <NumericCell
          isDecimal={true}
          value={item.distance}
          onChange={(value) => handleHardChange(item, "distance", value)}
          style={{ width: `${100 / 7}%` }}
        />
        <SelectorCell<string>
          items={convertToNamesArray(toBeams)}
          itemKey={(item) => item}
          itemLabel={(item) => item}
          selected={item.to}
          onSelect={(value) => handleHardChange(item, "to", value)}
          filter={(query, item) => (query ? item.includes(query.toUpperCase()) : true)}
        />
        <SelectorCell<string>
          items={libs}
          selected={item.library}
          onSelect={(value) => handleChangeRow(item, "library", value)}
          itemKey={(item) => item}
          itemLabel={(item) => item}
        />
        <SelectorCell<Section>
          items={profiles.filter((profile) => profile.country_code === item.library)}
          selected={item.profile}
          onSelect={(value) => handleSoftChange(item, "profile", value)}
          itemKey={(item) => item.profile_section_id}
          itemLabel={(item) => item.designation}
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
        "From Beam No.": item.from ?? "",
        "Distance from start (m)": fixNumberToStr(item.distance),
        "To Beam No.": item.to ?? "",
        "C/S Library": item.library ?? "",
        Profile: item.profile?.designation ?? "",
      })),
      "Beam To Beam"
    );
  }

  function showErrorMsg(msg: string) {
    dispatch(addEventAction(`Beam To Beam (Import): ${msg}`, "danger"));
  }

  function handleImport() {
    if (!project) return;
    importFromCSV((newData, isCSV) => {
      if (!isCSV || !Array.isArray(newData)) return;
      let changedProject = handleDeleteModels(data, project);
      if (!changedProject) return;
      const newBeams: OFBeamToBeamUI[] = [];
      newData.forEach((item: any) => {
        let newItem: OFBeamToBeamUI = {
          id: getNextId(newBeams),
          selected: false,
          distance: 0,
        };
        let model: TOpenFrame | undefined;
        const itemModel = item["FS No."];
        const itemFrom = item["From Beam No."];
        const itemDistance = item["Distance from start (m)"];
        const itemTo = item["To Beam No."];
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
            const from = getElementByName(elements, itemFrom);
            if (from) {
              newItem = { ...newItem, from: from.name };
            } else {
              showErrorMsg(`(id: ${item.id}) - an element "${itemFrom}" not found!`);
            }
            const to = getElementByName(elements, itemTo);
            if (to) {
              newItem = { ...newItem, to: to.name };
            } else {
              showErrorMsg(`(id: ${item.id}) - an element "${itemTo}" not found!`);
            }
          } else {
            showErrorMsg(`(id: ${item.id}) - a model "${itemModel}" not found!`);
          }
        }
        newItem = { ...newItem, distance: checkImportedNumber(itemDistance, false) ?? 0 };
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
        if (model && newItem.from && newItem.to && newItem.profile) {
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
        <span>Beam To Beam</span>
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

export default BeamToBeam;
