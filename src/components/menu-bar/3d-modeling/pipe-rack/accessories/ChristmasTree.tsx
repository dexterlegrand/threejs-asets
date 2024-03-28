import React, { FunctionComponent, useState, useEffect, useRef } from "react";
import { Button } from "@blueprintjs/core";
import {
  PipeRack,
  ChristmasTreeAccessory,
  Accessory,
  Orientation,
} from "../../../../../store/main/types";
import { useDispatch } from "react-redux";
import { NumericCell } from "../../../../common/NumericCell";
import { CheckBoxCell } from "../../../../common/CheckBoxCell";
import { SelectorCell } from "../../../../common/SelectorCell";
import { changeModel } from "../../../../../store/main/actions";
import { orientations } from "../../../../../store/main/constants";
import { getTopOffset, importFromCSV, exportToCSV } from "../../../../3d-models/utils";
import { addEventAction } from "../../../../../store/ui/actions";
import { Section } from "../../../../../store/data/types";
import {
  createAccessoryColumns,
  createAccessoryBeams,
} from "../../../../3d-models/pipe-rack/pipeRackUtils";

type Props = { models: PipeRack[]; profiles: Section[]; libs: string[] };

type RowData = {
  selected: boolean;
} & ChristmasTreeAccessory;

const ChristmasTree: FunctionComponent<Props> = (props) => {
  const { models, profiles, libs } = props;
  const [init, setInit] = useState<boolean>(true);
  const [rows, setRows] = useState<RowData[]>([]);

  const dispatch = useDispatch();

  useEffect(() => {
    const newRows: RowData[] = [];
    models.forEach((model) =>
      model.accessories.forEach((ac) => {
        if (ac.type === "Christmas Tree") {
          ac.elements.forEach((el: any) => newRows.push({ selected: false, ...el }));
        }
      })
    );
    setRows(newRows);
  }, []);

  const [offsetTop, setOffsetTop] = useState<number>(0);

  useEffect(() => {
    setOffsetTop(getTopOffset(tableRef.current, 1));
    if (!init) {
      models.forEach((model) => {
        const accessories: Accessory[] = [];
        model.accessories.forEach((ac) => {
          if (ac.type === "Christmas Tree") {
            const elements = rows
              .filter((row) => row.group === ac.name && row.totalH)
              .map(
                (row) =>
                  ({
                    ...row,
                    colItems: createAccessoryColumns(model, ac, row),
                    beamItems: createAccessoryBeams(model, ac, row),
                  } as ChristmasTreeAccessory)
              );
            accessories.push({ ...ac, count: elements.length, elements });
          } else accessories.push(ac);
        });
        !equalAccessoryElements(model.accessories, accessories) &&
          dispatch(changeModel({ ...model, accessories } as PipeRack));
      });
    } else setInit(false);
  }, [rows]);

  function equalAccessoryElements(accessories: Accessory[], newAccessories: Accessory[]) {
    for (let i = 0; i < accessories.length; i++) {
      if (accessories[i].elements.length !== newAccessories[i].elements.length) return false;
      for (let j = 0; j < accessories[i].elements.length; j++) {
        const el1 = accessories[i].elements[j] as ChristmasTreeAccessory;
        const el2 = newAccessories[i].elements[j] as ChristmasTreeAccessory;
        if (
          el1.totalH !== el2.totalH ||
          el1.h1 !== el2.h1 ||
          el1.h2 !== el2.h2 ||
          el1.h3 !== el2.h3 ||
          el1.h4 !== el2.h4 ||
          el1.colCSLibrary !== el2.colCSLibrary ||
          el1.colProfile !== el2.colProfile ||
          el1.colOrientation !== el2.colOrientation ||
          el1.beamCSLibrary !== el2.beamCSLibrary ||
          el1.beamProfile !== el2.beamProfile ||
          el1.beamOrientation !== el2.beamOrientation ||
          el1.leftProjection !== el2.leftProjection ||
          el1.rightProjection !== el2.rightProjection
        )
          return false;
      }
    }
    return true;
  }

  function handleDeleteRows() {
    setRows(rows.filter((item) => !item.selected));
  }

  function handleChangeRow(row: RowData, field: string, value: any) {
    setRows(rows.map((item) => (item.name === row.name ? { ...row, [field]: value } : item)));
  }

  function getRow(data: RowData, i: number, arr: RowData[]) {
    return (
      <tr key={data.name}>
        <CheckBoxCell
          key={data.name}
          value={data.selected}
          onChange={(value) => handleChangeRow(data, "selected", value)}
        />
        <td>{data.name}</td>
        <NumericCell
          className="w-60"
          isDecimal={true}
          value={data.totalH}
          onChange={(value) => handleChangeRow(data, "totalH", value)}
        />
        <NumericCell
          className="w-50"
          isDecimal={true}
          value={data.h1}
          onChange={(value) => handleChangeRow(data, "h1", value)}
        />
        <NumericCell
          className="w-50"
          isDecimal={true}
          value={data.h2}
          onChange={(value) => handleChangeRow(data, "h2", value)}
        />
        <NumericCell
          className="w-50"
          isDecimal={true}
          value={data.h3}
          onChange={(value) => handleChangeRow(data, "h3", value)}
        />
        <NumericCell
          className="w-50"
          isDecimal={true}
          value={data.h4}
          onChange={(value) => handleChangeRow(data, "h4", value)}
        />
        <SelectorCell<string>
          items={libs}
          selected={data.colCSLibrary}
          onSelect={(value) => handleChangeRow(data, "colCSLibrary", value)}
          itemKey={(item) => item}
          itemLabel={(item) => item}
          filterable={false}
        />
        <SelectorCell<Section>
          items={profiles.filter((profile) => profile.country_code === data.colCSLibrary)}
          selected={data.colProfile}
          onSelect={(value) => handleChangeRow(data, "colProfile", value)}
          itemKey={(item) => item.profile_section_id}
          itemLabel={(item) => item.designation}
          filterable={true}
          filter={(query, item) =>
            query ? item.designation.toLocaleLowerCase().includes(query.toLocaleLowerCase()) : true
          }
        />
        <SelectorCell<Orientation>
          items={orientations}
          selected={data.colOrientation}
          onSelect={(value) => handleChangeRow(data, "colOrientation", value)}
          itemKey={(item) => item}
          itemLabel={(item) => `${item}`}
          filterable={false}
        />
        <SelectorCell<string>
          items={libs}
          selected={data.beamCSLibrary}
          onSelect={(value) => handleChangeRow(data, "beamCSLibrary", value)}
          itemKey={(item) => item}
          itemLabel={(item) => item}
          filterable={false}
        />
        <SelectorCell<Section>
          items={profiles.filter((profile) => profile.country_code === data.beamCSLibrary)}
          selected={data.beamProfile}
          onSelect={(value) => handleChangeRow(data, "beamProfile", value)}
          itemKey={(item) => item.profile_section_id}
          itemLabel={(item) => item.designation}
          filterable={true}
          filter={(query, item) =>
            query ? item.designation.toLocaleLowerCase().includes(query.toLocaleLowerCase()) : true
          }
        />
        <SelectorCell<Orientation>
          items={orientations}
          selected={data.beamOrientation}
          onSelect={(value) => handleChangeRow(data, "beamOrientation", value)}
          itemKey={(item) => item}
          itemLabel={(item) => `${item}`}
          filterable={false}
        />
        <NumericCell
          className="w-70"
          isDecimal={true}
          value={data.leftProjection}
          onChange={(value) => handleChangeRow(data, "leftProjection", value)}
        />
        <NumericCell
          className="w-80"
          isDecimal={true}
          value={data.rightProjection}
          onChange={(value) => handleChangeRow(data, "rightProjection", value)}
        />
      </tr>
    );
  }

  const tableRef = useRef<HTMLTableElement>(null);

  function handleExport() {
    const exportData = rows.map((row: RowData) => {
      const exportRow = {
        id: row.id,
        name: row.name,
        parent: row.parent,
        type: row.type,
        index: row.index,
        group: row.group,
        side: row.side,
        totalH: row.totalH,
        h1: row.h1,
        h2: row.h2,
        h3: row.h3,
        h4: row.h4,
        colOrientation: row.colOrientation,
        colCSLibrary: row.colCSLibrary,
        colProfile: row.colProfile?.designation,
        beamOrientation: row.beamOrientation,
        beamCSLibrary: row.beamCSLibrary,
        beamProfile: row.beamProfile?.designation,
        leftProjection: row.leftProjection,
        rightProjection: row.rightProjection,
      };
      return exportRow;
    });
    exportToCSV(exportData, "Christmas Tree");
  }

  function handleImport(profiles: Section[]) {
    importFromCSV((arr) => {
      let newRows: RowData[] = [];
      try {
        arr.forEach((item) => {
          const newRow: RowData = {
            id: item.id,
            name: item.name,
            parent: item.parent,
            type: item.type,
            colItems: [],
            beamItems: [],
            selected: false,
            index: item.index,
            group: item.group,
            side: item.side,
            totalH: item.totalH,
            h1: item.h1,
            h2: item.h2,
            h3: item.h3,
            h4: item.h4,
            colOrientation: item.colOrientation,
            colCSLibrary: item.colCSLibrary,
            colProfile: profiles.find((profile) => profile.designation === `${item.colProfile}`)!,
            beamOrientation: item.beamOrientation,
            beamCSLibrary: item.beamCSLibrary,
            beamProfile: profiles.find((profile) => profile.designation === `${item.beamProfile}`)!,
            leftProjection: item.leftProjection,
            rightProjection: item.rightProjection,
          };
          newRows = [...newRows, newRow];
        });
      } catch (e) {
        dispatch(addEventAction(`Christmas Tree (Import): Parse error`, "danger"));
      }
      setRows(newRows);
    });
  }

  return (
    <div className="d-flex f-column">
      <div className="hr" />
      <div className="label-light bg-dark">
        <span>Christmas Tree</span>
        <Button small icon="trash" text="Delete" intent="warning" onClick={handleDeleteRows} />
        <Button small icon="export" text="Export to CSV" intent="success" onClick={handleExport} />
        <Button
          small
          icon="import"
          text="Import from CSV"
          intent="success"
          onClick={() => handleImport(profiles)}
        />
      </div>
      <div className="hr" />
      <div className="p-5">
        <div className="table-container">
          <table ref={tableRef} className="table bg-gray">
            <thead>
              <tr>
                <th rowSpan={2}></th>
                <th rowSpan={2}>CT Group No.</th>
                <th colSpan={5}>Height from Base of Christmas Tree (m)</th>
                <th colSpan={3}>Column</th>
                <th colSpan={5}>Beam</th>
              </tr>
              <tr>
                <th style={{ top: offsetTop }}>Total</th>
                <th style={{ top: offsetTop }}>L1</th>
                <th style={{ top: offsetTop }}>L2</th>
                <th style={{ top: offsetTop }}>L3</th>
                <th style={{ top: offsetTop }}>L4</th>
                <th style={{ top: offsetTop }}>C/S Library</th>
                <th style={{ top: offsetTop }}>Profile</th>
                <th style={{ top: offsetTop }}>Orientation (Deg)</th>
                <th style={{ top: offsetTop }}>C/S Library</th>
                <th style={{ top: offsetTop }}>Profile</th>
                <th style={{ top: offsetTop }}>Orientation (Deg)</th>
                <th style={{ top: offsetTop }}>Projection left (m)</th>
                <th style={{ top: offsetTop }}>Projection right (m)</th>
              </tr>
            </thead>
            <tbody>{rows.map(getRow)}</tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ChristmasTree;
