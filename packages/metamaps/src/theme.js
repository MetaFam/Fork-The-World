/**
 * MetaMaps official color scheme and typography specified in MetaFam/Fork-The-World#5:
 * - #1b0d2a for background
 * - #261942 for pop-ups (replacing squares)
 * - #392373 for buttons (icon-based context menu)
 * - #a5b9f6 for text (IBM Plex Sans attached below nodes)
 * - #5a32e6 for circles (default node color)
 * - #b72886 for lines (locked behind nodes)
 * - 8px border-radius on all containers and shapes
 */
export const METAMAPS_THEME = Object.freeze({
  background: "#1b0d2a",
  popupBackground: "#261942",
  buttonBackground: "#392373",
  textColor: "#a5b9f6",
  circleColor: "#5a32e6",
  lineColor: "#b72886",
  borderRadiusPx: 8,
  fontFamily: "'IBM Plex Sans', sans-serif",
});

export const CONTEXT_MENU_BUTTONS = Object.freeze([
  { id: "add-circle", icon: "circle", label: "Add Node Circle", color: METAMAPS_THEME.buttonBackground },
  { id: "add-line", icon: "line", label: "Connect Nodes with Line", color: METAMAPS_THEME.buttonBackground },
  { id: "upload-sprite", icon: "upload", label: "Upload Sprite / Background Image", color: METAMAPS_THEME.buttonBackground },
]);
