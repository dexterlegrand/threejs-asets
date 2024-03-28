import React, { useEffect, useState } from "react";
import { getLocalStorageImage } from "../../components/3d-models/utils";

const logoUrl = `./old/icon/AsetsLuxLogo.svg`;

export function LoadScreen() {
  const [logo, setLogo] = useState("");

  useEffect(() => {
    setLogo(localStorage.getItem(logoUrl) || "");
    getLocalStorageImage(logoUrl).then((data) => data && setLogo(data));
  }, []);

  return (
    <div
      id="splash_screen"
      className="container h-100"
      style={{ backgroundColor: "#1f8eb7" }}
    >
      <div className="row align-items-center h-100">
        <div className="justify-content-center my-auto">
          <img id="splash_img" src={logo} alt={"AsetsLux"} />
        </div>
      </div>
    </div>
  );
}
