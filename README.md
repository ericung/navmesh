#Navigation Mesh project

![Navigation Mesh][navmesh]

An implementation of a naive hexagonal navigation mesh using [boids][1] and the [A* algorithm][2]. I used a [boilerplate][3] to help set up the project. Since three.js is continually changing at this stage, I added the libraries and API into this project just in case of future deprecation.

All of the code for this project is in [nav-mesh.js][4] and index.html.

To run this project, open the index.html in a browser, use the make file, or go [here][5].

####Features

1. Boids with A* on a naive hexagonal navigation mesh with nodes as elements.
2. Boids collide and don't intersect with objects.
3. Clickable nodes allows user to interact with environment in realtime.
4. Set and remove nodes to turn into obstacles.
5. A naive hexagonal navigation mesh algorithm that can add/remove nodes.

####The Navigation Mesh
The navigation mesh is an mxn grid with alternating columns. This splits the left and right neighbors of a node depending on it's column position. The top and bottom are the same in either case. For each node with index p, the i,j position in the mxn grid can be calculated as follows:
```
j = p%n
i = (p-j)/n
```
Now to get the six neighbors of node p with i,j calculated, use the heuristic:
```
  top: (i-1 >= 0) -> neighbor index = p - n
  bottom: (i+1 < m) -> neighbor index = p + n
  if j is even
    top left:     (j-1 >= 0) -> neighbor index = p - 1
    top right:    (j+1 < n) -> neighbor index = p + 1
    bottom left:  (i+1 < m) && (j-1 >= 0) -> neighbor index = p + n - 1
    bottom right: (i+1 < m) && (j+1 < n) -> neighbor index = p + n + 1
  else
    top left:     (i-1 >= 0) && (j-1 >= 0) -> neighbor index = p + n - 1
    top right:    (i-1 >= 0) && (j+1 < n) -> neighbor index = p + n + 1
    bottom left:  (j-1 >= 0) -> neighbor index = p - 1
    bottom right: (j+1 < n) -> neighbor index = p + 1
```

####Todo/Difficulties

1. Still need to figure out git submodules (I'll do it later...).
2. Creating ideas such as a navigation mesh like this one that implements triangulation within a few weeks.
3. Need to modularize more, so I can add to future projects if I want. I just wrote whatever came up in my head.
4. Non-nodal navigation meshes.
5. A monster that chomps on the boids. (See 3. Need more modularizing).

[1]: http://www.vergenet.net/~conrad/boids/pseudocode.html
[2]: http://en.wikipedia.org/wiki/A*_search_algorithm
[3]: http://jeromeetienne.github.io/threejsboilerplatebuilder/
[4]: js/nav-mesh.js
[5]: http://www.ericung.com/nav-mesh
[navmesh]: https://dl.dropboxusercontent.com/u/102357166/navmesh.png
