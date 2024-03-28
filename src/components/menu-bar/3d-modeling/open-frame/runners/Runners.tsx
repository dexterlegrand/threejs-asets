import React, { useEffect, useState, useRef, useMemo } from "react";
import { GeneralCheckBoxCell } from "../../../../common/GeneralCheckBoxCell";
import { Button } from "@blueprintjs/core";
import {
  getElementByName,
  getNextId,
  getTopOffset,
  getCurrentUI,
  convertToNamesArray,
} from "../../../../3d-models/utils";
import { OFRunnerUI } from "../../../../../store/ui/types";
import { Project, Orientation } from "../../../../../store/main/types";
import {
  TRunnerOF,
  TOpenFrame,
  TColumnOF,
  TBeamOF,
} from "../../../../../store/main/openFrameTypes";
import { changeModel } from "../../../../../store/main/actions";
import { changeOFUIAction } from "../../../../../store/ui/actions";
import { Section } from "../../../../../store/data/types";
import { ApplicationState } from "../../../../../store";
import { useSelector, useDispatch } from "react-redux";
import { getOFModels } from "../../../../3d-models/openFrame";
import { SelectorCell } from "../../../../common/SelectorCell";
import { NumericCell } from "../../../../common/NumericCell";
import { CheckBoxCell } from "../../../../common/CheckBoxCell";
import { orientations } from "../../../../../store/main/constants";

type Props = {
  project?: Project;
  profiles: Section[];
  libs: string[];
};

