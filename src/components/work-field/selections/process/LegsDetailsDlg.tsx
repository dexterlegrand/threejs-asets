import React, { useEffect } from "react";
import { CustomDlg } from "../../../common/CustomDlg";
import { TProcessElementPoint, TProcessElement } from "../../../../store/process/types";
import { NumericCell } from "../../../common/NumericCell";

type Props = {
  item: TProcessElement;
  onChange: (item: TProcessElement, toRemove?: TProcessElementPoint) => any;
  onClose: () => any;
};

export function LegsDetailsDlg({ item, onChange, onClose }: Props) {
  useEffect(() => {
    if (!item.parameters.legs) onClose();
  }, [item]);

  function handleChange(row: any, field: string, value: any) {
    const changed = {
      ...item,
      parameters: {
        ...item.parameters,
        legs: item.parameters.legs.map((l: any) =>
          l.id === row.id ? { ...l, [field]: value } : l
        ),
      },
    };
    onChange(changed);
  }

  function drawRow(row: any) {
    const width = "100px";
    return (
      <tr key={row.id}>
        <td style={{ width }}>{row.id}</td>
        <NumericCell
          min={0.001}
          isDecimal={true}
          value={row.width}
          onChange={(val) => handleChange(row, "width", val)}
          style={{ width }}
        />
        <NumericCell
          min={0.001}
          isDecimal={true}
          value={row.height}
          onChange={(val) => handleChange(row, "height", val)}
          style={{ width }}
        />
        <NumericCell
          min={0.001}
          isDecimal={true}
          value={row.length}
          onChange={(val) => handleChange(row, "length", val)}
          style={{ width }}
        />
      </tr>
    );
  }

  return (
    <CustomDlg
      title={"Legs Details"}
      isMinimize={true}
      zIndex={5}
      position={"center"}
      body={
        <div className={"d-flex f-column f-grow bg-dark"}>
          <div className="hr" />
          <div className="p-5">
            <div className={"small-table-container"}>
              <table className="table bg-gray">
                <thead>
                  <tr>
                    <th />
                    <th>Width (m)</th>
                    <th>Height (m)</th>
                    <th>Length (m)</th>
                  </tr>
                </thead>
                <tbody>{item.parameters.legs?.map(drawRow)}</tbody>
              </table>
            </div>
          </div>
        </div>
      }
      onClose={onClose}
    />
  );
}
