import { Button, FormGroup, InputGroup, Tooltip } from "@blueprintjs/core";
import React, { useEffect, useMemo, useState } from "react";
import { Line } from "react-chartjs-2";
import { useSelector } from "react-redux";
import { ApplicationState } from "../../../../store";
import { TMemberStressCheck} from "../../../../store/main/types";
import {
  getCurrentProject,
  getCurrentUI,
  getUnicuesArray,
  importFromCSV,
} from "../../../3d-models/utils";
import { CustomDlg } from "../../../common/CustomDlg";
import { SimpleSelector } from "../../../common/SimpleSelector";
import axios from "axios";
import { secondServerAPI } from "../../../../pages/utils/agent";
import XLSX from "xlsx";
import 'chartjs-plugin-zoom';
import { MemberEndForceUI } from "../../../../store/ui/types";

import { log } from "console";

type Props = {
  onClose: () => any;
};

const baseDataSetParams = {
  backgroundColor: "rgba(0,0,0,0)",
  borderWidth: 1,
  fill: false,
};

const startDataSetParams = {
  ...baseDataSetParams,
  pointStyle: "star",
  borderDash: [5, 5],
};

export function DisplacementComparisonStructure({ onClose }: Props) {
  const [csv, setCSV] = useState<any[]>([]);
  const [openFrame, setOpenFrame] = useState<string>();
  const [model, setModel] = useState<string>();
  const [LC, setLC] = useState<string>();
  const [staadLoad, setStaadLoad] = useState<string>("");
  const [tolerance, setTolerance] = useState<string>("");
  const [staadFile, setStaadFile] = useState<File | undefined>(undefined);

  const [nodeIDS, setNodeIDS] = useState<RowData['nodeIDS'][]>([]);
  const [rxSTAAD, setRxSTAAD] = useState<RowData['rxSTAAD'][]>([]);
  const [rySTAAD, setRySTAAD] = useState<RowData['rySTAAD'][]>([]);
  const [rzSTAAD, setRzSTAAD] = useState<RowData['rzSTAAD'][]>([]);
  const [dxSTAAD, setDxSTAAD] = useState<RowData['dxSTAAD'][]>([]);
  const [dySTAAD, setDySTAAD] = useState<RowData['dySTAAD'][]>([]);
  const [dzSTAAD, setDzSTAAD] = useState<RowData['dzSTAAD'][]>([]);
  const [rxIDS, setRxIDS] = useState<RowData['rxIDS'][]>([]);
  const [ryIDS, setRyIDS] = useState<RowData['ryIDS'][]>([]);
  const [rzIDS, setRzIDS] = useState<RowData['rzIDS'][]>([]);
  const [dxIDS, setDxIDS] = useState<RowData['dxIDS'][]>([]);
  const [dyIDS, setDyIDS] = useState<RowData['dyIDS'][]>([]);
  const [dzIDS, setDzIDS] = useState<RowData['dzIDS'][]>([]);

  const mode = useSelector((state: ApplicationState) => state.main.workMode);
  const ui = useSelector((state: ApplicationState) => getCurrentUI(state));
  const project = useSelector((state: ApplicationState) =>
    getCurrentProject(state)
  );

  useEffect(()=>{{
    if(project){
      setModel(project.name);
    }
  }})

  /*const lines: string[] = useMemo(() => {
    return getUnicuesArray(project?.freePipes?.map((fp) => `${fp.line}`) ?? []);
  }, [project?.freePipes]);*/

  const models: string[] = useMemo(() => {
    return project?.models.map((m) => m.name) ?? [];
  }, [project?.models]);

  /*const lineLC = useMemo(() => {
    const map = new Map<string, string[]>();
    for (const line of lines) {
      const checks = ui?.analysisUI[line]?.nodeDisplacements;
      if (!checks) continue;
      map.set(
        line,
        checks.map((c) => c.LCNumber)
      );
    }
    return map;
  }, [lines]);*/
  const analysis: MemberEndForceUI[] = useMemo(() => {
    if (!ui || !openFrame) return [];
    return ui.analysisUI[openFrame]?.memberEndForces ?? [];
  }, [ui, openFrame]);

  const LCList = useMemo(() => {
    return analysis.reduce((acc: string[], el) => {  
    return !acc.includes(el.LCNumber) ? [...acc, el.LCNumber] : acc;
    }, []);
  }, [analysis]);

  interface RowData {
    nodeIDS: string;    
    dxIDS: string;
    dyIDS: string;
    dzIDS: string;
    rxIDS: string;
    ryIDS: string;
    rzIDS: string;
    nodeSTAAD: string;
    dxSTAAD: string;
    dySTAAD: string;
    dzSTAAD: string;
    rxSTAAD: string;
    rySTAAD: string;
    rzSTAAD: string;
  }

  const nodeSTAAD: RowData['nodeSTAAD'][] = [];


  const modelLC = useMemo(() => {
    const map = new Map<string, string[]>();
    for (const model of models) {
      const checks = ui?.analysisUI[model]?.nodeDisplacements;
      if (!checks) continue;
      map.set(
        model,
        checks.map((c) => c.LCNumber)
      );
    }
    return map;
  }, [models]);

  /*const availableLines = useMemo(() => {
    return [...lineLC.keys()];
  }, [lineLC]);*/

  const availableModels = useMemo(() => {
    return [...modelLC.keys()];
  }, [modelLC]);

  /*const availableLCs = useMemo(() => {
    return lines
      ? [...new Set(lineLC.get(openFrame) ?? [])]
      : model
      ? [...new Set(modelLC.get(model) ?? [])]
      : [];
  }, [lines, model, lineLC, modelLC]);*/

  /*const displs = useMemo(() => {
    if (!ui || !LC) return [];
    const analysis = lines
      ? ui.analysisUI[lines]
      : model
      ? ui.analysisUI[model]
      : undefined;
    if (!analysis) return [];
    return analysis.nodeDisplacements.filter((el) => `${el.LCNumber}` === LC);
  }, [ui?.analysisUI, lines, model, LC]);*/

  /*const options = useMemo(() => {
    return { responsive: true, legend: { position: "right" } };
  }, []);*/


  const options1 = useMemo(() => {
    return {
      responsive: true,
      grid: {
        drawBorder: true,
        drawOnChartArea: false,
        drawTicks: true,
      },
      legend: {
        labels: {
            fontColor: 'black',
            fontSize: 18,
        }
      },
      plugins: {
        zoom: {
          pan: {
            enabled: true,
            mode: 'xy',
            speed: 0.5,
          },
          zoom: {
            wheel: {
              enabled: true,
            },
            drag: {
              enabled: true,
            },
            mode: 'xy',
          },
        },
        
      },
      scales: {
        xAxes: [{
          scaleLabel: {
            display: true,
            labelString: 'Node No.'
          }
        }],
        yAxes: [{
          scaleLabel: {
            display: true,
            labelString: '[mm]'
          }
        }],
        x: { 
          grid: {
            drawBorder: true,
            drawOnChartArea: true, 
            drawTicks: true,
            color: function(context : any) {
              if (context.tick && context.tick.major) {
                return '#FF0000'; 
              }
              return '#E0E0E0'; 
            }
          }
        },
        y: { 
          grid: {
            drawBorder: true,
            drawOnChartArea: true, 
            drawTicks: true,
            color: '#E0E0E0', 
          }
        },
      },
    };
  }, []);

  const options2 = useMemo(() => {
    return {
      responsive: true,
      grid: {
        drawBorder: true,
        drawOnChartArea: false,
        drawTicks: true,
      },
      legend: {
        labels: {
            fontColor: 'black',
            fontSize: 18,
        }
      },
      plugins: {
        zoom: {
          pan: {
            enabled: true,
            mode: 'xy',
            speed: 0.5,
          },
          zoom: {
            wheel: {
              enabled: true,
            },
            drag: {
              enabled: true,
            },
            mode: 'xy',
          },
        },
        
      },
      scales: {
        xAxes: [{
          scaleLabel: {
            display: true,
            labelString: 'Node No.'
          }
        }],
        yAxes: [{
          scaleLabel: {
            display: true,
            labelString: '[rad]'
          }
        }],
        x: { 
          grid: {
            drawBorder: true,
            drawOnChartArea: true, 
            drawTicks: true,
            color: function(context : any) {
              if (context.tick && context.tick.major) {
                return '#FF0000'; 
              }
              return '#E0E0E0'; 
            }
          }
        },
        y: { 
          grid: {
            drawBorder: true,
            drawOnChartArea: true, 
            drawTicks: true,
            color: '#E0E0E0', 
          }
        },
      },
    };
  }, []);
  
  
  const labels = useMemo(() => {
    return nodeIDS; 
  }, [nodeIDS]);

  const dataA = useMemo(() => {
    const dataX: number[] = dxIDS.map((value) => parseFloat(value));
    const dataY: number[] = dyIDS.map((value) => parseFloat(value));
    const dataZ: number[] = dzIDS.map((value) => parseFloat(value));
    const data_2X: number[] = dxSTAAD.map((value) => parseFloat(value));
    const data_2Y: number[] = dySTAAD.map((value) => parseFloat(value));
    const data_2Z: number[] = dzSTAAD.map((value) => parseFloat(value));

    return {
      labels,
      datasets: [
        {
          ...baseDataSetParams,
          label: "DX IDS",
          data: dataX,
          borderColor: "blue",
          borderWidth: 2,
        },
        {
          ...startDataSetParams,
          label: "DX STAAD",
          data: data_2X,
          borderColor: "rgba(0,0,255,0.5)",
          borderWidth: 4,
        },
        {
          ...baseDataSetParams,
          label: "DY IDS",
          data: dataY,
          borderColor: "green",
          borderWidth: 2,
        },
        {
          ...startDataSetParams,
          label: "DY STAAD",
          data: data_2Y,
          borderColor: "rgba(0,255,0,0.5)",
          borderWidth: 4,
        },
        {
          ...baseDataSetParams,
          label: "DZ IDS",
          data: dataZ,
          borderColor: "red",
          borderWidth: 2,
        },
        {
          ...startDataSetParams,
          label: "DZ STAAD",
          data: data_2Z,
          borderColor: "rgba(255,0,0,0.5)",
          borderWidth: 4,
        },
      ],
    };
  }, [labels, dxSTAAD, dySTAAD, dzSTAAD, dxIDS, dyIDS, dzIDS]);

  const dataB = useMemo(() => {
    const dataX: number[] = rxIDS.map((value) => parseFloat(value));
    const data_2X: number[] = rxSTAAD.map((value) => parseFloat(value));
    const dataY:number[]= ryIDS.map((value) => parseFloat(value));
    const data_2y:number[]= rySTAAD.map((value) => parseFloat(value));
    const dataZ: number[] = rzIDS.map((value) => parseFloat(value));
    const data_2z: number[] = rzSTAAD.map((value) => parseFloat(value));
    return {
      labels,
      datasets: [
        {
          ...baseDataSetParams,
          label: "RX IDS",
          data: dataX,
          borderColor: "blue",
          borderWidth: 2,
        },
        {
          ...startDataSetParams,
          label: "RX STAAD",
          data: data_2X,
          borderColor: "rgba(0,0,255,0.5)",
          borderWidth: 4,
        },
        {
          ...baseDataSetParams,
          label: "RY IDS",
          data: dataY,
          borderColor: "green",
          borderWidth: 2,
        },
        {
          ...startDataSetParams,
          label: "RY STAAD",
          data: data_2y,
          borderColor: "rgba(0,255,0,0.5)",
          borderWidth: 4,
        },
        {
          ...baseDataSetParams,
          label: "RZ IDS",
          data: dataZ,
          borderColor: "red",
          borderWidth: 2,
        },
        {
          ...startDataSetParams,
          label: "RZ STAAD",
          data: data_2z,
          borderColor: "rgba(255,0,0,0.5)",
          borderWidth: 4,
        },
      ],
    };
  }, [labels,rxSTAAD,rySTAAD,rzSTAAD,rzIDS,rxIDS,ryIDS]);

  function handleUpload(event: React.ChangeEvent<HTMLInputElement>) {
    if (event.target.files && event.target.files[0]) {
      setStaadFile(event.target.files[0]);
    }
  }

  const handleApiCall = async () => {
    if (!staadFile) {
      alert("Please select a STAAD file");
      return;
    }
    const openframeN = openFrame?.slice(2);
    const formData = new FormData();
    formData.append("staadFile", staadFile);
    formData.append("tolerance", tolerance);
    const modelname = model ? 'admin' + model : '';
    formData.append("idsFileName", modelname);
    formData.append("idsLoad", LC ?? "");
    formData.append("staadLoad", staadLoad);
    formData.append("idsOpenFrame", openframeN ?? "");
    try {
      const res = await axios.post(
        `${secondServerAPI}/api/v1/validatestd`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
          responseType: 'blob'
        }
      );
      const arrayBuffer = await new Response(res.data).arrayBuffer();
      const workbook = XLSX.read(arrayBuffer, { type: "buffer" });
      console.log('Workbook has been read.');
      let targetSheet;
      for (const sheetName of workbook.SheetNames) {
        const worksheet = workbook.Sheets[sheetName];
        const jsonSheet = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
        const dispPipeCheckIndex = (jsonSheet as string[][]).findIndex(
          (row: string[]) => row.some((cell: string) => cell === 'Displacements Check')
        );
        if (dispPipeCheckIndex !== -1) {
          console.log(`"disp pipe check" found in sheet: ${sheetName}`);
          targetSheet = {
            name: sheetName,
            data: jsonSheet.slice(dispPipeCheckIndex + 1), 
          };
          break;
        }
      }
      if (!targetSheet) {
        console.log('The "disp pipe check" section could not be found in any sheet.');
        alert('The "disp pipe check" section could not be found in any sheet.');
        return;
      }
      const tempnodeIDS: string[] = [];
      const tempRxSTAAD: string[] = [];
      const tempRySTAAD: string[] = [];
      const tempRzSTAAD: string[] = [];
      const tempDxSTAAD: string[] = [];
      const tempDySTAAD: string[] = [];
      const tempDzSTAAD: string[] = [];
      const tempRxIDS: string[] = [];
      const tempRyIDS: string[] = [];
      const tempRzIDS: string[] = [];
      const tempDxIDS: string[] = [];
      const tempDyIDS: string[] = [];
      const tempDzIDS: string[] = [];
      const dispPipeCheckData = [];
      for (const row of targetSheet.data.slice(1) as string[][]) {
        if (row.every((cell: string) => cell === null || cell === '')) {
          console.log('Empty row encountered, ending data extraction.');
          break;
        }
        dispPipeCheckData.push(row);
      }

      dispPipeCheckData.forEach(row => {
        /*nodeIDS.push(row[0]);*/
        tempnodeIDS.push(row[0]);
        tempDxIDS.push(row[1]);
        tempDyIDS.push(row[2]);
        tempDzIDS.push(row[3]);
        tempRxIDS.push(row[4]);
        tempRyIDS.push(row[5]);
        tempRzIDS.push(row[6]);
        nodeSTAAD.push(row[7]);
        tempDxSTAAD.push(row[8]);
        tempDySTAAD.push(row[9]);
        tempDzSTAAD.push(row[10]);
        tempRxSTAAD.push(row[11]);
        tempRySTAAD.push(row[12]);
        tempRzSTAAD.push(row[13]);
      });

      setNodeIDS(tempnodeIDS);
      setRxSTAAD(tempRxSTAAD);
      setRySTAAD(tempRySTAAD);
      setRzSTAAD(tempRzSTAAD);
      setDxSTAAD(tempDxSTAAD);
      setDySTAAD(tempDySTAAD);
      setDzSTAAD(tempDzSTAAD);
      setRxIDS(tempRxIDS);
      setRyIDS(tempRyIDS);
      setRzIDS(tempRzIDS);
      setDxIDS(tempDxIDS);
      setDyIDS(tempDyIDS);
      setDzIDS(tempDzIDS);
      

      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", "response.xlsx");
      document.body.appendChild(link);
      link.click();
      link.remove();
  
      console.log('File download initiated.');
    } catch (err) {
      console.error('An error occurred:', err);
      alert('Failed to fetch data');
    }
  };
  

  

  return (
    <CustomDlg
      zIndex={10}
      isMinimize={true}
      position={"center"}
      title={"Displacement Comparisons Structure"}
      body={
        <div className={"d-flex f-column f-grow bg-dark"}>
          <div className="d-flex label-light bg-dark f-ai-center">
          <Tooltip
            content="Excel file that is being uploaded should contain the following:
            - Load Case Report
            - Input Echo
            - Stresses Extended
            - Global Element Forces
            - Restraints
            - Displacements" >
            <Button
              small
              intent={"danger"}
              text={"Upload STAAD File"}
              onClick={() => document.getElementById('fileInput')?.click()}
            />
            </Tooltip>
            <input
              type="file"
              id="fileInput"
              style={{ display: 'none' }}
              onChange={handleUpload}
            />
            <Button
              small
              intent={"primary"}
              text={"Validate"}
              onClick={handleApiCall}
            />
              <div className="d-flex f-ai-center">
                <div className="label-light t-end w-90">Open Frame</div>
                <FormGroup className="no-m w-100">
                  <SimpleSelector<string>
                    items={availableModels}
                    selected={openFrame}
                    onSelect={setOpenFrame}
                    itemLabel={(v) => v}
                    className="fill-select"
                  />
                </FormGroup>
                <div className="label-light t-end w-90">STAAD Load</div>
                <InputGroup className="no-m w-100"
                  type="text"
                  value={staadLoad}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setStaadLoad(e.target.value)}
                />
                <div className="label-light t-end w-90">Tolerance</div>
                <InputGroup className="no-m w-100"
                  type = "text"
                  value = {tolerance}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTolerance(e.target.value)}
                />
              </div>
            <div className="d-flex f-ai-center">
              <div className="label-light t-end w-90">LC No.</div>
              <FormGroup className="no-m w-100">
                <SimpleSelector<string>
                  items={LCList}
                  selected={LC}
                  onSelect={setLC}
                  itemLabel={(v) => v}
                  className="fill-select"
                />
              </FormGroup>
            </div>
          </div>
          <div className={"d-flex f-grow f-column"}>
            <div className="p-5">
              <div
                style={{
                  position: "relative",
                  overflow: "hidden",
                  background: "#dddddd",
                  minHeight: 200,
                  maxHeight: 500,
                  minWidth: 900,
                  maxWidth: "calc(100vw + 0px)",
                  marginBottom: 10,
                }}
              >
                <Line options={options1} data={dataA} />
              </div>
            </div>
            <div className="p-5">
              <div
                className="p-5"
                style={{
                  position: "relative",
                  overflow: "hidden",
                  background: "#dddddd",
                  minHeight: 200,
                  maxHeight: 500,
                  minWidth: 900,
                  maxWidth: "calc(100vw + 0px)",
                }}
              >
                <Line options={options2} data={dataB} />
              </div>
            </div>
          </div>
        </div>
      }
      onClose={onClose}
    />
  );
}
