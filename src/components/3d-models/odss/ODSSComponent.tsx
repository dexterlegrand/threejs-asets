import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { Group } from "three";
import { ApplicationState } from "../../../store";
import { ODSS, ODSSUserDefinedSection } from "../../../store/main/odssTypes";
import { drawODSS } from "../odss";

type Props = {
  project: string;
  customProfiles: ODSSUserDefinedSection[] | undefined;
  model: ODSS;
};

export default React.memo(function ODSSComponent({
  project,
  customProfiles,
  model,
}: Props) {
  const [group, setGroup] = useState<Group>();

  const scene = useSelector((state: ApplicationState) => state.main.scene);
  const data = useSelector((state: ApplicationState) => state.data);

  useEffect(() => {
    setGroup(drawODSS(project, model, data, customProfiles));
    return () => {
      setGroup(undefined);
    };
  }, [project, customProfiles, model, scene, data.profileSectionData, data.font]);

  useEffect(() => {
    if (!group) return;
    scene.add(group);
    return () => {
      scene.remove(group);
    };
  }, [scene, group]);

  return null;
});
