import React, { useMemo, useState, useEffect, useRef } from "react";
import { Project } from "../../../../../store/main/types";
import { useDispatch, useSelector } from "react-redux";
import { ApplicationState } from "../../../../../store";
import { getFSModels } from "../../../../3d-models/openFrame";
import { changeOFUIAction } from "../../../../../store/ui/actions";
import { GeneralCheckBoxCell } from "../../../../common/GeneralCheckBoxCell";
import { Button } from "@blueprintjs/core";
import { CheckBoxCell } from "../../../../common/CheckBoxCell";
import { OFTrussUI } from "../../../../../store/ui/types";
import { SelectorCell } from "../../../../common/SelectorCell";
import {
  convertToNamesArray,
  getElementByName,
  getNextId,
  getTopOffset,
  importFromCSV,
  getCurrentUI,
} from "../../../../3d-models/utils";
import { NumericCell } from "../../../../common/NumericCell";
import { changeModel } from "../../../../../store/main/actions";
import { TOpenFrame, TTrussOF, TTrussType } from "../../../../../store/main/openFrameTypes";
import { Section } from "../../../../../store/data/types";

type Props = {
  project?: Project;
  profiles: Section[];
  libs: string[];
};

export function Truss(props: Props) {
  const { project, profiles, libs } = props;

  const [offsetTop1, setOffsetTop1] = useState<number>(0);
  const [offsetTop2, setOffsetTop2] = useState<number>(0);

  const openFrameUI = useSelector((state: ApplicationState) => getCurrentUI(state)?.openFrameUI);

  const dispatch = useDispatch();

  const tableRef = useRef<HTMLTableElement>(null);

  const data = useMemo(() => {
    return openFrameUI?.truss ?? [];
  }, [openFrameUI]);

  const models = useMemo(() => {
    return getFSModels(project);
  }, [project]);

  useEffect(() => {
    setOffsetTop1(getTopOffset(tableRef.current, 1));
    setOffsetTop2(getTopOffset(tableRef.current, 2));
  }, [data]);

  function handleChangeModel(model: TOpenFrame) {
    dispatch(changeModel(model));
  }

  function handleChangeData(truss: OFTrussUI[]) {
    if (!openFrameUI) return;
    dispatch(changeOFUIAction({ ...openFrameUI, truss }));
  }

  function handleAddRow() {
    handleChangeData([
      ...data,
      {
        id: getNextId(data),
        selected: false,
        offset: 0,
        slope: 30,
        span: 0,
        spacing: 0,
        numbers: 1,
      },
    ]);
  }

  function handleCreateElements(row: OFTrussUI, model: TOpenFrame) {
    if (
      !row.type ||
      !row.from ||
      !row.inclinedProfile ||
      !row.tieProfile ||
      !row.rafterProfile ||
      !row.verticalProfile
    )
      return model;
    const id = getNextId(model.truss ?? []);
    const el: TTrussOF = {
      id,
      uiId: row.id,
      from: row.from,
      type: row.type,
      slope: row.slope,
      span: row.span,
      spacing: row.spacing,
      offset: row.offset,
      numbers: row.numbers,
      tie: row.tieProfile,
      rafter: row.rafterProfile,
      inclined: row.inclinedProfile,
      vertical: row.verticalProfile,
    };
    const changedModel: TOpenFrame = { ...model, truss: model.truss ? [...model.truss, el] : [el] };
    return changedModel;
  }

  function handleChangeRow(row: OFTrussUI, field: string, value: any, isHard?: boolean) {
    const changedRow = { ...row, [field]: value };
    handleChangeData(
      data.map((element) => {
        if (element.id === changedRow.id) {
          return changedRow;
        } else return element;
      })
    );
    if (field === "selected" || field === "library") return;
    let model = getElementByName(models, row.model);
    if (
      !changedRow.model ||
      !changedRow.from ||
      !changedRow.type ||
      !changedRow.rafterProfile ||
      !changedRow.tieProfile ||
      !changedRow.verticalProfile ||
      !changedRow.inclinedProfile
    )
      return;
    if (row.model !== changedRow.model) {
      model = getElementByName(models, changedRow.model);
    }
    if (!model) return;
    if (isHard) {
      const cp = handleDeleteModels([changedRow], project);
      // @ts-ignore
      model = cp?.models.find((m) => m.name === model?.name);
      model && handleChangeModel(handleCreateElements(changedRow, model));
    } else if (model.truss?.some((item) => item.uiId === changedRow.id)) {
      const changedModel: TOpenFrame = {
        ...model,
        truss:
          model.truss?.map((item) => {
            if (item.uiId === row.id) {
              return {
                ...item,
                rafter: changedRow.rafterProfile!,
                tie: changedRow.tieProfile!,
                vertical: changedRow.verticalProfile!,
                inclined: changedRow.inclinedProfile!,
              };
            }
            return item;
          }) ?? [],
      };
      handleChangeModel(changedModel);
    } else {
      handleChangeModel(handleCreateElements(changedRow, model));
    }
  }

  function handleDeleteRows() {
    handleChangeData(data.filter((item) => !item.selected));
    handleDeleteModels(data.filter((item) => item.selected));
  }

  function handleDeleteModels(elements: OFTrussUI[], project?: Project) {
    const map = new Map<string, number[]>();
    let changedProject = project ? { ...project } : undefined;
    for (const element of elements) {
      if (!element.model) continue;
      const ids = map.get(element.model);
      map.set(element.model, ids ? [...ids, element.id] : [element.id]);
    }
    for (const [key, ids] of Array.from(map.entries())) {
      const model = getElementByName(models, key);
      if (!model) continue;
      let newModel = { ...model };
      for (const id of ids) {
        newModel = {
          ...newModel,
          truss: newModel.truss?.filter((item) => item.uiId !== id) ?? [],
        };
      }
      if (changedProject) {
        changedProject = {
          ...changedProject,
          models: changedProject.models.map((mItem) =>
            mItem.name === newModel.name ? newModel : mItem
          ),
        };
      } else handleChangeModel(newModel);
    }
    return changedProject;
  }

  function getRow(row: OFTrussUI) {
    const model = getElementByName(models, row.model);
    const beams = model?.beams ?? [];
    return (
      <tr key={row.id}>
        <CheckBoxCell
          key={row.id}
          value={row.selected}
          onChange={(value) => handleChangeRow(row, "selected", value)}
        />
        <SelectorCell<string>
          items={convertToNamesArray(models)}
          itemKey={(item) => item}
          itemLabel={(item) => item}
          selected={row.model}
          onSelect={(value) => handleChangeRow(row, "model", value, true)}
        />
        <SelectorCell<string>
          items={convertToNamesArray(beams)}
          itemKey={(item) => item}
          itemLabel={(item) => item}
          selected={row.from}
          onSelect={(value) => handleChangeRow(row, "from", value, true)}
          filter={(query, item) => (query ? item.includes(query.toUpperCase()) : true)}
        />
        <NumericCell
          min={0}
          isDecimal={true}
          value={row.offset}
          onChange={(value) => handleChangeRow(row, "offset", value, true)}
        />
        <SelectorCell<TTrussType>
          items={["Doble Howe"]}
          itemKey={(item) => item}
          itemLabel={(item) => item}
          selected={row.type}
          onSelect={(value) => handleChangeRow(row, "type", value, true)}
        />
        <NumericCell
          min={0}
          max={60}
          isDecimal={true}
          value={row.slope}
          onChange={(value) => handleChangeRow(row, "slope", value, true)}
        />
        <NumericCell
          min={0}
          isDecimal={true}
          value={row.span}
          onChange={(value) => handleChangeRow(row, "span", value, true)}
        />
        <NumericCell
          min={0}
          isDecimal={true}
          value={row.spacing}
          onChange={(value) => handleChangeRow(row, "spacing", value, true)}
        />
        <NumericCell
          min={0}
          isDecimal={true}
          value={row.numbers}
          onChange={(value) => handleChangeRow(row, "numbers", value, true)}
        />
        <SelectorCell<string>
          items={libs}
          selected={row.rafterLib}
          onSelect={(value) => handleChangeRow(row, "rafterLib", value)}
          itemKey={(item) => item}
          itemLabel={(item) => item}
        />
        <SelectorCell<Section>
          items={profiles.filter((profile) => profile.country_code === row.rafterLib)}
          selected={row.rafterProfile}
          onSelect={(value) => handleChangeRow(row, "rafterProfile", value, true)}
          itemKey={(item) => item.profile_section_id}
          itemLabel={(item) => item.designation}
          filter={(query, item) =>
            query ? item.designation.toLocaleLowerCase().includes(query.toLocaleLowerCase()) : true
          }
        />
        <SelectorCell<string>
          items={libs}
          selected={row.tieLib}
          onSelect={(value) => handleChangeRow(row, "tieLib", value)}
          itemKey={(item) => item}
          itemLabel={(item) => item}
        />
        <SelectorCell<Section>
          items={profiles.filter((profile) => profile.country_code === row.tieLib)}
          selected={row.tieProfile}
          onSelect={(value) => handleChangeRow(row, "tieProfile", value, true)}
          itemKey={(item) => item.profile_section_id}
          itemLabel={(item) => item.designation}
          filter={(query, item) =>
            query ? item.designation.toLocaleLowerCase().includes(query.toLocaleLowerCase()) : true
          }
        />
        <SelectorCell<string>
          items={libs}
          selected={row.verticalLib}
          onSelect={(value) => handleChangeRow(row, "verticalLib", value)}
          itemKey={(item) => item}
          itemLabel={(item) => item}
        />
        <SelectorCell<Section>
          items={profiles.filter((profile) => profile.country_code === row.verticalLib)}
          selected={row.verticalProfile}
          onSelect={(value) => handleChangeRow(row, "verticalProfile", value, true)}
          itemKey={(item) => item.profile_section_id}
          itemLabel={(item) => item.designation}
          filter={(query, item) =>
            query ? item.designation.toLocaleLowerCase().includes(query.toLocaleLowerCase()) : true
          }
        />
        <SelectorCell<string>
          items={libs}
          selected={row.inclinedLib}
          onSelect={(value) => handleChangeRow(row, "inclinedLib", value)}
          itemKey={(item) => item}
          itemLabel={(item) => item}
        />
        <SelectorCell<Section>
          items={profiles.filter((profile) => profile.country_code === row.inclinedLib)}
          selected={row.inclinedProfile}
          onSelect={(value) => handleChangeRow(row, "inclinedProfile", value, true)}
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
    // exportToCSV(
    //   data.map((item) => {
    //     return {
    //       id: item.id,
    //       flight: item.name,
    //       model: item.model,
    //       from: item.from,
    //       vertical: item.fromDetails.vertical,
    //       horizontal: item.fromDetails.horizontal,
    //       supportType: item.fromDetails.supportType,
    //       to: item.to,
    //       distance: item.distance,
    //       width: item.width,
    //       orientation: item.orientation,
    //       profile: item.profile?.designation,
    //     };
    //   }),
    //   "FS Staircases"
    // );
  }

  function handleImport() {
    if (!project) return;
    importFromCSV((imported, isCSV) => {
      if (!isCSV || !Array.isArray(imported)) return;
    });
  }

  return (
    <div className="d-flex f-column">
      <div className="hr" />
      <div className="label-light bg-dark">
        <span>Truss</span>
        <Button small icon="trash" text="Delete" intent="warning" onClick={handleDeleteRows} />
        <Button
          small
          icon="export"
          text="Export to CSV"
          intent="success"
          disabled={true}
          onClick={handleExport}
        />
        <Button
          small
          icon="import"
          text="Import from CSV"
          intent="success"
          disabled={true}
          onClick={handleImport}
        />
        <Button small icon="plus" text="Add Row" intent="primary" onClick={handleAddRow} />
      </div>
      <div className="hr" />
      <div className={"p-5"}>
        <div className={"table-container"}>
          <table ref={tableRef} className="table bg-gray">
            <thead>
              <tr>
                <GeneralCheckBoxCell rowSpan={3} data={data} onChange={handleChangeData} />
                <th rowSpan={3}>Structure</th>
                <th rowSpan={3}>Corner Beam along roof length</th>
                <th rowSpan={3}>1st Truss from Beam Start point</th>
                <th colSpan={5}>Roof Details</th>
                <th colSpan={8}>Roof Element Sizes</th>
              </tr>
              <tr>
                <th>Type</th>
                <th>Slope</th>
                <th>Span</th>
                <th>Spacing</th>
                <th>Numbers</th>
                <th colSpan={2}>Rafter</th>
                <th colSpan={2}>Tie member</th>
                <th colSpan={2}>Vertical Post</th>
                <th colSpan={2}>Inclined member</th>
              </tr>
              <tr>
                <th></th>
                <th>Deg.</th>
                <th>m</th>
                <th>m</th>
                <th>Nos.</th>
                <th>C/S Lib</th>
                <th>Profile</th>
                <th>C/S Lib</th>
                <th>Profile</th>
                <th>C/S Lib</th>
                <th>Profile</th>
                <th>C/S Lib</th>
                <th>Profile</th>
              </tr>
            </thead>
            <tbody>{data.map((item) => getRow(item))}</tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
