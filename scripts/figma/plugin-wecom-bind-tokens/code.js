// Bind hardcoded colors, spacing, radius, and shadows to WeCom / AI preset variables.
// ES5-safe for Figma plugin runtime.

function resolveVariableValue(variable, modeId, sourceCollection) {
  var val = variable.valuesByMode[modeId];
  var guard = 0;
  var currentCollection = sourceCollection || null;

  while (val && val.type === "VARIABLE_ALIAS" && guard < 20) {
    var next = figma.variables.getVariableById(val.id);
    if (!next) break;

    var targetCollection = figma.variables.getVariableCollectionById(next.variableCollectionId);
    var targetModeId = modeId;

    if (targetCollection) {
      var sourceModeName = null;
      if (currentCollection) {
        for (var mi = 0; mi < currentCollection.modes.length; mi++) {
          if (currentCollection.modes[mi].modeId === modeId) {
            sourceModeName = currentCollection.modes[mi].name;
            break;
          }
        }
      }
      if (sourceModeName) {
        targetModeId = modeIdForCollection(targetCollection, sourceModeName.toLowerCase());
      } else if (targetCollection.modes.length) {
        targetModeId = targetCollection.modes[0].modeId;
      }
      currentCollection = targetCollection;
    }

    val = next.valuesByMode[targetModeId];
    guard = guard + 1;
  }

  return val;
}

function rgbKeyFromColor(color, opacity) {
  var r = Math.round(color.r * 255);
  var g = Math.round(color.g * 255);
  var b = Math.round(color.b * 255);
  var a = opacity != null ? opacity : 1;
  return r + "," + g + "," + b + "," + a.toFixed(3);
}

function rgbKeyOnly(color) {
  return (
    Math.round(color.r * 255) +
    "," +
    Math.round(color.g * 255) +
    "," +
    Math.round(color.b * 255)
  );
}

function getBoundColorVariableId(paint) {
  if (!paint || !paint.boundVariables || !paint.boundVariables.color) return null;
  return paint.boundVariables.color.id;
}

function isSemanticColorName(name) {
  return name && name.indexOf("color/") === 0;
}

function bindPaintColor(paint, variable) {
  return figma.variables.setBoundVariableForPaint(paint, "color", variable);
}

function srgbChannelToLinear(channel) {
  if (channel <= 0.04045) return channel / 12.92;
  return Math.pow((channel + 0.055) / 1.055, 2.4);
}

function rgbToLab(r, g, b) {
  var rl = srgbChannelToLinear(r);
  var gl = srgbChannelToLinear(g);
  var bl = srgbChannelToLinear(b);
  var x = rl * 0.4124564 + gl * 0.3575761 + bl * 0.1804375;
  var y = rl * 0.2126729 + gl * 0.7151522 + bl * 0.072175;
  var z = rl * 0.0193339 + gl * 0.119192 + bl * 0.9503041;
  x = x / 0.95047;
  y = y / 1.0;
  z = z / 1.08883;
  function f(t) {
    if (t > 0.008856) return Math.pow(t, 1 / 3);
    return 7.787 * t + 16 / 116;
  }
  var fx = f(x);
  var fy = f(y);
  var fz = f(z);
  return {
    l: 116 * fy - 16,
    a: 500 * (fx - fy),
    b: 200 * (fy - fz),
  };
}

function deltaE(lab1, lab2) {
  var dl = lab1.l - lab2.l;
  var da = lab1.a - lab2.a;
  var db = lab1.b - lab2.b;
  return Math.sqrt(dl * dl + da * da + db * db);
}

function variableCategoryBonus(name) {
  if (!name) return 0;
  if (name.indexOf("color/text/") === 0) return -1.5;
  if (name.indexOf("color/bg/") === 0) return -1.5;
  if (name.indexOf("color/border/") === 0) return -1;
  if (name.indexOf("color/accent/") === 0) return 0;
  if (name.indexOf("color/status/") === 0) return 0.5;
  if (name.indexOf("color/ai/") === 0) return 0.5;
  return 2;
}

function isLowChroma(lab) {
  return Math.sqrt(lab.a * lab.a + lab.b * lab.b) < 6;
}

