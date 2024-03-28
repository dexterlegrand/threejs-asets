import React, { useMemo, useState, useEffect } from "react";
import { Button } from "@blueprintjs/core";
import { useHistory } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { changeWorkModeAction } from "../../store/main/actions";
import { createProcessAction } from "../../store/process/actions";
import { ApplicationState } from "../../store";
import { TWorkMode } from "../../store/main/types";
import { createPSSAction } from "../../store/pss/actions";
import "./ModeSwitcher.css";
import { useTour } from "@reactour/tour";
import {getTourData} from "../../components/tour-data-provider/TourDataProvider";
import {
  faCog
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Dropdown, MenuProps, Space } from "antd";

export function ModeSwitcher() {
  const { isOpen, currentStep, steps, setIsOpen, setCurrentStep, setSteps, setMeta, meta } = useTour();
  const history = useHistory();
  const [showDesignerOption, setShowDesignerOption] = useState(true);
  /*const [showDesignerOption] = useState(true);*/

  /*const handleMouseEnter = () => {
    setShowDesignerOption(true);
  }*/

  const hideDropdownDelay = 10000; 

  /*const handleMouseLeave = () => {
    setTimeout(() => {
      setShowDesignerOption(false);
    }, hideDropdownDelay);
  };*/

  const currentProject = useSelector(
    (state: ApplicationState) => state.main.currentProject
  );
  const products = useSelector(
    (state: ApplicationState) => state.main.products ?? []
  );

  const dispatch = useDispatch();

  const isProduction = useMemo(() => {
    return process.env.NODE_ENV === "production";
  }, []);

  const items: MenuProps['items'] = [
    {
      key: '1',
      label:"Get an overview of disciplines",
      onClick: () =>{
        // setShowDesignerOption(true);
        setSteps?.(getTourData('discipline-tour-all'));
        setCurrentStep?.(0);
        setIsOpen(true)
      }
    }  
  ];

  function handleSelectMode(event: React.MouseEvent<HTMLElement, MouseEvent>) {
    const mode = event.currentTarget.id as TWorkMode;
    dispatch(changeWorkModeAction(mode));
    if (mode === "LEARNINGS") {
      history.push("/learnings");
      return;
    }
    switch (mode) {
      case "STRUCTURE":
        dispatch(createPSSAction(currentProject));
        break;
      case "PROCESS":
      case "DESIGNER":
        dispatch(createProcessAction(currentProject));
        break;
      case "PRODESIGNER": //trial mode
        dispatch(createProcessAction(currentProject));
        break;
      case "PIPDESIGNER": //trial mode
        dispatch(createProcessAction(currentProject));
        break;
      case "STRDESIGNER": //trial mode
        dispatch(createProcessAction(currentProject));
        break;
    }
    history.push("/editor");
  }

  function handleViewer(){
    window.open("http://idsviewer.asets.io/", "_blank");
  }

  const showProDesigner = showDesignerOption && !products.includes("Designer") && isProduction &&products.includes("ProcessDesigner");
  const showPipDesigner = showDesignerOption && !products.includes("Designer") && isProduction &&products.includes("PipingDesigner");
  const showStrDesigner = showDesignerOption && !products.includes("Designer") && isProduction &&products.includes("StructuralDesigner");


  return (
    <div className={"switcher-container"}>
      <div className={"switcher-card"}>
        <h2>CHOOSE THE DISCIPLINE TO WORK IN</h2> 
        <div className={"swithcer"}>
          <Button
            id={"PROCESS"}
            large
            intent={"primary"}
            text={"PROCESS"}
            onClick={handleSelectMode}
            disabled={isProduction && !products.includes("Process")}
          />
          <div className="dropdown-container">
          <Button
            id={"DESIGNER"}
            large
            className="dropdown-container switcher"
            intent={"primary"}
            text={"INTEGRATOR"}
            onClick={handleSelectMode}
            disabled={isProduction && !products.includes("Designer")}
          />
          {showDesignerOption && (  // Only show the dropdown if showDesignerOption is true
            <div className={"dropdown-content"}>
              {showProDesigner && (
                <Button
                  id={"PRODESIGNER"}
                  large
                  intent={"primary"}
                  text={"PROCESS DESIGNER"}
                  onClick={handleSelectMode}
                />
              )}
              {showPipDesigner && (
                <Button
                  id={"PIPDESIGNER"}
                  large
                  intent={"primary"}
                  text={"PIPING DESIGNER"}
                  onClick={handleSelectMode}
                />
              )}
              {showStrDesigner && (
                <Button
                  id={"STRDESIGNER"}
                  large
                  intent={"primary"}
                  text={"STRUCTURAL DESIGNER"}
                  onClick={handleSelectMode}
                />
              )}
            </div>
          )}
        </div>
          <Button
            id={"PIPING"}
            large
            intent={"primary"}
            text={"PIPING"}
            onClick={handleSelectMode}
            disabled={isProduction && !products.includes("Pipe")}
          />
          <Button
            id={"STRUCTURE"}
            large
            intent={"primary"}
            text={"STRUCTURE"}
            onClick={handleSelectMode}
            disabled={
              isProduction &&
              !(
                products.includes("PR") ||
                products.includes("OF") ||
                products.includes("flare") ||
                products.includes("tower")
              )
            }
          />
          <Button
            id={"Viewer"}
            large
            intent={"primary"}
            text={"VIEWER"}
            onClick={handleViewer}
          />
          <Button
            id={"CONNECTION"}
            large
            intent={"primary"}
            text={"CONNECTIONS"}
            onClick={handleSelectMode}
            disabled={
              isProduction &&
              !(
                products.includes("PR") ||
                products.includes("OF") ||
                products.includes("flare") ||
                products.includes("tower")
              )
            }
          />
          <Button
            id={"LEARNINGS"}
            large
            intent={"primary"}
            text={"TRAINING"}
            onClick={handleSelectMode}
            disabled={
              isProduction &&
              !(products.includes("Instructor") || products.includes("Learner"))
            }
          />
        </div>
        <div>
        <FontAwesomeIcon icon={faCog} size="lg"/>
        <Dropdown menu={{ items }}>
          <a onClick={(e) => e.preventDefault()}>
            <Space>
            <b>Take a tour</b>
            </Space>
          </a>
        </Dropdown>
        </div>
      </div>
    </div>
  );
}
