import React, { useState, useRef, useEffect, useMemo } from "react";
import { Button } from "@blueprintjs/core";
import { getTopOffset, getCurrentPSS, getNextId } from "../../../../3d-models/utils";
import { useDispatch, useSelector } from "react-redux";
import { ApplicationState } from "../../../../../store";
import {
  createPSSConveyor,
  changePSSConveyor,
  changePSSAction,
  switchPSSAnimationAction,
} from "../../../../../store/pss/actions";
import { initialConveyor } from "../../../../../store/pss/initialState";
import { TPSSConveyor } from "../../../../../store/pss/types";
import { CheckBoxCell } from "../../../../common/CheckBoxCell";
import { NumericCell } from "../../../../common/NumericCell";
import { SelectorCell } from "../../../../common/SelectorCell";
import { Direction2 } from "../../../../../store/main/types";
import { directions2 } from "../../../../../store/main/constants";

type Props = {};

export function Conveyor(props: Props) {
  const [selected, setSelected] = useState<number[]>([]);
  const [offsetTop, setOffsetTop] = useState<number>(0);

  const tableRef = useRef<HTMLTableElement>(null);

  const pss = useSelector((state: ApplicationState) => getCurrentPSS(state));
  const pssAnimation = useSelector((state: ApplicationState) => state.pss.animate);

  const dispatch = useDispatch();

  const data = useMemo(() => {
    return pss?.conveyors ?? [];
  }, [pss]);

  useEffect(() => {
    setOffsetTop(getTopOffset(tableRef.current, 1));
  }, [data]);

  function handleAdd() {
    if (!pss) return;
    dispatch(createPSSConveyor(pss.project, { ...initialConveyor, id: getNextId(data) }));
  }

  function handleChange(item: TPSSConveyor, field: string, value: any) {
    if (!pss) return;
    dispatch(changePSSConveyor(pss.project, { ...item, [field]: value }));
  }

  function handleDelete() {
    if (!pss) return;
    dispatch(
      changePSSAction(
        pss.project,
        "conveyors",
        data.filter((d) => !selected.includes(d.id))
      )
    );
    setSelected([]);
  }

  function handleSelect(item: TPSSConveyor) {
    if (selected.includes(item.id)) {
      setSelected(selected.filter((s) => s !== item.id));
    } else {
      setSelected([...selected, item.id]);
    }
  }

  function handleStart() {
    dispatch(switchPSSAnimationAction(!pssAnimation));
  }

  function getRow(item: TPSSConveyor) {
    return (
      <tr key={item.id}>
        <CheckBoxCell
          key={item.id}
          value={selected.includes(item.id)}
          onChange={() => handleSelect(item)}
        />
        <td>{item.id}</td>
        <NumericCell
          isDecimal={true}
          value={item.x}
          onChange={(val) => handleChange(item, "x", val)}
          className={"w-50"}
        />
        <NumericCell
          isDecimal={true}
          value={item.y}
          onChange={(val) => handleChange(item, "y", val)}
          className={"w-50"}
        />
        <NumericCell
          isDecimal={true}
          value={item.z}
          onChange={(val) => handleChange(item, "z", val)}
          className={"w-50"}
        />
        <SelectorCell<Direction2>
          items={directions2}
          itemKey={(val) => val}
          itemLabel={(val) => val}
          selected={item.direction}
          onSelect={(val) => handleChange(item, "direction", val)}
        />
        <NumericCell
          isDecimal={true}
          value={item.length}
          onChange={(val) => handleChange(item, "length", val)}
          className={"w-100"}
        />
        <NumericCell
          isDecimal={true}
          value={item.height}
          onChange={(val) => handleChange(item, "height", val)}
          className={"w-100"}
        />
        <NumericCell
          isDecimal={true}
          value={item.speed}
          onChange={(val) => handleChange(item, "speed", val)}
          className={"w-100"}
        />
      </tr>
    );
  }

  return (
    <div className="d-flex f-column">
      <div className="hr" />
      <div className="label-light bg-dark">
        <Button
          small
          icon="trash"
          text="Delete"
          intent="warning"
          disabled={!selected.length}
          onClick={handleDelete}
        />
        <Button small icon="plus" text="Add Row" intent="primary" onClick={handleAdd} />
        <Button
          small
          text={`${pssAnimation ? "Stop" : "Start"} animations`}
          intent={"danger"}
          onClick={handleStart}
        />
      </div>
      <div className="hr" />
      <div className={"p-5"}>
        <div className={"table-container"}>
          <table ref={tableRef} className="table bg-gray">
            <thead>
              <tr>
                <th rowSpan={2}></th>
                <th rowSpan={2}>Conveyor No.</th>
                <th colSpan={4}>Conveyor position</th>
                <th rowSpan={2}>Length, m</th>
                <th rowSpan={2}>Height, m</th>
                <th rowSpan={2}>Speed, m/s</th>
              </tr>
              <tr>
                <th style={{ top: offsetTop }}>X, m</th>
                <th style={{ top: offsetTop }}>Y, m</th>
                <th style={{ top: offsetTop }}>Z, m</th>
                <th style={{ top: offsetTop }}>Direction</th>
              </tr>
            </thead>
            <tbody>{data.map(getRow)}</tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
