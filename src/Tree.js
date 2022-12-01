import { useMemo, useState } from 'react'
import compact from 'lodash/compact'
import styles from './tree.module.css'

function mapChildFields (node) {
  const map = {}

  // Iteration is done with a cursor here because only TreeCursor will directly
  // tell us what field is associated with the current node. The node itself
  // will not tell us about its own field, and Node.childForFieldName(field)
  // will only tell us about a single child with the specified field.
  const cursor = node.walk()
  cursor.gotoFirstChild()

  do {
    const isNamed = cursor.currentNode().isNamed()
    const field = cursor.currentFieldName()
    if (isNamed && field) {
      map[cursor.nodeId] = field
    }
  } while (cursor.gotoNextSibling())

  return map
}

function Node ({ node, field, selectedId, onSelect }) {
  const [isCollapsed, setCollapsed] = useState(false)
  const nodeChildren = node.namedChildren
  const isSelected = node.id === selectedId
  const isNamed = node.isNamed()
  const hasErrors = node.hasError()

  const childFieldMap = useMemo(() => mapChildFields(node), [node])

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
            <Node
              node={childNode}
              field={childFieldMap[childNode.id]}
              selectedId={selectedId}
              onSelect={onSelect}
            />
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
        field={null}
        selectedId={selectedNode?.id}
        onSelect={onSelect}
      />
    </div>
  )
}

export default Tree