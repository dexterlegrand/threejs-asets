import React, { useEffect, useMemo, useState } from "react";
import { CustomDlg } from "../../../common/CustomDlg";
import { Button, Checkbox } from "@blueprintjs/core";
import { useDispatch, useSelector } from "react-redux";
import { changeUIAction } from "../../../../store/ui/actions";
import { ApplicationState } from "../../../../store";
import {
  exportToCSV,
  importFromCSV,
  fixNumberToStr,
  fixValueToNumber,
  getCurrentUI,
} from "../../../3d-models/utils";
import { DataState } from "../../../../store/data/types";
import GenericTable, {
  TDataField,
  TField,
  THeader,
} from "../../../common/table/GenericTable";
import { SimpleSelector } from "../../../common/SimpleSelector";
import { changeDataAction } from "../../../../store/data/actions";
import { GeneralCheckBoxCell } from "../../../common/GeneralCheckBoxCell";
import SectionsFilter from "./filters/SectionsFilter";
import PipesDataFilter from "./filters/PipesDataFilter";

type Props = {
  onClose: () => any;
};

enum EDataTypes {
  PROFILE_SECTIONS = "Profile sections",
  PIPING_CS = "Piping CS",
  PIPING_SS = "Piping SS",
  PIPING_CAPS = "Piping caps",
  PIPING_COLLETS = "Piping collets",
  PIPING_ELBOWS = "Piping elbows",
  PIPING_RETURNS = "Piping returns",
  PIPING_REDUCERS = "Piping reducers",
  PIPING_TEES = "Piping tees",
  PIPING_FLANGES = "Piping flanges",
  PIPING_BLIND_FLANGES = "Piping blind flanges",
  PIPING_LONG_WELDING_NECK_FLANGES = "Piping long welding neck flanges",
  PIPING_ORIFICE_SLIPON_FLANGES = "Piping orifice slipon flanges",
  PIPING_THREADED_FLANGES = "Piping threaded flanges",
  PIPING_WELD_NECK_FLANGES = "Piping weld neck flanges",
  PIPING_RING_JOINT_FACING_FLANGES = "Piping ring joint facing flanges",
  PIPING_SOCKET_WALDING_FLANGES = "Piping socket walding flanges",
  PIPING_VALVE_TYPES = "Piping valve types",
  PIPING_VALVE_ACTUATORS = "Piping valve actuators",
  PIPING_VALVE_CONTROLS = "Piping valve controls",
}

const dataTypes: EDataTypes[] = [
  EDataTypes.PROFILE_SECTIONS,
  EDataTypes.PIPING_CS,
  EDataTypes.PIPING_SS,
  EDataTypes.PIPING_CAPS,
  EDataTypes.PIPING_COLLETS,
  EDataTypes.PIPING_ELBOWS,
  EDataTypes.PIPING_RETURNS,
  EDataTypes.PIPING_REDUCERS,
  EDataTypes.PIPING_TEES,
  EDataTypes.PIPING_FLANGES,
  EDataTypes.PIPING_BLIND_FLANGES,
  EDataTypes.PIPING_LONG_WELDING_NECK_FLANGES,
  EDataTypes.PIPING_ORIFICE_SLIPON_FLANGES,
  EDataTypes.PIPING_THREADED_FLANGES,
  EDataTypes.PIPING_WELD_NECK_FLANGES,
  EDataTypes.PIPING_RING_JOINT_FACING_FLANGES,
  EDataTypes.PIPING_SOCKET_WALDING_FLANGES,
  EDataTypes.PIPING_VALVE_TYPES,
  EDataTypes.PIPING_VALVE_ACTUATORS,
  EDataTypes.PIPING_VALVE_CONTROLS,
];

const initData: DataState = {
  CS_Libraries: [],
  materials: [],
  pipingCS: [],
  pipingSS: [],
  pipingCaps: [],
  pipingCollets: [],
  pipingElbows: [],
  pipingFlangesAllPresRating: [],
  pipingFlangesBlind: [],
  pipingFlangesLapped: [],
  pipingFlangesRingJointFacing: [],
  pipingFlangesSlipon: [],
  pipingFlangesSocketWelding: [],
  pipingFlangesThreaded: [],
  pipingFlangesWeldingneck: [],
  pipingLongWeldingNeckFlanges: [],
  pipingReducers: [],
  pipingReturns: [],
  pipingTees: [],
  pipingValves: [],
  profileSectionData: [],
  pipingValveActuators: [],
  pipingValveControls: [],
};

