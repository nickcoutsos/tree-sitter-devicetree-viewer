import {
  removeStartingWhitespace,
  removeTrailingWhitespace,
  reindent,
  dedent
} from './string-utils'

const DEFAULT_INDENT = '    '
const DEFAULT_MULTILINE_INTEGER_CELLS_INDENT = 'keep'

function isMultilineNode (node) {
  return node.text.indexOf('\n') !== -1
}

function isMultilinePropertyNode (node) {
  return node?.type === 'property' && (
    node.namedChildren.length > 2 ||
    node.namedChildren.slice(1).some(isMultilineNode)
  )
}

function isInlineComment (node) {
  return (
    node.type === 'comment' &&
    node.previousSibling &&
    // Nodes for pre-processor directives include trailing newline characters.
    // For simplicity, a preproc cannot have an inline comment.
    node.previousSibling.type !== 'preproc_def' &&
    node.previousSibling.type !== 'preproc_function_def' &&
    node.previousSibling.type !== 'preproc_include' &&
    node.previousSibling.endPosition.row === node.startPosition.row
  )
}

function getNodeIndentation (node, tab) {
  return tab.repeat(getNodeDepth(node))
}

export function getModelineConfiguration (tree) {
  return tree.rootNode.namedChildren.reduce((config, node) => {
    if (node.type === 'comment') {
      const contents = node.text.startsWith('//')
        ? node.text.slice(2).trim()
        : node.text.slice(2, -2).trim()

      for (const line of contents.split('\n')) {
        const match = line.match(/dt-formatter:\s*(\w+)\s*=\s*(.+)$/)
        if (match) {
          const [key, jsonValue] = match.slice(1)
          try {
            const value = JSON.parse(jsonValue)
            config[key] = value
          } catch {}
        }
      }
    }

    return config
  }, {})
}

function getNodeChildrenByFieldName (node, fieldName) {
  const children = []

  // Iteration is done with a cursor here because only TreeCursor will directly
  // tell us what field is associated with the current node. The node itself
  // will not tell us about its own field, and Node.childForFieldName(field)
  // will only tell us about a single child with the specified field.
  const cursor = node.walk()
  cursor.gotoFirstChild()

  do {
    const isNamed = cursor.currentNode().isNamed()
    const isField = cursor.currentFieldName() === fieldName
    if (isNamed && isField) {
      children.push(cursor.currentNode())
    }
  } while (cursor.gotoNextSibling())

  cursor.delete()

  return children
}

function getNodeLabels (node) {
  const labelNodes = getNodeChildrenByFieldName(node.parent, 'label')
  return labelNodes.map(node => node.text)
}

/**
 * Determine the depth of the node in the device tree
 *
 * A depth of 0 is anything at the document level -- this includes the "/" node
 *
 * @param {SyntaxNode} node any kind of syntax node
 * @returns {Integer} depth
 */
function getNodeDepth (node) {
  let n = node
  let depth = 0
  const stop = node.tree.rootNode

  while ((n = n.parent) && n && n.id !== stop.id) {
    if (n.type !== 'labeled_item') {
      depth++
    }
  }

  return depth
}

function shouldIncludeBlank (nodeA, nodeB) {
  if (!nodeB) {
    return false
  }

  const sameType = nodeA.type === nodeB.type
  const isAdjacentDeviceTreeNode = sameType && nodeA.type === 'node'

  // TODO: this should probably just not insert whitespace around comments
  return (
    isAdjacentDeviceTreeNode ||
    isMultilinePropertyNode(nodeA) ||
    (!sameType && !isInlineComment(nodeB))
  )
}

/**
 * Apply formatting (indentation and whitespace) to a node and its descendents
 *
 * Indentation is based on the node's depth in the full tree (not just relative
 * to the supplied `node` parameter) and currently limited to 4-space tabs.
 *
 * The existing formatting of `integer_cells` nodes (ie, `bindings = <...>;`) is
 * considered sacred and 0 levels of indentation will be applied to those lines.
 * @param {SyntaxNode} node any node in the devicetree
 * @returns {String} the newly-formatted text for the syntax node
 */
