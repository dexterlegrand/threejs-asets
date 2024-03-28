import React, { FunctionComponent, useState, useEffect, useRef } from "react";
import { Button } from "@blueprintjs/core";
import { CheckBoxCell } from "../../../common/CheckBoxCell";
import { NumericCell } from "../../../common/NumericCell";
import { SelectorCell } from "../../../common/SelectorCell";
import { changeRolledSections } from "../../../../store/main/actions";
import { useDispatch, useSelector } from "react-redux";
import { InputCell } from "../../../common/InputCell";
import {
  getTopOffset,
  exportToCSV,
  importFromCSV,
  getNextId,
  checkImportedNumber,
  getImportProfileByDesignation,
  getProfileLibrary,
  getLocalStorageImage,
} from "../../../3d-models/utils";
import { ApplicationState } from "../../../../store";
import { handleReplaceProfile, searchMatches } from "./userProfilesUtils";
import { ReplaceSection } from "./ReplaceSection";
import { GeneralCheckBoxCell } from "../../../common/GeneralCheckBoxCell";
import { addEventAction } from "../../../../store/ui/actions";
import { RolledSection, Section } from "../../../../store/data/types";

type Props = {
  sections: RolledSection[];
  profiles: Section[];
  libs: string[];
};

type RowData = {
  id: number;
  selected: boolean;
  created?: boolean;
  name: string;
  lib?: string;
  profile?: Section;
  tpWidth: number;
  tpThickness: number;
  bpWidth: number;
  bpThickness: number;
};

const TBUrl = "I tb plate.png";
const TUrl = "I t plate.png";
const BUrl = "I b plate.png";

