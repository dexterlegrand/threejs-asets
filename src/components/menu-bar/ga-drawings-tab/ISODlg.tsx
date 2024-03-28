import React, { useEffect, useMemo, useRef, useState } from "react";
import { useRecoilState } from "recoil";
import {
  isoState,
  TISODataItem,
  TISODataItemSupport,
  TISOState,
} from "../../../recoil/atoms/iso-atoms";
import { Button, FormGroup, Icon, ProgressBar } from "@blueprintjs/core";
import { CustomDlg } from "../../common/CustomDlg";
import { SimpleSelector } from "../../common/SimpleSelector";
import {
  arrayToString,
  checkImportedNumber,
  convertToVector3,
  exportToCSV,
  fixNumberToStr,
  getMiddleVector3,
  getNextId,
  getUnicuesArray,
  importFromCSV,
  MMtoM,
  MtoMM,
  openFile,
  round,
  roundM,
  roundVectorM,
  strFilter,
  stringToArray,
} from "../../3d-models/utils";
import GenericTable, {
  TDataField,
  TField,
  THeader,
  THeaderColumn,
} from "../../common/table/GenericTable";
import { DataState } from "../../../store/data/types";
import { useDispatch, useSelector } from "react-redux";
import { ApplicationState } from "../../../store";
import { getFullReleases } from "../../3d-models/pipes/pipesUtils";
import { SelectorCell } from "../../common/SelectorCell";
import { NumericCell } from "../../common/NumericCell";
import { SupportValuesDetails } from "../analysis-tab/piping/SupportValuesDetails";
import { FreePipe } from "../../../store/main/types";
import { setPipesAction } from "../../../store/main/actions";
import { initialPipe } from "../../../store/main/constants";
import { getPrecedingDirs } from "../../../services/pipe-services/pipe-service";
import { CheckBoxCell } from "../../common/CheckBoxCell";
import { GeneralCheckBoxCell } from "../../common/GeneralCheckBoxCell";
import { RadioCell } from "../../common/RadioCell";
import Axios from "axios";
import { saveAs } from "file-saver";
import { read, utils, WorkBook } from "xlsx";
import { addEventAction } from "../../../store/ui/actions";
import { Paginator } from "../../common/Paginator";

type Props = {
  onClose: () => any;
};

type TFileType = "DXF" | "PNG" | "PDF";

type TFile = {
  selected: boolean;
  file: File;
  mode: TFileType;
};

type XLSFiles = {
  [key: string]: Blob;
};

const temp = "ELEMENTS";
const elementTypes = [
  "PIPE",
  "FITTINGS",
  "FLANGES",
  "INSTRUMENTS",
  "GASKETS",
  "BOLTS",
  "VALVES / IN-LINE ITEMS",
  "SUPPORTS",
];
const elementGroups = ["FABRICATION MATERIALS", "ERECTION MATERIALS"];

