import React, { FunctionComponent, useMemo, useRef, useState, useEffect } from "react";
import { Button } from "@blueprintjs/core";
import { CheckBoxCell } from "../../../../common/CheckBoxCell";
import { NumericCell } from "../../../../common/NumericCell";
import { TOpenFrame, TBeamElement } from "../../../../../store/main/openFrameTypes";
import { useSelector, useDispatch } from "react-redux";
import { ApplicationState } from "../../../../../store";
import { OFPlatformUI } from "../../../../../store/ui/types";
import { changeOFUIAction, addEventAction } from "../../../../../store/ui/actions";
import {
  getNextId,
  getElementByName,
  getIndexName,
  convertToNamesArray,
  exportToCSV,
  importFromCSV,
  getTopOffset,
  checkImportedNumber,
  fixNumberToStr,
  roundM,
  hardCheckRange,
  checkRange,
  getCurrentUI,
} from "../../../../3d-models/utils";
import { changeModel, changeProjectAction } from "../../../../../store/main/actions";
import { SelectorCell } from "../../../../common/SelectorCell";
import { GeneralCheckBoxCell } from "../../../../common/GeneralCheckBoxCell";
import { Project } from "../../../../../store/main/types";
import { Vector3 } from "three";

type Props = {
  models: TOpenFrame[];
};

