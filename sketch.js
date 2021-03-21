/*
ONLY draw the walls that the light makes visible

- make player click through to next puzzle!
  - Once they've solved a puzzle, let them look at it a bit! Bask in the glory!
- editor
- tiles: glass unfillable, glass fillable
- high scores
  - reset high score
- encapsulate state in a better way
  - right now it is kind of spread out and a bit icky how it is all implemented
  - collect and fix that stuff up
- change game grid size - allow this to be customized - this might be implemented?
- make it work on mobile? 
  - single click to toggle light on and off, drag to move it  
  - fix webpage
- Game Modes:
    - This will involve a main menu of some sort!
  - timer, countdown and every solution gets you some more time
  - more points for using less walls!
  - mode where you can only activate one light at a time?
    - press a button to check your solution, it is either wrong or right!
- Make sure all detectors aren't the same color!
- make R, G, B keys toggle their lights in random mode
- give editor "LOAD" and "PLAY" functions, so individual levels will be used in there?
- fix allowing tiles to be made on detectors!
- don't allow holes to spawn on lights?
*/

// global variables
let grid = [];
let edges = [];

let lightsources = [];
let detectors = [];

let gridSize = 30;

let globalFade = 0;
let saveFade = 0;

const GRID_HALF = gridSize / 2;
const GRID_THIRD = gridSize / 3;

const gameHeight = 600;
const gameWidth = 900;
const uiHeight = 200;

const gridWidth = gameWidth / gridSize;
const gridHeight = gameHeight / gridSize;


let current_level = undefined;  // The currently loaded level, there can be only one!
let difficulty_level = 1;
let all_detectors_active = false; // this is for random games
let highest_score;

let display_editor = false;

let show_intro = false;
let show_tutorial = false;
let show_menu = false;
let waiting_for_tutorial_unclick = false;

let next_level_available = false;
let over_next_level = false;

// Mouse state stuff
let oldx, oldy;
const MOUSE_STATE_NORMAL = 0;
const MOUSE_STATE_DRAG = 1;
const MOUSE_STATE_DROPPED_DRAG = 2;
let mouse_state = MOUSE_STATE_NORMAL;
let selected_light = undefined;
let dragged_light = undefined;
let already_clicked = false;
let show_mouse_illumination = false;
let mouse_over_menu = false;

// Constants to help with edge detection
const NORTH = 0;
const SOUTH = 1;
const EAST = 2;
const WEST = 3; 

// menu options
const main_menu_options = ["save", "load", "reset grid", "reset game", "editor", "tutorial", "options", "about"];
let main_menu_selected = undefined;
let menu_height = main_menu_options.length + 1;

// ------+--------+----
// r g b | color  | # 
// ------+--------+----
// 0 0 0 | black  | 0
// 0 0 1 | blue   | 1
// 0 1 0 | green  | 2
// 0 1 1 | cyan   | 3
// 1 0 0 | red    | 4
// 1 0 1 | magenta| 5
// 1 1 0 | yellow | 6
// 1 1 1 | white  | 7
//-------+--------+----
const BLACK = 0;
const BLUE = 1;
const GREEN = 2;
const CYAN = 3;
const RED = 4;
const MAGENTA = 5;
const YELLOW = 6;
const WHITE = 7;

// color for walls (maybe make this a class?)
let solid_wall_outline;
let solid_wall_fill;
let solid_wall_permenant_fill;
let empty_space_outline;
let empty_space_fill;
let empty_space_2_fill;
let edge_color;
let edge_circle_color;
let font_color;

// list of all possible detector colors
let detector_colors;

// tiles
const FLOOR_EMPTY = 0;      // darker, no tiles
const FLOOR_BUILDABLE = 1;  // tiles
const FLOOR_BUILT = 6;      // buildable and built on

const PERMENANT_WALL = 2;
const GLASS_WALL = 3;
const GLASS_WALL_TOGGLABLE = 4;

const DETECTOR_TILE = 5;

// main game states
const STATE_SETUP = -1;
const STATE_INTRO = 0;
const STATE_MENU_LOADED = 1;
const STATE_LOADLEVEL = 6;
const STATE_GAME = 2;
const STATE_EDITOR = 3;
const STATE_OPTIONS = 4;
const STATE_ABOUT = 5;
const STATE_NEW_RANDOM_GAME = 7;
const STATE_RANDOM_LEVEL_TRANSITION_OUT = 8;
const STATE_RANDOM_LEVEL_TRANSITION_IN = 9;

let game_state = STATE_SETUP;

// play mode
const GAMEMODE_RANDOM = 0;
const GAMEMODE_LEVELS = 1;

let intro_timer = 0;
let next_button_bob_timer = 0;

