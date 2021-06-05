/*
spectro
tyler weston, 2021

Controls:
r, g, b: switch corresponding light
space: go to next level (if available)

Important:
- ARE YOU SURE? box that returns TRUE or FALSE for reset
- Sound juice
- option screen
  - make button class? or checkbox class?
- Detect if the user is on mobile and make the grid smaller so it
  is easier to choose/move lights, etc.
    - This now requires a few more fixes! Work on this, ie.
      mobile mode vs PC mode

Visual fixes:
- decrease the offset around checking for shadow edges?
- Main menu should be better lined up... looks OK with new font
- Better light turning on/off juice (maybe a solid color screen flash
  or something like that? Maybe with the sound it will be OK. The 
  current particles don't look great, maybe they just need to be tweake
  a bit?)  
- change flooring from automatically tiled to user adjustable?
  - keep SOME random floor options, but fluff them up! IE, sometime 
  the floor can be a swirl or some lines or something like that? Write
  some different tiling algorithms that we can use! Then, when drawing
  the tiles instead of using ODD use a switch based on if they are floor 1
  or floor 2 type tiles? 
- some animation in the background or something like that?
- Font size may be strange on different size devices? Yes, this needs
  to scale based on the size of the device. ALSO, we may want to make
  the squares a bit larger since playing on a cellphone is awkward!

Bugs:
- There is still something a bit funky with clicking near the top right?
  maybe something to do with the menu buttons? Sometimes it seems like a
  particle will spawn or a menu option will be selected even when the menu
  screen isn't open
- don't allow holes to spawn on lights?
- undo is a bit broken still
- something broken with just setting is_dragging false to eat mouse input
  between level transitions, look at a better way to do this.
- mouse state can get wacky between level transitions sometimes
  - in a timed game, when we automatically transition to the next level
    we want to change the mouse state so that we aren't in drawing mode
    anymore!
- When we "shrink" lights onto the board, they may get placed on top of a
  detector, which makes them unmovable! make sure this doesn't happen!
- Reposition OK button in About menu

QOL improvements:
- detect size of parent div and base the game on that so on different
  screens, devices, etc, it will work the same way?!
  - we'd base grid size 
- Make sure all detectors aren't the same color!
- fix webpage
- timer game should be a bit easier to play
  ONLY draw the walls that the light makes visible?
- The "easy" way to do this DOESN'T look good, either figure
  out a different way to do this or keep it the same for now
- difficulty balance in progression - timer game is too hard?
- screenshots of game

Options:
 - Reset highscores
 - Delete autosave


Refactoring:
- encapsulate state in a better way
  - right now it is kind of spread out and a bit icky how it is all implemented
  - collect and fix that stuff up
- make a button or ui class or something like that that will make creating
  buttons easier. This is the next big job probably!
s
Maybe eventually:
- change game grid size - allow this to be customized - this might be implemented?
  - just need some bits to resize themselves automatically
- Encode levels a bit better than just text strings?
- we could make filters for different colored lights by having
  r,g, and b edges, run the detection thing three times, 
  solid walls would just exist in all three color planes?
- Handle loading gameboards of different size? or just keep everything 
  one size?
- Maybe try removing the lightsources from the grid and see if it's fun like that?
  - the extra constraints might be necessary though?

Editor stuff (Maybe eventually):
- give editor "LOAD" and "PLAY" functions, so individual levels will be used in there?
- Just remove all the editor stuff entirely? or just switch it to another
  unused branch and remove from main?
*/

// global variables

// game version things
const MAJOR_VERSION = 0;
const MINOR_VERSION = 9;

// font
let spectro_font;
let font_size;

// canvas
let cnv;

// TODO: Bunch of little bits of state to clean up
// TODO: The rest of this stuff will be taken care of via some sort of
// button class that needs to be implemented still, so bits of state like
// over_btn will be handled by the button class itself

let show_menu = false;
let top_menu_accept_input = false;
let mouse_over_menu = false;
let over_btn = false; // TODO: Roll into button class or something
let next_level_available = false;
let over_next_level = false;
let over_play_again_btn = false;
let over_main_menu_btn = false;
let over_about_ok_btn = false;

//////// CLASSES
// main game states
class states
{
  static SETUP = 0; // done
  static INTRO = 1; // done
  static MAIN_MENU_SETUP = 2; // done
  static MAIN_MENU = 3; // done
  static MAIN_MENU_TEARDOWN = 4;  // done
  static GAME = 5;  // done
  static SETUP_EDITOR = 6;  // done
  static EDITOR = 7;  // done
  // static LOADLEVEL = 10; // unusued
  static NEW_GAME = 11; // done
  static RANDOM_LEVEL_TRANSITION_OUT = 12;  // done
  static RANDOM_LEVEL_TRANSITION_IN = 13;   // done
  static PREPARE_TUTORIAL = 14; // done
  static TUTORIAL = 15; // done
  static TEARDOWN_TUTORIAL = 16;  // done
  static SETUP_SHOW_TIME_RESULTS = 17;  // done
  static SHOW_TIME_RESULTS = 18;  // done
  static SETUP_OPTIONS = 19;  // done
  static OPTIONS = 8; // done
  static TEARDOWN_OPTIONS = 20; // done
  static SETUP_ABOUT = 21;  // done
  static ABOUT = 9; // done
  static TEARDOWN_ABOUT = 22; // done

  // to do: maybe setup all gui elements in one function
  // at start so we don't need to store if they have been
  // setup or not yet?
  static need_setup_main_menu = true;
  static need_setup_about = true;
  static need_setup_options = true;
  static need_setup_show_time_results = true;
}

class menus
{
// menu options
  static top_menu_choices = ["undo", "redo", "reset grid", "save", "load", "main menu", "reset game", "tutorial"];
  static top_menu_callbacks = [
    () => undo.undo_last_move(),
    () => undo.redo_last_move(),
    () => top_menu_reset_stuff(), 
    () => top_menu_save_level(), 
    () => top_menu_load(), 
    () => top_menu_main_menu(), 
    () => top_menu_reset_game(), 
    () => top_menu_tutorial(), 
  ];
  static top_menu_selected = undefined;
  static top_menu_height = menus.top_menu_choices.length + 1;
  static main_menu_options = ["new game", "continue", "timed game", "options", "about"];
  static main_menu_selected = undefined;
  static main_menu_height = menus.main_menu_options.length + 1;
}

class undo_actions
{
  // undo actions
  static BUILD_WALL = 0;
  static ERASE_WALL = 1;
  static ACTIVATE_LIGHT = 2;
  static DEACTIVATE_LIGHT = 3;
  static MOVE_LIGHT = 4;
}

class undo
{
  static undo_last_move()
  {
    // TO UNDO A MOVE:
    // there is an undo stack
    // an undo stack will be a bunch of undo frames
    // we pop the last undo frame, which will be a list of moves to undo
    // iterate through each undo move in the undo frame and run it's undo
    // option
    // Then, we add the undo frame to the redo stack in case we want to redo 
    // it
    let undo_frame = undo.undo_stack.pop();
    if (!undo_frame)
      return;
    // Iterate over the undo frame in reverse since it is a stack we push
    // moves to, so we want to undo the last added moves first
    for (var i = undo_frame.length - 1; i >= 0; i--) {
      undo_frame[i].undo_move();
    }
    undo.redo_stack.push(undo_frame);
    make_edges();
    update_all_light_viz_polys();
    if (game.current_gamemode === game.GAMEMODE_RANDOM)
      game.points_for_current_grid = count_score();
  }
  
  static redo_last_move()
  {
    // To REDO A MOVE
    // Pop the top frame from the redo stack, iterate thorugh each undo
    // move, run the redo action, and then add the frame to the undo stack
    let redo_frame = undo.redo_stack.pop();
    if (!redo_frame)
      return;
    for (let redo_action of redo_frame)
    {
      redo_action.redo_move();
    }
    undo.undo_stack.push(redo_frame);
    make_edges();
    update_all_light_viz_polys();
    if (game.current_gamemode === game.GAMEMODE_RANDOM)
      game.points_for_current_grid = count_score();
  }
  
  static reset_undo_stacks()
  {
    // clear out undo stacks
    undo.undo_stack.splice(0, undo.undo_stack.length);
    undo.redo_stack.splice(0, undo.redo_stack.length);
    undo.current_undo_frame.splice(0, undo.current_undo_frame.length);
  }
  
  static start_new_undo_frame()
  {
    // console.log("Starting new undo frame");
    // undo.current_undo_frame.splice(0, undo.current_undo_frame.length);
  }
  
  static end_undo_frame()
  {
    if (!undo.current_undo_frame || undo.current_undo_frame.length === 0)
      return;
    undo.undo_stack.push(Array.from(undo.current_undo_frame));
    undo.current_undo_frame.splice(0, undo.current_undo_frame.length);
  }
  
  static add_move_to_undo(move)
  {
    // add a single move object to the current move frame
    undo.current_undo_frame.push(move);
  }

  // TODO: Refactor undo system here
  static undo_stack = []; //done
  static redo_stack = []; // done
  static current_undo_frame = []; //done
}

// data classes, mostly holding vars, enums, etc.
class game
{
  // make the playing field a different size depending if we're on mobile
  static PLAYFIELD_DIM;
  static PC_PLAYFIELD_DIM = 22;
  static MOBILE_PLAYFIELD_DIM = 14;

  // play mode
  static GAMEMODE_RANDOM = 0;
  static GAMEMODE_LEVELS = 1;  // Not implemented yet
  static GAMEMODE_TIME = 2;

  static edges = [];        // done // move to edges class
  static lightsources = []; //done
  static detectors = [];  // done

  static gameHeight;  //done     
  static gameWidth;   //done
  static gridSize;    // done
  static GRID_HALF;   // done
  static GRID_QUARTER;
  static current_dim; // done
  static gridWidth; // done
  static gridHeight;  // done

  static FLASH_SIZE;  // done

  static current_gamemode = undefined;  // done
  
  static game_state = states.SETUP;  //done

  static global_fade = 0; // done
  static save_fade = 0; // done

  static ghandler;
  static ehandler = null;
  static global_mouse_handler = undefined;

  static current_level = undefined;  // The currently loaded level, there can be only one!
  static difficulty_level = 1;

  static global_light_id = 0;

  // random game / score
  static have_saved_game;
  static highest_score; // done
  static new_high_score_juice = 0;  // done
  static highest_score_changed = 0; // done
  static highest_score_display_timer = 0; // done
  static new_total; // done
  static new_total_fade;  // done
  static new_scoring_system = 0;
  static points_for_current_grid = 0;

  // time attack stuff
  static time_remaining = 0;
  static time_gain_per_level = 10;
  static total_time_played = 0;
  static initial_time = 20;
  static high_timer_score = 0;
  static has_new_timer_high_score = false;

  static editor_available = false;
  static show_intro = true;         // <--------------- intro flag
  static show_tutorial = false;

  static intro_timer = 0;
  static next_button_bob_timer = 0;
}

// List of tile types
class tiles
{
  static FLOOR_EMPTY = 0;      // darker, no tiles
  static FLOOR_BUILDABLE = 1;  // tiles, need buildable 1 and 2 for different color floors?
  static FLOOR_BUILT = 6;      // buildable and built on
  static PERMENANT_WALL = 2;
  static GLASS_WALL = 3;
  static GLASS_WALL_TOGGLABLE = 4;
  static DETECTOR_TILE = 5;
}

// color for walls (maybe make this a class?)
class palette
{
  static solid_wall_outline;  // done
  static solid_wall_fill; // done
  static solid_wall_permenant_fill; // done
  static buildable_outline; // done
  static buildable_fill;  // done
  static buildable_2_fill;  // done
  static empty_outline; // done
  static empty_fill;  // done
  static edge_color;  // done
  static edge_circle_color; // done
  static font_color;

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
  static BLACK = 0;
  static BLUE = 1;
  static GREEN = 2;
  static CYAN = 3;
  static RED = 4;
  static MAGENTA = 5;
  static YELLOW = 6;
  static WHITE = 7;

// list of all possible detector colors
  static detector_colors;

}

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

  rescale(scale)
  {
    this.x1 *= scale;
    this.y1 *= scale;
    this.x2 *= scale;
    this.y2 *= scale;
  }
}

class mouse_events
{
  // mouse events
  static MOVE = 0;
  static CLICK = 1;
  static UNCLICK = 2;
  static ENTER_REGION = 3;
  static EXIT_REGION = 4;
  static EVENT_NAMES = ["Move", "Click", "Unclick", "Enter", "Exit"];
}

class mouse_handler
{
  constructor()
  {
    // each REGISTERED REGION keeps track of it's own events!
    // so a REGION is REGISTERED with any/all events
    // this REGION will be a KEY into a MAP
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
    return int(this.mx / game.gridSize);
  }

  get_targety()
  {
    return int(this.my / game.gridSize);
  }

  run_callbacks(event_key)
  {
    // we should iterate over this backwards and the FIRST region
    // we encounter that can handle this event does, this way we can
    // stack regions
    for (const [key, _region] of Object.entries(this.registered_regions)) {
      if (!_region.enabled)
        continue;
      if (_region.mouse_over && event_key in _region.events)
      {
        _region.events[event_key]();
      }
    }
  }

  scale_regions(scale)
  {
    // since our window will always be a square with origin at
    // top left at 0, 0, to rescale, we can just multiply each X and Y
    // coordinate by our new scale amount! ez-pz.
    for (const [key, _region] of Object.entries(this.registered_regions)) {
      _region.rescale(scale);
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
    // IF we're in this region when we're disabled, send a mouseoff event
    // this is useful to clean up buttons, etc. that the mouse is over 
    if (this.registered_regions[region_name].mouse_in(mouseX, mouseY))
    {
      let mouse_exit_event = this.registered_regions[region_name].events[mouse_events.EXIT_REGION]
      if (mouse_exit_event)
        mouse_exit_event();
    }
    this.registered_regions[region_name].enabled = false;
  }

  enable_region(region_name)
  {
    this.registered_regions[region_name].enabled = true;
    this.registered_regions[region_name].update_mouse_over(this.mx, this.my);
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
      this.run_callbacks(mouse_events.MOVE);
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
      this.run_callbacks(mouse_events.CLICK);

    }
    else if (!mouseIsPressed && mouseButton === LEFT && this.clicked)
    {
      // this is the fallinge edge of a click
      this.clicked = false;
      this.run_callbacks(mouse_events.UNCLICK);
    }
  }

