import { METAMAPS_THEME, CONTEXT_MENU_BUTTONS } from "./theme.js";

export class MetaMapsEngine {
  constructor(initialState = {}) {
    this.theme = METAMAPS_THEME;
    this.contextMenuButtons = CONTEXT_MENU_BUTTONS;
    this.backgrounds = Array.isArray(initialState.backgrounds) ? [...initialState.backgrounds] : [];
    this.nodes = Array.isArray(initialState.nodes) ? [...initialState.nodes] : [];
    this.lines = Array.isArray(initialState.lines) ? [...initialState.lines] : [];
    this.authorizedOwner = initialState.authorizedOwner || null;
    this.activeEditor = null;
    this.ceramicStreamId = initialState.ceramicStreamId || "ceramic://metafam-metamaps-v1";
  }

  authenticateWithMetaMask({ address, signature, message }) {
    if (!address || !/^0x[a-fA-F0-9]{40}$/.test(address)) {
      throw new Error("Invalid Ethereum address from MetaMask");
    }
    if (!signature || typeof signature !== "string" || !signature.startsWith("0x")) {
      throw new Error("Missing EIP-191 personal_sign signature from MetaMask");
    }
    const normalized = address.toLowerCase();
    if (!this.authorizedOwner) {
      this.authorizedOwner = normalized;
    }
    this.activeEditor = normalized;
    return {
      authenticated: true,
      canEdit: this.canEdit(),
      editor: normalized,
      owner: this.authorizedOwner,
      signedMessage: message || `MetaMaps Write Auth: ${normalized}`,
    };
  }

  canEdit() {
    if (!this.authorizedOwner) return Boolean(this.activeEditor);
    return this.activeEditor === this.authorizedOwner;
  }

  requireEditPermission() {
    if (!this.canEdit()) {
      throw new Error("MetaMask write-privilege verification required to edit map");
    }
  }

  addBackground({ id, imageUrl, x = 0, y = 0, width = 1200, height = 800 }) {
    this.requireEditPermission();
    const bg = {
      id: id || `bg-${this.backgrounds.length + 1}`,
      type: "background",
      zIndex: 0,
      imageUrl,
      x,
      y,
      width: Math.max(64, Number(width)),
      height: Math.max(64, Number(height)),
    };
    this.backgrounds.push(bg);
    return bg;
  }

  addNode({
    id,
    kind = "circle",
    label = "",
    x = 100,
    y = 100,
    width = 64,
    height = 64,
    color = METAMAPS_THEME.circleColor,
    imageUrl = null,
    actionType = "popup",
    targetUrl = "",
    popupTitle = "",
    popupDescription = "",
    popupLinks = [],
  }) {
    this.requireEditPermission();
    if (kind !== "circle" && kind !== "sprite") {
      throw new Error(`Unsupported node kind: ${kind}`);
    }
    const node = {
      id: id || `node-${this.nodes.length + 1}`,
      kind,
      zIndex: 20,
      label: String(label || ""),
      labelFont: METAMAPS_THEME.fontFamily,
      labelColor: METAMAPS_THEME.textColor,
      labelPosition: "below",
      x: Number(x),
      y: Number(y),
      width: Math.max(24, Number(width)),
      height: Math.max(24, Number(height)),
      color: color || METAMAPS_THEME.circleColor,
      borderRadiusPx: METAMAPS_THEME.borderRadiusPx,
      imageUrl,
      action: {
        type: actionType === "link" ? "link" : "popup",
        targetUrl: String(targetUrl || ""),
        popup: {
          backgroundColor: METAMAPS_THEME.popupBackground,
          textColor: METAMAPS_THEME.textColor,
          borderRadiusPx: METAMAPS_THEME.borderRadiusPx,
          title: String(popupTitle || label || "Raid / Initiative"),
          description: String(popupDescription || ""),
          links: Array.isArray(popupLinks) ? popupLinks : [],
        },
      },
    };
    this.nodes.push(node);
    return node;
  }

