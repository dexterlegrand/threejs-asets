import React, { useEffect, useState } from "react";
import { CustomDlg } from "../../../common/CustomDlg";
import { Button, ProgressBar } from "@blueprintjs/core";
import Axios from "axios";
import { VideoDlg } from "./VideoDlg";
import { API_ROOT } from "../../../../pages/utils/agent";

type Props = {
  onClose: () => any;
};

type TVideo = {
  title: string;
  link: string;
};

export function VideoList({ onClose }: Props) {
  const [dialog, setDialog] = useState<JSX.Element>();
  const [files, setFiles] = useState<TVideo[]>([]);
  const [progress, setProgress] = useState<boolean>(false);

  useEffect(() => {
    getVideos();
  }, []);

  function getVideos() {
    setProgress(true);
    Axios.get(`${API_ROOT}/api/v2/videos`)
      .then((res) => {
        setFiles(res.data);
      })
      .catch((err) => console.error(err))
      .finally(() => setProgress(false));
  }

  function getRow(row: TVideo, i: number) {
    const openVideo = () => {
      window.open(row.link, "_blank");
      //   setDialog(<VideoDlg name={row.title} link={row.link} onClose={() => setDialog(undefined)} />);
    };
    return (
      <tr key={i}>
        <td>{i + 1}</td>
        <td>{row.title}</td>
        <td>
          <Button small intent={"primary"} text={"Open"} onClick={openVideo} />
        </td>
      </tr>
    );
  }

  return (
    <>
      <CustomDlg
        zIndex={2}
        onClose={onClose}
        title={"Videos"}
        body={
          <div className={"bg-dark p-5"}>
            <div className={"small-table-container"}>
              <table className="table bg-gray">
                <thead>
                  <tr>
                    <th>No.</th>
                    <th>Video</th>
                    <th />
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
      />
      {dialog}
    </>
  );
}
