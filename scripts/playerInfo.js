function isRunning(app) {
    return Application(app).running();
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
    }
};

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
