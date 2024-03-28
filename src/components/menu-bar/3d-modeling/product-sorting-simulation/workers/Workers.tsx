import React, { useMemo, useState, useRef, useEffect } from "react";
import { Button } from "@blueprintjs/core";
import { useDispatch, useSelector } from "react-redux";
import { ApplicationState } from "../../../../../store";
import { getCurrentPSS, getTopOffset, getNextId } from "../../../../3d-models/utils";
import { TPSSConveyor, ERackColor } from "../../../../../store/pss/types";
import { changePSSConveyor } from "../../../../../store/pss/actions";
import { NumericCell } from "../../../../common/NumericCell";
import { RackAssignment } from "./RackAssignment";

type Props = {};

export function Workers(props: Props) {
  const [dlg, setDlg] = useState<JSX.Element>();
  const [offsetTop, setOffsetTop] = useState<number>(0);

  const tableRef = useRef<HTMLTableElement>(null);

  const pss = useSelector((state: ApplicationState) => getCurrentPSS(state));

  const dispatch = useDispatch();

  const data = useMemo(() => {
    return pss?.conveyors ?? [];
  }, [pss]);

  useEffect(() => {
    setOffsetTop(getTopOffset(tableRef.current, 1));
  }, [data]);

  function handleChange(item: TPSSConveyor, field: string, value: any) {
    if (!pss) return;
    if (field === "peopleCountL") {
      const arr = [...item.peopleRackAssignmentL];
      const diff = value - item.peopleRackAssignmentL.length;
      if (diff > 0) {
        for (let i = 0; i < diff; i++) {
          arr.push({ id: getNextId(arr), color: ERackColor.RED });
        }
      } else arr.length = value;
      dispatch(
        changePSSConveyor(pss.project, { ...item, [field]: value, peopleRackAssignmentL: arr })
      );
    } else if (field === "peopleCountR") {
      const arr = [...item.peopleRackAssignmentR];
      const diff = value - item.peopleRackAssignmentR.length;
      if (diff) {
        for (let i = 0; i < diff; i++) {
          arr.push({ id: getNextId(arr), color: ERackColor.RED });
        }
      } else arr.length = value;
      dispatch(
        changePSSConveyor(pss.project, { ...item, [field]: value, peopleRackAssignmentR: arr })
      );
    } else dispatch(changePSSConveyor(pss.project, { ...item, [field]: value }));
  }

  function getRow(item: TPSSConveyor) {
    return (
      <tr key={item.id}>
        <td>{item.id}</td>
        <NumericCell
          value={item.peopleCountL}
          onChange={(val) => handleChange(item, "peopleCountL", val)}
          className={"w-100"}
        />
        <NumericCell
          value={item.peopleCountR}
          onChange={(val) => handleChange(item, "peopleCountR", val)}
          className={"w-100"}
        />
        <NumericCell
          isDecimal={true}
          value={item.peopleSpacingL}
          onChange={(val) => handleChange(item, "peopleSpacingL", val)}
          className={"w-100"}
        />
        <NumericCell
          isDecimal={true}
          value={item.peopleSpacingR}
          onChange={(val) => handleChange(item, "peopleSpacingR", val)}
          className={"w-100"}
        />
        <td>
          <Button
            small
            minimal
            icon={"menu"}
            intent={"primary"}
            className={"c-light"}
            onClick={() => {
              setDlg(<RackAssignment type={"L"} item={item} onClose={() => setDlg(undefined)} />);
            }}
          />
        </td>
        <td>
          <Button
            small
            minimal
            icon={"menu"}
            intent={"primary"}
            className={"c-light"}
            onClick={() => {
              setDlg(<RackAssignment type={"R"} item={item} onClose={() => setDlg(undefined)} />);
            }}
          />
        </td>
        <NumericCell
          isDecimal={true}
          value={item.peopleStartPositionL}
          onChange={(val) => handleChange(item, "peopleStartPositionL", val)}
          className={"w-100"}
        />
        <NumericCell
          isDecimal={true}
          value={item.peopleStartPositionR}
          onChange={(val) => handleChange(item, "peopleStartPositionR", val)}
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
            <table ref={tableRef} className="table bg-gray">
              <thead>
                <tr>
                  <th rowSpan={2}>Conveyor No.</th>
                  <th colSpan={2}>No of People</th>
                  <th colSpan={2}>Spacing</th>
                  <th colSpan={2}>Rack assignment</th>
                  <th colSpan={2}>Start position</th>
                </tr>
                <tr>
                  <th style={{ top: offsetTop }}>Left</th>
                  <th style={{ top: offsetTop }}>Right</th>
                  <th style={{ top: offsetTop }}>Left, m</th>
                  <th style={{ top: offsetTop }}>Right, m</th>
                  <th style={{ top: offsetTop }}>Left</th>
                  <th style={{ top: offsetTop }}>Right</th>
                  <th style={{ top: offsetTop }}>Left, m</th>
                  <th style={{ top: offsetTop }}>Right, m</th>
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