export function AvailableData(props: Props) {
  const { onClose } = props;

  const [dataType, setDataType] = useState<EDataTypes>(dataTypes[0]);
  const [page, setPage] = useState<number>(0);
  const [count, setCount] = useState<number>(50);
  const [filtered, setFiltered] = useState<any[]>([]);

  const dataState = useSelector((state: ApplicationState) => state.data);
  const ui = useSelector((state: ApplicationState) => getCurrentUI(state));

  const dispatch = useDispatch();

  const availableDataState: DataState = useMemo(() => {
    return ui?.availableData ?? initData;
  }, [ui?.availableData]);

  const dataItems = useMemo(() => {
    return getDataByType(dataType, dataState);
  }, [dataType, dataState]);

  const availableDataItems = useMemo(() => {
    return getDataByType(dataType, availableDataState);
  }, [dataType, availableDataState]);

  const { header, fields } = useMemo(() => {
    return getTableParameters(
      dataType,
      availableDataItems,
      filtered,
      page,
      count,
      handleChange,
      putToAvailable
    );
  }, [dataType, availableDataItems, filtered, page, count]);

  useEffect(() => {
    setPage(0);
  }, [dataType]);

  function handleAdd() {}

  function handleChange(item: any, field: string, val: any) {
    const dataField = getDataFieldByType(dataType);
    if (!ui || !dataField) return;
    const keys = getHeaderColumnsOfDataType(dataType);
    const idKey = keys[0];
    if (field === isAvailable) {
      if (Array.isArray(item)) {
        dispatch(
          changeUIAction({
            ...ui,
            availableData: {
              ...availableDataState,
              [dataField]: val ? item : [],
            },
          })
        );
      } else {
        const dataArr: any[] = availableDataState[dataField] ?? [];
        dispatch(
          changeUIAction({
            ...ui,
            availableData: {
              ...availableDataState,
              [dataField]: val
                ? [...dataArr, item]
                : dataArr.filter((el: any) => el[idKey] !== item[idKey]),
            },
          })
        );
      }
    }
  }

  function handleDelete(elements: TDataField[]) {
    const dataField = getDataFieldByType(dataType);
    if (!ui || !dataField) return;
    const keys = getHeaderColumnsOfDataType(dataType);
    const idKey = keys[0];
    dispatch(
      changeUIAction({
        ...ui,
        availableData: {
          ...availableDataState,
          [dataField]: availableDataItems.filter(
            (item) => !elements.some((el) => el.id === item[idKey])
          ),
        },
      })
    );

    dispatch(
      changeDataAction({
        ...dataState,
        [dataField]: dataItems.filter(
          (item) => !elements.some((el) => el.id === item[idKey])
        ),
      })
    );
  }

  function handleExport() {
    exportToCSV(
      dataItems.map((item) => {
        let fixed = {};
        for (const [key, value] of Object.entries(item)) {
          if (typeof value === "number") {
            fixed = { ...fixed, [key]: fixNumberToStr(value) };
          } else if (key === "nps" || key === "nominal_pipe_size_inch") {
            fixed = { ...fixed, [key]: `'${value}'` };
          } else fixed = { ...fixed, [key]: value };
        }
        return fixed;
      }),
      dataType
    );
  }

  function handleImport() {
    const dataField = getDataFieldByType(dataType);
    if (!ui || !dataField) return;
    importFromCSV((arr, isCSV) => {
      if (!isCSV) return;
      const keys = getHeaderColumnsOfDataType(dataType);
      let constData = [...dataItems];
      let availableItems = [...availableDataItems];
      const idKey = keys[0];
      for (const item of arr) {
        if (!item || !item[idKey]) continue;
        let fixed: any = {};
        for (const [key, value] of Object.entries(item)) {
          if (!keys.includes(key)) continue;
          if (key === "nps" || key === "nominal_pipe_size_inch") {
            fixed = {
              ...fixed,
              [key]: `${value}`.replace("'", "").replace("'", ""),
            };
          }
          if (new RegExp(/\d+,\d+/gm).test(`${value}`)) {
            fixed = {
              ...fixed,
              [key]: fixValueToNumber(value as any, "float"),
            };
          } else fixed = { ...fixed, [key]: value };
        }
        if (constData.some((el) => el[idKey] === fixed[idKey])) {
          constData = constData.map((el) =>
            el[idKey] === fixed[idKey] ? fixed : el
          );
        } else constData = [...constData, fixed];

        if (availableItems.some((el) => el[idKey] === fixed[idKey])) {
          availableItems = availableItems.map((el) =>
            el[idKey] === fixed[idKey] ? fixed : el
          );
        } else availableItems = [...availableItems, fixed];
      }
      dispatch(
        changeUIAction({
          ...ui,
          availableData: { ...availableDataState, [dataField]: availableItems },
        })
      );

      dispatch(changeDataAction({ ...dataState, [dataField]: constData }));
    });
  }

  function putToAvailable(ids: number[]) {
    const dataField = getDataFieldByType(dataType);
    if (!ui || !dataField) return;
    const keys = getHeaderColumnsOfDataType(dataType);
    const idKey = keys[0];
    dispatch(
      changeUIAction({
        ...ui,
        availableData: {
          ...availableDataState,
          [dataField]: dataItems.filter((item) => ids.includes(item[idKey])),
        },
      })
    );
  }

  return (
    <CustomDlg
      title={"Catalogue"}
      isMinimize={true}
      body={
        <div className={"d-flex f-column f-grow"}>
          <GenericTable
            dataFields={fields}
            header={header}
            // onAdd={handleAdd}
            onDelete={handleDelete}
            titleElement={
              <>
                <SimpleSelector<EDataTypes>
                  items={dataTypes}
                  itemLabel={(item) => item}
                  selected={dataType}
                  onSelect={(type) => type && setDataType(type)}
                  className="fill-select w-155"
                />
                {dataType === EDataTypes.PROFILE_SECTIONS ? (
                  <SectionsFilter data={dataItems} onChange={setFiltered} />
                ) : (
                  <PipesDataFilter data={dataItems} onChange={setFiltered} />
                )}
              </>
            }
            onExport={handleExport}
            onImport={handleImport}
          />
          <div className="hr" />
          <div
            className={"p-5 d-flex f-jc-end f-ai-center"}
            style={{ gap: 10 }}
          >
            <Button
              small
              minimal
              icon={"caret-left"}
              onClick={() => setPage((prev) => Math.max(prev - 1, 0))}
            />
            <span>Page: {page + 1}</span>
            <Button
              small
              minimal
              icon={"caret-right"}
              onClick={() => setPage((prev) => prev + 1)}
            />
          </div>
        </div>
      }
      onClose={onClose}
    />
  );
}