  update_mouse_overs(_mx, _my)
  {
    // check all registered regions and figure out which the mouse
    // is over
    for (const [key, _region] of Object.entries(this.registered_regions)) {
      if (!_region.enabled)
        continue;
      if (_region.update_mouse_over(_mx, _my))  // returns TRUE if it's updated mouse over
      {
        if (_region.mouse_over)
        {
          // this region is active now, which means it used to not be
          // so we entered the region
          if (mouse_events.ENTER_REGION in _region.events)
            _region.events[mouse_events.ENTER_REGION]();
        }
        else
        {
          if (mouse_events.EXIT_REGION in _region.events)
            _region.events[mouse_events.EXIT_REGION]();
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

  save_level(lights, detectors, use_juice=false)
  {
    let level_string = this.generate_save_string(lights, detectors);
    if (use_juice)
      game.save_fade = 1;
    storeItem("savedgame", level_string);
  }

  copy_save_string_to_clipboard(lights, detectors)
  {
    let t = this.generate_save_string(lights, detectors);
    show_level_code_and_offer_copy(t);
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
    level_string += (game.difficulty_level < 10 ? "0": "") + String(game.difficulty_level);

    let new_score_string = "";
    if (game.new_scoring_system < 10)
      new_score_string = "   " + String(game.new_scoring_system);
    else if (game.new_scoring_system < 100)
      new_score_string = "  " + String(game.new_scoring_system);
    else if (game.new_scoring_system < 1000)
      new_score_string = " " + String(game.new_scoring_system);
    else if (game.new_scoring_system < 10000)
      new_score_string = String(new_score_string);
    else if (game.new_scoring_system >= 99999)
      new_score_string = "99999";

    level_string += new_score_string;

    let cur_char = "";
    for (var x = 0; x < this.xsize; ++x)
    {
      for (var y = 0; y < this.ysize; ++y)
      {
        switch (this.grid[x][y].grid_type)
        {
          case tiles.DETECTOR_TILE: cur_char = "5"; break;
          case tiles.FLOOR_EMPTY: cur_char = "0"; break;      
          case tiles.FLOOR_BUILDABLE: cur_char = "1"; break;
          case tiles.FLOOR_BUILT: cur_char = "6"; break;     
          case tiles.PERMENANT_WALL: cur_char = "2"; break;
          case tiles.GLASS_WALL: cur_char = "3"; break;
          case tiles.GLASS_WALL_TOGGLABLE: cur_char = "4"; break;
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
    let d_num = (game.detectors.length < 10 ? "0": "") + String(game.detectors.length);
    level_string += d_num
    for (let d of game.detectors)
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
  static TOTAL_EDITOR_ITEMS = 14;
  static hovered_item = undefined;
  static selected_item = undefined;
  static in_erase_mode = false;

  // this class handles all of the editor functionality
  // include dragging lights, activating/deactivating lights, building walls
  // and removing walls
  constructor()
  {
    this.DRAWING_MODE = 0;
    this.ERASING_MODE = 1;
    this.DRAGGING_ITEM_MODE = 2;
    this.selected_light = undefined;
    this.selected_detector = undefined;
    this.dragging_mode = undefined;
    this.editor_mode = this.DRAWING_MODE;
    this.game_region = new mouse_region(0, 0, width, height);
    this.game_region.events[mouse_events.MOVE] = () => { this.moved();};
    this.game_region.events[mouse_events.CLICK] = () => { this.clicked();};
    this.game_region.events[mouse_events.UNCLICK] = () => { this.unclicked();};
    this.is_dragging = false;
    game.global_mouse_handler.register_region("game.ehandler", this.game_region);
    this.start_drag_x = undefined;
    this.start_drag_y = undefined;
    this.end_drag_x = undefined;
    this.end_drag_y = undefined;
    this.num_red_detectors = 0;
    this.num_blue_detectors = 0;
    this.num_green_detectors = 0;
  }

  disable()
  {
    game.global_mouse_handler.disable_region("game.ehandler");
  }

  enable()
  {
    game.global_mouse_handler.enable_region("game.ehandler");
  }

  moved()
  {
    // // only do something if we're dragging!
    // if (!this.is_dragging)
    //   return;

    let tx = game.global_mouse_handler.get_targetx();
    let ty = game.global_mouse_handler.get_targety();

    if (ty === game.gridHeight - 1)
    {
      if (tx <= editor_handler.TOTAL_EDITOR_ITEMS)
      {
        editor_handler.hovered_item = tx;
      }
    }

    if (tx < 1 || game.gridWidth - 2 < tx || ty < 1 || game.gridHeight - 2 < ty)
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
    else if (this.dragging_mode === this.DRAGGING_ITEM_MODE)
    {
      // we can drag lights OR detectors in this mode!
      let tx = game.global_mouse_handler.get_targetx();
      let ty = game.global_mouse_handler.get_targety();
      if (tx != this.start_drag_x || ty != this.start_drag_y)
      {
        this.end_drag_x = tx;
        this.end_drag_y = ty;
        if (this.can_drag(this.start_drag_x, this.start_drag_y, this.end_drag_x, this.end_drag_y))
        {
          if (this.selected_light !== null)
            game.lightsources[this.selected_light].move(this.end_drag_x, this.end_drag_y);
          else if (this.selected_detector !== null)
            game.detectors[this.selected_detector].move(this.end_drag_x, this.end_drag_y);
        }
        else
        {
          // we've bumped into something, drop our light!
          this.dragging_mode = undefined;
          this.is_dragging = false;
          this.selected_light = undefined;
          this.selected_detector = undefined;
        }
        this.start_drag_x = tx;
        this.start_drag_y = ty;
      }
    }
    
  }

  refresh_grid()
  {
    make_edges();
    update_all_light_viz_polys();
    game.points_for_current_grid = count_score();
  }  

  can_drag(sx, sy, ex, ey)
  {
    // all that matters is that the 
    // return true if you can drag a light from sx,sy to ex,ey
    if (is_target_a_light(ex, ey))
      return false;

    if (game.current_level.grid[ex][ey].grid_type === tiles.FLOOR_BUILDABLE ||
      game.current_level.grid[ex][ey].grid_type === tiles.FLOOR_EMPTY)
      return true;
    
    // TODO: CHECK ALL grids along this line and make sure they are ALL
    // passable!
    return false;
  }

  try_build_wall(_x, _y)
  {
    if (_x <= 0 || game.gridWidth - 1 <= _x || _y <= 0 || game.gridHeight - 1 <= _y)
      return;

    switch(editor_handler.selected_item)
    {
      case 11:
      // tiles.PERMENANT_WALL
        set_grid(game.current_level.grid, _x, _y, tiles.PERMENANT_WALL);
        this.refresh_grid();
        break;
      case 12:
      // tiles.GLASS_WALL
        set_grid(game.current_level.grid, _x, _y, tiles.GLASS_WALL);
        this.refresh_grid();
        break;
      case 13:
      // tiles.FLOOR_BUILDABLE
        set_grid(game.current_level.grid, _x, _y, tiles.FLOOR_BUILDABLE);
        this.refresh_grid();
        break;
      case 14:
      // tiles.FLOOR_EMPTY
        set_grid(game.current_level.grid, _x, _y, tiles.FLOOR_EMPTY);
        this.refresh_grid();
        break;

    }
  }

  try_erase_wall(_x, _y)
  {
    if (_x <= 1 || _x >= game.gridWidth - 2 || _y <= 1 || _y >= game.gridHeight - 2)
      return;
    // TODO: If we've erased a light or detector, we have
    // to remove it from our list
    set_grid(game.current_level.grid, _x, _y, tiles.FLOOR_EMPTY);
    this.refresh_grid();
  }

  clicked()
  {
    // this is the same thing as assuming something created later will deal with
    // this mouse input instead of us
    if (show_menu || game.show_tutorial)  // hack for now to not draw stuff on grid while menu is open
      return;
    let px = game.global_mouse_handler.mx;
    let py = game.global_mouse_handler.my;

    let tx = game.global_mouse_handler.get_targetx();
    let ty = game.global_mouse_handler.get_targety();

    if (ty === game.gridHeight - 1 && tx <= editor_handler.TOTAL_EDITOR_ITEMS)
    {
      editor_handler.selected_item = tx;
    }
    if (ty === game.gridHeight - 1 && tx === 15)
    {
      editor_handler.in_erase_mode = !editor_handler.in_erase_mode;
      if (editor_handler.in_erase_mode)
        this.editor_mode = this.ERASING_MODE;
      else
        this.editor_mode = this.DRAWING_MODE;
    }

    if (tx <= 0 || game.gridWidth - 1 <= tx || ty <= 0 || game.gridHeight - 1 <= ty)
      return; // all other clicks we only care about in game area

    if (this.editor_mode != this.ERASING_MODE)
    {
      let gl = get_selected_light(px, py);
      if (gl !== undefined)
      {
        this.is_dragging = true;
        this.selected_light = gl;
        this.selected_detector = null;
        this.dragging_mode = this.DRAGGING_ITEM_MODE;
        this.start_drag_x = tx;
        this.start_drag_y = ty;
        return;
      }

      let dt = get_selected_detector(px, py);
      if (dt !== undefined)
      {
        this.is_dragging = true;
        this.selected_light = null;
        this.selected_detector = dt;
        this.dragging_mode = this.DRAGGING_ITEM_MODE;
        this.start_drag_x = tx;
        this.start_drag_y = ty;
        return;
      }
    }

    // IF we have a lightsource or detector as our selected item
    // we want to add it to the grid here!!

    if (this.editor_mode === this.DRAWING_MODE)
    {
      // if we have selected a light or detector right now,
      // we just put a single item on the map AND DON'T
      // enter drag mode
      if (editor_handler.selected_item <= 10)
      {

        if (editor_handler.selected_item <= 7)
        {
          // we're a detector with color equivalent to
          // palette.detector_colors[editor_handler.selected_item]
          let _dc = palette.detector_colors[editor_handler.selected_item];
          let d = new detector(tx, ty, red(_dc), green(_dc), blue(_dc));
          game.detectors.push(d);
          set_grid(game.current_level.grid, tx, ty, tiles.DETECTOR_TILE);
        }
        else
        {
          // we're a light source
          //  8 = r
          //  9 = g
          // 10 = b
          let _r = (editor_handler.selected_item == 8) ? 255 : 0;
          let _g = (editor_handler.selected_item == 9) ? 255 : 0;
          let _b = (editor_handler.selected_item == 10) ? 255 : 0;
          let _lc = new light_source(tx, ty, false, _r, _g, _b);
          game.lightsources.push(_lc);
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
      let gl = get_selected_light(px, py);
      let dt = get_selected_detector(px, py);
      // IF we have the ERASE TOOL selected
      // erasing mode
      // this.dragging_mode = this.ERASING_MODE;
      // this.is_dragging = true;
      // this.try_erase_wall(tx, ty);
      if (gl !== undefined)
      {
        // erase_lightsource(gl);
        this.erase_lightsource(gl, tx, ty);
      }
      if (dt !== undefined)
      {
        this.erase_detector(dt, tx, ty);
      }
    }

  }

  unclicked()
  {
    this.is_dragging = false;
  }

  erase_detector(_dt, _x, _y)
  {
    set_grid(game.current_level.grid, _x, _y, tiles.FLOOR_BUILDABLE);
    game.detectors.splice(_dt, 1);
  }

  erase_lightsource(_gl, _x, _y)
  {
    game.lightsources.splice(_gl, 1);
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
    this.game_region.events[mouse_events.MOVE] = () => { this.moved();};
    this.game_region.events[mouse_events.CLICK] = () => { this.clicked();};
    this.game_region.events[mouse_events.UNCLICK] = () => { this.unclicked();};
    this.is_dragging = false;
    game.global_mouse_handler.register_region("game.ghandler", this.game_region);
    this.start_drag_x = undefined;
    this.start_drag_y = undefined;
    this.end_drag_x = undefined;
    this.end_drag_y = undefined;
  }

  stop_dragging()
  {
    this.dragging_mode = undefined;
    this.is_dragging = false;
  }

  disable()
  {
    game.global_mouse_handler.disable_region("game.ghandler");
  }

  enable()
  {
    game.global_mouse_handler.enable_region("game.ghandler");
  }

  moved()
  {
    // only do something if we're dragging!
    if (!this.is_dragging)
      return;

    let tx = game.global_mouse_handler.get_targetx();
    let ty = game.global_mouse_handler.get_targety();
    
    if (tx < 0 || game.gridWidth - 1 < tx || ty < 0 || game.gridHeight - 1 < ty)
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
      let tx = game.global_mouse_handler.get_targetx();
      let ty = game.global_mouse_handler.get_targety();
      if (tx != this.start_drag_x || ty != this.start_drag_y)
      {
        this.end_drag_x = tx;
        this.end_drag_y = ty;
        if (this.can_drag(this.start_drag_x, this.start_drag_y, this.end_drag_x, this.end_drag_y))
        {
          let new_undo_action = new undo_move(this.start_drag_x, this.start_drag_y, undo_actions.MOVE_LIGHT,
            this.end_drag_x, this.end_drag_y);
          undo.add_move_to_undo(new_undo_action);
          game.lightsources[this.selected_light].move(this.end_drag_x, this.end_drag_y);
        }
        else
        {
          // we've bumped into something, drop our light!
          this.dragging_mode = undefined;
          this.is_dragging = false;
          this.selected_light = undefined;
          undo.end_undo_frame();
        }
        this.start_drag_x = tx;
        this.start_drag_y = ty;
      }
    }
    
  }

  refresh_grid()
  {

    make_edges();
    update_all_light_viz_polys();
    game.points_for_current_grid = count_score();
  }
  
  can_drag(sx, sy, ex, ey)
  {
    // return true if you can drag a light from sx,sy to ex,ey
    if (is_target_a_light(ex, ey))
      return false;

    if (game.current_level.grid[ex][ey].grid_type === tiles.FLOOR_BUILDABLE)
      return true;
    
    // TODO: CHECK ALL grids along this line and make sure they are ALL
    // passable!
    return false;
  }

  try_build_wall(_x, _y)
  {
    if (is_target_a_light(_x, _y))
      return;
    if (game.current_level.grid[_x][_y].grid_type === tiles.FLOOR_BUILDABLE)
    {
      let new_undo_action = new undo_move(_x, _y, undo_actions.BUILD_WALL);
      undo.add_move_to_undo(new_undo_action);
      set_grid(game.current_level.grid, _x, _y, tiles.FLOOR_BUILT);
      this.refresh_grid();
    }
  }

  try_erase_wall(_x, _y)
  {
    if (is_target_a_light(_x, _y))
      return;
    if (game.current_level.grid[_x][_y].grid_type === tiles.FLOOR_BUILT)
    {
      let new_undo_action = new undo_move(_x, _y, undo_actions.ERASE_WALL);
      undo.add_move_to_undo(new_undo_action);
      set_grid(game.current_level.grid, _x, _y, tiles.FLOOR_BUILDABLE);
      this.refresh_grid();
    }
  }

  clicked()
  {
    // this is the same thing as assuming something created later will deal with
    // this mouse input instead of us
    if (show_menu || game.show_tutorial)  // hack for now to not draw stuff on grid while menu is open
      return;
    let px = game.global_mouse_handler.mx;
    let py = game.global_mouse_handler.my;
    let gl = get_selected_light(px, py);
    if (gl !== undefined)
    {
      // undo.start_new_undo_frame();
      this.is_dragging = true;
      this.selected_light = gl;
      this.dragging_mode = this.DRAGGING_LIGHT_MODE;
      this.start_drag_x = game.global_mouse_handler.get_targetx();
      this.start_drag_y = game.global_mouse_handler.get_targety();
      return;
    }

    let tx = game.global_mouse_handler.get_targetx();
    let ty = game.global_mouse_handler.get_targety();
    if (game.current_level.grid[tx][ty].grid_type === tiles.FLOOR_BUILDABLE)
    {
      //undo.start_new_undo_frame();
      // building mode
      this.dragging_mode = this.DRAWING_MODE;
      this.is_dragging = true;
      this.try_build_wall(tx, ty);
    }
    else if (game.current_level.grid[tx][ty].grid_type === tiles.FLOOR_BUILT)
    {
      // undo.start_new_undo_frame();
      // erasing mode
      this.dragging_mode = this.ERASING_MODE;
      this.is_dragging = true;
      this.try_erase_wall(tx, ty);
    }
  }

  unclicked()
  {
    if (this.dragging_mode === this.DRAWING_MODE || this.dragging_mode === this.ERASING_MODE
      || this.dragging_mode === this.DRAGGING_LIGHT_MODE)
      undo.end_undo_frame();
    this.is_dragging = false;
  }
}

class detector
{
  constructor(x, y, r, g, b)
  {
    // position
    this.x = x;
    this.y = y;
    // color stuff
    this.c = color(r,g,b);
    this.r = r;
    this.g = g;
    this.b = b;
    // correct?
    this.correct = false;
    this.old_correct = false;
    // animation stuff
    this.anim_cycle = random(TWO_PI);
    this.anim_speed = ((random() + 1) / 55) + 0.0025;
    // flash juice
    this.flashing = false;
    this.flash_radius = 0;
    this.flash_inc = random() + 2.5;
    this.flash_radius_max = game.FLASH_SIZE + random(game.gridSize);
  }

  check_color()
  {
    this.old_correct = this.correct;
    let xp = this.x * game.gridSize + game.GRID_HALF;
    let yp = this.y * game.gridSize + game.GRID_HALF;
    let HALF_HALF = game.GRID_HALF / 2;

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

      for (let l of game.lightsources)
      {

    
        if (!l.active)
          continue;
        let xtarget = l.x  * game.gridSize + (game.gridSize / 2);
        let ytarget = l.y * game.gridSize + (game.gridSize / 2)

        // line segment1 is xtarget,ytarget to xpos, ypos
        // line segment2 e2.sx, e2.sy to e2.ex, e2.ey
        let has_intersection = false;

        let min_px, min_py;

        for (let e2 of game.edges) // check for ray intersection
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

    // if we used to be not active, and now we are, start a flash
    if (this.correct && !this.old_correct)
    {
      this.flash_radius = 0;
      this.flashing = true;
      particle_system.particle_explosion
      (
        this.x * game.gridSize + game.GRID_HALF,
        this.y * game.gridSize + game.GRID_HALF,
        50,
        this.c,
        300,
        150,
        3
      );
    }

  }

  draw_this()
  {
    let grid_center_x = this.x * game.gridSize + game.GRID_HALF;
    let grid_center_y = this.y * game.gridSize + game.GRID_HALF;

    noStroke();
    fill(37);
    square(this.x * game.gridSize, this.y * game.gridSize, game.gridSize);

    // draw flash juice
    if (this.flashing)
    {
      this.flash_radius += (deltaTime / this.flash_inc);
      strokeWeight(4);
      noFill();
      let alph = map(this.flash_radius, 0, this.flash_radius_max, 255, 0);
      
      stroke(150, alph * 0.6);
      ellipse(grid_center_x, grid_center_y, this.flash_radius * 0.6, this.flash_radius * 0.6);
      
      stroke(150, alph * 0.8);
      ellipse(grid_center_x, grid_center_y, this.flash_radius * 0.8, this.flash_radius * 0.8);
      
      stroke(150, alph);
      ellipse(grid_center_x, grid_center_y, this.flash_radius, this.flash_radius);

      if (this.flash_radius > this.flash_radius_max)
      {
        this.flashing = false;
      }
    }


    let default_size = 0.8;
    default_size *= (sin(this.anim_cycle) + 9) / 10;
    this.anim_cycle += this.anim_speed;
    if (this.anim_cycle > TWO_PI)
      this.anim_cycle = 0;
    strokeWeight(game.GRID_QUARTER);
    if (this.r == 0 & this.g == 0 & this.b == 0)
      stroke(170);
    else
      stroke(4);
    ellipse(grid_center_x, grid_center_y, game.gridSize * default_size, game.gridSize * default_size);

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
    ellipse(this.x * game.gridSize + game.GRID_HALF, this.y * game.gridSize + game.GRID_HALF, game.gridSize * default_size, game.gridSize * default_size);
  }

  move(_x, _y)
  {
    set_grid(game.current_level.grid, this.x, this.y, tiles.FLOOR_BUILDABLE);
    this.x = _x;
    this.y = _y;
    set_grid(game.current_level.grid, this.x, this.y, tiles.DETECTOR_TILE);
    this.check_color();
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

    this.ls_region = new mouse_region(x * game.gridSize, y * game.gridSize, 
                                      x * game.gridSize + game.gridSize, y*game.gridSize + game.gridSize);
    this.ls_region.events[mouse_events.CLICK] = () => this.click_light();
    this.ls_region.events[mouse_events.UNCLICK] = () => this.unclick_light();

    this.ls_region.events[mouse_events.ENTER_REGION] = () => { this.selected = true; };
    this.ls_region.events[mouse_events.EXIT_REGION] = () => this.check_leave_grid();
    this.name = color_to_string(this.c) + game.global_light_id;
    ++game.global_light_id;
    game.global_mouse_handler.register_region(this.name, this.ls_region);

  }

  get_new_viz_poly()
  {
    let cx = this.x * game.gridSize + game.GRID_HALF;
    let cy = this.y * game.gridSize + game.GRID_HALF;
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
    this.ls_region.x1 = x * game.gridSize;
    this.ls_region.y1 = y * game.gridSize;
    this.ls_region.x2 = (x + 1) * game.gridSize;
    this.ls_region.y2 = (y + 1) * game.gridSize;
    // if we register a region with a name we already have registered, it
    // will replace the already existing region.
    game.global_mouse_handler.register_region(this.name, this.ls_region);
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
    this.add_switch_to_undo_stack();
    this.active = !this.active;
    if (this.active)
      particle_system.particle_explosion(
        this.x * game.gridSize + game.GRID_HALF, 
        this.y * game.gridSize + game.GRID_HALF, 
        50, 
        color(this.r, this.g, this.b), 
        200, 
        75,
        3
        );
  }

  add_switch_to_undo_stack()
  {
    let which_action = undefined;
    if (this.active)
    {
      // we are being deactivated
      which_action = undo_actions.DEACTIVATE_LIGHT;
    }
    else
    {
      // we are being activated
      which_action = undo_actions.ACTIVATE_LIGHT;
    }
    let new_undo_action = new undo_move(this.x, this.y, which_action);
    undo.start_new_undo_frame();
    undo.add_move_to_undo(new_undo_action);
    undo.end_undo_frame();
  }

  draw_light()
  {
    if (this.active && this.viz_polygon.length > 0)
    {
      blendMode(ADD);
      let cx = this.x * game.gridSize + game.gridSize / 2;
      let cy = this.y * game.gridSize + game.gridSize / 2;
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
      ellipse(this.x * game.gridSize + (game.gridSize / 2), this.y * game.gridSize + (game.gridSize/2), game.gridSize * 3 + animsin , game.gridSize * 3 + animsin);
  
      fill(this.med_light);
      ellipse(this.x * game.gridSize + (game.gridSize / 2), this.y * game.gridSize + (game.gridSize/2), game.gridSize * 2 + animcos, game.gridSize * 2 + animcos);
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
    ellipse(this.x * game.gridSize + (game.gridSize / 2), this.y * game.gridSize + (game.gridSize / 2), game.gridSize * 0.85, game.gridSize * 0.85);
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

  scale_edge(new_scale)
  {
    this.sx *= new_scale;
    this.sy *= new_scale;
    this.ex *= new_scale;
    this.ey *= new_scale;
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
    this.grid_type = tiles.FLOOR_EMPTY;
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

class undo_move
{
  // an undo move tracks an individual move during a game
  // each move has an x and y, plus an action type
  // moving lights also has an ending x that is not set in the
  // constructor, but set manually
  constructor(x, y, move_type, ex = 0, ey = 0)
  {
    this.x = x;
    this.y = y;
    this.move_type = move_type;
    this.ex = ex;
    this.ey = ey;
  }

  undo_move()
  {
    switch(this.move_type)
    {
    case undo_actions.BUILD_WALL:
      this.undo_build_wall();
      break;
    case undo_actions.ERASE_WALL:
      this.undo_erase_wall();
      break;
    case undo_actions.ACTIVATE_LIGHT:
      this.undo_activate_light();
      break;
    case undo_actions.DEACTIVATE_LIGHT:
      this.undo_deactivate_light();
      break;
    case undo_actions.MOVE_LIGHT:
      this.undo_move_light();
      break;
    }
  }

  redo_move()
  {
    switch(this.move_type)
    {
    case undo_actions.BUILD_WALL:
      this.redo_build_wall();
      break;
    case undo_actions.ERASE_WALL:
      this.redo_erase_wall();
      break;
    case undo_actions.ACTIVATE_LIGHT:
      this.redo_activate_light();
      break;
    case undo_actions.DEACTIVATE_LIGHT:
      this.redo_deactivate_light();
      break;
    case undo_actions.MOVE_LIGHT:
      this.redo_move_light();
      break;
    }
  }

  // Undo actions
  undo_activate_light()
  {
    // find the light at position x, y and deactivate it
    let gl = get_selected_light_on_grid(this.x, this.y);
    game.lightsources[gl].active = false;
  }

  undo_deactivate_light()
  {
    // find the light at position x, y and activate 
    let gl = get_selected_light_on_grid(this.x, this.y);
    game.lightsources[gl].active = true;
  }

  undo_move_light()
  {
    // find the light at position end x, end y and move it
    // to position start x, start y
    let gl = get_selected_light_on_grid(this.ex, this.ey);
    game.lightsources[gl].move(this.x, this.y);
  }

  undo_build_wall()
  {
    set_grid(game.current_level.grid, this.x, this.y, tiles.FLOOR_BUILDABLE);
  }

  undo_erase_wall()
  {
    set_grid(game.current_level.grid, this.x, this.y, tiles.FLOOR_BUILT);
  }


  // Redo actions
  redo_activate_light()
  {
    // find the light at position x, y and deactivate it
    let gl = get_selected_light_on_grid(this.x, this.y);
    game.lightsources[gl].active = true;
  }

  redo_deactivate_light()
  {
    // find the light at position x, y and activate 
    let gl = get_selected_light_on_grid(this.x, this.y);
    game.lightsources[gl].active = false;
  }

  redo_move_light()
  {
    // find the light at position end x, end y and move it
    // to position start x, start y
    let gl = get_selected_light_on_grid(this.x, this.y);
    game.lightsources[gl].move(this.ex, this.ey);
  }

  redo_build_wall()
  {
    set_grid(game.current_level.grid, this.x, this.y, tiles.FLOOR_BUILT);
  }

  redo_erase_wall()
  {
    set_grid(game.current_level.grid, this.x, this.y, tiles.FLOOR_BUILDABLE);
  }
}

class particle
{
  constructor(x, y, c, x_vel, y_vel, lifetime)
  {
    this.x = x;
    this.y = y;
    this.color = color(red(c), green(c), blue(c));
    this.x_vel = x_vel;
    this.y_vel = y_vel;
    this.lifetime = lifetime;
    this.life = 0;
    this.active = true;
  }

  update()
  {
    this.life += deltaTime;
    if (this.life > this.lifetime)
    {
      // die
      this.active = false;
      return;
    }
    this.x += this.x_vel;
    this.y += this.y_vel;
  }

  draw()
  {
    let alph_amount = map(this.life, 0, this.lifetime, 255, 0);
    this.color.setAlpha(alph_amount);
    fill(this.color);
    noStroke();
    ellipse(this.x, this.y, 4, 4);
  }
}

class particle_system
{
  static particles = [];

  static update_particles()
  {
    //for (let p of particle_system.particles)
    for (let i = particle_system.particles.length - 1; i >= 0; i--)
    {
      particle_system.particles[i].update();
      if (!particle_system.particles[i].active)
      {
        particle_system.particles.splice(i, 1);
      }
    }
  }

  static draw_particles()
  {
    for (let p of particle_system.particles)
    {
      p.draw();
    }
  }

  static add_particle(p)
  {
    particle_system.particles.push(p);
  }

  static particle_explosion(x, y, amount, color, max_life, spread, max_speed)
  {
    for (i = 0; i < amount; ++i)
    {
      let p = new particle(
        x, 
        y, 
        color, 
        random() * (max_speed * 2) - max_speed, 
        random() * (max_speed * 2) - max_speed, 
        max_life + random(spread));
      particle_system.add_particle(p);
    }
  }

}

//////// DOM ADJUSTMENT
function centerCanvas() {
  let x = (windowWidth - width) / 2;
  let y = (windowHeight - height) / 2;
  cnv.position(x, y);
}

//////// UNDO STUFF


//////// MAIN GAME
function preload() {
  // any things to load before our game starts, fonts, music, etc.
  // This font is nice for gameplay stuff
  spectro_font = loadFont('assets/LemonMilk.otf');
}

function setup() {
  // console.log("On mobile? " + mobileCheck());
  if (mobileCheck())
    game.PLAYFIELD_DIM = game.MOBILE_PLAYFIELD_DIM;
  else
    game.PLAYFIELD_DIM = game.PC_PLAYFIELD_DIM;
  // Base size of gameboard on size of parent window, so this should
  // look ok on different screen sizes.

  // -10 to avoid having bars?
  let largest_dim = min(windowWidth, windowHeight) * 0.9;
  // round down to nearest interval of 20 (PLAYFIELD_DIM)
  largest_dim -= largest_dim % game.PLAYFIELD_DIM;
  let target_gridSize = int(largest_dim / game.PLAYFIELD_DIM);
  game.gameHeight = largest_dim;
  game.gameWidth = largest_dim;
  game.gridSize = target_gridSize;
  game.gridWidth = game.PLAYFIELD_DIM;
  game.gridHeight = game.PLAYFIELD_DIM;

  game.GRID_HALF = int(game.gridSize / 2);
  game.GRID_QUARTER = int(game.GRID_HALF / 2);
  game.FLASH_SIZE = game.gridSize * 4;

  font_size = game.gridSize;

  // setup is called once at the start of the game
  cnv = createCanvas(game.gameWidth, game.gameHeight);
  centerCanvas();
  initialize_colors();  // Can't happen until a canvas has been created!
  game.current_dim = largest_dim;

  textFont(spectro_font);

  game.global_mouse_handler = new mouse_handler();

  make_menu();

  // uncomment this to nuke bad saved game
  // storeItem("savedgame", null);

  if (game.show_intro)
    game.game_state = states.INTRO;
  else
    game.game_state = states.MAIN_MENU_SETUP;
}

function windowResized() 
{
  // TODO: Resizing window is still problematic!
  // The canvas doesn't appear to get recentered when the window is resized?
  // is this a CSS issue?

  let largest_dim = min(windowWidth, windowHeight) * 0.9;
  largest_dim -= largest_dim % game.PLAYFIELD_DIM;
  let target_gridSize = int(largest_dim / game.PLAYFIELD_DIM);
  game.gameHeight = largest_dim;
  game.gameWidth = largest_dim;
  game.gridSize = target_gridSize;
  // gridWidth = int(gameWidth / game.gridSize);
  // game.gridHeight = int(gameHeight / game.gridSize);

  game.GRID_HALF = int(game.gridSize / 2);
  game.GRID_QUARTER = int(game.GRID_HALF / 2);
  game.FLASH_SIZE = game.gridSize * 4;
  font_size = game.gridSize;

  resizeCanvas(game.gameWidth, game.gameHeight);
  centerCanvas();

  // reposition_all_buttons();  // THIS is going to require some rewrites
  let new_scale = largest_dim / game.current_dim;
  game.global_mouse_handler.scale_regions(new_scale);
  scale_all_edges(new_scale);

  // TODO: Check if we actually have viz polys? ie, we are in game?
  // TODO: Only update screen if we are in game
  update_all_light_viz_polys();
  game.current_dim = largest_dim;
  do_game();
}

function initialize_colors() {
  palette.solid_wall_fill = color(160, 160, 170);
  palette.solid_wall_permenant_fill = color(180, 180, 190);
  palette.solid_wall_outline = color(120, 120, 120);

  palette.buildable_fill = color(33, 33, 33);
  palette.buildable_2_fill = color(37, 37, 37);
  palette.buildable_outline = color(43, 43, 43);

  palette.empty_outline = color(25, 25, 25);
  palette.empty_fill = color(13, 13, 13);

  palette.edge_color = color(80, 80, 80);
  palette.edge_circle_color = color(70, 70, 70);

  palette.font_color = color(35, 35, 35);

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

  palette.detector_colors = [
    color(0, 0, 0), 
    color(0, 0, 255), 
    color(0, 255, 0), 
    color(0, 255, 255), 
    color(255, 0, 0), 
    color(255, 0, 255), 
    color(255, 255, 0), 
    color(255, 255, 255)
  ];
}

//////// MAIN MENU
function do_setup_main_menu()
{
  if (states.need_setup_main_menu)
  {
    // it will be a region that will contain sub-regions for each menu option?
    let i = 0;
    for (let m of menus.main_menu_options)
    {
      let reg = new mouse_region(0, (i + 1) * game.gridSize * 2, game.gridSize * game.gridWidth, (i + 2) * game.gridSize * 2);
      reg.events[mouse_events.CLICK] = () => handle_main_menu_selection(int(game.global_mouse_handler.my / (game.gridSize * 2)) - 1);
      reg.events[mouse_events.ENTER_REGION] = () => {menus.main_menu_selected = int(game.global_mouse_handler.my / (game.gridSize * 2)) - 1;};
      // reg.events[mouse_events.EXIT_REGION] = () => {menus.main_menu_selected = undefined; };
      game.global_mouse_handler.register_region(m + "main_menu", reg);
      ++i;
    }
    states.need_setup_main_menu = false;
  }
  enable_main_menu();
  game.have_saved_game = (getItem("savedgame") !== null);
  game.game_state = states.MAIN_MENU;
}

function do_main_menu()
{
  game.current_gamemode = undefined;
  fill(37);
  rect(0, 0, width, height);

  // display menu options
  textSize(font_size * 2);
  var i = 0;
  stroke(0);
  strokeWeight(2);

  blendMode(ADD);
  fill(255, 0, 0);
  text("spectro", (game.gridWidth - 17) * game.gridSize, game.gridSize * 2 - 5);
  fill(0, 255, 0);
  text("spectro", (game.gridWidth - 17) * game.gridSize, game.gridSize * 2);
  fill(0, 0, 255);
  text("spectro", (game.gridWidth - 17) * game.gridSize, game.gridSize * 2 + 5);
  blendMode(BLEND);

  if ((mouseY <= game.gridSize * 2) || (mouseY >= game.gridSize * 2 * (menus.main_menu_options.length + 1)))
    menus.main_menu_selected = undefined;

  for (let m of menus.main_menu_options)
  {
    if (menus.main_menu_selected === i)
      fill(253);
    else
      fill(157);

    // disable option hack
    if (i === 3)
      fill(57);

    if (i === 2 && !game.have_saved_game)
      fill(57);

    text(m, (game.gridWidth - 17) * game.gridSize, (i + 2) * game.gridSize * 2);
    ++i;
  }

}

function enable_main_menu()
{
  for (let m of menus.main_menu_options)
  {
    game.global_mouse_handler.enable_region(m + "main_menu");
  }
}

function teardown_main_menu()
{
  // disable main menu options
  for (let m of menus.main_menu_options)
  {
    game.global_mouse_handler.disable_region(m + "main_menu");
  }
}

function handle_main_menu_selection(menu_index)
{
  switch (menu_index)
  {
    case 0:
      teardown_main_menu();
      // confirm we want a new game
      storeItem("savedgame", null);
      game.current_gamemode = game.GAMEMODE_RANDOM;
      game.game_state = states.NEW_GAME;
      break;
    case 1:
      if (!game.have_saved_game)
        return;
      teardown_main_menu();
      game.current_gamemode = game.GAMEMODE_RANDOM;
      game.game_state = states.NEW_GAME;
      break; 
    case 2:
      teardown_main_menu();
      game.current_gamemode = game.GAMEMODE_TIME;
      game.game_state = states.NEW_GAME;
      break;
    case 3:
      game.game_state = states.SETUP_OPTIONS;
      teardown_main_menu();
      break;
    case 4:
      game.game_state = states.SETUP_ABOUT;
      teardown_main_menu();
      break;
  }
}

//////// ABOUT SCREEN
function do_setup_about()
{
  if (states.need_setup_about)
  {
    // eventually tutorial will be something that happens in game
    let about_ok_button = new mouse_region((width / 2) - game.gridSize, height - 5 * game.gridSize, (width / 2) + game.gridSize, height - 4 * game.gridSize);
    about_ok_button.events[mouse_events.CLICK] = ()=>{ game.game_state = states.TEARDOWN_ABOUT; };
    about_ok_button.events[mouse_events.ENTER_REGION] = ()=>{ over_about_ok_btn = true; };
    about_ok_button.events[mouse_events.EXIT_REGION] = ()=>{ over_about_ok_btn = false; };
    game.global_mouse_handler.register_region("about_ok_btn", about_ok_button);

    states.need_setup_about = false;
  }
  game.global_mouse_handler.enable_region("about_ok_btn");
  game.game_state = states.ABOUT;
}

function do_about_menu()
{

  noStroke();
  fill (0, 70);
  rect(game.gridSize * 2 + game.GRID_HALF, game.gridSize * 2 + game.GRID_HALF, width - game.gridSize * 4, height - game.gridSize * 4);

  stroke(190, 190, 190);
  fill (35);
  strokeWeight(4);
  rect(game.gridSize * 2, game.gridSize * 2, width - game.gridSize * 4, height - game.gridSize * 4);
  fill(72);
  rect(game.gridSize * 3, game.gridSize * 3, width - game.gridSize * 6, height - game.gridSize * 6);

  let s = "About\n" +
  "spectro v" + MAJOR_VERSION + "." + MINOR_VERSION + "\n" +
   "Programming & Design: Tyler Weston\n" +
   "Based on Javidx9's line of sight algorithm\n" +
   "Thanks to Warren Sloper for testing\n" +
   "and Jane Haselgrove for all the pizza.\n";

  //stroke(130);
  textSize(font_size / 2);
  textAlign(CENTER, CENTER);
  noStroke();
  blendMode(ADD);
  fill(255, 0, 0);
  text(s, game.gridSize * 3, game.gridSize * 3, width - game.gridSize * 6, height - game.gridSize * 6 - 5);
  fill(0, 255, 0);
  text(s, game.gridSize * 3, game.gridSize * 3, width - game.gridSize * 6, height - game.gridSize * 6);
  fill(0, 0, 255);
  text(s, game.gridSize * 3, game.gridSize * 3, width - game.gridSize * 6, height - game.gridSize * 6 + 5);


  blendMode(BLEND);

  if (over_about_ok_btn)
  {
    noStroke();
    fill(255, 20);
    ellipse((width / 2), height - 4.5 * game.gridSize, game.gridSize * 2, game.gridSize * 2);

    fill(255, 255, 255);
  }
  else 
  {
    fill(0, 0, 0);
  }
  stroke(130);
  strokeWeight(2);
  textSize(font_size);
  textAlign(CENTER, BASELINE);
  text("OK", (width / 2), height - 4 * game.gridSize);

  textAlign(LEFT, BASELINE);

}

function do_teardown_about_menu()
{
  game.global_mouse_handler.disable_region("about_ok_btn");
  game.game_state = states.MAIN_MENU_SETUP;
}

//////// OPTION SCREEN
function do_setup_options()
{
  if (states.need_setup_options)
  {
    states.need_setup_options = false;
  }
  game.game_state = states.OPTIONS;
}

function do_options_menu()
{
  game.game_state = states.TEARDOWN_OPTIONS;
}

function do_teardown_options()
{
  game.game_state = states.MAIN_MENU_SETUP;
}

//////// TOP MENU
function change_top_menu_entry(index, new_name, new_func)
{
  menus.top_menu_choices[index] = new_name;
  menus.top_menu_callbacks[index] = () => new_func;
}

function top_menu_main_menu() 
{
  // Exit to main menu, check here if we need to load or save
  // anything, etc.
  game.game_state = states.MAIN_MENU_SETUP;
} 

function top_menu_save_level() 
{
  game.current_level.save_level(game.lightsources, game.detectors, true);
}

function top_menu_load() {
  let lp = get_level_and_load();
  if (lp)
    try_load_level(lp);
}

function top_menu_reset_stuff() 
{
  resetStuff();
}

function top_menu_reset_game() 
{
  // TODO: Yes/no confirm
  storeItem("savedgame", null);
  game.game_state = states.NEW_GAME;
}

function top_menu_load_editor() 
{
  if (game.editor_available)
    game.game_state = states.SETUP_EDITOR;
}

function top_menu_tutorial() 
{
  game.game_state = states.PREPARE_TUTORIAL;
}

function top_menu_options() 
{
  // TODO: No options available for now, so just ignore
  // game.game_state = states.SETUP_OPTIONS;
}

function top_menu_about() 
{
  game.game_state = states.ABOUT;
}

function handle_top_menu_selection(menu_index)
{
  if (!top_menu_accept_input)
    return;
  menus.top_menu_callbacks[menu_index]();
}

function launch_menu()
{
  // send mouse off event to top_menu to disable high-lighting? 
  game.global_mouse_handler.disable_region("top_menu");
  enable_menu();
  show_menu = true;
}

function enable_menu()
{
  game.global_mouse_handler.enable_region("opened_top_menu");
  // show_menu = true;
  //top_menu_accept_input = true;
  menus.top_menu_selected = 0;
  for (let m of menus.top_menu_choices)
  {
    game.global_mouse_handler.enable_region(m);
  }
}

function disable_menu()
{
  top_menu_accept_input = false;
  game.global_mouse_handler.disable_region("opened_top_menu");
  show_menu = false;
  for (let m of menus.top_menu_choices)
  {
    game.global_mouse_handler.disable_region(m);
  }
}

function close_menu()
{
  disable_menu();
  game.global_mouse_handler.enable_region("top_menu");
  show_menu = false;
}

function make_menu()
{
  // the top right menu button
  menu_region = new mouse_region((game.gridWidth - 3) * game.gridSize, 0,
                                  game.gridWidth * game.gridSize, game.gridSize);
  menu_region.events[mouse_events.CLICK] = () => { launch_menu(); };
  menu_region.events[mouse_events.UNCLICK] = () => {top_menu_accept_input = true;};
  menu_region.events[mouse_events.ENTER_REGION] = () => {mouse_over_menu = true;};
  menu_region.events[mouse_events.EXIT_REGION] = () => {mouse_over_menu = false;};
  game.global_mouse_handler.register_region("top_menu", menu_region);
  
  // initialize the menu handler and region stuff
  open_menu_region = new mouse_region((game.gridWidth - 8) * game.gridSize, 0, game.gridWidth * game.gridSize, menus.top_menu_height * game.gridSize);
  open_menu_region.events[mouse_events.EXIT_REGION] = () => {close_menu();};
  open_menu_region.events[mouse_events.UNCLICK] = () => {top_menu_accept_input = true;};
  game.global_mouse_handler.register_region("opened_top_menu", open_menu_region);
  
  // it will be a region that will contain sub-regions for each menu option?
  let i = 0;
  for (let m of menus.top_menu_choices)
  {
    let reg = new mouse_region((game.gridWidth - 7) * game.gridSize, i * game.gridSize, game.gridSize * game.gridWidth, (i + 1) * game.gridSize);
    reg.events[mouse_events.CLICK] = () => handle_top_menu_selection(int(game.global_mouse_handler.my / game.gridSize));
    reg.events[mouse_events.ENTER_REGION] = () => {menus.top_menu_selected = int(game.global_mouse_handler.my / game.gridSize);};
    game.global_mouse_handler.register_region(m, reg);
    ++i;
  }
}

// keyboard input
function keyPressed() {
  // if (!game.current_gamemode)
  //   return;
  // only handle keypresses if we have an active game
  // JUST DEBUG STUFF?
  // editor keys and stuff will be handled here as well??
  if (mouseIsPressed)
    return; // for now this should be an easy fix around this!
  if (key === 'r')
  {
    // need to check if we already have an active undo frame?!
    undo.start_new_undo_frame();
    game.lightsources[0].switch_active();
  }
  else if (key === 'g')
  {
    undo.start_new_undo_frame();
    game.lightsources[1].switch_active();
  }
  else if (key === 'b')
  {
    undo.start_new_undo_frame();
    game.lightsources[2].switch_active();
  }
  else if (key === ' ')
  {
    if (game.current_gamemode === game.GAMEMODE_RANDOM && next_level_available)
    {
      game.game_state = game.game_state = states.RANDOM_LEVEL_TRANSITION_OUT;
    }
  }

  // TODO: Remove these key codes 
  if (keyCode === LEFT_ARROW) {
    game.difficulty_level--;
    random_level();
  } else if (keyCode === RIGHT_ARROW) {
    game.difficulty_level++;
    random_level();
  } else if (key === 'p') {
    save_screenshot();
  } else if (key === 's') {
    game.current_level.copy_save_string_to_clipboard(game.lightsources, detectors);
  } else if (key === 'l') {
    try_load_level(getItem("savedgame"));
  } else if (key === 'q') {
    storeItem("high_random_score", null);
    storeItem("game.high_timer_score", null);
  } else if (key === 'e') {
    let lvl_txt = get_level_and_load();
    try_load_level(lvl_txt);
  }
}

//////// MOUSE HANDLING

//////// MAP
function initializeGrid(which_grid)
{
  // initialize grid
  for (x = 0; x < game.gridWidth; ++x)
  {
    for (y = 0; y < game.gridHeight; ++y)
    {
      set_grid(which_grid, x, y, tiles.FLOOR_BUILDABLE);
      if (x === 0 || x === game.gridWidth - 1 || y === 0 || y === game.gridHeight - 1)
      {
        set_grid(which_grid, x, y, tiles.PERMENANT_WALL);
      }
    }
  }
}

function set_grid(which_grid, x, y, type)
{
  switch(type)
  {
    case tiles.FLOOR_EMPTY:
      which_grid[x][y].grid_type = tiles.FLOOR_EMPTY;
      which_grid[x][y].exist = false;
      which_grid[x][y].permenant = true;
      which_grid[x][y].unpassable = true;
      break;
    case tiles.PERMENANT_WALL:
      which_grid[x][y].grid_type = tiles.PERMENANT_WALL;
      which_grid[x][y].exist = true;
      which_grid[x][y].permenant = true;
      which_grid[x][y].unpassable = true;
      break;
    case tiles.FLOOR_BUILT:
      which_grid[x][y].grid_type = tiles.FLOOR_BUILT;
      which_grid[x][y].exist = true;
      which_grid[x][y].permenant = false;
      which_grid[x][y].unpassable = true;
      which_grid[x][y].fade = 0;
      break; 
    case tiles.FLOOR_BUILDABLE:
      which_grid[x][y].grid_type = tiles.FLOOR_BUILDABLE;
      which_grid[x][y].exist = false;
      which_grid[x][y].permenant = false;
      which_grid[x][y].unpassable = false;
      break;
    case tiles.DETECTOR_TILE:
      which_grid[x][y].grid_type = tiles.DETECTOR_TILE;
      which_grid[x][y].exist = false
      which_grid[x][y].permenant = true;
      which_grid[x][y].unpassable = false;
      break;
    case tiles.GLASS_WALL:
      which_grid[x][y].grid_type = tiles.GLASS_WALL;
      which_grid[x][y].exist = false;
      which_grid[x][y].permenant = true;
      which_grid[x][y].unpassable = true;
      break;

  }
}

function clear_grid_spot(which_grid, x, y)
{
  which_grid[x][y].grid_type = tiles.FLOOR_EMPTY;
  which_grid[x][y].permenant = false;
  which_grid[x][y].unpassable = false;
  which_grid[x][y].exist = false;
}

//////// STATES
function do_game()
{
  let grid = game.current_level.grid;

  // draw base grid (walls + floors)
  draw_walls_and_floors();

  // draw edges
  draw_edges();


  // draw detectors (for now, check active status as well)

  // TODO: This should  happen somewhere else?
  // check if all detectors are active
  let all_active = true;
  for (let d of game.detectors)
  {
    d.check_color();
    if(!d.correct)
      all_active = false;
  }
  let old_next_level_available = next_level_available;
  next_level_available = all_active;

  // if we're in time attack, transition right away
  if (all_active && game.current_gamemode === game.GAMEMODE_TIME)
  {
    game.game_state = states.RANDOM_LEVEL_TRANSITION_OUT;
  }

  // change in status of ability to go to next level
  if (old_next_level_available != next_level_available)
  {
    if (next_level_available)
    {
      game.global_mouse_handler.enable_region("next_btn");
    }
    else
    {
      game.global_mouse_handler.disable_region("next_btn");
    }
  }

  // draw particles underneath detectors
  particle_system.update_particles();
  particle_system.draw_particles();

  // these eventually will take current_level as well?
  draw_detectors(); 
  
  // these eventually will take current_level as well?
  draw_light_sources(); 

  // Draw glass (Extra tiles to draw would happen here?)
  draw_glass();

  // Render any text that we have to
  textSize(game.gridSize - 2);
  fill(palette.font_color);
  text("level: " + game.difficulty_level, 0 + game.GRID_HALF, game.gridSize - 4);

  fill(palette.font_color);
  if (mouse_over_menu)
    fill(255);
  
  text("menu", (game.gridWidth - 3) * game.gridSize, game.gridSize - 4);

  if (game.current_gamemode === game.GAMEMODE_RANDOM)
  {
    random_game_ui();
  }
  if (game.current_gamemode === game.GAMEMODE_TIME)
  {
    if (game.time_remaining > 0)
      game.time_remaining -= deltaTime / 1000;
    if (game.time_remaining <= 0)
    {
      game.game_state = states.SETUP_SHOW_TIME_RESULTS;
    }
    time_game_ui();
  }

  if (game.save_fade > 0)
  {
    game.save_fade -= deltaTime / 400;
    fill(0);
    let inv_save_fade = 1.0 - game.save_fade;
    noStroke();

    let shutter_close = (cos(game.save_fade * TWO_PI) + 1) / 2;
    let inv_shutter_close = 1.0 - shutter_close;

    triangle(0, 0, 0, game.gameHeight, game.gameWidth * inv_shutter_close, game.gameHeight);
    triangle(0, game.gameHeight, game.gameWidth, game.gameHeight, game.gameWidth, game.gameHeight * shutter_close);
    triangle(game.gameWidth, game.gameHeight, game.gameWidth, 0, game.gameWidth * shutter_close, 0);
    triangle(game.gameWidth, 0, 0, 0, 0, game.gameHeight * inv_shutter_close);

    fill(150, game.save_fade * 255);
    rect(0, 0, game.gameWidth, game.gameHeight);
  }

  if (game.show_tutorial)
    tutorial();

  if (show_menu)      // disable game? Layer mouse listeners
    draw_menu();

}

function do_intro()
{
  blendMode(ADD);
  let random_cols = [color(255, 0, 0), color(0, 255, 0), color(0, 0, 255)];
  if (game.intro_timer === 0)
  {
    game.intro_timer += deltaTime;
    textSize(font_size * 3);
    textAlign(CENTER, CENTER);
    offs = 0;
  }
  else if (game.intro_timer < 3500)
  {
    game.intro_timer += deltaTime;
    if (game.intro_timer < 2500)
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
    textSize(font_size * 3);
    text("a tw game", 0, 0, width, height + (game.intro_timer * random(1, 13) % 900) - 450);
    strokeWeight(2);
    blendMode(MULTIPLY);
    stroke(0);
    fill(240);
    if (game.intro_timer < 1750)
    {
      textSize(font_size * 3);
      text("a tw game", 0, 0, width, height);
    }
    else
    {
      textSize(font_size * 4);
      text("spectro", 0, 0, width, height);

    }
  }
  else
  {
    blendMode(BLEND);
    textAlign(LEFT, BASELINE);
    textSize(font_size);
    game.game_state = states.MAIN_MENU_SETUP;
  }
}

function do_level_transition_out()
{
  undo.reset_undo_stacks();
  // FADING IN/OUT STATE STUFF
  // global fade should start at 0
  if (game.global_fade < 1)
  {
    game.global_fade += deltaTime / 250;
  }
  do_game();
  fill(17, 255);
  rect(0 , 0, game.gameWidth, game.gameHeight * game.global_fade);
  fill(48, 48, 48, game.global_fade * 255);
  rect(0, 0, game.gameWidth, game.gameHeight);
  if (game.global_fade >= 1)
  {
    // this is what is going to change around depending on what
    // game mode we are in.
    if (game.current_gamemode === game.GAMEMODE_RANDOM)
    {
      // count our score here
      game.new_total = count_score();
      game.new_total_fade = 1;
      game.new_scoring_system += game.new_total > 0 ? game.new_total : 0;
      ++game.difficulty_level;
      random_level();
      make_edges();
      game.points_for_current_grid = count_score();
    }

    if (game.current_gamemode === game.GAMEMODE_TIME)
    {
      game.time_remaining += 10;
      game.total_time_played += game.time_gain_per_level; // TODO: Scale with difficulty!
      // TODO: Display this somewhere
      game.ghandler.stop_dragging(); // this is broken!
      ++game.difficulty_level;
      time_level();
      make_edges();
    }
    game.game_state = states.RANDOM_LEVEL_TRANSITION_IN;
  }
}

function do_level_transition_in()
{
  game.global_fade -= deltaTime / 250;
  do_game();
  fill(17, 255);
  rect(0, game.gameHeight - (game.gameHeight * game.global_fade), game.gameWidth, game.gameHeight);
  fill(48, 48, 48, game.global_fade * 255);
  rect(0, 0, game.gameWidth, game.gameHeight);
  if (game.global_fade < 0)
  {
    game.game_state = states.GAME;
  }

}

function prepare_tutorial()
{
  // eventually tutorial will be something that happens in game
  let ok_button = new mouse_region((width / 2) - 30, 460, (width / 2) + 10, 500);
  ok_button.events[mouse_events.CLICK] = ()=>{ game.game_state = states.TEARDOWN_TUTORIAL; };
  ok_button.events[mouse_events.ENTER_REGION] = ()=>{ over_btn = true; };
  ok_button.events[mouse_events.EXIT_REGION] = ()=>{ over_btn = false; };
  game.global_mouse_handler.register_region("ok_btn", ok_button);
  show_menu = false;
  game.show_tutorial = true;
  game.game_state = states.TUTORIAL;
  do_game();  // do one iteration to erase menu image
}

function tear_down_tutorial()
{
  over_btn = false;
  game.show_tutorial = false;
  game.global_mouse_handler.remove_region("ok_btn");
  game.game_state = states.GAME;
}

function tutorial()
{
  // shadow
  noStroke();
  fill (0, 70);
  rect(game.gridSize * 2 + game.GRID_HALF, game.gridSize * 2 + game.GRID_HALF, width - game.gridSize * 4, height - game.gridSize * 4);

  stroke(190, 190, 190);
  fill (35);
  strokeWeight(4);
  rect(game.gridSize * 2, game.gridSize * 2, width - game.gridSize * 4, height - game.gridSize * 4);
  fill(72);
  rect(game.gridSize * 3, game.gridSize * 3, width - game.gridSize * 6, height - game.gridSize * 6);

  let s = "Tutorial\n" +
   "Use left click to draw or erase walls.\n" +
   "Click once on lights to activate / deactivate,\n" +
   "or drag them to move them.\n" +
   "Fill in all the detectors with the\n" + 
   "correct color to proceed.\n" +
   "Less walls = more points.\n" +
   "Once all detectors are filled, click next.";
  strokeWeight(1);
  fill(180);
  stroke(130);
  textSize(font_size / 2);
  textAlign(CENTER, CENTER);
  text(s, game.gridSize * 3, game.gridSize * 3, width - game.gridSize * 6, height - game.gridSize * 6);

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

function setup_game()
{
  undo.reset_undo_stacks();  // ensure we have a fresh redo stack to start
  if (game.current_gamemode === game.GAMEMODE_RANDOM)
    setup_random_game();
  if (game.current_gamemode === game.GAMEMODE_TIME)
    setup_time_game();
}

//////// DRAWING 
// DRAW gets called EVERY frame, this is the MAIN GAME LOOP
function draw() {
  game.global_mouse_handler.handle();  // do mouse stuff
  switch (game.game_state)
  {
  case states.NEW_GAME:
    setup_game();
    break;
  case states.INTRO:  
    do_intro();
    break;
  case states.GAME:
    do_game();
    break;
  case states.RANDOM_LEVEL_TRANSITION_OUT:
    do_level_transition_out();
    break;
  case states.RANDOM_LEVEL_TRANSITION_IN:
    do_level_transition_in();
    break;
  case states.SETUP_EDITOR:
    do_setup_editor();
    break;
  case states.EDITOR:
    do_editor();
    break;
  case states.PREPARE_TUTORIAL:
    prepare_tutorial();
    break;
  case states.TUTORIAL:
    tutorial();
    break;
  case states.TEARDOWN_TUTORIAL:
    tear_down_tutorial();
    break;
  case states.MAIN_MENU_SETUP:
    do_setup_main_menu();
    break;
  case states.MAIN_MENU:
    do_main_menu();
    break;
  case states.MAIN_MENU_TEARDOWN:
    teardown_main_menu();
    break;
  case states.SETUP_SHOW_TIME_RESULTS:
    do_setup_show_time_results();
    break;
  case states.SHOW_TIME_RESULTS:
    do_show_time_results();
    break;
  case states.SETUP_OPTIONS:
    do_setup_options();
    break;
  case states.OPTIONS:
    do_options_menu();
    break;
  case states.TEARDOWN_OPTIONS:
    do_teardown_options();
    break;
  case states.SETUP_ABOUT:
    do_setup_about();
    break;
  case states.ABOUT:
    do_about_menu();
    break;
  case states.TEARDOWN_ABOUT:
    do_teardown_about_menu()
    break;
  }
}

function draw_menu()
{
  fill(37, 210);
  stroke(12);
  strokeWeight(2);
  rect((game.gridWidth - 8) * game.gridSize, 0, game.gridWidth * game.gridSize, game.gridSize * (menus.top_menu_height));

  // display menu options
  var i = 0;
  stroke(0);
  strokeWeight(2);
  textAlign(LEFT, TOP);
  
  // console.log("Undo stack size: " + undo.undo_stack.length);
  // console.log("Redo stack length: " + undo.redo_stack.length);

  for (let m of menus.top_menu_choices)
  {
    if (menus.top_menu_selected === i)
      fill(253);
    else
      fill(157);

    if (i === 0 && undo.undo_stack.length === 0)
      fill(57);
    if (i === 1 && undo.redo_stack.length === 0)
      fill(57);
      
    text(m, (game.gridWidth - 7) * game.gridSize, (i) * game.gridSize );
    ++i;
  }
  textAlign(LEFT, BASELINE);
}

function draw_glass()
{
  let lvl = game.current_level;
  fill(255, 150);
  strokeWeight(4);
  stroke(90, 50);
  for (x = 0 ; x < lvl.xsize; ++x)
  {
    for (y = 0; y < lvl.ysize; ++y)
    {
      if (lvl.grid[x][y].grid_type == tiles.GLASS_WALL || lvl.grid[x][y].grid_type == tiles.GLASS_WALL_TOGGLABLE)
        square(x * game.gridSize, y * game.gridSize, game.gridSize);
    }
  }
}

function draw_walls_and_floors()
{
  let lvl = game.current_level;
  strokeWeight(1);
  for (x = 0 ; x < lvl.xsize; ++x)
  {
    for (y = 0; y < lvl.ysize; ++y)
    {
      let odd = ((x + y) % 2 === 0);
      let p = (lvl.grid[x][y].permenant); // This should be programmed into the level

      if (!lvl.grid[x][y].exist)  // EMPTY SPACES
      {

        if (lvl.grid[x][y].grid_type == tiles.FLOOR_EMPTY)
        {
          // stroke(25, 25, 25);
          // fill(13, 13, 13);
          noStroke();
          //stroke(palette.empty_outline);
          fill(palette.empty_fill);
          square(x * game.gridSize, y * game.gridSize, game.gridSize);
        }

        else if (lvl.grid[x][y].grid_type == tiles.FLOOR_BUILDABLE)
        {
          if (lvl.grid[x][y].fade > 0)
            lvl.grid[x][y].fade -= deltaTime / 250;
          stroke(lerpColor(palette.buildable_outline, palette.solid_wall_outline, lvl.grid[x][y].fade));
          // lerp between the empty fill color and the color of whatever
          // solid thing will be there
          fill(lerpColor( odd ? palette.buildable_fill : palette.buildable_2_fill, 
                          p ? palette.solid_wall_permenant_fill : palette.solid_wall_fill, 
                          lvl.grid[x][y].fade));

          square(x * game.gridSize, y * game.gridSize, game.gridSize);
        }
      }

      else if (lvl.grid[x][y].exist)  // SOLID WALLS
      {
        if (lvl.grid[x][y].fade < 1)
          lvl.grid[x][y].fade += deltaTime / 250;
        if (p)
          noStroke();
        else
          stroke(lerpColor(palette.buildable_outline, palette.solid_wall_outline, lvl.grid[x][y].fade));
        // exact same thing as above!
        fill(lerpColor( odd ? palette.buildable_fill : palette.buildable_2_fill, 
                        p ? palette.solid_wall_permenant_fill : palette.solid_wall_fill, 
                        lvl.grid[x][y].fade));
        square(x * game.gridSize , y * game.gridSize, game.gridSize);
      }

      if (lvl.grid[x][y].grid_type == tiles.GLASS_WALL_TOGGLABLE || lvl.grid[x][y] == tiles.GLASS_WALL)
      {
        strokeWeight(2);
        stroke(170, 170, 170);
        if (lvl.grid[x][y].permenant)
        {
          noStroke();
          fill(170, 170, 170, 40);
        }
        square(x * game.gridSize + 1, y * game.gridSize + 1, game.gridSize - 3);

        // TODO: Little glass lines on the windows?
        // strokeWeight(1);
        // for (j = 0; j < 5; ++ j)
        // {
        //  line(x * game.gridSize + 10 - j, y * game.gridSize - j, x * game.gridSize + j, y * game.gridSize + 10 + j);
        // }

      }
    }
  }
}

function draw_edges()
{
  // strokeWeight(2);
  // stroke(palette.edge_circle_color);
  // fill(palette.edge_circle_color);
  // // stroke(palette.edge_circle_color);
  // for (let e of edges)
  // {
  //   ellipse(e.sx, e.sy, 2, 2);
  //   ellipse(e.ex, e.ey, 2, 2);
  // }

  strokeWeight(3);
  for (let e of game.edges)
  {
    stroke(palette.edge_color);
    line(e.sx, e.sy, e.ex, e.ey);
  }
}

function draw_detectors()
{
  for (let d of game.detectors)
  {
    d.draw_this();
  }
}

function draw_light_sources()
{
  // draw our light sources in a first pass
  for (let l of game.lightsources)
  {
    l.draw_light();
  }

  // and then the lights themselves separately
  for (let l of game.lightsources)
  {
    l.draw_this()
  }
}

//////// LEVEL SAVE / LOAD
function try_load_level(level_string)
{
  // this should be a failsafe in case I accidentally corrupt
  // peoples saved games?
  try 
  {
    load_level(level_string);
  } catch (err) {
    storeItem("savedgame", null);
    return false;
  }
  return true;
}

function load_level(level_string)
{
  // create a new level
  var level_string_index = 4;
  let new_lvl = new level();

  // read xsize and ysize
  let xsize = level_string.substring(0, 2);
  let ysize = level_string.substring(2, 4);

  if (xsize != game.gridWidth || ysize != game.gridHeight)
  {
    throw 'Loaded game size mismatch';
  }

  new_lvl.xsize = xsize;
  new_lvl.ysize = ysize;
  new_lvl.initialize_grid();
  game.gridWidth = xsize;
  game.gridHeight = ysize;

  // read 1 char to switch random save vs editor save.
  let read_mode = level_string.charAt(level_string_index++);
  if (read_mode === "r")  // random mode
  {
    // read 2 char for current level
    // switch game state to RANDOM_GAME
    let cl = parseInt(level_string.substring(level_string_index, level_string_index + 2));
    level_string_index += 2;
    // cl is now the saved difficulty
    game.difficulty_level = cl;
    let current_new_score = parseInt(level_string.substring(level_string_index, level_string_index + 4));
    level_string_index += 4;
    game.new_scoring_system = current_new_score;
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
    let light_col = palette.detector_colors[lc];
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
    let detector_col = palette.detector_colors[dc];
    let new_detector = new detector(dx, dy, red(detector_col), green(detector_col), blue(detector_col));
    loaded_detectors.push(new_detector);

  }

  game.detectors = loaded_detectors;
  game.lightsources = loaded_lights;
  game.current_level = new_lvl;

  // if this is a random game, calculate the new board score
  game.points_for_current_grid = count_score();
  make_edges();
  update_all_light_viz_polys();
}

//////// LEVEL EDIT
function do_setup_editor()
{
  // setup editor handler
  if (!game.ehandler)
    game.ehandler = new editor_handler();

  // ok, we need a new level
  editor_lvl = new level();
  editor_lvl.xsize = game.gridWidth;
  editor_lvl.ysize = game.gridHeight;
  editor_lvl.initialize_grid();
  initializeGrid(editor_lvl.grid);
  game.current_level = editor_lvl;

  // clear light sources
  game.lightsources = [];

  // clear detectors
  game.detectors = [];

  make_edges();

  // make sure game handler isn't running any more
  if (game.ghandler)
    game.ghandler.disable();

  // when we're done settin up
  game.game_state = states.EDITOR;
}

function do_editor()
{
  let grid = game.current_level.grid;

  // draw base grid (walls + floors)
  draw_walls_and_floors();

  // draw edges
  draw_edges();

  draw_detectors(); // these eventually will take current_level as well?

  draw_light_sources(); // these eventually will take current_level as well?


  // Draw glass (Extra tiles to draw would happen here?)
  draw_glass();

  let all_active = true;
  for (let d of game.detectors)
  {
    d.check_color();
    if(!d.correct)
      all_active = false;
  }

  // draw editor UI components
  draw_editor_ui();

  if (editor_handler.in_erase_mode)
  {
    noStroke();
    fill(255, 0, 0, 50);
    square(game.global_mouse_handler.get_targetx() * game.gridSize, 
    game.global_mouse_handler.get_targety() * game.gridSize, game.gridSize);
  }

  strokeWeight(4);
  stroke(90, 50);
  // TODO: Should editor levels be able to have names?
  // // Render any text that we have to
  // textSize(game.gridSize - 2);
  // fill(palette.font_color);
  // text("level: " + editor_level_name, 0 + game.GRID_HALF, game.gridSize - 4);

  fill(palette.font_color);
  if (mouse_over_menu)
    fill(255);
  
  text("menu", (game.gridWidth - 3) * game.gridSize, game.gridSize - 4);

  if (game.show_tutorial)
    tutorial(); // this can be the editor tutorial

  if (show_menu)
    draw_menu();

}

function draw_editor_ui()
{
  let i = 0;
  for (let c of palette.detector_colors)
  {
    draw_detector_at_grid_spot(i++, game.gridHeight - 1, c);
  }
  draw_light_at_grid_spot(i++, game.gridHeight - 1, color(255, 0, 0));
  draw_light_at_grid_spot(i++, game.gridHeight - 1, color(0, 255, 0));
  draw_light_at_grid_spot(i++, game.gridHeight - 1, color(0, 0, 255));

  draw_map_tiles(11, game.gridHeight - 1);

  draw_garbage_can(15, game.gridHeight - 1);

  // highlight selected item
  if (editor_handler.hovered_item !== undefined)
  {
    strokeWeight(3);
    noFill();
    stroke(255, 255, 0, 125);
    square(game.gridSize * editor_handler.hovered_item, (game.gridHeight - 1) * game.gridSize, game.gridSize);
  }

  if (editor_handler.selected_item !== undefined)
  {
    strokeWeight(3);
    noFill();
    stroke(255, 0, 0, 125);
    square(game.gridSize * editor_handler.selected_item, (game.gridHeight - 1) * game.gridSize, game.gridSize);
  }

  if (editor_handler.in_erase_mode)
  {
    strokeWeight(2);
    fill(127, 0, 0, 50);
    stroke(255, 0, 0);
    square(15 * game.gridSize, (game.gridHeight - 1) * game.gridSize, game.gridSize);
  }

}

function draw_garbage_can(_x, _y)
{
  stroke(255, 0, 0);
  strokeWeight(2);
  line(_x * game.gridSize, _y * game.gridSize, (_x + 1) * game.gridSize, (_y + 1) * game.gridSize);
  line(_x * game.gridSize, (_y + 1) * game.gridSize, (_x + 1) * game.gridSize, _y * game.gridSize);
}

function draw_detector_at_grid_spot(_x, _y, _c)
{
  noStroke();
  fill(37);
  square(_x * game.gridSize, _y * game.gridSize, game.gridSize);

  let default_size = 0.8;
  strokeWeight(7);
  if (red(_c) == 0 && green(_c) == 0 && blue(_c) == 0)
    stroke(170);
  else
    stroke(4);
  ellipse(_x * game.gridSize + game.GRID_HALF, _y * game.gridSize + game.GRID_HALF, game.gridSize * default_size, game.gridSize * default_size);

  strokeWeight(5);
  stroke(_c);
  noFill();
  ellipse(_x * game.gridSize + game.GRID_HALF, _y * game.gridSize + game.GRID_HALF, game.gridSize * default_size, game.gridSize * default_size);
  
}

function draw_light_at_grid_spot(_x, _y, _c)
{
  stroke(_c);
  fill(_c);
  ellipse(_x * game.gridSize + (game.gridSize / 2), _y * game.gridSize + (game.gridSize / 2), game.gridSize * 0.85, game.gridSize * 0.85);

}

function draw_map_tiles(_x, _y)
{
  // draw the tiles starting at _x and _y position
  strokeWeight(1);
  // first permenant wall
  stroke(palette.solid_wall_outline);
  fill(palette.solid_wall_permenant_fill);
  square(_x * game.gridSize, _y * game.gridSize, game.gridSize);
  ++_x;

  // glass wall
  strokeWeight(4);
  stroke(90, 50);
  fill(palette.buildable_fill);
  square(_x * game.gridSize, _y * game.gridSize, game.gridSize);
  ++_x;

  // buildable space
  strokeWeight(1);
  stroke(palette.buildable_outline);
  fill(palette.buildable_fill);
  square(_x * game.gridSize, _y * game.gridSize, game.gridSize);
  ++_x;

  // empty space
  stroke(palette.empty_outline);
  fill(palette.empty_fill);
  square(_x * game.gridSize, _y * game.gridSize, game.gridSize);
  ++_x;

}

//////// TIME ATTACK MODE
function setup_time_game()
{
  game.ghandler = new gameplay_handler();
  // next level button, will start hidden and disabled
  let next_region = new mouse_region((game.gridWidth - 3) * game.gridSize, (game.gridHeight - 1) * game.gridSize, game.gridWidth * game.gridSize, game.gridHeight * game.gridSize);
  next_region.events[mouse_events.CLICK] = () => { game.game_state = states.RANDOM_LEVEL_TRANSITION_OUT; };
  next_region.events[mouse_events.ENTER_REGION] = () => { over_next_level = true; };
  next_region.events[mouse_events.EXIT_REGION] = () => { over_next_level = false; };
  next_region.enabled = false;
  game.global_mouse_handler.register_region("next_btn", next_region);
  game.high_timer_score = getItem("game.high_timer_score")
  if (game.high_timer_score == null)
    game.high_timer_score = 0;


  game.difficulty_level = 1;   // todo: shouldn't be hard coded here
  game.time_remaining = game.initial_time;    // todo: shouldn't be hard coded here
  game.total_time_played = game.time_remaining;
  game.has_new_timer_high_score = false;
  init_light_sources();
  time_level();
  game.game_state = states.GAME;
}

function time_level()
{
  // change how this level is made
  let new_random_level = new level();
  new_random_level.xsize = game.gridWidth;
  new_random_level.ysize = game.gridHeight;
  new_random_level.initialize_grid();

  initializeGrid(new_random_level.grid);
  turn_lights_off();
  init_random_detectors(new_random_level, difficulty_to_detector_amount());
  make_some_floor_unbuildable(new_random_level.grid, difficulty_to_shrink_amount());
  shrink_lights();
  game.current_level = new_random_level;
  // save current level
  make_edges();
  update_all_light_viz_polys();

}

function tear_down_time_game()
{
  game.global_mouse_handler.disable("game.ghandler"); // remove entirely at some point!
}

function time_game_ui()
{
  fill(palette.font_color);
  let display_time = int(game.time_remaining);
  if (display_time < 0)
    display_time = 0;
  text("time left: " + display_time, 0 + game.GRID_HALF, game.gridHeight * game.gridSize - 4);
}

function do_setup_show_time_results()
{
  if (states.need_setup_show_time_results)
  {
    // TODO: Tweak to find better placement
    let x1 = game.gridWidth * 10;
    let y1 = (game.gridHeight - 5) * game.gridSize;
    let x2 = game.gridWidth * 14;
    let y2 = (game.gridHeight - 4) * game.gridSize + game.GRID_HALF;
    // fill(255, 0, 0);
    // rect(x1, y1, x2 - x1, y2 - y1);
    let play_again_btn = new mouse_region(x1, y1, x2, y2);
    play_again_btn.events[mouse_events.ENTER_REGION] = () => { over_play_again_btn = true; };
    play_again_btn.events[mouse_events.EXIT_REGION] = () => { over_play_again_btn = false; };
    play_again_btn.events[mouse_events.CLICK] = () => { play_again_from_time_results(); };
    game.global_mouse_handler.register_region("time_result_play_again_btn", play_again_btn);

    // TODO: Tweak to find better placement
    x1 = width - (game.gridWidth * 13);
    y1 = (game.gridHeight - 5) * game.gridSize;
    x2 = width - (game.gridWidth * 9);
    y2 = (game.gridHeight - 4) * game.gridSize + game.GRID_HALF;
    // fill(0, 255, 0);
    // rect(x1, y1, x2 - x1, y2 - y1);
    let back_main_menu_btn = new mouse_region(x1, y1, x2, y2);
    back_main_menu_btn.events[mouse_events.ENTER_REGION] = () => { over_main_menu_btn = true; };
    back_main_menu_btn.events[mouse_events.EXIT_REGION] = () => { over_main_menu_btn = false; };
    back_main_menu_btn.events[mouse_events.CLICK] = () => { go_back_to_main_menu_from_time_results(); };
    game.global_mouse_handler.register_region("time_result_back_main_menu_btn", back_main_menu_btn);

    // setup show time results
    states.need_setup_show_time_results = false;
  }
  // enable our button regions
  game.global_mouse_handler.enable_region("time_result_back_main_menu_btn");
  game.global_mouse_handler.enable_region("time_result_play_again_btn");
  game.game_state = states.SHOW_TIME_RESULTS;

  if (game.total_time_played > game.high_timer_score)
  {
    game.has_new_timer_high_score = true;
    game.high_timer_score = game.total_time_played;
    // // TODO: MORE JUICE!
    // game.new_high_score_juice += deltaTime / 150;
    // fill(255 * sin(game.new_high_score_juice));
    // if (game.new_high_score_juice >= TWO_PI)
    //   game.new_high_score_juice = 0;
    // text("NEW HIGH SCORE!", width / 2, game.gridSize * 5);
    storeItem("game.high_timer_score", game.total_time_played);
  }
}

function play_again_from_time_results()
{
  teardown_show_time_results();
  game.game_state = states.NEW_GAME;
}

function go_back_to_main_menu_from_time_results()
{
  teardown_show_time_results();
  game.game_state = states.MAIN_MENU_SETUP;
}

function do_show_time_results()
{
  // shadow
  noStroke();
  fill (0, 70);
  rect(game.gridSize * 2 + game.GRID_HALF, game.gridSize * 2 + game.GRID_HALF, width - game.gridSize * 4, height - game.gridSize * 4);

  stroke(190, 190, 190);
  fill (35);
  strokeWeight(4);
  rect(game.gridSize * 2, game.gridSize * 2, width - game.gridSize * 4, height - game.gridSize * 4);
  fill(72);
  rect(game.gridSize * 3, game.gridSize * 3, width - game.gridSize * 6, height - game.gridSize * 6);
  strokeWeight(2);
  stroke(0);
  textSize(game.gridSize);
  fill (palette.font_color);
  textAlign(CENTER);
  text("Total time played: " + game.total_time_played, width / 2, game.gridSize * 7);
  text("High score: " + game.high_timer_score, width / 2, game.gridSize * 9);

  if (game.has_new_timer_high_score)
  {
    // TODO: MORE JUICE!
    game.new_high_score_juice += deltaTime / 150;
    fill(255 * ((sin(game.new_high_score_juice) + 1) / 2));
    if (game.new_high_score_juice >= TWO_PI)
      game.new_high_score_juice = 0;
    text("NEW HIGH SCORE!", width / 2, game.gridSize * 5);
  }

  textAlign(LEFT);
  let x1 = game.gridWidth * 10;
  let y1 = (game.gridHeight - 5) * game.gridSize;
  let x2 = game.gridWidth * 14;
  let y2 = (game.gridHeight - 4) * game.gridSize;
  // fill(255, 0, 0);
  // rect(x1, y1, x2 - x1, y2 - y1);
  if (over_play_again_btn)
    fill(255);
  else
    fill(palette.font_color);
  text("again", x1, y2);

  x1 = width - (game.gridWidth * 13);
  y1 = (game.gridHeight - 5) * game.gridSize;
  x2 = width - (game.gridWidth * 9);
  y2 = (game.gridHeight - 4) * game.gridSize;
  // fill(0, 255, 0);
  // rect(x1, y1, x2 - x1, y2 - y1);
  if (over_main_menu_btn)
    fill(255);
  else
    fill(palette.font_color);
  text("menu", x1, y2);
}

function teardown_show_time_results()
{
  game.global_mouse_handler.disable_region("time_result_play_again_btn");
  game.global_mouse_handler.disable_region("time_result_back_main_menu_btn");
  // disable our mouse events for our buttons
}
//////// RANDOM GAME MODE
function setup_random_game()
{
  game.ghandler = new gameplay_handler();
  // next level button, will start hidden and disabled
  let next_region = new mouse_region((game.gridWidth - 3) * game.gridSize, (game.gridHeight - 1) * game.gridSize, game.gridWidth * game.gridSize, game.gridHeight * game.gridSize);
  next_region.events[mouse_events.CLICK] = () => { game.game_state = states.RANDOM_LEVEL_TRANSITION_OUT; };
  next_region.events[mouse_events.ENTER_REGION] = () => { over_next_level = true; };
  next_region.events[mouse_events.EXIT_REGION] = () => { over_next_level = false; };
  next_region.enabled = false;
  game.global_mouse_handler.register_region("next_btn", next_region);

  game.difficulty_level = 1;
  game.new_scoring_system = 0;
  init_light_sources();
  // check if we have a saved game
  let saved_g = getItem("savedgame");
  if (!saved_g)
  {
    random_level();
  }
  else
  {
    let loaded_success = try_load_level(saved_g);
    if (!loaded_success)
      random_level();
  }
  game.highest_score = getItem("high_random_score")
  if (game.highest_score == null)
    game.highest_score = 0;
  game.highest_score_display_timer = 5;
  game.game_state = states.GAME;
}

function tear_down_random_game()
{
  game.global_mouse_handler.disable("game.ghandler"); // remove entirely at some point!
}

function random_game_ui()
{
  if (next_level_available)
  {
    game.next_button_bob_timer += (deltaTime / 100);
    if (game.next_button_bob_timer > TWO_PI)
      game.next_button_bob_timer = 0;

    if (over_next_level)
      fill(255)
    else
      fill(palette.font_color);
    // -4? Magic number!
    text("next", (game.gridWidth - 3) * game.gridSize, game.gridHeight * game.gridSize - 4 - sin(game.next_button_bob_timer));
  }

  fill(palette.font_color);
  if (game.highest_score_changed > 0)
  {
    fill(lerpColor(palette.font_color, color(255, 255, 255), game.highest_score_changed));
    game.highest_score_changed -= deltaTime / 5000;
  }

  // bottom left will either say your CURRENT SCORE
  // the HIGH SCORE
  // or display the points you JUST GOT
  if (game.highest_score_display_timer > 0)
  {
    game.highest_score_display_timer -= deltaTime / 1500;
    text("high score: " + game.highest_score, 0 + game.GRID_HALF, game.gridHeight * game.gridSize - 4);
  }
  else
  {
    text("score: " + game.new_scoring_system + " points: " + game.points_for_current_grid, 0 + game.GRID_HALF, game.gridHeight * game.gridSize - 4);
  }

  if (game.new_total_fade > 0)
  {
    game.new_total_fade -= deltaTime / 2500;
    strokeWeight(2);
    stroke(37);
    fill(255);
    let xfadepos = ((game.highest_score_display_timer > 0) ? 5 : 4);
    xfadepos *= game.gridSize;
    text("+" + game.new_total, xfadepos, game.gridHeight * game.gridSize - 4 + (game.new_total_fade * 10));
  }
}

function random_level()
{
  let new_random_level = new level();
  new_random_level.xsize = game.gridWidth;
  new_random_level.ysize = game.gridHeight;
  new_random_level.initialize_grid();

  initializeGrid(new_random_level.grid);
  // turn_lights_off();
  init_random_detectors(new_random_level, difficulty_to_detector_amount());
  make_some_floor_unbuildable(new_random_level.grid, difficulty_to_shrink_amount());
  shrink_lights();
  game.current_level = new_random_level;
  // save current level
  game.current_level.save_level(game.lightsources, game.detectors);
  make_edges();
  update_all_light_viz_polys();
  // check if we're a high score, if we are, store us
  let high_score = getItem("high_random_score");
  if (high_score == null || high_score < game.new_scoring_system)
  {
    storeItem("high_random_score", game.new_scoring_system);
    game.highest_score = game.new_scoring_system;
    game.highest_score_changed = 1;
    game.highest_score_display_timer = 10;
  }
  game.points_for_current_grid = count_score();
}

function init_light_sources()
{
  // init lights
  game.lightsources = []
  // RGB lights
  let source = new light_source(game.gridWidth - 5, game.gridHeight - 5, false, 255, 0, 0);
  game.lightsources.push(source);
  source = new light_source(game.gridHeight - 5, 5, false, 0, 255, 0);
  game.lightsources.push(source);
  source = new light_source(5, game.gridWidth / 2, false, 0, 0, 255);
  game.lightsources.push(source);

  // CMY lights
  // let source = new light_source(game.gridHeight - 5, 5, false, 0, 255, 255);
  // game.lightsources.push(source);
  // source = new light_source(game.gridWidth - 5, game.gridHeight - 5, false, 255, 0, 255);
  // game.lightsources.push(source);

  // source = new light_source(5, game.gridWidth / 2, false, 255, 255, 0);
  // game.lightsources.push(source);
}

function init_random_detectors(lvl, num_detectors)
{
  // initialize a randomized array of detectors
  game.detectors = []

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
      // Don't let us pop-up on game.lightsources as well, since it is
      // hard to notice
      for (let l of game.lightsources)
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
          if (lvl.grid[xp + xoff][yp + yoff].grid_type == tiles.DETECTOR_TILE)
          {
            gtype = -1;
            break;
          }
        }
      }

      if (gtype == tiles.FLOOR_EMPTY || gtype == tiles.FLOOR_BUILDABLE) // places we can build
        break;
    }

    let d = new detector(xp, yp, r, g, b);
    game.detectors.push(d);
    set_grid(lvl.grid, xp, yp, tiles.DETECTOR_TILE);
  }
}

function difficulty_to_detector_amount()
{
  // map from a difficulty level to number of detectors
  // on the field
  if (game.difficulty_level <= 3)
    return game.difficulty_level;
  if (game.difficulty_level <= 6)
    return game.difficulty_level - 1;
  if (game.difficulty_level <= 9)
    return game.difficulty_level - 3;
  return int(2 + game.difficulty_level / 2);
}

function difficulty_to_shrink_amount()
{
  if (game.difficulty_level <= 3)
    return 1;
  if (game.difficulty_level <= 6)
    return 2;
  if (game.difficulty_level <= 9)
    return 3;
  if (game.difficulty_level <= 15)
    return 4;
  if (game.difficulty_level <= 20)
    return 5;
  return 6;
}

function shrink_lights()
{
  // if the lights have ended up outside the boundaries of the new shrink
  let shrunk = difficulty_to_shrink_amount();
  // TODO: We need to make sure this doesn't place a lightsource on top of 
  // a detector or in an empty space where it can't move.
  for (let l of game.lightsources)
  {
    if (l.x < shrunk)
      l.move(shrunk, l.y);
    if (l.x > game.gridWidth - shrunk - 1)
      l.move(game.gridWidth - shrunk - 1, l.y);
    if (l.y < shrunk)
      l.move(l.x, shrunk);
    if (l.y > game.gridHeight - shrunk - 1)
      l.move(l.x, game.gridHeight - shrunk - 1);
  }
}

function make_some_floor_unbuildable(which_grid, shrink_amount)
{
  // bring in some floor from the outside
  for (x = 1 ; x < game.gridWidth - 1; ++x)
  {
    for (y = 1; y < game.gridHeight - 1; ++y)
    {
      if (x < shrink_amount || game.gridWidth - 1 < x + shrink_amount || y < shrink_amount || game.gridHeight - 1 < y + shrink_amount)
      {
        set_grid(which_grid, x, y, tiles.FLOOR_EMPTY);
      }
    }
  }
  if (game.difficulty_level > 5)
  {
    for (i = 0; i < game.difficulty_level - 3; ++i)
    {
      // TODO: Make sure this doesn't happen on one of the lights?
      // or say it's a feature, not a bug
      while(true)
      {
        let xpos = int(random(1, game.gridWidth - 2));
        let ypos = int(random(1, game.gridHeight - 2));
        //if xpos, ypos is not just a regular ol' floor
        if(which_grid[xpos][ypos].grid_type != tiles.FLOOR_BUILDABLE) 
          continue;
        break;
      }
      set_grid(which_grid, int(random(1, game.gridWidth - 2)), int(random(1, game.gridHeight - 2)), tiles.FLOOR_EMPTY);
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
      if (lvl.grid[x][y].grid_type == tiles.FLOOR_BUILT)
      {
        set_grid(lvl.grid, x, y, tiles.FLOOR_BUILDABLE);
      }
    }
  }
}

//////// EDGE ALG
function scale_all_edges(new_scale)
{
  // not working??
  for (let e of game.edges)
  {
    e.scale_edge(new_scale);
  }
}

function make_edges()
{
  // Constants to help with edge detection
  let NORTH = 0;
  let SOUTH = 1;
  let EAST = 2;
  let WEST = 3; 

  let grid = game.current_level.grid;
  game.edges = []; // should we do the splice thing here?
  // clear edges
  for (x = 0; x < game.gridWidth; ++x)
  {
    for (y = 0; y < game.gridHeight; ++y)
    {
      grid[x][y].edge_id = [0, 0, 0, 0];
      grid[x][y].edge_exist = [false, false, false, false];
    }
  }

  for (x = 0; x < game.gridWidth; ++x)
  {
    for (y = 0; y < game.gridHeight; ++y)
    {
      if(grid[x][y].exist)  // does cell exist
      {
        if (x > 0 && !grid[x-1][y].exist)  // if there is no western neighbor, it needs a western edge
        {
          if (grid[x][y - 1].edge_exist[WEST])  // If we have a northern neighbor, it may have an edge we can grow
          {
            game.edges[grid[x][y - 1].edge_id[WEST]].ey += game.gridSize;
            grid[x][y].edge_id[WEST] = grid[x][y - 1].edge_id[WEST];
            grid[x][y].edge_exist[WEST] = true;
          }
          else  // if not, we start a new edge
          {
            let new_edge = new edge(x * game.gridSize, 
              y * game.gridSize, 
              x * game.gridSize, 
              (y + 1) * game.gridSize);

            let edge_id = game.edges.length;
            game.edges.push(new_edge);

            grid[x][y].edge_id[WEST] = edge_id;
            grid[x][y].edge_exist[WEST] = true;
          }
        }
        if (x < game.gridWidth - 1 && !grid[x + 1][y].exist)  // if there is no eastern neighbor, it needs an eastern edge
        {
          if (grid[x][ y- 1].edge_exist[EAST])  // If we have a northern neighbor, it may have an edge we can grow
          {
            game.edges[grid[x][y - 1].edge_id[EAST]].ey += game.gridSize;
            grid[x][y].edge_id[EAST] = grid[x][y - 1].edge_id[EAST];
            grid[x][y].edge_exist[EAST] = true;
          }
          else  // if not, we start a new edge
          {
            let new_edge = new edge((x + 1) * game.gridSize, 
                                    y * game.gridSize, 
                                    (x + 1) * game.gridSize, 
                                    (y + 1) * game.gridSize);

            let edge_id = game.edges.length;
            game.edges.push(new_edge);

            grid[x][y].edge_id[EAST] = edge_id;
            grid[x][y].edge_exist[EAST] = true;
          }
        }
        if (y > 0 && !grid[x][y - 1].exist)  // if there is no north neighbor, it needs an northern edge
        {
          if (grid[x - 1][y].edge_exist[NORTH])  // If we have a western neighbor, it may have an edge we can grow
          {
            game.edges[grid[x - 1][y].edge_id[NORTH]].ex += game.gridSize;
            grid[x][y].edge_id[NORTH] = grid[x - 1][y].edge_id[NORTH];
            grid[x][y].edge_exist[NORTH] = true;
          }
          else  // if not, we start a new edge
          {
            let new_edge = new edge(x * game.gridSize, 
                                    y * game.gridSize, 
                                    (x + 1) * game.gridSize, 
                                    y * game.gridSize);

            let edge_id = game.edges.length;
            game.edges.push(new_edge);

            grid[x][y].edge_id[NORTH] = edge_id;
            grid[x][y].edge_exist[NORTH] = true;
          }
        }
        if (y < game.gridHeight - 1 && !grid[x][y+1].exist)  // if there is no south neighbor, it needs an southern edge
        {
          if (grid[x - 1][y].edge_exist[SOUTH])  // If we have a western neighbor, it may have an edge we can grow
          {
            game.edges[grid[x - 1][y].edge_id[SOUTH]].ex += game.gridSize;
            grid[x][y].edge_id[SOUTH] = grid[x - 1][y].edge_id[SOUTH];
            grid[x][y].edge_exist[SOUTH] = true;
          }
          else  // if not, we start a new edge
          {
            let new_edge = new edge(x * game.gridSize, 
              (y + 1) * game.gridSize, 
              (x + 1) * game.gridSize, 
              (y + 1) * game.gridSize);

            let edge_id = game.edges.length;
            game.edges.push(new_edge);

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
  // xpos and ypos are PIXEL positions
  let viz_polygon = [];
  for (let e of game.edges)
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
        if (j === 0) ang = base_ang - 0.00001;
        if (j === 1) ang = base_ang;
        if (j === 2) ang = base_ang + 0.00001;

        rdx = radius * cos(ang);
        rdy = radius * sin(ang);

        let min_t1 = Infinity;
        let min_px = 0, min_py = 0, min_ang = 0;
        let valid = false;

        for (let e2 of game.edges) // check for ray intersection
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
  // xpos and ypos are GRID positions
  for (let l of game.lightsources)
  {
    if (l.x === xpos && l.y === ypos)
      return true;
  } 
  return false;
}

function get_selected_light(xpos, ypos)
{
  // in this case xpos, ypos are PIXELS
  // return index of the light that the cursor is over
  let i = 0;
  for (let l of game.lightsources)
  {
    if (l.x * game.gridSize <= xpos && xpos <= l.x * game.gridSize + game.gridSize 
      && l.y * game.gridSize <= ypos && ypos <= l.y * game.gridSize + game.gridSize)
      return i;
    ++i;
  }
  return undefined;
}

function get_selected_light_on_grid(xgrid, ygrid)
{
  // in this case we are using grid coordinates
  let i = 0;
  for (let l of game.lightsources)
  {
    if (l.x === xgrid && l.y === ygrid)
      return i;
    ++i;
  }
  return undefined;
}

function turn_lights_off()
{
  for (let l of game.lightsources)
  {
    l.active = false;
  }
}

function update_all_light_viz_polys()
{
  for (let l of game.lightsources)
  {
    l.get_new_viz_poly();
  }
}

//////// OTHER
function two_option_dialog(dialog_text, option1_text, option2_text)
{
  // display an option in the middle of the screen and give
  // two options, return either a 0 for option 1 if clicked
  // or a 1 for option 2 if clicked
  noStroke();
  fill (0, 70);
  rect(game.gridSize * 2 + game.GRID_HALF, game.gridSize * 2 + game.GRID_HALF, width - game.gridSize * 4, height - game.gridSize * 4);

  stroke(190, 190, 190);
  fill (35);
  strokeWeight(4);
  rect(game.gridSize * 2, game.gridSize * 2, width - game.gridSize * 4, height - game.gridSize * 4);
  fill(72);
  rect(game.gridSize * 3, game.gridSize * 3, width - game.gridSize * 6, height - game.gridSize * 6);

  strokeWeight(1);
  fill(180);
  stroke(130);
  textSize(28);
  textAlign(CENTER, CENTER);
  text(dialog_text, game.gridSize * 3, game.gridSize * 3, width - game.gridSize * 6, height - game.gridSize * 6);
}

function get_selected_detector(xpos, ypos)
{
  // return index of the light that the cursor is over
  let i = 0;
  for (let d of game.detectors)
  {
    if (d.x * game.gridSize <= xpos && xpos <= d.x * game.gridSize + game.gridSize 
      && d.y * game.gridSize <= ypos && ypos <= d.y * game.gridSize + game.gridSize)
      return i;
    ++i;
  }
  return undefined;
}

function resetStuff()
{
  // This is only the reset function in a TIMED or RANDOM game
  // in editor mode, it should ENTIRELY reset the level (remove
  // detectors and lights as well).
  // reset_grid_function
  // reset the grid (ie, all walls marked built (buildable + exist), will be changed to just buildable)
  reset_grid(game.current_level);
  game.points_for_current_grid = count_score();
  turn_lights_off();
  make_edges();
}

function count_score()
{
  let score = game.difficulty_level + game.detectors.length - count_walls_used(game.current_level);
  return score >= 0 ? score : 0;
}

function count_walls_used(lvl)
{
  let total_seen = 0;
  for (let x = 1; x < lvl.xsize - 1; ++x)
  {
    for (let y = 1; y < lvl.ysize - 1; ++y)
    {
      if (lvl.grid[x][y].grid_type === tiles.FLOOR_BUILT)
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
  // NOTE: We don't always want to do this, or at least prompt the user
  // if they had something important on their clipboard!
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

function show_level_code_and_offer_copy(text)
{
  let prompt = window.prompt("Press OK to copy to clipboard", text);
  if (!prompt)
    return;
  copyToClipboard(text);
}

function get_level_and_load()
{
  let prompt = window.prompt("Enter level code:","");
  if (!prompt)
    return;
  return prompt;
}

function save_screenshot()
{
  saveCanvas('spectro_screenshot', 'jpg');
}

// Keyboard handlers for undo and redo
// from https://stackoverflow.com/questions/16006583/capturing-ctrlz-key-combination-in-javascript
document.addEventListener('keydown', function(event) {
  if (event.ctrlKey && event.key === 'z') {
    undo.undo_last_move();
  }
});

document.addEventListener('keydown', function(event) {
  if (event.ctrlKey && event.key === 'y') {
    undo.redo_last_move();
  }
});

// from https://stackoverflow.com/questions/11381673/detecting-a-mobile-browser
window.mobileCheck = function() {
  let check = false;
  (function(a){if(/(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|iris|kindle|lge |maemo|midp|mmp|mobile.+firefox|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows ce|xda|xiino/i.test(a)||/1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|\-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw\-(n|u)|c55\/|capi|ccwa|cdm\-|cell|chtm|cldc|cmd\-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc\-s|devi|dica|dmob|do(c|p)o|ds(12|\-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(\-|_)|g1 u|g560|gene|gf\-5|g\-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd\-(m|p|t)|hei\-|hi(pt|ta)|hp( i|ip)|hs\-c|ht(c(\-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i\-(20|go|ma)|i230|iac( |\-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc\-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|\-[a-w])|libw|lynx|m1\-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m\-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(\-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)\-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|\-([1-8]|c))|phil|pire|pl(ay|uc)|pn\-2|po(ck|rt|se)|prox|psio|pt\-g|qa\-a|qc(07|12|21|32|60|\-[2-7]|i\-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h\-|oo|p\-)|sdk\/|se(c(\-|0|1)|47|mc|nd|ri)|sgh\-|shar|sie(\-|m)|sk\-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h\-|v\-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl\-|tdg\-|tel(i|m)|tim\-|t\-mo|to(pl|sh)|ts(70|m\-|m3|m5)|tx\-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|\-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(\-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas\-|your|zeto|zte\-/i.test(a.substr(0,4))) check = true;})(navigator.userAgent||navigator.vendor||window.opera);
  return check;
};

// document.addEventListener('keydown', function(event) {
//   if (event.ctrlKey && event.key === 's') {
//     game.current_level.save_level(game.lightsources, detectors);
//   }
// });