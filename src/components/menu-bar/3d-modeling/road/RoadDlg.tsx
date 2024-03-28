import React, { FunctionComponent, useState } from "react";
import { CustomDlg } from "../../../common/CustomDlg";
import CreationTool from "../open-frame/creation-bar/tool-button/CreationTool";
import { useRecoilValue } from "recoil";
import OFCreationAtom from "../../../../recoil/atoms/of-creation-atom";
import AdditionalRoadParameters from "../open-frame/creation-bar/dialogs/AdditionalRoadParameters";

type Props = { onClose: () => any };

const RoadDlg: FunctionComponent<Props> = (props) => {
  const { onClose } = props;
  const OFCreationState = useRecoilValue(OFCreationAtom);

  const [selected, setSelected] = useState<number>(0);

  return (
    <>
      <CustomDlg
        title={"Road tool"}
        isMinimize={true}
        body={
          <div className={"d-flex f-column f-grow bg-dark tools-body"}>
            {/* <ProductSortingSimulationTabs
            selected={selected}
            onSelect={setSelected}
          />
          <ProductSortingSimulationContent selected={selected} /> */}

            <CreationTool type={"ROAD"} />
            <CreationTool type={"DRAIN"} />
            <CreationTool type={"TRANCH"} />
          </div>
        }
        onClose={onClose}
      />
      {OFCreationState.type === "ROAD" ||
      OFCreationState.type === "DRAIN" ||
      OFCreationState.type === "TRANCH" ? (
        <AdditionalRoadParameters />
      ) : null}
    </>
  );
};

export default RoadDlg;
