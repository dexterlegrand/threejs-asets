import React, { FunctionComponent, useState, useEffect } from "react";
import { Button } from "@blueprintjs/core";
import { CheckBoxCell } from "../../../common/CheckBoxCell";
import { NumericCell } from "../../../common/NumericCell";
import { SelectorCell } from "../../../common/SelectorCell";
import { InputCell } from "../../../common/InputCell";
import { shapeTypes } from "../../../../store/main/constants";
import { useDispatch, useSelector } from "react-redux";
import {
  exportToCSV,
  importFromCSV,
  getNextId,
  getIndexName,
  checkImportedNumber,
} from "../../../3d-models/utils";
import { ApplicationState } from "../../../../store";
import { ReplaceSection } from "./ReplaceSection";
import { handleReplaceProfile, searchMatches } from "./userProfilesUtils";
import { GeneralCheckBoxCell } from "../../../common/GeneralCheckBoxCell";
import { addEventAction } from "../../../../store/ui/actions";
import { CombinationType, CombinedSection, Section, ShapeType } from "../../../../store/data/types";
import { changeCombinedSections } from "../../../../store/main/actions";

type Props = { sections: CombinedSection[]; libs: string[]; profiles: Section[] };

type RowData = {
  id: number;
  selected: boolean;
  created: boolean;
  name: string;
  type: ShapeType;
  profile?: Section;
  CSLibrary?: string;
  combination: CombinationType;
  gap: number;
};

