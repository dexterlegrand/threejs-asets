import { Button, ProgressBar } from "@blueprintjs/core";
import React, { useRef, useState } from "react";
import { useRecoilValue } from "recoil";
import { lsaAtom } from "../../../../recoil/atoms/lsa-atoms";
import { CustomDlg } from "../../../common/CustomDlg";

// Load the rendering pieces we want to use (for both WebGL and WebGPU)
import "@kitware/vtk.js/Rendering/Profiles/All";

import DataAccessHelper from "@kitware/vtk.js/IO/Core/DataAccessHelper";
import HttpDataAccessHelper from "@kitware/vtk.js/IO/Core/DataAccessHelper/HttpDataAccessHelper";
import vtkFullScreenRenderWindow from "@kitware/vtk.js/Rendering/Misc/FullScreenRenderWindow";
import vtkHttpSceneLoader from "@kitware/vtk.js/IO/Core/HttpSceneLoader";

// Force DataAccessHelper to have access to various data source
import "@kitware/vtk.js/IO/Core/DataAccessHelper/HtmlDataAccessHelper";
import "@kitware/vtk.js/IO/Core/DataAccessHelper/JSZipDataAccessHelper";
import { secondServerAPI } from "../../../../pages/utils/agent";
import { lsaServerAPI } from "../../../../pages/utils/agent";

type Props = {
  onClose: () => any;
};

function emptyContainer(container: any) {
  while (container.firstChild) {
    container.removeChild(container.firstChild);
  }
}

export function LSAViewer({ onClose }: Props) {
  const [isLoading, setIsLoading] = useState(false);

  const lsa = useRecoilValue(lsaAtom);

  const vtkContainerRef = useRef<HTMLDivElement>(null);

  function renderModel(url: string) {
    if (!vtkContainerRef.current) return;
    emptyContainer(vtkContainerRef.current);

    setIsLoading(true);

    const fullScreenRenderer = vtkFullScreenRenderWindow.newInstance({
      background: [0, 0, 0],
      // @ts-ignore
      rootContainer: vtkContainerRef.current,
    });
    const renderer = fullScreenRenderer.getRenderer();
    const renderWindow = fullScreenRenderer.getRenderWindow();

    const onReady = (sceneImporter: any) => {
      sceneImporter.onReady(() => {
        renderer.resetCamera();
        renderWindow.render();
        setIsLoading(false);
      });
    };

    // @ts-ignore
    HttpDataAccessHelper.fetchBinary(url, {})
      .then((zipContent: any) => {
        const dataAccessHelper = DataAccessHelper.get("zip", {
          zipContent,
          callback: () => {
            const sceneImporter = vtkHttpSceneLoader.newInstance({
              // @ts-ignore
              renderer,
              dataAccessHelper,
            });
            sceneImporter.setUrl("index.json");
            onReady(sceneImporter);
          },
        });
      })
      .catch(() => {
        setIsLoading(false);
      });
  }

  function handleGetDisplacements() {
    renderModel(`${lsaServerAPI}/results/disp/${lsa.result}`);
  }

  function handleGetGeometry() {
    renderModel(`${lsaServerAPI}/results/geo/${lsa.result}`);
  }

  function handleGetStress() {
    renderModel(`${lsaServerAPI}/results/stress/${lsa.result}`);
  }

  return (
    <CustomDlg
      zIndex={5}
      isMinimize={true}
      title={"LSA Viewer"}
      body={
        <div className={"d-flex f-column f-grow bg-dark"}>
          <div className="hr" />
          <div className="d-flex label-light bg-dark">
            <Button
              small
              text="Displacements"
              intent="primary"
              // disabled={!lsa.result}
              onClick={handleGetDisplacements}
            />
            <Button
              small
              text="Geometry / Mesh"
              intent="primary"
              // disabled={!lsa.result}
              onClick={handleGetGeometry}
            />
            <Button
              small
              text="Stress"
              intent="primary"
              // disabled={!lsa.result}
              onClick={handleGetStress}
            />
          </div>
          {isLoading ? (
            <>
              <div className="hr" />
              <ProgressBar />
              <div className={"hr"} />
            </>
          ) : null}
          <div className={"p-5 bg-dark"}>
            <div
              ref={vtkContainerRef}
              style={{ height: 480, width: 720, position: "relative" }}
            />
          </div>
        </div>
      }
      onClose={onClose}
    />
  );
}
