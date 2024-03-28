import React, { useEffect, useState } from "react";
import { CustomDlg } from "../../../common/CustomDlg";
import Axios from "axios";
import { GeneralCheckBoxCell } from "../../../common/GeneralCheckBoxCell";
import { CheckBoxCell } from "../../../common/CheckBoxCell";
import { Button, ProgressBar } from "@blueprintjs/core";
import { jsonOptions } from "../../../../store/main/actions";
import { API_ROOT } from "../../../../pages/utils/agent";
import saveAs from "file-saver";

type Props = {
  onClose: () => any;
};

type TRow = {
  id: number;
  selected: boolean;
  file: string;
};

export function RemoteFiles({ onClose }: Props) {
  const [files, setFiles] = useState<TRow[]>([]);
  const [progress, setProgress] = useState<boolean>(false);

  useEffect(() => {
    getRemoteFiles();
  }, []);

  function getRemoteFiles() {
    setProgress(true);
    Axios.get(`${API_ROOT}/api/v2/filenames`)
      .then((res) => {
        setFiles(
          res.data.map((file: string, id: number) => ({
            id,
            selected: false,
            file,
          }))
        );
      })
      .catch((err) => console.error(err))
      .finally(() => setProgress(false));
  }

  function handleSelect(row: TRow, selected: boolean) {
    setFiles(files.map((f) => (f.id === row.id ? { ...f, selected } : f)));
  }

  function getRow(row: TRow) {
    return (
      <tr key={row.id}>
        <CheckBoxCell
          key={row.id}
          value={row.selected}
          onChange={(val) => handleSelect(row, val)}
        />
        <td>{row.file}</td>
      </tr>
    );
  }

  function onDownload() {
    const selected = files.filter((f) => f.selected);
    if (!selected.length) return;
    setProgress(true);
    Axios.post(
      `${API_ROOT}/api/v2/getfiles`,
      JSON.stringify({ selectedFiles: selected.map((s) => s.file) }),
      { ...jsonOptions, responseType: "blob" }
    )
      .then((res) => {
        saveAs(res.data, "datasheets.zip");
      })
      .catch((err) => console.error(err))
      .finally(() => setProgress(false));
  }

  return (
    <CustomDlg
      zIndex={2}
      onClose={onClose}
      title={"Download Datasheets"}
      body={
        <div className={"bg-dark p-5"}>
          <div className={"small-table-container"}>
            <table className="table bg-gray">
              <thead>
                <tr>
                  <GeneralCheckBoxCell data={files} onChange={setFiles} />
                  <th>Datasheet Name</th>
                </tr>
              </thead>
              <tbody>{files.map(getRow)}</tbody>
            </table>
          </div>
          <div className={"hr"} />
          {progress ? (
            <>
              <ProgressBar />
              <div className={"hr"} />
            </>
          ) : null}
        </div>
      }
      actions={
        <>
          <Button
            intent={"primary"}
            text={"Download"}
            disabled={!files.some((f) => f.selected)}
            onClick={onDownload}
          />
          <Button intent={"danger"} text={"Cancel"} onClick={onClose} />
        </>
      }
    />
  );
}