//////// CLASSES
class level
{
  constructor()
  {
    // we don't know the size until we load the level data!
    this.xsize = 0;
    this.ysize = 0;
    this.grid = [];
  }

  initialize_grid()
  {
    // initialize an array of grid here
    this.grid = [];
    for (var x = 0; x < this.xsize; ++x)
    {
      this.grid[x] = [];
      for (var y = 0; y < this.ysize; ++y)
      {
        this.grid[x][y] = new grid_obj();
      }
    }
  }

  set_level_data(level_data)
  {
    this.level_data = level_data;
  }

  save_level(lights, detectors)
  {
    // generate a string from this level object
    let level_string = "";
    let xsize_str = (this.xsize < 10 ? "0": "") + String(this.xsize);
    let ysize_str = (this.xsize < 10 ? "0": "") + String(this.ysize);
    level_string += xsize_str;
    level_string += ysize_str;

    // mode: assume random for now
    // TODO: Figure out where this information comes from, if we're in the editor or single level <--------------------
    // mode, then this will be different!!
    level_string += "r";
    level_string += (difficulty_level < 10 ? "0": "") + String(difficulty_level);


    let cur_char = "";
    for (var x = 0; x < this.xsize; ++x)
    {
      for (var y = 0; y < this.ysize; ++y)
      {
        switch (this.grid[x][y].grid_type)
        {
          case DETECTOR_TILE: cur_char = "5"; break;
          case FLOOR_EMPTY: cur_char = "0"; break;      
          case FLOOR_BUILDABLE: 
            if (!this.grid[x][y].exist) 
            {
              cur_char = "1"; 
              break;
            }
            else if (this.grid[x][y].exist)
            {
              cur_char = "6";
              break;
            }
          //case FLOOR_BUILT: cur_char = "6"; break;     
          case PERMENANT_WALL: cur_char = "2"; break;
          case GLASS_WALL: cur_char = "3"; break;
          case GLASS_WALL_TOGGLABLE: cur_char = "4"; break;
          default: cur_char = "x"; break;
        }
        level_string += cur_char;
      }
    }
    // write number of light sources
    let ls_num = (lights.length < 10 ? "0": "") + String(lights.length);
    level_string += ls_num;
    for (let l of lights)
    {
      let light_x = (l.x < 10 ? "0": "") + String(l.x);
      let light_y = (l.y < 10 ? "0": "") + String(l.y);
      let num_v = 0;
      if (l.r == 255)
        num_v += 4;
      if (l.g == 255)
        num_v += 2;
      if (l.b == 255)
        num_v += 1;
      let light_c = String(num_v);
      let light_on = "0";
      if (l.active)
        light_on = "1";
      level_string += light_x + light_y + light_c + light_on;
    }

    // write detectors and their positions
    let d_num = (detectors.length < 10 ? "0": "") + String(detectors.length);
    level_string += d_num
    for (let d of detectors)
    {
      let d_x = (d.x < 10 ? "0": "") + String(d.x);
      let d_y = (d.y < 10 ? "0": "") + String(d.y);
      let num_v = 0;
      if (d.r == 255)
        num_v += 4;
      if (d.g == 255)
        num_v += 2;
      if (d.b == 255)
        num_v += 1;
      let d_c = String(num_v);
      level_string += d_x + d_y + d_c;
    }
    saveFade = 1;
    storeItem("savedgame", level_string);
  }
}

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
    this.anim_cycle = random(TWO_PI);
    this.anim_speed = ((random() + 1) / 55) + 0.0025;

  }

  check_color()
  {
    let xp = this.x * gridSize + GRID_HALF;
    let yp = this.y * gridSize + GRID_HALF;
    let HALF_HALF = GRID_HALF / 2;


    // Check Detectors
    // Uses Boyer-Moore vote algorithm to determine the majority
    // of checked points that are receiving light
    // at least 3 of the internal points need to be covered in the correct
    // light color!
    let locs = [[xp - HALF_HALF, yp], [xp + HALF_HALF, yp], [xp, yp - HALF_HALF], [xp, yp + HALF_HALF], [xp, yp]];
    let majority_color = undefined;
    let majority_count = 0;
    let found_colors = [];

    for (let [xpos, ypos] of locs)
    {
      // if we can, add their light values onto ours, then check if 
      // we are the correct light value
      let r = 0;
      let g = 0;
      let b = 0;

      for (let l of lightsources)
      {

    
        if (!l.active)
          continue;
        let xtarget = l.x  * gridSize + (gridSize / 2);
        let ytarget = l.y * gridSize + (gridSize / 2)

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
        if (!has_intersection)
        {
          r += l.r;
          g += l.g;
          b += l.b;
        }
      }
      // once we get here, we have r, g, and b values of a single
      // lightsource hitting this light

      // add our found color to the color list
      let fc = color(r, g, b);
      found_colors.push(fc);

      // Boyer-Moore vote algorithm.
      if (majority_color === undefined || majority_count === 0)
      {
        majority_color = fc;
        majority_count = 1;
      }
      else if (majority_color == fc)
      {
        majority_count += 1;
      }
      else
      {
        majority_count -= 1;
      }

    }

    // TODO: Write a color equality function!
    if (red(majority_color) == this.r &&
        green(majority_color) == this.g &&
        blue(majority_color) == this.b)
    {
      // make sure it's actually a majority
      let count = 0;
      for (let col of found_colors)
      {
        if (red(col) === red(majority_color) && green(col) === green(majority_color) && blue(col) === blue(majority_color))
        {
          count += 1;
        }
      }
      if (count > 2)
        this.correct = true;
      else 
        this.correct = false;
    }
    else
    {
      this.correct = false;
    }
  }

  draw_this()
  {
    noStroke();
    fill(37);
    square(this.x * gridSize, this.y * gridSize, gridSize);

    let default_size = 0.8;
    default_size *= (sin(this.anim_cycle) + 9) / 10;
    this.anim_cycle += this.anim_speed;
    if (this.anim_cycle > TWO_PI)
      this.anim_cycle = 0;
    strokeWeight(7);
    if (this.r == 0 & this.g == 0 & this.b == 0)
      stroke(170);
    else
      stroke(4);
    ellipse(this.x * gridSize + GRID_HALF, this.y * gridSize + GRID_HALF, gridSize * default_size, gridSize * default_size);

    strokeWeight(5);
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
    this.grid_type = FLOOR_EMPTY;
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

//////// MAIN GAME
function setup() {
  createCanvas(gameWidth, gameHeight);
  initialize_colors();

  storeItem("savedgame", null);

  if (show_intro)
    game_state = STATE_INTRO;
  else
    game_state = STATE_NEW_RANDOM_GAME;

}

function initialize_colors() {
  solid_wall_fill = color(145, 145, 145);
  solid_wall_permenant_fill = color(180, 180, 180);
  solid_wall_outline = color(160, 160, 160);

  empty_space_fill = color(33, 33, 33);
  empty_space_2_fill = color(37, 37, 37);
  empty_space_outline = color(43, 43, 43);

  edge_color = color(90, 90, 90);
  edge_circle_color = color(80, 80, 80);

  font_color = color(35, 35, 35);

  // ------+--------+----
  // r g b | color  | # 
  // ------+--------+----
  // 0 0 0 | black  | 0
  // 0 0 1 | blue   | 1
  // 0 1 0 | green  | 2
  // 0 1 1 | cyan   | 3
  // 1 0 0 | red    | 4
  // 1 0 1 | magenta| 5
  // 1 1 0 | yellow | 6
  // 1 1 1 | white  | 7
  //-------+--------+----

  detector_colors = [color(0, 0, 0), color(0, 0, 255), color(0, 255, 0), color(0, 255, 255), 
    color(255, 0, 0), color(255, 0, 255), color(255, 255, 0), color(255, 255, 255)];
}

function handle_menu_selection()
{
  // "save", "load", "reset grid", "reset game", "editor", "tutorial", "options", "about"
  switch (main_menu_selected)
  {
    case 0:
      // save
      current_level.save_level(lightsources, detectors);
      break;
    case 1:
      break;
    case 2:
      // reset grid
      resetStuff();
      break;
    case 3:
      // reset game
      // TODO: Are you sure box!
      storeItem("savedgame", null);
      game_state = STATE_NEW_RANDOM_GAME;
      break;
    case 4:
      // editor
      break;
    case 5:
      // tutorial
      show_tutorial = true;
      break;
    case 6:
      // options
      break;
    case 7:
      // about
      break;
  }
}

function checkMouse()
{
  // TODO: Refactor all this code here!
  // Ewwww.... This is all gross spaghetti code, this needs to be split into a state machine
  // so that handling everything is a lot easier!
  let grid = current_level.grid;
  if (mouseX < 0 || mouseX > width || mouseY < 0 || mouseY > height)  // screen bound checks
    return;

  // switch (game_state)
  // {
  //   case STATE_GAME:
  // }

  if (mouseIsPressed && show_menu && !already_clicked && (main_menu_selected != undefined))
  {
    already_clicked = true;
    handle_menu_selection();
  }

  if (mouseIsPressed && over_next_level && next_level_available && !already_clicked)
  {
    already_clicked = true;
    game_state = STATE_RANDOM_LEVEL_TRANSITION_OUT;
  }

  if (mouseIsPressed && mouse_over_menu && !already_clicked)
  {
    already_clicked = true;
    show_menu = true;
  }

  // TODO: clean up spaghetti mouse code
  if (!mouseIsPressed && waiting_for_tutorial_unclick)
    waiting_for_tutorial_unclick = false;

  if (mouseIsPressed && !waiting_for_tutorial_unclick)
  {
    selected_light = get_selected_light(mouseX, mouseY);
    // this can be outside our canvas, ignore clicks outside the canvas
    let targetX = int(mouseX / gridSize);
    let targetY = int(mouseY / gridSize);
    // TODO: These come from level
    if (targetX <= 0 || targetY <= 0 || targetX >= current_level.xsize - 1 || targetY >= current_level.ysize - 1)
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
          lightsources[selected_light].active = !lightsources[selected_light].active;
        }
      }
    }

    // TODO: SHOULD not draw tiles behind main menu when clicking!
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
        if (!grid[targetX][targetY].exist && !grid[targetX][targetY].permenant && !show_menu)
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

