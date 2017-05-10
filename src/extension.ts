"use strict";
import * as vscode from "vscode";
import * as path from "path";
import { exec } from "child_process";

export function activate(context: vscode.ExtensionContext) {
    let nowPlaying = new NowPlaying();
    context.subscriptions.push(nowPlaying);
    context.subscriptions.push(new NowPlayingController(nowPlaying));
}

class NowPlayingController {
    private nowPlaying: NowPlaying;
    private disposable: vscode.Disposable;

    constructor(nowPlaying: NowPlaying){
        this.nowPlaying = nowPlaying;

        let subscriptions: vscode.Disposable[] = [];
        subscriptions.push(vscode.commands.registerCommand(
            "now-playing.performAction", () => {
                this.nowPlaying.performAction();
            }
        ));
        vscode.workspace.onDidChangeConfiguration(() => {
            this.nowPlaying.updateConfigurations();
        }, this, subscriptions);

        this.disposable = vscode.Disposable.from(...subscriptions);
    }

    dispose(){
        this.disposable.dispose();
    }
}

interface RawTrackInformation {
    name: string;
    artist: string;
    albumArtist: string;
    album: string;
    currentTime: number;
    totalTime: number;
    volume: number;
    state: number;
    action: {
        playpause?: string;
        play?: string;
        pause?: string;
        stop?: string;
        mute?: string;
        next?: string;
        previous?: string;
    }
}

interface RawPlayerInformation {
    itunes: RawTrackInformation;
    vox: RawTrackInformation;
    vlc: RawTrackInformation;
    quicktime: RawTrackInformation;
}

interface PlayerAction {
    playpause?: () => void;
    play?: () => void;
    pause?: () => void;
    stop?: () => void;
    mute?: () => void;
    next?: () => void;
    previous?: () => void;
}

interface TrackInformation {
    name: string;
    artist: string;
    albumArtist: string;
    album: string;
    currentTime: number;
    totalTime: number;
    volume: number;
    playing: boolean;
    action: PlayerAction;
}

class NowPlaying {
    private actions: string[];
    private availableAction?: PlayerAction;
    private statusText: {
        playing: string;
        paused: string;
    };
    private tooltipText: {
        playing: string;
        paused: string;
    };
    private autoHideDuration: number;
    private hideOnPause: boolean;
    private updateInterval: number;
    private statusItem: vscode.StatusBarItem;
    private timer?: NodeJS.Timer;
    private lastInformation?: TrackInformation;

    constructor(){
        this.statusItem = vscode.window.createStatusBarItem(
            vscode.StatusBarAlignment.Right, 300
        );
        this.updateConfigurations();
    }

    dispose(){
        this.statusItem.dispose();
    }

    updateConfigurations(){
        let configurations = vscode.workspace.getConfiguration("now-playing");

        this.actions = configurations.get<string[]>("action");
        this.statusText = {
            playing: configurations.get<string>(
                "statusFormat.playing",
                configurations.get<string>("statusFormat")
            ),
            paused: configurations.get<string>(
                "statusFormat.paused",
                configurations.get<string>("statusFormat")
            )
        };
        this.tooltipText = {
            playing: configurations.get<string>(
                "tooltipFormat.playing",
                configurations.get<string>("tooltipFormat")
            ),
            paused: configurations.get<string>(
                "tooltipFormat.paused",
                configurations.get<string>("tooltipFormat")
            )
        };
        this.hideOnPause = configurations.get<boolean>("hideOnPause");
        this.autoHideDuration = configurations.get<number>("autoHide");
        this.updateInterval = configurations.get<number>("refreshInterval");

        if (this.timer) {
            clearInterval(this.timer);
        }

        if(this.autoHideDuration === 0){
            this.statusItem.hide();
            return;
        }

        this.statusItem.command = (
            this.actions.length > 0 ? "now-playing.performAction" : undefined
        );

        this.statusItem.show();
        this.timer = setInterval(
            () => this.updateTrackInformation(), this.updateInterval * 1000
        );
        this.validateAutoHide();
    }

