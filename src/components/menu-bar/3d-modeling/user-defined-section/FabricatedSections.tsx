import React, { FunctionComponent, useState, useEffect, useRef } from "react";
import { Button } from "@blueprintjs/core";
import { CheckBoxCell } from "../../../common/CheckBoxCell";
import { NumericCell } from "../../../common/NumericCell";
import { SelectorCell } from "../../../common/SelectorCell";
import { InputCell } from "../../../common/InputCell";
import { shapeTypes } from "../../../../store/main/constants";
import { useDispatch, useSelector } from "react-redux";
import { changeFabracatedSections } from "../../../../store/main/actions";
import {
  getTopOffset,
  exportToCSV,
  importFromCSV,
  getNextId,
  getIndexName,
  checkImportedNumber,
  getLocalStorageImage,
} from "../../../3d-models/utils";
import { ApplicationState } from "../../../../store";
import { ReplaceSection } from "./ReplaceSection";
import { handleReplaceProfile, searchMatches } from "./userProfilesUtils";
import { GeneralCheckBoxCell } from "../../../common/GeneralCheckBoxCell";
import { addEventAction } from "../../../../store/ui/actions";
import { Section, ShapeType } from "../../../../store/data/types";

type Props = { sections: Section[] };

type RowData = {
  id: number;
  selected: boolean;
  created: boolean;
  name: string;
  type: ShapeType;
  depth: number;
  width: number;
  tFlange: number;
  bFlange: number;
  web: number;
};

const IUrl = "I shape.png";
const CUrl = "C shape.png";
const OUrl = "O shape.png";
const BOXUrl = "Box shape.png";

