import React, { useEffect, useState } from "react";
import { CustomDlg } from "../../../common/CustomDlg";
import { useTour } from "@reactour/tour";
import { getTourData, getTourListForDiscipline } from "../../../tour-data-provider/TourDataProvider";

type Props = {
  onClose: () => any;
  onboardDiscipline: string;
};


export function OnboardList({ onClose, onboardDiscipline }: Props) {

  const { isOpen, currentStep, steps, setIsOpen, setCurrentStep, setSteps, setMeta, meta } = useTour();

  function getListofTour() {
    const list= getTourListForDiscipline(onboardDiscipline)
    console.log(onboardDiscipline)
    const listofItems = list.map((item) => 
    <div key={item.tour_id} onClick={(e) => triggerTour(item.tour_id)} style={{ padding: "0.5em", border: "solid 1px",cursor: "pointer" }}>
      {item.name}
    </div>);
    return listofItems;
  }

  const triggerTour = (item: string) => {
    setMeta?.(item); 
    setSteps?.(getTourData(item));
    setCurrentStep?.(0);
    setIsOpen(true)
  }

  return (
    <>
      <CustomDlg
        position="center"
        zIndex={99}
        onClose={onClose}
        title={"Take a tour"}
        body={
          <div>
            {getListofTour()}
          </div>
        }
      />
    </>
  );
}
