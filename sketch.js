/*
ONLY draw the walls that the light makes visible
- randomized puzzles

-editor
-tiles: glass unfillable, glass fillable
-permentant wall
-fillable floor, unfillable floor

*/

// global variables

let oldx, oldy;
let grid = [];
let edges = [];

let detector_colors;

let lightsources = [];
let detectors = [];

let gridSize = 30;

let globalFade = 0;
let difficulty_increase = 0;

const GRID_HALF = gridSize / 2;
const GRID_THIRD = gridSize / 3;

const gameHeight = 600;
const gameWidth = 900;

const uiHeight = 200;

const gridWidth = gameWidth / gridSize;
const gridHeight = gameHeight / gridSize;

let detectorX = gridWidth - 5;
let detectorY = gridHeight - 5;
let detectorSelected = false;
let detectorActive = true;

let difficulty_level = 1;

let all_detectors_active = false;

let display_editor = false;

// Mouse state stuff
const MOUSE_STATE_NORMAL = 0;
const MOUSE_STATE_DRAG = 1;
const MOUSE_STATE_DROPPED_DRAG = 2;
let selected_light = undefined;
let dragged_light = undefined;
let mouse_state = MOUSE_STATE_NORMAL;
let already_clicked = false;

// Do we add extra illumination at cursor?
let show_mouse_illumination = true;

// Constants to help with edge detection
const NORTH = 0;
const SOUTH = 1;
const EAST = 2;
const WEST = 3; 

// color for walls
let solid_wall_outline;
let solid_wall_fill;
let solid_wall_permenant_fill;
let empty_space_outline;
let empty_space_fill;
let empty_space_2_fill;
let edge_color;
let edge_circle_color;

// tiles
const EMPTY_FLOOR = 0;      // darker, no tiles
const FLOOR_BUILDABLE = 1;  // tiles

const PERMENANT_WALL = 2;
const GLASS_WALL = 3;
const GLASS_WALL_TOGGLABLE = 4;

const DETECTOR_TILE = 5;

class detector
{
  constructor(x, y, r, g, b)
  {
    this.x = x;
    this.y = y;
    this.c = color(r,g,b);
    this.r = r;
    this.g = g;
    this.b = b;
    this.correct = false;
    this.anim_cycle = random(10);
    this.anim_speed = random() / 25;
    grid[x][y].grid_type = DETECTOR_TILE;
    grid[x][y].permenant = true;
    // grid[x][y].unpassable = true;
  }

  check_color()
  {


    let xp = this.x * gridSize + GRID_HALF;
    let yp = this.y * gridSize + GRID_HALF;
    let HALF_HALF = GRID_HALF / 2;

    let r = 0;
    let g = 0;
    let b = 0;

    // for each light detector, see if we can see them from
    // our current position.

    // check 5 locations to simulate more than just checking the point in the middle
    let locs = [[xp - HALF_HALF, yp], [xp + HALF_HALF, yp], [xp, yp - HALF_HALF], [xp, yp + HALF_HALF], [xp, yp]];
    for (let [xpos, ypos] of locs)
    {
      // if we can, add their light values onto ours, then check if 
      // we are the correct light value
      for (let l of lightsources)
      {
        if (!l.active)
          continue;
        let xtarget = l.x  * gridSize + (gridSize / 2);
        let ytarget = l.y * gridSize + (gridSize / 2)


        // draw the line between detector and light sources
        // strokeWeight(2);
        // stroke(255, 50);
        // line(xtarget, ytarget, xpos, ypos);
        // here is where we do our checks!

        //// start of copied code from edge checking

        // line segment1 is xtarget,ytarget to xpos, ypos
        // line segment2 e2.sx, e2.sy to e2.ex, e2.ey
        let has_intersection = false;

        let min_px, min_py;

        for (let e2 of edges) // check for ray intersection
        {

          let s1_x = xpos - xtarget;     
          let s1_y = ypos - ytarget;
          let s2_x = e2.ex - e2.sx;     
          let s2_y = e2.ey - e2.sy;

          let s = (-s1_y * (xtarget - e2.sx) + s1_x * (ytarget - e2.sy)) / (-s2_x * s1_y + s1_x * s2_y);
          let t = ( s2_x * (ytarget - e2.sy) - s2_y * (xtarget - e2.sx)) / (-s2_x * s1_y + s1_x * s2_y);

          // if we have an intersection
          if (s >= 0 && s <= 1 && t >= 0 && t <= 1)
          {
            min_px = xtarget + (t * s1_x);
            min_py = ytarget + (t * s1_y);
            has_intersection = true;
            break;
          }
        }

        // if (has_intersection)
        // {
        //   // collect the color from the light source
        //   strokeWeight(2);
        //   stroke(255, 255, 255);
        //   ellipse(min_px, min_py, 4, 4);
        //   ///// end of copied code from edge checking
        // }

        if (!has_intersection)
        {
          r += l.r;
          g += l.g;
          b += l.b;
        }
      }
      if (r === this.r && g === this.g && b == this.b)
      {
        this.correct = true;
        return;
      }
    }
    this.correct = false;
  }

