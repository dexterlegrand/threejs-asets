import React, { FunctionComponent, useState, useEffect, useRef } from "react";
import { Button } from "@blueprintjs/core";
import { useDispatch } from "react-redux";
import { PipeRack, TPostAccessory, Orientation, Accessory } from "../../../../../store/main/types";
import { NumericCell } from "../../../../common/NumericCell";
import { CheckBoxCell } from "../../../../common/CheckBoxCell";
import { SelectorCell } from "../../../../common/SelectorCell";
import { orientations } from "../../../../../store/main/constants";
import { changeModel } from "../../../../../store/main/actions";
import { getTopOffset, exportToCSV, importFromCSV } from "../../../../3d-models/utils";
import { addEventAction } from "../../../../../store/ui/actions";
import { Section } from "../../../../../store/data/types";
import {
  createAccessoryColumns,
  createAccessoryBeams,
} from "../../../../3d-models/pipe-rack/pipeRackUtils";

type Props = { models: PipeRack[]; profiles: Section[]; libs: string[] };

type RowData = {
  selected: boolean;
} & TPostAccessory;

const TPost: FunctionComponent<Props> = (props) => {
  const { models, profiles, libs } = props;
  const [init, setInit] = useState<boolean>(true);
  const [rows, setRows] = useState<RowData[]>([]);

  const dispatch = useDispatch();

  useEffect(() => {
    const newRows: RowData[] = [];
    models.forEach((model) =>
      model.accessories.forEach((ac) => {
        if (ac.type === "T-Post") {
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
          if (ac.type === "T-Post") {
            const elements = rows
              .filter((row) => row.group === ac.name && row.totalH)
              .map(
                (row) =>
                  ({
                    ...row,
                    colItems: createAccessoryColumns(model, ac, row),
                    beamItems: createAccessoryBeams(model, ac, row),
                  } as TPostAccessory)
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
        const el1 = accessories[i].elements[j] as TPostAccessory;
        const el2 = newAccessories[i].elements[j] as TPostAccessory;
        if (
          el1.totalH !== el2.totalH ||
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
          className="w-100"
          isDecimal={true}
          value={data.totalH}
          onChange={(value) => handleChangeRow(data, "totalH", value)}
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
    exportToCSV(exportData, "T-Post");
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
        dispatch(addEventAction(`T-Post (Import): Parse error`, "danger"));
      }
      setRows(newRows);
    });
  }

  return (
    <div className="d-flex f-column">
      <div className="hr" />
      <div className="label-light bg-dark">
        <span>T-post</span>
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
                <th rowSpan={2}>T-Post Group No.</th>
                <th rowSpan={2}>Total Height (m)</th>
                <th colSpan={3}>Column</th>
                <th colSpan={3}>Beam</th>
                <th colSpan={2}>Projection</th>
              </tr>
              <tr>
                <th style={{ top: offsetTop }}>C/S Library</th>
                <th style={{ top: offsetTop }}>Profile</th>
                <th style={{ top: offsetTop }}>Orientation (Deg)</th>
                <th style={{ top: offsetTop }}>C/S Library</th>
                <th style={{ top: offsetTop }}>Profile</th>
                <th style={{ top: offsetTop }}>Orientation (Deg)</th>
                <th style={{ top: offsetTop }}>Left (m)</th>
                <th style={{ top: offsetTop }}>Right (m)</th>
              </tr>
            </thead>
            <tbody>{rows.map(getRow)}</tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default TPost;
