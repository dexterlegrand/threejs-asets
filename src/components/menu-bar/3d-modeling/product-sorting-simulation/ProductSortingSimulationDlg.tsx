import React, { FunctionComponent, useState } from "react";
import { CustomDlg } from "../../../common/CustomDlg";
import ProductSortingSimulationTabs from "./ProductSortingSimulationTabs";
import ProductSortingSimulationContent from "./ProductSortingSimulationContent";

type Props = { onClose: () => any };

const ProductSortingSimulationDlg: FunctionComponent<Props> = (props) => {
  const { onClose } = props;

  const [selected, setSelected] = useState<number>(0);

  return (
    <CustomDlg
      title={"Product sorting simulation"}
      isMinimize={true}
      body={
        <div className={"d-flex f-column f-grow bg-dark"}>
          <ProductSortingSimulationTabs selected={selected} onSelect={setSelected} />
          <ProductSortingSimulationContent selected={selected} />
        </div>
      }
      onClose={onClose}
    />
  );
};

export default ProductSortingSimulationDlg;
