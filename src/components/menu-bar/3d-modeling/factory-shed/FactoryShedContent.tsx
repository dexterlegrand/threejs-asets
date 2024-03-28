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
import PlatformsFS from "./platforms/Platforms";
import { CircularBasePlateFS } from "./base-plate/CircularBasePlate";
import { RectangularBasePlateFS } from "./base-plate/RectangularBasePlate";
import { CircularSpliceFlangeFS } from "./splice-flange/Circular";
import { RectangularSpliceFlangeFS } from "./splice-flange/Rectangular";
import { useSelector } from "react-redux";
import { ApplicationState } from "../../../../store";
import FabricatedSections from "../user-defined-section/FabricatedSections";
import RolledSectionWithPlates from "../user-defined-section/RolledSectionWithPlates";
import { ElementsElevations } from "./tier-elevations/ElementsElevations";
import { Columns } from "./additional-beams/Columns";
import { getFSModels } from "../../../3d-models/openFrame";
import { getElementByName, getCurrentUI } from "../../../3d-models/utils";
import { PipeModelingFS } from "./pipes/PipeModelingFS";
import { AccessoriesFS } from "./accessories/Accessories";
import { TPostFS } from "./accessories/TPost";
import { FPostFS } from "./accessories/FPost";
import { ChristmasTreeFS } from "./accessories/ChristmasTree";
import { SupportModelingFS } from "./pipes/SupportModelingFS";
import { FEED } from "./pipes/FEED";
import { StairFS } from "./stairs/StairFS";
import CombinedSections from "../user-defined-section/CombinedSections";
import { Truss } from "./truss/Truss";
import { Runners } from "./runners/Runners";
import { MetalCladdings } from "./metal-cladding/MetalCladding";
import { MasonryCladdings } from "./masonry-cladding/MasonryCladding";

type Props = {
  selected: number;
};

const FactoryShedContent: FunctionComponent<Props> = (props) => {
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
  const materials = useSelector(
    (state: ApplicationState) => state.data.materials
  );
  const project = useSelector((state: ApplicationState) =>
    getElementByName(state.main.projects, state.main.currentProject)
  );

  const ui = useSelector((state: ApplicationState) => getCurrentUI(state));

  const models = useMemo(() => getFSModels(project), [project]);

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
        return (
          <Cantilever
            project={project}
            models={models}
            profiles={allProfiles}
            libs={libs}
          />
        );
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
        return <PlatformsFS models={models} />;
      case 14:
        return <CircularBasePlateFS models={models} />;
      case 15:
        return <RectangularBasePlateFS models={models} />;
      case 16:
        return <CircularSpliceFlangeFS models={models} />;
      case 17:
        return <RectangularSpliceFlangeFS models={models} />;
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
        return <PipeModelingFS models={models} />;
      case 23:
        return <SupportModelingFS models={models} />;
      case 24:
        return <AccessoriesFS project={project} models={models} />;
      case 25:
        return (
          <TPostFS
            project={project}
            models={models}
            libs={libs}
            profiles={allProfiles}
          />
        );
      case 26:
        return (
          <FPostFS
            project={project}
            models={models}
            libs={libs}
            profiles={allProfiles}
          />
        );
      case 27:
        return (
          <ChristmasTreeFS
            project={project}
            models={models}
            libs={libs}
            profiles={allProfiles}
          />
        );
      case 28:
        return <FEED />;
      case 29:
        return <StairFS project={project} libs={libs} profiles={allProfiles} />;
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
      case 31:
        return <Truss project={project} libs={libs} profiles={allProfiles} />;
      case 32:
        return <Runners project={project} libs={libs} profiles={allProfiles} />;
      case 33:
        return <MetalCladdings project={project} />;
      case 34:
        return <MasonryCladdings project={project} />;
      default:
        return null;
    }
  }

  return getComponent();
};

export default FactoryShedContent;
