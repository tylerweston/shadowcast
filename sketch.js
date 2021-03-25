/*
addjko

ONLY draw the walls that the light makes visible

- we could make filters for different colored lights by having
  r,g, and b edges, run the detection thing three times
  , solid walls would just exist in all three color planes?
- why doesn't the game work with different dimensions?
  - THIS has to do with the autoloading! We need a way to resize
    the grid if a loaded game is of a different size, then we'll
    center the 
- Maybe try removing the lightsources from the grid and see if it's fun like that?
  - the extra constraints might be necessary though?
- difficulty balance in progression
- editor
- tiles: glass unfillable, glass fillable

- different tutorial for editor
- better way to navigate around the game - more main menu kinda thing
- then the menu at top right will include an "exit to main menu" option
- MAIN MENU
- deactivate menu highlighting when menu is open
- new game 
  = random
  - load level (paste a string)
  -

- move levels to base64 so they don't look so obvious and long
- encapsulate state in a better way
  - right now it is kind of spread out and a bit icky how it is all implemented
  - collect and fix that stuff up
- change game grid size - allow this to be customized - this might be implemented?
  - just need some bits to resize themselves automatically
- make it work on mobile? 
  - single click to toggle light on and off, drag to move it  
  - fix webpage
- Game Modes:
    - This will involve a main menu of some sort!
  - timer, countdown and every solution gets you some more time
    - speed mode
  - more points for using less walls!
    - "MINIMALIST" mode
  - mode where you can only activate one light at a time?
    - press a button to check your solution, it is either wrong or right!
  -  
- When we "shrink" lights onto the board, they may get placed on top of a
  detector, which makes them unmovable! make sure this doesn't happen!
- Make sure all detectors aren't the same color!
- make R, G, B keys toggle their lights in random mode
- give editor "LOAD" and "PLAY" functions, so individual levels will be used in there?
- fix allowing tiles to be made on detectors!
- don't allow holes to spawn on lights?
- allow option to reset high score somewhere
*/

// global variables

let edges = [];

let lightsources = [];
let detectors = [];

let gridSize = 30;

let globalFade = 0;
let saveFade = 0;

let highest_score_changed = 0;
let highest_score_display_timer = 0;

const GRID_HALF = gridSize / 2;
const GRID_THIRD = gridSize / 3;

const gameHeight = 600;
const gameWidth = 900;
const uiHeight = 200;

let gridWidth = gameWidth / gridSize;
let gridHeight = gameHeight / gridSize;


let current_level = undefined;  // The currently loaded level, there can be only one!
let difficulty_level = 1;
let all_detectors_active = false; // this is for random games (?) this should go into state stuff?
let highest_score;

let new_total;
let new_total_fade;
let new_scoring_system = 0;
let points_for_current_grid = 0;

// this stuff should all be refactored into state machine stuff
// TODO: Bunch of little bits of state to clean up
let display_editor = false;
let editor_available = true;
let show_intro = false;         // <--------------- intro flag
let show_tutorial = false;
let show_menu = false;
let main_menu_accept_input = false;
let show_mouse_illumination = false;
let mouse_over_menu = false;
let over_btn = false;
let next_level_available = false;
let over_next_level = false;

let hovered_item = undefined;
let selected_item = undefined;

let editor_level_name = "";

let ghandler;

// mouse events
const MOUSE_EVENT_MOVE = 0;
const MOUSE_EVENT_CLICK = 1;
const MOUSE_EVENT_UNCLICK = 3;
const MOUSE_EVENT_ENTER_REGION = 4;
const MOUSE_EVENT_EXIT_REGION = 5;

let global_mouse_handler = undefined;

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
let buildable_outline;
let buildable_fill;
let buildable_2_fill;
let empty_outline;
let empty_fill;
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
const STATE_GAME = 2;
const STATE_SETUP_EDITOR = 10;
const STATE_EDITOR = 3;
const STATE_OPTIONS = 4;
const STATE_ABOUT = 5;
const STATE_LOADLEVEL = 6;
const STATE_NEW_RANDOM_GAME = 7;
const STATE_RANDOM_LEVEL_TRANSITION_OUT = 8;
const STATE_RANDOM_LEVEL_TRANSITION_IN = 9;

const STATE_PREPARE_TUTORIAL = 11;
const STATE_TUTORIAL = 12;
const STATE_TEARDOWN_TUTORIAL = 13;


let game_state = STATE_SETUP;

// play mode  // will this be rolled into state machine stuff??
const GAMEMODE_RANDOM = 0;
const GAMEMODE_LEVELS = 1;

let intro_timer = 0;
let next_button_bob_timer = 0;

let grid_obj_id = 0;

const TOTAL_EDITOR_ITEMS = 14;

//////// CLASSES
class mouse_region
{
  constructor(x1, y1, x2, y2)
  {
    this.x1 = x1;
    this.y1 = y1;
    this.x2 = x2;
    this.y2 = y2;
    this.events = {};
    this.mouse_over = false;
    this.enabled = true;
  }

  update_mouse_over(_mx, _my)
  {
    let old_mouse_over = this.mouse_over;
    this.mouse_over = this.mouse_in(_mx, _my);
    return !(old_mouse_over == this.mouse_over);
  }

  mouse_in(_mx, _my)
  {
    return (this.x1 <= _mx && _mx <= this.x2 && this.y1 <= _my && _my <= this.y2);
  }
}

class mouse_handler
{
  constructor()
  {
    // each REGISTERED REGION keeps track of it's own events!
    // so a REGION is REGISTERED with any/all events
    // this REGION will be a KEY into a MAP
    // should some of these events be states?
    this.mx = mouseX;
    this.my = mouseY;

    this.oldmx = this.mx;
    this.oldmy = this.my;

    this.mouse_position_updated = true;

    this.registered_regions = {};

    this.clicked = mouseIsPressed;  // just in case the mouse is being held down when game is started? test this
  }
  get_targetx()
  {
    return int(this.mx / gridSize);
  }

  get_targety()
  {
    return int(this.my / gridSize);
  }

  run_callbacks(event_key)
  {
    // we should iterate over this backwards and the FIRST region
    // we encounter that can handle this event does, this way we can
    // stack regions
    for (const [key, region] of Object.entries(this.registered_regions)) {
      if (!region.enabled)
        continue;
      if (region.mouse_over && event_key in region.events)
      {
          region.events[event_key]();
      }
    }
  }

