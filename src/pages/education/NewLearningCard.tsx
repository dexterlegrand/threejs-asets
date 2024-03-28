import React from 'react';
import { Card, Icon, Tooltip } from '@blueprintjs/core';
import  './edu_css/CardStyle.css';

type Props = {
  onAdd: () => any;
};

export function NewLearningCard({ onAdd }: Props) {
  return (
    <Tooltip content="Click to add a new Course">
      <Card
        interactive={true}
        onClick={onAdd}
        className="new-learning-cardl"
      >
        <div className="new-learning-card-contentl">
          <Icon 
            icon="plus" 
            iconSize={50} 
            intent="primary"
            className="new-learning-iconl"
          />
          <div className="new-learning-textl">
            Add New Learning Card
          </div>
        </div>
      </Card>
    </Tooltip>
  );
}




