import React from "react";
import { FunctionComponent } from "react";
import { Conveyor } from "./conveyor/Conveyor";
import { Workers } from "./workers/Workers";
import { Racks } from "./racks/Racks";
import { EGV } from "./egv/EGV";

type Props = {
  selected: number;
};

const ProductSortingSimulationContent: FunctionComponent<Props> = (props) => {
  function getComponent() {
    switch (props.selected) {
      case 0:
        return <Conveyor />;
      case 1:
        return <Workers />;
      case 2:
        return <Racks />;
      case 3:
        return <EGV />;
      default:
        return null;
    }
  }

  return getComponent();
};

export default ProductSortingSimulationContent;
