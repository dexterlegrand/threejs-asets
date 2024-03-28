import React, { useRef, useState } from "react";
import { Classes, Button, FormGroup, InputGroup } from "@blueprintjs/core";
import { DialogHeader } from "./DialogHeader";

type Props = {
  title: string;
  onClose: (value?: string) => any;
};

export function InputDlg(props: Props) {
  const { title, onClose } = props;
  const [value, setValue] = useState<string>("");

  const dialog = useRef<HTMLDivElement>(null);

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onClose(value.trim());
  }

  return (
    <div
      ref={dialog}
      className={`${Classes.DIALOG} grabbing-dialog no-m no-p`}
      style={{ zIndex: 3 }}
    >
      <DialogHeader title={title} position={"center"} onClose={() => onClose()} parent={dialog} />
      <form onSubmit={handleSubmit} className={Classes.DIALOG_BODY}>
        <FormGroup>
          <InputGroup
            autoFocus
            onChange={(event: React.ChangeEvent<HTMLInputElement>) =>
              setValue(event.currentTarget.value)
            }
          />
        </FormGroup>
        <div className={`${Classes.DIALOG_FOOTER} no-m`}>
          <div className={Classes.DIALOG_FOOTER_ACTIONS}>
            <Button text={"Cancel"} onClick={() => onClose()} />
            <Button type={"submit"} text={"Ok"} intent={"primary"} />
          </div>
        </div>
      </form>
    </div>
  );
}