    showMenu(){
        let items: vscode.QuickPickItem[] = [{
            label: "Smart Play/Pause",
            description: "Continue, pause or stop according to the player state"
        }];
        let action = {
            "Smart Play/Pause": "smartplaypause"
        };
        if (this.availableAction.playpause) {
            let item = {
                label: "Play/Pause",
                description: "Pause or continue playing current track"
            };
            action[item.label] = "playpause";
            items.push(item);
        }
        if (this.availableAction.play) {
            let item = {
                label: "Play",
                description: "Continue playing current track"
            };
            action[item.label] = "play";
            items.push(item);
        }
        if (this.availableAction.pause) {
            let item = {
                label: "Pause",
                description: "Pause current track"
            };
            action[item.label] = "pause";
            items.push(item);
        }
        if (this.availableAction.stop) {
            let item = {
                label: "Stop",
                description: "Stop playing current track"
            };
            action[item.label] = "stop";
            items.push(item);
        }
        if (this.availableAction.mute) {
            let item = {
                label: "Mute",
                description: "Mute the volume"
            };
            action[item.label] = "mute";
            items.push(item);
        }
        if (this.availableAction.next) {
            let item = {
                label: "Next",
                description: "Skip current and play next track"
            };
            action[item.label] = "next";
            items.push(item);
        }
        if (this.availableAction.previous) {
            let item = {
                label: "Previous",
                description: "Restart current track or replay previous track"
            };
            action[item.label] = "previous";
            items.push(item);
        }
        vscode.window.showQuickPick(items).then((value) => {
            if (!value) {
                return;
            }
            this.performAction([action[value.label]]);
        });
    }

    performSmartPlayPause(){
        if (this.availableAction.playpause) {
            this.availableAction.playpause();
        } else if (this.availableAction.play && !this.lastInformation.playing) {
            this.availableAction.play();
        } else if (this.availableAction.pause && this.lastInformation.playing) {
            this.availableAction.pause();
        } else if (this.availableAction.stop && this.lastInformation.playing) {
            this.availableAction.stop();
        } else {
            return false;
        }
        return true;
    }

    performAction(actions?: string[]){
        actions = actions || this.actions;

        for (let rawAction of actions){
            let action = rawAction.toLowerCase();
            if (action === "menu") {
                this.showMenu();
                return;
            } else if (action === "smartplaypause") {
                if (this.performSmartPlayPause()) {
                    this.updateTrackInformation();
                    return;
                }
            } else if (this.availableAction[action]) {
                this.availableAction[action]();
                this.updateTrackInformation();
                return;
            }
        }
    }

    executeCommand(command: string){
        return new Promise<string>((resolve, reject) => {
            exec(command, (error, stdout, stderr) => {
                if (error) {
                    return reject(new Error(stderr));
                }
                return resolve(stdout);
            });
        });
    }

    executeScript(script: string){
        return this.executeCommand(`osascript -l JavaScript -e ${
            JSON.stringify(script)
        }`);
    }

    executeFile(filePath: string){
        return this.executeCommand(`osascript -l JavaScript ${
            filePath
        }`);
    }

    getTrackInformation(){
        return new Promise<TrackInformation>((resolve, reject) => {
            let scriptPath = path.join(
                __dirname, "..", "scripts", "playerinfo.js"
            )

            this.executeFile(
                scriptPath
            ).then((output) => {
                let information: RawPlayerInformation = JSON.parse(output);
                if (information.vlc && information.vlc.state !== -1) {
                    return resolve({
                        name: information.vlc.name,
                        artist: "",
                        albumArtist: "",
                        album: "",
                        currentTime: information.vlc.currentTime,
                        totalTime: information.vlc.totalTime,
                        volume: information.vlc.volume,
                        playing: information.vlc.state === 1,
                        action: {
                            play: () => this.executeScript(
                                information.vlc.action.play
                            ),
                            stop: () => this.executeScript(
                                information.vlc.action.stop
                            ),
                            mute: () => this.executeScript(
                                information.vlc.action.mute
                            ),
                            next: () => this.executeScript(
                                information.vlc.action.next
                            ),
                            previous: () => this.executeScript(
                                information.vlc.action.previous
                            )
                        }
                    });
                } else if (information.quicktime && information.quicktime.state !== -1) {
                    return resolve({
                        name: information.quicktime.name,
                        artist: "",
                        albumArtist: "",
                        album: "",
                        currentTime: information.quicktime.currentTime,
                        totalTime: information.quicktime.totalTime,
                        volume: information.quicktime.volume,
                        playing: information.quicktime.state === 1,
                        action: {
                            play: () => this.executeScript(
                                information.quicktime.action.play
                            ),
                            pause: () => this.executeScript(
                                information.quicktime.action.pause
                            )
                        }
                    });
                } else if (information.itunes && information.itunes.state !== -1) {
                    return resolve({
                        name: information.itunes.name,
                        artist: information.itunes.artist,
                        albumArtist: information.itunes.albumArtist,
                        album: information.itunes.album,
                        currentTime: information.itunes.currentTime,
                        totalTime: information.itunes.totalTime,
                        volume: information.itunes.volume,
                        playing: information.itunes.state === 1,
                        action: {
                            playpause: () => this.executeScript(
                                information.itunes.action.playpause
                            ),
                            play: () => this.executeScript(
                                information.itunes.action.play
                            ),
                            pause: () => this.executeScript(
                                information.itunes.action.pause
                            ),
                            stop: () => this.executeScript(
                                information.itunes.action.stop
                            ),
                            next: () => this.executeScript(
                                information.itunes.action.next
                            ),
                            previous: () => this.executeScript(
                                information.itunes.action.previous
                            )
                        }
                    });
                } else if (information.vox && information.vox.state !== -1) {
                    return resolve({
                        name: information.vox.name,
                        artist: information.vox.artist,
                        albumArtist: information.vox.albumArtist,
                        album: information.vox.album,
                        currentTime: information.vox.currentTime,
                        totalTime: information.vox.totalTime,
                        volume: information.vox.volume,
                        playing: information.vox.state === 1,
                        action: {
                            playpause: () => this.executeScript(
                                information.vox.action.playpause
                            ),
                            play: () => this.executeScript(
                                information.vox.action.play
                            ),
                            pause: () => this.executeScript(
                                information.vox.action.pause
                            ),
                            next: () => this.executeScript(
                                information.vox.action.next
                            ),
                            previous: () => this.executeScript(
                                information.vox.action.previous
                            )
                        }
                    });
                } else {
                    return reject(new Error("No player is playing"));
                }
            }).catch((error) => {
                return reject(error);
            });
        });
    }

