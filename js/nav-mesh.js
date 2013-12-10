// ================================================================================================
// Author: Eric Ung
// Description: A demo for a naive hexagonal navigation mesh
// ================================================================================================

// global variables
const TRIANGLESIZE = 2;
const POINTWIDTH = 10;
const POINTHEIGHT = 10;
const BOIDCOUNT = 10;
const OBSTACLECOUNT = 0;
const NODECOUNT = POINTWIDTH*POINTHEIGHT;

var stats, scene, renderer, composer;
var camera, cameraControl;

// environment variables
var point, node, floor;
var mouse = {x:0, y:0};
var targetList = [];

// boid variables
var boid, xstart, ystart,zstart;
var xmin,xmax,ymin,ymax,zmin,zmax;
var vlim, m_time, m_const;
var goal,path,traverse;

// construct the navigation mesh before setting boids
constructNavMesh();

// construct the boids
constructBoids();

if( !init() )	animate();


// ================================================================================================


// init the scene
function init(){

    if( Detector.webgl ){
        renderer = new THREE.WebGLRenderer({
            antialias		: true,	// to get smoother output
            preserveDrawingBuffer	: true	// to allow screenshot
        });
        renderer.setClearColor( 0xBBBBBB, 1 );
    }else{
        renderer	= new THREE.CanvasRenderer();
    }
    renderer.setSize( window.innerWidth, window.innerHeight );
    document.getElementById('container').appendChild(renderer.domElement);

    // add Stats.js - https://github.com/mrdoob/stats.js
    stats = new Stats();
    stats.domElement.style.position	= 'absolute';
    stats.domElement.style.bottom	= '0px';
    document.body.appendChild( stats.domElement );

    // create a scene
    scene = new THREE.Scene();

    // put a camera in the scene
    camera	= new THREE.PerspectiveCamera(35, window.innerWidth / window.innerHeight, 1, 10000 );
    camera.position.set(0, 0, 100);
    scene.add(camera);

    // create a camera contol
    cameraControls = new THREE.OrbitControls( camera, renderer.domElement );

    // transparently support window resize
    THREEx.WindowResize.bind(renderer, camera);
    // allow 'p' to make screenshot
    THREEx.Screenshot.bindKey(renderer);
    // allow 'f' to go fullscreen where this feature is supported
    if( THREEx.FullScreen.available() ){
        THREEx.FullScreen.bindKey();		
        document.getElementById('inlineDoc').innerHTML	+= "- <i>f</i> for fullscreen";
    }

    // initialize object to perform world/screen calculations
    projector = new THREE.Projector();

    // when the mouse moves, call the given function
    document.addEventListener( 'mousedown', onDocumentMouseDown, false );

    // Lighting
    // ========
    var light	= new THREE.AmbientLight( Math.random() * 0xffffff );
    scene.add( light );
    var light	= new THREE.DirectionalLight( Math.random() * 0xffffff );
    light.position.set( Math.random(), Math.random(), Math.random() ).normalize();
    scene.add( light );
    var light	= new THREE.DirectionalLight( Math.random() * 0xffffff );
    light.position.set( Math.random(), Math.random(), Math.random() ).normalize();
    scene.add( light );
    var light	= new THREE.PointLight( Math.random() * 0xffffff );
    light.position.set( Math.random()-0.5, Math.random()-0.5, Math.random()-0.5 )
                .normalize().multiplyScalar(1.2);
    scene.add( light );
    var light	= new THREE.PointLight( Math.random() * 0xffffff );
    light.position.set( Math.random()-0.5, Math.random()-0.5, Math.random()-0.5 )
                .normalize().multiplyScalar(1.2);
    scene.add( light );

    // Floor
    // =====
    var floorMaterial = new THREE.MeshBasicMaterial( {color:Math.random()*0xffffff, 
                                side:THREE.DoubleSide} );
    var floorGeometry = new THREE.PlaneGeometry(1000, 1000, 10, 10);
    floor = new THREE.Mesh(floorGeometry, floorMaterial);
    floor.position.z = -1;
    //scene.add(floor);
    //targetList.push(floor);

    // draw points
    for (var i=0; i<POINTWIDTH; i++){
        for (var j=0; j<POINTHEIGHT; j++){
            var geom = new THREE.SphereGeometry(.1,16,8);
            var mat = new THREE.MeshLambertMaterial({
                            ambient:0x808080,
                            color:Math.random()*0xffffff
                            });
            var dot = new THREE.Mesh(geom,mat);
            if (j%2 == 0){
                dot.position.set(point[i][j].x,point[i][j].y,1);
            } else {
                dot.position.set(point[i][j].x,point[i][j].y,1);
            }
            scene.add(dot);
        }
    }

    // array of boids
    var geometry = new THREE.SphereGeometry(0.1,16,8);
    var material = new THREE.MeshLambertMaterial({
                                    ambient: 0x808080,
                                    color: Math.random()*0xffffff});
    for(var i=0; i<BOIDCOUNT; i++){
        boid[i] = new THREE.Mesh( geometry, material );
        boid[i].position.setX(2*Math.random()+xstart);
        boid[i].position.setY(2*Math.random()+ystart);
        boid[i].position.setZ(Math.random()+zstart);
        boid[i].velocity = new THREE.Vector3(0,0,0);
        scene.add( boid[i] );
    }
    
}


