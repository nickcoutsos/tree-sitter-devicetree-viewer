import { useEffect, useState } from 'react'
import sampleSource from './sample'

import '@fortawesome/fontawesome-free/css/all.css'
import './App.css'
import Code from './Code'
import Tree from './Tree'

let _parser

const languageBuilds = {
  main: {
    name: 'Official',
    description: 'WASM build from main tree-sitter-devicetree branch',
    ref: 'https://github.com/joelspadin/tree-sitter-devicetree/tree/main',
    path: './tree-sitter-devicetree.wasm'
  },
  mine: {
    name: 'Experimental',
    description: 'Custom build from pending pull requests or experiments',
    ref: 'https://github.com/nickcoutsos/tree-sitter-devicetree/tree/pending',
    path: './tree-sitter-devicetree-pending.wasm'
  }
}

async function getParser (buildId) {
  if (!_parser) {
    await window.TreeSitter.init()
    _parser = new window.TreeSitter()
  }

  const build = languageBuilds[buildId]
  if (!build.language) {
    build.language = await window.TreeSitter.Language.load(build.path)
  }
  if (_parser.language !== build.language) {
    _parser.setLanguage(build.language)
  }

  return _parser
}

function BuildSelector({ value, onChange }) {
  return (
    <div style={{
      position: 'absolute',
      top: '20px',
      right: '20px',
      zIndex: '10'
    }}>
      <label>
        Devicetree build:&nbsp;
        <select
          value={value}
          onChange={e => onChange(e.target.value)}
        >
          {Object.keys(languageBuilds).map(buildId => (
            <option
              key={buildId}
              value={buildId}
              title={languageBuilds[buildId].description}
            >
              {languageBuilds[buildId].name}
            </option>
          ))}
        </select>
      </label>
    </div>
  )
}


function App() {
  const [buildId, setBuildId] = useState('main')
  const [sample, setSample] = useState(sampleSource)
  const [tree, setTree] = useState(null)
  const [selectedNode, setSelectedNode] = useState(null)

  useEffect(() => {
    (async function () {
      const parser = await getParser(buildId)
      setTree(parser.parse(sample))
    })()
  }, [buildId, sample, setTree])

  return (
    <>
      <BuildSelector value={buildId} onChange={setBuildId} />
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