// keyboard input
function keyPressed() {
  // JUST DEBUG STUFF?
  // editor keys and stuff will be handled here as well??
  if (keyCode === LEFT_ARROW) {
    difficulty_level--;
    random_level();
  } else if (keyCode === RIGHT_ARROW) {
    difficulty_level++;
    random_level();
  } else if (key === 's') {
    current_level.save_level(lightsources, detectors);
  } else if (key === 'l') {
    load_level(getItem("savedgame"));
  }
}

//////// MAP
function initializeGrid(which_grid)
{
  // initialize grid
  for (x = 0; x < gridWidth; ++x)
  {
    for (y = 0; y < gridHeight; ++y)
    {
      set_grid(which_grid, x, y, FLOOR_BUILDABLE);
      if (x === 0 || x === gridWidth - 1 || y === 0 || y === gridHeight - 1)
      {
        set_grid(which_grid, x, y, PERMENANT_WALL);
      }
    }
  }
}

function set_grid(which_grid, x, y, type)
{
  switch(type)
  {
    case FLOOR_EMPTY:
      which_grid[x][y].grid_type = FLOOR_EMPTY;
      which_grid[x][y].exist = false;
      which_grid[x][y].permenant = true;
      which_grid[x][y].unpassable = true;
      break;
    case PERMENANT_WALL:
      which_grid[x][y].grid_type = PERMENANT_WALL;
      which_grid[x][y].exist = true;
      which_grid[x][y].permenant = true;
      which_grid[x][y].unpassable = true;
      break;
    case FLOOR_BUILDABLE:
      which_grid[x][y].grid_type = FLOOR_BUILDABLE;
      which_grid[x][y].exist = false;
      which_grid[x][y].permenant = false;
      which_grid[x][y].unpassable = false;
      break;
    case DETECTOR_TILE:
      which_grid[x][y].grid_type = DETECTOR_TILE;
      which_grid[x][y].exist = false
      which_grid[x][y].permenant = true;
      which_grid[x][y].unpassable = false;
      break;

  }
}

