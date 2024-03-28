import React, { FunctionComponent, useMemo } from "react";
import PlanBracings from "./additional-beams/PlanBracings";
import Frames from "./frames/Frames";
import Cantilever from "./additional-beams/Cantilever";
import ColumnToColumn from "./additional-beams/ColumnToColumn";
import ColumnToBeam from "./additional-beams/ColumnToBeam";
import BeamToBeam from "./additional-beams/BeamToBeam";
import KneeBracing from "./additional-beams/KneeBracing";
import VerticalBracing from "./additional-beams/VerticalBracing";
import GeometryColumns from "./members/GeometryColumns";
import GeometryBeams from "./members/GeometryBeams";
import Release from "./members/Release";
import PlatformsOF from "./platforms/Platforms";
import Ladders from "./ladders/Ladders";
import { CircularBasePlateOF } from "./base-plate/CircularBasePlate";
import { RectangularBasePlateOF } from "./base-plate/RectangularBasePlate";
import { CircularSpliceFlangeOF } from "./splice-flange/Circular";
import { RectangularSpliceFlangeOF } from "./splice-flange/Rectangular";
import { useSelector } from "react-redux";
import { ApplicationState } from "../../../../store";
import FabricatedSections from "../user-defined-section/FabricatedSections";
import RolledSectionWithPlates from "../user-defined-section/RolledSectionWithPlates";
import { ElementsElevations } from "./tier-elevations/ElementsElevations";
import Columns from "./additional-beams/Columns";
import { getOFModels } from "../../../3d-models/openFrame";
import { getElementByName, getCurrentUI } from "../../../3d-models/utils";
import { PipeModelingOF } from "./pipes/PipeModelingOF";
import { AccessoriesOF } from "./accessories/Accessories";
import { TPostOF } from "./accessories/TPost";
import { FPostOF } from "./accessories/FPost";
import { ChristmasTreeOF } from "./accessories/ChristmasTree";
import { SupportModelingOF } from "./pipes/SupportModelingOF";
import { FEED } from "./pipes/FEED";
import { StairOF } from "./stairs/StairOF";
import CombinedSections from "../user-defined-section/CombinedSections";
import BeamToBeamConnectionsOF from "./beam-to-beam-connections/BeamToBeamConnectionsOF";
import BeamToColumnConnectionsOF from "./beam-to-column-connections/BeamToColumnConnectionsOF";
import HBracingConnectionsOF from "./h-bracing-connections/HBracingConnectionsOF";
import VBracingConnectionsOF from "./v-bracing-connections/VBracingConnectionsOF";
import KBracingConnectionsOF from "./k-bracing-connections/KBracingConnectionsOF";
import { Truss } from "./truss/Truss";
import { Runners } from "./runners/Runners";
import { MetalCladdings } from "./metal-cladding/MetalCladding";
import { MasonryCladdings } from "./masonry-cladding/MasonryCladding";
import Railings from "./railings/Railings";

type Props = {
  selected: number;
};