function findCollectionByName(collections, name) {
  for (var i = 0; i < collections.length; i++) {
    if (collections[i].name === name) return collections[i];
  }
  return null;
}

function detectColorMode(node) {
  var p = node;
  while (p) {
    var name = p.name || "";
    if (/dark/i.test(name) && /mode|column|theme/i.test(name)) return "dark";
    if (name === "Dark") return "dark";
    if (/light/i.test(name) && /mode|column|theme/i.test(name)) return "light";
    if (name === "Light") return "light";
    p = p.parent;
  }
  return "light";
}

function modeIdForCollection(collection, modeName) {
  if (!collection) return null;
  for (var i = 0; i < collection.modes.length; i++) {
    if (collection.modes[i].name.toLowerCase() === modeName) {
      return collection.modes[i].modeId;
    }
  }
  return collection.modes[0].modeId;
}

function normalizeTokenName(text) {
  var t = (text || "").trim();
  if (!t) return null;
  if (t.indexOf("color/") === 0) return t;
  if (t.indexOf("bg/") === 0) return "color/" + t;
  if (t.indexOf("text/") === 0) return "color/" + t;
  if (t.indexOf("border/") === 0) return "color/" + t;
  if (t.indexOf("accent/") === 0) return "color/" + t;
  if (t.indexOf("status/") === 0) return "color/" + t;
  if (t.indexOf("ai/") === 0) return "color/" + t;
  return null;
}

function findTokenNameNear(node) {
  var parent = node.parent;
  if (!parent || !("children" in parent)) return null;
  for (var i = 0; i < parent.children.length; i++) {
    var child = parent.children[i];
    if (child.id === node.id) continue;
    if (child.type !== "TEXT") continue;
    var token = normalizeTokenName(child.characters);
    if (token) return token;
  }
  if (parent.type === "TEXT") {
    var pToken = normalizeTokenName(parent.characters);
    if (pToken) return pToken;
  }
  return null;
}

async function buildColorLookup() {
  var collections = await figma.variables.getLocalVariableCollectionsAsync();
  var semanticColl = findCollectionByName(collections, "AI Semantic Color");
  var fullColl = findCollectionByName(collections, "WeCom Full Color");
  var primColl = findCollectionByName(collections, "WeCom Primitives");
  var allVars = await figma.variables.getLocalVariablesAsync();

  var exactLight = {};
  var exactDark = {};
  var exactLightRgb = {};
  var exactDarkRgb = {};
  var varByName = {};
  var candidates = {
    light: { semantic: [], other: [] },
    dark: { semantic: [], other: [] },
  };

  function pushCandidate(logicalMode, isSemantic, variable, c, priority) {
    var bucket = isSemantic ? candidates[logicalMode].semantic : candidates[logicalMode].other;
    bucket.push({
      variable: variable,
      name: variable.name,
      priority: priority,
      lab: rgbToLab(c.r, c.g, c.b),
      a: c.a != null ? c.a : 1,
    });
  }

  function addColorVar(variable, modeId, logicalMode, priority, isSemantic, exactTarget, exactRgbTarget, sourceCollection) {
    if (variable.resolvedType !== "COLOR") return;
    varByName[variable.name] = variable;
    var c = resolveVariableValue(variable, modeId, sourceCollection);
    if (!c || typeof c.r !== "number") return;
    var key = rgbKeyFromColor(c, c.a);
    var rgbKey = rgbKeyOnly(c);
    var entry = { variable: variable, name: variable.name, priority: priority };
    if (!exactTarget[key] || exactTarget[key].priority > priority) {
      exactTarget[key] = entry;
    }
    if (!exactRgbTarget[rgbKey] || exactRgbTarget[rgbKey].priority > priority) {
      exactRgbTarget[rgbKey] = entry;
    }
    pushCandidate(logicalMode, isSemantic, variable, c, priority);
  }

  if (semanticColl) {
    var lightMode = modeIdForCollection(semanticColl, "light");
    var darkMode = modeIdForCollection(semanticColl, "dark");
    for (var i = 0; i < allVars.length; i++) {
      var v = allVars[i];
      if (v.variableCollectionId !== semanticColl.id) continue;
      if (v.name.indexOf("color/") !== 0) continue;
      addColorVar(v, lightMode, "light", 1, true, exactLight, exactLightRgb, semanticColl);
      addColorVar(v, darkMode, "dark", 1, true, exactDark, exactDarkRgb, semanticColl);
    }
  }

  if (fullColl) {
    var lightFull = fullColl.modes[0].modeId;
    var darkFull = fullColl.modes.length > 1 ? fullColl.modes[1].modeId : lightFull;
    for (var j = 0; j < allVars.length; j++) {
      var fv = allVars[j];
      if (fv.variableCollectionId !== fullColl.id) continue;
      if (fv.resolvedType !== "COLOR") continue;
      addColorVar(fv, lightFull, "light", 3, false, exactLight, exactLightRgb, fullColl);
      addColorVar(fv, darkFull, "dark", 3, false, exactDark, exactDarkRgb, fullColl);
    }
  }

  if (primColl) {
    var pm = primColl.modes[0].modeId;
    for (var k = 0; k < allVars.length; k++) {
      var pv = allVars[k];
      if (pv.variableCollectionId !== primColl.id) continue;
      if (pv.resolvedType !== "COLOR") continue;
      addColorVar(pv, pm, "light", 4, false, exactLight, exactLightRgb, primColl);
      addColorVar(pv, pm, "dark", 4, false, exactDark, exactDarkRgb, primColl);
    }
  }

  return {
    exactLight: exactLight,
    exactDark: exactDark,
    exactLightRgb: exactLightRgb,
    exactDarkRgb: exactDarkRgb,
    candidates: candidates,
    varByName: varByName,
    semanticColl: semanticColl,
    lightMode: semanticColl ? modeIdForCollection(semanticColl, "light") : null,
    darkMode: semanticColl ? modeIdForCollection(semanticColl, "dark") : null,
  };
}