  draw_this()
  {
    let default_size = 0.75;
    default_size *= (abs(sin(this.anim_cycle)) + 3) / 4;
    this.anim_cycle += this.anim_speed;
    if (this.anim_cycle > TWO_PI)
      this.anim_cycle = 0;
    strokeWeight(7);
    stroke(12, 12, 12);
    noFill();
    ellipse(this.x * gridSize + GRID_HALF, this.y * gridSize + GRID_HALF, gridSize * 0.65, gridSize * 0.65);
    strokeWeight(4);
    stroke(this.c);
    if (this.correct)
    {
      fill(this.c);
    }
    else
    {
      noFill();
    }
    ellipse(this.x * gridSize + GRID_HALF, this.y * gridSize + GRID_HALF, gridSize * default_size, gridSize * default_size);
  }
}

class light_source
{
  constructor(x, y, active, r, g, b)
  {
    this.x = x;
    this.y = y;
    this.active = active;
    this.seleted = false;

    // a lightsource has an ON COLOR, OFF COLOR, and LIGHT COLOR, and those values are 
    // made brighter by some predetermined amount if they are selected
    // one red, one green, one blue
    // specify a base color and do all color calculations off that for now!
    // could add custom light stuff later
    this.r = r;
    this.g = g;
    this.b = b;

    // This might not be the best way to do this but it could work for now?!
    this.c = color(r, g, b);
    this.shadow_color = color(r, g, b, 105);

    this.dark_light = color(r / 2.5, g / 2.5, b / 2.5, 70);
    this.med_light = color(r / 2, g / 2, b / 2, 90);

    this.selected_on_outside = color(max(100, r), max(100, g), max(100, b));
    this.selected_on_inside = color(max(80, r - 50), max(80, g - 50), max(80, b - 50));

    this.selected_off_outside = color(max(80, r - 70), max(80, g - 70), max(80, b - 70));
    this.selected_off_inside = color(max(50, r - 110), max(50, g - 110), max(50, b - 110));

    this.dark_outside = color(max(70, r / 2), max(70, g / 2), max(70, b / 2));
    this.dark_inside = color(max(60, r / 2 - 10), max(60, g / 2 - 10), max(60, b / 2 - 10));

    this.light_outside = color(max(100, r), max(100, g), max(100, b));
    this.light_inside = color(max(80, r - 30), max(80, g - 30), max(80, b - 30));

  }

  draw_light()
  {
    if (this.active)
    {
      blendMode(ADD);
      let cx = this.x * gridSize + gridSize / 2;
      let cy = this.y * gridSize + gridSize / 2;
      noStroke();
      fill(this.shadow_color);

      let viz_polygon = get_visible_polygon(cx, cy, 10);
      remove_duplicate_viz_points(viz_polygon);
      if (viz_polygon && viz_polygon.length > 1)
      {
        beginShape();
        vertex(cx, cy);
        for (i = 0; i < viz_polygon.length; ++ i)
          vertex(viz_polygon[i].x, viz_polygon[i].y);
        vertex(viz_polygon[0].x, viz_polygon[0].y);
        endShape();
      }  
      blendMode(BLEND);
    }
  }

