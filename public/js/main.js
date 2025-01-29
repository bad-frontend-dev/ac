$(function () {
    var $window = $(window),
        $messages = $(".messages"),
        $inputMessage = $(".inputMessage"),
        $usernameInput = $(".usernameInput"),
        $loginPage = $(".login.page"),
        $chatPage = $(".chat.page"),
        username,
        connected = false,
        typing = false,
        lastTypingTime,
        $currentInput = $usernameInput,
        socket = io(),
        iconsData = {},
        $contextMenu = null,
        messageHistory = [],
        historyIndex = -1;

    $.getJSON("js/icons.json", function (data) {
        iconsData = data;
    });

    function addParticipantsMessage(data) {
        var message =
            data.numUsers === 1
                ? "there's 1 participant"
                : "there are " + data.numUsers + " participants";
        log(message);
    }

    function setUsername() {
        username = cleanInput($usernameInput.val().trim());
        if (!username) return;
        if (username.length > 16) {
            alert("Username must be 16 characters or less.");
            return;
        }
        $loginPage.fadeOut();
        $chatPage.show();
        $loginPage.off("click");
        $currentInput = $inputMessage.focus();
        socket.emit("add user", username);
    }

    function sendMessage() {
        var message = cleanInput($inputMessage.val());
        if (!message || !connected) return;
        $inputMessage.val("");
        addChatMessage({ username: username, message: message });
        socket.emit("new message", message);
        messageHistory.push(message);
        historyIndex = messageHistory.length;
    }

    function log(message, options) {
        var $el = $("<li>").addClass("log").text(message);
        addMessageElement($el, options);
    }

    function addChatMessage(data, options) {
        var $typingMessages = getTypingMessages(data);
        options = options || {};
        if ($typingMessages.length !== 0) {
            options.fade = false;
            $typingMessages.remove();
        }

        var userSettings = iconsData[data.username] || {
            nametag: "none",
            icon: null,
        };
        var displayName = data.username;

        if (userSettings.nametag === "owner") {
            displayName = "[Owner] " + displayName;
        }

        var $usernameDiv = $('<span class="username"/>')
            .text(displayName)
            .css("color", getUsernameColor(data.username));

        if (userSettings.icon) {
            $usernameDiv.prepend(
                `<img src="${userSettings.icon}" class="icon">`
            );
        }

        if (userSettings.nametag !== "none") {
            $usernameDiv.addClass(userSettings.nametag);
            $("<link/>", {
                rel: "stylesheet",
                type: "text/css",
                href: `./tags/${userSettings.nametag}.css`,
            }).appendTo("head");
        }

        var $messageBodyDiv = $('<span class="messageBody"/>').html(
            linkify(applyMarkdown(data.message))
        );
        var typingClass = data.typing ? "typing" : "";
        var $messageDiv = $('<li class="message"/>')
            .data("username", data.username)
            .addClass(typingClass)
            .append($usernameDiv, $messageBodyDiv);
        addMessageElement($messageDiv);

        var regex = /@([a-zA-Z0-9_`]+)/gi,
            match;
        while ((match = regex.exec(data.message)) !== null) {
            var mentionedUser = match[1].trim();
            if ($(".username:contains(" + mentionedUser + ")").length > 0) {
                var $messageBody = $messageDiv.find(".messageBody");
                $messageBody.html(function (i, html) {
                    return html.replace(
                        "@" + mentionedUser,
                        '<span class="mention">@' + mentionedUser + "</span>"
                    );
                });
            }
        }

        var regexHighlight = new RegExp("@" + username, "gi");
        if (regexHighlight.test(data.message))
            $messageDiv.addClass("highlight");
        if ($messages.hasClass("autoscroll"))
            $messages.scrollTop($messages[0].scrollHeight);
    }

    function linkify(message) {
        return message.replace(
            /(https?:\/\/[^\s]+)/g,
            '<a href="$1" target="_blank">$1</a>'
        );
    }

    function applyMarkdown(text) {
        let parts = text.split(/(`[^`]+`)/g);
        for (let i = 0; i < parts.length; i++) {
            if (parts[i].startsWith("`") && parts[i].endsWith("`")) {
                parts[i] = `<code>${parts[i].slice(1, -1)}</code>`;
            } else {
                parts[i] = parts[i]
                    .replace(/\*\*\*([^\*]+)\*\*\*/g, "<b><i>$1</i></b>")
                    .replace(/\*\*([^\*]+)\*\*/g, "<b>$1</b>")
                    .replace(/\*([^\*]+)\*/g, "<i>$1</i>")
                    .replace(/~~([^~]+)~~/g, "<del>$1</del>")
                    .replace(
                        /\$([0-9,]+(?:\.[0-9]{1,2})?)\$/g,
                        '<span class="money">$1</span>'
                    )
                    .replace(/__([^_]+)__/g, "<u>$1</u>");
            }
        }
        return parts.join("");
    }

    function addChatTyping(data) {
        data.typing = true;
        data.message = "is typing";
        addChatMessage(data);
    }

    function removeChatTyping(data) {
        getTypingMessages(data).fadeOut(function () {
            $(this).remove();
        });
    }

    function addMessageElement(el, options) {
        var $el = $(el);
        options = options || { fade: true, prepend: false };
        if (options.fade) $el.hide().fadeIn(150);
        options.prepend ? $messages.prepend($el) : $messages.append($el);
        if ($messages.hasClass("autoscroll") && !$el.hasClass("highlight"))
            $messages.scrollTop($messages[0].scrollHeight);
    }

    function cleanInput(input) {
        return $("<div/>").text(input).html();
    }

    function updateTyping() {
        if (!connected) return;
        if (!typing) {
            typing = true;
            socket.emit("typing");
        }
        lastTypingTime = new Date().getTime();
        setTimeout(function () {
            var typingTimer = new Date().getTime();
            var timeDiff = typingTimer - lastTypingTime;
            if (timeDiff >= 400 && typing) {
                socket.emit("stop typing");
                typing = false;
            }
        }, 400);
    }

    function getTypingMessages(data) {
        return $(".typing.message").filter(function (i) {
            return $(this).data("username") === data.username;
        });
    }

    function getUsernameColor(username) {
        var hash = 7;
        for (var i = 0; i < username.length; i++) {
            hash = username.charCodeAt(i) + (hash << 5) - hash;
        }
        var index = Math.abs(hash % 12);
        return [
            "#e21400",
            "#91580f",
            "#f8a700",
            "#f78b00",
            "#58dc00",
            "#287b00",
            "#a8f07a",
            "#4ae8c4",
            "#3b88eb",
            "#3824aa",
            "#a700ff",
            "#d300e7",
        ][index];
    }

    function isScrolledToBottom() {
        return (
            $messages[0].scrollHeight - $messages.scrollTop() ===
            $messages.outerHeight()
        );
    }

    function enableAutoscroll() {
        $messages.addClass("autoscroll");
        $messages.scrollTop($messages[0].scrollHeight);
    }

    function disableAutoscroll() {
        $messages.removeClass("autoscroll");
    }

    $messages.scroll(function () {
        isScrolledToBottom() ? enableAutoscroll() : disableAutoscroll();
    });

    $window.keydown(function (event) {
        if (!(event.ctrlKey || event.metaKey || event.altKey)) {
            $currentInput.focus();
        }
        if (event.which === 13) {
            if (username) {
                sendMessage();
                socket.emit("stop typing");
                typing = false;
            } else {
                setUsername();
            }
        } else if (event.which === 38) {
            if (historyIndex > 0) {
                historyIndex--;
                $inputMessage.val(messageHistory[historyIndex]);
            }
        } else if (event.which === 40) {
            if (historyIndex < messageHistory.length - 1) {
                historyIndex++;
                $inputMessage.val(messageHistory[historyIndex]);
            } else {
                $inputMessage.val("");
                historyIndex = messageHistory.length;
            }
        }
    });

    $inputMessage.on("input", function () {
        updateTyping();
    });

    $loginPage.click(function () {
        $currentInput.focus();
    });

    $inputMessage.click(function () {
        $inputMessage.focus();
    });

    $messages.on("contextmenu", ".message", function (event) {
        event.preventDefault();
        if ($contextMenu) $contextMenu.remove();

        var $message = $(this);
        var clickedUsername = $message.data("username");

        $contextMenu = $('<div class="context-menu"/>')
            .css({
                position: "absolute",
                top: event.pageY + "px",
                left: event.pageX + "px",
                backgroundColor: "#000",
                color: "#fff",
                padding: "10px",
                borderRadius: "5px",
                zIndex: 1000,
                border: "1px solid #333",
            })
            .appendTo("body");

        $('<div class="menu-item"/>')
            .html(
                '<span class="mention-icon fas fa-solid fa-at"></span> <span class="mention-text">Mention</span>'
            )
            .css("color", "#7289DA")
            .appendTo($contextMenu)
            .click(function () {
                $inputMessage.val("@" + clickedUsername + " ").focus();
                $contextMenu.remove();
            });

        $('<div class="menu-item"/>')
            .html(
                '<span class="copy-icon fas fa-solid fa-clipboard"></span> <span class="copy-text">Copy</span>'
            )
            .appendTo($contextMenu)
            .click(function () {
                var messageText = $message.find(".messageBody").text();
                navigator.clipboard.writeText(messageText);
                $contextMenu.remove();
            });

        $(document).on("click.context-menu", function () {
            $contextMenu.remove();
            $(document).off("click.context-menu");
        });
    });

    socket.on("login", function (data) {
        connected = true;
        addParticipantsMessage(data);
    });

    socket.on("new message", function (data) {
        data.message = applyMarkdown(data.message);
        addChatMessage(data, { fade: true });
    });

    socket.on("name rejected", function (data) {
        alert(data.reason);
        $loginPage.show();
        $usernameInput.val("");
    });

    socket.on("user joined", function (data) {
        log(data.username + " joined");
        addParticipantsMessage(data);
    });

    socket.on("user left", function (data) {
        log(data.username + " left");
        addParticipantsMessage(data);
        removeChatTyping(data);
    });

    socket.on("typing", function (data) {
        addChatTyping(data);
    });

    socket.on("stop typing", function (data) {
        removeChatTyping(data);
    });

    socket.on("disconnect", function () {
        log("you have been disconnected");

        let count = 0;
        const interval = setInterval(() => {
            if (socket.connected) {
                clearInterval(interval);
                log("you have been reconnected");
                socket.emit("add user", username);
                return;
            }
            if (count >= 5) {
                clearInterval(interval);
                log("unable to reconnect");
                return;
            }

            count += 1;
            socket.connect();
            log("attempting to reconnect...");
        }, 1000);
    });

    socket.on("password prompt", function (username) {
        var password = prompt("Enter the password for " + username + ":");
        if (password) {
            socket.emit("password submit", password, username);
        }
    });

    socket.on("user kicked", function (data) {
        if (data.username === username) {
            alert("You have been kicked from the chat.");
            window.location.reload();
        } else {
            log(data.username + " was kicked from the chat.");
        }
    });

    socket.on("kick message", function (data) {
        var $usernameDiv = $('<span class="username"/>')
            .text(data.username)
            .css("color", getUsernameColor(data.username));
        var $messageBodyDiv = $('<span class="messageBody"/>').html(
            linkify(data.message)
        );
        var $messageDiv = $('<li class="message kick"/>').append(
            $usernameDiv,
            $messageBodyDiv
        );
        addMessageElement($messageDiv);
    });

    socket.on("status message", function (data) {
        log(data.message);
    });
});