function clear_grid_spot(which_grid, x, y)
{
  which_grid[x][y].grid_type = FLOOR_EMPTY;
  which_grid[x][y].permenant = false;
  which_grid[x][y].unpassable = false;
  which_grid[x][y].exist = false;
}

//////// STATES
function do_game()
{
  let grid = current_level.grid;
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

  // check if we're over the main menu button
  if (mouse_updated)
  {
    if (mx >= (gridWidth - 3) * gridSize && my <= gridSize)
    {
      mouse_over_menu = true;
    }
    else
    {
      mouse_over_menu = false;
    }
  }

  // check if we've moved off the menu if the menu is active
  if (mouse_updated && show_menu)
  {
    if (mx <= (gridWidth - 8) * gridSize || my >= menu_height * gridSize)
    {
      show_menu = false;
    }

    // other wise, maybe we're selecting a new menu item
    if ((gridWidth - 8) * gridSize <= mx && (menu_height * gridSize) >= my)
    {
      main_menu_selected = int(my / gridSize);
    }
    else
    {
      main_menu_selected = undefined;
    }
  }

  if (mouse_updated && next_level_available)
  {
    // check if we're in the lower right hand
    over_next_level = ((gridWidth - 3) * gridSize <= mx && my >= (gridHeight - 1) * gridSize);
  }

  // draw base grid (walls + floors)
  draw_walls_and_floors();

  // draw edges
  draw_edges();


  // draw detectors (for now, check active status as well)

  // TODO: This should  happen somewhere else
  // check if all detectors are active
  let all_active = true;
  for (let d of detectors)
  {
    d.check_color();
    if(!d.correct)
      all_active = false;
  }
  next_level_available = all_active;

  draw_detectors(); // these eventually will take current_level as well?

  draw_light_sources(); // these eventually will take current_level as well?

  // draw cursor viz if mouse cursor isn't in a wall
  draw_mouse_illumination(mx, my);

  // Draw glass (Extra tiles to draw would happen here?)
  strokeWeight(4);
  stroke(90, 50);
  for (x = 0 ; x < gridWidth; ++x)
  {
    for (y = 0; y < gridHeight; ++y)
    {
      if (grid[x][y].grid_type == GLASS_WALL || grid[x][y].grid_type == GLASS_WALL_TOGGLABLE)
        square(x * gridSize, y * gridSize, gridSize);
    }
  }



  // Render any text that we have to
  textSize(gridSize - 2);
  fill(font_color);
  text("level: " + difficulty_level, 0 + GRID_HALF, gridSize - 4);
  text("high score: " + highest_score, 0 + GRID_HALF, gridHeight * gridSize - 4);

  if (mouse_over_menu)
    fill(255);
  
  text("menu", (gridWidth - 3) * gridSize, gridSize - 4);

  if (next_level_available)
  {
    next_button_bob_timer += (deltaTime / 100);
    if (next_button_bob_timer > TWO_PI)
      next_button_bob_timer = 0;

    if (over_next_level)
      fill(255)
    else
      fill(font_color);
    text("next", (gridWidth - 3) * gridSize, gridHeight * gridSize - 4 - sin(next_button_bob_timer));
  }

  if (saveFade > 0)
  {
    saveFade -= 0.1;
    fill(255, saveFade * 255);
    rect(0, 0, gameWidth, gameHeight);
  }

  if (show_tutorial)
    tutorial();

  if (show_menu)
    draw_menu();

}

