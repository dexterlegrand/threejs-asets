import { Button } from "@blueprintjs/core";
import React, { useState, useRef } from "react";
import { useSelector } from "react-redux";
import {
  exportToCSV,
  getCurrentProject,
  roundM,
} from "../../components/3d-models/utils";
import { SimpleSelector } from "../../components/common/SimpleSelector";
import { getFlaresMTO } from "../../components/menu-bar/3d-modeling/MTO/flare/FlareSyncMTO";
import { getOpenFramesMTO } from "../../components/menu-bar/3d-modeling/MTO/open-frame/OFSectionsSyncMTO";
import { getPipeRacksMTO } from "../../components/menu-bar/3d-modeling/MTO/pipe-rack/PRSectionsSyncMTO";
import { getPipeAccessoriesSyncMTO } from "../../components/menu-bar/3d-modeling/MTO/pipe/AccessoriesSyncMTO";
import { getPipesSyncMTO } from "../../components/menu-bar/3d-modeling/MTO/pipe/LinesSyncMTO";
import { ApplicationState } from "../../store";
import { TOpenFrame } from "../../store/main/openFrameTypes";
import { PipeRack, Project, TWorkMode, } from "../../store/main/types";
import { TProcess } from "../../store/process/types";
import "./dashboard_css/MTO.css";
import {Bar, Line} from "react-chartjs-2";
import 'chartjs-plugin-zoom';
import { TProcessLine } from "../../store/process/types";
import { getProcessSyncMTO } from "../../components/menu-bar/3d-modeling/MTO/pipe/ProcessLineMTO";
import { getCurrentProcess } from "../../components/3d-models/utils";

type TMTO =
  | "Pipe Lines"
  | "Pipe Accessories"
  | "Flares"
  | "Pipe Racks"
  | "Open Frames"
  | "Factory Sheds";


export default function MTOContainer() {
  const [mto, setMTO] = useState<TMTO>();
  const mode = useSelector((state: ApplicationState) => state.main.workMode);
  const project = useSelector((state: ApplicationState) =>
    getCurrentProject(state)
  );
  const process = useSelector((state: ApplicationState) => 
        getCurrentProcess(state)
    );

  return (
    <>
      <div className="header-container">
        <div className="header-label">MTO Type</div>
        <SimpleSelector<TMTO>
          items={[
            "Pipe Lines",
            "Pipe Accessories",
            "Flares",
            "Pipe Racks",
            "Open Frames",
            "Factory Sheds",
          ]}
          selected={mto}
          onSelect={setMTO}
          clearable={true}
          itemLabel={(item) => item}
          className={"w-200"}
        />
      </div>
      <div className="hr" />
      {/*{getMTOTable(project, mto)}*/}
      {getMTOTable2(project, mode)}
      {getMTOTable3(process,mode)}
    </>
  );
}

function getMTOTable(project: Project | undefined, type?: TMTO) {

  
  if (!project) return null;

  const PRs = project.models.filter(
    (m) => m.type === "Pipe Rack"
  ) as PipeRack[];
  const OFs = project.models.filter(
    (m) => m.type === "Open Frame"
  ) as TOpenFrame[];

  const FSs = project.models.filter(
    (m) => m.type === "Factory Shed"
  ) as TOpenFrame[];

  switch (type) {
    case "Pipe Lines":
      return getPipeLinesMTO(project);
    case "Pipe Accessories":
      return getPipesAccessoriesMTO(project);
    case "Flares":
      return getFlareMTO(project);
    case "Pipe Racks":
      return getPipeRackMTO(PRs);
    case "Open Frames":
      return getOpenFrameMTO(OFs);
    case "Factory Sheds":
      return getFactoryShedsMTO(FSs);
    default:
      return (
        <>
          {project.freePipes?.length ? (
            <>
              {getPipeLinesMTO(project)}
              {getPipesAccessoriesMTO(project)}
            </>
          ) : null}
          {project.flares?.length ? getFlareMTO(project) : null}
          {PRs.length ? getPipeRackMTO(PRs) : null}
          {OFs.length ? getOpenFrameMTO(OFs) : null}
          {FSs.length ? getFactoryShedsMTO(FSs) : null}
        </>
      );
  }
}

