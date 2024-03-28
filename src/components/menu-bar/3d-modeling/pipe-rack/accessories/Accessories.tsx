import React, { FunctionComponent, useState, useEffect } from "react";
import { Button } from "@blueprintjs/core";
import { CheckBoxCell } from "../../../../common/CheckBoxCell";
import { NumericCell } from "../../../../common/NumericCell";
import { SelectorCell } from "../../../../common/SelectorCell";
import {
  PipeRack,
  PipeRackPortal,
  Side,
  AccessoryType,
  Orientation,
  Accessory,
  Model,
  Element,
  TPostAccessory,
  FPostAccessory,
  ChristmasTreeAccessory,
} from "../../../../../store/main/types";
import { useDispatch } from "react-redux";
import {
  fixVectorByOrientation,
  getIndexName,
  exportToCSV,
  importFromCSV,
  getElementByName,
} from "../../../../3d-models/utils";
import { accessoryTypes, orientations } from "../../../../../store/main/constants";
import { changeModel } from "../../../../../store/main/actions";
import { Vector3 } from "three";
import { addEventAction } from "../../../../../store/ui/actions";
import {
  splitBeamsByAccessories,
  concatBeams,
} from "../../../../3d-models/pipe-rack/pipeRackUtils";

type OwnProps = { models: PipeRack[] };

type Props = OwnProps;

type RowData = {
  selected: boolean;
  name: string;
  pr?: PipeRack;
  portal?: PipeRackPortal;
  distanceFromStart?: number;
  tier?: number;
  side: Side | "Both";
  type: AccessoryType;
  orientation: Orientation;
  spacing: number;
  count: number;
  elements: (TPostAccessory | FPostAccessory | ChristmasTreeAccessory)[];
};

const sides: (Side | "Both")[] = ["L", "R", "Both"];