function getTableParameters(
  type: EDataTypes,
  available: any[],
  filtered: any[],
  page: number,
  count: number,
  onChange: (el: any, field: string, val: any) => any,
  onSelect: (ids: number[]) => any
): { header: THeader; fields: TDataField[] } {
  const keys = getHeaderColumnsOfDataType(type);
  const paged = filtered.slice(page * count, (page + 1) * count);

  const idKey = keys[0];

  const fields: TDataField[] = getFieldsOfDataType(
    keys,
    paged,
    available,
    onChange
  );

  const header: THeader = {
    rows: [
      {
        columns: keys.map((el) =>
          el === isAvailable
            ? {
                element: (
                  <GeneralCheckBoxCell
                    key={"general-check-box"}
                    title={isAvailable}
                    data={fields.map((el) => ({
                      id: el.id,
                      selected: available.some((item) => item[idKey] === el.id),
                    }))}
                    onChange={(dataFields) => {
                      onSelect(
                        dataFields
                          .filter((el) => el.selected)
                          .map((el) => el.id)
                      );
                    }}
                  />
                ),
              }
            : { title: el }
        ),
      },
    ],
  };

  return { header, fields };
}

function getDataFieldByType(type: EDataTypes) {
  switch (type) {
    case EDataTypes.PROFILE_SECTIONS:
      return "profileSectionData";
    case EDataTypes.PIPING_CS:
      return "pipingCS";
    case EDataTypes.PIPING_SS:
      return "pipingSS";
    case EDataTypes.PIPING_CAPS:
      return "pipingCaps";
    case EDataTypes.PIPING_COLLETS:
      return "pipingCollets";
    case EDataTypes.PIPING_ELBOWS:
      return "pipingElbows";
    case EDataTypes.PIPING_RETURNS:
      return "pipingReturns";
    case EDataTypes.PIPING_REDUCERS:
      return "pipingReducers";
    case EDataTypes.PIPING_TEES:
      return "pipingTees";
    case EDataTypes.PIPING_FLANGES:
      return "pipingFlangesAllPresRating";
    case EDataTypes.PIPING_BLIND_FLANGES:
      return "pipingFlangesBlind";
    case EDataTypes.PIPING_THREADED_FLANGES:
      return "pipingFlangesThreaded";
    case EDataTypes.PIPING_WELD_NECK_FLANGES:
      return "pipingFlangesWeldingneck";
    case EDataTypes.PIPING_ORIFICE_SLIPON_FLANGES:
      return "pipingFlangesSlipon";
    case EDataTypes.PIPING_SOCKET_WALDING_FLANGES:
      return "pipingFlangesSocketWelding";
    case EDataTypes.PIPING_LONG_WELDING_NECK_FLANGES:
      return "pipingLongWeldingNeckFlanges";
    case EDataTypes.PIPING_RING_JOINT_FACING_FLANGES:
      return "pipingFlangesRingJointFacing";
    case EDataTypes.PIPING_VALVE_TYPES:
      return "pipingValves";
    case EDataTypes.PIPING_VALVE_ACTUATORS:
      return "pipingValveActuators";
    case EDataTypes.PIPING_VALVE_CONTROLS:
      return "pipingValveControls";
    default:
      return undefined;
  }
}