  draw_this()
  {
    if (this.active)
    {
      blendMode(ADD);
      noStroke();
      fill(this.dark_light);
      ellipse(this.x * gridSize + (gridSize / 2), this.y * gridSize + (gridSize/2), gridSize * 3, gridSize * 3);
  
      fill(this.med_light);
      ellipse(this.x * gridSize + (gridSize / 2), this.y * gridSize + (gridSize/2), gridSize * 2, gridSize * 2);
      blendMode(BLEND);
    }
  
    strokeWeight(2);
    if (this.seleted)
    {
      if (this.active)
      {
        stroke(this.selected_on_outside);
        fill(this.selected_on_inside);
      }
      else
      {
        stroke(this.selected_off_outside);
        fill(this.selected_off_inside);
      }
    }
    else
    {
      if (this.active)
      {
        stroke(this.light_outside);
        fill(this.light_inside);
      }
      else
      {
        stroke(this.dark_outside);
        fill(this.dark_inside);
      }
    }
    ellipse(this.x * gridSize + (gridSize / 2), this.y * gridSize + (gridSize / 2), gridSize * 0.85, gridSize * 0.85);
  }
}

class edge
{
  constructor(sx, sy, ex, ey)
  {
    this.sx = sx;
    this.sy = sy;
    this.ex = ex;
    this.ey = ey;
  }
}

class grid_obj
{
  constructor()
  {
    this.edge_id = [0, 0, 0, 0];
    this.edge_exist = [false, false, false, false];
    this.exist = false;
    this.fade = 0;
    this.permenant = false;
    this.unpassable = false;
    this.grid_type = EMPTY_FLOOR;
  }
}

class viz_poly_point
{
  constructor(theta, x, y)
  {
    this.theta = theta;
    this.x = x;
    this.y = y;
  }
}

function clear_grid_spot(x, y)
{
  grid[x][y].grid_type = EMPTY_FLOOR;
  grid[x][y].permenant = false;
  grid[x][y].unpassable = false;
  grid[x][y].exist = false;
}

function resetStuff()
{
  initializeGrid();
  init_light_sources();
  init_random_detectors();
  difficulty_level = 1;
}

function setup() {
  // createCanvas(gameWidth, gameHeight + uiHeight);
  createCanvas(gameWidth, gameHeight);
  
  for (x = 0; x < gridWidth; ++x)
  {
    grid[x] = [];
    for (y = 0; y < gridHeight; ++y)
    {
      grid[x][y] = new grid_obj();
    }
  }

  initializeGrid();
  init_light_sources();
  init_random_detectors();

  solid_wall_fill = color(155, 155, 155);
  solid_wall_permenant_fill = color(180, 180, 180);
  solid_wall_outline = color(150, 150, 150);
  empty_space_fill = color(33, 33, 33);
  empty_space_2_fill = color(37, 37, 37);
  empty_space_outline = color(45, 45, 45);

  edge_color = color(90, 90, 90);
  edge_circle_color = color(70, 70, 70);

  // some UI stuff
  resetButton = createButton('Reset');
  resetButton.mousePressed(resetStuff);

  detector_colors = [color(255, 255, 255), color(0, 0, 0), color(255, 0, 0), color(0, 255, 0),
                    color(0, 0, 255), color(255, 255, 0), color(255, 0, 255), color(0, 255, 255)];
}

function drawUI()
{
  fill(37, 37, 37);
  rect(0, gameHeight, gameWidth, gameHeight + uiHeight);

  // draw detector selector
  let i = 0;
  for (let c of detector_colors)
  {
    fill(c);
    ellipse(10 + (i * 30) + 15, gameHeight + 25, 30);
    ++i;
  }
  textSize(32);
  fill(220);
  text("light", 10, gameHeight + 75);
  text("detector", 10, gameHeight + 110);
}

function initializeGrid()
{
  // initialize grid
  for (x = 0; x < gridWidth; ++x)
  {
    for (y = 0; y < gridHeight; ++y)
    {
      //grid[x][y].exist = false;
      clear_grid_spot(x, y);
      if (x === 0 || x === gridWidth - 1 || y === 0 || y === gridHeight - 1)
      {
        grid[x][y].exist = true;
        grid[x][y].permenant = true;
      }
    }
  }
  make_edges();
}

