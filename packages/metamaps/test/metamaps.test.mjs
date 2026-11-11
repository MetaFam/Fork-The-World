import assert from "node:assert/strict";
import { MetaMapsEngine } from "../src/metamaps-engine.js";
import { METAMAPS_THEME, CONTEXT_MENU_BUTTONS } from "../src/theme.js";

// 1. Verify exact @peth-eth color scheme and IBM Plex Sans font
assert.equal(METAMAPS_THEME.background, "#1b0d2a");
assert.equal(METAMAPS_THEME.popupBackground, "#261942");
assert.equal(METAMAPS_THEME.buttonBackground, "#392373");
assert.equal(METAMAPS_THEME.textColor, "#a5b9f6");
assert.equal(METAMAPS_THEME.circleColor, "#5a32e6");
assert.equal(METAMAPS_THEME.lineColor, "#b72886");
assert.equal(METAMAPS_THEME.borderRadiusPx, 8);
assert.ok(METAMAPS_THEME.fontFamily.includes("IBM Plex Sans"));
assert.equal(CONTEXT_MENU_BUTTONS.length, 3);

// 2. Verify MetaMask write-privilege verification
const engine = new MetaMapsEngine();
assert.throws(() => engine.addNode({ label: "Unauthorized Raid" }), /MetaMask write-privilege/);

const auth = engine.authenticateWithMetaMask({
  address: "0x971b573b47357c22a67FcE8c56Aaeb478356C942",
  signature: "0xdeadbeef01",
  message: "MetaMaps Write Auth",
});
assert.equal(auth.authenticated, true);
assert.equal(auth.canEdit, true);

// 3. Verify background layer, nodes, dynamic resizing, and locked lines behind nodes
const bg = engine.addBackground({ imageUrl: "data:image/png;base64,iVBORw0KGgo=", width: 1600, height: 900 });
assert.equal(bg.zIndex, 0);

const n1 = engine.addNode({
  id: "raid-navigation",
  kind: "circle",
  label: "State of Raids",
  x: 100,
  y: 100,
  width: 60,
  height: 60,
  actionType: "popup",
  popupTitle: "State of Raids",
  popupDescription: "MetaGame navigation board raid",
  popupLinks: ["https://wiki.metagame.wtf/docs/handbook/navigation-board"],
});
const n2 = engine.addNode({
  id: "skill-trees",
  kind: "sprite",
  label: "Skill Trees",
  x: 300,
  y: 200,
  width: 80,
  height: 80,
  imageUrl: "data:image/png;base64,iVBORw0KGgo=",
  actionType: "link",
  targetUrl: "https://forum.metagame.wtf/t/skill-trees/154",
});

const edge = engine.connectNodes(n1.id, n2.id);
assert.equal(edge.color, "#b72886");
assert.ok(bg.zIndex < edge.zIndex && edge.zIndex < n1.zIndex);

// Moving n1 updates the locked line geometry automatically
engine.moveNode(n1.id, 140, 160);
engine.resizeNode(n1.id, 100, 100);
const geom = engine.resolveLineGeometry(edge.id);
assert.equal(geom.x1, 190);
assert.equal(geom.y1, 210);

// 4. Verify node click actions (popup vs link) and Ceramic round-trip persistence
assert.equal(engine.activateNode(n1.id).behavior, "popup");
assert.equal(engine.activateNode(n1.id).popup.backgroundColor, "#261942");
assert.equal(engine.activateNode(n2.id).behavior, "navigate");

const ceramicDoc = engine.toCeramicRecord();
const restored = MetaMapsEngine.fromCeramicRecord(ceramicDoc);
assert.equal(restored.nodes.length, 2);
assert.equal(restored.lines.length, 1);
console.log("MetaMaps unit tests passed!");