    replaceTrackInformation(format: string, trackInformation: TrackInformation){
        return format.replace(
            new RegExp("{\\s*(\\w+)\\s*(:\\s*([^}]+))?}", "g"),
            (match, name, m2, format) => {
                let value: any = "";

                if (trackInformation[name] !== undefined) {
                    value = trackInformation[name];
                }

                if (typeof(value) === "string" && format) {
                    let [defaultValue, prefix, suffix] = format.split(":");
                    if (!value) {
                        value = defaultValue || "";
                    } else {
                        value = (prefix || "") + value + (suffix || "");
                    }
                }else if (typeof(value) === "number" && format) {
                    if (format === "duration") {
                        value = Math.round(value);
                        let hour = Math.floor(value / 3600);
                        let minute = Math.floor(value / 60) % 60;
                        let second = Math.round(value) % 60;
                        return `${
                            (hour > 0 ? `${ hour }:` : "")
                        }${
                            minute
                        }:${
                            (second < 10 ? `0${ second }` : second)
                        }`;
                    }
                    if (format.startsWith("%")) {
                        value = value / 100.0;
                        format = format.slice(1);
                    }
                    if (new RegExp("^\\d+$", "g").test(format)) {
                        value = value.toFixed(parseInt(format));
                    }
                }

                return value;
            }
        );
    }

    validateAutoHide(){
        if (this.autoHideDuration >= 0) {
            setTimeout(
                () => this.statusItem.hide(),
                this.autoHideDuration * 1000
            );
        }
    }

    updateTrackInformation(){
        this.getTrackInformation().then((trackInformation) => {
            if (
                !this.lastInformation ||
                this.lastInformation.name !== trackInformation.name ||
                this.lastInformation.artist !== trackInformation.artist ||
                this.lastInformation.playing !== trackInformation.playing ||
                (
                    this.lastInformation.albumArtist !==
                    trackInformation.albumArtist
                ) ||
                this.lastInformation.album !== trackInformation.album
            ) {
                this.lastInformation = trackInformation;
                this.statusItem.show();

                this.validateAutoHide();
            }

            if (this.hideOnPause && !trackInformation.playing) {
                this.statusItem.hide();
                return;
            }

            this.availableAction = trackInformation.action;
            this.statusItem.text = this.replaceTrackInformation(
                (
                    trackInformation.playing ?
                    this.statusText.playing : this.statusText.paused
                ),
                trackInformation
            );
            this.statusItem.tooltip = this.replaceTrackInformation(
                (
                    trackInformation.playing ?
                    this.tooltipText.playing : this.tooltipText.paused
                ),
                trackInformation
            );
        }).catch((error) => {
            this.availableAction = undefined;
            this.statusItem.hide();
        });
    }
}
