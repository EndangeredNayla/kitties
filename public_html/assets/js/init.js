var REVISION = "9";

(function () {

    // Everything that runs as soon as the page loads; sets up the page and handles the
    // connection to the server.

    var gameState = new GameState();

    $(document).ready(function () {
        // Set up the game

        // Check that the JS and HTML have matching versions
        // (caching is weird)
        var htmlRev = $("#REVISION").val();
        if (htmlRev != REVISION) {
            setTimeout(function () {
                location.reload();
            }, 1500);
            return;
        }

        // Load assets
        var assets = [
            "img/cards/card_back.png",
            "img/cards/card_defuse.png",
            "img/cards/card_exploding.png",
            "img/cards/card_nope.png",
            "img/cards/card_skip.png",
            "img/cards/card_attack.png",
            "img/cards/card_see3.png",
            "img/cards/card_favour.png",
            "img/cards/card_shuffle.png",
            "img/cards/card_random1.png",
            "img/cards/card_random2.png",
            "img/cards/card_random3.png",
            "img/cards/card_random4.png",
            "img/cards/card_random5.png",
            "ogg/atomic.ogg"
        ];
        var promises = [];
        var assetsLoaded = 0;

        //for (var i = 0; i < assets.length; i++) {
        //    (function (url, promise) {
        //       let ext = url.split(".").pop();
        //        var el;
        //        if (ext == "jpg" || ext == "png") {
        //            el = new Image();
        //       } else {
        //            el = new Audio();
        //            el.onloadeddata = el.onload; // Use onloadeddata for audio loading
        //        }
	//
        //        el.onload = function () {
        //            // Increment the loading counter to convince the user we're doing something
        //            assetsLoaded += 1;
        //            document.getElementById("loading-assets").innerHTML = assetsLoaded;
	//
        //            promise.resolve();
        //        };
	//
        //        el.src = "assets/" + url;
	//
        //        gameState.loadAsset(url, el);
        //    })(assets[i], promises[i] = $.Deferred());
        //}

        // Once all the promises have resolved (all assets loaded), call the function to 
        // display the welcome page.
        $.when.apply($, promises).done(welcomePage);
    });

    function welcomePage() {
        // Transition loading screen -> welcome page

        $("#welcome-join").bind("click touchstart", joinGame);

        $("#loading").toggleClass("reveal");
        $("#welcome").toggleClass("reveal");
    }

    function joinGame() {
        // Communicate with the server, make sure we join the game ok, render the board

        if (gameState.conn != null) {
            alert(strings["already_connecting"]);
            return;
        }

        gameState.lobby = $("#welcome-lobby").val() || $("#welcome-lobby").attr("placeholder");
        gameState.name = $("#welcome-username").val() || $("#welcome-username").attr("placeholder");

        if (gameState.name.includes(" ")) {
            alert(strings["one_word"]);
            return;
        }
        if (gameState.lobby.includes(" ")) {
            alert(strings["lobby_one_word"]);
            return;
        }

        gameState.conn = new WebSocket("wss://" + location.host + "/ws");

        gameState.conn.onopen = function () {
            gameState.conn.send("join_lobby " + gameState.lobby + " " + gameState.name);
        };

        gameState.conn.onclose = function () {
            alert(strings["conn_closed"]);
            location.reload();
        };

        gameState.conn.onmessage = function (ev) {
            // We wrap this in an anonymous function so that 'this'
            // will refer to the GameState object and not the WebSocket
            // (I don't have a clue how javascript OOP works)
            gameState.readFromServer(ev);
        };
    }
})();
