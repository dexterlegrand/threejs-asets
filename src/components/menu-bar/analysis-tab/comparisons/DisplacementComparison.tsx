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

export function DisplacementComparison({ onClose }: Props) {
  const [csv, setCSV] = useState<any[]>([]);
  const [line, setLine] = useState<string>();
  const [model, setModel] = useState<string>();
  const [LC, setLC] = useState<string>();
  const [caesorLoad, setCaesorLoad] = useState<string>("");
  const [tolerance, setTolerance] = useState<string>("");
  const [caesorFile, setCaesorFile] = useState<File | undefined>(undefined);

  const [nodeIDS, setNodeIDS] = useState<RowData['nodeIDS'][]>([]);
  const [rxCII, setRxCII] = useState<RowData['rxCII'][]>([]);
  const [ryCII, setRyCII] = useState<RowData['ryCII'][]>([]);
  const [rzCII, setRzCII] = useState<RowData['rzCII'][]>([]);
  const [dxCII, setDxCII] = useState<RowData['dxCII'][]>([]);
  const [dyCII, setDyCII] = useState<RowData['dyCII'][]>([]);
  const [dzCII, setDzCII] = useState<RowData['dzCII'][]>([]);
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

  const lines: string[] = useMemo(() => {
    return getUnicuesArray(project?.freePipes?.map((fp) => `${fp.line}`) ?? []);
  }, [project?.freePipes]);

  const models: string[] = useMemo(() => {
    return project?.models.map((m) => m.name) ?? [];
  }, [project?.models]);

  const lineLC = useMemo(() => {
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
  }, [lines]);

  interface RowData {
    nodeIDS: string;    
    dxIDS: string;
    dyIDS: string;
    dzIDS: string;
    rxIDS: string;
    ryIDS: string;
    rzIDS: string;
    nodeCII: string;
    dxCII: string;
    dyCII: string;
    dzCII: string;
    rxCII: string;
    ryCII: string;
    rzCII: string;
  }

  const nodeCII: RowData['nodeCII'][] = [];


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

  const availableLines = useMemo(() => {
    return [...lineLC.keys()];
  }, [lineLC]);

  const availableModels = useMemo(() => {
    return [...modelLC.keys()];
  }, [modelLC]);

  const availableLCs = useMemo(() => {
    return line
      ? [...new Set(lineLC.get(line) ?? [])]
      : model
      ? [...new Set(modelLC.get(model) ?? [])]
      : [];
  }, [line, model, lineLC, modelLC]);

  const displs = useMemo(() => {
    if (!ui || !LC) return [];
    const analysis = line
      ? ui.analysisUI[line]
      : model
      ? ui.analysisUI[model]
      : undefined;
    if (!analysis) return [];
    return analysis.nodeDisplacements.filter((el) => `${el.LCNumber}` === LC);
  }, [ui?.analysisUI, line, model, LC]);

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
            labelString: '[deg]'
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
    const data_2X: number[] = dxCII.map((value) => parseFloat(value));
    const data_2Y: number[] = dyCII.map((value) => parseFloat(value));
    const data_2Z: number[] = dzCII.map((value) => parseFloat(value));

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
          label: "DX CII",
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
          label: "DY CII",
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
          label: "DZ CII",
          data: data_2Z,
          borderColor: "rgba(255,0,0,0.5)",
          borderWidth: 4,
        },
      ],
    };
  }, [labels, dxCII, dyCII, dzCII, dxIDS, dyIDS, dzIDS]);

  const dataB = useMemo(() => {
    const dataX: number[] = rxIDS.map((value) => parseFloat(value));
    const data_2X: number[] = rxCII.map((value) => parseFloat(value));
    const dataY:number[]= ryIDS.map((value) => parseFloat(value));
    const data_2y:number[]= ryCII.map((value) => parseFloat(value));
    const dataZ: number[] = rzIDS.map((value) => parseFloat(value));
    const data_2z: number[] = rzCII.map((value) => parseFloat(value));
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
          label: "RX CII",
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
          label: "RY CII",
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
          label: "RZ CII",
          data: data_2z,
          borderColor: "rgba(255,0,0,0.5)",
          borderWidth: 4,
        },
      ],
    };
  }, [labels,rxCII,ryCII,rzCII,rzIDS,rxIDS,ryIDS]);

  function handleUpload(event: React.ChangeEvent<HTMLInputElement>) {
    if (event.target.files && event.target.files[0]) {
      setCaesorFile(event.target.files[0]);
    }
  }

  const handleApiCall = async () => {
    if (!caesorFile) {
      alert("Please select a CAESOR file");
      return;
    }
    const formData = new FormData();
    formData.append("caesarFile", caesorFile);
    formData.append("tolerance", tolerance);
    const modelname = model ? 'admin' + model : '';
    formData.append("idsFilename", modelname);
    formData.append("idsLoad", LC ?? "");
    formData.append("caesarLoad", caesorLoad);
    formData.append("idsLine", line ?? "");
    try {
      const res = await axios.post(
        `${secondServerAPI}/api/v1/validate`,
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
          (row: string[]) => row.some((cell: string) => cell === 'disp pipe check')
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
      const tempRxCII: string[] = [];
      const tempRyCII: string[] = [];
      const tempRzCII: string[] = [];
      const tempDxCII: string[] = [];
      const tempDyCII: string[] = [];
      const tempDzCII: string[] = [];
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
        nodeCII.push(row[7]);
        tempDxCII.push(row[8]);
        tempDyCII.push(row[9]);
        tempDzCII.push(row[10]);
        tempRxCII.push(row[11]);
        tempRyCII.push(row[12]);
        tempRzCII.push(row[13]);
      });

      setNodeIDS(tempnodeIDS);
      setRxCII(tempRxCII);
      setRyCII(tempRyCII);
      setRzCII(tempRzCII);
      setDxCII(tempDxCII);
      setDyCII(tempDyCII);
      setDzCII(tempDzCII);
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
      title={"Displacement Comparisons"}
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
              text={"Upload Caesar File"}
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
            {mode === "STRUCTURE" ? (
              <div className="d-flex f-ai-center">
                <div className="label-light t-end w-90">Model</div>
                <FormGroup className="no-m w-100">
                  <SimpleSelector<string>
                    items={availableModels}
                    selected={model}
                    onSelect={setModel}
                    itemLabel={(v) => v}
                    className="fill-select"
                  />
                </FormGroup>
              </div>
            ) : null}
            {mode === "PIPING" ? (
              <div className="d-flex f-ai-center">
                <div className="label-light t-end w-90">Line No.</div>
                <FormGroup className="no-m w-100">
                  <SimpleSelector<string>
                    items={availableLines}
                    selected={line}
                    onSelect={setLine}
                    itemLabel={(v) => v}
                    className="fill-select"
                  />
                </FormGroup>
                <div className="label-light t-end w-90">Caesor Load</div>
                <InputGroup className="no-m w-100"
                  type="text"
                  value={caesorLoad}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCaesorLoad(e.target.value)}
                />
                <div className="label-light t-end w-90">Tolerance</div>
                <InputGroup className="no-m w-100"
                  type = "text"
                  value = {tolerance}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTolerance(e.target.value)}
                />
              </div>
            ) : null}
            <div className="d-flex f-ai-center">
              <div className="label-light t-end w-90">LC No.</div>
              <FormGroup className="no-m w-100">
                <SimpleSelector<string>
                  items={availableLCs}
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
