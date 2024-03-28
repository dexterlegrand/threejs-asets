import { Button, FormGroup, TextArea } from "@blueprintjs/core";
import React from "react";
import { useRecoilState } from "recoil";
import { saveToFile } from "../../components/3d-models/utils";
import { CustomDlg } from "../../components/common/CustomDlg";
import { viewerComments } from "../../recoil/atoms/viewer-comments-atom";

type Props = {
  isShow?: boolean;
  title: string;
  onClose: () => any;
};

export default function ViewerComments({ isShow, title, onClose }: Props) {
  const [comments, setComments] = useRecoilState(viewerComments);

  function handleSave() {
    saveToFile(comments ?? {}, title, "idsvc");
  }

  return (
    <CustomDlg
      zIndex={1}
      title={`Comments of ${title}`}
      body={
        <div className="d-flexf-column">
          <div className="hr" />
          <div className="p-5 bg-dark">
            {Object.entries(comments ?? {})
              .filter(([element]) => element !== "common")
              .map(([element, values], i) => {
                return (
                  <React.Fragment key={`${element}-${i}`}>
                    <h4>{element} comments</h4>
                    {Object.entries((values as any) ?? {}).map(
                      ([field, value]) => {
                        return (
                          <p key={`${element}-${i}-${field}`}>
                            {field} {value}
                          </p>
                        );
                      }
                    )}
                  </React.Fragment>
                );
              })}
            <h4>Common comments</h4>
            {!isShow ? (
              <FormGroup>
                <TextArea
                  fill
                  growVertically={true}
                  value={comments?.common}
                  onChange={(e) =>
                    setComments((prev: any) => ({
                      ...prev,
                      common: e.target.value,
                    }))
                  }
                />
              </FormGroup>
            ) : (
              <p>{comments?.common ?? ""}</p>
            )}
          </div>
        </div>
      }
      actions={
        !isShow ? (
          <>
            <Button
              intent="success"
              text={"Save to File"}
              onClick={handleSave}
            />
          </>
        ) : (
          undefined
        )
      }
      onClose={onClose}
    />
  );
}