function pickNearestFromPools(pools, paintLab, paintOpacity, paintIsLowChroma) {
  var best = null;
  var bestScore = 999999;
  for (var p = 0; p < pools.length; p++) {
    var pool = pools[p];
    for (var i = 0; i < pool.length; i++) {
      var item = pool[i];
      var score = deltaE(paintLab, item.lab);
      score = score + variableCategoryBonus(item.name);
      if (paintIsLowChroma) {
        if (item.name.indexOf("color/status/") === 0) score = score + 4;
        if (item.name.indexOf("color/ai/") === 0) score = score + 4;
        if (item.name.indexOf("color/accent/") === 0) score = score + 2;
      }
      score = score + (item.priority - 1) * 3;
      score = score + Math.abs(paintOpacity - item.a) * 12;
      if (score < bestScore) {
        bestScore = score;
        best = item.variable;
      }
    }
  }
  return best;
}

function pickColorVariable(lookup, paint, modeName, node, currentVarId) {
  if (!paint || paint.type !== "SOLID" || !paint.color) return null;

  var tokenName = findTokenNameNear(node);
  if (tokenName && lookup.varByName[tokenName]) {
    return lookup.varByName[tokenName];
  }

  var opacity = paint.opacity != null ? paint.opacity : 1;
  var modePools = modeName === "dark" ? lookup.candidates.dark : lookup.candidates.light;
  var paintLab = rgbToLab(paint.color.r, paint.color.g, paint.color.b);
  var lowChroma = isLowChroma(paintLab);

  var nearest = pickNearestFromPools([modePools.semantic], paintLab, opacity, lowChroma);
  if (nearest) return nearest;

  nearest = pickNearestFromPools([modePools.other], paintLab, opacity, lowChroma);
  if (nearest) return nearest;

  return null;
}

async function buildFloatLookup(prefixes, collectionNames) {
  var collections = await figma.variables.getLocalVariableCollectionsAsync();
  var collIds = {};
  var collById = {};
  for (var i = 0; i < collections.length; i++) {
    collById[collections[i].id] = collections[i];
    for (var j = 0; j < collectionNames.length; j++) {
      if (collections[i].name === collectionNames[j]) {
        collIds[collections[i].id] = collections[i].modes[0].modeId;
      }
    }
  }
  var allVars = await figma.variables.getLocalVariablesAsync();
  var map = {};
  for (var k = 0; k < allVars.length; k++) {
    var v = allVars[k];
    if (v.resolvedType !== "FLOAT") continue;
    var modeId = collIds[v.variableCollectionId];
    if (!modeId) continue;
    var matched = false;
    for (var p = 0; p < prefixes.length; p++) {
      if (v.name.indexOf(prefixes[p]) === 0) {
        matched = true;
        break;
      }
    }
    if (!matched) continue;
    var val = resolveVariableValue(v, modeId, collById[v.variableCollectionId]);
    if (typeof val === "number" && val > 0) {
      map[Math.round(val * 1000) / 1000] = v;
    }
  }
  return map;
}

