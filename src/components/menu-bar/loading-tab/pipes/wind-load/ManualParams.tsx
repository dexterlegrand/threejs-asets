import React, { useMemo } from "react";
import { CheckBoxCell } from "../../../../common/CheckBoxCell";
import { NumericCell } from "../../../../common/NumericCell";
import { Button } from "@blueprintjs/core";
import { getNextId } from "../../../../3d-models/utils";
import { TPipeWindLoad } from "../../../../../store/main/pipeTypes";

type Props = {
  data: TPipeWindLoad;
  onChange: (field: string, value: any) => any;
};

export function ManualParamsPP({ data, onChange }: Props) {
  const manual = useMemo(() => {
    return data.manualWindCode;
  }, [data]);

  function handleAdd() {
    onChange("manualWindCode", [
      ...manual,
      {
        id: getNextId(manual),
        selected: false,
        height: 0,
        pressure: 0,
      },
    ]);
  }

  function handleDelete() {
    onChange(
      "manualWindCode",
      manual.filter((item) => !item.selected)
    );
  }

  function handleChange(id: number, field: string, value: any) {
    onChange(
      "manualWindCode",
      manual.map((item) => {
        if (item.id === id) {
          return {
            ...item,
            [field]: value,
          };
        }
        return item;
      })
    );
  }

  return (
    <div className={"d-flex f-column f-grow"}>
      <div className={"label-light bg-dark"}>
        <Button small icon="trash" text="Delete" intent="warning" onClick={handleDelete} />
        <Button small icon="export" text="Export to CSV" intent="success" disabled={true} />
        <Button small icon="import" text="Import from CSV" intent="success" disabled={true} />
        <Button small icon="plus" text="Add Row" intent="primary" onClick={handleAdd} />
      </div>
      <div className={"hr"} />
      <div className={"d-flex f-grow bg-dark p-5"}>
        <div className={"d-flex f-grow small-table-container"}>
          <table className={"table bg-gray"}>
            <thead>
              <tr>
                <th>{""}</th>
                <th>Height</th>
                <th>
                  Pressure (kN/m<sup>2</sup>)
                </th>
              </tr>
            </thead>
            <tbody>
              {manual.map((item) => (
                <tr key={item.id}>
                  <CheckBoxCell
                    key={item.id}
                    value={item.selected}
                    onChange={(value) => handleChange(item.id, "selected", value)}
                  />
                  <NumericCell
                    min={0}
                    isDecimal={true}
                    value={item.height}
                    onChange={(value) => handleChange(item.id, "height", value)}
                    className={"w-50p"}
                  />
                  <NumericCell
                    min={0}
                    isDecimal={true}
                    value={item.pressure}
                    onChange={(value) => handleChange(item.id, "pressure", value)}
                    className={"w-50p"}
                  />
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
