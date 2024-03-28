import React, { FunctionComponent, useState } from "react";
import PipeRackHeader from "./PipeRackTabs";
import PipeRackContent from "./PipeRackContent";
import { CustomDlg } from "../../../common/CustomDlg";

type Props = { onClose: () => any };

const PipeRackDlg: FunctionComponent<Props> = (props) => {
  const [selected, setSelected] = useState<number>(0);

  return (
    <CustomDlg
      title={"Pipe Rack"}
      isMinimize={true}
      zIndex={1}
      body={
        <div className={`d-flex f-column f-grow bg-dark`}>
          <PipeRackHeader selected={selected} onSelect={setSelected} />
          <PipeRackContent selected={selected} />
        </div>
      }
      onClose={props.onClose}
    />
  );
};

export default PipeRackDlg;