function fieldAlreadyBound(node, field) {
  return node.boundVariables && node.boundVariables[field];
}

function bindFloatIfMatch(node, field, value, floatMap) {
  if (typeof value !== "number" || value <= 0) return false;
  if (fieldAlreadyBound(node, field)) return false;
  var rounded = Math.round(value * 1000) / 1000;
  var v = floatMap[rounded];
  if (!v) return false;
  try {
    node.setBoundVariable(field, v);
    return true;
  } catch (e) {
    return false;
  }
}

function bindCornerRadii(node, radius, floatMap) {
  if (typeof radius !== "number" || radius <= 0) return 0;
  if (fieldAlreadyBound(node, "topLeftRadius")) return 0;
  var fields = ["topLeftRadius", "topRightRadius", "bottomLeftRadius", "bottomRightRadius"];
  var count = 0;
  for (var i = 0; i < fields.length; i++) {
    if (bindFloatIfMatch(node, fields[i], radius, floatMap)) count = count + 1;
  }
  return count;
}

async function loadEffectStyleMap() {
  var styles = await figma.getLocalEffectStylesAsync();
  return { styles: styles };
}

function effectSignature(effects) {
  if (!effects || !effects.length) return "";
  var parts = [];
  for (var i = 0; i < effects.length; i++) {
    var e = effects[i];
    if (e.type !== "DROP_SHADOW" && e.type !== "INNER_SHADOW") continue;
    var c = e.color || {};
    parts.push(
      e.type +
        "|" +
        Math.round((e.offset && e.offset.x) || 0) +
        "|" +
        Math.round((e.offset && e.offset.y) || 0) +
        "|" +
        Math.round(e.radius || 0) +
        "|" +
        Math.round((c.r || 0) * 255) +
        "|" +
        Math.round((c.g || 0) * 255) +
        "|" +
        Math.round((c.b || 0) * 255)
    );
  }
  return parts.join(";");
}

async function processPaints(node, field, lookup, stats, modeName) {
  if (!(field in node)) return;
  var paints = node[field];
  if (!paints || !paints.length) return;
  var changed = false;
  var next = [];
  for (var i = 0; i < paints.length; i++) {
    var p = paints[i];
    if (p.type !== "SOLID" || !p.color) {
      next.push(p);
      continue;
    }

    stats.processedColors = stats.processedColors + 1;
    var currentVarId = getBoundColorVariableId(p);
    if (currentVarId) stats.alreadyBound = stats.alreadyBound + 1;

    var variable = pickColorVariable(lookup, p, modeName, node, currentVarId);
    if (!variable) {
      stats.unmappedColors = stats.unmappedColors + 1;
      next.push(p);
      continue;
    }

    if (currentVarId === variable.id) {
      stats.unchanged = stats.unchanged + 1;
      next.push(p);
      continue;
    }

    p = bindPaintColor(p, variable);
    changed = true;
    if (currentVarId) stats.rebound = stats.rebound + 1;
    else stats.newBound = stats.newBound + 1;
    next.push(p);
  }
  if (changed) node[field] = next;
}

