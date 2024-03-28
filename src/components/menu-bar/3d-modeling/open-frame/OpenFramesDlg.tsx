import React, { FunctionComponent, useEffect, useState } from "react";
import OpenFramesTabs from "./OpenFramesTabs";
import OpenFramesContent from "./OpenFramesContent";
import { CustomDlg } from "../../../common/CustomDlg";
import { useRecoilValue } from "recoil";
import { beamConnections } from "../../../../recoil/atoms/beam-connections-atom";

type Props = { onClose: () => any };

const OpenFramesDlg: FunctionComponent<Props> = (props) => {
  const { onClose } = props;

  const [selected, setSelected] = useState<number>(0);

  const BCS = useRecoilValue(beamConnections);

  useEffect(() => {
    if (BCS.type !== "ODSM") return;
    if (BCS.anchor === "BP" && BCS.item?.subtype === "rectangular")
      setSelected(35);
    if (BCS.anchor === "SF" && BCS.item?.subtype === "rectangular")
      setSelected(37);
    if (BCS.anchor === "BB" && BCS.item) setSelected(38);
    if (BCS.anchor === "BC" && BCS.item) setSelected(39);
    if (BCS.anchor === "HB" && BCS.item) setSelected(40);
    if (BCS.anchor === "VB" && BCS.item) setSelected(41);
    if (BCS.anchor === "KB" && BCS.item) setSelected(42);
  }, [BCS.type, BCS.anchor, BCS.item]);

  return (
    <CustomDlg
      title={"Open Frame"}
      isMinimize={true}
      body={
        <div className={"d-flex f-column f-grow bg-dark"}>
          <OpenFramesTabs selected={selected} onSelect={setSelected} />
          <OpenFramesContent selected={selected} />
        </div>
      }
      onClose={onClose}
    />
  );
};

export default OpenFramesDlg;
