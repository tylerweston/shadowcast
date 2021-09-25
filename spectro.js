"use strict";

/*
spectro
tyler weston, 2021

Controls:
r, g, b: switch corresponding light (This currently doesn't work during tutorial!)
space: go to next level (if available)
TODO: Pressing r,g,b on main menu crashes!

TODO:
- Break up big functions
  - Basically any function that is taking in a boolean flag that
    changes its 'mode' can be refactored into something simpler.
- Rewrite 2d grid creation as
var grid = [...Array(xsize)].map(e => Array(ysize).fill(val));

Important:
- remove tutorial from top menu.
- Note that generated solutions are not guaranteed to be optimal.
- Right click a solid tile to change it into colored glass?
- mode where you can't see the color of a detector
unless it is correct?
- 
- 

- don't really need a save button anymore since your
  game is just stored for you all the time.
- making the top right menu seems to happen at a weird time
  in the flow of things, look into that.

- ARE YOU SURE? box that returns TRUE or FALSE for reset
- Sound juice. Finish this and add options.
- option screen
  - make button class? or checkbox class?
  - sound options in options menu
- Detect if the user is on mobile and make the grid smaller so it
  is easier to choose/move lights, etc. ??
    - This now requires a few more fixes! Work on this, ie.
      mobile mode vs PC mode
    - Maybe it just needs to be a better way to choose the lights, ie.
      if on mobile and a click is really close to a light, auto choose it?

Visual fixes:
- animation idea: add another offset to the jiggle
  in the bg so we can do bigger jiggle offsets!
- make the font printing a bit nicer, some sort of highlighting
  or maybe little animated letters or something.
  We could encapsulate this into a class that keeps track
  of the string, location, size, etc, and then run little
  offsets and color individual letters, etc.
- get intro back into game
- move up level and menu text in main game a little bit
- add more floor patterns
- fix / add more default floor animations
- add more bonus floor animations
- floor animations should start when all detectors are activated
  - maybe some special ones that only happen then?
- line up all font on the bottom better, ie, intro spectro is a bit wonky
- Main menu should be better lined up... looks OK with new font
- Font size may be strange on different size devices? Yes, this needs
  to scale based on the size of the device. ALSO, we may want to make
  the squares a bit larger since playing on a cellphone is awkward!

Bugs:
- hi score board / leaderboard!
- Window resizing is broken?
- something broken with just setting is_dragging false to eat mouse input
  between level transitions, look at a better way to do this.
- mouse state can get wacky between level transitions sometimes
  - in a timed game, when we automatically transition to the next level
    we want to change the mouse state so that we aren't in drawing mode
    anymore!
- There is some issue with dragging mouse off the screen and then back on
- When we "shrink" lights onto the board, they may get placed on top of a
  detector, which makes them unmovable! make sure this doesn't happen!
- Reposition OK button in About menu

QOL improvements:
- make it so all text is aligned the same way (ie, all using baseline or
  something so there isn't switching back and forth)
- Make sure all detectors aren't the same color?
- fix webpage
- timer game should be a bit easier to play
- difficulty balance in progression - timer game is too hard?

Options:
 - Reset all game data
 - Disable animated background
 - Enable sounds
 - All animation?rgb
 - Game size? Or have that a different option?
  - Like a "custom game" option?
 - Save options and auto restore defaults

Sounds required:
  - intro sounds  - no?
  - menu mouse over - done
  - menu item click - done
  - light on  - needs tweaking
  - light off - needs tweaking
  - detector on - need
  - detector off  - need
  - all detectors active  - need
  - next level clicked  - done
  - new high score  - need
We need an input from the user before we can start playing any sounds
so maybe after we load stuff we just present a PLAY button that the user
has to click before the intro, menu, etc. so that way we can play sounds.


Refactoring:
- encapsulate state in a better way
  - right now it is kind of spread out and a bit icky how it is all implemented
  - collect and fix that stuff up
- make a button or ui class or something like that that will make creating
  buttons easier. This is the next big job probably!

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
const MAJOR_VERSION = 1;
const MINOR_VERSION = 6;

const USE_DEBUG_KEYS = false;

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
  static LEVEL_TRANSITION_OUT = 12;  // done
  static LEVEL_TRANSITION_IN = 13;   // done
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

  // The tutorial game that will happen on the first time
  // a user tries to play the game.
  static TUTORIAL_GAME = 23;
  static TUTORIAL_GAME_INTRO = 24;
  static TUTORIAL_GAME_OUTRO = 25;

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
  static top_menu_choices = ["undo", "redo", "reset grid", "save", "give up", "main menu", "reset game", "tutorial"];
  static top_menu_callbacks = [
    () => undo.undo_last_move(),
    () => undo.redo_last_move(),
    () => top_menu_reset_stuff(), 
    () => top_menu_save_level(), 
    () => top_menu_give_up(),
    () => top_menu_main_menu(), 
    () => top_menu_reset_game(), 
    () => top_menu_tutorial(), 
  ];
  static top_menu_selected = undefined;
  static top_menu_height = menus.top_menu_choices.length + 1;
  static main_menu_options = ["new game", "continue", "timed game", "options", "about"];
  static main_menu_selected = undefined;
  static main_menu_height = menus.main_menu_options.length + 1;

  static option_options = ["animations", "sounds", "reset data", "back"]
  static option_menu_selected = undefined;
  static option_menu_height = menus.option_options.length + 1;
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
    for (let i = undo_frame.length - 1; i >= 0; i--) {
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
  static PC_PLAYFIELD_DIM = 19;
  static MOBILE_PLAYFIELD_DIM = 14;

  // play mode
  static GAMEMODE_RANDOM = 0;
  static GAMEMODE_LEVELS = 1;  // Not implemented yet
  static GAMEMODE_TIME = 2;
  static GAMEMODE_TUTORIAL = 3;

  static edges = [];
  static lightsources = [];
  static detectors = [];
  static jiggle = undefined;
  static floor_animation = undefined;

  static gameHeight;
  static gameWidth;
  static gridSize;
  static GRID_HALF;
  static GRID_QUARTER;
  static current_dim;
  static gridWidth;
  static gridHeight;

  static FLASH_SIZE;
  static JIGGLE_CONSTRAINT = 2;

  static current_gamemode = undefined;
  
  static game_state = states.SETUP;

  static global_fade = 0;
  static save_fade = 0;

  static ghandler;
  static ehandler = null;
  static global_mouse_handler = undefined;

  static current_level = undefined;  // The currently loaded level, there can be only one!
  static difficulty_level = 1;

  static global_light_id = 0;

  static next_level_available = false;
  static given_up = false;
  static stick_give_up_juice = false;

  // random game / score
  static have_saved_game;
  static highest_score;
  static new_high_score_juice = 0;
  static highest_score_changed = 0;
  static highest_score_display_timer = 0;
  static new_total;
  static new_total_fade;
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
  static show_intro = false;         // <--------------- intro flag
  static show_tutorial = false;

  static need_load_menu_map = true;

  static intro_timer = 0;
  static next_button_bob_timer = 0;

  static ok_btn_animation_timer = 0;

  // Tutorial game stuff
  static first_time_playing;
  static current_tutorial_level = 0;
  static tutorial_game_intro_timer = 0;

  // sound stuff
  static sound_handler;
  static sounds_enabled = false;

  // visual options
  // static animated_background = true;
  static use_animations = true;
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
  static bright_font_color;

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

  disable_region(region_name, run_exit_callbacks=true)
  {
    // TODO: If we disable a region, do we ever want to run it's exit
    // callbacks? Apparently I wrote this so it assumes it always wants
    // to run this callback, but sometimes you don't??
    // IF we're in this region when we're disabled, send a mouseoff event
    // this is useful to clean up buttons, etc. that the mouse is over 
    if (run_exit_callbacks && this.registered_regions[region_name].mouse_in(mouseX, mouseY))
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

    this.odd_grid = [];
  }

  initialize_grid()
  {
    // initialize an array of grid here
    this.grid = [];
    this.odd_grid = [];
    for (let x = 0; x < this.xsize; ++x)
    {
      this.grid[x] = [];
      this.odd_grid[x] = [];
      for (let y = 0; y < this.ysize; ++y)
      {
        this.grid[x][y] = new grid_obj();
        this.odd_grid[x][y] = false;
      }
    }
    this.make_floor_pattern();
  }

  make_floor_pattern()
  {
    // make a random floor pattern
    let number_of_floor_types = 16;
    let floor_type = Math.floor(Math.random() * number_of_floor_types);
    let random_floor_modifier = Math.floor(Math.random() * 4) + 2; 
    let half_grid_width = game.gridWidth / 2;
    for (let x = 0; x < this.xsize; ++x)
    {
      for (let y = 0; y < this.ysize; ++y)
      {
        let odd;
        switch (floor_type)
        {
          case 0:
            odd = ((x + y) % random_floor_modifier === 0);
            break;
          case 1:
            odd = x % random_floor_modifier === 0;
            break;
          case 2:
            odd = y % random_floor_modifier === 0;
            break;
          case 3:
            odd = ((x + y) % 3 === 0);
            break;
          case 4:
            odd = sin(x + y) > 0
            break;
          case 5:
            odd = (x % 2 === 0) || (y % 2 === 0);
            break;
          case 6:
            odd = cos(y * x) > 0;
            break;
          case 7:
            odd = sin(x + random_floor_modifier) + cos(y + random_floor_modifier) > 0;
            break;
          case 8:
            odd = ((x + y) / 2) < game.gridWidth / 2;
            break;
          case 9:
            odd = ((x + y) % random_floor_modifier === 0);
            break;
          case 10:
            odd = ((x % 2 === 0) && (x <= y)) || ((y % 2 === 0) && (y <= x)) ;
            break;
          case 11:
            odd = ((x % random_floor_modifier === 0) && ((x < half_grid_width && x <= y) || ( x > half_grid_width && x >= y))) 
            || ((y % random_floor_modifier === 0) && ((y < half_grid_width && y <= x) || (y > half_grid_width && y >= x)));
            break;
          case 12:
            let x_dist = half_grid_width - x;
            let y_dist = half_grid_width - y;
            let x_sqr = x_dist * x_dist;
            let y_sqr = y_dist * y_dist;
            let calculated_radius = Math.sqrt(x_sqr + y_sqr);
            odd = (calculated_radius < (half_grid_width / random_floor_modifier) * 2) && 
            !(calculated_radius < (half_grid_width / random_floor_modifier)) ||
              calculated_radius > half_grid_width;
            break;
          case 13:
            odd = (x + (y / random_floor_modifier)) % 2 === 0;
            break;
          case 14:
            odd = tan(x + y * random_floor_modifier) > 0;
            break;
          case 15:
            odd = sin(x - half_grid_width) + tan(y + random_floor_modifier) > 0;
            break;
        }
        this.odd_grid[x][y] = odd;
      }
    }
  }

  set_level_data(level_data)
  {
    this.level_data = level_data;
  }

  save_solution(lights, detectors)
  {
    let level_string = this.generate_save_string(lights, detectors);
    storeItem("savedsolution", level_string);
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
    for (let x = 0; x < this.xsize; ++x)
    {
      for (let y = 0; y < this.ysize; ++y)
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
      // TODO: Don't do this is we're undoing?
      game.sound_handler.play_build_wall();
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
      // TODO: Don't do this if we're undoing?
      game.sound_handler.play_destory_wall();
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
    this.c = color(r, g, b, 215);
    this.r = r;
    this.g = g;
    this.b = b;
    // correct?
    this.correct = false;
    this.old_correct = false;
    // animation stuff
    this.anim_cycle = random(TWO_PI);
    this.anim_speed = ((random() + 1) / 7);
    // flash juice
    this.flashing = false;
    this.flash_radius = 0;
    this.flash_inc = random() + 1.5;
    this.flash_radius_max = game.FLASH_SIZE + random(game.gridSize);
  }

  change_color(r, g, b)
  {
    this.c = color(r, g, b, 215);
    this.r = r;
    this.g = g;
    this.b = b;
  }

  check_color(use_juice=true)
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
        let xtarget = l.x  * game.gridSize + (game.GRID_HALF);
        let ytarget = l.y * game.gridSize + (game.GRID_HALF)

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
      if (count > 3)
        this.correct = true;
      else 
        this.correct = false;
    }
    else
    {
      this.correct = false;
    }

    // if we used to be not active, and now we are, start a flash
    if (use_juice && this.correct && !this.old_correct)
    {
      // TODO: We don't always want to do this!
      this.activate_juice();
    }

  }

  activate_juice()
  {
    this.flash_radius = 0;
    this.flash_inc = random() + 2;
    this.flashing = true;
    // detector
    particle_system.particle_explosion
    (
      this.x * game.gridSize + game.GRID_HALF,
      this.y * game.gridSize + game.GRID_HALF,
      32,
      this.c,
      800,
      250,
      12,
      1
    );
    // we also play a sound
    game.sound_handler.play_sound("detector_on");
  }

  draw_floor()
  {
    noStroke();
    fill(37);
    fill(game.current_level.odd_grid[this.x][this.y]?
      palette.buildable_fill : palette.buildable_2_fill);
    if (game.use_animations)
    {
      //square(this.x * game.gridSize, this.y * game.gridSize, game.gridSize);
      let top_left_offset = game.jiggle.jiggle_grid[this.x][this.y];
      let top_right_offset = game.jiggle.jiggle_grid[this.x + 1][this.y];
      let bottom_left_offset = game.jiggle.jiggle_grid[this.x][this.y + 1];
      let bottom_right_offset = game.jiggle.jiggle_grid[this.x + 1][this.y + 1];
      let top_left_point = [this.x * game.gridSize, this.y * game.gridSize];
      let top_right_point = [(this.x + 1) * game.gridSize, this.y * game.gridSize];
      let bottom_left_point = [this.x * game.gridSize, (this.y + 1) * game.gridSize];
      let bottom_right_point = [(this.x + 1) * game.gridSize, (this.y + 1) * game.gridSize];
      beginShape();
      vertex(top_left_point[0] + top_left_offset[0], top_left_point[1] + top_left_offset[1]);
      vertex(top_right_point[0] + top_right_offset[0], top_right_point[1] + top_right_offset[1]);
      vertex(bottom_right_point[0] + bottom_right_offset[0], bottom_right_point[1] + bottom_right_offset[1]);
      vertex(bottom_left_point[0] + bottom_left_offset[0], bottom_left_point[1] + bottom_left_offset[1]);
      endShape(CLOSE);
    }
    else
    {
      square(this.x * game.gridSize, this.y * game.gridSize, game.gridSize);
    }
  }

  draw_this()
  {
    let grid_center_x = this.x * game.gridSize + game.GRID_HALF;
    let grid_center_y = this.y * game.gridSize + game.GRID_HALF;

    noStroke();

    // draw flash juice
    if (this.flashing && game.use_animations)
    {
      this.flash_radius += (deltaTime / this.flash_inc);
      this.flash_inc += 0.15;
      strokeWeight(game.GRID_HALF);
      noFill();
      let alph = map(this.flash_radius, 0, this.flash_radius_max, 75, 0);
      
      if (this.flash_radius > game.gridSize * 2)
      {
        stroke(this.r, this.g, this.b, alph * 0.3);
        ellipse(grid_center_x, grid_center_y, this.flash_radius * 0.3, this.flash_radius * 0.3);
      }

      if (this.flash_radius > game.gridSize * 2)
      {
        stroke(this.r, this.g, this.b, alph * 0.7);
        ellipse(grid_center_x, grid_center_y, this.flash_radius * 0.5, this.flash_radius * 0.5);
      }

      stroke(this.r, this.g, this.b, alph);
      ellipse(grid_center_x, grid_center_y, this.flash_radius, this.flash_radius);

      if (this.flash_radius > this.flash_radius_max)
      {
        this.flashing = false;
        this.flash_inc = random() + 1.5;
      }
    }

    this.anim_cycle += this.anim_speed / 6;
    if (this.anim_cycle > TWO_PI)
      this.anim_cycle = 0;

    noFill();

    if (this.correct)
    {
      strokeWeight(11);
      if (this.r == 255 & this.g == 255 & this.b == 255)
        stroke(60 + sin(this.anim_cycle * 2) * 40, 120);
      else
        stroke(130 + sin(this.anim_cycle * 2) * 40, 90);
      beginShape();
      let gx = this.x * game.gridSize;
      let gy = this.y * game.gridSize;
      vertex(gx + game.GRID_HALF, gy + game.GRID_QUARTER);
      vertex(gx + game.gridSize - game.GRID_QUARTER, gy + game.GRID_HALF);
      vertex(gx + game.GRID_HALF, gy + game.gridSize - game.GRID_QUARTER);
      vertex(gx + game.GRID_QUARTER, gy + game.GRID_HALF);
      endShape(CLOSE);
      
      strokeWeight(5);
      stroke(this.c);
      beginShape();
      vertex(gx + game.GRID_HALF, gy + game.GRID_QUARTER);
      vertex(gx + game.gridSize - game.GRID_QUARTER, gy + game.GRID_HALF);
      vertex(gx + game.GRID_HALF, gy + game.gridSize - game.GRID_QUARTER);
      vertex(gx + game.GRID_QUARTER, gy + game.GRID_HALF);
      endShape(CLOSE);
    }
    else
    {
      strokeWeight(8);
      if (this.r == 0 & this.g == 0 & this.b == 0)
        stroke(170, 100);
      else
        stroke(4, 100);
      
      rect(
            (this.x + 0.3) * game.gridSize, 
            (this.y + 0.3) * game.gridSize, 
            0.4 * game.gridSize, 
            0.4 * game.gridSize
      );

      strokeWeight(4);
      stroke(this.c);
      
      rect(
            (this.x + 0.3) * game.gridSize, 
            (this.y + 0.3) * game.gridSize, 
            0.4 * game.gridSize, 
            0.4 * game.gridSize
      );
    }

    if (this.correct && Math.random() < 0.015)
    {
      particle_system.particle_explosion
      (
        this.x * game.gridSize + game.GRID_HALF,
        this.y * game.gridSize + game.GRID_HALF,
        Math.floor(Math.random() * 8),
        this.c,
        250,
        100,
        9,
        1
      );
    }
    if (this.correct && Math.random() < 0.2)
    {
      particle_system.particle_explosion
      (
        this.x * game.gridSize + game.GRID_HALF,
        this.y * game.gridSize + game.GRID_HALF,
        Math.floor(Math.random() * 3),
        this.c,
        200,
        50,
        5,
        1
      );
    }

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
    this.anim_frame = 0;
    this.moved = false;

    this.animate_light_on = false;
    this.animate_light_on_timer = 0;
    this.animate_light_off = false;
    this.animate_light_off_timer = 0;

    this.dragged = false;
    this.viz_polygon = [];

    this.light_big_size = 5;
    this.light_small_size = 2;
    this.num_rings = 6;
    this.ring_ratio = int(100 / this.num_rings);
    this.total_width = this.light_big_size + ((this.num_rings + 1) * 2);
    this.half_total_width = int(this.total_width / 2);
    this.image_xoffset;
    this.image_yoffset;

    this.mask_image = createGraphics(game.gameWidth, game.gameHeight);
    this.mask_image.pixelDensity(1);
    this.mask_image_get;
    //this.mask_image = createGraphics(this.light_big_size * game.gridSize, this.light_big_size * game.gridSize);
    this.cur_image_source = createGraphics(game.gameWidth, game.gameHeight);
    this.cur_image_source_get;
    this.need_fresh_image = true;
    this.masked_light;
    //  this.masked_light_img = createImage(game.gameWidth, game.gameHeight);
    this.force_update = false;

    // This might not be the best way to do this but it could work for now?!
    // move this stuff to some color data structure
    this.c = color(r, g, b);
    this.shadow_color = color(r, g, b, 255 / 3);

    this.dark_light = color(r / 6, g / 6, b / 6, 60);
    this.med_light = color(r / 4, g / 4, b / 4, 70);

    this.selected_on_outside = color(max(120, r), max(120, g), max(120, b));
    this.selected_on_inside = color(max(150, r - 50), max(150, g - 50), max(150, b - 50));

    this.selected_off_outside = color(max(80, r - 70), max(80, g - 70), max(80, b - 70));
    this.selected_off_inside = color(max(50, r - 110), max(50, g - 110), max(50, b - 110));

    this.dark_outside = color(max(70, r / 2), max(70, g / 2), max(70, b / 2));
    this.dark_inside = color(max(60, r / 2 - 10), max(60, g / 2 - 10), max(60, b / 2 - 10));

    this.light_outside = color(max(100, r), max(100, g), max(100, b));
    this.light_inside = color(max(80, r - 30), max(80, g - 30), max(80, b - 30));

    this.ls_region = new mouse_region(x * game.gridSize, y * game.gridSize, 
                                      (x + 1) * game.gridSize, (y + 1) * game.gridSize);
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
    this.need_fresh_image = true;
    this.force_update = true;
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
    this.update_light_mask();
    this.force_update = true;
    this.need_fresh_image = true;

    // NOT RIGHT
    // we need somewhere (game handler?) to check if the old pos is the same as
    // the new pos. When old pos and new pos are the same for a certain amount of
    // frames, we'll stop the sound from playing?
    game.sound_handler.light_start_drag();
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
    game.sound_handler.light_stop_drag();
  }

  switch_active()
  {
    // don't work if we've given up!
    if (game.given_up)
      return;

    this.add_switch_to_undo_stack();
    this.update_light_mask();
    this.need_fresh_image = true;
    this.force_update = true;
    this.active = !this.active;

    if (this.active)
    {
      // we were inactive, now we're active
      game.sound_handler.play_sound("light_on");
      this.animate_light_on = true;
      this.animate_light_on_timer = 0;
    } 
    else
    {
      // we were active, now we're inactive
      game.sound_handler.play_sound("light_off");
      this.animate_light_off = true;
      this.animate_light_off_timer = 1;
    }
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

      beginShape();
      vertex(cx, cy);
      for (let i = 0; i < this.viz_polygon.length; ++ i)
      {
        vertex(this.viz_polygon[i].x, this.viz_polygon[i].y);
      }
      vertex(this.viz_polygon[0].x, this.viz_polygon[0].y);
      endShape();

      blendMode(BLEND);
    }
  }

  update_light_mask()
  {
    // console.log(`viz polygons: ${this.viz_polygon}`);
    // if (typeof this.viz_polygon === 'undefined') {
    //   this.get_new_viz_poly();
    // }
    this.need_fresh_image = true;
    let cx = this.x * game.gridSize + game.gridSize / 2;
    let cy = this.y * game.gridSize + game.gridSize / 2;
    this.mask_image.clear();
    this.mask_image.fill('rgba(0, 0, 0, 1)');
    if (this.viz_polygon.length === 0)
    {
      return;
    }
    this.mask_image.beginShape();
    this.mask_image.vertex(cx, cy);
    for (let i = 0; i < this.viz_polygon.length; ++ i)
    {
      this.mask_image.vertex(this.viz_polygon[i].x, this.viz_polygon[i].y);
    }
    this.mask_image.vertex(this.viz_polygon[0].x, this.viz_polygon[0].y);
    this.mask_image.endShape();

    // this.mask_image_get = this.mask_image.get();
  }

  get_light_mask()
  {
      // // light mask
      // let mask_image = createGraphics(game.gameWidth, game.gameHeight);
      // mask_image.fill('rgba(0, 0, 0, 1)');
      // mask_image.beginShape();
      // mask_image.vertex(cx, cy);
      // for (let i = 0; i < this.viz_polygon.length; ++ i)
      // {
      //   mask_image.vertex(this.viz_polygon[i].x, this.viz_polygon[i].y);
      // }
      // mask_image.vertex(this.viz_polygon[0].x, this.viz_polygon[0].y);
      // mask_image.endShape();
      return this.mask_image;
  }

  draw_this()
  {
    if (this.anim_cycle >= TWO_PI)
      this.anim_cycle = 0;
    this.anim_cycle += deltaTime / 500;
    if (this.active || this.animate_light_off)
    {
      blendMode(ADD);
      // noStroke();

      // let animsin = sin(this.anim_cycle) * 4;
      // let animcos = cos(this.anim_cycle) * 4;

      let large_circle_size = game.gridSize * this.light_big_size; // + animsin;
      let small_circle_size = game.gridSize * this.light_small_size; // + animcos;

      if (this.animate_light_on)
      {
        // skip light growing animation for now
        this.animate_light_on_timer = 1;

        this.need_fresh_image = true;
        large_circle_size *= this.animate_light_on_timer;
        small_circle_size *= this.animate_light_on_timer;
        this.animate_light_on_timer += (deltaTime / 128);
        this.dark_light.setAlpha(80 * this.animate_light_on_timer);
        this.med_light.setAlpha(110 * this.animate_light_on_timer);
        if (this.animate_light_on_timer >= 1)
        {
          this.animate_light_on_timer = 0;
          this.animate_light_on = false;
        }
      }
      
      if (this.animate_light_off)
      {
        this.need_fresh_image = true;
        large_circle_size *= this.animate_light_off_timer;
        small_circle_size *= this.animate_light_off_timer;
        this.animate_light_off_timer -= (deltaTime / 128);
        this.dark_light.setAlpha(80 * this.animate_light_off_timer);
        this.med_light.setAlpha(110 * this.animate_light_off_timer);
        if (this.animate_light_off_timer <= 0)
        {
          this.animate_light_off_timer = 0;
          this.animate_light_off = false;
        }
      }

      if (this.force_update)
      {
        this.force_update = false;
        this.anim_frame = 0;
      }

      if (this.anim_frame === 0 || this.animate_light_on || this.animate_light_off)
      {
        // want to mask this by our drawn viz polygons
        this.cur_image_source.clear();
        this.cur_image_source.noStroke();
        for (let ring = this.num_rings; ring > 0; --ring)
        {
          let r_size = ring * game.gridSize * 2;
          this.cur_image_source.fill(this.dark_light, 100 - ring * this.ring_ratio);
          this.cur_image_source.ellipse(this.x * game.gridSize + game.GRID_HALF, this.y * game.gridSize + game.GRID_HALF, large_circle_size + r_size , large_circle_size + r_size);
  
        }
        this.cur_image_source.fill(this.dark_light);
        this.cur_image_source.ellipse(this.x * game.gridSize + game.GRID_HALF, this.y * game.gridSize + game.GRID_HALF, large_circle_size , large_circle_size);
    
        this.cur_image_source.fill(this.med_light);
        this.cur_image_source.ellipse(this.x * game.gridSize + game.GRID_HALF, this.y * game.gridSize + game.GRID_HALF, small_circle_size, small_circle_size);
    
        if (this.need_fresh_image)
          this.cur_image_source_get = this.cur_image_source.get();

        (this.masked_light = this.cur_image_source_get).mask(this.mask_image); 
      }
      this.anim_frame += deltaTime;

      if (this.anim_frame > 200)
        this.anim_frame = 0;

      image(this.masked_light, 0, 0);

      if (this.need_fresh_image)
        this.need_fresh_image = false;

      blendMode(BLEND);
    }
    strokeWeight(4);
    fill(0);
    stroke(0, 70);
    ellipse(this.x * game.gridSize + (game.gridSize / 2), this.y * game.gridSize + (game.gridSize / 2), game.gridSize * 0.7, game.gridSize * 0.7);

  
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
    ellipse(this.x * game.gridSize + (game.gridSize / 2), this.y * game.gridSize + (game.gridSize / 2), game.gridSize * 0.6, game.gridSize * 0.6);
  }

  end_light_mouse_handler()
  {
    game.global_mouse_handler.disable_region(this.name);
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

    this.sx_grid = jiggle.get_index(sx); //int(sx / game.gridSize);
    this.sy_grid = jiggle.get_index(sy); //int(sy / game.gridSize);
    this.ex_grid = jiggle.get_index(ex); //int(ex / game.gridSize);
    this.ey_grid = jiggle.get_index(ey); //int(ey / game.gridSize);
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

// TODO: Refactor
// Should have a floor animation runner and then floors have functions
// and optionally take parameters. This way of doing it right now isn't the best
class floor_animation
{
  constructor(xsize, ysize)
  {
    this.xsize = xsize;
    this.ysize = ysize;
    // TODO: What is the difference between anim_timer and
    // animation frame? Do they need to be different things?
    this.anim_timer = 0;
    this.jiggle_animation_color = [...Array(this.xsize)].map(e => Array(this.ysize).fill(48));
    this.jiggle_animation_buffer = [...Array(this.xsize)].map(e => Array(this.ysize).fill(0));

    this.base_floor_animation = Math.floor(Math.random() * 2);
    this.update_count = 0;

    this.has_animation = false;
    this.animation_type;
    this.animation_frame = 0;
    this.animation_max_frames = 0;
    this.animation_array = [...Array(this.xsize)].map(e => Array(this.ysize).fill(0));
    this.num_animations = 8;
    this.animation_lengths = [12, 12, 12, 10, 12, 10, 12, 10];
    this.animation_fading = false;
    this.bright_mode = false;

    this.x_target;
    this.y_target;
    
    this.update();
  }

  clear_animation_array()
  {
    for (let x = 0; x < this.xsize; ++x)
    {
      for (let y = 0; y < this.ysize; ++y)
      {
        this.animation_array[x][y] = 0;
      }
    }
  }

  start_animation()
  {
    // only allow one animation at a time
    if (this.has_animation || this.animation_fading)
      return;

    this.has_animation = true;
    this.animation_frame = 0;
    this.clear_animation_array();
    this.bright_mode = false;

    this.animation_type = Math.floor(Math.random() * this.num_animations);
  
    // this.animation_type = 7;
    // console.log(`new animation type ${this.animation_type}`);
    if (this.animation_type === 4)
    {
      this.x_target = mouseX / game.gridSize;
      this.y_target = mouseY / game.gridSize;
    }

    if (this.animation_type === 7)
    {    
      let rand_col = [0, 75];
      for (let x = 0; x < this.xsize; ++x)
      {
        for (let y = 0; y < this.ysize; ++y)
        {
          this.animation_array[x][y] = random(rand_col);
        }
      }
    }
  }

  fade_animation_array()
  {
    // Once we're done our animation, return all animation entries back to
    // zero so the board fades back to it's original state.
    let did_update = false;
    for (let x = 0; x < this.xsize; ++x)
    {
      for (let y = 0; y < this.ysize; ++y)
      {
        if (Math.floor(this.animation_array[x][y]) > 0)
        {
          this.animation_array[x][y] *= 0.9;
          did_update = true;
        }
      }
    }
    if (!did_update)
    {
      // If we didn't update any values on our loop through the animation array,
      // we've zeroed all the entries, so we're done fading.
      this.animation_fading = false;
    }

  }

  get_color(x, y)
  {
    return color(this.jiggle_animation_color[x][y], 70);
  }

  do_floor_target_animation(x_target, y_target)
  {
    this.has_animation = true;
    this.animation_frame = 0;
    this.clear_animation_array();
    this.bright_mode = true;
    
    this.animation_type = 4;
    this.x_target = x_target;
    this.y_target = y_target;
  }

  update()
  {
    // This is the base floor animation
    // TODO: Case this out to have various floor idle animations
    this.anim_timer += deltaTime / 256;
    this.update_count += deltaTime;
    if (this.update_count < 75)
      return;

    this.update_count = 0;

    let target_col;
    for (let x = 0; x < this.xsize; ++x)
    {
      for (let y = 0; y < this.ysize; ++y)
      {
        switch (this.base_floor_animation)
        {
          case 0:
            target_col = 32 + sin(x + y + this.anim_timer / 2) * 16;
            break;
          case 1:
            target_col = 64 + (abs((sin(y + (x * 2) + this.anim_timer / 4) + 0.5)  
                          + noise(x * 0.01, y * 0.01) / 32) * 32);
            break;
        }
        // target_col = 64 + (abs((sin(y + (x * 2) + this.anim_timer / 4) + 0.5)  
        // + noise(x * 0.01, y * 0.01) / 32) * 32);
        //  target_col = 32 + sin(x + y + this.anim_timer / 2) * 16;
        this.jiggle_animation_color[x][y] = target_col;
      }
    }
    
    // if we have an animation, run some animation frames
    if (this.has_animation)
    {
      this.update_animation();
      this.apply_animation();
    }

    if (this.animation_fading)
    {
      this.fade_animation_array();
      this.apply_animation();
    }

    // TODO: Make this a variable somewhere to play around with different amount
    // of bg animation.
    if (Math.random() < 0.002)  // 0.005
    {
      this.start_animation();
    }

  }

  update_animation()
  {

    this.animation_frame += deltaTime / 128;
    if (this.animation_frame > this.animation_lengths[this.animation_type])
    {
      // If we're finished animating, start fading out
      this.has_animation = false;
      this.animation_fading = true;
    }

    // temp_var is just something we can use in our calculations
    let temp_var;

    let half_grid_width = int(game.gridWidth / 2);
    let x_dist, y_dist, x_sqr, y_sqr;
    let reverse_time = this.animation_lengths[this.animation_type] - this.animation_frame;

    for (let x = 0; x < this.xsize; ++x)
    {
      for (let y = 0; y < this.ysize; ++y)
      {
        switch (this.animation_type)
        {
          // upwards wave
          case 0:
            temp_var = this.animation_array[x][y];
            if (y < this.ysize - 1)
            {
              temp_var = this.animation_array[x][y + 1];
              this.animation_array[x][y + 1] = this.animation_array[x][y + 1] * 0.7;
            }
            else
            {
              if (this.animation_frame < 6)
              {
                if (Math.random() < 0.3)
                  temp_var = Math.floor(Math.random() * 90);
              }
            }
            this.animation_array[x][y] = temp_var;
            break;

          // R to L wave
          case 1:
            temp_var = this.animation_array[x][y];
            if (x < this.xsize - 1)
            {
              temp_var = this.animation_array[x + 1][y];
              this.animation_array[x + 1][y] = this.animation_array[x  + 1][y] * 0.7;
            }
            else
            {
              if (this.animation_frame < 6)
              {
                if (Math.random() < 0.3)
                  temp_var = Math.floor(Math.random() * 90);
              }
            }
            this.animation_array[x][y] = temp_var;
            break;
        
          // downwards wave
          case 2:
            let yb = this.ysize - y;
            temp_var = this.animation_array[x][yb];
            if (yb > 1)
            {
              temp_var = this.animation_array[x][yb - 1];
              this.animation_array[x][yb - 1] = this.animation_array[x][yb - 1] * 0.7;
            }
            else
            {
              if (this.animation_frame < 6)
              {
                if (Math.random() < 0.3)
                  temp_var = Math.floor(Math.random() * 90);
              }
            }
            this.animation_array[x][yb] = temp_var;
            break;
        
          // twinkles
          case 3:
            temp_var = this.animation_array[x][y];
            if (this.animation_frame < 8 && Math.random() < 0.1)
                temp_var = Math.floor(Math.random() * 90);
            temp_var *= 0.7;
            this.animation_array[x][y] = temp_var;
            break;

          // circle in
          case 4:
            x_dist = this.x_target - x;
            y_dist = this.y_target - y;
            x_sqr = x_dist * x_dist;
            y_sqr = y_dist * y_dist;
            let calculated_radius = Math.sqrt(x_sqr + y_sqr);
            let in_r = (calculated_radius < (half_grid_width / this.animation_frame) * 2) && 
                      !(calculated_radius < (half_grid_width / this.animation_frame));
            this.animation_array[x][y] = in_r ? calculated_radius * 5 : 0;
            if (this.bright_mode)
              this.animation_array[x][y] *= 4;
            break;
        
          // zap
          case 5:
            temp_var = this.animation_array[x][y];
            if (temp_var < 10 && this.animation_frame < 6 && Math.random() < 0.8)
              temp_var = reverse_time * 8;
            temp_var *= 0.9;
            this.animation_array[x][y] = temp_var;
            break;

          case 6:
            temp_var = this.animation_array[x][y];
            if (this.animation_frame < 8)
            {
              if ((x + y) % 2 === 0 && Math.random() < 0.1)
                temp_var = Math.floor(Math.random() * 127);
              // if (temp_var < 20 && Math.random() < 0.05)
              //   temp_var = Math.floor(Math.random() * 127);
              if (x < this.xsize - 1 && Math.random() < 0.05)
                this.animation_array[x + 1][y] = (this.animation_array[x + 1][y] + temp_var) / 2;
              if (y < this.ysize - 1 && Math.random() < 0.05)
                this.animation_array[x][y + 1] = (this.animation_array[x][y + 1] + temp_var) / 2;
            }
            this.animation_array[x][y] = temp_var * 0.92;
            break;

          case 7:
            // game of life
            let cell_count = 0;
            let xa, ya;
            for (let xoff = -1; xoff <= 1; ++xoff)
            {
              for (let yoff = -1; yoff <= 1; ++yoff)
              {
                if (xoff === 0 && yoff === 0)
                  continue;

                xa = x + xoff;
                ya = y + yoff;
                if (xa < 0 || xa > this.xsize - 1 ||
                    ya < 0 || ya > this.ysize - 1)
                    continue;

                cell_count += (this.animation_array[xa][ya] > 0 ? 1 : 0);
              }
            }
            // console.log(`cell_count ${cell_count}`);
            if (this.animation_array[x][y] === 0)
            {
              if (cell_count === 3)
              {
                this.jiggle_animation_buffer[x][y] = Math.floor(Math.random() * 40 + 40);
              }
            }
            else /* if (this.animation_array[x][y] === 90) */
            {
              if (cell_count < 2)
              {
                this.jiggle_animation_buffer[x][y] = 0;
                // console.log("cell dies of loneliness");
              }
              if (cell_count > 3)
              {
                this.jiggle_animation_buffer[x][y] = 0;
                // console.log("cell dies of overcrowding");
              }
            }
            break;
        }
      }
    }

    // after all individual animations, any frames can happen here
    if (this.animation_type === 7)
    {
      // this.animation_array = this.jiggle_animation_buffer;
      // console.log("updating animation buffer");
      this.animation_array = this.jiggle_animation_buffer.map((arr) => {
        return arr.slice()
      });
    }
  }

  apply_animation()
  {
    // apply animation array to line colors;
    for (let x = 0; x < this.xsize; ++x)
    {
      for (let y = 0; y < this.ysize; ++y)
      {
        this.jiggle_animation_color[x][y] += this.animation_array[x][y];
      }
    }
  }
}