async function processNode(node, lookup, floatMap, effectStyles, stats) {
  var modeName = detectColorMode(node);
  var modeId = modeName === "dark" ? lookup.darkMode : lookup.lightMode;
  if (lookup.semanticColl && modeId) {
    try {
      node.setExplicitVariableModeForCollection(lookup.semanticColl, modeId);
    } catch (e1) {
      /* ignore */
    }
  }

  await processPaints(node, "fills", lookup, stats, modeName);
  await processPaints(node, "strokes", lookup, stats, modeName);

  if (node.type === "FRAME" && node.layoutMode && node.layoutMode !== "NONE") {
    stats.spacing =
      stats.spacing +
      (bindFloatIfMatch(node, "paddingTop", node.paddingTop, floatMap) ? 1 : 0) +
      (bindFloatIfMatch(node, "paddingRight", node.paddingRight, floatMap) ? 1 : 0) +
      (bindFloatIfMatch(node, "paddingBottom", node.paddingBottom, floatMap) ? 1 : 0) +
      (bindFloatIfMatch(node, "paddingLeft", node.paddingLeft, floatMap) ? 1 : 0) +
      (bindFloatIfMatch(node, "itemSpacing", node.itemSpacing, floatMap) ? 1 : 0) +
      (bindFloatIfMatch(node, "counterAxisSpacing", node.counterAxisSpacing, floatMap) ? 1 : 0);
  }

  if ("cornerRadius" in node && typeof node.cornerRadius === "number") {
    stats.radius = stats.radius + bindCornerRadii(node, node.cornerRadius, floatMap);
  }

  if ("effects" in node && node.effects && node.effects.length && !node.effectStyleId) {
    var sig = effectSignature(node.effects);
    for (var i = 0; i < effectStyles.styles.length; i++) {
      var st = effectStyles.styles[i];
      if (effectSignature(st.effects) === sig) {
        node.effectStyleId = st.id;
        stats.effects = stats.effects + 1;
        break;
      }
    }
  }
}

function collectTargetNodes() {
  var selection = figma.currentPage.selection;
  if (selection && selection.length > 0) {
    var out = [];
    var seen = {};
    for (var si = 0; si < selection.length; si++) {
      var root = selection[si];
      var subtree = root.findAll(function (n) {
        return true;
      });
      for (var ti = 0; ti < subtree.length; ti++) {
        var id = subtree[ti].id;
        if (!seen[id]) {
          seen[id] = true;
          out.push(subtree[ti]);
        }
      }
      if (!seen[root.id]) {
        seen[root.id] = true;
        out.push(root);
      }
    }
    return { nodes: out, scope: "selection (" + selection.length + ")" };
  }

  var all = [];
  for (var pi = 0; pi < figma.root.children.length; pi++) {
    var page = figma.root.children[pi];
    var pageNodes = page.findAll(function (n) {
      return true;
    });
    for (var ni = 0; ni < pageNodes.length; ni++) {
      all.push(pageNodes[ni]);
    }
  }
  return { nodes: all, scope: "all pages" };
}

async function run() {
  try {
    var lookup = await buildColorLookup();
    var candidateCount =
      lookup.candidates.light.semantic.length +
      lookup.candidates.dark.semantic.length +
      lookup.candidates.light.other.length +
      lookup.candidates.dark.other.length;
    if (candidateCount === 0) {
      figma.closePlugin(
        "未找到可用的颜色变量。请确认文件内已有 AI Semantic Color 或 WeCom Full Color 集合。"
      );
      return;
    }

    var floatMap = await buildFloatLookup(
      ["spacing/", "radius/"],
      ["WeCom Layout", "AI Dimensions"]
    );
    var effectStyles = await loadEffectStyleMap();
    var target = collectTargetNodes();
    var stats = {
      processedColors: 0,
      alreadyBound: 0,
      newBound: 0,
      rebound: 0,
      unchanged: 0,
      unmappedColors: 0,
      spacing: 0,
      radius: 0,
      effects: 0,
      nodes: 0,
    };

    for (var ni = 0; ni < target.nodes.length; ni++) {
      await processNode(target.nodes[ni], lookup, floatMap, effectStyles, stats);
      stats.nodes = stats.nodes + 1;
    }

    figma.closePlugin(
      "完成（" +
        target.scope +
        "）：处理 " +
        stats.processedColors +
        " 色，新绑 " +
        stats.newBound +
        "，重绑 " +
        stats.rebound +
        "，已正确 " +
        stats.unchanged +
        "，间距/圆角 " +
        (stats.spacing + stats.radius) +
        "，投影 " +
        stats.effects +
        "，未匹配 " +
        stats.unmappedColors
    );
  } catch (err) {
    figma.closePlugin("执行失败: " + String(err));
  }
}

run();