  register_region(region_name, mouse_region)
  {
    this.registered_regions[region_name] = mouse_region;
    if (mouse_region.mouse_in(this.mx, this.my))
    {
      this.registered_regions[region_name].region_active = true;
    }
    else{
      this.registered_regions[region_name].region_active = false;
    }
  }

  update_region(region_name, mouse_region)
  {
    // should we write this or just use register_region above?
  }

  disable_region(region_name)
  {
    this.registered_regions[region_name].enabled = false;
  }

  enable_region(region_name)
  {
    this.registered_regions[region_name].enabled = true;
  }

  handle()
  {
    // check 
    this.mouse_position_updated = false;
    this.mx = mouseX;
    this.my = mouseY;

    if (this.mx != this.oldmx || this.my != this.oldmy)
    {
      // mouse move event, run the callbacks
      this.run_callbacks(MOUSE_EVENT_MOVE);
      this.oldmx = this.mx;
      this.oldmy = this.my;
      this.mouse_position_updated = true;
    }

    if (this.mouse_position_updated)
    {
      // update_active_regions returns true if it's updated a region
      this.update_mouse_overs(this.mx, this.my);
    }

    if (mouseIsPressed && mouseButton === LEFT && !this.clicked)
    {
      // we are the leading edge of a down click
      this.clicked = true;
      this.run_callbacks(MOUSE_EVENT_CLICK);

    }
    else if (!mouseIsPressed && mouseButton === LEFT && this.clicked)
    {
      // this is the fallinge edge of a click
      this.clicked = false;
      this.run_callbacks(MOUSE_EVENT_UNCLICK);
    }
  }

  update_mouse_overs(_mx, _my)
  {
    // check all registered regions and figure out which the mouse
    // is over
    for (const [key, value] of Object.entries(this.registered_regions)) {
      if (value.update_mouse_over(_mx, _my))  // returns TRUE if it's updated mouse over
      {
        if (value.mouse_over)
        {
          // this region is active now, which means it used to not be
          // so we entered the region
          if (MOUSE_EVENT_ENTER_REGION in value.events)
            value.events[MOUSE_EVENT_ENTER_REGION]();
        }
        else
        {
          if (MOUSE_EVENT_EXIT_REGION in value.events)
            value.events[MOUSE_EVENT_EXIT_REGION]();
        }
      }
    }
  }

  remove_region(region_name)
  {
    // remove a single event for region_name
    // delete returns true if the key existed, false if it doesn't
    delete(this.registered_regions[region_name]);
  }
}

class level
{
  constructor()
  {
    // we don't know the size until we load the level data!
    this.xsize = 0;
    this.ysize = 0;
    this.grid = [];
    //this.grid_buttons = [];
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
    let level_string = this.generate_save_string(lights, detectors);
    saveFade = 1;
    storeItem("savedgame", level_string);
  }

  copy_save_string_to_clipboard(lights, detectors)
  {
    let t = this.generate_save_string(lights, detectors);
    copyToClipboard(t);
  }

