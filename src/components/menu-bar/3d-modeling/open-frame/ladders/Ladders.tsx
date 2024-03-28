import React, { FunctionComponent, useState } from "react";
import { Button } from "@blueprintjs/core";
import { useSelector } from "react-redux";
import { ApplicationState } from "../../../../../store";
import { SimpleSelector } from "../../../../common/SimpleSelector";
import { CheckBoxCell } from "../../../../common/CheckBoxCell";
import { NumericCell } from "../../../../common/NumericCell";
import { Section } from "../../../../../store/data/types";

type OwnProps = {};

type Props = OwnProps;

const Ladders: FunctionComponent<Props> = (props) => {
  const [rows, setRows] = useState<any[]>([{}, {}, {}]);

  const profileSectionData = useSelector(
    (state: ApplicationState) => state.data.profileSectionData
  );
  const CS_Libraries = useSelector((state: ApplicationState) => state.data.CS_Libraries);

  function select() {
    return (
      <SimpleSelector<string>
        items={[]}
        selected={undefined}
        onSelect={() => undefined}
        itemLabel={(item) => item}
        className="fill-select"
      />
    );
  }

  function getRow(index: number) {
    return (
      <tr key={index}>
        <CheckBoxCell />
        <td>{select()}</td>
        <td>{select()}</td>
        <NumericCell className="w-200" />
        <NumericCell className="w-200" />
      </tr>
    );
  }

  return (
    <div className="d-flex f-column">
      <div className="hr" />
      <div className="label-light">
        <span style={{ marginRight: 10 }}>Ladders</span>
        <Button icon="export" text="Export to CSV" intent="success" small />
      </div>
      <div className="hr" />
      <div style={{ padding: 5 }}>
        <table className="table bg-gray">
          <thead>
            <tr>
              <th colSpan={3}>Stringer</th>
              <th colSpan={2}>Rung</th>
              <th colSpan={4}>Cage Hor. Bars</th>
              <th colSpan={3}>Cage Vert. Bars</th>
              <th rowSpan={2}>Cage Head room (m)</th>
            </tr>
            <tr>
              <th>C/S Library</th>
              <th>Profile</th>
              <th>Spacing (mm)</th>
              <th>Dia (mm)</th>
              <th>Spacing</th>
              <th>Width (mm)</th>
              <th>Thickness (mm)</th>
              <th>Spacing (mm)</th>
              <th>Dia (mm)</th>
              <th>Width (mm)</th>
              <th>Thickness (mm)</th>
              <th>Nos</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>
                <SimpleSelector<string>
                  items={CS_Libraries}
                  selected={undefined}
                  onSelect={() => undefined}
                  itemLabel={(item) => item}
                  className="fill-select"
                />
              </td>
              <td>
                <SimpleSelector<Section>
                  items={profileSectionData}
                  selected={undefined}
                  onSelect={() => undefined}
                  itemLabel={(item) => item.designation}
                  className="fill-select"
                  filter={(query, item) =>
                    query
                      ? item.designation.toLocaleLowerCase().includes(query.toLocaleLowerCase())
                      : true
                  }
                />
              </td>
              <td></td>
              <td></td>
              <td></td>
              <td></td>
              <td></td>
              <td></td>
              <td></td>
              <td></td>
              <td></td>
              <td></td>
              <td></td>
            </tr>
          </tbody>
        </table>
      </div>
      <div className="hr" />
      <div className="label-light">
        <Button icon="trash" text="Delete" intent="warning" small />
        <Button
          icon="plus"
          text="Add Row"
          intent="primary"
          small
          onClick={() => setRows([...rows, {}])}
        />
        <Button text="Generate" intent="primary" small />
      </div>
      <div className="hr" />
      <div style={{ padding: 5 }}>
        <table className="table bg-gray">
          <thead>
            <tr>
              <th></th>
              <th>PF No.</th>
              <th>On Face</th>
              <th>Distance from Left (m)</th>
              <th>From EL.</th>
            </tr>
          </thead>
          <tbody>{rows.map((row, index) => getRow(index))}</tbody>
        </table>
      </div>
    </div>
  );
};

export default Ladders;
