import { useCallback, useMemo, useState } from 'react'
import compact from 'lodash/compact'
import styles from './tree.module.css'

const DEFAULT_NODE_VISIBILITY = localStorage.getItem('nodeVisibility') || 'named'

function mapChildFields (node) {
  const map = {}

  // Iteration is done with a cursor here because only TreeCursor will directly
  // tell us what field is associated with the current node. The node itself
  // will not tell us about its own field, and Node.childForFieldName(field)
  // will only tell us about a single child with the specified field.
  const cursor = node.walk()
  cursor.gotoFirstChild()

  do {
    const field = cursor.currentFieldName()
    if (field) {
      map[cursor.nodeId] = field
    }
  } while (cursor.gotoNextSibling())

  return map
}

function Node ({ node, field, selectedId, nodeVisibility, onSelect }) {
  const [isCollapsed, setCollapsed] = useState(false)
  const nodeChildren = node.children
  const isSelected = node.id === selectedId
  const isNamed = node.isNamed()
  const hasErrors = node.hasError()

  const childFieldMap = useMemo(() => mapChildFields(node), [node])
  const showChild = useCallback(childNode => {
    switch (nodeVisibility) {
      case 'named':
        return childNode.isNamed()
      case 'field':
        return childNode.isNamed() || childFieldMap[childNode.id]
      case 'all':
      default:
        return true
    }
  }, [childFieldMap, nodeVisibility])

  return (
    <div className={styles.listContainer}>
      {nodeChildren.length > 0 ? (
        <span
          className={`fa fa-caret-down ${styles.collapser}`}
          data-is-collapsed={isCollapsed}
          onClick={() => setCollapsed(!isCollapsed)}
        />
      ) : <span className={styles.collapserPlaceholder} />}
      <label
        className={compact([
          isSelected && styles.selected,
          isNamed && styles.named,
          hasErrors && styles.error
        ]).join(' ')}
        onClick={() => onSelect(isSelected ? null : node)}
      >
        {field && <span className={styles.field}>{field}: </span>} 
        {isNamed ? node.type : node.text}
      </label>
      <ul>
        {!isCollapsed && nodeChildren.map((childNode, i) => showChild(childNode) && (
          <li key={i}>
            <Node
              node={childNode}
              field={childFieldMap[childNode.id]}
              selectedId={selectedId}
              nodeVisibility={nodeVisibility}
              onSelect={onSelect}
            />
          </li>
        ))}
      </ul>
    </div>
  )
}

function Tree ({ tree, selectedNode, onSelect }) {
  const [nodeVisibility, setNodeVisibility] = useState(DEFAULT_NODE_VISIBILITY)
  const handleVisibilityChange = useCallback(nodeVisibility => {
    localStorage.setItem('nodeVisibility', nodeVisibility)
    setNodeVisibility(nodeVisibility)
  }, [setNodeVisibility])

  return (
    <div className={styles.treeContainer}>
      <VisibilitySelector
        value={nodeVisibility}
        onUpdate={handleVisibilityChange}
      />
      <Node
        node={tree.rootNode}
        field={null}
        selectedId={selectedNode?.id}
        nodeVisibility={nodeVisibility}
        onSelect={onSelect}
      />
    </div>
  )
}

function VisibilitySelector ({ value, onUpdate }) {
  const options = {
    all: 'All nodes',
    named: 'Named nodes only',
    field: 'Nodes with fields'
  }

  return (
    <label>
      Show:&nbsp;
      <select value={value} onChange={e => onUpdate(e.target.value)}>
        {Object.keys(options).map(key => (
          <option key={key} value={key}>{options[key]}</option>
        ))}
      </select>
    </label>
  )
}

export default Tree