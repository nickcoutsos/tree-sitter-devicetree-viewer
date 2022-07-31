import { EditorView, Decoration } from '@codemirror/view'
import { StateField, StateEffect } from '@codemirror/state'

const markDecoration = Decoration.mark({ class: 'mark-highlighter' })

export const addMark = StateEffect.define()

export const markField = StateField.define({
  create() {
    return Decoration.none
  },
  update(underlines, tr) {
    underlines = underlines.map(tr.changes)
    for (let e of tr.effects) if (e.is(addMark)) {
      underlines = underlines.update({
        add: [markDecoration.range(e.value.from, e.value.to)]
      })
    }
    return underlines
  },
  provide: f => EditorView.decorations.from(f)
})

export const markTheme = EditorView.baseTheme({
  '.mark-highlighter': {
    backgroundColor: 'rgba(255, 230, 0, 0.35)'
  }
})
