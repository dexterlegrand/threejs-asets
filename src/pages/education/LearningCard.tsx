import React, { useState, useEffect } from "react";
import {
  H4,
  Card,
  Button,
  Divider,
  EditableText,
  ButtonGroup,
  Checkbox,
} from "@blueprintjs/core";
import { TCourse } from "../../store/learnings/types";
import { openFile } from "../../components/3d-models/utils";


import { ApplicationState } from "../../store";
import { useDispatch, useSelector } from "react-redux";
import { useMemo } from "react";
import { CSSProperties } from "react";
import './edu_css/CardStyle.css';


type Props = {
  course: TCourse;
  onStudent?: () => any;
  onView: () => any;
  onValidation?: () => any;
  onChange: (course: TCourse, field: string, value: any) => any;
  onDelete: (course: TCourse) => any;
  isEditing: boolean;
};

export function LearningCard({
  course,
  onStudent,
  onView,
  onChange,
  onDelete,
  isEditing,
}: Props) {
  const [isRemoving, setRemoving] = useState<boolean>(false);
  const [uploaded, setUploaded] = useState<File>();
  const [isHovered, setIsHovered] = useState(false);
  const [selectedOptions, setSelectedOptions] = useState<string[]>([]);

  const products = useSelector((state: ApplicationState) => state.main.products ?? []);

  const handleMouseEnter = () => {
    setIsHovered(true);
  }

  const handleMouseLeave = () => {
    setIsHovered(false);
  }

  const isProduction = useMemo(() => {
    return process.env.NODE_ENV === "production";
  }, []);

  useEffect(() => {
    setRemoving(false);
  }, [isEditing]);

  useEffect(() => {
    isEditing && uploaded && onChange(course, "imgFile", uploaded);
    return () => {
      uploaded && setUploaded(undefined);
    };
  }, [isEditing, uploaded]);

  function handleDelete() {
    setRemoving((prev) => !prev);
    onDelete(course);
  }

  function handleAddImage() {
    if (!isEditing) return;
    openFile([".jpg", ".jpeg", ".png"], (files) => {
      const file = files[0];
      file && setUploaded(file);
    });
  }

  function handleDropImage(ev: any) {
    ev.preventDefault();
    let file: File | undefined;
    if (ev.dataTransfer.items && ev.dataTransfer.items.find) {
      file = ev.dataTransfer.items
        .find((item: any) => item.kind === "file")
        ?.getAsFile();
    } else file = ev.dataTransfer.files[0];
    if (file && ["image/jpeg", "image/png"].includes(file.type))
      setUploaded(file);
  }

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { value, checked } = e.target;

    setSelectedOptions(prev => {
        let updatedOptions;
        if (checked) {
            updatedOptions = [...prev, value];
        } else {
            updatedOptions = prev.filter(option => option !== value);
        }
        onChange(course, "toolType", updatedOptions);

        return updatedOptions;
    });
};

  
  return (
    <Card
      interactive={true}
      className={`courseCard-containerl ${isHovered ? 'isHovered' : ''}`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Image and Text Section */}
      <div className="courseCard-imageContainerl">
        {course.img || course.icon || isEditing ? (
          <img
            draggable={true}
            className={!(course.img || course.icon || uploaded) ? 'image dashed' : 'image'}
            height={140}
            width={140}
            src={course.img || course.icon || (uploaded && URL.createObjectURL(uploaded))}
            alt={course.img || course.icon || uploaded ? "Course image" : "Drag image or click area"}
            onClick={handleAddImage}
            onDrop={handleDropImage}
            onDragOver={(e) => e.preventDefault()}
          />
        ) : null}
  
        {/* Editable Text and Button Section */}
        <div className="courseCard-textSectionl">
          <div className="courseCard-headerSectionl">
            {isEditing ? (
              <>
              <Button className="button-Cancel" small icon={"cross"} intent={"danger"} onClick={handleDelete} />
                <div className="courseCard-editableTitlel">
                  <EditableText
                    multiline={true}
                    maxLines={3}
                    disabled={isRemoving}
                    value={course.name}
                    onChange={(value) => onChange(course, "name", value)}
                  />
                </div>
                
              </>
            ) : (
              <H4>{course.name}</H4>
            )}
          </div>
  
          {isEditing ? (
            <EditableText
              multiline={true}
              maxLines={4}
              disabled={isRemoving}
              value={course.description}
              onChange={(value) => onChange(course, "description", value)}
            />
          ) : (
            <p>{course.description}</p>
          )}
        </div>
      </div>
  
      {/* Footer Section */}
      <div className="courseCard-footerl">
        <Divider />
        {course.isStudent || isEditing ? (
          <ButtonGroup>
            {isEditing ? (
              <>
              <Checkbox
                checked={!!course.isStudent}
                disabled={isRemoving}
                onChange={(e) => onChange(course, "isStudent", e.currentTarget.checked)}
              />
                <div className="courseOptionSelector">
    <label>Choose course options:</label>
    <div>
        <Checkbox 
            name="toolType"
            value="viewer"
            checked={selectedOptions.includes("viewer")}
            onChange={handleCheckboxChange}
        />
        Viewer
    </div>
    <div>
        <Checkbox 
            name="toolType"
            value="process"
            checked={selectedOptions.includes("process")}
            onChange={handleCheckboxChange}
        />
        Process
    </div>
    <div>
        <Checkbox 
            name="toolType"
            value="Designer"
            checked={selectedOptions.includes("Designer")}
            onChange={handleCheckboxChange}
        />
        Designer
    </div>
    <div>
        <Checkbox 
            name="toolType"
            value="Pipe"
            checked={selectedOptions.includes("Pipe")}
            onChange={handleCheckboxChange}
        />
        Piping
    </div>
    <div>
        <Checkbox 
            name="toolType"
            value="OF"
            checked={selectedOptions.includes("OF")}
            onChange={handleCheckboxChange}
        />
        Structure
    </div>
</div>

              
            </>
            ) : null}
            <Button
              className={"courseCard-buttonl"}
              text={"Edit Course"}
              onClick={onStudent}
              disabled={isProduction && !(products.includes("Instructor")) || !course.name}
            />
          </ButtonGroup>
        ) : null}
        {!isEditing ? <Button className="courseCard-buttonl" text={"View Course"} onClick={onView} /> : null}
      </div>
    </Card>
  );  
}