class jiggle
{
  static jiggle_timer = 0;

  // memoize grid divisions
  static index_memo = {};
  constructor(xsize, ysize)
  {
    this.xsize = xsize;
    this.ysize = ysize;
    this.jiggle_grid = [];
    for (let x = 0; x < this.xsize; ++x)
    {
      this.jiggle_grid[x] = [];
      let double_jiggle = game.JIGGLE_CONSTRAINT * 2;
      for (let y = 0; y < this.ysize; ++y)
      {
        this.jiggle_grid[x][y] = [Math.random() * double_jiggle - game.JIGGLE_CONSTRAINT, 
                                  Math.random() * double_jiggle - game.JIGGLE_CONSTRAINT];
      }
    }
  }

  // convert to jiggle_index
  static get_index(num)
  {
    if (this.index_memo[num] === undefined)
    {
      this.index_memo[num] = int(num / game.gridSize);
    }
    return this.index_memo[num];
  }

  update_jiggles()
  {
    if (jiggle.jiggle_timer < 45)
    {
      jiggle.jiggle_timer += deltaTime;
      return;
    }
    jiggle.jiggle_timer = 0;


    let jiggle_x, jiggle_y;
    for (let x = 0 ; x < this.xsize; ++x)
    {
      for (let y = 0; y < this.ysize; ++y)
      {
        [jiggle_x, jiggle_y] = this.jiggle_grid[x][y];
        jiggle_x += Math.random() * 2 - 1;
        jiggle_y += Math.random() * 2 - 1;
        // jiggle_x = constrain(jiggle_x, -game.JIGGLE_CONSTRAINT, game.JIGGLE_CONSTRAINT);
        // jiggle_y = constrain(jiggle_y, -game.JIGGLE_CONSTRAINT, game.JIGGLE_CONSTRAINT);
        if (jiggle_x < -game.JIGGLE_CONSTRAINT)
          jiggle_x = -game.JIGGLE_CONSTRAINT;
        if (jiggle_x > game.JIGGLE_CONSTRAINT)
          jiggle_x = game.JIGGLE_CONSTRAINT;
        if (jiggle_y < -game.JIGGLE_CONSTRAINT)
          jiggle_y = -game.JIGGLE_CONSTRAINT;
        if (jiggle_y > game.JIGGLE_CONSTRAINT)
          jiggle_y = game.JIGGLE_CONSTRAINT;
        this.jiggle_grid[x][y] = [jiggle_x, jiggle_y];
      }
    }
  }

