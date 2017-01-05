var DEFAULT_WIDTH = 400;
var DEFAULT_HEIGHT = 300;

// =======================
// random string generator

var random_string = function (length) {
    length = length || 12;
    var alphabet = "abcdefghijklmnopqrstuvwxyz"; alphabet += alphabet.toUpperCase();
    var string = "";
    for (var i = 0; i < length; i += 1) {
        var index = ~~(Math.random() * alphabet.length);
        string += alphabet.charAt(index);
    }
    return string;
};

// ==============================
// requestAnimationFrame polyfill

(function () {
    var lastTime = 0;
    var vendors = ['ms', 'moz', 'webkit', 'o'];
    for (var x = 0; x < vendors.length && !window.requestAnimationFrame; ++x) {
        window.requestAnimationFrame = window[vendors[x] + 'RequestAnimationFrame'];
        window.cancelAnimationFrame = window[vendors[x] + 'CancelAnimationFrame']
            || window[vendors[x] + 'CancelRequestAnimationFrame'];
    }

    if (!window.requestAnimationFrame)
        window.requestAnimationFrame = function (callback, element) {
            var currTime = new Date().getTime();
            var timeToCall = Math.max(0, 16 - (currTime - lastTime));
            var id = window.setTimeout(function () { callback(currTime + timeToCall); },
                timeToCall);
            lastTime = currTime + timeToCall;
            return id;
        };

    if (!window.cancelAnimationFrame)
        window.cancelAnimationFrame = function (id) {
            clearTimeout(id);
        };
} ());

// =====================
// update time in corner

var update_time = function () {
    var now = new Date();
    var hour = now.getHours();
    var ampm = "am";
    if (hour >= 12) {
        if (hour > 12) hour -= 12;
        ampm = "pm";
    }
    if (hour < 1) hour += 12;
    var minutes = now.getMinutes();
    if (minutes < 10) minutes = "0" + minutes;
    var dateString = hour + ":" + minutes + ampm;
    document.getElementById("clock").innerText = dateString;
    requestAnimationFrame(update_time);
};

// ===============
// create new note

var Note = function (point, id) {
    var note = this;
    this.save = function (content) {
        var notes = JSON.parse(localStorage.getItem("notes")) || {};
        var element = this.element();
        notes[note.id] = {
            "content": content,
            "x": (1.0 * parseInt(element.style.left) + DEFAULT_WIDTH / 2) / window.innerWidth,
            "y": (1.0 * parseInt(element.style.top) + DEFAULT_HEIGHT / 2) / window.innerHeight
        };
        localStorage.setItem("notes", JSON.stringify(notes));
    };
    this.destroy = function (removeElement) {
        var notes = JSON.parse(localStorage.getItem("notes")) || {};
        if (note.id in notes) delete notes[note.id];
        localStorage.setItem("notes", JSON.stringify(notes));
        if (removeElement)
            document.getElementById("notes").removeChild(this.element());
    };
    this.element = function () {
        var el;
        if ((el = document.getElementById("note-" + note.id)) != null) {
            return el;
        } else {
            el = document.createElement("div");
            el.id = "note-" + note.id;
            el.classList = "note";
            el.style.position = "absolute";
            el.style.width = DEFAULT_WIDTH;
            el.style.height = DEFAULT_HEIGHT;
            el.style.left = point.x - (DEFAULT_WIDTH / 2);
            el.style.top = point.y - (DEFAULT_HEIGHT / 2);
            el.dragging = false;
            document.getElementById("notes").appendChild(el);
            el.onmousedown = function (event) {
                if (event.target == el) {
                    el.dragging = true;
                    el.dragpoint = { x: event.clientX, y: event.clientY };
                    el.style.cursor = "move";
                }
            };
            el.onmouseup = function () {
                el.dragging = false;
                el.style.cursor = "text";
            };

            var editor = document.createElement("div");
            editor.classList = "editor";
            editor.contentEditable = true;
            el.appendChild(editor);

            note.setContent = function (content) {
                editor.innerHTML = content;
            };

            var delbtn = document.createElement("a");
            delbtn.classList = "close";
            delbtn.innerHTML = "&times";
            delbtn.onclick = function () {
                if (confirm("Are you sure you want to delete this note?")) {
                    note.destroy(true);
                }
            };
            el.appendChild(delbtn);

            el.onkeyup = function () {
                var content = editor.innerHTML.trim();
                if (content.length > 0) {
                    note.save(content);
                } else {
                    note.destroy();
                }
            };
            editor.focus();

            return el;
        }
    };
    if (id) {
        this.id = id;
    } else {
        this.id = random_string();
        while (Note.get(this.id) != null) {
            this.id = random_string(); // make sure there are no collisions
        }
    }
    console.log("New note created with id", this.id);
    this.element();
};

Note.get = function (id) {
    var notes = JSON.parse(localStorage.getItem("notes")) || {};
    if (id in notes) {
        return notes[id];
    } else {
        return null;
    }
};

Note.load = function (id, save) {
    var x = save.x * window.innerWidth;
    var y = save.y * window.innerHeight;
    var note = new Note({ x: x, y: y }, id);
    note.setContent(save.content);
};

var clean = function () {
    var children = document.getElementById("notes").children;
    for (var i = 0; i < children.length; i += 1) {
        var child = children[i];
        if (!(child.tagName.toLowerCase() == "div" && child.className.indexOf("note") > -1)) continue;
        var id = child.id.replace("note-", "");
        if (!Note.get(id)) {
            document.getElementById("notes").removeChild(child);
        }
    }
};

var create = function (event) {
    console.log(event);
    if (event.target != document.getElementById("notes"))
        return;
    clean();
    var note = new Note({ x: event.clientX, y: event.clientY });
};

var drag = function (event) {
    if (event.buttons & 1) {
        var children = document.getElementById("notes").children;
        for (var i = 0; i < children.length; i += 1) {
            var el = children[i];
            if (el.dragging) {
                var dx = event.clientX - el.dragpoint.x;
                var dy = event.clientY - el.dragpoint.y;
                var left = parseInt(document.getElementById(el.id).style.left);
                var top = parseInt(document.getElementById(el.id).style.top);
                document.getElementById(el.id).style.left = (left + dx) + "px";
                document.getElementById(el.id).style.top = (top + dy) + "px";
                el.dragpoint = { x: event.clientX, y: event.clientY };

                var notes = JSON.parse(localStorage.getItem("notes")) || {};
                var id = el.id.replace("note-", "");
                if (id in notes) {
                    notes[id].x = 1.0 * (parseInt(document.getElementById(el.id).style.left) + DEFAULT_WIDTH / 2) / window.innerWidth;
                    notes[id].y = 1.0 * (parseInt(document.getElementById(el.id).style.top) + DEFAULT_HEIGHT / 2) / window.innerHeight;
                }
                localStorage.setItem("notes", JSON.stringify(notes));
                break;
            }
        }
    }
};

var load = function () {
    var notes = JSON.parse(localStorage.getItem("notes"));
    for (var id in notes) {
        var note = Note.load(id, notes[id]);
    }
};

var init = function () {
    try {
        JSON.parse(localStorage.getItem("notes"));
    } catch (e) {
        console.log("Local storage corrupted, resetting...");
        localStorage.setItem("notes", JSON.stringify({}));
    }
    requestAnimationFrame(update_time);
    document.getElementById("notes").onclick = create;
    document.getElementById("notes").onmousemove = drag;
    load();
};

init();