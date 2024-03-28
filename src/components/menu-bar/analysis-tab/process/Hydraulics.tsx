import React, { useMemo, useState, useEffect, useRef } from "react";
import { CustomDlg } from "../../../common/CustomDlg";
import { Button } from "@blueprintjs/core";
import { TProcessLine, TProcessPipeData, TProcessLineSegment } from "../../../../store/process/types";
import { useSelector, useDispatch } from "react-redux";
import { ApplicationState } from "../../../../store";
import {
  getTopOffset,
  strFilter,
  getUnicuesArray,
  roundM,
  fixNumberToStr,
  exportToCSV,
  importFromCSV,
  checkImportedNumber,
} from "../../../3d-models/utils";
import { changeProcessLineAction } from "../../../../store/process/actions";
import { NumericCell } from "../../../common/NumericCell";
import { SelectorCell } from "../../../common/SelectorCell";
import { PipeProfile } from "../../../../store/data/types";
import PipeData from "../piping/data-modeling-components/PipeData";
import { red } from "../../../../store/main/constants";
import { processDataArray } from "@kitware/vtk.js/IO/XML/XMLReader";
import { pipe } from "superagent";
import { handleInputChange } from "react-select/src/utils";
import { parse } from "path";
import { secondServerAPI } from "../../../../pages/utils/agent";

type Props = {
  onClose: () => any;
};

