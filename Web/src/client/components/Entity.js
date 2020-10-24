import React, { useState, useEffect } from 'react';
import { Stage, Group, Rect, Text, Circle, Line } from 'react-konva';

const Entity = props => {
  const [name, setName] = useState('ClassName')
  const [height, setHeight] = useState(100)
  const [width, setWidth] = useState(150)
  const [fields, setFields] = useState(['dupa1', 'dupa2'])

  const handleDoubleClick = e => {
    setName('xd')
  }

  const handleDragEnd = e => {
    props.onDragEnd({
      id: props.id,
      x: e.target.attrs['x'],
      y: e.target.attrs['y']
    })
  }

  return (
    <Group
      x={props.x}
      y={props.y}
      onDblclick={handleDoubleClick}
      onDragEnd={handleDragEnd}
      draggable>
      <Rect
        x={0}
        y={0}
        width={width}
        height={height / 2}
        stroke='black'
        strokeWidth={1}
      />
      <Rect
        x={0}
        y={height / 2}
        width={width}
        height={height / 2}
        stroke='black'
        strokeWidth={1}
      />
      <Text
        x={0}
        y={0} 
        width={width}
        text={name} 
        fontSize={15}
        align='center'
      />
      {fields.map((field, index) => 
        <Text 
          x={0}
          y={height / 2 + index * 15} 
          key={index} 
          text={'+ field: ' + field} 
        />)}
    </Group>
  )
}

export default Entity