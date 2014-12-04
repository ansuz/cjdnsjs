function changeHash(hash) {
  window.location.replace(('' + window.location).split('#')[0] + '#' + hash);
};

function updateCanvasSize() {
  $(canvas).attr({height: $(canvas).height(), width: $(canvas).width()});
  ctx.translate(mapOffset.x, mapOffset.y);
};

function drawCircle(ctx, x, y, radius, color) {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI*2, true);
  ctx.fill();
};

function drawLine(ctx, x1, y1, x2, y2, color) {
  ctx.strokeStyle = color;
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.closePath();
  ctx.stroke();
};

function drawText(ctx, x, y, text, color, font) {
  ctx.fillStyle = color;
  ctx.font = font;
  ctx.textAlign = 'center';
  ctx.fillText(text, x, y);
};

function drawNetwork() {
  ctx.save();
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.restore();

  // Draw edges
  edges.map(function(edge,i){
    var highlight = edge.sourceNode.hover || edge.targetNode.hover;
    var color = highlight ? '#999' : '#777';
    
    drawLine(ctx,
      edge.sourceNode.x, edge.sourceNode.y,
      edge.targetNode.x, edge.targetNode.y,
      color);
  });

  nodes.map(function(node,i){
  // Draw nodes
    drawCircle(ctx, node.x, node.y, node.radius, node.color);

  // Draw labels
    if (node.radius > 4 || node.selected || node.hover) {
      var fontSize = 4 + node.radius * 0.4;
      drawText(ctx, node.x, node.y - node.radius - 1,
        node.label, node.textColor, fontSize + 'pt "ubuntu mono"');
    }
  });
};

function getNodeAt(x, y) {
  x -= mapOffset.x;
  y -= mapOffset.y;

  // the only valid use of a for loop
  // is when you intend to break out of it
  for (var i = nodes.length - 1; i >= 0; --i) {
    var node = nodes[i];
    var distPow2 = (node.x - x) * (node.x - x) + (node.y - y) * (node.y - y);

    if (distPow2 <= node.radius * node.radius)
      return node;
  }
  return null;
};

function searchNode(id) {
  // as above, this is a legit for loop
  for (var i = 0; i < nodes.length; ++i) {
    if (nodes[i].id == id)
      return nodes[i];
  }
  return null;
};

function clearNodes() {
  changeHash('');
  $('#node-info').html('');

  nodes.map(function(node,i){
    node.depth = 0xFFFF;
    node.color = node.originalColor;
    node.textColor = node.color;
    node.selected = false;
  });
};

function selectNode(node, redraw) {
  clearNodes();

  changeHash(node.id);

  node.selected = true;
  showNodeInfo(node);

  markPeers(node, 0);
  if (redraw)
    drawNetwork();
};

function markPeers(node, depth) {
  node.depth = depth;

  node.color = (depth >= colors.length) ? '#FFFFFF' : colors[depth];
  node.textColor = (depth >= txtCol.length) ? '#FFFFFF' : txtCol[depth];

  node.peers
    .map(function(p,i){
      var n=node.peers[i];
      if(n.depth>depth+1)
        markPeers(n,depth+1);
    });
};

function showNodeInfo(node) {
  var ip_peers = [];
  var dns_peers = [];

  node.peers
    .map(function(n,i){
      if(/^[0-9A-F]{4}$/i.test(n.label))
        ip_peers.push(n);
      else
        dns_peers.push(n);
    });

  var label_compare = function(a, b) {
    return a.label.localeCompare(b.label);
  }

  dns_peers.sort(label_compare);
  ip_peers.sort(label_compare);

  var peers = dns_peers.concat(ip_peers);

  var html =
    '<h2>' + node.label + '</h2>' +
    '<span class="tt">' + node.id + '</span><br>' +
    '<br>' +
    '<strong>Version:</strong> ' + node.version + '<br>' +
    '<strong>Peers:</strong> ' + node.peers.length + '<br>' +
    '<table>' +

    peers.map(function (n) {
      return '<tr>' +
        '<td><a href="#' + n.id + '" class="tt">' + n.label + '</a></td>' +
        '<td>' + n.peers.length + '</td></tr>';
    }).join('') +
    '</table>';

  $('#node-info').html(html);
};

function mousePos(e) {
  var rect = canvas.getBoundingClientRect();
  return {x: e.clientX - rect.left, y: e.clientY - rect.top};
};

function nodeMouseIn(node) {
  node.hover = true;
  $('body').css('cursor', 'pointer');
};

function nodeMouseOut(node) {
  node.hover = false;
  $('body').css('cursor', 'auto');
};