export function Runners(props: Props) {
  const { project, profiles, libs } = props;

  const [offsetTop, setOffsetTop] = useState<number>(0);

  const openFrameUI = useSelector((state: ApplicationState) => getCurrentUI(state)?.openFrameUI);

  const dispatch = useDispatch();

  const tableRef = useRef<HTMLTableElement>(null);

  const models = useMemo(() => {
    return getOFModels(project);
  }, [project]);

  const data = useMemo(() => {
    return (openFrameUI?.runners ?? []).filter(
      (el) => !el.model || models.some((m) => m.name === el.model)
    );
  }, [openFrameUI, models]);

  useEffect(() => {
    setOffsetTop(getTopOffset(tableRef.current, 1));
  }, [data]);

  function handleChangeModel(model: TOpenFrame) {
    dispatch(changeModel(model));
  }

  function handleChangeData(runners: OFRunnerUI[]) {
    if (!openFrameUI) return;
    dispatch(changeOFUIAction({ ...openFrameUI, runners }));
  }

  function handleAddRow() {
    handleChangeData([
      ...data,
      { id: getNextId(data), selected: false, offset: 0, spacing: 0, numbers: 1 },
    ]);
  }

  function handleCreateElements(row: OFRunnerUI, model: TOpenFrame) {
    if (!row.model || !row.from || !row.to || !row.globalSide || !row.elementSide || !row.profile)
      return model;
    const id = getNextId(model.runners ?? []);
    const el: TRunnerOF = {
      id,
      uiId: row.id,
      from: row.from,
      to: row.to,
      numbers: row.numbers,
      offset: row.offset,
      spacing: row.spacing,
      profile: row.profile,
      elementSide: row.elementSide,
      globalSide: row.globalSide,
      orientation: row.orientation,
    };
    const changedModel: TOpenFrame = {
      ...model,
      runners: model.runners ? [...model.runners, el] : [el],
    };
    return changedModel;
  }

  function handleChangeRow(row: OFRunnerUI, field: string, value: any, isHard?: boolean) {
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
    if (!changedRow.model || !changedRow.from || !changedRow.to || !changedRow.profile) return;
    if (row.model !== changedRow.model) {
      model = getElementByName(models, changedRow.model);
    }
    if (!model) return;
    if (isHard) {
      const cp = handleDeleteModels([changedRow], project);
      // @ts-ignore
      model = cp?.models.find((m) => m.name === model?.name);
      model && handleChangeModel(handleCreateElements(changedRow, model));
    } else if (model.runners?.some((item) => item.uiId === changedRow.id)) {
      const changedModel: TOpenFrame = {
        ...model,
        runners:
          model.runners?.map((item) => {
            if (item.uiId === row.id) {
              return { ...item, profile: changedRow.profile! };
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

  function handleDeleteModels(elements: OFRunnerUI[], project?: Project) {
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
          runners: newModel.runners?.filter((item) => item.uiId !== id) ?? [],
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

  function getColumns(columns: TColumnOF[], column: TColumnOF | undefined, elevation: number) {
    if (!column) return [];
    const columnX = column.startPos.x;
    const columnZ = column.startPos.z;
    return columns.filter(
      (item) =>
        (item.startPos.x > columnX &&
          item.startPos.y <= elevation &&
          item.endPos.y >= elevation &&
          item.startPos.z === columnZ) ||
        (item.startPos.x < columnX &&
          item.startPos.y <= elevation &&
          item.endPos.y >= elevation &&
          item.startPos.z === columnZ) ||
        (item.startPos.x === columnX &&
          item.startPos.y <= elevation &&
          item.endPos.y >= elevation &&
          item.startPos.z > columnZ) ||
        (item.startPos.x === columnX &&
          item.startPos.y <= elevation &&
          item.endPos.y >= elevation &&
          item.startPos.z < columnZ)
    );
  }

  function getBeams(beams?: TBeamOF[], beam?: TBeamOF) {
    if (!beams || !beam) return [];
    const filtered = beams.filter((item) => {
      if (
        item.name === beam.name ||
        item.startPos.y !== beam.startPos.y ||
        item.direction !== beam.direction
      )
        return false;
      if (beam.direction.includes("X")) {
        return (
          (beam.startPos.x <= item.startPos.x && beam.endPos.x >= item.startPos.x) ||
          (beam.startPos.x >= item.startPos.x && beam.endPos.x <= item.startPos.x)
        );
      } else {
        return (
          (beam.startPos.z >= item.startPos.z && beam.endPos.z <= item.startPos.z) ||
          (beam.startPos.z <= item.startPos.z && beam.endPos.z >= item.startPos.z)
        );
      }
    });
    return filtered;
  }

  function getRow(row: OFRunnerUI) {
    const model = getElementByName(models, row.model);
    const beams = model?.beams ?? [];
    const beam = getElementByName(beams, row.from);
    const toBeams = getBeams(beams, beam);
    const columns = model?.columns ?? [];
    const column = getElementByName(columns, row.from);
    const toColumns = getColumns(columns, column, row.offset);
    const width = `${100 / 13}%`;
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
        <SelectorCell<"SIDE" | "ROOF">
          items={["SIDE", "ROOF"]}
          itemKey={(item) => item}
          itemLabel={(item) => item}
          selected={row.globalSide}
          onSelect={(value) => handleChangeRow(row, "globalSide", value, true)}
        />
        <SelectorCell<string>
          items={
            row.globalSide === "SIDE" ? convertToNamesArray(columns) : convertToNamesArray(beams)
          }
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
          style={{ width }}
        />
        <SelectorCell<string>
          items={
            row.globalSide === "SIDE"
              ? convertToNamesArray(toColumns)
              : convertToNamesArray(toBeams)
          }
          itemKey={(item) => item}
          itemLabel={(item) => item}
          selected={row.to}
          onSelect={(value) => handleChangeRow(row, "to", value, true)}
          filter={(query, item) => (query ? item.includes(query.toUpperCase()) : true)}
        />
        <SelectorCell<"TOP" | "BOTTOM">
          items={["TOP", "BOTTOM"]}
          itemKey={(item) => item}
          itemLabel={(item) => item}
          selected={row.elementSide}
          onSelect={(value) => handleChangeRow(row, "elementSide", value, true)}
        />
        <NumericCell
          min={0}
          isDecimal={true}
          value={row.spacing}
          onChange={(value) => handleChangeRow(row, "spacing", value, true)}
          style={{ width }}
        />
        <NumericCell
          min={0}
          isDecimal={true}
          value={row.numbers}
          onChange={(value) => handleChangeRow(row, "numbers", value, true)}
          style={{ width }}
        />
        <SelectorCell<string>
          items={libs}
          itemKey={(item) => item}
          itemLabel={(item) => item}
          selected={row.lib}
          onSelect={(value) => handleChangeRow(row, "lib", value)}
        />
        <SelectorCell<Section>
          items={profiles.filter((profile) => profile.country_code === row.lib)}
          selected={row.profile}
          onSelect={(value) => handleChangeRow(row, "profile", value, true)}
          itemKey={(item) => item.profile_section_id}
          itemLabel={(item) => item.designation}
          filter={(query, item) =>
            query ? item.designation.toLocaleLowerCase().includes(query.toLocaleLowerCase()) : true
          }
        />
        <SelectorCell<Orientation>
          items={orientations}
          itemKey={(item) => item}
          itemLabel={(item) => `${item}`}
          selected={row.orientation}
          onSelect={(val) => handleChangeRow(row, "orientation", val, true)}
        />
      </tr>
    );
  }

  return (
    <div className="d-flex f-column">
      <div className="hr" />
      <div className="label-light bg-dark">
        <span>Runners</span>
        <Button small icon="trash" text="Delete" intent="warning" onClick={handleDeleteRows} />
        <Button small icon="export" text="Export to CSV" intent="success" disabled={true} />
        <Button small icon="import" text="Import from CSV" intent="success" disabled={true} />
        <Button small icon="plus" text="Add Row" intent="primary" onClick={handleAddRow} />
      </div>
      <div className="hr" />
      <div className={"p-5"}>
        <div className={"table-container"}>
          <table ref={tableRef} className="table bg-gray">
            <thead>
              <tr>
                <GeneralCheckBoxCell rowSpan={2} data={data} onChange={handleChangeData} />
                <th rowSpan={2}>OF No.</th>
                <th rowSpan={2}>Side / Roof</th>
                <th colSpan={2}>From</th>
                <th>To</th>
                <th>Side</th>
                <th>Spacing</th>
                <th>Numbers</th>
                <th rowSpan={2}>C/S Library</th>
                <th rowSpan={2}>Profile</th>
                <th>Orientation</th>
              </tr>
              <tr>
                <th style={{ top: offsetTop }}>Name</th>
                <th style={{ top: offsetTop }}>Dist from start (m)</th>
                <th style={{ top: offsetTop }}>Name</th>
                <th style={{ top: offsetTop }}>Top / Bottom</th>
                <th style={{ top: offsetTop }}>m</th>
                <th style={{ top: offsetTop }}>Nos</th>
                <th style={{ top: offsetTop }}>Deg.</th>
              </tr>
            </thead>
            <tbody>{data.map((item) => getRow(item))}</tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