function getMTOTable2(project: Project | undefined, mode?: TWorkMode) {
  if (!project) return null;
  const PRs = project.models.filter(
    (m) => m.type === "Pipe Rack"
  ) as PipeRack[];
  const OFs = project.models.filter(
    (m) => m.type === "Open Frame"
  ) as TOpenFrame[];

  const FSs = project.models.filter(
    (m) => m.type === "Factory Shed"
  ) as TOpenFrame[];

  switch (mode) {
    case "DESIGNER":
      return (
        <>
          {project.freePipes?.length ? (
            <>
              {getPipeLinesMTO(project)}
              {getPipesAccessoriesMTO(project)}
            </>
          ) : null}
          {project.flares?.length ? getFlareMTO(project) : null}
          {PRs.length ? getPipeRackMTO(PRs) : null}
          {OFs.length ? getOpenFrameMTO(OFs) : null}
          {FSs.length ? getFactoryShedsMTO(FSs) : null}
        </>
      )
  
    case "PIPDESIGNER":
      return(
        <>
        {getPipeLinesMTO(project)}
        {getPipesAccessoriesMTO(project)}
        </>
      );
    
    case "STRDESIGNER":
      return (
          getOpenFrameMTO(OFs)
      )
  }
}

function getMTOTable3(process: TProcess | undefined, mode?: TWorkMode) {
  if (!process) return null;

  switch (mode) {
    case "PRODESIGNER":
      return (
        getProcessLineMTO(process)
      )
  }
}

function fixValuesFotExport(val: any) {
  if (!val) return ` `;
  return ` ${val}`;
}