export function formatNode (node, options = {}) {
  const { indent = DEFAULT_INDENT } = options

  if (node.type === 'labeled_item') {
    node = node.childForFieldName('item')
  }

  const [identifier, ...children] = node.namedChildren
  const indentation = getNodeIndentation(node, indent)

  function formatChildren (children) {
    return children.reduce((lines, childNode, i, arr) => {
      // Merge inline comments onto the previous node's line.
      // This feels a bit hacky but it must be performed on the "unformatted"
      // comment syntax node (this check is also happening when the previous
      // node is being formatted and the extra blank line is being considered).
      if (isInlineComment(childNode)) {
        lines[lines.length - 1] += childNode.text
        return lines
      }
      lines.push(...formatNode(childNode, options))

      if (shouldIncludeBlank(childNode, children[i + 1])) {
        lines.push('')
      }

      return lines
    }, [])
  }

  switch (node.type) {
    case 'document':
      return [...formatChildren(node.namedChildren), '']

    case 'node':
      return [
        indentation + `${formatLabels(getNodeLabels(node))}${identifier.text}${getAddress(node)} {`,
        ...formatChildren(hasAddress(node) ? node.namedChildren.slice(2) : children),
        indentation + '};'
      ]

    case 'property':
      return formatPropertyNode(node, options)

    case 'preproc_include':
    case 'preproc_def':
    case 'preproc_function_def':
      return [node.text.trimEnd()]

    default:
      // this is mainly for things I didn't expect to see, but also includes
      // commonly used features like preproc_includes that technically work when
      // used inside nodes but aren't recognized by the grammar at the moment.
      // See: https://github.com/joelspadin/tree-sitter-devicetree/issues/1
      return [indentation + node.text]
  }
}

function hasAddress (node) {
  return !!node.childForFieldName('address')
}

function getAddress (node) {
  return hasAddress(node)
    // note address field doesn't give the actual value yet
    ? `@${node.namedChildren[1].text}`
    : ''
}

function formatLabels (labels) {
  return labels.map(text => `${text}: `).join('')
}

function formatPropertyNode (node, options = {}) {
  const {
    indent = DEFAULT_INDENT,
    multilineIntegerCellsIndent = DEFAULT_MULTILINE_INTEGER_CELLS_INDENT
  } = options

  const [identifier, ...children] = node.namedChildren
  const indentation = getNodeIndentation(node, indent)

  const noValue = children.length === 0
  const simpleValue = children.length === 1 && !isMultilineNode(children[0])
  const singleIntegerCell = children.length === 1 && children[0].type === 'integer_cells'
  const labels = formatLabels(getNodeLabels(node))

  // TODO: get smarter about different property value types
  if (noValue) return [indentation + node.text]

  if (simpleValue) {
    return [indentation + `${labels}${identifier.text} = ${children[0].text};`]
  } else if (singleIntegerCell) {
    let bindingsLines = removeStartingWhitespace(
      removeTrailingWhitespace(
        children[0].text.slice(1, -2)
      )
    )

    switch (multilineIntegerCellsIndent) {
      case 'reindent':
        bindingsLines = reindent(bindingsLines, indentation + indent)
        break

      case 'dedent':
        bindingsLines = dedent(bindingsLines)
        break

      case 'keep':
      default:
        break
    }

    return [
      indentation + `${labels}${identifier.text} = <`,
      ...bindingsLines.split('\n'),
      indentation + '>;'
    ]
  }

  return [
    indentation + `${identifier.text} =`,
    ...[].concat(...children.map(node => formatNode(node, options)))
      .map((line, i, arr) => {
        const suffix = i === arr.length - 1 ? ';' : ','
        return [line, suffix].join('')
      })
  ]
}
