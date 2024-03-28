import React, { useState, useEffect, useMemo } from "react";
import { CheckBoxCell } from "../../../common/CheckBoxCell";
import { CustomDlg } from "../../../common/CustomDlg";
import { GeneralCheckBoxCell } from "../../../common/GeneralCheckBoxCell";
import { Button, FormGroup, InputGroup, Checkbox } from "@blueprintjs/core";
import { Section } from "../../../../store/data/types";

type Props = {
  library: string;
  profiles: Section[];
  selected: string[];
  onClose: () => any;
  onSave: (selected: string[]) => any;
};

type RowData = {
  id: number;
  selected: boolean;
  name: string;
  shape: string;
};

export function ProfilesDlg(props: Props) {
  const { library, profiles, selected, onClose, onSave } = props;

  const [rows, setRows] = useState<RowData[]>([]);
  const [query, setQuery] = useState<string>("");
  const [allSelected, setAllSelected] = useState<boolean>(false);

  useEffect(() => {
    const newRows: RowData[] = profiles.map((profile, i) => {
      return {
        id: i,
        selected: selected.includes(profile.designation),
        name: profile.designation,
        shape: profile.shape?.trim().toUpperCase(),
      };
    });
    setRows(newRows);
  }, [selected, profiles]);

  const filtered = useMemo(() => {
    if (allSelected) {
      return rows.filter((row) => row.selected);
    }
    return query
      ? rows.filter((row) => row.name.toUpperCase().includes(query.toUpperCase()))
      : rows;
  }, [rows, query, allSelected]);

  function handleChange(item: RowData, selected: boolean) {
    setRows(
      rows.map((row) => {
        if (row.id === item.id) {
          return { ...row, selected };
        }
        return row;
      })
    );
  }

  function getRow(row: RowData) {
    return (
      <tr key={row.id}>
        <CheckBoxCell
          key={row.id}
          value={row.selected}
          onChange={(value) => handleChange(row, value)}
        />
        <td className={"w-200"}>{row.name}</td>
        <td className={"w-200"}>{row.shape}</td>
      </tr>
    );
  }

  return (
    <CustomDlg
      title={`Profiles of "${library}" C/S Library`}
      zIndex={3}
      onClose={onClose}
      body={
        <div className="d-flex f-column">
          <div className="hr" />
          <div className="d-flex label-light bg-dark f-ai-center">
            <span>Profile Designation</span>
            <FormGroup className="no-m w-200">
              <InputGroup
                value={query}
                onChange={(event: React.ChangeEvent<HTMLInputElement>) =>
                  setQuery(event.currentTarget.value)
                }
              />
            </FormGroup>
            <span style={{ marginLeft: 10 }}>Show selected</span>
            <FormGroup className="no-m w-50">
              <Checkbox
                checked={allSelected}
                onChange={(event) => setAllSelected(event.currentTarget.checked)}
              />
            </FormGroup>
          </div>
          <div className="hr" />
          <div className="p-5 bg-dark">
            <div className={"small-table-container"}>
              <table className="table bg-gray">
                <thead>
                  <tr>
                    <GeneralCheckBoxCell data={filtered} onChange={setRows} />
                    <th>Name</th>
                    <th>Shape</th>
                  </tr>
                </thead>
                <tbody>{filtered.map((item) => getRow(item))}</tbody>
              </table>
            </div>
          </div>
          <div className="hr" />
        </div>
      }
      actions={
        <>
          <Button text="Cancel" onClick={onClose} />
          <Button
            text="Save"
            onClick={() => onSave(rows.filter((row) => row.selected).map((row) => row.name))}
            intent={"primary"}
          />
        </>
      }
    />
  );
}
