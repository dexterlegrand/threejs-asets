import React, { useRef } from "react";
import { Button, Classes } from "@blueprintjs/core";
import { DialogHeader } from "./DialogHeader";

type Props = {
  message: string;
  onConfirm: () => any;
  onCancel: () => any;
};

export function ConfirmDlg(props: Props) {
  const { message, onConfirm, onCancel } = props;

  const dialog = useRef<HTMLDivElement>(null);

  return (
    <div
      ref={dialog}
      className={`${Classes.DIALOG} grabbing-dialog no-m no-p`}
      style={{ zIndex: 3, maxWidth: "25vw" }}
    >
      <DialogHeader
        title="Confirmation"
        position={"center"}
        onClose={onCancel}
        parent={dialog}
      />
      <div className={Classes.DIALOG_BODY}>
        <div className={"label-light"}>
          <h3>{message}</h3>
        </div>
        <div className={`${Classes.DIALOG_FOOTER} no-m`}>
          <div className={Classes.DIALOG_FOOTER_ACTIONS}>
            <Button text={"No"} onClick={onCancel} />
            <Button text={"Yes"} onClick={onConfirm} intent={"primary"} />
          </div>
        </div>
      </div>
    </div>
  );
}