  generate_save_string(lights, detectors)
  {
    // todo: Move this out of here! Saving should be the job
    // of something else, not the level class?
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

    let new_score_string = "";
    if (new_scoring_system < 10)
      new_score_string = "   " + String(new_scoring_system);
    else if (new_scoring_system < 100)
      new_score_string = "  " + String(new_scoring_system);
    else if (new_scoring_system < 1000)
      new_score_string = " " + String(new_scoring_system);
    else if (new_scoring_system < 10000)
      new_score_string = String(new_score_string);
    
    level_string += new_score_string;


    let cur_char = "";
    for (var x = 0; x < this.xsize; ++x)
    {
      for (var y = 0; y < this.ysize; ++y)
      {
        switch (this.grid[x][y].grid_type)
        {
          case DETECTOR_TILE: cur_char = "5"; break;
          case FLOOR_EMPTY: cur_char = "0"; break;      
          case FLOOR_BUILDABLE: cur_char = "1"; break;
          case FLOOR_BUILT: cur_char = "6"; break;     
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

    return level_string;
  }
}

class editor_handler
{
  // this class handles all of the gameplay for the core game
  // include dragging lights, activating/deactivating lights, building walls
  // and removing walls
  constructor()
  {
    this.DRAWING_MODE = 0;
    this.ERASING_MODE = 1;
    this.DRAGGING_LIGHT_MODE = 2;
    this.selected_light = undefined;
    this.dragging_mode = undefined;
    this.editor_mode = this.DRAWING_MODE;
    this.game_region = new mouse_region(0, 0, width, height);
    this.game_region.events[MOUSE_EVENT_MOVE] = () => { this.moved();};
    this.game_region.events[MOUSE_EVENT_CLICK] = () => { this.clicked();};
    this.game_region.events[MOUSE_EVENT_UNCLICK] = () => { this.unclicked();};
    this.is_dragging = false;
    global_mouse_handler.register_region("ehandler", this.game_region);
    this.start_drag_x = undefined;
    this.start_drag_y = undefined;
    this.end_drag_x = undefined;
    this.end_drag_y = undefined;
  }

  disable()
  {
    global_mouse_handler.disable_region("ehandler");
  }

  enable()
  {
    global_mouse_handler.enable_region("ehandler");
  }

  moved()
  {
    // // only do something if we're dragging!
    // if (!this.is_dragging)
    //   return;

    let tx = global_mouse_handler.get_targetx();
    let ty = global_mouse_handler.get_targety();

    if (ty === gridHeight - 1)
    {
      if (tx <= TOTAL_EDITOR_ITEMS)
      {
        hovered_item = tx;
      }
    }

    if (tx < 1 || gridWidth - 2 < tx || ty < 1 || gridHeight - 2 < ty)
    {
      this.is_dragging = false;
      return;
    }

    // everything after here only happens if we're actually
    // holding down a mouse button
    if (!this.is_dragging)
      return;
    
    if (this.dragging_mode === this.DRAWING_MODE)
    {
      this.try_build_wall(tx, ty);
    }
    else if (this.dragging_mode === this.ERASING_MODE)
    {
      // this will erase the area back to buildable floor!
      this.try_erase_wall(tx, ty);
    }
    else if (this.dragging_mode === this.DRAGGING_LIGHT_MODE)
    {
      // we can drag lights OR detectors in this mode!
      let tx = global_mouse_handler.get_targetx();
      let ty = global_mouse_handler.get_targety();
      if (tx != this.start_drag_x || ty != this.start_drag_y)
      {
        // Here, we have a starting drag position and an ending drag
        // position. Eventually we will check a straight line here to
        // make sure they are all unblocked to make this not cheesable
        // for now, just make sure ending position is good
        // console.log("Dragging light " + this.selected_light);
        this.end_drag_x = tx;
        this.end_drag_y = ty;
        if (this.can_drag(this.start_drag_x, this.start_drag_y, this.end_drag_x, this.end_drag_y))
        {
          lightsources[this.selected_light].move(this.end_drag_x, this.end_drag_y);
        }
        else
        {
          // we've bumped into something, drop our light!
          this.dragging_mode = undefined;
          this.is_dragging = false;
          this.selected_light = undefined;
        }
          // console.log("Dragged from " + this.start_drag_x + "," +
        // this.start_drag_y + " to " + this.end_drag_x + "," + this.end_drag_y);
        this.start_drag_x = tx;
        this.start_drag_y = ty;
      }
    }
    
  }

  refresh_grid()
  {
    make_edges();
    update_all_light_viz_polys();
    points_for_current_grid = count_score();
  }
  

  can_drag(sx, sy, ex, ey)
  {
    // all that matters is that the 
    // return true if you can drag a light from sx,sy to ex,ey
    if (is_target_a_light(ex, ey))
      return false;

    if (current_level.grid[ex][ey].grid_type === FLOOR_BUILDABLE ||
      current_level.grid[ex][ey].grid_type === FLOOR_EMPTY)
      return true;
    
    // TODO: CHECK ALL grids along this line and make sure they are ALL
    // passable!
    return false;
  }

  try_build_wall(_x, _y)
  {
    if (_x <= 0 || gridWidth - 1 <= _x || _y <= 0 || gridHeight - 1 <= _y)
      return;

    switch(selected_item)
    {
      case 11:
      // PERMENANT_WALL
        set_grid(current_level.grid, _x, _y, PERMENANT_WALL);
        this.refresh_grid();
        break;
      case 12:
      // GLASS_WALL
        set_grid(current_level.grid, _x, _y, GLASS_WALL);
        this.refresh_grid();
        break;
      case 13:
      // FLOOR_BUILDABLE
        set_grid(current_level.grid, _x, _y, FLOOR_BUILDABLE);
        this.refresh_grid();
        break;
      case 14:
      // FLOOR_EMPTY
        set_grid(current_level.grid, _x, _y, FLOOR_EMPTY);
        this.refresh_grid();
        break;

    }
  }

  try_erase_wall(_x, _y)
  {
    if (_x <= 1 || _x >= gridWidth - 2 || _y <= 1 || _y >= gridHeight - 2)
      return;
    // TODO: If we've erased a light or detector, we have
    // to remove it from our list
    set_grid(current_level.grid, _x, _y, FLOOR_EMPTY);
    this.refresh_grid();
  }

  clicked()
  {
    // this is the same thing as assuming something created later will deal with
    // this mouse input instead of us
    if (show_menu || show_tutorial)  // hack for now to not draw stuff on grid while menu is open
      return;
    let px = global_mouse_handler.mx;
    let py = global_mouse_handler.my;

    let tx = global_mouse_handler.get_targetx();
    let ty = global_mouse_handler.get_targety();

    if (ty === gridHeight - 1 && tx <= TOTAL_EDITOR_ITEMS)
    {
      selected_item = tx;
    }

    if (tx <= 0 || gridWidth - 1 <= tx || ty <= 0 || gridHeight - 1 <= ty)
      return; // all other clicks we only care about in game area

    let gl = get_selected_light(px, py);
    if (gl !== undefined)
    {
      this.is_dragging = true;
      this.selected_light = gl;
      this.dragging_mode = this.DRAGGING_LIGHT_MODE;
      this.start_drag_x = global_mouse_handler.get_targetx();
      this.start_drag_y = global_mouse_handler.get_targety();
      return;
    }

    // IF we have a lightsource or detector as our selected item
    // we want to add it to the grid here!!

    if (this.editor_mode === this.DRAWING_MODE)
    {
      // if we have selected a light or detector right now,
      // we just put a single item on the map AND DON'T
      // enter drag mode
      if (selected_item <= 10)
      {

        if (selected_item <= 7)
        {
          // we're a detector with color equivalent to
          // detector_colors[selected_item]
          let _dc = detector_colors[selected_item];
          let d = new detector(tx, ty, red(_dc), green(_dc), blue(_dc));
          detectors.push(d);
          set_grid(current_level.grid, tx, ty, DETECTOR_TILE);
        }
        else
        {
          // we're a light source
          //  8 = r
          //  9 = g
          // 10 = b
          let _r = (selected_item == 8) ? 255 : 0;
          let _g = (selected_item == 9) ? 255 : 0;
          let _b = (selected_item == 10) ? 255 : 0;
          let _lc = new light_source(tx, ty, false, _r, _g, _b);
          lightsources.push(_lc);
          update_all_light_viz_polys();
        }
      }
      else
      {
        // enter building mode
        this.dragging_mode = this.DRAWING_MODE;
        this.is_dragging = true;
        this.try_build_wall(tx, ty);
      }
    }
    else if (this.editor_mode === this.ERASING_MODE)
    {
      // IF we have the ERASE TOOL selected
      // erasing mode
      this.dragging_mode = this.ERASING_MODE;
      this.is_dragging = true;
      this.try_erase_wall(tx, ty);
    }

  }

  unclicked()
  {
    this.is_dragging = false;
  }

}

class gameplay_handler
{
  // this class handles all of the gameplay for the core game
  // include dragging lights, activating/deactivating lights, building walls
  // and removing walls
  constructor()
  {
    this.DRAWING_MODE = 0;
    this.ERASING_MODE = 1;
    this.DRAGGING_LIGHT_MODE = 2;
    this.selected_light = undefined;
    this.dragging_mode = undefined;
    this.game_region = new mouse_region(0, 0, width, height);
    this.game_region.events[MOUSE_EVENT_MOVE] = () => { this.moved();};
    this.game_region.events[MOUSE_EVENT_CLICK] = () => { this.clicked();};
    this.game_region.events[MOUSE_EVENT_UNCLICK] = () => { this.unclicked();};
    this.is_dragging = false;
    global_mouse_handler.register_region("ghandler", this.game_region);
    this.start_drag_x = undefined;
    this.start_drag_y = undefined;
    this.end_drag_x = undefined;
    this.end_drag_y = undefined;
  }

  disable()
  {
    global_mouse_handler.disable_region("ghandler");
  }

  enable()
  {
    global_mouse_handler.enable_region("ghandler");
  }

  moved()
  {
    // only do something if we're dragging!
    if (!this.is_dragging)
      return;



    let tx = global_mouse_handler.get_targetx();
    let ty = global_mouse_handler.get_targety();
    
    if (tx < 0 || gridWidth - 1 < tx || ty < 0 || gridHeight - 1 < ty)
     return;

    if (this.dragging_mode === this.DRAWING_MODE)
    {
      this.try_build_wall(tx, ty);

    }
    else if (this.dragging_mode === this.ERASING_MODE)
    {
      this.try_erase_wall(tx, ty);
    }
    else if (this.dragging_mode === this.DRAGGING_LIGHT_MODE)
    {
      let tx = global_mouse_handler.get_targetx();
      let ty = global_mouse_handler.get_targety();
      if (tx != this.start_drag_x || ty != this.start_drag_y)
      {
        // Here, we have a starting drag position and an ending drag
        // position. Eventually we will check a straight line here to
        // make sure they are all unblocked to make this not cheesable
        // for now, just make sure ending position is good
        // console.log("Dragging light " + this.selected_light);
        this.end_drag_x = tx;
        this.end_drag_y = ty;
        if (this.can_drag(this.start_drag_x, this.start_drag_y, this.end_drag_x, this.end_drag_y))
        {
          lightsources[this.selected_light].move(this.end_drag_x, this.end_drag_y);
        }
        else
        {
          // we've bumped into something, drop our light!
          this.dragging_mode = undefined;
          this.is_dragging = false;
          this.selected_light = undefined;
        }
          // console.log("Dragged from " + this.start_drag_x + "," +
        // this.start_drag_y + " to " + this.end_drag_x + "," + this.end_drag_y);
        this.start_drag_x = tx;
        this.start_drag_y = ty;
      }
    }
    
  }

  refresh_grid()
  {

    make_edges();
    update_all_light_viz_polys();
    points_for_current_grid = count_score();
  }
  

  can_drag(sx, sy, ex, ey)
  {
    // return true if you can drag a light from sx,sy to ex,ey
    if (is_target_a_light(ex, ey))
      return false;

    if (current_level.grid[ex][ey].grid_type === FLOOR_BUILDABLE)
      return true;
    
    // TODO: CHECK ALL grids along this line and make sure they are ALL
    // passable!
    return false;
  }

  try_build_wall(_x, _y)
  {
    if (is_target_a_light(_x, _y))
      return;
    if (current_level.grid[_x][_y].grid_type === FLOOR_BUILDABLE)
    {
      set_grid(current_level.grid, _x, _y, FLOOR_BUILT);
      // make_edges();
      // points_for_current_grid = count_score();
      this.refresh_grid();
    }
  }

  try_erase_wall(_x, _y)
  {
    if (is_target_a_light(_x, _y))
      return;
    if (current_level.grid[_x][_y].grid_type === FLOOR_BUILT)
    {
      set_grid(current_level.grid, _x, _y, FLOOR_BUILDABLE);
      // make_edges();
      // points_for_current_grid = count_score();
      this.refresh_grid();
    }
  }

  clicked()
  {
    // this is the same thing as assuming something created later will deal with
    // this mouse input instead of us
    if (show_menu || show_tutorial)  // hack for now to not draw stuff on grid while menu is open
      return;
    let px = global_mouse_handler.mx;
    let py = global_mouse_handler.my;
    let gl = get_selected_light(px, py);
    if (gl !== undefined)
    {
      this.is_dragging = true;
      this.selected_light = gl;
      this.dragging_mode = this.DRAGGING_LIGHT_MODE;
      this.start_drag_x = global_mouse_handler.get_targetx();
      this.start_drag_y = global_mouse_handler.get_targety();
      return;
    }

    let tx = global_mouse_handler.get_targetx();
    let ty = global_mouse_handler.get_targety();
    if (current_level.grid[tx][ty].grid_type === FLOOR_BUILDABLE)
    {
      // building mode
      this.dragging_mode = this.DRAWING_MODE;
      this.is_dragging = true;
      this.try_build_wall(tx, ty);
    }
    else if (current_level.grid[tx][ty].grid_type === FLOOR_BUILT)
    {
      // erasing mode
      this.dragging_mode = this.ERASING_MODE;
      this.is_dragging = true;
      this.try_erase_wall(tx, ty);
    }
  }

  unclicked()
  {
    this.is_dragging = false;
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
          r += l.r; r = r <= 255 ? r : 255;
          g += l.g; g = g <= 255 ? g : 255;
          b += l.b; b = b <= 255 ? b : 255;
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
    this.selected = false;
    this.click_started_on_light = false;

    // a lightsource has an ON COLOR, OFF COLOR, and LIGHT COLOR, and those values are 
    // made brighter by some predetermined amount if they are selected
    // one red, one green, one blue
    // specify a base color and do all color calculations off that for now!
    // could add custom light stuff later
    this.r = r;
    this.g = g;
    this.b = b;
    this.name = "";

    this.anim_cycle = random(TWO_PI);
    this.moved = false;

    this.dragged = false;
    this.viz_polygon = [];


    // This might not be the best way to do this but it could work for now?!
    // move this stuff to some color data structure
    this.c = color(r, g, b);
    this.shadow_color = color(r, g, b, 55);

    this.dark_light = color(r / 2.5, g / 2.5, b / 2.5, 80);
    this.med_light = color(r / 2, g / 2, b / 2, 110);

    this.selected_on_outside = color(max(120, r), max(120, g), max(120, b));
    this.selected_on_inside = color(max(100, r - 50), max(100, g - 50), max(100, b - 50));

    this.selected_off_outside = color(max(80, r - 70), max(80, g - 70), max(80, b - 70));
    this.selected_off_inside = color(max(50, r - 110), max(50, g - 110), max(50, b - 110));

    this.dark_outside = color(max(70, r / 2), max(70, g / 2), max(70, b / 2));
    this.dark_inside = color(max(60, r / 2 - 10), max(60, g / 2 - 10), max(60, b / 2 - 10));

    this.light_outside = color(max(100, r), max(100, g), max(100, b));
    this.light_inside = color(max(80, r - 30), max(80, g - 30), max(80, b - 30));

    this.ls_region = new mouse_region(x * gridSize, y * gridSize, 
                                      x * gridSize + gridSize, y*gridSize + gridSize);
    this.ls_region.events[MOUSE_EVENT_CLICK] = () => this.click_light();
    this.ls_region.events[MOUSE_EVENT_UNCLICK] = () => this.unclick_light();

    this.ls_region.events[MOUSE_EVENT_ENTER_REGION] = () => { this.selected = true; };
    this.ls_region.events[MOUSE_EVENT_EXIT_REGION] = () => this.check_leave_grid();
    this.name = color_to_string(this.c);
    global_mouse_handler.register_region(this.name, this.ls_region);

  }

  get_new_viz_poly()
  {
    let cx = this.x * gridSize + gridSize / 2;
    let cy = this.y * gridSize + gridSize / 2;
    this.viz_polygon = get_visible_polygon(cx, cy, 10);
    remove_duplicate_viz_points(this.viz_polygon);
  }

  check_leave_grid()
  {
    this.selected = false;
  }

  move(x, y)
  {
    this.x = x;
    this.y = y;
    this.moved = true;
    this.ls_region.x1 = x * gridSize;
    this.ls_region.y1 = y * gridSize;
    this.ls_region.x2 = (x + 1) * gridSize;
    this.ls_region.y2 = (y + 1) * gridSize;
    global_mouse_handler.register_region(this.name, this.ls_region);
    this.get_new_viz_poly();
  }

  click_light()
  {
    this.moved = false;
    this.dragged = true;
  }

  unclick_light()
  {
    if (!this.moved)
      this.switch_active();
    this.dragged = false;
  }

  switch_active()
  {
    this.active = !this.active;
  }

  draw_light()
  {
    if (this.active && this.viz_polygon.length > 0)
    {
      blendMode(ADD);
      let cx = this.x * gridSize + gridSize / 2;
      let cy = this.y * gridSize + gridSize / 2;
      noStroke();
      fill(this.shadow_color);

      // let viz_polygon = get_visible_polygon(cx, cy, 10);
      // remove_duplicate_viz_points(viz_polygon);
      // if (viz_polygon && viz_polygon.length > 1)
      // {
      beginShape();
      vertex(cx, cy);
      for (i = 0; i < this.viz_polygon.length; ++ i)
        vertex(this.viz_polygon[i].x, this.viz_polygon[i].y);
      vertex(this.viz_polygon[0].x, this.viz_polygon[0].y);
      endShape();
      // }  
      blendMode(BLEND);
    }
  }

  draw_this()
  {
    if (this.anim_cycle >= TWO_PI)
      this.anim_cycle = 0;
    this.anim_cycle += deltaTime / 500;
    if (this.active)
    {
      blendMode(ADD);
      noStroke();
      fill(this.dark_light);
      let animsin = sin(this.anim_cycle) * 4;
      let animcos = cos(this.anim_cycle) * 4;
      ellipse(this.x * gridSize + (gridSize / 2), this.y * gridSize + (gridSize/2), gridSize * 3 + animsin , gridSize * 3 + animsin);
  
      fill(this.med_light);
      ellipse(this.x * gridSize + (gridSize / 2), this.y * gridSize + (gridSize/2), gridSize * 2 + animcos, gridSize * 2 + animcos);
      blendMode(BLEND);
    }
  
    strokeWeight(2);
    if (this.selected)
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
    // todo: clean this up, this information should
    // be stored in something associated with grid_type
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
  // setup is called once at the start of the game
  createCanvas(gameWidth, gameHeight);
  initialize_colors();

  global_mouse_handler = new mouse_handler();

  make_menu();

  // uncomment this to nuke bad saved game
  // storeItem("savedgame", null);

  if (show_intro)
    game_state = STATE_INTRO;
  else
    game_state = STATE_NEW_RANDOM_GAME;

}

function initialize_colors() {
  solid_wall_fill = color(160, 160, 170);
  solid_wall_permenant_fill = color(200, 200, 210);
  solid_wall_outline = color(120, 120, 120);

  buildable_fill = color(33, 33, 33);
  buildable_2_fill = color(37, 37, 37);
  buildable_outline = color(43, 43, 43);

  empty_outline = color(25, 25, 25);
  empty_fill = color(13, 13, 13);

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

//////// MAIN MENU
function handle_menu_selection(menu_index)
{
  if (!main_menu_accept_input)
    return;
  // "save", "load", "reset grid", "reset game", "editor", "tutorial", "options", "about"
  switch (menu_index)
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
      if (editor_available)
        game_state = STATE_SETUP_EDITOR;
      break;
    case 5:
      // tutorial
      game_state = STATE_PREPARE_TUTORIAL;
      break;
    case 6:
      // options
      break;
    case 7:
      // about
      break;
  }
}

function launch_menu()
{
  global_mouse_handler.disable_region("main_menu");
  enable_menu();
  show_menu = true;
}

function enable_menu()
{
  global_mouse_handler.enable_region("opened_main_menu");
  show_menu = true;
  for (let m of main_menu_options)
  {
    global_mouse_handler.enable_region(m);
  }
}

function disable_menu()
{
  main_menu_accept_input = false;
  global_mouse_handler.disable_region("opened_main_menu");
  show_menu = false;
  for (let m of main_menu_options)
  {
    global_mouse_handler.disable_region(m);
  }
}

function close_menu()
{
  disable_menu();
  global_mouse_handler.enable_region("main_menu");
  show_menu = false;
}

function make_menu()
{
  // the top right menu button
  menu_region = new mouse_region((gridWidth - 3) * gridSize, 0,
                                  gridWidth * gridSize, gridSize);
  menu_region.events[MOUSE_EVENT_CLICK] = () => { launch_menu(); };
  menu_region.events[MOUSE_EVENT_ENTER_REGION] = () => {mouse_over_menu = true;};
  menu_region.events[MOUSE_EVENT_EXIT_REGION] = () => {mouse_over_menu = false;};
  global_mouse_handler.register_region("main_menu", menu_region);
  // initialize the menu handler and region stuff
  
  open_menu_region = new mouse_region((gridWidth - 8) * gridSize, 0, gridWidth * gridSize, menu_height * gridSize);
  open_menu_region.events[MOUSE_EVENT_EXIT_REGION] = () => {close_menu();};
  open_menu_region.events[MOUSE_EVENT_UNCLICK] = () => {main_menu_accept_input = true;}
  global_mouse_handler.register_region("opened_main_menu", open_menu_region);
  
  // it will be a region that will contain sub-regions for each menu option?
  let i = 0;
  for (let m of main_menu_options)
  {
    let reg = new mouse_region((gridWidth - 8) * gridSize, i * gridSize, gridSize * gridWidth, (i + 1) * gridSize);
    reg.events[MOUSE_EVENT_CLICK] = () => handle_menu_selection(int(global_mouse_handler.my / gridSize));
    reg.events[MOUSE_EVENT_ENTER_REGION] = () => {main_menu_selected = int(global_mouse_handler.my / gridSize);};
    global_mouse_handler.register_region(m, reg);
    ++i;
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
    current_level.copy_save_string_to_clipboard(lightsources, detectors);
  } else if (key === 'l') {
    load_level(getItem("savedgame"));
  } 
  else if (key === 'q') {
    storeItem("high_random_score", null);
  }
  else if (key === 'e') {
    let lvl_txt = copyFromClipboard();
    console.log("level: " + lvl_txt);
    load_level(lvl_txt);
  }
  

}

//////// MOUSE HANDLING

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
    case FLOOR_BUILT:
      which_grid[x][y].grid_type = FLOOR_BUILT;
      which_grid[x][y].exist = true;
      which_grid[x][y].permenant = false;
      which_grid[x][y].unpassable = true;
      which_grid[x][y].fade = 0;
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
    case GLASS_WALL:
      which_grid[x][y].grid_type = GLASS_WALL;
      which_grid[x][y].exist = false;
      which_grid[x][y].permenant = true;
      which_grid[x][y].unpassable = true;
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
  let old_next_level_available = next_level_available;
  next_level_available = all_active;

  // change in status of ability to go to next level
  if (old_next_level_available != next_level_available)
  {
    if (next_level_available)
    {
      global_mouse_handler.enable_region("next_btn");

    }
    else
    {
      global_mouse_handler.disable_region("next_btn");
    }
  }

  // these eventually will take current_level as well?
  draw_detectors(); 
  
  // these eventually will take current_level as well?
  draw_light_sources(); 

  // // draw cursor viz if mouse cursor isn't in a wall
  // draw_mouse_illumination(mx, my);

  // Draw glass (Extra tiles to draw would happen here?)
  draw_glass();

  // Render any text that we have to
  textSize(gridSize - 2);
  fill(font_color);
  text("level: " + difficulty_level, 0 + GRID_HALF, gridSize - 4);

  if (highest_score_changed > 0)
  {
    fill(lerpColor(font_color, color(255, 255, 255), highest_score_changed));
    highest_score_changed -= deltaTime / 5000;
  }

  // bottom left will either say your CURRENT SCORE
  // the HIGH SCORE
  // or display the points you JUST GOT

  if (highest_score_display_timer > 0)
  {
    highest_score_display_timer -= deltaTime / 1000;
    text("high score: " + highest_score, 0 + GRID_HALF, gridHeight * gridSize - 4);
  }
  else
  {
    text("score: " + new_scoring_system + " points: " + points_for_current_grid, 0 + GRID_HALF, gridHeight * gridSize - 4);
  }

  if (new_total_fade > 0)
  {
    new_total_fade -= deltaTime / 1500;
    strokeWeight(2);
    stroke(37);
    fill(255);
    let xfadepos = ((highest_score_display_timer > 0) ? 5 : 4);
    xfadepos *= gridSize;
    text("+" + new_total, xfadepos, gridHeight * gridSize - 4 + (new_total_fade * 10));
  }


  fill(font_color);
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

  if (show_menu)      // disable game? Layer mouse listeners
    draw_menu();

}

function do_intro()
{
  blendMode(ADD);
  let random_cols = [color(255, 0, 0), color(0, 255, 0), color(0, 0, 255)];
  if (intro_timer < 3000)
  {
    intro_timer += deltaTime;
    if (intro_timer < 2000)
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
    // if (intro_timer < 1500)
    text("a tw game", 0, 0, width, height + (intro_timer * random(1, 6) % 800) - 400);
    // else
    // text("addico", 0, 0, width, height + (intro_timer * random(3, 7) % 800) - 400);
    strokeWeight(2);
    blendMode(MULTIPLY);
    stroke(0);
    fill(240);
    // if (intro_timer < 1500)
    text("a tw game", 0, 0, width, height);
    // else
    // {
    //   text("addjko", 0, 0, width, height);
    // }
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
    globalFade += deltaTime / 200;
  }
  fill(48, 48, 48, globalFade * 255);
  rect(0, 0, gameWidth, gameHeight);
  if (globalFade >= 1)
  {
    // this is what is going to change around depending on what
    // game mode we are in.

    // count our score here
    new_total = count_score();
    new_total_fade = 1;
    new_scoring_system += new_total > 0 ? new_total : 0;
    ++difficulty_level;
    random_level();
    make_edges();
    points_for_current_grid = count_score();
    game_state = STATE_RANDOM_LEVEL_TRANSITION_IN
  }
}

function do_level_transition_in()
{
  globalFade -= deltaTime / 500;
  fill(48, 48, 48, globalFade * 255);
  rect(0, 0, gameWidth, gameHeight);
  if (globalFade < 0)
  {
    game_state = STATE_GAME;
  }

}

function prepare_tutorial()
{
  // eventually tutorial will be something that happens in game
  let ok_button = new mouse_region((width / 2) - 30, 460, (width / 2) + 10, 500);
  ok_button.events[MOUSE_EVENT_CLICK] = ()=>{ game_state = STATE_TEARDOWN_TUTORIAL; };
  ok_button.events[MOUSE_EVENT_ENTER_REGION] = ()=>{ over_btn = true; };
  ok_button.events[MOUSE_EVENT_EXIT_REGION] = ()=>{ over_btn = false; };
  global_mouse_handler.register_region("ok_btn", ok_button);
  show_menu = false;
  show_tutorial = true;
  game_state = STATE_TUTORIAL;
  do_game();  // do one iteration to erase menu image
}

function tear_down_tutorial()
{
  show_tutorial = false;
  global_mouse_handler.remove_region("ok_btn");
  game_state = STATE_GAME;
}

function tutorial()
{
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
   "Use left click to draw or erase walls.\n" +
   "Click once on lights to activate / deactivate,\n" +
   "or drag them to move them.\n" +
   "Fill in all the detectors to proceed.";
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
    ellipse((width / 2) - 10, 480, 60, 60);

    fill(255, 255, 255);
  }
  else 
  {
    fill(0, 0, 0);
  }
  stroke(130);
  strokeWeight(2);
  text("OK", (width / 2) - 10, 480);

  textAlign(LEFT, BASELINE);
}

//////// DRAWING 
// DRAW gets called EVERY frame, this is the MAIN GAME LOOP
function draw() {
  global_mouse_handler.handle();  // do mouse stuff
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
  case STATE_SETUP_EDITOR:
    do_setup_editor();
    break;
  case STATE_EDITOR:
    do_editor();
    break;
  case STATE_PREPARE_TUTORIAL:
    prepare_tutorial();
    break;
  case STATE_TUTORIAL:
    tutorial();
    break;
  case STATE_TEARDOWN_TUTORIAL:
    tear_down_tutorial();
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

    if (i === 1 || (i === 4 && !editor_available) || i == 6 || i == 7)
      fill(28);
    text(m, (gridWidth - 7) * gridSize, (i + 1) * gridSize );
    ++i;
  }
}

function draw_glass()
{
  let lvl = current_level;
  noFill();
  strokeWeight(4);
  stroke(90, 50);
  for (x = 0 ; x < lvl.xsize; ++x)
  {
    for (y = 0; y < lvl.ysize; ++y)
    {
      if (lvl.grid[x][y].grid_type == GLASS_WALL || lvl.grid[x][y].grid_type == GLASS_WALL_TOGGLABLE)
        square(x * gridSize, y * gridSize, gridSize);
    }
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
          // stroke(25, 25, 25);
          // fill(13, 13, 13);
          stroke(empty_outline);
          fill(empty_fill);
          square(x * gridSize, y * gridSize, gridSize);
        }

        else if (lvl.grid[x][y].grid_type == FLOOR_BUILDABLE)
        {
          if (lvl.grid[x][y].fade > 0)
            lvl.grid[x][y].fade -= 0.1;
          stroke(buildable_outline);
          // lerp between the empty fill color and the color of whatever
          // solid thing will be there
          fill(lerpColor( odd ? buildable_fill : buildable_2_fill, 
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
        fill(lerpColor( odd ? buildable_fill : buildable_2_fill, 
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
  gridWidth = xsize;
  gridHeight = ysize;

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
    let current_new_score = parseInt(level_string.substring(level_string_index, level_string_index + 4));
    level_string_index += 4;
    new_scoring_system = current_new_score;
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
      set_grid(new_lvl.grid, x, y, parseInt(cur_ch));
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

  // if this is a random game, calculate the new board score
  points_for_current_grid = count_score();
  make_edges();
  update_all_light_viz_polys();
}

//////// LEVEL EDIT

function do_setup_editor()
{
  // setup editor handler
  let ehandler = new editor_handler();

  // ok, we need a new level
  editor_lvl = new level();
  editor_lvl.xsize = gridWidth;
  editor_lvl.ysize = gridHeight;
  editor_lvl.initialize_grid();
  initializeGrid(editor_lvl.grid);
  current_level = editor_lvl;

  // clear light sources
  lightsources = [];

  // clear detectors
  detectors = [];

  make_edges();

  // make sure game handler isn't running any more
  ghandler.disable();

  // when we're done settin up
  game_state = STATE_EDITOR;
}

function do_editor()
{
  let grid = current_level.grid;

  // draw base grid (walls + floors)
  draw_walls_and_floors();

  // draw edges
  draw_edges();

  draw_detectors(); // these eventually will take current_level as well?

  draw_light_sources(); // these eventually will take current_level as well?


  // Draw glass (Extra tiles to draw would happen here?)
  draw_glass();

  let all_active = true;
  for (let d of detectors)
  {
    d.check_color();
    if(!d.correct)
      all_active = false;
  }

  // draw editor UI components
  draw_editor_ui();

  strokeWeight(4);
  stroke(90, 50);
  // Render any text that we have to
  textSize(gridSize - 2);
  fill(font_color);
  text("level: " + editor_level_name, 0 + GRID_HALF, gridSize - 4);

  fill(font_color);
  if (mouse_over_menu)
    fill(255);
  
  text("menu", (gridWidth - 3) * gridSize, gridSize - 4);

  if (show_tutorial)
    tutorial(); // this can be the editor tutorial

  if (show_menu)
    draw_menu();

}

function draw_editor_ui()
{
  let i = 0;
  for (let c of detector_colors)
  {
    draw_detector_at_grid_spot(i++, gridHeight - 1, c);
  }
  draw_light_at_grid_spot(i++, gridHeight - 1, color(255, 0, 0));
  draw_light_at_grid_spot(i++, gridHeight - 1, color(0, 255, 0));
  draw_light_at_grid_spot(i++, gridHeight - 1, color(0, 0, 255));

  draw_map_tiles(11, gridHeight - 1);

  // highlight selected item
  if (hovered_item !== undefined)
  {
    strokeWeight(3);
    noFill();
    stroke(255, 255, 0, 125);
    square(gridSize * hovered_item, (gridHeight - 1) * gridSize, gridSize);
  }

  if (selected_item !== undefined)
  {
    strokeWeight(3);
    noFill();
    stroke(255, 0, 0, 125);
    square(gridSize * selected_item, (gridHeight - 1) * gridSize, gridSize);
  }

}

function draw_detector_at_grid_spot(_x, _y, _c)
{
  noStroke();
  fill(37);
  square(_x * gridSize, _y * gridSize, gridSize);

  let default_size = 0.8;
  strokeWeight(7);
  if (red(_c) == 0 && green(_c) == 0 && blue(_c) == 0)
    stroke(170);
  else
    stroke(4);
  ellipse(_x * gridSize + GRID_HALF, _y * gridSize + GRID_HALF, gridSize * default_size, gridSize * default_size);

  strokeWeight(5);
  stroke(_c);
  noFill();
  ellipse(_x * gridSize + GRID_HALF, _y * gridSize + GRID_HALF, gridSize * default_size, gridSize * default_size);
  
}

function draw_light_at_grid_spot(_x, _y, _c)
{
  stroke(_c);
  fill(_c);
  ellipse(_x * gridSize + (gridSize / 2), _y * gridSize + (gridSize / 2), gridSize * 0.85, gridSize * 0.85);

}

function draw_map_tiles(_x, _y)
{
  // draw the tiles starting at _x and _y position
  strokeWeight(1);
  // first permenant wall
  stroke(solid_wall_outline);
  fill(solid_wall_permenant_fill);
  square(_x * gridSize, _y * gridSize, gridSize);
  ++_x;

  // glass wall
  strokeWeight(4);
  stroke(90, 50);
  fill(buildable_fill);
  square(_x * gridSize, _y * gridSize, gridSize);
  ++_x;

  // buildable space
  strokeWeight(1);
  stroke(buildable_outline);
  fill(buildable_fill);
  square(_x * gridSize, _y * gridSize, gridSize);
  ++_x;

  // empty space
  stroke(empty_outline);
  fill(empty_fill);
  square(_x * gridSize, _y * gridSize, gridSize);
  ++_x;

}

//////// RANDOM GAME MODE
function setup_random_game()
{
  ghandler = new gameplay_handler();
  // next level button, will start hidden and disabled
  let next_region = new mouse_region((gridWidth - 3) * gridSize, (gridHeight - 1) * gridSize, gridWidth * gridSize, gridHeight * gridSize);
  next_region.events[MOUSE_EVENT_CLICK] = () => { game_state = STATE_RANDOM_LEVEL_TRANSITION_OUT; };
  next_region.events[MOUSE_EVENT_ENTER_REGION] = () => { over_next_level = true; };
  next_region.events[MOUSE_EVENT_EXIT_REGION] = () => { over_next_level = false; };
  next_region.enabled = false;
  global_mouse_handler.register_region("next_btn", next_region);

  difficulty_level = 1;
  new_scoring_system = 0;
  init_light_sources();
  // check if we have a saved game
  let saved_g = getItem("savedgame");
  if (!saved_g)
    random_level();
  else
    load_level(saved_g);
  highest_score = getItem("high_random_score")
  if (highest_score == null)
    highest_score = 0;
  highest_score_display_timer = 5;
  game_state = STATE_GAME;
}

function tear_down_random_game()
{
  global_mouse_handler.disable("ghandler"); // remove entirely at some point!
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
  update_all_light_viz_polys();
  // check if we're a high score, if we are, store us
  let high_score = getItem("high_random_score");
  if (high_score == null || high_score < new_scoring_system)
  {
    storeItem("high_random_score", new_scoring_system);
    highest_score = new_scoring_system;
    highest_score_changed = 1;
    highest_score_display_timer = 10;
  }
  points_for_current_grid = count_score();
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

  // CMY lights
  // let source = new light_source(gridHeight - 5, 5, false, 0, 255, 255);
  // lightsources.push(source);
  // source = new light_source(gridWidth - 5, gridHeight - 5, false, 255, 0, 255);
  // lightsources.push(source);

  // source = new light_source(5, gridWidth / 2, false, 255, 255, 0);
  // lightsources.push(source);
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
  // TODO: We need to make sure this doesn't place a lightsource on top of 
  // a detector or in an empty space where it can't move.
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
  if (difficulty_level > 5)
  {
    for (i = 0; i < difficulty_level - 3; ++i)
    {
      // TODO: Make sure this doesn't happen on one of the lights?
      // or say it's a feature, not a bug
      set_grid(which_grid, int(random(1, gridWidth - 2)), int(random(1, gridHeight - 2)), FLOOR_EMPTY);
    }
  }
}

function reset_grid(lvl)
{
  for (x = 0 ; x < lvl.xsize; ++x)
  {
    for (y = 0; y < lvl.ysize; ++ y)
    {
      // TODO: Other stuff to reset?
      if (lvl.grid[x][y].grid_type == FLOOR_BUILT)
      {
        set_grid(lvl.grid, x, y, FLOOR_BUILDABLE);
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

function is_target_a_light(xpos, ypos)
{
  for (let l of lightsources)
  {
    if (l.x === xpos && l.y === ypos)
      return true;
  } 
  return false;
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

function update_all_light_viz_polys()
{
  for (let l of lightsources)
  {
    l.get_new_viz_poly();
  }
}

//////// OTHER
function resetStuff()
{
  // reset the grid (ie, all walls marked built (buildable + exist), will be changed to just buildable)
  reset_grid(current_level);
  points_for_current_grid = count_score();
  turn_lights_off();
  make_edges();
}

function count_score()
{
  let score = difficulty_level + detectors.length - count_walls_used(current_level);
  return score >= 0 ? score : 0;
}

function count_walls_used(lvl)
{
  let total_seen = 0;
  for (let x = 1; x < lvl.xsize - 1; ++x)
  {
    for (let y = 1; y < lvl.ysize - 1; ++y)
    {
      // if (lvl.grid[x][y].exist)
      if (lvl.grid[x][y].grid_type === FLOOR_BUILT)
        ++total_seen;
    }
  }
  return total_seen;
}

function color_to_string(c)
{
  let r = 0, g = 0, b = 0;
  r = red(c);
  g = green(c);
  b = blue(c);
  if ( r === 255 && g === 0 && b === 0)
  {
    return "red";
  }
  if ( r === 0 && g === 255 && b === 0)
  {
    return "green";
  }
  if ( r === 0 && g === 0 && b === 255)
  {
    return "blue";
  }
  if ( r === 255 && g === 255 && b === 255)
  {
    return "white";
  }
  if ( r === 0 && g === 0 & b === 0)
  {
    return "black";
  }
  if ( r === 255 && g === 255 & b === 0)
  {
    return "yellow";
  }
  if ( r === 255 && g === 0 & b === 255)
  {
    return "magenta";
  }
  if ( r === 0 && g === 255 && b === 255)
  {
    return "cyan";
  }
}

// from https://stackoverflow.com/questions/33855641/copy-output-of-a-javascript-variable-to-the-clipboard
function copyToClipboard(text) {
  var dummy = document.createElement("textarea");
  // to avoid breaking orgain page when copying more words
  // cant copy when adding below this code
  // dummy.style.display = 'none'
  document.body.appendChild(dummy);
  //Be careful if you use texarea. setAttribute('value', value), which works with "input" does not work with "textarea". – Eduard
  dummy.value = text;
  dummy.select();
  document.execCommand("copy");
  document.body.removeChild(dummy);
}

function get_level_and_load()
{
  let prompt = window.prompt("Enter level code:","");

}


function copyFromClipboard() {
  var dummy = document.createElement("textarea");
  // to avoid breaking orgain page when copying more words
  // cant copy when adding below this code
  // dummy.style.display = 'none'
  document.body.appendChild(dummy);
  dummy.focus();
  document.execCommand("paste");
  let rval = dummy.textContent;
  document.body.removeChild(dummy);
  console.log("Value in copy from clipboard: " + rval);
  return rval;
}
