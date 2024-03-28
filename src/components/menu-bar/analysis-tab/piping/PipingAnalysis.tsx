import React from "react";
import { Dispatch } from "redux";
import { Scene } from "three";
import { Menu } from "@blueprintjs/core";
import { FreePipe, Project } from "../../../../store/main/types";
import {
  getAndMapPipeAnalysis,
  jsonOptions,
  getAndMapPipeWeights,
  getAndMapPipeAnalysisAll,
} from "../../../../store/main/actions";
import { addEventAction } from "../../../../store/ui/actions";
import { baseUrl } from "../../../../store/main/constants";
import { getPipeAnalysisJSON } from "../../../3d-models/freePipes";
import Axios from "axios";
import { ReportDlgPP } from "./reports/ReportsDlg";
import { PipeMTO } from "./various-material-take-of/PipeMTO";
import { AccessoryMTO } from "./various-material-take-of/AccessoryMTO";
import { InsulationMTO } from "./various-material-take-of/InsulationMTO";
import { PipeDesignCode } from "./PipeDesignCode";
import { LoadsToStructure } from "./LoadsToStructure";
import { TPipeLoadCombination } from "../../../../store/main/pipeTypes";
import saveAs from "file-saver";
import { DisplacementComparison } from "../comparisons/DisplacementComparison";
import { ReactionsComparisons } from "../comparisons/ReactionsComparisons";
import { ForcesComparisons } from "../comparisons/ForcesComparisons";

type Props = {
  dispatch: Dispatch;
  scene: Scene;
  project?: Project;
  disabled?: boolean;
  reportsProgress?: boolean;
  drawBtn: (
    key: string | number,
    txt: string,
    disabled?: boolean,
    loading?: boolean,
    onClick?: () => any
  ) => JSX.Element;
  drawMenuItem: (
    key: string | number,
    txt: string,
    disabled?: boolean,
    onClick?: () => any,
    content?: JSX.Element | JSX.Element[]
  ) => JSX.Element;
  drawPopower: (
    content: JSX.Element | JSX.Element[],
    target: JSX.Element,
    isDisabled?: boolean
  ) => JSX.Element;
  setDlg: (dlg?: JSX.Element) => any;
  onClose: () => any;
};