  moveNode(nodeId, newX, newY) {
    this.requireEditPermission();
    const node = this.nodes.find((n) => n.id === nodeId);
    if (!node) throw new Error(`Node not found: ${nodeId}`);
    node.x = Number(newX);
    node.y = Number(newY);
    return node;
  }

  resizeNode(nodeId, newWidth, newHeight) {
    this.requireEditPermission();
    const node = this.nodes.find((n) => n.id === nodeId);
    if (!node) throw new Error(`Node not found: ${nodeId}`);
    node.width = Math.max(24, Number(newWidth));
    node.height = Math.max(24, Number(newHeight));
    return node;
  }

  recolorNode(nodeId, newColor) {
    this.requireEditPermission();
    const node = this.nodes.find((n) => n.id === nodeId);
    if (!node) throw new Error(`Node not found: ${nodeId}`);
    node.color = String(newColor);
    return node;
  }

  deleteNode(nodeId) {
    this.requireEditPermission();
    const before = this.nodes.length;
    this.nodes = this.nodes.filter((n) => n.id !== nodeId);
    this.lines = this.lines.filter((l) => l.fromNodeId !== nodeId && l.toNodeId !== nodeId);
    return before !== this.nodes.length;
  }

  connectNodes(fromNodeId, toNodeId, id = null) {
    this.requireEditPermission();
    const fromNode = this.nodes.find((n) => n.id === fromNodeId);
    const toNode = this.nodes.find((n) => n.id === toNodeId);
    if (!fromNode || !toNode) {
      throw new Error("Both endpoint nodes must exist to draw a locked connection line");
    }
    const line = {
      id: id || `line-${fromNodeId}-${toNodeId}`,
      fromNodeId,
      toNodeId,
      zIndex: 10,
      color: METAMAPS_THEME.lineColor,
      strokeWidth: 3,
      borderRadiusPx: METAMAPS_THEME.borderRadiusPx,
    };
    this.lines.push(line);
    return line;
  }

  resolveLineGeometry(lineId) {
    const line = this.lines.find((l) => l.id === lineId);
    if (!line) throw new Error(`Line not found: ${lineId}`);
    const fromNode = this.nodes.find((n) => n.id === line.fromNodeId);
    const toNode = this.nodes.find((n) => n.id === line.toNodeId);
    if (!fromNode || !toNode) return null;
    return {
      id: line.id,
      zIndex: line.zIndex,
      color: line.color,
      x1: fromNode.x + fromNode.width / 2,
      y1: fromNode.y + fromNode.height / 2,
      x2: toNode.x + toNode.width / 2,
      y2: toNode.y + toNode.height / 2,
    };
  }

  activateNode(nodeId) {
    const node = this.nodes.find((n) => n.id === nodeId);
    if (!node) throw new Error(`Node not found: ${nodeId}`);
    if (node.action.type === "link" && node.action.targetUrl) {
      return { behavior: "navigate", url: node.action.targetUrl };
    }
    return {
      behavior: "popup",
      popup: node.action.popup,
    };
  }

  getRenderLayers() {
    // Enforce layering: backgrounds (zIndex 0) -> lines (zIndex 10) -> nodes & sprites (zIndex 20)
    return {
      backgroundThemeColor: this.theme.background,
      backgrounds: [...this.backgrounds],
      lines: this.lines.map((l) => this.resolveLineGeometry(l.id)).filter(Boolean),
      nodes: [...this.nodes],
    };
  }

  toCeramicRecord() {
    return {
      schema: "ceramic://metafam/metamaps/v1",
      streamId: this.ceramicStreamId,
      authorizedOwner: this.authorizedOwner,
      theme: this.theme,
      backgrounds: this.backgrounds,
      nodes: this.nodes,
      lines: this.lines,
    };
  }

  static fromCeramicRecord(record) {
    return new MetaMapsEngine({
      authorizedOwner: record.authorizedOwner,
      ceramicStreamId: record.streamId,
      backgrounds: record.backgrounds,
      nodes: record.nodes,
      lines: record.lines,
    });
  }
}
