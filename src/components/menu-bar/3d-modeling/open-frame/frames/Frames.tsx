import React, { FunctionComponent } from "react";
import FramesGeometry from "./FramesGeometry";
import { FrameParametersContainer } from "./frame-parameters/FrameParametersContainer";
import { Section, Material } from "../../../../../store/data/types";

type Props = {
  profiles: Section[];
  materials: Material[];
  libs: string[];
};

const Frames: FunctionComponent<Props> = (props) => {
  const { profiles, materials, libs } = props;

  return (
    <div className="d-flex f-column">
      <FramesGeometry profiles={profiles} materials={materials} libs={libs} />
      <FrameParametersContainer />
    </div>
  );
};

export default Frames;