const FabricatedSections: FunctionComponent<Props> = (props) => {
  const { sections } = props;

  const [display, setDisplay] = useState<boolean>(false);
  const [rows, setRows] = useState<RowData[]>([]);
  const [lastRow, setLastRow] = useState<RowData>();
  const [imgs, setImgs] = useState<any>({});
  const [offsetTop, setOffsetTop] = useState<number>(0);
  const [toDeleting, setToDeleting] = useState<RowData[]>([]);
  const [replaceDlg, setReplaceDlg] = useState<JSX.Element>();

  const tableRef = useRef<HTMLTableElement>(null);

  const projects = useSelector(
    (state: ApplicationState) => state.main.projects
  );

  const dispatch = useDispatch();

  useEffect(() => {
    setImgs({
      I: <img src={localStorage.getItem(IUrl) || ""} alt={"Shape - I"} />,
      C: <img src={localStorage.getItem(CUrl) || ""} alt={"Shape - C"} />,
      O: <img src={localStorage.getItem(OUrl) || ""} alt={"Shape - O"} />,
      Box: <img src={localStorage.getItem(BOXUrl) || ""} alt={"Shape - Box"} />,
    });
    getLocalStorageImage(IUrl).then(
      (data) =>
        data &&
        setImgs((prev: any) => ({
          ...prev,
          I: <img src={data} alt={"Shape - I"} />,
        }))
    );
    getLocalStorageImage(CUrl).then(
      (data) =>
        data &&
        setImgs((prev: any) => ({
          ...prev,
          C: <img src={data} alt={"Shape - C"} />,
        }))
    );
    getLocalStorageImage(OUrl).then(
      (data) =>
        data &&
        setImgs((prev: any) => ({
          ...prev,
          O: <img src={data} alt={"Shape - O"} />,
        }))
    );
    getLocalStorageImage(BOXUrl).then(
      (data) =>
        data &&
        setImgs((prev: any) => ({
          ...prev,
          Box: <img src={data} alt={"Shape - Box"} />,
        }))
    );
  }, []);

  useEffect(() => {
    setOffsetTop(getTopOffset(tableRef.current, 1));
  }, [rows]);

  useEffect(() => {
    const newRows: RowData[] = [];
    sections.forEach((fs) => {
      newRows.push({
        id: fs.profile_section_id,
        selected: false,
        created: true,
        name: fs.designation,
        type: fs.shape,
        depth: fs.d_global,
        width: fs.bf_global,
        tFlange: fs.tf_global ?? 0,
        bFlange: fs.tfb_global ?? 0,
        web: fs.tw_global ?? 0,
      } as RowData);
    });
    setRows(
      [...rows.filter((row) => !validRow(row)), ...newRows].sort(
        (a, b) => a.id - b.id
      )
    );
  }, [sections]);

  useEffect(() => {
    let checked: RowData[] = [];
    for (let i = 0, len = toDeleting.length; i < len; ++i) {
      if (toDeleting[i].created) {
        const map = searchMatches(toDeleting[i], projects, compareSection);
        if (map.size) {
          setReplaceDlg(
            <ReplaceSection
              profile={toDeleting[i].name}
              onClose={() => {
                setToDeleting(toDeleting.slice(i + 1));
                setReplaceDlg(undefined);
              }}
              onConfirm={(profile) => {
                dispatch(
                  changeFabracatedSections(
                    rows
                      .filter(
                        (row) => row.id !== toDeleting[i].id && validRow(row)
                      )
                      .map((row) => rowDataToSection(row))
                  )
                );
                handleReplaceProfile(
                  toDeleting[i],
                  profile,
                  projects,
                  map,
                  compareSection,
                  dispatch
                );
                setToDeleting(toDeleting.slice(i + 1));
                setReplaceDlg(undefined);
              }}
            />
          );
          break;
        } else checked = [...checked, toDeleting[i]];
      } else checked = [...checked, toDeleting[i]];
    }
    checked.length &&
      dispatch(
        changeFabracatedSections(
          rows
            .filter(
              (row) =>
                !checked.some((checkedItem) => checkedItem.id === row.id) &&
                validRow(row)
            )
            .map((row) => rowDataToSection(row))
        )
      );
    toDeleting.length && setToDeleting([]);
  }, [toDeleting, projects]);

  function rowDataToSection(row: RowData) {
    return {
      profile_section_id: row.id,
      country_code: "Fabricated",
      designation: row.name,
      shape: row.type,
      d_global: row.depth,
      bf_global: row.width,
      tf_global: row.tFlange,
      tfb_global: row.bFlange,
      tw_global: row.web,
    } as Section;
  }

  function handleAddToLib() {
    dispatch(
      changeFabracatedSections(
        rows.filter((row) => validRow(row)).map((row) => rowDataToSection(row))
      )
    );
  }

  function validRow(row: RowData) {
    return (
      row.name &&
      row.type &&
      row.depth &&
      row.width &&
      (row.type !== "O" ? row.tFlange && row.bFlange && row.web : true)
    );
  }

  function handleAddRow() {
    const id = getNextId(rows);
    const row = {
      id,
      selected: false,
      name: `${id}`,
      type: "I",
      depth: 200,
      width: 200,
      tFlange: 50,
      bFlange: 50,
      web: 50,
    } as RowData;
    setLastRow(row);
    setRows([...rows, row]);
  }

  function compareSection(item: RowData, profile?: Section) {
    if (item.name !== profile?.designation) return false;
    if (item.type !== profile?.shape) return false;
    if (item.depth !== profile?.d_global) return false;
    if (item.width !== profile?.bf_global) return false;
    if (item.tFlange !== profile?.tf_global) return false;
    if (item.bFlange !== profile?.tfb_global) return false;
    return item.web === profile?.tw_global;
  }

  function handleDeleteRows() {
    setToDeleting(rows.filter((row) => row.selected));
  }

  function handleChangeRow(row: RowData, field: string, value: any) {
    setDisplay(true);
    setLastRow({ ...row, [field]: value });
    setRows(
      rows.map((item) =>
        item.id === row.id ? { ...row, [field]: value } : item
      )
    );
  }

  function getRow(row: RowData, i: number) {
    return (
      <tr key={`${i}-${row.id}`} onClick={() => setLastRow(row)}>
        <CheckBoxCell
          key={`${i}-${row.id}`}
          value={row.selected}
          onChange={(value) => handleChangeRow(row, "selected", value)}
        />
        <InputCell
          disabled={row.created}
          className="w-200"
          value={row.name}
          onChange={(value) => handleChangeRow(row, "name", value)}
        />
        <SelectorCell<ShapeType>
          items={["I", "C", "O", "Box"]}
          selected={row.type}
          disabled={row.created}
          onSelect={(value) => handleChangeRow(row, "type", value)}
          itemKey={(item) => item}
          itemLabel={(item) => item}
          filterable={false}
        />
        <NumericCell
          className="w-130"
          value={row.depth}
          disabled={row.created}
          onChange={(value) => handleChangeRow(row, "depth", value)}
        />
        <NumericCell
          className="w-130"
          value={row.width}
          disabled={row.created}
          onChange={(value) => handleChangeRow(row, "width", value)}
        />
        <NumericCell
          className="w-90"
          value={row.tFlange}
          disabled={row.created}
          onChange={(value) => handleChangeRow(row, "tFlange", value)}
        />
        <NumericCell
          className="w-90"
          value={row.bFlange}
          disabled={row.created}
          onChange={(value) => handleChangeRow(row, "bFlange", value)}
        />
        <NumericCell
          className="w-50"
          value={row.web}
          disabled={row.created}
          onChange={(value) => handleChangeRow(row, "web", value)}
        />
      </tr>
    );
  }

  function handleExport() {
    exportToCSV(rows, "Fabricated Sections");
  }

  function showErrorMsg(msg: string) {
    dispatch(addEventAction(`Fabricated Sections (Import): ${msg}`, "danger"));
  }

  function handleImport() {
    importFromCSV((newData, isCSV) => {
      if (!isCSV || !Array.isArray(newData)) return;
      const newItems: RowData[] = [...rows];
      newData.forEach((item: RowData) => {
        const id = getNextId(newItems);
        let newItem: RowData = {
          id,
          selected: false,
          created: false,
          type: "I",
          name: `I${getIndexName(newItems, "I")}`,
          depth: checkImportedNumber(item.depth) ?? 0,
          width: checkImportedNumber(item.width) ?? 0,
          web: checkImportedNumber(item.web) ?? 0,
          bFlange: checkImportedNumber(item.bFlange) ?? 0,
          tFlange: checkImportedNumber(item.tFlange) ?? 0,
        };
        if (item.type) {
          if (shapeTypes.includes(item.type)) {
            newItem = { ...newItem, type: item.type };
          } else {
            showErrorMsg(
              `(id: ${item.id}) - Incorrect section type (${item.type})!`
            );
          }
        }
        newItems.push(newItem);
      });
      setRows(newItems);
    });
  }

  return (
    <>
      {replaceDlg}
      <div className="d-flex f-column">
        <div className="hr" />
        <div className="d-flex f-ai-center label-light bg-dark">
          <span>Fabricated Section</span>
          <Button
            small
            icon="trash"
            text="Delete"
            intent="warning"
            onClick={handleDeleteRows}
          />
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
            icon="plus"
            text="Add Row"
            intent="primary"
            onClick={handleAddRow}
          />
          <Button
            small
            text="Add list To Library"
            intent="primary"
            onClick={handleAddToLib}
          />
        </div>
        <div className="hr" />
        <div className="p-5">
          <div className="table-container">
            <table ref={tableRef} className="table bg-gray">
              <thead>
                <tr>
                  <GeneralCheckBoxCell
                    rowSpan={2}
                    data={rows}
                    onChange={setRows}
                  />
                  <th rowSpan={2}>Name</th>
                  <th rowSpan={2}>Type</th>
                  <th colSpan={2}>Over all dimension</th>
                  <th colSpan={3}>Thickness (mm)</th>
                </tr>
                <tr>
                  <th style={{ top: offsetTop }}>Depth / OD (mm)</th>
                  <th style={{ top: offsetTop }}>Width / ID (mm)</th>
                  <th style={{ top: offsetTop }}>Top Flange</th>
                  <th style={{ top: offsetTop }}>Bot Flange</th>
                  <th style={{ top: offsetTop }}>Web</th>
                </tr>
              </thead>
              <tbody>{rows.map(getRow)}</tbody>
            </table>
          </div>
        </div>
        <div className="hr" />
        <div className="d-flex f-ai-center label-light bg-dark">
          <span>Result</span>
          <Button
            small
            minimal
            icon={display ? "caret-down" : "caret-right"}
            onClick={() => setDisplay(!display)}
          />
        </div>
        <div className="hr" />
        {display && (
          <div className="p-5">
            <div className="d-flex f-center bg-white p-20">
              {lastRow?.type ? imgs[lastRow.type] : null}
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default FabricatedSections;