const RolledSectionWithPlates: FunctionComponent<Props> = (props) => {
  const { sections, profiles, libs } = props;

  const [display, setDisplay] = useState<boolean>(false);
  const [rows, setRows] = useState<RowData[]>([]);
  const [lastRow, setLastRow] = useState<RowData>();
  const [imgs, setImgs] = useState<any>();
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
      TB: (
        <img
          src={localStorage.getItem(TBUrl) || ""}
          alt={"Shape with Top and Bottom plate"}
        />
      ),
      T: (
        <img
          src={localStorage.getItem(TUrl) || ""}
          alt={"Shape with Top plate"}
        />
      ),
      B: (
        <img
          src={localStorage.getItem(BUrl) || ""}
          alt={"Shape with Bottom plate"}
        />
      ),
    });
    getLocalStorageImage(TBUrl).then(
      (data) =>
        data &&
        setImgs((prev: any) => ({
          ...prev,
          TB: <img src={data} alt={"Shape with Top and Bottom plate"} />,
        }))
    );
    getLocalStorageImage(TUrl).then(
      (data) =>
        data &&
        setImgs((prev: any) => ({
          ...prev,
          T: <img src={data} alt={"Shape with Top plate"} />,
        }))
    );
    getLocalStorageImage(BUrl).then(
      (data) =>
        data &&
        setImgs((prev: any) => ({
          ...prev,
          B: <img src={data} alt={"Shape with Bottom plate"} />,
        }))
    );
  }, []);

  useEffect(() => {
    setOffsetTop(getTopOffset(tableRef.current, 1));
  }, [rows]);

  useEffect(() => {
    const newRows: RowData[] = [];
    sections.forEach((section) => {
      newRows.push({
        id: section.profile_section_id,
        selected: false,
        created: true,
        name: section.designation,
        lib: section.baseLib,
        profile: profiles.find(
          (profile) => profile.designation === section.baseProfile
        ),
        tpWidth: section.tpWidth,
        tpThickness: section.tpThickness,
        bpWidth: section.bpWidth,
        bpThickness: section.bpThickness,
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
                  changeRolledSections(
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
        changeRolledSections(
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
      ...row.profile,
      profile_section_id: row.id,
      country_code: "Rolled",
      designation: row.name,
      baseLib: row.lib,
      baseCountryCode: row.profile?.country_code,
      baseProfile: row.profile?.designation,
      tpWidth: row.tpWidth,
      tpThickness: row.tpThickness,
      bpWidth: row.bpWidth,
      bpThickness: row.bpThickness,
    } as RolledSection;
  }

  function handleAddToLib() {
    dispatch(
      changeRolledSections(
        rows.filter((row) => validRow(row)).map((row) => rowDataToSection(row))
      )
    );
  }

  function validRow(row: RowData) {
    return (
      row.name &&
      row.lib &&
      row.profile &&
      ((row.tpWidth && row.tpThickness) || (row.bpWidth && row.bpThickness))
    );
  }

  function handleAddRow() {
    const id = getNextId(rows);
    const row = {
      id,
      selected: false,
      name: `${id}`,
      tpWidth: 0,
      tpThickness: 0,
      bpWidth: 0,
      bpThickness: 0,
    } as RowData;
    setLastRow(row);
    setRows([...rows, row]);
  }

  function compareSection(item: RowData, profile?: Section | RolledSection) {
    if (!profile || profile.country_code !== "Rolled") return false;
    if (item.name !== profile.designation) return false;
    if (item.lib !== (profile as RolledSection).baseLib) return false;
    if (item.profile?.designation !== (profile as RolledSection).baseProfile)
      return false;
    if (item.tpWidth !== (profile as RolledSection).tpWidth) return false;
    if (item.tpThickness !== (profile as RolledSection).tpThickness)
      return false;
    if (item.bpWidth !== (profile as RolledSection).bpWidth) return false;
    return item.bpThickness === (profile as RolledSection).bpThickness;
  }

  function handleDeleteRows() {
    setToDeleting(rows.filter((row) => row.selected));
  }

  function handleChangeProfile(row: RowData, profile?: Section) {
    setDisplay(true);
    setLastRow({
      ...row,
      name: `${profile?.designation}-${row.name}`,
      profile,
    });
    setRows(
      rows.map((item) =>
        item.id === row.id
          ? { ...row, name: `${profile?.designation}-${row.name}`, profile }
          : item
      )
    );
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
      <tr key={row.id} onClick={() => setLastRow(row)}>
        <CheckBoxCell
          key={`${i}-${row.id}`}
          value={row.selected}
          onChange={(value) => handleChangeRow(row, "selected", value)}
        />
        <InputCell
          className="w-200"
          value={row.name}
          disabled={row.created}
          onChange={(value) => handleChangeRow(row, "name", value)}
        />
        <SelectorCell<string>
          items={libs}
          selected={row.lib}
          disabled={row.created}
          onSelect={(value) => handleChangeRow(row, "lib", value)}
          itemKey={(item) => item}
          itemLabel={(item) => item}
          filterable={false}
        />
        <SelectorCell<Section>
          items={profiles.filter((profile) => profile.country_code === row.lib)}
          selected={row.profile}
          disabled={row.created}
          onSelect={(value) => handleChangeProfile(row, value)}
          itemKey={(item) => item.profile_section_id}
          itemLabel={(item) => item.designation}
          filterable={true}
          filter={(query, item) =>
            query
              ? item.designation
                  .toLocaleLowerCase()
                  .includes(query.toLocaleLowerCase())
              : true
          }
        />
        <NumericCell
          className="w-60"
          value={row.tpWidth}
          disabled={row.created}
          onChange={(value) => handleChangeRow(row, "tpWidth", value)}
        />
        <NumericCell
          className="w-80"
          value={row.tpThickness}
          disabled={row.created}
          onChange={(value) => handleChangeRow(row, "tpThickness", value)}
        />
        <NumericCell
          className="w-60"
          value={row.bpWidth}
          disabled={row.created}
          onChange={(value) => handleChangeRow(row, "bpWidth", value)}
        />
        <NumericCell
          className="w-80"
          value={row.bpThickness}
          disabled={row.created}
          onChange={(value) => handleChangeRow(row, "bpThickness", value)}
        />
      </tr>
    );
  }

  function getImg(item?: RowData) {
    if (!item) return null;
    if (item.tpWidth && item.tpThickness && item.bpWidth && item.bpThickness) {
      return imgs["TB"];
    } else if (item.tpWidth && item.tpThickness) {
      return imgs["T"];
    } else if (item.bpWidth && item.bpThickness) {
      return imgs["B"];
    } else {
      return null;
    }
  }

  function handleExport() {
    exportToCSV(
      rows.map((row) => ({ ...row, profile: row.profile?.designation })),
      "Rolled Sections with Plates"
    );
  }

  function showErrorMsg(msg: string) {
    dispatch(
      addEventAction(`Rolled Sections with Plates (Import): ${msg}`, "danger")
    );
  }

  function handleImport() {
    importFromCSV((newData, isCSV) => {
      if (!isCSV || !Array.isArray(newData)) return;
      const newItems: RowData[] = [...rows];
      newData.forEach((item: RowData) => {
        const id = getNextId(newItems);
        const profile = getImportProfileByDesignation(
          profiles,
          item.profile,
          () =>
            showErrorMsg(
              `(id: ${item.id}) - a profile "${item.profile}" not found!`
            )
        );
        const newItem: RowData = {
          id,
          selected: false,
          created: false,
          name: `${id}`,
          profile,
          lib: getProfileLibrary(profile),
          tpWidth: checkImportedNumber(item.tpWidth, false) ?? 0,
          tpThickness: checkImportedNumber(item.tpThickness, false) ?? 0,
          bpWidth: checkImportedNumber(item.bpWidth, false) ?? 0,
          bpThickness: checkImportedNumber(item.bpThickness) ?? 0,
        };
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
          <span>Rolled Section with Plates</span>
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
                  <th rowSpan={2}>C/S Library</th>
                  <th rowSpan={2}>Profile</th>
                  <th colSpan={2}>Top Plate (mm)</th>
                  <th colSpan={2}>Bottom Plate (mm)</th>
                </tr>
                <tr>
                  <th style={{ top: offsetTop }}>Width</th>
                  <th style={{ top: offsetTop }}>Thickness</th>
                  <th style={{ top: offsetTop }}>Width</th>
                  <th style={{ top: offsetTop }}>Thickness</th>
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
              {getImg(lastRow)}
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default RolledSectionWithPlates;
