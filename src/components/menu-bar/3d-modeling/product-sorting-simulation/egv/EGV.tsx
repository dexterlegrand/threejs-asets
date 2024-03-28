import React, { useMemo, useState } from "react";
import { EGVPathDlg } from "./EGVPathDlg";
import { useDispatch, useSelector } from "react-redux";
import { ApplicationState } from "../../../../../store";
import { getCurrentPSS } from "../../../../3d-models/utils";
import { TPSSConveyor } from "../../../../../store/pss/types";
import { Button } from "@blueprintjs/core";
import { NumericCell } from "../../../../common/NumericCell";
import { changePSSConveyor } from "../../../../../store/pss/actions";

type Props = {};

export function EGV(props: Props) {
  const [dlg, setDlg] = useState<JSX.Element>();

  const pss = useSelector((state: ApplicationState) => getCurrentPSS(state));

  const dispatch = useDispatch();

  const data = useMemo(() => {
    return pss?.conveyors ?? [];
  }, [pss]);

  function handleChange(item: TPSSConveyor, field: string, value: any) {
    if (!pss) return;
    dispatch(changePSSConveyor(pss.project, { ...item, [field]: value }));
  }

  function getRow(item: TPSSConveyor) {
    if (!pss) return null;
    return (
      <tr key={item.id}>
        <td>{item.id}</td>
        <td>
          <Button
            small
            minimal
            icon={"menu"}
            intent={"primary"}
            className={"c-light"}
            onClick={() => {
              setDlg(
                <EGVPathDlg name={pss?.project} item={item} onClose={() => setDlg(undefined)} />
              );
            }}
          />
        </td>
        <NumericCell
          isDecimal={true}
          value={item.EGVSpeed}
          onChange={(val) => handleChange(item, "EGVSpeed", val)}
          className={"w-100"}
        />
        <NumericCell
          isDecimal={true}
          value={item.EGVRacksPerTrip}
          onChange={(val) => handleChange(item, "EGVRacksPerTrip", val)}
          className={"w-100"}
        />
      </tr>
    );
  }

  return (
    <>
      <div className="d-flex f-column">
        <div className="hr" />
        <div className={"p-5"}>
          <div className={"table-container"}>
            <table className="table bg-gray">
              <thead>
                <tr>
                  <th>Conveyor No.</th>
                  <th>EGV Path</th>
                  <th>EGV Speed, m/s</th>
                  <th>Racks Per Trip</th>
                </tr>
              </thead>
              <tbody>{data.map(getRow)}</tbody>
            </table>
          </div>
        </div>
      </div>
      {dlg}
    </>
  );
}
