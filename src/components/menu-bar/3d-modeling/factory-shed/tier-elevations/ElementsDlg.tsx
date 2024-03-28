import React, { useState, useEffect } from "react";
import { CustomDlg } from "../../../../common/CustomDlg";
import { Button } from "@blueprintjs/core";
import { CheckBoxCell } from "../../../../common/CheckBoxCell";
import { GeneralCheckBoxCell } from "../../../../common/GeneralCheckBoxCell";

type Props = {
  elements: Element[];
  onClose: () => any;
  onSave: (elements: Element[]) => any;
};

type Element = {
  selected: boolean;
  name: string;
};

export function ElementsDlg(props: Props) {
  const { elements, onClose, onSave } = props;

  const [rows, setRows] = useState<Element[]>([]);

  useEffect(() => {
    setRows(elements);
  }, [elements]);

  function handleChange(item: Element, selected: boolean) {
    setRows(
      rows.map((row) => {
        if (row.name === item.name) {
          return { ...row, selected };
        }
        return row;
      })
    );
  }

  function getRow(row: Element) {
    return (
      <tr key={row.name}>
        <CheckBoxCell
          value={row.selected}
          onChange={(value) => handleChange(row, value)}
        />
        <td className={"w-200"}>{row.name}</td>
      </tr>
    );
  }

  return (
    <CustomDlg
      title={"Selecting elements"}
      zIndex={3}
      onClose={onClose}
      body={
        <div className="d-flex f-column">
          <div className="hr" />
          <div className="label-light bg-dark">Elements</div>
          <div className="hr" />
          <div className="p-5 bg-dark">
            <div className={"small-table-container"}>
              <table className="table bg-gray">
                <thead>
                  <tr>
                    <GeneralCheckBoxCell data={rows} onChange={setRows} />
                    <th>Name</th>
                  </tr>
                </thead>
                <tbody>{rows.map((item) => getRow(item))}</tbody>
              </table>
            </div>
          </div>
          <div className="hr" />
        </div>
      }
      actions={
        <>
          <Button text="Cancel" onClick={onClose} />
          <Button text="Save" onClick={() => onSave(rows)} intent={"primary"} />
        </>
      }
    />
  );
}
