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
import { MemberEndForceUI } from "../../../../store/ui/types";

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

export function ReactionsComparisonStructure({ onClose }: Props) {
  const [csv, setCSV] = useState<any[]>([]);
  const [openFrame, setOpenFrame] = useState<string>();
  const [model, setModel] = useState<string>();
  const [LC, setLC] = useState<string>();
  const [staadLoad, setStaadLoad] = useState<string>("");
  const [tolerance, setTolerance] = useState<string>("");
  const [staadFile, setStaadFile] = useState<File | undefined>(undefined);

  const [nodeIDS, setNodeIDS] = useState<RowData['nodeIDS'][]>([]);
  const [fxSTAAD, setFxSTAAD] = useState<RowData['fxSTAAD'][]>([]);
  const [fySTAAD, setFySTAAD] = useState<RowData['fySTAAD'][]>([]);
  const [fzSTAAD, setFzSTAAD] = useState<RowData['fzSTAAD'][]>([]);
  const [mxSTAAD, setMxSTAAD] = useState<RowData['mxSTAAD'][]>([]);
  const [mySTAAD, setMySTAAD] = useState<RowData['mySTAAD'][]>([]);
  const [mzSTAAD, setMzSTAAD] = useState<RowData['mzSTAAD'][]>([]);
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

  /*const lines: string[] = useMemo(() => {
    return getUnicuesArray(project?.freePipes?.map((fp) => `${fp.line}`) ?? []);
  }, [project?.freePipes]);*/

  const models: string[] = useMemo(() => {
    return project?.models.map((m) => m.name) ?? [];
  }, [project?.models]);

  /*const lineLC = useMemo(() => {
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
    fxIDS: string;
    fyIDS: string;
    fzIDS: string;
    mxIDS: string;
    myIDS: string;
    mzIDS: string;
    nodeSTAAD: string;
    fxSTAAD: string;
    fySTAAD: string;
    fzSTAAD: string;
    mxSTAAD: string;
    mySTAAD: string;
    mzSTAAD: string;
  }

  const nodeSTAAD: RowData['nodeSTAAD'][] = [];

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

  /*const availableLines = useMemo(() => {
    return [...lineLC.keys()];
  }, [lineLC]);*/

  const availableModels = useMemo(() => {
    return [...modelLC.keys()];
  }, [modelLC]);

//   const availableLCs = useMemo(() => {
//     return line
//       ? [...new Set(lineLC.get(line) ?? [])]
//       : model
//       ? [...new Set(modelLC.get(model) ?? [])]
//       : [];
//   }, [line, model, lineLC, modelLC]);

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
    const data_2X: number[] = fxSTAAD.map((value) => parseFloat(value));
    const data_2Y: number[] = fySTAAD.map((value) => parseFloat(value));
    const data_2Z: number[] = fzSTAAD.map((value) => parseFloat(value));
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
          label: "FX STAAD",
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
          label: "FY STAAD",
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
          label: "FZ STAAD",
          data: data_2Z,
          borderColor: "rgba(255,0,0,0.5)",
          borderWidth: 4,
        },
      ],
    };
  }, [labels, fxIDS, fyIDS, fzIDS, fxSTAAD, fySTAAD, fzSTAAD]);

  const dataB = useMemo(() => {
    const dataX: number[] = mxIDS.map((value) => parseFloat(value));
    const data_2X: number[] = mxSTAAD.map((value) => parseFloat(value));
    const dataY:number[]= myIDS.map((value) => parseFloat(value));
    const data_2Y:number[]= mySTAAD.map((value) => parseFloat(value));
    const dataZ: number[] = mzIDS.map((value) => parseFloat(value));
    const data_2Z: number[] = mzSTAAD.map((value) => parseFloat(value));
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
          label: "MX STAAD",
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
          label: "MY STAAD",
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
          label: "MZ STAAD",
          data: data_2Z,
          borderColor: "rgba(255,0,0,0.5)",
          borderWidth: 4,
        },
      ],
    };
  }, [labels, mxIDS, mxSTAAD, myIDS, mySTAAD, mzIDS, mzSTAAD]);

  function handleUpload(event: React.ChangeEvent<HTMLInputElement>) {
    if (event.target.files && event.target.files[0]) {
      setStaadFile(event.target.files[0]);
    }
  }

  const handleApiCall = async () => {
    if (!staadFile) {
      alert("Please select a CAESOR file");
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
      const tempMxSTAAD: string[] = [];
      const tempMySTAAD: string[] = [];
      const tempMzSTAAD: string[] = [];
      const tempFxSTAAD: string[] = [];
      const tempFySTAAD: string[] = [];
      const tempFzSTAAD: string[] = [];
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
        nodeSTAAD.push(row[7]);
        tempFxSTAAD.push(row[8]);
        tempFySTAAD.push(row[9]);
        tempFzSTAAD.push(row[10]);
        tempMxSTAAD.push(row[11]);
        tempMySTAAD.push(row[12]);
        tempMzSTAAD.push(row[13]);
      });

      setNodeIDS(tempnodeIDS);
      setMxSTAAD(tempMxSTAAD);
      setMySTAAD(tempMySTAAD);
      setMzSTAAD(tempMzSTAAD);
      setFxSTAAD(tempFxSTAAD);
      setFySTAAD(tempFySTAAD);
      setFzSTAAD(tempFzSTAAD);
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
              text={"Upload Staad File"}
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
                <div className="label-light t-end w-90">Staad Load</div>
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
