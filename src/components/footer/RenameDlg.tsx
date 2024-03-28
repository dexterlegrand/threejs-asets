import React, { useEffect, useRef, useState } from "react";
import { Button, Classes, FormGroup, InputGroup } from "@blueprintjs/core";
import { DialogHeader } from "../common/DialogHeader";
import { renameProject } from "../../store/main/actions";
import { useDispatch } from "react-redux";
import { renameUIProject } from "../../store/ui/actions";
import { renameProcessAction } from "../../store/process/actions";
import { renamePSSAction } from "../../store/pss/actions";

type Props = {
  name: string;
  onClose: () => any;
};

export function RenameDlg({ name, onClose }: Props) {
  const [newName, setNewName] = useState<string>("");

  useEffect(() => {
    setNewName(name);
  }, [name]);

  const dispatch = useDispatch();

  const dialogRef = useRef<HTMLDivElement>(null);

  return (
    <div ref={dialogRef} className={`${Classes.DIALOG} grabbing-dialog no-m no-p`}>
      <DialogHeader
        title={`Rename project "${name}"`}
        position={"center"}
        onClose={onClose}
        parent={dialogRef}
      />
      <form
        className={Classes.DIALOG_BODY}
        onSubmit={() => {
          if (newName && name !== newName) {
            dispatch(renameProject(name, newName));
            dispatch(renameUIProject(name, newName));
            dispatch(renameProcessAction(name, newName));
            dispatch(renamePSSAction(name, newName));
            onClose();
          }
        }}
      >
        <div className="d-flex f-ai-center bg-gray" style={{ marginBottom: 20 }}>
          <div className="label-light w-100">New name</div>
          <FormGroup className="no-m">
            <InputGroup
              value={newName}
              onChange={(event: React.ChangeEvent<HTMLInputElement>) =>
                setNewName(event.target.value)
              }
            />
          </FormGroup>
        </div>
        <div className={`${Classes.DIALOG_FOOTER} no-m`}>
          <div className={Classes.DIALOG_FOOTER_ACTIONS}>
            <Button type={"button"} text={"Cancel"} onClick={() => onClose()} />
            <Button
              type={"submit"}
              text={"Save"}
              intent={"primary"}
              disabled={!newName || name === newName}
              onClick={() => {
                dispatch(renameProject(name, newName));
                dispatch(renameUIProject(name, newName));
                dispatch(renameProcessAction(name, newName));
                dispatch(renamePSSAction(name, newName));
                onClose();
              }}
            />
          </div>
        </div>
      </form>
    </div>
  );
}