  // jiggle_wave()
  // {
  //   // let jiggle_x, jiggle_y;
  //   // for (let x = 0 ; x < this.xsize; ++x)
  //   // {
  //   //   for (let y = 0; y < this.ysize; ++y)
  //   //   {
  //   //     [jiggle_x, jiggle_y] = this.jiggle_grid[x][y];
  //   //     jiggle_y *= sin(x + this.anim_time / 100) / 2;
  //   //     this.jiggle_grid[x][y] = [jiggle_x, jiggle_y];
  //   //   }
  //   // }
  // }
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
  constructor(x, y, c, x_vel, y_vel, lifetime, particle_type=0)
  {
    this.x = x;
    this.y = y;
    this.color = color(red(c), green(c), blue(c));
    this.x_vel = x_vel;
    this.y_vel = y_vel;
    this.lifetime = lifetime;
    this.life = 0;
    this.active = true;
    this.particle_type = particle_type;
    this.oldx = x;
    this.oldy = y;
    this.sub_type = Math.floor(Math.random() * 6);
    // this.origin_x = x;
    // this.origin_y = y;
    this.path_points = Math.floor(Math.random() * 6 + 5);
    this.path = [];
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

    if (this.path.length === this.path_points)
    {
      this.path.shift();
    }

    if (this.path.length < this.path_points)
    {
      this.path.push([this.x, this.y]);
    }

    let rand_scale = this.life / 64;
    // cool effect 1
    // this.sub_type = 2;
    switch (this.sub_type)
    {
      case 0:
        this.x_vel = this.x_vel * 1.02 + ((Math.random() * 2 - 1) * rand_scale);
        this.y_vel = this.y_vel * 1.02 + ((Math.random() * 2 - 1) * rand_scale);
        break;
      case 1:
        this.x_vel = this.x_vel * 0.9 + ((Math.random() * 2 - 1) * rand_scale);
        this.y_vel = this.y_vel * 0.9 + ((Math.random() * 2 - 1) * rand_scale);
        break;
      case 2:
        this.x_vel *= 0.6 + ((Math.random() * 2 - 1) * rand_scale / 4);
        this.y_vel *=  0.6 + ((Math.random() * 2 - 1) * rand_scale / 4);
        break;
      case 3:
        this.x_vel *= Math.abs(sin(this.x));
        this.y_vel *= Math.abs(cos(this.y));
        break;
      case 4:
        // no transformation
        break
      case 5:
        this.x_vel
      // case 4:
      //   this.x_vel 
    }


    this.oldx = this.x;
    this.oldy = this.y;
    let cur_x_grid = int(this.x / game.gridSize);
    cur_x_grid = constrain(cur_x_grid, 0, game.gridWidth - 1);
    let cur_y_grid = int(this.y / game.gridSize);
    cur_y_grid = constrain(cur_y_grid, 0, game.gridHeight - 1);

    this.x += this.x_vel;
    this.x = constrain(this.x, 0, game.gameWidth);

    this.y += this.y_vel;
    this.y = constrain(this.y, 0, game.gameHeight);

    let target_x_grid = int(this.x / game.gridSize);
    target_x_grid = constrain(target_x_grid, 0, game.gridWidth - 1);
    let target_y_grid = int(this.y / game.gridSize);
    target_y_grid = constrain(target_y_grid, 0, game.gridHeight - 1);
    // ricochet particles off existing walls
    // We do this by bouncing off x and y separately to preserve momentum correctly
    // then, if we are in a target, do some naive collision resolution
    if (target_y_grid < 0 ||
      target_y_grid > game.gridHeight ||
      (game.current_level.grid[cur_x_grid][target_y_grid] &&
        game.current_level.grid[cur_x_grid][target_y_grid].exist))
    {
      this.y_vel = -this.y_vel;
      this.y += this.y_vel;
    }
    if (target_x_grid < 0 ||
      target_x_grid > game.gridWidth ||
      (game.current_level.grid[target_x_grid][cur_y_grid] &&
      game.current_level.grid[target_x_grid][cur_y_grid].exist))
    {
      this.x_vel = -this.x_vel;
      this.x += this.x_vel;
    }
  }

