var processes = Application("System Events").applicationProcesses;

function isRunning(app) {
    try {
        processes[app]();
        return true;
    } catch (e) { }
    return false;
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
	}
};

if (isRunning("iTunes")) {
    var app = Application("iTunes");
    if (app.playerState() !== "stopped") {
        var currentTrack = app.currentTrack;
        gotInfo = true;
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
                playpause: "Application(\"iTunes\").playpause()",
				play: "Application(\"iTunes\").play()",
				pause: "Application(\"iTunes\").pause()",
				stop: "Application(\"iTunes\").stop()",
                next: "Application(\"iTunes\").nextTrack()",
                previous: "Application(\"iTunes\").previousTrack()"
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
            playpause: "Application(\"VOX\").playpause()",
			play: "Application(\"VOX\").play()",
			pause: "Application(\"VOX\").pause()",
            next: "Application(\"VOX\").next()",
            previous: "Application(\"VOX\").previous()"
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
		        play: "Application(\"VLC\").play()",
			    stop: "Application(\"VLC\").stop()",
			    mute: "Application(\"VLC\").mute()",
                next: "Application(\"VLC\").next()",
                previous: "Application(\"VLC\").previous()"
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
		        play: "Application(\"QuickTime Player\").play(Application(\"QuickTime Player\").documents()[0])",
				pause: "Application(\"QuickTime Player\").pause(Application(\"QuickTime Player\").documents()[0])"
            }
        };
	}
}

JSON.stringify(info)
