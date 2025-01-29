(function() {
    'use strict';

    const storageKey = 'fierce_online_users_position';

    const $onlineUsersContainer = $('<div id="online-users"></div>').css({
        position: 'fixed',
        top: '0',
        left: '0',
        background: 'rgba(0, 0, 0, 0.7)',
        color: '#fff',
        padding: '10px',
        borderRadius: '0 5px 5px 0',
        zIndex: 9999,
        maxHeight: '90vh',
        overflowY: 'auto',
        fontFamily: 'Arial, sans-serif',
        fontSize: '14px',
        border: '1px solid #333'
    }).appendTo('body');

    const $minimizeButton = $('<div></div>').css({
        position: 'absolute',
        top: '5px',
        right: '5px',
        width: '20px',
        height: '20px',
        background: 'rgba(0, 0, 0, 0.8)',
        color: '#ccc',
        borderRadius: '3px',
        textAlign: 'center',
        lineHeight: '20px',
        cursor: 'pointer',
        fontSize: '14px',
        fontWeight: 'bold'
    }).text('-').appendTo($onlineUsersContainer);

    const $onlineUsersList = $('<ul></ul>').css({
        listStyle: 'none',
        padding: '0',
        margin: '0'
    }).appendTo($onlineUsersContainer);

    const $messages = $('.messages');
    const $inputMessage = $('.inputMessage');
    const socket = io();

    let listRequestInterval = 30000;
    let username = '';

    function updateOnlineUsers(users) {
        $onlineUsersList.empty();
        users.forEach(user => {
            const $userItem = $('<li></li>').css({
                display: 'flex',
                alignItems: 'center',
                marginBottom: '5px',
                padding: '5px',
                borderRadius: '5px',
                background: '#222',
                color: '#fff'
            });

            const $username = $(`<span>${user}</span>`).css({
                flexGrow: '1',
                fontWeight: 'bold'
            });

            if (user !== username) {
                const $whisperButton = $('<button>Whisper</button>').css({
                    backgroundColor: '#007bff',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '5px',
                    padding: '6px 12px',
                    marginLeft: '10px',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: 'bold',
                    transition: 'background-color 0.3s'
                }).hover(
                    function() {
                        $(this).css('background-color', '#0056b3');
                    },
                    function() {
                        $(this).css('background-color', '#007bff');
                    }
                ).click(function() {
                    $inputMessage.val(`/w ${user} `).focus();
                });

                $userItem.append($username, $whisperButton);
            } else {
                $userItem.append($username);
            }

            $onlineUsersList.append($userItem);
        });
    }

    function sendListCommand() {
        socket.emit('new message', '/list');
    }

    function parseOnlineUsers(message) {
        const userListPrefix = 'Currently online users: ';
        if (message.startsWith(userListPrefix)) {
            const users = message.slice(userListPrefix.length).split(', ').filter(Boolean);
            updateOnlineUsers(users);
        }
    }

    function hideListResponse(messageId) {
        const $messageElement = $messages.find(`li[data-message-id="${messageId}"]`);
        if ($messageElement.length) {
            $messageElement.remove();
        }
    }

    socket.on('new message', function(data) {
        if (data.username === 'system' && data.message.startsWith('Currently online users: ')) {
            parseOnlineUsers(data.message);
            if (data.messageId) {
                hideListResponse(data.messageId);
            }
        }
    });

    socket.on('user joined', function(data) {
        if (!username) username = data.username;
        sendListCommand();
    });

    socket.on('user left', function() {
        sendListCommand();
    });

    setInterval(sendListCommand, listRequestInterval);

    $(document).ready(function() {
        sendListCommand();

        const savedPosition = JSON.parse(localStorage.getItem(storageKey));
        if (savedPosition) {
            $onlineUsersContainer.css({
                top: savedPosition.top,
                left: savedPosition.left
            });
        }

        $onlineUsersContainer.draggable({
            start: function(event, ui) {
                ui.helper.data('startPosition', ui.position);
            },
            stop: function(event, ui) {
                localStorage.setItem(storageKey, JSON.stringify({
                    top: ui.position.top,
                    left: ui.position.left
                }));
            }
        });

        $minimizeButton.click(function() {
            $onlineUsersList.toggle();
            $(this).text($onlineUsersList.is(':visible') ? '-' : '+');
        });
    });
})();
