import { useEffect, useState } from 'react'
import sampleSource from './sample'

import './App.css'
import Code from './Code'
import Tree from './Tree'

let _parser

async function getParser () {
  if (!_parser) {
    await window.TreeSitter.init()
    const language = await window.TreeSitter.Language.load('./tree-sitter-devicetree.wasm')
    _parser = new window.TreeSitter()
    _parser.setLanguage(language)
  }

  return _parser
}


function App() {
  const [sample, setSample] = useState(sampleSource)
  const [tree, setTree] = useState(null)
  const [selectedNode, setSelectedNode] = useState(null)

  useEffect(() => {
    (async function () {
      const parser = await getParser()
      setTree(parser.parse(sample))
    })()
  }, [sample, setTree])

  return (
    <>
      {tree && (
        <div style={{ flexBasis: 'fit-content' }}>
          <Tree
            tree={tree}
            selectedNode={selectedNode}
            onSelect={setSelectedNode}
          />
        </div>
      )}
      <div style={{ overflow: 'auto', flexGrow: '1' }}>
        <Code
          text={sample}
          onChange={setSample}
          highlightNode={selectedNode}
        />
      </div>
    </>
  );
}

export default App