export function Hydraulics({ onClose }: Props) {
  const [offsetTop2, setOffsetTop2] = useState<number>(0);
  const [offsetTop3, setOffsetTop3] = useState<number>(0);
  const [offsetTop4, setOffsetTop4] = useState<number>(0);
  const [data, setData] = useState<TProcessLine[]>([]);
  const [secondData, setSecondData] = useState<{ id: number; length: number; elevation: number }[]>(
    []
  );
  const [apiData, setApiData] = useState<any>(null);
  const [someState, setSomeState] = useState<any>(null);
  const [debugData, setDebugData] = useState<any[]>([]);

  const tableRef = useRef<HTMLTableElement>(null);

  const current = useSelector((state: ApplicationState) => state.main.currentProject);
  const process = useSelector((state: ApplicationState) => state.process);
  const profiles = useSelector((state: ApplicationState) => state.data.pipingSS);

  const dispatch = useDispatch();

  const npss = useMemo(() => {
    return getUnicuesArray(profiles.map((p) => p.nominal_pipe_size_inch));
  }, [profiles]);

  useEffect(() => {
    const p = process.processes.get(current);
    const lines = p?.lines ?? [];
    setData(lines);
    if (!secondData.length) {
      const newSecondData = [];
      for (const line of lines) {
        const length = getLineLength(line);
        const elevation = getLineElevationChange(line);
        newSecondData.push({ id: line.id, length, elevation });
      }
      setSecondData(newSecondData);
    }
  }, [process, current]);

  useEffect(() => {
    setOffsetTop2(getTopOffset(tableRef.current, 1));
    setOffsetTop3(getTopOffset(tableRef.current, 2));
    setOffsetTop4(getTopOffset(tableRef.current, 3));
  }, [data]);



  function getLineElevationChange(line: TProcessLine) {
    const minE =
      line.segments.reduce((min: number | undefined, s) => {
        return min === undefined ? Math.min(s.start.y, s.end.y) : Math.min(s.start.y, s.end.y, min);
      }, undefined) ?? 0;
    const maxE =
      line.segments.reduce((max: number | undefined, s) => {
        return max === undefined ? Math.max(s.start.y, s.end.y) : Math.max(s.start.y, s.end.y, max);
      }, undefined) ?? 0;
    return roundM(maxE - minE);
  }

  function getLineLength(line: TProcessLine) {
    return roundM(line.segments.reduce((acc, s) => acc + s.start.distanceTo(s.end), 0));
  }

  function handleChangeLine(line: TProcessLine) {
    dispatch(changeProcessLineAction(current, line));
  }

  function handleChange(row: TProcessLine, field: string, val: any) {
    const changed = { ...row, [field]: val };
    switch (field) {
      case "":
        break;
      /*case "q":
        changed.q = val;
        break;
      case "prs":
        changed.prs = val;
        break;*/
    }
    handleChangeLine(changed);
  }

  function handleChangeSegment(row: TProcessLine, field: string, val: any) {
    let changedRow: TProcessLine = {
      ...row,
      segments: row.segments.map((s) => ({ ...s, [field]: val })),
    };
    switch (field) {
      case "nps":
        changedRow = {
          ...changedRow,
          parameters: { ...changedRow.parameters, nps: val, schedule: undefined },
        };
        break;
      case "schedule":
        changedRow = {
          ...changedRow,
          parameters: { ...changedRow.parameters, schedule: val },
        };
        break;
    }
    handleChangeLine(changedRow);
  }

  //calculating diamter
  function calDiameter(pipeData:TProcessPipeData[]): number{
    let totalDiameter = 0;
    let count = 0;
    pipeData.forEach(PipeData => {
      if (PipeData.nps) {
        const nps = parseFloat(PipeData.nps);
        const thickness = PipeData.thickness || 0;
        if (!isNaN(nps)) {
          totalDiameter += nps - ((thickness/25.4) * 2);
          count++;
        }else{
          console.log('Invalid Nps');
          
        }       
      }
    });
    const avgDiameter = totalDiameter / count;
    return avgDiameter;
  }
  //dictionary for converting the equipment to vertex
  interface Edictionary {
    [key : string]: number;
  }
  const eDictionary : Edictionary = {};
  

  //calculating segment length
  type Vector3 = {
    x: number;
    y: number;
    z: number;
  };
  
  //calculating the height difference between starting point and ending point of the processline
  function heightDifference(line:TProcessLine): number {
    const ssegment = line.segments[0];
    const esegment = line.segments[line.segments.length - 1];
    const height = esegment.end.y - ssegment.start.y;
    return height;
  }
  //Calculating the angle in between the procesline starting point and the ending point
  function calculate3DAngle(line: TProcessLine): number {
    let angle = 0;
    const ht = heightDifference(line);
    const lnt = getLineLength(line);
    angle = Math.asinh(ht/lnt);
    return angle;
  }

  
  //function to convert the equipment to dictionary
  function assignNumberToEquipment(line:TProcessLine,counterObj: { count: number },Edictionary:Record<string,number>): Record<string, number> {
    //const eDictionary : Record<string,number> ={};
    //let count = 0;
    const from = line.from;
    const to = line.to || 0;
    if (!Object.prototype.hasOwnProperty.call(Edictionary,from)) {
      Edictionary[from] = counterObj.count;
      counterObj.count++;
    }
    if (!Object.prototype.hasOwnProperty.call(Edictionary,to)) {
      Edictionary[to] = counterObj.count;
      counterObj.count++;
    }
    return Edictionary;
  }

  //vertex interface
  interface VertexRow {
    equipmentName: string;
    equipmentNo: number;
    demand: number | null;
    enthalpy: number | null;
    pressure: number | null;
  }


  /*const dictToTableRows = (dictionary: Record<string, number>) => {
    return Object.entries(dictionary).map(([key, value]) => {
      console.log({equipmentName: key, equipmentNo: value});
      return {equipmentName: key, equipmentNo: value};
    });
  };*/

  function dictToTableRows(dictionary:{[key:string]: number}): VertexRow[]{
    return Object.keys(dictionary).map(key => ({
      equipmentName: key,
      equipmentNo : dictionary[key],
      demand: null,
      enthalpy: null,
      pressure: null
    }));
  }

  const [vertexRows, setVertexRows] = useState<VertexRow[]>([]); //new added
  
  useEffect(() => {
    const counterObj = {count: 0 };
    data.forEach(line => {
      assignNumberToEquipment(line, counterObj, eDictionary)
    });
    setVertexRows(dictToTableRows(eDictionary));
  }, [data]);
  
  //vertices mapping
  const vertices = vertexRows.map(row => ({
    equipmentNo: row.equipmentNo,
    demand: row.demand,
    enthalpy: row.enthalpy,
    pressure: row.pressure,
  }));

  //pipe object
  type pipe = {
    inletVertex : number;
    outletVertex : number;
    diameter : number;
    length : number;
    roughness : number;
    angle : number;
    U : number;
  }
  type vertex = {
    no : number;
    demand : number;
    pressure : number;
    enthalpy : number;
  }
 
  // function to create the hydraulics json
  function createHydraulicsJson(data : TProcessLine[],vertices : VertexRow[],eDictionary : Edictionary){
    
    const counterObj = { count : 0 };
    data.forEach(line => {
      assignNumberToEquipment(line,counterObj,eDictionary)
    })
    const pipes = data.flatMap((line) =>{
      const startSegment = line.segments[0];
      const endSegment = line.segments[line.segments.length - 1];
      const processPipeDataArray = line.segments.map(segment => segment.parameters).filter(Boolean) as TProcessPipeData[];
      return {
        "inlet vertex" : eDictionary[line.from],
        "outlet vertex" : eDictionary[line.to || 0],
        "diameter" : calDiameter(processPipeDataArray),
        "length" : getLineLength(line),
        "roughness" : 0.00005,
        "angle" : calculate3DAngle(line),
        "U" : 1,
      };
    });
    const vertex = vertices.map((v) => ({
      "no.": v.equipmentNo,
      "demand": v.demand,
      "pressure": v.pressure,
      "enthalpy": v.enthalpy,
    }));
    const fluid = [{
      "Material" : ["Water"],
      "EoS" : "SteamTables",
      "MolFr" : [1.0]
    }];
    const result = {
      "pipes" : pipes,
      "vertex" : vertex,
      "fluid" : fluid,
    };
    console.log(result);
    return {
      result
    }
  }

  // function to export the hydraulics json object 
  function handleExportWithProcessLines() {
    const eDictionary : Edictionary = {};
    const counterObj = { count: 0 };
    data.forEach(line => {
      assignNumberToEquipment(line,counterObj,eDictionary)
    })
    exportToCSV(
      data.map((line) => {
        const startSegment = line.segments[0];
        const endSegment = line.segments[line.segments.length - 1];
  
        const processLineLength = line.initialLength || 0;
        const processPipeDataArray = line.segments.map(segment => segment.parameters).filter(Boolean) as TProcessPipeData[];
        const diameter = calDiameter(processPipeDataArray);
        const angle = calculate3DAngle(line);
        const pressureDifference = 2000000000;/* calculatePressureDifference(startSegment.start, endSegment.end);*/
        const Length = getLineLength(line);
        return {
          id: line.id,
          "inletVertex": eDictionary[line.from],
          "outletVertex":eDictionary[line.to || 0],
          "Order": line.order,
          "Process Line No": line.processLineNo,
          "Pipeline No": line.pipelineNo,
          "From": line.from,
          "To": line.to,
          "Type": line.type,
          "Process Line Length": Length,
          "Diameter": diameter,
          "Angle": angle,
          "Pressure Difference due to Elevation": (pressureDifference / 100000).toFixed(2),
          "Q" : line.q,
          "prs" : line.prs,
          "processlinenumber" : line.processLineNo,
          "pipelinenumber" : line.pipelineNo,
        };
      }),
      "Hydraulics_with_process_lines"
    );
  }  

  //inputchange handling
  const handleInputsChange =(equipmentNo: number,field:'demand' | 'enthalpy' | 'pressure',value: string) =>{
    setVertexRows(prevRows =>{
      const newRows = [...prevRows];
      const rowIndex = newRows.findIndex(row => row.equipmentNo === equipmentNo);
      if (rowIndex !==-1) {
        newRows[rowIndex] = {...newRows[rowIndex],[field]: parseFloat(value)};
      }
      return newRows;
    })
  }
  

  function handleExport() {
    exportToCSV(
      data.reduce((acc, d) => {
        const p = d.segments[0]?.parameters;
        const sd = secondData.find((sd) => sd.id === d.id);
        return [
          ...acc,
          {
            id: d.id,
            "Model Name": d.processLineNo,
            Vol: fixNumberToStr(p?.vol),
            Size: p?.nps ?? "",
            Schedule: p?.profile?.schedule ?? "",
            Diameter: fixNumberToStr(p?.od),
            Length: fixNumberToStr(sd?.length),
            "Elevation Change": fixNumberToStr(sd?.elevation),
            "Press drop": fixNumberToStr(p?.pressDrop),
            "Presser drop": fixNumberToStr(p?.pressDropper),
            Velocity: fixNumberToStr(p?.velocity),
            "Press 1": fixNumberToStr(p?.P1),
            "Press 2": fixNumberToStr(p?.press2),
            Temp: fixNumberToStr(p?.T2),
            StartID: d.from,
            EndID: d.to,
          },
        ];
      }, [] as any[]),
      "Hydraulics"
    );
  }

  function handleImport() {
    importFromCSV((imported) => {
      if (!Array.isArray(imported)) return;
      let changedData = [...secondData];
      for (const item of imported) {
        let line: TProcessLine | undefined = data.find(
          (d) => d.processLineNo === item["Model Name"]
        );
        if (!line) continue;
        const length = checkImportedNumber(item["Length"]) ?? 0;
        const elevation = checkImportedNumber(item["Elevation Change"]) ?? 0;
        changedData = changedData.map((cd) =>
          cd.id === line?.id ? { ...cd, length, elevation } : cd
        );
        line = {
          ...line,
          parameters: {
            ...line.parameters,
            nps: item.Size ? `${item.Size}` : undefined,
            schedule: profiles.find(
              (p) => p.nominal_pipe_size_inch === `${item.Size}` && p.schedule === item.Schedule
            ),
          },
          segments: line.segments.map((s) => ({
            ...s,
            parameters: {
              ...s.parameters,
              od: checkImportedNumber(item["Diameter"]) ?? 0,
              vol: checkImportedNumber(item["Vol"]) ?? 0,
              pressDrop: checkImportedNumber(item["Press drop"]) ?? 0,
              pressDropper: checkImportedNumber(item["Presser drop"]) ?? 0,
              velocity: checkImportedNumber(item["Velocity"]) ?? 0,
              P1: checkImportedNumber(item["Press 1"]) ?? 0,
              press2: checkImportedNumber(item["Press 2"]) ?? 0,
              T2: checkImportedNumber(item["Temp"]) ?? 0,
            },
          })),
        };
        handleChangeLine(line);
      }
      setSecondData(changedData);
    });
  }

  const hydraulicAnalysisJson = useMemo(() => createHydraulicsJson(data, vertexRows,eDictionary).result, [data, vertexRows]);
  //handling button click
  function handleButtonClick() {
    const url = `${secondServerAPI}/hydraulics/solve`;
    //const url = 'http://localhost:5000/hydraulics/solve';
    sendHydraulicsData(url, hydraulicAnalysisJson);
  }
  //sending data to backend
  async function sendHydraulicsData(url:string,data:object) {
      try {
        const response = await fetch(url,{
          method : 'Post',
          headers: {
            'Content-type' : 'Application/Json'
          },
          body : JSON.stringify(data)
        });
        const responseData = await response.json();
        //setApiData(Array.isArray(responseData) ? responseData : []);
        setDebugData(Array.isArray(responseData) ? responseData : []);
        
        console.log(responseData);
      } catch (error) {
        console.error(`Error : ${error}`);
      }
    }

  

  function getRow(row: TProcessLine) {
    const s = row.segments[0];
    const sd = secondData.find((sd) => sd.id === row.id);
    const length = getLineLength(row);
    const elevation = getLineElevationChange(row);
    const apiRowData = Array.isArray(apiData) ? apiData.find((data : any) => data.id == row.id) : null;
    const flowrate = apiRowData ? apiRowData.flowrate : s?.parameters?.velocity;
    const inletPressure = apiRowData ? apiRowData["inlet pressure"] : s?.parameters?.P1;
    const outletPressure = apiRowData ? apiRowData["outlet pressure"] : s?.parameters?.P2;
    const pipeEnthalpy = apiRowData ? apiRowData["pipe enthalpy"] : null;
    return (
      <tr key={`${row.id}`}>
        <NumericCell
          value={row.processLineNo}
          onChange={(val) => handleChange(row, "processLineNo", val)}
        />
        {/*<NumericCell
          isDecimal={true}
          value = {row.q}
          onChange={(val) => handleChange(row,"q", val)}
    />*/}
        {/*<NumericCell
          isDecimal={true}
          value = {row.prs}
          onChange= {(val) => handleChange(row,"prs",val)}
  />*/}
        {/*<NumericCell
          isDecimal={true}
          value={s?.parameters?.vol}
          onChange={(val) => handleChangeSegment(row, "vol", val)}
/>*/}
        <SelectorCell<string>
          items={npss}
          itemKey={(val) => val}
          itemLabel={(val) => val}
          selected={s?.parameters?.nps}
          onSelect={(val) => handleChangeSegment(row, "nps", val)}
          filter={strFilter}
        />
        <SelectorCell<PipeProfile>
          items={profiles.filter((p) => p.nominal_pipe_size_inch === s?.parameters?.nps)}
          itemKey={(val) => val.piping_details_id}
          itemLabel={(val) => val.schedule}
          selected={s?.parameters?.profile}
          onSelect={(val) => handleChangeSegment(row, "profile", val)}
          filter={(q, i) => i.schedule.toLowerCase().includes(q.toLowerCase())}
        />
        <NumericCell
          isDecimal={true}
          value={s?.parameters?.od}
          disabled={!!s.parameters?.profile}
          onChange={(val) => handleChangeSegment(row, "od", val)}
        />
        <td style={sd ? (sd.length !== length ? { backgroundColor: "red" } : {}) : {}}>
          {sd?.length ?? length}
        </td>
        <td style={sd ? (sd.elevation !== elevation ? { backgroundColor: "red" } : {}) : {}}>
          {sd?.elevation ?? elevation}
        </td>
        {/*<NumericCell
          isDecimal={true}
          value={s?.parameters?.pressDrop}
          onChange={(val) => handleChangeSegment(row, "pressDrop", val)}
        />
        <NumericCell
          isDecimal={true}
          value={s?.parameters?.pressDropper}
          onChange={(val) => handleChangeSegment(row, "pressDropper", val)}
        />
        <NumericCell
          isDecimal={true}
          value={flowrate}
          onChange={(val) => handleChangeSegment(row, "velocity", val)}
        />
        <NumericCell
          isDecimal={true}
          value={inletPressure}
          onChange={(val) => handleChangeSegment(row, "P1", val)}
        />
        <NumericCell
          isDecimal={true}
          value={outletPressure}
          onChange={(val) => handleChangeSegment(row, "press2", val)}
        />
        <NumericCell
          isDecimal={true}
          value={s?.parameters?.T2}
          onChange={(val) => handleChangeSegment(row, "T2", val)}
        />*/}
        <td>{row.from}</td>
        <td>{row.to}</td>
      </tr>
    );
  }

  return (
    <CustomDlg
      title={"Hydraulics"}
      isMinimize={true}
      body={
        <div className={"d-flex f-column f-grow"}>
          <div className="label-light d-flex bg-dark">
            <Button
              small
              icon="export"
              text="Export to CSV"
              intent="success"
              onClick={handleExport}
            />
            <Button
              small
              icon="import"
              text="Import from CSV"
              intent="success"
              onClick={handleImport}
            />
            <Button
              small
              icon="import"
              text="create hydraulics calculation"
              intent= "success"
              onClick={handleButtonClick}
            />
          </div>
          <div className="hr" />
          <div className={"bg-dark p-5"}>
            <div className={"table-container"}>
              <table ref={tableRef} className="table bg-gray">
                <thead>
                  <tr>
                    <th>Variable</th>
                    {/*<th>Q</th>*/}
                    {/*<th>Prs</th>*/}
                    <th>Size</th>
                    <th>Sch</th>
                    <th>D</th>
                    <th>L</th>
                    <th>DE</th>
                    {/*<th>DP</th>
                    <th>DPL</th>
                    <th>Vel</th>
                    <th>P1</th>
                    <th>P2</th>
                    <th>T</th>*/}
                    <th>StartID</th>
                    <th>EndID</th>
                  </tr>
                  <tr>
                    <th style={{ top: offsetTop2 }}>UOM</th>
                    {/*<th style={{ top: offsetTop2,backgroundColor: "#FF0000" }}>
                      m<sup>3</sup>/s
      </th>*/}
                    {/*<th style={{ top: offsetTop2,backgroundColor: "#FF0000" }}>-</th>*/}
                    {/*<th style={{ top: offsetTop2 }}>-</th>*/}
                    <th style={{ top: offsetTop2 }}>-</th>
                    <th style={{ top: offsetTop2 }}>-</th>
                    <th style={{ top: offsetTop2 }}>mm</th>
                    <th style={{ top: offsetTop2 }}>m</th>
                    <th style={{ top: offsetTop2 }}>m</th>
                    {/*<th style={{ top: offsetTop2 }}>kPa</th>
                    <th style={{ top: offsetTop2 }}>kPa/100m</th>
                    <th style={{ top: offsetTop2 }}>m/s</th>
                    <th style={{ top: offsetTop2 }}>kPa</th>
                    <th style={{ top: offsetTop2 }}>kPa</th>
    <th style={{ top: offsetTop2 }}>C</th>*/}
                    <th style={{ top: offsetTop2 }}>-</th>
                    <th style={{ top: offsetTop2 }}>-</th>
                  </tr>
                  <tr>
                    <th style={{ top: offsetTop3 }}>Description</th>
                    <th style={{ top: offsetTop3 }}>Liq</th>
                    <th style={{ top: offsetTop3 }}>Pressure</th>
                    <th style={{ top: offsetTop3 }}></th>
                    <th style={{ top: offsetTop3 }}></th>
                    <th style={{ top: offsetTop3 }}></th>
                    {/*<th style={{ top: offsetTop3 }}></th>
                    <th style={{ top: offsetTop3 }}>Elevation</th>
                    <th style={{ top: offsetTop3 }}>Press</th>
                    <th style={{ top: offsetTop3 }}>Pressure</th>
                    <th style={{ top: offsetTop3 }}></th>
  <th style={{ top: offsetTop3 }}></th>*/}
                    <th style={{ top: offsetTop3 }}></th>
                    <th style={{ top: offsetTop3 }}></th>
                    {/*<th style={{ top: offsetTop3 }} colSpan={2}>
                      Equip. ID
    </th>*/}
                  </tr>
                  <tr>
                    <th style={{ top: offsetTop4 }}>Model Name</th>
                    {/*<th style={{ top: offsetTop4, backgroundColor : "#FF0000" }}>Vol</th>*/}
                    {/*<th style={{ top: offsetTop4, backgroundColor : "#FF0000" }}>app pres</th>*/}
                    <th style={{ top: offsetTop4 }}>Size</th>
                    <th style={{ top: offsetTop4 }}>Schedule</th>
                    <th style={{ top: offsetTop4 }}>Diameter</th>
                    <th style={{ top: offsetTop4 }}>Length</th>
                    <th style={{ top: offsetTop4 }}>change</th>
                    {/*<th style={{ top: offsetTop4 }}>drop</th>
                    <th style={{ top: offsetTop4 }}>drop per 100 m</th>
                    <th style={{ top: offsetTop4 }}>Velocity</th>
                    <th style={{ top: offsetTop4 }}>Press</th>
                    <th style={{ top: offsetTop4 }}>Press</th>
  <th style={{ top: offsetTop4 }}>Temp</th>*/}
                    <th style={{ top: offsetTop4 }}>At Start</th>
                    <th style={{ top: offsetTop4 }}>At End</th>
                  </tr>
                </thead>
                <tbody>{data.map(getRow)}</tbody>
              </table>
              



              <table>
                <thead>
                  <tr>
                    <th style={{border : "1px solid #dddddd", padding: "2px"}}>Equipment Name</th>
                    <th style={{border : "1px solid #dddddd", padding: "2px"}}>Equipment Number</th>
                    <th style={{border : "1px solid #dddddd", padding: "2px"}}>Demand</th>
                    <th style={{border : "1px solid #dddddd", padding: "2px"}}>Presssure</th>
                    <th style={{border : "1px solid #dddddd", padding: "2px"}}>Enthalpy</th>
                  </tr>
                </thead>
                <tbody>
                  {vertexRows.map((row) =>(
                    <tr key = {row.equipmentName}>
                      <td>{row.equipmentName}</td>
                      <td>{row.equipmentNo}</td>
                      <td>
                        <input type = "number"
                        step = "0.1"
                        value={row.demand ||""}
                        onChange={event => handleInputsChange(row.equipmentNo,'demand',event.target.value)}
                        />
                      </td>
                      <td>
                        <input type="number"
                        step = "0.1"
                        value = {row.pressure ||""}
                        onChange={event => handleInputsChange(row.equipmentNo,'pressure',event.target.value)}
                        />
                      </td>
                      <td>
                        <input type="number"
                        step = "0.1"
                        value={row.enthalpy ||""}
                        onChange={event => handleInputsChange(row.equipmentNo,"enthalpy",event.target.value)}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="debug-table-container"> 
              <table> 
                <thead> 
                  <tr>
                    <th style={{border : "1px solid #dddddd", padding: "2px"}}>Inlet Vertex</th>
                    <th style={{border : "1px solid #dddddd", padding: "2px"}}>Outlet Vertex</th>
                    <th style={{border : "1px solid #dddddd", padding: "2px"}}>Flowrate</th> 
                    <th style={{border : "1px solid #dddddd", padding: "2px"}}>Inlet Pressure</th> 
                    <th style={{border : "1px solid #dddddd", padding: "2px"}}>Outlet Pressure</th> 
                    <th style={{border : "1px solid #dddddd", padding: "2px"}}>Pipe Enthalpy</th> 
                  </tr> 
                </thead> 
                <tbody> 
                  {debugData.map((item, index) => ( 
                    <tr key={index}> 
                    <td style={{border : "1px solid #dddddd", padding: "2px"}}>{item['inlet vertex']}</td>
                    <td style={{border : "1px solid #dddddd", padding: "2px"}}>{item['outlet vertex']}</td>
                    <td style={{border : "1px solid #dddddd", padding: "2px"}}>{item.flowrate}</td> 
                    <td style={{border : "1px solid #dddddd", padding: "2px"}}>{item['inlet pressure']}</td> 
                    <td style={{border : "1px solid #dddddd", padding: "2px"}}>{item['outlet pressure']}</td> 
                    <td style={{border : "1px solid #dddddd", padding: "2px"}}>{item['pipe enthalpy']}</td> 
                    </tr> ))} 
                </tbody>
              </table> 
            </div> 

            </div>
          </div>
        </div>
      }
     
      onClose={onClose}
    />
  );
}