const Accessories: FunctionComponent<Props> = (props) => {
  const { models } = props;
  const [init, setInit] = useState<boolean>(true);
  const [rows, setRows] = useState<RowData[]>([]);

  const dispatch = useDispatch();

  useEffect(() => {
    if (!rows.length) {
      const newRows: RowData[] = [];
      models.forEach((model) =>
        model.accessories.forEach((ac) => {
          newRows.push({
            selected: false,
            name: ac.name,
            pr: model,
            portal: model.portals.find((p) => p.name === ac.parent),
            tier: ac.tier,
            side: ac.side,
            type: ac.type,
            orientation: ac.orientation,
            distanceFromStart: ac.distanceFromStart,
            spacing: ac.spacing,
            count: ac.count,
            elements: ac.elements,
          });
        })
      );
      setRows(newRows);
    }
  }, [models]);

  useEffect(() => {
    if (!init) {
      const vRows = rows.filter((row) => validRow(row));
      models.forEach((model) => {
        const accessories = vRows
          .filter((row) => row.pr?.name === model.name)
          .map(
            (row) =>
              ({
                name: row.name,
                parent: row.portal!.name,
                tier: row.tier,
                side: row.side,
                type: row.type,
                orientation: row.orientation,
                distanceFromStart: row.distanceFromStart,
                spacing: row.spacing,
                count: row.count,
                elements:
                  row.count && row.elements.length === row.count
                    ? row.elements
                    : createAccessoryElements(row),
              } as Accessory)
          );
        if (!equalAccessoryGroup(model.accessories, accessories)) {
          dispatch(
            changeModel({
              ...model,
              beams: splitBeamsByAccessories(
                concatBeams(model.beams, "AG"),
                accessories,
                model.portals
              ),
              accessories,
            } as Model)
          );
        }
      });
    } else setInit(false);
  }, [rows]);

  function createAccessoryElements(row: RowData) {
    const elements: Element[] = [];
    let func: (row: RowData, side: Side, index: number, elements: Element[]) => any;
    if (row.type === "T-Post") func = createTPost;
    if (row.type === "F-Post") func = createFPost;
    if (row.type === "Christmas Tree") func = createCT;
    for (let i = 0; i < row.count; i++) {
      if (row.side === "Both") {
        elements.push(func!(row, "L", i, elements));
        elements.push(func!(row, "R", i, elements));
      } else elements.push(func!(row, row.side, i, elements));
    }
    return elements;
  }

  function createTPost(row: RowData, side: Side, index: number, elements: Element[]) {
    const x = row.portal!.chainage + (row.distanceFromStart ?? 0) + index * row.spacing;
    const y = row.portal!.tiers[row.tier!];
    const z = row.portal!.width / (side === "L" ? -2 : 2);

    const name = `${row.name}-TP${getIndexName(elements, `${row.name}-TP`)}`;

    const totalH = row.portal!.tiers[0] ?? 0;

    const leftProjection = 0.5;
    const rightProjection = 0.5;

    const colCSLibrary = row.pr!.CSLibrary;
    const colProfile = row.pr!.portalColProfile;

    const beamCSLibrary = row.pr!.CSLibrary;
    const beamProfile = row.pr!.portalBeamProfile;

    const colItems = [];
    const beamItems = [];

    if (totalH) {
      colItems.push({
        parent: name,
        parentGroup: row.name,
        type: "AccessoryColumn",
        name: `${name}-C1`,
        startPos: new Vector3(x, y, z),
        endPos: new Vector3(x, y + totalH, z),
        orientation: 0,
        profile: colProfile,
      });
      leftProjection &&
        beamItems.push({
          position: "L",
          parent: name,
          parentGroup: row.name,
          type: "AccessoryBeam",
          name: `${name}-B${beamItems.length + 1}`,
          startPos: new Vector3(x, y + totalH, z),
          endPos: fixVectorByOrientation(
            new Vector3(x, y + totalH, z),
            new Vector3(x, y + totalH, z - leftProjection),
            row.orientation
          ),
          orientation: 0,
          profile: beamProfile,
        });
      rightProjection &&
        beamItems.push({
          position: "R",
          parent: name,
          parentGroup: row.name,
          type: "AccessoryBeam",
          name: `${name}-B${beamItems.length + 1}`,
          startPos: new Vector3(x, y + totalH, z),
          endPos: fixVectorByOrientation(
            new Vector3(x, y + totalH, z),
            new Vector3(x, y + totalH, z + rightProjection),
            row.orientation
          ),
          orientation: 0,
          profile: beamProfile,
        });
    }

    return {
      id: index,
      name,
      parent: row.portal!.name,
      group: row.name,
      index,
      side,
      totalH,

      leftProjection,
      rightProjection,

      colOrientation: 0,
      colCSLibrary,
      colProfile,

      colItems,

      beamOrientation: 0,
      beamCSLibrary,
      beamProfile,

      beamItems,
    } as TPostAccessory;
  }

  function createFPost(row: RowData, side: Side, index: number, elements: Element[]) {
    const x = row.portal!.chainage + (row.distanceFromStart ?? 0) + index * row.spacing;
    const y = row.portal!.tiers[row.tier!];
    const z = row.portal!.width / (side === "L" ? -2 : 2);

    const name = `${row.name}-FP${getIndexName(elements, `${row.name}-FP`)}`;

    const totalH = row.portal!.tiers[0] ?? 0;
    const h1 = totalH / 2;

    const projection = 0.5;

    const colCSLibrary = row.pr!.CSLibrary;
    const colProfile = row.pr!.portalColProfile;

    const beamCSLibrary = row.pr!.CSLibrary;
    const beamProfile = row.pr!.portalBeamProfile;

    const points: number[] = [0];
    const colItems = [];
    const beamItems = [];

    if (projection && totalH) {
      points.push(totalH);
      beamItems.push({
        position: "R",
        parent: name,
        parentGroup: row.name,
        type: "AccessoryBeam",
        name: `${name}-B${beamItems.length + 1}`,
        startPos: new Vector3(x, y + totalH, z),
        endPos: fixVectorByOrientation(
          new Vector3(x, y + totalH, z),
          new Vector3(x, y + totalH, z + projection),
          row.orientation
        ),
        orientation: 0,
        profile: beamProfile,
      });
      if (h1) {
        points.push(h1);
        beamItems.push({
          position: "R",
          parent: name,
          parentGroup: row.name,
          type: "AccessoryBeam",
          name: `${name}-B${beamItems.length + 1}`,
          startPos: new Vector3(x, y + h1, z),
          endPos: fixVectorByOrientation(
            new Vector3(x, y + h1, z),
            new Vector3(x, y + h1, z + projection),
            row.orientation
          ),
          orientation: 0,
          profile: beamProfile,
        });
      }
      points.sort();
      for (let i = 1; i < points.length; i++) {
        colItems.push({
          parent: name,
          parentGroup: row.name,
          type: "AccessoryColumn",
          name: `${name}-C${i}`,
          startPos: new Vector3(x, y + points[i - 1], z),
          endPos: new Vector3(x, y + points[i], z),
          orientation: 0,
          profile: colProfile,
        });
      }
    }

    return {
      id: index,
      name,
      parent: row.portal!.name,
      group: row.name,
      index,
      side,
      totalH,
      h1,
      projection,

      colOrientation: 0,
      colCSLibrary,
      colProfile,

      colItems,

      beamOrientation: 0,
      beamCSLibrary,
      beamProfile,

      beamItems,
    } as FPostAccessory;
  }

  function createCT(row: RowData, side: Side, index: number, elements: Element[]) {
    const x = row.portal!.chainage + (row.distanceFromStart ?? 0) + index * row.spacing;
    const y = row.portal!.tiers[row.tier!];
    const z = row.portal!.width / (side === "L" ? -2 : 2);

    const name = `${row.name}-CT${getIndexName(elements, `${row.name}-CT`)}`;

    const totalH = row.portal!.tiers[0] ?? 0;
    const h1 = totalH / 2;

    const leftProjection = 0.5;
    const rightProjection = 0.5;

    const colCSLibrary = row.pr!.CSLibrary;
    const colProfile = row.pr!.portalColProfile;

    const beamCSLibrary = row.pr!.CSLibrary;
    const beamProfile = row.pr!.portalBeamProfile;

    const points: number[] = [0];
    const colItems = [];
    const beamItems = [];

    if (totalH) {
      points.push(totalH);
      leftProjection &&
        beamItems.push({
          position: "L",
          parent: name,
          parentGroup: row.name,
          type: "AccessoryBeam",
          name: `${name}-B${beamItems.length + 1}`,
          startPos: new Vector3(x, y + totalH, z),
          endPos: fixVectorByOrientation(
            new Vector3(x, y + totalH, z),
            new Vector3(x, y + totalH, z - leftProjection),
            row.orientation
          ),
          orientation: 0,
          profile: beamProfile,
        });
      rightProjection &&
        beamItems.push({
          position: "R",
          parent: name,
          parentGroup: row.name,
          type: "AccessoryBeam",
          name: `${name}-B${beamItems.length + 1}`,
          startPos: new Vector3(x, y + totalH, z),
          endPos: fixVectorByOrientation(
            new Vector3(x, y + totalH, z),
            new Vector3(x, y + totalH, z + rightProjection),
            row.orientation
          ),
          orientation: 0,
          profile: beamProfile,
        });
      if (h1) {
        points.push(h1);
        leftProjection &&
          beamItems.push({
            position: "L",
            parent: name,
            parentGroup: row.name,
            type: "AccessoryBeam",
            name: `${name}-B${beamItems.length + 1}`,
            startPos: new Vector3(x, y + h1, z),
            endPos: fixVectorByOrientation(
              new Vector3(x, y + h1, z),
              new Vector3(x, y + h1, z - leftProjection),
              row.orientation
            ),
            orientation: 0,
            profile: beamProfile,
          });
        rightProjection &&
          beamItems.push({
            position: "R",
            parent: name,
            parentGroup: row.name,
            type: "AccessoryBeam",
            name: `${name}-B${beamItems.length + 1}`,
            startPos: new Vector3(x, y + h1, z),
            endPos: fixVectorByOrientation(
              new Vector3(x, y + h1, z),
              new Vector3(x, y + h1, z + rightProjection),
              row.orientation
            ),
            orientation: 0,
            profile: beamProfile,
          });
      }
      points.sort();
      for (let i = 1; i < points.length; i++) {
        colItems.push({
          parent: name,
          parentGroup: row.name,
          type: "AccessoryColumn",
          name: `${name}-C${i}`,
          startPos: new Vector3(x, y + points[i - 1], z),
          endPos: new Vector3(x, y + points[i], z),
          orientation: 0,
          profile: colProfile,
        });
      }
    }

    return {
      id: index,
      name,
      parent: row.portal!.name,
      group: row.name,
      index,
      side,
      totalH,
      h1,

      leftProjection,
      rightProjection,

      colOrientation: 0,
      colCSLibrary,
      colProfile,

      colItems,

      beamOrientation: 0,
      beamCSLibrary,
      beamProfile,

      beamItems,
    } as ChristmasTreeAccessory;
  }

  function validRow(row: RowData) {
    return (
      row.pr &&
      row.portal &&
      row.tier !== undefined &&
      row.count &&
      (row.count > 1 ? row.spacing : true)
    );
  }

  function equalAccessoryGroup(items: Accessory[], newItems: Accessory[]) {
    if (items.length !== newItems.length) return false;
    for (let i = 0; i < items.length; i++) {
      if (items[i].parent !== newItems[i].parent) return false;
      if (items[i].tier !== newItems[i].tier) return false;
      if (items[i].side !== newItems[i].side) return false;
      if (items[i].type !== newItems[i].type) return false;
      if (items[i].distanceFromStart !== newItems[i].distanceFromStart) return false;
      if (items[i].orientation !== newItems[i].orientation) return false;
      if (items[i].spacing !== newItems[i].spacing) return false;
      if (items[i].count !== newItems[i].count) return false;
    }
    return true;
  }

  function handleAddRow() {
    setRows([
      ...rows,
      {
        selected: false,
        name: `AG${getIndexName(rows, "AG")}`,
        side: "L",
        type: "T-Post",
        orientation: 0,
        spacing: 0,
        count: 0,
        elements: [],
      },
    ]);
  }

  function handleDeleteRows() {
    setRows(rows.filter((row) => !row.selected));
  }

  function handleChangePR(row: RowData, pr?: PipeRack) {
    setRows(
      rows.map((item) =>
        item.name === row.name
          ? {
              ...row,
              name: pr
                ? `${pr.name}-AG${getIndexName(rows, `${pr.name}-AG`)}`
                : `AG${getIndexName(rows, "AG")}`,
              pr,
              portal: undefined,
              tier: undefined,
            }
          : item
      )
    );
  }

  function handleChangePortal(row: RowData, portal?: PipeRackPortal) {
    setRows(
      rows.map((item) => (item.name === row.name ? { ...row, portal, tier: undefined } : item))
    );
  }

  function handleChangeRow(row: RowData, field: string, value: any) {
    setRows(rows.map((item) => (item.name === row.name ? { ...row, [field]: value } : item)));
  }

  function getRow(row: RowData, index: number, arr: RowData[]) {
    return (
      <tr key={row.name}>
        <CheckBoxCell
          key={row.name}
          value={row.selected}
          onChange={(value) => handleChangeRow(row, "selected", value)}
        />
        <td>{row.name}</td>
        <SelectorCell<PipeRack>
          items={models}
          selected={row.pr}
          onSelect={(value) => handleChangePR(row, value)}
          itemKey={(item) => item.name}
          itemLabel={(item) => item.name}
          filterable={false}
        />
        <SelectorCell<PipeRackPortal>
          items={row.pr?.portals ?? []}
          selected={row.portal}
          onSelect={(value) => handleChangePortal(row, value)}
          itemKey={(item) => item.name}
          itemLabel={(item) => item.name}
          filterable={false}
        />
        <NumericCell
          isDecimal={true}
          value={row.distanceFromStart}
          onChange={(value) => handleChangeRow(row, "distanceFromStart", value)}
        />
        <SelectorCell<number>
          items={getTiers(row.portal)}
          selected={row.tier}
          onSelect={(value) => handleChangeRow(row, "tier", value)}
          itemKey={(item) => item}
          itemLabel={(item) => `${item + 1}`}
          filterable={false}
        />
        <SelectorCell<Side | "Both">
          items={sides}
          selected={row.side}
          onSelect={(value) => handleChangeRow(row, "side", value)}
          itemKey={(item) => item}
          itemLabel={(item) => item}
          filterable={false}
        />
        <SelectorCell<AccessoryType>
          items={accessoryTypes}
          selected={row.type}
          onSelect={(value) => handleChangeRow(row, "type", value)}
          itemKey={(item) => item}
          itemLabel={(item) => item}
          filterable={false}
        />
        <SelectorCell<Orientation>
          items={orientations}
          selected={row.orientation}
          onSelect={(value) => handleChangeRow(row, "orientation", value)}
          itemKey={(item) => item}
          itemLabel={(item) => `${item}`}
          filterable={false}
        />
        <NumericCell
          className="w-170"
          isDecimal={true}
          value={row.spacing}
          onChange={(value) => handleChangeRow(row, "spacing", value)}
        />
        <NumericCell
          className="w-50"
          max={row.spacing ? getMaxCount(row) : 1}
          value={row.count}
          onChange={(value) => handleChangeRow(row, "count", value)}
        />
      </tr>
    );
  }

  function getMaxCount(row: RowData) {
    if (!row.pr || !row.portal) return 0;
    if (row.portal.position === "end") return 1;
    let length = 0;
    for (
      let i = row.pr.portals.indexOf(row.portal), len = row.pr.portals.length - 1;
      i < len;
      i++
    ) {
      length += row.pr.portals[i].length;
    }
    return Math.floor((length - (row.distanceFromStart ?? 0)) / row.spacing) + 1;
  }

  function getTiers(portal?: PipeRackPortal) {
    if (!portal) return [];
    const tiers: number[] = [];
    for (let tier = 0; tier < portal.tiers.length; tier++) tiers.push(tier);
    return tiers;
  }

  function handleExport() {
    const exportData = rows.map((row: RowData) => {
      const exportRow = {
        name: row.name,
        pr: row.pr?.name,
        portal: row.portal?.name,
        distanceFromStart: row.distanceFromStart,
        tier: row.tier,
        side: row.side,
        type: row.type,
        orientation: row.orientation,
        spacing: row.spacing,
        count: row.count,
      };
      return exportRow;
    });
    exportToCSV(exportData, "Accessories");
  }

  function handleImport(models: PipeRack[]) {
    importFromCSV((arr) => {
      let newRows: RowData[] = [];
      try {
        arr.forEach((item) => {
          const model = getElementByName(models, item.pr);
          const newRow: RowData = {
            selected: false,
            name: item.name,
            pr: model,
            portal: getElementByName(model?.portals ?? [], item.portal),
            distanceFromStart: item.distanceFromStart,
            tier: item.tier,
            side: item.side,
            type: item.type,
            orientation: item.orientation,
            spacing: item.spacing,
            count: item.count,
            elements: [],
          };
          newRows = [...newRows, newRow];
        });
      } catch (e) {
        dispatch(addEventAction(`Accessories (Import): Parse error`, "danger"));
      }
      setRows(newRows);
    });
  }

  return (
    <div className="d-flex f-column">
      <div className="hr" />
      <div className="label-light bg-dark">
        <span>Accessories</span>
        <Button small icon="trash" text="Delete" intent="warning" onClick={handleDeleteRows} />
        <Button small icon="export" text="Export to CSV" intent="success" onClick={handleExport} />
        <Button
          small
          icon="import"
          text="Import from CSV"
          intent="success"
          onClick={() => handleImport(models)}
        />
        <Button small icon="plus" text="Add Row" intent="primary" onClick={handleAddRow} />
      </div>
      <div className="hr" />
      <div className={"p-5"}>
        <div className="table-container">
          <table className="table bg-gray">
            <thead>
              <tr>
                <th></th>
                <th>Accessory Group No.</th>
                <th>PR No.</th>
                <th>Start from Portal No.</th>
                <th>Distance from start</th>
                <th>Tier No.</th>
                <th>Side</th>
                <th>Accessory Type</th>
                <th>Orientation (Deg)</th>
                <th>Accessory Spacing (m)</th>
                <th>Nos.</th>
              </tr>
            </thead>
            <tbody>{rows.map(getRow)}</tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Accessories;
