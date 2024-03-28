import React, { useEffect, useState } from "react";
import { getLocalStorageImage } from "../3d-models/utils";

const logoUrl = "./old/icon/AsetsLuxLogoWhite.png";

export function Logo() {
  const [logo, setLogo] = useState("");

  useEffect(() => {
    setLogo(localStorage.getItem(logoUrl) || "");
    getLocalStorageImage(logoUrl).then((data) => data && setLogo(data));
  }, []);

  return (
    <a href={"./"}>
      <img
        id="logoimg"
        src={logo}
        alt={"AsetsLux"}
        style={{
          maxHeight: "101px",
          maxWidth: "100%",
        }}
      />
    </a>
  );
}
