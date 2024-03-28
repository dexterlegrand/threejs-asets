import React, { FunctionComponent, useMemo } from "react";
import Portals from "./portals/Portals";
import Beams from "./additional-beams/Beams";
import PlanBracings from "./additional-beams/PlanBracings";
import Accessories from "./accessories/Accessories";
import TPost from "./accessories/TPost";
import FPost from "./accessories/FPost";
import ChristmasTree from "./accessories/ChristmasTree";
import GeometryColumns from "./members/GeometryColumns";
import GeometryBeams from "./members/GeometryBeams";
import Release from "./members/Release";
import Platforms from "./platforms/Platforms";
import Ladders from "./ladders/Ladders";
import CircularBasePlate from "./base-plate/CircularBasePlate";
import RectangularBasePlate from "./base-plate/RectangularBasePlate";
import Circular from "./splice-flange/Circular";
import Rectangular from "./splice-flange/Rectangular";
import FabricatedSections from "../user-defined-section/FabricatedSections";
import RolledSectionWithPlates from "../user-defined-section/RolledSectionWithPlates";
import { useSelector } from "react-redux";
import { ApplicationState } from "../../../../store";
import { PipeModeling } from "./pipes/PipeModeling";
import { SupportModeling } from "./pipes/SupportModeling";
import { PipeRack } from "../../../../store/main/types";
import TierElevations from "./tier-elevations/TierElevations";
import { AdditionalColumns } from "./additional-beams/AdditionalColumns";
import { PortalBracings } from "./additional-beams/PortalBracings";
import { FEED } from "./pipes/FEED";
import { getCurrentUI } from "../../../3d-models/utils";
import CombinedSections from "../user-defined-section/CombinedSections";

type OwnProps = { selected: number };

type Props = OwnProps;

const PipeRackContent: FunctionComponent<Props> = (props) => {
  const currentProject = useSelector(
    (state: ApplicationState) => state.main.currentProject
  );
  const projects = useSelector(
    (state: ApplicationState) => state.main.projects
  );
  const fabricatedSections = useSelector(
    (state: ApplicationState) => state.main.fabricatedSections
  );
  const rolledSections = useSelector(
    (state: ApplicationState) => state.main.rolledSections
  );
  const combinedSections = useSelector(
    (state: ApplicationState) => state.main.combinedSections
  );
  const data = useSelector((state: ApplicationState) => state.data);

  const ui = useSelector((state: ApplicationState) => getCurrentUI(state));

  const project = useMemo(() => {
    return projects.find((project) => project.name === currentProject);
  }, [projects, currentProject]);

  const models = useMemo(() => {
    return project
      ? (project.models.filter(
          (model) => model.type === "Pipe Rack"
        ) as PipeRack[])
      : [];
  }, [project]);

  const profiles = useMemo(() => {
    return ui?.availableData?.profileSectionData ?? [];
  }, [ui?.availableData?.profileSectionData]);

  const allProfiles = useMemo(() => {
    return [
      ...profiles,
      ...fabricatedSections,
      ...rolledSections,
      ...combinedSections,
    ];
  }, [fabricatedSections, rolledSections, combinedSections, profiles]);

  const libs = useMemo(() => {
    const libs = [
      ...data.CS_Libraries.filter((lib) =>
        profiles.some((profile) => (profile.country_code?.trim() ?? "") === lib)
      ),
    ];
    if (fabricatedSections.length) libs.push("Fabricated");
    if (rolledSections.length) libs.push("Rolled");
    if (combinedSections.length) libs.push("Combined");
    return libs;
  }, [fabricatedSections, rolledSections, combinedSections, data, profiles]);

  function getComponent() {
    switch (props.selected) {
      case 0:
        return <Portals models={models} profiles={allProfiles} libs={libs} />;
      case 1:
        return <Beams models={models} profiles={allProfiles} libs={libs} />;
      case 2:
        return (
          <PlanBracings models={models} profiles={allProfiles} libs={libs} />
        );
      case 3:
        return <Accessories models={models} />;
      case 4:
        return <TPost models={models} profiles={allProfiles} libs={libs} />;
      case 5:
        return <FPost models={models} profiles={allProfiles} libs={libs} />;
      case 6:
        return (
          <ChristmasTree models={models} profiles={allProfiles} libs={libs} />
        );
      case 8:
        return (
          <GeometryBeams models={models} profiles={allProfiles} libs={libs} />
        );
      case 9:
        return (
          <GeometryColumns models={models} profiles={allProfiles} libs={libs} />
        );
      case 10:
        return <Release models={models} />;
      case 11:
        return <PipeModeling models={models} />;
      case 12:
        return <SupportModeling models={models} />;
      case 13:
        return <Platforms models={models} />;
      case 14:
        return <Ladders models={models} profiles={allProfiles} libs={libs} />;
      case 15:
        return <CircularBasePlate models={models} />;
      case 16:
        return <RectangularBasePlate models={models} />;
      case 17:
        return <Circular models={models} />;
      case 18:
        return <Rectangular models={models} />;
      case 19:
        return <FabricatedSections sections={fabricatedSections} />;
      case 20:
        return (
          <RolledSectionWithPlates
            sections={rolledSections}
            libs={libs.filter(
              (lib) => !["Rolled", "Fabricated", "Combined"].includes(lib)
            )}
            profiles={profiles}
          />
        );
      case 21:
        return <TierElevations models={models} />;
      case 22:
        return (
          <AdditionalColumns
            models={models}
            profiles={allProfiles}
            libs={libs}
          />
        );
      case 23:
        return (
          <PortalBracings models={models} profiles={allProfiles} libs={libs} />
        );
      case 24:
        return <FEED />;
      case 25:
        return (
          <CombinedSections
            sections={combinedSections}
            libs={libs.filter(
              (lib) => !["Rolled", "Fabricated", "Combined"].includes(lib)
            )}
            profiles={allProfiles}
          />
        );
      default:
        return null;
    }
  }

  return getComponent();
};

export default PipeRackContent;