export function PipingAnalysis(props: Props) {
  const {
    scene,
    project,
    drawBtn,
    drawMenuItem,
    drawPopower,
    setDlg,
    onClose,
    dispatch,
    reportsProgress,
    disabled,
  } = props;
// Revised function to get 10 report document of piping analysis in one go
  async function downloadPipePDFAll(
    project: Project,
    pipeArs: FreePipe[][],
    lcs: TPipeLoadCombination[],
  ){
    const jsons: any[] = [];
    for (const pipes of pipeArs){
      const json = getPipeAnalysisJSON(project, pipes, lcs, scene);
      jsons.push(json.json);
    }
    let url = `${baseUrl}api/v2/piping/IS875/singleReport`;
    switch(project.pipeLoadings?.windLoad.windLoadingAsPerCode){
      case "IS Code":
        url = `${baseUrl}api/v2/piping/IS875/singleReport`;
        break;
      case "US Code":
        url = `${baseUrl}api/v2/piping/asce710/singleReport`;
        break;
      case "Manual":
        url = `${baseUrl}api/v2/piping/manual/singleReport`;
    }

    function chunkArray(array: any[], size: number): any[][] {
      const chunkedArray: any[][] = [];
      let index = 0;
      while (index < array.length) {
        chunkedArray.push(array.slice(index, index + size));
        index += size;
      }
      return chunkedArray;
    }
    const lineBatches = chunkArray(jsons, 10);
    for (const batch of lineBatches){
      try {
        const response = await Axios.post(url, JSON.stringify(batch),{
          ...jsonOptions,
          responseType:"arraybuffer",
        }).then((response)=>{
          const file= new Blob(
            [response.data],
            {type: 'application/pdf'}
          );
          /*const fileURL = URL.createObjectURL(file);
          const fileLink = document.createElement('a');
          fileLink.href = fileURL;
          fileLink.setAttribute('download', 'Pipe_Report.zip');
          const blength = batch.length;
          /*fileLink.setAttribute('download', 'Pipe Analysis report of pipe No. `${batch[0].lineNo} to ${batch[9].lineNo}.zip')*//*
          document.body.appendChild(fileLink);
          fileLink.click();
          document.body.removeChild(fileLink);
          URL.revokeObjectURL(fileURL);*/
          const url = window.URL.createObjectURL(file);
          const link = document.createElement('a');
          link.href = url;
          link.setAttribute('download', `Pipe Analysis report of pipe No. ${jsons[0].lineNo}.pdf`);
          document.body.appendChild(link);
          link.click();
        })
      } catch (error) {
        dispatch(
          addEventAction(
            `Design Report: ${
              (error as any).message
            }`,
            "danger"
          )
        );
      }
    }

  }

  async function downloadPipePDF(
    project: Project,
    pipeArs: FreePipe[][],
    lcs: TPipeLoadCombination[]
  ) {
    const jsons: any[] = [];
    for (const pipes of pipeArs) {
      const json = getPipeAnalysisJSON(project, pipes, lcs, scene);
      jsons.push(json.json);
    }
    let url = `${baseUrl}api/v2/piping/IS875/reportAll`;
    switch (project.pipeLoadings?.windLoad.windLoadingAsPerCode) {
      case "IS Code":
        url = `${baseUrl}api/v2/piping/IS875/reportAll`;
        break;
      case "US Code":
        url = `${baseUrl}api/v2/piping/asce710/reportAll`;
        break;
      case "Manual":
        url = `${baseUrl}api/v2/piping/manual/reportAll`;
    }
      try {
        console.log(jsons);
        const response = await Axios.post(url, JSON.stringify(jsons),{
          ...jsonOptions,
          responseType:"blob",
        }).then((response)=>{
          const file= new Blob(
            [response.data],
            {type: 'application/pdf'}
          );
          /*const fileURL = URL.createObjectURL(file);
          const fileLink = document.createElement('a');
          fileLink.href = fileURL;
          /*fileLink.setAttribute('download', 'Pipe_Report.zip');*/
          /*fileLink.setAttribute('download', `Pipe Analysis report of pipe No. ${jsons[0].lineNo}`)
          document.body.appendChild(fileLink);
          fileLink.click();
          document.body.removeChild(fileLink);
          URL.revokeObjectURL(fileURL);*/
          const url = window.URL.createObjectURL(file);
          const link = document.createElement('a');
          link.href = url;
          link.setAttribute('download', `Pipe Analysis report of pipe No. ${jsons[0].lineNo}`);
          document.body.appendChild(link);
          link.click();
        })
      } catch (error) {
        dispatch(
          addEventAction(
            `Design Report: ${
              (error as any).message
            }`,
            "danger"
          )
        );
      }
    }
  

  function getPipeAnalysisList(project: Project, map: Map<number, FreePipe[]>) {
    return (
      <Menu style={{ maxHeight: "60vh", overflowY: "auto" }}>
        {drawMenuItem(
          "A-ALL",
          `Get Analysis for All`,
          false,
          () =>
            handleGettingPipeAnalysis(
              project,
              Array.from(map.values()),
              project.pipeLoadings.loadCombinations.loads
            ),
          getAnalysisLoadCombinations(
            project,
            Array.from(map.values()),
            project.pipeLoadings.loadCombinations.loads
          )
        )}
        {Array.from(map.entries()).map(([line, pipes], i) =>
          drawMenuItem(
            `A-JSON-${i}`,
            `Get Analysis for ${line}`,
            false,
            () =>
              handleGettingPipeAnalysis(
                project,
                [pipes],
                project.pipeLoadings.loadCombinations.loads
              ),
            getAnalysisLoadCombinations(
              project,
              [pipes],
              project.pipeLoadings.loadCombinations.loads
            )
          )
        )}
      </Menu>
    );
  }

  function getAnalysisLoadCombinations(
    project: Project,
    pipes: FreePipe[][],
    lcs: TPipeLoadCombination[]
  ) {
    return (
      <Menu style={{ maxHeight: "60vh", overflowY: "auto" }}>
        {lcs.map((lc, i) =>
          drawMenuItem(
            `JSON-LC-${i}`,
            `Get for LC "${lc.LC_No ?? ""}"`,
            false,
            () => handleGettingPipeAnalysis(project, pipes, [lc])
          )
        )}
      </Menu>
    );
  }

  function getPipeDesignReportsList(
    project: Project,
    map: Map<number, FreePipe[]>
  ) {
    return (
      <Menu style={{ maxHeight: "60vh", overflowY: "auto" }}>
        {drawMenuItem(
          "ALL",
          "Get report for All",
          false,
          () =>
            downloadPipePDFAll(
              project,
              Array.from(map.values()),
              project.pipeLoadings.loadCombinations.loads
            ),
          getReportLoadCombinations(
            project,
            Array.from(map.values()),
            project.pipeLoadings.loadCombinations.loads
          )
        )}
        {Array.from(map.entries()).map(([line, pipes], i) =>
          drawMenuItem(
            `JSON-${i}`,
            `Get report for ${line}`,
            false,
            () =>
              downloadPipePDFAll(
                project,
                [pipes],
                project.pipeLoadings.loadCombinations.loads
              ),
            getReportLoadCombinations(
              project,
              [pipes],
              project.pipeLoadings.loadCombinations.loads
            )
          )
        )}
      </Menu>
    );
  }

  function getReportLoadCombinations(
    project: Project,
    pipes: FreePipe[][],
    lcs: TPipeLoadCombination[]
  ) {
    return (
      <Menu style={{ maxHeight: "60vh", overflowY: "auto" }}>
        {lcs.map((lc, i) =>
          drawMenuItem(
            `JSON-LC-${i}`,
            `Get for LC "${lc.LC_No ?? ""}"`,
            false,
            () => downloadPipePDFAll(project, pipes, [lc])
          )
        )}
      </Menu>
    );
  }

  function handleGettingPipeAnalysis(
    project: Project,
    lines: FreePipe[][],
    lcs: TPipeLoadCombination[]
  ) {
    getAndMapPipeAnalysisAll(dispatch, project, scene, lines, lcs);//chnaged to handle all the lines
  }

  function getPipeReportListContent() {
    if (!project) return <></>;
    const map = new Map<number, FreePipe[]>();
    for (const pipe of project.freePipes ?? []) {
      const pipes = map.get(pipe.line);
      map.set(pipe.line, pipes ? [...pipes, pipe] : [pipe]);
    }
    return (
      <Menu>
        {drawMenuItem(
          "a",
          "Analysis",
          false,
          undefined,
          getPipeAnalysisList(project, map)
        )}
        {drawMenuItem(
          "dr",
          "Design Report",
          false,
          undefined,
          getPipeDesignReportsList(project, map)
        )}
        {drawMenuItem("rs", "Reaction Summary", false, () =>
          setDlg(<ReportDlgPP table={1} onClose={onClose} />)
        )}
        {drawMenuItem("mef", "Member End Forces", false, () =>
          setDlg(<ReportDlgPP table={2} onClose={onClose} />)
        )}
        {drawMenuItem("msc", "Member Stress Check", false, () =>
          setDlg(<ReportDlgPP table={3} onClose={onClose} />)
        )}
        {drawMenuItem("nsc", "Nodal Stress Check", false, () =>
          setDlg(<ReportDlgPP table={8} onClose={onClose} />)
        )}
        {drawMenuItem("ptc", "Pipe Thickness Check", false, () =>
          setDlg(<ReportDlgPP table={5} onClose={onClose} />)
        )}
        {drawMenuItem("nd", "Node Displacement", false, () =>
          setDlg(<ReportDlgPP table={4} onClose={onClose} />)
        )}
        {drawMenuItem("fc", "Flange Check", false, () =>
          setDlg(<ReportDlgPP table={6} onClose={onClose} />)
        )}
        {drawMenuItem("sg", "Spring Hanger", false, () =>
          setDlg(<ReportDlgPP table={9} onClose={onClose} />)
        )}
        {drawMenuItem("dc", "Deflection Check", false, () =>
          setDlg(<ReportDlgPP table={7} onClose={onClose} />)
        )}
        {drawMenuItem(
          "vmt",
          "Various Material Take of ",
          false,
          () => handleGettingPipeWeights(project),
          <>
            {drawMenuItem("pmto", "Pipe MTO", false, () =>
              setDlg(<PipeMTO onClose={onClose} />)
            )}
            {drawMenuItem("amto", "Accessory MTO", false, () =>
              setDlg(<AccessoryMTO onClose={onClose} />)
            )}
            {drawMenuItem("imto", "Insulation MTO", false, () =>
              setDlg(<InsulationMTO onClose={onClose} />)
            )}
          </>
        )}
        {drawMenuItem(
          "cmp",
          "Comparisons",
          false,
          undefined,
          <>
            {drawMenuItem("dspl", "Displacement", false, () =>
              setDlg(<DisplacementComparison onClose={onClose} />)
            )}
            {drawMenuItem("rctns", "Reactions", false, () =>
              setDlg(<ReactionsComparisons onClose={onClose} />)
            )}
            {drawMenuItem("frcs", "Forces", false, () =>
              setDlg(<ForcesComparisons onClose={onClose} />)
            )}
          </>
        )}
      </Menu>
    );
  }

  function handleGettingPipeWeights(project?: Project) {
    if (!project) return;
    const map = new Map<number, FreePipe[]>();
    for (const pipe of project.freePipes ?? []) {
      const pipes = map.get(pipe.line);
      map.set(pipe.line, pipes ? [...pipes, pipe] : [pipe]);
    }
    getAndMapPipeWeights(dispatch, project, scene, Array.from(map.values()));
  }

  return drawPopower(
    [
      drawBtn("dcp", "Design Code & Parameters", false, false, () =>
        setDlg(<PipeDesignCode onClose={onClose} />)
      ),
      drawPopower(
        getPipeReportListContent(),
        drawBtn("r", "Reports", false, reportsProgress)
      ),
      drawBtn("lts", "Loads to Structure", false, false, () =>
        setDlg(<LoadsToStructure onClose={onClose} />)
      ),
    ],
    drawBtn("p", "Piping", disabled),
    disabled
  );
}
