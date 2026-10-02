export const NIGHTLEAF_THEME = 'nightleaf'

export const nightleafThemeData = {
  base: 'vs-dark',
  inherit: false,
  rules: [
    // keywords: vermilion
    { token: 'keyword', foreground: 'E05A4C' },
    { token: 'keyword.self', foreground: 'B47CAE' },

    // function names: gold
    { token: 'function', foreground: 'D2A24C' },

    // class / type names: verdigris
    { token: 'type', foreground: '52B3A4' },
    { token: 'type.class', foreground: '52B3A4' },

    // string literals: sage
    { token: 'string', foreground: '9DBA6E' },
    { token: 'string.escape', foreground: '7FA65C' },
    { token: 'string.interpolation.bracket', foreground: 'D2A24C' },

    // numbers, yes/no/nothing: lapis
    { token: 'number', foreground: '6D92D8' },
    { token: 'number.literal', foreground: '6D92D8' },

    // builtins: plum
    { token: 'builtin', foreground: 'B47CAE' },

    // comments: graphite, italic
    { token: 'comment', foreground: '5F5C55', fontStyle: 'italic' },

    // operators, punctuation: iron
    { token: 'operator', foreground: '8A8578' },
    { token: 'delimiter', foreground: '8A8578' },
    { token: '@brackets', foreground: '8A8578' },

    // plain identifiers: vellum
    { token: 'identifier', foreground: 'E4DED0' },

    // fallback
    { token: '', foreground: 'E4DED0' },
    { token: 'invalid', foreground: 'E05A4C' },
  ],
  colors: {
    // editor surfaces
    'editor.background': '#161923',
    'editor.foreground': '#E4DED0',

    // cursor
    'editorCursor.foreground': '#E4DED0',

    // selection
    'editor.selectionBackground': '#2C314080',
    'editor.inactiveSelectionBackground': '#2C314040',

    // current line
    'editor.lineHighlightBackground': '#1B1F2B',
    'editor.lineHighlightBorder': '#00000000',

    // line numbers
    'editorLineNumber.foreground': '#6E6A60',
    'editorLineNumber.activeForeground': '#A9A395',

    // indentation guides
    'editorIndentGuide.background': '#232735',
    'editorIndentGuide.activeBackground': '#2C3140',

    // matching brackets
    'editorBracketMatch.background': '#2C314060',
    'editorBracketMatch.border': '#D2A24C80',

    // gutter / margin
    'editorGutter.background': '#161923',

    // scrollbar
    'scrollbarSlider.background': '#2C314060',
    'scrollbarSlider.hoverBackground': '#2C314090',
    'scrollbarSlider.activeBackground': '#2C3140B0',

    // widget (find/replace, suggest)
    'editorWidget.background': '#1B1F2B',
    'editorWidget.border': '#2C3140',
    'editorWidget.foreground': '#E4DED0',

    // suggest / autocomplete
    'editorSuggestWidget.background': '#1B1F2B',
    'editorSuggestWidget.border': '#2C3140',
    'editorSuggestWidget.foreground': '#E4DED0',
    'editorSuggestWidget.selectedBackground': '#222633',
    'editorSuggestWidget.highlightForeground': '#D2A24C',

    // hover widget
    'editorHoverWidget.background': '#1B1F2B',
    'editorHoverWidget.border': '#2C3140',

    // minimap (disabled but just in case)
    'minimap.background': '#161923',

    // find match highlighting
    'editor.findMatchBackground': '#D2A24C40',
    'editor.findMatchHighlightBackground': '#D2A24C20',

    // word highlight
    'editor.wordHighlightBackground': '#2C314050',

    // error / warning squiggles
    'editorError.foreground': '#C4564A',
    'editorWarning.foreground': '#D2A24C',
    'editorInfo.foreground': '#6D92D8',

    // overview ruler (right-side scrollbar markers)
    'editorOverviewRuler.errorForeground': '#C4564A',
    'editorOverviewRuler.warningForeground': '#D2A24C',
    'editorOverviewRuler.infoForeground': '#6D92D8',

    // breakpoint glyph
    'debugIcon.breakpointForeground': '#D2A24C',

    // focus ring
    'focusBorder': '#6D92D8',

    // input fields in find/replace
    'input.background': '#1B1F2B',
    'input.border': '#2C3140',
    'input.foreground': '#E4DED0',
    'inputOption.activeBorder': '#6D92D8',
  },
}

export function defineNightleafTheme(monaco) {
  monaco.editor.defineTheme(NIGHTLEAF_THEME, nightleafThemeData)
}
