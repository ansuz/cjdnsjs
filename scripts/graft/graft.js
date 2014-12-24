var graft={};
var ansuz=require("ansuz");
var van=ansuz.van;

graft.Universe=function(graph){
  var U={}; // the universe of nodes

  graph.nodes.map(function(n,i){ // map over all the nodes
    U[n.id]={ // populate the universe
      id:n.id
      ,p:[]
      ,v:graph.nodes[i].version
    };
  });

  graph.edges.map(function(e){ // populate each node with edge data
    U[e.sourceID].p.push(e.targetID);
    U[e.targetID].p.push(e.sourceID);
  });

  Object.keys(U).map(function(node){ // precompute each node's number of peers
    U[node].n=U[node].p.length;
    if(U[node].n===0) // nodes with no peers shouldn't be on the graph
      delete U[node];
  });

  return U;
};

graft.distanceMatrix=function(U,maxDepth){
  // maxDepth allows you to limit how far it will explore the network
  // it has a default value of 20, which you can override if you wish
  maxDepth=maxDepth||20;

  var D={}; // D is the distance matrix object
  var I=Object.keys(U);
  var L=I.length;
  var done=false; // are we done yet? NO. definitely not.

  // we start with an empty store of nodes, but we have an index
  I.map(function(i){// for each entry in the index
    D[i]={}; // initialize an object
    D[i][i]=0; // that entry has a distance of zero from itself
  });

  var depth=0; // let's start by looking for nodes at a distance of one hop

  while(done !== true){ // as long as we still have work to do...

    var completion=I.map(function(i){
      // for each iteration of the while loop, we want to loop over each node
      // and deal only with its peers which are `depth` hops away.
      // the easiest way to do that is to grab all the keys in the object
      // and filter out all the nodes which do not match that depth

      Object.keys(D[i]).filter(function(nodes){ 
          return (D[i][nodes]===depth); // get just the nodes at this depth
        })
        .map(function(node){ // for every such node, apply this function

          U[node].p.map(function(pp){ // find all its peers' peers
            if(!D[i][pp] && D[i][pp] !== 0  ){ // avoid overwriting existing records
              // this is how we retrieve the shortest path
              D[i][pp]=depth+1; // they are $depth away from this node
              D[pp][i]=depth+1; // and vice versa, bcuz distance is reflexive
            }// skip this pair if distance has already been computed
          }); // this mapping was purely for side effects...

        }); // finish mapping over each node
        return Object.keys(D[i]).length===L;
        // this returns whether each node's list of distances is equal in length
        // to the global value L (this is a boolean value)
      }); // assign the value of this huge expression to the 'completion'

    var incomplete=completion.indexOf(false); // check for incomplete nodes

    if((++depth > maxDepth)||(incomplete===-1)){
      // if you've exceeded the maximum specified depth
      // of if every pair of nodes has its distance computed
      done=true; // then you're done
    } // default action is to continue

  } // end of while loop, which means you're done
  return D; // return the Distance Matrix object
};

/* graft.makeGraph */

graft.hexer=function(n){
  return ""+n.toString(16).toUpperCase();
};

graft.makeGraph=function(n,e){
  n=n||1,e=e||0; // return an island by default
  var U={};
  van.range(n-1)
    .map(function(g){
      var id=graft.hexer(g);
      U[id]={id:id,p:[]};
    });
  // peers:: generate 'e' edges
  return U;
};

module.exports=graft;