// ================================================================================================


// construct the boids
function constructBoids(){
    // set variables for boids
    boid = new Array(BOIDCOUNT);
    xstart = 0; 
    ystart=0;
    zstart=1;
    xmin=-100;
    xmax=100;
    ymin=-100;
    ymax=100;
    zmin=-100;
    zmax=100;
    vlim = 0.1;
    m_time = Math.random()*50+50;
    m_const = 1;

    // construct goal, path, and traverse
    goal = Math.floor(NODECOUNT*Math.random());
    path = a_star(0);
    traverse = path.length-1;
}


// ================================================================================================


// Construct navigation mesh
function constructNavMesh(){
    // memory for navigation mesh
    point = new Array(POINTWIDTH); 
    node = new Array(NODECOUNT);

    // temp variables
    var w = POINTWIDTH/2;
    var h = POINTHEIGHT/2;

    // allocate memory for nav-mesh points for picture
    for (var i=0; i<POINTWIDTH; i++){
        point[i] = new Array(POINTWIDTH);
    }


    // calculate and store points for navigation mesh
    var pos = 0;
    for (var i=0; i<POINTHEIGHT; i++){
        for (var j=0; j<POINTWIDTH; j++){
            if (j%2==0){
                node[pos] = new THREE.Vector3((j-w)*TRIANGLESIZE,
                                                (i-h)*TRIANGLESIZE+TRIANGLESIZE/2,1);
                point[i][j] = node[pos];
            } else {
                node[pos] = new THREE.Vector3((j-w)*TRIANGLESIZE,
                                                (i-h)*TRIANGLESIZE,1);
                point[i][j] = node[pos];
            }

            // calculate neighbors for the navigation mesh
            node[pos].neighbor = new Array();
            if ((j+1)%2 == 0){
                // top
                if ((i-1)>=0){
                    node[pos].neighbor.push(pos-POINTWIDTH); }
                // top left
                if ((j-1)>=0){
                    node[pos].neighbor.push(pos-1);}
                // top right
                if ((j+1)<POINTWIDTH){
                    node[pos].neighbor.push(pos+1);}
                // bottom left
                if (((i+1)<POINTHEIGHT)&&((j-1)>=0)){
                    node[pos].neighbor.push(pos+POINTWIDTH-1);}
                // bottom
                if ((i+1)<POINTHEIGHT){
                    node[pos].neighbor.push(pos+POINTWIDTH);}
                // bottom right
                if (((i+1)<POINTHEIGHT)&&((j+1)<POINTWIDTH)){
                    node[pos].neighbor.push(pos+POINTWIDTH+1);} 
            } else {
                // top
                if ((i-1)>=0){
                    node[pos].neighbor.push(pos-POINTWIDTH); }
                // top left
                if (((i-1)>=0)&&((j-1)>=0)){
                    node[pos].neighbor.push(pos-POINTWIDTH-1);}
                // top right
                if (((i-1)>=0)&&((j+1)<POINTWIDTH)){
                    node[pos].neighbor.push(pos-POINTWIDTH+1);}
                // bottom right
                if ((j-1)>=0){
                    node[pos].neighbor.push(pos-1);}
                // bottom left
                if ((j+1)<POINTWIDTH){
                    node[pos].neighbor.push(pos+1);}
                // bottom
                if ((i+1)<POINTHEIGHT){
                    node[pos].neighbor.push(pos+POINTWIDTH);}
            } 
            pos++;
        }
    }
}


// ================================================================================================