function getPipeLinesMTO(project: Project) {
  const mode = useSelector((state: ApplicationState) => state.main.workMode);
  const data = getPipesSyncMTO(project.freePipes ?? []);
  const chartData = {
    labels: data.map(item => `${item.tag} - ${item.line}`), 
    display:{
      Boolean: false,
    },
    datasets: [{
      label: 'Weight (kg)',
      data: data.map(item => item.weight), 
      backgroundColor: 'rgba(54, 162, 235, 0.5)',
      borderColor: 'rgba(54, 162, 235, 1)',
      borderWidth: 2,
      hoverBackgroundColor: 'rgba(255, 204, 203, 0.9)',
      hoverBorderColor: 'rgba(255, 100, 0, 1)'
    }]
  };

  const options = {
    scales: {
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
          speed: 0.5,
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
          mode: 'xy',
          speed: 0.5,
          threshold: 2,
          sensitivity: 3,
      } 
      }
  }
  };

  
  return (
    <>
      <div className="MTO-header">
        <span className="MTO-title">Pipe Lines</span>
        {mode === "PRODESIGNER" ? (
        <span className="button-primary-b1l">30 Stage</span>
        ): null}
        <span className="MTO-title"></span>
        <Button
          small
          icon="export"
          intent="success"
          text="Export to CSV"
          className="button-secondary-b1l"
          onClick={() => {
            exportToCSV(
              [
                ...data.map((item) => {
                  return {
                    Tag: item.tag,
                    "Line No.": item.line,
                    Structures: item.structure,
                    Size: fixValuesFotExport(item.size),
                    Material: item.material,
                    "Length (m)": fixValuesFotExport(item.length),
                    "Weight (kg)": fixValuesFotExport(item.weight),
                  };
                }),
                {
                  Tag: "Total",
                  "Line No.": ` `,
                  Structures: ` `,
                  Size: ` `,
                  Material: ` `,
                  "Length (m)": fixValuesFotExport(
                    roundM(data.reduce((acc, item) => acc + item.length, 0))
                  ),
                  "Weight (kg)": fixValuesFotExport(
                    roundM(data.reduce((acc, item) => acc + item.weight, 0))
                  ),
                },
              ],
              "Pipe Lines MTO"
            );
          }}
        />
      </div>
      <div className="MTO-hr" />
        <table className="MTO-table">
        <thead>
          <th>Tag</th>
          <th>Line No.</th>
          <th>Structures</th>
          <th>Size</th>
          <th>Material</th>
          <th>Length (m)</th>
          <th>Weight (kg)</th>
        </thead>
        <tbody>
          {data.map((item, i) => (
            <tr key={i}>
              <td>{item.tag}</td>
              <td >{item.line}</td>
              <td >{item.structure}</td>
              <td >{item.size}</td>
              <td >{item.material}</td>
              <td >{item.length}</td>
              <td >{item.weight}</td>
            </tr>
          ))}
          <tr>
            <td>
              <strong>Total</strong>
            </td>
            <td>-</td>
            <td>-</td>
            <td>-</td>
            <td>-</td>
            <td>
              {roundM(data.reduce((acc, row) => acc + row.length, 0))}
            </td>
            <td style={{ textAlign: "center" }}>
              {roundM(data.reduce((acc, row) => acc + row.weight, 0))}
            </td>
          </tr>
        </tbody>
      </table>
      <div
        className="p-5"
          style={{
            position: "relative",
            paddingTop: 50,
            paddingBottom: 50,
            paddingLeft: "10vw",
            paddingRight: "10vw",
            overflow: "hidden",
            background: "white",
            minHeight: "calc(43vw + 0px)",
            maxHeight: "calc(80vw + 0px)",
            minWidth: "calc(80vw + 0px)",
          }}
      >
       {/*<Button
        onClick={() => {
          // Access the chart instance and call resetZoom
          if (chartRef.current) {
            chartRef.current.chartInstance.resetZoom();
          }
        }}
      >
        Reset Zoom
      </Button>*/}
      <Bar options={options} data={chartData}/>
      </div>
    </>
  );
}

