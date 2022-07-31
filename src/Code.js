import { useEffect, useRef } from 'react'
import CodeMirror from '@uiw/react-codemirror'
import { cpp } from '@codemirror/lang-cpp'
import { EditorView } from '@codemirror/view'
import { StateEffect } from '@codemirror/state'

import { addMark, markField, markTheme } from './code-marking'

function Code ({ text, onChange, highlightNode }) {
  const doc = useRef()

  useEffect(() => {
    const view = doc.current?.view
    if (!view) {
      return
    }

    const effects = [addMark.of({
      from: highlightNode.startIndex,
      to: highlightNode.endIndex
    })]

    if (!view.state.field(markField, false)) {
      effects.push(
        StateEffect.appendConfig.of([markField, markTheme]),
        EditorView.scrollIntoView(highlightNode.startIndex)
      )
    }

    view.dispatch({ effects })
  }, [highlightNode])

  return (
    <CodeMirror
      ref={doc}
      value={text}
      theme="dark"
      height="100vh"
      width="100%"
      onChange={onChange}
      extensions={[cpp()]}
    />
  )
}

export default Code
