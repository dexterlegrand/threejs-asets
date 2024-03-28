import React, { FunctionComponent, useEffect, useRef, useState } from "react";
import { Button } from "@blueprintjs/core";
import {
  PipeRack,
  PipeRackPortal,
  Side,
  BracingParams,
  CantileverParams,
  SupportType,
  UserDirection,
} from "../../../../../store/main/types";
import { NumericCell } from "../../../../common/NumericCell";
import { CheckBoxCell } from "../../../../common/CheckBoxCell";
import { VerticalBracing } from "./VerticalBracing";
import { Cantilever } from "./Cantilever";
import {
  getIndexName,
  getTopOffset,
  exportToCSV,
  arrayToString,
  importFromCSV,
} from "../../../../3d-models/utils";
import { SelectorCell } from "../../../../common/SelectorCell";
import {
  supportTypes,
  bracingTypes,
} from "../../../../../store/main/constants";
import { useDispatch } from "react-redux";
import { addEventAction } from "../../../../../store/ui/actions";
import { isNumber } from "util";
import { Section } from "../../../../../store/data/types";
import {
  fixPortalElements,
  createVBracing,
  splitBeamsByVBracings,
  concatBeams,
  createCantilever,
} from "../../../../3d-models/pipe-rack/pipeRackUtils";

type Props = {
  models: PipeRack[];
  onChange: (model: PipeRack) => any;
  onDelete: (model: PipeRack) => any;
  libs: string[];
  profiles: Section[];
};

type SelectedPortals = {
  pr: string;
  portals: string[];
};