function getPipesAccessoriesMTO(project: Project) {
  const data = getPipeAccessoriesSyncMTO(project.freePipes ?? []);
  const chartData = {
    labels: data.map(item => `${item.tag} - ${item.line}`),  
    display:{
      Boolean: false,
    },
    datasets: [{
      label: 'Weight (kg)',
      data: data.map(item => item.weight), 
      backgroundColor: 'rgba(54, 162, 235, 0.5)',
      borderColor: 'rgba(54, 162, 235, 1)',
      borderWidth: 2,
      hoverBackgroundColor: 'rgba(255, 204, 203, 0.9)',
      hoverBorderColor: 'rgba(255, 100, 0, 1)'
    }]
  };
  const options = {
    scales: {
      y: {
        beginAtZero: true
      },
      display:{
        Boolean: false,
      },
    },
    legend: {
      labels: {
        fontColor: 'rgba(0, 0, 0, 1)',
        fontSize: 18,
      }
    },
    animation : {
      duration : 10000,
    },
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: 'Pipe Accessories MTO'
      }
    }
  }
  return (
    <>
      <div className="MTO-header">
        <span className="MTO-title">Pipes Accessories</span>
        <span className="button-primary-b1l">30 Stage</span>
        <Button
          small
          icon="export"
          intent="success"
          text="Export to CSV"
          className="button-secondary-b1l"
          onClick={() => {
            exportToCSV(
              [
                ...data.map((item) => {
                  return {
                    Tag: item.tag,
                    "Line No.": item.line,
                    Structures: item.structure,
                    Size: fixValuesFotExport(item.size),
                    Type: item.type,
                    "Schedule / Class": item.schedule ?? ` `,
                    Nos: item.nos ?? 0,
                    "Weight (kg)": fixValuesFotExport(item.weight),
                  };
                }),
                {
                  Tag: "Total",
                  "Line No.": ` `,
                  Structures: ` `,
                  Size: ` `,
                  Type: ` `,
                  "Schedule / Class": ` `,
                  Nos: ` `,
                  "Weight (kg)": fixValuesFotExport(
                    roundM(data.reduce((acc, item) => acc + item.weight, 0))
                  ),
                },
              ],
              "Pipe Accessories MTO"
            );
          }}
        />
      </div>
      <div className="MTO-hr" />
        <table className="MTO-table">
        <thead>
          <th>Tag</th>
          <th>Line No.</th>
          <th>Structures</th>
          <th>Size</th>
          <th>Type</th>
          <th>Schedule / Class</th>
          <th>Nos</th>
          <th>Weight (kg)</th>
        </thead>
        <tbody>
          {data.map((item, i) => (
            <tr key={i}>
              <td style={{ textAlign: "center" }}>{item.tag}</td>
              <td style={{ textAlign: "center" }}>{item.line}</td>
              <td style={{ textAlign: "center" }}>{item.structure}</td>
              <td style={{ textAlign: "center" }}>{item.size}</td>
              <td style={{ textAlign: "center" }}>{item.type}</td>
              <td style={{ textAlign: "center" }}>
                {item.schedule ?? item.class}
              </td>
              <td style={{ textAlign: "center" }}>{item.nos}</td>
              <td style={{ textAlign: "center" }}>{item.weight}</td>
            </tr>
          ))}
          <tr>
            <td style={{ textAlign: "center" }}>
              <strong>Total</strong>
            </td>
            <td style={{ textAlign: "center" }}>-</td>
            <td style={{ textAlign: "center" }}>-</td>
            <td style={{ textAlign: "center" }}>-</td>
            <td style={{ textAlign: "center" }}>-</td>
            <td style={{ textAlign: "center" }}>-</td>
            <td style={{ textAlign: "center" }}>-</td>
            <td style={{ textAlign: "center" }}>
              {roundM(data.reduce((acc, row) => acc + row.weight, 0))}
            </td>
          </tr>
        </tbody>
      </table>
      <div
        className="p-5"
          style={{
            position: "relative",
            paddingTop: 50,
            paddingBottom: 50,
            paddingLeft: "10vw",
            paddingRight: "10vw",
            overflow: "hidden",
            background: "white",
            minHeight: "calc(43vw + 0px)",
            maxHeight: "calc(80vw + 0px)",
            minWidth: "calc(80vw + 0px)",
          }}
      >
      <Bar options={options} data={chartData} />
      </div>
    </>
  );
}

function getFlareMTO(project: Project) {
  const data = getFlaresMTO(project.flares ?? []);
  return (
    <>
      <div className="MTO-header">
        <span className="MTO-title">Flares</span>
        <span className="button-primary-b1l">30 Stage</span>
        <Button
          small
          icon="export"
          intent="success"
          text="Export to CSV"
          className="button-secondary-b1l"
          onClick={() => {
            exportToCSV(
              [
                ...data.map((item) => {
                  return {
                    Model: item.flare,
                    Material: item.material,
                    "Weight (kg)": fixValuesFotExport(item.weight),
                  };
                }),
                {
                  Model: "Total",
                  Material: ` `,
                  "Weight (kg)": fixValuesFotExport(
                    roundM(data.reduce((acc, item) => acc + item.weight, 0))
                  ),
                },
              ],
              "Flares MTO"
            );
          }}
        />
      </div>
      <div className="MTO-hr" />
        <table className="MTO-table">
        <thead>
          <tr>
            <th>Model</th>
            <th>Material</th>
            <th>Weight (kg)</th>
          </tr>
        </thead>
        <tbody>
          {data.map((item, i) => (
            <tr key={i}>
              <td style={{ textAlign: "center" }}>{item.flare}</td>
              <td style={{ textAlign: "center" }}>{item.material}</td>
              <td style={{ textAlign: "center" }}>{item.weight}</td>
            </tr>
          ))}
          <tr>
            <td style={{ textAlign: "center" }}>
              <strong>Total</strong>
            </td>
            <td style={{ textAlign: "center" }}>-</td>
            <td style={{ textAlign: "center" }}>
              {roundM(data.reduce((acc, row) => acc + row.weight, 0))}
            </td>
          </tr>
        </tbody>
      </table>
    </>
  );
}

