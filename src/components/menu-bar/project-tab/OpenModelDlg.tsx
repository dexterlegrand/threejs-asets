import React, { FunctionComponent, useEffect, useRef, useState } from "react";
import { FormGroup, Button } from "@blueprintjs/core";
import { CustomDlg } from "../../common/CustomDlg";
import { ModelType, TWorkMode } from "../../../store/main/types";
import { SimpleSelector } from "../../common/SimpleSelector";

type Props = {
  mode: TWorkMode;
  title?: string;
  extensions?: string[];
  onClose: (file?: File, type?: ModelType) => any;
};

const OpenModelDlg: FunctionComponent<Props> = (props) => {
  const { mode, title, extensions, onClose } = props;

  const [type, setType] = useState<ModelType>();
  const [file, setFile] = useState<File>();

  useEffect(() => {
    if ((mode === "STRUCTURE" && !type) || !file) return;
    onClose(file, type);
  }, [mode, file, type]);

  function handleCLoseDlg(event: React.ChangeEvent<HTMLInputElement>) {
    event.currentTarget.files && setFile(event.currentTarget.files[0]);
  }

  return (
    <CustomDlg
      zIndex={10}
      isMinimize={true}
      position={"center"}
      title={title ?? "Open Project"}
      body={
        <>
          {mode === "STRUCTURE" ? (
            <SimpleSelector<ModelType>
              label={"Type of Models"}
              items={["Flare", "Pipe Rack", "Open Frame", "Factory Shed"]}
              selected={type}
              onSelect={setType}
              className={"fill-select"}
              itemLabel={(item) => item}
            />
          ) : null}
          <FormGroup label="Select File">
            <input
              type="file"
              onChange={handleCLoseDlg}
              accept={extensions?.join(", ")}
              disabled={mode === "STRUCTURE" && !type}
            />
          </FormGroup>
        </>
      }
      actions={<Button text={"Cancel"} onClick={() => onClose()} />}
      onClose={() => onClose()}
    />
  );
};

export default OpenModelDlg;
