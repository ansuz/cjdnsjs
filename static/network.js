/* All global constants should be defined here */

var nodes = [];
var edges = [];
var canvas = null;
var ctx = null;
var mapOffset = {x: 0, y: 0};
var zoom = 0.5;

/* Colors to be used */

var colors=van.range(10).map(function(i){
  var rgb=[0,2,4];
  return '#'+rgb.map(function(j){
    var t=((Math.sin(0.6*(i+22)+j)*127+128)
      *0x01<<0).toString(16);
      return (t.length<2)?"0"+t:t;
  }).join("");
});

// text colors
var txtCol=van.range(10).map(function(i){
  var n=((i/10+6)*0xFF<<0).toString(16);
  return '#'+n+n+n;
});

function onceFetched(data) {
  nodes = data.nodes;
  edges = data.edges;

  // Calculate node radii
  nodes.map(function(node,i){
    node.x = node.x * 1.2;
    node.y = node.y * 1.2;
    node.radius = 4 + node.size * 10;
    node.hover = false;
    node.selected = false;
    node.edges = [];
    node.peers = [];
    node.depth = 0xFFFF;
    node.originalColor = node.color;
    node.textColor = node.color;
  });

  // Find node references for edges
  edges.map(function(edge){
    nodes.map(function(node,n){
      if (node.id == edge.sourceID)
        edge.sourceNode = node;
      else if (node.id == edge.targetID)
        edge.targetNode = node;
    });

    edge.sourceNode.edges.push(edge);
    edge.targetNode.edges.push(edge);
    edge.sourceNode.peers.push(edge.targetNode);
    edge.targetNode.peers.push(edge.sourceNode);
  });

  // Set update time
  var delta = Math.round(new Date().getTime() / 1000) - data.created;
  var min = Math.floor(delta / 60);
  var sec = delta % 60;
  $('#update-time').text(min + ' min, ' + sec + ' s ago');

  // Set stats
  $('#number-of-nodes').text(nodes.length);
  $('#number-of-connections').text(edges.length);

  if (window.location.hash) {
    var id = window.location.hash.substring(1);
    var node = searchNode(id);
    if (node) selectNode(node, false);
  }

  drawNetwork();

  $(window).resize(function() {
    updateCanvasSize();
    drawNetwork();
  });

  // Initialize search
  var searchArray = [];
  nodes.map(function(node,i){
    searchArray.push({
      value: node.label,
      data: node
    });

    searchArray.push({
      value: node.id,
      data: node
    });
  });

  $('#search-box').autocomplete({
    lookup: searchArray,
    autoSelectFirst: true,
    lookupLimit: 7,
    onSelect: function(suggestion) {
      selectNode(suggestion.data, true);
    }
  });

  $('#search-box').keypress(function(e) {
    if (e.which == 13) {
      selectNode(searchNode($('#search-box').val()), true);
    }
  });

  $(document).on('click', '#node-info a', function(e) {
    var id = e.target.hash.substring(1);
    selectNode(searchNode(id), true);
  });
};

$(document).ready(function() {
  canvas = document.getElementById('map');
  ctx = canvas.getContext('2d');
  updateCanvasSize();

  jQuery.getJSON('/graph.json',onceFetched);

  var mouseDownPos = null;
  var mouseLastPos = null;
  var mouseDownNode = null;
  var mouseHoverNode = null;

  $(canvas).mousemove(function(e) {
    var mouse = mousePos(e);

    // Dragging
    if (mouseDownPos != null) {
      $('body').css('cursor', 'move');
      var dx = mouse.x - mouseLastPos.x;
      var dy = mouse.y - mouseLastPos.y;
      mapOffset.x += dx;
      mapOffset.y += dy;
      ctx.translate(dx, dy);
      mouseLastPos = {x: mouse.x, y: mouse.y};
      drawNetwork();
    }
    // Hovering
    else {
      var node = getNodeAt(mouse.x, mouse.y);

      if (node == mouseHoverNode)
        return;

      if (node == null) {
        nodeMouseOut(mouseHoverNode);
      }
      else {
        if (mouseHoverNode != null)
          nodeMouseOut(mouseHoverNode);

        nodeMouseIn(node);
      }
      mouseHoverNode = node;

      drawNetwork();
    }
  });

  $(canvas).mousedown(function(e) {
    var mouse = mousePos(e);
    mouseLastPos = mouseDownPos = {x: mouse.x, y: mouse.y};
    mouseDownNode = getNodeAt(mouse.x, mouse.y);
    return false;
  });

  $(canvas).mouseup(function(e) {
    var mouse = mousePos(e);
    var mouseMoved =
      Math.abs(mouse.x - mouseDownPos.x) + 
      Math.abs(mouse.y - mouseDownPos.y) > 3

    if (!mouseMoved) {
      if (mouseDownNode)
        selectNode(mouseDownNode, true);
      else {
        clearNodes();
        drawNetwork();
      }
    }
    else {
      $('body').css('cursor', 'auto');
    }

    mouseDownPos = null;
    mouseDownNode = null;
    return false;
  });

  function handleScroll(e) {
    var mouse = mousePos(e);
    var e = window.event;
    var delta = Math.max(-1, Math.min(1, (e.wheelDelta || -e.detail)));

    var ratio = (delta < 0) ? (3 / 4) :  1 + (1 / 3);
    var mx = mouse.x - mapOffset.x;
    var my = mouse.y - mapOffset.y;

    zoom *= ratio;

    nodes.map(function(node,i){
      node.x = (node.x - mx) * ratio + mx;
      node.y = (node.y - my) * ratio + my;
      node.radius = (4 + node.size * 8) * zoom;
    })

    drawNetwork();
  }
  canvas.addEventListener("mousewheel", handleScroll, false);
  canvas.addEventListener("DOMMouseScroll", handleScroll, false);
});