const OpenFramesContent: FunctionComponent<Props> = (props) => {
  const fabricatedSections = useSelector(
    (state: ApplicationState) => state.main.fabricatedSections
  );
  const rolledSections = useSelector(
    (state: ApplicationState) => state.main.rolledSections
  );
  const combinedSections = useSelector(
    (state: ApplicationState) => state.main.combinedSections
  );
  const CS_Libraries = useSelector(
    (state: ApplicationState) => state.data.CS_Libraries
  );
  const materials = useSelector((state: ApplicationState) =>
    state.data.materials.filter((m) => m.material_type === "STRUCTURE")
  );
  const project = useSelector((state: ApplicationState) =>
    getElementByName(state.main.projects, state.main.currentProject)
  );

  const ui = useSelector((state: ApplicationState) => getCurrentUI(state));

  const models = useMemo(() => getOFModels(project), [project]);

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
  }, [profiles, fabricatedSections, rolledSections, combinedSections]);

  const libs = useMemo(() => {
    const libs = [
      ...CS_Libraries.filter((lib) =>
        profiles.some((profile) => (profile.country_code?.trim() ?? "") === lib)
      ),
    ];
    if (fabricatedSections.length) libs.push("Fabricated");
    if (rolledSections.length) libs.push("Rolled");
    if (combinedSections.length) libs.push("Combined");
    return libs;
  }, [
    fabricatedSections,
    rolledSections,
    combinedSections,
    CS_Libraries,
    profiles,
  ]);

  function getComponent() {
    switch (props.selected) {
      case 0:
        return (
          <Frames profiles={allProfiles} materials={materials} libs={libs} />
        );
      case 1:
        return <Cantilever profiles={allProfiles} libs={libs} />;
      case 2:
        return (
          <ColumnToColumn
            project={project}
            models={models}
            profiles={allProfiles}
            libs={libs}
          />
        );
      case 21:
        return (
          <ColumnToBeam
            project={project}
            models={models}
            profiles={allProfiles}
            libs={libs}
          />
        );
      case 3:
        return (
          <Columns
            project={project}
            models={models}
            profiles={allProfiles}
            libs={libs}
          />
        );
      case 4:
        return (
          <BeamToBeam
            project={project}
            models={models}
            profiles={allProfiles}
            libs={libs}
          />
        );
      case 5:
        return (
          <KneeBracing
            project={project}
            models={models}
            profiles={allProfiles}
            libs={libs}
          />
        );
      case 6:
        return (
          <VerticalBracing
            project={project}
            models={models}
            profiles={allProfiles}
            libs={libs}
          />
        );
      case 7:
        return (
          <PlanBracings
            project={project}
            models={models}
            profiles={allProfiles}
            libs={libs}
          />
        );
      case 9:
        return (
          <GeometryBeams
            project={project}
            models={models}
            profiles={allProfiles}
            libs={libs}
          />
        );
      case 10:
        return (
          <GeometryColumns
            project={project}
            models={models}
            profiles={allProfiles}
            libs={libs}
          />
        );
      case 11:
        return <Release project={project} models={models} />;
      case 12:
        return <PlatformsOF models={models} />;
      case 13:
        return <Ladders />;
      case 18:
        return <FabricatedSections sections={fabricatedSections} />;
      case 19:
        return (
          <RolledSectionWithPlates
            sections={rolledSections}
            libs={libs.filter(
              (lib) => !["Rolled", "Fabricated", "Combined"].includes(lib)
            )}
            profiles={allProfiles}
          />
        );
      case 20:
        return <ElementsElevations models={models} />;
      case 22:
        return <PipeModelingOF models={models} />;
      case 23:
        return <SupportModelingOF models={models} />;
      case 24:
        return <AccessoriesOF project={project} models={models} />;
      case 25:
        return (
          <TPostOF
            project={project}
            models={models}
            libs={libs}
            profiles={allProfiles}
          />
        );
      case 26:
        return (
          <FPostOF
            project={project}
            models={models}
            libs={libs}
            profiles={allProfiles}
          />
        );
      case 27:
        return (
          <ChristmasTreeOF
            project={project}
            models={models}
            libs={libs}
            profiles={allProfiles}
          />
        );
      case 28:
        return <FEED />;
      case 29:
        return <StairOF project={project} libs={libs} profiles={allProfiles} />;
      case 30:
        return (
          <CombinedSections
            sections={combinedSections}
            libs={libs.filter(
              (lib) => !["Rolled", "Fabricated", "Combined"].includes(lib)
            )}
            profiles={allProfiles}
          />
        );
      case 34:
        return <CircularBasePlateOF models={models} />;
      case 35:
        return <RectangularBasePlateOF models={models} />;
      case 36:
        return <CircularSpliceFlangeOF models={models} />;
      case 37:
        return <RectangularSpliceFlangeOF models={models} />;
      case 38:
        return <BeamToBeamConnectionsOF models={models} />;
      case 39:
        return <BeamToColumnConnectionsOF models={models} />;
      case 40:
        return <HBracingConnectionsOF models={models} />;
      case 41:
        return <VBracingConnectionsOF models={models} />;
      case 42:
        return <KBracingConnectionsOF models={models} />;
      case 43:
        return <Truss project={project} libs={libs} profiles={allProfiles} />;
      case 44:
        return <Runners project={project} libs={libs} profiles={allProfiles} />;
      case 45:
        return <MetalCladdings project={project} />;
      case 46:
        return <MasonryCladdings project={project} />;
      case 47:
        return <Railings profiles={allProfiles} libs={libs} />;
      default:
        return null;
    }
  }

  return getComponent();
};

export default OpenFramesContent;