function init_light_sources()
{
  // init lights
  lightsources = []
  // RGB lights
  let source = new light_source(gridWidth - 5, gridHeight - 5, false, 255, 0, 0);
  lightsources.push(source);
  source = new light_source(gridHeight - 5, 5, false, 0, 255, 0);
  lightsources.push(source);
  source = new light_source(5, gridWidth / 2, false, 0, 0, 255);
  lightsources.push(source);
}

function init_random_detectors()
{
  // detectors
  detectors = []

  // we could raise the difficulty by adding more checkers
  for (i = 0 ; i < difficulty_level; ++ i)
  {
    let col_val = [0, 255];
    let r = random(col_val);
    let g = random(col_val);
    let b = random(col_val);
    if (difficulty_level == 1)
    {
      r = 255;
      g = 255;
      b = 255;
    }
    let xp = int(random(2, gridWidth - 2));
    let yp = int(random(2, gridHeight - 2));
    while (grid[xp][yp].grid_type != EMPTY_FLOOR)
    {
      xp = int(random(2, gridWidth - 2));
      yp = int(random(2, gridHeight - 2));
    }
    // TODO: If this chosen spot is a detector or a lightsource,
    // reject this position and try again
    let d = new detector(xp, yp, r, g, b);
    detectors.push(d);
  }
}

function remove_duplicate_viz_points(viz_polygon)
{
  if (viz_polygon.length === 0)
    return;
  
  let p_index = 0;
  while (p_index + 1 < viz_polygon.length)
  {
    if (abs(viz_polygon[p_index].x - viz_polygon[p_index + 1].x) < 0.3 && abs(viz_polygon[p_index].y - viz_polygon[p_index + 1].y) < 0.3)
    {
      viz_polygon.splice(p_index, 1);
    }
    else
    {
      ++p_index;
    }
  }
}

function make_edges()
{
  edges = [];
  // clear edges
  for (x = 0; x < gridWidth; ++x)
  {
    for (y = 0; y < gridHeight; ++y)
    {
      grid[x][y].edge_id = [0, 0, 0, 0];
      grid[x][y].edge_exist = [false, false, false, false];
    }
  }

  for (x = 0; x < gridWidth; ++x)
  {
    for (y = 0; y < gridHeight; ++y)
    {
      if(grid[x][y].exist)  // does cell exist
      {
        if (x > 0 && !grid[x-1][y].exist)  // if there is no western neighbor, it needs a western edge
        {
          if (grid[x][y - 1].edge_exist[WEST])  // If we have a northern neighbor, it may have an edge we can grow
          {
            edges[grid[x][y - 1].edge_id[WEST]].ey += gridSize;
            grid[x][y].edge_id[WEST] = grid[x][y - 1].edge_id[WEST];
            grid[x][y].edge_exist[WEST] = true;
          }
          else  // if not, we start a new edge
          {
            let new_edge = new edge(x * gridSize, y * gridSize, x * gridSize, y * gridSize + gridSize);

            let edge_id = edges.length;
            edges.push(new_edge);

            grid[x][y].edge_id[WEST] = edge_id;
            grid[x][y].edge_exist[WEST] = true;
          }
        }
        if (x < gridWidth - 1 && !grid[x + 1][y].exist)  // if there is no eastern neighbor, it needs an eastern edge
        {
          if (grid[x][ y- 1].edge_exist[EAST])  // If we have a northern neighbor, it may have an edge we can grow
          {
            edges[grid[x][y - 1].edge_id[EAST]].ey += gridSize;
            grid[x][y].edge_id[EAST] = grid[x][y - 1].edge_id[EAST];
            grid[x][y].edge_exist[EAST] = true;
          }
          else  // if not, we start a new edge
          {
            let new_edge = new edge(x * gridSize + gridSize, y * gridSize, x * gridSize + gridSize, y * gridSize + gridSize);

            let edge_id = edges.length;
            edges.push(new_edge);

            grid[x][y].edge_id[EAST] = edge_id;
            grid[x][y].edge_exist[EAST] = true;
          }
        }
        if (y > 0 && !grid[x][y - 1].exist)  // if there is no north neighbor, it needs an northern edge
        {
          if (grid[x - 1][y].edge_exist[NORTH])  // If we have a western neighbor, it may have an edge we can grow
          {
            edges[grid[x - 1][y].edge_id[NORTH]].ex += gridSize;
            grid[x][y].edge_id[NORTH] = grid[x - 1][y].edge_id[NORTH];
            grid[x][y].edge_exist[NORTH] = true;
          }
          else  // if not, we start a new edge
          {
            let new_edge = new edge(x * gridSize, y * gridSize, x * gridSize + gridSize, y * gridSize);

            let edge_id = edges.length;
            edges.push(new_edge);

            grid[x][y].edge_id[NORTH] = edge_id;
            grid[x][y].edge_exist[NORTH] = true;
          }
        }
        if (y < gridHeight - 1 && !grid[x][y+1].exist)  // if there is no south neighbor, it needs an southern edge
        {
          if (grid[x - 1][y].edge_exist[SOUTH])  // If we have a western neighbor, it may have an edge we can grow
          {
            edges[grid[x - 1][y].edge_id[SOUTH]].ex += gridSize;
            grid[x][y].edge_id[SOUTH] = grid[x - 1][y].edge_id[SOUTH];
            grid[x][y].edge_exist[SOUTH] = true;
          }
          else  // if not, we start a new edge
          {
            let new_edge = new edge(x * gridSize, y * gridSize + gridSize, x * gridSize + gridSize, y * gridSize + gridSize);

            let edge_id = edges.length;
            edges.push(new_edge);

            grid[x][y].edge_id[SOUTH] = edge_id;
            grid[x][y].edge_exist[SOUTH] = true;
          }
        }
      }
    }
  }
}

