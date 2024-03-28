import React, { useState } from "react";
import { CustomDlg } from "../../../common/CustomDlg";
import { Button } from "@blueprintjs/core";
import { TProcessElement } from "../../../../store/process/types";

type ElasticityDialogProps = {
    element: TProcessElement;
    onClose: () => void;
    onSave: (updatedElement: TProcessElement) => void;
};

export const ElasticityDialog: React.FC<ElasticityDialogProps> = ({ element, onClose, onSave }) => {
    const [Kx, setKx] = useState<number>(element.kValue?.Kx || 0);
    const [Ky, setKy] = useState<number>(element.kValue?.Ky || 0);
    const [Kz, setKz] = useState<number>(element.kValue?.Kz || 0);
    const [KRx, setKRx] = useState<number>(element.kValue?.KRx || 0);
    const [KRy, setKRy] = useState<number>(element.kValue?.KRy || 0);
    const [KRz, setKRz] = useState<number>(element.kValue?.KRz || 0);

    const handleSave = () => {
        const updatedElement = {
            ...element,
            kValue: { Kx, Ky, Kz, KRx, KRy, KRz }
        };
        onSave(updatedElement);
    };

    return (
        <CustomDlg
            title="Set Elasticity Values"
            zIndex={10}
            onClose={onClose}
            body={
                <div className="d-flex f-column">
                    <label>Kx: <input type="number" value={Kx} onChange={e => setKx(+e.target.value)} /></label>
                    <label>Ky: <input type="number" value={Ky} onChange={e => setKy(+e.target.value)} /></label>
                    <label>Kz: <input type="number" value={Kz} onChange={e => setKz(+e.target.value)} /></label>
                    <label>KRx: <input type="number" value={KRx} onChange={e => setKRx(+e.target.value)} /></label>
                    <label>KRy: <input type="number" value={KRy} onChange={e => setKRy(+e.target.value)} /></label>
                    <label>KRz: <input type="number" value={KRz} onChange={e => setKRz(+e.target.value)} /></label>
                </div>
            }
            actions={
                <>
                    <Button text="Cancel" onClick={onClose} />
                    <Button text="Save" onClick={handleSave} intent="primary" />
                </>
            }
        />
    );
}
