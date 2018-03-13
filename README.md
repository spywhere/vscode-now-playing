## Now Playing
[![Version](https://vsmarketplacebadge.apphb.com/version/spywhere.now-playing.svg)](https://marketplace.visualstudio.com/items?itemName=spywhere.now-playing)
[![Installs](https://vsmarketplacebadge.apphb.com/installs/spywhere.now-playing.svg)](https://marketplace.visualstudio.com/items?itemName=spywhere.now-playing)

Show current playing track in status bar (macOS only)

![Screenshot](images/screenshot.png)

### What is Now Playing?
Now Playing is simply an extension that show current playing track in Visual Studio Code's status bar with ability to play, pause, play next or previous track.

### Which Media Player does Now Playing support?

Now Playing supports the following media player...

- **VLC** - Play/Stop, Mute, Next and Previous
- **QuickTime Player** - Play and Pause (only the first window opened)
- **iTunes** - Play/Pause, Stop, Next and Previous
- **VOX** - Play/Pause, Next and Previous

### How to use it?
Simply install the extension, and you can use it right away (after restart)!

### What are the options for ...?

#### Default Action

- `SmartPlayPause` Play, pause or stop current track according to the player state
- `Menu` Show all available actions
- `PlayPause` Play or pause current track
- `Play` Play current track (do nothing if already playing)
- `Pause` Pause current track (do nothing if already paused)
- `Stop` Stop current track (do nothing if already stopped)
- `Mute` Mute the player volume
- `Next` Skip current and play next track
- `Previous` Restart current track or replay previous track (depends on player behaviour)

#### Format

All player has the following properties to display in the status text or tooltip...

- `name` (string) Track name
- `artist` (string) Track artist
- `albumArtist` (string) Album artist
- `album` (string) Album name
- `currentTime` (number) Current playing time
- `totalTime` (number) Total playing time
- `volume` (number, 0-100) Audio volume

To insert the property into the status text or tooltip, use `{<Property Name>}`.

For string, you can set the default value, prefix, suffix and maximum length by using `{<Property Name>:<Default Value>:<Prefix>:<Suffix>:<Max Length>}`. All options are optional.

For number, you can represent it different ways by use the following options...

- Fixed decimal point, `{<Property Name>:<Number of Decimal Places>}`
- Convert integer number to percentage (divided by 100), `{<Property Name>:%}`
- Represent in a duration timestamp, `{<Property Name>:duration}`

Examples:

Format|Artist: Unknown - Track: `What's the matter?`|Artist: `Jabba` - Track: `What's the matter?`
:-:|:-:|:-:
`{artist} - {name:::10}`|` - What's the...`|`Jabba - What's the...`
`{artist:Unknown} - {name}`|`Unknown - What's the matter?`|`Jabba - What's the matter?`
`{artist::: - }{name}`|`What's the matter?`|`Jabba - What's the matter?`
`{artist:Unknown:: - }{name}`|`UnknownWhat's the matter?`|`Jabba - What's the matter?`
`{currentTime}/{totalTime:2} {volume:%2}`|`62.745234/133.71 0.53`|`62.745234/133.71 0.53`
`{currentTime:duration}/{totalTime:duration} {volume:0}%`|`1:03/2:13 53%`|`1:03/2:13 53%`