function getDataByType(type: EDataTypes, state: DataState): any[] {
  switch (type) {
    case EDataTypes.PROFILE_SECTIONS:
      return state.profileSectionData;
    case EDataTypes.PIPING_CS:
      return state.pipingCS;
    case EDataTypes.PIPING_SS:
      return state.pipingSS;
    case EDataTypes.PIPING_CAPS:
      return state.pipingCaps;
    case EDataTypes.PIPING_COLLETS:
      return state.pipingCollets;
    case EDataTypes.PIPING_ELBOWS:
      return state.pipingElbows;
    case EDataTypes.PIPING_RETURNS:
      return state.pipingReturns;
    case EDataTypes.PIPING_REDUCERS:
      return state.pipingReducers;
    case EDataTypes.PIPING_TEES:
      return state.pipingTees;
    case EDataTypes.PIPING_FLANGES:
      return state.pipingFlangesAllPresRating;
    case EDataTypes.PIPING_BLIND_FLANGES:
      return state.pipingFlangesBlind;
    case EDataTypes.PIPING_THREADED_FLANGES:
      return state.pipingFlangesThreaded;
    case EDataTypes.PIPING_WELD_NECK_FLANGES:
      return state.pipingFlangesWeldingneck;
    case EDataTypes.PIPING_ORIFICE_SLIPON_FLANGES:
      return state.pipingFlangesSlipon;
    case EDataTypes.PIPING_SOCKET_WALDING_FLANGES:
      return state.pipingFlangesSocketWelding;
    case EDataTypes.PIPING_LONG_WELDING_NECK_FLANGES:
      return state.pipingLongWeldingNeckFlanges;
    case EDataTypes.PIPING_RING_JOINT_FACING_FLANGES:
      return state.pipingFlangesRingJointFacing;
    case EDataTypes.PIPING_VALVE_TYPES:
      return state.pipingValves;
    case EDataTypes.PIPING_VALVE_ACTUATORS:
      return state.pipingValveActuators;
    case EDataTypes.PIPING_VALVE_CONTROLS:
      return state.pipingValveControls;
    default:
      return [];
  }
}