function checkMouse()
{
  if (mouseX < 0 || mouseX > width || mouseY < 0 || mouseY > height)
    return;

  // TODO: clean up spaghetti mouse code
  if (mouseIsPressed)
  {
    selected_light = get_selected_light(mouseX, mouseY);
    // this can be outside our canvas, ignore clicks outside the canvas
    let targetX = int(mouseX / gridSize);
    let targetY = int(mouseY / gridSize);
    if (targetX <= 0 || targetY <= 0 || targetX >= gridWidth - 1 || targetY >= gridHeight - 1)
      return;

    if (!already_clicked)
    {
      already_clicked = true;

      if (selected_light != undefined)
      {
        if (mouseButton === LEFT)
        {
          mouse_state = MOUSE_STATE_DRAG;
          dragged_light = selected_light;
        }
        else
        {
          //detectorActive = !detectorActive;
          lightsources[selected_light].active = !lightsources[selected_light].active;
        }
      }
    }

    //if (!mouseOverDetector(mouseX, mouseY))
    if (mouse_state == MOUSE_STATE_NORMAL)
    {
      if (mouseButton === RIGHT)
      {
        // clear a grid
        if (!grid[targetX][targetY].permenant)
          grid[targetX][targetY].exist = 0;
      }
      else if (mouseButton === LEFT)
      {
        // add a wall
        if (!grid[targetX][targetY].exist && !grid[targetX][targetY].permenant)
        {
          grid[targetX][targetY].exist = 1;
          grid[targetX][targetY].fade = 0;
        }
      }
      make_edges();
      oldx = 0;
      oldy = 0;
    }
    else if (mouse_state == MOUSE_STATE_DRAG)
    {
      // we're dragging a light around

      // This will need to be a bit more complicated since rn with a fast enough
      // mouse swipe you can go through walls
      if (!grid[targetX][targetY].exist && !grid[targetX][targetY].unpassable)
      {
        lightsources[dragged_light].x = targetX;
        lightsources[dragged_light].y = targetY;
      }
      else
      {
        dragged_light = undefined;
        mouse_state = MOUSE_STATE_DROPPED_DRAG;
      }
    }
    else
    {
      // do nothing?
      // we were dragging something but now we've dropped it
      // don't accept wall drawing or dragging input until another
      // mouse click
    }
  }
  else
  {
    already_clicked = false;
    dragged_light = undefined;
    mouse_state = MOUSE_STATE_NORMAL;
  }
}

