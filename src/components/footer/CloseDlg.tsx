import React from "react";
import { CustomDlg } from "../common/CustomDlg";
import { Button } from "@blueprintjs/core";

type Props = {
  project: string;
  onSaveAndClose: () => any;
  onClose: () => any;
  onCancel: () => any;
};

export function CloseDlg(props: Props) {
  const { project, onSaveAndClose, onClose, onCancel } = props;

  return (
    <CustomDlg
      title={`Project closing`}
      body={
        <h3>{`Do you want to save the file before closing "${project}"?`}</h3>
      }
      actions={
        <>
          <Button intent={"primary"} text={"Yes"} onClick={onSaveAndClose} />
          <Button intent={"danger"} text={"No"} onClick={onClose} />
          <Button text={"Cancel"} onClick={onCancel} />
        </>
      }
      onClose={onCancel}
      position="center"
      zIndex={4}
    />
  );
}
