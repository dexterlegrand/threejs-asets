import React, { useEffect, useState } from "react";
import { Button, Classes, FormGroup } from "@blueprintjs/core";
import { SelectorCell } from "../../../../common/SelectorCell";
import { SimpleSelector } from "../../../../common/SimpleSelector";
import { Direction3 } from "../../../../../store/main/types";
import { directions3 } from "../../../../../store/main/constants";
import { CustomDlg } from "../../../../common/CustomDlg";
import { getLocalStorageImage } from "../../../../3d-models/utils";

type Props = {
  onConfirm: (map: any) => any;
  onClose: () => any;
};

type Axes = {
  up: Direction3;
  north: Direction3;
  east: Direction3;
};

const axesUrl = "./axes.png";

export function DirectLoadsImportParamsOF(props: Props) {
  const { onConfirm, onClose } = props;

  const [axes, setAxes] = useState("");
  const [PLDUp, setPLDUp] = useState<Direction3>("+Z");
  const [PLDNorth, setPLDNorth] = useState<Direction3>("+Y");
  const [PSDNorth, setPSDNorth] = useState<Direction3>("-X");

  const [PLD, setPLD] = useState<Axes>({ up: "+Z", north: "+Y", east: "+X" });
  const [PSD, setPSD] = useState<Axes>({ up: "+Y", north: "-X", east: "-Z" });

  const [contentMod, setContentMod] = useState<
    "Empty + Content" | "Content only"
  >("Content only");

  const [units, setUnits] = useState<
    "kN-m" | "N-m" | "kg-m" | "kN-mm" | "N-mm" | "kg-mm"
  >("N-mm");

  useEffect(() => {
    setAxes(localStorage.getItem(axesUrl) || "");
    getLocalStorageImage(axesUrl).then((data) => data && setAxes(data));
  }, []);

  useEffect(() => {
    if (PLDUp === "+Y") {
      if (PLDNorth === "+X") {
        setPLD({ up: PLDUp, north: PLDNorth, east: "+Z" });
      } else if (PLDNorth === "+Z") {
        setPLD({ up: PLDUp, north: PLDNorth, east: "-Z" });
      } else if (PLDNorth === "-X") {
        setPLD({ up: PLDUp, north: PLDNorth, east: "-Z" });
      } else if (PLDNorth === "-Z") {
        setPLD({ up: PLDUp, north: PLDNorth, east: "+X" });
      } else {
        setPLDNorth("+X");
      }
    } else if (PLDUp === "-Y") {
      if (PLDNorth === "+X") {
        setPLD({ up: PLDUp, north: PLDNorth, east: "-Z" });
      } else if (PLDNorth === "+Z") {
        setPLD({ up: PLDUp, north: PLDNorth, east: "+X" });
      } else if (PLDNorth === "-X") {
        setPLD({ up: PLDUp, north: PLDNorth, east: "+Z" });
      } else if (PLDNorth === "-Z") {
        setPLD({ up: PLDUp, north: PLDNorth, east: "-X" });
      } else {
        setPLDNorth("+X");
      }
    } else if (PLDUp === "+Z") {
      if (PLDNorth === "+X") {
        setPLD({ up: PLDUp, north: PLDNorth, east: "-Y" });
      } else if (PLDNorth === "+Y") {
        setPLD({ up: PLDUp, north: PLDNorth, east: "+X" });
      } else if (PLDNorth === "-X") {
        setPLD({ up: PLDUp, north: PLDNorth, east: "+Y" });
      } else if (PLDNorth === "-Y") {
        setPLD({ up: PLDUp, north: PLDNorth, east: "-X" });
      } else {
        setPLDNorth("+X");
      }
    } else if (PLDUp === "-Z") {
      if (PLDNorth === "+X") {
        setPLD({ up: PLDUp, north: PLDNorth, east: "+Y" });
      } else if (PLDNorth === "+Y") {
        setPLD({ up: PLDUp, north: PLDNorth, east: "-X" });
      } else if (PLDNorth === "-X") {
        setPLD({ up: PLDUp, north: PLDNorth, east: "-Y" });
      } else if (PLDNorth === "-Y") {
        setPLD({ up: PLDUp, north: PLDNorth, east: "+X" });
      } else {
        setPLDNorth("+X");
      }
    }
  }, [PLDUp, PLDNorth]);

  useEffect(() => {
    if (PSDNorth === "+X") {
      setPSD({ up: "+Y", north: PSDNorth, east: "+Z" });
    } else if (PSDNorth === "-X") {
      setPSD({ up: "+Y", north: PSDNorth, east: "-Z" });
    } else if (PSDNorth === "+Z") {
      setPSD({ up: "+Y", north: PSDNorth, east: "-X" });
    } else if (PSDNorth === "-Z") {
      setPSD({ up: "+Y", north: PSDNorth, east: "+X" });
    }
  }, [PSDNorth]);

  function getLabelAxis(param: "F" | "M", axis: "X" | "Y" | "Z") {
    const res = getAxis(param, axis);
    return `${res.coef} x ${res.name}`;
  }

  function getAxis(param: "F" | "M", axis: "X" | "Y" | "Z") {
    if (PLD.up.includes(axis)) {
      return {
        coef: getAxisValue(param, PSD.up),
        name: `${param}${directionToAxis(PSD.up)}`,
      };
    } else if (PLD.north.includes(axis)) {
      return {
        coef: getAxisValue(param, PSD.north),
        name: `${param}${directionToAxis(PSD.north)}`,
      };
    } else {
      return {
        coef: getAxisValue(param, PSD.east),
        name: `${param}${directionToAxis(PSD.east)}`,
      };
    }
  }

  function directionToAxis(dir: Direction3) {
    if (dir.includes("X")) {
      return "X";
    } else if (dir.includes("Y")) {
      return "Y";
    } else if (dir.includes("Z")) {
      return "Z";
    }
  }

  function getAxisValue(param: "F" | "M", axes: Direction3) {
    return axes === "+X" || axes === "+Y" || axes === "+Z"
      ? getValueByUnit(param)
      : -getValueByUnit(param);
  }

  function getValueByUnit(param: "F" | "M") {
    if (param === "F") {
      switch (units) {
        case "kg-m":
        case "kg-mm":
          return 1;
        case "kN-m":
        case "kN-mm":
          return 101.937;
        case "N-m":
        case "N-mm":
          return 0.10194;
      }
    } else {
      switch (units) {
        case "kg-m":
          return 1;
        case "kg-mm":
          return 0.001;
        case "kN-m":
          return 101.937;
        case "kN-mm":
          return 0.10194;
        case "N-m":
          return 0.10194;
        case "N-mm":
          return 0.0001;
      }
    }
  }

  function handleProceed() {
    const map = new Map();
    map.set("content_only", contentMod === "Content only");
    map.set("FX", getAxis("F", "X"));
    map.set("FY", getAxis("F", "Y"));
    map.set("FZ", getAxis("F", "Z"));
    map.set("MX", getAxis("M", "X"));
    map.set("MY", getAxis("M", "Y"));
    map.set("MZ", getAxis("M", "Z"));
    onConfirm(map);
  }

  return (
    <CustomDlg
      title={"Converter"}
      isMinimize={true}
      zIndex={2}
      body={
        <>
          <div className={"d-flex f-column f-grow"}>
            <div
              className={"d-flex f-grow bg-dark p-5"}
              style={{ color: "#c8c8c8" }}
            >
              <div
                className={"d-flex f-column w-50p"}
                style={{ marginRight: 5 }}
              >
                <div className={"d-flex bg-gray p-5"}>
                  <div className={"d-flex f-column"}>
                    <span>Up ({PLD.up})</span>
                    <img src={axes} alt="axes" />
                  </div>
                  <div className={"d-flex f-column"}>
                    <span className={"f-grow"}>North ({PLD.north})</span>
                    <span>East ({PLD.east})</span>
                  </div>
                </div>
                <span className={"t-center"}>
                  Piping Load Data Co-ord. System
                </span>
              </div>
              <div className={"d-flex f-column w-50p"}>
                <div className={"d-flex bg-gray p-5"}>
                  <div className={"d-flex f-column"}>
                    <span>Up ({PSD.up})</span>
                    <img src={axes} alt="axes" />
                  </div>
                  <div className={"d-flex f-column"}>
                    <span className={"f-grow"}>North ({PSD.north})</span>
                    <span>East ({PSD.east})</span>
                  </div>
                </div>
                <span className={"t-center"}>Asets Lux Co-ord. System</span>
              </div>
            </div>
            <div className={"hr"} />
            <div className={"d-flex f-grow bg-dark p-5"}>
              <table className={"table bg-gray"}>
                <thead>
                  <tr>
                    <th></th>
                    <th>Piping Load Data</th>
                    <th>PDS</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>Up</td>
                    <SelectorCell<Direction3>
                      items={["+Y", "-Y", "+Z", "-Z"]}
                      itemKey={(item) => item}
                      itemLabel={(item) => item}
                      selected={PLDUp}
                      onSelect={(value) => value && setPLDUp(value)}
                      className={"w-50p"}
                      filterable={false}
                    />
                    <td className={"w-50p"}>{PSD.up}</td>
                  </tr>
                  <tr>
                    <td>North</td>
                    <SelectorCell<Direction3>
                      items={directions3}
                      itemKey={(item) => item}
                      itemLabel={(item) => item}
                      selected={PLDNorth}
                      onSelect={(value) => value && setPLDNorth(value)}
                      className={"w-50p"}
                      filterable={false}
                    />
                    <SelectorCell<Direction3>
                      items={["+X", "-X", "+Z", "-Z"]}
                      itemKey={(item) => item}
                      itemLabel={(item) => item}
                      selected={PSDNorth}
                      onSelect={(value) => value && setPSDNorth(value)}
                      className={"w-50p"}
                      filterable={false}
                    />
                  </tr>
                  <tr>
                    <td>East</td>
                    <td className={"w-50p"}>{PLD.east}</td>
                    <td className={"w-50p"}>{PSD.east}</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div className={"hr"} />
            <div className={"label-light bg-dark"}>
              <FormGroup
                className={"no-m"}
                inline
                label={"Oper. & Test load in Load Data: "}
              >
                <SimpleSelector<"Empty + Content" | "Content only">
                  items={["Empty + Content", "Content only"]}
                  itemLabel={(item) => item}
                  selected={contentMod}
                  onSelect={(value) => value && setContentMod(value)}
                  className="fill-select"
                />
              </FormGroup>
            </div>
            <div className={"hr"} />
            <div className={"label-light bg-dark"}>
              <FormGroup
                className={"no-m"}
                inline
                label={"Units in Piping Load Data: "}
              >
                <SimpleSelector<
                  "kN-m" | "N-m" | "kg-m" | "kN-mm" | "N-mm" | "kg-mm"
                >
                  items={["kN-m", "N-m", "kg-m", "kN-mm", "N-mm", "kg-mm"]}
                  itemLabel={(item) => item}
                  selected={units}
                  onSelect={(value) => value && setUnits(value)}
                  className="fill-select"
                />
              </FormGroup>
            </div>
            <div className={"hr"} />
            <div className={"d-flex f-grow bg-dark p-5"}>
              <table className={"table bg-gray"}>
                <thead>
                  <tr>
                    <th>Piping Load Data</th>
                    <th>PDS</th>
                  </tr>
                  <tr>
                    <th style={{ borderLeft: "1px solid #2d2d2d" }}>in N-mm</th>
                    <th>in kg-m</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>FX</td>
                    <td>{getLabelAxis("F", "X")}</td>
                  </tr>
                  <tr>
                    <td>FY</td>
                    <td>{getLabelAxis("F", "Y")}</td>
                  </tr>
                  <tr>
                    <td>FZ</td>
                    <td>{getLabelAxis("F", "Z")}</td>
                  </tr>
                  <tr>
                    <td>MX</td>
                    <td>{getLabelAxis("M", "X")}</td>
                  </tr>
                  <tr>
                    <td>MY</td>
                    <td>{getLabelAxis("M", "Y")}</td>
                  </tr>
                  <tr>
                    <td>MZ</td>
                    <td>{getLabelAxis("M", "Z")}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
          <div className={Classes.DIALOG_FOOTER} style={{ marginTop: 20 }}>
            <div className={Classes.DIALOG_FOOTER_ACTIONS}>
              <Button small text={"Cancel"} onClick={onClose} />
              <Button
                small
                intent={"primary"}
                text={"Proceed"}
                onClick={handleProceed}
              />
            </div>
          </div>
        </>
      }
      onClose={onClose}
    />
  );
}
