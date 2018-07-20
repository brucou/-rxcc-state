# Features
- cyclejs app, if possible latest with rx
- no ajax call or something
- cd player receives command through sinks and send events through source
  - only one driver, we assume that all commands are successfully executed (for the demo)
- one window for window player who will change its color according to current state
  - if possible show possible outgoing transitions from current state (LATER)
  - if possible show possible events who can trigger transitions (LATER)
- one window for cd player UI, which is one bar of buttons, and on top a label box with 
  - `${song number} / ${song name} : timer`
- timer driver which emits an event after x seconds (commanded through sinks)
- cd player driver receives commands
  - stop, play, pause, forward xs, backward xs, next track, previous track, fetch
- cd player driver sends events
  - end of track, end of cd, fetched cd state

# Description
## Cd player

State :
- Array<Song>
- Song :: Record<SongName, SongDuration>
- SongNumber is the position of a song in the array of songs
- PlayState :: Record<State :: PLAYING|PAUSED|STOPPED, SongNumber, SongName, SongPlayedTime>
- CDPlayerState :: OPEN | CLOSED