// mouse down
function onDocumentMouseDown( event ){
    // update mousevariable
    mouse.x = ( event.clientX / window.innerWidth ) * 2 - 1;
    mouse.y = - ( event.clientY / window.innerHeight ) * 2 + 1;

    // find intersections

    // create a Ray with origin at the mouse position
    //  and direction into the scene (camera direction)
    var vector = new THREE.Vector3( mouse.x, mouse.y, 1 );
    projector.unprojectVector ( vector, camera );
    var ray = new THREE.Raycaster(  camera.position, 
                                    vector.sub( camera.position ).normalize());

    // check for intersection
    // i == 0 is the floor
    // i > 0, dots
    var touched = false; 
    for (var i=targetList.length; i>=0; i--){
        var intersects = ray.intersectObject( targetList[i] );

        if (touched){
            break;
        }

        if (intersects.length > 0){
            if (i==0){
                var geometry = new THREE.SphereGeometry(2,16,8);
                var material = new THREE.MeshLambertMaterial({
                                ambient:0x808080,
                                color:Math.random()*0xffffff});
                var dot  = new THREE.Mesh(geometry,material);
                dot.position.set(intersects[0].point.x,intersects[0].point.y,0);
                scene.add(dot);
                targetList.push(dot);

                intersects[0].face.color.setRGB( 0.8*Math.random()+0.2,0,0 );
                intersects[0].object.geometry.colorsNeedUpdate = true;
            } else {
                console.log("Hit Dot @ "    + intersects[0].point.x + "\t" 
                                            + intersects[0].point.y + "\t"
                                            + targetList[i].scale.x);
                
                // change the color of the closest face.
                var s = targetList[i].scale.x;
                targetList[i].scale.set(s*1.1, s*1.1, s*1.1);
                targetList[i].geometry.radius += 1;
            }
            intersects[0].face.color.setRGB( 0.8*Math.random()+0.2,0,0 );
            intersects[0].object.geometry.colorsNeedUpdate = true;

            touched = true;
        }
    }
}


// ================================================================================================


// Center of mass
function computeMag(){
    var center = new THREE.Vector3(0,0,0);

    for (var i=0; i<BOIDCOUNT; i++){
        center.add(boid[i].position);
    }

    return center;
}


// ================================================================================================


// boids algorithm - http://www.vergenet.net/~conrad/boids/pseudocode.html
function computeVelocity(bi, mag){
    var temp = new THREE.Vector3(0,0,0);
    var velocity = new THREE.Vector3(0,0,0);

    // rule 1
    temp.subVectors(mag, boid[bi].position);
    temp.divideScalar(BOIDCOUNT-1);
    velocity.subVectors(temp, boid[bi].position);
    velocity.divideScalar(100);
    velocity.multiplyScalar(m_const);       // positive - flock, negative - scatter

    // rule 2
    temp.set(0,0,0);
    for (var j=0; j<BOIDCOUNT; j++){
        if (bi != j){
            if (boid[j].position.distanceTo(boid[bi].position) < 0.25){
                temp.sub(boid[j].position);
                temp.add(boid[bi].position);
            }
        }
    }
    velocity.add(temp);

    // rule 3
    temp.set(0,0,0);
    for (var j=0; j<BOIDCOUNT; j++){
        if(bi!=j){
            temp.add(boid[bi].velocity);
        }
    }
    temp.divideScalar(BOIDCOUNT-1);
    temp.sub(boid[bi].velocity);
    temp.divideScalar(8);
    velocity.add(temp);

    // tendacy towards goal
    temp.set(0,0,0);
    temp.subVectors(node[path[traverse]], boid[bi].position);
    temp.divideScalar(100);
    velocity.add(temp);

    // move away from obstacles
    temp.set(0,0,0);
    for (var j=0; j<OBSTACLECOUNT; j++){
        // check collision
        if (obstacle[j].position.distanceTo(boid[bi].position) < 1.1){
            temp.sub(obstacle[j].position);
            temp.add(boid[bi].position);
        }
        velocity.add(temp);
        // attempt to keep a distance
        
        temp.set(0,0,0);
        if (obstacle[j].position.distanceTo(boid[bi].position) < 1.6){
            temp.subVectors(obstacle[j].position, boid[bi].position);
            temp.divideScalar(-100);
        }
        //velocity.add(temp);
    }
    velocity.add(temp);

    // bound rule
    temp.set(0,0,0);
    if (boid[bi].position.x < xmin){
        temp.x = vlim/4;
    } else if (boid[bi].position.x > xmax){
        temp.x = -vlim/4;
    }
    if (boid[bi].position.y < ymin){
        temp.y = vlim/4;
    } else if (boid[bi].position.y > ymax) {
        temp.y = -vlim/4;
    }
    if (boid[bi].position.z < zmin){
        temp.z = vlim/4;
    } else if (boid[bi].position.z > zmax){
        temp.z = -vlim/4;
    }
    velocity.add(temp);

    return velocity;
}


// ================================================================================================


