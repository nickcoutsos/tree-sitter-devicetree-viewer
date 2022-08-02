import { useState } from 'react'
import compact from 'lodash/compact'
import styles from './tree.module.css'

function Node ({ node, selectedId, onSelect }) {
  const [isCollapsed, setCollapsed] = useState(false)
  const nodeChildren = node.namedChildren
  const isSelected = node.id === selectedId
  const isNamed = node.isNamed()
  const hasErrors = node.hasError()
  const field = node.tree.language.fields.find(field => (
    node.parent?.childForFieldName(field)?.id === node.id && field
  ))

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
        {!isCollapsed && nodeChildren.map((childNode, i) => (
          <li key={i}>
            <Node node={childNode} selectedId={selectedId} onSelect={onSelect} />
          </li>
        ))}
      </ul>
    </div>
  )
}

function Tree ({ tree, selectedNode, onSelect }) {
  return (
    <div className={styles.treeContainer}>
      <Node
        node={tree.rootNode}
        selectedId={selectedNode?.id}
        onSelect={onSelect}
      />
    </div>
  )
}

export default Tree