const PlatformsFS: FunctionComponent<Props> = (props) => {
  const { models } = props;

  const [offsetTop, setOffsetTop] = useState<number>(0);

  const openFrameUI = useSelector((state: ApplicationState) => getCurrentUI(state)?.openFrameUI);

  const project = useSelector((state: ApplicationState) =>
    getElementByName(state.main.projects, state.main.currentProject)
  );

  const dispatch = useDispatch();

  const data = useMemo(() => {
    return openFrameUI?.platforms ?? [];
  }, [openFrameUI]);

  const tableRef = useRef<HTMLTableElement>(null);

  useEffect(() => {
    setOffsetTop(getTopOffset(tableRef.current, 1));
  }, []);

  function handleChangeUI(platforms: OFPlatformUI[]) {
    if (!openFrameUI) return;
    dispatch(changeOFUIAction({ ...openFrameUI, platforms }));
  }

  function handleChangeModel(item: OFPlatformUI) {
    const model = getElementByName(models, item.model);
    const arrEl = model ? [...model.beams, ...model.cantilevers] : [];
    const from = getElementByName(arrEl, item.from);
    const to = getElementByName(arrEl, item.to);
    if (!model) return;
    let changedModel: TOpenFrame = {
      ...model,
      platforms: model.platforms.filter((pl) => pl.id !== item.id),
    };
    if (from && to && item.width && item.thickness) {
      const changed = {
        id: item.id,
        name: item.name,
        from: from.name,
        to: to.name,
        width: item.width,
        thickness: item.thickness,
        distance: item.distanceFromLeft,
      };
      changedModel = { ...changedModel, platforms: [...changedModel.platforms, changed] };
    }
    dispatch(changeModel(changedModel));
  }

  function handleDeleteModels(platforms: OFPlatformUI[], project?: Project) {
    const map = new Map<string, number[]>();
    let changedProject = project ? { ...project } : undefined;
    platforms.forEach((platform) => {
      if (platform.model) {
        const ids = map.get(platform.model);
        if (ids) {
          map.set(platform.model, [...ids, platform.id]);
        } else {
          map.set(platform.model, [platform.id]);
        }
      }
    });
    map.forEach((ids, key) => {
      const model = getElementByName(models, key);
      if (model) {
        const newModel = {
          ...model,
          platforms: model.platforms.filter((item) => !ids.some((id) => id === item.id)),
        };
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

  function handleAdd() {
    handleChangeUI([
      ...data,
      {
        id: getNextId(data),
        name: `P`,
        selected: false,
        width: 0,
        thickness: 25,
        distanceFromLeft: 0,
      },
    ]);
  }

  function handleDelete() {
    handleDeleteModels(data.filter((item) => item.selected));
    handleChangeUI(data.filter((item) => !item.selected));
  }

  function handleChange(item: OFPlatformUI, field: string, value: any) {
    const changed =
      field === "distanceFromLeft"
        ? { ...item, width: 0, [field]: value }
        : { ...item, [field]: value };
    handleChangeUI(data.map((dataItem) => (dataItem.id === item.id ? changed : dataItem)));
    handleChangeModel(changed);
  }

  function handleChangeOF(item: OFPlatformUI, model?: string) {
    if (item.model) {
      handleDeleteModels([item]);
    }
    const name = `P${getIndexName(
      data.filter((dataItem) => dataItem.model === model),
      "P"
    )}`;
    const changed = { ...item, model, name };
    handleChangeUI(data.map((dataItem) => (dataItem.id === item.id ? changed : dataItem)));
    handleChangeModel(changed);
  }

  function getBeams(beams: TBeamElement[], beam?: TBeamElement) {
    if (!beam) return [];
    const sxb = roundM(beam.startPos.x);
    const exb = roundM(beam.endPos.x);
    const szb = roundM(beam.startPos.z);
    const ezb = roundM(beam.endPos.z);
    const filtered = beams.filter((item) => {
      const sxi = roundM(item.startPos.x);
      const exi = roundM(item.endPos.x);
      const szi = roundM(item.startPos.z);
      const ezi = roundM(item.endPos.z);
      if (
        item.name === beam.name ||
        item.startPos.y !== beam.startPos.y ||
        !((sxi === exi && sxb === exb) || (szi === ezi && szb === ezb))
      )
        return false;
      if (szb === ezb) {
        if (hardCheckRange(sxi, sxb, exb) && hardCheckRange(exi, sxb, exb)) {
          return true;
        } else if (hardCheckRange(sxb, sxi, exi) && hardCheckRange(exb, sxi, exi)) {
          return true;
        } else if (checkRange(sxi, sxb, exb, true, false) && !checkRange(exi, sxb, exb)) {
          return true;
        } else if (!checkRange(sxi, sxb, exb) && checkRange(exi, sxb, exb, false, true)) {
          return true;
        } else return false;
      } else {
        if (hardCheckRange(szi, szb, ezb) && hardCheckRange(ezi, szb, ezb)) {
          return true;
        } else if (hardCheckRange(szb, szi, ezi) && hardCheckRange(ezb, szi, ezi)) {
          return true;
        } else if (checkRange(szi, szb, ezb, true, false) && !checkRange(ezi, szb, ezb)) {
          return true;
        } else if (!checkRange(szi, szb, ezb) && checkRange(ezi, szb, ezb, false, true)) {
          return true;
        } else return false;
      }
    });
    return filtered;
  }

  function getLeftDistances(elements: TBeamElement[], from?: TBeamElement, to?: TBeamElement) {
    if (!from || !to) return [];
    const minV = new Vector3(
      Math.max(roundM(from.startPos.x), roundM(to.startPos.x)),
      from.startPos.y,
      Math.max(roundM(from.startPos.z), roundM(to.startPos.z))
    );
    const maxV = new Vector3(
      Math.min(roundM(from.endPos.x), roundM(to.endPos.x)),
      from.startPos.y,
      Math.min(roundM(from.endPos.z), roundM(to.endPos.z))
    );
    const isX = roundM(from.startPos.z) === roundM(from.endPos.z);
    const distances: number[] = [];
    for (const el of elements) {
      if (el.startPos.y !== minV.y) continue;
      if (isX) {
        const sz = roundM(el.startPos.z);
        const ez = roundM(el.endPos.z);
        if (sz === ez) continue;
        if (
          (hardCheckRange(sz, minV.z, maxV.z) && hardCheckRange(ez, minV.z, maxV.z)) ||
          (hardCheckRange(minV.z, sz, ez) && hardCheckRange(maxV.z, sz, ez))
        ) {
          const sx = roundM(el.startPos.x);
          if (!hardCheckRange(sx, minV.x, maxV.x)) continue;
          const x = Math.abs(roundM(sx - minV.x));
          if (!distances.includes(x)) distances.push(x);
        }
      } else {
        const sx = roundM(el.startPos.x);
        const ex = roundM(el.endPos.x);
        if (sx === ex) continue;
        if (
          (hardCheckRange(sx, minV.x, maxV.x) && hardCheckRange(ex, minV.x, maxV.x)) ||
          (hardCheckRange(minV.x, sx, ex) && hardCheckRange(maxV.x, sx, ex))
        ) {
          const sz = roundM(el.startPos.z);
          if (!hardCheckRange(sz, minV.z, maxV.z)) continue;
          const z = Math.abs(roundM(sz - minV.z));
          if (!distances.includes(z)) distances.push(z);
        }
      }
    }
    return distances.sort((a, b) => a - b);
  }

  function getWidths(distances: number[], leftDistance: number) {
    const width: number[] = [];
    for (const d of distances) {
      if (d < leftDistance) continue;
      width.push(d - leftDistance);
    }
    return width;
  }

  function getRow(item: OFPlatformUI) {
    const width = `${100 / 8}%`;
    const model = getElementByName(models, item.model);
    const beams = model ? [...model.beams, ...model.cantilevers] : [];
    const from = getElementByName(beams, item.from);
    const toBeams = getBeams(beams, from);
    const to = getElementByName(toBeams, item.to);
    const distances = getLeftDistances(beams, from, to);
    const widths = getWidths(distances, item.distanceFromLeft);
    return (
      <tr key={item.id}>
        <CheckBoxCell
          key={item.id}
          value={item.selected}
          onChange={(value) => handleChange(item, "selected", value)}
        />
        <SelectorCell<string>
          items={convertToNamesArray(models)}
          itemKey={(item) => item}
          itemLabel={(item) => item}
          selected={item.model}
          onSelect={(value) => handleChangeOF(item, value)}
          filterable={false}
        />
        <td>{item.name}</td>
        <SelectorCell<string>
          items={convertToNamesArray(beams)}
          itemKey={(item) => item}
          itemLabel={(item) => item}
          selected={item.from}
          onSelect={(value) => handleChange(item, "from", value)}
          filterable={true}
          filter={(query, item) => (query ? item.includes(query.toUpperCase()) : true)}
        />
        <SelectorCell<string>
          items={convertToNamesArray(toBeams)}
          itemKey={(item) => item}
          itemLabel={(item) => item}
          selected={item.to}
          onSelect={(value) => handleChange(item, "to", value)}
          filterable={true}
          filter={(query, item) => (query ? item.includes(query.toUpperCase()) : true)}
        />
        <SelectorCell<number>
          items={distances}
          itemKey={(item) => item}
          itemLabel={(item) => `${item}`}
          selected={item.distanceFromLeft}
          onSelect={(value) => handleChange(item, "distanceFromLeft", value)}
          filterable={false}
        />
        <SelectorCell<number>
          items={widths}
          itemKey={(item) => item}
          itemLabel={(item) => `${item}`}
          selected={item.width}
          onSelect={(value) => handleChange(item, "width", value)}
          filterable={false}
        />
        <NumericCell
          min={0}
          isDecimal={true}
          value={item.thickness}
          onChange={(value) => handleChange(item, "thickness", value)}
          style={{ width }}
        />
      </tr>
    );
  }

  function handleExport() {
    exportToCSV(
      data.map((item) => ({
        id: item.id,
        "FS No.": item.model ?? "",
        "Platform No.": item.name,
        "From Beam": item.from ?? "",
        "To Beam": item.to ?? "",
        "Dist. From Left. (m)": fixNumberToStr(item.distanceFromLeft),
        "Width (m)": fixNumberToStr(item.width),
        "Thickness (mm)": item.thickness,
      })),
      "Platforms FS"
    );
  }

  function showErrorMsg(msg: string) {
    dispatch(addEventAction(`Platforms (Import): ${msg}`, "danger"));
  }

  function handleImport() {
    if (!project) return;
    importFromCSV((imported, isCSV) => {
      if (!isCSV || !Array.isArray(imported)) return;
      let changedProject = handleDeleteModels(data, project);
      const newData: OFPlatformUI[] = [];
      for (const item of imported) {
        let newItem: OFPlatformUI = {
          id: getNextId(newData),
          selected: false,
          name: "P",
          width: 0,
          thickness: 25,
          distanceFromLeft: 0,
        };
        const itemModel = item["FS No."];
        const itemFrom = item["From Beam"];
        const itemTo = item["To Beam"];
        const itemWidth = item["Width (m)"];
        const itemThickness = item["Thickness (mm)"];
        const itemDFL = item["Dist. From Left. (m)"];
        let model: TOpenFrame | undefined;
        let from: TBeamElement | undefined;
        let to: TBeamElement | undefined;
        if (itemModel) {
          // @ts-ignore
          model = getElementByName(changedProject.models, itemModel);
          if (model) {
            const arrEl = [...model.beams, ...model.cantilevers];
            newItem = {
              ...newItem,
              model: model.name,
              name: `P${getIndexName(
                newData.filter((el) => el.model === model!.name),
                "P"
              )}`,
            };
            if (itemFrom) {
              from = getElementByName(arrEl, itemFrom);
              if (from) {
                newItem = { ...newItem, from: from.name };
              } else {
                showErrorMsg(`(id: ${item.id}) - an element "${itemFrom}" not found!`);
              }
            }
            if (itemTo) {
              to = getElementByName(arrEl, itemTo);
              if (to) {
                newItem = { ...newItem, to: to.name };
              } else {
                showErrorMsg(`(id: ${item.id}) - an element "${itemTo}" not found!`);
              }
            }
          } else {
            showErrorMsg(`(id: ${item.id}) - a model "${itemModel}" not found!`);
          }
        }
        newItem = {
          ...newItem,
          width: checkImportedNumber(itemWidth, false) ?? 0,
          thickness: checkImportedNumber(itemThickness, false) ?? 0,
          distanceFromLeft: checkImportedNumber(itemDFL, false) ?? 0,
        };
        newData.push(newItem);
        if (model && from && to && newItem.width && newItem.thickness) {
          const changed = {
            id: newItem.id,
            name: newItem.name,
            from: newItem.from,
            to: newItem.to,
            width: newItem.width,
            thickness: newItem.thickness,
            distance: newItem.distanceFromLeft,
          };
          // @ts-ignore
          changedProject = {
            ...changedProject,
            models: models.map((mItem) =>
              mItem.name === model!.name
                ? { ...model!, platforms: [...model!.platforms, changed] }
                : mItem
            ),
          };
        }
      }
      handleChangeUI(newData);
      // @ts-ignore
      dispatch(changeProjectAction(changedProject));
    });
  }

  return (
    <div className="d-flex f-column">
      <div className="hr" />
      <div className="label-light  bg-dark">
        <span>Platforms</span>
        <Button small icon="trash" text="Delete" intent="warning" onClick={handleDelete} />
        <Button small icon="export" text="Export to CSV" intent="success" onClick={handleExport} />
        <Button
          small
          icon="import"
          text="Import from CSV"
          intent="success"
          onClick={handleImport}
        />
        <Button small icon="plus" text="Add Row" intent="primary" onClick={handleAdd} />
      </div>
      <div className="hr" />
      <div className={"p-5"}>
        <div className={"table-container"}>
          <table ref={tableRef} className="table bg-gray">
            <thead>
              <tr>
                <GeneralCheckBoxCell rowSpan={2} data={data} onChange={handleChangeUI} />
                <th rowSpan={2}>FS No.</th>
                <th rowSpan={2}>Platform No.</th>
                <th colSpan={2}>Boundary</th>
                <th colSpan={3}>Platform details</th>
              </tr>
              <tr>
                <th style={{ top: offsetTop }}>From Beam</th>
                <th style={{ top: offsetTop }}>To Beam</th>
                <th style={{ top: offsetTop }}>Dist. From Left. (m)</th>
                <th style={{ top: offsetTop }}>Width (m)</th>
                <th style={{ top: offsetTop }}>Thickness (mm)</th>
              </tr>
            </thead>
            <tbody>{data.map((item) => getRow(item))}</tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default PlatformsFS;
