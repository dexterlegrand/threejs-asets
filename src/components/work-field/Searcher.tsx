import React, { useState } from "react";
import { Button, FormGroup, InputGroup } from "@blueprintjs/core";
import { CustomDlg } from "../common/CustomDlg";

type Props = {
  onClose: () => any;
  onSubmit: (value: string) => any;
};

export function Searcher(props: Props) {
  const { onClose, onSubmit } = props;
  const [value, setValue] = useState<string>("");

  return (
    <CustomDlg
      isMinimize={true}
      title={"Search"}
      position={"center"}
      onClose={onClose}
      zIndex={5}
      body={
        <FormGroup>
          <InputGroup
            autoFocus
            leftIcon={"search"}
            onChange={(event: React.ChangeEvent<HTMLInputElement>) =>
              setValue(event.currentTarget.value)
            }
            onKeyDown={(e) => {
              if (e.key === "Enter") onSubmit(value.trim());
            }}
          />
        </FormGroup>
      }
      actions={
        <>
          <Button text={"Cancel"} onClick={() => onClose()} />
          <Button text={"Ok"} onClick={() => onSubmit(value.trim())} intent={"primary"} />
        </>
      }
    />
  );
}
