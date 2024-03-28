import React, { FunctionComponent, useEffect, useState } from "react";
import ODSSTabs from "./ODSSTabs";
import ODSSContent from "./ODSSContent";
import { CustomDlg } from "../../../common/CustomDlg";

type Props = { onClose: () => any };

const ODSSDlg: FunctionComponent<Props> = (props) => {
  const { onClose } = props;

  const [selected, setSelected] = useState<number>(0);

  return (
    <CustomDlg
      title={"ODSS"}
      isMinimize={true}
      body={
        <div className={"d-flex f-column f-grow bg-dark"}>
          <ODSSTabs selected={selected} onSelect={setSelected} />
          <ODSSContent selected={selected} />
        </div>
      }
      onClose={onClose}
    />
  );
};

export default ODSSDlg;
