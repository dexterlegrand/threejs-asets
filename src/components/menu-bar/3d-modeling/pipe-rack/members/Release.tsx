import React, { FunctionComponent, useEffect, useState } from "react";
import { Button } from "@blueprintjs/core";
import { CheckBoxCell } from "../../../../common/CheckBoxCell";
import {
  PipeRack,
  Element,
  PipeRackBeam,
  PipeRackHBracing,
  Releases,
  PipeRackColumn,
  PipeRackCantilever,
  PipeRackVBracing,
} from "../../../../../store/main/types";
import { useDispatch } from "react-redux";
import { changeModel } from "../../../../../store/main/actions";
import { SelectorCell } from "../../../../common/SelectorCell";
import { Paginator } from "../../../../common/Paginator";

type Props = {
  models: PipeRack[];
};

type RowData = {
  id: number;
  selected: boolean;
  pr?: PipeRack;
  element?: Element;
  releases: Releases;
};

const Release: FunctionComponent<Props> = ({ models }) => {
  const [init, setInit] = useState<boolean>(true);
  const [afterUpdate, setAfterUpdate] = useState<boolean>(true);
  const [rowIndex, setRowIndex] = useState<number>(0);
  const [rows, setRows] = useState<RowData[]>([]);

  const dispatch = useDispatch();

  useEffect(() => {
    let newRows: RowData[] = [];
    let rowIndex = 0;
    models.forEach((model) => {
      newRows = [
        ...newRows,
        ...[
          ...model.columns,
          ...model.beams,
          ...model.cantilevers,
          ...model.hBracings,
          ...model.vBracings,
        ]
          .filter((item) => item.releases)
          .map(
            (item) =>
              ({
                id: rowIndex++,
                selected: false,
                pr: model,
                element: item,
                releases: item.releases,
              } as RowData)
          ),
      ];
    });
    setAfterUpdate(true);
    setRows(newRows);
    setRowIndex(rowIndex);
  }, []);

  useEffect(() => {
    if (!init && !afterUpdate) {
      const vRows = rows.filter((row) => validRow(row));
      models.forEach((model) => {
        const vRowsByModel = vRows.filter((vr) => vr.pr?.name === model.name);

        let newColumns: PipeRackColumn[] = model.columns.map((item) => ({
          ...item,
          releases: undefined,
        }));
        let newBeams: PipeRackBeam[] = model.beams.map((item) => ({
          ...item,
          releases: undefined,
        }));
        let newCantilevers: PipeRackCantilever[] = model.cantilevers.map(
          (item) => ({ ...item, releases: undefined })
        );
        let newHBracings: PipeRackHBracing[] = model.hBracings.map((item) => ({
          ...item,
          releases: undefined,
        }));
        let newVBracings: PipeRackVBracing[] = model.vBracings.map((item) => ({
          ...item,
          releases: undefined,
        }));

        vRowsByModel.forEach((vr) => {
          switch (vr.element?.type) {
            case "PipeRackColumn":
              newColumns = newColumns.map((item) =>
                item.name === vr.element?.name
                  ? { ...item, releases: vr.releases }
                  : item
              );
              break;
            case "PipeRackBeam":
              newBeams = newBeams.map((item) =>
                item.name === vr.element?.name
                  ? { ...item, releases: vr.releases }
                  : item
              );
              break;
            case "PipeRackCantilever":
              newCantilevers = newCantilevers.map((item) =>
                item.name === vr.element?.name
                  ? { ...item, releases: vr.releases }
                  : item
              );
              break;
            case "PipeRackHBracing":
              newHBracings = newHBracings.map((item) =>
                item.name === vr.element?.name
                  ? { ...item, releases: vr.releases }
                  : item
              );
              break;
            case "PipeRackVBracing":
              newVBracings = newVBracings.map((item) =>
                item.name === vr.element?.name
                  ? { ...item, releases: vr.releases }
                  : item
              );
              break;
          }
        });

        if (
          !equal(
            [
              ...model.columns,
              ...model.beams,
              ...model.cantilevers,
              ...model.hBracings,
              ...model.vBracings,
            ],
            [
              ...newColumns,
              ...newBeams,
              ...newCantilevers,
              ...newHBracings,
              ...newVBracings,
            ]
          )
        )
          dispatch(
            changeModel({
              ...model,
              columns: newColumns,
              beams: newBeams,
              cantilevers: newCantilevers,
              hBracings: newHBracings,
              vBracings: newVBracings,
            } as PipeRack)
          );
      });
    }
    init && setInit(false);
    afterUpdate && setAfterUpdate(false);
  }, [rows]);

  function validRow(row: RowData) {
    return row.pr && row.element;
  }

  function equal(old: Element[], news: Element[]) {
    for (let i = 0; i < old.length; i++) {
      if (
        (old[i].releases === undefined && news[i].releases !== undefined) ||
        (old[i].releases !== undefined && news[i].releases === undefined)
      )
        return false;
      if (old[i].releases?.fx1 !== news[i].releases?.fx1) return false;
      if (old[i].releases?.fy1 !== news[i].releases?.fy1) return false;
      if (old[i].releases?.fz1 !== news[i].releases?.fz1) return false;
      if (old[i].releases?.fx2 !== news[i].releases?.fx2) return false;
      if (old[i].releases?.fy2 !== news[i].releases?.fy2) return false;
      if (old[i].releases?.fz2 !== news[i].releases?.fz2) return false;

      if (old[i].releases?.mx1 !== news[i].releases?.mx1) return false;
      if (old[i].releases?.my1 !== news[i].releases?.my1) return false;
      if (old[i].releases?.mz1 !== news[i].releases?.mz1) return false;
      if (old[i].releases?.mx2 !== news[i].releases?.mx2) return false;
      if (old[i].releases?.my2 !== news[i].releases?.my2) return false;
      if (old[i].releases?.mz2 !== news[i].releases?.mz2) return false;
    }
    return true;
  }

  function initReleases() {
    return {
      fx1: false,
      fy1: false,
      fz1: false,
      mx1: false,
      my1: false,
      mz1: false,
      fx2: false,
      fy2: false,
      fz2: false,
      mx2: false,
      my2: false,
      mz2: false,
    };
  }

  function handleAddRow() {
    setRows([
      ...rows,
      {
        id: rowIndex,
        selected: false,
        releases: { ...initReleases() },
      },
    ]);
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
              element: undefined,
              releases: { ...initReleases() },
            }
          : item
      )
    );
  }

  function handleChangeElement(row: RowData, element?: Element) {
    setRows(
      rows.map((item) =>
        item.id === row.id
          ? {
              ...row,
              element,
              releases: { ...initReleases() },
            }
          : item
      )
    );
  }

  function handleChangeReleases(row: RowData, field: string, value: boolean) {
    setRows(
      rows.map((item) =>
        item.id === row.id
          ? {
              ...row,
              releases: { ...row.releases, [field]: value },
            }
          : item
      )
    );
  }

  function handleChangeRow(row: RowData, field: string, value: any) {
    setRows(
      rows.map((item) =>
        item.id === row.id ? { ...row, [field]: value } : item
      )
    );
  }

  function getElements(row: RowData): Element[] {
    if (!row.pr) return [];
    return [
      ...row.pr.columns,
      ...row.pr.beams,
      ...row.pr.cantilevers,
      ...row.pr.hBracings,
      ...row.pr.vBracings,
    ];
  }

  function getRow(row: RowData) {
    return (
      <tr key={row.id}>
        <CheckBoxCell
          key={row.id}
          value={row.selected}
          onChange={(value) => handleChangeRow(row, "selected", value)}
        />
        <SelectorCell<PipeRack>
          items={models}
          selected={row.pr}
          onSelect={(value) => handleChangePR(row, value)}
          itemKey={(item) => item.name}
          itemLabel={(item) => item.name}
          filterable={false}
        />
        <SelectorCell<Element>
          items={getElements(row)}
          selected={row.element}
          onSelect={(value) => handleChangeElement(row, value)}
          itemKey={(item) => item.name}
          itemLabel={(item) => item.name}
          filterable={true}
          filter={(query, item) => item.name.includes(query.toUpperCase())}
        />
        <CheckBoxCell
          key={"fx1"}
          value={row.releases.fx1}
          onChange={(value) => handleChangeReleases(row, "fx1", value)}
        />
        <CheckBoxCell
          key={"fy1"}
          value={row.releases.fy1}
          onChange={(value) => handleChangeReleases(row, "fy1", value)}
        />
        <CheckBoxCell
          key={"fz1"}
          value={row.releases.fz1}
          onChange={(value) => handleChangeReleases(row, "fz1", value)}
        />
        <CheckBoxCell
          key={"mx1"}
          value={row.releases.mx1}
          onChange={(value) => handleChangeReleases(row, "mx1", value)}
        />
        <CheckBoxCell
          key={"my1"}
          value={row.releases.my1}
          onChange={(value) => handleChangeReleases(row, "my1", value)}
        />
        <CheckBoxCell
          key={"mz1"}
          value={row.releases.mz1}
          onChange={(value) => handleChangeReleases(row, "mz1", value)}
        />
        <CheckBoxCell
          key={"fx2"}
          value={row.releases.fx2}
          onChange={(value) => handleChangeReleases(row, "fx2", value)}
        />
        <CheckBoxCell
          key={"fy2"}
          value={row.releases.fy2}
          onChange={(value) => handleChangeReleases(row, "fy2", value)}
        />
        <CheckBoxCell
          key={"fz2"}
          value={row.releases.fz2}
          onChange={(value) => handleChangeReleases(row, "fz2", value)}
        />
        <CheckBoxCell
          key={"mx2"}
          value={row.releases.mx2}
          onChange={(value) => handleChangeReleases(row, "mx2", value)}
        />
        <CheckBoxCell
          key={"my2"}
          value={row.releases.my2}
          onChange={(value) => handleChangeReleases(row, "my2", value)}
        />
        <CheckBoxCell
          key={"mz2"}
          value={row.releases.mz2}
          onChange={(value) => handleChangeReleases(row, "mz2", value)}
        />
      </tr>
    );
  }

  const [selectedRows, setSelectedRows] = useState<RowData[]>([]);

  return (
    <div className="d-flex f-column">
      <div className="hr" />
      <div className="label-light bg-dark">
        <span>Release</span>
        <Button
          small
          icon="trash"
          text="Delete"
          intent="warning"
          onClick={() => handleDeleteRows()}
        />
        <Button
          small
          icon="export"
          text="Export to CSV"
          intent="success"
          disabled={true}
        />
        <Button
          small
          icon="import"
          text="Import from CSV"
          intent="success"
          disabled={true}
        />
        <Button
          small
          icon="plus"
          text="Add Row"
          intent="primary"
          onClick={() => handleAddRow()}
        />
      </div>
      <div className="hr" />
      <div className="p-5">
        <div className="table-container">
          <table className="table bg-gray">
            <thead>
              <tr>
                <th></th>
                <th>PR No.</th>
                <th>Name</th>
                <th>Fx1</th>
                <th>Fy1</th>
                <th>Fz1</th>
                <th>Mx1</th>
                <th>My1</th>
                <th>Mz1</th>
                <th>Fx2</th>
                <th>Fy2</th>
                <th>Fz2</th>
                <th>Mx2</th>
                <th>My2</th>
                <th>Mz2</th>
              </tr>
            </thead>
            <tbody>{selectedRows.map((row) => getRow(row))}</tbody>
          </table>
        </div>
      </div>
      <div className="hr" />
      <Paginator items={rows} onChange={setSelectedRows} />
    </div>
  );
};

export default Release;
