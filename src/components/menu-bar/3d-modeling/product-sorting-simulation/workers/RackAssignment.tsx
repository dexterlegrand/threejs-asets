import React, { useMemo } from "react";
import { getCurrentPSS } from "../../../../3d-models/utils";
import { useDispatch, useSelector } from "react-redux";
import { CustomDlg } from "../../../../common/CustomDlg";
import { TPSSConveyor, TPSSRackAssignment, ERackColor } from "../../../../../store/pss/types";
import { changePSSConveyor } from "../../../../../store/pss/actions";
import { ApplicationState } from "../../../../../store";
import { SelectorCell } from "../../../../common/SelectorCell";
import { rackColors } from "../../../../../store/pss/initialState";

type Props = {
  type: "L" | "R";
  item: TPSSConveyor;
  onClose: () => any;
};

export function RackAssignment({ type, item, onClose }: Props) {
  const pss = useSelector((state: ApplicationState) => getCurrentPSS(state));

  const dispatch = useDispatch();

  const current = useMemo(() => {
    return pss?.conveyors.find((c) => c.id === item.id);
  }, [pss, item]);

  const data: TPSSRackAssignment[] = useMemo(() => {
    // @ts-ignore
    return current ? current[`peopleRackAssignment${type}`] : [];
  }, [current]);

  function handleChangeData(arr: TPSSRackAssignment[]) {
    if (!pss || !current) return;
    dispatch(changePSSConveyor(pss.project, { ...current, [`peopleRackAssignment${type}`]: arr }));
  }

  function handleChange(el: TPSSRackAssignment, color: ERackColor) {
    handleChangeData(data.map((d) => (d.id === el.id ? { ...el, color } : d)));
  }

  function getRow(el: TPSSRackAssignment, i: number) {
    return (
      <tr key={el.id}>
        <td>{el.id}</td>
        <SelectorCell<ERackColor>
          items={rackColors}
          itemKey={(val) => val}
          itemLabel={(val) => val}
          selected={el.color}
          onSelect={(val) => val && handleChange(el, val)}
        />
      </tr>
    );
  }

  return (
    <CustomDlg
      title={"Rack Assignment"}
      isMinimize={true}
      body={
        <div className="d-flex f-grow f-column">
          <div className={"bg-dark p-5"}>
            <div className={"small-table-container"}>
              <table className="table bg-gray">
                <thead>
                  <tr>
                    <th>Person from Start.</th>
                    <th>Rack Assignment</th>
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
