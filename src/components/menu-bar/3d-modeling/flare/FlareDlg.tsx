import React, { useState } from "react";
import { CustomDlg } from "../../../common/CustomDlg";
import FlareContent from "./FlareContent";
import FlareHeader from "./FlareHeader";

type Props = { onClose: () => any };

export default function FlareDlg({ onClose }: Props) {
  const [selected, setSelected] = useState<number>(0);

  return (
    <CustomDlg
      title={"Flare"}
      isMinimize={true}
      zIndex={1}
      body={
        <div className={`d-flex f-column f-grow bg-dark`}>
          <FlareHeader selected={selected} onSelect={setSelected} />
          <FlareContent selected={selected} />
        </div>
      }
      onClose={onClose}
    />
  );
}