  draw()
  {
    let alph_amount = map(this.life, 0, this.lifetime, 200, 10);
    this.color.setAlpha(alph_amount);

    if (this.particle_type === 0)
    {
      let p_size = map(this.life, 0, this.lifetime, 20, 1);
      fill(this.color);
      noStroke();
      ellipse(this.x, this.y, p_size, p_size);
    }
    else if (this.particle_type === 1)
    {
      stroke(0, alph_amount);
      strokeWeight(2);
      beginShape(LINES);
      this.path.forEach(path_entry => {
        vertex(path_entry[0], path_entry[1]);
      });
      endShape();
      // strokeWeight(1);
      // line(this.x, this.y, (this.x + this.origin_x) / 2, (this.y + this.origin_y) / 2);


      strokeWeight(4);
      // noFill();
      line(this.x, this.y, this.oldx, this.oldy);

      stroke(this.color);
      strokeWeight(1);
      beginShape(LINES);
      this.path.forEach(path_entry => {
        vertex(path_entry[0], path_entry[1]);
      });
      endShape();
      // strokeWeight(1);
      // line(this.x, this.y, (this.x + this.origin_x) / 2, (this.y + this.origin_y) / 2);


      strokeWeight(3);
      // noFill();
      line(this.x, this.y, this.oldx, this.oldy);
    }
  }
}

class particle_system
{
  static particles = [];
  static MAX_PARTICLES = 512;

  static update_particles()
  {
    if (!game.use_animations)
      return;
    for (let i = particle_system.particles.length - 1; i >= 0; i--)
    {
      particle_system.particles[i].update();
      if (!particle_system.particles[i].active)
      {
        particle_system.particles.splice(i, 1);
      }
    }
  }

  static clear_particles()
  {
    particle_system.particles = [];
  }

  static draw_particles()
  {
    if (!game.use_animations)
      return;

    //blendMode(ADD);
    for (let p of particle_system.particles)
    {
      p.draw();
    }
    //blendMode(BLEND);

  }

  static add_particle(p)
  {
    if (particle_system.particles.length < particle_system.MAX_PARTICLES)
      particle_system.particles.push(p);
  }

  static particle_explosion(x, y, amount, color, max_life, spread, max_speed, particle_type=0)
  {
    for (let _ = 0; _ < amount; ++_)
    {
      let xrand = Math.random() * game.gridSize - game.GRID_HALF;
      let yrand = Math.random() * game.gridSize - game.GRID_HALF;
      let p = new particle(
        x + xrand, 
        y + yrand, 
        color, 
        (random() * (max_speed * 2) - max_speed) * 2, 
        (random() * (max_speed * 2) - max_speed) * 2, 
        max_life + random(spread),
        particle_type);
      particle_system.add_particle(p);
    }
  }

}

class sound
{
  // no intro sound since sound can't play until the user has interacted with
  // the sketch!

  constructor()
  {
    this.use_drag_sounds = false;
    this.sounds = {};
    this.drag_sound = undefined;
    this.need_init_audio_context = true;
  }

  check_play_sound()
  {
    // make sure we have a valid audio context before we allow a sound
    // to play!
    // return (getAudioContext().state === 'running');
    if (!game.sounds_enabled)
      return false;
    return !this.need_init_audio_context;
  }

  play_sound(name)
  {
    if (!this.check_play_sound())
      return;
    this.sounds[name].play();
  }

  light_start_drag()
  {
    if (!this.use_drag_sounds)
      return;
    // this one has to be special because it's a loop?
    if (!this.drag_sound.isPlaying())
      this.drag_sound.play();
  }

  light_stop_drag()
  {
    if (!this.use_drag_sounds)
      return;
    this.drag_sound.stop();
  }

  play_build_wall()
  {
    // choose from one of the random wall building sounds
    let rand_build_str = `build_wall_${Math.floor(Math.random() * 3) + 1}`;
    this.play_sound(rand_build_str);
  }

  play_destory_wall()
  {
    // choose from one of the random wall destruction sounds
    this.play_sound("remove_wall");
  }
}

// p5 additional functions
p5.Graphics.prototype.remove = function() {
  if (this.elt.parentNode) {
    this.elt.parentNode.removeChild(this.elt);
  }
  var idx = this._pInst._elements.indexOf(this);
  if (idx !== -1) {
    this._pInst._elements.splice(idx, 1);
  }
  for (var elt_ev in this._events) {
    this.elt.removeEventListener(elt_ev, this._events[elt_ev]);
  }
};

// p5.Graphics.prototype.mask = function(inputMask) {
  
//   if (inputMask === undefined) {
//     inputMask = this;
//   }
//   const currBlend = this.drawingContext.globalCompositeOperation;

//   let scaleFactor = 1;
//   if (inputMask instanceof p5.Renderer) {
//     scaleFactor = inputMask._pInst._pixelDensity;
//   }

//   const copyArgs = [
//     inputMask,
//     0,
//     0,
//     scaleFactor * inputMask.width,
//     scaleFactor * inputMask.height,
//     0,
//     0,
//     this.width,
//     this.height
//   ];

//   this.drawingContext.globalCompositeOperation = 'destination-in';
//   p5.Renderer2D.prototype.copy.apply(this, copyArgs);
//   this.drawingContext.globalCompositeOperation = currBlend;

// }

function mousePressed() {
  // TODO: Only do this once
  if (game.sound_handler.need_init_audio_context)
  {
    userStartAudio();
    game.sound_handler.need_init_audio_context = false;
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

  //spectro_font = loadFont('assets/LemonMilk.otf');
  spectro_font = loadFont('assets/ChildsHand.ttf');
  // load all of our sounds in preload since it might take a moment, and this
  // should (in theory) mitigate the errors (but it doesn't)
  game.sound_handler = new sound();

  soundFormats('wav', 'mp3');  // todo: make these sounds mp3/wav so the browser can use
                        // whichever format is easier!
  game.sound_handler.sounds["menu_hover"] = loadSound('assets/sounds/menu_hover');
  game.sound_handler.sounds["menu_click"] = loadSound('assets/sounds/menu_click');
  game.sound_handler.sounds["light_on"] = loadSound('assets/sounds/light_on');
  game.sound_handler.sounds["light_off"] = loadSound('assets/sounds/light_off');
  game.sound_handler.sounds["next_level_clicked"] = loadSound('assets/sounds/next_level_clicked');
  game.sound_handler.drag_sound = loadSound('assets/sounds/light_moving');
  // game.sound_handler.sounds["drag_sound"] = loadSound('assets/sounds/light_moving');
  // game.sound_handler.sounds["drag_sound"].setVolume(0.2);
  game.sound_handler.sounds["detector_on"] = loadSound('assets/sounds/detector_on');

  // // TODO sounds:
  game.sound_handler.sounds["build_wall_1"] = loadSound('assets/sounds/build_wall_1');
  game.sound_handler.sounds["build_wall_2"] = loadSound('assets/sounds/build_wall_2');
  game.sound_handler.sounds["build_wall_3"] = loadSound('assets/sounds/build_wall_3');
  game.sound_handler.sounds["build_wall_1"].setVolume(0.3);
  game.sound_handler.sounds["build_wall_2"].setVolume(0.3);
  game.sound_handler.sounds["build_wall_3"].setVolume(0.3);
  game.sound_handler.sounds["remove_wall"] = loadSound('assets/sounds/remove_wall');
  game.sound_handler.sounds["remove_wall"].setVolume(0.3);
  
}

function setup() {
  if (getItem("played_before") === null)
  {
    storeItem("played_before", true);
    game.first_time_playing = true;
  }
  else
  {
    game.first_time_playing = false;
  }

  // check for saved options
  if (getItem("use_animations") === null)
  {
    game.use_animations = true;
    storeItem("use_animations", true);
  }
  else
  {
    game.use_animations = getItem("use_animations");
  }

  if (getItem("sounds_enabled") === null)
  {
    game.sounds_enabled = false;
    storeItem("sounds_enabled", false);
  }
  else
  {
    game.sounds_enabled = getItem("sounds_enabled");
  }

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

  game.jiggle = new jiggle(game.gridWidth + 1, game.gridHeight + 1);
  game.floor_animation = new floor_animation(game.gridWidth + 1, 
    game.gridHeight + 1)

  game.GRID_HALF = int(game.gridSize / 2);
  game.GRID_QUARTER = int(game.GRID_HALF / 2);
  game.FLASH_SIZE = game.gridSize * 8;

  font_size = int(game.gridSize * 0.8);

  // setup is called once at the start of the game
  cnv = createCanvas(game.gameWidth, game.gameHeight);
  // frameRate(120);
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

  game.GRID_HALF = int(game.gridSize / 2);
  game.GRID_QUARTER = int(game.GRID_HALF / 2);
  game.FLASH_SIZE = game.gridSize * 8;
  font_size = game.gridSize * 0.8;

  resizeCanvas(game.gameWidth, game.gameHeight);
  centerCanvas();

  // reposition_all_buttons();  // THIS is going to require some rewrites
  let new_scale = largest_dim / game.current_dim;
  game.global_mouse_handler.scale_regions(new_scale);
  scale_all_edges(new_scale);
  game.current_dim = largest_dim;

  // if we are currently in a game, update game specific info.
  if (game.current_gamemode !== undefined)
  {
    update_all_light_viz_polys();
    do_game();
  }
}

function initialize_colors() {
  palette.solid_wall_fill = color(155, 155, 170);
  palette.solid_wall_permenant_fill = color(160, 160, 170);
  palette.solid_wall_outline = color(120, 120, 120);

  palette.buildable_fill = color(37, 37, 41);
  palette.buildable_2_fill = color(45, 45, 49);
  palette.buildable_outline = color(19, 19, 23);

  palette.empty_outline = color(2, 2, 2);
  palette.empty_fill = color(13, 13, 13);

  palette.edge_color = color(70, 70, 80);
  palette.edge_circle_color = color(60, 60, 70);

  palette.font_color = color(215, 215, 215);
  palette.bright_font_color = color(157, 157, 157);

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
      let reg = new mouse_region(2 * game.gridSize, (i + 1) * game.gridSize * 2, (2 + m.length) * game.gridSize, (i + 2) * game.gridSize * 2);
      reg.events[mouse_events.CLICK] = () => {
        game.sound_handler.play_sound("menu_click");
        handle_main_menu_selection(int(game.global_mouse_handler.my / (game.gridSize * 2)) - 1);
      }
      reg.events[mouse_events.ENTER_REGION] = () => {
        menus.main_menu_selected = int(game.global_mouse_handler.my / (game.gridSize * 2)) - 1;
        game.sound_handler.play_sound("menu_hover");
      };
      reg.events[mouse_events.EXIT_REGION] = () => {
          // menus.main_menu_selected = undefined; 
      };
      game.global_mouse_handler.register_region(m + "main_menu", reg);
      ++i;
    }

    let easter_egg_region = new mouse_region(game.gridSize * 2, game.gridSize, game.gridSize * 7, game.gridSize * 3);
    easter_egg_region.events[mouse_events.CLICK] = () => {
      if (getItem("savedgame") === null)
        solvable_random_level(/*save=*/false, 
                              /*showcase=*/true);
    };
    game.global_mouse_handler.register_region("eegg", easter_egg_region);

    states.need_setup_main_menu = false;
  }
  disable_menu(); // disable the top menu in case it is active
  enable_main_menu();
  // random_level();
  game.have_saved_game = (getItem("savedgame") !== null);
  
  if (game.need_load_menu_map)
  {
    if (game.have_saved_game) {
      try_load_level(getItem("savedgame"));
      update_all_light_viz_polys();
    } else {
      init_light_sources();
      solvable_random_level(/*save=*/false, 
                            /*showcase=*/true);
    }
    game.need_load_menu_map = false;
  }

  // various things that have to be done before
  // a level can be properly displayed.
  // Maybe roll this into level loading or something since
  // it always has to be done when a level is loaded.
  for (let l of game.lightsources)
  {
    l.update_light_mask();
  }

  for (let d of game.detectors)
  {
    d.check_color();
  }
  
  game.game_state = states.MAIN_MENU;
  game.floor_animation.start_animation();
}

