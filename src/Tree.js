import styles from './tree.module.css'

function Node ({ node, selectedId, onSelect }) {
  return (
    <div className={styles.listContainer}>
      <label
        className={selectedId === node.id ? styles.selected : ''}
        onClick={() => onSelect(node)}
      >
        {node.type}
      </label>
      <ul>
        {node.namedChildren.map((childNode, i) => (
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