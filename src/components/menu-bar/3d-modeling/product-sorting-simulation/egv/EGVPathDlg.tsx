import React, { useState, useRef, useEffect, useMemo } from "react";
import { getTopOffset, getNextId, getCurrentPSS } from "../../../../3d-models/utils";
import { Button } from "@blueprintjs/core";
import { useDispatch, useSelector } from "react-redux";
import { CustomDlg } from "../../../../common/CustomDlg";
import { TPSSConveyor, TPSSEGVPath } from "../../../../../store/pss/types";
import { changePSSConveyor } from "../../../../../store/pss/actions";
import { NumericCell } from "../../../../common/NumericCell";
import { CheckBoxCell } from "../../../../common/CheckBoxCell";
import { ApplicationState } from "../../../../../store";

type Props = {
  name: string;
  item: TPSSConveyor;
  onClose: () => any;
};

export function EGVPathDlg({ name, item, onClose }: Props) {
  const [selected, setSelected] = useState<number[]>([]);
  const [offsetTop, setOffsetTop] = useState<number>(0);

  const tableRef = useRef<HTMLTableElement>(null);

  const pss = useSelector((state: ApplicationState) => getCurrentPSS(state));

  const dispatch = useDispatch();

  const current = useMemo(() => {
    return pss?.conveyors.find((c) => c.id === item.id);
  }, [pss, item]);

  const data = useMemo(() => {
    return current?.EGVPath ?? [];
  }, [current]);

  useEffect(() => {
    setOffsetTop(getTopOffset(tableRef.current, 1));
  }, []);

  function handleChangeData(EGVPath: TPSSEGVPath[]) {
    dispatch(changePSSConveyor(name, { ...item, EGVPath }));
  }

  function handleAdd() {
    handleChangeData([...data, { id: getNextId(data), x: 0, y: 0, z: 0 }]);
  }

  function handleChange(el: TPSSEGVPath, field: string, val: any) {
    handleChangeData(data.map((d) => (d.id === el.id ? { ...el, [field]: val } : d)));
  }

  function handleDelete() {
    handleChangeData(data.filter((d) => !selected.includes(d.id)));
    setSelected([]);
  }

  function handleSelect(el: TPSSEGVPath) {
    if (selected.includes(el.id)) {
      setSelected(selected.filter((s) => s !== el.id));
    } else {
      setSelected([...selected, el.id]);
    }
  }

  function getRow(el: TPSSEGVPath, i: number) {
    return (
      <tr key={el.id}>
        <CheckBoxCell
          key={el.id}
          value={selected.includes(el.id)}
          onChange={() => handleSelect(el)}
        />
        <td>{i || "Start Point"}</td>
        <NumericCell
          isDecimal={true}
          value={el.x}
          onChange={(val) => handleChange(el, "x", val)}
          className={"w-100"}
        />
        <NumericCell
          isDecimal={true}
          value={el.y}
          onChange={(val) => handleChange(el, "y", val)}
          className={"w-100"}
        />
        <NumericCell
          isDecimal={true}
          value={el.z}
          onChange={(val) => handleChange(el, "z", val)}
          className={"w-100"}
        />
      </tr>
    );
  }

  return (
    <CustomDlg
      title={"EGV Path Detail"}
      isMinimize={true}
      body={
        <div className="d-flex f-grow f-column">
          <div className="label-light bg-dark">
            <Button small icon="trash" text="Delete" intent="warning" onClick={handleDelete} />
            <Button small icon="plus" text="Add Row" intent="primary" onClick={handleAdd} />
          </div>
          <div className="hr" />
          <div className={"bg-dark p-5"}>
            <div className={"small-table-container"}>
              <table className="table bg-gray">
                <thead>
                  <tr>
                    <th rowSpan={2}></th>
                    <th rowSpan={2}>Point No.</th>
                    <th colSpan={3}>Point Position, m</th>
                  </tr>
                  <tr>
                    <th style={{ top: offsetTop }}>X</th>
                    <th style={{ top: offsetTop }}>Y</th>
                    <th style={{ top: offsetTop }}>Z</th>
                  </tr>
                </thead>
                <tbody>{data.map(getRow)}</tbody>
              </table>
            </div>
          </div>
        </div>
      }
      onClose={onClose}
    />
  );
}