function do_main_menu()
{
  // IF the user hasn't played before, let's show a pop-up box
  // suggesting they play the tutorial
  if (game.first_time_playing)
  {
    game.first_time_playing = false;  // only show tutorial once
    teardown_main_menu();
    game.current_gamemode = game.GAMEMODE_TUTORIAL;
    game.game_state = states.TUTORIAL_GAME_INTRO;
    return;
  }
  
  game.current_gamemode = undefined;
  fill(37);
  rect(0, 0, width, height);

  draw_menu_background();

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

  // if ((mouseY <= game.gridSize * 2) || (mouseY >= game.gridSize * 2 * (menus.main_menu_options.length + 1)))
  //   menus.main_menu_selected = undefined;

  if (mouseX >= game.gridSize * 12 || (mouseY >= game.gridSize * 2 * (menus.main_menu_options.length + 1)))
    menus.main_menu_selected = undefined;

  for (let m of menus.main_menu_options)
  {
    if (menus.main_menu_selected === i)
      fill(253);
    else
      fill(157);

    if (i === 1 && !game.have_saved_game)
      fill(57);

    text(m, (game.gridWidth - 17) * game.gridSize, (i + 2) * game.gridSize * 2);
    ++i;
  }
}

function draw_menu_background()
{
  game.jiggle.update_jiggles();
  game.floor_animation.update();
  for (let d of game.detectors)
  {
    d.check_color();
  }
  draw_walls_and_floors();
  draw_detector_floors();
  draw_light_sources(); 
  particle_system.update_particles();
  particle_system.draw_particles();
  draw_detectors(); 
  draw_floor_lines();
  draw_edges();
}

function enable_main_menu()
{
  for (let m of menus.main_menu_options)
  {
    game.global_mouse_handler.enable_region(m + "main_menu");
  }
  game.global_mouse_handler.enable_region("eegg");
}

function teardown_main_menu()
{
  // disable main menu options
  for (let m of menus.main_menu_options)
  {
    game.global_mouse_handler.disable_region(m + "main_menu");
  }
  game.global_mouse_handler.disable_region("eegg");
}

function handle_main_menu_selection(menu_index)
{
  switch (menu_index)
  {
    case 0:
      // confirm we want a new game
      storeItem("savedgame", null);
      game.current_gamemode = game.GAMEMODE_RANDOM;
      game.game_state = states.NEW_GAME;
      break;
    case 1:
      if (!game.have_saved_game)
        return;
      game.current_gamemode = game.GAMEMODE_RANDOM;
      game.game_state = states.NEW_GAME;
      break; 
    case 2:
      game.current_gamemode = game.GAMEMODE_TIME;
      game.game_state = states.NEW_GAME;
      break;
    case 3:
      game.game_state = states.SETUP_OPTIONS;
      break;
    case 4:
      game.game_state = states.SETUP_ABOUT;
      break;
  }
  teardown_main_menu();
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
   "Programming, etc.: Tyler Weston\n" +
   "Based on Javidx9's line of sight vid.\n" +
   "Thanks to Warren Sloper for testing\n" +
   "and Jane Haselgrove for all the pizza.\n";

  //stroke(130);
  textSize(font_size);
  textAlign(TOP, TOP);
  noStroke();
  blendMode(ADD);
  fill(255, 0, 0);
  text(s, game.gridSize * 4, game.gridSize * 4);
  fill(0, 255, 0);
  text(s, game.gridSize * 4, game.gridSize * 4 + 2);
  fill(0, 0, 255);
  text(s, game.gridSize * 4, game.gridSize * 4 + 4);


  blendMode(BLEND);

  if (over_about_ok_btn)
  {
    noStroke();
    fill(255, 20);
    let xpos = width / 2;
    let ypos = height - 4.25 * game.gridSize;
    xpos += sin(game.ok_btn_animation_timer / 2) * 8;
    ypos += cos(game.ok_btn_animation_timer + ypos) * 8;
    game.ok_btn_animation_timer += deltaTime / 64;
    if (game.ok_btn_animation_timer > TWO_PI)
    {
      game.ok_btn_animation_timer = 0;
    }
    ellipse(xpos, ypos, game.gridSize * 2, game.gridSize * 2);

    fill(255);
  }
  else 
  {
    fill(0);
    game.ok_btn_animation_timer = 0;
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
        // it will be a region that will contain sub-regions for each menu option?
        let i = 0;
        for (let m of menus.option_options)
        {
          let reg = new mouse_region(0, (i + 1) * game.gridSize * 2, game.gridSize * game.gridWidth, (i + 2) * game.gridSize * 2);
          reg.events[mouse_events.CLICK] = () => {
            game.sound_handler.play_sound("menu_click");
            handle_option_menu_selection(int(game.global_mouse_handler.my / (game.gridSize * 2)) - 1);
          }
          reg.events[mouse_events.ENTER_REGION] = () => {
            menus.option_menu_selected = int(game.global_mouse_handler.my / (game.gridSize * 2)) - 1;
            game.sound_handler.play_sound("menu_hover");
          };
          // reg.events[mouse_events.EXIT_REGION] = () => {menus.main_menu_selected = undefined; };
          game.global_mouse_handler.register_region(m + "option_menu", reg);
          ++i;
        }
    states.need_setup_options = false;
  }
  else
  {
    for (let m of menus.option_options)
    {
      game.global_mouse_handler.enable_region(m + "option_menu");
    }
  }
  game.game_state = states.OPTIONS;
}

function handle_option_menu_selection(option_index)
{
  switch (option_index)
  {
    // game.use_animations
    // game.sounds_enabled
    case 0:
      game.use_animations = !game.use_animations;
      storeItem("use_animations", game.use_animations);
      break;
    case 1:
      game.sounds_enabled = !game.sounds_enabled;
      storeItem("sounds_enabled", game.sounds_enabled);
      break;
    case 2:
      // TODO: ARE YOU SURE?!
      remove_saved_data();
      break;
    case 3:
      game.game_state = states.TEARDOWN_OPTIONS;
      break;
  }
}

function do_options_menu()
{
  fill(37);
  rect(0, 0, width, height);

  // display menu options
  textSize(font_size * 2);
  var i = 0;
  stroke(0);
  strokeWeight(2);

  blendMode(ADD);
  fill(255, 0, 0);
  text("options", (game.gridWidth - 17) * game.gridSize, game.gridSize * 2 - 5);
  fill(0, 255, 0);
  text("options", (game.gridWidth - 17) * game.gridSize, game.gridSize * 2);
  fill(0, 0, 255);
  text("options", (game.gridWidth - 17) * game.gridSize, game.gridSize * 2 + 5);
  blendMode(BLEND);

  if ((mouseY <= game.gridSize * 2) || (mouseY >= game.gridSize * 2 * (menus.option_menu_height)))
    menus.option_menu_selected = undefined;

  for (let m of menus.option_options)
  {
    if (i === 0)
    {
      if (game.use_animations)
      {
        fill(0 , 155, 0);
        text("Y", 0, (i + 2) * game.gridSize * 2);
      }
      else
      {
        fill(155, 0, 0);
        text("N", 0, (i + 2) * game.gridSize * 2);  
      }
    }

    if (i === 1)
    {
      if (game.sounds_enabled)
      {
        fill(0, 155, 0);
        text("Y", 0, (i + 2) * game.gridSize * 2);
      }
      else
      {
        fill(155, 0, 0);
        text("N", 0, (i + 2) * game.gridSize * 2);
      }
    }

    if (menus.option_menu_selected === i)
      fill(253);
    else
      fill(157);



    text(m, (game.gridWidth - 17) * game.gridSize, (i + 2) * game.gridSize * 2);
    ++i;
  }
  //game.game_state = states.TEARDOWN_OPTIONS;
}

function do_teardown_options()
{
  for (let m of menus.option_options)
  {
    game.global_mouse_handler.disable_region(m + "option_menu");
  }

  game.game_state = states.MAIN_MENU_SETUP;
}

//////// TOP MENU
function change_top_menu_entry(index, new_name, new_func)
{
  // unused?
  menus.top_menu_choices[index] = new_name;
  menus.top_menu_callbacks[index] = () => new_func;
}

function top_menu_main_menu() 
{
  // Exit to main menu, check here if we need to load or save
  // anything, etc.
  if (game.current_gamemode === game.GAMEMODE_TIME)
  {
    tear_down_time_game();
  }
  if (game.current_gamemode === game.GAMEMODE_RANDOM)
  {
    if (game.given_up)
    {
      storeItem("savedgame", null);
      storeItem("savedsolution", null);
      game.need_load_menu_map = false;
    }
    else
    {
      game.current_level.save_level(game.lightsources, game.detectors, false);
    }
    tear_down_random_game();
  }
  game.game_state = states.MAIN_MENU_SETUP;
} 

function top_menu_save_level() 
{
  if (game.given_up)
    return; // don't save once given up
  game.current_level.save_level(game.lightsources, game.detectors, true);
}

function top_menu_give_up() {

  if (game.given_up)
    return; // don't save once given up

  game.given_up = true;
  game.stick_give_up_juice = true;
  undo.reset_undo_stacks();
  load_solution();

  // disable gameplay handler?
  game.global_mouse_handler.disable_region("game.ghandler");
}

function top_menu_reset_stuff() 
{
  if (game.given_up)
      return; // If we've given up, don't allow reset
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
  game.global_mouse_handler.enable_region("top_menu");
  game.global_mouse_handler.disable_region("opened_top_menu", false);
  show_menu = false;
  for (let m of menus.top_menu_choices)
  {
    game.global_mouse_handler.disable_region(m);
  }
}

function make_menu()
{
  // the top right menu button
  let menu_region = new mouse_region((game.gridWidth - 3) * game.gridSize, 0,
                                  game.gridWidth * game.gridSize, game.gridSize);
  menu_region.events[mouse_events.CLICK] = () => { launch_menu(); };
  menu_region.events[mouse_events.UNCLICK] = () => {top_menu_accept_input = true;};
  menu_region.events[mouse_events.ENTER_REGION] = () => {mouse_over_menu = true;};
  menu_region.events[mouse_events.EXIT_REGION] = () => {mouse_over_menu = false;};
  game.global_mouse_handler.register_region("top_menu", menu_region);
  
  // initialize the menu handler and region stuff
  let open_menu_region = new mouse_region((game.gridWidth - 8) * game.gridSize, 0, game.gridWidth * game.gridSize, menus.top_menu_height * game.gridSize);
  open_menu_region.events[mouse_events.EXIT_REGION] = () => {disable_menu();};
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

  // don't handle key presses in tutorial game
  if (game.current_gamemode === game.GAMEMODE_TUTORIAL)
    return;

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
    if ((game.current_gamemode === game.GAMEMODE_RANDOM ||
      game.current_gamemode === game.GAMEMODE_TUTORIAL) 
      && game.next_level_available)
    {
      game.sound_handler.play_sound("next_level_clicked");
      game.game_state = game.game_state = states.LEVEL_TRANSITION_OUT;
    }
  }

  if (!USE_DEBUG_KEYS)
    return;

  // TODO: Remove these key codes 
  if (keyCode === LEFT_ARROW) {
    game.difficulty_level--;
    random_level();
  } else if (keyCode === RIGHT_ARROW) {
    game.difficulty_level++;
    if (game.difficulty_level > 99)
      game.difficulty_level = 99;
    random_level();
  } else if (key === 'p') {
    save_screenshot();
  } else if (key === 's') {
    game.current_level.copy_save_string_to_clipboard(game.lightsources, detectors);
  } else if (key === 'l') {
    load_solution();
  } else if (key === 'q') {
    storeItem("high_random_score", null);
    storeItem("game.high_timer_score", null);
    storeItem("savedgame", null);
  } else if (key === 'e') {
    let lvl_txt = get_level_and_load();
    try_load_level(lvl_txt);
  } else if (key === 'a') {
    game.floor_animation.start_animation();
  }
}