// limit velocity
function limit_velocity(bi){
    var tmp = Math.abs(boid[bi].velocity.length());
    if (tmp > vlim){
        boid[bi].velocity.divideScalar(tmp);
        boid[bi].velocity.multiplyScalar(vlim);
    }
}
    

// ================================================================================================


// updates where boids go next
function updatePathnode(bi){
    var where = path[traverse];
    // check and see if boid[bi] is within distance to the current node
    if ((boid[bi].position.distanceTo(node[where])) < 0.2){
        traverse--;
    }

    if (traverse < 0){
        //nodeView[goal].material.color.set(nodeColor);
        goal = Math.floor(Math.random()*NODECOUNT);     // change goal
        //nodeView[goal].material.color.set(Math.random()*0xffffff);
        path = a_star(path[0]);                           // change path with new goal
        traverse = path.length-1;                      // reset traverse
    }   
}


// ================================================================================================


// A* search - http://en.wikipedia.org/wiki/A*_search_algorithm
function a_star(ni){
    var closedset = new Array();
    var openset = new Array();
    openset.push(ni);
    var came_from = new Array(NODECOUNT);

    g_score = new Array(NODECOUNT);
    f_score = new Array(NODECOUNT);
    g_score[ni] = 0;
    f_score[ni] = g_score[ni] + node[ni].distanceTo(node[goal]);

    var current, tent_g_score, tent_f_score, neighbor;
    while(openset.length > 0){
        current=openset[0];
        for (var i=0; i<openset.length; i++){
            if (f_score[current] > f_score[openset[i]]){
                current = openset[i]; 
            }
        }

        if (current == goal){
            return reconstruct_path(came_from, goal, ni);
        } 

        openset.splice(openset.indexOf(current),1);
        closedset.push(current);

        for (var i=0; i<node[current].neighbor.length; i++){
            neighbor = node[current].neighbor[i];
            tent_g_score = g_score[current] + node[current].distanceTo(node[neighbor]);
            tent_f_score = tent_g_score + node[neighbor].distanceTo(node[goal]) ;
            if ((closedset.indexOf(neighbor) != -1)&&(tent_f_score>=f_score[neighbor])){
                continue;
            } 
            
            // openset.indexOf(neighbor) > -1 or tent_f_score < f_score[i]
            if ((openset.indexOf(neighbor)==-1) || (tent_f_score < f_score[neighbor])){
                came_from[neighbor] = current;
                g_score[neighbor] = tent_g_score;
                f_score[neighbor] = tent_f_score;
                if (openset.indexOf(neighbor) == -1){
                    openset.push(neighbor);
                }
            }
        }
    }
    return undefined;
}


// ================================================================================================ 


// helper function for A*
function reconstruct_path(c, g, s){
    var path = new Array();
    path.push(g);
    var iter = c[g];
    while (iter !== undefined){
        path.push(iter); 
        iter = c[iter];
    }
    return path;
}


// ================================================================================================ 


// test function for a star
function testa_star(ni) {
    console.log("====\t"+ni+"\t====");
    var path = a_star(ni);
    if (path === undefined){
        return;
    }
    for (var i = 0; i<path.length; i++){
        console.log(path[i]);
    }
}


// ================================================================================================ 


// test navigation mesh construction
function testNavMesh(){
    console.log("NODECOUNT: " + NODECOUNT);
    for (var i=0; i<NODECOUNT; i++){
        var str = i + ": ";
        for (var j=0; j<node[i].neighbor.length; j++){
            str += node[i].neighbor[j] + "\t";
        }
        console.log(str);
    }
}


// ================================================================================================ 


// animation loop
function animate() {
    // loop on request animation loop
    requestAnimationFrame( animate );

    //m_time--;
    if (m_time <= 0){
        if (m_const == 1){
            //m_time = Math.random()*5+5;
            m_time = 12.5;
        } else {
            m_time = Math.random()*100 + 150;
        }
        m_const *= -1;
    }

    // compute boid
    var mag = computeMag();
    for (var i = 0; i<BOIDCOUNT; i++){
        updatePathnode(i);
        boid[i].velocity.add(computeVelocity(i,mag));
        limit_velocity(i);
        boid[i].position.add(boid[i].velocity);
    }

    // do the render
    render();

    for (var i=1; i<targetList.length; i++){
        targetList[i].geometry.verticesNeedUpdate = true;  
    }

    // update stats
    stats.update();
}


// ================================================================================================


// render the scene
function render() {
    // variable which is increase by Math.PI every seconds - usefull for animation
    var PIseconds	= Date.now() * Math.PI;

    // update camera controls
    cameraControls.update();

    // actually render the scene
    renderer.render( scene, camera );
}
