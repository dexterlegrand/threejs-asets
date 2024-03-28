import React, { FunctionComponent, useMemo } from "react";
import { Button } from "@blueprintjs/core";
import { TOpenFrame, TBeamElement, TBeamOF } from "../../../../../store/main/openFrameTypes";
import { Orientation, Project } from "../../../../../store/main/types";
import { useDispatch, useSelector } from "react-redux";
import { ApplicationState } from "../../../../../store";
import { OFBeamUI } from "../../../../../store/ui/types";
import { changeOFUIAction, addEventAction } from "../../../../../store/ui/actions";
import { CheckBoxCell } from "../../../../common/CheckBoxCell";
import { SelectorCell } from "../../../../common/SelectorCell";
import {
  getElementByName,
  getNextId,
  exportToCSV,
  importFromCSV,
  getImportProfileByDesignation,
  getCurrentUI,
} from "../../../../3d-models/utils";
import { orientations } from "../../../../../store/main/constants";
import { changeModel, changeProjectAction } from "../../../../../store/main/actions";
import {
  getMapOfBeamElements,
  getSeparetedElementsOfModel,
  mapToArray,
} from "../../../../3d-models/openFrame";
import { GeneralCheckBoxCell } from "../../../../common/GeneralCheckBoxCell";
import { Section } from "../../../../../store/data/types";

type Props = {
  project?: Project;
  models: TOpenFrame[];
  profiles: Section[];
  libs: string[];
};

const GeometryBeams: FunctionComponent<Props> = (props) => {
  const { project, models, profiles, libs } = props;

  const openFrameUI = useSelector((state: ApplicationState) => getCurrentUI(state)?.openFrameUI);

  const dispatch = useDispatch();

  const data = useMemo(() => {
    return openFrameUI?.members.beams ?? [];
  }, [openFrameUI]);

  function handleChangeData(beams: OFBeamUI[]) {
    if (!openFrameUI) return;
    dispatch(
      changeOFUIAction({
        ...openFrameUI,
        members: { ...openFrameUI.members, beams },
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
    handleChangeData(data.filter((item) => !item.selected));
    handleRestoreElements(data.filter((item) => item.selected));
  }

  function handleRestoreElements(elements: OFBeamUI[], toReturn?: boolean) {
    if (!project || !openFrameUI) return;
    let changedProject = { ...project };
    const map = new Map<string, OFBeamUI[]>();
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
        if (item.type === "BEAM") {
          const beam = item as TBeamOF;
          if (beam.secondType === "GENERAL") {
            profile = beam.direction === "X" ? model.frameTieProfile : model.frameBeamProfile;
          } else if (beam.secondType === "BtoB") {
            profile = openFrameUI.additionalBeams.beamToBeam.find((btob) => btob.id === beam.uiId)
              ?.profile;
          } else if (beam.secondType === "CtoB") {
            profile = openFrameUI.additionalBeams.columnToBeam.find((ctob) => ctob.id === beam.uiId)
              ?.profile;
          } else if (beam.secondType === "CtoC") {
            profile = openFrameUI.additionalBeams.columnToColumn.find(
              (ctoc) => ctoc.id === beam.uiId
            )?.profile;
          } else if (beam.secondType === "ACCESSORY") {
            for (const ag of model.accessories) {
              if (profile) break;
              for (const agEl of ag.elements) {
                if (agEl.beams.includes(beam.name)) {
                  profile = agEl.beamProfile;
                  break;
                }
              }
            }
          }
        } else if (item.type === "CANTILEVER") {
          profile = openFrameUI.additionalBeams.cantilever.find((cnt) => cnt.id === item.uiId)
            ?.profile;
        } else if (item.type === "HORIZONTAL-BRACING") {
          profile = openFrameUI.additionalBeams.planBracings.find((pb) => pb.id === item.uiId)
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

  function handleChangeModelElement(row: OFBeamUI, field: "profile" | "orientation", value: any) {
    const model = getElementByName(models, row.model);
    const element = getElementByName(getModelBeams(model), row.element);
    if (model && element) {
      handleChangeRow(row, field, value);
      const elements =
        element.type === "BEAM"
          ? "beams"
          : element.type === "CANTILEVER"
          ? "cantilevers"
          : "horizontalBracings";
      dispatch(
        changeModel({
          ...model,
          [elements]: (model[elements] as TBeamElement[]).map((el) => {
            if (el.name === row.element) {
              return {
                ...el,
                [field]: value,
              };
            }
            return el;
          }),
        } as TOpenFrame)
      );
    }
  }

  function handleChangeRow(row: OFBeamUI, field: string, value: any) {
    handleChangeData(
      data.map((cnt) => {
        if (cnt.id === row.id) {
          return { ...cnt, [field]: value };
        } else return cnt;
      })
    );
  }

  function handleChangeModel(row: OFBeamUI, model?: string) {
    handleChangeData(
      data.map((cnt) => {
        if (cnt.id === row.id) {
          return { ...cnt, model, element: undefined };
        } else return cnt;
      })
    );
  }

  function handleChangeElement(row: OFBeamUI, element?: TBeamElement) {
    handleChangeData(
      data.map((cnt) => {
        if (cnt.id === row.id) {
          return {
            ...cnt,
            element: element?.name,
            library: element?.profile.country_code?.trim() ?? "",
            profile: element?.profile,
          };
        } else return cnt;
      })
    );
  }

  function getModelBeams(model?: TOpenFrame): TBeamElement[] {
    if (!model) return [];
    return [...model.beams, ...model.cantilevers, ...model.horizontalBracings, ...model.staircases];
  }

  function getRow(item: OFBeamUI) {
    const model = getElementByName(models, item.model);
    const beams = getModelBeams(model);
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
          items={beams}
          itemKey={(item) => item.name}
          itemLabel={(item) => item.name}
          selected={beams.find((beam) => beam.name === item.element)}
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
      "Beams Geometry"
    );
  }

  function showErrorMsg(msg: string) {
    dispatch(addEventAction(`Beams Geometry (Import): ${msg}`, "danger"));
  }

  function handleImport() {
    if (!project) return;
    importFromCSV((newData, isCSV) => {
      if (!isCSV || !Array.isArray(newData)) return;
      let changedProject = handleRestoreElements(data, true);
      const newItems: OFBeamUI[] = [];
      newData.forEach((item: any) => {
        let newItem: OFBeamUI = {
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
            const elements = [
              ...model.beams,
              ...model.cantilevers,
              ...model.horizontalBracings,
              ...model.staircases,
            ];
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
            element.type === "BEAM"
              ? "beams"
              : element.type === "CANTILEVER"
              ? "cantilevers"
              : "horizontalBracings";
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
        <span>Geometry Beams</span>
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

export default GeometryBeams;
