import { Button, FormGroup, InputGroup,Tooltip } from "@blueprintjs/core";
import React, { useMemo, useState, useEffect } from "react";
import { Line } from "react-chartjs-2";
import { useSelector } from "react-redux";
import { ApplicationState } from "../../../../store";
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

export function ReactionsComparisons({ onClose }: Props) {
  const [csv, setCSV] = useState<any[]>([]);
  const [line, setLine] = useState<string>();
  const [model, setModel] = useState<string>();
  const [LC, setLC] = useState<string>();
  const [caesorLoad, setCaesorLoad] = useState<string>("");
  const [tolerance, setTolerance] = useState<string>("");
  const [caesorFile, setCaesorFile] = useState<File | undefined>(undefined);

  const [nodeIDS, setNodeIDS] = useState<RowData['nodeIDS'][]>([]);
  const [fxCII, setFxCII] = useState<RowData['fxCII'][]>([]);
  const [fyCII, setFyCII] = useState<RowData['fyCII'][]>([]);
  const [fzCII, setFzCII] = useState<RowData['fzCII'][]>([]);
  const [mxCII, setMxCII] = useState<RowData['mxCII'][]>([]);
  const [myCII, setMyCII] = useState<RowData['myCII'][]>([]);
  const [mzCII, setMzCII] = useState<RowData['mzCII'][]>([]);
  const [fxIDS, setFxIDS] = useState<RowData['fxIDS'][]>([]);
  const [fyIDS, setFyIDS] = useState<RowData['fyIDS'][]>([]);
  const [fzIDS, setFzIDS] = useState<RowData['fzIDS'][]>([]);
  const [mxIDS, setMxIDS] = useState<RowData['mxIDS'][]>([]);
  const [myIDS, setMyIDS] = useState<RowData['myIDS'][]>([]);
  const [mzIDS, setMzIDS] = useState<RowData['mzIDS'][]>([]);

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
      const checks = ui?.analysisUI[line]?.reactionSupports;
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
    fxIDS: string;
    fyIDS: string;
    fzIDS: string;
    mxIDS: string;
    myIDS: string;
    mzIDS: string;
    nodeCII: string;
    fxCII: string;
    fyCII: string;
    fzCII: string;
    mxCII: string;
    myCII: string;
    mzCII: string;
  }

  const nodeCII: RowData['nodeCII'][] = [];

  const modelLC = useMemo(() => {
    const map = new Map<string, string[]>();
    for (const model of models) {
      const checks = ui?.analysisUI[model]?.reactionSupports;
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

  const options1 = {
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
          labelString: '[N]'
        }
      }],
      y: {
        beginAtZero: true
      },
      display:{
        Boolean: false,
      },
    },
    animation : {
      duration : 8000,
    },
    legend: {
      labels: {
        fontColor: 'rgba(0, 0, 0, 1)',
        fontSize: 18,
      }
    },
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: 'Pipe Lines MTO'
      },
      zoom: {
        pan: {
          enabled: true,
          mode: 'xy',
          speed: 0.1,
        },
        zoom: {
          enabled: true,
          wheel : {
            enabled: true,
          },
          drag: {
                borderColor: 'rgba(225,225,225,0.3)',
                borderWidth: 5,
                backgroundColor: 'rgb(225,225,225)',
                animationDuration: 0
          },
          mode: 'x',
          speed: 0.2,
          threshold: 2,
          sensitivity: 1,
      } 
      }
  }
  };

  const options2 = {
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
          labelString: '[N*m]'
        }
      }],
      y: {
        beginAtZero: true
      },
      display:{
        Boolean: false,
      },
    },
    animation : {
      duration : 8000,
    },
    legend: {
      labels: {
        fontColor: 'rgba(0, 0, 0, 1)',
        fontSize: 18,
      }
    },
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: 'Pipe Lines MTO'
      },
      zoom: {
        pan: {
          enabled: true,
          mode: 'xy',
          speed: 0.1,
        },
        zoom: {
          enabled: true,
          wheel : {
            enabled: true,
          },
          drag: {
                borderColor: 'rgba(225,225,225,0.3)',
                borderWidth: 5,
                backgroundColor: 'rgb(225,225,225)',
                animationDuration: 0
          },
          mode: 'x',
          speed: 0.2,
          threshold: 2,
          sensitivity: 1,
      } 
      }
  }
  };

  const labels = useMemo(() => {
    return nodeIDS; 
  }, [nodeIDS]);

  const dataA = useMemo(() => {
    const dataX: number[] = fxIDS.map((value) => parseFloat(value));
    const dataY: number[] = fyIDS.map((value) => parseFloat(value));
    const dataZ: number[] = fzIDS.map((value) => parseFloat(value));
    const data_2X: number[] = fxCII.map((value) => parseFloat(value));
    const data_2Y: number[] = fyCII.map((value) => parseFloat(value));
    const data_2Z: number[] = fzCII.map((value) => parseFloat(value));
    return {
      labels,
      datasets: [
        {
          ...baseDataSetParams,
          label: "FX IDS",
          data: dataX,
          borderColor: "blue",
          borderWidth: 2,
        },
        {
          ...startDataSetParams,
          label: "FX CII",
          data: data_2X,
          borderColor: "rgba(0,0,255,0.5)",
          borderWidth: 4,
        },
        {
          ...baseDataSetParams,
          label: "FY IDS",
          data: dataY,
          borderColor: "green",
          borderWidth: 2
        },
        {
          ...startDataSetParams,
          label: "FY CII",
          data: data_2Y,
          borderColor: "rgba(0,255,0,0.5)",
          borderWidth: 2,
        },
        {
          ...baseDataSetParams,
          label: "FZ IDS",
          data: dataZ,
          borderColor: "red",
          borderWidth: 2,
        },
        {
          ...startDataSetParams,
          label: "FZ CII",
          data: data_2Z,
          borderColor: "rgba(255,0,0,0.5)",
          borderWidth: 4,
        },
      ],
    };
  }, [labels, fxIDS, fyIDS, fzIDS, fxCII, fyCII, fzCII]);

  const dataB = useMemo(() => {
    const dataX: number[] = mxIDS.map((value) => parseFloat(value));
    const data_2X: number[] = mxCII.map((value) => parseFloat(value));
    const dataY:number[]= myIDS.map((value) => parseFloat(value));
    const data_2Y:number[]= myCII.map((value) => parseFloat(value));
    const dataZ: number[] = mzIDS.map((value) => parseFloat(value));
    const data_2Z: number[] = mzCII.map((value) => parseFloat(value));
    return {
      labels,
      datasets: [
        {
          ...baseDataSetParams,
          label: "MX IDS",
          data: dataX,
          borderColor: "blue",
          borderWidth: 2,
        },
        {
          ...startDataSetParams,
          label: "MX CII",
          data: data_2X,
          borderColor: "rgba(0,0,255,0.5)",
          borderWidth: 4,
        },
        {
          ...baseDataSetParams,
          label: "MY IDS",
          data: dataY,
          borderColor: "green",
          borderWidth: 2,
        },
        {
          ...startDataSetParams,
          label: "MY CII",
          data: data_2Y,
          borderColor: "rgba(0,255,0,0.5)",
          borderWidth: 4,
        },
        {
          ...baseDataSetParams,
          label: "MZ IDS",
          data: dataZ,
          borderColor: "red",
          borderWidth: 2,
        },
        {
          ...startDataSetParams,
          label: "MZ CII",
          data: data_2Z,
          borderColor: "rgba(255,0,0,0.5)",
          borderWidth: 4,
        },
      ],
    };
  }, [labels, mxIDS, mxCII, myIDS, myCII, mzIDS, mzCII]);

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
      console.log('API call successful. Response received.');
      const arrayBuffer = await new Response(res.data).arrayBuffer();
      const workbook = XLSX.read(arrayBuffer, { type: "buffer" });
      console.log('Workbook has been read.');
      let targetSheet;
      for (const sheetName of workbook.SheetNames) {
        const worksheet = workbook.Sheets[sheetName];
        const jsonSheet = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
        const dispPipeCheckIndex = (jsonSheet as string[][]).findIndex(
          (row: string[]) => row.some((cell: string) => cell === 'reactions restrains check')
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
        console.log('The "reactions restrains check" section could not be found in any sheet.');
        alert('The "reactions restrains check" section could not be found in any sheet.');
        return;
      }
      const tempnodeIDS: string[] = [];
      const tempMxCII: string[] = [];
      const tempMyCII: string[] = [];
      const tempMzCII: string[] = [];
      const tempFxCII: string[] = [];
      const tempFyCII: string[] = [];
      const tempFzCII: string[] = [];
      const tempMxIDS: string[] = [];
      const tempMyIDS: string[] = [];
      const tempMzIDS: string[] = [];
      const tempFxIDS: string[] = [];
      const tempFyIDS: string[] = [];
      const tempFzIDS: string[] = [];
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
        tempFxIDS.push(row[1]);
        tempFyIDS.push(row[2]);
        tempFzIDS.push(row[3]);
        tempMxIDS.push(row[4]);
        tempMyIDS.push(row[5]);
        tempMzIDS.push(row[6]);
        nodeCII.push(row[7]);
        tempFxCII.push(row[8]);
        tempFyCII.push(row[9]);
        tempFzCII.push(row[10]);
        tempMxCII.push(row[11]);
        tempMyCII.push(row[12]);
        tempMzCII.push(row[13]);
      });

      setNodeIDS(tempnodeIDS);
      setMxCII(tempMxCII);
      setMyCII(tempMyCII);
      setMzCII(tempMzCII);
      setFxCII(tempFxCII);
      setFyCII(tempFyCII);
      setFzCII(tempFzCII);
      setMxIDS(tempMxIDS);
      setMyIDS(tempMyIDS);
      setMzIDS(tempMzIDS);
      setFxIDS(tempFxIDS);
      setFyIDS(tempFyIDS);
      setFzIDS(tempFzIDS);
      

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
      title={"Reactions Comparisons"}
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
