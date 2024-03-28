import React, { useState, useMemo } from "react";
import { useSelector } from "react-redux";
import { ApplicationState } from "../../../../store";
import { getCurrentProject } from "../../../3d-models/utils";
import { CustomDlg } from "../../../common/CustomDlg";
import { CustomTabsDlg } from "../../../common/CustomTabsDlg";
import { TDropDownItem } from "../../../../store/ui/types";
import LineModeling from "./data-modeling-components/LineModeling";
import PipeData from "./data-modeling-components/PipeData";
import PipeEndConnectors from "./data-modeling-components/PipeEndConnectors";
import PipeFlanges from "./data-modeling-components/PipeFlanges";
import PipeValves from "./data-modeling-components/PipeValves";
import UserDefinedElbows from "./data-modeling-components/UserDefinedElbows";

type Props = {
  onClose: () => any;
};

const tabs: TDropDownItem[] = [
  { id: 4, name: "Pipe Lines" },
  { id: 0, name: "Pipe Data" },
  { id: 1, name: "End Connectors" },
  { id: 2, name: "Pipe Flanges" },
  { id: 3, name: "Pipe Valves" },
  { id: 5, name: "User Defined Elbows" },
];

export function DesignDataModeling({ onClose }: Props) {
  const [dialog, setDialog] = useState<JSX.Element>();
  const [tab, setTab] = useState<number>(4);

  const project = useSelector((state: ApplicationState) => getCurrentProject(state));
  const resoures = useSelector((state: ApplicationState) => state.data);

  const pipes = useMemo(() => project?.freePipes ?? [], [project?.freePipes]);

  function getComponent() {
    switch (tab) {
      case 0:
        return (
          <PipeData project={project} pipes={pipes} resoures={resoures} setDialog={setDialog} />
        );
      case 1:
        return (
          <PipeEndConnectors
            project={project}
            pipes={pipes}
            resoures={resoures}
            setDialog={setDialog}
          />
        );
      case 2:
        return (
          <PipeFlanges project={project} pipes={pipes} resoures={resoures} setDialog={setDialog} />
        );
      case 3:
        return <PipeValves project={project} pipes={pipes} />;
      case 4:
        return <LineModeling pipes={pipes} />;
      case 5:
        return <UserDefinedElbows resoures={resoures} />;
      default:
        return null;
    }
  }

  return (
    <>
      {dialog}
      <CustomDlg
        zIndex={10}
        isMinimize={true}
        title={"Pipe Modeling"}
        idText="pipe-modeling-dialog"
        body={
          <>
            <CustomTabsDlg selected={tab} tabs={tabs} onSelect={setTab} />
            <div className={"hr"} />
            <div className="d-flex f-grow f-column bg-dark">{getComponent()}</div>
          </>
        }
        onClose={onClose}
      />
    </>
  );
}
