/*
    IN
        e enemies-list [[p,a,x,y],[...]..]
        b arena-block-list [0,1,0,1,0,1,0...]
        p player-id (int)
        a player-avatar (e v m)
        u player-username (string)
        x player-pos-x (int)
        y player-pos-y (int)
        d player-direction (n s w e)
        o player-old-direction (n s w e)
        i bomb-id (int)
        c cmd:
            z welcome
            m move player p in x,y
            p add player p in x,y
            k kill player p
            b drop bomb i in x,y
            x explode bomb i
            0 stop player p in x,y
            v vincitore p

    OUT
        p player-id (int)
        a player-avatar (e v m)
        u player-username
        c cmd:
            j join arena with avatar a
            //r ready-drop-new-bomb
            J join again
            b drop bomb
            w move west
            e move est
            n move north
            s move south
            0 stop
*/


jQuery(function(){
    var	SOCKET_ADDRESS = "ws://bombertab.20tab.com/tremolo";

	var BORDER_CELL = 0;
	var CELLS_NUMBER_W = 19;
	var CELLS_NUMBER_H = 11;
	var CELL_W = 50;
	var CELL_H = CELL_W;
	var PG_W = (CELL_W+BORDER_CELL*2)*CELLS_NUMBER_W;
	var PG_H = (CELL_H+BORDER_CELL*2)*CELLS_NUMBER_H;
	var ACTOR_W = 50;
	var ACTOR_H = 70;
	var BOMB_W = 150;
	var BOMB_H = 150;
	var EXPLOSION_W = 150;
	var EXPLOSION_H = 150;
	var RATE = 60;
	
	var avatar = 'e';
    var username = '';
	var player_id = 0;
	var player_over = false;
	var game_over = false;
	var events = Array();
    var players = Array();
    var bombs = Array();

    /* objects */

    function Bomb(id, posx, posy, player_id){
        this.id = id;
        this.posx = posx;
        this.posy = posy;
        this.player_id = player_id;
        self = this;

        this.create = function create(){
            if($("#bomb_"+this.id).get()){
                write_log('p: '+this.player_id+' | inizio sequenza drop '+'i: '+this.id,'red');
                bombSound["drop"].play();
                $.playground()
                    .addGroup("bomb_"+this.id, {posx: this.posx, posy: this.posy, width: BOMB_W, height: BOMB_H})
                          .addSprite("bombBody_"+this.id,{
                                animation: bombAnimation["drop"],
                                posx: -50, posy: -50, width: BOMB_W, height: BOMB_H, 
                                callback: function(){
                                    write_log('p: '+this.player_id+' | inizio sequenza loop '+'i: '+this.id,'red');
                                    bombSound["loop"].play();
                                    $("#bombBody_"+this.id).setAnimation(bombAnimation["loop"]);
                                }
                            });	              
            }
        }

        this.explode = function explode(){
            write_log('p: '+this.player_id+' | esplode la bomba '+'i: '+this.id,'red'); 
            bombSound["loop"].pause();
            bombSound["explode"].play();       
            $("#bombBody_"+bombid).setAnimation(bombAnimation["explode"],           	    	
                function(){
                    write_log('p: '+self.player_id+' | rimuovendo la bomba '+'i: '+this.id,'red');
                    $("#bomb_"+this.id).remove();
                    write_log('p: '+self.player_id+' | rimossa la bomba '+'i: '+this.id,'red');                  
               }
            ); 
        }
    }

    function Player(id, username, avatar, posx, posy){
        this.id = id;
        this.username = username;
        this.avatar = avatar;
        this.posx = posx;
        this.posy = posy;
        this.direction = 'e';
        this.old_direction = 'e'
        this.dead = false;
        this.player = false
        var self = this;

        this.create = function create(){
            $.playground().addGroup("player_"+this.id, {posx: this.posx, posy: this.posy, width: ACTOR_W, height: ACTOR_H})
                 .addSprite("playerBody_"+this.id,{animation: playerAnimation[this.avatar+"_idle"],
                       posx: 0, posy: 0, width: ACTOR_W, height: ACTOR_H});
            $('#game_stats').append('<div class="stats_enemy" id="stats_p_'+this.id+'"><p>'+this.username+' ('+this.id+')</p></div>');
            $("<div class='username_box'>"+this.username+"</div>").appendTo('#playerBody_'+this.id);
        }

        this.rebord = function reborn(){
            this.dead = false;
        }

        this.set_player = function set_player(){
            this.player = true;
        }

        this.move = function move(new_dir, old_dir, x, y){
            this.posx = x;
            this.posy = y;
            this.direction = new_dir;
            this.old_direction = old_dir;           
            write_log('p: '+this.id+'/'+this.avatar+' | d: '+new_dir+" - o: "+old_dir);
            if(new_dir != old_dir){   //changing direction compared to previous frame
                write_log('p: '+this.id+'/'+this.avatar+' | cambio dir','orange');
                switch(new_dir){ //checking new direction and setting new animation
                    case "n": //north
                        $("#playerBody_"+this.id).setAnimation(playerAnimation[this.avatar+"_up"]);
                        break;
                    case "s": //south
                        $("#playerBody_"+this.id).setAnimation(playerAnimation[this.avatar+"_down"]);
                        break;
                    case "w": //west
                        $("#playerBody_"+this.id).setAnimation(playerAnimation[this.avatar+"_left"]);
                        break;
                    case "e": //east
                        $("#playerBody_"+this.id).setAnimation(playerAnimation[this.avatar+"_right"]);
                        break;
                }
            }
            //in any case I have to move the player to the new coord
            $("#player_"+this.id).css("left", x+"px");
            $("#player_"+this.id).css("top", y+"px");           
        }

        this.stop = function stop(direction){
            write_log('p: '+this.id+'/'+this.avatar+' | idle','blue');
            switch(direction){  // controllo quale direzione viene passata
                case "n":
                    $("#playerBody_"+this.id).setAnimation(playerAnimation[this.avatar+"_idle-n"]);
                    break;
                case "e":
                    $("#playerBody_"+this.id).setAnimation(playerAnimation[this.avatar+"_idle-e"]);
                    break;
                case "s":
                    $("#playerBody_"+this.id).setAnimation(playerAnimation[this.avatar+"_idle-s"]);
                    break;
                case "w":
                    $("#playerBody_"+this.id).setAnimation(playerAnimation[this.avatar+"_idle-w"]);
                    break;
                default:
                    $("#playerBody_"+this.id).setAnimation(playerAnimation[this.avatar+"_idle"]);
                    break;
            } 
        }

        this.drop_bomb = function drop_bomb(bombid, bombx, bomby){
            write_log('p: '+this.id+' | lascio la bomba '+'i: '+bombid,'red');
            bombs[bombid] = new Bomb(bombid, bombx, bomby, this.id);
            bombs[bombid].create();
        }

        // v - winner
        this.win = function win(){
            if(this.player){
                $('#game_over h2').removeClass().addClass('winner').html('WINNER');
                $('#game_over').fadeIn();
                gameSound["winner"].play();                   
            } 
            write_log('p: '+this.id+' | VITTORIA!','green'); 
            $("#playerBody_"+this.id).setAnimation(playerAnimation[this.avatar+"_winner"],           	    	
                function(){
                    //$.playground().pauseGame();
                    write_log('p: '+self.id+' | FINE GIOCO ','red');  
                    write_log('p: '+self.id+' | rimuovendo dopo vittoria','red');
                    $("#player_"+self.id).remove();
                    $("#stats_p_"+self.id).remove();
                    write_log('p: '+self.id+' | vincitore rimosso','red');
                    if(self.player){
                        $('#play_again').fadeIn();
                    }
                }
            ); 
        }

        this.die = function die(){
            console.log(this.username + ' dying');
            this.dead = true;
            playerSound["die"].play();
            write_log('p: '+this.id+' | dying','red');
            console.log('parte animazion di morte');
            $("#playerBody_"+this.id).setAnimation(
                playerAnimation[this.avatar+"_die"],
                function(){
                    write_log('p: '+self.id+' | removing','red');
                    $("#player_"+self.id).remove();
                    $("#stats_p_"+self.id).remove();
                    write_log('p: '+self.id+' | dead and removed','red');
                    if(self.id == player_id){  //player_over
                        player_over = true;
                        anim_player_over();
                        write_log('p: '+self.id+' | CURRENT PLAYER GAME OVER','red');
                    }
                }
            ); // /setAnimation
        } // /die

    } // /Player 

	
	
	
	/* log */
	var DEBUG = false;
    $('#debug_button input').click(function(){
        DEBUG = $(this).is(":checked");
    });
	var last_log = [new Date(),new Date(),new Date()];
	function write_log(str, color, table){
	    if(DEBUG){
	        if(!color){color = 'black';}
	        if(!table){table = 0;} //0=screen 1=in 2=out
        	var d = new Date();
        	diff = d - last_log[table];
        	if(diff > 64){
        	    $("#log_"+table).prepend('<b style="color:red; font-size: 1.1em;">interval:'+diff+'</b> ');
        	}
	        $("#log_"+table).prepend('<span style="color:'+color+'">'+d.getHours()+':'+d.getMinutes()+':'+d.getSeconds()+':'+d.getMilliseconds()+' '+str+'</span><br/>');
	        last_log[table] = d;
	    }
	}
	/* /log */
	
	
	function arena(grid){
		var html_grid = "" 
		var i = 0;
		var pos = 0;
		while( i < grid.length){
			html_grid += '<div class="grid-row">'; 
			var j = 0;
			while(j < CELLS_NUMBER_W){
				var type = "brick";
				if(!grid[pos]){
					type = "lawn";
				}
				html_grid += '<div class="grid-cell '+type+'"></div>';
				j++;
				pos++;
			}
			html_grid += '<div class="fixfloat"></div></div>' 
			i++;
		}
		return html_grid;
	}
	var playerAnimation = Array();
	var playerSound = Array();
	var bombAnimation = Array();
	var bombSound = Array();
	var gameSound = Array();
	
	function init_arena(){
		
		// inizializzo la griglia con la sprite  da usare
		$.playground().addSprite('grid',{height: PG_H, width: PG_W}).end();
		
		// imposto le animazioni da usare
		playerAnimation["e_idle"] = 	new $.gameQuery.Animation({
        	imageURL: "img/emperor.png", numberOfFrame: 1, delta: 50, rate: 250, type: $.gameQuery.ANIMATION_HORIZONTAL, offsetx:0, offsety:75
        	});
	    playerAnimation["e_right"]      = new $.gameQuery.Animation({
        	imageURL: "img/emperor.png", numberOfFrame: 2, delta: 50, rate: 250, type: $.gameQuery.ANIMATION_HORIZONTAL, offsetx:0, offsety:75
        	});
        playerAnimation["e_idle-e"]      = new $.gameQuery.Animation({
        	imageURL: "img/emperor.png", numberOfFrame: 1, delta: 50, rate: 250, type: $.gameQuery.ANIMATION_HORIZONTAL, offsetx:0, offsety:75
        	});
	    playerAnimation["e_left"] =	new $.gameQuery.Animation({
        	imageURL: "img/emperor.png", numberOfFrame: 2, delta: 50, rate: 250, type: $.gameQuery.ANIMATION_HORIZONTAL, offsetx:0, offsety:225
        	});
        playerAnimation["e_idle-w"] =	new $.gameQuery.Animation({
        	imageURL: "img/emperor.png", numberOfFrame: 1, delta: 50, rate: 250, type: $.gameQuery.ANIMATION_HORIZONTAL, offsetx:0, offsety:225
        	});
	    playerAnimation["e_up"] = 	new $.gameQuery.Animation({
        	imageURL: "img/emperor.png", numberOfFrame: 2, delta: 50, rate: 250, type: $.gameQuery.ANIMATION_HORIZONTAL, offsetx:0, offsety:0
        	});
        playerAnimation["e_idle-n"] = 	new $.gameQuery.Animation({
        	imageURL: "img/emperor.png", numberOfFrame: 1, delta: 50, rate: 250, type: $.gameQuery.ANIMATION_HORIZONTAL, offsetx:0, offsety:0
        	});
	    playerAnimation["e_down"] = 	new $.gameQuery.Animation({
        	imageURL: "img/emperor.png", numberOfFrame: 2, delta: 50, rate: 250, type: $.gameQuery.ANIMATION_HORIZONTAL, offsetx:0, offsety:150
        	});
        playerAnimation["e_idle-s"] = 	new $.gameQuery.Animation({
        	imageURL: "img/emperor.png", numberOfFrame: 1, delta: 50, rate: 250, type: $.gameQuery.ANIMATION_HORIZONTAL, offsetx:0, offsety:150
        	});
        playerAnimation["e_die"] = 	new $.gameQuery.Animation({
        	imageURL: "img/emperor_die.png", numberOfFrame: 30, delta: 50, rate: 130, type: $.gameQuery.ANIMATION_HORIZONTAL | $.gameQuery.ANIMATION_CALLBACK, offsetx:0, offsety:0
        	});
        playerAnimation["e_winner"] = 	new $.gameQuery.Animation({
        	imageURL: "img/emperor_winner.png", numberOfFrame: 30, delta: 50, rate: 130, type: $.gameQuery.ANIMATION_HORIZONTAL | $.gameQuery.ANIMATION_CALLBACK, offsetx:0, offsety:0
        	});
        	
		playerAnimation["v_idle"] = 	new $.gameQuery.Animation({
        	imageURL: "img/vassal.png", numberOfFrame: 1, delta: 50, rate: 250, type: $.gameQuery.ANIMATION_HORIZONTAL, offsetx:0, offsety:75
        	});
	    playerAnimation["v_right"]      = new $.gameQuery.Animation({
        	imageURL: "img/vassal.png", numberOfFrame: 2, delta: 50, rate: 250, type: $.gameQuery.ANIMATION_HORIZONTAL, offsetx:0, offsety:75
        	});
        playerAnimation["v_idle-e"]      = new $.gameQuery.Animation({
        	imageURL: "img/vassal.png", numberOfFrame: 1, delta: 50, rate: 250, type: $.gameQuery.ANIMATION_HORIZONTAL, offsetx:0, offsety:75
        	});
	    playerAnimation["v_left"] =	new $.gameQuery.Animation({
        	imageURL: "img/vassal.png", numberOfFrame: 2, delta: 50, rate: 250, type: $.gameQuery.ANIMATION_HORIZONTAL, offsetx:0, offsety:225
        	});
        playerAnimation["v_idle-w"] =	new $.gameQuery.Animation({
        	imageURL: "img/vassal.png", numberOfFrame: 1, delta: 50, rate: 250, type: $.gameQuery.ANIMATION_HORIZONTAL, offsetx:0, offsety:225
        	});
	    playerAnimation["v_up"] = 	new $.gameQuery.Animation({
        	imageURL: "img/vassal.png", numberOfFrame: 2, delta: 50, rate: 250, type: $.gameQuery.ANIMATION_HORIZONTAL, offsetx:0, offsety:0
        	});
        playerAnimation["v_idle-n"] = 	new $.gameQuery.Animation({
        	imageURL: "img/vassal.png", numberOfFrame: 1, delta: 50, rate: 250, type: $.gameQuery.ANIMATION_HORIZONTAL, offsetx:0, offsety:0
        	});
	    playerAnimation["v_down"] = 	new $.gameQuery.Animation({
        	imageURL: "img/vassal.png", numberOfFrame: 2, delta: 50, rate: 250, type: $.gameQuery.ANIMATION_HORIZONTAL, offsetx:0, offsety:150
        	});
        playerAnimation["v_idle-s"] = 	new $.gameQuery.Animation({
        	imageURL: "img/vassal.png", numberOfFrame: 1, delta: 50, rate: 250, type: $.gameQuery.ANIMATION_HORIZONTAL, offsetx:0, offsety:150
        	});
        playerAnimation["v_die"] = 	new $.gameQuery.Animation({
        	imageURL: "img/vassal_die.png", numberOfFrame: 30, delta: 50, rate: 130, type: $.gameQuery.ANIMATION_HORIZONTAL | $.gameQuery.ANIMATION_CALLBACK, offsetx:0, offsety:0
        	});
        playerAnimation["v_winner"] = 	new $.gameQuery.Animation({
        	imageURL: "img/vassal_winner.png", numberOfFrame: 28, delta: 50, rate: 130, type: $.gameQuery.ANIMATION_HORIZONTAL | $.gameQuery.ANIMATION_CALLBACK, offsetx:0, offsety:0
        	});
        	
		playerAnimation["m_idle"] = 	new $.gameQuery.Animation({
        	imageURL: "img/mule.png", numberOfFrame: 1, delta: 50, rate: 250, type: $.gameQuery.ANIMATION_HORIZONTAL, offsetx:0, offsety:75
        	});
	    playerAnimation["m_right"]      = new $.gameQuery.Animation({
        	imageURL: "img/mule.png", numberOfFrame: 2, delta: 50, rate: 250, type: $.gameQuery.ANIMATION_HORIZONTAL, offsetx:0, offsety:75
        	});
        playerAnimation["m_idle-e"]      = new $.gameQuery.Animation({
        	imageURL: "img/mule.png", numberOfFrame: 1, delta: 50, rate: 250, type: $.gameQuery.ANIMATION_HORIZONTAL, offsetx:0, offsety:75
        	});
	    playerAnimation["m_left"] =	new $.gameQuery.Animation({
        	imageURL: "img/mule.png", numberOfFrame: 2, delta: 50, rate: 250, type: $.gameQuery.ANIMATION_HORIZONTAL, offsetx:0, offsety:225
        	});
        playerAnimation["m_idle-w"] =	new $.gameQuery.Animation({
        	imageURL: "img/mule.png", numberOfFrame: 1, delta: 50, rate: 250, type: $.gameQuery.ANIMATION_HORIZONTAL, offsetx:0, offsety:225
        	});
	    playerAnimation["m_up"] = 	new $.gameQuery.Animation({
        	imageURL: "img/mule.png", numberOfFrame: 2, delta: 50, rate: 250, type: $.gameQuery.ANIMATION_HORIZONTAL, offsetx:0, offsety:0
        	});
        playerAnimation["m_idle-n"] = 	new $.gameQuery.Animation({
        	imageURL: "img/mule.png", numberOfFrame: 1, delta: 50, rate: 250, type: $.gameQuery.ANIMATION_HORIZONTAL, offsetx:0, offsety:0
        	});
	    playerAnimation["m_down"] = 	new $.gameQuery.Animation({
        	imageURL: "img/mule.png", numberOfFrame: 2, delta: 50, rate: 250, type: $.gameQuery.ANIMATION_HORIZONTAL, offsetx:0, offsety:150
        	});
        playerAnimation["m_idle-s"] = 	new $.gameQuery.Animation({
        	imageURL: "img/mule.png", numberOfFrame: 1, delta: 50, rate: 250, type: $.gameQuery.ANIMATION_HORIZONTAL, offsetx:0, offsety:150
        	});
        playerAnimation["m_die"] = 	new $.gameQuery.Animation({
        	imageURL: "img/mule_die.png", numberOfFrame: 30, delta: 50, rate: 130, type: $.gameQuery.ANIMATION_HORIZONTAL | $.gameQuery.ANIMATION_CALLBACK, offsetx:0, offsety:0
        	});
        playerAnimation["m_winner"] = 	new $.gameQuery.Animation({
        	imageURL: "img/mule_winner.png", numberOfFrame: 30, delta: 50, rate: 130, type: $.gameQuery.ANIMATION_HORIZONTAL | $.gameQuery.ANIMATION_CALLBACK, offsetx:0, offsety:0
        	});
        	
	    bombAnimation["drop"] =	new $.gameQuery.Animation({
        	imageURL: "img/bomb_drop.png", numberOfFrame: 5, delta: 150, rate: 100, type: $.gameQuery.ANIMATION_HORIZONTAL | $.gameQuery.ANIMATION_CALLBACK, offsetx:0, offsety:0
        	});
	    bombAnimation["loop"] = new $.gameQuery.Animation({
        	imageURL: "img/bomb_loop.png", numberOfFrame: 4, delta: 150, rate: 100, type: $.gameQuery.ANIMATION_HORIZONTAL, offsetx:0, offsety:0
        	});
	    bombAnimation["explode"] =	new $.gameQuery.Animation({
        	imageURL: "img/bomb_explode.png", numberOfFrame: 12, delta: 150, rate: 100, type: $.gameQuery.ANIMATION_HORIZONTAL | $.gameQuery.ANIMATION_CALLBACK, offsetx:0, offsety:0
        	});
        bombSound["explode"] = new Audio("sounds/bomb_explode.mp3");
        bombSound["drop"] = new Audio("sounds/bomb_drop.mp3");
        bombSound["loop"] = new Audio("sounds/bomb_loop.mp3");
        playerSound["die"] = new Audio("sounds/player_die.mp3");
        gameSound["winner"] = new Audio("sounds/winner.mp3");
        
        
        // adding players
        console.log('players in init arena'+players);
        for(p in players){
            p.create();
        }
		
        $.playground().registerCallback(eventsManager, RATE);
	}
	
	if (!"WebSocket" in window) {
		alert("WebSockets are not supported by your Browser!");
	}
	
		
	var ws;
	
 	var send_stop = true;
 	
 	// player over
 	function anim_player_over(){
 	    $('#game_over h2').removeClass().addClass('loser').html('GAME OVER');
 	    $('#game_over').fadeIn();
 	}
 	
    $('#play_again').on('click',function(){
        player_over = false;
        ws.send('{"c":"J", "a":"'+avatar+'", "u":"'+username+'", "p":"'+player_id+'"}');
        write_log('p: '+player_id+' | CURRENT PLAYER JOIN AGAIN','green',2);
        $('#game_over').fadeOut();
    });
    
       

	
	
	function eventsManager(){
	
	    if(jQuery.gameQuery.keyTracker[32] && !player_over){ //this is bomb! (space) la bomba e' fuori dagli else if dei movimenti perche' devi poterla lasciare mentre ti muovi
			var message = {'c':'b','p':player_id};
			ws.send(JSON.stringify(message));
			write_log('send msg: '+JSON.stringify(message),'black',2);
			send_stop = true;
		}
	
		if((jQuery.gameQuery.keyTracker[65] || jQuery.gameQuery.keyTracker[37]) && !player_over){ //this is left! (a or arrow-left)
			var message = {'c':'w','p':player_id};
			ws.send(JSON.stringify(message));
			write_log('send msg: '+JSON.stringify(message),'black',2);
			send_stop = true;
    	}
		else if((jQuery.gameQuery.keyTracker[87] || jQuery.gameQuery.keyTracker[38]) && !player_over){ //this is up! (w or arrow-up)
			var message = {'c':'n','p':player_id};
			ws.send(JSON.stringify(message));
			write_log('send msg: '+JSON.stringify(message),'black',2);
			send_stop = true;
		}
    	else if((jQuery.gameQuery.keyTracker[68] || jQuery.gameQuery.keyTracker[39]) && !player_over){ //this is right! (d or arrow-right)
			var message = {'c':'e','p':player_id};
			ws.send(JSON.stringify(message));
			write_log('send msg: '+JSON.stringify(message),'black',2);
			send_stop = true;
		}
		else if((jQuery.gameQuery.keyTracker[83] || jQuery.gameQuery.keyTracker[40]) && !player_over){ //this is down! (s or arrow-down)
			var message = {'c':'s','p':player_id};
			ws.send(JSON.stringify(message));
			write_log('send msg: '+JSON.stringify(message),'black',2);
			send_stop = true;
		}
		else if(send_stop){
		    var message = {'c':'0','p':player_id};
		    ws.send(JSON.stringify(message));
		    write_log('send msg: '+JSON.stringify(message),'black',2);
		    send_stop = false;
		}
		
		while((msg_queue = events.pop()) != null){  //in events c'e' una lista di eventi e con 3 elementi: [0]=id_giocatore, [1]=x_giocatore, [2]=y_giocatore [3]=n,s,w,e direzione omino, [4]=n,s,w,e direzione precedente
		
	        var msg = msg_queue;
	        write_log('c: '+msg['c']+' - p: '+msg['p']+'/'+msg['a']+' | msg processed','green');  
            
			switch(msg['c']){  // controllo quale comando viene passato
			    case "m": // m=move (muovi il player_id 'p' alle coordinate x y con direzione d)
                    players[msg['p']].move(msg['d'], msg['o'], msg['x'], msg['y']);        
			    	break;
			    case "p": // p=add_player (aggiungo player_id 'p' alla posizione x y con direzione d)
                    new player = players['p'];
                    console.log('PLAYER: '+player);
                    if (player == undefined){
			    	    players[msg['p']] = new Player(msg['p'],msg['u'],msg['a'],msg['x'],msg['y']);
                        players[msg['p']].create();
                    }else if(player.dead){
                        player.reborn();
                        player.create();
                    }
	                break;
                case "k": // k=kill (rimuovi player_id 'p')
                    players[msg['p']].die();
        	        break;
        	    case "b": // b=bomb (disegna bombbody_id 'p' alle coordinate x y del player )
                    players[msg['p']].drop_bomb(msg['i'],msg['x'],msg['y']);
                    break;
                case "x": // x=explosion (esplode la bomba)
                    bombs[msg['i']].explode();
        	    	break;
        	    case "0": // 0=stop (omino p fermo in x y con direzione 0)
                    players[msg['p']].stop(msg['d']);
        	    	break;
        	    case "v": // v=vittoria (vince il player p)
			        player[msg['p']].win();
			    	break;
			    default:
			    	break;
			}
		}
	}
	

	
	$('.choose_player').on('click',function(){
      var username_input = $('#username_input').val();
      if(username_input == ''){
        $('#username_input').css('border', '5px red solid');
      }else{
        username = username_input;
	    //$('#startGame').html();
	    
	    avatar = $(this).data('avatar');
	    $('#select_player').fadeOut();
	    $('#playground').fadeIn();
	    $('#playground').playground({height: PG_H, width: PG_W, keyTracker: true})
	    
		$.playground().startGame(function(){
			ws = new WebSocket(SOCKET_ADDRESS);
			ws.onopen = function() {
			        ws.send('{"c":"j", "a":"'+avatar+'", "u":"'+username+'"}');   //c=comando  j=join (chiedo al server di entrare)  a=avatar e(mperor) v(assal) m(ule)
			};
			
			ws.onmessage = function(evt) {   //quando il websocket riceve un messaggio
			    var msg_in = jQuery.parseJSON(evt.data);
			    write_log('received msg: '+JSON.stringify(msg_in),'black',1);
				    switch(msg_in['c']){  // controllo quale comando viene passato
				        case "z": // z=benvenuto (il server ti ha accettato, ti passo p=player_id, x=tua_posiziona_x, y=tua_posizione_y, e=lista_nemici, b=lista di blocchi dell'arena) 
                            console.log('players prima: '+players);
			    	        players[msg_in['p']] = new Player(msg_in['p'],msg_in['u'],msg_in['a'],msg_in['x'],msg_in['y']);
				            players[msg_in['p']].set_player();
                            console.log('players dopo di me: '+players);
                            console.log('io'+players[msg_in['p']]);
				            $.playground().clearAll(true);
                            enemies = msg_in['e'];
                            for(i in enemies){
                                players[enemies[i][0]] = new Player([i][0],[i][4],[i][1],[i][2],[i][3]);
                            }
                            console.log('players dopo nemici: '+players);
				            init_arena();
				            $("#grid").html(arena(msg_in['b']));
				            break;
				        default: // tutti gli altri li accodi
				        	//events.push([msg['p'],msg['x'],msg['y'],msg['d'],msg['o']]);
				        	events.push(msg_in);
				        	break;
				    }
			};			        

			ws.onclose = function() {
                $.playground().clearAll(true);
				alert("Connection is closed..."); 
			};
		}); /*startgame*/
      }/*endif*/
	}); /*choose_player onclick*/
}); /*jQuery*/



