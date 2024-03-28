import React, { useMemo } from "react";
import { useSelector } from "react-redux";
import { ApplicationState } from "../../../store";
import { ODSS, ODSSUserDefinedSection } from "../../../store/main/odssTypes";
import { getCurrentProject } from "../utils";
import ODSSComponent from "./ODSSComponent";

export default React.memo(function ODSSContainer() {
  const project = useSelector((state: ApplicationState) =>
    getCurrentProject(state)
  );

  const odss = useMemo(() => {
    return project?.odss ?? [];
  }, [project?.odss]);

  return project ? (
    <>
      {generateOpenFrames(
        project.name,
        project.userDefinedSectionsOfStaad,
        odss
      )}
    </>
  ) : null;
});

function generateOpenFrames(
  project: string,
  customProfiles: ODSSUserDefinedSection[] | undefined,
  odss: ODSS[]
) {
  return project
    ? odss.map((m, i) => {
        return (
          <ODSSComponent
            key={`${m.name}`}
            project={project}
            customProfiles={customProfiles}
            model={m}
          />
        );
      })
    : null;
}
