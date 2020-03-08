$(function(){

    var socket =io.connect('http://127.0.0.1:4000');

    /*
    * Enter chat & load users
    */
    $('a#enterChat').click(function(e){
        e.preventDefault();

        let username =$('#username').val();
        localStorage.setItem('username', username);

        if(username != ""){
            socket.emit('username', username);

            $('div#enterUsername').addClass('hidden');
            $('div#chatMain').removeClass('hidden');
            
            socket.on('users', function(data){
                data.forEach(user => {
                    /// If user doesn't exist not this list
                    if( !$(`li#${user.socketId}`).length && $(`div#userList li`).text() != user.username ){
                        $('div#userList ul').append(`<li id=${user.socketId}>${user.username}</li>`);
                    }
                });
            });

            $('div.chatroom.active').animate({scrollTop: $('div.chatroom.active').prop('scrollHeight') }, 1000);
            
        }else{
            alert('You Must Enter A Username');
        }

    });

    /*
    * Enter Chat on Enter
    */
    $('input#username').keypress(function(e){
        let username =$('#username').val();
        if(e.which == 13){
            if(username != ""){
                $('a#enterChat').click();
            }else{
                alert('Your Must Enter a username !');
            }
        }
    });

    /*
    * Handle logon
    */
    socket.on('logon', function(data){
        $('div#userList ul').append(`<li id=${data.socketId}>${data.username}</li>`);
    });

    /*
    * Handle logOff
    */
    socket.on('logoff', function(id){
        $(`li#${id}`).remove();
        // localStorage.removeItem('username');
    });

    /*
    * Handle chat input
    */
    $('#chatText').keypress(function(e){
        if(e.which == 13){

            let message =$('#chatText').val();
            let windowId =$('div#chatWindow div.active').attr('id');
            let publicChat =true;
            let secondUsername =false;
            let secondUserId;
            let data;

            if(message != ''){

                /// Private Message
                if( !($('#publicChat').hasClass('active')) ){
                    publicChat =false;
                    let usersDiv =$('div.chatroom.active').attr('id');
                    let usersArray =usersDiv.split('-');

                    secondUsername =usersArray[1];
                    secondUserId =$(`li:contains(${secondUsername})`).attr('id');

                    if(!secondUserId){
                        secondUsername =usersArray[0];
                        secondUserId =$(`li:contains(${secondUsername})`).attr('id');
                    }

                    data ={
                        from: localStorage.getItem('username'),
                        message: message,
                        date: moment().format('DD/MM/YYYY HH:mm'),
                        secondUserId: secondUserId,
                        secondUsername: secondUsername
                    }
                    socket.emit('secondUserTrigger', data);
                }/// END Private Message
                
                socket.emit('input', {
                    username: localStorage.getItem('username'),
                    message: message,
                    date: moment().format('DD/MM/YYYY HH:mm'),
                    windowId: windowId
                });
                $('#chatText').val('');
                e.preventDefault();
                
            }else{
                alert('Please Enter A Message !');
            }

        }
    });
    /*
    * Handle chat output
    */
    socket.on('output', function(data){
        if(data.publicChat && !$('div#mainroom').hasClass('active') ){
            $('div#mainroom').addClass('new');
        }else{
            if( !$(`div#${data.windowId}`).hasClass('active') ){
                $(`div#rooms div#${data.username}`).addClass('new');
            }
        }

        if($(`div#chatWindow div#${data.windowId}`).length ){
            $(`div#chatWindow div#${data.windowId}`).append(`<p>[${data.date}]<b>${data.username}</b>: ${data.message}</p>`);
        }else{
            let userArray =data.windowId.split('-');
            $(`div#chatWindow div#${userArray[1]}-${userArray[0]}`).append(`<p>[${data.date}]<b>${data.username}</b>: ${data.message}</p>`);
        }

        

        $('div.chatroom.active').animate({scrollTop: $('div.chatroom.active').prop('scrollHeight') }, 1000);
    });
    /*
    * Load chat Messages
    */
    socket.on('messages', function(data){
        data.forEach((element) => {
            $(`div#publicChat`).append(`<p>${element.date}<b>${element.username}</b>: ${element.message}</p>`);
        });
    });

    /*
    * Handle private chat
    */
    $(document).on('dblclick', 'div#userList li', function(evt){
        let socketId =$(this).attr('id');
        let senderUsername =localStorage.getItem('username');
        let receiverUsername =$(this).text();

        $('#chatText').focus();

        $('div#rooms > div').removeClass('active');
        $('div#chatWindow > div').removeClass('active');

        $('div#rooms').append(`<div id=${receiverUsername} class='active'><span>x</span>${receiverUsername}</div>`);
        $('div#chatWindow').append(`<div id=${senderUsername}-${receiverUsername} class='chatroom active'></div>`);

    });

    /*
    * Handle second user trigger
    */
    socket.on('secondUserChatWindow', function(data){
        if( $(`div#${data.from}`).length ) return;

        $('div#rooms > div').removeClass('active');
        $('div#chatWindow > div').removeClass('active');

        $('div#rooms').append(`<div id=${data.from} class='active'><span>x</span>${data.from}</div>`);
        $('div#chatWindow').append(`<div id=${data.from}-${data.receiverUsername} class='chatroom active'></div>`);

    });

    /*
    * Choose Room
    */
    $('div#rooms').on('click', 'div', function(){

        $('div#rooms > div').removeClass('active');
        $('div#chatWindow > div').removeClass('active');

        $(this).addClass('active');
        $(this).removeClass('new');

        if( $('div#mainroom').hasClass('active') ){
            $('#publicChat').addClass('active');
        }else{
            let firstUsername =localStorage.getItem('username');
            let secondUsername =$(this).attr('id');

            $(`div#chatWindow div#${firstUsername}-${secondUsername}`).addClass('active');
            $(`div#chatWindow div#${secondUsername}-${firstUsername}`).addClass('active');
        }
    });

    /*
    * Close Private Chat
    */
    $('div#rooms').on('click', 'span', function(e){
        e.stopPropagation();
        let firstUsername =localStorage.getItem('username');
        let secondUsername =$(this).parent().attr('id');

        $(`div#chatWindow div#${firstUsername}-${secondUsername}`).remove();
        $(`div#chatWindow div#${secondUsername}-${firstUsername}`).remove();

        $(this).parent().remove();

        if( $('div#rooms > div').length == 1 ){
            $('div#mainroom').addClass('active');
            $('div#publicChat').addClass('active');
        }

    });



});