function getHeaderColumnsOfDataType(type: EDataTypes): string[] {
  switch (type) {
    case EDataTypes.PROFILE_SECTIONS:
      return profilesKeys;
    case EDataTypes.PIPING_CS:
      return pipingKeys;
    case EDataTypes.PIPING_SS:
      return pipingKeys;
    case EDataTypes.PIPING_CAPS:
      return pipingCapKeys;
    case EDataTypes.PIPING_COLLETS:
      return pipingCollets;
    case EDataTypes.PIPING_ELBOWS:
      return pipingElbowKeys;
    case EDataTypes.PIPING_RETURNS:
      return pipingReturnKeys;
    case EDataTypes.PIPING_REDUCERS:
      return pipingReducerKeys;
    case EDataTypes.PIPING_TEES:
      return pipingTeeKeys;
    case EDataTypes.PIPING_FLANGES:
      return pipingFlangeKeys;
    case EDataTypes.PIPING_BLIND_FLANGES:
      return pipingBlindFlangeKeys;
    case EDataTypes.PIPING_THREADED_FLANGES:
      return pipingThreadedFlangeKeys;
    case EDataTypes.PIPING_WELD_NECK_FLANGES:
      return pipingWeldNeckFlangeKeys;
    case EDataTypes.PIPING_ORIFICE_SLIPON_FLANGES:
      return pipingSliponFlangeKeys;
    case EDataTypes.PIPING_SOCKET_WALDING_FLANGES:
      return pipingSocketWeldingFlangeKeys;
    case EDataTypes.PIPING_LONG_WELDING_NECK_FLANGES:
      return pipingLongWeldingNeckFlangeKeys;
    case EDataTypes.PIPING_RING_JOINT_FACING_FLANGES:
      return pipingRingJointFacingFlangeKeys;
    case EDataTypes.PIPING_VALVE_TYPES:
      return pipingValveKeys;
    case EDataTypes.PIPING_VALVE_ACTUATORS:
      return pipingValveActuatorKeys;
    case EDataTypes.PIPING_VALVE_CONTROLS:
      return pipingValveControlKeys;
    default:
      return [];
  }
}

function getFieldsOfDataType(
  keys: string[],
  filtered: any[],
  availableData: any[],
  onChange: (el: any, field: string, val: any) => any
) {
  const dFields: TDataField[] = filtered.map((el) => {
    const fields: TField[] = [];
    const idKey = keys[0];
    const checked = availableData.some((a) => a[idKey] === el[idKey]);
    for (const key of keys) {
      if (key === isAvailable) {
        fields.push({
          type: "CHECKBOX",
          value: checked,
          props: {
            cellType: "td",
            value: checked,
            onChange: (val: any) => onChange(el, isAvailable, val),
          },
        });
      } else fields.push({ type: "CELL", value: el[key] });
    }
    return { id: el[idKey], fields };
  });
  return dFields;
}

const isAvailable = "is available";

const profilesKeys = [
  "profile_section_id",
  isAvailable,
  "name",
  "type",
  "designation",
  "shape",
  "country_code",
  "ax",
  "ax_global",
  "b",
  "b_global",
  "bf",
  "bf_global",
  "c",
  "c_global",
  "ct",
  "ct_global",
  "d",
  "d_global",
  "de",
  "de_global",
  "i",
  "i_global",
  "ix",
  "ix_global",
  "iy",
  "iy_global",
  "iz",
  "iz_global",
  "k",
  "k_global",
  "k1",
  "k1_global",
  "od",
  "od_global",
  "r1",
  "r1_global",
  "r2",
  "r2_global",
  "rz",
  "rz_global",
  "t",
  "t_global",
  "tf",
  "tf_global",
  "tw",
  "tw_global",
  "z",
  "z_global",
  "zx",
  "zx_global",
  "zy",
  "zy_global",
  "zz",
  "zz_global",
  "width",
  "width_global",
  "thickness",
  "thickness_global",
  "height",
  "height_global",
];

const pipingKeys = [
  "piping_details_id",
  isAvailable,
  "nominal_pipe_size_inch",
  "schedule",
  "outside_diameter",
  "wall_thickness",
  "weight",
  "outside_diameter_global",
  "wall_thickness_global",
  "weight_global",
  "specification",
  "ixx",
  "material",
  "country_code",
  "type",
];