const CombinedSections: FunctionComponent<Props> = (props) => {
  const { sections, libs, profiles } = props;

  const [rows, setRows] = useState<RowData[]>([]);
  const [toDeleting, setToDeleting] = useState<RowData[]>([]);
  const [replaceDlg, setReplaceDlg] = useState<JSX.Element>();

  const projects = useSelector((state: ApplicationState) => state.main.projects);

  const dispatch = useDispatch();

  useEffect(() => {
    const newRows: RowData[] = [];
    sections.forEach((section) => {
      newRows.push({
        id: section.profile_section_id,
        selected: false,
        created: true,
        name: section.designation,
        type: section.shape,
        CSLibrary: section.CSLibrary,
        combination: section.combination,
        gap: section.gap,
        profile: profiles.find((profile) => profile.designation === section.baseProfile),
      });
    });
    setRows([...rows.filter((row) => !validRow(row)), ...newRows].sort((a, b) => a.id - b.id));
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
                  changeCombinedSections(
                    rows
                      .filter((row) => row.id !== toDeleting[i].id && validRow(row))
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
        changeCombinedSections(
          rows
            .filter(
              (row) => !checked.some((checkedItem) => checkedItem.id === row.id) && validRow(row)
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
      country_code: "Combined",
      designation: row.name,
      shape: row.type,
      CSLibrary: row.CSLibrary,
      combination: row.combination,
      gap: row.gap,
      baseProfile: row.profile?.designation ?? "",
    } as CombinedSection;
  }

  function handleAddToLib() {
    dispatch(
      changeCombinedSections(
        rows.filter((row) => validRow(row)).map((row) => rowDataToSection(row))
      )
    );
  }

  function validRow(row: RowData) {
    return row.name && row.type && row.CSLibrary && row.combination;
  }

  function handleAddRow() {
    const id = getNextId(rows);
    const row: RowData = {
      id,
      selected: false,
      created: false,
      name: `${id}`,
      type: "C",
      combination: "B/B Depth",
      gap: 0,
    };
    setRows([...rows, row]);
  }

  function compareSection(item: RowData, profile?: Section | CombinedSection) {
    if (item.name !== profile?.designation) return false;
    if (item.type !== profile?.shape) return false;
    if (item.CSLibrary !== (profile as CombinedSection)?.CSLibrary) return false;
    if (item.combination !== (profile as CombinedSection)?.combination) return false;
    return item.gap === (profile as CombinedSection)?.gap;
  }

  function handleDeleteRows() {
    setToDeleting(rows.filter((row) => row.selected));
  }

  function handleChangeProfile(row: RowData, profile?: Section) {
    setRows(
      rows.map((item) =>
        item.id === row.id
          ? { ...row, name: `${profile?.designation}-${row.combination}-${row.name}`, profile }
          : item
      )
    );
  }

  function handleChangeRow(row: RowData, field: string, value: any) {
    setRows(rows.map((item) => (item.id === row.id ? { ...row, [field]: value } : item)));
  }

  function getRow(row: RowData, i: number) {
    return (
      <tr key={`${i}-${row.id}`}>
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
        <SelectorCell<string>
          items={libs}
          selected={row.CSLibrary}
          disabled={row.created}
          onSelect={(value) => handleChangeRow(row, "CSLibrary", value)}
          itemKey={(item) => item}
          itemLabel={(item) => item}
        />
        <SelectorCell<ShapeType>
          items={["C", "L"]}
          selected={row.type}
          disabled={row.created}
          onSelect={(value) => handleChangeRow(row, "type", value)}
          itemKey={(item) => item}
          itemLabel={(item) => item}
        />
        <SelectorCell<Section>
          items={profiles.filter(
            (profile) => profile.country_code === row.CSLibrary && profile.shape === row.type
          )}
          selected={row.profile}
          disabled={row.created}
          onSelect={(value) => handleChangeProfile(row, value)}
          itemKey={(item) => item.profile_section_id}
          itemLabel={(item) => item.designation}
          filter={(query, item) =>
            query ? item.designation.toLocaleLowerCase().includes(query.toLocaleLowerCase()) : true
          }
        />
        <SelectorCell<CombinationType>
          items={
            row.type === "L"
              ? ["B/B Depth", "B/B Width", "Star"]
              : row.type === "C"
              ? ["B/B Depth", "F/F Depth"]
              : []
          }
          selected={row.combination}
          disabled={row.created}
          onSelect={(value) => handleChangeRow(row, "combination", value)}
          itemKey={(item) => item}
          itemLabel={(item) => item}
        />
        <NumericCell
          className="w-130"
          value={row.gap}
          disabled={row.created}
          onChange={(value) => handleChangeRow(row, "gap", value)}
          isDecimal={true}
        />
      </tr>
    );
  }

  function handleExport() {
    exportToCSV(
      rows.map((row) => ({ ...row, profile: row.profile?.designation })),
      "Combined Sections"
    );
  }

  function showErrorMsg(msg: string) {
    dispatch(addEventAction(`Combined Sections (Import): ${msg}`, "danger"));
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
          type: "C",
          name: `C${getIndexName(newItems, "C")}`,
          CSLibrary: item.CSLibrary,
          combination: item.combination,
          gap: checkImportedNumber(item.gap) ?? 0,
        };
        if (item.type) {
          if (shapeTypes.includes(item.type)) {
            newItem = { ...newItem, type: item.type };
          } else {
            showErrorMsg(`(id: ${item.id}) - Incorrect section type (${item.type})!`);
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
          <span>Combined Sections</span>
          <Button small icon="trash" text="Delete" intent="warning" onClick={handleDeleteRows} />
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
          <Button small icon="plus" text="Add Row" intent="primary" onClick={handleAddRow} />
          <Button small text="Add list To Library" intent="primary" onClick={handleAddToLib} />
        </div>
        <div className="hr" />
        <div className="p-5">
          <div className="table-container">
            <table className="table bg-gray">
              <thead>
                <tr>
                  <GeneralCheckBoxCell data={rows} onChange={setRows} />
                  <th>Name</th>
                  <th>C/S Library</th>
                  <th>Shape</th>
                  <th>Profile</th>
                  <th>Combination</th>
                  <th>Gap (mm)</th>
                </tr>
              </thead>
              <tbody>{rows.map(getRow)}</tbody>
            </table>
          </div>
        </div>
      </div>
    </>
  );
};

export default CombinedSections;
