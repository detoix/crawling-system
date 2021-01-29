import React, { useState, useRef, useEffect } from 'react';
import { withRouter, useParams } from 'react-router-dom'  
import { Stage, Layer } from 'react-konva';
import { Toolbar, Button, Menu, MenuItem } from '@material-ui/core';
import { Class, ArrowRightAlt, GetApp } from '@material-ui/icons'
import { downloadURI } from '../utils/utils'
import Entity from './Entity'
import EntityEditor from './EntityEditor'
import Relation from './Relation'
import ExtendedEntity from './ExtendedEntity'
import RelationEditor from './RelationEditor'

const Home = ({socket}) => {
  const { id } = useParams()
  const draggedItemRef = useRef()
  const stageRef = useRef()
  const [entities, setEntities] = useState([])
  const [relations, setRelations] = useState([])
  const [MaybeEntityEditor, setMaybeEntityEditor] = useState(() => props => null)
  const [MaybeMenu, setMaybeMenu] = useState(() => props => null)

  useEffect(() => {
    socket.on("DIAGRAM_PERSISTED", data => {
      if (data.id == id) {
        setEntities(data.entities
          .map(e => new ExtendedEntity(e)))
        setRelations(data.relations)
      } else if (!data.id) {
        setEntities([])
        setRelations([])
      }
    })   

    return () => socket.off('DIAGRAM_PERSISTED')
  });

  useEffect(() => {
    socket.emit("REQUEST_ISSUED", JSON.stringify({ queryForDiagram: { id: id } }))
  }, [id]);

  const pushDiagramWith = (upToDateEntities, upToDateRelations) => {
    let request = {
      diagram: 
      {
        id: id,
        entities: upToDateEntities,
        relations: upToDateRelations
      }
    }

    socket.emit("REQUEST_ISSUED", JSON.stringify(request))
  }

  const handleDrop = e => {
    
    // register event position
    stageRef.current.setPointersPositions(e);
    
    let dropPosition = stageRef.current.getPointerPosition()

    let upToDateEntities = (entities ?? []).concat(draggedItemRef.current != 'entity' ? [] : [
      {
        imageId: 0,
        color: 0,
        x: dropPosition.x,
        y: dropPosition.y,
        nameSectionHeight: 50,
        membersSectionHeight: 0,
        width: 150
      }
    ])

    let upToDateRelations = (relations ?? []).concat(draggedItemRef.current != 'relation' ? [] : [
      {
        start: {
          point: {
            x: dropPosition.x - 50,
            y: dropPosition.y - 50
          }
        },
        end: {
          point: {
            x: dropPosition.x + 50,
            y: dropPosition.y + 50
          }
        }
      }
    ])

    pushDiagramWith(upToDateEntities, upToDateRelations)
  }

  const renderEntityEditor = entity => {
    setMaybeEntityEditor(() => props => {
      return <EntityEditor
        editable={entity}
        handleClose={behavior => props.updateEntity(behavior, entity)}
      />
    })
  }

  const renderRelationEditor = relation => {
    setMaybeEntityEditor(() => props => {
      return <RelationEditor
        editable={relation}
        handleClose={behavior => props.updateRelation(behavior, relation)}
      />
    })
  }

  const renderMenu = (e, entity) => {
    e.evt.preventDefault();

    setMaybeMenu(() => props => {
      return <Menu
        keepMounted
        anchorReference="anchorPosition"
        anchorPosition={{ top: e.evt.y, left: e.evt.x }}
        open={true}
        onClose={() => setMaybeMenu(() => props => null)}
        >
          <MenuItem onClick={() => props.remove(entity)}>Delete</MenuItem>
          <MenuItem onClick={() => props.toFront(entity)}>To Front</MenuItem>
          <MenuItem onClick={() => props.toBack(entity)}>To Back</MenuItem>
        </Menu>
    })
  }

  const updateEntity = entity => {
    let upToDateEntities = [...entities]; // copying the old datas array
    let indexOfEntity = entities.findIndex(e => e.id == entity.id)
    upToDateEntities[indexOfEntity] = entity

    pushDiagramWith(upToDateEntities, relations)
  }

  const updateRelation = (index, e) => {
    let upToDateRelations = [...relations]; // copying the old datas array
    upToDateRelations[index] = e

    pushDiagramWith(entities, upToDateRelations)
  }

  const arrangeEntities = (insertFunction, entity) => {
    let indexOfEntity = entities.findIndex(e => e.id == entity.id)
    let upToDateEntities = [...entities]; // copying the old datas array
    upToDateEntities.splice(indexOfEntity, 1)
    insertFunction(upToDateEntities, entity)
    pushDiagramWith(upToDateEntities, relations)
    setMaybeMenu(() => props => null)
  }

  const handleWheel = e => {
    if (e.evt.ctrlKey) {
      e.evt.preventDefault()

      let scaleBy = 1.03
      let stage = e.target.getStage()
      let oldScale = stage.scaleX()
      let mousePointTo = {
        x: stage.getPointerPosition().x / oldScale - stage.x() / oldScale,
        y: stage.getPointerPosition().y / oldScale - stage.y() / oldScale
      }
      let newScale = e.evt.deltaY > 0 ? oldScale * scaleBy : oldScale / scaleBy

      stage.scaleX(newScale)
      stage.scaleY(newScale)
      stage.x(-(mousePointTo.x - stage.getPointerPosition().x / newScale) * newScale)
      stage.y(-(mousePointTo.y - stage.getPointerPosition().y / newScale) * newScale)
      stage.draw()
    }
  }

  return (
    <div>
      <Toolbar>
        <Button
          disableRipple={true}
          draggable="true"
          onDragStart={e => {
            draggedItemRef.current = 'entity';
          }}>
          <Class />
          Entity
        </Button>
        <Button
          disableRipple={true}
          draggable="true"
          onDragStart={e => {
            draggedItemRef.current = 'relation';
          }}>
          <ArrowRightAlt />
          Relation
        </Button>
        <Button
          disableRipple={true}
          onClick={e => downloadURI(stageRef.current.toDataURL())}>
          <GetApp />
          Diagram
        </Button>
      </Toolbar>
      <MaybeEntityEditor 
        updateEntity={(behavior, entity) => {
          let indexOfEntity = entities.findIndex(e => e.id == entity.id)
          let entityToUpdate = behavior(entities[indexOfEntity])

          updateEntity(entityToUpdate)
          setMaybeEntityEditor(() => props => null)
        }}
        updateRelation={(behavior, relation) => {
          let indexOfRelation = relations.findIndex(e => 
            e.start.point.x == relation.start.point.x 
            && e.start.point.y == relation.start.point.y)
          let relationToUpdate = behavior(relations[indexOfRelation])

          updateRelation(indexOfRelation, relationToUpdate)
          setMaybeEntityEditor(() => props => null)
        }}
      />
      <MaybeMenu
        remove={entity => arrangeEntities((array, item) => { }, entity)}
        toFront={entity => arrangeEntities((array, item) => array.push(item), entity)}
        toBack={entity => arrangeEntities((array, item) => array.unshift(item), entity)}
      />
      <div
        id="container"
        style={{ border: '1px solid grey', overflow: 'auto', height: 'calc(100vh - 180px)' }}
        onDrop={e => handleDrop(e)}
        onDragOver={e => e.preventDefault()}
      >
        <Stage
          container='container'
          width={2000}
          height={1000}
          ref={stageRef}
          onWheel={handleWheel}
        >
          <Layer>
            {entities && entities.map((entity, index) => 
              <Entity
                key={index} 
                state={entity}
                onContextMenu={e => renderMenu(e, entity)}
                openModal={() => renderEntityEditor(entity)}
                commitUpdate={updateEntity}
                localUpdate={resizedEntity => {
                  let upToDateEntities = [...entities]
                  upToDateEntities[index] = new ExtendedEntity(resizedEntity)
                  setEntities(upToDateEntities)
                }}
                commitRemove={() => arrangeEntities((array, item) => { }, entity)} />)}

            {relations && relations.map((relation, index) => 
              <Relation
                key={index} 
                state={relation}
                entities={entities}
                openModal={() => renderRelationEditor(relation)}
                commitUpdate={rel => updateRelation(index, rel)}
                localUpdate={result => {
                  let upToDateRelations = [...relations]
                  upToDateRelations[index] = result
                  setRelations(upToDateRelations)
                }}
                commitRemove={() => {
                  let upToDateRelations = [...relations]; // copying the old datas array
                  upToDateRelations.splice(index, 1)
                  pushDiagramWith(entities, upToDateRelations)
                }} 
              />)}

          </Layer>
        </Stage>
      </div>
    </div>
  );
};

export default withRouter(Home)