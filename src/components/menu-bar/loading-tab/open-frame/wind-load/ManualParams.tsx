import React, { useMemo } from "react";
import { CheckBoxCell } from "../../../../common/CheckBoxCell";
import { NumericCell } from "../../../../common/NumericCell";
import { Button } from "@blueprintjs/core";
import { WindLoadUI } from "../../../../../store/ui/types";
import {
  checkImportedNumber,
  exportToCSV,
  fixNumberToStr,
  getNextId,
  importFromCSV,
} from "../../../../3d-models/utils";

type Props = {
  data: WindLoadUI;
  onChange: (field: string, value: any) => any;
};

export function ManualParamsOF({ data, onChange }: Props) {
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

  function handleExport() {
    exportToCSV(
      manual.map((item) => {
        return {
          id: item.id,
          "Height (m)": fixNumberToStr(item.height),
          "Pressure (kN/m2)": fixNumberToStr(item.pressure),
        };
      }),
      "OF Manual Wind Loads Parameters"
    );
  }

  function handleImport() {
    importFromCSV((data, isCSV) => {
      if (!isCSV) return;
      const newData: any[] = [];
      for (const item of data) {
        if (item.id === undefined || item.id === null) break;
        const pressure = item["Pressure (kN/m2)"];
        const height = item["Height (m)"];
        newData.push({
          id: getNextId(newData),
          selected: false,
          height: checkImportedNumber(height, false) ?? 0,
          pressure: checkImportedNumber(pressure, false) ?? 0,
        });
      }
      onChange("manualWindCode", newData);
    });
  }

  return (
    <div className={"d-flex f-column f-grow"}>
      <div className={"label-light bg-dark"}>
        <Button
          small
          icon="trash"
          text="Delete"
          intent="warning"
          onClick={handleDelete}
        />
        <Button
          small
          icon="export"
          text="Export to CSV"
          intent="success"
          onClick={handleExport}
        />
        <Button
          small
          icon="import"
          text="Import from CSV"
          intent="success"
          onClick={handleImport}
        />
        <Button
          small
          icon="plus"
          text="Add Row"
          intent="primary"
          onClick={handleAdd}
        />
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
                    onChange={(value) =>
                      handleChange(item.id, "selected", value)
                    }
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
                    onChange={(value) =>
                      handleChange(item.id, "pressure", value)
                    }
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