export function ISODlg({ onClose }: Props) {
  const [inProgress, setInProgress] = useState(false);
  const [mode, setMode] = useState<TFileType>("DXF");
  const [files, setFiles] = useState<TFile[]>([]);
  const [xlsFiles, setXLSFiles] = useState<XLSFiles>({});
  const [file, setFile] = useState<TFile>();

  const [ISO, setISO] = useRecoilState(isoState);

  const dispatch = useDispatch();

  const resoures = useSelector((state: ApplicationState) => state.data);

  function handleChangeISO(field: string, value: any) {
    setISO((prev) => ({ ...prev, [field]: value }));
  }

  function handleUploadDXF() {
    new Promise<File>((res, rej) => {
      openFile([".dxf"], (files) => {
        const file = files[0];
        file ? res(file) : rej();
      });
    }).then((file: File) => {
      setFile({ selected: false, file, mode: "DXF" });
      setFiles((prev) => [...prev, { selected: false, file, mode: "DXF" }]);
      setMode("DXF");
    });
  }

  function handleUploadPNG() {
    new Promise<File>((res, rej) => {
      openFile([".png"], (files) => {
        const file = files[0];
        file ? res(file) : rej();
      });
    }).then((file: File) => {
      setFile({ selected: false, file, mode: "PNG" });
      setFiles((prev) => [...prev, { selected: false, file, mode: "PNG" }]);
      setMode("PNG");
    });
  }

  function handleUploadPDF() {
    new Promise<File[]>((res) => {
      openFile(
        [".pdf"],
        (files) => {
          const pdfs = files.filter((f) => f.type === "application/pdf");
          res(pdfs);
        },
        true
      );
    }).then((files: File[]) => {
      setFile({ selected: false, file: files[0], mode: "PDF" });
      setFiles((prev) => [
        ...prev,
        ...files.map(
          (file) => ({ selected: false, file, mode: "PDF" } as TFile)
        ),
      ]);
      setMode("PDF");
    });
  }

  async function handleConvert() {
    setInProgress(true);
    if (mode === "PDF") {
      const API_KEY =
        "technical@asetslux.com_79ea6fec494cd63db5ed2cbcda5264074a5028dc06f629a3d75d89d2ac75d5b82485f2b3";
      // "mrvakerman@gmail.com_4a6a5da2ee02d311b77936157b6fb8b748915977639ff97831cd657a046234790a779c6a";
      for (const file of files.filter(
        (f) =>
          f.selected && !Object.keys(xlsFiles).includes(getXLSFileName(f.file))
      )) {
        try {
          const respA = await Axios.get(
            `https://api.pdf.co/v1/file/upload/get-presigned-url?contenttype=application/octet-stream&name=${file.file.name}`,
            {
              headers: { "x-api-key": API_KEY },
            }
          );
          const data = respA.data;
          if (!data.error) {
            await Axios.put(data.presignedUrl, file.file, {
              headers: {
                "Content-Type": "application/octet-stream",
              },
            });
            const destinationFile = getXLSFileName(file.file);
            const jsonPayload = JSON.stringify({
              name: destinationFile,
              password: "",
              pages: "",
              url: data.url,
            });
            const resp = await Axios.post(
              "https://api.pdf.co/v1/pdf/convert/to/xls",
              jsonPayload,
              {
                headers: {
                  "x-api-key": API_KEY,
                  "Content-Type": "application/json",
                  "Content-Length": Buffer.byteLength(jsonPayload, "utf8"),
                },
              }
            );
            const respdata = resp.data;
            if (!respdata.error) {
              const fileresp = await fetch(respdata.url);
              const blob = await fileresp.blob();
              setXLSFiles((prev) => ({ ...prev, [destinationFile]: blob }));
            }
          }
        } catch (error) {
          console.error(error);
          dispatch(addEventAction((error as any).message, "danger"));
          openFile(
            [".xls", ".xlsx"],
            (files) => {
              setXLSFiles((prev) => {
                let changed = { ...prev };
                for (const file of files) {
                  const destinationFile = getXLSFileName(file);
                  changed = { ...changed, [destinationFile]: file };
                }
                return changed;
              });
            },
            true
          );
        }
      }
      setInProgress(false);
    } else {
      setTimeout(() => setInProgress(false), 3000);
    }
  }

  function handleImportToIDS() {
    let pipes: FreePipe[] = [];
    for (const item of ISO.data) {
      const start = roundVectorM(convertToVector3(item.start_M));
      const end = roundVectorM(convertToVector3(item.end_M));
      const length = roundM(start.distanceTo(end));
      const elevation = roundM(getMiddleVector3(start, end).y);
      const profile =
        item.lib && item.nps && item.schedule
          ? resoures.pipingSS.find(
              (p) =>
                p.country_code === item.lib &&
                p.nominal_pipe_size_inch === item.nps &&
                p.schedule === item.schedule
            )
          : undefined;
      const pipe: FreePipe = {
        ...initialPipe,
        id: item.id,
        pipe: item.name,
        line: item.line,
        tag: item.tag,
        preceding: item.preceding,
        x1: start.x,
        y1: start.y,
        z1: start.z,
        x2: end.x,
        y2: end.y,
        z2: end.z,
        length,
        elevation,
        params: {
          ...initialPipe.params,
          lib: profile?.country_code,
          nps: profile?.nominal_pipe_size_inch,
          profile,
          od: profile?.outside_diameter_global,
          thickness: profile?.wall_thickness_global,
          fluidDensity: item.fluidDensity,
          numberOfSupports: item.numberOfRestraints,
          supportDetails: item.supports,
        },
      };
      pipes.push(pipe);
    }
    pipes = pipes.map((p) => {
      const prev = pipes.find((prev) => prev.pipe === p.preceding);
      return { ...p, ...getPrecedingDirs(prev, p) };
    });
    dispatch(setPipesAction(pipes));
  }

  return (
    <CustomDlg
      zIndex={10}
      isMinimize={true}
      position={"center"}
      title={"Import From Isometric View"}
      body={
        <div className="d-flex f-grow f-column bg-dark">
          <div
            className="label-light bg-dark d-flex f-ai-center"
            style={{ paddingRight: 10, gap: 10 }}
          >
            <FormGroup className="no-m w-100">
              <SimpleSelector<string>
                items={["Viewer", "Table"]}
                selected={ISO.tab}
                onSelect={(value) => value && handleChangeISO("tab", value)}
                itemLabel={(item) => item}
                className="fill-select"
              />
            </FormGroup>
            {ISO.tab === "Viewer" ? (
              <>
                <FormGroup className="no-m w-80">
                  <SimpleSelector<TFileType>
                    items={["DXF", "PNG", "PDF"]}
                    selected={mode}
                    onSelect={(val) => val && setMode(val)}
                    itemLabel={(item) => item}
                    className="fill-select"
                  />
                </FormGroup>
                {files.some((f) => f.selected) ? (
                  <Button
                    small
                    text={"Delete"}
                    intent={"warning"}
                    onClick={() => {
                      if (
                        file &&
                        files.some((f) => f.file.name === file.file.name)
                      )
                        setFile(undefined);
                      setFiles((prev) => prev.filter((el) => !el.selected));
                    }}
                  />
                ) : null}

                <Button
                  small
                  text={`Upload ${mode}`}
                  intent="danger"
                  onClick={() =>
                    mode === "DXF"
                      ? handleUploadDXF()
                      : mode === "PNG"
                      ? handleUploadPNG()
                      : handleUploadPDF()
                  }
                  className={"no-m"}
                />
                {file?.mode ? (
                  <Button
                    small
                    text={
                      mode !== "PDF"
                        ? `Convert ${mode} to ISO`
                        : `Convert PDF to XLS`
                    }
                    intent="success"
                    disabled={inProgress}
                    onClick={handleConvert}
                    className={"no-m"}
                  />
                ) : null}
                {file?.mode === "PDF" ? (
                  <>
                    <Button
                      small
                      text={`Editable version`}
                      intent="success"
                      disabled={
                        !Object.keys(xlsFiles).some(
                          (k) => k === getXLSFileName(file?.file)
                        )
                      }
                      onClick={() => {
                        const name = getXLSFileName(file.file);
                        const blob = xlsFiles[name];
                        blob && saveAs(blob, name);
                      }}
                      className={"no-m"}
                    />
                    <Button
                      small
                      text={`Download CSV`}
                      intent="success"
                      disabled={!files.some((f) => f.selected)}
                      onClick={() => {
                        setInProgress(true);
                        handleDownloadCSV(files, xlsFiles)
                          .then((rows) => {
                            exportToCSV(rows, "results");
                          })
                          .finally(() => setInProgress(false));
                      }}
                      className={"no-m"}
                    />
                  </>
                ) : null}
              </>
            ) : null}
            {ISO.data.length ? (
              <Button
                small
                text="Import To IDS"
                intent="success"
                onClick={handleImportToIDS}
                className={"no-m"}
              />
            ) : null}
          </div>
          <div className={"hr"} />
          {inProgress ? (
            <>
              <ProgressBar />
              <div className={"hr"} />
            </>
          ) : null}
          {ISO.tab === "Viewer" ? (
            <div
              className={"d-flex f-grow"}
              style={{ position: "relative", overflow: "hidden" }}
            >
              <div className="p-5">
                <div className="table-container">
                  <table className="table bg-gray">
                    <thead>
                      <tr>
                        <th></th>
                        <GeneralCheckBoxCell data={files} onChange={setFiles} />
                        <th className={"w-150"}>File</th>
                        <th className={"w-50"}>Type</th>
                        {mode === "PDF" ? <th>XLS</th> : null}
                      </tr>
                    </thead>
                    <tbody>
                      {files.map((f) => (
                        <tr key={f.file.name}>
                          <RadioCell
                            key={`radio-${f.file.name}`}
                            value={file?.file.name === f.file.name}
                            onChange={(value) => {
                              if (!value) return;
                              setFile(f);
                              setMode(f.mode);
                            }}
                          />
                          <CheckBoxCell
                            key={f.file.name}
                            value={f.selected}
                            onChange={(selected) => {
                              setFiles((prev) =>
                                prev.map((el) =>
                                  el.file.name === f.file.name
                                    ? { ...el, selected }
                                    : el
                                )
                              );
                            }}
                          />
                          <td>{f.file.name}</td>
                          <td>{f.mode}</td>
                          {mode === "PDF" ? (
                            <td>
                              {Object.keys(xlsFiles).includes(
                                getXLSFileName(f.file)
                              ) ? (
                                <Icon icon={"tick"} />
                              ) : (
                                <Icon icon={"cross"} />
                              )}
                            </td>
                          ) : null}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
              <ISOViewer
                mode={mode}
                resoures={resoures}
                ISO={ISO}
                onChange={handleChangeISO}
                dxFile={file?.mode === "DXF" ? file.file : undefined}
                pngFile={file?.mode === "PNG" ? file.file : undefined}
                pdfFile={file?.mode === "PDF" ? file.file : undefined}
              />
            </div>
          ) : null}
          {ISO.tab === "Table" ? (
            <ISOTable
              resoures={resoures}
              ISO={ISO}
              onChange={handleChangeISO}
            />
          ) : null}
        </div>
      }
      onClose={onClose}
    />
  );
}

type ISOProps = {
  mode?: TFileType;
  resoures: DataState;
  ISO: TISOState;
  dxFile?: File;
  pngFile?: File;
  pdfFile?: File;
  onChange: (field: string, value: any) => any;
};

function ISOViewer({ mode, resoures, dxFile, pngFile, pdfFile }: ISOProps) {
  const [inProgress, setInProgress] = useState(false);

  const dxfContainer = useRef<HTMLDivElement>(null);
  const pngContainer = useRef<HTMLImageElement>(null);
  const pdfContainer = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    if (!pdfFile || mode !== "PDF" || !pdfContainer.current) return;
    const reader = new FileReader();
    reader.readAsDataURL(pdfFile);
    reader.onload = () => {
      //@ts-ignore
      pdfContainer.current!.src = reader.result;
    };
    reader.onerror = (error) => {
      console.error(error);
    };
  }, [pdfFile, mode, pdfContainer.current]);

  useEffect(() => {
    if (!pngFile || mode !== "PNG" || !pngContainer.current) return;
    const reader = new FileReader();
    reader.readAsDataURL(pngFile);
    reader.onload = () => {
      //@ts-ignore
      pngContainer.current!.src = reader.result;
    };
    reader.onerror = (error) => console.error(error);
  }, [pngFile, mode, pngContainer.current]);

  useEffect(() => {
    if (!dxFile || mode !== "DXF") return;
    setInProgress(true);
    loadDxf(dxFile).finally(() => setInProgress(false));
  }, [mode, dxFile]);

  async function loadDxf(file: File) {
    if (!resoures.font || !dxfContainer.current) return;
    return new Promise((res, rej) => {
      const reader = new FileReader();
      reader.onloadend = (e) => {
        const fileReader = e.target;
        if (!fileReader) return;
        // @ts-ignore
        const parser = new window.DxfParser();
        const dxf = parser.parseSync(fileReader.result?.toString() ?? "");
        res(
          // @ts-ignore
          new window.ThreeDxf.Viewer(
            dxf,
            dxfContainer.current,
            1000,
            800,
            resoures.font
          )
        );
      };
      reader.onerror = rej;
      reader.onabort = rej;
      reader.readAsText(file);
    });
  }

  return (
    <div
      className={"d-flex f-column f-grow"}
      style={{ position: "relative", overflow: "hidden" }}
    >
      {inProgress ? (
        <>
          <ProgressBar />
          <div className={"hr"} />
        </>
      ) : null}
      {mode === "DXF" ? (
        <div
          id={"svg-container"}
          key={`${dxFile?.name}`}
          ref={dxfContainer}
          className={"p-5"}
          style={{
            position: "relative",
            overflow: "auto",
            maxHeight: "65vh",
            maxWidth: "80vw",
          }}
        />
      ) : null}
      {mode === "PNG" ? (
        <img
          ref={pngContainer}
          style={{
            position: "relative",
            overflow: "auto",
            maxHeight: "65vh",
            maxWidth: "80vw",
          }}
        />
      ) : null}
      {mode === "PDF" ? (
        <iframe
          ref={pdfContainer}
          style={{
            position: "relative",
            overflow: "auto",
            height: "50vh",
            width: "50vw",
          }}
        />
      ) : null}
    </div>
  );
}

function ISOTable({ resoures, ISO, onChange }: ISOProps) {
  const [item, setItem] = useState<TISODataItem>();
  const [support, setSupport] = useState<TISODataItemSupport>();
  const [dialog, setDialog] = useState<JSX.Element>();
  const [paged, setPaged] = useState<TDataField[]>([]);

  useEffect(() => {
    if (!item) return;
    setItem(ISO.data.find((i) => i.id === item.id));
  }, [ISO.data, item]);

  useEffect(() => {
    if (!item || !support) return;
    setSupport(item?.supports.find((s) => s.id === support.id));
  }, [item, support]);

  useEffect(() => {
    if (!item || !support) return;
    setDialog(
      <SupportDetailsDlg
        item={item}
        supp={support}
        onChange={(changed) => {
          handleChangeData(item, "support", changed);
        }}
        onClose={() => {
          setItem(undefined);
          setSupport(undefined);
          setDialog(undefined);
        }}
      />
    );
  }, [item, support]);

  const libs = useMemo(() => {
    return getUnicuesArray(
      resoures.pipingSS.map((profile) => profile.country_code?.trim() ?? "")
    );
  }, [resoures.pipingSS]);

  const pipeMaterials = useMemo(() => {
    return resoures.materials
      .filter((m) => m.material_type === "PIPING")
      .map((m) => m.material_name);
  }, [resoures.materials]);

  const { supportColumnsCount, dataFields } = useMemo(() => {
    const tags = getUnicuesArray(ISO.data.map((item) => item.tag));
    const precedings = ["START", ...ISO.data.map((item) => item.name)];
    const supportColumnsCount = ISO.data.reduce((max, item) => {
      return Math.max(max, item.supports.length);
    }, 0);
    return {
      supportColumnsCount,
      dataFields: ISO.data.map((item) => {
        const filteredProfiles = item.lib
          ? resoures.pipingSS.filter(
              (profile) =>
                profile.country_code === item.lib &&
                profile.outside_diameter_global &&
                profile.wall_thickness_global
            )
          : [];
        const NPSs = getUnicuesArray(
          filteredProfiles.map((profile) => profile.nominal_pipe_size_inch)
        );
        const schedules = item.nps
          ? getUnicuesArray(
              filteredProfiles
                .filter(
                  (profile) => profile.nominal_pipe_size_inch === item.nps
                )
                .map((p) => p.schedule)
            )
          : [];
        const fields: TField[] = [];
        fields.push({
          type: "SELECTOR",
          value: item.tag,
          props: {
            items: tags,
            selected: item.tag,
            itemLabel: (val) => val,
            onSelect: (val) => val && handleChangeData(item, "tag", val),
            onCreate: (val) => handleChangeData(item, "tag", val),
            filter: strFilter,
            clearable: true,
          },
        });
        fields.push({
          type: "NUMERIC",
          value: item.line,
          props: {
            value: item.line,
            onChange: (val: number) => handleChangeData(item, "line", val),
            disabled: item.preceding !== "START",
          },
        });
        fields.push({ type: "CELL", value: item.name });
        fields.push({
          type: "SELECTOR",
          value: item.preceding,
          props: {
            items: precedings.filter((p) => p !== item.name),
            selected: item.preceding,
            itemLabel: (val) => val,
            onSelect: (val) => handleChangeData(item, "preceding", val),
            filter: strFilter,
          },
        });
        fields.push({
          type: "NUMERIC",
          value: item.start_M.x,
          props: {
            isDecimal: true,
            value: item.start_M.x,
            onChange: (val: number) => handleChangeData(item, "start-x", val),
            disabled: item.preceding !== "START",
          },
        });
        fields.push({
          type: "NUMERIC",
          value: item.start_M.y,
          props: {
            isDecimal: true,
            value: item.start_M.y,
            onChange: (val: number) => handleChangeData(item, "start-y", val),
            disabled: item.preceding !== "START",
          },
        });
        fields.push({
          type: "NUMERIC",
          value: item.start_M.z,
          props: {
            isDecimal: true,
            value: item.start_M.z,
            onChange: (val: number) => handleChangeData(item, "start-z", val),
            disabled: item.preceding !== "START",
          },
        });
        fields.push({
          type: "NUMERIC",
          value: item.northing_MM,
          props: {
            value: item.northing_MM,
            onChange: (val: number) =>
              handleChangeData(item, "northing_MM", val),
          },
        });
        fields.push({
          type: "NUMERIC",
          value: item.easting_MM,
          props: {
            value: item.easting_MM,
            onChange: (val: number) =>
              handleChangeData(item, "easting_MM", val),
          },
        });
        fields.push({
          type: "NUMERIC",
          value: item.up_MM,
          props: {
            value: item.up_MM,
            onChange: (val: number) => handleChangeData(item, "up_MM", val),
          },
        });
        fields.push({ type: "CELL", value: item.end_M.x });
        fields.push({ type: "CELL", value: item.end_M.y });
        fields.push({ type: "CELL", value: item.end_M.z });
        fields.push({
          type: "SELECTOR",
          props: {
            items: libs,
            itemLabel: (v) => v,
            selected: item.lib,
            validator: (v) => libs.includes(v),
            validationPrompt: `This C/S Library not found! Please update`,
            onSelect: (v) => handleChangeData(item, "lib", v),
          },
        });
        fields.push({
          type: "SELECTOR",
          props: {
            items: NPSs,
            itemLabel: (v) => v,
            selected: item.nps,
            validator: (v) => NPSs.includes(v),
            validationPrompt: `This NPS not found! Please update`,
            onSelect: (v) => handleChangeData(item, "nps", v),
            filter: strFilter,
            clearable: true,
          },
        });
        fields.push({
          type: "SELECTOR",
          props: {
            items: schedules,
            itemLabel: (v) => v,
            selected: item.schedule,
            onSelect: (v) => handleChangeData(item, "schedule", v),
            filter: strFilter,
            clearable: true,
          },
        });
        fields.push({
          type: "SELECTOR",
          props: {
            items: pipeMaterials,
            itemLabel: (v) => v,
            selected: item.material,
            onSelect: (v) => handleChangeData(item, "material", v),
            filter: strFilter,
          },
        });
        fields.push({ type: "CELL", value: item.diameter ?? "" });
        fields.push({
          type: "NUMERIC",
          value: item.fluidDensity,
          props: {
            isDecimal: true,
            value: item.fluidDensity,
            onChange: (v: number) => handleChangeData(item, "fluidDensity", v),
          },
        });
        fields.push({
          type: "NUMERIC",
          value: item.operatingTemperature,
          props: {
            isDecimal: true,
            value: item.operatingTemperature,
            onChange: (v: number) =>
              handleChangeData(item, "operatingTemperature", v),
          },
        });
        fields.push({
          type: "NUMERIC",
          value: item.designTemperature,
          props: {
            isDecimal: true,
            value: item.designTemperature,
            onChange: (v: number) =>
              handleChangeData(item, "designTemperature", v),
          },
        });
        fields.push({
          type: "NUMERIC",
          value: item.designPressure,
          props: {
            isDecimal: true,
            value: item.designPressure,
            onChange: (v: number) =>
              handleChangeData(item, "designPressure", v),
          },
        });
        fields.push({
          type: "NUMERIC",
          value: item.testPressure,
          props: {
            isDecimal: true,
            value: item.testPressure,
            onChange: (v: number) => handleChangeData(item, "testPressure", v),
          },
        });
        fields.push({
          type: "NUMERIC",
          value: item.insulationThickness,
          props: {
            isDecimal: true,
            value: item.insulationThickness,
            onChange: (v: number) =>
              handleChangeData(item, "insulationThickness", v),
          },
        });
        fields.push({
          type: "INPUT",
          value: item.remark,
          props: {
            value: item.remark,
            onChange: (v: string) => handleChangeData(item, "remark", v),
          },
        });
        fields.push({
          type: "NUMERIC",
          value: item.numberOfRestraints,
          props: {
            min: 0,
            value: item.numberOfRestraints,
            onChange: (v: number) =>
              handleChangeData(item, "numberOfRestraints", v),
          },
        });
        for (let i = 0; i < supportColumnsCount; i++) {
          const supp = item.supports[i];
          if (supp) {
            fields.push({
              type: "CUSTOM",
              element: (
                <Button
                  minimal
                  text={supportToStr(supp)}
                  onClick={() => handleOpenSupportDetails(item, supp)}
                  style={{ color: "#dddddd" }}
                />
              ),
            });
          } else fields.push({ type: "CELL" });
        }
        return { id: item.id, fields };
      }),
    };
  }, [ISO.data, resoures.pipingSS, libs, pipeMaterials]);

  const header: THeader = useMemo(() => {
    const supportColumns: THeaderColumn[] = [];
    for (let i = 0; i < supportColumnsCount; i++) {
      supportColumns.push({ title: `Supp ${i + 1}`, rowSpan: 2 });
    }
    const firstColumns: THeaderColumn[] = [
      { title: "ID", rowSpan: 2 },
      { title: "Line. No.", rowSpan: 2 },
      { title: "Pipe No.", rowSpan: 2 },
      { title: "Preceding", rowSpan: 2 },
      { title: "Start Point (m)", colSpan: 3 },
      { title: "Directions (mm)", colSpan: 3 },
      { title: "End Point (m)", colSpan: 3 },
      { title: "C/S Lib.", rowSpan: 2 },
      { title: "NPS", rowSpan: 2 },
      { title: "Schedule", rowSpan: 2 },
      { title: "Material", rowSpan: 2 },
      { title: "Dia (m)", rowSpan: 2 },
      { title: "Fluid Density", rowSpan: 2 },
      { title: "Operating Temp", rowSpan: 2 },
      { title: "Design Temp", rowSpan: 2 },
      { title: "Design Pressure", rowSpan: 2 },
      { title: "Test Pressure", rowSpan: 2 },
      { title: "Insulation Thickness", rowSpan: 2 },
      { title: "Remarks", rowSpan: 2 },
      { title: "Number Of Restraints", rowSpan: 2 },
      ...supportColumns,
    ];

    const secondColumns: THeaderColumn[] = [
      { title: "X" },
      { title: "Y" },
      { title: "Z" },
      { title: "Northing" },
      { title: "Easting" },
      { title: "Up" },
      { title: "X" },
      { title: "Y" },
      { title: "Z" },
    ];
    return {
      rows: [{ columns: firstColumns }, { columns: secondColumns }],
    };
  }, [supportColumnsCount]);

  function handleAdd() {
    const id = getNextId(ISO.data);
    const line = getNextId(ISO.data, "line");
    const name = `PP${id}`;
    const item: TISODataItem = {
      id,
      line,
      name,
      tag: "",
      remark: "",
      preceding: "START",
      start_M: { x: 0, y: 0, z: 0 },
      end_M: { x: 0, y: 0, z: 0 },
      northing_MM: 0,
      easting_MM: 0,
      up_MM: 0,
      diameter: 0,
      fluidDensity: 0,
      designTemperature: 0,
      designPressure: 0,
      insulationThickness: 0,
      operatingTemperature: 0,
      testPressure: 0,
      numberOfRestraints: 0,
      supports: [],
    };
    onChange("data", [...ISO.data, item]);
  }

  function handleChangeData(item: TISODataItem, field: string, value: any) {
    let changed: TISODataItem = { ...item };
    let changedData: TISODataItem[] = [...ISO.data];
    const isNext = changedData.some((i) => i.preceding === changed.name);
    if (field === "numberOfRestraints") {
      if (value > item.supports.length) {
        for (let i = 0; i < value - item.supports.length; i++) {
          changed = {
            ...changed,
            numberOfRestraints: value,
            supports: [...changed.supports, handleAddSupp(changed.supports)],
          };
        }
      } else {
        changed = {
          ...changed,
          numberOfRestraints: value,
          supports: changed.supports.slice(0, value),
        };
      }
    } else if (field === "support") {
      changed = {
        ...changed,
        supports: changed.supports.map((s) => (s.id === value.id ? value : s)),
      };
    } else if (field === "start-x") {
      changed = {
        ...changed,
        start_M: { ...changed.start_M, x: value },
        end_M: {
          ...changed.end_M,
          x: !isNext
            ? roundM(value + MMtoM(changed.easting_MM))
            : changed.end_M.x,
        },
        easting_MM: isNext
          ? round(MtoMM(changed.end_M.x - value))
          : changed.easting_MM,
      };
    } else if (field === "start-y") {
      changed = {
        ...changed,
        start_M: { ...changed.start_M, y: value },
        end_M: {
          ...changed.end_M,
          y: !isNext ? roundM(value + MMtoM(changed.up_MM)) : changed.end_M.y,
        },
        up_MM: isNext ? round(MtoMM(changed.end_M.y - value)) : changed.up_MM,
      };
    } else if (field === "start-z") {
      changed = {
        ...changed,
        start_M: { ...changed.start_M, z: value },
        end_M: {
          ...changed.end_M,
          z: !isNext
            ? roundM(value + MMtoM(changed.northing_MM))
            : changed.end_M.z,
        },
        northing_MM: isNext
          ? round(MtoMM(changed.end_M.z - value))
          : changed.northing_MM,
      };
    } else if (field === "line") {
      changed = { ...changed, [field]: value };
      let current = changed.name;
      let next = changedData.find((i) => i.preceding === current);
      while (next) {
        changedData = changedData.map((i) =>
          i.id === next!.id ? { ...next!, [field]: value } : i
        );
        current = next.name;
        next = changedData.find((i) => i.preceding === current);
      }
    } else if (field === "preceding") {
      const prev = changedData.find((i) => i.name === value);
      if (!prev) return;
      const diff = {
        x: prev.end_M.x - changed.start_M.x,
        y: prev.end_M.y - changed.start_M.y,
        z: prev.end_M.z - changed.start_M.z,
      };
      changed = {
        ...changed,
        preceding: value,
        line: prev.line,
        start_M: {
          x: roundM(changed.start_M.x + diff.x),
          y: roundM(changed.start_M.y + diff.y),
          z: roundM(changed.start_M.z + diff.z),
        },
        end_M: {
          x: roundM(changed.end_M.x + diff.x),
          y: roundM(changed.end_M.y + diff.y),
          z: roundM(changed.end_M.z + diff.z),
        },
      };
      changedData = changedData.map((i) => (i.id === changed.id ? changed : i));
      let current = changed.name;
      let next = changedData.find((i) => i.preceding === current);
      while (next) {
        changedData = changedData.map((i) =>
          i.id === next!.id
            ? {
                ...next!,
                line: changed.line,
                start_M: {
                  x: roundM(next!.start_M.x + diff.x),
                  y: roundM(next!.start_M.y + diff.y),
                  z: roundM(next!.start_M.z + diff.z),
                },
                end_M: {
                  x: roundM(next!.end_M.x + diff.x),
                  y: roundM(next!.end_M.y + diff.y),
                  z: roundM(next!.end_M.z + diff.z),
                },
              }
            : i
        );
        current = next.name;
        next = changedData.find((i) => i.preceding === current);
      }
    } else if (field === "schedule") {
      const profile = resoures.pipingSS.find(
        (p) =>
          p.country_code === changed.lib &&
          p.nominal_pipe_size_inch === changed.nps &&
          p.schedule === value
      );
      changed = {
        ...changed,
        schedule: value,
        diameter: profile ? MMtoM(profile.outside_diameter_global) : 0,
      };
    } else if (field === "northing_MM") {
      const old = MMtoM(changed.northing_MM);
      const value_M = MMtoM(value);
      changed = {
        ...changed,
        northing_MM: value,
        end_M: {
          ...changed.end_M,
          z: roundM(changed.end_M.z - -old + -value_M),
        },
      };
      let next = changedData.find((i) => i.preceding === changed.name);
      while (next) {
        changedData = changedData.map((i) =>
          i.id === next!.id
            ? {
                ...next!,
                start_M: {
                  ...next!.start_M,
                  z: roundM(next!.start_M.z - -old + -value_M),
                },
                end_M: {
                  ...next!.end_M,
                  z: roundM(next!.end_M.z - -old + -value_M),
                },
              }
            : i
        );
        next = changedData.find((i) => i.preceding === next!.name);
      }
    } else if (field === "easting_MM") {
      const old = MMtoM(changed.easting_MM);
      const value_M = MMtoM(value);
      changed = {
        ...changed,
        easting_MM: value,
        end_M: { ...changed.end_M, x: roundM(changed.end_M.x - old + value_M) },
      };
      let next = changedData.find((i) => i.preceding === changed.name);
      while (next) {
        changedData = changedData.map((i) =>
          i.id === next!.id
            ? {
                ...next!,
                start_M: {
                  ...next!.start_M,
                  x: roundM(next!.start_M.x - old + value_M),
                },
                end_M: {
                  ...next!.end_M,
                  x: roundM(next!.end_M.x - old + value_M),
                },
              }
            : i
        );
        next = changedData.find((i) => i.preceding === next!.name);
      }
    } else if (field === "up_MM") {
      const old = MMtoM(changed.up_MM);
      const value_M = MMtoM(value);
      changed = {
        ...changed,
        up_MM: value,
        end_M: { ...changed.end_M, y: roundM(changed.end_M.y - old + value_M) },
      };
      let next = changedData.find((i) => i.preceding === changed.name);
      while (next) {
        changedData = changedData.map((i) =>
          i.id === next!.id
            ? {
                ...next!,
                start_M: {
                  ...next!.start_M,
                  y: roundM(next!.start_M.y - old + value_M),
                },
                end_M: {
                  ...next!.end_M,
                  y: roundM(next!.end_M.y - old + value_M),
                },
              }
            : i
        );
        next = changedData.find((i) => i.preceding === next!.name);
      }
    } else changed = { ...changed, [field]: value };
    changedData = changedData.map((i) => (i.id === changed.id ? changed : i));
    onChange("data", changedData);
  }

  function handleAddSupp(supports: TISODataItemSupport[]): TISODataItemSupport {
    const id = getNextId(supports);
    return { id, type: "Anchor", distance: 0, valueType: "K", Mu: 0 };
  }

  function handleOpenSupportDetails(
    item: TISODataItem,
    supp: TISODataItemSupport
  ) {
    setSupport(supp);
    setItem(item);
  }

  function handleDelete(elements: TDataField[]) {
    const changed = ISO.data.filter(
      (item) => !elements.some((el) => el.id === item.id)
    );
    onChange("data", changed);
  }

  function handleExport() {
    exportToCSV(
      ISO.data.map((item) => {
        return {
          ID: item.tag,
          "Line No.": item.line,
          "Pipe No.": item.name,
          Preceding: item.preceding,
          "Start X (m)": item.start_M.x,
          "Start Y (m)": item.start_M.y,
          "Start Z (m)": item.start_M.z,
          "Northing (mm)": item.northing_MM,
          "Easting (mm)": item.easting_MM,
          "Up (mm)": item.up_MM,
          "End X (m)": item.end_M.x,
          "End Y (m)": item.end_M.y,
          "End Z (m)": item.end_M.z,
          "C/S Lib.": item.lib ?? "",
          NPS: item.nps ? ` ${item.nps}` : "",
          Schedule: item.schedule ?? "",
          Material: item.material ?? "",
          "Dia (m)": fixNumberToStr(item.diameter),
          "Fluid Density": fixNumberToStr(item.fluidDensity),
          "Operating Temp": fixNumberToStr(item.operatingTemperature),
          "Design Temp": fixNumberToStr(item.designTemperature),
          "Design Pressure": fixNumberToStr(item.designPressure),
          "Test Pressure": fixNumberToStr(item.testPressure),
          "Insulation Thickness": fixNumberToStr(item.insulationThickness),
          Remarks: item.remark ?? "",
          "Number of Restraints": item.numberOfRestraints,
          "Restraints Details": arrayToString(item.supports.map(supportToStr)),
        };
      }),
      "ISO data"
    );
  }

  function supportToStr(supp: TISODataItemSupport) {
    return `${supp.type}_${supp.direction ?? ""}_${
      supp.distance
    }_${supp.valueType ?? ""}_${supp.x ?? ""}_${supp.y ?? ""}_${supp.z ??
      ""}_${supp.Rx ?? ""}_${supp.Ry ?? ""}_${supp.Rz ?? ""}_${supp.Mu ??
      ""}_${supp.masterNodeDist ?? ""}_${supp.masterNodePipe ?? ""}`;
  }

  function handleImport() {
    importFromCSV((data, isCSV) => {
      if (!isCSV) return;
      const pipes: TISODataItem[] = [];
      for (const item of data) {
        const name = item["Pipe No."];
        if (!name) continue;
        const id = getNextId(pipes);
        const line = checkImportedNumber(item["Line No."], false) ?? id;
        const preceding = item["Preceding"].trim();
        const tag = item["ID"];
        const sx = roundM(checkImportedNumber(item["Start X (m)"]) ?? 0);
        const sy = roundM(checkImportedNumber(item["Start Y (m)"]) ?? 0);
        const sz = roundM(checkImportedNumber(item["Start Z (m)"]) ?? 0);
        const ex = roundM(checkImportedNumber(item["End X (m)"]) ?? 0);
        const ey = roundM(checkImportedNumber(item["End Y (m)"]) ?? 0);
        const ez = roundM(checkImportedNumber(item["End Z (m)"]) ?? 0);
        const northing_MM = checkImportedNumber(item["Northing (mm)"]) ?? 0;
        const easting_MM = checkImportedNumber(item["Easting (mm)"]) ?? 0;
        const up_MM = checkImportedNumber(item["Up (mm)"]) ?? 0;
        const lib = item["C/S Lib."].trim();
        const nps = `${item["NPS"]}`.trim();
        let schedule = "";
        if (item["Schedule"]) {
          if (Number.isInteger(item["Schedule"])) {
            schedule = `${item["Schedule"]}`;
          } else schedule = item["Schedule"].trim();
        }
        const material = item["Material"].trim();
        const profile = resoures.pipingSS.find(
          (p) =>
            p.country_code === lib &&
            p.nominal_pipe_size_inch === nps &&
            p.schedule === schedule
        );
        const fluidDensity = checkImportedNumber(item["Fluid Density"]) ?? 0;
        const operatingTemperature =
          checkImportedNumber(item["Operating Temp"]) ?? 0;
        const designTemperature = checkImportedNumber(item["Design Temp"]) ?? 0;
        const designPressure =
          checkImportedNumber(item["Design Pressure"]) ?? 0;
        const testPressure = checkImportedNumber(item["Test Pressure"]) ?? 0;
        const insulationThickness =
          checkImportedNumber(item["Insulation Thickness"], false) ?? 0;
        const remark = item["Remarks"];
        const supports = stringToArray(item["Restraints Details"])
          .filter((val) => val)
          .map((d, i) => {
            const arr = `${d}`.split("_");
            const type = `${arr[0]}`.trim() as any;
            const direction = `${arr[1]}`.trim() as any;
            const valueType = `${arr[3]}`.trim() as any;
            const supp: TISODataItemSupport = {
              id: i + 1,
              type,
              direction,
              distance: checkImportedNumber(arr[2], false) ?? 0,
              valueType,
              x: getRelease(type, arr[4], "X"),
              y: getRelease(type, arr[5], "Y"),
              z: getRelease(type, arr[6], "Z"),
              Rx: getRelease(type, arr[7]),
              Ry: getRelease(type, arr[8]),
              Rz: getRelease(type, arr[9]),
              Mu: checkImportedNumber(arr[10]) ?? 0,
            };
            return supp;
          });
        const numberOfRestraints = supports.length;
        const pipe: TISODataItem = {
          id,
          tag,
          name,
          line,
          preceding,
          start_M: { x: sx, y: sy, z: sz },
          northing_MM,
          easting_MM,
          up_MM,
          end_M: { x: ex, y: ey, z: ez },
          lib,
          nps,
          schedule,
          material,
          diameter: profile
            ? roundM(MMtoM(profile.outside_diameter_global))
            : 0,
          fluidDensity,
          designPressure,
          designTemperature,
          insulationThickness,
          operatingTemperature,
          testPressure,
          remark,
          numberOfRestraints,
          supports,
        };
        pipes.push(pipe);
      }
      onChange("data", pipes);
    });
  }

  function getRelease(type: string, value: any, dir?: "X" | "Y" | "Z") {
    if (type.includes("Custom")) {
      return value
        ? value === "Released"
          ? "Released"
          : `${Number(value) || 0}`
        : undefined;
    } else if (type === "Sliding X" && dir === "X") {
      return "Released";
    } else if (type === "Sliding Y" && dir === "Y") {
      return "Released";
    } else if (type === "Sliding Z" && dir === "Z") {
      return "Released";
    }
    return undefined;
  }

  return (
    <>
      {dialog}
      <GenericTable
        header={header}
        dataFields={paged}
        onAdd={handleAdd}
        onDelete={handleDelete}
        onExport={handleExport}
        onImport={handleImport}
      />
      <div className="hr" />
      <Paginator items={dataFields} onChange={setPaged} />
    </>
  );
}

type TISOSupportProps = {
  item: TISODataItem;
  supp: TISODataItemSupport;
  onChange: (supp: TISODataItemSupport) => any;
  onClose: () => any;
};

const types = [
  "Anchor",
  "Sliding",
  "Custom",
  "Custom+",
  "Custom-",
  "Slave Node",
  "Hanger",
];

const directions = ["X", "Y", "Z", "RX", "RY", "RZ"];

const valueTypes = ["K", "δ allow.", "δ appl."];

const R = "Released";

function SupportDetailsDlg({
  item,
  supp,
  onChange,
  onClose,
}: TISOSupportProps) {
  const [dialog, setDialog] = useState<JSX.Element>();

  function handleChange(field: string, value: any) {
    let changed = { ...supp, [field]: value };
    if (field === "type" || field === "direction" || field === "valueType") {
      changed = getFullReleases(changed);
    }
    onChange(changed);
  }

  function getRow(row: TISODataItemSupport) {
    const isK = row.valueType === "K";
    const isSliding = row.type === "Sliding";
    const isHanger = row.type === "Hanger";
    return (
      <tr key={row.id}>
        <td>{row.id}</td>
        <SelectorCell<string>
          items={types}
          itemKey={(item) => item}
          itemLabel={(item) => item}
          selected={row.type}
          validator={(value) => types.some((val) => val === value)}
          validationPrompt={`Not found!`}
          onSelect={(value) => handleChange("type", value)}
          className={"w-100"}
        />
        <SelectorCell<string>
          items={directions.filter((d) => !d.includes(R))}
          itemKey={(item) => item}
          itemLabel={(item) => item}
          selected={row.direction}
          validator={(value) => directions.includes(value)}
          validationPrompt={`Not found!`}
          disabled={row.type === "Anchor" || row.type === "Slave Node"}
          onSelect={(value) => handleChange("direction", value)}
          className={"w-100"}
        />
        <NumericCell
          isDecimal={true}
          min={0}
          value={row.distance}
          onChange={(value) => handleChange("distance", value)}
          className={"w-100"}
        />
        <SelectorCell<string>
          items={valueTypes}
          itemKey={(item) => item}
          itemLabel={(item) => item}
          selected={row.valueType}
          validator={(value) => valueTypes.includes(value)}
          validationPrompt={`Not found!`}
          disabled={!row.type.includes("Custom")}
          onSelect={(value) => handleChange("valueType", value)}
          className={"w-100"}
        />
        <td>
          <Button
            small
            minimal
            icon={"menu"}
            intent={"primary"}
            className={"c-light"}
            disabled={isHanger}
            onClick={() => {
              setDialog(
                <SupportValuesDetails
                  supp={row}
                  onClose={() => setDialog(undefined)}
                  onSave={(changed) => {
                    onChange(changed);
                    setDialog(undefined);
                  }}
                />
              );
            }}
          />
        </td>
        <NumericCell
          min={isK && !isSliding ? 0 : undefined}
          max={isK && !isSliding ? 0 : undefined}
          value={row.Mu}
          isDecimal={true}
          disabled={isK && !isSliding}
          onChange={(val) => handleChange("Mu", val)}
          className={"w-100"}
        />
      </tr>
    );
  }

  return (
    <>
      <CustomDlg
        title={`Support Details of Pipe "${item.name}"`}
        zIndex={11}
        onClose={onClose}
        body={
          <div className="d-flex f-column">
            <div className="hr" />
            <div className="p-5 bg-dark">
              <div className={"small-table-container"}>
                <table className="table bg-gray">
                  <thead>
                    <tr>
                      <th>No.</th>
                      <th>Type</th>
                      <th>Direction</th>
                      <th>Distance from Pipe start (m)</th>
                      <th>K / δ</th>
                      <th>K / δ details</th>
                      <th>µ</th>
                    </tr>
                  </thead>
                  <tbody>{getRow(supp)}</tbody>
                </table>
              </div>
            </div>
          </div>
        }
      />
      {dialog}
    </>
  );
}

function getXLSFileName(file: File) {
  return file ? `${file.name.replace("pdf", "").replace("PDF", "")}xls` : "";
}

function findKeyFieldByCondition(
  row: { [key: string]: string },
  condition: (value: any) => boolean
) {
  const field = Object.entries(row).find(([key, value]) => condition(value));
  return field ? field[0] : undefined;
}

function findKeyFieldByValue(row: { [key: string]: string }, search: string) {
  return findKeyFieldByCondition(row, (value) => value === search);
}

async function handleDownloadCSV(
  files: TFile[],
  xlsFiles: { [key: string]: Blob }
) {
  // const selected = files
  //   .filter((f) => f.selected)
  //   .map((f) => getXLSFileName(f.file));
  const blobs = Object.entries(xlsFiles)
    // .filter(([key, _]) => selected.includes(key))
    .map(([_, blob]) => blob);
  const row = {
    [temp]: [] as Object[],
    "USED ON": "",
    "DOC NO": "",
    "DRG. NO": "",
    "WORK PACKAGE / AREA DESCRIPTION": "",
    "WORK PACKAGE / AREA NAME": "",
    "UNIT CODE": "",
    REV: "",
  };
  const rows: any[] = [];
  for (const blob of blobs) {
    const workbook = await getXLSSheets(blob);
    for (const sheetName of workbook.SheetNames) {
      const sheet = workbook.Sheets[sheetName];
      if (!sheet) continue;
      let current = { ...row, secondRows: [] as any };
      let currentI = undefined;
      let currentElement = {
        groupType: "",
        elementType: "",
        type: "",
        size: "",
        qty: "",
      };
      let isStarted = false;
      const json = utils.sheet_to_json(sheet);
      const initSecondRow = {
        NB: ` `, // __EMPTY_5
        FLUID: ` `, // __EMPTY_6
        LINE: ` `, // __EMPTY_7
        SPEC: ` `, // __EMPTY_8
        "HT TRACE": ` `, // __EMPTY_9
        "INS. TYPE": ` `, // __EMPTY_10
        "INS. THK": ` `, // __EMPTY_11
        COATING: ` `, // __EMPTY_12
        CLEANING: ` `, // __EMPTY_13
      };
      let isSecondRow = false;
      let isREV = undefined;

      let ptNoField = undefined;
      let description = undefined;
      let sizeField = undefined;
      let qtyField = undefined;

      let NBField = undefined;
      let FLUIDField = undefined;
      let LINEField = undefined;
      let SPECField = undefined;
      let HTField = undefined;
      let INSTYPEField = undefined;
      let INSTHKField = undefined;
      let COATINGField = undefined;
      let CLEANINGField = undefined;

      for (let i = 0; i < json.length; i++) {
        const jsonRow = json[i] as any;

        if (!ptNoField) ptNoField = findKeyFieldByValue(jsonRow, "PT.NO");
        if (!description)
          description = findKeyFieldByValue(jsonRow, "DESCRIPTION");
        if (!sizeField) sizeField = findKeyFieldByValue(jsonRow, "SIZE");
        if (!qtyField) qtyField = findKeyFieldByValue(jsonRow, "QTY");
        if (!NBField) NBField = findKeyFieldByValue(jsonRow, "NB");
        if (!FLUIDField) FLUIDField = findKeyFieldByValue(jsonRow, "FLUID");
        if (!LINEField) LINEField = findKeyFieldByValue(jsonRow, "LINE");
        if (!SPECField) SPECField = findKeyFieldByValue(jsonRow, "SPEC");
        if (!HTField) HTField = findKeyFieldByValue(jsonRow, "HT TRACE");
        if (!INSTYPEField)
          INSTYPEField = findKeyFieldByValue(jsonRow, "INS. TYPE");
        if (!INSTHKField)
          INSTHKField = findKeyFieldByValue(jsonRow, "INS. THK");
        if (!COATINGField)
          COATINGField = findKeyFieldByValue(jsonRow, "COATING");
        if (!CLEANINGField)
          CLEANINGField = findKeyFieldByValue(jsonRow, "CLEANING");

        const groupTypeField = elementGroups
          .map((type) => findKeyFieldByValue(jsonRow, type))
          .find((field) => field);
        if (groupTypeField) {
          if (isStarted) {
            current = {
              ...current,
              [temp]: [...current[temp], { ...currentElement }],
            };
          }
          currentElement = {
            ...currentElement,
            groupType: jsonRow[groupTypeField],
          };
          isStarted = false;
        }

        const elementTypeField = elementTypes
          .map((type) => findKeyFieldByValue(jsonRow, type))
          .find((field) => field);

        if (elementTypeField) {
          if (isStarted) {
            current = {
              ...current,
              [temp]: [...current[temp], { ...currentElement }],
            };
          }
          currentElement = {
            ...currentElement,
            elementType: jsonRow[elementTypeField],
          };
          isStarted = false;
        }

        if (ptNoField && Number.isInteger(jsonRow[ptNoField]) && !currentI) {
          currentI = jsonRow[ptNoField];
          currentElement = {
            ...currentElement,
            type: description ? jsonRow[description] : ` `,
            size: sizeField ? jsonRow[sizeField] : ` `,
            qty: qtyField ? jsonRow[qtyField] : ` `,
          };
          isStarted = currentElement.type !== "SEE PIPING SUPPORT INDEX";
        } else if (ptNoField && currentI && jsonRow[ptNoField] > currentI) {
          if (isStarted) {
            current = {
              ...current,
              [temp]: [...current[temp], { ...currentElement }],
            };
          }
          currentI = jsonRow[ptNoField];
          currentElement = {
            ...currentElement,
            type: description ? jsonRow[description] : ` `,
            size: sizeField ? jsonRow[sizeField] : ` `,
            qty: qtyField ? jsonRow[qtyField] : ` `,
          };
          if (currentElement.type === "SEE PIPING SUPPORT INDEX") {
            current = {
              ...current,
              [temp]: [...current[temp], { ...currentElement }],
            };
            isStarted = false;
          } else isStarted = true;
        } else if (isStarted && currentI) {
          let type = undefined;
          if (description && jsonRow[description]) {
            type = jsonRow[description];
          } else if (ptNoField && jsonRow[ptNoField]) {
            type = jsonRow[ptNoField];
          }
          if (type) {
            currentElement = {
              ...currentElement,
              type: `${currentElement.type} ${type}`,
            };
            isStarted = currentElement.type !== "SEE PIPING SUPPORT INDEX";
          }
        }

        if (NBField && jsonRow[NBField] === "NB") isSecondRow = true;
        else if (NBField && isSecondRow) {
          if (Number.isInteger(jsonRow[NBField])) {
            const secondRow = {
              ...initSecondRow,
              NB: jsonRow[NBField] ?? ` `,
              FLUID: jsonRow[FLUIDField ?? ""] ?? ` `,
              LINE: jsonRow[LINEField ?? ""] ?? ` `,
              SPEC: jsonRow[SPECField ?? ""] ?? ` `,
              "HT TRACE": jsonRow[HTField ?? ""] ?? ` `,
              "INS. TYPE": jsonRow[INSTYPEField ?? ""] ?? ` `,
              "INS. THK": jsonRow[INSTHKField ?? ""] ?? ` `,
              COATING: jsonRow[COATINGField ?? ""] ?? ` `,
              CLEANING: jsonRow[CLEANINGField ?? ""] ?? ` `,
            };
            current = {
              ...current,
              secondRows: [...current.secondRows, secondRow],
            };
          } else if (
            jsonRow[NBField] === "DENOTES PARTS LIST NO" &&
            LINEField &&
            Number.isInteger(jsonRow[LINEField])
          ) {
            const secondRow = {
              ...initSecondRow,
              NB: jsonRow[FLUIDField ?? ""] ?? ` `,
              FLUID: jsonRow[LINEField ?? ""] ?? ` `,
              LINE: jsonRow[SPECField ?? ""] ?? ` `,
              SPEC: jsonRow[HTField ?? ""] ?? ` `,
              COATING: jsonRow[COATINGField ?? ""] ?? ` `,
              CLEANING: jsonRow[CLEANINGField ?? ""] ?? ` `,
            };
            current = {
              ...current,
              secondRows: [...current.secondRows, secondRow],
            };
          }
        }

        if (!current["USED ON"]) {
          const field = findKeyFieldByValue(jsonRow, "USED ON");
          let isNext = false;
          for (const [key, val] of Object.entries(jsonRow)) {
            if (key === field) isNext = true;
            else if (isNext) {
              current = { ...current, "USED ON": val as string };
              break;
            }
          }
        }

        if (!current["DOC NO"]) {
          const field = findKeyFieldByValue(jsonRow, "DOC No");
          if (field) {
            for (let j = i + 1; j < json.length; j++) {
              const next = json[j] as any;
              if (next && next[field]) {
                current = { ...current, "DOC NO": next[field] };
                break;
              }
            }
            if (!current["DOC NO"]) {
              if (field.includes("__EMPTY_")) {
                const index = +field.replace("__EMPTY_", "");
                for (let j = i + 1; j < json.length; j++) {
                  const next = json[j] as any;
                  if (next && next[`__EMPTY_${index + 1}`]) {
                    current = {
                      ...current,
                      "DOC NO": next[`__EMPTY_${index + 1}`],
                    };
                    break;
                  }
                }
              }
            }
          }
        }

        if (!current["DRG. NO"]) {
          const field = findKeyFieldByValue(jsonRow, "DRG. NO.");
          if (field) {
            for (let j = i + 1; j < json.length; j++) {
              const next = json[j] as any;
              if (next && next[field]) {
                current = { ...current, "DRG. NO": ` ${next[field]}` };
                break;
              }
            }
          }
        }

        if (!current["WORK PACKAGE / AREA DESCRIPTION"]) {
          const field = findKeyFieldByValue(
            jsonRow,
            "WORK PACKAGE/AREA DESCRIPTION"
          );
          if (field) {
            for (let j = i + 1; j < json.length; j++) {
              const next = json[j] as any;
              if (next && next[field]) {
                current = {
                  ...current,
                  "WORK PACKAGE / AREA DESCRIPTION": next[field],
                };
                break;
              }
            }
          }
        }

        if (!current["WORK PACKAGE / AREA NAME"]) {
          const field = findKeyFieldByCondition(
            jsonRow,
            (val) => typeof val === "string" && val.includes("AREA NAME")
          );
          if (field) {
            current = {
              ...current,
              "WORK PACKAGE / AREA NAME": jsonRow[field]
                .replace("AREA NAME", "")
                .trim(),
            };
          }
        }

        if (!current["UNIT CODE"]) {
          const field = findKeyFieldByValue(jsonRow, "UNIT CODE");
          if (field) {
            if (field.includes("__EMPTY_")) {
              const index = +field.replace("__EMPTY_", "");
              const next = json[i + 1] as any;
              const unitCode =
                next &&
                (next[`__EMPTY_${index}`] || next[`__EMPTY_${index + 1}`]);
              if (unitCode) {
                current = { ...current, "UNIT CODE": unitCode };
              } else current = { ...current, "UNIT CODE": ` ` };
            } else current = { ...current, "UNIT CODE": ` ` };
          }
        }

        if (!isREV && jsonRow.N !== undefined && jsonRow.N !== null) {
          if (jsonRow.N === "REV") isREV = true;
          else current = { ...current, REV: jsonRow.N };
        }
      }
      rows.push(current);
    }
  }
  let resultRows: any[] = [];
  for (const r of rows) {
    let items: any = { 0: { ...r } };
    items = {
      ...items,
      [0]: {
        ...items[0],
        "SR NO": ` `,
        "SKID NO": ` `,
        "LINE NUMBER": ` `,
        "PID NO": ` `,
        "USED ON": ` `,
        "DOC NO": ` `,
        "DRG. NO": ` `,
        "WORK PACKAGE / AREA DESCRIPTION": ` `,
        "WORK PACKAGE / AREA NAME": ` `,
        "UNIT CODE": ` `,
        REV: ` `,
        FLUID: ` `,
        LINE: ` `,
        SPEC: ` `,
        COATING: ` `,
        CLEANING: ` `,
        "INSU TYPE": ` `,
        "INSU THICKNESS": ` `,
        "E TRACING": ` `,
        COMPONENT: ` `,
        CONCATENATE: ` `,
        "Detail Description": ` `,
        "MOC CAT": ` `,
        "MATERIAL STD": ` `,
        "Type-1": ` `,
        "END CONN": ` `,
        "SIZE 1 mm": ` `,
        "Size 1 inch": ` `,
        "SIZE 2 mm": ` `,
        "Size 2 inch": ` `,
        "SIZE 3 mm": ` `,
        "Size 3 inch": ` `,
        SCH: ` `,
        RATING: ` `,
        "DIMN STD": ` `,
        "Quantity (Nos/Mtr)": ` `,
        "Unit Wt (Kg)": ` `,
        "5%": ` `,
        111: ` `,
        "Total Finished Qty (Nos/Mtr)": ` `,
        "%": ` `,
        "Total Procurement Qty": ` `,
        "Total Finished Wt (Kg)": ` `,
      },
    };

    r[temp].forEach((item: any, i: number) => {
      try {
        const arr: string[] = item.type
          .split(",")
          .map((el: string) => el.trim());
        const secondRow =
          item.elementType === "PIPE" &&
          r.secondRows.find((sr: any) => `${sr.NB}` === `${item.size}`);
        items = {
          ...items,
          [i]: {
            ...items[i],
            "USED ON": r["USED ON"],
            "DOC NO": r["DOC NO"],
            "DRG. NO": r["DRG. NO"],
            "WORK PACKAGE / AREA DESCRIPTION":
              r["WORK PACKAGE / AREA DESCRIPTION"],
            "WORK PACKAGE / AREA NAME": r["WORK PACKAGE / AREA NAME"],
            "UNIT CODE": r["UNIT CODE"],
            REV: r["REV"],
            FLUID:
              secondRow && secondRow["FLUID"] ? `${secondRow["FLUID"]}` : ` `,
            LINE: secondRow && secondRow["LINE"] ? `${secondRow["LINE"]}` : ` `,
            SPEC: secondRow && secondRow["SPEC"] ? `${secondRow["SPEC"]}` : ` `,
            COATING:
              secondRow && secondRow["COATING"]
                ? `${secondRow["COATING"]}`
                : ` `,
            CLEANING:
              secondRow && secondRow["CLEANING"]
                ? `${secondRow["CLEANING"]}`
                : ` `,
            "INSU TYPE":
              secondRow && secondRow["INS. TYPE"]
                ? `${secondRow["INS. TYPE"]}`
                : ` `,
            "INSU THICKNESS":
              secondRow && secondRow["INS. THK"]
                ? `${secondRow["INS. THK"]}`
                : ` `,
            "E TRACING":
              secondRow && secondRow["HT TRACE"]
                ? `${secondRow["HT TRACE"]}`
                : ` `,
            COMPONENT: arr[0] ?? ` `,
            CONCATENATE: `${item.type || "type"}`.replace(/,/gm, "|"),
            "Detail Description": arr[0] ?? ` `,
            "MATERIAL STD": arr.find((el) => el.includes("ASTM")) ?? ` `,
            "Type-1":
              arr.find(
                (el) =>
                  el.includes("Seamless") ||
                  el.includes("Type") ||
                  el.includes("Bolted")
              ) ?? ` `,
            "END CONN":
              arr.find((el) => el.includes("End") || el.includes("end")) ?? ` `,
            SCH: arr.find((el) => el.includes("SCH")) ?? ` `,
            "SIZE 1 mm": item.size ? ` ${item.size}` : ` `,
            RATING:
              arr.find((el) => el.includes("Class") || el.includes("class")) ??
              ` `,
            "DIMN STD":
              arr.find((el) => el.includes("ASME") || el.includes("STD")) ??
              ` `,
            "Quantity (Nos/Mtr)": item.qty ? ` ${item.qty}` : ` `,
          },
        };
      } catch (error) {
        console.error(error);
      }
    });

    resultRows = [
      ...resultRows,
      ...Object.values(items).map((item: any) => {
        const { ELEMENTS, secondRows, ...fixed } = item;
        return fixed;
      }),
    ];
  }
  return resultRows;
}

function getXLSSheets(blob: Blob): Promise<WorkBook> {
  return new Promise((res, rej) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const data = e.target?.result;
      const workbook = read(data, { type: "binary" });
      res(workbook);
    };
    reader.onerror = (ex) => rej(ex);
    reader.readAsBinaryString(blob);
  });
}
