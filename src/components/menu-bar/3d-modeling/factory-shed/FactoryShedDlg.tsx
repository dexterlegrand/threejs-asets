import React, { FunctionComponent, useState } from "react";
import { CustomDlg } from "../../../common/CustomDlg";
import FactoryShedTabs from "./FactoryShedTabs";
import FactoryShedContent from "./FactoryShedContent";

type Props = { onClose: () => any };

const FactoryShedDlg: FunctionComponent<Props> = (props) => {
  const { onClose } = props;

  const [selected, setSelected] = useState<number>(0);

  return (
    <CustomDlg
      title={"Factory Shed"}
      isMinimize={true}
      body={
        <div className={"d-flex f-column f-grow bg-dark"}>
          <FactoryShedTabs selected={selected} onSelect={setSelected} />
          <FactoryShedContent selected={selected} />
        </div>
      }
      onClose={onClose}
    />
  );
};

export default FactoryShedDlg;