//////// GRID
function initializeGrid(which_grid)
{
  // initialize grid
  for (let x = 0; x < game.gridWidth; ++x)
  {
    for (let y = 0; y < game.gridHeight; ++y)
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
 //  let grid = game.current_level.grid;

  fill(57);

  game.jiggle.update_jiggles();
  game.floor_animation.update();
  // draw base grid (walls + floors)
  draw_walls_and_floors();
  draw_detector_floors();

  // Check active status of detectors
  let all_active = true;
  let skip_juice = game.stick_give_up_juice;
  for (let d of game.detectors)
  {
    d.check_color(!skip_juice);
    if(!d.correct)
      all_active = false;
  }
  if (skip_juice)
    game.stick_give_up_juice = !game.stick_give_up_juice;

  let old_next_level_available = game.next_level_available;
  game.next_level_available = all_active;

  // if we're in time attack, transition right away
  if (all_active && game.current_gamemode === game.GAMEMODE_TIME)
  {
    game.game_state = states.LEVEL_TRANSITION_OUT;
  }

  // change in status of ability to go to next level
  if (old_next_level_available != game.next_level_available)
  {
    if (game.next_level_available && !game.given_up)
    {
      // fire off a floor animation
      game.floor_animation.start_animation();
      game.global_mouse_handler.enable_region("next_btn");
    }
    else
    {
      game.global_mouse_handler.disable_region("next_btn");
    }
  }

  draw_light_sources(); 

  // draw particles underneath detectors
  particle_system.update_particles();
  particle_system.draw_particles();

  draw_detectors(); 
  
  draw_floor_lines();

  draw_edges();

  // // Draw glass (Extra tiles to draw would happen here?)
  // draw_glass();

  // Render any text that we have to
  stroke(0);
  strokeWeight(3);
  textSize(font_size);
  fill(palette.font_color);
  text("level: " + game.difficulty_level, 0 + game.GRID_HALF, game.gridSize - 8);

  fill(palette.font_color);
  if (mouse_over_menu)
    fill(255);
  
  text("menu", (game.gridWidth - 3) * game.gridSize, game.gridSize - 8);

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
  if (game.current_gamemode === game.GAMEMODE_TUTORIAL)
  {
    tutorial_game_ui();
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

  // todo: we can remove this tutorial at some point, we won't need it anymore!
  if (game.show_tutorial)
    tutorial();

  if (show_menu)      // disable game? Layer mouse listeners
    draw_menu();

}

function do_intro()
{
  // TODO: Fix intro! Broken!
  blendMode(ADD);
  let random_cols = [color(255, 0, 0), color(0, 255, 0), color(0, 0, 255)];
  // textAlign(CENTER, CENTER);
  textAlign(CENTER, TOP);
  if (game.intro_timer === 0)
  {
    game.intro_timer += deltaTime;
    textSize(font_size * 3);

    // if we can figure out a way to play an intro sound, do it here
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
  fill(12, 12, 12, game.global_fade * 255);
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
      game.difficulty_level += 1;
      if (game.difficulty_level > 99)
        game.difficulty_level = 99;
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
      game.difficulty_level += 1;
      if (game.difficulty_level > 99)
        game.difficulty_level = 99;
      time_level();
      make_edges();
    }

    if (game.current_gamemode === game.GAMEMODE_TUTORIAL)
    {
      game.current_tutorial_level++;
      // check if we're done the tutorial here?
      if (game.current_tutorial_level > 3)
      {
        teardown_tutorial_game();
        return;
      }
      make_tutorial_level();
    }
    game.game_state = states.LEVEL_TRANSITION_IN;
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
  textAlign(CENTER, TOP);
  text(s, game.gameWidth / 2, game.gridSize * 4);

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
  particle_system.clear_particles();
  disable_menu();             // top menu starts disabled;
  undo.reset_undo_stacks();   // ensure we have a fresh redo stack to start
  game.next_level_available = false; // clear next level flag
  game.given_up = false;    
  if (game.current_gamemode === game.GAMEMODE_RANDOM)
    setup_random_game();
  if (game.current_gamemode === game.GAMEMODE_TIME)
    setup_time_game();
  if (game.current_gamemode === game.GAMEMODE_TUTORIAL)
    setup_tutorial_game();
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
  case states.LEVEL_TRANSITION_OUT:
    do_level_transition_out();
    break;
  case states.LEVEL_TRANSITION_IN:
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
  case states.TUTORIAL_GAME_INTRO:
    do_tutorial_game_intro();
    break;
  case states.TUTORIAL_GAME_OUTRO:
    do_tutorial_game_outro();
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
    
    if (game.given_up && i < 5)
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
  for (let x = 0 ; x < lvl.xsize; ++x)
  {
    for (let y = 0; y < lvl.ysize; ++y)
    {
      if (lvl.grid[x][y].grid_type == tiles.GLASS_WALL || lvl.grid[x][y].grid_type == tiles.GLASS_WALL_TOGGLABLE)
        square(x * game.gridSize, y * game.gridSize, game.gridSize);
    }
  }
}

function draw_floor_lines()
{
  let lvl = game.current_level;

  strokeWeight(2);
  blendMode(ADD);
  //stroke(0, 30);
  //stroke(255, 0, 0);
  noFill();
  stroke(17, 20);  // default for if we don't use animation
  for (let x = 0 ; x < lvl.xsize; ++x)
  {
    for (let y = 0; y < lvl.ysize; ++y)
    {
      if (game.use_animations)
        stroke(game.floor_animation.get_color(x, y));


      if (game.current_level.grid[x][y].grid_type == tiles.FLOOR_EMPTY 
          || game.current_level.grid[x][y].exist)

        continue;
      // TODO: Refactor this, new class?
      let top_left_offset = game.jiggle.jiggle_grid[x][y];
      let top_right_offset = game.jiggle.jiggle_grid[x + 1][y];
      let bottom_left_offset = game.jiggle.jiggle_grid[x][y + 1];

      let top_left_point = [x * game.gridSize, y * game.gridSize];
      let top_right_point = [(x + 1) * game.gridSize, y * game.gridSize];
      let bottom_left_point = [x * game.gridSize, (y + 1) * game.gridSize];

      if (!game.use_animations)
      {
        top_left_offset = [0, 0];
        top_right_offset = [0, 0];
        bottom_left_offset = [0, 0];
        // bottom_right_offset = [0, 0];
      }
      if(x > 0 && x < game.gridWidth - 1)
      {
      line(top_left_point[0] + top_left_offset[0], 
        top_left_point[1] + top_left_offset[1],
        top_right_point[0] + top_right_offset[0],
        top_right_point[1] + top_right_offset[1]);
      }

      if (y > 0 && y < game.gridHeight - 1)
      {
      line(top_left_point[0] + top_left_offset[0], 
        top_left_point[1] + top_left_offset[1],
        bottom_left_point[0] + bottom_left_offset[0],
        bottom_left_point[1] + bottom_left_offset[1]);
      }
    }
  }
  blendMode(BLEND);
}

function draw_walls_and_floors()
{
  let lvl = game.current_level;

  strokeWeight(1);
  for (let x = 0 ; x < lvl.xsize; ++x)
  {

    for (let y = 0; y < lvl.ysize; ++y)
    {

      // TODO: Refactor this, new class?
      let top_left_offset = game.jiggle.jiggle_grid[x][y];
      let top_right_offset = game.jiggle.jiggle_grid[x + 1][y];
      let bottom_left_offset = game.jiggle.jiggle_grid[x][y + 1];
      let bottom_right_offset = game.jiggle.jiggle_grid[x + 1][y + 1];

      let top_left_point;
      let top_right_point;
      let bottom_left_point;
      let bottom_right_point;

      let odd = lvl.odd_grid[x][y];
      let permenant = lvl.grid[x][y].permenant; // This should be programmed into the level

      let do_draw = false;

      if (!lvl.grid[x][y].exist)  // EMPTY SPACES
      {
        if (lvl.grid[x][y].grid_type == tiles.FLOOR_EMPTY)
        {
          strokeWeight(1);

          if (game.use_animations)
          {
            // TODO: Background floor animations are currently happening
            // here, find a way to pull them out of here and put them 
            // someewhere so they are easier to expand on and write more
            let black_shift = sin(millis() / 2048 + (x + y)) * 3;
            fill(4 + black_shift);
            stroke(4 + black_shift);
          }
          else
          {
            stroke(0);
            fill(palette.empty_fill);
          }
          // square(x * game.gridSize, y * game.gridSize, game.gridSize);
          do_draw = true;
          top_left_point = [x * game.gridSize, y * game.gridSize];
          top_right_point = [(x + 1) * game.gridSize, y * game.gridSize];
          bottom_left_point = [x * game.gridSize, (y + 1) * game.gridSize];
          bottom_right_point = [(x + 1) * game.gridSize, (y + 1) * game.gridSize];
        }

        else if (lvl.grid[x][y].grid_type == tiles.FLOOR_BUILDABLE)
        {
          if (lvl.grid[x][y].fade > 0)
            lvl.grid[x][y].fade -= deltaTime / 250;

          if (game.use_animations)
          {
            stroke(lerpColor(palette.buildable_outline, palette.solid_wall_outline, lvl.grid[x][y].fade));
            // lerp between the empty fill color and the color of whatever
            // solid thing will be there
            fill(lerpColor( odd ? palette.buildable_fill : palette.buildable_2_fill, 
                            permenant ? palette.solid_wall_permenant_fill : palette.solid_wall_fill, 
                            lvl.grid[x][y].fade));
          }
          else
          {
            stroke(palette.buildable_outline);
            fill(odd ? palette.buildable_fill : palette.buildable_2_fill);
          }

          // square(x * game.gridSize, y * game.gridSize, game.gridSize);
          do_draw = true;
          top_left_point = [x * game.gridSize, y * game.gridSize];
          top_right_point = [(x + 1) * game.gridSize, y * game.gridSize];
          bottom_left_point = [x * game.gridSize, (y + 1) * game.gridSize];
          bottom_right_point = [(x + 1) * game.gridSize, (y + 1) * game.gridSize];

        }
      }

      else if (lvl.grid[x][y].exist)  // SOLID WALLS
      {

        if (lvl.grid[x][y].fade < 1)
          lvl.grid[x][y].fade += deltaTime / 250;

        if (lvl.grid[x][y].permenant)
        {
          noStroke();
        } else {
          if (game.use_animations)
            stroke(lerpColor(palette.buildable_outline, palette.solid_wall_outline, lvl.grid[x][y].fade));
          else
            stroke(palette.solid_wall_outline);
        }
        
        // exact same thing as above!
        
        if (game.use_animations)
          fill(lerpColor( odd ? palette.buildable_fill : palette.buildable_2_fill, 
                          permenant ? palette.solid_wall_permenant_fill : palette.solid_wall_fill, 
                          lvl.grid[x][y].fade));
        else
            fill(permenant ? palette.solid_wall_permenant_fill : palette.solid_wall_fill);
        

        if (lvl.grid[x][y].permenant)
        {
          // square(x * game.gridSize , y * game.gridSize, game.gridSize);
          do_draw = true;
          top_left_point = [x * game.gridSize, y * game.gridSize];
          top_right_point = [(x + 1) * game.gridSize, y * game.gridSize];
          bottom_left_point = [x * game.gridSize, (y + 1) * game.gridSize];
          bottom_right_point = [(x + 1) * game.gridSize, (y + 1) * game.gridSize];
        }
        else
        {
          // rect(x * game.gridSize, y * game.gridSize, game.gridSize, lvl.grid[x][y].fade * game.gridSize);
          do_draw = true;
          top_left_point = [x * game.gridSize, y * game.gridSize];
          top_right_point = [(x + 1) * game.gridSize, y * game.gridSize];
          if (game.use_animations)
          {
            bottom_left_point = [x * game.gridSize,  (y + lvl.grid[x][y].fade) * game.gridSize];
            bottom_right_point = [(x + 1) * game.gridSize,  (y + lvl.grid[x][y].fade) * game.gridSize];
          } else {
            bottom_left_point = [x * game.gridSize,  (y + 1) * game.gridSize];
            bottom_right_point = [(x + 1) * game.gridSize,  (y + 1) * game.gridSize];
          }
        }
      }

      // if (lvl.grid[x][y].grid_type == tiles.GLASS_WALL_TOGGLABLE || lvl.grid[x][y] == tiles.GLASS_WALL)
      // // TODO: This is unused! Don't worry about it for now
      // {
      //   strokeWeight(2);
      //   stroke(170, 170, 170);
      //   if (permenant)
      //   {
      //     noStroke();
      //     fill(170, 170, 170, 40);
      //   }
      //   square(x * game.gridSize + 1, y * game.gridSize + 1, game.gridSize - 3);

      //   // TODO: Little glass lines on the windows?
      //   // strokeWeight(1);
      //   // for (j = 0; j < 5; ++ j)
      //   // {
      //   //  line(x * game.gridSize + 10 - j, y * game.gridSize - j, x * game.gridSize + j, y * game.gridSize + 10 + j);
      //   // }

      // }

      // draw
      if (do_draw)
      {
        if (!game.use_animations)
        {
          top_left_offset = [0, 0];
          top_right_offset = [0, 0];
          bottom_left_offset = [0, 0];
          bottom_right_offset = [0, 0];
        }
        beginShape();
        vertex(top_left_point[0] + top_left_offset[0], top_left_point[1] + top_left_offset[1]);
        vertex(top_right_point[0] + top_right_offset[0], top_right_point[1] + top_right_offset[1]);
        vertex(bottom_right_point[0] + bottom_right_offset[0], bottom_right_point[1] + bottom_right_offset[1]);
        vertex(bottom_left_point[0] + bottom_left_offset[0], bottom_left_point[1] + bottom_left_offset[1]);
        endShape(CLOSE);
      }
    }
  }
}

function draw_edges()
{
  if (!game.use_animations)
  {
    blendMode(DARKEST);
    strokeWeight(1);
    stroke(palette.edge_color);
    fill(palette.edge_circle_color)
    for (let e of game.edges)
    {
      ellipse(e.sx, e.sy, 5, 5);
      ellipse(e.ex, e.ey, 5, 5);
    }
    strokeWeight(5);
    stroke(palette.edge_color);
    for (let e of game.edges)
    {
      line(e.sx, e.sy, e.ex, e.ey);
    }
    blendMode(BLEND);
    return;
  }
  // else, we are using animation:
  // strokeWeight(2);
  // stroke(palette.edge_circle_color);
  // fill(palette.edge_circle_color);
  blendMode(DARKEST);
  strokeWeight(1);
  stroke(palette.edge_color);
  fill(palette.edge_circle_color)
  for (let e of game.edges)
  {
    let sx_index = jiggle.get_index(e.sx);//int(curr_x / game.gridSize);
    let sy_index = jiggle.get_index(e.sy);//int(curr_y / game.gridSize);
    let ex_index = jiggle.get_index(e.ex);//int(next_x / game.gridSize);
    let ey_index = jiggle.get_index(e.ey);//int(next_y / game.gridSize);
    let [sx, sy] = game.jiggle.jiggle_grid[sx_index][sy_index];
    let [ex, ey] = game.jiggle.jiggle_grid[ex_index][ey_index];
    ellipse(e.sx + sx, e.sy + sy, 5, 5);
    ellipse(e.ex + ex, e.ey + ey, 5, 5);
  }

  strokeWeight(5);
  stroke(palette.edge_color);

  for (let e of game.edges)
  {
    // instead of drawing a straight line between the start and end point,
    // we need to iterate over the line and draw each gridpoint
    let start_x = e.sx;
    let start_y = e.sy;
    let end_x = e.ex;
    let end_y = e.ey;
    let curr_x = start_x;
    let curr_y = start_y;
    let next_x = curr_x;
    let next_y = curr_y;
    while (!(curr_x === end_x && curr_y === end_y))
    {
      if (curr_x < end_x)
      {
        next_x = curr_x + game.gridSize;
      }
      if (curr_y < end_y)
      {
        next_y = curr_y + game.gridSize;
      }

      let sx_index = jiggle.get_index(curr_x);
      let sy_index = jiggle.get_index(curr_y);
      let ex_index = jiggle.get_index(next_x);
      let ey_index = jiggle.get_index(next_y);

      let [sx_off, sy_off] = game.jiggle.jiggle_grid[sx_index][sy_index];
      let [ex_off, ey_off] = game.jiggle.jiggle_grid[ex_index][ey_index];

      line(curr_x + sx_off, curr_y + sy_off, next_x + ex_off, next_y + ey_off);

      curr_x = next_x;
      curr_y = next_y;
    }


    // stroke(palette.edge_color);
    // let [sx_off, sy_off] = game.jiggle.jiggle_grid[e.sx_grid][e.sy_grid];
    // let [ex_off, ey_off] = game.jiggle.jiggle_grid[e.ex_grid][e.ey_grid];
    // line(e.sx + sx_off, e.sy + sy_off, e.ex + ex_off, e.ey + ey_off);
  }
  blendMode(BLEND);
}

function draw_detector_floors()
{
  for (let d of game.detectors)
  {
    d.draw_floor();
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
function load_solution()
{
  load_level(getItem("savedsolution"), /*keep_bg=*/true);
}


function try_load_level(level_string)
{
  // this should be a failsafe in case I accidentally corrupt
  // peoples saved games?
  try 
  {
    load_level(level_string);
    return true;
  } catch (err) {
    storeItem("savedgame", null);
    return false;
  }
}

function load_level(level_string, keep_bg=false)
{
  let stored_bg;
  if (keep_bg)
    stored_bg = [...game.current_level.odd_grid];
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

  for (let x = 0; x < xsize; ++x)
  {
    for (let y = 0; y < ysize; ++y)
    {
      let cur_ch = level_string.charAt(level_string_index++);
      set_grid(new_lvl.grid, x, y, parseInt(cur_ch));
    }
  }

  let loaded_lights = [];
  // next two char are number of light sources
  let n_lights = level_string.substring(level_string_index, level_string_index + 2);
  level_string_index += 2;
  for (let light_i = 0; light_i < n_lights; ++light_i)
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
  for (let d_i = 0; d_i < n_d; ++d_i)
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

  if (keep_bg)
    game.current_level.odd_grid = stored_bg;

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
  next_region.events[mouse_events.CLICK] = () => { game.game_state = states.LEVEL_TRANSITION_OUT; };
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
  // Create a new level for timer mode
  let new_random_level = new level();
  new_random_level.xsize = game.gridWidth;
  new_random_level.ysize = game.gridHeight;
  new_random_level.initialize_grid();
  initializeGrid(new_random_level.grid);
  game.current_level = new_random_level;

  init_random_detectors(new_random_level, difficulty_to_detector_amount());
  make_some_floor_unbuildable(new_random_level.grid, difficulty_to_shrink_amount());
  shrink_lights();
  make_edges();
  update_all_light_viz_polys();
}

function tear_down_time_game()
{
  // TODO: Clean up any other variables that are used here,
  // reset timers, etc.
  game.need_load_menu_map = true;
  game.global_mouse_handler.disable_region("game.ghandler"); // remove entirely at some point!
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
    let x2 = game.gridWidth * 17;
    let y2 = (game.gridHeight - 4) * game.gridSize + game.GRID_HALF;
    // fill(255, 0, 0);
    // rect(x1, y1, x2 - x1, y2 - y1);
    let play_again_btn = new mouse_region(x1, y1, x2, y2);
    play_again_btn.events[mouse_events.ENTER_REGION] = () => { over_play_again_btn = true; };
    play_again_btn.events[mouse_events.EXIT_REGION] = () => { over_play_again_btn = false; };
    play_again_btn.events[mouse_events.CLICK] = () => { play_again_from_time_results(); };
    game.global_mouse_handler.register_region("time_result_play_again_btn", play_again_btn);

    // TODO: Tweak to find better placement
    x1 = width - (game.gridWidth * 14);
    y1 = (game.gridHeight - 5) * game.gridSize;
    x2 = width - (game.gridWidth * 8);
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
  game.need_load_menu_map = true;
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
  textSize(font_size);
  fill (palette.bright_font_color);
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

  x1 = width - (game.gridWidth * 14);
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
  next_region.events[mouse_events.CLICK] = () => { 
    game.sound_handler.play_sound("next_level_clicked");
    game.game_state = states.LEVEL_TRANSITION_OUT; 
  };
  next_region.events[mouse_events.ENTER_REGION] = () => { over_next_level = true; };
  next_region.events[mouse_events.EXIT_REGION] = () => { over_next_level = false; };
  next_region.enabled = false;
  game.global_mouse_handler.register_region("next_btn", next_region);



  // check if we have a saved game
  let saved_g = getItem("savedgame");
  if (!saved_g)
  {
    game.difficulty_level = 1;
    game.new_scoring_system = 0;
    init_light_sources();
    random_level();
  }
  // else
  // {
  //   let loaded_success = try_load_level(saved_g);
  //   if (!loaded_success)
  //   {
  //     random_level();
  //   }
  // }
  game.highest_score = getItem("high_random_score")
  if (game.highest_score == null)
    game.highest_score = 0;
  game.highest_score_display_timer = 5;
  game.game_state = states.GAME;
}

function tear_down_random_game()
{
  // TODO: Clean up any other variables that are used here,
  // reset timers, etc.
  game.highest_score_changed = 0
  game.highest_score_display_timer = 0;
  game.new_total_fade = 0;
  game.global_mouse_handler.disable_region("game.ghandler"); // remove entirely at some point!
}

function random_game_ui()
{
  strokeWeight(3);
  stroke(0);
  if (game.next_level_available && !game.given_up)
  {
    game.next_button_bob_timer += (deltaTime / 100);
    if (game.next_button_bob_timer > TWO_PI)
      game.next_button_bob_timer = 0;

    if (over_next_level)
      fill(255)
    else
      fill(palette.font_color);
    // -4? Magic number!
    text("next", (game.gridWidth - 3) * game.gridSize, game.gridHeight * game.gridSize - game.GRID_QUARTER - sin(game.next_button_bob_timer));
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
    text("high score: " + game.highest_score, 0 + game.GRID_HALF, game.gridHeight * game.gridSize - game.GRID_QUARTER);
  }
  else
  {
    text("score: " + game.new_scoring_system + " points: " + game.points_for_current_grid, 0 + game.GRID_HALF, game.gridHeight * game.gridSize - game.GRID_QUARTER);
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

function solvable_random_level(save=true, showcase=false)
{
  // TODO: This function should haven't anything to do with saving
  // That should be pushed up a layer.

  // TODO: At some point, this freezes since it cannot generate a valid level?
  // figure out someway to deal with this!
  let new_random_level = new level();
  new_random_level.xsize = game.gridWidth;
  new_random_level.ysize = game.gridHeight;

  new_random_level.initialize_grid(); 
  initializeGrid(new_random_level.grid);

  game.current_level = new_random_level;

  let diff_level = game.difficulty_level;
  if (diff_level > 50)
    diff_level = 50;
  let shrink_level = difficulty_to_shrink_amount();
  if (showcase)
  {
    shrink_level = 4;
    diff_level = 20;
  }
  make_some_floor_unbuildable(game.current_level.grid, shrink_level);

  let target_patterns = min(4, Math.floor(diff_level / 7));
  if (showcase)
    target_patterns = 2;
  for (let i = 0 ; i < target_patterns; ++i)
    make_unbuildable_pattern(game.current_level.grid, diff_level);

  make_some_built_floor(game.current_level.grid, diff_level);
  make_edges();

  // Now, we put the lights back somewhere they fit
  place_lights_back_on_board();
  // turn them all on? turn some on?
  activate_lights();

  // // // randomly deactivate light source
  // TODO: This is problematic for now, we need to keep track
  // of what possible color combinations we can have when we
  // deactivate certain lights, and then only use those.
  if (diff_level < 20)
  {
    for (let l of game.lightsources)
    {
      // Is this all we have to do here?
      if (Math.random() < 0.1)
      {
        l.active = false;
        if (diff_level > 20)
          break;
      }
    }
  }

  // now place detectors in places that work, ie. they can be active
  let d_amount = showcase ? 7 : difficulty_to_detector_amount();

  solvable_init_random_detectors(game.current_level, d_amount);
  // init_random_detectors(game.current_level, diff_level);

  // now we can remove any unused walls
  remove_unneeded_walls(game.current_level.grid);

  update_all_light_viz_polys();
  if (showcase)
    return;
    
  // ok, at this point we should save the current level since it is a
  // valid solution
  game.current_level.save_solution(game.lightsources, game.detectors);


  // SO, we want to generate the level code for our current level
  // and save it to the current solution slot.

  // FOR NOW don't scramble the puzzle
  // return;
  activate_lights();
  for (let l of game.lightsources)
  {
    // Is this all we have to do here?
    if (Math.random() < 0.3)
    {
      l.active = false;
    }
  }

  // then, clear all built walls
  reset_grid(game.current_level);

  // then shuffle up the light position
  wander_lights(20);
  update_all_light_viz_polys();

  // now we should have a valid solvable puzzle!
}

function random_level(save=true)
{
  solvable_random_level(save, false);
  // let new_random_level = new level();
  // new_random_level.xsize = game.gridWidth;
  // new_random_level.ysize = game.gridHeight;

  // // TODO: Why calling new_random_level.initialize_grid() AND initializeGrid(new_random_level.grid);?
  // // doesn't make sense, use one or the other.
  // new_random_level.initialize_grid(); 
  // initializeGrid(new_random_level.grid);

  // game.current_level = new_random_level;
  // // turn_lights_off();
  // init_random_detectors(new_random_level, difficulty_to_detector_amount());
  // make_some_floor_unbuildable(new_random_level.grid, difficulty_to_shrink_amount());
  // shrink_lights();

  // save current level
  if (save)
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

function init_light_sources(start_active = false)
{
  // init lights
  game.lightsources.splice(0, game.lightsources.length);

  // RGB lights
  let source = new light_source(game.gridWidth - 5, game.gridHeight - 5, start_active, 255, 0, 0);
  game.lightsources.push(source);
  source = new light_source(game.gridHeight - 5, 5, start_active, 0, 255, 0);
  game.lightsources.push(source);
  source = new light_source(5, int(game.gridWidth / 2), start_active, 0, 0, 255);
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
  game.detectors.splice(0, game.detectors.length);

  for (let i = 0 ; i < num_detectors; ++ i)
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
      for (let xoff = - 1; xoff <= 1; ++xoff)
      {
        for (let yoff = -1; yoff <= 1; ++yoff)
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
    make_detector(xp, yp, r, g, b);
  }
}

function solvable_init_random_detectors(lvl, num_detectors)
{
  let test_detector = new detector(0, 0, 0, 0, 0);
  // initialize a randomized array of detectors
  game.detectors.splice(0, game.detectors.length);

  let num_placed_detectors = 0;

  let col_val = [0, 255];

  let last_r = -1, last_g = -1, last_b = -1;
  let max_total_iters = 2000;
  let current_total_iter = 0;
  do  // while (num_placed_detectors < num_detectors);
  {
    current_total_iter += 1;
    if (current_total_iter >= max_total_iters)
    {
      break;
    }
    let r, g, b;
    let xp, yp;
    let gtype;

    // only allow to pop-up on empty or buildable floor
    let attempts = 0;
    let got_valid_location = false;

    while (!got_valid_location)
    {
      // TODO: There is still something incorrect about
      // this implementation. It still hangs occasionally!
      r = random(col_val);
      g = random(col_val);
      b = random(col_val);
      if (current_total_iter < 80 && r == last_r && g == last_g && b == last_b)
      {
        // prefer to make detectors that don't match in the early iterations,
        // loosen up restriction over time.
        continue;
      }

      attempts += 1;
      if (attempts > 100)
        break;

      xp = int(random(2, lvl.xsize - 2));
      yp = int(random(2, lvl.ysize - 2));
      gtype = lvl.grid[xp][yp].grid_type;

      // Don't let us pop-up on lightsources as well, since it is
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
      if (attempts < 80)  // loosen up heuristics in last couple rounds
      {
        for (let xoff = - 1; xoff <= 1; ++xoff)
        {
          for (let yoff = -1; yoff <= 1; ++yoff)
          {
            if (xoff === 0 && yoff === 0)
              continue;
            if (lvl.grid[xp + xoff][yp + yoff].grid_type == tiles.DETECTOR_TILE)
            {
              gtype = -1;
              break;
            }
          }
          if (gtype === -1)
            break;
        }
      }

      if (gtype != tiles.FLOOR_BUILDABLE || gtype === -1) // places we can build
        continue;

      // make sure this light can be activated here
      test_detector.x = xp;
      test_detector.y = yp;
      test_detector.change_color(r, g, b);
      test_detector.check_color(/*use_juice=*/false);
      if (test_detector.correct)
      {
        got_valid_location = true;
        break;
      }
    }

    if (got_valid_location)
    {
      num_placed_detectors += 1;
      make_detector(xp, yp, r, g, b);
      last_r = r;
      last_g = g;
      last_b = b;
    }

  } while (num_placed_detectors < num_detectors);
}

function difficulty_to_detector_amount()
{
  // map from a difficulty level to number of detectors
  // on the field
  if (game.difficulty_level <= 8)
    return game.difficulty_level;
  if (game.difficulty_level <= 20)
    return int(game.difficulty_level / 4) + 4;
  if (game.difficulty_level <= 30)
    return int(game.difficulty_level / 5) + 3;
  return min(10, int(4 + game.difficulty_level / 4));
}

function difficulty_to_shrink_amount()
{
  // if (game.difficulty_level <= 5)
  //   return 0;
  if (game.difficulty_level < 20)
    return 1;
  if (game.difficulty_level < 35)
    return 2;
  if (game.difficulty_level < 50)
    return 3;
  return 4;
}

function shrink_lights()
{
  // TODO: I don't know if this function does anything anymore?
  // maybe with a timed game?
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

function activate_lights()
{
  for (let l of game.lightsources)
  {
    // Is this all we have to do here?
    l.active = true;
  }
}

function place_lights_back_on_board()
{
  for (let l of game.lightsources)
  {
    let has_valid_location = false;
    let rx, ry;
    do
    {
      rx = Math.floor(Math.random() * game.gridWidth);
      ry = Math.floor(Math.random() * game.gridHeight);
      if (game.current_level.grid[rx][ry].grid_type === tiles.FLOOR_BUILDABLE &&
        !is_target_a_light(rx, ry))
        has_valid_location = true;
    } while (!has_valid_location);
    l.move(rx, ry);
  }
}

function wander_lights(iterations)
{
  // This will randomly move a light around for some number of iterations
  // only in up-down, left-right directions, following rules of game. 
  // This ensures a light won't end up somewhere that leaves the game
  // in an unsolvable state.
  for (let i = 0; i < iterations; ++i)
  {
    for (let l of game.lightsources)
    {
      let attempts = 0;
      let has_valid_location = false;
      let rx, ry;
      let valid_offsets = [-1, 1];
      do
      {
        ++attempts;
        if (attempts > 20)
          break;

        // check either x-dir or y-dir
        let offset = valid_offsets[Math.floor(Math.random() * 2)];
        rx = l.x;
        ry = l.y;

        if (Math.random() < 0.5)
          rx += offset;
        else
          ry += offset;

        if (game.current_level.grid[rx][ry].grid_type === tiles.FLOOR_BUILDABLE 
            && !is_target_a_light(rx, ry))
          {
            has_valid_location = true;
          }

      } while (!has_valid_location);

      if (has_valid_location)
        l.move(rx, ry);
    }
}
}

function make_some_floor_unbuildable(which_grid, shrink_amount)
{
  // bring in some floor from the outside
  for (let x = 1 ; x < game.gridWidth - 1; ++x)
  {
    for (let y = 1; y < game.gridHeight - 1; ++y)
    {
      if (x < shrink_amount || game.gridWidth - 1 < x + shrink_amount || y < shrink_amount || game.gridHeight - 1 < y + shrink_amount)
      {
        set_grid(which_grid, x, y, tiles.FLOOR_EMPTY);
      }
    }
  }
  if (game.difficulty_level > 10)
  {
    for (let i = 0; i < min(int(game.difficulty_level / 4), 20); ++i)
    {
      // TODO: Make sure this doesn't happen on one of the lights?
      // or say it's a feature, not a bug
      let xpos, ypos;
      while(true)
      {
        xpos = int(random(1, game.gridWidth - 2));
        ypos = int(random(1, game.gridHeight - 2));
        //if xpos, ypos is not just a regular ol' floor
        if(which_grid[xpos][ypos].grid_type != tiles.FLOOR_BUILDABLE) 
          continue;
        break;
      }
      set_grid(which_grid, xpos, ypos, tiles.FLOOR_EMPTY);
    }
  }
}

function make_unbuildable_pattern(which_grid, difficulty_amount)
{
  let num_random_unbuildable_patterns = 6;
  let unbuildable_pattern = Math.floor(Math.random() * num_random_unbuildable_patterns);
  let unbuildable_sub_type = Math.floor(Math.random() * 10);
  let half_grid_width = game.gridWidth / 2;
  for (let x = 1 ; x < game.gridWidth - 1; ++x)
  {
    for (let y = 1; y < game.gridHeight - 1; ++y)
    {
      switch (unbuildable_pattern)
      {
        case 0:
          if ((x + y) % (unbuildable_sub_type + 6) === 0)
          {
            set_grid(which_grid, x, y, tiles.FLOOR_EMPTY);
          }
          break;
        case 1:
          if (noise((x + millis()) / 4, (y + millis()) / 4) < 0.35)
            set_grid(which_grid, x, y, tiles.FLOOR_EMPTY);
          break;
        case 2:
          {
          let tmp = map(unbuildable_sub_type, 0, 10, 2, 3);
          if (abs(sin(x)) < 1 / tmp)
            set_grid(which_grid, x, y, tiles.FLOOR_EMPTY);
          break;
          }
        case 3:
          {
          let tmp = map(unbuildable_sub_type, 0, 10, 2, 3);
          if (abs(sin(y)) < 1 / tmp)
            set_grid(which_grid, x, y, tiles.FLOOR_EMPTY);
          break;
          }
        case 4:
          if (x === unbuildable_sub_type + 4 || y === unbuildable_sub_type + 4)
            set_grid(which_grid, x, y, tiles.FLOOR_EMPTY)
          break;
        case 5:
          {
            let x_dist = half_grid_width - x;
            let y_dist = half_grid_width - y;
            let x_sqr = x_dist * x_dist;
            let y_sqr = y_dist * y_dist;
            let calculated_radius = Math.sqrt(x_sqr + y_sqr);
            let empty_floor = (calculated_radius < (half_grid_width / unbuildable_sub_type) * 2) && 
            !(calculated_radius < (half_grid_width / unbuildable_sub_type)) ||
              calculated_radius > half_grid_width;
            if (empty_floor)
              set_grid(which_grid, x, y, tiles.FLOOR_EMPTY);
            break;
          }
      }

    }
  }
}

function make_some_built_floor(which_grid, difficulty_amount)
{
  for (let i = 0; i < min(10, difficulty_amount); ++i)
  {
    // TODO: Make sure this doesn't happen on one of the lights?
    // or say it's a feature, not a bug
    let xpos, ypos;
    let max_attempts = 100;
    while(true)
    {
      --max_attempts;
      if (max_attempts <= 0)
        break;
      xpos = int(random(1, game.gridWidth - 2));
      ypos = int(random(1, game.gridHeight - 2));
      //if xpos, ypos is not just a regular ol' floor
      if(which_grid[xpos][ypos].grid_type != tiles.FLOOR_BUILDABLE) 
        continue;
      break;
    }
    set_grid(which_grid, xpos, ypos, tiles.FLOOR_BUILT);
  }
}

function remove_unneeded_walls(which_grid)
{
  // Tests each built wall to see if it is needed by the solution
  for (let x = 1 ; x < game.gridWidth - 1; ++x)
  {
    for (let y = 1; y < game.gridHeight - 1; ++y)
    {
      let needed_wall = false;
      if (which_grid[x][y].grid_type == tiles.FLOOR_BUILT)
      {
        // we have a built floor, see if it is necessary
        set_grid(which_grid, x, y, tiles.FLOOR_BUILDABLE);
        make_edges();
        for (let d of game.detectors)
        {
          d.check_color(/*use_juice=*/false);
          if (!d.correct)
          {
            needed_wall = true;
            break;
          }
        }
        if (needed_wall)
        {
          set_grid(which_grid, x, y, tiles.FLOOR_BUILT);
          make_edges();
        }
      }
    }
  }
}

function reset_grid(lvl)
{
  for (let x = 0 ; x < lvl.xsize; ++x)
  {
    for (let y = 0; y < lvl.ysize; ++ y)
    {
      // TODO: Other stuff to reset?
      if (lvl.grid[x][y].grid_type == tiles.FLOOR_BUILT)
      {
        set_grid(lvl.grid, x, y, tiles.FLOOR_BUILDABLE);
      }
    }
  }
}

//////// TUTORIAL GAME MODE
function do_tutorial_game_intro()
{
  game.tutorial_game_intro_timer += deltaTime / 1000;
  textSize(font_size);
  fill(37);
  rect(0, 0, width, height);
  fill(255);
  text("First time?\n Here's a quick tutorial!\n", game.gridSize, height / 2);
  if (game.tutorial_game_intro_timer > 4.5)
  {
    fill(map(game.tutorial_game_intro_timer, 4.5, 5.0, 37, 255));
    rect(0, 0, width, height);
  }
  if (game.tutorial_game_intro_timer > 5)
  {
    game.game_state = states.NEW_GAME;
    game.tutorial_game_intro_timer = 0;
  }
}

function setup_tutorial_game()
{
  game.ghandler = new gameplay_handler();
  // next level button, will start hidden and disabled
  let next_region = new mouse_region((game.gridWidth - 3) * game.gridSize, (game.gridHeight - 1) * game.gridSize, game.gridWidth * game.gridSize, game.gridHeight * game.gridSize);
  next_region.events[mouse_events.CLICK] = () => { 
    game.sound_handler.play_sound("next_level_clicked");
    game.game_state = states.LEVEL_TRANSITION_OUT; 
  };
  next_region.events[mouse_events.ENTER_REGION] = () => { over_next_level = true; };
  next_region.events[mouse_events.EXIT_REGION] = () => { over_next_level = false; };
  next_region.enabled = false;
  game.global_mouse_handler.register_region("next_btn", next_region);

  game.current_tutorial_level = 0;
  make_tutorial_level();
  game.game_state = states.GAME;
}

function make_tutorial_level()
{
  // start with an empty level
  let new_tutorial_level = new level();
  new_tutorial_level.xsize = game.gridWidth;
  new_tutorial_level.ysize = game.gridHeight;
  new_tutorial_level.initialize_grid();

  initializeGrid(new_tutorial_level.grid);
  // clear lights and detectors!
  clear_lights();
  clear_detectors();
  game.current_level = new_tutorial_level;

  // now, depending on our current tutorial level, we'll add some stuff
  // to the board
  
  switch (game.current_tutorial_level)
  {
    case 0:
      make_light(5, 5, 255, 0, 0);
      make_detector(game.gridWidth - 5, game.gridHeight - 5, 255, 0, 0);
      game.floor_animation.do_floor_target_animation(5, 5);
      break;
    case 1:
      make_light(5, 5, 255, 0, 0);
      make_light(game.gridWidth-5, 5, 0, 255, 0);
      make_detector(game.gridWidth - 5, game.gridHeight - 5, 255, 255, 0);
      break;
    case 2:
      let center_grid = int(game.gridHeight / 2);
      make_light(2, center_grid, 255, 0, 0);
      make_light(game.gridWidth - 2, center_grid, 0, 0, 255);
      make_detector(center_grid - 2, center_grid, 255, 0, 0);
      make_detector(center_grid + 2, center_grid, 0, 0, 255);
      game.floor_animation.do_floor_target_animation(center_grid, center_grid);
      break;
    case 3:
      let center_grid2 = int(game.gridHeight / 2);
      init_light_sources(true);
      make_detector(center_grid2, 3, 255, 255, 0);
      make_detector(center_grid2 - 3, game.gridHeight - 3, 0, 255, 255);
      make_detector(center_grid2 + 3, game.gridHeight - 3, 255, 0, 255);
      game.ghandler.try_build_wall(center_grid2, center_grid2);
      break;
  }
  make_edges();
  update_all_light_viz_polys();
}

function do_tutorial_game_outro()
{
  game.tutorial_game_intro_timer += deltaTime / 1000;
  textSize(font_size);
  fill(37);
  rect(0, 0, width, height);
  fill(255);
  text(
        "Click save on top menu\n" +
        "to save progress.\n" + 
        "R,G,B keys switch lights\n" +
        "Space for next level\n" + 
        "Use menu to undo/redo\n" +
        "Have fun!", 
        game.gridSize, 
        height / 2 - game.gridSize * 3
      );
  if (game.tutorial_game_intro_timer > 7.5)
  {
    fill(map(game.tutorial_game_intro_timer, 7.5, 8.0, 37, 255));
    rect(0, 0, width, height);
  }
  if (game.tutorial_game_intro_timer > 8)
  {
    game.game_state = states.MAIN_MENU_SETUP;
    game.tutorial_game_intro_timer = 0;
  }
}

function tutorial_game_ui()
{
  // todo: Nicer way to do this?
  strokeWeight(3);
  stroke(37);
  fill(230);
  switch (game.current_tutorial_level)
  {
    case 0:
      if (game.detectors[0].correct)
      {
        text("click next to continue", 0 + game.GRID_HALF, game.gridHeight * game.gridSize - game.GRID_QUARTER);
      }
      else
      {
        text("click light to turn on", 0 + game.GRID_HALF, game.gridHeight * game.gridSize - game.GRID_QUARTER);
      }
       break;
    case 1:
      text("mix light colors", 0 + game.GRID_HALF, game.gridHeight * game.gridSize - game.GRID_QUARTER);
      break;
    case 2:
      if (game.detectors[0].correct && game.detectors[1].correct)
      {
        text("use less walls = more points", 0 + game.GRID_HALF, game.gridHeight * game.gridSize - game.GRID_QUARTER);
      }
      else
      {
        text("click grid to build wall", 0 + game.GRID_HALF, game.gridHeight * game.gridSize - game.GRID_QUARTER);
      }
      break;
    case 3:
      text("drag lights to move", 0 + game.GRID_HALF, game.gridHeight * game.gridSize - game.GRID_QUARTER);
      break;
  }
  // draw all required tutorial game instructions, etc. here
  if (game.next_level_available)
  {
    game.next_button_bob_timer += (deltaTime / 100);
    if (game.next_button_bob_timer > TWO_PI)
      game.next_button_bob_timer = 0;

    if (over_next_level)
      fill(255)
    else
      fill(palette.font_color);

    text("next", (game.gridWidth - 3) * game.gridSize, game.gridHeight * game.gridSize - game.GRID_QUARTER - sin(game.next_button_bob_timer));
  }
}

function make_detector(x, y, r, g, b)
{
  let d = new detector(x, y, r, g, b);
  game.detectors.push(d);
  set_grid(game.current_level.grid, x, y, tiles.DETECTOR_TILE);
}

function make_light(x, y, r, g, b)
{
  let new_light = new light_source(x, y, false, r, g, b);
  game.lightsources.push(new_light);
}

function clear_lights()
{
  game.lightsources.forEach(l => l.end_light_mouse_handler());
  game.lightsources = [];
}

function clear_detectors()
{
  game.detectors = [];
}

function teardown_tutorial_game()
{
  // disable gameplay handler and return to main menu
  clear_lights();
  clear_detectors();
  game.need_load_menu_map = true;
  game.game_state = states.TUTORIAL_GAME_OUTRO;
  game.global_mouse_handler.disable_region("game.ghandler"); // remove entirely at some point!
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
  for (let x = 0; x < game.gridWidth; ++x)
  {
    for (let y = 0; y < game.gridHeight; ++y)
    {
      grid[x][y].edge_id = [0, 0, 0, 0];
      grid[x][y].edge_exist = [false, false, false, false];
    }
  }

  for (let x = 0; x < game.gridWidth; ++x)
  {
    for (let y = 0; y < game.gridHeight; ++y)
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
    for (let i = 0; i < 2; ++i)
    {
      let rdx = (i === 0 ? e.sx : e.ex) - xpos;
      let rdy = (i === 0 ? e.sy : e.ey) - ypos;

      let base_ang = atan2(rdy, rdx);

      let ang = 0;
      for (let j = 0; j < 3; ++j)
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
        {
          viz_polygon.push(new viz_poly_point(min_ang, min_px, min_py));
        }
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
    l.update_light_mask();
  }
}

//////// OTHER
function remove_saved_data()
{
  // This will erase all game data including saves, high scores, etc.
  // use with care

  clearStorage();
}

function two_option_dialog(dialog_text, option1_text, option2_text)
{
  // display an option in the middle of the screen and give
  // two options, return either a 0 for option 1 if clicked
  // or a 1 for option 2 if clicked
  // TODO: We can't really "return" something here since we don't
  // know where we're returning to, store the result in some variable 
  // somewhere instead!
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
  textAlign(TOP, TOP);
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
  undo.reset_undo_stacks();
  reset_grid(game.current_level);
  game.points_for_current_grid = count_score();
  turn_lights_off();
  make_edges();
  update_all_light_viz_polys();
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

// from: https://stackoverflow.com/questions/49859246/objects-generated-with-creategraphics-using-p5-js-are-not-being-garbage-collec
