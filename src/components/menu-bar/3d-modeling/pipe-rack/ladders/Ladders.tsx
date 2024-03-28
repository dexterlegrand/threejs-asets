import React, { FunctionComponent, useEffect, useRef, useState } from "react";
import { Button } from "@blueprintjs/core";
import { useDispatch, useSelector } from "react-redux";
import { ApplicationState } from "../../../../../store";
import { Ladder, PipeRack, PipeRackPlatform, UserDirection } from "../../../../../store/main/types";
import { CheckBoxCell } from "../../../../common/CheckBoxCell";
import { NumericCell } from "../../../../common/NumericCell";
import { SelectorCell } from "../../../../common/SelectorCell";
import { changeLadderParams, changeModel } from "../../../../../store/main/actions";
import { userDirections } from "../../../../../store/main/constants";
import { getTopOffset } from "../../../../3d-models/utils";
import { Section } from "../../../../../store/data/types";

type Props = {
  models: PipeRack[];
  profiles: Section[];
  libs: string[];
};

type RowData = {
  id: number;
  selected: boolean;
  pr?: PipeRack;
  pl?: PipeRackPlatform;
  onFace?: UserDirection;
  distanceFromLeft: number;
  fromEL: number;
};

const Ladders: FunctionComponent<Props> = ({ models, profiles, libs }) => {
  const [init, setInit] = useState<boolean>(true);
  const [afterUpdate, setAfterUpdate] = useState<boolean>(true);
  const [rowIndex, setRowIndex] = useState<number>(0);
  const [rows, setRows] = useState<RowData[]>([]);

  const params = useSelector(
    (state: ApplicationState) =>
      state.main.projects.find((project) => project.name === state.main.currentProject)
        ?.ladderParams
  );

  const dispatch = useDispatch();

  useEffect(() => {
    const newRows: RowData[] = [];
    let lastId = 0;
    models.forEach((model) => {
      model.ladders.forEach((item) => {
        lastId = Math.max(lastId, item.id);
        newRows.push({
          id: item.id,
          selected: false,
          pr: model,
          pl: model.platforms.find((pl) => pl.name === item.platform),
          onFace: item.onFace,
          distanceFromLeft: item.distanceFromLeft,
          fromEL: item.fromEL,
        });
      });
    });
    setAfterUpdate(true);
    setRows(newRows.sort((a, b) => a.id - b.id));
    setRowIndex(++lastId);
  }, [models]);

  const [offsetTop, setOffsetTop] = useState<number>(0);

  useEffect(() => {
    setOffsetTop(getTopOffset(tableRef.current, 1));
    if (!init && !afterUpdate) {
      const vRows = rows.filter((row) => validRow(row));
      models.forEach((model) => {
        const newLadders: Ladder[] = vRows
          .filter((vr) => vr.pr?.name === model.name)
          .map(
            (vr) =>
              ({
                id: vr.id,
                name: `L${vr.id}`,
                parent: vr.pl!.name,
                type: "Ladder",
                platform: vr.pl!.name,
                onFace: vr.onFace!,
                distanceFromLeft: vr.distanceFromLeft,
                fromEL: vr.fromEL,
              } as Ladder)
          );
        if (!equal(model.ladders, newLadders))
          dispatch(changeModel({ ...model, ladders: newLadders } as PipeRack));
      });
    }
    init && setInit(false);
    afterUpdate && setAfterUpdate(false);
  }, [rows]);

  function validRow(row: RowData) {
    return row.pr && row.pl && row.onFace;
  }

  function equal(old: Ladder[], news: Ladder[]) {
    if (old.length !== news.length) return false;
    for (let i = 0; i < old.length; i++) {
      if (old[i].name !== news[i].name) return false;
      if (old[i].platform !== news[i].platform) return false;
      if (old[i].onFace !== news[i].onFace) return false;
      if (old[i].distanceFromLeft !== news[i].distanceFromLeft) return false;
      if (old[i].fromEL !== news[i].fromEL) return false;
    }
    return true;
  }

  function handleAddRow() {
    setRows([...rows, { id: rowIndex, selected: false, distanceFromLeft: 0, fromEL: 0 }]);
    setRowIndex(rowIndex + 1);
  }

  function handleDeleteRows() {
    setRows(rows.filter((row) => !row.selected));
  }

  function handleChangePR(row: RowData, pr?: PipeRack) {
    setRows(
      rows.map((item) =>
        item.id === row.id
          ? {
              ...row,
              pr,
              pl: undefined,
              distanceFromLeft: 0,
              fromEL: 0,
            }
          : item
      )
    );
  }

  function handleChangePlatform(row: RowData, pl?: PipeRackPlatform) {
    setRows(
      rows.map((item) =>
        item.id === row.id
          ? {
              ...row,
              pl,
              distanceFromLeft: 0,
              fromEL: 0,
            }
          : item
      )
    );
  }

  function handleChangeRow(row: RowData, field: string, value: any) {
    setRows(rows.map((item) => (item.id === row.id ? { ...row, [field]: value } : item)));
  }

  function getRow(item: RowData) {
    return (
      <tr key={item.id}>
        <CheckBoxCell
          key={item.id}
          value={item.selected}
          onChange={(value) => handleChangeRow(item, "selected", value)}
        />
        <SelectorCell<PipeRack>
          items={models}
          selected={item.pr}
          onSelect={(value) => handleChangePR(item, value)}
          itemKey={(item) => item.name}
          itemLabel={(item) => item.name}
          filterable={false}
        />
        <SelectorCell<PipeRackPlatform>
          items={item.pr ? item.pr.platforms : []}
          selected={item.pl}
          onSelect={(value) => handleChangePlatform(item, value)}
          itemKey={(item) => item.name}
          itemLabel={(item) => item.name}
          filterable={false}
        />
        <SelectorCell<UserDirection>
          items={userDirections}
          selected={item.onFace}
          onSelect={(value) => handleChangeRow(item, "onFace", value)}
          itemKey={(item) => item}
          itemLabel={(item) => item}
          filterable={false}
        />
        <NumericCell
          className="w-200"
          value={item.distanceFromLeft}
          isDecimal={true}
          onChange={(value) => handleChangeRow(item, "distanceFromLeft", value)}
        />
        <NumericCell
          className="w-200"
          value={item.fromEL}
          isDecimal={true}
          onChange={(value) => handleChangeRow(item, "fromEL", value)}
        />
      </tr>
    );
  }

  const tableRef = useRef<HTMLTableElement>(null);

  return (
    <div className="d-flex f-column">
      <div className="hr" />
      <div className="label-light bg-dark">
        <span>Ladders</span>
        <Button small icon="export" text="Export to CSV" intent="success" disabled={true} />
        <Button small icon="import" text="Import from CSV" intent="success" disabled={true} />
      </div>
      <div className="hr" />
      <div className="p-5">
        <div className="table-container">
          <table ref={tableRef} className="table bg-gray">
            <thead>
              <tr>
                <th colSpan={3}>Stringer</th>
                <th colSpan={2}>Rung</th>
                <th colSpan={4}>Cage Hor. Bars</th>
                <th colSpan={3}>Cage Vert. Bars</th>
                <th rowSpan={2}>Cage Head room (m)</th>
              </tr>
              <tr>
                <th style={{ top: offsetTop }}>C/S Library</th>
                <th style={{ top: offsetTop }}>Profile</th>
                <th style={{ top: offsetTop }}>Spacing (mm)</th>
                <th style={{ top: offsetTop }}>Dia (mm)</th>
                <th style={{ top: offsetTop }}>Spacing (mm)</th>
                <th style={{ top: offsetTop }}>Width (mm)</th>
                <th style={{ top: offsetTop }}>Thickness (mm)</th>
                <th style={{ top: offsetTop }}>Spacing (mm)</th>
                <th style={{ top: offsetTop }}>Dia (mm)</th>
                <th style={{ top: offsetTop }}>Width (mm)</th>
                <th style={{ top: offsetTop }}>Thickness (mm)</th>
                <th style={{ top: offsetTop }}>Nos</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <SelectorCell<string>
                  items={libs}
                  selected={params?.lib}
                  onSelect={(lib) => params && dispatch(changeLadderParams({ ...params, lib }))}
                  itemKey={(item) => item}
                  itemLabel={(item) => item}
                  filterable={false}
                  className="w-170"
                />
                <SelectorCell<Section>
                  items={profiles.filter((profile) => profile.country_code === params?.lib)}
                  selected={params?.profile}
                  onSelect={(profile) =>
                    params && dispatch(changeLadderParams({ ...params, profile }))
                  }
                  itemKey={(item) => item.profile_section_id}
                  itemLabel={(item) => item.designation}
                  filterable={true}
                  filter={(query, item) =>
                    query
                      ? item.designation.toLocaleLowerCase().includes(query.toLocaleLowerCase())
                      : true
                  }
                  className="w-170"
                />
                <NumericCell
                  className="w-60"
                  value={params?.spacing}
                  onChange={(spacing) =>
                    params && dispatch(changeLadderParams({ ...params, spacing }))
                  }
                />
                <NumericCell
                  className="w-50"
                  value={params?.rungDia}
                  onChange={(rungDia) =>
                    params && dispatch(changeLadderParams({ ...params, rungDia }))
                  }
                />
                <NumericCell
                  className="w-60"
                  value={params?.rungSpacing}
                  onChange={(rungSpacing) =>
                    params && dispatch(changeLadderParams({ ...params, rungSpacing }))
                  }
                />
                <NumericCell
                  className="w-50"
                  value={params?.CHBw}
                  onChange={(CHBw) => params && dispatch(changeLadderParams({ ...params, CHBw }))}
                />
                <NumericCell
                  className="w-70"
                  value={params?.CHBt}
                  onChange={(CHBt) => params && dispatch(changeLadderParams({ ...params, CHBt }))}
                />
                <NumericCell
                  className="w-60"
                  value={params?.CHBs}
                  onChange={(CHBs) => params && dispatch(changeLadderParams({ ...params, CHBs }))}
                />
                <NumericCell
                  className="w-50"
                  value={params?.CHBd}
                  onChange={(CHBd) => params && dispatch(changeLadderParams({ ...params, CHBd }))}
                />
                <NumericCell
                  className="w-60"
                  value={params?.CVBw}
                  onChange={(CVBw) => params && dispatch(changeLadderParams({ ...params, CVBw }))}
                />
                <NumericCell
                  className="w-70"
                  value={params?.CVBt}
                  onChange={(CVBt) => params && dispatch(changeLadderParams({ ...params, CVBt }))}
                />
                <NumericCell
                  className="w-50"
                  value={params?.CVBnos}
                  onChange={(CVBnos) =>
                    params && dispatch(changeLadderParams({ ...params, CVBnos }))
                  }
                />
                <NumericCell
                  className="w-50"
                  value={params?.CHR}
                  isDecimal={true}
                  onChange={(CHR) => params && dispatch(changeLadderParams({ ...params, CHR }))}
                />
              </tr>
            </tbody>
          </table>
        </div>
      </div>
      <div className="hr" />
      <div className="label-light bg-dark">
        <Button
          small
          icon="trash"
          text="Delete"
          intent="warning"
          onClick={() => handleDeleteRows()}
        />
        <Button small icon="plus" text="Add Row" intent="primary" onClick={() => handleAddRow()} />
      </div>
      <div className="hr" />
      <div className="p-5">
        <div className="table-container">
          <table className="table bg-gray">
            <thead>
              <tr>
                <th></th>
                <th>PR No.</th>
                <th>PF No.</th>
                <th>On Face</th>
                <th>Distance from Left (m)</th>
                <th>From EL. (mm)</th>
              </tr>
            </thead>
            <tbody>{rows.map((row) => getRow(row))}</tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Ladders;
