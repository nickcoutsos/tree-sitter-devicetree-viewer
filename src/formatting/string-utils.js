/**
 * Remove common indentation from lines of a multiline string
 * @param {String} text a multiline string
 * @returns {String}
 */
function dedent (text) {
  return _dedentedLines(text).join('\n')
}

function _dedentedLines (text) {
  const lines = text.split('\n')
  const minIndentation = lines.reduce((leastIndentation, line) => {
    const match = line.match(/^(\s*)\S/)

    if (!match) {
      return leastIndentation
    }

    return Math.min(leastIndentation, match[1].length)
  }, Infinity)

  return lines.map(line => (
    line.slice(0, minIndentation).match(/^\s+$/)
      ? line.slice(minIndentation)
      : line
  ))
}

/**
 * Replace base indentation with a custom indentation string on all lines
 * @param {String} text
 * @param {String} indentation
 * @returns {String}
 */
function reindent (text, indentation) {
  return _dedentedLines(text)
    .map(line => indentation + line)
    .join('\n')
}

function getPosition (text, index) {
  let row, idx
  for (
    row = 0, idx = 0;
    idx !== -1;
    row++, idx = text.indexOf('\n', idx + 1)
  );

  return { row, col: index - idx }
}

function removeStartingWhitespace (text) {
  return text.split('\n')
    .reduce((lines, line) => {
      if (lines.length > 0 || line.match(/\S/)) {
        lines.push(line)
      }
      return lines
    }, [])
    .join('\n')
}

function removeTrailingWhitespace (text) {
  return text.split('\n')
    .reverse()
    .reduce((lines, line) => {
      if (lines.length > 0 || line.match(/\S/)) {
        lines.push(line)
      }
      return lines
    }, [])
    .reverse()
    .join('\n')
}

module.exports = {
  dedent,
  reindent,
  getPosition,
  removeStartingWhitespace,
  removeTrailingWhitespace
}