const PortalsParameters: FunctionComponent<Props> = (props) => {
  const { models, onChange, onDelete, profiles, libs } = props;

  const [selected, setSelected] = useState<SelectedPortals[]>([]);
  const [display, setDisplay] = useState<boolean>(true);

  const dispatch = useDispatch();

  function handleSelect(parent: string, portal: string, isSelected: boolean) {
    const pr = selected.find((item) => item.pr === parent);
    if (pr) {
      if (isSelected) {
        setSelected(
          selected.map((item) =>
            item.pr === pr!.pr
              ? ({
                  ...pr,
                  portals: [...pr!.portals, portal],
                } as SelectedPortals)
              : item
          )
        );
      } else {
        if (pr.portals.length === 1) {
          setSelected(selected.filter((item) => item.pr !== parent));
        } else {
          setSelected(
            selected.map((item) =>
              item.pr === pr!.pr
                ? ({
                    ...pr,
                    portals: pr!.portals.filter((p) => p !== portal),
                  } as SelectedPortals)
                : item
            )
          );
        }
      }
    } else {
      setSelected([...selected, { pr: parent, portals: [portal] }]);
    }
  }

  function handleDelete() {
    for (const model of models) {
      if (model.type !== "Pipe Rack") continue;
      const slModel = selected.find((item) => item.pr === model.name);
      if (!slModel) continue;
      const portals = model.portals.filter(
        (el) => !slModel.portals.includes(el.name)
      );
      if (!portals.length) {
        onDelete(model);
        continue;
      }
      onChange({
        ...model,
        ...fixPortalElements(
          model,
          portals.map((el, i, arr) => ({
            ...el,
            length: arr[i + 1] ? arr[i + 1].chainage - el.chainage : 0,
          })),
          model.columns.filter((el) => !slModel!.portals.includes(el.parent)),
          model.beams.filter((el) => !slModel!.portals.includes(el.parent)),
          model.vBracings.filter((el) => !slModel!.portals.includes(el.parent)),
          model.cantilevers.filter(
            (el) => !slModel!.portals.includes(el.parent)
          )
        ),
      });
    }
    setSelected([]);
  }

  function handleChangeChainage(
    model: PipeRack,
    portalName: string,
    chainage: number
  ) {
    const newPortals: PipeRackPortal[] = [];
    model.portals.forEach((el, i, arr) => {
      if (el.name === portalName) {
        if (newPortals[i - 1])
          newPortals[i - 1].length = chainage - newPortals[i - 1].chainage;
        newPortals[i] = {
          ...el,
          chainage,
          length: arr[i + 1] ? arr[i + 1].chainage - chainage : 0,
        };
      } else newPortals[i] = { ...el };
    });
    onChange({
      ...model,
      ...fixPortalElements(
        model,
        newPortals,
        model.columns,
        model.beams,
        model.vBracings,
        model.cantilevers
      ),
    });
  }

  // function handleChangePortalWidth(
  //   model: PipeRack,
  //   portalName: string,
  //   width: number
  // ) {
  //   onChange({
  //     ...model,
  //     ...fixPortalElements(
  //       model,
  //       model.portals.map((el) =>
  //         el.name === portalName ? { ...el, width } : el
  //       ),
  //       model.columns,
  //       model.beams,
  //       model.vBracings,
  //       model.cantilevers
  //     ),
  //   });
  // }

  function handleChangePortalHeight(
    model: PipeRack,
    portalName: string,
    height: number
  ) {
    onChange({
      ...model,
      ...fixPortalElements(
        model,
        model.portals.map((el) =>
          el.name === portalName
            ? { ...el, tiers: el.tiers.map(() => height / el.tiers.length) }
            : el
        ),
        model.columns,
        model.beams,
        model.vBracings,
        model.cantilevers
      ),
    });
  }

  function handleChangePortalTiers(
    model: PipeRack,
    portalName: string,
    tiers: number
  ) {}

  function handleChangePortalSupType(
    model: PipeRack,
    portal: PipeRackPortal,
    supportType?: SupportType
  ) {
    onChange({
      ...model,
      portals: model.portals.map((p) =>
        p.name === portal.name
          ? { ...portal, supportType: supportType ?? "Fix" }
          : p
      ),
    });
  }

  function createVBracings(
    model: PipeRack,
    fromPortal: PipeRackPortal,
    toPortal: PipeRackPortal,
    sides: Side[],
    params: BracingParams
  ) {
    const vBracings = model.vBracings.filter(
      (el) =>
        !(
          el.parent === fromPortal.name &&
          params.sideType === el.sideType &&
          sides.some((side) => side === el.side)
        )
    );
    params.tiers.forEach((tier) =>
      sides.forEach((side) => {
        if (
          params.bracingType === "Diagonal Up" ||
          params.bracingType === "Diagonal Down"
        ) {
          const isUp = params.bracingType === "Diagonal Up";
          const index = getIndexName(vBracings, `VB`);
          vBracings.push(
            createVBracing(
              index,
              `VB${index}`,
              fromPortal,
              toPortal,
              tier,
              side,
              params.sideType,
              params.bracingType,
              params.CSLibrary,
              params.profile,
              model.baseElevation,
              isUp
            )
          );
        } else {
          let index = getIndexName(vBracings, `VB`);
          vBracings.push(
            createVBracing(
              index,
              `VB${index}`,
              fromPortal,
              toPortal,
              tier,
              side,
              params.sideType,
              params.bracingType,
              params.CSLibrary,
              params.profile,
              model.baseElevation,
              true
            )
          );
          index = getIndexName(vBracings, `VB`);
          vBracings.push(
            createVBracing(
              index,
              `VB${index}`,
              fromPortal,
              toPortal,
              tier,
              side,
              params.sideType,
              params.bracingType,
              params.CSLibrary,
              params.profile,
              model.baseElevation
            )
          );
        }
      })
    );
    return vBracings;
  }

  function handelChangePortalBracing(
    model: PipeRack,
    fromPortal: PipeRackPortal,
    toPortal: PipeRackPortal,
    sides: Side[],
    params: BracingParams
  ) {
    const vBracings = createVBracings(
      model,
      fromPortal,
      toPortal,
      sides,
      params
    );
    onChange({
      ...model,
      beams: splitBeamsByVBracings(concatBeams(model.beams, "VB"), vBracings),
      vBracings,
    });
  }

  function handleClearBracings(
    model: PipeRack,
    portal: PipeRackPortal,
    sides: Side[],
    sideType: Side | "Both"
  ) {
    const newVBs = model.vBracings.filter(
      (el) =>
        !(
          el.parent === portal.name &&
          sideType === el.sideType &&
          sides.some((side) => side === el.side)
        )
    );
    onChange({
      ...model,
      beams: splitBeamsByVBracings(concatBeams(model.beams, "VB"), newVBs),
      vBracings: newVBs,
    });
  }

  function createCantilevers(
    model: PipeRack,
    portal: PipeRackPortal,
    sides: Side[],
    params: CantileverParams
  ) {
    const cantilevers = model.cantilevers.filter((el) => {
      return !(
        el.parent === portal.name &&
        params.position === el.positionType &&
        sides.some((side) => side === el.side)
      );
    });
    params.tiers.forEach((tier) =>
      sides.forEach((side) => {
        const index = getIndexName(cantilevers, `CNT-${side}`);
        cantilevers.push(
          createCantilever(
            index,
            `CNT-${side}${index}`,
            portal,
            params.position === "Outsides"
              ? side === "L"
                ? "Left"
                : "Right"
              : params.position,
            params.position,
            tier,
            params.length,
            side,
            params.sideType,
            params.CSLibrary,
            params.profile
          )
        );
      })
    );
    return cantilevers;
  }

  function handelChangePortalCantilever(
    model: PipeRack,
    portal: PipeRackPortal,
    sides: Side[],
    params: CantileverParams
  ) {
    const cantilevers = createCantilevers(model, portal, sides, params);
    onChange({ ...model, cantilevers });
  }

  function handleClearCantilevers(
    model: PipeRack,
    portal: PipeRackPortal,
    sides: Side[],
    position: UserDirection | "Outsides"
  ) {
    onChange({
      ...model,
      cantilevers: model.cantilevers.filter((el) => {
        return !(
          el.parent === portal.name &&
          position === el.positionType &&
          sides.some((side) => side === el.side)
        );
      }),
    });
  }

  function getRow(
    model: PipeRack,
    portal: PipeRackPortal,
    index: number,
    portals: PipeRackPortal[]
  ) {
    const tiers = [];
    for (let tier = 0; tier < portal.tiers.length; tier++) tiers.push(tier);
    return (
      <React.Fragment key={index}>
        <tr key={`${index}-0`}>
          <CheckBoxCell
            key={portal.name}
            rowSpan={3}
            onChange={(checked) =>
              handleSelect(model.name, portal.name, checked)
            }
          />
          <td className="w-50" rowSpan={3}>
            {portal.name}
          </td>
          <NumericCell
            min={portals[index - 1]?.chainage}
            max={portals[index + 1]?.chainage}
            rowSpan={3}
            isDecimal={true}
            disabled={portal.position === "start"}
            value={portal.chainage}
            className="w-70"
            onChange={(value) =>
              handleChangeChainage(model, portal.name, value)
            }
          />
          <td rowSpan={3} className="w-50">
            {portal.width}
          </td>
          <NumericCell
            min={0}
            rowSpan={3}
            isDecimal={true}
            value={portal.tiers[portal.tiers.length - 1]}
            className="w-50"
            onChange={(value) =>
              handleChangePortalHeight(model, portal.name, value)
            }
          />
          <NumericCell
            min={1}
            rowSpan={3}
            value={portal.tiers.length}
            className="w-50"
            onChange={(value) =>
              handleChangePortalTiers(model, portal.name, value)
            }
          />
          <SelectorCell<SupportType>
            rowSpan={3}
            items={supportTypes}
            selected={portal.supportType}
            onSelect={(value) =>
              handleChangePortalSupType(model, portal, value)
            }
            itemKey={(item) => item}
            itemLabel={(item) => item}
            className="w-30"
            filterable={false}
          />
          <VerticalBracing
            bracings={model.vBracings.filter(
              (br) => br.sideType === "R" && br.parent === portal.name
            )}
            side="R"
            tiers={tiers}
            CS_Libraries={libs}
            profiles={profiles}
            onChange={(params) =>
              portal.position !== "end" &&
              handelChangePortalBracing(
                model,
                portal,
                portals[index + 1],
                ["R"],
                params
              )
            }
            onClear={(side) => handleClearBracings(model, portal, ["R"], side)}
          />
          <Cantilever
            cantilevers={model.cantilevers.filter(
              (cnt) => cnt.sideType === "R" && cnt.parent === portal.name
            )}
            side="R"
            tiers={tiers}
            index={index}
            portals={portals}
            CS_Libraries={libs}
            profiles={profiles}
            onChange={(params) =>
              handelChangePortalCantilever(model, portal, ["R"], params)
            }
            onClear={(position) =>
              handleClearCantilevers(model, portal, ["R"], position)
            }
          />
        </tr>
        <tr key={`${index}-1`}>
          <VerticalBracing
            bracings={model.vBracings.filter(
              (br) => br.sideType === "L" && br.parent === portal.name
            )}
            side="L"
            tiers={tiers}
            CS_Libraries={libs}
            profiles={profiles}
            onChange={(params) =>
              portal.position !== "end" &&
              handelChangePortalBracing(
                model,
                portal,
                portals[index + 1],
                ["L"],
                params
              )
            }
            onClear={(side) => handleClearBracings(model, portal, ["L"], side)}
          />
          <Cantilever
            cantilevers={model.cantilevers.filter(
              (cnt) => cnt.sideType === "L" && cnt.parent === portal.name
            )}
            side="L"
            tiers={tiers}
            index={index}
            portals={portals}
            CS_Libraries={libs}
            profiles={profiles}
            onChange={(params) =>
              handelChangePortalCantilever(model, portal, ["L"], params)
            }
            onClear={(position) =>
              handleClearCantilevers(model, portal, ["L"], position)
            }
          />
        </tr>
        <tr key={`${index}-2`}>
          <VerticalBracing
            bracings={model.vBracings.filter(
              (br) => br.sideType === "Both" && br.parent === portal.name
            )}
            side="Both"
            tiers={tiers}
            CS_Libraries={libs}
            profiles={profiles}
            onChange={(params) =>
              portal.position !== "end" &&
              handelChangePortalBracing(
                model,
                portal,
                portals[index + 1],
                ["R", "L"],
                params
              )
            }
            onClear={(side) =>
              handleClearBracings(model, portal, ["R", "L"], side)
            }
          />
          <Cantilever
            cantilevers={model.cantilevers.filter(
              (cnt) => cnt.sideType === "Both" && cnt.parent === portal.name
            )}
            side="Both"
            tiers={tiers}
            index={index}
            portals={portals}
            CS_Libraries={libs}
            profiles={profiles}
            onChange={(params) =>
              handelChangePortalCantilever(model, portal, ["R", "L"], params)
            }
            onClear={(position) =>
              handleClearCantilevers(model, portal, ["R", "L"], position)
            }
          />
        </tr>
      </React.Fragment>
    );
  }

  const tableRef = useRef<HTMLTableElement>(null);

  const [offsetTop, setOffsetTop] = useState<number>(0);

  useEffect(() => {
    const newOffsetTop = getTopOffset(tableRef.current, 1);
    offsetTop !== newOffsetTop && setOffsetTop(newOffsetTop);
  });

  function handleExport() {
    let exportData: any[] = [];
    models.forEach((model) => {
      model.portals.forEach((portal) => {
        const portalRow = {
          model: model.name,
          portal: portal.name,
          chainage: portal.chainage,
          width: portal.width,
          totalHeight: portal.tiers.reduce(
            (max, tier) => Math.max(max, tier),
            0
          ),
          tiers: portal.tiers.length,
          supportType: portal.supportType,
        };

        const vbs = model.vBracings.filter((br) => br.parent === portal.name);
        const rvbs = vbs.filter((br) => br.sideType === "R");
        const lvbs = vbs.filter((br) => br.sideType === "L");
        const bvbs = vbs.filter((br) => br.sideType === "Both");

        const cnts = model.cantilevers.filter(
          (cnt) => cnt.parent === portal.name
        );
        const rcnts = cnts.filter((cnt) => cnt.sideType === "R");
        const lcnts = cnts.filter((cnt) => cnt.sideType === "L");
        const bcnts = cnts.filter((cnt) => cnt.sideType === "Both");

        const fstRow = {
          ...portalRow,
          side: "R",
          bracingType: rvbs[0]?.bracingType,
          bracingTiers: arrayToString(
            Array.from(
              new Set(rvbs.map((item) => item.tier).sort((a, b) => a - b))
            )
          ),
          bracingLibrary: rvbs[0]?.CSLibrary,
          bracingProfile: rvbs[0]?.profile.designation,
          cantileverTiers: arrayToString(
            Array.from(
              new Set(rcnts.map((item) => item.tier).sort((a, b) => a - b))
            )
          ),
          cantileverPostion: rcnts[0]?.positionType,
          cantileverLibrary: rcnts[0]?.CSLibrary,
          cantileverProfile: rcnts[0]?.profile.designation,
          cantileverLength: rcnts[0]?.length,
        };
        const sndRow = {
          ...portalRow,
          side: "L",
          bracingType: lvbs[0]?.bracingType,
          bracingTiers: arrayToString(
            Array.from(
              new Set(lvbs.map((item) => item.tier).sort((a, b) => a - b))
            )
          ),
          bracingLibrary: lvbs[0]?.CSLibrary,
          bracingProfile: lvbs[0]?.profile.designation,
          cantileverTiers: arrayToString(
            Array.from(
              new Set(lcnts.map((item) => item.tier).sort((a, b) => a - b))
            )
          ),
          cantileverPostion: lcnts[0]?.positionType,
          cantileverLibrary: lcnts[0]?.CSLibrary,
          cantileverProfile: lcnts[0]?.profile.designation,
          cantileverLength: lcnts[0]?.length,
        };
        const trdRow = {
          ...portalRow,
          side: "Both",
          bracingType: bvbs[0]?.bracingType,
          bracingTiers: arrayToString(
            Array.from(
              new Set(bvbs.map((item) => item.tier).sort((a, b) => a - b))
            )
          ),
          bracingLibrary: bvbs[0]?.CSLibrary,
          bracingProfile: bvbs[0]?.profile.designation,
          cantileverTiers: arrayToString(
            Array.from(
              new Set(bcnts.map((item) => item.tier).sort((a, b) => a - b))
            )
          ),
          cantileverPostion: bcnts[0]?.positionType,
          cantileverLibrary: bcnts[0]?.CSLibrary,
          cantileverProfile: bcnts[0]?.profile.designation,
          cantileverLength: bcnts[0]?.length,
        };
        exportData = [...exportData, fstRow, sndRow, trdRow];
      });
    });
    exportToCSV(exportData, "Portals Parameters");
  }

  function handleImport() {
    importFromCSV((data, isCSV) => {
      if (isCSV) {
        const map = new Map<string, Map<string, any[]>>();
        try {
          data.forEach((item) => {
            const model = map.get(item.model);
            if (model) {
              const portal = model.get(item.portal);
              if (portal) {
                model.set(item.portal, [...portal, item]);
              } else {
                model.set(item.portal, [item]);
              }
              map.set(item.model, model);
            } else {
              const model = new Map<string, any[]>();
              model.set(item.portal, [item]);
              map.set(item.model, model);
            }
          });
        } catch (e) {
          dispatch(
            addEventAction(
              "Import Portal Parameters: Grouping error!",
              "danger"
            )
          );
          return;
        }
        const sides = ["Both", "L", "R"];
        const positions = ["Front", "Left", "Back", "Right", "Outsides"];
        Array.from(map.entries()).forEach(([modelName, portals]) => {
          try {
            let model = models.find((model) => model.name === modelName);
            if (model) {
              Array.from(portals.entries()).forEach(([portalName, rows]) => {
                let portal = model!.portals.find(
                  (portal) => portal.name === portalName
                );
                if (portal) {
                  const portalIndex = model?.portals.findIndex(
                    (item) => item.name === portal?.name
                  );
                  rows.forEach((row) => {
                    if (
                      model &&
                      portal &&
                      isNumber(row.chainage) &&
                      row.chainage !== portal.chainage
                    ) {
                      const newPortals: PipeRackPortal[] = [];
                      model.portals.forEach((el, i, arr) => {
                        if (el.name === portalName) {
                          if (newPortals[i - 1])
                            newPortals[i - 1].length =
                              row.chainage - newPortals[i - 1].chainage;
                          newPortals[i] = {
                            ...el,
                            chainage: row.chainage,
                            length: arr[i + 1]
                              ? arr[i + 1].chainage - row.chainage
                              : 0,
                          };
                        } else newPortals[i] = { ...el };
                      });
                      model = {
                        ...model,
                        ...fixPortalElements(
                          model,
                          newPortals,
                          model.columns,
                          model.beams,
                          model.vBracings,
                          model.cantilevers
                        ),
                      };
                      portal = model.portals.find(
                        (item) => item.id === portal!.id
                      );
                    }
                    if (
                      model &&
                      portal &&
                      isNumber(row.totalHeight) &&
                      Math.max(...portal.tiers) !== row.totalHeight
                    ) {
                      model = {
                        ...model,
                        ...fixPortalElements(
                          model,
                          model.portals.map((el) =>
                            el.name === portalName
                              ? {
                                  ...el,
                                  tiers: el.tiers.map(
                                    () => row.totalHeight / el.tiers.length
                                  ),
                                }
                              : el
                          ),
                          model.columns,
                          model.beams,
                          model.vBracings,
                          model.cantilevers
                        ),
                      };
                    }
                    if (
                      model &&
                      portal &&
                      supportTypes.includes(row.supportType) &&
                      portal.supportType !== row.supportType
                    ) {
                      model = {
                        ...model,
                        portals: model.portals.map((p) =>
                          p.name === portal!.name
                            ? { ...portal!, supportType: row.supportType }
                            : p
                        ),
                      };
                    }
                    if (sides.includes(row.side)) {
                      const bracingTiers = row.bracingTiers
                        ? JSON.parse(row.bracingTiers)
                        : [];
                      const cantileverTiers = row.cantileverTiers
                        ? JSON.parse(row.cantileverTiers)
                        : [];
                      if (
                        bracingTypes.includes(row.bracingType) &&
                        bracingTiers.length &&
                        row.bracingLibrary &&
                        row.bracingProfile
                      ) {
                        const nextPortal =
                          portalIndex !== undefined && portalIndex > -1
                            ? model?.portals[portalIndex + 1]
                            : undefined;
                        const profile = profiles.find(
                          (profile) =>
                            (profile.country_code?.trim() ?? "") ===
                              row.bracingLibrary &&
                            profile.designation === row.bracingProfile
                        );
                        if (model && nextPortal && profile) {
                          const vBracings = createVBracings(
                            model,
                            portal!,
                            nextPortal,
                            row.side === "Both" ? ["L", "R"] : [row.side],
                            {
                              sideType: row.side,
                              bracingType: row.bracingType,
                              tiers: bracingTiers,
                              CSLibrary: row.bracingLibrary,
                              profile,
                            }
                          );
                          model = {
                            ...model,
                            beams: splitBeamsByVBracings(
                              concatBeams(model.beams, "VB"),
                              vBracings
                            ),
                            vBracings,
                          };
                        }
                      }
                      if (
                        model &&
                        positions.includes(row.cantileverPostion) &&
                        cantileverTiers.length &&
                        row.cantileverLibrary &&
                        row.cantileverProfile &&
                        row.cantileverLength
                      ) {
                        const profile = profiles.find(
                          (profile) =>
                            (profile.country_code?.trim() ?? "") ===
                              row.cantileverLibrary &&
                            profile.designation === row.cantileverProfile
                        );
                        if (profile) {
                          if (row.cantileverPostion === "Outsides") {
                            if (row.side === "Both") {
                              model = {
                                ...model,
                                cantilevers: createCantilevers(
                                  model,
                                  portal!,
                                  row.side === "Both" ? ["L", "R"] : [row.side],
                                  {
                                    sideType: row.side,
                                    position: row.cantileverPostion,
                                    tiers: cantileverTiers,
                                    CSLibrary: row.cantileverLibrary,
                                    profile,
                                    length: row.cantileverLength,
                                  }
                                ),
                              };
                            }
                          } else {
                            model = {
                              ...model,
                              cantilevers: createCantilevers(
                                model,
                                portal!,
                                row.side === "Both" ? ["L", "R"] : [row.side],
                                {
                                  sideType: row.side,
                                  position: row.cantileverPostion,
                                  tiers: cantileverTiers,
                                  CSLibrary: row.cantileverLibrary,
                                  profile,
                                  length: row.cantileverLength,
                                }
                              ),
                            };
                          }
                        }
                      }
                    }
                  });
                } else {
                  dispatch(
                    addEventAction(
                      `Import Portal Parameters: Portal "${portalName}" in model "${modelName}" not found!`,
                      "warning"
                    )
                  );
                }
              });
              onChange(model);
            } else {
              dispatch(
                addEventAction(
                  `Import Portal Parameters: Model "${modelName}" not found!`,
                  "warning"
                )
              );
            }
          } catch (e) {
            dispatch(
              addEventAction(
                "Import Portal Parameters: Error applying changes to model!",
                "danger"
              )
            );
          }
        });
      }
    });
  }

  return (
    <>
      <div className="hr" />
      <div className="label-light bg-dark">
        <Button
          icon={display ? "caret-down" : "caret-right"}
          onClick={() => setDisplay(!display)}
          minimal
          small
        />
        <span>Pipe Rack Parameters</span>
        <Button
          icon="trash"
          text="Delete"
          intent="warning"
          small
          onClick={handleDelete}
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
      </div>
      <div className="hr" />
      <div className={"p-5"} style={{ display: display ? "block" : "none" }}>
        <div style={{ maxHeight: "40vh", overflow: "auto" }}>
          <table ref={tableRef} className="table bg-gray">
            <thead>
              <tr>
                <th rowSpan={2}></th>
                <th rowSpan={2}>Portal number</th>
                <th rowSpan={2}>Chainage (m)</th>
                <th rowSpan={2}>Width (m)</th>
                <th rowSpan={2}>Total Height (m)</th>
                <th rowSpan={2}>No. of Tiers</th>
                <th rowSpan={2}>Support Type</th>
                <th colSpan={5}>Portal to Portal vertical Bracing</th>
                <th colSpan={6}>Cantilever on portal</th>
              </tr>
              <tr>
                <th style={{ top: offsetTop }}>Side</th>
                <th style={{ top: offsetTop }}>Type</th>
                <th style={{ top: offsetTop }}>Applicable Tier List</th>
                <th style={{ top: offsetTop }}>C/S Library</th>
                <th style={{ top: offsetTop }}>Profile</th>
                <th style={{ top: offsetTop }}>Side</th>
                <th style={{ top: offsetTop }}>Applicable Tier List</th>
                <th style={{ top: offsetTop }}>Position</th>
                <th style={{ top: offsetTop }}>C/S Library</th>
                <th style={{ top: offsetTop }}>Profile</th>
                <th style={{ top: offsetTop }}>Length (m)</th>
              </tr>
            </thead>
            <tbody>
              {models.map((model) =>
                model.portals
                  .sort((a, b) => a.id - b.id)
                  .map((portal, index, portals) =>
                    getRow(model, portal, index, portals)
                  )
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
};

export default PortalsParameters;
