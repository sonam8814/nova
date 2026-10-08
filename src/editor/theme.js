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

export const DAYLIGHT_THEME = 'daylight'

export const daylightThemeData = {
  base: 'vs',
  inherit: false,
  rules: [
    { token: 'keyword', foreground: 'C43D30' },
    { token: 'keyword.self', foreground: '8F5A88' },
    { token: 'function', foreground: 'B08830' },
    { token: 'type', foreground: '3A8F82' },
    { token: 'type.class', foreground: '3A8F82' },
    { token: 'string', foreground: '5A8A30' },
    { token: 'string.escape', foreground: '4A7020' },
    { token: 'string.interpolation.bracket', foreground: 'B08830' },
    { token: 'number', foreground: '4A72B8' },
    { token: 'number.literal', foreground: '4A72B8' },
    { token: 'builtin', foreground: '8F5A88' },
    { token: 'comment', foreground: '9E9A90', fontStyle: 'italic' },
    { token: 'operator', foreground: '6E6A60' },
    { token: 'delimiter', foreground: '6E6A60' },
    { token: '@brackets', foreground: '6E6A60' },
    { token: 'identifier', foreground: '2C2A26' },
    { token: '', foreground: '2C2A26' },
    { token: 'invalid', foreground: 'C43D30' },
  ],
  colors: {
    'editor.background': '#EDEAE4',
    'editor.foreground': '#2C2A26',
    'editorCursor.foreground': '#2C2A26',
    'editor.selectionBackground': '#CCC9C260',
    'editor.inactiveSelectionBackground': '#CCC9C240',
    'editor.lineHighlightBackground': '#E5E2DC',
    'editor.lineHighlightBorder': '#00000000',
    'editorLineNumber.foreground': '#9E9A90',
    'editorLineNumber.activeForeground': '#6E6A60',
    'editorIndentGuide.background': '#D8D5CF',
    'editorIndentGuide.activeBackground': '#CCC9C2',
    'editorBracketMatch.background': '#CCC9C260',
    'editorBracketMatch.border': '#B0883080',
    'editorGutter.background': '#EDEAE4',
    'scrollbarSlider.background': '#CCC9C260',
    'scrollbarSlider.hoverBackground': '#CCC9C290',
    'scrollbarSlider.activeBackground': '#CCC9C2B0',
    'editorWidget.background': '#E5E2DC',
    'editorWidget.border': '#CCC9C2',
    'editorWidget.foreground': '#2C2A26',
    'editorSuggestWidget.background': '#E5E2DC',
    'editorSuggestWidget.border': '#CCC9C2',
    'editorSuggestWidget.foreground': '#2C2A26',
    'editorSuggestWidget.selectedBackground': '#DDDAD4',
    'editorSuggestWidget.highlightForeground': '#B08830',
    'editorHoverWidget.background': '#E5E2DC',
    'editorHoverWidget.border': '#CCC9C2',
    'minimap.background': '#EDEAE4',
    'editor.findMatchBackground': '#B0883040',
    'editor.findMatchHighlightBackground': '#B0883020',
    'editor.wordHighlightBackground': '#CCC9C250',
    'editorError.foreground': '#C43D30',
    'editorWarning.foreground': '#B08830',
    'editorInfo.foreground': '#4A72B8',
    'editorOverviewRuler.errorForeground': '#C43D30',
    'editorOverviewRuler.warningForeground': '#B08830',
    'editorOverviewRuler.infoForeground': '#4A72B8',
    'debugIcon.breakpointForeground': '#B08830',
    'focusBorder': '#4A72B8',
    'input.background': '#E5E2DC',
    'input.border': '#CCC9C2',
    'input.foreground': '#2C2A26',
    'inputOption.activeBorder': '#4A72B8',
  },
}

export function defineNightleafTheme(monaco) {
  monaco.editor.defineTheme(NIGHTLEAF_THEME, nightleafThemeData)
}

export function defineDaylightTheme(monaco) {
  monaco.editor.defineTheme(DAYLIGHT_THEME, daylightThemeData)
}
