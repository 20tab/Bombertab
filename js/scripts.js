jQuery(function(){
	
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
	var player_id = 0;
	var events = Array();
	
	
	
	/* log */
	
	var last_log = [new Date(),new Date(),new Date()];
	function write_log(str, color, table){
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
	
	function init_arena(player_id,avatar,pos_x,pos_y,enemies){
		
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
        
               
        
		$.playground().addGroup("actors", {width: PG_W, height: PG_H}).end()
                .addGroup("player_"+player_id, {posx: pos_x, posy: pos_y,
                      width: ACTOR_W, height: ACTOR_H})
                .addSprite("playerBody_"+player_id,{animation: playerAnimation[avatar+"_idle"],
                      posx: 0, posy: 0, width: ACTOR_W, height: ACTOR_H});

        
        // aggiungo i nemici
        for(i in enemies){
        	$.playground().addGroup("player_"+enemies[i][0], {posx: enemies[i][2], posy: enemies[i][3],
                      width: ACTOR_W, height: ACTOR_H})
                  .addSprite("playerBody_"+enemies[i][0],{animation: playerAnimation[enemies[i][1]+"_idle"],
                      posx: 0, posy: 0, width: ACTOR_W, height: ACTOR_H});
        }
		
        $.playground().registerCallback(eventsManager, RATE);
        
	}
	
	if (!"WebSocket" in window) {
		alert("WebSockets are not supported by your Browser!");
	}
	
	var ws;
	
 	
 	var send_stop = true;
 	var CAN_MOVE = true
	
	function eventsManager(){
	
	    if(jQuery.gameQuery.keyTracker[32] && CAN_MOVE){ //this is bomb! (space) la bomba e' fuori dagli else if dei movimenti perche' devi poterla lasciare mentre ti muovi
			var message = {'c':'b','p':player_id};
			ws.send(JSON.stringify(message));
			write_log('send msg: '+JSON.stringify(message),'black',2);
			send_stop = true;
		}
	
		if(jQuery.gameQuery.keyTracker[65] && CAN_MOVE){ //this is left! (a)
			var message = {'c':'w','p':player_id};
			ws.send(JSON.stringify(message));
			write_log('send msg: '+JSON.stringify(message),'black',2);
			send_stop = true;
    	}
    	else if(jQuery.gameQuery.keyTracker[68] && CAN_MOVE){ //this is right! (d)
			var message = {'c':'e','p':player_id};
			ws.send(JSON.stringify(message));
			write_log('send msg: '+JSON.stringify(message),'black',2);
			send_stop = true;
		}
		else if(jQuery.gameQuery.keyTracker[87] && CAN_MOVE){ //this is up! (w)
			var message = {'c':'n','p':player_id};
			ws.send(JSON.stringify(message));
			write_log('send msg: '+JSON.stringify(message),'black',2);
			send_stop = true;
		}
		else if(jQuery.gameQuery.keyTracker[83] && CAN_MOVE){ //this is down! (s)
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
		    //alert('mandato STOP da parte di '+player_id);
		}
		
		while((msg_queue = events.pop()) != null){  //in events c'e' una lista di eventi e con 3 elementi: [0]=id_giocatore, [1]=x_giocatore, [2]=y_giocatore [3]=n,s,w,e direzione omino, [4]=n,s,w,e direzione precedente
		
		        var msg = msg_queue;
                
				switch(msg['c']){  // controllo quale comando viene passato
				    /*case "z": // z=benvenuto (il server ti ha accettato, ti passo p=player_id, x=tua_posiziona_x, y=tua_posizione_y, e=lista_nemici, a=lista di blocchi dell'arena) 
				        player_id = msg['p'];
				        init_arena(player_id,msg['x'],msg['y'],msg['e']);
				        $("#grid").html(arena(msg['a']));
				        break;*/
				    case "m": // m=move (muovi il player_id 'p' alle coordinate x y con direzione d)
				        write_log('p: '+msg['p']+'/'+msg['a']+' | d: '+msg['d']+" - o: "+msg['o']);
			            if(msg['d'] != msg['o']){   //se cambio direzione rispetto al frame precedente
			                write_log('p: '+msg['p']+'/'+msg['a']+' | cambio dir','orange');
                            switch(msg['d']){ //controllo la direzione nuova e imposto la nuova animation
		                        case "n": //north
                                    $("#playerBody_"+msg['p']).setAnimation(playerAnimation[msg['a']+"_up"]);
		                            break;
		                        case "s": //south
                                    $("#playerBody_"+msg['p']).setAnimation(playerAnimation[msg['a']+"_down"]);
		                            break;
		                        case "w": //west
                                    $("#playerBody_"+msg['p']).setAnimation(playerAnimation[msg['a']+"_left"]);
		                            break;
		                        case "e": //east
                                    $("#playerBody_"+msg['p']).setAnimation(playerAnimation[msg['a']+"_right"]);
		                            break;
		                    }
                        }
                        //in ogni caso sposto il player alle nuove coordinate
			            $("#player_"+msg['p']).css("left", msg['x']+"px");
			            $("#player_"+msg['p']).css("top", msg['y']+"px");

				    	break;
				    	
				    case "p": // p=add_player (aggiungo player_id 'p' alla posizione x y con direzione d)
				    	$.playground().addGroup("player_"+msg['p'], {posx: msg['x'], posy: msg['y'],
			                                width: ACTOR_W, height: ACTOR_H})
			                          .addSprite("playerBody_"+msg['p'],{animation: playerAnimation[msg['a']+"_idle"],
		                                    posx: 0, posy: 0, width: ACTOR_W, height: ACTOR_H});
		                         //$("#player_"+msg['p']).html($("#player_"+msg['p']).html()+msg['p']);
		                         break;
                    case "k": // k=kill (rimuovi player_id 'p')
                        write_log('p: '+msg['p']+'/'+msg['a']+' | muoio','red');                        
                        if(msg['p']==player_id){
                            CAN_MOVE = false;
                        }
                        setTimeout(function(){  //aspetto 100 millisec perchè l'azione che arriva all'istante in cui metto CAN_MOVE sfugge al semaforo.
                                                //bisogna implementare un sistema migliore per sincronizzarli
                            playerSound["die"].play();
                            $("#playerBody_"+msg['p']).setAnimation(playerAnimation[msg['a']+"_die"], 
        	    	            function(){
        	    	                write_log('p: '+msg['p']+' | morendo','red');
                                    $("#player_"+msg['p']).remove();
                                    write_log('p: '+msg['p']+' | morto','red');
                                }
                            );
                        }, 200);
            	        break;
            	    case "b": // b=bomb (disegna bombbody_id 'p' alle coordinate x y del player )
            	        write_log('p: '+msg['p']+' | lascio la bomba '+'p: '+msg['p'],'red');
            	        if($("#bomb_"+msg['p']).get()){
            	            bombSound["drop"].play();
                	    	$.playground().addGroup("bomb_"+msg['p'], {posx: msg['x'], posy: msg['y'],
	                                            width: BOMB_W, height: BOMB_H})
	                                        .addSprite("bombBody_"+msg['p'],{animation: bombAnimation["drop"],
                                                posx: -50, posy: -50, width: BOMB_W, height: BOMB_H, callback: function(){
                                    bombSound["loop"].play();
                                    $("#bombBody_"+msg['p']).setAnimation(bombAnimation["loop"]);
                                }});	              
                         }        
                         break;
                    case "x": // x=explosion (esplode la bomba)
                        write_log('p: '+msg['p']+' | esplode la bomba '+'p: '+msg['p'],'red');
                        bombSound["loop"].pause();
                        bombSound["explode"].play();       
            	    	$("#bombBody_"+msg['p']).setAnimation(bombAnimation["explode"],
            	    	    function(){
            	    	        write_log('p: '+msg['p']+' | rimuovendo la bomba '+'p: '+msg['p'],'red');
            	    	        $("#bomb_"+msg['p']).remove();
            	    	        var message = {'c':'p','p':msg['p']};
                    			ws.send(JSON.stringify(message));
                    			write_log('send msg: '+JSON.stringify(message),'black',2);
            	    	        write_log('p: '+msg['p']+' | rimossa la bomba '+'p: '+msg['p'],'red');                                 
            	    	   }
            	    	);
            	    	
            	    	break;
            	    case "0": // 0=stop (omino p fermo in x y con direzione 0)
            	        write_log('p: '+msg['p']+'/'+msg['a']+' | idle','blue');
            	        switch(msg['d']){  // controllo quale direzione viene passata
				            case "n":
                                $("#playerBody_"+msg['p']).setAnimation(playerAnimation[msg['a']+"_idle-n"]);
				                break;
				            case "e":
                                $("#playerBody_"+msg['p']).setAnimation(playerAnimation[msg['a']+"_idle-e"]);
				                break;
				            case "s":
                                $("#playerBody_"+msg['p']).setAnimation(playerAnimation[msg['a']+"_idle-s"]);
				                break;
				            case "w":
                                $("#playerBody_"+msg['p']).setAnimation(playerAnimation[msg['a']+"_idle-w"]);
				                break;
				            default:
                                $("#playerBody_"+msg['p']).setAnimation(playerAnimation[msg['a']+"_idle"]);
				                break;
				        }
            	    	break;
				    default:
				    	break;
				}
		}
	}
	

	
	$('.choose_player').on('click',function(){
	    //$('#startGame').html();
	    
	    avatar = $(this).data('avatar');
	    $('#select_player').fadeOut();
	    $('#playground').fadeIn();
	    $('#playground').playground({height: PG_H, width: PG_W, keyTracker: true})
	    
		$.playground().startGame(function(){
			ws = new WebSocket("wss://blastbeat.unbit.it/bombertab");
			//ws = new WebSocket("ws://192.168.2.1:8080");
			ws.onopen = function() {
			        ws.send('{"c":"j", "a":"'+avatar+'"}');   //c=comando  j=join (chiedo al server di entrare)  a=avatar e(mperor) v(assal) m(ule)
			};
			
			ws.onmessage = function(evt) {   //quando il websocket riceve un messaggio
			    var msg = jQuery.parseJSON(evt.data);
			    write_log('received msg: '+JSON.stringify(msg),'black',1);
				    switch(msg['c']){  // controllo quale comando viene passato
				        case "z": // z=benvenuto (il server ti ha accettato, ti passo p=player_id, x=tua_posiziona_x, y=tua_posizione_y, e=lista_nemici, b=lista di blocchi dell'arena) 
				            player_id = msg['p'];
				            avatar = msg['a'];
				            init_arena(player_id,msg['a'],msg['x'],msg['y'],msg['e']);
				            $("#grid").html(arena(msg['b']));
				            break;
				        default: // tutti gli altri li accodi
				        	//events.push([msg['p'],msg['x'],msg['y'],msg['d'],msg['o']]);
				        	events.push(msg);
				        	break;
				    }
			};			        

			ws.onclose = function() {
				alert("Connection is closed..."); 
			};
			
		});
	});
	
});



