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
	
	var player_id = 0;
	var events = Array();
	
	
	
	/* log */
	
	function write_log(str, color){
	    if(!color){color = 'black';}
    	var d = new Date();
	    $("#log").prepend('<span style="color:'+color+'">'+d.getHours()+':'+d.getMinutes()+':'+d.getSeconds()+':'+d.getMilliseconds()+' '+str+'</span><br/>');
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
	$('#playground').playground({height: PG_H, width: PG_W, keyTracker: true})
	function init_arena(player_id,pos_x,pos_y,enemies){
		
		// inizializzo la griglia con la sprite  da usare
		$.playground().addSprite('grid',{height: PG_H, width: PG_W}).end();
		
		// imposto le animazioni da usare
		playerAnimation["idle"] = 	new $.gameQuery.Animation({
        	imageURL: "img/emperor.png", numberOfFrame: 1, delta: 50, rate: 250, type: $.gameQuery.ANIMATION_HORIZONTAL, offsetx:0, offsety:75
        	});
	    playerAnimation["right"]      = new $.gameQuery.Animation({
        	imageURL: "img/emperor.png", numberOfFrame: 2, delta: 50, rate: 250, type: $.gameQuery.ANIMATION_HORIZONTAL, offsetx:0, offsety:75
        	});
        playerAnimation["idle-e"]      = new $.gameQuery.Animation({
        	imageURL: "img/emperor.png", numberOfFrame: 1, delta: 50, rate: 250, type: $.gameQuery.ANIMATION_HORIZONTAL, offsetx:0, offsety:75
        	});
	    playerAnimation["left"] =	new $.gameQuery.Animation({
        	imageURL: "img/emperor.png", numberOfFrame: 2, delta: 50, rate: 250, type: $.gameQuery.ANIMATION_HORIZONTAL, offsetx:0, offsety:225
        	});
        playerAnimation["idle-w"] =	new $.gameQuery.Animation({
        	imageURL: "img/emperor.png", numberOfFrame: 1, delta: 50, rate: 250, type: $.gameQuery.ANIMATION_HORIZONTAL, offsetx:0, offsety:225
        	});
	    playerAnimation["up"] = 	new $.gameQuery.Animation({
        	imageURL: "img/emperor.png", numberOfFrame: 2, delta: 50, rate: 250, type: $.gameQuery.ANIMATION_HORIZONTAL, offsetx:0, offsety:0
        	});
        playerAnimation["idle-n"] = 	new $.gameQuery.Animation({
        	imageURL: "img/emperor.png", numberOfFrame: 1, delta: 50, rate: 250, type: $.gameQuery.ANIMATION_HORIZONTAL, offsetx:0, offsety:0
        	});
	    playerAnimation["down"] = 	new $.gameQuery.Animation({
        	imageURL: "img/emperor.png", numberOfFrame: 2, delta: 50, rate: 250, type: $.gameQuery.ANIMATION_HORIZONTAL, offsetx:0, offsety:150
        	});
        playerAnimation["idle-s"] = 	new $.gameQuery.Animation({
        	imageURL: "img/emperor.png", numberOfFrame: 1, delta: 50, rate: 250, type: $.gameQuery.ANIMATION_HORIZONTAL, offsetx:0, offsety:150
        	});
        playerAnimation["die"] = 	new $.gameQuery.Animation({
        	imageURL: "img/emperor_die.png", numberOfFrame: 30, delta: 50, rate: 130, type: $.gameQuery.ANIMATION_HORIZONTAL | $.gameQuery.ANIMATION_CALLBACK, offsetx:0, offsety:0
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
                .addSprite("playerBody_"+player_id,{animation: playerAnimation["idle"],
                      posx: 0, posy: 0, width: ACTOR_W, height: ACTOR_H});

        
        // aggiungo i nemici
        for(i in enemies){
        	$.playground().addGroup("player_"+enemies[i][0], {posx: enemies[i][1], posy: enemies[i][2],
                      width: ACTOR_W, height: ACTOR_H})
                  .addSprite("playerBody_"+enemies[i][0],{animation: playerAnimation["idle"],
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
			send_stop = true;
		}
	
		if(jQuery.gameQuery.keyTracker[65] && CAN_MOVE){ //this is left! (a)
			var message = {'c':'w','p':player_id};
			ws.send(JSON.stringify(message));
			send_stop = true;
    	}
    	else if(jQuery.gameQuery.keyTracker[68] && CAN_MOVE){ //this is right! (d)
			var message = {'c':'e','p':player_id};
			ws.send(JSON.stringify(message));
			send_stop = true;
		}
		else if(jQuery.gameQuery.keyTracker[87] && CAN_MOVE){ //this is up! (w)
			var message = {'c':'n','p':player_id};
			ws.send(JSON.stringify(message));
			send_stop = true;
		}
		else if(jQuery.gameQuery.keyTracker[83] && CAN_MOVE){ //this is down! (s)
			var message = {'c':'s','p':player_id};
			ws.send(JSON.stringify(message));
			send_stop = true;
		}
		else if(send_stop){
		    var message = {'c':'0','p':player_id};
		    ws.send(JSON.stringify(message));
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
				        write_log('p: '+msg['p']+' | d: '+msg['d']+" - o: "+msg['o']);
			            if(msg['d'] != msg['o']){   //se cambio direzione rispetto al frame precedente
			                write_log('p: '+msg['p']+' | cambio dir','orange');
                            switch(msg['d']){ //controllo la direzione nuova e imposto la nuova animation
		                        case "n": //north
                                    $("#playerBody_"+msg['p']).setAnimation(playerAnimation["up"]);
		                            break;
		                        case "s": //south
                                    $("#playerBody_"+msg['p']).setAnimation(playerAnimation["down"]);
		                            break;
		                        case "w": //west
                                    $("#playerBody_"+msg['p']).setAnimation(playerAnimation["left"]);
		                            break;
		                        case "e": //east
                                    $("#playerBody_"+msg['p']).setAnimation(playerAnimation["right"]);
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
			                          .addSprite("playerBody_"+msg['p'],{animation: playerAnimation["idle"],
		                                    posx: 0, posy: 0, width: ACTOR_W, height: ACTOR_H});
		                         //$("#player_"+msg['p']).html($("#player_"+msg['p']).html()+msg['p']);
		                         break;
                    case "k": // k=kill (rimuovi player_id 'p')
                        write_log('p: '+msg['p']+' | muoio','red');                        
                        if(msg['p']==player_id){
                            CAN_MOVE = false;
                        }
                        setTimeout(function(){  //aspetto 100 millisec perchè l'azione che arriva all'istante in cui metto CAN_MOVE sfugge al semaforo.
                                                //bisogna implementare un sistema migliore per sincronizzarli
                            playerSound["die"].play();
                            $("#playerBody_"+msg['p']).setAnimation(playerAnimation["die"], 
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
            	    	        write_log('p: '+msg['p']+' | rimossa la bomba '+'p: '+msg['p'],'red');                                 
            	    	   }
            	    	);
            	    	
            	    	break;
            	    case "0": // 0=stop (omino p fermo in x y con direzione 0)
            	        write_log('p: '+msg['p']+' | idle','blue');
            	        switch(msg['d']){  // controllo quale direzione viene passata
				            case "n":
                                $("#playerBody_"+msg['p']).setAnimation(playerAnimation["idle-n"]);
				                break;
				            case "e":
                                $("#playerBody_"+msg['p']).setAnimation(playerAnimation["idle-e"]);
				                break;
				            case "s":
                                $("#playerBody_"+msg['p']).setAnimation(playerAnimation["idle-s"]);
				                break;
				            case "w":
                                $("#playerBody_"+msg['p']).setAnimation(playerAnimation["idle-w"]);
				                break;
				            default:
                                $("#playerBody_"+msg['p']).setAnimation(playerAnimation["idle"]);
				                break;
				        }
            	    	break;
				    default:
				    	break;
				}
		}
	}
	

	
	$('#startGame').on('click',function(){
	    $('#startGame').html();
		$.playground().startGame(function(){
			ws = new WebSocket("wss://blastbeat.unbit.it/bombertab");
			//ws = new WebSocket("ws://192.168.2.1:8080");
			ws.onopen = function() {
			        ws.send('{"c":"j"}');   //c=comando  j=join (chiedo al server di entrare)
			};
			
			ws.onmessage = function(evt) {   //quando il websocket riceve un messaggio
			    var msg = jQuery.parseJSON(evt.data);
				    switch(msg['c']){  // controllo quale comando viene passato
				        case "z": // z=benvenuto (il server ti ha accettato, ti passo p=player_id, x=tua_posiziona_x, y=tua_posizione_y, e=lista_nemici, a=lista di blocchi dell'arena) 
				            player_id = msg['p'];
				            init_arena(player_id,msg['x'],msg['y'],msg['e']);
				            $("#grid").html(arena(msg['a']));
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



