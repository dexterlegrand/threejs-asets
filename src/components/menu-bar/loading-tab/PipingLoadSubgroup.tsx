import React, { FunctionComponent } from "react";
import MenuButton from "../MenuButton";

type OwnProps = { onSelect: (value: string) => any };

type Props = OwnProps;

const PipingLoadSubgroup: FunctionComponent<Props> = props => {
  return (
    <div className="menu-bar-subgroup">
      <MenuButton
        text="Direct Load"
        onClick={() => props.onSelect("Direct Load")}
      />
      <MenuButton
        text="Blanket Load"
        onClick={() => props.onSelect("Blanket Load")}
      />
    </div>
  );
};

export default PipingLoadSubgroup;
