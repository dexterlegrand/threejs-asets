import React from "react";
import { Button } from "@blueprintjs/core";
import { push } from "connected-react-router";
import "./AboutPage.css";


export function About() {
  return (
    <div style={{ backgroundColor: "White", margin: "5em" }}>
      <h1>About</h1>
      <ul>
        <li>FDS UI is a Property of ASETS-LUX S.A.R.L.</li>
        <li>FDS UI is a Property of ASETS-LUX Consulting LLP</li>
      </ul>
      <h4>WARNING !</h4>
      <p>
        This software facilitates the preliminary engineering studies with
        respect to flare design. Based on calculation methods complying with
        the principles of the applied standards, this software enables to make
        a certain number of verifications in view of evaluating a solution for
        a pre-design. It does not enable to analyze all situations and to make
        in an exhaustive way all relevant calculations needed for a study of
        execution which requires in every case the advice of an external
        Engineering Office. Given the complexity of the calculation methods,
        this software is only intended for professional users active in the
        sector of steel designs (who are fully aware of the possibilities,
        limits and its adequacy thereof for specific practical cases). The
        users shall use the software under his own responsibility and at his
        own risks. This software is used only under subscription bases. No
        right is granted to the user of the software, the property and
        intellectual rights of which continue to belong exclusively to
        ASETS-LUX S.A.R.L (or, depending on the case, to the company of the
        ASETS-LUX Group who is owner of these rights.) No warranty is granted
        to the user. ASETS-LUX S.A.R.L and/or any other subsidiaries of the
        ASETS-LUX S.A.R.L Group cannot be held liable for any loss or damage
        directly and/or indirectly sustained as a result of the use of the
        software. The user undertakes to hold ASETS-LUX S.A.R.L free and
        harmless from any claim and any direct, indirect and/or consequential
        damages, in particular those resulting from an incorrect or
        inappropriate use or a use made for an inadequate or inappropriate
        purpose of the software.
        <br />
        BY PRESSING THE BUTTON REFERRED TO BELOW AS &quot;ACCEPT&quot;, THE USER
        EXPRESSLY DECLARES THAT HE HAS CAREFULLY READ THE ABOVE TEXT AND THAT
        HE THEREBY ACCEPTS ALL LEGAL CONSEQUENCES AND OBLIGATIONS RESULTING
        FOR HIM THEREFORE.
      </p>

      <span><h3><b>Version: </b>1.00.00.0</h3></span>
      <Button onClick={() => push("/editor")}>
        Back to editor
      </Button>
    </div>
  );
}
