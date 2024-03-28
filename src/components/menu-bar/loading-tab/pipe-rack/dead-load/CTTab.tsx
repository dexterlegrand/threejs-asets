import React, { FunctionComponent, useEffect, useState } from "react";
import { Button } from "@blueprintjs/core";
import { Accessory, DL_CTree, PipeRack } from "../../../../../store/main/types";
import { useDispatch } from "react-redux";
import { CheckBoxCell } from "../../../../common/CheckBoxCell";
import { SelectorCell } from "../../../../common/SelectorCell";
import { NumericCell } from "../../../../common/NumericCell";
import { changeModel } from "../../../../../store/main/actions";

type Props = {
  models: PipeRack[];
};

type RowData = {
  selected: boolean;
  pr?: string;
  group?: string;
} & DL_CTree;

const CTTab: FunctionComponent<Props> = ({ models }) => {
  const [init, setInit] = useState<boolean>(true);
  const [afterUpdate, setAfterUpdate] = useState<boolean>(true);
  const [rowIndex, setRowIndex] = useState<number>(0);
  const [rows, setRows] = useState<RowData[]>([]);

  const [display, setDisplay] = useState<boolean>(true);

  const dispatch = useDispatch();

  useEffect(() => {
    const newRows: RowData[] = [];
    let lastId = 0;
    models.forEach((model) => {
      model.accessories.forEach((item) => {
        if (item.type === "Christmas Tree" && item.deadLoad) {
          lastId = Math.max(lastId, item.deadLoad.id);
          newRows.push({
            ...item.deadLoad,
            selected: false,
            pr: model.name,
            group: item.name,
          } as RowData);
        }
      });
    });
    setAfterUpdate(true);
    setRows(
      [
        ...newRows,
        ...rows
          .filter((row) => !row.pr || !row.group)
          .map(
            (row) =>
              ({
                ...row,
                id: ++lastId,
              } as RowData)
          ),
      ].sort((a, b) => a.id - b.id)
    );
    setRowIndex(++lastId);
  }, [models]);

  useEffect(() => {
    if (!init && !afterUpdate) {
      models.forEach((model) => {
        let news: Accessory[] = model.accessories.map((item) =>
          item.type === "Christmas Tree"
            ? {
                ...item,
                deadLoad: undefined,
              }
            : item
        );
        rows
          .filter((row) => row.pr === model.name && row.group)
          .forEach((row) => {
            news = news.map((item) =>
              item.name === row.group
                ? {
                    ...item,
                    deadLoad: {
                      id: row.id,
                      intensity: row.intensity,
                      intensityL1: row.intensityL1,
                      intensityL2: row.intensityL2,
                      intensityL3: row.intensityL3,
                      intensityL4: row.intensityL4,
                    },
                  }
                : item
            );
          });
        if (!equal(model.accessories, news)) {
          dispatch(
            changeModel({
              ...model,
              accessories: news,
            } as PipeRack)
          );
        }
      });
    }
    init && setInit(false);
    afterUpdate && setAfterUpdate(false);
  }, [rows]);

  function equal(old: Accessory[], news: Accessory[]) {
    for (let i = 0; i < old.length; ++i) {
      if (old[i].deadLoad?.intensity !== news[i].deadLoad?.intensity)
        return false;
      // @ts-ignore
      if (old[i].deadLoad?.intensityL1 !== news[i].deadLoad?.intensityL1)
        return false;
      // @ts-ignore
      if (old[i].deadLoad?.intensityL2 !== news[i].deadLoad?.intensityL2)
        return false;
      // @ts-ignore
      if (old[i].deadLoad?.intensityL3 !== news[i].deadLoad?.intensityL3)
        return false;
      // @ts-ignore
      if (old[i].deadLoad?.intensityL4 !== news[i].deadLoad?.intensityL4)
        return false;
    }
    return true;
  }

  function handleAddRow() {
    setRows([
      ...rows,
      {
        id: rowIndex,
        selected: false,
        intensity: 0,
        intensityL1: 0,
        intensityL2: 0,
        intensityL3: 0,
        intensityL4: 0,
      },
    ]);
    setRowIndex(rowIndex + 1);
  }

  function handleDeleteRows() {
    setRows(rows.filter((row) => !row.selected));
  }

  function handleChangeRow(item: RowData, field: string, value: any) {
    setRows(
      rows.map((row) => {
        if (row.id === item.id) {
          return { ...item, [field]: value };
        } else {
          return row;
        }
      })
    );
  }

  function getRow(item: RowData) {
    return (
      <tr key={item.id}>
        <CheckBoxCell
          value={item.selected}
          onChange={(value) => handleChangeRow(item, "selected", value)}
        />
        <SelectorCell<string>
          items={models.map((model) => model.name)}
          selected={item.pr}
          itemKey={(item) => item}
          itemLabel={(item) => item}
          onSelect={(value) => handleChangeRow(item, "pr", value)}
          filterable={false}
        />
        <SelectorCell<string>
          items={getCTGroups(models, item.pr)}
          selected={item.group}
          itemKey={(item) => item}
          itemLabel={(item) => item}
          onSelect={(value) => handleChangeRow(item, "group", value)}
          filterable={false}
        />
        <NumericCell
          value={item.intensityL1}
          className={"w-70"}
          onChange={(value) => handleChangeRow(item, "intensityL1", value)}
        />
        <NumericCell
          value={item.intensityL2}
          className={"w-70"}
          onChange={(value) => handleChangeRow(item, "intensityL2", value)}
        />
        <NumericCell
          value={item.intensityL3}
          className={"w-70"}
          onChange={(value) => handleChangeRow(item, "intensityL3", value)}
        />
        <NumericCell
          value={item.intensityL4}
          className={"w-70"}
          onChange={(value) => handleChangeRow(item, "intensityL4", value)}
        />
        <NumericCell
          value={item.intensity}
          className={"w-70"}
          onChange={(value) => handleChangeRow(item, "intensity", value)}
        />
      </tr>
    );
  }

  function getCTGroups(models: PipeRack[], pr?: string) {
    let groups: string[] = [];
    models
      .find((model) => model.name === pr)
      ?.accessories.forEach((ag) => {
        if (ag.type === "Christmas Tree") groups = [...groups, ag.name];
      });
    return groups;
  }

  return (
    <div className="d-flex f-grow f-column">
      <div className="hr" />
      <div className="label-light bg-dark">
        <Button
          small
          minimal
          icon={display ? "caret-down" : "caret-right"}
          onClick={() => setDisplay(!display)}
        />
        <span>Christmas Tree</span>
        <Button
          small
          icon="trash"
          text="Delete"
          intent="warning"
          onClick={handleDeleteRows}
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
          onClick={handleAddRow}
        />
      </div>
      {display && (
        <>
          <div className="hr" />
          <div className={"small-table-container bg-dark p-5"}>
            <table className="table bg-gray">
              <thead>
                <tr>
                  <th rowSpan={2}></th>
                  <th rowSpan={2}>PR No.</th>
                  <th rowSpan={2}>CTS Group No.</th>
                  <th colSpan={5}>
                    Load intensity (<sup>kg</sup>/<sub>m</sub>)
                  </th>
                </tr>
                <tr>
                  <th>L1</th>
                  <th>L2</th>
                  <th>L3</th>
                  <th>L4</th>
                  <th>Top</th>
                </tr>
              </thead>
              <tbody>{rows.map((item) => getRow(item))}</tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
};

export default CTTab;
