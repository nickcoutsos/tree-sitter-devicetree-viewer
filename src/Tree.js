import compact from 'lodash/compact'
import styles from './tree.module.css'

function Node ({ node, selectedId, onSelect }) {
  const nodeChildren = node.namedChildren
  const isNamed = node.isNamed()
  const hasErrors = node.hasError()
  const field = node.tree.language.fields.find(field => (
    node.parent?.childForFieldName(field)?.id === node.id && field
  ))

  return (
    <div className={styles.listContainer}>
      <label
        className={compact([
          selectedId === node.id && styles.selected,
          isNamed && styles.named,
          hasErrors && styles.error
        ]).join(' ')}
        onClick={() => onSelect(node)}
      >
        {field && <span className={styles.field}>{field}: </span>} 
        {isNamed ? node.type : node.text}
      </label>
      <ul>
        {nodeChildren.map((childNode, i) => (
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