const pipingCapKeys = [
  "id",
  isAvailable,
  "nps",
  "material",
  "shape",
  "d",
  "e",
  "limiting_wt",
  "e1",
  "std",
  "xs",
  "xxs",
  "sch_10",
  "sch_20",
  "sch_30",
  "sch_40",
  "sch_60",
  "sch_80",
  "sch_100",
  "sch_120",
  "sch_140",
  "sch_160",
  "sch_5s",
  "sch_10s",
  "sch_40s",
  "sch_80s",
  "schedule",
  "t",
  "weight",
];

const pipingCollets = [
  "id",
  isAvailable,
  "nps",
  "material",
  "shape",
  "d",
  "f1",
  "f2",
  "g",
  "a",
  "b",
  "sch_5s",
  "sch_10s",
  "sch_40s",
  "schedule",
  "t",
  "weight",
];

const pipingElbowKeys = [
  "id",
  isAvailable,
  "nps",
  "material",
  "shape",
  "degree",
  "d",
  "a",
  "std",
  "xs",
  "xxs",
  "sch_10",
  "sch_20",
  "sch_30",
  "sch_40",
  "sch_60",
  "sch_80",
  "sch_100",
  "sch_120",
  "sch_140",
  "sch_160",
  "sch_5s",
  "sch_10s",
  "sch_40s",
  "sch_80s",
  "schedule",
  "t",
  "weight",
];

const pipingReturnKeys = [
  "id",
  isAvailable,
  "nps",
  "material",
  "shape",
  "degree",
  "d",
  "o",
  "k",
  "std",
  "xs",
  "xxs",
  "sch_10",
  "sch_20",
  "sch_30",
  "sch_40",
  "sch_60",
  "sch_80",
  "sch_100",
  "sch_120",
  "sch_140",
  "sch_160",
  "sch_5s",
  "sch_10s",
  "sch_40s",
  "sch_80s",
  "schedule",
  "t",
  "weigth",
];

const pipingReducerKeys = [
  "id",
  isAvailable,
  "nps",
  "material",
  "shape",
  "d1",
  "d2",
  "h",
  "std",
  "xs",
  "xxs",
  "sch_10",
  "sch_20",
  "sch_30",
  "sch_40",
  "sch_60",
  "sch_80",
  "sch_100",
  "sch_120",
  "sch_140",
  "sch_160",
  "sch_5s",
  "sch_10s",
  "sch_40s",
  "sch_80s",
  "schedule",
  "t1",
  "t2",
  "weight",
];

const pipingTeeKeys = [
  "id",
  isAvailable,
  "nps",
  "material",
  "shape",
  "d",
  "d1",
  "d2",
  "c",
  "m",
  "std",
  "xs",
  "xxs",
  "sch_10",
  "sch_20",
  "sch_30",
  "sch_40",
  "sch_60",
  "sch_80",
  "sch_100",
  "sch_120",
  "sch_140",
  "sch_160",
  "sch_5s",
  "sch_10s",
  "sch_40s",
  "sch_80s",
  "schedule",
  "t",
  "t1",
  "t2",
  "weight",
];

const pipingFlangeKeys = [
  "piping_flange_id",
  isAvailable,
  "dn",
  "nps",
  "material",
  "shape",
  "r",
  "s",
  "t",
  "u",
  "k",
  "l",
  "w",
  "x",
  "y",
  "z",
];

const pipingBlindFlangeKeys = [
  "piping_flange_id",
  isAvailable,
  "dn",
  "nps",
  "material",
  "shape",
  "class",
  "o",
  "dr_no",
  "dr_d",
  "dr_g",
  "k",
  "e",
  "c",
  "r",
  "r_mini",
  "x",
  "y",
  "a",
  "b",
  "weight",
];

const pipingThreadedFlangeKeys = [
  "piping_flange_id",
  isAvailable,
  "dn",
  "nps",
  "material",
  "shape",
  "class",
  "o",
  "dr_no",
  "dr_d",
  "dr_g",
  "c_mini",
  "y",
  "r",
  "x",
  "tt",
  "qb",
  "qf",
  "f",
  "weight",
];

const pipingWeldNeckFlangeKeys = [
  "piping_flange_id",
  isAvailable,
  "dn",
  "nps",
  "material",
  "shape",
  "class",
  "o",
  "dr_no",
  "dr_d",
  "dr_g",
  "a",
  "tt",
  "c_mini",
  "y",
  "x",
  "r",
  "weight",
];