function get_selected_light(xpos, ypos)
{
  // return index of the light that the cursor is over
  let i = 0;
  for (let l of lightsources)
  {
    if (l.x * gridSize <= xpos && xpos <= l.x * gridSize + gridSize 
      && l.y * gridSize <= ypos && ypos <= l.y * gridSize + gridSize)
      return i;
    ++i;
  }
  return undefined;
}

function check_detector_visible(xpos, ypos)
{
  // check if we can see any of the detector from xpos, ypos

  // first, check one beam to the center of the detector
}

function turn_lights_off()
{
  for (let l of lightsources)
  {
    l.active = false;
  }
}

function get_visible_polygon(xpos, ypos, radius)
{
  let viz_polygon = [];
  for (let e of edges)
  {
    // consider start and endpoint of edge
    for (i = 0; i < 2; ++i)
    {
      let rdx = (i === 0 ? e.sx : e.ex) - xpos;
      let rdy = (i === 0 ? e.sy : e.ey) - ypos;

      let base_ang = atan2(rdy, rdx);

      let ang = 0;
      for (j = 0; j < 3; ++j)
      {
        if (j === 0) ang = base_ang - 0.0001;
        if (j === 1) ang = base_ang;
        if (j === 2) ang = base_ang + 0.0001;

        rdx = radius * cos(ang);
        rdy = radius * sin(ang);

        let min_t1 = Infinity;
        let min_px = 0, min_py = 0, min_ang = 0;
        let valid = false;

        for (let e2 of edges) // check for ray intersection
        {
          // vector of edge
          let sdx = e2.ex - e2.sx;
          let sdy = e2.ey - e2.sy;
          // check they are not colinear
          if (abs(sdx - rdx) > 0 && abs(sdy-rdy) > 0)
          {
            // intersection of line segments formula
            let t2 = (rdx * (e2.sy - ypos) + (rdy * (xpos - e2.sx))) / (sdx * rdy - sdy * rdx);
            let t1 = (e2.sx + sdx * t2 - xpos) / rdx;

            if (t1 > 0 && t2 >= 0 && t2 <= 1.0)
            {
              // just get CLOSEST point of intersection
              if (t1 < min_t1)
              {
                min_t1 = t1;
                min_px = xpos + rdx * t1;
                min_py = ypos + rdy * t1;
                min_ang = atan2(min_py - ypos, min_px - xpos);
                valid = true;
              }
            }
          }
        }
        // IF we collided with something, add us to our viz list
        if (valid)
          viz_polygon.push(new viz_poly_point(min_ang, min_px, min_py));
      }
    }
  }
  // sort the triangles so it makes sense to draw them
  viz_polygon.sort((a, b) => {return a.theta - b.theta});
  return viz_polygon;
}