function getPipeRackMTO(models: PipeRack[]) {
  const data = getPipeRacksMTO(models);

  return (
    <>
      <div className="MTO-header">
        <span className="MTO-title">Pipe Racks MTO</span>
        <span className="button-primary-b1l">30 Stage</span>
        <Button
          small
          icon="export"
          intent="success"
          text="Export to CSV"
          className="button-secondary-b1l"
          onClick={() => {
            exportToCSV(
              [
                ...data.map((item) => {
                  return {
                    Model: item.model,
                    Designtion: item.designation,
                    Material: item.material,
                    "Length (m)": fixValuesFotExport(item.length),
                    "Weight (kg)": fixValuesFotExport(item.weight),
                  };
                }),
                {
                  Model: "Total",
                  Designtion: ` `,
                  Material: ` `,
                  "Length (m)": fixValuesFotExport(
                    roundM(data.reduce((acc, item) => acc + item.weight, 0))
                  ),
                  "Weight (kg)": fixValuesFotExport(
                    roundM(data.reduce((acc, item) => acc + item.weight, 0))
                  ),
                },
              ],
              "Pipe Racks MTO"
            );
          }}
        />
      </div>
      <div className="MTOhr" />
        <table className="MTO-table">
        <thead>
          <tr>
            <th>Model</th>
            <th>Designtion</th>
            <th>Material</th>
            <th>Length (m)</th>
            <th>Weight (kg)</th>
          </tr>
        </thead>
        <tbody>
          {data.map((item, i) => (
            <tr key={i}>
              <td style={{ textAlign: "center" }}>{item.model}</td>
              <td style={{ textAlign: "center" }}>{item.designation}</td>
              <td style={{ textAlign: "center" }}>{item.material}</td>
              <td style={{ textAlign: "center" }}>{item.length}</td>
              <td style={{ textAlign: "center" }}>{item.weight}</td>
            </tr>
          ))}
          <tr>
            <td style={{ textAlign: "center" }}>
              <strong>Total</strong>
            </td>
            <td style={{ textAlign: "center" }}>-</td>
            <td style={{ textAlign: "center" }}>-</td>
            <td style={{ textAlign: "center" }}>
              {roundM(data.reduce((acc, row) => acc + row.length, 0))}
            </td>
            <td style={{ textAlign: "center" }}>
              {roundM(data.reduce((acc, row) => acc + row.weight, 0))}
            </td>
          </tr>
        </tbody>
      </table>
    </>
  );
}