const pipingSliponFlangeKeys = [
  "piping_flange_id",
  isAvailable,
  "dn",
  "nps",
  "material",
  "shape",
  "class",
  "o",
  "dr_no",
  "dr_d",
  "dr_g",
  "b_mini",
  "tt",
  "c_mini",
  "y",
  "x",
  "r",
  "weight",
];

const pipingSocketWeldingFlangeKeys = [
  "piping_flange_id",
  isAvailable,
  "dn",
  "nps",
  "material",
  "shape",
  "class",
  "o",
  "dr_no",
  "dr_d",
  "dr_g",
  "k",
  "e",
  "c",
  "r",
  "r_mini",
  "x",
  "y",
  "a",
  "b",
  "weight",
  "b3",
  "d",
];

const pipingLongWeldingNeckFlangeKeys = [
  "piping_flange_id",
  isAvailable,
  "dn",
  "nps",
  "material",
  "shape",
  "class",
  "o",
  "dr_no",
  "dr_d",
  "dr_g",
  "n",
  "a",
  "b",
  "c_mini",
  "r",
];

const pipingRingJointFacingFlangeKeys = [
  "piping_flange_id",
  isAvailable,
  "dn",
  "nps",
  "material",
  "shape",
  "r",
  "s",
  "t",
  "u",
  "k",
  "l",
  "w",
  "x",
  "y",
  "z",
];

const pipingValveKeys = [
  "id",
  isAvailable,
  "type",
  "mass (kg)",
  "length (mm)",
  "SIF (unitless)",
];

const pipingValveActuatorKeys = ["id", isAvailable, "actuator"];

const pipingValveControlKeys = ["id", isAvailable, "control"];

// function compareSection(a: Section, b?: Section | RolledSection) {
//   if (a.country_code !== b?.country_code) return false;
//   if (a.shape !== b?.shape) return false;
//   if (a.name !== b?.name) return false;
//   return a.designation === b?.designation;
// }

// function addSectionToData(
//   data: AvailableSectionListUI[],
//   newProfile: Section
// ) {
//   const library = getProfileLibrary(newProfile);
//   const row = data.find((row) => row.library === library);
//   if (row) {
//     const newRow = {
//       ...row,
//       profiles: getUnicuesArray([...row.profiles, newProfile.designation]),
//     };
//     return data.map((item) => (item.id === newRow.id ? newRow : item));
//   } else {
//     const newRow: AvailableSectionListUI = {
//       id: getNextId(data),
//       selected: false,
//       library,
//       profiles: [newProfile.designation],
//     };
//     return [...data, newRow];
//   }
// }

// function checkProfiles(
//   project: Project,
//   removing: Section[],
//   data: AvailableSectionListUI[]
// ) {
//   if (!removing.length) {
//     dispatch(changeProjectAction(project));
//     handleChangeData(data);
//     setDialog(undefined);
//     return;
//   }
//   const profile = removing.shift();
//   if (!profile) return;
//   const searchMap = searchMatches(profile, [project], compareSection);
//   if (searchMap.size) {
//     setDialog(
//       <ReplaceSection
//         profile={profile.name}
//         onClose={() => {
//           checkProfiles(project, removing, addSectionToData(data, profile));
//         }}
//         onConfirm={(toReplace) => {
//           const changed = handleReplaceProfile(
//             profile,
//             toReplace,
//             [project],
//             searchMap,
//             compareSection
//           );
//           checkProfiles(
//             changed ?? project,
//             removing,
//             addSectionToData(data, toReplace)
//           );
//         }}
//       />
//     );
//   } else checkProfiles(project, removing, data);
// }

// function handleChangeData(availableSectionList: AvailableSectionListUI[]) {
//   if (!ui) return;
//   dispatch(changeUIAction({ ...ui, availableSectionList }));
// }

// function handleAddRow() {
//   handleChangeData([
//     ...data,
//     {
//       id: getNextId(data),
//       selected: false,
//       profiles: [],
//     },
//   ]);
// }

