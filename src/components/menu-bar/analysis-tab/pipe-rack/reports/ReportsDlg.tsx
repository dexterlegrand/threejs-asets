import React, { useMemo } from "react";
import { useSelector } from "react-redux";
import { ApplicationState } from "../../../../../store";
import { PipeRack } from "../../../../../store/main/types";
import { ReactionSummary } from "./tables/ReactionSummary";
import { MemberEndForces } from "./tables/MemberEndForces";
import { MemberStressCheck } from "./tables/MemberStressCheck";
import { NodalDisplacements } from "./tables/NodalDisplacements";
import { CustomDlg } from "../../../../common/CustomDlg";
import { DeflectionCheck } from "./tables/DeflectionCheck";

type Props = {
  table: number;
  onClose: () => any;
};

export function ReportDlg(props: Props) {
  const { table, onClose } = props;

  const currentProject = useSelector((state: ApplicationState) => state.main.currentProject);

  const projects = useSelector((state: ApplicationState) => state.main.projects);

  const project = useMemo(() => {
    return projects.find((project) => project.name === currentProject);
  }, [projects, currentProject]);

  const models = useMemo(() => {
    return project
      ? (project.models.filter((model) => model.type === "Pipe Rack") as PipeRack[])
      : [];
  }, [project]);

  function getDialogTitle() {
    switch (table) {
      case 1:
        return "Support Reactions";
      case 2:
        return "Member End Forces";
      case 3:
        return "Member Stress Check";
      case 4:
        return "Nodal Displacements";
      case 5:
        return "Deflection Check";
      default:
        return "";
    }
  }

  function drawTable() {
    switch (table) {
      case 1:
        return <ReactionSummary models={models} />;
      case 2:
        return <MemberEndForces models={models} />;
      case 3:
        return <MemberStressCheck models={models} />;
      case 4:
        return <NodalDisplacements models={models} />;
      case 5:
        return <DeflectionCheck models={models} />;
      default:
        return null;
    }
  }

  return (
    <CustomDlg title={getDialogTitle()} isMinimize={true} body={drawTable()} onClose={onClose} />
  );
}
