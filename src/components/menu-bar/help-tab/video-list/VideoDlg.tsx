import React from "react";
import { CustomDlg } from "../../../common/CustomDlg";

type Props = {
  name: string;
  link: string;
  onClose: () => any;
};

export function VideoDlg({ name, link, onClose }: Props) {
  return (
    <CustomDlg
      zIndex={3}
      onClose={onClose}
      title={name}
      body={
        <div className={"bg-dark p-5"}>
          <video width="320" height="240" controls>
            <source src={link} type="video/mp4" />
            Your browser does not support the video tag.
          </video>
        </div>
      }
    />
  );
}
