function runCommand(command) {
  try {
    var app = Application.currentApplication();
    app.includeStandardAdditions = true;
    
	return app.doShellScript("export PATH=$PATH:/usr/local/bin; " + command);
  } catch (error) {
    return undefined;
  }
}

function isCommandAvailable(command) {
  try {
    return runCommand(command);
  } catch (error) {
    return undefined;
  }
}

function buildScript(command) {
  return "var app = Application.currentApplication(); app.includeStandardAdditions = true; app.doShellScript(\"export PATH=$PATH:/usr/local/bin; " + command + "\")";
}

function isRunning(app) {
    try {
        return Application(app).running();
    } catch (error) {
        return false;
    }
}

function buildAction(app, action){
    return "if(Application(\"" + app + "\").running()){Application(\"" + app + "\")." + action + ";}";
}

var info = {
    itunes: {
        state: -1
    },
    vox: {
        state: -1
    },
    vlc: {
        state: -1
    },
    quicktime: {
        state: -1
    },
	cmus: {
	    state: -1
	}
};

if (isCommandAvailable("cmus-remote --version")) {
    var result = runCommand("cmus-remote -Q");
    var lines = result.split("\r");

    info.cmus["volume"] = 0;

    for (var index in lines) {
        var line = lines[index];
        var parts = line.split(" ");

        var command = parts.shift();

        if (command === "status") {
            info.cmus.state = parts.join(" ");
        }

        if (command === "tag") {
            var name = parts.shift();

            if (name === "artist") {
                info.cmus["artist"] = parts.join(" ");
	        }

            if (name === "title") {
                info.cmus["name"] = parts.join(" ");
            }

            if (name === "album") {
                info.cmus["album"] = parts.join(" ");
            }

            if (name === "albumartist") {
                info.cmus["albumArtist"] = parts.join(" ");
            }
        }

        if (command === "set") {
            var name = parts.shift();

            if (name === "vol_left") {
                info.cmus.volume += +(parts.join(" "));
            }

            if (name === "vol_right") {
                info.cmus.volume += +(parts.join(" "));
            }
        }

        if (command === "position") {
            info.cmus["currentTime"] = +parts.shift();
        }

        if (command === "duration") {
            info.cmus["totalTime"] = +parts.shift();
        }
    }

    info.cmus.state = info.state === "playing" ? 1 : 0;
    info.cmus.volume /= 2;
	info.cmus.action = {
        playpause: buildScript("cmus-remote -u"),
        play: buildScript("cmus-remote -p"),
        pause: buildScript("cmus-remote -U"),
        stop: buildScript("cmus-remote -s"),
        next: buildScript("cmus-remote -n"),
        previous: buildScript("cmus-remote -r")
    }
}

if (isRunning("iTunes")) {
    var app = Application("iTunes");
    if (app.playerState() !== "stopped") {
        var currentTrack = app.currentTrack;
        info.itunes = {
            artist: currentTrack.artist(),
            name: currentTrack.name(),
            album: currentTrack.album(),
            albumArtist: currentTrack.albumArtist(),
            currentTime: app.playerPosition(),
            totalTime: currentTrack.duration(),
            volume: app.soundVolume(),
            state: app.playerState() === "playing" ? 1 : 0,
            action: {
                playpause: buildAction("iTunes", "playpause()"),
                play: buildAction("iTunes", "play()"),
                pause: buildAction("iTunes", "pause()"),
                stop: buildAction("iTunes", "stop()"),
                next: buildAction("iTunes", "nextTrack()"),
                previous: buildAction("iTunes", "previousTrack()")
            }
        };
    }
}

if (isRunning("VOX")) {
    var app = Application("VOX");
    info.vox = {
        artist: app.artist(),
        name: app.track(),
        album: app.album(),
        albumArtist: app.albumArtist(),
        currentTime: app.currentTime(),
        totalTime: app.totalTime(),
        volume: app.playerVolume(),
        state: app.playerState(),
        action: {
            playpause: buildAction("VOX", "playpause()"),
            play: buildAction("VOX", "play()"),
            pause: buildAction("VOX", "pause()"),
            next: buildAction("VOX", "next()"),
            previous: buildAction("VOX", "previous()")
        }
    };
}

if (isRunning("VLC")) {
    var app = Application("VLC");
    if (app.nameOfCurrentItem()) {
        info.vlc = {
            name: app.nameOfCurrentItem(),
            currentTime: app.currentTime(),
            totalTime: app.durationOfCurrentItem(),
            volume: app.audioVolume() * 100 / 256,
            state: app.playing() ? 1 : 0,
            action: {
                play: buildAction("VLC", "play()"),
                stop: buildAction("VLC", "stop()"),
                mute: buildAction("VLC", "mute()"),
                next: buildAction("VLC", "next()"),
                previous: buildAction("VLC", "previous()")
            }
        };
    }
}

if (isRunning("QuickTime Player")) {
    var app = Application("QuickTime Player");
    if (app.documents().length > 0) {
        var document = app.documents()[0];
        info.quicktime = {
            name: document.name(),
            currentTime: document.currentTime(),
            totalTime: document.duration(),
            volume: document.audioVolume() * 100,
            state: document.playing() ? 1 : 0,
            action: {
                play: buildAction("QuickTime Player", "play(Application(\"QuickTime Player\").documents()[0])"),
                pause: buildAction("QuickTime Player", "pause(Application(\"QuickTime Player\").documents()[0])")
            }
        };
    }
}

JSON.stringify(info)
