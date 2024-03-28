import React, { useRef, useState } from "react";
import { Classes, Card } from "@blueprintjs/core";
import { LearnDlgHeader } from "./LearnDlgHeader";
import { Vector2 } from "three";
import "./edu_css/LearnDlg.css";

type Props = {
  title?: string;
  position?: "center" | "default" | Vector2;
  isMinimize?: boolean;
  isMinimal?: boolean;
  zIndex?: number;
  onClose?: () => any;
  body: any;
  actions?: any;
  className?:string;
  isFullScreen?: boolean;
};

export function LearnDlg(props: Props) {
  const {
    title,
    position,
    isMinimize,
    isMinimal,
    onClose,
    body,
    actions,
    zIndex,
  } = props;

  const [minimized, setMinimized] = useState<boolean>(false);
  const [isFullScreen, setIsFullScreen] = useState<boolean>(false);
  const dialog = useRef<HTMLDivElement>(null);

  function toggleFullScreen() {
    setIsFullScreen(!isFullScreen);
  }

  function getStyles(isMinimized: boolean): React.CSSProperties {
        const styles: React.CSSProperties = {
        position: 'fixed', 
        top: 0,
        left: 0,
        overflowY: "auto",
        padding: isMinimal ? 0 : 20,
        margin: 0,
        width: isFullScreen ? '100vw' : 'auto', 
        height: isFullScreen ? '100vh' : 'auto', 
        zIndex: zIndex || 1000  
        };
        return isMinimized ? { ...styles, display: "none" } : styles;
    }
    

  return (
    <div
        ref={dialog}
        className={`${Classes.DIALOG} learnDlg-${Classes.DIALOG} grabbing-dialog no-m no-p ${isFullScreen ? "full-screen" : ""}`}
        style={getStyles(minimized)}
    >
        <LearnDlgHeader 
          title={title}
          isMinimize={isMinimize}
          minimized={minimized}
          onMinimaze={() => setMinimized(!minimized)}
          position={position}
          onClose={onClose}
          parent={dialog}
          onToggleFullScreen={toggleFullScreen}
        />
        <div className={Classes.DIALOG_BODY}>
          {body}
          {actions && (
            <div className={`learnDlg-${Classes.DIALOG_FOOTER}`}>
              <div className={`learnDlg-${Classes.DIALOG_FOOTER_ACTIONS}`}>{actions}</div>
            </div>
          )}
        </div>
    </div>
  );
}