function do_intro()
{
  blendMode(ADD);
  let random_cols = [color(255, 0, 0), color(0, 255, 0), color(0, 0, 255)];
  if (intro_timer < 2500)
  {
    intro_timer += deltaTime;
    if (intro_timer < 2300)
      fill(0);
    else
    {
      fill(255);
    }
    rect(0, 0, width, height);
    stroke(255, random(80));
    let xrand = random(width);
    let yrand = random(height - 100);
    // line (xrand, yrand, xrand + random(10) - 5, yrand + random(200) + 80);
    noStroke();
    fill(random(random_cols), random(50));
    textSize(72);
    textAlign(CENTER, CENTER);
    text("a tw game", 0, 0, width, height + (intro_timer * random(3, 7) % 800) - 400);
    strokeWeight(2);
    blendMode(MULTIPLY);
    stroke(0);
    fill(240);
    text("a tw game", 0, 0, width, height);
  }
  else
  {
    blendMode(BLEND);
    textAlign(LEFT, BASELINE);
    game_state = STATE_NEW_RANDOM_GAME;
  }
}

function do_level_transition_out()
{
  // FADING IN/OUT STATE STUFF
  // global fade should start at 0
  if (globalFade < 1)
  {
    globalFade += 0.5;
  }
  fill(48, 48, 48, globalFade * 255);
  rect(0, 0, gameWidth, gameHeight);
  if (globalFade >= 1)
  {
    ++difficulty_level;
    random_level();
    make_edges();
    game_state = STATE_RANDOM_LEVEL_TRANSITION_IN
  }
}

function do_level_transition_in()
{
  globalFade -= 0.5;
  fill(48, 48, 48, globalFade * 255);
  rect(0, 0, gameWidth, gameHeight);
  if (globalFade < 0)
  {
    game_state = STATE_GAME;
  }

}

//////// DRAWING 
// DRAW gets called EVERY frame, this is the MAIN GAME LOOP
function draw() {
  //if (game_state === STATE_GAME)
  switch (game_state)
  {
    case STATE_NEW_RANDOM_GAME:
      setup_random_game();
      break;
    case STATE_INTRO:
      do_intro();
      break;
    case STATE_GAME:
      do_game();
      break;
    case STATE_RANDOM_LEVEL_TRANSITION_OUT:
      do_level_transition_out();
      break;
    case STATE_RANDOM_LEVEL_TRANSITION_IN:
      do_level_transition_in();
      break;
  }
}

function draw_menu()
{
  fill(37, 210);
  stroke(12);
  strokeWeight(2);
  rect((gridWidth - 8) * gridSize, 0, gridWidth * gridSize, gridSize * menu_height);

  // display menu options
  var i = 0;
  stroke(0);
  strokeWeight(2);
  for (let m of main_menu_options)
  {
    if (main_menu_selected === i)
      fill(253);
    else
      fill(157);
    if (i === 1 || i === 4 || i == 6 || i == 7)
      fill(28);
    text(m, (gridWidth - 7) * gridSize, (i + 1) * gridSize );
    ++i;
  }
}