// function handleChangeRow(
//   row: AvailableSectionListUI,
//   field: string,
//   value: any
// ) {
//   const changedData = data.map((item) => {
//     if (item.id === row.id) {
//       if (field === "library") {
//         return { ...item, library: value, profiles: [] };
//       }
//       return { ...item, [field]: value };
//     }
//     return item;
//   });
//   handleChangeData(changedData);
// }

// function handleDeleteRows() {
//   if (!project) return;
//   const dataToDeleting = data.filter((row) => row.selected);
//   const profilesToDeleting = dataToDeleting.reduce((acc, list) => {
//     const filtered = dataState.profileSectionData.filter(
//       (profile) =>
//         (profile.country_code?.trim() ?? "") === list.library &&
//         list.profiles.includes(profile.designation)
//     );
//     return [...acc, ...filtered];
//   }, [] as Section[]);
//   checkProfiles(
//     project,
//     profilesToDeleting,
//     data.filter((row) => !row.selected)
//   );
// }

// function drawRow(row: AvailableSectionListUI) {
//   const filteredProfiles = dataState.profileSectionData.filter(
//     (profile) => profile.country_code === row.library
//   );
//   return (
//     <tr key={row.id}>
//       <CheckBoxCell
//         key={row.id}
//         value={row.selected}
//         onChange={(value) => handleChangeRow(row, "selected", value)}
//       />
//       <SelectorCell<string>
//         items={dataState.CS_Libraries.filter(
//           (lib) => !data.some((item) => item.library === lib)
//         )}
//         selected={row.library}
//         onSelect={(value) => handleChangeRow(row, "library", value)}
//         itemKey={(item) => item}
//         itemLabel={(item) => item}
//         filterable={false}
//       />
//       <td>
//         <Button
//           small
//           minimal
//           icon={"menu"}
//           intent={"primary"}
//           className={"c-light"}
//           onClick={() => {
//             setDialog(
//               <ProfilesDlg
//                 library={row.library ?? ""}
//                 profiles={filteredProfiles}
//                 selected={row.profiles}
//                 onClose={() => setDialog(undefined)}
//                 onSave={(news) => {
//                   handleChangeRow(row, "profiles", news);
//                   setDialog(undefined);
//                 }}
//               />
//             );
//           }}
//         />
//       </td>
//     </tr>
//   );
// }

// function handleDownLoad() {
//   saveToFile(data, "Available Section List", "asl");
// }

// function handleUpLoad() {
//   setDialog(
//     <OpenModelDlg
//       title={"Open available section list"}
//       onClose={parseUpLoaded}
//       extensions={[".asl"]}
//     />
//   );
// }

// function showErrorMsg(msg: string) {
//   dispatch(
//     addEventAction(`Available Section List (Up Load): ${msg}`, "danger")
//   );
// }

// function getProfiles(all: Section[], old: string[], news: string[]) {
//   let changed = [...old];
//   for (const item of news) {
//     if (changed.includes(item)) continue;
//     if (all.some((profile) => profile.designation === item)) {
//       changed = [...changed, item];
//     } else {
//       showErrorMsg(`a profile "${item}" not found!`);
//     }
//   }
//   return changed;
// }

// function parseUpLoaded(file?: File) {
//   if (!file) {
//     setDialog(undefined);
//     return;
//   }
//   if (checkFileType(file.name) !== "asl") return;
//   file.text().then((text) => {
//     const upLoaded = JSON.parse(text);
//     if (!Array.isArray(upLoaded)) return;
//     const newData = new Map<string, string[]>();
//     for (const item of upLoaded) {
//       if (!item.library) continue;
//       if (!Array.isArray(item.profiles)) continue;
//       const filtered = dataState.profileSectionData.filter(
//         (profile) => (profile.country_code?.trim() ?? "") === item.library
//       );
//       if (dataState.CS_Libraries.includes(item.library)) {
//         const items = newData.get(item.library);
//         newData.set(
//           item.library,
//           getProfiles(filtered, items ?? [], item.profiles)
//         );
//       } else {
//         showErrorMsg(`a library "${item.library}" not found!`);
//       }
//     }
//     handleChangeData(
//       Array.from(newData.entries()).map(([key, items], i) => {
//         return {
//           id: i,
//           selected: false,
//           library: key,
//           profiles: items,
//         };
//       })
//     );
//   });
//   setDialog(undefined);
// }