function getOpenFrameMTO(models: TOpenFrame[]) {
  const data = getOpenFramesMTO(models);
  const chartData = {
    labels : data.map(item => `${item.designation} - ${item.model}`),
    display:{
      Boolean: false,
    },
    datasets: [{
      label: 'Weight (kg)',
      data: data.map(item => item.weight), 
      backgroundColor: 'rgba(54, 162, 235, 0.5)',
      borderColor: 'rgba(54, 162, 235, 1)',
      borderWidth: 2,
      hoverBackgroundColor: 'rgba(255, 204, 203, 0.9)',
      hoverBorderColor: 'rgba(255, 100, 0, 1)'
    }]
  };
  const options = {
    scales: {
      y: {
        beginAtZero: true
      },
      display:{
        Boolean: false,
      },
    },
    animation : {
      duration : 13000,
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
        text: 'Open Frame MTO'
      }
    }
  }
  return (
    <>
      <div className="MTO-header">
        <span className="MTO-title">Open Frames</span>
        <span className="button-primary-b1l">30 Stage</span>
        <Button
          small
          icon="export"
          intent="success"
          text="Export to CSV"
          className="button-secondary-b1l"
          onClick={() => {
            exportToCSV(
              [
                ...data.map((item) => {
                  return {
                    Model: item.model,
                    Designtion: item.designation,
                    Material: item.material,
                    "Length (m)": fixValuesFotExport(item.length),
                    "Weight (kg)": fixValuesFotExport(item.weight),
                  };
                }),
                {
                  Model: "Total",
                  Designtion: ` `,
                  Material: ` `,
                  "Length (m)": fixValuesFotExport(
                    roundM(data.reduce((acc, item) => acc + item.weight, 0))
                  ),
                  "Weight (kg)": fixValuesFotExport(
                    roundM(data.reduce((acc, item) => acc + item.weight, 0))
                  ),
                },
              ],
              "Open Frames MTO"
            );
          }}
        />
      </div>
      <div className="MTO-hr" />
        <table className="MTO-table">
        <thead>
          <tr>
            <th>Model</th>
            <th>Designtion</th>
            <th>Material</th>
            <th>Length (m)</th>
            <th>Weight (kg)</th>
          </tr>
        </thead>
        <tbody>
          {data.map((item, i) => (
            <tr key={i}>
              <td style={{ textAlign: "center" }}>{item.model}</td>
              <td style={{ textAlign: "center" }}>{item.designation}</td>
              <td style={{ textAlign: "center" }}>{item.material}</td>
              <td style={{ textAlign: "center" }}>{item.length}</td>
              <td style={{ textAlign: "center" }}>{item.weight}</td>
            </tr>
          ))}
          <tr>
            <td style={{ textAlign: "center" }}>
              <strong>Total</strong>
            </td>
            <td style={{ textAlign: "center" }}>-</td>
            <td style={{ textAlign: "center" }}>-</td>
            <td style={{ textAlign: "center" }}>
              {roundM(data.reduce((acc, row) => acc + row.length, 0))}
            </td>
            <td style={{ textAlign: "center" }}>
              {roundM(data.reduce((acc, row) => acc + row.weight, 0))}
            </td>
          </tr>
        </tbody>
      </table>
      <div
        className="p-5"
          style={{
            position: "relative",
            paddingTop: 50,
            paddingBottom: 50,
            paddingLeft: "10vw",
            paddingRight: "10vw",
            overflow: "hidden",
            background: "white",
            minHeight: "calc(43vw + 0px)",
            maxHeight: "calc(80vw + 0px)",
            minWidth: "calc(80vw + 0px)",
          }}
      >
      <Bar options={options} data={chartData} />
      </div>
    </>
  );
}