function draw_walls_and_floors()
{
  let lvl = current_level;
  strokeWeight(1);
  for (x = 0 ; x < lvl.xsize; ++x)
  {
    for (y = 0; y < lvl.ysize; ++y)
    {
      let odd = ((x + y) % 2 === 0);
      let p = (lvl.grid[x][y].permenant); // This should be programmed into the level

      if (!lvl.grid[x][y].exist)  // EMPTY SPACES
      {

        if (lvl.grid[x][y].grid_type == FLOOR_EMPTY)
        {
          stroke(25, 25, 25);
          fill(13, 13, 13);
          square(x * gridSize, y * gridSize, gridSize);
        }

        else if (lvl.grid[x][y].grid_type == FLOOR_BUILDABLE)
        {
          if (lvl.grid[x][y].fade > 0)
            lvl.grid[x][y].fade -= 0.1;
          stroke(empty_space_outline);
          // lerp between the empty fill color and the color of whatever
          // solid thing will be there
          fill(lerpColor( odd ? empty_space_fill : empty_space_2_fill, 
                          p ? solid_wall_permenant_fill : solid_wall_fill, 
                          lvl.grid[x][y].fade));

          square(x * gridSize, y * gridSize, gridSize);
        }
      }

      else if (lvl.grid[x][y].exist)  // SOLID WALLS
      {
        if (lvl.grid[x][y].fade < 1)
        lvl.grid[x][y].fade += 0.1;
        stroke(solid_wall_outline);
        // exact same thing as above!
        fill(lerpColor( odd ? empty_space_fill : empty_space_2_fill, 
                        p ? solid_wall_permenant_fill : solid_wall_fill, 
                        lvl.grid[x][y].fade));
        square(x * gridSize , y * gridSize, gridSize);
      }

      if (lvl.grid[x][y].grid_type == GLASS_WALL_TOGGLABLE || lvl.grid[x][y] == GLASS_WALL)
      {
        strokeWeight(2);
        stroke(170, 170, 170);
        if (lvl.grid[x][y].permenant)
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
}

function draw_edges()
{
  strokeWeight(3);
  for (let e of edges)
  {
    stroke(edge_circle_color);
    ellipse(e.sx, e.sy, 3, 3);
    ellipse(e.ex, e.ey, 3, 3);

    stroke(edge_color);
    line(e.sx, e.sy, e.ex, e.ey);
  }
}

function draw_detectors()
{
  for (let d of detectors)
  {
    d.draw_this();
  }
}

function draw_light_sources()
{
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
}

function draw_mouse_illumination(mx, my)
{
  if (show_menu)
    return; // not if menu is active
  let grid = current_level.grid;
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

//////// LEVEL SAVE / LOAD
function load_level(level_string)
{
  // create a new level
  var level_string_index = 4;
  let new_lvl = new level();

  // read xsize
  let xsize = level_string.substring(0, 2);
  let ysize = level_string.substring(2, 4);
  new_lvl.xsize = xsize;
  new_lvl.ysize = ysize;
  new_lvl.initialize_grid();

  // read 1 char to switch random save vs editor save.
  let read_mode = level_string.charAt(level_string_index++);
  if (read_mode === "r")  // random mode
  {
    // read 2 char for current level
    // switch game state to RANDOM_GAME
    let cl = parseInt(level_string.substring(level_string_index, level_string_index + 2));
    level_string_index += 2;
    // cl is now the saved difficulty
    difficulty_level = cl;
  }
  else if (read_mode === "e")
  {
    // reserved for edited single map game
  }

  for (var x = 0; x < xsize; ++x)
  {
    for (var y = 0; y < ysize; ++y)
    {
      let cur_ch = level_string.charAt(level_string_index++);
      //set_grid(new_lvl.grid, x, y, parseInt(cur_ch));
      switch (parseInt(cur_ch))
      {
        case DETECTOR_TILE: 
          set_grid(new_lvl.grid, x, y, DETECTOR_TILE); 
          break;
        case FLOOR_EMPTY: 
          set_grid(new_lvl.grid, x, y, FLOOR_EMPTY); 
          break;      
        case FLOOR_BUILDABLE: 
          set_grid(new_lvl.grid, x, y, FLOOR_BUILDABLE); 
          break;     
        case FLOOR_BUILT:
          set_grid(new_lvl.grid, x, y, FLOOR_BUILDABLE); 
          new_lvl.grid[x][y].exist = true;
          break; 
        case PERMENANT_WALL: 
          set_grid(new_lvl.grid, x, y, PERMENANT_WALL); 
          break;
        case GLASS_WALL: 
          set_grid(new_lvl.grid, x, y, GLASS_WALL); 
          break;
        case GLASS_WALL_TOGGLABLE: 
          set_grid(new_lvl.grid, x, y, GLASS_WALL_TOGGLABLE); 
          break;
      }
    }
  }

  let loaded_lights = [];
  // next two char are number of light sources
  let n_lights = level_string.substring(level_string_index, level_string_index + 2);
  level_string_index += 2;
  for (var light_i = 0; light_i < n_lights; ++light_i)
  {
    // read two chars x pos
    let lx = parseInt(level_string.substring(level_string_index, level_string_index + 2));
    level_string_index += 2;
    // read two chars y pos
    let ly = parseInt(level_string.substring(level_string_index, level_string_index + 2));
    level_string_index += 2;
    // read one char light color
    let lc = parseInt(level_string.charAt(level_string_index++));
    let la = level_string.charAt(level_string_index++);
    // read one char active
    let light_col = detector_colors[lc];
    let new_light = new light_source(lx, ly, la == "1", red(light_col), green(light_col), blue(light_col));
    loaded_lights.push(new_light);
  }

  let loaded_detectors = [];
  let n_d = level_string.substring(level_string_index, level_string_index + 2);
  level_string_index += 2;
  for (var d_i = 0; d_i < n_d; ++d_i)
  {
    // read two chars x pos
    let dx = parseInt(level_string.substring(level_string_index, level_string_index + 2));
    level_string_index += 2;

    // read two chars y pos
    let dy = parseInt(level_string.substring(level_string_index, level_string_index + 2));
    level_string_index += 2;
     
    // read one char light colors
    let dc = parseInt(level_string.charAt(level_string_index++));

    // read one char active
    let detector_col = detector_colors[dc];
    let new_detector = new detector(dx, dy, red(detector_col), green(detector_col), blue(detector_col));
    loaded_detectors.push(new_detector);

  }

  detectors = loaded_detectors;
  lightsources = loaded_lights;
  current_level = new_lvl;
  make_edges();
}

//////// LEVEL EDIT

//////// RANDOM GAME MODE
function setup_random_game()
{
  difficulty_level = 1;
  init_light_sources();
  // check if we have a saved game
  let save = getItem("savedgame");
  if (!save)
    random_level();
  else
    load_level(save);
  highest_score = getItem("high_random_score")
  if (highest_score == null)
    highest_score = 0;
  game_state = STATE_GAME;
}

function random_level()
{
  let new_random_level = new level();
  new_random_level.xsize = gridWidth;
  new_random_level.ysize = gridHeight;
  new_random_level.initialize_grid();

  initializeGrid(new_random_level.grid);
  turn_lights_off();
  init_random_detectors(new_random_level, difficulty_to_detector_amount());
  make_some_floor_unbuildable(new_random_level.grid, difficulty_to_shrink_amount());
  shrink_lights();
  current_level = new_random_level;
  // save current level
  current_level.save_level(lightsources, detectors);
  make_edges();
  // check if we're a high score, if we are, store us
  let high_score = getItem("high_random_score");
  if (high_score == null || high_score < difficulty_level)
  {
    storeItem("high_random_score", difficulty_level);
    highest_score = difficulty_level;
  }
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

function init_random_detectors(lvl, num_detectors)
{
  // initialize a randomized array of detectors
  detectors = []

  for (i = 0 ; i < num_detectors; ++ i)
  {
    let col_val = [0, 255];
    let r = random(col_val);
    let g = random(col_val);
    let b = random(col_val);
    if (num_detectors == 1)
    {
      r = 255;
      g = 255;
      b = 255;
    }

    let xp;
    let yp;
    let gtype;

    // only allow to pop-up on empty or buildable floor
    while (true)
    {

      xp = int(random(2, lvl.xsize - 2));
      yp = int(random(2, lvl.ysize - 2));
      gtype = lvl.grid[xp][yp].grid_type;
      // Don't let us pop-up on lightsources as well, since it is
      // hard to notice
      for (let l of lightsources)
      {
        if (l.x == xp && l.y == yp)
        {
          gtype = -1;
          break;
        }
      }
      // Don't pop up next to detectors that are already on the
      // ground
      for (xoff = - 1; xoff <= 1; ++xoff)
      {
        for (yoff = -1; yoff <= 1; ++yoff)
        {
          if (xoff === 0 && yoff === 0)
            continue;
          if (lvl.grid[xp + xoff][yp + yoff].grid_type == DETECTOR_TILE)
          {
            gtype = -1;
            break;
          }
        }
      }

      if (gtype == FLOOR_EMPTY || gtype == FLOOR_BUILDABLE) // places we can build
        break;
    }

    let d = new detector(xp, yp, r, g, b);
    detectors.push(d);
    set_grid(lvl.grid, xp, yp, DETECTOR_TILE);
  }
}

function difficulty_to_detector_amount()
{
  // map from a difficulty level to number of detectors
  // on the field
  if (difficulty_level <= 3)
    return difficulty_level;
  if (difficulty_level <= 6)
    return difficulty_level - 1;
  if (difficulty_level <= 9)
    return difficulty_level - 3;
  return int(2 + difficulty_level / 2);
}

function difficulty_to_shrink_amount()
{
  if (difficulty_level <= 3)
    return 1;
  if (difficulty_level <= 6)
    return 2;
  if (difficulty_level <= 9)
    return 3;
  if (difficulty_level <= 15)
    return 4;
  if (difficulty_level <= 20)
    return 5;
  return 6;
}

function shrink_lights()
{
  // if the lights have ended up outside the boundaries of the new shrink
  let shrunk = difficulty_to_shrink_amount();
  for (let l of lightsources)
  {
    if (l.x < shrunk)
      l.x = shrunk;
    if (l.x > gridWidth - shrunk - 1)
      l.x = gridWidth - shrunk - 1;
    if (l.y < shrunk)
      l.y = shrunk;
    if (l.y > gridHeight - shrunk - 1)
      l.y = gridHeight - shrunk - 1;
  }
}

function make_some_floor_unbuildable(which_grid, shrink_amount)
{
  // bring in some floor from the outside
  for (x = 1 ; x < gridWidth - 1; ++x)
  {
    for (y = 1; y < gridHeight - 1; ++y)
    {
      if (x < shrink_amount || gridWidth - 1 < x + shrink_amount || y < shrink_amount || gridHeight - 1 < y + shrink_amount)
      {
        set_grid(which_grid, x, y, FLOOR_EMPTY);
      }
    }
  }
  for (i = 0; i < difficulty_level; ++i)
  {
    set_grid(which_grid, int(random(1, gridWidth - 2)), int(random(1, gridHeight - 2)), FLOOR_EMPTY);
  }
}

function reset_grid(lvl)
{
  for (x = 0 ; x < lvl.xsize; ++x)
  {
    for (y = 0; y < lvl.ysize; ++ y)
    {
      if (lvl.grid[x][y].grid_type == FLOOR_BUILDABLE && lvl.grid[x][y].exist)
      {
        lvl.grid[x][y].exist = false;
      }
    }
  }
}

//////// EDGE ALG
function make_edges()
{
  let grid = current_level.grid;
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

//////// LIGHT / SHADOW ALGS
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

function turn_lights_off()
{
  for (let l of lightsources)
  {
    l.active = false;
  }
}

//////// OTHER
function resetStuff()
{
  reset_grid(current_level);
  turn_lights_off();
  make_edges();
}

function tutorial()
{
  waiting_for_tutorial_unclick = true;
  let mx = mouseX, my = mouseY;
  let over_btn = false;
  if ((width / 2) - 30 < mx && mx < (width / 2) + 10 && 380 <= my && my <= 420)
    over_btn = true;

  // shadow
  noStroke();
  fill (0, 70);
  rect(gridSize * 2 + GRID_HALF, gridSize * 2 + GRID_HALF, width - gridSize * 4, height - gridSize * 4);


  stroke(190, 190, 190);
  fill (35);
  strokeWeight(4);
  rect(gridSize * 2, gridSize * 2, width - gridSize * 4, height - gridSize * 4);
  fill(72);
  rect(gridSize * 3, gridSize * 3, width - gridSize * 6, height - gridSize * 6);


  let s = "Tutorial\n" +
   "Use left click to make walls, right click to remove walls.\n" +
    "Drag lights with left mouse, switch with right.\n"+
    "Detectors are colored circles. Match colors to fill them.\n"+
    "Fill all the detectors to advance.";
  strokeWeight(1);
  fill(180);
  stroke(130);
  textSize(28);
  textAlign(CENTER, CENTER);
  text(s, gridSize * 3, gridSize * 3, width - gridSize * 6, height - gridSize * 6);

  if (over_btn)
  {
    noStroke();
    fill(255, 20);
    ellipse((width / 2) - 10, 400, 60, 60);

    fill(255, 255, 255);
  }
  else 
  {
    fill(0, 0, 0);
  }
  stroke(130);
  strokeWeight(2);
  text("OK", (width / 2) - 10, 400);

  textAlign(LEFT, BASELINE);
  if (mouseIsPressed && over_btn)
  {
    show_tutorial = false;
  }

}

// use getItem and storeItem to locally store data

// LEVEL FORMAT
// we want this to end up as a STRING so we can save it easily
// locally\

// first, specify the size of the grid
// The level will be a grid, with each cell defined to a TILE_TYPE
// followed by a list of detectors
//  - [x, y, r, g, b]
// followed by a list of lights
// - [x, y, r, g, b]
