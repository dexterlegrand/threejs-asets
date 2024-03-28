import React, { FunctionComponent, useMemo } from "react";
import { useSelector } from "react-redux";
import { ApplicationState } from "../../../../store";
import { getCurrentProject } from "../../../3d-models/utils";
import ODSSGeometry from "./members/geometry/ODSSGeometry";
import ODSSReleases from "./members/releases/ODSSReleases";
import UserDefinedSectionsOfStaad from "./user-defined-sections/UserDefinedSectionsOfStaad";

type Props = {
  selected: number;
};

const ODSSContent: FunctionComponent<Props> = (props) => {
  const project = useSelector((state: ApplicationState) =>
    getCurrentProject(state)
  );

  const models = useMemo(() => project?.odss ?? [], [project]);

  function getComponent() {
    switch (props.selected) {
      case 0:
        return <ODSSGeometry />;
      case 1:
        return <ODSSReleases />;
      case 11:
        return <UserDefinedSectionsOfStaad />;
      default:
        return null;
    }
  }

  return getComponent();
};

export default ODSSContent;