function draw() {

  if (display_editor)
    drawUI();

  checkMouse();
  let mx = mouseX;
  let my = mouseY;
  let mouse_updated = false;

  if (oldx != mx || oldy != my)
  {
    // get_visible_polygon(mx, my, 10);
    // remove_duplicate_viz_points();
    oldx = mx, oldy = my;
    mouse_updated = true;
  }

  // check if we've selected any lights
  if (mouse_updated)
  {
    detectorSelected = get_selected_light(mx, my);
    if (detectorSelected !== undefined)
    {
      lightsources[detectorSelected].seleted = true;
    }
    else
    {
      for (i = 0; i < lightsources.length; ++i)
      {
        lightsources[i].seleted = false;
      }
    }
  }

  strokeWeight(1);
  for (x = 0 ; x < gridWidth; ++x)
  {
    for (y = 0; y < gridHeight; ++y)
    {
      let odd = ((x + y) % 2 === 0);
      let p = (grid[x][y].permenant);
      if (!grid[x][y].exist)
      {
        if (grid[x][y].fade > 0)
          grid[x][y].fade -= 0.1;
        stroke(empty_space_outline);
        // lerp between the empty fill color and the color of whatever
        // solid thing will be there
        fill(lerpColor( odd ? empty_space_fill : empty_space_2_fill, 
                        p ? solid_wall_permenant_fill : solid_wall_fill, 
                        grid[x][y].fade));
        square(x * gridSize, y * gridSize, gridSize);
      }
      else if (grid[x][y].exist)
      {
        if (grid[x][y].fade < 1)
          grid[x][y].fade += 0.1;
        stroke(solid_wall_outline);
        // exact same thing as above!
        fill(lerpColor( odd ? empty_space_fill : empty_space_2_fill, 
                        p ? solid_wall_permenant_fill : solid_wall_fill, 
                        grid[x][y].fade));
        square(x * gridSize , y * gridSize, gridSize);
      }

      if (grid[x][y].unpassable)
      {
        strokeWeight(2);
        stroke(170, 170, 170);
        if (grid[x][y].permenant)
        {
          fill(170, 170, 170, 40);
        }
        square(x * gridSize + 1, y * gridSize + 1, gridSize - 3);

        // TODO: Little glass lines on the windows?
        // strokeWeight(1);
        // for (j = 0; j < 5; ++ j)
        // {
        //  line(x * gridSize + 10 - j, y * gridSize - j, x * gridSize + j, y * gridSize + 10 + j);
        // }

      }
    }
  }

  // draw walls
  strokeWeight(2);
  for (let e of edges)
  {
    stroke(edge_circle_color);
    ellipse(e.sx, e.sy, 2, 2);
    ellipse(e.ex, e.ey, 2, 2);

    stroke(edge_color);
    line(e.sx, e.sy, e.ex, e.ey);
  }

    // draw detectors
    let all_active = true;

    for (let d of detectors)
    {
      d.check_color();
      if(!d.correct)
        all_active = false;
      d.draw_this();
    }



  // draw our light sources in a first pass
  for (let l of lightsources)
  {
    l.draw_light();
  }

  // and then the lights themselves separately
  for (let l of lightsources)
  {
    l.draw_this()
  }



  // draw cursor visibility
  // draw cursor viz if mouse cursor isn't in a wall
  if (show_mouse_illumination)
  {
    let cursor_viz = get_visible_polygon(mx, my, 1);
    remove_duplicate_viz_points(cursor_viz);
    noStroke();
    fill(130, 130, 130, 30);

    if (mx >= 0 && mx <= width && my >= 0 && my <= height)
    {
      let targetX = int(mx / gridSize);
      let targetY = int(my / gridSize);
      targetX = constrain(targetX, 0, gridWidth - 1);
      targetY = constrain(targetY, 0, gridHeight - 1);

      if (!grid[targetX][targetY].exist && cursor_viz.length > 1 )
      {
        beginShape();
        vertex(mx, my);
        for (i = 0; i < cursor_viz.length; ++i)
          vertex(cursor_viz[i].x, cursor_viz[i].y);
        vertex(cursor_viz[0].x, cursor_viz[0].y);
        endShape();
      }
    }
  }

  strokeWeight(4);
  stroke(90, 50);
  for (x = 0 ; x < gridWidth; ++x)
  {
    for (y = 0; y < gridHeight; ++y)
    {
      if (grid[x][y].permenant)
        square(x * gridSize, y * gridSize, gridSize);
    }
  }

  if (all_active)
  {
    if (globalFade < 1)
    {
      globalFade += 0.01;
    }
    fill(48, 48, 48, globalFade * 255);
    rect(0, 0, gameWidth, gameHeight);
    if (globalFade >= 1)
    {
      ++difficulty_level;
      initializeGrid();
      turn_lights_off();
      init_random_detectors();
    }
  }

  if (!all_active && globalFade > 0)
  {
    globalFade -= 0.01;
    fill(48, 48, 48, globalFade * 255);
    rect(0, 0, gameWidth, gameHeight);
  }

  // no need to draw a dot where the cursor is I don't think?
  // stroke(175, 0, 10);
  // ellipse(mx, my, 2, 2);
}