function getFactoryShedsMTO(models: TOpenFrame[]) {
  const data = getOpenFramesMTO(models);

  return (
    <>
      <div className="MTO-header">
        <span className="MTO-title">Factory Sheds</span>
        <span className="button-primary-b1l">30 Stage</span>
        <Button
          small
          icon="export"
          intent="success"
          text="Export to CSV"
          className="button-secondary-b1l"
          onClick={() => {
            exportToCSV(
              [
                ...data.map((item) => {
                  return {
                    Model: item.model,
                    Designtion: item.designation,
                    Material: item.material,
                    "Length (m)": fixValuesFotExport(item.length),
                    "Weight (kg)": fixValuesFotExport(item.weight),
                  };
                }),
                {
                  Model: "Total",
                  Designtion: ` `,
                  Material: ` `,
                  "Length (m)": fixValuesFotExport(
                    roundM(data.reduce((acc, item) => acc + item.weight, 0))
                  ),
                  "Weight (kg)": fixValuesFotExport(
                    roundM(data.reduce((acc, item) => acc + item.weight, 0))
                  ),
                },
              ],
              "Factory Sheds MTO"
            );
          }}
        />
      </div>
      <div className="MTO-hr" />
        <table className="MTO-table">
        <thead>
          <tr>
            <th>Model</th>
            <th>Designtion</th>
            <th>Material</th>
            <th>Length (m)</th>
            <th>Weight (kg)</th>
          </tr>
        </thead>
        <tbody>
          {data.map((item, i) => (
            <tr key={i}>
              <td style={{ textAlign: "center" }}>{item.model}</td>
              <td style={{ textAlign: "center" }}>{item.designation}</td>
              <td style={{ textAlign: "center" }}>{item.material}</td>
              <td style={{ textAlign: "center" }}>{item.length}</td>
              <td style={{ textAlign: "center" }}>{item.weight}</td>
            </tr>
          ))}
          <tr>
            <td style={{ textAlign: "center" }}>
              <strong>Total</strong>
            </td>
            <td style={{ textAlign: "center" }}>-</td>
            <td style={{ textAlign: "center" }}>-</td>
            <td style={{ textAlign: "center" }}>
              {roundM(data.reduce((acc, row) => acc + row.length, 0))}
            </td>
            <td style={{ textAlign: "center" }}>
              {roundM(data.reduce((acc, row) => acc + row.weight, 0))}
            </td>
          </tr>
        </tbody>
      </table>
    </>
  );
}

function getProcessLineMTO(process: TProcess) {
  const data = getProcessSyncMTO(process.lines ?? []);

  return (
    <>
      <div className="MTO-header">
        <span className="MTO-title">Process Line MTO</span>
        <span className="button-primary-b1l">30 Stage</span>
        <Button
          small
          icon="export"
          intent="success"
          text="Export to CSV"
          className="button-secondary-b1l"
          /*onClick={() => {
            exportToCSV(
              [
                ...data.map((item) => {
                  return {
                    Model: item.model,
                    Designtion: item.designation,
                    Material: item.material,
                    "Length (m)": fixValuesFotExport(item.length),
                    "Weight (kg)": fixValuesFotExport(item.weight),
                  };
                }),
                {
                  Model: "Total",
                  Designtion: ` `,
                  Material: ` `,
                  "Length (m)": fixValuesFotExport(
                    roundM(data.reduce((acc, item) => acc + item.weight, 0))
                  ),
                  "Weight (kg)": fixValuesFotExport(
                    roundM(data.reduce((acc, item) => acc + item.weight, 0))
                  ),
                },
              ],
              "Factory Sheds MTO"
            );
          }}*/
        />
      </div>
      <div className="MTO-hr" />
        <table className="MTO-table">
        <thead>
          <tr>
            <th>Line</th>
            <th>Size</th>
            <th>Material</th>
            <th>Length (m)</th>
            <th>Weight (kg)</th>
          </tr>
        </thead>
        <tbody>
          {data.map((item, i) => (
            <tr key={i}>
              <td style={{ textAlign: "center" }}>{item.line}</td>
              <td style={{ textAlign: "center" }}>{item.size}</td>
              <td style={{ textAlign: "center" }}>{item.material}</td>
              <td style={{ textAlign: "center" }}>{item.length}</td>
              <td style={{ textAlign: "center" }}>{item.weight}</td>
            </tr>
          ))}
          <tr>
            <td style={{ textAlign: "center" }}>
              <strong>Total</strong>
            </td>
            <td style={{ textAlign: "center" }}>-</td>
            <td style={{ textAlign: "center" }}>-</td>
            <td style={{ textAlign: "center" }}>
              {roundM(data.reduce((acc, row) => acc + row.length, 0))}
            </td>
            <td style={{ textAlign: "center" }}>
              {roundM(data.reduce((acc, row) => acc + row.weight, 0))}
            </td>
          </tr>
        </tbody>
      </table>
    </>
  );
}
